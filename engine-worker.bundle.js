// ui/engine-worker.bundle.js — **נוצר אוטומטית** ע"י tools/build-worker-bundle.js (אין לערוך ידנית)
// חבילת ה־Worker (המנוע המלא — אין לטעון בחוט ה־UI)
// מודולים: 43 · בלי חותמות זמן (דטרמיניזם)
'use strict';

var __crypto = (function () {
  'use strict';
  var K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function utf8Bytes(str) {
    var out = [], i = 0;
    while (i < str.length) {
      var c = str.codePointAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      i += c > 0xffff ? 2 : 1;
    }
    return out;
  }
  function sha256Hex(str) {
    var msg = utf8Bytes(str);
    var bitLen = msg.length * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    for (var i = 7; i >= 0; i--) msg.push(Math.floor(bitLen / Math.pow(2, i * 8)) & 0xff);
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var w = new Array(64);
    for (var blk = 0; blk < msg.length; blk += 64) {
      for (var t = 0; t < 16; t++) {
        w[t] = (msg[blk + t * 4] << 24) | (msg[blk + t * 4 + 1] << 16) | (msg[blk + t * 4 + 2] << 8) | msg[blk + t * 4 + 3];
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t-15],7) ^ rotr(w[t-15],18) ^ (w[t-15] >>> 3);
        var s1 = rotr(w[t-2],17) ^ rotr(w[t-2],19) ^ (w[t-2] >>> 10);
        w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h=g; g=f; f=e; e=(d + t1)|0; d=c; c=b; b=a; a=(t1 + t2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    var hex = '';
    for (i = 0; i < 8; i++) hex += (H[i] >>> 0).toString(16).padStart(8, '0');
    return hex;
  }
  return {
    createHash: function () {
      var parts = [];
      return {
        update: function (s) { parts.push(String(s)); return this; },
        digest: function (enc) {
          var hex = sha256Hex(parts.join(''));
          if (enc === 'binary' || enc === 'latin1') {
            var b = '';
            for (var i = 0; i < 64; i += 2) b += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
            return b;
          }
          return hex; // ברירת מחדל + 'hex'
        }
      };
    }
  };
})();

var __modules = {};
var __cache = {};
function __require(from, name) {
  if (name === 'crypto') return __crypto;
  if (name === 'zlib') return null; // **S11:** אין zlib בדפדפן — null מפעיל את המנפח הטהור (zip-reader)
  var key = __resolve(from, name);
  if (__cache[key]) return __cache[key].exports;
  var mod = { exports: {} };
  __cache[key] = mod;
  __modules[key](function (n) { return __require(key, n); }, mod, mod.exports);
  return mod.exports;
}
function __resolve(from, name) {
  var k = from + '|' + name;
  if (__paths[k]) return __paths[k];
  throw new Error('bundle: unresolved require ' + name + ' from ' + from);
}
var __paths = {
  "src/ui/engine-worker-main.js|../engine/core/pipeline": "src/engine/core/pipeline.js",
  "src/ui/engine-worker-main.js|./worker-protocol": "src/ui/worker-protocol.js",
  "src/engine/core/pipeline.js|./settings-registry": "src/engine/core/settings-registry.js",
  "src/engine/core/pipeline.js|../parser/dfa-lexer": "src/engine/parser/dfa-lexer.js",
  "src/engine/core/pipeline.js|../parser/block-tokenizer": "src/engine/parser/block-tokenizer.js",
  "src/engine/core/pipeline.js|../parser/bracket-scanner": "src/engine/parser/bracket-scanner.js",
  "src/engine/core/pipeline.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/core/pipeline.js|../typography/protectors": "src/engine/typography/protectors.js",
  "src/engine/core/pipeline.js|../typography/dropword": "src/engine/typography/dropword.js",
  "src/engine/core/pipeline.js|../layout/dp-planner": "src/engine/layout/dp-planner.js",
  "src/engine/core/pipeline.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/core/pipeline.js|../decoration/folio": "src/engine/decoration/folio.js",
  "src/engine/core/pipeline.js|../decoration/headers-builder": "src/engine/decoration/headers-builder.js",
  "src/engine/core/pipeline.js|../layout/balancing": "src/engine/layout/balancing.js",
  "src/engine/core/pipeline.js|../layout/headings-escort": "src/engine/layout/headings-escort.js",
  "src/engine/core/pipeline.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/core/pipeline.js|./ledger": "src/engine/core/ledger.js",
  "src/engine/core/pipeline.js|./events": "src/engine/core/events.js",
  "src/engine/core/pipeline.js|../audit/editing-recommendations": "src/engine/audit/editing-recommendations.js",
  "src/engine/core/pipeline.js|../extensions/style-schema": "src/engine/extensions/style-schema.js",
  "src/engine/core/pipeline.js|../extensions/apply-styles": "src/engine/extensions/apply-styles.js",
  "src/engine/core/pipeline.js|../decoration/ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/engine/core/pipeline.js|../decoration/shaar-pages": "src/engine/decoration/shaar-pages.js",
  "src/engine/core/pipeline.js|../decoration/custom-pages": "src/engine/decoration/custom-pages.js",
  "src/engine/core/pipeline.js|../decoration/toc-builder": "src/engine/decoration/toc-builder.js",
  "src/engine/core/pipeline.js|../layout/side-notes": "src/engine/layout/side-notes.js",
  "src/engine/core/pipeline.js|../decoration/ornament-plan": "src/engine/decoration/ornament-plan.js",
  "src/engine/core/pipeline.js|../layout/endnote-pages": "src/engine/layout/endnote-pages.js",
  "src/engine/core/pipeline.js|../decoration/numbering-audit": "src/engine/decoration/numbering-audit.js",
  "src/engine/core/pipeline.js|../decoration/toc-builder": "src/engine/decoration/toc-builder.js",
  "src/engine/core/pipeline.js|../decoration/folio": "src/engine/decoration/folio.js",
  "src/engine/core/pipeline.js|../decoration/headers-builder": "src/engine/decoration/headers-builder.js",
  "src/engine/core/pipeline.js|../decoration/toc-builder": "src/engine/decoration/toc-builder.js",
  "src/engine/parser/block-tokenizer.js|./dfa-lexer": "src/engine/parser/dfa-lexer.js",
  "src/engine/parser/block-tokenizer.js|./bracket-scanner": "src/engine/parser/bracket-scanner.js",
  "src/engine/typography/measure-api.js|./measure-table": "src/engine/typography/measure-table.js",
  "src/engine/typography/measure-api.js|./font-metrics": "src/engine/typography/font-metrics.js",
  "src/engine/typography/measure-api.js|./kp-linebreak": "src/engine/typography/kp-linebreak.js",
  "src/engine/layout/dp-planner.js|./page-templates": "src/engine/layout/page-templates.js",
  "src/engine/layout/dp-planner.js|../core/ledger": "src/engine/core/ledger.js",
  "src/engine/layout/dp-planner.js|./protections-matrix": "src/engine/layout/protections-matrix.js",
  "src/engine/layout/dp-planner.js|./retreat-loop": "src/engine/layout/retreat-loop.js",
  "src/engine/layout/dp-planner.js|./candidate-generator": "src/engine/layout/candidate-generator.js",
  "src/engine/layout/dp-planner.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/engine/layout/dp-planner.js|../typography/protectors": "src/engine/typography/protectors.js",
  "src/engine/layout/dp-planner.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/layout/dp-planner.js|./ordering": "src/engine/layout/ordering.js",
  "src/engine/layout/dp-planner.js|./footnote-budget": "src/engine/layout/footnote-budget.js",
  "src/engine/layout/protections-matrix.js|./balancing": "src/engine/layout/balancing.js",
  "src/engine/layout/balancing.js|./ordering": "src/engine/layout/ordering.js",
  "src/engine/layout/candidate-generator.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/engine/layout/column-flow.js|./page-templates": "src/engine/layout/page-templates.js",
  "src/engine/audit/editing-recommendations.js|../core/pipeline": "src/engine/core/pipeline.js",
  "src/engine/audit/editing-recommendations.js|../parser/dfa-lexer": "src/engine/parser/dfa-lexer.js",
  "src/engine/audit/editing-recommendations.js|../parser/block-tokenizer": "src/engine/parser/block-tokenizer.js",
  "src/engine/audit/editing-recommendations.js|./text-edits": "src/engine/audit/text-edits.js",
  "src/engine/extensions/apply-styles.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/decoration/shaar-pages.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/decoration/shaar-pages.js|./custom-pages": "src/engine/decoration/custom-pages.js",
  "src/engine/decoration/shaar-pages.js|./theme-sets": "src/engine/decoration/theme-sets.js",
  "src/engine/decoration/custom-pages.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/decoration/toc-builder.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/decoration/ornament-plan.js|./ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/engine/decoration/ornament-plan.js|./dividers": "src/engine/decoration/dividers.js",
  "src/engine/decoration/dividers.js|./ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/engine/layout/endnote-pages.js|./page-templates": "src/engine/layout/page-templates.js",
  "src/engine/layout/endnote-pages.js|../notes/markers": "src/engine/notes/markers.js",
  "src/ui/worker-protocol.js|../audit/report-schema": "src/audit/report-schema.js",
  "src/audit/report-schema.js|../engine/layout/dp-planner": "src/engine/layout/dp-planner.js"
};
__modules["src/ui/engine-worker-main.js"] = function (require, module, exports) {
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

};
__modules["src/engine/core/pipeline.js"] = function (require, module, exports) {
// src/engine/core/pipeline.js — Canonical engine order + checkpoints CP1..CP5 (T1, נספח ג)
'use strict';

/**
 * סדר הפעולות המחויב (enforced here, mirrored in module headers):
 * CP1 parse → scope-map → style-prepass (parens BEFORE measure — שורש הסיבתיות) →
 * CP2 fonts-ready → measure/line-plan (KP) → CP3 page-plan (DP) + protections + retreat →
 * balance/AQ → notes-budget → re-fit pass → CP4 decorations (geometry-neutral!) →
 * headers/folio/toc → ledger-finalize → CP5 render.
 *
 * **תיקוני סגירת S7 (ראו audits/02_S7_CLOSURE_REPORT.md):**
 *  - P0-1/P0-2: חשבונאות שימור תוכן identity-by-construction (D-30) — צד src וצד out
 *    נספרים מאותו ייצוג מחושב; ההערות נספרות ממקום הצגתן בפועל.
 *  - P0-6: CP4==CP5 הוכחה אמיתית (bodyGeometryHash — D-47), לא משתנה לעצמו.
 *  - P1-2: קדם־פאס סוגריים לפני מדידה + אכלוס parenRanges (משפחת V23).
 *  - P1-3: סמני הערות מאוחדים (notes/markers) + הדבקה למילה הקודמת (BRZ-11).
 *  - P1-1: AQ/מצבי סוף־פרק/מילה־נופלת מחוברים לצינור בפועל.
 */

const { getDefaultSettings, derivePlacementFlags } = require('./settings-registry');
const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, contentHash, normalizeText } = require('../parser/block-tokenizer');
const { scanBrackets } = require('../parser/bracket-scanner');
const { MeasureAPI } = require('../typography/measure-api');
const { protectWords } = require('../typography/protectors');
const { applyDropWord } = require('../typography/dropword');
const { planPages, layoutHash, bodyGeometryHash } = require('../layout/dp-planner');
const { buildPageTemplate, PAGE_TYPES } = require('../layout/page-templates');
const { assignNumbers } = require('../decoration/folio');
const { buildHeader } = require('../decoration/headers-builder');
const { autoQualityPass, applyChapterEndMode } = require('../layout/balancing');
const { applyHeadingModes } = require('../layout/headings-escort');
const { markerFor, makeCounter, splitPlaceholder, MARK_TAG } = require('../notes/markers');
const Ledger = require('./ledger').Ledger;
const EventLog = require('./events').EventLog;
const { computeEditingRecommendations } = require('../audit/editing-recommendations');

const PAREN_SENTINEL = '\uE101';
const ATOMIC = '\uE000';
// **S11 (REQ-PAR-06):** סנטינל סגנון inline: \uE103<styleId>\uE104<word> — דפוס PAREN_SENTINEL (D-42).
// המדידה מכפילה בגורם הגודל של הסגנון; הרנדרר מקיף span.custom-style עם data-style.
const CUSTOM_SENTINEL = '\uE103';
const CUSTOM_SEP = '\uE104';
const CUSTOM_RE = /^\uE103([^\uE104]+)\uE104/;

/** זיהוי דיבור המתחיל: עד נקודה/מקף (REQ-PAR-ST-03; dh-auto-detect). */
function detectDh(text, enabled) {
  if (!enabled) return null;
  const m = String(text).match(/^(.+?[.׃])\s+(.*)$/) || String(text).match(/^(.+?\s*[-–—])\s+(.*)$/);
  return m ? { dh: m[1].trim(), rest: m[2] } : null;
}

/** רוחב טור ייעודי לסוג בלוק (מקור: page-templates; column-flow מספק את ההפשטה). */
function columnWidthFor(block, settings) {
  if (block.kind === 'heading' && block.level <= 1) {
    const tpl0 = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
    return tpl0.columns[0].w;
  }
  const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  return Math.max(...tpl.columns.map(c => c.w));
}

function fullWidthWidth(settings) {
  const tpl = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
  return tpl.columns[0].w;
}

/**
 * **D-42 (P1-2): קדם־פאס סוגריים עגולים** — מיפוי טווחי (...) על הטקסט השטוח
 * של חלקי הטקסט (בלי הערות). מחזיר [{from,to}] במדדי תווים של הטקסט המשורשר.
 */
function parenSpansOfFlat(flat) {
  const spans = [];
  const stack = [];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '(') stack.push(i);
    else if (flat[i] === ')') {
      if (stack.length) { spans.push({ from: stack.pop(), to: i }); }
    }
  }
  return spans;
}

/** האם מיקום מילה בתוך טווח סוגריים (פתיחה אחרי ה'(' ולפני ה')'). */
function offsetInSpans(at, spans) {
  for (const s of spans) if (at > s.from && at < s.to) return true;
  return false;
}

/**
 * @param {string} rawText - מקור הטקסט
 * @param {object} settings - merged settings (registry defaults + user)
 * @param {{doc?:object, onProgress?:(info:object)=>void}} env - optional DOM for oracle rendering;
 *   onProgress — **S10:** מזליף התקדמות שלבית ל‑Worker ("עמוד X מתוך Y"). מכשור בלבד:
 *   אסור לו לגעת בפריסה — no-op proof נאכף בבדיקה (hash זהה עם ובלי המזליף).
 */
function typeset(rawText, settingsIn, env = {}) {
  // **S10 (REQ-UI-03):** מזליף התקדמות — null כשלא סופק (אפס תקורה במסלול הרגיל).
  const onProgress = typeof env.onProgress === 'function' ? env.onProgress : null;
  const prog = (stage, pct, label, extra) => {
    if (onProgress) onProgress(Object.assign({ stage, pct, label }, extra || {}));
  };
  // **D-39 (P0-4):** מקור־האמת note-placement-mode; קלט משתמש מפורש גובר על נגזרות.
  const settings = derivePlacementFlags({ ...getDefaultSettings(), ...(settingsIn || {}) });
  const eventLog = new EventLog(settings['trace-verbosity'] || 'standard'); // נצרך בפועל (P0-5)
  const ledger = new Ledger();
  const notesMode = settings['note-placement-mode'];
  const parenScale = Number(settings['paren-style-scale']) || 1;

  // **S11 (REQ-PAR-06):** סגנונות מותאמים — פענוח + רישום שגיאות אימות (כמו _customPages).
  // הפקד הזה אינו ברישום ההגדרות (נכס מסמך, לא הגדרת מנוע) — דפוס _customPages של S8.
  const customStylesRes = settings._customStyles
    ? require('../extensions/style-schema').parseCustomStyles(settings._customStyles)
    : { ok: true, styles: [], errors: [] };
  const customStyles = customStylesRes.styles;
  const { CustomStyleCounters, matchBlockStyle, matchInlineStyles, inlineSizeFactor } = require('../extensions/apply-styles');
  const counters = new CustomStyleCounters();
  for (const err of customStylesRes.errors) {
    const rec = ledger.create('settings-verification', `custom-styles:${err.code}`, null, { path: err.path, message: err.message }, 'parse');
    ledger.transition(rec.issue_id, 'persists', 'parse', `custom style rejected: ${err.code}`);
  }
  // **S11:** עוגני תוכן לפסקאות — לזיהוי ממצאים בין הרצות (בפרט הוכחות המלצות־עריכה):
  // tail = 40 התווים האחרונים של שורת המקור; head = 40 הראשונים. העברת מילה בין
  // פסקאות משנה את הזנב של הנותן/המקבל בלבד — ולכן זהות שאר הפסקאות נשמרת.
  settings._tokenTexts = new Map();

  // ---- CP1: parse ----
  const { metadata, bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  for (const t of tokens) {
    const rawLine = String(t.raw != null ? t.raw : (t.text != null ? t.text : ''));
    settings._tokenTexts.set(t.id, {
      head: rawLine.slice(0, 40),
      tail: rawLine.slice(-40)
    });
  }
  const hashIn = contentHash(tokens);
  eventLog.emit('parse', 'cp1-parsed', { tokens: tokens.length, contentHash: hashIn });
  prog('parse', 5, 'פענוח המסמך', { tokens: tokens.length });

  // ---- scope-map (S2.1.3: BEFORE measuring) ----
  const segments = tokens.filter(t => t.type === 'paragraph').map((t, i) => ({ text: t.raw, paraIndex: i }));
  const scope = scanBrackets(segments);
  eventLog.emit('scope-map', 'cp2-scope', { pairs: scope.pairs.length, crossParagraph: scope.scopeMap.crossParagraphCount, unmatchedClosers: scope.unmatchedClosers.length });
  prog('scope-map', 10, 'מיפוי סוגריים והערות', { pairs: scope.pairs.length });

  // ---- measure + line-plan (L2) ----
  // **S12 (REQ-LB-01 impl B):** measure-impl = table (ברירת מחדל — רציפות S1–S11) | font-metrics
  // (טבלאות אמת מגופן רשום — hmtx/cmap/kern/GPOS; registerFont מפורש, אין רשת).
  const api = new MeasureAPI(settings, settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table');
  void env;

  const FONT_WIDTH_PROFILES = {
    'Frank Ruhl Libre': null,
    'David HB': { factor: 1.06 },
    'David': { factor: 1.04 },
    'Narkisim': { factor: 1.10 },
    'Nachlieli': { factor: 0.96 },
    'Alef': { factor: 1.02 },
    'Rubin': { factor: 1.05 }
  };
  function widthFor(text, sizePt, fontName) {
    const base = api.measureTextWidth(text, sizePt);
    if (!fontName || fontName === settings['body-font']) return base;
    const prof = FONT_WIDTH_PROFILES[fontName];
    if (prof && prof.factor) return Math.round(base * prof.factor * 100) / 100;
    const perChar = 0.6 * sizePt * (96 / 72);
    return Math.max(base, String(text).length * perChar);
  }

  /**
   * **P1-3 + BRZ-11 — הדבקת סמן הערה למילה הקודמת** (כל הסגנונות):
   * סמן בסוף שורה אסור. הסמן נצמד למילת העוגן שלפניו כיחידת NBSP;
   * protectWords מבטל קשירה אם היחידה חורגת מרוחב הטור (Claude §6.2(5)).
   */
  function bindMarkersToNeighbors(words, markerSet) {
    const out = [];
    let i = 0;
    while (i < words.length) {
      const w = words[i];
      if (markerSet.has(w)) {
        const prev = out.length ? out[out.length - 1] : null;
        const next = i + 1 < words.length ? words[i + 1] : null;
        if (prev && !prev.includes('\u00A0') && !prev.includes(ATOMIC)) {
          out[out.length - 1] = `${prev}\u00A0${MARK_TAG}${w}`; // הדבקה לאחור + תג (D-53)
        } else if (next && !next.includes('\u00A0') && !markerSet.has(next)) {
          out.push(`${MARK_TAG}${w}\u00A0${next}`); i++;        // סמן בראש פסקה ⇒ הדבקה קדימה + תג
        } else {
          out.push(`${MARK_TAG}${w}`);                        // סמן מתויג גם בודד
        }
      } else {
        out.push(w);
      }
      i++;
    }
    return out;
  }

  // ---- תקציבי גיאומטריה נגזרים לפני ה‑DP (מקור יחיד; ה‑DP והצינור קוראים אותם) ----
  const regTpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  const contentW = regTpl.columns.reduce((s, c) => s + c.w, 0) + regTpl.gutter;
  settings._fnColWidthPx = settings['footnote-columns'] === 2 ? Math.round(contentW / 2) : Math.round(contentW);
  settings._outerMarginPx = Math.max(regTpl.margins.outer != null ? regTpl.margins.outer : 0, regTpl.margins.side * 0.8);
  settings._sideNoteColWidthPx = Math.max(60, Math.round(settings._outerMarginPx) - 12);
  settings._endnoteColWidthPx = Math.round(contentW); // רוחב טור בעמודי הערות

  const blocks = [];
  const endnoteTokens = [];        // טוקני הערת־סיום גלויים (endnotes mode)
  const endnoteTitleByPart = new Map(); // D-40: הוראות כותרת־מחלקה per-part
  const markersByToken = new Map(); // tokenId → [{noteIndex, marker}] (סמן אחיד — D-30)
  // **S11:** חשבונאות שימור תוכן לסגנונות שמסיטים פסקה שלמה מהגוף —
  // הסמן נספר במקור פעם אחת, בדיוק כמו note-ref רגיל (D-30).
  const customFootnoteMarkers = new Map(); // tokenId → סמן (מוצג בגוף, הטקסט במרזב)
  const customEndnoteTokens = new Set();   // tokenIds שזרמו לעמודי ההערות (הסמן מודפס שם)
  let currentPart = 0;
  let fwCount = 0;
  const markerStyle = settings['footnote-marker-style'];
  const resetPolicy = settings['footnote-reset-policy'];
  const nextMarkerNum = makeCounter(resetPolicy); // מדיניות איפוס (D-41)

  for (const t of tokens) {
    if (t.type === 'editorial') continue;

    // **D-40 (P1-5): הוראת כותרת־מחלקה** — לא תוכן, לא גוף; מגדירה את כותרת
    // עמודי ההערות של החלק הנוכחי. בעבר פוענחה כהערת תוכן פיקטיבית.
    if (t.type === 'endnote-class') {
      endnoteTitleByPart.set(currentPart || 1, t.title);
      eventLog.emit('parse', 'endnote-class-directive', { part: currentPart || 1, title: t.title });
      continue;
    }

    if (t.type === 'heading') {
      if (t.level === 1) currentPart++;
      const hSize = settings[`heading-${t.level}-size-pt`];
      const hFont = settings[`heading-${t.level}-font`];
      const hMode = settings[`heading-${t.level}-mode`];
      const wLimit = (t.level <= 1 || hMode === 'full-width')
        ? fullWidthWidth(settings)
        : columnWidthFor({ kind: 'heading', level: t.level }, settings);
      const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => widthFor(x, hSize, hFont), wLimit);
      const lines = api.layoutLines(words, wLimit, hSize, {}, (x) => widthFor(x, hSize, hFont));
      blocks.push({
        kind: 'heading', level: t.level, tokenId: t.id, part: currentPart, mode: hMode, font: hFont,
        forceNewPage: hMode === 'new-page', sideNote: hMode === 'side-note',
        lines: lines.map(ln => ({ ...ln, kind: 'heading', tokenId: t.id, level: t.level }))
      });
      // **S8 (F-08 — שיעור הלב):** עיטורי H2 שצורכים גובה מוזמנים כאן — בגודלם
      // הסופי, לפני הפריסה. H2 במודל regular (בטור): השורות מתנפחות בהזמנה;
      // H2 full-width: ההזמנה נכנסת לפס החוצה־טורים ב‑dp-planner. המידע נוסע על
      // השורה (h2Orn) — מקור יחיד למידות (F-09).
      if (t.level === 2) {
        const { h2OrnamentReservedHeight } = require('../decoration/ornament-fit');
        const h2FontPx = Math.round(hSize * 96 / 72 * 100) / 100;
        const titleW = Math.max(1, ...lines.map(ln => widthFor((ln.words || []).join(' '), hSize, hFont)));
        const reserved = h2OrnamentReservedHeight(titleW, settings, h2FontPx);
        if (reserved.scope.any) {
          const blk = blocks[blocks.length - 1];
          if (hMode !== 'full-width') {
            // בטור: תיבת השורה כוללת את ההזמנה — הטקסט יורד ב‑padding (רנדרר)
            if (reserved.topPx) {
              blk.lines[0].heightPx += reserved.topPx;
              blk.lines[0].h2OrnPadTop = reserved.topPx;
            }
            if (reserved.bottomPx) {
              const last = blk.lines[blk.lines.length - 1];
              last.heightPx += reserved.bottomPx;
              last.h2OrnPadBottom = reserved.bottomPx;
            }
          }
          blk.lines[0].h2Orn = {
            ...reserved,
            kindTop: settings['h2-orn-top'], kindBottom: settings['h2-orn-bottom'], kindSide: settings['h2-orn-side'],
            fitToText: settings['h2-orn-fit-to-text'] !== false
          };
        }
      }
      continue;
    }

    if (t.type === 'endnote') {
      // **D-40:** הערת־סיום גלויה. endnotes-mode ⇒ עמודי ההערות (עם סמן
      // markerFor(num, style)); מצבים אחרים ⇒ בלוק פסקה בגוף (הטקסט בלבד;
      // המספר במקור הוא עוגן סמן — פריט קישור, לא תוכן — D-30).
      if (notesMode === 'endnotes') {
        endnoteTokens.push({ tokenId: t.id, text: t.text, part: currentPart || 1, num: t.num != null ? t.num : null, lines: [] });
        continue;
      }
      const w = columnWidthFor({ kind: 'paragraph' }, settings);
      const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => api.measureTextWidth(x), w);
      const lines = api.layoutLines(words, w, null, { runts: settings['runt-min-width-pct'] });
      blocks.push({
        kind: 'paragraph', tokenId: t.id, parts: [{ kind: 'text', value: t.text }],
        notes: [], bodyMarkers: [], lines, part: currentPart, dh: null, isEndnoteSource: true
      });
      continue;
    }

    // ---- paragraph ----
    // (colW נקבע לאחר התאמת הסגנון המותאם — full-width נמדד ברוחב מלא; S11)
    let dh = null;
    if (settings['dh-auto-detect']) {
      const flat = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
      dh = detectDh(flat, true);
    }
    if (dh) { dh.font = settings['dh-font']; }

    // **D-42 (P1-2): pre-pass of parentheses before measurement** — ranges of (...) on the body text;
    // Words inside the parentheses are measured in the paren-style-scale scale (1.0 = off) before
    // breaking the lines — the causal root of V23 (9 geometry changes from late application).
    // Word mapping: the words of the text parts (in order) correspond 1:1 to the words of the flattened
    // text from which flatBody was built — a shared running index (exact, no searches).
    const textParts = t.parts.filter(p => p.kind === 'text');
    const flatBody = textParts.map(p => p.value).join(' ');
    const parenSpans = parenScale !== 1 ? parenSpansOfFlat(flatBody) : [];
    const flatWordOffsets = [];
    {
      let cum = 0;
      for (const w of flatBody.split(/\s+/)) {
        if (!w) continue;
        flatWordOffsets.push({ word: w, at: cum });
        cum += w.length + 1;
      }
    }
    let flatWordIdx = 0;

    const allWords = [];
    const notes = [];
    const bodyMarkers = [];
    const assignedMarkers = new Set();
    const noteAssignments = [];

    // **S11 (REQ-PAR-06): התאמת סגנונות מותאמים — לפני המדידה** (שורש הסיבתיות:
    // הסגנון נקבע לפני שבירת השורות, לא אחרי — דפוס D-42).
    const csBlock = customStyles.length ? matchBlockStyle(flatBody, customStyles) : null;
    const csInlineSpans = [];
    if (customStyles.length) {
      for (const im of matchInlineStyles(flatBody, customStyles)) {
        for (const r of im.ranges) {
          csInlineSpans.push({ from: r.from, to: r.to, styleId: im.styleId, factor: inlineSizeFactor(im.style.style, settings['body-font-size-pt']) });
        }
      }
    }
    // endnote-mode: הפסקה כולה זורמת לעמודי ההערות של החלק (סמן הסגנון אם הוגדר מונה)
    if (csBlock && csBlock.style.layoutMode === 'endnote') {
      const mark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      endnoteTokens.push({ tokenId: t.id, text: flatBody, part: currentPart || 1, customStyle: csBlock.style.id, ...(mark ? { marker: mark } : {}), lines: [] });
      customEndnoteTokens.add(t.id); // הסמן (מוקצה בבניית עמודי ההערות) נספר במקור
      continue;
    }
    // footnote-mode: הפסקה כולה הופכת הערת שוליים — בגוף נשאר הסמן בלבד (מקום הפסקה = מקום העיגון).
    // נתיב זה דורש מרזב פעיל; בלי מרזב — הסגנון חוזר להיות חזותי בלבד (BRZ-15: לא מאבדים תוכן).
    if (csBlock && csBlock.style.layoutMode === 'footnote' && notesMode === 'footnotes' && settings['footnotes-enabled']) {
      const mark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      const fnMark = mark || markerFor(nextMarkerNum({ page: null, part: currentPart || 1 }), markerStyle);
      const fnNotes = [{ text: flatBody, marker: fnMark, tokenId: t.id, part: currentPart || 1, customStyle: csBlock.style.id }];
      const fnBodyMarkers = [fnMark];
      // הסמן בגוף מתויג (D-53) ומודבק לשכן כמו כל סמן — מקור יחיד bindMarkersToNeighbors
      const fnWords = bindMarkersToNeighbors([fnMark], new Set([fnMark]));
      const fnWLimit = columnWidthFor({ kind: 'paragraph' }, settings);
      const fnLines = api.layoutLines(fnWords, fnWLimit, null, { runts: settings['runt-min-width-pct'] });
      const fnBlk = {
        kind: 'paragraph', tokenId: t.id, parts: t.parts, notes: fnNotes, bodyMarkers: fnBodyMarkers,
        lines: fnLines, unmatchedClosers: t.unmatchedClosers || [], part: currentPart, dh: null,
        // **S11:** הקצאת הסמן נרשמת כמו note-ref — עקביות סמנים גוף/מרזב (P1-3, D-30)
        noteAssignments: [{ noteIndex: 0, marker: fnMark }],
        parenCharSpans: [], flatWordOffsets: [],
        customStyle: { id: csBlock.style.id, name: csBlock.style.name, layoutMode: 'footnote', styleSpec: csBlock.style.style, counterMark: fnMark, linkedOrnaments: csBlock.style.linkedOrnaments }
      };
      for (const ln of fnBlk.lines) ln.customStyle = fnBlk.customStyle;
      customFootnoteMarkers.set(t.id, fnMark); // חשבונאות שימור תוכן: הסמן במקור
      blocks.push(fnBlk);
      continue;
    }

    // full-width-mode: המדידה ברוחב מלא (כמו H1) — לפני הפריסה, לא אחריה
    const colW = (csBlock && csBlock.style.layoutMode === 'full-width')
      ? fullWidthWidth(settings)
      : columnWidthFor({ kind: 'paragraph' }, settings);
    const customFactorById = new Map(csInlineSpans.map(s => [s.styleId, s.factor]));
    let csInfo = null; // **S11:** סגנון הבלוק שיוצמד לשורות ולבלוק (מדלג על ערכי איטרציות קודמות)

    for (const p of t.parts) {
      if (p.kind === 'text') {
        const src = normalizeText(p.value);
        for (const wordRaw of src.split(/\s+/).filter(Boolean)) {
          const info = flatWordOffsets[Math.min(flatWordIdx, flatWordOffsets.length - 1)];
          flatWordIdx++;
          const inParen = parenSpans.length > 0 && info && offsetInSpans(info.at, parenSpans);
          // **S11:** חברות בטווח inline = **חפיפה** (לא הכלה): מילה הפותחת במפריד «
          // («וזה) חופפת את טווח התוכן שאחריו; מילה שלפני הפתיחה לא. וכך גם בסגירה.
          const wLen = info ? String(info.word || wordRaw).length : String(wordRaw).length;
          const inCustom = csInlineSpans.length > 0 && info
            ? csInlineSpans.find(s => info.at < s.to && (info.at + wLen) > s.from) : null;
          // עדיפות: טווח inline מותאם על פני סוגריים (שניהם לא יכולים לחפור בפועל — הסגנון תופס ראשון)
          if (inCustom) allWords.push(CUSTOM_SENTINEL + inCustom.styleId + CUSTOM_SEP + wordRaw);
          else if (inParen && parenScale !== 1) allWords.push(PAREN_SENTINEL + wordRaw);
          else allWords.push(wordRaw);
        }
      } else {
        // note-ref: uniform marker allocation (D-30/D-41) — policy numbering + style
        const noteRaw = t.notes[p.noteIndex];
        const marker = markerFor(nextMarkerNum({ page: null, part: currentPart || 1 }), markerStyle);
        assignedMarkers.add(marker);
        noteAssignments.push({ noteIndex: p.noteIndex, marker });
        if (notesMode === 'inline' || (!settings['footnotes-enabled'] && notesMode !== 'endnotes')) {
          // (c) inline / fn-off: full placeholder in the body — `${marker}\uE000${text}`
          // (D-30: the separator is the first \uE000 — atomic in measurement, exact in extraction)
          const noteFlat = String(noteRaw).replace(/\uE000/g, ' ');
          const placeholder = `${MARK_TAG}${marker}${ATOMIC}${noteFlat.replace(/ /g, ATOMIC)}`; // תג (D-53): אחרי kp ה‑E000 נהיה NBSP — התג מזהה את הסמן
          const prev = allWords.length ? allWords[allWords.length - 1] : null;
          if (prev && !prev.includes('\u00A0') && !prev.includes(ATOMIC)) {
            allWords[allWords.length - 1] = `${prev}\u00A0${placeholder}`; // the marker sticks to its anchor (BRZ-11)
          } else {
            allWords.push(placeholder);
          }
          continue;
        }
        // footnotes / endnotes: only the marker is pushed in the body (counted once — at the anchor);
        // the text of the note flows to its display location (gutter / pages of notes — D-30).
        notes.push({ text: String(noteRaw).replace(/\uE000/g, ' '), marker, tokenId: t.id, noteIndex: p.noteIndex, part: currentPart || 1 });
        bodyMarkers.push(marker);
        allWords.push(marker);
      }
    }
    markersByToken.set(t.id, noteAssignments);

    // Pasting lone markers to their neighbors (BRZ-11) — before measurement
    const boundWords = bindMarkersToNeighbors(allWords, assignedMarkers);

    // Measurement with a pre-pass of parentheses (D-42) + custom inline styles (S11):
    // PAREN_SENTINEL → parenScale; CUSTOM_SENTINEL<id> → size factor of the style.
    const measureWithParen = (x) => {
      const clean0 = String(x).replace(/\uE102/g, ''); // תג סמן — מוסר ממדידה (D-53)
      const csM = CUSTOM_RE.exec(clean0);
      if (csM) {
        const f = customFactorById.get(csM[1]);
        const base = api.measureTextWidth(clean0.slice(csM[0].length));
        return f != null ? base * f : base;
      }
      const isParen = clean0.startsWith(PAREN_SENTINEL);
      const clean = isParen ? clean0.slice(PAREN_SENTINEL.length) : clean0;
      const base = api.measureTextWidth(clean);
      return isParen ? base * parenScale : base;
    };
    const protectedWords = protectWords(boundWords, measureWithParen, colW);
    const lines = api.layoutLines(protectedWords, colW, null, { runts: settings['runt-min-width-pct'] }, measureWithParen);

    // Cleaning the sentinels from the lines + tagging parenSpans/customSpans for rendering
    for (const ln of lines) {
      const spans = [];
      const customSpans = [];
      ln.words = (ln.words || []).map((w, wi) => {
        if (CUSTOM_RE.test(w)) {
          const m = CUSTOM_RE.exec(w);
          customSpans.push({ wi, styleId: m[1] });
          return w.slice(m[0].length);
        }
        if (w.startsWith(PAREN_SENTINEL)) { spans.push(wi); return w.slice(PAREN_SENTINEL.length); }
        return w;
      });
      if (spans.length && parenScale !== 1) ln.parenSpans = spans;
      if (customSpans.length) ln.customSpans = customSpans;
    }
    // **S11:** הסגנון ברמת הבלוק על הפסקה (לא-footnote): דגלי פריסה + מונה + עיטורים מקושרים
    if (csBlock && csBlock.style.layoutMode !== 'footnote' && csBlock.style.layoutMode !== 'endnote') {
      const counterMark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      csInfo = {
        id: csBlock.style.id, name: csBlock.style.name, layoutMode: csBlock.style.layoutMode,
        styleSpec: csBlock.style.style, counterMark, linkedOrnaments: csBlock.style.linkedOrnaments
      };
      const ORN_PAD_PX = 18; // הזמנת גובה לעיטור מקושר — דפוס h2Orn (F-08): גיאומטריה מוזמנת בזמן אמת
      if (csInfo.linkedOrnaments && csInfo.linkedOrnaments.top && lines.length) {
        lines[0].heightPx = (lines[0].heightPx || 0) + ORN_PAD_PX;
        lines[0].csOrnPadTop = ORN_PAD_PX;
      }
      if (csInfo.linkedOrnaments && csInfo.linkedOrnaments.bottom && lines.length) {
        const lastLn = lines[lines.length - 1];
        lastLn.heightPx = (lastLn.heightPx || 0) + ORN_PAD_PX;
        lastLn.csOrnPadBottom = ORN_PAD_PX;
      }
      for (const ln of lines) ln.customStyle = csInfo;
      // המונה מוצג בשורה הראשונה של הבלוק (הפס של full-width מטופל ברנדרר מהמידע על הפס)
      if (csInfo.counterMark && lines.length) lines[0].csCounterMark = csInfo.counterMark;
    }
    const blk = {
      kind: 'paragraph', tokenId: t.id, parts: t.parts, notes, bodyMarkers, lines,
      unmatchedClosers: t.unmatchedClosers || [], part: currentPart, dh,
      noteAssignments, parenCharSpans: parenSpans, flatWordOffsets,
      customStyle: csInfo
    };
    if (blk.customStyle) {
      blk.fullWidth = blk.customStyle.layoutMode === 'full-width';
      blk.forcePageBreakBefore = blk.customStyle.layoutMode === 'new-location';
      blk.asSideNote = blk.customStyle.layoutMode === 'side-note';
    }
    const fwRes = applyDropWord(blk, settings, api);
    if (fwRes.applied) fwCount++;
    blocks.push(blk);
  }

  // תבנית ההחלטה המאוחדת של כותרות (D-09) — לפני ה‑DP; ה‑DP קורא דגלים בלבד
  applyHeadingModes(blocks, settings);
  eventLog.emit('measure', 'cp2-measured', { blocks: blocks.length, cache: api.cacheStats(), firstWordDecorated: fwCount, parenScale });
  prog('measure', 25, 'מדידה ושבירת שורות', { blocks: blocks.length });

  // ---- CP3: page plan (DP) + protections + retreat loop ----
  const planned = planPages(blocks, settings, eventLog, ledger, { measure: (t2, s2) => api.measureTextWidth(t2, s2), onProgress });
  let { pages } = planned;
  prog('page-plan', 70, 'הפריסה הושלמה', { totalPages: pages.length, pageIndex: pages.length });

  // **S8 — עמודי שער + עמודים מותאמים (PT-01/02/03/09):** הכנסה מבנית
  // מיד אחרי ה‑DP ולפני צילום ה‑hash של CP4 — השערים חלק מהבסיס שנמדד
  // (לא ״תוספת מאוחרת״ שמזיזה אינדקסים מתחת להוכחת הניטרליות).
  {
    const { insertShaarPages } = require('../decoration/shaar-pages');
    const { parseCustomPageTypes } = require('../decoration/custom-pages');
    let customDefs = [];
    if (settings._customPages) {
      const parsed = parseCustomPageTypes(settings._customPages);
      customDefs = parsed.pages;
      for (const err of parsed.errors) {
        const rec = ledger.create('settings-verification', 'custom-pages', null, { error: err }, 'decorations');
        ledger.transition(rec.issue_id, 'persists', 'decorations', `custom page def rejected: ${err}`);
      }
    }
    const shaarResult = insertShaarPages(pages, blocks, settings, customDefs);
    pages = shaarResult.pages;
    eventLog.emit('page-plan', 'shaar-pages-inserted', {
      inserted: shaarResult.inserted.map(x => x.why),
      custom: shaarResult.customPlaced.length
    });
  }

  // **P1-1 (connection of dead mechanisms):** end-of-part modes + AutoQuality
  // are activated from the pipeline: balance-chapter-end is applied on the last page
  // of each section; AQ is activated when aq-enabled.
  // **S8:** עמודי שער/מותאמים הם chapterOpening אך אינם ״סוף פרק״ — הם מפנים
  // אל העמוד שלפניהם (עמוד התוכן האחרון של החלק), והם עצמם לא מטופלים.
  {
    const isStructural = (p) => Boolean(p.isShaar) || p.type === 'custom';
    const endsAt = new Set();
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].chapterOpening && i > 0) {
        // גבול פרק מצביע אחורה על העמוד האחרון שאינו מבני (מדלג על שערים/מותאמים)
        for (let j = i - 1; j >= 0; j--) { if (!isStructural(pages[j])) { endsAt.add(j); break; } }
      }
    }
    for (let j = pages.length - 1; j >= 0; j--) { if (!isStructural(pages[j])) { endsAt.add(j); break; } }
    for (const pi of [...endsAt].sort((a, b) => a - b)) {
      applyChapterEndMode(pages[pi], settings['balance-chapter-end'], settings, eventLog);
    }
    if (settings['aq-enabled']) autoQualityPass(pages, settings, eventLog);
  }

  // **S9 — עמודי תוכן־העניינים (REQ-HDR-05):** הכנסה מבנית לפני צילום ה‑hash של CP4
  // (כמו שערי S8) — העמודים חלק מהבסיס שנמדד; תקציב איטרציה מונע תליה (F: TOC hanging).
  let tocPagesAll = [];
  let tocInsertInfo = { inserted: 0, at: 0 };
  {
    const {
      buildTocModel, numberRows, buildTocPages, insertTocPages
    } = require('../decoration/toc-builder');
    const pageLinesEarly = (pg) => [
      ...(pg.spanning ? pg.spanning.lines : []),
      ...pg.columns.flatMap(c => c)
    ];
    const firstPageByToken = new Map(); // tokenId -> עצם העמוד (עוגן למיפוי סופי)
    for (const pg of pages) {
      for (const ln of pageLinesEarly(pg)) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg);
      }
    }
    const headingsAll = [];
    for (const b of blocks) {
      if (b.kind !== 'heading') continue;
      const pageRef = firstPageByToken.has(b.tokenId) ? firstPageByToken.get(b.tokenId) : null;
      if (!pageRef) continue;
      headingsAll.push({
        level: b.level,
        text: b.lines.map(l => l.words.join(' ')).join(' ').trim(),
        tokenId: b.tokenId, pageRef,
      });
    }
    headingsAll.sort((a, b) => (a.pageRef.index - b.pageRef.index) || String(a.tokenId).localeCompare(String(b.tokenId)));

    const measureToc = (t, sz) => api.measureTextWidth(t, sz);
    const lineHToc = (sz) => api.lineHeightPx(sz);
    if (settings['toc-general-enabled'] !== false) {
      const model = buildTocModel(headingsAll.filter(h => h.level <= 2), settings);
      numberRows(model.rows, settings['general-toc-count-numbering'] !== false);
      const built = buildTocPages(model, 'toc-general', 'תוכן העניינים', settings, measureToc, lineHToc, { ledger, eventLog });
      tocPagesAll = tocPagesAll.concat(built.pages);
    }
    if (settings['toc-detail-enabled'] === true) {
      const model = buildTocModel(headingsAll, settings);
      numberRows(model.rows, settings['detailed-toc-count-numbering'] !== false);
      const built = buildTocPages(model, 'toc-detail', 'תוכן העניינים המפורט', settings, measureToc, lineHToc, { ledger, eventLog });
      tocPagesAll = tocPagesAll.concat(built.pages);
    }
    if (tocPagesAll.length) {
      const res = insertTocPages(pages, tocPagesAll, settings, { ledger, eventLog });
      pages = res.pages;
      tocInsertInfo = { inserted: res.inserted, at: res.at };
      eventLog.emit('toc', 'toc-pages-inserted', { ...tocInsertInfo, total: tocPagesAll.length });
    }
    prog('toc', 78, 'תוכן העניינים', { totalPages: pages.length, tocPages: tocPagesAll.length });
  }

  // ---- CP4: decorations pass — geometry-neutral (invariant T1; D-47) ----
  const cp4PageCount = pages.length;
  const cp4BodyBefore = bodyGeometryHash(pages);

  // S7.1.2: הערות צד — עיגון לפסקה, cascade, מיכל 20px, מעבר לעמוד הבא
  const { placeSideNotes, verifyH7Conversion } = require('../layout/side-notes');
  for (const pg of pages) pg.isRecto = pg.index % 2 === 0;
  const sideNotePlacement = placeSideNotes(pages, settings, (t2, s2) => api.measureTextWidth(t2, s2), { ledger, eventLog });

  // **S8 — פאס העיטורים (L5):** כל העיטורים overlay-rects על העמודים;
  // אסור לגעת בשורות (invariant T1 — מוכח מיד לאחר מכן ב‑bodyGeometryHash).
  // סוגר: REQ-ORN-01..04 + אודיט ornament-* במייצרים אמיתיים.
  const { planPageOrnaments } = require('../decoration/ornament-plan');
  const ornamentPass = planPageOrnaments(pages, settings, (t2, s2) => api.measureTextWidth(t2, s2), { ledger, eventLog });

  // S7.1.1: עמודי הערות per-part — טוקנים גלויים + inline-refs (endnotes mode)
  settings._endnoteTitleByPart = endnoteTitleByPart;
  settings._endnoteColCapPx = regTpl.contentBox.height;
  const endnoteBlocks = [...endnoteTokens];
  if (notesMode === 'endnotes') {
    for (const b of blocks) {
      if (b.kind !== 'paragraph' || !b.notes || !b.notes.length) continue;
      for (const n of b.notes) {
        endnoteBlocks.push({ tokenId: b.tokenId, noteIndex: n.noteIndex, text: n.text, part: b.part || 1, marker: n.marker, fromInline: true, lines: [] });
      }
    }
  }
  let endnotePagesInfo = { count: 0, pages: [] };
  if (notesMode === 'endnotes' && endnoteBlocks.length) {
    const { buildEndnotePages } = require('../layout/endnote-pages');
    endnotePagesInfo = { count: 0, pages: buildEndnotePages(endnoteBlocks, settings, (t2, s2) => api.measureTextWidth(t2, s2), (s2) => api.lineHeightPx(s2), { ledger, eventLog }) };
    endnotePagesInfo.count = endnotePagesInfo.pages.length;
  }

  // count-endnote-pages=true ⇒ עמודי ההערות מצטרפים למספור (S7.1.1)
  if (settings['count-endnote-pages'] === true && endnotePagesInfo.pages.length) {
    let idx = pages.length ? pages[pages.length - 1].index + 1 : 0;
    for (const ep of endnotePagesInfo.pages) {
      ep.index = idx++;
      ep.template = buildPageTemplate(PAGE_TYPES.ENDNOTES, settings, ep.index % 2 === 0);
      pages.push(ep);
    }
    eventLog.emit('folio', 'endnote-pages-numbered', { count: endnotePagesInfo.pages.length });
  }

  // **P0-6 (D-47): הוכחת ניטרליות אמיתית** — hash גיאומטריה מחושב מחדש אחרי
  // פאס העיטורים ומושווה. הוספת עמודים מותרת (מסמן תוספת, לא מוטציה);
  // כל שינוי בשורות קיימות או הסרת עמוד ⇒ הבדיקה נכשלת.
  const cp5BodyAfter = pages.length >= cp4PageCount ? bodyGeometryHash(pages.slice(0, cp4PageCount)) : '<shrunk>';
  const geometryNeutralVerified = cp5BodyAfter === cp4BodyBefore;
  eventLog.emit('decorations', 'cp4-decoration-pass', {
    geometryNeutral: geometryNeutralVerified,
    sideNotesPlaced: sideNotePlacement.placed.length,
    sideNotesDeferred: sideNotePlacement.deferred.length,
    endnotePages: endnotePagesInfo.count
  });

  // S7.1.3: אימות המרת H7 — מחובר לצינור (בעבר פונקציה יתומה)
  const h7Mismatches = verifyH7Conversion(tokens, pages, sideNotePlacement);
  for (const m of h7Mismatches) {
    const rec = ledger.create('h7-conversion-missing', m.token, null, { text: m.text }, 'decorations');
    ledger.transition(rec.issue_id, 'persists', 'decorations', 'H7 token not placed as side note');
  }

  // ---- folio numbering (D-36: פתיחות אינן מציגות גיליון; S9: נוסחת V1 start-idx+initial) ----
  const numbers = assignNumbers(pages, settings);
  prog('folio', 82, 'מספור עמודים', { totalPages: pages.length });
  pages.forEach((pg, i) => {
    pg.pageNumber = numbers[i].page;
    pg.folioDisplay = numbers[i].shown ? numbers[i].display : '';
    pg.pageNumberDisplay = numbers[i].display; // מקור page-num לכותרות עליונות (P1-1)
  });

  // **S9.1.6 — בודק אינווריאנטים מספור (pn-sequence / pn-overflow → ledger):**
  // סדרה מונוטונית, בלי כפילות/דילוגים פרט ל"חסרים מוצהרים"; גיליון בתקציב רוחב.
  const { auditNumbering } = require('../decoration/numbering-audit');
  const numberingAudit = auditNumbering(pages, numbers, settings, (t) => api.measureTextWidth(t), { ledger, eventLog });

  // **S9 (D-62): פענוח עוגנים + תוויות גיליון בשורות ה‑TOC — לפי המספור הסופי.**
  if (tocPagesAll.length) {
    const { resolveTocTargets } = require('../decoration/toc-builder');
    const { tocPageLabel } = require('../decoration/folio');
    resolveTocTargets(pages, tocPagesAll, numbers, settings, { formatLabel: (v) => tocPageLabel(v, settings) });
  }

  // ---- headers ----
  const bookName = metadata['ספר'] || metadata['title'] || '';
  const { trimEdgePunctuation } = require('../decoration/headers-builder');
  // **FWD-1:** הפס חוצה־טורים נסרק גם הוא — כותרת H2 חיה שם עכשיו (S8)
  const pageLines = (pg) => [
    ...(pg.spanning ? pg.spanning.lines : []),
    ...pg.columns.flatMap(c => c)
  ];
  pages.forEach((pg, i) => {
    let h1 = '', h2 = '';
    pg._metadata = metadata; // S8: תיבות שער ראשי קוראות שם ספר/נושא (REQ-ORN-05)
    for (const ln of pageLines(pg)) {
      if (ln.kind === 'heading') { if (ln.level <= 1) h1 = ln.words.join(' '); else if (ln.level === 2) h2 = ln.words.join(' '); }
    }
    const firstCol = pg.columns[0] && pg.columns[0][0];
    const lastCol = pg.columns[pg.columns.length - 1];
    const lastLine = lastCol && lastCol[lastCol.length - 1];
    pg.headerCtx = { bookName, h1, h2 };
    // **S9 (פורט IMUD fillHeaderFirstLastWords):** מילה ראשונה/אחרונה — בלי פיסוק קצה
    // (הכותרת עצמה לא נחשבת כתוכן העמוד לעניין זה; מילים מנוקות מסימני פיסוק בקצוות).
    const bodyLines = pageLines(pg).filter(ln => ln.kind !== 'heading');
    const firstBody = bodyLines[0];
    const lastBody = bodyLines[bodyLines.length - 1];
    pg.firstWord = firstBody && firstBody.words ? trimEdgePunctuation(firstBody.words[0]) : '';
    pg.lastWord = lastBody && lastBody.words ? trimEdgePunctuation(lastBody.words[lastBody.words.length - 1]) : '';
    pg.isRecto = pg.index % 2 === 0;
    // **S9 (REQ-HDR-02):** האם העמוד נפתח בכותרת H2/H3 (שורת התוכן הראשונה בסדר קריאה)
    const firstLine = pageLines(pg)[0];
    pg.opensWithHeadingLevel = firstLine && firstLine.kind === 'heading' ? firstLine.level : null;
    // D-36 + REQ-HDR-02: עמודי פתיחה ללא כותרת עליונה — אלא אם הופעלה הכותרת הייעודית
    // לפותחות H2/H3 (הבדיקה בתוך buildHeader — מקור יחיד)
    pg.header = buildHeader(pg, settings, pg.headerCtx);
    // **S10 (REQ-UI-03):** התקדמות מדויקת לפי עמוד — "עמוד X מתוך Y" כאן Y סופי.
    prog('headers', 82 + Math.round(10 * ((i + 1) / pages.length)),
      `כותרות עליונות — עמוד ${i + 1} מתוך ${pages.length}`,
      { pageIndex: i + 1, totalPages: pages.length });
  });

  // ---- TOC (מודל לגרסאות ≤S8 — תאימות לאחור; עמודי ה‑TOC האמיתיים נבנו לעיל) ----
  const { buildTocEntries, splitGeneralDetail } = require('../decoration/toc-builder');
  const firstPageByToken = new Map();
  for (const pg of pages) {
    for (const ln of pageLines(pg)) { // **FWD-1:** כולל שורות הפס החוצה־טורים
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
    }
  }
  const headingsForToc = [];
  for (const b of blocks) {
    if (b.kind !== 'heading') continue;
    const page = firstPageByToken.has(b.tokenId) ? firstPageByToken.get(b.tokenId) : -1;
    if (page < 0) continue;
    headingsForToc.push({ level: b.level, text: b.lines.map(l => l.words.join(' ')).join(' ').trim(), page, tokenId: b.tokenId });
  }
  headingsForToc.sort((a, b) => a.page - b.page);
  const tocEntries = buildTocEntries(headingsForToc, settings, numbers);
  const toc = splitGeneralDetail(tocEntries, settings);

  // ---- אינטגריטיית שימור תוכן (BRZ-15) — identity-by-construction (D-30) ----
  // צד src: גוף + סמן + טקסט־הערה (לכל note-ref); הערות־סיום גלויות:
  //   endnotes-mode ⇒ סמן (מה שהודפס בעמודי ההערות) + טקסט; אחרת ⇒ הטקסט בגוף.
  // צד out: נספר ממקום ההצגה בפועל — שורות הגוף (כולל סמנים/placeholder),
  // מרזב (טקסט בלבד — הסמן נספר בגוף), עמודי הערות (טקסט ל-inline-refs;
  // סמן+טקסט לטוקנים גלויים), הערות צד.
  const scrubForCompare = (s0) => String(s0)
    .replace(/[\u00A0\uE000\uE101\uE102]/g, ' ')
    .replace(/\uFF9F/g, '\u05F3')
    .replace(/\uFF93/g, '\u05F4')
    .replace(/[\u27E6\u27E7]/g, '')
    .replace(/\s+/g, ' ').trim();

  /** פיצול placeholder: `${marker}\uE000${text}` → מרקר + מילות הטקסט (D-30). */
  function explodePlaceholderWord(w) {
    const s = String(w);
    const at = s.indexOf(ATOMIC);
    if (at > 0) {
      const marker = s.slice(0, at);
      const rest = s.slice(at + 1);
      return [...wordSeq(marker), ...wordSeq(rest)];
    }
    return wordSeq(s);
  }
  const wordSeq = (s0) => scrubForCompare(s0).split(' ').filter(Boolean);

  /** מפת סמנים מודפסים של טוקני הערות־סיום גלויים (מה שהודפס בפועל). */
  const printedEndnoteMarker = new Map(); // tokenId -> marker
  for (const ep of (endnotePagesInfo.pages || [])) {
    for (const n of ep.notes) {
      if (n.tokenId != null && !n.fromInline) printedEndnoteMarker.set(n.tokenId, n.marker);
    }
  }

  function srcWordsOf(t) {
    if (t.type === 'heading' || t.type === 'side-note') return wordSeq(t.text);
    if (t.type === 'endnote-class') return []; // directive (D-40) — לא תוכן
    if (t.type === 'editorial') return [];
    if (t.type === 'endnote') {
      if (notesMode === 'endnotes') {
        const marker = printedEndnoteMarker.get(t.id) || '';
        return [...wordSeq(marker), ...wordSeq(t.text)];
      }
      return wordSeq(t.text); // גוף: הטקסט בלבד (המספר במקור = עוגן סמן, לא תוכן — D-30)
    }
    // paragraph: גוף + לכל note-ref: סמן (בעוגן שבגוף) + טקסט ההערה
    // (ממקום הצגתו). הסמן אחד לכל המצטרים — הוקצה אחדת
    // בשלב הבלוק (מדיניות + סגנון) — identity-by-construction (D-30).
    const body = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
    const refs = t.parts.filter(p => p.kind === 'note-ref');
    const assigns = markersByToken.get(t.id) || [];
    const out = [...wordSeq(body)];
    // **S11:** פסקה שהוסבה כולה להערה בסגנון מותאם — הסמן נספר במקור פעם אחת:
    // footnote ⇒ הוקצה בבלוק; endnote ⇒ מה שהודפס בעמודי ההערות (printedEndnoteMarker)
    if (customFootnoteMarkers.has(t.id)) out.push(...wordSeq(customFootnoteMarkers.get(t.id)));
    if (customEndnoteTokens.has(t.id)) out.push(...wordSeq(printedEndnoteMarker.get(t.id) || ''));
    for (let i = 0; i < refs.length; i++) {
      const p = refs[i];
      const marker = assigns[i] ? assigns[i].marker : '';
      const noteText = String(t.notes[p.noteIndex]).replace(/\uE000/g, ' ');
      // סמן אחד (בגוף, בעוגן) + טקסט אחד (ממקום ההצגה) — בכל מצב
      out.push(...wordSeq(marker), ...wordSeq(noteText));
    }
    return out;
  }

  /** חילוץ מילים מהפלט המרונדר בפועל (בדיקת אמת של המבקר — לא הסכמה פנימית). */
  function outWordsOfAll() {
    const out = [];
    // 1) שורות הגוף של כל העמודים — כפי שמרונדרות (placeholder מפוצל).
    //    **FWD-1 (S8):** כולל שורות הפס החוצה־טורים — כותרות H2 חיות שם.
    for (const pg of pages) {
      for (const ln of pageLines(pg)) {
        for (const w of (ln.words || [])) {
          if (w.includes(ATOMIC)) out.push(...explodePlaceholderWord(w));
          else out.push(...wordSeq(w));
        }
      }
    }
    // 2) מרזב footnotes — טקסט בלבד (הסמן נספר פעם אחת בגוף — D-30)
    if (settings['footnotes-enabled'] && notesMode !== 'endnotes') {
      for (const pg of pages) {
        for (const n of pg.footnotes) {
          if (n.isContinuation || n.mode === 'split-rest') out.push(...wordSeq(n.text));
          else if (n.mode === 'split-first') out.push(...wordSeq(n.text));
          else if (n.rejected) { /* הוחזר לגוף — נספר שם */ }
          else out.push(...wordSeq(n.text));
        }
      }
    }
    // 3) עמודי הערות — inline-refs: טקסט בלבד; טוקנים גלויים: סמן + טקסט
    if (notesMode === 'endnotes') {
      for (const ep of (endnotePagesInfo.pages || [])) {
        for (const n of ep.notes) {
          if (n.fromInline) out.push(...wordSeq(n.text));            // הסמן נספר בגוף
          else out.push(...wordSeq(n.marker), ...wordSeq(n.text));   // אין עוגן בגוף
        }
      }
    }
    // 4) הערות צד — טקסט מהמיקום שהוצג
    for (const p of sideNotePlacement.placed) out.push(...wordSeq(p.text));
    return out;
  }

  const srcTokens = tokens.filter(t => t.type !== 'editorial' && t.type !== 'endnote-class');
  let contentPreserved = true;
  const mismatchDetail = [];
  const gSrc = [], gOut = [];
  // **D-83 (תיקון קריסת ספר־אמת 03.11):** הזרקה בלולאה בלבד. spread על מערך ענק
  // (ספר שלם, >125,154 מילים = מגבלת הארגומנטים של V8) זרק "Maximum call stack
  // size exceeded" — העימוד עצמו הושלם והקריסה אירעה דווקא בבדיקת שימור התוכן
  // שבסוף ה־pipeline. לולאת for אינה תלויה בגודל המחסנית.
  const pushAll = (dst, src) => { for (let i = 0; i < src.length; i++) dst.push(src[i]); };
  for (const t of srcTokens) pushAll(gSrc, srcWordsOf(t));
  pushAll(gOut, outWordsOfAll());

  const norm = (arr) => arr.slice().sort().join('\n');
  if (norm(gSrc) !== norm(gOut)) {
    contentPreserved = false;
    const cnt = (a) => a.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
    const cs = cnt(gSrc), co = cnt(gOut), diff = {};
    for (const w of new Set([...Object.keys(cs), ...Object.keys(co)])) {
      const dd = (cs[w] || 0) - (co[w] || 0);
      if (dd !== 0) diff[w] = dd;
    }
    mismatchDetail.push({ kind: 'multiset-mismatch', diff });
  }

  // כל טוקן מיוצג (נמצא בפלט או הומר להערת צד / עמודי הערות)
  const blocksByToken = new Map();
  for (const b of blocks) if (!blocksByToken.has(b.tokenId)) blocksByToken.set(b.tokenId, b);
  const placedSideAnchors = new Set(sideNotePlacement.placed.map(p => p.anchorToken));
  const endnoteRepresented = new Set(endnoteBlocks.map(e => e.tokenId));
  for (const t of srcTokens) {
    const placedAsSide = placedSideAnchors.has(t.id);
    const representedElsewhere = endnoteRepresented.has(t.id);
    if (!blocksByToken.has(t.id) && !placedAsSide && !representedElsewhere) {
      contentPreserved = false; mismatchDetail.push({ token: t.id, kind: 'token-not-placed' });
    }
  }

  // **עקביות סמנים (P1-3):** סמן הגוף == סמן מקום ההצגה, לכל הערה — בדיקת אמת.
  {
    // סמנים ידועים של המסמך (מדוקים בלבד — ללד חיווים) + סמני הערות סיום גלויות
    const knownMarkers = new Set();
    for (const b of blocks) for (const a of (b.noteAssignments || [])) knownMarkers.add(a.marker);
    for (const ep of (endnotePagesInfo.pages || [])) for (const n of ep.notes) if (!n.fromInline) knownMarkers.add(n.marker);
    const countKnown = (w) => {
      // מדויק (D-53): סמן מזוהה רק לפי תג (E102) או placeholder (E000).
      // מילה רגילה (ספרה 1 בטקסט, סגנון decimal) אינה סמן (NC-10).
      const sw = String(w);
      if (sw.includes(ATOMIC)) {
        // placeholder עם E000 (reject-to-body; נוצר אחרי תכנון השורות):
        // הסמן הוא הפרגמנט המוכר שלפני ה‑E000 (עשוי להיות ממוזג לעוגן ב‑NBSP).
        const at = sw.indexOf(ATOMIC);
        const frags = wordSeq(sw.slice(0, at));
        return frags.slice().reverse().find(f => knownMarkers.has(f)) || null;
      }
      if (!sw.includes(MARK_TAG)) return null;
      const at = sw.indexOf(MARK_TAG);
      const frag = sw.slice(at + 1).split(/[\u00A0 ]/)[0];
      return knownMarkers.has(frag) ? frag : null;
    };


    const bodyMarkers = [];
    for (const pg of pages) for (const ln of pageLines(pg)) { // FWD-1: כולל פס חוצה־טורים
      for (const w of (ln.words || [])) {
        const km = countKnown(w); // תג/E000 בלבד — ראה D-53; מילה רגילה אינה סמן
        if (km) bodyMarkers.push(km);
      }
    }
    // \u05d4\u05d0\u05de\u05ea: \u05d4\u05e1\u05de\u05e0\u05d9\u05dd \u05e9\u05d4\u05d5\u05e7\u05e6\u05d5 \u05dc\u05de\u05e1\u05de\u05da (\u05de\u05d5\u05e0\u05d9\u05dd \u05de\u05d5\u05d1\u05df \u05d0\u05d7\u05d3) \u2014 \u05de\u05d5\u05db\u05d7\u05d9\u05dd \u05de\u05d5\u05dc \u05d4\u05e1\u05de\u05da
    const assignedAll = [];
    for (const b of blocks) for (const a of (b.noteAssignments || [])) assignedAll.push(a.marker);
    // \u05de\u05e7\u05d5\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3 (\u05de\u05e8\u05d6\u05d1 / \u05e2\u05de\u05d5\u05d3\u05d9 \u05d4\u05e2\u05e8\u05d5\u05ea) — \u05d1\u05de\u05e6\u05d1\u05d9\u05dd \u05d0\u05dc\u05d5 \u05d1\u05dc\u05d1\u05d3
    // rejected-to-body: displayed in the body (body count covers it) - excluded from separate-display compare
    const rejectedMarkers = new Set();
    for (const b of blocks) for (const rn of (b.rejectedNotes || [])) rejectedMarkers.add(rn.marker);
    const displayMarkers = [];
    if (settings['footnotes-enabled'] && notesMode !== 'endnotes') {
      for (const pg of pages) for (const n of pg.footnotes) if (n.marker && !n.isContinuation && n.mode !== 'split-rest') displayMarkers.push(n.marker); // continuation = repeat, not a separate anchor
    }
    if (notesMode === 'endnotes') {
      for (const ep of (endnotePagesInfo.pages || [])) for (const n of ep.notes) {
        if (n.fromInline && n.marker) displayMarkers.push(n.marker);
      }
    }
    const cnt = (a) => a.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
    const cb = cnt(bodyMarkers.filter(Boolean));
    const ca = cnt(assignedAll);
    const cd = cnt(displayMarkers.filter(Boolean));
    // \u05d2\u05d5\u05e3: \u05db\u05dc \u05e1\u05de\u05df \u05de\u05d5\u05e7\u05e6\u05d4 \u05de\u05d5\u05e4\u05d9\u05e2 \u05d1\u05d3\u05d5\u05e7 \u05e4\u05e2\u05dd \u05d0\u05d7\u05ea
    for (const k of new Set([...Object.keys(cb), ...Object.keys(ca)])) {
      if ((cb[k] || 0) !== (ca[k] || 0)) {
        contentPreserved = false;
        mismatchDetail.push({ kind: 'marker-mismatch', where: 'body', marker: k, body: cb[k] || 0, assigned: ca[k] || 0 });
      }
    }
    // \u05de\u05e7\u05d5\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3: \u05d0\u05d5\u05ea\u05d5 \u05e1\u05de\u05df \u05d1\u05d3\u05d5\u05e7 (\u05e8\u05e7 \uu05d1\u05de\u05e6\u05d1\u05d9\u05dd \u05e2\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3\u05ea — \u05dc\u05d0 placeholder)
    if (displayMarkers.length || (notesMode !== 'inline' && settings['footnotes-enabled'])) {
      const cdd = cnt(displayMarkers);
      const cad = cnt(assignedAll.filter(m => !rejectedMarkers.has(m)));
      for (const k of new Set([...Object.keys(cdd), ...Object.keys(cad)])) {
        if ((cdd[k] || 0) !== (cad[k] || 0)) {
          contentPreserved = false;
          mismatchDetail.push({ kind: 'marker-mismatch', where: 'display', marker: k, display: cdd[k] || 0, assigned: cad[k] || 0 });
        }
      }
    }
  }



  if (!contentPreserved) {
    const rec = ledger.create('text-completeness', 'document', null, { hashIn, mismatches: mismatchDetail }, 'render');
    ledger.transition(rec.issue_id, 'persists', 'render', 'word-multiset mismatch \u2014 token loss/duplication detected');
  }

  // **P1-2: \u05d0\u05db\u05dc\u05d5\u05e1 parenRanges \u05de\u05de\u05e4\u05ea \u05d4\u05d4\u05d9\u05e7\u05e3** \u2014 \u05d4\u05d2\u05e0\u05ea paren-cross-boundary \u05d7\u05d9\u05d4
  {
    let spanId = 0;
    for (const b of blocks) {
      if (b.kind !== 'paragraph' || !b.parenCharSpans || !b.parenCharSpans.length) continue;
      if (!b.flatWordOffsets || !b.flatWordOffsets.length) continue;
      // \u05de\u05d9\u05e4\u05d5\u05d9 \u05d8\u05d5\u05d5\u05d7\u05d9 (...) \u05dc\u05de\u05d3\u05d3\u05d9 \u05de\u05d9\u05dc\u05d9\u05dd \u05d1\u05e8\u05e6\u05e3 \u05d4\u05d1\u05dc\u05d5\u05e7 (\u05e1\u05d3\u05e8 \u05de\u05e1\u05de\u05da, \u05dc\u05d0 \u05d7\u05d9\u05e4\u05d5\u05e9\u05d9\u05dd)
      const ranges = [];
      for (const sp of b.parenCharSpans) {
        const startW = b.flatWordOffsets.find(x => x.at > sp.from && x.at < sp.to);
        const endW = b.flatWordOffsets.find(x => x.at > sp.from && x.at < sp.to && x.at >= (startW ? startW.at : 0));
        if (startW && endW) ranges.push({ startWi: b.flatWordOffsets.indexOf(startW), endWi: b.flatWordOffsets.indexOf(endW) });
      }
      for (const r of ranges) {
        // \u05de\u05d9\u05e4\u05d5\u05d9 \u05de\u05d3\u05d3\u05d9 \u05de\u05d9\u05dc\u05d4 \u05dc\u05e9\u05d5\u05e8\u05d5\u05ea \u05d4\u05d1\u05dc\u05d5\u05e7 \u2014 \u05d5\u05de\u05e9\u05dd \u05dc\u05de\u05e7\u05d5\u05dd \u05d1\u05e4\u05e8\u05d9\u05e1\u05d4
        let acc = 0, startLine = -1, endLine = -1;
        for (let li = 0; li < b.lines.length; li++) {
          const len = (b.lines[li].words || []).length;
          if (startLine < 0 && acc + len > r.startWi) startLine = li;
          if (endLine < 0 && acc + len > r.endWi) endLine = li;
          acc += len;
        }
        if (startLine < 0 || endLine < 0) continue;
        const found = { start: null, end: null };
        for (const pg of pages) {
          for (let c = 0; c < pg.columns.length; c++) {
            for (const ln of pg.columns[c]) {
              const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
              if (tok !== b.tokenId) continue;
              const lIdx = ln.meta && ln.meta.lineIdx != null ? ln.meta.lineIdx : null;
              if (lIdx === null) continue;
              if (lIdx === startLine) found.start = { page: pg.index, col: c };
              if (lIdx === endLine) found.end = { page: pg.index, col: c };
            }
          }
        }
        if (found.start && found.end) {
          spanId++;
          const host = pages.find(pg => pg.index === found.start.page);
          if (host) {
            host.parenRanges = host.parenRanges || [];
            host.parenRanges.push({
              id: `p${spanId}@${b.tokenId}`,
              startPage: found.start.page, startCol: found.start.col,
              endPage: found.end.page, endCol: found.end.col
            });
          }
        }
      }
    }
    if (spanId) eventLog.emit('scope-map', 'paren-ranges-populated', { count: spanId });
  }

  // ---- ledger finalize + CP5 ----
  eventLog.emit('ledger-finalize', 'summary', ledger.summary());
  const finalHash = layoutHash(pages); // hash \u05e9\u05dc \u05d4\u05de\u05e6\u05d1 \u05d4\u05e1\u05d5\u05e4\u05d9 (\u05d3\u05d8\u05e8\u05de\u05d9\u05e0\u05d9\u05d6\u05dd \u05d1\u05d9\u05df\u05be\u05e8\u05d9\u05e6\u05d5\u05ea)
  eventLog.emit('render', 'cp5-render-ready', { layoutHash: finalHash });
  prog('render', 100, 'מוכן לתצוגה', { totalPages: pages.length, layoutHash: finalHash });

  // **S11 (REQ-GOV-11):** המלצות עריכה — רק עם הוכחת dry-run חיה (D-16).
  // דוק >200 עמודים ⇒ לא אוטומטי (שומר ביצועים); env.wantRecommendations=true ⇒ כן.
  let recommendations = null;
  if (!env || env.noRecommendations !== true) {
    recommendations = computeEditingRecommendations(
      rawText, settingsIn || {},
      { pages, ledger, layoutHash: finalHash },
      { force: !!(env && env.wantRecommendations === true) }
    );
  }

  return {
    metadata, tokens, pages, ledger, events: eventLog,
    toc, numbers,
    tocPages: tocPagesAll,          // **S9:** עמודי תוכן־העניינים האמיתיים (אובייקטים בתוך pages)
    tocInsert: tocInsertInfo,       // **S9:** היכן הוכנסו וכמה
    numberingAudit,                 // **S9:** ממצאי pn-sequence/pn-overflow
    settings,
    contentHashIn: hashIn,
    contentPreserved,
    layoutHash: finalHash,
    plannedLayoutHash: planned.hash,
    geometryNeutralVerified,
    ornaments: ornamentPass,
    retreat: planned.retreat,
    sideNotes: sideNotePlacement,
    endnotePages: endnotePagesInfo,
    endnotePagesInfo,
    scope,
    customStyles: customStylesRes,  // **S11:** הסגנונות שהופעלו בפועל (כולל שגיאות אימות)
    recommendations                 // **S11:** המלצות עריכה עם הוכחות (או null אם כובו)
  };
}

module.exports = { typeset };

};
__modules["src/engine/core/settings-registry.js"] = function (require, module, exports) {
// src/engine/core/settings-registry.js — Three-layer settings contract (REQ-GOV-04, D-07)
// מקור־האמת היחיד: פקד ↔ מפתח ↔ מנגנון ↔ בדיקה. נבו from this file: default_settings.json + HTML bindings + docs.
'use strict';

const P = {
  THEMES: 'ערכות נושא, שערים ורקעים',
  BUILDER: 'בונה ערכות נושא (SVG Builder)',
  IMPORTS: 'ייבוא תוספים',
  NOTES: 'הערות שוליים וסיום',
  QUALITY: 'איכות עימוד',
  TYPO: 'טיפוגרפיה וגוף הטקסט',
  HEADINGS: 'כותרות 0–7',
  ORNAMENTS: 'עיטורים וגרפיקה',
  HEADERS: 'כותרות עליונות',
  TOC: 'תוכן העניינים',
  GRID: 'רשת העמוד ומספור',
  EXPORT: 'ייצוא (HTML/PDF/ZIP) ומדידה',
  ADVANCED: 'מתקדם/מנוע'
};

// T = types; C = consumers (mechanism ids); X = effect-test id
const K = (id, type, dflt, panel, control, consumers, testId, extra = {}) =>
  ({ id, type, default: dflt, panel, control, consumers, effect_test: testId, ...extra });

// **S9 (D-61):** מקורות כותרת עליונה — כולל book-name-rest (החלק שאחרי המקף) ופורט
// fillHeaderFirstLastWords המאוחד (first-last-words). משותף ל‑6 סלוטים + 3 סלוטי פתיחה.
const HDR_SOURCES = ['none', 'book-name', 'book-name-rest', 'h1', 'h2', 'page-num', 'first-word', 'last-word', 'first-last-words', 'custom'];

const registry = [
  // ---- רשת העמוד ומספור (GRID) ----
  K('page-size', 'enum', 'A4', P.GRID, 'sel-page-size', ['layout/page-templates'], 'fx:page-size', { enum: ['A4', 'A5', '16x16', 'custom'] }),
  K('grid-col-width-pct', 'number', 40, P.GRID, 'rng-col-width', ['layout/column-flow'], 'fx:col-width', { min: 20, max: 60 }),
  K('grid-margin-side-pct', 'number', 7.5, P.GRID, 'rng-margin-side', ['layout/page-templates'], 'fx:margin-side', { min: 2, max: 20 }),
  K('grid-gutter-pct', 'number', 2, P.GRID, 'rng-gutter', ['layout/column-flow'], 'fx:gutter', { min: 0.5, max: 8 }),
  K('grid-block-gap-pct', 'number', 2, P.GRID, 'rng-block-gap', ['layout/candidate-generator'], 'fx:block-gap', { min: 0, max: 8 }),
  K('margin-top-px', 'number', 20, P.GRID, 'rng-margin-top', ['layout/page-templates'], 'fx:margin-top'),
  K('margin-bottom-px', 'number', 20, P.GRID, 'rng-margin-bottom', ['layout/page-templates'], 'fx:margin-bottom'),
  K('binding-offset-px', 'number', 0, P.GRID, 'rng-binding-offset', ['layout/page-templates'], 'fx:binding', { note: 'שולי תפירה א־סימטריים recto/verso' }),
  K('h2-top-offset', 'number', 33, P.GRID, 'rng-h2-top-offset', ['layout/page-templates'], 'fx:h2-top-offset', { note: 'PT-05: מרחק עליון נפרד H2' }),
  K('column-divider-style', 'enum', 'none', P.GRID, 'sel-col-divider', ['decoration/dividers'], 'fx:col-divider', { enum: ['none', 'thin', 'dashed', 'double'], note: 'גובה = Math.min(שני הטורים) − 8px' }),
  K('page-num-format', 'enum', 'hebrew', P.GRID, 'sel-page-num-format', ['decoration/folio'], 'fx:folio-format', { enum: ['hebrew', 'decimal', 'daf-hebrew'] }),
  // **S9 (D-61):** square/circle = מסגרות CSS (badge); parenthesis/squares = סוגריים טקסטואליים —
  // הפרדה נאמנה ל־V1 (page-num-frame-box/circle CSS) ול־Mapping פנייה 2 (parens/squares טקסט).
  K('page-num-frame', 'enum', 'none', P.GRID, 'sel-page-num-frame', ['decoration/folio'], 'fx:folio-frame', { enum: ['none', 'circle', 'square', 'parenthesis', 'squares', 'floral', 'diamond'] }),
  K('page-num-position', 'enum', 'bottom-center', P.GRID, 'sel-page-num-position', ['decoration/folio'], 'fx:folio-pos', { enum: ['bottom-center', 'outer-left', 'outer-right', 'top', 'in-header', 'none'] }),
  K('page-num-initial-value', 'number', 1, P.GRID, 'inp-page-num-initial', ['decoration/folio'], 'fx:folio-initial', { note: 'שוחזר מ‑V1 (REQ-HDR-03)' }),
  // **S9 (D-61):** page-num-start-idx — שחזור V1 מלא (REQ-HDR-03): מספור מוצג רק מסוד ה‑counted
  // הזה ואילך; הערך האפקטיבי = סוד − start‑idx + initial‑value (נוסחת V1 formatPageNumberDisplay).
  K('page-num-start-idx', 'number', 1, P.GRID, 'inp-page-num-start-idx', ['decoration/folio'], 'fx:folio-start-idx', { min: 1, max: 999, note: 'שוחזר מ‑V1 (REQ-HDR-03): סוד העמוד הנספר שממנו מתחיל התצוגה' }),
  K('count-shaar-pages', 'bool', false, P.GRID, 'chk-count-shaar', ['decoration/folio'], 'fx:count-shaar'),
  K('count-toc-pages', 'bool', false, P.GRID, 'chk-count-toc', ['decoration/folio'], 'fx:count-toc'),
  K('count-endnote-pages', 'bool', false, P.GRID, 'chk-count-endnotes', ['decoration/folio', 'core/pipeline'], 'fx:count-endnotes', { note: 'S7.1.1: אם true — עמודי הערות נספרים במספור ומקבלים גיליון' }),

  // ---- טיפוגרפיה (TYPO) ----
  K('body-font', 'font', 'Frank Ruhl Libre', P.TYPO, 'sel-body-font', ['typography/measure-api'], 'fx:body-font', { note: 'font-picker preserve-missing-value (IMUD port)' }),
  K('body-font-size-pt', 'number', 14, P.TYPO, 'rng-body-size', ['typography/measure-api'], 'fx:body-size', { min: 9, max: 24 }),
  K('body-line-height', 'number', 1.4, P.TYPO, 'rng-body-lh', ['typography/kp-linebreak'], 'fx:body-lh', { min: 1.2, max: 1.6, note: 'פלפול 1.25 / קריאה 1.45' }),
  // D-42 (P1-2): קדם־פאס סוגריים לפני מדידה — REQ-PAR-ST-02. סקאלה 1.0 = כבוי (ברירת מחדל, לא משנה hash).
  K('paren-style-scale', 'number', 1, P.TYPO, 'rng-paren-scale', ['core/pipeline', 'output/dom-renderer'], 'fx:paren-scale', { min: 0.8, max: 1, step: 0.01, note: 'מילים בתוך (...) נמדדות בסקאלה זו לפני שבירת שורות ומרונדרות במחלקת w--paren; 1.0 = כבוי' }),
  K('first-word-mode', 'enum', 'drop', P.TYPO, 'sel-first-word-mode', ['typography/dropword'], 'fx:fw-mode', { enum: ['drop', 'inline', 'bold', 'none'] }),
  K('first-word-length', 'number', 1, P.TYPO, 'sel-first-word-len', ['typography/dropword'], 'fx:fw-len', { enum: [1, 2] }),
  K('first-word-threshold-lines', 'number', 3, P.TYPO, 'rng-fw-threshold', ['typography/dropword'], 'fx:fw-threshold', { min: 2, max: 6 }),
  K('first-word-align-cap-top', 'bool', true, P.TYPO, 'chk-fw-cap-align', ['typography/dropword'], 'fx:fw-cap', { note: 'REQ-LB-05: קצה עליון לקו בסיס גוף — לא baseline' }),
  K('dh-auto-detect', 'bool', true, P.TYPO, 'chk-dh-detect', ['parser/block-tokenizer'], 'fx:dh-detect', { note: 'דיבור המתחיל עד נקודה/מקף' }),
  K('dh-font', 'font', 'David HB', P.TYPO, 'sel-dh-font', ['typography/measure-api'], 'fx:dh-font'),
  K('body-last-line-align', 'enum', 'center', P.TYPO, 'sel-last-line-align', ['output/dom-renderer'], 'fx:last-line-align', { enum: ['center', 'right', 'stretch'], note: 'wiring מ‑Orange ✓' }),

  // ---- כותרות 0–7 (HEADINGS) ----
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(h => [
    K(`heading-${h}-mode`, 'enum', h === 7 ? 'side-note' : 'full-width', P.HEADINGS, `sel-h${h}-mode`, ['layout/headings-escort'], `fx:h${h}-mode`, { enum: ['full-width', 'regular', 'side-note', 'new-page'] }),
    K(`heading-${h}-font`, 'font', 'David HB', P.HEADINGS, `sel-h${h}-font`, ['typography/measure-api'], `fx:h${h}-font`),
    K(`heading-${h}-size-pt`, 'number', [20, 18, 16, 15, 14, 14, 13, 12][h], P.HEADINGS, `rng-h${h}-size`, ['typography/measure-api'], `fx:h${h}-size`, { min: 8, max: 48 }),
  ]),
  // D-45→D-54: h2-orn-scope חזר בסעיף העיטורים להלן עם מנגנום חי (S8).
  K('hdr-h1-title-mode', 'enum', 'main', P.HEADERS, 'sel-hdr-h1-mode', ['decoration/headers-builder'], 'fx:hdr-h1-mode', { enum: ['main', 'full'], note: 'K-8: main כברירת מחדל + toggle' }),

  // ---- כותרות עליונות (HEADERS) ----
  // **S9 (D-61):** עצמאות מלאה 3×2 (REQ-HDR-01) — לכל סלוט: מקור/יישור/גופן/גודל/רוחב%/טקסט־מותאם.
  // תיקון bc7892f (IMUD) נעול: לסלוט המרכזי בו־ורסו יש גופן/גודל/טקסט משלו — לא יורש מה־recto.
  K('header-enabled', 'bool', true, P.HEADERS, 'chk-header-enabled', ['decoration/headers-builder'], 'fx:header-on'),
  K('header-recto-right-source', 'enum', 'book-name', P.HEADERS, 'sel-hr-right', ['decoration/headers-builder'], 'fx:hr-right', { enum: HDR_SOURCES }),
  K('header-recto-center-source', 'enum', 'h2', P.HEADERS, 'sel-hr-center', ['decoration/headers-builder'], 'fx:hr-center', { enum: HDR_SOURCES }),
  K('header-recto-left-source', 'enum', 'h1', P.HEADERS, 'sel-hr-left', ['decoration/headers-builder'], 'fx:hr-left', { enum: HDR_SOURCES }),
  K('header-verso-right-source', 'enum', 'h1', P.HEADERS, 'sel-hv-right', ['decoration/headers-builder'], 'fx:hv-right', { enum: HDR_SOURCES }),
  K('header-verso-center-source', 'enum', 'h2', P.HEADERS, 'sel-hv-center', ['decoration/headers-builder'], 'fx:hv-center', { enum: HDR_SOURCES }),
  K('header-verso-left-source', 'enum', 'book-name', P.HEADERS, 'sel-hv-left', ['decoration/headers-builder'], 'fx:hv-left', { enum: HDR_SOURCES }),
  K('header-verso-same-as-recto', 'bool', false, P.HEADERS, 'chk-hv-same', ['decoration/headers-builder'], 'fx:hv-same', { note: 'same_as_even + גידוע מעגליות (Orange c49b79e) — resolveSameAs עם seen-set' }),
  K('header-separator-line', 'enum', 'gray', P.HEADERS, 'sel-header-sep', ['decoration/headers-builder'], 'fx:header-sep', { enum: ['none', 'gray', 'black'] }),
  // **S9 (REQ-HDR-02):** כותרת ייעודית לעמודים הפותחים בכותרת H2/H3 — סלוטי מקור נפרדים
  // (יישור/רוחב/גופן/גודל יורשים מהצד הפיזי של העמוד — D-61).
  K('header-opening-dedicated', 'bool', false, P.HEADERS, 'chk-hdr-opening', ['decoration/headers-builder'], 'fx:hdr-opening', { note: 'REQ-HDR-02: עמוד הנפתח בכותרת H2/H3 מקבל את שלושת סלוטי הפתיחה שלהלן' }),
  K('header-opening-right-source', 'enum', 'none', P.HEADERS, 'sel-ho-right', ['decoration/headers-builder'], 'fx:ho-right', { enum: HDR_SOURCES }),
  K('header-opening-center-source', 'enum', 'book-name', P.HEADERS, 'sel-ho-center', ['decoration/headers-builder'], 'fx:ho-center', { enum: HDR_SOURCES }),
  K('header-opening-left-source', 'enum', 'none', P.HEADERS, 'sel-ho-left', ['decoration/headers-builder'], 'fx:ho-left', { enum: HDR_SOURCES }),
  ...['recto', 'verso'].flatMap(side => ['right', 'center', 'left'].flatMap(pos => [
    K(`header-${side}-${pos}-align`, 'enum', pos === 'right' ? 'right' : pos === 'left' ? 'left' : 'center', P.HEADERS, `sel-h${side[0]}${pos}-align`, ['decoration/headers-builder'], `fx:${side}-${pos}-align`, { enum: ['right', 'center', 'left'] }),
    K(`header-${side}-${pos}-width-pct`, 'number', 33, P.HEADERS, `rng-h${side[0]}${pos}-width`, ['decoration/headers-builder'], `fx:${side}-${pos}-width`, { min: 5, max: 90 }),
    // **S9 (D-61):** גופן/גודל/טקסט מותאם לכל סלוט — עצמאות מלאה (bc7892f locked forever)
    K(`header-${side}-${pos}-font`, 'font', 'David HB', P.HEADERS, `sel-h${side[0]}${pos}-font`, ['decoration/headers-builder'], `fx:${side}-${pos}-font`),
    K(`header-${side}-${pos}-size-pt`, 'number', 11, P.HEADERS, `rng-h${side[0]}${pos}-size`, ['decoration/headers-builder'], `fx:${side}-${pos}-size`, { min: 6, max: 28 }),
    K(`header-${side}-${pos}-custom-text`, 'string', '', P.HEADERS, `inp-h${side[0]}${pos}-custom`, ['decoration/headers-builder'], `fx:${side}-${pos}-custom`),
  ])),

  // ---- הערות (NOTES) ----
  K('note-placement-mode', 'enum', 'footnotes', P.NOTES, 'sel-note-mode', ['core/pipeline', 'layout/dp-planner', 'layout/endnote-pages'], 'fx:note-mode', { enum: ['footnotes', 'endnotes', 'inline'] }),
  K('footnotes-enabled', 'bool', true, P.NOTES, 'chk-fn-enabled', ['layout/footnote-budget', 'core/pipeline'], 'fx:fn-on', { note: 'D-39: קלט משתמש מפורש גובר על נגזרות; mode=footnotes + false ⇒ ההערות בגוף כplaceholder' }),
  K('footnote-marker-style', 'enum', 'hebrew-geresh', P.NOTES, 'sel-fn-marker', ['notes/markers'], 'fx:fn-marker', { enum: ['hebrew-geresh', 'parenthesis', 'asterisk', 'decimal'] }),
  K('footnote-reset-policy', 'enum', 'page', P.NOTES, 'sel-fn-reset', ['notes/markers'], 'fx:fn-reset', { enum: ['continuous', 'page', 'section', 'part'] }),
  K('footnote-columns', 'number', 1, P.NOTES, 'sel-fn-cols', ['layout/footnote-budget'], 'fx:fn-cols', { enum: [1, 2] }),
  K('footnote-separator-rule', 'enum', 'regular', P.NOTES, 'sel-fn-rule', ['output/dom-renderer'], 'fx:fn-rule', { enum: ['none', 'regular', 'circles', 'sparkle', 'star', 'diamond'] }),
  K('fn-layout-mode', 'enum', 'block', P.NOTES, 'sel-fn-layout', ['layout/dp-planner', 'output/dom-renderer'], 'fx:fn-layout', { enum: ['block', 'continuous'], note: 'REQ-FN-07 (D-34): block=כל הערה בלוק משלה + תקרת fn-bar; continuous=זרימה רציפה בלי תקרה' }),
  K('endnotes-enabled', 'bool', false, P.NOTES, 'chk-endnotes', ['layout/endnote-pages'], 'fx:endnotes-on', { note: 'נגזר מ‑note-placement-mode=endnotes (D-39); קלט ישן true ממופה ל‑mode=endnotes בהגירה (project-io)' }),
  K('endnote-title-text', 'string', 'הערות', P.NOTES, 'inp-endnote-title', ['layout/endnote-pages'], 'fx:endnote-title'),
  K('endnote-columns', 'number', 1, P.NOTES, 'sel-en-cols', ['layout/endnote-pages'], 'fx:en-cols', { enum: [1, 2], note: 'S7.1.1: טור אחד או שניים בעמודי הערות' }),
  K('f-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-fnote-body-font', ['layout/footnote-budget'], 'fx:fnote-body-font'),
  K('s-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-snote-body-font', ['layout/side-notes'], 'fx:snote-body-font'),
  K('fn-bar-max-height-px', 'number', 220, P.NOTES, 'rng-fn-bar-max', ['layout/dp-planner'], 'fx:fn-bar-max', { min: 40, max: 600, note: 'S7.1.3: תקרת מרזב — חריגה מפעילה אסדרה לפי long-footnote-policy (block mode בלבד, D-34)' }),
  K('long-footnote-policy', 'enum', 'split', P.NOTES, 'sel-long-fn', ['layout/dp-planner'], 'fx:long-fn', { enum: ['split', 'move-whole', 'reject-to-body'], note: 'REQ-FN-02; split=המשך במרזב העמוד הבא עם סימון המשך; reject-to-body=השבה מלאה לגוף (BRZ-15)' }),

  // ---- איכות עימוד (QUALITY) ----
  K('prevent-widows-top', 'bool', true, P.QUALITY, 'chk-widow-top', ['layout/protections-matrix'], 'fx:widow-top', { note: 'טוגל נפרד לתחילת עמוד (Mapping #4)' }),
  K('prevent-widows-bottom', 'bool', true, P.QUALITY, 'chk-widow-bottom', ['layout/protections-matrix'], 'fx:widow-bottom'),
  K('prevent-orphans-top', 'bool', true, P.QUALITY, 'chk-orphan-top', ['layout/protections-matrix'], 'fx:orphan-top'),
  K('prevent-orphans-bottom', 'bool', true, P.QUALITY, 'chk-orphan-bottom', ['layout/protections-matrix'], 'fx:orphan-bottom'),
  K('widow-strictness', 'enum', 'normal', P.QUALITY, 'sel-widow-strict', ['layout/protections-matrix'], 'fx:widow-strict', { enum: ['relaxed', 'normal', 'strict'] }),
  K('runt-min-width-pct', 'number', 50, P.QUALITY, 'rng-runt-min', ['typography/protectors'], 'fx:runt-min', { min: 20, max: 80 }),
  K('balance-chapter-end', 'enum', 'balance', P.QUALITY, 'sel-balance-chapter', ['layout/balancing', 'core/pipeline'], 'fx:balance-chapter', { enum: ['balance', 'stretch', 'natural'], note: 'REQUIRE: מנגנון מלא (שוחזר מ‑Green, REQ-BAL-03); נצרך בפועל ב‑pipeline בסוף כל חלק' }),
  K('allow-terminal-residual-fallback', 'bool', true, P.QUALITY, 'chk-terminal-residual', ['layout/dp-planner'], 'fx:terminal-residual', { note: 'שוחזר מ‑Green (REQ-BAL-04)' }),
  K('imbalance-max-delta-px', 'number', 5, P.QUALITY, 'rng-imbalance-max', ['layout/balancing'], 'fx:imbalance-max'),
  K('aq-enabled', 'bool', false, P.QUALITY, 'chk-aq', ['layout/balancing', 'core/pipeline'], 'fx:aq-on', { note: 'AutoQuality מ‑Gold — שלוש שכבות יחד (REQ-BAL-06); נקרא בפועל מהpipeline (תיקון P1-1)' }),
  K('aq-word-spacing-min', 'number', 0.95, P.QUALITY, 'rng-aq-ws-min', ['layout/balancing'], 'fx:aq-ws-min', { min: 0.8, max: 1 }),
  K('aq-word-spacing-max', 'number', 1.05, P.QUALITY, 'rng-aq-ws-max', ['layout/balancing'], 'fx:aq-ws-max', { min: 1, max: 1.2 }),
  K('aq-letter-spacing-min', 'number', 0.97, P.QUALITY, 'rng-aq-ls-min', ['layout/balancing'], 'fx:aq-ls-min'),
  K('aq-letter-spacing-max', 'number', 1.03, P.QUALITY, 'rng-aq-ls-max', ['layout/balancing'], 'fx:aq-ls-max'),
  K('aq-heading-spacing-min', 'number', 0.95, P.QUALITY, 'rng-aq-hs-min', ['layout/balancing'], 'fx:aq-hs-min'),
  K('aq-heading-spacing-max', 'number', 1.05, P.QUALITY, 'rng-aq-hs-max', ['layout/balancing'], 'fx:aq-hs-max'),
  K('aq-shared-load', 'bool', true, P.QUALITY, 'chk-aq-shared', ['layout/balancing'], 'fx:aq-shared'),
  K('aq-stretch-to-bottom', 'bool', true, P.QUALITY, 'chk-aq-stretch', ['layout/balancing'], 'fx:aq-stretch', { note: 'clamp overshoot 20px (REQ-BAL-07)' }),
  K('aq-overshoot-clamp-px', 'number', 20, P.QUALITY, 'rng-aq-clamp', ['layout/balancing'], 'fx:aq-clamp', { min: 0, max: 60 }),
  K('aq-compress-first', 'bool', true, P.QUALITY, 'chk-aq-compress', ['layout/balancing'], 'fx:aq-compress'),

  // ---- עיטורים (ORNAMENTS) ---- **S8 (D-54): מפתחות העיטורים חוזרים עם מנגנון חי + בדיקת אפקט**
  // (D-45 הסיר אותם עד שיהיה מנגנום; כעת כל אחד נצרך בפועל בפאס העיטורים L5).
  K('h2-orn-scope', 'enum', 'both', P.ORNAMENTS, 'sel-h2-orn-scope', ['decoration/ornament-fit'], 'fx:h2-orn-scope', { enum: ['sign', 'title', 'both'], note: 'REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם' }),
  K('h2-orn-top', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-top', ['decoration/ornament-fit'], 'fx:h2-orn-top', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור עליון לסימן (V4: מצבים עצמאיים)' }),
  K('h2-orn-bottom', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-bottom', ['decoration/ornament-fit'], 'fx:h2-orn-bottom', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור תחתון לסימן' }),
  K('h2-orn-side', 'enum', 'none', P.ORNAMENTS, 'sel-h2-orn-side', ['decoration/ornament-fit'], 'fx:h2-orn-side', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'עיטור צדדי לכותרת (V4)' }),
  K('h2-orn-fit-to-text', 'bool', true, P.ORNAMENTS, 'chk-h2-orn-fit', ['decoration/ornament-fit'], 'fx:h2-orn-fit', { note: 'REQ-ORN-01: התאמת רוחב לטקסט במדידת JS — CSS fit-content נכשל (V3/V4); המידות נקבעות בהזמנת הפריסה (F-08)' }),
  K('h3-side-orn', 'enum', 'none', P.ORNAMENTS, 'sel-h3-side-orn', ['decoration/ornament-plan'], 'fx:h3-side-orn', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll'], note: 'REQ-ORN-01: עיטורי צד H3 — התאמת גובה לשורה' }),
  K('h3-side-orn-height-em', 'number', 1, P.ORNAMENTS, 'rng-h3-side-orn-h', ['decoration/ornament-plan'], 'fx:h3-side-orn-h', { min: 0.5, max: 2, step: 0.1, note: 'גובה ב־em; מקור שליטה יחיד — אין !important מול inline (F-09)' }),
  K('chapter-end-ornament', 'enum', 'none', P.ORNAMENTS, 'sel-chapter-end-orn', ['decoration/ornament-plan'], 'fx:chapter-end-orn', { enum: ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'], note: 'REQ-ORN-03: פירמידת וילנא/רומח/שושנתא/סלסול/תמונה — התאמה לתקציב הפנוי; לעולם לא דוחף תוכן' }),
  K('chapter-end-ornament-w-em', 'number', 4, P.ORNAMENTS, 'rng-chapter-end-w', ['decoration/ornament-plan'], 'fx:chapter-end-w', { min: 1, max: 12 }),
  K('chapter-end-ornament-h-em', 'number', 1.2, P.ORNAMENTS, 'rng-chapter-end-h', ['decoration/ornament-plan'], 'fx:chapter-end-h', { min: 0.3, max: 4 }),
  K('heading-dividers-h3-h6', 'bool', false, P.ORNAMENTS, 'chk-hdr-dividers', ['decoration/dividers', 'decoration/ornament-plan'], 'fx:hdr-dividers', { note: 'REQ-ORN-04: fits() נמדד בכל אתרי ההוספה; בלי עיטור בראש טור/עמוד ריק; rollback-aware (Orange)' }),
  K('shaar-main-divider', 'enum', 'none', P.ORNAMENTS, 'sel-shaar-main-div', ['decoration/dividers'], 'fx:shaar-main-div', { enum: ['none', 'thin', 'dashed', 'double'], note: 'REQ-ORN-04: קו מפריד בשער ראשי (PT-01)' }),
  K('shaar-sub-divider', 'enum', 'none', P.ORNAMENTS, 'sel-shaar-sub-div', ['decoration/dividers'], 'fx:shaar-sub-div', { enum: ['none', 'thin', 'dashed', 'double'], note: 'REQ-ORN-04: קו מפריד בשער משנה (PT-02)' }),

  // ---- TOC ----
  // **S9 (D-62):** מיומנות מספור TOC מלאה (Orange eb21383 — 4 מפתחות; הרביעי כבר קיים):
  // count = מספור שורות תוכן־העניינים עצמן; show = האם עמודי התוכן מציגים גיליון משלהם (כשנספרים).
  K('toc-general-enabled', 'bool', true, P.TOC, 'chk-toc-general', ['decoration/toc-builder'], 'fx:toc-gen'),
  K('toc-detail-enabled', 'bool', false, P.TOC, 'chk-toc-detail', ['decoration/toc-builder'], 'fx:toc-det'),
  K('general-toc-count-numbering', 'bool', true, P.TOC, 'chk-toc-count', ['decoration/toc-builder'], 'fx:toc-count', { note: 'שוחזר מ‑V1/V2 (REQ-HDR-03/HDR-05)' }),
  K('detailed-toc-count-numbering', 'bool', true, P.TOC, 'chk-dtoc-count', ['decoration/toc-builder'], 'fx:dtoc-count', { note: 'S9: מספור שורות בתוכן־עניינים המפורט (Orange eb21383 — הושלם)' }),
  K('general-toc-show-numbering', 'bool', true, P.TOC, 'chk-gtoc-show', ['decoration/toc-builder'], 'fx:gtoc-show', { note: 'S9: עמודי תוכן־עניינים כלליים מציגים גיליון כשהם נספרים (count-toc-pages=true)' }),
  K('detailed-toc-show-numbering', 'bool', true, P.TOC, 'chk-dtoc-show', ['decoration/toc-builder'], 'fx:dtoc-show', { note: 'S9: עמודי תוכן־עניינים מפורטים מציגים גיליון כשהם נספרים' }),
  ...[1, 2, 3, 4, 5, 6, 7].flatMap(lvl => [
    K(`toc-level-${lvl}-show`, 'bool', lvl <= 2, P.TOC, `chk-toc-l${lvl}`, ['decoration/toc-builder'], `fx:toc-l${lvl}`),
    K(`toc-level-${lvl}-inline`, 'bool', lvl >= 4, P.TOC, `chk-toc-l${lvl}-inline`, ['decoration/toc-builder'], `fx:toc-l${lvl}-inline`),
  ]),

  // ---- שערים/נושאים (THEMES) ---- **S8 (D-54): ערכות נושא חיות — הפעלה מלאה (F-10 נעול)**
  K('background-color', 'color', '#ffffff', P.THEMES, 'inp-bg-color', ['output/dom-renderer'], 'fx:bg-color'),
  K('background-opacity', 'number', 1, P.THEMES, 'rng-bg-opacity', ['output/dom-renderer'], 'fx:bg-opacity', { min: 0, max: 1, step: 0.05, note: 'נצרך בפועל: rgba() על background-color (תיקון P0-5 — בעבר נכתב לתכונת CSS בלתי קיימת)' }),
  K('theme-set-id', 'string', 'default', P.THEMES, 'sel-theme-set', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:theme-set', { note: 'REQ-ORN-06: הפעלת ערכה מפעילה את שלושת השערים (F-10) דרך theme-sets.activateThemeSet' }),
  K('show-shaar-sub', 'bool', false, P.THEMES, 'chk-show-shaar-sub', ['decoration/shaar-pages', 'decoration/theme-sets'], 'fx:show-shaar-sub', { note: 'U-C2: "הצג שער משנה" — עמודי שער־משנה לפני כל פתיחת חלק' }),
  K('shaar-main-image', 'string', '', P.THEMES, 'inp-shaar-main-img', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:shaar-main-img'),
  K('shaar-sub-image', 'string', '', P.THEMES, 'inp-shaar-sub-img', ['decoration/page-decorations'], 'fx:shaar-sub-img'),
  K('shaar-back-enabled', 'bool', true, P.THEMES, 'chk-shaar-back', ['decoration/page-decorations', 'decoration/shaar-pages'], 'fx:shaar-back', { note: 'PT-03: 4 מקטעים עצמאיים; כיבוי ראשי מבטל את כולם' }),
  // REQ-ORN-08: פאנל רקעים מוזג לתוך נושאים — 3 סוגי עמודים + color/texture/image + insets מ"מ
  K('background-page-type', 'enum', 'regular', P.THEMES, 'sel-bg-page-type', ['decoration/page-decorations'], 'fx:bg-page-type', { enum: ['regular', 'preface-open', 'sign-open'], note: 'REQ-ORN-08: מחלקת העמוד שאליה הרקע מיועד (מיזוג פאנל רקע→נושאים)' }),
  K('background-image', 'string', '', P.THEMES, 'inp-bg-image', ['decoration/page-decorations'], 'fx:bg-image'),
  K('background-texture', 'string', '', P.THEMES, 'inp-bg-texture', ['decoration/page-decorations'], 'fx:bg-texture', { note: 'טקסטורה חוזרת (שכבת תשתית — פטורה מחפיפות באודיט)' }),
  K('background-inset-mm', 'number', 0, P.THEMES, 'rng-bg-inset', ['decoration/page-decorations'], 'fx:bg-inset', { min: 0, max: 30, note: 'שקיעת הרקע משולי העמוד במ״מ' }),

  // ---- מתקדם/מנוע (ADVANCED) ----
  K('trace-verbosity', 'enum', 'standard', P.ADVANCED, 'sel-trace-verb', ['core/events', 'core/pipeline'], 'fx:trace-verb', { enum: ['off', 'minimal', 'standard', 'full'] }),
  // D-43 (P1-4): diagnostics-enabled אינו רשאי לדכא רישום ממצאים ("לא להשבית אבחון").
  // הוא שולט ברמת הפירוט בדוח בלבד (buildReport compact) — לעולם לא ברישום עצמו.
  K('diagnostics-enabled', 'bool', true, P.ADVANCED, 'chk-diag', ['audit/report-schema'], 'fx:diag-on'),
  K('offline-guard', 'bool', true, P.ADVANCED, 'chk-offline-guard', ['output/html-export'], 'fx:offline-guard', { note: 'exit 7 על בקשה חיצונית (Orange ✓)' }),
  // **S10 — סגירת הבטחת D-44:** debounce-light-change-ms חוזר עם צרכן אמיתי —
  // ui/retypeset-policy קורא אותו בפועל (רענון קל מרוכז; בדיקת אפקט fx:debounce ב־s10).
  K('debounce-light-change-ms', 'number', 350, P.ADVANCED, 'rng-debounce-ms', ['ui/retypeset-policy'], 'fx:debounce', { min: 50, max: 2000, step: 50, note: 'REQ-UI-02: ריכוז שינויים קלים (רקע/נושא/שער) לפני רינדור מחדש — 350–400ms לפי Spec §5.3' }),

  // ---- ייצוא ומדידה (EXPORT — S12; REQ-EXP-01..04, REQ-LB-01 impl B, D-18) ----
  K('measure-impl', 'enum', 'table', P.ADVANCED, 'sel-measure-impl', ['typography/measure-api', 'core/pipeline'], 'fx:measure-impl', { enum: ['table', 'font-metrics'], note: 'S12 D-72: מימוש מדידה — table = טבלאות מכוילות (ברירת מחדל); font-metrics = טבלאות אמת מגופן רשום (hmtx/cmap/kern/GPOS). שקילות שבירות מוכחת על הקורפוס הקנוני לפני החלפת ברירת מחדל.' }),
  K('pdf-crop-marks', 'bool', false, P.ADVANCED, 'chk-crop-marks', ['output/pdf-writer'], 'fx:crop-marks', { note: 'REQ-EXP-03: סימני חיתוך מחוץ לתבנית החיתוך (TrimBox) בייצוא PDF' }),
  K('export-bleed-mm', 'number', 3, P.ADVANCED, 'rng-bleed-mm', ['output/pdf-writer'], 'fx:bleed-mm', { min: 0, max: 6, note: 'REQ-EXP-03: דם הדפסה (BleedBox) במ״מ סביב החיתוך' }),
  K('export-html-page-rules', 'bool', true, P.EXPORT, 'chk-html-page-rules', ['output/html-export'], 'fx:html-page-rules', { note: 'REQ-EXP-02: כללי @page (גודל עמוד מהרישום) בייצוא HTML עצמאי — מדפיס מדויק' }),
];

// ---- אימות פנימי: אין כפילויות id/control ----
(function validateSelf() {
  const ids = new Set(), controls = new Set();
  for (const r of registry) {
    if (ids.has(r.id)) throw new Error(`duplicate key ${r.id}`);
    if (controls.has(r.control)) throw new Error(`duplicate control ${r.control}`);
    ids.add(r.id); controls.add(r.control);
  }
})();

function getSettingDefs() { return registry.slice(); }
function getDefaultSettings() {
  const o = {};
  for (const r of registry) o[r.id] = r.default;
  return derivePlacementFlags({ settings_version: 2, ...o });
}
function findKey(id) { return registry.find(r => r.id === id) || null; }

/**
 * D-39 (תיקון P0-4): מקור־האמת הוא note-placement-mode; **קלט משתמש מפורש גובר
 * על נגזרות**. בעבר הענף הדיפולטי דרס בשקט footnotes-enabled=false — הפקד היה
 * קיים, המפתח קיים, המנגנון קיים, והגזירה ביטלה את רצון המשתמש (מחלת S4).
 * מצב סותר אמיתי (mode=endnotes + footnotes-enabled=true) נפתר לטובת המצב
 * (המצב הוא שכבת האמת) ומדווח ע"י mergeWithDefaults — לא בשקט מוחלט.
 * - 'footnotes' ⇒ מרזב לפי footnotes-enabled (true=מרזב; false=ההערות בגוף כplaceholder).
 * - 'endnotes'  ⇒ אין מרזב; ההערות זורמות לעמודי 'הערות'; endnotes-enabled=true לצרכנים ישירים.
 * - 'inline'    ⇒ ההערות בגוף כplaceholder מלא.
 */
function derivePlacementFlags(s) {
  if (!s) return s;
  if (s['note-placement-mode'] === 'endnotes') {
    s['endnotes-enabled'] = true;   // לצרכנים ישירים (endnote-pages builder)
    s['footnotes-enabled'] = false; // אין מרזב במצב endnotes — המצב גובר (מדווח בגירה)
  } else {
    s['endnotes-enabled'] = false;
    // footnotes-enabled: **ערך המשתמש עומד** — אין דריסה. mode=footnotes + false
    // ⇒ ההערות מוצגות בגוף כplaceholder מלא (BRZ-15) — לא מצב סותר.
  }
  return s;
}

module.exports = { getSettingDefs, getDefaultSettings, findKey, derivePlacementFlags, PANELS: P, registry };

};
__modules["src/engine/parser/dfa-lexer.js"] = function (require, module, exports) {
// src/engine/parser/dfa-lexer.js — Layer 1: metadata recognition ONLY in preamble (REQ-PAR-01)
'use strict';

const HEADING_RE = /^(כותרת\s*([0-7])|חלק\s+([א-ת]+)|הקדמה)\s*[-–—]\s*(.+)$/;
// **D-40 (תיקון P1-5):** הבחנה בין הערה ממוספרת לבין הוראת כותרת־מחלקה.
// ממוספרת:  `הערת סיום-1 - טקסט` / `הערת סיום 1 - טקסט`  (המספר = עוגן הסמן במקור)
// מחלקה:    `הערת סיום - כותרת`                      (הגדרת כותרת עמודי ההערות של החלק)
const ENDNOTE_PREFIX = /^הערת סיום\s*[-–—]/;
const ENDNOTE_NUMBERED = /^הערת\s*סיום\s*[-–—]?\s*([0-9]{1,4})\s*[-–—]\s*(.+)$/;
const ENDNOTE_CLASS = /^הערת\s*סיום\s*[-–—]\s*(.+)$/;
const METADATA_KEYS = ['ספר', 'נושא', 'מחבר', 'מהדורא', 'מקום', 'שנה', 'מהדורה', 'editors', 'title'];

/**
 * DFA states: PREAMBLE -> BODY. יציאה מ‑PREAMBLE: שורה ריקה או כותרת ראשונה.
 * שורה כמו `נושא - דין סוכה ישנה` באמצע המסמך נשארת פסקה (REQ-PAR-01 / לקח Z.ai).
 */
function lexDocument(rawText) {
  const lines = rawText.replace(/\r\n?/g, '\n').split('\n');
  const state = { phase: 'PREAMBLE' };
  const metadata = {};
  const body = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (state.phase === 'PREAMBLE') {
      if (trimmed === '') { state.phase = 'BODY'; continue; }
      if (HEADING_RE.test(trimmed) || ENDNOTE_PREFIX.test(trimmed)) {
        state.phase = 'BODY'; body.push(line); continue;
      }
      const m = trimmed.split(/\s+[-–—]\s+/);
      if (m.length >= 2 && METADATA_KEYS.includes(m[0].toLowerCase())) {
        metadata[m[0]] = m.slice(1).join(' - ');
        continue;
      }
      // שורה שאינה metadata → גם היא סוגרת את הפתיח
      state.phase = 'BODY';
      body.push(line);
      continue;
    }
    body.push(line);
  }
  return { metadata, bodyLines: body };
}

module.exports = { lexDocument, HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS, METADATA_KEYS };

};
__modules["src/engine/parser/block-tokenizer.js"] = function (require, module, exports) {
// src/engine/parser/block-tokenizer.js — H0–H7 / P / endnote / editorial tokens (REQ-PAR-03/04, CP1)
'use strict';

const crypto = require('crypto');
const { HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS } = require('./dfa-lexer');
const { scanBrackets } = require('./bracket-scanner');

const ATOMIC_SPACE = '\uE000'; // V3/V4 breakthrough: רווח אטומי בתוך הערה — למדידה בלבד

/** נרמול גרשים/מרכאות + ניקוי PUA פנימי (REQ-PAR-05; Z.ai fixes). */
function normalizeText(s) {
  return s
    .replace(/[\u2018\u2019]/g, '"')            // חילוף מרכאות לועזיות
    .replace(/\u05F4/g, '\u05F3')               // גרשיים → גרש (כלל one-way לפי Z.ai fix)
    .replace(/[\uE000-\uF8FF]/g, (ch) => ch);   // PUA נשמר לבדיקה per-char; U+E000 מוסר לפני render בשלב output
}

let tokenSeq = 0;
function mkToken(type, payload) {
  return { id: `t${++tokenSeq}`, type, ...payload };
}

/**
 * Tokenizer: שורות → טוקנים.
 * - כותרת N - … (N∈0..7) → heading (מקף חובה; בלי מקף = פסקה בשקט)
 * - `##…##` → editorial — מוסר לחלוטין מהפלט אך נרשם ל‑audit
 * - `הערת סיום - …` → endnote
 * - `[a][b]` רצופים → הערות נפרדות (REQ-PAR-04)
 * - בתוך `[...]`: רווחים → \uE000 (אטומי, REQ-LB-04)
 */
function tokenize(bodyLines) {
  tokenSeq = 0;
  const tokens = [];
  for (const raw of bodyLines) {
    let line = normalizeText(raw.trim()); // editable: editorial ##…## מוסר מהשורה (Spec §7)
    if (!line) continue;

    let m = line.match(HEADING_RE);
    if (m) {
      const level = m[2] !== undefined ? Number(m[2]) : (m[1] === 'הקדמה' ? 0 : 1);
      tokens.push(mkToken('heading', { level, text: m[4] || m[0], raw: line }));
      continue;
    }
    // **D-40 (תיקון P1-5):** הבחנה ממוספר/מחלקה — בעבר כל שורה "הערת סיום - X"
    // פוענחה כהערת תוכן, וכותרת המחלקה ("הערות סיום") נהפכה להערה פיקטיבית
    // ונותרה כשורה זרה בגוף הטקסט. כעת: ממוספרת ⇒ {num, text}; מחלקה ⇒ הוראה
    // (directive) המגדירה את כותרת עמודי ההערות של החלק — לא תוכן, לא גוף.
    const mNum = line.match(ENDNOTE_NUMBERED);
    if (mNum) {
      tokens.push(mkToken('endnote', { num: Number(mNum[1]), text: mNum[2].trim(), raw: line }));
      continue;
    }
    if (ENDNOTE_CLASS.test(line) && !/\d/.test(line.slice(0, 14))) {
      tokens.push(mkToken('endnote-class', { title: line.match(ENDNOTE_CLASS)[1].trim(), raw: line }));
      continue;
    }
    if (ENDNOTE_PREFIX.test(line)) {
      tokens.push(mkToken('endnote', { text: line.replace(ENDNOTE_PREFIX, '').trim(), raw: line }));
      continue;
    }
    // editorial ##…## — הסרה מלאה (נרשם; לעולם לא נגלה בפלט — Spec §7)
    const editorial = line.match(/##(.+?)##/g);
    if (editorial) {
      for (const e of editorial) tokens.push(mkToken('editorial', { text: e.slice(2, -2), removed: true }));
      line = line.replace(/##.+?##/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line) continue;
    }

    // חילוץ הערות [..] עם מחסנית; זוגות רצופים → הערות נפרדות
    const segs = scanBrackets([{ text: line, paraIndex: tokens.length }]);
    let cursor = 0;
    const parts = [];
    const notes = [];
    // בנייה לפי pairs משמאל לימין (outermost first)
    const outer = segs.pairs.filter(p => p.depth === 1).sort((a, b) => a.open - b.open); // חיצוניים בלבד (depth 1)
    for (const p of outer) {
      const before = line.slice(cursor, p.open).trim();
      if (before) parts.push({ kind: 'text', value: before });
      const noteText = line.slice(p.open + 1, p.close).trim().replace(/ +/g, ATOMIC_SPACE);
      notes.push(noteText);
      parts.push({ kind: 'note-ref', noteIndex: notes.length - 1 });
      cursor = p.close + 1;
    }
    const tail = line.slice(cursor).trim();
    if (tail) parts.push({ kind: 'text', value: tail });

    tokens.push(mkToken('paragraph', { parts, notes, unmatchedClosers: segs.unmatchedClosers, raw: line }));
  }
  return tokens;
}

/** CP1: hash של מולטיסט הטוקנים — עקרון שימור תוכן (BRZ-15). */
function contentHash(tokens) {
  const stable = JSON.stringify(tokens.flatMap(t => {
    if (t.type === 'paragraph') return [['P', ...t.parts.map(p => p.kind === 'text' ? p.value : `⟦${t.notes[p.noteIndex]}⟧`), String(t.notes.length)]];
    if (t.type === 'heading') return [['H', String(t.level), t.text]];
    if (t.type === 'endnote') return [['EN', String(t.num || ''), t.text]];
    if (t.type === 'endnote-class') return []; // directive — לא תוכן (D-40)
    return [];
  }));
  return crypto.createHash('sha256').update(stable, 'utf8').digest('hex');
}

module.exports = { tokenize, contentHash, normalizeText, ATOMIC_SPACE };

};
__modules["src/engine/parser/bracket-scanner.js"] = function (require, module, exports) {
// src/engine/parser/bracket-scanner.js — Balanced stack scanner for [...] footnotes (REQ-PAR-02, REQ-PAR-ST-01)
'use strict';

/**
 * Close form registry: every accepted closing spelling of a footnote bracket.
 * Keyed by the FIRST character of the closer; `len` = characters consumed in the source text.
 *   ']'      → plain ASCII closer                     (len 1)
 *   ']' + U+05DD → Hebrew-style "‏]ם" closer          (len 2)
 * Openers are always '['. Matching is done against this table so future
 * historical variants (e.g. gershayim-closers) can be added without touching the loop.
 */
const CLOSER_FORMS = [
  { first: ']', len: 1, name: 'ascii' },
  { first: ']', len: 2, next: '\u05DD', name: 'hebrew-mem-sofit' },
];

/**
 * Return the closer form matching at text[i], or null.
 * Deterministic longest-match: we scan the whole registry, keep every form
 * whose characters actually match at position i, and return the one consuming
 * the most characters. Registry order can never change the outcome.
 */
function matchCloser(text, i) {
  let best = null;
  for (const f of CLOSER_FORMS) {
    if (text[i] !== f.first) continue;
    // Verify all trailing characters declared by the form (if any).
    let ok = true;
    if (f.next !== undefined) {
      const lastIdx = i + f.len - 1;
      ok = lastIdx < text.length && text[lastIdx] === f.next;
    }
    if (ok && (!best || f.len > best.len)) best = f;
  }
  return best;
}

/**
 * Stack scanner: detects `[...]` pairs including nesting, ranges spanning
 * paragraphs/columns/pages, and depth at every position. Unmatched closers and
 * openers are REPORTED, never auto-fixed (source-fidelity doctrine).
 *
 * @param {Array<{text:string, paraIndex:number}>} segments - text runs tagged with paragraph index
 * @returns {{pairs:Array, unmatchedClosers:Array, unmatchedOpeners:Array, depthAt:(pos)=>number, scopeMap:Object}}
 */
function scanBrackets(segments) {
  const stack = [];
  const pairs = [];
  const unmatchedClosers = [];
  const depthMarks = []; // {pos, depth} sampled after processing each consumed char-run
  let globalPos = 0;

  for (const seg of segments) {
    const text = seg.text;
    const para = Number.isInteger(seg.paraIndex) ? seg.paraIndex : 0;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      const gp = globalPos + i;
      if (ch === '[') {
        stack.push({ openPos: gp, para });
        depthMarks.push({ pos: gp, depth: stack.length });
        i += 1;
      } else {
        const form = matchCloser(text, i);
        if (!form) {
          depthMarks.push({ pos: gp, depth: stack.length });
          i += 1;
        } else if (stack.length === 0) {
          // Doctrine: report, never silently repair. Extra chars of the closer
          // are still consumed so positions stay consistent for downstream mappers.
          unmatchedClosers.push({
            pos: gp,
            end: gp + form.len - 1,
            para,
            form: form.name,
            note: 'דורש אימות מול מקור — אין לתקן אוטומטית'
          });
          depthMarks.push({ pos: gp, depth: 0 });
          i += form.len;
        } else {
          const o = stack.pop();
          pairs.push({
            open: o.openPos,
            close: gp + form.len - 1, // last character of the closer
            depth: stack.length + 1,  // 1 = outermost pair (matches block-tokenizer convention)
            startPara: o.para,
            endPara: para,
            crossParagraph: o.para !== para,
            closerForm: form.name
          });
          depthMarks.push({ pos: gp, depth: stack.length });
          i += form.len;
        }
      }
    }
    globalPos += text.length;
  }

  // Unclosed openers are reported too (same doctrine: flag, don't fix).
  const unmatchedOpeners = stack.map(o => ({
    pos: o.openPos,
    para: o.para,
    note: 'פותח ללא סוגר — דורש אימות מול מקור'
  }));

  return {
    pairs,
    unmatchedClosers,
    unmatchedOpeners,
    /** Nesting depth active at a global position (0 = outside any note). */
    depthAt(pos) {
      let best = 0;
      for (const m of depthMarks) if (m.pos <= pos) best = m.depth; else break;
      return best;
    },
    scopeMap: {
      totalPairs: pairs.length,
      crossParagraphCount: pairs.filter(p => p.crossParagraph).length,
      hebrewClosers: pairs.filter(p => p.closerForm === 'hebrew-mem-sofit').length
    }
  };
}

module.exports = { scanBrackets, matchCloser, CLOSER_FORMS };

};
__modules["src/engine/typography/measure-api.js"] = function (require, module, exports) {
// src/engine/typography/measure-api.js — Measurement single entry (REQ-LB-01) + Hebrew glyph-width metrics
'use strict';

/**
 * MeasureAPI — הכניסה היחידה למדידת רוחב/גובה. אסור לקרוא offsetHeight מפוזר (lint ב‑CI).
 * מימוש A = 'table' (טבלאות מכוילות — ברירת המחדל, המשך רציפות S1–S11);
 * מימוש B = 'font-metrics' (S12: טבלאות אמת מקובץ גופן שנטען — hmtx/cmap/kern/GPOS)
 * חתימה זהה; הפרופיל נרשם דרך registerFont ומופעל דרך ההגדרה measure-impl.
 */

const { charWidthEm, FONT_PROFILES } = require('./measure-table');
const fm = require('./font-metrics');

const DEFAULT_TRACKING = 0.02; // em

/** גופנים רשומים (פרופיל → פרנסר). ההרשמה מפורשת — אין טעינת רשת (offline). */
const registeredFonts = new Map();

/**
 * רישום גופן למדידת אמת (S12.1-5). קלט: בתים בלבד (Uint8Array/Buffer).
 * @returns {{ok:boolean, error?:string, profile?:object, glyphCount?:number, mappedChars?:number}}
 */
function registerFont(profileName, bytes) {
  const res = fm.parseFont(bytes);
  if (!res.ok) return { ok: false, error: res.error };
  registeredFonts.set(String(profileName), res.font);
  return { ok: true, profile: res.font, glyphCount: res.font.numGlyphs, mappedChars: res.font.charToGlyph.size };
}

/** הסרת גופן רשום (בדיקות). */
function unregisterFont(profileName) { registeredFonts.delete(String(profileName)); }
function clearRegisteredFonts() { registeredFonts.clear(); }

class MeasureAPI {
  constructor(settings, impl = 'table') {
    this.settings = settings;
    this.impl = impl === 'font-metrics' ? 'font-metrics' : 'table'; // 'table' | 'font-metrics'
    this.fontProfileName = null;
    this.fontProfile = null;
    this.fontFactor = 1;
    this.cache = new Map();
    this.stats = { calls: 0, hits: 0, fontFallbacks: 0 };
    if (this.impl === 'font-metrics') this._bindProfile();
  }

  /** קשירת פרופיל הגופן לפי שם הגופן בהגדרות; fallback שקוף לטבלה אם לא נרשם. */
  _bindProfile() {
    const name = this.settings['body-font'];
    if (name && registeredFonts.has(name)) {
      this.fontProfileName = name;
      this.fontProfile = registeredFonts.get(name);
      this.fontFactor = FONT_PROFILES[name] || 1;
    } else {
      // לא נרשם גופן — מימוש B נופל בשקיפות לטבלה (מדידה עקבית, לא כשל שקט)
      this.impl = 'table';
      this.stats.fontFallbacks++;
    }
  }

  _fontSpec(sizePt) {
    return sizePt || this.settings['body-font-size-pt'];
  }

  /** רוחב תו בודד ב־em לפי המימוש. */
  _charEm(ch) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const units = fm.advanceUnitsOf(this.fontProfile, ch);
      if (units !== 0) return (units / this.fontProfile.unitsPerEm) * this.fontFactor;
      // 0 ללא מיפוי ⇒ fallback מכויל (גם ניקוד אמיתי=0 ייפול לסלולר 0.5 — זניח לרוחב)
      this.stats.fontFallbacks++;
      return charWidthEm(ch);
    }
    return charWidthEm(ch);
  }

  /** קרנינג בין תווים סמוכים ב־em (מימוש A: 0 תמיד — כמו S1–S11). */
  _kernEm(a, b) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const k = fm.kernUnitsOf(this.fontProfile, a, b);
      if (k !== 0) return (k / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0;
  }

  /**
   * רוחב טקסט ב‑px. מימוש B כולל קרנינג בר־מילה (hmtx + kern/GPOS) —
   * ההבדל היחיד מ־A בנוסף לרוחבי הגליפים עצמם.
   */
  measureTextWidth(text, sizePt = null, trackingEm = DEFAULT_TRACKING) {
    const size = this._fontSpec(sizePt);
    const key = `${this.impl}|${this.fontProfileName || ''}|${size}|${trackingEm}|${text}`;
    this.stats.calls++;
    if (this.cache.has(key)) { this.stats.hits++; return this.cache.get(key); }
    const str = String(text);
    let w = 0;
    let prev = null;
    for (const ch of str) {
      if (prev !== null) w += this._kernEm(prev, ch);
      w += this._charEm(ch) + trackingEm;
      prev = ch;
    }
    const px = Math.max(0, w * size * (96 / 72)); // pt→px
    this.cache.set(key, px);
    return px;
  }

  /**
   * **S12.1-6 — cap-height מטבלאות אמת** (OS/2 sCapHeight; נפילה: ascender×0.7).
   * משמש את יישור המילה הראשונה (dropword) במקום הקירוב הקבוע.
   */
  capHeightEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return fm.capHeightEmOf(this.fontProfile) * this.fontFactor;
    }
    return 0.7; // הקירוב ההיסטורי (תיעוד dropword CSS)
  }

  /** **S12 (parity גיאומטרי):** ascent/descent ב־em — מפרופיל הגופן (hhea)
   * כשנטען, אחרת הפרופיל המכויל (0.80/0.20 — תואם קו הבסיס ההיסטורי). */
  ascentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return (this.fontProfile.ascender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.80;
  }
  descentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return Math.abs(this.fontProfile.descender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.20;
  }

  /** שורת "גובה" אחידה (baseline grid): fontSize × lineHeight (BRZ-2). */
  lineHeightPx(sizePt = null) {
    const size = this._fontSpec(sizePt);
    return Math.round(size * (96 / 72) * this.settings['body-line-height']);
  }

  /**
   * מיקום שורות אופטימלי (KP) → מערך שורות עם רוחבים.
   * @param {Function} [measureOverride] - הזרקת פונקציית מדידה (למשל פרופיל רוחב־גופן מהpipeline) — L1: entry יחיד דרך ההזרקה.
   * @returns {Array<{words:string[], widthPx:number, badness:number}>}
   */
  layoutLines(words, maxWidthPx, sizePt = null, opts = {}, measureOverride = null) {
    const knuth = require('./kp-linebreak');
    const measure = measureOverride || ((t) => this.measureTextWidth(t, sizePt));
    return knuth.breakLines(words, maxWidthPx, measure, this.lineHeightPx(sizePt), opts);
  }

  cacheStats() { return { ...this.stats, hitRate: this.stats.calls ? this.stats.hits / this.stats.calls : 0 }; }
}

module.exports = {
  MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts,
  charWidthEm, registeredFonts
};

};
__modules["src/engine/typography/measure-table.js"] = function (require, module, exports) {
// src/engine/typography/measure-table.js — טבלאות רוחב מכוילות (מקור יחיד; S12 הפרדה מ־measure-api)
'use strict';

/**
 * טבלת רוחות אותיות עברית (יחסיים ל‑em, קירוב Frank-Ruhl/David) — הפרופיל
 * המכויל של מימוש A (ברירת המחדל). הפרופילים הללו משמשים גם כ־fallback
 * למימוש B (font-metrics) לתווים לא־ממופים בגופן שנטען.
 */

const HEBREW_WIDTHS = {
  'א': 0.66, 'ב': 0.58, 'ג': 0.56, 'ד': 0.62, 'ה': 0.60, 'ו': 0.42, 'ז': 0.44, 'ח': 0.70, 'ט': 0.60,
  'י': 0.32, 'כ': 0.58, 'ך': 0.58, 'ל': 0.52, 'מ': 0.70, 'ם': 0.72, 'נ': 0.60, 'ן': 0.60, 'ס': 0.62,
  'ע': 0.62, 'פ': 0.60, 'ף': 0.62, 'צ': 0.62, 'ץ': 0.64, 'ק': 0.64, 'ר': 0.52, 'ש': 0.66, 'ת': 0.60
};
const WIDE_MARKS = { ' ': 0.26, '\uE000': 0.26, '.': 0.24, ',': 0.24, ';': 0.24, ':': 0.24, '-': 0.34, '–': 0.5, '"': 0.28, "'": 0.16, '“': 0.4, '”': 0.4, '״': 0.36, '׳': 0.18, '[': 0.3, ']': 0.3, '(': 0.3, ')': 0.3 };

/** פרופילי רוחב לפי שם גופן (fontFactor מתוקן ב־endnote-pages; כאן — רוחב בסיס). */
const FONT_PROFILES = {
  'David HB': 1.00, 'David': 1.00, 'Frank Ruhl Libre': 1.00,
  'Narkisim': 1.05, 'Nachlieli': 0.96, 'Alef': 1.00, 'Rubin': 1.03,
  'DejaVu Sans': 1.00, 'DejaVu Serif': 1.00
};

function charWidthEm(ch) {
  if (HEBREW_WIDTHS[ch] !== undefined) return HEBREW_WIDTHS[ch];
  // **תיקון שורש (ביקורת 03.11): בדיקת WIDE_MARKS לפני סל העברי — בעבר הסל
  // 0x0590–0x05FF (=0.5em) לכד את ׳(U+05F3) ו״(U+05F4) לפני שנבדקו ב-WIDE_MARKS
  // (0.18em/0.36em) ⇒ הגדרות מתות וגרשיים נמדדו 0.5em; impl B (פיקסטשור, שנבנה
  // מ-WIDE_MARKS) מדד אותם נכון — והפער בין המימושים הוסט את שבירות ה-DP.
  if (WIDE_MARKS[ch] !== undefined) return WIDE_MARKS[ch];
  const c = ch.codePointAt(0);
  if (c >= 0x0590 && c <= 0x05FF) return 0.5;   // ניקוד/תווים עבריים נוספים
  if (/[A-Za-z0-9]/.test(ch)) return 0.52;
  return 0.4;
}

module.exports = { HEBREW_WIDTHS, WIDE_MARKS, FONT_PROFILES, charWidthEm };

};
__modules["src/engine/typography/font-metrics.js"] = function (require, module, exports) {
// src/engine/typography/font-metrics.js — TrueType/OpenType metrics parser (S12.1-5, REQ-LB-01 impl B)
'use strict';

/**
 * **שכבת המדידה המתמטית (מימוש B):** קריאת טבלאות אמת מקובץ גופן אמיתי —
 * רוחבי גליפים (hmtx/hhea/cmap), קרנינג (kern fmt0 + GPOS PairPos fmt1),
 * unitsPerEm (head), cap-height (OS/2 v≥2; נפילה ל־hhea.ascender×0.7), וזיהוי
 * סימנים מאפסי־רוחב (ניקוד — advance=0) לפי המפה עצמה.
 *
 * עצמאי לחלוטין: אין תלות חיצונית (HarfBuzz-WASM/fontkit אינם נדרשים —
 * אותה מטרה, טבלאות אמת, אפס תלות זרה; דוקטרינת הריפו). הפרנסר נבדק
 * מול אורקל צולב (fontTools) על גופן אמיתי (DejaVu) — ערכי האמת נעולים בבדיקות.
 *
 * דטרמיניזם: קריאה בלבד; אין Date/Math.random; סדר קבוע.
 */

const MAX_TABLES = 64;
const MAX_SEGMENTS = 8192; // cmap fmt4 הגנת שפיות
const MAX_GPOS_PAIRSETS = 4096;

function u8(b, o) { return b[o]; }
function u16(b, o) { return (b[o] << 8) | b[o + 1]; }
function s16(b, o) { const v = u16(b, o); return v >= 0x8000 ? v - 0x10000 : v; }
function u32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
function tag(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); }

/**
 * @param {Uint8Array|Buffer} bytes — בתי הגופן (TTF/OTF sfnt)
 * @returns {{ok:boolean, error?:string, font?:object}}
 */
function parseFont(bytes) {
  if (!bytes || bytes.length < 12) return { ok: false, error: 'too-small' };
  const b = bytes;
  const sfntVersion = u32(b, 0);
  if (sfntVersion !== 0x00010000 && sfntVersion !== 0x4F54544F /* 'OTTO' */ && sfntVersion !== 0x74746366 /* 'ttcf' */) {
    return { ok: false, error: `bad-sfnt-version:0x${sfntVersion.toString(16)}` };
  }
  if (sfntVersion === 0x74746366) return { ok: false, error: 'ttcf-collections-unsupported' };
  const numTables = u16(b, 4);
  if (numTables === 0 || numTables > MAX_TABLES) return { ok: false, error: `bad-table-count:${numTables}` };

  // תוכן העניינים של sfnt
  const tables = new Map(); // tag → {offset, length}
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (rec + 16 > b.length) return { ok: false, error: 'table-dir-truncated' };
    const t = tag(b, rec);
    const off = u32(b, rec + 8);
    const len = u32(b, rec + 12);
    if (off + len > b.length) return { ok: false, error: `table-out-of-range:${t}` };
    tables.set(t, { offset: off, length: len });
  }
  const need = ['head', 'maxp', 'hhea', 'hmtx', 'cmap'];
  for (const t of need) if (!tables.has(t)) return { ok: false, error: `missing-table:${t}` };

  // head: unitsPerEm + indexToLocFormat
  const hO = tables.get('head').offset;
  const unitsPerEm = u16(b, hO + 18);
  if (!(unitsPerEm >= 16 && unitsPerEm <= 16384)) return { ok: false, error: `bad-units-per-em:${unitsPerEm}` };
  const indexToLocFormat = s16(b, hO + 50);

  // maxp: numGlyphs
  const numGlyphs = u16(b, tables.get('maxp').offset + 4);
  if (numGlyphs === 0) return { ok: false, error: 'bad-num-glyphs:0' };

  // hhea: numberOfHMetrics + ascender/descender/lineGap
  const hhO = tables.get('hhea').offset;
  const numberOfHMetrics = u16(b, hhO + 34);
  const ascender = s16(b, hhO + 4);
  const descender = s16(b, hhO + 6);
  const lineGap = s16(b, hhO + 8);
  if (numberOfHMetrics === 0 || numberOfHMetrics > numGlyphs) return { ok: false, error: `bad-hmtx-count:${numberOfHMetrics}` };

  // hmtx: advance widths (+lsb)
  const hmO = tables.get('hmtx').offset;
  const advanceUnits = new Uint16Array(numGlyphs);
  for (let g = 0; g < numGlyphs; g++) {
    if (g < numberOfHMetrics) advanceUnits[g] = u16(b, hmO + g * 4);
    else advanceUnits[g] = advanceUnits[numberOfHMetrics - 1];
  }

  // cmap: Unicode → glyph (fmt 4 BMP + fmt 12 full)
  const charToGlyph = new Map();
  const cmErr = parseCmap(b, tables.get('cmap').offset, charToGlyph);
  if (cmErr) return { ok: false, error: `cmap:${cmErr}` };

  // OS/2 (אופציונלי): sCapHeight (v≥2, offset 88)
  let capHeight = null;
  if (tables.has('OS/2')) {
    const osO = tables.get('OS/2').offset;
    if (tables.get('OS/2').length >= 90) {
      const osVer = u16(b, osO);
      const cap = s16(b, osO + 88);
      if (osVer >= 2 && cap > 0) capHeight = cap;
    }
  }

  // kern fmt0 (אופציונלי) + GPOS PairPos fmt1 (אופציונלי) — מפות קרנינג בר־מילה (units)
  const kernPairs = new Map(); // "gidA,gidB" → units
  if (tables.has('kern')) parseKernFmt0(b, tables.get('kern').offset, tables.get('kern').length, kernPairs);
  if (tables.has('GPOS')) parseGposPairPos(b, tables.get('GPOS').offset, tables.get('GPOS').length, kernPairs);

  const font = {
    sfntVersion, unitsPerEm, numGlyphs, indexToLocFormat,
    numberOfHMetrics, ascender, descender, lineGap, capHeight,
    advanceUnits, charToGlyph, kernPairs,
    tables: Object.fromEntries([...tables.entries()].map(([t, v]) => [t, { ...v }])),
    bytes: b
  };
  return { ok: true, font };
}

/** cmap subtable parsing — fmt 4 (BMP) ו־fmt 12 (full); מדגים גם fmt 6 (מינימלי). */
function parseCmap(b, base, charToGlyph) {
  const numSub = u16(b, base + 2);
  if (numSub > 64) return `too-many-subtables:${numSub}`;
  let best4 = -1, best12 = -1;
  for (let i = 0; i < numSub; i++) {
    const rec = base + 4 + i * 8;
    const platform = u16(b, rec);
    const encoding = u16(b, rec + 2);
    const off = u32(b, rec + 4);
    const fmt = u16(b, base + off);
    const unicodeish = (platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0;
    if (!unicodeish) continue;
    if (fmt === 4 && best4 < 0) best4 = base + off;
    if (fmt === 12 && best12 < 0) best12 = base + off;
  }
  if (best12 >= 0) {
    const e = parseCmap12(b, best12, charToGlyph);
    if (e) return e;
  }
  if (best4 >= 0) {
    const e = parseCmap4(b, best4, charToGlyph);
    if (e) return e;
  }
  if (charToGlyph.size === 0) return 'no-unicode-subtable';
  return null;
}

function parseCmap4(b, off, charToGlyph) {
  if (off + 14 > b.length) return 'fmt4-truncated';
  const segCountX2 = u16(b, off + 6);
  const segCount = segCountX2 / 2;
  if (segCount === 0 || segCount > MAX_SEGMENTS) return `fmt4-bad-segcount:${segCount}`;
  const endBase = off + 14;
  const startBase = endBase + segCountX2 + 2;
  const deltaBase = startBase + segCountX2;
  const rangeBase = deltaBase + segCountX2;
  if (rangeBase + segCountX2 > b.length) return 'fmt4-truncated-tables';
  for (let i = 0; i < segCount; i++) {
    const end = u16(b, endBase + i * 2);
    const start = u16(b, startBase + i * 2);
    const delta = s16(b, deltaBase + i * 2);
    const rangeOff = u16(b, rangeBase + i * 2);
    if (start > end) continue;
    if (end - start > 0xFFFF) continue; // הגנה
    for (let c = start; c <= end; c++) {
      let gid;
      if (rangeOff === 0) {
        gid = (c + delta) & 0xFFFF;
      } else {
        const gidPos = rangeBase + i * 2 + rangeOff + (c - start) * 2;
        if (gidPos + 2 > b.length) return 'fmt4-gid-out-of-range';
        gid = u16(b, gidPos);
        if (gid !== 0) gid = (gid + delta) & 0xFFFF;
      }
      if (gid !== 0 && !charToGlyph.has(c)) charToGlyph.set(c, gid);
    }
  }
  return null;
}

function parseCmap12(b, off, charToGlyph) {
  if (off + 16 > b.length) return 'fmt12-truncated';
  const nGroups = u32(b, off + 12);
  if (nGroups > 65536) return `fmt12-bad-groups:${nGroups}`;
  for (let i = 0; i < nGroups; i++) {
    const rec = off + 16 + i * 12;
    if (rec + 12 > b.length) return 'fmt12-truncated-groups';
    const start = u32(b, rec), end = u32(b, rec + 4), gid = u32(b, rec + 8);
    if (end < start || end - start > 0x10FFFF) continue;
    for (let c = start; c <= end; c++) {
      const g = gid + (c - start);
      if (g !== 0 && !charToGlyph.has(c)) charToGlyph.set(c, g);
    }
  }
  return null;
}

/** kern table — מטפל רק בפורמט 0 (subtable version 0); שאר הפורמטים נדלגים בשקיפות. */
function parseKernFmt0(b, off, len, kernPairs) {
  if (off + 4 > b.length) return;
  const nTables = u16(b, off + 2);
  let p = off + 4;
  for (let i = 0; i < nTables && p + 6 <= b.length; i++) {
    const version = u16(b, p);
    const length = u16(b, p + 2);
    const coverage = u16(b, p + 4);
    const format = coverage >> 8;
    if (format === 0 && version === 0 && p + 14 <= b.length) {
      const nPairs = u16(b, p + 6);
      if (nPairs <= MAX_GPOS_PAIRSETS) {
        for (let k = 0; k < nPairs; k++) {
          const rec = p + 14 + k * 6;
          if (rec + 6 > b.length || rec >= off + len) break;
          const left = u16(b, rec), right = u16(b, rec + 2), value = s16(b, rec + 4);
          if (value !== 0) kernPairs.set(`${left},${right}`, value);
        }
      }
    }
    if (length === 0) break;
    p += length;
  }
}

/**
 * GPOS (v1.0) — נתיב מינימלי אמין: LookupList → Lookup type 2 (PairPos) format 1,
 * ValueFormat1=XAdvance בלבד (0x0004), Coverage fmt 1/2. שאר הסוגים נדלגים בשקיפות
 * (רשומים בדגל). זה מכסה את משפחת הקרנינג הסטנדרטית (GSUB לא נדרש למדידת רוחב).
 */
function parseGposPairPos(b, off, len, kernPairs) {
  if (off + 10 > b.length) return;
  const ver = u32(b, off);
  if (ver !== 0x00010000) return;
  const lookupListOff = u16(b, off + 8);
  const ll = off + lookupListOff;
  if (ll + 2 > b.length) return;
  const lookups = u16(b, ll);
  if (lookups > 256) return;
  for (let i = 0; i < lookups; i++) {
    const lOff = ll + u16(b, ll + 2 + i * 2);
    if (lOff + 8 > b.length) continue;
    const type = u16(b, lOff);
    if (type !== 2) continue; // PairPos בלבד
    const subCount = u16(b, lOff + 4);
    if (subCount > 64) continue;
    for (let s = 0; s < subCount; s++) {
      const sOff = lOff + u16(b, lOff + 6 + s * 2);
      parsePairPosSubtable(b, sOff, kernPairs);
    }
  }
}

function parsePairPosSubtable(b, off, kernPairs) {
  if (off + 10 > b.length) return;
  const fmt = u16(b, off);
  if (fmt !== 1) return; // format 2 (matrix) — נדלג (נדיר בקרנינג לטיני/עברי)
  const covOff = u16(b, off + 2);
  const vf1 = u16(b, off + 4);
  const vf2 = u16(b, off + 6);
  const setCount = u16(b, off + 8);
  if (setCount > MAX_GPOS_PAIRSETS) return;
  if (vf1 !== 0x0004 || vf2 !== 0) return; // XAdvance בלבד — חוזה הקרנינג שלנו
  const covGids = coverageGlyphs(b, off + covOff);
  if (!covGids) return;
  for (let i = 0; i < setCount && i < covGids.length; i++) {
    const left = covGids[i];
    const psOff = off + u16(b, off + 10 + i * 2);
    if (psOff + 2 > b.length) continue;
    const pvCount = u16(b, psOff);
    if (pvCount > MAX_GPOS_PAIRSETS) continue;
    for (let k = 0; k < pvCount; k++) {
      const rec = psOff + 2 + k * 6; // gid2(2) + value1 XAdvance(2) + value2(2 — ריק כי vf2=0)
      if (rec + 6 > b.length) break;
      const right = u16(b, rec);
      const xAdv = s16(b, rec + 2);
      if (xAdv !== 0) kernPairs.set(`${left},${right}`, xAdv);
    }
  }
}

/** Coverage table fmt 1/2 → מערך gid-ים לפי אינדקס. */
function coverageGlyphs(b, off) {
  if (off + 4 > b.length) return null;
  const fmt = u16(b, off);
  const out = [];
  if (fmt === 1) {
    const count = u16(b, off + 2);
    if (count > MAX_GPOS_PAIRSETS) return null;
    for (let i = 0; i < count; i++) {
      if (off + 4 + i * 2 + 2 > b.length) return null;
      out.push(u16(b, off + 4 + i * 2));
    }
    return out;
  }
  if (fmt === 2) {
    const ranges = u16(b, off + 2);
    if (ranges > 4096) return null;
    for (let i = 0; i < ranges; i++) {
      const rec = off + 4 + i * 6;
      if (rec + 6 > b.length) return null;
      const start = u16(b, rec), end = u16(b, rec + 2), startCov = u16(b, rec + 4);
      if (end < start || end - start > 0xFFFF) continue;
      for (let g = start; g <= end; g++) out[g - start + startCov] = g;
    }
    // מלא חורים (undefined) ב־-1 — סימון לא־קיים
    for (let i = 0; i < out.length; i++) if (out[i] === undefined) out[i] = -1;
    return out;
  }
  return null;
}

// ============ שכבת שאילתות (המידע שמעניין את המדידה) ============

/** מזהה גליף של תו (או 0 = .notdef). */
function glyphIdOf(font, ch) {
  const cp = typeof ch === 'number' ? ch : ch.codePointAt(0);
  const g = font.charToGlyph.get(cp);
  return g === undefined ? 0 : g;
}

/** רוחב advance ביחידות גופן (0 ללא מיפוי). */
function advanceUnitsOf(font, ch) {
  const g = glyphIdOf(font, ch);
  if (g === 0 || g >= font.numGlyphs) return 0;
  return font.advanceUnits[g];
}

/** רוחב advance ב־em (יחסי ל־unitsPerEm). */
function advanceEmOf(font, ch) {
  return advanceUnitsOf(font, ch) / font.unitsPerEm;
}

/** קרנינג בין שני תווים ביחידות גופן (0 כשאין ערך/מיפוי). */
function kernUnitsOf(font, a, b) {
  const ga = glyphIdOf(font, a), gb = glyphIdOf(font, b);
  if (ga === 0 || gb === 0) return 0;
  const v = font.kernPairs.get(`${ga},${gb}`);
  return v === undefined ? 0 : v;
}

/** cap-height ב־em (מטבלת OS/2 אמיתית; נפילה: ascender×0.7 — קירוב ספרות מוכר). */
function capHeightEmOf(font) {
  if (font.capHeight != null) return font.capHeight / font.unitsPerEm;
  return (font.ascender / font.unitsPerEm) * 0.7;
}

/** האם תו הוא סימן מאפס־רוחב (ניקוד/טעמים): ממופה עם advance=0. */
function isZeroAdvanceMark(font, ch) {
  const g = glyphIdOf(font, ch);
  return g !== 0 && font.advanceUnits[g] === 0;
}

module.exports = {
  parseFont, glyphIdOf, advanceUnitsOf, advanceEmOf, kernUnitsOf,
  capHeightEmOf, isZeroAdvanceMark
};

};
__modules["src/engine/typography/kp-linebreak.js"] = function (require, module, exports) {
// src/engine/typography/kp-linebreak.js — Knuth-Plass optimal line breaking (REQ-LB-02/03/07)
'use strict';

/**
 * מימוש KP: boxes/glues/penalties, badness³, עונשי runt/widow/orphan, active-list DP.
 * - אין מקף סוף־שורה (no hyphenation — אסור בספרות תורנית).
 * - \u00A0 = צמידת NBSP (protectors); \uE000 = רווח אטומי בתוך הערה — ההערה אינה נקרעת (REQ-LB-04).
 * - RTL מדידה: rect.right − colRect.left (לקח Z.ai #5) — מתמטי כאן; DOM oracle יזהה.
 */

const INF = Number.POSITIVE_INFINITY;
const STRETCH_RATIO = 0.6;   // מתיחות רווח יחסית
const SHRINK_RATIO = 0.5;    // כיווץ רווח יחסית
const LINE_DEMERIT = 100;    // עלות בסיס לכל שורה: ברירת מחדל במודל ragged — ה־DP
                            // ממזער מספר שורות (הרינדור מצייר מרווחים טבעיים).
// השלמת ביקורת 03.11 (D-79): הרינדור של המנוע ragged (יישור לימין; מרווחים
// טבעיים ב-DOM וב-PDF). לכן במודל השבירה כל שורה מקבלת "מתיחת סוף-שורה"
// כמו \raggedright של TeX — אחרת שורה במילה בודדת (stretch=0 ⇒ ratio=0)
// היא "חינם" וה־DP מתפוצץ לשורות מילה-בודדת. כשהשורות מיושרות בפועל
// (align=stretch) ניתן לכבות: opts.raggedEnd=false.
const RAGGED_END_STRETCH_FACTOR = 10; // × maxWidthPx — מתיחה גדולה סופית-מעשית

function buildItems(words, measure) {
  const items = [];
  const sp = measure(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // יחידת NBSP פוצלת לתת־קופסאות עם **אי־שבירה אסורה** (INF penalty) ביניהן:
    // כך DP רואה את הרוחב האמיתי (כולל רווחים פנימיים) אך לעולם לא קורע את הצמד.
    // (לקח V23: רוחב חסר של unit צמוד → מדידת שורה שגויה → badness מוטה.)
    // U+E000 (רווח אטומי בתוך הערה) אינו מקום שבירה כלל — נשמר בתוך תת־הקופסה
    // ומוחלף ל‑NBSP רק בפליטה; כך unit שלם לעולם לא נקרע (REQ-LB-04).
    const parts = w.split('\u00A0');
    for (let k = 0; k < parts.length; k++) {
      if (k > 0) items.push({ kind: 'penalty', forbidden: true, cost: INF });
      items.push({ kind: 'box', text: parts[k].replace(/\uE000/g, '\u00A0'), width: Math.max(1, measure(parts[k])) });
      if (k < parts.length - 1) items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO, internal: true });
    }
    if (i < words.length - 1) {
      items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO });
    }
  }
  items.push({ kind: 'penalty', final: true }); // סיום פסקה — שבירה חובה
  return items;
}

function badness(ratio) {
  if (!isFinite(ratio)) return 0;
  if (ratio < -1) return INF;               // אי־אפשר לכווץ מעל הגבול
  const r = Math.abs(ratio);
  if (r <= 1) return Math.round(Math.pow(r * 100, 3) / 10000); // 0..100
  return 100 + Math.round(Math.pow((r - 1) * 100, 2) / 100);   // דחיסה/מתיחת יתר
}

/**
 * @param {string[]} words - מילות הפסקה (NBSP כבר הוצמד ע"י protectors)
 * @param {number} maxWidthPx
 * @param {(t:string)=>number} measure
 * @param {number} lineHeightPx
 * @param {{runtMinPct?:number}} opts
 * @returns {Array<{words:string[], widthPx:number, heightPx:number, isLast:boolean}>}
 */
function breakLines(words, maxWidthPx, measure, lineHeightPx, opts = {}) {
  const runts = opts.runtMinPct != null ? opts.runtMinPct : 50;
  const items = buildItems(words, measure);
  const n = items.length;
  const cost = new Array(n + 1).fill(INF);
  const parent = new Array(n + 1).fill(-1);
  cost[0] = 0;

  for (let i = 0; i < n; i++) {
    if (cost[i] === INF) continue;
    if (items[i].kind === 'glue' && !items[i].internal) { // דלג על glue רגיל בהתחלת שורה;
      // glue פנימי (בתוך יחידת NBSP) אסור לדלג — הרוחב שלו חלק בלתי נפרד מהצמד.
      if (cost[i + 1] > cost[i]) { cost[i + 1] = cost[i]; parent[i + 1] = i; }
      continue;
    }
    let w = 0, stretch = 0, shrink = 0;
    for (let j = i; j < n; j++) {
      const it = items[j];
      if (it.kind === 'box') w += it.width;
      // **תיקון שורש (ביקורת 03.11): רוחב glue נכלל ברוחב הטבעי של השורה —
      // כמו ב-TeX (Σ תיבות + Σ רווחים). בעבר נצברו רק stretch/shrink ⇒ ה־DP
      // "חשב" ששורה נכנסת בעוד רוחבה הטבעי (כולל רווחים) חורג מהטור.
      else if (it.kind === 'glue') { w += it.width; stretch += it.stretch; shrink += it.shrink; }
      else if (it.kind === 'penalty') {
        if (it.forbidden) continue; // תוך-יחידה: אין כאן מקום שבירה (legalCut כבר מבטל); ההצברה נמשכת
        // סיום שורה (penalty סופי של הפסקה) — good break.
        // **תיקון שורש (ביקורת 03.11): השבירה הסופית היא צומת סוף-הפסקה n —
        // בעבר נכתבה ל-cost[j] (אינדקס הפריט עצמו, n−1) ⇒ cost[n] נותר INF לעולם
        // ⇒ ה־DP מעולם לא סיפק פתרון וכל שבירות השורות במנוע מאז S1 יצאו מהגיבוי
        // הגרידי (עם באג ה-NBSP). התיקון מחיה את Knuth-Plass בפועל.
        const slack = maxWidthPx - w;
        // raggedEnd: מתיחת סוף-שורה (D-79) — שורות ragged אינן נמדדות במתיחת
        // בין-מילים אלא בכניסה טבעית; היתרה עד לקצה הטור "נבלעת" במתיחת הסוף.
        const raggedEnd = opts.raggedEnd !== false;
        const effStretch = stretch + (raggedEnd ? maxWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
        const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
        let b = badness(ratio);
        if (b < INF && w < maxWidthPx * (runts / 100)) b += 60; // עונש runt בשורת הסיום
        if (b < INF) {
          const cand = cost[i] + b + LINE_DEMERIT;
          if (cand < cost[n]) { cost[n] = cand; parent[n] = i; }
        }
        break;
      }
      if (w - shrink > maxWidthPx + 0.5) break; // חריגה שאינה ניתנת לתיקון

      if (it.kind === 'box') {
        // מקומות שבירה חוקיים נקבעים **מבנית מראש** (static legal-cuts): cut בצומת c חוקי
        // רק אם items[c-1] הוא glue לא־פנימי ו‑items[c] תיבה שפותחת יחידה חדשה.
        // זה מבטל את באג V23: lock תלוי-נקודת-התחלה על צמתים משותפים ל‑DP.
        // (תיקון S3: הבדיקה הייתה בתוך הלולאה עם אינדקס שגוי j+2 — כל השברים נחסמו.)
        const cut = j + 1; // נקודת שבירה חוקית: אחרי תיבה, לפני ה‑glue העוקב
        if (!(items[cut].kind === 'glue' && !items[cut].internal && items[cut + 1] && items[cut + 1].kind === 'box')) continue;
        const slack = maxWidthPx - w;
        const raggedEnd = opts.raggedEnd !== false;
        const effStretch = stretch + (raggedEnd ? maxWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
        const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
        const b = badness(ratio);
        if (b >= INF) continue;
        const cand = cost[i] + b + LINE_DEMERIT;
        if (cand < cost[cut]) { cost[cut] = cand; parent[cut] = i; }
      }
    }
  }

  if (cost[n] === INF) return greedyFallback(items, maxWidthPx, measure, lineHeightPx);

  const cuts = [];
  let p = n;
  while (p > 0 && parent[p] >= 0) { cuts.push([parent[p], p]); p = parent[p]; }
  cuts.reverse();

  const lines = [];
  for (let k = 0; k < cuts.length; k++) {
    const [a, b] = cuts[k];
    // תת־קופסאות של אותה יחידת NBSP מאוחדות חזרה עם \u00A0 (הצמד שומר על זהותו)
    const rawBoxes = items.slice(a, b).filter(x => x.kind === 'box');
    const toks = [];
    let cur = null, prevPenaltyForbidden = false;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'penalty' && it.forbidden) { prevPenaltyForbidden = true; continue; }
      if (it.kind !== 'box') continue;
      if (cur !== null && prevPenaltyForbidden) { cur += '\u00A0' + it.text; prevPenaltyForbidden = false; }
      else { if (cur !== null) toks.push(cur); cur = it.text; prevPenaltyForbidden = false; }
    }
    if (cur !== null) toks.push(cur);
    void rawBoxes;
    if (!toks.length) continue;
    // רוחב אמיתי: סכום תת־הקופסאות + רווחי ה‑glue שביניהן (כולל internal)
    let widthPx = 0;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'box') widthPx += it.width;
      else if (it.kind === 'glue') widthPx += it.width;
    }
    lines.push({ words: toks, widthPx, heightPx: lineHeightPx, isLast: k === cuts.length - 1 });
  }
  return lines;
}

/**
 * מסלול גיבוי (כשה־DP לא מצא פתרון אפשרי, למשל מילה רחבה מהעמודה — אין מקף).
 * תיקון שורש (ביקורת 03.11, S13): בגיבוי חלים **אותם איסורי שבירה** כמו במסלול
 * הראשי — בעבר כל penalty חתם שורה, כולל `forbidden` (בין תתי־קופסות של יחידת
 * NBSP) ⇒ היחידה נקרעה בין שורות **ואיבדה את \u00A0 שלה** (אובדן תוכן, BRZ-15;
 * ורוחב פנימי נמדד כרווח רגיל). כעת:
 * 1. penalty אסור לעולם אינו מסיים שורה — היחידה משוחזרת כטוקן אחד עם \u00A0
 *    (זהה לשחזור המסלור הראשי).
 * 2. רוחב טוקן נצבר מהפריטים (תיבות + glue פנימי 0.26em) — זהה למסלור הראשי,
 *    לא מדידה מחודשת של מחרוזת NBSP (הייתה מודדת 0.4em פנימי — עיוות רוחב).
 * 3. התקדמות מובטחת: טוקן שגולש פותח שורה חדשה; טוקן רחב מהעמודה נשאר לבד
 *    בשורה משלו — אין לולאה ואין דילוג תוכן. מעבר אחד על הפריטים.
 */
function greedyFallback(items, maxWidthPx, measure, lineHeightPx) {
  const space = measure(' ');
  const lines = [];
  let toks = [];            // טוקנים של השורה הנוכחית
  let w = 0;                // רוחב השורה (כולל רווחים בין טוקנים)
  let cur = null, curW = 0, joinNext = false;  // טוקן בבנייה + רוחבו מהפריטים

  const flush = () => {
    if (!toks.length) return;
    lines.push({ words: toks, widthPx: w, heightPx: lineHeightPx, isLast: false });
    toks = []; w = 0;
  };
  const pushTok = () => {
    if (cur === null) return;
    const sp = toks.length ? space : 0;
    if (toks.length && w + sp + curW > maxWidthPx) flush(); // הטוקן הבא ייפתח שורה חדשה
    toks.push(cur); w += sp + curW;
    cur = null; curW = 0; joinNext = false;
  };

  for (const it of items) {
    if (it.kind === 'penalty') {
      if (it.final) continue;            // סוף פסקה — הטיפול שלאחר הלולאה סוגר את האחרון
      if (it.forbidden) { joinNext = true; continue; } // אין חיתוך בתוך יחידה — לעולם
      continue;
    }
    if (it.kind === 'glue') {
      if (it.internal && cur !== null) { curW += it.width; } // רווח פנימי בתוך היחידה
      continue; // glue רגיל בין טוקנים: רוחבו נכנס כ־sp בעת pushTok
    }
    if (it.kind !== 'box') continue;
    if (cur !== null && joinNext) { cur += '\u00A0' + it.text; curW += it.width; joinNext = false; } // המשך הצמד — ואיפוס: המילה הרגילה הבאה לא תיבלע
    else { pushTok(); cur = it.text; curW = it.width; }
  }
  pushTok(); flush();
  if (lines.length) lines[lines.length - 1].isLast = true;
  return lines;
}

module.exports = { breakLines, badness, STRETCH_RATIO, SHRINK_RATIO };

};
__modules["src/engine/typography/protectors.js"] = function (require, module, exports) {
// src/engine/typography/protectors.js — NBSP gluing rules (REQ-LB-03) + fixDropWordInColumns port (Gold)
'use strict';

/**
 * הגנות מילים: צמדי NBSP. אם זוג קשור רחב מרוחב הטור — מבטלים את הקשירה (לא גלישה).
 */

// סמן הערה = אות עברית **עם גרש** (א׳) או זוג־אותיות עם גרשיים (אב״) — נדרש סימן מפורש.
// לקח false-positive: לולא דרישת הגרש כל מילה בת אות הייתה נצמדת לשכנתה (הרס טוקניזציה).
const NOTE_MARKER_RE = /([\u05D0-\u05EA]\u05F3|[\u05D0-\u05EA]{1,2}\u05F4)[ \u00A0]+/g;

function glueNoteMarkers(text) {
  // BRZ-11: סמן הערה אינו נשבר מסוף שורה — סמן + המילה שאחריו הופכים יחידת NBSP.
  // דפדוף על NOTE_MARKER_RE (גרש חובה) + look-ahead למילת תוכן; גרשיים→גרש (one-way Z.ai fix).
  return text.replace(NOTE_MARKER_RE, (m, marker) => marker.replace('\u05F4', '\u05F3') + '\u00A0');
}

function glueGershayim(text) {
  // מילה עם גרשיים נשארת שלמה: אין שבירה בתוכה — כבר box אחד (אין רווחים בתוך מילה)
  return text;
}

const ABBREV = ['ר"ת', 'רשב"א', 'תוס\'', 'מרדכי', 'שב"ע', 'רמב"ם', 'רש"י', 'תוספות'];
function glueAbbreviations(text) {
  let out = text;
  for (const a of ABBREV) out = out.split(a + ' ').join(a + '\u00A0');
  return out;
}

/**
 * החלת כל ההגנות על מילות פסקה.
 * @param {string[]} words
 * @param {(t:string)=>number} measure
 * @param {number} colWidthPx
 */
function protectWords(words, measure, colWidthPx) {
  const joined = words.join(' ');
  let s = glueNoteMarkers(joined);
  s = glueGershayim(s);
  s = glueAbbreviations(s);
  let out = s.split(/\s+/).filter(Boolean);
  // ביטול קשירה אם unit חורג מהטור (Claude §6.2(5))
  out = out.map(w => {
    if (w.includes('\u00A0') && measure(w.replace(/\u00A0/g, ' ')) > colWidthPx) {
      return w.replace(/\u00A0/g, ' ');
    }
    return w;
  });
  // שוב לפצל יחידות שהתבטלו
  const finalWords = [];
  for (const w of out) {
    if (!w.includes('\u00A0')) { finalWords.push(...w.split(' ')); } else finalWords.push(w);
  }
  return finalWords.filter(Boolean);
}

/**
 * fixDropWordInColumns (פורטר מ‑Gold): אם המילה האחרונה בטור "נופלת" לבדה
 * לשורה הבאה באורך <3 אותיות — מושכים אותה חזרה או דוחפים שורה.
 * כאן: החזר true אם בוצע תיקון (הקורא יריץ rerun הגנות).
 */
function fixDropWordInColumns(columnLines, minLen = 3) {
  let fixed = false;
  for (let c = 0; c < columnLines.length - 1; c++) {
    const lines = columnLines[c];
    const nextFirst = columnLines[c + 1][0];
    if (!lines.length || !nextFirst) continue;
    const last = lines[lines.length - 1];
    if (last.words.length === 1 && last.words[0].length < minLen && nextFirst.words.length > 1) {
      // משלבים את המילה הנופלת לתוך השורה הראשונה של הטור הבא (גרירה)
      nextFirst.words.unshift(...last.words);
      lines.pop();
      fixed = true;
    }
  }
  return fixed;
}

module.exports = { protectWords, glueNoteMarkers, glueAbbreviations, fixDropWordInColumns };

};
__modules["src/engine/typography/dropword.js"] = function (require, module, exports) {
// src/engine/typography/dropword.js — First-word decoration (REQ-LB-05, T1 S3.4)
// נכתב מאפס לפי המפרט: ארבעה מצבים, אורך 1–2 מילים, sog threshold, יישור cap-top.
'use strict';

/**
 * עקרונות (מניעת באגים גרסאות קודמות):
 * - F-W1 (Yellow/Gold): drop-word חייב להיות GEOMETRY-NEUTRAL — הוא לא משנה את תכנון השורות.
 *   לכן המצב 'drop' אינו מסיר מילים מהזרימה; הוא רק מסמן את תחילת הפסקה ברנדור (inline drop-cap),
 *   והשורות נשארות זהות. ה‑ledger רושם fw-decorated ללא שינוי layoutHash.
 * - F-W2 (Orange V23): סימון לפני מדידה = בעייתיות; כאן הסימון AFTER line-plan, BEFORE render בלבד.
 * - F-W3: bold/inline משנים רוחב מדידה? לא — אותם תאים נשמרים; bold ניתן כ‑font-weight CSS בלבד.
 * - F-W4: none = no-op מוחלט (גם ללא דגל).
 * - ס sog threshold: אם לפסקה פחות מ‑first-word-threshold-lines שורות → אין קישוט בכלל.
 * - first-word-length ∈ {1,2}: נבחרות 1–2 המילים הראשונות מיחידות השורה הראשונה (NBSP unit נספר כיחידה אחת).
 */

const MODES = ['drop', 'inline', 'bold', 'none'];

/**
 * @param {{lines:Array<{words:string[]}>}} block - פסקה עם שורות מתוכננות (KP output)
 * @param {object} settings - merged registry settings
 * @param {{measure?:(t:string)=>number}} [api] - למדידת רוחב המילה המקושטת (אופציונלי)
 * @returns {{applied:boolean, mode:string, words:string[], reason?:string}} החלטה + עדכון meta על הבלוק
 */
function applyDropWord(block, settings, api = {}) {
  const mode = String(settings['first-word-mode'] || 'none');
  if (!MODES.includes(mode)) return { applied: false, mode: 'none', words: [], reason: `invalid-mode:${mode}` };
  if (mode === 'none') return { applied: false, mode, words: [], reason: 'mode-none' };
  if (!block || !Array.isArray(block.lines) || block.lines.length === 0) {
    return { applied: false, mode, words: [], reason: 'no-lines' };
  }

  const threshold = Math.max(1, Number(settings['first-word-threshold-lines']) || 3);
  if (block.lines.length < threshold) {
    return { applied: false, mode, words: [], reason: `below-threshold(${block.lines.length}<${threshold})` };
  }

  const len = Math.min(2, Math.max(1, Number(settings['first-word-length']) || 1));
  // יחידות השורה הראשונה: מילים (NBSP units שלמים) — לא מפצלם (BRZ-11).
  const firstUnits = block.lines[0].words.slice(0, len);
  if (firstUnits.length === 0) return { applied: false, mode, words: [], reason: 'empty-first-line' };

  const decoratedWords = firstUnits.map(w => w.replace(/\u00A0/g, '\u00A0')); // שמירת צמדים
  const measure = api.measureTextWidth ? (t) => api.measureTextWidth(t, settings['body-font-size-pt']) : null;
  const widthPx = measure ? measure(decoratedWords.join(' ')) : null;

  // **S12.1-6 (סגירת דחוי S3):** יישור cap-top ממדדי אמת — capHeightEm מה־API
  // (OS/2 sCapHeight מגופן רשום במימוש B; נפילה לקירוב 0.7em במימוש A).
  const capHeightEm = api.capHeightEm ? api.capHeightEm() : 0.7;

  const fw = {
    mode,                                   // drop | inline | bold
    words: decoratedWords,
    count: decoratedWords.length,
    widthPx,
    capTopAlign: Boolean(settings['first-word-align-cap-top']), // REQ-LB-05: cap-top ↔ body baseline, לא glyph baseline
    capHeightEm,                            // **S12:** מדד אמת ליישור (לא עוד קבוע 0.7)
    fontSizePt: mode === 'drop' ? Math.round(settings['body-font-size-pt'] * 2) : settings['body-font-size-pt'],
    lineHeightPx: null                       // drop: יישור ע"י offset, לא גובה שורה — geometry-neutral
  };

  // סימון metadata בלבד — השורות עצמן לא נגעות (invariant CP4 geometry-neutral).
  block.firstWord = fw;
  return { applied: true, mode, words: decoratedWords, reason: null };
}

/**
 * כללי CSS עבור שכבת הרנדור (dom-renderer/html-export). אין כאן !important (F-09).
 * drop: float right + font-size כפול + line-height הדוק + margin-bottom מחושב כך ש‑cap-top
 * מיושר לקו הבסיס של שורת הגוף הראשונה (cap ≈ 0.7em).
 */
function dropWordCssClasses(fw) {
  if (!fw) return '';
  const parts = [`fw-${fw.mode}`];
  if (fw.capTopAlign) parts.push('fw-cap-top');
  return parts.join(' ');
}

module.exports = { applyDropWord, dropWordCssClasses, MODES };

};
__modules["src/engine/layout/dp-planner.js"] = function (require, module, exports) {
// src/engine/layout/dp-planner.js — Multi-column/page DP planner (REQ-BAL-01/02/04/08/10)
'use strict';

const crypto = require('crypto');
const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { Ledger } = require('../core/ledger');
const { runProtections } = require('./protections-matrix');
const { runRetreatLoop } = require('./retreat-loop');
const { generateCandidates } = require('./candidate-generator');
const { blockGapPx } = require('./column-flow');
const { fixDropWordInColumns } = require('../typography/protectors');
const { MARK_TAG } = require('../notes/markers');
const { moveLineForward } = require('./ordering');
const { getFootnotesReservedHeight, noteHeight } = require('./footnote-budget');

/** חתימת פריסה דטרמיניסטית — ללא Date/random (REQ-GOV determinism).
 * תיקון S7-E2E: tokenId נמצא ב‑meta של pushLines (לא על השורה עצמה) — יש לחלץ משם,
 * אחרת hash/TOC מאבדים את מזהה הטוקן (באג V23: headingsForToc ריק). */
function lineTokenId(ln) {
  if (ln.tokenId != null) return ln.tokenId;
  if (ln.meta && ln.meta.tokenId != null) return ln.meta.tokenId;
  return '';
}

/**
 * **תיקון S8 (טור פנטום):** יישור מערך הטורים לאורך התבנית אחרי המרת סוג עמוד.
 * שומר על תוכן קיים בעמודות שנותרו; תורם עודפים (בלי תבנית) מוחזרים —
 * לא אמור לקרות (ההמרה מתבצעת בעמוד ריק/חדש), ואם קרה — נסיגה בטוחה.
 */
function reAlignColumns(page) {
  const n = page.template.columns.length;
  const old = page.columns || [];
  const next = Array.from({ length: n }, (_, i) => (old[i] ? old[i].slice() : []));
  let orphaned = 0;
  for (let i = n; i < old.length; i++) orphaned += old[i].length;
  if (orphaned > 0 && old[n - 1]) {
    // שורות בטור פנטום — מוחזרות לטור האחרון החוקי (BRZ-15: אין גניזה)
    next[n - 1].push(...old.slice(n).flat());
  }
  page.columns = next;
  return orphaned;
}

function layoutHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}`)),
    fn: p.footnotes.length, sn: p.sideNotes.length
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **D-47 (תיקון P0-6):** hash של **הגיאומטריה הנמדדת בלבד** (הטורים/השורות) —
 * זהו האינווריאנט T1: פאס העיטורים/ההערות אסור לו לשנות את הפריסה שנמדדה.
 * בעבר ההשוואה CP4==CP5 השוותה משתנה לעצמו — טאוטולוגיה שאינה יכולה להיכשל.
 * כאן: hash נפרד של הטורים בלבד (בלי מרזבים/הערות צד שמשתנים כחוק בשלב ההערות)
 * — נבדק לפני ואחרי פאס העיטורים בpipeline; שינוי אמיתי בשורות ⇒ הבדיקה נכשלת.
 */
function bodyGeometryHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}:${ln.seq != null ? 's' + ln.seq : ''}`))
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **תיקון P0-3 (שבירת סדר קריאה):** איזון חוקי מזיז שורות **קדימה בסדר הקריאה
 * בלבד** — הזזת גבול הטורים קדימה/אחורה תוך שמירת סדר המילים:
 *  - טור מוקדם (col0, נקרא ראשון) גבוה יותר ⇒ pop מסופו → unshift לראש col1 (קדימה).
 *  - טור מאוחר (col1, נקרא שני) גבוה יותר ⇒ shift מראשו → push לסוף col0 (הזזת הגבול
 *    אחורה — שומר סדר: השורה עדיין אחרי כל col0 ולפני שאר col1).
 * בעבר: pop מהטור המאוחר + unshift לראש הטור המוקדם — הציג את סוף פסקה לפני
 * תחילתה (רגרסיה חדשה שלא הייתה באף גרסה קודמת). כל השורות מתויגות seq
 * (סדר הצבה = סדר מסמך) ו‑protections-matrix מפיק reading-order-break אם
 * איזון עתידי יפר זאת — הבאג נעול לצמיתות בבדיקת רגרסיה.
 */

/**
 * Block = יחידת פריסה: heading או paragraph עם שורות שנמדדו.
 * @param {Array} blocks - [{kind:'heading'|'paragraph', lines:[...], notes:[...], token}]
 * @param {object} settings
 * @param {{measure:(t:string,s?:number)=>number}} env - חייב להכיל measure (entry יחיד — L1); אחרת throw (ללא קריסה שקטה)
 */
function planPages(blocks, settings, eventLog, ledger = new Ledger(), env = {}) {
  const measureFn = env && typeof env.measure === 'function' ? env.measure : null;
  if (!measureFn) {
    throw new Error('dp-planner: env.measure is required (single measurement entry — REQ-LB-01). Silent fallback to global is forbidden.');
  }
  // **S10 (REQ-UI-03):** מזליף התקדמות מה‑DP — מכשור בלבד (no-op proof בבדיקה).
  // הערכת מספר העמודים: סכום גבהים נמדדים / קיבולת עמוד רגיל — מעודכנת בזמן אמת.
  const onProgress = env && typeof env.onProgress === 'function' ? env.onProgress : null;
  const estCapacity = (() => {
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    return Math.max(1, tpl.contentBox.height * Math.max(1, tpl.columns.length));
  })();
  const blockHeight = (b) => (b.lines || []).reduce((s, l) => s + (l.heightPx || 0), 0);
  const totalHeight = blocks.reduce((s, b) => s + blockHeight(b), 0);
  const estimatedPages = Math.max(1, Math.ceil(totalHeight / estCapacity));
  const pages = [];
  let pageIdx = 0;
  let seqCounter = 0; // סדר הצבה — סדר קריאה (תיקון P0-3)
  const lineH = Math.round(settings['body-font-size-pt'] * (96 / 72) * settings['body-line-height']);
  const imbMax = settings['imbalance-max-delta-px'];

  function newPage(type = PAGE_TYPES.REGULAR) {
    const isRecto = pages.length % 2 === 0; // עמוד 1 = recto
    const tpl = buildPageTemplate(type, settings, isRecto);
    return { index: pageIdx++, type, template: tpl, columns: Array.from({ length: tpl.columns.length }, () => []), footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null, fnReservedHeightPx: 0, chapterOpening: false };
  }

  let cur = newPage(PAGE_TYPES.REGULAR);

  // **FWD-1 (S8):** פס כותרת חוצה־טורים (spanning band) — כותרת שנמדדה ברוחב
  // מלא מוצבת בפס עליון חוצה־טורים במקום בטור חצי־רוחב (בעבר: נמדדה ברוחב מלא
  // והוצבה בטור רגיל ⇒ גלישה אופקית שקטה). הטורים מתחילים מתחת לפס.
  const spanH = (page) => (page && page.spanning ? page.spanning.heightPx : 0);
  const colCapacity = (tpl, page) => tpl.contentBox.height - spanH(page);

  /**
   * גובה תפוס = שורות + **יתרת תקציב ההערות של העמוד** — כך ה‑probe וה‑reservation
   * זהים (F-17). התקציב נרשם פעם אחת בסוף הטור האחרון.
   * תיקון P1-8: חתימה (col, page) — page חובה; אין עוד עמוד ברירת־מחדל שגוי.
   */
  function usedHeight(col, page = cur) {
    let h = col.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    if (page && page.fnReservedHeightPx > 0 && page.columns[page.columns.length - 1] === col) {
      h += page.fnReservedHeightPx; // נשמר פעם אחת — בסוף הטור האחרון
    }
    return h;
  }

  /**
   * **איחוד P1-1 (מנגנום תאום):** recomputeFnBudget ממשיך כעת דרך
   * footnote-budget.getFootnotesReservedHeight — מקור יחיד. בעבר היו שני מימושים
   * מקבילים; בדיקת probe==reserved רצה על מודול שהמנוע לא השתמש בו.
   */
  function recomputeFnBudget(page) {
    if (!settings['footnotes-enabled'] || !page.footnotes.length) { page.fnReservedHeightPx = 0; return 0; }
    const reserved = getFootnotesReservedHeight(page.footnotes, settings, (t, s) => measureFn(t, s));
    page.fnReservedHeightPx = reserved;
    return reserved;
  }

  function ensureRoom(neededLines, opts = {}) {
    void opts;
    const cap = colCapacity(cur.template, cur);
    for (let c = 0; c < cur.columns.length; c++) {
      if (cap - usedHeight(cur.columns[c], cur) >= neededLines * lineH - 0.5) return c;
    }
    return -1;
  }

  function flushPage() {
    // איזון טורים: Δ≤5px (BRZ-3) — **שמירת סדר קריאה בכל הזזה (תיקון P0-3)**
    if (cur.columns.length === 2) {
      let a = usedHeight(cur.columns[0], cur), b = usedHeight(cur.columns[1], cur);
      let guard = 0;
      while (Math.abs(a - b) > imbMax && guard++ < 200) {
        const hi = a >= b ? 0 : 1, lo = 1 - hi;
        if (!moveLineForward(cur.columns, hi, lo)) break;
        a = usedHeight(cur.columns[0], cur); b = usedHeight(cur.columns[1], cur);
      }
      // מילה נופלת בין טורים (פורטר מ‑Gold) — גם שומר סדר (המילה חוצה את הגבול קדימה)
      if (fixDropWordInColumns(cur.columns) ) {
        eventLog.emit('balance', 'fix-drop-word', { page: cur.index }, cur.index);
      }
      cur.balanceInfo = { before: [a, b], after: [usedHeight(cur.columns[0], cur), usedHeight(cur.columns[1], cur)] };
      eventLog.emit('balance', 'column-balance', { page: cur.index, delta: Math.abs(usedHeight(cur.columns[0], cur) - usedHeight(cur.columns[1], cur)) }, cur.index);
    }
    // Invariant BRZ-14: scrollHeight ≤ clientHeight (בכפוף לפס החוצה־טורים — FWD-1)
    for (const col of cur.columns) {
      if (usedHeight(col, cur) > colCapacity(cur.template, cur) + 0.5) {
        const rec = ledger.create('containment', `page#${cur.index}`, cur.index, { used: usedHeight(col, cur), cap: colCapacity(cur.template, cur) }, 'page-plan');
        ledger.transition(rec.issue_id, cur.type === PAGE_TYPES.FILLER ? 'not-comparable' : 'persists', 'page-plan', 'overflow after placement');
      }
    }
    pages.push(cur);
  }

  function pushLines(lines, meta = {}) {
    // grid-block-gap-pct: מרווח בין־בלוקי נצרך כאן — שורה ראשונה של בלוק חדש
    // סופגת את ה‑gap (פרופורציונלי לגובה שורה), כך שתקציב הטור כולל אותו.
    const gap = meta.firstOfBlock ? blockGapPx(settings, lineH) : 0;
    let pendingGap = gap;
    for (const ln of lines) {
      let placed = false;
      for (let c = 0; c < cur.columns.length && !placed; c++) {
        const needPx = ln.heightPx + pendingGap - 0.5;
        if (colCapacity(cur.template, cur) - usedHeight(cur.columns[c], cur) >= needPx) {
          cur.columns[c].push({ ...ln, meta, seq: seqCounter++ });
          pendingGap = 0;
          placed = true;
        }
      }
      if (!placed) {
        flushPage();
        cur = newPage(meta.forceType || PAGE_TYPES.REGULAR);
        cur.columns[0].push({ ...ln, meta, seq: seqCounter++ }); // טור חדש/עמוד חדש → ללא gap
        pendingGap = 0;
      }
    }
  }

  /**
   * **תקציב הערות לפני מיקום (F-17 probe==reserved) — כולל מדיניות הערה ארוכה
   * (REQ-FN-02) בזמן ההצבה**, כך שהתקציב תמיד עדכני (ללא תיקון פוסט‑הוק):
   *  - split: החלק הראשון נכנס למרזב העמוד; השאר נכנס לתור pendingBarNotes
   *    ונדחף לראש המרזב של העמוד הבא עם סימון המשך (isContinuation).
   *  - move-whole: ההערה כולה עוברת לעמוד הבא.
   *  - reject-to-body: ההערה חוזרת לגוף כplaceholder `[סמן: טקסט]` + רישום ledger.
   * fn-layout-mode (D-34): block ⇒ תקרת fn-bar-max-height-px נאכפת; continuous ⇒
   * אין תקרה (ההערות זורמות) — מנגנון אמיתי, לא מחלקת CSS בלבד.
   */
  const pendingBarNotes = [];
  function reserveNotes(blk) {
    const notes = (blk.notes || []);
    if (!notes.length) return;
    // המשכים מהעמוד הקודם קודם כל (שמירת סדר ההערות)
    const queue = [...pendingBarNotes.splice(0), ...notes];
    const barMax = settings['fn-layout-mode'] === 'continuous'
      ? Number.POSITIVE_INFINITY
      : (settings['fn-bar-max-height-px'] || Number.POSITIVE_INFINITY);
    for (const n of queue) {
      if (!settings['footnotes-enabled']) {
        // אין מרזב — ההערה חוזרת לגוף כplaceholder; לרזב לא אמורות להגיע הערות
        // כלל במצבים אלה (הpipeline לא שם אותן ב‑blk.notes). שומר בטוח: continue.
        continue;
      }
      const h = noteHeight(n, settings, (t, s) => measureFn(t, s));
      const isCont = n.isContinuation === true;
      // הערה ארוכה מתקרת המרזב ⇒ מדיניות (block mode בלבד; continuous אין תקרה — D-34)
      if (Number.isFinite(barMax) && h > barMax && settings['long-footnote-policy'] !== 'allow') {
        if (settings['long-footnote-policy'] === 'split') {
          // **פיצול אמיתי של הטקסט**: החלק הראשון נכנס למרזב הזה, השאר לעמוד הבא
          const fnSize = settings['body-font-size-pt'] * 0.8;
          const fnLH = Math.round(fnSize * (96 / 72) * 1.25);
          const laneW = settings._fnColWidthPx || 200;
          const words = String(n.text).replace(/\uE000/g, ' ').split(/\s+/).filter(Boolean);
          const linesFit = Math.max(1, Math.floor(barMax / fnLH));
          let w = 0, linesUsed = 1, cutIdx = words.length;
          for (let i = 0; i < words.length; i++) {
            const ww = measureFn(words[i], fnSize);
            if (w + ww > laneW && w > 0) { linesUsed++; w = ww; if (linesUsed > linesFit) { cutIdx = i; break; } } else w += ww;
          }
          if (cutIdx >= words.length) {
            // כל ההערה נכנסת בגבול התקרה — אין צורך בפיצול
            cur.footnotes.push({ ...n, heightPx: h, mode: isCont ? 'split-rest' : 'normal', isContinuation: isCont });
            continue;
          }
          const firstText = words.slice(0, cutIdx).join(' ');
          const restText = words.slice(cutIdx).join(' ');
          cur.footnotes.push({ ...n, text: firstText, heightPx: linesFit * fnLH, lineH: fnLH, mode: 'split-first', linesShown: linesFit });
          pendingBarNotes.push({ ...n, text: restText, isContinuation: true, continuationOf: n.tokenId, mode: 'split-rest' });
          eventLog.emit('notes-budget', 'fn-split', { token: n.tokenId, marker: n.marker, barMax, firstWords: cutIdx }, cur.index);
          continue;
        }
        if (settings['long-footnote-policy'] === 'move-whole') {
          pendingBarNotes.push({ ...n, mode: 'moved-whole', deferredToNextPage: true });
          eventLog.emit('notes-budget', 'fn-moved-whole', { token: n.tokenId, marker: n.marker }, cur.index);
          continue;
        }
        if (settings['long-footnote-policy'] === 'reject-to-body' && rejectToBody(n, `bar overflow ${h}>${barMax}`)) continue;
      }
      cur.footnotes.push({ ...n, heightPx: h, lineH: Math.round((settings['body-font-size-pt'] * 0.8) * (96 / 72) * 1.25), isContinuation: isCont, mode: isCont ? 'split-rest' : 'normal' });
    }
    recomputeFnBudget(cur); // probe==reserved — פונקציה אחת (unified) לשני הצרכים
  }

  /**
   * **תיקון P0-3 משלים — reject-to-body נשאר מסלול BRZ-15 לגיטימי** (השבה מלאה
   * לגוף; לעולם אין גניזת מילים). פועל בזמן הצבה בלבד (בתוך reserveNotes).
   */
  function rejectToBody(n, reason) {
    const blk = blocks.find(b => b.tokenId === n.tokenId && (b.notes || []).some(x => x.noteIndex === n.noteIndex));
    if (!blk) return false;
    // **D-53:** הסמן בשורות הוא יחידה מתויגת (`עוגן\u00A0\uE102סמן`). ההחלפה:
    // מורידים את התג ומדביקים את טקסט ההערה אחרי הסמן במפריד E000 —
    // `עוגן\u00A0סמן\uE000טקסט` — צורה אחידה עם inline (D-30), נספרת פעם אחת.
    const tagged = (l) => l.words && l.words.some(w => String(w).includes(MARK_TAG));
    const idx = (blk.lines || []).findIndex(tagged);
    if (idx >= 0) {
      blk.lines[idx].words = blk.lines[idx].words.map(w => {
        const sw = String(w);
        if (!sw.includes(MARK_TAG)) return w;
        const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
        return sw.replace(MARK_TAG, '') + '\uE000' + textE;
      });
    } else {
      const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
      blk.lines.push({ words: [`${n.marker}\uE000${textE}`], heightPx: lineH, isLast: false, tokenId: blk.tokenId, kind: 'paragraph', part: 'rest' });
    }
    const ni = (blk.notes || []).findIndex(x => x.noteIndex === n.noteIndex);
    if (ni >= 0) blk.notes.splice(ni, 1); // מקור־אמת יחיד: לא לספור פעמיים
    blk.rejectedNotes = blk.rejectedNotes || [];
    blk.rejectedNotes.push({ tokenId: n.tokenId, noteIndex: n.noteIndex, text: n.text, marker: n.marker, rejected: true, reason });
    ledger.create('fn-out-of-order', `rejected@p${cur.index}`, cur.index, { marker: n.marker, reason }, 'notes-budget');
    eventLog.emit('notes-budget', 'footnote-rejected-to-body', { token: n.tokenId, marker: n.marker, reason }, cur.index);
    return true;
  }


  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi];
    const next = blocks[bi + 1];

    // **S10 (REQ-UI-03):** התקדמות שלב הפריסה — "עומד עמוד X מתוך כ־Y" (Y מוערך;
    // מעודכן לספירה הסופית בסיום ה‑DP). בדידות 32 בלוקים — אפס השפעה על הפריסה.
    if (onProgress && (bi & 31) === 0) {
      const est = Math.max(estimatedPages, cur.index + 1);
      onProgress({
        stage: 'page-plan',
        pct: 25 + Math.round(45 * (bi / Math.max(1, blocks.length))),
        label: `עומד עמוד ${cur.index + 1} מתוך כ־${est}`,
        pageIndex: cur.index + 1,
        estimatedTotal: est
      });
    }

    // REQ-HDG-02 (החלטה מאוחדת — headings-escort.applyHeadingModes, D-09):
    // הדגלים נקבעים בpipeline לפני ה‑DP; כאן רק צריכה.
    if (blk.kind === 'heading' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      eventLog.emit('page-plan', 'heading-new-page-mode', { token: blk.tokenId }, cur.index);
    }
    // פתיחת חלק (H1) / פתיחת ספר (H0 — PT-04 טור רחיד): עמוד חדש + סימון chapterOpening (D-36)
    // **תיקון S8 (באג חבוי):** המרת סוג עמוד חייבת ליישר גם את מערך הטורים לתבנית
    // החדשה — בעבר נשאר מערך שני־טורי מעל תבנית חד־טורית ⇒ טור פנטום בלי תבנית.
    if (blk.kind === 'heading' && (blk.level === 1 || blk.level === 0)) {
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
      cur.chapterOpening = true;
      cur.type = PAGE_TYPES.PREFACE;
      cur.template = buildPageTemplate(PAGE_TYPES.PREFACE, settings, cur.isRecto !== false);
      reAlignColumns(cur);
      eventLog.emit('page-plan', 'part-opening', { token: blk.tokenId, level: blk.level }, cur.index);
    }

    // REQ-FN-05/06: heading mode=side-note → הערת שוליים בטור מקביל (H7 doctrine)
    if (blk.kind === 'heading' && blk.asSideNote) {
      // S7.1.2: הערת צד נצמדת לפסקה שהיא מבארת — הבלוק הבא (host) הוא העוגן החזותי;
      // ההצבה מחפשת את שורת ה‑host וממקמת את ההערה בראשה (לא ראש עמוד עיוור).
      const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph');
      cur.sideNotes.push({
        text: blk.lines.map(l => l.words.join(' ')).join(' ').trim(),
        anchorToken: host ? host.tokenId : blk.tokenId,
        ownToken: blk.tokenId, isHeading: true, level: blk.level
      });
      eventLog.emit('page-plan', 'heading-side-note', { token: blk.tokenId }, cur.index);
      continue;
    }

    // **S11 (REQ-PAR-06):** דגלי פריסה של סגנונות מותאמים על פסקאות —
    // הדגלים נקבעו בפרה־פאס (pipeline) לפני המדידה; כאן רק צריכה (דפוס D-09).
    if (blk.kind === 'paragraph' && blk.customStyle) {
      const cs = blk.customStyle;
      if (cs.layoutMode === 'new-location' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        eventLog.emit('page-plan', 'custom-style-new-location', { style: cs.id, token: blk.tokenId }, cur.index);
      }
      if (cs.layoutMode === 'side-note' && blk.asSideNote) {
        // הפסקה הופכת הערת צד מעוגנת לפסקה הבאה שאחריה (המארחת) — דפוס H7
        const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph' && !(b.customStyle && b.customStyle.layoutMode === 'side-note'));
        cur.sideNotes.push({
          text: blk.lines.map(l => (l.words || []).join(' ')).join(' ').trim(),
          anchorToken: host ? host.tokenId : blk.tokenId,
          ownToken: blk.tokenId, isCustomStyle: cs.id,
          counterMark: cs.counterMark || null
        });
        eventLog.emit('page-plan', 'custom-style-side-note', { style: cs.id, token: blk.tokenId }, cur.index);
        continue;
      }
      if (cs.layoutMode === 'full-width' && blk.fullWidth) {
        // פס חוצה־טורים (callout) — דפוס FWD-1 של H2; פס אחד בראש העמוד.
        // אם כבר יש פס/תוכן בעמוד — עמוד חדש (קריאה פותחת מיקום משלה).
        if (cur.spanning || cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: bandH,
          customStyle: cs
        };
        eventLog.emit('page-plan', 'custom-style-band', { style: cs.id, token: blk.tokenId, heightPx: bandH }, cur.index);
        continue;
      }
    }

    // תקציב הערות לפני מיקום (F-17 probe==reserved, כולל מדיניות הערה ארוכה)
    if (blk.kind === 'paragraph') reserveNotes(blk);

    if (blk.kind === 'heading' && blk.level === 2) {
      // PT-05: עמוד חדש תמיד + סימון פתיחת סימן (D-36) + בניית תבנית מלאה
      // (בעבר בענף ה־else הוחלף סוג העמוד בלי בניית תבנית SIGN_OPEN —
      // נשארה תבנית REGULAR ללא h2-top-offset; תוקן ב‑S8 עם FWD-1)
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.SIGN_OPEN); }
      else if (cur.type !== PAGE_TYPES.SIGN_OPEN) {
        cur.type = PAGE_TYPES.SIGN_OPEN;
        cur.template = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, settings, cur.isRecto !== false);
        reAlignColumns(cur); // יישור טורים לתבנית (תיקון S8 — טור פנטום)
      }
      cur.chapterOpening = true;
      eventLog.emit('page-plan', 'h2-new-page', { token: blk.tokenId }, cur.index);
      // **FWD-1:** H2 שנמדדה ברוחב מלא (mode=full-width, ברירת המחדל) ⇒ פס
      // חוצה־טורים — לא טור חצי־רוחב. הטורים נמדדים מתחת לפס (colCapacity מותאם).
      if (blk.fullWidth && cur.template.columns.length >= 2) {
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        // **S8 (F-08):** הזמנת עיטורי H2 בגודל סופי — בתוך גובה הפס, לפני כל מדידה
        const orn = blk.lines[0] && blk.lines[0].h2Orn;
        const topPad = orn && orn.scope && orn.scope.signTop ? orn.topPx : 0;
        const bottomPad = orn && orn.scope && orn.scope.signBottom ? orn.bottomPx : 0;
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: topPad + bandH + bottomPad,
          titleTopPadPx: topPad,
          orn: orn || null
        };
        eventLog.emit('page-plan', 'h2-spanning', { token: blk.tokenId, heightPx: cur.spanning.heightPx, ornTop: topPad, ornBottom: bottomPad }, cur.index);
        continue; // הכותרת הוצבה בפס; הבלוקים הבאים ימלאו את הטורים מתחתיו
      }
    }

    // REQ-BAL-10: heading escort ≥2 שורות אחרי כותרת H1–H6 באותו טור.
    if (blk.kind === 'heading' && blk.level <= 6) {
      const following = (next && next.lines) ? next.lines.length : 0;
      if (following >= 1) {
        const needLines = 1 + Math.min(2, following); // כותרת + 2 שורות ליווי (או כמה שיש)
        let room = ensureRoom(needLines);
        if (room === -1) {
          flushPage(); cur = newPage(blk.level === 2 ? PAGE_TYPES.SIGN_OPEN : PAGE_TYPES.REGULAR);
          room = ensureRoom(needLines);
          if (room !== -1) {
            eventLog.emit('page-plan', 'heading-escort-push', { token: blk.tokenId, page: cur.index }, cur.index);
          } else {
            const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { linesNeeded: needLines, capacityPx: colCapacity(cur.template), lineHPx: lineH }, 'protections');
            ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no column fits heading+escort even on fresh page (oversized block)');
          }
        }
      }
    }

    // REQ-BAL-01: candidate search עם capacityBefore/capacityAfter + הקשר הבלוק הבא
    const need = blk.lines.length;
    let chosenCol = ensureRoom(need);
    if (chosenCol === -1) {
      const splitAt = findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings, generateCandidates);
      if (splitAt > 0) {
        pushLines(blk.lines.slice(0, splitAt - 1), { tokenId: blk.tokenId, part: 'first' });
        pushLines([blk.lines[splitAt - 1]], { tokenId: blk.tokenId, part: 'first', isLast: true });
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        pushLines(blk.lines.slice(splitAt), { tokenId: blk.tokenId, part: 'rest' });
        continue;
      }
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      chosenCol = 0;
    }
    pushLines(blk.lines, { tokenId: blk.tokenId, firstOfBlock: true, docPart: blk.part });

    if (blk.sideNoteText) cur.sideNotes.push({ text: blk.sideNoteText, anchorToken: blk.tokenId });
  }

  if (cur.columns.some(c => c.length) || cur.footnotes.length || pages.length === 0) flushPage();

  // המשכים שנותרו בתור בסוף המסמך — לא ראוי לגנוז (BRZ-15): נדחפים לעמוד האחרון
  if (pendingBarNotes.length) {
    const last = pages[pages.length - 1];
    for (const n of pendingBarNotes) {
      last.footnotes.push({ ...n }); // mode/isContinuation preserved (moved-whole stays whole)
    }
    recomputeFnBudget(last);
    eventLog.emit('notes-budget', 'fn-tail-continuation', { count: pendingBarNotes.length, page: last.index }, last.index);
    pendingBarNotes.length = 0;
  }

  // terminal residual fallback (REQ-BAL-04): אם העמוד האחרון ריק למחצה ויש מצב natural — סמן
  if (settings['allow-terminal-residual-fallback']) {
    const last = pages[pages.length - 1];
    if (last && last.columns.every(c => usedHeight(c, last) < colCapacity(last.template) * 0.5)) {
      last.terminalResidual = true; // לא מדווח כ‑underfill (B4)
    }
  }

  // S5.1.4 + S5.1.5: הגנות AFTER every mutation, ואז לולאת נסיגה מאוחדת עם גלאי תנודה
  const assess = (page, s, lg) => runProtections(page, s, lg).violations;
  const retreat = runRetreatLoop({
    pages, settings, ledger, eventLog,
    repairFns: {
      'column-imbalance': (violations, c) => {
        for (const v of violations) {
          const pg = pages.find(p => `page#${p.index}` === v.target);
          if (pg) balancePageSafe(pg, c.settings, c.ledger);
        }
      },
      'reading-order-break': (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'line moved backward in reading order (bug-guard P0-3; not auto-repaired)');
        }
      },
      'widow-bottom': (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      },
      'orphan-top': (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      }
    },
    assess
  });

  return { pages, ledger, retreat, hash: layoutHash(pages), bodyHash: bodyGeometryHash(pages) };
}

/** איזון בטוח עם rollback (REQ-BAL-09): snapshot כולל footnotes/sideNotes.
 * תיקון P0-3: הזזות קדימה בסדר הקריאה בלבד (moveLineForward).
 * תיקון P1-8: גובה כולל את תקציב ההערות של **העמוד המאוזן עצמו**. */
function balancePageSafe(page, settings, ledger) {
  const snapshot = { cols: page.columns.map(c => c.slice()), fn: page.footnotes.slice(), sn: page.sideNotes.slice() };
  const hh = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0), 0) + (page.columns[page.columns.length - 1] === c ? (page.fnReservedHeightPx || 0) : 0);
  let guard = 0;
  while (Math.abs(hh(page.columns[0]) - hh(page.columns[1])) > settings['imbalance-max-delta-px'] && guard++ < 200) {
    const a = hh(page.columns[0]), b = hh(page.columns[1]);
    const hi = a >= b ? 0 : 1, lo = 1 - hi;
    if (!moveLineForward(page.columns, hi, lo)) break;
    const cap = page.template.contentBox.height;
    if (page.columns.some(cl => hh(cl) > cap + 0.5)) {
      page.columns = snapshot.cols; page.footnotes = snapshot.fn; page.sideNotes = snapshot.sn;
      const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity' }, 'balance');
      ledger.transition(rec.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after move (not soft ×2000)');
      return false;
    }
  }
  return true;
}

/** בחירת נקודת פיצול עם הגנות widow/orphan (≥2 שורות לכל צד). */
function findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings = {}, candidatesFn = null) {
  const cap = colCapacity(cur.template, cur);
  const free = cap - usedHeight(cur.columns[cur.columns.length - 1], cur);
  const maxFit = Math.floor(free / lineH);
  if (maxFit < 2 || blk.lines.length - maxFit < 2) return 0; // אין פיצול חוקי → הזזה מלאה

  if (candidatesFn) {
    const cands = candidatesFn(blk, maxFit, cap, settings, ledger);
    if (cands.length) {
      eventLog.emit('protections', 'candidate-split', { token: blk.tokenId, at: cands[0].cut, score: cands[0].score });
      return cands[0].cut;
    }
  }
  eventLog.emit('protections', 'legal-split', { token: blk.tokenId, at: maxFit });
  return maxFit;
}

module.exports = { planPages, layoutHash, bodyGeometryHash, lineTokenId, moveLineForward, balancePageSafe };

};
__modules["src/engine/layout/page-templates.js"] = function (require, module, exports) {
// src/engine/layout/page-templates.js — PT-01..PT-10 page type contracts (Part B2) + geometry model
'use strict';

/**
 * מודל תבניות עמוד: לכל סוג חוזה גיאומטריה (מרזבים, מספור, running head, טורים).
 */
const PAGE_TYPES = {
  SHAAR_MAIN: 'shaar-main',      // PT-01
  SHAAR_SUB: 'shaar-sub',        // PT-02
  SHAAR_BACK: 'shaar-back',      // PT-03
  PREFACE: 'preface',            // PT-04 (H0 — טור רחיד)
  SIGN_OPEN: 'sign-open',        // PT-05 (H2 — עמוד חדש תמיד)
  H3_SPREAD: 'h3-spread',        // PT-06 (כותרת 3 חוצת טורים + איזון לפני)
  ENDNOTES: 'endnotes',          // PT-07
  TOC_GENERAL: 'toc-general',    // PT-08
  TOC_DETAIL: 'toc-detail',      // PT-08
  CUSTOM: 'custom',              // PT-09
  FILLER: 'filler',              // PT-10 — לא נספר, לא underfill
  REGULAR: 'regular'             // PT default
};

const MM_TO_PX = 96 / 25.4;
const PAGE_SIZES = {
  A4: { w: Math.round(210 * MM_TO_PX), h: Math.round(297 * MM_TO_PX) },
  A5: { w: Math.round(148 * MM_TO_PX), h: Math.round(210 * MM_TO_PX) },
  '16x16': { w: Math.round(165 * MM_TO_PX), h: Math.round(165 * MM_TO_PX) }
};

/**
 * חישוב תבנית עמוד לפי סוג + הגדרות. מחזיר rectPx לשימוש DP.
 * @param {string} type
 * @param {object} settings
 * @param {boolean} isRecto
 */
function buildPageTemplate(type, settings, isRecto = true) {
  const size = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  const marginSide = size.w * settings['grid-margin-side-pct'] / 100;
  const binding = settings['binding-offset-px'] || 0;
  const marginTop = settings['margin-top-px'];
  const marginBottom = Math.max(settings['margin-bottom-px'], marginTop); // תחתון רחב מהעליון (BRZ B1)
  const outerMargin = marginSide + (isRecto ? binding : -binding);

  const contentW = size.w - 2 * marginSide - (isRecto ? binding : -binding);
  const singleCol = [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.CUSTOM, PAGE_TYPES.FILLER].includes(type);
  const gutter = size.w * settings['grid-gutter-pct'] / 100;

  let colWidths;
  if (singleCol) colWidths = [contentW];
  else {
    const cw = contentW * settings['grid-col-width-pct'] / 100;
    colWidths = [cw, cw]; // ימני+שמאלי; המרזב במרכז
  }

  const headerH = (type === PAGE_TYPES.REGULAR || type === PAGE_TYPES.SIGN_OPEN || type === PAGE_TYPES.H3_SPREAD) && settings['header-enabled'] ? Math.round(settings['body-font-size-pt'] * 1.6 * 96 / 72) : 0;
  const folioH = settings['page-num-position'] !== 'none' && !singleCol ? Math.round(settings['body-font-size-pt'] * 1.4 * 96 / 72) : 0;

  const textTop = marginTop + headerH + (type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0);
  const textBottom = size.h - marginBottom - folioH;

  return {
    type, isRecto,
    width: size.w, height: size.h,
    margins: { top: marginTop, bottom: marginBottom, side: marginSide, outer: outerMargin },
    columns: singleCol ? [{ x: marginSide, w: contentW }] : [
      { x: marginSide + contentW - colWidths[0], w: colWidths[0] }, // ימין קודם (RTL)
      { x: marginSide, w: colWidths[1] }
    ],
    gutter,
    headerHeight: headerH,
    folioHeight: folioH,
    // **S8:** אזור העיטורים שמעל תיבת התוכן (אזור h2-top-offset) — מסומן במפורש
    // כך שאודיט עיטורים יודע מה חוקי (עיטור H2 עליון חי באזור זה — לא גלישה).
    h2TopOffset: type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0,
    contentBox: { top: textTop, bottom: textBottom, height: Math.max(0, textBottom - textTop) },
    numbered: ![PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.FILLER].includes(type)
      ? true : (type.startsWith('shaar') ? settings['count-shaar-pages'] : settings['count-toc-pages']),
    counts: ![PAGE_TYPES.FILLER].includes(type),
    hasRunningHead: [PAGE_TYPES.REGULAR, PAGE_TYPES.SIGN_OPEN, PAGE_TYPES.H3_SPREAD, PAGE_TYPES.PREFACE].includes(type),
  };
}

module.exports = { PAGE_TYPES, PAGE_SIZES, buildPageTemplate, MM_TO_PX };

};
__modules["src/engine/core/ledger.js"] = function (require, module, exports) {
// src/engine/core/ledger.js — Decision ledger + issue lifecycle (REQ-GOV-01, D-15)
'use strict';

/**
 * 10 מצבי מחזור חיים (V23 Session_handoff):
 */
const LIFECYCLE_STATES = [
  'created',
  'correction-blocked',
  'correction-reverted',
  'became-observable-later',
  'competing-repair-side-effect',
  'persists',
  'resolved',
  'reintroduced',
  'not-comparable',
  'unresolved'
];

class Ledger {
  constructor() {
    this.issues = new Map(); // issue_id -> record
    this.candidates = [];    // רשומות דחיית מועמד (REQ-BAL-01/S5.1.10)
    this.clock = 0;          // שעון לוגי דטרמיניסטי (תיקון P1-6) — לא Date.now
  }

  _id(kind, target) {
    let n = 1;
    while (this.issues.has(`${kind}@${target}#${n}`)) n++;
    return `${kind}@${target}#${n}`;
  }

  /** יצירת ממצא חדש עם predicate לפני; זהה ל‑"created". */
  create(kind, target, page, predicateBefore, stage) {
    const id = this._id(kind, target);
    const rec = {
      issue_id: id, kind, target, page,
      first_seen_stage: stage,
      transitions: [{ state: 'created', stage, ts: ++this.clock, note: 'predicate_before captured' }],
      predicate_before: predicateBefore,
      predicate_after: null,
      candidates: [], capacity_before: null, capacity_after: null,
      route: null, selected: null, rollback_reason: null,
      status: 'created'
    };
    this.issues.set(id, rec);
    return rec;
  }

  transition(issueId, state, stage, note = '') {
    if (!LIFECYCLE_STATES.includes(state)) throw new Error(`bad lifecycle state: ${state}`);
    const rec = this.issues.get(issueId);
    if (!rec) throw new Error(`unknown issue ${issueId}`);
    rec.transitions.push({ state, stage, ts: ++this.clock, note });
    rec.status = state;
    return rec;
  }

  recordCandidate(issueId, cand, accepted, reason) {
    const rec = this.issues.get(issueId);
    if (!rec) return;
    rec.candidates.push({ ...cand, accepted, reason });
    if (accepted) rec.selected = cand;
  }

  recordCapacity(issueId, before, after) {
    const rec = this.issues.get(issueId);
    if (rec) { rec.capacity_before = before; rec.capacity_after = after; }
  }

  finalizePredicateAfter(issueId, predAfter) {
    const rec = this.issues.get(issueId);
    if (rec) rec.predicate_after = predAfter;
  }

  toSchemaV2() {
    return { schema: 'ledger-v2', states: LIFECYCLE_STATES, issues: [...this.issues.values()] };
  }

  summary() {
    const s = {};
    for (const rec of this.issues.values()) s[rec.status] = (s[rec.status] || 0) + 1;
    return s;
  }
}

module.exports = { Ledger, LIFECYCLE_STATES };

};
__modules["src/engine/layout/protections-matrix.js"] = function (require, module, exports) {
// src/engine/layout/protections-matrix.js — Protections matrix: re-run after EVERY mutation (REQ-BAL-08, S5.1.4)
'use strict';

/**
 * מציאת שברות widow/orphan/heading-escort/runt/marker/paren אחרי כל פעולת הזזה
 * (balanceColumns, ornament fit, note-area growth, divider insert, rollback).
 * כל הפרה נרשמת ל‑ledger עם capacity evidence (S5.1.10).
 *
 * **תיקוני S7-closure:**
 *  - readingOrder (P0-3): סדר קריאה נבדק לפי תג seq (סדר הצבה = סדר מסמך).
 *    כל הזזה אחורה של שורה בין טורים מפיקה reading-order-break.
 *  - markerLineBreak (P1-3): הגנה לכל סגנונות הסמן — לא רק א׳. הבדיקה מזהה
 *    סמן הערה בסוף שורה לפי מבנה הסמן (אות+גרש / [n] / (n) / n. / כוכבית).
 *  - pageUnderfill (P1-8): עמוד חסר־מילוי — נפק בפועל (בעבר הסוג היה רשום בלבד).
 *    עמודי פתיחה/שער (chapterOpening) ו‑terminalResidual אינם נספרים (B4).
 */

const { usedHeight, pageImbalance } = require('./balancing');

/** זיהוי מילה־סמן הערה בכל סגנון (P1-3): א׳/ב׳…, [n], (n), n., כוכבית, *, **. */
function isNoteMarkerWord(w) {
  const s = String(w);
  if (!s) return false;
  // אות עברית (1-2 אותיות) + גרש/גרשיים
  if (/^[\u05D0-\u05EA]{1,2}[\u05F3\u05F4]$/.test(s)) return true;
  // [n] — סוגריים מרובעים עם מספר
  if (/^\[\d{1,4}\]$/.test(s)) return true;
  // (n)
  if (/^\(\d{1,4}\)$/.test(s)) return true;
  // n. — מספר בודד (decimal)
  if (/^\d{1,4}$/.test(s)) return true;
  // *, **, *** (+מספר אפשרי)
  if (/^\*{1,3}\d*$/.test(s)) return true;
  return false;
}

/** בדיקות הגנה; כל פונקציה מחזירה רשימת הפרות {kind, target, evidence}. */
const CHECKS = {
  widowOrphan(page, settings, ledger) {
    const violations = [];
    for (let c = 0; c < page.columns.length; c++) {
      const col = page.columns[c];
      if (!col.length) continue;
      const first = col[0], last = col[col.length - 1];
      if (first.meta && first.meta.part === 'rest' && col.length >= 1) {
        if (settings['prevent-orphans-top'] && settings['widow-strictness'] !== 'relaxed') {
          violations.push({ kind: 'orphan-top', target: `page#${page.index}c${c}`, page: page.index, evidence: { colLen: col.length }, ledgerRef: ledger.create('orphan-top', `p${page.index}c${c}`, page.index, { colLen: col.length }, 'protections').issue_id });
        }
      }
      if (last.meta && last.meta.part === 'first') {
        const sameTokenInCol = col.filter(x => x.meta && x.meta.tokenId === last.meta.tokenId).length;
        const alsoOrphanBottom = settings['prevent-orphans-bottom'] && sameTokenInCol === 1;
        if (settings['prevent-widows-bottom'] && !alsoOrphanBottom) {
          violations.push({ kind: 'widow-bottom', target: `page#${page.index}c${c}`, page: page.index, evidence: { colLen: col.length }, ledgerRef: ledger.create('widow-bottom', `p${page.index}c${c}`, page.index, { colLen: col.length }, 'protections').issue_id });
        }
      }
      if (first.meta && first.meta.part === 'rest' && first.isLast) {
        if (settings['prevent-widows-top']) {
          violations.push({ kind: 'widow-top', target: `page#${page.index}c${c}`, page: page.index, evidence: {}, ledgerRef: ledger.create('widow-top', `p${page.index}c${c}`, page.index, {}, 'protections').issue_id });
        }
      }
      if (last.meta && last.meta.part === 'first' && col.filter(x => x.meta && x.meta.tokenId === last.meta.tokenId).length === 1) {
        if (settings['prevent-orphans-bottom']) {
          violations.push({ kind: 'orphan-bottom', target: `page#${page.index}c${c}`, page: page.index, evidence: {}, ledgerRef: ledger.create('orphan-bottom', `p${page.index}c${c}`, page.index, {}, 'protections').issue_id });
        }
      }
    }
    return violations;
  },

  headingEscort(page, settings, ledger) {
    const violations = [];
    for (let c = 0; c < page.columns.length; c++) {
      const col = page.columns[c];
      for (let i = 0; i < col.length; i++) {
        const ln = col[i];
        if (ln.kind === 'heading' && ln.level <= 6) {
          const after = col.slice(i + 1).filter(x => x.kind !== 'heading').length;
          if (after < 2) {
            violations.push({ kind: 'heading-escort', target: `${ln.tokenId || lineToken(ln)}@p${page.index}c${c}`, page: page.index, evidence: { linesAfter: after }, ledgerRef: ledger.create('heading-escort', ln.tokenId || lineToken(ln), page.index, { linesAfter: after }, 'protections').issue_id });
          }
        }
      }
    }
    return violations;
  },

  runtLines(page, settings, ledger) {
    const violations = [];
    const seenRunt = new Set();
    const minPx = (page.template.columns[0].w * settings['runt-min-width-pct']) / 100;
    for (const col of page.columns) {
      for (const ln of col) {
        if (ln.isLast && ln.widthPx < minPx) {
          const key = `${lineToken(ln)}|${(ln.words || []).join(' ')}`;
          if (seenRunt.has(key)) continue;
          seenRunt.add(key);
          // **S11:** textHead = **זנב הפסקה המארחת** (מתוך settings._tokenTexts) —
          // עוגן תוכן יציב לזיהוי הממצא בין הרצות: העברת מילה בין פסקאות משנה
          // את זנב הנותן/המקבל בלבד; שאר הפסקאות שומרות על זהותן. המפל לכתחילה:
          // מילות השורה (כשאין מפת טוקנים).
          const tokAnchors = settings._tokenTexts
            ? settings._tokenTexts.get(lineToken(ln)) : null;
          const textHead = (tokAnchors && tokAnchors.tail)
            || (ln.words || []).join(' ').slice(0, 40);
          violations.push({ kind: 'runt-line', target: `line@${lineToken(ln)}`, page: page.index, evidence: { widthPx: Math.round(ln.widthPx), minPx: Math.round(minPx), textHead }, ledgerRef: ledger.create('runt-line', lineToken(ln) || 'unknown', page.index, { widthPx: ln.widthPx, textHead }, 'protections').issue_id });
        }
      }
    }
    return violations;
  },

  /**
   * סמן הערה אינו יחידה האחרונה בשורה (BRZ-11) — **לכל הסגנונות** (P1-3).
   * בעבר רק א׳ היה מוגן; הסמנים בפועל ([1] וכד') לא.
   */
  markerLineBreak(page, settings, ledger) {
    const violations = [];
    for (const col of page.columns) {
      for (const ln of col) {
        const words = ln.words || [];
        if (words.length && isNoteMarkerWord(words[words.length - 1])) {
          violations.push({
            kind: 'note-marker-line-break', target: `line@${lineToken(ln)}`, page: page.index,
            evidence: { lastWord: words[words.length - 1] },
            ledgerRef: ledger.create('note-marker-line-break', lineToken(ln) || 'unknown', page.index, { lastWord: words[words.length - 1] }, 'protections').issue_id
          });
        }
      }
    }
    return violations;
  },

  /**
   * **P0-3 — שמירת סדר הקריאה:** כל שורה מתויגת seq (סדר הצבה). הליכה
   * בסדר קריאה (col0 מלמעלה למטה, אחר־כך col1) חייבת להיות לא־יורדת ב‑seq.
   */
  readingOrder(page, settings, ledger) {
    const violations = [];
    let prev = -1;
    for (const col of page.columns) {
      for (const ln of col) {
        if (ln.seq == null) continue; // שורות שהוצבו לפני התיוג (תאימות לאחור) — לא נבדקות
        if (ln.seq < prev) {
          violations.push({
            kind: 'reading-order-break', target: `page#${page.index}@seq${ln.seq}`, page: page.index,
            evidence: { lineSeq: ln.seq, prevSeq: prev },
            ledgerRef: ledger.create('reading-order-break', `p${page.index}@seq${ln.seq}`, page.index, { lineSeq: ln.seq, prevSeq: prev }, 'protections').issue_id
          });
        }
        prev = Math.max(prev, ln.seq);
      }
    }
    return violations;
  },

  parenConsistency(page, settings, ledger) {
    const violations = [];
    // זוג סוגריים שהופרד בין טורים/עמודים — מדווח (אינו מתוקן אוטומטית)
    for (const p of (page.parenRanges || [])) {
      if (p.startCol !== p.endCol || p.startPage !== p.endPage) {
        violations.push({ kind: 'paren-cross-boundary', target: `paren@${p.id}`, page: page.index, evidence: { start: [p.startPage, p.startCol], end: [p.endPage, p.endCol] }, ledgerRef: ledger.create('paren-cross-boundary', p.id, page.index, p, 'protections').issue_id });
      }
    }
    return violations;
  },

  imbalance(page, settings, ledger) {
    const d = pageImbalance(page);
    if (d > settings['imbalance-max-delta-px'] && !page.terminalResidual && page.type !== 'filler') {
      return [{ kind: 'column-imbalance', target: `page#${page.index}`, page: page.index, evidence: { delta: d }, ledgerRef: ledger.create('column-imbalance', `p${page.index}`, page.index, { delta: d }, 'protections').issue_id }];
    }
    return [];
  },

  containment(page, settings, ledger) {
    const out = [];
    const cap = page.template.contentBox.height;
    for (let c = 0; c < page.columns.length; c++) {
      const u = usedHeight(page.columns[c]);
      if (u > cap + 0.5) out.push({ kind: 'containment', target: `page#${page.index}c${c}`, page: page.index, evidence: { used: u, cap }, ledgerRef: ledger.create('containment', `p${page.index}c${c}`, page.index, { used: u, cap }, 'protections').issue_id });
    }
    return out;
  },

  /**
   * **P1-8 — page-underfill נפק בפועל:** עמוד שטוריו מלאים פחות מ‑40% מהקיבולת
   * (ואינו פתיחת חלק/שער, אינו terminalResidual ואינו filler) ⇒ ממצא underfill.
   * בעבר הסוג היה רשום בקטלוג אך אף קוד לא ייצר אותו.
   */
  pageUnderfill(page, settings, ledger) {
    if (page.type === 'filler' || page.terminalResidual || page.chapterOpening) return [];
    if (page.type === 'shaar-main' || page.type === 'shaar-sub' || page.type === 'preface') return [];
    const cap = page.template.contentBox.height;
    const hasContent = page.columns.some(c => c.length);
    if (!hasContent) return [];
    const maxUsed = Math.max(...page.columns.map(c => usedHeight(c)));
    if (maxUsed < cap * 0.4) {
      return [{
        kind: 'page-underfill', target: `page#${page.index}`, page: page.index,
        evidence: { used: Math.round(maxUsed), cap, pct: Math.round((maxUsed / cap) * 100) },
        ledgerRef: ledger.create('page-underfill', `p${page.index}`, page.index, { used: Math.round(maxUsed), cap }, 'protections').issue_id
      }];
    }
    return [];
  }
};

function lineToken(ln) {
  if (ln.tokenId != null) return ln.tokenId;
  if (ln.meta && ln.meta.tokenId != null) return ln.meta.tokenId;
  return '';
}

/**
 * הרצת כל ההגנות על עמוד. @returns {{violations:Array, fired:string[]}}
 */
function runProtections(page, settings, ledger) {
  const violations = [];
  const fired = [];
  for (const [name, fn] of Object.entries(CHECKS)) {
    const v = fn(page, settings, ledger);
    if (v.length) fired.push(name);
    violations.push(...v);
  }
  return { violations, fired };
}

module.exports = { runProtections, CHECKS, isNoteMarkerWord };

};
__modules["src/engine/layout/balancing.js"] = function (require, module, exports) {
// src/engine/layout/balancing.js — AutoQuality (Gold port, שלוש שכבות) + StretchPageToBottom clamp + chapter-end modes
'use strict';

/**
 * AQ: stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים;
 * Clamp overshoot 20px (REQ-BAL-07); balance-chapter-end {balance|stretch|natural} (REQ-BAL-03).
 */

const { moveLineForward } = require('./ordering');

function usedHeight(col) { return col.reduce((s, ln) => s + ln.heightPx, 0); }

/** הערכת "איזון" עמוד: הפרש גובה טורים. */
function pageImbalance(page) {
  if (!page.columns || page.columns.length < 2) return 0;
  return Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1]));
}

/**
 * איזון מלא של עמוד: הזזת שורות עד Δ≤maxDelta; נסיגה אם נוצרה חריגת תקציב
 * (rollback integrity REQ-BAL-09).
 * **תיקון P0-3:** הזזות קדימה בסדר הקריאה בלבד (moveLineForward) — בעבר
 * האיזון העביר שורה אחורה בסדר הקריאה (הצגת סוף פסקה לפני תחילתה).
 * @returns {{changed:boolean, before:number, after:number}}
 */
function balancePage(page, maxDelta) {
  const before = pageImbalance(page);
  const snapshot = page.columns.map(c => c.slice());
  let guard = 0;
  while (pageImbalance(page) > maxDelta && guard++ < 500) {
    const a = usedHeight(page.columns[0]), b = usedHeight(page.columns[1]);
    const hi = a >= b ? 0 : 1, lo = 1 - hi;
    if (!moveLineForward(page.columns, hi, lo)) break;
    // hard reject: אם נוצרה חריגת cap → rollback מלא
    const cap = page.template.contentBox.height;
    if (page.columns.some(c => usedHeight(c) > cap + 0.5)) {
      page.columns = snapshot;
      return { changed: false, before, after: before, rollback_reason: 'capacity' };
    }
  }
  return { changed: true, before, after: pageImbalance(page) };
}

/**
 * balance-chapter-end mode ∈ {balance, stretch, natural} (REQ-BAL-03):
 * - balance: איזון רגיל
 * - stretch: איזון + AQ word-spacing (עד cap)
 * - natural: ללא איזון בסוף פרק (K-4: אין למתוח פרק קצר רק למילוי)
 */
function applyChapterEndMode(page, mode, settings, eventLog) {
  if (mode === 'natural') { eventLog.emit('balance', 'chapter-end-natural', { page: page.index }); return { mode, delta: pageImbalance(page) }; }
  const r = balancePage(page, settings['imbalance-max-delta-px']);
  if (mode === 'stretch' && settings['aq-enabled']) {
    autoQualityPass([page], settings, eventLog);
  }
  eventLog.emit('balance', `chapter-end-${mode}`, { page: page.index, ...r });
  return { mode, ...r };
}

/**
 * AutoQuality (פורטר מ‑Gold; כל הגבולות מה‑registry):
 * שלבים stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים + shared-load + clamp overshoot.
 */
const AQ_STAGES = ['word-spacing', 'letter-spacing', 'heading-spacing'];

/** \u05d2\u05d1\u05d5\u05dc\u05d5\u05ea \u05de\u05d5\u05db\u05e8\u05d6\u05ea \u05d0\u05d7\u05e8\u05ea \u05dc\u05db\u05dc \u05e9\u05dc\u05d1 — \u05d2\u05d9\u05e9\u05d4 \u05de\u05e4\u05d5\u05e8\u05e9\u05ea (settings['aq-*'])
 * \u05db\u05da \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05e8\u05d5\u05d0\u05d4 \u05e6\u05e8\u05d9\u05db\u05d4 \u05d0\u05de\u05d9\u05ea\u05d4 (\u05d1\u05e2\u05d1\u05e8 \u05d4\u05d9\u05d4 \u05d0\u05d9\u05e0\u05d3\u05d5\u05e7\u05d8\u05e8\u05d9\u05d9\u05d0\u05df \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05dc\u05d0 \u05e8\u05d0\u05d4 — P0-5). */
function stageBounds(settings, stage) {
  switch (stage) {
    case 'word-spacing': return [settings['aq-word-spacing-min'], settings['aq-word-spacing-max']];
    case 'letter-spacing': return [settings['aq-letter-spacing-min'], settings['aq-letter-spacing-max']];
    case 'heading-spacing': return [settings['aq-heading-spacing-min'], settings['aq-heading-spacing-max']];
    default: return [0.95, 1.05];
  }
}

function autoQualityPass(pages, settings, eventLog) {
  if (!settings['aq-enabled']) return { applied: 0 };
  const clamp = settings['aq-overshoot-clamp-px'];
  // D-46 (תיקון P1-1 "מפתח מת"): שני המפתחים נצרכים כעת בפועל —
  // aq-stretch-to-bottom=false ⇒ אין מתיחה כלל; aq-compress-first ⇒ כיווץ לפני מתיחה.
  const mayStretch = settings['aq-stretch-to-bottom'] !== false;
  const compressFirst = settings['aq-compress-first'] !== false;
  let applied = 0;
  for (const page of pages) {
    const cap = page.template.contentBox.height;
    for (let c = 0; c < page.columns.length; c++) {
      const lines = page.columns[c];
      const used = usedHeight(lines);
      if (!lines.length) continue;
      const deficit = cap - used;
      if (deficit > 4 && mayStretch) {
        const perLine = deficit / lines.length;
        const rawFactor = 1 + perLine / (lines[0].heightPx || 1);
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.min(hi, Math.max(lo, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          const newUsed = used * factor;
          if (newUsed - cap > clamp) continue; // clamp 20px — class ch3p4/p17/ch72p9 הוכחד
          if (settings['aq-shared-load']) {
            if (stage !== 'word-spacing') continue;
          } else if (factor >= hi && stage !== 'word-spacing') continue;
          for (const ln of lines) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      } else if (deficit < -4 && compressFirst) {
        // עודף מעל התקרה ⇒ כיווץ עד min (כיווץ לפני מתיחה — compress-first)
        const overflow = -deficit;
        const perLine = overflow / lines.length;
        const rawFactor = Math.max(0.8, 1 - perLine / (lines[0].heightPx || 1));
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.max(lo, Math.min(hi, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          for (const ln of lines) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}-compress`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      }
    }
  }
  return { applied };
}

module.exports = { balancePage, pageImbalance, applyChapterEndMode, autoQualityPass, usedHeight };

};
__modules["src/engine/layout/ordering.js"] = function (require, module, exports) {
// src/engine/layout/ordering.js — Reading-order-preserving column moves (P0-3; D-49)
'use strict';

/**
 * הזזת שורה בין טורים תוך **שמירת סדר הקריאה בלבד** (תיקון P0-3):
 * סדר קריאה: col0 (ימני, נקרא ראשון) מלמעלה למטה, ואז col1.
 *  - טור מוקדם (col0) גבוה יותר ⇒ pop מסופו → unshift לראש col1 (הזזת הגבול קדימה).
 *  - טור מאוחר (col1) גבוה יותר ⇒ shift מראשו → push לסוף col0 (הזזת הגבול אחורה —
 *    השורה עדיין אחרי כל col0 ולפני שאר col1).
 * שתי ההזזות שומרות את סדר המילים בדיוק; בעבר האיזון העביר שורה **אחורה**
 * בסדר הקריאה (הצגת סוף פסקה לפני תחילתה) — רגרסיה שלא הייתה באף גרסה קודמת.
 * מודול עצמאי ללא תלויות — נצרך ע"י dp-planner וגם balancing (מניעת תלות מעגלית).
 */
function moveLineForward(cols, hi, lo) {
  if (hi === lo || cols.length < 2) return false;
  if (hi === 0 && lo === 1) {           // col0 גבוה: סוף col0 → ראש col1
    if (!cols[0] || !cols[0].length) return false;
    cols[1].unshift(cols[0].pop());
    return true;
  }
  if (hi === 1 && lo === 0) {           // col1 גבוה: ראש col1 → סוף col0
    if (!cols[1] || !cols[1].length) return false;
    cols[0].push(cols[1].shift());
    return true;
  }
  return false;
}

module.exports = { moveLineForward };

};
__modules["src/engine/layout/retreat-loop.js"] = function (require, module, exports) {
// src/engine/layout/retreat-loop.js — Unified retreat loop + oscillation detector (S5.1.5, K-3)
'use strict';

/**
 * בקר איטרציה יחיד השולט באינטראקציות: paren-protection ↔ widow/orphan ↔ balance ↔ heading.
 * קריטריון התכנסות: מצב יציב (אין הפרות חדשות שניתן לתקן) או הגעה לתקרת איטרציות.
 * גלאי תנודה: אם אותו ממצא נפתח וניצור חוזר על עצמו >N → הקפאת הפשרה הטובה + רישום 'rollback-compromise'.
 *
 * **תיקון P1-4 (D-43):**
 *  - makeDryLedger יבש **באמת**: הפרות ארעיות שיימחקו בתיקון אינן נרשמות ל‑ledger
 *    האמיתי. רק מה שנשאר בסוף (הקפאה/תקרה/אין־תיקון) נרשם — "לא להציף" בלי להסתיר.
 *  - diagnostics-enabled **אינו רשאי** לדכא רישום ממצאים ("לא להשבית אבחון;
 *    לא להסתיר ממצאים"). המפתח הועבר ל‑audit/report-schema (פירוט הדוח) בלבד.
 *  - debounce-light-change-ms הוסר מהלולאה (D-44) — הגדרת UI של S10; ערבוב
 *    יחידות זמן של ממשק בתוך לולאה סינכרונית היה חסר משמעות.
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
  /** מפת רישומים מהרצה זו: kind@target → record (למניעת כפילויות בין resolved↔persists). */
  const seen = new Map();

  /**
   * dry ledger אמיתי: create() מחזיר רשומת דמה ואינו כותב ל‑ledger האמיתי.
   * ההפרות נאספות בעצם הלולאה (allViolations); רישום אמיתי נעשה רק בסוף
   * למה שנשאר בפועל. אין עוד "העברה בשקט של רישומים ל‑ledger האמיתי" (באג P1-4).
   */
  function makeDryLedger() {
    const dry = Object.create(ledger);
    let drySeq = 0;
    dry.create = (kind, target, page, predicateBefore, stage) => {
      drySeq++;
      return { issue_id: `dry#${drySeq}`, kind, target, page, predicate_before: predicateBefore, stage, dry: true, status: 'created' };
    };
    dry.transition = (issueId) => {
      const rec = { issue_id: issueId, dry: true };
      return rec;
    };
    return dry;
  }

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    const allViolations = [];
    for (const page of pages) {
      const dry = makeDryLedger();
      const vs = assess(page, settings, dry);
      allViolations.push(...vs);
    }
    if (!allViolations.length) {
      eventLog.emit('protections', 'retreat-converged', { iterations: iteration });
      // אין הפרות שנשארו — אין מה לרשום. אם היו נרשמות באיטרציות קודמות ותוקנו,
      // הן נשארות ב‑ledger עם סטטוס resolved (רישום בזמן תיקון — להלן).
      return { converged: true, iterations: iteration, compromise: null };
    }

    const signature = allViolations.map(v => `${v.kind}@${v.target}`).sort().join('|');

    // זיהוי תנודה: החתימה חוזרת על עצמה בתוך חלון
    const recent = history.slice(-OSCILLATION_WINDOW);
    if (recent.some(h => h === signature)) {
      // ping-pong → הקפאת הפשרה הטובה ביותר שנצפתה.
      // **רישום הנשאר:** כל ההפרות בחתימה זו נמשכות — נרשמות עכשיו ל‑ledger האמיתי.
      const persisted = recordRemaining(ledger, allViolations, 'protections', `oscillation freeze @iter${iteration}`, seen);
      const rec = ledger.create('rollback-compromise', `loop@iter${iteration}`, null, { signature }, 'protections');
      ledger.transition(rec.issue_id, 'competing-repair-side-effect', 'protections', 'oscillation detected — freezing best legal compromise');
      eventLog.emit('protections', 'oscillation-detected', { iteration, signature });
      return { converged: false, iterations: iteration, compromise: rec.issue_id, persisted, frozenSignatures: history };
    }

    history.push(signature);
    lastSignature = signature;

    // הפעלת תיקונים לפי סדר עדיפות קבוע (דטרמיניסטי): parens → reading-order → widows → headings → balance
    const kinds = new Set(allViolations.map(v => v.kind));
    const order = ['paren-cross-boundary', 'reading-order-break', 'widow-bottom', 'orphan-top', 'heading-escort', 'column-imbalance'];
    let repairedAny = false;
    for (const kind of order) {
      if (!kinds.has(kind) || !repairFns[kind]) continue;
      const ofKind = allViolations.filter(v => v.kind === kind);
      repairFns[kind](ofKind, ctx);
      repairedAny = true;
      // הפרות מסוג זה טופלו — נרשמות ל‑ledger האמיתי כ‑resolved שקוף
      // (הן היו אמיתיות; רישום התיקון הוא חלק מהשקיפות, לא הסתרה).
      for (const v of ofKind) {
        const key = `${v.kind}@${v.target}`;
        let rec = seen.get(key);
        if (!rec) {
          rec = ledger.create(v.kind, v.target, v.page != null ? v.page : null, v.evidence || {}, 'protections');
          seen.set(key, rec);
        }
        ledger.transition(rec.issue_id, 'resolved', 'protections', `repaired in iter#${iteration} (${kind})`);
      }
    }
    // הפרות ללא פונקציית־תיקון (דוקטרינת "מדווח, לא מתוקן") — ייבדקו שוב באיטרציה
    // הבאה; אם הן נשארות עד הקפאה/תקרה — יירשמו אז (recordRemaining).
    if (!repairedAny && !kinds.has('column-imbalance')) {
      // אין שום תיקון אפשרי לאף הפרה — הקפאה מיידית (מניעת לולאה ריקה).
      // **S8:** אי־התכנסות היא פשרה לכל דבר — נרשמת כ‑rollback-compromise
      // ("לא להסתיר ממצאים"; בעבר הוחזר compromise:null והקפאה עברה בשקט).
      const persisted = recordRemaining(ledger, allViolations, 'protections', `no repair available @iter${iteration}`, seen);
      const signatureNow = allViolations.map(v => `${v.kind}@${v.target}`).sort().join('|');
      const rec = ledger.create('rollback-compromise', `loop@iter${iteration}`, null, { signature: signatureNow, reason: 'no repair available' }, 'protections');
      ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no repair function for remaining violations — frozen (documented compromise)');
      eventLog.emit('protections', 'retreat-frozen', { iteration, violationCount: allViolations.length, compromise: rec.issue_id });
      return { converged: false, iterations: iteration, compromise: rec.issue_id, persisted };
    }
    eventLog.emit('protections', 'retreat-iteration', { iteration, violationCount: allViolations.length });
  }

  // תקרה ללא התכנסות — פשרה אחרונה; ההפרות שנשארו נרשמות במלואן
  const persisted = recordRemaining(ledger, allViolations, 'protections', `max iterations (${MAX_ITERATIONS}) reached`, seen);
  const rec = ledger.create('rollback-compromise', 'loop-ceiling', null, { lastSignature }, 'protections');
  ledger.transition(rec.issue_id, 'unresolved', 'protections', 'max iterations reached');
  return { converged: false, iterations: iteration, compromise: rec.issue_id, persisted };
}

/** רישום הפרות שנשארו בסוף — הממצאים האמיתיים של הדוח. אף פעם לא מדוכא.
 *  אם הפרה נרשמה כבר כ‑resolved וחזרה — מעבר reintroduced→persists על אותו רישום
 *  (מחזור חיים אחד, לא כפילויות). */
function recordRemaining(ledger, violations, stage, reason, seen) {
  const ids = [];
  for (const v of violations) {
    const key = `${v.kind}@${v.target}`;
    let rec = seen ? seen.get(key) : undefined;
    if (!rec) {
      rec = ledger.create(v.kind, v.target, v.page != null ? v.page : null, { ...(v.evidence || {}), reason }, stage);
      if (seen) seen.set(key, rec);
      ledger.transition(rec.issue_id, 'persists', stage, reason);
    } else {
      ledger.transition(rec.issue_id, 'reintroduced', stage, reason);
      ledger.transition(rec.issue_id, 'persists', stage, reason);
    }
    ids.push(rec.issue_id);
  }
  return ids;
}

module.exports = { runRetreatLoop, MAX_ITERATIONS, OSCILLATION_WINDOW };

};
__modules["src/engine/layout/candidate-generator.js"] = function (require, module, exports) {
// src/engine/layout/candidate-generator.js — Split-candidate scoring with capacity evidence (S5.1.2 core, registered S4)
// עקרון אנטי־טלאי: overflow = HARD reject (לא ×2000 soft כ ב‑V1), כל דחייה נרשמת ל‑ledger עם נימוס.
'use strict';

const { blockGapPx } = require('./column-flow');

/**
 * מחזיר מועמדי פיצול לבלוק בתוך טור:
 *  - נקודות שבירה = סוף שורה (L3 line boxes)
 *  - scoring = f(Δ height, capacityBefore/capacityAfter justify, next-block context)
 *  - ladder עונשין: whole-paragraph moves > line moves > leading > para-spacing
 *
 * @param {object} blk        בלוק עם .lines (נמדדו)
 * @param {number} cur        שורות שנכנסות כרגע לטור
 * @param {number} colCapacityPx
 * @param {object} settings
 * @param {object} ledger     Ledger (core/ledger) — כתיבת סיבה לכל דחייה (S5.1.10)
 */
function generateCandidates(blk, cur, colCapacityPx, settings, ledger) {
  const out = [];
  const lineH = blk.lineHeightPx || 20;
  const gap = blockGapPx(settings, lineH);
  for (let cut = 2; cut < blk.lines.length; cut++) {
    const before = blk.lines.slice(0, cut).reduce((s, l) => s + (l.heightPx || lineH), 0) + gap;
    const after = blk.lines.slice(cut).reduce((s, l) => s + (l.heightPx || lineH), 0);
    // HARD reject: overflow אינו נענש במשקל אלא נפסל לחלוטין (D-11)
    if (before > colCapacityPx) {
      if (ledger) ledger.create('candidate-rejected', `${blk.tokenId}@${cut}`, null, { why: 'overflow-before', before, cap: colCapacityPx }, 'candidate-gen');
      continue;
    }
    // justify capability: האם הטור שלפני יכול להצדיק (להגיע לקצה) — p376-class reasoning
    const capacityBefore = colCapacityPx - before;
    const score = Math.abs(capacityBefore - (colCapacityPx - after))
      + (settings['widow-strictness'] === 'strict' && cut < 2 ? 1e9 : 0);
    out.push({ cut, before, after, capacityBefore, capacityAfter: colCapacityPx - after, score });
  }
  out.sort((a, b) => a.score - b.score);
  return out;
}

module.exports = { generateCandidates };

};
__modules["src/engine/layout/column-flow.js"] = function (require, module, exports) {
// src/engine/layout/column-flow.js — Column geometry + block→column flow (S4 consumers registration)
// צרכנים אמיתיים: grid-col-width-pct, grid-gutter-pct, grid-block-gap-pct
'use strict';

const { buildPageTemplate } = require('./page-templates');

/**
 * רוחב טור יחיד בפיקסלים מתוך settings (מקור־האמת יחיד שמשמש גם dp-planner וגם pipeline).
 * grid-col-width-pct: אחוז רוחב טור מתוך שטח התוכן (צמוד ל‑PT-01..PT-10).
 * grid-gutter-pct: בולטה בין הטורים.
 */
function columnWidths(settings, pageWidthPx, contentWidthPx) {
  const gutter = (contentWidthPx * settings['grid-gutter-pct']) / 100;
  const cw = (contentWidthPx * settings['grid-col-width-pct']) / 100;
  return { colW: cw, gutter, totalUsed: cw * 2 + gutter, pageWidthPx };
}

/**
 * מרווח אנכי בין בלוקים בתוך טור (פסקה↔פסקה). נצרך ע"י flowing: כל בלוק חדש
 * בטור פותח ב‑gap הזה אלא אם הוא הראשון בטור.
 */
function blockGapPx(settings, lineH) {
  // grid-block-gap-pct נתון באחוזי גובה־שורת־גוף כדי שיישאר פרופורציונלי לגודל דפוס
  return Math.round((Number(settings['grid-block-gap-pct']) || 0) / 100 * lineH * 10);
}

/**
 * האם בלוק חוסם מעבר טור רגיל (full-width headings H1/H2 לפי mode).
 */
function isFullWidthBlock(block, settings) {
  if (block.kind === 'heading') {
    const mode = settings[`heading-${block.level}-mode`];
    return mode === 'full-width' || mode === 'new-page';
  }
  return block.fullWidth === true;
}

module.exports = { columnWidths, blockGapPx, isFullWidthBlock, buildPageTemplate };

};
__modules["src/engine/notes/markers.js"] = function (require, module, exports) {
// src/engine/notes/markers.js — Unified note-marker module (S7.1.5/6, REQ-FN-05/06; D-30/D-41)
'use strict';

/**
 * מקור־הסמכות היחיד לסמני הערות בכל המוצר: גוף, מרזב, עמודי הערות.
 * לפני האיחוד היו שלושה ממירים שונים (pipeline `[n]` קשיח, dom-renderer markerFor,
 * endnote-pages formatMarker) — מה שגרם לאי־עקביות מספור בין גוף לעמודי הערות (P1-3).
 * כל שינוי סגנון/מדיניות נעשה כאן בלבד; כל הצרכנים קוראים מכאן (single source).
 */

const HEB_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];

/** סמן בודד לפי סגנון הרישום (footnote-marker-style). */
function markerFor(index1Based, style) {
  switch (style) {
    case 'decimal': return String(index1Based);
    case 'parenthesis': return `(${index1Based})`;
    case 'asterisk': {
      const n = ((index1Based - 1) % 3) + 1; // *,**,*** ואז חוזר — policy מקובלת
      return '*'.repeat(n) + (index1Based > 3 ? String(Math.ceil(index1Based / 3)) : '');
    }
    case 'hebrew-geresh':
    default: {
      let i = index1Based - 1, s = '';
      if (i < 0) return 'א׳';
      do { s = HEB_LETTERS[i % 22] + s; i = Math.floor(i / 22) - 1; } while (i >= 0);
      return `${s}\u05F3`; // גרש — סמן (לא מספר עמוד); תמיד אות+גרש
    }
  }
}

/**
 * מספור לפי מדיניות איפוס (footnote-reset-policy):
 *  - continuous: מונה כלל־מסמך אחד.
 *  - page:       איפוס בכל עמוד (מרזב).
 *  - section/part: איפוס בכל חלק (H1) — ברירת מחדל לעמודי הערות; shaar-sub ייתמך ב‑S8.
 * מחזיר פונקציית next() שמקבלת הקשר {page, part} ומנפיקה מספור 1‑based.
 */
function makeCounter(policy, start = 0) {
  let counter = start;
  let lastKey = null;
  const scopeKey = (ctx) => {
    switch (policy) {
      case 'page': return `p${ctx && ctx.page != null ? ctx.page : '?'}`;
      case 'section':
      case 'part': return `b${ctx && ctx.part != null ? ctx.part : '?'}`;
      default: return 'doc'; // continuous
    }
  };
  return function next(ctx = {}) {
    const key = scopeKey(ctx);
    if (policy === 'page' || policy === 'section' || policy === 'part') {
      if (lastKey !== null && key !== lastKey) counter = 0; // איפוס בהחלפת היקף
    }
    lastKey = key;
    counter++;
    return counter;
  };
}

/**
 * פיצול placeholder `סמן:טקסט` לייצוג מנייה (D-30): הסמן נספר פעם אחת (בגוף,
 * בעוגן), טקסט ההערה נספר פעם אחת ממקום הצגתו. הפורמט בגוף: `${marker}:${text}`
 * עם \uE000 בין המרכיבים — מדידה אטומית, ופיצול בניתוח לשם זהות צדדים.
 */
function splitPlaceholder(word) {
  const s = String(word).replace(/\u00A0/g, ' ');
  const at = s.indexOf(':');
  if (at > 0 && !s.startsWith('http')) return { marker: s.slice(0, at), text: s.slice(at + 1) };
  return null;
}

module.exports = { markerFor, makeCounter, splitPlaceholder, HEB_LETTERS, MARK_TAG: '\uE102' };

};
__modules["src/engine/layout/footnote-budget.js"] = function (require, module, exports) {
// src/engine/layout/footnote-budget.js — Footnote reservation (REQ-FN-01/02/07)
'use strict';

/**
 * **מקור־הסמכות היחיד לתקציב המרזב** (תיקון P1-1): הן probe הן reservation
 * עוברים כאן — getFootnotesReservedHeight — וה‑dp-planner קורא לזה בלבד
 * (בעבר היו שני מימושים מקבילים: כאן ו‑recomputeFnBudget מקומי, והבדיקה
 * probe==reserved רצה על מודול שהמנוע לא השתמש בו).
 * כולל הערות של הפסקה הנמדדת כעת (לקח V2/V4).
 * מדיניות הערה ארוכה (split/move-whole/reject-to-body) מיושמת ב‑dp-planner
 * **בזמן ההצבה** — המודול הזה אינו מחזיק עוד מימוש תאום מת (באג S6).
 */

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font). */
const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

function noteHeight(note, settings, measure) {
  const size = settings['body-font-size-pt'] * 0.8; // גופן הערה קטן
  const lh = Math.round(size * (96 / 72) * 1.25);
  const words = String(note.text).replace(/\uE000/g, ' ').split(/\s+/).filter(Boolean);
  const colW = laneWidth(settings);
  const factor = NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1;
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = measure(word, size) * factor;
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lh;
}

/** רוחב נתיב אחד במרזב לפי footnote-columns (1 ⇒ רוחב מלא; 2 ⇒ חצי). */
function laneWidth(settings) {
  const base = settings._fnColWidthPx || 200;
  return settings['footnote-columns'] === 2 ? base : base;
  // _fnColWidthPx כבר מכוין לפי המספר טורים במרזב (הpipeline מזרים) — נשמר כאן כפשוטו.
}

/**
 * getFootnotesReservedHeight — הזהה ל‑probe (BRZ: no divergence):
 * @param {Array} pageNotes - [{text, marker}]
 */
function getFootnotesReservedHeight(pageNotes, settings, measure) {
  if (!settings['footnotes-enabled']) return 0;
  if (!pageNotes || !pageNotes.length) return 0;
  const cols = settings['footnote-columns'];
  const heights = pageNotes.map(n => n.heightPx != null ? n.heightPx : noteHeight(n, settings, measure));
  if (cols === 1) return heights.reduce((a, b) => a + b, 0);
  // 2 טורים: חלוקה שווה־גובה (greedy LPT דטרמיניסטית)
  const t = [0, 0];
  for (const h of [...heights].sort((a, b) => b - a)) { const i = t[0] <= t[1] ? 0 : 1; t[i] += h; }
  return Math.max(t[0], t[1]);
}

module.exports = { getFootnotesReservedHeight, noteHeight, laneWidth, NOTE_FONT_FACTORS };

};
__modules["src/engine/decoration/folio.js"] = function (require, module, exports) {
// src/engine/decoration/folio.js — Page numbering: Hebrew letters, frames, positions, initial value (REQ-HDR-03/04, S9)
'use strict';

const UNITS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUND = ['', 'ק', 'ר', 'ש', 'ת', 'תר', 'תש', 'תת', 'תתק'];

/**
 * מספר עברי (D-37):
 *  - אות בודדת ⇒ אות + גרש (׳): א׳=1, כ׳=20, ת׳=400.
 *  - שתי אותיות ומעלה ⇒ גרשיים (״) לפני האות האחרונה: ט״ו=15, ט״ז=16, כ״א=21, תש״ב=702, תשמ״ב=742.
 *  - 15/16 ⇒ ט״ו/ט״ז (לא יה+וו).
 *  - אלפים: אלפים + ׳ ואז שארית המספר: 5702 ⇒ ה׳תש״ב; 1000 ⇒ א׳; 1001 ⇒ א׳א.
 *  תיקון P1-8: גרשיים עבריים ״ (U+05F4) במקום מרכאות לטיניות "; טיפול באלפים.
 */
function toHebrewNumber(n) {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let thousands = '';
  let rest = n;
  if (n >= 1000) {
    // סימן אלפים: גרש אחרי חלק האלפים — אלא אם כבר ישנו (5 ⇒ ה׳ כבר עם גרש; 12 ⇒ י״ב עם גרשיים)
    let t = toHebrewNumber(Math.floor(n / 1000));
    if (!/[\u05F3\u05F4]$/.test(t)) t += '\u05F3';
    thousands = t;
    rest = n % 1000;
    if (rest === 0) return thousands;
  }
  let out = '';
  while (rest >= 800) { out += 'ת'; rest -= 400; } // 800+=ת"ת
  if (rest >= 400) { out += 'ת'; rest -= 400; }
  if (rest >= 100) { out += HUND[Math.floor(rest / 100)]; rest %= 100; }
  if (rest === 15) { out += 'טו'; return finish(thousands, out); }
  if (rest === 16) { out += 'טז'; return finish(thousands, out); }
  const tens = Math.floor(rest / 10) * 10, unit = rest % 10;
  if (tens && unit) out += TENS[tens / 10] + UNITS[unit];
  else out += TENS[tens / 10] + UNITS[unit];
  return finish(thousands, out);
}

/** הרכבה סופית: גרש/גרשיים לפי מספר האותיות + צירוף אלפים.
 *  שארית של אות בודדת אחרי סימן אלפים (1001 ⇒ א׳א) לא מקבלת גרש משלה —
 *  סימן האלפים כבר מסמן את המספר כולו (D-37). */
function finish(thousands, letters) {
  let body = letters;
  if (thousands && body.length === 1) {
    // א׳א (1001), ה׳ב (5002) — אות שארית בודדת בלי גרש נוסף
  } else if (body.length === 1) {
    body = body + '\u05F3';            // אות בודדת ⇒ גרש
  } else if (body.length >= 2) {
    body = body.slice(0, -1) + '\u05F4' + body.slice(-1); // גרשיים לפני האות האחרונה
  }
  return thousands ? thousands + body : body;
}

function formatPageNumber(value, settings) {
  switch (settings['page-num-format']) {
    case 'decimal': return String(value);
    case 'daf-hebrew': return `דף ${toHebrewNumber(value)}`;
    default: return toHebrewNumber(value);
  }
}

/** מסגרות CSS (badge) לעומת מסגרות טקסטואליות (D-61):
 *  circle/square — טבעת/תיבה מצוירות ב‑CSS (class folio--frame-*), הטקסט עצמו לא משתנה;
 *  parenthesis/squares/floral/diamond — תווית טקסטואלית סביב המספר. */
function isCssFrame(frame) {
  return frame === 'circle' || frame === 'square';
}

function frameNumber(text, frame) {
  switch (frame) {
    case 'parenthesis': return `(${text})`;
    case 'squares': return `[${text}]`;
    case 'floral': return `\u2766 ${text} \u2766`;
    case 'diamond': return `\u25C7 ${text} \u25C7`;
    default: return text; // none / circle / square — circle ו־square מצוירים ב‑CSS
  }
}

/** תווית תצוגה ל‑TOC — תמיד לפי פורמט המספור, בלי מסגרת (המסגרת שייכת לגיליון בלבד). */
function tocPageLabel(value, settings) {
  return formatPageNumber(value, settings);
}

/**
 * הקצאת מספרים לפי כללי count/show per type (shaar/toc/endnotes checkboxes).
 * **D-36:** עמודי פתיחה (פרק/סימן, chapterOpening) — נספרים אך לא מציגים גיליון.
 * **S9 (D-61) — שחזור נוסחת V1 (REQ-HDR-03):** לכל עמוד נספר נספר סוד (ordinal)
 * עולה. הערך האפקטיבי = סוד − start‑idx + initial‑value; הגיליון מוצג רק כאשר
 * סוד ≥ start‑idx (ב‑V1: `pNum >= startIdx`, formatPageNumberDisplay).
 * **S9 (D-62):** עמודי toc-general/toc-detail מציגים גיליון רק אם נספרים
 * (count-toc-pages) וגם show-numbering שלהם דלוק (Orange eb21383 wiring).
 * @param {Array} pages - [{type, template:{counts}, chapterOpening}]
 */
function assignNumbers(pages, settings) {
  const startIdx = Math.max(1, Math.round(settings['page-num-start-idx'] || 1));
  const initialValue = Math.round(settings['page-num-initial-value'] || 1);
  const posNone = settings['page-num-position'] === 'none';
  let ordinal = 0;
  return pages.map(p => {
    const tpl = p.template;
    let counted = !!tpl.counts;
    if (p.type === 'shaar-main' || p.type === 'shaar-sub' || p.type === 'shaar-back') counted = counted && settings['count-shaar-pages'];
    if (p.type === 'toc-general') counted = counted && settings['count-toc-pages'];
    if (p.type === 'toc-detail') counted = counted && settings['count-toc-pages'];
    if (p.type === 'endnotes') counted = counted && (settings['count-endnote-pages'] === true);
    if (p.type === 'custom' && p.counted === false) counted = false; // PT-09: "האם נספר" — לפי ההגדרה
    if (!counted) return { page: null, ordinal: null, display: '', shown: false, counted: false };
    ordinal++; // סוד העמוד הנספר (1 ואילך)
    const effective = ordinal - startIdx + initialValue;
    // D-36: פתיחת פרק/סימן — נספר, לא מוצג; עמודי הערות לא מציגים כותרת עליונה ממילא
    const suppressDisplay = p.chapterOpening === true;
    // D-62: show-numbering של עמודי תוכן־העניינים (מוחל רק כשנספרים)
    let showFlag = true;
    if (p.type === 'toc-general') showFlag = settings['general-toc-show-numbering'] !== false;
    if (p.type === 'toc-detail') showFlag = settings['detailed-toc-show-numbering'] !== false;
    const visible = ordinal >= startIdx; // V1: הצגה רק מ‑start‑idx ואילך
    const display = visible ? frameNumber(formatPageNumber(effective, settings), settings['page-num-frame']) : '';
    return {
      page: effective,
      ordinal,
      display,
      shown: !posNone && visible && !suppressDisplay && showFlag,
      counted: true,
    };
  });
}

module.exports = {
  toHebrewNumber, formatPageNumber, frameNumber, tocPageLabel,
  isCssFrame, assignNumbers,
};

};
__modules["src/engine/decoration/headers-builder.js"] = function (require, module, exports) {
// src/engine/decoration/headers-builder.js — Running heads recto/verso 3×2 (REQ-HDR-01/02, S9)
'use strict';

/**
 * **S9 (D-61) — עצמאות מלאה של כל סלוט:** לכל אחד מששת הסלוטים (recto/verso × ימין/מרכז/שמאל):
 * מקור, יישור, גופן, גודל, רוחב% וטקסט־מותאם — כולל סלוט המרכז בו־ורסו
 * (**תיקון IMUD bc7892f נעול לנצח:** בכל הגרסאות הקודמות הפקדים של סלוט‑המרכז‑בו־ורסו
 * היו קיימים ב‑UI אך לא נקראו מעולם — גודל הגופן והטקסט המותאם הוזנקו).
 *
 * מקורות (REQ-HDR-02): none / book-name (חלק ראשי לפי פיצול במקף) / book-name-rest
 * (החלק שאחרי המקף) / h1 (מצב main|full לפי hdr-h1-title-mode) / h2 / page-num /
 * first-word / last-word / first-last-words (פורט IMUD fillHeaderFirstLastWords:
 * "ראשונה – אחרונה") / custom (טקסט מותאם **לסלוט זה**).
 */

/** חלוקת שם במקף ראשון: main = לפני המקף, rest = אחריו (Orange extractH1TitleMain ✓). */
function extractH1TitleMain(text, mode = 'main') {
  if (mode === 'full') return text;
  const parts = String(text).split(/\s+[-–—]\s+/);
  return parts[0] || text;
}
function extractTitleRest(text) {
  const parts = String(text).split(/\s+[-–—]\s+/);
  return parts.length > 1 ? parts.slice(1).join(' – ') : '';
}

/** גידוע מעגליות same_as (Orange c49b79e): מפת ירושה חד‑כיוונית + seen-set.
 *  ב‑Red הירושה היחידה היא verso→recto (header-verso-same-as-recto), כך שמבנית
 *  אין מעגל — אך הגידוע מפורש ונבדק כך שהוספת ירושה עתידית לא תוכל ליצור לולאה. */
function resolveSameAs(side, settings) {
  const seen = new Set([side]);
  let cur = side;
  while (cur === 'verso' && settings['header-verso-same-as-recto']) {
    cur = 'recto';
    if (seen.has(cur)) return side; // מעגליות — נשברת: חזרה לצד המקורי
    seen.add(cur);
  }
  return cur;
}

/** ניקוי פיסוק קצה (פורט TRIM מ־IMUD fillHeaderFirstLastWords):
 *  מילת פתיחה/סיום של עמוד לא נפתחת או מסתיימת בסימני פיסוק/מרכאות/סוגריים. */
const EDGE_PUNCT = /^[\s"'“”‘’(){}\[\]<>.,;:!?\-–—…]+|[\s"'“”‘’(){}\[\]<>.,;:!?\-–—…]+$/g;
function trimEdgePunctuation(word) {
  return String(word == null ? '' : word).replace(EDGE_PUNCT, '');
}

/** פורט fillHeaderFirstLastWords (IMUD, הועבר מ‑V20.4): "מילה ראשונה – מילה אחרונה".
 *  עמוד ללא טקסט ⇒ ריק. מילה יחידה ⇒ היא בלבד. */
function firstLastWordsText(firstWord, lastWord) {
  const f = trimEdgePunctuation(firstWord);
  const l = trimEdgePunctuation(lastWord);
  if (f && l && f !== l) return `${f} \u2013 ${l}`;
  return f || l;
}

function resolveSlot(source, ctx, settings, slotKey) {
  switch (source) {
    case 'none': return '';
    case 'book-name': return extractH1TitleMain(ctx.bookName || '', 'main');
    case 'book-name-rest': return extractTitleRest(ctx.bookName || '');
    case 'h1': return extractH1TitleMain(ctx.h1 || '', settings['hdr-h1-title-mode']);
    case 'h2': return ctx.h2 || '';
    case 'page-num': return ctx.pageNumber || '';
    case 'first-word': return ctx.firstWord || '';
    case 'last-word': return ctx.lastWord || '';
    case 'first-last-words': return firstLastWordsText(ctx.firstWord, ctx.lastWord);
    case 'custom': return slotKey ? String(settings[slotKey] || '') : (ctx.customText || '');
    default: return '';
  }
}

/** האם העמוד נפתח בכותרת H2/H3 (שורת התוכן הראשונה בסדר קריאה) — לכותרת הייעודית. */
function pageOpensWithH2H3(page) {
  const lv = page && page.opensWithHeadingLevel;
  return lv === 2 || lv === 3;
}

/**
 * בניית כותרת עליונה לעמוד.
 * @param {object} page - {index,isRecto,type,firstWord,lastWord,h1,h2,pageNumberDisplay,
 *                          opensWithHeadingLevel,template:{hasRunningHead}}
 * @param {object} settings
 * @param {object} ctx - {bookName}
 * @returns {{side,slots:{right,center,left},separator}|null}
 *          slot = {source,text,align,widthPct,font,sizePt,customText}
 */
function buildHeader(page, settings, ctx) {
  if (!settings['header-enabled'] || !page.template.hasRunningHead) return null;
  const physical = page.isRecto ? 'recto' : 'verso';
  // REQ-HDR-02: עמוד הנפתח ב‑H2/H3 + header-opening-dedicated ⇒ סלוטי מקור ייעודיים
  const dedicated = settings['header-opening-dedicated'] === true && pageOpensWithH2H3(page);
  // **D-36 + REQ-HDR-02:** עמוד פתיחה (פרק/סימן) ללא כותרת עליונה — אלא אם הופעלה
  // הכותרת הייעודית לפותחות H2/H3 (ברירת מחדל כבויה — התנהגות ≤S8 נשמרת).
  if (page.chapterOpening && !dedicated) return null;
  const sourceSide = dedicated ? 'opening' : resolveSameAs(physical, settings);
  // טקסט מותאם תמיד מהצד הפיזי של העמוד (סלוטי הפתיחה יורשים — D-61)
  const customSide = dedicated ? physical : sourceSide;
  const out = { side: physical, dedicated, slots: {} };
  for (const pos of ['right', 'center', 'left']) {
    // מקור: מהצד החל על העמוד (opening/recto/verso אחרי ירושה); גופן/גודל/יישור/רוחב — תמיד מהצד הפיזי (D-61)
    const source = settings[`header-${sourceSide}-${pos}-source`];
    const customText = settings[`header-${customSide}-${pos}-custom-text`];
    out.slots[pos] = {
      source,
      text: resolveSlot(source, {
        ...ctx,
        pageNumber: page.pageNumberDisplay,
        firstWord: page.firstWord,
        lastWord: page.lastWord,
        customText,
      }, settings, `header-${customSide}-${pos}-custom-text`),
      align: settings[`header-${physical}-${pos}-align`],
      widthPct: settings[`header-${physical}-${pos}-width-pct`],
      font: settings[`header-${physical}-${pos}-font`],
      sizePt: settings[`header-${physical}-${pos}-size-pt`],
      customText,
    };
  }
  out.separator = settings['header-separator-line'];
  return out;
}

module.exports = {
  buildHeader, extractH1TitleMain, extractTitleRest, resolveSlot,
  resolveSameAs, firstLastWordsText, pageOpensWithH2H3, trimEdgePunctuation,
};

};
__modules["src/engine/layout/headings-escort.js"] = function (require, module, exports) {
// src/engine/layout/headings-escort.js — החלטת מצב כותרות + ליווי (S5.1; נרשם S4)
// heading-{0..7}-mode: full-width | regular | side-note | new-page
'use strict';

/**
 * המרת mode של כותרת להחלטת פריסה מבנית. מרכז locus אחד — אסור לפצל אתר החלטה (D-09).
 * @returns {{fullWidth:boolean, forcePageBreak:boolean, asSideNote:boolean}}
 */
function headingLayoutDecision(level, settings) {
  const mode = settings[`heading-${level}-mode`] || 'regular';
  return {
    fullWidth: mode === 'full-width' && level >= 1, // H0 always full width anyway (PT rules)
    forcePageBreak: mode === 'new-page',
    asSideNote: mode === 'side-note' || level === 7, // ברירת מחדל H7 = הערת צד (BRZ)
  };
}

/**
 * עיבוד מקדים של רשימת בלוקים: דגלי זרימה לפני DP (לא אחרי — lesson V23 "post-hoc flags").
 * ממיר mode → flags על הבלוק עצמו, כך ש‑dp-planner קורא דגלים בלבד.
 */
function applyHeadingModes(blocks, settings) {
  for (const b of blocks) {
    if (b.kind !== 'heading') continue;
    const d = headingLayoutDecision(b.level, settings);
    b.fullWidth = d.fullWidth || b.level === 0;
    b.forcePageBreakBefore = d.forcePageBreak;
    b.asSideNote = d.asSideNote;
  }
  return blocks;
}

module.exports = { headingLayoutDecision, applyHeadingModes };

};
__modules["src/engine/core/events.js"] = function (require, module, exports) {
// src/engine/core/events.js — Event log / Trace collector (REQ-GOV-01)
'use strict';

/**
 * EventLog — רישום אירועי מנוע: שלבים, תוויות, payload, דף.
 * המכשור אסור לשנות פריסה — no-op proof נאכף ב‑CI (REQ-GOV-01/U-A7).
 */
class EventLog {
  /**
   * @param {string} verbosity - 'off'|'minimal'|'standard'|'full' (key: trace-verbosity, REQ-GOV-01)
   * תיקון P1-6: ts לוגי מונוטוני (לא Date.now) — יומנים זהים בין ריצות ⇒
   * אפשר להשוות טרייסים בין קומיטים (baseline regression).
   */
  constructor(verbosity = 'full') {
    this.verbosity = verbosity; // settings['trace-verbosity'] — נצרך בפועל (הpipeline מזרים)
    this.events = [];
    this.droppedEvents = 0; // חייב להישאר 0 (REQ-GOV-01)
    this.clock = 0; // שעון לוגי דטרמיניסטי (P1-6)
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
      ts: ++this.clock, // לוגי — דטרמיניסטי בין ריצות (P1-6)
      payload
    });
  }

  toTraceV2() {
    return { schema: 'trace-v2', droppedEvents: this.droppedEvents, events: this.events.slice() };
  }
}

module.exports = { EventLog };

};
__modules["src/engine/audit/editing-recommendations.js"] = function (require, module, exports) {
// src/engine/audit/editing-recommendations.js — המלצות עריכה עם הוכחת dry-run (S11.1-4/5, REQ-GOV-11)
'use strict';

/**
 * **D-16: editing-recommendations require dry-run proof.**
 * כשהמנוע מיצה את האפשרויות החוקיות (runt בלתי־ניתן, אי־איזון ששרד נסיגה, הכלה
 * שלא נפתרה) — מוצעות **עריכות טקסטואליות** (העברת מילה בין פסקאות) עם הוכחה
 * חיה: הפעלה מחדש של המנוע על הטקסט הערוך מוכיחה שהמלצת העריכה (א) מסירה
 * את הממצא המקורי, ו(ב) **לא מייצרת אף ממצא חדש**. המלצה בלי הוכחה נפסלת
 * מראש (rejected) — לעולם לא מוצגת למשתמש.
 *
 * שקיפות (U-A10): כל המלצה נושאת artifact מלא — לפני/אחרי, hash-ים,
 * חתימות ממצאים, מספרי עמודים. ההשוואה לפי kind+target (identity) — לא לפי
 * מספר עמוד (מספרי עמוד זזים בגלל העריכה עצמה).
 *
 * תקציב: עד 8 הרצות ניסיון (dry-runs) ועד 3 המלצות מוחזרות; דוק ≥200 עמודים
 * — המלצות לא מחושבות אוטומטית (שומר הביצועים; זמין לפי דרישה).
 */

// המנוע נדרש בזמן קריאה (לא בטעינה) — מנע תלות מעגלית pipeline ↔ recommendations.
// Node מוחזר את המודול השלם בקריאה השנייה (cache).
let _typeset = null;
function engineTypeset(text, settings, env) {
  if (!_typeset) _typeset = require('../core/pipeline').typeset;
  return _typeset(text, settings, env);
}
const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, normalizeText } = require('../parser/block-tokenizer');
const { applyEdit } = require('./text-edits'); // **S11:** מקור יחיד טהור — גם ל־UI (בלי pipeline)

const QUALIFYING_KINDS = ['runt-line', 'column-imbalance', 'containment'];
const MAX_DRY_RUNS = 8;
const MAX_RECOMMENDATIONS = 3;
const MAX_PAGES_GUARD = 200;

/** חתימת ממצא — identity יציב בין ריצות: עוגן תוכן (textHead מהראיות) במקום
 *  מזהה טוקן שזז כשהעריכה משנה את מספר הפסקאות. עמוד לדיווח בלבד. */
function sigOf(rec) {
  const pb = rec && rec.predicate_before;
  if (pb && typeof pb === 'object' && pb.textHead) return `${rec.kind}@th:${pb.textHead}`;
  return `${rec.kind}@${rec.target}`;
}

/** הממצאים המקבלים המלצות — המנוע מיצה אפשרויות (לא resolved). */
function qualifyingFindings(result) {
  const out = [];
  if (!result || !result.ledger) return out;
  for (const rec of result.ledger.issues.values()) {
    if (rec.status === 'resolved') continue;
    if (!QUALIFYING_KINDS.includes(rec.kind)) continue;
    out.push(rec);
  }
  return out;
}

/**
 * מיפוי טוקנים → שורות המקור: הליכה קדימה על שורות המקור עם מצביע טוקנים.
 * @returns {{lines:string[], tokenLineIdx:Map<string,number>, tokens:Array}|null}
 */
function mapTokensToRawLines(rawText) {
  const { bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  const rawLines = String(rawText).split('\n');
  const tokenLineIdx = new Map();
  let ti = 0;
  for (let li = 0; li < rawLines.length && ti < tokens.length; li++) {
    const trimmed = rawLines[li].trim();
    if (!trimmed) continue; // שורה ריקה — לא טוקן
    if (normalizeText(trimmed) === normalizeText(tokens[ti].raw || '')) {
      tokenLineIdx.set(tokens[ti].id, li);
      ti++;
    }
    // שורת מטא־דאטה בראש (לפני הטוקן הראשון) — לא צורכת טוקן; מזוהה בהמשך
    // ע"י אי־התאמה. ההוכחה החיה מגינה מפני זיהוי שגוי: עריכה שלא משנה hash נפסלת.
  }
  if (ti < tokens.length) return null; // מיפוי לא שלם — לא מייצרים המלצות (שקוף)
  return { lines: rawLines, tokenLineIdx, tokens };
}

/** טוקן הפסקה הבא אחרי tokenId. */
function nextParagraphToken(tokens, tokenId) {
  const i = tokens.findIndex(t => t.id === tokenId);
  if (i < 0) return null;
  for (let j = i + 1; j < tokens.length; j++) {
    if (tokens[j].type === 'paragraph') return tokens[j];
  }
  return null;
}

/** האם טוקן הוא פסקה פשוטה (בלי הערות) — מועמדת לעריכה. */
function isPlainParagraph(tok) {
  if (!tok || tok.type !== 'paragraph') return false;
  const notes = (tok.parts || []).filter(p => p.kind !== 'text');
  return notes.length === 0;
}

/**
 * מועמדות עריכה לממצא (עד 2 לממצא; מילה עוברת בין פסקאות שכנות באותו חלק):
 *  - move-word-down: המילה הראשונה של הפסקה הבאה → סוף פסקת הממצא
 *  - move-word-up:   המילה האחרונה של פסקת הממצא → ראש הפסקה הבאה
 */
function candidateEdits(finding, map) {
  let anchorTok = map.tokens.find(t => t.id === finding.target) || null;
  if (finding.kind === 'runt-line' && typeof finding.target === 'string' && finding.target.startsWith('line@')) {
    anchorTok = map.tokens.find(t => t.id === finding.target.slice(5)) || null;
  }
  if (!anchorTok || !isPlainParagraph(anchorTok)) return [];
  const nextTok = nextParagraphToken(map.tokens, anchorTok.id);
  if (!nextTok || !isPlainParagraph(nextTok)) return [];
  if ((nextTok.part || 1) !== (anchorTok.part || 1)) return []; // לא חוצה חלקים

  const fromLine = map.tokenLineIdx.get(anchorTok.id);
  const toLine = map.tokenLineIdx.get(nextTok.id);
  if (fromLine == null || toLine == null) return [];

  const fromWords = map.lines[fromLine].trim().split(/\s+/).filter(Boolean);
  const toWords = map.lines[toLine].trim().split(/\s+/).filter(Boolean);
  // משמרות מינימליות: לא מוחקים תוכן לעולם — המילה רק עוברת. המקבל/הנותן
  // נשארים עם טקסט; פסקה בת מילה אחת רשאית להימזג קדימה (המילה עוברת — לא נאבד).
  if (toWords.length < 3) return [];        // הנותן (הבאה) חייב להישאר עם ≥2 מילים
  if (fromWords.length < 1) return [];

  const out = [];
  out.push({
    type: 'move-word-down',
    fromLine: toLine, toLine: fromLine,
    description: `להעביר את המילה «${toWords[0]}» מפתיחת הפסקה הבאה אל סוף פסקה זו — מאריך את השורה האחרונה שלה ומקצר את ראש הבאה`,
    before: `${map.lines[fromLine]} ⟂ ${map.lines[toLine]}`,
    after: `${map.lines[fromLine]} ${toWords[0]} ⟂ ${toWords.slice(1).join(' ')}`
  });
  out.push({
    type: 'move-word-up',
    fromLine: fromLine, toLine: toLine,
    description: `להעביר את המילה «${fromWords[fromWords.length - 1]}» מסוף פסקה זו אל פתיחת הפסקה הבאה — מקצר את סופה ומאריך את ראש הבאה`,
    before: `${map.lines[fromLine]} ⟂ ${map.lines[toLine]}`,
    after: `${fromWords.slice(0, -1).join(' ')} ⟂ ${fromWords[fromWords.length - 1]} ${map.lines[toLine]}`
  });
  return out;
}

/** החלת עריכה בודדת על שורות המקור → מסמך חדש (או null אם לא ניתן) — **applyEdit של text-edits**
 *  (מקור יחיד: אותה פונקציה משמשת את המנוע ואת ה־UI). היא מיובאת למעלה. */

/** רשימת הממצאים לפי חתימות (compact, להוכחה). */
function findingSigs(result) {
  const out = [];
  for (const rec of result.ledger.issues.values()) {
    if (rec.status === 'resolved') continue;
    out.push({ sig: sigOf(rec), kind: rec.kind, target: rec.target, page: rec.page });
  }
  return out;
}

/**
 * חישוב ההמלצות. כל המלצה כוללת proof — אחרת היא לא מוחזרת.
 * @param {string} rawText
 * @param {object} settings — כפי שהועברו ל־typeset
 * @param {object} result — תוצאת typeset
 * @param {{force?:boolean}} [opts] — force: עקיפת שומר הגודל (דרישה מפורשת)
 * @returns {{computed:boolean, reason:string, recommendations:Array, rejected:number, dryRuns:number}}
 */
function computeEditingRecommendations(rawText, settings, result, opts) {
  const force = !!(opts && opts.force);
  if (!result || !result.pages) return { computed: false, reason: 'no-result', recommendations: [], rejected: 0, dryRuns: 0 };
  if (!force && result.pages.length > MAX_PAGES_GUARD) {
    return { computed: false, reason: `doc-size-guard:${result.pages.length}>${MAX_PAGES_GUARD}`, recommendations: [], rejected: 0, dryRuns: 0 };
  }
  const findings = qualifyingFindings(result);
  if (!findings.length) return { computed: true, reason: 'no-qualifying-findings', recommendations: [], rejected: 0, dryRuns: 0 };
  const map = mapTokensToRawLines(rawText);
  if (!map) return { computed: true, reason: 'raw-mapping-failed', recommendations: [], rejected: 0, dryRuns: 0 };

  const before = {
    hash: result.layoutHash,
    sigs: findingSigs(result).map(s => s.sig),
    pages: result.pages.length
  };
  const recommendations = [];
  let rejected = 0, dryRuns = 0;

  outer:
  for (const finding of findings) {
    for (const edit of candidateEdits(finding, map)) {
      if (dryRuns >= MAX_DRY_RUNS || recommendations.length >= MAX_RECOMMENDATIONS) break outer;
      dryRuns++;
      const editedText = applyEdit(map.lines, edit);
      if (editedText == null) { rejected++; continue; }
      const after = engineTypeset(editedText, settings, { noRecommendations: true }); // אין המלצות בתוך dry-run (מנע רקורסיה)
      const afterSigs = findingSigs(after).map(s => s.sig);
      const targetSig = sigOf(finding);
      const removed = !afterSigs.includes(targetSig);
      const added = afterSigs.filter(s => !before.sigs.includes(s) && s !== targetSig);
      if (after.layoutHash === before.hash) { rejected++; continue; } // no-op — לא המלצה
      if (!removed || added.length > 0) { rejected++; continue; }     // בלי הוכחה — נפסל (D-16)
      recommendations.push({
        id: `rec-${recommendations.length + 1}`,
        finding: { kind: finding.kind, target: finding.target, page: finding.page, evidence: finding.predicate_before || null },
        edit: {
          type: edit.type, description: edit.description,
          lineFrom: map.lines[edit.fromLine], lineTo: map.lines[edit.toLine],
          lineFromIdx: edit.fromLine, lineToIdx: edit.toLine, // להחלה ב־UI על טקסט המקור
          before: edit.before, after: edit.after
        },
        proof: {
          beforeHash: before.hash, afterHash: after.layoutHash,
          pagesBefore: before.pages, pagesAfter: after.pages.length,
          removedFinding: targetSig, newFindings: added, dryRunIndex: dryRuns
        }
      });
      if (recommendations.length >= MAX_RECOMMENDATIONS) break outer;
    }
  }
  return { computed: true, reason: 'ok', recommendations, rejected, dryRuns };
}

module.exports = {
  computeEditingRecommendations, qualifyingFindings, findingSigs,
  candidateEdits, sigOf, mapTokensToRawLines,
  QUALIFYING_KINDS, MAX_DRY_RUNS, MAX_RECOMMENDATIONS, MAX_PAGES_GUARD
};
// **S11:** applyEdit עבר ל־text-edits.js (מקור יחיד טהור — בלי תלות במנוע; לשימוש ה־UI).

};
__modules["src/engine/audit/text-edits.js"] = function (require, module, exports) {
// src/engine/audit/text-edits.js — עריכות טקסט להמלצות עריכה (S11; טהור — בלי תלות במנוע)
'use strict';

/**
 * החלת עריכת העברת־מילה על שורות המקור — מקור יחיד להמלצות־העריכה (engine)
 * ולהחלתן ב־UI (app-shell). מודול טהור: אין pipeline, אין מדידה — רק המרת מערך שורות.
 *
 *  - move-word-down: המילה הראשונה של שורת fromLine (הפסקה הבאה) → סוף שורת toLine (פסקת הממצא)
 *  - move-word-up:   המילה האחרונה של שורת fromLine (פסקת הממצא) → ראש שורת toLine (הפסקה הבאה)
 */

function wordsOf(line) { return String(line != null ? line : '').trim().split(/\s+/).filter(Boolean); }

/**
 * @param {string[]} lines — שורות המקור (מקור אמת: הטקסט המוצג בעורך)
 * @param {{type:'move-word-down'|'move-word-up', fromLine:number, toLine:number}} edit
 * @returns {string|null} — המסמך הערוך (join '\n'), או null אם לא ניתן להחיל
 */
function applyEdit(lines, edit) {
  if (!Array.isArray(lines) || !edit) return null;
  const next = lines.slice();
  const fi = edit.fromLine, ti = edit.toLine;
  if (!Number.isInteger(fi) || !Number.isInteger(ti) || fi < 0 || ti < 0 || fi >= next.length || ti >= next.length) return null;
  if (fi === ti) return null;
  const from = wordsOf(next[fi]);
  const to = wordsOf(next[ti]);
  if (edit.type === 'move-word-down') {
    // fromLine = הפסקה הבאה (מסירה את ראשונה); toLine = פסקת הממצא (מקבלת בסוף)
    const w = from.shift();
    if (!w) return null;
    to.push(w);
    next[ti] = to.join(' ');
    next[fi] = from.join(' ');
  } else if (edit.type === 'move-word-up') {
    // fromLine = פסקת הממצא (מסירה את אחרונה); toLine = הפסקה הבאה (מקבלת בראש)
    const w = from.pop();
    if (!w) return null;
    to.unshift(w);
    next[fi] = from.join(' ');
    next[ti] = to.join(' ');
  } else {
    return null;
  }
  return next.join('\n');
}

module.exports = { applyEdit, wordsOf };

};
__modules["src/engine/extensions/style-schema.js"] = function (require, module, exports) {
// src/engine/extensions/style-schema.js — Custom Text Styles schema + validation (S11.1-1, REQ-PAR-06)
'use strict';

/**
 * חוזה סגנונות מותאמים (REQ-PAR-06): trigger (linePrefix/inlineMarker/pattern/combinator
 * AND/OR), layoutMode ∈ {regular, full-width, side-note, footnote, endnote, new-location},
 * style מלא, counterReset, linkedOrnaments.
 *
 * **אימות עם שגיאות עבריות קריאות־לאדם** (§8.3: "הודעות שגיאה מובנות") — כל שגיאה:
 * {code, path, styleId, message} כאשר message הוא משפט עברי מלא המציין מה בדיוק
 * לא תקין ומה התקין. אין שגיאות כלליות מהסוג "invalid JSON".
 *
 * דטרמיניזם: אין Date/Math.random; סדר האימות קבוע; הודעות קבועות.
 */

const LAYOUT_MODES = ['regular', 'full-width', 'side-note', 'footnote', 'endnote', 'new-location'];
const ORNAMENTS = ['pyramid', 'lance', 'shoshanta', 'scroll'];
const COUNTER_FORMATS = ['hebrew-geresh', 'decimal'];
const COUNTER_RESETS = ['part', 'page', 'never'];
const STYLE_PROPS = [
  'fontName', 'fontSizePt', 'bold', 'italic', 'color', 'background',
  'border', 'indentEm', 'align', 'letterSpacingEm', 'textTransform'
];
const ALIGNS = ['right', 'center', 'left', 'stretch'];
const TRANSFORMS = ['none', 'small-caps'];

/** תווית עברית לשדה — משמשת את הודעות השגיאה ואת חיפוש ההרחבות. */
const FIELD_LABELS = {
  id: 'מזהה', name: 'שם', trigger: 'טריגר', layoutMode: 'מצב פריסה', style: 'סגנון',
  counter: 'מונה', linkedOrnaments: 'עיטורים מקושרים'
};

function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

/**
 * אימות טריגר בודד (רקורסיבי לקומבינטור). טריגר תקין = בדיוק אחד מ:
 * linePrefix | inlineMarker | pattern | combinator.
 * @returns {boolean} ok
 */
function validateTrigger(tr, styleId, errors, path) {
  if (tr == null) {
    errors.push({ code: 'trigger-empty', path, styleId, message: `הסגנון «${styleId}» אינו מגדיר טריגר — חובה אחד מ: linePrefix, inlineMarker, pattern או combinator.` });
    return false;
  }
  if (!isPlainObject(tr)) {
    errors.push({ code: 'trigger-not-object', path, styleId, message: `הטריגר של הסגנון «${styleId}» חייב להיות אובייקט, לא ${Array.isArray(tr) ? 'מערך' : typeof tr}.` });
    return false;
  }
  const has = (k) => Object.prototype.hasOwnProperty.call(tr, k);
  const leaves = ['linePrefix', 'inlineMarker', 'pattern'].filter(has);
  const isComb = has('combinator');
  const given = leaves.length + (isComb ? 1 : 0);
  if (given > 1) {
    errors.push({ code: 'trigger-ambiguous', path, styleId, message: `הסגנון «${styleId}» מגדיר ${given} טריגרים עץ־בעץ — חובה בדיוק אחד (לשילוב תנאים השתמש ב־combinator).` });
    return false;
  }
  if (isComb) {
    const c = tr.combinator;
    if (!isPlainObject(c) || !['AND', 'OR'].includes(c.op)) {
      errors.push({ code: 'combinator-bad-op', path: `${path}.combinator.op`, styleId, message: `בסגנון «${styleId}»: op של combinator חייב להיות AND או OR (קיבל ${JSON.stringify(c && c.op)}).` });
      return false;
    }
    if (!Array.isArray(c.conditions) || c.conditions.length < 2) {
      errors.push({ code: 'combinator-few-conditions', path: `${path}.combinator.conditions`, styleId, message: `בסגנון «${styleId}»: ל־combinator ${c.op} דרושים לפחות שני תנאים (קיבל ${Array.isArray(c.conditions) ? c.conditions.length : 0}).` });
      return false;
    }
    let ok = true;
    for (let i = 0; i < c.conditions.length; i++) {
      ok = validateTrigger(c.conditions[i], styleId, errors, `${path}.combinator.conditions[${i}]`) && ok;
    }
    return ok;
  }
  if (has('linePrefix')) {
    const v = tr.linePrefix;
    if (typeof v !== 'string' || !v.trim()) {
      errors.push({ code: 'linePrefix-bad', path: `${path}.linePrefix`, styleId, message: `בסגנון «${styleId}»: linePrefix חייב להיות מחרוזת לא ריקה (למשל "צד:").` });
      return false;
    }
    return true;
  }
  if (has('inlineMarker')) {
    const m = tr.inlineMarker;
    // **S11 (§8 "כל סוגי הטקסט נתונים לבחירת המשתמש"):** מפריד סימטרי (open === close,
    // כמו ~…~ או *…*) חוקי — הזיווג במחסנית מבחין פתיחה/סגירה לפי סדר ההופעה.
    if (!isPlainObject(m) || typeof m.open !== 'string' || typeof m.close !== 'string' || !m.open || !m.close) {
      errors.push({ code: 'inlineMarker-bad', path: `${path}.inlineMarker`, styleId, message: `בסגנון «${styleId}»: inlineMarker חייב לכלול open ו־close — שתי מחרוזות לא ריקות (זהות או שונות; למשל open:"«", close:"»" או שניהם "~").` });
      return false;
    }
    return true;
  }
  // pattern
  const p = tr.pattern;
  if (typeof p !== 'string' || !p) {
    errors.push({ code: 'pattern-bad', path: `${path}.pattern`, styleId, message: `בסגנון «${styleId}»: pattern חייב להיות מחרוזת של ביטוי־רגולרי לא ריקה.` });
    return false;
  }
  try { new RegExp(p); } catch (e) {
    errors.push({ code: 'pattern-invalid', path: `${path}.pattern`, styleId, message: `בסגנון «${styleId}»: הביטוי «${p}» אינו תקין — ${e.message}.` });
    return false;
  }
  return true;
}

function validateStyle(st, styleId, errors, path) {
  if (!isPlainObject(st)) {
    errors.push({ code: 'style-not-object', path, styleId, message: `הסגנון החזותי של «${styleId}» חייב להיות אובייקט (fontSizePt, bold, color וכו').` });
    return false;
  }
  let ok = true;
  for (const k of Object.keys(st)) {
    if (!STYLE_PROPS.includes(k)) {
      errors.push({ code: 'style-unknown-prop', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: המאפיין «${k}» אינו מוכר. המאפיינים החוקיים: ${STYLE_PROPS.join(', ')}.` });
      ok = false;
    }
  }
  if ('fontSizePt' in st && !(Number(st.fontSizePt) >= 6 && Number(st.fontSizePt) <= 48)) {
    errors.push({ code: 'style-bad-size', path: `${path}.fontSizePt`, styleId, message: `בסגנון «${styleId}»: גודל גופן חייב להיות בטווח 6–48 (קיבל ${JSON.stringify(st.fontSizePt)}).` });
    ok = false;
  }
  if ('color' in st && !/^#[0-9a-fA-F]{3,8}$/.test(String(st.color))) {
    errors.push({ code: 'style-bad-color', path: `${path}.color`, styleId, message: `בסגנון «${styleId}»: צבע חייב להיות הקסדצימלי כמו #1a1a1a (קיבל ${JSON.stringify(st.color)}).` });
    ok = false;
  }
  if ('background' in st && !/^#[0-9a-fA-F]{3,8}$/.test(String(st.background))) {
    errors.push({ code: 'style-bad-background', path: `${path}.background`, styleId, message: `בסגנון «${styleId}»: רקע חייב להיות הקסדצימלי (קיבל ${JSON.stringify(st.background)}).` });
    ok = false;
  }
  if ('align' in st && !ALIGNS.includes(st.align)) {
    errors.push({ code: 'style-bad-align', path: `${path}.align`, styleId, message: `בסגנון «${styleId}»: יישור חייב להיות אחד מ ${ALIGNS.join(', ')} (קיבל ${JSON.stringify(st.align)}).` });
    ok = false;
  }
  if ('textTransform' in st && !TRANSFORMS.includes(st.textTransform)) {
    errors.push({ code: 'style-bad-transform', path: `${path}.textTransform`, styleId, message: `בסגנון «${styleId}»: textTransform חייב להיות none או small-caps.` });
    ok = false;
  }
  for (const k of ['bold', 'italic']) {
    if (k in st && typeof st[k] !== 'boolean') {
      errors.push({ code: 'style-bad-bool', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: ${k} חייב להיות true/false.` });
      ok = false;
    }
  }
  return ok;
}

function validateCounter(ct, styleId, errors, path) {
  if (ct == null) return true; // אין מונה — תקין
  if (!isPlainObject(ct)) {
    errors.push({ code: 'counter-not-object', path, styleId, message: `המונה של «${styleId}» חייב להיות אובייקט {enabled, format, reset}.` });
    return false;
  }
  let ok = true;
  if ('format' in ct && !COUNTER_FORMATS.includes(ct.format)) {
    errors.push({ code: 'counter-bad-format', path: `${path}.format`, styleId, message: `בסגנון «${styleId}»: תבנית מונה חייבת להיות hebrew-geresh או decimal (קיבל ${JSON.stringify(ct.format)}).` });
    ok = false;
  }
  if ('reset' in ct && !COUNTER_RESETS.includes(ct.reset)) {
    errors.push({ code: 'counter-bad-reset', path: `${path}.reset`, styleId, message: `בסגנון «${styleId}»: מדיניות איפוס חייבת להיות part, page או never (קיבל ${JSON.stringify(ct.reset)}).` });
    ok = false;
  }
  if ('enabled' in ct && typeof ct.enabled !== 'boolean') {
    errors.push({ code: 'counter-bad-enabled', path: `${path}.enabled`, styleId, message: `בסגנון «${styleId}»: enabled חייב להיות true/false.` });
    ok = false;
  }
  return ok;
}

function validateOrnaments(lo, styleId, errors, path) {
  if (lo == null) return true;
  if (!isPlainObject(lo)) {
    errors.push({ code: 'ornaments-not-object', path, styleId, message: `העיטורים המקושרים של «${styleId}» חייבים להיות אובייקט {top, bottom}.` });
    return false;
  }
  let ok = true;
  for (const k of Object.keys(lo)) {
    if (!['top', 'bottom'].includes(k)) {
      errors.push({ code: 'ornament-unknown-slot', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: חריץ עיטור חייב להיות top או bottom (קיבל «${k}»).` });
      ok = false;
    } else if (lo[k] !== null && !ORNAMENTS.includes(lo[k])) {
      errors.push({ code: 'ornament-unknown-kind', path: `${path}.${k}`, styleId, message: `בסגנון «${styleId}»: סוג עיטור חייב להיות אחד מ ${ORNAMENTS.join(', ')} (קיבל ${JSON.stringify(lo[k])}).` });
      ok = false;
    }
  }
  return ok;
}

/**
 * פענוח + אימות רשימת סגנונות מותאמים.
 * @param {string|object} json — מערך, או {styles:[...]}
 * @returns {{ok:boolean, styles:Array, errors:Array}} — styles מנורמלים (defaults מלאים)
 */
function parseCustomStyles(json) {
  let raw;
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, styles: [], errors: [{ code: 'unparseable-json', path: '$', styleId: null, message: `הקובץ אינו JSON תקין — ${e.message}. כדאי לבדוק פסיקים ומרכאות כפולות.` }] };
  }
  const list = Array.isArray(raw) ? raw : (isPlainObject(raw) && Array.isArray(raw.styles) ? raw.styles : null);
  if (!list) {
    return { ok: false, styles: [], errors: [{ code: 'bad-shape', path: '$', styleId: null, message: 'קובץ הסגנונות חייב להיות מערך, או אובייקט עם שדה styles (למשל {"styles":[...]}).' }] };
  }
  const errors = [];
  const seenIds = new Set();
  const styles = [];
  list.forEach((d, i) => {
    const where = `styles[${i}]`;
    if (!isPlainObject(d)) {
      errors.push({ code: 'style-not-object', path: where, styleId: null, message: `הסגנון במקום ${i} אינו אובייקט — נדחה.` });
      return;
    }
    const id = typeof d.id === 'string' && d.id.trim() ? d.id.trim() : null;
    if (!id) {
      errors.push({ code: 'missing-id', path: `${where}.id`, styleId: null, message: `לסגנון במקום ${i} חסר מזהה (id) — חובה שם ייחודי כמו "quote".` });
      return;
    }
    if (seenIds.has(id)) {
      errors.push({ code: 'duplicate-id', path: `${where}.id`, styleId: id, message: `מזהה הסגנון «${id}» מופיע פעמיים — מזהים חייבים להיות ייחודיים.` });
      return;
    }
    seenIds.add(id);
    let ok = true;
    ok = validateTrigger(d.trigger, id, errors, `${where}.trigger`) && ok;
    const layoutMode = d.layoutMode || 'regular';
    if (!LAYOUT_MODES.includes(layoutMode)) {
      errors.push({ code: 'bad-layout-mode', path: `${where}.layoutMode`, styleId: id, message: `בסגנון «${id}»: מצב פריסה חייב להיות אחד מ ${LAYOUT_MODES.join(', ')} (קיבל ${JSON.stringify(d.layoutMode)}).` });
      ok = false;
    }
    if ('style' in d) ok = validateStyle(d.style, id, errors, `${where}.style`) && ok;
    ok = validateCounter(d.counter, id, errors, `${where}.counter`) && ok;
    ok = validateOrnaments(d.linkedOrnaments, id, errors, `${where}.linkedOrnaments`) && ok;
    if (!ok) return; // סגנון פגום — לא נכנס לרשימה (הודעותיו כבר נרשמו)
    styles.push({
      id,
      name: typeof d.name === 'string' && d.name.trim() ? d.name.trim() : id,
      trigger: d.trigger,
      layoutMode,
      style: d.style || {},
      counter: d.counter && d.counter.enabled ? {
        enabled: true,
        format: d.counter.format || 'decimal',
        reset: d.counter.reset || 'never'
      } : null,
      linkedOrnaments: d.linkedOrnaments || null
    });
  });
  return { ok: errors.length === 0, styles, errors };
}

/**
 * אימות רשימת תמונות מוטמעות (embedded images §8.3). src חייב data: URI —
 * offline-guard: הפניית http(s) חיצונית נדחית עם הודעה עברית (Orange exit-7 doctrine).
 */
function validateImages(list) {
  const errors = [];
  const images = [];
  if (!Array.isArray(list)) return { ok: true, images, errors };
  const seenIds = new Set();
  list.forEach((im, i) => {
    const where = `images[${i}]`;
    if (!isPlainObject(im) || typeof im.id !== 'string' || !im.id.trim()) {
      errors.push({ code: 'image-missing-id', path: where, styleId: null, message: `לתמונה במקום ${i} חסר מזהה (id) — נדחתה.` });
      return;
    }
    if (seenIds.has(im.id)) {
      errors.push({ code: 'image-duplicate-id', path: `${where}.id`, styleId: im.id, message: `מזהה התמונה «${im.id}» מופיע פעמיים.` });
      return;
    }
    seenIds.add(im.id);
    const src = typeof im.src === 'string' ? im.src : '';
    if (!src) {
      errors.push({ code: 'image-missing-src', path: `${where}.src`, styleId: im.id, message: `לתמונה «${im.id}» חסר מקור (src).` });
      return;
    }
    if (/^https?:\/\//i.test(src)) {
      errors.push({ code: 'image-external-src', path: `${where}.src`, styleId: im.id, message: `התמונה «${im.id}» מפנה לכתובת חיצונית — אסור (מנוע אופליין). יש להטמיע תמונות כ־data: URI בלבד.` });
      return;
    }
    if (!src.startsWith('data:')) {
      errors.push({ code: 'image-bad-src', path: `${where}.src`, styleId: im.id, message: `מקור התמונה «${im.id}» חייב להתחיל ב־data: (קיבל «${src.slice(0, 24)}…»).` });
      return;
    }
    const w = Number(im.w), h = Number(im.h);
    if (!(w > 0 && h > 0)) {
      errors.push({ code: 'image-bad-dims', path: where, styleId: im.id, message: `לתמונה «${im.id}» חסרים ממדים תקינים (w/h חיוביים במ״מ).` });
      return;
    }
    images.push({ id: im.id, src, w, h, alt: typeof im.alt === 'string' ? im.alt : '' });
  });
  return { ok: errors.length === 0, images, errors };
}

module.exports = {
  LAYOUT_MODES, ORNAMENTS, STYLE_PROPS, FIELD_LABELS,
  parseCustomStyles, validateImages
};

};
__modules["src/engine/extensions/apply-styles.js"] = function (require, module, exports) {
// src/engine/extensions/apply-styles.js — התאמת טריגרים + מונים + טווחי inline (S11.1-1/2, REQ-PAR-06)
'use strict';

/**
 * מנוע ההחלה של סגנונות מותאמים. שלוש שכבות:
 *  1. matchBlockStyle — טריגר ברמת הפסקה (linePrefix / pattern / combinator AND|OR)
 *  2. matchInlineRanges — טריגר ברמת טווח בתוך הטקסט (inlineMarker «…», מפרידים שרירותיים)
 *  3. CustomStyleCounters — מונים לפי counterReset (part/page/never) —
 *     סימון יחיד דרך notes/markers.markerFor (מקור יחיד; לא מספר מדומה).
 *
 * דטרמיניזם: אין Date/Math.random; הסדר קבוע (סדר ההצהרה); first-match-wins.
 */

const { markerFor } = require('../notes/markers');

/** התאמת טריגר־עלים בודד (בלי combinator — עלה). */
function matchLeaf(spec, line) {
  if ('linePrefix' in spec) return typeof spec.linePrefix === 'string' && line.startsWith(spec.linePrefix);
  if ('pattern' in spec) {
    try { return new RegExp(spec.pattern).test(line); } catch (e) { return false; }
  }
  if ('inlineMarker' in spec) {
    // עלה inlineMarker בהקשר בלוק: הפסקה מכילה לפחות טווח פתוח+סגור תקין
    const ranges = inlineRanges(line, spec.inlineMarker);
    return ranges.length > 0;
  }
  return false;
}

/** התאמת טריגר כלשהו (רקורסיבי — combinator AND/OR). */
function matchTriggerSpec(spec, line) {
  if (!spec || typeof spec !== 'object') return false;
  if ('combinator' in spec) {
    const c = spec.combinator;
    if (!c || !Array.isArray(c.conditions)) return false;
    if (c.op === 'AND') return c.conditions.every(sub => matchTriggerSpec(sub, line));
    if (c.op === 'OR') return c.conditions.some(sub => matchTriggerSpec(sub, line));
    return false;
  }
  return matchLeaf(spec, line);
}

/** טווחי inlineMarker בשורה: זוגות open/close לא חופפים, בסדר הופעתם.
 * **S11:** מפריד סימטרי (open === close, כמו ~…~) — טוגל: מופע ראשון פותח,
 * הבא סוגר (לפי סדר ההופעה), ולהפך — מחסנית לא עוזרת כשהסניף הראשון
 * תמיד תופס קודם. */
function inlineRanges(line, marker) {
  if (!marker || typeof marker.open !== 'string' || typeof marker.close !== 'string') return [];
  const out = [];
  const stack = [];
  const symmetric = marker.open === marker.close;
  for (let i = 0; i < line.length; i++) {
    if (line.startsWith(marker.open, i)) {
      if (symmetric) {
        // טוגל: פתוח אם אין פתיחה תלויה; סגור אחרת
        if (stack.length) {
          const from = stack.pop();
          out.push({ from: from + marker.open.length, to: i }); // טווח התוכן בין המפרידים
        } else {
          stack.push(i);
        }
        i += marker.open.length - 1;
        continue;
      }
      stack.push(i); i += marker.open.length - 1;
    } else if (line.startsWith(marker.close, i)) {
      const from = stack.pop();
      if (from !== undefined) out.push({ from: from + marker.open.length, to: i }); // טווח התוכן בין המפרידים
      i += marker.close.length - 1;
    }
  }
  return out; // סדירות: לפי מקום הסגירה; stack לא־מזווג נשמר — ההתאמה תקפה רק לזוגות שנסגרו
}

/**
 * התאמת סגנון ברמת פסקה. first-match-wins לפי סדר ההצהרה (דטרמיניסטי).
 * @param {string} line — הטקסט השטוח של הפסקה (בלי הערות)
 * @param {Array} styles — רשימה מנורמלת מ־parseCustomStyles
 * @returns {{style, ranges}|null}
 */
function matchBlockStyle(line, styles) {
  for (const st of styles || []) {
    if (!st || !st.trigger) continue;
    if (matchTriggerSpec(st.trigger, line)) {
      return { style: st };
    }
  }
  return null;
}

/**
 * סגנוני inline תואמים לשורה (כמה סגנונות יכולים לתפוס טווחים שונים;
 * טווח חופף — הראשון בהצהרה זוכה; שאר נפסלים לאותו טווח).
 * @returns {Array<{styleId, ranges}>}
 */
function matchInlineStyles(line, styles) {
  const out = [];
  const taken = []; // טווחים שנתפסו {from,to}
  for (const st of styles || []) {
    if (!st || !st.trigger || !('inlineMarker' in st.trigger)) continue;
    if ('combinator' in st.trigger) continue; // קומבינטור נוסה ברמת הבלוק בלבד (תיעוד חוזה)
    const ranges = inlineRanges(line, st.trigger.inlineMarker)
      .filter(r => !taken.some(t => r.from < t.to && t.from < r.to)); // אי־חפיפה
    if (!ranges.length) continue;
    for (const r of ranges) taken.push(r);
    out.push({ styleId: st.id, style: st, ranges });
  }
  return out;
}

/**
 * מונה per-style: counterReset part/page/never; תבנית hebrew-geresh/decimal —
 * **markerFor של notes/markers (מקור יחיד — לא העתקה).**
 */
class CustomStyleCounters {
  constructor() {
    this.state = new Map(); // styleId → {seq, lastPart, lastPage}
  }
  /**
   * הסמן הבא של הסגנון.
   * @param {object} st — סגנון מנורמל (counter: {format, reset} | null)
   * @param {{part:number, page:number}} ctx — הקשר התוכן הנוכחי
   */
  nextMark(st, ctx) {
    if (!st || !st.counter || !st.counter.enabled) return null;
    const key = st.id;
    let s = this.state.get(key);
    if (!s) { s = { seq: 0, lastPart: null, lastPage: null }; this.state.set(key, s); }
    if (st.counter.reset === 'part' && s.lastPart != null && ctx.part !== s.lastPart) s.seq = 0;
    if (st.counter.reset === 'page' && s.lastPage != null && ctx.page !== s.lastPage) s.seq = 0;
    s.seq += 1; s.lastPart = ctx.part; s.lastPage = ctx.page;
    return markerFor(s.seq, st.counter.format === 'hebrew-geresh' ? 'hebrew-geresh' : 'decimal');
  }
}

/** רוחב גופן יחסי של סגנון לגוף — למדידת טווחי inline בגודל שונה. */
function inlineSizeFactor(styleSpec, bodySizePt) {
  if (!styleSpec || !styleSpec.fontSizePt) return 1;
  const base = Number(bodySizePt) || 14;
  return Math.max(0.25, Number(styleSpec.fontSizePt) / base);
}

module.exports = {
  matchBlockStyle, matchInlineStyles, matchTriggerSpec, inlineRanges,
  CustomStyleCounters, inlineSizeFactor
};

};
__modules["src/engine/decoration/ornament-fit.js"] = function (require, module, exports) {
// src/engine/decoration/ornament-fit.js — fit-to-text JS measurement + divider height rules (REQ-ORN-01..04)
'use strict';

/**
 * מדידת DOM/JS בלבד (CSS fit-content נכשל — V3/V4). מקור שליטה אחד: אין !important מול inline (F-09).
 *
 * **S8:** הרחבה מלאה — התאמת עיטורי H2 לרוחב הטקסט, התאמת גובה צדדיים H3 לשורת הכותרת,
 * עיטור סיום־פרק בתקציב הפנוי (REQ-ORN-03), שמירת סימטריית מרווחים אפקטיביים (F-21),
 * הרמה אופטית −0.08em לעיטורי צד (שיעור V4), ומשמרות התאמה למפרידי כותרות (REQ-ORN-04).
 */

/** התאמת עיטור H2 לרוחב הטקסט: מחזיר scalePx; sync re-fit בלי shift. */
function fitOrnamentToText(ornamentWidthPx, textWidthPx, maxScale = 3) {
  if (!ornamentWidthPx || ornamentWidthPx <= 0) return 1;
  const scale = Math.min(maxScale, textWidthPx / ornamentWidthPx);
  return Math.max(0.25, Number(scale.toFixed(4)));
}

/**
 * REQ-ORN-01: re-fit סינכרוני ללא הזזה — לאחר החלת הסקאלה רוחב העיטור
 * כבר שווה לרוחב הטקסט, ולכן ריצה חוזרת מחזירה סקאלה 1 (מתייצבת מיד —
 * שיעור F-08: אין פוסט־פרוסס מאוחר שמגלה גובה שלא תוקצב).
 */
function refitStable(ornamentWidthPx, textWidthPx, maxScale) {
  const s1 = fitOrnamentToText(ornamentWidthPx, textWidthPx, maxScale);
  const appliedWidth = ornamentWidthPx * s1;
  const s2 = fitOrnamentToText(appliedWidth, textWidthPx, maxScale);
  return Math.abs(s2 - 1) <= 0.0001; // אחרי ההחלה — אין שינוי נוסף
}

/** גובה מפריד טורים = Math.min(גובה שני הטורים) − 8px (V4 rule). */
function columnDividerHeightPx(colUsedHeights) {
  return Math.max(0, Math.min(...colUsedHeights) - 8);
}

/**
 * fits() — בדיקת התאמה לפני הוספת עיטור **בכל** אתרי ההוספה (לקח Orange):
 * האם לעיטור יש מקום מתחת/מעל הבלוק בלי לגלוש מהטור?
 */
function fits(budgetRemainingPx, ornamentHeightPx) {
  return ornamentHeightPx > 0 && budgetRemainingPx >= ornamentHeightPx;
}

/** עיטורי H3 צדדיים: יישור למרכז־גופן (cap-height centering), לא baseline. */
function sideOrnamentOffsetY(lineHeightPx, ornamentHeightPx) {
  return Math.round((lineHeightPx - ornamentHeightPx) / 2);
}

/**
 * F-21 (שיעור מרווחים): מרווחי עיטורי H2 עליון/תחתון **שווים אפקטיבית**.
 * בזרימת flex-column אין התמטטות שוליים — השוואה חייבת להיעשות על הסכום
 * המצטבר (שולי כותרת + שולי עיטור), לא על ערכי CSS בודדים. כאן מקור אחד:
 * שני המרווחים נקבעים מאותה פונקציה ⇒ שווים מבנית.
 * @param {number} fontPx - גודל גופן הכותרת בפיקסלים
 * @returns {{top:number, bottom:number}} מרווחים אפקטיביים שווים (px)
 */
function h2OrnamentMarginsPx(fontPx) {
  const m = Math.max(2, Math.round(fontPx * 0.1)); // 0.1em — מרווח נשימה מינימלי
  return { top: m, bottom: m }; // שווים מבנית — מקור אחד, אין צבירה לא־סימטרית
}

/**
 * שיעור V4 (F-09/H3): הרמה אופטית של עיטורי צד — margin-top: −0.08em.
 * עיטורים שממורכזים גיאומטרית נראים נמוכים לעין; ההרמה מפצה.
 * @param {number} fontPx - גודל גופן השורה המארחת
 */
function sideOrnamentLiftPx(fontPx) {
  return -Math.round(fontPx * 0.08 * 100) / 100; // −0.08em — שיעור מתועד (Handoff 2.12)
}

/**
 * **F-08 (שיעור הלב):** גובה שעיטורי H2 צורך חייב להיות **מוזמן בזמן הפריסה**
 * (L4) בגודלו הסופי — לא כ‑overlay מאוחר שמגלה גובה שלא תוקצב (זה שורש
 * "עמוד פתיחת כותרת 2 ארוך מדי"). מחשב את ההזמנה הנדרשת מעל/מתחת לכותרת
 * לפי הממדים הסופיים (אחרי fit-to-text) — מקור יחיד למידות ולהזמנה.
 * @param {number} titleWidthPx - רוחב הכותרת הנמדד (JS — לא CSS)
 * @param {object} settings
 * @param {number} h2FontPx - גוף הכותרת בפיקסלים
 */
function h2OrnamentReservedHeight(titleWidthPx, settings, h2FontPx) {
  const scope = h2OrnamentScope(settings);
  if (!scope.any) return { topPx: 0, bottomPx: 0, scale: 1, ornW: 0, ornH: 0, margins: h2OrnamentMarginsPx(h2FontPx), scope };
  const naturalW = H2_ORN_W_EM * h2FontPx, naturalH = H2_ORN_H_EM * h2FontPx;
  const scale = settings['h2-orn-fit-to-text'] !== false ? fitOrnamentToText(naturalW, titleWidthPx) : 1;
  const ornH = naturalH * scale, ornW = naturalW * scale;
  const margins = h2OrnamentMarginsPx(h2FontPx);
  const topPx = scope.signTop ? Math.round(ornH + margins.top) : 0;
  const bottomPx = scope.signBottom ? Math.round(ornH + margins.bottom) : 0;
  return { topPx, bottomPx, scale, ornW: Math.round(ornW), ornH: Math.round(ornH), margins, scope };
}

/**
 * REQ-ORN-02: היקף עיטורי H2 — סימן בלבד / כותרת בלבד / שניהם.
 * מצבי עיטור עצמאיים: עליון/תחתון לסימן + צדדיים לכותרת (V4).
 * @returns {{signTop:boolean, signBottom:boolean, titleSide:boolean, any:boolean, why:string}}
 */
function h2OrnamentScope(settings) {
  const scope = settings['h2-orn-scope'] || 'both';
  const top = settings['h2-orn-top'] || 'none';
  const bottom = settings['h2-orn-bottom'] || 'none';
  const side = settings['h2-orn-side'] || 'none';
  const sign = scope === 'sign' || scope === 'both';
  const title = scope === 'title' || scope === 'both';
  const signTop = sign && top !== 'none';
  const signBottom = sign && bottom !== 'none';
  const titleSide = title && side !== 'none';
  return {
    signTop, signBottom, titleSide,
    any: signTop || signBottom || titleSide,
    why: !sign && !title ? 'scope-off' : (signTop || signBottom || titleSide) ? 'on' : 'kinds-all-none'
  };
}

/** סוגי עיטור סיום־פרק (REQ-ORN-03; Spec §6.7). */
const CHAPTER_END_KINDS = ['none', 'pyramid', 'lance', 'shoshanta', 'scroll', 'image'];

/** ממדים טבעיים של עיטורי H2 (em של גופן הכותרת). */
const H2_ORN_W_EM = 3, H2_ORN_H_EM = 0.6;

/**
 * REQ-ORN-03: התאמת עיטור סיום־פרק לתקציב הפנוי שנותר בטור.
 * - אף פעם לא דוחף תוכן ולא חוסם שער גאומטרי (invariant T1): אין מקום ⇒ לא מוצב + סיבה.
 * - scale יורד עד רצפה (0.5); מתחת לרצפה ⇒ דחייה מתועדת (לא כיווץ עיוור).
 * @returns {{placed:boolean, scale:number, wPx:number, hPx:number, reason:string}}
 */
function chapterEndOrnamentFit(kind, wPx, hPx, budgetPx) {
  if (!kind || kind === 'none') return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'kind-none' };
  if (!CHAPTER_END_KINDS.includes(kind)) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'kind-unknown' };
  const w = Math.max(0, Number(wPx) || 0), h = Math.max(0, Number(hPx) || 0);
  if (w <= 0 || h <= 0) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'dims-invalid' };
  const budget = Math.max(0, Number(budgetPx) || 0);
  if (budget <= 0) return { placed: false, scale: 1, wPx: 0, hPx: 0, reason: 'no-budget' };
  // התאמה: סקאלה אחידה על שני הממדים, עד רצפה 0.5
  const scale = Math.min(1, budget / h);
  if (scale < 0.5) return { placed: false, scale, wPx: 0, hPx: 0, reason: 'below-min-scale' };
  return { placed: true, scale: Number(scale.toFixed(4)), wPx: Math.round(w * scale), hPx: Math.round(h * scale), reason: 'fit' };
}

/**
 * REQ-ORN-04 משמרות מפרידי כותרות (שידרוג Orange): מפריד H3–H6 מוצב רק
 * כשהכותרת אינה בראש טור (אין עיטור תלוי מעל לא־כלום) והטור אינו ריק
 * (אין מפריד בעמוד ריק), ויש תקציב נמדד בפועל באתר ההצבה.
 * @param {Array} columnLines - השורות בטור שבו הכותרת הוצבה (לפניה)
 * @param {number} colIdx - אינדקס הטור
 * @returns {boolean} מותר להציב מפריד מתחת לכותרת זו
 */
function dividerInsertable(columnLines, colIdx) {
  void colIdx; // משמרת אחידה לכל הטורים — ראש טור 0 נדחה כמו ראש טור 1
  if (!Array.isArray(columnLines) || columnLines.length === 0) return false; // טור ריק / עמוד ריק
  if (columnLines.length <= 1) return false; // הכותרת היא ראש הטור — אין עיטור בראש טור
  const last = columnLines[columnLines.length - 1];
  return Boolean(last && last.kind === 'heading'); // מפריד רק מתחת לכותרת שהוצבה זה עתה
}

/**
 * F-09 single-source: הצהרת מקור־יחיד לממדי עיטור. הגודל נקבע במודל הגיאומטריה
 * בלבד (כאן); הרנדרר מצייר מה־rect ואסור לו לקבוע ממדים משלו (אין !important מול inline).
 * @returns {{ok:boolean, reason:string}} אמת כשלעיטור יש מקור יחיד תקין
 */
function assertSingleSourceSizing(orn) {
  if (!orn || typeof orn !== 'object') return { ok: false, reason: 'not-an-ornament' };
  const hasRect = orn.w != null && orn.h != null && Number.isFinite(orn.w) && Number.isFinite(orn.h);
  if (!hasRect) return { ok: false, reason: 'missing-rect' };
  if (orn.cssWidthPx != null || orn.cssHeightPx != null) {
    return { ok: false, reason: 'dual-source-sizing' }; // שני מקורות — אסור (F-09)
  }
  return { ok: true, reason: 'single-source' };
}

module.exports = {
  fitOrnamentToText, refitStable, columnDividerHeightPx, fits, sideOrnamentOffsetY,
  h2OrnamentMarginsPx, sideOrnamentLiftPx, h2OrnamentScope, chapterEndOrnamentFit,
  h2OrnamentReservedHeight,
  dividerInsertable, assertSingleSourceSizing, CHAPTER_END_KINDS, H2_ORN_W_EM, H2_ORN_H_EM
};

};
__modules["src/engine/decoration/shaar-pages.js"] = function (require, module, exports) {
// src/engine/decoration/shaar-pages.js — Structural shaar page insertion: PT-01/02/03 (S8)
'use strict';

/**
 * הכנסת עמודי שער לרצף העמודים — החלטה מבנית (L4), לא עיטורית:
 * מתבצעת מיד אחרי planPages ולפני צילום ה־hash של CP4, כך שהם חלק
 * מהבסיס שנמדד (ולא "תוספת מאוחרת" שמזיזה אינדקסים).
 *
 * PT-01 שער ראשי: בראש המסמך — כשערכת נושא פעילה (shaar-main-image הוגדר
 * ע"י activateThemeSet; תמיד recto).
 * PT-02 שער משנה: לפני כל פתיחת חלק (H1) — כשהטוגל "הצג שער משנה" דלוק (U-C2).
 * PT-03 שער אחורי: בסוף המסמך — כשערכה פעילה ו־shaar-back-enabled.
 *
 * עמודי שער: טור יחיד ריק (אין שורות גוף), chapterOpening=true (ללא כותרת
 * עליונה/גיליון לעין — D-36), numbered לפי count-shaar-pages.
 */

const { PAGE_TYPES, buildPageTemplate } = require('../layout/page-templates');
const { planCustomPages, buildCustomPageGeometry } = require('./custom-pages');
const { buildPickerModel } = require('./theme-sets');

/**
 * האם ערכת נושא פעילה (הופעלה דרך activateThemeSet או הוגדרה ידנית).
 * ברירת המחדל 'default' ⇒ אין עמודי שער — התנהגות שמרנית שלא משנה מסמכים קיימים.
 */
function themeActive(settings) {
  const id = settings['theme-set-id'];
  return Boolean(id && id !== 'default') || Boolean(settings['shaar-main-image']);
}

function makeShaarPage(type, settings, index) {
  const tpl = buildPageTemplate(type, settings, index % 2 === 0);
  return {
    index, type, template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // D-36: שער — ללא גיליון לעין
    decorations: [], isShaar: true
  };
}

/**
 * בניית רצף העמודים הסופי עם שערים + עמודים מותאמים (PT-09).
 * @param {Array} pages - תוצר planPages (לא מוטציה — מוחזר מערך חדש)
 * @param {Array} blocks - בלוקי המסמך (לזיהוי פתיחות חלקים)
 * @param {object} settings
 * @param {object} customDefs - עמודים מותאמים מפורקים (אופציונלי)
 * @returns {{pages:Array, inserted:Array, customPlaced:Array}}
 */
function insertShaarPages(pages, blocks, settings, customDefs) {
  const out = [];
  const inserted = [];
  const active = themeActive(settings);
  const showSub = settings['show-shaar-sub'] === true;
  const partsCount = new Set(blocks.filter(b => b.kind === 'heading' && b.level === 1).map(b => b.part)).size;

  // עמודים מותאמים — תכנון מיקום (PT-09)
  const customPlan = customDefs && customDefs.length ? planCustomPages(customDefs, { partsCount, hasShaarMain: active }) : null;
  const customPlaced = [];

  const push = (page, why) => { out.push(page); if (why) inserted.push({ type: page.type, why }); };

  // PT-01 + custom before/after-shaar-main
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'before-shaar-main')) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, 0), `custom:${d.id}`);
  }
  if (active) push(makeShaarPage(PAGE_TYPES.SHAAR_MAIN, settings, out.length), 'theme-main');
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'after-shaar-main')) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
  }

  // גוף המסמך — עם שערי־משנה לפני פתיחות חלקים ועמודים מותאמים סביב חלקים
  let lastPart = 0;
  for (const pg of pages) {
    let openingPart = null;
    if (pg.chapterOpening && pg.type === 'preface') {
      // פתיחת חלק: מזהים את מספר החלק מהכותרת (docPart במטא — מקור יחיד מהבלוק)
      outer: for (const col of pg.columns) {
        for (const ln of col) {
          if (ln.kind === 'heading' && ln.level === 1) {
            openingPart = (ln.meta && ln.meta.docPart != null) ? ln.meta.docPart : (lastPart + 1);
            break outer;
          }
        }
      }
    }
    if (openingPart != null) {
      if (customPlan) for (const d of (customPlan.beforePart.get(openingPart) || [])) {
        customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
      }
      if (showSub) push(makeShaarPage(PAGE_TYPES.SHAAR_SUB, settings, out.length), `theme-sub:part${openingPart}`);
      lastPart = openingPart;
    }
    push(pg);
    if (openingPart != null && customPlan) for (const d of (customPlan.afterPart.get(openingPart) || [])) {
      customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
    }
  }

  // PT-03 שער אחורי + custom:end
  if (customPlan) for (const d of customPlan.end) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
  }
  if (active && settings['shaar-back-enabled'] !== false) {
    push(makeShaarPage(PAGE_TYPES.SHAAR_BACK, settings, out.length), 'theme-back');
  }

  // reindex — כל האינדקסים מחדש אחרי ההכנסה (folio/TOC/recto מחושבים בהמשך מהאינדקס)
  out.forEach((p, i) => { p.index = i; });

  return { pages: out, inserted, customPlaced };
}

function makeCustomPage(def, settings, index) {
  const geo = buildCustomPageGeometry(def, settings);
  const tpl = buildPageTemplate(PAGE_TYPES.CUSTOM, settings, index % 2 === 0);
  return {
    index, type: 'custom', template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // עמוד קבוע — אין כותרת עליונה
    decorations: [], counted: geo.counted, custom: geo
  };
}

module.exports = { insertShaarPages, themeActive, buildPickerModel };

};
__modules["src/engine/decoration/custom-pages.js"] = function (require, module, exports) {
// src/engine/decoration/custom-pages.js — PT-09 custom page types: JSON parse + geometry (S8.1 task 9)
'use strict';

/**
 * עמודים מותאמים אישית (PT-09): JSON עם רקע/תיבות/תמונות/מיקום קבוע.
 * מיקום: לפני/אחרי שער ראשי, לפני/אחרי חלק (מספר), או בסוף המסמך.
 * "האם נספר" — דגל counted לכל עמוד.
 *
 * תוכן קבוע = טקסט חופשי בתיבות (לא עובר טוקניזציה — אינו חלק מזרימת הגוף;
 * לכן אינו נספר בשימור התוכן — מתועד בפירוש).
 */

const { MM_TO_PX } = require('../layout/page-templates');

/** מקומות הצבה חוקיים. */
const POSITIONS = ['before-shaar-main', 'after-shaar-main', 'before-part', 'after-part', 'end'];

/**
 * פענוח ואימות הגדרות עמודים מותאמים.
 * @param {string|object} json - או מערך הגדרות, או {pages:[...]}
 * @returns {{ok:boolean, pages:Array, errors:Array}}
 */
function parseCustomPageTypes(json) {
  let raw;
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, pages: [], errors: [`unparseable-json:${e.message}`] };
  }
  const defs = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.pages) ? raw.pages : null);
  if (!defs) return { ok: false, pages: [], errors: ['expected-array-or-{pages}'] };

  const errors = [];
  const seenIds = new Set();
  const pages = [];
  defs.forEach((d, i) => {
    const where = `#${i}`;
    if (!d || typeof d !== 'object') { errors.push(`${where}:not-an-object`); return; }
    const id = String(d.id || `custom-${i + 1}`);
    if (seenIds.has(id)) { errors.push(`${where}:duplicate-id:${id}`); return; } // ייחודיות id — כפילים נדחים (שיעור packer)
    seenIds.add(id);
    const pos = d.position || 'end';
    const at = String(pos.at || pos || 'end');
    if (!POSITIONS.includes(at)) { errors.push(`${where}:bad-position:${at}`); return; }
    let part = null;
    if ((at === 'before-part' || at === 'after-part')) {
      part = Number(pos.part != null ? pos.part : d.part);
      if (!Number.isInteger(part) || part < 1) { errors.push(`${where}:bad-part-number`); return; }
    }
    const boxes = Array.isArray(d.boxes) ? d.boxes.filter(b => b && Number.isFinite(Number(b.x)) && Number.isFinite(Number(b.y))
      && Number.isFinite(Number(b.w)) && Number.isFinite(Number(b.h))) : [];
    if (Array.isArray(d.boxes) && d.boxes.length !== boxes.length) {
      errors.push(`${where}:boxes-invalid-dropped:${d.boxes.length - boxes.length}`);
    }
    const images = Array.isArray(d.images) ? d.images.filter(im => im && im.src && Number.isFinite(Number(im.x)) && Number.isFinite(Number(im.y))
      && Number.isFinite(Number(im.w)) && Number.isFinite(Number(im.h))) : [];
    if (Array.isArray(d.images) && d.images.length !== images.length) {
      errors.push(`${where}:images-invalid-dropped:${d.images.length - images.length}`);
    }
    pages.push({
      id, type: 'custom',
      name: typeof d.name === 'string' && d.name.trim() ? d.name.trim() : null, // **S11 (§8.3):** כותרת קריאה לאדם (תקציר שיתוף/רשימת UI)
      position: { at: at, part },
      counted: d.counted !== false, // ברירת מחדל: נספר (PT-09)
      background: typeof d.background === 'string' ? d.background : null,
      boxes: boxes.map(b => ({ text: String(b.text || ''), x: Number(b.x), y: Number(b.y), w: Number(b.w), h: Number(b.h) })),
      images: images.map(im => ({ src: String(im.src), x: Number(im.x), y: Number(im.y), w: Number(im.w), h: Number(im.h) }))
    });
  });

  return { ok: errors.length === 0, pages, errors };
}

/**
 * מיקום העמודים המותאמים ברצף המסמך: מחזיר עמודים להכנסה לפי נקודות עיגון.
 * @param {Array} customDefs - תוצר parseCustomPageTypes().pages
 * @param {{partsCount:number, hasShaarMain:boolean}} docStructure
 * @returns {{start:Array, beforePart:Map<number,Array>, afterPart:Map<number,Array>, end:Array}}
 */
function planCustomPages(customDefs, docStructure) {
  const out = { start: [], beforePart: new Map(), afterPart: new Map(), end: [] };
  for (const d of customDefs || []) {
    switch (d.position.at) {
      // **S11 (תיקון שער 5):** לפני השער הראשי — וגם כשאין שער כזה (בלי ערכת נושא):
      // העמוד המותאם פותח את המסמך, לפני הפתיחה/התוכן. הסרת התניה מגדירה את
      // ההתנהגות המובטחת בשער: "עמוד לוגו לפני הפתיחה מוצב ונספר" גם במסמכים
      // צנועים בלי שער־ערכת (העיגון המבני היחיד שקיים תמיד הוא ראש המסמך).
      case 'before-shaar-main': out.start.push(d); break;
      case 'after-shaar-main': out.start.push(d); break; // אחרי שער ראשי/בראש המסמך אם אין
      case 'before-part': {
        const k = d.position.part;
        if (k <= (docStructure.partsCount || 0)) {
          if (!out.beforePart.has(k)) out.beforePart.set(k, []);
          out.beforePart.get(k).push(d);
        }
        break;
      }
      case 'after-part': {
        const k = d.position.part;
        if (!out.afterPart.has(k)) out.afterPart.set(k, []);
        out.afterPart.get(k).push(d);
        break;
      }
      case 'end': out.end.push(d); break;
    }
  }
  return out;
}

/**
 * גיאומטריית עמוד מותאם: תיבות ותמונות במ"מ → פיקסלים (mm × MM_TO_PX).
 * תוכן קבוע; אין טורים; counted לפי ההגדרה.
 */
function buildCustomPageGeometry(def, settings) {
  void settings;
  return {
    type: 'custom',
    customId: def.id,
    counted: def.counted !== false,
    background: def.background || null,
    boxes: (def.boxes || []).map(b => ({
      text: b.text, x: Math.round(b.x * MM_TO_PX), y: Math.round(b.y * MM_TO_PX),
      w: Math.round(b.w * MM_TO_PX), h: Math.round(b.h * MM_TO_PX)
    })),
    images: (def.images || []).map(im => ({
      src: im.src, x: Math.round(im.x * MM_TO_PX), y: Math.round(im.y * MM_TO_PX),
      w: Math.round(im.w * MM_TO_PX), h: Math.round(im.h * MM_TO_PX)
    }))
  };
}

module.exports = { POSITIONS, parseCustomPageTypes, planCustomPages, buildCustomPageGeometry };

};
__modules["src/engine/decoration/theme-sets.js"] = function (require, module, exports) {
// src/engine/decoration/theme-sets.js — Theme sets: grouping, id uniqueness, activation (REQ-ORN-06, F-10)
'use strict';

/**
 * ערכות נושא של שערים — מיזוג שערי JSON לפי מספר ערכה ("1 שער ראשי / 1 שער משנה / 1 שער אחורי").
 *
 * **נעילת F-10 לצמיתות:** בעבר, טעינת ערכת JSON מאוחדת הפעילה רק את השער הראשי.
 * שני גורמים ננעלו כאן מבנית:
 * 1. **התנגשות id** — כלי האריזה הישן גזר id משם הקובץ והחליף תווים שאינם ASCII ב־`_`,
 *    כך ש"שער ראשי" ו"שער משנה" קיבלו אותו מזהה (שיעור packerandconfigurator).
 *    כאן: id = מספר ערכה + תפקיד + סיומת גיבוב קצרה ⇒ ייחודיות מובטחת.
 * 2. **הפעלה חלקית** — activateThemeSet מפעיל את שלושת השערים (ראשי/משנה/אחורי) יחד,
 *    או אף אחד; אין מצב ביניים שקט.
 */

const ROLES = ['main', 'sub', 'back'];
const ROLE_HE = { main: 'ראשי', sub: 'משנה', back: 'אחורי' };

/** חילוץ מספר ערכה מוביל מהשם: "1 שער ראשי" ⇒ 1. שמות ללא מספר ⇒ null. */
function extractSetNumber(name) {
  const m = String(name || '').match(/^\s*(\d+)\s+/);
  return m ? Number(m[1]) : null;
}

/** זיהוי תפקיד מהשם (מילות מפתח עבריות). ברירת מחדל: main. */
function detectRole(name) {
  const s = String(name || '');
  if (/אחורי/.test(s)) return 'back';
  if (/משנה/.test(s)) return 'sub';
  if (/ראשי/.test(s)) return 'main';
  return 'main';
}

/**
 * גיבוב קצר דטרמיניסטי (FNV-1a 16 ביט) — סיומת ייחודיות ל־id (שיעור packerandconfigurator:
 * החלפת תווים לא־ASCII ב־`_` יוצרת התנגשויות; גיבוב לא).
 */
function shortHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (h & 0xffff).toString(36);
}

/**
 * id ייחודי לפריט שער: `set<מספר>-<תפקיד>-<גיבוב שם>`.
 * שני שמות שונים (אפילו שניהם עבריים לחלוטין) ⇒ id שונים תמיד.
 */
function uniqueShaarId(name, index) {
  const n = String(name || '').trim() || `shaar-${index}`;
  return `set${extractSetNumber(n) ?? 'x'}-${detectRole(n)}-${shortHash(`${n}#${index}`)}`;
}

/**
 * קיבוץ פריטי שער לערכות לפי מספר ערכה.
 * @param {Array} items - [{name, svg?, media?, box?}, ...] (מקובץ/מתיקיית נכסים)
 * @returns {Array<{setNo:number|null, label:string, main:object, sub:object|null, back:object|null, previewImage:string|null}>}
 */
function groupThemeSets(items) {
  const list = (items || []).map((it, i) => ({
    ...it,
    id: it.id || uniqueShaarId(it.name, i),
    role: it.role || detectRole(it.name),
    setNo: it.setNo != null ? it.setNo : extractSetNumber(it.name)
  }));
  const bySet = new Map();
  for (const it of list) {
    const key = it.setNo == null ? `noidx-${it.id}` : String(it.setNo);
    if (!bySet.has(key)) bySet.set(key, []);
    bySet.get(key).push(it);
  }
  const sets = [];
  for (const [key, group] of bySet) {
    // בתוך ערכה: תפקיד אחד לכל היותר — אם כפילות, הראשון זוכה והשאר מסומנים (לא נזנקים בשקט)
    const taken = new Set();
    const picked = {};
    const duplicates = [];
    for (const it of group) {
      if (!taken.has(it.role)) { taken.add(it.role); picked[it.role] = it; }
      else duplicates.push(it.id);
    }
    const setNo = group[0].setNo;
    sets.push({
      setNo,
      key,
      label: setNo != null ? `ערכה ${setNo}` : `ערכה ללא מספר (${group[0].name})`,
      main: picked.main || null,
      sub: picked.sub || null,
      back: picked.back || null,
      previewImage: (picked.main && (picked.main.preview || picked.main.media || (picked.main.svg ? `svg:${picked.main.id}` : null))) || null,
      duplicateIds: duplicates
    });
  }
  sets.sort((a, b) => (a.setNo == null ? Infinity : a.setNo) - (b.setNo == null ? Infinity : b.setNo));
  return sets;
}

/**
 * **נעילת F-10:** הפעלת ערכה מפעילה את כל שלושת השערים שבה — לא רק את הראשי.
 * חסר תפקיד בערכה ⇒ נשאר ברירת המחדל ומדווח בפירוש (לא בשקט).
 * @returns {{updates:object, activated:{main:string|null,sub:string|null,back:string|null}, missing:string[]}}
 */
function activateThemeSet(themeSet, settings) {
  void settings;
  if (!themeSet) {
    return { updates: { 'theme-set-id': 'default' }, activated: { main: null, sub: null, back: null }, missing: ['main', 'sub', 'back'] };
  }
  const updates = { 'theme-set-id': themeSet.key };
  const activated = {};
  const missing = [];
  for (const role of ROLES) {
    const it = themeSet[role];
    if (it) {
      activated[role] = it.id;
      if (role === 'main') {
        updates['shaar-main-image'] = it.media || it.preview || (it.svg ? `svg:${it.id}` : '');
        if (it.box) updates['shaar-main-box'] = it.box;
      }
      if (role === 'sub') updates['shaar-sub-image'] = it.media || (it.svg ? `svg:${it.id}` : '');
      if (role === 'back') updates['shaar-back-image'] = it.media || (it.svg ? `svg:${it.id}` : '');
    } else {
      activated[role] = null;
      missing.push(role);
    }
  }
  return { updates, activated, missing };
}

/**
 * בקרת "הצג שער משנה" (בקשת משתמש U-C2): טוגל שקובע אם עמודי שער־משנה
 * מוכנסים לפריסה. הערכה עצמה נטענת; הטוגל שולט בהצגה בלבד.
 */
function showShaarSubDecision(settings) {
  return settings['show-shaar-sub'] === true;
}

/**
 * מודל בורר ויזואלי (U-C1/C2, בקשת גלריית V21): לכל ערכה — שם + תצוג־מקדים
 * מהשער הראשי (תמונה, לא רק שם). ה־UI (S10) מרנדר מהמודל הזה בלבד.
 * @returns {Array<{id:string, label:string, preview:string|null, hasSub:boolean, hasBack:boolean, setNo:number|null}>}
 */
function buildPickerModel(themeSets) {
  return (themeSets || []).map(t => ({
    id: t.key,
    label: t.label,
    preview: t.previewImage,
    hasSub: Boolean(t.sub),
    hasBack: Boolean(t.back),
    setNo: t.setNo
  }));
}

module.exports = {
  ROLES, ROLE_HE, extractSetNumber, detectRole, uniqueShaarId, groupThemeSets,
  activateThemeSet, showShaarSubDecision, buildPickerModel
};

};
__modules["src/engine/decoration/toc-builder.js"] = function (require, module, exports) {
// src/engine/decoration/toc-builder.js — TOC general/detail pages, groups, dots, anchors (REQ-HDR-05, S9)
'use strict';

/**
 * **S9 (D-62) — עמודי תוכן־העניינים אמיתיים.** עד S8 נבנו רשומות בלבד (r.toc) בלי
 * עמודים; בכל הגרסאות הישנות ה‑TOC נבנה ב‑DOM לאחר העימוד (renderPaginatedTOC של IMUD)
 * וסבל מגלישות/תליה (F: "TOC hanging" — שורת קטלוג שתקעה את העימוד).
 *
 * מודל: (1) buildTocModel — רשומות לפי רמות + קיבוץ inline רצוף לשורת־קבוצה אחת
 * (IMUD buildStructuredTOC); (2) buildTocPages — זרימת שורות לעמודי toc-general/
 * toc-detail אמיתיים במדידה מראש (מדידת רוחב, עטיפת כותרת ארוכה עד 2 שורות, קטיעה
 * מעבר לכך + ממצא toc-overflow); (3) insertTocPages — הכנסה מבנית לפני צילום hash
 * ה‑CP4 (כמו שערי S8) + בניית תבניות מחדש לפי הזוגיות הסופית (D-63 — תיקון חבוי:
 * binding-offset נשאר תלוי בזוגיות קודמת להכנסות); (4) resolveTocTargets — עוגן
 * + תווית גיליון לפי המספור הסופי (תוויות בפורמט הגיליון — REQ-HDR-05).
 *
 * **תקציב איטרציה (stuck guard):** TOC_MAX_ROWS/TOC_MAX_PAGES — חריגה ⇒ ממצא
 * toc-budget-exceeded ועצירה דטרמיניסטית. אף לולאה לא חסרת חסם.
 */

const { PAGE_TYPES, buildPageTemplate } = require('../layout/page-templates');

const TOC_MAX_ROWS = 20000;     // תקציב שורות כולל (general+detail)
const TOC_MAX_PAGES = 500;      // תקציב עמודי TOC כולל
const TOC_MAX_TITLE_LINES = 2;  // כותרת ארוכה: עטיפה עד 2 שורות; מעבר ⇒ קטיעה + ממצא
const DOTS_MIN_PX = 24;         // שטח מינימלי לנקודות מובילות
const LABEL_RESERVE_PX = 48;    // שמורת רוחב לתווית גיליון (נפתרת אחרי המספור)
const ROW_GAP_PX = 4;
const TITLE_SIZE_PT = 16;
const TITLE_MARGIN_PX = 24;

/** גודל גופן לרמה (ברירות מחדל V1/V2: gtoc 12/11/10.5/8.8 — D-62). */
function levelSizePt(level) {
  if (level <= 1) return 12;
  if (level === 2) return 11;
  if (level <= 6) return 10.5;
  return 8.8; // H7 — שורות צד
}
function levelIndentPx(level) {
  return (Math.max(1, Math.min(7, level)) - 1) * 16;
}

/** עטיפת כותרת: שורות מילים עד ‏2; מעבר ⇒ קטיעה בסימון '…'. מילה בודדת רחבה
 *  מהשורה אינה ניתנת לעטיפה — מסומנת truncated (הממצא נרשם ב‑rowHeightOf). */
function wrapTitle(text, availPx, sizePt, measure) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  let truncated = false;
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const addW = measure(w, sizePt) + (cur.length ? measure(' ', sizePt) : 0);
    if (cur.length && curW + addW > availPx) {
      lines.push(cur.join(' '));
      cur = [w]; curW = measure(w, sizePt);
      if (lines.length >= TOC_MAX_TITLE_LINES) { truncated = true; break; } // שאר המילים נקצצות
    } else { cur.push(w); curW += addW; }
  }
  if (lines.length < TOC_MAX_TITLE_LINES && cur.length) lines.push(cur.join(' '));
  else if (cur.length) truncated = true; // נותרו מילים שלא נכנסו לתקציב השורות
  // מילה בודדת רחבה מהשורה — אינה עטיפה אפשרית:
  if (!truncated && lines.some(l => measure(l, sizePt) > availPx + 0.5)) truncated = true;
  if (truncated && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1] + ' …';
  }
  return { lines, truncated, full: !truncated };
}

/**
 * מודל TOC מרשימת כותרות. inline רצוף ⇒ שורת קבוצה אחת (group).
 * @param {Array} headings - [{level, text, tokenId, pageRef}]
 */
function buildTocModel(headings, settings) {
  const rows = [];
  let pendingGroup = null;
  const flushGroup = () => { if (pendingGroup && pendingGroup.items.length) { rows.push(pendingGroup); } pendingGroup = null; };
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const entry = {
      kind: 'entry', level: h.level, text: h.text,
      tokenId: h.tokenId, pageRef: h.pageRef,
      anchorId: `heading-tok-${h.tokenId}`,
      targetPage: null, label: '', rowNum: null, inline: false,
    };
    if (settings[`toc-level-${h.level}-inline`] === true) {
      entry.inline = true;
      (pendingGroup = pendingGroup || { kind: 'group', items: [], level: h.level }).items.push(entry);
    } else {
      flushGroup();
      rows.push(entry);
    }
  }
  flushGroup();
  return { rows };
}

/** מספור שורות (count-numbering): מספר סידורי לכל רשומה בעלת שורה משלה. */
function numberRows(rows, enabled) {
  if (!enabled) return;
  let n = 0;
  for (const r of rows) {
    if (r.kind === 'entry') r.rowNum = ++n;
    else for (const it of r.items) it.rowNum = ++n;
  }
}

/**
 * בניית עמודי TOC עצמם (זרימת שורות במדידה מראש — ללא DOM, ללא scrollHeight).
 * @param {object} model - תוצר buildTocModel
 * @param {string} pageType - 'toc-general' | 'toc-detail'
 * @param {string} title
 * @param {object} settings
 * @param {Function} measure - (text, sizePt?) => px
 * @param {Function} lineHeight - (sizePt?) => px
 * @param {object} io - { ledger, eventLog }
 */
function buildTocPages(model, pageType, title, settings, measure, lineHeight, io = {}) {
  const { ledger, eventLog } = io;
  const pages = [];
  const overflowFindings = [];
  let rowsConsumed = 0;
  let budgetExceeded = false;

  const mkPage = (isFirst) => {
    const tpl = buildPageTemplate(pageType, settings, (pages.length % 2) === 0);
    const pg = {
      index: -1, type: pageType, template: tpl,
      columns: Array.from({ length: tpl.columns.length }, () => []),
      footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
      fnReservedHeightPx: 0, chapterOpening: false,
      toc: { title: isFirst ? title : '', rows: [], isFirst },
    };
    pages.push(pg);
    return pg;
  };

  const rowHeightOf = (r) => {
    if (r.kind === 'group') {
      // קבוצה: שורה אחת רציפה — גובה לפי הגודל המקסימלי בקבוצה + הפרש
      const size = Math.max(...r.items.map(it => levelSizePt(it.level)));
      const text = r.items.map(it => it.text).join(' | ');
      const avail = Math.max(60, tplWidth() - levelIndentPx(r.items[0].level) - LABEL_RESERVE_PX - DOTS_MIN_PX);
      const { lines } = wrapTitle(text, avail, size, measure);
      r.wrapped = lines;
      return { h: lines.length * lineHeight(size) + ROW_GAP_PX, lines: 1, size };
    }
    const size = levelSizePt(r.level);
    const avail = Math.max(60, tplWidth() - levelIndentPx(r.level) - LABEL_RESERVE_PX - DOTS_MIN_PX);
    const { lines, truncated } = wrapTitle(r.text, avail, size, measure);
    r.wrapped = lines;
    if (truncated) {
      overflowFindings.push({ why: 'title-truncated', text: r.text.slice(0, 40), level: r.level });
    }
    return { h: lines.length * lineHeight(size) + ROW_GAP_PX, lines: lines.length, size };
  };

  let tplW = 0;
  const tplWidth = () => tplW;

  if (!model.rows.length) return { pages: [], overflow: overflowFindings, budgetExceeded };

  let cur = mkPage(true);
  tplW = cur.template.contentBox
    ? (cur.template.contentBox.right - cur.template.contentBox.left) || cur.template.width
    : cur.template.width;
  let availH = cur.template.contentBox.height - (TITLE_SIZE_PT * (96 / 72) + TITLE_MARGIN_PX);
  let usedH = 0;

  for (const r of model.rows) {
    if (budgetExceeded) break;
    rowsConsumed++;
    if (rowsConsumed > TOC_MAX_ROWS || pages.length > TOC_MAX_PAGES) {
      budgetExceeded = true;
      break;
    }
    const { h } = rowHeightOf(r);
    if (usedH + h > availH && cur.toc.rows.length) {
      if (pages.length >= TOC_MAX_PAGES) { budgetExceeded = true; break; }
      cur = mkPage(false);
      availH = cur.template.contentBox.height;
      usedH = 0;
    }
    // שורה בודדת גבוהה מעמוד שלם ⇒ אל תיתלה: הנח אותה ותעד (אין לולאה — usedH מתקדם תמיד)
    if (h > availH) {
      overflowFindings.push({ why: 'row-taller-than-page', level: r.level || (r.items && r.items[0].level) });
    }
    cur.toc.rows.push(r);
    usedH += Math.min(h, availH);
  }

  if (budgetExceeded && ledger) {
    const rec = ledger.create('toc-budget-exceeded', pageType, null,
      { rowsConsumed, pages: pages.length, maxRows: TOC_MAX_ROWS, maxPages: TOC_MAX_PAGES }, 'toc');
    ledger.transition(rec.issue_id, 'persists', 'toc', 'TOC iteration budget exceeded — deterministic stop (stuck guard)');
  }
  if (overflowFindings.length && ledger) {
    for (const o of overflowFindings) {
      const rec = ledger.create('toc-overflow', pageType, null, o, 'toc');
      ledger.transition(rec.issue_id, 'persists', 'toc', `TOC overflow (${o.why})`);
    }
  }
  if (eventLog) {
    eventLog.emit('toc', 'toc-pages-built', { type: pageType, pages: pages.length, rows: rowsConsumed, overflow: overflowFindings.length, budgetExceeded });
  }
  return { pages, overflow: overflowFindings, budgetExceeded };
}

/**
 * הכנסת עמודי TOC לרצף: אחרי הרצף המבני הפותח (שער ראשי/עמודים מותאמים בראש),
 * לפני כל דבר אחר. לאחר ההכנסה: אינדוקס מחדש + בניית תבניות לפי הזוגיות הסופית
 * (**D-63 — תיקון חבוי:** binding-offset חושב לפי אינדקס לפני הכנסות; כל הכנסה
 * משנה זוגיות והשאירה שוליים הפוכים. חל גם על שערי S8 שהוכנסו קודם).
 * כאשר binding≠0 וזוגיות עמוד השתנתה — השורות נמדדו לרוחב הישן; גלישה אפשרית
 * נבדקת ונרשמת כממצא binding-parity-shift (לא מוסתר).
 */
function insertTocPages(pages, tocPages, settings, io = {}) {
  if (!tocPages.length) return { pages, inserted: 0, at: 0 };
  // רצף פותח מבני: שער ראשי / עמודים מותאמים שהוצבו בראש
  let at = 0;
  while (at < pages.length && (pages[at].isShaar || pages[at].type === 'custom')) at++;
  const out = pages.slice(0, at).concat(tocPages, pages.slice(at));
  out.forEach((p, i) => { p.index = i; });
  // בניית תבניות מחדש לפי הזוגיות הסופית (D-63) — אותו סוג, אותן הגדרות, זוגיות נכונה
  const binding = settings['binding-offset-px'] || 0;
  const parityShifted = [];
  for (const p of out) {
    const newIsRecto = p.index % 2 === 0;
    const shifted = binding !== 0 && p.isRecto !== undefined && p.isRecto !== newIsRecto;
    p.template = buildPageTemplate(p.type, settings, newIsRecto);
    p.isRecto = newIsRecto;
    if (shifted) parityShifted.push(p);
  }
  // גלישה מטופלת בכנות: שורה שנמדדה לטור רחב וכעת צר יותר ⇒ ממצא (לא השתקה)
  if (parityShifted.length && io.ledger) {
    let overflowCount = 0;
    for (const p of parityShifted) {
      p.columns.forEach((col, ci) => {
        const cw = p.template.columns[ci] ? p.template.columns[ci].w : Infinity;
        for (const ln of col) {
          if ((ln.widthPx || 0) > cw + 0.5) overflowCount++;
        }
      });
    }
    if (overflowCount) {
      const rec = io.ledger.create('binding-parity-shift', 'toc-insertion', null,
        { pages: parityShifted.length, overflowLines: overflowCount, binding }, 'toc');
      io.ledger.transition(rec.issue_id, 'persists', 'toc',
        `binding≠0 + parity flip: ${overflowCount} line(s) exceed narrowed column after template rebuild`);
    }
    if (io.eventLog) io.eventLog.emit('toc', 'binding-parity-rebuild', { pages: parityShifted.length, overflowLines: overflowCount });
  }
  return { pages: out, inserted: tocPages.length, at };
}

/** פענוח עוגנים + תוויות לפי המספור הסופי (מופעל אחרי assignNumbers). */
function resolveTocTargets(pages, tocPages, numbers, settings, { formatLabel }) {
  let resolved = 0;
  for (const tp of tocPages) {
    for (const r of tp.toc.rows) {
      const entries = r.kind === 'group' ? r.items : [r];
      for (const e of entries) {
        e.targetPage = e.pageRef ? e.pageRef.index : null;
        const n = e.targetPage != null ? numbers[e.targetPage] : null;
        e.label = n && n.counted && n.page != null ? formatLabel(n.page) : '';
        resolved++;
      }
    }
  }
  return { resolved };
}

/**
 * רשומות TOC "ישנות" (תאימות לאחור — r.toc של ≤S8): כללי רמות 1–2, מפורט הכל.
 */
function buildTocEntries(headings, settings, numbersByIndex) {
  const entries = [];
  let numbered = 0;
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const idx = h.pageRef ? h.pageRef.index : h.page;
    const num = numbersByIndex ? numbersByIndex[idx] : null;
    numbered++;
    entries.push({
      level: h.level,
      text: h.text,
      pageLabel: num && num.display ? num.display : '',
      rowNum: settings['general-toc-count-numbering'] ? numbered : null,
      inline: !!settings[`toc-level-${h.level}-inline`],
      targetPage: idx,
      leaderDots: true,
    });
  }
  return entries;
}

function splitGeneralDetail(entries, settings = {}) {
  const genOn = settings['toc-general-enabled'] !== false;
  const detOn = settings['toc-detail-enabled'] === true;
  return {
    generalEnabled: genOn,
    detailEnabled: detOn,
    general: genOn ? entries.filter(e => e.level <= 2) : [],
    detail: detOn ? entries : [],
  };
}

module.exports = {
  buildTocModel, numberRows, buildTocPages, insertTocPages, resolveTocTargets,
  buildTocEntries, splitGeneralDetail, wrapTitle, levelSizePt, levelIndentPx,
  TOC_MAX_ROWS, TOC_MAX_PAGES, TOC_MAX_TITLE_LINES,
};

};
__modules["src/engine/layout/side-notes.js"] = function (require, module, exports) {
// src/engine/layout/side-notes.js — H7 side-notes / marginalia full contract (REQ-FN-05/06, S7.1.2)
'use strict';

/**
 * הערות צד (H7): עיגון לטוקן־אנקור, מיקום **בראש הפסקה המארחת** (לא בראש העמוד),
 * cascade דחיפה כלפי מטה, אצוות של H7 רצופים, נשארות מועברות לעמוד הבא
 * (pagePendingNotes), margin חיצוני לפי recto/verso, מיכל 20px.
 */

const CONTAINMENT_PX = 20; // חריגה מזערית מעבר למיכל — לא נחשב overlap אמיתי (ספרד קטלוג D3)
const STACK_GAP_PX = 8;    // מרווח בין הערות צד סמוכות בשוליים

/** פרופילי רוחב גופן להערות צד (s-note-body-font). */
const SIDE_NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

function estimateSideNoteHeight(text, settings, measureFn) {
  const size = settings['body-font-size-pt'] * 0.75; // הערות צד קטנות
  const lh = Math.round(size * (96 / 72) * 1.15);
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const colW = settings._sideNoteColWidthPx || Math.max(60, Math.round(settings._outerMarginPx || 120) - 12);
  const fontName = settings['s-note-body-font'];
  const factor = SIDE_NOTE_FONT_FACTORS[fontName] || (fontName && fontName !== settings['body-font'] ? 1.08 : 1);
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = (measureFn ? measureFn(word, size) : word.length * size * 0.6) * factor;
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lh;
}

/** מיקום Y של שורה בטור: גובה מצטבר מראש התוכן. */
function lineYTop(page, colIdx, lineIdx) {
  let y = page.template.contentBox.top;
  const col = page.columns[colIdx] || [];
  for (let i = 0; i < lineIdx && i < col.length; i++) y += col[i].heightPx || 0;
  return y;
}

/** מציאת שורת האנקור הראשונה בעמוד → (colIdx, lineIdx) או null. */
function findAnchorLine(page, anchorToken) {
  for (let c = 0; c < page.columns.length; c++) {
    for (let i = 0; i < page.columns[c].length; i++) {
      const ln = page.columns[c][i];
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok === anchorToken) return { colIdx: c, lineIdx: i };
    }
  }
  return null;
}

/**
 * מיקום הערות צד על עמודי התוצר.
 * @param {Array} pages - עמודי התוצר (עם columns + sideNotes)
 * @param {object} settings
 * @param {(text:string,sizePt:number)=>number} [measureFn]
 * @param {object} [hooks] — {ledger, eventLog} לרישום הזזות/דחיות
 * @returns {{placed:Array, deferred:Array}}
 */
function placeSideNotes(pages, settings, measureFn, hooks = {}) {
  const ledger = hooks.ledger || null;
  const eventLog = hooks.eventLog || null;
  const placed = [];
  const deferred = [];
  const pending = []; // pagePendingNotes — נשארות מועברות לעמוד הבא
  const overflowEvents = [];

  for (const page of pages) {
    // recto: שוליים חיצוניים בצד שמאל (RTL); verso: בצד ימין
    const outerX = page.isRecto !== false
      ? page.template.margins.side * 0.15
      : page.template.width - page.template.margins.side * 0.15 - (settings._sideNoteColWidthPx || 60);
    const cap = page.template.contentBox.height;
    const queue = [...pending.splice(0), ...(page.sideNotes || [])];
    page.sideNotes = []; // ייבנה מחדש לפי מה שבאמת מוקם בעמוד זה
    let lastBottom = -1;

    for (let i = 0; i < queue.length; i++) {
      const sn = queue[i];
      const h = sn.heightPx || estimateSideNoteHeight(sn.text, settings, measureFn);
      // **מיקום בראש הפסקה המארחת** (S7.1.2): עוגן לשורה הראשונה של האנקור בעמוד
      const anchor = findAnchorLine(page, sn.anchorToken);
      let yTop = anchor
        ? lineYTop(page, anchor.colIdx, anchor.lineIdx)
        : page.template.contentBox.top; // אנקור לא בעמוד זה ⇒ ראש תוכן
      // push-down cascade: אין לחפוף את ההערה הקודמת
      if (lastBottom >= 0 && yTop < lastBottom + STACK_GAP_PX) yTop = lastBottom + STACK_GAP_PX;
      // מיכל 20px: אין חריגה מסוף אזור התוכן
      if (yTop + h > page.template.contentBox.bottom + CONTAINMENT_PX) {
        deferred.push({ ...sn, reason: 'no-room', page: page.index });
        pending.push({ ...sn, deferredFrom: page.index });
        continue;
      }
      const rec = {
        ...sn, page: page.index,
        x: outerX, yTop,
        heightPx: h,
        batchGroup: sn.batchId || (anchor ? `${sn.anchorToken}` : `p${page.index}i${i}`),
        colWidth: settings._sideNoteColWidthPx || 60
      };
      placed.push(rec);
      page.sideNotes.push(rec); // מה שמוקם בפועל בעמוד זה (נרנדר)
      lastBottom = yTop + h;
      void cap;
    }
  }

  // **BRZ-15 — לא גניזה:** הערות שנותרו בתור אחרי העמוד האחרון — מוספים עמוד נוסף
  // שנושא אותן (אירוע מתועד; אינו מזיז עמודי גוף קיימים — הצפה בזנב).
  if (pending.length && pages.length) {
    const last = pages[pages.length - 1];
    const tpl = last.template;
    const tail = {
      index: pages.length ? pages[pages.length - 1].index + 1 : 0,
      type: 'regular', isRecto: pages.length % 2 === 0,
      template: { ...tpl, columns: tpl.columns.map(c => ({ ...c })) },
      columns: tpl.columns.map(() => []),
      footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
      fnReservedHeightPx: 0, chapterOpening: false, tailForSideNotes: true
    };
    pages.push(tail);
    let yTop = tail.template.contentBox.top;
    for (const sn of pending.splice(0)) {
      const h = sn.heightPx || estimateSideNoteHeight(sn.text, settings, measureFn);
      if (yTop + h > tail.template.contentBox.bottom + CONTAINMENT_PX) {
        // פתולוגי: הערה גבוהה מעמוד — נרשם כממצא, לא נגנז (מוקם בחריגת מיכל מתועדת)
        overflowEvents.push({ anchor: sn.anchorToken, heightPx: h, reason: 'taller-than-page' });
        if (ledger) {
          const rec = ledger.create('side-note-overflow', `sn@${sn.anchorToken}`, tail.index, { heightPx: h }, 'decorations');
          ledger.transition(rec.issue_id, 'persists', 'decorations', 'note taller than a page — placed with documented containment breach');
        }
      }
      const rec = { ...sn, page: tail.index, x: tail.isRecto !== false ? tail.template.margins.side * 0.15 : tail.template.width - tail.template.margins.side * 0.15 - (settings._sideNoteColWidthPx || 60), yTop, heightPx: h, colWidth: settings._sideNoteColWidthPx || 60 };
      placed.push(rec);
      tail.sideNotes.push(rec);
      yTop += h + STACK_GAP_PX;
    }
    if (eventLog) eventLog.emit('decorations', 'side-notes-tail-page', { page: tail.index, count: tail.sideNotes.length }, tail.index);
  }

  return { placed, deferred, overflow: overflowEvents };
}

/**
 * אימות המרת H7 → הערת צד (S7.1.3): השוואה per-paragraph על בסיס **עוגן הטוקן**,
 * לא חיפוש טקסט — כפילות טקסט בגוף (תיקון המשתמש) אינה false-positive.
 * @param {Array} sourceTokens - טוקני המקור (headings עם level 7 / mode side-note)
 * @param {Array} pages - עמודי התוצר
 * @param {{placed:Array}} placement - פלט placeSideNotes
 */
function verifyH7Conversion(sourceTokens, pages, placement) {
  const mismatches = [];
  const placedAnchors = new Set((placement ? placement.placed : []).map(p => p.ownToken || p.anchorToken)); // ownToken = הטוקן של ההערה עצמה; anchorToken = הפסקה המארחת
  for (const t of sourceTokens) {
    if (t.type === 'heading' && (t.level === 7 || t.mode === 'side-note')) {
      if (!placedAnchors.has(t.id)) {
        mismatches.push({ token: t.id, text: t.text, kind: 'h7-conversion-missing' });
      }
    }
  }
  void pages;
  return mismatches;
}

module.exports = { placeSideNotes, verifyH7Conversion, estimateSideNoteHeight, CONTAINMENT_PX, STACK_GAP_PX };

};
__modules["src/engine/decoration/ornament-plan.js"] = function (require, module, exports) {
// src/engine/decoration/ornament-plan.js — L5 decoration pass: ornaments/dividers/shaar deco (S8, REQ-ORN-01..04)
'use strict';

/**
 * פאס העיטורים (L5) — סינכרוני, **אסור לו לשנות גובה שנמדד (invariant T1)**.
 * כל העיטורים הם overlay-rects על העמוד (page.decorations) — לעולם לא נוגעים
 * ב־page.columns. הניטרליות מוכחת ע"י bodyGeometryHash לפני/אחרי (D-47).
 *
 * **לקחי העבר שנסגרים כאן:**
 * - F-08: כל עיטור שצורך גובה חייב להיות בגודלו הסופי **לפני** בדיקת ההתאמה —
 *   כאן ההתאמה (fits/chapterEndOrnamentFit) רצה על הממדים הסופיים בלבד;
 *   אין פוסט־פרוסס מאוחר ש"מגלה" גובה שלא תוקצב.
 * - F-09: מקור יחיד לממדים — ה־rect שמחושב כאן; הרנדרר מצייר ממנו בלבד.
 * - F-21: סימטריית מרווחים אפקטיביים של עיטורי H2 — נבדקת כ‑ornament-asymmetry
 *   על המיקומים בפועל (לא על ערכי CSS).
 *
 * **מיני־קטלוג ממצאים (kinds):** ornament-overflow / ornament-overlap / ornament-asymmetry —
 * לכל אחד מייצר בפועל (בדיקת רגישות מוכיחה שהזרקת פגם ⇒ ממצא נרשם; אנטי־קישוט).
 */

const {
  fitOrnamentToText, chapterEndOrnamentFit, h2OrnamentScope, h2OrnamentMarginsPx,
  sideOrnamentOffsetY, sideOrnamentLiftPx, assertSingleSourceSizing
} = require('./ornament-fit');
const { headingDividerDecision, shaarDividerDecision, createDividerCounters } = require('./dividers');

/** גובה ברירת־מחדל לעיטור סיום פרק (em של גוף הטקסט). */
const ORN_NATURAL_W_EM = 4, ORN_NATURAL_H_EM = 1.2;
const DIVIDER_H_PX = 2;
const H2_ORN_W_EM = 3, H2_ORN_H_EM = 0.6;

function bodyFontPx(settings) {
  return Math.round(settings['body-font-size-pt'] * 96 / 72 * 100) / 100;
}

/** סכום גובה שורות טור. */
function colUsed(colLines) {
  return colLines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
}

/** מדידת רוחב טקסט שורה דרך MeasureAPI (מדידת JS — CSS fit-content נכשל; REQ-ORN-01). */
function lineWidthPx(ln, measureFn) {
  const text = (ln.words || []).join(' ');
  try { return measureFn(text); } catch { return 0; }
}

/**
 * הפאס המלא. מופעל מהצינור ב־CP4 אחרי הערות הצד.
 * @param {Array} pages - תוצר dp-planner (+ shaar/custom pages שהוכנסו מבנית)
 * @param {object} settings
 * @param {function} measureFn - (text, sizePx?) => widthPx
 * @param {object} io - { ledger, eventLog }
 * @returns {{planted:number, rejected:Array, counters:object, findings:object}}
 */
function planPageOrnaments(pages, settings, measureFn, io = {}) {
  const ledger = io.ledger, eventLog = io.eventLog;
  const counters = createDividerCounters(); // rollback-aware, reset per document
  const planted = { chapterEnd: 0, headingDivider: 0, h2Top: 0, h2Bottom: 0, h2Side: 0, h3Side: 0, shaarDivider: 0 };
  const rejected = [];
  const fontPx = bodyFontPx(settings);
  const h2Margins = h2OrnamentMarginsPx(fontPx);
  const scope = h2OrnamentScope(settings);

  // עמודי סוף־פרק: גבול פרק (chapterOpening) מצביע אחורה על העמוד האחרון
  // שאינו מבני (עמודי שער/מותאמים אינם עמודי סוף־פרק — אין בהם תוכן פרק).
  const isStructural = (p) => Boolean(p.isShaar) || p.type === 'custom';
  const chapterEndPages = new Set();
  pages.forEach((p, i) => {
    if (p.chapterOpening && i > 0) {
      for (let j = i - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }
    }
  });
  for (let j = pages.length - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    page.decorations = page.decorations || [];
    const tpl = page.template;
    if (!tpl || !tpl.columns) continue;

    // ---------- 1. עיטורי H2 (עמודי פתיחת סימן; REQ-ORN-01/02, F-08/F-09/F-21) ----------
    // **FWD-1:** כותרת H2 במודל full-width מוצבת בפס חוצה־טורים (page.spanning)
    // ולא בטור — העיטורים נמדדים מהפס. H2 במודל regular נשאר בטור (מסלול עמוד).
    // **F-08:** ההזמנה (orn.topPx/bottomPx) כבר נכנסה לגובה הפס/תיבות השורות בזמן
    // הפריסה — כאן רק מציבים את העיטור בתוך האזור שהוזמן. אין גלישה ואין חפיפה.
    if (page.type === 'sign-open' && scope.any) {
      const spanLines = page.spanning && page.spanning.lines.length
        ? page.spanning.lines.filter(l => l.kind === 'heading' && l.level === 2)
        : [];
      const col = page.columns[0] || [];
      let h0 = -1;
      if (spanLines.length) {
        h0 = 0; // הפס מתחיל בראש תיבת התוכן
      } else {
        for (let i = 0; i < col.length; i++) {
          if (col[i].kind === 'heading' && col[i].level === 2) { h0 = i; break; }
        }
      }
      if (h0 >= 0) {
        const titleLines = spanLines.length ? spanLines : (function () {
          let hEnd = h0;
          while (hEnd + 1 < col.length && col[hEnd + 1].kind === 'heading' && col[hEnd + 1].level === 2) hEnd++;
          return col.slice(h0, hEnd + 1);
        })();
        const colX = tpl.columns[0].x, colW = tpl.columns[0].w;
        const titleW = Math.max(1, ...titleLines.map(ln => lineWidthPx(ln, measureFn)));
        // מקור יחיד למידות (F-09): ההזמנה שחושבה בזמן הפריסה — לא חישוב כפול כאן
        const orn = (spanLines.length && page.spanning.orn) || titleLines[0].h2Orn || null;
        const w = orn ? orn.ornW : Math.round(H2_ORN_W_EM * fontPx);
        const h = orn ? orn.ornH : Math.round(H2_ORN_H_EM * fontPx);
        const ornMargins = orn ? orn.margins : h2Margins;
        // הכותרת מתחילה אחרי ההזמנה העליונה (פס: titleTopPadPx; טור: padding שורה ראשונה)
        const topPad = spanLines.length ? (page.spanning.titleTopPadPx || 0) : (titleLines[0].h2OrnPadTop || 0);
        const linesBefore = spanLines.length ? 0 : col.slice(0, h0).reduce((s, ln) => s + (ln.heightPx || 0), 0);
        const titleTop = tpl.contentBox.top + linesBefore + topPad;
        const titleH = titleLines.reduce((s, ln) => s + (ln.heightPx || 0), 0)
          - (spanLines.length ? 0 : ((titleLines[0].h2OrnPadTop || 0) + (titleLines[titleLines.length - 1].h2OrnPadBottom || 0)));
        const titleBottom = titleTop + titleH;
        const cx = colX + colW / 2;

        if (scope.signTop) {
          const y = titleTop - ornMargins.top - h; // בתוך האזור שהוזמן (F-08)
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-top', kindStyle: settings['h2-orn-top'], x: Math.round(cx - w / 2), y, w, h, marginGapTop: titleTop - (y + h) }, rejected, pi);
          planted.h2Top++;
        }
        if (scope.signBottom) {
          const y = titleBottom + ornMargins.bottom; // בתוך ההזמנה התחתונה
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-bottom', kindStyle: settings['h2-orn-bottom'], x: Math.round(cx - w / 2), y, w, h, marginGapBottom: y - titleBottom }, rejected, pi);
          planted.h2Bottom++;
        }
        if (scope.titleSide) {
          // צדדיים לכותרת: התאמת גובה לגובה הכותרת + הרמה אופטית −0.08em (שיעור V4)
          const sideH = Math.min(h, Math.round(titleH));
          const lift = sideOrnamentLiftPx(fontPx);
          const gap = Math.round(fontPx * 0.35);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-right', kindStyle: settings['h2-orn-side'], x: Math.round(colX + colW - titleW - gap - w), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-left', kindStyle: settings['h2-orn-side'], x: Math.round(colX + titleW + gap), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi);
          planted.h2Side += 2;
        }
      }
    }

    // ---------- 2. עיטורי צד H3 (REQ-ORN-01: התאמת גובה לשורה) ----------
    if ((settings['h3-side-orn'] || 'none') !== 'none') {
      const sideH = Math.round(Number(settings['h3-side-orn-height-em']) * fontPx);
      const nCols = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית (טור פנטום)
      for (let c = 0; c < nCols; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || ln.level !== 3) continue;
          if (!ln.meta || !ln.meta.firstOfBlock) continue; // רק ראשית כותרת — לא כל שורה
          const yTop = tpl.contentBox.top + col.slice(0, i).reduce((s, l) => s + (l.heightPx || 0), 0);
          const lineH = ln.heightPx || fontPx;
          const lift = sideOrnamentLiftPx(fontPx);
          const yy = yTop + sideOrnamentOffsetY(lineH, sideH) + lift;
          const wSide = Math.round(fontPx * 1.2);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(colX + colW - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(colX), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi);
          planted.h3Side += 2;
        }
      }
    }

    // ---------- 3. מפרידי כותרות H3–H6 (REQ-ORN-04: fits() בכל אתרי ההוספה) ----------
    if (settings['heading-dividers-h3-h6']) {
      const nColsD = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית
      for (let c = 0; c < nColsD; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || !(ln.level >= 3 && ln.level <= 6)) continue;
          // **תיקון שורש (ביקורת 03.11): מפריד אחד לכל כותרת — מתחת לשורתה
          // האחרונה. בעבר הוצב מפריד בכל שורה של כותרת גולשת (5 שורות ⇒ 5 מפרידים
          // עם מפתח rollback זהה ⇒ התנגשות מונים). השורה האחרונה = אין שורת
          // המשך לאותו tokenId בטור זה, ואין המשך בראש הטור הבא.
          const continuesInCol = !!(col[i + 1] && col[i + 1].kind === 'heading' && col[i + 1].tokenId === ln.tokenId);
          const continuesNextCol = !!(page.columns[c + 1] && page.columns[c + 1][0]
            && page.columns[c + 1][0].kind === 'heading' && page.columns[c + 1][0].tokenId === ln.tokenId);
          if (continuesInCol || continuesNextCol) continue;
          const before = col.slice(0, i + 1); // כולל הכותרת — המשמרת בודקת ראש־טור/ריק
          const usedSoFar = before.reduce((s, l) => s + (l.heightPx || 0), 0);
          const remaining = tpl.contentBox.height - usedSoFar;
          const dec = headingDividerDecision(settings, remaining, DIVIDER_H_PX, {
            columnLinesBefore: before, colIdx: c, pageIndex: pi, tokenId: (ln.meta && ln.meta.tokenId) || ln.tokenId
          });
          if (dec.insert) {
            counters.record(dec.rollbackKey);
            const y = tpl.contentBox.top + usedSoFar - Math.round((ln.heightPx || 0) / 2) - 1;
            const wDiv = Math.min(Math.round(colW * 0.5), Math.round(fontPx * 6));
            pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${ln.level}`, kindStyle: 'thin', x: Math.round(colX + (colW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi);
            planted.headingDivider++;
          } else if (dec.why !== 'disabled' && dec.why !== 'column-head-or-empty') {
            rejected.push({ page: pi, kind: 'heading-divider', why: dec.why });
          }
        }
      }
    }

    // ---------- 4. מפרידי שערים (REQ-ORN-04) ----------
    {
      const dec = shaarDividerDecision(page.type, settings);
      if (dec.insert) {
        const wDiv = Math.round(tpl.columns[0].w * 0.4);
        const y = tpl.contentBox.bottom - Math.round(fontPx * 2);
        pushOrnament(page, { kind: 'shaar-divider', slot: `shaar-div-${page.type}`, kindStyle: dec.style, x: Math.round(tpl.columns[0].x + (tpl.columns[0].w - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX }, rejected, pi);
        planted.shaarDivider++;
      }
    }

    // ---------- 5. עיטור סיום־פרק (REQ-ORN-03: התאמה לתקציב שנותר; לא חוסם) ----------
    if (chapterEndPages.has(pi) && (settings['chapter-end-ornament'] || 'none') !== 'none') {
      // הטור האחרון הלא־ריק — שם נותר התקציב
      let last = -1;
      for (let c = 0; c < Math.min(page.columns.length, tpl.columns.length); c++) if (page.columns[c].length) last = c;
      if (last >= 0) {
        const col = page.columns[last];
        const used = colUsed(col);
        // התקציב הפנוי בפועל — בכפוף לפס החוצה־טורים (FWD-1) ולמרווח נשימה
        const cap = tpl.contentBox.height - (page.spanning ? page.spanning.heightPx : 0);
        const budget = cap - used - Math.round(fontPx * 0.5);
        const wPx = Number(settings['chapter-end-ornament-w-em']) * fontPx || ORN_NATURAL_W_EM * fontPx;
        const hPx = Number(settings['chapter-end-ornament-h-em']) * fontPx || ORN_NATURAL_H_EM * fontPx;
        const fit = chapterEndOrnamentFit(settings['chapter-end-ornament'], wPx, hPx, budget);
        if (fit.placed) {
          const colX = tpl.columns[last].x, colW = tpl.columns[last].w;
          pushOrnament(page, {
            kind: 'chapter-end-ornament', slot: 'chapter-end', kindStyle: settings['chapter-end-ornament'],
            x: Math.round(colX + (colW - fit.wPx) / 2), y: Math.round(tpl.contentBox.top + used + (budget - fit.hPx) / 2),
            w: fit.wPx, h: fit.hPx
          }, rejected, pi);
          planted.chapterEnd++;
        } else if (fit.reason !== 'kind-none' && fit.reason !== 'kind-unknown') {
          rejected.push({ page: pi, kind: 'chapter-end-ornament', why: fit.reason, budget: Math.round(budget) });
          // דחייה מתועדת — לא גנוזה (כלל "אין השבתת אבחון"): ledger במקום ממצא עיטור
          if (ledger) {
            const rec = ledger.create('ornament-rejected', `p${pi}`, pi, { kind: 'chapter-end', reason: fit.reason, budgetPx: Math.round(budget) }, 'ornaments');
            ledger.transition(rec.issue_id, 'persists', 'ornaments', `chapter-end ornament not placed: ${fit.reason}`);
          }
        }
      }
    }
  }

  // ---------- 6. אודיט עיטורים: מייצרים אמיתיים (שער S8.2) ----------
  const findings = auditOrnaments(pages, ledger);

  if (eventLog) {
    eventLog.emit('decorations', 'ornament-pass', {
      planted: { ...planted, total: Object.values(planted).reduce((a, b) => a + b, 0) },
      dividersRecorded: counters.count(),
      rejected: rejected.length,
      findings: { overflow: findings.overflow.length, overlap: findings.overlap.length, asymmetry: findings.asymmetry.length }
    });
  }
  return { planted, rejected, counters, findings };
}

/** הוספת rect עיטור עם אימות מקור־יחיד (F-09). */
function pushOrnament(page, orn, rejected, pageIndex) {
  const check = assertSingleSourceSizing(orn);
  if (!check.ok) {
    rejected.push({ page: pageIndex, kind: orn.kind, why: `single-source-violation:${check.reason}` });
    return;
  }
  page.decorations.push({ ...orn, cssClass: `orn orn--${orn.kind} orn--${orn.kindStyle || 'plain'}` });
}

/**
 * אודיט עיטורים — predicates אמיתיים על ה־rects בפועל:
 * - ornament-overflow: עיטור חורג מתיבת התוכן של העמוד.
 * - ornament-overlap: שני עיטורים חופפים באותו עמוד (פטורים מוצהרים: רקע/טקסטורה
 *   שכבת־תשתית לכל העמוד).
 * - ornament-asymmetry: מרווחים אפקטיביים של עיטורי H2 עליון/תחתון אינם שווים (F-21).
 * @returns {{overflow:Array, overlap:Array, asymmetry:Array}}
 */
function auditOrnaments(pages, ledger) {
  const overflow = [], overlap = [], asymmetry = [];
  const EXCLUDED_FROM_OVERLAP = new Set(['page-background', 'page-texture']);

  for (const page of pages) {
    const decs = page.decorations || [];
    if (!decs.length) continue;
    const tpl = page.template;
    if (tpl && tpl.contentBox) {
      // תיבת העיטורים: תיבת התוכן + אזור h2-top-offset שמעליה (שמור לעיטורי פתיחת
      // סימן — עיטור H2 עליון חי שם כדין; לא גלישה). רקע/טקסטורה מחוץ לבדיקה.
      const decoTop = tpl.contentBox.top - (tpl.h2TopOffset || 0);
      for (const d of decs) {
        if (d.slot === 'page-background' || d.slot === 'page-texture') continue;
        if (d.y < decoTop - 0.5 || d.y + d.h > tpl.contentBox.bottom + 0.5) {
          overflow.push({ page: page.index, slot: d.slot, y: d.y, h: d.h, top: decoTop, bottom: tpl.contentBox.bottom });
        }
      }
    }

    // overlap — זוגות נחתכים (אזור חיובי בשני הצירים)
    for (let i = 0; i < decs.length; i++) {
      for (let j = i + 1; j < decs.length; j++) {
        const a = decs[i], b = decs[j];
        if (EXCLUDED_FROM_OVERLAP.has(a.slot) || EXCLUDED_FROM_OVERLAP.has(b.slot)) continue;
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix > 0.5 && iy > 0.5) {
          overlap.push({ page: page.index, a: a.slot, b: b.slot, ix: Math.round(ix), iy: Math.round(iy) });
        }
      }
    }

    // asymmetry — F-21: מרווח עליון אפקטיבי מול תחתון (H2 top/bottom pair)
    const top = decs.find(d => d.slot === 'h2-top');
    const bottom = decs.find(d => d.slot === 'h2-bottom');
    if (top && bottom && top.marginGapTop != null && bottom.marginGapBottom != null) {
      if (Math.abs(top.marginGapTop - bottom.marginGapBottom) > 1) {
        asymmetry.push({ page: page.index, topGap: top.marginGapTop, bottomGap: bottom.marginGapBottom });
      }
    }
  }

  // רישום ל‑ledger (עולה לדוח האבחון; לעולם לא מושתק)
  if (ledger) {
    for (const f of overflow) {
      const rec = ledger.create('ornament-overflow', `p${f.page}`, f.page, { slot: f.slot }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rect exceeds content box');
    }
    for (const f of overlap) {
      const rec = ledger.create('ornament-overlap', `p${f.page}`, f.page, { a: f.a, b: f.b }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rects intersect');
    }
    for (const f of asymmetry) {
      const rec = ledger.create('ornament-asymmetry', `p${f.page}`, f.page, { topGap: f.topGap, bottomGap: f.bottomGap }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'H2 ornament effective margins unequal (F-21)');
    }
  }
  return { overflow, overlap, asymmetry };
}

module.exports = { planPageOrnaments, auditOrnaments, ORN_NATURAL_W_EM, ORN_NATURAL_H_EM, DIVIDER_H_PX };

};
__modules["src/engine/decoration/dividers.js"] = function (require, module, exports) {
// src/engine/decoration/dividers.js — מפרידים: טורים, שערים, כותרות (S8 L5; נרשם S4)
// Invariant T1: מפריד הוא overlay — אסור לו לשנות גובה שנמדד.
'use strict';

const { columnDividerHeightPx, fits, dividerInsertable } = require('./ornament-fit');

/**
 * היקף (outline) של צורת SVG לפי סגנון — מחושב מ‑path אחד ללא יחידות מדידה חיצוניות (F-21).
 */
const OUTLINE_PATHS = {
  circle: 'M12 3a9 9 0 1 0 .01 0z',
  square: 'M4 4h16v16H4z',
  diamond: 'M12 2l10 10-10 10L2 12z',
  parenthesis: 'M8 3C4 7 4 17 8 21M16 3c4 4 4 14 0 18',
};

function framePath(style) {
  return OUTLINE_PATHS[style] || null;
}

/**
 * רנדור היקף בלבד (stroke only) — fill:none; אין מסכת/רקע ש"אוכל" את הספרה (V4 lesson).
 */
function renderFolioFrame(svgDoc, style, cx, cy, r) {
  const d = framePath(style);
  if (!d) return null;
  const p = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('transform', `translate(${cx - r} ${cy - r}) scale(${(2 * r) / 24})`);
  return p;
}

/**
 * מפריד בין הטורים: זכוכית־עמדת — לא תופס גובה בזרימה (T1).
 * גובה = Math.min(שני הטורים) − 8px (כלל V4) — נאכף גם תחת עומס (טורים לא־שווים).
 * @returns {{x,y,w,h}|null} יש למקם absolute; null אם no-divider/עמוד חד־טורי.
 */
function columnDividerGeometry(page, settings) {
  if (settings['column-divider-style'] === 'none') return null;
  if (page.template.columns.length < 2) return null;
  const h = columnDividerHeightPx([
    page.columns[0].reduce((s, l) => s + (l.heightPx || 0), 0),
    page.columns[1].reduce((s, l) => s + (l.heightPx || 0), 0),
  ]);
  if (h <= 0) return null;
  const [right, left] = page.template.columns;
  const x = left.x + left.w + (right.x - (left.x + left.w)) / 2; // מרכז המרזב
  return { x, y: page.template.contentBox.top, w: 1, h, style: settings['column-divider-style'] };
}

/**
 * מפרידי כותרות H3–H6 מתחת לכותרת (chk-hdr-dividers; שידרוג Orange):
 * הוספה רק אם fits() נמדד באתר ההצבה בפועל, הכותרת אינה בראש טור/עמוד ריק,
 * ומצב rollback-aware: ההחלטה ניתנת לביטול מבלי להשאיר מונה תלוי (reset per document).
 * @returns {{insert:boolean, heightPx?:number, why:string, rollbackKey?:string}}
 */
function headingDividerDecision(settings, remainingPx, dividerHeightPx, ctx = {}) {
  if (!settings['heading-dividers-h3-h6']) return { insert: false, why: 'disabled' };
  // משמרות REQ-ORN-04: לא בראש טור, לא בטור ריק — נבדק באתר ההצבה בפועל
  if (!dividerInsertable(ctx.columnLinesBefore, ctx.colIdx)) return { insert: false, why: 'column-head-or-empty' };
  if (!fits(remainingPx, dividerHeightPx)) return { insert: false, why: 'no-fit-budget' };
  return {
    insert: true,
    heightPx: dividerHeightPx,
    why: 'fit',
    rollbackKey: `hdr-div:${ctx.pageIndex}:${ctx.tokenId}` // rollback-aware — מזהה יציב לביטול
  };
}

/**
 * מפרידי שערים (REQ-ORN-04): main/sub — קו תחתון אופציונלי בעמוד השער.
 * PT-01: `shaar-main-divider`; PT-02: `shaar-sub-divider`.
 * @returns {{insert:boolean, style?:string, why:string}}
 */
function shaarDividerDecision(pageType, settings) {
  const mainStyle = settings['shaar-main-divider'];
  const subStyle = settings['shaar-sub-divider'];
  if (pageType === 'shaar-main') {
    if (!mainStyle || mainStyle === 'none') return { insert: false, why: 'disabled' };
    return { insert: true, style: mainStyle, why: 'fit' };
  }
  if (pageType === 'shaar-sub') {
    if (!subStyle || subStyle === 'none') return { insert: false, why: 'disabled' };
    return { insert: true, style: subStyle, why: 'fit' };
  }
  return { insert: false, why: 'not-a-shaar-page' };
}

/**
 * מונה מפרידים rollback-aware: כל מסמך מתחיל נקי (reset per document), וכל
 * ביטול (rollback) מסיר את הרישום — אין מונה תלוי אחרי נסיגה (שיעור Orange).
 */
function createDividerCounters() {
  const inserted = new Map(); // rollbackKey -> true
  return {
    record(key) { inserted.set(key, true); return key; },
    rollback(key) { return inserted.delete(key); },
    count() { return inserted.size; },
    has(key) { return inserted.has(key); }
  };
}

module.exports = {
  framePath, renderFolioFrame, columnDividerGeometry, headingDividerDecision,
  shaarDividerDecision, createDividerCounters
};

};
__modules["src/engine/layout/endnote-pages.js"] = function (require, module, exports) {
// src/engine/layout/endnote-pages.js — Endnote pagination engine (REQ-FN-03/04, S7.1.1)
'use strict';

const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { markerFor } = require('../notes/markers');

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font). */
const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

/**
 * בניית עמודי "הערות" / "…(המשך)" בסוף כל חלק:
 * - איפוס מונים per-part (counter reset policy; continuous ⇒ מונה כללי);
 * - כותרת: הוראת כותרת־מחלקה (D-40) אם ניתנה, אחרת endnote-title-text;
 * - 1/2 טורים לפי endnote-columns;
 * - f-note-body-font משפיע על מדידת רוחב מילה בגוף ההערה;
 * - סמן: markerFor לפי footnote-marker-style — **אותו מקור סמכות like the body**
 *   (בעבר היו שלושה ממירים שונים — אי־עקביות מספור, P1-3).
 * @param {Array} endnotes - [{text, part, num?, marker?, fromInline?, noteIndex?}]
 * @param {object} settings - כולל _endnoteColCapPx, _endnoteColWidthPx, _endnoteTitleByPart (Map part→title)
 */
function buildEndnotePages(endnotes, settings, measure, lineHeightPx, hooks = {}) {
  const eventLog = hooks.eventLog || null;
  const ledger = hooks.ledger || null;
  if (!settings['endnotes-enabled'] || !endnotes.length) return [];

  const byPart = new Map();
  const order = [];
  for (const n of endnotes) {
    const part = n.part || 1;
    if (!byPart.has(part)) { byPart.set(part, []); order.push(part); }
    byPart.get(part).push(n);
  }
  order.sort((a, b) => a - b);

  // מדיניות איפוס: continuous ⇒ מונה כללי; part/section/page ⇒ per-part (D-41)
  const continuous = settings['footnote-reset-policy'] === 'continuous';
  let globalSeq = 0;
  const perPartSeq = new Map();

  const style = settings['footnote-marker-style'];
  const cols = settings['endnote-columns'] === 2 ? 2 : 1;
  const cap = settings._endnoteColCapPx || Number.POSITIVE_INFINITY;
  const colW = (settings._endnoteColWidthPx || 300) / cols;
  const fontFactor = NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1;

  const pages = [];
  for (const part of order) {
    const notes = byPart.get(part);
    const titleBase = (settings._endnoteTitleByPart && settings._endnoteTitleByPart.get(part))
      || settings['endnote-title-text'] || 'הערות';
    let pageIndex = 0;
    let page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, false), cols);
    let usedY = 0;
    for (let ni = 0; ni < notes.length; ni++) {
      const n = notes[ni];
      // סמן: מהגוף (inline-refs — marker שהוקצה בpipeline) או לפי מספר המקור/מיקום
      let marker = n.marker;
      if (!marker) {
        if (continuous) { globalSeq++; marker = markerFor(globalSeq, style); }
        else {
          const s = (perPartSeq.get(part) || 0) + 1;
          perPartSeq.set(part, s);
          marker = markerFor(n.num != null ? n.num : s, style);
        }
      }
      const h = estimateNoteHeight(n.text, settings, measure, lineHeightPx, colW, fontFactor);
      if (usedY > 0 && usedY + h > cap) {
        pages.push(page);
        pageIndex++;
        page = mkPage(PAGE_TYPES.ENDNOTES, part, pageIndex, title(settings, titleBase, true), cols);
        usedY = 0;
      }
      page.notes.push({ ...n, marker, heightPx: h });
      usedY += h;
    }
    if (page.notes.length) pages.push(page);
  }

  if (eventLog) eventLog.emit('notes-budget', 'endnote-pages-built', { pages: pages.length, parts: order.length });
  if (ledger && pages.length === 0 && endnotes.length) {
    const rec = ledger.create('endnote-pagination', 'endnotes', null, { notes: endnotes.length, pages: 0 }, 'notes-budget');
    ledger.transition(rec.issue_id, 'persists', 'notes-budget', 'notes exist but no pages built');
  }
  return pages;
}

function mkPage(type, part, idx, heading, cols) {
  return {
    type, part, subIndex: idx, heading, notes: [],
    columns: Array.from({ length: cols }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [],
    balanceInfo: null, fnReservedHeightPx: 0,
    chapterOpening: false,
    isEndnotes: true
  };
}

function title(settings, base, isContinuation) {
  return isContinuation ? `${base} (המשך)` : base;
}

/** גובה הערה בעמודי ההערות — כולל פקטור גופן ורוחב טור אפקטיבי. */
function estimateNoteHeight(text, settings, measure, lineHeightPx, colW, fontFactor = 1) {
  const size = settings['body-font-size-pt'] * 0.8;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let lines = 1, w = 0;
  for (const word of words) {
    const ww = measure(word, size) * fontFactor;
    if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
  }
  return lines * lineHeightPx(size);
}

module.exports = { buildEndnotePages, estimateNoteHeight, NOTE_FONT_FACTORS };

};
__modules["src/engine/decoration/numbering-audit.js"] = function (require, module, exports) {
// src/engine/decoration/numbering-audit.js — Numbering invariants: pn-sequence / pn-overflow (S9.1.6)
'use strict';

/**
 * בודק אינווריאנטים עקביות מספור (S9.1.6): "sequence monotonic, no dup/skip except
 * declared blanks; feeds audit kind pn-*".
 *
 * **pn-sequence** — הפרות סדר בסדרת המספור:
 *  1. סודי העמודים הנספרים חייבים להיות 1..N בדיוק (ללא דילוג/כפילות).
 *  2. הערך האפקטיבי (סוד − start‑idx + initial) חייב להתאים לנוסחה לכל עמוד.
 *  3. הגיליונות המוצגים חייבים להיות מונוטוניים עולים בקפידה (בתוך עמודים נספרים).
 *  "declared blanks" (מותרים במפורש ואינם הפרה): עמוד לא‑נספר לפי תבנית/צ׳קבוקס
 *  (shaar/toc/endnotes/custom), עמוד פתיחת פרק (D-36 — נספר ואינו מוצג), סוד < start‑idx
 *  (נוסחת V1) ו‑position=none.
 *
 * **pn-overflow** — גלישת גיליון: טקסט הגיליון הממוסגר רחב מהתקציב (30% מרוחב תיבת
 * התוכן) או מרוחב העמוד כולו — מצב שהיה נשבר בפועל ב־daf-hebrew + מסגרות + מספרי אלפים.
 *
 * כל הפרה → ledger.create(kind, ...) + מעבר persists — אף אבחון לא מושתק (כלל 3).
 */

const FOLIO_BUDGET_PCT = 0.30; // 30% מרוחב תיבת התוכן — תקציב גיליון

/**
 * @param {Array} pages - עמודי הפלט (עם template.contentBox)
 * @param {Array} numbers - תוצר assignNumbers (מקביל לאינדקסים של pages)
 * @param {object} settings
 * @param {Function} measure - (text, sizePt?) => רוחב px
 * @param {object} io - { ledger, eventLog }
 * @returns {{sequence:Array, overflow:Array}}
 */
function auditNumbering(pages, numbers, settings, measure, io = {}) {
  const { ledger, eventLog } = io;
  const sequence = [];
  const overflow = [];

  // ---- pn-sequence: סודים רציפים + נוסחה + מונוטוניות תצוגה ----
  const counted = [];
  numbers.forEach((n, i) => { if (n.counted) counted.push({ i, ...n }); });
  const startIdx = Math.max(1, Math.round(settings['page-num-start-idx'] || 1));
  const initialValue = Math.round(settings['page-num-initial-value'] || 1);
  let expectedOrdinal = 0;
  let prevVisible = null;
  for (const c of counted) {
    expectedOrdinal++;
    if (c.ordinal !== expectedOrdinal) {
      sequence.push({ page: c.i, expected: expectedOrdinal, got: c.ordinal, why: 'ordinal-skip-or-dup' });
      expectedOrdinal = c.ordinal; // המשך בדיקה מהערך שהתקבל
    }
    const wantEffective = c.ordinal - startIdx + initialValue;
    if (c.page !== wantEffective) {
      sequence.push({ page: c.i, expected: wantEffective, got: c.page, why: 'effective-formula-mismatch' });
    }
    if (c.display && prevVisible !== null && !(c.page > prevVisible)) {
      sequence.push({ page: c.i, prev: prevVisible, got: c.page, why: 'display-not-monotonic' });
    }
    if (c.display) prevVisible = c.page;
  }

  // ---- pn-overflow: רוחב גיליון בתקציב ----
  pages.forEach((pg, i) => {
    const n = numbers[i];
    if (!n || !n.display) return;
    const contentW = pg.template && pg.template.contentBox
      ? (pg.template.contentBox.right - pg.template.contentBox.left) || pg.template.width
      : (pg.template ? pg.template.width : 794);
    const budget = Math.max(40, contentW * FOLIO_BUDGET_PCT);
    const w = measure(n.display);
    if (w > budget) {
      overflow.push({ page: i, widthPx: Math.round(w), budgetPx: Math.round(budget), text: n.display });
    }
  });

  // ---- ledger wiring (כל הפרה נרשמת; אין השתקה) ----
  if (ledger) {
    for (const s of sequence) {
      const rec = ledger.create('pn-sequence', `page:${s.page}`, s.page, s, 'folio');
      ledger.transition(rec.issue_id, 'persists', 'folio', `numbering sequence violation (${s.why})`);
    }
    for (const o of overflow) {
      const rec = ledger.create('pn-overflow', `page:${o.page}`, o.page, o, 'folio');
      ledger.transition(rec.issue_id, 'persists', 'folio', `folio display ${o.widthPx}px > budget ${o.budgetPx}px`);
    }
  }
  if (eventLog) {
    eventLog.emit('folio', 'pn-audit', { sequence: sequence.length, overflow: overflow.length, counted: counted.length });
  }
  return { sequence, overflow };
}

module.exports = { auditNumbering, FOLIO_BUDGET_PCT };

};
__modules["src/ui/worker-protocol.js"] = function (require, module, exports) {
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

};
__modules["src/audit/report-schema.js"] = function (require, module, exports) {
// src/audit/report-schema.js — Diagnostics report v2 (REQ-GOV-01/02, D-15; GEOM_KIND_NAMES נספח 1)
'use strict';

/**
 * 30+ סוגי ממצאים (canonical Hebrew kind names). כל kind חייב: הגדרה, חריג, מדידה.
 * false positives (B4) מסומנים non-finding כדי לא לשלוף אותם כבעיה.
 */
const GEOM_KIND_NAMES = {
  // שורות/פסקאות
  'sparse-line': 'שורה דלילה (קיצוץ)',
  'runt-line': 'שורת שדון',
  'widow-top': 'אלמנה תחילת עמוד',
  'widow-bottom': 'אלמנה סוף עמוד',
  'orphan-top': 'יתום תחילת עמוד',
  'orphan-bottom': 'יתום סוף עמוד',
  'note-marker-line-break': 'סמן הערה בסוף שורה',
  'drop-word': 'מילה נופלת',
  // איזון וגובה
  'column-imbalance': 'אי־איזון טורים',
  'page-underfill': 'עמוד חסר מילוי',
  'terminal-residual': 'שארית סופית (allowed)',
  'stretch-overshoot': 'מתיחה מעבר לעמוד',
  'containment-rounding': 'חריגת עיגול 10px (non-finding)',
  'containment': 'חריגת מיכל אמיתית',
  // הערות
  'fn-split-column': 'הערה שנקרעה בין טורים',
  'fn-split-page': 'הערה שנקרעה בין עמודים',
  'fn-overlap': 'חפיפת הערות',
  'fn-out-of-order': 'הערות לא לפי סדר',
  'h7-conversion-missing': 'הערת צד אבודה',
  'endnote-pagination': 'תקלה בעמודי הערות סיום',
  'side-note-overflow': 'גלישת הערת צד (S7)',
  'reading-order-break': 'שבירת סדר קריאה (P0-3)',
  // טיפוגרפיה ותווים
  'puat-leak': 'תו PUA החוצה',
  'text-completeness': 'אובדן טקסט',
  'paren-cross-boundary': 'סוגריים חוצי גבול',
  'unmatched-closer': 'סוגר ללא פותח (מדווח, לא מתוקן)',
  'first-word-cap-align': 'מילה ראשונה לא מיושרת cap-height',
  // כותרות ומבנה
  'heading-escort': 'כותרת ללא ליווי',
  'pn-sequence': 'רצף מספור שבור',
  'pn-duplicate': 'מספר כפול',
  'pn-overflow': 'חריגת רוחב מספור',
  'hdr-stale': 'כותרת עליונה מיושנת אחרי refresh',
  // גרפיקה
  'ornament-overflow': 'עיטור חורג',
  'ornament-overlap': 'עיטור חופף',
  'ornament-asymmetry': 'עיטור לא סימטרי',
  'divider-height': 'גובה מפריד שגוי',
  'shaar-not-shown': 'שער לא הוצג (F-10)',
  // ייצוא/סביבה
  'offline-request': 'בקשה חיצונית (exit 7)',
  'export-pagebreak-marker': 'סימן ⏎ בייצוא (F-01)',
  // governance
  'dead-control': 'פקד ללא צורך',
  'phantom-key': 'מפתח ללא צורך/פקד',
  'orphan-mechanism': 'מנגנון ללא דלת',
  'rollback-compromise': 'פשרת נסיגה (ledger)'
};

const NON_FINDINGS = new Set(['terminal-residual', 'containment-rounding']);

/** buildReport(resultTypeset, ledgerSummary) → JSON ע"פ schema v2.
 * תיקון P1-6: deterministic נמדד (hash שחזור) — לא קבוע מחרוזתי.
 * D-43: diagnostics-enabled=false ⇒ compact (בלי פירוט מעברים) — אף פעם לא הסתרת ממצאים. */
function buildReport(result, opts = {}) {
  const diagnosticsOn = result && result.settings ? result.settings['diagnostics-enabled'] !== false : true;
  const compact = opts.compact || !diagnosticsOn;
  // **דטרמיניזם נמדד (P1-6):** hash מחושב מחדש מהפלט ומושווה לתוצאה — לא קבוע.
  const { layoutHash } = require('../engine/layout/dp-planner');
  const recomputed = result.pages ? layoutHash(result.pages) : null;
  const deterministic = recomputed === result.layoutHash;
  const findings = [];
  for (const rec of result.ledger.issues.values()) {
    if (NON_FINDINGS.has(rec.kind)) continue;
    findings.push({
      id: rec.issue_id, kind: rec.kind, kindHe: GEOM_KIND_NAMES[rec.kind] || rec.kind,
      target: rec.target, page: rec.page, status: rec.status,
      predicate_before: rec.predicate_before, predicate_after: rec.predicate_after,
      capacity_before: rec.capacity_before, capacity_after: rec.capacity_after,
      transitions: compact ? undefined : rec.transitions.map(t => ({ state: t.state, stage: t.stage, note: t.note }))
    });
  }
  return {
    schema: 'diagnostics-v2',
    generated_by: 'red-unified',
    deterministic,
    layout_hash: result.layoutHash,
    content_hash_in: result.contentHashIn,
    geometry_neutral_verified: result.geometryNeutralVerified,
    dropped_events: result.events.droppedEvents, // חייב 0
    retreat: result.retreat,
    counts: tally(findings),
    findings: compact ? findings.filter(f => f.status !== 'resolved') : findings
  };
}

function tally(findings) {
  const t = {};
  for (const f of findings) t[f.kind] = (t[f.kind] || 0) + 1;
  return t;
}

module.exports = { GEOM_KIND_NAMES, NON_FINDINGS, buildReport, tally };

};

var __entry = "src/ui/engine-worker-main.js";
__modules[__entry](function (n) { return __require(__entry, n); }, { exports: {} }, {});
