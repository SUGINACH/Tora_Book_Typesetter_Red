// src/engine/typography/dropword.js — First-word decoration (REQ-LB-05, T1 S3.4)
// נכתב מאפס לפי המפרט: ארבעה מצבים, אורך 1–2 מילים, sog threshold, יישור cap-top.
'use strict';

/**
 * עקרונות (מניעת באגים גרסאות קודמות):
 * - F-W1 (Yellow/Gold): drop-word חייב להיות GEOMETRY-NEUTRAL — הוא לא משנה את תכנון השורות.
 *   לכן המצב 'drop' אינו מסיר מילים מהזרימה; הוא רק מסמן את תחילת הפסקה ברנדור (inline drop-cap),
 *   והשורות נשארות זהות. ה‑ledger רושם fw-decorated ללא שינוי layoutHash.
 * - F-W2 (Orange V23): סימון לפני מדידה = בעייתיות; כאן הסימון AFTER line-plan, BEFORE render בלבד.
 * - F-W3: bold/inline משנים רוחב מדידה? לא — אותם תאים נשמרים; bold ניתן כ‑font-weight CSS בלבד.
 * - F-W4: none = no-op מוחלט (גם ללא דגל).
 * - ס sog threshold: אם לפסקה פחות מ‑first-word-threshold-lines שורות → אין קישוט בכלל.
 * - first-word-length ∈ {1,2}: נבחרות 1–2 המילים הראשונות מיחידות השורה הראשונה (NBSP unit נספר כיחידה אחת).
 */

const MODES = ['drop', 'inline', 'bold', 'none'];

/**
 * @param {{lines:Array<{words:string[]}>}} block - פסקה עם שורות מתוכננות (KP output)
 * @param {object} settings - merged registry settings
 * @param {{measure?:(t:string)=>number}} [api] - למדידת רוחב המילה המקושטת (אופציונלי)
 * @returns {{applied:boolean, mode:string, words:string[], reason?:string}} החלטה + עדכון meta על הבלוק
 */
function applyDropWord(block, settings, api = {}) {
  const mode = String(settings['first-word-mode'] || 'none');
  if (!MODES.includes(mode)) return { applied: false, mode: 'none', words: [], reason: `invalid-mode:${mode}` };
  if (mode === 'none') return { applied: false, mode, words: [], reason: 'mode-none' };
  if (!block || !Array.isArray(block.lines) || block.lines.length === 0) {
    return { applied: false, mode, words: [], reason: 'no-lines' };
  }

  const threshold = Math.max(1, Number(settings['first-word-threshold-lines']) || 3);
  if (block.lines.length < threshold) {
    return { applied: false, mode, words: [], reason: `below-threshold(${block.lines.length}<${threshold})` };
  }

  const len = Math.min(2, Math.max(1, Number(settings['first-word-length']) || 1));
  // יחידות השורה הראשונה: מילים (NBSP units שלמים) — לא מפצלם (BRZ-11).
  const firstUnits = block.lines[0].words.slice(0, len);
  if (firstUnits.length === 0) return { applied: false, mode, words: [], reason: 'empty-first-line' };

  const decoratedWords = firstUnits.map(w => w.replace(/\u00A0/g, '\u00A0')); // שמירת צמדים
  const measure = api.measureTextWidth ? (t) => api.measureTextWidth(t, settings['body-font-size-pt']) : null;
  const widthPx = measure ? measure(decoratedWords.join(' ')) : null;

  // **S12.1-6 (סגירת דחוי S3):** יישור cap-top ממדדי אמת — capHeightEm מה־API
  // (OS/2 sCapHeight מגופן רשום במימוש B; נפילה לקירוב 0.7em במימוש A).
  const capHeightEm = api.capHeightEm ? api.capHeightEm() : 0.7;

  const fw = {
    mode,                                   // drop | inline | bold
    words: decoratedWords,
    count: decoratedWords.length,
    widthPx,
    capTopAlign: Boolean(settings['first-word-align-cap-top']), // REQ-LB-05: cap-top ↔ body baseline, לא glyph baseline
    capHeightEm,                            // **S12:** מדד אמת ליישור (לא עוד קבוע 0.7)
    // **S4.5 (03.11):** גודל וגופן המילה הראשונה — מהגדרות המקור (size-first-word=1.5,
    // font-first-word). בעבר היה כפול 2 מוקשה; כעת ברירת המחדל הרישומית = 2 (המשכיות
    // RED) והמיבוא מהמקור מציב 1.5. גופן ריק = גופן הגוף.
    fontSizePt: mode === 'drop'
      ? Math.round(settings['body-font-size-pt'] * (Number(settings['first-word-size-em']) || 2))
      : settings['body-font-size-pt'],
    fontFamily: settings['first-word-font'] || null, // null ⇒ גופן הגוף (ברירת המחדל של המקור: FrankReal)
    lineHeightPx: null                       // drop: יישור ע"י offset, לא גובה שורה — geometry-neutral
  };

  // סימון metadata בלבד — השורות עצמן לא נגעות (invariant CP4 geometry-neutral).
  block.firstWord = fw;
  return { applied: true, mode, words: decoratedWords, reason: null };
}

/**
 * כללי CSS עבור שכבת הרנדור (dom-renderer/html-export). אין כאן !important (F-09).
 * drop: float right + font-size כפול + line-height הדוק + margin-bottom מחושב כך ש‑cap-top
 * מיושר לקו הבסיס של שורת הגוף הראשונה (cap ≈ 0.7em).
 */
function dropWordCssClasses(fw) {
  if (!fw) return '';
  const parts = [`fw-${fw.mode}`];
  if (fw.capTopAlign) parts.push('fw-cap-top');
  return parts.join(' ');
}

module.exports = { applyDropWord, dropWordCssClasses, MODES };
