// tests/regress/run-tests-tool.test.js — בדיקות ל-runner הגילוי tools/run-tests.js (D-110; סוכן 4)
//
// ה-runner מחליף את שרשרת `node a && node b && …` הידנית ב-package.json: הוא מגלה tests/**/*.test.js ומריץ אותם.
// כשהכלי הוא שער ה-CI, ירוק שלו אינו מוכיח דבר בלי בקרות שליליות — לכן הבדיקות כאן מראות שהשער *יכול* להיכשל:
//   א. סדר הרצה דטרמיניסטי (קבוצות, סדר טבעי s7 < s10, בלי תלות ב-locale);
//   ב. גילוי על עץ מלאכותי: רק *.test.js; regress בנפרד; עוזרים/נתונים/node_modules/נסתרים לא נכללים; הוספת קובץ = בלי עריכת הגדרות;
//   ג. הרצה מקצה לקצה על עץ מלאכותי, כולל בקרות שליליות: כשל מאוחר אינו נבלע ואינו עוצר את השאר (ו---bail עוצר),
//      "בדיקה שקטה" (יוצאת 0 בלי שורת סיכום) נכשלת, "כשל שקט" (מדווח כשלים ויוצא 0) נכשל, קריסה נכשלת;
//   ד. שומר-כיסוי: קובץ שנראה כבדיקה אך אינו *.test.js (בדיקה יתומה) מפיל הרצה מלאה ו---check; עוזרים רגילים אינם מופלים;
//   ה. חוזה על העץ האמיתי: אין בדיקות יתומות; הגילוי שווה לסריקה בלתי-תלויה של tests/; `npm test` ו-`npm run test:regress`
//      מפעילים את ה-runner (ולא שרשרת ידנית — שהחזירה את התנגשויות scripts.test).
//   ו. עדויות (R-4): ה-runner מפנה את כתיבת העדויות (PDF/JSON) לתיקייה זמנית (RED_ARTIFACTS_DIR) ושומר-סחף משווה את tests/artifacts שבמעקב
//      לפני/אחרי — בקרות שליליות: כתיבה ישירה, שינוי ומחיקה ⇒ כשל עם שם הקובץ; --write-artifacts מרענן בכוונה; נשמר/נמחק כמתוכנן;
//      וכן הבדיקות של artifactsDir() (tests/harness.js) ושל tools/scan-control-triggers.js.
// אין כאן מספר קבצים/בדיקות קשיח — הוספת בדיקה לעץ אינה אמורה לשבור את הקובץ הזה.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const RED = path.resolve(__dirname, '..', '..');
const REPO_ROOT = path.resolve(RED, '..');
const TOOL = path.join(REPO_ROOT, 'tools', 'run-tests.js');
const rt = require(TOOL);

