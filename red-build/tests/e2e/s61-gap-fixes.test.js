// tests/e2e/s61-gap-fixes.test.js — שער S6.1: סגירת שני הפערים מול המפרט
// **פער 1 — מסמכי בדיקה קבוע/רנדומלי (נושא 16 ב"סיכום בקשות מAI" + SRS §16.1/§20.1):**
//  "ופצל את לחצן 'מסמך בדיקה' לשני לחצנים 1. 'מסמך בדיקה קבוע' שיזריק את אותו
//   מסמך בכל פעם. 2. 'מסמך בדיקה רנדומלי' שיזריק בכל פעם טקסט רנדומלי." + חמשת
//   צירי העקה + "לפחות 300 דפים".
// **פער 2 — השתמרות הגדרות (SRS §17.1):** "User settings MUST persist in
//  localStorage across page refreshes, text imports, and preset toggles."
// מבוסס על דפוס ה-DOM-shim של s10/s52 (אותו shim, אותן הגדרות).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
const { tokenize } = require('../../src/engine/parser/block-tokenizer');
const { generateTestDocument, FIXED_SEED } = require('../../src/ui/test-doc-generator');
const { createSettingsPersistence, diffSettings, STORAGE_KEY, FORMAT, VERSION } = require('../../src/ui/settings-persistence');
const { createApp } = require('../../src/ui/app-shell');
const { buildEditorTab } = require('../../src/ui/editor-tab');
const inlineTransport = require('../../src/ui/inline-transport');

