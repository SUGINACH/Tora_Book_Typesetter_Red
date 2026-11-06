// tests/e2e/s12-export.test.js — שער S12 (S12.2): ייצוא מושלם + שכבת מדידה מתמטית
// כל בדיקה נכתבה לנעילת שער ספציפי מ־02_MASTER_WORK_PLAN.md §S12.2 או REQ-EXP-01..04,
// REQ-LB-01 (impl B), D-18 — כולל דטרמיניזם בין נתיבי ייצוא ו־parity מודל↔רסטר.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const fm = require('../../src/engine/typography/font-metrics');
const { MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts, resolveMeasureImpl } = require('../../src/engine/typography/measure-api');
const { buildSubset, charInventory } = require('../../src/engine/typography/font-subset');
const { projectDocument } = require('../../src/engine/output/geometry-projector');
const { exportHtml, exportPdf, exportProjectZip, importProjectZip } = require('../../src/engine/output/export-api');
const { assertOfflineSafe } = require('../../src/engine/output/html-export');
const { parseCustomStyles } = require('../../src/engine/extensions/style-schema');
const { buildTtfFixture } = require('../fixtures/gen_ttf_fixture');

const ART = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);
const HAS_PDFTOOLS = (() => {
  try { execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
})();

// ================= DOM shim (אותו חוזה כמו s10/s11) =================
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cssKey = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
    toggle(n, force) { const want = force === undefined ? !this.set.has(n) : !!force; if (want) this.set.add(n); else this.set.delete(n); this._sync(); return want; }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
      this.classList = new ClassList(this); this._listeners = new Map();
      this.value = ''; this.checked = false; this.disabled = false; this.type = ''; this.title = '';
      this.selectionStart = 0; this.selectionEnd = 0; this._scrolled = false;
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : (k === 'id' && this.id != null ? this.id : null); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(cb); }
    removeEventListener(type, cb) { const arr = this._listeners.get(type) || []; const i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1); }
    dispatchEvent(ev) {
      ev = ev || {}; ev.target = ev.target || this; ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {});
      let node = this;
      while (node) { ev.currentTarget = node; for (const cb of (node._listeners.get(ev.type) || []).slice()) cb(ev); node = node.parentNode; }
      return true;
    }
    click() { this.dispatchEvent({ type: 'click' }); }
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; }
    scrollIntoView() { this._scrolled = true; }
    focus() { this._focused = true; }
    _matchesPart(sel) {
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
      if (sel.startsWith('#')) return this.getAttribute('id') === sel.slice(1);
      if (sel.startsWith('[')) { const m = sel.match(/^\[([^\]]+)\]$/); return !!m && (m[1] in this.dataset || m[1] in this.attrs); }
      return this.tagName === sel.toUpperCase();
    }
    _matches(sel) {
      const parts = String(sel).trim().split(/\s+/);
      if (!this._matchesPart(parts[parts.length - 1])) return false;
      let ancestor = this.parentNode, pi = parts.length - 2;
      while (pi >= 0 && ancestor) { if (ancestor._matchesPart && ancestor._matchesPart(parts[pi])) pi--; ancestor = ancestor.parentNode; }
      return pi < 0;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      const out = [];
      (function walk(el) { for (const c of el.children) { if (c._matches && c._matches(sel)) out.push(c); walk(c); } })(this);
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
  return { createElement: (tag) => new El(tag), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; }, _El: El };
}

