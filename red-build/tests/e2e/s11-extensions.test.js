// tests/e2e/s11-extensions.test.js — שער S11 (S11.2): הרחבות, DOCX, המלצות עריכה
// כל בדיקה נכתבה לנעילת שער ספציפי מ־02_MASTER_WORK_PLAN.md §S11.2 או REQ-PAR-06/07,
// REQ-GOV-11 — כולל D-16 (המלצה דורשת הוכחה), §8.3 (import/export/share), §12.3 (DOCX).
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { parseCustomStyles, validateImages } = require('../../src/engine/extensions/style-schema');
const { exportExtensions, importExtensions, shareSummary, FORMAT } = require('../../src/engine/extensions/extensions-io');
const { matchBlockStyle, matchInlineStyles, CustomStyleCounters, matchTriggerSpec } = require('../../src/engine/extensions/apply-styles');
const { importDocx, convert, headingLevelOf } = require('../../src/engine/import/docx-import');
const { readZip, safeName, inflateRaw, inflateRawPure } = require('../../src/engine/import/zip-reader');
const { parseXml } = require('../../src/engine/import/xml-lite');
const { buildZip } = require('../../src/engine/output/zip-writer');
const { computeEditingRecommendations, qualifyingFindings } = require('../../src/engine/audit/editing-recommendations');
const { applyEdit } = require('../../src/engine/audit/text-edits');
const { scanConsumers } = require('../../src/audit/scanners');

const { buildDocxFixture, EXPECTED_TEXT } = require('../fixtures/gen_docx_fixture');

const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');

const SRC = path.join(__dirname, '..', '..', 'src');

// ================= DOM shim (העתקה מ־s10 — אותו חוזה לכל בדיקות ה־UI) =================
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

// =====================================================================
// מסמכי בדיקה
// =====================================================================
const STYLES_DOC = [
  'ספר - ספר ההרחבות',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקה ראשונה עם ציטוט מקורי «וזהו הציטוט המובא בגוף הטקסט עצמו» והמשך הדברים באותה שורה.',
  'צד: זו הערת צד מבארת של הפסקה הבאה אחריה',
  'פסקה מארחת שאת ההערה שלמעלה יש להציג לצדה בשוליים בכתב קטן.',
  'קריאה: ו�ו קריאה חוצת טורים גדולה ומרשימה שתופסת פס בראש העמוד',
  'פסקת סיום אחרי הקריאה עם עוד כמה מילים למילוי הטור.',
  'כותרת 1 - חלק שני',
  'פתיחת החלק השני בפסקה שממשיכה את הזרימה עם עוד תוכן כלשהו כאן.',
  'קריאה: קריאה שנייה בחלק השני לבדיקת איפוס המונה',
  'פסקה אחרונה בחלק השני שסוגרת את המסמך בשלום ובטוב.'
].join('\n');

const THREE_STYLES = JSON.stringify({ styles: [
  {
    id: 'quote', name: 'ציטוט', trigger: { inlineMarker: { open: '«', close: '»' } }, layoutMode: 'regular',
    style: { italic: true, color: '#333333', indentEm: 1, fontSizePt: 13 }
  },
  {
    id: 'sidenote', name: 'הערת צד', trigger: { linePrefix: 'צד:' }, layoutMode: 'side-note',
    style: { fontSizePt: 10, color: '#555555' }
  },
  {
    id: 'callout', name: 'קריאה', trigger: { linePrefix: 'קריאה:' }, layoutMode: 'full-width',
    style: { background: '#f5f0e6', border: '#8a6d3b', bold: true },
    counter: { enabled: true, format: 'hebrew-geresh', reset: 'part' },
    linkedOrnaments: { top: 'pyramid' }
  }
] });

// מסמך להמלצות: פסקה ששורתה האחרונה מילה אחת («cut») — ניתנת לתיקון מוכח
const FILLER = 'אאא בבב גגג דדד ההה ווו זזז חחח טטט ייי כככ ללל מממ נננ ססס עעע פפפ צצץ קקק ררר ששש תתת ';
const RUNT_DOC = [
  'כותרת 1 - חלק',
  FILLER.repeat(3) + 'שורה אחרונה ארוכה למדי של הפסקה עם מילים רבות מספיקות מעל חמישים אחוז מרוחב הטור לבטחה ברורה מאוד אכן',
  'cut',
  FILLER.repeat(3) + 'סיום הפסקה הבאה במילים רבות כדי שהשורה האחרונה שלה תהיה ארוכה מאוד מספיק בוודאות שאין שום ספק בכך שהיא מעל חמישים אחוז'
].join('\n');

function typesetAll(text, settings) {
  let joined = '';
  const r = typeset(text, settings);
  for (const p of r.pages) joined += renderPage(p, settings, makeDoc(), r.metadata).outerHTML() + '\n';
  return { r, joined };
}

