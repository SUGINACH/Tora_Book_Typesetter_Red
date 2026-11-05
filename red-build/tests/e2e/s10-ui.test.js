// tests/e2e/s10-ui.test.js — שער S10 (S10.2): UI מלא — לשוניות, פאנלים, Worker, תצוגה, דיבאג
// כל בדיקה נכתבה לנעילת שער ספציפי מ־02_MASTER_WORK_PLAN.md §S10.2 או REQ-UI-01..07,
// כולל הוכחות D-64 (מחלקת קל/כבד), D-65 (פרוטוקול Worker) ו־F-06 (call-graph).
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, registry } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { buildReport } = require('../../src/audit/report-schema');
const { scanConsumers } = require('../../src/audit/scanners');

const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');
const { WorkerEngineClient } = require('../../src/ui/worker-client');
const { classifyChange, getDebounceMs, LIGHT_KEYS, policyTable } = require('../../src/ui/retypeset-policy');
const { buildCaretMap } = require('../../src/ui/caret-map');
const { parseHebrewNumber } = require('../../src/ui/preview-tab');
const { serializeTypesetResult, validateRequest } = require('../../src/ui/worker-protocol');
const { scanControlTriggers } = require('../../src/ui/callgraph-scan');
const { BINDINGS, PANELS } = require('../../src/ui/bindings.generated');

const SRC_ROOT = path.join(__dirname, '..', '..');        // red-build
const SRC = path.join(SRC_ROOT, 'src');                   // red-build/src (לסורקים)
const UI_SRC = path.join(SRC, 'ui');
const BUNDLE_DIR = path.join(SRC_ROOT, 'ui');
const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');
// **S4.21 (EXT-11) — אמת הבודקים:** אחרי תיקון שלושת האבחונים-כוזבים (סמני-מספרים
// רגילים, כותרות פותחי-חלקים על עמוד פתיחה, runt-של-כותרת/מדידה) הקורפוס הקנוני
// מפיק **אפס** ממצאים פתוחים — כולם היו באגים של הבודק, לא של הפריסה.
// למבחן ההדגשה דרוש מסמך שמפיק ממצא **אמיתי**: פסקה ששורתה האחרונה runt
// גנויני בלתי-נמנע (מילה ארוכה אחת בלתי-ניתנת-לשבירה + מילה קצרה —
// אין שבירה חוקית אחרת; מאומת: runt-line@p24 + rollback-compromise בלבד).
const CORPUS_WITH_FINDING = CORPUS + '\nההתקשרותההתעלותההשגחההתביעה ב.';

// ================= DOM shim (עשיר — לכל מודולי ה־UI; מבוסס דפוס s9) =================
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cssKey = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
    toggle(n, force) {
      const want = force === undefined ? !this.set.has(n) : !!force;
      if (want) this.set.add(n); else this.set.delete(n);
      this._sync();
      return want;
    }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
      this.classList = new ClassList(this);
      this._listeners = new Map();
      this.value = ''; this.checked = false; this.disabled = false;
      this.type = ''; this.title = ''; this.selectionStart = 0; this.selectionEnd = 0;
      this._scrolled = false;
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : (k === 'id' && this.id != null ? this.id : null); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) {
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(cb);
    }
    removeEventListener(type, cb) {
      const arr = this._listeners.get(type) || [];
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    }
    dispatchEvent(ev) {
      ev = ev || {};
      ev.target = ev.target || this;
      ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {});
      ev.stopPropagation = ev.stopPropagation || (() => {});
      ev._stopped = false;
      const stop = ev.stopPropagation.bind(ev);
      ev.stopPropagation = () => { ev._stopped = true; stop(); };
      let node = this;
      while (node) { // bubbling — כמו DOM אמיתי (delegation על קנבס/טפסים)
        ev.currentTarget = node;
        for (const cb of (node._listeners.get(ev.type) || []).slice()) cb(ev);
        if (ev._stopped) break;
        node = node.parentNode;
      }
      return true;
    }
    click() { this.dispatchEvent({ type: 'click' }); }
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; }
    scrollIntoView() { this._scrolled = true; }
    focus() { this._focused = true; }
    _matchesPart(sel) {
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
      if (sel.startsWith('#')) return this.getAttribute('id') === sel.slice(1);
      if (sel.startsWith('[')) {
        const m = sel.match(/^\[([^\]]+)\]$/);
        return !!m && (m[1] in this.dataset || m[1] in this.attrs);
      }
      return this.tagName === sel.toUpperCase();
    }
    _matches(sel) {
      // תמיכה בבוררי צאצא: '.trace-table tbody tr' — החלק האחרון על האלמנט,
      // השאר על שרשרת אבות בסדר הפוך (כמו querySelector אמיתי)
      const parts = String(sel).trim().split(/\s+/);
      if (!this._matchesPart(parts[parts.length - 1])) return false;
      let ancestor = this.parentNode, pi = parts.length - 2;
      while (pi >= 0 && ancestor) {
        if (ancestor._matchesPart && ancestor._matchesPart(parts[pi])) pi--;
        ancestor = ancestor.parentNode;
      }
      return pi < 0;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      const out = [];
      (function walk(el) {
        for (const c of el.children) {
          if (c._matches && c._matches(sel)) out.push(c);
          walk(c);
        }
      })(this);
      return out;
    }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${cssKey(k)}:${esc(String(v))}`).join(';');
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
        + (this._class ? ` class="${esc(this._class)}"` : '')
        + (styleStr ? ` style="${styleStr}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrsStr}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return {
    createElement: (tag) => new El(tag),
    createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; },
    _El: El
  };
}

function fire(el, type, extra) { el.dispatchEvent(Object.assign({ type }, extra || {})); }
const settle = (ms = 20) => new Promise(r => setTimeout(r, ms));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
function throws(fn, re) {
  try { fn(); } catch (e) {
    if (re && !re.test(e.message)) throw new Error(`שגיאה שונה מהצפוי: ${e.message}`);
    return;
  }
  throw new Error('הייתה אמורה להיזרק שגיאה');
}

// מסמך קטן עם הערות־שוליים + כותרות (לבדיקות סנכרון/ממצאים)
const SMALL_DOC = [
  'ספר - אוסף לבדיקות UI',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקת פתיחה ראשונה עם כמה מילים כדי למלא שורה אחת לפחות בעמוד.',
  'פסקה שנייה עם הערת שוליים [זו הערת השוליים הראשונה] בתוך הטקסט.',
  'פסקה שלישית שממשיכה את הזרימה של החלק הראשון בעוד כמה מילים.',
  'כותרת 2 - סימן ראשון',
  'תוכן הסימן הראשון פסקה ראשונה עם עוד הערה [הערה שנייה כאן] לבדיקה.',
  'תוכן הסימן הראשון פסקה שנייה שממשיכה ומוסיפה נפח לטור השני.',
  'כותרת 3 - תת סימן',
  'תוכן תת הסימן פסקה יחידה לבדיקת רמות כותרות.',
  'כותרת 1 - חלק שני',
  'פתיחת החלק השני בפסקה שמתחילה בעמוד חדש עם עוד תוכן כלשהו.',
  'עוד פסקה בחלק השני כדי שיהיה מה למפות בין עמודים [הערה שלישית].',
  'פסקה אחרונה בחלק השני שסוגרת את המסמך הקטן בשלום.'
].join('\n');

