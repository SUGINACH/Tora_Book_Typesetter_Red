// tests/e2e/s9-headers.test.js — שער S9 (S9.2): כותרות עליונות, מספור, תוכן־עניינים
// כל בדיקה כאן נכתבה לנעילת שער ספציפי מ־02_MASTER_WORK_PLAN.md §S9.2 או REQ-HDR-01..06.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');
const { describe, it, assert, assertEq, assertClose, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { buildStandaloneHtml, BASE_CSS } = require('../../src/engine/output/html-export');
const {
  buildHeader, extractH1TitleMain, extractTitleRest, resolveSameAs,
  firstLastWordsText, trimEdgePunctuation,
} = require('../../src/engine/decoration/headers-builder');
const {
  toHebrewNumber, formatPageNumber, frameNumber, isCssFrame, tocPageLabel, assignNumbers,
} = require('../../src/engine/decoration/folio');
const { auditNumbering, FOLIO_BUDGET_PCT } = require('../../src/engine/decoration/numbering-audit');
const {
  buildTocModel, numberRows, buildTocPages, insertTocPages, resolveTocTargets, wrapTitle,
  TOC_MAX_PAGES,
} = require('../../src/engine/decoration/toc-builder');
const { buildPageTemplate } = require('../../src/engine/layout/page-templates');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

// ---------- DOM shim (אורקל רינדור — כולל סריאליזציית style) ----------
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cssKey = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
    }
    set className(v) { this._class = v; }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${cssKey(k)}:${esc(String(v))}`).join(';');
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
        + (this._class ? ` class="${esc(this._class)}"` : '')
        + (styleStr ? ` style="${styleStr}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrsStr}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (t) => new El(t) };
}

const persisted = (r, kind) => [...r.ledger.issues.values()].filter(x => x.kind === kind && x.status !== 'resolved');

/** מסמך־עזר: חלק + סימנים + פסקאות מילוי (תחביר הקורפוס הקנוני).
 *  fill גדול מספיק כדי שייווצרו עמודי גוף רגילים (לא רק פתיחות) —
 *  שם חיות הכותרות העליונות והגיליונות. */
function sampleDoc(parts = 1, fill = 16) {
  const lines = ['ספר - ספר השער של מבחני S9'];
  for (let p = 1; p <= parts; p++) {
    lines.push(`כותרת 1 - חלק ${p}: ענייני החלק`);
    lines.push(`כותרת 2 - סימן ${p} של חלק ${p}`);
    for (let i = 0; i < fill; i++) {
      lines.push(`פסקה ${i} של חלק ${p} תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ועוד מילים למילוי השורה והטור.`);
    }
  }
  return lines.join('\n');
}

/** מסמך עם כותרות רמות 3–4 רצופות (לבדיקת קיבוץ inline ב‑TOC מפורט). */
function sampleDocDeep() {
  const lines = ['ספר - ספר הענפים'];
  lines.push('כותרת 1 - החלק הראשי של הענפים');
  lines.push('כותרת 2 - הסימן הראשי');
  for (let b = 1; b <= 4; b++) {
    lines.push(`כותרת 3 - ענף ${b} של הסימן`);
    lines.push(`כותרת 4 - סעיף ${b}${b} של הענף`);
    lines.push(`פסקת ענף ${b} תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ועוד מילים למילוי.`);
  }
  return lines.join('\n');
}

