// tests/regress/ornament-neutrality.test.js — ניטרליות העיטורים (T1 / D-47): הפאס הוא overlay בלבד — השוואה מבנית מלאה (סוכן 4)
//
// למה קובץ זה קיים (ממצא ממיפוי בדיקות העיטורים, 2026-11-24 — אבחון בלבד, בלי שינוי בקוד המנוע):
//   • בנתיב ה-legacy (פרופיל IMUD — זה שהאפליקציה החיה מריצה) legacyTypeset מחזיר `geometryNeutralVerified: true` **כקבוע** — לא הוכחה.
//   • בדיקת "ניטרליות T1" ב-s8-decoration.test.js משווה `layoutHash`, ו-hash המורשת (legacyLayoutHashDigest) מכיל רק
//     סוג עמוד/folio ואת מילות כל שורה — **שום מיקום (y), גובה (heightPx) או פס**. עיטורים שיזיזו שורות גוף אנכית או פס כותרת לא יפילו אותה.
//   • בנתיב ה-DP ההוכחה (CP4==CP5, bodyGeometryHash) היא אמיתית, אבל גם היא רק שיבוץ שורות/מילים/טוקנים בטורים — בלי y/heightPx.
//   ⇒ הפרה של האינווריאנט שהקוד עצמו מצהיר עליו ("הפאס לא נוגע בטורים/בפסים — overlay-rects בלבד") לא הייתה מפילה שום בדיקה.
//
// מה נבדק כאן (השוואה מבנית מלאה = כל שדה של כל עמוד, מלבד `page.decorations` — ה-overlay המותר):
//   ב. legacy — **בין-ריצות**: אותו מסמך עם ובלי h2-orn-* ⇒ אפס הבדל מבני מלבד decorations (3 מסמכים × 8 תצורות, כולל מסמך שבו עיטורים נדחים — F-08).
//      בין-ריצות הוא האינווריאנט הנכון כאן: הפאס של ה-legacy לא מזמין גובה (עיטור שאין לו מקום נדחה ונרשם, לא נדחק לזרימת הגוף).
//   ג. DP — **ברמת הפאס, בריצה אמיתית**: ה-planPageOrnaments שה-pipeline מפעיל לא משנה שום שדה שאינו decorations (צילום לפני/אחרי בתוך typeset).
//      בין-ריצות הוא לא אינווריאנט ב-DP *בכוונה* (שיעור F-08: גובה עיטורי h2 מוזמן מראש בבלוק הכותרת — spanning.heightPx / h2OrnPadTop), ולכן לא נבדק שם.
//   ד. בקרות שליליות על עותק מנוע מוטנט (בדיקה בלבד; בלי חיפוש טקסט בקוד המנוע — עטיפה מצורפת בסוף מודול העתק):
//      הפאס מזיז שורות גוף / פס כותרת (legacy) או משנה heightPx (DP) ⇒ ההשוואה חייבת להיכשל — בצורת ההבדל הצפויה בדיוק.
//      (הבדיקה הישנה, השוואת layoutHash, נשארת ירוקה על המוטנטים האלה — ראיה בתיאור ה-PR; לא ננעלת כאן כדי לא לחסום שיפור עתידי של ה-hash.)
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const ROOT = path.resolve(__dirname, '..', '..'); // red-build
const IMUD_RAW = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
const CORPUS_PATH = path.join(ROOT, 'tests', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) execSync(`node ${path.join(ROOT, 'tests', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

// ---------- טעינת מנוע מעץ כלשהו (העץ האמיתי או עותק מוטנט) ----------
function loadEngine(root) {
  const eng = (rel) => require(path.join(root, 'src', 'engine', rel));
  const E = {
    root,
    typeset: eng('core/pipeline').typeset,
    getDefaultSettings: eng('core/settings-registry').getDefaultSettings,
    importImudSettings: eng('core/legacy-settings-map').importImudSettings,
    ornamentPlan: eng('decoration/ornament-plan') // מודול (לא פונקציה): ה-pipeline קורא את planPageOrnaments ממנו בזמן הריצה
  };
  const regKeys = new Set(Object.keys(E.getDefaultSettings()));
  E.legacyBase = () => E.importImudSettings(IMUD_RAW, regKeys, {}).settings;
  return E;
}
const CLEAN = loadEngine(ROOT);

// ---------- הפרדיקט: השוואה מבנית של עמודים, בלי page.decorations ----------
// מסיר את המפתח `decorations` בכל עומק: שורות ה-TOC מחזיקות הפניה לאובייקט העמוד עצמו (toc.rows[].pageRef), כך שאותו overlay מופיע גם שם.
const stripPages = (pages) => JSON.parse(JSON.stringify(pages, (k, v) => (k === 'decorations' ? undefined : v)));
const countDecorations = (pages) => pages.reduce((n, p) => n + (p.decorations || []).length, 0);
const short = (v) => { const s = v === undefined ? 'undefined' : JSON.stringify(v); return s.length > 60 ? s.slice(0, 57) + '…' : s; };

/** "צורות" ההבדל בין שני מערכי עמודים (כבר stripped): נתיב עם אינדקסים מוחלפים ב-# + ספירה + דוגמה ראשונה. ריק ⇔ זהים מבנית. */
function shapeDiff(a, b) {
  const shapes = new Map();
  const note = (p, x, y) => {
    const shape = p.replace(/\.\d+(?=\.|$)/g, '.#');
    const e = shapes.get(shape);
    if (e) e.n++; else shapes.set(shape, { shape, n: 1, example: `${p}: ${short(x)} → ${short(y)}` });
  };
  const walk = (x, y, p) => {
    if (x === y) return;
    const ox = x !== null && typeof x === 'object', oy = y !== null && typeof y === 'object';
    if (!ox || !oy || Array.isArray(x) !== Array.isArray(y)) { note(p, x, y); return; }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}.${k}`);
  };
  walk(a, b, 'pages');
  return [...shapes.values()];
}
const fmt = (shapes) => shapes.map((s) => `${s.shape} ×${s.n} (${s.example})`).join('; ');