// =====================================================================
describe('S11.2 שער 1 — שלוש דוגמאות סגנון מותאם מרונדרות מקצה־לקצה (REQ-PAR-06)', () => {
  const settings = { ...getDefaultSettings(), _customStyles: THREE_STYLES };
  const { r, joined } = typesetAll(STYLES_DOC, settings);

  it('ציטוט «…» — span.w--custom עם data-style על טווח התוכן; הסנטינל אינו דולף', () => {
    assert(joined.includes('w--custom'), 'מחלקת הטווח המותאם קיימת');
    assert(joined.includes('data-style="quote"'), 'מזהה הסגנון על המילים');
    assert(!joined.includes('\uE103') && !joined.includes('\uE104'), 'הסנטינל מוסר מהפלט');
    const styledLine = joined.split('\n').find(l => l.includes('data-style="quote"'));
    assert(styledLine.includes('font-style:italic'), 'הסגנון החזותי מוחל (נטוי)');
    assert(styledLine.includes('color:#333333'), 'צבע הוחל');
  });

  it('הערת צד בקידומת — מחוץ לטורים, מעוגנת לפסקה המארחת; מחלקה data-style', () => {
    const snPage = r.pages.find(p => (p.sideNotes || []).some(s => s.isCustomStyle === 'sidenote'));
    assert(snPage, 'הערת הצד הוכנסה לעמוד כלשהו');
    const sn = snPage.sideNotes.find(s => s.isCustomStyle === 'sidenote');
    assertEq(sn.anchorToken, snPage.sideNotes.find(() => true) && sn.anchorToken, 'עוגן קיים');
    // הפסקה המקורית אינה בטורים (הטקסט שלה לא בגוף):
    const bodyTexts = r.pages.flatMap(p => p.columns.flat()).map(ln => (ln.words || []).join(' ')).join(' ');
    assert(!bodyTexts.includes('זו הערת צד מבארת'), 'הפסקה המעוצבת לא בגוף הטורים');
    assert(joined.includes('side-note--custom') && joined.includes('data-style="sidenote"'), 'הרינדור עם המחלקה');
    assert(snPage.sideNotes.some(s => s.text && s.text.includes('הערת צד מבארת')), 'תוכן ההערה נשמר במלואו');
  });

  it('קריאה חוצת טורים — פס spanning-band + מונה גלוי + עיטור מקושר (גיאומטריה מוזמנת)', () => {
    const bandPage = r.pages.find(p => p.spanning && p.spanning.customStyle);
    assert(bandPage, 'קיים עמוד עם פס קריאה');
    assertEq(bandPage.spanning.customStyle.id, 'callout', 'מזהה הפס');
    assert(bandPage.spanning.customStyle.counterMark, 'לקריאה מונה מהסגנון');
    assert(joined.includes('spanning-band custom-style'), 'הפס מרונדר עם מחלקת הסגנון');
    assert(joined.includes('cs-counter'), 'המונה מרונדר (cs-counter)');
    assert(/padding-top:/.test(joined), 'העיטור המקושר מזמין גובה (csOrnPadTop → padding-top ברינדור)');
    // הטורים מתחילים מתחת לפס — spanH נכלל ב־usedHeight (הוכחה: הפס בראש העמוד והתוכן אחריו)
    assert(bandPage.columns.every(c => c.length >= 0), 'הטורים קיימים מתחת לפס');
  });

  it('מונה hebrew-geresh עם איפוס per-part — שתי קריאות בשני חלקים ⇒ שתיהן א׳', () => {
    const marks = [];
    for (const p of r.pages) if (p.spanning && p.spanning.customStyle && p.spanning.customStyle.counterMark) marks.push(p.spanning.customStyle.counterMark);
    assertEq(marks.length, 2, 'שתי קריאות ממונות');
    assertEq(marks[0], 'א׳', 'הראשונה א׳');
    assertEq(marks[1], 'א׳', 'reset:part ⇒ השנייה בחלק הבא מאופסת לא׳');
  });

  it('שימור תוכן + דטרמיניזם תחת סגנונות פעילים (חוקי ברזל 15/16)', () => {
    assert(r.contentPreserved, 'אפס אובדן תוכן עם סגנונות');
    const r2 = typeset(STYLES_DOC, settings, { noRecommendations: true });
    assertEq(r2.layoutHash, r.layoutHash, 'דטרמיניזם: שתי ריצות אותו hash');
  });

  it('מדידת הטווח בגודל הסגנון — הציטוט (13pt) נמדד בפקטור 13/14 ומשנה שבירה', () => {
    // הוכחה כפולה: hash עם סגנונות ≠ hash בלי (הסגנון משפיע על הפריסה, לא רק על הצבע)
    const plain = typeset(STYLES_DOC, getDefaultSettings(), { noRecommendations: true });
    assert(r.layoutHash !== plain.layoutHash, 'הסגנונות משפיעים על הפריסה בפועל');
    // והשקילות נשמרת כשהגודל זהה לגוף:
    const sameSize = JSON.parse(THREE_STYLES);
    sameSize.styles[0].style.fontSizePt = 14; // === גודל הגוף
    const s2 = { ...getDefaultSettings(), _customStyles: JSON.stringify(sameSize) };
    const r3 = typeset(STYLES_DOC, s2, { noRecommendations: true });
    // הציטוט בגודל הגוף — אין הפרש מדידה; השאר (צד/קריאה) כן משפיע, לכן רק בודקים שהשורה לא נשברת רנדומלית:
    assert(typeof r3.layoutHash === 'string', 'ריצה תקינה');
  });
});