// ───────────────────────── עץ מלאכותי ─────────────────────────
function mkRoot(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-tool-'));
  for (const [rel, src] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, src);
  }
  return root;
}
const withRoot = (files, fn) => {
  const root = mkRoot(files);
  try { return fn(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
const sum = (title, p, f = 0, s = 0) => `console.log('== ${title}: ${p}/${p + f} passed, ${f} failed, ${s} skipped ==');`;
const T = {
  ok: (name, p = 2) => `console.log('RAN ${name}'); ${sum(name, p)}`,
  fail: (name) => `console.log('RAN ${name}'); ${sum(name, 1, 1)} process.exitCode = 1;`,
  liar: (name) => `console.log('RAN ${name}'); ${sum(name, 1, 1)}`, // מדווח על כשל ויוצא 0
  silent: (name) => `console.log('RAN ${name}');`, // יוצא 0 בלי שורת סיכום
  crash: (name) => `console.log('RAN ${name}'); throw new Error('boom');`,
};
// ה-runner המקונן אינו יורש RED_ARTIFACTS_DIR מה-runner החיצוני שמריץ קובץ זה (אחרת "ברירת המחדל" שנבדקת כאן הייתה מצב "env")
// ריצה כושלת של ה-runner שומרת את תיקיית העדויות הזמנית (לבדיקת הכשל) — לכן, אלא אם הבדיקה שולטת ב-TMPDIR בעצמה (withTmp למטה),
// כל קריאה מקבלת TMPDIR פרטי שנמחק אחריה, והבדיקות של הכשלים אינן משאירות זבל ב-/tmp.
const cli = (root, args = [], env = {}) => {
  const base = { ...process.env };
  delete base.RED_ARTIFACTS_DIR;
  const own = env.TMPDIR ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-cli-'));
  try {
    return spawnSync(process.execPath, [TOOL, '--root', root, '--no-extra', ...args], {
      encoding: 'utf8', env: { ...base, ...(own ? { TMPDIR: own, TMP: own, TEMP: own } : {}), ...env },
    });
  } finally { if (own) fs.rmSync(own, { recursive: true, force: true }); }
};
const ran = (stdout) => [...stdout.matchAll(/^RAN (\S+)$/gm)].map((m) => m[1]);

// ───────────────────────── עדויות (R-4): עזרים ─────────────────────────
// tmp = תיקייה שהבדיקה שולטת בה; מעבירים אותה כ-TMPDIR/TMP/TEMP ל-runner המקונן, וכך אפשר להוכיח אם תיקייה זמנית נוצרה, נמחקה או נשמרה
const withTmp = (fn) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-tmp-'));
  try { return fn(tmp, { TMPDIR: tmp, TMP: tmp, TEMP: tmp }); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
};
const leftover = (tmp) => fs.readdirSync(tmp).filter((n) => n.startsWith('red-artifacts-'));
const ARTDIR = "const fs=require('fs'),path=require('path');";
const W = {
  // כמו הבדיקות האמיתיות (artifactsDir() ב-harness): כותב out.txt ל-RED_ARTIFACTS_DIR אם מוגדר, אחרת ל-tests/artifacts; מדפיס מה קיבל
  helper: (name) => `${ARTDIR} const d=process.env.RED_ARTIFACTS_DIR?path.resolve(process.env.RED_ARTIFACTS_DIR):path.join(__dirname,'..','artifacts');
fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(path.join(d,'out.txt'),'x'); console.log('ART '+(process.env.RED_ARTIFACTS_DIR||'-')); ${sum(name, 1)}`,
  // ההרגל הישן: כותב ישירות ל-tests/artifacts שבמעקב ולא שואל את הסביבה
  direct: (name) => `${ARTDIR} const d=path.join(__dirname,'..','artifacts'); fs.mkdirSync(d,{recursive:true}); fs.writeFileSync(path.join(d,'new.txt'),'x'); ${sum(name, 1)}`,
  // משנה קובץ קיים ומוחק אחר בתיקייה שבמעקב
  mutate: (name) => `${ARTDIR} const d=path.join(__dirname,'..','artifacts'); fs.writeFileSync(path.join(d,'keep.json'),'changed'); fs.unlinkSync(path.join(d,'gone.json')); ${sum(name, 1)}`,
};

// ───────────────────────── א. סדר ─────────────────────────
describe('run-tests · סדר הרצה דטרמיניסטי', () => {
  it('naturalCompare: מקטעי ספרות לפי ערך (s7 < s9 < s10 < s62), לא לפי תווים', () => {
    const names = ['s10-ui', 's7-notes', 's62-x', 's9-headers', 's8-deco', 's52-ui', 's52-dp'];
    assertEq(names.slice().sort(rt.naturalCompare), ['s7-notes', 's8-deco', 's9-headers', 's10-ui', 's52-dp', 's52-ui', 's62-x']);
  });
  it('naturalCompare: קוד-תו בלי תלות ב-locale (אותיות גדולות לפני קטנות); a1-… לפני audit-…', () => {
    assertEq(['b', 'B', 'a', 'A'].sort(rt.naturalCompare), ['A', 'B', 'a', 'b']);
    assertEq(['audit-sensitivity', 'a1-run-summary', 'a1-boot-failure'].sort(rt.naturalCompare), ['a1-boot-failure', 'a1-run-summary', 'audit-sensitivity']);
  });
  it('compareFiles: unit → integration → layout → e2e → audit, אחריהן קבוצות אחרות; בתוך קבוצה — סדר טבעי', () => {
    const files = ['tests/audit/z.test.js', 'tests/zzz/a.test.js', 'tests/e2e/s10.test.js', 'tests/e2e/s7.test.js', 'tests/layout/l.test.js',
      'tests/integration/i.test.js', 'tests/unit/u.test.js', 'tests/top.test.js'];
    assertEq(files.slice().sort(rt.compareFiles), ['tests/unit/u.test.js', 'tests/integration/i.test.js', 'tests/layout/l.test.js',
      'tests/e2e/s7.test.js', 'tests/e2e/s10.test.js', 'tests/audit/z.test.js', 'tests/top.test.js', 'tests/zzz/a.test.js']);
  });
  it('הסדר אינו תלוי בסדר הקריאה מהדיסק: ערבוב הקלט נותן אותה תוצאה', () => {
    const files = ['tests/e2e/s7.test.js', 'tests/unit/u.test.js', 'tests/e2e/s10.test.js', 'tests/audit/a.test.js'];
    const a = files.slice().sort(rt.compareFiles);
    const b = files.slice().reverse().sort(rt.compareFiles);
    assertEq(a, b);
  });
});

// ───────────────────────── ב. גילוי ─────────────────────────
describe('run-tests · גילוי על עץ מלאכותי', () => {
  const tree = {
    'tests/e2e/s10-ui.test.js': '', 'tests/e2e/s7-notes.test.js': '', 'tests/unit/parser.test.js': '',
    'tests/audit/neg.test.js': '', 'tests/zzz/other.test.js': '', 'tests/top.test.js': '',
    'tests/regress/b.test.js': '', 'tests/regress/a.test.js': '', 'tests/regress/lib/oracle.js': '',
    'tests/harness.js': '', 'tests/fixtures/data.txt': '', 'tests/fixtures/gen.js': '', 'tests/e2e/helper.js': '',
    'tests/node_modules/x/y.test.js': '', 'tests/.hidden/z.test.js': '',
  };
  it('main: כל *.test.js חוץ מ-regress, בסדר ההרצה; regress בנפרד וממוין; עוזרים/נתונים/node_modules/נסתרים לא נכללים', () => {
    withRoot(tree, (root) => {
      const d = rt.discover({ root });
      assertEq(d.main, ['tests/unit/parser.test.js', 'tests/e2e/s7-notes.test.js', 'tests/e2e/s10-ui.test.js', 'tests/audit/neg.test.js',
        'tests/top.test.js', 'tests/zzz/other.test.js']);
      assertEq(d.regress, ['tests/regress/a.test.js', 'tests/regress/b.test.js']);
    });
  });
  it('plan: main + צעדי כלי בסופו; regress = רק regress; all = main ואז regress; --no-extra מסיר את צעדי הכלי', () => {
    withRoot(tree, (root) => {
      const main = rt.plan({ root, suite: 'main' });
      assertEq(main.map((s) => s.kind), ['test', 'test', 'test', 'test', 'test', 'test', 'tool']);
      assertEq(main[main.length - 1].file, rt.EXTRA_STEPS[0]);
      assertEq(rt.plan({ root, suite: 'main', extra: false }).filter((s) => s.kind === 'tool').length, 0);
      assertEq(rt.plan({ root, suite: 'regress' }).map((s) => s.file), ['tests/regress/a.test.js', 'tests/regress/b.test.js']);
      const all = rt.plan({ root, suite: 'all' });
      assertEq(all.map((s) => s.suite), ['main', 'main', 'main', 'main', 'main', 'main', 'main', 'regress', 'regress']);
    });
  });
  it('plan: --only מסנן לפי תת-מחרוזת בנתיב; suite לא מוכר זורק שגיאה', () => {
    withRoot(tree, (root) => {
      assertEq(rt.plan({ root, suite: 'main', extra: false, only: ['s7', 'parser'] }).map((s) => s.file), ['tests/unit/parser.test.js', 'tests/e2e/s7-notes.test.js']);
      let err = null;
      try { rt.plan({ root, suite: 'bogus' }); } catch (e) { err = e; }
      assert(err && /suite לא מוכר/.test(err.message), 'חייב לזרוק על suite לא מוכר');
    });
  });
  it('הוספת קובץ בדיקה לעץ = נכנס לתכנית בלי שום עריכת הגדרות (זה כל הרעיון — אין שרשרת לערוך)', () => {
    withRoot(tree, (root) => {
      const before = rt.plan({ root, suite: 'main', extra: false }).length;
      fs.writeFileSync(path.join(root, 'tests', 'e2e', 's99-new.test.js'), '');
      const after = rt.plan({ root, suite: 'main', extra: false });
      assertEq(after.length, before + 1);
      assert(after.some((s) => s.file === 'tests/e2e/s99-new.test.js'), 'הקובץ החדש חייב להופיע');
    });
  });
});

// ───────────────────────── ג. הרצה מקצה לקצה ─────────────────────────
describe('run-tests · הרצה מקצה לקצה (עץ מלאכותי)', () => {
  const green = { 'tests/unit/a.test.js': T.ok('a'), 'tests/e2e/s7.test.js': T.ok('s7'), 'tests/e2e/s10.test.js': T.ok('s10') };

  it('הכול ירוק ⇒ קוד 0; פלט הקבצים מועבר כמות שהוא; סדר ההרצה = סדר התכנית; שורת הסיכום המצרפית נכונה', () => {
    withRoot(green, (root) => {
      const r = cli(root);
      assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
      assertEq(ran(r.stdout), ['a', 's7', 's10']);
      assert(r.stdout.includes('== a: 2/2 passed, 0 failed, 0 skipped =='), 'שורת הסיכום של הקובץ חייבת לעבור כמות שהיא (ה-CI קורא אותה)');
      assert(/RUN-TESTS OK — suite=main steps=3\/3 files=3 passed=6 failed=0 skipped=0 problems=0 orphans=0/.test(r.stdout), r.stdout);
    });
  });
  it('בקרה שלילית: כשל באמצע ⇒ קוד 1, אך שאר הקבצים כן רצים (כל הכשלים מדווחים), והכשל מפורט', () => {
    withRoot({ ...green, 'tests/e2e/s7.test.js': T.fail('s7') }, (root) => {
      const r = cli(root);
      assertEq(r.status, 1, r.stdout);
      assertEq(ran(r.stdout), ['a', 's7', 's10'], 'הקובץ שאחרי הכושל חייב לרוץ');
      assert(/✗ tests\/e2e\/s7\.test\.js: קוד יציאה 1/.test(r.stdout), r.stdout);
      assert(/RUN-TESTS FAILED — .* failed=1 /.test(r.stdout), r.stdout);
    });
  });
  it('--bail: עצירה בכשל הראשון (כמו `&&` בשרשרת הישנה) — הקובץ שאחריו לא רץ', () => {
    withRoot({ ...green, 'tests/e2e/s7.test.js': T.fail('s7') }, (root) => {
      const r = cli(root, ['--bail']);
      assertEq(r.status, 1);
      assertEq(ran(r.stdout), ['a', 's7']);
      assert(/steps=2\/3/.test(r.stdout), r.stdout);
    });
  });
  it('בקרה שלילית: "בדיקה שקטה" (יוצאת 0 בלי שורת סיכום) ⇒ כשל — 0 בדיקות עוברות אינו ירוק', () => {
    withRoot({ ...green, 'tests/e2e/s7.test.js': T.silent('s7') }, (root) => {
      const r = cli(root);
      assertEq(r.status, 1, r.stdout);
      assert(/✗ tests\/e2e\/s7\.test\.js: לא הודפסה שורת סיכום/.test(r.stdout), r.stdout);
    });
  });
  it('בקרה שלילית: "כשל שקט" (מדווח על כשלים אך יוצא 0) ⇒ כשל', () => {
    withRoot({ ...green, 'tests/e2e/s7.test.js': T.liar('s7') }, (root) => {
      const r = cli(root);
      assertEq(r.status, 1, r.stdout);
      assert(/דווחו 1 כשלים אך קוד היציאה 0/.test(r.stdout), r.stdout);
    });
  });
  it('בקרה שלילית: קריסה (חריגה לא מטופלת) ⇒ כשל עם קוד היציאה', () => {
    withRoot({ ...green, 'tests/e2e/s7.test.js': T.crash('s7') }, (root) => {
      const r = cli(root);
      assertEq(r.status, 1, r.stdout);
      assert(/✗ tests\/e2e\/s7\.test\.js: קוד יציאה 1/.test(r.stdout), r.stdout);
    });
  });
  it('--only: מריץ רק את המתאימים; אין התאמה ⇒ קוד שימוש 2 (לא ירוק ריק); השומר אינו רץ עם --only', () => {
    withRoot({ ...green, 'tests/e2e/misnamed.js': "require('../harness');" }, (root) => {
      const r = cli(root, ['--only', 's7']);
      assertEq(r.status, 0, r.stdout);
      assertEq(ran(r.stdout), ['s7']);
      const none = cli(root, ['--only', 'nomatch']);
      assertEq(none.status, 2, none.stdout + none.stderr);
    });
  });
  it('--json: סכמה red-run-tests-v1, סכומים ושורות סיכום לכל קובץ', () => {
    withRoot(green, (root) => {
      const out = path.join(root, 'out.json');
      const r = cli(root, ['--json', out]);
      assertEq(r.status, 0, r.stdout);
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq(j.schema, 'red-run-tests-v1');
      assertEq(j.ok, true);
      assertEq(j.totals.passed, 6);
      assertEq(j.totals.files, 3);
      assertEq(j.results[0].file, 'tests/unit/a.test.js');
      assertEq(j.results[0].summaries[0], { title: 'a', passed: 2, failed: 0, skipped: 0 });
    });
  });
  it('--list / --list-json: התכנית בלי הרצה; שגיאות שימוש ⇒ קוד 2', () => {
    withRoot(green, (root) => {
      assertEq(cli(root, ['--list']).stdout.split('\n').filter(Boolean), ['tests/unit/a.test.js', 'tests/e2e/s7.test.js', 'tests/e2e/s10.test.js']);
      const j = JSON.parse(cli(root, ['--list-json', '--suite', 'all']).stdout);
      assertEq(j.steps.map((s) => s.file), ['tests/unit/a.test.js', 'tests/e2e/s7.test.js', 'tests/e2e/s10.test.js']);
      assertEq(cli(root, ['--suite', 'bogus']).status, 2);
      assertEq(cli(root, ['--no-such-flag']).status, 2);
      assertEq(cli(root, ['--only']).status, 2);
    });
  });
  it('סביבה ותיקיית עבודה כמו בשרשרת: ה-env עובר לבדיקה ו-cwd = שורש red-build', () => {
    const probe = "console.log('PROBE ' + process.env.RUN_TESTS_PROBE + ' ' + process.cwd()); " + sum('probe', 1);
    withRoot({ 'tests/unit/probe.test.js': probe }, (root) => {
      const r = cli(root, [], { RUN_TESTS_PROBE: 'xyz' });
      assertEq(r.status, 0, r.stdout);
      assert(r.stdout.includes(`PROBE xyz ${fs.realpathSync(root)}`), r.stdout);
    });
  });
  it('שורת הסיכום המצרפית אינה מתחזה לשורת סיכום של קובץ (ה-CI/compare-with-ci סופרים רק `== כותרת: N passed, F failed ==`)', () => {
    withRoot(green, (root) => {
      const r = cli(root);
      const lines = [...r.stdout.matchAll(rt.SUMMARY)].map((m) => m[1]).sort();
      assertEq(lines, ['a', 's10', 's7']);
    });
  });
});

// ───────────────────────── ד. שומר-כיסוי ─────────────────────────
describe('run-tests · שומר-כיסוי (בדיקה יתומה)', () => {
  const green = { 'tests/unit/a.test.js': T.ok('a') };
  it('קובץ שנראה כבדיקה (require של harness) אך אינו *.test.js ⇒ orphans, --check קוד 1, והרצה מלאה נכשלת למרות שכל הצעדים ירוקים', () => {
    withRoot({ ...green, 'tests/e2e/misnamed.js': "const { describe } = require('../harness');" }, (root) => {
      assertEq(rt.orphans({ root }), ['tests/e2e/misnamed.js']);
      const c = cli(root, ['--check']);
      assertEq(c.status, 1, c.stdout);
      assert(/✗ tests\/e2e\/misnamed\.js/.test(c.stdout), c.stdout);
      const r = cli(root);
      assertEq(r.status, 1, r.stdout);
      assert(/orphans=1/.test(r.stdout) && /RUN-TESTS FAILED/.test(r.stdout), r.stdout);
    });
  });
  it('גם *.spec.js עם describe( נתפס; עוזר רגיל, harness.js ותיקיות lib/fixtures/artifacts אינם מופלים', () => {
    withRoot({
      ...green,
      'tests/e2e/x.spec.js': "describe('x', () => {});",
      'tests/e2e/util.js': 'module.exports = 1;',
      'tests/harness.js': "function describe(){} module.exports = { describe };",
      'tests/regress/lib/oracle.js': "const h = require('../../harness'); describe('o', () => {});",
      'tests/fixtures/gen.js': "require('../harness');",
      'tests/artifacts/dump.js': "require('../harness');",
    }, (root) => {
      assertEq(rt.orphans({ root }), ['tests/e2e/x.spec.js']);
    });
  });
  it('עץ תקין ⇒ --check קוד 0', () => {
    withRoot(green, (root) => {
      const c = cli(root, ['--check']);
      assertEq(c.status, 0, c.stdout);
      assert(/בדיקות יתומות=0/.test(c.stdout), c.stdout);
    });
  });
});

// ───────────────────────── ו. עדויות (R-4) ─────────────────────────
describe('run-tests · עדויות: snapshot / diffSnapshots', () => {
  it('snapshot: תיקייה חסרה = ריקה; מפתחות יחסיים עם "/" כולל תתי-תיקיות; בסדר טבעי; ה-hash תלוי בתוכן', () => {
    withRoot({ 'a/b10.txt': 'two', 'a/b2.txt': 'one', 'top.json': '{}' }, (root) => {
      assertEq(rt.snapshot(path.join(root, 'missing')), {});
      const s = rt.snapshot(root);
      assertEq(Object.keys(s), ['a/b2.txt', 'a/b10.txt', 'top.json']);
      assert(/^[0-9a-f]{64}$/.test(s['top.json']), 'sha256');
      fs.writeFileSync(path.join(root, 'top.json'), '{ }');
      assert(rt.snapshot(root)['top.json'] !== s['top.json'], 'שינוי תוכן חייב לשנות את ה-hash');
      assertEq(rt.snapshot(root)['a/b2.txt'], s['a/b2.txt']);
    });
  });
  it('diffSnapshots: added / modified / deleted בסדר טבעי; זהה ⇒ ריק (גם כשהסדר שונה)', () => {
    assertEq(rt.diffSnapshots({ a: '1', b: '2', c: '3' }, { c: '3', b: '9', d: '4', e10: '5', e2: '5' }),
      [{ file: 'a', change: 'deleted' }, { file: 'b', change: 'modified' }, { file: 'd', change: 'added' },
        { file: 'e2', change: 'added' }, { file: 'e10', change: 'added' }]);
    assertEq(rt.diffSnapshots({ a: '1', b: '2' }, { b: '2', a: '1' }), []);
    assertEq(rt.diffSnapshots({}, {}), []);
  });
});

describe('run-tests · עדויות מופנות לתיקייה זמנית (ברירת מחדל)', () => {
  it('הילד מקבל RED_ARTIFACTS_DIR לתיקייה זמנית חדשה, הכתיבה נוחתת שם, tests/artifacts שבמעקב לא נגע, וריצה ירוקה מנקה אחריה', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w'), 'tests/artifacts/keep.json': 'tracked' }, (root) => {
      const tracked = path.join(root, 'tests', 'artifacts');
      const before = rt.snapshot(tracked);
      const r = cli(root, [], tmpEnv);
      assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
      const m = r.stdout.match(/^ART (.+)$/m);
      assert(m && m[1] !== '-', `הילד חייב לקבל RED_ARTIFACTS_DIR\n${r.stdout}`);
      assert(m[1].startsWith(tmp) && path.basename(m[1]).startsWith('red-artifacts-'), `התיקייה הזמנית צריכה להיווצר ב-TMPDIR: ${m[1]}`);
      assertEq(rt.snapshot(tracked), before, 'tests/artifacts שבמעקב לא אמור להשתנות');
      assert(!fs.existsSync(path.join(tracked, 'out.txt')), 'העדות נכתבה לתיקייה שבמעקב');
      assertEq(leftover(tmp), [], 'ריצה ירוקה חייבת למחוק את התיקייה הזמנית');
      assert(/סחף ב-tests\/artifacts: 0/.test(r.stdout) && /drift=0/.test(r.stdout), r.stdout);
    }));
  });
  it('--json: artifacts = {mode:"redirect", dir, kept:false, drift:[]} ו-totals.drift = 0', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      const out = path.join(root, 'out.json');
      const r = cli(root, ['--json', out], tmpEnv);
      assertEq(r.status, 0, r.stdout);
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq(j.artifacts.mode, 'redirect');
      assertEq(j.artifacts.kept, false);
      assertEq(j.artifacts.drift, []);
      assert(j.artifacts.dir.startsWith(tmp), j.artifacts.dir);
      assertEq(j.totals.drift, 0);
    }));
  });
  it('RED_ARTIFACTS_DIR שכבר מוגדר בסביבה נשמר כמות שהוא: אין תיקייה זמנית, והכתיבה נוחתת שם', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      const mine = path.join(tmp, 'mine');
      const out = path.join(root, 'out.json');
      const r = cli(root, ['--json', out], { ...tmpEnv, RED_ARTIFACTS_DIR: mine });
      assertEq(r.status, 0, r.stdout);
      assert(r.stdout.includes(`ART ${mine}`), r.stdout);
      assertEq(fs.readFileSync(path.join(mine, 'out.txt'), 'utf8'), 'x');
      assertEq(leftover(tmp), [], 'לא אמורה להיווצר תיקייה זמנית כשהסביבה כבר הגדירה יעד');
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq([j.artifacts.mode, j.artifacts.dir], ['env', mine]);
    }));
  });
  it('--write-artifacts (רענון מכוון): אין הפניה ואין שומר — הילד לא מקבל RED_ARTIFACTS_DIR, כתיבה ישירה ל-tests/artifacts עוברת, קוד 0', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w'), 'tests/unit/d.test.js': W.direct('d') }, (root) => {
      const out = path.join(root, 'out.json');
      const r = cli(root, ['--write-artifacts', '--json', out], tmpEnv);
      assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
      assert(/^ART -$/m.test(r.stdout), `הילד לא אמור לקבל RED_ARTIFACTS_DIR\n${r.stdout}`);
      assertEq(fs.readFileSync(path.join(root, 'tests', 'artifacts', 'out.txt'), 'utf8'), 'x');
      assert(fs.existsSync(path.join(root, 'tests', 'artifacts', 'new.txt')), 'כתיבה ישירה חייבת לעבוד ב---write-artifacts');
      assertEq(leftover(tmp), [], 'ב---write-artifacts לא נוצרת תיקייה זמנית');
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq([j.artifacts.mode, j.artifacts.drift, j.ok], ['write', [], true]);
      assert(/--write-artifacts/.test(r.stdout), r.stdout);
    }));
  });
  it('RED_ARTIFACTS_DIR ריק = כמו לא מוגדר (תיקייה זמנית נוצרת)', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      const r = cli(root, [], { ...tmpEnv, RED_ARTIFACTS_DIR: '' });
      assertEq(r.status, 0, r.stdout);
      const m = r.stdout.match(/^ART (.+)$/m);
      assert(m && m[1].startsWith(tmp), r.stdout);
    }));
  });
});

