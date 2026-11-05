// tests/e2e/s52-dp-fixes.test.js — רגרסיות נתיב DP (S5.2): תיקוני הביקורת האדברסרית
// 1 (תקרת איטרציות בלי קריסה), 2 (מיזוג מילה נופלת עם בדיקת רוחב), 3 (FIT_EPS
// שמרני בשבירת השורות), 4 (תיבת פנטום 1px), 5 (tracking=0), 7 (עמודי הערות
// בשני טורים + תקצוב כותרת), 8 (גזירת רוחבי התוכן), 9 (קיבולת מאוחדת),
// 10 (מוסכמת הגרשיים בסמנים).
'use strict';

const { describe, it, assert, assertEq, assertClose, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildPageTemplate, PAGE_TYPES } = require('../../src/engine/layout/page-templates');
const { colCapacityOf } = require('../../src/engine/layout/column-flow');
const { runRetreatLoop, MAX_ITERATIONS } = require('../../src/engine/layout/retreat-loop');
const { breakLines } = require('../../src/engine/typography/kp-linebreak');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { fixDropWordInColumns } = require('../../src/engine/typography/protectors');
const { markerFor, hebrewMarkFinish } = require('../../src/engine/notes/markers');
const { toHebrewNumber } = require('../../src/engine/decoration/folio');
const { Ledger } = require('../../src/engine/core/ledger');
const { EventLog } = require('../../src/engine/core/events');

const S = getDefaultSettings();
const api = new MeasureAPI(S, 'table');
const W = (t) => api.measureTextWidth(t);

// ---------- תיקון 1: retreat-loop — יציאת תקרה בלי ReferenceError ----------
describe('S5.2 תיקון 1 — retreat-loop: תקרת איטרציות (בעבר ReferenceError: allViolations)', () => {
  it('24 איטרציות לא-מתכנסות (חתימה חדשה בכל איטרציה) ⇒ פשרה מתועדת, לא קריסה', () => {
    const ledger = new Ledger();
    const eventLog = new EventLog('full');
    let i = 0;
    // כל איטרציה מייצרת הפרה בחתימה חדשה (אין תנודה בחלון) עם פונקציית תיקון
    // קיימת — הנוסחה היחידה שמגיעה ליציאת התקרה שבסוף הלולאה.
    const assess = () => [{ kind: 'column-imbalance', target: `z${i++}` }];
    const r = runRetreatLoop({
      pages: [{ index: 0 }], settings: { ...S }, ledger, eventLog, assess,
      repairFns: { 'column-imbalance': () => {} }
    });
    assertEq(r.converged, false, 'לא התכנס');
    assertEq(r.iterations, MAX_ITERATIONS, `הגיע לתקרה (${MAX_ITERATIONS})`);
    assert(r.compromise, 'פשרת rollback-compromise נרשמה (loop-ceiling)');
    const rec = ledger.issues.get(r.compromise);
    assertEq(rec.kind, 'rollback-compromise');
    assertEq(rec.status, 'unresolved', 'תקרה ללא התכנסות — לא resolved');
    // ההפרות של האיטרציה האחרונה נרשמות במלואן (recordRemaining) — לא נעלמות
    assert(r.persisted && r.persisted.length >= 1, 'ההפרה הנשארת תועדה');
  });
});