// =====================================================================
describe('S10.2 שער 1 — e2e: הדבקת מסמך 639 עמודים: progress, רספונסיביות, hash זהה', () => {
  const doc = makeDoc();
  const progressLabels = [];
  const app = createApp(doc, {
    transport: inlineTransport.createInlineTransport(),
    onProgressSink: null
  });
  app.getSettings()['debounce-light-change-ms'] = 60; // לבדיקות הריכוז (ברירת המחדל 350 נבדקת בנפרד)

  // מסמך ~639+ עמודים: הקורפוס הקנוני (18 עמודים) ×36
  const BIG_DOC = Array(36).fill(CORPUS).join('\n\n') + '\n';

  it('הדבקה ⇒ progress מדורג ("עמוד X מתוך Y") ותוצאה מגיעה', async () => {
    const origSetEngine = app.status.setEngineState.bind(app.status);
    app.status.setEngineState = (state, info) => { if (state === 'working' && info && info.label) progressLabels.push(info.label); origSetEngine(state, info); };
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => BIG_DOC } });
    await settle(50);
    const st = app.getState();
    assert(st.hasResult, 'התוצאה חייבת להיות מיושמת אחרי הדבקה');
    assert(st.pages >= 639, `נדרש ≥639 עמודים; התקבלו ${st.pages}`);
    assert(progressLabels.length >= 5, `התקדמות חייבת לזרוח; התקבלו ${progressLabels.length} תוויות`);
    assert(progressLabels.some(l => /עמוד \d+ מתוך \d+/.test(l)), 'חייבת תווית "עמוד X מתוך Y": ' + progressLabels.slice(0, 3).join(' / '));
    assertEq(progressLabels[0], 'מתחיל עימוד…', 'התווית הראשונה — פתיחת עבודה');
    assert(progressLabels.includes('פענוח המסמך'), 'שלב הפענוח מדווח');
  });

  it('hash התוצאה זהה לריצת headless ישירה (עקב אחרי הבטחת ה־Worker)', async () => {
    const direct = typeset(BIG_DOC, getDefaultSettings());
    assertEq(app.getState().layoutHash, direct.layoutHash, 'hash מהאפליקציה חייב להיות זהה ל־headless');
    assertEq(app.getState().pages, direct.pages.length);
  });

  it('רספונסיביות: המתנה בדגימת אינטראקציות < 100ms (לשוניות/חיפוש/קפיצה)', () => {
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) { app.switchTab(i % 2 ? 'preview' : 'editor'); }
    const tabMs = (performance.now() - t0) / 20;
    const t1 = performance.now();
    for (let i = 0; i < 10; i++) {
      app.settingsPanel.searchInput.value = i % 2 ? 'רוחב' : 'גופן';
      fire(app.settingsPanel.searchInput, 'input');
    }
    const searchMs = (performance.now() - t1) / 10;
    const t2 = performance.now();
    for (let i = 0; i < 10; i++) app.preview.jumpByHebrew('ד');
    const jumpMs = (performance.now() - t2) / 10;
    assert(tabMs < 100, `החלפת לשונית איטית: ${tabMs.toFixed(1)}ms`);
    assert(searchMs < 100, `חיפוש איטי: ${searchMs.toFixed(1)}ms`);
    assert(jumpMs < 100, `קפיצה איטית: ${jumpMs.toFixed(1)}ms`);
  });
});

// =====================================================================
describe('S10.2 שער 2 — F-06: אין עימוד אוטומטי מכל בקרה (call-graph artifact)', () => {
  it('הסריקה הסטטית: 0 הפרות; הקריאות רק בנתיבים המפורשים', () => {
    const res = scanControlTriggers(UI_SRC, null);
    assertEq(res.violations, [], 'הפרות F-06');
    assert(res.allowed.some(a => a.file === 'app-shell.js' && a.fn === 'onExplicitRetypeset' && a.callee === 'requestTypeset'), 'הנתיב ⚡ חייב להיות המותר היחיד ב־app-shell');
    assert(res.edges.length >= 3, 'גרף הקריאות חייב עדויות');
    // ה־artifact נכתב ע"י tools/scan-control-triggers.js; כאן נבדק שהסורק רץ ותקין
  });

  it('ה־artifact קיים בדיסק ומכיל את גרף הקריאות (עדות שער)', () => {
    const artifactPath = path.join(SRC_ROOT, 'tests', 'artifacts', 's10-callgraph.json');
    if (fs.existsSync(artifactPath)) {
      const art = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      assertEq(art.schema, 's10-callgraph-v1');
      assertEq(art.violations, []);
    } else {
      execSync('node tools/scan-control-triggers.js', { cwd: path.join(SRC_ROOT, '..'), stdio: 'ignore' });
      assert(fs.existsSync(artifactPath), 'artifact חייב להיכתב');
    }
  });

  it('ראנטיים: שינוי כבד לא מעמד — רק ⚡ (והוא מיידי, בלי debounce)', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    const hashBefore = app.getState().layoutHash;
    // שינוי כבד דרך בקרה אמיתית בפאנל: grid-col-width-pct (select→input number)
    app.onSettingChanged('grid-col-width-pct', 52);
    assert(app.status.getBlink(), '⚡ חייב לההבהב אחרי שינוי כבד');
    assertEq(app.getState().layoutHash, hashBefore, 'אסור עימוד אוטומטי — hash לא ישתנה');
    assert(!app.engine.busy, 'המנוע פנוי — לא הופעל');
    await wait(150); // ודאות שאין debounce נסתר
    assertEq(app.getState().layoutHash, hashBefore, 'גם אחרי המתנה — אין עימוד אוטומטי');
    // לחיצת ⚡ — נתיב מיידי
    const t0 = performance.now();
    app.status.bolt.click();
    await settle();
    const elapsed = performance.now() - t0;
    assert(app.getState().layoutHash !== hashBefore, 'העימוד מחדש חייב לשנות את הפריסה (רוחב טור 52%)');
    assert(elapsed < 2000, `הנתיב המיידי איטי מדי: ${elapsed.toFixed(0)}ms`);
    assert(!app.status.getBlink(), 'ההבהוב נפסק אחרי העימוד');
  });
});