describe('run-tests · שומר-סחף: בקרות שליליות (בדיקה שכותבת ישירות לעדויות שבמעקב)', () => {
  it('כתיבה ישירה ל-tests/artifacts ⇒ כשל עם שם הקובץ, גם כששתי הבדיקות עצמן ירוקות; עם --write-artifacts אותו עץ עובר', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/ok.test.js': T.ok('ok'), 'tests/unit/d.test.js': W.direct('d'), 'tests/artifacts/keep.json': 'tracked' }, (root) => {
      const out = path.join(root, 'out.json');
      const r = cli(root, ['--json', out], tmpEnv);
      assertEq(r.status, 1, r.stdout);
      assert(/✗ tests\/artifacts\/new\.txt: נוסף בזמן ההרצה/.test(r.stdout), r.stdout);
      assert(/--write-artifacts/.test(r.stdout), 'ההודעה חייבת להסביר מה לעשות');
      assert(/RUN-TESTS FAILED — .*problems=0 .*drift=1/.test(r.stdout), `הצעדים עצמם ירוקים; הכשל הוא של השומר\n${r.stdout}`);
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq([j.ok, j.totals.problems, j.totals.drift], [false, 0, 1]);
      assertEq(j.artifacts.drift, [{ file: 'new.txt', change: 'added' }]);
      // אותו עץ, רענון מכוון ⇒ עובר
      fs.rmSync(path.join(root, 'tests', 'artifacts', 'new.txt'));
      const w = cli(root, ['--write-artifacts'], tmpEnv);
      assertEq(w.status, 0, w.stdout);
    }));
  });
  it('שינוי קובץ קיים ומחיקת קובץ בתיקייה שבמעקב נתפסים ("שונה" / "נמחק")', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/m.test.js': W.mutate('m'), 'tests/artifacts/keep.json': 'orig', 'tests/artifacts/gone.json': 'orig' }, (root) => {
      const r = cli(root, [], tmpEnv);
      assertEq(r.status, 1, r.stdout);
      assert(/✗ tests\/artifacts\/gone\.json: נמחק בזמן ההרצה/.test(r.stdout), r.stdout);
      assert(/✗ tests\/artifacts\/keep\.json: שונה בזמן ההרצה/.test(r.stdout), r.stdout);
      assert(/drift=2/.test(r.stdout), r.stdout);
    }));
  });
  it('בקרה חיובית: אותה בדיקה שנוגעת באותם קבצים אבל דרך RED_ARTIFACTS_DIR (artifactsDir()) — עוברת, והקבצים שבמעקב שלמים', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w'), 'tests/artifacts/keep.json': 'orig', 'tests/artifacts/gone.json': 'orig' }, (root) => {
      const r = cli(root, [], tmpEnv);
      assertEq(r.status, 0, r.stdout);
      assertEq(fs.readFileSync(path.join(root, 'tests', 'artifacts', 'keep.json'), 'utf8'), 'orig');
      assert(fs.existsSync(path.join(root, 'tests', 'artifacts', 'gone.json')));
    }));
  });
  it('--only: השומר פעיל גם בהרצה חלקית (כתיבה ישירה בבדיקה שנבחרה ⇒ כשל)', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/ok.test.js': T.ok('ok'), 'tests/unit/d.test.js': W.direct('d') }, (root) => {
      assertEq(cli(root, ['--only', 'ok'], tmpEnv).status, 0);
      const r = cli(root, ['--only', 'd.test'], tmpEnv);
      assertEq(r.status, 1, r.stdout);
      assert(/tests\/artifacts\/new\.txt: נוסף/.test(r.stdout), r.stdout);
    }));
  });
});

