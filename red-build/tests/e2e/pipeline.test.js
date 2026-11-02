// tests/e2e/pipeline.test.js — S7 E2E: raw text → typeset → DOM → standalone HTML → diagnostics report
// נכתב מאפס לפי Master Work Plan S7.1; בודק את השרשרת המלאה ללא תלות דפדפן (DOM מינימלי ב-Node).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { buildStandaloneHtml, assertOfflineSafe } = require('../../src/engine/output/html-export');
const { buildReport } = require('../../src/audit/report-schema');

// ---------- Minimal deterministic DOM shim (Node-side rendering oracle) ----------
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
    get textContentValue() {
      if (this.children.length) return this.children.map(c => c.textContentValue).join('');
      return this._text;
    }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.textContentValue; }
    outerHTML() {
      const attrs = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
        + (this._class ? ` class="${esc(this._class)}"` : '')
        + (this.dir ? ` dir="${esc(this.dir)}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('')
        + Object.entries(this.style).map(([k, v]) => ` style="${cssKey(k)}:${esc(String(v))}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cssKey(k) { return k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }
  return { createElement: (t) => new El(t) };
}

const FIXTURE = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.txt'), 'utf8');

describe('e2e-pipeline', () => {

  it('typeset runs end-to-end and preserves content', () => {
    const settings = getDefaultSettings();
    const result = typeset(FIXTURE, settings);
    assert(result.pages.length > 0, 'must produce pages');
    assert(result.contentPreserved === true, 'word multiset must be preserved');
    assert(typeof result.layoutHash === 'string' && result.layoutHash.length >= 16, 'layout hash present');
  });

  it('determinism: two runs yield identical layoutHash', () => {
    const s = getDefaultSettings();
    const a = typeset(FIXTURE, s);
    const b = typeset(FIXTURE, s);
    assertEq(a.layoutHash, b.layoutHash, 'layoutHash must be deterministic');
    assertEq(a.pages.length, b.pages.length, 'page count stable');
  });

  it('geometry neutrality: decorations pass does not change layout hash (CP4==CP5)', () => {
    const result = typeset(FIXTURE, getDefaultSettings());
    assert(result.geometryNeutralVerified === true, 'CP4→CP5 invariant must hold');
  });

  it('event log drops nothing (droppedEvents===0 doctrine)', () => {
    const result = typeset(FIXTURE, getDefaultSettings());
    assertEq(result.events.droppedEvents, 0, 'no dropped events allowed');
  });

  it('retreat loop converges or registers compromise in ledger', () => {
    const result = typeset(FIXTURE, getDefaultSettings());
    const r = result.retreat;
    assert(r, 'retreat info must exist');
    if (!r.converged) {
      // compromise must be ledger-registered, never silent
      const hasCompromise = [...result.ledger.issues.values()].some(rec => rec.kind === 'rollback-compromise');
      assert(hasCompromise || r.compromise, 'non-convergence must be recorded as compromise');
    }
  });

  it('PUA scrub: no U+E000 leaks into rendered DOM or exported HTML (BRZ-13)', () => {
    const settings = getDefaultSettings();
    const result = typeset(FIXTURE, settings);
    const doc = makeDoc();
    const htmlFragments = [];
    for (const pg of result.pages) {
      const el = renderPage(pg, settings, doc, pg.header || null);
      htmlFragments.push(el.outerHTML());
    }
    const joined = htmlFragments.join('\n');
    assert(!joined.includes('\uE000'), 'rendered DOM must not contain U+E000');
    assert(!joined.includes('⏎'), 'page-break marker must never be exported (F-01)');
  });

  it('standalone HTML export is offline-safe and contains all pages', () => {
    const settings = getDefaultSettings();
    const result = typeset(FIXTURE, settings);
    const doc = makeDoc();
    const frags = result.pages.map(pg => renderPage(pg, settings, doc, pg.header || null).outerHTML());
    const html = buildStandaloneHtml(frags, settings, { title: 'משלי (RED)' });
    assert(html.includes('<!DOCTYPE html>'), 'full document');
    assert(html.split('class="page').length - 1 >= result.pages.length, 'all pages present');
    // offline-guard must not throw on our own output
    assertOfflineSafe(html);
  });

  it('offline-guard rejects external references with exit code 7 (Orange doctrine)', () => {
    let threw = null;
    try {
      assertOfflineSafe('<html><head><link href="https://fonts.example.com/css"></head></html>');
    } catch (e) { threw = e; }
    assert(threw && threw.exitCode === 7, 'external ref must throw exit-7');
  });

  it('diagnostics report v2 schema: counts, kinds, hashes', () => {
    const result = typeset(FIXTURE, getDefaultSettings());
    const rep = buildReport(result, { compact: false });
    assertEq(rep.schema, 'diagnostics-v2', 'schema version');
    assertEq(rep.deterministic, true, 'report claims determinism');
    assertEq(rep.layout_hash, result.layoutHash, 'hash consistency');
    assertEq(rep.dropped_events, 0, 'dropped events in report');
    for (const f of rep.findings) {
      assert(f.kindHe, `finding ${f.id} must carry Hebrew kind name`);
      assert('status' in f && 'transitions' in f, 'predicate/status transparency');
    }
  });

  it('settings changes flow through: column width change alters layout hash', () => {
    const base = getDefaultSettings();
    const alt = { ...base, 'grid-col-width-pct': 34 };
    const h1 = typeset(FIXTURE, base).layoutHash;
    const h2 = typeset(FIXTURE, alt).layoutHash;
    assert(h1 !== h2, 'narrower columns must reflow (registry-driven mechanism live)');
  });

  it('footnotes enabled/disabled both preserve content', () => {
    const on = getDefaultSettings();
    const off = { ...on, 'footnotes-enabled': false };
    assert(typeset(FIXTURE, on).contentPreserved === true, 'fn on: preserved');
    assert(typeset(FIXTURE, off).contentPreserved === true, 'fn off: preserved (note text stays in body)');
  });

  it('endnote mode routes notes to dedicated pages without loss', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const result = typeset(FIXTURE, s);
    assert(result.contentPreserved === true, 'endnote mode must not lose words');
    assert(result.endnotePagesInfo.count >= 1, 'at least one endnote page when notes exist');
  });

  it('empty input yields zero pages but valid structure (no crash)', () => {
    const result = typeset('', getDefaultSettings());
    assert(Array.isArray(result.pages), 'pages array exists');
    assertEq(result.tokens.length, 0, 'no tokens');
  });

  it('single long paragraph produces multiple pages with balanced columns', () => {
    const para = 'חכם ונבון ילמדו דברי תורה בכל דור ודור עם ישראל '.repeat(120);
    const result = typeset(para, getDefaultSettings());
    assert(result.pages.length >= 2, 'long text must paginate');
    assert(result.contentPreserved === true, 'no word lost across pagination');
    // every non-final page should fill both columns roughly (imbalance audit would flag gross issues)
    const imbalanced = [...result.ledger.issues.values()].filter(r => r.kind === 'column-imbalance' && r.status !== 'resolved');
    assert(imbalanced.length === 0, `no unresolved column-imbalance findings (got ${imbalanced.length})`);
  });

});

report('e2e-pipeline');
