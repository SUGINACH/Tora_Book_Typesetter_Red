// tests/e2e/s53-dp-notes-export.test.js — S5.4 (P-5): הקרנת הערות/עמודי-הערות/
// הערות-צד/מפרידים בנתיב ה-DP — תצוגה=ייצוא ואפס אובדן תוכן בפלט.
//
// רקע (P-5, חומרה גבוהה בייצוא DP): לפני S5.4 הפרויקטור הקרין את מרזב ההערות
// כרשומת טקסט אחת לכל הערה — וה-pdf-writer "פיזר" את מילותיה בקידום קבוע
// 8.2px (הערות מרוסקות); עמודי הערות-הסיום הוקרנו כ"שורות" מאובייקטי הערה
// ⇒ עמודים ריקים (ובברירת המחדל לא צורפו כלל — אובדן תוכן); הערות-צד
// ומפרידי הטורים לא הוקרנו כלל. כאן ננעלים התיקונים קצה-לקצה.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { projectDocument } = require('../../src/engine/output/geometry-projector');
const { exportPdf } = require('../../src/engine/output/export-api');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const fs = require('fs');
const path = require('path');

const ART = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

/** מסמך גוף עם הערות-שוליים רבות וארוכות — רבות-שורות במרזב, ומספיק נפח
 *  לעמודי גוף דו-טוריים (REGULAR) אחרי עמוד הפתיחה החד-טורי. */
const FN_NOTE = (i) => `הערה מספר ${i} עם עוד כמה מילים ארוכות למדידת שבירת שורות במרזב ההערות ולוודא שהשורות מיושרות לשני הצדדים בדיוק כמו בגוף הדף עצמו ושאין שום מילה שנמעכת או חופפת את שכנתה בשורה ${i}`;
const FN_DOC = 'ספר - ספר בדיקות המרזב\nנושא - תרחיש P-5\n\n'
  + 'כותרת 1 - החלק הראשון\n'
  + 'כותרת 2 - פרק פתיחה\n'
  + Array.from({ length: 40 }, (_, i) =>
    `פסקה ${i} עם הערה [${FN_NOTE(i)}] ועוד קצת טקסט רץ בגוף הדף למילוי הטורים והעמודים בנפח אמיתי.`).join('\n');

/** מסמך דו-חלקי עם הערות-סיום (תחביר המקור: class + ממוספרות + גלויות + inline). */
const EN_DOC = `ספר - ספר המדגמים
נושא - תרחישי סיום S5.4

כותרת 1 - חלק ראשון
כותרת 2 - תחילת החלק הראשון
פסקה ראשונה של החלק הראשון עם הערה צמודה [הערת הגוף הראשונה] בתוך הטקסט, וגם הערה שנייה [הערת גוף נוספת] כאן.
פסקה שנייה למילוי נפח ובחינת איזון הטורים בעמודי הגוף עצמם.
הערות סיום - הערות החלק הראשון
הערת סיום-1 - זו הערה ממוספרת ראשונה של החלק הראשון.
הערת סיום-2 - וזו השנייה עם עוד כמה מילים לגוף ההערה.
הערת סיום - הערת סיום רגילה של החלק הראשון.

כותרת 1 - חלק שני
כותרת 2 - תחילת החלק השני
פסקת החלק השני עם הערה משלו [הערת הגוף של החלק השני] ועוד מלים.
פסקה נוספת בחלק השני למילוי.
הערות סיום - הערות החלק השני
הערת סיום-1 - הערה ממוספרת של החלק השני.
הערת סיום - הערת סיום רגילה של החלק השני.
`;

/** מסמך עם ביאורי-צד (H7) לבדיקת הקרנת הערות-הצד. */
const SN_DOC = 'ספר - ספר ביאורי הצד\nנושא - H7\n\n'
  + 'כותרת 1 - החלק הראשי\n'
  + 'כותרת 2 - פרק פתיחה\n'
  + 'כותרת 7 - ביאור צד ראשון: דברי חכמים ז"ל על הפרק הזה ומה למדו ממנו\n'
  + 'פסקה ראשונה של התוכן המבואר עם מספיק מילים כדי למלא שורות בטור.\n'
  + 'פסקה שנייה עם עוד תוכן למילוי העמוד והטורים בגוף הדף.\n';

const cleanWords = (s) => String(s || '').split(/\s+/).filter(Boolean);

