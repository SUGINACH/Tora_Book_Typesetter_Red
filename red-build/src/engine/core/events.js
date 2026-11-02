// src/engine/core/events.js — Event log / Trace collector (REQ-GOV-01)
'use strict';

/**
 * EventLog — רישום אירועי מנוע: שלבים, תוויות, payload, דף.
 * המכשור אסור לשנות פריסה — no-op proof נאכף ב‑CI (REQ-GOV-01/U-A7).
 */
class EventLog {
  /**
   * @param {string} verbosity - 'off'|'minimal'|'standard'|'full' (key: trace-verbosity, REQ-GOV-01)
   */
  constructor(verbosity = 'full') {
    this.verbosity = verbosity; // settings['trace-verbosity']
    this.events = [];
    this.droppedEvents = 0; // חייב להישאר 0 (REQ-GOV-01)
    this.stageOrder = [
      'parse', 'scope-map', 'style-prepass', 'fonts-ready', 'measure', 'line-plan',
      'page-plan', 'protections', 'balance', 'justify', 'notes-budget', 'refit',
      'decorations', 'headers', 'folio', 'toc', 'ledger-finalize', 'render'
    ];
  }

  emit(stage, label, payload = {}, pageIndex = null) {
    if (!this.stageOrder.includes(stage)) {
      this.droppedEvents++;
      return;
    }
    if (this.verbosity === 'off') return;              // trace-verbosity → off: no logging at all
    if (this.verbosity === 'minimal') payload = {};    // stage+label only
    if (this.verbosity !== 'full') pageIndex = null;   // standard: no per-page detail
    this.events.push({
      seq: this.events.length + 1,
      stage, label, pageIndex,
      ts: Date.now(),
      payload
    });
  }

  toTraceV2() {
    return { schema: 'trace-v2', droppedEvents: this.droppedEvents, events: this.events.slice() };
  }
}

module.exports = { EventLog };
