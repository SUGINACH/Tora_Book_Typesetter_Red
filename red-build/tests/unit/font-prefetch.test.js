// tests/unit/font-prefetch.test.js — ui/font-prefetch.js (Agent 3).
// (1) רשימת גופני העלייה זהה למה שברירות המחדל באמת דורשות; (2) התנהגות (מארח מרוחק/מקומי/Data Saver/כשלים);
// (3) parity: מה שמגיע למנוע (registerFont: שמות, סדר, בתים) זהה עם ובלי שליפה מקדימה — לכן גם ה-layout hash זהה.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { describe, it, assert, assertEq, report } = require('../harness');

const RED = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(RED, 'ui', 'assets', 'imud');
const FP = require(path.join(RED, 'ui', 'font-prefetch.js'));
const sha1 = (u8) => crypto.createHash('sha1').update(Buffer.from(u8)).digest('hex');
const tick = () => new Promise((r) => setImmediate(r));
const rd = (f) => JSON.parse(fs.readFileSync(path.join(ASSETS, f), 'utf8'));

// מראה של FONT_SETTING_KEYS ב-app-shell.js (נבדק מול המקור בבדיקה הראשונה)
const FONT_KEYS = ['body-font', 'first-word-font', 'dh-font', 'f-note-body-font',
  ...Array.from({ length: 8 }, (_, i) => `heading-${i}-font`),
  'shaar-title-font', 'shaar-subtitle-font', 'shaar-desc-font', 'shaar-sections-font',
  'shaar-author-font', 'shaar-year-font', 'shaar-back-text-font'];
for (const side of ['recto', 'verso']) for (const pos of ['right', 'center', 'left']) FONT_KEYS.push(`header-${side}-${pos}-font`);

