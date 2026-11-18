/**
 * tests/regress/source-families.test.js — משפחות מקור "עוינות" מול אורקל מקור→פלט עצמאי
 * (סוכן 4 — תשתית בדיקות; סעיף 5 בתוכנית ההפעלה: fixtures קטנים + בדיקה ממוקדת + בקרה שלילית לכל משפחה)
 *
 * למה: contentPreserved הוא מולטיסט של מילים חסרות בלבד — הוא לא רואה כפילות, החלפת סדר, הערה שמוצגת
 * בעמוד שגוי או דגל סוגריים שגוי. tests/regress/lib/source-oracle.js מנתח את טקסט המקור בעצמו ומשווה לפלט
 * לפי פסקה / כותרת / הערה / סוגריים / גיאומטריה (ראו הקובץ). כאן הוא מורץ על:
 *   א. בקרות שליליות לאורקל עצמו — מודלים מעוותים מפלט אמיתי; חייב לזהות כל סוג הפרה ולא לסמן שווא;
 *   ב. משפחות תקינות — הערות צמודות (×3, ×12), סמן אחרי/לפני פיסוק, הערה בתחילת/בסוף פסקה, שורת-הערה
 *      נדבקת, הערות זהות, סוגריים עם הערה בתוכן, שרשרת כותרות, רצועת h3 — כולן נקיות;
 *   ג. סריקות מיקום (sweeps) — אותו מבנה מקור מוזז צעד-צעד לאורך העמוד כדי להגיע לכל מצב שבירה:
 *      מיקום הערה בתוך פסקה, היסט אנכי מול תחתית עמוד, הערות ארוכות, סוגריים (גם חוצי-שורה), עמודים דלילים,
 *      איזון, רצועת h3 — נקיות;
 *   ד. S4.9 — פסקה עם הערה שנחצית בין עמודים: ההערה חוזרת בכל עמוד של הפסקה (התנהגות המקור, לא באג). נבדק
 *      שהאורקל אינו מסמן זאת ושההתנהגות עצמה נשמרת. [בגרסה קודמת של הקובץ נרשמה כאן "R-02 — הערה נפלטת
 *      פעמיים" כבאג; בוטל לפי הקוד וה-PDF ההיסטורי — ראו README ב-tests/fixtures/regress]
 *   ה. באגים ידועים, כל אחד עם fixture טריגר + fixture בקרה + סריקה של המשפחה כולה (strict xfail):
 *        R-01  אובדן/כפילות כותרות inline (משפחה של 11 מיקומים; ה-fixture המקורי ב-heading-rollback.test.js)
 *        R-03  דגלי סוגריים נשברים כשמילה בתוך/בסוף ( ) נושאת סמן הערה
 *        R-04  "הערת רפאים": הערה נפלטת בעמוד שאין בו אף שורה של הפסקה הנושאת אותה — פסקה שנדחית שלמה לעמוד
 *              הבא אחרי רצועת h3 משאירה את הערותיה בתור של העמוד שהיא לא הגיעה אליו
 *        R-05  שורות 'הערת סיום -' רצופות: נשארת רק האחרונה, השאר אובדות בשקט בטוקניזציה (pendingEndNote נדרס);
 *              contentPreserved של המנוע נשאר true. נמצא במסמך הבדיקה הקבוע: 52 מתוך 69 שורות אובדות (אחרי D-100; לפניו 40 מתוך 52)
 *   ו. מפקד הערות-צד (כותרת 7) והערות-סיום (O.noteLinesOf / censusNotes / compareNoteLines): בדיקות טהורות למודל,
 *      בקרות שליליות, משפחות תקינות וסריקות, קורפוסים אמיתיים (no_long, mid_long, canonical), ו-R-05 (למעלה)
 *
 * מחזור חיים (strict xfail): כל עוד המזהה אינו ב-FIXED, בדיקות השחזור נדרשות *להיכשל* (ומדפיסות
 * "KNOWN-BUG R-0N") כך ש-main נשאר ירוק בלי להסתיר את הבאג; ברגע שהן עוברות הן נכשלות בהוראה מפורשת
 * להוסיף את המזהה ל-FIXED (או להריץ RED_FIX_LANDED=R-04 / =1 לאימות) — ואז הן בדיקות רגילות. הסריקות
 * מוסיפות הגנה: סוגי ההפרות בכל סריקה חייבים להיות חלק מהקבוצה המותרת לאותו באג — הפרה מסוג אחר היא כשל
 * מיידי (רגרסיה חדשה), גם בזמן שהבאג הידוע פתוח.
 *
 * מחוץ למודל (במכוון; ראו README ב-tests/fixtures/regress): הערות מקוננות, '[' ללא סוגר, '[]' ריק, הערה בתוך שורת
 * כותרת — מסמכי הבדיקה נמנעים מהם. (כותרת 7 והערות-סיום נבדקות בנפרד — בלוק ו.) ב-README מפורטות
 * ההתנהגויות (O-1..O-7) שמחכות לסיווג בעלים/סוכן 2 — הן מתועדות, לא נבדקות.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');
const O = require('./lib/source-oracle');
const { V, docBuilder } = O;

const REPO = path.resolve(__dirname, '..', '..');
const FIXTURES = path.join(__dirname, '..', 'fixtures', 'regress');
const AUDITS = path.join(REPO, '..', 'audits');

// ── מתגי מחזור-חיים: מוסיפים מזהה ב-PR שמנחית את התיקון המתאים (ראו הערת הפתיחה) ──
const FIXED = new Set(['R-01', 'R-04']); // 'R-01' | 'R-03' | 'R-04' | 'R-05' — R-01 תוקן ב-#43 (rollback כותרות inline בסוף טור)
const ENV_FIXED = String(process.env.RED_FIX_LANDED || '');
const isFixed = (id) => FIXED.has(id) || ENV_FIXED === '1' || ENV_FIXED.split(',').includes(id);

// ── עזרים ──
const legacyDefaults = JSON.parse(fs.readFileSync(path.join(REPO, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
let _settings = null;
function settings() {
  if (!_settings) _settings = importImudSettings(legacyDefaults, new Set(getSettingDefs().map((r) => r.id)), {}).settings;
  return _settings;
}
const run = (text) => legacyTypeset(text, settings(), {});
const readFixture = (name) => fs.readFileSync(path.join(FIXTURES, name), 'utf8');

/** מריץ את המנוע על מסמך ומחזיר הפרות האורקל (ובאופן אופציונלי גם גיאומטריה). */
function check(doc, { geo = false } = {}) {
  const r = run(doc);
  let v = O.compareToSource(O.parseSource(doc), r);
  if (geo) v = v.concat(O.geometryViolations(r, settings()));
  return { r, v };
}
const codesOf = (v) => [...new Set(v.map((x) => x.code))];
const fmtV = (v, n = 4) => v.slice(0, n).map((x) => `${x.code}: ${x.detail}`).join(' · ') + (v.length > n ? ` … (+${v.length - n})` : '');

function assertClean(v, label) { assert(v.length === 0, `${label}: ${v.length} הפרות — ${fmtV(v)}`); }
function assertOnlyCodes(v, allowed, label) {
  const extra = v.filter((x) => !allowed.includes(x.code));
  assert(extra.length === 0, `${label}: הפרות מסוג שאינו מותר (${allowed.join('/')}) — ${fmtV(extra)}`);
}
function assertNoCode(v, code, label) {
  const hit = v.filter((x) => x.code === code);
  assert(hit.length === 0, `${label}: ${hit.length}× ${code} — ${fmtV(hit)}`);
}

/**
 * strict xfail לפי באג: עד שהמזהה ב-FIXED — הבדיקה נדרשת להיכשל *מהסיבה הידועה* (expect = תבנית שחייבת
 * להופיע בהודעת הכשל; כשל מסיבה אחרת — שגיאת בדיקה, קריסה, רגרסיה אחרת — הוא כשל אמיתי ולא "באג ידוע").
 * loose (למסמכים שנוצרים ע"י מחולל): עוברת-בטעות אינה כשל אלא הודעה.
 */
function bugIt(id, name, fn, { loose = false, expect } = {}) {
  if (isFixed(id)) return it(name, fn);
  return it(`[KNOWN-BUG ${id}] ${name}`, () => {
    let err = null;
    try { fn(); } catch (e) { err = e; }
    if (err) {
      if (expect && !expect.test(String(err.message))) {
        throw new Error(`${id}: "${name}" נכשלת מסיבה שאינה הבאג הידוע (צפוי ${expect}): ${String(err.message).slice(0, 300)}`);
      }
      console.log(`   ⚠ KNOWN-BUG ${id} — נכשלת כצפוי: ${name}\n       ↳ ${String(err.message).split('\n')[0].slice(0, 320)}`);
      return;
    }
    if (loose) {
      console.log(`   ✓ ${id} (loose): "${name}" עוברת — המסמך הנוכחי אינו מפעיל את הבאג או שהבאג תוקן; שקול להוסיף ${id} ל-FIXED`);
      return;
    }
    throw new Error(`${id}: "${name}" עוברת — נראה שהבאג תוקן. הוסף '${id}' ל-FIXED ב-tests/regress/source-families.test.js (או RED_FIX_LANDED=${id} לאימות) כדי שהבדיקות יהפכו לרגילות.`);
  });
}

const CH = 'כותרת 2 - פרק א\n';

