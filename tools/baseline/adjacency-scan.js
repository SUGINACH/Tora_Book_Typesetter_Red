#!/usr/bin/env node
// tools/baseline/adjacency-scan.js — סריקת סמיכות מקור→פלט על עץ מנוע כלשהו (סוכן 4; כלי בדיקות בלבד)
//
// מריץ את מטריצת הסמיכות המלאה (red-build/tests/regress/lib/adjacency.js) על עץ נתון — בכל אחד ממצבי המדידה של impact.js — ומדווח אילו סדרות של
// מבני מקור סמוכים מפיקות הפרת אורקל (גוף / הערות-סיום / הערות-צד / גיאומטריה / יישור מודל). הבדיקה הקבועה (tests/regress/adjacency-matrix.test.js)
// מריצה תת-קבוצה קטנה ב-approx בכל PR; כאן הסריקה המלאה: כל הזוגות בכל ההיסטים, ואופציונלית כל השלשות (--arity 3; ≈38 אלף מסמכים, כשתי דקות ב-approx).
// מתי: לפני מיזוג תיקון/שינוי במנוע שנוגע בטוקניזציה, בלקסר, בהערות או בכותרות (שער 9 במטריצת האימות של סוכן 4) — ובכל פעם שמוסיפים אטום מבנה.
//
// שימוש:
//   node tools/baseline/adjacency-scan.js [--tree <שורש-checkout>] [--modes approx,real,real+stretch] [--arity 2|3]
//        [--offsets 10,160,310,…] [--atoms P,E,S,…] [--tails both|tail|end] [--list N] [--json <קובץ>]
//   ברירת מחדל: העץ של הכלי, approx, זוגות, היסטים 10,160,310,460,610,910, כל 17 האטומים, גם עם המשך וגם בסוף-מסמך.
//   --tree: תיקיית שורש של checkout (שמכילה red-build/) — המנוע נטען משם; האורקל ומחולל המסמכים — מהעץ שבו הכלי נמצא (כמו impact.js --base/--cand).
//   כדי להשוות שני עצים: מריצים על כל אחד ומשווים את שורות הסיכום (או קבצי ה-JSON); תיקון אמור לשנות רק את מחלקת ההסבר שהוא מטפל בה.
//
// פלט: לכל מצב — מסמכים שנבדקו / נדחו בשער D-100 (קלט לא תקין; נספרים), סטטיסטיקת מחלקות ההסבר (R-05, O-8; על מסמכים טהורים), טבלת הסדרות עם הפרות,
// ורשימת ההפרות הבלתי-מוסברות (הכשל). מחלקת הסבר מתירה רק את קודי ההפרה שלה (lib/adjacency.js) ומחויבת להיות אחידה — מצב חלקי (חלק מהמסמכים במחלקה מאבדים וחלק לא) נכשל כמו הפרה בלתי-מוסברת.
// קודי יציאה: 0 — אין הפרות בלתי-מוסברות ואין מחלקה במצב חלקי; 3 — יש (רגרסיה/ממצא חדש/תיקון חלקי); 2 — שגיאת הרצה/ארגומנטים.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const A = require(path.join(ROOT, 'red-build/tests/regress/lib/adjacency'));

const MODES = ['approx', 'real', 'real+stretch'];

function parseArgs(argv) {
  const o = { tree: ROOT, modes: ['approx'], arity: 2, offsets: [10, 160, 310, 460, 610, 910], atoms: A.ALL_ATOMS, tails: [true, false], list: 40, json: null };
  const need = (i, name) => { if (i + 1 >= argv.length) throw new Error(`חסר ערך ל-${name}`); return argv[i + 1]; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tree') { o.tree = path.resolve(need(i, a)); i++; }
    else if (a === '--modes') { o.modes = need(i, a).split(',').filter(Boolean); i++; }
    else if (a === '--arity') { o.arity = parseInt(need(i, a), 10); i++; }
    else if (a === '--offsets') { o.offsets = need(i, a).split(',').map((x) => parseInt(x, 10)); i++; }
    else if (a === '--atoms') { o.atoms = need(i, a).split(',').filter(Boolean); i++; }
    else if (a === '--tails') { const t = need(i, a); o.tails = t === 'both' ? [true, false] : t === 'tail' ? [true] : t === 'end' ? [false] : null; if (!o.tails) throw new Error('--tails: both | tail | end'); i++; }
    else if (a === '--list') { o.list = parseInt(need(i, a), 10); i++; }
    else if (a === '--json') { o.json = path.resolve(need(i, a)); i++; }
    else if (a === '-h' || a === '--help') { o.help = true; }
    else throw new Error(`ארגומנט לא מוכר: ${a}`);
  }
  for (const m of o.modes) if (!MODES.includes(m)) throw new Error(`מצב לא מוכר: ${m} (${MODES.join(' | ')})`);
  if (![1, 2, 3, 4].includes(o.arity)) throw new Error('--arity: 1..4 (3 = שלשות; 4 כבד מאוד)');
  for (const x of o.atoms) if (!A.ATOMS[x]) throw new Error(`אטום לא מוכר: ${x} (${A.ALL_ATOMS.join(',')})`);
  if (o.offsets.some((k) => !Number.isInteger(k) || k < 1)) throw new Error('--offsets: מספרים שלמים חיוביים');
  return o;
}

