// src/engine/core/legacy-settings-map.js — S4.5-ד: מיפוי מלא של הגדרות IMUD_TORANI (03.11)
'use strict';

/**
 * **רקע (ביקורת 03.11, סקירה 2):** תוכנית העבודה (S4) דרשה רישום־על של כל
 * ההגדרות מכל הגרסאות והגירה ללא אובדן. בפועל נבנה רישום RED עקבי אך 264
 * מפתחות default_settings.json של המקור לא קיבלו disposition מפורש. המודול
 * הזה הוא טבלת האמת: **לכל מפתח מקור** — מיפוי למפתח RED (מלא/בטרנספורם),
 * איחוד, מצב-UI (ללא אפקט מנועתי), או הסרה מנומקת (עם הפניית מעקב).
 *
 * עקרונות:
 * - אין מפתח "לא מוכר" — הכל מקבל שורה; שער הקבלה: 100% disposition.
 * - ערכי המקור מוחלים בעת ייבוא (importImudSettings); ברירות המחדל של RED
 *   עצמן נשארות כהחלטות RED המתועדות — ההחלפה מפורשת והפיכה.
 * - טרנספורמים מתועדים (יחידות/סמנטיקה), לא רק שמות.
 */

/** חילוץ משפחת הגופן הראשונה מערך CSS: "'Guttman Rashi', 'Frank Ruhl Libre', serif" ⇒ "Guttman Rashi". */
function firstFamily(css) {
  const m = String(css || '').match(/'([^']+)'/);
  return m ? m[1] : String(css || '').split(',')[0].trim();
}

/** 22% (מגובה תיבת התוכן של A4 בפועל) ⇒ פיקסלים — יחידות המקור אחוז מגובה התוכן. */
function pctToPx(v) { return Math.round(1040 * (parseFloat(v) / 100)); }

/** סגנונות פתיחה של המקור ⇒ מצבי RED (headings-escort). */
const OPEN_MODE_MAP = {
  'new_page_1col': 'new-page',
  'span_1col': 'full-width',
  'inline_2col': 'regular',
  'side_note': 'side-note',
  'sub_shaar': 'new-page' // שער-משנה מובנה: show-shaar-sub נלווה ב-merge
};

/** עמדות עיצוב-מפריד של המקור ⇒ סגנונות RED. */
const DIVIDER_MAP = { 'none': 'none', 'thin': 'thin', 'dashed': 'dashed', 'double': 'double', 'spear': 'thin' };

/** מיקומי מספור של המקור ⇒ RED. */
const NUMPOS_MAP = {
  'bottom_center': 'bottom-center', 'bottom_outer': 'bottom-outer', 'bottom_left': 'bottom-left', 'bottom_right': 'bottom-right',
  'top_center': 'top-center', 'top_outer': 'top-outer', 'in_header': 'in-header'
};

/**
 * טבלת ה-disposition. kind:
 *  - 'mapped'   → to (מפתח RED) + transform אופציונלי — ערך מוחל בייבוא
 *  - 'merged'   → מוזג למפתח אחר/כמה מפתחות — מתועד ב-reason
 *  - 'ui-state' → מצב פאנל של האפליקציה הישנה; נשמר כנתון, אין אפקט מנועתי
 *  - 'removed'  → לא ב-RED; סיבה מנומקת + מזהה מעקב (ISSUE_REGISTRY)
 */
