#!/usr/bin/env node
// tools/build-worker-bundle.js — בונדלר CJS זעיר לשני חבילות הדפדפן (S10.1-1, D-65)
// 1) ui/engine-worker.bundle.js — המנוע המלא לטעינה ב־Worker (entry: engine-worker-main)
// 2) ui/app.bundle.js           — מעטפת ה־UI בלבד (entry: browser-entry) — בלי המנוע
//    (התעבורה ה-inline מוחרגת: בדפדפן רץ Worker אמיתי; החרגה מונעת גרירת המנוע פעמיים)
//
// אפס תלויות חיצוניות (עקרון הריפו). המודול היחיד שאינו יחסי — 'crypto' (builtin) —
// מוחלף בשימת SHA-256 סינכרונית (תואמת Node: נבדקת בבדיקת s10 מול crypto.createHash).
// פלט: קבצים נכנסים ל־git; מחוללים מחדש בכל שינוי מנוע (הערת הידחה בראש כל קובץ).
'use strict';

const fs = require('fs');
const path = require('path');

const RED = path.resolve(__dirname, '..', 'red-build');

const BUNDLES = [
  {
    name: 'worker',
    entry: 'src/ui/engine-worker-main.js',
    out: 'ui/engine-worker.bundle.js',
    exclude: [], // למנוע אין החרגות — כל המודולים נדרשים
    // **03.11 (ייצוא PDF/ZIP בדפדפן):** בחבילת ה־Worker נאגדים גם הנתיבים הכבדים
    // שסומנו node-only — הם אינם נכנסים לחבילת ה־UI בלבד. בלי זה, require העצל
    // של export-api היה נכשל בזמן ריצה (unresolved) גם ב־Worker.
    skipNodeOnly: false
  },
  {
    name: 'app',
    entry: 'src/ui/browser-entry.js',
    out: 'ui/app.bundle.js',
    exclude: ['src/ui/inline-transport.js'], // דפדפן: Worker אמיתי; ה-inline היה גורר את המנוע
    skipNodeOnly: true // הנתיבים הכבדים (PDF/ZIP מלאים) — ב־Worker בלבד (D-65)
  }
];

// ---------- שימת SHA-256 סינכרונית (ללא WebCrypto הא־סינכרוני) ----------
const SHA256_SHIM = `
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
`;

