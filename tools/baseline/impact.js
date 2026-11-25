#!/usr/bin/env node
// tools/baseline/impact.js — השוואת השפעה של תיקון מנוע: עץ base מול עץ candidate על מטריצה קבועה של מסמכים.
//
// למה: הסוויטה, ה-hash הקנוני וה-parity עיוורים לשינויים שנוגעים רק לאזור ההערות (layoutHash אינו כולל אותו) ולשינויי עימוד
// שאינם מפילים בדיקה. כלי זה מריץ **את אותו מסמך** בשני עצים ומדווח: עמודים, layoutHash, כמה עמודים השתנו, הערות
// רפאים/כפילות/אבודות/סדר (האורקל), כיסוי הערות לפי עמוד, ושמירת תוכן. הוא תופס רגרסיות מהסוג שאף בדיקה לא תפסה: תיקון R-04 ראשון
// (הוצאת הערות של פסקה שנדחתה) הוציא גם הערות חוקיות של פסקה שנחתכה — very-long 836→838 עמ', כיסוי 1→46 — והסוויטה נשארה ירוקה.
//
// מדדים לכל (מצב, מסמך), כולם מהאורקל red-build/tests/regress/lib/source-oracle.js:
//   · הערות-שוליים (הערות [ ] בגוף הפסקה): רפאים/כפילות/אבודות/סדר + כיסוי לפי עמוד (classifyNotes, ownerPageCoverage);
//   · הערות-סיום ('הערת סיום -') מול שורות המקור (noteLinesOf/censusNotes): אבודות, כפולות/שגויות, סדר, סמנים. R-05 מופיע כאן
//     כ"סיום-אבודות 52→0". מושוות כמולטי-סט של טקסטים ולכן נבדקות תמיד, בלי תלות בעמוד או בפסקה הבעלים;
//   · הערות-צד ('כותרת 7'): אבודות / בעמוד שגוי / כפולות / טקסט זר. תלויות באינדקס הפסקה הבעלים, ולכן נבדקות **רק כשמודל המקור מיושר
//     לטוקני המנוע** (מספר הטוקנים, בניסיון שני עם metaAnywhere — O-6). מסמך לא מיושר מדווח "לא נבדק" (לעולם לא "תקין"). ושינוי במספר
//     הטוקנים של אותו מקור (base→candidate) הוא רגרסיה כשלעצמו — פענוח המקור השתנה — אחרת שינוי שמשבש את זרם הטוקנים היה מכבה את הבדיקה
//     בדיוק כשהיא נחוצה (גם כשהמודל "מתיישר מחדש" רק כי הספירה החדשה זהה למודל האחר);
//   · שמירת תוכן: contentPreserved, contentStats.missingCount ו-content-loss ב-ledger. (שני האחרונים נקראו עד כה משדות שגויים — כל
//     אחד מהם נשאר 0 תמיד, ורגרסיה בהם לא יכלה להתגלות; תוקן. מכאן ואילך כל מדד מת נתפס ע"י בקרה שלילית ב-impact-tool.test.js.)
//
// שימוש:
//   node tools/baseline/impact.js --base <שורש-ריפו-בסיס> --cand <שורש-ריפו-מועמד>
//        [--modes approx,real,real+stretch] [--docs canonical,no_long,mid_long,long,long_no_paren,very_long,generator]
//        [--expect-neutral no_long,canonical]   כשל (קוד 4) אם אחד המסמכים האלה שונה בכלל (עמודים/hash/חתימת עמוד)
//        [--details]   מדפיס אילו רפאים/הערות חסרות נוספו או נעלמו (לפי טקסט, לא לפי מספר עמוד)
//        [--json out.json] [--keep]
//   ברירת מחדל: approx על כל המסמכים; real ו-real+stretch על no_long ו-generator (מסמכי ה-parity והבדיקה הקבוע).
//   בריפו אחד: git worktree add --detach <dir> <base-ref>; להחיל את התיקון ב-<dir2>; node tools/baseline/impact.js --base <dir> --cand <dir2>.
//
// קוד יציאה: 0 — אין רגרסיה באורקל; 3 — רגרסיה (אבודה/כפילות/סדר/כיסוי הערות עלו, הערות-סיום או הערות-צד אבודות/כפולות/שגויות עלו, מספר
//            הטוקנים של אותו מקור השתנה, שמירת התוכן או content-loss ב-ledger נפגעו, או רפאים כשה-base נקי מהם);
//            4 — מסמך שהוגדר --expect-neutral השתנה; 2 — שגיאת הרצה. הכלי אינו קובע אם שינוי עימוד רצוי — זו החלטת הבעלים.
//
// מצבים (הגדרות כמו ב-tools/layout-parity/run-ours.js — הנתיב החי; אם הוא משתנה יש לעדכן כאן):
//   approx        legacyTypeset ללא גופנים (כמו בדיקות ה-regress)
//   real          typeset עם גופנים אמיתיים, measure-impl=font-metrics, body-font='Guttman Rashi'
//   real+stretch  כמו real + RED_ENABLE_STRETCH_RECLAIM=1, RED_RECLAIM_COMPRESS_MAX=20 (צינור ה-parity)
// המסמכים והאורקל נלקחים תמיד מהעץ שבו הכלי יושב (אותו קלט ואותה מדידה לשני העצים); רק המנוע נטען מכל עץ.
// אפס תלויות. כל (עץ, מצב, מסמך) רץ בתהליך נפרד כדי שמטמון המודולים לא יתערבב.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ORACLE = path.join(ROOT, 'red-build', 'tests', 'regress', 'lib', 'source-oracle.js');
const GENERATOR = path.join(ROOT, 'red-build', 'src', 'ui', 'test-doc-generator.js');