// ---------- ריצות: legacy בין-ריצות, DP ברמת הפאס ----------
const ledgerCount = (r, kind) => [...r.ledger.issues.values()].filter((x) => x.kind === kind).length;

/** legacy: אותו מסמך בלי ועם הגדרות h2-orn-* (בסיס = ברירות המחדל של IMUD, כמו באפליקציה). */
function legacyRun(E, doc, extra) {
  const base = E.legacyBase();
  const r0 = E.typeset(doc, base);
  const r1 = E.typeset(doc, { ...base, ...extra });
  return {
    r0, r1,
    planted: r1.ornaments ? r1.ornaments.planted : 0,
    rejected: ledgerCount(r1, 'ornament-rejected'),
    slotted: r1.pages.reduce((n, p) => n + (p.decorations || []).filter((d) => d.slot).length, 0),
    slottedBase: r0.pages.reduce((n, p) => n + (p.decorations || []).filter((d) => d.slot).length, 0),
    shapes: shapeDiff(stripPages(r0.pages), stripPages(r1.pages))
  };
}

/** DP: ריצת typeset אחת, כשה-planPageOrnaments שה-pipeline מפעיל עטוף בצילום לפני/אחרי (הצילום נלקח בתוך הריצה, על העמודים האמיתיים). */
function dpPassRun(E, doc, settings) {
  const mod = E.ornamentPlan;
  const orig = mod.planPageOrnaments;
  const seen = { calls: 0, decoBefore: 0, decoAfter: 0, shapes: [] };
  mod.planPageOrnaments = function (pages) {
    const before = stripPages(pages);
    seen.decoBefore += countDecorations(pages);
    const out = orig.apply(this, arguments);
    seen.calls++;
    seen.decoAfter += countDecorations(pages);
    seen.shapes.push(...shapeDiff(before, stripPages(pages)));
    return out;
  };
  try { seen.r = E.typeset(doc, settings); } finally { mod.planPageOrnaments = orig; }
  return seen;
}

