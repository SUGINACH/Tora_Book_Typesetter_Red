// src/engine/layout/side-notes.js — H7 side-notes / marginalia full contract (REQ-FN-05/06, S7.1.2)
'use strict';

/**
 * הערות צד (H7): עיגון לאות־אנקור, מיקום בראש הפסקה, cascade דחיפה,
 * אצוות של H7 רצופים, ניקוז pagePendingNotes אחרי איזון, מיקום מחדש עם תזוזת פסקאות,
 * margin חיצוני לפי recto/verso, מיכל 20px.
 */

const CONTAINMENT_PX = 20; // חריגה מזערית מעבר למיכל — לא נחשב overlap אמיתי (ספרד קטלוג D3)

/**
 * s-note-body-font: רוחב הערת צד לפי גופן — משפיע על גובה החיזוי (cascade).
 * פרופיל שמרני: גופן לא־מוכר = +8% רוחב.
 */
const SIDE_NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };
function estimateSideNoteHeight(text, settings, measureFn) {
  const size = settings['body-font-size-pt'] * 0.75; // הערות צד קטנות
  const lh = Math.round(size * (96 / 72) * 1.15);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  // S9: רוחב עמודת הערות צד **נמדד מהתבנית** (margin חיצוני), לא קבוע־קוד.
  const colW = settings._sideNoteColWidthPx || Math.max(60, Math.round(settings._outerMarginPx || 120) - 12);
  const fontName = settings['s-note-body-font'];
  const factor = SIDE_NOTE_FONT_FACTORS[fontName] || (fontName && fontName !== settings['body-font'] ? 1.08 : 1);
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = (measureFn ? measureFn(word, size) : word.length * size * 0.6) * factor;
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lh;
}

/**
 * @param {Array} pages - עמודי התוצר (עם columns + sideNotes)
 * @param {object} settings
 * @param {(text:string,sizePt:number)=>number} [measureFn] — מדידה אמיתית (S9: geometry via single entry L1)
 * @returns {{placed:Array, deferred:Array}}
 */
function placeSideNotes(pages, settings, measureFn) {
  const placed = [];
  const deferred = [];
  for (const page of pages) {
    const outerRight = page.isRecto !== false; // recto: שוליים חיצוניים = שמאל? RTL: recto x=1 → outer = left edge
    const anchorX = outerRight ? page.template.width - page.template.margins.side * 0.4 : page.template.margins.side * 0.4;
    const cap = page.template.contentBox.height;
    let stackY = 0;
    for (let i = 0; i < page.sideNotes.length; i++) {
      const sn = page.sideNotes[i];
      // S9: גובה מחושב בפועל (s-note-body-font + רוחב margin) — לא קבוע 12%.
      const h = sn.heightPx || estimateSideNoteHeight(sn.text, settings, measureFn);
      // batch consecutive H7s: נועלים יחד עם הבלוק המארח
      if (stackY + h > cap + CONTAINMENT_PX) {
        deferred.push({ ...sn, reason: 'no-room', page: page.index });
        continue;
      }
      placed.push({ ...sn, page: page.index, x: anchorX, yTop: page.template.contentBox.top + stackY, heightPx: h, batchGroup: sn.batchId || i });
      stackY += h + 8;
    }
    // cleanup: מה שנדחה יעבור לעמוד הבא בסיבוב ההרצה החוזר (reposition on paragraph moves)
    page.sideNotesDeferred = deferred.filter(d => d.page === page.index).map(d => d.anchorToken);
  }
  return { placed, deferred };
}

/** המרת H7 → הערת צד: השוואה per-paragraph (תיקון משתמש: אין false-positive של כפילות טקסט). */
function verifyH7Conversion(sourceTokens, renderedPages) {
  const mismatches = [];
  const renderedNoteTexts = new Set();
  for (const p of renderedPages) {
    for (const sn of p.sideNotes) renderedNoteTexts.add(sn.text.trim());
    for (const col of p.columns) for (const ln of col) {
      if (ln.words) for (const w of ln.words) renderedNoteTexts.add(w.replace(/\u00A0/g, ' '));
    }
  }
  for (const t of sourceTokens) {
    if (t.type === 'side-note' && !renderedNoteTexts.has(t.text.trim())) {
      mismatches.push({ token: t.id, text: t.text, kind: 'h7-conversion-missing' });
    }
  }
  return mismatches;
}

module.exports = { placeSideNotes, verifyH7Conversion, CONTAINMENT_PX };