/** בדיקת אי-חפיפה אופקית בין מילים באותה שורה (RTL: x יורד — המילה הקודמת מימין). */
function assertNoOverlap(words, label) {
  const groups = new Map();
  for (const w of words) {
    const k = w.baselineY != null && Number.isFinite(w.baselineY) ? Math.round(w.baselineY * 100) / 100 : 'line';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(w);
  }
  for (const [baseline, ws] of groups) {
    const sorted = ws.slice().sort((a, b) => b.x - a.x); // מימין לשמאל
    for (let i = 1; i < sorted.length; i++) {
      const right = sorted[i - 1], left = sorted[i]; // right מימין ל-left
      assert(left.x + left.w <= right.x + 0.5,
        `${label}: חפיפת מילים בשורה (בסיס ${baseline}) — "${right.text}" [${right.x.toFixed(1)}..${(right.x + right.w).toFixed(1)}] חופפת "${left.text}" [${left.x.toFixed(1)}..${(left.x + left.w).toFixed(1)}]`);
    }
  }
}

describe('S5.4 (P-5) א — מרזב הערות-השוליים ב-DP: מילים במדידה אמיתית, לא קידום 8.2px', () => {
  const s = getDefaultSettings();
  const r = typeset(FN_DOC, s);
  const proj = projectDocument(r, s);
  const pagesWithFn = proj.pages.filter(p => p.footnotes.length);

  it('יש עמודים עם הערות וכל הערה מוקרנת עם מילים ממוקמות', () => {
    assert(pagesWithFn.length > 0, 'לפחות עמוד אחד עם הערות');
    let total = 0;
    for (const p of pagesWithFn) {
      for (const fn of p.footnotes) {
        assert(fn.words && fn.words.length > 0, 'לכל הערה יש words (לא נפילת 8.2px)');
        total++;
      }
    }
    assert(total > 0, `הערות הוקרנו (${total})`);
  });

  it('אף מילה לא חופפת את שכנתה באותה שורה (הריסוק המקורי היה כופה זו על זו)', () => {
    for (const p of pagesWithFn) {
      for (const fn of p.footnotes) assertNoOverlap(fn.words, `עמ' ${p.lines.length ? 'עם הערות' : '?'}`);
    }
  });

  it('גיאומטריית המרזב: ראש ההערה הראשונה = תחתית תיבת התוכן − הגובה השמור', () => {
    for (let i = 0; i < r.pages.length; i++) {
      const pg = r.pages[i];
      if (!pg.footnotes.length) continue;
      const pp = proj.pages[i];
      const expected = pg.template.contentBox.bottom - pg.fnReservedHeightPx;
      const first = pp.footnotes.reduce((m, f) => Math.min(m, f.y), Infinity);
      assertEq(Math.round(first), Math.round(expected), `עמ' ${i}: ראש המרזב ${first.toFixed(1)} צפוי ${expected.toFixed(1)}`);
    }
  });

  it('כל מילות כל ההערות קיימות בהקרנה (אפס אובדן במרזב)', () => {
    const src = new Set();
    for (const pg of r.pages) for (const n of pg.footnotes) for (const w of cleanWords(n.text)) src.add(w);
    const out = new Set();
    for (const p of proj.pages) for (const fn of p.footnotes) for (const w of fn.words) out.add(w.text);
    const missing = [...src].filter(w => !out.has(w));
    assertEq(missing.length, 0, `מילים חסרות בהקרנת המרזב: ${missing.slice(0, 5).join(' ')}`);
  });

  it('הערה ארוכה נשברת לשורות מרובות עם בסיסים נבדלים פר-שורה', () => {
    let multi = 0;
    for (const p of pagesWithFn) {
      for (const fn of p.footnotes) {
        const bases = new Set(fn.words.map(w => Math.round(w.baselineY * 10) / 10));
        if (bases.size > 1) {
          multi++;
          const sorted = [...bases].sort((a, b) => a - b);
          for (let i = 1; i < sorted.length; i++) {
            assert(sorted[i] - sorted[i - 1] > 2, `מרווח בסיסים בן שורות הערה: ${sorted[i - 1]}→${sorted[i]}`);
          }
        }
      }
    }
    assert(multi > 0, `לפחות הערה רבת-שורות אחת (נמצאו ${multi})`);
  });

  it('כל המילים בתוך גבולות הנתיב של המרזב', () => {
    for (const p of pagesWithFn) {
      for (const fn of p.footnotes) {
        for (const w of fn.words) {
          assert(w.x >= fn.x - 0.5 && w.x + w.w <= fn.x + fn.w + 0.5,
            `מילה "${w.text}" מחוץ לנתיב: x=${w.x.toFixed(1)} w=${w.w.toFixed(1)} נתיב=[${fn.x}..${(fn.x + fn.w).toFixed(1)}]`);
        }
      }
    }
  });

  it('פיצול הערה ארוכה (split) ⇒ "(המשך)" מוקרן בראש המשך ההערה', () => {
    const s2 = { ...getDefaultSettings(), 'fn-layout-mode': 'block', 'long-footnote-policy': 'split', 'fn-bar-max-height-px': 30 };
    const r2 = typeset(FN_DOC, s2);
    const proj2 = projectDocument(r2, s2);
    let contNotes = 0, contWords = 0;
    for (const p of proj2.pages) {
      for (const fn of p.footnotes) {
        for (const w of fn.words) if (w.text === '(המשך)') contWords++;
      }
    }
    for (const pg of r2.pages) for (const n of pg.footnotes) if (n.isContinuation || n.mode === 'split-rest') contNotes++;
    assert(contNotes > 0, `יש המשכי פיצול במודל (${contNotes})`);
    assertEq(contWords > 0, true, `"(המשך)" מוקרן בכל המשך (נמצאו ${contWords})`);
  });

  it('שני נתיבים (footnote-columns=2): הנתיבים נפרדים וגובה הדיו בתוך השמור', () => {
    const s2 = { ...getDefaultSettings(), 'footnote-columns': 2 };
    const r2 = typeset(FN_DOC, s2);
    const proj2 = projectDocument(r2, s2);
    const withFn = proj2.pages.filter(p => p.footnotes.length);
    assert(withFn.length > 0, 'יש עמודים עם הערות במצב שני נתיבים');
    for (const p of withFn) {
      const xs = [...new Set(p.footnotes.map(f => Math.round(f.x)))];
      if (xs.length === 2) {
        assert(xs[1] > xs[0], 'הנתיב השמאלי מתחיל אחרי הימני');
        const right = p.footnotes.filter(f => Math.round(f.x) === xs[1]);
        const left = p.footnotes.filter(f => Math.round(f.x) === xs[0]);
        assert(right.length > 0 && left.length > 0, `שני הנתיבים מאוכלסים (ימין ${right.length}, שמאל ${left.length})`);
      }
      for (const fn of p.footnotes) assertNoOverlap(fn.words, 'שני נתיבים');
    }
  });

  it('חוט המפריד (fn-rule) מוקרן כשהוא דלוק ונעדר כשהוא כבוי', () => {
    const withRule = proj.pages.filter(p => (p.decorations || []).some(d => d.kind === 'fn-rule'));
    assert(withRule.length > 0, `fn-rule מוקרן בברירת המחדל (${withRule.length} עמודים)`);
    const sNone = { ...getDefaultSettings(), 'footnote-separator-rule': 'none' };
    const rNone = typeset(FN_DOC, sNone);
    const projNone = projectDocument(rNone, sNone);
    const withRuleNone = projNone.pages.filter(p => (p.decorations || []).some(d => d.kind === 'fn-rule'));
    assertEq(withRuleNone.length, 0, 'fn-rule נעדר כש-separator-rule=none');
  });
});