// ═════════════════════════ א. בקרות שליליות לאורקל ═════════════════════════
describe('אורקל מקור→פלט · בקרות שליליות (חייב לזהות כל סוג הפרה ולא לסמן שווא)', () => {
  // מסמך בסיס עם: שתי הערות בעמודים שונים, טווח סוגריים, שרשרת כותרות, פסקאות. הפלט אמיתי — כך שאם מבנה
  // הפלט של המנוע ישתנה, הבקרות נכשלות בקול (ולא האורקל "עובר" על הכול).
  const g = docBuilder();
  const body = CH + g.w(30) + `[${g.w(4)}] ` + g.w(10) + ` (${g.w(3)}) ` + g.w(10) + '\n'
    + 'כותרת 4 - ' + g.w(2) + '\nכותרת 5 - ' + g.w(2) + '\n' + g.w(40) + '\n'
    + g.w(900) + '\n' // מילוי: דוחף את ההערה הבאה לעמוד אחר
    + g.w(30) + `[${g.w(4)}] ` + g.w(20) + '\n';
  const doc = g.doc(body);
  const base = run(doc);
  const items = O.parseSource(doc);
  const clonePages = () => JSON.parse(JSON.stringify(base.pages));
  const view = (pages, extra = {}) => Object.assign({}, base, { pages }, extra);
  const firstItem = (pages, pred) => { for (const p of pages) for (const col of p.columns || []) for (const it of col) if (pred(it, p)) return { it, col, p }; return null; };
  const notePages = base.pages.map((p, i) => [p, i]).filter(([p]) => (p.footnotes || []).length);

  it('בסיס: הפלט האמיתי נקי מכל הפרה (כולל גיאומטריה)', () => {
    assertClean(O.compareToSource(items, base), 'compare');
    assertClean(O.geometryViolations(base, settings()), 'geometry');
  });
  it('בסיס: ההערות נחתו בשני עמודים שונים (תנאי לבקרות הרפאים/הכפילות/האבדן)', () => {
    assertEq(notePages.length, 2, 'שני עמודים עם הערות');
  });

  it('מילה שנשמטה מפסקה → PARA_WORDS', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.words.length > 4 && !(x.markerIdx || []).length && !x.parenFlags.some(Boolean));
    line.words.splice(2, 1); line.parenFlags && line.parenFlags.splice(2, 1);
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_WORDS), 'לא זוהה');
  });
  it('שתי מילים שהוחלף סדרן → PARA_WORDS', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.words.length > 4 && !(x.markerIdx || []).length);
    [line.words[1], line.words[2]] = [line.words[2], line.words[1]];
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_WORDS), 'לא זוהה');
  });
  it('שורת פסקה שנפלטה פעמיים (אותו lineIdx) → PARA_LINES', () => {
    const pages = clonePages();
    const { it: line, col } = firstItem(pages, (x) => x.kind === 'paragraph' && x.lineIdx === 1);
    col.push(JSON.parse(JSON.stringify(line)));
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_LINES), 'לא זוהה');
  });
  it('פסקה שלמה שנעלמה מהפלט → PARA_LOST', () => {
    const pages = clonePages();
    for (const p of pages) for (const col of p.columns || []) for (let i = col.length - 1; i >= 0; i--) if (col[i].kind === 'paragraph' && col[i].tokenId === 1) col.splice(i, 1);
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PARA_LOST), 'לא זוהה');
  });
  it('בלוק הערות שהוכפל באותו עמוד → NOTE_DUP (ורק הוא)', () => {
    const pages = clonePages();
    const p = pages[notePages[0][1]];
    p.footnotes.push(JSON.parse(JSON.stringify(p.footnotes[0])));
    assertEq(codesOf(O.compareToSource(items, view(pages))).join(','), V.NOTE_DUP, 'צפוי NOTE_DUP בלבד');
  });
  it('בלוק הערות בעמוד שאין בו שורה של הפסקה הנושאת אותו → NOTE_GHOST (ורק הוא)', () => {
    const pages = clonePages();
    pages[notePages[1][1]].footnotes.push(JSON.parse(JSON.stringify(pages[notePages[0][1]].footnotes[0])));
    assertEq(codesOf(O.compareToSource(items, view(pages))).join(','), V.NOTE_GHOST, 'צפוי NOTE_GHOST בלבד');
  });
  it('בלוק הערות שנמחק → NOTE_LOST', () => {
    const pages = clonePages();
    pages[notePages[1][1]].footnotes = [];
    const c = codesOf(O.compareToSource(items, view(pages)));
    assert(c.includes(V.NOTE_LOST), 'לא זוהה: ' + c.join(','));
  });
  it('שתי הערות שהוחלף סדרן באותו עמוד → NOTE_ORDER ורק הוא', () => {
    // מסמך נפרד: שתי פסקאות עם הערה על אותו עמוד — היפוך הבלוקים בתוך העמוד משנה את הסדר בלבד
    const g2 = docBuilder();
    const doc2 = g2.doc(CH + g2.w(20) + `[${g2.w(4)}] ` + g2.w(10) + '\n' + g2.w(20) + `[${g2.w(4)}] ` + g2.w(10) + '\n');
    const r2 = run(doc2);
    const pg = r2.pages.findIndex((p) => (p.footnotes || []).length);
    assert(pg >= 0, 'תנאי הבקרה: יש בלוק הערות');
    const pages = JSON.parse(JSON.stringify(r2.pages));
    // המנוע מזרים את הערות העמוד לבלוק אחד רציף (continuous): יחידות מתחילות במילה עם mk. ההיפוך — בסדר היחידות בתוך הבלוק
    const blk = pages[pg].footnotes[0];
    const units = [];
    for (const w of blk.lines.flatMap((l) => l.words)) { if (w.mk) units.push([w]); else if (units.length) units[units.length - 1].push(w); }
    assertEq(units.length, 2, 'תנאי הבקרה: שתי ההערות באותו עמוד');
    blk.lines = [Object.assign({}, blk.lines[0], { words: units.reverse().flat() })];
    assertEq(codesOf(O.compareToSource(O.parseSource(doc2), Object.assign({}, r2, { pages }))).join(','), V.NOTE_ORDER, 'צפוי NOTE_ORDER בלבד');
  });
  it('חזרת הערה בעמוד ההמשך של פסקה שנחצית (S4.9) אינה מסומנת; אותו בלוק בעמוד שבו אין שורה של הפסקה — NOTE_GHOST', () => {
    const doc3 = readFixture('note-split-paragraph.txt');
    const r3 = run(doc3);
    const items3 = O.parseSource(doc3);
    assertClean(O.compareToSource(items3, r3), 'הפלט האמיתי (פסקה נחצית, הערה בשני העמודים)');
    const withNote = r3.pages.map((p, i) => [p, i]).filter(([p]) => (p.footnotes || []).length);
    assertEq(withNote.length, 2, 'ההערה מופיעה בשני עמודים');
    const pages = JSON.parse(JSON.stringify(r3.pages));
    pages[0].footnotes = [JSON.parse(JSON.stringify(withNote[0][0].footnotes[0]))]; // עמוד הפתיחה — אין בו שורות של הפסקה
    assertEq(codesOf(O.compareToSource(items3, Object.assign({}, r3, { pages }))).join(','), V.NOTE_GHOST, 'צפוי NOTE_GHOST בלבד');
  });
  it('סמן הערה שנמחק מהשורה → MARKER_COUNT', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && (x.markerIdx || []).length);
    line.markerIdx = [];
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.MARKER_COUNT), 'לא זוהה');
  });
  it('דגל סוגריים שהתהפך → PAREN_SCOPE', () => {
    const pages = clonePages();
    const { it: line } = firstItem(pages, (x) => x.kind === 'paragraph' && x.parenFlags && x.parenFlags.some(Boolean));
    const k = line.parenFlags.findIndex(Boolean);
    line.parenFlags[k] = false;
    assert(codesOf(O.compareToSource(items, view(pages))).includes(V.PAREN_SCOPE), 'לא זוהה');
  });
  it('מודל הסוגריים של האורקל (paraParenFlags): דגל ברמת המילה המקורית, כולל קידומת/סיומת סביב הערה (S4.19)', () => {
    const f = (t) => O.paraParenFlags(t);
    assertEq(f('א (ב ג) ד'), [false, true, true, false], 'בלי הערות');
    assertEq(f('א (ב ג)[נ] ד'), [false, true, true, false], 'הערה על מילת הסגירה: הסמן אינו מילת גוף');
    assertEq(f('א (ב ג)[נ]. ד'), [false, true, true, true, false], 'מילה)[הערה]. — הקידומת והסיומת יורשות את דגל המילה המקורית');
    assertEq(f('א (ב ג) [נ] . ד'), [false, true, true, false, false], 'רווח לפני [ נבלע (ההערה נדבקת ל-"ג)"); ה-"." שאחרי הרווח — מילה נפרדת מחוץ לטווח');
    assertEq(f('(א ב[נ] ג) ד'), [true, true, true, false], 'הערה על מילה בתוך הטווח');
    assertEq(f('א ב[(נ] ג'), [false, false, false], 'סוגריים בתוך טקסט ההערה אינם נספרים');
    assertEq(f('א (ב ג'), null, 'סוגריים לא מאוזנים — מחוץ למודל');
  });
  it('כותרת inline שנמחקה → HEADING_LOST; וכותרת שהוכפלה → HEADING_DUP', () => {
    const lost = clonePages();
    const { col, it: h } = firstItem(lost, (x) => x.kind === 'heading');
    col.splice(col.indexOf(h), 1);
    assert(codesOf(O.compareToSource(items, view(lost))).includes(V.HEADING_LOST), 'אובדן לא זוהה');
    const dup = clonePages();
    const f = firstItem(dup, (x) => x.kind === 'heading');
    f.col.push(JSON.parse(JSON.stringify(f.it)));
    assert(codesOf(O.compareToSource(items, view(dup))).includes(V.HEADING_DUP), 'כפילות לא זוהתה');
  });
  it('contentPreserved=false → CONTENT_PRESERVED; רשומת content-loss בספר → LEDGER_LOSS', () => {
    assert(codesOf(O.compareToSource(items, view(clonePages(), { contentPreserved: false }))).includes(V.CONTENT_PRESERVED), 'CONTENT_PRESERVED לא זוהה');
    const ledger = { issues: new Map([['x', { kind: 'content-loss' }]]) };
    assert(codesOf(O.compareToSource(items, view(clonePages(), { ledger }))).includes(V.LEDGER_LOSS), 'LEDGER_LOSS לא זוהה');
  });
  it('מספר טוקנים שונה ממספר פריטי המקור → TOKEN_COUNT', () => {
    const other = O.parseSource(doc + '\n' + g.w(5) + '\n');
    assert(codesOf(O.compareToSource(other, base)).includes(V.TOKEN_COUNT), 'לא זוהה');
  });
  it('גיאומטריה: שורה שהוזזה על קודמתה → GEO_OVERLAP; מילה מחוץ לעמוד → GEO_OUTSIDE', () => {
    const pages = clonePages();
    const col = pages[notePages[0][1]].columns.find((c) => c.length > 3);
    col[2].y = col[1].y; // בדיוק על הקודמת
    assert(codesOf(O.geometryViolations(view(pages), settings())).includes(V.GEO_OVERLAP), 'חפיפה לא זוהתה');
    const far = clonePages();
    const c2 = far[notePages[0][1]].columns.find((c) => c.length > 3);
    c2[1].y = 99999;
    assert(codesOf(O.geometryViolations(view(far), settings())).includes(V.GEO_OUTSIDE), 'חריגה מהעמוד לא זוהתה');
  });
});

