// src/engine/output/line-font.js — מפרט גופן/גודל של שורה לפי סוגה (03.11(ג))
'use strict';

/**
 * **מקור יחיד** לגודל/גופן של שורה לפי סוגה — נצרך גם על ידי geometry-projector
 * (הקרנת PDF) וגם על ידי dom-renderer (תצוגה חיה + ייצוא HTML). בעבר הפרויקטור
 * ידע לחשב את גודל הכותרת אך ה-DOM לא — והתצוגה הציגה כותרות בגודל הגוף
 * והתעלמה מהחלפת גופן הגוף (דיווח משתמש 03.11: "ניסיתי להחליף גופן, בתצוגה
 * לא השתנה כלום").
 */

/** גודל גופן (pt) של שורה לפי סוגה (מקור: מפתחות heading-N-size-pt של הרישום).
 * **S6.3:** המודל קובע — ln.sizePt שנישא על השורה (הקדמה 11.5pt, הערות,
 * כותרות inline) גובר; רק בהיעדרו נופלים להגדרות. בלי זה גוף ההקדמה
 * הוצג ב-12pt בעוד המנוע מדד 11.5pt — סחף מדידה↔רינדור. */
function lineFontSizePt(ln, settings) {
  if (ln && ln.sizePt != null && Number.isFinite(Number(ln.sizePt)) && Number(ln.sizePt) > 0) {
    return Number(ln.sizePt);
  }
  if (ln && ln.kind === 'heading') {
    const s = settings[`heading-${ln.level}-size-pt`];
    return s || settings['body-font-size-pt'];
  }
  return settings['body-font-size-pt'];
}

/** משפחת גופן של שורה לפי סוגה (heading-N-font; ריק ⇒ גופן הגוף).
 * **S6.3:** ln.font שנישא על השורה (גוף ההקדמה ⇒ Frank Ruhl Libre) גובר —
 * הרינדור באותו גופן שבו המנוע מדד (prefaceApi). */
function lineFontFamily(ln, settings) {
  if (ln && ln.font) return ln.font;
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
