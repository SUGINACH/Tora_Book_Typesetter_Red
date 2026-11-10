/* debug/geometry-audit.js — בודק גיאומטריה מתמטי של RED (בלי DOM, בלי דפדפן)
 *
 * פורט של 12 הבדיקות של geometry-audit.js מ-Gold (V21) מ-DOM אל המודל הגיאומטרי
 * ש-RED מייצר בעצמו (geometry-projector → debug/model.js). קלט: model; פלט: findings.
 * יחידות: px, ציר y כלפי מטה. רץ ב-Node וגם בדפדפן (UMD). לא נוגע במנוע.
 *
 * הבדיקות: containment, sibling-overlap, column-balance, widow-orphan,
 * sparse-last-line, overflow-to-footnote, footnote-containment, page-overflow,
 * ornaments, page-fill-ratio, block-gaps, settings-verification.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RedGeometryAudit = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CHECKS = {
    'containment': 'הכלה בגבולות טור/פס/תיבת תוכן',
    'sibling-overlap': 'חפיפה בין אלמנטים',
    'column-balance': 'איזון תחתיות הטורים',
    'widow-orphan': 'אלמנה / יתום / כותרת יתומה',
    'sparse-last-line': 'שורה אחרונה דלילה / מילה בודדת',
    'overflow-to-footnote': 'גלישת גוף לאזור ההערות',
    'footnote-containment': 'הערות שוליים בתוך הגבולות',
    'page-overflow': 'חריגה מגבולות העמוד',
    'ornaments': 'מיקום קישוטים וקו הערות',
    'page-fill-ratio': 'מילוי עמוד (חסר)',
    'block-gaps': 'מרווחים בין שורות/פסקאות',
    'settings-verification': 'התאמה להגדרות'
  };

  // ספים. containment/overlap: RED מדויק (float מתמטי) — 0.5px מכסה עיגולי רוחב (למשל 675 מול 674.65).
  const DEFAULTS = {
    containment: 0.5,
    overlap: 0.5,
    balance: 30,            // Gold TOL.balance — מעליו warn
    balanceMaxPitches: 2,   // מקסימום בלתי-נמנע (אלמנה/יתום min-2): 2·pitch+2 — מעליו error
    sparseLastLine: 0.5,    // Gold TOL.sparseLastLine (יחס דיו שורה אחרונה/ראשונה)
    fillMinRatio: 0.80,     // Gold page-underfill
    fillMinWaste: 100,
    paraGapMax: 16.6,       // פיץ' RED: מרווח פסקה חוקי 2..16px (+0.6)
    pitchTol: 0.6,
    gapInfo: 50, gapWarn: 80, gapHigh: 150, // מדרגות Gold block-gap
    fontTolPt: 0.25,
    cfgTol: 0.05
  };

  const FLOW = new Set(['regular', 'sign-open', 'preface']);
  const MM = 96 / 25.4;
  const PAGE_MM = { A3: [297, 420], A4: [210, 297], A5: [148, 210], B5: [176, 250], Letter: [215.9, 279.4] };

  const r1 = v => Math.round(v * 10) / 10;
  const isBody = l => l.kind === 'paragraph' || l.kind === 'heading';
  const median = a => {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const ovl = (a, b) => ({
    ox: Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
    oy: Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  });
  const inkW = l => (l.inkR != null ? l.inkR - l.inkL : l.w);

  function emit(st, check, sub, severity, page, rect, message, extra) {
    const key = check + ':' + sub + '@p' + page;
    const n = (st.n[key] = (st.n[key] || 0) + 1);
    st.findings.push(Object.assign({
      id: key + '#' + n, check, sub, severity, page,
      rect: rect ? { x: r1(rect.x), y: r1(rect.y), w: r1(rect.w), h: r1(rect.h) } : null,
      message
    }, extra || {}));
  }

  /* ---- הקשר לכל עמוד ---- */
  function pageCtx(p, docPitch) {
    const paras = p.lines.filter(l => l.kind === 'paragraph');
    const fnTop = p.footnotes.length ? Math.min(...p.footnotes.map(f => f.y)) : null;
    const flow = p.lines.filter(l => l.col !== -2 && (isBody(l) || l.band));
    return {
      paras,
      pitch: median(paras.map(l => l.h)) || docPitch,
      fnTop,
      flowBottom: fnTop != null ? fnTop : p.contentBox.bottom,
      maxBottom: flow.length ? Math.max(...flow.map(l => l.y + l.h)) : null,
      bottoms: p.columns.map((c, ci) => {
        const ls = p.lines.filter(l => l.col === ci && isBody(l));
        return ls.length ? Math.max(...ls.map(l => l.y + l.h)) : null;
      }),
      isFlow: paras.length > 0
    };
  }

  /* ---- 1. containment ---- */
  function checkContainment(p, c, st, o) {
    if (!p.columns.length) return;
    const cb = p.contentBox, e = o.containment;
    const left = Math.min(...p.columns.map(k => k.x));
    const right = Math.max(...p.columns.map(k => k.x + k.w));
    p.lines.forEach((l, i) => {
      if (l.col === -2 || l.kind === 'shaar-content') return; // הערות-צד: בגבולות העמוד בלבד
      const k = l.band ? { x: left, w: right - left } : p.columns[l.col];
      if (k && (l.x < k.x - e || l.x + l.w > k.x + k.w + e)) {
        emit(st, 'containment', l.band ? 'band-outside' : 'line-outside-column', 'error', p.index, l,
          'שורה חורגת מ' + (l.band ? 'הפס' : 'הטור') + ': x ' + r1(l.x) + '..' + r1(l.x + l.w) + ' מול ' + r1(k.x) + '..' + r1(k.x + k.w), { line: i });
      }
      if (l.y < cb.top - e) emit(st, 'containment', 'line-above-content-box', 'error', p.index, l, 'שורה מעל תיבת התוכן: y=' + r1(l.y) + ' < ' + r1(cb.top), { line: i });
      if (l.y + l.h > cb.bottom + e) emit(st, 'containment', 'line-below-content-box', 'error', p.index, l, 'שורה מתחת לתיבת התוכן: תחתית=' + r1(l.y + l.h) + ' > ' + r1(cb.bottom), { line: i });
      if (l.ws) {
        for (const w of l.ws) {
          if (w[0] < l.x - e || w[0] + w[1] > l.x + l.w + e) {
            emit(st, 'containment', 'word-outside-line', 'error', p.index, l, 'מילה חורגת מתיבת השורה: x ' + r1(w[0]) + '..' + r1(w[0] + w[1]), { line: i });
            break;
          }
        }
      }
    });
  }

  /* ---- 2. sibling-overlap ---- */
  function checkOverlap(p, c, st, o) {
    const items = [];
    p.lines.forEach((l, i) => items.push({ t: 'line', i, x: l.x, y: l.y, w: l.w, h: l.h, l }));
    p.footnotes.forEach((f, i) => { if (f.h != null) items.push({ t: 'fn', i, x: f.x, y: f.y, w: f.w, h: f.h }); });
    items.sort((a, b) => a.y - b.y);
    for (let a = 0; a < items.length; a++) {
      const A = items[a];
      for (let b = a + 1; b < items.length && items[b].y < A.y + A.h - o.overlap; b++) {
        const B = items[b], v = ovl(A, B);
        if (v.ox <= o.overlap || v.oy <= o.overlap) continue;
        const sub = A.t === 'fn' && B.t === 'fn' ? 'footnote-footnote'
          : (A.t === 'fn' || B.t === 'fn') ? 'footnote-line'
            : (A.l.col === -2 || B.l.col === -2) ? 'sidenote-line' : 'line-line';
        emit(st, 'sibling-overlap', sub, 'error', p.index,
          { x: Math.max(A.x, B.x), y: Math.max(A.y, B.y), w: v.ox, h: v.oy },
          'חפיפה ' + r1(v.ox) + '×' + r1(v.oy) + 'px (' + sub + ')', { items: [A.t + ':' + A.i, B.t + ':' + B.i] });
      }
    }
  }

  /* ---- 3. column-balance ---- */
  function checkBalance(p, c, st, o) {
    if (p.columns.length < 2 || !c.isFlow) return;
    const b = c.bottoms.filter(v => v != null);
    if (b.length < 2) return;
    const top = Math.max(...b), bot = Math.min(...b);
    if (top >= c.flowBottom - c.pitch) return; // טור מלא עד תחתית הזרימה ⇒ הבלוק נמשך לעמוד הבא
    const diff = top - bot;
    if (diff <= o.balance) return;
    const limit = o.balanceMaxPitches * c.pitch + 2;
    const x0 = Math.min(...p.columns.map(k => k.x)), x1 = Math.max(...p.columns.map(k => k.x + k.w));
    emit(st, 'column-balance', 'bottoms-differ', diff > limit ? 'error' : 'warn', p.index,
      { x: x0, y: bot, w: x1 - x0, h: diff },
      'תחתיות הטורים שונות ב-' + r1(diff) + 'px (סף ' + o.balance + ', מקסימום בלתי-נמנע ' + r1(limit) + ')',
      { measured: { bottoms: c.bottoms.map(v => (v == null ? null : r1(v))), diff: r1(diff) } });
  }

  /* ---- 4. widow-orphan (על כל המסמך) ---- */
  function checkWidowOrphan(model, st) {
    const seq = [];
    model.pages.forEach(p => {
      const by = {};
      p.lines.forEach((l, i) => { if (isBody(l)) (by[l.col] = by[l.col] || []).push({ p, l, i, ci: l.col }); });
      Object.keys(by).map(Number).sort((a, b) => a - b).forEach(ci => {
        by[ci].sort((a, b) => a.l.y - b.l.y).forEach(x => seq.push(x));
      });
    });
    // מקטעים: ריצה של שורות פסקה עוקבות עם אותו tokenId באותו (עמוד, טור)
    const segs = new Map();
    let cur = null;
    for (const x of seq) {
      if (x.l.kind !== 'paragraph' || !x.l.tokenId) { cur = null; continue; }
      if (cur && cur.tok === x.l.tokenId && cur.page === x.p.index && cur.ci === x.ci) cur.items.push(x);
      else {
        cur = { tok: x.l.tokenId, page: x.p.index, ci: x.ci, items: [x] };
        if (!segs.has(cur.tok)) segs.set(cur.tok, []);
        segs.get(cur.tok).push(cur);
      }
    }
    for (const [tok, a] of segs) {
      if (a.length < 2) continue;
      const first = a[0], last = a[a.length - 1];
      if (first.items.length === 1) {
        const x = first.items[0];
        emit(st, 'widow-orphan', 'orphan', 'warn', x.p.index, x.l, 'יתום: שורה ראשונה בודדת של פסקה ' + tok + ' בתחתית ' + (x.ci >= 0 ? 'טור ' + (x.ci + 1) : 'הפס'), { line: x.i, token: tok });
      }
      if (last.items.length === 1) {
        const x = last.items[0];
        emit(st, 'widow-orphan', 'widow', 'warn', x.p.index, x.l, 'אלמנה: שורה אחרונה בודדת של פסקה ' + tok + ' בראש ' + (x.ci >= 0 ? 'טור ' + (x.ci + 1) : 'הפס'), { line: x.i, token: tok });
      }
    }
    // כותרת יתומה: כותרת אחרונה בטור כשיש אחריה עוד גוף במסמך (פסים נמצאים בראש העמוד — לא נבדקים)
    seq.forEach((x, k) => {
      if (x.l.kind !== 'heading' || x.ci < 0) return;
      const nx = seq[k + 1];
      if (!nx) return;
      if (nx.p.index === x.p.index && nx.ci === x.ci) return;
      emit(st, 'widow-orphan', 'heading-at-column-end', 'warn', x.p.index, x.l, 'כותרת יתומה: אחרונה בטור וגוף ההמשך בטור/עמוד הבא', { line: x.i });
    });
  }

  /* ---- 5. sparse-last-line (על כל המסמך) ---- */
  function checkSparse(model, st, o) {
    const byTok = new Map();
    model.pages.forEach(p => p.lines.forEach((l, i) => {
      if (l.kind !== 'paragraph' || !l.tokenId) return;
      if (!byTok.has(l.tokenId)) byTok.set(l.tokenId, []);
      byTok.get(l.tokenId).push({ p, l, i });
    }));
    for (const [tok, a] of byTok) {
      if (a.length < 2) continue;
      const f = a[0], z = a[a.length - 1];
      if (!z.l.isLast) continue;
      if (z.l.nWords === 1) {
        emit(st, 'sparse-last-line', 'lone-last-word', 'warn', z.p.index, z.l, 'מילה בודדת בשורה האחרונה של פסקה ' + tok, { line: z.i, token: tok });
      } else if (inkW(f.l) > 0 && inkW(z.l) < o.sparseLastLine * inkW(f.l)) {
        emit(st, 'sparse-last-line', 'short-last-line', 'info', z.p.index, z.l,
          'שורה אחרונה דלילה: דיו ' + r1(inkW(z.l)) + ' מול ' + r1(inkW(f.l)) + 'px בשורה הראשונה', { line: z.i, token: tok });
      }
    }
  }

  /* ---- 6. overflow-to-footnote ---- */
  function checkFnOverflow(p, c, st, o) {
    if (c.fnTop == null) return;
    p.lines.forEach((l, i) => {
      if (l.col === -2) return;
      if (l.y + l.h > c.fnTop + o.overlap) {
        emit(st, 'overflow-to-footnote', 'body-into-footnotes', 'error', p.index, l,
          'גוף חודר לאזור ההערות: תחתית ' + r1(l.y + l.h) + ' > ראש הערות ' + r1(c.fnTop), { line: i });
      }
    });
  }

  /* ---- 7. footnote-containment ---- */
  function checkFnContainment(p, c, st, o) {
    if (!p.footnotes.length || !p.columns.length) return;
    const e = o.containment, cb = p.contentBox;
    const left = Math.min(...p.columns.map(k => k.x)), right = Math.max(...p.columns.map(k => k.x + k.w));
    p.footnotes.forEach((f, i) => {
      const r = { x: f.x, y: f.y, w: f.w, h: f.h == null ? 1 : f.h };
      if (f.x < left - e || f.x + f.w > right + e) emit(st, 'footnote-containment', 'outside-columns-x', 'error', p.index, r, 'הערה חורגת אופקית: x ' + r1(f.x) + '..' + r1(f.x + f.w) + ' מול ' + r1(left) + '..' + r1(right), { fn: i });
      if (f.h != null && f.y + f.h > cb.bottom + e) emit(st, 'footnote-containment', 'below-content-box', 'error', p.index, r, 'הערה חורגת מטה: תחתית ' + r1(f.y + f.h) + ' > ' + r1(cb.bottom), { fn: i });
      if (c.maxBottom != null && f.y < c.maxBottom - e) emit(st, 'footnote-containment', 'above-body-bottom', 'error', p.index, r, 'הערה מתחילה מעל תחתית הגוף: ' + r1(f.y) + ' < ' + r1(c.maxBottom), { fn: i });
    });
  }

  /* ---- 8. page-overflow ---- */
  function checkPageOverflow(p, c, st, o) {
    const W = p.width, H = p.height, e = o.containment;
    const out = r => r.x < -e || r.y < -e || r.x + r.w > W + e || r.y + r.h > H + e;
    p.lines.forEach((l, i) => { if (out(l)) emit(st, 'page-overflow', 'line-outside-page', 'error', p.index, l, 'שורה מחוץ לעמוד', { line: i }); });
    p.footnotes.forEach((f, i) => { if (f.h != null && out(f)) emit(st, 'page-overflow', 'footnote-outside-page', 'error', p.index, f, 'הערה מחוץ לעמוד', { fn: i }); });
    p.decorations.forEach((d, i) => { if (out(d)) emit(st, 'page-overflow', 'decoration-outside-page', 'error', p.index, d, 'קישוט מחוץ לעמוד (' + d.kind + ')', { dec: i }); });
    const k = p.ink;
    if (k && (k.minX < -e || k.minY < -e || k.maxX > W + e || k.maxY > H + e)) {
      emit(st, 'page-overflow', 'ink-outside-page', 'error', p.index, { x: k.minX, y: k.minY, w: k.maxX - k.minX, h: k.maxY - k.minY }, 'דיו חורג מגבולות העמוד', {});
    }
  }

  /* ---- 9. ornaments ---- */
  function checkOrnaments(p, c, st, o) {
    const left = p.columns.length ? Math.min(...p.columns.map(k => k.x)) : 0;
    const right = p.columns.length ? Math.max(...p.columns.map(k => k.x + k.w)) : p.width;
    p.decorations.forEach((d, i) => {
      if (d.kind === 'fn-rule') {
        if (c.fnTop != null && Math.abs(d.y - c.fnTop) > c.pitch) emit(st, 'ornaments', 'fn-rule-misplaced', 'warn', p.index, d, 'קו ההערות רחוק מראש ההערות: ' + r1(d.y) + ' מול ' + r1(c.fnTop), { dec: i });
        if (Math.abs(d.x - left) > 1 || Math.abs(d.x + d.w - right) > 1) emit(st, 'ornaments', 'fn-rule-width', 'warn', p.index, d, 'קו ההערות אינו ברוחב אזור התוכן', { dec: i });
        return;
      }
      if (d.w <= 0 || d.h <= 0) emit(st, 'ornaments', 'ornament-empty', 'error', p.index, d, 'קישוט בגודל אפס (' + d.kind + ')', { dec: i });
      if (!c.isFlow) return; // בעמודי שער/תוכן הקישוט מקיף טקסט במכוון
      p.lines.forEach((l, j) => {
        if (!isBody(l)) return;
        const v = ovl(d, l);
        if (v.ox > o.overlap && v.oy > o.overlap) emit(st, 'ornaments', 'ornament-over-text', 'warn', p.index, { x: Math.max(d.x, l.x), y: Math.max(d.y, l.y), w: v.ox, h: v.oy }, 'קישוט (' + d.kind + ') מכסה טקסט', { dec: i, line: j });
      });
    });
    if (c.fnTop != null && p.type !== 'shaar-main' && !p.decorations.some(d => d.kind === 'fn-rule')) {
      emit(st, 'ornaments', 'fn-rule-missing', 'info', p.index, null, 'יש הערות שוליים אך אין קו מפריד', {});
    }
  }

  /* ---- 10. page-fill-ratio ---- */
  function checkFill(model, ctxs, st, o) {
    model.pages.forEach((p, i) => {
      const c = ctxs[i];
      if (!c.isFlow || !FLOW.has(p.type) || c.maxBottom == null) return;
      const avail = c.flowBottom - p.contentBox.top;
      const ratio = (c.maxBottom - p.contentBox.top) / avail, wasted = c.flowBottom - c.maxBottom;
      const nx = model.pages[i + 1];
      if (!nx || !FLOW.has(nx.type) || nx.chapterOpening) return; // סוף פרק/מסמך — חסר טבעי
      if (wasted >= o.fillMinWaste && ratio < o.fillMinRatio) {
        emit(st, 'page-fill-ratio', 'page-underfill', ratio < 0.7 ? 'warn' : 'info', p.index,
          { x: p.columns.length ? Math.min(...p.columns.map(k => k.x)) : 0, y: c.maxBottom, w: p.width, h: wasted },
          'עמוד חסר: מילוי ' + Math.round(ratio * 100) + '% (נשארו ' + r1(wasted) + 'px) והעמוד הבא ממשיך את הקטע',
          { measured: { fill: Math.round(ratio * 1000) / 1000, wasted: r1(wasted) } });
      }
    });
  }

  /* ---- 11. block-gaps ---- */
  function checkGaps(p, c, st, o) {
    const by = {};
    p.lines.forEach((l, i) => { if (isBody(l) && l.col >= 0) (by[l.col] = by[l.col] || []).push({ l, i }); });
    Object.keys(by).forEach(k => {
      const a = by[k].sort((x, y) => x.l.y - y.l.y);
      for (let j = 1; j < a.length; j++) {
        const A = a[j - 1].l, B = a[j].l, gap = B.y - (A.y + A.h);
        if (gap < -o.overlap) continue; // חפיפה — sibling-overlap
        const rect = { x: A.x, y: A.y + A.h, w: A.w, h: Math.max(gap, 0) };
        if (A.tokenId && A.tokenId === B.tokenId) {
          if (Math.abs(gap) > o.pitchTol) emit(st, 'block-gaps', 'pitch-break', 'error', p.index, rect, 'פיץ\' שבור בתוך פסקה: רווח ' + r1(gap) + 'px בין שורות רצופות', { lines: [a[j - 1].i, a[j].i] });
          continue;
        }
        if (A.kind === 'heading' || B.kind === 'heading') {
          if (gap > o.gapInfo) emit(st, 'block-gaps', 'heading-gap', gap > o.gapWarn ? 'warn' : 'info', p.index, rect, 'מרווח סביב כותרת: ' + r1(gap) + 'px', { lines: [a[j - 1].i, a[j].i] });
        } else if (gap > o.paraGapMax) {
          emit(st, 'block-gaps', 'paragraph-gap', gap > o.gapHigh ? 'error' : 'warn', p.index, rect, 'מרווח בין פסקאות ' + r1(gap) + 'px (חוקי עד ' + o.paraGapMax + ')', { lines: [a[j - 1].i, a[j].i] });
        }
      }
    });
  }

  /* ---- 12. settings-verification ---- */
  function checkSettings(model, ctxs, st, o) {
    const s = model.settings || {};
    const size = PAGE_MM[s['page-size']];
    model.pages.forEach((p, i) => {
      if (size && (Math.abs(p.width - size[0] * MM) > 0.5 || Math.abs(p.height - size[1] * MM) > 0.5)) {
        emit(st, 'settings-verification', 'page-size-mismatch', 'error', p.index, null, 'גודל עמוד ' + r1(p.width) + '×' + r1(p.height) + ' ≠ ' + s['page-size'], {});
      }
      const c = ctxs[i];
      if (!c.isFlow || !FLOW.has(p.type)) return;
      const m = p.margins || {};
      const num = (key, val, exp, tag, msg) => {
        if (exp != null && val != null && Math.abs(val - exp) > o.cfgTol) emit(st, 'settings-verification', tag, 'error', p.index, null, msg + ': ' + r1(val * 100) / 100 + ' ≠ ' + r1(exp * 100) / 100, { setting: key });
      };
      num('margin-top-px', m.top, s['margin-top-px'], 'margin-top-mismatch', 'שוליים עליונים');
      num('margin-bottom-px', m.bottom, s['margin-bottom-px'], 'margin-bottom-mismatch', 'שוליים תחתונים');
      if (s['grid-margin-side-pct'] != null) num('grid-margin-side-pct', m.side, s['grid-margin-side-pct'] / 100 * p.width, 'margin-side-mismatch', 'שולי צד');
      if (s['grid-gutter-pct'] != null) num('grid-gutter-pct', p.gutter, s['grid-gutter-pct'] / 100 * p.width, 'gutter-mismatch', 'מרווח טורים');
      if (p.columns.length === 2 && s['grid-col-width-pct'] != null && m.side != null) {
        const cw = s['grid-col-width-pct'] / 100 * (p.width - 2 * m.side);
        p.columns.forEach(k => num('grid-col-width-pct', k.w, cw, 'column-width-mismatch', 'רוחב טור'));
      }
      if (p.type === 'regular' || p.type === 'sign-open') {
        const fs = s['body-font-size-pt'], lh = s['body-line-height'];
        const bad = c.paras.filter(l => l.sizePt != null && fs != null && Math.abs(l.sizePt - fs) > o.fontTolPt);
        if (bad.length) emit(st, 'settings-verification', 'font-size-mismatch', 'error', p.index, bad[0], bad.length + ' שורות גוף בגודל גופן ≠ ' + fs + 'pt (למשל ' + bad[0].sizePt + 'pt)', { count: bad.length });
        if (lh != null) {
          const badH = c.paras.filter(l => l.sizePt != null && Math.abs(l.h - l.sizePt * 96 / 72 * lh) > o.pitchTol);
          if (badH.length) emit(st, 'settings-verification', 'line-height-mismatch', 'error', p.index, badH[0], badH.length + ' שורות גוף עם גובה ≠ גודל×' + lh + ' (למשל ' + r1(badH[0].h) + 'px)', { count: badH.length });
        }
      }
    });
  }

  /* ---- ממשק ---- */
  /** מחזיר לכל עמוד את האלמנטים מקובצים (תואם את extractGeometry של התכנית). */
  function extractGeometry(model) {
    return model.pages.map(p => ({
      pageNumber: p.index + 1, pageIndex: p.index, type: p.type,
      columns: p.columns.map((c, ci) => Object.assign({}, c, { lines: p.lines.filter(l => l.col === ci) })),
      band: p.lines.filter(l => l.band),
      sideNotes: p.lines.filter(l => l.col === -2),
      footnotes: p.footnotes, decorations: p.decorations
    }));
  }

  function auditModel(model, opts) {
    opts = opts || {};
    const o = Object.assign({}, DEFAULTS, opts.tol);
    const only = opts.only ? new Set(opts.only) : null;
    const on = id => !only || only.has(id);
    const st = { findings: [], n: {} };
    const docPitch = median([].concat(...model.pages.map(p => p.lines.filter(l => l.kind === 'paragraph').map(l => l.h)))) || 20;
    const ctxs = model.pages.map(p => pageCtx(p, docPitch));
    model.pages.forEach((p, i) => {
      const c = ctxs[i];
      if (on('containment')) checkContainment(p, c, st, o);
      if (on('sibling-overlap')) checkOverlap(p, c, st, o);
      if (on('column-balance')) checkBalance(p, c, st, o);
      if (on('overflow-to-footnote')) checkFnOverflow(p, c, st, o);
      if (on('footnote-containment')) checkFnContainment(p, c, st, o);
      if (on('page-overflow')) checkPageOverflow(p, c, st, o);
      if (on('ornaments')) checkOrnaments(p, c, st, o);
      if (on('block-gaps')) checkGaps(p, c, st, o);
    });
    if (on('widow-orphan')) checkWidowOrphan(model, st);
    if (on('sparse-last-line')) checkSparse(model, st, o);
    if (on('page-fill-ratio')) checkFill(model, ctxs, st, o);
    if (on('settings-verification')) checkSettings(model, ctxs, st, o);

    const sev = { error: 0, warn: 1, info: 2 };
    st.findings.sort((a, b) => a.page - b.page || a.check.localeCompare(b.check) || sev[a.severity] - sev[b.severity] || (a.id < b.id ? -1 : 1));
    const byCheck = {}, bySeverity = { error: 0, warn: 0, info: 0 };
    Object.keys(CHECKS).forEach(k => { if (on(k)) byCheck[k] = 0; });
    st.findings.forEach(f => { byCheck[f.check]++; bySeverity[f.severity]++; });
    const metrics = model.pages.map((p, i) => {
      const c = ctxs[i];
      const m = { index: p.index, type: p.type, pitch: r1(c.pitch), bottoms: c.bottoms.map(v => (v == null ? null : r1(v))), flowBottom: r1(c.flowBottom) };
      if (c.isFlow && c.maxBottom != null) m.fill = Math.round((c.maxBottom - p.contentBox.top) / (c.flowBottom - p.contentBox.top) * 1000) / 1000;
      return m;
    });
    return {
      schema: 'red-geometry-audit-v1', params: o,
      summary: { total: st.findings.length, bySeverity, byCheck },
      findings: st.findings, metrics
    };
  }

  return { CHECKS, DEFAULTS, FLOW, auditModel, extractGeometry };
});