// ---------- תיקון 2: מיזוג מילה נופלת — בדיקת רוחב אחרי המיזוג ----------
describe('S5.2 תיקון 2 — fixDropWordInColumns: המיזוג חייב להיכנס ברוחב הטור', () => {
  const measure = (t) => t.length * 6;
  it('השורה המקבלת כמעט מלאה ⇒ המילה נשארת בטור המקורי (אין גלישה שקטה)', () => {
    const cols = [
      [{ words: ['אב'], widthPx: 12, heightPx: 20 }],
      [{ words: ['מילה', 'אחת', 'כאן'], widthPx: 190, heightPx: 20 }]
    ];
    const fixed = fixDropWordInColumns(cols, 5, { measure, colW: 200 });
    assertEq(fixed, false, 'המיזוג היה גולש (190+6+12=208 > 200−0.75) — נדחה');
    assertEq(cols[0].length, 1, 'השורה נשארה בטור הראשון');
    assertEq(cols[0][0].words[0], 'אב', 'המילה נשארה במקומה');
    assertEq(cols[1][0].words[0], 'מילה', 'השורה המקבלת לא שונתה');
  });
  it('יש מקום ⇒ המיזוג מתבצע ו-widthPx מתעדכן', () => {
    const cols = [
      [{ words: ['קצר'], widthPx: 24, heightPx: 20 }],
      [{ words: ['המשך', 'טקסט'], widthPx: 100, heightPx: 20 }]
    ];
    const fixed = fixDropWordInColumns(cols, 5, { measure, colW: 200 });
    assertEq(fixed, true);
    assertEq(cols[0].length, 0, 'השורה הנופלת הוסרה מהטור הראשון');
    assertEq(cols[1][0].words[0], 'קצר');
    assertEq(cols[1][0].widthPx, 100 + measure(' ') + measure('קצר'), 'רוחב ממוזג מתועד');
  });
  it('לא ממזגים לתוך כותרת/שורה אחרונה, ולא מוציאים מילה מכותרת', () => {
    const head = [{ kind: 'heading', words: ['כותרת', 'קצרה'], widthPx: 60, heightPx: 20 }];
    let cols = [[{ words: ['אב'], widthPx: 12, heightPx: 20 }], head];
    assertEq(fixDropWordInColumns(cols, 5, { measure, colW: 500 }), false, 'כותרת מקבלת — אסור');
    cols = [[{ words: ['אב'], widthPx: 12, heightPx: 20 }], [{ isLast: true, words: ['סוף', 'פסקה'], widthPx: 60, heightPx: 20 }]];
    assertEq(fixDropWordInColumns(cols, 5, { measure, colW: 500 }), false, 'שורה אחרונה מקבלת — אסור');
    cols = [[{ kind: 'heading', words: ['אור'], widthPx: 12, heightPx: 20 }], [{ words: ['המשך', 'טקסט'], widthPx: 60, heightPx: 20 }]];
    assertEq(fixDropWordInColumns(cols, 5, { measure, colW: 500 }), false, 'מילה מתוך כותרת — אסור');
  });
  it('בלי מדידה (opts.measure) — אין מיזוג בכלל (מי שלא מודד לא מוכיח התאמה)', () => {
    const cols = [
      [{ words: ['קצר'], widthPx: 24, heightPx: 20 }],
      [{ words: ['המשך', 'טקסט'], widthPx: 100, heightPx: 20 }]
    ];
    assertEq(fixDropWordInColumns(cols, 5), false);
    assertEq(cols[0].length, 1);
  });
});

// ---------- תיקון 3: FIT_EPS שמרני בשבירת השורות (D-92) ----------
describe('S5.2 תיקון 3 — kp-linebreak: שום שורה מרובת-טוקנים אינה גולשת מהטור', () => {
  const words = 'אלו מילות בדיקה לשבירת שורות אופטימלית בטור עברי צר יחסית עם עוד כמה מילים נוספות למילוי ארוך של פסקה שלמה'.split(' ');
  for (const colW of [180, 240, 300]) {
    it(`colW=${colW}: כל שורה שנפלטת ברוחב טבעי ≤ colW−0.75`, () => {
      const lines = breakLines(words, colW, W, 20, {});
      assert(lines.length >= 2, 'נשבר לשורות');
      for (const ln of lines) {
        const natural = ln.words.reduce((s, w) => s + W(w), 0) + (ln.words.length - 1) * W(' ');
        if (ln.words.length > 1) {
          assert(natural <= colW - 0.75 + 1e-9, `שורה גולשת: ${natural.toFixed(2)} > ${colW - 0.75} (${JSON.stringify(ln.words)})`);
        }
      }
    });
  }
  it('מילה רחבה מהטור עדיין יוצאת כשורה בפני עצמה (over-wide token; התקדמות מובטחת)', () => {
    const long = 'מילהארוכהמאודשלאנכנסתבטורמילהארוכהמאודשלאנכנסתבטור';
    const lines = breakLines(['לפני', long, 'אחרי'], 200, W, 20, {});
    const flat = lines.flatMap(l => l.words);
    assertEq(flat.length, 3, 'אין איבוד/כפילות טוקנים');
    assertEq(flat[1], long, 'המילה הרחבה שלמה');
    assert(lines.some(l => l.words.length === 1 && l.words[0] === long), 'שורה משלה');
  });
});