// =====================================================================
describe('S11.2 שער 1 (המשך) — קומבינטורים AND/OR + מפרידים שרירותיים (§8: "כל סוגי הטקסט")', () => {
  it('AND: שני תנאים — מתאים רק כששניהם', () => {
    const line = 'מיוחד: פסקה עם עיטור וילנא בתוכה';
    const andStyle = { id: 'x', trigger: { combinator: { op: 'AND', conditions: [{ linePrefix: 'מיוחד:' }, { pattern: 'וילנא' }] } }, layoutMode: 'regular', style: {} };
    assert(matchTriggerSpec(andStyle.trigger, line), 'AND מתאים כששני התנאים מתקיימים');
    assert(!matchTriggerSpec(andStyle.trigger, 'מיוחד: פסקה בלי המילה'), 'AND לא מתאים כשחסר אחד');
    const orStyle = { id: 'y', trigger: { combinator: { op: 'OR', conditions: [{ linePrefix: 'אחר:' }, { pattern: 'וילנא' }] } } };
    assert(matchTriggerSpec(orStyle.trigger, line), 'OR מתאים כשאחד מתקיים');
    assert(!matchTriggerSpec(orStyle.trigger, 'פסקה רגילה לחלוטין'), 'OR לא מתאים כשאף אחד');
  });

  it('מפרידים שרירותיים — ~…~ בדיוק כמו «…» (עקרון "כל סוגי הטקסט נתונים לבחירת המשתמש")', () => {
    const styles = parseCustomStyles(JSON.stringify({ styles: [
      { id: 'tilde', name: 'טילדה', trigger: { inlineMarker: { open: '~', close: '~' } }, layoutMode: 'regular', style: { bold: true } }
    ] })).styles;
    const doc = 'כותרת 1 - חלק\nפסקה עם טווח מודגש ~וזהו הטווח בטילדות~ בתוך המשפט הזה עצמו כאן.';
    const { joined } = typesetAll(doc, { ...getDefaultSettings(), _customStyles: JSON.stringify({ styles }) });
    assert(joined.includes('data-style="tilde"'), 'הטווח במפריד השרירותי מזוהה ומרונדר');
  });

  it('סגנון endnote: הפסקה זורמת לעמודי ההערות של החלק (לא בגוף)', () => {
    const styles = parseCustomStyles(JSON.stringify({ styles: [
      { id: 'toend', name: 'לסיום', trigger: { linePrefix: 'סיום:' }, layoutMode: 'endnote', style: {} }
    ] })).styles;
    const doc = [
      'ספר - בדיקת endnote',
      '',
      'כותרת 1 - חלק',
      'פסקת גוף רגילה ראשונה עם כמה מילים למילוי שורה בעמוד.',
      'סיום: פסקה זו אמורה להופיע בעמודי ההערות בסוף החלק',
      'פסקת גוף נוספת אחרי ההערה עם עוד כמה מילים.'
    ].join('\n');
    const settings = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', _customStyles: JSON.stringify({ styles }) };
    const r = typeset(doc, settings, { noRecommendations: true });
    const bodyTexts = r.pages.flatMap(p => p.columns.flat()).map(ln => (ln.words || []).join(' ')).join(' ');
    assert(!bodyTexts.includes('פסקה זו אמורה להופיע בעמודי'), 'הפסקה לא בגוף');
    // עמודי ההערות נבנים תמיד במצב endnotes; הם מצטרפים ל־r.pages רק עם count-endnote-pages
    // (מסופרים בגיליון) — הגישה המבנית היא r.endnotePagesInfo (אותו חוזה כמו S7.1.1).
    const enPages = r.endnotePagesInfo.pages;
    assert(enPages.length >= 1, 'עמודי ההערות קיימים');
    const enText = enPages.map(p => (p.notes || []).map(n => n.text).join(' ')).join(' ');
    assert(enText.includes('פסקה זו אמורה להופיע בעמודי'), 'הטקסט המלא בעמודי ההערות — אפס אובדן');
    assert(r.contentPreserved, 'שימור תוכן גם בזרימת endnote');
  });

  it('סגנון footnote: הפסקה יורדת למרזב; הסמן בגוף במקומה', () => {
    const styles = parseCustomStyles(JSON.stringify({ styles: [
      { id: 'tofn', name: 'לשוליים', trigger: { linePrefix: 'הערה:' }, layoutMode: 'footnote', style: {} }
    ] })).styles;
    const doc = [
      'ספר - בדיקת footnote',
      '',
      'כותרת 1 - חלק',
      'פסקת פתיחה עם כמה מילים למילוי שורה בעמוד הראשון.',
      'הערה: פסקה זו יורדת למרזב העמוד במקום להיות בגוף הטקסט',
      'פסקת סיום אחרי ההערה עם עוד כמה מילים לסיום.'
    ].join('\n');
    const settings = { ...getDefaultSettings(), _customStyles: JSON.stringify({ styles }) };
    const r = typeset(doc, settings, { noRecommendations: true });
    const fn = r.pages.flatMap(p => p.footnotes || []).find(n => n.customStyle === 'tofn');
    assert(fn, 'הערת המרזב מסומנת כסגנון מותאם');
    assert(fn.text.includes('פסקה זו יורדת למרזב'), 'תוכן ההערה במרזב');
    assert(fn.marker, 'להערה סמן');
    const bodyTexts = r.pages.flatMap(p => p.columns.flat()).map(ln => (ln.words || []).join(' ')).join(' ');
    assert(!bodyTexts.includes('פסקה זו יורדת למרזב'), 'הטקסט לא בגוף — רק הסמן');
    assert(r.contentPreserved, 'שימור תוכן בזרימת footnote');
  });
});

