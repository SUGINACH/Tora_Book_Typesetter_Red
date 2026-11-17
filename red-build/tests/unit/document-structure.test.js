// tests/unit/document-structure.test.js — source document validity (D-100)
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { tokenize } = require('../../src/engine/parser/block-tokenizer');
const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
const {
  validateHeadingStructure,
  DocumentStructureError
} = require('../../src/engine/parser/document-structure');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

function checkBodyLines(lines, opts = {}) {
  return validateHeadingStructure(tokenize(lines, opts), opts);
}

describe('D-100 source document structure', () => {
  it('accepts a complete H1→H2→H3→H4→H5→H6→H7 chain when the deepest section has body text', () => {
    const lines = [1, 2, 3, 4, 5, 6, 7].map(level => 'כותרת ' + level + ' - רמה ' + level);
    lines.push('טקסט גוף ממשי.');
    const result = checkBodyLines(lines);
    assert(result.ok, 'deepest heading is followed by body text');
    assertEq(result.headingCount, 7);
  });
  it('accepts increasing levels with gaps; not every intermediate level is mandatory', () => {
    const result = checkBodyLines([
      'כותרת 1 - חלק', 'כותרת 3 - ענף', 'כותרת 7 - פירוט', 'טקסט ממשי'
    ]);
    assert(result.ok);
  });
  it('rejects consecutive same-level headings even when body text appears later', () => {
    const result = checkBodyLines(['כותרת 4 - ראשון', 'כותרת 4 - שני', 'טקסט ממשי']);
    assert(!result.ok);
    assert(result.issues.some(issue => issue.code === 'heading-chain-not-increasing'));
  });
  it('rejects a shallower heading that closes an empty deeper section', () => {
    const result = checkBodyLines([
      'כותרת 1 - חלק', 'כותרת 2 - סימן', 'כותרת 1 - חלק חדש', 'טקסט ממשי'
    ]);
    assert(!result.ok);
    assert(result.issues.some(issue => issue.code === 'heading-chain-not-increasing'));
  });
  it('does not treat a footnote-only paragraph as body text', () => {
    const result = checkBodyLines(['כותרת 3 - ענף', '[הערת שוליים בלבד]']);
    assert(!result.ok);
    assert(result.issues.some(issue => issue.code === 'heading-chain-no-body-text'));
  });
  it('allows footnote-only material before later real body text in the same section', () => {
    const result = checkBodyLines([
      'כותרת 3 - ענף', '[הערת שוליים בלבד]', 'מכאן מתחיל הטקסט הממשי.'
    ]);
    assert(result.ok);
  });
  it('allows a nested heading chain through footnote-only material, provided the deepest level has body text', () => {
    const result = checkBodyLines([
      'כותרת 1 - חלק', 'כותרת 2 - סימן', '[הערה בלבד]', 'כותרת 3 - ענף', 'טקסט ממשי.'
    ]);
    assert(result.ok);
  });
  it('rejects a heading whose own title consists only of a footnote', () => {
    const result = checkBodyLines(['כותרת 5 - [הערת שוליים בלבד]', 'טקסט גוף ממשי.']);
    assert(!result.ok);
    assert(result.issues.some(issue => issue.code === 'heading-title-note-only'));
  });
  it('rejects punctuation-only heading titles separately from note-only titles', () => {
    const result = checkBodyLines(['כותרת 5 - *', 'טקסט גוף ממשי.']);
    assert(!result.ok);
    assert(result.issues.some(issue => issue.code === 'heading-title-no-meaningful-text'));
  });
  it('counts text in the same paragraph as a footnote as real body text', () => {
    const result = checkBodyLines(['כותרת 2 - סימן', 'מילים בגוף [הערת שוליים] ממשיכות.']);
    assert(result.ok);
  });
  it('reports a typed, actionable error before the layout engine starts', () => {
    let caught = null;
    try {
      typeset('כותרת 2 - סימן ראשון\nכותרת 2 - סימן שני\nטקסט גוף',
        getDefaultSettings(), { noRecommendations: true });
    } catch (error) { caught = error; }
    assert(caught instanceof DocumentStructureError, 'pipeline must throw DocumentStructureError');
    assertEq(caught.code, 'INVALID_DOCUMENT_STRUCTURE');
    assert(/העימוד נעצר לפני שלב המדידה/.test(caught.message));
  });
  it('fixed and random test documents are structurally valid across many seeds', () => {
    const fixedA = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const fixedB = generateTestDocument({ mode: 'fixed', scale: 'small' });
    assertEq(fixedA, fixedB, 'fixed document remains byte-identical');
    const fixed = validateHeadingStructure(tokenize(lexDocument(fixedA).bodyLines));
    assert(fixed.ok, 'fixed generated document is valid');
    for (let seed = 1; seed <= 180; seed++) {
      const generated = generateTestDocument({ mode: 'random', seed, scale: 'small' });
      const result = validateHeadingStructure(tokenize(lexDocument(generated).bodyLines));
      assert(result.ok, 'random generated document seed=' + seed + ' is valid');
    }
  });
});

report('document-structure');
