// src/ui/imud-library.js — ספריית נכסי IMUD בדפדפן (03.11, EXT-14)
'use strict';

/**
 * טעינה עצלה של נכסי הפרויקט המקורי המוטמעים (ui/assets/imud/):
 *  - imud-fonts.json — קטלוג 439 פונטי העדיפות (הומרו ל-TTF)
 *  - shaar_main/sub/back, ornaments_up_down/left_right, section_dividers,
 *    header_ornaments — עיצובי SVG (חיטוי ברישום)
 *  - default_settings.json — לחצן «ברירות המחדל המקוריות»
 *
 * רישום דו-צדדי: asset-registry חי גם בחבילת ה-UI (רינדור תצוגה) וגם ב-Worker
 * (עימוד/ייצוא) — כל פריט נרשם בשניהם. פונטים: FontFace לתצוגה + registerFont
 * ב-Worker (מדידת font-metrics) + הבתים נשמרים לייצוא PDF.
 */

const { registerAssets } = require('../engine/decoration/asset-registry');
const { importImudSettings } = require('../engine/core/legacy-settings-map');
const { getSettingDefs } = require('../engine/core/settings-registry');

const BASE = 'assets/imud';
const DESIGN_FILES = {
  'shaar-main': 'shaar_main.json',
  'shaar-sub': 'shaar_sub.json',
  'shaar-back': 'shaar_back.json',
  'orn-ud': 'ornaments_up_down.json',
  'orn-lr': 'ornaments_left_right.json',
  'divider': 'section_dividers.json',
  'hdr-orn': 'header_ornaments.json'
};

