// src/engine/decoration/dividers.js — מפרידים: טורים, שערים, כותרות (S8 L5; נרשם S4)
// Invariant T1: מפריד הוא overlay — אסור לו לשנות גובה שנמדד.
'use strict';

const { columnDividerHeightPx, fits, dividerInsertable } = require('./ornament-fit');

/**
 * היקף (outline) של צורת SVG לפי סגנון — מחושב מ‑path אחד ללא יחידות מדידה חיצוניות (F-21).
 */
const OUTLINE_PATHS = {
  circle: 'M12 3a9 9 0 1 0 .01 0z',
  square: 'M4 4h16v16H4z',
  diamond: 'M12 2l10 10-10 10L2 12z',
  parenthesis: 'M8 3C4 7 4 17 8 21M16 3c4 4 4 14 0 18',
};

function framePath(style) {
  return OUTLINE_PATHS[style] || null;
}

/**
 * רנדור היקף בלבד (stroke only) — fill:none; אין מסכת/רקע ש"אוכל" את הספרה (V4 lesson).
 */
function renderFolioFrame(svgDoc, style, cx, cy, r) {
  const d = framePath(style);
  if (!d) return null;
  const p = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('transform', `translate(${cx - r} ${cy - r}) scale(${(2 * r) / 24})`);
  return p;
}

/**
 * מפריד בין הטורים: זכוכית־עמדת — לא תופס גובה בזרימה (T1).
 * גובה = Math.min(שני הטורים) − 8px (כלל V4) — נאכף גם תחת עומס (טורים לא־שווים).
 * @returns {{x,y,w,h}|null} יש למקם absolute; null אם no-divider/עמוד חד־טורי.
 */
function columnDividerGeometry(page, settings) {
  if (settings['column-divider-style'] === 'none') return null;
  if (page.template.columns.length < 2) return null;
  const h = columnDividerHeightPx([
    page.columns[0].reduce((s, l) => s + (l.heightPx || 0), 0),
    page.columns[1].reduce((s, l) => s + (l.heightPx || 0), 0),
  ]);
  if (h <= 0) return null;
  const [right, left] = page.template.columns;
  const x = left.x + left.w + (right.x - (left.x + left.w)) / 2; // מרכז המרזב
  return { x, y: page.template.contentBox.top, w: 1, h, style: settings['column-divider-style'] };
}

/**
 * מפרידי כותרות H3–H6 מתחת לכותרת (chk-hdr-dividers; שידרוג Orange):
 * הוספה רק אם fits() נמדד באתר ההצבה בפועל, הכותרת אינה בראש טור/עמוד ריק,
 * ומצב rollback-aware: ההחלטה ניתנת לביטול מבלי להשאיר מונה תלוי (reset per document).
 * @returns {{insert:boolean, heightPx?:number, why:string, rollbackKey?:string}}
 */
function headingDividerDecision(settings, remainingPx, dividerHeightPx, ctx = {}) {
  if (!settings['heading-dividers-h3-h6']) return { insert: false, why: 'disabled' };
  // משמרות REQ-ORN-04: לא בראש טור, לא בטור ריק — נבדק באתר ההצבה בפועל.
  // **03.11(ד):** בפס חוצה־טורים (ctx.band) אין מושג "ראש טור" — הכותרת בראש
  // הפס מעצם טבעה; נותרת רק בדיקת התקציב.
  if (!ctx.band && !dividerInsertable(ctx.columnLinesBefore, ctx.colIdx)) return { insert: false, why: 'column-head-or-empty' };
  if (!fits(remainingPx, dividerHeightPx)) return { insert: false, why: 'no-fit-budget' };
  return {
    insert: true,
    heightPx: dividerHeightPx,
    why: 'fit',
    rollbackKey: `hdr-div:${ctx.pageIndex}:${ctx.tokenId}` // rollback-aware — מזהה יציב לביטול
  };
}

/**
 * מפרידי שערים (REQ-ORN-04): main/sub — קו תחתון אופציונלי בעמוד השער.
 * PT-01: `shaar-main-divider`; PT-02: `shaar-sub-divider`.
 * @returns {{insert:boolean, style?:string, why:string}}
 */
function shaarDividerDecision(pageType, settings) {
  const mainStyle = settings['shaar-main-divider'];
  const subStyle = settings['shaar-sub-divider'];
  if (pageType === 'shaar-main') {
    if (!mainStyle || mainStyle === 'none') return { insert: false, why: 'disabled' };
    return { insert: true, style: mainStyle, why: 'fit' };
  }
  if (pageType === 'shaar-sub') {
    if (!subStyle || subStyle === 'none') return { insert: false, why: 'disabled' };
    return { insert: true, style: subStyle, why: 'fit' };
  }
  return { insert: false, why: 'not-a-shaar-page' };
}

/**
 * מונה מפרידים rollback-aware: כל מסמך מתחיל נקי (reset per document), וכל
 * ביטול (rollback) מסיר את הרישום — אין מונה תלוי אחרי נסיגה (שיעור Orange).
 */
function createDividerCounters() {
  const inserted = new Map(); // rollbackKey -> true
  return {
    record(key) { inserted.set(key, true); return key; },
    rollback(key) { return inserted.delete(key); },
    count() { return inserted.size; },
    has(key) { return inserted.has(key); }
  };
}

module.exports = {
  framePath, renderFolioFrame, columnDividerGeometry, headingDividerDecision,
  shaarDividerDecision, createDividerCounters
};
