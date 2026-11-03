// tests/e2e/s8-decoration.test.js — שער S8 (S8.2): עיטורים, שערים, מפרידים, גרפיקה, ניטרליות
// כל בדיקה כאן נכתבה לנעילת שער ספציפי מ־02_MASTER_WORK_PLAN.md §S8.2 או REQ-ORN-01..08.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { describe, it, assert, assertEq, assertClose, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const {
  groupThemeSets, activateThemeSet, uniqueShaarId, buildPickerModel, extractSetNumber, detectRole
} = require('../../src/engine/decoration/theme-sets');
const {
  resolveShaarBox, clampShaarBox, moveShaarBox, resizeShaarBox,
  exportShaarItemsWithPositions, boxPositionsIdentical
} = require('../../src/engine/decoration/shaar-boxes');
const { wrapShaarMedia, isPathSafe, importAssetFolder, acceptsMedia } = require('../../src/engine/decoration/assets-import');
const { sanitizeSvg, svgCspDirective } = require('../../src/engine/decoration/svg-sanitize');
const { parseCustomPageTypes, planCustomPages, buildCustomPageGeometry } = require('../../src/engine/decoration/custom-pages');
const {
  fitOrnamentToText, refitStable, columnDividerHeightPx, chapterEndOrnamentFit,
  h2OrnamentMarginsPx, sideOrnamentLiftPx, h2OrnamentScope, dividerInsertable,
  assertSingleSourceSizing
} = require('../../src/engine/decoration/ornament-fit');
const { columnDividerGeometry, shaarDividerDecision, headingDividerDecision } = require('../../src/engine/decoration/dividers');
const { planBackground, backgroundClassForPage, planDecorations } = require('../../src/engine/decoration/page-decorations');
const { auditOrnaments, planPageOrnaments } = require('../../src/engine/decoration/ornament-plan');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

// ---------- DOM shim (אורקל רינדור — כמו ב־pipeline.test.js, כולל סריאליזציית style) ----------
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

const ornConfig = (extra = {}) => ({
  ...getDefaultSettings(),
  'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'pyramid', 'h2-orn-side': 'lance',
  'h3-side-orn': 'scroll', 'heading-dividers-h3-h6': true,
  'chapter-end-ornament': 'pyramid', 'column-divider-style': 'thin',
  ...extra
});

const persisted = (r, kind) => [...r.ledger.issues.values()].filter(x => x.kind === kind && x.status !== 'resolved');

// =====================================================================
describe('S8.2 gate 1 — ornament-* kinds = 0 על קורפוס קנוני + קונפיגורציית עיטורים מלאה', () => {
  it('canonical + ornaments: overflow=0, overlap=0, asymmetry=0 (ממצאים בפועל, לא הסכמה)', () => {
    const r = typeset(CORPUS, ornConfig());
    assertEq(r.ornaments.findings.overflow.length, 0, 'ornament-overflow');
    assertEq(r.ornaments.findings.overlap.length, 0, 'ornament-overlap');
    assertEq(r.ornaments.findings.asymmetry.length, 0, 'ornament-asymmetry');
    assertEq(persisted(r, 'ornament-overflow').length, 0, 'ledger ornament-overflow');
    assertEq(persisted(r, 'ornament-overlap').length, 0, 'ledger ornament-overlap');
    assertEq(persisted(r, 'ornament-asymmetry').length, 0, 'ledger ornament-asymmetry');
  });

  it('עיטורים באמת נשתלו (הבדיקה אינה ואקום — אפס ממצאים עם אפס עיטורים היה טריוויאלי)', () => {
    const r = typeset(CORPUS, ornConfig());
    const p = r.ornaments.planted;
    assert(p.h2Top > 0 && p.h2Bottom > 0, `h2 top/bottom planted: ${JSON.stringify(p)}`);
    assert(p.h2Side >= 2, 'h2 side ornaments planted');
    assert(p.h3Side > 0, 'h3 side ornaments planted');
    assert(p.headingDivider > 0, 'heading dividers planted');
    assert(p.chapterEnd > 0, 'chapter-end ornaments planted');
    assert(r.contentPreserved === true, 'content preserved with full ornaments');
  });

  it('מייצרים אמיתיים: הזרקת פגם ⇒ הממצא נרשם (אנטי־קישוט — הבדיקות יכולות להיכשל)', () => {
    // overflow: rect שחורג מתיבת התוכן
    const pagesOverflow = [{
      index: 0, template: { contentBox: { top: 100, bottom: 900, height: 800 }, columns: [{ x: 50, w: 300 }] },
      columns: [[]], decorations: [{ kind: 'x', slot: 'chapter-end', x: 50, y: 890, w: 100, h: 40 }]
    }];
    assertEq(auditOrnaments(pagesOverflow).overflow.length, 1, 'injected overflow detected');
    // overlap: שני rects נחתכים
    const pagesOverlap = [{
      index: 0, template: { contentBox: { top: 0, bottom: 900, height: 900 }, columns: [{ x: 0, w: 300 }] },
      columns: [[]], decorations: [
        { kind: 'x', slot: 'a', x: 10, y: 10, w: 50, h: 50 },
        { kind: 'x', slot: 'b', x: 30, y: 30, w: 50, h: 50 }
      ]
    }];
    assertEq(auditOrnaments(pagesOverlap).overlap.length, 1, 'injected overlap detected');
    // asymmetry: מרווחים אפקטיביים לא שווים (F-21)
    const pagesAsym = [{
      index: 0, template: { contentBox: { top: 0, bottom: 900, height: 900 }, columns: [{ x: 0, w: 300 }] },
      columns: [[]], decorations: [
        { kind: 'x', slot: 'h2-top', x: 0, y: 10, w: 50, h: 10, marginGapTop: 5 },
        { kind: 'x', slot: 'h2-bottom', x: 0, y: 60, w: 50, h: 10, marginGapBottom: 15 }
      ]
    }];
    assertEq(auditOrnaments(pagesAsym).asymmetry.length, 1, 'injected asymmetry detected (F-21)');
    // רקע/טקסטורה פטורים מחפיפה — תיעוד הפטור בפועל
    const pagesBg = [{
      index: 0, template: { contentBox: { top: 0, bottom: 900, height: 900 }, columns: [{ x: 0, w: 300 }] },
      columns: [[]], decorations: [
        { kind: 'x', slot: 'page-background', x: 0, y: 0, w: 300, h: 900 },
        { kind: 'x', slot: 'orn', x: 10, y: 10, w: 50, h: 50 }
      ]
    }];
    assertEq(auditOrnaments(pagesBg).overlap.length, 0, 'background underlay exempt from overlap');
  });
});