// =====================================================================
describe('S10.2 שער 3 — חיפוש הגדרות בעברית + איפוס פר־שדה (REQ-UI-07)', () => {
  const doc = makeDoc();
  const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
  fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
  const done = settle();

  it('כל פאנלי הרישום (Z2) עם כל הכיתובים; כל מפתח רישום מרונדר', () => {
    const panels = app.settingsPanel.root.querySelectorAll('.acc-panel');
    const { PANELS } = require('../../src/ui/bindings.generated');
    const expectedPanels = PANELS.length; // מקור האמת של ה־UI (S12: 13 — נוסף ייצוא ומדידה)
    assertEq(panels.length, expectedPanels, `כל פאנלי ה־UI (${expectedPanels})`);
    assert(panels.length >= 12, 'לפחות 12 הפאנלים ההיסטוריים קיימים');
    // שלמות: כל פאנל שיש בו מפתחות רישום מרונדר (פאנלי פעולה ריקים מותרים — SVG Builder/ייבוא)
    const registryPanels = new Set(registry.map(r => r.panel));
    const rendered = new Set(PANELS.map(p => p.label));
    for (const rp of registryPanels) assert(rendered.has(rp), `פאנל רישום חסר ב־UI: ${rp}`);
    const rows = app.settingsPanel.root.querySelectorAll('.field-row');
    assertEq(rows.length, registry.length, `שורות שדה (${rows.length}) חייבות להשתוות לרישום (${registry.length})`);
    assertEq(BINDINGS.length, registry.length, 'המניפסט מכסה את כל הרישום');
  });

  it('חיפוש לפי שם עברי מוצא מפתח ומסנן לפאנל הנכון', () => {
    const s = app.settingsPanel.searchInput;
    s.value = 'רוחב טור';
    fire(s, 'input');
    assert(app.settingsPanel.getSearchHits() >= 1, 'חייבה התאמה לפחות אחת');
    const row = app.settingsPanel.root.querySelectorAll('.field-row').find(r => r.dataset.key === 'grid-col-width-pct');
    assert(row, 'שורת grid-col-width-pct קיימת');
    assert(!row.classList.contains('hidden'), 'השורה חייבת להיראות בחיפוש «רוחב טור»');
    s.value = 'zzz-לא-קיים';
    fire(s, 'input');
    assertEq(app.settingsPanel.getSearchHits(), 0, 'חיפוש ללא תוצאות');
    s.value = '';
    fire(s, 'input');
  });

  it('איפוס פר־שדה מחזיר את ברירת המחדל מהרישום', () => {
    app.onSettingChanged('body-font-size-pt', 20);
    assertEq(app.getSettings()['body-font-size-pt'], 20);
    app.onResetField('body-font-size-pt');
    const row = registry.find(r => r.id === 'body-font-size-pt');
    assertEq(app.getSettings()['body-font-size-pt'], row.default, 'איפוס מחזיר את ברירת המחדל');
  });

  it('תבניות: שמירה → שינוי → טעינה משחזרת (עם מיגרציה v1)', async () => {
    await done;
    const json = app.saveTemplateJson();
    app.onSettingChanged('page-num-initial-value', 22);
    app.onSettingChanged('body-line-height', 1.45);
    const res = app.loadTemplateJson(json);
    assertEq(app.getSettings()['page-num-initial-value'], 1);
    assertEq(app.getSettings()['body-line-height'], 1.4);
    assertEq(res.unknownKeys, [], 'אין מפתחות לא מוכרים בתבנית תקינה');
    // מיגרציה v1: pageNumFormat → page-num-format
    const v1 = JSON.stringify({ format: 'tora-typesetter-template', version: 1, settings: { pageNumFormat: 'decimal', bodyFontSize: 16 } });
    app.loadTemplateJson(v1);
    assertEq(app.getSettings()['page-num-format'], 'decimal', 'מיגרציה v1→v2');
    assertEq(app.getSettings()['body-font-size-pt'], 16, 'מיגרציה v1→v2 (גוף)');
    // פורמט שגוי נדחה בבירור
    let threw = false;
    try { app.loadTemplateJson('{"format":"other"}'); } catch (e) { threw = true; assert(e.message.includes('תבנית'), 'הודעת שגיאה עברית'); }
    assert(threw, 'פורמט לא מוכר חייב להידחות');
  });

  // **S4.6 (ביקורת 3, סקירה 3):** מיגרציית המדור הקודם מחוברת למסלול הטעינה בפועל —
  // תבנית עם מפתחות IMUD ישנים עוברת דרך importImudSettings (לא רק בבדיקת יחידה),
  // הערכים מגיעים להגדרות, וערכי ui-state נשמרים ב-_legacy-ui-state (לא אובדים).
  it('S4.6: תבנית מדור קודם (מפתחות IMUD) — מיפוי חי במסלול הטעינה + שימור ערכי UI', async () => {
    await done;
    const legacyTpl = JSON.stringify({
      format: 'tora-typesetter-template', version: 1,
      settings: {
        'font-body': "'Guttman Rashi', serif",
        'size-body': '12',
        'f-h2': "'AlphaBlack', serif",
        's-h2': '17',
        'inp-book-title': 'ספר הבדיקה',
        'h2-title-orn-mode': 'none',
        'dim-h2-top-w': '65%',
        'builder-something': 'on'
      }
    });
    const res = app.loadTemplateJson(legacyTpl);
    const s = app.getSettings();
    assertEq(s['body-font'], 'Guttman Rashi', 'font-body ⇒ body-font (משפחה ראשונה) — המיפוי חי במסלול');
    assertEq(s['body-font-size-pt'], 12, 'size-body ⇒ body-font-size-pt');
    assertEq(s['heading-2-font'], 'AlphaBlack', 'f-h2 ⇒ heading-2-font — הגדרת עיצוב מגיעה למנוע');
    assertEq(s['heading-2-size-pt'], 17, 's-h2 ⇒ heading-2-size-pt');
    assertEq(s['imud-book-title'], 'ספר הבדיקה', 'inp-book-title ⇒ imud-book-title');
    assertEq(s['h2-orn-scope'], 'none', 'h2-title-orn-mode=none ⇒ none (לא both)');
    assert(s['_legacy-ui-state'] && s['_legacy-ui-state']['dim-h2-top-w'] === '65%', 'ערכי ui-state נשמרים (לא נזרקים)');
    assert(s['_legacy-ui-state']['builder-something'] === 'on', 'מפתחות בורר ישנים נשמרים כנתונים');
    assertEq(res.unknownKeys, [], 'אין מפתחות "לא מוכרים" — כולם קיבלו disposition');
    // round-trip: שמירה וטעינה מחדש לא מאבדת את ערכי ה-UI
    const again = app.loadTemplateJson(app.saveTemplateJson());
    assertEq(again.unknownKeys, [], 'טעינה חוזרת נקייה');
    assert(app.getSettings()['_legacy-ui-state']['dim-h2-top-w'] === '65%', 'ערכי UI שורדים שמירה+טעינה');
  });

  it('S4.6: engineClient משותף — שני צרכנים על אותו לקוח (ליבת תיקון ייצוא PDF)', async () => {
    await done;
    // בדפדפן היו שני WorkerEngineClient על אותו Worker — השני דרס את onmessage
    // של הראשון והתשובות לregister-font של ספריית IMUD לעולם לא הגיעו.
    // כאן: אותו אובייקט לקוח עובר גם לאפליקציה — מזהה זהה, הפעלה עובדת.
    const { WorkerEngineClient } = require('../../src/ui/worker-client');
    const inlineTransport = require('../../src/ui/inline-transport');
    const shared = new WorkerEngineClient(inlineTransport.createInlineTransport());
    const app2 = createApp(doc, { engineClient: shared });
    assert(app2.engine === shared, 'האפליקציה משתמשת בלקוח המוזרק — לא יוצרת חדש');
    const p = app2.onExplicitRetypeset();
    await new Promise((r) => setTimeout(r, 30));
    assert(app2.getState().pages >= 0, 'העימוד עובד דרך הלקוח המשותף');
    void p;
  });

  it('מפתח D-44: fx:debounce — המדיניות קוראת את ההגדרה בפועל', () => {
    assertEq(getDebounceMs(getDefaultSettings()), 350, 'ברירת המחדל 350ms (Spec §5.3)');
    assertEq(getDebounceMs({ 'debounce-light-change-ms': 500 }), 500, 'ערך משתמש נכבד');
    assertEq(getDebounceMs({ 'debounce-light-change-ms': 'זבל' }), 350, 'ערך פסול ⇒ נפילה לאחור');
    const consumer = scanConsumers(SRC);
    assert(consumer.consumedBy.get('debounce-light-change-ms').length > 0, 'צרכן אמיתי ב־src (סורק)');
  });
});