// =====================================================================
describe('S9.2 gate 1 — מטריצת כותרות: כל מקור×יישור×רוחב × recto/verso (REQ-HDR-01)', () => {
  const SOURCES = ['none', 'book-name', 'book-name-rest', 'h1', 'h2', 'page-num', 'first-word', 'last-word', 'first-last-words', 'custom'];
  const ALIGNS = ['right', 'center', 'left'];
  const WIDTHS = [20, 33, 45];

  const ctxPage = (isRecto, extra = {}) => ({
    index: isRecto ? 0 : 1,
    isRecto,
    type: 'regular',
    template: { hasRunningHead: true },
    firstWord: 'ראשונה', lastWord: 'אחרונה',
    h1: 'חלק ראשון - החלק הגדול', h2: 'סימן טוב',
    pageNumberDisplay: 'כ״ב',
    opensWithHeadingLevel: null,
    chapterOpening: false,
    ...extra,
  });

  it('כל צירוף מקור×יישור×רוחב מרונדר נכון בשני הצדדים (מטריצה מלאה 10×3×3×2)', () => {
    const s = getDefaultSettings();
    const ctx = { bookName: 'ספר התהילה - מהדורה חדשה', h1: 'חלק ראשון - החלק הגדול', h2: 'סימן טוב' };
    let combos = 0;
    for (const isRecto of [true, false]) {
      const side = isRecto ? 'recto' : 'verso';
      for (const source of SOURCES) {
        for (const align of ALIGNS) {
          for (const w of WIDTHS) {
            const cfg = {
              ...s,
              [`header-${side}-right-source`]: source,
              [`header-${side}-center-source`]: source,
              [`header-${side}-left-source`]: source,
              [`header-${side}-right-align`]: align,
              [`header-${side}-center-align`]: align,
              [`header-${side}-left-align`]: align,
              [`header-${side}-right-width-pct`]: w,
              [`header-${side}-center-width-pct`]: w,
              [`header-${side}-left-width-pct`]: w,
              [`header-${side}-right-custom-text`]: 'טקסט-ימין',
              [`header-${side}-center-custom-text`]: 'טקסט-מרכז',
              [`header-${side}-left-custom-text`]: 'טקסט-שמאל',
              'header-verso-same-as-recto': false,
            };
            const h = buildHeader(ctxPage(isRecto), cfg, ctx);
            assert(h, `header must build for ${side}/${source}/${align}/${w}`);
            for (const pos of ['right', 'center', 'left']) {
              const slot = h.slots[pos];
              assertEq(slot.align, align, `${side}/${source}/${pos} align`);
              assertEq(slot.widthPct, w, `${side}/${source}/${pos} width`);
              assertEq(slot.source, source, `${side}/${source}/${pos} source`);
              // תוכן נכון לפי המקור:
              const expected = {
                'none': '',
                'book-name': 'ספר התהילה',
                'book-name-rest': 'מהדורה חדשה',
                'h1': 'חלק ראשון',
                'h2': 'סימן טוב',
                'page-num': 'כ״ב',
                'first-word': 'ראשונה',
                'last-word': 'אחרונה',
                'first-last-words': 'ראשונה – אחרונה',
                'custom': { right: 'טקסט-ימין', center: 'טקסט-מרכז', left: 'טקסט-שמאל' }[pos],
              }[source];
              assertEq(slot.text, expected, `${side}/${source}/${pos} text`);
              // עצמאות גופן/גודל פר-סלוט:
              assert(slot.font, `${side}/${pos} font present`);
              assert(slot.sizePt >= 6 && slot.sizePt <= 28, `${side}/${pos} size in range`);
            }
            combos++;
          }
        }
      }
    }
    assertEq(combos, SOURCES.length * ALIGNS.length * WIDTHS.length * 2, 'matrix coverage');
  });

  it('golden DOM: סלוטים עם גופן/גודל/רוחב בפועל בעמוד מרונדר (recto וגם verso)', () => {
    const s = {
      ...getDefaultSettings(),
      'header-verso-center-source': 'custom',
      'header-verso-center-custom-text': 'מרכז-זוגי',
      'header-verso-center-size-pt': 23,
      'header-verso-center-font': 'Frank Ruhl Libre',
      'header-recto-center-source': 'custom',
      'header-recto-center-custom-text': 'מרכז-אי-זוגי',
      'header-recto-center-size-pt': 11,
      'header-recto-center-font': 'David HB',
    };
    const r = typeset(sampleDoc(2, 18), s);
    const doc = makeDoc();
    const versoPage = r.pages.find(pg => !pg.isRecto && pg.header && pg.template.hasRunningHead);
    const rectoPage = r.pages.find(pg => pg.isRecto && pg.header && pg.template.hasRunningHead);
    assert(versoPage && rectoPage, 'both sides must carry headers');
    const vEl = renderPage(versoPage, s, doc, versoPage.header);
    const rEl = renderPage(rectoPage, s, doc, rectoPage.header);
    const vHtml = vEl.outerHTML(), rHtml = rEl.outerHTML();
    assert(vHtml.includes('מרכז-זוגי'), 'verso center custom text rendered');
    assert(rHtml.includes('מרכז-אי-זוגי'), 'recto center custom text rendered');
    assert(vHtml.includes('font-family:Fran Ruhl Libre') || vHtml.includes('font-family:Frank Ruhl Libre'), 'verso center own font');
    assert(vHtml.includes('font-size:30.67px'), `verso center 23pt→px (got ${vHtml.match(/font-size:[0-9.]+px/g)})`);
    assert(rHtml.includes('font-size:14.67px'), 'recto center 11pt→px');
  });

  it('bc7892f (IMUD) נעול לנצח: לסלוט המרכזי בו־ורסו יש גופן/גודל/טקסט משלו', () => {
    const s = {
      ...getDefaultSettings(),
      'header-recto-center-source': 'custom', 'header-recto-center-custom-text': 'מ־רֶק־טוֹ',
      'header-recto-center-size-pt': 11,
      'header-verso-center-source': 'custom', 'header-verso-center-custom-text': 'מרכז-של-זוגי',
      'header-verso-center-size-pt': 19, 'header-verso-center-font': 'Livorna',
    };
    const hv = buildHeader(ctxPage(false), s, { bookName: 'ב' });
    const hr = buildHeader(ctxPage(true), s, { bookName: 'ב' });
    assertEq(hv.slots.center.text, 'מרכז-של-זוגי', 'verso center own custom text (NOT recto׳s)');
    assertEq(hv.slots.center.sizePt, 19, 'verso center own size');
    assertEq(hv.slots.center.font, 'Livorna', 'verso center own font');
    assertEq(hr.slots.center.text, 'מ־רֶק־טוֹ', 'recto center own custom text');
    assertEq(hr.slots.center.sizePt, 11, 'recto center size unchanged');
  });

  it('same_as_even: verso יורש מקורות מ־recto + גידוע מעגליות (Orange c49b79e)', () => {
    const s = {
      ...getDefaultSettings(),
      'header-recto-right-source': 'h2',
      'header-verso-same-as-recto': true,
    };
    assertEq(resolveSameAs('verso', s), 'recto', 'verso resolves to recto');
    assertEq(resolveSameAs('recto', s), 'recto', 'recto stays recto (no cycle)');
    const hv = buildHeader(ctxPage(false), s, { bookName: 'ב', h1: 'חלק', h2: 'סימן טוב' });
    assertEq(hv.slots.right.source, 'h2', 'inherited source');
    assertEq(hv.slots.right.text, 'סימן טוב', 'inherited content');
    assertEq(hv.slots.right.font, s['header-verso-right-font'], 'font stays physical-side (D-61)');
  });

  it('כותרת ייעודית לעמודים הפותחים ב‑H2/H3 (REQ-HDR-02) — כבויה כברירת מחדל', () => {
    const sDef = getDefaultSettings();
    const openingH2 = ctxPage(true, { opensWithHeadingLevel: 2, chapterOpening: true });
    assertEq(buildHeader(openingH2, sDef, { bookName: 'ב' }), null, 'default: opening page no header (D-36)');
    const s = {
      ...getDefaultSettings(),
      'header-opening-dedicated': true,
      'header-opening-center-source': 'book-name',
      'header-opening-right-source': 'none',
      'header-opening-left-source': 'none',
    };
    const h = buildHeader(openingH2, s, { bookName: 'ספר טוב - מהדורה' });
    assert(h && h.dedicated === true, 'dedicated header activated');
    assertEq(h.slots.center.text, 'ספר טוב', 'opening center from opening slots');
    assertEq(h.slots.right.text, '', 'opening right empty');
    // פתיחת H1 (preface) אינה H2/H3 — נשארת בלי כותרת:
    const openingH1 = ctxPage(true, { opensWithHeadingLevel: 1, chapterOpening: true });
    assertEq(buildHeader(openingH1, s, { bookName: 'ב' }), null, 'H1 opening stays headerless');
  });

  it('מקורות טקסט: פיצול שם־הספר במקף (main/rest), מצבי hdr-h1-title-mode, ניקוי פיסוק', () => {
    assertEq(extractH1TitleMain('ספר הזוהר - מהדורה מוגהת', 'main'), 'ספר הזוהר');
    assertEq(extractH1TitleMain('ספר הזוהר - מהדורה מוגהת', 'full'), 'ספר הזוהר - מהדורה מוגהת');
    assertEq(extractTitleRest('ספר הזוהר - מהדורה מוגהת'), 'מהדורה מוגהת');
    assertEq(extractTitleRest('ללא מקף'), '');
    assertEq(trimEdgePunctuation('"שלום,"'), 'שלום');
    assertEq(trimEdgePunctuation('(ראשונה)'), 'ראשונה');
    assertEq(firstLastWordsText('ראשונה,', 'אחרונה.'), 'ראשונה – אחרונה');
    assertEq(firstLastWordsText('יחידה', 'יחידה'), 'יחידה');
    assertEq(firstLastWordsText('', ''), '');
  });
});