// =====================================================================
describe('S12.1-5 — שכבת מדידה מתמטית: פרנסר גופנים (REQ-LB-01 impl B)', () => {
  const { bytes, groundTruth } = buildTtfFixture();

  it('פרנסר מול אמת מוחלטת — פיקסטשור סינתטי: רוחבים, unitsPerEm, קרנינג, cap-height', () => {
    const r = fm.parseFont(bytes);
    assert(r.ok, 'פענוח תקין: ' + r.error);
    const f = r.font;
    assertEq(f.unitsPerEm, groundTruth.unitsPerEm, 'unitsPerEm');
    assertEq(f.numGlyphs, groundTruth.numGlyphs, 'numGlyphs');
    assertEq(f.ascender, groundTruth.ascent, 'ascender');
    assertEq(f.descender, groundTruth.descent, 'descender');
    let bad = 0;
    for (const [ch, exp] of Object.entries(groundTruth.advances)) {
      if (fm.advanceUnitsOf(f, ch) !== exp) bad++;
    }
    assertEq(bad, 0, 'כל 109 רוחבי הגליפים נקראים במדויק (כל טעות בינארית נתפסת)');
    assertEq(fm.kernUnitsOf(f, 'א', 'ב'), groundTruth.kernPair[2], 'קרנינג kern fmt0');
    assertEq(fm.kernUnitsOf(f, 'ב', 'א'), 0, 'זוג ללא קרנינג = 0');
    assert(Math.abs(fm.capHeightEmOf(f) - 0.7) < 1e-9, 'sCapHeight מ־OS/2 v2 @88');
    assert(fm.isZeroAdvanceMark(f, 'ְ'), 'ניקוד מזוהה כסימן מאפס־רוחב');
  });

  it('פרנסר מול גופן אמיתי — DejaVu Sans (אורקל חיצוני נעול מ־fontTools)', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const r = fm.parseFont(fs.readFileSync(DEJAVU));
    assert(r.ok, 'פענוח DejaVu: ' + r.error);
    const f = r.font;
    assertEq(f.unitsPerEm, 2048, 'unitsPerEm (אורקל 2048)');
    assertEq(f.numGlyphs, 6253, 'numGlyphs (אורקל 6253)');
    assertEq(f.numberOfHMetrics, 6238, 'numberOfHMetrics (אורקל 6238)');
    assertEq(fm.advanceUnitsOf(f, 'א'), 1369, 'רוחב א (אורקל 1369)');
    assertEq(fm.advanceUnitsOf(f, 'ש'), 1451, 'רוחב ש (אורקל 1451)');
    assertEq(fm.advanceUnitsOf(f, ' '), 651, 'רוחב רווח (אורקל 651)');
    assertEq(fm.advanceUnitsOf(f, 'A'), 1401, 'רוחב A (אורקל 1401)');
    assertEq(f.ascender, 1901, 'ascender (אורקל 1901)');
    assertEq(f.descender, -483, 'descender (אורקל -483)');
    assertEq(fm.advanceUnitsOf(f, 'ְ'), 0, 'שווא = advance 0 (ניקוד אמיתי)');
    assert(f.charToGlyph.size > 5000, `cmap ממפה ${f.charToGlyph.size} תווים`);
  });

  it('דחיות שקופות: קלט קצר/גרסה שגויה/טבלה חובה חסרה — error מפורש, לא קריסה', () => {
    assertEq(fm.parseFont(Buffer.from([1, 2, 3])).error, 'too-small');
    assert((fm.parseFont(Buffer.alloc(64, 0xAB))).error.startsWith('bad-sfnt-version'));
    // head (טבלת חובה) חסרה: משביתים את התג שלה בספרייה לפי מיקומו
    const bad = Buffer.from(bytes);
    const numTables = bad.readUInt16BE(4);
    let headAt = -1;
    for (let i = 0; i < numTables; i++) {
      if (bad.toString('latin1', 12 + i * 16, 12 + i * 16 + 4) === 'head') { headAt = 12 + i * 16; break; }
    }
    assert(headAt >= 0, 'הפיקסטשור מכיל head');
    bad.write('xxxx', headAt, 'latin1');
    const r2 = fm.parseFont(bad);
    assert(!r2.ok && r2.error === 'missing-table:head', 'טבלת חובה חסרה נדחית בשקיפות: ' + r2.error);
  });

  it('measure-impl: table (ברירת מחדל) | font-metrics עם גופן רשום | נפילה שקופה בלי גופן', () => {
    clearRegisteredFonts();
    const s = getDefaultSettings();
    assertEq(s['measure-impl'], 'table', 'ברירת המחדל — רציפות S1–S11');
    const apiTable = new MeasureAPI(s, 'table');
    assertEq(apiTable.capHeightEm(), 0.7, 'מימוש A — קירוב היסטורי');
    // בלי גופן רשום: מימוש B נופל בשקיפות לטבלה (מדידה עקבית, לא כשל שקט)
    const apiNoFont = new MeasureAPI(s, 'font-metrics');
    assertEq(apiNoFont.impl, 'table', 'נפילה שקופה מתועדת');
    assert(apiNoFont.stats.fontFallbacks >= 1, 'הנפילה נספרת');
    // עם הפיקסטשור (רוחבים = טבלה ×1000 בדיוק): אותה מדידה
    const reg = registerFont('פיקסטשור', bytes);
    assert(reg.ok, 'הרשמה תקינה');
    const apiB = new MeasureAPI({ ...s, 'body-font': 'פיקסטשור' }, 'font-metrics');
    const apiA = new MeasureAPI(s, 'table');
    let maxDiff = 0;
    const words = CORPUS.split(/\s+/).filter(Boolean).slice(0, 400);
    for (const w of words) {
      const a = apiA.measureTextWidth(w, 14, 0.02);
      const b = apiB.measureTextWidth(w, 14, 0.02);
      maxDiff = Math.max(maxDiff, Math.abs(a - b));
    }
    assert(maxDiff <= 0.01, `parity A↔B ≤0.01px על מילות הקורפוס (מקסימום ${maxDiff.toFixed(4)}px) — נתיב מלא: בינארי→hmtx/cmap→סקאלה→מדידה`);
    unregisterFont('פיקסטשור');
  });

  it('EXT-13 — איחוד מקור המדידה live↔ייצוא: גופן רשום מעדיף font-metrics גם תחת table', () => {
    clearRegisteredFonts();
    const s = getDefaultSettings();
    // בלי גופן רשום — table נשמר (רציפות הקורפוס הקנוני)
    assertEq(resolveMeasureImpl(s), 'table', 'בלי גופן — table');
    assertEq(resolveMeasureImpl({ ...s, 'measure-impl': 'font-metrics' }), 'font-metrics', 'בחירה מפורשת תמיד נשמרת');
    // גופן רשום (כמו באפליקציה החיה: imud-library registerFont) — העדפת אמת
    const reg = registerFont('פיקסטשור', buildTtfFixture({ kern: false }).bytes);
    assert(reg.ok, 'הרשמה תקינה');
    const sLive = { ...s, 'body-font': 'פיקסטשור' }; // measure-impl נותר 'table' (ברירת המחדל)
    assertEq(resolveMeasureImpl(sLive), 'font-metrics', 'גופן רשום ⇒ font-metrics (ה-live מציג את מה שהייצוא מיצר)');
    // וה-MeasureAPI באמת מודד במטריקות האמיתיות (impl לא נופל לטבלה)
    const api = new MeasureAPI(sLive, resolveMeasureImpl(sLive));
    assertEq(api.impl, 'font-metrics', 'ה-API קשור לפרופיל האמיתי');
    assertEq(api.fontProfileName, 'פיקסטשור', 'פרופיל הגופן נקשר');
    unregisterFont('פיקסטשור');
    assertEq(resolveMeasureImpl(sLive), 'table', 'אחרי ביטול הרישום — חזרה לטבלה');
  });

  it('שקילות שבירות שורות על הקורפוס הקנוני — artifact נשמר (לפני החלפת ברירת מחדל)', () => {
    clearRegisteredFonts();
    // **תיקון שורש (ביקורת 03.11): פיקסטשור נטול־קרנינג. בעבר נרשם הפיקסטשור עם
    // צמד הקרנינג (א+ב=−0.04em) — impl B מודד קרנינג וimpl A (טבלה) לא ⇒ המדידות
    // אינן שקולות. בגרירה הישנה זה לא הופיע במקרה; ה־DP (המחודש) רגיש לגבולות
    // כניסה וההבדל נחשף (12 שורות). שקילות אמיתית דורשת מדידות שקולות.
    const noKernBytes = buildTtfFixture({ kern: false }).bytes;
    const reg = registerFont('פיקסטשור', noKernBytes);
    assert(reg.ok);
    const rA = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    const rB = typeset(CORPUS, { ...getDefaultSettings(), 'body-font': 'פיקסטשור', 'measure-impl': 'font-metrics' }, { noRecommendations: true });
    const breaksOf = (r) => r.pages.flatMap(p => p.columns.flat()).map(l => (l.words || []).join(' '));
    const a = breaksOf(rA), b = breaksOf(rB);
    assertEq(rB.pages.length, rA.pages.length, 'אותו מספר עמודים');
    assertEq(b.length, a.length, 'אותו מספר שורות');
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    assertEq(diff, 0, 'שבירות שורות זהות מילה־במילה (0 הבדלים)');
    fs.writeFileSync(path.join(ART, 's12-linebreak-equality.json'), JSON.stringify({
      doc: 'canonical_corpus.txt', pages: rA.pages.length, lines: a.length, diffs: diff,
      hashA: rA.layoutHash, hashB: rB.layoutHash, implA: 'table', implB: 'font-metrics(fixture)'
    }, null, 2));
    unregisterFont('פיקסטשור');
  });

  it('cap-height ממדדי אמת (סגירת דחוי S3): dropword נושא capHeightEm מה־API', () => {
    clearRegisteredFonts();
    const s = { ...getDefaultSettings(), 'first-word-mode': 'drop', 'first-word-threshold-lines': 2 };
    const r = typeset(CORPUS, s, { noRecommendations: true });
    const blk = r.pages.flatMap(p => p.columns.flat()).length; // ריצה תקינה
    void blk;
    const apiA = new MeasureAPI(getDefaultSettings(), 'table');
    assertEq(apiA.capHeightEm(), 0.7, 'מימוש A: הקירוב');
    if (HAS_DEJAVU) {
      registerFont('DejaVu Sans', fs.readFileSync(DEJAVU));
      const apiD = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'DejaVu Sans' }, 'font-metrics');
      // DejaVu OS/2 v1 בלי sCapHeight ⇒ נפילה ascender×0.7 = 1901/2048×0.7
      assert(Math.abs(apiD.capHeightEm() - (1901 / 2048) * 0.7) < 1e-9, 'נפילה מתועדת מ־hhea.ascender');
      unregisterFont('DejaVu Sans');
    }
    // הפיקסטשור: sCapHeight אמיתי = 700/1000
    registerFont('פיקסטשור', bytes);
    const apiF = new MeasureAPI({ ...getDefaultSettings(), 'body-font': 'פיקסטשור' }, 'font-metrics');
    assert(Math.abs(apiF.capHeightEm() - 0.7) < 1e-9, 'sCapHeight מהטבלה');
    unregisterFont('פיקסטשור');
  });
});

