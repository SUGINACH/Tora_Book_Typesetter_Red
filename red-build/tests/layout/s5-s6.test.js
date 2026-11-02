// tests/layout/s5-s6.test.js — S5+S6 Gate units (written from scratch per spec/02):
// candidate HARD-reject + ledger evidence, protections after mutation, retreat-loop oscillation,
// footnote probe==reserved identity (F-17), long-note policy, AQ bounds + overshoot clamp.
'use strict';
const { describe, it, assert, assertEq, report } = require('../harness');
const { generateCandidates } = require('../../src/engine/layout/candidate-generator');
const { runProtections } = require('../../src/engine/layout/protections-matrix');
const { runRetreatLoop } = require('../../src/engine/layout/retreat-loop');
const { getFootnotesReservedHeight, noteHeight } = require('../../src/engine/layout/footnote-budget');
const { autoQualityPass } = require('../../src/engine/layout/balancing');
const { Ledger } = require('../../src/engine/core/ledger');
const { EventLog } = require('../../src/engine/core/events');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

const measure = (t) => t.length * 6; // מודד סינתטי דטרמיניסטי
const ln = (h, meta = {}) => ({ heightPx: h, words: ['x'], ...meta });
const S = { ...getDefaultSettings() };

describe('S5.1.2 candidate generator', () => {
  it('overflow candidates are HARD-rejected and ledgered with capacity evidence', () => {
    const ledger = new Ledger();
    const blk = { tokenId: 't1', lineHeightPx: 20, lines: [ln(20), ln(20), ln(20), ln(20)] };
    const cands = generateCandidates(blk, 4, 50, S, ledger); // cap 50 → cut≥3 חורג
    for (const c of cands) assert(c.before <= 50, `overflow leaked: ${JSON.stringify(c)}`);
    const rejected = [...ledger.issues.values()].filter(r => r.kind === 'candidate-rejected');
    assert(rejected.length >= 1, 'every rejection must be written to ledger (S5.1.10)');
    assertEq(rejected[0].predicate_before.why, 'overflow-before');
    assert(Number.isInteger(rejected[0].predicate_before.cap));
  });
  it('candidates sorted by score ascending (deterministic)', () => {
    const blk = { tokenId: 't2', lineHeightPx: 20, lines: [ln(20), ln(20), ln(20), ln(20), ln(20)] };
    const cands = generateCandidates(blk, 5, 200, S, new Ledger());
    for (let i = 1; i < cands.length; i++) assert(cands[i].score >= cands[i - 1].score);
  });
});

describe('S5.1.4 protections matrix fires after mutation', () => {
  function mkPage(columns) {
    return { index: 0, type: 'regular', columns, template: { contentBox: { height: 500 }, columns: [{ x: 0, w: 300 }] } };
  }
  it('single-line paragraph ending a column → orphan/widow boundary violation', () => {
    const page = mkPage([[
      ln(20, { meta: { part: 'rest', tokenId: 'pA' } }),
      ln(20, { meta: { part: 'first', tokenId: 'pB' } })
    ]]);
    const { violations } = runProtections(page, S, new Ledger());
    assert(violations.some(x => x.kind === 'orphan-bottom' || x.kind === 'widow-bottom'),
      `expected boundary violation, got ${JSON.stringify(violations.map(x => x.kind))}`);
  });
  it('heading with <2 following lines → heading-escort', () => {
    const page = mkPage([[{ kind: 'heading', level: 2, heightPx: 30, words: ['כותרת'], tokenId: 'h1' }, ln(20, { meta: {} })]]);
    const { violations } = runProtections(page, S, new Ledger());
    assert(violations.some(x => x.kind === 'heading-escort'));
  });
  it('column beyond capacity → containment (hard, not soft)', () => {
    const tall = Array.from({ length: 30 }, () => ln(20));
    const { violations } = runProtections(mkPage([tall]), S, new Ledger());
    assert(violations.some(x => x.kind === 'containment'));
  });
});

