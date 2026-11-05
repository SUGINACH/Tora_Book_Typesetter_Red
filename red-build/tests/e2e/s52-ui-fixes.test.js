// tests/e2e/s52-ui-fixes.test.js — שער S5.2: נעילת תיקוני שכבת ה-UI
// כל בדיקה נועלה תיקון אחד מרשימת S5.2 (סקירה אדברסריאלית מאומתת):
//  1) respawn של Worker אחרי cancel/קריסה (תיקון התלייה "מנוע: עמל…")
//  2) terminate דוחה עבודות צד + את הפעילה ב-worker-restarted
//  3) מונה דור עימוד st.gen (חוזה לאודיט החי)
//  4) חייץ ייצוא: תמונת מצב אחת (dirty ⇒ ייצוא נעצר בהודעה)
//  5) מרוץ אתחול: ברירות מחדל עם retypeset:false + תוצאה קיימת ⇒ כבד מסומן
//  6) הדבקה ריקה אינה מוחקת מסמך
//  + גיליון/זום/גלילה בתצוגה, נעילת ייצוא, IMUD (מטמון/restart/מחסנית)
// מבוסס על דפוס ה-DOM-shim של s10-ui.test.js (אותו shim, אותן הגדרות).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { serializeTypesetResult } = require('../../src/ui/worker-protocol');
const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');
const { WorkerEngineClient, workerTransport, RESTART_ERROR, WORKER_ERROR_PREFIX } = require('../../src/ui/worker-client');
const { buildPreviewTab, parseHebrewNumber } = require('../../src/ui/preview-tab');
const { createImudLibrary } = require('../../src/ui/imud-library');

// ================= DOM shim (העתק מדויק של s10-ui.test.js — אותה הגדרה) =================
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

function fire(el, type, extra) { el.dispatchEvent(Object.assign({ type }, extra || {})); }
const settle = (ms = 20) => new Promise(r => setTimeout(r, ms));

// מסמך קטן (העתק מ-s10) לבדיקות אפליקציה
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

// מסמך אמת >60 עמודים לווירטואליזציה/גיליונות
const REAL = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');