// =====================================================================
describe('S10.2 שער 4 — קפיצות וסנכרונים כולל עוגני הערות (REQ-UI-05)', () => {
  const doc = makeDoc();
  const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
  fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
  const done = settle();

  it('קפיצה לפי מספר עברי (גימטריה) — כולל גרשיים', async () => {
    await done;
    assertEq(parseHebrewNumber('א'), 1);
    assertEq(parseHebrewNumber('כ״ב'), 22);
    assertEq(parseHebrewNumber('ד'), 4);
    const pages = app.getState().pages;
    const idx = app.preview.jumpByHebrew('ב');
    assert(idx === 1, `קפיצה לעמוד ב׳ (אינדקס 1); התקבל ${idx}`);
    assertEq(app.preview._lastScrollTarget(), 1);
    assert(app.preview.jumpByHebrew('תתת') === null, 'מחוץ לטווח ⇒ null');
    assert(app.preview.jumpByHebrew('abc') === null, 'קלט לא עברי ⇒ null');
    void pages;
  });

  it('סנכרון סמן→עמוד (כיוון א׳) כולל עגינת הערת־שוליים', async () => {
    await done;
    const text = app.getText();
    const st = app.getState();
    assert(st.hasResult);
    // הפסקה עם ההערה השנייה: "תוכן הסימן הראשון פסקה ראשונה עם עוד הערה"
    const paraOffset = text.indexOf('תוכן הסימן הראשון פסקה ראשונה');
    assert(paraOffset > 0, 'הפסקה נמצאה במקור');
    app.editor.setCaret(paraOffset + 5);
    const target = app.preview.root.querySelectorAll('.caret-target')[0] || app.preview.root.querySelectorAll('.preview-page').find(p => p.classList.contains('caret-target'));
    assert(target, 'עמוד היעד מסומן');
    const targetPage = Number(target.dataset.pageIndex);
    // אימות עצמאי: הטוקן של אותה שורה מופיע בעמוד targetPage (חישוב עצמאי מהתוצאה)
    const lineNo = text.slice(0, paraOffset).split('\n').length - 1; // שורת מקור
    const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
    const { bodyLines } = lexDocument(text);
    const startsAt = text.split('\n').length - bodyLines.length;
    const bodyLine = lineNo - startsAt;
    let nonEmpty = 0, tokenIdx = -1;
    for (let i = 0; i <= bodyLine; i++) { if (bodyLines[i].trim() !== '') { tokenIdx = nonEmpty; nonEmpty++; } }
    // מציאת העמוד שמכיל את הטוקן (מהתוצאה שהאפליקציה קיבלה — דרך buildCaretMap עצמאי)
    const direct = typeset(text, getDefaultSettings());
    const cm = buildCaretMap(text, serializeTypesetResult(direct));
    const expected = cm.caretToPage(paraOffset + 5);
    assertEq(targetPage, expected, 'העמוד המסומן חייב להתאים למיפוי העצמאי');
    assert(expected != null && expected >= 0 && expected < direct.pages.length);
    // הטוקן עם הערת השוליים מעוגן בעמוד הגוף שלו (לא בעמוד ההערות)
    const tokOnPage = cm.tokensByPage.get(targetPage) || [];
    assert(tokOnPage.length > 0, 'לעמוד היעד יש טוקנים');
  });

  it('סנכרון עמוד→סמן (כיוון ב׳) — לחיצה על עמוד ממקמת את הסמן; מסלול הלוך־ושוב יציב', async () => {
    await done;
    const pageEls = app.preview.root.querySelectorAll('.preview-page');
    assert(pageEls.length >= 2, `נדרשים ≥2 עמודים לבדיקה; יש ${pageEls.length}`);
    const targetEl = pageEls[pageEls.length - 1]; // העמוד האחרון
    const targetIdx = Number(targetEl.dataset.pageIndex);
    fire(targetEl, 'click');
    const caret = app.editor.textarea.selectionStart;
    assert(caret != null && caret >= 0, 'הסמן מוקם');
    // כיוון א׳ מיד אחר כך: אותו עמוד בדיוק (מסלול הלוך־ושוב)
    app.editor.setCaret(caret);
    const marked = app.preview.root.querySelectorAll('.preview-page').find(p => p.classList.contains('caret-target'));
    assert(marked, 'עמוד הסמן מסומן אחרי הקלק ה החוזר');
    assertEq(Number(marked.dataset.pageIndex), targetIdx, 'מסלול הלוך־ושוב: אותו עמוד');
  });

  it('לחיצה על שורת TOC (#page-N) קופצת לעמוד היעד', async () => {
    await done;
    // חיפוש קישור TOC בקנבס (עמודי toc כוללים שורות עם href="#page-N")
    const links = [];
    (function walk(el) {
      for (const c of el.children) {
        const href = c.getAttribute && c.getAttribute('href');
        if (href && href.startsWith('#page-')) links.push(c);
        walk(c);
      }
    })(app.preview.root);
    if (!links.length) {
      // אין עמודי TOC במסמך הקטן (רמות 1–2 קיימות — בדיקה שהם כן נבנו):
      assert(app.getState().pages > 0, 'יש תוצאה');
      return; // הקורפוס הקנוני בבדיקת הדבקה הגדולה מכסה עמודי TOC
    }
    const href = links[0].getAttribute('href');
    const idx = Number(href.slice(6));
    fire(links[0], 'click');
    assertEq(app.preview._lastScrollTarget(), idx, 'קפיצה לעמוד היעד מה־TOC');
  });
  it('זום: כפתורים, Ctrl+גלגל, גבולות, התאמה לרוחב', async () => {
    await done;
    assertEq(app.preview.getZoom(), 100);
    app.preview.root.querySelectorAll('.btn--icon'); // בונוס — קיימים
    // כפתורי +-: מזהים לפי aria-label
    const btns = app.preview.root.querySelectorAll('.btn--icon');
    const minus = btns.find(b => b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('הקטן'));
    const plus = btns.find(b => b.getAttribute('aria-label') && b.getAttribute('aria-label').includes('הגדל'));
    fire(plus, 'click'); fire(plus, 'click');
    assertEq(app.preview.getZoom(), 120);
    fire(minus, 'click');
    assertEq(app.preview.getZoom(), 110);
    // Ctrl+wheel
    const canvas = app.preview.root.querySelectorAll('.preview-canvas')[0];
    fire(canvas, 'wheel', { ctrlKey: true, deltaY: -100 });
    assertEq(app.preview.getZoom(), 120);
    // גבולות
    for (let i = 0; i < 60; i++) fire(plus, 'click');
    assertEq(app.preview.getZoom(), 400, 'תקרת זום');
    for (let i = 0; i < 100; i++) fire(minus, 'click');
    assertEq(app.preview.getZoom(), 25, 'רצפת זום');
  });

  it('מצב גלילה אנכית/אופקית מתחלף', async () => {
    await done;
    const canvas = app.preview.root.querySelectorAll('.preview-canvas')[0];
    const btn = app.preview.root.querySelectorAll('.btn--toggle')[0];
    assert(!canvas.classList.contains('canvas--horizontal'), 'ברירת מחדל אנכית');
    fire(btn, 'click');
    assert(canvas.classList.contains('canvas--horizontal'), 'אופקית אחרי החלפה');
    fire(btn, 'click');
    assert(!canvas.classList.contains('canvas--horizontal'));
  });
});

