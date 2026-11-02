// src/engine/decoration/shaar-pages.js — Structural shaar page insertion: PT-01/02/03 (S8)
'use strict';

/**
 * הכנסת עמודי שער לרצף העמודים — החלטה מבנית (L4), לא עיטורית:
 * מתבצעת מיד אחרי planPages ולפני צילום ה־hash של CP4, כך שהם חלק
 * מהבסיס שנמדד (ולא "תוספת מאוחרת" שמזיזה אינדקסים).
 *
 * PT-01 שער ראשי: בראש המסמך — כשערכת נושא פעילה (shaar-main-image הוגדר
 * ע"י activateThemeSet; תמיד recto).
 * PT-02 שער משנה: לפני כל פתיחת חלק (H1) — כשהטוגל "הצג שער משנה" דלוק (U-C2).
 * PT-03 שער אחורי: בסוף המסמך — כשערכה פעילה ו־shaar-back-enabled.
 *
 * עמודי שער: טור יחיד ריק (אין שורות גוף), chapterOpening=true (ללא כותרת
 * עליונה/גיליון לעין — D-36), numbered לפי count-shaar-pages.
 */

const { PAGE_TYPES, buildPageTemplate } = require('../layout/page-templates');
const { planCustomPages, buildCustomPageGeometry } = require('./custom-pages');
const { buildPickerModel } = require('./theme-sets');

/**
 * האם ערכת נושא פעילה (הופעלה דרך activateThemeSet או הוגדרה ידנית).
 * ברירת המחדל 'default' ⇒ אין עמודי שער — התנהגות שמרנית שלא משנה מסמכים קיימים.
 */
function themeActive(settings) {
  const id = settings['theme-set-id'];
  return Boolean(id && id !== 'default') || Boolean(settings['shaar-main-image']);
}

function makeShaarPage(type, settings, index) {
  const tpl = buildPageTemplate(type, settings, index % 2 === 0);
  return {
    index, type, template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // D-36: שער — ללא גיליון לעין
    decorations: [], isShaar: true
  };
}

/**
 * בניית רצף העמודים הסופי עם שערים + עמודים מותאמים (PT-09).
 * @param {Array} pages - תוצר planPages (לא מוטציה — מוחזר מערך חדש)
 * @param {Array} blocks - בלוקי המסמך (לזיהוי פתיחות חלקים)
 * @param {object} settings
 * @param {object} customDefs - עמודים מותאמים מפורקים (אופציונלי)
 * @returns {{pages:Array, inserted:Array, customPlaced:Array}}
 */
function insertShaarPages(pages, blocks, settings, customDefs) {
  const out = [];
  const inserted = [];
  const active = themeActive(settings);
  const showSub = settings['show-shaar-sub'] === true;
  const partsCount = new Set(blocks.filter(b => b.kind === 'heading' && b.level === 1).map(b => b.part)).size;

  // עמודים מותאמים — תכנון מיקום (PT-09)
  const customPlan = customDefs && customDefs.length ? planCustomPages(customDefs, { partsCount, hasShaarMain: active }) : null;
  const customPlaced = [];

  const push = (page, why) => { out.push(page); if (why) inserted.push({ type: page.type, why }); };

  // PT-01 + custom before/after-shaar-main
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'before-shaar-main')) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, 0), `custom:${d.id}`);
  }
  if (active) push(makeShaarPage(PAGE_TYPES.SHAAR_MAIN, settings, out.length), 'theme-main');
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'after-shaar-main')) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
  }

  // גוף המסמך — עם שערי־משנה לפני פתיחות חלקים ועמודים מותאמים סביב חלקים
  let lastPart = 0;
  for (const pg of pages) {
    let openingPart = null;
    if (pg.chapterOpening && pg.type === 'preface') {
      // פתיחת חלק: מזהים את מספר החלק מהכותרת (docPart במטא — מקור יחיד מהבלוק)
      outer: for (const col of pg.columns) {
        for (const ln of col) {
          if (ln.kind === 'heading' && ln.level === 1) {
            openingPart = (ln.meta && ln.meta.docPart != null) ? ln.meta.docPart : (lastPart + 1);
            break outer;
          }
        }
      }
    }
    if (openingPart != null) {
      if (customPlan) for (const d of (customPlan.beforePart.get(openingPart) || [])) {
        customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
      }
      if (showSub) push(makeShaarPage(PAGE_TYPES.SHAAR_SUB, settings, out.length), `theme-sub:part${openingPart}`);
      lastPart = openingPart;
    }
    push(pg);
    if (openingPart != null && customPlan) for (const d of (customPlan.afterPart.get(openingPart) || [])) {
      customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
    }
  }

  // PT-03 שער אחורי + custom:end
  if (customPlan) for (const d of customPlan.end) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
  }
  if (active && settings['shaar-back-enabled'] !== false) {
    push(makeShaarPage(PAGE_TYPES.SHAAR_BACK, settings, out.length), 'theme-back');
  }

  // reindex — כל האינדקסים מחדש אחרי ההכנסה (folio/TOC/recto מחושבים בהמשך מהאינדקס)
  out.forEach((p, i) => { p.index = i; });

  return { pages: out, inserted, customPlaced };
}

function makeCustomPage(def, settings, index) {
  const geo = buildCustomPageGeometry(def, settings);
  const tpl = buildPageTemplate(PAGE_TYPES.CUSTOM, settings, index % 2 === 0);
  return {
    index, type: 'custom', template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // עמוד קבוע — אין כותרת עליונה
    decorations: [], counted: geo.counted, custom: geo
  };
}

module.exports = { insertShaarPages, themeActive, buildPickerModel };
