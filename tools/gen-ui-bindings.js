#!/usr/bin/env node
// tools/gen-ui-bindings.js — מחולל מניפסט כיתובים לפאנל ההגדרות (S10.1-2, REQ-UI-07)
// פלט: red-build/src/ui/bindings.generated.js — מכיל מילולית את כל מזהי הפקדים
// (סורק dead-control דורש זאת) + תוויות עבריות לחיפוש + מטא־נתוני רינדור.
// הרצה: node tools/gen-ui-bindings.js  (מ־שורש הריפו; גם מ־red-build עם נתיב יחסי)
'use strict';

const path = require('path');
const fs = require('fs');

const RED = path.resolve(__dirname, '..', 'red-build');
const { registry, PANELS } = require(path.join(RED, 'src', 'engine', 'core', 'settings-registry'));

// ---------- תוויות עבריות (מקור החיפוש — REQ-UI-07: "חיפוש לפי שם עברי") ----------
const L = {
  // GRID
  'page-size': 'גודל עמוד', 'grid-col-width-pct': 'רוחב טור (%)', 'grid-margin-side-pct': 'שוליים צדדיים (%)',
  'grid-gutter-pct': 'מרווח בין טורים (%)', 'grid-block-gap-pct': 'מרווח בין בלוקים (%)',
  'margin-top-px': 'שוליים עליונים (px)', 'margin-bottom-px': 'שוליים תחתונים (px)',
  'binding-offset-px': 'שולי תפירה (px)', 'h2-top-offset': 'מרחק עליון H2 (px)',
  'column-divider-style': 'סגנון מפריד טורים', 'page-num-format': 'תבנית מספור עמודים',
  'page-num-frame': 'מסגרת מספר עמוד', 'page-num-position': 'מיקום מספר עמוד',
  'page-num-initial-value': 'ערך התחלתי של מספור', 'page-num-start-idx': 'עמוד תחילת התצוגה (סוד)',
  'count-shaar-pages': 'מניית עמודי שער במספור', 'count-toc-pages': 'מניית עמודי תוכן־עניינים',
  'count-endnote-pages': 'מניית עמודי הערות־סיום',
  // TYPO
  'body-font': 'גופן גוף הטקסט', 'body-font-size-pt': 'גודל גוף הטקסט (pt)',
  'body-line-height': 'גובה שורה (יחס)', 'paren-style-scale': 'סקאלת סוגריים',
  'first-word-mode': 'אופן מילה ראשונה', 'first-word-length': 'אורך מילה ראשונה (מילים)',
  'first-word-threshold-lines': 'סף שורות למילה ראשונה', 'first-word-align-cap-top': 'יישור מילה ראשונה לקו בסיס גוף',
  'dh-auto-detect': 'זיהוי אוטומטי של דיבור־המתחיל', 'dh-font': 'גופן דיבור־המתחיל',
  'body-last-line-align': 'יישור שורה אחרונה בפסקה',
  // HEADINGS (משפחות מיוצרות להלן) + hdr-h1-title-mode
  'hdr-h1-title-mode': 'אופן כותרת H1 בכותרת עליונה',
  // HEADERS
  'header-enabled': 'כותרות עליונות מופעלות',
  'header-recto-right-source': 'עמוד ימני — מקור ימין', 'header-recto-center-source': 'עמוד ימני — מקור מרכז', 'header-recto-left-source': 'עמוד ימני — מקור שמאל',
  'header-verso-right-source': 'עמוד שמאלי — מקור ימין', 'header-verso-center-source': 'עמוד שמאלי — מקור מרכז', 'header-verso-left-source': 'עמוד שמאלי — מקור שמאל',
  'header-verso-same-as-recto': 'עמוד שמאלי זהה לימני', 'header-separator-line': 'קו הפרדה בכותרת עליונה',
  'header-opening-dedicated': 'כותרת ייעודית לעמודי פתיחה',
  'header-opening-right-source': 'פתיחה — מקור ימין', 'header-opening-center-source': 'פתיחה — מקור מרכז', 'header-opening-left-source': 'פתיחה — מקור שמאל',
  // NOTES
  'note-placement-mode': 'אופן הצבת הערות', 'footnotes-enabled': 'הערות שוליים מופעלות',
  'footnote-marker-style': 'סגנון סמן הערה', 'footnote-reset-policy': 'מדיניות איפוס מונה הערות',
  'footnote-columns': 'מספר טורי הערות שוליים', 'footnote-separator-rule': 'קו הפרדה של סרגל הערות',
  'fn-layout-mode': 'אופן פריסת הערות (בלוק/רציף)', 'endnotes-enabled': 'הערות סיום מופעלות',
  'endnote-title-text': 'כותרת עמודי הערות', 'endnote-columns': 'מספר טורי הערות־סיום',
  'f-note-body-font': 'גופן גוף הערת־שוליים', 's-note-body-font': 'גופן גוף הערת־צד',
  'fn-bar-max-height-px': 'תקרת גובה סרגל הערות (px)', 'long-footnote-policy': 'מדיניות הערה ארוכה',
  // QUALITY
  'prevent-widows-top': 'מנע אלמנות בראש עמוד', 'prevent-widows-bottom': 'מנע אלמנות בסוף עמוד',
  'prevent-orphans-top': 'מנע יתומים בראש עמוד', 'prevent-orphans-bottom': 'מנע יתומים בסוף עמוד',
  'widow-strictness': 'מחמירות אלמנות/יתומים', 'runt-min-width-pct': 'רוחב מזערי לשורת־שדון (%)',
  'balance-chapter-end': 'איזון סוף פרק', 'allow-terminal-residual-fallback': 'שארית סופית מותרת כנפילה',
  'imbalance-max-delta-px': 'סף אי־איזון טורים (px)', 'aq-enabled': 'איכות אוטומטית (AQ) מופעלת',
  'aq-word-spacing-min': 'AQ — ריווח מילים מזערי', 'aq-word-spacing-max': 'AQ — ריווח מילים מקסימלי',
  'aq-letter-spacing-min': 'AQ — ריווח אותיות מזערי', 'aq-letter-spacing-max': 'AQ — ריווח אותיות מקסימלי',
  'aq-heading-spacing-min': 'AQ — ריווח כותרות מזערי', 'aq-heading-spacing-max': 'AQ — ריווח כותרות מקסימלי',
  'aq-shared-load': 'AQ — עומס משותף', 'aq-stretch-to-bottom': 'AQ — מתיחה עד תחתית',
  'aq-overshoot-clamp-px': 'AQ — תקרת חריגה (px)', 'aq-compress-first': 'AQ — כיווץ לפני מתיחה',
  // ORNAMENTS
  'h2-orn-scope': 'היקף עיטורי H2', 'h2-orn-top': 'עיטור עליון לסימן H2', 'h2-orn-bottom': 'עיטור תחתון לסימן H2',
  'h2-orn-side': 'עיטור צד לכותרת H2', 'h2-orn-fit-to-text': 'התאמת עיטור H2 לטקסט',
  'h3-side-orn': 'עיטורי צד H3', 'h3-side-orn-height-em': 'גובה עיטור צד H3 (em)',
  'chapter-end-ornament': 'עיטור סוף פרק', 'chapter-end-ornament-w-em': 'רוחב עיטור סוף פרק (em)',
  'chapter-end-ornament-h-em': 'גובה עיטור סוף פרק (em)', 'heading-dividers-h3-h6': 'מפרידי כותרות H3–H6',
  'shaar-main-divider': 'קו מפריד בשער ראשי', 'shaar-sub-divider': 'קו מפריד בשער משנה',
  // TOC
  'toc-general-enabled': 'תוכן־עניינים כללי מופעל', 'toc-detail-enabled': 'תוכן־עניינים מפורט מופעל',
  'general-toc-count-numbering': 'מספור שורות תוכן כללי', 'detailed-toc-count-numbering': 'מספור שורות תוכן מפורט',
  'general-toc-show-numbering': 'תצוגת גיליון בעמודי תוכן כלליים', 'detailed-toc-show-numbering': 'תצוגת גיליון בעמודי תוכן מפורטים',
  // THEMES
  'background-color': 'צבע רקע העמוד', 'background-opacity': 'אטימות רקע',
  'theme-set-id': 'ערכת נושא פעילה', 'show-shaar-sub': 'הצג שער משנה',
  // **03.11(ד):** שערים כברירת מחדל + תוכן שערים מובנה (דיווח משתמש 3)
  'shaar-main-enabled': 'שער ראשי מופעל (כמקור)', 'shaar-sub-enabled': 'שער־משנה לכל חלק (כמקור)',
  'shaar-title-font': 'שער — גופן כותרת הספר', 'shaar-title-size-pt': 'שער — גודל כותרת הספר (pt)',
  'shaar-subtitle-font': 'שער — גופן כותרת־משנה', 'shaar-subtitle-size-pt': 'שער — גודל כותרת־משנה (pt)',
  'shaar-desc-font': 'שער — גופן התיאור', 'shaar-desc-size-pt': 'שער — גודל התיאור (pt)',
  'shaar-sections-font': 'שער — גופן פרטי מהדורא', 'shaar-sections-size-pt': 'שער — גודל פרטי מהדורא (pt)',
  'shaar-author-font': 'שער — גופן שם המחבר', 'shaar-author-size-pt': 'שער — גודל שם המחבר (pt)',
  'shaar-year-font': 'שער — גופן מקום ושנה', 'shaar-year-size-pt': 'שער — גודל מקום ושנה (pt)',
  'shaar-back-text-font': 'שער אחורי — גופן הטקסט', 'shaar-back-text-size-pt': 'שער אחורי — גודל הטקסט (pt)',
  'imud-book-title': 'שם הספר (שער)', 'imud-book-subtitle': 'כותרת־משנה (שער)',
  'imud-book-desc': 'תיאור (שער — נושא מפורט)', 'imud-book-sections': 'פרטי מהדורא (שער)',
  'imud-book-author': 'שם המחבר (שער)', 'imud-book-year': 'מקום ושנת הוצאה (שער)',
  'shaar-back-text': 'טקסט השער האחורי (שמירת זכויות)',
  'shaar-main-image': 'תמונת שער ראשי', 'shaar-sub-image': 'תמונת שער משנה',
  'shaar-back-enabled': 'שער אחורי מופעל', 'background-page-type': 'מחלקת עמוד לרקע',
  'background-image': 'תמונת רקע', 'background-texture': 'טקסטורת רקע',
  'background-inset-mm': 'שקיעת רקע מהשוליים (מ״מ)',
  // ADVANCED
  'trace-verbosity': 'רמת תיעוד מסלול (trace)', 'diagnostics-enabled': 'אבחון מופעל',
  'offline-guard': 'שומר נתק־מהרשת (exit 7)', 'debounce-light-change-ms': 'השהיית שינויים קלים (ms)',
  // **S4.5/EXT-14 (03.11):** נכסי IMUD + מזהי טקסט מוגדרים
  'imud-shaar-main': 'עיצוב שער ראשי (ספריית IMUD)', 'imud-shaar-sub': 'עיצוב שער משנה (ספריית IMUD)',
  'imud-shaar-back': 'עיצוב שער אחורי (ספריית IMUD)', 'imud-orn-top': 'עיטור עליון H2 (IMUD)',
  'imud-orn-bottom': 'עיטור תחתון H2 (IMUD)', 'imud-orn-side': 'עיטור צדדי (IMUD)',
  'imud-chapter-end': 'עיטור סיום פרק (IMUD)', 'imud-divider': 'מפריד מעוצב (IMUD)',
  'imud-book-title': 'כותרת הספר בשער (עקיפה)', 'imud-book-subtitle': 'כותרת־משנה בשער',
  'en-line-prefix': 'קידומת הערת סיום (ריק = ביטול)', 'fn-delim-open': 'תוחם פתיחת הערת שוליים',
  'fn-delim-close': 'תוחם סגירת הערת שוליים'
};

