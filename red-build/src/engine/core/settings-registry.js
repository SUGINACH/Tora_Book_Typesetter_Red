// src/engine/core/settings-registry.js — Three-layer settings contract (REQ-GOV-04, D-07)
// מקור־האמת היחיד: פקד ↔ מפתח ↔ מנגנון ↔ בדיקה. נבו from this file: default_settings.json + HTML bindings + docs.
'use strict';

const P = {
  THEMES: 'ערכות נושא, שערים ורקעים',
  BUILDER: 'בונה ערכות נושא (SVG Builder)',
  IMPORTS: 'ייבוא תוספים',
  NOTES: 'הערות שוליים וסיום',
  QUALITY: 'איכות עימוד',
  TYPO: 'טיפוגרפיה וגוף הטקסט',
  HEADINGS: 'כותרות 0–7',
  ORNAMENTS: 'עיטורים וגרפיקה',
  HEADERS: 'כותרות עליונות',
  TOC: 'תוכן העניינים',
  GRID: 'רשת העמוד ומספור',
  EXPORT: 'ייצוא (HTML/PDF/ZIP) ומדידה',
  ADVANCED: 'מתקדם/מנוע'
};

// T = types; C = consumers (mechanism ids); X = effect-test id
const K = (id, type, dflt, panel, control, consumers, testId, extra = {}) =>
  ({ id, type, default: dflt, panel, control, consumers, effect_test: testId, ...extra });

// **S9 (D-61):** מקורות כותרת עליונה — כולל book-name-rest (החלק שאחרי המקף) ופורט
// fillHeaderFirstLastWords המאוחד (first-last-words). משותף ל‑6 סלוטים + 3 סלוטי פתיחה.
const HDR_SOURCES = ['none', 'book-name', 'book-name-rest', 'h1', 'h2', 'page-num', 'first-word', 'last-word', 'first-last-words', 'custom'];

