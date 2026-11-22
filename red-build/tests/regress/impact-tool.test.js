// tests/regress/impact-tool.test.js — בדיקות לכלי ההשוואה tools/baseline/impact.js (סוכן 4)
//
// הכלי מריץ את אותו מסמך בשני עצים ומדווח השפעה (עמודים, hash, עמודים ששונו, רפאים/כפילות/אבודות, כיסוי הערות לפי עמוד,
// שמירת תוכן). הבדיקות כאן:
//   א. compare/formatRow — פונקציות טהורות: כל סוג רגרסיה מזוהה, שיפור אינו מסומן, ניטרליות מדויקת, חומרת "רפאים" (R-04 פתוח/סגור);
//   ב. הרצה מקצה לקצה: עץ מול עצמו ⇒ ניטרלי, קוד יציאה 0;
//   ג. **בקרה שלילית מקצה לקצה:** עץ מועמד מוטנט (עותק של המנוע שמעתיק בלוק הערות לעמוד שאין בו הפסקה) ⇒ הכלי חייב לזהות, קוד 3.
// בלי הבקרה (ג) ירוק של הכלי לא מוכיח דבר — היא מראה שהכלי באמת מגיב לשינוי במנוע.
//
// מדדי הערות-סיום / הערות-צד / שמירת תוכן (תוספת; ראו tools/baseline/impact.js):
//   ד. compare — הערות-סיום והערות-צד מול המקור (srcNotes): כל סוג הפרה מזוהה בהודעה מדויקת; ירידה (תיקון R-05) אינה מסומנת; הערות-צד נבדקות
//      רק כשהמודל מיושר לטוקני המנוע, ואובדן יישור הוא רגרסיה; אובייקטים בלי srcNotes אינם מפילים;
//   ה. contentMetrics — שני מדדי שמירת-התוכן שהיו מתים (תמיד 0, כי נקראו משדות שגויים) נבדקים מול המבנה האמיתי של תוצאת המנוע;
//   ו. srcNotesMetrics מול המנוע החי על מסמכים זעירים (יישור plain / metaAnywhere / זנב סינתטי), ו**קטלוג המוטציות** (lib/impact-mutations.js)
//      על תוצאה חיה של canonical: כל מוטציה מפעילה בדיוק את המדד שהוגדר לה — ואף מדד אחר;
//   ז. מקצה לקצה: אותו קטלוג בעץ מוטנט (IMPACT_MUT) — impact.js חייב לצאת בקוד 3 עם ההודעות האלה בדיוק; ועטיפת המוטציות לבדה ניטרלית.
// שום בדיקה כאן אינה נשענת על מצב R-05 (פתוח/מתוקן): הערות-סיום רצופות נבדקות כשוויון חשבונאי, והמוטציות פועלות על canonical שאינו נושא את הבאג.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TOOL = path.join(REPO_ROOT, 'tools', 'baseline', 'impact.js');
const { compare, formatRow, multisetMinus, parseArgs, measureResult, contentMetrics, srcNotesMetrics } = require(TOOL);
const O = require(path.join(__dirname, 'lib', 'source-oracle.js'));
const MUT_PATH = path.join(__dirname, 'lib', 'impact-mutations.js');
const { MUTATIONS, wrapperSource } = require(MUT_PATH);

const mk = (over = {}) => ({
  pages: 10, layoutHash: 'h1', sig: ['a', 'b', 'c'],
  notes: { ghost: 0, dup: 0, lost: 0, order: 0, emissions: 5, legal: 5, repeats: 0 },
  coverage: { pairs: 5, missing: 0 },
  content: { preserved: true, missingWords: 0, ledgerIssues: 0 },
  detail: { ghost: [], missing: [] },
  ...over,
});
const withNotes = (o) => mk({ notes: { ...mk().notes, ...o } });

describe('impact.js · compare — ניטרליות ושינוי עימוד', () => {
  it('זהה לחלוטין ⇒ ניטרלי, בלי רגרסיה ובלי תנודה', () => {
    const c = compare(mk(), mk());
    assert(c.neutral && c.changed === 0 && c.hashSame, 'ניטרלי');
    assertEq(c.regress.length + c.warn.length, 0, 'אין דגלים');
  });
  it('חתימת עמוד שונה ⇒ לא ניטרלי, מספר ועמוד ראשון נכונים, אך אין רגרסיה', () => {
    const c = compare(mk(), mk({ sig: ['a', 'X', 'c'] }));
    assert(!c.neutral, 'לא ניטרלי');
    assertEq(c.changed, 1, 'עמוד אחד שונה');
    assertEq(c.first, 2, 'עמוד ראשון 2');
    assertEq(c.regress.length, 0, 'שינוי עימוד אינו רגרסיה כשלעצמו');
  });
  it('מספר עמודים ו-hash שונים ⇒ לא ניטרלי, בלי רגרסיה', () => {
    const c = compare(mk(), mk({ pages: 11, layoutHash: 'h2', sig: ['a', 'b', 'c', 'd'] }));
    assert(!c.neutral && !c.hashSame && c.pagesB === 11, 'לא ניטרלי');
    assertEq(c.regress.length, 0, 'אין רגרסיה');
  });
});

