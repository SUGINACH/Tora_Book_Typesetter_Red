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

/**
 * **S5.2 (P-2 — איחוד חישוב קיבולת טור):** המקור היחיד לקיבולת האפקטיבית
 * של טור בעמוד DP: גובה תיבת התוכן מהתבנית, בהפחתת:
 *  - הפס החוצה־טורים (spanning band, FWD-1) — הטורים מתחילים מתחתיו;
 *  - תקציב ההערות של העמוד (fnReservedHeightPx, F-17) — נרשם על הטור האחרון.
 * בעבר חושבו 4 העתקים מקבילים (balancing.balancePage/autoQualityPass,
 * dp-planner.balancePageSafe, protections-matrix.containment) שהתעלמו מהפס
 * ו/או מהתקציב ⇒ גלישת טור שקטה בעמודים עם הערות או פס כותרת.
 *
 * @param {object} page - עמוד DP: template.contentBox, spanning?, fnReservedHeightPx?, columns
 * @param {{colIndex?:number, fnBudget?:boolean}} [opts]
 *  - colIndex: הטור שאליו שייכת הקיבולת (ברירת מחדל: האחרון — המחמיר);
 *    תקציב ההערות מופחת רק מהטור האחרון (שם הוא נרשם).
 *  - fnBudget:false — ביטול הפחתת תקציב ההערות (למי שמודד usage כולל
 *    התקציב בעצמו — כמו usedHeight של dp-planner או extraLast של optimalSplit).
 */
function colCapacityOf(page, opts = {}) {
  if (!page || !page.template || !page.template.contentBox) return 0;
  let cap = page.template.contentBox.height;
  if (page.spanning && page.spanning.heightPx) cap -= page.spanning.heightPx;
  const fn = opts.fnBudget !== false && page.fnReservedHeightPx > 0 ? page.fnReservedHeightPx : 0;
  // **S6.0 (R3-C2 — מרזב חוצה-טורים):** אזור ההערות נמשך לרוחב תיבת
  // התוכן כולה בשני המרנדרים (DOM ו-PDF) — לכן התקציב מופחת מ**כל**
  // הטורים. בעבר הופחת רק מהטור האחרון ⇒ טור ימני (RTL) חדר עד 44px
  // לתוך אזור ההערות בכל עמוד רווי-הערות, והגנת containment הייתה עיוורת
  // לזה (אותה נוסחה).
  if (fn) cap -= fn;
  return cap;
}

module.exports = { columnWidths, blockGapPx, isFullWidthBlock, colCapacityOf, buildPageTemplate };