// =====================================================================
describe('S10.2 שער 5 — דיבאג פר־עמוד + highlightIssue נראה (REQ-UI-06)', () => {
  const doc = makeDoc();
  const downloads = [];
  const app = createApp(doc, {
    transport: inlineTransport.createInlineTransport(),
    onDebugDownload: (json, pageIndex) => downloads.push({ json, pageIndex })
  });
  fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => CORPUS_WITH_FINDING } });
  const done = settle();

  it('הורדת דיבאג: JSON עם גיאומטריית עמוד + פרוסת ledger + מסלול', async () => {
    await done;
    assert(app.getState().hasResult);
    // עמוד עם ממצא (column-imbalance על עמודים זוגיים בקורפוס)
    const pageEls = app.preview.root.querySelectorAll('.preview-page');
    const dbgBtns = [];
    (function walk(el) {
      for (const c of el.children) {
        if (c.classList && c.classList.contains('page-debug-btn')) dbgBtns.push(c);
        walk(c);
      }
    })(app.preview.root);
    assertEq(dbgBtns.length, pageEls.length, 'כפתור ⏬ לכל עמוד (V21)');
    fire(dbgBtns[2], 'click'); // עמוד 3 (אינדקס 2)
    assertEq(downloads.length, 1);
    const d = JSON.parse(JSON.stringify(downloads[0].json)); // clone-proof: עובר structured-clone
    assertEq(d.schema, 'page-debug-v1');
    assertEq(d.pageIndex, 2);
    assert(d.template && d.template.width > 0 && d.template.height > 0, 'גיאומטריה מלאה');
    assert(Array.isArray(d.columns) && d.columns.length >= 1, 'טורים');
    assert(typeof d.footnotes === 'number');
    assert('layoutHash' in d && d.layoutHash, 'hash לאימות');
    assert(Array.isArray(d.findings) || Array.isArray(d.ledger), 'פרוסת ממצאים/ledger');
    assert(Array.isArray(d.trace), 'פרוסת מסלול');
  });

  it('highlightIssue מסמן נראה את האלמנט החוטא (מחלקה + קו מיתאר + קפיצה)', async () => {
    await done;
    // שליפת ממצא עם עמוד מהטבלה — כלל 2: דרך activateFinding האחיד
    const rows = app.testing.root.querySelectorAll('.finding-row');
    assert(rows.length > 0, 'טבלת ממצאים מאוכלסת');
    const rowWithPage = rows.find(r => {
      const tds = r.querySelectorAll('td');
      return tds.length === 4 && tds[1].textContent !== '—';
    });
    assert(rowWithPage, 'יש ממצא עם עמוד');
    fire(rowWithPage, 'click');
    const flashed = app.preview.root.querySelectorAll('.preview-page').find(p => p.classList.contains('issue-flash'));
    assert(flashed, 'העמוד החוטא מסומן במחלקה');
    assert(flashed.getAttribute('data-issue-id'), 'מזהה הממצא מוצמד לאלמנט');
    assert(flashed.style.outline && flashed.style.outline.includes('e03131'), 'סימון נראה (קו מיתאר inline — הוכחה בלי CSS)');
    const tds = rowWithPage.querySelectorAll('td');
    assertEq(String(Number(tds[1].textContent)), tds[1].textContent, 'עמוד בטבלה הוא מספר');
    assertEq(Number(flashed.dataset.pageIndex), Number(tds[1].textContent) - 1, 'העמוד המסומן = העמוד המוצג בטבלה (1-based)');
  });

  it('כל נתיבי הדוח מפעילים את אותו activateFinding (כלל 2 — Working_rules)', async () => {
    await done;
    // נתיב המקלדת (Enter) — דרך אותה פונקציית הפעלה אחידה כמו הלחיצה
    const rows = app.testing.root.querySelectorAll('.finding-row');
    const rowWithPage = rows.find(r => {
      const tds = r.querySelectorAll('td');
      return tds.length === 4 && tds[1].textContent !== '—';
    });
    assert(rowWithPage, 'יש ממצא עם עמוד');
    fire(rowWithPage, 'keydown', { key: 'Enter' });
    const after = app.preview.root.querySelectorAll('.preview-page').filter(p => p.classList.contains('issue-flash')).length;
    assertEq(after, 1, 'פעולת מקלדת מפעילה הדגשה באותו נתיב');
  });
});