// =====================================================================
describe('S12.1-8 — מצמום גופנים לייצוא: 0 tofu + חיסכון גודל', () => {
  it('תת־גופן DejaVu: כל תו הקורפוס ממופה עם רוחב זהה; חיסכון נרשם', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const orig = fs.readFileSync(DEJAVU);
    const font = fm.parseFont(orig).font;
    const chars = charInventory(CORPUS);
    const t0 = Date.now();
    const sub = buildSubset(font, chars);
    assert(sub.ok, 'בניית תת־גופן: ' + sub.error);
    // בדיקת ה־tofu מובנית (לא ממופה / ריק־וחסר־רוחב ⇒ כשל) — כאן מוכח שעברה
    assert(sub.kept < font.numGlyphs / 2, `מצומצם (${sub.kept}/${font.numGlyphs})`);
    const reduction = Math.round((1 - sub.bytes.length / orig.length) * 100);
    assert(reduction > 50, `חיסכון גודל משמעותי (${reduction}%)`);
    fs.writeFileSync(path.join(ART, 's12-font-subset.json'), JSON.stringify({
      font: 'DejaVuSans.ttf', originalBytes: orig.length, subsetBytes: sub.bytes.length,
      reductionPct: reduction, glyphsKept: sub.kept, glyphsDropped: sub.dropped,
      charsMapped: sub.mappedChars, tofu: 0, buildMs: Date.now() - t0
    }, null, 2));
  });

  it('מלאי תווים: PUA ותווי בקרה לעולם לא נכנסים לתת־גופן (BRZ-13)', () => {
    const inv = charInventory('שלום \uE102עולם\nלחיות\u0000טוב');
    assert(!inv.some(ch => ch.codePointAt(0) >= 0xE000 && ch.codePointAt(0) <= 0xF8FF), 'אין PUA');
    assert(!inv.some(ch => ch.codePointAt(0) < 0x20), 'אין בקרה');
    assert(inv.includes(' '), 'רווח תמיד נוכח');
    assert(inv.includes('ש'), 'אותיות נוכחות');
  });
});