// ---------- שימת Buffer לדפדפן (03.11 — ייצוא PDF/ZIP ב-Worker + ייבוא DOCX) ----------
// תת-קבוצה נאמנה של Node Buffer: from/alloc/allocUnsafe/concat/isBuffer/byteLength +
// קריאה/כתיבה של UInt/Int 8/16/32 ב-LE/BE + toString(utf8/latin1/binary/hex/base64/ascii)
// + slice/subarray/equals/indexOf/fill. מימוש על Uint8Array — ללא תלות חיצונית.
// ב-Node החבילות נטענות עם Buffer האמיתי (globalThis.Buffer קיים ⇒ השימה לא מופעלת).
const BUFFER_SHIM = `
var __RealBuffer = (typeof globalThis !== 'undefined' && globalThis.Buffer && globalThis.Buffer.from) ? globalThis.Buffer : null;
var Buffer = __RealBuffer || (function () {
  'use strict';
  function utf8BytesOf(str) {
    var out = [];
    for (var i = 0; i < str.length;) {
      var c = str.codePointAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      i += c > 0xffff ? 2 : 1;
    }
    return out;
  }
  function decodeUtf8(bytes, start, end) {
    var s = '';
    for (var i = start; i < end;) {
      var c = bytes[i];
      if (c < 0x80) { s += String.fromCharCode(c); i++; }
      else if (c < 0xe0) { s += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2; }
      else if (c < 0xf0) { s += String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)); i += 3; }
      else {
        var cp = ((c & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
        var off = cp - 0x10000;
        s += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
        i += 4;
      }
    }
    return s;
  }
  function hexToBytes(h) {
    var out = [];
    if (h.length % 2) h = '0' + h;
    for (var i = 0; i < h.length; i += 2) out.push(parseInt(h.slice(i, i + 2), 16) || 0);
    return out;
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64ToBytes(s) {
    s = String(s).replace(/[^A-Za-z0-9+\\/]=*$/g, '').replace(/=+$/, '');
    var out = [], bits = 0, acc = 0;
    for (var i = 0; i < s.length; i++) {
      var v = B64.indexOf(s[i]);
      if (v < 0) continue;
      acc = (acc << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff); }
    }
    return out;
  }
  function bytesToB64(b, start, end) {
    var s = '';
    for (var i = start; i < end; i += 3) {
      var n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      s += (i + 1 < end) ? B64[(n >> 6) & 63] : '=';
      s += (i + 2 < end) ? B64[n & 63] : '=';
    }
    return s;
  }
  function Buf(arg, enc) {
    var u8;
    if (typeof arg === 'number') { u8 = new Uint8Array(arg); }
    else if (arg instanceof Uint8Array) { u8 = new Uint8Array(arg); } // העתקה (כמו Node)
    else if (arg instanceof ArrayBuffer) { u8 = new Uint8Array(arg); }
    else if (arg && arg.buffer instanceof ArrayBuffer) { u8 = new Uint8Array(arg.buffer, arg.byteOffset, arg.length); }
    else if (typeof arg === 'string') {
      var enc_ = String(enc || 'utf8').toLowerCase();
      var bytes = enc_ === 'latin1' || enc_ === 'binary'
        ? (function () { var a = []; for (var i = 0; i < arg.length; i++) a.push(arg.charCodeAt(i) & 0xff); return a; })()
        : enc_ === 'hex' ? hexToBytes(arg)
        : enc_ === 'base64' ? b64ToBytes(arg)
        : enc_ === 'ascii' ? (function () { var a = []; for (var i = 0; i < arg.length; i++) a.push(arg.charCodeAt(i) & 0x7f); return a; })()
        : utf8BytesOf(arg);
      u8 = new Uint8Array(bytes);
    } else if (arg && typeof arg.length === 'number') {
      u8 = new Uint8Array(arg);
    } else {
      throw new TypeError('Buffer: invalid argument');
    }
    Object.setPrototypeOf(u8, Buf.prototype);
    return u8;
  }
  Buf.prototype = Object.create(Uint8Array.prototype);
  Buf.prototype.constructor = Buf;
  Buf.prototype.toString = function (enc, start, end) {
    var e = String(enc || 'utf8').toLowerCase();
    var s = Math.max(0, start | 0), n = this.length;
    var t = Math.min(n, end == null ? n : (end | 0));
    if (e === 'latin1' || e === 'binary') { var o = ''; for (var i = s; i < t; i++) o += String.fromCharCode(this[i]); return o; }
    if (e === 'ascii') { var a = ''; for (var j = s; j < t; j++) a += String.fromCharCode(this[j] & 0x7f); return a; }
    if (e === 'hex') { var h = ''; for (var k = s; k < t; k++) h += (this[k] < 16 ? '0' : '') + this[k].toString(16); return h; }
    if (e === 'base64') return bytesToB64(this, s, t);
    return decodeUtf8(this, s, t); // utf8 (ברירת מחדל)
  };
  Buf.prototype.slice = function (start, end) {
    var s = start == null ? 0 : (start < 0 ? Math.max(0, this.length + start) : start);
    var e = end == null ? this.length : (end < 0 ? this.length + end : end);
    var u = new Uint8Array(this.buffer, this.byteOffset + s, Math.max(0, Math.min(this.length, e) - s));
    Object.setPrototypeOf(u, Buf.prototype);
    return u;
  };
  Buf.prototype.subarray = Buf.prototype.slice;
  Buf.prototype.equals = function (o) {
    if (!o || o.length !== this.length) return false;
    for (var i = 0; i < this.length; i++) if (this[i] !== o[i]) return false;
    return true;
  };
  Buf.prototype.fill = function (v) {
    var b = (typeof v === 'number') ? (v & 0xff) : (typeof v === 'string' && v.length ? v.charCodeAt(0) & 0xff : 0);
    for (var i = 0; i < this.length; i++) this[i] = b;
    return this;
  };
  Buf.prototype.indexOf = function (v, byteOffset) {
    var from = byteOffset | 0;
    if (typeof v === 'string') { // תמיכה מינימלית בתו בודד/מחרוזת קצרה
      for (var i = from; i <= this.length - v.length; i++) {
        var ok = true;
        for (var j = 0; j < v.length; j++) if (this[i + j] !== (v.charCodeAt(j) & 0xff)) { ok = false; break; }
        if (ok) return i;
      }
      return -1;
    }
    var needle = (v instanceof Uint8Array) ? v : Buf.from(v);
    for (var p = from; p <= this.length - needle.length; p++) {
      var m = true;
      for (var q = 0; q < needle.length; q++) if (this[p + q] !== needle[q]) { m = false; break; }
      if (m) return p;
    }
    return -1;
  };
  function mkRead(name, size, be, signed) {
    Buf.prototype[name] = function (off) {
      var v = 0;
      if (be) { for (var i = 0; i < size; i++) v = (v << 8) | this[off + i]; }
      else { for (var j = size - 1; j >= 0; j--) v = (v << 8) | this[off + j]; }
      if (signed && v >= (1 << (size * 8 - 1))) v -= (1 << (size * 8));
      return v;
    };
  }
  function mkWrite(name, size, be) {
    Buf.prototype[name] = function (v, off) {
      v = (v | 0) & ((size === 1 ? 0xff : size === 2 ? 0xffff : 0xffffffff));
      if (be) { for (var i = size - 1; i >= 0; i--) { this[off + i] = v & 0xff; v = Math.floor(v / 256); } }
      else { for (var j = 0; j < size; j++) { this[off + j] = v & 0xff; v = Math.floor(v / 256); } }
      return off + size;
    };
  }
  mkRead('readUInt8', 1, false, false); mkRead('readUInt16LE', 2, false, false); mkRead('readUInt16BE', 2, true, false);
  mkRead('readUInt32LE', 4, false, false); mkRead('readUInt32BE', 4, true, false);
  mkRead('readInt8', 1, false, true); mkRead('readInt16LE', 2, false, true); mkRead('readInt16BE', 2, true, true);
  mkRead('readInt32LE', 4, false, true); mkRead('readInt32BE', 4, true, true);
  mkWrite('writeUInt8', 1, false); mkWrite('writeUInt16LE', 2, false); mkWrite('writeUInt16BE', 2, true);
  mkWrite('writeUInt32LE', 4, false); mkWrite('writeUInt32BE', 4, true);
  mkWrite('writeInt8', 1, false); mkWrite('writeInt16LE', 2, false); mkWrite('writeInt16BE', 2, true);
  mkWrite('writeInt32LE', 4, false); mkWrite('writeInt32BE', 4, true);
  Buf.from = function (arg, enc, off, len) {
    if (typeof arg === 'string') return new Buf(arg, enc);
    if (arg instanceof Uint8Array || arg instanceof ArrayBuffer) {
      if (arg instanceof Uint8Array && (off != null || len != null)) {
        var s = off | 0, e = len == null ? arg.length : s + len;
        var cp = new Uint8Array(arg.subarray(s, e));
        Object.setPrototypeOf(cp, Buf.prototype);
        return cp;
      }
      return new Buf(arg);
    }
    if (arg && typeof arg.length === 'number') return new Buf(arg);
    throw new TypeError('Buffer.from: invalid argument');
  };
  Buf.alloc = function (size, fill) { var b = new Buf(size); if (fill != null) b.fill(fill); return b; };
  Buf.allocUnsafe = Buf.alloc;
  Buf.isBuffer = function (x) { return x instanceof Uint8Array && Object.getPrototypeOf(x) === Buf.prototype || x instanceof Buf; };
  Buf.byteLength = function (s, enc) {
    if (s instanceof Uint8Array || s instanceof ArrayBuffer) return s.byteLength != null ? s.byteLength : s.length;
    var e = String(enc || 'utf8').toLowerCase();
    var str = String(s);
    if (e === 'latin1' || e === 'binary' || e === 'ascii') return str.length;
    if (e === 'hex') return Math.ceil(str.length / 2);
    if (e === 'base64') return b64ToBytes(str).length;
    return utf8BytesOf(str).length;
  };
  Buf.concat = function (list) {
    var total = 0;
    for (var i = 0; i < list.length; i++) total += list[i].length;
    var u = new Uint8Array(total), p = 0;
    for (var j = 0; j < list.length; j++) { u.set(list[j], p); p += list[j].length; }
    Object.setPrototypeOf(u, Buf.prototype);
    return u;
  };
  return Buf;
})();
`;