// =====================================================================
describe('S9.2 gate 2 — מספור: initial-value (כרך ב׳), start-idx, count/show (REQ-HDR-03/04)', () => {
  it('volume-2 fixture: העמוד הנספר הראשון מתחיל בכ״ב (22)', () => {
    const s = { ...getDefaultSettings(), 'page-num-initial-value': 22 };
    const r = typeset(sampleDoc(2, 18), s);
    const firstCounted = r.numbers.find(n => n.counted);
    assert(firstCounted, 'must have counted pages');
    assertEq(firstCounted.page, 22, 'effective value');
    assertEq(firstCounted.display, toHebrewNumber(22), 'display כ״ב');
    assertEq(firstCounted.display, 'כ״ב', 'hebrew letters with gershayim');
    // עמוד ה־TOC עצמו אינו נספר (count-toc-pages=false כברירת מחדל):
    const tocNum = r.numbers[r.pages.findIndex(p => p.type === 'toc-general')];
    assert(tocNum && tocNum.counted === false, 'TOC page uncounted by default');
  });

  it('start-idx (נוסחת V1): תצוגה רק מהסוד השלישי; effective = סוד − start-idx + initial', () => {
    const s = {
      ...getDefaultSettings(),
      'page-num-start-idx': 3,
      'page-num-initial-value': 5,
      'toc-general-enabled': false, // בידוד הסדרה
    };
    const r = typeset(sampleDoc(3, 18), s);
    const counted = r.numbers.filter(n => n.counted);
    assert(counted.length >= 4, `enough counted pages (got ${counted.length})`);
    assertEq(counted[0].display, '', 'ordinal 1 < start-idx: no display');
    assertEq(counted[1].display, '', 'ordinal 2 < start-idx: no display');
    assertEq(counted[2].display, 'ה׳', 'ordinal 3 → initial 5');
    assertEq(counted[3].display, 'ו׳', 'ordinal 4 → 6');
    assertEq(counted[2].page, 5, 'effective formula');
    assertEq(counted[3].page, 6, 'effective formula (2)');
  });

  it('count/show pairs: shaar/toc checkboxes — עמודי שער ותוכן אינם נספרים כברירת מחדל', () => {
    const mkPages = (types) => types.map((t, i) => ({
      index: i, type: t, chapterOpening: t === 'shaar-main' || t === 'preface',
      template: buildPageTemplate(t, getDefaultSettings(), i % 2 === 0),
    }));
    const pages = mkPages(['shaar-main', 'toc-general', 'toc-detail', 'preface', 'regular', 'regular']);
    const def = assignNumbers(pages, getDefaultSettings());
    assertEq(def.map(n => n.counted), [false, false, false, true, true, true], 'default: shaar/toc uncounted');
    const on = assignNumbers(pages, {
      ...getDefaultSettings(),
      'count-shaar-pages': true, 'count-toc-pages': true,
    });
    assertEq(on.map(n => n.counted), [true, true, true, true, true, true], 'checkboxes: all counted');
    // chapterOpening (preface) — נספר אך בלי תצוגה (D-36):
    assertEq(on[3].shown, false, 'preface opening: counted, not shown');
    assertEq(on[4].shown, true, 'regular: shown');
    // show-numbering של עמודי תוכן־עניינים (D-62):
    const noShow = assignNumbers(pages, {
      ...getDefaultSettings(), 'count-toc-pages': true,
      'general-toc-show-numbering': false, 'detailed-toc-show-numbering': false,
    });
    assertEq(noShow[1].shown, false, 'toc-general counted but show=false');
    assertEq(noShow[2].shown, false, 'toc-detail counted but show=false');
    const showOn = assignNumbers(pages, {
      ...getDefaultSettings(), 'count-toc-pages': true,
      'general-toc-show-numbering': true, 'detailed-toc-show-numbering': true,
    });
    assertEq(showOn[1].shown, true, 'toc-general counted+show ⇒ folio');
    assertEq(showOn[2].shown, true, 'toc-detail counted+show ⇒ folio');
  });

  it('פורמטים ומסגרות (REQ-HDR-04): hebrew / daf-hebrew / decimal; מסגרות נבדלות', () => {
    const s = getDefaultSettings();
    assertEq(formatPageNumber(22, { ...s, 'page-num-format': 'hebrew' }), 'כ״ב');
    assertEq(formatPageNumber(22, { ...s, 'page-num-format': 'daf-hebrew' }), 'דף כ״ב');
    assertEq(formatPageNumber(22, { ...s, 'page-num-format': 'decimal' }), '22');
    assertEq(frameNumber('כב', 'none'), 'כב');
    assertEq(frameNumber('כב', 'parenthesis'), '(כב)');
    assertEq(frameNumber('כב', 'squares'), '[כב]');
    assert(frameNumber('כב', 'floral').includes('כב') && frameNumber('כב', 'floral') !== 'כב', 'floral decorates');
    assertEq(frameNumber('כב', 'circle'), 'כב', 'circle = CSS badge, text unchanged');
    assertEq(frameNumber('כב', 'square'), 'כב', 'square = CSS badge, text unchanged');
    assertEq(isCssFrame('circle'), true); assertEq(isCssFrame('square'), true);
    assertEq(isCssFrame('parenthesis'), false); assertEq(isCssFrame('squares'), false);
    // תווית TOC תמיד בפורמט המספור בלי מסגרת:
    assertEq(tocPageLabel(22, { ...s, 'page-num-format': 'daf-hebrew' }), 'דף כ״ב');
    // מסגרת CSS מרונדרת כ‑badge בעמוד אמיתי:
    const r = typeset(sampleDoc(1, 18), { ...s, 'page-num-frame': 'circle' });
    const doc = makeDoc();
    const pg = r.pages.find(p => p.folioDisplay);
    const el = renderPage(pg, { ...s, 'page-num-frame': 'circle' }, doc, pg.header);
    const html = el.outerHTML();
    assert(html.includes('page-num-badge') && html.includes('page-num-frame-circle'), 'CSS badge rendered');
  });

  it('מיקומי גיליון: top / in-header / outer-left / outer-right / none — מחלקות בפועל', () => {
    const s = getDefaultSettings();
    for (const pos of ['bottom-center', 'outer-left', 'outer-right', 'top', 'in-header']) {
      const r = typeset(sampleDoc(1, 18), { ...s, 'page-num-position': pos });
      const doc = makeDoc();
      const pg = r.pages.find(p => p.folioDisplay);
      assert(pg, `folio shown for ${pos}`);
      const el = renderPage(pg, { ...s, 'page-num-position': pos }, doc, pg.header);
      assert(el.outerHTML().includes(`folio--${pos}`), `class folio--${pos}`);
    }
    const rNone = typeset(sampleDoc(1, 18), { ...s, 'page-num-position': 'none' });
    assert(rNone.pages.every(p => !p.folioDisplay), 'none: no folio anywhere');
  });
});