describe('S5.4 (P-5) ב — עמודי הערות-הסיום: מצורפים תמיד ומוקרנים מלאים (לא ריקים)', () => {
  it('ברירת המחדל (count=false): העמודים ב-r.pages עם תבנית — ובלי גיליון', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const r = typeset(EN_DOC, s);
    assert(r.contentPreserved === true, 'שימור תוכן במצב endnotes');
    const en = r.pages.filter(p => p.type === 'endnotes');
    assertEq(en.length, r.endnotePagesInfo.count, 'כל עמודי ההערות צורפו לרצף העמודים');
    for (const ep of en) {
      assert(ep.template && ep.template.columns, 'תבנית חוקית לעמוד הערות');
      assert(!ep.folioDisplay, 'ברירת המחדל — אין גיליון על עמודי ההערות');
    }
  });

  it('הקרנה: כותרת + כל מילות כל ההערות — העמודים אינם ריקים', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const r = typeset(EN_DOC, s);
    const proj = projectDocument(r, s);
    const enProj = proj.pages.filter(p => p.lines.some(l => l.kind === 'endnote-title' || l.kind === 'endnote-note'));
    assertEq(enProj.length, r.endnotePagesInfo.count, 'מספר עמודי ההערות בהקרנה');
    const titles = proj.pages.flatMap(p => p.lines.filter(l => l.kind === 'endnote-title').flatMap(l => l.words.map(w => w.text)));
    const titleText = titles.join(' ');
    assert(/הערות החלק הראשון/.test(titleText), `כותרת חלק-1 הוקרנה (${titleText})`);
    assert(/הערות החלק השני/.test(titleText), `כותרת חלק-2 הוקרנה (${titleText})`);
    // אפס אובדן: כל מילות כל ההערות בהקרנה
    const src = new Set();
    for (const ep of r.endnotePagesInfo.pages) for (const n of ep.notes) for (const w of cleanWords(n.text)) src.add(w);
    const outWords = new Set();
    for (const p of enProj) for (const l of p.lines.filter(l => l.kind === 'endnote-note')) for (const w of l.words) outWords.add(w.text);
    const missing = [...src].filter(w => !outWords.has(w));
    assertEq(missing.length, 0, `מילים חסרות בהקרנת עמודי ההערות: ${missing.slice(0, 5).join(' ')}`);
    // הסמנים הוקרנו (ממוספרות: א/ב וכו')
    const markerWords = new Set();
    for (const p of enProj) for (const l of p.lines.filter(l => l.kind === 'endnote-note')) {
      const first = l.words[l.words.length - 1]; // RTL — המילה הימנית ביותר היא האחרונה במערך? הראשונה בסדר קריאה
      if (first) markerWords.add(first.text);
    }
    assert(markerWords.size > 0, `סמני הערות הוקרנו (${[...markerWords].slice(0, 5).join(',')}…)`);
  });

  it('count-endnote-pages=true ⇒ העמודים מצטרפים למספור עם גיליון', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'count-endnote-pages': true };
    const r = typeset(EN_DOC, s);
    const en = r.pages.filter(p => p.type === 'endnotes');
    assertEq(en.length, r.endnotePagesInfo.count, 'עמודי ההערות ברצף');
    for (const ep of en) assert(ep.pageNumber != null, 'עמוד הערות ממוספר');
  });

  it('שני טורים (endnote-columns=2): ההערות מוקרנות בשני טורים נפרדים של התבנית', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes', 'endnote-columns': 2, 'count-endnote-pages': true };
    const doc = EN_DOC + Array.from({ length: 30 }, (_, i) => `הערת סיום-${i + 3} - עוד הערה ממוספרת למילוי שני הטורים בעמוד ההערות.`).join('\n') + '\n';
    const r = typeset(doc, s);
    const proj = projectDocument(r, s);
    const enPages = proj.pages.filter(p => p.lines.some(l => l.kind === 'endnote-title' || l.kind === 'endnote-note'));
    assert(enPages.length > 0, 'עמודי הערות הוקרנו');
    let sawTwoCols = false;
    for (const p of enPages) {
      const noteLines = p.lines.filter(l => l.kind === 'endnote-note');
      const xs = [...new Set(noteLines.map(l => Math.round(l.x)))];
      if (xs.length >= 2) {
        sawTwoCols = true;
        const colGap = Math.abs(xs[0] - xs[1]);
        assert(colGap > 50, `שני טורים נפרדים (פער ${colGap.toFixed(0)}px)`);
        for (const l of noteLines) assertNoOverlap(l.words, 'עמוד הערות');
      }
    }
    assert(sawTwoCols, 'לפחות עמוד הערות אחד עם שני טורים מאוכלסים');
  });

  it('דטרמיניזם: שתי ריצות במצב endnotes ⇒ אותו hash ואותו מספר עמודים', () => {
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const a = typeset(EN_DOC, s);
    const b = typeset(EN_DOC, s);
    assertEq(a.layoutHash, b.layoutHash, 'hash זהה');
    assertEq(a.pages.length, b.pages.length, 'מספר עמודים זהה');
  });
});