function resolveFamily(v, f2f) {
  if (!v) return null;
  const s = String(v).trim();
  if (f2f.has(s)) return s;
  const parts = String(v).replace(/'/g, '').split(',').map((x) => x.trim()).filter(Boolean)
    .filter((p) => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
  for (const p of parts) if (f2f.has(p)) return p;
  return null;
}
function bootFiles() {
  const imud = rd('imud-fonts.json'), ext = rd('fonts-extended.json');
  const f2f = new Map(); // כמו fontCatalog.byFamily ב-imud-library: TTF — האחרון זוכה; מורחב — הראשון, ואינו דורס
  for (const e of imud) f2f.set(e.family, e.file);
  for (const e of ext) if (!f2f.has(e.family)) f2f.set(e.family, e.file);
  const { importImudSettings } = require(path.join(RED, 'src', 'engine', 'core', 'legacy-settings-map'));
  const { getSettingDefs } = require(path.join(RED, 'src', 'engine', 'core', 'settings-registry'));
  const { settings } = importImudSettings(rd('default_settings.json'), new Set(getSettingDefs().map((r) => r.id)), { availableFonts: new Set(f2f.keys()) });
  const files = new Set(['FrankReal-Bold.ttf', 'DavidLibre-Bold.ttf']); // loadWindowFont / loadHeadingFont
  for (const k of FONT_KEYS) { const fam = resolveFamily(settings[k], f2f); if (fam) files.add(f2f.get(fam)); }
  return { files: [...files].sort(), settings };
}

describe('font-prefetch — רשימת גופני העלייה', () => {
  it('מראה FONT_KEYS תואם את app-shell.js (מפתחות מילוליים ושתי התבניות)', () => {
    const src = fs.readFileSync(path.join(RED, 'src', 'ui', 'app-shell.js'), 'utf8');
    for (const k of ['body-font', 'first-word-font', 'dh-font', 'f-note-body-font', 'shaar-title-font', 'shaar-subtitle-font', 'shaar-desc-font', 'shaar-sections-font', 'shaar-author-font', 'shaar-year-font', 'shaar-back-text-font']) {
      assert(src.includes(`'${k}'`), `app-shell.js מכיל '${k}'`);
    }
    assert(src.includes('heading-${i}-font') && src.includes('header-${side}-${pos}-font'), 'תבניות heading/header קיימות ב-app-shell.js');
  });
  it('FILES זהה לנדרש לפי ברירות המחדל — אם נכשל, עדכן את FILES ב-ui/font-prefetch.js', () => {
    assertEq([...FP.FILES].sort(), bootFiles().files, 'FILES = גופני העלייה בפועל');
  });
  it('כל קובץ ברשימה קיים בדיסק ואין כפילויות', () => {
    for (const f of FP.FILES) assert(fs.existsSync(path.join(ASSETS, 'fonts', f)), 'קיים: ' + f);
    assertEq(new Set(FP.FILES).size, FP.FILES.length, 'ללא כפילויות');
  });
  it('index.html טוען את הסקריפט כ-defer, באותה גרסת cache-busting של שאר הנכסים', () => {
    const html = fs.readFileSync(path.join(RED, 'ui', 'index.html'), 'utf8');
    const m = html.match(/<script src="font-prefetch\.js\?v=([^"]+)" defer><\/script>/);
    assert(!!m, 'index.html מכיל <script src="font-prefetch.js?v=…" defer>');
    const v = fs.readFileSync(path.join(RED, 'src', 'ui', 'browser-entry.js'), 'utf8').match(/ASSET_VERSION = '([^']+)'/);
    assertEq(m[1], v[1], 'אותה גרסה כמו ASSET_VERSION');
  });
  it('הסקריפט עצמאי (נטען כ-script רגיל, לא דרך ה-bundle): ללא require/import', () => {
    const src = fs.readFileSync(path.join(RED, 'ui', 'font-prefetch.js'), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    assert(!/\brequire\(|\bimport\s/.test(src), 'אין require/import');
  });
});

describe('font-prefetch — התנהגות', () => {
  const mkEnv = (host, nav) => { const calls = []; return { calls, location: { hostname: host }, navigator: nav || {}, fetch(url, init) { calls.push([url, init]); return Promise.resolve({ ok: true }); } }; };
  it('מארח מרוחק: שליפה אחת לכל קובץ; URL זהה ל-loadFont (assets/imud/fonts/<file>); cache=force-cache', () => {
    const env = mkEnv('suginach.github.io');
    assertEq(FP.prefetchBootFonts(env), FP.FILES.length, 'מספר שליפות');
    assertEq(env.calls.map((c) => c[0]), FP.FILES.map((f) => 'assets/imud/fonts/' + f), 'URL-ים');
    assert(env.calls.every((c) => c[1] && c[1].cache === 'force-cache'), 'cache=force-cache');
  });
  it('שרת מקומי / file:// — מדולג (אין RTT, אין תועלת)', () => {
    for (const h of ['localhost', '127.0.0.1', '127.5.5.5', '[::1]', '']) {
      const env = mkEnv(h); assertEq(FP.prefetchBootFonts(env), 0, 'מדולג: "' + h + '"'); assertEq(env.calls.length, 0, 'ללא fetch');
    }
  });
  it('Data Saver — מדולג', () => {
    const env = mkEnv('example.org', { connection: { saveData: true } });
    assertEq(FP.prefetchBootFonts(env), 0, 'מדולג'); assertEq(env.calls.length, 0, 'ללא fetch');
  });
  it('אין fetch — מחזיר 0 בלי לזרוק', () => {
    assertEq(FP.prefetchBootFonts({ location: { hostname: 'example.org' } }), 0, '0');
  });
  it('כשל אינו נזרק ואינו נשאר כדחייה לא-מטופלת (fetch שנדחה / זורק סינכרונית)', async () => {
    const rejecting = { location: { hostname: 'example.org' }, fetch: () => Promise.reject(new Error('net')) };
    assertEq(FP.prefetchBootFonts(rejecting), FP.FILES.length, 'נספרו');
    await tick(); // דחייה לא-מטופלת הייתה מפילה את התהליך (Node ≥ 15)
    const throwing = { location: { hostname: 'example.org' }, fetch: () => { throw new Error('sync'); } };
    assertEq(FP.prefetchBootFonts(throwing), 0, 'שגיאה סינכרונית נבלעת');
  });
});

describe('font-prefetch — parity: מה שמגיע למנוע זהה עם ובלי שליפה', () => {
  const makeFetch = (log) => async (url) => {
    log.push(String(url));
    const p = path.join(ASSETS, String(url).replace(/^assets\/imud\//, ''));
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return { ok: false, status: 404 };
    const buf = fs.readFileSync(p);
    return { ok: true, status: 200, json: async () => JSON.parse(buf.toString('utf8')), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  };
  async function runBoot(withPrefetch) {
    const log = [], calls = [], saved = global.fetch;
    global.fetch = makeFetch(log);
    try {
      const { createImudLibrary } = require(path.join(RED, 'src', 'ui', 'imud-library'));
      const engine = { registerFont: async (x) => { calls.push({ name: x.name, sha: sha1(x.bytes) }); return { ok: true }; }, registerAssets: async () => ({ ok: true }) };
      const lib = createImudLibrary(engine);
      if (withPrefetch) FP.prefetchBootFonts({ fetch: global.fetch, location: { hostname: 'example.org' }, navigator: {} });
      await lib.loadFontCatalog();
      const { settings } = await lib.loadLegacyDefaults();
      const seen = new Set(); // כמו loadFontsForCurrentSettings ב-app-shell: לפי ערך, בסדרה
      for (const k of FONT_KEYS) { const v = settings[k]; if (!v || seen.has(v)) continue; seen.add(v); await lib.loadFontStack(v); }
    } finally { global.fetch = saved; }
    return { calls, log };
  }
  const fontUrls = (log) => [...new Set(log.filter((u) => /\/fonts\//.test(u)))].sort();

  it('רצף registerFont (שם + sha1 של הבתים) זהה עם ובלי שליפה מקדימה', async () => {
    const A = await runBoot(false), B = await runBoot(true);
    assert(A.calls.length >= 12, 'נרשמו לפחות 12 גופנים (נרשמו ' + A.calls.length + ')');
    assert(A.calls.some((c) => c.name === 'FrankReal') && A.calls.some((c) => c.name === 'DavidLibre-Bold'), 'גופני החלון והכותרות נרשמו');
    assertEq(B.calls, A.calls, 'אותו רצף, אותם שמות, אותם בתים');
  });
  it('קבוצת ה-URL-ים של הגופנים שהספרייה שולפת = רשימת השליפה (פגיעה במטמון ה-HTTP מובטחת בשם)', async () => {
    const A = await runBoot(false), B = await runBoot(true);
    const expected = FP.FILES.map((f) => 'assets/imud/fonts/' + f).sort();
    assertEq(fontUrls(A.log), expected, 'בלי שליפה: הספרייה שולפת בדיוק את הרשימה');
    assertEq(fontUrls(B.log), expected, 'עם שליפה: לא נוסף ולא חסר URL');
  });
});

report('font-prefetch');
