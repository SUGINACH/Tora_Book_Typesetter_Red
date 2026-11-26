// tests/regress/p67-classify-tool.test.js — בדיקות לכלי tools/baseline/p67-classify.js (סוכן 4)
//
// הכלי מסווג את פערי P6/P7 מול דוגמת ה-PDF ההיסטורית: זהות תוכן לפי סוג אסימון, פרופיל עמודים, טקסונומיית בלוקים לפי תנועת מילים,
// מפקד רווח-התאמה (FIT_EPS) וניסוי נגדי. הוא כלי **אבחון** — אין בדיקה כאן שמקבעת מספר parity (P6/P7 אינם שער/יעד, D-98).
// מה כן נבדק, ולמה:
//   א. פורט difflib (SequenceMatcher) מול קובץ זהב שהופק מ-CPython — כולל שוברי-שוויון. בלי זה "יחס P7" של הכלי אינו
//      ניתן להצלבה עם compare.py. (הצלבה על הנתונים האמיתיים: `--parity-report`; דורשת Python+PyMuPDF ולכן אינה כאן.)
//   ב. נרמול, גימטריה וסוג אסימון: מספר-עמוד נחשב "מוסבר-מאליו" **רק במקומו** (אסימון אחרון בשורת TOC). בלי ההבחנה הזאת הכלי
//      הסתיר הבדל אמיתי (סימני הערה "א" מול "ב".."ו" בעמ' 36–53) תחת "רק מספרים שונים" — כל אחד מהמקרים האלה נבדק כאן עם בקרה שלילית.
//   ג. שורות קריאה: אשכול y≤1.5, מיון x יורד, איחוי שורת-חלון (דגל וגם גיאומטריה), סדר טורים/הערות/שוליים.
//   ד. כל אחד מסוגי הבלוקים על מסמכים סינתטיים קטנים — **לכל סוג מקרה שבו הוא חייב להופיע ומקרה שבו אסור**.
//   ה. מפקד הרווח: סינון שורות, תחומי הרווח, החרגת ארטיפקטים; והעיגון האמיתי — המדידה של שורת-ההפער-הראשון בייחוס.
//   ו. הניסוי הנגדי רץ על העתק זמני: ה-knob מחווט (hash משתנה), הבקרה (אותו ערך כמו במנוע) משחזרת את ה-hash של המנוע הלא-משונה,
//      התוכן אינו משתנה בין ערכים, הריפו אינו נכתב, ספריות זמניות נמחקות.
//   ז. CLI: קודי יציאה, JSON, ובקרה שלילית לשומר העקביות מול compare.py (דוח שהוסט ⇒ קוד 3).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TOOL = path.join(REPO_ROOT, 'tools', 'baseline', 'p67-classify.js');
const T = require(TOOL);
const REF_FILE = path.join(REPO_ROOT, 'audits', 'layout-reference.json');
const GOLDEN = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'regress', 'p67', 'difflib-golden.json'), 'utf8'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

// ---------- בונים למודלים סינתטיים ----------
const L = (text, o = {}) => ({
  text, col: o.col === undefined ? 'right' : o.col, y0: o.y0 === undefined ? 100 : o.y0, x0: o.x0 === undefined ? 303 : o.x0,
  x1: o.x1 === undefined ? 505 : o.x1, size: o.size === undefined ? 12 : o.size, font: o.font || 'GuttmanRashiNormal',
  justified: o.justified === undefined ? true : o.justified, window: o.window
});
const LEFT = { col: 'left', x0: 100, x1: 290 };
const P = (index, type, lines, columns) => ({ index, type, lines, columns: columns || [] });
const M = (pages, paragraphSeq) => ({ pages, document: { paragraphSeq: paragraphSeq || [] }, meta: { layoutHash: 'test' } });
const byClass = (res, cls) => (res.blocks.byClass[cls] || { blocks: 0 }).blocks;
const run = (ref, ours) => T.analyze(ref, ours, {});
/** n מילים ייחודיות (אינן אותיות-גימטריה ⇒ סוג "מילה"): prefix0 prefix1 … */
const W = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(' ');

describe('p67-classify · פורט difflib מול CPython (קובץ זהב)', () => {
  it('קובץ הזהב עשיר: ≥140 מקרים, כולל ריקים, שוויונות ושינויים מקומיים', () => {
    assert(GOLDEN.cases.length >= 140, `מקרים: ${GOLDEN.cases.length}`);
    assert(GOLDEN.cases.some((c) => c.a.length === 0) && GOLDEN.cases.some((c) => c.b.length === 0), 'חסרים מקרי קצה ריקים');
    assert(GOLDEN.cases.filter((c) => c.opcodes.some((o) => o[0] === 'replace')).length >= 30, 'מעט מקרי replace');
    assert(GOLDEN.cases.filter((c) => c.blocks.length > 4).length >= 20, 'מעט מקרים עם בלוקים מרובים');
  });
  it('matching_blocks זהים לכל מקרה (כולל הסנטינל ושוברי שוויון)', () => {
    for (const c of GOLDEN.cases) assertEq(T.matchingBlocks(c.a, c.b), c.blocks, `blocks: ${c.label}`);
  });
  it('opcodes זהים לכל מקרה', () => {
    for (const c of GOLDEN.cases) assertEq(T.opcodes(c.a, c.b), c.opcodes, `opcodes: ${c.label}`);
  });
  it('ratio זהה (עד 1e-9) לכל מקרה', () => {
    for (const c of GOLDEN.cases) assert(Math.abs(T.ratio(c.a, c.b) - c.ratio) < 1e-9, `ratio ${c.label}: ${T.ratio(c.a, c.b)} ≠ ${c.ratio}`);
  });
});

describe('p67-classify · נרמול, גימטריה וסוג אסימון', () => {
  it('norm: ניקוד, פיסוק→רווח, NFKC וכיווץ רווחים — כמו compare.py', () => {
    assertEq(T.norm('שָׁלוֹם, עולם!'), 'שלום עולם', 'ניקוד+פיסוק');
    assertEq(T.norm('  א.  ב;ג:ד  '), 'א ב ג ד', 'כיווץ רווחים');
    assertEq(T.norm('בע"מ'), 'בע מ', 'גרשיים בתוך ראשי-תיבות הופכים לרווח');
    assertEq(T.norm('א־ב'), 'אב', 'מקף עברי (U+05BE) נמחק כניקוד — לפני תחליף הפיסוק');
    assertEq(T.norm('ﬁ'), 'fi', 'NFKC');
    assertEq(T.norm(null), '', 'null'); assertEq(T.norm(undefined), '', 'undefined');
  });
  it('bag: סדר המילים בשורה אינו משנה (חסין לסדר גליפים בחילוץ); מולטיסט — לא סט', () => {
    assertEq(T.bag('ג א ב'), T.bag('ב ג א'), 'bag');
    assert(T.bag('א ב') !== T.bag('א ב ב'), 'מולטיסט');
  });
  it('isGematriaToken: מספרי-אותיות תקינים כן; צורה סופית, ערכים עולים, חזרה שאינה ת, ואורך>4 — לא', () => {
    for (const t of ['ל', 'לא', 'מג', 'קכג', 'תתק', 'טו', 'טז', 'יא', 'תקמ']) assert(T.isGematriaToken(t), `מספר תקין: ${t}`);
    for (const t of ['שלום', 'עולם', 'אב', 'ככ', 'תתתתת', 'abc', '', 'א1', 'ת״ל']) assert(!T.isGematriaToken(t), `אינו מספר: ${t}`);
  });
  it('tokenKind: מספר-עמוד רק בסוף שורת TOC; אות בודדת = סימן; "לא" בגוף = מילה', () => {
    assertEq(T.tokenKind('לא', true, true), 'n', 'TOC, אחרון, מספר תקין');
    assertEq(T.tokenKind('ל', true, true), 'n', 'TOC, אחרון, אות בודדת');
    assertEq(T.tokenKind('לא', false, true), 'w', 'TOC אך לא אחרון — חלק מהכותרת');
    assertEq(T.tokenKind('לא', true, false), 'w', 'גוף: "לא" היא מילה');
    assertEq(T.tokenKind('שבת', true, true), 'w', 'TOC, אחרון, אך אינו מספר');
    assertEq(T.tokenKind('ב', false, true), 'm', 'אות בודדת באמצע שורת TOC = סימן');
    assertEq(T.tokenKind('ב', true, false), 'm', 'אות בודדת בגוף = סימן');
    assertEq(T.tokenKind('ם', true, false), 'w', 'צורה סופית אינה סימן');
  });
  it('kindedTokens: מפצל לפי סוג העמוד של אותו צד', () => {
    const model = M([P(0, 'toc-general', [L('כותרת ארוכה ל', { col: 'single' })]), P(1, 'body', [L('מילה ב מילה ל', { y0: 100 })])]);
    const k = T.kindedTokens(T.readingLines(model), T.typesOf(model.pages));
    assertEq(k, { n: ['ל'], m: ['ב', 'ל'], w: ['כותרת', 'ארוכה', 'מילה', 'מילה'] }, 'פיצול');
  });
});

