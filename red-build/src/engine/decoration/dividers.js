// src/engine/decoration/dividers.js — מפרידים: טורים, שערים, כותרות (S8 L5; נרשם S4)
// Invariant T1: מפריד הוא overlay — אסור לו לשנות גובה שנמדד.
'use strict';

const { columnDividerHeightPx, fits } = require('./ornament-fit');

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
 * מפרידי H3–H6 מתחת לכותרת (chk-hdr-dividers): הוספה רק אם fits() — אחרת דחייה עם ledger.
 */
function headingDividerDecision(settings, remainingPx, dividerHeightPx) {
  if (!settings['heading-dividers-h3-h6']) return { insert: false, why: 'disabled' };
  if (!fits(remainingPx, dividerHeightPx)) return { insert: false, why: 'no-fit-budget' };
  return { insert: true, heightPx: dividerHeightPx };
}

module.exports = { framePath, renderFolioFrame, columnDividerGeometry, headingDividerDecision };