const DOC_FILES = {
  canonical: 'red-build/tests/fixtures/canonical_corpus.txt',
  no_long: 'audits/no_long_test_text.txt',
  mid_long: 'audits/mid_long_test_text.txt',
  long: 'audits/long_test_text.txt',
  long_no_paren: 'audits/long_test_text_no_parentheses.txt',
  very_long: 'audits/very_long_test_text.txt', // D-100 (#33) עשוי להסיר אותו — אז מדלגים
  generator: null, // generateTestDocument({ mode: 'fixed', scale: 'full' })
};
const ALL_DOCS = Object.keys(DOC_FILES);
const REAL_DOCS = ['no_long', 'generator'];
const MODES = ['approx', 'real', 'real+stretch'];

// ───────────────────────── עובד: מריץ מסמך אחד בעץ אחד ─────────────────────────
function loadDocText(name) {
  if (name === 'generator') {
    const { generateTestDocument } = require(GENERATOR);
    const g = generateTestDocument({ mode: 'fixed', scale: 'full' });
    return typeof g === 'string' ? g : g.text;
  }
  const f = path.join(ROOT, DOC_FILES[name]);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
}

function workerRun(tree, mode, docName, outFile) {
  const RB = path.join(tree, 'red-build');
  if (mode === 'real+stretch') { process.env.RED_ENABLE_STRETCH_RECLAIM = '1'; process.env.RED_RECLAIM_COMPRESS_MAX = '20'; }
  const text = loadDocText(docName);
  if (text == null) { fs.writeFileSync(outFile, JSON.stringify({ skipped: 'המסמך אינו קיים בעץ הכלי' })); return; }
  const O = require(ORACLE);
  const { legacyTypeset } = require(path.join(RB, 'src/engine/layout/legacy-imud-flow'));
  const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
  const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
  const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
  const def = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const known = new Set(getSettingDefs().map((r) => r.id));
  let run, used; // used = ההגדרות האפקטיביות (קידומת הערת-הסיום של המנוע היא הגדרה: en-line-prefix)
  if (mode === 'approx') {
    const st = importImudSettings(def, known, {}).settings;
    used = st;
    run = (t) => legacyTypeset(t, st, {});
  } else {
    const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
    const FD = path.join(RB, 'ui/assets/imud/fonts') + path.sep;
    const FONTS = [['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'], ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'],
      ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['David Libre', 'DavidLibre-Regular.ttf'],
      ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'], ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf']];
    for (const [fam, f] of FONTS) if (fs.existsSync(FD + f)) registerFont(fam, fs.readFileSync(FD + f));
    const rd = (f) => (fs.existsSync(FD + f) ? fs.readFileSync(FD + f) : null);
    const families = new Set();
    for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
      const p = path.join(RB, 'ui/assets/imud', cat);
      if (!fs.existsSync(p)) continue;
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const x of (Array.isArray(j) ? j : j.fonts || [])) { const n = x && (x.family || x.name); if (n) families.add(n); }
    }
    const imp = importImudSettings(def, known, { availableFonts: families }).settings;
    const settings = { ...getDefaultSettings(), ...imp, 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
    used = settings;
    const opts = { noRecommendations: true, marginFontBytes: rd('Hadassah-Friedlaender-Regular.ttf'), windowFontBytes: rd('FrankReal-Bold.ttf'), prefaceFontBytes: rd('FrankRuhlLibre-VF.ttf') };
    run = (t) => typeset(t, settings, opts);
  }
  const t0 = Date.now();
  const r = run(text);
  const out = measureResult(O, r, text, String((used && used['en-line-prefix']) || 'הערת סיום -'));
  out.ms = Date.now() - t0;
  fs.writeFileSync(outFile, JSON.stringify(out));
}