describe('p67-classify · שורות קריאה (פורט reading_lines)', () => {
  it('סדר: ימין (y עולה) ← שמאל ← יחיד ← none ← שוליים-ימין ← שוליים-שמאל; ריקות נושרות', () => {
    const pg = P(0, 'body', [
      L('צ שמאל', { col: 'left', y0: 100, x0: 100, x1: 290 }), L('ג שנייה', { col: 'right', y0: 140 }), L('ב ראשונה', { col: 'right', y0: 100 }),
      L('שולי ימין', { col: null, size: 6, x0: 520, x1: 550, y0: 50 }), L('שולי שמאל', { col: null, size: 6, x0: 40, x1: 70, y0: 60 }),
      L('הערה', { col: null, size: 8.5, x0: 300, x1: 500, y0: 700 }), L('יחיד', { col: 'single', y0: 80 }), L('.,', { col: 'right', y0: 300 })
    ]);
    const seq = T.readingLines(M([pg]));
    assertEq(seq.map((l) => `${l.col}:${l.text}`), ['right:ב ראשונה', 'right:ג שנייה', 'left:צ שמאל', 'single:יחיד', 'none:הערה', 'mright:שולי ימין', 'mleft:שולי שמאל'], 'סדר');
    assertEq(seq[0].page, 0, 'עמוד'); assertEq(seq[0].bag, T.bag('ב ראשונה'), 'bag');
  });
  it('אשכול y≤1.5 (גם שרשרת) מתאחד לשורה אחת במיון x יורד; מעל 1.5 — שורות נפרדות', () => {
    const pg = P(0, 'body', [L('שמאל', { y0: 100, x0: 303 }), L('ימין', { y0: 101.4, x0: 450 }), L('אמצע', { y0: 102.8, x0: 380 }), L('נפרדת', { y0: 105 })]);
    assertEq(T.readingLines(M([pg])).map((l) => l.text), ['ימין אמצע שמאל', 'נפרדת'], 'אשכול שרשרת');
  });
  it('שורת-חלון: דגל window מתאחד עם השורה הבאה; גיאומטריה (גודל>13 בשפה הימנית) גם כן; חלון אחרון בטור לא', () => {
    const cols = [{ name: 'right', x0: 303, x1: 505 }];
    const flagged = P(0, 'body', [L('חלון', { y0: 100, window: true, size: 18 }), L('המשך השורה', { y0: 120 }), L('שורה', { y0: 140 })], cols);
    assertEq(T.readingLines(M([flagged])).map((l) => l.text), ['חלון המשך השורה', 'שורה'], 'דגל');
    const geo = P(0, 'body', [L('חלון', { y0: 100, size: 18, x0: 460, x1: 505 }), L('המשך', { y0: 120 })], cols);
    assertEq(T.readingLines(M([geo])).map((l) => l.text), ['חלון המשך'], 'גיאומטריה');
    const notWindow = P(0, 'body', [L('כותרת ממורכזת', { y0: 100, size: 18, x0: 330, x1: 470 }), L('המשך', { y0: 120 })], cols);
    assertEq(T.readingLines(M([notWindow])).map((l) => l.text), ['כותרת ממורכזת', 'המשך'], 'כותרת ממורכזת אינה חלון');
    const last = P(0, 'body', [L('שורה', { y0: 100 }), L('חלון', { y0: 120, window: true, size: 18 })], cols);
    assertEq(T.readingLines(M([last])).map((l) => l.text), ['שורה', 'חלון'], 'חלון אחרון נשאר');
  });
});

describe('p67-classify · שחזור P6', () => {
  it('ראשים מיושרים, התאמת שורות/מילים וסכומים', () => {
    const para = (head, lines, words) => ({ head, lines, words });
    const ref = M([], [para('א ב ג ד', 3, 30), para('ה ו ז', 2, 20), para('ח ט י', 4, 40)]);
    const ours = M([], [para('א ב ג', 3, 30), para('ה ו ז', 5, 20), para('כ ל מ', 4, 41), para('ח ט י', 4, 40)]);
    assertEq(T.reproduceP6(ref, ours), { refCount: 3, oursCount: 4, headAligned: 3, linesMatch: 2, wordsMatch: 3, refTotalLines: 9, oursTotalLines: 16, refTotalWords: 90, oursTotalWords: 131 }, 'P6');
  });
});