describe('impact.js · compare — רגרסיות באורקל (כל סוג מזוהה; שיפור אינו מסומן)', () => {
  for (const k of ['lost', 'dup', 'order']) {
    it(`${k} עלה ⇒ רגרסיה; ירד ⇒ נקי`, () => {
      assert(compare(withNotes({}), withNotes({ [k]: 1 })).regress.some((x) => x.startsWith(k)), 'עלייה מזוהה');
      assertEq(compare(withNotes({ [k]: 2 }), withNotes({ [k]: 1 })).regress.length, 0, 'ירידה אינה רגרסיה');
    });
  }
  it('כיסוי-הערות חסר עלה (1→46 — המלכודת של R-04) ⇒ רגרסיה; ירד ⇒ נקי', () => {
    const a = mk({ coverage: { pairs: 176, missing: 1 } });
    assert(compare(a, mk({ coverage: { pairs: 180, missing: 46 } })).regress.some((x) => /כיסוי/.test(x)), 'עלייה מזוהה');
    assertEq(compare(mk({ coverage: { pairs: 5, missing: 3 } }), mk({ coverage: { pairs: 5, missing: 1 } })).regress.length, 0, 'ירידה אינה רגרסיה');
  });
  it('contentPreserved true→false, מילים חסרות ו-ledger issues ⇒ רגרסיה', () => {
    assert(compare(mk(), mk({ content: { preserved: false, missingWords: 0, ledgerIssues: 0 } })).regress.some((x) => /contentPreserved/.test(x)), 'contentPreserved');
    assert(compare(mk(), mk({ content: { preserved: true, missingWords: 2, ledgerIssues: 0 } })).regress.some((x) => /מילים חסרות/.test(x)), 'מילים חסרות');
    assert(compare(mk(), mk({ content: { preserved: true, missingWords: 0, ledgerIssues: 3 } })).regress.some((x) => /ledger/.test(x)), 'ledger');
  });
});

describe('impact.js · compare — חומרת "רפאים" (R-04): תנודה כשפתוח, רגרסיה כשה-base נקי', () => {
  it('base עם רפאים (R-04 פתוח), עלייה ⇒ תנודה בלבד (warn), לא רגרסיה', () => {
    const c = compare(withNotes({ ghost: 9 }), withNotes({ ghost: 10 }), { ghostHard: false });
    assertEq(c.regress.length, 0, 'לא רגרסיה');
    assert(c.warn.length === 1 && /9→10/.test(c.warn[0]), 'תנודה מדווחת');
  });
  it('base נקי מרפאים בכל המטריצה (ghostHard) ⇒ כל רפאה חדשה היא רגרסיה', () => {
    const c = compare(withNotes({ ghost: 0 }), withNotes({ ghost: 1 }), { ghostHard: true });
    assert(c.regress.some((x) => /רפאים 0→1/.test(x)), 'רגרסיה');
  });
  it('ירידה ברפאים (תיקון R-04) אינה מסומנת בשום מצב', () => {
    for (const ghostHard of [false, true]) {
      const c = compare(withNotes({ ghost: 15 }), withNotes({ ghost: 0 }), { ghostHard });
      assertEq(c.regress.length + c.warn.length, 0, `ghostHard=${ghostHard}`);
    }
  });
});

describe('impact.js · עזרים', () => {
  it('formatRow: חץ רק איפה שיש שינוי; ⚠ לרגרסיה; ~ לתנודה', () => {
    const neutral = formatRow('approx · x', compare(mk(), mk()));
    assert(/ללא שינוי/.test(neutral) && !/→/.test(neutral) && !/⚠/.test(neutral), `שורה ניטרלית: ${neutral}`);
    const bad = formatRow('approx · y', compare(mk(), mk({ pages: 12, coverage: { pairs: 5, missing: 4 } })));
    assert(/10→12/.test(bad) && /⚠ רגרסיה/.test(bad), `שורת רגרסיה: ${bad}`);
    const warn = formatRow('real · z', compare(withNotes({ ghost: 1 }), withNotes({ ghost: 2 }), { ghostHard: false }));
    assert(/~ רפאים 1→2/.test(warn), `שורת תנודה: ${warn}`);
  });
  it('multisetMinus: הפרש מרובה-קבוצות לפי מפתח', () => {
    const k = (x) => x;
    assertEq(JSON.stringify(multisetMinus(['a', 'a', 'b'], ['a'], k)), JSON.stringify(['a', 'b']), 'שארית');
    assertEq(multisetMinus(['a'], ['a', 'a'], k).length, 0, 'ריק');
  });
  it('parseArgs: פרמטרים, ופרמטר לא מוכר נכשל', () => {
    const o = parseArgs(['--base', '/b', '--cand', '/c', '--docs', 'no_long,canonical', '--expect-neutral', 'no_long', '--details']);
    assertEq(o.base, '/b', 'base'); assertEq(o.cand, '/c', 'cand');
    assertEq(o.docs.join(','), 'no_long,canonical', 'docs'); assertEq(o.neutral.join(','), 'no_long', 'neutral'); assert(o.details, 'details');
    let threw = false; try { parseArgs(['--nope']); } catch (e) { threw = true; }
    assert(threw, 'פרמטר לא מוכר נזרק');
  });
});