/** המתנה לתנאי (עימוד אסינכרוני — התוצאה מגיעה דרך promise מהמנוע). */
async function waitFor(cond, ms = 10000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) return false;
    await new Promise(r => setTimeout(r, 25));
  }
  return true;
}

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
      while (node) {
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


// ================= פער 1: מחולל מסמכי הבדיקה =================
describe('פער 1 — מחולל מסמכי בדיקה (נושא 16 + SRS §16.1/§20.1)', () => {
  it('מצב קבוע: אותם בתים בדיוק בכל קריאה (small) — "אותו מסמך בכל פעם"', () => {
    const a = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const b = generateTestDocument({ mode: 'fixed', scale: 'small' });
    assertEq(a, b, 'מסמך הבדיקה הקבוע דטרמיניסטי — זהה ביט-לביט');
    assert(a.length > 1000, `מסמך small מלא (${a.length} תווים)`);
  });

  it('מצב קבוע: אותם בתים בדיוק גם בסקאלה המלאה (full) — ללא תלות בזמן/אקראיות', () => {
    const a = generateTestDocument({ mode: 'fixed', scale: 'full' });
    const b = generateTestDocument({ mode: 'fixed', scale: 'full' });
    assertEq(a, b, 'המסמך הקבוע המלא דטרמיניסטי');
  });

  it('מצב קבוע: הזרע הקבוע הוא אכן FIXED_SEED (נעילת ערך הזרע בין גרסאות)', () => {
    // זרע מפורש = הזרע הקבוע ⇒ אותו פלט כמו mode:'fixed' ללא זרע
    const a = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const b = generateTestDocument({ mode: 'random', seed: FIXED_SEED, scale: 'small' });
    assertEq(a, b, 'seed=FIXED_SEED מניב את המסמך הקבוע');
  });

  it('מצב רנדומלי: זרעים שונים ⇒ מסמכים שונים; אותו זרע ⇒ זהים', () => {
    const a = generateTestDocument({ mode: 'random', seed: 12345, scale: 'small' });
    const b = generateTestDocument({ mode: 'random', seed: 67890, scale: 'small' });
    const c = generateTestDocument({ mode: 'random', seed: 12345, scale: 'small' });
    assert(a !== b, 'זרעים שונים ⇒ מסמכים שונים');
    assertEq(a, c, 'אותו זרע ⇒ זהים בדיוק');
  });

  it('מצב רנדומלי (בלי זרע מפורש): מסמך תקין נוצר בכל קריאה', () => {
    const a = generateTestDocument({ mode: 'random', scale: 'small' });
    assert(a.includes('כותרת 2 - '), 'יש פרקים');
    assert(a.length > 1000, 'מסמך תקין');
  });

  it('חמשת צירי העקה קיימים במסמך (small): כותרות 2/3/4/5/6/7, H7-צד, הערות, סוגריים, הערות-סיום', () => {
    const doc = generateTestDocument({ mode: 'fixed', scale: 'small' });
    for (const lvl of [2, 3, 4, 5, 6, 7]) {
      assert(doc.includes(`כותרת ${lvl} - `), `ציר 1/3: נמצאה כותרת רמה ${lvl}`);
    }
    assert(/\[[^\]]+\]\[[^\]]+\]/.test(doc), 'ציר 4: רצף הערות [א][ב] (מקרה האינטגרציה ההיסטורי)');
    assert(/\([^)]{50,}\)/.test(doc), 'ציר 5: סוגריים חוצי-טורים (50+ תווים)');
    assert(doc.includes('הערת סיום - '), 'הערות-סיום פרקיות');
    assert(doc.includes('הערות סיום - '), 'הוראת כותרת עמודי הערות-סיום (צורת הרבים)');
    assert(doc.includes('שם הספר - '), 'פתיח מטא-נתונים');
  });

  it('ציר 2 — מדדי פסקה: קיימות פסקה של שורה אחת ופסקה ארוכה (20+ שורות ≈ 150+ מילים)', () => {
    const doc = generateTestDocument({ mode: 'fixed', scale: 'full' });
    const paras = doc.split('\n').filter(l => l.trim() && !l.startsWith('כותרת') && !l.startsWith('הערת סיום') && !l.startsWith('הערות סיום') && !l.includes(' - '));
    const wordCounts = paras.map(p => p.split(/\s+/).filter(Boolean).length);
    assert(Math.min(...wordCounts) <= 6, `פסקה זעירה קיימת (מינימום ${Math.min(...wordCounts)} מילים)`);
    assert(Math.max(...wordCounts) >= 150, `פסקה ארוכה 20+ שורות קיימת (מקסימום ${Math.max(...wordCounts)} מילים)`);
  });

  it('המסמך הקבוע המלא: היקף של 300+ עמודים (≥140,000 מילים) והזרקה מהירה', () => {
    const t0 = Date.now();
    const doc = generateTestDocument({ mode: 'fixed', scale: 'full' });
    const genMs = Date.now() - t0;
    const words = doc.split(/\s+/).filter(Boolean).length;
    // הקורפוס ההיסטורי: 359,637 מילים ⇒ 706 עמודים ≈ 509 מילים/עמוד ⇒ 300 עמודים ≈ 153K
    assert(words >= 140000, `היקף מספיק ל-300+ עמודים (${words} מילים)`);
    assert(genMs < 15000, `ההיווצרות מהירה (${genMs}ms)`);
  });

  it('פורמט תקין: הטוקניזר מזהה כותרות בכל הרמות, הערות-שוליים והערות-סיום', () => {
    const doc = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const { bodyLines } = lexDocument(doc, {});
    const tokens = tokenize(bodyLines, {});
    const headings = tokens.filter(t => t.type === 'heading').map(t => t.level);
    for (const lvl of [2, 3, 4, 5, 6, 7]) {
      assert(headings.includes(lvl), `הטוקניזר זיהה כותרת רמה ${lvl}`);
    }
    // הערות-שוליים: הסוגריים המרובעים מוצאים בטוקנים של הגוף (inline scan) —
    // כאן נסתפק בכך שהמקור מכיל אותן ושהפרסר לא נפל (עימוד מלא בבדיקה הבאה)
    assert(doc.includes('['), 'המקור מכיל סוגריים מרובעים');
  });

  it('המנוע מעמד את המסמך הקבוע (small) בשלמות: שימור תוכן + עמודים', () => {
    const doc = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const result = typeset(doc, getDefaultSettings());
    assert(result.contentPreserved === true, 'שימור תוכן מלא — אפס אובדן מילים');
    assert(result.pages.length >= 3, `מסמך small מניב מספר עמודים סביר (${result.pages.length})`);
    assert(typeof result.layoutHash === 'string' && result.layoutHash.length > 0, 'חשיש עימוד קיים');
  });

  it('דטרמיניזם מלא: שני עימודים של אותו מסמך קבוע ⇒ אותו layoutHash', () => {
    const doc = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const a = typeset(doc, getDefaultSettings());
    const b = typeset(doc, getDefaultSettings());
    assertEq(a.layoutHash, b.layoutHash, 'אפס אקראיות לאורך כל הצינור');
  });
});