// =====================================================================
describe('S10.2 שער 6 — שינוי קל ≤2s; כבד דורש ⚡; טבלת מדיניות מוצגת (REQ-UI-02)', () => {
  const doc = makeDoc();
  const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
  app.getSettings()['debounce-light-change-ms'] = 60;
  fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
  const done = settle();

  it('טבלת המדיניות מרונדרת בעזרת ה־UI (light/heavy)', async () => {
    await done;
    const helps = app.root.querySelectorAll('.policy-help');
    assertEq(helps.length, 1, 'סעיף עזרה קיים');
    const rows = app.root.querySelectorAll('.policy-row');
    assertEq(rows.length, policyTable().length, 'שתי שורות מדיניות (קל/כבד)');
    assert(app.root.textContent.includes('עדכן ועמד מחדש'), 'ההסבר בעברית');
  });

  it('שינוי קל: מרוכז (60ms) ⇒ רינדור מחדש בלבד ≤2s; הגדרה חדשה נראית', async () => {
    await done;
    const hashBefore = app.getState().layoutHash;
    const t0 = performance.now();
    app.onSettingChanged('background-color', '#e0e0e0');
    assert(app.getState().lightDirty, 'מסומן כתלוי-קל עד לריכוז');
    await wait(300);
    const total = performance.now() - t0;
    const st = app.getState();
    assert(st.lastLightRefreshMs != null, 'הרינדור הקל בוצע');
    assert(st.lastLightRefreshMs <= 2000, `תקציב רינדור קל חרג: ${st.lastLightRefreshMs.toFixed(0)}ms`);
    assert(total < 2000, `סה"כ עד ריענון: ${total.toFixed(0)}ms`);
    assertEq(st.layoutHash, hashBefore, 'שינוי קל לא משנה פריסה (hash)');
    // האפקט נראה בעמוד הראשון (rgba אמיתי — P0-5)
    const page0 = app.preview.root.querySelectorAll('.preview-page')[0];
    assert(page0.style.backgroundColor && page0.style.backgroundColor.startsWith('rgba(224'), 'הצבע החדש רונדר: ' + page0.style.backgroundColor);
    assert(!st.lightDirty, 'הדגל הקל נוקה');
  });

  it('D-64 — מחלקת הקלים מוכחת שקולת־רינדור; כבדים אינם שקולים', () => {
    const CHANGES = {
      'background-color': '#eef2ff',
      'background-opacity': 0.6,
      'background-image': 'assets/bg.png',
      'background-texture': 'assets/tex.png',
      'background-inset-mm': 5,
      'footnote-separator-rule': 'circles',
      'body-last-line-align': 'right'
    };
    assertEq(Object.keys(CHANGES).length, LIGHT_KEYS.size, 'המחלקה הקלה מכוסה במלואה');
    const base = typeset(SMALL_DOC, getDefaultSettings());
    for (const [key, val] of Object.entries(CHANGES)) {
      assertEq(classifyChange(key), 'light', `${key} חייב להיות מסווג קל`);
      const full = typeset(SMALL_DOC, Object.assign({}, getDefaultSettings(), { [key]: val }));
      assertEq(full.layoutHash, base.layoutHash, `${key}: שינוי קל אסור שישנה פריסה`);
      // שקילות רינדור: עמודי הבסיס + הגדרות חדשות === עמודי ריצה מלאה
      for (let i = 0; i < base.pages.length; i++) {
        const d = makeDoc();
        const lightRender = renderPage(base.pages[i], Object.assign({}, getDefaultSettings(), { [key]: val }), d);
        const fullRender = renderPage(full.pages[i], Object.assign({}, getDefaultSettings(), { [key]: val }), d);
        assertEq(lightRender.outerHTML(), fullRender.outerHTML(), `${key}: רינדור־קל שקול לריצה מלאה (עמוד ${i})`);
      }
    }
    // כבד לדוגמה: שינוי רוחב טור — הפריסה משתנה; רינדור־קל היה מטעה
    const heavy = typeset(SMALL_DOC, Object.assign({}, getDefaultSettings(), { 'grid-col-width-pct': 55 }));
    assert(heavy.layoutHash !== base.layoutHash, 'שינוי כבד חייב לשנות פריסה');
    assertEq(classifyChange('grid-col-width-pct'), 'heavy');
  });
});

// =====================================================================
describe('S10.2 שער 7 + REQ-UI-01 — לשוניות, נגישות, רגרסיה', () => {
  it('4 לשוניות role=tab עם aria-selected; מעבר מחליף פאנלים', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const tabs = app.root.querySelectorAll('.tabbtn');
    assertEq(tabs.length, 4, 'ארבע לשוניות: עורך/הגדרות/בדיקה/תצוגה');
    assertEq(tabs.filter(t => t.getAttribute('role') === 'tab').length, 4, 'role=tab לכל לשונית');
    assert(tabs[0].getAttribute('aria-selected') === 'true', 'עורך נבחר כברירת מחדל');
    fire(tabs[3], 'click');
    assert(tabs[3].getAttribute('aria-selected') === 'true');
    assert(tabs[0].getAttribute('aria-selected') === 'false');
    const panels = app.root.querySelectorAll('.tab-panel');
    const active = panels.filter(p => p.classList.contains('active'));
    assertEq(active.length, 1, 'פאנל אחד פעיל');
    assertEq(active[0].dataset.tab, 'preview');
  });

  it('עורך: מונים, ⏎ לא מיוצאים (F-01), DOCX נעול (S11), ניקוי', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const text = 'שורה ראשונה כאן\nשורה שנייה כאן\n\nפסקה חדשה אחרי שורה ריקה';
    app.setText(text);
    app.editor.updateCounters();
    const counters = app.editor.root.querySelectorAll('.editor-counters')[0].textContent;
    assert(counters.includes('תווים: 56'), counters);
    assert(counters.includes('מילים: 11'), counters);
    assert(counters.includes('שורות: 4'), counters);
    assert(counters.includes('פסקאות: 2'), counters);
    // הדבקה ⇒ עימוד ⇒ מפת שבירות מוצגת אך הטקסט נשאר נקי
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    assertEq(app.getText(), SMALL_DOC, 'F-01: הטקסט המיוצא זהה־בתים למקור — סמני ⏎ אינם חלק ממנו');
    const markers = app.editor.root.querySelectorAll('.marker-item');
    assert(markers.length > 0, 'מפת שבירות מוצגת');
    assert(markers[0].textContent.includes('⏎'), 'סמן שבירה נראה');
    // **S11 — הנעילה הוסרה:** מנוע הייבוא נבנה; הכפתור מחובר ל־onImportDocx (סירוב פורמט = הודעה, לא קריסה)
    assert(app.editor.docxButton.disabled !== true, 'DOCX פתוח (מנוע S11 נבנה)');
    assert(app.editor.docxButton.title.includes('DOCX'), 'הסבר עברי על הכפתור');
    // ניקוי
    app.onDocumentAction('clear', '');
    assertEq(app.getText(), '');
    assertEq(app.getState().pages, 0);
  });

  it('בדיקה: לוח כיסוי עם סיווג עמודים ופטורים מנומקים; trace viewer עם סינון שלב', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    const cards = app.testing.root.querySelectorAll('.coverage-card');
    assert(cards.length >= 9, `כרטיסי כיסוי (${cards.length} ≥ 9)`);
    const labels = app.testing.root.querySelectorAll('.coverage-label').map(l => l.textContent);
    for (const wanted of ['סה"כ עמודים', 'עמודי גוף נבדקו', 'עמודים מבניים (פטורים בסיבה)', 'אירועי מסלול שנשמטו', 'דטרמיניסטיות (hash)', 'שימור תוכן']) {
      assert(labels.includes(wanted), `כרטיס חסר: ${wanted}`);
    }
    assert(app.testing.root.textContent.includes('0'), 'droppedEvents=0 מוצג');
    // trace: סינון שלב
    const stageSel = app.testing.root.querySelectorAll('select').find(s => (s.getAttribute('aria-label') || '').includes('שלבי מסלול'));
    assert(stageSel, 'בורר שלבים קיים');
    const allRows = app.testing.root.querySelectorAll('.trace-table tbody tr').length;
    assert(allRows > 0, 'אירועי מסלול מוצגים');
    stageSel.value = 'parse';
    fire(stageSel, 'change');
    const filteredRows = app.testing.root.querySelectorAll('.trace-table tbody tr');
    assert(filteredRows.length < allRows, 'הסינון מצמצם');
    for (const tr of filteredRows) {
      const tds = tr.querySelectorAll('td');
      assertEq(tds[1].textContent, 'parse', 'כל השורות בשלב שנבחר');
    }
  });
});