function resolveRel(fromAbs, name) {
  const base = path.dirname(fromAbs);
  let p = path.resolve(base, name);
  const candidates = [p, p + '.js', path.join(p, 'index.js')];
  for (const c of candidates) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

/** **תיקון 03.11 ("unresolved require ../core/settings-registry"):** זיהוי סמן
 * node-only רק כשהוא מופיע **באותה שורה, לפני ה-require עצמו** (תחילית שורת קוד).
 * בעבר נבדק "שורה קודמת + שורה נוכחית מכילות את הסמן בכל מקום" — ותגובה שהזכירה
 * מילולית את הסמן מעל require רגיל גרמה לדילוג שקט (settings-registry לא נאגד
 * ⇒ קריסת ייצוא HTML בדפדפן). כאן: הסמן חייב להיות בקטע השורה שלפני מיקום
 * ה-require — קונבנציה חד-משמעית שלא נפרצת ע"י תגובות. */
const NODE_ONLY_RE = /\/\*\s*node-only\s*\*\//;
function isNodeOnlyRequire(src, matchIndex) {
  const lineStart = src.lastIndexOf('\n', matchIndex) + 1;
  const before = src.slice(lineStart, matchIndex);
  return NODE_ONLY_RE.test(before);
}

/** איסוף מודולים מנקודת כניסה. מחזיר Map<relPath, src> (מחריגים מוחלפים בסטאב). */
function collectBundle(entryRel, excludeSet, skipNodeOnly) {
  const modules = new Map(); // rel → src (excluded → stub)
  function walk(absFile) {
    const rel = path.relative(RED, absFile).split(path.sep).join('/');
    if (modules.has(rel)) return;
    if (excludeSet.has(rel)) {
      modules.set(rel, `throw new Error('bundle: module ${rel} excluded from this bundle (by design — see tools/build-worker-bundle.js)');`);
      return;
    }
    const src = fs.readFileSync(absFile, 'utf8');
    modules.set(rel, src);
    const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const name = m[1];
      // **S12 (D-65 הפרדה):** require מסומן /* node-only */ — נתיב Node בלבד
      // (PDF/ZIP מלאים); לא נאגד בחבילת דפדפן. הקריאה מוגנת בזמן ריצה
      // (typeof Buffer) — בדפדפן הודעה מפורשת, לא כשל שקט.
      // **03.11:** ההחרגה חלה על חבילת ה־UI בלבד (skipNodeOnly) — ב־Worker
      // המנוע המלא חייב להיות זמין לייצוא PDF/ZIP.
      if (skipNodeOnly && isNodeOnlyRequire(src, m.index)) continue;
      if (name === 'crypto') continue; // שימה חיצונית — מסופקת בזמן ריצה
      if (name === 'zlib') continue;  // **S11:** builtin של Node בלבד — בדפדפן require('zlib')→null
                                     // ואז zip-reader נופל למנפח הטהור (inflateRawPure) — אותו פלט
      if (!name.startsWith('.')) throw new Error(`bundle: non-relative require '${name}' in ${rel} — אסור בחבילת דפדפן`);
      const resolved = resolveRel(absFile, name);
      if (!resolved) throw new Error(`bundle: cannot resolve ${name} from ${rel}`);
      walk(resolved);
    }
  }
  walk(path.join(RED, entryRel));
  return modules;
}