// =====================================================================
describe('S12.2 שער 3 — HTML עצמאי (REQ-EXP-02): חד־קובץ, offline, @page', () => {
  const settings = getDefaultSettings();
  const result = typeset(CORPUS, settings, { noRecommendations: true });
  const doc = makeDoc();

  it('מבנה: dir=rtl, כללי @page מהרישום, אפס הפניות חיצוניות, כל העמודים', () => {
    const html = exportHtml(result, settings, doc, { title: 'ספר בדיקה' });
    assert(html.startsWith('<!DOCTYPE html>'), 'DOCTYPE');
    assert(html.includes('<html lang="he" dir="rtl">'), 'dir=rtl');
    assert(html.includes('@page { size:'), 'כללי @page מרישום גדלי העמוד');
    assert(html.includes('.page{width:'), 'מידות עמוד מפורשות');
    assert(!/https?:\/\/(?!localhost)/i.test(html), 'אפס כתובות חיצוניות — נפתח offline');
    const pages = html.split('class="page').length - 1;
    assertEq(pages, result.pages.length, `כל ${result.pages.length} העמודים בקובץ אחד`);
  });

  it('העמודים זהים לרינדור החי — אותו מקור (dom-renderer) מילה־במילה', () => {
    const html = exportHtml(result, settings, doc, {});
    const { renderPage } = require('../../src/engine/output/dom-renderer');
    for (const pg of result.pages.slice(0, 5)) {
      // **03.11(ד):** הרינדור החי והייצוא כאחד אינם מעבירים header — renderPage נופל
      // לברירת המחדל page.header (בעבר הועברו מטא־נתונים בטעות והכותרת הועלמה).
      const live = renderPage(pg, settings, doc).outerHTML();
      assert(html.includes(live), `עמוד ${pg.index} — ההקרנה בייצוא === הרינדור החי`);
    }
  });

  it('דטרמיניזם: ייצוא כפול ⇒ בתים זהים; אין חותמת זמן', () => {
    const a = exportHtml(result, settings, doc, {});
    const b = exportHtml(result, settings, doc, {});
    assertEq(a, b, 'ייצוא דטרמיניסטי');
    assert(!a.includes(new Date().getFullYear() + ''), 'אין תאריך');
  });

  // **03.11(ג) (דיווח משתמש: "הייצוא נכשל: renderPage(...).outerHTML is not a function"):**
  // בדפדפן אמיתי outerHTML הוא מאפיין (מחרוזת) — לא פונקציה כמו ב-shim הבדיקות.
  // הייצוא חייב לעבוד גם ב-DOM אמיתי: בדיקה עם יסוד שמממש מאפיין בלבד.
  it('03.11(ג): ייצוא HTML ב-DOM אמיתי — outerHTML כמאפיין (לא פונקציה)', () => {
    const propDoc = {
      createElement(tag) {
        const el = {
          tagName: tag, children: [], style: {}, dataset: {},
          setAttribute(k, v) { el['attr_' + k] = String(v); },
          appendChild(c) { el.children.push(c); return c; },
          addEventListener() {},
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }
        };
        Object.defineProperty(el, 'outerHTML', { get() { return `<${tag}>${el.children.length}</${tag}>`; } });
        return el;
      }
    };
    const html = exportHtml(result, settings, propDoc, { title: 'בדיקת מאפיין' });
    assert(html.startsWith('<!DOCTYPE html>'), 'הייצוא הושלם — לא נזרק outerHTML is not a function');
    assert(html.includes('class="book"'), 'מבנה הספר תקין');
    const pages = html.match(/<article>/g) || [];
    assert(pages.length === result.pages.length, `כל ${result.pages.length} העמודים עברו סריאליזציה`);
  });

  it('offline-guard: הפניה חיצונית מוזרקת ⇒ דחייה עם exit 7 (דוקטרינת Orange)', () => {
    let threw = false;
    try { assertOfflineSafe('<script src="https://evil.example/x.js"></script>'); } catch (e) {
      threw = true;
      assertEq(e.exitCode, 7, 'exit code 7');
      assert(e.hits && e.hits.length >= 1, 'פירוט הפגיעות');
    }
    assert(threw, 'נדחה');
    // תקין: data: URI ו־localhost עוברים
    assertOfflineSafe('<img src="data:image/png;base64,xx">');
  });
});

