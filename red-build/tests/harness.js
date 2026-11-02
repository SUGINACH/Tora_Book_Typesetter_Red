// tests/harness.js — Mini test framework (zero dependencies, deterministic)
// תבנית: describe(name, fn) / it(name, fn) ; it זורק בכשל. סיכום + exit code לפי ממצאים.
'use strict';

const results = { passed: 0, failed: 0, failures: [] };
let currentSuite = '';

function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = prev ? `${prev} › ${name}` : name;
  fn();
  currentSuite = prev;
}

function it(name, fn) {
  const full = currentSuite ? `${currentSuite} › ${name}` : name;
  try {
    fn();
    results.passed++;
  } catch (e) {
    results.failed++;
    results.failures.push({ test: full, error: e && e.message ? e.message : String(e), stack: e && e.stack });
  }
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

function report(title) {
  const total = results.passed + results.failed;
  console.log(`\n== ${title}: ${results.passed}/${total} passed, ${results.failed} failed ==`);
  for (const f of results.failures) {
    console.log(`FAIL: ${f.test}\n  ${f.error}`);
  }
  if (results.failed > 0) process.exitCode = 1;
}

module.exports = { describe, it, assert, assertEq, assertClose, report, results };
