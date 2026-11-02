// src/engine/decoration/theme-sets.js — Theme sets: grouping, id uniqueness, activation (REQ-ORN-06, F-10)
'use strict';

/**
 * ערכות נושא של שערים — מיזוג שערי JSON לפי מספר ערכה ("1 שער ראשי / 1 שער משנה / 1 שער אחורי").
 *
 * **נעילת F-10 לצמיתות:** בעבר, טעינת ערכת JSON מאוחדת הפעילה רק את השער הראשי.
 * שני גורמים ננעלו כאן מבנית:
 * 1. **התנגשות id** — כלי האריזה הישן גזר id משם הקובץ והחליף תווים שאינם ASCII ב־`_`,
 *    כך ש"שער ראשי" ו"שער משנה" קיבלו אותו מזהה (שיעור packerandconfigurator).
 *    כאן: id = מספר ערכה + תפקיד + סיומת גיבוב קצרה ⇒ ייחודיות מובטחת.
 * 2. **הפעלה חלקית** — activateThemeSet מפעיל את שלושת השערים (ראשי/משנה/אחורי) יחד,
 *    או אף אחד; אין מצב ביניים שקט.
 */

const ROLES = ['main', 'sub', 'back'];
const ROLE_HE = { main: 'ראשי', sub: 'משנה', back: 'אחורי' };

/** חילוץ מספר ערכה מוביל מהשם: "1 שער ראשי" ⇒ 1. שמות ללא מספר ⇒ null. */
function extractSetNumber(name) {
  const m = String(name || '').match(/^\s*(\d+)\s+/);
  return m ? Number(m[1]) : null;
}

/** זיהוי תפקיד מהשם (מילות מפתח עבריות). ברירת מחדל: main. */
function detectRole(name) {
  const s = String(name || '');
  if (/אחורי/.test(s)) return 'back';
  if (/משנה/.test(s)) return 'sub';
  if (/ראשי/.test(s)) return 'main';
  return 'main';
}

/**
 * גיבוב קצר דטרמיניסטי (FNV-1a 16 ביט) — סיומת ייחודיות ל־id (שיעור packerandconfigurator:
 * החלפת תווים לא־ASCII ב־`_` יוצרת התנגשויות; גיבוב לא).
 */
function shortHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (h & 0xffff).toString(36);
}

/**
 * id ייחודי לפריט שער: `set<מספר>-<תפקיד>-<גיבוב שם>`.
 * שני שמות שונים (אפילו שניהם עבריים לחלוטין) ⇒ id שונים תמיד.
 */
function uniqueShaarId(name, index) {
  const n = String(name || '').trim() || `shaar-${index}`;
  return `set${extractSetNumber(n) ?? 'x'}-${detectRole(n)}-${shortHash(`${n}#${index}`)}`;
}

/**
 * קיבוץ פריטי שער לערכות לפי מספר ערכה.
 * @param {Array} items - [{name, svg?, media?, box?}, ...] (מקובץ/מתיקיית נכסים)
 * @returns {Array<{setNo:number|null, label:string, main:object, sub:object|null, back:object|null, previewImage:string|null}>}
 */
function groupThemeSets(items) {
  const list = (items || []).map((it, i) => ({
    ...it,
    id: it.id || uniqueShaarId(it.name, i),
    role: it.role || detectRole(it.name),
    setNo: it.setNo != null ? it.setNo : extractSetNumber(it.name)
  }));
  const bySet = new Map();
  for (const it of list) {
    const key = it.setNo == null ? `noidx-${it.id}` : String(it.setNo);
    if (!bySet.has(key)) bySet.set(key, []);
    bySet.get(key).push(it);
  }
  const sets = [];
  for (const [key, group] of bySet) {
    // בתוך ערכה: תפקיד אחד לכל היותר — אם כפילות, הראשון זוכה והשאר מסומנים (לא נזנקים בשקט)
    const taken = new Set();
    const picked = {};
    const duplicates = [];
    for (const it of group) {
      if (!taken.has(it.role)) { taken.add(it.role); picked[it.role] = it; }
      else duplicates.push(it.id);
    }
    const setNo = group[0].setNo;
    sets.push({
      setNo,
      key,
      label: setNo != null ? `ערכה ${setNo}` : `ערכה ללא מספר (${group[0].name})`,
      main: picked.main || null,
      sub: picked.sub || null,
      back: picked.back || null,
      previewImage: (picked.main && (picked.main.preview || picked.main.media || (picked.main.svg ? `svg:${picked.main.id}` : null))) || null,
      duplicateIds: duplicates
    });
  }
  sets.sort((a, b) => (a.setNo == null ? Infinity : a.setNo) - (b.setNo == null ? Infinity : b.setNo));
  return sets;
}

/**
 * **נעילת F-10:** הפעלת ערכה מפעילה את כל שלושת השערים שבה — לא רק את הראשי.
 * חסר תפקיד בערכה ⇒ נשאר ברירת המחדל ומדווח בפירוש (לא בשקט).
 * @returns {{updates:object, activated:{main:string|null,sub:string|null,back:string|null}, missing:string[]}}
 */
function activateThemeSet(themeSet, settings) {
  void settings;
  if (!themeSet) {
    return { updates: { 'theme-set-id': 'default' }, activated: { main: null, sub: null, back: null }, missing: ['main', 'sub', 'back'] };
  }
  const updates = { 'theme-set-id': themeSet.key };
  const activated = {};
  const missing = [];
  for (const role of ROLES) {
    const it = themeSet[role];
    if (it) {
      activated[role] = it.id;
      if (role === 'main') {
        updates['shaar-main-image'] = it.media || it.preview || (it.svg ? `svg:${it.id}` : '');
        if (it.box) updates['shaar-main-box'] = it.box;
      }
      if (role === 'sub') updates['shaar-sub-image'] = it.media || (it.svg ? `svg:${it.id}` : '');
      if (role === 'back') updates['shaar-back-image'] = it.media || (it.svg ? `svg:${it.id}` : '');
    } else {
      activated[role] = null;
      missing.push(role);
    }
  }
  return { updates, activated, missing };
}

/**
 * בקרת "הצג שער משנה" (בקשת משתמש U-C2): טוגל שקובע אם עמודי שער־משנה
 * מוכנסים לפריסה. הערכה עצמה נטענת; הטוגל שולט בהצגה בלבד.
 */
function showShaarSubDecision(settings) {
  return settings['show-shaar-sub'] === true;
}

/**
 * מודל בורר ויזואלי (U-C1/C2, בקשת גלריית V21): לכל ערכה — שם + תצוג־מקדים
 * מהשער הראשי (תמונה, לא רק שם). ה־UI (S10) מרנדר מהמודל הזה בלבד.
 * @returns {Array<{id:string, label:string, preview:string|null, hasSub:boolean, hasBack:boolean, setNo:number|null}>}
 */
function buildPickerModel(themeSets) {
  return (themeSets || []).map(t => ({
    id: t.key,
    label: t.label,
    preview: t.previewImage,
    hasSub: Boolean(t.sub),
    hasBack: Boolean(t.back),
    setNo: t.setNo
  }));
}

module.exports = {
  ROLES, ROLE_HE, extractSetNumber, detectRole, uniqueShaarId, groupThemeSets,
  activateThemeSet, showShaarSubDecision, buildPickerModel
};