/**
 * כל המדדים של תוצאת מנוע אחת. פונקציה טהורה בהינתן התוצאה (ה-worker רק מריץ את המנוע ומעביר לכאן) — לכן ניתנת לבדיקה בתוך התהליך על
 * תוצאה מושחתת (tests/regress/lib/impact-mutations.js), בלי להריץ תהליך ובלי עץ מוטנט.
 * @param {object} O מודול האורקל, @param {object} r תוצאת המנוע, @param {string} text טקסט המקור, @param {string} endPrefix en-line-prefix האפקטיבי
 */
function measureResult(O, r, text, endPrefix) {
  const sig = r.pages.map((p) => crypto.createHash('sha1').update(JSON.stringify(p)).digest('hex').slice(0, 12));
  const census = O.censusOutput(r);
  const owners = O.ownersFromTokens(r);
  const c = O.classifyNotes(census, owners);
  const cov = O.ownerPageCoverage(census, owners);
  return {
    pages: r.pages.length,
    layoutHash: String(r.layoutHash),
    sig,
    notes: { ghost: c.ghost.length, dup: c.dup.length, lost: c.lost.length, order: c.orderViolation ? 1 : 0, emissions: c.emissions, legal: c.legal, repeats: c.repeats },
    coverage: { pairs: cov.pairs, missing: cov.missing.length },
    detail: {
      ghost: c.ghost.slice(0, 40).map((g) => ({ page: g.page + 1, words: g.text.split(' ').length, head: g.text.split(' ').slice(0, 4).join(' '), ownerPages: g.ownerPages.slice(0, 3).map((x) => x + 1) })),
      missing: cov.missing.slice(0, 60).map((m) => ({ tokenId: m.tokenId, page: m.page + 1, words: m.words })),
    },
    content: contentMetrics(r),
    srcNotes: srcNotesMetrics(O, text, r, endPrefix),
  };
}

/**
 * שמירת תוכן לפי חשבונאות המנוע. שדות אלה נקראו בעבר משמות שגויים (contentStats.missing ו-Array.isArray על ledger.issues שהוא Map) ולכן
 * נשארו 0 תמיד; כעת: missingWords = contentStats.missingCount, ledgerIssues = מספר ה-issues מסוג content-loss (כהגדרת האורקל LEDGER_LOSS —
 * issues אחרים, כמו column-imbalance, הם מידע ולא אובדן תוכן). מקבל גם Map (מופע Ledger) וגם מערך (ledger.toJSON()).
 */