// ---------- תיקון 4: תיבת פנטום 1px לחלק ריק ביחידת NBSP ----------
describe('S5.2 תיקון 4 — חלק ריק (NBSP כפול) נמדד ברוחב 0', () => {
  it('רוחב היחידה "א\u00A0\u00A0ב" = א + 2 רווחים + ב (בלי תיבת 1px פנטום)', () => {
    const lines = breakLines(['א\u00A0\u00A0ב'], 400, W, 20, {});
    assertEq(lines.length, 1, 'שורה אחת');
    assertEq(lines[0].words[0], 'א\u00A0\u00A0ב', 'היחידה שלמה (לא נקרעה)');
    const expected = W('א') + 2 * W(' ') + W('ב'); // שתי תיבות חיצוניות + שני רווחי internal-glue; התיבה הריקה = 0
    assertClose(lines[0].widthPx, expected, 0.01, `רוחב השורה כולל את החלק הריק כ-0 (קיבלנו ${lines[0].widthPx}, ציפינו ${expected}; בעבר +1px)`);
  });
});

// ---------- תיקון 5: tracking ברירת מחדל 0 ----------
describe('S5.2 תיקון 5 — ברירת המחדל tracking=0 (המודל = הדיו; אף מרנדר אינו מצייר letter-spacing)', () => {
  it('מדידת ברירת מחדל === מדידה עם tracking=0 מפורש', () => {
    assertEq(api.measureTextWidth('שלום עולם'), api.measureTextWidth('שלום עולם', null, 0));
    assertEq(api.measureTextWidth('אבג'), api.measureTextWidth('אבג', null, 0));
  });
});

// ---------- תיקון 7: עמודי הערות — שני טורים מלאים + תקצוב כותרת ----------
describe('S5.2 תיקון 7 — עמודי הערות: שני הטורים מתמלאים; הכותרת מתוקצבת', () => {
  const mkDoc = (n) => ['ספר - בדיקת עמודי הערות', 'כותרת 1 - חלק'].concat(
    Array.from({ length: n }, (_, i) => `הערת סיום-${i + 1} - טקסט הערה ארוך למדי עם כמה מילים נוספות למילוי הטורים ${i}`)
  ).join('\n');
  it('N הערות שדורשות יותר מטור אחד ⇒ שני הטורים מתמלאים בקיבולת מלאה', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'endnote-columns': 2, 'count-endnote-pages': true };
    const r = typeset(mkDoc(90), s);
    assert(r.contentPreserved === true, 'שימור תוכן');
    const pages = r.endnotePagesInfo.pages;
    assert(pages.length >= 2, `כמה עמודים (קיבלנו ${pages.length})`);
    // קיבולת אמיתית מתבנית PT-07 (בלי כותרת עליונה של עמודי גוף)
    const enTpl = buildPageTemplate(PAGE_TYPES.ENDNOTES, s, true);
    for (const p of pages) {
      assert(p.columns.length === 2, 'שני טורים במודל');
      const heights = p.columns.map(c => c.reduce((a, n) => a + n.heightPx, 0));
      for (let c = 0; c < 2; c++) {
        // טור לא-אחרון בעמוד לא-אחרון חייב להיות מלא עד אפסון הערה אחת
        const cap = enTpl.contentBox.height - p.titleBandPx;
        if (c === 0 && p !== pages[pages.length - 1]) {
          assert(heights[0] > cap * 0.85, `טור 1 מלא (מילאנו ${heights[0].toFixed(0)}/${cap.toFixed(0)})`);
        }
        assert(heights[c] <= cap + 0.5, `טור ${c} לא גולש (${heights[c].toFixed(0)} > ${cap.toFixed(0)})`);
      }
      assert(p.titleBandPx > 0, 'גובה הכותרת מתוקצב');
    }
    // הערה אחת לא נחצתה בין טורים (יחידה אטומית): מופעת בדיוק בטור אחד
    const allPlaced = pages.flatMap(p => p.columns.flat());
    assertEq(allPlaced.length, 90, 'כל ההערות הוצבו בדיוק פעם אחת');
  });
  it('הכותרת בעמוד הראשון של החלק = כותרת החלק; המשכים נושאים (המשך); התקציב בכל עמוד', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'endnote-columns': 2, 'count-endnote-pages': true };
    const r = typeset(mkDoc(90), s);
    const pages = r.endnotePagesInfo.pages;
    assert(!/המשך/.test(pages[0].heading), `העמוד הראשון: כותרת החלק (${pages[0].heading})`);
    for (let i = 1; i < pages.length; i++) {
      assert(/המשך/.test(pages[i].heading), `עמוד ${i}: כותרת המשך (${pages[i].heading})`);
      assert(pages[i].titleBandPx > 0, 'גם עמוד המשך מתקצב — הכותרת מוצגת בו בפועל');
    }
  });
});

