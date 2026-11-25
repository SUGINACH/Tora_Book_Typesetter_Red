// tests/regress/lib/adjacency.js — מטריצת סמיכות מקור→פלט (סוכן 4)
//
// המטרה: למצוא אובדן/כפילות/סדר שגוי של תוכן מקור שנוצרים *מסמיכות* של מבני מקור — המנגנון שהסתיר את R-05 (שתי שורות
// 'הערת סיום -' רצופות: השנייה דורסת את הראשונה בטוקניזציה, ו-contentPreserved נשאר true כי המנוע משווה פלט לטוקנים ולא למקור).
// במקום לנחש משפחות ידנית, מייצרים כל סדרה של n אטומי-מקור סמוכים (n=2 בבדיקה הקבועה; n=3 בסריקה המלאה) בכל היסט אנכי שנבחר,
// מריצים את המנוע, ומשווים לאורקל הבלתי-תלוי (source-oracle.js: גוף, הערות-סיום, הערות-צד, גיאומטריה).
//
// כללי התכנון:
//  · רק קלט *תקין*: מסמך שהשער של D-100 (שרשרת כותרות לא עולה / שרשרת בלי פסקה) דוחה אינו מוצג למנוע — typeset() דוחה אותו בכוונה.
//    השער נקרא מהמנוע עצמו (document-structure.js), כך שההגדרה של "תקין" היא של המוצר ולא ניחוש של הבדיקה. מסמכים שנדחו נספרים ומדווחים.
//  · אטומים הם רק מבנים שמודל המקור של האורקל מכיר. מבנים מחוץ למודל (O-1..O-8 ב-tests/fixtures/regress/README.md) אינם אטומים כאן.
//  · כל הפרה חייבת להיות מוסברת: שייכת לאחת ממחלקות הבאגים/החריגים המתועדות (R-05, O-8) ובקודים המותרים שלה בלבד. הפרה שאינה
//    מוסברת — או מסמך שמודל ההערות אינו מיושר בו לטוקני המנוע — היא כשל קשה. אין "מחלקה" שמוחקת הפרות: קודים מחוץ לרשימת המחלקה נכשלים.
//  · מילים ייחודיות גלובלית (docBuilder): כל החלפה/כפילות/אובדן נראים.
'use strict';

const fs = require('fs');
const path = require('path');
const O = require('./source-oracle');
const { V } = O;

const CH = 'כותרת 2 - פרק א\n';
const DEFAULT_END_PREFIX = 'הערת סיום -';

/**
 * אטומי המקור. כל אטום הוא שורה אחת (חוץ מ-B: שורה ריקה). g.w(n) = n מילים ייחודיות.
 * H1..H6 = כותרות רמה 1..6; S = 'כותרת 7' (הערת-צד לפסקה הבאה); E = 'הערת סיום -'; G = שורה שפותחת ב-'[' (המשך פסקה מודבק).
 */
const ATOMS = {
  P: { what: 'פסקה רגילה (30 מילים)', build: (g) => g.w(30) + '\n' },
  p: { what: 'פסקה קצרה (2 מילים)', build: (g) => g.w(2) + '\n' },
  L: { what: 'פסקה ארוכה (220 מילים; חוצה שורות ועמודים)', build: (g) => g.w(220) + '\n' },
  N: { what: 'פסקה עם הערת שוליים [..] באמצע', build: (g) => g.w(10) + ` [${g.w(4)}] ` + g.w(10) + '\n' },
  Ne: { what: 'פסקה שמסתיימת בהערת שוליים', build: (g) => g.w(20) + ` [${g.w(4)}]\n` },
  G: { what: "שורה שפותחת ב-'[' (נדבקת לשורה הקודמת; אחרי כותרת — פסקה עצמאית)", build: (g) => `[${g.w(3)}] ` + g.w(5) + '\n' },
  Q: { what: 'פסקה עם טווח סוגריים ( )', build: (g) => g.w(5) + ` (${g.w(4)}) ` + g.w(5) + '\n' },
  Qn: { what: 'פסקה עם הערה בתוך טווח סוגריים (R-03)', build: (g) => g.w(5) + ` (${g.w(2)} [${g.w(3)}] ${g.w(2)}) ` + g.w(5) + '\n' },
  H1: { what: 'כותרת 1', build: (g) => `כותרת 1 - ${g.w(2)}\n` },
  H2: { what: 'כותרת 2', build: (g) => `כותרת 2 - ${g.w(2)}\n` },
  H3: { what: 'כותרת 3', build: (g) => `כותרת 3 - ${g.w(2)}\n` },
  H4: { what: 'כותרת 4', build: (g) => `כותרת 4 - ${g.w(2)}\n` },
  H5: { what: 'כותרת 5', build: (g) => `כותרת 5 - ${g.w(2)}\n` },
  H6: { what: 'כותרת 6', build: (g) => `כותרת 6 - ${g.w(2)}\n` },
  S: { what: "'כותרת 7' — הערת-צד לפסקה הבאה", build: (g) => `כותרת 7 - ${g.w(4)}\n` },
  E: { what: "'הערת סיום -' (12 מילים)", build: (g) => `הערת סיום - ${g.w(12)}\n` },
  B: { what: 'שורה ריקה', build: () => '\n' },
};
const ALL_ATOMS = Object.keys(ATOMS);

