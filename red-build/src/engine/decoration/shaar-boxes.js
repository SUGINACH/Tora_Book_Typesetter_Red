// src/engine/decoration/shaar-boxes.js — Shaar text-box geometry: drag/resize/persist/export (REQ-ORN-05)
'use strict';

/**
 * תיבות טקסט של שערים (PT-01/02/03): גרירה + שינוי גודל + שמירה לפי מזהה שער
 * + הטמעת `box` בייצוא JSON (V4) — עגול־שלם: ייצוא → טעינה מחדש ⇒ מיקומים זהים.
 *
 * **לקחי עבר שננעלו כאן:**
 * - שמירה לפי **מזהה שער פרטני** ולא לפי סוג (בגרסה מוקדמת הוחל מיקום אחד על כל
 *   השערים מהסוג — Handoff §2.13).
 * - סדר קדימויות לפתרון מיקום: (1) שדה `box` מוטמע ב־JSON, (2) מיקום שמור בסשן,
 *   (3) ברירת מחדל — בדיוק כסדר של V4.
 * - מיקום במ"מ (שלם) — דטרמיניסטי בעיגול־שלם; אין נקודה־צפה מתפזרת בין ריצות.
 */

/**
 * פתרון מיקום תיבה לפי סדר הקדימויות של V4 (§2.13).
 * @param {string} type - 'main' | 'sub' | 'back'
 * @param {string} shaarId - מזהה שער פרטני (ייחודי — theme-sets.uniqueShaarId)
 * @param {object} item - פריט השער (עשוי להכיל box מוטמע)
 * @param {object} savedPositions - { [type]: { [shaarId]: box } } מיקומים שמורים
 * @param {object} dfltBox - ברירת מחדל {top,bottom,right,left} במ"מ
 * @returns {{box:object, source:'json'|'saved'|'default'}}
 */
function resolveShaarBox(type, shaarId, item, savedPositions, dfltBox) {
  if (item && item.box && isValidBox(item.box)) return { box: normalizeBox(item.box), source: 'json' };
  const saved = savedPositions && savedPositions[type] && savedPositions[type][shaarId];
  if (saved && isValidBox(saved)) return { box: normalizeBox(saved), source: 'saved' };
  return { box: normalizeBox(dfltBox || { top: 40, bottom: 40, right: 30, left: 30 }), source: 'default' };
}

/** תקינות תיבה: ארבעה שוליים מספריים אי־שליליים. */
function isValidBox(b) {
  return Boolean(b) && ['top', 'bottom', 'right', 'left'].every(k => Number.isFinite(Number(b[k])) && Number(b[k]) >= 0);
}

/** נרמול למ"מ שלמים — דטרמיניזם של עיגול־שלם בעיגול־חוזר. */
function normalizeBox(b) {
  return {
    top: Math.round(Number(b.top)), bottom: Math.round(Number(b.bottom)),
    right: Math.round(Number(b.right)), left: Math.round(Number(b.left))
  };
}

/**
 * הצמדה לגבולות העמוד (גרירה/שינוי גודל לא יוצאים מהדף).
 * @param {object} box - {top,bottom,right,left} במ"מ
 * @param {number} pageWmm, pageHmm - ממדי העמוד במ"מ
 */
function clampShaarBox(box, pageWmm, pageHmm) {
  const b = normalizeBox(box);
  const maxInsetX = Math.max(0, Math.floor(pageWmm / 2) - 5); // תיבה שומרת רוחב מינימלי 10mm
  const maxInsetY = Math.max(0, Math.floor(pageHmm / 2) - 5);
  b.top = Math.min(Math.max(0, b.top), maxInsetY);      // לא שלילי ולא מעבר לחצי
  b.bottom = Math.min(Math.max(0, b.bottom), maxInsetY);
  b.right = Math.min(Math.max(0, b.right), maxInsetX);
  b.left = Math.min(Math.max(0, b.left), maxInsetX);
  return b;
}

/**
 * גרירה: הזזת כל ארבעת השוליים בהפרש (תיבה שומרת על גודלה).
 * שמירה לפי (type, shaarId) — מזהה פרטני (לקח V4: לא לפי סוג!).
 * @returns {object} savedPositions חדש (לא מוטציה במקום — רולבק־סייפ)
 */