function buildOne(cfg) {
  const excludeSet = new Set(cfg.exclude);
  const skipNodeOnly = cfg.skipNodeOnly !== false; // ברירת מחדל אחורה-תואמת: החרגה (חבילת UI)
  const modules = collectBundle(cfg.entry, excludeSet, skipNodeOnly);
  const entryRel = cfg.entry;

  let modulesOut = '';
  const pathEntries = [];
  for (const [rel, src] of modules) {
    modulesOut += `__modules[${JSON.stringify(rel)}] = function (require, module, exports) {\n${src}\n};\n`;
    const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[1] === 'crypto' || !m[1].startsWith('.')) continue;
      // **S12:** node-only — לא נאגד בחבילת UI; לא נרשם במפת הנתיבים שלה (הקריאה מוגנת בזמן ריצה)
      if (skipNodeOnly && isNodeOnlyRequire(src, m.index)) continue;
      const absFrom = path.join(RED, rel);
      const target = path.relative(RED, resolveRel(absFrom, m[1])).split(path.sep).join('/');
      pathEntries.push(`  ${JSON.stringify(`${rel}|${m[1]}`)}: ${JSON.stringify(target)}`);
    }
  }

  const out = `// ${cfg.out} — **נוצר אוטומטית** ע"י tools/build-worker-bundle.js (אין לערוך ידנית)
// חבילת ${cfg.name === 'worker' ? 'ה־Worker (המנוע המלא — אין לטעון בחוט ה־UI)' : 'מעטפת ה־UI (המנוע רץ ב־Worker הנפרד)'}
// מודולים: ${modules.size} · בלי חותמות זמן (דטרמיניזם)
'use strict';
${SHA256_SHIM}
${BUFFER_SHIM}
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
${pathEntries.join(',\n')}
};
${modulesOut}
var __entry = ${JSON.stringify(entryRel)};
__modules[__entry](function (n) { return __require(__entry, n); }, { exports: {} }, {});
`;

  const outPath = path.join(RED, cfg.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`build-worker-bundle [${cfg.name}]: ${modules.size} modules → ${cfg.out} (${(out.length / 1024).toFixed(1)} KB)`);
}

for (const cfg of BUNDLES) buildOne(cfg);
console.log('both bundles built ✓');