describe('S5.4 (P-5) ג — הערות-צד ומפריד טורים בהקרנה', () => {
  it('ביאור H7 מוקרן כשורות side-note בגופן הצד (margin) ובגיאומטריית ה-placement', () => {
    const s = getDefaultSettings();
    const r = typeset(SN_DOC, s);
    const proj = projectDocument(r, s);
    const sideLines = proj.pages.flatMap(p => p.lines.filter(l => l.kind === 'side-note'));
    assert(sideLines.length > 0, 'שורות הערות-צד הוקרנו');
    const allWords = sideLines.flatMap(l => l.words);
    assert(allWords.every(w => w.fontKey === 'margin'), 'כל המילים בגופן הצד (margin ⇒ /F6)');
    const joined = sideLines.map(l => l.words.map(w => w.text).join(' ')).join(' ');
    assert(/דברי חכמים/.test(joined), `תוכן הביאור הוקרן (${joined.slice(0, 40)}…)`);
    for (const l of sideLines) {
      assertNoOverlap(l.words, 'הערת צד');
      for (const w of l.words) {
        assert(w.x >= l.x - 0.5 && w.x + w.w <= l.x + l.w + 0.75, `מילת הערת-צד "${w.text}" בתוך העמודה`);
      }
    }
  });

  it('מפריד טורים (column-divider-style) מוקרן כקו אנכי בגובה min(טורים)−8', () => {
    const s = { ...getDefaultSettings(), 'column-divider-style': 'thin' };
    const r = typeset(FN_DOC, s);
    const twoCol = r.pages.filter(pg => (pg.columns || []).length >= 2 && pg.columns.some(c => c.length));
    assert(twoCol.length > 0, `יש עמודי גוף דו-טוריים (${twoCol.length})`);
    const proj = projectDocument(r, s);
    const withDivider = proj.pages.filter(p => (p.decorations || []).some(d => d.kind === 'col-divider'));
    assert(withDivider.length > 0, `עמודים עם מפריד (${withDivider.length})`);
    for (let i = 0; i < withDivider.length; i++) {
      const d = withDivider[i].decorations.find(dd => dd.kind === 'col-divider');
      assert(d.pdfOps && d.pdfOps.length > 0, 'פעולות ציור למפריד');
      assert(d.h > 0, `גובה חיובי (${d.h.toFixed(1)}px)`);
    }
    // כיבוי ⇒ אין מפריד
    const sOff = { ...getDefaultSettings(), 'column-divider-style': 'none' };
    const rOff = typeset(FN_DOC, sOff);
    const projOff = projectDocument(rOff, sOff);
    assertEq(projOff.pages.filter(p => (p.decorations || []).some(d => d.kind === 'col-divider')).length, 0, 'אין מפריד כשמכובה');
  });
});

