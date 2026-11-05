// tests/e2e/audit-sensitivity.test.js — **S5.2:** הוכחת רגישות האודיטים (עקרון הבודקים)
'use strict';

/**
 * **S5.2 — הבדיקה החשובה ביותר בערכה:** כל גלאי באודיט הוא טענה "אני תופס את זה".
 * עד כאן הטענות היו הבטחות — אודיט ירוק יכול היה להיות עיוור (false-green: הסקירה
 * האדברסריאלית מצאה 9 משפחות בדיקות שקטות). כאן הליבה הטהורה של full-math-audit
 * (finalizeChecks על pageData שנאסף) מופעלת ב-Node על מבחנות עם ליקויים **ידועים
 * מראש** — וכל גלאי חייב לירות בדיוק בקוד שלו. נקי ⇒ 0 בעיות.
 *
 * מבנה pageData מתועד בראש full-math-audit.js; הדבק הדפדפן אוסף אותו מה-DOM החי
 * ולכן החוזה כאן הוא אותו חוזה של הריצה האמיתית — לא העתק.
 */
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { createFullMathAudit } = require(path.join(__dirname, '..', '..', '..', 'tools', 'layout-audit', 'full-math-audit.js'));
const audit = createFullMathAudit();

// ── בונה מבחנה שלמה (ספר מיני תקין לפי מכונת המצבים של המודל) ──
const PW = 793.7, PH = 1122.5;
const COL_W = 269.41, COL_R_X = 524.29, COL_L_X = 241.4, FLOW_TOP = 107.2, LINE_H = 21.44;

function mkLine(over) {
  const o = over || {};
  const x = o.x != null ? o.x : COL_R_X;
  const w = o.w != null ? o.w : COL_W;
  const y = o.y != null ? o.y : FLOW_TOP;
  const h = o.h != null ? o.h : LINE_H;
  return Object.assign({
    y, h, x, w,
    last: false, head: false, winWrap: false, custom: false,
    ink: { x, y, r: x + w, b: y + h },
    wrapSpread: 0, spanWraps: [],
    style: { ta: 'justify', tal: 'justify', ws: 'normal', fs: 16, fam: '"Guttman Rashi"', dir: 'rtl' },
    words: 5, window: null, markers: [], token: 't1',
    text: 'שורת גוף תקינה לחלוטין למבחן הרגישות'
  }, o);
}

function mkPage(over) {
  const line = (y, x) => mkLine({ y, x: x == null ? COL_R_X : x });
  return Object.assign({
    i: 0, t: 'regular', pw: PW, ph: PH,
    header: { text: 'כותרת עליונה', top: 52, bottom: 74 },
    folio: { text: 'א׳', top: 1040.5, bottom: 1058.5 },
    gates: 0,
    cols: [
      { x: COL_R_X, y: FLOW_TOP, w: COL_W, h: 915, lines: [line(FLOW_TOP), line(FLOW_TOP + LINE_H), line(FLOW_TOP + 2 * LINE_H)] },
      { x: COL_L_X, y: FLOW_TOP, w: COL_W, h: 915, lines: [line(FLOW_TOP, COL_L_X), line(FLOW_TOP + LINE_H, COL_L_X), line(FLOW_TOP + 2 * LINE_H, COL_L_X)] }
    ],
    bands: [], tocRows: [], tocInContainer: false,
    fns: [], fnAreaN: 0, fnRuleN: 0, words: 30, lines: 6
  }, over || {});
}

/** הזזת שורה ודיו שלה יחד (לזריקת מומים גיאומטריים בלי אזעקות שווא). */
function shiftLine(l, dy) { l.y += dy; if (l.ink) { l.ink.y += dy; l.ink.b += dy; } }

