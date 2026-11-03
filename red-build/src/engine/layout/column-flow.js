// src/engine/layout/column-flow.js — Column geometry + block→column flow (S4 consumers registration)
// צרכנים אמיתיים: grid-col-width-pct, grid-gutter-pct, grid-block-gap-pct
'use strict';

const { buildPageTemplate } = require('./page-templates');

/**
 * רוחב טור יחיד בפיקסלים מתוך settings (מקור־האמת יחיד שמשמש גם dp-planner וגם pipeline).
 * grid-col-width-pct: אחוז רוחב טור מתוך שטח התוכן (צמוד ל‑PT-01..PT-10).
 * grid-gutter-pct: בולטה בין הטורים.
 */
function columnWidths(settings, pageWidthPx, contentWidthPx) {
  const gutter = (contentWidthPx * settings['grid-gutter-pct']) / 100;
  const cw = (contentWidthPx * settings['grid-col-width-pct']) / 100;
  return { colW: cw, gutter, totalUsed: cw * 2 + gutter, pageWidthPx };
}

/**
 * מרווח אנכי בין בלוקים בתוך טור (פסקה↔פסקה). נצרך ע"י flowing: כל בלוק חדש
 * בטור פותח ב‑gap הזה אלא אם הוא הראשון בטור.
 */
function blockGapPx(settings, lineH) {
  // grid-block-gap-pct נתון באחוזי גובה־שורת־גוף כדי שיישאר פרופורציונלי לגודל דפוס
  return Math.round((Number(settings['grid-block-gap-pct']) || 0) / 100 * lineH * 10);
}

/**
 * האם בלוק חוסם מעבר טור רגיל (full-width headings H1/H2 לפי mode).
 */
function isFullWidthBlock(block, settings) {
  if (block.kind === 'heading') {
    const mode = settings[`heading-${block.level}-mode`];
    return mode === 'full-width' || mode === 'new-page';
  }
  return block.fullWidth === true;
}

module.exports = { columnWidths, blockGapPx, isFullWidthBlock, buildPageTemplate };
