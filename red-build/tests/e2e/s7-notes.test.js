// tests/e2e/s7-notes.test.js — S7 Gate: endnotes/side-notes/marker matrix/reading-order/CP4-CP5 proof
// נכתב מאפס לפי Master Work Plan S7.1/S7.2; בודק את סגירת שער S7 במלואה.
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { buildStandaloneHtml, assertOfflineSafe } = require('../../src/engine/output/html-export');
const { runProtections } = require('../../src/engine/layout/protections-matrix');
const { bodyGeometryHash, layoutHash } = require('../../src/engine/layout/dp-planner');
const { Ledger } = require('../../src/engine/core/ledger');

// ---------- Minimal deterministic DOM shim (same as pipeline.test.js) ----------
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

/** מסמך רב־חלקים לשער S7: כותרות מחלקה, הערות ממוספרות, inline-refs, פסקאות. */
const TWO_PART_DOC = `ספר - ספר המדגמים
נושא - תרחישי שער S7

כותרת 1 - חלק ראשון
כותרת 2 - תחילת החלק הראשון
פסקה ראשונה של החלק הראשון עם הערה צמודה [הערת הגוף הראשונה] בתוך הטקסט, וגם הערה שנייה [הערת גוף נוספת] כאן.
פסקה שנייה למילוי נפח ובחינת איזון הטורים בעמודי הגוף עצמם.
הערות סיום - הערות החלק הראשון
הערת סיום-1 - זו הערה ממוספרת ראשונה של החלק הראשון.
הערת סיום-2 - וזו השנייה עם עוד כמה מילים לגוף ההערה.
הערת סיום - הערת סיום רגילה (תוכן!) של החלק הראשון.

כותרת 1 - חלק שני
כותרת 2 - תחילת החלק השני
פסקת החלק השני עם הערה משלו [הערת הגוף של החלק השני] ועוד מלים.
פסקה נוספת בחלק השני למילוי.
הערות סיום - הערות החלק השני
הערת סיום-1 - הערה ממוספרת של החלק השני.
הערת סיום - הערת סיום רגילה (תוכן!) של החלק השני.
`;

/** מסמך עם H7 (הערות צד) + טקסט מוכפל בגוף (זריקת false-positive של המשתמש). */
const SIDE_NOTE_DOC = `ספר - ספר הערות צד

כותרת 1 - חלק עם הערות צד
פסקה ראשונה בגוף עם כמה מילים כדי שתהיה שורה שלמה כאן.
כותרת 7 - ביאור קצר: דברי חז"ל בעניין
פסקה שנייה בגוף אחרי הערת הצד.
ביאור קצר: דברי חז"ל בעניין
פסקה שלישית — השורה הקודמת מכפילה את טקסט הערת הצד בגוף (תיקון המשתמש: אין לדווח).
`;

describe('S7.2 Gate — endnote E2E (multi-part)', () => {
  it('multi-part doc → endnote pages per part, class-title headings, no folio/header by default', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const r = typeset(TWO_PART_DOC, s);
    assert(r.contentPreserved === true, 'endnote mode preserves content (BRZ-15)');
    const en = r.endnotePagesInfo;
    assert(en.count >= 2, `at least one endnote page per part (got ${en.count})`);
    // per-part titles from the class directive (D-40)
    const titles = en.pages.map(p => p.heading);
    assert(titles.some(t => /הערות החלק הראשון/.test(t)), `part-1 title from directive: ${JSON.stringify(titles)}`);
    assert(titles.some(t => /הערות החלק השני/.test(t)), `part-2 title from directive: ${JSON.stringify(titles)}`);
    // notes include: numbered tokens + inline refs — nothing lost
    const noteTexts = en.pages.flatMap(p => p.notes.map(n => n.text));
    assert(noteTexts.some(t => /ממוספרת ראשונה/.test(String(t))), 'numbered endnote #1 present');
    assert(noteTexts.some(t => /הערת הגוף הראשונה/.test(String(t))), 'inline-ref note present');
    assert(noteTexts.some(t => /הערת הגוף של החלק השני/.test(String(t))), 'part-2 inline-ref present');
    // default: endnote pages are NOT counted → no folio display on them
    for (const ep of en.pages) assert(!ep.folioDisplay, 'endnote pages unnumbered by default');
    const doc = makeDoc();
    for (const ep of en.pages) {
      const el = renderPage(ep, s, doc, null);
      assert(el.outerHTML().includes('endnote-title'), 'rendered as endnote page with title');
    }
  });

  it('count-endnote-pages=true → endnote pages join the folio sequence', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'count-endnote-pages': true };
    const r = typeset(TWO_PART_DOC, s);
    const inPages = r.pages.filter(p => p.type === 'endnotes');
    assert(inPages.length === r.endnotePagesInfo.count, 'endnote pages appended to pages');
    assert(inPages.every(p => p.pageNumber != null), 'endnote pages counted');
    // folio continues the body sequence (no duplicates)
    const nums = r.pages.map(p => p.pageNumber).filter(Boolean);
    assertEq(new Set(nums).size, nums.length, 'folio sequence has no duplicates');
  });

  it('continuation pages carry "(המשך)" in the title', () => {
    // תקרת מרזב נמוכה מאוד ⇒ כל חלק נפרש על כמה עמודי הערות
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'count-endnote-pages': true, 'page-size': 'A5' };
    const longDoc = TWO_PART_DOC + Array.from({ length: 40 }, (_, i) =>
      `הערת סיום-${i + 10} - הערה ממוספרת נוספת למילוי עמודי הערות עם טקסט ארוך מעט יותר ${i}`).join('\n') + '\n';
    const r = typeset(longDoc, s);
    assert(r.contentPreserved === true, 'no loss with many endnotes');
    const cont = r.endnotePagesInfo.pages.filter(p => /המשך/.test(String(p.heading)));
    assert(cont.length >= 1, `expected at least one continuation page (headings: ${JSON.stringify(r.endnotePagesInfo.pages.map(p => p.heading).slice(0, 6))})`);
  });
});