function contentMetrics(r) {
  const cs = r.contentStats || {};
  const missingWords = Number.isFinite(cs.missingCount) ? cs.missingCount : Array.isArray(cs.missing) ? cs.missing.length : 0;
  const iss = r.ledger && r.ledger.issues;
  const list = iss instanceof Map ? [...iss.values()] : Array.isArray(iss) ? iss : [];
  return { preserved: r.contentPreserved !== false, missingWords, ledgerIssues: list.filter((x) => x && x.kind === 'content-loss').length };
}

/**
 * מדדי הערות-סיום והערות-צד מול מודל המקור של האורקל (noteLinesOf / censusNotes / compareNoteLines); פונקציה טהורה בהינתן תוצאת מנוע.
 *   end  — נבדקות תמיד (השוואת טקסטים כמולטי-סט; ללא תלות בעמוד או בפסקה הבעלים). source/emitted = שורות; lost = שורות מקור שלא נפלטו
 *          (R-05); extra = שורות בפלט שאינן במקור או שנפלטו יותר פעמים ממה שבמקור; order/marker = דגלים 0/1.
 *   side — תלויות באינדקס הטוקן של הפסקה הבעלים ⇒ נבדקות רק כשהמודל מיושר: tokenCount (+ זנב סינתטי) == מספר הטוקנים של המנוע; קודם המודל
 *          הרגיל ואז metaAnywhere (המנוע צורך שורות מטא-דאטה גם באמצע המסמך — O-6). לא מיושר ⇒ side=null, כלומר "לא נבדק" — לא "תקין".
 * @param {object} O מודול האורקל, @param {string} text טקסט המקור, @param {object} r תוצאת המנוע, @param {string} endPrefix en-line-prefix האפקטיבי
 */
function srcNotesMetrics(O, text, r, endPrefix) {
  const tailOf = (m) => ([...m.ends, ...m.sides].some((x) => x.owner === m.tokenCount) ? 1 : 0);
  const plain = O.noteLinesOf(text, { endPrefix });
  let model = null, modelName = null;
  for (const [name, m] of [['plain', plain], ['meta-anywhere', O.noteLinesOf(text, { endPrefix, metaAnywhere: true })]]) {
    if (m.tokenCount + tailOf(m) === r.tokens.length) { model = m; modelName = name; break; }
  }
  const used = model || plain;
  const cn = O.censusNotes(r);
  const toks = (ws) => String(ws.join(' ')).split(/\s+/).filter(Boolean);
  const srcKeys = used.ends.map((e) => O.normKey(e.words));
  const outKeys = cn.endNotes.map((e) => O.normKey(toks(e.words)));
  const lost = multisetMinus(srcKeys, outKeys, (k) => k);
  const extra = multisetMinus(outKeys, srcKeys, (k) => k);
  const viol = O.compareNoteLines(used, r).filter((v) => /^(ENDNOTE|SIDENOTE)_/.test(v.code));
  const n = (code) => viol.filter((v) => v.code === code).length;
  const head = (k) => ({ head: k.split(' ').slice(0, 4).join(' '), words: k.split(' ').length });
  return {
    aligned: !!model, model: modelName, modelTokens: used.tokenCount + tailOf(used), engineTokens: r.tokens.length,
    end: { source: srcKeys.length, emitted: outKeys.length, lost: lost.length, extra: extra.length, order: n('ENDNOTE_ORDER') ? 1 : 0, marker: n('ENDNOTE_MARKER') ? 1 : 0 },
    side: model ? { source: model.sides.length, LOST: n('SIDENOTE_LOST'), PAGE: n('SIDENOTE_PAGE'), DUP: n('SIDENOTE_DUP'), TEXT: n('SIDENOTE_TEXT') } : null,
    detail: { endLost: lost.slice(0, 200).map(head), endExtra: extra.slice(0, 200).map(head) },
  };
}