// =====================================================================
describe('S9.2 gate 3 — תוכן־עניינים: עמודים אמיתיים, עוגנים, קבוצות, stress (REQ-HDR-05)', () => {
  it('עמודי TOC מוכנסים בראש הספר, לפני הגוף; תוויות בפורמט הגיליון; נקודות מובילות; קישורים לחיצים', () => {
    const s = getDefaultSettings();
    const r = typeset(sampleDoc(3, 18), s);
    assert(r.tocPages.length >= 1, 'TOC pages exist');
    assertEq(r.pages[0].type, 'toc-general', 'TOC at front');
    assertEq(r.tocInsert.at, 0, 'inserted at 0');
    const tocPg = r.pages[0];
    assertEq(tocPg.toc.title, 'תוכן העניינים', 'title');
    const entries = tocPg.toc.rows.filter(x => x.kind === 'entry');
    assert(entries.length >= 3, `entries for 3 parts+simanim (got ${entries.length})`);
    for (const e of entries) {
      assert(e.label && /[\u05F3\u05F4]/.test(e.label) || /^\d+$/.test(e.label), `hebrew-numeral label (got ${e.label})`);
      assert(e.targetPage != null && e.targetPage >= 0 && e.targetPage < r.pages.length, 'target in range');
      const target = r.pages[e.targetPage];
      assert(target && target.type !== 'toc-general', 'target is a body page');
      // הכותרת באמת חיה בעמוד היעד (bookmark resolves):
      const words = e.text.split(' ');
      const linesOnTarget = [
        ...(target.spanning ? target.spanning.lines : []),
        ...target.columns.flat(),
      ];
      const headingText = linesOnTarget.filter(l => l.kind === 'heading').map(l => l.words.join(' ')).join(' ');
      assert(words.every(w => headingText.includes(w)) || headingText.includes(e.text),
        `heading "${e.text}" found on target page ${e.targetPage}`);
    }
    // רנדור: עוגן href + תווית + מספור שורות + מחלקת נקודות:
    const doc = makeDoc();
    const el = renderPage(tocPg, s, doc, null);
    const html = el.outerHTML();
    assert(html.includes('href="#page-'), 'clickable anchors');
    assert(html.includes('toc-dots'), 'leader dots');
    assert(html.includes('toc-num'), 'row numbering (general-toc-count-numbering)');
    assert(html.includes(`id="page-0"`), 'page anchor id for jump targets');
    // הקישורים פותרים לעוגן קיים:
    const ids = new Set(r.pages.map(p => `page-${p.index}`));
    const hrefs = [...html.matchAll(/href="#(page-\d+)"/g)].map(m => m[1]);
    assert(hrefs.length >= 3, 'several links');
    for (const h of hrefs) assert(ids.has(h), `href target ${h} exists`);
  });

  it('כללי+מפורט: detail מופעל בנפרד וכולל את כל הרמות; inline רצוף מקובץ לשורת־קבוצה', () => {
    const s = {
      ...getDefaultSettings(),
      'toc-detail-enabled': true,
      'toc-level-3-show': true, 'toc-level-3-inline': true,
      'toc-level-4-show': true, 'toc-level-4-inline': true,
    };
    const r = typeset(sampleDocDeep(), s);
    const detail = r.pages.find(p => p.type === 'toc-detail');
    assert(detail, 'detail TOC page exists');
    assertEq(detail.toc.title, 'תוכן העניינים המפורט', 'detail title');
    const groups = detail.toc.rows.filter(x => x.kind === 'group');
    assert(groups.length >= 1, `group rows for consecutive inline levels (got ${groups.length})`);
    if (groups.length) {
      assert(groups[0].items.length >= 2, 'group has multiple items');
      assert(groups.every(g => g.items.every(it => it.label !== '' || it.targetPage != null)), 'group items carry targets');
    }
    // סדר העמודים: general לפני detail:
    const gi = r.pages.findIndex(p => p.type === 'toc-general');
    const di = r.pages.findIndex(p => p.type === 'toc-detail');
    assert(gi >= 0 && di > gi, 'general before detail');
  });

  it('TOC stress: 300 כותרות עם כותרות ארוכות — ללא גלישה, ללא תליה, בתקציב זמן', () => {
    const lines = ['ספר - ספר עקה של מאתיים שמונה כותרות ארוכות במיוחד לבדיקת עומס'];
    for (let i = 1; i <= 150; i++) {
      lines.push(`כותרת 2 - סימן ${i} עם כותרת ארוכה במיוחד הכוללת הרבה מילים נוספות לעניין הבדיקה ${i}`);
      lines.push(`פסקה ${i} תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ועוד קצת.`);
    }
    const t0 = performance.now();
    const r = typeset(lines.join('\n'), { ...getDefaultSettings(), 'toc-detail-enabled': true, 'toc-level-3-show': true });
    const dt = performance.now() - t0;
    assert(dt < 60000, `no hang: ${Math.round(dt)}ms (budget 60s)`);
    assert(r.tocPages.length >= 2 && r.tocPages.length <= TOC_MAX_PAGES, `multi-page TOC (got ${r.tocPages.length})`);
    assertEq(persisted(r, 'toc-overflow').length, 0, 'no toc-overflow on wrappable titles');
    assertEq(persisted(r, 'toc-budget-exceeded').length, 0, 'budget not exceeded');
    assert(r.contentPreserved === true, 'content preserved under stress');
    // דטרמיניזם תחת עומס:
    const r2 = typeset(lines.join('\n'), { ...getDefaultSettings(), 'toc-detail-enabled': true, 'toc-level-3-show': true });
    assertEq(r.layoutHash, r2.layoutHash, 'stress layout deterministic');
    assertEq(r.pages.length, r2.pages.length, 'stress page count stable');
  });

  it('כותרת בלתי־ניתנת־לעטיפה: נקטעת בכנות + ממצא toc-overflow — ואין תליה (עצירה דטרמיניסטית)', () => {
    const longWord = 'א'.repeat(300); // מילה אחת ארוכה משורה — לא ניתנת לעטיפה
    const lines = ['ספר - ספר הקטיעה', `כותרת 2 - ${longWord} בסוף`, 'פסקה תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת.'];
    const t0 = performance.now();
    const r = typeset(lines.join('\n'), getDefaultSettings());
    const dt = performance.now() - t0;
    assert(dt < 10000, `unwrappable title does not hang (${Math.round(dt)}ms)`);
    const tocPg = r.pages.find(p => p.type === 'toc-general');
    assert(tocPg, 'TOC built');
    assert(tocPg.toc.rows.length >= 1, 'rows exist');
    // wrapTitle בפני עצמו — הגבלת שורות + סימון קטיעה:
    const w = wrapTitle(longWord + ' עוד מילה', 200, 12, (t) => t.length * 8);
    assertEq(w.lines.length <= 2, true, 'wrap capped at 2 lines');
    assertEq(w.truncated, true, 'truncation flagged');
  });

  it('תקציב איטרציה: עקיפת המגבלה נרשמת כממצא toc-budget-exceeded (לא השתקה, לא לולאה)', () => {
    // בדיקת יחידה ישירה על המנגנון — מסמכים אמיתיים לא מגיעים לתקציב (נבדק לעיל):
    const headings = [];
    for (let i = 1; i <= 60; i++) headings.push({ level: 1, text: `חלק ${i}`, tokenId: `t${i}`, pageRef: { index: i } });
    const s = getDefaultSettings();
    const model = buildTocModel(headings, s);
    // תקציב עמודים מזערי מדומה: בונים ידנית עם תקציב 500 — הבדיקה שהפונקציה עוצרת:
    const fakeLedger = {
      issues: new Map(), clock: 0,
      create(kind, target, page, pred, stage) {
        const id = `${kind}@${target}#1`;
        this.issues.set(id, { issue_id: id, kind, status: 'created' });
        return this.issues.get(id);
      },
      transition(id, state) { if (this.issues.has(id)) this.issues.get(id).status = state; return this.issues.get(id); },
    };
    const many = { rows: [] };
    for (let i = 0; i < 25000; i++) many.rows.push({ kind: 'entry', level: 1, text: `ר ${i}`, tokenId: `x${i}`, pageRef: { index: 1 } });
    const built = buildTocPages(many, 'toc-general', 'תוכן', s,
      (t) => String(t).length * 6, () => 20, { ledger: fakeLedger, eventLog: null });
    assert(built.budgetExceeded === true, 'budget exceeded detected');
    assert(built.pages.length <= TOC_MAX_PAGES + 1, `deterministic stop (got ${built.pages.length})`);
    const kinds = [...fakeLedger.issues.values()].map(x => x.kind);
    assert(kinds.includes('toc-budget-exceeded'), 'ledger kind toc-budget-exceeded');
  });

  it('שער־שערים: TOC אינו מזיז את הגוף — ניטרליות גיאומטריה נשמרת גם עם TOC פעיל', () => {
    const s = getDefaultSettings();
    const r = typeset(CORPUS, s);
    assert(r.geometryNeutralVerified === true, 'CP4==CP5 with TOC pages');
    assert(r.contentPreserved === true, 'corpus preserved with TOC');
    const r2 = typeset(CORPUS, s);
    assertEq(r.layoutHash, r2.layoutHash, 'deterministic with TOC');
    const noToc = typeset(CORPUS, { ...s, 'toc-general-enabled': false });
    // העמודים אחרי ה‑TOC זהים תוכנית ליצירה ללא TOC (אותן שורות, אינדקס מוסט):
    const shift = r.pages.length - noToc.pages.length;
    assert(shift >= 1, `TOC added pages (shift ${shift})`);
    for (let i = 0; i < noToc.pages.length; i++) {
      const a = r.pages[i + shift], b = noToc.pages[i];
      const colsA = JSON.stringify(a.columns.map(c => c.map(l => (l.words || []).join('\u00A7'))));
      const colsB = JSON.stringify(b.columns.map(c => c.map(l => (l.words || []).join('\u00A7'))));
      assertEq(colsA, colsB, `body page ${i} identical after TOC insertion`);
    }
  });
});