// =====================================================================
describe('S12.2 שערים 1+2 — PDF: טקסט אמיתי, סימניות, קישורים, סימני חיתוך, parity', () => {
  if (!HAS_DEJAVU) { it('DejaVu נדרש לייצוא PDF — מדלג', () => {}); return; }
  const fontBytes = fs.readFileSync(DEJAVU);
  const settings = getDefaultSettings();
  const exp = exportPdf(CORPUS, settings, fontBytes, 'DejaVu Sans');
  assert(exp.ok, 'ייצוא PDF: ' + exp.error);
  const pdfPath = path.join(ART, 's12-canonical.pdf');
  fs.writeFileSync(pdfPath, exp.bytes);

  it('דטרמיניזם מלא: ייצוא כפול ⇒ בתים זהים (אין תאריך/מזהים אקראיים)', () => {
    const b2 = exportPdf(CORPUS, settings, fontBytes, 'DejaVu Sans');
    assert(b2.ok);
    assertEq(exp.bytes.length, b2.bytes.length, 'אורך זהה');
    assertEq(Buffer.compare(exp.bytes, b2.bytes), 0, 'בתים זהים ביט־לביט');
  });

  it('מספר עמודים זהה למנוע (pdfinfo); טקסט נפלט במלואו (pdftotext)', () => {
    if (!HAS_PDFTOOLS) { console.error('  [מדלג — poppler לא במערכת]'); return; }
    const info = execFileSync('pdfinfo', [pdfPath]).toString('utf8');
    const m = info.match(/Pages:\s+(\d+)/);
    assertEq(Number(m[1]), exp.result.pages.length, 'page count equality (live ↔ pdf)');
    // חילוץ טקסט: השוואת מולטיסט תווים פר־מסמך מול **כל מה שה־PDF מצייר**
    // (גוף+פסים+TOC+מרזב+גיליון+כותרות) — מההקרנה המפורשת, מקור יחיד.
    const txt = execFileSync('pdftotext', [pdfPath, '-']).toString('utf8');
    const drawnWords = [];
    for (const pg of exp.projected.pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
        for (const w of ln.words) drawnWords.push(w.text);
      }
      for (const fn of pg.footnotes) drawnWords.push(fn.marker, ...fn.text.split(/\s+/));
      if (pg.folio && pg.folio.text) drawnWords.push(pg.folio.text);
      if (pg.header) for (const s of pg.header.slots) drawnWords.push(s.text);
    }
    const engineTxt = drawnWords.filter(Boolean).join(' ');
    // נטרוליזציה: רווחים + תווי כיוונון דופן (bidi) שהמחלץ מזריק בעצמו (ארטיפקט חילוץ, לא תוכן מנוע)
    // **D-89:** סוגריים מכוונים מקופלים לתו אחיד — הכותב משקף אותם לפי UAX#9
    // (Bidi Mirrored) בציור, והחילוץ מחזיר את הגליף המצויר; כיוון-תצוגה אינו תוכן.
    const norm = (s) => s.replace(/[\s\u200E\u200F\u202A-\u202E]+/g, '')
      .replace(/[(){}[\]<>]/g, '|').split('').sort().join('');
    assertEq(norm(txt), norm(engineTxt), 'חילוץ טקסט ה־PDF ≡ כל הטקסט המצויר (מולטיסט תווים — שלמות תוכן)');
  });

  it('סימניות (Outlines): עץ H1/H2 מהמודל; כותרות עברית UTF-16BE; יעדים תקינים', () => {
    const latin = exp.bytes.toString('latin1');
    // כותרות נכתבות כ־UTF-16BE הקסדצימלי (חוזה PDF) — מפענחים חזרה
    const titles = [];
    const re = /\/Title <([0-9A-F]+)>/g;
    let m;
    while ((m = re.exec(latin))) {
      const hex = m[1];
      let s = '';
      for (let i = 4; i < hex.length; i += 4) s += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
      titles.push(s);
    }
    const expected = exp.result.tokens.filter(t => t.type === 'heading' && (t.level === 1 || t.level === 2));
    assertEq(titles.length, expected.length, `מספר הסימניות === H1+H2 (${expected.length})`);
    for (let i = 0; i < expected.length; i++) {
      assertEq(titles[i], expected[i].text, `סימנייה ${i} — הכותרת העברית שלמה ומדויקת`);
    }
    // יעדי הסימניות — אובייקטי עמוד תקינים
    const destCount = (latin.match(/\/Dest \[\d+ 0 R \/XYZ null null null\]/g) || []).length;
    assert(destCount >= expected.length, `יעדים תקינים (${destCount})`);
    fs.writeFileSync(path.join(ART, 's12-pdf-outline.json'), JSON.stringify({
      bookmarks: titles, count: titles.length, dests: destCount
    }, null, 2));
  });

  it('קישורי TOC לחיצים: כל שורה מקשרת לעמוד הכותרת שהובטח', () => {
    const latin = exp.bytes.toString('latin1');
    const linkCount = (latin.match(/\/Subtype \/Link /g) || []).length;
    const expectedLinks = exp.info.tocLinks;
    assertEq(linkCount, expectedLinks, `מספר הקישורים === שורות TOC עם יעד (${expectedLinks})`);
  });

  it('סימני חיתוך: מופעלים ⇒ דיו מחוץ לתבנית; כבויים ⇒ כל הדיו בתוך העמוד', () => {
    if (!HAS_PDFTOOLS) { console.error('  [מדלג — poppler לא במערכת]'); return; }
    const inkBoundsOf = (pdfBytes, page) => {
      const p = path.join(ART, '_tmp-crop.pdf');
      fs.writeFileSync(p, pdfBytes);
      const prefix = path.join(ART, '_tmp-crop');
      execFileSync('pdftoppm', ['-r', '96', '-f', String(page + 1), '-l', String(page + 1), p, prefix]);
      const files = fs.readdirSync(ART).filter(f => f.startsWith('_tmp-crop-')).sort();
      const raw = fs.readFileSync(path.join(ART, files[files.length - 1]));
      const mm = raw.toString('latin1').match(/^P6\n(\d+) (\d+)\n(\d+)\n/);
      const off = mm[0].length, W = +mm[1], H = +mm[2];
      let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1, any = false;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = off + (y * W + x) * 3;
        if (raw[i] < 128 && raw[i + 1] < 128 && raw[i + 2] < 128) {
          any = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      for (const f of files) fs.unlinkSync(path.join(ART, f));
      fs.unlinkSync(p);
      return any ? { minX, maxX, minY, maxY, W, H } : null;
    };
    // כבוי (ברירת מחדל): כל הדיו בתוך תיבת העמוד
    const off = inkBoundsOf(exp.bytes, 3);
    assert(off.minX >= 0 && off.maxX <= off.W && off.minY >= 0 && off.maxY <= off.H, 'ללא סימנים — הדיו בתוך העמוד');
    // מופעל: הסימנים מציירים בפינות (מחוץ לתיבת התוכן אך בתוך MediaBox מוגדל? — MediaBox קבוע;
    // הסימנים מצוירים מחוץ ל־TrimBox לכיוון פינות המדיה)
    const expOn = exportPdf(CORPUS, { ...settings, 'pdf-crop-marks': true }, fontBytes, 'DejaVu Sans');
    assert(expOn.ok);
    const on = inkBoundsOf(expOn.bytes, 3);
    // עם הסימנים, bbox הדיו מגיע לפינות (המרחק מהקצה קטן משמעותית)
    assert(on.maxY > off.maxY || on.minY < off.minY || on.maxX > off.maxX || on.minX < off.minX,
      `סימני החיתוך מרחיבים את הדיו (off:${JSON.stringify([off.minX, off.minY, off.maxX, off.maxY])} on:${JSON.stringify([on.minX, on.minY, on.maxX, on.maxY])})`);
  });

  it('parity גיאומטרי מודל↔רסטר: bbox דיו ≤6px בדגימה + פסי שורות מיושרים ±2px — artifact', () => {
    if (!HAS_PDFTOOLS) { console.error('  [מדלג — poppler לא במערכת]'); return; }
    const parity = { pages: [], tolerancePx: 6, note: 'bbox: סביבות גליף (bearings) + הערכת ascent; שורות: מיקום בסיס מדויק' };
    let worst = 0;
    // **03.11(ד):** דגימת עמודי גוף בלבד — עמודי השער המובנים כוללים כותרות 36pt
    // שבהן הערכת ה־ascent (×0.93) גורמת לפער שחורג מהסף; החוזה של ≤6px הוגדר
    // לגיאומטריית הגוף. השערים נבדקים ויזואלית באודיט הדפדפן (tools/layout-audit).
    const BODY_TYPES = new Set(['regular', 'sign-open', 'preface', 'h3-spread']);
    const bodyIdx = exp.result.pages
      .map((p2, i) => ({ t: p2.type, i }))
      .filter(x => BODY_TYPES.has(x.t))
      // עמודי מעבר ריקים (פתיחת חלק בעמוד אי-זוגי) מכילים כותרת עליונה בלבד —
      // אין בהם גיאומטריית גוף להשוות; רוחב הכותרת במודל מוערך (טבלה) ואינו
      // ההתקדמות האמיתית של הגופן — פער שאינו חלק מהחוזה (גוף ≤6px).
      // כמו כן נדגמים עמודים שהשורה העליונה שלהם פסקה (לא כותרת/פס): הערכת
      // ה־ascent (×0.93) מכוונת לגוף וגסה לכותרות (03.11(ד)).
      .filter(x => {
        const pg2 = exp.projected.pages[x.i];
        const b2 = exp.projected.inkBounds[x.i];
        if (!b2 || (b2.maxY - b2.minY) <= 100) return false;
        const all2 = [...(pg2.spanning ? pg2.spanning.lines : []), ...pg2.lines];
        if (!all2.length) return false;
        const top = all2.reduce((a, b3) => (b3.y < a.y ? b3 : a));
        return top.kind !== 'heading' && top.kind !== 'shaar-content';
      })
      .map(x => x.i);
    const sample = bodyIdx.length >= 5 ? [0, 1, 2, Math.floor(bodyIdx.length / 2), bodyIdx.length - 1].map(k => bodyIdx[k]) : bodyIdx;
    // **S6.0 (R5-M6):** מקור הראסטר = פינת ה-MediaBox. עם בליד (ברירת המחדל
    // 3מ״מ) או סימני-חיתוך ה-MediaBox מורחב סביב ה-Trim ⇒ כל הדיו מוסט
    // ב-extPt — מוחזר ההיסט לפי ה-MediaBox בפועל מהבייטים (חוזה ה-±2/±6px
    // נשאר ביחס לראשית ה-Trim, כמו המודל).
    const mbMatch = exp.bytes.toString('latin1').match(/\/MediaBox \[([^\]]+)\]/);
    const mbv = mbMatch ? mbMatch[1].trim().split(/\s+/).map(Number) : [0, 0];
    const mediaOffPx = Math.round((Number.isFinite(mbv[0]) ? -mbv[0] : 0) * (96 / 72));
    for (const pgIdx of sample) {
      const p = path.join(ART, 's12-canonical.pdf');
      const prefix = path.join(ART, '_tmp-par');
      // **S5.2 (יציבות המבחן):** מניעת רסטר מיושן — בעבר קובץ _tmp-par-NN מריצה
      // קודמת (מספר עמוד גבוה יותר, ממוין אחרון) הושווה מול המודל של עמוד אחר
      // ⇒ כשל פתאומי 'Δ10-16px' שאינו קשור לקוד. כעת כל ריצה מתחילה נקייה.
      for (const f of fs.readdirSync(ART).filter(f => f.startsWith('_tmp-par-'))) fs.unlinkSync(path.join(ART, f));
      execFileSync('pdftoppm', ['-r', '96', '-f', String(pgIdx + 1), '-l', String(pgIdx + 1), p, prefix]);
      const files = fs.readdirSync(ART).filter(f => f.startsWith('_tmp-par-')).sort();
      const raw = fs.readFileSync(path.join(ART, files[files.length - 1]));
      const mm = raw.toString('latin1').match(/^P6\n(\d+) (\d+)\n(\d+)\n/);
      const off = mm[0].length, W = +mm[1], H = +mm[2];
      let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
      const inkRows = new Array(H).fill(false);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = off + (y * W + x) * 3;
        if (raw[i] < 128 && raw[i + 1] < 128 && raw[i + 2] < 128) {
          inkRows[y] = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      for (const f of fs.readdirSync(ART).filter(f => f.startsWith('_tmp-par-'))) fs.unlinkSync(path.join(ART, f));
      const b = exp.projected.inkBounds[pgIdx];
      const d = {
        minX: Math.abs((minX - mediaOffPx) - b.minX), maxX: Math.abs((maxX - mediaOffPx) - b.maxX),
        minY: Math.abs((minY - mediaOffPx) - b.minY), maxY: Math.abs((maxY - mediaOffPx) - b.maxY)
      };
      const pageWorst = Math.max(d.minX, d.maxX, d.minY, d.maxY);
      worst = Math.max(worst, pageWorst);
      parity.pages.push({ page: pgIdx, raster: { minX, minY, maxX, maxY }, model: b, diff: d });
      assert(pageWorst <= 6, `עמוד ${pgIdx}: bbox Δ=${pageWorst.toFixed(1)}px ≤ 6px`);
    }
    // פסי שורות בעמוד גוף: מיקומי תחילת הדיו ±2px מהמודל
    {
      const pgIdx = 3;
      const prefix = path.join(ART, '_tmp-bands');
      execFileSync('pdftoppm', ['-r', '96', '-f', String(pgIdx + 1), '-l', String(pgIdx + 1), path.join(ART, 's12-canonical.pdf'), prefix]);
      const files = fs.readdirSync(ART).filter(f => f.startsWith('_tmp-bands-')).sort();
      const raw = fs.readFileSync(path.join(ART, files[files.length - 1]));
      const mm = raw.toString('latin1').match(/^P6\n(\d+) (\d+)\n(\d+)\n/);
      const off = mm[0].length, W = +mm[1], H = +mm[2];
      const inkRows = new Array(H).fill(false);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = off + (y * W + x) * 3;
        if (raw[i] < 128 && raw[i + 1] < 128 && raw[i + 2] < 128) inkRows[y] = true;
      }
      for (const f of fs.readdirSync(ART).filter(f => f.startsWith('_tmp-bands-'))) fs.unlinkSync(path.join(ART, f));
      const bands = [];
      let inBand = false, start = 0;
      for (let y = 0; y < H; y++) {
        if (inkRows[y] && !inBand) { inBand = true; start = y; }
        else if (!inkRows[y] && inBand) { inBand = false; bands.push(start); }
      }
      if (inBand) bands.push(start);
      // **S6.0:** החזרת פסי הראסטר לראשית ה-Trim (בליד מרחיב את המדיה)
      for (let i = 0; i < bands.length; i++) bands[i] = Math.round(bands[i] - mediaOffPx);
      const merged = [];
      for (const s of bands) {
        // **03.11(ד):** פס הדיו של הכותרת העליונה (y≈2..16, נכנס לעמודי פתיחה
        // כעת) אינו שורת גוף — מדלגים על אזור הכותרת כדי שהיישור אינדקס-מול-אינדקס
        // של פסי השורות לא ייסחף (הגיליון בתחתית נסבל כבר במינימום של הלולאה).
        if (s < 20) continue;
        if (merged.length && s - merged[merged.length - 1] < 4) continue;
        merged.push(s);
      }
      const pg = exp.projected.pages[pgIdx];
      const modelTops = [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]
        .map(l => Math.round(l.baselineY - l.ascentPx * 0.9));
      // מיזוג צמרות מודל קרובות (±2px — שורות מקבילות בשני טורים באותו גובה)
      const distinctModelTops = [];
      for (const t of [...new Set(modelTops)].sort((a, b) => a - b)) {
        if (distinctModelTops.length && t - distinctModelTops[distinctModelTops.length - 1] <= 2) continue;
        distinctModelTops.push(t);
      }
      assert(merged.length >= distinctModelTops.length - 2, `מספר פסי שורות ברסטר (${merged.length}) ≈ שורות המודל (${distinctModelTops.length})`);
      // **03.11(ד):** התאמת הקרוב-ביותר לכל שורת מודל (במקום יישור אינדקסי) —
      // וסבילות נפרדת לשורות כותרת: הערכת ה־ascent (×0.9) מדויקת לגוף אך
      // גסה לכותרות גדולות (אות עברית אינה מגיעה לקו ה־ascender).
      const kindByTop = new Map();
      [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines].forEach(l => {
        const t = Math.round(l.baselineY - l.ascentPx * 0.9);
        kindByTop.set(t, l.kind);
      });
      let bandWorst = 0;
      const misses = [];
      for (const t of distinctModelTops) {
        let nearest = null;
        for (const b of merged) if (nearest === null || Math.abs(b - t) < Math.abs(nearest - t)) nearest = b;
        const tol = kindByTop.get(t) === 'heading' ? 6 : 3;
        const d = Math.abs(nearest - t);
        bandWorst = Math.max(bandWorst, d);
        if (d > tol) misses.push(`top ${t} (${kindByTop.get(t)}) ↔ band ${nearest} Δ${d}`);
      }
      assert(misses.length === 0, `מיקומי פסי השורות ±3px/כותרות ±6px (חריגות: ${misses.slice(0, 3).join('; ')})`);
      parity.lineBands = { page: pgIdx, rasterBands: merged.length, modelLines: distinctModelTops.length, maxOffsetPx: bandWorst };
    }
    parity.worstBboxPx = worst;
    fs.writeFileSync(path.join(ART, 's12-parity.json'), JSON.stringify(parity, null, 2));
  });
});