// ---------- תיקון 8: גזירת רוחבי התוכן (הנוסחה המתועדת) ----------
describe('S5.2 תיקון 8 — רוחבי נתיב ההערות וטור עמודי ההערות מהגיאומטריה', () => {
  it('footnote-columns=1: הנתיב = רוחב תיבת התוכן המלא (כמו שמוקרן בגיאומטריה)', () => {
    const r = typeset('כותרת 1 - ח\nפסקה עם הערה [הערה] ועוד מעט טקסט.', { ...getDefaultSettings() });
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, getDefaultSettings(), true);
    const fullW = Math.max(...tpl.columns.map(c => c.x + c.w)) - Math.min(...tpl.columns.map(c => c.x));
    assertEq(r.settings._fnColWidthPx, Math.round(fullW), `_fnColWidthPx=${r.settings._fnColWidthPx} — הגזירה: round(${fullW.toFixed(2)})`);
  });
  it('footnote-columns=2: כל נתיב = (רוחב מלא − מרזב התבנית)/2', () => {
    const r = typeset('כותרת 1 - ח\nפסקה עם הערה [הערה] ועוד מעט טקסט.', { ...getDefaultSettings(), 'footnote-columns': 2 });
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, { ...getDefaultSettings(), 'footnote-columns': 2 }, true);
    const fullW = Math.max(...tpl.columns.map(c => c.x + c.w)) - Math.min(...tpl.columns.map(c => c.x));
    assertEq(r.settings._fnColWidthPx, Math.round((fullW - tpl.gutter) / 2), `_fnColWidthPx(2)=${r.settings._fnColWidthPx} — הגזירה: round((${fullW.toFixed(2)}−${tpl.gutter.toFixed(2)})/2)`);
  });
  it('_endnoteColWidthPx = רוחב טור בודד מתבנית PT-07 (לא "סכום טורים+מרזב")', () => {
    const r = typeset('כותרת 1 - ח\nפסקה.', { ...getDefaultSettings() });
    const enTpl = buildPageTemplate(PAGE_TYPES.ENDNOTES, getDefaultSettings(), true);
    assertEq(r.settings._endnoteColWidthPx, Math.round(enTpl.columns[0].w), `=${r.settings._endnoteColWidthPx} מול ${enTpl.columns[0].w.toFixed(2)} מהתבנית`);
    assert(r.settings._endnoteColWidthPx < 300, 'טור בודד — לא רוחב כולל');
  });
});

