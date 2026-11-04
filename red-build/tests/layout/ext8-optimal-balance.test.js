// tests/layout/ext8-optimal-balance.test.js — EXT-8: הוכחת אופטימליות החלוקה הגלובלית
// שלוש שכבות הוכחה:
//  1. מיצוי-כוח (brute force): על מופעים אקראיים דטרמיניסטיים (LCG) — הפיצול
//     ש-optimalSplit בוחר שווה למינימום של ספירת כל הפיצולים החוקיים-קיבולתית.
//  2. תכונה: אופטימלי ≤ גרידי — |Δ| אחרי optimalSplit אינו עולה על זה של
//     האלגוריתם הגרידי ההיסטורי (moveLineForward עד עצירה) על אותו מופע.
//  3. קיבולת וסדר-קריאה: הפיצול שנבחר אינו חורג מהקיבולת ושומר על רצף seq.
'use strict';
const { describe, it, assert, assertEq, report } = require('../harness');
const { optimalSplit, balancePage, pageImbalance, usedHeight } = require('../../src/engine/layout/balancing');

/** LCG דטרמיניסטי — מופעים אקראיים בלי Math.random (REQ-GOV determinism). */
function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function mkPage(cols, cap = 500) {
  return { index: 0, type: 'regular', columns: cols.map(c => c.slice()), template: { contentBox: { height: cap }, columns: [{ x: 0, w: 300 }, { x: 310, w: 300 }] } };
}
const ln = (h) => ({ heightPx: h, words: ['x'], meta: { tokenId: 't' } });

