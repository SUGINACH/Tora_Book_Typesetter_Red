// tests/regress/adjacency-scan-tool.test.js — בדיקות לכלי הסריקה tools/baseline/adjacency-scan.js (סוכן 4)
//
// הכלי מריץ את מטריצת הסמיכות המלאה (lib/adjacency.js) על עץ מנוע כלשהו ומדווח הפרות; הוא משמש ראיה ב-PR של תיקוני מנוע (שער 9 במטריצת האימות).
// ירוק של כלי ראיה בלי בקרה שלילית אינו מוכיח דבר, ולכן:
//   א. parseArgs — ברירות מחדל, פרמטרים, וכל פרמטר שגוי נכשל (קוד 2 בהרצה);
//   ב. מקצה לקצה: סריקה קטנה על עץ הכלי ⇒ קוד 0 + שורת סיכום OK + קובץ JSON; שלושת המצבים בתהליך אחד (approx,real,real+stretch);
//   ג. **בקרות שליליות מקצה לקצה:** עץ מועמד מוטנט (עותק של המנוע שמאבד הערת-סיום) ⇒ הכלי חייב להיכשל: קוד 3 + FAIL — גם כשהאובדן בכל מסמך (P→E לא-מוסברת)
//      וגם כשהוא חלקי (רק במסמך הראשון, בדרך של R-05: כל ההפרות מוסברות ובכל זאת הכלי נכשל כי המחלקה אינה אחידה).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const TOOL = path.join(REPO_ROOT, 'tools', 'baseline', 'adjacency-scan.js');
const { parseArgs } = require(TOOL);
const A = require('./lib/adjacency');

describe('adjacency-scan.js · parseArgs', () => {
  it('ברירות מחדל: עץ הכלי, approx, זוגות, כל האטומים, שני סוגי זנב', () => {
    const o = parseArgs([]);
    assertEq(o.modes.join(','), 'approx', 'מצב');
    assertEq(o.arity, 2, 'ארית');
    assertEq(o.atoms.join(','), A.ALL_ATOMS.join(','), 'אטומים');
    assertEq(o.tails.join(','), 'true,false', 'זנבות');
    assertEq(o.tree, REPO_ROOT, 'עץ');
  });
  it('פרמטרים נקראים כהלכה', () => {
    const o = parseArgs(['--tree', '/x', '--modes', 'real,real+stretch', '--arity', '3', '--offsets', '10,20', '--atoms', 'P,E', '--tails', 'end', '--list', '5', '--json', 'o.json']);
    assertEq(o.tree, '/x', 'tree'); assertEq(o.modes.join(','), 'real,real+stretch', 'modes'); assertEq(o.arity, 3, 'arity');
    assertEq(o.offsets.join(','), '10,20', 'offsets'); assertEq(o.atoms.join(','), 'P,E', 'atoms'); assertEq(o.tails.join(','), 'false', 'tails=end'); assertEq(o.list, 5, 'list');
    assertEq(path.basename(o.json), 'o.json', 'json');
    assertEq(parseArgs(['--tails', 'tail']).tails.join(','), 'true', 'tails=tail');
  });
  it('פרמטר שגוי נכשל: לא מוכר, חסר ערך, מצב/אטום/ארית/היסט/זנב לא תקינים', () => {
    for (const bad of [['--nope'], ['--arity'], ['--modes', 'fast'], ['--atoms', 'P,ZZ'], ['--arity', '5'], ['--arity', '0'], ['--offsets', '10,0'], ['--offsets', 'a'], ['--tails', 'x']]) {
      let threw = false; try { parseArgs(bad); } catch (e) { threw = true; }
      assert(threw, `אמור להיכשל: ${bad.join(' ')}`);
    }
  });
});

const runTool = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 240000 });
const SMALL = ['--atoms', 'P,E,S', '--arity', '2', '--offsets', '10', '--tails', 'both'];