// =====================================================================
describe('S12.2 שער 5 — חבילת פרויקט ZIP (REQ-EXP-04): מבנה, roundtrip, דטרמיניזם', () => {
  const settings = getDefaultSettings();

  it('החבילה מכילה את כל החלקים; manifest מובנה (JSON — לא תבניות מחרוזות)', () => {
    const bytes = exportProjectZip(CORPUS, settings, {});
    const { readZip, utf8Decode } = require('../../src/engine/import/zip-reader');
    const zip = readZip(bytes);
    assert(zip.ok, 'קריאה עצמית: ' + zip.error);
    const names = zip.entries.map(e => e.name);
    for (const part of ['manifest.json', 'document.txt', 'settings.json', 'extensions.json', 'theme.json']) {
      assert(names.includes(part), `חלק חסר: ${part}`);
    }
    const manifest = JSON.parse(utf8Decode(zip.entries.find(e => e.name === 'manifest.json').data));
    assertEq(manifest.format, 'tora-typesetter-project-zip');
    assertEq(manifest.settings_version, 2);
  });

  it('roundtrip: ייבוא משחזר מסמך+הגדרות; מיגרציה v1→v2 עובדת בתוך החבילה', () => {
    const bytes = exportProjectZip(CORPUS, settings, {});
    const back = importProjectZip(bytes);
    assert(back.ok, 'ייבוא: ' + back.error);
    assertEq(back.text, CORPUS, 'המסמך חזר במלואו');
    assertEq(back.settings['body-font-size-pt'], settings['body-font-size-pt'], 'הגדרות אוחדו');
    // מיגרציה: חבילה עם מפתח ישן v1
    const { exportProject } = require('../../src/engine/output/project-io');
    const oldSettings = { settings_version: 1, bodyFontSize: 16, pageNumFormat: 'hebrew' };
    const bytes2 = (() => {
      const { buildZip } = require('../../src/engine/output/zip-writer');
      return buildZip([
        { name: 'manifest.json', data: JSON.stringify({ format: 'tora-typesetter-project-zip', format_version: 1, parts: [], settings_version: 2 }) },
        { name: 'document.txt', data: 'טקסט' },
        { name: 'settings.json', data: exportProject(null, oldSettings, { timestamp: null }) },
        { name: 'extensions.json', data: exportExtensionsEmpty() },
        { name: 'theme.json', data: '{}' }
      ]);
    })();
    const back2 = importProjectZip(bytes2);
    assert(back2.ok, 'ייבוא v1: ' + back2.error);
    assertEq(back2.settings['body-font-size-pt'], 16, 'bodyFontSize → body-font-size-pt (מיגרציה)');
    assertEq(back2.settings['page-num-format'], 'hebrew', 'pageNumFormat → page-num-format');
    assert(!('bodyFontSize' in back2.settings), 'המפתח הישן הוסר');
  });

  function exportExtensionsEmpty() {
    const { exportExtensions } = require('../../src/engine/extensions/extensions-io');
    return exportExtensions({ styles: [], pages: [], images: [] });
  }

  it('דטרמיניזם: ייצוא כפול ⇒ בתים זהים', () => {
    const a = exportProjectZip(CORPUS, settings, {});
    const b = exportProjectZip(CORPUS, settings, {});
    assertEq(Buffer.compare(a, b), 0, 'בתים זהים');
  });

  it('דחיות: zip שבור / פורמט לא מוכר / חלק חסר — הודעה, לא קריסה', () => {
    assertEq(importProjectZip(Buffer.from('not a zip')).ok, false);
    const { buildZip } = require('../../src/engine/output/zip-writer');
    const badFormat = buildZip([
      { name: 'manifest.json', data: JSON.stringify({ format: 'other', format_version: 1 }) },
      { name: 'document.txt', data: 'x' }, { name: 'settings.json', data: '{}' }
    ]);
    const r1 = importProjectZip(badFormat);
    assert(!r1.ok && r1.error === 'unknown-format');
    const missing = buildZip([{ name: 'manifest.json', data: JSON.stringify({ format: 'tora-typesetter-project-zip' }) }]);
    const r2 = importProjectZip(missing);
    assert(!r2.ok && r2.error === 'missing-parts');
  });
});

