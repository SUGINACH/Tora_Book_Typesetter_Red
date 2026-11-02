// src/engine/decoration/folio.js — Page numbering: Hebrew letters, frames, positions, initial value (REQ-HDR-03/04)
'use strict';

const UNITS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUND = ['', 'ק', 'ר', 'ש', 'ת', 'תר', 'תש', 'תת', 'תתק'];

/**
 * מספר עברי (D-37):
 *  - אות בודדת ⇒ אות + גרש (׳): א׳=1, כ׳=20, ת׳=400.
 *  - שתי אותיות ומעלה ⇒ גרשיים (״) לפני האות האחרונה: ט״ו=15, ט״ז=16, כ״א=21, תש״ב=702, תשמ״ב=742.
 *  - 15/16 ⇒ ט״ו/ט״ז (לא יה+וו).
 *  - אלפים: אלפים + ׳ ואז שארית המספר: 5702 ⇒ ה׳תש״ב; 1000 ⇒ א׳; 1001 ⇒ א׳א.
 *  תיקון P1-8: גרשיים עבריים ״ (U+05F4) במקום מרכאות לטיניות "; טיפול באלפים.
 */
function toHebrewNumber(n) {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let thousands = '';
  let rest = n;
  if (n >= 1000) {
    // סימן אלפים: גרש אחרי חלק האלפים — אלא אם כבר ישנו (5 ⇒ ה׳ כבר עם גרש; 12 ⇒ י״ב עם גרשיים)
    let t = toHebrewNumber(Math.floor(n / 1000));
    if (!/[\u05F3\u05F4]$/.test(t)) t += '\u05F3';
    thousands = t;
    rest = n % 1000;
    if (rest === 0) return thousands;
  }
  let out = '';
  while (rest >= 800) { out += 'ת'; rest -= 400; } // 800+=ת"ת
  if (rest >= 400) { out += 'ת'; rest -= 400; }
  if (rest >= 100) { out += HUND[Math.floor(rest / 100)]; rest %= 100; }
  if (rest === 15) { out += 'טו'; return finish(thousands, out); }
  if (rest === 16) { out += 'טז'; return finish(thousands, out); }
  const tens = Math.floor(rest / 10) * 10, unit = rest % 10;
  if (tens && unit) out += TENS[tens / 10] + UNITS[unit];
  else out += TENS[tens / 10] + UNITS[unit];
  return finish(thousands, out);
}

/** הרכבה סופית: גרש/גרשיים לפי מספר האותיות + צירוף אלפים.
 *  שארית של אות בודדת אחרי סימן אלפים (1001 ⇒ א׳א) לא מקבלת גרש משלה —
 *  סימן האלפים כבר מסמן את המספר כולו (D-37). */
function finish(thousands, letters) {
  let body = letters;
  if (thousands && body.length === 1) {
    // א׳א (1001), ה׳ב (5002) — אות שארית בודדת בלי גרש נוסף
  } else if (body.length === 1) {
    body = body + '\u05F3';            // אות בודדת ⇒ גרש
  } else if (body.length >= 2) {
    body = body.slice(0, -1) + '\u05F4' + body.slice(-1); // גרשיים לפני האות האחרונה
  }
  return thousands ? thousands + body : body;
}

function formatPageNumber(value, settings) {
  switch (settings['page-num-format']) {
    case 'decimal': return String(value);
    case 'daf-hebrew': return `דף ${toHebrewNumber(value)}`;
    default: return toHebrewNumber(value);
  }
}

function frameNumber(text, frame) {
  switch (frame) {
    case 'circle': case 'parenthesis': return `(${text})`;
    case 'square': return `[${text}]`;
    case 'floral': return `❦ ${text} ❦`;
    case 'diamond': return `◇ ${text} ◇`;
    default: return text;
  }
}

/**
 * הקצאת מספרים לפי כללי count/show per type (shaar/toc/endnotes checkboxes).
 * **D-36 (תיקון P1-8):** עמודי פתיחה (פרק/סימן, chapterOpening) — נספרים אך לא
 * מציגים גיליון (מוסכמת ספרים: עמודי שער אינם ממוספרים לעין).
 * עמודי הערות־סיום נספרים רק אם count-endnote-pages=true (ברירת מחדל: לא).
 * @param {Array} pages - [{type, template:{counts, numbered}, chapterOpening}]
 */
function assignNumbers(pages, settings) {
  let v = settings['page-num-initial-value'] || 1;
  return pages.map(p => {
    const tpl = p.template;
    let counted = !!tpl.counts;
    if (p.type.startsWith('shaar')) counted = counted && settings['count-shaar-pages'];
    if (p.type.startsWith('toc')) counted = counted && settings['count-toc-pages'];
    if (p.type === 'endnotes') counted = counted && (settings['count-endnote-pages'] === true);
    if (!counted) return { page: null, display: '', shown: false };
    const cur = v++;
    // D-36: פתיחת פרק/סימן — נספר, לא מוצג; עמודי הערות לא מציגים כותרת עליונה ממילא
    const suppressDisplay = p.chapterOpening === true;
    return {
      page: cur,
      display: frameNumber(formatPageNumber(cur, settings), settings['page-num-frame']),
      shown: settings['page-num-position'] !== 'none' && !suppressDisplay
    };
  });
}

module.exports = { toHebrewNumber, formatPageNumber, frameNumber, assignNumbers };
