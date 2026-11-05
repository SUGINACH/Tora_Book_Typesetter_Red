// src/engine/typography/measure-table.js — טבלאות רוחב מכוילות (מקור יחיד; S12 הפרדה מ־measure-api)
'use strict';

/**
 * טבלת רוחות אותיות עברית (יחסיים ל‑em, קירוב Frank-Ruhl/David) — הפרופיל
 * המכויל של מימוש A (ברירת המחדל). הפרופילים הללו משמשים גם כ־fallback
 * למימוש B (font-metrics) לתווים לא־ממופים בגופן שנטען.
 */

const HEBREW_WIDTHS = {
  'א': 0.66, 'ב': 0.58, 'ג': 0.56, 'ד': 0.62, 'ה': 0.60, 'ו': 0.42, 'ז': 0.44, 'ח': 0.70, 'ט': 0.60,
  'י': 0.32, 'כ': 0.58, 'ך': 0.58, 'ל': 0.52, 'מ': 0.70, 'ם': 0.72, 'נ': 0.60, 'ן': 0.60, 'ס': 0.62,
  'ע': 0.62, 'פ': 0.60, 'ף': 0.62, 'צ': 0.62, 'ץ': 0.64, 'ק': 0.64, 'ר': 0.52, 'ש': 0.66, 'ת': 0.60
};
// **S5.2 (T7):** NBSP (U+00A0) = רוחב הרווח (0.26) — בעבר נפל לסל 0.4em
// (+2.24px @12pt לכל NBSP) במימוש A כשנמדד גולמי (יחידות מודבקות לפני
// רישום הגופנים / טסטים). impl B בטוח כבר היום (הפיצול מבוצע לפני המדידה).
const WIDE_MARKS = { ' ': 0.26, '\\u00A0': 0.26, '\uE000': 0.26, '.': 0.24, ',': 0.24, ';': 0.24, ':': 0.24, '-': 0.34, '–': 0.5, '"': 0.28, "'": 0.16, '“': 0.4, '”': 0.4, '״': 0.36, '׳': 0.18, '[': 0.3, ']': 0.3, '(': 0.3, ')': 0.3 };

/** פרופילי רוחב לפי שם גופן (fontFactor מתוקן ב־endnote-pages; כאן — רוחב בסיס). */
const FONT_PROFILES = {
  'David HB': 1.00, 'David': 1.00, 'Frank Ruhl Libre': 1.00,
  'Narkisim': 1.05, 'Nachlieli': 0.96, 'Alef': 1.00, 'Rubin': 1.03,
  'DejaVu Sans': 1.00, 'DejaVu Serif': 1.00
};

function charWidthEm(ch) {
  if (HEBREW_WIDTHS[ch] !== undefined) return HEBREW_WIDTHS[ch];
  // **תיקון שורש (ביקורת 03.11): בדיקת WIDE_MARKS לפני סל העברי — בעבר הסל
  // 0x0590–0x05FF (=0.5em) לכד את ׳(U+05F3) ו״(U+05F4) לפני שנבדקו ב-WIDE_MARKS
  // (0.18em/0.36em) ⇒ הגדרות מתות וגרשיים נמדדו 0.5em; impl B (פיקסטשור, שנבנה
  // מ-WIDE_MARKS) מדד אותם נכון — והפער בין המימושים הוסט את שבירות ה-DP.
  if (WIDE_MARKS[ch] !== undefined) return WIDE_MARKS[ch];
  const c = ch.codePointAt(0);
  if (c >= 0x0590 && c <= 0x05FF) return 0.5;   // ניקוד/תווים עבריים נוספים
  if (/[A-Za-z0-9]/.test(ch)) return 0.52;
  return 0.4;
}

module.exports = { HEBREW_WIDTHS, WIDE_MARKS, FONT_PROFILES, charWidthEm };