describe('S5.1.5 unified retreat loop (K-3)', () => {
  function ctxWith(sigsPerIter, overrides = {}) {
    const ledger = new Ledger(), eventLog = new EventLog('full');
    let i = 0;
    const settings = { ...S, ...overrides };
    const assess = () => {
      const sigs = sigsPerIter[Math.min(i, sigsPerIter.length - 1)]; i++;
      return sigs.map(s => ({ kind: s.kind, target: s.target }));
    };
    const noop = () => {};
    return { ctx: { pages: [{ index: 0 }], settings, ledger, eventLog, assess, repairFns: {
      'widow-bottom': noop, 'orphan-top': noop, 'paren-cross-boundary': noop, 'heading-escort': noop, 'column-imbalance': noop } }, ledger };
  }
  it('converges when violations clear', () => {
    const { ctx } = ctxWith([[{ kind: 'widow-bottom', target: 'a' }], []]);
    assertEq(runRetreatLoop(ctx).converged, true);
  });
  it('oscillation → freeze compromise + ledger competing-repair-side-effect', () => {
    const same = [{ kind: 'column-imbalance', target: 'z' }];
    const { ctx, ledger } = ctxWith([same, same, same]);
    const r = runRetreatLoop(ctx);
    assertEq(r.converged, false);
    assert(r.compromise, 'compromise issue id expected');
    const rec = ledger.issues.get(r.compromise);
    assertEq(rec.kind, 'rollback-compromise');
    assertEq(rec.status, 'competing-repair-side-effect');
  });
  it('D-43 (תיקון P1-4): diagnostics-enabled=false NEVER suppresses ledger records', () => {
    // בעבר המפתח דיכא רישומי ממצאים — הפרה מפורשת של כללי העבודה
    // ("לא להשבית אבחון; לא להסתיר ממצאים"). כעת: הממצאים נרשמים תמיד;
    // המפתח שולט בפירוט הדוח בלבד (buildReport compact).
    const same = [{ kind: 'column-imbalance', target: 'z' }];
    const { ctx, ledger } = ctxWith([same, same, same], { 'diagnostics-enabled': false });
    const r = runRetreatLoop(ctx);
    assert(r.compromise, 'compromise must be recorded even with diagnostics off');
    assert(ledger.issues.size > 0, 'findings are never suppressed');
  });
});

describe('S6.1.1 footnote budget — probe == reserved identity (F-17)', () => {
  const base = { ...S, _fnColWidthPx: 200 };
  const notes = [{ text: 'הערה קצרה' }, { text: 'הערה ארוכה יותר עם מילים נוספות שיישברו לשורות' }];
  it('1 column: reserved equals sum of per-note probes', () => {
    const s = { ...base, 'footnote-columns': 1 };
    const probeSum = notes.reduce((a, n) => a + noteHeight(n, s, measure), 0);
    assertEq(getFootnotesReservedHeight(notes, s, measure), probeSum);
  });
  it('2 columns: reserved = max LPT lane, never the naive sum', () => {
    const s = { ...base, 'footnote-columns': 2 };
    const hs = notes.map(n => noteHeight(n, s, measure));
    const r = getFootnotesReservedHeight(notes, s, measure);
    assert(r >= Math.max(...hs) && r <= hs.reduce((a, b) => a + b, 0));
  });
  it('disabled → reserve nothing', () => {
    assertEq(getFootnotesReservedHeight(notes, { ...base, 'footnotes-enabled': false }, measure), 0);
  });
});