describe('p67-classify · זהות תוכן לפי סוג אסימון', () => {
  const body = (lines, i = 0) => P(i, 'body', lines);
  const toc = (lines, i = 0) => P(i, 'toc-general', lines.map((t, k) => L(t, { col: 'single', y0: 100 + 20 * k })));
  it('מודלים זהים ⇒ identical, אפס הבדלים בכל סוג, יחס P7 = 1', () => {
    const mk = () => M([toc(['פרק ראשון ל']), body([L('alpha beta ב gamma', { y0: 100 })], 1)]);
    const r = run(mk(), mk());
    assertEq(r.content.verdict, 'identical', 'verdict');
    for (const k of ['words', 'markers', 'tocNumerals']) assertEq([r.content.byKind[k].onlyRefTotal, r.content.byKind[k].onlyOursTotal], [0, 0], k);
    assertEq(r.content.markerPages, [], 'אין עמודי סימנים'); assertEq(r.reproduction.p7.ratio, 1, 'יחס'); assertEq(r.blocks.total, 0, 'בלוקים');
  });
  it('מספר-עמוד ב-TOC שונה (ל→לא בסוף שורה) ⇒ toc-numerals-only בלבד; סטטוס העמוד numerals', () => {
    const r = run(M([toc(['פרק ראשון ל', 'פרק שני ב'])]), M([toc(['פרק ראשון לא', 'פרק שני ב'])]));
    assertEq(r.content.verdict, 'toc-numerals-only', 'verdict');
    assertEq(r.content.byKind.tocNumerals.onlyRef, [['ל', 1]], 'רק-ייחוס'); assertEq(r.content.byKind.tocNumerals.onlyOurs, [['לא', 1]], 'רק-RED');
    assertEq([r.content.byKind.words.onlyRefTotal, r.content.byKind.words.onlyOursTotal, r.content.byKind.markers.onlyRefTotal], [0, 0, 0], 'מילים/סימנים זהים');
    assertEq(r.pages[0].status, 'numerals', 'סטטוס עמוד');
  });
  it('בקרה: אותו ל→לא בסוף שורה בגוף הטקסט אינו "מספר עמוד" — "לא" היא מילה ⇒ differs', () => {
    const r = run(M([body([L('פרק ראשון ל', { y0: 100 })])]), M([body([L('פרק ראשון לא', { y0: 100 })])]));
    assertEq(r.content.verdict, 'differs', 'verdict'); assertEq(r.content.byKind.words.onlyOurs, [['לא', 1]], 'המילה "לא" מדווחת כמילה');
  });
  it('בקרה: מילה שנשמטה מאמצע שורת TOC — גם אם נראית כמספר ("על") — differs; הפטור רק לאסימון האחרון', () => {
    const r = run(M([toc(['הלכות על שבת ל'])]), M([toc(['הלכות שבת ל'])]));
    assertEq(r.content.verdict, 'differs', 'verdict'); assertEq(r.content.byKind.words.onlyRef, [['על', 1]], 'המילה החסרה');
    assertEq(byClass(r, 'numeral'), 0, 'הבלוק אינו numeral');
  });
  it('בקרה: אסימון אחרון בשורת TOC שאינו מספר תקין (מילה) ⇒ differs', () => {
    const r = run(M([toc(['הלכות שבת ל'])]), M([toc(['הלכות שבת קדושה'])]));
    assertEq(r.content.verdict, 'differs', 'verdict'); assertEq(r.content.byKind.words.onlyOurs, [['קדושה', 1]], 'מילה');
  });
  it('סימן-הערה שהתחלף בגוף (ב→ג) ⇒ markers-differ ולא toc-numerals-only; העמוד מדווח עם הסימנים משני הצדדים', () => {
    const r = run(M([body([L('alpha beta ב', { y0: 100 })])]), M([body([L('alpha beta ג', { y0: 100 })])]));
    assertEq(r.content.verdict, 'markers-differ', 'verdict');
    assertEq(r.content.byKind.markers.onlyRef, [['ב', 1]], 'רק-ייחוס'); assertEq(r.content.byKind.markers.onlyOurs, [['ג', 1]], 'רק-RED');
    assertEq(r.content.markerPages, [{ page: 0, ref: { ב: 1 }, ours: { ג: 1 } }], 'עמוד הסימנים');
    assertEq(r.pages[0].status, 'markers', 'סטטוס עמוד');
  });
  it('סימן-הערה שנשמט בגוף (בטקסט, לא במספור) ⇒ markers-differ — לא identical ולא "מספרים"', () => {
    const r = run(M([body([L('alpha beta ב gamma', { y0: 100 })])]), M([body([L('alpha beta gamma', { y0: 100 })])]));
    assertEq(r.content.verdict, 'markers-differ', 'verdict'); assertEq(r.content.byKind.markers.onlyRef, [['ב', 1]], 'הסימן החסר');
    assertEq(r.content.markerPages, [{ page: 0, ref: { ב: 1 }, ours: {} }], 'עמוד');
  });
  it('סימן שעבר בין עמודים (אותה ספירה גלובלית) ⇒ identical, בלי markerPages — זרימה אינה הבדל תוכן', () => {
    const r = run(M([body([L('alpha ב', { y0: 100 })], 0), body([L('beta', { y0: 100 })], 1)]), M([body([L('alpha', { y0: 100 })], 0), body([L('ב beta', { y0: 100 })], 1)]));
    assertEq(r.content.verdict, 'identical', 'verdict'); assertEq(r.content.markerPages, [], 'אין');
  });
  it('markerPages ממוין לפי עמוד — גם כשהסימן בצד אחד בעמוד מאוחר ובצד השני בעמוד מוקדם', () => {
    const r = run(M([P(2, 'body', [L('alpha ב', { y0: 100 })]), P(5, 'body', [L('beta', { y0: 100 })])]), M([P(2, 'body', [L('alpha', { y0: 100 })]), P(5, 'body', [L('beta ג', { y0: 100 })])]));
    assertEq(r.content.markerPages, [{ page: 2, ref: { ב: 1 }, ours: {} }, { page: 5, ref: {}, ours: { ג: 1 } }], 'markerPages');
  });
  it('מילה שנשמטה בגוף ⇒ differs, והמילה מופיעה ב-onlyRef (לא ב-onlyOurs)', () => {
    const r = run(M([body([L('alpha beta gamma delta', { y0: 100 })])]), M([body([L('alpha beta delta', { y0: 100 })])]));
    assertEq(r.content.verdict, 'differs', 'verdict'); assertEq(r.content.byKind.words.onlyRef, [['gamma', 1]], 'חסר'); assertEq(r.content.byKind.words.onlyOurs, [], 'אין עודף');
  });
  it('היפוך-סוג: מילה שנראית כמספר ("לא") שהשבירה הזיזה מסוף שורת TOC לאמצעה אינה הבדל תוכן ⇒ identical, והעמוד rewrap', () => {
    const t = (lines) => P(0, 'toc-general', lines.map((x, k) => L(x, { col: 'single', y0: 100 + 20 * k })));
    const r = run(M([t(['הלכות לא', 'שבת'])]), M([t(['הלכות', 'לא שבת'])]));
    assertEq(r.content.verdict, 'identical', 'verdict'); assertEq(r.pages[0].status, 'rewrap', 'סטטוס עמוד'); assertEq(r.blocks.total, 1, 'הבלוק קיים (שבירה שונה)');
    assertEq(r.blocks.markerDiffBlocks, 0, 'ואינו markerDiff');
  });
});

describe('p67-classify · פרופיל עמודים', () => {
  it('חמשת הסטטוסים, כל אחד בדוגמה משלו: identical · rewrap · numerals · markers · words-moved', () => {
    const ref = M([
      P(0, 'body', [L('alpha beta', { y0: 100 })]),
      P(1, 'body', [L('gamma delta epsilon', { y0: 100 })]),
      P(2, 'toc-general', [L('פרק ל', { col: 'single', y0: 100 })]),
      P(3, 'body', [L('zeta ב', { y0: 100 })]),
      P(4, 'body', [L('eta theta', { y0: 100 })]),
      P(5, 'body', [L('iota', { y0: 100 })])
    ]);
    const ours = M([
      P(0, 'body', [L('alpha beta', { y0: 100 })]),
      P(1, 'body', [L('gamma', { y0: 100 }), L('delta epsilon', { y0: 120 })]),
      P(2, 'toc-general', [L('פרק לא', { col: 'single', y0: 100 })]),
      P(3, 'body', [L('zeta ג', { y0: 100 })]),
      P(4, 'body', [L('eta', { y0: 100 })]),
      P(5, 'body', [L('theta iota', { y0: 100 })])
    ]);
    const r = run(ref, ours);
    assertEq(r.pages.map((p) => p.status), ['identical', 'rewrap', 'numerals', 'markers', 'words-moved', 'words-moved'], 'סטטוסים');
    assertEq(r.pageSummary.statusCounts, { identical: 1, rewrap: 1, numerals: 1, markers: 1, 'words-moved': 2 }, 'ספירות');
    assertEq(r.pageSummary.firstBreakDiffBodyPage, 1, 'שבירה שונה ראשונה בגוף'); assertEq(r.pageSummary.firstWordsMovedBodyPage, 4, 'מילים שזזו ראשונה');
  });
  it('זרימת מילים בין עמודים: סטייה מצטברת, נקודת סנכרון ומקסימום', () => {
    const pg = (i, t) => P(i, 'body', [L(t, { y0: 100 })]);
    const r = run(M([pg(0, 'alpha beta gamma delta'), pg(1, 'epsilon zeta'), pg(2, 'eta theta')]), M([pg(0, 'alpha beta gamma'), pg(1, 'delta epsilon zeta'), pg(2, 'eta theta')]));
    assertEq(r.pages.map((p) => p.status), ['words-moved', 'words-moved', 'identical'], 'סטטוס');
    assertEq(r.pages.map((p) => p.cumDeltaWords), [-1, 0, 0], 'סטייה מצטברת');
    assertEq(r.pageSummary.firstWordsMovedBodyPage, 0, 'ראשון'); assertEq(r.pageSummary.resyncPages, [1], 'סנכרון בעמוד 1'); assertEq(r.pageSummary.maxAbsCumDeltaWords, 1, 'מרבית');
  });
  it('רצף סוגי עמודים שונה בין הצדדים מסומן typeSeqEqual=false', () => {
    const a = M([P(0, 'body', [L('alpha')])]); const b = M([P(0, 'chapter-open', [L('alpha')])]);
    assertEq(run(a, b).reproduction.typeSeqEqual, false, 'שונה'); assertEq(run(a, a).reproduction.typeSeqEqual, true, 'זהה');
  });
  it('זרם המילים: דמיון 1 כשהזרמים זהים גם אם השבירה שונה — בעוד P7 (שורות) < 1', () => {
    const body = (a, b) => M([P(0, 'body', [L(a, { y0: 100 }), L(b, { y0: 120 })])]);
    const r = run(body('alpha beta gamma', 'delta epsilon'), body('alpha beta', 'gamma delta epsilon'));
    assertEq(r.streams.ratio, 1, 'זרם זהה'); assertEq(r.streams.nonEqualOpcodes, 0, 'אין הבדלי זרם'); assert(r.reproduction.p7.ratio < 1, 'אבל P7 (שורות) < 1');
  });
});