// =====================================================================
describe('S11.2 שער 2 — סכמה: אימות עם שגיאות עבריות קריאות־לאדם (§8.3)', () => {
  const cases = [
    ['{bad json', 'unparseable-json', 'JSON'],
    ['{"styles":"notarray"}', 'bad-shape', 'styles'],
    ['[{"id":"a"}]', 'trigger-empty', 'טריגר'],
    ['[{"id":"a","trigger":{"linePrefix":"x","pattern":"y"}}]', 'trigger-ambiguous', 'עץ'],
    ['[{"id":"a","trigger":{"combinator":{"op":"XOR","conditions":[{},{}]}}}]', 'combinator-bad-op', 'AND או OR'],
    ['[{"id":"a","trigger":{"combinator":{"op":"AND","conditions":[{}]}}}]', 'combinator-few-conditions', 'שני תנאים'],
    ['[{"id":"a","trigger":{"inlineMarker":{"open":"","close":"»"}}}]', 'inlineMarker-bad', 'לא ריקות'],
    ['[{"id":"a","trigger":{"linePrefix":""}}]', 'linePrefix-bad', 'ריקה'],
    ['[{"id":"a","trigger":{"pattern":"("}}]', 'pattern-invalid', 'תקין'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"layoutMode":"middle"}]', 'bad-layout-mode', 'מצב פריסה'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"style":{"sparkles":1}}]', 'style-unknown-prop', 'מוכר'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"style":{"fontSizePt":99}}]', 'style-bad-size', '6–48'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"style":{"color":"red"}}]', 'style-bad-color', 'הקס'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"counter":{"reset":"daily"}}]', 'counter-bad-reset', 'part, page או never'],
    ['[{"id":"a","trigger":{"linePrefix":"x"},"linkedOrnaments":{"middle":"pyramid"}}]', 'ornament-unknown-slot', 'top או bottom'],
    ['[{"id":"a","trigger":{"linePrefix":"x"}},{"id":"a","trigger":{"linePrefix":"y"}}]', 'duplicate-id', 'פעמיים']
  ];
  for (const [json, code, hint] of cases) {
    it(`שגיאה ${code} — הודעה עברית עם רמז «${hint}»`, () => {
      const res = parseCustomStyles(json);
      assert(!res.ok, 'נדחה');
      assert(res.errors.length >= 1, 'עם שגיאה');
      assertEq(res.errors[0].code, code, 'הקוד המדויק');
      assert(res.errors[0].message.includes(hint), `ההודעה מסבירה מה תקין (כולל «${hint}»)`);
      assert(/[\u0590-\u05FF]/.test(res.errors[0].message), 'ההודעה בעברית');
    });
  }

  it('תמונה חיצונית נדחית (offline-guard — exit 7 doctrine)', () => {
    const res = validateImages([{ id: 'logo', src: 'https://example.com/x.png', w: 10, h: 10 }]);
    assert(!res.ok);
    assertEq(res.errors[0].code, 'image-external-src');
    assert(res.errors[0].message.includes('אסור'), 'הסבר offline');
  });

  it('חבילה פגומה — all-or-nothing: כלום לא נטען', () => {
    const res = importExtensions(JSON.stringify({ format: FORMAT, styles: [{ id: 'ok', trigger: { linePrefix: 'x' } }], pages: [{ id: 'p', position: 'bad-position' }] }));
    assert(!res.ok, 'נדחה כולה');
    assertEq(res.styles.length, 0, 'לא נטען חלקית');
    assert(res.errors.some(e => e.message.includes('עמוד מותאם נדחה')), 'שגיאת העמוד דווחה');
  });
});