// ───────────────────────── השוואה (פונקציה טהורה; נבדקת ב-tests/regress/impact-tool.test.js) ─────────────────────────
/**
 * חומרה: **רגרסיה** (קוד יציאה 3) = שמירת תוכן, אבודות, כפילות, סדר, כיסוי-הערות-לפי-עמוד או ledger שהחמירו.
 * ריפאים: ברגע ש-R-04 פתוח כל הזזת עימוד יכולה להזיז מופע של רפאים (נוסף/נעלם) בלי קשר לתיקון הנבדק, לכן עלייה בספירת רפאים
 * היא **רגרסיה** רק כש-ghostHard (ה-base נקי מרפאים בכל המטריצה); אחרת — **תנודה** (warn) שיש להסביר (--details מראה אילו).
 * @param a תוצאת עובד של ה-base, @param b תוצאת עובד של ה-candidate, @param opts {ghostHard:boolean}
 * @returns {{pagesA,pagesB,hashSame,changed,first,neutral,regress:string[],warn:string[],a,b}}
 */
function compare(a, b, opts = {}) {
  const n = Math.max(a.sig.length, b.sig.length);
  let changed = 0, first = 0;
  for (let i = 0; i < n; i++) if (a.sig[i] !== b.sig[i]) { changed++; if (!first) first = i + 1; }
  const hashSame = a.layoutHash === b.layoutHash;
  const regress = [], warn = [];
  for (const k of ['lost', 'dup', 'order']) if (b.notes[k] > a.notes[k]) regress.push(`${k} ${a.notes[k]}→${b.notes[k]}`);
  if (b.notes.ghost > a.notes.ghost) (opts.ghostHard ? regress : warn).push(`רפאים ${a.notes.ghost}→${b.notes.ghost}${opts.ghostHard ? '' : ' (R-04 פתוח — תנודה בעקבות הזזת עימוד?)'}`);
  if (b.coverage.missing > a.coverage.missing) regress.push(`כיסוי-הערות חסר ${a.coverage.missing}→${b.coverage.missing}`);
  if (a.content.preserved && !b.content.preserved) regress.push('contentPreserved true→false');
  if (b.content.missingWords > a.content.missingWords) regress.push(`מילים חסרות ${a.content.missingWords}→${b.content.missingWords}`);
  if (b.content.ledgerIssues > a.content.ledgerIssues) regress.push(`ledger content-loss ${a.content.ledgerIssues}→${b.content.ledgerIssues}`);
  // הערות-סיום והערות-צד מול המקור (srcNotes; חסר באובייקטים ישנים ⇒ אין כלל). כל עלייה בהפרה היא רגרסיה; ירידה (תיקון R-05) אינה מסומנת.
  const sa = a.srcNotes, sb = b.srcNotes;
  if (sa && sb && sa.end && sb.end) {
    for (const [k, he] of END_KINDS) if (sb.end[k] > sa.end[k]) regress.push(`הערות-סיום ${he} ${sa.end[k]}→${sb.end[k]}`);
    // אותו מקור ⇒ אותו מספר טוקנים, אלא אם פענוח המקור השתנה. כולל מקרה שבו המודל "מתיישר מחדש" רק כי הספירה החדשה זהה למודל האחר
    // (plain↔metaAnywhere) — בדיוק כך מוטציית טוקן-עודף חמקה מגרסה ראשונה של הכלל, שבדק רק "אבד יישור".
    if (sa.engineTokens !== sb.engineTokens) regress.push(`מספר הטוקנים השתנה ${sa.engineTokens}→${sb.engineTokens} (פענוח המקור השתנה${sa.aligned && !sb.aligned ? ' — מודל המקור כבר אינו מיושר, הערות-צד לא ניתנות לבדיקה' : ''})`);
    if (sa.side && sb.side) for (const [k, he] of SIDE_KINDS) if (sb.side[k] > sa.side[k]) regress.push(`הערות-צד ${he} ${sa.side[k]}→${sb.side[k]}`);
  }
  return { pagesA: a.pages, pagesB: b.pages, hashSame, changed, first, neutral: a.pages === b.pages && hashSame && changed === 0, regress, warn, a, b };
}
const END_KINDS = [['lost', 'אבודות'], ['extra', 'כפולות/שגויות'], ['order', 'בסדר שונה'], ['marker', 'עם סמנים כפולים/חסרים']];
const SIDE_KINDS = [['LOST', 'אבודות'], ['PAGE', 'בעמוד שגוי'], ['DUP', 'כפולות'], ['TEXT', 'עם טקסט זר']];
const sideTotal = (s) => SIDE_KINDS.reduce((n, [k]) => n + s[k], 0);