describe('p67-classify · טקסונומיית בלוקים (תנועת מילים)', () => {
  const body = (i, lines) => P(i, 'body', lines);
  it('rewrap: אותן מילים בשבירה אחרת באותו טור ⇒ rewrap בלבד', () => {
    const r = run(M([body(0, [L('alpha beta gamma', { y0: 100 }), L('delta epsilon', { y0: 120 })])]), M([body(0, [L('alpha beta', { y0: 100 }), L('gamma delta epsilon', { y0: 120 })])]));
    assertEq(r.blocks.total, 1, 'בלוק יחיד'); assertEq(byClass(r, 'rewrap'), 1, 'rewrap');
    assertEq(r.blocks.firstBody.cls, 'rewrap', 'הבלוק הראשון בגוף'); assertEq([r.blocks.firstBody.unmatchedWords, r.blocks.firstBody.movedWords], [0, 0], 'תנועה');
  });
  it('spill: מילה שחצתה את גבול הטור (ימין→שמאל) כשהטקסט רצוף ⇒ spill; לא boundary ולא rewrap', () => {
    const ref = M([body(0, [L('alpha beta gamma', { y0: 100 }), L('delta epsilon zeta', { ...LEFT, y0: 100 })])]);
    const ours = M([body(0, [L('alpha beta', { y0: 100 }), L('gamma delta epsilon zeta', { ...LEFT, y0: 100 })])]);
    const r = run(ref, ours);
    assertEq(r.blocks.total, 1, 'בלוק יחיד (שתי שורות סמוכות)'); assertEq(byClass(r, 'spill'), 1, 'spill');
    assertEq([byClass(r, 'boundary'), byClass(r, 'rewrap'), byClass(r, 'relocated')], [0, 0, 0], 'אין סוגים אחרים');
  });
  it('spill סימטרי: גם הבלוק שאליו הגיע הטקסט הוא spill (לא rewrap) — קטע של 5 מילים שעבר לעמוד הבא מעל שורה קצרה שלא זזה', () => {
    const ref = M([
      body(0, [L('alpha beta c1 c2 c3 c4 c5', { y0: 100 }), L('gamma delta', { ...LEFT, y0: 100 })]),
      body(1, [L('zeta eta', { y0: 100 })])
    ]);
    const ours = M([
      body(0, [L('alpha beta', { y0: 100 }), L('gamma delta', { ...LEFT, y0: 100 })]),
      body(1, [L('c1 c2 c3 c4 c5 zeta eta', { y0: 100 })])
    ]);
    const r = run(ref, ours);
    assertEq(r.blocks.total, 2, 'שני בלוקים (מקור ויעד; השורה הקצרה באמצע זהה)');
    assertEq(byClass(r, 'spill'), 2, 'שניהם spill'); assertEq(byClass(r, 'rewrap'), 0, 'אף אחד לא rewrap');
  });
  it('boundary: מילה אחת שהוחלפה בין שורות (ללא מקבילה בזרם) ⇒ boundary עם 2 מילים בלי מקבילה', () => {
    const mk = (l1, l2) => M([body(0, [L(l1, { y0: 100 }), L(l2, { y0: 120 })])]);
    const r = run(mk('alpha beta x1', 'y1 gamma delta'), mk('alpha beta y1', 'x1 gamma delta'));
    assertEq(r.blocks.total, 1, 'בלוק יחיד'); assertEq(byClass(r, 'boundary'), 1, 'boundary'); assertEq(r.blocks.firstBody.unmatchedWords, 2, 'מילים בלי מקבילה (אחת בכל צד)');
  });
  it('גבול boundary/relocated: בדיוק BOUNDARY_WORDS מילים בלי מקבילה ⇒ boundary; אחת-ועוד (כאן 2 נוספות) ⇒ relocated', () => {
    // קטעים: X (13 מילים) נשאר ביישור; Y מוחלף. מילים בלי מקבילה = 2·|Y| (אחת בכל צד).
    const mk = (y) => {
      const refLines = [L(`alpha beta ${W('x', 13)}`, { y0: 100 }), L(`${W('y', y)} gamma delta`, { y0: 120 })];
      const oursLines = [L(`alpha beta ${W('y', y)}`, { y0: 100 }), L(`${W('x', 13)} gamma delta`, { y0: 120 })];
      return run(M([body(0, refLines)]), M([body(0, oursLines)]));
    };
    const half = T.BOUNDARY_WORDS / 2;
    const at = mk(half), over = mk(half + 1);
    assertEq(at.blocks.firstBody.unmatchedWords, T.BOUNDARY_WORDS, 'בדיוק הגבול'); assertEq(byClass(at, 'boundary'), 1, 'boundary בגבול'); assertEq(byClass(at, 'relocated'), 0, 'לא relocated בגבול');
    assertEq(over.blocks.firstBody.unmatchedWords, T.BOUNDARY_WORDS + 2, 'מעל הגבול'); assertEq(byClass(over, 'relocated'), 1, 'relocated מעל'); assertEq(byClass(over, 'boundary'), 0, 'לא boundary מעל');
  });
  it('סימן-הערה שהתחלף (ב→ג) אינו נספר כמילה בלי מקבילה: הבלוק rewrap עם markerDiff — לא boundary', () => {
    const r = run(M([body(0, [L('alpha beta ב', { y0: 100 })])]), M([body(0, [L('alpha beta ג', { y0: 100 })])]));
    assertEq(r.blocks.total, 1, 'בלוק יחיד'); assertEq(byClass(r, 'rewrap'), 1, 'rewrap'); assertEq(byClass(r, 'boundary'), 0, 'לא boundary');
    assertEq(r.blocks.markerDiffBlocks, 1, 'ספירת בלוקים עם הבדל סימנים'); assertEq(r.blocks.firstBody.markerDiff, true, 'markerDiff');
    const plain = run(M([body(0, [L('alpha beta gamma', { y0: 100 }), L('delta', { y0: 120 })])]), M([body(0, [L('alpha beta', { y0: 100 }), L('gamma delta', { y0: 120 })])]));
    assertEq([plain.blocks.markerDiffBlocks, plain.blocks.firstBody.markerDiff], [0, false], 'בקרה: בלי סימנים — אין markerDiff');
  });
  it('numeral: בלוק TOC שרק מספר-העמוד בו שונה; בקרה — אותו הבדל בגוף, או הבדל מילים ב-TOC, אינם numeral', () => {
    const toc = (n) => P(0, 'toc-general', [L(`פרק ראשון ${n}`, { col: 'single', y0: 100 })]);
    assertEq(byClass(run(M([toc('ל')]), M([toc('לא')])), 'numeral'), 1, 'numeral ב-TOC');
    assertEq(byClass(run(M([body(0, [L('פרק ראשון ל', { y0: 100 })])]), M([body(0, [L('פרק ראשון לא', { y0: 100 })])])), 'numeral'), 0, 'בגוף — לא numeral');
    const r3 = run(M([P(0, 'toc-general', [L('פרק ראשון ל', { col: 'single' })])]), M([P(0, 'toc-general', [L('פרק אחר לגמרי ל', { col: 'single' })])]));
    assertEq(byClass(r3, 'numeral'), 0, 'מילים אחרות ב-TOC אינן numeral');
    const r4 = run(M([P(0, 'toc-general', [L('פרק ב ראשון ל', { col: 'single' })])]), M([P(0, 'toc-general', [L('פרק ג ראשון לא', { col: 'single' })])]));
    assertEq(byClass(r4, 'numeral'), 0, 'סימן שונה באמצע שורת TOC לצד מספר שונה — אינו numeral'); assertEq(r4.blocks.markerDiffBlocks, 1, 'אך מסומן markerDiff');
    const r5 = run(M([P(0, 'toc-general', [L('פרק ראשון ל', { col: 'single' })])]), M([P(0, 'toc-general', [L('פרק אחר לא', { col: 'single' })])]));
    assertEq(byClass(r5, 'numeral'), 0, 'מילה שונה לצד מספר שונה — אינו numeral (המילה לא "מוסברת" במספר)');
  });
  it('בלוק מעורב (סוף TOC + תחילת גוף) עם מספר-עמוד שונה: המספר אינו נספר כמילה בלי מקבילה ⇒ rewrap, לא boundary', () => {
    const mk = (n, l1, l2) => M([P(0, 'toc-general', [L(`פרק ראשון ${n}`, { col: 'single', y0: 100 })]), body(1, [L(l1, { y0: 100 }), L(l2, { y0: 120 })])]);
    const r = run(mk('ל', 'alpha beta gamma', 'delta'), mk('לא', 'alpha beta', 'gamma delta'));
    assertEq(r.blocks.total, 1, 'בלוק יחיד'); assertEq(byClass(r, 'rewrap'), 1, 'rewrap'); assertEq(r.blocks.firstBody.unmatchedWords, 0, 'אין מילים בלי מקבילה');
  });
  it('בלוק הוספה בלבד (RED הוסיף שורת גוף) נמצא כ"בלוק הגוף הראשון" — גם כשאין שורות ייחוס בבלוק', () => {
    const r = run(M([body(0, [L('alpha beta', { y0: 100 })])]), M([body(0, [L('alpha beta', { y0: 100 }), L('extra words here', { y0: 120 })])]));
    assertEq(r.blocks.total, 1, 'בלוק יחיד'); assert(r.blocks.firstBody && r.blocks.firstBody.tag === 'insert', `firstBody: ${JSON.stringify(r.blocks.firstBody && r.blocks.firstBody.tag)}`);
  });
  it('numeral נקבע לפי סוג העמוד **של כל צד**: כש-RED מוסיף עמוד לפני ה-TOC, אינדקס העמוד זז אך הבלוק עדיין numeral', () => {
    const ref = M([body(0, [L('alpha beta', { y0: 100 })]), body(1, [L('gamma delta', { y0: 100 })]), P(2, 'toc-general', [L('פרק ראשון ל', { col: 'single' })])]);
    const ours = M([body(0, [L('alpha beta', { y0: 100 })]), body(1, [L('extra', { y0: 100 })]), body(2, [L('gamma delta', { y0: 100 })]), P(3, 'toc-general', [L('פרק ראשון לא', { col: 'single' })])]);
    const r = run(ref, ours);
    assertEq(byClass(r, 'numeral'), 1, 'numeral למרות הסטת האינדקס');
  });
  it('title-page: שבירה שונה בעמוד שער; בקרה — אותה שבירה בעמוד גוף אינה title-page', () => {
    const gate = (lines) => P(0, 'shaar-sub', lines.map((t, i) => L(t, { col: 'none', y0: 100 + 40 * i })));
    const r = run(M([gate(['הקדמות וכללים'])]), M([gate(['הקדמות', 'וכללים'])]));
    assertEq(byClass(r, 'title-page'), 1, 'title-page'); assertEq(r.pages[0].status, 'rewrap', 'אותן מילים');
    const bodyPg = (lines) => P(0, 'body', lines.map((t, i) => L(t, { y0: 100 + 40 * i })));
    assertEq(byClass(run(M([bodyPg(['הקדמות וכללים'])]), M([bodyPg(['הקדמות', 'וכללים'])])), 'title-page'), 0, 'בגוף אין title-page');
  });
});