const DISPOSITIONS = {
  // ============ טיפוגרפיה של הגוף ============
  'font-body': { kind: 'mapped', to: 'body-font', transform: firstFamily, reason: 'משפחה ראשונה מרשימת ה-fallback של המקור' },
  'size-body': { kind: 'mapped', to: 'body-font-size-pt', transform: parseFloat, reason: 'pt (המקור 12; RED 14 — ההפרש מתועד כהחלטת RED)' },
  'line-height-body': { kind: 'mapped', to: 'body-line-height', transform: parseFloat },
  'body-last-line-align': { kind: 'mapped', to: 'body-last-line-align' },

  // ============ מילה ראשונה ============
  'drop-word-mode': { kind: 'mapped', to: 'first-word-mode', transform: (v) => ({ 'window': 'drop', 'drop': 'drop', 'inline': 'inline', 'bold': 'bold', 'none': 'none' }[v] || 'drop'), reason: 'window ⇒ drop (אותו מנגנון חלון)' },
  'drop-word-count': { kind: 'mapped', to: 'first-word-length', transform: parseInt },
  'drop-word-min-lines': { kind: 'mapped', to: 'first-word-threshold-lines', transform: parseInt, reason: 'המקור 2; RED 3 — הייבוא משחזר את המקור' },
  'font-first-word': { kind: 'mapped', to: 'first-word-font', transform: firstFamily, reason: 'S4.5: מפתח חדש ב-RED (היה חסר)' },
  'size-first-word': { kind: 'mapped', to: 'first-word-size-em', transform: parseFloat, reason: 'S4.5: מפתח חדש ב-RED (היה כפול 2 מוקשה)' },

  // ============ דיבור המתחיל ============
  'auto-dh': { kind: 'mapped', to: 'dh-auto-detect', transform: (v) => v === true || v === 'true' },
  'font-dh': { kind: 'mapped', to: 'dh-font', transform: firstFamily },

  // ============ מצבי כותרות H0–H7 ============
  'mode-h0': { kind: 'mapped', to: 'heading-0-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h1': { kind: 'merged', to: 'heading-1-mode', transform: (v) => OPEN_MODE_MAP[v] || 'new-page', reason: 'sub_shaar ⇒ new-page + show-shaar-sub=true (השער המשנה מובנה ב-S8)' },
  'mode-h2': { kind: 'mapped', to: 'heading-2-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h3': { kind: 'mapped', to: 'heading-3-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h4': { kind: 'mapped', to: 'heading-4-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h5': { kind: 'mapped', to: 'heading-5-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h6': { kind: 'mapped', to: 'heading-6-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h7': { kind: 'mapped', to: 'heading-7-mode', transform: (v) => OPEN_MODE_MAP[v] || 'side-note' },
  'odd-h0': { kind: 'removed', reason: 'פתיחה בעמוד אי-זוגי לפי רמה — תכנון העמודים של RED מיישר פתיחות חלקים ל-recto אוטומטית; בקרה פר-רמה טרם נדרשה', issue: 'EXT-15' },
  'odd-h1': { kind: 'removed', reason: 'פתיחת H1 בעמוד אי-זוגי — RED מיישר פתיחות חלקים ל-recto אוטומטית', issue: 'EXT-15' },
  'odd-h2': { kind: 'removed', reason: 'פתיחת H2 בעמוד אי-זוגי — בקרה פר-רמה טרם נדרשה ב-RED', issue: 'EXT-15' },
  'h2-auto-siman': { kind: 'removed', reason: 'מספור סימן אוטומטי (א-ב-ג בראשי סימנים) — מנגנון לא קיים ב-RED; נרשם כפער', issue: 'EXT-16' },
  'h2-reset-siman': { kind: 'removed', reason: 'איפוס מונה סימנים לכל פרק — תלוי ב-EXT-16', issue: 'EXT-16' },
  'h2-top-distance': { kind: 'mapped', to: 'h2-top-offset', transform: pctToPx, reason: '22% מגובה תיבת התוכן (1040px ב-A4 של RED) ⇒ פיקסלים' },

  // ============ מזהי הערות (S4.5-ג — הוטמעו זה עתה) ============
  'en-line-prefix': { kind: 'mapped', to: 'en-line-prefix' },
  'fn-delim-open': { kind: 'mapped', to: 'fn-delim-open' },
  'fn-delim-close': { kind: 'mapped', to: 'fn-delim-close' },

  // ============ הערות שוליים ============
  'fn-columns': { kind: 'mapped', to: 'footnote-columns', transform: parseInt },
  'fn-layout-mode': { kind: 'mapped', to: 'fn-layout-mode' },
  'fn-reset-mode': { kind: 'mapped', to: 'footnote-reset-policy' },
  'fn-title-text': { kind: 'mapped', to: 'endnote-title-text' },
  'note-numbering-style': { kind: 'mapped', to: 'footnote-marker-style', transform: (v) => ({ 'gematria': 'hebrew-geresh', 'hebrew': 'hebrew-geresh', 'decimal': 'decimal', 'asterisk': 'asterisk', 'parenthesis': 'parenthesis' }[v] || 'hebrew-geresh') },
  'note-marker-type': { kind: 'merged', to: 'footnote-marker-style', reason: 'סוג הסמן (super) נגזר מהסגנון ב-RED; אין עילוי-נפרד נפרד' },
  'note-marker-size': { kind: 'removed', reason: 'גודל סמן נפרד — RED מגזר מגודל הגוף; נרשם כפער', issue: 'EXT-17' },
  'note-listing-num-size': { kind: 'removed', reason: 'כנ"ל — גודל מספור ברשימת ההערות', issue: 'EXT-17' },
  'note-num-separator': { kind: 'removed', reason: 'מפריד בין מספר לטקסט בהערה — RED משתמש ברווח; נרשם כפער', issue: 'EXT-17' },
  'note-rule-style': { kind: 'mapped', to: 'footnote-separator-rule', reason: 'star ⇒ star (enum זהה ב-RED)' },
  'note-header-orn-r': { kind: 'removed', reason: 'עיטור בצד ימין של כותרת עמודי-ההערות — טרם ממומש ב-RED', issue: 'EXT-4' },
  'note-header-orn-l': { kind: 'removed', reason: 'עיטור בצד שמאל של כותרת עמודי-ההערות — טרם ממומש ב-RED', issue: 'EXT-4' },

  // ============ הגנות שורות ============
  'avoid-orphans': { kind: 'merged', to: 'prevent-orphans-top', transform: (v) => v !== false, reason: 'RED מפריד יתומים עליונים/תחתונים בנפרד' },
  'avoid-widows': { kind: 'merged', to: 'prevent-widows-top', transform: (v) => v !== false, reason: 'כנ"ל' },
  'avoid-runt-word': { kind: 'mapped', to: 'runt-min-width-pct', transform: (v) => (v === false || v === 'false') ? 0 : 20, reason: 'בוליאני המקור ⇒ סף אחוז ב-RED (כבוי=0; דלוק=20%)' },

  // ============ עיטורים ============
  'h2-ornament-set': { kind: 'merged', to: 'h2-orn-top', transform: (v) => v !== 'none' ? v : 'none', reason: 'ערכת עיטורים כללית ⇒ העיטור העליון; ערכות IMUD דרך imud-orn-*' },
  'h2-ornament-top-style': { kind: 'mapped', to: 'h2-orn-top' },
  'h2-ornament-bottom-style': { kind: 'mapped', to: 'h2-orn-bottom' },
  'h2-title-orn-mode': { kind: 'mapped', to: 'h2-orn-scope', transform: (v) => ({ 'sign': 'sign', 'title': 'title', 'both': 'both', 'none': 'both' }[v] || 'both') },
  'h2-title-ornament-top-style': { kind: 'merged', to: 'h2-orn-top', reason: 'עיטור כותרת-הסימן — מוזג לעיטור הסימן (RED מאחד)' },
  'h2-title-ornament-bottom-style': { kind: 'merged', to: 'h2-orn-bottom', reason: 'עיטור כותרת-הסימן התחתון — מוזג לעיטור הסימן ב-RED' },
  'h2-title-ornament-r': { kind: 'mapped', to: 'h2-orn-side' },
  'h2-title-ornament-l': { kind: 'merged', to: 'h2-orn-side', reason: 'RED מציב עיטור צד אחד לשני הצדדים' },
  'h2-orn-fit-text': { kind: 'mapped', to: 'h2-orn-fit-to-text' },
  'h3-ornament-set': { kind: 'merged', to: 'h3-side-orn', reason: 'ערכת H3 ⇒ עיטור הצד של H3' },
  'h3-ornament-r': { kind: 'mapped', to: 'h3-side-orn' },
  'h3-ornament-l': { kind: 'merged', to: 'h3-side-orn', reason: 'עיטור צד שמאל של H3 — RED מאחד לעיטור צד יחיד' },
  'section-divider-style': { kind: 'merged', to: 'imud-divider', reason: 'מפרידי סעיפים מעוצבים — דרך ספריית IMUD (image) או heading-dividers-h3-h6; spear ⇒ עיצוב ספרייה' },
  'heading-divider-h3': { kind: 'mapped', to: 'heading-dividers-h3-h6', transform: (v) => v !== 'none' },
  'h2-orn-scope': { kind: 'mapped', to: 'h2-orn-scope' },
  'col-divider-style': { kind: 'mapped', to: 'column-divider-style', transform: (v) => DIVIDER_MAP[v] || 'none' },

  // ============ מספור ============
  'page-num-position': { kind: 'mapped', to: 'page-num-position', transform: (v) => NUMPOS_MAP[v] || 'bottom-center' },
  'page-num-format': { kind: 'mapped', to: 'page-num-format' },
  'page-num-frame': { kind: 'mapped', to: 'page-num-frame' },
  'page-num-start-idx': { kind: 'mapped', to: 'page-num-start-idx', transform: parseInt },
  'page-num-initial-value': { kind: 'mapped', to: 'page-num-initial-value', transform: parseInt },
  'main-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'RED מונה עמודי שער גלובלית (count-shaar-pages); בקרה פר-סוג טרם נפרדה', issue: 'EXT-18' },
  'main-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער ראשי — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'back-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'מניית שער אחורי — RED מונה עמודי שער גלובלית', issue: 'EXT-18' },
  'back-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער אחורי — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'sub-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'מניית שער משנה — RED מונה עמודי שער גלובלית', issue: 'EXT-18' },
  'sub-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער משנה — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'general-toc-count-numbering': { kind: 'mapped', to: 'general-toc-count-numbering' },
  'general-toc-show-numbering': { kind: 'mapped', to: 'general-toc-show-numbering' },
  'detailed-toc-count-numbering': { kind: 'mapped', to: 'detailed-toc-count-numbering' },
  'detailed-toc-show-numbering': { kind: 'mapped', to: 'detailed-toc-show-numbering' },

  // ============ שערים/ערכות נושא (בוררי האפליקציה הישנה) ============
  'style-set-select': { kind: 'ui-state', reason: 'בורר סגנון כללי בפאנל הישן; ב-RED: תבניות/ערכות נושא' },
  'active-theme-select': { kind: 'ui-state', reason: 'ערכת נושא פעילה — ב-RED: theme-set-id / imud-shaar-*' },

  // ============ כותרות עליונות (25 מפתחות hdr-*) ============
  'hdr-title-split': { kind: 'removed', reason: 'פיצול כותרת עליונה לשניים (ראש|שני) — RED מציג מקור אחד לכל מיקום; פיצול דינמי טרם ממומש', issue: 'EXT-19' },
  'hdr-alternating': { kind: 'removed', reason: 'החלפה אוטומטית recto/verso — RED מגדיר recto/verso בנפרד (header-verso-*/header-recto-*) ולכן אין צורך במתג; נשמר במעקב לצורך קיצור', issue: 'EXT-19' }
};

/** כללי משפחה — מצבי UI של האפליקציה הישנה (נשמרים כנתונים, אין אפקט מנועתי). */
const FAMILY_RULES = [
  { re: /^f-/, kind: 'ui-state', reason: 'גודל/גופן רכיב בפאנל הישן — חלק מפונקציונליות שמומשה במפתחות RED המקבילים; השאר במעקב EXT-17' },
  { re: /^s-/, kind: 'ui-state', reason: 'גודל/סגנון רכיב בפאנל הישן — מומש במפתחות RED המקבילים; השאר במעקב EXT-17' },
  { re: /^data-/, kind: 'ui-state', reason: 'נתוני בורר עיצובים/תמונות באפליקציה הישנה — ב-RED: הפניות imud: בספריית הנכסים' },
  { re: /^hdr-/, kind: 'ui-state', reason: 'קונפיגורציית כותרות עליונות בפאנל הישן — המנגנון ב-RED: header-recto/verso-*-source' },
  { re: /^builder-/, kind: 'ui-state', reason: 'מצבי בורר העיצובים (assets picker) של האפליקציה הישנה' },
  { re: /^dim-/, kind: 'ui-state', reason: 'ממדי עמוד בפאנל הישן — RED: page-size + grid-*' },
  { re: /^aq-/, kind: 'ui-state', reason: 'מצבי AutoQuality בפאנל הישן — RED: משפחת aq-*' },
  { re: /^inp-/, kind: 'ui-state', reason: 'שדות קלט בפאנל הישן (כותרות ספר וכו) — RED: imud-book-title/subtitle + מטא המסמך' },
  { re: /^(cbg|data-cbg)-/, kind: 'ui-state', reason: 'רקעי עמודים לפי מחלקה — RED: background-page-type/image/texture (REQ-ORN-08)' },
  { re: /^prop-/, kind: 'ui-state', reason: 'מאפייני עיצוב בבורר הישן' },
  { re: /^page-/, kind: 'ui-state', reason: 'הגדרות עמוד בפאנל הישן' },
  { re: /^(show|enable|select|main|back|sub|shaar|general|detailed|font|size|mode)-/, kind: 'ui-state', reason: 'מצבי UI של האפליקציה הישנה' },
  { re: /^heading-divider-h[3-9]$/, kind: 'mapped', to: 'heading-dividers-h3-h6', transform: (v) => v !== 'none', reason: 'מפרידי כותרות H3–H6 — RED מפעיל/מכבה את המשפחה כולה' }
];

/** קבלת disposition למפתח — מפורש מהטבלה, או כלל משפחה. @returns {object|null} */
function dispositionOf(oldKey) {
  if (DISPOSITIONS[oldKey]) return DISPOSITIONS[oldKey];
  for (const r of FAMILY_RULES) if (r.re.test(oldKey)) return { kind: r.kind, reason: r.reason };
  return null;
}

/**
 * ייבוא קובץ הגדרות IMUD (או תבנית משתמש ישנה) להגדרות RED.
 * @param {object} legacy — אובייקט ההגדרות הישן (key→value)
 * @param {object} [registryKeys] — Set/מערך מפתחות RED חוקיים (לסינון); אם לא — ללא סינון
 * @returns {{settings:object, dispositions:object, unmapped:string[], report:{mapped:number,merged:number,uiState:number,removed:number}}}
 */
function importImudSettings(legacy, registryKeys) {
  const settings = {};
  const dispositions = {};
  const unmapped = [];
  const report = { mapped: 0, merged: 0, uiState: 0, removed: 0 };
  const valid = registryKeys instanceof Set ? registryKeys : (Array.isArray(registryKeys) ? new Set(registryKeys) : null);
  for (const [k, v] of Object.entries(legacy || {})) {
    const d = dispositionOf(k);
    if (!d) { unmapped.push(k); continue; }
    dispositions[k] = d;
    if ((d.kind === 'mapped' || d.kind === 'merged') && d.to) {
      if (valid && !valid.has(d.to)) { unmapped.push(`${k}->${d.to}(!)`); continue; }
      settings[d.to] = d.transform ? d.transform(v) : v;
      report[d.kind]++;
    } else {
      report[d.kind === 'ui-state' ? 'uiState' : d.kind === 'removed' ? 'removed' : 'merged']++;
    }
  }
  // מיזוג משלים: mode-h1=sub_shaar ⇒ שער משנה דלוק (הסמנטיקה המקורית)
  if (legacy && legacy['mode-h1'] === 'sub_shaar') settings['show-shaar-sub'] = true;
  return { settings, dispositions, unmapped, report };
}

module.exports = { DISPOSITIONS, dispositionOf, importImudSettings, firstFamily, pctToPx };