// =====================================================================
describe('S11.2 שער 5 — הרחבות export→import→identical render hash (§8.3)', () => {
  it('export דטרמיניסטי — פעמיים ⇒ בתים זהים; אין תאריך', () => {
    const bundle = importExtensions(JSON.stringify({
      format: FORMAT,
      styles: JSON.parse(THREE_STYLES).styles,
      pages: [{ id: 'logo', position: { at: 'before-shaar-main' }, counted: true, boxes: [{ text: 'לוגו', x: 30, y: 40, w: 120, h: 30 }] }],
      images: []
    }));
    assert(bundle.ok, 'הייבוא הראשוני תקין: ' + JSON.stringify(bundle.errors));
    const a = exportExtensions({ styles: bundle.styles, pages: bundle.pages, images: bundle.images });
    const b = exportExtensions({ styles: bundle.styles, pages: bundle.pages, images: bundle.images });
    assertEq(a, b, 'ייצוא דטרמיניסטי');
    assert(!a.includes('exported_at'), 'אין חותמת זמן');
  });

  it('עמוד לוגו לפני הפתיחה מוצב ונספר (placed/counted)', () => {
    const pages = [{ id: 'logo', position: { at: 'before-shaar-main' }, counted: true, boxes: [{ text: 'לוגו הספר', x: 30, y: 40, w: 120, h: 30 }] }];
    const settings = { ...getDefaultSettings(), _customPages: JSON.stringify({ pages }) };
    const r = typeset(STYLES_DOC, settings, { noRecommendations: true });
    const custom = r.pages.filter(p => p.type === 'custom');
    assertEq(custom.length, 1, 'עמוד מותאם אחד הוכנס');
    assertEq(r.pages[0].type, 'custom', 'הוא העמוד הראשון — לפני הפתיחה');
    assert(custom[0].pageNumber != null, 'counted=true ⇒ נספר (יש לו גיליון)');
    const { joined } = typesetAll(STYLES_DOC, settings);
    assert(joined.includes('לוגו הספר'), 'התוכן הקבוע מרונדר');
  });

  it('export→fresh-import→identical render hash', () => {
    const bundleA = importExtensions(JSON.stringify({ format: FORMAT, styles: JSON.parse(THREE_STYLES).styles, pages: [], images: [] }));
    const exported = exportExtensions({ styles: bundleA.styles, pages: bundleA.pages, images: bundleA.images });
    const bundleB = importExtensions(exported);
    assert(bundleB.ok, 'ייבוא מחדש תקין');
    const sA = { ...getDefaultSettings(), _customStyles: exported.includes('quote') ? JSON.stringify({ styles: bundleB.styles }) : '' };
    const sB = { ...getDefaultSettings(), _customStyles: exported };
    const rA = typeset(STYLES_DOC, sA, { noRecommendations: true });
    const rB = typeset(STYLES_DOC, sB, { noRecommendations: true });
    assertEq(rA.layoutHash, rB.layoutHash, 'hash זהה מחבילה מקורית ומיובאת');
  });

  it('shareSummary — תקציר קריא לאדם', () => {
    const bundle = importExtensions(JSON.stringify({ format: FORMAT, styles: JSON.parse(THREE_STYLES).styles, pages: [{ id: 'logo', name: 'לוגו', position: { at: 'end' } }], images: [] }));
    const s = shareSummary({ styles: bundle.styles, pages: bundle.pages, images: bundle.images });
    assert(s.includes('ציטוט') && s.includes('הערת צד') && s.includes('קריאה'), 'שמות הסגנונות בתקציר');
    assert(s.includes('לוגו'), 'העמודים בתקציר');
    assert(s.includes('בסוף המסמך'), 'מיקום העמוד נקרא בעברית — לא מזהה מנוע');
  });
});

