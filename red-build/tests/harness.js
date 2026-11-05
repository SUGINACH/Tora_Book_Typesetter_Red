// tests/harness.js — Mini test framework (zero dependencies, deterministic)
// תבנית: describe(name, fn) / it(name, fn[, opts]) ; it זורק בכשל. סיכום + exit code לפי ממצאים.
// **S10:** תמיכה מלאה בבדיקות אסינכרוניות — הרצה סדרתית (הסדר נשמר במדויק,
// גם בין sync ל־async) כך that תלויות בין־בדיקות בתוך suite עובדות כמצופה.
// תואם לאחור לחלוטין: בדיקות סינכרוניות (S1–S9) מתנהגות כמקודם.
// **S5.2 (P-11, אמת-דיווח):** (א) it.skip ממומש כאן — בעבר היה לא-מוגדר והדפוס
// `(cond ? it : it.skip)` ב-long-real-text.test.js היה קורס ב-TypeError במקום
// לדלג; עכשיו כל דילוג נספר, מודפס בכל שורת סיכום, וב-CI (מכונה שמתקינה
// poppler/dejavu ואת כל ה-fixtureים) דילוג = סביבה שבורה ⇒ exit 1.
// (ב) פסק-זמן פר-בדיקה: it(name, fn, { timeout: ms }) — פונקציות אסינכרוניות
// נעטפות ב-Promise.race מול טיימר; סינכרוניות לא מושפעות כלל.
'use strict';

const results = { passed: 0, failed: 0, skipped: 0, failures: [] };
let currentSuite = '';
const queue = []; // {full, fn} — נרשמים בזמן describe; מבוצעים בסדר הרישום

function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} › ${name}` : name;
  fn();
  currentSuite = prev;
}

function it(name, fn, opts) {
  const full = currentSuite ? `${currentSuite} › ${name}` : name;
  // **S5.2 (P-11b):** פסק-זמן פר-בדיקה — רק לפונקציות אסינכרוניות (מחזירות
  // thenable); סינכרוניות מוחזרות כמו שהן ולא נגעות בטיימר בכלל.
  const timeoutMs = opts && Number.isFinite(opts.timeout) ? opts.timeout : null;
  const wrapped = timeoutMs == null ? fn : function () {
    const ret = fn.call(this);
    if (!ret || typeof ret.then !== 'function') return ret; // סינכרונית — לא מושפעת
    let timer = null;
    return Promise.race([
      ret,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`פסק זמן לבדיקה (${timeoutMs}ms)`)), timeoutMs);
      })
    ]).finally(() => clearTimeout(timer));
  };
  queue.push({ full, fn: wrapped });
}

// **S5.2 (P-11a):** דילוג רשמי ומודגש — נספר במונה, לא מתבצע, ומוצג בסיכום.
// שימוש: it.skip(name, fn) או הדפוס `(cond ? it : it.skip)(name, fn)`.
it.skip = function (name, fn) {
  results.skipped++;
  const full = currentSuite ? `${currentSuite} › ${name}` : name;
  console.log(`SKIP (דילוג מבוקר): ${full}`);
  void fn;
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg || 'not equal'}\n  actual:   ${a}\n  expected: ${b}`);
}

function assertClose(actual, expected, tol, msg) {
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg || 'not close'}: |${actual - expected}| > ${tol}`);
  }
}

/** הרצה סדרתית של כל הבדיקות — ממתינה לכל אחת (sync או async) בטרם הבאה. */
async function runAll() {
  for (const { full, fn } of queue) {
    try {
      await fn();
      results.passed++;
    } catch (e) {
      results.failed++;
      results.failures.push({ test: full, error: e && e.message ? e.message : String(e), stack: e && e.stack });
    }
  }
}

function report(title) {
  const finish = () => {
    const total = results.passed + results.failed;
    // **S5.2 (P-11a):** הדילוגים חייבים להופיע בכל שורת סיכום — "5/5 passed"
    // עם דילוג שקט באמצע הוא שקר לבן.
    console.log(`\n== ${title}: ${results.passed}/${total} passed, ${results.failed} failed, ${results.skipped} skipped ==`);
    for (const f of results.failures) {
      console.log(`FAIL: ${f.test}\n  ${f.error}`);
    }
    if (results.failed > 0) process.exitCode = 1;
    // **S5.2 (P-11a):** ב-CI ההתקנה אמורה לכסות הכל (poppler, dejavu, כל
    // ה-fixtureים בעץ) — דילוג שם אינו "לא רלוונטי" אלא סביבה שבורה שמסתירה
    // כיסוי. לכן: דילוג ב-CI מאדים את הריצה.
    if (process.env.CI && results.skipped > 0) {
      console.error(`✗ ${results.skipped} בדיקות דולגו בסביבת CI — דילוג ב-CI משמעו סביבה שבורה (חסר poppler/dejavu/fixture?)`);
      process.exitCode = 1;
    }
  };
  runAll().then(finish, finish);
}

module.exports = { describe, it, assert, assertEq, assertClose, report, results };