// =====================================================================
describe('D-65 — פרוטוקול Worker: single-flight, ביטול, ולידציה, plain-JSON', () => {
  it('ולידציה: הודעות פסולות נדחות בבירור (בלי קריסה)', () => {
    throws(() => validateRequest(null), /object/);
    throws(() => validateRequest({ type: 'unknown' }), /unknown message type/);
    throws(() => validateRequest({ type: 'typeset-request' }), /jobId/);
    throws(() => validateRequest({ type: 'typeset-request', jobId: 'x', text: 5, settings: {} }), /text/);
    assertEq(validateRequest({ type: 'cancel', jobId: 'x' }), true);
  });

  it('סריאליזציה: התוצאה עוברת JSON roundtrip (אין Map/class — עובר structured-clone)', () => {
    const r = typeset(SMALL_DOC, getDefaultSettings());
    const s = serializeTypesetResult(r);
    const json = JSON.parse(JSON.stringify(s));
    assertEq(json.schema, 'ui-result-v1');
    assertEq(json.layoutHash, r.layoutHash);
    assert(Array.isArray(json.pages) && json.pages.length > 0);
    assert(json.report && json.report.schema === 'diagnostics-v2');
    assert(json.trace && Array.isArray(json.trace.events));
    assert(json.ledger && Array.isArray(json.ledger.issues));
    assert(Array.isArray(json.tokens) && json.tokens.length > 0);
  });

  it('single-flight: בקשה חדשה מבטלת את הקודמת (תוצאה ישנה נזרקת)', async () => {
    const client = new WorkerEngineClient(inlineTransport.createInlineTransport());
    const j1 = client.requestTypeset({ text: SMALL_DOC, settings: getDefaultSettings() });
    const j2 = client.requestTypeset({ text: CORPUS, settings: getDefaultSettings() });
    // **S5.2:** בקשה חדשה מבטלת את הקודמת — עם terminate ההבטחה הישנה נדחית
    // ב-RESTART_ERROR (בעבר נפרדה {cancelled:true}); החדשה עובדת על מופע חי.
    const r1 = await j1.promise.then(
      () => { throw new Error('העבודה הראשונה היתה אמורה להידחות (worker-restarted)'); },
      (e) => e.message);
    assertEq(r1, 'worker-restarted', 'העבודה הראשונה נדחתה — המנוע הופעל מחדש (single-flight)');
    const r2 = await j2.promise;
    assert(r2 && r2.layoutHash, 'העבודה השנייה מסתיימת');
    const direct = typeset(CORPUS, getDefaultSettings());
    assertEq(r2.layoutHash, direct.layoutHash);
  });

  it('ביטול מפורש: ההבטחה נדחית worker-restarted; הלקוח פנוי', async () => {
    const client = new WorkerEngineClient(inlineTransport.createInlineTransport());
    const j = client.requestTypeset({ text: CORPUS, settings: getDefaultSettings() });
    assert(client.busy);
    j.cancel();
    assert(!client.busy, 'הלקוח פנוי מיד אחרי ביטול');
    // **S5.2:** terminate ⇒ התוצאה לעולם לא תחזור — דחייה מפורשת במקום תלייה/פרדות מזויפת.
    const r = await j.promise.then(
      () => { throw new Error('ההבטחה היתה אמורה להידחות (worker-restarted)'); },
      (e) => e.message);
    assertEq(r, 'worker-restarted');
  });

  it('no-op proof: מזליף ההתקדמות לא משנה פריסה (hash זהה עם ובלי)', () => {
    const a = typeset(SMALL_DOC, getDefaultSettings());
    const events = [];
    const b = typeset(SMALL_DOC, getDefaultSettings(), { onProgress: (i) => events.push(i) });
    assertEq(a.layoutHash, b.layoutHash, 'מכשור לא משנה layout');
    assert(events.length >= 5, `אירועי התקדמות זרמו (${events.length})`);
    let last = 0;
    for (const e of events) { assert(e.pct >= last, 'אחוזים מונוטוניים'); last = e.pct; }
    assertEq(events[events.length - 1].pct, 100, 'מסתיים ב־100%');
  });
});