// ───────────────────────── הערות-סיום / הערות-צד / שמירת תוכן ─────────────────────────
const mkSrc = (over = {}) => ({
  aligned: true, model: 'plain', modelTokens: 100, engineTokens: 100,
  end: { source: 8, emitted: 8, lost: 0, extra: 0, order: 0, marker: 0 },
  side: { source: 8, LOST: 0, PAGE: 0, DUP: 0, TEXT: 0 },
  detail: { endLost: [], endExtra: [] },
  ...over,
});
const srcAs = (o) => mk({ srcNotes: mkSrc(o) });
const srcEnd = (o) => srcAs({ end: { ...mkSrc().end, ...o } });
const srcSide = (o) => srcAs({ side: { ...mkSrc().side, ...o } });
const flags = (c) => c.regress.concat(c.warn);
const UNALIGNED = { aligned: false, model: null, engineTokens: 101, side: null };

describe('impact.js · compare — הערות-סיום מול המקור (R-05)', () => {
  it('זהה ⇒ בלי דגלים', () => {
    assertEq(flags(compare(srcEnd({}), srcEnd({}))).length, 0, 'אין דגלים');
  });
  for (const [k, he] of [['lost', 'אבודות'], ['extra', 'כפולות/שגויות'], ['order', 'בסדר שונה'], ['marker', 'עם סמנים כפולים/חסרים']]) {
    it(`${k} עלה ⇒ רגרסיה בהודעה מדויקת; ירד ⇒ נקי (שיפור אינו מסומן)`, () => {
      assertEq(compare(srcEnd({}), srcEnd({ [k]: 2 })).regress.join('|'), `הערות-סיום ${he} 0→2`, 'הודעה');
      assertEq(flags(compare(srcEnd({ [k]: 2 }), srcEnd({}))).length, 0, 'ירידה');
    });
  }
  it('R-05 מתוקן (אבודות 52→0, נפלטו 17→69) ⇒ שיפור: אין רגרסיה ואין תנודה', () => {
    const base = srcEnd({ source: 69, emitted: 17, lost: 52 });
    const cand = srcEnd({ source: 69, emitted: 69, lost: 0 });
    assertEq(flags(compare(base, cand)).length, 0, 'שיפור');
  });
  it('אבודות ירדו אבל כפולות עלו ⇒ רגרסיה על הכפולות בלבד (אין קיזוז בין מדדים)', () => {
    assertEq(compare(srcEnd({ lost: 5 }), srcEnd({ lost: 0, extra: 3 })).regress.join('|'), 'הערות-סיום כפולות/שגויות 0→3', 'רק הכפולות');
  });
});

