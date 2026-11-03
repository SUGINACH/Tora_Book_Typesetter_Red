// src/ui/worker-client.js — לקוח מנוע־Worker: single-flight, progress, cancel (REQ-UI-03, D-65)
'use strict';

// הערה ארכיטקטונית: צד ה־Worker (engine-worker-main) אינו נדרש כאן — התעבורה
// ה-inline חיה ב־inline-transport.js (לבדיקות/Node). כך bundle הדפדפן של ה־UI
// אינו גורר את המנוע פעמיים (המנוע נטען רק ב־engine-worker.bundle.js — D-65).

let jobSeq = 0;
class WorkerEngineClient {
  /**
   * @param {{post:(m:object)=>void, setHandler:(cb:(m:object)=>void)=>void, terminate?:()=>void}} transport
   */
  constructor(transport) {
    if (!transport || typeof transport.post !== 'function' || typeof transport.setHandler !== 'function') {
      throw new Error('WorkerEngineClient: transport {post, setHandler} required');
    }
    this.transport = transport;
    this.activeJob = null;      // {jobId, resolve, reject, onProgress, cancelled}
    transport.setHandler((m) => this._onMessage(m));
  }

  _onMessage(m) {
    const job = this.activeJob;
    if (!job || !m || m.jobId !== job.jobId) return; // הודעה מעבודה ישנה/זרה — נזרקת
    if (m.type === 'progress') {
      if (!job.cancelled && job.onProgress) job.onProgress(m);
      return;
    }
    if (m.type === 'typeset-result') {
      this.activeJob = null;
      if (!job.cancelled) job.resolve(m.result);
      return;
    }
    if (m.type === 'typeset-error') {
      this.activeJob = null;
      if (!job.cancelled) job.reject(new Error(`engine: ${m.message}`));
    }
  }

  /**
   * בקשת עימוד. בקשה חדשה בזמן עבודה פעילה מבטלת את הקודמת (single-flight).
   * @returns {{promise:Promise<object>, jobId:string, cancel:()=>void}}
   */
  requestTypeset({ text, settings, onProgress }) {
    if (this.activeJob) this.cancel();
    const jobId = `job-${Date.now().toString(36)}-${++jobSeq}`;
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    const job = { jobId, resolve, reject, onProgress: onProgress || null, cancelled: false };
    this.activeJob = job;
    this.transport.post({ type: 'typeset-request', jobId, text, settings });
    return { promise, jobId, cancel: () => this.cancel() };
  }

  /** ביטול העבודה הפעילה: סימון + הודעת cancel (+terminate בזמן ריצה ארוכה). */
  cancel() {
    const job = this.activeJob;
    if (!job) return;
    job.cancelled = true;
    this.transport.post({ type: 'cancel', jobId: job.jobId });
    if (typeof this.transport.terminate === 'function') this.transport.terminate(); // respawn בעת הבקשה הבאה
    this.activeJob = null;
    const resolve = job.resolve;
    job.resolve = null; job.reject = null;
    if (resolve) resolve({ cancelled: true }); // ההבטחה נפרדת במפורש — לא נתלית לנצח
  }

  get busy() { return this.activeJob != null; }
}

/** מתאם Worker אמיתי (דפדפן). */
function workerTransport(worker) {
  return {
    post: (m) => worker.postMessage(m),
    setHandler: (cb) => { worker.onmessage = (ev) => cb(ev.data); },
    terminate: () => worker.terminate()
  };
}

module.exports = { WorkerEngineClient, workerTransport };