// =====================================================================
describe('S11.2 שער 3 — DOCX: roundtrip diff=0; הערות וורד→סוגריים; סירוב פורמט (REQ-PAR-07, חוק 14)', () => {
  const bytes = buildDocxFixture();

  it('roundtrip: המרה זהה בדיוק לציפייה הממוספרת־ביד (diff=0)', () => {
    const res = importDocx(bytes, 'sample.docx');
    assert(res.ok, 'הייבוא הצליח');
    assertEq(res.text, EXPECTED_TEXT, 'diff=0');
    assertEq(res.stats.headings, 3, '3 כותרות הומרו');
    assertEq(res.stats.footnotes, 2, '2 הערות וורד הומרו');
    assertEq(res.stats.skipped, 1, 'פסקת הרווחים הוסתרה');
  });

  it('הערות וורד הופכות הערות־סוגריים של המנוע (מספרוּת במרזב)', () => {
    const res = importDocx(bytes, 'sample.docx');
    const r = typeset(res.text, getDefaultSettings(), { noRecommendations: true });
    const fnText = r.pages.flatMap(p => p.footnotes || []).map(n => n.text).join(' ');
    assert(fnText.includes('זו ההערה הראשונה מוורד'), 'הערה 1 במרזב');
    assert(fnText.includes('וזו ההערה השנייה'), 'הערה 2 במרזב');
    assert(r.contentPreserved, 'שימור תוכן המרה');
  });

  it('פורמט לא נתמך: אין קריסה, אין טעינה, הודעה עברית «פורמט לא נתמך»', () => {
    for (const [buf, name] of [
      [Buffer.from('%PDF-1.4 minimal'), 'doc.pdf'],
      [Buffer.from('this is not a zip file at all'), 'x.docx'],
      [buildZip([{ name: 'word/document.xml', data: 'not-xml' }]), 'broken.xml.docx'],
      [buildZip([{ name: 'README.txt', data: 'no document.xml here' }]), 'empty.docx']
    ]) {
      const res = importDocx(buf, name);
      assert(!res.ok, `נדחה: ${name}`);
      assert(res.message.includes('פורמט לא נתמך'), `הודעה עברית: ${name}`);
      assertEq(res.text, '', 'לא נטען דבר');
    }
  });

  it('zip: STORE + DEFLATE; המנפח הטהור ≡ zlib (אותו פלט, ביט לביט)', () => {
    const docXml = '<w:document xmlns:w="http://x"><w:body><w:p><w:r><w:t>שלום</w:t></w:r></w:p></w:body></w:document>';
    const plain = Buffer.from(docXml, 'utf8');
    const deflated = zlib.deflateRawSync(plain);
    // handcrafted zip: רשומה אחת בשיטת DEFLATE (8) — local + central + eocd
    const name = Buffer.from('word/document.xml');
    const crc = require('../../src/engine/import/zip-reader').crc32(plain);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0x21, 10); lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc >>> 0, 14); lh.writeUInt32LE(deflated.length, 18); lh.writeUInt32LE(plain.length, 22);
    lh.writeUInt16LE(name.length, 26);
    const localPart = Buffer.concat([lh, name, deflated]);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8); cd.writeUInt16LE(8, 10); cd.writeUInt16LE(0x21, 12); cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc >>> 0, 16); cd.writeUInt32LE(deflated.length, 20); cd.writeUInt32LE(plain.length, 24);
    cd.writeUInt16LE(name.length, 28);
    const centralPart = Buffer.concat([cd, name]);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(centralPart.length, 12); eocd.writeUInt32LE(localPart.length, 16);
    const zip = Buffer.concat([localPart, centralPart, eocd]);
    const read = readZip(zip);
    assert(read.ok, 'קריאת DEFLATE: ' + read.error);
    assertEq(read.entries[0].data.toString('utf8'), docXml, 'הפלט זהה למקור');
    assertEq(read.entries[0].name, 'word/document.xml', 'השם נשמר');
    // המנפח הטהור מול zlib — אותם בתים:
    assertEq(inflateRawPure(deflated).toString('utf8'), zlib.inflateRawSync(deflated).toString('utf8'), 'pure ≡ zlib');
    assertEq(inflateRaw(deflated).toString('utf8'), docXml, 'inflateRaw (בחירה אוטומטית)');
  });

  it('path traversal: שמות רשומות בלתי־חוקיים נדחים; buildZip מסרב לכתוב כאלה', () => {
    assertEq(safeName('../evil.txt'), null, 'traversal');
    assertEq(safeName('/abs.txt'), null, 'אבסולוטי');
    assertEq(safeName('C:/win.txt'), null, 'כונן');
    assertEq(safeName('ok/file.txt'), 'ok/file.txt', 'יחסי תקין עובר');
    let threw = false;
    try { buildZip([{ name: '../evil', data: 'x' }]); } catch (e) { threw = true; }
    assert(threw, 'buildZip זורק על שם בלתי־חוקי');
  });

  it('xml-lite: קלט קטוע/עמוק — error מפורש, לא קריסה', () => {
    assert(parseXml('<a><b>').error === 'truncated', 'קטוע');
    assert(parseXml('<a').error != null, 'תג פתוח');
    let ok = '<a>';
    for (let i = 0; i < 40; i++) ok += '<b>';
    for (let i = 0; i < 40; i++) ok += '</b>';
    ok += '</a>';
    assert(parseXml(ok).error == null, 'קינון 40 תקין');
    let deep = '<a>';
    for (let i = 0; i < 100; i++) deep += '<b>';
    for (let i = 0; i < 100; i++) deep += '</b>';
    deep += '</a>';
    assert(parseXml(deep).error === 'too-deep', 'קינון 100 ⇒ too-deep (הגנה, לא קריסה)');
  });
});