describe('p67-classify · מפקד רווח-התאמה (FIT_EPS)', () => {
  const W0 = 269.4;
  const cols = [{ name: 'right', x0: 302.71, x1: 504.77 }, { name: 'left', x0: 90, x1: 292.06 }];
  const refWith = (lines) => M([P(5, 'body', lines, cols)]);
  const J = (n, o = {}) => L('x'.repeat(n), { justified: true, ...o });
  it('רוחב הטור נגזר מהגיאומטריה של הייחוס (x1−x0)/0.75, חציון', () => {
    assertEq(T.bodyColumnPx(refWith([])), 269.41, 'רוחב'); // (504.77−302.71)/0.75 = 269.41
  });
  it('רוחב הטור נלקח מעמודי גוף בלבד — עמוד TOC עם טור רחב אינו משפיע על החציון', () => {
    const mix = M([P(5, 'body', [], cols), P(6, 'toc-general', [], [{ name: 'single', x0: 100, x1: 500 }, { name: 'x', x0: 100, x1: 500 }])]);
    assertEq(T.bodyColumnPx(mix), 269.41, 'רוחב');
  });
  it('תחומי רווח: [0,eps) בתחום; ≥eps מחוץ; שלילי קטן נספר בנפרד; שלילי גדול = ארטיפקט מוחרג', () => {
    const lines = [J(26, { y0: 100 }), J(27, { y0: 120 }), L('x'.repeat(26) + 'ab', { y0: 140, justified: true }), J(26, { y0: 160 })];
    const c = T.fitCensus(refWith(lines), (t) => (t.length === 26 ? 268.9 : t.length === 27 ? 270 : 280), { eps: 0.75, width: W0 });
    // 268.9 ⇒ רווח 0.5 (בתחום) לשתי השורות באורך 26; 270 ⇒ −0.6; 280 ⇒ ארטיפקט
    assertEq([c.candidates, c.unreliable, c.reliable, c.inBand], [4, 1, 3, 2], 'ספירות');
    assertEq(c.firstInBand.y, 100, 'הראשונה בסדר קריאה'); assertEq(c.firstInBand.slackPx, 0.5, 'רווח');
    assertEq(c.histogram.reduce((s, h) => s + h.lines, 0), 4, 'ההיסטוגרמה מכסה את כל המועמדות');
  });
  it('גבולות: רווח בדיוק eps אינו בתחום; בדיוק 0 בתחום; −artifactPx בדיוק אינו ארטיפקט', () => {
    const mk = (slack) => T.fitCensus(refWith([J(5, { y0: 100 })]), () => W0 - slack, { eps: 0.75, width: W0 });
    assertEq(mk(0.75).inBand, 0, 'eps בדיוק'); assertEq(mk(0).inBand, 1, '0 בדיוק'); assertEq(mk(-1).unreliable, 0, '−1 בדיוק אינו ארטיפקט');
    assertEq(mk(-1.0001).unreliable, 1, 'מתחת ל-−1'); assertEq(mk(0.7499).inBand, 1, 'ממש מתחת ל-eps');
  });
  it('מסננים: לא-מוצדקת, גופן/גודל אחר, טור יחיד, רוחב קצר, ועמוד שאינו גוף — אינם מועמדות', () => {
    const lines = [
      J(5, { y0: 100 }), J(5, { y0: 120, justified: false }), J(5, { y0: 140, font: 'Other' }), J(5, { y0: 160, size: 10 }),
      J(5, { y0: 180, col: 'single' }), J(5, { y0: 200, x1: 400 }), J(5, { y0: 220, col: 'left', x0: 90, x1: 292 })
    ];
    const c = T.fitCensus(M([P(5, 'body', lines, cols), P(6, 'toc-general', [J(5, { y0: 100 })], cols)]), () => 100, { eps: 0.75, width: W0 });
    assertEq(c.candidates, 2, 'רק שתי שורות עומדות בכל התנאים (ימין ושמאל)');
  });
  it('עיגון על נתונים אמיתיים: מדידת המנוע לשורת ההפער הראשון בייחוס (עמ׳ 11, y=464.4) — כ-268.67px, בתוך הרווח', () => {
    const measureReal = T.engineMeasure(REPO_ROOT);
    assert(typeof measureReal === 'function', 'המדידה אמורה להיות זמינה בעץ המאגר (גופן Guttman Rashi + measure-api)');
    const w = measureReal('.גדרים. א. בדבר הנשבת. ב. בדבר ממנו שובתים');
    assert(Math.abs(w - 268.672) < 0.05, `רוחב ${w} — סטייה גדולה: או שחיווט המדידה (גופן/גודל) שונה, או שהמדידה השתנתה ויש לרענן את audits/p67`);
    const eps = T.engineFitEps(REPO_ROOT);
    assert(Number.isFinite(eps) && eps >= 0 && eps < 3, `FIT_EPS נקרא מהקוד: ${eps}`);
    const ref = JSON.parse(fs.readFileSync(REF_FILE, 'utf8'));
    assert(Math.abs(T.bodyColumnPx(ref) - 269.41) < 0.005, `רוחב טור הגוף בייחוס: ${T.bodyColumnPx(ref)}`);
    const c = T.fitCensus(ref, measureReal, { eps: 0.75 });
    assert(c.firstInBand && c.firstInBand.page === 11 && c.firstInBand.col === 'right' && c.firstInBand.slackPx > 0 && c.firstInBand.slackPx < 0.75, `השורה הראשונה בתחום: ${JSON.stringify(c.firstInBand)}`);
    assert(c.reliable > 2000 && c.unreliable < c.candidates * 0.05, `מדגם אמין: ${c.reliable} מהימנות, ${c.unreliable} הוחרגו`);
  });
});