/** ספר המבחן הנקי: שער ראשי→אחורי→תוכן-עניינים→שער-משנה→גוף — כמו SHAAR_ORDER. */
function cleanBook() {
  return [
    mkPage({ i: 0, t: 'shaar-main', header: null, folio: null, gates: 5, cols: [{ x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }, { x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }], bands: [{ cls: 'band band--gate', x: 56.7, y: 300, w: 680, h: 30, align: 'center', text: 'שער ראשי', ink: { x: 346.7, y: 305, r: 446.7, b: 325 } }], words: 2 }),
    mkPage({ i: 1, t: 'shaar-back', header: null, folio: null, cols: [{ x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }, { x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }], words: 0 }),
    mkPage({ i: 2, t: 'toc-general', folio: { text: 'א׳', top: 1040.5, bottom: 1058.5 }, cols: [{ x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }, { x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }], tocRows: [{ x: 66.1, y: 370.7, w: 494, h: 26, text: 'כותרת 1 - חלק ראשון' }, { x: 66.1, y: 500, w: 494, h: 26, text: 'כותרת 2 - חלק שני' }], words: 8 }),
    mkPage({ i: 3, t: 'shaar-sub', header: null, folio: null, gates: 2, cols: [{ x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }, { x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }], bands: [{ cls: 'band band--gate', x: 56.7, y: 300, w: 680, h: 30, align: 'center', text: 'חלק ראשון', ink: { x: 346.7, y: 305, r: 446.7, b: 325 } }], words: 2 }),
    mkPage({ i: 4, t: 'regular', folio: { text: 'ב׳', top: 1040.5, bottom: 1058.5 }, words: 30, lines: 6 }),
    mkPage({ i: 5, t: 'regular', folio: { text: 'ג׳', top: 1040.5, bottom: 1058.5 }, words: 30, lines: 6 })
  ];
}

function codesOf(report) {
  return [...new Set(report.problems.map((p) => p.type))].sort();
}

/** מריץ את השכבה הטהורה על ספר ומחזיר דוח + קודי הבעיות. */
function runBook(pages) {
  const rep = audit.finalizeChecks(pages, { slots: pages.length, virtualized: false, sweep: null, collectionProblems: [] });
  return { summary: rep.summary, problems: rep.problems, codes: codesOf(rep), report: rep };
}