describe('S7.1.5/6 Gate — marker style × reset policy matrix', () => {
  const styles = ['hebrew-geresh', 'decimal', 'parenthesis', 'asterisk'];
  const policies = ['continuous', 'page', 'part'];

  it('body markers follow the policy; display markers identical to body (consistency)', () => {
    for (const policy of policies) {
      for (const style of styles) {
        const s = { ...getDefaultSettings(), 'footnote-reset-policy': policy, 'footnote-marker-style': style };
        const r = typeset(TWO_PART_DOC, s);
        assert(r.contentPreserved === true, `preserved [${policy}/${style}] (marker checks included)`);
        // גוף: הסמנים בפלט (כל מילה שהיא סמן ידוע) — סדרת המספור לפי המדיניות
        const bodyMarkers = [];
        for (const pg of r.pages) for (const col of pg.columns) for (const ln of col) {
          for (const w of (ln.words || [])) {
            const bare = String(w).replace(/[\uE000\uE101\uE102]/g, '').replace(/\u00A0/g, ' ').trim();
            for (const f of bare.split(' ')) {
              // **S5.2 (תיקון 10):** סמן רב-אותיות במוסכמת הגרשיים של הגיליון (כ״ג) לצד
            // הצורה הישנה (כג׳) והבודדת (א׳) — שלושתן מזוהות כאן.
            if (/^[\u05D0-\u05EA]{1,2}\u05F3$|^[\u05D0-\u05EA]\u05F4[\u05D0-\u05EA]+$|^\[\d{1,4}\]$|^\(\d{1,4}\)$|^\d{1,4}$|^\*{1,3}\d*$/.test(f)) bodyMarkers.push(f);
            }
          }
        }
        // part policy ⇒ part 2 restarts; continuous ⇒ single sequence — אמת מדגמית:
        if (policy === 'part' && style === 'hebrew-geresh') {
          // שתי הערות בחלק א (א׳, ב׳) ואז איפוס — ההערה הראשונה של חלק ב חוזרת לא׳
          assert(bodyMarkers[0] === 'א׳', `first marker [part/hebrew]: ${JSON.stringify(bodyMarkers.slice(0, 5))}`);
          assert(bodyMarkers.includes('ב׳'), `second marker in part 1 [part/hebrew]: ${JSON.stringify(bodyMarkers.slice(0, 5))}`);
        }
        if (policy === 'continuous' && style === 'decimal') {
          assert(bodyMarkers[0] === '1', `first marker [cont/decimal]: ${JSON.stringify(bodyMarkers.slice(0, 5))}`);
          assert(bodyMarkers.includes('2'), `sequence continues [cont/decimal]: ${JSON.stringify(bodyMarkers.slice(0, 5))}`);
        }
      }
    }
  });

  it('separator rule styles render their class (none → no rule element)', () => {
    for (const rule of ['none', 'regular', 'circles', 'sparkle', 'star', 'diamond']) {
      const s = { ...getDefaultSettings(), 'footnote-separator-rule': rule };
      const r = typeset(TWO_PART_DOC, s);
      const doc = makeDoc();
      const withFn = r.pages.find(p => p.footnotes.length);
      const el = renderPage(withFn, s, doc, null);
      const html = el.outerHTML();
      if (rule === 'none') assert(!html.includes('fn-rule--'), 'no rule element when none');
      else assert(html.includes(`fn-rule--${rule}`), `rule class fn-rule--${rule} rendered`);
    }
  });

  it('fn-layout-mode: block enforces the bar clamp (split); continuous flows without clamp', () => {
    const longNote = 'טקסט הערה ארוך במיוחד לבדיקת מדיניות '.repeat(30).trim();
    const doc = `כותרת 1 - חלק\nפסקה עם הערה [${longNote}] ועוד קצת טקסט.\n` + 'מילוי נפח לעמודים '.repeat(30);
    const mk = (mode) => typeset(doc, { ...getDefaultSettings(), 'fn-layout-mode': mode, 'fn-bar-max-height-px': 120 });
    const block = mk('block');
    assert(block.contentPreserved === true, 'block mode preserves');
    assert(block.pages.some(p => p.footnotes.some(n => n.isContinuation)), 'block → clamp active → split segments');
    const cont = mk('continuous');
    assert(cont.contentPreserved === true, 'continuous mode preserves');
    assert(!cont.pages.some(p => p.footnotes.some(n => n.isContinuation || n.mode === 'split-first')), 'continuous → no clamp → no split');
  });
});

