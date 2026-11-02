// tests/unit/parser.test.js — Gate S2: שכבת הפיענוח (REQ-PAR-01..05)
// נכתב מאפס לפי המפרט; כולל וקטורי "מטא־דאטה באמצע המסמך" (לקח Z.ai) וסוגריים מקוננים/חוצי גבול.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { lexDocument, HEADING_RE } = require('../../src/engine/parser/dfa-lexer');
const { scanBrackets } = require('../../src/engine/parser/bracket-scanner');
const { tokenize, contentHash, normalizeText } = require('../../src/engine/parser/block-tokenizer');

describe('REQ-PAR-01 metadata only in preamble', () => {
  it('preamble metadata is captured', () => {
    const doc = 'ספר - משלי\nנושא - דין סוכה\n\nכותרת 1 - פרק א\nטקסט רגיל.';
    const { metadata, bodyLines } = lexDocument(doc);
    assertEq(metadata['ספר'], 'משלי');
    assertEq(metadata['נושא'], 'דין סוכה');
    assert(bodyLines.some(l => l.includes('כותרת 1')), 'heading stays in body');
  });

  it('mid-document `נושא - ...` line remains a PARAGRAPH (Z.ai bug class)', () => {
    const doc = 'ספר - משלי\n\nכותרת 1 - פרק א\nנושא - דין סוכה ישנה באמצע המסמך\n';
    const { metadata, bodyLines } = lexDocument(doc);
    assert(!('נושא' in metadata), 'no metadata leak from body');
    const tokens = tokenize(bodyLines.filter(l => l.trim()));
    const metaLine = tokens.find(t => t.raw && t.raw.startsWith('נושא'));
    assert(metaLine && metaLine.type === 'paragraph', 'mid-doc key-like line is paragraph');
  });

  it('first heading exits preamble even without blank line', () => {
    const doc = 'ספר - משלי\nכותרת 2 - סימן א\nגוף';
    const { metadata, bodyLines } = lexDocument(doc);
    assertEq(metadata['ספר'], 'משלי');
    assert(HEADING_RE.test(bodyLines[0]), 'heading line goes to body');
  });

  it('non-metadata first line closes preamble quietly', () => {
    const doc = 'זו אינה מטא-שורה\nנושא - לא נאסף כי הפתיח נסגר\n';
    const { metadata } = lexDocument(doc);
    assertEq(Object.keys(metadata).length, 0);
  });
});

describe('REQ-PAR-02 balanced bracket scanner', () => {
  it('nested brackets produce correct pair count and no unmatched', () => {
    // 2 פותחים ו‑2 סוגרים בלבד: 'א [ב [ג] ד] ה' — קינון מלא, ללא יתרים
    const segs = [{ text: 'א [ב [ג] ד] ה', paraIndex: 0 }];
    const r = scanBrackets(segs);
    assertEq(r.pairs.length, 2, 'two matched pairs');
    assertEq(r.unmatchedClosers.length, 0);
    assertEq(r.unmatchedOpeners.length, 0);
    const outer = r.pairs.find(p => p.open === 2);
    assert(outer, 'outer pair starts at pos 2');
  });

  it('unmatched closer is REPORTED, never auto-fixed', () => {
    const r = scanBrackets([{ text: 'טקסט ] ללא פותח', paraIndex: 0 }]);
    assertEq(r.unmatchedClosers.length, 1);
    assert(/מקור/.test(r.unmatchedClosers[0].note), 'doctrine note attached');
  });

  it('cross-paragraph ranges are flagged', () => {
    const r = scanBrackets([
      { text: 'פסקה א מתחילה [הערה ש', paraIndex: 0 },
      { text: 'מסתיימת בפסקה ב]', paraIndex: 1 }
    ]);
    assertEq(r.scopeMap.crossParagraphCount, 1);
  });

  it('consecutive pairs [א][ב] remain separate notes (REQ-PAR-04)', () => {
    const tokens = tokenize(['טקסט [א][ב] סוף']);
    const p = tokens[0];
    assertEq(p.notes.length, 2, 'two separate notes');
    assertEq(p.notes[0], 'א');
    assertEq(p.notes[1], 'ב');
    const refCount = p.parts.filter(x => x.kind === 'note-ref').length;
    assertEq(refCount, 2, 'count conservation: two refs');
  });
});

describe('REQ-PAR-03 block tokenizer', () => {
  it('H0–H7 with mandatory dash; no dash = silent paragraph', () => {
    const tokens = tokenize(['כותרת 3 - שלוש', 'כותרת 3 בלי מקף', 'הקדמה - פתיחה', 'חלק א - ראשון']);
    assertEq(tokens[0].type, 'heading'); assertEq(tokens[0].level, 3);
    assertEq(tokens[1].type, 'paragraph', 'dash-less heading line is paragraph');
    assertEq(tokens[2].level, 0, 'הקדמה is H0');
    assertEq(tokens[3].level, 1, 'חלק is H1');
  });

  it('endnote prefix tokenized separately', () => {
    const tokens = tokenize(['הערת סיום - הערה מסדר סוף']);
    assertEq(tokens[0].type, 'endnote');
    assertEq(tokens[0].text, 'הערה מסדר סוף');
  });

  it('editorial ##…## removed entirely but recorded', () => {
    const tokens = tokenize(['גוף ## הערת מערכת ## ממשיך']);
    const ed = tokens.filter(t => t.type === 'editorial');
    assertEq(ed.length, 1, 'editorial recorded');
    const para = tokens.find(t => t.type === 'paragraph');
    assert(para.raw.indexOf('##') === -1, 'no editorial markers survive in paragraph raw');
    assert(!para.raw.includes('הערת מערכת'), 'editorial text stripped from body');
  });

  it('inside-note spaces become atomic U+E000 (measure-only, REQ-LB-04)', () => {
    const tokens = tokenize(['טקסט [הערה ארוכה עם רווחים]']);
    assert(/\uE000/.test(tokens[0].notes[0]), 'atomic space substituted');
  });
});

describe('REQ-PAR-05 character hygiene', () => {
  it('gereshayim normalized one-way to geresh', () => {
    assertEq(normalizeText('טוב\u05F4'), 'טוב\u05F3');
  });
  it('curly latin quotes folded to straight quote', () => {
    assertEq(normalizeText('a\u2018b\u2019c'), 'a"b"c');
  });
});

describe('CP1 content hash (BRZ-15 foundation)', () => {
  it('hash stable for identical documents, differs on content change', () => {
    const a = tokenize(['x [y]', 'כותרת 1 - p']);
    const b = tokenize(['x [y]', 'כותרת 1 - p']);
    const c = tokenize(['x [y z]', 'כותרת 1 - p']);
    assertEq(contentHash(a), contentHash(b));
    assert(contentHash(a) !== contentHash(c), 'content change alters hash');
  });
});

report('parser');