describe('impact.js · compare — הערות-צד: נבדקות רק כשהמודל מיושר; אובדן יישור הוא רגרסיה', () => {
  for (const [k, he] of [['LOST', 'אבודות'], ['PAGE', 'בעמוד שגוי'], ['DUP', 'כפולות'], ['TEXT', 'עם טקסט זר']]) {
    it(`${k} עלה ⇒ רגרסיה בהודעה מדויקת; ירד ⇒ נקי`, () => {
      assertEq(compare(srcSide({}), srcSide({ [k]: 2 })).regress.join('|'), `הערות-צד ${he} 0→2`, 'הודעה');
      assertEq(flags(compare(srcSide({ [k]: 2 }), srcSide({}))).length, 0, 'ירידה');
    });
  }
  it('הפרות שכבר קיימות ב-base (O-5: 19 אבודות + 19 טקסט זר) ואינן עולות ⇒ לא רגרסיה; רק עלייה נחשבת', () => {
    assertEq(flags(compare(srcSide({ LOST: 19, TEXT: 19 }), srcSide({ LOST: 19, TEXT: 19 }))).length, 0, 'קבוע');
    assertEq(compare(srcSide({ LOST: 19, TEXT: 19 }), srcSide({ LOST: 20, TEXT: 19 })).regress.join('|'), 'הערות-צד אבודות 19→20', 'עלייה אחת');
  });
  it('base מיושר ← candidate לא מיושר ⇒ רגרסיה יחידה: מספר הטוקנים השתנה + הערות-צד לא ניתנות לבדיקה; ספירות הצד אינן מושוות', () => {
    const c = compare(srcAs({}), srcAs(UNALIGNED));
    assertEq(c.regress.length, 1, `רגרסיה יחידה: ${JSON.stringify(c.regress)}`);
    assertEq(c.regress[0], 'מספר הטוקנים השתנה 100→101 (פענוח המקור השתנה — מודל המקור כבר אינו מיושר, הערות-צד לא ניתנות לבדיקה)', 'הודעה');
  });
  it('המודל "מתיישר מחדש" (meta-anywhere→plain) רק כי הספירה החדשה זהה למודל האחר ⇒ עדיין רגרסיה — החור שהבקרה השלילית חשפה', () => {
    const base = srcAs({ model: 'meta-anywhere', modelTokens: 164, engineTokens: 164 });
    const cand = srcAs({ model: 'plain', modelTokens: 165, engineTokens: 165 });
    assertEq(compare(base, cand).regress.join('|'), 'מספר הטוקנים השתנה 164→165 (פענוח המקור השתנה)', 'הודעה');
  });
  it('אובדן יישור אינו מסתיר הערות-סיום שאבדו: שתי הרגרסיות מדווחות', () => {
    const c = compare(srcAs({}), srcAs({ ...UNALIGNED, end: { ...mkSrc().end, lost: 3 } }));
    assertEq(c.regress.length, 2, `שתיים: ${JSON.stringify(c.regress)}`);
    assert(c.regress.some((x) => x === 'הערות-סיום אבודות 0→3'), 'הערות-סיום');
  });
  it('שניהם לא מיושרים באותו מספר טוקנים ⇒ אין דגל על הצד, אבל הערות-הסיום עדיין מושוות', () => {
    assertEq(flags(compare(srcAs(UNALIGNED), srcAs(UNALIGNED))).length, 0, 'ניטרלי');
    assertEq(compare(srcAs(UNALIGNED), srcAs({ ...UNALIGNED, end: { ...mkSrc().end, lost: 1 } })).regress.join('|'), 'הערות-סיום אבודות 0→1', 'סיום נבדק');
  });
  it('שניהם לא מיושרים (long_no_paren) אך מספר הטוקנים השתנה ⇒ רגרסיה גם בלי יישור', () => {
    const c = compare(srcAs({ ...UNALIGNED, engineTokens: 2988 }), srcAs({ ...UNALIGNED, engineTokens: 2990 }));
    assertEq(c.regress.join('|'), 'מספר הטוקנים השתנה 2988→2990 (פענוח המקור השתנה)', 'הודעה');
  });
  it('base לא מיושר ← candidate מיושר (מספר הטוקנים השתנה) ⇒ רגרסיה על מספר הטוקנים; ספירות הצד אינן מושוות (אין ל-base)', () => {
    const c = compare(srcAs(UNALIGNED), srcSide({ LOST: 7 }));
    assertEq(c.regress.join('|'), 'מספר הטוקנים השתנה 101→100 (פענוח המקור השתנה)', 'הודעה');
  });
  it('אובייקטים בלי srcNotes (תוצאת עובד מגרסה ישנה), בצד אחד או בשניים ⇒ בלי קריסה ובלי דגלים', () => {
    assertEq(flags(compare(mk(), mk())).length, 0, 'שניהם');
    assertEq(flags(compare(mk(), srcEnd({ lost: 9 }))).length, 0, 'רק במועמד');
    assertEq(flags(compare(srcEnd({ lost: 9 }), mk())).length, 0, 'רק ב-base');
  });
});

describe('impact.js · formatRow — הערות-סיום והערות-צד בדוח', () => {
  it('R-05 נראה בדוח עצמו: "סיום-אבודות 52→0"; הצד מוצג כסכום הפרות', () => {
    const row = formatRow('approx · generator', compare(srcEnd({ lost: 52 }), srcEnd({})));
    assert(/סיום-אבודות 52→0/.test(row) && /צד-הפרות 0/.test(row), row);
    const side = formatRow('approx · long', compare(srcSide({ LOST: 19, TEXT: 19 }), srcSide({ LOST: 19, TEXT: 19 })));
    assert(/צד-הפרות 38/.test(side), side);
  });
  it('מסמך לא מיושר מוצג "לא נבדק" — לא 0', () => {
    const row = formatRow('approx · long_no_paren', compare(srcAs(UNALIGNED), srcAs(UNALIGNED)));
    assert(/צד-הפרות לא נבדק/.test(row) && !/צד-הפרות 0/.test(row), row);
  });
  it('בלי srcNotes אין קטע הערות (תאימות לאובייקטים ישנים) וההפרדה בין השורה לדגל הרגרסיה נשמרת', () => {
    const row = formatRow('approx · x', compare(mk(), mk({ pages: 12, coverage: { pairs: 5, missing: 4 } })));
    assert(!/סיום-אבודות|צד-הפרות/.test(row), row);
    assert(/10→12/.test(row) && /⚠ רגרסיה/.test(row), row);
  });
});

