// src/engine/layout/side-notes.js — H7 side-notes / marginalia full contract (REQ-FN-05/06, S7.1.2)
'use strict';

/**
 * הערות צד (H7): עיגון לטוקן־אנקור, מיקום **בראש הפסקה המארחת** (לא בראש העמוד),
 * cascade דחיפה כלפי מטה, אצוות של H7 רצופים, נשארות מועברות לעמוד הבא
 * (pagePendingNotes), margin חיצוני לפי recto/verso, מיכל 20px.
 */

const CONTAINMENT_PX = 20; // חריגה מזערית מעבר למיכל — לא נחשב overlap אמיתי (ספרד קטלוג D3)
const STACK_GAP_PX = 8;    // מרווח בין הערות צד סמוכות בשוליים

/** פרופילי רוחב גופן להערות צד (s-note-body-font). */
const SIDE_NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

function estimateSideNoteHeight(text, settings, measureFn) {
  const size = settings['body-font-size-pt'] * 0.75; // הערות צד קטנות
  const lh = Math.round(size * (96 / 72) * 1.15);
  const words = String(text || '').split(/\s+/).filter(Boolean);
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

/** מיקום Y של שורה בטור: גובה מצטבר מראש התוכן. */
function lineYTop(page, colIdx, lineIdx) {
  let y = page.template.contentBox.top;
  const col = page.columns[colIdx] || [];
  for (let i = 0; i < lineIdx && i < col.length; i++) y += col[i].heightPx || 0;
  return y;
}

/** מציאת שורת האנקור הראשונה בעמוד → (colIdx, lineIdx) או null. */
function findAnchorLine(page, anchorToken) {
  for (let c = 0; c < page.columns.length; c++) {
    for (let i = 0; i < page.columns[c].length; i++) {
      const ln = page.columns[c][i];
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok === anchorToken) return { colIdx: c, lineIdx: i };
    }
  }
  return null;
}

/**
 * מיקום הערות צד על עמודי התוצר.
 * @param {Array} pages - עמודי התוצר (עם columns + sideNotes)
 * @param {object} settings
 * @param {(text:string,sizePt:number)=>number} [measureFn]
 * @param {object} [hooks] — {ledger, eventLog} לרישום הזזות/דחיות
 * @returns {{placed:Array, deferred:Array}}
 */