// משפחות שיטתיות — תוויות מיוצרות
const HEB_NUM = ['אפס', '1', '2', '3', '4', '5', '6', '7'];
function labelFor(id) {
  if (L[id]) return L[id];
  let m;
  if ((m = id.match(/^heading-(\d)-(mode|font|size-pt)$/))) {
    const what = { 'mode': 'אופן', 'font': 'גופן', 'size-pt': 'גודל (pt)' }[m[2]];
    return `כותרת ${HEB_NUM[+m[1]]} — ${what}`;
  }
  if ((m = id.match(/^header-(recto|verso)-(right|center|left)-(align|width-pct|font|size-pt|custom-text)$/))) {
    const side = { recto: 'עמוד ימני', verso: 'עמוד שמאלי' }[m[1]];
    const pos = { right: 'ימין', center: 'מרכז', left: 'שמאל' }[m[2]];
    const what = { 'align': 'יישור', 'width-pct': 'רוחב (%)', 'font': 'גופן', 'size-pt': 'גודל (pt)', 'custom-text': 'טקסט מותאם' }[m[3]];
    return `${side} — סלוט ${pos} — ${what}`;
  }
  if ((m = id.match(/^toc-level-(\d)-(show|inline)$/))) {
    const what = { 'show': 'הצגה', 'inline': 'שורה משורטטת (inline)' }[m[2]];
    return `רמת תוכן ${m[1]} — ${what}`;
  }
  return id; // נפילה לאחור: מזהה גולמי (עדיין ניתן לחיפוש)
}

