// tests/regress/impact-tool.test.js — בדיקות לכלי ההשוואה tools/baseline/impact.js (סוכן 4)
//
// הכלי מריץ את אותו מסמך בשני עצים ומדווח השפעה (עמודים, hash, עמודים ששונו, רפאים/כפילות/אבודות, כיסוי הערות לפי עמוד,
// שמירת תוכן). הבדיקות כאן:
//   א. compare/formatRow — פונקציות טהורות: כל סוג רגרסיה מזוהה, שיפור אינו מסומן, ניטרליות מדויקת, חומרת "רפאים" (R-04 פתוח/סגור);
//   ב. הרצה מקצה לקצה: עץ מול עצמו ⇒ ניטרלי, קוד יציאה 0;
//   ג. **בקרה שלילית מקצה לקצה:** עץ מועמד מוטנט (עותק של המנוע שמעתיק בלוק הערות לעמוד שאין בו הפסקה) ⇒ הכלי חייב לזהות, קוד 3.
// בלי הבקרה (ג) ירוק של הכלי לא מוכיח דבר — היא מראה שהכלי באמת מגיב לשינוי במנוע.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TOOL = path.join(REPO_ROOT, 'tools', 'baseline', 'impact.js');
const { compare, formatRow, multisetMinus, parseArgs } = require(TOOL);

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

// ───────────────────────── מקצה לקצה ─────────────────────────
const runTool = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 120000 });

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

report('impact-tool');
