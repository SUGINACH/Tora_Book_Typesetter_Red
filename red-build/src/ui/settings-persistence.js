// src/ui/settings-persistence.js — השתמרות הגדרות משתמש ב-localStorage (פער 2: SRS §17.1)
'use strict';

/**
 * **הדרישה (SRS §17.1):** "User settings MUST persist in localStorage across
 * page refreshes, text imports, and preset toggles." — וב"סיכום בקשות מAI"
 * (נושא 18): "דרישה לוודא שבחירת סט הגדרות אינה נדרסת בפעולות שוטפות או בריענון".
 *
 * **עקרונות המימוש:**
 * - **הפרש מול בסיס (diff), לא צילום מלא:** נשמרות רק ההגדרות שהמשתמש שינה מברירות
 *   המחדל שהוחלו באתחול. כך שדרוג גרסה שמשנה ברירת מחדל אינו נחסם ע"י ערך ישן
 *   שנשמר במפתח הזה (רק בחירות המשתמש המפורשות גוברות).
 * - **ברירות המחדל מוחלות תמיד קודם** (כלל הברזל של המשתמש: בלי החלת ברירות
 *   המחדל אין ודאות הצלחה) — ורק אחריהן מוחל ההפרש השמור.
 * - **עמידות:** JSON שבור / פורמט לא מוכר / גרסה עתידית ⇒ אין שחזור (בלי מיגרציה
 *   שקטה); חריגת נפח (מצב פרטי) ⇒ כשל עדין עם דיווח, בלי קריסה.
 * - **טהור:** אין גישה למנוע/DOM (כלל F-06) — אחסון בלבד.
 */

const STORAGE_KEY = 'tora-red-user-settings';
const FORMAT = 'tora-red-user-settings';
const VERSION = 1;

/**
 * @param {Storage|null} storage אובייקט דמוי-localStorage ({getItem,setItem,removeItem})
 *   או null ⇒ אחסון בזיכרון בלבד (בדיקות/סביבות בלי אחסון).
 */
function createSettingsPersistence(storage) {
  const mem = new Map();
  const store = storage || {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); }
  };
  let lastError = null;

  /** שמירת ההפרש. הפרש ריק ⇒ מחיקת המפתח (חזרה נקייה לברירות המחדל). */
  function save(diff) {
    try {
      const keys = Object.keys(diff || {});
      if (!keys.length) { store.removeItem(STORAGE_KEY); return { ok: true, cleared: true, keys: 0 }; }
      const payload = JSON.stringify({ format: FORMAT, version: VERSION, savedAt: new Date().toISOString(), settings: diff });
      store.setItem(STORAGE_KEY, payload);
      return { ok: true, keys: keys.length };
    } catch (e) {
      lastError = e;
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  }

  /** טעינה עם אימות קפדני — כל סטייה ⇒ null (אין נתונים שמורים). */
  function load() {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (obj.format !== FORMAT) return null;
      if (Number(obj.version) !== VERSION) return null;
      if (!obj.settings || typeof obj.settings !== 'object' || Array.isArray(obj.settings)) return null;
      return obj.settings;
    } catch (e) {
      lastError = e;
      return null;
    }
  }

  function clear() {
    try { store.removeItem(STORAGE_KEY); return true; } catch (e) { lastError = e; return false; }
  }

  function lastWriteError() { return lastError; }

  return { save, load, clear, lastWriteError };
}

/**
 * הפרש current מול baseline — מפתחות שערכם שונה (השוואת JSON יציבת-סוגים).
 * מפתח שהוסר מ-current לא נכלל (השוואה מול בסיס שלם).
 * @returns {object} הפרש לשמירה: {key: value}
 */
function diffSettings(baseline, current) {
  const out = {};
  const base = baseline || {};
  const cur = current || {};
  for (const k of Object.keys(cur)) {
    // ערך undefined שאינו בבסיס = מפתח שנמחק בפועל — לא הפרש (הגנה מסדר-undefined)
    if (cur[k] === undefined && !(k in base)) continue;
    if (k in base) {
      if (JSON.stringify(base[k]) !== JSON.stringify(cur[k])) out[k] = cur[k];
    } else {
      out[k] = cur[k]; // מפתח חדש שנוסף ל-current אחרי הבסיס — שינוי משתמש
    }
  }
  return out;
}

module.exports = { createSettingsPersistence, diffSettings, STORAGE_KEY, FORMAT, VERSION };