/** מסמך: כותרת פרק + פסקת מילוי של K מילים (היסט אנכי) + האטומים + (tail) שתי פסקאות המשך. בלי tail המסמך נגמר באטומים. */
function buildDoc(seq, K, tail) {
  const g = O.docBuilder();
  const body = CH + g.w(K) + '\n' + seq.map((a) => {
    if (!ATOMS[a]) throw new Error(`adjacency: אטום לא מוכר ${a}`);
    return ATOMS[a].build(g);
  }).join('') + (tail ? g.w(40) + '\n' + g.w(30) + '\n' : '');
  return g.doc(body);
}

/** כל הסדרות באורך n מתוך atoms, בסדר דטרמיניסטי. */
function tuples(atoms, n) {
  let out = [[]];
  for (let i = 0; i < n; i++) { const next = []; for (const t of out) for (const a of atoms) next.push(t.concat([a])); out = next; }
  return out;
}

// ───────────────────────── מנוע לעץ נתון ─────────────────────────
const FONTS = [['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'], ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'],
  ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['David Libre', 'DavidLibre-Regular.ttf'],
  ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'], ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf']];

// מתגי ה-stretch של המנוע (RED_ENABLE_STRETCH_RECLAIM, RED_RECLAIM_COMPRESS_MAX) הם *קבועי-מודול* של legacy-imud-flow.js: נקראים פעם אחת, בטעינה הראשונה של המודול —
// ו-pipeline.js טוען אותו עצלנית (בתוך typeset()). לכן קביעת משתנה סביבה סביב קריאה אינה מספיקה: אם המודול כבר נטען בתהליך (למשל ע"י מנוע approx), המתג נשאר כבוי בשקט
// והמצב "real+stretch" שווה ל-real בלי שאיש יֵדע (כך היה בגרסה הראשונה של ספרייה זו). לכן כל מנוע מחזיק *מופעי מודולים פרטיים* (עותק טרי של src/** תחת סביבה מפורשת)
// ונכנס אליהם בכל הרצה (גם טעינות עצלניות נופלות על המופעים שלו); מנוע שאינו stretch נטען במפורש *בלי* המתגים — גם אם סביבת התהליך קובעת אותם.
// כך מצב = (עץ, סביבה מפורשת), בלי תלות בסדר יצירת המנועים, במה שכבר נטען, או בסביבת התהליך; ומנועים אינם מזהמים זה את זה ואת מטמון ה-require.
const STRETCH_ENV = { RED_ENABLE_STRETCH_RECLAIM: '1', RED_RECLAIM_COMPRESS_MAX: '20' };
const NO_STRETCH_ENV = { RED_ENABLE_STRETCH_RECLAIM: undefined, RED_RECLAIM_COMPRESS_MAX: undefined };

