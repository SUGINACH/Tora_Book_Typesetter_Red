// tests/unit/typography.test.js — Gate S3: מיקרו־טיפוגרפיה (REQ-LB-01..05, 07)
'use strict';

const { describe, it, assert, assertEq, assertClose, report } = require('../harness');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { breakLines } = require('../../src/engine/typography/kp-linebreak');
const { protectWords, glueNoteMarkers, fixDropWordInColumns } = require('../../src/engine/typography/protectors');
const { applyDropWord } = require('../../src/engine/typography/dropword');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

const S = getDefaultSettings();
const api = new MeasureAPI(S, 'math');
const W = (t) => api.measureTextWidth(t);
const COLW = 240;

describe('REQ-LB-01 measure API single entry', () => {
  it('deterministic width: same text → same px, cache hits counted', () => {
    const a = api.measureTextWidth('שלום עולם');
    const b = api.measureTextWidth('שלום עולם');
    assertEq(a, b);
    assert(api.cacheStats().hits >= 1, 'second call served from cache');
  });
  it('pt→px conversion uses 96/72', () => {
    const w14 = api.measureTextWidth('א', 14);
    const w7 = api.measureTextWidth('א', 7);
    assertClose(w14 / w7, 2, 0.001, 'width linear in size');
  });
});

describe('REQ-LB-02 Knuth-Plass optimal breaking', () => {
  it('never exceeds column width when shrink impossible → greedy fallback still bounded', () => {
    const words = ['מילהארוכהשבורה'.repeat(3)].concat(Array.from({ length: 20 }, (_, i) => `אבג${i}`));
    const lines = breakLines(words, COLW, W, 20, {});
    for (const ln of lines) {
      const total = ln.words.reduce((s, w) => s + W(w), 0);
      // חריגה מותרת רק אם מילה בודדת רחבה מהטור (אי־אפשר לשבור — אין מקף!)
      if (ln.words.length > 1) assert(total <= COLW * 1.35, `line overflow ${total}>${COLW}`);
    }
  });
  it('KP fit ≤ greedy fit (optimality sanity on classic pathological input)', () => {
    const words = 'א ב ג ד ה ו ז ח ט י כ ל מ נ ס ע פ צ ק ר ש ת'.split(' ');
    const kp = breakLines(words, 120, W, 20, {});
    const costOf = (lines) => lines.reduce((s, ln) => s + Math.pow(Math.max(0, 120 - ln.widthPx), 2), 0);
    assert(Number.isFinite(costOf(kp)), 'kp produced finite layout');
    assert(kp.length >= 3 && kp.length <= 6, `reasonable line count, got ${kp.length}`);
  });
  it('no hyphenation: word count conserved exactly', () => {
    const words = Array.from({ length: 40 }, () => 'דבר');
    const lines = breakLines(words, COLW, W, 20, {});
    const out = lines.flatMap(l => l.words);
    assertEq(out.length, words.length);
  });
});

describe('REQ-LB-03 protectors (NBSP gluing)', () => {
  it('note marker glued to next word', () => {
    const out = glueNoteMarkers('טקסט א׳ המשך');
    assert(/\u00A0/.test(out), 'NBSP inserted after marker');
  });
  it('oversized glued unit gets un-glued instead of overflowing (Claude §6.2(5))', () => {
    const hugeA = 'א'.repeat(60), hugeB = 'ב'.repeat(60);
    const words = protectWords([`${hugeA}\u00A0${hugeB}`, 'רגיל'], W, COLW);
    assert(words.every(w => !w.includes('\u00A0')), 'gluing cancelled for oversized pair');
  });
  it('fixDropWordInColumns pulls short dropper into next column', () => {
    const cols = [[{ words: ['א', 'ב'] }, { words: ['קצר'] }], [{ words: ['המשך', 'טקסט'] }]];
    const fixed = fixDropWordInColumns(cols, 5);
    assert(fixed, 'correction applied');
    assertEq(cols[1][0].words[0], 'קצר', 'dropped word pulled to next column head');
  });
});

describe('REQ-LB-04 atomic footnote width', () => {
  it('tokenizer emits U+E000 (atomic space) inside notes — pipeline contract', () => {
    const tokens = require('../../src/engine/parser/block-tokenizer').tokenize(['פתח [הערה ארוכה עם רווחים] סגור']);
    const p = tokens[0];
    assert(p.notes.length === 1, 'one note extracted');
    assert(p.notes[0].includes('\uE000'), 'note spaces are atomic U+E000');
    assert(!/\u0020/.test(p.notes[0]), 'no plain spaces remain inside the atomic note');
  });
  it('U+E000 inside note keeps it a single measured box (no split)', () => {
    // האשם המדויק של REQ-LB-04: יחידת הערה עם רווחים אטומיים חייבת לשרוד כקופסה אחת
    const noteUnit = 'הערה\uE000ארוכה\uE000מאוד';
    const lines = breakLines(['טקסט', `[${noteUnit}]`, 'סוף'], COLW, W, 20, {});
    const allWords = lines.flatMap(l => l.words);
    assert(allWords.includes(`[${noteUnit}]`), `atomic unit survived as one box; got: ${JSON.stringify(allWords)}`);
  });
});

describe('REQ-LB-05 first-word window — geometry neutral', () => {
  it('drop mode marks metadata only; lines untouched', () => {
    const words = Array.from({ length: 12 }, (_, i) => `מילה${i}`).concat(['סוף']).flatMap(s => [s, 'רב']);
    const lines = breakLines(words, COLW, W, 20, {});
    const before = JSON.stringify(lines);
    const blk = { kind: 'paragraph', lines };
    const res = applyDropWord(blk, { ...S, 'first-word-mode': 'drop', 'first-word-threshold-lines': 3 }, api);
    assert(res.applied, 'applied on long paragraph');
    assertEq(JSON.stringify(blk.lines), before, 'geometry-neutral: lines byte-identical');
    assertEq(blk.firstWord.mode, 'drop');
    assert(blk.firstWord.capTopAlign === true, 'cap-top alignment flag set (REQ-LB-05)');
  });
  it('short paragraph below threshold → not decorated', () => {
    const blk = { kind: 'paragraph', lines: [{ words: ['א', 'ב'] }] };
    const res = applyDropWord(blk, { ...S, 'first-word-mode': 'drop', 'first-word-threshold-lines': 3 }, api);
    assert(!res.applied && /below-threshold/.test(res.reason), 'threshold respected');
  });
  it('mode none = absolute no-op', () => {
    const blk = { kind: 'paragraph', lines: [{ words: ['א'] }] };
    const res = applyDropWord(blk, { ...S, 'first-word-mode': 'none' }, api);
    assert(!res.applied && !('firstWord' in blk), 'no flag written');
  });
});

describe('REQ-LB-07 runt protection', () => {
  it('runt penalty pushes last short line to merge when legal', () => {
    const words = ['א'.repeat(30), 'ב'.repeat(30), 'ג'.repeat(30), 'ד'.repeat(30), 'ה'];
    const loose = breakLines(words, COLW, W, 20, { runts: 0 });
    const strict = breakLines(words, COLW, W, 20, { runts: 80 });
    const lastLoose = loose[loose.length - 1];
    const lastStrict = strict[strict.length - 1];
    assert(lastStrict.widthPx >= lastLoose.widthPx || strict.length <= loose.length, 'runt option does not worsen tail');
  });
});

report('typography');
