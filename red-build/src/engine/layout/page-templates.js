// src/engine/layout/page-templates.js — PT-01..PT-10 page type contracts (Part B2) + geometry model
'use strict';

/**
 * מודל תבניות עמוד: לכל סוג חוזה גיאומטריה (מרזבים, מספור, running head, טורים).
 */
const PAGE_TYPES = {
  SHAAR_MAIN: 'shaar-main',      // PT-01
  SHAAR_SUB: 'shaar-sub',        // PT-02
  SHAAR_BACK: 'shaar-back',      // PT-03
  PREFACE: 'preface',            // PT-04 (H0 — טור רחיד)
  SIGN_OPEN: 'sign-open',        // PT-05 (H2 — עמוד חדש תמיד)
  H3_SPREAD: 'h3-spread',        // PT-06 (כותרת 3 חוצת טורים + איזון לפני)
  ENDNOTES: 'endnotes',          // PT-07
  TOC_GENERAL: 'toc-general',    // PT-08
  TOC_DETAIL: 'toc-detail',      // PT-08
  CUSTOM: 'custom',              // PT-09
  FILLER: 'filler',              // PT-10 — לא נספר, לא underfill
  REGULAR: 'regular'             // PT default
};

const MM_TO_PX = 96 / 25.4;
const PAGE_SIZES = {
  // **S5.2 (O14 — A4 מדויק):** 210×297מ״מ @96dpi = 793.70×1122.52px — הערכים
  // המעוגלים (794×1123) הזיזו את גוף ה-DP ב-0.3px ויצרו MediaBox שאינו זהה
  // לגיאומטריית המורשת (793.7×1122.5). כעת זהה ל-GEO של legacy-imud-flow.
  A4: { w: Math.round(210 * MM_TO_PX), h: Math.round(297 * MM_TO_PX) },
  A5: { w: Math.round(148 * MM_TO_PX), h: Math.round(210 * MM_TO_PX) },
  '16x16': { w: Math.round(165 * MM_TO_PX), h: Math.round(165 * MM_TO_PX) }
};

/**
 * חישוב תבנית עמוד לפי סוג + הגדרות. מחזיר rectPx לשימוש DP.
 * @param {string} type
 * @param {object} settings
 * @param {boolean} isRecto
 */
function buildPageTemplate(type, settings, isRecto = true) {
  const size = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  const marginSide = size.w * settings['grid-margin-side-pct'] / 100;
  const binding = settings['binding-offset-px'] || 0;
  const marginTop = settings['margin-top-px'];
  const marginBottom = Math.max(settings['margin-bottom-px'], marginTop); // תחתון רחב מהעליון (BRZ B1)
  const outerMargin = marginSide + (isRecto ? binding : -binding);

  const contentW = size.w - 2 * marginSide - (isRecto ? binding : -binding);
  const singleCol = [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.CUSTOM, PAGE_TYPES.FILLER].includes(type);
  const gutter = size.w * settings['grid-gutter-pct'] / 100;

  let colWidths;
  if (singleCol) colWidths = [contentW];
  else {
    const cw = contentW * settings['grid-col-width-pct'] / 100;
    colWidths = [cw, cw]; // ימני+שמאלי; המרזב במרכז
  }

  const headerH = (type === PAGE_TYPES.REGULAR || type === PAGE_TYPES.SIGN_OPEN || type === PAGE_TYPES.H3_SPREAD) && settings['header-enabled'] ? Math.round(settings['body-font-size-pt'] * 1.6 * 96 / 72) : 0;
  const folioH = settings['page-num-position'] !== 'none' && !singleCol ? Math.round(settings['body-font-size-pt'] * 1.4 * 96 / 72) : 0;

  const textTop = marginTop + headerH + (type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0);
  const textBottom = size.h - marginBottom - folioH;

  return {
    type, isRecto,
    width: size.w, height: size.h,
    margins: { top: marginTop, bottom: marginBottom, side: marginSide, outer: outerMargin },
    columns: singleCol ? [{ x: marginSide, w: contentW }] : [
      { x: marginSide + contentW - colWidths[0], w: colWidths[0] }, // ימין קודם (RTL)
      { x: marginSide, w: colWidths[1] }
    ],
    gutter,
    headerHeight: headerH,
    folioHeight: folioH,
    // **S8:** אזור העיטורים שמעל תיבת התוכן (אזור h2-top-offset) — מסומן במפורש
    // כך שאודיט עיטורים יודע מה חוקי (עיטור H2 עליון חי באזור זה — לא גלישה).
    h2TopOffset: type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0,
    contentBox: { top: textTop, bottom: textBottom, height: Math.max(0, textBottom - textTop) },
    numbered: ![PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.FILLER].includes(type)
      ? true : (type.startsWith('shaar') ? settings['count-shaar-pages'] : settings['count-toc-pages']),
    counts: ![PAGE_TYPES.FILLER].includes(type),
    // **03.11(ד):** עמודי תוכן־העניינים מציגים כותרת עליונה כמו המקור
    // (renderPaginatedTOC של המקור מרנדר top-header-grid בכל עמודי התוכן).
    hasRunningHead: [PAGE_TYPES.REGULAR, PAGE_TYPES.SIGN_OPEN, PAGE_TYPES.H3_SPREAD, PAGE_TYPES.PREFACE, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL].includes(type),
  };
}

module.exports = { PAGE_TYPES, PAGE_SIZES, buildPageTemplate, MM_TO_PX };
