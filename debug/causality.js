/* debug/causality.js — ציר שלבים (checkpoints) + מסווג סיבתיות + השוואת ממצאים
 *
 * RED כבר מייצר trace (events לפי שלב, CP1..CP5) ו-ledger (מחזור חיים לכל בעיה) — לכן ציר השלבים
 * והסיווג נבנים מהם ישירות, בלי לשנות את המנוע.
 *  - classifyLedgerIssue: מיפוי מחזור-חיים של RED ל-7 הקטגוריות של Gold.
 *  - classifyCausality:  הפורט המקורי של Gold (על snapshots {stage,pageCount,issues}) — לשימוש
 *    כשיאושר hook ל-snapshots (ראה debug/proposals).
 *  - diffFindings: מה נוסף/נעלם בין שתי ריצות audit (לפני/אחרי שינוי הגדרות או קוד).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RedCausality = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // תואם ל-EventLog.stageOrder של המנוע
  const STAGE_ORDER = ['parse', 'scope-map', 'style-prepass', 'fonts-ready', 'measure', 'line-plan',
    'page-plan', 'protections', 'balance', 'justify', 'notes-budget', 'refit',
    'decorations', 'headers', 'folio', 'toc', 'ledger-finalize', 'render'];

  const CATEGORY_HE = {
    'created-by-stage': 'נוצרה ע"י שלב',
    'fixed-by-stage': 'תוקנה ע"י שלב',
    'correction-reverted': 'תיקון בוטל',
    'couldnt-appear-before': 'לא יכלה להופיע קודם',
    'created-at-first-checkpoint': 'נוצרה בשלב הראשון',
    'never-appeared': 'מעולם לא הופיעה',
    'unresolved': 'לא נפתרה',
    'not-comparable': 'לא ניתנת להשוואה'
  };

  const BUCKET = { created: 'created', reintroduced: 'created', resolved: 'resolved', 'correction-reverted': 'reverted', 'correction-blocked': 'blocked' };

  /** ציר שלבים: לכל שלב — אירועים, checkpoints, והמעברים בלדג'ר (נוצרו/נפתרו/בוטלו/נחסמו) + כמה בעיות חיות אחריו. */
  function buildTimeline(trace, ledger) {
    const events = (trace && trace.events) || [];
    const issues = (ledger && ledger.issues) || [];
    const order = STAGE_ORDER.slice();
    const touch = s => { if (order.indexOf(s) < 0) order.push(s); };
    events.forEach(e => touch(e.stage));
    issues.forEach(i => (i.transitions || []).forEach(t => touch(t.stage)));
    const rows = order.map(stage => ({ stage, events: 0, labels: {}, checkpoints: [], created: [], resolved: [], reverted: [], blocked: [], other: [], alive: 0 }));
    const idx = {};
    rows.forEach((r, i) => { idx[r.stage] = i; });
    events.forEach(e => {
      const r = rows[idx[e.stage]];
      r.events++;
      r.labels[e.label] = (r.labels[e.label] || 0) + 1;
      if (/^cp\d/.test(e.label) && r.checkpoints.indexOf(e.label) < 0) r.checkpoints.push(e.label);
    });
    issues.forEach(is => (is.transitions || []).forEach(t => {
      rows[idx[t.stage]][BUCKET[t.state] ? (BUCKET[t.state] === 'created' ? 'created' : BUCKET[t.state]) : 'other'].push(is.issue_id);
    }));
    let alive = 0;
    rows.forEach(r => { alive += r.created.length - r.resolved.length; r.alive = alive; });
    return rows.filter(r => r.events || r.created.length || r.resolved.length || r.reverted.length || r.blocked.length || r.other.length);
  }

  /** מיפוי מחזור-חיים ledger של RED → קטגוריית סיבתיות (שמות Gold). */
  function classifyLedgerIssue(is) {
    const T = is.transitions || [];
    const states = T.map(t => t.state);
    const at = s => { const t = T.find(x => x.state === s); return t ? t.stage : null; };
    const last = is.status || states[states.length - 1];
    let category, stage;
    if (states.indexOf('correction-reverted') >= 0 || states.indexOf('reintroduced') >= 0) {
      category = 'correction-reverted'; stage = at('correction-reverted') || at('reintroduced');
    } else if (last === 'resolved') {
      category = 'fixed-by-stage'; stage = at('resolved');
    } else if (states.indexOf('became-observable-later') >= 0) {
      category = 'couldnt-appear-before'; stage = at('became-observable-later');
    } else if (last === 'not-comparable') {
      category = 'not-comparable'; stage = at('not-comparable');
    } else if (['persists', 'correction-blocked', 'competing-repair-side-effect', 'unresolved'].indexOf(last) >= 0) {
      category = 'unresolved'; stage = T.length ? T[T.length - 1].stage : is.first_seen_stage;
    } else {
      category = 'created-by-stage'; stage = is.first_seen_stage;
    }
    return { issue_id: is.issue_id, kind: is.kind, page: is.page, origin: is.first_seen_stage, status: last, category, stage, path: states };
  }

  function buildCausality(ledger) {
    const issues = (ledger && ledger.issues) || [];
    const out = issues.map(classifyLedgerIssue);
    let first = Infinity;
    out.forEach(o => { const k = STAGE_ORDER.indexOf(o.origin); if (k >= 0 && k < first) first = k; });
    out.forEach(o => { if (o.category === 'created-by-stage' && STAGE_ORDER.indexOf(o.origin) === first) o.category = 'created-at-first-checkpoint'; });
    const byCategory = {};
    out.forEach(o => { byCategory[o.category] = (byCategory[o.category] || 0) + 1; });
    out.forEach(o => { o.label = CATEGORY_HE[o.category] + (o.stage ? ' — ' + o.stage : ''); });
    return { issues: out, byCategory, note: 'page = אינדקס בשלב התכנון (לפני הוספת שערים/תוכן) — לא אינדקס עמוד סופי' };
  }

  /** הפורט של Gold: snapshots = [{stage, pageCount, issues:[{kind, pageIdx}]}] */
  function classifyCausality(issue, checkpoints) {
    const pageIdx = issue.pageIdx;
    const app = checkpoints.map((cp, idx) => {
      const n = cp.issues.filter(i => i.kind === issue.kind && (i.pageIdx === pageIdx || (pageIdx < 0 && i.pageIdx < 0))).length;
      return { idx, stage: cp.stage, pageCount: cp.pageCount, present: n > 0, count: n };
    });
    const firstApp = app.find(a => a.present);
    if (!firstApp) return { category: 'never-appeared', appearances: app };
    const lastGood = firstApp.idx > 0 ? app[firstApp.idx - 1] : null;
    const gone = app.slice(firstApp.idx + 1).find(a => !a.present);
    if (gone) {
      const back = app.slice(gone.idx + 1).find(a => a.present);
      if (back) return { category: 'correction-reverted', appearances: app, firstApp, lastGood, fixed: gone, reappeared: back };
      return { category: 'fixed-by-stage', appearances: app, firstApp, lastGood, fixed: gone };
    }
    if (lastGood) {
      if (pageIdx >= lastGood.pageCount) return { category: 'couldnt-appear-before', appearances: app, firstApp, lastGood };
      return { category: 'created-by-stage', appearances: app, firstApp, lastGood };
    }
    return { category: 'created-at-first-checkpoint', appearances: app, firstApp };
  }

  /** מה נוסף / נעלם בין שני דוחות audit (מפתח: בדיקה+תת-סוג+עמוד+מיקום מעוגל). */
  function diffFindings(prev, next) {
    const key = f => [f.check, f.sub, f.page, f.rect ? Math.round(f.rect.x) + ',' + Math.round(f.rect.y) : '-'].join('|');
    const a = new Map(), b = new Map();
    ((prev && prev.findings) || []).forEach(f => a.set(key(f), f));
    ((next && next.findings) || []).forEach(f => b.set(key(f), f));
    const added = [], removed = [];
    b.forEach((f, k) => { if (!a.has(k)) added.push(f); });
    a.forEach((f, k) => { if (!b.has(k)) removed.push(f); });
    return { added, removed, unchanged: b.size - added.length };
  }

  return { STAGE_ORDER, CATEGORY_HE, buildTimeline, classifyLedgerIssue, buildCausality, classifyCausality, diffFindings };
});