describe('p67-classify · ניסוי נגדי (העתק זמני)', () => {
  const flow = path.join(REPO_ROOT, 'red-build/src/engine/layout/legacy-imud-flow.js');
  const text = path.join(REPO_ROOT, 'audits/no_long_test_text.txt');
  const tmpDirs = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('p67-exp-')).sort();
  let cache = null;
  /** מריץ פעם אחת (≈10 שנ׳): בקרה באותו ערך כמו במנוע, ניסוי עם 0, והרצה ישירה של המנוע הלא-משונה להשוואת hash. */
  const experiment = () => {
    if (cache) return cache;
    const before = { sha: sha(flow), tmp: tmpDirs() };
    const engineEps = T.engineFitEps(REPO_ROOT);
    const ref = JSON.parse(fs.readFileSync(REF_FILE, 'utf8'));
    const runs = T.runFitEpsExperiment(REPO_ROOT, [engineEps, 0], text, ref);
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p67-direct-'));
    const direct = spawnSync(process.execPath, [path.join(REPO_ROOT, 'tools/layout-parity/run-ours.js'), text, outDir], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    const directModelPath = path.join(outDir, 'ours-model.json');
    const directModel = direct.status === 0 ? JSON.parse(fs.readFileSync(directModelPath, 'utf8')) : null;
    process.on('exit', () => { try { fs.rmSync(outDir, { recursive: true, force: true }); } catch (e) { /* best effort */ } });
    cache = { before, engineEps, runs, directStatus: direct.status, directHash: directModel && directModel.meta.layoutHash, directPagesSha: directModel && T.pagesSha256(directModel), directModelPath, after: { sha: sha(flow), tmp: tmpDirs() } };
    return cache;
  };
  it('rewriteFitEps: מחליף רק את הקבוע; נכשל כשהתבנית נעלמה (אחרת הניסוי רץ על מנוע לא-משונה וטוען שמדד)', () => {
    const src = 'a\nconst FIT_EPS = 0.75; // x\nconst B = 1;\n';
    assertEq(T.rewriteFitEps(src, 0), 'a\nconst FIT_EPS = 0; // x\nconst B = 1;\n', 'החלפה');
    assertEq(T.rewriteFitEps(src, 0.4).includes('const FIT_EPS = 0.4;'), true, '0.4');
    let threw = false; try { T.rewriteFitEps('const OTHER = 1;', 0); } catch (e) { threw = /FIT_EPS/.test(e.message); }
    assert(threw, 'תבנית חסרה חייבת להכשיל');
  });
  it('ה-knob מחווט: eps=0 ⇒ layoutHash שונה מהבקרה, ויחס P7 משתנה', () => {
    const { runs } = experiment();
    assertEq(runs.length, 2, 'שתי ריצות');
    assert(runs[0].layoutHash !== runs[1].layoutHash, `אותו hash לשני ערכי eps — הניסוי לא שינה כלום: ${runs[0].layoutHash}`);
    assert(runs[0].p7.ratio !== runs[1].p7.ratio, 'יחס P7 צריך להשתנות עם ה-knob');
  });
  it('הבקרה נאמנה: אותו ערך כמו במנוע ⇒ אותו layoutHash כמו הרצה ישירה של המנוע הלא-משונה (ההעתק הזמני אינו משנה כלום מלבד ה-knob)', () => {
    const { runs, directStatus, directHash, engineEps } = experiment();
    assertEq(directStatus, 0, 'הרצה ישירה של run-ours.js');
    assertEq(runs[0].eps, engineEps, 'הבקרה רצה עם הערך של המנוע'); assertEq(runs[0].layoutHash, directHash, 'hash הבקרה = hash המנוע');
  });
  it('טביעת העמודים: הבקרה זהה להרצה הישירה (כל השורות והקואורדינטות, כולל עמודי שער), והריצה עם eps=0 שונה', () => {
    const { runs, directPagesSha } = experiment();
    assert(/^[0-9a-f]{64}$/.test(directPagesSha), 'טביעה תקינה'); assertEq(runs[0].pagesSha256, directPagesSha, 'בקרה = ישיר'); assert(runs[1].pagesSha256 !== directPagesSha, 'eps=0 משנה עמודים');
  });
  it('ה-knob משנה פריסה בלבד: ספירת המילים (סוג "מילה") זהה בין הערכים', () => {
    const { runs } = experiment();
    assertEq(runs[0].wordsDiff, runs[1].wordsDiff, 'הבדלי מילים מול הייחוס זהים בשתי הריצות');
  });
  it('parseSettingScenarios: תרחיש לכל מקטע ";", זוגות "," וטיפוסי ערכים (מספר/בוליאני/מחרוזת); זוג שגוי נכשל', () => {
    assertEq(T.parseSettingScenarios('fn-reset-mode=page;a=1,b=true,c=x'), [{ 'fn-reset-mode': 'page' }, { a: 1, b: true, c: 'x' }], 'ניתוח');
    assertEq(T.parseSettingScenarios(' ; '), [], 'ריק');
    let threw = false; try { T.parseSettingScenarios('novalue'); } catch (e) { threw = /key=value/.test(e.message); }
    assert(threw, 'זוג בלי = חייב להיכשל');
  });
  it('injectSettings: מזריק את הדריסות בסוף אובייקט ההגדרות של ה-harness (הן מנצחות); נכשל כשהעוגן נעלם', () => {
    const real = fs.readFileSync(path.join(REPO_ROOT, 'tools/layout-parity/run-ours.js'), 'utf8');
    const out = T.injectSettings(real, { 'fn-reset-mode': 'page' });
    assert(/'measure-impl': 'font-metrics',\n\s+\.\.\.\{"fn-reset-mode":"page"\}\n  \};/.test(out), 'ההזרקה בסוף האובייקט');
    assertEq(out.length > real.length, true, 'נוסף טקסט');
    let threw = false; try { T.injectSettings('const settings = {};', { a: 1 }); } catch (e) { threw = /עוגן/.test(e.message); }
    assert(threw, 'עוגן חסר חייב להכשיל (אחרת הניסוי רץ בלי הדריסה וטוען שמדד)');
  });
  it('knownSettingIds כולל מזהי רישום וגם מפתחות IMUD היסטוריים שהנתיב החי קורא ישירות (fn-reset-mode)', () => {
    const ids = T.knownSettingIds(REPO_ROOT);
    assert(ids && ids.has('footnote-reset-policy') && ids.has('fn-reset-mode'), 'מזהים חסרים');
    assert(!ids.has('no-such-setting-xyz'), 'מזהה שגוי');
  });
  it('injectSettings: מפתחות imud.* מוזרקים ל-settings._imudRaw (אחרי אובייקט ההגדרות, מעל הקיים); שאר המפתחות נשארים באובייקט', () => {
    const real = fs.readFileSync(path.join(REPO_ROOT, 'tools/layout-parity/run-ours.js'), 'utf8');
    const count = (str) => str.split('settings._imudRaw = {').length - 1;
    const mixed = T.injectSettings(real, { 'fn-reset-mode': 'page', 'imud.s-h1': 36 });
    assert(/\.\.\.\{"fn-reset-mode":"page"\}\n  \};\n  settings\._imudRaw = \{ \.\.\.\(settings\._imudRaw \|\| \{\}\), \.\.\.\{"s-h1":36\} \};/.test(mixed), 'מעורב: למעלה בלי הקידומת, מתחת _imudRaw בלי הקידומת');
    assertEq(count(mixed), count(real) + 1, 'הצהרת _imudRaw אחת');
    const only = T.injectSettings(real, { 'imud.s-h1': '36', 'imud.s-sh-sub': 16 });
    assert(/\.\.\.\{\}\n  \};\n  settings\._imudRaw = .*"s-h1":"36","s-sh-sub":16/.test(only), 'רק imud.*: האובייקט העליון ריק');
    assertEq(count(T.injectSettings(real, { a: 1 })), count(real), 'בלי imud.* אין הצהרת _imudRaw');
    assertEq(T.IMUD_PREFIX, 'imud.', 'הקידומת');
  });
  it('knownImudKeys/unknownSettingKeys: imud.* נבדק מול מפתחות ה-IMUD הגולמיים בלבד; שאר השמות מול הרישום+IMUD; שם שגוי נחשף', () => {
    const raw = T.knownImudKeys(REPO_ROOT);
    assert(raw && raw.has('s-h1') && raw.has('s-sh-sub') && raw.has('fn-reset-mode') && !raw.has('footnote-reset-policy'), 'מפתחות IMUD גולמיים');
    assertEq(T.unknownSettingKeys(REPO_ROOT, [{ 'fn-reset-mode': 'page' }, { 'imud.s-h1': 36, 'footnote-reset-policy': 'page' }]), [], 'כולם מוכרים');
    assertEq(T.unknownSettingKeys(REPO_ROOT, [{ 'imud.no-such-key': 1 }, { 'imud.no-such-key': 2, 'no-such-setting-xyz': 1 }, { 'imud.footnote-reset-policy': 'page' }]), ['imud.no-such-key', 'no-such-setting-xyz', 'imud.footnote-reset-policy'], 'שגויים (פעם אחת כל אחד): מפתח imud לא קיים, שם לא קיים, מזהה רישום בקידומת imud (לא מפתח גולמי)');
    assertEq(T.unknownSettingKeys(path.join(os.tmpdir(), 'p67-no-such-root-xyz'), [{ a: 1, 'imud.b': 2 }]), [], 'אין קובצי הגדרות בשורש ⇒ אין מול מה לאמת (לא חוסם)');
  });
  let settingCache = null;
  const settingExperiment = () => settingCache || (settingCache = T.runSettingExperiment(REPO_ROOT, [{ 'fn-reset-mode': 'siman' }, { 'fn-reset-mode': 'page' }], text, JSON.parse(fs.readFileSync(REF_FILE, 'utf8'))));
  it('ניסוי הגדרה: דריסה משנה את הפריסה (hash שונה) וה-harness מקבל אותה; מילים (סוג "מילה") ללא שינוי', () => {
    const [siman, page] = settingExperiment();
    assert(siman.layoutHash !== page.layoutHash, `אותו hash לשתי ההגדרות — הדריסה לא הגיעה למנוע: ${siman.layoutHash}`);
    assertEq(siman.wordsDiff, page.wordsDiff, 'הבדלי מילים זהים בשתי ההגדרות — ההגדרה משפיעה על סימנים/פריסה בלבד');
    assert(siman.markersDiff !== page.markersDiff, `הכלי אמור לזהות שמדיניות איפוס ההערות משנה את סימני ההערה: ${siman.markersDiff} מול ${page.markersDiff}`);
  });
  let gateCache = null;
  const gateExperiment = () => gateCache || (gateCache = T.runSettingExperiment(REPO_ROOT, [{ 'imud.s-h1': 50 }, { 'imud.s-h1': 36 }, { 'imud.s-h1': 36, 'imud.s-sh-sub': 16 }], text, JSON.parse(fs.readFileSync(REF_FILE, 'utf8'))));
  it('מפתח imud.s-h1 מחווט (קריאה מ-_imudRaw): ברירת המחדל 50 ⇒ עמודים זהים להרצה הישירה; 36 ⇒ עמודי שער שונים ובלוק title-page מתכווץ', () => {
    const { directPagesSha } = experiment();
    const [def, h36] = gateExperiment();
    assertEq(def.pagesSha256, directPagesSha, 'imud.s-h1=50 הוא ברירת המחדל ⇒ בקרה: אין שינוי בעמודים');
    assert(h36.pagesSha256 !== directPagesSha, 'imud.s-h1=36 חייב לשנות את עמוד השער (אחרת המפתח לא הגיע למנוע)');
    const t = (r) => r.blocksByClass['title-page'];
    assert(t(def) && t(h36) && t(h36).oursLines < t(def).oursLines && t(h36).refLines < t(def).refLines, `בלוק title-page אמור להצטמצם: ${JSON.stringify(t(def))} → ${JSON.stringify(t(h36))}`);
  });
  it('שער + כותרת-משנה קטנה (imud.s-h1=36, imud.s-sh-sub=16): בלוק title-page נעלם וסטטוס עמוד אחד עולה ל-identical — הבלוק מוסבר כולו בשני גדלי השער', () => {
    const [def, , both] = gateExperiment();
    assert(!both.blocksByClass['title-page'], `אין בלוק title-page: ${JSON.stringify(both.blocksByClass['title-page'])}`);
    assertEq(both.pageStatusCounts.identical, def.pageStatusCounts.identical + 1, 'עמוד זהה נוסף');
    assertEq(both.wordsDiff, def.wordsDiff, 'ללא שינוי במילים'); assertEq(both.markersDiff, def.markersDiff, 'ללא שינוי בסימנים');
    assert(both.p7.nonEqualBlocks === def.p7.nonEqualBlocks - 1, 'בלוק אחד פחות');
  });
  it('CLI --experiment-setting: ריצה שלא שינתה כלום מסומנת "עמודים=קלט" (samePagesAsInput) והשאר לא; הקלט נושא טביעת עמודים', () => {
    const { directModelPath, directPagesSha } = experiment();
    const jf = path.join(path.dirname(directModelPath), 'cli-exp.json');
    const r = spawnSync(process.execPath, [TOOL, '--ref', REF_FILE, '--ours', directModelPath, '--no-measure', '--text', text, '--experiment-setting', 'imud.s-h1=50;imud.s-h1=36', '--json', jf], { encoding: 'utf8', maxBuffer: 1 << 26 });
    assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
    const j = JSON.parse(fs.readFileSync(jf, 'utf8'));
    assertEq(j.inputs.oursPagesSha256, directPagesSha, 'טביעת הקלט');
    const runs = j.experiments[0].runs;
    assertEq(runs.map((x) => x.samePagesAsInput), [true, false], 'בקרה=קלט, 36=שונה');
    assertEq((r.stdout.match(/עמודים=קלט/g) || []).length, 1, 'הסימון מופיע פעם אחת בלבד בפלט');
  });
  it('הריפו לא נכתב וספריות הניסוי נמחקו', () => {
    gateExperiment();
    settingExperiment();
    const { before, after } = experiment();
    assertEq(sha(flow), before.sha, 'legacy-imud-flow.js ללא שינוי'); assertEq(tmpDirs(), before.tmp, 'ספריות זמניות');
    assertEq(after.sha, before.sha, 'ובסיום הניסוי הראשון');
  });
});

