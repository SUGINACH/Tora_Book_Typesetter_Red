// tests/audit/negative-controls.test.js — S0.1.8: אוסף הזהב של anti-false-positive fixtures.
// כל מקרה כאן הוא מסמך שאסור לדווח עליו כבעיה. אם מישהו מדווח — זו רגרסיית false-positive
// (המחלה של Z.ai/Claude V20-V23: 14 תיקוני ה‑false-positive נעולים כאן לצמיתות).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { tokenize } = require('../../src/engine/parser/block-tokenizer');
const { toHebrewNumber } = require('../../src/engine/decoration/folio');
const { isNoteMarkerWord } = require('../../src/engine/layout/protections-matrix');

const FIXTURES = path.join(__dirname, 'fixtures');
const read = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8');

/** הפרות שנשארו (לא resolved) מסוג מסוים */
const persisted = (r, kind) => [...r.ledger.issues.values()].filter(x => x.kind === kind && x.status !== 'resolved');

// ---------- DOM shim (mini) ----------
function makeDoc() {
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this.dir = ''; this._text = ''; }
    set className(v) { this._class = v; }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    outerHTML() {
      const attrs = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${String(v)}"`).join('')
        + (this._class ? ` class="${this._class}"` : '') + (this.dir ? ` dir="${this.dir}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${String(v)}"`).join('')
        + Object.entries(this.style).map(([k, v]) => ` style="${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${String(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : String(this._text);
      return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (t) => new El(t) };
}

describe('negative-controls (אסף הזהב — 0 findings by design)', () => {

  it('NC-01 (REQ-PAR-01, Z.ai): metadata-like line mid-document stays a paragraph', () => {
    const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
    const src = read('nc01_mid_doc_metadata.txt');
    const { metadata, bodyLines } = lexDocument(src);
    assertEq(metadata['ספר'], 'ספר הבדיקות', 'preamble metadata recognized');
    assertEq(metadata['נושא'], undefined, 'mid-document metadata-like line is NOT metadata');
    const toks = tokenize(bodyLines);
    const para = toks.find(t => t.type === 'paragraph' && /נושא/.test(t.raw));
    assert(para, 'the metadata-like line is a paragraph');
  });

  it('NC-02 (P1-5, D-40): endnote class-title line is a directive, not a fake note', () => {
    const toks = tokenize(read('nc02_class_title.txt').split('\n').map(l => l.trim()).filter(Boolean));
    assertEq(toks.filter(t => t.type === 'endnote-class').length, 1, 'one class directive');
    assertEq(toks.filter(t => t.type === 'endnote' && /הערות סיום/.test(String(t.text))).length, 0, 'no fake content-note from the title');
    const r = typeset(read('nc02_class_title.txt'), getDefaultSettings());
    assertEq(persisted(r, 'text-completeness').length, 0, 'no content finding');
  });

  it('NC-03 (B4): terminal residual last page is NOT page-underfill', () => {
    const r = typeset(read('nc03_terminal_residual.txt'), getDefaultSettings());
    assertEq(persisted(r, 'page-underfill').length, 0, 'terminal residual is a non-finding');
  });

  it('NC-04 (D-36): part-opening pages are NOT underfill/numbered — running head YES (03.11(ד), כמקור)', () => {
    const r = typeset(read('nc04_part_opening.txt'), getDefaultSettings());
    assertEq(persisted(r, 'page-underfill').length, 0, 'openings are title pages by design');
    for (const pg of r.pages) {
      if (pg.chapterOpening) {
        assertEq(pg.folioDisplay, '', 'no folio display on openings');
        // **03.11(ד):** במקור ה-top-header-grid מוצג בכל עמודי התוכן, כולל
        // פתיחות — תיקון D-36 החלקי. הכותרת חיה; עמודי שער/תוכן־עניינים
        // נשארים ללא כותרת (template.hasRunningHead=false).
        if (pg.template && pg.template.hasRunningHead && settings_header_enabled()) {
          assert(pg.header != null, `opening page ${pg.index} has running head (03.11(ד))`);
        }
      }
    }
    function settings_header_enabled() { return true; } // header-enabled=true בברירת המחדל
  });

  it('NC-05 (BRZ-11): marker bound to its anchor word is NOT marker-line-break', () => {
    const r = typeset(read('nc05_bound_marker.txt'), getDefaultSettings());
    assertEq(persisted(r, 'note-marker-line-break').length, 0, 'bound marker never ends a line alone');
  });

  it('NC-06 (P1-2): paren span inside one column is NOT paren-cross-boundary', () => {
    const r = typeset(read('nc06_paren_within_column.txt'), getDefaultSettings());
    assertEq(persisted(r, 'paren-cross-boundary').length, 0, 'same-column paren is a non-finding');
  });

  it('NC-07 (D-50): balanced page within delta has no imbalance finding', () => {
    const para = 'חכם ונבון ילמדו דברי תורה בכל דור ודור עם ישראל '.repeat(120);
    const r = typeset(para, getDefaultSettings());
    for (const imb of persisted(r, 'column-imbalance')) {
      assert(imb.predicate_before.delta <= 30, `residual imbalance is line-granularity only: ${JSON.stringify(imb.predicate_before)}`);
    }
  });

  it('NC-08 (BRZ-13): U+E000/E101 never leak to rendered DOM — even with paren-scale on', () => {
    const src = read('nc06_paren_within_column.txt');
    for (const scale of [1, 0.92]) {
      const s = { ...getDefaultSettings(), 'paren-style-scale': scale };
      const r = typeset(src, s);
      const doc = makeDoc();
      const html = r.pages.map(pg => renderPage(pg, s, doc, pg.header || null).outerHTML()).join('\n');
      assert(!html.includes('\uE000'), `no E000 leak (scale=${scale})`);
      assert(!html.includes('\uE101'), `no E101 leak (scale=${scale})`);
    }
  });

  it('NC-09 (F-01): page-break marker ⏎ never exported', () => {
    const r = typeset(read('nc03_terminal_residual.txt'), getDefaultSettings());
    const doc = makeDoc();
    const html = r.pages.map(pg => renderPage(pg, getDefaultSettings(), doc, pg.header || null).outerHTML()).join('\n');
    assert(!html.includes('⏎'), 'no ⏎ in output');
  });

  it('NC-10 (D-30): times like 12:30 in body text are NOT marker placeholders (colon safety)', () => {
    const r = typeset(read('nc10_colon_times.txt'), { ...getDefaultSettings(), 'footnote-marker-style': 'decimal' });
    assert(r.contentPreserved === true, '12:30 is not a placeholder split — accounting intact');
    const body = r.pages.flatMap(p => p.columns.flat()).map(l => (l.words || []).join(' ')).join(' ');
    assert(body.includes('12:30'), 'the time stays whole in the body');
  });

  it('NC-11 (user fix): duplicate H7 text in body is NOT h7-conversion-missing', () => {
    const r = typeset(read('nc11_h7_duplicate.txt'), getDefaultSettings());
    assertEq(persisted(r, 'h7-conversion-missing').length, 0, 'anchor-based check — no text-search false positive');
    assert(r.sideNotes.placed.length >= 1, 'the side note itself IS placed');
  });

  it('NC-12 (P1-8, D-37): Hebrew folio uses ״ (gershayim) — never Latin quotes', () => {
    assertEq(toHebrewNumber(15), 'ט״ו', '15 with Hebrew gershayim');
    assertEq(toHebrewNumber(21), 'כ״א', '21');
    assertEq(toHebrewNumber(702), 'תש״ב', '702');
    assertEq(toHebrewNumber(1), 'א׳', '1 single letter with geresh');
    assertEq(toHebrewNumber(5702), 'ה׳תש״ב', 'thousands');
    assert(!toHebrewNumber(15).includes('"'), 'no Latin quotes');
  });

  it('NC-13 (settings-driven): widow/orphan checks OFF ⇒ no findings even when condition present', () => {
    const s = {
      ...getDefaultSettings(),
      'prevent-widows-top': false, 'prevent-widows-bottom': false,
      'prevent-orphans-top': false, 'prevent-orphans-bottom': false
    };
    const r = typeset(read('nc03_terminal_residual.txt'), s);
    assertEq(persisted(r, 'widow-top').length + persisted(r, 'widow-bottom').length
      + persisted(r, 'orphan-top').length + persisted(r, 'orphan-bottom').length, 0,
      'disabled guards report nothing (user choice, not suppression)');
  });

  it('NC-14 (isNoteMarkerWord sanity): ordinary words are NOT markers', () => {
    assert(!isNoteMarkerWord('שלום'), 'ordinary word');
    assert(!isNoteMarkerWord('12:30'), 'time is not a marker');
    assert(!isNoteMarkerWord('תש״ב2026'), 'year-like blob');
    assert(isNoteMarkerWord('א׳'), 'hebrew-geresh marker');
    assert(isNoteMarkerWord('[3]'), 'bracket marker');
    assert(isNoteMarkerWord('(7)'), 'paren marker');
  });

  it('NC-15 (BRZ-15): fn-off (user explicit) keeps note text in the body — not silently dropped', () => {
    const r = typeset(read('nc05_bound_marker.txt'), { ...getDefaultSettings(), 'footnotes-enabled': false });
    assert(r.contentPreserved === true, 'fn-off preserves content');
    const body = r.pages.flatMap(p => p.columns.flat()).map(l => (l.words || []).join(' ')).join(' ').replace(/\uE000/g, ' ');
    assert(/הערה/.test(body), 'the note text is in the body (placeholder)');
  });

  it('NC-16 (offline): engine output is offline-safe (no external references)', () => {
    const r = typeset(read('nc03_terminal_residual.txt'), getDefaultSettings());
    const doc = makeDoc();
    const html = r.pages.map(pg => renderPage(pg, getDefaultSettings(), doc, pg.header || null).outerHTML()).join('\n');
    assert(!/https?:\/\/(?!localhost)/i.test(html), 'no external refs');
  });
});

report('negative-controls');
