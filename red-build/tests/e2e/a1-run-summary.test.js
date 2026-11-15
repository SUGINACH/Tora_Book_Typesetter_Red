// tests/e2e/a1-run-summary.test.js — סוכן 1 (UI תפעולי): זהות הריצה האחרונה מוצגת למשתמש (תוכנית האב §7.1)
// לפני התיקון: hash הפריסה נראה רק בתוך תא JSON של טבלת ה-trace; hash הקלט, מזהה הריצה והזמן לא הוצגו בכלל.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');

// ================= DOM shim — העתק מ-s10-ui.test.js (+ select.options; נדרש גם ב-DOM אמיתי) =================
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
    get options() { return this.children.filter(c => c.tagName === 'OPTION'); }
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

const SMALL_DOC = [
  'ספר - אוסף לבדיקות UI',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקת פתיחה ראשונה עם כמה מילים כדי למלא שורה אחת לפחות בעמוד.',
  'פסקה שנייה עם הערת שוליים [זו הערת השוליים הראשונה] בתוך הטקסט.',
  'כותרת 2 - סימן ראשון',
  'תוכן הסימן הראשון פסקה ראשונה עם עוד הערה [הערה שנייה כאן] לבדיקה.'
].join('\n');

const mkApp = () => createApp(makeDoc(), { transport: inlineTransport.createInlineTransport() });
const paste = (app, t) => fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => t } });
async function until(fn, ms = 20000) { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error('timeout'); await wait(10); } }

/** שדות סעיף "פרטי הריצה האחרונה" לפי data-field (עמיד לשינוי ניסוח התוויות). */
function runFields(app) {
  const out = {};
  for (const dd of app.testing.root.querySelectorAll('.run-summary dd')) out[dd.dataset.field] = dd.textContent;
  return out;
}
const chipRun = (app) => app.status.root.querySelectorAll('.chip--run')[0];
const HEX64 = /^[0-9a-f]{64}$/;

describe('A1 — פרטי הריצה האחרונה (זהות הריצה מוצגת, §7.1)', () => {
  it('לפני עימוד: הסעיף ופס המצב מציינים שאין ריצה', () => {
    const app = mkApp();
    const sec = app.testing.root.querySelectorAll('.run-summary')[0];
    assert(sec, 'סעיף .run-summary קיים בלשונית הבדיקה');
    assert(sec.textContent.includes('עוד לא בוצע עימוד'), 'מצב ריק מוסבר');
    const chip = chipRun(app);
    assert(chip, 'שבב .chip--run קיים בפס המצב');
    assertEq(chip.textContent, '', 'אין טקסט ריצה לפני עימוד');
    assertEq(chip.hidden, true, 'השבב מוסתר לפני עימוד (בלי כדור ריק)');
  });

  it('אחרי עימוד: מזהה ריצה, מס׳ ריצה, זמן, hash פריסה ו-hash קלט — תואמים להרצה ישירה של המנוע', async () => {
    const app = mkApp();
    paste(app, SMALL_DOC);
    await until(() => app.getState().hasResult);
    const direct = typeset(SMALL_DOC, getDefaultSettings());
    const f = runFields(app);
    assert(/^job-/.test(f.jobId || ''), `מזהה ריצה (job-…): ${f.jobId}`);
    assertEq(f.run, '1', 'ריצה מס׳ 1');
    assert(/\d/.test(f.elapsed || '') && /(שניות|מילישניות)/.test(f.elapsed), `זמן עימוד מוצג: ${f.elapsed}`);
    assert(HEX64.test(f.layoutHash || ''), `hash פריסה מלא (64 hex): ${f.layoutHash}`);
    assertEq(f.layoutHash, direct.layoutHash, 'hash הפריסה בממשק = הרצה ישירה (אותו קלט/הגדרות)');
    assert(HEX64.test(f.contentHashIn || ''), `hash קלט מלא (64 hex): ${f.contentHashIn}`);
    assertEq(f.contentHashIn, direct.contentHashIn, 'hash הקלט בממשק = הרצה ישירה');
    const chip = chipRun(app);
    assertEq(chip.hidden, false, 'השבב מוצג אחרי עימוד');
    assert(chip.textContent.includes('ריצה #1'), `שבב מציג מס׳ ריצה: ${chip.textContent}`);
    assert(chip.textContent.includes(direct.layoutHash.slice(0, 8)), 'שבב מציג hash פריסה קצר');
    assert(String(chip.title).includes(direct.layoutHash) && String(chip.title).includes(direct.contentHashIn), 'ה-title של השבב נושא את ה-hashים המלאים');
  });

  it('ריצה שנייה על אותו קלט והגדרות: ריצה #2, אותו hash פריסה (דטרמיניזם גלוי), מזהה ריצה חדש', async () => {
    const app = mkApp();
    paste(app, SMALL_DOC);
    await until(() => app.getState().hasResult);
    const first = runFields(app);
    app.onExplicitRetypeset();
    await until(() => app.getState().gen === 2);
    const second = runFields(app);
    assertEq(second.run, '2', 'מונה הריצות עלה');
    assertEq(second.layoutHash, first.layoutHash, 'אותו קלט/הגדרות ⇒ אותו hash פריסה');
    assertEq(second.contentHashIn, first.contentHashIn, 'אותו hash קלט');
    assert(second.jobId !== first.jobId, 'מזהה ריצה חדש לכל ריצה');
  });

  it('שינוי הטקסט ועימוד מחדש משנה את hash הקלט וה-hash של הפריסה (הממשק לא מציג ערך ישן)', async () => {
    const app = mkApp();
    paste(app, SMALL_DOC);
    await until(() => app.getState().hasResult);
    const first = runFields(app);
    paste(app, SMALL_DOC + '\nפסקה נוספת שמשנה את התוכן.');
    await until(() => app.getState().gen === 2);
    const second = runFields(app);
    assert(second.contentHashIn !== first.contentHashIn, 'hash הקלט השתנה');
    assert(second.layoutHash !== first.layoutHash, 'hash הפריסה השתנה');
  });

  it('ניקוי המסמך מאפס את פרטי הריצה (אין hash של מסמך שנמחק)', async () => {
    const app = mkApp();
    paste(app, SMALL_DOC);
    await until(() => app.getState().hasResult);
    app.onDocumentAction('clear', '');
    const sec = app.testing.root.querySelectorAll('.run-summary')[0];
    assert(sec.textContent.includes('עוד לא בוצע עימוד'), 'הסעיף חזר למצב ריק');
    assertEq(chipRun(app).textContent, '', 'שבב הריצה התרוקן');
    assertEq(chipRun(app).hidden, true, 'ושוב מוסתר');
  });

  it('F-06: הצגת פרטי הריצה אינה מפעילה עימוד נוסף (ריצה אחת = עימוד אחד)', async () => {
    const app = mkApp();
    paste(app, SMALL_DOC);
    await until(() => app.getState().hasResult);
    await wait(150);
    assertEq(app.getState().gen, 1, 'בדיוק עימוד אחד הושלם');
  });
});

report('a1-run-summary');
