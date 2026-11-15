// tests/e2e/a1-input-integrity.test.js — סוכן 1 (UI תפעולי): שלמות קלט והגדרות
//  (א) טעינת תבנית טוענת את הגופנים שבה (כמו applyLegacyDefaults) — בלי זה המנוע מודד בגופן שלא נרשם
//  (ב) ייבוא TXT: פענוח UTF-8 קפדני עם נפילה ל-Windows-1255 — readAsText('utf-8') הפך עברית ANSI ל-"����" בשקט
//  (ג) תווית ספירת הפאנלים בפאנל ההגדרות נגזרת מהרישום (13), לא מחרוזת קבועה "12"
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');
const { BINDINGS, PANELS } = require('../../src/ui/bindings.generated');
let decodeTextBytes = null;
try { ({ decodeTextBytes } = require('../../src/ui/text-decode')); } catch (e) { /* לפני התיקון המודול אינו קיים — הבדיקות נכשלות במפורש */ }

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

function fakeLib(calls, opts) {
  return {
    listDesigns: async () => [], ensureDesign: async (c, id) => `imud:${c}:${id}`, listSettingSets: () => [],
    loadSettingSet: async () => { throw new Error('לא בבדיקה זו'); }, loadLegacyDefaults: async () => { throw new Error('לא בבדיקה זו'); },
    loadFont: async () => null, fontStatus: () => null, catalogFamilies: () => undefined,
    loadFontStack: async (v) => { calls.push(v); if (opts && opts.reject) throw new Error('גופן חיצוני — כשל טעינה'); return null; }
  };
}
const templateWith = (app, patch) => JSON.stringify({ format: 'tora-typesetter-template', version: 1, settings: Object.assign({}, app.getSettings(), patch) });
const HEB = 'שלום עולם — בראשית ברא אלהים את השמים ואת הארץ.\nכותרת 1 - פרק א\n';
const cp1255 = Buffer.from([0xF9, 0xEC, 0xE5, 0xED, 0x20, 0xF2, 0xE5, 0xEC, 0xED]); // "שלום עולם" ב-Windows-1255

describe('A1 — טעינת תבנית טוענת את הגופנים שבה (תפעול הגדרות)', () => {
  it('loadTemplateJson עם body-font/dh-font מהספרייה ⇒ loadFontStack נקרא לכל אחד (כמו applyLegacyDefaults)', async () => {
    const calls = [];
    const app = createApp(makeDoc(), { transport: inlineTransport.createInlineTransport(), imudLibrary: fakeLib(calls) });
    await wait(80);
    calls.length = 0;
    app.loadTemplateJson(templateWith(app, { 'body-font': 'Bellefair', 'dh-font': 'Alpha' }));
    await wait(80);
    assert(calls.includes('Bellefair'), `body-font נטען: [${calls}]`);
    assert(calls.includes('Alpha'), `dh-font נטען: [${calls}]`);
  });

  it('F-06: טעינת תבנית אינה מפעילה עימוד (עימוד רק ב-⚡/פעולת מסמך)', async () => {
    const calls = [];
    const app = createApp(makeDoc(), { transport: inlineTransport.createInlineTransport(), imudLibrary: fakeLib(calls) });
    await wait(60);
    app.loadTemplateJson(templateWith(app, { 'body-font': 'Bellefair' }));
    await wait(120);
    assertEq(app.getState().gen, 0, 'אין עימוד אחרי טעינת תבנית');
  });

  it('כשל בטעינת גופן אינו חוסם ואינו יוצר unhandled rejection', async () => {
    const calls = [];
    let unhandled = 0;
    const onUnhandled = () => { unhandled++; };
    process.on('unhandledRejection', onUnhandled);
    try {
      const app = createApp(makeDoc(), { transport: inlineTransport.createInlineTransport(), imudLibrary: fakeLib(calls, { reject: true }) });
      await wait(60);
      const res = app.loadTemplateJson(templateWith(app, { 'body-font': 'Bellefair' }));
      assert(res && Array.isArray(res.unknownKeys), 'loadTemplateJson מחזיר תוצאה רגילה');
      await wait(120);
    } finally { process.removeListener('unhandledRejection', onUnhandled); }
    assertEq(unhandled, 0, 'אין unhandled rejection');
  });
});