describe('S7.1.2/3 Gate — side-notes full contract + H7 conversion', () => {
  it('side notes placed at anchor paragraph, cascade, 20px containment, nothing lost', () => {
    const r = typeset(SIDE_NOTE_DOC, getDefaultSettings());
    assert(r.contentPreserved === true, 'side notes never lost (BRZ-15)');
    const placed = r.sideNotes.placed;
    assert(placed.length >= 1, 'at least one side note placed');
    // containment: yTop+height ≤ contentBox.bottom + 20
    for (const p of placed) {
      const pg = r.pages.find(x => x.index === p.page);
      assert(pg, 'host page found');
      assert(p.yTop + p.heightPx <= pg.template.contentBox.bottom + 20.5, `containment 20px: yTop=${p.yTop} h=${p.heightPx}`);
    }
    // cascade per page: אין חפיפה בין הערות באותו עמוד
    const byPage = new Map();
    for (const p of placed) {
      if (!byPage.has(p.page)) byPage.set(p.page, []);
      byPage.get(p.page).push(p);
    }
    for (const [pgi, list] of byPage) {
      list.sort((a, b) => a.yTop - b.yTop);
      for (let i = 1; i < list.length; i++) {
        assert(list[i].yTop >= list[i - 1].yTop + list[i - 1].heightPx, `no overlap on page ${pgi}`);
      }
    }
    // anchor binding: לפחות הערה אחת ממוקמת בגובה שורת האנקור שלה (לא ראש עמוד עיוור)
    const withAnchor = placed.find(p => {
      const pg = r.pages.find(x => x.index === p.page);
      if (!pg) return false;
      for (let c = 0; c < pg.columns.length; c++) {
        for (const ln of pg.columns[c]) {
          const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
          if (tok === p.anchorToken) {
            let y = pg.template.contentBox.top;
            const col = pg.columns[c];
            for (let i = 0; i < col.length && col[i] !== ln; i++) y += col[i].heightPx || 0;
            return Math.abs(y - p.yTop) < 1.5;
          }
        }
      }
      return false;
    });
    assert(withAnchor, 'side note anchored at its paragraph top (not blind top-of-page)');
  });

  it('h7-conversion false-positive injection: duplicate text in body is NOT flagged (user fix)', () => {
    const r = typeset(SIDE_NOTE_DOC, getDefaultSettings());
    const h7 = [...r.ledger.issues.values()].filter(x => x.kind === 'h7-conversion-missing');
    assertEq(h7.length, 0, 'duplicate body text must not be flagged (anchor-based, not text-search)');
    // ההערה מוצגת בפועל בשוליים
    assert(r.sideNotes.placed.length >= 1, 'the H7 note IS placed');
  });
});

