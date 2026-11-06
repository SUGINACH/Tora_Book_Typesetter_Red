// src/engine/layout/endnote-pages.js — Endnote pagination engine (REQ-FN-03/04, S7.1.1)
'use strict';

const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { markerFor } = require('../notes/markers');

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font). */
const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

/**
 * בניית עמודי "הערות" / "…(המשך)" בסוף כל חלק:
 * - איפוס מונים per-part (counter reset policy; continuous ⇒ מונה כללי);
 * - כותרת: הוראת כותרת־מחלקה (D-40) אם ניתנה, אחרת endnote-title-text;
 * - 1/2 טורים לפי endnote-columns;
 * - f-note-body-font משפיע על מדידת רוחב מילה בגוף ההערה;
 * - סמן: markerFor לפי footnote-marker-style — **אותו מקור סמכות like the body**
 *   (בעבר היו שלושה ממירים שונים — אי־עקביות מספור, P1-3).
 *
 * **S5.2 (תיקון 7 — P-3, חצי קיבולת + כותרת לא-מתקצבת):** בעבר ה-usedY טיפל
 * בעמוד כולו כטור אחד גם כשendnote-columns=2 — הטור השני לא מולא מעולם
 * (חצי קיבולת לעמוד), וגובה כותרת העמוד לא נוכה מהתקציב. כעת:
 *  - הקיבולת נגזרת מתבנית PT-07 עצמה (contentBox.height; אין כותרת עליונה
 *    בעמודי הערות — הערך שהוזרם בעבר מתבנית REGULAR היה חסר 30px של
 *    הכותרת העליונה של עמודי גוף);
 *  - גובה הכותרת מתקצב פעם אחת לעמוד — כפס עליון חוצה־טורים (שני הטורים
 *    מתחילים מתחתיו), בדיוק כמו ה-spanning band של הגוף (FWD-1);
 *  - ההערות ממלאות טור 1 ואז טור 2 (מירור של זרימת הטורים ב-DP), ורק אז
 *    נפתח עמוד המשך. הערה היא יחידה אטומית — לא נחתכת בין טורים (המקביל
 *    ל-minFirst/minLast=2 של המרזב אינו חל: אין "שורה בודדת" ברמת ההערה);
 *  - התקדמות מובטחת: הערה גבוהה מהטור נשארת לבדה בטור/עמוד משלה (כמו
 *    מילה רחבה מהטור בשבירת השורות) — אין לולאה ואין גניזה (BRZ-15).
 *
 * **S5.2 (תיקון 8 — רוחב הטור מהגיאומטריה):** _endnoteColWidthPx הוא כעת
 * רוחב טור בודד מתבנית PT-07 (ה-pipeline מזרים) ונצרך ישירות במצב שני טורים;
 * במצב טור-אחד הריווח ברוחב תיבת התוכן המלא של התבנית (רשימה חד-טורית
 * ברוחב מלא — כמו שמרונדר בפועל). בעבר חולק ערך "סכום טורים+מרזב" ב-2.
 *
 * @param {Array} endnotes - [{text, part, num?, marker?, fromInline?, noteIndex?}]
 * @param {object} settings - כולל _endnoteColWidthPx, _endnoteTitleByPart (Map part→title);
 *   _endnoteColCapPx נשמר כ-fallback בלבד (קיבולת האמת מהתבנית).
 */
