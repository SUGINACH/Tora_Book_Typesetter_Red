// src/ui/engine-worker-main.js — צד ה־Worker של המנוע (REQ-UI-03, D-65)
'use strict';

/**
 * נקודת הכניסה של ה־Worker: מריץ typeset() ומחזיר תוצאה מסוריאליזת פרוטוקול.
 * נטען הן ב־Worker אמיתי (דרך ה־bundle ב־ui/engine-worker.bundle.js) והן
 * in-process בבדיקות/Node (InlineEngine) — אותו קוד, אותו פרוטוקול.
 *
 * ביטול (cancel): המנוע סינכרוני; ב־Worker אמיתי הביטול הוא terminate+respawn
 * (הלקוח אחראי). כאן — סימון העבודה כמבוטלת וזריקת התוצאה (לא נשלחת).
 */

const { typeset } = require('../engine/core/pipeline');
const { serializeTypesetResult, validateRequest, progressMessage } = require('./worker-protocol');

let cancelledJobs = new Set();

/** טיפול register-font (03.11): רישום TTF למדידת גופן אמיתי בעימוד שיידרש. */
function handleRegisterFont(msg, post) {
  try {
    const { registerFont } = require('../engine/typography/measure-api');
    const u8 = msg.bytes instanceof ArrayBuffer ? new Uint8Array(msg.bytes) : new Uint8Array(msg.bytes.buffer, msg.bytes.byteOffset, msg.bytes.length);
    const reg = registerFont(msg.name, u8);
    if (reg.ok) {
      const glyphCount = reg.profile && reg.profile.font && reg.profile.font.numGlyphs != null ? reg.profile.font.numGlyphs : null;
      post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: true, glyphCount });
    } else {
      post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: false, error: reg.error || 'register-failed' });
    }
  } catch (e) {
    post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: false, error: e && e.message ? e.message : String(e) });
  }
}

/** טיפול register-assets (03.11): אוסף עיצובים לרישום המנוע — חיטוי SVG בפנים. */
function handleRegisterAssets(msg, post) {
  try {
    const { registerAssets } = require('../engine/decoration/asset-registry');
    const res = registerAssets(msg.collection, msg.items);
    post({ type: 'register-assets-result', jobId: msg.jobId, collection: msg.collection, registered: res.registered, rejected: res.rejected });
  } catch (e) {
    post({ type: 'register-assets-result', jobId: msg.jobId, collection: msg.collection, registered: 0, rejected: [{ id: '-', reason: e && e.message ? e.message : String(e) }] });
  }
}

/** טיפול export-request (03.11): PDF/ZIP במנוע המלא — הודף הכבד חי ב־Worker בלבד.
 * הפלט מועתק ל-Uint8Array טהור (בלי byteOffset) — structured-clone/transfer בטוחים. */
function handleExportRequest(msg, post) {
  try {
    const { exportPdf, exportProjectZip } = require('../engine/output/export-api');
    if (msg.kind === 'pdf') {
      if (msg.fontBytes == null) {
        post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: 'no-embedded-font' });
        return;
      }
      const u8 = msg.fontBytes instanceof ArrayBuffer ? new Uint8Array(msg.fontBytes) : new Uint8Array(msg.fontBytes.buffer, msg.fontBytes.byteOffset, msg.fontBytes.length);
      const res = exportPdf(msg.text, msg.settings, u8, msg.fontName);
      if (!res.ok) { post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: res.error }); return; }
      post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: true, bytes: new Uint8Array(res.bytes), info: res.info || null });
      return;
    }
    if (msg.kind === 'zip') {
      const bytes = exportProjectZip(msg.text, msg.settings, { extensions: msg.extensions || null });
      post({ type: 'export-result', jobId: msg.jobId, kind: 'zip', ok: true, bytes: new Uint8Array(bytes) });
      return;
    }
    post({ type: 'export-error', jobId: msg.jobId, message: `unknown export kind ${msg.kind}` });
  } catch (e) {
    post({ type: 'export-error', jobId: msg.jobId, message: e && e.message ? e.message : String(e) });
  }
}

/** מטפל הודעות — pure, מקבל post חיצוני (מבודד לבדיקות). */
function createEngineWorkerMain(post) {
  if (typeof post !== 'function') throw new Error('engine-worker-main: post(message) required');
  return function onMessage(msg) {
    try {
      validateRequest(msg);
    } catch (e) {
      post({ type: 'typeset-error', jobId: (msg && msg.jobId) || null, message: e.message });
      return;
    }
    if (msg.type === 'cancel') {
      cancelledJobs.add(msg.jobId);
      return;
    }
    if (msg.type === 'register-font') { handleRegisterFont(msg, post); return; }
    if (msg.type === 'register-assets') { handleRegisterAssets(msg, post); return; }
    if (msg.type === 'export-request') { handleExportRequest(msg, post); return; }
    const jobId = msg.jobId;
    try {
      const result = typeset(msg.text, msg.settings, {
        onProgress: (info) => {
          if (!cancelledJobs.has(jobId)) post(progressMessage(jobId, info));
        }
      });
      if (cancelledJobs.has(jobId)) {
        cancelledJobs.delete(jobId); // העבודה בוטלה — התוצאה נזרקת בזמן שנותרה מסומנת
        return;
      }
      post({ type: 'typeset-result', jobId, result: serializeTypesetResult(result) });
    } catch (e) {
      if (cancelledJobs.has(jobId)) { cancelledJobs.delete(jobId); return; }
      post({ type: 'typeset-error', jobId, message: e && e.message ? e.message : String(e) });
    }
  };
}

/** הרכבה עצמאית לסביבת Worker אמיתית (self.onmessage). */
function bootWorkerContext(ctx) {
  const handler = createEngineWorkerMain((m) => ctx.postMessage(m));
  ctx.onmessage = (ev) => handler(ev.data);
}

// ב־Worker אמיתי: self קיים ואין require/module (ה־bundle מספק אותם); ב־Node — לא.
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof self.onmessage !== 'undefined' && typeof window === 'undefined') {
  bootWorkerContext(self);
}

module.exports = { createEngineWorkerMain, bootWorkerContext };