function moveShaarBox(savedPositions, type, shaarId, dxMm, dyMm, pageWmm, pageHmm) {
  const next = cloneSaved(savedPositions);
  const cur = (next[type] && next[type][shaarId]) || { top: 40, bottom: 40, right: 30, left: 30 };
  next[type] = next[type] || {};
  next[type][shaarId] = clampShaarBox({
    top: cur.top + dyMm, bottom: cur.bottom - dyMm,
    right: cur.right - dxMm, left: cur.left + dxMm
  }, pageWmm, pageHmm);
  return next;
}

/**
 * שינוי גודל דרך ידית (8 ידיות V4): n/s/e/w/ne/nw/se/sw.
 * @returns {object} savedPositions חדש
 */
function resizeShaarBox(savedPositions, type, shaarId, handle, dxMm, dyMm, pageWmm, pageHmm) {
  const next = cloneSaved(savedPositions);
  const cur = (next[type] && next[type][shaarId]) || { top: 40, bottom: 40, right: 30, left: 30 };
  const b = { ...cur };
  if (handle.includes('n')) b.top += dyMm;
  if (handle.includes('s')) b.bottom -= dyMm;
  if (handle.includes('w')) b.left += dxMm;   // RTL: left גדל כשגוררים שמאלה→ימין? — כיוון לפי ציר X החיובי
  if (handle.includes('e')) b.right -= dxMm;
  next[type] = next[type] || {};
  next[type][shaarId] = clampShaarBox(b, pageWmm, pageHmm);
  return next;
}

function cloneSaved(savedPositions) {
  const out = {};
  for (const [t, byId] of Object.entries(savedPositions || {})) {
    out[t] = {};
    for (const [id, box] of Object.entries(byId || {})) out[t][id] = normalizeBox(box);
  }
  return out;
}

/**
 * ייצוא פריטי שער עם `box` מוטמע (exportShaarJSONWithPositions — פורט V4):
 * המיקום ששרד בסשן נחרת בקובץ ⇒ עיגול־שלם טעינה→הזזה→ייצוא→טעינה ⇒ מיקומים זהים.
 * אין אקראיות (מדיניות zero-randomness): id נגזר דטרמיניסטית מאינדקס+שם.
 */
function exportShaarItemsWithPositions(items, savedPositions) {
  return (items || []).map((it, i) => {
    const id = it.id || `shaar-${i}-${String(it.name || 'anon').replace(/\s+/g, '-').slice(0, 24)}`;
    const type = it.type || it.role || 'main';
    const saved = savedPositions && savedPositions[type] && savedPositions[type][id];
    return { ...it, id, box: normalizeBox(saved || it.box || { top: 40, bottom: 40, right: 30, left: 30 }) };
  });
}

/** השוואת תיבות בודדות (עיגול־שלם) או מפות מיקומים {id: box} — בדיקת שער S8.2. */
function boxPositionsIdentical(a, b) {
  const isSingle = (x) => x && Number.isFinite(Number(x.top)) && Number.isFinite(Number(x.left));
  if (isSingle(a) || isSingle(b)) {
    if (!isSingle(a) || !isSingle(b)) return false;
    const x = normalizeBox(a), y = normalizeBox(b);
    return x.top === y.top && x.bottom === y.bottom && x.right === y.right && x.left === y.left;
  }
  const keys = Object.keys(a || {}).sort();
  const keysB = Object.keys(b || {}).sort();
  if (keys.join(',') !== keysB.join(',')) return false;
  for (const k of keys) {
    const x = normalizeBox(a[k]), y = normalizeBox(b[k]);
    if (x.top !== y.top || x.bottom !== y.bottom || x.right !== y.right || x.left !== y.left) return false;
  }
  return true;
}

module.exports = {
  resolveShaarBox, isValidBox, normalizeBox, clampShaarBox, moveShaarBox, resizeShaarBox,
  exportShaarItemsWithPositions, boxPositionsIdentical
};
