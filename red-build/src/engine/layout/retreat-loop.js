// src/engine/layout/retreat-loop.js — Unified retreat loop + oscillation detector (S5.1.5, K-3)
'use strict';

/**
 * בקר איטרציה יחיד השולט באינטראקציות: paren-protection ↔ widow/orphan ↔ balance ↔ heading.
 * קריטריון התכנסות: מצב יציב (אין הפרות חדשות שניתן לתקן) או הגעה לתקרת איטרציות.
 * גלאי תנודה: אם אותו ממצא נפתח וניצור חזור על עצמו >N → הקפאת הפשרה הטובה + רישום 'rollback-compromise'.
 */

const MAX_ITERATIONS = 24;
const OSCILLATION_WINDOW = 4;

/**
 * @param {object} ctx - {pages, settings, ledger, eventLog, repairFns:{balance,parens,widows,headings}, assess(page)=>violations[]}
 */
function runRetreatLoop(ctx) {
  const { pages, settings, ledger, eventLog, repairFns, assess } = ctx;
  const history = []; // [{signature}]
  let iteration = 0;
  let lastSignature = null;

  // key: diagnostics-enabled — לולאת הריטרייט היא הצרכן: סמכות האבחון קובעת
  // האם ממצאים נרשמים ב‑ledger (אבחון פעיל) או שהלולאה רצה בשקט (REQ-GOV-01).
  const diagEnabled = !settings || settings['diagnostics-enabled'] !== false;
  // key: debounce-light-change-ms — ריכוך קריאות חוזרות ונשנות של אותו תיקון קל
  // בתוך איטרציה אחת (מניעת עומס על measure/worker; ברירת מחדל 350ms).
  const lightRepairDebounceMs = (settings && settings['debounce-light-change-ms']) || 350;
  const lastLightRunAt = {}; // kind -> iteration timestamp budget marker

  /**
   * S7-E2E תיקון (מניעת הצפת ledger): assess עם dryLedger — רשומות ממצאים נוצרות
   * רק כשהתיקון **אינו אפשרי** או כשהלולאה קפואה. מעבר בין איטרציות יוצר ומיד
   * מסמן 'resolved' (הפרה שהותרה), כך של‑ledger אין הצפה של עותקי "created".
   */
  function makeDryLedger() {
    const dry = Object.create(ledger);
    dry.create = (...a) => { const rec = ledger.create(...a); return rec; };
    return dry;
  }

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    const allViolations = [];
    for (const page of pages) {
      const dry = makeDryLedger();
      const vs = assess(page, settings, dry);
      for (const v of vs) {
        // ממצא שיחודד באיטרציה הזו — אם יש לו repair, סמן resolved לפני המעבר
        if (repairFns[v.kind]) ledger.transition(v.ledgerRef, 'resolved', 'protections', `will be repaired in iter#${iteration}`);
      }
      allViolations.push(...vs);
    }
    if (!allViolations.length) {
      eventLog.emit('protections', 'retreat-converged', { iterations: iteration });
      return { converged: true, iterations: iteration, compromise: null };
    }

    const signature = allViolations.map(v => `${v.kind}@${v.target}`).sort().join('|');

    // זיהוי תנודה: החתימה חוזרת על עצמה בתוך חלון
    const recent = history.slice(-OSCILLATION_WINDOW);
    if (recent.some(h => h === signature)) {
      // ping-pong → הקפאת הפשרה הטובה ביותר שנצפתה
      let rec = null;
      if (diagEnabled) {
        rec = ledger.create('rollback-compromise', `loop@iter${iteration}`, null, { signature }, 'protections');
        ledger.transition(rec.issue_id, 'competing-repair-side-effect', 'protections', 'oscillation detected — freezing best legal compromise');
      }
      eventLog.emit('protections', 'oscillation-detected', { iteration, signature });
      return { converged: false, iterations: iteration, compromise: rec ? rec.issue_id : null, frozenSignatures: history };
    }

    history.push(signature);
    lastSignature = signature;

    // הפעלת תיקונים לפי סדר עדיפות קבוע (דטרמיניסטי): parens → widows → headings → balance
    const kinds = new Set(allViolations.map(v => v.kind));
    const order = ['paren-cross-boundary', 'widow-bottom', 'orphan-top', 'heading-escort', 'column-imbalance'];
    const LIGHT_REPAIRS = new Set(['widow-bottom', 'orphan-top']); // תיקוני שורה בלבד — ניתנים לריכוך
    for (const kind of order) {
      if (!kinds.has(kind) || !repairFns[kind]) continue;
      if (LIGHT_REPAIRS.has(kind)) {
        // debounce: אם אותו סוג תיקון קל רץ באיטרציה העוקבת מיד, דחה מחזור אחד
        const prev = lastLightRunAt[kind];
        if (prev !== undefined && (iteration - prev) * lightRepairDebounceMs < lightRepairDebounceMs * 2 && prev === iteration - 1) {
          continue; // ריכוך: לא להפעיל שני תיקונים קלים גב־אל־גב מאותו סוג
        }
        lastLightRunAt[kind] = iteration;
      }
      repairFns[kind](allViolations.filter(v => v.kind === kind), ctx);
    }
    eventLog.emit('protections', 'retreat-iteration', { iteration, violationCount: allViolations.length });
  }

  // תקרה ללא התכנסות — פשרה אחרונה
  let rec = null;
  if (diagEnabled) {
    rec = ledger.create('rollback-compromise', 'loop-ceiling', null, { lastSignature }, 'protections');
    ledger.transition(rec.issue_id, 'unresolved', 'protections', 'max iterations reached');
  }
  return { converged: false, iterations: iteration, compromise: rec ? rec.issue_id : null };
}

module.exports = { runRetreatLoop, MAX_ITERATIONS, OSCILLATION_WINDOW };