/** הפרש מרובה-קבוצות לפי מפתח (לפרטי --details): מה יש ב-xs ואין ב-ys */
function multisetMinus(xs, ys, key) {
  const m = new Map();
  for (const y of ys) m.set(key(y), (m.get(key(y)) || 0) + 1);
  const out = [];
  for (const x of xs) { const k = key(x); const c = m.get(k) || 0; if (c > 0) m.set(k, c - 1); else out.push(x); }
  return out;
}

function formatRow(label, cmp) {
  const { a, b } = cmp;
  const arrow = (x, y) => (x === y ? String(x) : `${x}→${y}`);
  const sn = a.srcNotes && b.srcNotes && a.srcNotes.end && b.srcNotes.end
    ? `סיום-אבודות ${arrow(a.srcNotes.end.lost, b.srcNotes.end.lost)} · צד-הפרות ${a.srcNotes.side && b.srcNotes.side ? arrow(sideTotal(a.srcNotes.side), sideTotal(b.srcNotes.side)) : 'לא נבדק'}`
    : '';
  return [
    label.padEnd(24),
    `עמ' ${arrow(cmp.pagesA, cmp.pagesB)}`.padEnd(14),
    (cmp.hashSame ? 'hash זהה' : 'hash שונה').padEnd(10),
    (cmp.changed ? `${cmp.changed} עמ' שונו (מ-${cmp.first})` : 'ללא שינוי').padEnd(24),
    `רפאים ${arrow(a.notes.ghost, b.notes.ghost)} · כפל ${arrow(a.notes.dup, b.notes.dup)} · אבודות ${arrow(a.notes.lost, b.notes.lost)}`.padEnd(46),
    `כיסוי-חסר ${arrow(a.coverage.missing, b.coverage.missing)}`.padEnd(18),
    ...(sn ? [sn] : []),
    cmp.regress.length ? `⚠ רגרסיה: ${cmp.regress.join(', ')}` : '',
    cmp.warn.length ? `~ ${cmp.warn.join(', ')}` : '',
  ].join(' ').trimEnd();
}

// ───────────────────────── מנהל: מפעיל עובדים ומדפיס ─────────────────────────
function parseArgs(argv) {
  const o = { modes: null, docs: null, neutral: [], json: null, keep: false, details: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--base') o.base = path.resolve(argv[++i]);
    else if (k === '--cand') o.cand = path.resolve(argv[++i]);
    else if (k === '--modes') o.modes = argv[++i].split(',').filter(Boolean);
    else if (k === '--docs') o.docs = argv[++i].split(',').filter(Boolean);
    else if (k === '--expect-neutral') o.neutral = argv[++i].split(',').filter(Boolean);
    else if (k === '--json') o.json = argv[++i];
    else if (k === '--keep') o.keep = true;
    else if (k === '--details') o.details = true;
    else throw new Error(`פרמטר לא מוכר: ${k}`);
  }
  return o;
}

function runWorker(tree, mode, doc, outFile) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [__filename, '--worker', tree, mode, doc, outFile], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`עובד נכשל (${tree} · ${mode} · ${doc}): ${err.trim().split('\n').slice(-3).join(' | ')}`))));
  });
}