function createImudLibrary(engine) {
  const fontCatalog = { loaded: false, loading: null, families: [], byFamily: new Map(), bytesB64: new Map(), faces: new Set(), extended: [], extendedByFamily: new Map() };
  const designs = new Map(); // collection → {loaded, items:[{id,name,box}]}
  const appliedFontsReady = new Map(); // family → Promise<ArrayBuffer|null>

  async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`imud-library: ${path} → ${r.status}`);
    return r.json();
  }

  /** קטלוג הפונטים (443 משפחות מוטמעות + 1,315 משפחות הקטלוג המורחב).
   * **S6.3 (בקשת משתמש מפורשת: "האם כל הגופנים יובאו מהגרסאות הקודמות?"):**
   * קובצי ה-WOFF2 של הקטלוג המורחב (1,315 משפחות, 98MB) יובאו בפועל
   * מהמקור (Green/V23) ל-fonts/ — כל משפחה נטענת ובת בחירה. TTF-ים
   * נרשמים גם ב-Worker (מדידת אמת + ייצוא PDF); WOFF2-ים ב-FontFace
   * לתצוגה בלבד (המדידה נופלת בשקיפות לטבלה — מנגנון _bindProfile).
   * @returns {Promise<Array<{value:string,label:string,embedded:boolean}>>} */
  async function loadFontCatalog() {
    if (fontCatalog.loaded) return catalogEntries();
    // **S5.2:** מטמון הבטחה בטיסה — שתי קריאות מקבילות (עלייה: פיקרים + ברירות
    // מחדל) תפיקו טעינה אחת בלבד; בעבר נבדק רק loaded אחרי הפתרון ⇒ כל קריאה
    // בזמן טעינה שיכפלה את ה-fetch (~400KB חינם). כישלון מנקה את המטמון —
    // קריאה חוזרת תנסה שוב (לא תיתקע על הבטחה שנכשלה).
    if (fontCatalog.loading) return fontCatalog.loading;
    const p = (async () => {
      const list = await fetchJson(`${BASE}/imud-fonts.json`);
      fontCatalog.families = list.map(e => e.family);
      for (const e of list) fontCatalog.byFamily.set(e.family, e.file);
      fontCatalog.loaded = true;
      // **S6.3:** הקטלוג המורחב — קובצי ה-WOFF2 יובאו ומוטמעים כעת בפועל;
      // נטענים ל-byFamily כמו ה-TTF-ים (הכשלון אינו חוסם: הפיקרים יציגו
      // את המוטמעות הבסיסיות בלבד, כמו קודם)
      try {
        const ext = await fetchJson(`${BASE}/fonts-extended.json`);
        fontCatalog.extended = ext.map(e => e.family);
        fontCatalog.extendedByFamily = new Map(ext.map(e => [e.family, e]));
        for (const e of ext) {
          if (!fontCatalog.byFamily.has(e.family)) fontCatalog.byFamily.set(e.family, e.file);
        }
      } catch (e) { fontCatalog.extended = []; fontCatalog.extendedByFamily = new Map(); }
      return catalogEntries();
    })();
    fontCatalog.loading = p;
    try {
      return await p;
    } finally {
      fontCatalog.loading = null;
    }
  }

  /** רשימת הפיקרים: מוטמעות ראשונות, אחר-כך הקטלוג המורחב — **S6.3:** קובצי
   * ה-WOFF2 יובאו, ולכן כל המשפחות מוטמעות ונטענות; embedded=true לכולן. */
  function catalogEntries() {
    const entries = fontCatalog.families.map(f => ({ value: f, label: f, embedded: true }));
    for (const f of fontCatalog.extended) {
      entries.push({ value: f, label: f, embedded: true });
    }
    return entries;
  }

  /** **EXT-14 + S6.3: סיווג אמת למשפחה** — 'embedded' | 'unknown'. הקטלוג
   * המורחב אינו "קטלוג-בלבד" עוד — קובציו יובאו והוא נטען כמו ה-TTF-ים;
   * ההבחנה TTF(מדידה+ייצוא)/WOFF2(תצוגה) פנימית ל-loadFont לפי הסיומת. */
  function fontStatus(family) {
    const f = String(family || '').trim();
    if (fontCatalog.byFamily.has(f)) return 'embedded';
    return 'unknown';
  }

  /** טעינת פונט TTF: בתים ל-Worker (מדידה+ייצוא) + FontFace לתצוגה. @returns {Promise<ArrayBuffer|null>} */
  async function loadFont(family) {
    if (!fontCatalog.loaded) await loadFontCatalog();
    const file = fontCatalog.byFamily.get(family);
    if (!file) return null; // פונן מחוץ לספרייה — המערכת תיפול לגופן מערכת (מתועד)
    if (appliedFontsReady.has(family)) return appliedFontsReady.get(family);
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/${file}`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      // בסיס 64 לייצוא HTML העצמאי (@font-face data-URI) — מחושב פעם אחת בטעינה
      try {
        const u8 = new Uint8Array(buf);
        let bin = '';
        const CH = 0x8000;
        for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
        fontCatalog.bytesB64.set(family, btoa(bin));
      } catch (e) { /* אין btoa (סביבה חריגה) — הייצוא ידלג על ההטמעה */ }
      // 1) Worker: מדידת גופן אמיתי (measure-impl=font-metrics) + ייצוא PDF.
      // **S6.3:** קובצי WOFF2 אינם ניתנים לפרסור ב-Worker (parseFont תומך
      // sfnt בלבד) — דילוג מפורש על הרישום: תצוגה ב-FontFace (הדפדפן תומך
      // WOFF2 מלידה), המדידה נופלת בשקיפות לטבלה (_bindProfile), והייצוא
      // מדווח. TTF-ים נרשמים כרגיל.
      // **S5.2:** רישום שמת עם ה-Worker (terminate/ביטול single-flight) — עדכון
      // במפורש: הגופן לא נרשם במנוע. בלי זה ההבטחה היתה נפתרת ב"הכל בסדר"
      // והמטמון (appliedFontsReady) היה מחזיר אותה לנצח ⇒ ייצוא תלוי/מדידה שגויה.
      const isWoff2 = /\.woff2$/i.test(String(file || ''));
      if (!isWoff2) {
        try {
          await engine.registerFont({ name: family, bytes: buf.slice(0) });
        } catch (e) {
          if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
          /* רישום נכשל (סיבה אחרת) — נמשיך ל-FontFace; הייצוא ידווח בבירור */
        }
      }
      // 2) תצוגה: @font-face חי
      if (!fontCatalog.faces.has(family) && typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace(family, buf);
          await face.load();
          document.fonts.add(face);
          fontCatalog.faces.add(family);
        } catch (e) { /* פונט תצוגה נכשל — הייצוא עדיין תקין */ }
      }
      return buf;
    })();
    appliedFontsReady.set(family, p);
    // **S5.2:** הבטחה שנדחתה (restart/קריסה) מנקה את המטמון — קריאה חוזרת
    // תרשום מחדש על ה-Worker שהוזרם (respawn) ולא תחזיר הבטחה מתה לנצח.
    p.catch(() => { appliedFontsReady.delete(family); });
    return p;
  }

  /** **03.11(ג):** גופן יציב לייצוא PDF כשהגופן המבוקש אינו בספרייה —
   * עדיפות לגרסאות "פרנק רוהל דף" (המקבילה התורנית של Frank Ruhl Libre),
   * ואז "פרנק רה רגיל", ולבסוף המשפחה הראשונה בקטלוג. */
  async function loadDefaultExportFont() {
    if (!fontCatalog.loaded) await loadFontCatalog();
    const prefs = ['פרנק רוהל דפ רגיל', 'פרנק רה רגיל'];
    for (const f of prefs) {
      if (fontCatalog.byFamily.has(f)) {
        const bytes = await loadFont(f);
        if (bytes) return { family: f, bytes };
      }
    }
    const first = fontCatalog.families[0];
    if (first) {
      const bytes = await loadFont(first);
      if (bytes) return { family: first, bytes };
    }
    return null;
  }

  /** רשימת עיצובי אוסף (מזהה+שם) — טעינה עצלה של הקובץ. */
  async function listDesigns(collection) {
    const meta = designs.get(collection);
    if (meta && meta.loaded) return meta.items;
    const file = DESIGN_FILES[collection];
    if (!file) return [];
    const raw = await fetchJson(`${BASE}/${file}`);
    const items = (raw || []).map(d => ({ id: d.id, name: d.name || d.id, box: d.box || null }));
    designs.set(collection, { loaded: true, items, raw: new Map((raw || []).map(d => [d.id, d])) });
    return items;
  }

  /** רישום פריט עיצוב בשני הצדדים (UI + Worker) והחזרת ההפניה המלאה. */
  async function ensureDesign(collection, id) {
    const meta = designs.get(collection);
    if (meta && meta.raw && meta.raw.has(id) && meta.registered && meta.registered.has(id)) {
      return `imud:${collection}:${id}`;
    }
    if (!meta || !meta.raw) await listDesigns(collection);
    const m = designs.get(collection);
    const item = m.raw && m.raw.get(id);
    if (!item) return null;
    // UI-side: רישום מקומי (התצוגה מרנדרת דרך dom-renderer)
    const resUi = registerAssets(collection, [{ id: item.id, name: item.name, svg: item.svg, box: item.box }]);
    if (!resUi.ok && resUi.registered === 0) throw new Error(`imud-library: design rejected (${resUi.rejected[0] && resUi.rejected[0].reason})`);
    // Worker-side: העברת ה-SVG דרך הפרוטוקול (register-assets)
    try {
      await engine.registerAssets({ collection, items: [{ id: item.id, name: item.name, svg: item.svg, box: item.box }] });
    } catch (e) { /* ה-Worker ידווח; התצוגה עדיין תקינה */ }
    if (!m.registered) m.registered = new Set();
    m.registered.add(id);
    return `imud:${collection}:${id}`;
  }

  /** **03.11(ד):** פתרון ערך גופן (משפחה בודדת או מחסנית "'A', 'B', serif")
   * למשפחה הראשונה הקיימת בקטלוג — בדיוק כפי שהדפדפן היה נופל במחסנית.
   * @returns {string|null} שם משפחה מהקטלוג, או null אם אף אחת אינה זמינה. */
  function resolveFamily(value) {
    if (!fontCatalog.loaded || !value) return null;
    const raw = String(value).replace(/'/g, '');
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
      .filter(p => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
    for (const p of parts) if (fontCatalog.byFamily.has(p)) return p;
    return null;
  }

  /** **03.11(ד) + S5.2:** טעינת גופן לפי ערך הגדרה — תומך גם במחסנית (נפתרת מול
   * הקטלוג) וגם במשפחה בודדת. מחזיר Promise<ArrayBuffer|null>.
   * **S5.2:** ממתין קודם לטעינת הקטלוג — בעבר, קריאה לפני שהקטלוג נטען החזירה
   * null בשקט (byFamily ריק) גם כשהמשפחה קיימת בספרייה (נתיב getExportFont). */
  async function loadFontStack(value) {
    if (value == null) return null;
    if (!fontCatalog.loaded) {
      try { await loadFontCatalog(); } catch (e) { /* ספרייה לא זמינה — ההגדרה תיפול לגופן מערכת */ }
    }
    const direct = fontCatalog.byFamily.get(String(value).trim());
    if (direct) return loadFont(String(value).trim());
    const resolved = resolveFamily(value);
    return resolved ? loadFont(resolved) : null;
  }

  /** **EXT-14 (05.11): ערכות סגנון-ספר מהמקור (setting_sets/):** תלמוד/פרשנות/קונטרס —
   * תצורות מלאות (249 מפתחות) שהמקור טען דרך הדרופדאון style-set-select
   * (settings-manager.js: loadSettingsFromFile('setting_sets/<name>')). כאן אותה
   * חוזה: כל ערכה עוברת את אותה טבלת disposition כמו ברירות המחדל — אין מסלול
   * מיוחד; ההבדלים חייבים לשרוד את הייבוא (בדיקה מחייבת ב-setting-sets.test.js). */
  const SETTING_SETS = ['תלמוד', 'פרשנות', 'קונטרס'];

  /** רשימת הערכות המוטמעות (שמות קבצים בלבד — לא נטענות עד בחירה). */
  function listSettingSets() { return SETTING_SETS.slice(); }

  /** טעינת ערכה וייבוא מלא דרך importImudSettings (עם קטלוג הגופנים —
   * כמו loadLegacyDefaults: מחסניות הגופן נפתרות למשפחות מוטמעות). */
  async function loadSettingSet(name) {
    if (!SETTING_SETS.includes(name)) throw new Error(`ערכה לא מוכרת: ${name}`);
    if (!fontCatalog.loaded) await loadFontCatalog().catch(() => {});
    const legacy = await fetchJson(`${BASE}/setting_sets/${encodeURIComponent(name)}.json`);
    const { settings, unmapped, report } = importImudSettings(
      legacy,
      new Set(getSettingDefs().map(r => r.id)),
      { availableFonts: fontCatalog.byFamily ? new Set(fontCatalog.byFamily.keys()) : undefined }
    );
    return { name, settings, unmapped, report };
  }

  /** ברירות המחדל המקוריות — ייבוא מלא דרך טבלת ה-disposition.
   * **03.11(ד):** מועבר גם קטלוג הגופנים הזמין — כך שמחסניות הגופן של המקור
   * ("'AlphaBlack', 'David Libre', serif") נפתרות מיד למשפחה הזמינה בפועל
   * (David Libre) וההגדרות שמתקבלות ניתנות לטעינה ולמדידה אמיתית.
   * **S4.15 (גופן מילת-החלון):** בטעינת הברירות נרשם גם FrankReal-Bold תחת
   * השם 'FrankReal' — גופן מילת-החלון של המקור (המשתמש המקורי הריץ עם
   * הגופן מותקן במערכת; הוכח מסימון הייחוס: 116 מילות-חלון ברוחב
   * FrankReal-Bold בדיוק 0.03px). בלי זה — המדידה והתצוגה נופלות לגופן
   * הגוף ושורות 0–1 של כל פסקת-חלון נשברות אחרת. */
  async function loadLegacyDefaults() {
    if (!fontCatalog.loaded) await loadFontCatalog().catch(() => {});
    const legacy = await fetchJson(`${BASE}/default_settings.json`);
    const { settings, unmapped, report } = importImudSettings(
      legacy,
      new Set(getSettingDefs().map(r => r.id)),
      { availableFonts: fontCatalog.byFamily ? new Set(fontCatalog.byFamily.keys()) : undefined }
    );
    // **S4.15:** רישום גופן החלון (מדידה ב-Worker + FontFace לתצוגה + base64
    // לייצוא HTML) — בלי להיכשל אם הקובץ חסר (fallback מתועד).
    try { await loadWindowFont(); } catch (e) { /* אין FrankReal-Bold — fallback */ }
    // **S4.26:** רישום גופן הכותרות (DavidLibre-Bold) — מדידה+תצוגה מודגשת.
    try { await loadHeadingFont(); } catch (e) { /* אין DavidLibre-Bold — fallback */ }
    return { settings, unmapped, report };
  }

  /** **S4.15:** טעינת FrankReal-Bold.ttf תחת המשפחה 'FrankReal' (מדידה+
   * תצוגה+ייצוא) — לגופן מילת-החלון, כמו 'FrankReal' במערכת של המקור. */
  async function loadWindowFont() {
    if (appliedFontsReady.has('FrankReal')) return appliedFontsReady.get('FrankReal');
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/FrankReal-Bold.ttf`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const u8 = new Uint8Array(buf);
      try {
        let bin = '';
        const CH = 0x8000;
        for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
        fontCatalog.bytesB64.set('FrankReal', btoa(bin));
      } catch (e) { /* אין btoa — הייצוא ידלג */ }
      try {
        await engine.registerFont({ name: 'FrankReal', bytes: buf.slice(0) });
      } catch (e) {
        // **S5.2:** מוות ה-Worker (restart) — דחייה מפורשת + ניקוי המטמון (רישום
        // חוזר בקריאה הבאה על המופע שהוזרם); כשל אחר — תצוגה בלבד כמו קודם.
        if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
        /* רישום נכשל — תצוגה בלבד */
      }
      if (!fontCatalog.faces.has('FrankReal') && typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace('FrankReal', buf);
          await face.load();
          document.fonts.add(face);
          fontCatalog.faces.add('FrankReal');
        } catch (e) { /* פונט תצוגה נכשל */ }
      }
      return buf;
    })();
    appliedFontsReady.set('FrankReal', p);
    p.catch(() => { appliedFontsReady.delete('FrankReal'); }); // **S5.2:**
    return p;
  }

  /** **S4.26 (דיווח משתמש: "האתר לא משתמש בגופני ברירת המחדל"):** גופן
   * הכותרות של המקור בפועל — DavidLibre-Bold. נרשם ב-Worker תחת
   * 'DavidLibre-Bold' (מדידת כותרות — headingApi) וכ-FontFace של המשפחה
   * 'David Libre' במשקל 700 (תצוגת כותרות מודגשות — כמו הייחוס, שבו כל
   * הכותרות ושורות ה-TOC ב-DavidLibre-Bold). */
  async function loadHeadingFont() {
    if (appliedFontsReady.has('DavidLibre-Bold')) return appliedFontsReady.get('DavidLibre-Bold');
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/DavidLibre-Bold.ttf`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      try {
        await engine.registerFont({ name: 'DavidLibre-Bold', bytes: buf.slice(0) });
      } catch (e) {
        // **S5.2:** מוות ה-Worker (restart) — דחייה מפורשת + ניקוי המטמון.
        if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
        /* רישום נכשל — תצוגה בלבד */
      }
      if (typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace('David Libre', buf, { weight: '700' });
          await face.load();
          document.fonts.add(face);
          if (!fontCatalog.faces.has('David Libre')) fontCatalog.faces.add('David Libre');
        } catch (e) { /* פונט תצוגה נכשל */ }
      }
      return buf;
    })();
    appliedFontsReady.set('DavidLibre-Bold', p);
    p.catch(() => { appliedFontsReady.delete('DavidLibre-Bold'); }); // **S5.2:**
    return p;
  }

  /** CSS של הפונטים שנטענו — להטמעה בייצוא HTML העצמאי (@font-face data-URI). */
  function exportFontCss() {
    let css = '';
    for (const [family, b64] of fontCatalog.bytesB64) {
      const fmt = /\.woff2$/i.test(String(fontCatalog.byFamily.get(family) || '')) ? 'woff2' : 'ttf';
      css += `@font-face{font-family:'${family}';src:url(data:font/${fmt};base64,${b64}) format('${fmt === 'woff2' ? 'woff2' : 'truetype'}');font-display:swap}\n`;
    }
    return css;
  }

  /** **S6.2 (בקשת משתמש — "האם כל העיטורים, שערים... יובאו?"): הפעלת
   * ערכת שערים מאוחדת לפי מספר ערכה** — כמו active-theme-select של המקור
   * ("json_theme_40" ⇒ ערכה 40: שער ראשי + משנה + אחורי מעוצבים יחד,
   * REQ-ORN-06). מאתר בכל אוסף את הפריט ששמו מתחיל ב-"<מספר> " (כגון
   * "40   שער ראשי"), רושם אותו בשני הצדדים ומחזיר את ההפניות במבנה
   * מפתחות-הגדרות מוכן להחלה: { 'imud-shaar-main': 'imud:shaar-main:<id>', … }.
   * @returns {Promise<object>} רק הערכים שנמצאו (ערכה חלקית בספרייה ⇒ חלקית)
   */
  async function ensureThemeSet(setNo) {
    const ROLES = [
      { collection: 'shaar-main', setting: 'imud-shaar-main' },
      { collection: 'shaar-sub', setting: 'imud-shaar-sub' },
      { collection: 'shaar-back', setting: 'imud-shaar-back' }
    ];
    const prefix = new RegExp(`^\\s*${Number(setNo)}\\s+`);
    const out = {};
    for (const { collection, setting } of ROLES) {
      try {
        const items = await listDesigns(collection);
        const hit = items.find((it) => prefix.test(String(it.name || '')));
        if (!hit) continue;
        const ref = await ensureDesign(collection, hit.id);
        if (ref) out[setting] = ref;
      } catch (e) { /* אוסף חסר — התפקיד נשאר בלי רקע, מתועד */ }
    }
    return out;
  }

  /** **EXT-9:** משפחות הקטלוג שנטענו (סינכרוני) — לפתרון מחסניות גופן בייבוא
   * הגדרות/תבניות (importImudSettings ctx.availableFonts). null אם הקטלוג
   * עוד לא נטען — הייבוא ייפול למשפחה הראשונה (התנהגות היסטורית, מתועדת). */
  function catalogFamilies() {
    return fontCatalog.loaded ? new Set(fontCatalog.byFamily.keys()) : null;
  }

  return { loadFontCatalog, loadFont, loadDefaultExportFont, listDesigns, ensureDesign, ensureThemeSet, loadLegacyDefaults, loadHeadingFont, exportFontCss, resolveFamily, loadFontStack, catalogFamilies, listSettingSets, loadSettingSet, fontStatus, catalogEntries };
}

module.exports = { createImudLibrary, DESIGN_FILES };