// ---------- תיקון 9: קיבולת מאוחדת (colCapacityOf) ----------
describe('S5.2 תיקון 9 — colCapacityOf: פס חוצה־טורים + תקציב הערות (על הטור האחרון)', () => {
  const mkPage = (over = {}) => ({
    index: 0, type: 'regular',
    template: { contentBox: { height: 1000 } },
    columns: [[], []],
    footnotes: [], sideNotes: [],
    ...over
  });
  it('בסיס: contentBox.height', () => {
    assertEq(colCapacityOf(mkPage()), 1000);
  });
  it('פס חוצה־טורים מקטין את שני הטורים', () => {
    const p = mkPage({ spanning: { heightPx: 120 } });
    assertEq(colCapacityOf(p, { colIndex: 0 }), 880);
    assertEq(colCapacityOf(p, { colIndex: 1 }), 880);
  });
  it('תקציב הערות מקטין רק את הטור האחרון (ברירת המחדל — המחמיר); fnBudget:false מבטל', () => {
    const p = mkPage({ fnReservedHeightPx: 90 });
    assertEq(colCapacityOf(p, { colIndex: 0 }), 1000, 'טור ראשון — בלי התקציב');
    assertEq(colCapacityOf(p, { colIndex: 1 }), 910, 'טור אחרון — עם התקציב');
    assertEq(colCapacityOf(p), 910, 'ברירת מחדל = הטור האחרון');
    assertEq(colCapacityOf(p, { fnBudget: false }), 1000, 'כיבוי מפורש (למי שמודד usage כולל התקציב)');
  });
  it('שילוב: פס + תקציב', () => {
    const p = mkPage({ spanning: { heightPx: 120 }, fnReservedHeightPx: 90 });
    assertEq(colCapacityOf(p, { colIndex: 0 }), 880);
    assertEq(colCapacityOf(p, { colIndex: 1 }), 790);
  });
});

// ---------- תיקון 10: מוסכמת הגרשיים בסמנים ----------
describe('S5.2 תיקון 10 — סמני הערות במוסכמת הגרשיים של הגיליון', () => {
  it('אות בודדת ⇒ גרש (א׳); שתיים ומעלה ⇒ גרשיים לפני האות האחרונה (כ״ג, לא כג׳)', () => {
    assertEq(markerFor(1, 'hebrew-geresh'), 'א׳');
    assertEq(markerFor(2, 'hebrew-geresh'), 'ב׳');
    assertEq(markerFor(23, 'hebrew-geresh'), 'א״א'); // האותיות של המונה (אא) + גרשיים לפני האחרונה
    assertEq(markerFor(24, 'hebrew-geresh'), 'א״ב');
    assert(!/[\u05D0-\u05EA]{2}\u05F3$/.test(markerFor(23, 'hebrew-geresh')), 'הצורה הישנה (כג׳) אינה מיוצרת עוד');
  });
  it('זהות הסיומת לגיליון (folio.toHebrewNumber/finish) — אותה מוסכמה על אותן אותיות', () => {
    // מוסכמת הסימנים (לא המספור — לכל מודול סדרת אותיות משלו): על אותה מחרוזת
    // אותיות מתקבלת אותה צורת גרש/גרשיים כמו בגיליון.
    assertEq(hebrewMarkFinish('כא'), toHebrewNumber(21), 'כ״א — גרשיים לפני האות האחרונה');
    assertEq(hebrewMarkFinish('ג'), toHebrewNumber(3), 'ג׳ — אות בודדת בגרש');
    assertEq(hebrewMarkFinish('תש'), toHebrewNumber(700), 'ת״ש');
  });
  it('end-to-end: הסמנים בפלט עקביים בין גוף למקום ההצגה (חשבונאות D-30)', () => {
    const doc = 'כותרת 1 - ח\n' + Array.from({ length: 26 }, (_, i) =>
      `פסקה ${i} עם הערה [הערה מספר ${i}] ועוד קצת טקסט.`).join('\n');
    const r = typeset(doc, getDefaultSettings());
    assert(r.contentPreserved === true, 'עקביות סמנים גוף/מרזב במוסכמה החדשה');
  });
});

report('s52-dp-fixes');