async function pool(tasks, limit) {
  let next = 0;
  const run = async () => { while (next < tasks.length) { const t = tasks[next++]; await t(); } };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.base || !o.cand) throw new Error('חובה: --base <שורש-ריפו> --cand <שורש-ריפו>');
  for (const t of [o.base, o.cand]) if (!fs.existsSync(path.join(t, 'red-build', 'src', 'engine'))) throw new Error(`אין red-build/src/engine תחת ${t}`);
  const modes = o.modes || MODES;
  for (const m of modes) if (!MODES.includes(m)) throw new Error(`מצב לא מוכר: ${m}`);
  for (const d of [...(o.docs || []), ...o.neutral]) if (!ALL_DOCS.includes(d)) throw new Error(`מסמך לא מוכר: ${d}`);
  const plan = [];
  for (const m of modes) {
    const docs = (o.docs || (m === 'approx' ? ALL_DOCS : REAL_DOCS));
    for (const d of docs) if (d === 'generator' || fs.existsSync(path.join(ROOT, DOC_FILES[d]))) plan.push({ mode: m, doc: d });
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'impact-'));
  const file = (side, p) => path.join(tmp, `${side}-${p.mode}-${p.doc}.json`.replace(/\+/g, '_'));
  const tasks = [];
  for (const p of plan) for (const [side, tree] of [['base', o.base], ['cand', o.cand]]) tasks.push(() => runWorker(tree, p.mode, p.doc, file(side, p)));
  await pool(tasks, Math.max(1, Math.min(2, os.cpus().length)));

  const rows = [];
  let regressions = 0, notNeutral = [];
  console.log(`base: ${o.base}\ncand: ${o.cand}\n`);
  const pairs = plan.map((p) => ({ p, a: JSON.parse(fs.readFileSync(file('base', p), 'utf8')), b: JSON.parse(fs.readFileSync(file('cand', p), 'utf8')) }));
  // ה-base נקי מרפאים בכל המטריצה ⇒ כל רפאה במועמד היא רגרסיה; אחרת (R-04 פתוח) — תנודה
  const ghostHard = pairs.every(({ a }) => a.skipped || a.notes.ghost === 0);
  for (const { p, a, b } of pairs) {
    if (a.skipped || b.skipped) { console.log(`${(p.mode + ' · ' + p.doc).padEnd(24)} דולג: ${a.skipped || b.skipped}`); continue; }
    const cmp = compare(a, b, { ghostHard });
    if (cmp.regress.length) regressions++;
    if (o.neutral.includes(p.doc) && !cmp.neutral) notNeutral.push(`${p.mode} · ${p.doc}`);
    rows.push({ mode: p.mode, doc: p.doc, pagesA: cmp.pagesA, pagesB: cmp.pagesB, hashSame: cmp.hashSame, changed: cmp.changed, first: cmp.first, notesA: a.notes, notesB: b.notes, coverageA: a.coverage, coverageB: b.coverage, contentA: a.content, contentB: b.content, srcNotesA: a.srcNotes, srcNotesB: b.srcNotes, regress: cmp.regress, warn: cmp.warn });
    console.log(formatRow(`${p.mode} · ${p.doc}`, cmp));
    const na = a.srcNotes, nb = b.srcNotes;
    const srcDiff = !!(na && nb) && (JSON.stringify(na.end) !== JSON.stringify(nb.end) || JSON.stringify(na.side) !== JSON.stringify(nb.side) || na.aligned !== nb.aligned || na.engineTokens !== nb.engineTokens);
    if (o.details && (cmp.regress.length || cmp.warn.length || a.notes.ghost !== b.notes.ghost || a.coverage.missing !== b.coverage.missing || srcDiff)) {
      const gk = (g) => `${g.head}|${g.words}`, mk = (m) => `${m.tokenId}|${m.words}`;
      for (const g of multisetMinus(b.detail.ghost, a.detail.ghost, gk)) console.log(`    + רפאה חדשה בקנדידט: עמ' ${g.page} "${g.head}…" (${g.words} מילים; עמודי הפסקה: ${g.ownerPages.join(',') || '—'})`);
      for (const g of multisetMinus(a.detail.ghost, b.detail.ghost, gk)) console.log(`    − רפאה שנעלמה: עמ' ${g.page} "${g.head}…" (${g.words} מילים)`);
      for (const m of multisetMinus(b.detail.missing, a.detail.missing, mk).slice(0, 8)) console.log(`    + הערה חסרה בעמוד הפסקה (קנדידט): טוקן ${m.tokenId} עמ' ${m.page} (${m.words} מילים)`);
      if (na && nb) {
        const ek = (e) => `${e.head}|${e.words}`;
        const show = (xs, fmt) => { for (const x of xs.slice(0, 8)) console.log(fmt(x)); if (xs.length > 8) console.log(`      … ועוד ${xs.length - 8}`); };
        show(multisetMinus(nb.detail.endLost, na.detail.endLost, ek), (e) => `    + הערת-סיום אבודה בקנדידט: "${e.head}…" (${e.words} מילים)`);
        show(multisetMinus(na.detail.endLost, nb.detail.endLost, ek), (e) => `    − הערת-סיום שחזרה (אבודה ב-base): "${e.head}…" (${e.words} מילים)`);
        show(multisetMinus(nb.detail.endExtra, na.detail.endExtra, ek), (e) => `    + הערת-סיום כפולה/שגויה בקנדידט: "${e.head}…" (${e.words} מילים)`);
        show(multisetMinus(na.detail.endExtra, nb.detail.endExtra, ek), (e) => `    − הערת-סיום כפולה/שגויה שנעלמה: "${e.head}…" (${e.words} מילים)`);
        if (na.engineTokens !== nb.engineTokens || na.aligned !== nb.aligned) console.log(`    טוקנים: ${na.engineTokens}→${nb.engineTokens} · מודל-מקור ${na.model || 'לא מיושר'}→${nb.model || 'לא מיושר'} (טוקני מודל ${na.modelTokens}→${nb.modelTokens})`);
        if (na.side && nb.side) { for (const [k, he] of SIDE_KINDS) if (na.side[k] !== nb.side[k]) console.log(`    הערות-צד ${he}: ${na.side[k]}→${nb.side[k]}`); }
      }
    }
  }
  console.log(`\nסיכום: ${rows.length} מדידות · רגרסיות באורקל: ${regressions}${notNeutral.length ? ` · לא-ניטרלי (הוגדר --expect-neutral): ${notNeutral.join(', ')}` : ''}`);
  console.log('הערה: "עמ\' שונו" = חתימת עמוד שלמה (כולל עמודים שזזו בעקבות שינוי קודם, מפת תוכן); layoutHash אינו כולל את אזור ההערות.');
  // "לא נבדק" חייב להיות גלוי: מסמך שמודל המקור שלו אינו מיושר לטוקני המנוע (ב-base) לא נבדק להערות-צד — זה אינו "תקין"
  const unaligned = [...new Set(pairs.filter(({ a, b }) => !a.skipped && !b.skipped && a.srcNotes && !a.srcNotes.aligned).map(({ p }) => p.doc))];
  if (unaligned.length) console.log(`הערה: הערות-צד לא נבדקו ב-${unaligned.join(', ')} (מודל המקור אינו מיושר לטוקני המנוע); הערות-הסיום נבדקו בכל המסמכים.`);
  if (o.json) fs.writeFileSync(o.json, JSON.stringify({ base: o.base, cand: o.cand, rows }, null, 2));
  if (!o.keep) fs.rmSync(tmp, { recursive: true, force: true });
  else console.log(`תוצרי ביניים: ${tmp}`);
  process.exitCode = regressions ? 3 : notNeutral.length ? 4 : 0;
}

if (require.main === module) {
  if (process.argv[2] === '--worker') {
    try { workerRun(process.argv[3], process.argv[4], process.argv[5], process.argv[6]); } catch (e) { console.error(e && e.stack || e); process.exit(1); }
  } else {
    main().catch((e) => { console.error(`impact: ${e.message}`); process.exit(2); });
  }
} else {
  module.exports = { compare, formatRow, parseArgs, multisetMinus, measureResult, contentMetrics, srcNotesMetrics, DOC_FILES, MODES };
}