// ── הרצת approx בתוך התהליך (כמו ה-worker של הכלי) ──
const PFX = 'הערת סיום -';
const CANON = fs.readFileSync(path.join(REPO_ROOT, 'red-build', 'tests', 'fixtures', 'canonical_corpus.txt'), 'utf8');
let _approx = null;
function approx(text) {
  if (!_approx) {
    const RB = path.join(REPO_ROOT, 'red-build');
    const { legacyTypeset } = require(path.join(RB, 'src/engine/layout/legacy-imud-flow'));
    const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
    const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
    const def = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
    const st = importImudSettings(def, new Set(getSettingDefs().map((r) => r.id)), {}).settings;
    _approx = (t) => legacyTypeset(t, st, {});
  }
  return _approx(text);
}

describe('impact.js · contentMetrics — שני המדדים שהיו מתים (תמיד 0)', () => {
  const led = (kinds, asMap) => { const arr = kinds.map((kind, i) => ({ issue_id: `${kind}#${i}`, kind })); return asMap ? new Map(arr.map((x) => [x.issue_id, x])) : arr; };
  it('missingWords = contentStats.missingCount (השדה האמיתי); contentStats.missing רק כגיבוי לעץ ישן', () => {
    assertEq(contentMetrics({ contentStats: { missingCount: 4 } }).missingWords, 4, 'missingCount');
    assertEq(contentMetrics({ contentStats: { missingCount: 0, missing: ['a'] } }).missingWords, 0, 'missingCount גובר');
    assertEq(contentMetrics({ contentStats: { missing: ['a', 'b'] } }).missingWords, 2, 'גיבוי');
    assertEq(contentMetrics({}).missingWords, 0, 'ריק');
  });
  it('ledgerIssues סופר רק content-loss — גם ב-Map (מופע Ledger חי) וגם במערך (toJSON); column-imbalance הוא מידע', () => {
    const kinds = ['column-imbalance', 'content-loss', 'column-imbalance', 'content-loss', 'content-loss'];
    assertEq(contentMetrics({ ledger: { issues: led(kinds, true) } }).ledgerIssues, 3, 'Map');
    assertEq(contentMetrics({ ledger: { issues: led(kinds, false) } }).ledgerIssues, 3, 'מערך');
    assertEq(contentMetrics({ ledger: { issues: led(['column-imbalance'], true) } }).ledgerIssues, 0, 'מידע בלבד');
    assertEq(contentMetrics({ ledger: {} }).ledgerIssues, 0, 'בלי issues');
  });
  it('preserved נגזר מ-contentPreserved !== false', () => {
    assertEq(contentMetrics({ contentPreserved: true }).preserved, true, 'true');
    assertEq(contentMetrics({ contentPreserved: false }).preserved, false, 'false');
  });
  it('מול תוצאת מנוע חיה: המבנה שהכלי מניח נכון — אם המנוע ישנה אותו הבדיקה נכשלת, ולא המדד שנשאר 0 בשקט', () => {
    const r = approx(CANON);
    assert(r.ledger.issues instanceof Map && r.ledger.issues.size > 0, 'ledger.issues הוא Map לא ריק (column-imbalance) — המדד הישן בדק Array.isArray ונשאר 0 תמיד');
    assert(Number.isFinite(r.contentStats.missingCount), 'contentStats.missingCount מספר — המדד הישן קרא contentStats.missing שאינו קיים');
    assertEq(JSON.stringify(contentMetrics(r)), '{"preserved":true,"missingWords":0,"ledgerIssues":0}', 'canonical נקי');
  });
});