// ================= Worker מזויף עם מפעל — לבדיקות respawn =================
class FakeWorker {
  constructor() {
    FakeWorker.instances.push(this);
    this.id = FakeWorker.instances.length;
    this.inbox = [];
    this.dead = false;
    this.terminatedCount = 0;
    this.postedWhileDead = 0;
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage(m) {
    if (this.dead) { this.postedWhileDead++; return; } // **S5.2:** ההוכחה — אין פוסט למת
    this.inbox.push(m);
    const wk = this;
    if (m.type === 'typeset-request') {
      queueMicrotask(() => {
        if (wk.dead || !wk.onmessage) return;
        wk.onmessage({
          data: {
            type: 'typeset-result', jobId: m.jobId,
            result: { schema: 'ui-result-v1', pages: [{ index: 0, template: { width: 794, height: 1123 } }], workerId: wk.id }
          }
        });
      });
    }
  }
  terminate() { this.terminatedCount++; this.dead = true; }
}
FakeWorker.instances = [];
const msgOf = (p) => p.then(() => { throw new Error('expected rejection'); }, (e) => e.message);

// =====================================================================
describe('S5.2 (1) — respawn של ה-Worker: בקשה אחרי cancel עובדת', () => {
  it('cancel ⇒ terminate ⇒ הפוסט הבא בונה מופע חדש שמקבל את ההודעה', async () => {
    FakeWorker.instances = [];
    const client = new WorkerEngineClient(workerTransport(() => new FakeWorker()));
    assertEq(FakeWorker.instances.length, 0, 'יצירה עצלה — עדיין לא נוצר Worker');
    const j1 = client.requestTypeset({ text: 'a', settings: {} });
    assertEq(FakeWorker.instances.length, 1, 'מופע 1 נוצר בפוסט הראשון');
    j1.cancel();
    const w1 = FakeWorker.instances[0];
    assert(w1.dead && w1.terminatedCount === 1, 'המופע הראשון נוטרל');
    assertEq(await msgOf(j1.promise), RESTART_ERROR, 'העבודה המבוטלת נדחית במפורש');
    // **S5.2 (1):** ליבת התיקון — בקשה חדשה אחרי cancel מגיעה למופע חדש (בעבר: Worker מת ⇒ תלייה)
    const j2 = client.requestTypeset({ text: 'b', settings: {} });
    assertEq(FakeWorker.instances.length, 2, 'respawn — המפעל נקרא שנית');
    assertEq(w1.postedWhileDead, 0, 'שום הודעה לא נשלחה למופע המת');
    assert(FakeWorker.instances[1].inbox.some(m => m.type === 'typeset-request' && m.text === 'b'), 'המופע השני קיבל את הבקשה');
    const r2 = await j2.promise;
    assert(r2 && r2.workerId === 2, 'התשובה הגיעה מהמופע השני');
    assertEq(r2.pages.length, 1);
  });

  it('single-flight מהיר ×2 על אותו לקוח: הראשונה נדחית, השנייה חיה', async () => {
    FakeWorker.instances = [];
    const client = new WorkerEngineClient(workerTransport(() => new FakeWorker()));
    const j1 = client.requestTypeset({ text: 'a', settings: {} });
    const j2 = client.requestTypeset({ text: 'b', settings: {} });
    assertEq(await msgOf(j1.promise), RESTART_ERROR);
    const r2 = await j2.promise;
    assertEq(r2.workerId, 2, 'השנייה רצה על המופע שהוזרם מחדש');
  });
});

// =====================================================================
describe('S5.2 (1) — terminate דוחה עבודות צד ואת הפעילה', () => {
  it('registerFont/requestExport בטיסה ⇒ worker-restarted; המפה מתרוקנת', async () => {
    FakeWorker.instances = [];
    const client = new WorkerEngineClient(workerTransport(() => new FakeWorker()));
    const fontP = client.registerFont({ name: 'X', bytes: new ArrayBuffer(8) });
    const expP = client.requestExport({ kind: 'pdf', text: 't', settings: {} });
    const j = client.requestTypeset({ text: 'a', settings: {} });
    assert(client.pending.size === 2, 'שתי עבודות צד בהמתנה');
    j.cancel();
    assertEq(await msgOf(fontP), RESTART_ERROR, 'רישום גופן לא נתלה לנצח');
    assertEq(await msgOf(expP), RESTART_ERROR, 'ייצוא לא נתלה לנצח');
    assertEq(await msgOf(j.promise), RESTART_ERROR, 'העבודה הפעילה נדחית — לא {cancelled:true}');
    assertEq(client.pending.size, 0, 'מפת ההמתנה רוקנה');
    assert(!client.busy, 'הלקוח פנוי');
  });

  it('worker.onerror ⇒ דחייה worker-error + מאזין onError + respawn בפוסט הבא', async () => {
    FakeWorker.instances = [];
    const client = new WorkerEngineClient(workerTransport(() => new FakeWorker()));
    const seen = [];
    const off = client.onError((e) => seen.push(e.message));
    const j = client.requestTypeset({ text: 'a', settings: {} });
    const wk = FakeWorker.instances[0];
    wk.onerror({ message: 'boom' }); // כשל טעינה/קריסה — אירוע ה-error של ה-Worker
    const m = await msgOf(j.promise);
    assert(m && m.indexOf(WORKER_ERROR_PREFIX) === 0, 'קידומת worker-error: ' + m);
    assert(m.includes('boom'), 'הפרט נשתמר: ' + m);
    assertEq(seen.length, 1, 'המאזין קיבל הודעה אחת');
    assertEq(seen[0], m);
    assert(wk.dead, 'המופע הכושל נסגר');
    const j2 = client.requestTypeset({ text: 'b', settings: {} });
    assertEq(FakeWorker.instances.length, 2, 'respawn גם אחרי onerror');
    const r2 = await j2.promise;
    assertEq(r2.workerId, 2);
    off();
    wk.onerror({ message: 'boom2' });
    assertEq(seen.length, 1, 'ביטול רישום עובד');
  });
});

// =====================================================================
describe('S5.2 (5) — מונה דור העימוד st.gen (חוזה לאודיט החי)', () => {
  it('מתחיל ב-0; +1 לכל עימוד שהושלם; ביטול/החלפה אינם נספרים; clear אינו מאפס', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    assertEq(app.getState().gen, 0, 'התחלה: 0');
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    assertEq(app.getState().gen, 1, 'השלמה ראשונה');
    assert(app.getState().hasResult, 'התוצאה קיימת');
    app.onExplicitRetypeset();
    await settle();
    assertEq(app.getState().gen, 2, 'שתי השלמות ⇒ 2');
    // החלפה (single-flight) — רק השנייה נספרת: שתי הדבקות ברצף, השנייה מבטלת את הראשונה
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(120);
    assertEq(app.getState().gen, 3, 'החלפה: +1 בלבד (המבוטלת לא נספרה)');
    app.onDocumentAction('clear', '');
    assertEq(app.getState().pages, 0);
    assertEq(app.getState().gen, 3, 'ניקוי אינו מאפס — מונה מונוטוני של השלמות');
  });

  it('בקשה שהוחלפה אינה מוצגת כשגיאת מנוע (RESTART_ERROR נבלע בשקט)', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const states = [];
    const orig = app.status.setEngineState.bind(app.status);
    app.status.setEngineState = (s, info) => { states.push(s); orig(s, info); };
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } }); // מבטלת את הראשונה
    await settle(120);
    assert(app.getState().hasResult, 'השנייה הושלמה');
    assert(!states.includes('error'), 'ההחלפה השקטה לא דווחה כשגיאה: ' + states.join(','));
    const chip = app.status.root.querySelectorAll('.chip--engine')[0].textContent;
    assert(chip.includes('פנוי'), 'המנוע פנוי בסוף: ' + chip);
  });
});

