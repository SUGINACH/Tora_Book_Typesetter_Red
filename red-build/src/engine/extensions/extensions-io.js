// src/engine/extensions/extensions-io.js — חבילת הרחבות: export/import/share (S11.1-1, §8.3)
'use strict';

/**
 * חבילת הרחבות = סגנונות מותאמים + עמודים מותאמים + תמונות מוטמעות.
 * §8.3 "import/export/share של הכל":
 *  - export: JSON דטרמיניסטי (מפתחות ממוינים, אין חותמת זמן) — export פעמיים ⇒ בתים זהים.
 *  - import: אימות מלא + הודעות עבריות מאובחנות (parseCustomStyles/parseCustomPageTypes/validateImages);
 *    אין השלכה בשקט — כל דחייה מדווחת; הקובץ אינו נטען חלקית (all-or-nothing).
 *  - share: אותו פורמט (החבילה עצמה היא השיתוף) + סיכום קריא לאדם (summary).
 */

const { parseCustomStyles, validateImages } = require('./style-schema');
const { parseCustomPageTypes } = require('../decoration/custom-pages');

const FORMAT = 'tora-typesetter-extensions';
const VERSION = 1;

/** **S11 (§8.3):** תוויות מיקום עבריות לאדם — התקציר קריא בלי מזהי מנוע. */
const POSITION_LABELS = {
  'before-shaar-main': 'לפני השער הראשי',
  'after-shaar-main': 'אחרי השער הראשי',
  'before-part': 'לפני חלק',
  'after-part': 'אחרי חלק',
  'end': 'בסוף המסמך'
};

/** ייצוא דטרמיניסטי — מפתחות ממוינים, אין תאריך. */
function exportExtensions(bundle) {
  const payload = {
    format: FORMAT,
    format_version: VERSION,
    styles: (bundle && bundle.styles) || [],
    pages: (bundle && bundle.pages) || [],
    images: (bundle && bundle.images) || []
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * ייבוא ואימות חבילה. all-or-nothing: רק אם zero errors.
 * מבנה קלט: או חבילה מלאה {format: tora-typesetter-extensions, styles, pages, images},
 * או רשימה חשופה — {styles:[...]} / [styles] (רק סגנונות; עמודים/תמונות ריקים).
 * format שגוי במפורש ⇒ דחייה «פורמט לא נתמך» (חוק 14).
 * @returns {{ok:boolean, styles:Array, pages:Array, images:Array, errors:Array, summary:string}}
 */
function importExtensions(json) {
  let raw;
  const errors = [];
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'unparseable-json', path: '$', styleId: null, message: `קובץ ההרחבות אינו JSON תקין — ${e.message}.` }], summary: 'ייבוא נכשל: הקובץ אינו JSON תקין.' };
  }
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'bad-shape', path: '$', styleId: null, message: 'קובץ ההרחבות חייב להיות אובייקט או מערך.' }], summary: 'ייבוא נכשל: מבנה שגוי.' };
  }
  if (raw.format != null && raw.format !== FORMAT) {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'bad-format', path: '$.format', styleId: null, message: `פורמט לא נתמך — צפוי «${FORMAT}» (קיבל ${JSON.stringify(raw.format)}). הקובץ לא נטען.` }], summary: 'ייבוא נכשל: פורמט לא נתמך.' };
  }
  // רשימה חשופה: [styles] או {styles:[...]} — ללא format/ללא pages/images
  const bare = Array.isArray(raw) || (raw.format == null && !('pages' in raw) && !('images' in raw));
  const stylesInput = bare ? raw : (raw.styles || []);
  const pagesInput = bare ? [] : (raw.pages || []);
  const imagesInput = bare ? [] : (raw.images || []);

  const stylesRes = parseCustomStyles(stylesInput);
  errors.push(...stylesRes.errors);
  const pagesRes = parseCustomPageTypes(JSON.stringify({ pages: pagesInput }));
  errors.push(...pagesRes.errors.map(e => ({ code: `custom-pages:${e}`, path: 'pages', styleId: null, message: `עמוד מותאם נדחה — ${e}.` })));
  const imagesRes = validateImages(imagesInput);
  errors.push(...imagesRes.errors);

  if (errors.length) {
    return { ok: false, styles: [], pages: [], images: [], errors, summary: `ייבוא נכשל: ${errors.length} שגיאות אימות (הקובץ לא נטען).` };
  }
  return {
    ok: true,
    styles: stylesRes.styles,
    pages: pagesRes.pages,
    images: imagesRes.images,
    errors: [],
    summary: `ההרחבות נטענו: ${stylesRes.styles.length} סגנונות, ${pagesRes.pages.length} עמודים מותאמים, ${imagesRes.images.length} תמונות.`
  };
}

/**
 * שיתוף: סיכום קריא לאדם של חבילה קיימת (מוצג למשתמש לפני/אחרי ייבוא).
 * דטרמיניסטי; ללא פרטים מזהים.
 */
function shareSummary(bundle) {
  if (!bundle) return 'חבילה ריקה.';
  const styles = bundle.styles || [];
  const pages = bundle.pages || [];
  const images = bundle.images || [];
  const lines = [
    `חבילת הרחבות (${FORMAT} v${VERSION})`,
    `סגנונות (${styles.length}):` + (styles.length ? styles.map(s => ` «${s.name}» [${s.layoutMode}]`).join(';') : ' אין'),
    `עמודים מותאמים (${pages.length}):` + (pages.length ? pages.map(p => {
      const pos = p.position || { at: 'end' };
      const label = POSITION_LABELS[pos.at] || pos.at;
      const part = pos.at === 'before-part' || pos.at === 'after-part' ? ` ${pos.part || '?'}` : '';
      return ` «${p.name || p.id}» ${label}${part}${p.counted ? '' : ' (לא נספר)'}`;
    }).join(';') : ' אין'),
    `תמונות (${images.length}):` + (images.length ? images.map(im => ` «${im.id}» ${im.w}×${im.h}מ״מ`).join(';') : ' אין')
  ];
  return lines.join('\n');
}

module.exports = { FORMAT, VERSION, exportExtensions, importExtensions, shareSummary };