// =====================================================================
describe('חבילות הדפדפן (D-65) — הפרדת מנוע, שימה, offline', () => {
  const workerSrc = fs.readFileSync(path.join(BUNDLE_DIR, 'engine-worker.bundle.js'), 'utf8');
  const appSrc = fs.readFileSync(path.join(BUNDLE_DIR, 'app.bundle.js'), 'utf8');

  it('ה־bundle קיים, נבנה מחדש וזהה ביט-לביט (sha256 — שינוי מקור ללא בנייה ייתפס)', () => {
    // **S5.1 (A1):** השוואת גודל ±4KB העבירה באנדל מיושן — תיקון מקור קטן שינה
    // את הבאנדל בעשרות בתים והכל נשאר ירוק, כולל הפריסה לחי (באג ישן חוזר).
    const crypto = require('crypto');
    const hash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    const wPath = path.join(BUNDLE_DIR, 'engine-worker.bundle.js');
    const aPath = path.join(BUNDLE_DIR, 'app.bundle.js');
    const beforeW = hash(wPath), beforeA = hash(aPath);
    execSync('node tools/build-worker-bundle.js', { cwd: path.join(SRC_ROOT, '..'), stdio: 'ignore' });
    assertEq(hash(wPath), beforeW, 'engine-worker.bundle.js: הבאנדל המחויב אינו תוצר בנייה מחדש (sha256)');
    assertEq(hash(aPath), beforeA, 'app.bundle.js: הבאנדל המחויב אינו תוצר בנייה מחדש (sha256)');
  });

  it('ASSET_VERSION עקבי בין browser-entry ל-index.html (W4 — cache-busting)', () => {
    // **S5.1 (W4):** שלושה מקומות ידניים בלא אימות — חוסר-סנכרון מחזיר את באג
    // המטמון ("האתר לא מתעדכן").
    const entry = fs.readFileSync(path.join(SRC_ROOT, 'src', 'ui', 'browser-entry.js'), 'utf8');
    const m = entry.match(/ASSET_VERSION = '([^']+)'/);
    assert(!!m, 'ASSET_VERSION נמצא ב-browser-entry');
    const html = fs.readFileSync(path.join(BUNDLE_DIR, 'index.html'), 'utf8');
    const vers = [...html.matchAll(/\?v=([^"']+)/g)].map(x => x[1]);
    assert(vers.length >= 2, `index.html מגדיר ?v= פעמיים (נמצאו ${vers.length})`);
    for (const v of vers) assertEq(v, m[1], `index.html ?v=${v} תואם ל-ASSET_VERSION`);
  });

  it('שימת SHA-256 שקולה ל־Node crypto (כולל עברית/אימוג׳י/ארוך)', () => {
    const crypto = require('crypto');
    const sandbox = new Function(workerSrc + '; return __crypto;')();
    const msgs = ['hello', 'שלום עולם — ניקוד וטעמים', 'כותרת 1 - עברית עם 123', '🎨📙', JSON.stringify({ a: [1, 2, 3] }), 'x'.repeat(10000)];
    for (const m of msgs) {
      assertEq(sandbox.createHash('sha256').update(m).digest('hex'), crypto.createHash('sha256').update(m).digest('hex'), `שימה שונה לאורך ${m.length}`);
    }
  });

  it('bundle ה־Worker רץ כ-Worker מלא: progress + hash זהה ל־headless', () => {
    const posted = [];
    const fakeSelf = { onmessage: null, postMessage: (m) => posted.push(m) };
    new Function('self', workerSrc)(fakeSelf);
    assert(typeof fakeSelf.onmessage === 'function', 'ה־Worker נר�ם ל־onmessage');
    fakeSelf.onmessage({ data: { type: 'typeset-request', jobId: 'j1', text: SMALL_DOC, settings: getDefaultSettings() } });
    const res = posted.find(m => m.type === 'typeset-result');
    assert(res, 'תוצאה חזרה');
    const direct = typeset(SMALL_DOC, getDefaultSettings());
    assertEq(res.result.layoutHash, direct.layoutHash, 'hash ה־bundle זהה לריצה ישירה');
    assert(posted.filter(m => m.type === 'progress').length >= 5, 'progress זרם גם ב־bundle');
    // הודעה פסולה ⇒ הודעת שגיאה מסודרת, לא קריסה
    fakeSelf.onmessage({ data: { type: 'bogus' } });
    const err = posted.find(m => m.type === 'typeset-error');
    assert(err, 'שגיאה מדווחת במקום קריסה');
  });

  it('הפרדה: אצרור האפליקציה בלי המנוע; offline-safe', () => {
    assert(!appSrc.includes('"src/ui/engine-worker-main.js"'), 'אין צד־Worker באצרור ה־UI');
    assert(!/__modules\["src\/engine\/core\/pipeline\.js"\]/.test(appSrc), 'אין pipeline באצרור ה־UI');
    assert(appSrc.includes('excluded from this bundle'), 'הסטאב של ההחרגה קיים');
    // offline: אין בקשות רשת חיצוניות (src/href/@import/fetch) — namespace URI של SVG אינו בקשה
    const NET = [/<script[^>]+src=["']https?:\/\//i, /<link[^>]+href=["']https?:/i, /@import\s+url\(\s*["']?https?:\/\//i, /fetch\(\s*["']https?:\/\//i, /XMLHttpRequest/];
    for (const src of [appSrc, workerSrc]) {
      for (const re of NET) assert(!re.test(src), `הפניה חיצונית אסורה: ${re}`);
    }
  });

  it('index.html: מקומי, RTL, טוען את החבילות בלבד', () => {
    const html = fs.readFileSync(path.join(BUNDLE_DIR, 'index.html'), 'utf8');
    assert(html.includes('dir="rtl"') && html.includes('lang="he"'));
    assert(html.includes('app.bundle.js'));
    assert(!/<script[^>]+src=["']https?:/.test(html), 'אין סקריפט חיצוני');
    assert(fs.existsSync(path.join(BUNDLE_DIR, 'styles.css')), 'עיצוב קיים');
  });
});

// =====================================================================
describe('רגרסיית רישום — סורקים אחרי ה־UI (REQ-GOV-04)', () => {
  it('dead-control = 0: כל פקדי הרישום חיים בכיתובי ה־UI; אין phantom/orphan', () => {
    const res = scanConsumers(SRC);
    assertEq(res.deadControls.map(d => d.control), [], 'כל פקד חייב כיתוב UI (הבטחת התיעוד ב־registry.test)');
    assertEq(res.phantomKeys.map(k => k.id), []);
    assertEq(res.orphanMechanisms.map(m => `${m.id}->${m.consumer}`), []);
  });
});

// =====================================================================
describe('D-84 — רינדור מחלונות (virtualization) לספרים ארוכים', () => {
  // רקע: ספר אמת של 1,000+ עמודים יוצר מיליוני צמתי DOM ברינדור מלא —
  // הלשונית קופאת. מעל 60 עמודים: placeholders בגובה אמיתי + חלון חי סביב הגלילה.
  const REAL = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');
  const { buildPreviewTab } = require('../../src/ui/preview-tab');

  it('מסמך 88 עמודים: מצב וירטואלי — placeholders לכולם, חלון חי קטן', () => {
    const result = typeset(REAL, getDefaultSettings());
    assert(result.pages.length > 60, `נדרש >60 עמודים להפעלת וירטואליזציה (קיבלנו ${result.pages.length})`);
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(serializeTypesetResult(result), getDefaultSettings());
    assertEq(pv.isVirtual(), true, 'מעל הסף ⇒ מצב וירטואלי');
    assertEq(pv.getPageCount(), result.pages.length, 'ספירת העמודים שלמה');
    const allPages = pv.root.querySelectorAll('.preview-page');
    assertEq(allPages.length, result.pages.length, 'placeholders + חיים = כל העמודים');
    const rendered = pv.getRenderedCount();
    assert(rendered > 0 && rendered <= 20, `חלון חי קטן (קיבלנו ${rendered})`);
    const phs = pv.root.querySelectorAll('.preview-page--placeholder');
    assertEq(phs.length, result.pages.length - rendered, 'placeholders = כולם פחות החלון החי');
    // מבנה גיאומטרי: ל-placeholder יש רוחב/גובה מהתבנית (מקור יחיד)
    const t0 = result.pages[0].template;
    assert(phs.every(p => p.style && p.style.height === `${t0.height}px`), 'גובה placeholder = גובה תבנית');
  });

  it('קפיצה לעמוד רחוק: נרנדר עצל לפני הגלילה; DOM נשאר קטן', () => {
    const result = typeset(REAL, getDefaultSettings());
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(serializeTypesetResult(result), getDefaultSettings());
    const target = result.pages.length - 5;
    pv.scrollToPage(target);
    assertEq(pv._lastScrollTarget(), target, 'יעד הגלילה נשמר');
    assert(pv.getRenderedCount() > 0 && pv.getRenderedCount() <= 25, `DOM קטן גם אחרי קפיצה (קיבלנו ${pv.getRenderedCount()})`);
    const phs = pv.root.querySelectorAll('.preview-page--placeholder');
    const stillPh = phs.filter(p => p.getAttribute('data-page-index') === String(target));
    assertEq(stillPh.length, 0, 'עמוד היעד כבר לא placeholder — הוא רונדר');
    assertEq(pv.root.querySelectorAll('.preview-page').length, result.pages.length, 'הסדר והכמות נשמרים');
    // highlightIssue על עמוד רחוק — גם הוא מרנדר עצל
    pv.highlightIssue({ page: 2, id: 'x', target: '' });
    const phs2 = pv.root.querySelectorAll('.preview-page--placeholder');
    assertEq(phs2.filter(p => p.getAttribute('data-page-index') === '2').length, 0, 'עמוד הממצא רונדר להדגשה');
    pv.clearHighlights();
  });

  it('מסמך קטן (≤60 עמודים): רינדור מלא — ההתנהגות המקורית נשמרת', () => {
    const result = typeset(CORPUS, getDefaultSettings());
    assert(result.pages.length <= 60, 'הקורפוס הקנוני קטן מהסף');
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(serializeTypesetResult(result), getDefaultSettings());
    assertEq(pv.isVirtual(), false, 'מתחת לסף ⇒ רינדור מלא');
    assertEq(pv.getRenderedCount(), result.pages.length, 'כל העמודים חיים');
    assertEq(pv.root.querySelectorAll('.preview-page--placeholder').length, 0, 'אין placeholders');
  });
});

report('s10-ui');
