// tests/e2e/s15-view-justify.test.js — S4.23: יישור שורות הגוף בתצוגה החיה
'use strict';
/**
 * דיווח משתמש (03.11, אחרי D-89): "המראה של הספר בתוכנה עדיין קטסטרופה,
 * ישור שורות לא נכון". מדידה חיה (agent-browser, בלי VLM) הוכיחה את השורש
 * הכפול בנתיב ה-legacy של התצוגה:
 *  1) inline white-space:nowrap דרס את BASE_CSS — justify על שורת nowrap
 *     הוא אפס-פעולה לפי הוראת ה-CSS (השורות נצמדו לימין; קצה שמאל נשאר
 *     מרופט: נמדד 2..53px, חלקן גלשו מתיבת הטור);
 *  2) גם בלי nowrap — שורה יחידה בבלוק נחשבת "השורה האחרונה" ולעולם אינה
 *     נמתחת ע"י justify. כל .line הוא בלוק בן-שורה-אחת מתוכנן (השבירה
 *     נעשתה במנוע) — רק text-align-last:justify מותח אותה.
 * התיקון: שורות גוף מלאות ב-legacy מקבלות normal+justify+text-align-last,
 * ו-BASE_CSS מוסיף .line:not(.line--last):not(.line--heading){text-align-last:justify}
 * לכל שאר הנתיבים (תצוגה + HTML עצמאי).
 * הבדיקה כאן: רמת המודל/המרנדר (Node, דטרמיניסטי) — ההוכחה המלאה על הדיו
 * האמיתי היא האודיט החי (tools/layout-audit, INK_NOT_JUSTIFIED), שמורץ ב-CI
 * על שני הקורפוסים.
 */
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');

const RB = path.join(__dirname, '..', '..');
const IMUD_RAW = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
const BOOK = fs.readFileSync(path.join(RB, 'tests', 'fixtures', 'real', 'no_long_test_text.txt'), 'utf8');

// ---------- Minimal deterministic DOM shim (same shape as pipeline.test.js) ----------
function makeDoc() {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attrs = {};
      this.dataset = {};
      this.style = {};
      this._class = '';
      this.dir = '';
      this._text = '';
    }
    set className(v) { this._class = v; }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
  }
  return {
    createElement: (t) => new El(t),
    createTextNode: (v) => { const t = new El('#text'); t.textContent = String(v); return t; }
  };
}
function walk(el, fn) { fn(el); for (const c of el.children || []) walk(c, fn); }
function hasClass(el, cls) { return String(el.className || '').split(/\s+/).includes(cls); }

function legacySettings() {
  const reg = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(IMUD_RAW, reg, {});
  return settings;
}

describe('s15-view-justify', () => {

  it('legacy view: שורות גוף מלאות מקבלות normal+justify+text-align-last (לא nowrap)', () => {
    const settings = legacySettings();
    const r = typeset(BOOK, settings, { noRecommendations: true });
    assert(r.pages.length > 0, 'must typeset');
    // מצא עמוד regular עם שורות גוף
    const pg = r.pages.find(p => String(p.type) === 'regular' && (p.columns || []).some(c => c.length > 5));
    assert(pg, 'no regular page with body lines');
    const doc = makeDoc();
    const el = renderPage(pg, settings, doc, pg.header || null);
    // רק שורות שהן בנים ישירים של .column (שורות הגוף). שורות פס/שער/הערת-שוליים
    // (mkLine) הן חד-שורתיות מטבען ואינן נבדקות כאן.
    const lines = [];
    walk(el, (n) => { if (hasClass(n, 'column')) for (const c of n.children || []) if (hasClass(c, 'line') && c.style && c.style.textAlign) lines.push(c); });
    assert(lines.length > 0, 'rendered column lines exist');
    const body = lines.filter(l => !hasClass(l, 'line--last') && !hasClass(l, 'line--heading'));
    assert(body.length >= 3, `need ≥3 body lines (got ${body.length})`);
    for (const l of body) {
      assertEq(l.style.whiteSpace, 'normal', 'body line white-space must be normal');
      assertEq(l.style.textAlign, 'justify', 'body line text-align must be justify');
      assertEq(l.style.textAlignLast, 'justify', 'body line text-align-last must be justify (single-line block!)');
    }
    const last = lines.filter(l => hasClass(l, 'line--last'));
    assert(last.length >= 1, 'need ≥1 last line');
    for (const l of last) {
      assertEq(l.style.whiteSpace, 'nowrap', 'last line stays nowrap');
      assertEq(l.style.textAlign, 'center', 'last line stays center');
      assert(!l.style.textAlignLast || l.style.textAlignLast === '', 'last line must NOT get text-align-last');
    }
  });

  it('legacy view: מילת-החלון היא הצמת הראשון של השורה (ראש השורה = צד ימין ב-RTL)', () => {
    const settings = legacySettings();
    const r = typeset(BOOK, settings, { noRecommendations: true });
    const pgs = r.pages.filter(p => String(p.type) === 'regular');
    let found = 0;
    for (const pg of pgs) {
      const doc = makeDoc();
      const el = renderPage(pg, settings, doc, pg.header || null);
      const winLines = [];
      walk(el, (n) => {
        if (hasClass(n, 'line') && n.children && n.children.length && hasClass(n.children[0], 'w--window')) winLines.push(n);
      });
      for (const l of winLines) {
        found++;
        assertEq(l.style.textAlign, 'justify', 'window line is a full line — justify');
        assertEq(l.style.textAlignLast, 'justify', 'window line must stretch (text-align-last)');
        const win = l.children[0];
        assert(win.style.fontSize, 'window has explicit font size');
        // 1.5× גוף — כמו שהמרנדר קובע (S4.15)
        const bodyPx = parseFloat(String(l.style.fontSize)) || 0;
        const winPx = parseFloat(String(win.style.fontSize)) || 0;
        assert(winPx > bodyPx * 1.2, `window font must be ~1.5× body (body=${bodyPx}, win=${winPx})`);
      }
      if (found >= 5) break;
    }
    assert(found >= 1, 'no window lines found in fixture');
  });

  it('BASE_CSS (html-export): כלל text-align-last:justify לשורות שאינן אחרונות/כותרות', () => {
    const src = fs.readFileSync(path.join(RB, 'src', 'engine', 'output', 'html-export.js'), 'utf8');
    assert(src.includes('.line:not(.line--last):not(.line--heading):not(.band){text-align-last:justify}'),
      'BASE_CSS must contain the single-line-block stretch rule');
    // ולא על שורות אחרונות — אחרת היה מיישר גם שורות שהוגדרו center/right
    // (הכלל עצמו מזכיר line--last רק בתוך :not() — זה מכוון ותקין)
    assert(src.includes('.line--last{text-align:center}'), 'line--last itself stays centered');
  });

});

report('s15-view-justify');