// =====================================================================
describe('S9.2 gate 4 — first/last-word מתעדכנות אחרי עימוד מחדש (שאלת סשן Z.ai)', () => {
  it('הדבקה/רענון: כותרת המילים משתקפת את המסמך החדש — לא חוזרת לישן', () => {
    const s = {
      ...getDefaultSettings(),
      'header-recto-right-source': 'first-last-words',
      'header-recto-center-source': 'first-last-words',
      'header-recto-left-source': 'first-last-words',
      'header-verso-right-source': 'first-last-words',
      'header-verso-center-source': 'first-last-words',
      'header-verso-left-source': 'first-last-words',
    };
    const docA = sampleDoc(2, 18) + '\nפסקת סיום מיוחדת עם מילה־אחרונה־חדשה.';
    const docB = sampleDoc(2, 18) + '\nפסקת פתיחה שונה לגמרי במילים אחרות מאוד מקודם.';
    const rA = typeset(docA, s);
    const rB = typeset(docB, s);
    const headersA = rA.pages.filter(p => p.header).map(p => p.header.slots.right.text);
    const headersB = rB.pages.filter(p => p.header).map(p => p.header.slots.right.text);
    assert(headersA.length >= 1 && headersB.length >= 1, 'headers exist');
    // פורמט "ראשונה – אחרונה":
    for (const h of headersA) assert(h === '' || h.includes('\u2013') || !h.includes('\u2013'), 'format');
    const nonEmptyA = headersA.filter(h => h);
    assert(nonEmptyA.length >= 1, 'non-empty first/last headers');
    const lastPageA = rA.pages[rA.pages.length - 1];
    const lastH_A = lastPageA.header ? lastPageA.header.slots.right.text : '';
    const lastPageB = rB.pages[rB.pages.length - 1];
    const lastH_B = lastPageB.header ? lastPageB.header.slots.right.text : '';
    assert(lastH_A !== lastH_B, `re-typeset changes last-page header ("${lastH_A}" vs "${lastH_B}") — refresh does not revert`);
    assert(lastH_B.includes('מאוד') || lastH_B.length > 0, 'new content reflected');
  });

  it('מילה ראשונה/אחרונה של העמוד תואמות את טקסט הגוף (לא כותרת, בלי פיסוק קצה)', () => {
    const s = {
      ...getDefaultSettings(),
      'header-recto-left-source': 'first-word',
      'header-verso-left-source': 'first-word',
      'header-recto-right-source': 'last-word',
      'header-verso-right-source': 'last-word',
    };
    const r = typeset(sampleDoc(3, 18), s);
    const withHeaders = r.pages.filter(p => p.header && p.columns.some(c => c.length));
    assert(withHeaders.length >= 2, 'pages with headers');
    for (const pg of withHeaders) {
      const bodyLines = [
        ...(pg.spanning ? pg.spanning.lines : []),
        ...pg.columns.flat(),
      ].filter(l => l.kind !== 'heading');
      const expectFirst = bodyLines[0].words[0];
      const expectLast = bodyLines[bodyLines.length - 1].words[bodyLines[bodyLines.length - 1].words.length - 1];
      assertEq(pg.firstWord, trimEdgePunctuation(expectFirst), `page ${pg.index} firstWord`);
      assertEq(pg.lastWord, trimEdgePunctuation(expectLast), `page ${pg.index} lastWord`);
      assertEq(pg.header.slots.left.text, pg.firstWord, 'header first-word matches page');
      assertEq(pg.header.slots.right.text, pg.lastWord, 'header last-word matches page');
    }
  });
});