describe('run-tests · עדויות: מחיקה / שמירה של התיקייה הזמנית', () => {
  it('--keep-artifacts: התיקייה נשמרת עם התוכן, והנתיב מודפס', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      const r = cli(root, ['--keep-artifacts'], tmpEnv);
      assertEq(r.status, 0, r.stdout);
      const dirs = leftover(tmp);
      assertEq(dirs.length, 1);
      assert(r.stdout.includes(path.join(tmp, dirs[0])), `הנתיב חייב להיות מודפס\n${r.stdout}`);
      assertEq(fs.readFileSync(path.join(tmp, dirs[0], 'out.txt'), 'utf8'), 'x');
      assert(/נשמרה לבדיקה/.test(r.stdout), r.stdout);
    }));
  });
  it('ריצה כושלת שומרת את העדויות שנוצרו (לבדיקת הכשל) ומדפיסה את הנתיב; ריצה ירוקה בלי הדגל מנקה', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w'), 'tests/unit/f.test.js': T.fail('f') }, (root) => {
      const r = cli(root, [], tmpEnv);
      assertEq(r.status, 1, r.stdout);
      const dirs = leftover(tmp);
      assertEq(dirs.length, 1, 'ריצה כושלת שומרת את תיקיית העדויות');
      assert(r.stdout.includes(path.join(tmp, dirs[0])), r.stdout);
      assert(fs.existsSync(path.join(tmp, dirs[0], 'out.txt')));
    }));
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      assertEq(cli(root, [], tmpEnv).status, 0);
      assertEq(leftover(tmp), []);
    }));
  });
  it('כל ריצה מקבלת תיקייה זמנית משלה (שתי ריצות ברצף לא חולקות עדויות)', () => {
    withTmp((tmp, tmpEnv) => withRoot({ 'tests/unit/w.test.js': W.helper('w') }, (root) => {
      const a = cli(root, ['--keep-artifacts'], tmpEnv).stdout.match(/^ART (.+)$/m)[1];
      const b = cli(root, ['--keep-artifacts'], tmpEnv).stdout.match(/^ART (.+)$/m)[1];
      assert(a !== b, 'כל ריצה חייבת לקבל תיקייה חדשה');
      assertEq(leftover(tmp).length, 2);
    }));
  });
});