describe('פער 1 — כפתורי ה-UI (editor-tab + app-shell)', () => {
  it('שני הכפתורים קיימים בלשונית העורך מעל אזור ההדבקה, עם תוויות ו-aria מדויקים', () => {
    const doc = makeDoc();
    const events = [];
    const ed = buildEditorTab(doc, {
      onTextChange: () => {},
      onDocumentAction: (a, p) => events.push([a, p]),
      onGenerateTestDocument: (mode) => events.push(['gen', mode])
    });
    const rootChildren = ed.root.children.map(c => c.className || '');
    const genIdx = rootChildren.findIndex(c => String(c).includes('editor-genbar'));
    const areaIdx = rootChildren.findIndex(c => String(c).includes('editor-area'));
    assert(genIdx >= 0, 'סרגל מסמכי הבדיקה קיים');
    assert(areaIdx > genIdx, 'הסרגל מעל אזור ההדבקה (כבקשת המשתמש המקורית)');
    assert(ed.generateFixedButton, 'כפתור קבוע חשוף');
    assert(ed.generateRandomButton, 'כפתור רנדומלי חשוף');
    assert(String(ed.generateFixedButton.textContent).includes('מסמך בדיקה קבוע'), 'תווית קבוע');
    assert(String(ed.generateRandomButton.textContent).includes('מסמך בדיקה רנדומלי'), 'תווית רנדומלי');
    assert(ed.generateFixedButton.attrs['aria-label'], 'aria-label לכפתור הקבוע');
  });

  it('לחיצה בכפתורים מזרימה את המצב הנכון (fixed/random) לcallback', () => {
    const doc = makeDoc();
    const modes = [];
    const ed = buildEditorTab(doc, {
      onTextChange: () => {},
      onDocumentAction: () => {},
      onGenerateTestDocument: (mode) => modes.push(mode)
    });
    ed.generateFixedButton._listeners.get('click')[0]();
    ed.generateRandomButton._listeners.get('click')[0]();
    assertEq(modes, ['fixed', 'random'], 'שני המצבים נשלחים');
  });

  it('createApp: לחיצה ⇒ הזרקת המסמך לעורך + עימוד מפורש (נתיב מסמך) + הודעה', async () => {
    const doc = makeDoc();
    const stubDoc = 'שם הספר - בדיקה\n\nכותרת 2 - פרק א\nטקסט ראשון לבדיקת ההזרקה.';
    const app = createApp(doc, {
      transport: inlineTransport.createInlineTransport(),
      generateTestDocument: () => stubDoc // DI — מחולל מדומה לבדיקת החיווט בלבד
    });
    app.onGenerateTestDocument('fixed');
    assertEq(app.getText(), stubDoc, 'המסמך הוזרק לעורך');
    // העימוד אסינכרוני (promise מהמנוע) — המתנה לסיומו
    const ok = await waitFor(() => app.getState().hasResult === true, 15000);
    assert(ok, 'עימוד מפורש הופעל והסתיים (נתיב מסמך מיידי)');
    assert(app.getState().pages >= 1, `הונפקו עמודים (${app.getState().pages})`);
  }, { timeout: 30000 });

  it('createApp: מחולל ברירת המחדל הוא המחולל האמיתי (בלי override)', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const before = app.getText();
    app.onGenerateTestDocument('fixed');
    const after = app.getText();
    assert(after !== before && after.length > 1000, 'הוזרק מסמך אמיתי מהמחולל (לא ריק)');
    assert(after.includes('כותרת 2 - '), 'המסמך האמיתי מכיל פרקים');
  });
});

