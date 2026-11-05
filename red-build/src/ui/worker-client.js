// src/ui/worker-client.js — לקוח מנוע־Worker: single-flight, progress, cancel (REQ-UI-03, D-65)
'use strict';

// הערה ארכיטקטונית: צד ה־Worker (engine-worker-main) אינו נדרש כאן — התעבורה
// ה-inline חיה ב־inline-transport.js (לבדיקות/Node). כך bundle הדפדפן של ה־UI
// אינו גורר את המנוע פעמיים (המנוע נטען רק ב־engine-worker.bundle.js — D-65).

let jobSeq = 0;

/** **S5.2:** קוד שגיאה קבוע לעבודות שמתו עם terminate של ה־Worker (ביטול/החלפה).
 * חוזה יציב: המאזינים (app-shell/imud-library) מזהים אותו במחרוזת ההודעה. */
const RESTART_ERROR = 'worker-restarted';

/** **S5.2:** קידומת לשגיאות worker.onerror (קריסה/כשל טעינה) — שונה מ-RESTART_ERROR:
 * הפעלה מחדש ביוזמתנו = שקט; כשל אמיתי של המנוע = מדווח למשתמש. */
const WORKER_ERROR_PREFIX = 'worker-error: ';

class WorkerEngineClient {
  /**
   * @param {{post:(m:object)=>void, setHandler:(cb:(m:object)=>void)=>void, terminate?:()=>void, setOnError?:(cb:(e:object)=>void)=>void}} transport
   */
  constructor(transport) {
    if (!transport || typeof transport.post !== 'function' || typeof transport.setHandler !== 'function') {
      throw new Error('WorkerEngineClient: transport {post, setHandler} required');
    }
    this.transport = transport;
    this.activeJob = null;      // {jobId, resolve, reject, onProgress, cancelled}
    this.pending = new Map();   // **03.11:** עבודות צד (ייצוא/רישום גופן) — מקבילות לעימוד
    this._errorCbs = [];       // **S5.2:** מאזיני כשל של התעבורה (worker.onerror)
    transport.setHandler((m) => this._onMessage(m));
    if (typeof transport.setOnError === 'function') transport.setOnError((e) => this._onTransportError(e));
  }

  /** **S5.2:** רישום מאזין לכשל/קריסה של ה־Worker (למשל דפדפן: הודעת מצב עברית).
   * @returns {()=>void} ביטול רישום. */
  onError(cb) {
    if (typeof cb !== 'function') return () => {};
    this._errorCbs.push(cb);
    return () => {
      const i = this._errorCbs.indexOf(cb);
      if (i >= 0) this._errorCbs.splice(i, 1);
    };
  }

  _notifyError(err) {
    for (const cb of this._errorCbs.slice()) {
      try { cb(err); } catch (e) { /* מאזין קולקני — לא חוסם */ }
    }
  }

  /** **S5.2:** worker.onerror — המנוע מת/לא נטען: דחיית כל הבטחות בטיסה + הודעה
   * למאזינים. התעבורה כבר סימנה את עצמה ל-respawn בפוסט הבא — בקשה חדשה
   * תעבוד על מופע טרי (זה תיקון התלייה: לפני כן הפוסט היה מגיע ל-Worker מת). */
  _onTransportError(ev) {
    const detail = (ev && (ev.message || (ev.error && ev.error.message))) || 'worker failed to load';
    const reason = WORKER_ERROR_PREFIX + detail;
    const job = this.activeJob;
    if (job) {
      this.activeJob = null;
      const rej = job.reject; job.resolve = null; job.reject = null;
      if (rej) try { rej(new Error(reason)); } catch (e) { /* נקי כבר */ }
    }
    this._rejectPending(reason);
    this._notifyError(new Error(reason));
  }

  /** **S5.2:** דחיית כל עבודות הצד הממתינות (ייצוא/רישום גופן) — הן לעולם לא
   * ייענו על Worker שמת; בלי זה ההבטחות נתלות לנצח ("הייצוא נתקע"). */
  _rejectPending(reason) {
    for (const [jid, p] of Array.from(this.pending)) {
      this.pending.delete(jid);
      try { p.reject(new Error(reason)); } catch (e) { /* נקי כבר */ }
    }
  }

