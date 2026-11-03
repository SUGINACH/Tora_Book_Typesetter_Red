// src/engine/decoration/ornament-fit.js — fit-to-text JS measurement + divider height rules (REQ-ORN-01..04)
'use strict';

/**
 * מדידת DOM/JS בלבד (CSS fit-content נכשל — V3/V4). מקור שליטה אחד: אין !important מול inline (F-09).
 *
 * **S8:** הרחבה מלאה — התאמת עיטורי H2 לרוחב הטקסט, התאמת גובה צדדיים H3 לשורת הכותרת,
 * עיטור סיום־פרק בתקציב הפנוי (REQ-ORN-03), שמירת סימטריית מרווחים אפקטיביים (F-21),
 * הרמה אופטית −0.08em לעיטורי צד (שיעור V4), ומשמרות התאמה למפרידי כותרות (REQ-ORN-04).
 */

/** התאמת עיטור H2 לרוחב הטקסט: מחזיר scalePx; sync re-fit בלי shift. */
function fitOrnamentToText(ornamentWidthPx, textWidthPx, maxScale = 3) {
  if (!ornamentWidthPx || ornamentWidthPx <= 0) return 1;
  const scale = Math.min(maxScale, textWidthPx / ornamentWidthPx);
  return Math.max(0.25, Number(scale.toFixed(4)));
}

/**
 * REQ-ORN-01: re-fit סינכרוני ללא הזזה — לאחר החלת הסקאלה רוחב העיטור
 * כבר שווה לרוחב הטקסט, ולכן ריצה חוזרת מחזירה סקאלה 1 (מתייצבת מיד —
 * שיעור F-08: אין פוסט־פרוסס מאוחר שמגלה גובה שלא תוקצב).
 */
function refitStable(ornamentWidthPx, textWidthPx, maxScale) {
  const s1 = fitOrnamentToText(ornamentWidthPx, textWidthPx, maxScale);
  const appliedWidth = ornamentWidthPx * s1;
  const s2 = fitOrnamentToText(appliedWidth, textWidthPx, maxScale);
  return Math.abs(s2 - 1) <= 0.0001; // אחרי ההחלה — אין שינוי נוסף
}

/** גובה מפריד טורים = Math.min(גובה שני הטורים) − 8px (V4 rule). */
function columnDividerHeightPx(colUsedHeights) {
  return Math.max(0, Math.min(...colUsedHeights) - 8);
}

/**
 * fits() — בדיקת התאמה לפני הוספת עיטור **בכל** אתרי ההוספה (לקח Orange):
 * האם לעיטור יש מקום מתחת/מעל הבלוק בלי לגלוש מהטור?
 */
function fits(budgetRemainingPx, ornamentHeightPx) {
  return ornamentHeightPx > 0 && budgetRemainingPx >= ornamentHeightPx;
}

/** עיטורי H3 צדדיים: יישור למרכז־גופן (cap-height centering), לא baseline. */
function sideOrnamentOffsetY(lineHeightPx, ornamentHeightPx) {
  return Math.round((lineHeightPx - ornamentHeightPx) / 2);
}

/**
 * F-21 (שיעור מרווחים): מרווחי עיטורי H2 עליון/תחתון **שווים אפקטיבית**.
 * בזרימת flex-column אין התמטטות שוליים — השוואה חייבת להיעשות על הסכום
 * המצטבר (שולי כותרת + שולי עיטור), לא על ערכי CSS בודדים. כאן מקור אחד:
 * שני המרווחים נקבעים מאותה פונקציה ⇒ שווים מבנית.
 * @param {number} fontPx - גודל גופן הכותרת בפיקסלים
 * @returns {{top:number, bottom:number}} מרווחים אפקטיביים שווים (px)
 */
function h2OrnamentMarginsPx(fontPx) {
  const m = Math.max(2, Math.round(fontPx * 0.1)); // 0.1em — מרווח נשימה מינימלי
  return { top: m, bottom: m }; // שווים מבנית — מקור אחד, אין צבירה לא־סימטרית
}