const registry = [
  // ---- רשת העמוד ומספור (GRID) ----
  K('page-size', 'enum', 'A4', P.GRID, 'sel-page-size', ['layout/page-templates'], 'fx:page-size', { enum: ['A4', 'A5', '16x16', 'custom'] }),
  K('grid-col-width-pct', 'number', 40, P.GRID, 'rng-col-width', ['layout/column-flow'], 'fx:col-width', { min: 20, max: 60 }),
  K('grid-margin-side-pct', 'number', 7.5, P.GRID, 'rng-margin-side', ['layout/page-templates'], 'fx:margin-side', { min: 2, max: 20 }),
  K('grid-gutter-pct', 'number', 2, P.GRID, 'rng-gutter', ['layout/column-flow'], 'fx:gutter', { min: 0.5, max: 8 }),
  K('grid-block-gap-pct', 'number', 2, P.GRID, 'rng-block-gap', ['layout/candidate-generator'], 'fx:block-gap', { min: 0, max: 8 }),
  K('margin-top-px', 'number', 20, P.GRID, 'rng-margin-top', ['layout/page-templates'], 'fx:margin-top'),
  K('margin-bottom-px', 'number', 20, P.GRID, 'rng-margin-bottom', ['layout/page-templates'], 'fx:margin-bottom'),
  K('binding-offset-px', 'number', 0, P.GRID, 'rng-binding-offset', ['layout/page-templates'], 'fx:binding', { note: 'שולי תפירה א־סימטריים recto/verso' }),
  K('h2-top-offset', 'number', 33, P.GRID, 'rng-h2-top-offset', ['layout/page-templates'], 'fx:h2-top-offset', { note: 'PT-05: מרחק עליון נפרד H2' }),
  K('column-divider-style', 'enum', 'none', P.GRID, 'sel-col-divider', ['decoration/dividers'], 'fx:col-divider', { enum: ['none', 'thin', 'dashed', 'double'], note: 'גובה = Math.min(שני הטורים) − 8px' }),
  K('page-num-format', 'enum', 'hebrew', P.GRID, 'sel-page-num-format', ['decoration/folio'], 'fx:folio-format', { enum: ['hebrew', 'decimal', 'daf-hebrew'] }),
  // **S9 (D-61):** square/circle = מסגרות CSS (badge); parenthesis/squares = סוגריים טקסטואליים —
  // הפרדה נאמנה ל־V1 (page-num-frame-box/circle CSS) ול־Mapping פנייה 2 (parens/squares טקסט).
  K('page-num-frame', 'enum', 'none', P.GRID, 'sel-page-num-frame', ['decoration/folio'], 'fx:folio-frame', { enum: ['none', 'circle', 'square', 'parenthesis', 'squares', 'floral', 'diamond'] }),
  K('page-num-position', 'enum', 'bottom-center', P.GRID, 'sel-page-num-position', ['decoration/folio'], 'fx:folio-pos', { enum: ['bottom-center', 'outer-left', 'outer-right', 'top', 'in-header', 'none'] }),
  K('page-num-initial-value', 'number', 1, P.GRID, 'inp-page-num-initial', ['decoration/folio'], 'fx:folio-initial', { note: 'שוחזר מ‑V1 (REQ-HDR-03)' }),
  // **S9 (D-61):** page-num-start-idx — שחזור V1 מלא (REQ-HDR-03): מספור מוצג רק מסוד ה‑counted
  // הזה ואילך; הערך האפקטיבי = סוד − start‑idx + initial‑value (נוסחת V1 formatPageNumberDisplay).
  K('page-num-start-idx', 'number', 1, P.GRID, 'inp-page-num-start-idx', ['decoration/folio'], 'fx:folio-start-idx', { min: 1, max: 999, note: 'שוחזר מ‑V1 (REQ-HDR-03): סוד העמוד הנספר שממנו מתחיל התצוגה' }),
  K('count-shaar-pages', 'bool', false, P.GRID, 'chk-count-shaar', ['decoration/folio'], 'fx:count-shaar'),
  K('count-toc-pages', 'bool', false, P.GRID, 'chk-count-toc', ['decoration/folio'], 'fx:count-toc'),
  K('count-endnote-pages', 'bool', false, P.GRID, 'chk-count-endnotes', ['decoration/folio', 'core/pipeline'], 'fx:count-endnotes', { note: 'S7.1.1: אם true — עמודי הערות נספרים במספור ומקבלים גיליון' }),

  // ---- טיפוגרפיה (TYPO) ----
  K('body-font', 'font', 'Frank Ruhl Libre', P.TYPO, 'sel-body-font', ['typography/measure-api'], 'fx:body-font', { note: 'font-picker preserve-missing-value (IMUD port)' }),
  K('body-font-size-pt', 'number', 14, P.TYPO, 'rng-body-size', ['typography/measure-api'], 'fx:body-size', { min: 9, max: 24 }),
  K('body-line-height', 'number', 1.4, P.TYPO, 'rng-body-lh', ['typography/kp-linebreak'], 'fx:body-lh', { min: 1.2, max: 1.6, note: 'פלפול 1.25 / קריאה 1.45' }),
  // D-42 (P1-2): קדם־פאס סוגריים לפני מדידה — REQ-PAR-ST-02. סקאלה 1.0 = כבוי (ברירת מחדל, לא משנה hash).
  K('paren-style-scale', 'number', 1, P.TYPO, 'rng-paren-scale', ['core/pipeline', 'output/dom-renderer'], 'fx:paren-scale', { min: 0.8, max: 1, step: 0.01, note: 'מילים בתוך (...) נמדדות בסקאלה זו לפני שבירת שורות ומרונדרות במחלקת w--paren; 1.0 = כבוי' }),
  K('first-word-mode', 'enum', 'drop', P.TYPO, 'sel-first-word-mode', ['typography/dropword'], 'fx:fw-mode', { enum: ['drop', 'inline', 'bold', 'none'] }),
  K('first-word-length', 'number', 1, P.TYPO, 'sel-first-word-len', ['typography/dropword'], 'fx:fw-len', { enum: [1, 2] }),
  K('first-word-threshold-lines', 'number', 3, P.TYPO, 'rng-fw-threshold', ['typography/dropword'], 'fx:fw-threshold', { min: 2, max: 6 }),
  K('first-word-align-cap-top', 'bool', true, P.TYPO, 'chk-fw-cap-align', ['typography/dropword'], 'fx:fw-cap', { note: 'REQ-LB-05: קצה עליון לקו בסיס גוף — לא baseline' }),
  K('first-word-size-em', 'number', 2, P.TYPO, 'rng-fw-size-em', ['typography/dropword'], 'fx:fw-size-em', { min: 1, max: 4, step: 0.1, note: 'S4.5: גודל המילה הראשונה ב-em (המקור: size-first-word=1.5; בעבר היה כפול 2 מוקשה)' }),
  K('first-word-font', 'font', '', P.TYPO, 'sel-fw-font', ['typography/dropword'], 'fx:fw-font', { note: 'S4.5: גופן נפרד למילה הראשונה (המקור: font-first-word=FrankReal); ריק = גופן הגוף' }),
  K('dh-auto-detect', 'bool', true, P.TYPO, 'chk-dh-detect', ['parser/block-tokenizer'], 'fx:dh-detect', { note: 'דיבור המתחיל עד נקודה/מקף' }),
  K('dh-font', 'font', 'David HB', P.TYPO, 'sel-dh-font', ['typography/measure-api'], 'fx:dh-font'),
  K('body-last-line-align', 'enum', 'center', P.TYPO, 'sel-last-line-align', ['output/dom-renderer'], 'fx:last-line-align', { enum: ['center', 'right', 'stretch'], note: 'wiring מ‑Orange ✓' }),

  // ---- כותרות 0–7 (HEADINGS) ----
  // **03.11(ד):** ברירות המחדל של המצבים נאמנות למקור: h3=span_1col ⇒ full-width
  // (פס חוצה־טורים), h4–h6=inline_2col ⇒ regular (בתוך הטור — שם נשתלים עיטורי
  // הצד והמפרידים), h7=side_note ⇒ side-note. בעבר כולן full-width — ואז כותרת
  // שנמדדה ב-674px הוצבה בטור 270px (גלישה/חפיפה — דיווח משתמש 3).
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(h => [
    K(`heading-${h}-mode`, 'enum', h === 7 ? 'side-note' : h >= 4 ? 'regular' : 'full-width', P.HEADINGS, `sel-h${h}-mode`, ['layout/headings-escort'], `fx:h${h}-mode`, { enum: ['full-width', 'regular', 'side-note', 'new-page'] }),
    K(`heading-${h}-font`, 'font', 'David HB', P.HEADINGS, `sel-h${h}-font`, ['typography/measure-api'], `fx:h${h}-font`),
    K(`heading-${h}-size-pt`, 'number', [20, 18, 16, 15, 14, 14, 13, 12][h], P.HEADINGS, `rng-h${h}-size`, ['typography/measure-api'], `fx:h${h}-size`, { min: 8, max: 48 }),
  ]),
  // D-45→D-54: h2-orn-scope חזר בסעיף העיטורים להלן עם מנגנום חי (S8).
  K('hdr-h1-title-mode', 'enum', 'main', P.HEADERS, 'sel-hdr-h1-mode', ['decoration/headers-builder'], 'fx:hdr-h1-mode', { enum: ['main', 'full'], note: 'K-8: main כברירת מחדל + toggle' }),

  // ---- כותרות עליונות (HEADERS) ----
  // **S9 (D-61):** עצמאות מלאה 3×2 (REQ-HDR-01) — לכל סלוט: מקור/יישור/גופן/גודל/רוחב%/טקסט־מותאם.
  // תיקון bc7892f (IMUD) נעול: לסלוט המרכזי בו־ורסו יש גופן/גודל/טקסט משלו — לא יורש מה־recto.
  K('header-enabled', 'bool', true, P.HEADERS, 'chk-header-enabled', ['decoration/headers-builder'], 'fx:header-on'),
  K('header-recto-right-source', 'enum', 'book-name', P.HEADERS, 'sel-hr-right', ['decoration/headers-builder'], 'fx:hr-right', { enum: HDR_SOURCES }),
  K('header-recto-center-source', 'enum', 'h2', P.HEADERS, 'sel-hr-center', ['decoration/headers-builder'], 'fx:hr-center', { enum: HDR_SOURCES }),
  K('header-recto-left-source', 'enum', 'h1', P.HEADERS, 'sel-hr-left', ['decoration/headers-builder'], 'fx:hr-left', { enum: HDR_SOURCES }),
  K('header-verso-right-source', 'enum', 'h1', P.HEADERS, 'sel-hv-right', ['decoration/headers-builder'], 'fx:hv-right', { enum: HDR_SOURCES }),
  K('header-verso-center-source', 'enum', 'h2', P.HEADERS, 'sel-hv-center', ['decoration/headers-builder'], 'fx:hv-center', { enum: HDR_SOURCES }),
  K('header-verso-left-source', 'enum', 'book-name', P.HEADERS, 'sel-hv-left', ['decoration/headers-builder'], 'fx:hv-left', { enum: HDR_SOURCES }),
  K('header-verso-same-as-recto', 'bool', false, P.HEADERS, 'chk-hv-same', ['decoration/headers-builder'], 'fx:hv-same', { note: 'same_as_even + גידוע מעגליות (Orange c49b79e) — resolveSameAs עם seen-set' }),
  K('header-separator-line', 'enum', 'gray', P.HEADERS, 'sel-header-sep', ['decoration/headers-builder'], 'fx:header-sep', { enum: ['none', 'gray', 'black'] }),
  // **S9 (REQ-HDR-02):** כותרת ייעודית לעמודים הפותחים בכותרת H2/H3 — סלוטי מקור נפרדים
  // (יישור/רוחב/גופן/גודל יורשים מהצד הפיזי של העמוד — D-61).
  K('header-opening-dedicated', 'bool', false, P.HEADERS, 'chk-hdr-opening', ['decoration/headers-builder'], 'fx:hdr-opening', { note: 'REQ-HDR-02: עמוד הנפתח בכותרת H2/H3 מקבל את שלושת סלוטי הפתיחה שלהלן' }),
  K('header-opening-right-source', 'enum', 'none', P.HEADERS, 'sel-ho-right', ['decoration/headers-builder'], 'fx:ho-right', { enum: HDR_SOURCES }),
  K('header-opening-center-source', 'enum', 'book-name', P.HEADERS, 'sel-ho-center', ['decoration/headers-builder'], 'fx:ho-center', { enum: HDR_SOURCES }),
  K('header-opening-left-source', 'enum', 'none', P.HEADERS, 'sel-ho-left', ['decoration/headers-builder'], 'fx:ho-left', { enum: HDR_SOURCES }),
  ...['recto', 'verso'].flatMap(side => ['right', 'center', 'left'].flatMap(pos => [
    K(`header-${side}-${pos}-align`, 'enum', pos === 'right' ? 'right' : pos === 'left' ? 'left' : 'center', P.HEADERS, `sel-h${side[0]}${pos}-align`, ['decoration/headers-builder'], `fx:${side}-${pos}-align`, { enum: ['right', 'center', 'left'] }),
    K(`header-${side}-${pos}-width-pct`, 'number', 33, P.HEADERS, `rng-h${side[0]}${pos}-width`, ['decoration/headers-builder'], `fx:${side}-${pos}-width`, { min: 5, max: 90 }),
    // **S9 (D-61):** גופן/גודל/טקסט מותאם לכל סלוט — עצמאות מלאה (bc7892f locked forever)
    K(`header-${side}-${pos}-font`, 'font', 'David HB', P.HEADERS, `sel-h${side[0]}${pos}-font`, ['decoration/headers-builder'], `fx:${side}-${pos}-font`),
    K(`header-${side}-${pos}-size-pt`, 'number', 11, P.HEADERS, `rng-h${side[0]}${pos}-size`, ['decoration/headers-builder'], `fx:${side}-${pos}-size`, { min: 6, max: 28 }),
    K(`header-${side}-${pos}-custom-text`, 'string', '', P.HEADERS, `inp-h${side[0]}${pos}-custom`, ['decoration/headers-builder'], `fx:${side}-${pos}-custom`),
  ])),

  // ---- הערות (NOTES) ----
  K('note-placement-mode', 'enum', 'footnotes', P.NOTES, 'sel-note-mode', ['core/pipeline', 'layout/dp-planner', 'layout/endnote-pages'], 'fx:note-mode', { enum: ['footnotes', 'endnotes', 'inline'] }),
  K('footnotes-enabled', 'bool', true, P.NOTES, 'chk-fn-enabled', ['layout/footnote-budget', 'core/pipeline'], 'fx:fn-on', { note: 'D-39: קלט משתמש מפורש גובר על נגזרות; mode=footnotes + false ⇒ ההערות בגוף כplaceholder' }),
  K('footnote-marker-style', 'enum', 'hebrew-geresh', P.NOTES, 'sel-fn-marker', ['notes/markers'], 'fx:fn-marker', { enum: ['hebrew-geresh', 'parenthesis', 'asterisk', 'decimal'] }),
  K('footnote-reset-policy', 'enum', 'section', P.NOTES, 'sel-fn-reset', ['notes/markers'], 'fx:fn-reset', { enum: ['continuous', 'page', 'section', 'part'], note: 'S4.26 (דיווח משתמש 05.11): ברירת המחדל איפוס פר-פרק (section/siman) — לא פר-עמוד' }),
  K('footnote-columns', 'number', 1, P.NOTES, 'sel-fn-cols', ['layout/footnote-budget'], 'fx:fn-cols', { enum: [1, 2] }),
  K('footnote-separator-rule', 'enum', 'regular', P.NOTES, 'sel-fn-rule', ['output/dom-renderer'], 'fx:fn-rule', { enum: ['none', 'regular', 'circles', 'sparkle', 'star', 'diamond'] }),
  K('fn-layout-mode', 'enum', 'continuous', P.NOTES, 'sel-fn-layout', ['layout/dp-planner', 'output/dom-renderer'], 'fx:fn-layout', { enum: ['block', 'continuous'], note: 'S4.26 (דיווח משתמש 05.11): ברירת המחדל זרימה רציפה — הערה הבאה פותחת באותה שורה שבה הסתיימה קודמתה; block=כל הערה בלוק משלה' }),
  K('endnotes-enabled', 'bool', false, P.NOTES, 'chk-endnotes', ['layout/endnote-pages'], 'fx:endnotes-on', { note: 'נגזר מ‑note-placement-mode=endnotes (D-39); קלט ישן true ממופה ל‑mode=endnotes בהגירה (project-io)' }),
  K('endnote-title-text', 'string', 'הערות', P.NOTES, 'inp-endnote-title', ['layout/endnote-pages'], 'fx:endnote-title'),
  K('endnote-columns', 'number', 1, P.NOTES, 'sel-en-cols', ['layout/endnote-pages'], 'fx:en-cols', { enum: [1, 2], note: 'S7.1.1: טור אחד או שניים בעמודי הערות' }),
  K('f-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-fnote-body-font', ['layout/footnote-budget'], 'fx:fnote-body-font'),
  K('s-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-snote-body-font', ['layout/side-notes'], 'fx:snote-body-font'),
  K('fn-bar-max-height-px', 'number', 0, P.NOTES, 'rng-fn-bar-max', ['layout/dp-planner'], 'fx:fn-bar-max', { min: 0, max: 1000, note: 'S4.26 (דיווח משתמש 05.11): 0=קיבולת העמוד המלאה (ברירת המחדל — הערה ארוכה ממלאת את העמוד לפני חיתוך); ערך חיובי נחתם לקיבולת' }),
  K('long-footnote-policy', 'enum', 'split', P.NOTES, 'sel-long-fn', ['layout/dp-planner'], 'fx:long-fn', { enum: ['split', 'move-whole', 'reject-to-body'], note: 'REQ-FN-02; split=המשך במרזב העמוד הבא עם סימון המשך; reject-to-body=השבה מלאה לגוף (BRZ-15)' }),

  // ---- איכות עימוד (QUALITY) ----
  K('prevent-widows-top', 'bool', true, P.QUALITY, 'chk-widow-top', ['layout/protections-matrix'], 'fx:widow-top', { note: 'טוגל נפרד לתחילת עמוד (Mapping #4)' }),
  K('prevent-widows-bottom', 'bool', true, P.QUALITY, 'chk-widow-bottom', ['layout/protections-matrix'], 'fx:widow-bottom'),
  K('prevent-orphans-top', 'bool', true, P.QUALITY, 'chk-orphan-top', ['layout/protections-matrix'], 'fx:orphan-top'),
  K('prevent-orphans-bottom', 'bool', true, P.QUALITY, 'chk-orphan-bottom', ['layout/protections-matrix'], 'fx:orphan-bottom'),
  K('widow-strictness', 'enum', 'normal', P.QUALITY, 'sel-widow-strict', ['layout/protections-matrix'], 'fx:widow-strict', { enum: ['relaxed', 'normal', 'strict'] }),
  K('runt-min-width-pct', 'number', 50, P.QUALITY, 'rng-runt-min', ['typography/protectors'], 'fx:runt-min', { min: 20, max: 80 }),
  K('balance-chapter-end', 'enum', 'balance', P.QUALITY, 'sel-balance-chapter', ['layout/balancing', 'core/pipeline'], 'fx:balance-chapter', { enum: ['balance', 'stretch', 'natural'], note: 'REQUIRE: מנגנון מלא (שוחזר מ‑Green, REQ-BAL-03); נצרך בפועל ב‑pipeline בסוף כל חלק' }),
  K('allow-terminal-residual-fallback', 'bool', true, P.QUALITY, 'chk-terminal-residual', ['layout/dp-planner'], 'fx:terminal-residual', { note: 'שוחזר מ‑Green (REQ-BAL-04)' }),
  K('imbalance-max-delta-px', 'number', 5, P.QUALITY, 'rng-imbalance-max', ['layout/balancing'], 'fx:imbalance-max'),
  K('aq-enabled', 'bool', false, P.QUALITY, 'chk-aq', ['layout/balancing', 'core/pipeline'], 'fx:aq-on', { note: 'AutoQuality מ‑Gold — שלוש שכבות יחד (REQ-BAL-06); נקרא בפועל מהpipeline (תיקון P1-1)' }),
  K('aq-word-spacing-min', 'number', 0.95, P.QUALITY, 'rng-aq-ws-min', ['layout/balancing'], 'fx:aq-ws-min', { min: 0.8, max: 1 }),
  K('aq-word-spacing-max', 'number', 1.05, P.QUALITY, 'rng-aq-ws-max', ['layout/balancing'], 'fx:aq-ws-max', { min: 1, max: 1.2 }),
  K('aq-letter-spacing-min', 'number', 0.97, P.QUALITY, 'rng-aq-ls-min', ['layout/balancing'], 'fx:aq-ls-min'),
  K('aq-letter-spacing-max', 'number', 1.03, P.QUALITY, 'rng-aq-ls-max', ['layout/balancing'], 'fx:aq-ls-max'),
  K('aq-heading-spacing-min', 'number', 0.95, P.QUALITY, 'rng-aq-hs-min', ['layout/balancing'], 'fx:aq-hs-min'),
  K('aq-heading-spacing-max', 'number', 1.05, P.QUALITY, 'rng-aq-hs-max', ['layout/balancing'], 'fx:aq-hs-max'),
  K('aq-shared-load', 'bool', true, P.QUALITY, 'chk-aq-shared', ['layout/balancing'], 'fx:aq-shared'),
  K('aq-stretch-to-bottom', 'bool', true, P.QUALITY, 'chk-aq-stretch', ['layout/balancing'], 'fx:aq-stretch', { note: 'clamp overshoot 20px (REQ-BAL-07)' }),
  K('aq-overshoot-clamp-px', 'number', 20, P.QUALITY, 'rng-aq-clamp', ['layout/balancing'], 'fx:aq-clamp', { min: 0, max: 60 }),
  K('aq-compress-first', 'bool', true, P.QUALITY, 'chk-aq-compress', ['layout/balancing'], 'fx:aq-compress'),

  // ---- עיטורים (ORNAMENTS) ---- **S8 (D-54): מפתחות העיטורים חוזרים עם מנגנון חי + בדיקת אפקט**
  // (D-45 הסיר אותם עד שיהיה מנגנום; כעת כל אחד נצרך בפועל בפאס העיטורים L5).
  K('h2-orn-scope', 'enum', 'both', P.ORNAMENTS, 'sel-h2-orn-scope', ['decoration/ornament-fit'], 'fx:h2-orn-scope', { enum: ['none', 'sign', 'title', 'both'], note: 'REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם / כלום. **S4.6 (ביקורת 3):** none נוסף — במקור IMUD h2-title-orn-mode=none היה מומר ל-both (היפוך הגדרת המשתמש); ornament-fit כבר תומך (scope-off)' }),
  K('h2-orn-top', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-top', ['decoration/ornament-fit'], 'fx:h2-orn-top', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור עליון לסימן (V4: מצבים עצמאיים)' }),
  K('h2-orn-bottom', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-bottom', ['decoration/ornament-fit'], 'fx:h2-orn-bottom', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור תחתון לסימן' }),
  K('h2-orn-side', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-side', ['decoration/ornament-fit'], 'fx:h2-orn-side', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור צדדי לכותרת (V4)' }),
  K('h2-orn-fit-to-text', 'bool', true, P.ORNAMENTS, 'chk-h2-orn-fit', ['decoration/ornament-fit'], 'fx:h2-orn-fit', { note: 'REQ-ORN-01: התאמת רוחב לטקסט במדידת JS — CSS fit-content נכשל (V3/V4); המידות נקבעות בהזמנת הפריסה (F-08)' }),
  K('h3-side-orn', 'enum', 'none', P.ORNAMENTS, 'sel-h3-side-orn', ['decoration/ornament-plan'], 'fx:h3-side-orn', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll'], note: 'REQ-ORN-01: עיטורי צד H3 — התאמת גובה לשורה' }),
  K('h3-side-orn-height-em', 'number', 1, P.ORNAMENTS, 'rng-h3-side-orn-h', ['decoration/ornament-plan'], 'fx:h3-side-orn-h', { min: 0.5, max: 2, step: 0.1, note: 'גובה ב־em; מקור שליטה יחיד — אין !important מול inline (F-09)' }),
  K('chapter-end-ornament', 'enum', 'none', P.ORNAMENTS, 'sel-chapter-end-orn', ['decoration/ornament-plan'], 'fx:chapter-end-orn', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'REQ-ORN-03: פירמידת וילנא/רומח/שושנתא/סלסול/תמונה — התאמה לתקציב הפנוי; לעולם לא דוחף תוכן' }),
  K('chapter-end-ornament-w-em', 'number', 4, P.ORNAMENTS, 'rng-chapter-end-w', ['decoration/ornament-plan'], 'fx:chapter-end-w', { min: 1, max: 12 }),
  K('chapter-end-ornament-h-em', 'number', 1.2, P.ORNAMENTS, 'rng-chapter-end-h', ['decoration/ornament-plan'], 'fx:chapter-end-h', { min: 0.3, max: 4 }),
  K('heading-dividers-h3-h6', 'bool', false, P.ORNAMENTS, 'chk-hdr-dividers', ['decoration/dividers', 'decoration/ornament-plan'], 'fx:hdr-dividers', { note: 'REQ-ORN-04: fits() נמדד בכל אתרי ההוספה; בלי עיטור בראש טור/עמוד ריק; rollback-aware (Orange)' }),
  K('shaar-main-divider', 'enum', 'none', P.ORNAMENTS, 'sel-shaar-main-div', ['decoration/dividers'], 'fx:shaar-main-div', { enum: ['none', 'thin', 'dashed', 'double'], note: 'REQ-ORN-04: קו מפריד בשער ראשי (PT-01)' }),
  K('shaar-sub-divider', 'enum', 'none', P.ORNAMENTS, 'sel-shaar-sub-div', ['decoration/dividers'], 'fx:shaar-sub-div', { enum: ['none', 'thin', 'dashed', 'double'], note: 'REQ-ORN-04: קו מפריד בשער משנה (PT-02)' }),

  // ---- TOC ----
  // **S9 (D-62):** מיומנות מספור TOC מלאה (Orange eb21383 — 4 מפתחות; הרביעי כבר קיים):
  // count = מספור שורות תוכן־העניינים עצמן; show = האם עמודי התוכן מציגים גיליון משלהם (כשנספרים).
  K('toc-general-enabled', 'bool', true, P.TOC, 'chk-toc-general', ['decoration/toc-builder'], 'fx:toc-gen'),
  K('toc-detail-enabled', 'bool', false, P.TOC, 'chk-toc-detail', ['decoration/toc-builder'], 'fx:toc-det'),
  K('general-toc-count-numbering', 'bool', true, P.TOC, 'chk-toc-count', ['decoration/toc-builder'], 'fx:toc-count', { note: 'שוחזר מ‑V1/V2 (REQ-HDR-03/HDR-05)' }),
  K('detailed-toc-count-numbering', 'bool', true, P.TOC, 'chk-dtoc-count', ['decoration/toc-builder'], 'fx:dtoc-count', { note: 'S9: מספור שורות בתוכן־עניינים המפורט (Orange eb21383 — הושלם)' }),
  K('general-toc-show-numbering', 'bool', true, P.TOC, 'chk-gtoc-show', ['decoration/toc-builder'], 'fx:gtoc-show', { note: 'S9: עמודי תוכן־עניינים כלליים מציגים גיליון כשהם נספרים (count-toc-pages=true)' }),
  K('detailed-toc-show-numbering', 'bool', true, P.TOC, 'chk-dtoc-show', ['decoration/toc-builder'], 'fx:dtoc-show', { note: 'S9: עמודי תוכן־עניינים מפורטים מציגים גיליון כשהם נספרים' }),
  ...[1, 2, 3, 4, 5, 6, 7].flatMap(lvl => [
    K(`toc-level-${lvl}-show`, 'bool', lvl <= 2, P.TOC, `chk-toc-l${lvl}`, ['decoration/toc-builder'], `fx:toc-l${lvl}`),
    K(`toc-level-${lvl}-inline`, 'bool', lvl >= 4, P.TOC, `chk-toc-l${lvl}-inline`, ['decoration/toc-builder'], `fx:toc-l${lvl}-inline`),
  ]),

  // ---- שערים/נושאים (THEMES) ---- **S8 (D-54): ערכות נושא חיות — הפעלה מלאה (F-10 נעול)**
  K('background-color', 'color', '#ffffff', P.THEMES, 'inp-bg-color', ['output/dom-renderer'], 'fx:bg-color'),
  K('background-opacity', 'number', 1, P.THEMES, 'rng-bg-opacity', ['output/dom-renderer'], 'fx:bg-opacity', { min: 0, max: 1, step: 0.05, note: 'נצרך בפועל: rgba() על background-color (תיקון P0-5 — בעבר נכתב לתכונת CSS בלתי קיימת)' }),
  K('theme-set-id', 'string', 'default', P.THEMES, 'sel-theme-set', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:theme-set', { note: 'REQ-ORN-06: הפעלת ערכה מפעילה את שלושת השערים (F-10) דרך theme-sets.activateThemeSet' }),
  K('show-shaar-sub', 'bool', false, P.THEMES, 'chk-show-shaar-sub', ['decoration/shaar-pages', 'decoration/theme-sets'], 'fx:show-shaar-sub', { note: 'U-C2: "הצג שער משנה" — עמודי שער־משנה לפני כל פתיחת חלק' }),
  K('shaar-main-image', 'string', '', P.THEMES, 'inp-shaar-main-img', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:shaar-main-img'),
  K('shaar-sub-image', 'string', '', P.THEMES, 'inp-shaar-sub-img', ['decoration/page-decorations'], 'fx:shaar-sub-img'),
  K('shaar-back-enabled', 'bool', true, P.THEMES, 'chk-shaar-back', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:shaar-back', { note: 'PT-03: 4 מקטעים עצמאיים; כיבוי ראשי מבטל את כולם' }),
  // REQ-ORN-08: פאנל רקעים מוזג לתוך נושאים — 3 סוגי עמודים + color/texture/image + insets מ"מ
  K('background-page-type', 'enum', 'regular', P.THEMES, 'sel-bg-page-type', ['decoration/page-decorations'], 'fx:bg-page-type', { enum: ['regular', 'preface-open', 'sign-open'], note: 'REQ-ORN-08: מחלקת העמוד שאליה הרקע מיועד (מיזוג פאנל רקע→נושאים)' }),
  K('background-image', 'string', '', P.THEMES, 'inp-bg-image', ['decoration/page-decorations'], 'fx:bg-image'),
  K('background-texture', 'string', '', P.THEMES, 'inp-bg-texture', ['decoration/page-decorations'], 'fx:bg-texture', { note: 'טקסטורה חוזרת (שכבת תשתית — פטורה מחפיפות באודיט)' }),
  K('background-inset-mm', 'number', 0, P.THEMES, 'rng-bg-inset', ['decoration/page-decorations'], 'fx:bg-inset', { min: 0, max: 30, note: 'שקיעת הרקע משולי העמוד במ״מ' }),

  // ---- נכסי הפרויקט המקורי IMUD_TORANI (03.11, EXT-14 — הטמעה) ----
  // הערכים הם הפניות 'imud:<collection>:<id>' — נפתרות בזמן רינדור דרך asset-registry.
  // הפיקרים (בחירת עיצוב מהספרייה) חיים ב-UI (imud-decorations.js); המפתחות כאן
  // משמרים את הבחירה בתבניות/חבילות פרויקט ומזרימים אותה למנוע.
  K('imud-shaar-main', 'string', '', P.THEMES, 'inp-imud-shaar-main', ['decoration/page-decorations'], 'fx:imud-shaar-main', { note: 'עיצוב שער ראשי מספריית IMUD (הפניה imud:shaar-main:<id>) — מפעיל את עמודי השער' }),
  K('imud-shaar-sub', 'string', '', P.THEMES, 'inp-imud-shaar-sub', ['decoration/page-decorations'], 'fx:imud-shaar-sub', { note: 'עיצוב שער משנה מספריית IMUD (imud:shaar-sub:<id>)' }),
  K('imud-shaar-back', 'string', '', P.THEMES, 'inp-imud-shaar-back', ['decoration/page-decorations'], 'fx:imud-shaar-back', { note: 'עיצוב שער אחורי מספריית IMUD (imud:shaar-back:<id>)' }),
  K('imud-orn-top', 'string', '', P.ORNAMENTS, 'inp-imud-orn-top', ['decoration/ornament-plan'], 'fx:imud-orn-top', { note: 'עיטור עליון לסימן H2 — עיצוב IMUD; דורש h2-orn-top=image' }),
  K('imud-orn-bottom', 'string', '', P.ORNAMENTS, 'inp-imud-orn-bottom', ['decoration/ornament-plan'], 'fx:imud-orn-bottom', { note: 'עיטור תחתון לסימן H2 — עיצוב IMUD; דורש h2-orn-bottom=image' }),
  K('imud-orn-side', 'string', '', P.ORNAMENTS, 'inp-imud-orn-side', ['decoration/ornament-plan'], 'fx:imud-orn-side', { note: 'עיטור צדדי (H2/H3) — עיצורי IMUD; דורש h2-orn-side/h3-side-orn=image' }),
  K('imud-chapter-end', 'string', '', P.ORNAMENTS, 'inp-imud-chapter-end', ['decoration/ornament-plan'], 'fx:imud-chapter-end', { note: 'עיטור סיום־פרק — עיצוב IMUD; דורש chapter-end-ornament=image' }),
  K('imud-divider', 'string', '', P.ORNAMENTS, 'inp-imud-divider', ['decoration/ornament-plan'], 'fx:imud-divider', { note: 'מפריד סעיפים מעוצב (323 עיצובים) — משמש מפרידי שער/כותרות במצב תמונה' }),
  K('imud-book-title', 'string', '', P.THEMES, 'inp-imud-book-title', ['output/dom-renderer'], 'fx:imud-book-title', { note: 'כותרת הספר בשער (עקיפת מטא-נתוני המסמך אם הוגדר)' }),
  K('imud-book-subtitle', 'string', '', P.THEMES, 'inp-imud-book-subtitle', ['output/dom-renderer'], 'fx:imud-book-subtitle', { note: 'כותרת־משנה בשער' }),
  // **03.11(ד) — דיווח משתמש 3 ("אין עמודי שער, אין כותרות עליונות, שום דבר מהגדרות
  // ברירת המחדל אינו קיים"): המקור (IMUD_TORANI default_settings.json) מחזיק
  // show-main-shaar=true / show-sub-shaar=true / show-back-shaar=true כברירת מחדל —
  // השערים חלק ממבנה הספר, לא אופציה. מפתחות המתגים המפורשים משחזרים זאת.
  K('shaar-main-enabled', 'bool', true, P.THEMES, 'chk-shaar-main', ['decoration/shaar-pages'], 'fx:shaar-main', { note: '03.11(ד): שער ראשי כברירת מחדל — כמקור (show-main-shaar=true). מתג שער-העיצוב/ערכת-הנושא מוסיף רקע מעוצב, לא מחליף את המתג' }),
  K('shaar-sub-enabled', 'bool', true, P.THEMES, 'chk-shaar-sub', ['decoration/shaar-pages'], 'fx:shaar-sub', { note: '03.11(ד): שער־משנה לכל פתיחת חלק — כמקור (show-sub-shaar=true); show-shaar-sub הישן נשמר כמתג נוסף (או)' }),
  // **03.11(ד): תוכן מובנה של עמודי השער (פורט renderMainShaar/renderSubShaar/renderBackShaar
  // של המקור): גופנים/גדלים לכל רכיב. ברירות המחדל = ערכי המקור אחרי הסרת המשפחות
  // שאינן זמינות (Lia Sgula/Livorna/Alpha* אינן בספרייה — המקור עצמו נפל ל-Bellefair/
  // David Libre/Frank Ruhl Libre דרך ה-fallbacks, ואלה מוטמעים כעת בנכסים).
  K('shaar-title-font', 'font', 'Bellefair', P.THEMES, 'sel-shaar-title-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-title-font', { note: "מקור: f-sh-title=\"'Lia Sgula', 'Bellefair', serif\" — Lia Sgula אינה זמינה; Bellefair המוטמע" }),
  K('shaar-title-size-pt', 'number', 46, P.THEMES, 'rng-shaar-title-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-title-size', { min: 20, max: 90, note: 'מקור: s-sh-title=46' }),
  K('shaar-subtitle-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-subtitle-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-subtitle-font', { note: "מקור: f-sh-sub=\"'Livorna', 'David Libre', serif\"" }),
  K('shaar-subtitle-size-pt', 'number', 21, P.THEMES, 'rng-shaar-subtitle-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-subtitle-size', { min: 10, max: 40, note: 'מקור: s-sh-sub=21' }),
  K('shaar-desc-font', 'font', 'Frank Ruhl Libre', P.THEMES, 'sel-shaar-desc-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-desc-font', { note: "מקור: f-sh-desc=\"'Livorna', 'Frank Ruhl Libre', serif\"" }),
  K('shaar-desc-size-pt', 'number', 12, P.THEMES, 'rng-shaar-desc-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-desc-size', { min: 8, max: 20, note: 'מקור: s-sh-desc=12' }),
  K('shaar-sections-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-sections-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-sections-font', { note: "מקור: f-sh-sec=\"'David Libre', serif\"" }),
  K('shaar-sections-size-pt', 'number', 11.5, P.THEMES, 'rng-shaar-sections-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-sections-size', { min: 8, max: 20, note: 'מקור: s-sh-sec=11.5' }),
  K('shaar-author-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-author-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-author-font', { note: "מקור: f-sh-author=\"'David Libre', serif\"" }),
  K('shaar-author-size-pt', 'number', 15, P.THEMES, 'rng-shaar-author-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-author-size', { min: 8, max: 24, note: 'מקור: s-sh-author=15' }),
  K('shaar-year-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-year-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-year-font', { note: "מקור: f-sh-year=\"'David Libre', serif\"" }),
  K('shaar-year-size-pt', 'number', 12, P.THEMES, 'rng-shaar-year-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-year-size', { min: 8, max: 20, note: 'מקור: s-sh-year=12' }),
  K('shaar-back-text-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-back-text-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-back-text-font', { note: 'גוף טקסט השער האחורי (שורות שמירת־זכויות) — מקור: David Libre' }),
  K('shaar-back-text-size-pt', 'number', 10.5, P.THEMES, 'rng-shaar-back-text-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-back-text-size', { min: 8, max: 16, note: 'מקור: שורות ההמשך 10.5pt (השורה הראשונה 13pt מודגשת)' }),
  // נתוני הספר לשערים — ממופים מ-inp-book-* של המקור; בלי ערך — נופלים למטא-נתוני המסמך
  K('imud-book-desc', 'string', '', P.THEMES, 'inp-imud-book-desc', ['output/dom-renderer'], 'fx:imud-book-desc', { note: 'תיאור בשער הראשי (מקור: inp-book-desc ← «נושא מפורט»)' }),
  K('imud-book-sections', 'string', '', P.THEMES, 'inp-imud-book-sections', ['output/dom-renderer'], 'fx:imud-book-sections', { note: 'פרטי מהדורא בשער הראשי (מקור: inp-book-sections ← «פרטי מהדורא»)' }),
  K('imud-book-author', 'string', '', P.THEMES, 'inp-imud-book-author', ['output/dom-renderer'], 'fx:imud-book-author', { note: 'שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר»)' }),
  K('imud-book-year', 'string', '', P.THEMES, 'inp-imud-book-year', ['output/dom-renderer'], 'fx:imud-book-year', { note: 'מקום ושנת הוצאה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה»)' }),
  K('shaar-back-text', 'string', '', P.THEMES, 'inp-shaar-back-text', ['output/dom-renderer'], 'fx:shaar-back-text', { note: 'טקסט השער האחורי (מקור: inp-back-shaar-text; ברירת מחדל בזמן ריצה: «שמירת זכויות» מהמטא או ״כל הזכויות שמורות למחבר.״)' }),

  // ---- מזהי טקסט מוגדרים (S4.5 — chat-v20.3 היסטורי; ברירות מחדל = המקור) ----
  K('en-line-prefix', 'string', 'הערת סיום -', P.NOTES, 'inp-en-line-prefix', ['parser/dfa-lexer', 'parser/block-tokenizer'], 'fx:en-prefix', { note: 'שורה המתחילה בקידומת ⇒ הערת סיום (הקידומת אינה מופיעה בפלט). ריק = ביטול הזיהוי. הוראת כותרת עמודי ההערות — רק בצורת הרבים «הערות סיום - כותרת»' }),
  K('fn-delim-open', 'string', '[', P.NOTES, 'inp-fn-delim-open', ['parser/bracket-scanner', 'parser/block-tokenizer'], 'fx:fn-open', { note: 'תוחם פתיחת הערת שוליים; ריק = ביטול' }),
  K('fn-delim-close', 'string', ']', P.NOTES, 'inp-fn-delim-close', ['parser/bracket-scanner', 'parser/block-tokenizer'], 'fx:fn-close', { note: 'תוחם סגירת הערת שוליים (בברירת המחדל נתמכת גם הצורה ]ם); ריק = ביטול' }),

  // ---- מתקדם/מנוע (ADVANCED) ----
  K('trace-verbosity', 'enum', 'standard', P.ADVANCED, 'sel-trace-verb', ['core/events', 'core/pipeline'], 'fx:trace-verb', { enum: ['off', 'minimal', 'standard', 'full'] }),
  // D-43 (P1-4): diagnostics-enabled אינו רשאי לדכא רישום ממצאים ("לא להשבית אבחון").
  // הוא שולט ברמת הפירוט בדוח בלבד (buildReport compact) — לעולם לא ברישום עצמו.
  K('diagnostics-enabled', 'bool', true, P.ADVANCED, 'chk-diag', ['audit/report-schema'], 'fx:diag-on'),
  K('offline-guard', 'bool', true, P.ADVANCED, 'chk-offline-guard', ['output/html-export'], 'fx:offline-guard', { note: 'exit 7 על בקשה חיצונית (Orange ✓)' }),
  // **S10 — סגירת הבטחת D-44:** debounce-light-change-ms חוזר עם צרכן אמיתי —
  // ui/retypeset-policy קורא אותו בפועל (רענון קל מרוכז; בדיקת אפקט fx:debounce ב־s10).
  K('debounce-light-change-ms', 'number', 350, P.ADVANCED, 'rng-debounce-ms', ['ui/retypeset-policy'], 'fx:debounce', { min: 50, max: 2000, step: 50, note: 'REQ-UI-02: ריכוז שינויים קלים (רקע/נושא/שער) לפני רינדור מחדש — 350–400ms לפי Spec §5.3' }),

  // ---- ייצוא ומדידה (EXPORT — S12; REQ-EXP-01..04, REQ-LB-01 impl B, D-18) ----
  K('measure-impl', 'enum', 'table', P.ADVANCED, 'sel-measure-impl', ['typography/measure-api', 'core/pipeline'], 'fx:measure-impl', { enum: ['table', 'font-metrics'], note: 'S12 D-72: מימוש מדידה — table = טבלאות מכוילות (ברירת מחדל); font-metrics = טבלאות אמת מגופן רשום (hmtx/cmap/kern/GPOS). שקילות שבירות מוכחת על הקורפוס הקנוני לפני החלפת ברירת מחדל.' }),
  K('pdf-crop-marks', 'bool', false, P.ADVANCED, 'chk-crop-marks', ['output/pdf-writer'], 'fx:crop-marks', { note: 'REQ-EXP-03: סימני חיתוך מחוץ לתבנית החיתוך (TrimBox) בייצוא PDF' }),
  K('export-bleed-mm', 'number', 3, P.ADVANCED, 'rng-bleed-mm', ['output/pdf-writer'], 'fx:bleed-mm', { min: 0, max: 6, note: 'REQ-EXP-03: דם הדפסה (BleedBox) במ״מ סביב החיתוך' }),
  K('export-html-page-rules', 'bool', true, P.EXPORT, 'chk-html-page-rules', ['output/html-export'], 'fx:html-page-rules', { note: 'REQ-EXP-02: כללי @page (גודל עמוד מהרישום) בייצוא HTML עצמאי — מדפיס מדויק' }),
];

// ---- אימות פנימי: אין כפילויות id/control ----
(function validateSelf() {
  const ids = new Set(), controls = new Set();
  for (const r of registry) {
    if (ids.has(r.id)) throw new Error(`duplicate key ${r.id}`);
    if (controls.has(r.control)) throw new Error(`duplicate control ${r.control}`);
    ids.add(r.id); controls.add(r.control);
  }
})();

function getSettingDefs() { return registry.slice(); }
function getDefaultSettings() {
  const o = {};
  for (const r of registry) o[r.id] = r.default;
  return derivePlacementFlags({ settings_version: 2, ...o });
}
function findKey(id) { return registry.find(r => r.id === id) || null; }

/**
 * D-39 (תיקון P0-4): מקור־האמת הוא note-placement-mode; **קלט משתמש מפורש גובר
 * על נגזרות**. בעבר הענף הדיפולטי דרס בשקט footnotes-enabled=false — הפקד היה
 * קיים, המפתח קיים, המנגנון קיים, והגזירה ביטלה את רצון המשתמש (מחלת S4).
 * מצב סותר אמיתי (mode=endnotes + footnotes-enabled=true) נפתר לטובת המצב
 * (המצב הוא שכבת האמת) ומדווח ע"י mergeWithDefaults — לא בשקט מוחלט.
 * - 'footnotes' ⇒ מרזב לפי footnotes-enabled (true=מרזב; false=ההערות בגוף כplaceholder).
 * - 'endnotes'  ⇒ אין מרזב; ההערות זורמות לעמודי 'הערות'; endnotes-enabled=true לצרכנים ישירים.
 * - 'inline'    ⇒ ההערות בגוף כplaceholder מלא.
 */
function derivePlacementFlags(s) {
  if (!s) return s;
  if (s['note-placement-mode'] === 'endnotes') {
    s['endnotes-enabled'] = true;   // לצרכנים ישירים (endnote-pages builder)
    s['footnotes-enabled'] = false; // אין מרזב במצב endnotes — המצב גובר (מדווח בגירה)
  } else {
    s['endnotes-enabled'] = false;
    // footnotes-enabled: **ערך המשתמש עומד** — אין דריסה. mode=footnotes + false
    // ⇒ ההערות מוצגות בגוף כplaceholder מלא (BRZ-15) — לא מצב סותר.
  }
  return s;
}

module.exports = { getSettingDefs, getDefaultSettings, findKey, derivePlacementFlags, PANELS: P, registry };
