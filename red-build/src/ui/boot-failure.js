// src/ui/boot-failure.js — כשל אתחול אינו נבלע בשקט (סוכן 1, תוכנית האב §7.1: הודעות שגיאה מבחינות בין סוגי כשל)
'use strict';

/**
 * **הבעיה:** שרשרת האתחול בדפדפן (קטלוג גופנים → ברירות המחדל של המקור → שחזור הגדרות שמורות → עימוד) הסתיימה
 * ב־catch ריק. כשל בטעינת הנכסים (קובץ חסר, פתיחה מקומית, ניתוק) השאיר את האפליקציה בברירות RED בלי שום הודעה —
 * והמשתמש חשב שחלות ברירות המקור (הצלחה כן מוצגת: "ברירות המחדל המקוריות הוחלו").
 *
 * **הפתרון:** הודעה לפי השלב שנכשל + שבב אזהרה קבוע לכשל נכסים. טהור: בלי DOM ובלי מנוע (F-06).
 */

/** תיאור קצר של שגיאה: הודעה בלבד (לא stack), רווחים מאוחדים, חתוך ל-140 תווים. */
function errorDetail(err) {
  const m = err && err.message != null ? err.message : err;
  const s = String(m == null ? '' : m).replace(/\s+/g, ' ').trim();
  return s.length > 140 ? `${s.slice(0, 137)}…` : s;
}

const MESSAGES = {
  assets: (d) => `נכסי הספרייה (ברירות המחדל והגופנים של המקור) לא נטענו — פועלות ברירות המחדל של RED, והתוצאה עשויה להיות שונה מהמקור${d ? ` (${d})` : ''}.`,
  apply: (d) => `החלת ברירות המחדל של המקור נכשלה${d ? `: ${d}` : ''} — פועלות ברירות המחדל של RED.`,
  restore: (d) => `שחזור ההגדרות השמורות נכשל${d ? `: ${d}` : ''}.`,
  retypeset: (d) => `עימוד האתחול נכשל${d ? `: ${d}` : ''}.`
};

/** @param {'assets'|'apply'|'restore'|'retypeset'|string} stage השלב שנכשל @param {*} err @returns {string} */
function describeBootFailure(stage, err) {
  const fn = MESSAGES[stage] || ((d) => `האתחול נכשל${d ? `: ${d}` : ''}.`);
  return fn(errorDetail(err));
}

/**
 * מדווח בפס המצב. כשל נכסים — גם שבב אזהרה קבוע (האפליקציה ממשיכה בברירות RED, ואסור שזה יוצג כברירות המקור);
 * לכל שלב — הודעה חולפת. @returns {string} ההודעה
 */
function reportBootFailure(app, stage, err) {
  const msg = describeBootFailure(stage, err);
  const st = app && app.status;
  if (!st) return msg;
  if (stage === 'assets' && typeof st.setAssetsFailure === 'function') st.setAssetsFailure(msg);
  if (typeof st.setNotice === 'function') st.setNotice(msg);
  return msg;
}

module.exports = { errorDetail, describeBootFailure, reportBootFailure };