// =====================================================================
describe('S5.2 (3) — חייץ ייצוא: dirty ⇒ ייצוא נעצר בהודעה; נקי ⇒ יוצא', () => {
  const doc = makeDoc();
  const files = [];
  const app = createApp(doc, {
    transport: inlineTransport.createInlineTransport(),
    onExportFile: (kind, data) => { files.push({ kind, len: data && data.length }); }
  });
  fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
  const done = settle();

  it('נקי ⇒ HTML יוצא; שינוי כבד ⇒ חסימה + הודעה עברית; רק ייצוא אחד יצא', async () => {
    await done;
    assert(app.getState().hasResult && !app.getState().heavyDirty, 'מצב נקי');
    const res1 = app.exportRequest('html');
    assert(res1 && res1.ok === true, 'ייצוא במצב נקי עובד');
    assertEq(files.length, 1);
    app.onSettingChanged('grid-col-width-pct', 52); // כבד — ⚡ מהבהב
    assert(app.getState().heavyDirty, 'מסומן כבד');
    const res2 = app.exportRequest('html');
    assert(res2 && res2.ok === false && res2.reason === 'dirty', 'הייצוא נחסם: ' + JSON.stringify(res2));
    const notice = app.status.root.querySelectorAll('.chip--notice').map(c => c.textContent).join(' ');
    assert(notice.includes('קיימים שינויים שלא הוחלו'), 'הודעה עברית בפס המצב: ' + notice);
    assertEq(files.length, 1, 'השני לא יצא — אין שני קבצים סותרים');
  });

  it('אחרי ⚡ שוב נקי ⇒ יוצא; שינוי קל גם הוא חוסם עד רינדור/עימוד', async () => {
    app.status.bolt.click();
    await settle();
    assert(!app.getState().heavyDirty, 'נקי אחרי ⚡');
    const res3 = app.exportRequest('html');
    assert(res3 && res3.ok === true, 'יוצא אחרי עימוד');
    app.onSettingChanged('background-color', '#102030'); // קל — רינדור מתוכנן
    assert(app.getState().lightDirty, 'קל בהמתנה');
    const res4 = app.exportRequest('html');
    assert(res4 && res4.ok === false && res4.reason === 'dirty', 'גם קלים חוסמים עד שהוחלו');
    await wait(450); // הרינדור הקל רץ — ואז שוב נקי
    assert(!app.getState().lightDirty, 'הרינדור הקל הושלם');
    const res5 = app.exportRequest('html');
    assert(res5 && res5.ok === true, 'אחרי רינדור קל — שוב נקי');
  });
});

// =====================================================================
describe('S5.2 (4) — מרוץ אתחול: ברירות מחדל עם retypeset:false', () => {
  it('עם תוצאה קיימת ⇒ heavyDirty מסומן (⚡ מהבהב) והייצוא נחסם', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    assert(app.getState().hasResult && !app.getState().heavyDirty, 'לפני: נקי');
    await app.applyLegacyDefaults({ 'grid-col-width-pct': 62, 'body-font-size-pt': 13 }, { retypeset: false });
    assertEq(app.getSettings()['grid-col-width-pct'], 62, 'ההגדרות הוחלו בפועל');
    assert(app.getState().heavyDirty, 'הפער לא שקט — סומן כבד');
    assert(app.status.getBlink(), '⚡ מהבהב');
    assertEq(app.exportRequest('html').reason, 'dirty', 'הייצוא נחסם עד עימוד');
    app.status.bolt.click();
    await settle();
    assert(!app.getState().heavyDirty && app.getState().gen >= 2, 'אחרי ⚡: נקי ועומד מחדש');
    assertEq(app.getSettings()['grid-col-width-pct'], 62, 'ההגדרות שרדו את העימוד');
  });

  it('בלי תוצאה ⇒ אין סימון מלאכותי (אין פער — אין מה להחיל)', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    await app.applyLegacyDefaults({ 'body-font-size-pt': 13 }, { retypeset: false });
    assert(!app.getState().heavyDirty, 'אין תוצאה — אין סימון');
    assert(!app.status.getBlink(), 'אין הבהוב שקר');
  });
});