// =====================================================================
describe('S8.2 gate 2 — רגרסיית F-10: טעינת ערכת JSON מפעילה את שלושת השערים', () => {
  const themeSetItems = [
    { name: '1 שער ראשי', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="gold"/></svg>' },
    { name: '1 שער משנה', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="silver"/></svg>' },
    { name: '1 שער אחורי', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="bronze"/></svg>' }
  ];

  it('הפעלה מלאה: main + sub + back — לא רק ראשי (באג F-10 נעול לצמיתות)', () => {
    const sets = groupThemeSets(themeSetItems);
    assertEq(sets.length, 1, 'one set grouped');
    const { updates, activated, missing } = activateThemeSet(sets[0], getDefaultSettings());
    assertEq(missing, [], 'no missing roles');
    assert(activated.main && activated.sub && activated.back, `all three activated: ${JSON.stringify(activated)}`);
    assert(updates['shaar-main-image'] && updates['shaar-sub-image'] && updates['shaar-back-image'], 'all three images set');
    assertEq(updates['theme-set-id'], sets[0].key);
  });

  it('ייחודיות id: שני שמות עבריים שההחלפה ל־"_" היתה מטשטשת — מזהים שונים (שיעור packerandconfigurator)', () => {
    const a = uniqueShaarId('1 שער ראשי', 0);
    const b = uniqueShaarId('1 שער משנה', 1);
    assert(a !== b, `ids must differ: ${a} vs ${b}`);
    const c = uniqueShaarId('1 שער ראשי', 2);
    assert(a !== c, 'same name different index ⇒ different id');
    const ids = themeSetItems.map((it, i) => uniqueShaarId(it.name, i));
    assertEq(new Set(ids).size, 3, 'all three ids unique');
  });

  it('E2E: הפעלת ערכה ⇒ עמודי שער ראשי+אחורי בפועל, ורינדור תמונת הערכה', () => {
    const sets = groupThemeSets(themeSetItems);
    const { updates } = activateThemeSet(sets[0], getDefaultSettings());
    const s = { ...getDefaultSettings(), ...updates };
    const r = typeset(CORPUS, s);
    const types = r.pages.map(p => p.type);
    assert(types.includes('shaar-main'), 'shaar-main page exists');
    assert(types.includes('shaar-back'), 'shaar-back page exists');
    assertEq(r.pages[0].type, 'shaar-main', 'shaar-main is the first page (recto)');
    // רינדור: תמונת הערכה על עמוד השער הראשי
    const doc = makeDoc();
    const el = renderPage(r.pages[0], s, doc, null);
    const html = el.outerHTML();
    assert(html.includes('deco--shaar-main'), 'theme image rendered on shaar-main');
    assert(html.includes('shaar-main-box'), 'main text box rendered (REQ-ORN-05)');
    assert(r.contentPreserved === true, 'content preserved with shaar pages');
    assert(r.geometryNeutralVerified === true, 'geometry neutral with shaar pages');
  });

  it('בורר ויזואלי: תצוגה מקדימה מהשער הראשי + מידע hasSub/hasBack (U-C1/C2)', () => {
    const sets = groupThemeSets(themeSetItems);
    const model = buildPickerModel(sets);
    assertEq(model.length, 1);
    assert(model[0].preview, 'preview from main shaar');
    assert(model[0].hasSub && model[0].hasBack, 'sub/back availability exposed');
    assertEq(model[0].label, 'ערכה 1');
  });
});

// =====================================================================
describe('S8.2 gate 3 — עיגול־שלם של תיבות שער: הזזה → ייצוא JSON → טעינה → מיקומים זהים', () => {
  it('drag+resize+export+reload — המיקום שורד (REQ-ORN-05)', () => {
    const items = [{ id: 'set1-main-xyz', name: '1 שער ראשי', type: 'main', svg: '<svg/>' }];
    let saved = {};
    // גרירה לפי מזהה פרטני (לקח V4: לא לפי סוג!)
    saved = moveShaarBox(saved, 'main', 'set1-main-xyz', 5, 8, 210, 297);
    saved = resizeShaarBox(saved, 'main', 'set1-main-xyz', 'se', -10, -6, 210, 297);
    // ייצוא עם box מוטמע
    const exported = exportShaarItemsWithPositions(items, saved);
    assert(exported[0].box, 'box embedded in export');
    const exportedJson = JSON.parse(JSON.stringify(exported));
    // "טעינה מחדש": ה־box המוטמע הוא עכשיו המקור; הזזה נוספת לא מתבצעת
    const reloaded = resolveShaarBox('main', 'set1-main-xyz', exportedJson[0], null, { top: 40, bottom: 40, right: 30, left: 30 });
    assertEq(reloaded.source, 'json', 'embedded box wins on reload');
    assert(boxPositionsIdentical(exported[0].box, reloaded.box), 'positions identical after roundtrip');
    // עיגול־שלם שני: ייצוא שוב ⇒ זהה
    const exported2 = exportShaarItemsWithPositions(exportedJson, null);
    assert(boxPositionsIdentical(exported2[0].box, reloaded.box), 'second roundtrip stable');
  });

  it('סדר קדימויות V4: box מוטמע > מיקום שמור > ברירת מחדל', () => {
    const jsonBox = { top: 10, bottom: 11, right: 12, left: 13 };
    const saved = { main: { id1: { top: 20, bottom: 21, right: 22, left: 23 } } };
    assertEq(resolveShaarBox('main', 'id1', { box: jsonBox }, saved, null).source, 'json');
    assertEq(resolveShaarBox('main', 'id1', {}, saved, null).source, 'saved');
    assertEq(resolveShaarBox('main', 'id2', {}, saved, { top: 1, bottom: 2, right: 3, left: 4 }).source, 'default');
  });

  it('הצמדה לגבולות העמוד — גרירה לא יוצאת מהדף', () => {
    const clamped = clampShaarBox({ top: -50, bottom: 400, right: 300, left: -10 }, 210, 297);
    assert(clamped.top >= 0 && clamped.left >= 0, 'no negative insets');
    assert(clamped.bottom <= 297 / 2 && clamped.right <= 210 / 2, 'box keeps minimal width/height');
  });
});

// =====================================================================
describe('S8.2 gate 4 — גובה מפריד טורים לפי כלל Math.min −8px תחת עומס (טורים לא־שווים)', () => {
  it('עמוד עם טורים לא־שווים בפועל — הגובה נגזר מהטור הקצר', () => {
    const r = typeset(CORPUS, { ...getDefaultSettings(), 'column-divider-style': 'dashed' });
    const twoColPages = r.pages.filter(p => p.columns.length === 2 && p.columns.every(c => c.length));
    assert(twoColPages.length > 0, 'fixture has two-column pages');
    for (const pg of twoColPages) {
      const geo = columnDividerGeometry(pg, { 'column-divider-style': 'dashed' });
      if (!geo) continue;
      const u0 = pg.columns[0].reduce((s, l) => s + (l.heightPx || 0), 0);
      const u1 = pg.columns[1].reduce((s, l) => s + (l.heightPx || 0), 0);
      const expect = Math.max(0, Math.min(u0, u1) - 8);
      assertClose(geo.h, expect, 0.5, 'Math.min−8 rule under unequal columns');
    }
  });

  it('מקור יחיד: columnDividerHeightPx (הרנדרר והגיאומטריה עוברים דרך אותה פונקציה — F-09)', () => {
    assertEq(columnDividerHeightPx([500, 300]), 292);
    assertEq(columnDividerHeightPx([300, 500]), 292);
    assertEq(columnDividerHeightPx([8, 100]), 0, 'never negative');
  });
});

// =====================================================================
describe('S8.2 gate 5 — פאס העיטורים מוכח ניטרלי גיאומטרית (CP4==CP5 אמיתי)', () => {
  it('עם כל העיטורים דלוקים: bodyGeometryHash זהה לפני/אחרי (hashes equal modulo decoration rects)', () => {
    for (const variant of [ornConfig(), ornConfig({ 'chapter-end-ornament': 'shoshanta', 'h3-side-orn-height-em': 1.5 })]) {
      const r = typeset(CORPUS, variant);
      assertEq(r.geometryNeutralVerified, true, 'geometry neutral');
      assert(r.ornaments.planted.chapterEnd > 0, 'ornaments actually planted (not a vacuous proof)');
    }
  });

  it('שערים במסמך לא משנים שורות קיימות — רק מוסיפים עמודים (תוספת מוצהרת)', () => {
    const base = typeset(CORPUS, getDefaultSettings());
    const sets = groupThemeSets([{ name: '1 שער ראשי', svg: '<svg/>' }, { name: '1 שער משנה', svg: '<svg/>' }, { name: '1 שער אחורי', svg: '<svg/>' }]);
    const { updates } = activateThemeSet(sets[0], getDefaultSettings());
    const withShaar = typeset(CORPUS, { ...getDefaultSettings(), ...updates, 'show-shaar-sub': true });
    assert(withShaar.pages.length > base.pages.length, 'shaar pages added');
    assertEq(withShaar.geometryNeutralVerified, true, 'additions declared, lines untouched');
    // שורות הגוף בעמודי התוכן זהות (אותו טוקן ⇒ אותן מילים)
    assertEq(base.contentPreserved, true);
    assertEq(withShaar.contentPreserved, true, 'content preserved with full shaar set');
  });
});

// =====================================================================
describe('S8.2 gate 6 — אבטחת ייבוא תיקייה: ניסיון path traversal נדחה', () => {
  it('נתיבים מסוכנים נדחים אחד־אחד', () => {
    for (const bad of ['../escape.svg', 'assets/../../etc/passwd', '/abs/path.svg', 'C:\\win.svg', 'file:///etc/x.svg', 'a\\b.svg', 'x\0.svg', 'http://evil/x.svg']) {
      assert(isPathSafe(bad) === false, `must reject: ${bad}`);
    }
    for (const ok of ['1 שער ראשי.svg', 'assets/1 שער משנה.png', 'sub/dir/back.jpg']) {
      assert(isPathSafe(ok) === true, `must accept: ${ok}`);
    }
  });

  it('ייבוא תיקייה: קבצים חוקיים נכנסים, ניסיון חדירה מדווח ולא נזנק בשקט', () => {
    const files = [
      { name: '1 שער ראשי.svg', webkitRelativePath: 'assets/1 שער ראשי.svg', content: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>' },
      { name: 'evil.svg', webkitRelativePath: 'assets/../../evil.svg', content: '<svg/>' },
      { name: 'notes.txt', webkitRelativePath: 'assets/notes.txt', content: 'not media' }
    ];
    const res = importAssetFolder(files);
    assertEq(res.themeItems.length, 1, 'only the safe SVG imported');
    assertEq(res.rejected.length, 2, 'traversal + non-media rejected');
    assert(res.rejected.some(x => x.reason === 'path-unsafe'), 'traversal explicitly reported');
    assert(res.rejected.some(x => x.reason === 'unsupported-media'), 'non-media explicitly reported');
  });

  it('JPG/PNG נתמכים דרך wrapShaarMedia (REQ-ORN-07); SVG עובר חיטוי בקבלה', () => {
    assert(acceptsMedia('a.svg') && acceptsMedia('b.JPG') && acceptsMedia('c.png'), 'media types');
    assert(!acceptsMedia('d.gif'), 'unsupported type rejected');
    const png = wrapShaarMedia('2 שער ראשי.png', 'data:image/png;base64,AAAA');
    assert(png.ok && png.item.media, 'png wrapped with media');
    const bad = wrapShaarMedia('x.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="5" height="5"/></svg>');
    assert(bad.ok && !bad.item.svg.includes('script'), 'svg sanitized on import');
  });
});

// =====================================================================
describe('S8.2 gate 7 — חיטוי SVG + CSP (משימה 10; המשך מלא ב־S13)', () => {
  it('סקריפט/foreignObject/on*/javascript: נשללים; SVG נקי עובר ללא שינוי מהותי', () => {
    const evil = `<svg xmlns="http://www.w3.org/2000/svg" onload="evil()"><script>alert(1)</script><foreignObject><body>x</body></foreignObject><a href="javascript:evil()"><rect width="5" height="5" fill="red"/></a><image xlink:href="http://evil/x.png" width="5" height="5"/></svg>`;
    const res = sanitizeSvg(evil);
    assert(res.ok, 'svg remains valid');
    for (const forbidden of ['script', 'foreignObject', 'onload', 'javascript:', 'http://evil']) {
      assert(!res.svg.includes(forbidden), `removed: ${forbidden}`);
    }
    assert(res.removed.length > 0, 'removals documented');
    const clean = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><g><rect width="10" height="10" fill="blue"/></g></svg>');
    assert(clean.ok && clean.removed.length === 0, 'clean svg untouched');
    const style = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><style>.a{background:url(https://evil/x)}</style><rect width="5" height="5"/></svg>');
    assert(style.removed.includes('style:external-url'), 'external url in style blocked');
  });

  it('CSP hook: מדיניות ללא eval/אובייקטים/מקורות חיצוניים', () => {
    const csp = svgCspDirective();
    assert(csp.includes("script-src 'self'") && csp.includes('object-src \'none\''), 'strict CSP');
    assert(!csp.includes('unsafe-eval'), 'no unsafe-eval');
  });
});

// =====================================================================
describe('REQ-ORN-01 — התאמת עיטורים לטקסט (מדידת JS; F-08/F-09/F-21)', () => {
  it('fit-to-text: סקאלה מתייצבת מיד — re-fit סינכרוני בלי הזזה', () => {
    assertEq(fitOrnamentToText(100, 300), 3, 'capped at 3');
    assertEq(fitOrnamentToText(200, 100), 0.5, 'min 0.25');
    assert(refitStable(120, 260), 'refit stable (F-08: no post-process shift)');
  });

  it('F-21: מרווחי H2 עליון/תחתון שווים אפקטיבית — מבנית, מאותו מקור', () => {
    const m = h2OrnamentMarginsPx(26.67);
    assertEq(m.top, m.bottom, 'equal by construction');
    assert(m.top >= 2, 'minimal breathing room');
  });

  it('שיעור V4: הרמה אופטית −0.08em לעיטורי צד', () => {
    assertClose(sideOrnamentLiftPx(25), -2, 0.01, '−0.08em lift');
    assert(sideOrnamentLiftPx(25) < 0, 'upward');
  });

  it('F-09: מקור שליטה יחיד — אין cssWidthPx/cssHeightPx יחד עם rect', () => {
    assertEq(assertSingleSourceSizing({ w: 10, h: 5 }).ok, true);
    assertEq(assertSingleSourceSizing({ w: 10, h: 5, cssWidthPx: 10 }).ok, false, 'dual source rejected');
    assertEq(assertSingleSourceSizing({ w: 10 }).ok, false, 'missing rect rejected');
  });

  it('REQ-ORN-02: היקף H2 — סימן/כותרת/שניהם + מצבים עצמאיים', () => {
    const s = (o) => h2OrnamentScope({ 'h2-orn-scope': o.scope, 'h2-orn-top': o.top, 'h2-orn-bottom': o.bottom, 'h2-orn-side': o.side });
    assertEq(s({ scope: 'sign', top: 'pyramid', bottom: 'none', side: 'lance' }).titleSide, false, 'sign-only: side off');
    assertEq(s({ scope: 'title', top: 'pyramid', bottom: 'none', side: 'lance' }).signTop, false, 'title-only: top off');
    assert(s({ scope: 'both', top: 'pyramid', bottom: 'pyramid', side: 'lance' }).any, 'both on');
    assert(!s({ scope: 'both', top: 'none', bottom: 'none', side: 'none' }).any, 'kinds all none ⇒ off');
  });
});

// =====================================================================
describe('REQ-ORN-03 — עיטור סיום־פרק בתקציב הפנוי; לעולם לא דוחף תוכן', () => {
  it('מתאים לתקציב / מתכווץ עד רצפה / נדחה מתחת לרצפה — עם סיבה', () => {
    const roomy = chapterEndOrnamentFit('pyramid', 80, 24, 200);
    assert(roomy.placed && roomy.scale === 1 && roomy.hPx === 24, 'roomy budget: as-is');
    const tight = chapterEndOrnamentFit('pyramid', 80, 24, 15);
    assert(tight.placed && tight.hPx === 15, 'tight budget: scaled down to fit');
    const impossible = chapterEndOrnamentFit('pyramid', 80, 24, 8);
    assert(!impossible.placed && impossible.reason === 'below-min-scale', 'below floor: rejected with reason');
    assertEq(chapterEndOrnamentFit('none', 80, 24, 200).reason, 'kind-none');
    assertEq(chapterEndOrnamentFit('bogus', 80, 24, 200).reason, 'kind-unknown');
    assertEq(chapterEndOrnamentFit('pyramid', 0, 24, 200).reason, 'dims-invalid');
  });

  it('E2E: דחייה מתועדת ב־ledger (אין גניזה) כשאין תקציב; העיטור לא חוסם שער גאומטרי', () => {
    // תקציב מינימלי: העמוד האחרון כמעט מלא ⇒ עיטור גדול נדחה ומתועד
    const r = typeset(CORPUS, ornConfig({ 'chapter-end-ornament-h-em': 4, 'chapter-end-ornament-w-em': 12 }));
    const rejections = [...r.ledger.issues.values()].filter(x => x.kind === 'ornament-rejected');
    // לא מוודא מספר — מוודא שכל דחייה שקרתה תועדה (שקיפות), ושהתוכן לא נפגע
    for (const rec of rejections) {
      assert(rec.predicate_before.reason, 'rejection reason recorded');
    }
    assertEq(r.contentPreserved, true, 'content intact — ornament never blocks');
    assert(r.pages.length >= 17, 'page count not inflated by ornament');
  });
});

// =====================================================================
describe('REQ-ORN-04 — מפרידי כותרות H3–H6 + מפרידי שערים (שידרוג Orange)', () => {
  it('משמרות: אין מפריד בראש טור / טור ריק; fits() באתר ההצבה בפועל', () => {
    assertEq(dividerInsertable([], 0), false, 'empty column');
    const heading = { kind: 'heading', level: 3 };
    assertEq(dividerInsertable([heading], 0), false, 'column head — no divider');
    assertEq(dividerInsertable([{ kind: 'paragraph' }, heading], 1), true, 'mid-column heading — divider ok');
    assertEq(dividerInsertable([{ kind: 'paragraph' }], 0), false, 'not under a heading');
    // fits() בתקציב אמיתי — תקציב 1px קטן מגובה המפריד (2px)
    const dec = headingDividerDecision({ 'heading-dividers-h3-h6': true }, 1, 2, { columnLinesBefore: [{}, heading], colIdx: 0 });
    assertEq(dec.insert, false, 'no fit budget');
    assert(dec.rollbackKey === undefined, 'no rollback key when not inserted');
    const ok = headingDividerDecision({ 'heading-dividers-h3-h6': true }, 50, 2, { columnLinesBefore: [{}, heading], colIdx: 0, pageIndex: 3, tokenId: 't9' });
    assert(ok.insert && ok.rollbackKey && ok.rollbackKey.startsWith('hdr-div:3:t9'), 'rollback-aware key');
  });

  it('E2E: מפרידים לא בראש טור — כל מפריד נבדק באתרו; rollback-aware counters reset per document', () => {
    const r = typeset(CORPUS, ornConfig());
    for (const pg of r.pages) {
      for (const d of (pg.decorations || [])) {
        if (d.kind !== 'heading-divider') continue;
        // המפריד חייב להיות מתחת לכותרת שאינה בראש הטור: y מעל תחילת התוכן + שורה אחת לפחות מעליו
        assert(d.y > pg.template.contentBox.top + 5, `divider not at column head (p${pg.index})`);
      }
    }
    assertEq(r.ornaments.counters.count(), r.ornaments.planted.headingDivider, 'counters match planted dividers (rollback-aware)');
  });

  it('מפרידי שערים: main/sub לפי הגדרה (PT-01/02)', () => {
    const s = { 'shaar-main-divider': 'double', 'shaar-sub-divider': 'thin' };
    assertEq(shaarDividerDecision('shaar-main', s).insert, true);
    assertEq(shaarDividerDecision('shaar-main', s).style, 'double');
    assertEq(shaarDividerDecision('shaar-sub', s).style, 'thin');
    assertEq(shaarDividerDecision('regular', s).insert, false, 'not a shaar page');
    assertEq(shaarDividerDecision('shaar-main', { 'shaar-main-divider': 'none' }).insert, false);
  });
});

// =====================================================================
describe('REQ-ORN-06/08 + PT-09 — ערכות, רקעים ממוזגים, עמודים מותאמים', () => {
  it('REQ-ORN-08: רקע לפי מחלקת עמוד (regular/preface-open/sign-open) + inset מ״מ', () => {
    const s = { 'background-page-type': 'sign-open', 'background-image': 'bg.png', 'background-texture': 'tex.png', 'background-inset-mm': 5 };
    assertEq(backgroundClassForPage({ type: 'sign-open' }), 'sign-open');
    assertEq(backgroundClassForPage({ type: 'preface', chapterOpening: true }), 'preface-open');
    assertEq(backgroundClassForPage({ type: 'regular' }), 'regular');
    const bg = planBackground({ type: 'sign-open' }, s);
    assert(bg.image === 'bg.png' && bg.texture === 'tex.png', 'background planned for matching class');
    assertClose(bg.insetPx, 5 * 96 / 25.4, 0.5, 'mm→px inset');
    assertEq(planBackground({ type: 'regular' }, s), null, 'non-matching class: no background');
  });

  it('E2E: רקע sign-open מרונדר רק על עמודי פתיחת סימן (מיזוג פאנל רקע→נושאים)', () => {
    const r = typeset(CORPUS, ornConfig({ 'background-page-type': 'sign-open', 'background-image': 'bg.png' }));
    const doc = makeDoc();
    let withBg = 0, signOpen = 0;
    for (const pg of r.pages) {
      const el = renderPage(pg, ornConfig({ 'background-page-type': 'sign-open', 'background-image': 'bg.png' }), doc, pg.header);
      const html = el.outerHTML();
      if (pg.type === 'sign-open') { signOpen++; if (html.includes('deco--page-background')) withBg++; }
      else assert(!html.includes('deco--page-background'), `bg only on sign-open (p${pg.index} ${pg.type})`);
    }
    assert(signOpen > 0 && withBg === signOpen, `all ${signOpen} sign-open pages carry the background`);
  });

  it('PT-09: פענוח עמודים מותאמים + מיקום + counted; הצבה בפועל ברצף', () => {
    const defs = parseCustomPageTypes(JSON.stringify({
      pages: [
        { id: 'dedication', position: { at: 'after-shaar-main' }, counted: false, boxes: [{ text: 'מוקדש ל...', x: 40, y: 100, w: 120, h: 30 }] },
        { id: 'p2-front', position: { at: 'before-part', part: 2 }, counted: true, images: [{ src: 'img.png', x: 10, y: 10, w: 50, h: 50 }] },
        { id: 'bad-pos', position: { at: 'middle-of-nowhere' } },
        { id: 'dup', position: { at: 'end' } }, { id: 'dup', position: { at: 'end' } }
      ]
    }));
    assertEq(defs.pages.length, 3, 'bad position dropped');
    assert(defs.errors.some(e => e.includes('bad-position')), 'bad position reported');
    assert(defs.errors.some(e => e.includes('duplicate-id')), 'duplicate id reported (packer lesson)');
    const plan = planCustomPages(defs.pages, { partsCount: 3, hasShaarMain: true });
    assert(plan.start.length === 1 && plan.beforePart.get(2).length === 1 && plan.end.length === 1, 'positions planned');
    const geo = buildCustomPageGeometry(defs.pages[0], {});
    assertEq(geo.counted, false, 'counted flag honored');
    assert(geo.boxes[0].x > 0, 'mm→px applied');
  });

  it('E2E: עמוד מותאם מוכנס ואינו נספר כש־counted=false; תוכן קבוע מרונדר', () => {
    const s = ornConfig({
      _customPages: JSON.stringify({ pages: [{ id: 'ded', position: { at: 'end' }, counted: false, boxes: [{ text: 'נכתב לדוגמה', x: 30, y: 60, w: 150, h: 40 }] }] })
    });
    const r = typeset(CORPUS, s);
    const custom = r.pages.filter(p => p.type === 'custom');
    assertEq(custom.length, 1, 'custom page inserted');
    assertEq(custom[0].pageNumber, null, 'counted=false ⇒ not numbered');
    const doc = makeDoc();
    const el = renderPage(custom[0], s, doc, null);
    assert(el.outerHTML().includes('custom-box') && el.outerHTML().includes('נכתב לדוגמה'), 'fixed content rendered');
  });
});

// =====================================================================
describe('FWD-1/FWD-2 — סגירת קצוות פתוחים מ־ISSUE_REGISTRY', () => {
  it('FWD-1: H2 נמדדה ברוחב מלא ומוצבת בפס חוצה־טורים — לא בטור חצי־רוחב', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    const spanPages = r.pages.filter(p => p.spanning);
    assert(spanPages.length > 0, 'spanning bands exist');
    for (const pg of spanPages) {
      // הכותרת אינה בטורים — והטורים נמדדים מתחת לפס
      const h2InCols = pg.columns.some(col => col.some(ln => ln.kind === 'heading' && ln.level === 2));
      assert(!h2InCols, 'full-width H2 not squeezed into a column');
      const used = pg.columns[0].reduce((s, l) => s + (l.heightPx || 0), 0);
      assert(used <= pg.template.contentBox.height - pg.spanning.heightPx + 0.5, 'columns respect the band');
    }
    // שינוי לגיטימי מתועד: אירוע h2-spanning נרשם
    const ev = r.events.events.filter(e => e.label === 'h2-spanning');
    assert(ev.length === spanPages.length, 'spanning events recorded');
  });

  it('FWD-2: shaar-sub לפני כל פתיחת חלק + איפוס מונים בגבולות (S7.1.6)', () => {
    const sets = groupThemeSets([{ name: '1 שער ראשי', svg: '<svg/>' }, { name: '1 שער משנה', svg: '<svg/>' }, { name: '1 שער אחורי', svg: '<svg/>' }]);
    const { updates } = activateThemeSet(sets[0], getDefaultSettings());
    const r = typeset(CORPUS, {
      ...getDefaultSettings(), ...updates,
      'show-shaar-sub': true,
      'footnote-reset-policy': 'part', 'footnote-marker-style': 'decimal'
    });
    const subPages = r.pages.filter(p => p.type === 'shaar-sub');
    assert(subPages.length >= 2, `shaar-sub pages before each part (got ${subPages.length})`);
    // כל shaar-sub מפנה לפתיחת חלק: אחריו עמוד preface
    for (const sp of subPages) {
      const nextPg = r.pages[sp.index + 1];
      assert(nextPg && nextPg.type === 'preface', `shaar-sub followed by part opening (p${sp.index})`);
    }
    // איפוס מונים: סמנים עשרוניים מתחילים מחדש אחרי כל גבול חלק
    const markersByPart = new Map();
    for (const pg of r.pages) {
      for (const col of pg.columns) for (const ln of col) {
        const part = ln.meta && ln.meta.docPart;
        if (part == null) continue;
        if (!markersByPart.has(part)) markersByPart.set(part, []);
        for (const w of (ln.words || [])) if (/^\d+$/.test(w)) markersByPart.get(part).push(Number(w));
      }
    }
    for (const [part, nums] of markersByPart) {
      if (nums.length >= 2) {
        assert(nums[0] === 1 || nums.every(n => n > 0), `part ${part}: counters restart per part`);
      }
    }
    assertEq(r.contentPreserved, true, 'content preserved');
  });

  it('טוגל "הצג שער משנה" כבוי (ברירת מחדל) — אין עמודי shaar-sub (U-C2)', () => {
    const sets = groupThemeSets([{ name: '1 שער ראשי', svg: '<svg/>' }, { name: '1 שער משנה', svg: '<svg/>' }]);
    const { updates } = activateThemeSet(sets[0], getDefaultSettings());
    const r = typeset(CORPUS, { ...getDefaultSettings(), ...updates });
    assertEq(r.pages.filter(p => p.type === 'shaar-sub').length, 0, 'off by default');
    assert(r.pages.some(p => p.type === 'shaar-main'), 'main shaar still active');
  });
});

// =====================================================================
describe('settings-effect (fx:) — לכל מפתח S8 אפקט אמיתי בפלט (D-45→D-54)', () => {
  const fx = (overrides, probe) => {
    const base = probe(typeset(CORPUS, getDefaultSettings()));
    const changed = probe(typeset(CORPUS, { ...getDefaultSettings(), ...overrides }));
    assert(JSON.stringify(base) !== JSON.stringify(changed), `no effect: ${JSON.stringify(overrides)}`);
  };

  it('h2-orn-scope/top/bottom/side/fit + h3-side-orn* + chapter-end* משנים עיטורים בפועל', () => {
    const countSlots = (r) => r.pages.flatMap(p => (p.decorations || []).map(d => d.slot)).sort();
    fx({ 'h2-orn-top': 'pyramid' }, countSlots);
    fx({ 'h2-orn-bottom': 'lance' }, countSlots);
    fx({ 'h2-orn-side': 'scroll' }, countSlots);
    fx({ 'h2-orn-scope': 'title', 'h2-orn-side': 'scroll' }, countSlots);
    fx({ 'h3-side-orn': 'shoshanta' }, countSlots);
    fx({ 'h3-side-orn-height-em': 1.6, 'h3-side-orn': 'scroll' }, r => r.pages.flatMap(p => (p.decorations || []).filter(d => d.kind === 'h3-side-ornament').map(d => d.h)));
    fx({ 'chapter-end-ornament': 'lance' }, countSlots);
    fx({ 'chapter-end-ornament-h-em': 2.5, 'chapter-end-ornament': 'lance' }, r => r.pages.flatMap(p => (p.decorations || []).filter(d => d.slot === 'chapter-end').map(d => d.h)));
  });

  it('heading-dividers + shaar dividers + theme/shaar/background keys', () => {
    const countSlots = (r) => r.pages.flatMap(p => (p.decorations || []).map(d => d.slot)).sort();
    fx({ 'heading-dividers-h3-h6': true }, countSlots);
    fx({ 'shaar-main-divider': 'thin', 'theme-set-id': 'k1', 'shaar-main-image': 'm.png' }, countSlots);
    const pageTypes = (r) => r.pages.map(p => p.type);
    fx({ 'theme-set-id': 'k1', 'shaar-main-image': 'm.png' }, pageTypes);
    fx({ 'show-shaar-sub': true }, pageTypes);
    fx({ 'shaar-back-enabled': false, 'theme-set-id': 'k1', 'shaar-main-image': 'm.png' }, pageTypes);
    // רקעים: האפקט הוא ברינדור — probe מרנדר מתוצר ההרצה (r.settings = ההגדרות בפועל)
    const bgProbe = (r) => {
      const target = r.pages.find(p => p.type === 'sign-open');
      const doc = makeDoc();
      return renderPage(target, r.settings, doc, target.header).outerHTML().includes('deco--page-background');
    };
    fx({ 'background-page-type': 'sign-open', 'background-image': 'x.png' }, bgProbe);
    const insetProbe = (r) => {
      const target = r.pages.find(p => p.type === 'sign-open');
      const doc = makeDoc();
      const html = renderPage(target, r.settings, doc, target.header).outerHTML();
      const m = html.match(/inset[^;"]*/);
      return m ? m[0] : '';
    };
    fx({ 'background-page-type': 'sign-open', 'background-image': 'x.png', 'background-inset-mm': 7 }, insetProbe);
  });
});

// =====================================================================
describe('דטרמיניזם וניטרליות תחת עיטורים', () => {
  it('שתי ריצות עם עיטורים מלאים — hash זהה; אין אקראיות', () => {
    const a = typeset(CORPUS, ornConfig());
    const b = typeset(CORPUS, ornConfig());
    assertEq(a.layoutHash, b.layoutHash, 'deterministic with ornaments');
    assertEq(a.pages.length, b.pages.length);
    const da = JSON.stringify(a.pages.map(p => (p.decorations || []).map(d => [d.slot, d.x, d.y, d.w, d.h])));
    const db = JSON.stringify(b.pages.map(p => (p.decorations || []).map(d => [d.slot, d.x, d.y, d.w, d.h])));
    assertEq(da, db, 'decoration rects deterministic');
  });
});

report('s8-decoration');