// ═════════════════════════ ב. משפחות תקינות ═════════════════════════
describe('משפחות מקור תקינות · אפס הפרות (כולל גיאומטריה)', () => {
  const fam = [
    ['בסיס', (g) => CH + g.w(60) + '\n'],
    ['הערות צמודות ×3', (g) => CH + g.w(12) + `[${g.w(2)}][${g.w(2)}][${g.w(2)}] ` + g.w(10) + '\n'],
    ['הערות צמודות ×12', (g) => CH + g.w(12) + Array.from({ length: 12 }, () => `[${g.w(2)}]`).join('') + ' ' + g.w(10) + '\n'],
    ['סמן אחרי פיסוק (. , : ; ? !)', (g) => CH + `${g.w(1)}.[${g.w(2)}] ${g.w(1)},[${g.w(1)}] ${g.w(1)}:[${g.w(1)}] ${g.w(1)};[${g.w(1)}] ${g.w(1)}?[${g.w(1)}] ${g.w(1)}![${g.w(1)}] ${g.w(20)}\n`],
    ['סמן לפני פיסוק', (g) => CH + `${g.w(1)} [${g.w(2)}]. ${g.w(1)} [${g.w(1)}], ${g.w(1)} [${g.w(1)}]: ${g.w(20)}\n`],
    ['הערה בתחילת פסקה (אחרי כותרת)', (g) => CH + `[${g.w(2)}] ` + g.w(30) + '\n'],
    ['הערה בסוף פסקה', (g) => CH + g.w(30) + ` [${g.w(2)}]\n`],
    ['שורת-הערה נדבקת לפסקה הקודמת', (g) => CH + g.w(30) + '\n' + `[${g.w(3)}]\n` + g.w(20) + '\n'],
    ['שורה שפותחת בהערה אחרי פסקה (הדבקת בלוק)', (g) => CH + g.w(30) + '\n' + `[${g.w(3)}] ` + g.w(20) + '\n' + g.w(10) + '\n'],
    ['אותו טקסט הערה פעמיים', (g) => { const a = g.w(2); return CH + g.w(20) + `[${a}] ` + g.w(20) + `[${a}] ` + g.w(10) + '\n'; }],
    ['סוגריים פשוטים', (g) => CH + g.w(20) + ` (${g.w(2)}) ` + g.w(20) + '\n'],
    ['הערה שמכילה סוגריים', (g) => CH + g.w(20) + `[${g.w(1)} (${g.w(2)}) ${g.w(1)}] ` + g.w(20) + '\n'],
    ['שרשרת כותרות h4–h6 + פרוזה', (g) => CH + g.w(20) + '\nכותרת 4 - ' + g.w(2) + '\nכותרת 5 - ' + g.w(2) + '\nכותרת 6 - ' + g.w(2) + '\n' + g.w(30) + '\n'],
    ['רצועת h3 + הערות משני צדיה', (g) => CH + g.w(20) + `[${g.w(3)}]\nכותרת 3 - ` + g.w(2) + '\n' + g.w(40) + `[${g.w(3)}]\n`],
    ['שני פרקים קצרים', (g) => CH + g.w(15) + '\nכותרת 2 - ' + g.w(1) + '\n' + g.w(15) + `[${g.w(2)}]\n`]
  ];
  for (const [name, build] of fam) {
    it(name, () => {
      const g = docBuilder();
      const { v } = check(g.doc(build(g)), { geo: true });
      assertClean(v, name);
    });
  }
});

// ═════════════════════════ ג. סריקות מיקום (נקיות) ═════════════════════════
describe('סריקות מיקום · אותו מבנה מוזז לאורך העמוד — אפס הפרות', () => {
  /** מריץ את כל הנקודות; מחזיר {runs, bad:[{label,v}]}. geoEvery = כל כמה נקודות לבדוק גם גיאומטריה. */
  function sweep(points, geoEvery = 5) {
    const bad = [];
    let runs = 0;
    for (const { label, doc } of points) {
      const { v } = check(doc, { geo: runs % geoEvery === 0 });
      runs++;
      if (v.length) bad.push({ label, v });
    }
    return { runs, bad };
  }
  const assertSweepClean = ({ runs, bad }, name) =>
    assert(bad.length === 0, `${name}: ${bad.length}/${runs} נקודות נכשלו — ${bad.slice(0, 3).map((b) => `[${b.label}] ${fmtV(b.v, 2)}`).join(' | ')}`);

  it('מיקום הערה בתוך פסקה של 150 מילים (k) × אורך הערה × מילוי קודם', () => {
    const pts = [];
    const ks = [...Array.from({ length: 13 }, (_, i) => i), ...Array.from({ length: 28 }, (_, i) => 15 + i * 5)];
    for (const f of [0, 17, 41]) for (const L of [2, 15, 60]) for (const k of ks) {
      const g = docBuilder();
      const filler = f ? g.w(f) + '\n' : '';
      const ws = Array.from({ length: 150 }, () => g.w(1));
      const note = `[${g.w(L)}]`;
      // k=0 אחרי מילוי = שורה שפותחת בהערה ⇒ נדבקת לפסקה הקודמת (הדבקת בלוק של המקור; משפחה נפרדת למעלה)
      if (k === 0 && f) continue;
      pts.push({ label: `f=${f} L=${L} k=${k}`, doc: g.doc(CH + filler + ws.slice(0, k).join(' ') + note + (k < 150 ? ' ' : '') + ws.slice(k).join(' ') + '\n') });
    }
    assertSweepClean(sweep(pts), 'מיקום הערה');
  });

  it('היסט אנכי מול תחתית עמוד: מילוי K=0..900 לפני פסקה עם הערה (8/40/120 מילים)', () => {
    const pts = [];
    for (const L of [8, 40, 120]) for (let K = 0; K <= 900; K += 6) {
      const g = docBuilder();
      pts.push({ label: `L=${L} K=${K}`, doc: g.doc(CH + (K ? g.w(K) + '\n' : '') + g.w(40) + `[${g.w(L)}] ` + g.w(40) + '\n' + g.w(20) + '\n') });
    }
    assertSweepClean(sweep(pts), 'תחתית עמוד');
  });

  it('הערות ארוכות (1…300 מילים) כשהפסקה פותחת את העמוד — אין אובדן ואין כפילות', () => {
    const pts = [];
    // הפסקה כאן אינה נחצית; פסקה שנחצית (חזרת הערה בעמוד ההמשך — S4.9) נבדקת בנפרד בבלוק S4.9
    for (const L of [1, 5, 20, 50, 100, 200, 300]) {
      const g = docBuilder();
      pts.push({ label: `L=${L}`, doc: g.doc(CH + g.w(20) + `[${g.w(L)}] ` + g.w(10) + '\n' + g.w(10) + '\n') });
    }
    assertSweepClean(sweep(pts, 1), 'הערות ארוכות');
  });

  it('סוגריים בלי הערות: טווח של 1/2/12/40 מילים בכל מיקום (כולל חוצה-שורה) × מילוי', () => {
    const pts = [];
    for (const f of [0, 17]) for (const s of [1, 2, 12, 40]) for (let k = 0; k <= 100; k += 4) {
      const g = docBuilder();
      const ws = Array.from({ length: 100 }, () => g.w(1));
      const close = Math.min(99, k + s - 1);
      const parts = ws.map((w, i) => (i === k ? '(' : '') + w + (i === close ? ')' : ''));
      pts.push({ label: `f=${f} s=${s} k=${k}`, doc: g.doc(CH + (f ? g.w(f) + '\n' : '') + parts.join(' ') + '\n') });
    }
    assertSweepClean(sweep(pts, 8), 'סוגריים');
  });

  it('עמודים דלילים: 1–12 מילים × 1–4 פסקאות; 1–4 פרקים קצרים', () => {
    const pts = [];
    for (let n = 1; n <= 12; n++) for (let paras = 1; paras <= 4; paras++) {
      const g = docBuilder();
      pts.push({ label: `n=${n} paras=${paras}`, doc: g.doc(CH + Array.from({ length: paras }, () => g.w(n)).join('\n') + '\n') });
    }
    for (let chs = 1; chs <= 4; chs++) for (let n = 1; n <= 40; n += 3) {
      const g = docBuilder();
      pts.push({ label: `chs=${chs} n=${n}`, doc: g.doc(Array.from({ length: chs }, () => `כותרת 2 - ${g.w(1)}\n${g.w(n)}\n`).join('')) });
    }
    assertSweepClean(sweep(pts, 1), 'עמודים דלילים');
  });

  it('איזון: פסקה בודדת באורך 1…520 מילים (מילוי חלקי של העמוד האחרון)', () => {
    const pts = [];
    for (let n = 1; n <= 520; n += 5) { const g = docBuilder(); pts.push({ label: `n=${n}`, doc: g.doc(CH + g.w(n) + '\n') }); }
    assertSweepClean(sweep(pts, 7), 'איזון');
  });
});

// ═════════════════════════ ד. R-01 — כותרות inline (משפחה) ═════════════════════════
describe('R-01 · שרשרת כותרות inline בכל היסט אנכי — משפחת הבאג של heading-rollback', () => {
  const CHAINS = {
    h4: ['כותרת 4 - טעם הדין\n'],
    h5: ['כותרת 5 - מקור הדין\n'],
    h6: ['כותרת 6 - חילוקי דינים\n'],
    'h5-h6': ['כותרת 5 - לשון הפוסקים\n', 'כותרת 6 - חילוקי דינים\n'],
    'h4-h6': ['כותרת 4 - טעם הדין\n', 'כותרת 6 - פרטי דינים\n'],
    'h4-h5-h6': ['כותרת 4 - טעם הדין\n', 'כותרת 5 - מקור הדין\n', 'כותרת 6 - פרטי דינים\n'],
    h3: ['כותרת 3 - רצועה חוצה טורים\n'],
    'h3-h4': ['כותרת 3 - רצועה חוצה טורים\n', 'כותרת 4 - טעם הדין\n']
  };
  const family = (() => {
    const all = [];
    for (const [cn, hs] of Object.entries(CHAINS)) for (let K = 0; K <= 400; K += 2) {
      const g = docBuilder();
      const doc = g.doc(CH + (K ? g.w(K) + '\n' : '') + hs.join('') + g.w(40) + '\n' + g.w(30) + '\n');
      all.push({ label: `${cn} K=${K}`, v: check(doc).v });
    }
    return all;
  })();
  const R01_CODES = [V.HEADING_LOST, V.HEADING_DUP, V.CONTENT_PRESERVED, V.LEDGER_LOSS];
  const failing = family.filter((x) => x.v.length);

  it('כל ההפרות במשפחה הן מסוג R-01 בלבד (אובדן/כפילות כותרת, וההד של המנוע עצמו על האובדן)', () => {
    assertOnlyCodes(failing.flatMap((x) => x.v), R01_CODES, 'סריקת כותרות');
  });
  bugIt('R-01', `אין כותרת שאבדה או שהוכפלה באף היסט (${family.length} נקודות; כרגע ${failing.length} נכשלות: ${failing.slice(0, 3).map((x) => x.label).join(', ')}…)`, () => {
    assert(failing.length === 0, `${failing.length}/${family.length} נקודות: ${failing.slice(0, 4).map((x) => `[${x.label}] ${fmtV(x.v, 2)}`).join(' | ')}`);
  }, { expect: /HEADING_(LOST|DUP)/ });
  it('בקרה: שרשרת בודדת h4 / h6 / h3 / h3-h4 נקיות בכל היסט (R-01 דורש שרשרת עם שתי כותרות inline או יותר)', () => {
    const clean = family.filter((x) => /^(h4|h5|h6|h3|h3-h4) K=/.test(x.label));
    assert(clean.length > 0 && clean.every((x) => x.v.length === 0), `נכשלו: ${clean.filter((x) => x.v.length).slice(0, 3).map((x) => x.label).join(', ')}`);
  });
});