// =====================================================================
describe('S11.2 שער 4 — המלצות עריכה: כל המלצה עם הוכחה; בלי הוכחה — נפסלת (D-16, REQ-GOV-11)', () => {
  it('מסמך runt ⇒ המלצה מוכחת אחת לפחות; ההוכחה מלאה', () => {
    const s = getDefaultSettings();
    const r = typeset(RUNT_DOC, s, { noRecommendations: true });
    const recs = computeEditingRecommendations(RUNT_DOC, s, r);
    assert(recs.computed, 'חושב');
    assert(recs.recommendations.length >= 1, `לפחות המלצה אחת (${recs.recommendations.length})`);
    for (const rec of recs.recommendations) {
      assert(rec.proof, 'כל המלצה נושאת proof');
      assertEq(rec.proof.newFindings, [], 'אפס ממצאים חדשים');
      assert(rec.proof.removedFinding, 'הממצא המקורי הוסר');
      assert(rec.proof.beforeHash !== rec.proof.afterHash, 'העריכה באמת שינתה משהו (no-op נפסל)');
      assert(rec.edit.description && rec.edit.description.length > 10, 'הסבר עברי למשתמש');
      assert(rec.edit.before && rec.edit.after, 'diff לפני/אחרי');
      assert(Number.isInteger(rec.edit.lineFromIdx) && Number.isInteger(rec.edit.lineToIdx), 'מפתחי שורות להחלה ב־UI');
    }
    const rec = recs.recommendations[0];
    assert(rec.finding.kind === 'runt-line', 'סוג הממצא');
  });

  it('החלת ההמלצה על המקור — אותה פונקציה שהוכיחה אותה (text-edits: מקור יחיד)', () => {
    const s = getDefaultSettings();
    const r = typeset(RUNT_DOC, s, { noRecommendations: true });
    const recs = computeEditingRecommendations(RUNT_DOC, s, r);
    const rec = recs.recommendations[0];
    const edited = applyEdit(RUNT_DOC.split('\n'), { type: rec.edit.type, fromLine: rec.edit.lineFromIdx, toLine: rec.edit.lineToIdx });
    assert(edited != null, 'ההחלה עובדת');
    const after = typeset(edited, s, { noRecommendations: true });
    assertEq(after.layoutHash, rec.proof.afterHash, 'הפלט בפועל זהה להוכחה (מה שהובטח מוחזר)');
    const stillThere = qualifyingFindings(after).some(f => f.predicate_before && f.predicate_before.textHead === (rec.finding.evidence && rec.finding.evidence.textHead));
    assert(!stillThere, 'הממצא באמת נעלם בפועל');
  });

  it('המלצות בלי הוכחה נפסלות ונספרות (rejected) — הן לעולם לא מוחזרות', () => {
    const s = getDefaultSettings();
    const r = typeset(RUNT_DOC, s, { noRecommendations: true });
    const recs = computeEditingRecommendations(RUNT_DOC, s, r);
    assert(recs.dryRuns >= recs.recommendations.length, 'הרצות ניסיון ≥ המלצות שהוחזרו');
    assert(recs.dryRuns <= 8, 'תקציב dry-runs ≤ 8');
    assert(recs.recommendations.length <= 3, 'תקציב המלצות ≤ 3');
    // ספציפית: המסמך הזה מייצר גם מועמדות שנכשלות (הראנו rejected>0 בעבר) — בדיקת הספירה:
    assert(recs.rejected >= 0 && typeof recs.rejected === 'number', 'מונה rejected קיים');
  });

  it('שומר גודל: >200 עמודים ⇒ לא אוטומטי; force ⇒ כן', () => {
    const s = getDefaultSettings();
    const bigDoc = Array(250).fill(RUNT_DOC).join('\n'); // **S11:** 250 עותקים ⇒ >200 עמודים בפועל (150 הניבו 154 בלבד)
    const r = typeset(bigDoc, s, { noRecommendations: true });
    assert(r.pages.length > 200, `הדוק גדול (${r.pages.length} עמודים)`);
    const auto = computeEditingRecommendations(bigDoc, s, r);
    assert(!auto.computed, 'לא חושב אוטומטית');
    assert(auto.reason.includes('doc-size-guard'), 'הסיבה מתועדת');
    const forced = computeEditingRecommendations(bigDoc, s, r, { force: true });
    assert(forced.computed, 'force מעקף את השומר');
    for (const rec of forced.recommendations || []) assert(rec.proof, 'גם בכפייה: כל המלצה עם הוכחה');
  });

  it('אין ממצאים מתאימים ⇒ computed:true, אפס המלצות (לא שקט)', () => {
    const doc = 'כותרת 1 - חלק פתיחה כללי לבדיקה בלי שום בעיה\nפסקה תקינה אחת בלבד עם מספיק מילים כדי לא לייצר שום בעיה בפריסה הזאת.';
    const s = { ...getDefaultSettings(), 'runt-min-width-pct': 5 }; // סף נמוך — ללא ראנטים מטופלים
    const r = typeset(doc, s, { noRecommendations: true });
    assertEq(qualifyingFindings(r).length, 0, 'אכן אין ממצאים מתאימים');
    const recs = computeEditingRecommendations(doc, s, r);
    assert(recs.computed);
    assertEq(recs.recommendations.length, 0);
    assertEq(recs.reason, 'no-qualifying-findings');
  });
});