// ---------- מסמכים ותצורות ----------
const PARA = 'פסקה לדוגמה עם כמה מילים כדי למלא שורות גוף בעמוד הבדיקה, ועוד מילים כאן כדי שיהיה גוף של ממש בעמוד. '.repeat(6);
const TITLE_WORDS = 'ברוך אתה השם אלהינו מלך העולם אשר קדשנו במצוותיו וצונו על'.split(' ');
const docWithTitle = (n) => `כותרת 1 - חלק ראשון\nכותרת 2 - ${Array.from({ length: n }, (_, i) => TITLE_WORDS[i % TITLE_WORDS.length]).join(' ')}\n${PARA}\nכותרת 3 - תת סימן\n${PARA}\n`;
const DOC_SMALL = docWithTitle(3);
const DOC_LONG_TITLE = docWithTitle(14); // כותרת רחבה: עיטורי הצד נדחים (title-too-wide) — העיטורים העליון/התחתון נטועים

const ALL3 = { 'h2-orn-top': 'pyramid', 'h2-orn-bottom': 'lance', 'h2-orn-side': 'thin' };
const LEGACY_CONFIGS = {
  top: { 'h2-orn-top': 'pyramid' },
  bottom: { 'h2-orn-bottom': 'lance' },
  side: { 'h2-orn-side': 'thin' },
  all3: ALL3,
  big: { 'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'scroll', 'h2-orn-side': 'shoshanta' },
  scopeSign: { ...ALL3, 'h2-orn-scope': 'sign' },
  scopeTitle: { ...ALL3, 'h2-orn-scope': 'title' },
  noFit: { ...ALL3, 'h2-orn-fit-to-text': false }
};
// תצורות ה-DP (כמו ornConfig ב-s8-decoration: כל העיטורים + כל סוג בנפרד, כדי שכל ענף של הפאס ירוץ)
const dpConfig = (extra) => ({ ...CLEAN.getDefaultSettings(), ...extra });
const DP_FULL = { 'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'pyramid', 'h2-orn-side': 'lance', 'h3-side-orn': 'scroll', 'heading-dividers-h3-h6': true, 'chapter-end-ornament': 'pyramid', 'column-divider-style': 'thin' };
const DP_VARIANTS = {
  full: DP_FULL,
  fullBig: { ...DP_FULL, 'chapter-end-ornament': 'shoshanta', 'h3-side-orn-height-em': 1.5 },
  chapterEndHuge: { ...DP_FULL, 'chapter-end-ornament-h-em': 4, 'chapter-end-ornament-w-em': 12 },
  h2Only: { 'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'pyramid', 'h2-orn-side': 'lance' },
  h3SideOnly: { 'h3-side-orn': 'scroll' },
  headingDividerOnly: { 'heading-dividers-h3-h6': true },
  chapterEndOnly: { 'chapter-end-ornament': 'pyramid' }
};

// =====================================================================
describe('ניטרליות עיטורים · א. הפרדיקט (shapeDiff) — בקרות עצמיות', () => {
  const pageA = () => [{
    index: 0, type: 'regular', decorations: [],
    bands: [{ kind: 'h2-title', y: 300, h: 30 }],
    columns: [[{ words: ['א', 'ב'], y: 391.45, heightPx: 21.44 }, { words: ['ג'], y: 412.89, heightPx: 21.44 }], [{ words: ['ד'], y: 391.45, heightPx: 21.44 }]]
  }];
  const diffOf = (mutate) => { const a = pageA(), b = pageA(); mutate(b); return shapeDiff(stripPages(a), stripPages(b)); };
  const shapesOf = (mutate) => diffOf(mutate).map((s) => s.shape);

  it('זהה ⇒ ריק; הבדל ב-decorations בלבד ⇒ ריק (זה ה-overlay המותר)', () => {
    assertEq(shapesOf(() => {}), [], 'זהה');
    assertEq(shapesOf((b) => { b[0].decorations.push({ x: 1, y: 2, w: 3, h: 4, kind: 'h2-orn-top', slot: 'sign-top' }); }), [], 'decorations בלבד');
  });

  it('מזהה כל סוג הזזה בגוף ובפסים — הצורה המדויקת (y, heightPx, פס, מילה, שורה נוספת/חסרה, עמוד נוסף, סוג עמוד)', () => {
    assertEq(shapesOf((b) => { b[0].columns[0][0].y += 4; }), ['pages.#.columns.#.#.y'], 'y של שורת גוף');
    assertEq(shapesOf((b) => { b[0].columns[1][0].heightPx += 3; }), ['pages.#.columns.#.#.heightPx'], 'heightPx של שורת גוף');
    assertEq(shapesOf((b) => { b[0].bands[0].y += 6; }), ['pages.#.bands.#.y'], 'y של פס כותרת');
    assertEq(shapesOf((b) => { b[0].bands[0].h += 6; }), ['pages.#.bands.#.h'], 'גובה פס כותרת');
    assertEq(shapesOf((b) => { b[0].columns[0][1].words[0] = 'ז'; }), ['pages.#.columns.#.#.words.#'], 'מילה');
    assertEq(shapesOf((b) => { b[0].columns[0].push({ words: ['ה'], y: 434, heightPx: 21.44 }); }), ['pages.#.columns.#.#'], 'שורה נוספת');
    assertEq(shapesOf((b) => { b[0].columns[0].pop(); }), ['pages.#.columns.#.#'], 'שורה חסרה');
    assertEq(shapesOf((b) => { b.push({ index: 1, type: 'regular', columns: [[], []], bands: [] }); }), ['pages.#'], 'עמוד נוסף');
    assertEq(shapesOf((b) => { b[0].type = 'sign-open'; }), ['pages.#.type'], 'סוג עמוד');
  });

  it('מקבץ: הזזת כל שורות הגוף ⇒ צורה אחת עם ספירה ודוגמה שמצביעה על הנתיב המדויק', () => {
    const d = diffOf((b) => { for (const col of b[0].columns) for (const ln of col) ln.y += 4; });
    assertEq(d.length, 1, 'צורה אחת');
    assertEq(d[0].n, 3, 'שלוש שורות');
    assert(/^pages\.0\.columns\.0\.0\.y: 391\.45 → 395\.45$/.test(d[0].example), `דוגמה: ${d[0].example}`);
  });
});

// =====================================================================
describe('ניטרליות עיטורים · ב. legacy (נתיב האפליקציה החיה) — אותו מסמך עם ובלי עיטורים: אפס הבדל מבני מלבד decorations', () => {
  const docs = { 'מסמך קטן': DOC_SMALL, 'קורפוס קנוני': CORPUS, 'כותרת רחבה (עיטורי צד נדחים)': DOC_LONG_TITLE };
  for (const [docName, doc] of Object.entries(docs)) {
    it(`${docName}: 8 תצורות — ניטרלי מבנית, התוכן נשמר, והפאס באמת עבד (נטע או דחה)`, () => {
      for (const [cfgName, cfg] of Object.entries(LEGACY_CONFIGS)) {
        const x = legacyRun(CLEAN, doc, cfg);
        assertEq(fmt(x.shapes), '', `${docName} / ${cfgName}: עיטורים שינו משהו מעבר ל-decorations`);
        assertEq(x.r0.ornaments, null, `${docName} / ${cfgName}: ריצת הבסיס — ornaments=null`);
        assertEq(x.slottedBase, 0, `${docName} / ${cfgName}: ריצת הבסיס — אפס עיטורי slot`);
        assertEq(x.r1.contentPreserved, true, `${docName} / ${cfgName}: contentPreserved`);
        assert(x.planted + x.rejected >= 1, `${docName} / ${cfgName}: הפאס לא עבד בכלל — הבדיקה ריקה (planted=${x.planted}, rejected=${x.rejected})`);
        assertEq(x.slotted, x.planted, `${docName} / ${cfgName}: מספר עיטורי ה-slot חייב להתאים ל-ornaments.planted`);
      }
    });
  }

  it('מסמך הכותרת הרחבה באמת מפעיל דחייה (אחרת הבקרה "דחייה לא דוחפת את הגוף" ריקה): all3 ⇒ 2 נטועים, ≥1 נדחה', () => {
    const x = legacyRun(CLEAN, DOC_LONG_TITLE, ALL3);
    assertEq(x.planted, 2, 'עליון + תחתון נטועים');
    assert(x.rejected >= 1, `עיטורי הצד חייבים להידחות (rejected=${x.rejected})`);
    assertEq(x.shapes.length, 0, 'ובכל זאת הגוף לא זז');
  });

  it('הקורפוס הקנוני: כל 8 עמודי פתיחת-הסימן מקבלים עיטורים בתצורת all3 (32 נטועים) — לא רק "אין שינוי"', () => {
    const x = legacyRun(CLEAN, CORPUS, ALL3);
    assert(x.planted >= 8 * 4, `נטועים: ${x.planted}`);
    assertEq(x.r1.pages.length, x.r0.pages.length, 'מספר העמודים');
  });
});

// =====================================================================
describe('ניטרליות עיטורים · ג. DP — planPageOrnaments שה-pipeline מפעיל לא משנה שום שדה שאינו decorations (צילום לפני/אחרי בריצה אמיתית)', () => {
  const ORIG_PASS = CLEAN.ornamentPlan.planPageOrnaments;
  for (const [name, extra] of Object.entries(DP_VARIANTS)) {
    it(`תצורה ${name}: נקרא בדיוק פעם אחת, נטע ≥1, ואפס הבדל מבני (כולל y/heightPx שה-bodyGeometryHash אינו רואה)`, () => {
      const x = dpPassRun(CLEAN, CORPUS, dpConfig(extra));
      assertEq(x.calls, 1, 'הפאס חייב לרוץ פעם אחת בדיוק דרך ה-pipeline (אחרת העטיפה מחוץ למסלול והבדיקה ריקה)');
      assert(x.decoAfter - x.decoBefore >= 1, `הפאס לא נטע דבר (הבדיקה ריקה): ${x.decoBefore} → ${x.decoAfter}`);
      assertEq(fmt(x.shapes), '', `${name}: הפאס שינה שדה שאינו decorations`);
    });
  }
  it('העטיפה מוסרת אחרי הריצה: ה-planPageOrnaments של המודול חוזר לפונקציה המקורית (בלי זיהום בין בדיקות)', () => {
    dpPassRun(CLEAN, CORPUS, dpConfig(DP_FULL));
    assert(CLEAN.ornamentPlan.planPageOrnaments === ORIG_PASS, 'planPageOrnaments לא שוחזר');
  });
});

// =====================================================================
// ד. בקרות שליליות — עותק מנוע מוטנט. המוטציה מצורפת בסוף מודול ההעתק (העטיפה נראית לכל מי שטוען את המודול אחרי כן).
const MUT_LEGACY_BODY_Y = `
;(function () { // מוטציה (בדיקה בלבד): הפאס "מפנה מקום" לעיטור — מזיז את שורות הגוף 4px מטה
  const orig = module.exports.planLegacyOrnaments;
  module.exports.planLegacyOrnaments = function (pages) {
    const out = orig.apply(this, arguments);
    if (out.planted) for (const pg of pages) if ((pg.decorations || []).some((d) => d.slot)) for (const col of pg.columns) for (const ln of col) ln.y += 4;
    return out;
  };
})();
`;
const MUT_LEGACY_BAND_Y = `
;(function () { // מוטציה (בדיקה בלבד): הפאס מזיז את פס כותרת ה-h2 6px מטה
  const orig = module.exports.planLegacyOrnaments;
  module.exports.planLegacyOrnaments = function (pages) {
    const out = orig.apply(this, arguments);
    if (out.planted) for (const pg of pages) for (const b of pg.bands || []) if (b.kind === 'h2-title') b.y += 6;
    return out;
  };
})();
`;
const MUT_DP_HEIGHT = `
;(function () { // מוטציה (בדיקה בלבד): הפאס "מגלה בדיעבד" גובה — מגדיל heightPx של השורה הראשונה בטור הראשון בעמוד המעוטר הראשון ב-3
  const orig = module.exports.planPageOrnaments;
  module.exports.planPageOrnaments = function (pages) {
    const out = orig.apply(this, arguments);
    for (const pg of pages) {
      const ln = pg.columns && pg.columns[0] && pg.columns[0][0];
      if (ln && (pg.decorations || []).length) { ln.heightPx = (ln.heightPx || 0) + 3; break; }
    }
    return out;
  };
})();
`;
function withMutantEngine(relFile, appendix, fn) {
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orn-neutral-mut-')));
  try {
    fs.cpSync(path.join(ROOT, 'src'), path.join(tmp, 'src'), { recursive: true });
    fs.appendFileSync(path.join(tmp, 'src', 'engine', relFile), appendix);
    fn(loadEngine(tmp));
  } finally {
    for (const k of Object.keys(require.cache)) if (k.startsWith(tmp + path.sep)) delete require.cache[k];
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

describe('ניטרליות עיטורים · ד. בקרות שליליות — מנוע מוטנט שמפר את האינווריאנט ⇒ הבדיקות חייבות להיכשל, בצורת ההבדל הצפויה בדיוק', () => {
  it('legacy: הפאס מזיז שורות גוף 4px מטה ⇒ pages.#.columns.#.#.y (ובעץ הנקי — אפס)', () => {
    assertEq(legacyRun(CLEAN, DOC_SMALL, ALL3).shapes.length, 0, 'בקרת ביניים: העץ הנקי ניטרלי');
    withMutantEngine('decoration/legacy-ornaments.js', MUT_LEGACY_BODY_Y, (M) => {
      const x = legacyRun(M, DOC_SMALL, ALL3);
      assert(x.planted >= 1, 'המוטציה חיה: הפאס נטע');
      assertEq(x.shapes.map((s) => s.shape), ['pages.#.columns.#.#.y'], `צורת ההבדל: ${fmt(x.shapes)}`);
      assert(x.shapes[0].n >= 2, `הזזה של כל שורות העמוד המעוטר (n=${x.shapes[0].n})`);
    });
  });

  it('legacy: הפאס מזיז את פס כותרת ה-h2 6px מטה ⇒ pages.#.bands.#.y', () => {
    withMutantEngine('decoration/legacy-ornaments.js', MUT_LEGACY_BAND_Y, (M) => {
      const x = legacyRun(M, DOC_SMALL, ALL3);
      assert(x.planted >= 1, 'המוטציה חיה: הפאס נטע');
      assertEq(x.shapes.map((s) => s.shape), ['pages.#.bands.#.y'], `צורת ההבדל: ${fmt(x.shapes)}`);
    });
  });

  it('legacy: מוטציה שאינה נוגעת בעמודים (שורות גוף/פסים) — לא מתריעה: ריצה על עץ מוטנט ב-no-op (עטיפה זהה בלי הזזה) נשארת ניטרלית', () => {
    // בקרת שפיות לאזעקות-שווא: אותה עטיפה בדיוק, בלי ההזזה
    withMutantEngine('decoration/legacy-ornaments.js', MUT_LEGACY_BODY_Y.replace('ln.y += 4', 'void 0'), (M) => {
      const x = legacyRun(M, DOC_SMALL, ALL3);
      assert(x.planted >= 1, 'הפאס נטע');
      assertEq(fmt(x.shapes), '', 'עטיפה ללא הזזה — אפס הבדל');
    });
  });

  it('DP: הפאס "מגלה בדיעבד" גובה (heightPx +3) ⇒ pages.#.columns.#.#.heightPx — שינוי ש-bodyGeometryHash אינו רואה', () => {
    const clean = dpPassRun(CLEAN, CORPUS, dpConfig(DP_FULL));
    assertEq(fmt(clean.shapes), '', 'בקרת ביניים: העץ הנקי ניטרלי');
    withMutantEngine('decoration/ornament-plan.js', MUT_DP_HEIGHT, (M) => {
      const x = dpPassRun(M, CORPUS, dpConfig(DP_FULL));
      assertEq(x.calls, 1, 'הפאס רץ פעם אחת');
      assertEq(x.shapes.map((s) => s.shape), ['pages.#.columns.#.#.heightPx'], `צורת ההבדל: ${fmt(x.shapes)}`);
      assertEq(x.shapes[0].n, 1, 'שורה אחת');
    });
  });
});

describe('ניטרליות עיטורים · ה. תשתית הצילום', () => {
  it('הפאס זורק ⇒ הזריקה מתפשטת (לא נבלעת) והעטיפה בכל זאת משוחזרת (finally) — אין זיהום בין בדיקות', () => {
    withMutantEngine('decoration/ornament-plan.js', "\n;(function () { module.exports.planPageOrnaments = function () { throw new Error('boom-pass'); }; })();\n", (M) => {
      const orig = M.ornamentPlan.planPageOrnaments;
      let msg = '';
      try { dpPassRun(M, CORPUS, dpConfig(DP_FULL)); } catch (e) { msg = String(e.message); }
      assert(/boom-pass/.test(msg), `הזריקה חייבת להתפשט: "${msg}"`);
      assert(M.ornamentPlan.planPageOrnaments === orig, 'planPageOrnaments לא שוחזר אחרי ריצה שזרקה');
    });
  });
});

report('ornament-neutrality');