// =====================================================================
describe('S5.2 (11) — הדבקה ריקה אינה מוחקת מסמך', () => {
  it('ריק/רווחים ⇒ התעלמות מלאה (טקסט, עימוד ודגלים לא נוגעים)', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle();
    assert(app.getState().hasResult, 'יש תוצאה');
    const genBefore = app.getState().gen;
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => '' } });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => '   \n\t  ' } });
    assertEq(app.getText(), SMALL_DOC, 'המסמך לא נמחק בשקט');
    assertEq(app.getState().gen, genBefore, 'לא הופעל עימוד ריק');
    assert(app.getState().hasResult, 'התוצאה לא אופסה');
    // הדבקה אמיתית עדיין מחליפה (הנתיב התקין לא נפגע)
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => 'ספר - חדש\n\nכותרת 1 - חלק' } });
    await settle();
    assert(app.getText().includes('חדש'), 'הדבקה אמיתית מוחלפת כרגיל');
    assert(app.getState().gen === genBefore + 1, 'עימוד אחד בלבד נוסף');
  });
});

// =====================================================================
describe('S5.2 (6/7/12) — תצוגה: גלילה אופקית, keepView, גיליון, נעילת ייצוא', () => {
  const settings = getDefaultSettings();
  const result = typeset(REAL, settings);
  const ser = serializeTypesetResult(result);

  it('(6) מצב אופקי: גלילה לאזור עמוד 80 מרנדר אותו — לא תיבות ריקות', async () => {
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(ser, settings);
    assert(pv.isVirtual(), 'מסמך >60 עמודים — מצב וירטואלי');
    const n = ser.pages.length;
    const w = ser.pages[0].template.width; // 794
    const gap = 24;
    // מעבר למצב אופקי (הכפתור מחליף)
    fire(pv.root.querySelectorAll('.btn--toggle')[0], 'click');
    const canvas = pv.root.querySelectorAll('.preview-canvas')[0];
    assert(canvas.classList.contains('canvas--horizontal'), 'המצב האופקי הופעל');
    // גלילה אופקית לאזור עמוד 80 (מודרני RTL: scrollLeft שלילי מהתחלה)
    const x80 = 80 * (w + gap);
    canvas.scrollLeft = -(x80 - 50); // S=x80-50 ⇒ החלון [x80-50, x80+850] כולל את 80
    canvas.clientWidth = 900;
    canvas.scrollWidth = n * w + (n - 1) * gap;
    fire(canvas, 'scroll');
    await settle(60);
    const phs = pv.root.querySelectorAll('.preview-page--placeholder');
    assertEq(phs.filter(p => p.getAttribute('data-page-index') === '80').length, 0, 'עמוד 80 רונדר — לא placeholder ריק');
    assert(pv.getRenderedCount() > 0 && pv.getRenderedCount() <= 25, 'DOM נשאר קטן: ' + pv.getRenderedCount());
    assertEq(pv.root.querySelectorAll('.preview-page').length, n, 'כמות האלמנטים נשמרת');
    // חזרה לאנכי — המצב האנכי לא נפגע
    fire(pv.root.querySelectorAll('.btn--toggle')[0], 'click');
    assert(!canvas.classList.contains('canvas--horizontal'));
  });

  it('(7) keepView: רינדור־קל שומר זום+יעד; מסמך חדש מאפס', () => {
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(ser, settings);
    assertEq(pv.getZoom(), 100, 'התחלה 100%');
    const plus = pv.root.querySelectorAll('.btn--icon').find(b => b.getAttribute('aria-label').includes('הגדל'));
    for (let i = 0; i < 5; i++) fire(plus, 'click');
    assertEq(pv.getZoom(), 150);
    pv.scrollToPage(30);
    assertEq(pv._lastScrollTarget(), 30);
    // רינדור קל (אותה תוצאה, הגדרות חדשות) — עדכון צבע לא אמור לאפס תצוגה
    pv.setResult(ser, Object.assign({}, settings, { 'background-color': '#abcdef' }), { keepView: true });
    assertEq(pv.getZoom(), 150, 'הזום נשמר');
    assertEq(pv._lastScrollTarget(), 30, 'יעד הגלילה נשמר');
    assert(pv.getRenderedCount() > 0 && pv.getRenderedCount() <= 25, 'החלון החי סביב היעד (וירטואלי): ' + pv.getRenderedCount());
    const phs = pv.root.querySelectorAll('.preview-page--placeholder');
    assertEq(phs.filter(p => p.getAttribute('data-page-index') === '30').length, 0, 'עמוד היעד רונדר בחזרה');
    // מסמך חדש באמת — איפוס התנהגות מקורי
    pv.setResult(ser, settings);
    assertEq(pv.getZoom(), 100, 'מסמך חדש מאפס זום');
  });

  it('(12) קפיצה לפי מספר עברי — אל העמוד שמציג את הגיליון, לא לאינדקס הפיזי', () => {
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(ser, settings);
    // מציאת עמוד שגיליונו שונה ממספרו הפיזי (בספר אמת עם שער/תוכן לא-נספרים)
    let probe = null;
    for (let i = 0; i < ser.pages.length; i++) {
      const f = ser.pages[i].folioDisplay;
      const num = f ? parseHebrewNumber(f) : null;
      if (num != null && num !== i + 1) { probe = { i, num, f }; break; }
    }
    assert(probe, 'נדרש עמוד שגיליונו שונה ממספרו הפיזי (יש בספר האמת)');
    const oldWrong = probe.num - 1; // מה שהקפיצה הישנה היתה עושה
    assert(oldWrong !== probe.i, 'תנאי הבדיקה: הגיליון שונה מהאינדקס');
    const idx = pv.jumpByHebrew(String(probe.num));
    assertEq(idx, probe.i, `הקפיצה ל-${probe.num} נוחתת על העמוד שמציג אותו (אינדקס ${probe.i}), לא על ${oldWrong}`);
    assertEq(pv._lastScrollTarget(), probe.i, 'הגלילה הלכה לעמוד הגיליון');
    // גם לפי מחרוזת הגיליון עצמה (גרשיים/מסגרות) וגם קלט עשרוני
    assertEq(pv.jumpByHebrew(probe.f), probe.i, 'קפיצה לפי מחרוזת הגיליון עצמה');
    assertEq(pv.jumpByHebrew(String(probe.num)), probe.i, 'קלט עשרוני נקלט');
    // מספר שאינו במפה ⇒ null מתועד (לא קפיצה לא מדויקת)
    assertEq(pv.jumpByHebrew('תתת'), null, 'מחוץ לטווח ⇒ null');
    assertEq(pv.jumpByHebrew('abc'), null, 'קלט לא עברי ⇒ null');
  });

  it('(3) setExportBusy: נעילת שלושת כפתורי הייצוא בזמן ייצוא מרוחק', () => {
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(ser, settings);
    const btns = pv.root.querySelectorAll('.export-bar button');
    assertEq(btns.length, 3, 'שלושה כפתורים: HTML/PDF/ZIP');
    assert(btns.every(b => !b.disabled), 'פתוחים כברירת מחדל');
    pv.setExportBusy(true);
    assert(btns.every(b => b.disabled === true), 'נעולים בזמן ייצוא (מנע לחיצה כפולה)');
    pv.setExportBusy(false);
    assert(btns.every(b => !b.disabled), 'משוחררים בסיום');
  });
});