// 12 הפאנלים (Z2) — כולל שני פאנלי־פעולה ללא מפתחות רישום
const PANEL_ORDER = [
  { key: 'THEMES', label: PANELS.THEMES, kind: 'settings' },
  { key: 'BUILDER', label: PANELS.BUILDER, kind: 'action' },
  { key: 'IMPORTS', label: PANELS.IMPORTS, kind: 'action' },
  { key: 'NOTES', label: PANELS.NOTES, kind: 'settings' },
  { key: 'QUALITY', label: PANELS.QUALITY, kind: 'settings' },
  { key: 'TYPO', label: PANELS.TYPO, kind: 'settings' },
  { key: 'HEADINGS', label: PANELS.HEADINGS, kind: 'settings' },
  { key: 'ORNAMENTS', label: PANELS.ORNAMENTS, kind: 'settings' },
  { key: 'HEADERS', label: PANELS.HEADERS, kind: 'settings' },
  { key: 'TOC', label: PANELS.TOC, kind: 'settings' },
  { key: 'GRID', label: PANELS.GRID, kind: 'settings' },
  { key: 'EXPORT', label: PANELS.EXPORT, kind: 'settings' },
  { key: 'ADVANCED', label: PANELS.ADVANCED, kind: 'settings' }
];

const bindings = registry.map(r => ({
  id: r.id,
  control: r.control,
  panel: r.panel,
  panelKey: Object.entries(PANELS).filter(([, v]) => v === r.panel).map(([k]) => k)[0] || null,
  labelHe: labelFor(r.id),
  type: r.type,
  def: r.default,
  enum: r.enum || null,
  min: r.min != null ? r.min : null,
  max: r.max != null ? r.max : null,
  step: r.step != null ? r.step : null,
  note: r.note || null
}));

