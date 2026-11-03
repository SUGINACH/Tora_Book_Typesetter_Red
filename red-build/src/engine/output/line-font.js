// src/engine/output/line-font.js — מפרט גופן/גודל של שורה לפי סוגה (03.11(ג))
'use strict';

/**
 * **מקור יחיד** לגודל/גופן של שורה לפי סוגה — נצרך גם על ידי geometry-projector
 * (הקרנת PDF) וגם על ידי dom-renderer (תצוגה חיה + ייצוא HTML). בעבר הפרויקטור
 * ידע לחשב את גודל הכותרת אך ה-DOM לא — והתצוגה הציגה כותרות בגודל הגוף
 * והתעלמה מהחלפת גופן הגוף (דיווח משתמש 03.11: "ניסיתי להחליף גופן, בתצוגה
 * לא השתנה כלום").
 */

/** גודל גופן (pt) של שורה לפי סוגה (מקור: מפתחות heading-N-size-pt של הרישום). */
function lineFontSizePt(ln, settings) {
  if (ln && ln.kind === 'heading') {
    const s = settings[`heading-${ln.level}-size-pt`];
    return s || settings['body-font-size-pt'];
  }
  return settings['body-font-size-pt'];
}

/** משפחת גופן של שורה לפי סוגה (heading-N-font; ריק ⇒ גופן הגוף). */
function lineFontFamily(ln, settings) {
  if (ln && ln.kind === 'heading') {
    const f = settings[`heading-${ln.level}-font`];
    if (f) return f;
  }
  return settings['body-font'] || '';
}

/** pt → px (96/72) עם עיגול יציב (אותו נוסח בכל הנתיבים). */
function ptToPx(pt) {
  return Math.round(Number(pt) * (96 / 72) * 100) / 100;
}

module.exports = { lineFontSizePt, lineFontFamily, ptToPx };