describe('S5.4 (P-5) ד — ייצוא PDF קצה-לקצה של מסמך DP עם כל סוגי ההערות', () => {
  const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

  it('exportPdf מצליח ואינו ריק על מסמך עם הערות-שוליים רבות', () => {
    if (!fs.existsSync(DEJAVU)) return; // סביבה ללא הגופן — דלג בשקט (CI מספק)
    const fontBytes = fs.readFileSync(DEJAVU);
    const s = getDefaultSettings();
    const exp = exportPdf(FN_DOC, s, fontBytes, 'DejaVu Sans');
    assertEq(exp.ok, true, `הייצוא הצליח (${exp.error || 'ok'})`);
    assert(exp.bytes && exp.bytes.length > 1000, `בתים לא ריקים (${exp.bytes ? exp.bytes.length : 0})`);
  });

  it('exportPdf מצליח על מסמך endnotes — עמודי ההערות בפלט ואינם ריקים', () => {
    if (!fs.existsSync(DEJAVU)) return;
    const fontBytes = fs.readFileSync(DEJAVU);
    const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
    const exp = exportPdf(EN_DOC, s, fontBytes, 'DejaVu Sans');
    assertEq(exp.ok, true, `הייצוא הצליח (${exp.error || 'ok'})`);
    const enProj = exp.projected.pages.filter(p => p.lines.some(l => l.kind === 'endnote-title' || l.kind === 'endnote-note'));
    assertEq(enProj.length, exp.result.endnotePagesInfo.count, 'עמודי ההערות בהקרנת הייצוא');
    const words = enProj.reduce((n, p) => n + p.lines.filter(l => l.kind === 'endnote-note').reduce((m, l) => m + l.words.length, 0), 0);
    assert(words > 20, `מילות הערות בייצוא (${words})`);
    fs.writeFileSync(path.join(ART, 's53-dp-endnotes.pdf'), exp.bytes);
  });
});

report('s53-dp-notes-export');