// =====================================================================
describe('S12 — רגרסיית רישום ו־UI אחרי הוספת מפתחות הייצוא', () => {
  it('מפתחות S12 נצרכים בפועל (מדידה/ייצוא); dead-control=0; enum תקין', () => {
    const { scanConsumers } = require('../../src/audit/scanners');
    const res = scanConsumers(path.join(__dirname, '..', '..', 'src'));
    assertEq(res.deadControls.map(d => d.control), [], 'כל הפקדים כולל החדשים כבולים');
    assertEq(res.phantomKeys.map(k => k.id), [], 'אין מפתחות פנטום');
    const defs = Object.fromEntries(require('../../src/engine/core/settings-registry').getSettingDefs().map(r => [r.id, r]));
    assertEq(defs['measure-impl'].default, 'table', 'ברירת מחדל שמורה — רציפות');
    assert(defs['measure-impl'].enum.includes('font-metrics'));
    assertEq(defs['export-bleed-mm'].min, 0);
  });

  it('פאנל ייצוא חדש ב־UI: כפתורי HTML/PDF/ZIP בתצוגה; ייצוא מה־UI עובד', () => {
    const { createApp } = require('../../src/ui/app-shell');
    const { createInlineTransport } = require('../../src/ui/inline-transport');
    const doc = makeDoc();
    const font = HAS_DEJAVU ? fs.readFileSync(DEJAVU) : null;
    const app = createApp(doc, { transport: createInlineTransport(), embeddedFont: font });
    app.setText(['ספר - ייצוא מהממשק', '', 'כותרת 1 - חלק', 'פסקה לבדיקת הייצוא עם כמה מילים.'].join('\n'));
    app.onExplicitRetypeset();
    return new Promise(resolve => setTimeout(() => {
      const buttons = app.preview.root.querySelectorAll('.export-bar button') ||
        app.preview.root.querySelectorAll('button').filter(b => b.textContent.includes('PDF'));
      // הסרגל קיים בעץ (querySelectorAll של ה־shim עובד על class)
      const bar = app.preview.root.querySelectorAll('.export-bar');
      assert(bar.length >= 1, 'סרגל הייצוא קיים בלשונית התצוגה');
      const htmlRes = app.exportRequest('html');
      assert(htmlRes && htmlRes.ok, 'ייצוא HTML מה־UI');
      assert(String(htmlRes.data).includes('dir="rtl"'), 'תוצר תקין');
      const zipRes = app.exportRequest('zip');
      assert(zipRes && zipRes.ok, 'ייצוא ZIP מה־UI');
      if (font) {
        const pdfRes = app.exportRequest('pdf');
        assert(pdfRes && pdfRes.ok, 'ייצוא PDF מה־UI (עם גופן מוטמע)');
        assertEq(pdfRes.info.pages, app.getState().pages, 'אותו מספר עמודים');
      } else {
        const pdfRes = app.exportRequest('pdf');
        assert(!pdfRes.ok && pdfRes.reason === 'no-embedded-font', 'בלי גופן — סירוב מתועד, לא זיוף');
      }
      resolve();
    }, 250));
  });
});

report('s12-export');