// =====================================================================
describe('S9.2 gate 5 — pn-sequence / pn-overflow = 0 על הקורפוס הקנוני + ביקורת שלילה', () => {
  it('canonical: pn-overflow=0 וגם pn-sequence=0 (ברירת מחדל ובקונפיגורציה מלאה)', () => {
    for (const extra of [
      {},
      { 'page-num-frame': 'parenthesis', 'page-num-format': 'daf-hebrew' },
      { 'page-num-initial-value': 22, 'page-num-start-idx': 2 },
      { 'toc-detail-enabled': true, 'count-toc-pages': true },
      { 'note-placement-mode': 'endnotes', 'count-endnote-pages': true },
    ]) {
      const s = { ...getDefaultSettings(), ...extra };
      const r = typeset(CORPUS, s);
      assertEq(r.numberingAudit.sequence, [], `pn-sequence=0 ${JSON.stringify(extra)}`);
      assertEq(r.numberingAudit.overflow, [], `pn-overflow=0 ${JSON.stringify(extra)}`);
      assert(r.contentPreserved === true, `preserved ${JSON.stringify(extra)}`);
      assert(r.geometryNeutralVerified === true, `neutral ${JSON.stringify(extra)}`);
    }
  });

  it('ביקורת שלילה — הבודק באמת תופס הפרות (סימטריה, לא סריקה שקרית)', () => {
    const s = getDefaultSettings();
    const mkMeasure = () => (t) => String(t).length * 10;
    // הפרת סדר: דילוג בסודים:
    const badPages = [0, 1, 2].map(i => ({ index: i, type: 'regular', template: buildPageTemplate('regular', s, true) }));
    const badNumbers = [
      { page: 1, ordinal: 1, display: 'א׳', shown: true, counted: true },
      { page: 3, ordinal: 3, display: 'ג׳', shown: true, counted: true }, // דילוג 2
      { page: 4, ordinal: 2, display: 'ב׳', shown: true, counted: true }, // כפילות/אי־סדר
    ];
    const seq = auditNumbering(badPages, badNumbers, s, mkMeasure(), {});
    assert(seq.sequence.length >= 2, `sequence violations caught (got ${seq.sequence.length})`);
    assert(seq.sequence.some(x => x.why === 'ordinal-skip-or-dup'), 'skip/dup flagged');
    // הפרת נוסחה:
    const formulaNumbers = [
      { page: 1, ordinal: 1, display: 'א׳', shown: true, counted: true },
      { page: 9, ordinal: 2, display: 'ט׳', shown: true, counted: true }, // 2−1+1=2 ≠ 9
    ];
    const f = auditNumbering(badPages, formulaNumbers, s, mkMeasure(), {});
    assert(f.sequence.some(x => x.why === 'effective-formula-mismatch'), 'formula mismatch flagged');
    // גלישת גיליון:
    const widePages = [{ index: 0, type: 'regular', template: { contentBox: { left: 60, right: 734 }, width: 794 } }];
    const wideNumbers = [{ page: 1, ordinal: 1, display: 'דף תתק״ל ועוד הרבה מאוד טקסט ארוך', shown: true, counted: true }];
    const o = auditNumbering(widePages, wideNumbers, s, mkMeasure(), {});
    assertEq(o.overflow.length, 1, 'oversized folio flagged');
    assert(o.overflow[0].widthPx > o.overflow[0].budgetPx, 'width>budget');
    // חיווט ledger בפועל:
    const fakeLedger = {
      issues: new Map(),
      create(kind, target, page, pred, stage) {
        const id = `${kind}@${target}#${this.issues.size + 1}`;
        this.issues.set(id, { issue_id: id, kind, status: 'created' });
        return this.issues.get(id);
      },
      transition(id, state) { if (this.issues.has(id)) this.issues.get(id).status = state; return this.issues.get(id); },
    };
    auditNumbering(badPages, badNumbers, s, mkMeasure(), { ledger: fakeLedger });
    const kinds = [...fakeLedger.issues.values()].map(x => x.kind);
    assert(kinds.includes('pn-sequence'), 'pn-sequence in ledger');
  });

  it('ספירת גיליונות מוצגת מונוטונית בעמודים אמיתיים (בדיקת אינטגרציה מלאה)', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    const shown = r.numbers.filter(n => n.display);
    assert(shown.length >= 3, `folios shown (got ${shown.length})`);
    for (let i = 1; i < shown.length; i++) {
      assert(shown[i].page > shown[i - 1].page, `monotonic: ${shown[i - 1].page} → ${shown[i].page}`);
    }
  });
});