/**
 * שיעור V4 (F-09/H3): הרמה אופטית של עיטורי צד — margin-top: −0.08em.
 * עיטורים שממורכזים גיאומטרית נראים נמוכים לעין; ההרמה מפצה.
 * @param {number} fontPx - גודל גופן השורה המארחת
 */
function sideOrnamentLiftPx(fontPx) {
  return -Math.round(fontPx * 0.08 * 100) / 100; // −0.08em — שיעור מתועד (Handoff 2.12)
}

/**
 * **F-08 (שיעור הלב):** גובה שעיטורי H2 צורך חייב להיות **מוזמן בזמן הפריסה**
 * (L4) בגודלו הסופי — לא כ‑overlay מאוחר שמגלה גובה שלא תוקצב (זה שורש
 * "עמוד פתיחת כותרת 2 ארוך מדי"). מחשב את ההזמנה הנדרשת מעל/מתחת לכותרת
 * לפי הממדים הסופיים (אחרי fit-to-text) — מקור יחיד למידות ולהזמנה.
 * @param {number} titleWidthPx - רוחב הכותרת הנמדד (JS — לא CSS)
 * @param {object} settings
 * @param {number} h2FontPx - גוף הכותרת בפיקסלים
 */
function h2OrnamentReservedHeight(titleWidthPx, settings, h2FontPx) {
  const scope = h2OrnamentScope(settings);
  if (!scope.any) return { topPx: 0, bottomPx: 0, scale: 1, ornW: 0, ornH: 0, margins: h2OrnamentMarginsPx(h2FontPx), scope };
  const naturalW = H2_ORN_W_EM * h2FontPx, naturalH = H2_ORN_H_EM * h2FontPx;
  const scale = settings['h2-orn-fit-to-text'] !== false ? fitOrnamentToText(naturalW, titleWidthPx) : 1;
  const ornH = naturalH * scale, ornW = naturalW * scale;
  const margins = h2OrnamentMarginsPx(h2FontPx);
  const topPx = scope.signTop ? Math.round(ornH + margins.top) : 0;
  const bottomPx = scope.signBottom ? Math.round(ornH + margins.bottom) : 0;
  return { topPx, bottomPx, scale, ornW: Math.round(ornW), ornH: Math.round(ornH), margins, scope };
}

/**
 * REQ-ORN-02: היקף עיטורי H2 — סימן בלבד / כותרת בלבד / שניהם.
 * מצבי עיטור עצמאיים: עליון/תחתון לסימן + צדדיים לכותרת (V4).
 * @returns {{signTop:boolean, signBottom:boolean, titleSide:boolean, any:boolean, why:string}}
 */
function h2OrnamentScope(settings) {
  const scope = settings['h2-orn-scope'] || 'both';
  const top = settings['h2-orn-top'] || 'none';
  const bottom = settings['h2-orn-bottom'] || 'none';
  const side = settings['h2-orn-side'] || 'none';
  const sign = scope === 'sign' || scope === 'both';
  const title = scope === 'title' || scope === 'both';
  const signTop = sign && top !== 'none';
  const signBottom = sign && bottom !== 'none';
  const titleSide = title && side !== 'none';
  return {
    signTop, signBottom, titleSide,
    any: signTop || signBottom || titleSide,
    why: !sign && !title ? 'scope-off' : (signTop || signBottom || titleSide) ? 'on' : 'kinds-all-none'
  };
}

/** סוגי עיטור סיום־פרק (REQ-ORN-03; Spec §6.7). */
const CHAPTER_END_KINDS = ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'];

/** ממדים טבעיים של עיטורי H2 (em של גופן הכותרת). */
const H2_ORN_W_EM = 3, H2_ORN_H_EM = 0.6;

