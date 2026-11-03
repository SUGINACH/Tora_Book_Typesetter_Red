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
  const fontCatalog = { loaded: false, families: [], byFamily: new Map(), bytesB64: new Map(), faces: new Set() };
  const designs = new Map(); // collection → {loaded, items:[{id,name,box}]}
  const appliedFontsReady = new Map(); // family → Promise<ArrayBuffer|null>

  async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`imud-library: ${path} → ${r.status}`);
    return r.json();
  }

  /** קטלוג הפונטים (439 משפחות). @returns {Promise<string[]>} */
  async function loadFontCatalog() {
    if (fontCatalog.loaded) return fontCatalog.families;
    const list = await fetchJson(`${BASE}/imud-fonts.json`);
    fontCatalog.families = list.map(e => e.family);
    for (const e of list) fontCatalog.byFamily.set(e.family, e.file);
    fontCatalog.loaded = true;
    return fontCatalog.families;
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
      // 1) Worker: מדידת גופן אמיתי (measure-impl=font-metrics) + ייצוא PDF
      try {
        await engine.registerFont({ name: family, bytes: buf.slice(0) });
      } catch (e) { /* רישום נכשל — נמשיך ל-FontFace; הייצוא ידווח בבירור */ }
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

  /** ברירות המחדל המקוריות — ייבוא מלא דרך טבלת ה-disposition. */
  async function loadLegacyDefaults() {
    const legacy = await fetchJson(`${BASE}/default_settings.json`);
    const { settings, unmapped, report } = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)));
    return { settings, unmapped, report };
  }

  /** CSS של הפונטים שנטענו — להטמעה בייצוא HTML העצמאי (@font-face data-URI). */
  function exportFontCss() {
    let css = '';
    for (const [family, b64] of fontCatalog.bytesB64) {
      css += `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:swap}\n`;
    }
    return css;
  }

  return { loadFontCatalog, loadFont, loadDefaultExportFont, listDesigns, ensureDesign, loadLegacyDefaults, exportFontCss };
}

module.exports = { createImudLibrary, DESIGN_FILES };