function buildEndnotePages(endnotes, settings, measure, lineHeightPx, hooks = {}) {
  const eventLog = hooks.eventLog || null;
  const ledger = hooks.ledger || null;
  if (!settings['endnotes-enabled'] || !endnotes.length) return [];

  const byPart = new Map();
  const order = [];
  for (const n of endnotes) {
    const part = n.part || 1;
    if (!byPart.has(part)) { byPart.set(part, []); order.push(part); }
    byPart.get(part).push(n);
  }
  order.sort((a, b) => a - b);

  // מדיניות איפוס: continuous ⇒ מונה כללי; part/section/page ⇒ per-part (D-41)
  const continuous = settings['footnote-reset-policy'] === 'continuous';
  let globalSeq = 0;
  const perPartSeq = new Map();

  const style = settings['footnote-marker-style'];
  const cols = settings['endnote-columns'] === 2 ? 2 : 1;

  // **S5.2 (P-3):** קיבולת ורוחב מתבנית PT-07 — מקור האמת הגיאומטרי של עמודי ההערות.
  const enTpl = buildPageTemplate(PAGE_TYPES.ENDNOTES, settings, true);
  const cap = enTpl.contentBox.height > 0
    ? enTpl.contentBox.height
    : (settings._endnoteColCapPx || Number.POSITIVE_INFINITY); // fallback הגנתי בלבד
  const fullW = enTpl.columns.length
    ? Math.max(...enTpl.columns.map(c => c.x + c.w)) - Math.min(...enTpl.columns.map(c => c.x))
    : (settings._endnoteColWidthPx || 300);
  // רוחב הטור לריווח: 2 טורים ⇒ רוחב טור התבנית; טור אחד ⇒ רוחב מלא.
  const colW = cols === 2
    ? (settings._endnoteColWidthPx || enTpl.columns[0].w || 300)
    : fullW;
  const fontFactor = NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1;

  /**
   * גובה כותרת העמוד (`.endnote-title`: h2 בגודל 1.2em עם שולי 8px) —
   * פס חוצה־טורים שנצרך פעם אחת בכל עמוד שמציג כותרת (כולל עמודי המשך —
   * כולם מציגים כותרת: הבסיס או "בסיס (המשך)").
   */
  const titleBandPx = estimateTitleHeight(settings, lineHeightPx);

  const pages = [];
  for (const part of order) {
    const notes = byPart.get(part);
    const titleBase = (settings._endnoteTitleByPart && settings._endnoteTitleByPart.get(part))
      || settings['endnote-title-text'] || 'הערות';
    let pageIndex = 0;
    let page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, false), cols);
    page.titleBandPx = titleBandPx; // הטורים מתחילים מתחת לפס הכותרת
    let colIdx = 0;                 // טור נוכחי (0..cols-1) — מילוי 1 ואז 2
    let usedY = titleBandPx;        // גובה תפוס בטור הנוכחי (מתחת לפס)
    for (let ni = 0; ni < notes.length; ni++) {
      const n = notes[ni];
      // סמן: מהגוף (inline-refs — marker שהוקצה בpipeline) או לפי מספר המקור/מיקום
      let marker = n.marker;
      if (!marker) {
        if (continuous) { globalSeq++; marker = markerFor(globalSeq, style); }
        else {
          const s = (perPartSeq.get(part) || 0) + 1;
          perPartSeq.set(part, s);
          marker = markerFor(n.num != null ? n.num : s, style);
        }
      }
      const h = estimateNoteHeight(n.text, settings, measure, lineHeightPx, colW, fontFactor);
      // אין מקום בטור הנוכחי (והוא אינו ריק) — התקדמות לטור הבא / לעמוד הבא.
      // טור "ריק" (usedY === titleBandPx) מקבל את ההערה תמיד — התקדמות מובטחת
      // גם להערה גבוהה מהקיבולת (נותרת לבדה, לא נגנזת).
      if (usedY > page.titleBandPx && usedY + h > cap) {
        if (colIdx < cols - 1) {
          colIdx++;
          usedY = page.titleBandPx; // גם הטור השני מתחיל מתחת לפס הכותרת
        } else {
          pages.push(page);
          pageIndex++;
          page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, true), cols);
          page.titleBandPx = titleBandPx;
          colIdx = 0;
          usedY = titleBandPx;
        }
      }
      const note = { ...n, marker, heightPx: h, colIdx };
      page.notes.push(note);          // רשימה שטוחה בסדר קריאה (צרכנים: רנדר/חשבונאות)
      page.columns[colIdx].push(note); // מיקום מפורש בטור — מודל DP תואם גוף
      usedY += h;
    }
    if (page.notes.length) pages.push(page);
  }

  if (eventLog) eventLog.emit('notes-budget', 'endnote-pages-built', { pages: pages.length, parts: order.length, cols });
  if (ledger && pages.length === 0 && endnotes.length) {
    const rec = ledger.create('endnote-pagination', 'endnotes', null, { notes: endnotes.length, pages: 0 }, 'notes-budget');
    ledger.transition(rec.issue_id, 'persists', 'notes-budget', 'notes exist but no pages built');
  }
  return pages;
}

function mkPage(type, part, idx, heading, cols) {
  return {
    type, part, subIndex: idx, heading, notes: [],
    columns: Array.from({ length: cols }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [],
    balanceInfo: null, fnReservedHeightPx: 0,
    titleBandPx: 0,
    chapterOpening: false,
    isEndnotes: true
  };
}

function title(settings, base, isContinuation) {
  return isContinuation ? `${base} (המשך)` : base;
}

/** גובה כותרת עמוד ההערות — h2 1.2em + שולי אנכיים 16px (html-export .endnote-title). */
function estimateTitleHeight(settings, lineHeightPx) {
  const size = settings['body-font-size-pt'] * 1.2;
  return lineHeightPx(size) + 16;
}

/** גובה הערה בעמודי ההערות — כולל פקטור גופן ורוחב טור אפקטיבי. */
function estimateNoteHeight(text, settings, measure, lineHeightPx, colW, fontFactor = 1) {
  const size = settings['body-font-size-pt'] * 0.8;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  // **S6.0 (R3-C3):** רווחים בין מילים נכללים באומדן — כמו wrapNoteTokens
  // שמצייר את ההערה (בלי זה כל הערה גובלת-שבירה נמדדה שורה פחות וחפפה
  // את עמודתה בטור/בעמוד — 21.7% מההערות בדגימת 230).
  const spaceW = measure(' ', size) * fontFactor;
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = measure(word, size) * fontFactor;
    const addW = (w > 0 ? spaceW : 0) + ww;
    if (w + addW > colW && w > 0) { lines++; w = ww; } else w += addW;
  }
  return lines * lineHeightPx(size);
}

module.exports = { buildEndnotePages, estimateNoteHeight, estimateTitleHeight, NOTE_FONT_FACTORS };