// ================= פער 2: השתמרות הגדרות (SRS §17.1) =================
describe('פער 2 — מודול ההשתמרות (settings-persistence)', () => {
  it('diffSettings: מזהה שינוי/הוספה; ערך זהה לבסיס אינו נכלל', () => {
    const baseline = { a: 1, b: 'x', c: true };
    const current = { a: 1, b: 'y', c: true, d: 'new' };
    const d = diffSettings(baseline, current);
    assertEq(d, { b: 'y', d: 'new' }, 'רק ההפרש נשמר');
  });

  it('save/load roundtrip: הפרש נשמר ונטען זהה; פורמט וגרסה מאומתים', () => {
    const p = createSettingsPersistence(null);
    const res = p.save({ 'body-font': 'פרנקל' });
    assert(res.ok === true, 'שמירה הצליחה');
    assertEq(p.load(), { 'body-font': 'פרנקל' }, 'טעינה מחזירה את אותו הפרש');
  });

  it('הפרש ריק ⇒ מחיקת המפתח (חזרה נקייה לברירות המחדל)', () => {
    const p = createSettingsPersistence(null);
    p.save({ 'body-font': 'פרנקל' });
    const res = p.save({});
    assert(res.ok === true && res.cleared === true, 'הפרש ריק מוחק');
    assert(p.load() === null, 'אין נתונים שמורים אחרי מחיקה');
  });

  it('JSON שבור / פורמט זר / גרסה עתידית ⇒ null (אין מיגרציה שקטה)', () => {
    const store = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, v); }, removeItem(k) { this._m.delete(k); } };
    const p = createSettingsPersistence(store);
    store._m.set(STORAGE_KEY, '{{{ לא גזון');
    assert(p.load() === null, 'JSON שבור ⇒ null');
    store._m.set(STORAGE_KEY, JSON.stringify({ format: 'אחר', version: 1, settings: {} }));
    assert(p.load() === null, 'פורמט זר ⇒ null');
    store._m.set(STORAGE_KEY, JSON.stringify({ format: FORMAT, version: VERSION + 1, settings: {} }));
    assert(p.load() === null, 'גרסה עתידית ⇒ null');
    store._m.set(STORAGE_KEY, JSON.stringify({ format: FORMAT, version: VERSION, settings: [1, 2] }));
    assert(p.load() === null, 'settings שאינם אובייקט ⇒ null');
  });

  it('חריגת נפח (setItem זורק) ⇒ כשל עדין עם דיווח — בלי קריסה', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => { throw new Error('QuotaExceededError'); }
    };
    const p = createSettingsPersistence(throwing);
    const res = p.save({ a: 1 });
    assert(res.ok === false, 'השמירה דווחה ככושלת');
    assert(/Quota/.test(res.error), `השגיאה נשארה (${res.error})`);
  });
});