function printMode(o, mode, res, ms) {
  const c = res.classes;
  console.log(`\n── ${mode} · ארית ${o.arity} · ${res.docs} מסמכים תקינים (נדחו בשער D-100: ${res.skipped.count} ${JSON.stringify(res.skipped.byCode)}) · ${(ms / 1000).toFixed(1)}ש'`);
  console.log(`   מחלקות הסבר (מסמכים טהורים): R-05 ${c['R-05'].violating}/${c['R-05'].docs} מאבדים הערת-סיום · O-8 ${c['O-8'].violating}/${c['O-8'].docs} עם התראת-שווא · משותפים ${res.mixed}`);
  for (const id of res.partial) console.log(`   ✗ ${id}: מצב חלקי ${c[id].violating}/${c[id].docs} — המחלקה אמורה להיות אחידה (כולן מראות את הבאג או אף אחת): תיקון שאינו שלם, או באג חדש שמפעיל רק חלק מהצירופים`);
  if (!res.offenders.length) { console.log('   אין הפרות.'); return; }
  console.log(`   סדרות עם הפרות: ${res.offenders.length} (מוסברות: ${res.offenders.length - res.unexplained.length}, לא-מוסברות: ${res.unexplained.length})`);
  const rows = res.offenders.slice().sort((a, b) => (b.bad.length - a.bad.length) || a.seq.localeCompare(b.seq)).slice(0, o.list);
  for (const r of rows) console.log(`   ${r.bad.length ? '✗' : '·'} ${r.seq.padEnd(12)} מסמכים=${String(r.docs).padEnd(4)} [${r.cls.join('+') || '—'}] ${r.codes.join(',')}${r.bad.length ? '  ← לא מוסבר: ' + r.bad.join(',') : ''}\n       דוגמה (K=${r.sample.K}${r.sample.tail ? '' : ', סוף-מסמך'}): ${r.sample.code} ${r.sample.detail}`);
  if (res.offenders.length > rows.length) console.log(`   … (+${res.offenders.length - rows.length} סדרות; --list N מציג יותר)`);
}

function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error('adjacency-scan: ' + e.message); process.exit(2); }
  if (o.help) { console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); return; }
  const root = path.join(o.tree, 'red-build');
  if (!fs.existsSync(path.join(root, 'src/engine'))) { console.error(`adjacency-scan: אין red-build/src/engine תחת ${o.tree}`); process.exit(2); }
  const out = { tree: o.tree, arity: o.arity, offsets: o.offsets, atoms: o.atoms, modes: {} };
  let unexplained = 0; let docs = 0;
  try {
    for (const mode of o.modes) {
      const engine = A.makeEngine(root, mode);
      const t0 = Date.now();
      const res = A.scan(engine, { atoms: o.atoms, arity: o.arity, offsets: o.offsets, tails: o.tails });
      printMode(o, mode, res, Date.now() - t0);
      out.modes[mode] = res;
      unexplained += res.unexplained.length + res.partial.length; docs += res.docs;
    }
  } catch (e) { console.error('adjacency-scan: שגיאת הרצה — ' + (e && e.stack || e)); process.exit(2); }
  if (o.json) fs.writeFileSync(o.json, JSON.stringify(out, null, 1));
  console.log(`\nADJACENCY-SCAN ${unexplained ? 'FAIL' : 'OK'} — tree=${o.tree} modes=${o.modes.join(',')} arity=${o.arity} docs=${docs} unexplained=${unexplained}`);
  process.exit(unexplained ? 3 : 0);
}

if (require.main === module) main();
module.exports = { parseArgs };
