// src/ui/retypeset-policy.js — מדיניות עימוד־מחדש (REQ-UI-02, D-19/D-64; סגירת D-44)
'use strict';

/**
 * **D-64 — מחלקת שינוי קל/כבד:**
 * - **קל (light):** מפתחות שנצרכים בזמן־רינדור בלבד (dom-renderer / planBackground ברינדר).
 *   שינוי קל ⇒ רינדור מחדש של התוצא הקיים **בלי הרצת מנוע** — מרוכז (debounce)
 *   לפי settings['debounce-light-change-ms'] (ברירת מחדל 350ms, Spec §5.3).
 * - **כבד (heavy):** כל השאר (פריסה/מדידה/מספור/כותרות/הערות/מבנה).
 *   שינוי כבד ⇒ **אין עימוד אוטומטי** (F-06) — כפתור ⚡ מהבהב; לחיצה = נתיב
 *   מיידי בלי debounce (Claude §6.2(7)).
 *
 * ההוכחה (בדיקת s10 'D-64 light class is render-equivalent'): לכל מפתח קל,
 * רינדור התוצא הישן עם ההגדרות החדשות === רינדור תוצאת מנוע מלא עם אותן
 * הגדרות (מילה־במילה ב־DOM). מפתח שלא עומד בשקילות אינו קל — גם אם נראה כך.
 */

/** מפתחות קלים — נצרפים בזמן־רינדור בלבד (הוכחת שקילות בבדיקה; ראו D-64). */
const LIGHT_KEYS = new Set([
  'background-color',        // renderPage: root.style.backgroundColor (rgba אמיתי — P0-5)
  'background-opacity',      // renderPage: rgba()
  'background-image',        // renderPageBackgroundAndShaar → planBackground בזמן רינדר
  'background-texture',      // כנ"ל
  'background-inset-mm',     // כנ"ל (מ״מ→px בזמן רינדר)
  'footnote-separator-rule', // renderFootnoteArea: מחלקת fn-rule--*
  'body-last-line-align'     // lastLineClass: מחלקת line--last-*
]);

/** @returns {'light'|'heavy'} מחלקת השינוי של מפתח הגדרה */
function classifyChange(key) {
  return LIGHT_KEYS.has(key) ? 'light' : 'heavy';
}

/** רוחב הריכוז לשינויים קלים — צרכן אמיתי של debounce-light-change-ms (D-44). */
function getDebounceMs(settings) {
  const v = Number(settings && settings['debounce-light-change-ms']);
  return Number.isFinite(v) && v >= 50 ? Math.min(2000, v) : 350;
}

/**
 * טבלת המדיניות לתצוגה בעזרת ה־UI (REQ-UI-02: "policy table rendered in UI help").
 * נתונים בלבד — הפאנל מרנדר מכאן; אין הגיון כפול.
 */
function policyTable() {
  return [
    {
      cls: 'light', labelHe: 'שינוי קל — רינדור מחדש אוטומטי (מרוכז)',
      keys: [...LIGHT_KEYS],
      behaviorHe: 'מרוכז לפי «השהיית שינויים קלים» (ברירת מחדל 350ms); רינדור בלבד — בלי הרצת מנוע; תקציב ≤ 2 שניות.'
    },
    {
      cls: 'heavy', labelHe: 'שינוי כבד — כפתור ⚡ «עדכן ועמד מחדש»',
      keys: ['(כל שאר ההגדרות — פריסה, טיפוגרפיה, מספור, כותרות, הערות, מבנה)'],
      behaviorHe: 'אין עימוד אוטומטי משום בקרה (F-06); הכפתור מהבהב עד לחיצה; לחיצה = עימוד מיידי בלי debounce.'
    }
  ];
}

module.exports = { LIGHT_KEYS, classifyChange, getDebounceMs, policyTable };