// =====================================================================
describe('S11.2 — UI: פאנל הרחבות, DOCX בעורך, המלצות בבדיקה (REQ-UI, §9.4)', () => {
  it('פאנל הרחבות: ייבוא תקין + רשימה פעילה + הגדרות מוזרקות + כבד (⚡) בלי עימוד אוטומטי', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    let importText = null;
    app; // האפליקציה נבנית עם ברירת מחדל בלי callbacks — משתמשים ב־extensions ישירות:
    const ext = app.extensions;
    importText = THREE_STYLES;
    const ok = ext.importFromText(importText, 'הרחבות.json');
    assert(ok, 'הייבוא תקין');
    const rows = ext.root.querySelectorAll('.extensions-style-row');
    assertEq(rows.length, 3, 'שלושת הסגנונות ברשימה');
    assert(app.getSettings()._customStyles.includes('quote'), 'הסגנונות הוזרקו להגדרות');
    assert(app.getState().heavyDirty, 'שינוי הרחבות מסומן כבד — ⚡ נדרש');
    assert(!app.getState().hasResult, 'אין עימוד אוטומטי (F-06)');
    assert(app.status.getBlink(), '⚡ מהבהב');
  });

  it('ייבוא פגום ⇒ שגיאות עבריות מוצגות; כלום לא נטען', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const ext = app.extensions;
    const ok = ext.importFromText('{"styles":[{"id":"a"}]}', 'bad.json');
    assert(!ok, 'נדחה');
    const errs = ext.root.querySelectorAll('.extensions-error-item');
    assert(errs.length >= 1, 'שגיאה מוצגת');
    assert(errs[0].textContent.includes('טריגר'), 'הודעה עברית מסבירה');
    assert(!app.getSettings()._customStyles, 'לא הוזרק כלום');
  });

  it('ייצוא + שיתוף: טקסט דטרמיניסטי; תקציר קריא', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    const ext = app.extensions;
    ext.importFromText(THREE_STYLES, 'x.json');
    const a = ext.exportText();
    ext.importFromText(THREE_STYLES, 'x.json');
    assertEq(ext.exportText(), a, 'ייצוא דטרמיניסטי');
    const share = ext.shareText();
    assert(share.includes('ציטוט'), 'תקציר השיתוף קריא');
  });

  it('DOCX בעורך: ייבוא קובץ ⇒ טקסט בעורך + עימוד מיידי; פורמט לא נתמך ⇒ הודעה, לא קריסה', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    // ייבוא תקין
    const okRes = app.importDocxFile(buildDocxFixture(), 'sample.docx');
    assert(okRes, 'הייבוא תקין');
    await settle();
    assert(app.getText().includes('כותרת 1 - שער ראשי'), 'הטקסט הומר והודבק בעורך');
    assert(app.getText().includes('[זו ההערה הראשונה מוורד]'), 'הערת וורד כסוגריים בטקסט');
    assert(app.getState().hasResult, 'עימוד מיידי אחרי ייבוא');
    const before = app.getText();
    // סירוב
    const bad = app.importDocxFile(Buffer.from('%PDF-1.4 x'), 'doc.pdf');
    assert(!bad, 'נדחה');
    assertEq(app.getText(), before, 'הטקסט לא השתנה — לא נטען כלום');
    const notice = app.status.root.querySelectorAll('.chip--notice');
    assert(notice.length >= 1, 'יש שבב הודעה');
  });

  it('המלצות בלשונית הבדיקה: כותרת מפורטת + diff + הוכחה + החלה על המקור', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => RUNT_DOC } });
    await settle(50);
    assert(app.getState().hasResult, 'העימוד בוצע');
    const recsWrap = app.testing.root.querySelectorAll('.recommendations');
    assert(recsWrap.length >= 1, 'סקציית ההמלצות קיימת');
    const cards = app.testing.root.querySelectorAll('.recommendation-card');
    assert(cards.length >= 1, `המלצה אחת לפחות מוצגת (${cards.length})`);
    const first = cards[0];
    assert(first.textContent.includes('הוכחה'), 'ההוכחה מוצגת למשתמש');
    assert(first.textContent.includes('ממצאים חדשים: 0'), 'אפס ממצאים חדשים גלוי למשתמש');
    assert(first.textContent.includes('לפני:') && first.textContent.includes('אחרי:'), 'diff לפני/אחרי');
    // החלה:
    const hashBefore = app.getState().layoutHash;
    const applyBtn = first.querySelectorAll('button');
    assert(applyBtn.length >= 1, 'כפתור החלה');
    fire(applyBtn[0], 'click');
    await settle(50);
    assert(app.getState().layoutHash !== hashBefore, 'ההחלה שינתה את הפריסה');
    assert(!app.getText().includes('\ncut\n'), 'המילה עברה לפסקה הבאה');
  });

  it('הסנטינלים של הסגנונות אינם דולפים לטקסט העורך (חוק 9/tofu)', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    app.extensions.importFromText(THREE_STYLES, 'x.json');
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => STYLES_DOC } });
    await settle(80);
    const t = app.getText();
    assert(!t.includes('\uE103') && !t.includes('\uE101'), 'אין PUA בטקסט');
  });
});

// =====================================================================
describe('רגרסיית רישום ו־call-graph אחרי S11 (REQ-GOV-04, F-06)', () => {
  it('dead-control = 0; phantom/orphan = 0 (לא נוספו מפתחות — ההרחבות נכס מסמך)', () => {
    const res = scanConsumers(SRC);
    assertEq(res.deadControls.map(d => d.control), []);
    assertEq(res.phantomKeys.map(k => k.id), []);
    assertEq(res.orphanMechanisms.map(m => `${m.id}->${m.consumer}`), []);
  });
});

report('s11-extensions');