function placeSideNotes(pages, settings, measureFn, hooks = {}) {
  const ledger = hooks.ledger || null;
  const eventLog = hooks.eventLog || null;
  const placed = [];
  const deferred = [];
  const pending = []; // pagePendingNotes — נשארות מועברות לעמוד הבא
  const overflowEvents = [];

  for (const page of pages) {
    // recto: שוליים חיצוניים בצד שמאל (RTL); verso: בצד ימין
    const outerX = page.isRecto !== false
      ? page.template.margins.side * 0.15
      : page.template.width - page.template.margins.side * 0.15 - (settings._sideNoteColWidthPx || 60);
    const cap = page.template.contentBox.height;
    const queue = [...pending.splice(0), ...(page.sideNotes || [])];
    page.sideNotes = []; // ייבנה מחדש לפי מה שבאמת מוקם בעמוד זה
    let lastBottom = -1;

    for (let i = 0; i < queue.length; i++) {
      const sn = queue[i];
      const h = sn.heightPx || estimateSideNoteHeight(sn.text, settings, measureFn);
      // **מיקום בראש הפסקה המארחת** (S7.1.2): עוגן לשורה הראשונה של האנקור בעמוד
      const anchor = findAnchorLine(page, sn.anchorToken);
      let yTop = anchor
        ? lineYTop(page, anchor.colIdx, anchor.lineIdx)
        : page.template.contentBox.top; // אנקור לא בעמוד זה ⇒ ראש תוכן
      // push-down cascade: אין לחפוף את ההערה הקודמת
      if (lastBottom >= 0 && yTop < lastBottom + STACK_GAP_PX) yTop = lastBottom + STACK_GAP_PX;
      // מיכל 20px: אין חריגה מסוף אזור התוכן
      if (yTop + h > page.template.contentBox.bottom + CONTAINMENT_PX) {
        deferred.push({ ...sn, reason: 'no-room', page: page.index });
        pending.push({ ...sn, deferredFrom: page.index });
        continue;
      }
      const rec = {
        ...sn, page: page.index,
        x: outerX, yTop,
        heightPx: h,
        batchGroup: sn.batchId || (anchor ? `${sn.anchorToken}` : `p${page.index}i${i}`),
        colWidth: settings._sideNoteColWidthPx || 60
      };
      placed.push(rec);
      page.sideNotes.push(rec); // מה שמוקם בפועל בעמוד זה (נרנדר)
      lastBottom = yTop + h;
      void cap;
    }
  }

  // **BRZ-15 — לא גניזה:** הערות שנותרו בתור אחרי העמוד האחרון — מוספים עמוד נוסף
  // שנושא אותן (אירוע מתועד; אינו מזיז עמודי גוף קיימים — הצפה בזנב).
  if (pending.length && pages.length) {
    const last = pages[pages.length - 1];
    const tpl = last.template;
    const tail = {
      index: pages.length ? pages[pages.length - 1].index + 1 : 0,
      type: 'regular', isRecto: pages.length % 2 === 0,
      template: { ...tpl, columns: tpl.columns.map(c => ({ ...c })) },
      columns: tpl.columns.map(() => []),
      footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
      fnReservedHeightPx: 0, chapterOpening: false, tailForSideNotes: true
    };
    pages.push(tail);
    let yTop = tail.template.contentBox.top;
    for (const sn of pending.splice(0)) {
      const h = sn.heightPx || estimateSideNoteHeight(sn.text, settings, measureFn);
      if (yTop + h > tail.template.contentBox.bottom + CONTAINMENT_PX) {
        // פתולוגי: הערה גבוהה מעמוד — נרשם כממצא, לא נגנז (מוקם בחריגת מיכל מתועדת)
        overflowEvents.push({ anchor: sn.anchorToken, heightPx: h, reason: 'taller-than-page' });
        if (ledger) {
          const rec = ledger.create('side-note-overflow', `sn@${sn.anchorToken}`, tail.index, { heightPx: h }, 'decorations');
          ledger.transition(rec.issue_id, 'persists', 'decorations', 'note taller than a page — placed with documented containment breach');
        }
      }
      const rec = { ...sn, page: tail.index, x: tail.isRecto !== false ? tail.template.margins.side * 0.15 : tail.template.width - tail.template.margins.side * 0.15 - (settings._sideNoteColWidthPx || 60), yTop, heightPx: h, colWidth: settings._sideNoteColWidthPx || 60 };
      placed.push(rec);
      tail.sideNotes.push(rec);
      yTop += h + STACK_GAP_PX;
    }
    if (eventLog) eventLog.emit('decorations', 'side-notes-tail-page', { page: tail.index, count: tail.sideNotes.length }, tail.index);
  }

  return { placed, deferred, overflow: overflowEvents };
}

/**
 * אימות המרת H7 → הערת צד (S7.1.3): השוואה per-paragraph על בסיס **עוגן הטוקן**,
 * לא חיפוש טקסט — כפילות טקסט בגוף (תיקון המשתמש) אינה false-positive.
 * @param {Array} sourceTokens - טוקני המקור (headings עם level 7 / mode side-note)
 * @param {Array} pages - עמודי התוצר
 * @param {{placed:Array}} placement - פלט placeSideNotes
 */
function verifyH7Conversion(sourceTokens, pages, placement) {
  const mismatches = [];
  const placedAnchors = new Set((placement ? placement.placed : []).map(p => p.ownToken || p.anchorToken)); // ownToken = הטוקן של ההערה עצמה; anchorToken = הפסקה המארחת
  for (const t of sourceTokens) {
    if (t.type === 'heading' && (t.level === 7 || t.mode === 'side-note')) {
      if (!placedAnchors.has(t.id)) {
        mismatches.push({ token: t.id, text: t.text, kind: 'h7-conversion-missing' });
      }
    }
  }
  void pages;
  return mismatches;
}

module.exports = { placeSideNotes, verifyH7Conversion, estimateSideNoteHeight, CONTAINMENT_PX, STACK_GAP_PX, SIDE_NOTE_FONT_FACTORS };