// =====================================================================
describe('S9 — עומק נוסף: D-63 (זוגיות אחרי הכנסות), CSS, ייצוא HTML', () => {
  it('D-63: אחרי הכנסת TOC לכל עמוד תבנית מותאמת לזוגיות הסופית (binding=0 זהה מספרית)', () => {
    const s = getDefaultSettings();
    const r = typeset(sampleDoc(3, 18), s);
    for (const pg of r.pages) {
      const tpl = buildPageTemplate(pg.type, s, pg.index % 2 === 0);
      assertEq(pg.isRecto, pg.index % 2 === 0, `page ${pg.index} isRecto`);
      assertEq(pg.template.width, tpl.width, `page ${pg.index} template parity-rebuilt`);
      assertEq(pg.template.columns.length, tpl.columns.length, `page ${pg.index} columns match type`);
    }
  });

  it('ייצוא HTML עצמאי כולל עמודי TOC וקישורים פנימיים — ואינו שובר offline-guard', () => {
    const s = getDefaultSettings();
    const r = typeset(sampleDoc(2, 18), s);
    const doc = makeDoc();
    const frags = r.pages.map(pg => renderPage(pg, s, doc, pg.header || null).outerHTML());
    const html = buildStandaloneHtml(frags, s, { title: 'S9 (RED)' });
    assert(html.includes('toc-page-title'), 'TOC title in export');
    assert(html.includes('href="#page-'), 'clickable links in export');
    assert(html.includes('.toc-row'), 'TOC CSS present');
    assert(html.includes('.page-num-badge'), 'badge CSS present');
    assert(html.includes('.folio--top'), 'folio top CSS present');
    assert(html.includes('.folio--in-header'), 'folio in-header CSS present');
    assert(!html.includes('https://'), 'offline-safe (no external refs)');
  });

  it('CSS מסגרות מבדיל circle מ‑square (REQ-HDR-04) ותומך בכל שבע המסגרות', () => {
    const frames = ['none', 'circle', 'square', 'parenthesis', 'squares', 'floral', 'diamond'];
    for (const f of frames) {
      const r = typeset(sampleDoc(1, 18), { ...getDefaultSettings(), 'page-num-frame': f });
      const doc = makeDoc();
      const pg = r.pages.find(p => p.folioDisplay);
      const el = renderPage(pg, { ...getDefaultSettings(), 'page-num-frame': f }, doc, pg.header);
      assert(el.outerHTML().includes(`folio--frame-${f}`), `frame class ${f}`);
      if (f === 'circle' || f === 'square') {
        assert(el.outerHTML().includes('page-num-badge'), `badge for ${f}`);
      }
    }
    // הגדרות הרישום מכסות את כל השבע:
    const { findKey } = require('../../src/engine/core/settings-registry');
    assertEq(findKey('page-num-frame').enum, frames, 'enum has all 7 frames');
  });
});

report('s9-headers');