// עץ מועמד מוטנט: עותק של src + default_settings, ובסוף legacy-imud-flow.js עטיפה שמאבדת הערת-סיום (בדיקה בלבד; בלי חיפוש טקסט בקוד המנוע)
const DROP_END_NOTE = `
;(function () { // מוטציה (בדיקה בלבד): מוחק את הפסקה הראשונה בעמוד הערות-הסיום — הערת-סיום אבודה בשקט
  const orig = module.exports.legacyTypeset;
  let calls = 0;
  module.exports.legacyTypeset = function () {
    const r = orig.apply(this, arguments);
    if (/*COND*/) {
      const p = r.pages.find((q) => q.type === 'endnotes');
      const col = p && p.columns.find((c) => c.some((it) => it.kind === 'paragraph'));
      if (col) col.splice(col.findIndex((it) => it.kind === 'paragraph'), 1);
    }
    return r;
  };
})();
`;
// מוטציה ברמת הקלט (כמו R-05 לפני התיקון — הערת-הסיום הראשונה נדרסת): במסמך הראשון בלבד המנוע "רואה" מקור בלי שורת הערת-הסיום הראשונה. האורקל רואה את המקור המלא ⇒ ENDNOTE_LOST בלבד (מוסבר ל-R-05)
const DROP_FIRST_END_NOTE_IN_SOURCE_ONCE = `
;(function () {
  const orig = module.exports.legacyTypeset;
  let calls = 0;
  module.exports.legacyTypeset = function (text) {
    const args = Array.from(arguments);
    if (calls++ === 0) args[0] = String(text).replace(/^הערת סיום -.*\\n/m, '');
    return orig.apply(this, args);
  };
})();
`;
function withMutantTree(appendix, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adj-scan-mut-'));
  try {
    fs.cpSync(path.join(REPO_ROOT, 'red-build', 'src'), path.join(tmp, 'red-build', 'src'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'red-build', 'ui', 'assets', 'imud'), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'), path.join(tmp, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json'));
    fs.appendFileSync(path.join(tmp, 'red-build', 'src', 'engine', 'layout', 'legacy-imud-flow.js'), appendix);
    fn(tmp);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

describe('adjacency-scan.js · מקצה לקצה', () => {
  it('סריקה קטנה על עץ הכלי ⇒ קוד 0, שורת סיכום OK, וקובץ JSON עם התוצאות', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'adj-scan-'));
    try {
      const json = path.join(tmp, 'out.json');
      const r = runTool([...SMALL, '--json', json]);
      assertEq(r.status, 0, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
      assert(/ADJACENCY-SCAN OK — .*modes=approx arity=2 docs=\d+ unexplained=0/.test(r.stdout), `שורת סיכום: ${r.stdout.split('\n').slice(-3).join(' | ')}`);
      const j = JSON.parse(fs.readFileSync(json, 'utf8'));
      assert(j.modes.approx && j.modes.approx.docs >= 10 && j.modes.approx.unexplained.length === 0, 'JSON: מצב approx עם מסמכים ובלי לא-מוסברות');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  it('שלושת המצבים בתהליך אחד (approx,real,real+stretch): קוד 0, וכל מצב מדווח בנפרד', () => {
    const r = runTool(['--modes', 'approx,real,real+stretch', '--atoms', 'P,E', '--arity', '1', '--offsets', '10', '--tails', 'tail']);
    assertEq(r.status, 0, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
    for (const m of ['approx', 'real', 'real+stretch']) assert(new RegExp(`── ${m.replace('+', '\\+')} · ארית 1 · 2 מסמכים תקינים`).test(r.stdout), `חסר דיווח למצב ${m}: ${r.stdout}`);
    assert(/ADJACENCY-SCAN OK — .*modes=approx,real,real\+stretch arity=1 docs=6 unexplained=0/.test(r.stdout), `שורת סיכום: ${r.stdout.split('\n').slice(-3).join(' | ')}`);
  });

  it('פרמטר שגוי / עץ בלי מנוע ⇒ קוד 2; --help ⇒ קוד 0', () => {
    assertEq(runTool(['--nope']).status, 2, 'פרמטר לא מוכר');
    assertEq(runTool(['--tree', os.tmpdir()]).status, 2, 'עץ בלי red-build/src/engine');
    const h = runTool(['--help']);
    assertEq(h.status, 0, '--help'); assert(/שימוש:/.test(h.stdout), 'טקסט עזרה');
  });

  it('בקרה שלילית: עץ מועמד מוטנט (המנוע מאבד הערת-סיום אחת בכל מסמך) ⇒ הכלי נכשל: קוד 3, FAIL, והסדרה P→E מדווחת כלא-מוסברת', () => {
    withMutantTree(DROP_END_NOTE.replace('/*COND*/', 'true'), (tree) => {
      assertEq(runTool([...SMALL, '--tree', REPO_ROOT]).status, 0, 'בקרת ביניים: אותה סריקה על העץ הנקי עוברת');
      const r = runTool([...SMALL, '--tree', tree]);
      assertEq(r.status, 3, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
      assert(/ADJACENCY-SCAN FAIL — /.test(r.stdout), `שורת סיכום: ${r.stdout.split('\n').slice(-3).join(' | ')}`);
      assert(/✗ P→E\b/.test(r.stdout), `P→E חייב להיות מדווח כלא-מוסבר: ${r.stdout}`);
    });
  });

  it('בקרה שלילית — תיקון חלקי: המנוע מאבד הערת-סיום (בדרך של R-05) רק במסמך הראשון ⇒ אין שום הפרה לא-מוסברת, ובכל זאת קוד 3 + FAIL + "מצב חלקי"', () => {
    withMutantTree(DROP_FIRST_END_NOTE_IN_SOURCE_ONCE, (tree) => {
      const args = ['--atoms', 'E', '--arity', '2', '--offsets', '10,310', '--tails', 'tail'];
      assertEq(runTool([...args, '--tree', REPO_ROOT]).status, 0, 'בקרת ביניים: העץ הנקי — R-05 אחידה (אפס) ולכן קוד 0');
      const r = runTool([...args, '--tree', tree]);
      assertEq(r.status, 3, `קוד יציאה ${r.status}\n${r.stdout}\n${r.stderr}`);
      assert(/מצב חלקי 1\/2/.test(r.stdout) && /R-05/.test(r.stdout), `חייב לדווח מחלקה חלקית: ${r.stdout}`);
      assert(/מוסברות: 1, לא-מוסברות: 0/.test(r.stdout), `ההפרה מוסברת (ENDNOTE_LOST ל-R-05) — הכשל הוא רק האחידות: ${r.stdout}`);
      assert(/ADJACENCY-SCAN FAIL — .*unexplained=1\b/.test(r.stdout), `שורת סיכום (המחלקה החלקית נספרת): ${r.stdout.split('\n').slice(-3).join(' | ')}`);
    });
  });
});

report('adjacency-scan-tool');