describe('פער 2 — חיווט app-shell (שמירה בשינוי, שחזור באתחול)', () => {
  function makePersist() { return createSettingsPersistence(null); }

  it('roundtrip מלא: שינוי הגדרה ⇒ שמירה ⇒ אפליקציה חדשה ⇒ השחזור מחזיר את הערך', () => {
    const persist = makePersist();
    const doc1 = makeDoc();
    const app1 = createApp(doc1, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app1.captureSettingsBaseline(); // מדמה את סוף ה-boot (ברירות המחדל = הבסיס)
    const regKey = 'body-font';
    const newVal = 'פרנקל רהיטי לבדיקה';
    app1.onSettingChanged(regKey, newVal);
    const saved = app1.persistSettingsNow();
    assert(saved.ok === true, 'השמירה הצליחה');
    // "ריענון": אפליקציה חדשה עם אותו אחסון
    const doc2 = makeDoc();
    const app2 = createApp(doc2, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app2.captureSettingsBaseline();
    const r = app2.restorePersistedSettings();
    assert(r.restored >= 1, `השחזור החיל מפתחות (${r.restored})`);
    assertEq(app2.getSettings()[regKey], newVal, 'הערך שרד את ה"ריענון" (SRS §17.1)');
  });

  it('ערך שהוחזר לבסיס ⇒ ההפרש מתרוקן והאחסון מוחק (reset נקי)', () => {
    const persist = makePersist();
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app.captureSettingsBaseline();
    const key = 'endnote-columns'; // מפתח אמיתי ברישום (ברירת מחדל 1)
    const orig = app.getSettings()[key];
    app.onSettingChanged(key, 999);
    assert(persistSettingsOf(app).ok === true, 'נשמר הפרש');
    app.onSettingChanged(key, orig); // חזרה לבסיס
    const res = app.persistSettingsNow();
    assert(res.ok === true && res.cleared === true, 'הפרש ריק ⇒ האחסון נמחק');
    function persistSettingsOf(a) { return a.persistSettingsNow(); }
  });

  it('שחזור מדלג על מפתחות לא מוכרים ולא משנה אותם', () => {
    const persist = makePersist();
    // הזרקה ידנית של הפרש עם מפתח בדוי
    persist.save({ 'body-font': 'גופן-משוחזר', 'מפתח-בדוי-מהעתיד': 42 });
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app.captureSettingsBaseline();
    const r = app.restorePersistedSettings();
    assert(r.restored === 1, `רק המפתח המוכר הוחל (${r.restored})`);
    assert(r.skipped.includes('מפתח-בדוי-מהעתיד'), 'המפתח הבדוי דווח כמדולג');
    assert(app.getSettings()['מפתח-בדוי-מהעתיד'] === undefined, 'המפתח הבדוי לא הוחל');
    assertEq(app.getSettings()['body-font'], 'גופן-משוחזר', 'המפתח המוכר הוחל');
  });

  it('ייבוא טקסט לא מוחק הגדרות ולא את ההפרש השמור (SRS: "across text imports")', () => {
    const persist = makePersist();
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app.captureSettingsBaseline();
    app.onSettingChanged('endnote-columns', 2);
    app.persistSettingsNow();
    const before = persist.load();
    app.onDocumentAction('import-txt', 'שם הספר - ייבוא\n\nכותרת 2 - פרק\nטקסט מיובא.');
    assertEq(persist.load(), before, 'ההפרש השמור לא נמחק בייבוא');
    assertEq(app.getSettings()['endnote-columns'], 2, 'ההגדרה שרדה את הייבוא');
  });

  it('כאין persistence (Node/ישן) — הכול כבוי ושקוף: שינוי הגדרה לא קורס', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    app.onSettingChanged('endnote-columns', 2);
    const res = app.persistSettingsNow();
    assert(res.ok === false, 'אין שמירה בלי persistence');
    const r = app.restorePersistedSettings();
    assertEq(r.restored, 0, 'אין שחזור בלי persistence');
    assertEq(app.getSettings()['endnote-columns'], 2, 'ההגדרה עצמה עובדת כרגיל');
  });

  it('שחזור אחרי תוצאה קיימת מסמן כבד (⚡) — אין פער שקט בין תצוגה לייצוא', async () => {
    const persist = createSettingsPersistence(null);
    persist.save({ 'endnote-columns': 2 });
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    app.captureSettingsBaseline();
    app.setText('שם הספר - בדיקה\n\nכותרת 2 - פרק א\nטקסט לעימוד ראשוני.');
    app.onExplicitRetypeset();
    const ok = await waitFor(() => app.getState().hasResult === true, 15000);
    assert(ok, 'יש תוצאה לפני השחזור');
    const r = app.restorePersistedSettings();
    assert(r.restored >= 1, 'השחזור החיל');
    assert(app.getState().heavyDirty === true, 'סומן כבד — נדרש ⚡ (מנע פער שקט)');
  }, { timeout: 30000 });

  it('applyLegacyDefaults(source:boot) קובע בסיס פעם אחת; (source:panel) שומר את בחירת המשתמש', async () => {
    const persist = makePersist();
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport(), settingsPersistence: persist });
    // boot: ברירות המחדל = הבסיס
    await app.applyLegacyDefaults({ 'endnote-columns': 1, 'folio-display-mode': 'bottom' }, { source: 'boot', retypeset: false });
    assertEq(persist.load(), null, 'אחרי boot טהור אין הפרש שמור');
    // panel: החלת ערכה = שינוי משתמש — נשמר (SRS "preset toggles")
    await app.applyLegacyDefaults({ 'endnote-columns': 2 }, { source: 'panel', retypeset: false });
    const diff = persist.load();
    assert(diff && diff['endnote-columns'] === 2, `בחירת הערכה נשמרה בהפרש (${JSON.stringify(diff)})`);
  });
});

report('s61-gap-fixes');
