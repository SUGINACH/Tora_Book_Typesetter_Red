// src/engine/decoration/asset-registry.js — רישום נכסי עיצוב ופתרון הפניות (03.11, EXT-14)
'use strict';

/**
 * רישום מרכזי של נכסי עיצוב (שערים/עיטורים/מפרידים — SVG + תיבות) ופתרון
 * הפניות «imud:<collection>:<id>» ל-data-URI בטוח לשימוש כרקע/תמונה.
 *
 * **אבטחה:** כל SVG עובר חיטוי (svg-sanitize) בעת הרישום — לעולם לא נשמר כמו
 * שהוא. רישום כפול של אותו מזהה — החדש מחליף (עדכון ספרייה); מזהים לא
 * חוקיים נדחים ומדווחים — לא בשקט.
 *
 * **סביבת-אגנוסטיות:** אין DOM/פetch כאן — המודול טהור ונבדק גם ב-Node;
 * הטעינה מהרשת חיה ב-UI (imud-library.js).
 */

const { sanitizeSvg } = require('./svg-sanitize');

/** הרישום עצמו: collection → Map(id → item). */
const collections = new Map();

/** קידוד SVG כ-data-URI (UTF-8 percent-encoding — תואם url("...") ב-CSS). */
function svgDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(svg));
}

/** ולידציית שם אוסף/מזהה: [a-zA-Z0-9_-] בלבד — מונע הזרקת תווים להפניה. */
function validToken(s) {
  return typeof s === 'string' && /^[A-Za-z0-9_-]+$/.test(s);
}

/**
 * רישום אוסף נכסים.
 * @param {string} collection — שם האוסף (למשל 'shaar-main', 'orn-ud', 'divider')
 * @param {Array<{id:string, name?:string, svg:string, box?:object}>} items
 * @returns {{ok:boolean, registered:number, rejected:Array<{id:string, reason:string}>}}
 */
function registerAssets(collection, items) {
  if (!validToken(collection)) return { ok: false, registered: 0, rejected: [{ id: String(collection), reason: 'bad-collection-name' }] };
  if (!Array.isArray(items)) return { ok: false, registered: 0, rejected: [{ id: collection, reason: 'items-not-array' }] };
  let map = collections.get(collection);
  if (!map) { map = new Map(); collections.set(collection, map); }
  const rejected = [];
  let registered = 0;
  for (const it of items) {
    if (!it || !validToken(it.id)) { rejected.push({ id: it && String(it.id), reason: 'bad-id' }); continue; }
    const clean = sanitizeSvg(String(it.svg || ''));
    if (!clean.ok) { rejected.push({ id: it.id, reason: `svg-rejected:${clean.reason}` }); continue; }
    map.set(it.id, {
      id: it.id,
      name: it.name || it.id,
      svg: clean.svg,
      dataUri: svgDataUri(clean.svg),
      box: it.box || null
    });
    registered++;
  }
  return { ok: rejected.length === 0, registered, rejected };
}

/** מספר הנכסים הרשומים (לבדיקות ולתצוגה). */
function assetCount() {
  let n = 0;
  for (const m of collections.values()) n += m.size;
  return n;
}

/** רשימת פריטי אוסף (מזהה+שם+תיבה — בלי SVG, קל ל-UI). */
function listCollection(collection) {
  const map = collections.get(collection);
  if (!map) return [];
  return Array.from(map.values()).map((it) => ({ id: it.id, name: it.name, box: it.box }));
}

/**
 * פתרון הפניה לפריט. פורמטים נתמכים:
 *  - 'imud:<collection>:<id>' → פריט מהרישום
 *  - כל ערך אחר → מוחזר כמו שהוא (URL/data-URI קיים — לא נוגעים)
 * @returns {{resolved:boolean, uri:string|null, item:object|null}}
 */
function resolveAssetRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('imud:')) return { resolved: false, uri: ref || null, item: null };
  const parts = ref.split(':');
  if (parts.length !== 3) return { resolved: false, uri: null, item: null };
  const [, col, id] = parts;
  const map = collections.get(col);
  const item = map && map.get(id);
  if (!item) return { resolved: false, uri: null, item: null };
  return { resolved: true, uri: item.dataUri, item };
}

/** האם הפניה היא הפניית imud (גם אם טרם נטענה — להודעות ברורות למשתמש). */
function isImudRef(ref) {
  return typeof ref === 'string' && ref.startsWith('imud:');
}

/** ניקוי מלא (בדיקות/isolation). */
function resetAssets() {
  collections.clear();
}

module.exports = { registerAssets, resolveAssetRef, isImudRef, listCollection, assetCount, resetAssets, svgDataUri };