// =====================================================================
describe('S5.2 (10) + (9) — ספריית IMUD: מטמון בטיסה, restart, מחסניות', () => {
  function stubFetch(handler) {
    const orig = global.fetch;
    global.fetch = (path) => Promise.resolve(handler(String(path)));
    return () => { global.fetch = orig; };
  }
  const CATALOG = [
    { family: 'David Libre', file: 'DavidLibre-Regular.ttf' },
    { family: 'Frank Ruhl Libre', file: 'FrankRuhlLibre-Regular.ttf' }
  ];
  const TTF = new ArrayBuffer(16);

  it('(10) שתי קריאות מקבילות ל-loadFontCatalog ⇒ fetch אחד בלבד', async () => {
    let fetches = 0;
    const restore = stubFetch((p) => {
      fetches++;
      if (p.includes('imud-fonts.json')) return { ok: true, json: async () => CATALOG };
      if (p.includes('fonts-extended.json')) return { ok: true, json: async () => [] };
      return { ok: true, arrayBuffer: async () => TTF };
    });
    try {
      const calls = [];
      const lib = createImudLibrary({
        registerFont: (r) => { calls.push(r.name); return Promise.resolve(); },
        registerAssets: () => Promise.resolve({}),
        requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
      });
      const [a, b] = await Promise.all([lib.loadFontCatalog(), lib.loadFontCatalog()]);
      assertEq(fetches, 2, 'בדיוק שני fetch (קטלוג+מורחב) — לא ארבעה');
      assertEq(a.length, 2, 'שתי משפחות מוטמעות');
      assertEq(b.length, 2, 'אותה תשובה לשני הקוראים');
      const c = await lib.loadFontCatalog();
      assertEq(c.length, 2);
      assertEq(fetches, 2, 'קריאה שלישית אחרי הטעינה — בלי fetch נוסף');
      assertEq(calls.length, 0, 'לא נגענו בגופנים');
    } finally { restore(); }
  });

  it('(1) registerFont שנדחה ב-worker-restarted ⇒ ההבטחה נדחית, המטמון מתפנה והרישום חוזר', async () => {
    const calls = [];
    const lib = createImudLibrary({
      // **S5.2:** המנוע "מת" ברישום הראשון של כל גופן — וחי בשני (respawn)
      registerFont: (r) => {
        calls.push(r.name);
        return calls.filter(n => n === r.name).length <= 1
          ? Promise.reject(new Error(RESTART_ERROR))
          : Promise.resolve();
      },
      registerAssets: () => Promise.resolve({}),
      requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
    });
    const restore = stubFetch((p) => (
      p.includes('imud-fonts.json') ? { ok: true, json: async () => CATALOG }
        : p.includes('fonts-extended.json') ? { ok: true, json: async () => [] }
          : { ok: true, arrayBuffer: async () => TTF }
    ));
    try {
      await lib.loadFontCatalog();
      const first = await lib.loadFont('David Libre').then(() => 'resolved', (e) => e.message);
      assertEq(first, RESTART_ERROR, 'הרישום הראשון נדחה — ולא נבלע בשקט (הייצוא היה נתקע)');
      const second = await lib.loadFont('David Libre');
      assert(second && second.byteLength === 16, 'קריאה חוזרת עובדת — המטמון התפנה');
      assertEq(calls.filter(n => n === 'David Libre').length, 2, 'נרשם מחדש על המנוע שהוזרם');
    } finally { restore(); }
  });

  it('(9) loadFontStack/resolveFamily פותרים מחסנית למשפחה המוטמעת הראשונה', async () => {
    const loaded = [];
    const lib = createImudLibrary({
      registerFont: (r) => { loaded.push(r.name); return Promise.resolve(); },
      registerAssets: () => Promise.resolve({}),
      requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
    });
    const restore = stubFetch((p) => (
      p.includes('imud-fonts.json') ? { ok: true, json: async () => CATALOG }
        : p.includes('fonts-extended.json') ? { ok: true, json: async () => [] }
          : { ok: true, arrayBuffer: async () => TTF }
    ));
    try {
      // **S5.2 (9):** ערך מחסנית ("David Libre, serif") — הנתיב של getExportFont
      const buf = await lib.loadFontStack('David Libre, serif');
      assert(buf && buf.byteLength === 16, 'מחסנית נפתרה למשפחה המוטמעת — לא null בשקט');
      assertEq(lib.resolveFamily('David Libre, serif'), 'David Libre', 'השם שפועל בפועל (לייצוא PDF)');
      assertEq(lib.resolveFamily("'Frank Ruhl Libre', serif"), 'Frank Ruhl Libre', 'גרשיים נופלים');
      assertEq(loaded.filter(n => n === 'David Libre').length, 1, 'המשפחה שפועלה נרשמה במנוע');
      // לפני טעינת קטלוג בספרייה חדשה — loadFontStack ממתין לקטלוג (לא null שקט)
      const lib2 = createImudLibrary({
        registerFont: () => Promise.resolve(),
        registerAssets: () => Promise.resolve({}),
        requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
      });
      const buf2 = await lib2.loadFontStack('Frank Ruhl Libre');
      assert(buf2 && buf2.byteLength === 16, 'קריאה לפני טעינת הקטלוג ממתינה ופותרת');
    } finally { restore(); }
  });
});

// עזר המתנה מקומי (לרינדור הקל)
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

report('s52-ui-fixes');