// ═════════════════════════ ה. S4.9 — חזרת הערה בעמודי ההמשך של פסקה ═════════════════════════
describe('S4.9 · פסקה עם הערה שנחצית בין עמודים — ההערה חוזרת בכל עמוד של הפסקה (התנהגות המקור) — אפס הפרות', () => {
  // היסטוריה: משפחה זו נרשמה בעבר כבאג "R-02 — הערה נפלטת פעמיים", לפי גרסה של האורקל שדרשה "כל הערה פעם אחת".
  // בוטל: legacy-imud-flow.js (S4.9, "התנהגות המקור הנצפית", שורות ~1278–1280) מתעד שהערות של פסקה מופיעות ומוזרמות
  // לתקציב בכל עמוד שבו לפסקה שורות — גם בהמשכים — וה-PDF ההיסטורי (audits/layout-reference.json) מציג את אותה
  // הערה בת 65 מילים בשני העמודים (12 ו-13), כפי שמפיקה צנרת ה-parity עם גופנים. הבדיקות כאן נועלות את ההתנהגות
  // (הערה חוזרת אינה מסומנת; והיא אכן חוזרת) ואת גבולה — הערה בעמוד שאין בו שורה של הפסקה היא R-04 (בלוק ז).
  /** מסמך: מילוי K מילים, פסקה של P מילים עם הערה של L מילים אחרי מילה k, וזנב. מילים ייחודיות. */
  function build(K, P, k, L = 10) {
    const g = docBuilder();
    const ws = Array.from({ length: P }, () => g.w(1));
    const para = ws.slice(0, k).join(' ') + `[${g.w(L)}] ` + ws.slice(k).join(' ');
    return g.doc(CH + (K ? g.w(K) + '\n' : '') + para + '\n' + g.w(30) + '\n');
  }
  const pagesOfTok = (r, tok) => { // עמודים (1-based) שבהם יש שורות של הפסקה
    const s = new Set();
    r.pages.forEach((p, i) => { for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && it.tokenId === tok) s.add(i + 1); });
    return [...s].sort((a, b) => a - b);
  };
  const notePagesOf = (r) => O.censusOutput(r).units.map((u) => u.page + 1); // עמוד הפתיחה של כל יחידת הערה
  const classify = (doc, r) => O.classifyNotes(O.censusOutput(r), O.ownersFromItems(O.parseSource(doc)));

  // fixtures סטטיים (טקסט עברי): הפסקה נחצית מעמוד 4 ל-5; בקרה — אותה פסקה שפותחת את עמוד 5
  const split = readFixture('note-split-paragraph.txt');
  const control = readFixture('note-split-paragraph-control.txt');

  it('בקרה (fixture): אותה פסקה והערה כשהיא נכנסת בעמוד אחד — אפס הפרות, יחידת הערה אחת', () => {
    const { r, v } = check(control, { geo: true });
    assertClean(v, 'note-split-paragraph-control.txt');
    assertEq(notePagesOf(r).length, 1, 'ההערה נפלטת פעם אחת');
  });
  it('התנהגות המקור (S4.9): הפסקה נפרשת על שני עמודים וההערה מופיעה בשניהם בדיוק — והאורקל אינו מסמן זאת', () => {
    const { r, v } = check(split, { geo: true });
    const pages = pagesOfTok(r, 2);
    assertEq(pages.length, 2, 'הפסקה עם ההערה נפרשת על שני עמודים');
    assertEq(O.parseSource(split).flatMap((x) => x.notes || []).length, 1, 'הערה אחת במקור');
    assertEq(notePagesOf(r), pages, 'ההערה נפלטת בדיוק בעמודי הפסקה (חזרה בעמוד ההמשך)');
    assertEq(classify(split, r).repeats, 1, 'חזרת S4.9 אחת');
    assertClean(v, 'note-split-paragraph.txt');
  });

  // משפחה: פסקה של 200/300 מילים, הערה ב-10%/50%/90% מהפסקה, מילוי 0..900 — הערה יחידה של 10 מילים
  const famPts = [];
  for (const P of [200, 300]) for (const frac of [0.1, 0.5, 0.9]) for (let K = 0; K <= 900; K += 7) famPts.push({ P, frac, K });
  let famRepeats = 0;
  const famBad = [];
  for (const { P, frac, K } of famPts) {
    const doc = build(K, P, Math.round(P * frac));
    const { r, v } = check(doc);
    if (classify(doc, r).repeats > 0) famRepeats++;
    if (v.length) famBad.push({ label: `P=${P} k=${Math.round(P * frac)} K=${K}`, v });
  }
  it(`סריקת המשפחה (${famPts.length} נקודות): אפס הפרות — חזרת ההערה בעמוד ההמשך אינה מסומנת, ואין רפאים/כפילות/אבדן`, () => {
    assert(famBad.length === 0, `${famBad.length}/${famPts.length} נקודות: ${famBad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  });
  it('הסריקה אכן מפעילה את S4.9 (לא ריקה): יש בה נקודות שבהן ההערה חוזרת בעמוד המשך', () => {
    assert(famRepeats >= 10, `נקודות עם חזרת הערה: ${famRepeats} מתוך ${famPts.length}`);
  });
  it('בקרה: סריקה אחרת של אותה מערכת (פסקאות של 120 מילים — לא נחצות עם הערה) נקייה', () => {
    const bad = [];
    for (const frac of [0.1, 0.5, 0.9]) for (let K = 0; K <= 900; K += 11) {
      const v = check(build(K, 120, Math.round(120 * frac))).v;
      if (v.length) bad.push({ label: `k=${Math.round(120 * frac)} K=${K}`, v });
    }
    assert(bad.length === 0, `${bad.length} נקודות: ${bad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  });

  // וריאנט מהקורפוס האמיתי: מינימיזציה (ddmin: 466 → 6 שורות גוף, 69 הרצות) של audits/no_long_test_text.txt —
  // כל שורה היא שורה מילה-במילה מהמקור. פסקה + שורת-הערה (נדבקת אליה) אחרי רצועת h3; הפסקה נחצית בין העמודים
  // והערה בת 65 מילים מופיעה בשניהם (כמו ב-PDF ההיסטורי). בקרה = זוג מינימלי: אותו מסמך בלי שורת "כותרת 3".
  const pSplit = readFixture('note-split-parity.txt');
  const pControl = readFixture('note-split-parity-control.txt');
  const noteParaPages = (r) => { // עמודים (1-based) שבהם יש שורות של הפסקה הנושאת סמן הערה
    let tok = null;
    for (const p of r.pages) for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && (it.markerIdx || []).length && tok === null) tok = it.tokenId;
    return pagesOfTok(r, tok);
  };
  it('זוג מינימלי (קורפוס parity): הבקרה זהה לפיצול פרט לשורת "כותרת 3" היחידה', () => {
    const t = pSplit.split('\n'), c = pControl.split('\n');
    assertEq(t.filter((l) => /^כותרת 3 /.test(l)).length, 1, 'בפיצול שורת כותרת 3 אחת');
    assertEq(t.filter((l) => !/^כותרת 3 /.test(l)).join('\n'), c.join('\n'), 'בקרה = פיצול פחות שורת כותרת 3');
  });
  it('בקרה (fixture מינימלי מהקורפוס): בלי רצועת h3 הפסקה נכנסת בעמוד אחד וההערה פעם אחת — אפס הפרות', () => {
    const { r, v } = check(pControl, { geo: true });
    assertClean(v, 'note-split-parity-control.txt');
    assertEq(noteParaPages(r).length, 1, 'הפסקה עם ההערה בעמוד אחד');
    assertEq(notePagesOf(r).length, 1, 'ההערה פעם אחת');
  });
  it('התנהגות המקור (S4.9, fixture מינימלי מהקורפוס): הפסקה נחצית והערה בת 65 המילים מופיעה בשני עמודיה — אפס הפרות', () => {
    const { r, v } = check(pSplit, { geo: true });
    const pages = noteParaPages(r);
    assertEq(pages.length, 2, 'הפסקה עם ההערה נפרשת על שני עמודים');
    const notes = O.parseSource(pSplit).flatMap((x) => x.notes || []);
    assertEq(notes.length, 1, 'הערה אחת במקור');
    assertEq(notes[0].length, 65, 'אורך ההערה');
    assertEq(notePagesOf(r), pages, 'ההערה נפלטת בדיוק בעמודי הפסקה');
    assertClean(v, 'note-split-parity.txt');
  });

  // קורפוסים אמיתיים — סיווג פליטות ההערות לפי עמודי הפסקה הבעלים (הבעלות מטקסט הטוקנים: הקורפוסים משתמשים בתחביר
  // מחוץ לדקדוק האורקל, ולכן אין בהם compareToSource מלא)
  const noteClasses = (text) => { const r = run(text); return O.classifyNotes(O.censusOutput(r), O.ownersFromTokens(r)); };
  const cleanNotes = (c) => c.ghost.length === 0 && c.dup.length === 0 && c.lost.length === 0 && !c.orderViolation;
  const fmtC = (c) => `רפאים=${c.ghost.length} כפולות=${c.dup.length} אבודות=${c.lost.length} סדר=${c.orderViolation} (פליטות=${c.emissions}, חוקיות=${c.legal}, חזרות S4.9=${c.repeats})`;
  it('קורפוס אמיתי (647 עמודים): long_test_text.txt — כל הערה בעמוד הפסקה שלה: אפס רפאים/כפולות/אבודות', () => {
    const c = noteClasses(fs.readFileSync(path.join(AUDITS, 'long_test_text.txt'), 'utf8'));
    assert(c.legal > 0, 'הקורפוס ריק מהערות?');
    assert(cleanNotes(c), fmtC(c));
  });
  it('קורפוס אמיתי (170 עמודים): mid_long_test_text.txt — נקי, והוא מפעיל חזרת S4.9 (≥1)', () => {
    const c = noteClasses(fs.readFileSync(path.join(AUDITS, 'mid_long_test_text.txt'), 'utf8'));
    assert(cleanNotes(c), fmtC(c));
    assert(c.repeats >= 1, `אין בקורפוס חזרת S4.9 — הבקרה חסרת משמעות (${fmtC(c)})`);
  });
});

