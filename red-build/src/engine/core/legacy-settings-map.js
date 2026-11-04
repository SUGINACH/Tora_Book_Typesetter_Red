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

/** **03.11(ד):** פתרון מחסנית גופנים של המקור מול הספרייה הזמינה.
 * ערכי המקור הם מחסניות CSS ("'AlphaBlack', 'David Libre', serif") — המשפחה
 * הראשונה בדרך כלל אינה מותקנת והדפדפן נופל להמשך הרשימה. כאן מחליטים מראש:
 * המשפחה הראשונה שקיימת ב-availableFonts (קטלוג הספרייה שהועבר ב-ctx) היא
 * הערך; בלי קטלוג — מחזירים את הראשונה (התנהגות firstFamily הישנה). */
function resolveStack(css, ctx) {
  const raw = String(css || '').replace(/'/g, '');
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    .filter(p => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
  if (!parts.length) return String(css || '');
  const avail = ctx && ctx.availableFonts;
  if (avail instanceof Set) {
    for (const p of parts) if (avail.has(p)) return p;
  }
  return parts[0];
}

/** **S4.6 (ביקורת 3):** אחוזים ⇒ פיקסלים לפי גובה תיבת התוכן **בפועל** שנמסר
 * בהקשר הייבוא (ctx.contentHeightPx). ברירת המחדל 1040px (A4 של RED) נשמרת
 * לתאימות — אך מסלול הטעינה ב-UI מעביר את הגיאומטריה האמיתית של המסמך. */
function pctToPx(v, ctxOrHeight) {
  const h = (typeof ctxOrHeight === 'number' && ctxOrHeight > 0)
    ? ctxOrHeight
    : (ctxOrHeight && Number(ctxOrHeight.contentHeightPx) > 0)
      ? Number(ctxOrHeight.contentHeightPx)
      : 1040;
  return Math.round(h * (parseFloat(v) / 100));
}

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
  'font-body': { kind: 'mapped', to: 'body-font', transform: resolveStack, reason: 'מחסנית CSS של המקור — נפתרת מול הקטלוג המוטמע כשהוא זמין (EXT-9: גוף המקור "\'Guttman Rashi\', \'Frank Ruhl Libre\'" ⇒ Frank Ruhl Libre המוטמע); בלי קטלוג — המשפחה הראשונה (התנהגות היסטורית). בלי זה המדידה נפלה לטבלה בעוד התצוגה בגופן אמיתי — סחף live↔ייצוא מסוג EXT-13' },
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
  // **S4.20 (סגירת EXT-15/16):** שלושת המפתחות ממומשים עתה בפרופיל ה-legacy
  // (legacy-imud-flow): ‏ensureOddPageStart כללי (הליכה על הסדר הסופי לפני
  // עמוד פתיחת-מקטע מסומן שנוחת בגב) + המונה האוטומטי והאיפוס (autoSimanH2/
  // resetSimanOnH1) — היו קיימים ב-flow אך סומנו בטעות כ-removed.
  'odd-h0': { kind: 'ui-state', reason: 'פתיחת H0 בעמוד אי-זוגי — ensureOddPageStart של המקור, מיושם בהרכבת ה-legacy (עמוד ריק לפני פתיחת מקטע בגב) — S4.20', issue: 'EXT-15' },
  'odd-h1': { kind: 'ui-state', reason: 'פתיחת H1 בעמוד אי-זוגי — כמו odd-h0 (החליף את המקרה הפרטי של שער-המשנה) — S4.20', issue: 'EXT-15' },
  'odd-h2': { kind: 'ui-state', reason: 'פתיחת H2 בעמוד אי-זוגי — ברירת המחדל של המקור כבויה — S4.20', issue: 'EXT-15' },
  'h2-auto-siman': { kind: 'ui-state', reason: 'מספור סימן אוטומטי (א-ב-ג) — מיושם ב-legacy-imud-flow (autoSimanH2) — S4.20/EXT-16' },
  'h2-reset-siman': { kind: 'ui-state', reason: 'איפוס מונה סימנים לכל פרק — מיושם ב-legacy-imud-flow (resetSimanOnH1) — S4.20/EXT-16' },
  'h2-top-distance': { kind: 'mapped', to: 'h2-top-offset', transform: pctToPx, reason: '22% מגובה תיבת התוכן (1040px ב-A4 של RED) ⇒ פיקסלים' },

  // ============ מזהי הערות (S4.5-ג — הוטמעו זה עתה) ============
  'en-line-prefix': { kind: 'mapped', to: 'en-line-prefix' },
  'fn-delim-open': { kind: 'mapped', to: 'fn-delim-open' },
  'fn-delim-close': { kind: 'mapped', to: 'fn-delim-close' },

  // ============ **S4.6 (ביקורת 3):** הגדרות עיצוב אמיתיות שסווגו בטעות כ-ui-state ============
  // לא לסווג משפחה שלמה לפי קידומת בלבד — לכל מפתח עם יעד RED קיים יש מיפוי מפורש.
  // ההגדרות האלה מגיעות עכשיו למנוע בפועל (heading-N-font/size, header-slot, שער).
  'f-h0': { kind: 'mapped', to: 'heading-0-font', transform: resolveStack, reason: 'S4.6: גופן כותרת H0 — קיים ברישום RED (heading-0-font)' },
  'f-h1': { kind: 'mapped', to: 'heading-1-font', transform: resolveStack, reason: 'S4.6: גופן H1' },
  'f-h2': { kind: 'mapped', to: 'heading-2-font', transform: resolveStack, reason: 'S4.6: גופן H2' },
  'f-h3': { kind: 'mapped', to: 'heading-3-font', transform: resolveStack, reason: 'S4.6: גופן H3' },
  'f-h4': { kind: 'mapped', to: 'heading-4-font', transform: resolveStack, reason: 'S4.6: גופן H4' },
  'f-h5': { kind: 'mapped', to: 'heading-5-font', transform: resolveStack, reason: 'S4.6: גופן H5' },
  'f-h6': { kind: 'mapped', to: 'heading-6-font', transform: resolveStack, reason: 'S4.6: גופן H6' },
  'f-h7': { kind: 'mapped', to: 'heading-7-font', transform: resolveStack, reason: 'S4.6: גופן H7' },
  's-h0': { kind: 'mapped', to: 'heading-0-size-pt', transform: parseFloat, reason: 'S4.6: גודל H0 (26 ⇒ 26pt; חריגת טווח מדווחת במיזוג ולא מושמטת)' },
  's-h1': { kind: 'mapped', to: 'heading-1-size-pt', transform: parseFloat, reason: 'S4.6: גודל H1 (50 במקור — נשמר נאמן למקור; חריגת טווח מדווחת)' },
  's-h2': { kind: 'mapped', to: 'heading-2-size-pt', transform: parseFloat, reason: 'S4.6: גודל H2' },
  's-h3': { kind: 'mapped', to: 'heading-3-size-pt', transform: parseFloat, reason: 'S4.6: גודל H3' },
  's-h4': { kind: 'mapped', to: 'heading-4-size-pt', transform: parseFloat, reason: 'S4.6: גודל H4' },
  's-h5': { kind: 'mapped', to: 'heading-5-size-pt', transform: parseFloat, reason: 'S4.6: גודל H5' },
  's-h6': { kind: 'mapped', to: 'heading-6-size-pt', transform: parseFloat, reason: 'S4.6: גודל H6' },
  's-h7': { kind: 'mapped', to: 'heading-7-size-pt', transform: parseFloat, reason: 'S4.6: גודל H7 (6 במקור; חריגת טווח מדווחת)' },
  'f-note-body': { kind: 'mapped', to: 'f-note-body-font', transform: resolveStack, reason: 'S4.6: גופן גוף ההערה — קיים ברישום RED' },
  'f-hdr-r': { kind: 'mapped', to: ['header-recto-right-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט ימין בכותרת עליונה (recto)' },
  'f-hdr-c': { kind: 'mapped', to: ['header-recto-center-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט מרכז (recto)' },
  'f-hdr-l': { kind: 'mapped', to: ['header-recto-left-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט שמאל (recto)' },
  's-hdr-r': { kind: 'mapped', to: ['header-recto-right-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט ימין (recto)' },
  's-hdr-c': { kind: 'mapped', to: ['header-recto-center-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט מרכז (recto)' },
  's-hdr-l': { kind: 'mapped', to: ['header-recto-left-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט שמאל (recto)' },
  'f-hdr-verso-r': { kind: 'mapped', to: ['header-verso-right-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט ימין (verso)' },
  'f-hdr-verso-c': { kind: 'mapped', to: ['header-verso-center-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט מרכז (verso)' },
  'f-hdr-verso-l': { kind: 'mapped', to: ['header-verso-left-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט שמאל (verso)' },
  's-hdr-verso-r': { kind: 'mapped', to: ['header-verso-right-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט ימין (verso)' },
  's-hdr-verso-c': { kind: 'mapped', to: ['header-verso-center-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט מרכז (verso)' },
  's-hdr-verso-l': { kind: 'mapped', to: ['header-verso-left-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט שמאל (verso)' },
  'inp-book-title': { kind: 'mapped', to: 'imud-book-title', reason: 'S4.6: כותרת הספר — נצרכת בשער הראשי (dom-renderer)' },
  'inp-book-subtitle': { kind: 'mapped', to: 'imud-book-subtitle', reason: 'S4.6: כותרת־משנה — נצרכת בשער הראשי' },
  // **03.11(ד) — דיווח משתמש 3 / בקשת על מה-01.11: "הטמע את כל ברירות המחדל
  // של הפרויקט המקורי".** מתגי השערים ונתוני הספר נפלו ל-ui-state לפי כלל
  // הקידומת הגס (^(show|inp)-) והושמטו מהמנוע — לכן "אין עמודי שער" גם אחרי
  // ייבוא ברירות המחדל. עתה מיפוי מפורש למפתחות RED האמיתיים.
  'show-main-shaar': { kind: 'mapped', to: 'shaar-main-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער ראשי — ברירת המחדל במקור true (השער חלק ממבנה הספר, לא אופציה)' },
  'show-sub-shaar': { kind: 'mapped', to: 'shaar-sub-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער־משנה — ברירת מחדל true כמקור' },
  'show-back-shaar': { kind: 'mapped', to: 'shaar-back-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער אחורי — ברירת מחדל true כמקור' },
  'f-sh-title': { kind: 'mapped', to: 'shaar-title-font', transform: resolveStack, reason: '03.11(ד): גופן כותרת השער (מקור: Lia Sgula → Bellefair המוטמע)' },
  's-sh-title': { kind: 'mapped', to: 'shaar-title-size-pt', transform: parseFloat, reason: '03.11(ד): גודל כותרת השער (מקור: 46)' },
  'f-sh-sub': { kind: 'mapped', to: 'shaar-subtitle-font', transform: resolveStack, reason: '03.11(ד): גופן כותרת־משנה בשער (מקור: Livorna → David Libre)' },
  's-sh-sub': { kind: 'mapped', to: 'shaar-subtitle-size-pt', transform: parseFloat, reason: '03.11(ד): גודל כותרת־משנה (מקור: 21)' },
  'f-sh-desc': { kind: 'mapped', to: 'shaar-desc-font', transform: resolveStack, reason: '03.11(ד): גופן התיאור (מקור: Livorna → Frank Ruhl Libre)' },
  's-sh-desc': { kind: 'mapped', to: 'shaar-desc-size-pt', transform: parseFloat, reason: '03.11(ד): גודל התיאור (מקור: 12)' },
  'f-sh-sec': { kind: 'mapped', to: 'shaar-sections-font', transform: resolveStack, reason: '03.11(ד): גופן פרטי המהדורא (מקור: David Libre)' },
  's-sh-sec': { kind: 'mapped', to: 'shaar-sections-size-pt', transform: parseFloat, reason: '03.11(ד): גודל פרטי המהדורא (מקור: 11.5)' },
  'f-sh-author': { kind: 'mapped', to: 'shaar-author-font', transform: resolveStack, reason: '03.11(ד): גופן שם המחבר (מקור: David Libre)' },
  's-sh-author': { kind: 'mapped', to: 'shaar-author-size-pt', transform: parseFloat, reason: '03.11(ד): גודל שם המחבר (מקור: 15)' },
  'f-sh-year': { kind: 'mapped', to: 'shaar-year-font', transform: resolveStack, reason: '03.11(ד): גופן השנה/בס״ד (מקור: David Libre)' },
  's-sh-year': { kind: 'mapped', to: 'shaar-year-size-pt', transform: parseFloat, reason: '03.11(ד): גודל השנה (מקור: 12)' },
  'inp-book-desc': { kind: 'mapped', to: 'imud-book-desc', reason: '03.11(ד): תיאור הספר בשער (מקור: inp-book-desc ← «נושא מפורט»)' },
  'inp-book-sections': { kind: 'mapped', to: 'imud-book-sections', reason: '03.11(ד): פרטי מהדורא בשער (מקור: inp-book-sections ← «פרטי מהדורא»)' },
  'inp-book-author': { kind: 'mapped', to: 'imud-book-author', reason: '03.11(ד): שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר»)' },
  'inp-book-year': { kind: 'mapped', to: 'imud-book-year', reason: '03.11(ד): מקום ושנה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה»)' },
  'inp-back-shaar-text': { kind: 'mapped', to: 'shaar-back-text', reason: '03.11(ד): טקסט השער האחורי (שמירת זכויות)' },

  // ============ הערות שוליים ============
  'fn-columns': { kind: 'mapped', to: 'footnote-columns', transform: parseInt },
  'fn-layout-mode': { kind: 'mapped', to: 'fn-layout-mode' },
  'fn-reset-mode': { kind: 'mapped', to: 'footnote-reset-policy' },
  'fn-title-text': { kind: 'mapped', to: 'endnote-title-text' },
  'note-numbering-style': { kind: 'mapped', to: 'footnote-marker-style', transform: (v) => ({ 'gematria': 'hebrew-geresh', 'hebrew': 'hebrew-geresh', 'decimal': 'decimal', 'asterisk': 'asterisk', 'parenthesis': 'parenthesis' }[v] || 'hebrew-geresh') },
  'note-marker-type': { kind: 'merged', to: 'footnote-marker-style', reason: 'סוג הסמן (super) נגזר מהסגנון ב-RED; אין עילוי-נפרד נפרד' },
  'note-marker-size': { kind: 'ui-state', reason: 'גודל מילת-הסמן בגוף (ברירת מחדל 8) — מיושם בפרויקטור ה-legacy (S4.20/EXT-17)', issue: 'EXT-17' },
  'note-listing-num-size': { kind: 'ui-state', reason: 'גודל סמן הרישום ברשימת ההערות — מיושם בפרויקטור ה-legacy — S4.20/EXT-17' },
  'note-num-separator': { kind: 'ui-state', reason: 'המפריד אחרי מספר ההערה (ברירת מחדל .) — מיושם ב-markerWord — S4.20/EXT-17' },
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
  'h2-title-orn-mode': { kind: 'mapped', to: 'h2-orn-scope', onlyIfAbsent: true, transform: (v) => ({ 'sign': 'sign', 'title': 'title', 'both': 'both', 'none': 'none' }[v] || 'both'), reason: 'S4.6 (ביקורת 3): none נשמר כ-none — בעבר הומר ל-both (היפוך הגדרת המקור); enum RED כעת כולל none. onlyIfAbsent: כשהקובץ מכיל גם את המפתח הישיר h2-orn-scope — הישיר גובר (קדימות מפורשת, לא סדר איטרציה)' },
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
  'hdr-title-split': { kind: 'ui-state', reason: 'פיצול שם הספר לחצאים בכותרת העליונה — מיושם תמידית ב-legacy (hdrR/hdrL) כמו בייחוס — S4.20/EXT-19' },
  'hdr-alternating': { kind: 'ui-state', reason: 'החלפת החצאים בעמודים זוגיים-פיזיים — מיושם בהרכבת ה-legacy (S4.20/EXT-19)', issue: 'EXT-19' },
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
  // **EXT-14 (05.11, ערכות הסגנון):** שדות העלאת-קבצים של האפליקציה הישנה — קיימים
  // ב-setting_sets (תלמוד/פרשנות/קונטרס) אך לא ב-default_settings (הועלו רק בערכות):
  // קבצי SVG של בונה השערים, תמונות רקע לפי מחלקת עמוד, תמונת מרכז-הכותרת,
  // תמונת מפריד הסעיפים ותיקיית הנכסים. ב-RED: הפניות imud: מהספרייה המוטמעת
  // (asset-registry) או נכסי משתמש — ערך הקובץ עצמו אינו מצב מנוע.
  { re: /^file-/, kind: 'ui-state', reason: 'שדה העלאת קובץ באפליקציה הישנה (builder/cbg/hdr/sec-div) — ב-RED: הפניות imud: מהספרייה' },
  { re: /^assets-folder-/, kind: 'ui-state', reason: 'תיקיית נכסים חיצונית באפליקציה הישנה — ב-RED: הספרייה המוטמעת' },
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
 * **S4.6 (ביקורת 3) — שימור מלא:** ערכי ui-state כבר לא רק נספרים — הם נשמרים
 * כנתונים במבנה מוגדר: אובייקט uiState בפלט + settings['_legacy-ui-state']
 * (מפתח פנימי עם קידומת קו-תחתון — לא נכנס לייצוא ZIP, שורד בתבניות ה-UI).
 * @param {object} legacy — אובייקט ההגדרות הישן (key→value)
 * @param {object} [registryKeys] — Set/מערך מפתחות RED חוקיים (לסינון); אם לא — ללא סינון
 * @param {{contentHeightPx?:number}} [opts] — גיאומטריה אמיתית להמרות אחוז⇒פיקסל (ברירת מחדל 1040)
 * @returns {{settings:object, uiState:object, dispositions:object, unmapped:string[], report:{mapped:number,merged:number,uiState:number,removed:number}}}
 */
function importImudSettings(legacy, registryKeys, opts = {}) {
  const settings = {};
  const uiState = {};
  const dispositions = {};
  const unmapped = [];
  const report = { mapped: 0, merged: 0, uiState: 0, removed: 0 };
  const valid = registryKeys instanceof Set ? registryKeys : (Array.isArray(registryKeys) ? new Set(registryKeys) : null);
  const ctx = { contentHeightPx: Number(opts.contentHeightPx) > 0 ? Number(opts.contentHeightPx) : 1040 };
  // **03.11(ד):** קטלוג הגופנים הזמין (אם הועבר) — לפתרון מחסניות הגופן של המקור
  // מול מה שבאמת קיים בספרייה המוטמעת (f-h0="'AlphaBlack', 'David Libre', serif"
  // ⇒ David Libre כש-AlphaBlack אינה בספרייה — בדיוק כמו שהדפדפן היה נופל).
  if (opts.availableFonts instanceof Set) ctx.availableFonts = opts.availableFonts;
  else if (Array.isArray(opts.availableFonts)) ctx.availableFonts = new Set(opts.availableFonts);
  // **S4.6:** שני מעברים — ממירים מותנים (onlyIfAbsent, כגון h2-title-orn-mode)
  // מוחלים רק אם מפתח ישיר לא קבע כבר את היעד. קדימות מפורשת ולא תלוית-סדר.
  const deferred = [];
  const applyDisposition = (k, v, d) => {
    dispositions[k] = d;
    if ((d.kind === 'mapped' || d.kind === 'merged') && d.to) {
      const targets = Array.isArray(d.to) ? d.to : [d.to];
      const transformed = d.transform ? d.transform(v, ctx) : v;
      let anyApplied = false;
      let anyBlocked = false;
      for (const t of targets) {
        if (valid && !valid.has(t)) { unmapped.push(`${k}->${t}(!)`); continue; }
        if (d.onlyIfAbsent && settings[t] !== undefined) { anyBlocked = true; continue; }
        settings[t] = transformed;
        anyApplied = true;
      }
      if (anyApplied) report[d.kind]++;
      else if (anyBlocked) report[d.kind]++; // נספר — קיבל disposition מלא (נחסם בכוונה ע"י מפתח ישיר)
    } else if (d.kind === 'ui-state') {
      // **S4.6:** הערך נשמר כנתון — לא רק מונה. החזרה נפרדת + הטמעה בהגדרות
      // (מפתח פנימי; לא מגיע למנוע, לא נמחק).
      uiState[k] = v;
      report.uiState++;
    } else if (d.kind === 'removed') {
      report.removed++;
    } else {
      report.merged++;
    }
  };
  for (const [k, v] of Object.entries(legacy || {})) {
    const d = dispositionOf(k);
    if (!d) { unmapped.push(k); continue; }
    if (d.onlyIfAbsent) { deferred.push([k, v, d]); continue; }
    applyDisposition(k, v, d);
  }
  for (const [k, v, d] of deferred) applyDisposition(k, v, d);
  // מיזוג משלים: mode-h1=sub_shaar ⇒ שער משנה דלוק (הסמנטיקה המקורית)
  if (legacy && legacy['mode-h1'] === 'sub_shaar') settings['show-shaar-sub'] = true;
  if (Object.keys(uiState).length) settings['_legacy-ui-state'] = uiState;
  // **S4.9 (פרופיל העימוד המקורי):** קלט שנראה כמו default_settings.json המלא
  // של המקור ⇒ ה-JSON הגולמי מוצמד תחת _imudRaw והפרופיל מסומן 'imud'.
  // המנוע המרכזי (typeset) מפנה אז לפורט הנאמן (legacy-imud-flow) — התנהגות
  // המקור היא המפרט (בקשת המשתמש 03.11: "בדיקה מתמטית ומוחלטת").
  if (legacy && typeof legacy === 'object'
    && legacy['fn-delim-open'] !== undefined
    && legacy['size-body'] !== undefined
    && legacy['line-height-body'] !== undefined) {
    settings['_imudRaw'] = legacy;
    settings['_layout-profile'] = 'imud';
  }
  return { settings, uiState, dispositions, unmapped, report };
}

module.exports = { DISPOSITIONS, dispositionOf, importImudSettings, firstFamily, resolveStack, pctToPx };