describe('S6.1.2 long-footnote policy (REQ-FN-02) — real path via dp-planner', () => {
  const { typeset } = require('../../src/engine/core/pipeline');
  // הערה ארוכה מאוד + תקרת מרזב נמוכה ⇒ מדיניות split/move-whole/reject-to-body
  const longNote = 'תוכן הערה ארוך מאוד '.repeat(60).trim();
  const doc = 'כותרת 1 - חלק\nפסקת הגוף עם הערה [' + longNote + '] ועוד קצת טקסט למילוי.\n' + 'פסקה נוספת למילוי עמודים '.repeat(40);
  function run(policy) {
    const s = { ...getDefaultSettings(), 'long-footnote-policy': policy, 'fn-bar-max-height-px': 120, 'footnote-reset-policy': 'continuous' };
    return typeset(doc, s);
  }
  it('split: first segment on this page, continuation marked on the next', () => {
    const r = run('split');
    assert(r.contentPreserved === true, 'split must never lose words');
    const fns = r.pages.flatMap(p => p.footnotes);
    const conts = fns.filter(n => n.isContinuation || n.mode === 'split-rest');
    assert(conts.length >= 1, 'expected a continuation segment');
    const joined = fns.map(n => n.text).join(' ');
    assert(joined.replace(/\s+/g, ' ').includes(longNote.replace(/\s+/g, ' ').slice(0, 40)), 'full note text present across segments');
  });
  it('move-whole defers entire note to the next page', () => {
    const r = run('move-whole');
    assert(r.contentPreserved === true, 'move-whole must never lose words');
    const withNote = r.pages.filter(p => p.footnotes.length);
    assert(withNote.length >= 1);
    // הערה אחת שלמה במקום אחד — לא מפוצלת
    const all = r.pages.flatMap(p => p.footnotes);
    assert(all.every(n => !n.isContinuation), 'no continuation segments in move-whole');
    assert(all.some(n => (n.text || '').length > 100), 'the whole long note lives somewhere');
  });
  it('reject-to-body: full text returns to the body as placeholder (BRZ-15)', () => {
    const r = run('reject-to-body');
    assert(r.contentPreserved === true, 'reject-to-body must never lose words');
    // הטקסט חוזר לגוף כplaceholder — נמצא בשורות הגוף של הפלט
    const bodyText = r.pages.flatMap(p => p.columns.flat()).map(l => (l.words || []).join(' ')).join(' ').replace(/\uE000/g, ' '); // placeholder separator scrubbed (D-30)
    assert(bodyText.replace(/\s+/g, ' ').includes(longNote.slice(0, 30).replace(/\s+/g, ' ')), 'note text is in the body');
    const rejected = r.pages.flatMap(p => p.footnotes).filter(n => n.mode === 'split-first' || n.isContinuation);
    assertEq(rejected.length, 0, 'nothing left in the bar');
  });
});

describe('S6.1.4 AutoQuality bounds + overshoot clamp (REQ-BAL-06/07)', () => {
  function mkPage(cap) {
    const lines = Array.from({ length: 8 }, (_, i) => ({ heightPx: 20, words: ['מילה'], tokenId: `t${i}` }));
    return { index: 0, type: 'regular', template: { contentBox: { height: cap }, columns: [{ x: 0, w: 300 }] }, columns: [lines], footnotes: [], sideNotes: [] };
  }
  it('stretch factor never leaves declared registry bounds', () => {
    const page = mkPage(400); // deficit עצום → חייב להיצמד לתקרה
    autoQualityPass([page], { ...S, 'aq-enabled': true }, new EventLog('full'));
    const lo = S['aq-word-spacing-min'], hi = S['aq-word-spacing-max'];
    for (const l of page.columns[0]) {
      if (l.aqStretch !== undefined) assert(l.aqStretch >= lo - 1e-9 && l.aqStretch <= hi + 1e-9, `AQ out of bounds: ${l.aqStretch}`);
    }
  });
  it('overshoot clamp: stretched height ≤ cap + clamp px', () => {
    const page = mkPage(180);
    autoQualityPass([page], { ...S, 'aq-enabled': true }, new EventLog('full'));
    const cap = page.template.contentBox.height;
    const stretched = page.columns[0].reduce((s, l) => s + l.heightPx * (l.aqStretch || 1), 0);
    assert(stretched - cap <= S['aq-overshoot-clamp-px'] + 1e-6, `overshoot ${stretched - cap}px`);
  });
  it('aq-disabled → complete no-op (mutation-proof)', () => {
    const page = mkPage(400);
    const before = JSON.stringify(page.columns);
    assertEq(autoQualityPass([page], { ...S, 'aq-enabled': false }, new EventLog('full')).applied, 0);
    assertEq(JSON.stringify(page.columns), before);
  });
});

report('layout-s5-s6');