describe('A1 — ייבוא TXT: פענוח קידוד בלי השחתה שקטה של העברית', () => {
  it('המודול src/ui/text-decode.js קיים ומייצא decodeTextBytes', () => {
    assert(typeof decodeTextBytes === 'function', 'decodeTextBytes חסר');
  });
  it('הוכחת הכשל הישן: bytes של Windows-1255 דרך UTF-8 (התנהגות readAsText) ⇒ כל האותיות הופכות ל-U+FFFD', () => {
    const old = new TextDecoder('utf-8').decode(cp1255);
    assertEq((old.match(/\uFFFD/g) || []).length, 8, '8 תווים פגומים מתוך 8 אותיות');
    assert(!/[\u05D0-\u05EA]/.test(old), 'אפס אותיות עבריות נשמרו');
  });
  it('UTF-8 תקין: טקסט זהה, ללא fallback', () => {
    const d = decodeTextBytes(Buffer.from(HEB, 'utf8'));
    assertEq(d.text, HEB); assertEq(d.encoding, 'utf-8'); assertEq(d.fallback, false); assertEq(d.replacementChars, 0);
  });
  it('UTF-8 עם BOM: ה-BOM מוסר מהטקסט', () => {
    const d = decodeTextBytes(Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(HEB, 'utf8')]));
    assertEq(d.text, HEB); assertEq(d.encoding, 'utf-8-bom'); assert(d.text.charCodeAt(0) !== 0xFEFF, 'אין BOM בתחילת הטקסט');
  });
  it('UTF-16LE ו-UTF-16BE עם BOM', () => {
    const le = Buffer.concat([Buffer.from([0xFF, 0xFE]), Buffer.from(HEB, 'utf16le')]);
    assertEq(decodeTextBytes(le).text, HEB); assertEq(decodeTextBytes(le).encoding, 'utf-16le');
    const be = Buffer.from(Buffer.from(HEB, 'utf16le')).swap16();
    const beBom = Buffer.concat([Buffer.from([0xFE, 0xFF]), be]);
    assertEq(decodeTextBytes(beBom).text, HEB); assertEq(decodeTextBytes(beBom).encoding, 'utf-16be');
  });
  it('Windows-1255 (ANSI עברי): נפילה מפורשת — העברית נשמרת, fallback=true, אפס תווים פגומים', () => {
    const d = decodeTextBytes(cp1255);
    assertEq(d.text, 'שלום עולם'); assertEq(d.encoding, 'windows-1255'); assertEq(d.fallback, true); assertEq(d.replacementChars, 0);
  });
  it('UTF-8 תקין שכבר מכיל U+FFFD במקור: אין fallback, אך מספר התווים הפגומים מדווח (להתראה)', () => {
    const d = decodeTextBytes(Buffer.from('אבג \uFFFD\uFFFD דהו', 'utf8'));
    assertEq(d.fallback, false); assertEq(d.replacementChars, 2);
  });
  it('קלטים גבוליים: ריק / ASCII בלבד / ArrayBuffer / Uint8Array', () => {
    assertEq(decodeTextBytes(new Uint8Array(0)).text, '');
    assertEq(decodeTextBytes(Buffer.from('plain ascii')).encoding, 'utf-8');
    const ab = new Uint8Array(Buffer.from(HEB, 'utf8')).buffer;
    assertEq(decodeTextBytes(ab).text, HEB);
    assertEq(decodeTextBytes(new Uint8Array(Buffer.from(HEB, 'utf8'))).text, HEB);
  });
  it('מסמך גדול (~1MB עברית) משוחזר במדויק וללא האטה', () => {
    const big = HEB.repeat(12000);
    const t0 = Date.now();
    const d = decodeTextBytes(Buffer.from(big, 'utf8'));
    assertEq(d.text.length, big.length); assert(d.text === big, 'שחזור זהה');
    assert(Date.now() - t0 < 2000, `פענוח מהיר (${Date.now() - t0}ms)`);
  });
  it('חיבור (static guard): כפתור ייבוא TXT בדפדפן משתמש ב-decodeTextBytes ולא ב-readAsText(utf-8)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', 'browser-entry.js'), 'utf8');
    assert(/onRequestTxtImport:[\s\S]{0,500}decodeTextBytes\(/.test(src), 'onRequestTxtImport קורא ל-decodeTextBytes');
    assert(!/onRequestTxtImport:\s*\(\)\s*=>\s*pickFile\(/.test(src), 'onRequestTxtImport אינו עוד pickFile (קריאת UTF-8 בלבד)');
  });
});

describe('A1 — תווית ספירת הפאנלים נגזרת מהרישום', () => {
  it(`settings-count מציג את מספר הפאנלים האמיתי (${PANELS.length}) ותואם ל-DOM`, () => {
    const app = createApp(makeDoc(), { transport: inlineTransport.createInlineTransport() });
    const label = app.settingsPanel.root.querySelectorAll('.settings-count')[0].textContent;
    assertEq(label, `${BINDINGS.length} הגדרות ב־${PANELS.length} פאנלים`);
    assertEq(app.settingsPanel.root.querySelectorAll('.acc-panel').length, PANELS.length, 'מספר הפאנלים ב-DOM = הרישום');
  });
});

report('a1-input-integrity');
