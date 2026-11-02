// tests/harness.js — Mini test framework (zero dependencies, deterministic)
// תבנית: describe(name, fn) / it(name, fn) ; it זורק בכשל. סיכום + exit code לפי ממצאים.
// **S10:** תמיכה מלאה בבדיקות אסינכרוניות — הרצה סדרתית (הסדר נשמר במדויק,
// גם בין sync ל־async) כך that תלויות בין־בדיקות בתוך suite עובדות כמצופה.
// תואם לאחור לחלוטין: בדיקות סינכרוניות (S1–S9) מתנהגות כמקודם.
'use strict';

const results = { passed: 0, failed: 0, failures: [] };
let currentSuite = '';
const queue = []; // {full, fn} — נרשמים בזמן describe; מבוצעים בסדר הרישום

function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} › ${name}` : name;
  fn();
  currentSuite = prev;
}

function it(name, fn) {
  const full = currentSuite ? `${currentSuite} › ${name}` : name;
  queue.push({ full, fn });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg || 'not equal'}\n  actual:   ${a}\n  expected: ${b}`);
}

function assertClose(actual, expected, tol, msg) {
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${msg || 'not close'}: |${actual} - ${expected}| > ${tol}`);
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
    console.log(`\n== ${title}: ${results.passed}/${total} passed, ${results.failed} failed ==`);
    for (const f of results.failures) {
      console.log(`FAIL: ${f.test}\n  ${f.error}`);
    }
    if (results.failed > 0) process.exitCode = 1;
  };
  runAll().then(finish, finish);
}

module.exports = { describe, it, assert, assertEq, assertClose, report, results };