// ═════════════════════════ ו. R-03 — דגלי סוגריים והערה ═════════════════════════
describe('R-03 · מילה בתוך/בסוף ( ) שנושאת סמן הערה מפילה את דגלי הסוגריים', () => {
  const trigger = readFixture('paren-note-trigger.txt');
  const control = readFixture('paren-note-control.txt');

  it('בקרה (fixture): אותם טווחי סוגריים כשההערה נושאת מילה שמחוץ לסוגריים — אפס הפרות', () => {
    assertClean(check(control, { geo: true }).v, 'paren-note-control.txt');
  });
  it('אבחון הטריגר: שתי פסקאות עם טווח סוגריים והערה אחת בכל אחת', () => {
    const items = O.parseSource(trigger).filter((x) => x.kind === 'p');
    assertEq(items.length, 2, 'שתי פסקאות');
    assert(items.every((x) => x.notes.length === 1 && /[()]/.test(x.words.join(' '))), 'לכל פסקה סוגריים והערה');
  });
  bugIt('R-03', 'fixture טריגר: דגלי הסוגריים נכונים בשתי הפסקאות (")[הערה" הדליפה את הדגל לשאר הפסקה; הערה בתוך הטווח איפסה אותו)', () => {
    const v = check(trigger).v;
    assertOnlyCodes(v, [V.PAREN_SCOPE], 'paren-note-trigger.txt');
    assertNoCode(v, V.PAREN_SCOPE, 'paren-note-trigger.txt');
  }, { expect: /PAREN_SCOPE/ });
  bugIt('R-03', 'חומרת הבאג (fixture טריגר, פסקה א\'): מספר המילים המסומנות "בתוך סוגריים" שווה למספר המילים שבטווח — כרגע ההדלפה מסמנת את כל שאר הפסקה', () => {
    // ")[הערה" משאיר את מונה העומק פתוח ⇒ כל מילה שאחרי הטווח נמדדת/מרונדרת בגודל הסוגריים המוקטן
    const r = run(trigger);
    const m = O.censusOutput(r).paras.get(1);
    const flags = [...m.keys()].sort((a, b) => a - b).flatMap((k) => m.get(k).parens);
    const src = O.parseSource(trigger).filter((x) => x.kind === 'p')[0];
    const expectedIn = src.pflags.filter(Boolean).length;
    const gotIn = flags.filter((f) => f === true).length;
    assertEq(gotIn, expectedIn, `מילים מסומנות כבתוך סוגריים: בפועל ${gotIn}, בטווח ${expectedIn}`);
  }, { expect: /מילים מסומנות/ });

  // משפחה: טווח של s מילים במיקום k בפסקה של 100 מילים; הערה בתוך הטווח / צמודה ל-')' / צמודה ל-')' עם סיומת '.'
  // אחריה ("מילה)[הערה]." — המנוע מפצל למילה-קידומת, סמן וסיומת, ושלושתן יורשות את דגל המילה המקורית; ללא הערה — בסריקות הנקיות)
  const famPts = [];
  for (const f of [0, 17]) for (const s of [1, 2, 12, 40]) for (let k = 0; k <= 100; k += 4) for (const where of ['inside', 'after-close', 'after-close+suffix']) famPts.push({ f, s, k, where });
  const famV = famPts.map(({ f, s, k, where }) => {
    const g = docBuilder();
    const ws = Array.from({ length: 100 }, () => g.w(1));
    const open = k, close = Math.min(99, k + s - 1), mid = Math.floor((open + close) / 2);
    const parts = ws.map((w, i) => {
      let x = w;
      if (i === open) x = '(' + x;
      if (i === close) { x += ')'; if (where !== 'inside') x += `[${g.w(2)}]`; if (where === 'after-close+suffix') x += '.'; }
      if (where === 'inside' && i === mid) x += `[${g.w(2)}]`;
      return x;
    });
    return { label: `f=${f} s=${s} k=${k} ${where}`, v: check(g.doc(CH + (f ? g.w(f) + '\n' : '') + parts.join(' ') + '\n')).v };
  });
  const famBad = famV.filter((x) => x.v.length);
  it('סריקת המשפחה: כל ההפרות הן PAREN_SCOPE בלבד (התוכן, ההערות והשורות תקינים)', () => {
    assertOnlyCodes(famBad.flatMap((x) => x.v), [V.PAREN_SCOPE], 'סריקת סוגריים+הערה');
  });
  bugIt('R-03', `סריקת המשפחה (${famV.length} נקודות): דגלי הסוגריים נכונים בכל מיקום (כרגע ${famBad.length} נקודות נכשלות)`, () => {
    assert(famBad.length === 0, `${famBad.length}/${famV.length}: ${famBad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  }, { expect: /PAREN_SCOPE/ });
  // ── קורפוסים אמיתיים: מניין פסקאות שדגלי הסוגריים שלהן שגויים מול טקסט המקור של הטוקן ──
  // (נבדק לפי token.text, כלומר בלי תלות בניתוח המקור של האורקל; פסקה עם סוגריים לא מאוזנים — מחוץ למודל)
  const NOTE_SPACE = String.fromCharCode(0xE000); // מציין-מקום של המנוע לרווח בתוך טקסט הערה (legacy-imud-flow.js)
  function parenCensus(text) {
    const r = run(text);
    const out = O.censusOutput(r);
    let total = 0, withSpans = 0, withSpansAndNote = 0, bad = 0;
    r.tokens.forEach((t, i) => {
      if (t.type !== 'p') return;
      total++;
      const sp = O.splitNotes(String(t.text).split(NOTE_SPACE).join(' '));
      const want = O.paraParenFlags(String(t.text).split(NOTE_SPACE).join(' '));
      if (!want) return;
      if (want.some(Boolean)) { withSpans++; if (sp.notes.length) withSpansAndNote++; }
      const m = out.paras.get(i);
      if (!m) return;
      const got = [...m.keys()].sort((a, b) => a - b).flatMap((k) => m.get(k).parens);
      if (got.length === want.length && want.some((f, k) => got[k] !== null && got[k] !== f)) bad++;
    });
    return { total, withSpans, withSpansAndNote, bad };
  }
  it('בקרה (קורפוס parity, no_long_test_text.txt): דגלי הסוגריים נכונים בכל הפסקאות — והקורפוס עדיין מפעיל את המצב (סוגריים + הערה באותה פסקה)', () => {
    const c = parenCensus(fs.readFileSync(path.join(AUDITS, 'no_long_test_text.txt'), 'utf8'));
    assert(c.withSpansAndNote > 0, `הבקרה חסרת משמעות: אין פסקה עם סוגריים והערה (פסקאות עם סוגריים: ${c.withSpans})`);
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpans} פסקאות עם סוגריים (${c.withSpansAndNote} מהן עם הערה)`);
  });
  bugIt('R-03', 'קורפוס ה-long (long_test_text.txt, 647 עמודים): דגלי הסוגריים נכונים בכל הפסקאות — כרגע 2 פסקאות שגויות מתוך 9 עם סוגריים והערה', () => {
    const c = parenCensus(fs.readFileSync(path.join(AUDITS, 'long_test_text.txt'), 'utf8'));
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpansAndNote} פסקאות עם סוגריים והערה (${c.total} פסקאות בקורפוס)`);
  }, { expect: /PAREN_SCOPE/ });
  bugIt('R-03', 'מסמך הבדיקה הקבוע (generateTestDocument fixed/full): דגלי הסוגריים נכונים בכל הפסקאות — כרגע כמחצית מהפסקאות עם סוגריים והערה שגויות (המספר המדויק בהודעת הכשל; תלוי במחולל)', () => {
    const c = parenCensus(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assert(c.bad === 0, `פסקאות עם דגלי סוגריים שגויים (PAREN_SCOPE): ${c.bad} מתוך ${c.withSpansAndNote} פסקאות עם סוגריים והערה (${c.total} פסקאות במסמך)`);
  }, { loose: true, expect: /PAREN_SCOPE/ });
});

// ═════════════════════════ ז. R-04 — "הערת רפאים" ═════════════════════════
describe('R-04 · הערת רפאים — פסקה שנדחית שלמה לעמוד הבא אחרי רצועת h3 משאירה את הערותיה בעמוד שהיא לא הגיעה אליו', () => {
  // המנוע מזרים את הערות הפסקה לתור/לתקציב של העמוד לפני החלטת ה-fit (S4.9); כשאחר כך הפסקה נדחית שלמה, ההערות נשארות
  // בעמוד הקודם — בניגוד להערת S4.24 בקוד ("הפסקה כולה, עם הערותיה, עוברת לעמוד הבא והתור של העמוד הנוכחי נשאר נקי").
  // הממצא מתרחש רק כשלפני הפסקה רצועת h3 (בלוק-אחרי-span); בלעדיה — דחייה נקייה דרך שער התקציב (fn-budget-gate).
  const trigger = readFixture('note-ghost-trigger.txt');
  const control = readFixture('note-ghost-control.txt');
  const noteTokOf = (doc) => O.parseSource(doc).findIndex((x) => x.kind === 'p' && x.notes.length);
  const pagesOfTok = (r, tok) => {
    const s = new Set();
    r.pages.forEach((p, i) => { for (const col of p.columns || []) for (const it of col) if (it.kind === 'paragraph' && it.tokenId === tok) s.add(i + 1); });
    return [...s].sort((a, b) => a - b);
  };
  const notePagesOf = (r) => O.censusOutput(r).units.map((u) => u.page + 1);

  it('זוג מינימלי (קורפוס parity): הבקרה זהה לטריגר פרט לשורת "כותרת 3" היחידה', () => {
    const t = trigger.split('\n'), c = control.split('\n');
    assertEq(t.filter((l) => /^כותרת 3 /.test(l)).length, 1, 'בטריגר שורת כותרת 3 אחת');
    assertEq(t.filter((l) => !/^כותרת 3 /.test(l)).join('\n'), c.join('\n'), 'בקרה = טריגר פחות שורת כותרת 3');
  });
  it('בקרה (fixture): בלי הרצועה הפסקה נדחית לאותו עמוד וההערה מופיעה רק בו — אפס הפרות (כולל גיאומטריה)', () => {
    const { r, v } = check(control, { geo: true });
    assertClean(v, 'note-ghost-control.txt');
    const pages = pagesOfTok(r, noteTokOf(control));
    assertEq(pages.length, 1, 'הפסקה עם ההערה בעמוד אחד');
    assertEq(notePagesOf(r), pages, 'ההערה רק בעמוד הפסקה');
  });
  it('אבחון הטריגר: הפסקה עם ההערה בת 65 המילים יושבת כולה בעמוד אחד (אין חצייה — אחרת זו חזרת S4.9 חוקית)', () => {
    const { r } = check(trigger);
    assertEq(pagesOfTok(r, noteTokOf(trigger)).length, 1, 'הפסקה בעמוד אחד');
    const notes = O.parseSource(trigger).flatMap((x) => x.notes || []);
    assertEq(notes.length, 1, 'הערה אחת במקור');
    assertEq(notes[0].length, 65, 'אורך ההערה');
  });
  it('הטריגר: כל ההפרות הן NOTE_GHOST בלבד (התוכן, השורות, הסדר, הסמנים והגיאומטריה תקינים)', () => {
    const { v } = check(trigger, { geo: true });
    assertOnlyCodes(v, [V.NOTE_GHOST], 'note-ghost-trigger.txt');
  });
  bugIt('R-04', 'fixture טריגר: ההערה מופיעה רק בעמוד שבו יש שורות של הפסקה (כרגע גם בעמוד הקודם, בלי עוגן)', () => {
    assertNoCode(check(trigger).v, V.NOTE_GHOST, 'note-ghost-trigger.txt');
  }, { expect: /NOTE_GHOST/ });

  // משפחה: [רצועת h3] + פסקה של P מילים עם הערה של L מילים אחרי המילה ה-5, מילוי K=0..900 בצעד 6 (604 נקודות).
  // בקרה: אותה סריקה בלי רצועת h3 (חצי מהנקודות).
  const grid = [];
  for (const P of [20, 60]) for (const L of [10, 65]) for (let K = 0; K <= 900; K += 6) grid.push({ P, L, K });
  const buildG = ({ P, L, K }, strip) => {
    const g = docBuilder();
    const ws = Array.from({ length: P }, () => g.w(1));
    const para = ws.slice(0, 5).join(' ') + `[${g.w(L)}] ` + ws.slice(5).join(' ');
    return g.doc(CH + (K ? g.w(K) + '\n' : '') + (strip ? 'כותרת 3 - רצועה\n' : '') + para + '\n' + g.w(30) + '\n');
  };
  const famV = grid.map((pt) => ({ label: `P=${pt.P} L=${pt.L} K=${pt.K}`, v: check(buildG(pt, true)).v }));
  const famBad = famV.filter((x) => x.v.length);
  it('סריקת המשפחה: כל ההפרות הן NOTE_GHOST בלבד', () => {
    assertOnlyCodes(famBad.flatMap((x) => x.v), [V.NOTE_GHOST], 'סריקת רפאים');
  });
  bugIt('R-04', `סריקת המשפחה (${famV.length} נקודות: רצועת h3 + פסקה עם הערה): אין הערת רפאים באף מילוי (כרגע ${famBad.length} נקודות נכשלות)`, () => {
    assert(famBad.length === 0, `${famBad.length}/${famV.length} נקודות: ${famBad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  }, { expect: /NOTE_GHOST/ });
  it('בקרה: אותה סריקה בלי רצועת h3 (פסקה עם הערה בכל מילוי) נקייה — הרפאים תלויים ברצועה', () => {
    const bad = [];
    grid.filter((_, i) => i % 2 === 0).forEach((pt) => { const v = check(buildG(pt, false)).v; if (v.length) bad.push({ label: `P=${pt.P} L=${pt.L} K=${pt.K}`, v }); });
    assert(bad.length === 0, `${bad.length} נקודות: ${bad.slice(0, 3).map((x) => `[${x.label}] ${fmtV(x.v, 1)}`).join(' | ')}`);
  });

  // קורפוסים אמיתיים — אותו סיווג כמו בבלוק S4.9 (בעלות מטקסט הטוקנים). הרצה בלי גופנים (כמו שאר הקובץ);
  // עם גופנים (אומת ידנית — README) מסמך הבדיקה מפיק פחות רפאים וקורפוס ה-parity 0; המספרים תלויים במחולל (D-100 שינה אותו ב-#33).
  const noteClasses = (text) => { const r = run(text); return O.classifyNotes(O.censusOutput(r), O.ownersFromTokens(r)); };
  bugIt('R-04', 'קורפוס ה-parity (no_long_test_text.txt; בלי גופנים): אין הערת רפאים — כרגע הערה בת 65 מילים נפלטת בעמ\' 12 ולפסקה שלה שורות רק בעמ\' 13', () => {
    const c = noteClasses(fs.readFileSync(path.join(AUDITS, 'no_long_test_text.txt'), 'utf8'));
    assertEq(c.lost.length, 0, 'אין הערות אבודות');
    assertEq(c.dup.length, 0, 'אין כפולות באותו עמוד');
    assert(c.ghost.length === 0, `הערות רפאים=${c.ghost.length}: ${c.ghost.slice(0, 2).map((g) => `עמ' ${g.page + 1} (עמודי הפסקה: ${g.ownerPages.map((x) => x + 1)})`).join('; ')}`);
  }, { expect: /הערות רפאים/ });
  bugIt('R-04', 'מסמך הבדיקה הקבוע (generateTestDocument fixed/full; בלי גופנים): אין הערות רפאים (המספר המדויק בהודעת הכשל; תלוי במחולל)', () => {
    const c = noteClasses(generateTestDocument({ mode: 'fixed', scale: 'full' }));
    assertEq(c.lost.length, 0, 'אין הערות אבודות');
    assert(c.ghost.length === 0, `הערות רפאים=${c.ghost.length} מתוך ${c.emissions} פליטות`);
  }, { loose: true, expect: /הערות רפאים/ });
});

// ═════════════════════════ ח. הערות-צד והערות-סיום — מפקד מקור→פלט (R-05) ═════════════════════════
// מודל מקור נפרד מ-parseSource: O.noteLinesOf (מקור) + O.censusNotes (פלט) + O.compareNoteLines (השוואה).
// הוא נחוץ כי שתי התכונות נצרכות בטוקניזציה (pendingSideNote / pendingEndNote) *לפני* ש-contentPreserved של המנוע
// מתחיל לספור — המנוע משווה פלט לטוקנים ולא למקור, ולכן אובדן בטוקניזציה (R-05) אינו נראה לו.

/** מריץ + מוודא שמודל המקור מיושר לטוקנים של המנוע (אחרת בעלות ההערות — עמוד הפסקה — אינה אמינה) + משווה. */
function checkNotes(doc, opts) {
  const r = run(doc);
  const m = O.noteLinesOf(doc, opts);
  const tail = [...m.ends, ...m.sides].some((x) => x.owner === m.tokenCount) ? 1 : 0;
  assertEq(m.tokenCount + tail, r.tokens.length, 'מודל המקור אינו מיושר לטוקנים של המנוע (ייתכן תחביר מחוץ למודל)');
  return { r, m, v: O.compareNoteLines(m, r) };
}
const cnt = (v, code) => v.filter((x) => x.code === code).length;

describe('הערות-צד והערות-סיום · מודל המקור (noteLinesOf) — בדיקות טהורות', () => {
  const doc = [
    'כותרת 2 - פרק', 'פסקה א',
    'הערת סיום - א1 א2', 'הערת סיום - ב1',
    'כותרת 7 - צד1', 'כותרת 3 - ביניים', 'כותרת 7 - צד2',
    'פסקה ב',
    'כותרת 7 - זנב',
  ].join('\n');
  const m = O.noteLinesOf(doc);
  it('כל שורת הערת-סיום היא הערה נפרדת, בסדר המקור; בעליהן הפסקה הבאה', () => {
    assertEq(m.ends.map((e) => e.words.join(' ')).join('|'), 'א1 א2|ב1', 'טקסטי הערות הסיום');
    assertEq(m.ends.map((e) => e.owner).join(','), '3,3', 'שתיהן נצמדות לפסקה ב (טוקן 3: פרק=0, א=1, ביניים=2, ב=3)');
  });
  it('כותרות 7 רצופות נצברות גם מעבר לכותרת אחרת; הערה בסוף המסמך — בעלות זנב סינתטי (owner==tokenCount)', () => {
    assertEq(m.sides.map((s) => s.owner).join(','), '3,3,4', 'בעלים');
    assertEq(m.tokenCount, 4, 'tokenCount (בלי הזנב)');
  });
  it('הערות עורך ##…## מוסרות לפני הניתוח; סוגר פותח ללא סוגר נמשך לשורה הבאה; metaAnywhere צורך שורות מטא', () => {
    const d2 = ['כותרת 2 - פרק', 'פסקה ## הערת עורך ## א', 'פסקה [הערה שלא נסגרת', 'המשך ההערה]', 'הערת סיום - ה'].join('\n');
    const m2 = O.noteLinesOf(d2);
    assertEq(m2.tokenCount, 3, 'פרק, פסקה, פסקה (השורה הנמשכת אינה טוקן נפרד)');
    assertEq(m2.ends[0].owner, 3, 'הערת הסיום בסוף המסמך — זנב');
    const d3 = ['כותרת 2 - פרק', 'נושא - באמצע', 'פסקה'].join('\n');
    assertEq(O.noteLinesOf(d3).tokenCount, 3, 'ברירת מחדל: שורה כזו נשארת פסקה (REQ-PAR-01)');
    assertEq(O.noteLinesOf(d3, { metaAnywhere: true }).tokenCount, 2, 'metaAnywhere: המנוע צורך אותה כמטא-דאטה (O-6)');
  });
  it('הערה ריקה (הערת סיום - / כותרת 7 - בלי טקסט) אינה הערה: לא נכנסת למודל ולא יוצרת זנב סינתטי', () => {
    const m4 = O.noteLinesOf(['כותרת 2 - פרק', 'פסקה', 'הערת סיום -', 'כותרת 7 -'].join('\n'));
    assertEq(m4.ends.length + m4.sides.length, 0, 'אין הערות במודל');
    assertEq(m4.tokenCount, 2, 'פרק + פסקה — בלי זנב סינתטי');
  });
});

describe('הערות-צד והערות-סיום · בקרות שליליות לאורקל (כל סוג הפרה מזוהה; הפלט האמיתי נקי)', () => {
  const g = docBuilder();
  const doc = g.doc(CH + g.w(30) + '\n'
    + `כותרת 7 - ${g.w(3)}\n` + g.w(30) + '\n'
    + `הערת סיום - ${g.w(12)}\n` + g.w(30) + '\n'
    + `כותרת 7 - ${g.w(3)}\nכותרת 7 - ${g.w(2)}\n` + g.w(30) + '\n'
    + `הערת סיום - ${g.w(9)}\n` + g.w(30) + '\n'
    + g.w(900) + '\n' // מילוי: דוחף את הערת-הצד הבאה לעמוד אחר
    + `כותרת 7 - ${g.w(3)}\n` + g.w(30) + '\n'
    + `כותרת 7 - ${g.w(4)}\n`); // זנב סינתטי
  const { r: base, m: model, v: baseV } = checkNotes(doc);
  const clonePages = () => JSON.parse(JSON.stringify(base.pages));
  const view = (pages, extra = {}) => Object.assign({}, base, { pages }, extra);
  const codes = (pages, extra) => codesOf(O.compareNoteLines(model, view(pages, extra)));
  const label = (it) => { const li = (it.markerIdx || [])[0]; return li == null ? null : it.words[li]; };
  // טווחי הפריטים של כל הערת-סיום בעמודי ההערות (בתוך עמודה אחת)
  const enSpans = (pages) => {
    const spans = [];
    pages.forEach((p, pi) => {
      if (p.type !== 'endnotes') return;
      p.columns.forEach((col, ci) => col.forEach((it, k) => {
        if (it.kind !== 'paragraph') return;
        const lb = label(it);
        if (lb != null && lb !== '(המשך)') spans.push({ p: pi, ci, from: k, to: k + 1 });
        else if (spans.length) spans[spans.length - 1].to = k + 1;
      }));
    });
    return spans;
  };
  const marginPages = base.pages.map((p, i) => [p, i]).filter(([p]) => (p.marginNotes || []).length);

  it('בסיס: הפלט האמיתי נקי מכל הפרה', () => assertClean(baseV, 'compareNoteLines'));
  it('בסיס: תנאי הבקרות — שתי הערות-סיום בעמוד אחד, הערות-צד ביותר מעמוד אחד, והזנב נשאר פסקה סינתטית', () => {
    assertEq(enSpans(base.pages).length, 2, 'שתי הערות סיום');
    assert(marginPages.length >= 2, `הערות-צד בעמודים: ${marginPages.map(([, i]) => i + 1)}`);
    assertEq(base.tokens.length, model.tokenCount + 1, 'הזנב הסינתטי קיים כטוקן אחרון (הערת-הצד האחרונה בלי פסקה אחריה)');
  });

  it('הערת-סיום שנמחקה מעמודי ההערות → ENDNOTE_LOST', () => {
    const pages = clonePages();
    const sp = enSpans(pages)[1];
    pages[sp.p].columns[sp.ci].splice(sp.from, sp.to - sp.from);
    assert(codes(pages).includes(V.ENDNOTE_LOST), 'לא זוהה: ' + codes(pages).join(','));
  });
  it('הערת-סיום שהוכפלה → ENDNOTE_DUP', () => {
    const pages = clonePages();
    const sp = enSpans(pages)[0];
    const col = pages[sp.p].columns[sp.ci];
    col.splice(sp.to, 0, ...JSON.parse(JSON.stringify(col.slice(sp.from, sp.to))));
    assert(codes(pages).includes(V.ENDNOTE_DUP), 'לא זוהה: ' + codes(pages).join(','));
  });
  it('שתי הערות-סיום שהוחלף סדרן → ENDNOTE_ORDER ורק הוא', () => {
    const pages = clonePages();
    const [a, b] = enSpans(pages);
    assert(a.p === b.p && a.ci === b.ci && a.to === b.from, 'תנאי הבקרה: ההערות סמוכות באותה עמודה');
    const col = pages[a.p].columns[a.ci];
    const A = col.slice(a.from, a.to), B = col.slice(b.from, b.to);
    col.splice(a.from, b.to - a.from, ...B, ...A);
    assertEq(codes(pages).join(','), V.ENDNOTE_ORDER, 'צפוי ENDNOTE_ORDER בלבד');
  });
  it('מילה שהוחלפה בתוך הערת-סיום → ENDNOTE_LOST + ENDNOTE_TEXT', () => {
    const pages = clonePages();
    const sp = enSpans(pages)[0];
    const it0 = pages[sp.p].columns[sp.ci][sp.from];
    it0.words[it0.words.length - 1] = 'זזזזז';
    const c = codes(pages);
    assert(c.includes(V.ENDNOTE_LOST) && c.includes(V.ENDNOTE_TEXT), 'לא זוהה: ' + c.join(','));
  });
  it('סמן הערת-סיום כפול → ENDNOTE_MARKER ורק הוא', () => {
    const pages = clonePages();
    const [a, b] = enSpans(pages);
    const first = pages[a.p].columns[a.ci][a.from], second = pages[b.p].columns[b.ci][b.from];
    second.words[second.markerIdx[0]] = first.words[first.markerIdx[0]];
    assertEq(codes(pages).join(','), V.ENDNOTE_MARKER, 'צפוי ENDNOTE_MARKER בלבד');
  });

  it('הערת-צד שנמחקה מהשוליים → SIDENOTE_LOST', () => {
    const pages = clonePages();
    pages[marginPages[0][1]].marginNotes.shift();
    assert(codes(pages).includes(V.SIDENOTE_LOST), 'לא זוהה: ' + codes(pages).join(','));
  });
  it('הערת-צד בעמוד שאינו עמוד הפסקה → SIDENOTE_PAGE ורק הוא', () => {
    const pages = clonePages();
    const [mp, mi] = [pages[marginPages[0][1]], marginPages[0][1]];
    const moved = mp.marginNotes.shift();
    const dst = pages.findIndex((p, i) => i !== mi && p.type !== 'endnotes' && !marginPages.some(([, j]) => j === i));
    assert(dst >= 0, 'תנאי הבקרה: עמוד יעד');
    pages[dst].marginNotes = (pages[dst].marginNotes || []).concat(moved);
    assertEq(codes(pages).join(','), V.SIDENOTE_PAGE, 'צפוי SIDENOTE_PAGE בלבד');
  });
  it('הערת-צד שהוכפלה באותו עמוד → SIDENOTE_DUP ורק הוא', () => {
    const pages = clonePages();
    const mp = pages[marginPages[0][1]];
    mp.marginNotes.push(JSON.parse(JSON.stringify(mp.marginNotes[0])));
    assertEq(codes(pages).join(','), V.SIDENOTE_DUP, 'צפוי SIDENOTE_DUP בלבד');
  });
  it('מילה שהוחלפה בהערת-צד → SIDENOTE_LOST + SIDENOTE_TEXT', () => {
    const pages = clonePages();
    const ln = pages[marginPages[0][1]].marginNotes[0].lines[0];
    ln.text = ln.text.split(' ').map((w, i) => (i === 0 ? 'זזזזז' : w)).join(' ');
    const c = codes(pages);
    assert(c.includes(V.SIDENOTE_LOST) && c.includes(V.SIDENOTE_TEXT), 'לא זוהה: ' + c.join(','));
  });
  it('הערת-צד בזנב המסמך שאינה בגוף הפסקה הסינתטית → SIDENOTE_LOST', () => {
    const pages = clonePages();
    const tailId = base.tokens.length - 1;
    for (const p of pages) for (const col of p.columns || []) for (let i = col.length - 1; i >= 0; i--) if (col[i].kind === 'paragraph' && col[i].tokenId === tailId) col.splice(i, 1);
    assert(codes(pages).includes(V.SIDENOTE_LOST), 'לא זוהה: ' + codes(pages).join(','));
  });
  it('contentPreserved=false של המנוע → CONTENT_PRESERVED (חשבונאות המנוע חייבת להסכים עם האורקל)', () => {
    assert(codes(clonePages(), { contentPreserved: false }).includes(V.CONTENT_PRESERVED), 'לא זוהה');
  });
});

describe('הערות-צד והערות-סיום · משפחות תקינות — אפס הפרות', () => {
  const g = docBuilder();
  const P = (n = 30) => g.w(n) + '\n';
  const S = (n = 3) => `כותרת 7 - ${g.w(n)}\n`;
  const E = (n = 12) => `הערת סיום - ${g.w(n)}\n`;
  const fams = [
    ['הערת-צד לכל פסקה, באורכים שונים (1/3/12/40/100 מילים)', CH + [1, 3, 12, 40, 100].map((n) => S(n) + P()).join('')],
    ['שתי/שלוש/חמש כותרות 7 רצופות — נצברות להערה אחת', CH + S() + S(2) + P() + S() + S(2) + S(4) + P() + S(1) + S(1) + S(1) + S(1) + S(1) + P()],
    ['כותרת 7, כותרת 3, כותרת 7 ואז פסקה — הצטברות מעבר לכותרת', CH + P() + S() + 'כותרת 3 - ' + g.w(2) + '\n' + S(2) + P()],
    ['כותרת 7 מיד אחרי כותרת 4 ולפני פסקה', CH + 'כותרת 4 - ' + g.w(2) + '\n' + S() + P() + P()],
    ['כותרת 7 בסוף המסמך — פסקה סינתטית', CH + P() + P() + S(5)],
    ['שתי כותרות 7 בסוף המסמך — נצברות לפסקה סינתטית אחת', CH + P() + S(2) + S(3)],
    ['הערת-סיום לכל פסקה (שש הערות, מופרדות בפסקאות)', CH + [1, 2, 3, 4, 5, 6].map(() => P() + E()).join('') + P()],
    ['הערת-סיום ארוכה מאוד (200 מילים — חוצה שורות) וקצרות', CH + P() + E(200) + P() + E(2) + P() + E(1) + P()],
    ['30 הערות-סיום של 40 מילים — עמודי הערות מרובים ו-(המשך) בחציית עמוד', CH + Array.from({ length: 30 }, () => P(20) + E(40)).join('') + P()],
    ['הערת-סיום והערת-צד על אותה פסקה (שני הסדרים)', CH + P() + S() + E() + P() + E() + S() + P()],
    ['הערת-סיום, כותרת 3 ופסקה — הכותרת אינה צורכת את ההערה', CH + P() + E() + 'כותרת 3 - ' + g.w(2) + '\n' + P() + P()],
    ['הערת-סיום בסוף המסמך — פסקה סינתטית', CH + P() + P() + E(7)],
    ['הערת-סיום והערת-צד בסוף המסמך', CH + P() + E(7) + S(4)],
    ['פסקה עם הערת שוליים [..], הערת-צד והערת-סיום יחד', CH + S() + E() + g.w(10) + ` [${g.w(5)}] ` + g.w(10) + '\n' + P()],
  ];
  for (const [name, body] of fams) {
    it(name, () => assertClean(checkNotes(g.doc(body)).v, name));
  }

  // סריקת היסט אנכי: הערה (צד/סיום) לפני פסקה, מוזזת לאורך העמוד כדי להגיע למצבי שבירה שונים
  for (const [kind, mk] of [['הערת-צד', () => S(4)], ['הערת-סיום', () => E(15)]]) {
    it(`סריקה: ${kind} + פסקה, היסט אנכי K=0..900 בצעד 45 — אפס הפרות`, () => {
      const bad = [];
      for (let K = 0; K <= 900; K += 45) {
        const gg = docBuilder();
        const wP = (n) => gg.w(n) + '\n';
        const note = kind === 'הערת-צד' ? `כותרת 7 - ${gg.w(4)}\n` : `הערת סיום - ${gg.w(15)}\n`;
        const v = checkNotes(gg.doc(CH + (K ? wP(K) : '') + note + wP(40) + wP(30))).v;
        if (v.length) bad.push(`K=${K}: ${fmtV(v, 1)}`);
      }
      assert(bad.length === 0, `${bad.length} נקודות: ${bad.slice(0, 3).join(' | ')}`);
    });
  }
});

// עמוד הערות-סיום נושא פריטי 'paragraph' עם tokenId של הפסקה שאחריה נכתבה ההערה ו-lineIdx=null. בגרסה הקודמת של האורקל (main עד 5449b1f)
// הם נספרו כשורות גוף של אותה פסקה, ולכן ownerPageCoverage (impact.js) ראה את עמוד ההערות כ"עמוד של הפסקה" וסימן את הערות-השוליים שלה
// כחסרות שם: במסמך הבדיקה הקבוע 21 "כיסוי-חסר" — כולם בעמוד האחרון (עמוד הערות-הסיום), אפס בעמודי גוף. אין פער אמיתי שהוסתר; הבדיקה
// נועלת את התיקון (ובקרה מראה שבלעדיו המדד אכן מנופח), כדי שהשוואת impact.js לפני/אחרי המיזוג תהיה מוסברת ולא שקטה.
describe('מפקד הפלט · עמוד הערות-הסיום אינו עמוד גוף של הפסקה הבעלים (כיסוי-הערות לפי עמוד אינו מנופח)', () => {
  const g = docBuilder();
  // הפסקה השנייה: בעלת הערת-סיום (השורה שלפניה) וגם הערת שוליים [..] — לכן היא ב-owners, ויש לה שורות רק בעמוד גוף
  const doc = g.doc(CH + g.w(20) + ` [${g.w(4)}] ` + g.w(5) + '\n'
    + `הערת סיום - ${g.w(8)}\n`
    + g.w(20) + ` [${g.w(4)}] ` + g.w(5) + '\n');
  const { r, v } = checkNotes(doc);
  const owners = O.ownersFromTokens(r);
  const ownerId = r.tokens.length - 1;
  const endItems = r.pages.filter((p) => p.type === 'endnotes')
    .flatMap((p) => p.columns.flat()).filter((it) => it.kind === 'paragraph' && it.tokenId === ownerId);

  it('תנאי הבדיקה: המנוע פולט עמוד הערות-סיום עם פריט של הפסקה הבעלים (tokenId שלה, lineIdx=null), והמסמך נקי באורקל', () => {
    assert(endItems.length >= 1, 'אין פריט הערת-סיום של הפסקה הבעלים — התנאי לא התקיים');
    assert(endItems.every((it) => it.lineIdx == null), 'lineIdx של פריט עמוד-הערות אינו null: ' + endItems.map((it) => it.lineIdx));
    assertEq(owners.size, 2, 'שתי הפסקאות נושאות הערת שוליים');
    assertClean(v, 'compareNoteLines');
  });
  it('המפקד אינו מייחס לפסקה הבעלים שורות בעמוד הערות-הסיום; lineDup=0; ownerPageCoverage — 2 זוגות ואפס חסרים', () => {
    const cen = O.censusOutput(r);
    const lines = [...cen.paras.get(ownerId).values()];
    assert(lines.length >= 1 && lines.every((l) => r.pages[l.page].type !== 'endnotes'), 'שורה של הפסקה הבעלים נספרה בעמוד הערות-סיום');
    assertEq(cen.lineDup, 0, 'lineDup');
    const cov = O.ownerPageCoverage(cen, owners);
    assertEq(cov.pairs, 2, 'זוגות (עמוד גוף, הערה): פסקה × עמוד גוף אחד');
    assertEq(cov.missing.length, 0, 'חסרים: ' + JSON.stringify(cov.missing));
    const c = O.classifyNotes(cen, owners);
    assertEq([c.ghost.length, c.dup.length, c.lost.length, c.orderViolation ? 1 : 0].join(','), '0,0,0,0', 'רפאים,כפילות,אבודות,סדר');
  });
  it('בקרה שלילית: אם עמוד הערות-הסיום נספר כעמוד גוף (כמו האורקל הישן) — הכיסוי מנופח: 3 זוגות, חסר אחד בעמוד ההערות', () => {
    const asBody = Object.assign({}, r, { pages: r.pages.map((p) => (p.type === 'endnotes' ? Object.assign({}, p, { type: 'regular' }) : p)) });
    const cov = O.ownerPageCoverage(O.censusOutput(asBody), owners);
    assertEq(cov.pairs, 3, 'זוגות כשעמוד ההערות נספר כגוף');
    assertEq(cov.missing.length, 1, 'חסרים כשעמוד ההערות נספר כגוף: ' + JSON.stringify(cov.missing));
    assertEq(r.pages[cov.missing[0].page].type, 'endnotes', 'החסר הוא בעמוד הערות-הסיום');
  });
});

describe('R-05 · שורות הערת-סיום רצופות — נשארת רק האחרונה; השאר אובדות בשקט בטוקניזציה (contentPreserved נשאר true)', () => {
  const trigger = readFixture('endnote-consecutive-trigger.txt');
  const control = readFixture('endnote-consecutive-control.txt');

  it('בקרה: אותן שלוש הערות, כל אחת לפני פסקה משלה — כולן נפלטות (אפס הפרות)', () => {
    assertClean(checkNotes(control).v, 'endnote-consecutive-control.txt');
  });
  it('אבחון: ב-fixture הטריגר ההפרות הן ENDNOTE_LOST בלבד (כשהבאג פתוח: בדיוק 2 מתוך 3 — האחרונה בקבוצה נשמרת), והמנוע עצמו אינו מזהה', () => {
    const { r, v } = checkNotes(trigger);
    assertOnlyCodes(v, [V.ENDNOTE_LOST], 'endnote-consecutive-trigger.txt');
    if (!isFixed('R-05')) assertEq(cnt(v, V.ENDNOTE_LOST), 2, 'שתי הערות אבודות (הבאג פתוח: נשמרת רק האחרונה)');
    assertEq(r.contentPreserved, true, 'contentPreserved של המנוע נשאר true — האובדן בלתי-נראה לו (הוא משווה פלט לטוקנים)');
  });
  bugIt('R-05', 'fixture טריגר: כל שלוש שורות הערת-הסיום הרצופות נפלטות בעמודי ההערות (כרגע רק האחרונה)', () => {
    assertClean(checkNotes(trigger).v, 'endnote-consecutive-trigger.txt');
  }, { expect: /ENDNOTE_LOST/ });

  // שורה ריקה (`הערת סיום -` / `כותרת 7 -` בלי טקסט): אין בה תוכן — אינה הערה בפלט ואינה אובדן. אבל כשהיא באה אחרי הערה אמיתית
  // (בלי פסקה ביניהן) המנוע דורס בה את ההערה האמיתית — אותו מנגנון של R-05 (pendingEndNote יחיד).
  it('שורה ריקה (הערת-סיום / כותרת 7): לבדה, לפני הערה אמיתית, או בסוף המסמך — אפס הפרות (אין בה תוכן שאובד)', () => {
    const real = (g) => `הערת סיום - ${g.w(6)}\n`;
    const variants = {
      'הערת-סיום ריקה לבדה': (g) => 'הערת סיום -\n' + g.w(20) + '\n',
      'ריקה לפני אמיתית': (g) => 'הערת סיום -\n' + real(g) + g.w(20) + '\n',
      'ריקה בסוף המסמך': (g) => g.w(20) + '\nהערת סיום -\n',
      'כותרת 7 ריקה לבדה': (g) => 'כותרת 7 -\n' + g.w(20) + '\n',
      'כותרת 7 ריקה בסוף המסמך': (g) => g.w(20) + '\nכותרת 7 -\n',
    };
    for (const [name, build] of Object.entries(variants)) {
      const g = docBuilder();
      assertClean(checkNotes(g.doc(CH + g.w(15) + '\n' + build(g))).v, name);
    }
  });
  bugIt('R-05', 'שורת הערת-סיום ריקה אחרי הערה אמיתית (בלי פסקה בינתיים) אינה מוחקת אותה (כרגע הריקה דורסת)', () => {
    const g = docBuilder();
    assertClean(checkNotes(g.doc(CH + g.w(15) + '\n' + `הערת סיום - ${g.w(6)}\nהערת סיום -\n` + g.w(20) + '\n')).v, 'ריקה אחרי אמיתית');
  }, { expect: /ENDNOTE_LOST/ });

  // משפחה: n שורות הערת-סיום רצופות (n=2,3,4,6) בהקשרים שונים ובמילויים שונים
  const ctx = {
    'אחרי פסקה': (g, n, K) => CH + (K ? g.w(K) + '\n' : '') + g.w(30) + '\n' + Array.from({ length: n }, () => `הערת סיום - ${g.w(8)}\n`).join('') + g.w(30) + '\n',
    'אחרי כותרת': (g, n, K) => CH + (K ? g.w(K) + '\n' : '') + g.w(30) + '\nכותרת 3 - ' + g.w(2) + '\n' + Array.from({ length: n }, () => `הערת סיום - ${g.w(8)}\n`).join('') + g.w(30) + '\n',
    'בראש הטקסט': (g, n, K) => CH + Array.from({ length: n }, () => `הערת סיום - ${g.w(8)}\n`).join('') + (K ? g.w(K) + '\n' : '') + g.w(30) + '\n',
    'בין הערות-צד': (g, n, K) => CH + (K ? g.w(K) + '\n' : '') + g.w(30) + '\n' + `הערת סיום - ${g.w(8)}\nכותרת 7 - ${g.w(3)}\n` + Array.from({ length: n - 1 }, () => `הערת סיום - ${g.w(8)}\n`).join('') + g.w(30) + '\n',
    'בסוף המסמך': (g, n, K) => CH + (K ? g.w(K) + '\n' : '') + g.w(30) + '\n' + Array.from({ length: n }, () => `הערת סיום - ${g.w(8)}\n`).join(''),
  };
  const pts = [];
  for (const [cname, build] of Object.entries(ctx)) for (const n of [2, 3, 4, 6]) for (const K of [0, 300, 700]) pts.push({ cname, n, K, build });
  const famV = pts.map((pt) => { const g = docBuilder(); const { v } = checkNotes(g.doc(pt.build(g, pt.n, pt.K))); return { pt, v }; });
  it('סריקת המשפחה: כל ההפרות הן ENDNOTE_LOST בלבד (כשהבאג פתוח: בדיוק n−1 בכל נקודה — נשמרת רק האחרונה)', () => {
    const open = !isFixed('R-05'); // כשהבאג פתוח האובדן מדויק (n−1); אחרי תיקון — אפס
    const wrong = famV.filter(({ pt, v }) => v.some((x) => x.code !== V.ENDNOTE_LOST) || (open ? cnt(v, V.ENDNOTE_LOST) !== pt.n - 1 : v.length > 0));
    assert(wrong.length === 0, `${wrong.length}/${famV.length} נקודות חריגות: ${wrong.slice(0, 3).map(({ pt, v }) => `[${pt.cname} n=${pt.n} K=${pt.K}] ${fmtV(v, 2)}`).join(' | ')}`);
  });
  bugIt('R-05', `סריקת המשפחה (${famV.length} נקודות: 2–6 הערות-סיום רצופות ב-5 הקשרים): כולן נפלטות (כרגע ${famV.filter((x) => x.v.length).length} נקודות מאבדות)`, () => {
    const bad = famV.filter((x) => x.v.length);
    assert(bad.length === 0, `${bad.length}/${famV.length} נקודות: ${bad.slice(0, 3).map(({ pt, v }) => `[${pt.cname} n=${pt.n} K=${pt.K}] ${fmtV(v, 1)}`).join(' | ')}`);
  }, { expect: /ENDNOTE_LOST/ });

  // מסמך הבדיקה הקבוע — המחולל כותב 2–6 שורות הערת-סיום ברצף בסוף ~שליש מהפרקים (כוונה מפורשת בקוד המחולל)
  const genDoc = generateTestDocument({ mode: 'fixed', scale: 'full' });
  const gen = checkNotes(genDoc);
  it('מסמך הבדיקה הקבוע: ההפרות הן ENDNOTE_LOST בלבד — הערות-הצד (>100) והערות-הסיום שנשמרו תקינות (הגנה מפני רגרסיות אחרות)', () => {
    assert(gen.m.sides.length >= 100 && gen.m.ends.length >= 40, `המסמך השתנה: ${gen.m.sides.length} צד / ${gen.m.ends.length} סיום`);
    assertOnlyCodes(gen.v, [V.ENDNOTE_LOST], 'generateTestDocument');
  });
  bugIt('R-05', `מסמך הבדיקה הקבוע (generateTestDocument fixed/full): כל ${gen.m.ends.length} שורות הערת-הסיום נפלטות — כרגע ${gen.m.ends.length - cnt(gen.v, V.ENDNOTE_LOST)} (חסרות ${cnt(gen.v, V.ENDNOTE_LOST)})`, () => {
    assertClean(gen.v, 'generateTestDocument');
  }, { loose: true, expect: /ENDNOTE_LOST/ });
});

describe('הערות-צד והערות-סיום · קורפוסים אמיתיים (מודל מיושר לטוקנים; אפס הפרות)', () => {
  const corpus = (f) => fs.readFileSync(path.join(AUDITS, f), 'utf8');
  it('no_long_test_text.txt (קורפוס ה-parity): כל הערות-הצד (מאות) בעמוד הפסקה שלהן', () => {
    const { m, v } = checkNotes(corpus('no_long_test_text.txt'));
    assert(m.sides.length >= 100, `הקורפוס השתנה: ${m.sides.length} הערות צד`);
    assertClean(v, 'no_long_test_text.txt');
  });
  it('mid_long_test_text.txt: כל הערות-הצד בעמוד הפסקה שלהן', () => {
    const { m, v } = checkNotes(corpus('mid_long_test_text.txt'));
    assert(m.sides.length >= 400, `הקורפוס השתנה: ${m.sides.length} הערות צד`);
    assertClean(v, 'mid_long_test_text.txt');
  });
  it('canonical_corpus.txt: 8 הערות-צד ו-8 הערות-סיום תקינות (metaAnywhere: שורת "נושא -" בשורה 2 נצרכת כמטא — O-6)', () => {
    const { m, v } = checkNotes(fs.readFileSync(path.join(REPO, 'tests', 'fixtures', 'canonical_corpus.txt'), 'utf8'), { metaAnywhere: true });
    assert(m.ends.length >= 8 && m.sides.length >= 8, `הקורפוס השתנה: ${m.sides.length} צד / ${m.ends.length} סיום`);
    assertClean(v, 'canonical_corpus.txt');
  });
});

report('source-families');