describe('impact.js · srcNotesMetrics — מול המנוע החי (מסמכים זעירים)', () => {
  const metrics = (doc) => srcNotesMetrics(O, doc, approx(doc), PFX);
  const TINY = ['כותרת 2 - פרק ראשון', 'כותרת 7 - ביאור צד לפסקה הראשונה', 'פסקה ראשונה של הדוגמה עם כמה מילים כדי שתהיה לה שורה שלמה בעמוד הבדיקה.',
    'הערת סיום - הערה ראשונה בסוף הספר', 'פסקה שניה של הדוגמה עם עוד מילים כדי שתהיה לה שורה שלמה בעמוד הבדיקה.', 'הערת סיום - הערה שניה בסוף הספר', 'פסקה שלישית ואחרונה של הדוגמה.'].join('\n');
  it('מסמך תקין: מיושר (plain), הערות-סיום 2/2 בלי אבודות או כפולות, הערות-צד בלי הפרות', () => {
    const m = metrics(TINY);
    assert(m.aligned && m.model === 'plain', `מיושר plain: ${m.model}`);
    assertEq(JSON.stringify(m.end), '{"source":2,"emitted":2,"lost":0,"extra":0,"order":0,"marker":0}', 'סיום');
    assertEq(JSON.stringify(m.side), '{"source":1,"LOST":0,"PAGE":0,"DUP":0,"TEXT":0}', 'צד');
  });
  it('שורת מטא-דאטה באמצע המסמך: המודל הרגיל אינו מיושר והכלי עובר ל-metaAnywhere (O-6)', () => {
    const m = metrics(['כותרת 2 - פרק', 'כותרת 7 - צד', 'פסקה א', 'נושא - באמצע', 'פסקה ב', 'הערת סיום - סוף'].join('\n'));
    assert(m.aligned && m.model === 'meta-anywhere', `meta-anywhere: ${m.model}`);
    assertEq(m.side.LOST + m.side.PAGE + m.side.DUP + m.side.TEXT, 0, 'צד נקי');
  });
  it('הערת-צד בסוף המסמך (בלי פסקה אחריה) ⇒ זנב סינתטי: מיושר (טוקן נוסף) וללא הפרות', () => {
    const m = metrics(['כותרת 2 - פרק', 'פסקה א', 'כותרת 7 - זנב'].join('\n'));
    assert(m.aligned && m.modelTokens === m.engineTokens && m.engineTokens === 3, `זנב: ${m.modelTokens}/${m.engineTokens}`);
    assertEq(m.side.LOST, 0, 'הערת הזנב נפלטה');
  });
  it('הערות-סיום רצופות: lost + (emitted − extra) = source — נכון בין אם R-05 פתוח ובין אם תוקן (הבדיקה אינה נשענת על מצב הבאג)', () => {
    const m = metrics(['כותרת 2 - פרק', 'פסקה א', 'הערת סיום - א1', 'הערת סיום - ב1', 'הערת סיום - ג1', 'פסקה ב'].join('\n')).end;
    assertEq(m.source, 3, 'שלוש שורות במקור');
    assertEq(m.lost + (m.emitted - m.extra), m.source, `חשבונאות שורות: ${JSON.stringify(m)}`);
  });
  it('מפתח הערת-הסיום מנורמל בשני הצדדים: סימן פיסוק שעומד לבד ברשימת המילים בפלט אינו יוצר אבודה/עודפת כוזבות', () => {
    const doc = ['כותרת 2 - פרק', 'פסקה א', 'הערת סיום - טקסט , עם פסיק ?', 'פסקה ב'].join('\n');
    const r = approx(doc);
    const item = r.pages.find((p) => p.type === 'endnotes').columns.flat().find((it) => it.kind === 'paragraph');
    item.words = [item.words[item.markerIdx[0]], 'טקסט', ',', 'עם', 'פסיק', '?']; // כאילו המנוע פלט פיסוק כמילים נפרדות; המקור זהה לאחר נרמול
    item.markerIdx = [0];
    const m = srcNotesMetrics(O, doc, r, PFX).end;
    assertEq(JSON.stringify(m), '{"source":1,"emitted":1,"lost":0,"extra":0,"order":0,"marker":0}', 'אין הפרות כוזבות');
  });
  it('canonical: מיושר רק עם metaAnywhere ונקי בכל מדדי ההערות — הנחת קטלוג המוטציות', () => {
    const m = metrics(CANON);
    assert(m.aligned && m.model === 'meta-anywhere', `canonical: ${m.model}`);
    assertEq(JSON.stringify(m.end), '{"source":8,"emitted":8,"lost":0,"extra":0,"order":0,"marker":0}', 'סיום');
    assertEq(JSON.stringify(m.side), '{"source":8,"LOST":0,"PAGE":0,"DUP":0,"TEXT":0}', 'צד');
  });
  it('לא מיושר ⇒ side=null ("לא נבדק") אבל הערות-הסיום עדיין מחושבות ושוות לאלה שלפני ההשחתה', () => {
    const r = approx(TINY), before = srcNotesMetrics(O, TINY, r, PFX);
    MUTATIONS['extra-token'].mutate(r);
    const after = srcNotesMetrics(O, TINY, r, PFX);
    assertEq(after.aligned, false, 'לא מיושר');
    assertEq(after.side, null, 'side=null');
    assertEq(JSON.stringify(after.end), JSON.stringify(before.end), 'הערות-הסיום אינן תלויות ביישור');
  });
});

describe('impact.js · בקרות שליליות בתוך התהליך — קטלוג המוטציות על תוצאה חיה של canonical', () => {
  let _base = null;
  const baseM = () => (_base = _base || measureResult(O, approx(CANON), CANON, PFX));
  it('בקרה ניטרלית: הרצה שנייה לא-מושחתת של אותו מסמך ⇒ זהה, בלי דגלים (המדדים דטרמיניסטיים)', () => {
    const c = compare(baseM(), measureResult(O, approx(CANON), CANON, PFX));
    assert(c.neutral, 'ניטרלי');
    assertEq(flags(c).length, 0, 'אין דגלים');
  });
  it('המונים מדווחים, לא רק ההודעות: drop-endnote ⇒ נפלטו 7 מתוך 8 (אבודה 1); dup-endnote ⇒ נפלטו 9 מתוך 8 (עודפת 1)', () => {
    for (const [name, want] of [['drop-endnote', { source: 8, emitted: 7, lost: 1, extra: 0 }], ['dup-endnote', { source: 8, emitted: 9, lost: 0, extra: 1 }]]) {
      const r = approx(CANON);
      MUTATIONS[name].mutate(r);
      const e = measureResult(O, r, CANON, PFX).srcNotes.end;
      for (const k of Object.keys(want)) assertEq(e[k], want[k], `${name}: end.${k}`);
    }
  });
  for (const [name, M] of Object.entries(MUTATIONS)) {
    it(`${name} — ${M.what}`, () => {
      const r = approx(CANON);
      M.mutate(r);
      const c = compare(baseM(), measureResult(O, r, CANON, PFX));
      for (const e of M.expect) assert(c.regress.includes(e), `חסרה הודעה "${e}"; התקבל: ${JSON.stringify(c.regress)}`);
      if (M.only) assertEq(c.regress.length, M.expect.length, `הודעות נוספות או חסרות: ${JSON.stringify(c.regress)}`);
      assertEq(c.warn.length, 0, `אין תנודות: ${JSON.stringify(c.warn)}`);
    });
  }
});