function privateModules(srcDir, env) {
  let own = new Map(); // מופעי המודולים של המנוע (נוספים בטעינה עצלנית)
  const swap = (incoming) => { // מוציא את כל מודולי src/** ממטמון ה-require (ומחזיר אותם) ומכניס במקומם את incoming
    const out = new Map();
    for (const k of Object.keys(require.cache)) if (k.startsWith(srcDir)) { out.set(k, require.cache[k]); delete require.cache[k]; }
    for (const [k, m] of incoming) require.cache[k] = m;
    return out;
  };
  const enter = (fn) => {
    const keep = {};
    for (const [k, v] of Object.entries(env)) { keep[k] = process.env[k]; if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    const shared = swap(own);
    try { return fn(); } finally {
      own = swap(shared); // מופעי המנוע יוצאים (כולל אלה שנטענו עכשיו), והמטמון המשותף חוזר כפי שהיה
      for (const [k, v] of Object.entries(keep)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    }
  };
  return { enter };
}

/**
 * @param {string} root תיקיית red-build של העץ הנבדק (המנוע נטען משם; האורקל — מהעץ שבו נמצא קובץ זה)
 * @param {'approx'|'real'|'real+stretch'} mode כמו impact.js: approx = legacyTypeset בלי גופנים; real = typeset() עם גופנים אמיתיים; +stretch = צינור ה-parity
 *   (RED_ENABLE_STRETCH_RECLAIM=1, RED_RECLAIM_COMPRESS_MAX=20 — נטענים למופעי מודולים פרטיים; ראו privateModules)
 * @returns {{run:(doc:string)=>object, settings:object, gate:(doc:string)=>string[], mode:string}}
 */
function makeEngine(root, mode = 'approx') {
  if (!['approx', 'real', 'real+stretch'].includes(mode)) throw new Error(`adjacency: מצב לא מוכר ${mode} (approx | real | real+stretch)`);
  const mods = privateModules(path.join(root, 'src') + path.sep, mode === 'real+stretch' ? STRETCH_ENV : NO_STRETCH_ENV);
  const req = (p) => require(path.join(root, p));
  const def = JSON.parse(fs.readFileSync(path.join(root, 'ui/assets/imud/default_settings.json'), 'utf8'));
  let settings; let run; let gate;
  mods.enter(() => {
    const { importImudSettings } = req('src/engine/core/legacy-settings-map');
    const { getSettingDefs, getDefaultSettings } = req('src/engine/core/settings-registry');
    const known = new Set(getSettingDefs().map((r) => r.id));
    if (mode === 'approx') {
      const { legacyTypeset } = req('src/engine/layout/legacy-imud-flow');
      settings = importImudSettings(def, known, {}).settings;
      run = (doc) => mods.enter(() => legacyTypeset(doc, settings, {}));
    } else {
      const { typeset } = req('src/engine/core/pipeline');
      const { registerFont } = req('src/engine/typography/measure-api');
      const FD = path.join(root, 'ui/assets/imud/fonts') + path.sep;
      for (const [fam, f] of FONTS) if (fs.existsSync(FD + f)) registerFont(fam, fs.readFileSync(FD + f));
      const rd = (f) => (fs.existsSync(FD + f) ? fs.readFileSync(FD + f) : null);
      const families = new Set();
      for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
        const p = path.join(root, 'ui/assets/imud', cat);
        if (!fs.existsSync(p)) continue;
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        for (const x of (Array.isArray(j) ? j : j.fonts || [])) { const n = x && (x.family || x.name); if (n) families.add(n); }
      }
      const imp = importImudSettings(def, known, { availableFonts: families }).settings;
      settings = { ...getDefaultSettings(), ...imp, 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
      const opts = { noRecommendations: true, marginFontBytes: rd('Hadassah-Friedlaender-Regular.ttf'), windowFontBytes: rd('FrankReal-Bold.ttf'), prefaceFontBytes: rd('FrankRuhlLibre-VF.ttf') };
      run = (doc) => mods.enter(() => typeset(doc, settings, opts));
    }

    // שער D-100 — אותו שער ש-typeset() מריץ לפני שני מסלולי העימוד (pipeline.js); מודולי המנתח אינם טוענים דבר עצלנית ואינם תלויים במתגי ה-stretch
    const { lexDocument } = req('src/engine/parser/dfa-lexer');
    const { tokenize } = req('src/engine/parser/block-tokenizer');
    const { validateHeadingStructure } = req('src/engine/parser/document-structure');
    const popts = { endnotePrefix: settings['en-line-prefix'], fnOpen: settings['fn-delim-open'], fnClose: settings['fn-delim-close'] };
    gate = (doc) => validateHeadingStructure(tokenize(lexDocument(doc, popts).bodyLines, popts), popts).issues.map((x) => x.code);
  });
  return { run, settings, gate, mode };
}

// ───────────────────────── בדיקת מסמך אחד מול האורקל ─────────────────────────
/**
 * @param {string} doc מקור
 * @param {object} r תוצאת המנוע
 * @param {object} settings הגדרות אפקטיביות (גיאומטריה; en-line-prefix)
 * @returns {{violations:Array<{code:string,detail:string}>, aligned:boolean, model:object}}
 *   violations: גוף (compareToSource על שורות הטוקנים של מודל ההערות — בלי שורות הערת-סיום/צד שאינן פסקאות), גיאומטריה, הערות-סיום והערות-צד.
 *   מודל ההערות חייב להתיישר לטוקני המנוע (model.tokenCount + זנב סינתטי === r.tokens.length); אי-יישור הוא הפרה בפני עצמה (ALIGNMENT):
 *   כל האטומים כאן בתוך המודל, ולכן מסמך שהמודל והמנוע מפענחים אחרת הוא ממצא (או פער במודל) — לא משהו להשתיק.
 */
function checkDoc(doc, r, settings) {
  const endPrefix = String((settings && settings['en-line-prefix']) || DEFAULT_END_PREFIX);
  const model = O.noteLinesOf(doc, { endPrefix });
  const tail = [...model.ends, ...model.sides].some((x) => x.owner === model.tokenCount) ? 1 : 0;
  const aligned = model.tokenCount + tail === r.tokens.length;
  // פריטי הגוף שורה-שורה (בלי הדבקה חוזרת: הדבקת '[' כבר נעשתה במודל); הזנב הסינתטי של המנוע נחתך מהתצוגה
  const items = model.tokenLines.map((l) => O.parseSource(O.META + '\n' + l)[0]);
  const view = Object.assign({}, r, { tokens: r.tokens.slice(0, items.length) });
  const violations = O.compareToSource(items, view).concat(O.geometryViolations(r, settings));
  if (aligned) violations.push(...O.compareNoteLines(model, r));
  else violations.push({ code: 'ALIGNMENT', detail: `מודל המקור ${model.tokenCount + tail} טוקנים מול ${r.tokens.length} במנוע` });
  return { violations, aligned, model };
}

// ───────────────────────── מחלקות הסבר (באגים/חריגים מתועדים) ─────────────────────────
/**
 * מחלקה = תכונה *מבנית של המקור* (לא של הפלט) + הקודים היחידים שמותר לה להפיק. הפרה מחוץ לקודים אלה אינה מוסברת.
 *  R-05: שתי הערות-סיום ומעלה שממתינות לאותה פסקה בעלים (רצופות, או מופרדות בשורה ריקה/כותרת/הערת-צד/שורת '[' שנדבקה אליהן) —
 *        pendingEndNote יחיד בטוקניזציה דורס; ENDNOTE_LOST בלבד. הכשל תלוי בסטטוס התיקון (FIXED ב-source-families.test.js); כאן נבדק רק ההיקף.
 *  O-8:  שורת '[' מיד אחרי שורת הערת-סיום: נדבקת לשורת ההערה בלי רווח ('מילה[הערה'), והערה שמכילה [ ] גורמת למנוע לדווח
 *        contentPreserved=false + ledger content-loss בעוד כל הטקסט נפלט (האורקל מאשר) — ספירת המקור לא מקלפת תוחמים מהערת-סיום, הפלט כן.
 */
const CLASSES = {
  'R-05': { codes: [V.ENDNOTE_LOST], what: 'הערות-סיום ממתינות מרובות לאותה פסקה' },
  'O-8': { codes: [V.CONTENT_PRESERVED, V.LEDGER_LOSS], what: "שורת '[' מיד אחרי הערת-סיום (תוחמי הערה בתוך הערת-סיום)" },
};

/** אילו מחלקות הסבר חלות על המקור (לפי מודל המקור בלבד). */
function classify(doc, { endPrefix = DEFAULT_END_PREFIX } = {}) {
  const model = O.noteLinesOf(doc, { endPrefix });
  const cls = [];
  if (model.ends.some((e, i) => model.ends.some((f, j) => j !== i && f.owner === e.owner))) cls.push('R-05');
  const esc = endPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = String(doc).replace(/##[\s\S]*?##/g, '');
  if (new RegExp(`(?:^|\\n)[ \\t]*${esc}[^\\n]*\\n(?:[ \\t]*\\n)*[ \\t]*\\[`).test(stripped)) cls.push('O-8');
  return cls;
}

/** קודי הפרה מותרים למסמך עם המחלקות הנתונות (איחוד קודי המחלקות). */
const allowedCodes = (cls) => new Set(cls.flatMap((c) => CLASSES[c].codes));

// ───────────────────────── סריקה ─────────────────────────
/**
 * @param {{run:Function, settings:object, gate:Function}} engine תוצאת makeEngine (או מנוע בדיקה שמחיל מוטציה — בקרות שליליות)
 * @param {{atoms?:string[], arity?:number, extra?:string[][], offsets?:number[], tails?:boolean[]}} cfg
 *   extra = סדרות נוספות (מעבר לכל הסדרות באורך arity; arity=0 — רק extra); tails = true: אחרי הסדרה באות שתי פסקאות; false: המסמך נגמר בסדרה
 * @returns {{docs:number, skipped:{count:number,byCode:object}, classes:object, offenders:Array, unexplained:Array}}
 *   partial = מזהי מחלקות במצב ביניים (0 < violating < docs); classes[id] = {docs, violating} על מסמכים שבמחלקה *אחת בלבד*; violating = מהם שמראים לפחות אחד מקודי המחלקה עצמה; mixed = מסמכים בכמה מחלקות; offenders = סדרות עם הפרה כלשהי (מצטבר על כל ההיסטים) ; unexplained = מתוכן אלה שיש בהן הפרה
 *   שאינה מוסברת במחלקות (או ALIGNMENT) — הכשל הקשה.
 */
function scan(engine, cfg = {}) {
  const { atoms = ALL_ATOMS, arity = 2, extra = [], offsets = [10, 310, 910], tails = [true, false] } = cfg;
  const seqs = (arity > 0 ? tuples(atoms, arity) : []).concat(extra);
  const out = { docs: 0, skipped: { count: 0, byCode: {} }, classes: {}, mixed: 0, offenders: [], unexplained: [] };
  for (const id of Object.keys(CLASSES)) out.classes[id] = { docs: 0, violating: 0 };
  const bySeq = new Map();
  const endPrefix = String((engine.settings && engine.settings['en-line-prefix']) || DEFAULT_END_PREFIX);
  for (const seq of seqs) for (const K of offsets) for (const tail of tails) {
    const doc = buildDoc(seq, K, tail);
    const gi = engine.gate(doc);
    if (gi.length) { out.skipped.count++; out.skipped.byCode[gi[0]] = (out.skipped.byCode[gi[0]] || 0) + 1; continue; }
    out.docs++;
    const { violations } = checkDoc(doc, engine.run(doc), engine.settings);
    const cls = classify(doc, { endPrefix });
    // סטטיסטיקת מחלקה רק על מסמכים *טהורים* (מחלקה אחת) ועל קודי המחלקה עצמה: במסמך משותף (R-05+O-8) הצירוף משנה את הקודים — למשל ההערה
    // שנדרסה (R-05) אינה מגיעה לספירת המקור של המנוע, ולכן התראת-השווא של O-8 אינה מופיעה. מסמכים משותפים נבדקים רק מול איחוד הקודים המותרים.
    if (cls.length === 1) { const c = cls[0]; out.classes[c].docs++; if (violations.some((x) => CLASSES[c].codes.includes(x.code))) out.classes[c].violating++; } else if (cls.length > 1) out.mixed++;
    if (!violations.length) continue;
    const ok = allowedCodes(cls);
    const key = seq.join('→');
    const rec = bySeq.get(key) || { seq: key, docs: 0, cls, codes: new Set(), bad: new Set(), sample: { K, tail, code: violations[0].code, detail: String(violations[0].detail).slice(0, 160) } };
    rec.docs++;
    for (const x of violations) { rec.codes.add(x.code); if (!ok.has(x.code)) rec.bad.add(x.code); }
    bySeq.set(key, rec);
  }
  for (const rec of bySeq.values()) {
    const r = { seq: rec.seq, docs: rec.docs, cls: rec.cls, codes: [...rec.codes], bad: [...rec.bad], sample: rec.sample };
    out.offenders.push(r);
    if (r.bad.length) out.unexplained.push(r);
  }
  // מחלקת הסבר היא הכול-או-כלום: כולן מראות את הבאג (פתוח) או אף אחת (תוקן). מצב ביניים = תיקון שאינו שלם (או באג חדש שמפעיל רק חלק)
  out.partial = Object.entries(out.classes).filter(([, c]) => c.violating > 0 && c.violating < c.docs).map(([id]) => id);
  return out;
}

module.exports = { ATOMS, ALL_ATOMS, CH, CLASSES, buildDoc, tuples, makeEngine, checkDoc, classify, allowedCodes, scan };