  _onMessage(m) {
    // **03.11:** הודעות עבודות צד — לפי מזהה במפת ההמתנה
    if (m && m.jobId && this.pending.has(m.jobId)) {
      const p = this.pending.get(m.jobId);
      this.pending.delete(m.jobId);
      if (m.type === 'export-error') p.reject(new Error(`export: ${m.message}`));
      else if (m.type === 'export-result' && m.ok === false) p.reject(new Error(`export: ${m.error || 'failed'}`));
      else p.resolve(m);
      return;
    }
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

  /** רישום עבודת צד במפת ההמתנה. */
  _newPendingJob(prefix) {
    const jobId = `${prefix}-${Date.now().toString(36)}-${++jobSeq}`;
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    this.pending.set(jobId, { resolve, reject });
    return { jobId, promise };
  }

  /** **03.11:** רישום גופן TTF במנוע (למדידת גופן אמיתי בעימוד הבא). */
  registerFont({ name, bytes }) {
    const { jobId, promise } = this._newPendingJob('font');
    this.transport.post({ type: 'register-font', jobId, name, bytes });
    return promise;
  }

  /** **03.11:** רישום אוסף נכסי עיצוב ברישום שבמנוע (שני הצדדים פותרים imud:...). */
  registerAssets({ collection, items }) {
    const { jobId, promise } = this._newPendingJob('assets');
    this.transport.post({ type: 'register-assets', jobId, collection, items });
    return promise;
  }

  /** **03.11:** בקשת ייצוא PDF/ZIP במנוע המלא שב־Worker. bytes חוזר כ-Uint8Array. */
  requestExport({ kind, text, settings, fontBytes, fontName, extensions }) {
    const { jobId, promise } = this._newPendingJob('export');
    this.transport.post({ type: 'export-request', jobId, kind, text, settings, fontBytes: fontBytes || null, fontName: fontName || null, extensions: extensions || null });
    return promise;
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

  /** **S5.2:** ביטול העבודה הפעילה: סימון + הודעת cancel + terminate (המנוע סינכרוני —
   * זו הדרך היחידה לקטוע ריצה ארוכה ב־Worker). ה-respawn ממומש כעת בתעבורה
   * (workerTransport): הפוסט הבא בונה מופע חדש — בעבר ההערה "respawn בעת הבקשה
   * הבאה" לא מומשה בשום מקום ⇒ כל בקשה אחרי ביטול נשלחה ל־Worker מת ⇒ האפליקציה
   * נתקעה לנצח ב"מנוע: עמל…".
   * כשהתעבורה מסוגלת להרוג (terminate): העבודה הפעילה ועבודות הצד שבטיסה
   * נדחות ב־RESTART_ERROR — הן לעולם לא ייענו; בלי זה ההבטחות נתלות (bug S5.2).
   * תעבורה בלי terminate (תיאורטי): המנוע חי — הפרדה {cancelled:true} המקורית. */
  cancel() {
    const job = this.activeJob;
    if (!job) return;
    job.cancelled = true;
    this.transport.post({ type: 'cancel', jobId: job.jobId });
    const killed = typeof this.transport.terminate === 'function';
    if (killed) this.transport.terminate(); // ה-respawn: בפוסט הבא (workerTransport)
    this.activeJob = null;
    const resolve = job.resolve, reject = job.reject;
    job.resolve = null; job.reject = null;
    if (killed) {
      // **S5.2:** המנוע מת — התוצאה לעולם לא תחזור: דחייה מפורשת, לא הבטחה תלויה.
      if (reject) reject(new Error(RESTART_ERROR));
      this._rejectPending(RESTART_ERROR); // עבודות צד (ייצוא/רישום) מתות עמו
    } else if (resolve) {
      resolve({ cancelled: true }); // ההבטחה נפרדת במפורש — לא נתלית לנצח
    }
  }

  get busy() { return this.activeJob != null; }
}

/** **S5.2:** מתאם Worker אמיתי (דפדפן) — עם respawn.
 * בעבר קיבל מופע קיים; עכשיו מפעל () => new Worker(url): ה־terminate (ביטול/
 * קריסה) מסמן דגל terminated, וה-post הבא בונה מופע חדש מאותו URL
 * (כולל ?v= — אותו cache-busting גם אחרי respawn) ומחדש את המאזינים.
 * כך בקשה אחרי cancel/קריסה לא נשלחת ל־Worker מת. */
function workerTransport(factory) {
  if (typeof factory !== 'function') throw new Error('workerTransport: factory () => Worker required');
  let worker = null;      // המופע החי (null ⇒ עדיין לא נוצר)
  let terminated = false; // **S5.2:** דגל מוות — true עד respawn בפוסט הבא
  let handler = null;     // פונקציית ההודעות של הלקוח
  let errorSink = null;   // **S5.2:** worker.onerror → הלקוח (דחיית בטיסה + הודעה)

  function attach(w) {
    w.onmessage = (ev) => { if (handler) handler(ev.data); };
    w.onerror = (e) => {
      // המופע שבדק כשל (כולל כשל טעינה) — נסגר ויבוא חדש בפוסט הבא
      try { w.terminate(); } catch (e2) { /* כבר מת */ }
      terminated = true;
      if (errorSink) { try { errorSink(e); } catch (e2) { /* מאזין קולקני */ } }
    };
  }

  function ensure() {
    if (worker && !terminated) return worker;
    worker = factory();       // respawn — אותו URL (?v=) כמו בעלייה הראשונה
    terminated = false;
    attach(worker);
    return worker;
  }

  return {
    post: (m) => { ensure().postMessage(m); },
    setHandler: (cb) => {
      handler = cb;
      if (worker && !terminated) attach(worker); // רישום חוזר — מחדש גם על מופע קיים
    },
    setOnError: (cb) => { errorSink = cb; }, // **S5.2:** אופציונלי — inline אין לו
    terminate: () => {
      if (worker && !terminated) { try { worker.terminate(); } catch (e) { /* כבר מת */ } }
      terminated = true; // הפוסט הבא יבנה מחדש (respawn)
    }
  };
}

module.exports = { WorkerEngineClient, workerTransport, RESTART_ERROR, WORKER_ERROR_PREFIX };