const out = `// src/ui/bindings.generated.js — **נוצר אוטומטית** ע"י tools/gen-ui-bindings.js (אין לערוך ידנית)
// מקור: src/engine/core/settings-registry.js. מכיל מילולית את כל מזהי הפקדים —
// דרישת סורק dead-control (REQ-GOV-04) — ותוויות עבריות לחיפוש ההגדרות (REQ-UI-07).
// רינדור: settings-panel.js בונה את 12 הפאנלים (Z2) מהמניפסט הזה בלבד.
'use strict';

const BINDINGS = ${JSON.stringify(bindings, null, 2)};

const PANELS = ${JSON.stringify(PANEL_ORDER, null, 2)};

module.exports = { BINDINGS, PANELS };
`;

const outPath = path.join(RED, 'src', 'ui', 'bindings.generated.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`gen-ui-bindings: ${bindings.length} bindings, ${PANEL_ORDER.length} panels → ${path.relative(process.cwd(), outPath)}`);
// אימות: כל מזהה פקד מופיע מילולית (סורק dead-control יעבור)
const missing = registry.filter(r => !out.includes(`"${r.control}"`));
if (missing.length) { console.error('MISSING CONTROLS:', missing.map(m => m.control)); process.exit(1); }
console.log('all control ids present literally ✓');