// ───────────────────────── מקצה לקצה ─────────────────────────
const runTool = (args, env) => {
  const e = { ...process.env };
  delete e.IMPACT_MUT; // בקרה ניטרלית חייבת להיות באמת בלי מוטציה, גם אם המשתנה דלף מהסביבה
  return spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 120000, env: Object.assign(e, env || {}) });
};

describe('impact.js · מקצה לקצה', () => {
  it('עץ מול עצמו (canonical, approx) ⇒ ניטרלי, קוד 0, בלי רגרסיות', () => {
    const r = runTool(['--base', REPO_ROOT, '--cand', REPO_ROOT, '--docs', 'canonical', '--modes', 'approx', '--expect-neutral', 'canonical']);
    assertEq(r.status, 0, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert(/ללא שינוי/.test(r.stdout) && /רגרסיות באורקל: 0/.test(r.stdout), `פלט: ${r.stdout}`);
  });

  it('בקרה שלילית: עץ מועמד מוטנט (בלוק הערות מועתק לעמוד שאין בו הפסקה) ⇒ הכלי מזהה, קוד 3', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'impact-mut-'));
    try {
      const src = path.join(REPO_ROOT, 'red-build', 'src');
      fs.cpSync(src, path.join(tmp, 'red-build', 'src'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'red-build', 'ui', 'assets', 'imud'), { recursive: true });
      fs.copyFileSync(path.join(REPO_ROOT, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'), path.join(tmp, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'));
      const eng = path.join(tmp, 'red-build', 'src', 'engine', 'layout', 'legacy-imud-flow.js');
      fs.appendFileSync(eng, `
;(function () { // מוטציה (בדיקה בלבד): מעתיק את בלוק ההערות של העמוד הראשון שיש בו הערות לעמוד אחרון שאין בו — רפאה
  const orig = module.exports.legacyTypeset;
  module.exports.legacyTypeset = function () {
    const r = orig.apply(this, arguments);
    const src = r.pages.findIndex((p) => (p.footnotes || []).some((f) => f.lines && f.lines.length));
    let dst = -1;
    for (let i = r.pages.length - 1; i > src + 1; i--) if (!(r.pages[i].footnotes || []).length) { dst = i; break; }
    if (src >= 0 && dst > 0) r.pages[dst].footnotes = JSON.parse(JSON.stringify(r.pages[src].footnotes));
    return r;
  };
})();
`);
      const r = runTool(['--base', REPO_ROOT, '--cand', tmp, '--docs', 'canonical', '--modes', 'approx']);
      assertEq(r.status, 3, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
      assert(/⚠ רגרסיה: רפאים 0→1/.test(r.stdout), `חייב לדווח רפאה חדשה: ${r.stdout}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});


// ── קטלוג המוטציות מקצה לקצה: עץ מוטנט אחד משותף (העתק של src/ שבו legacyTypeset מחיל את המוטציה שב-IMPACT_MUT) ──
let _mutTree = null;
function mutantTree() {
  if (_mutTree) return _mutTree;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'impact-mut-cat-'));
  fs.cpSync(path.join(REPO_ROOT, 'red-build', 'src'), path.join(tmp, 'red-build', 'src'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'red-build', 'ui', 'assets', 'imud'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'), path.join(tmp, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'));
  fs.appendFileSync(path.join(tmp, 'red-build', 'src', 'engine', 'layout', 'legacy-imud-flow.js'), wrapperSource(MUT_PATH));
  process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ניקוי בלבד */ } });
  return (_mutTree = tmp);
}
function runMutant(label, env) {
  const dir = mutantTree();
  const json = path.join(dir, `out-${label}.json`);
  const r = runTool(['--base', REPO_ROOT, '--cand', dir, '--docs', 'canonical', '--modes', 'approx', '--json', json], env);
  assert(fs.existsSync(json), `הכלי לא כתב JSON (קוד ${r.status})\n${r.stdout}\n${r.stderr}`);
  return { r, row: JSON.parse(fs.readFileSync(json, 'utf8')).rows[0] };
}

describe('impact.js · בקרות שליליות מקצה לקצה — קטלוג המוטציות בעץ מוטנט (IMPACT_MUT)', () => {
  it('עטיפת המוטציות לבדה (בלי IMPACT_MUT) ⇒ ניטרלי, קוד 0 — כל ההפרות שלהלן נגרמות מהמוטציה ולא מהעתק העץ', () => {
    const { r, row } = runMutant('noop', {});
    assertEq(r.status, 0, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert(row.changed === 0 && row.hashSame && row.regress.length === 0 && row.warn.length === 0, `אמור להיות ניטרלי: ${JSON.stringify(row.regress)}`);
    assert(row.srcNotesA && row.srcNotesB && row.srcNotesB.end && row.srcNotesB.side, 'שדות ה-JSON התוספתיים srcNotesA/srcNotesB קיימים (הממשק הקיים של rows לא נשבר)');
    for (const k of ['notesA', 'notesB', 'coverageA', 'coverageB', 'contentA', 'contentB']) assert(row[k], `השדה הקיים ${k} נשמר`);
  });
  for (const [name, M] of Object.entries(MUTATIONS)) {
    it(`${name} ⇒ ${M.expect.length ? 'קוד 3 וההודעות שהוגדרו לו' : 'קוד 0 (מידע בלבד — לא רגרסיה)'}`, () => {
      const { r, row } = runMutant(name, { IMPACT_MUT: name });
      assertEq(r.status, M.expect.length ? 3 : 0, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
      for (const e of M.expect) assert(row.regress.includes(e), `חסרה הודעה "${e}"; התקבל: ${JSON.stringify(row.regress)}`);
      if (M.only) assertEq(row.regress.length, M.expect.length, `הודעות נוספות או חסרות: ${JSON.stringify(row.regress)}`);
      for (const e of M.expect) assert(r.stdout.includes(e), `ההודעה "${e}" חייבת להופיע גם בפלט הקונסולה\n${r.stdout}`);
    });
  }
});

function runPair(base, cand, env, extra) {
  return runTool(['--base', base, '--cand', cand, '--docs', 'canonical', '--modes', 'approx', ...(extra || [])], env);
}

describe('impact.js · הערות — כיוון הפוך ופלט הקונסולה (על עץ מוטנט)', () => {
  it('כיוון הפוך = תיקון בסגנון R-05: base מאבד הערת-סיום, המועמד מחזיר אותה ⇒ קוד 0, בלי רגרסיה; --details מראה שהערה "חזרה"', () => {
    const r = runPair(mutantTree(), REPO_ROOT, { IMPACT_MUT: 'drop-endnote' }, ['--details']);
    assertEq(r.status, 0, `שיפור אינו רגרסיה — קוד ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert(/סיום-אבודות 1→0/.test(r.stdout), `השורה חייבת להראות 1→0:\n${r.stdout}`);
    assert(/− הערת-סיום שחזרה \(אבודה ב-base\): "הערות סיום של חלק…"/.test(r.stdout), `פרט ההערה שחזרה:\n${r.stdout}`);
    assert(!/⚠/.test(r.stdout), 'אין סימן רגרסיה');
  });
  it('--details בכיוון הרגרסיה: ההערה שאבדה מופיעה בשמה (ראשית הטקסט), לא רק כמספר', () => {
    const r = runPair(REPO_ROOT, mutantTree(), { IMPACT_MUT: 'drop-endnote' }, ['--details']);
    assertEq(r.status, 3, `קוד ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert(/\+ הערת-סיום אבודה בקנדידט: "הערות סיום של חלק…" \(\d+ מילים\)/.test(r.stdout), `פרט ההערה שאבדה:\n${r.stdout}`);
  });
  it('base לא מיושר (שני טוקנים עודפים) ⇒ "צד-הפרות לא נבדק" בשורה ובהערת הסיום, srcNotesA.aligned=false, ורגרסיה על מספר הטוקנים', () => {
    const json = path.join(mutantTree(), 'out-unaligned-base.json');
    const r = runPair(mutantTree(), REPO_ROOT, { IMPACT_MUT: 'extra-tokens' }, ['--json', json]);
    const row = JSON.parse(fs.readFileSync(json, 'utf8')).rows[0];
    assertEq(row.srcNotesA.aligned, false, 'base לא מיושר');
    assertEq(r.status, 3, `קוד ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert(/צד-הפרות לא נבדק/.test(r.stdout), `השורה:\n${r.stdout}`);
    assert(/הערה: הערות-צד לא נבדקו ב-canonical \(מודל המקור אינו מיושר לטוקני המנוע\); הערות-הסיום נבדקו בכל המסמכים\./.test(r.stdout), `הערת "לא נבדק" בסוף הדוח:\n${r.stdout}`);
    assert(/מספר הטוקנים השתנה 166→164/.test(r.stdout), `רגרסיית הטוקנים:\n${r.stdout}`);
  });
});

report('impact-tool');
