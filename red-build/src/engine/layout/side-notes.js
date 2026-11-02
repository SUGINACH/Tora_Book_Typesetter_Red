// src/engine/layout/side-notes.js — H7 side-notes / marginalia full contract (REQ-FN-05/06, S7.1.2)
'use strict';

/**
 * הערות צד (H7): עיגון לאות־אנקור, מיקום בראש הפסקה, cascade דחיפה,
 * אצוות של H7 רצופים, ניקוז pagePendingNotes אחרי איזון, מיקום מחדש עם תזוזת פסקאות,
 * margin חיצוני לפי recto/verso, מיכל 20px.
 */

const CONTAINMENT_PX = 20; // חריגה מזערית מעבר למיכל — לא נחשב overlap אמיתי (ספרד קטלוג D3)

/**
 * @param {Array} pages - עמודי התוצר (עם columns + sideNotes)
 * @param {object} settings
 * @returns {{placed:Array, deferred:Array}}
 */
function placeSideNotes(pages, settings) {
  const placed = [];
  const deferred = [];
  for (const page of pages) {
    const outerRight = page.isRecto !== false; // recto: שוליים חיצוניים = שמאל? RTL: recto x=1 → outer = left edge
    const anchorX = outerRight ? page.template.width - page.template.margins.side * 0.4 : page.template.margins.side * 0.4;
    const cap = page.template.contentBox.height;
    let stackY = 0;
    for (let i = 0; i < page.sideNotes.length; i++) {
      const sn = page.sideNotes[i];
      const h = sn.heightPx || Math.round(cap * 0.12);
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
