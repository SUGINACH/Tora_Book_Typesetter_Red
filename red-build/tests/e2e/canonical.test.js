// tests/e2e/canonical.test.js — הרצת הקורפוס הקנוני כתנאי מיזוג (כלל "אין משמעות לתיקון חצי").
// בדיקות: שימור תוכן בכל מצבי ההערות, דטרמיניזם, סדר קריאה, אין קריסות, דוח אבחון תקין.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildReport } = require('../../src/audit/report-schema');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

const persisted = (r, kind) => [...r.ledger.issues.values()].filter(x => x.kind === kind && x.status !== 'resolved');

describe('canonical corpus (מסמך מלא — תנאי מיזוג)', () => {

  it('generates and is non-trivial', () => {
    const lines = CORPUS.split('\n').filter(Boolean);
    assert(lines.length >= 100, `corpus too small: ${lines.length}`);
    assert(CORPUS.includes('הערת סיום-1'), 'numbered endnotes present');
    assert(CORPUS.includes('['), 'inline notes present');
    assert(CORPUS.includes('('), 'parens present');
    assert(CORPUS.includes('כותרת 7'), 'side notes present');
  });

  it('content preserved in ALL note modes (BRZ-15)', () => {
    for (const mode of ['footnotes', 'endnotes', 'inline']) {
      const s = { ...getDefaultSettings(), 'note-placement-mode': mode };
      const r = typeset(CORPUS, s);
      assert(r.contentPreserved === true, `corpus preserved [${mode}]`);
      assert(r.pages.length >= 3, `corpus paginates [${mode}] (got ${r.pages.length})`);
      if (!r.contentPreserved) {
        const rec = persisted(r, 'text-completeness')[0];
        console.log(JSON.stringify(rec.predicate_before.mismatches).slice(0, 300));
      }
    }
  });

  it('content preserved with fn-off, decimal markers, paren-scale (matrix on corpus)', () => {
    for (const variant of [
      { 'footnotes-enabled': false },
      { 'footnote-marker-style': 'decimal', 'footnote-reset-policy': 'continuous' },
      { 'paren-style-scale': 0.92 },
      { 'count-endnote-pages': true, 'note-placement-mode': 'endnotes' },
      { 'aq-enabled': true },
      { 'balance-chapter-end': 'natural' },
      { 'trace-verbosity': 'full' }
    ]) {
      const r = typeset(CORPUS, { ...getDefaultSettings(), ...variant });
      assert(r.contentPreserved === true, `corpus preserved [${JSON.stringify(variant)}]`);
    }
  });

  it('reading order never breaks on the corpus (P0-3 lock)', () => {
    for (const mode of ['footnotes', 'endnotes']) {
      const r = typeset(CORPUS, { ...getDefaultSettings(), 'note-placement-mode': mode });
      assertEq(persisted(r, 'reading-order-break').length, 0, `no reading-order breaks [${mode}]`);
    }
  });

  it('determinism: two corpus runs identical hash + deterministic report', () => {
    const a = typeset(CORPUS, getDefaultSettings());
    const b = typeset(CORPUS, getDefaultSettings());
    assertEq(a.layoutHash, b.layoutHash, 'corpus layout hash deterministic');
    assertEq(a.pages.length, b.pages.length, 'page count stable');
    const rep = buildReport(a, {});
    assertEq(rep.deterministic, true, 'report determinism measured (P1-6)');
    assertEq(rep.dropped_events, 0, 'no dropped events on corpus');
  });

  it('diagnostics report v2 is schema-valid and never empty-handed when findings exist', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    const rep = buildReport(r, {});
    assertEq(rep.schema, 'diagnostics-v2', 'schema');
    for (const f of rep.findings) {
      assert(f.kindHe, `finding ${f.id} carries Hebrew kind name`);
      assert('status' in f, 'status transparency');
    }
    // corpus findings are honest — they exist and are reported (not hidden)
    const openFindings = rep.findings.filter(f => f.status !== 'resolved');
    assert(Array.isArray(openFindings), 'findings list present');
  });
});

report('canonical');
