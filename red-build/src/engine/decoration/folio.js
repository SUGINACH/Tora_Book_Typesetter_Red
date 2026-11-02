// src/engine/decoration/folio.js — Page numbering: Hebrew letters, frames, positions, initial value (REQ-HDR-03/04)
'use strict';

const UNITS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק'];
const HUND = ['', 'ק', 'ר', 'ש', 'ת', 'תר', 'תק', 'תש', 'תת', 'תתק'];

/**
 * מספר עברי בספרות תורנית: 15→ט"ו, 16→ט"ז, 11–27 ללא יוד+וו; גרשיים במילואים.
 */
function toHebrewNumber(n) {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let rest = n, out = '';
  while (rest >= 800) { out += 'ת'; rest -= 400; } // ת=400; 800+=ת"ת
  if (rest >= 400) { out += 'ת'; rest -= 400; }
  if (rest >= 100) { out += HUND[Math.floor(rest / 100)]; rest %= 100; }
  if (rest === 15) { out += 'ט"ו'; return fixGersh(out); }
  if (rest === 16) { out += 'ט"ז'; return fixGersh(out); }
  const tens = Math.floor(rest / 10) * 10, unit = rest % 10;
  if (tens && unit) out += TENS[tens / 10] + '"' + UNITS[unit];
  else out += TENS[tens / 10] + UNITS[unit];
  return fixGersh(out);
}

function fixGersh(s) {
  // סיום בגרש בלבד אם יש אות יחידה >10 בלי זוג
  return s.replace(/([א-ת])\u05F4$/, '$1\u05F3').replace(/([^"])\u05F4/g, '$1');
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
 * הקצאת מספרים לפי כללי count/show per type (shaar/toc checkboxes).
 * @param {Array} pages - [{type, template:{counts, numbered}}]
 */
function assignNumbers(pages, settings) {
  let v = settings['page-num-initial-value'] || 1;
  return pages.map(p => {
    const tpl = p.template;
    let counted = !!tpl.counts;
    if (p.type.startsWith('shaar')) counted = counted && settings['count-shaar-pages'];
    if (p.type.startsWith('toc')) counted = counted && settings['count-toc-pages'];
    if (!counted) return { page: null, display: '', shown: false };
    const cur = v++;
    return { page: cur, display: frameNumber(formatPageNumber(cur, settings), settings['page-num-frame']), shown: settings['page-num-position'] !== 'none' };
  });
}

module.exports = { toHebrewNumber, formatPageNumber, frameNumber, assignNumbers };
