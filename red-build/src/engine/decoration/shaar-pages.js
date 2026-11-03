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
 * **03.11(ד):** אין עוד תלות בין קיום השערים לערכת נושא — המתגים המפורשים
 * (shaar-main-enabled/shaar-sub-enabled/shaar-back-enabled, ברירת מחדל true
 * כמקור) קובעים את קיום השערים; ערכת נושא/עיצוב מוסיפה רקע מעוצב בלבד.
 */
function themeActive(settings) {
  const id = settings['theme-set-id'];
  return Boolean(id && id !== 'default') || Boolean(settings['shaar-main-image']) || Boolean(settings['imud-shaar-main']);
}

/** **03.11(ד):** שער ראשי — מתג מפורש; ברירת מחדל true כמקור (show-main-shaar).
 * ערכת־נושא/עיצוב ספרייה אינן כופות קיום — הן מוסיפות רקע מעוצב בלבד;
 * כיבוי מפורש (shaar-main-enabled=false) גובר על הכול.
 * תאימות לאחור: shaar-main-image/imud-shaar-main שהוגדרו בתבניות ישנות
 * (מעידות על כוונת שער) מדליקות גם כשהמתג לא נשמר. */
function mainShaarActive(settings) {
  if (settings['shaar-main-enabled'] === false) return false;
  return settings['shaar-main-enabled'] === true || themeActive(settings);
}

/** **03.11(ד):** שער־משנה — ברירת מחדל true כמקור (show-sub-shaar); המתג
 * הישן show-shaar-sub=true מדליק (תאימות תבניות); כיבוי מפורש גובר. */
function subShaarActive(settings) {
  if (settings['shaar-sub-enabled'] === false) return false;
  return settings['shaar-sub-enabled'] === true || settings['show-shaar-sub'] === true || themeActive(settings);
}

/** **03.11(ד):** שער אחורי — ברירת מחדל true כמקור (show-back-shaar=true). */
function backShaarActive(settings) {
  return settings['shaar-back-enabled'] !== false;
}

function makeShaarPage(type, settings, index, info) {
  const tpl = buildPageTemplate(type, settings, index % 2 === 0);
  return {
    index, type, template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // D-36: שער — ללא גיליון לעין
    decorations: [], isShaar: true,
    // **03.11(ד):** נתוני תוכן השער — שער־משנה נושא את כותרת החלק (פיצול במקף
    // כמקור: renderSubShaar — titleMain/titleSub). המידע נצרך ב-dom-renderer.
    shaarInfo: info || null
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
  const active = mainShaarActive(settings);
  const showSub = subShaarActive(settings);
  const showBack = backShaarActive(settings);
  const partsCount = new Set(blocks.filter(b => b.kind === 'heading' && b.level === 1).map(b => b.part)).size;

  // עמודים מותאמים — תכנון מיקום (PT-09)
  const customPlan = customDefs && customDefs.length ? planCustomPages(customDefs, { partsCount, hasShaarMain: active }) : null;
  const customPlaced = [];

  const push = (page, why) => { out.push(page); if (why) inserted.push({ type: page.type, why }); };

  // PT-01 + custom before/after-shaar-main.
  // _frontMatter מסמן עמודי פתיחה אמיתיים — תוכן־העניינים נכנס אחריהם ולפני
  // כל דף גוף (כולל שערי־משנה של החלק הראשון — סדר המקור 03.11(ד)).
  const pushFront = (page, why) => { page._frontMatter = true; push(page, why); };
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'before-shaar-main')) {
    customPlaced.push(d.id); pushFront(makeCustomPage(d, settings, 0), `custom:${d.id}`);
  }
  if (active) pushFront(makeShaarPage(PAGE_TYPES.SHAAR_MAIN, settings, out.length), 'shaar-main');
  // **03.11(ד) — סדר המקור:** השער האחורי מודפס מיד אחרי השער הראשי (גיליון 1
  // דו־צדדי: חזית/גב — כך גם typesetDocument המקורי: main-shaar → back-shaar →
  // תוכן־עניינים → גוף). עד כאן היה בסוף המסמך (PT-03 הישן).
  if (showBack) pushFront(makeShaarPage(PAGE_TYPES.SHAAR_BACK, settings, out.length), 'shaar-back');
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'after-shaar-main')) {
    customPlaced.push(d.id); pushFront(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
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
      if (showSub) {
        // **03.11(ד):** כותרת החלק לתוכן השער־משנה (מקור: renderSubShaar — פיצול
        // במקף: titleMain=לפני, titleSub=אחרי). הכותרת נלקחת מהבלוק עצמו (מקור יחיד).
        const partBlock = blocks.find(b => b.kind === 'heading' && b.level === 1 && b.part === openingPart);
        const partTitle = partBlock ? partBlock.lines.map(l => l.words.join(' ')).join(' ').trim() : '';
        push(makeShaarPage(PAGE_TYPES.SHAAR_SUB, settings, out.length, { part: openingPart, title: partTitle }), `shaar-sub:part${openingPart}`);
      }
      lastPart = openingPart;
    }
    push(pg);
    if (openingPart != null && customPlan) for (const d of (customPlan.afterPart.get(openingPart) || [])) {
      customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
    }
  }

  // custom:end — עמודים מותאמים בסוף המסמך (PT-09); השער האחורי כבר הוכנס אחרי
  // הראשי (סדר המקור — 03.11(ד)).
  if (customPlan) for (const d of customPlan.end) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
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

module.exports = { insertShaarPages, themeActive, mainShaarActive, subShaarActive, backShaarActive, buildPickerModel };
