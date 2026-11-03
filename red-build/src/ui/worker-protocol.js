// src/ui/worker-protocol.js — פרוטוקול Worker↔UI (REQ-UI-03, D-65)
'use strict';

/**
 * **D-65 — פרוטוקול מנוע ב־Worker:** הודעות מוגדרות סכמה, מזהי עבודה חד־חוזיים,
 * וסריאליזציה שממירה את תוצאת המנוע (Ledger/EventLog הם class-instances עם Map)
 * למבנה plain-JSON שעובר structured-clone בגבול ה־Worker.
 *
 * הסכמה (v1):
 *   → {type:'typeset-request', jobId, text, settings}
 *   → {type:'cancel', jobId}
 *   ← {type:'progress', jobId, stage, pct, label, pageIndex?, totalPages?, estimatedTotal?}
 *   ← {type:'typeset-result', jobId, result}      // result = serializeTypesetResult()
 *   ← {type:'typeset-error', jobId, message, stack?}
 */

const PROTOCOL_VERSION = 1;

/** סריאליזציית תוצאת מנוע → plain JSON עובר structured-clone (D-65). */
function serializeTypesetResult(result) {
  const { buildReport } = require('../audit/report-schema');
  const report = buildReport(result);
  return {
    schema: 'ui-result-v1',
    layoutHash: result.layoutHash,
    plannedLayoutHash: result.plannedLayoutHash,
    contentHashIn: result.contentHashIn,
    contentPreserved: result.contentPreserved,
    geometryNeutralVerified: result.geometryNeutralVerified,
    deterministic: report.deterministic,
    metadata: result.metadata,
    settings: result.settings,
    pages: result.pages,                 // עצמים פשוטים (columns/lines/template) — ניתנים להעברה
    report,                              // findings + counts + retreat (plain)
    trace: result.events.toTraceV2(),    // events: [{seq,stage,label,pageIndex,ts,payload}]
    ledger: result.ledger.toSchemaV2(),  // issues: [...] (lifecycle מלא)
    ledgerSummary: result.ledger.summary(),
    toc: result.toc,
    tocInsert: result.tocInsert,
    numberingAudit: result.numberingAudit,
    tokens: result.tokens.map(t => ({ id: t.id, type: t.type, level: t.level || null, raw: t.raw || '' })),
    droppedEvents: result.events.droppedEvents,
    recommendations: result.recommendations || null,   // **S11:** המלצות עריכה עם הוכחות (plain)
    customStyles: result.customStyles ? { ok: result.customStyles.ok, count: result.customStyles.styles.length, errors: result.customStyles.errors } : null
  };
}

/** ולידציה הודעת בקשה מה־UI (worker-side). @throws Error על סכמה שגויה */
function validateRequest(msg) {
  if (!msg || typeof msg !== 'object') throw new Error('protocol: message must be object');
  if (msg.type === 'typeset-request') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.text !== 'string') throw new Error('protocol: text must be string');
    if (!msg.settings || typeof msg.settings !== 'object') throw new Error('protocol: settings required');
    return true;
  }
  if (msg.type === 'cancel') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    return true;
  }
  throw new Error(`protocol: unknown message type ${msg && msg.type}`);
}

/** בניית הודעת התקדמות (worker-side). */
function progressMessage(jobId, info) {
  return {
    type: 'progress', jobId,
    stage: info.stage, pct: info.pct, label: info.label,
    pageIndex: info.pageIndex != null ? info.pageIndex : null,
    totalPages: info.totalPages != null ? info.totalPages : null,
    estimatedTotal: info.estimatedTotal != null ? info.estimatedTotal : null
  };
}

module.exports = { PROTOCOL_VERSION, serializeTypesetResult, validateRequest, progressMessage };