// ───────────────────────── ז. artifactsDir() (tests/harness.js) ─────────────────────────
describe('harness · artifactsDir()', () => {
  const H = path.join(RED, 'tests', 'harness.js');
  const adir = (env, cwd) => {
    const base = { ...process.env };
    delete base.RED_ARTIFACTS_DIR;
    return spawnSync(process.execPath, ['-e', `process.stdout.write(require(${JSON.stringify(H)}).artifactsDir())`], { encoding: 'utf8', cwd: cwd || os.tmpdir(), env: { ...base, ...env } });
  };
  it('ברירת מחדל: red-build/tests/artifacts — אותו נתיב שהבדיקות כתבו אליו תמיד (ריצה ישירה של קובץ בדיקה לא משתנה)', () => {
    const r = adir({});
    assertEq(r.status, 0, r.stderr);
    assertEq(r.stdout, path.join(RED, 'tests', 'artifacts'));
  });
  it('RED_ARTIFACTS_DIR מוחלט: מוחזר כמות שהוא, והתיקייה (גם מקוננת) נוצרת אם חסרה', () => {
    withTmp((tmp) => {
      const dir = path.join(tmp, 'x', 'y');
      const r = adir({ RED_ARTIFACTS_DIR: dir });
      assertEq(r.stdout, dir);
      assert(fs.statSync(dir).isDirectory(), 'התיקייה חייבת להיווצר');
    });
  });
  it('RED_ARTIFACTS_DIR יחסי: נפתר מול ה-cwd (אותו cwd שה-runner נותן לילדים)', () => {
    withTmp((tmp) => {
      const r = adir({ RED_ARTIFACTS_DIR: 'rel/out' }, tmp);
      assertEq(fs.realpathSync(r.stdout), fs.realpathSync(path.join(tmp, 'rel', 'out')));
    });
  });
  it('RED_ARTIFACTS_DIR ריק = כמו לא מוגדר', () => {
    assertEq(adir({ RED_ARTIFACTS_DIR: '' }).stdout, path.join(RED, 'tests', 'artifacts'));
  });
});

