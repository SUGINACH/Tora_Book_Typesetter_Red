// tests/e2e/a1-boot-failure.test.js — סוכן 1 (UI תפעולי): כשל אתחול/נכסים אינו נבלע בשקט (תוכנית האב §7.1)
//  לפני התיקון: כשל בטעינת נכסי הספרייה (ברירות המקור/קטלוג הגופנים) נבלע ב-catch ריק — האפליקציה פעלה בברירות RED
//  בלי שום הודעה, והמשתמש חשב שחלות ברירות המקור. עכשיו: הודעה לפי השלב שנכשל + שבב אזהרה קבוע לכשל נכסים.
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { createApp } = require('../../src/ui/app-shell');
const { buildStatusStrip } = require('../../src/ui/status-strip');
const inlineTransport = require('../../src/ui/inline-transport');
let bf = null;
try { bf = require('../../src/ui/boot-failure'); } catch (e) { /* לפני התיקון המודול אינו קיים — הבדיקות נכשלות במפורש */ }

// ================= DOM shim — העתק מ-s10-ui.test.js (+ select.options) =================
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

const entrySrc = () => fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', 'browser-entry.js'), 'utf8');

describe('A1 — הודעות כשל אתחול (boot-failure.js)', () => {
  it('המודול קיים ומייצא describeBootFailure / reportBootFailure / errorDetail', () => {
    assert(bf && typeof bf.describeBootFailure === 'function' && typeof bf.reportBootFailure === 'function' && typeof bf.errorDetail === 'function', 'boot-failure.js חסר');
  });
  it('כשל נכסים: ההודעה מפורשת — נכסי ספרייה, ברירות RED, והפירוט', () => {
    const m = bf.describeBootFailure('assets', new Error('HTTP 404 default_settings.json'));
    assert(m.includes('נכסי הספרייה') && m.includes('ברירות המחדל של RED'), m);
    assert(m.includes('HTTP 404 default_settings.json'), 'הפירוט מצורף');
  });
  it('שלבים שונים ⇒ הודעות שונות (נכסים / החלה / שחזור / עימוד אתחול / לא־ידוע)', () => {
    const e = new Error('x');
    const all = ['assets', 'apply', 'restore', 'retypeset', 'whatever'].map((s) => bf.describeBootFailure(s, e));
    assertEq(new Set(all).size, 5, 'חמש הודעות שונות');
    assert(all[1].includes('החלת ברירות'), all[1]); assert(all[2].includes('שחזור'), all[2]); assert(all[3].includes('עימוד האתחול'), all[3]);
  });
  it('errorDetail: חיתוך, איחוד רווחים, וקלטים שאינם Error', () => {
    assertEq(bf.errorDetail(new Error('א\n  ב\t\tג')), 'א ב ג');
    assert(bf.errorDetail(new Error('x'.repeat(500))).length <= 140, 'נחתך ל-140');
    assertEq(bf.errorDetail('שגיאת טקסט'), 'שגיאת טקסט'); assertEq(bf.errorDetail(undefined), ''); assertEq(bf.errorDetail({ message: 'מ' }), 'מ');
  });
  it('reportBootFailure: נכסים ⇒ שבב קבוע + הודעה; שלב אחר ⇒ הודעה בלבד; בלי status ⇒ לא נופל', () => {
    const calls = [];
    const app = { status: { setNotice: (m) => calls.push(['notice', m]), setAssetsFailure: (m) => calls.push(['assets', m]) } };
    const m1 = bf.reportBootFailure(app, 'assets', new Error('נפל'));
    assertEq(calls.map((c) => c[0]).join(','), 'assets,notice', 'שבב קבוע ואז הודעה'); assertEq(calls[0][1], m1);
    calls.length = 0; bf.reportBootFailure(app, 'restore', new Error('נפל'));
    assertEq(calls.map((c) => c[0]).join(','), 'notice', 'שלב שאינו נכסים — הודעה בלבד');
    assert(typeof bf.reportBootFailure({}, 'assets', new Error('x')) === 'string', 'בלי status — מחזיר הודעה ולא נופל');
  });
});

describe('A1 — שבב נכסי הספרייה בפס המצב', () => {
  it('מוסתר כברירת מחדל; setAssetsFailure מציג אזהרה קבועה (פירוט ב-title); null מנקה', () => {
    const st = buildStatusStrip(makeDoc());
    const chip = () => st.root.querySelectorAll('.chip--assets')[0];
    assert(chip(), 'שבב .chip--assets קיים'); assertEq(chip().hidden, true, 'מוסתר כברירת מחדל');
    st.setAssetsFailure('פירוט הכשל');
    assertEq(chip().hidden, false); assert(chip().textContent.includes('ברירות RED'), chip().textContent); assertEq(chip().title, 'פירוט הכשל');
    st.setAssetsFailure(null);
    assertEq(chip().hidden, true); assertEq(chip().textContent, '');
  });
  it('מחובר ל-app האמיתי: app.status.setAssetsFailure זמין', () => {
    const app = createApp(makeDoc(), { transport: inlineTransport.createInlineTransport() });
    assert(typeof app.status.setAssetsFailure === 'function', 'setAssetsFailure חסר ב-status');
  });
});

describe('A1 — חיבור שרשרת האתחול בדפדפן (static guard — אין דפדפן בסוויטה)', () => {
  it('ה-catch הסופי מדווח לפי שלב ואינו עוד catch שקט', () => {
    const src = entrySrc();
    assert(/\.catch\(\(e\) => reportBootFailure\(app, bootStage, e\)\)/.test(src), 'catch סופי קורא ל-reportBootFailure');
    assert(!/\.catch\(\(\) => \{ \/\* נכסים לא זמינים — ברירות RED, מתועד \*\/ \}\)/.test(src), 'אין עוד catch שקט בשרשרת האתחול');
    for (const stage of ['assets', 'apply', 'restore', 'retypeset']) assert(src.includes(`bootStage = '${stage}'`) || src.includes(`let bootStage = '${stage}'`), `מעקב שלב: ${stage}`);
  });
});

report('a1-boot-failure');
