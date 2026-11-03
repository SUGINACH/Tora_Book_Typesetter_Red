// src/engine/parser/dfa-lexer.js — Layer 1: metadata recognition ONLY in preamble (REQ-PAR-01, S4.5)
'use strict';

/**
 * **S4.5 (ביקורת 03.11, סקירה 2):** מזהי הטקסט של הפרויקט המקורי — רשימה מלאה.
 * המקור: default_settings.json + טקסט ברירת המחדל של IMUD_TORANI (app.js):
 *   שם הספר - … / נושא - … / נושא מפורט - … / פרטי מהדורא - … / שם המחבר - … /
 *   מקום ושנת הוצאה - … / שמירת זכויות - … / פרטי הוצאה לאור - … /
 *   פרטי קשר - … / פרטים נוספים - …
 * ולצדם המפתחות הקצרים שנתמכו תמיד (ספר, מחבר, מהדורא, מקום, שנה, מהדורה,
 * editors, title). הפתיח נסגר רק בשורה ריקה/כותרת/הערת סיום — לא בשורת מטא־נתון.
 */
const METADATA_KEYS = [
  // ארוכים (טקסט ברירת המחדל המקורי)
  'שם הספר', 'נושא', 'נושא מפורט', 'פרטי מהדורא', 'שם המחבר', 'מקום ושנת הוצאה',
  'שמירת זכויות', 'פרטי הוצאה לאור', 'פרטי קשר', 'פרטים נוספים',
  // קצרים (תמיכה היסטורית)
  'ספר', 'מחבר', 'מהדורא', 'מקום', 'שנה', 'מהדורה', 'editors', 'title'
];

const HEADING_RE = /^(כותרת\s*([0-7])|חלק\s+([א-ת]+)|הקדמה)\s*[-–—]\s*(.+)$/;

/** ברירת המחדל ההיסטורית של קידומת הערת הסיום (en-line-prefix, default_settings.json). */
const DEFAULT_ENDNOTE_PREFIX = 'הערת סיום -';

/**
 * **S4.5 (תיקון סיווג):** בניית ביטוי קידומת הערת סיום מהגדרת המשתמש.
 * קלט ריק/רווחים ⇒ null (זיהוי מבוטל — שורות נשארות פסקאות; החלטה מפורשת
 * של המשתמש, לא כשל שקט). הקידומת חייבת להסתיים במקף/מקף-ארוך/קו — אחרת
 * מוסיפים את המקף בעצמנו (ערך ההגדרה "הערת סיום" שקול ל-"הערת סיום -").
 */
function compileEndnotePrefix(prefix) {
  const p = String(prefix == null ? DEFAULT_ENDNOTE_PREFIX : prefix).trim();
  if (!p) return null;
  const withDash = /[-–—]$/.test(p) ? p : p + ' -';
  const esc = withDash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*').replace(/[-–—]/g, '[-–—]');
  return new RegExp('^' + esc + '\\s*(.*)$');
}

/** **S4.5:** הוראת כותרת עמודי ההערות — צורת רבים בלבד («הערות סיום - כותרת»).
 * הצורה הבסיסית של D-40 (/^הערת\s*סיום…/) התנגשה עם מזהה התוכן ההיסטורי
 * («הערת סיום - טקסט» = הערה) וגרמה להיעלמות תוכן. רבים (העערות/הערות) = מקטע;
 * יחיד (הערת) = תמיד תוכן. */
const ENDNOTE_CLASS_RE = /^הערות\s*סיום\s*[-–—]\s*(.+)$/;

/** ביטויי ברירת המחדל (תאימות לאחור לייבוא ישיר; tokenize מקבל opts ומזהה משם). */
const ENDNOTE_PREFIX = compileEndnotePrefix(DEFAULT_ENDNOTE_PREFIX);
const ENDNOTE_NUMBERED = /^הערת\s*סיום\s*[-–—]?\s*([0-9]{1,4})\s*[-–—]\s*(.+)$/;
const ENDNOTE_CLASS = ENDNOTE_CLASS_RE;

/**
 * DFA states: PREAMBLE -> BODY. יציאה מ‑PREAMBLE: שורה ריקה או כותרת ראשונה.
 * שורה כמו `נושא - דין סוכה ישנה` באמצע המסמך נשארת פסקה (REQ-PAR-01 / לקח Z.ai).
 * @param {string} rawText
 * @param {object} [opts] — { endnotePrefix: string } (S4.5: מזהה מוגדר; '' = מבוטל)
 */
function lexDocument(rawText, opts = {}) {
  const endnoteRe = opts.endnotePrefixRe instanceof RegExp
    ? opts.endnotePrefixRe
    : compileEndnotePrefix(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX);
  const lines = String(rawText).replace(/\r\n?/g, '\n').split('\n');
  const state = { phase: 'PREAMBLE' };
  const metadata = {};
  const body = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (state.phase === 'PREAMBLE') {
      if (trimmed === '') { state.phase = 'BODY'; continue; }
      if (HEADING_RE.test(trimmed) || (endnoteRe && endnoteRe.test(trimmed)) || ENDNOTE_CLASS_RE.test(trimmed)) {
        state.phase = 'BODY'; body.push(line); continue;
      }
      const m = trimmed.split(/\s+[-–—]\s+/);
      if (m.length >= 2 && METADATA_KEYS.includes(m[0].toLowerCase())) {
        metadata[m[0]] = m.slice(1).join(' - ');
        continue;
      }
      // שורה שאינה metadata → גם היא סוגרת את הפתיח
      state.phase = 'BODY';
      body.push(line);
      continue;
    }
    body.push(line);
  }
  return { metadata, bodyLines: body };
}

module.exports = {
  lexDocument, HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS,
  ENDNOTE_CLASS_RE, METADATA_KEYS, DEFAULT_ENDNOTE_PREFIX, compileEndnotePrefix
};