describe('scan-control-triggers · RED_ARTIFACTS_DIR', () => {
  const SCAN = path.join(REPO_ROOT, 'tools', 'scan-control-triggers.js');
  const sha = (f) => (fs.existsSync(f) ? require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex') : null);
  it('עם RED_ARTIFACTS_DIR הסריקה כותבת את s10-callgraph.json לשם ואינה נוגעת בקובץ שבמעקב', () => {
    withTmp((tmp) => {
      const tracked = path.join(RED, 'tests', 'artifacts', 's10-callgraph.json');
      const before = sha(tracked);
      const base = { ...process.env };
      const r = spawnSync(process.execPath, [SCAN], { cwd: RED, encoding: 'utf8', env: { ...base, RED_ARTIFACTS_DIR: tmp } });
      assertEq(r.status, 0, `${r.stdout}\n${r.stderr}`);
      const out = path.join(tmp, 's10-callgraph.json');
      assert(fs.existsSync(out), 'הקובץ חייב להיכתב ליעד המופנה');
      const j = JSON.parse(fs.readFileSync(out, 'utf8'));
      assertEq(j.schema, 's10-callgraph-v1');
      assert(Array.isArray(j.files) && j.files.length > 0, 'הסריקה חייבת לכלול קבצים');
      assertEq(sha(tracked), before, 'הקובץ שבמעקב אינו אמור להשתנות');
    });
  });
});

// ───────────────────────── ה. חוזה על העץ האמיתי ─────────────────────────
describe('run-tests · חוזה על העץ האמיתי', () => {
  const realWalk = (dir, rel, out) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      if (e.isDirectory()) realWalk(path.join(dir, e.name), `${rel}/${e.name}`, out);
      else if (e.isFile() && e.name.endsWith('.test.js')) out.push(`${rel}/${e.name}`);
    }
    return out;
  };
  it('אין בדיקות יתומות: כל קובץ JS שנראה כבדיקה תחת tests/ נקרא *.test.js (אחרת לא היה רץ בשום מקום)', () => {
    const o = rt.orphans();
    assertEq(o, [], `בדיקות יתומות: ${o.join(', ')} — שנו את השם ל-*.test.js`);
  });
  it('הגילוי שווה לסריקה בלתי-תלויה של tests/ — אין קובץ *.test.js שלא נכלל ואין כפילות בין main ל-regress', () => {
    const d = rt.discover();
    const independent = realWalk(path.join(RED, 'tests'), 'tests', []).sort();
    assertEq([...d.main, ...d.regress].sort(), independent);
    assertEq(new Set([...d.main, ...d.regress]).size, d.main.length + d.regress.length, 'כפילות');
    assert(d.main.length > 0 && d.regress.length > 0, 'חייבים להיות קבצים בשתי הסוויטות');
    assert(d.regress.every((f) => f.startsWith('tests/regress/')) && d.main.every((f) => !f.startsWith('tests/regress/')), 'חלוקה לסוויטות');
  });
  it('plan(all) = כל הקבצים שהתגלו + צעדי הכלי; main אינו כולל regress; צעדי הכלי קיימים בדיסק', () => {
    const d = rt.discover();
    const all = rt.plan({ suite: 'all' });
    assertEq(all.filter((s) => s.kind === 'test').map((s) => s.file).sort(), [...d.main, ...d.regress].sort());
    assert(rt.plan({ suite: 'main' }).every((s) => s.suite === 'main' && !s.file.startsWith('tests/regress/')), 'main נקי מ-regress');
    for (const f of rt.EXTRA_STEPS) assert(fs.existsSync(path.join(RED, f)), `צעד כלי חסר בדיסק: ${f}`);
  });
  it('`npm test` ו-`npm run test:regress` מפעילים את ה-runner — לא שרשרת ידנית (שרשרת כזו הייתה מחזירה את התנגשויות scripts.test)', () => {
    const { scripts } = JSON.parse(fs.readFileSync(path.join(RED, 'package.json'), 'utf8'));
    assert(/^node \.\.\/tools\/run-tests\.js$/.test(scripts.test), `scripts.test = ${scripts.test}`);
    assert(/^node \.\.\/tools\/run-tests\.js --suite regress$/.test(scripts['test:regress']), `scripts["test:regress"] = ${scripts['test:regress']}`);
    for (const k of ['test', 'test:regress']) assert(!/\.test\.js|&&/.test(scripts[k]), `scripts.${k} חייב להישאר בלי רשימת קבצים`);
  });
});

report('run-tests-tool');