describe('p67-classify · CLI', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p67-cli-'));
  process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* best effort */ } });
  const refF = path.join(tmp, 'ref.json'), oursF = path.join(tmp, 'ours.json'), jsonF = path.join(tmp, 'out.json'), repF = path.join(tmp, 'rep.json');
  const body = (lines) => P(0, 'body', lines);
  const ref = M([body([L('alpha beta gamma', { y0: 100 }), L('delta epsilon', { y0: 120 })])], [{ head: 'alpha beta gamma', lines: 2, words: 5 }]);
  const ours = M([body([L('alpha beta', { y0: 100 }), L('gamma delta epsilon', { y0: 120 })])], [{ head: 'alpha beta', lines: 2, words: 5 }]);
  fs.writeFileSync(refF, JSON.stringify(ref)); fs.writeFileSync(oursF, JSON.stringify(ours));
  const cli = (args) => spawnSync(process.execPath, [TOOL, '--ref', refF, '--ours', oursF, '--no-measure', ...args], { encoding: 'utf8' });
  it('ריצה תקינה: קוד 0, שורת תוכן, קובץ JSON עם סכמה ועם קלטים מוטבעים בחתימה', () => {
    const r = cli(['--json', jsonF]);
    assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert(/תוכן: identical/.test(r.stdout) && /מפקד רווח-התאמה: לא זמין/.test(r.stdout), r.stdout);
    const j = JSON.parse(fs.readFileSync(jsonF, 'utf8'));
    assertEq(j.schema, T.SCHEMA, 'סכמה'); assertEq(j.inputs.refSha256, sha(refF), 'חתימת ייחוס'); assertEq(j.inputs.oursSha256, sha(oursF), 'חתימת RED');
    assertEq(j.fit.available, false, 'בלי מדידה'); assertEq(j.blocks.total, j.reproduction.p7.nonEqualBlocks, 'עקביות סה"כ בלוקים');
    assertEq(Object.keys(j.content.byKind), ['words', 'markers', 'tocNumerals'], 'סוגי אסימונים בפלט');
  });
  it('--parity-report: דוח עקבי ⇒ קוד 0; דוח שהוסט (יחס/ספירה) ⇒ קוד 3 עם שם השדה (בקרה שלילית לשומר)', () => {
    cli(['--json', jsonF]);
    const base = JSON.parse(fs.readFileSync(jsonF, 'utf8'));
    const mkRep = (mut) => {
      const p7 = { id: 'P7', ...base.reproduction.p7 }; const p6 = { id: 'P6', ...base.reproduction.p6 }; mut(p7, p6);
      fs.writeFileSync(repF, JSON.stringify({ checks: [p7, p6] }));
    };
    mkRep(() => {});
    const ok = cli(['--parity-report', repF]); assertEq(ok.status, 0, `${ok.stdout}\n${ok.stderr}`); assert(/זהים ✓/.test(ok.stdout), ok.stdout);
    mkRep((p7) => { p7.ratio = 0.5; });
    const bad = cli(['--parity-report', repF]); assertEq(bad.status, 3, 'יחס שהוסט'); assert(/P7\.ratio/.test(bad.stderr), bad.stderr);
    mkRep((p7, p6) => { p6.wordsMatch += 1; });
    const bad2 = cli(['--parity-report', repF]); assertEq(bad2.status, 3, 'ספירת P6 שהוסטה'); assert(/P6\.wordsMatch/.test(bad2.stderr), bad2.stderr);
    fs.writeFileSync(repF, JSON.stringify({ checks: [] }));
    assertEq(cli(['--parity-report', repF]).status, 3, 'דוח בלי P6/P7');
  });
  it('שגיאות קלט: מודל RED חסר ⇒ קוד 2 עם הוראת הפקה; ניסוי עם ערך לא-מספרי ⇒ קוד 2', () => {
    const missing = spawnSync(process.execPath, [TOOL, '--ref', refF, '--ours', path.join(tmp, 'nope.json')], { encoding: 'utf8' });
    assertEq(missing.status, 2, 'חסר'); assert(/run-ours\.js/.test(missing.stderr), missing.stderr);
    assertEq(cli(['--experiment-fit-eps', 'abc']).status, 2, 'ניסוי שגוי');
    const unk = cli(['--experiment-setting', 'no-such-setting-xyz=1']); assertEq(unk.status, 2, 'הגדרה לא מוכרת'); assert(/no-such-setting-xyz/.test(unk.stderr), unk.stderr);
    assertEq(cli(['--experiment-setting', 'novalue']).status, 2, 'זוג בלי =');
    const unkRaw = cli(['--experiment-setting', 'imud.no-such-key=1']); assertEq(unkRaw.status, 2, 'מפתח imud לא מוכר'); assert(/imud\.no-such-key/.test(unkRaw.stderr), unkRaw.stderr);
  });
  it('אינו כותב לעץ: חתימות הקלטים (והייחוס הנשמר במאגר) ללא שינוי אחרי ריצה', () => {
    const h = [sha(refF), sha(oursF), sha(REF_FILE)];
    cli(['--json', jsonF]);
    assertEq([sha(refF), sha(oursF), sha(REF_FILE)], h, 'קלטים');
  });
});

report('p67-classify-tool');