/**
 * REQ-ORN-03: התאמת עיטור סיום־פרק לתקציב הפנוי שנותר בטור.
 * - אף פעם לא דוחף תוכן ולא חוסם שער גאומטרי (invariant T1): אין מקום ⇒ לא מוצב + סיבה.
 * - scale יורד עד רצפה (0.5); מתחת לרצפה ⇒ דחייה מתועדת (לא כיווץ עיוור).
 * @returns {{placed:boolean, scale:number, wPx:number, hPx:number, reason:string}}
 */
function chapterEndOrnamentFit(kind, wPx, hPx, budgetPx) {
  if (!kind || kind === 'none') return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'kind-none' };
  if (!CHAPTER_END_KINDS.includes(kind)) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'kind-unknown' };
  const w = Math.max(0, Number(wPx) || 0), h = Math.max(0, Number(hPx) || 0);
  if (w <= 0 || h <= 0) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'dims-invalid' };
  const budget = Math.max(0, Number(budgetPx) || 0);
  if (budget <= 0) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'no-budget' };
  // התאמה: סקאלה אחידה על שני הממדים, עד רצפה 0.5
  const scale = Math.min(1, budget / h);
  if (scale < 0.5) return { placed: false, scale, wPx: 0, hPx: 0, reason: 'below-min-scale' };
  return { placed: true, scale: Number(scale.toFixed(4)), wPx: Math.round(w * scale), hPx: Math.round(h * scale), reason: 'fit' };
}

/**
 * REQ-ORN-04 משמרות מפרידי כותרות (שידרוג Orange): מפריד H3–H6 מוצב רק
 * כשהכותרת אינה בראש טור (אין עיטור תלוי מעל לא־כלום) והטור אינו ריק
 * (אין מפריד בעמוד ריק), ויש תקציב נמדד בפועל באתר ההצבה.
 * @param {Array} columnLines - השורות בטור שבו הכותרת הוצבה (לפניה)
 * @param {number} colIdx - אינדקס הטור
 * @returns {boolean} מותר להציב מפריד מתחת לכותרת זו
 */
function dividerInsertable(columnLines, colIdx) {
  void colIdx; // משמרת אחידה לכל הטורים — ראש טור 0 נדחה כמו ראש טור 1
  if (!Array.isArray(columnLines) || columnLines.length === 0) return false; // טור ריק / עמוד ריק
  if (columnLines.length <= 1) return false; // הכותרת היא ראש הטור — אין עיטור בראש טור
  const last = columnLines[columnLines.length - 1];
  return Boolean(last && last.kind === 'heading'); // מפריד רק מתחת לכותרת שהוצבה זה עתה
}

/**
 * F-09 single-source: הצהרת מקור־יחיד לממדי עיטור. הגודל נקבע במודל הגיאומטריה
 * בלבד (כאן); הרנדרר מצייר מה־rect ואסור לו לקבוע ממדים משלו (אין !important מול inline).
 * @returns {{ok:boolean, reason:string}} אמת כשלעיטור יש מקור יחיד תקין
 */
function assertSingleSourceSizing(orn) {
  if (!orn || typeof orn !== 'object') return { ok: false, reason: 'not-an-ornament' };
  const hasRect = orn.w != null && orn.h != null && Number.isFinite(orn.w) && Number.isFinite(orn.h);
  if (!hasRect) return { ok: false, reason: 'missing-rect' };
  if (orn.cssWidthPx != null || orn.cssHeightPx != null) {
    return { ok: false, reason: 'dual-source-sizing' }; // שני מקורות — אסור (F-09)
  }
  return { ok: true, reason: 'single-source' };
}

module.exports = {
  fitOrnamentToText, refitStable, columnDividerHeightPx, fits, sideOrnamentOffsetY,
  h2OrnamentMarginsPx, sideOrnamentLiftPx, h2OrnamentScope, chapterEndOrnamentFit,
  h2OrnamentReservedHeight,
  dividerInsertable, assertSingleSourceSizing, CHAPTER_END_KINDS, H2_ORN_W_EM, H2_ORN_H_EM
};