describe('EXT-8 — חלוקה גלובלית אופטימלית: הוכחה מתמטית', () => {
  /** שכפול מדויק של פרדיקט הגבול-הנקי (ריצות tokenId) עבור המיצוי-כוח. */
  const bruteClean = (seq, k) => {
    const n = seq.length;
    if (k > 0 && k < n) {
      const lt = seq[k - 1].meta && seq[k - 1].meta.tokenId;
      const rt = seq[k].meta && seq[k].meta.tokenId;
      if (lt != null && lt === rt) {
        if (k - 2 < 0 || (seq[k - 2].meta && seq[k - 2].meta.tokenId) !== lt) return false;
        if (k + 1 >= n || (seq[k + 1].meta && seq[k + 1].meta.tokenId) !== rt) return false;
      }
    }
    return true;
  };

  it('מיצוי-כוח: הפיצול שנבחר = המינימום הגלובלי על כל הפיצולים החוקיים (2×200 מופעים — בלוקים נפרדים ובלוק משותף)', () => {
    const rnd = lcg(20261104);
    for (let trial = 0; trial < 400; trial++) {
      const sharedBlock = trial >= 200; // מחצית שנייה: כל השורות בלוק אחד (ווידוא/יתום רלוונטיים)
      const n = 2 + Math.floor(rnd() * 18); // 2..19 שורות
      const k0 = 1 + Math.floor(rnd() * (n - 1)); // פיצול התחלתי
      const seq = Array.from({ length: n }, (_, i) => ({
        heightPx: 10 + Math.floor(rnd() * 40),
        words: ['x'],
        meta: { tokenId: sharedBlock ? 'same' : 't' + i }
      }));
      const cols = [seq.slice(0, k0), seq.slice(k0)];
      const cap = 100 + rnd() * 400; // קיבולת משתנה — לפעמים מגבילה
      const extraLast = rnd() < 0.5 ? Math.floor(rnd() * 60) : 0;
      const best = optimalSplit(cols, { cap, extraLast });
      // מיצוי-כוח: כל k אפשרי, אותו סדר לקסיקוגרפי (clean → Δ → תנועה מינימלית)
      const total = seq.reduce((s, l) => s + l.heightPx, 0);
      let brute = null;
      for (let k = 0; k <= n; k++) {
        const H0 = seq.slice(0, k).reduce((s, l) => s + l.heightPx, 0);
        const H1 = total - H0 + extraLast;
        if (H0 > cap + 0.5 || H1 > cap + 0.5) continue;
        const score = (bruteClean(seq, k) ? 0 : 1) * 1e9 + Math.abs(H0 - H1);
        if (!brute || score < brute.score - 1e-9 || (Math.abs(score - brute.score) <= 1e-9 && Math.abs(k - k0) < Math.abs(brute.k - k0))) brute = { k, score, d: Math.abs(H0 - H1) };
      }
      if (!brute) { assertEq(best, null, `trial ${trial}: no legal split — both agree`); continue; }
      assert(best != null, `trial ${trial}: optimalSplit must find the legal split`);
      assertEq(best.k, brute.k, `trial ${trial} (${sharedBlock ? 'shared-block' : 'separate-blocks'}): k optimal ${best.k} = brute-force ${brute.k} (n=${n},cap=${cap.toFixed(0)})`);
      assert(Math.abs(best.delta - brute.d) < 1e-9, `trial ${trial}: delta equal`);
    }
  });

  it('תכונה: אופטימלי ≤ גרידי תמיד (150 מופעים — כולל מקרים שהגרידי נתקע בקיבולת)', () => {
    const rnd = lcg(777);
    const greedy = (cols, cap) => { // שחזור האלגוריתם ההיסטורי
      const page = mkPage(cols, cap);
      let guard = 0;
      while (pageImbalance(page) > 5 && guard++ < 500) {
        const a = usedHeight(page.columns[0]), b = usedHeight(page.columns[1]);
        const hi = a >= b ? 0 : 1, lo = 1 - hi;
        if (hi === 0) { if (!page.columns[0].length) break; page.columns[1].unshift(page.columns[0].pop()); }
        else { if (!page.columns[1].length) break; page.columns[0].push(page.columns[1].shift()); }
        if (page.columns.some(c => usedHeight(c) > cap + 0.5)) return null; // rollback
      }
      return pageImbalance(page);
    };
    for (let trial = 0; trial < 150; trial++) {
      const n = 4 + Math.floor(rnd() * 16);
      const k0 = 1 + Math.floor(rnd() * (n - 1));
      // בלוקים נפרדים לכל שורה (כל גבול נקי) — מבודד את תכונת |Δ|-המינימלי;
      // ההעדפה הלקסיקוגרפית (נקי לפני |Δ|) מוכחת במבחן הייעודי שלה.
      const seq = Array.from({ length: n }, (_, i) => ({ heightPx: 10 + Math.floor(rnd() * 40), words: ['x'], meta: { tokenId: 't' + i } }));
      const cols = [seq.slice(0, k0), seq.slice(k0)];
      const cap = 120 + rnd() * 400;
      const g = greedy(cols, cap);
      const page = mkPage(cols, cap);
      const r = balancePage(page, 5);
      const opt = r.after;
      if (g == null) continue; // גרידי התגלגל — האופטימלי חייב להיות כפוף לאותה קיבולת
      assert(opt <= g + 1e-9, `trial ${trial}: optimal ${opt.toFixed(1)} ≤ greedy ${g.toFixed(1)} (n=${n},cap=${cap.toFixed(0)})`);
    }
  });

  it('החלפה בפועל: קיבולת שני הטורים נשמרת וסדר הקריאה (seq) נשמר', () => {
    const rnd = lcg(42);
    let acted = 0;
    for (let trial = 0; trial < 100; trial++) {
      const n = 6 + Math.floor(rnd() * 14);
      const k0 = 1 + Math.floor(rnd() * (n - 1));
      const seq = Array.from({ length: n }, (_, i) => ({ heightPx: 10 + Math.floor(rnd() * 40), words: ['w' + i], meta: { tokenId: 't' + i } }));
      const cols = [seq.slice(0, k0), seq.slice(k0)];
      const cap = 200 + rnd() * 300;
      // חוזה האיזון: הוא אינו מתקן גלישת-קיבולת קיימת (זו עבודת המתכנן) —
      // האינווריאנט נבדק רק כשהמצב המקורי חוקי.
      if (cols.some(c => usedHeight(c) > cap + 0.5)) continue;
      const page = mkPage(cols, cap);
      const r = balancePage(page, 5);
      if (r.changed) acted++;
      const flat = [...page.columns[0], ...page.columns[1]];
      assertEq(flat.length, n, `trial ${trial}: no line lost`);
      assert(flat.every((l, i) => l.words[0] === 'w' + i), `trial ${trial}: reading order preserved`);
      assert(page.columns.every(c => usedHeight(c) <= cap + 0.5), `trial ${trial}: capacity holds on both columns`);
    }
    assert(acted > 30, `sanity: the sweep actually rebalanced (${acted}/100) — the property was exercised`);
  });

  it('גבול-תפר נקי מועדף על פני |Δ| קטן יותר עם widow (לקסיקוגרפי)', () => {
    // rA:20 | fB:10, rB:10, rB2:20 — הפיצול k=2 נותן Δ=0 אבל משאיר את שורת-הפתח
    // של בלוק-B (fB, part='first') לבדה בתחתית col0 (widow-bottom לפי הגדרת
    // CHECKS.widowOrphan); k=1/k=3 נקיים עם Δ=20. ההעדפה הלקסיקוגרפית דורשת
    // נקי-לפני-|Δ|; תנועה מינימלית מ-k0=1 קובעת k=1.
    const rA = { heightPx: 20, words: ['rA'], meta: { tokenId: 'A', part: 'rest' } };
    const fB = { heightPx: 10, words: ['fB'], meta: { tokenId: 'B', part: 'first' } };
    const rB = { heightPx: 10, words: ['rB'], meta: { tokenId: 'B', part: 'rest' } };
    const rB2 = { heightPx: 20, words: ['rB2'], meta: { tokenId: 'B', part: 'rest' } };
    const cols = [[rA], [fB, rB, rB2]]; // k0=1
    const best = optimalSplit(cols, { cap: 1000 });
    assertEq(best.k, 1, 'clean boundary (Δ=20) preferred over widow-bottom (Δ=0)');
    assertEq(best.clean, true);
    assert(best.delta > 0, 'the clean split is not the |Δ|-min — lexicographic order proven');
  });

  it('כבר מאוזן (Δ≤maxDelta) — אין התערבות (יציבות פריסה והיפוך hash)', () => {
    const cols = [[ln(50), ln(50)], [ln(50), ln(50)]];
    const page = mkPage(cols);
    const r = balancePage(page, 5);
    assertEq(r.changed, false, 'balanced page untouched');
    assertEq(page.columns[0].length, 2, 'split unchanged');
  });
});

report('ext8-optimal-balance');