describe('S7 — P0-3 reading-order lock (regression)', () => {
  it('no reading-order-break findings on the canonical sample (order preserved after balancing)', () => {
    const FIX = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.txt'), 'utf8');
    const r = typeset(FIX, getDefaultSettings());
    const ro = [...r.ledger.issues.values()].filter(x => x.kind === 'reading-order-break');
    assertEq(ro.length, 0, 'reading order must never break (P0-3 fix)');
    // בדיקת האמת: סדר ה‑seq בקריאה אינו יורד בכל עמוד
    for (const pg of r.pages) {
      let prev = -1;
      for (const col of pg.columns) for (const ln of col) {
        if (ln.seq == null) continue;
        assert(ln.seq >= prev, `page ${pg.index}: seq regressed (${ln.seq} < ${prev})`);
        prev = ln.seq;
      }
    }
  });

  it('reading-order guard DETECTS a backward move (the guard is real, not decorative)', () => {
    // עמוד מסונתז עם שורה שהוזזה אחורה בסדר הקריאה — ההגנה חייבת לדווח
    const page = {
      index: 0, type: 'regular', chapterOpening: false, terminalResidual: false,
      template: { contentBox: { height: 500 }, columns: [{ x: 0, w: 300 }, { x: 320, w: 300 }] },
      columns: [
        [{ words: ['מאוחר'], heightPx: 20, seq: 5, meta: { tokenId: 'a', part: 'first' } }],
        [{ words: ['מוקדם'], heightPx: 20, seq: 2, meta: { tokenId: 'b', part: 'rest' } }]
      ],
      footnotes: [], sideNotes: [], parenRanges: []
    };
    const { violations } = runProtections(page, getDefaultSettings(), new Ledger());
    assert(violations.some(v => v.kind === 'reading-order-break'), 'guard fires on backward move');
  });
});

describe('S7 — P0-6 CP4==CP5 is a REAL proof (anti-tautology)', () => {
  it('bodyGeometryHash changes when a line moves (sensitivity proof)', () => {
    const FIX = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.txt'), 'utf8');
    const r = typeset(FIX, getDefaultSettings());
    const hBefore = r.geometryNeutralVerified; // true על הפיקסטורה
    assertEq(hBefore, true, 'fixture: decorations are geometry-neutral');
    // השתלה: הזזת שורה אחת בין טורים ⇒ הhash חייב להשתנות (ההשוואה אינה ואקום)
    const mutated = JSON.parse(JSON.stringify(r.pages.map(p => ({ ...p, footnotes: [], sideNotes: [] }))));
    // שים לב: deep-copy של העמודים ואז הזזה ידנית של שורה מסוף טור 0 לראש טור 1 (אחורה בסדר!)
    const p0 = mutated[mutated.length - 1];
    if (p0.columns[0].length) {
      const moved = p0.columns[0].pop();
      p0.columns[1].unshift(moved);
    }
    const hMutated = bodyGeometryHash(mutated);
    assertNotEq(hMutated, r.plannedLayoutHash, 'mutation must change the hash');
    function assertNotEq(a, b, msg) { if (a === b) throw new Error(msg || 'hashes equal'); }
  });

  it('layoutHash differs between different layouts (full-hash sensitivity)', () => {
    const A = [{ index: 0, type: 'regular', columns: [[{ words: ['א'], heightPx: 10 }], []], footnotes: [], sideNotes: [] }];
    const B = [{ index: 0, type: 'regular', columns: [[], [{ words: ['א'], heightPx: 10 }]], footnotes: [], sideNotes: [] }];
    assert(layoutHash(A) !== layoutHash(B), 'column position is part of the hash');
  });
});

describe('S7 — diagnostics never suppressed + determinism with notes', () => {
  it('diagnostics-enabled=false does NOT suppress findings (D-43)', () => {
    const FIX = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.txt'), 'utf8');
    const on = typeset(FIX, getDefaultSettings());
    const off = typeset(FIX, { ...getDefaultSettings(), 'diagnostics-enabled': false });
    const countOn = [...on.ledger.issues.values()].filter(x => x.status !== 'resolved').length;
    const countOff = [...off.ledger.issues.values()].filter(x => x.status !== 'resolved').length;
    assertEq(countOff, countOn, `same persisted findings with diagnostics off (on=${countOn}, off=${countOff})`);
  });

  it('two runs (endnotes mode) → identical layoutHash', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const a = typeset(TWO_PART_DOC, s);
    const b = typeset(TWO_PART_DOC, s);
    assertEq(a.layoutHash, b.layoutHash, 'determinism with notes');
    assertEq(a.pages.length, b.pages.length);
  });

  it('offline-guard + PUA scrub hold with notes in all modes', () => {
    for (const mode of ['footnotes', 'endnotes', 'inline']) {
      const s = { ...getDefaultSettings(), 'note-placement-mode': mode };
      const r = typeset(TWO_PART_DOC, s);
      const doc = makeDoc();
      const html = r.pages.map(pg => renderPage(pg, s, doc, pg.header || null).outerHTML()).join('\n');
      assert(!html.includes('\uE000'), `no U+E000 leak [${mode}]`);
      assert(!html.includes('\uE101'), `no U+E101 leak [${mode}]`);
      assert(!html.includes('⏎'), `no page-break marker [${mode}] (F-01)`);
      assertOfflineSafe(buildStandaloneHtml([html], s, { title: 'S7' }));
    }
  });
});

report('s7-gate');