describe('audit-sensitivity — הוכחת רגישות הגלאים (S5.2)', () => {

  it('גימטריה: היפוך מושלם של toHebrewNumber (1..800) + טפסים מיוחדים', () => {
    const { toHebrewNumber } = require('../../src/engine/decoration/folio.js');
    for (let n = 1; n <= 800; n++) {
      assertEq(audit.gematriaToNumber(toHebrewNumber(n)), n, `roundtrip ${n} → ${toHebrewNumber(n)}`);
    }
    assertEq(audit.gematriaToNumber('טו'), 15, 'טו=15 (לא יה-וו)');
    assertEq(audit.gematriaToNumber('טז'), 16, 'טז=16');
    assertEq(audit.gematriaToNumber('(א)'), 1, 'מסגרת סוגריים');
    assertEq(audit.gematriaToNumber('דף ד׳'), 4, 'קידומת דף — מוסרת אחת');
    assertEq(audit.gematriaToNumber('17'), 17, 'ספרות לועזיות');
    assertEq(audit.gematriaToNumber('ה׳תש״ב'), 5702, 'אלפים');
    assertEq(audit.gematriaToNumber('---'), null, 'זבל → null');
  });

  it('מבחנה נקייה ⇒ 0 בעיות (הכל ירוק מהסיבות הנכונות)', () => {
    const { summary, codes } = runBook(cleanBook());
    assertEq(summary.problems, 0, 'clean fixture must be perfectly green, got: ' + codes.join(','));
    assertEq(summary.pages, 6, 'כל העמודים נבדקו');
    assertEq(summary.totalWords, 72, 'ספירת מילים כוללת');
  });

  it('(א) שתי שורות גוף חופפות ⇒ LINE_OVERLAP יורה', () => {
    const book = cleanBook();
    const pg = book[4];
    pg.cols[0].lines[1].y = pg.cols[0].lines[0].y + 6; // חפיפה 15px
    const { codes } = runBook(book);
    assert(codes.includes('LINE_OVERLAP'), 'LINE_OVERLAP must fire, got: ' + codes.join(','));
    assertEq(codes.filter((c) => c !== 'LINE_OVERLAP').length, 0, 'בלי אזעקות שווא נוספות: ' + codes.join(','));
  });

  it('(ב) דיו מחוץ לטור מימין ⇒ INK_OUTSIDE_COLUMN יורה (גם על שורה אחרונה/כותרת)', () => {
    const book = cleanBook();
    const l = book[4].cols[0].lines[2];
    l.ink = { x: COL_R_X - 12, y: l.y, r: COL_R_X + COL_W + 12, b: l.y + LINE_H }; // גולש משני הצדדים — ממורכז
    l.last = true; l.style.ta = 'center'; l.style.tal = 'auto'; // **S5.2/E:** גם שורה אחרונה נבדקת לגלישת דיו
    const { codes } = runBook(book);
    assert(codes.includes('INK_OUTSIDE_COLUMN'), 'INK_OUTSIDE_COLUMN must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ג) שורה מעל ראשית הטור ⇒ LINE_ABOVE_COLUMN יורה', () => {
    const book = cleanBook();
    for (const c of book[4].cols) for (const l of c.lines) shiftLine(l, -10); // שני הטורים נודדים לפס הכותרת — הראשים מיושרים
    const { codes } = runBook(book);
    assert(codes.includes('LINE_ABOVE_COLUMN'), 'LINE_ABOVE_COLUMN must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ד) עמוד regular בלי גיליון ⇒ FOLIO_MISSING יורה', () => {
    const book = cleanBook();
    book[5].folio = null;
    const { codes } = runBook(book);
    assert(codes.includes('FOLIO_MISSING'), 'FOLIO_MISSING must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ה) זוג שורות בפס שגוי ⇒ PITCH_UNIFORMITY יורה', () => {
    const book = cleanBook();
    const ls = book[4].cols[0].lines;
    shiftLine(ls[1], 40 - LINE_H);            // פס 40px מהשורה שלפניה
    shiftLine(ls[2], 40 - LINE_H);            // והשורה שאחריה זזה איתה — בלי חפיפה
    const { codes } = runBook(book);
    assert(codes.includes('PITCH_UNIFORMITY'), 'PITCH_UNIFORMITY must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ה2) פס לגיטימי: מרווח-פסקה 7px ופס h3 בין השורות — לא מדווח', () => {
    const book = cleanBook();
    const ls = book[4].cols[0].lines;
    shiftLine(ls[1], 7);                       // מרווח פסקה בסיסי (7px)
    shiftLine(ls[2], 7 + 38 + 7);              // פס h3 (38px) + מרווחים
    book[4].bands = [{ cls: 'band band--h3-title', x: 66.1, y: ls[1].y + LINE_H + 7, w: 552.3, h: 38, align: 'center', text: 'כותרת רוחבית', ink: { x: 292.25, y: ls[1].y + LINE_H + 12, r: 392.25, b: ls[1].y + LINE_H + 28 } }];
    const { summary, codes } = runBook(book);
    assertEq(summary.problems, 0, 'legit paragraph-gap + h3 band must stay green, got: ' + codes.join(','));
  });

  it('(ו) שתי שורות תוכן-עניינים חופפות ⇒ TOC_ROWS יורה', () => {
    const book = cleanBook();
    book[2].tocRows[1].y = book[2].tocRows[0].y + 9.2; // מרחק 9.2px מול תיבה 26px
    const { codes } = runBook(book);
    assert(codes.includes('TOC_ROWS'), 'TOC_ROWS must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ו2) ערימה חוקית של רמה 6 (פס 23.6px בעמוד ה-TOC האחרון) — לא מדווח (מגן סף 21.5)', () => {
    const book = cleanBook();
    // makeTocPages: העמוד האחרון ברצף אינו נמתח אלא נערם לפי tocRowH(level) —
    // רמה 6: 9pt×4/3×1.3+8 = 23.6px, רמה 5: 24.47px. תיבת ה-DOM 26px חופפת
    // 2.4px אבל הדיו (שורה אחת של 12px ב-line-height 26) לא — זו הגיאומטריה
    // החוקית של המנוע. סף של 26−1.5=24.5 היה מדווח אותה בשווא (באג סף, לא מציאות).
    const ls = book[2].tocRows;
    ls[0].y = 370.7; ls[0].h = 26;
    ls[1].y = 370.7 + 23.6; ls[1].h = 26;
    const { summary, codes } = runBook(book);
    assertEq(summary.problems, 0, 'legit level-6 stack pitch 23.6px must stay green, got: ' + codes.join(','));
  });

  it('(ו3) שורת TOC מעל תיבת המתיחה ⇒ TOC_ROWS יורה (אזור)', () => {
    const book = cleanBook();
    book[2].tocRows[0].y = 300; // מעל 370.7−2 (עמוד ראשון ברצף)
    const { codes } = runBook(book);
    assert(codes.includes('TOC_ROWS'), 'TOC_ROWS (zone) must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ו4) שורת TOC על הגיליון בנתיב המודרני ⇒ TOC_ROWS יורה (התנגשות; בלי בדיקת אזור)', () => {
    const book = cleanBook();
    book[2].tocInContainer = true;          // .toc-rows בזרימה — אין מתיחה/תחום
    book[2].tocRows[0].y = 1030;            // חופפת את הגיליון (1040.5..1058.5)
    book[2].tocRows[1].y = 1030 + 26;
    const { problems, codes } = runBook(book);
    assert(codes.includes('TOC_ROWS'), 'TOC_ROWS (folio collision) must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
    assert(problems.some((p) => p.type === 'TOC_ROWS' && /גיליון/.test(p.detail)), 'הפרט מזהה גיליון');
  });

  it('(ז) גודל גופן שונה בשורת גוף ⇒ BODY_FONT_UNIFORMITY יורה', () => {
    const book = cleanBook();
    book[4].cols[0].lines[1].style.fs = 18.5;
    const { codes } = runBook(book);
    assert(codes.includes('BODY_FONT_UNIFORMITY'), 'BODY_FONT_UNIFORMITY must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ז2) הקדמה בגודל משלה (15.3px = 11.5pt) — לגיטימי ואינו מדווח', () => {
    const book = cleanBook();
    const pre = mkPage({ i: 6, t: 'preface', folio: { text: 'ד׳', top: 1040.5, bottom: 1058.5 }, cols: [{ x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }, { x: COL_L_X, y: FLOW_TOP, w: 552.3, h: 915, lines: [] }] });
    pre.cols[0].lines = [
      mkLine({ y: 356.4, h: 20.55, x: COL_L_X, w: 552.3, style: { ta: 'justify', tal: 'justify', ws: 'normal', fs: 15.3, fam: '"Frank Ruhl Libre"', dir: 'rtl' }, ink: { x: COL_L_X, y: 356.4, r: COL_L_X + 552.3, b: 376.95 }, token: 'h0a' }),
      mkLine({ y: 377, h: 20.55, x: COL_L_X, w: 552.3, style: { ta: 'justify', tal: 'justify', ws: 'normal', fs: 15.3, fam: '"Frank Ruhl Libre"', dir: 'rtl' }, ink: { x: COL_L_X, y: 377, r: COL_L_X + 552.3, b: 397.55 }, token: 'h0a' })
    ];
    book.push(pre);
    const { summary, codes } = runBook(book);
    assertEq(summary.problems, 0, 'preface 15.3px/20.55px is legitimate, got: ' + codes.join(','));
  });

  it('(ח) סמן הערה בגוף בלי פתיחת-הערה ⇒ MARKER_NOTE_MATCH יורה (מולטיסט גלובלי)', () => {
    const book = cleanBook();
    book[4].cols[0].lines[0].markers = [{ t: 'א.', fs: 10.7 }];
    book[4].cols[0].lines[1].markers = [{ t: 'ב.', fs: 10.7 }];
    book[5].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: ['א.'], text: 'א. הערת מבחן', fs: 12 }];
    const { problems, codes } = runBook(book);
    assert(codes.includes('MARKER_NOTE_MATCH'), 'MARKER_NOTE_MATCH must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
    // הסמן החסר מזוהה במדויק — לא סתם "אי-התאמה כלשהי"
    const bad = problems.filter((p) => p.type === 'MARKER_NOTE_MATCH');
    assert(bad.some((p) => p.marker === 'ב.' && p.inBody === 1 && p.inNotes === 0), 'הסמן ב. מדווח עם בגוף=1/בהערות=0');
    assert(!bad.some((p) => p.marker === 'א.'), 'הסמן התואם (א.) אינו מדווח');
  });

  it('(ח2) הצגה חוזרת חוקית של הערה (פסקה חוצת-עמודים — כמקור) — לא מדווח', () => {
    const book = cleanBook();
    // המקור (הוכח מהייחוס, עמודים 11/12): הערה של פסקה חוצת-עמודים חוזרת בעמוד
    // ההמשך עם הסמן שוב (מספור פר-פרק יציב) — 'א.' בגוף ×1, ברישום ×2 (567+568).
    book[4].cols[0].lines[0].markers = [{ t: 'א.', fs: 10.7 }];
    book[4].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: ['א.'], text: 'א. הערה', fs: 12 }];
    book[5].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: ['א.'], text: 'א. הערה', fs: 12 }];
    const { summary, codes, report } = runBook(book);
    assertEq(summary.problems, 0, 'legitimate re-display must stay green, got: ' + codes.join(','));
    assertEq(report.S.markers.reDisplayed, 1, 'ההצגה החוזרת נספרת בסטטיסטיקה');
  });

  it('(ח3) הערה יתומה (פתיחה בלי סמן בגוף) ⇒ MARKER_NOTE_MATCH יורה', () => {
    const book = cleanBook();
    book[5].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: ['ז.'], text: 'ז. הערה יתומה', fs: 12 }];
    const { codes } = runBook(book);
    assert(codes.includes('MARKER_NOTE_MATCH'), 'MARKER_NOTE_MATCH must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(ט) גיליון משוכפל ⇒ FOLIO_SEQUENCE יורה', () => {
    const book = cleanBook();
    book[5].folio.text = 'ב׳'; // כמו עמוד 4 — כפילות
    const { codes } = runBook(book);
    assert(codes.includes('FOLIO_SEQUENCE'), 'FOLIO_SEQUENCE must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(י) עמוד לא מזוהה ⇒ TYPE_UNKNOWN יורה (בעבר היה שקט)', () => {
    const book = cleanBook();
    book[5].t = 'unknown';
    const { codes } = runBook(book);
    assert(codes.includes('TYPE_UNKNOWN'), 'TYPE_UNKNOWN must fire, got: ' + codes.join(','));
  });

  it('(יא) טורים לא מיושרים בראשיתם ⇒ COLUMN_TOPS_ALIGN יורה; פס ביניהם — פטור', () => {
    const book = cleanBook();
    book[4].cols[1].lines.forEach((l, k) => { const dy = 9; l.y += dy; l.ink.y += dy; l.ink.b += dy; });
    let { codes } = runBook(book);
    assert(codes.includes('COLUMN_TOPS_ALIGN'), 'COLUMN_TOPS_ALIGN must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
    // אותו פער עם פס h3 בין שני הראשים — לגיטימי (הטור השמאלי נפתח מתחת לפס,
    // כמו 12 העמודים שהוכחו במודל)
    const book2 = cleanBook();
    const lo = book2[4].cols[0].lines[0].y;
    for (const l of book2[4].cols[1].lines) shiftLine(l, 90);
    const hi = book2[4].cols[1].lines[0].y;
    book2[4].bands = [{ cls: 'band band--h3-title', x: 66.1, y: lo + LINE_H + 7, w: 552.3, h: 38, align: 'center', text: 'כותרת רוחבית', ink: { x: 292.25, y: lo + LINE_H + 12, r: 392.25, b: lo + LINE_H + 28 } }];
    assert(lo + LINE_H + 7 < hi - 1, 'הפס באמת יושב בין שני הראשים');
    ({ codes } = runBook(book2));
    assertEq(codes.length, 0, 'band between column tops is exempt, got: ' + codes.join(','));
  });

  it('(יב) אזור הערות מודרני בלי קו מפריד ⇒ FN_RULE_PRESENT יורה (כשהקו קיים במסמך)', () => {
    const book = cleanBook();
    book[4].fnAreaN = 1; book[4].fnRuleN = 1;
    book[4].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: [], text: 'הערה', fs: 12 }];
    book[5].fnAreaN = 1; book[5].fnRuleN = 0; // הקו חסר כאן
    book[5].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: [], text: 'הערה', fs: 12 }];
    const { codes } = runBook(book);
    assert(codes.includes('FN_RULE_PRESENT'), 'FN_RULE_PRESENT must fire, got: ' + codes.join(','));
    assertEq(codes.length, 1, 'בדיוק הבעיה הזו: ' + codes.join(','));
  });

  it('(יב2) הערות מורשת (בלי אזור .footnotes) בלי קו — לגיטימי ואינו מדווח (S4.9)', () => {
    const book = cleanBook();
    // נתיב המורשת: .footnote בנות של העמוד, ההפרדה בריווח בלבד — אין אזור
    // .footnotes ואין .fn-rule מטבעם; הבדיקה מותנית בקיום אזור (fnAreaN>0)
    // ובקו כלשהו במסמך — שניהם לא קיימים כאן ⇒ indeterminate ⇒ שקט מטבעו.
    book[4].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: [], text: 'הערה', fs: 12 }];
    book[5].fns = [{ x: COL_L_X, y: 960, w: 552.3, h: 28, markers: [], text: 'הערה', fs: 12 }];
    const { summary, codes } = runBook(book);
    assertEq(summary.problems, 0, 'legacy footnotes have no rule by design, got: ' + codes.join(','));
  });

  it('מבנה הדוח: bySeverity מחושב מהרשימה המלאה גם מעל תקרת 2000 (תיקון S5.2)', () => {
    const { toHebrewNumber } = require('../../src/engine/decoration/folio.js');
    const book = cleanBook();
    // 1100 עמודים × 2 טורים × פס שגוי אחד — מעל תקרת ה-2000 של רשימת הדוח
    const pages = [];
    for (let p = 0; p < 1100; p++) {
      const pg = mkPage({ i: 6 + p, t: 'regular', folio: { text: toHebrewNumber(4 + p), top: 1040.5, bottom: 1058.5 }, words: 30, lines: 6 });
      for (const c of pg.cols) shiftLine(c.lines[1], 30); // פס 51.4px — לא מרווח-פסקה ולא פס
      pages.push(pg);
    }
    const rep = audit.finalizeChecks(book.concat(pages), { slots: 1106, virtualized: false, collectionProblems: [] });
    const total = Object.values(rep.CNT).reduce((s, v) => s + v, 0);
    assert(total > 2000, 'יש יותר מ-2000 בעיות (קיבל ' + total + ')');
    assertEq(rep.summary.problems, total, 'summary.problems = הספירה המלאה');
    const sevTotal = Object.values(rep.summary.bySeverity).reduce((s, v) => s + v, 0);
    assertEq(sevTotal, total, 'bySeverity = הספירה המלאה (בעבר חושב מהרשימה הקצוצה)');
    assert(rep.problemsCapped.length <= 2000, 'רשימת הדוח נשארת קצוצה לצורך גודל');
  });
});

report('audit-sensitivity');
