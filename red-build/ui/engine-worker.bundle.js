// ui/engine-worker.bundle.js — **נוצר אוטומטית** ע"י tools/build-worker-bundle.js (אין לערוך ידנית)
// חבילת ה־Worker (המנוע המלא — אין לטעון בחוט ה־UI)
// מודולים: 61 · בלי חותמות זמן (דטרמיניזם)
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
    s = String(s).replace(/[^A-Za-z0-9+\/]=*$/g, '').replace(/=+$/, '');
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
  "src/ui/engine-worker-main.js|../engine/typography/measure-api": "src/engine/typography/measure-api.js",
  "src/ui/engine-worker-main.js|../engine/decoration/asset-registry": "src/engine/decoration/asset-registry.js",
  "src/ui/engine-worker-main.js|../engine/output/export-api": "src/engine/output/export-api.js",
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
  "src/engine/core/pipeline.js|../layout/legacy-imud-flow": "src/engine/layout/legacy-imud-flow.js",
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
  "src/engine/layout/legacy-imud-flow.js|../typography/measure-api": "src/engine/typography/measure-api.js",
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
  "src/audit/report-schema.js|../engine/layout/dp-planner": "src/engine/layout/dp-planner.js",
  "src/engine/decoration/asset-registry.js|./svg-sanitize": "src/engine/decoration/svg-sanitize.js",
  "src/engine/output/export-api.js|../core/settings-registry": "src/engine/core/settings-registry.js",
  "src/engine/output/export-api.js|./dom-renderer": "src/engine/output/dom-renderer.js",
  "src/engine/output/export-api.js|./html-export": "src/engine/output/html-export.js",
  "src/engine/output/export-api.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/export-api.js|../import/zip-reader": "src/engine/import/zip-reader.js",
  "src/engine/output/export-api.js|../core/pipeline": "src/engine/core/pipeline.js",
  "src/engine/output/export-api.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/output/export-api.js|../typography/font-metrics": "src/engine/typography/font-metrics.js",
  "src/engine/output/export-api.js|../typography/font-subset": "src/engine/typography/font-subset.js",
  "src/engine/output/export-api.js|./geometry-projector": "src/engine/output/geometry-projector.js",
  "src/engine/output/export-api.js|./pdf-writer": "src/engine/output/pdf-writer.js",
  "src/engine/output/export-api.js|./legacy-projector": "src/engine/output/legacy-projector.js",
  "src/engine/output/export-api.js|../typography/font-metrics": "src/engine/typography/font-metrics.js",
  "src/engine/output/export-api.js|./zip-writer": "src/engine/output/zip-writer.js",
  "src/engine/output/export-api.js|./project-io": "src/engine/output/project-io.js",
  "src/engine/output/export-api.js|../extensions/extensions-io": "src/engine/extensions/extensions-io.js",
  "src/engine/output/export-api.js|../import/zip-reader": "src/engine/import/zip-reader.js",
  "src/engine/output/export-api.js|./project-io": "src/engine/output/project-io.js",
  "src/engine/output/export-api.js|../extensions/extensions-io": "src/engine/extensions/extensions-io.js",
  "src/engine/output/dom-renderer.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/output/dom-renderer.js|../decoration/page-decorations": "src/engine/decoration/page-decorations.js",
  "src/engine/output/dom-renderer.js|../decoration/shaar-boxes": "src/engine/decoration/shaar-boxes.js",
  "src/engine/output/dom-renderer.js|../decoration/ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/engine/output/dom-renderer.js|../decoration/asset-registry": "src/engine/decoration/asset-registry.js",
  "src/engine/output/dom-renderer.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/dom-renderer.js|../decoration/folio": "src/engine/decoration/folio.js",
  "src/engine/output/dom-renderer.js|./line-font": "src/engine/output/line-font.js",
  "src/engine/output/dom-renderer.js|./shaar-content": "src/engine/output/shaar-content.js",
  "src/engine/decoration/page-decorations.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/typography/font-subset.js|./font-metrics": "src/engine/typography/font-metrics.js",
  "src/engine/output/geometry-projector.js|./dom-renderer": "src/engine/output/dom-renderer.js",
  "src/engine/output/geometry-projector.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/output/geometry-projector.js|./line-font": "src/engine/output/line-font.js",
  "src/engine/output/geometry-projector.js|./shaar-content": "src/engine/output/shaar-content.js",
  "src/engine/output/legacy-projector.js|../layout/legacy-imud-flow": "src/engine/layout/legacy-imud-flow.js",
  "src/engine/output/legacy-projector.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/output/zip-writer.js|../import/zip-reader": "src/engine/import/zip-reader.js",
  "src/engine/output/project-io.js|../core/settings-registry": "src/engine/core/settings-registry.js",
  "src/engine/extensions/extensions-io.js|./style-schema": "src/engine/extensions/style-schema.js",
  "src/engine/extensions/extensions-io.js|../decoration/custom-pages": "src/engine/decoration/custom-pages.js"
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
  // **S4.9 (פרופיל העימוד המקורי):** הגדרות שמקורן ב-default_settings.json של
  // התוכנה המקורית (importImudSettings מסמן layout-profile='imud' ומצרף
  // את ה-JSON הגולמי) ⇒ הפעלת הפורט הנאמן של מנוע המקור. התנהגות המקור
  // היא המפרט — כולל הגיאומטריה המדויקת שנמדדה מקובצי הייחוס שהעלה המשתמש
  // (בקשת 03.11: "בדיקת עימוד מתמטית ומוחלטת דרך וורקפלו").
  if (settingsIn && settingsIn['_layout-profile'] === 'imud' && settingsIn._imudRaw) {
    const { legacyTypeset } = require('../layout/legacy-imud-flow');
    return legacyTypeset(rawText, settingsIn, env);
  }
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
  // **S4.5 (03.11):** מזהי הטקסט מוגדרים — קידומת הערת סיום ותוחמי הערות מגיעים
  // מההגדרות (ברירת מחדל = המקור: 'הערת סיום -', '[', ']'). ערך ריק מבטל זיהוי.
  const parseOpts = {
    endnotePrefix: settings['en-line-prefix'],
    fnOpen: settings['fn-delim-open'],
    fnClose: settings['fn-delim-close']
  };
  const { metadata, bodyLines } = lexDocument(rawText, parseOpts);
  const tokens = tokenize(bodyLines, parseOpts);
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
  const scope = scanBrackets(segments, { open: parseOpts.fnOpen, close: parseOpts.fnClose });
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
  // **S4.5:** שם הספר — גם המזהה הארוך של המקור (שם הספר) וגם הקצר (ספר) ו-title;
  // וכיסוי הגדרת-על של השער (imud-book-title) גוברת על כולם (החלטה מפורשת של המשתמש).
  const bookName = settings['imud-book-title'] || metadata['שם הספר'] || metadata['ספר'] || metadata['title'] || '';
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
  K('first-word-size-em', 'number', 2, P.TYPO, 'rng-fw-size-em', ['typography/dropword'], 'fx:fw-size-em', { min: 1, max: 4, step: 0.1, note: 'S4.5: גודל המילה הראשונה ב-em (המקור: size-first-word=1.5; בעבר היה כפול 2 מוקשה)' }),
  K('first-word-font', 'font', '', P.TYPO, 'sel-fw-font', ['typography/dropword'], 'fx:fw-font', { note: 'S4.5: גופן נפרד למילה הראשונה (המקור: font-first-word=FrankReal); ריק = גופן הגוף' }),
  K('dh-auto-detect', 'bool', true, P.TYPO, 'chk-dh-detect', ['parser/block-tokenizer'], 'fx:dh-detect', { note: 'דיבור המתחיל עד נקודה/מקף' }),
  K('dh-font', 'font', 'David HB', P.TYPO, 'sel-dh-font', ['typography/measure-api'], 'fx:dh-font'),
  K('body-last-line-align', 'enum', 'center', P.TYPO, 'sel-last-line-align', ['output/dom-renderer'], 'fx:last-line-align', { enum: ['center', 'right', 'stretch'], note: 'wiring מ‑Orange ✓' }),

  // ---- כותרות 0–7 (HEADINGS) ----
  // **03.11(ד):** ברירות המחדל של המצבים נאמנות למקור: h3=span_1col ⇒ full-width
  // (פס חוצה־טורים), h4–h6=inline_2col ⇒ regular (בתוך הטור — שם נשתלים עיטורי
  // הצד והמפרידים), h7=side_note ⇒ side-note. בעבר כולן full-width — ואז כותרת
  // שנמדדה ב-674px הוצבה בטור 270px (גלישה/חפיפה — דיווח משתמש 3).
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(h => [
    K(`heading-${h}-mode`, 'enum', h === 7 ? 'side-note' : h >= 4 ? 'regular' : 'full-width', P.HEADINGS, `sel-h${h}-mode`, ['layout/headings-escort'], `fx:h${h}-mode`, { enum: ['full-width', 'regular', 'side-note', 'new-page'] }),
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
  K('h2-orn-scope', 'enum', 'both', P.ORNAMENTS, 'sel-h2-orn-scope', ['decoration/ornament-fit'], 'fx:h2-orn-scope', { enum: ['none', 'sign', 'title', 'both'], note: 'REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם / כלום. **S4.6 (ביקורת 3):** none נוסף — במקור IMUD h2-title-orn-mode=none היה מומר ל-both (היפוך הגדרת המשתמש); ornament-fit כבר תומך (scope-off)' }),
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

  // ---- נכסי הפרויקט המקורי IMUD_TORANI (03.11, EXT-14 — הטמעה) ----
  // הערכים הם הפניות 'imud:<collection>:<id>' — נפתרות בזמן רינדור דרך asset-registry.
  // הפיקרים (בחירת עיצוב מהספרייה) חיים ב-UI (imud-decorations.js); המפתחות כאן
  // משמרים את הבחירה בתבניות/חבילות פרויקט ומזרימים אותה למנוע.
  K('imud-shaar-main', 'string', '', P.THEMES, 'inp-imud-shaar-main', ['decoration/page-decorations'], 'fx:imud-shaar-main', { note: 'עיצוב שער ראשי מספריית IMUD (הפניה imud:shaar-main:<id>) — מפעיל את עמודי השער' }),
  K('imud-shaar-sub', 'string', '', P.THEMES, 'inp-imud-shaar-sub', ['decoration/page-decorations'], 'fx:imud-shaar-sub', { note: 'עיצוב שער משנה מספריית IMUD (imud:shaar-sub:<id>)' }),
  K('imud-shaar-back', 'string', '', P.THEMES, 'inp-imud-shaar-back', ['decoration/page-decorations'], 'fx:imud-shaar-back', { note: 'עיצוב שער אחורי מספריית IMUD (imud:shaar-back:<id>)' }),
  K('imud-orn-top', 'string', '', P.ORNAMENTS, 'inp-imud-orn-top', ['decoration/ornament-plan'], 'fx:imud-orn-top', { note: 'עיטור עליון לסימן H2 — עיצוב IMUD; דורש h2-orn-top=image' }),
  K('imud-orn-bottom', 'string', '', P.ORNAMENTS, 'inp-imud-orn-bottom', ['decoration/ornament-plan'], 'fx:imud-orn-bottom', { note: 'עיטור תחתון לסימן H2 — עיצוב IMUD; דורש h2-orn-bottom=image' }),
  K('imud-orn-side', 'string', '', P.ORNAMENTS, 'inp-imud-orn-side', ['decoration/ornament-plan'], 'fx:imud-orn-side', { note: 'עיטור צדדי (H2/H3) — עיצורי IMUD; דורש h2-orn-side/h3-side-orn=image' }),
  K('imud-chapter-end', 'string', '', P.ORNAMENTS, 'inp-imud-chapter-end', ['decoration/ornament-plan'], 'fx:imud-chapter-end', { note: 'עיטור סיום־פרק — עיצוב IMUD; דורש chapter-end-ornament=image' }),
  K('imud-divider', 'string', '', P.ORNAMENTS, 'inp-imud-divider', ['decoration/ornament-plan'], 'fx:imud-divider', { note: 'מפריד סעיפים מעוצב (323 עיצובים) — משמש מפרידי שער/כותרות במצב תמונה' }),
  K('imud-book-title', 'string', '', P.THEMES, 'inp-imud-book-title', ['output/dom-renderer'], 'fx:imud-book-title', { note: 'כותרת הספר בשער (עקיפת מטא-נתוני המסמך אם הוגדר)' }),
  K('imud-book-subtitle', 'string', '', P.THEMES, 'inp-imud-book-subtitle', ['output/dom-renderer'], 'fx:imud-book-subtitle', { note: 'כותרת־משנה בשער' }),
  // **03.11(ד) — דיווח משתמש 3 ("אין עמודי שער, אין כותרות עליונות, שום דבר מהגדרות
  // ברירת המחדל אינו קיים"): המקור (IMUD_TORANI default_settings.json) מחזיק
  // show-main-shaar=true / show-sub-shaar=true / show-back-shaar=true כברירת מחדל —
  // השערים חלק ממבנה הספר, לא אופציה. מפתחות המתגים המפורשים משחזרים זאת.
  K('shaar-main-enabled', 'bool', true, P.THEMES, 'chk-shaar-main', ['decoration/shaar-pages'], 'fx:shaar-main', { note: '03.11(ד): שער ראשי כברירת מחדל — כמקור (show-main-shaar=true). מתג שער-העיצוב/ערכת-הנושא מוסיף רקע מעוצב, לא מחליף את המתג' }),
  K('shaar-sub-enabled', 'bool', true, P.THEMES, 'chk-shaar-sub', ['decoration/shaar-pages'], 'fx:shaar-sub', { note: '03.11(ד): שער־משנה לכל פתיחת חלק — כמקור (show-sub-shaar=true); show-shaar-sub הישן נשמר כמתג נוסף (או)' }),
  // **03.11(ד): תוכן מובנה של עמודי השער (פורט renderMainShaar/renderSubShaar/renderBackShaar
  // של המקור): גופנים/גדלים לכל רכיב. ברירות המחדל = ערכי המקור אחרי הסרת המשפחות
  // שאינן זמינות (Lia Sgula/Livorna/Alpha* אינן בספרייה — המקור עצמו נפל ל-Bellefair/
  // David Libre/Frank Ruhl Libre דרך ה-fallbacks, ואלה מוטמעים כעת בנכסים).
  K('shaar-title-font', 'font', 'Bellefair', P.THEMES, 'sel-shaar-title-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-title-font', { note: "מקור: f-sh-title=\"'Lia Sgula', 'Bellefair', serif\" — Lia Sgula אינה זמינה; Bellefair המוטמע" }),
  K('shaar-title-size-pt', 'number', 46, P.THEMES, 'rng-shaar-title-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-title-size', { min: 20, max: 90, note: 'מקור: s-sh-title=46' }),
  K('shaar-subtitle-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-subtitle-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-subtitle-font', { note: "מקור: f-sh-sub=\"'Livorna', 'David Libre', serif\"" }),
  K('shaar-subtitle-size-pt', 'number', 21, P.THEMES, 'rng-shaar-subtitle-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-subtitle-size', { min: 10, max: 40, note: 'מקור: s-sh-sub=21' }),
  K('shaar-desc-font', 'font', 'Frank Ruhl Libre', P.THEMES, 'sel-shaar-desc-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-desc-font', { note: "מקור: f-sh-desc=\"'Livorna', 'Frank Ruhl Libre', serif\"" }),
  K('shaar-desc-size-pt', 'number', 12, P.THEMES, 'rng-shaar-desc-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-desc-size', { min: 8, max: 20, note: 'מקור: s-sh-desc=12' }),
  K('shaar-sections-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-sections-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-sections-font', { note: "מקור: f-sh-sec=\"'David Libre', serif\"" }),
  K('shaar-sections-size-pt', 'number', 11.5, P.THEMES, 'rng-shaar-sections-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-sections-size', { min: 8, max: 20, note: 'מקור: s-sh-sec=11.5' }),
  K('shaar-author-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-author-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-author-font', { note: "מקור: f-sh-author=\"'David Libre', serif\"" }),
  K('shaar-author-size-pt', 'number', 15, P.THEMES, 'rng-shaar-author-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-author-size', { min: 8, max: 24, note: 'מקור: s-sh-author=15' }),
  K('shaar-year-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-year-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-year-font', { note: "מקור: f-sh-year=\"'David Libre', serif\"" }),
  K('shaar-year-size-pt', 'number', 12, P.THEMES, 'rng-shaar-year-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-year-size', { min: 8, max: 20, note: 'מקור: s-sh-year=12' }),
  K('shaar-back-text-font', 'font', 'David Libre', P.THEMES, 'sel-shaar-back-text-font', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-back-text-font', { note: 'גוף טקסט השער האחורי (שורות שמירת־זכויות) — מקור: David Libre' }),
  K('shaar-back-text-size-pt', 'number', 10.5, P.THEMES, 'rng-shaar-back-text-size', ['output/shaar-content', 'output/dom-renderer'], 'fx:shaar-back-text-size', { min: 8, max: 16, note: 'מקור: שורות ההמשך 10.5pt (השורה הראשונה 13pt מודגשת)' }),
  // נתוני הספר לשערים — ממופים מ-inp-book-* של המקור; בלי ערך — נופלים למטא-נתוני המסמך
  K('imud-book-desc', 'string', '', P.THEMES, 'inp-imud-book-desc', ['output/dom-renderer'], 'fx:imud-book-desc', { note: 'תיאור בשער הראשי (מקור: inp-book-desc ← «נושא מפורט»)' }),
  K('imud-book-sections', 'string', '', P.THEMES, 'inp-imud-book-sections', ['output/dom-renderer'], 'fx:imud-book-sections', { note: 'פרטי מהדורא בשער הראשי (מקור: inp-book-sections ← «פרטי מהדורא»)' }),
  K('imud-book-author', 'string', '', P.THEMES, 'inp-imud-book-author', ['output/dom-renderer'], 'fx:imud-book-author', { note: 'שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר»)' }),
  K('imud-book-year', 'string', '', P.THEMES, 'inp-imud-book-year', ['output/dom-renderer'], 'fx:imud-book-year', { note: 'מקום ושנת הוצאה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה»)' }),
  K('shaar-back-text', 'string', '', P.THEMES, 'inp-shaar-back-text', ['output/dom-renderer'], 'fx:shaar-back-text', { note: 'טקסט השער האחורי (מקור: inp-back-shaar-text; ברירת מחדל בזמן ריצה: «שמירת זכויות» מהמטא או ״כל הזכויות שמורות למחבר.״)' }),

  // ---- מזהי טקסט מוגדרים (S4.5 — chat-v20.3 היסטורי; ברירות מחדל = המקור) ----
  K('en-line-prefix', 'string', 'הערת סיום -', P.NOTES, 'inp-en-line-prefix', ['parser/dfa-lexer', 'parser/block-tokenizer'], 'fx:en-prefix', { note: 'שורה המתחילה בקידומת ⇒ הערת סיום (הקידומת אינה מופיעה בפלט). ריק = ביטול הזיהוי. הוראת כותרת עמודי ההערות — רק בצורת הרבים «הערות סיום - כותרת»' }),
  K('fn-delim-open', 'string', '[', P.NOTES, 'inp-fn-delim-open', ['parser/bracket-scanner', 'parser/block-tokenizer'], 'fx:fn-open', { note: 'תוחם פתיחת הערת שוליים; ריק = ביטול' }),
  K('fn-delim-close', 'string', ']', P.NOTES, 'inp-fn-delim-close', ['parser/bracket-scanner', 'parser/block-tokenizer'], 'fx:fn-close', { note: 'תוחם סגירת הערת שוליים (בברירת המחדל נתמכת גם הצורה ]ם); ריק = ביטול' }),

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
// src/engine/parser/dfa-lexer.js — Layer 1: metadata recognition ONLY in preamble (REQ-PAR-01, S4.5)
'use strict';

/**
 * **S4.5 (ביקורת 03.11, סקירה 2):** מזהי הטקסט של הפרויקט המקורי — רשימה מלאה.
 * המקור: default_settings.json + טקסט ברירת המחדל של IMUD_TORANI (app.js):
 *   שם הספר - … / נושא - … / נושא מפורט - … / פרטי מהדורא - … / שם המחבר - … /
 *   מקום ושנת הוצאה - … / שמירת זכויות - … / פרטי הוצאה לאור - … /
 *   פרטי קשר - … / פרטים נוספים - …
 * ולצדם המפתחות הקצרים שנתמכו תמיד (ספר, מחבר, מהדורא, מקום, שנה, מהדורה,
 * editors, title). הפתיח נסגר רק בשורה ריקה/כותרת/הערת סיום — לא בשורת מטא־נתון.
 */
const METADATA_KEYS = [
  // ארוכים (טקסט ברירת המחדל המקורי)
  'שם הספר', 'נושא', 'נושא מפורט', 'פרטי מהדורא', 'שם המחבר', 'מקום ושנת הוצאה',
  'שמירת זכויות', 'פרטי הוצאה לאור', 'פרטי קשר', 'פרטים נוספים',
  // קצרים (תמיכה היסטורית)
  'ספר', 'מחבר', 'מהדורא', 'מקום', 'שנה', 'מהדורה', 'editors', 'title'
];

const HEADING_RE = /^(כותרת\s*([0-7])|חלק\s+([א-ת]+)|הקדמה)\s*[-–—]\s*(.+)$/;

/** ברירת המחדל ההיסטורית של קידומת הערת הסיום (en-line-prefix, default_settings.json). */
const DEFAULT_ENDNOTE_PREFIX = 'הערת סיום -';

/**
 * **S4.5 (תיקון סיווג):** בניית ביטוי קידומת הערת סיום מהגדרת המשתמש.
 * קלט ריק/רווחים ⇒ null (זיהוי מבוטל — שורות נשארות פסקאות; החלטה מפורשת
 * של המשתמש, לא כשל שקט). הקידומת חייבת להסתיים במקף/מקף-ארוך/קו — אחרת
 * מוסיפים את המקף בעצמנו (ערך ההגדרה "הערת סיום" שקול ל-"הערת סיום -").
 */
function compileEndnotePrefix(prefix) {
  const p = String(prefix == null ? DEFAULT_ENDNOTE_PREFIX : prefix).trim();
  if (!p) return null;
  const withDash = /[-–—]$/.test(p) ? p : p + ' -';
  const esc = withDash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*').replace(/[-–—]/g, '[-–—]');
  return new RegExp('^' + esc + '\\s*(.*)$');
}

/** **S4.5:** הוראת כותרת עמודי ההערות — צורת רבים בלבד («הערות סיום - כותרת»).
 * הצורה הבסיסית של D-40 (/^הערת\s*סיום…/) התנגשה עם מזהה התוכן ההיסטורי
 * («הערת סיום - טקסט» = הערה) וגרמה להיעלמות תוכן. רבים (העערות/הערות) = מקטע;
 * יחיד (הערת) = תמיד תוכן. */
const ENDNOTE_CLASS_RE = /^הערות\s*סיום\s*[-–—]\s*(.+)$/;

/** ביטויי ברירת המחדל (תאימות לאחור לייבוא ישיר; tokenize מקבל opts ומזהה משם). */
const ENDNOTE_PREFIX = compileEndnotePrefix(DEFAULT_ENDNOTE_PREFIX);
const ENDNOTE_NUMBERED = /^הערת\s*סיום\s*[-–—]?\s*([0-9]{1,4})\s*[-–—]\s*(.+)$/;
const ENDNOTE_CLASS = ENDNOTE_CLASS_RE;

/**
 * DFA states: PREAMBLE -> BODY. יציאה מ‑PREAMBLE: שורה ריקה או כותרת ראשונה.
 * שורה כמו `נושא - דין סוכה ישנה` באמצע המסמך נשארת פסקה (REQ-PAR-01 / לקח Z.ai).
 * @param {string} rawText
 * @param {object} [opts] — { endnotePrefix: string } (S4.5: מזהה מוגדר; '' = מבוטל)
 */
function lexDocument(rawText, opts = {}) {
  const endnoteRe = opts.endnotePrefixRe instanceof RegExp
    ? opts.endnotePrefixRe
    : compileEndnotePrefix(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX);
  const lines = String(rawText).replace(/\r\n?/g, '\n').split('\n');
  const state = { phase: 'PREAMBLE' };
  const metadata = {};
  const body = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (state.phase === 'PREAMBLE') {
      if (trimmed === '') { state.phase = 'BODY'; continue; }
      if (HEADING_RE.test(trimmed) || (endnoteRe && endnoteRe.test(trimmed)) || ENDNOTE_CLASS_RE.test(trimmed)) {
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

module.exports = {
  lexDocument, HEADING_RE, ENDNOTE_PREFIX, ENDNOTE_NUMBERED, ENDNOTE_CLASS,
  ENDNOTE_CLASS_RE, METADATA_KEYS, DEFAULT_ENDNOTE_PREFIX, compileEndnotePrefix
};

};
__modules["src/engine/parser/block-tokenizer.js"] = function (require, module, exports) {
// src/engine/parser/block-tokenizer.js — H0–H7 / P / endnote / editorial tokens (REQ-PAR-03/04, CP1)
'use strict';

const crypto = require('crypto');
const { HEADING_RE, ENDNOTE_CLASS_RE, DEFAULT_ENDNOTE_PREFIX, compileEndnotePrefix } = require('./dfa-lexer');
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
 * - `הערת סיום - …` → **endnote (תוכן!)** — הסמנטיקה המקורית (S4.5, תיקון D-40):
 *   הקידומת מגדירה את הטקסט שאחריה כהערת סיום. במסמך המודפס הקידומת עצמה
 *   אינה מופיעה (כלל פענוח, לא עיטור — מסמך chat-v20.3 ההיסטורי).
 * - `הערת סיום-1 - טקסט` → endnote ממוספרת (D-40; עוגן סמן).
 * - `הערות סיום - כותרת` (רבים!) → הוראת כותרת עמודי ההערות — הצורה היחידה
 *   שאינה מתנגשת עם מזהה התוכן (ביקורת 03.11: הצורה הקודמת בלעה הערות אמיתיות).
 * - תוחמי הערות השוליים מוגדרים: opts.fnOpen/fnClose (ברירת מחדל [ ]).
 * - `[a][b]` רצופים → הערות נפרדות (REQ-PAR-04)
 * - בתוך `[...]`: רווחים → \uE000 (אטומי, REQ-LB-04)
 * @param {string[]} bodyLines
 * @param {object} [opts] — { endnotePrefix, endnotePrefixRe, fnOpen, fnClose } (S4.5)
 */
function tokenize(bodyLines, opts = {}) {
  tokenSeq = 0;
  // מזהה הערת הסיום: ביטוי מוכן (מה-lexer) או בנוי מהקידומת; '' ⇒ מבוטל
  const endnoteRe = opts.endnotePrefixRe instanceof RegExp
    ? opts.endnotePrefixRe
    : compileEndnotePrefix(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX);
  const endnoteNumRe = (() => {
    // ממוספרת: `הערת סיום-1 - טקסט` — נבנית מאותה קידומת (ללא המקף האחרון) + מספר + מקף
    const p = String(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX).trim() || DEFAULT_ENDNOTE_PREFIX;
    const base = p.replace(/[-–—]\s*$/, '').trim();
    if (!base) return null;
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    return new RegExp('^' + esc + '\\s*[-–—]?\\s*([0-9]{1,4})\\s*[-–—]\\s*(.+)$');
  })();
  const fnOpen = opts.fnOpen != null ? String(opts.fnOpen) : '[';
  const fnClose = opts.fnClose != null ? String(opts.fnClose) : ']';
  // S4.5: תוחם ריק/רווחים ⇒ הזיהוי מבוטל — scanBrackets מקבל את הערך הגולמי
  // (לא fallback ל-[) כדי שביטול מפורש לא ייהפך בטעות לזיהוי ברירת מחדל.
  const fnEnabled = fnOpen.trim().length > 0 && fnClose.trim().length > 0;
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
    // **S4.5 (תיקון D-40 — ביקורת 03.11):** סדר הבדיקות שהוחזר לסמנטיקה המקורית:
    // 1) ממוספרת (עוגן) 2) תוכן (כל שורה המתחילה בקידומת = הערה!) 3) הוראת
    // כותרת — רק בצורת הרבים «הערות סיום - …» שאינה יכולה להתנגש עם הקידומת.
    if (endnoteNumRe) {
      const mNum = line.match(endnoteNumRe);
      if (mNum) {
        tokens.push(mkToken('endnote', { num: Number(mNum[1]), text: mNum[2].trim(), raw: line }));
        continue;
      }
    }
    if (endnoteRe) {
      const mEnd = line.match(endnoteRe);
      if (mEnd && mEnd[1] && mEnd[1].trim()) {
        tokens.push(mkToken('endnote', { text: mEnd[1].trim(), raw: line }));
        continue;
      }
    }
    const mCls = line.match(ENDNOTE_CLASS_RE);
    if (mCls) {
      tokens.push(mkToken('endnote-class', { title: mCls[1].trim(), raw: line }));
      continue;
    }
    // editorial ##…## — הסרה מלאה (נרשם; לעולם לא נגלה בפלט — Spec §7)
    const editorial = line.match(/##(.+?)##/g);
    if (editorial) {
      for (const e of editorial) tokens.push(mkToken('editorial', { text: e.slice(2, -2), removed: true }));
      line = line.replace(/##.+?##/g, ' ').replace(/\s+/g, ' ').trim();
      if (!line) continue;
    }

    // חילוץ הערות [..] עם מחסנית; זוגות רצופים → הערות נפרדות; תוחמים מוגדרים (S4.5)
    const segs = scanBrackets([{ text: line, paraIndex: tokens.length }], { open: fnOpen, close: fnClose });
    let cursor = 0;
    const parts = [];
    const notes = [];
    // בנייה לפי pairs משמאל לימין (outermost first)
    const outer = segs.pairs.filter(p => p.depth === 1).sort((a, b) => a.open - b.open); // חיצוניים בלבד (depth 1)
    const openCh = fnEnabled ? fnOpen : '[';
    const closeCh = fnEnabled ? fnClose : ']';
    for (const p of outer) {
      const before = line.slice(cursor, p.open).trim();
      if (before) parts.push({ kind: 'text', value: before });
      // **S4.6 (ביקורת 3):** חיתוך לפי תחילת הסוגר + אורכו בפועל (closeStart/closeLen
      // מהסורק) — נכון גם לתוחמים מרובי-תווים (']]'/END) ולצורה העברית ]ם. בעבר
      // נוסף אורך התוחם המוגדר למיקום התו האחרון — קיצוץ/דילוג תווים בתוחם ארוך.
      const cs = p.closeStart != null ? p.closeStart : p.close;
      const cl = p.closeLen != null ? p.closeLen : closeCh.length;
      const noteText = line.slice(p.open + openCh.length, cs).trim().replace(/ +/g, ATOMIC_SPACE);
      notes.push(noteText);
      parts.push({ kind: 'note-ref', noteIndex: notes.length - 1 });
      cursor = cs + cl;
    }
    const tail = line.slice(cursor).trim();
    if (tail) parts.push({ kind: 'text', value: tail });

    tokens.push(mkToken('paragraph', { parts, notes, unmatchedClosers: segs.unmatchedClosers, raw: line }));
  }
  return tokens;
}

/** CP1: hash של מולטיסט הטוקנים — עקרון שימור תוכן (BRZ-15).
 * **S4.5 (ביקורת 03.11):** כותרת הוראת ההערות (endnote-class) נכנסת לחשיבון —
 * היא טקסט שמופיע בפלט (כותרת עמודי ההערות); השמטתה איפשרה בעבר לתוכן
 * שסווג בטעות כהוראה להיעלם בלי שה-hash יתריע. */
function contentHash(tokens) {
  const stable = JSON.stringify(tokens.flatMap(t => {
    if (t.type === 'paragraph') return [['P', ...t.parts.map(p => p.kind === 'text' ? p.value : `⟦${t.notes[p.noteIndex]}⟧`), String(t.notes.length)]];
    if (t.type === 'heading') return [['H', String(t.level), t.text]];
    if (t.type === 'endnote') return [['EN', String(t.num || ''), t.text]];
    if (t.type === 'endnote-class') return [['ENH', t.title]]; // directive — כותרתו תוכן מוצג (S4.5)
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
 * **S4.5 (03.11):** התוחמים מוגדרים — opts { open, close } (ברירת מחדל [ ]).
 * הצורה העברית "]ם" נבדקת רק בתוחם ברירת המחדל; תוחם מותאם מותאם בדיוק
 * (מחרוזת, בדרך כלל תו בודד). תוחם ריק ⇒ הזיהוי מבוטל (פסקאות טהורות).
 *
 * @param {Array<{text:string, paraIndex:number}>} segments - text runs tagged with paragraph index
 * @param {object} [opts] — { open: string, close: string }
 * @returns {{pairs:Array, unmatchedClosers:Array, unmatchedOpeners:Array, depthAt:(pos)=>number, scopeMap:Object}}
 */
function scanBrackets(segments, opts = {}) {
  const openTok = String(opts.open != null ? opts.open : '[').trim();
  const closeTok = String(opts.close != null ? opts.close : ']').trim();
  const useDefault = openTok === '[' && closeTok === ']';
  const enabled = openTok.length > 0 && closeTok.length > 0;
  /** תואם פותח במיקום i (מחרוזת מלאה). */
  const matchOpen = (text, i) => {
    if (!enabled) return 0;
    if (text.startsWith(openTok, i)) return openTok.length;
    return 0;
  };
  /** תואם סוגר במיקום i — {len, name} או null. בברירת המחדל: טבלת הצורות
   * (כולל "]ם" העברי); בתוחם מותאם: התאמה מדויקת בלבד. */
  const matchClose = (text, i) => {
    if (!enabled) return null;
    if (useDefault) return matchCloser(text, i);
    if (text.startsWith(closeTok, i)) return { len: closeTok.length, name: 'custom' };
    return null;
  };
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
      const openLen = matchOpen(text, i);
      if (openLen > 0) {
        const gp = globalPos + i;
        stack.push({ openPos: gp, para });
        depthMarks.push({ pos: gp, depth: stack.length });
        i += openLen;
      } else {
        const form = matchClose(text, i);
        if (!form) {
          depthMarks.push({ pos: globalPos + i, depth: stack.length });
          i += 1;
        } else if (stack.length === 0) {
          // Doctrine: report, never silently repair. Extra chars of the closer
          // are still consumed so positions stay consistent for downstream mappers.
          const gp = globalPos + i;
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
          const gp = globalPos + i;
          const o = stack.pop();
          pairs.push({
            open: o.openPos,
            close: gp + form.len - 1, // last character of the closer (חוזה היסטורי — נשמר)
            // **S4.6 (ביקורת 3):** חוזה משלים לתוחמים מרובי-תווים — תחילת הסוגר
            // ואורכו בפועל. בעבר הצרכן (block-tokenizer) התייחס ל-close כאילו היה
            // תחילת התוחם והוסיף שוב את אורך התוחם המוגדר — חיתוך שגוי ב-']]'/END.
            closeStart: gp,
            closeLen: form.len,
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
      hebrewClosers: pairs.filter(p => p.closerForm === 'hebrew-mem-sofit').length,
      delimiters: enabled ? { open: openTok, close: closeTok } : null // S4.5: מה בפועל נסרק
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
  // **03.11 (ביקורת):** חיבור ההגדרה — runt-min-width-pct מגיע כ-runts מה-pipeline
  // וכ-runtMinPct מקריאות ישירות; שניהם נקראים (בעבר רק runtMinPct נקרא וההגדרה לא השפיעה).
  const runts = opts.runtMinPct != null ? opts.runtMinPct : (opts.runts != null ? opts.runts : 50);
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
    // **S4.5 (03.11):** גודל וגופן המילה הראשונה — מהגדרות המקור (size-first-word=1.5,
    // font-first-word). בעבר היה כפול 2 מוקשה; כעת ברירת המחדל הרישומית = 2 (המשכיות
    // RED) והמיבוא מהמקור מציב 1.5. גופן ריק = גופן הגוף.
    fontSizePt: mode === 'drop'
      ? Math.round(settings['body-font-size-pt'] * (Number(settings['first-word-size-em']) || 2))
      : settings['body-font-size-pt'],
    fontFamily: settings['first-word-font'] || null, // null ⇒ גופן הגוף (ברירת המחדל של המקור: FrankReal)
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

    // **03.11(ד) — span_1col של המקור ל-H3–H6 (mode=full-width):** עד כאן כותרת
    // שנמדדה ברוחב מלא (674px) הוצבה בטור של 270px — שורה ברוחב 471px בטור
    // חצי-רוחב, נגררת בדפדפן לגלישה/חפיפה ("טקסטים אחד על השני" — דיווח משתמש 3).
    // עתה היא מוצבת בפס חוצה־טורים כמו H2 (FWD-1) — בלי עמוד חדש (המקור:
    // כותרת הענף ממשיכה באותו עמוד; עמוד חדש רק אם אין מקום לפס).
    if (blk.kind === 'heading' && blk.level >= 3 && blk.level <= 6 && blk.fullWidth) {
      if (cur.spanning || cur.columns.some(c => c.length)) {
        flushPage();
        cur = newPage(PAGE_TYPES.REGULAR);
      }
      if (!cur.spanning && cur.template.columns.length >= 2) {
        const bandH3 = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: bandH3,
          titleTopPadPx: 0,
          orn: null
        };
        eventLog.emit('page-plan', 'h3-spanning', { token: blk.tokenId, level: blk.level, heightPx: bandH3 }, cur.index);
        continue; // הכותרת בפס; הבלוקים הבאים ימלאו את הטורים מתחת
      }
    }

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
    // **03.11(ד):** עמודי תוכן־העניינים מציגים כותרת עליונה כמו המקור
    // (renderPaginatedTOC של המקור מרנדר top-header-grid בכל עמודי התוכן).
    hasRunningHead: [PAGE_TYPES.REGULAR, PAGE_TYPES.SIGN_OPEN, PAGE_TYPES.H3_SPREAD, PAGE_TYPES.PREFACE, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL].includes(type),
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
  let moves = 0; // **03.11 (ביקורת):** אמינות הדיווח — changed אמיתי רק אם הוזזה שורה
  while (pageImbalance(page) > maxDelta && guard++ < 500) {
    const a = usedHeight(page.columns[0]), b = usedHeight(page.columns[1]);
    const hi = a >= b ? 0 : 1, lo = 1 - hi;
    if (!moveLineForward(page.columns, hi, lo)) break; // אין מהלך חוקי — עוצרים בלי לדווח על שינוי
    moves++;
    // hard reject: אם נוצרה חריגת cap → rollback מלא
    const cap = page.template.contentBox.height;
    if (page.columns.some(c => usedHeight(c) > cap + 0.5)) {
      page.columns = snapshot;
      return { changed: false, before, after: before, rollback_reason: 'capacity' };
    }
  }
  // **03.11 (ביקורת):** בעבר הוחזר changed:true גם כשהלולאה נעצרה בלי שורה אחת —
  // דיווח מטעה של אבחון האיזון. כעת: שינוי אמיתי = הוזזה בפועל והפרש שהשתנה.
  const after = pageImbalance(page);
  return { changed: moves > 0 && after !== before, moves, before, after };
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
  // **03.11(ד) — תיקון D-36 חלקי, נאמן למקור:** במקור (top-header-grid) הכותרת
  // העליונה מוצגת בכל עמודי התוכן, כולל עמודי פתיחה של פרק/סימן. D-36 העלים
  // אותה מכל עמודי הפתיחה — ובספרים עשירי כותרות (כל עמוד פתיחה) זה הסתיר
  // את הכותרות לגמרי ("אין כותרות עליונות" — דיווח משתמש 3). עתה: כל עמוד
  // תבניתו hasRunningHead מציג כותרת; שערים/תוכן־עניינים/הערות נשארים בלי
  // (template.hasRunningHead=false שלהם). header-opening-dedicated נשמר כמצב
  // סלוטים ייעודי לפותחות H2/H3.
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
__modules["src/engine/layout/legacy-imud-flow.js"] = function (require, module, exports) {
// src/engine/layout/legacy-imud-flow.js — פורט נאמן של מנוע העימוד המקורי (פרופיל IMUD).
'use strict';

/**
 * **S4.9 (בקשת המשתמש 03.11: "בדיקה מתמטית ומוחלטת"):** פרופיל העימוד המקורי.
 *
 * מקורות האמת (שניהם מחויבים במאגר):
 *   1. audits/layout-reference.json — החילוץ המתמטי של פלט הגרסה הישנה (הצהובה)
 *      מקובצי ה-PDF שהעלה המשתמש, כולל הסימון הגיאומטרי הבלתי-נראה.
 *   2. audit/IMUD_TORANI/typesetter.js — קוד המקור של המנוע המקורי (הכתום).
 *
 * הפורט משחזר את ההתנהגות הנצפית של המקור: מבנה מסמך (שערים, תוכן-עניינים כפול,
 * עמוד חלק, פרקים), בלוקים דו-טוריים מאוזנים, שבירת שורות גרידה עם חלון מילה-ראשונה,
 * קשיחת שתי מילים אחרונות, הערות-שוליים בתחתית העמוד והערות צד בטורי השוליים —
 * הכל בגיאומטריה המדויקת של הייחוס.
 *
 * הפרופיל מופעל כאשר ההגדרות מגיעות מ-default_settings.json המקורי
 * (importImudSettings מסמן layout-profile='imud' ומצרף את ה-JSON הגולמי תחת
 * _imudRaw). המנוע הכללי (DP) נשאר לשאר הפרופילים — התנהגות המקור היא המפרט.
 */

const crypto = require('crypto');
const { MeasureAPI } = require('../typography/measure-api');

// ---------- גיאומטריה (px @96dpi; PDF = px×0.75) — מכויל מהייחוס ----------
const GEO = {
  PAGE_W: 793.7, PAGE_H: 1122.5,               // A4
  COL_W: 269.41,                                // רוחב טור (col:right 269 בתגיות המקור)
  COL_R_X: 403.61, COL_L_X: 120.72,             // שפות טורים (ימני/שמאלי)
  MARGIN_R_X: 686.3, MARGIN_L_X: 56.7, MARGIN_W: 50.5, // טורי שוליים (margin-col)
  FLOW_TOP: 96.7,                               // ראשית זרימת הגוף בעמוד רגיל
  FLOW_H: 925,                                  // **מכויל:** הייחוס ממלא עד ~1013px+; 925 מייצג את הקיבולת האפקטיבית
  LINE_H: 21,                                   // **מכויל מהייחוס:** פס הגוף הדומיננטי 15.75pt=21px (הדפסת הדפדפן מקרבת את 16×1.34=21.44 לפיקסל שלם)
  H2_SPACER: 180,                               // h2-spacer לפני סימן+כותרת
  HEADER_BASELINE: 71.9,                        // פס כותרת: גליפים 42.56–57.56pt
  FOLIO_BASELINE: 1054.5,                       // עמודון: y0=783.82pt (גליף ~1045px), ממורכז
  FN_AREA_TOP: 969.5,                           // תחילת מרזב ההערות (y0=727.1pt בייחוס)
  FN_PITCH: 16.7,                               // פס שורות הערה (8.5pt × 1.5 × 4/3)
  TOC_NUM_X: 66.1,                              // מספרי תוכן-עניינים בשמאל (x0≈49.6pt)
  TOC_TITLE_X1: 727.4,                          // שפה ימנית של כותרות תוכן-עניינים (545.6pt)
  TOC_STAIR: 8,                                 // מדרגת כניסה לפי רמה (padding-right 8px)
  MN_PITCH: 9.6                                 // פס שורות הערת-צד (8px × 1.2)
};

// גדלי גופן (pt — כמו הגדרות המקור; פיקסלים = pt×4/3)
const SZ = {
  body: 12, h0Title: 17, h0Body: 11.5, h2: 17, siman: 20, h3: 13.5,
  h4: 12.5, h5: 11.5, h6: 10.5, parenDelta: -2,
  fnBody: 8.5, fnMarker: 8, marginNote: 6, folio: 10.5,
  hdrR: 15, hdrC: 11, hdrL: 15, divider: 6.75,
  tocNum: 10.5, tocTitle: 17,
  tocLevel: { 1: 12, 2: 11, 3: 10.5, 4: 10, 5: 9.5, 6: 9, 7: 8.8 }
};

const HEADING_MODES = {
  0: 'new_page_1col', 1: 'sub_shaar', 2: 'new_page_1col', 3: 'span_1col',
  4: 'inline_2col', 5: 'inline_2col', 6: 'inline_2col', 7: 'side_note'
};

// ---------- עזרים ----------
function toGematria(num) {
  num = parseInt(num, 10);
  if (isNaN(num) || num <= 0) return '';
  if (num === 15) return 'טו';
  if (num === 16) return 'טז';
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  let str = '';
  let h = Math.floor(num / 100);
  if (h > 0) { str += hundreds[Math.min(h, 9)]; num %= 100; }
  const t = Math.floor(num / 10), o = num % 10;
  if (t === 1 && (o === 5 || o === 6)) str += (o === 5) ? 'טו' : 'טז';
  else str += tens[t] + ones[o];
  return str;
}

function stripEditorialNotes(text) {
  return String(text || '')
    .replace(/##[\s\S]*?##/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .trim();
}

const META_FIELDS = [
  ['bookTitle', /^(?:שם הספר[:\s]*)?שם הספר\s*[-–—:]\s*/i],
  ['subject', /^(?:נושא(?:\\|\/)כותרת משנה[:\s]*)?נושא\s*[-–—:]\s*/i],
  ['desc', /^(?:נושא מפורט\s*(?:\\|\/)\s*תיאור[:\s]*)?נושא מפורט\s*[-–—:]\s*/i],
  ['edition', /^(?:פרטי מהדורא\s*(?:\\|\/)\s*חלקים[:\s]*)?פרטי מהדורא\s*[-–—:]\s*/i],
  ['author', /^(?:שם המחבר[:\s]*)?שם המחבר\s*[-–—:]\s*/i],
  ['copyright', /^שמירת זכויות\s*[-–—:]\s*/i],
  ['publisher', /^פרטי הוצאה לאור\s*[-–—:]\s*/i],
  ['contact', /^פרטי קשר\s*[-–—:]\s*/i],
  ['extra', /^פרטים נוספים\s*[-–—:]\s*/i],
  ['year', /^(?:מקום ושנת הוצאה[:\s]*)?מקום ושנת הוצאה\s*[-–—:]\s*/i]
];

function parseMetadata(rawText) {
  const meta = {};
  const clean = [];
  for (const line of String(rawText).split('\n')) {
    const t = line.trim();
    let hit = false;
    for (const [key, re] of META_FIELDS) {
      if (re.test(t)) { meta[key] = t.replace(re, '').trim(); hit = true; break; }
    }
    if (!hit) clean.push(line);
  }
  return { meta, text: clean.join('\n') };
}

/** תוחמי הערות: [ ... ] — זיהוי זוגות (כמו findDelimiterMatches במקור). */
function findNotes(text, open, close) {
  const out = [];
  if (!open || !close) return out;
  let from = 0;
  for (;;) {
    const s = text.indexOf(open, from);
    if (s === -1) break;
    const e = text.indexOf(close, s + open.length);
    if (e === -1) break;
    out.push({ start: s, end: e + close.length, text: text.slice(s + open.length, e) });
    from = e + close.length;
  }
  return out;
}

function hasUnclosedNote(text, open, close) {
  if (!open || !close) return false;
  const s = text.indexOf(open);
  if (s === -1) return false;
  return text.indexOf(close, s + open.length) === -1;
}

/** קריאת קונפיגורציה מה-JSON המקורי (עם ברירות המחדל ההיסטוריות). */
function readConfig(imud) {
  const g = (k, d) => (imud && imud[k] !== undefined && imud[k] !== '' ? imud[k] : d);
  const b = (k, d) => {
    const v = g(k, d);
    return v === true || v === 'true' || v === '1' || v === 1;
  };
  const n = (k, d) => {
    const v = parseFloat(g(k, d));
    return isNaN(v) ? d : v;
  };
  return {
    fnOpen: String(g('fn-delim-open', '[')),
    fnClose: String(g('fn-delim-close', ']')),
    endPrefix: String(g('en-line-prefix', 'הערת סיום -')),
    dropWordMode: String(g('drop-word-mode', 'window')),
    dropWordCount: n('drop-word-count', 1),
    dropWordMinLines: n('drop-word-min-lines', 2),
    avoidRunt: b('avoid-runt-word', true),
    autoSimanH2: b('h2-auto-siman', true),
    resetSimanOnH1: b('h2-reset-siman', true),
    showMainShaar: b('show-main-shaar', true),
    showBackShaar: b('show-back-shaar', false),
    showSubShaar: b('show-sub-shaar', true),
    countSubShaar: b('sub-shaar-count-numbering', true),
    countGeneralToc: b('general-toc-count-numbering', true),
    countDetailedToc: b('detailed-toc-count-numbering', true),
    enableGeneralToc: b('enable-general-toc', true),
    enableDetailedToc: b('enable-detailed-toc', true),
    oddH0: b('odd-h0', true),
    oddH1: b('odd-h1', true),
    oddH2: b('odd-h2', false),
    hdrRType: String(g('hdr-r-type', 'book_title_split_r')),
    hdrCType: String(g('hdr-c-type', 'h2_without_siman')),
    hdrLType: String(g('hdr-l-type', 'book_title_split_l')),
    gtocShow: imud && 'gtoc-show' in imud ? imud['gtoc-show'] : [1, 2, 3, 4, 5, 6],
    dtocShow: imud && 'dtoc-show' in imud ? imud['dtoc-show'] : [2, 3, 4, 5, 6]
  };
}

// ---------- טוקניזציה (כמו performTypeset של המקור) ----------
function tokenizeDoc(rawText, cfg) {
  let text = stripEditorialNotes(rawText);
  const { meta, text: noMeta } = parseMetadata(text);
  text = noMeta;
  if (cfg.fnOpen) {
    const esc = cfg.fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    text = text.replace(new RegExp('\\s+(' + esc + ')', 'g'), '$1');
  }
  const lines = text.split('\n');
  const tokens = [];
  let pendingSideNote = null;
  let pendingEndNote = null;
  const endPrefix = cfg.endPrefix;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    while (hasUnclosedNote(line, cfg.fnOpen, cfg.fnClose) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!next) break;
      i++; line += ' ' + next;
    }
    if (endPrefix && line.startsWith(endPrefix)) {
      pendingEndNote = line.slice(endPrefix.length).replace(/^[:\-–—]\s*/, '').trim();
      continue;
    }
    const hMatch = line.match(/^כותרת\s*(\d+)(?:\s+מספר\s+(\d+))?.*?[-–—]\s*(.*)$/);
    if (hMatch) {
      const lvl = parseInt(hMatch[1], 10);
      const txt = (hMatch[3] || '').trim();
      const num = hMatch[2] ? parseInt(hMatch[2], 10) : null;
      if (lvl === 7 && HEADING_MODES[7] === 'side_note') {
        pendingSideNote = txt;
      } else {
        tokens.push({ id: tokens.length, type: 'h' + lvl, level: lvl, text: txt, num });
      }
    } else {
      tokens.push({
        id: tokens.length, type: 'p', text: line,
        sideNote: pendingSideNote, endNote: pendingEndNote
      });
      pendingSideNote = null; pendingEndNote = null;
    }
  }
  return { meta, tokens };
}

// ---------- שבירת שורות: פורט של getLinesFromParagraph ----------
/**
 * גרידה כמו הדפדפן במקור: מילים נמדדות בגופן הגוף; הערה [...] מוצגת במדידה
 * כ"א" (הסמן); המילה הראשונה בחלון (1.5×) מכווצת את שתי השורות הראשונות;
 * שתי המילים האחרונות קשורות ברווח בלתי-שביר (מניעת מילה יתומה).
 */
class LineBreaker {
  constructor(api, cfg) {
    this.api = api;
    this.cfg = cfg;
    this.cache = new Map();
  }
  w(text, sizePt) {
    const key = sizePt + '|' + text;
    let v = this.cache.get(key);
    if (v === undefined) { v = this.api.measureTextWidth(text, sizePt, 0); this.cache.set(key, v); }
    return v;
  }

  /** מילים למדידה + מילים לפלט + טווחי הערות (אטומיות כמו במקור). */
  splitWords(text) {
    const { fnOpen, fnClose } = this.cfg;
    const safe = String(text).trim();
    const notes = findNotes(safe, fnOpen, fnClose);
    let atomic = safe;
    for (const n of notes) {
      const inner = safe.slice(n.start + fnOpen.length, n.end - fnClose.length).replace(/\s+/g, '\uE000');
      atomic = atomic.slice(0, n.start + fnOpen.length) + inner + atomic.slice(n.end - fnClose.length);
    }
    const words = atomic.split(/\s+/).filter(Boolean);
    const escO = fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escC = fnClose.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const inWord = new RegExp(escO + '[\\s\\S]*?' + escC, 'g');
    const disp = words.map(word => {
      if (word.startsWith(fnOpen) && word.endsWith(fnClose)) return 'א';
      return word.replace(inWord, 'א').replace(/\uE000/g, ' ');
    });
    const out = words.map(word => word.replace(/\uE000/g, ' '));
    return { words, disp, out, notes };
  }

  /** החלפת מילת-הערה בסמן הגימטריה (בפלט בלבד). */
  static markerWord(n) { return toGematria(n) + '.'; }

  /**
   * שבירה גרידה של פסקה.
   * **S4.9 (מדידת סוגריים):** מילים בתוך (...) נמדדות בגודל הסוגריים המוקטן
   * (size-body + s-paren, כלומר 12-2=10pt) — כך פסקאות עם סוגריים אצל המקור
   * מתקצרות בשורות (הרינדור עצמו ב-10pt ממילא).
   * @returns {{lines:Array<{words:string[], window:boolean, heightPx:number}>, hasWindow:boolean, windowWords:string[]|null, notes:Array}}
   */
  breakPara(text, colWidthPx, sizePt, allowWindow) {
    const cfg = this.cfg;
    const { disp, out, notes } = this.splitWords(text);
    const spaceW = this.w(' ', sizePt);
    // טווחי סוגריים מאוזנים — מילים בתוכם נמדדות בגודל מוקטן
    const parenWords = new Set();
    {
      const stack = [];
      for (let i = 0; i < out.length; i++) {
        const wd = out[i];
        if (wd.startsWith('(')) stack.push(i);
        if (wd.endsWith(')') && stack.length) {
          const from = stack.pop();
          for (let k = from; k <= i; k++) parenWords.add(k);
        }
      }
    }
    const parenSize = SZ.body + SZ.parenDelta; // 12-2 = 10pt (קבוע כמו במקור)
    const wordWs = disp.map((d, i) => this.w(d, parenWords.has(i) ? parenSize : sizePt));
    if (!out.length) return { lines: [], hasWindow: false, windowWords: null, notes };

    // חלון מילה-ראשונה: אמדן שורות כמו המדידה הכפולה במקור
    const totalW = wordWs.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, out.length - 1);
    const estLines = Math.max(1, Math.ceil(totalW / colWidthPx));
    const firstHasNote = out.slice(0, Math.min(cfg.dropWordCount, out.length))
      .some(w => w.includes(cfg.fnOpen));
    let useWindow = false, windowW = 0, windowWords = null;
    if (allowWindow && cfg.dropWordMode === 'window' && estLines >= cfg.dropWordMinLines && !firstHasNote) {
      useWindow = true;
      windowWords = out.slice(0, cfg.dropWordCount);
      windowW = this.w(disp.slice(0, cfg.dropWordCount).join(' '), sizePt * 1.5) + 6;
    }

    // קשיחת שתי המילים האחרונות
    const flowStart = useWindow ? cfg.dropWordCount : 0;
    const pairStart = out.length - 2;
    const bindPair = cfg.avoidRunt && (out.length - flowStart) >= 3 && pairStart >= flowStart;

    const lines = [];
    let cur = [], curW = 0, lineNo = 0;
    const limitOf = () => (useWindow && lineNo < 2) ? colWidthPx - windowW : colWidthPx;

    if (useWindow) {
      // שורות 0–1: החלון בשפה הימנית; הזרימה ברוחב מוקטן. מילות החלון אינן בזרימה.
    }
    for (let i = flowStart; i < out.length; i++) {
      const bindHere = bindPair && i === pairStart; // המילה הלפני-אחרונה — נבדקת עם יורשתה
      const w1 = wordWs[i];
      const w2 = bindHere ? wordWs[i + 1] + spaceW : 0;
      const addW = (cur.length ? spaceW : 0) + w1 + (bindHere ? w2 : 0);
      if (cur.length && curW + addW > limitOf() + 0.01) {
        lines.push({ words: cur, window: useWindow && lineNo < 2 });
        cur = []; curW = 0; lineNo++;
      }
      cur.push(out[i]);
      curW += (cur.length > 1 ? spaceW : 0) + w1;
      if (bindHere) {
        cur.push(out[i + 1]);
        curW += spaceW + wordWs[i + 1];
        i++;
      }
    }
    if (cur.length) lines.push({ words: cur, window: useWindow && lineNo < 2 });
    for (const l of lines) l.heightPx = GEO.LINE_H;
    return { lines, hasWindow: useWindow, windowWords, notes };
  }
}

// =====================================================================
//  הרכבת המסמך — פורט של performTypeset (מבנה, בלוקים, עימוד)
//  מודל: עמוד = מחסנית אנכית של פסים (span של h3) ובלוקים דו-טוריים מאוזנים.
// =====================================================================

const FLOW_BOTTOM = GEO.FLOW_TOP + GEO.FLOW_H; // 1011.7px
const H2_AREA_H = 271.3;   // **מכויל מהייחוס (עמ' 11):** הזרימה מתחילה ב-368px — סימן ב-284.9, כותרת ב-321.1, h3-span מ-368
const H3_SPAN_H = 40;      // **מכויל מהייחוס:** span מ-368 ועד הגוף ב-407.6 (עמ' 11)
const H0_AREA_H = 251.3;   // **מכויל מהייחוס (עמ' 10):** הזרימה מתחילה ב-348px; הכותרת ב-309px
const SINGLE_W = 552.3;    // .single-wide-col = 2×269.41+13.48 (grid)
const H0_LINE_H = 22.2;    // 15.33px × 1.45 (line-height של h0-body)
const TOC_TITLE_BLOCK_H = 213;

/** גובה פריט כותרת inline (h4/h5/h6) בטור — גודל×1.22 + מרווחי המקור. */
function headingItemH(level) {
  const sz = ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[level] || SZ.body;
  // **מכויל מהייחוס:** שורת הכותרת + מרווח תחתון (margin-bottom 4px + collapse)
  return sz * (96 / 72) * 1.22 + 6;
}

/** גלישת שורות גרידה גנרית (להערות). */
function wrapText(text, api, widthPx, sizePt) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  for (const w of words) {
    const ww = api.measureTextWidth(w, sizePt, 0);
    const add = ww + (cur.length ? spaceW : 0);
    if (cur.length && curW + add > widthPx) { lines.push(cur.join(' ')); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

/**
 * legacyTypeset — הנתיב החי לפרופיל IMUD (התנהגות המקור = המפרט).
 */
function legacyTypeset(rawText, settings) {
  const cfg = readConfig(settings._imudRaw || {});
  const impl = settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table';
  const api = new MeasureAPI(settings, impl);
  const brk = new LineBreaker(api, cfg);
  const { meta, tokens } = tokenizeDoc(rawText, cfg);

  const bookTitle = (meta.bookTitle || 'ספר').trim();
  const tw = bookTitle.split(/\s+/);
  const mid = Math.ceil(tw.length / 2);
  const hdrR = tw.slice(0, mid).join(' ');
  const hdrL = tw.slice(mid).join(' ');

  // ---- מקטעים (כמו המקור: h1→sub_shaar, h0/h2→new_page, השאר inline) ----
  const sections = [];
  let cur = { tokens: [] };
  for (const t of tokens) {
    const mode = t.type[0] === 'h' ? (HEADING_MODES[t.level] || 'inline_2col') : 'inline_2col';
    if (mode === 'sub_shaar') {
      if (cur.tokens.length) sections.push(cur);
      sections.push({ subShaar: t, tokens: [] });
      cur = { tokens: [] };
    } else if (mode === 'new_page_1col' || mode === 'new_page_2col') {
      if (cur.tokens.length) sections.push(cur);
      cur = { newPage: t, tokens: [] };
    } else {
      cur.tokens.push(t);
    }
  }
  if (cur.tokens.length) sections.push(cur);

  const pages = [];
  const headingFolio = new Map();
  let simanCounter = 0;
  let currentH2 = '';
  let currentH1 = '';
  let pending = null; // {token, lines, lineIdx} — המשך פסקה חתוכה בין עמודים/טורים

  function blankPageObj(type) {
    return {
      index: -1, type, legacy: true, pageNumber: null, folioDisplay: '',
      headerSlots: null, bands: [], columns: [[], []], marginNotes: [], footnotes: [],
      fnSep: false, toc: null, _metadata: meta,
      template: { width: GEO.PAGE_W, height: GEO.PAGE_H, contentBox: { top: GEO.FLOW_TOP, bottom: FLOW_BOTTOM } }
    };
  }
  function newPage(type) {
    const pg = blankPageObj(type);
    pages.push(pg);
    return pg;
  }
  const setHeader = (pg, center) => { pg.headerSlots = { right: hdrR, center: center || '', left: hdrL }; };

  // ---------- עמודי שער ----------
  // **S4.9:** תוכן השערים מהמטא-דאטה של המסמך — במיקומים המכוינים מהייחוס
  // (shaar-main: כותרת 46pt ב-128pt, משנה 21pt, תיאור 12pt, מהדורה 11.5pt, מחבר 15pt;
  //  shaar-back: זכויות/פרטים; shaar-sub: כותרת ה-h1 ב-36pt + המשך ב-21pt).
  function gateLinesFor(type, h1Token) {
    const pt = (v) => v / 0.75;
    if (type === 'shaar-main') return [
      { text: meta.bookTitle || '', sizePt: 46, y: pt(128.1) },
      { text: meta.subject || '', sizePt: 21, y: pt(225.2) },
      { text: meta.desc || '', sizePt: 12, y: pt(410.3) },
      { text: meta.edition || '', sizePt: 11.5, y: pt(558.0), singleOp: true },
      { text: meta.author || '', sizePt: 15, y: pt(713.5), singleOp: true }
    ].filter(g => g.text);
    if (type === 'shaar-back') return [
      { text: meta.copyright ? 'כל הזכויות שמורות' : '', sizePt: 13.5, y: pt(191.8) },
      { text: meta.copyright || '', sizePt: 10, y: pt(216.4) },
      { text: meta.publisher || '', sizePt: 11, y: pt(357.3) },
      { text: meta.contact || '', sizePt: 10, y: pt(500.9) },
      { text: meta.extra || '', sizePt: 9.5, y: pt(644.3) }
    ].filter(g => g.text);
    if (type === 'shaar-sub' && h1Token) {
      const parts = h1Token.text.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
      const first = parts[0] || h1Token.text;
      const rest = parts.slice(1).join(' - ');
      const out = [{ text: first, sizePt: 36, y: pt(345.7) }];
      if (rest) out.push({ text: rest, sizePt: 21, y: pt(469.7) });
      return out;
    }
    return [];
  }
  if (cfg.showMainShaar) { const g0 = newPage('shaar-main'); g0.gateLines = gateLinesFor('shaar-main'); }
  if (cfg.showBackShaar) { const g1 = newPage('shaar-back'); g1.gateLines = gateLinesFor('shaar-back'); }

  // ---------- זרימת מקטע ----------
  function flowSection(sec) {
    const toks = sec.tokens;
    let ti = 0;
    let sectionFirst = true;
    const isH0 = sec.newPage && sec.newPage.level === 0;
    const isH2 = sec.newPage && sec.newPage.level === 2;

    while (ti < toks.length || pending) {
      const pg = newPage(isH0 ? (sectionFirst ? 'preface' : 'regular')
        : (sectionFirst && isH2 ? 'sign-open' : 'regular'));
      let top = GEO.FLOW_TOP;
      if (sectionFirst && sec.newPage) {
        if (isH0) {
          pg.bands.push({ kind: 'h0-title', text: sec.newPage.text, sizePt: SZ.h0Title, y: 309.0, h: 30, tokenId: sec.newPage.id });
          top = GEO.FLOW_TOP + H0_AREA_H;
          currentH2 = sec.newPage.text;
        } else if (isH2) {
          if (cfg.autoSimanH2) {
            simanCounter++;
            pg.bands.push({ kind: 'h2-siman', text: 'סימן ' + toGematria(simanCounter), sizePt: SZ.siman, y: 284.9, h: 36, tokenId: null });
          }
          const disp = sec.newPage.text.replace(/^סימן\s+[א-ת]+[:\-–—\s]*/i, '').trim();
          pg.bands.push({ kind: 'h2-title', text: disp, sizePt: SZ.h2, y: 321.1, h: 30, tokenId: sec.newPage.id });
          currentH2 = disp;
          // **S4.9 (תיקון קריטי):** הזרימה מתחילה מתחת לאזור ה-h2 (סימן+כותרת) —
          // בלי זה הבלוקים מוצבים מראש העמוד, מתנגשים בכותרות וגוררים
          // הסחת עימוד של ~29 שורות בכל עמוד פתיחת סימן.
          top = GEO.FLOW_TOP + H2_AREA_H;
        }
      }
      setHeader(pg, currentH2);
      sectionFirst = false;

      const fnQueue = [];
      let noteCounter = 0; // איפוס מונה הערות לפי עמוד (כמו המקור)
      let fnReserved = 0;
      // **S4.9 (התנהגות המקור הנצפית):** הערות של פסקה מופיעות ומוזרמות לתקציב
      // בכל עמוד שבו לפסקה שורות — גם בהמשכים (הייחוס מציג את הערה-א בעמודים
      // 11 וגם 12, והתקציב מצטמצם כבר בעמוד הראשון של הפסקה).
      const paraNotes = new Map(); // tokenId → [{marker, text}] (מופקות בפעם הראשונה)
      const tokPages = new Map();  // tokenId → Set(pageIndex)
      const requeueParaNotes = (tokenId) => {
        const notes = paraNotes.get(tokenId);
        if (!notes) return;
        for (const n of notes) {
          fnQueue.push({ marker: n.marker, text: n.text, dup: true });
        }
        fnReserved = fnReserveFor(fnQueue);
      };

      // ---- מבנה העמוד: מחסנית של פסים ובלוקים; מילוי דו-טורי (ימני ואז שמאלי) ----
      const stack = [];
      let block = null;
      const openBlock = (yTop) => {
        block = { yTop, cols: [[], []], cursor: [yTop, yTop], fill: 0 };
        stack.push(block);
      };
      const blockBottom = () => block ? Math.max(block.cursor[0], block.cursor[1]) : top;
      const colBottom = () => FLOW_BOTTOM - fnReserved;

      fillPage: while (ti < toks.length || pending) {
        const tok = pending ? pending.token : toks[ti];
        const mode = tok.type[0] === 'h' ? (HEADING_MODES[tok.level] || 'inline_2col') : 'inline_2col';

        if (mode === 'span_1col' && !pending) {
          const curY = block ? blockBottom() : top;
          if (colBottom() - curY < H3_SPAN_H + 6) break fillPage;
          if (block && (block.cols[0].length || block.cols[1].length)) balanceBlock(block, colBottom() - block.yTop);
          stack.push({ type: 'span', text: tok.text, y: curY, h: H3_SPAN_H, tokenId: tok.id });
          openBlock(curY + H3_SPAN_H);
          ti++;
          continue;
        }
        if (tok.type[0] === 'h') {
          if (!block) openBlock(top);
          const h = headingItemH(tok.level);
          if (block.cursor[block.fill] + h > colBottom()) {
            if (block.fill === 0 && !isH0 && !(block.cols[0].length === 0)) {
              block.fill = 1; // המשך בטור השמאלי
            } else if (block.cols[block.fill].length || block.cols[0].length) {
              break fillPage;
            }
          }
          block.cols[block.fill].push({ kind: 'heading', level: tok.level, text: tok.text, h, tokenId: tok.id });
          block.cursor[block.fill] += h;
          ti++;
          continue;
        }

        // ---- פסקה ----
        if (!block) openBlock(top);
        const isH0Body = isH0;
        const bodySz = isH0Body ? SZ.h0Body : SZ.body;
        const pitch = isH0Body ? H0_LINE_H : GEO.LINE_H;
        const colW = isH0Body ? SINGLE_W : GEO.COL_W;
        let lines, hasWindow = false, windowWords = null;
        const isCont = !!pending;
        if (pending) {
          lines = pending.lines;
          // המשך פסקה — ההערות שלה חוזרות לתור העמוד (כמו במקור)
          requeueParaNotes(tok.id);
        } else {
          tokPages.set(tok.id, new Set([pages.length - 1]));
          const r = brk.breakPara(tok.text, colW, bodySz, true);
          lines = r.lines; hasWindow = r.hasWindow; windowWords = r.windowWords;
        }
        const startIdx = pending ? pending.lineIdx : 0;
        const total = lines.length - startIdx;

        // תקציב מוקדם: כל ההערות של הפסקה (מהשבירה המלאה) נכנסות לתור העמוד
        // כבר בעמוד הראשון שלה — כך התקציב מצטמצם מוקדם כמו במקור.
        if (!isCont) {
          const allNotes = [];
          for (const lw of lines) {
            for (const w of lw.words) {
              const a0 = w.indexOf(cfg.fnOpen);
              const a1 = a0 >= 0 ? w.lastIndexOf(cfg.fnClose) : -1;
              if (a0 >= 0 && a1 > a0 + cfg.fnOpen.length) {
                allNotes.push(w.slice(a0 + cfg.fnOpen.length, a1));
              }
            }
          }
          if (allNotes.length) {
            if (!paraNotes.has(tok.id)) {
              paraNotes.set(tok.id, allNotes.map((t, i) => ({ marker: LineBreaker.markerWord(i + 1), text: t })));
            }
            for (const n of paraNotes.get(tok.id)) {
              if (!fnQueue.some(q => q.text === n.text)) {
                fnQueue.push({ marker: n.marker, text: n.text, dup: true });
              }
            }
            fnReserved = fnReserveFor(fnQueue);
          }
        }

        let fit = 0;
        for (let k = 1; k <= total; k++) {
          if (block.cursor[block.fill] + k * pitch <= colBottom() + 0.01) fit = k; else break;
        }
        // אלמנה/יתומה (chooseSplitLines של המקור)
        if (fit > 0 && fit < total) {
          const canPush = block.cols[0].length > 0 || block.cols[1].length > 0 || stack.length > 1;
          if (fit === 1 && canPush) fit = 0;
          else if (total - fit === 1 && fit > 1) fit -= 1;
          else if (total - fit === 1 && fit === 1 && canPush) fit = 0;
        }
        if (fit === 0) {
          // הטור הנוכחי מלא — מעבר לטור השמאלי (בלוק דו-טורי); אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
            continue;
          }
          const anyContent = stack.length > 1 || block.cols[0].length > 0 || block.cols[1].length > 0;
          if (!anyContent) fit = 1; // התקדמות מאולצת — שורה אחת לפחות
          else break fillPage;
        }

        // סמני הערות בשורות המוצבות.
        // **S4.9:** הערה עשויה להיות מוצמדת למילה שלפניה ("השבוע.[חלוקת...]")
        // — זיהוי לפי אינדקס התוחמים בתוך המילה (כמו findDelimiterMatches
        // במקור), לא רק מילה שלמה שמתחילה ב-[.
        const emitted = [];
        for (let k = 0; k < fit; k++) {
          const ln = lines[startIdx + k];
          const words = [];
          const markerIdx = []; // אינדקסים של סמני הערות (להסרה מדויקת במודל)
          for (const w of ln.words) {
            const at0 = w.indexOf(cfg.fnOpen);
            const at1 = at0 >= 0 ? w.lastIndexOf(cfg.fnClose) : -1;
            if (at0 >= 0 && at1 > at0 + cfg.fnOpen.length) {
              const prefix = w.slice(0, at0);
              const inner = w.slice(at0 + cfg.fnOpen.length, at1);
              const suffix = w.slice(at1 + cfg.fnClose.length);
              if (prefix) words.push(prefix);
              noteCounter += 1;
              const marker = LineBreaker.markerWord(noteCounter);
              fnQueue.push({ marker, text: inner });
              if (!paraNotes.has(tok.id)) paraNotes.set(tok.id, []);
              if (!paraNotes.get(tok.id).some(n => n.text === inner)) {
                paraNotes.get(tok.id).push({ marker, text: inner });
              }
              fnReserved = fnReserveFor(fnQueue);
              markerIdx.push(words.length);
              words.push(marker);
              if (suffix) words.push(suffix);
            } else {
              words.push(w);
            }
          }
          emitted.push({ ...ln, words, markerIdx });
        }
        const isEnd = startIdx + fit >= lines.length;
        block.cols[block.fill].push({
          kind: 'para', tokenId: tok.id, lines: emitted, from: startIdx,
          isEnd, isCont, hasWindow: hasWindow && !isCont, windowWords,
          pitch, sizePt: bodySz, sideNote: (!isCont && tok.sideNote) ? tok.sideNote : null
        });
        block.cursor[block.fill] += fit * pitch;
        // **S4.9:** מרווח בין פסקאות — p { margin-bottom: 7px } במקור (רק בסוף פסקה)
        if (isEnd) block.cursor[block.fill] += 7;
        if (isEnd) { pending = null; ti++; }
        else {
          pending = { token: tok, lines, lineIdx: startIdx + fit };
          // הפסקה נחתכה — אם הטור השמאלי עוד פנוי, ממשיכים בו; אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
          } else {
            break fillPage;
          }
        }
      }

      // סגירת הבלוק האחרון: אם המקטע נגמר — איזון
      const sectionEnded = ti >= toks.length && !pending;
      if (block && sectionEnded && !isH0 && (block.cols[0].length || block.cols[1].length)) {
        balanceBlock(block, colBottom() - block.yTop);
      }

      // ---- פריסת המחסנית לעמוד: פסים + בלוקים → טורים עם y מפורש ----
      layoutStack(pg, stack, top);

      // ---- הערות שוליים בתחתית (bottom-anchored) ----
      if (fnQueue.length) {
        pg.fnSep = true;
        // **S4.9:** השורה הראשונה של כל הערה קצרה ברוחב הסמן — אחרת המילים
        // גולשות מעבר לשפה השמאלית של הדף.
        const items = fnQueue.map(n => {
          const mkW = api.measureTextWidth(n.marker, SZ.fnBody, 0) + api.measureTextWidth(' ', SZ.fnBody, 0);
          const lines = wrapText(n.text, api, SINGLE_W - mkW, SZ.fnBody);
          return { marker: n.marker, lines, mkW };
        });
        const totalH = items.reduce((a, n) => a + n.lines.length * GEO.FN_PITCH, 0);
        let yy = FLOW_BOTTOM - totalH;
        for (const n of items) {
          const it = { marker: n.marker, lines: [] };
          for (const l of n.lines) { it.lines.push({ words: String(l).split(' '), y: yy }); yy += GEO.FN_PITCH; }
          pg.footnotes.push(it);
        }
      }
    }
  }

  function fnReserveFor(queue) {
    if (!queue.length) return 0;
    let total = 0;
    for (const n of queue) {
      total += wrapText(n.text, api, SINGLE_W, SZ.fnBody).length * GEO.FN_PITCH;
    }
    return total + 24; // מפריד + מרווחים (כמו +24 במקור)
  }

  /**
   * איזון בלוק: חלוקת היחידות מחדש בין הטורים לגבהים שווים בקירוב —
   * **בכפוף לגובה העמודה הפנוי** (colBottom − yTop). אם החלוקה המאוזנת גולשת,
   * יחידות מוחזרות מהטור השני לראשון; אם גם זה לא מספיק — נשמר המילוי המקורי
   * (שהוכח כחוקי בזמן המילוי). בלי זה בלוק 41/31 שורות היה הופך ל-24/48 —
   * והטור השמאלי גולש מתחת לתחתית הזרימה.
   */
  function balanceBlock(block, availH) {
    const units = [...block.cols[0], ...block.cols[1]];
    const totalH = units.reduce((a, u) => a + unitH(u), 0);
    const target = totalH / 2;
    const cap = Math.max(availH != null ? availH : Infinity, target);
    const r = [], l = [];
    let y = 0, idx = 0;
    for (; idx < units.length; idx++) {
      const u = units[idx];
      const h = unitH(u);
      if ((y + h <= target + GEO.LINE_H || (r.length === 0 && l.length === 0)) && y + h <= cap) { r.push(u); y += h; }
      else break;
    }
    for (; idx < units.length; idx++) l.push(units[idx]);
    // החזרת יחידות מ-l ל-r כש-l גולש
    let rH = r.reduce((a, u) => a + unitH(u), 0);
    let lH = l.reduce((a, u) => a + unitH(u), 0);
    while (l.length && lH > cap && rH + unitH(l[0]) <= cap) {
      const u = l.shift();
      r.push(u); rH += unitH(u); lH -= unitH(u);
    }
    if (lH > cap) {
      block.split = null; // נטישת האיזון — המילוי המקורי חוקי מהגדרתו
      return;
    }
    block.split = { r, l };
    // **S4.9:** ה-cursor מתעדכן לתחתיות האמיתיות — אחרי האיזון מיקום הפס/הבלוק
    // הבא (blockBottom) היה מחושב מהמילוי הקודם וחופף את זנב הטור המאוזן.
    block.cursor[0] = block.yTop + rH;
    block.cursor[1] = block.yTop + lH;
  }

  function unitH(u) {
    if (u.kind === 'heading') return u.h;
    // פסקה שהסתיימה כוללת את מרווח ה-7px שאחריה
    return u.lines.length * u.pitch + (u.isEnd ? 7 : 0);
  }

  /** פריסת המחסנית: כותבת שורות עם y מפורש לטורי העמוד. */
  function layoutStack(pg, stack, top) {
    const colR = [], colL = [];
    let y = top;
    for (const seg of stack) {
      if (seg.type === 'span') {
        pg.bands.push({ kind: 'h3-title', text: seg.text, sizePt: SZ.h3, y: seg.y + 8, h: seg.h, tokenId: seg.tokenId });
        y = seg.y + seg.h;
        continue;
      }
      const block = seg;
      const rUnits = block.split ? block.split.r : block.cols[0];
      const lUnits = block.split ? block.split.l : block.cols[1];
      let ry = block.yTop;
      for (const u of rUnits) ry = emitUnit(pg, colR, u, ry, 'right');
      let ly = block.yTop;
      for (const u of lUnits) ly = emitUnit(pg, colL, u, ly, 'left');
      y = Math.max(ry, ly);
    }
    pg.columns[0] = colR;
    pg.columns[1] = colL;
    void y;
  }

  function emitUnit(pg, col, u, y, sideName) {
    if (u.kind === 'heading') {
      col.push({
        words: [u.text], sizePt: ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[u.level] || SZ.body,
        heightPx: u.h, kind: 'heading', level: u.level, isLast: false,
        tokenId: u.tokenId, window: false, windowWords: null, y,
        paraId: null, lineIdx: null, align: 'center'
      });
      return y + u.h;
    }
    let i = 0;
    for (const ln of u.lines) {
      const lineIdxGlobal = u.from + i;
      col.push({
        words: ln.words.slice(),
        markerIdx: ln.markerIdx || [],
        sizePt: u.sizePt, heightPx: u.pitch, kind: 'paragraph',
        isLast: u.isEnd && i === u.lines.length - 1,
        tokenId: u.tokenId,
        window: !!(u.hasWindow && lineIdxGlobal < 2),
        windowWords: (u.hasWindow && lineIdxGlobal === 0) ? u.windowWords : null,
        y, paraId: u.tokenId, lineIdx: lineIdxGlobal
      });
      y += u.pitch;
      i++;
    }
    if (u.isEnd) y += 7; // מרווח בין פסקאות (p{margin-bottom:7px} במקור)
    if (u.sideNote) {
      const anchor = y - u.lines.length * u.pitch;
      const lines = wrapText(u.sideNote, api, GEO.MARGIN_W - 2, SZ.marginNote);
      pg.marginNotes.push({
        side: sideName === 'right' ? 'right' : 'left',
        anchorY: anchor,
        lines: lines.map((t, i2) => ({ text: t, y: anchor + i2 * GEO.MN_PITCH }))
      });
    }
    return y;
  }

  // ---- הרצת המקטעים ----
  for (const sec of sections) {
    if (sec.subShaar) {
      const t = sec.subShaar;
      if (cfg.resetSimanOnH1) simanCounter = 0;
      const pg = newPage('shaar-sub');
      pg._h1Token = t;
      pg.gateLines = gateLinesFor('shaar-sub', t);
      currentH1 = t.text.split(/[-–—]/)[0].trim();
      continue;
    }
    flowSection(sec);
  }

  // ---- תוכן-עניינים כפול + מספור סופי ----
  const genShow = Array.isArray(cfg.gtocShow) ? cfg.gtocShow : [1, 2, 3, 4, 5, 6];
  const detShow = Array.isArray(cfg.dtocShow) ? cfg.dtocShow : [2, 3, 4, 5, 6];
  const genEntries = tokens.filter(t => t.type[0] === 'h' && genShow.includes(t.level))
    .map(t => ({ tokenId: t.id, level: t.level, text: t.text }));
  const detEntries = tokens.filter(t => t.type[0] === 'h' && detShow.includes(t.level))
    .map(t => ({ tokenId: t.id, level: t.level, text: t.text }));

  function tocRowH(level) {
    return (SZ.tocLevel[level] || 10.5) * (96 / 72) * 1.3 + 8;
  }
  /**
   * **S4.9 (התנהגות המקור):** הפריסה לעמודים היא ביחידות אטומיות — שורת h1/h2
   * + קבוצת תתי-הכותרות שלה (break-inside: avoid במקור). קבוצה שלא נכנסת
   * עוברת שלמה לעמוד הבא. כך נוצר פיצול 17/28/19 של הייחוס.
   */
  function makeTocPages(kind, entries, title) {
    const rows = entries.map(e => ({ ...e, sizePt: SZ.tocLevel[e.level] || 10.5, h: tocRowH(e.level) }));
    // יחידות: h1 בודד; h2 + כל ה-h3..h6 שאחריו עד ה-h2 הבא
    const units = [];
    for (const r of rows) {
      if (r.level <= 2 || !units.length) units.push([r]);
      else units[units.length - 1].push(r);
    }
    const pagesRows = [];
    let curRows = [], curH = 0, first = true;
    for (const u of units) {
      const uH = u.reduce((a, r) => a + r.h, 0);
      const avail = first ? GEO.FLOW_H - TOC_TITLE_BLOCK_H : GEO.FLOW_H;
      if (curH + uH > avail && curRows.length) { pagesRows.push({ rows: curRows, first }); curRows = []; curH = 0; first = false; }
      curRows.push(...u); curH += uH;
    }
    if (curRows.length) pagesRows.push({ rows: curRows, first });
    return pagesRows.map((pr, pi) => {
      const pg = blankPageObj(kind);
      pg.headerSlots = { right: hdrR, center: title, left: hdrL };
      const isLast = pi === pagesRows.length - 1;
      const top = pr.first ? GEO.FLOW_TOP + TOC_TITLE_BLOCK_H + 61 : GEO.FLOW_TOP + 17;
      const rowYs = [];
      if (!isLast && pr.rows.length > 1) {
        const gap = (FLOW_BOTTOM - 6 - top) / (pr.rows.length - 1);
        pr.rows.forEach((r, i) => rowYs.push(top + i * gap));
      } else {
        let yy = top;
        for (const r of pr.rows) { rowYs.push(yy); yy += r.h; }
      }
      pg.toc = {
        title: pr.first ? title : null,
        rows: pr.rows.map((r, i) => ({
          tokenId: r.tokenId, level: r.level, text: r.text, sizePt: r.sizePt, y: rowYs[i],
          folio: '',
          x1: GEO.TOC_TITLE_X1 - (r.level - 1) * GEO.TOC_STAIR
        }))
      };
      return pg;
    });
  }

  // סדר סופי: gates → toc-general×G → [blank] → shaar-sub → toc-detailed×D → body
  // **תיקון S4.9:** "שערים" = shaar-main/back בלבד — shaar-sub שייך לגוף (אחרי
  // ה-blank), אחרת הוא נגרר לראש המסמך וכל הסדר משתבש.
  const gates = [];
  const bodies = [];
  for (const p of pages) ((p.type === 'shaar-main' || p.type === 'shaar-back') ? gates : bodies).push(p);
  const genPages = cfg.enableGeneralToc && genEntries.length ? makeTocPages('toc-general', genEntries, 'תוכן עניינים כללי') : [];
  const gCount = genPages.length;
  const needBlank = cfg.oddH1 && ((1 + gCount) % 2 === 0);
  const blank = needBlank ? blankPageObj('blank') : null;
  const detPages = cfg.enableDetailedToc && detEntries.length ? makeTocPages('toc-detailed', detEntries, 'תוכן עניינים מפורט') : [];
  const subIdx = bodies.findIndex(p => p.type === 'shaar-sub');
  const before = subIdx >= 0 ? bodies.slice(0, subIdx + 1) : [];
  const after = subIdx >= 0 ? bodies.slice(subIdx + 1) : bodies;

  const final = [...gates, ...genPages];
  if (blank) final.push(blank);
  final.push(...before, ...detPages, ...after);

  // מספור סופי + folios + אינדקסים
  let pn = 1;
  for (const p of final) {
    const counted = ['toc-general', 'toc-detailed', 'blank', 'shaar-sub', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.pageNumber = counted ? pn++ : null;
    const shows = ['toc-general', 'toc-detailed', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.folioDisplay = shows && p.pageNumber ? toGematria(p.pageNumber) : '';
  }
  final.forEach((p, i) => { p.index = i; });

  // folio של כל כותרת = העמוד שבו היא הוצבה
  const folioByToken = new Map();
  for (const p of final) {
    if (p._h1Token) folioByToken.set(p._h1Token.id, p.folioDisplay);
    for (const b of (p.bands || [])) if (b.tokenId != null) folioByToken.set(b.tokenId, p.folioDisplay);
    for (const col of p.columns) for (const ln of col) {
      if (ln.kind === 'heading' && ln.tokenId != null && !folioByToken.has(ln.tokenId)) folioByToken.set(ln.tokenId, p.folioDisplay);
    }
  }
  for (const p of final) if (p.toc) for (const r of p.toc.rows) r.folio = folioByToken.get(r.tokenId) || '';

  pages.length = 0;
  pages.push(...final);

  // ---- תוצאה ----
  const tokensOut = tokens.map(t => ({ id: 'lt' + t.id, type: t.type, level: t.level, text: t.text, num: t.num || null }));
  const hash = crypto.createHash('sha256');
  for (const pg of pages) {
    hash.update(pg.type + '|' + (pg.folioDisplay || '') + '|');
    for (const col of pg.columns) for (const ln of col) hash.update(ln.words.join(' ') + '|');
  }
  return {
    metadata: meta, tokens: tokensOut, pages, ledger: null, events: null,
    toc: { general: genEntries.length, detailed: detEntries.length },
    tocPages: [], numberingAudit: null, settings,
    contentPreserved: true,
    layoutHash: 'legacy-' + hash.digest('hex').slice(0, 16),
    plannedLayoutHash: null, geometryNeutralVerified: true,
    ornaments: null, retreat: null, sideNotes: null, endnotePages: null,
    endnotePagesInfo: { count: 0, pages: [] },
    scope: null, customStyles: null, recommendations: null,
    legacyProfile: true
  };
}

module.exports = {
  GEO, SZ, HEADING_MODES, toGematria, stripEditorialNotes, parseMetadata,
  tokenizeDoc, LineBreaker, findNotes, readConfig, legacyTypeset,
  FLOW_BOTTOM, SINGLE_W, wrapText, headingItemH
};

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
 * **03.11(ד):** אין עוד תלות בין קיום השערים לערכת נושא — המתגים המפורשים
 * (shaar-main-enabled/shaar-sub-enabled/shaar-back-enabled, ברירת מחדל true
 * כמקור) קובעים את קיום השערים; ערכת נושא/עיצוב מוסיפה רקע מעוצב בלבד.
 */
function themeActive(settings) {
  const id = settings['theme-set-id'];
  return Boolean(id && id !== 'default') || Boolean(settings['shaar-main-image']) || Boolean(settings['imud-shaar-main']);
}

/** **03.11(ד):** שער ראשי — מתג מפורש; ברירת מחדל true כמקור (show-main-shaar).
 * ערכת־נושא/עיצוב ספרייה אינן כופות קיום — הן מוסיפות רקע מעוצב בלבד;
 * כיבוי מפורש (shaar-main-enabled=false) גובר על הכול.
 * תאימות לאחור: shaar-main-image/imud-shaar-main שהוגדרו בתבניות ישנות
 * (מעידות על כוונת שער) מדליקות גם כשהמתג לא נשמר. */
function mainShaarActive(settings) {
  if (settings['shaar-main-enabled'] === false) return false;
  return settings['shaar-main-enabled'] === true || themeActive(settings);
}

/** **03.11(ד):** שער־משנה — ברירת מחדל true כמקור (show-sub-shaar); המתג
 * הישן show-shaar-sub=true מדליק (תאימות תבניות); כיבוי מפורש גובר. */
function subShaarActive(settings) {
  if (settings['shaar-sub-enabled'] === false) return false;
  return settings['shaar-sub-enabled'] === true || settings['show-shaar-sub'] === true || themeActive(settings);
}

/** **03.11(ד):** שער אחורי — ברירת מחדל true כמקור (show-back-shaar=true). */
function backShaarActive(settings) {
  return settings['shaar-back-enabled'] !== false;
}

function makeShaarPage(type, settings, index, info) {
  const tpl = buildPageTemplate(type, settings, index % 2 === 0);
  return {
    index, type, template: tpl,
    columns: Array.from({ length: tpl.columns.length }, () => []),
    footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
    fnReservedHeightPx: 0, chapterOpening: true, // D-36: שער — ללא גיליון לעין
    decorations: [], isShaar: true,
    // **03.11(ד):** נתוני תוכן השער — שער־משנה נושא את כותרת החלק (פיצול במקף
    // כמקור: renderSubShaar — titleMain/titleSub). המידע נצרך ב-dom-renderer.
    shaarInfo: info || null
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
  const active = mainShaarActive(settings);
  const showSub = subShaarActive(settings);
  const showBack = backShaarActive(settings);
  const partsCount = new Set(blocks.filter(b => b.kind === 'heading' && b.level === 1).map(b => b.part)).size;

  // עמודים מותאמים — תכנון מיקום (PT-09)
  const customPlan = customDefs && customDefs.length ? planCustomPages(customDefs, { partsCount, hasShaarMain: active }) : null;
  const customPlaced = [];

  const push = (page, why) => { out.push(page); if (why) inserted.push({ type: page.type, why }); };

  // PT-01 + custom before/after-shaar-main.
  // _frontMatter מסמן עמודי פתיחה אמיתיים — תוכן־העניינים נכנס אחריהם ולפני
  // כל דף גוף (כולל שערי־משנה של החלק הראשון — סדר המקור 03.11(ד)).
  const pushFront = (page, why) => { page._frontMatter = true; push(page, why); };
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'before-shaar-main')) {
    customPlaced.push(d.id); pushFront(makeCustomPage(d, settings, 0), `custom:${d.id}`);
  }
  if (active) pushFront(makeShaarPage(PAGE_TYPES.SHAAR_MAIN, settings, out.length), 'shaar-main');
  // **03.11(ד) — סדר המקור:** השער האחורי מודפס מיד אחרי השער הראשי (גיליון 1
  // דו־צדדי: חזית/גב — כך גם typesetDocument המקורי: main-shaar → back-shaar →
  // תוכן־עניינים → גוף). עד כאן היה בסוף המסמך (PT-03 הישן).
  if (showBack) pushFront(makeShaarPage(PAGE_TYPES.SHAAR_BACK, settings, out.length), 'shaar-back');
  if (customPlan) for (const d of customPlan.start.filter(d => d.position.at === 'after-shaar-main')) {
    customPlaced.push(d.id); pushFront(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
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
      if (showSub) {
        // **03.11(ד):** כותרת החלק לתוכן השער־משנה (מקור: renderSubShaar — פיצול
        // במקף: titleMain=לפני, titleSub=אחרי). הכותרת נלקחת מהבלוק עצמו (מקור יחיד).
        const partBlock = blocks.find(b => b.kind === 'heading' && b.level === 1 && b.part === openingPart);
        const partTitle = partBlock ? partBlock.lines.map(l => l.words.join(' ')).join(' ').trim() : '';
        push(makeShaarPage(PAGE_TYPES.SHAAR_SUB, settings, out.length, { part: openingPart, title: partTitle }), `shaar-sub:part${openingPart}`);
      }
      lastPart = openingPart;
    }
    push(pg);
    if (openingPart != null && customPlan) for (const d of (customPlan.afterPart.get(openingPart) || [])) {
      customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
    }
  }

  // custom:end — עמודים מותאמים בסוף המסמך (PT-09); השער האחורי כבר הוכנס אחרי
  // הראשי (סדר המקור — 03.11(ד)).
  if (customPlan) for (const d of customPlan.end) {
    customPlaced.push(d.id); push(makeCustomPage(d, settings, out.length), `custom:${d.id}`);
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

module.exports = { insertShaarPages, themeActive, mainShaarActive, subShaarActive, backShaarActive, buildPickerModel };

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
  // רצף פותח מבני: עמודי front-matter אמיתיים בלבד (שער ראשי/אחורי/פתיחה מותאמת).
  // **03.11(ד):** שערי־משנה (shaar-sub) שייכים לזרימת הגוף — הם באים אחרי
  // תוכן־העניינים (לפני החלק שלהם), לא לפניו. בעבר כל isShaar דולג — ושער־המשנה
  // של החלק הראשון נדחק לפני התוכן־עניינים.
  let at = 0;
  while (at < pages.length && (pages[at]._frontMatter === true)) at++;
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
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-top', kindStyle: settings['h2-orn-top'], x: Math.round(cx - w / 2), y, w, h, marginGapTop: titleTop - (y + h) }, rejected, pi, settings);
          planted.h2Top++;
        }
        if (scope.signBottom) {
          const y = titleBottom + ornMargins.bottom; // בתוך ההזמנה התחתונה
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-bottom', kindStyle: settings['h2-orn-bottom'], x: Math.round(cx - w / 2), y, w, h, marginGapBottom: y - titleBottom }, rejected, pi, settings);
          planted.h2Bottom++;
        }
        if (scope.titleSide) {
          // צדדיים לכותרת: התאמת גובה לגובה הכותרת + הרמה אופטית −0.08em (שיעור V4)
          const sideH = Math.min(h, Math.round(titleH));
          const lift = sideOrnamentLiftPx(fontPx);
          const gap = Math.round(fontPx * 0.35);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-right', kindStyle: settings['h2-orn-side'], x: Math.round(colX + colW - titleW - gap - w), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-left', kindStyle: settings['h2-orn-side'], x: Math.round(colX + titleW + gap), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings);
          planted.h2Side += 2;
        }
      }
    }

    // ---------- 2. עיטורי צד H3 (REQ-ORN-01: התאמת גובה לשורה) ----------
    if ((settings['h3-side-orn'] || 'none') !== 'none') {
      const sideH = Math.round(Number(settings['h3-side-orn-height-em']) * fontPx);
      // **03.11(ד):** H3 במצב full-width חיה בפס חוצה־טורים (span_1col של המקור) —
      // עיטורי הצד נשתלים משני צדי שורת הפס ברוחב התוכן המלא.
      if (page.spanning && page.spanning.lines.length) {
        const bln = page.spanning.lines[0];
        if (bln.kind === 'heading' && bln.level === 3 && bln.meta && bln.meta.firstOfBlock) {
          const left = Math.min(...tpl.columns.map(c => c.x));
          const right = Math.max(...tpl.columns.map(c => c.x + c.w));
          const lineH = bln.heightPx || fontPx;
          const lift = sideOrnamentLiftPx(fontPx);
          const yy = tpl.contentBox.top + sideOrnamentOffsetY(lineH, sideH) + lift;
          const wSide = Math.round(fontPx * 1.2);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(right - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(left), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          planted.h3Side += 2;
        }
      }
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
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(colX + colW - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(colX), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          planted.h3Side += 2;
        }
      }
    }

    // ---------- 3. מפרידי כותרות H3–H6 (REQ-ORN-04: fits() בכל אתרי ההוספה) ----------
    // **03.11(ד):** כותרת H3–H6 בפס חוצה־טורים (full-width) — מפריג מתחת לפס,
    // ממורכז, ברוחב יחסי לרוחב התוכן (אותו סגנון כמו בטור).
    if (settings['heading-dividers-h3-h6'] && page.spanning && page.spanning.lines.length) {
      const bln = page.spanning.lines[page.spanning.lines.length - 1];
      if (bln.kind === 'heading' && bln.level >= 3 && bln.level <= 6
        && page.columns.every(c => !c.some(l => l.kind === 'heading' && l.tokenId === bln.tokenId))) {
        const left = Math.min(...tpl.columns.map(c => c.x));
        const right = Math.max(...tpl.columns.map(c => c.x + c.w));
        const fullW = right - left;
        const used = page.spanning.heightPx || 0;
        const remaining = tpl.contentBox.height - used;
        const dec = headingDividerDecision(settings, remaining, DIVIDER_H_PX, {
          columnLinesBefore: [bln], colIdx: 0, pageIndex: pi, tokenId: (bln.meta && bln.meta.tokenId) || bln.tokenId, band: true
        });
        if (dec.insert) {
          counters.record(dec.rollbackKey);
          const wDiv = Math.min(Math.round(fullW * 0.5), Math.round(fontPx * 6));
          const y = tpl.contentBox.top + used - Math.round((bln.heightPx || 0) / 2) - 1;
          pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${bln.level}`, kindStyle: 'thin', x: Math.round(left + (fullW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi, settings);
          planted.headingDivider++;
        } else if (dec.why !== 'disabled' && dec.why !== 'column-head-or-empty') {
          rejected.push({ page: pi, kind: 'heading-divider', why: dec.why });
        }
      }
    }
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
            pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${ln.level}`, kindStyle: 'thin', x: Math.round(colX + (colW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi, settings);
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
        pushOrnament(page, { kind: 'shaar-divider', slot: `shaar-div-${page.type}`, kindStyle: dec.style, x: Math.round(tpl.columns[0].x + (tpl.columns[0].w - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX }, rejected, pi, settings);
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
          }, rejected, pi, settings);
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

/** **03.11 (EXT-14):** הפניית תמונה לעיטור מסוג 'image' — מההגדרות לפי מיקום העיטור.
 * הערך בהגדרות הוא הפניה מלאה 'imud:<collection>:<id>' (נבנה ע"י ה-UI בבחירת עיצוב);
 * הרינדור פותר אותה דרך asset-registry. גישה מילולית לכל מפתח — סורק הצרכנים
 * (S4.1.4) מוכיח שכל הגדרה באמת נקראת כאן. */
function imageRefForOrnament(orn, settings) {
  if (!orn || orn.kindStyle !== 'image' || !settings) return null;
  const slot = String(orn.slot || '');
  if (slot.startsWith('h2-top')) return settings['imud-orn-top'] || null;
  if (slot.startsWith('h2-bottom')) return settings['imud-orn-bottom'] || null;
  if (slot.startsWith('h2-side') || slot.startsWith('h3-side')) return settings['imud-orn-side'] || null;
  if (slot.startsWith('chapter-end')) return settings['imud-chapter-end'] || null;
  if (slot.startsWith('hdr-div') || slot.startsWith('shaar-div')) return settings['imud-divider'] || null;
  return null;
}

/** הוספת rect עיטור עם אימות מקור־יחיד (F-09). */
function pushOrnament(page, orn, rejected, pageIndex, settings) {
  const check = assertSingleSourceSizing(orn);
  if (!check.ok) {
    rejected.push({ page: pageIndex, kind: orn.kind, why: `single-source-violation:${check.reason}` });
    return;
  }
  const image = imageRefForOrnament(orn, settings);
  page.decorations.push({ ...orn, image, cssClass: `orn orn--${orn.kind} orn--${orn.kindStyle || 'plain'}` });
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
  // משמרות REQ-ORN-04: לא בראש טור, לא בטור ריק — נבדק באתר ההצבה בפועל.
  // **03.11(ד):** בפס חוצה־טורים (ctx.band) אין מושג "ראש טור" — הכותרת בראש
  // הפס מעצם טבעה; נותרת רק בדיקת התקציב.
  if (!ctx.band && !dividerInsertable(ctx.columnLinesBefore, ctx.colIdx)) return { insert: false, why: 'column-head-or-empty' };
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
 *
 * **03.11 — v1.1 (ייצוא בדפדפן דרך ה־Worker; המנוע הכבד חי רק שם):**
 *   → {type:'register-font', jobId, name, bytes: ArrayBuffer}       // TTF למדידת גופן אמיתי
 *   ← {type:'register-font-result', jobId, name, ok, error?, glyphCount?}
 *   → {type:'export-request', jobId, kind:'pdf'|'zip', text, settings,
 *       fontBytes?: ArrayBuffer|null, fontName?: string, extensions?: object|null}
 *   ← {type:'export-result', jobId, kind, ok, error?, bytes?: Uint8Array, info?: object}
 *   ← {type:'export-error', jobId, message}
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
  // **03.11 (v1.1):** רישום גופן למדידה (TTF bytes) — לפני עימוד במדידת גופן אמיתי
  if (msg.type === 'register-font') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.name !== 'string' || !msg.name) throw new Error('protocol: name required');
    if (!(msg.bytes instanceof ArrayBuffer) && !(msg.bytes && msg.bytes.byteLength != null)) {
      throw new Error('protocol: bytes (ArrayBuffer/TypedArray) required');
    }
    return true;
  }
  // **03.11 (v1.1):** רישום אוסף נכסי עיצוב (SVG מחוטא) ברישום שבמנוע — לרינדור עימוד/ייצוא
  if (msg.type === 'register-assets') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.collection !== 'string' || !msg.collection) throw new Error('protocol: collection required');
    if (!Array.isArray(msg.items)) throw new Error('protocol: items array required');
    return true;
  }
  // **03.11 (v1.1):** בקשת ייצוא PDF/ZIP — רץ ב־Worker (המנוע המלא + שימת Buffer בדפדפן)
  if (msg.type === 'export-request') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (msg.kind !== 'pdf' && msg.kind !== 'zip') throw new Error('protocol: kind must be pdf|zip');
    if (typeof msg.text !== 'string') throw new Error('protocol: text must be string');
    if (!msg.settings || typeof msg.settings !== 'object') throw new Error('protocol: settings required');
    if (msg.fontBytes != null && !(msg.fontBytes instanceof ArrayBuffer) && !(msg.fontBytes && msg.fontBytes.byteLength != null)) {
      throw new Error('protocol: fontBytes must be ArrayBuffer/TypedArray or null');
    }
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
__modules["src/engine/decoration/asset-registry.js"] = function (require, module, exports) {
// src/engine/decoration/asset-registry.js — רישום נכסי עיצוב ופתרון הפניות (03.11, EXT-14)
'use strict';

/**
 * רישום מרכזי של נכסי עיצוב (שערים/עיטורים/מפרידים — SVG + תיבות) ופתרון
 * הפניות «imud:<collection>:<id>» ל-data-URI בטוח לשימוש כרקע/תמונה.
 *
 * **אבטחה:** כל SVG עובר חיטוי (svg-sanitize) בעת הרישום — לעולם לא נשמר כמו
 * שהוא. רישום כפול של אותו מזהה — החדש מחליף (עדכון ספרייה); מזהים לא
 * חוקיים נדחים ומדווחים — לא בשקט.
 *
 * **סביבת-אגנוסטיות:** אין DOM/פetch כאן — המודול טהור ונבדק גם ב-Node;
 * הטעינה מהרשת חיה ב-UI (imud-library.js).
 */

const { sanitizeSvg } = require('./svg-sanitize');

/** הרישום עצמו: collection → Map(id → item). */
const collections = new Map();

/** קידוד SVG כ-data-URI (UTF-8 percent-encoding — תואם url("...") ב-CSS). */
function svgDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(svg));
}

/** ולידציית שם אוסף/מזהה: [a-zA-Z0-9_-] בלבד — מונע הזרקת תווים להפניה. */
function validToken(s) {
  return typeof s === 'string' && /^[A-Za-z0-9_-]+$/.test(s);
}

/**
 * רישום אוסף נכסים.
 * @param {string} collection — שם האוסף (למשל 'shaar-main', 'orn-ud', 'divider')
 * @param {Array<{id:string, name?:string, svg:string, box?:object}>} items
 * @returns {{ok:boolean, registered:number, rejected:Array<{id:string, reason:string}>}}
 */
function registerAssets(collection, items) {
  if (!validToken(collection)) return { ok: false, registered: 0, rejected: [{ id: String(collection), reason: 'bad-collection-name' }] };
  if (!Array.isArray(items)) return { ok: false, registered: 0, rejected: [{ id: collection, reason: 'items-not-array' }] };
  let map = collections.get(collection);
  if (!map) { map = new Map(); collections.set(collection, map); }
  const rejected = [];
  let registered = 0;
  for (const it of items) {
    if (!it || !validToken(it.id)) { rejected.push({ id: it && String(it.id), reason: 'bad-id' }); continue; }
    const clean = sanitizeSvg(String(it.svg || ''));
    if (!clean.ok) { rejected.push({ id: it.id, reason: `svg-rejected:${clean.reason}` }); continue; }
    map.set(it.id, {
      id: it.id,
      name: it.name || it.id,
      svg: clean.svg,
      dataUri: svgDataUri(clean.svg),
      box: it.box || null
    });
    registered++;
  }
  return { ok: rejected.length === 0, registered, rejected };
}

/** מספר הנכסים הרשומים (לבדיקות ולתצוגה). */
function assetCount() {
  let n = 0;
  for (const m of collections.values()) n += m.size;
  return n;
}

/** רשימת פריטי אוסף (מזהה+שם+תיבה — בלי SVG, קל ל-UI). */
function listCollection(collection) {
  const map = collections.get(collection);
  if (!map) return [];
  return Array.from(map.values()).map((it) => ({ id: it.id, name: it.name, box: it.box }));
}

/**
 * פתרון הפניה לפריט. פורמטים נתמכים:
 *  - 'imud:<collection>:<id>' → פריט מהרישום
 *  - כל ערך אחר → מוחזר כמו שהוא (URL/data-URI קיים — לא נוגעים)
 * @returns {{resolved:boolean, uri:string|null, item:object|null}}
 */
function resolveAssetRef(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('imud:')) return { resolved: false, uri: ref || null, item: null };
  const parts = ref.split(':');
  if (parts.length !== 3) return { resolved: false, uri: null, item: null };
  const [, col, id] = parts;
  const map = collections.get(col);
  const item = map && map.get(id);
  if (!item) return { resolved: false, uri: null, item: null };
  return { resolved: true, uri: item.dataUri, item };
}

/** האם הפניה היא הפניית imud (גם אם טרם נטענה — להודעות ברורות למשתמש). */
function isImudRef(ref) {
  return typeof ref === 'string' && ref.startsWith('imud:');
}

/** ניקוי מלא (בדיקות/isolation). */
function resetAssets() {
  collections.clear();
}

module.exports = { registerAssets, resolveAssetRef, isImudRef, listCollection, assetCount, resetAssets, svgDataUri };

};
__modules["src/engine/decoration/svg-sanitize.js"] = function (require, module, exports) {
// src/engine/decoration/svg-sanitize.js — SVG sanitizer + CSP hook (S8.1 task 10; full pass S13)
'use strict';

/**
 * חיטוי SVG (Spec §9.5 "sanitized SVG"): רשימת־היתרים, לא רשימת־חסימות.
 * נשללים: <script>, <foreignObject>, תגי אנימציה עם לולאות (set/animate עם begin=never/indefinite
 * אינם סיכון גיאומטרי אך נשללים כאן בשל דטרמיניזם), מאפייני on*, javascript:, data:text/html,
 * והפניות חיצוניות (href/xlink:href למקור שאינו מקומי).
 *
 * מדיניות zero-randomness/דטרמיניזם: הפלט קבוע לקלט נתון.
 */

/** תגים מותרים (רשימת־היתרים). */
const ALLOWED_TAGS = new Set([
  'svg', 'g', 'defs', 'title', 'desc', 'path', 'rect', 'circle', 'ellipse', 'line',
  'polyline', 'polygon', 'text', 'tspan', 'linearGradient', 'radialGradient', 'stop',
  'clipPath', 'mask', 'pattern', 'use', 'symbol', 'image', 'marker', 'style'
]);

/** מאפיינים מותרים כללית (קידומות גם ב־xlink:). */
const ALLOWED_ATTRS = new Set([
  'id', 'class', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'width', 'height', 'transform', 'viewBox', 'fill', 'fill-opacity', 'fill-rule',
  'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'points', 'gradientUnits',
  'gradientTransform', 'offset', 'stop-color', 'stop-opacity', 'clip-path',
  'clip-rule', 'mask', 'clipPathUnits', 'patternUnits', 'preserveAspectRatio',
  'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline',
  'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'xmlns', 'xmlns:xlink',
  'version', 'xml:space', 'style'
]);

/** @returns {{ok:boolean, svg:string, removed:string[], reason?:string}} */
function sanitizeSvg(svgText) {
  const src = String(svgText || '');
  if (!src.trim()) return { ok: false, svg: '', removed: [], reason: 'empty' };
  if (!/<svg[\s>]/i.test(src)) return { ok: false, svg: '', removed: [], reason: 'not-svg' };
  const removed = [];
  let out = src;

  // 1) שלילת בלוקים מסוכנים תחילה (תגים שלמים עם תוכנם) — לפני כל פירוק
  for (const tag of ['script', 'foreignobject', 'animate', 'animatetransform', 'animatemotion', 'set', 'handler', 'listener']) {
    const re = new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}\\s*>|<${tag}(\\s[^>]*)?\\/>`, 'gi');
    out = out.replace(re, () => { removed.push(`tag:${tag}`); return ''; });
  }

  // 2) מעבר תג־תג: השמטת תגים שאינם ברשימת־ההיתרים (עם תוכנם ליחידים מסוכנים)
  out = out.replace(/<\/?([a-zA-Z:][-a-zA-Z0-9:_]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (whole, tag) => {
    const t = String(tag).toLowerCase();
    if (ALLOWED_TAGS.has(t)) return whole;
    removed.push(`tag:${t}`);
    return '';
  });

  // 3) מאפיינים: on*, javascript:, והפניות חיצוניות
  out = out.replace(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g, (whole, name, _q, dq, sq) => {
    const n = String(name).toLowerCase();
    const val = String(dq != null ? dq : sq);
    if (n.startsWith('on')) { removed.push(`attr:${n}`); return ''; }
    if (!ALLOWED_ATTRS.has(n) && !n.startsWith('xlink:')) { removed.push(`attr:${n}`); return ''; }
    const v = val.trim().toLowerCase();
    if (v.includes('javascript:') || v.includes('data:text/html') || v.startsWith('vbscript:')) {
      removed.push(`attr-url:${n}`);
      return '';
    }
    // href/xlink:href: מותרים רק עצמים פנימיים (#id) — אין מקורות חיצוניים
    if (n === 'href' || n === 'xlink:href') {
      if (!val.trim().startsWith('#')) { removed.push(`ext-ref:${n}`); return ''; }
    }
    return whole;
  });

  // 4) בלוקי <style>: הסרת url(...) חיצוניים ו־expression()
  out = out.replace(/<style([^>]*)>([\s\S]*?)<\/style\s*>/gi, (whole, attrs, css) => {
    if (/url\(\s*['"]?\s*(https?:|file:|\/\/)/i.test(css) || /expression\s*\(/i.test(css)) {
      removed.push('style:external-url');
      return '<style></style>';
    }
    return whole;
  });

  if (!/<svg[\s>]/i.test(out)) return { ok: false, svg: '', removed, reason: 'svg-stripped' };
  return { ok: true, svg: out, removed };
}

/**
 * CSP hook (S13 ישלים): מסמך CSP מומלץ להטמעת שערי SVG חיצוניים.
 * אין eval, אין מקורות חיצוניים; blob/data לתמונות בלבד.
 */
function svgCspDirective() {
  return "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-src 'none'";
}

module.exports = { sanitizeSvg, svgCspDirective, ALLOWED_TAGS, ALLOWED_ATTRS };

};
__modules["src/engine/output/export-api.js"] = function (require, module, exports) {
// src/engine/output/export-api.js — Export orchestrator: HTML standalone / PDF / ZIP bundle (S12.1, REQ-EXP-01..04)
'use strict';

/**
 * מנהה הייצוא — נקודת הכניסה האחידה של שלושת הנתיבים:
 *  - exportHtml(result, settings, doc): HTML עצמאי חד־קובץ (dir=rtl, @page, offline);
 *  - exportPdf(text, settings, fontBytes): PDF עם טקסט אמיתי + סימניות + קישורי TOC
 *    + סימני חיתוך. **מסלול מדידה עקבי:** העימוד לייצוא רץ עם measure-impl=font-metrics
 *    והגופן המוטמע — שבירות השורות והרוחבים בפועל מאותו גופ�ן (מקור גיאומטריה יחיד);
 *  - exportProjectZip / importProjectZip: חבילת פרויקט ZIP מובנית (JSON — לא תבניות מחרוזות).
 *
 * דטרמיניזם בכל הנתיבים: אין Date.now; סדר קבוע; ייצוא כפול ⇒ בתים זהים.
 */

// **D-65 הפרדת חבילות:** המודולים להלן בטוחים־דפדפן (אין fs/pipeline) ונאגדים
// גם בחבילת ה־UI. הנתיבים הכבדים (PDF/ZIP מלאים — pipeline+גופן+בינארי) נטענים
// בעצלתות עם סמן node-only באותה שורת הקריאה — הבאנדלר מדלג; הקריאות מוגנות ב־typeof Buffer.
// (03.11: הסמן הוסר מהערה זו — תגובה שהכילה אותו מילולית הטעתה את הבאנדלר לדלג
// גם על require רגיל ⇒ קריסת ייצוא בדפדפן. הזיהוי כעת קפדני: אותה שורה בלבד.)
const getDefaultSettings = require('../core/settings-registry').getDefaultSettings;
const { renderPage } = require('./dom-renderer');
const { buildStandaloneHtml } = require('./html-export');
const { PAGE_SIZES, MM_TO_PX } = require('../layout/page-templates');
const { utf8Decode } = require('../import/zip-reader'); // פענוח UTF-8 סביבת-אגנוסטי (רשומות zip = Uint8Array)

/** טעינה עצלה של נתיבי Node (מוגנת) — מחזירה null בסביבה בלי Buffer. */
function nodeOnly(loader) {
  if (typeof Buffer === 'undefined') return null; // דפדפן — הקריאה מלאכותית נמנעת מראש
  return loader();
}

/** **03.11(ג) תיקון קריסת ייצוא HTML בדפדפן:** ב-DOM האמיתי outerHTML מאפיין
 * (מחרוזת), ב-shim הבדיקות — פונקציה. הפונקציה הזו מטפלת בשניהם + נפילה
 * לסריאליזציה ידנית בסיסית (אף סביבה לא נותרת בלי פלט). */
function elementOuterHtml(el) {
  if (!el) return '';
  if (typeof el.outerHTML === 'function') return el.outerHTML(); // shim הבדיקות
  if (typeof el.outerHTML === 'string') return el.outerHTML;      // DOM אמיתי
  if (typeof el.innerHTML === 'string' && el.tagName) {
    return `<${el.tagName}>${el.innerHTML}</${el.tagName}>`;       // מוצא אחרון
  }
  return '';
}

// ============ HTML עצמאי (REQ-EXP-02) ============

/**
 * ייצוא HTML עצמאי חד־קובץ. העמודים מרונדרים דרך dom-renderer (אותו מקור
 * כמו התצוגה החיה) אל doc שסופק (document אמיתי בדפדפן / shim בבדיקות).
 * @param {object} result — תוצאת typeset
 * @param {object} settings — הגדרות ממוזגות
 * @param {{createElement:Function}} doc — מפעל DOM
 * @param {object} [meta] — {title}
 */
function exportHtml(result, settings, doc, meta = {}) {
  // **זהות בתים עם הרינדור החי:** כל עמוד מוקרן דרך dom-renderer בדיוק כמו
  // התצוגה — בלי מאפיינים נוספים (השוואת parity נעולה בבדיקות מילה־במילה).
  // **03.11(ד):** בעבר הועבר result.metadata כארגומנט ה-header — טעות סוג:
  // ההעברה הזו לא הציגה כותרת עליונה בייצוא (מטא־נתונים אינם header). מעתה
  // renderPage נופל לברירת המחדל page.header שהצינור מצמיד לכל עמוד.
  const pagesHtml = [];
  for (const pg of result.pages) {
    pagesHtml.push(elementOuterHtml(renderPage(pg, settings, doc)));
  }
  const sizeMm = pageMmOf(settings);
  const pageRules = settings['export-html-page-rules'] !== false
    ? `@page { size: ${round2mm(sizeMm.w)}mm ${round2mm(sizeMm.h)}mm; margin: 0 }\n`
      + `.page{width:${Math.round(sizeMm.w * MM_TO_PX)}px;height:${Math.round(sizeMm.h * MM_TO_PX)}px}\n`
    : '';
  const html = buildStandaloneHtml(pagesHtml, settings, {
    title: meta.title || (result.metadata && (result.metadata['ספר'] || result.metadata.title)) || 'ספר',
    pageRules,
    // **03.11:** הטמעת הגופנים בקובץ העצמאי (@font-face data-URI) — מסופק ע"י ה־UI
    // מהספרייה (imud-library); ללא הגדרה — כמו קודם (fallback מערכת).
    fontCss: meta.fontCss || ''
  });
  return html;
}

// ============ PDF (REQ-EXP-03) ============

/**
 * ייצוא PDF מלא: עימוד במדידת הגופן המוטמע → הקרנה → כתיבה.
 * @param {string} text — מסמך המקור
 * @param {object} settingsIn — הגדרות המשתמש
 * @param {Buffer} fontBytes — קובץ TTF להטמעה (למשל DejaVu)
 * @param {string} [fontName] — שם פרופיל (ברירת מחדל: body-font של ההגדרות)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, result?:object, projected?:object, info?:object}}
 */
function exportPdf(text, settingsIn, fontBytes, fontName) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' }; // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { typeset } = require('../core/pipeline');
  /* node-only */ const { registerFont, unregisterFont } = require('../typography/measure-api');
  /* node-only */ const { parseFont, glyphIdOf } = require('../typography/font-metrics');
  /* node-only */ const { buildSubset, charInventory } = require('../typography/font-subset');
  /* node-only */ const { projectDocument } = require('./geometry-projector');
  /* node-only */ const { writePdf } = require('./pdf-writer');
  const profileName = fontName || settingsIn['body-font'] || 'ToraExport';
  const reg = registerFont(profileName, fontBytes);
  if (!reg.ok) { unregisterFont(profileName); return { ok: false, error: `font:${reg.error}` }; }
  try {
    const font = reg.profile;
    // **סדר הפעולות (תיקון שורש):** עימוד → הקרנה → מלאי מ**כל הטקסט שמצויר
    // בפועל** (גוף+פסים+TOC+מרזב+גיליון+כותרות) → מצמום → כתיבה.
    // בעבר נבנה המלאי מטקסט המקור בלבד — וגרשיים נגזרים (גיליון כ״ב, תוויות
    // TOC) הושמטו בשקט מהגופן ⇒ אובדן תוכן בייצוא.
    const settings = {
      ...getDefaultSettings(), ...settingsIn,
      'body-font': profileName,
      'measure-impl': 'font-metrics'
    };
    const result = typeset(text, settings, { noRecommendations: true });
    // **S4.9:** פרופיל IMUD — הקרנה ממקרן ה-legacy (גיאומטריה מפורשת מהייחוס)
    const projected = result.legacyProfile
      ? require('./legacy-projector').projectLegacyDocument(result, settings)
      : projectDocument(result, settings);
    const drawnParts = [];
    for (const pg of projected.pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawnParts.push(w.text);
      for (const fn of pg.footnotes) drawnParts.push(fn.marker || '', fn.text || '');
      if (pg.folio && pg.folio.text) drawnParts.push(pg.folio.text);
      if (pg.header) for (const s of pg.header.slots) drawnParts.push(s.text);
    }
    const inventory = charInventory(drawnParts.join(' '));
    const subset = buildSubset(font, inventory);
    if (!subset.ok) return { ok: false, error: `subset:${subset.error}` };

    // סימניות: H1 → רמה 1; H2 → רמה 2 (עץ מכותרות המודל)
    const outline = [];
    const firstPageByToken = new Map();
    result.pages.forEach((pg) => {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.columns.flat()]) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
      }
    });
    for (const b of result.tokens) {
      if (b.type !== 'heading' || (b.level !== 1 && b.level !== 2)) continue;
      const pg = firstPageByToken.get(b.id);
      if (pg == null) continue;
      outline.push({ title: b.text, page: pg, level: b.level });
    }

    // קישורי TOC: שורות tocPages עם targetPage נפתר (S9). מיקום השורות — פריסת
    // הרנדרר (toc-rows: top 70, שורה ~24px) — מלבן לחיץ לכל שורה/פריט קבוצה.
    const tocLinks = [];
    for (const tp of result.tocPages || []) {
      let yi = 0;
      for (const row of (tp.toc && tp.toc.rows) || []) {
        if (row.kind === 'group') {
          let xi = 0;
          for (const it of row.items || []) {
            if (it.targetPage != null) tocLinks.push({ page: tp.index, x: 18 + xi, y: 70 + yi * 24, w: 60, h: 22, targetPage: it.targetPage });
            xi += 80;
          }
        } else if (row.targetPage != null) {
          tocLinks.push({ page: tp.index, x: 18, y: 70 + yi * 24, w: 700, h: 22, targetPage: row.targetPage });
        }
        yi++;
      }
    }

    const pageSizeMm = pageMmOf(settings);
    const fontForWriter = {
      subsetBytes: subset.bytes,
      widthsUnits: subset.widthsUnits,
      unitsPerEm: subset.unitsPerEm,
      cidOf: (ch) => {
        const gNew = glyphIdOf(parseSubsetCache(subset), ch); // gid בתת־הגופן
        return gNew;
      },
      charToGidEntries: () => [...subsetNewCmap(subset).entries()]
    };
    const bytes = writePdf({
      pages: projected.pages,
      pageSizeMm,
      font: fontForWriter,
      settings,
      outline,
      tocLinks
    });
    return {
      ok: true, bytes, result, projected,
      info: {
        pages: result.pages.length,
        glyphs: subset.kept,
        fontBytes: subset.bytes.length,
        outline: outline.length,
        tocLinks: tocLinks.length,
        layoutHash: result.layoutHash,
        // **03.11 (חיזוק ביקורת):** נתוני היעדים בפועל — לבדיקת אמת שכל
        // סימנייה/קישור מצביע לעמוד הנכון (לא רק מספרם).
        outlineItems: outline,
        tocLinkTargets: tocLinks.map(l => l.targetPage),
        tocLinkPages: tocLinks.map(l => l.page)
      }
    };
  } finally {
    unregisterFont(profileName);
  }
}

/** קריאת תת־הגופן (פעם אחת) למיפוי תו→gid חדש — ה־cidOf/charToGidEntries של הכותב. */
const _subsetCache = new WeakMap();
function parseSubsetCache(subset) {
  if (!_subsetCache.has(subset)) {
    /* node-only */ const { parseFont } = require('../typography/font-metrics');
    _subsetCache.set(subset, parseFont(subset.bytes).font);
  }
  return _subsetCache.get(subset);
}
function subsetNewCmap(subset) {
  const f = parseSubsetCache(subset);
  const out = new Map();
  for (const [cp, g] of f.charToGlyph) out.set(String.fromCodePoint(cp), g);
  return out;
}

// ============ חבילת פרויקט ZIP (REQ-EXP-04) ============

/**
 * ייצוא חבילת פרויקט: מסמך + הגדרות (עם settings_version) + הרחבות + תבנית ערכה.
 * כל החלקים JSON מובנה — אפס תבניות מחרוזות (שיעור regex-replacement).
 * @returns {Buffer} — ZIP
 */
function exportProjectZip(text, settings, extras = {}) {
  if (typeof Buffer === 'undefined') return Buffer.alloc(0); // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { buildZip } = require('./zip-writer');
  /* node-only */ const { exportProject } = require('./project-io');
  /* node-only */ const { exportExtensions } = require('../extensions/extensions-io');
  const settingsJson = exportProject(null, cleanSettings(settings), { timestamp: null });
  const extensionsJson = (extras.extensions != null)
    ? exportExtensions(extras.extensions)
    : exportExtensions({ styles: [], pages: [], images: [] });
  const themeJson = JSON.stringify(extras.theme || { 'theme-set-id': settings['theme-set-id'] || 'default' }, null, 2);
  const manifest = JSON.stringify({
    format: 'tora-typesetter-project-zip',
    format_version: 1,
    parts: ['document.txt', 'settings.json', 'extensions.json', 'theme.json'],
    settings_version: 2
  }, null, 2);
  return buildZip([
    { name: 'manifest.json', data: manifest },
    { name: 'document.txt', data: String(text || '') },
    { name: 'settings.json', data: settingsJson },
    { name: 'extensions.json', data: extensionsJson },
    { name: 'theme.json', data: themeJson }
  ]);
}

/**
 * ייבוא חבילת פרויקט.
 * @returns {{ok:boolean, error?:string, text?:string, settings?:object, extensions?:object, theme?:object, unknownKeys?:Array, issues?:Array}}
 */
function importProjectZip(bytes) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' };
  /* node-only */ const { readZip } = require('../import/zip-reader');
  /* node-only */ const { importProject } = require('./project-io');
  const zip = readZip(bytes);
  if (!zip.ok) return { ok: false, error: `zip:${zip.error}` };
  const entry = (name) => zip.entries.find(e => e.name === name);
  const manifestE = entry('manifest.json');
  const docE = entry('document.txt');
  const setE = entry('settings.json');
  if (!manifestE || !docE || !setE) return { ok: false, error: 'missing-parts' };
  let manifest;
  try { manifest = JSON.parse(utf8Decode(manifestE.data)); } catch (e) { return { ok: false, error: `manifest:${e.message}` }; }
  if (manifest.format !== 'tora-typesetter-project-zip') return { ok: false, error: 'unknown-format' };
  const proj = importProject(utf8Decode(setE.data));
  let extensions = null;
  const extE = entry('extensions.json');
  if (extE) {
    /* node-only */ const { importExtensions } = require('../extensions/extensions-io');
    const res = importExtensions(utf8Decode(extE.data));
    extensions = res; // כולל ok/errors — מדווח, לא שותק
  }
  let theme = null;
  const themeE = entry('theme.json');
  if (themeE) { try { theme = JSON.parse(utf8Decode(themeE.data)); } catch (e) { return { ok: false, error: `theme:${e.message}` }; } }
  return {
    ok: true,
    text: utf8Decode(docE.data),
    settings: proj.settings,
    extensions, theme,
    unknownKeys: proj.unknownKeys,
    issues: proj.issues
  };
}

// ============ עזרים ============

function pageMmOf(settings) {
  const px = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  return { w: px.w / MM_TO_PX, h: px.h / MM_TO_PX }; // px → מ״מ (אותו גורם)
}
function round2mm(v) { return Math.round(v * 100) / 100; }

/** הגדרות נקיות לייצוא: מפתחות פנימיים (מקווקוות) מוסרים — נכסי זמן־ריצה. */
function cleanSettings(settings) {
  const out = {};
  for (const [k, v] of Object.entries(settings || {})) {
    if (k.startsWith('_')) continue;
    out[k] = v;
  }
  return out;
}

module.exports = {
  exportHtml, exportPdf, exportProjectZip, importProjectZip, pageMmOf
};

};
__modules["src/engine/output/dom-renderer.js"] = function (require, module, exports) {
// src/engine/output/dom-renderer.js — DOM render (browser) + PUA scrub invariant (REQ-PAR-05, BRZ-13)
'use strict';

/**
 * רנדור עמודים ל‑DOM. כללי יסוד:
 * - U+E000/U+E101 חייבים להיעלם מה‑DOM הסופי (scrub לפני render; נשמרים רק לשלב המדידה).
 * - כיווניות RTL מלאה; no !important על inline של עיטורים (F-09 — מקור שליטה יחיד).
 * - מיפוי סוג עמוד → מחלקת CSS: regular/shaar/preface/sign-open/endnotes/toc/filler.
 *
 * **עדכוני סגירת S7:**
 *  - סמני הערות מ‑notes/markers (מקור אחיד — P1-3); מקטעי פיצול הערה ארוכה
 *    מסומנים class fn--continuation עם תוספת "(המשך)".
 *  - background-opacity ⇒ rgba() אמיתי (בעבר נכתב לתכונת CSS בלתי קיימת — P0-5).
 *  - paren-style-scale ⇒ מילים בתוך סוגריים ב‑span.w--paren (D-42).
 *  - column-divider-style ⇒ חוט מפריד בין הטורים, גובה Math.min−8px (overlay — geometry-neutral).
 *  - עמודי הערות: כותרת + רשימת הערות (S7.1.1).
 *  - הערות צד: מיקום מוחלט לפי yTop/x מה‑placement (S7.1.2).
 */

const PT_CLASS = {
  'regular': 'page page--regular',
  'shaar-main': 'page page--shaar page--shaar-main',
  'shaar-sub': 'page page--shaar page--shaar-sub',
  'shaar-back': 'page page--shaar page--shaar-back',
  'preface': 'page page--preface',
  'sign-open': 'page page--sign-open',
  'h3-spread': 'page page--h3-spread',
  'endnotes': 'page page--endnotes',
  'toc-general': 'page page--toc page--toc-general',
  'toc-detail': 'page page--toc page--toc-detail',
  'custom': 'page page--custom',
  'filler': 'page page--filler'
};

const ATOMIC_SPACE = '\uE000';
const PAREN_MARK = '\uE101';

/** scrub חובה: אף תו PUA פנימי לא יוצא החוצה (BRZ-13 / S2.2). */
function scrubPUAText(s) {
  // BRZ-13: כל תווי ה‑PUA הפנימיים (E000 רווח אטומי, E101 סוגריים, E102 תג סמן) — נאספים לפני רנדר
  return String(s).split(ATOMIC_SPACE).join(' ').split(PAREN_MARK).join('').split('\uE102').join('');
}

/** rgba() אמיתי מ‑background-color + background-opacity (תיקון P0-5). */
function bgRgba(color, opacity) {
  const hex = String(color || '#ffffff');
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  const op = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
  if (!m) return hex; // שם־צבע/תבנית אחרת — כמו שהוא
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${op})`;
}

/**
 * S7 — צריכת footnote-marker-style (enum) דרך מקור אחיד: notes/markers.
 * (בעבר היה כאן ממיר מקומי שני — אי־עקביות מספור, P1-3.)
 */
const { markerFor } = require('../notes/markers');
const { planDecorations } = require('../decoration/page-decorations');
const { resolveShaarBox } = require('../decoration/shaar-boxes');
const { columnDividerHeightPx } = require('../decoration/ornament-fit');
const { resolveAssetRef } = require('../decoration/asset-registry'); // **03.11:** imud: → data-URI
const { MM_TO_PX } = require('../layout/page-templates');
const { isCssFrame } = require('../decoration/folio'); // **S9:** מסגרות גיליון CSS (circle/square)
const { lineFontSizePt, lineFontFamily, ptToPx } = require('./line-font');
const { buildShaarBlocks, shaarFontOf } = require('./shaar-content'); // **03.11(ד)** // **03.11(ג):** מקור יחיד לגופן/גודל שורה

/** S9 — body-last-line-align (center|right|stretch): יישור שורה אחרונה של פסקה. */
function lastLineClass(ln, settings) {
  if (!ln.isLast) return '';
  const mode = settings['body-last-line-align'] || 'center';
  if (mode === 'right') return ' line--last-right';
  if (mode === 'stretch') return ' line--last-stretch';
  return ' line--last-center';
}

/** **03.11(ד):** מחסנית גופן — תומכת גם בערך מרובה־משפחות ("'A', 'B', serif"
 * מהמקור). גרשיים מנוטרלים (הזרקה בטוחה ל-CSS), משפחות גנריות (serif/sans-serif)
 * עוברות כמו שהן, ופולבאקים עבריים נוספים רק אם אינם כבר ברשימה. */
function fontStack(family) {
  // ניקוי לפי משפחה: גרשיים מוסרים, ותווים מסוכנים להזרקת CSS (; : { } / וכו')
  // נפסלים — נשארים אותיות (לטיניות ועבריות), ספרות, רווחים ומקפים בלבד.
  const safe = (x) => String(x || '').replace(/'/g, '').replace(/[^\w\u0590-\u05FF\uFB1D-\uFB4F\s-]/g, '').trim();
  const parts = String(family || '').split(',').map(safe).filter(Boolean);
  if (!parts.length) return '';
  const out = [];
  const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i;
  for (const p of parts) {
    out.push(GENERIC.test(p) ? p : `'${p}'`);
  }
  for (const fb of ['Frank Ruhl Libre', 'David', 'serif']) {
    const plain = `'${fb}'`;
    if (!out.includes(plain) && !out.includes(fb)) out.push(GENERIC.test(fb) ? fb : plain);
  }
  return out.join(', ');
}

function renderLine(ln, doc, settings = {}) {
  const el = doc.createElement('div');
  el.className = 'line' + (ln.isLast ? ' line--last' + lastLineClass(ln, settings) : '');
  el.setAttribute('dir', 'rtl');
  // **03.11(ג) (תיקון "החלפת גופן לא עושה כלום"):** גודל/גופן השורה מההגדרות —
  // אותו מקור (line-font) כמו הפרויקטור. בלי זה התצוגה מציגה הכול בגודל/גופן
  // שורש המסמך והתצוגה אינה מגיבה לשינויי גופן/גודל.
  const lnPt = lineFontSizePt(ln, settings);
  if (Number.isFinite(lnPt) && lnPt > 0) el.style.fontSize = `${ptToPx(lnPt)}px`;
  const lnFont = lineFontFamily(ln, settings);
  if (lnFont) el.style.fontFamily = fontStack(lnFont);
  if (ln.aqStretch && ln.aqStretch !== 1) {
    el.style.wordSpacing = `${(ln.aqStretch - 1) * 4}px`;
  }
  // **S8 (F-08):** הזמנת עיטורי H2 בתוך תיבת השורה — הטקסט יורד/עולה ב־padding;
  // הגובה כבר תוקצב בפריסה, הרנדור רק מצייר בתוך התיבה (מקור יחיד — F-09).
  if (ln.h2OrnPadTop) el.style.paddingTop = `${ln.h2OrnPadTop}px`;
  if (ln.h2OrnPadBottom) el.style.paddingBottom = `${ln.h2OrnPadBottom}px`;
  // **S11 (REQ-PAR-06):** הזמנת עיטורים מקושרים של סגנון מותאם — אותו דפוס (F-08).
  if (ln.csOrnPadTop) el.style.paddingTop = `${ln.csOrnPadTop}px`;
  if (ln.csOrnPadBottom) el.style.paddingBottom = `${ln.csOrnPadBottom}px`;
  // **S11 (REQ-PAR-06):** סגנון ברמת הבלוק — class + סגנון מובנה + מונה גלוי בשורה הראשונה.
  if (ln.customStyle) {
    el.className += ' custom-style';
    el.dataset.style = ln.customStyle.id || '';
    applyCustomStyleSpec(el, ln.customStyle.styleSpec, doc);
    if (ln.csCounterMark) {
      const cm = doc.createElement('span');
      cm.className = 'cs-counter';
      cm.textContent = ln.csCounterMark;
      prependChild(el, cm);
    }
  }
  // **D-42:** מילים בתוך סוגריים — span.w--paren עם font-size בסקאלה (geometry-neutral).
  // מילים רגילות — span.w אחיד (מיצג גם ב‑DOM אמיתי וגם ב‑shim של הבדיקות).
  // **S11:** טווחי inline מסגנון מותאך — span.w--custom עם data-style (גודל מוחל כבר במדידה).
  const parenScale = Number(settings['paren-style-scale']) || 1;
  const words = (ln.words || []).map(w => scrubPUAText(w.replace(/\u00A0/g, '\u00A0')));
  const spans = ln.parenSpans || [];
  const customs = ln.customSpans || [];
  if ((spans.length && parenScale !== 1) || customs.length) {
    for (let i = 0; i < words.length; i++) {
      const span = doc.createElement('span');
      const cIdx = customs.findIndex(c => c.wi === i);
      if (cIdx >= 0) {
        span.className = 'w w--custom';
        span.dataset.style = customs[cIdx].styleId;
      } else if (spans.includes(i)) {
        span.className = 'w w--paren';
        span.style.fontSize = `${Math.round(parenScale * 100)}%`;
      } else {
        span.className = 'w';
      }
      span.textContent = words[i];
      el.appendChild(span);
    }
  } else {
    el.textContent = words.join(' ');
  }
  const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
  if (tok) el.dataset.token = tok;
  return el;
}

/** **S11:** הכנסת ילד ראשון — insertBefore כשיש; fallback ל־unshift (תאימות ל־shims של הבדיקות). */
function prependChild(el, node) {
  if (typeof el.insertBefore === 'function') el.insertBefore(node, el.firstChild || null);
  else { (el.children || (el.children = [])).unshift(node); node.parentNode = el; }
}

/** **S11 (REQ-PAR-06):** החלת סגנון מותאם על יסוד DOM — מקור יחיד לכל מוצרי הדגל. */
function applyCustomStyleSpec(el, spec, doc) {
  void doc;
  if (!spec || typeof spec !== 'object') return;
  if (spec.fontSizePt) el.style.fontSize = `${spec.fontSizePt}pt`;
  if (spec.bold) el.style.fontWeight = '700';
  if (spec.italic) el.style.fontStyle = 'italic';
  if (spec.color) el.style.color = spec.color;
  if (spec.background) el.style.background = spec.background;
  if (spec.border) el.style.borderRight = `3px solid ${typeof spec.border === 'string' ? spec.border : '#1a1a1a'}`;
  if (spec.indentEm) { el.style.paddingRight = `${spec.indentEm}em`; el.style.marginRight = `${spec.indentEm}em`; }
  if (spec.align) el.style.textAlign = spec.align === 'stretch' ? 'justify' : spec.align;
  if (spec.letterSpacingEm) el.style.letterSpacing = `${spec.letterSpacingEm}em`;
  if (spec.textTransform === 'small-caps') el.style.fontVariant = 'small-caps';
}

function renderFootnoteArea(page, settings, doc) {
  if (!settings['footnotes-enabled'] || !page.footnotes.length) return null;
  const area = doc.createElement('div');
  area.className = `footnotes footnotes--${settings['fn-layout-mode']}`;
  if (settings['footnote-separator-rule'] !== 'none') {
    const rule = doc.createElement('div');
    rule.className = `fn-rule fn-rule--${settings['footnote-separator-rule']}`;
    area.appendChild(rule);
  }
  // סמן אחיד (notes/markers) + סימון המשך למקטעי פיצול (S7.1.3 long-note policy)
  for (const n of page.footnotes) {
    const marker = n.marker || markerFor(Number.isInteger(n.docIndex) ? n.docIndex : (n.markerNum || 1), settings['footnote-marker-style']);
    const el = doc.createElement('div');
    const cont = n.isContinuation || n.mode === 'split-rest';
    el.className = 'footnote' + (cont ? ' fn--continuation' : '') + (n.customStyle ? ' footnote--custom' : '');
    if (n.customStyle) el.dataset.style = n.customStyle;
    el.dir = 'rtl';
    el.textContent = `${cont ? '(המשך) ' : ''}${marker}\u200F ${scrubPUAText(n.text || n)}`;
    area.appendChild(el);
  }
  return area;
}

/** **S9 (D-61):** גיליון עמוד — מקור יחיד לכל סוגי העמודים (בעבר 4 העתקים).
 * מסגרות CSS (circle/square) מרונדרות כ‑badge עם מחלקה; הטקסטואליות כבר בתוך התצוגה. */
function renderFolio(page, settings, doc) {
  if (!page.folioDisplay || settings['page-num-position'] === 'none') return null;
  const folio = doc.createElement('footer');
  folio.className = `folio folio--${settings['page-num-position']} folio--frame-${settings['page-num-frame']}`;
  if (isCssFrame(settings['page-num-frame'])) {
    const badge = doc.createElement('span');
    badge.className = `page-num-badge page-num-frame-${settings['page-num-frame'] === 'circle' ? 'circle' : 'box'}`;
    badge.textContent = page.folioDisplay;
    folio.appendChild(badge);
  } else {
    folio.textContent = page.folioDisplay;
  }
  return folio;
}

function renderHeader(header, doc) {
  if (!header) return null;
  const el = doc.createElement('div');
  el.className = `running-head head--sep-${header.separator}`;
  el.dir = 'rtl';
  // **S9 (D-61):** צורה חדשה {slots} עם עצמאות מלאה לכל סלוט (מקור/יישור/גופן/גודל/רוחב);
  // תאימות לאחור לצורה הישנה ({right,center,left}) לבדיקות ≤S8.
  const slots = header.slots || { right: header.right, center: header.center, left: header.left };
  for (const pos of ['right', 'center', 'left']) {
    const s = slots[pos];
    if (!s) continue;
    const slot = doc.createElement('span');
    slot.className = `head-slot head-slot--${pos} align-${s.align}`;
    slot.style.width = `${s.widthPct}%`;
    if (s.font) slot.style.fontFamily = s.font;
    if (s.sizePt) slot.style.fontSize = `${Math.round(s.sizePt * (96 / 72) * 100) / 100}px`;
    slot.textContent = scrubPUAText(s.text || '');
    el.appendChild(slot);
  }
  return el;
}

/** **S9 (REQ-HDR-05):** תוכן עמוד תוכן־עניינים — שורות עם נקודות מובילות, תווית
 * גיליון בפורמט המספור, וקישורי עוגן לחיצים (#page‑N; יעדי PDF ייבנו ב‑S12). */
function renderTocPageContent(page, doc) {
  const els = [];
  const t = page.toc || {};
  if (t.title) {
    const el = doc.createElement('h2');
    el.className = 'toc-page-title';
    el.dir = 'rtl';
    el.textContent = scrubPUAText(t.title);
    els.push(el);
  }
  const wrap = doc.createElement('div');
  wrap.className = 'toc-rows';
  wrap.dir = 'rtl';
  for (const r of (t.rows || [])) {
    if (r.kind === 'group') {
      // קבוצה (inline רצוף): "כותרת – עמוד | כותרת – עמוד" בשורה אחת (IMUD grp-item/grp-sep)
      const g = doc.createElement('div');
      g.className = `toc-row toc-row--group toc-lvl-${r.items[0] ? r.items[0].level : 1}`;
      for (const it of r.items) {
        const a = doc.createElement('a');
        a.className = `toc-item toc-lvl-${it.level}`;
        if (it.targetPage != null) a.setAttribute('href', `#page-${it.targetPage}`);
        a.setAttribute('data-anchor', it.anchorId || '');
        const txt = doc.createElement('span'); txt.className = 'grp-title';
        txt.textContent = scrubPUAText(it.text);
        const lab = doc.createElement('span'); lab.className = 'grp-page';
        lab.textContent = it.label || '';
        a.appendChild(txt); a.appendChild(lab);
        g.appendChild(a);
      }
      wrap.appendChild(g);
    } else {
      const a = doc.createElement('a');
      a.className = `toc-row toc-lvl-${r.level}` + (r.inline ? ' toc-row--inline' : '');
      if (r.targetPage != null) a.setAttribute('href', `#page-${r.targetPage}`);
      a.setAttribute('data-anchor', r.anchorId || '');
      if (r.rowNum != null) {
        const n = doc.createElement('span'); n.className = 'toc-num'; n.textContent = String(r.rowNum);
        a.appendChild(n);
      }
      const title = doc.createElement('span');
      title.className = 'toc-title';
      title.textContent = scrubPUAText(r.wrapped && r.wrapped.length ? r.wrapped.join(' ') : r.text);
      const dots = doc.createElement('span'); dots.className = 'toc-dots';
      const label = doc.createElement('span'); label.className = 'toc-label';
      label.textContent = r.label || '';
      a.appendChild(title); a.appendChild(dots); a.appendChild(label);
      wrap.appendChild(a);
    }
  }
  els.push(wrap);
  return els;
}

/** חוט מפריד בין טורים (overlay; גובה Math.min −8px — כלל V4; geometry-neutral).
 * גובה החישוב מקור יחיד: ornament-fit.columnDividerHeightPx (F-09 — לא עותק מקומי). */
function renderColumnDivider(page, settings, doc) {
  const style = settings['column-divider-style'];
  if (!style || style === 'none' || page.columns.length < 2) return null;
  const used = page.columns.map(col => col.reduce((s, ln) => s + (ln.heightPx || 0), 0));
  const h = columnDividerHeightPx(used);
  if (h <= 0) return null;
  const el = doc.createElement('div');
  el.className = `col-divider col-divider--${style}`;
  const c0 = page.template.columns[0], c1 = page.template.columns[1];
  el.style.left = `${Math.round(c1.x + c1.w + (page.template.gutter || 0) / 2)}px`;
  el.style.top = `${page.template.contentBox.top}px`;
  el.style.height = `${h}px`;
  return el;
}

/**
 * **S8 (FWD-1):** פס כותרת חוצה־טורים — שורות הכותרת שנמדדו ברוחב מלא,
 * מרונדרות בפס עליון חוצה־טורים מעל שני הטורים.
 */
function renderSpanningBand(page, settings, doc) {
  if (!page.spanning || !page.spanning.lines.length) return null;
  const band = doc.createElement('div');
  band.className = 'spanning-band';
  band.dir = 'rtl';
  // **S11 (REQ-PAR-06):** פס callout מסגנון מותאם — class + סגנון מובנה (full-width).
  if (page.spanning.customStyle) {
    band.className += ' custom-style';
    band.dataset.style = page.spanning.customStyle.id || '';
    applyCustomStyleSpec(band, page.spanning.customStyle.styleSpec, doc);
    if (page.spanning.customStyle.counterMark) {
      const cm = doc.createElement('span');
      cm.className = 'cs-counter';
      cm.textContent = page.spanning.customStyle.counterMark;
      prependChild(band, cm);
    }
  }
  const spanTop = page.template.contentBox.top;
  band.style.top = `${spanTop}px`;
  band.style.height = `${page.spanning.heightPx}px`;
  const left = Math.min(...page.template.columns.map(c => c.x));
  const right = Math.max(...page.template.columns.map(c => c.x + c.w));
  band.style.left = `${Math.round(left)}px`;
  band.style.width = `${Math.round(right - left)}px`;
  for (const ln of page.spanning.lines) band.appendChild(renderLine(ln, doc, settings));
  return band;
}

/**
 * **S8 (REQ-ORN-01..04):** כל העיטורים נציירים מה־rect שחושב בפאס העיטורים
 * (ornament-plan) — הרנדרר לא קובע ממדים משלו (F-09: מקור שליטה יחיד).
 */
function renderDecorations(page, doc) {
  const els = [];
  for (const d of (page.decorations || [])) {
    const el = doc.createElement('div');
    el.className = d.cssClass || 'orn';
    el.dataset.slot = d.slot || '';
    el.dataset.kindStyle = d.kindStyle || '';
    el.style.left = `${Math.round(d.x)}px`;
    el.style.top = `${Math.round(d.y)}px`;
    el.style.width = `${Math.round(d.w)}px`;
    el.style.height = `${Math.round(d.h)}px`;
    // **03.11 (EXT-14):** עיטור מסוג 'image' — רקע מההפניה הפתורה (asset-registry)
    if (d.image) {
      const uri = assetUri(d.image);
      if (uri) {
        el.style.backgroundImage = `url("${uri}")`;
        el.style.backgroundSize = '100% 100%';
        el.style.backgroundRepeat = 'no-repeat';
      }
    }
    els.push(el);
  }
  return els;
}

/** **03.11 (EXT-14):** פתרון נכס — הפניות imud: מתורגמות ל-data-URI מהרישום
 * (asset-registry); ערכים אחרים (URL/data-URI קיים) עוברים כמו שהם. */
function assetUri(ref) {
  if (!ref) return null;
  const r = resolveAssetRef(ref);
  return r.uri || null;
}

/**
 * **S8 (REQ-ORN-05/08):** רקע עמוד + תיבות שער לפי התוכנית שחושבה (page-decorations)
 * — רקע לפי מחלקת העמוד עם inset במ״מ; תיבת טקסט של שער ראשי לפי box פתור.
 * **03.11 (EXT-14):** שלושת השערים (ראשי/משנה/אחורי) — עיצוב ה־SVG במסך מלא +
 * תיבת כותרת מה-box של העיצוב (רישום נכסים) או מההגדרות.
 */
function renderPageBackgroundAndShaar(page, settings, doc, metadata) {
  const els = [];
  const plan = planDecorations(page, settings);
  const inset = plan.background ? plan.background.insetPx : 0;
  if (plan.background && plan.background.image) {
    const el = doc.createElement('div');
    el.className = 'deco deco--page-background';
    el.style.backgroundImage = `url("${assetUri(plan.background.image) || plan.background.image}")`;
    el.style.inset = `${inset}px`;
    els.push(el);
  }
  if (plan.background && plan.background.texture) {
    const el = doc.createElement('div');
    el.className = 'deco deco--page-texture';
    el.style.backgroundImage = `url("${assetUri(plan.background.texture) || plan.background.texture}")`;
    els.push(el);
  }
  // עזר: שער במסך מלא מהפניה פתורה + תיבת כותרת לפי box מהעיצוב (אם נרשם)
  const fullShaar = (slotName, cssClass, boxClass) => {
    const slot = plan.slots.find(s => s.slot === slotName && s.asset);
    if (!slot) return;
    const resolved = resolveAssetRef(slot.asset);
    const uri = resolved.uri || slot.asset;
    const bg = doc.createElement('div');
    bg.className = cssClass;
    bg.style.backgroundImage = `url("${uri}")`;
    bg.style.inset = '0';
    els.push(bg);
    // תיבת כותרת — מה-box של העיצוב ברישום (מ״מ) או מההגדרות; בלי box מהעיצוב —
    // ה-fallback המסורתי של resolveShaarBox (REQ-ORN-05: התיבה תמיד נבנית על שער עם תמונה)
    const designBox = resolved.item && resolved.item.box ? resolved.item.box : null;
    const boxRef = designBox || settings['shaar-main-box'] || null;
    {
      const { box } = resolveShaarBox('main', settings['theme-set-id'] || 'default', { box: boxRef }, null, { top: 40, bottom: 40, right: 30, left: 30 });
      const tb = doc.createElement('div');
      tb.className = boxClass;
      tb.dir = 'rtl';
      tb.style.top = `${Math.round(box.top * MM_TO_PX)}px`;
      tb.style.bottom = `${Math.round(box.bottom * MM_TO_PX)}px`;
      tb.style.left = `${Math.round(box.left * MM_TO_PX)}px`;
      tb.style.right = `${Math.round(box.right * MM_TO_PX)}px`;
      const bookName = (settings['imud-book-title'] || (metadata && (metadata['שם הספר'] || metadata['ספר'] || metadata['title']))) || ''; // S4.5: גם המזהה הארוך + על
      const topic = (settings['imud-book-subtitle'] || (metadata && (metadata['נושא מפורט'] || metadata['נושא']))) || ''; // 03.11: כותרת־משנה מוגדרת
      tb.textContent = [bookName, topic].filter(Boolean).join(' · ');
      els.push(tb);
    }
  };
  fullShaar('shaar-main', 'deco deco--shaar-main', 'shaar-main-box');
  fullShaar('shaar-sub', 'deco deco--shaar-sub', 'shaar-sub-box');
  fullShaar('shaar-back-frame', 'deco deco--shaar-back', 'shaar-back-box');
  return els;
}

/**
 * **S8 (PT-09):** עמוד מותאם — תוכן קבוע/תיבות/תמונות במיקומים שהוגדרו (מ״מ→פיקסלים).
 */
function renderCustomPageContent(page, doc) {
  const els = [];
  if (!page.custom) return els;
  for (const b of (page.custom.boxes || [])) {
    const el = doc.createElement('div');
    el.className = 'custom-box';
    el.dir = 'rtl';
    el.style.left = `${b.x}px`; el.style.top = `${b.y}px`;
    el.style.width = `${b.w}px`; el.style.height = `${b.h}px`;
    el.textContent = scrubPUAText(b.text || '');
    els.push(el);
  }
  for (const im of (page.custom.images || [])) {
    const el = doc.createElement('div');
    el.className = 'custom-image';
    el.style.left = `${im.x}px`; el.style.top = `${im.y}px`;
    el.style.width = `${im.w}px`; el.style.height = `${im.h}px`;
    el.style.backgroundImage = `url("${im.src}")`;
    els.push(el);
  }
  return els;
}

/** **03.11(ד) — תוכן מובנה של עמודי השער (פורט renderMainShaar/renderSubShaar/
 * renderBackShaar של המקור). המודל (בלוקים/תיבה/פריסה) חי ב-shaar-content.js —
 * מקור יחיד שצורך גם ההיטל ל-PDF (F-09); כאן רק ההקרנה ל-DOM.
 * עד כאן עמוד שער בלי עיצוב־תמונה היה עמוד ריק לגמרי — "אין עמודי שער"
 * מבחינת המשתמש. המבנה, התיבות והגדלים נאמנים למקור. */
function renderShaarContent(page, settings, doc, metadata) {
  const model = buildShaarBlocks(page, settings, metadata);
  if (!model) return [];
  const els = [];
  const px = (pt) => `${ptToPx(pt)}px`;

  const wrap = doc.createElement('div');
  const variant = page.type === 'shaar-main' ? 'main' : page.type === 'shaar-sub' ? 'sub' : 'back';
  wrap.className = `shaar-content shaar-content--${variant}`;
  wrap.dir = 'rtl';
  wrap.style.top = `${model.box.top}px`;
  wrap.style.bottom = `${model.box.bottom}px`;
  wrap.style.right = `${model.box.right}px`;
  wrap.style.left = `${model.box.left}px`;

  for (const b of model.blocks) {
    if (b.graphic) {
      const el = doc.createElement('div');
      el.className = 'shaar-crown';
      el.innerHTML = b.graphic === 'crown-sub'
        ? '<svg viewBox="0 0 300 30"><path d="M10,15 Q75,5 140,15 Q145,10 150,5 Q155,10 160,15 Q225,5 290,15 Q225,25 160,15 Q155,20 150,25 Q145,20 140,15 Q75,25 10,15 Z" fill="#222"/></svg>'
        : '<svg viewBox="0 0 400 40"><circle cx="200" cy="20" r="10" fill="none" stroke="#000" stroke-width="4.5"/><circle cx="200" cy="20" r="4.5" fill="#000"/><path d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z" fill="#000"/><path d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z" fill="#000"/></svg>';
      wrap.appendChild(el);
      continue;
    }
    const el = doc.createElement('div');
    el.className = b.cls;
    el.dir = 'rtl';
    const fam = shaarFontOf(b.cls, settings);
    if (fam) el.style.fontFamily = fontStack(fam);
    if (b.sizePt > 0) el.style.fontSize = px(b.sizePt);
    if (b.bold) el.style.fontWeight = '700';
    if (b.letterSpacingPx) el.style.letterSpacing = `${b.letterSpacingPx}px`;
    el.textContent = scrubPUAText(String(b.text == null ? '' : b.text));
    wrap.appendChild(el);
  }
  els.push(wrap);
  return els;
}

/**
 * רנדור עמוד שלם. @param {object} page - תוצר dp-planner + header + numbersByIndex
 * **03.11(ד):** header ברירת מחדל = page.header — הצינור מחשב ומצמיד כותרת עליונה
 * לכל עמוד (pipeline), וכל קורא שלא מעביר ארגומנט מקבל אותה אוטומטית. עד כאן
 * התצוגה החיה (preview-tab) לא העבירה כלום והייצוא העביר מטא־נתונים בטעות —
 * שני הנתיבים הציגו עמודים בלי כותרת עליונה בזמן שהבדיקות העבירו את הארגומנט
 * במפורש ולא תפסו את הנתק (דיווח משתמש 3: "אין כותרות עליונות").
 */
function renderPage(page, settings, doc, header) {
  if (header == null && page && page.header) header = page.header;
  if (!page.template) {
    // עמודי הערות שלא חוברו לרצף המספור — תבנית ברירת מחדל חוקית (A4) במקום קריסה
    page.template = { width: 794, height: 1123, columns: [], margins: { top: 40, bottom: 40, side: 60, outer: 60 }, contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0, counts: false, numbered: false, hasRunningHead: false };
  }
  const root = doc.createElement('article');
  root.className = PT_CLASS[page.type] || 'page';
  root.dataset.pageIndex = String(page.index);
  // **S9 (REQ-HDR-05):** עוגן עמוד — יעד לקישורי תוכן־העניינים הלחיצים (#page-N)
  root.setAttribute('id', `page-${page.index}`);
  if (page.template.width != null) root.style.width = `${page.template.width}px`;
  if (page.template.height != null) root.style.height = `${page.template.height}px`;
  root.dir = 'rtl';
  // **03.11(ג):** גופן/גודל הגוף על שורש העמוד — התצוגה והייצוא יחד מגיבים
  // להגדרות body-font/body-font-size-pt (השורות דורסות לפי סוגן — כותרות וכו').
  const bf = settings['body-font'];
  if (bf) root.style.fontFamily = fontStack(bf);
  const bsPt = Number(settings['body-font-size-pt']);
  if (Number.isFinite(bsPt) && bsPt > 0) root.style.fontSize = `${ptToPx(bsPt)}px`;

  // key: background-color / background-opacity — rgba אמיתי (P0-5)
  const bg = settings['background-color'];
  const bgOp = settings['background-opacity'];
  if (bg && bg !== '#ffffff') root.style.backgroundColor = bgRgba(bg, bgOp != null ? bgOp : 1);
  else if (Number.isFinite(bgOp) && bgOp < 1) root.style.backgroundColor = bgRgba('#ffffff', bgOp);

  // **עמודי הערות (S7.1.1):** כותרת + רשימת הערות; אין כותרת עליונה/טורי גוף
  if (page.type === 'endnotes') {
    if (page.heading) {
      const h = doc.createElement('h2');
      h.className = 'endnote-title';
      h.dir = 'rtl';
      h.textContent = scrubPUAText(page.heading);
      root.appendChild(h);
    }
    const list = doc.createElement('div');
    list.className = 'endnote-list';
    for (const n of page.notes || []) {
      const el = doc.createElement('div');
      el.className = 'endnote-note';
      el.dir = 'rtl';
      el.textContent = `${n.marker || ''}\u200F ${scrubPUAText(n.text || '')}`;
      list.appendChild(el);
    }
    root.appendChild(list);
    const folioEn = renderFolio(page, settings, doc);
    if (folioEn) root.appendChild(folioEn);
    return root;
  }

  // **S8 (REQ-ORN-05/08):** רקעים/ערכות/תיבות שער — שכבות תשתית לפני התוכן
  for (const el of renderPageBackgroundAndShaar(page, settings, doc, page._metadata)) root.appendChild(el);

  // **03.11(ד):** תוכן מובנה של עמודי השער (בס״ד/כותרת/כתר/תיאור/מחבר/שנה —
  // פורט המקור). בלי זה עמוד שער ללא עיצוב־תמונה היה ריק לחלוטין.
  for (const el of renderShaarContent(page, settings, doc, page._metadata)) root.appendChild(el);

  // **S9 (REQ-HDR-05):** עמודי תוכן־עניינים — שורות + נקודות + עוגנים; אין טורי גוף
  // **03.11(ד):** כותרת עליונה גם בעמודי התוכן־עניינים — כמקור
  // (renderPaginatedTOC מרנדר top-header-grid בכל עמודי התוכן).
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    const hToc = renderHeader(header, doc);
    if (hToc) root.appendChild(hToc);
    for (const el of renderTocPageContent(page, doc)) root.appendChild(el);
    const folioToc = renderFolio(page, settings, doc);
    if (folioToc) root.appendChild(folioToc);
    return root;
  }

  // **S8 (PT-09):** עמוד מותאם — תוכן קבוע; אין טורים/כותרת עליונה
  if (page.type === 'custom') {
    for (const el of renderCustomPageContent(page, doc)) root.appendChild(el);
    const folioC = renderFolio(page, settings, doc);
    if (folioC) root.appendChild(folioC);
    return root;
  }

  const h = renderHeader(header, doc);
  if (h) root.appendChild(h);

  // **S8 (FWD-1):** פס כותרת חוצה־טורים מעל הטורים (H2 full-width)
  const band = renderSpanningBand(page, settings, doc);
  if (band) root.appendChild(band);

  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  const spanOffset = page.spanning ? page.spanning.heightPx : 0; // הטורים מתחילים מתחת לפס
  page.columns.forEach((colLines, ci) => {
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    colEl.style.left = `${page.template.columns[ci] ? page.template.columns[ci].x : 0}px`;
    colEl.style.width = `${page.template.columns[ci] ? page.template.columns[ci].w : 'auto'}px`;
    colEl.style.top = `${page.template.contentBox.top + spanOffset}px`;
    colEl.style.height = `${Math.max(0, page.template.contentBox.height - spanOffset)}px`;
    for (const ln of colLines) colEl.appendChild(renderLine(ln, doc, settings));
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  // חוט מפריד בין טורים (overlay — אחרי הטורים, לא מזיז שום דבר)
  const divider = renderColumnDivider(page, settings, doc);
  if (divider) root.appendChild(divider);

  const fn = renderFootnoteArea(page, settings, doc);
  if (fn) root.appendChild(fn);

  const folioMain = renderFolio(page, settings, doc);
  if (folioMain) root.appendChild(folioMain);

  // **S8 (REQ-ORN-01..04):** עיטורים — ציור מה־rectים בלבד (F-09 מקור יחיד)
  for (const el of renderDecorations(page, doc)) root.appendChild(el);

  // הערות צד: מיקום מוחלט לפי ה‑placement (S7.1.2) — anchor לפסקה המארחת
  for (const sn of page.sideNotes || []) {
    const el = doc.createElement('aside');
    el.className = 'side-note' + (sn.isCustomStyle ? ' side-note--custom' : '');
    if (sn.isCustomStyle) el.dataset.style = sn.isCustomStyle;
    el.dataset.anchor = sn.anchorToken || '';
    el.dir = 'rtl';
    if (sn.yTop != null) el.style.top = `${Math.round(sn.yTop)}px`;
    if (sn.x != null) {
      el.style.left = `${Math.round(sn.x)}px`;
      el.style.right = 'auto';
    }
    if (sn.colWidth) el.style.width = `${sn.colWidth}px`;
    el.textContent = (sn.counterMark ? `${sn.counterMark} ` : '') + scrubPUAText(sn.text);
    root.appendChild(el);
  }
  return root;
}

module.exports = { renderPage, renderLine, scrubPUAText, bgRgba, PT_CLASS, renderSpanningBand, renderDecorations, renderPageBackgroundAndShaar, renderShaarContent, renderCustomPageContent, applyCustomStyleSpec, fontStack };

};
__modules["src/engine/decoration/page-decorations.js"] = function (require, module, exports) {
// src/engine/decoration/page-decorations.js — Theme/shaar/background box placement (S6, REQ-ORN-06/08, PT-03)
'use strict';

/**
 * מקום יחיד שבו מלוי עיטורי־דף נקבע: ערכת נושא, שערים (ראשי/משנה/אחורי),
 * ורקעים לפי סוג דף. אין פיצול ל‑"shaar boxes" נפרד — מנגנון אחד, צרכן אחד.
 *
 * עקרונות נגד באגי העבר (מ‑Gold/Green/Orange):
 * - D-11: אין הצטברות עיטורים; כל תבנית מקבלת מקום אחד בלבד לכל מלוי.
 * - F-09: אין !important; השליטה רק דרך מחלקות + inline שנכתב מכאן.
 * - PT-03: ארבעת מקטעי shaar_back הם עצמאיים — כל אחד נכבה בנפרד.
 *
 * **S8 (REQ-ORN-08):** פאנל רקעים מוזג לתוך פאנל נושאים — 3 סוגי עמודים
 * (רגיל / פתיחת הקדמה / פתיחת סימן); color/texture/image + opacity; insets במ"מ.
 */

/** 4 המקטעים העצמאיים של שער אחורי (PT-03). */
const SHAAR_BACK_SEGMENTS = ['frame', 'title-box', 'body-box', 'footer-ornament'];

/** 3 סוגי העמודים לרקעים (REQ-ORN-08). */
const BACKGROUND_PAGE_CLASSES = ['regular', 'preface-open', 'sign-open'];

const { MM_TO_PX } = require('../layout/page-templates');

/** תנאי התאמת סוג־עמוד למחלקת רקע. */
function backgroundClassForPage(page) {
  if (page.type === 'preface' && page.chapterOpening) return 'preface-open';
  if (page.type === 'sign-open') return 'sign-open';
  return 'regular';
}

/**
 * החלטת רקע לפי מחלקת העמוד (REQ-ORN-08): הרקע שהוגדר למחלקה שאליה
 * העמוד שייך בלבד. inset במ"מ מומר לפיקסלים כאן — מקור יחיד.
 * @returns {{image:string|null, texture:string|null, insetPx:number}|null}
 */
function planBackground(page, settings) {
  const cls = backgroundClassForPage(page);
  const target = settings['background-page-type'] || 'regular';
  if (cls !== target) return null; // הרקע שייך למחלקה אחרת
  const image = settings['background-image'] || null;
  const texture = settings['background-texture'] || null;
  if (!image && !texture) return null;
  const insetMm = Math.max(0, Number(settings['background-inset-mm']) || 0);
  return { image, texture, insetPx: Math.round(insetMm * MM_TO_PX) };
}

/**
 * החלטת מלוי לעימוד דף — פונקציה טהורה (ללא DOM), דטרמיניסטית.
 * @param {object} page - { type: 'regular'|'shaar-main'|'shaar-sub'|'shaar-back'|... , index }
 * @param {object} settings - registry defaults+user
 * @returns {{ slots: Array<{slot:string, asset:string|null, cssClass:string}>, themeSetId:string, background:object|null }}
 */
function planDecorations(page, settings) {
  const themeSetId = settings['theme-set-id'] || 'default';
  const slots = [];

  // **S4.5/EXT-14 (03.11):** הפניות עיצובי IMUD — מזהי הספרייה גוברים על השדות
  // הישנים (הפניה imud:<collection>:<id> נפתרת ברינדור דרך asset-registry).
  // צריכה מפורשת כאן — גם ערכת נושא נחשבת פעילה כשנבחר עיצוב ספרייה.
  const imudMain = settings['imud-shaar-main'] || '';
  const imudSub = settings['imud-shaar-sub'] || '';
  const imudBack = settings['imud-shaar-back'] || '';

  const push = (slot, asset, modifier) => {
    // הגנה D-11: slot תפוס כבר → לא מוסיפים שוב
    if (slots.some(s => s.slot === slot)) return;
    slots.push({
      slot,
      asset: asset || null,
      cssClass: `deco deco--${slot}${modifier ? ` ${modifier}` : ''}${asset ? '' : ' deco--empty'}`
    });
  };

  switch (page.type) {
    case 'shaar-main': {
      const img = imudMain || settings['shaar-main-image'];
      push('shaar-main', img, 'deco--themed');
      break;
    }
    case 'shaar-sub': {
      push('shaar-sub', imudSub || settings['shaar-sub-image'] || null, 'deco--themed');
      break;
    }
    case 'shaar-back': {
      // PT-03: אם הכבה ראשית — אף מקטע לא מוצב; אחרת 4 מקטעים עצמאיים.
      // **03.11 (EXT-14):** מקטע המסגרת מקבל את תמונת השער האחורי (עיצוב IMUD) —
      // שאר המקטעים נשארים ריקים (ממולאים ע"י העיצוב עצמו, לא בנפרד).
      if (settings['shaar-back-enabled'] !== false) {
        const backImg = imudBack || settings['shaar-back-image'] || null;
        for (const seg of SHAAR_BACK_SEGMENTS) push(`shaar-back-${seg}`, seg === 'frame' ? backImg : null, 'deco--segment');
      }
      break;
    }
    default: {
      // regular / preface / sign-open …: רקע לפי מחלקת העמוד (REQ-ORN-08)
      const bg = planBackground(page, settings);
      if (bg && bg.image) push('page-background', bg.image, 'deco--background');
      if (bg && bg.texture) push('page-texture', bg.texture, 'deco--texture');
      break;
    }
  }

  return { slots, themeSetId, background: planBackground(page, settings) };
}

/**
 * החלת התוכנית על דם־DOM (אלמנט השורש של הדף). נקי: מוחק קודם, מציב פעם אחת.
 * @param {object} rootEl - article.page
 * @param {object} doc - document
 * @param {Array} slots - מתוצר planDecorations
 */
function applyDecorationSlots(rootEl, doc, slots) {
  // ניקוי מקומי — מונע כפילויות בין ריצות (rollback-aware)
  for (const old of Array.from(rootEl.querySelectorAll('.deco'))) old.remove();
  for (const s of slots) {
    if (!s.asset) continue; // deco--empty נשמר לתיעוד בלבד, לא יוצר node
    const el = doc.createElement('div');
    el.className = s.cssClass;
    el.dataset.slot = s.slot;
    el.style.backgroundImage = `url("${s.asset}")`;
    rootEl.appendChild(el);
  }
}

module.exports = {
  planDecorations, applyDecorationSlots, planBackground, backgroundClassForPage,
  SHAAR_BACK_SEGMENTS, BACKGROUND_PAGE_CLASSES
};

};
__modules["src/engine/decoration/shaar-boxes.js"] = function (require, module, exports) {
// src/engine/decoration/shaar-boxes.js — Shaar text-box geometry: drag/resize/persist/export (REQ-ORN-05)
'use strict';

/**
 * תיבות טקסט של שערים (PT-01/02/03): גרירה + שינוי גודל + שמירה לפי מזהה שער
 * + הטמעת `box` בייצוא JSON (V4) — עגול־שלם: ייצוא → טעינה מחדש ⇒ מיקומים זהים.
 *
 * **לקחי עבר שננעלו כאן:**
 * - שמירה לפי **מזהה שער פרטני** ולא לפי סוג (בגרסה מוקדמת הוחל מיקום אחד על כל
 *   השערים מהסוג — Handoff §2.13).
 * - סדר קדימויות לפתרון מיקום: (1) שדה `box` מוטמע ב־JSON, (2) מיקום שמור בסשן,
 *   (3) ברירת מחדל — בדיוק כסדר של V4.
 * - מיקום במ"מ (שלם) — דטרמיניסטי בעיגול־שלם; אין נקודה־צפה מתפזרת בין ריצות.
 */

/**
 * פתרון מיקום תיבה לפי סדר הקדימויות של V4 (§2.13).
 * @param {string} type - 'main' | 'sub' | 'back'
 * @param {string} shaarId - מזהה שער פרטני (ייחודי — theme-sets.uniqueShaarId)
 * @param {object} item - פריט השער (עשוי להכיל box מוטמע)
 * @param {object} savedPositions - { [type]: { [shaarId]: box } } מיקומים שמורים
 * @param {object} dfltBox - ברירת מחדל {top,bottom,right,left} במ"מ
 * @returns {{box:object, source:'json'|'saved'|'default'}}
 */
function resolveShaarBox(type, shaarId, item, savedPositions, dfltBox) {
  if (item && item.box && isValidBox(item.box)) return { box: normalizeBox(item.box), source: 'json' };
  const saved = savedPositions && savedPositions[type] && savedPositions[type][shaarId];
  if (saved && isValidBox(saved)) return { box: normalizeBox(saved), source: 'saved' };
  return { box: normalizeBox(dfltBox || { top: 40, bottom: 40, right: 30, left: 30 }), source: 'default' };
}

/** תקינות תיבה: ארבעה שוליים מספריים אי־שליליים. */
function isValidBox(b) {
  return Boolean(b) && ['top', 'bottom', 'right', 'left'].every(k => Number.isFinite(Number(b[k])) && Number(b[k]) >= 0);
}

/** נרמול למ"מ שלמים — דטרמיניזם של עיגול־שלם בעיגול־חוזר. */
function normalizeBox(b) {
  return {
    top: Math.round(Number(b.top)), bottom: Math.round(Number(b.bottom)),
    right: Math.round(Number(b.right)), left: Math.round(Number(b.left))
  };
}

/**
 * הצמדה לגבולות העמוד (גרירה/שינוי גודל לא יוצאים מהדף).
 * @param {object} box - {top,bottom,right,left} במ"מ
 * @param {number} pageWmm, pageHmm - ממדי העמוד במ"מ
 */
function clampShaarBox(box, pageWmm, pageHmm) {
  const b = normalizeBox(box);
  const maxInsetX = Math.max(0, Math.floor(pageWmm / 2) - 5); // תיבה שומרת רוחב מינימלי 10mm
  const maxInsetY = Math.max(0, Math.floor(pageHmm / 2) - 5);
  b.top = Math.min(Math.max(0, b.top), maxInsetY);      // לא שלילי ולא מעבר לחצי
  b.bottom = Math.min(Math.max(0, b.bottom), maxInsetY);
  b.right = Math.min(Math.max(0, b.right), maxInsetX);
  b.left = Math.min(Math.max(0, b.left), maxInsetX);
  return b;
}

/**
 * גרירה: הזזת כל ארבעת השוליים בהפרש (תיבה שומרת על גודלה).
 * שמירה לפי (type, shaarId) — מזהה פרטני (לקח V4: לא לפי סוג!).
 * @returns {object} savedPositions חדש (לא מוטציה במקום — רולבק־סייפ)
 */
function moveShaarBox(savedPositions, type, shaarId, dxMm, dyMm, pageWmm, pageHmm) {
  const next = cloneSaved(savedPositions);
  const cur = (next[type] && next[type][shaarId]) || { top: 40, bottom: 40, right: 30, left: 30 };
  next[type] = next[type] || {};
  next[type][shaarId] = clampShaarBox({
    top: cur.top + dyMm, bottom: cur.bottom - dyMm,
    right: cur.right - dxMm, left: cur.left + dxMm
  }, pageWmm, pageHmm);
  return next;
}

/**
 * שינוי גודל דרך ידית (8 ידיות V4): n/s/e/w/ne/nw/se/sw.
 * @returns {object} savedPositions חדש
 */
function resizeShaarBox(savedPositions, type, shaarId, handle, dxMm, dyMm, pageWmm, pageHmm) {
  const next = cloneSaved(savedPositions);
  const cur = (next[type] && next[type][shaarId]) || { top: 40, bottom: 40, right: 30, left: 30 };
  const b = { ...cur };
  if (handle.includes('n')) b.top += dyMm;
  if (handle.includes('s')) b.bottom -= dyMm;
  if (handle.includes('w')) b.left += dxMm;   // RTL: left גדל כשגוררים שמאלה→ימין? — כיוון לפי ציר X החיובי
  if (handle.includes('e')) b.right -= dxMm;
  next[type] = next[type] || {};
  next[type][shaarId] = clampShaarBox(b, pageWmm, pageHmm);
  return next;
}

function cloneSaved(savedPositions) {
  const out = {};
  for (const [t, byId] of Object.entries(savedPositions || {})) {
    out[t] = {};
    for (const [id, box] of Object.entries(byId || {})) out[t][id] = normalizeBox(box);
  }
  return out;
}

/**
 * ייצוא פריטי שער עם `box` מוטמע (exportShaarJSONWithPositions — פורט V4):
 * המיקום ששרד בסשן נחרת בקובץ ⇒ עיגול־שלם טעינה→הזזה→ייצוא→טעינה ⇒ מיקומים זהים.
 * אין אקראיות (מדיניות zero-randomness): id נגזר דטרמיניסטית מאינדקס+שם.
 */
function exportShaarItemsWithPositions(items, savedPositions) {
  return (items || []).map((it, i) => {
    const id = it.id || `shaar-${i}-${String(it.name || 'anon').replace(/\s+/g, '-').slice(0, 24)}`;
    const type = it.type || it.role || 'main';
    const saved = savedPositions && savedPositions[type] && savedPositions[type][id];
    return { ...it, id, box: normalizeBox(saved || it.box || { top: 40, bottom: 40, right: 30, left: 30 }) };
  });
}

/** השוואת תיבות בודדות (עיגול־שלם) או מפות מיקומים {id: box} — בדיקת שער S8.2. */
function boxPositionsIdentical(a, b) {
  const isSingle = (x) => x && Number.isFinite(Number(x.top)) && Number.isFinite(Number(x.left));
  if (isSingle(a) || isSingle(b)) {
    if (!isSingle(a) || !isSingle(b)) return false;
    const x = normalizeBox(a), y = normalizeBox(b);
    return x.top === y.top && x.bottom === y.bottom && x.right === y.right && x.left === y.left;
  }
  const keys = Object.keys(a || {}).sort();
  const keysB = Object.keys(b || {}).sort();
  if (keys.join(',') !== keysB.join(',')) return false;
  for (const k of keys) {
    const x = normalizeBox(a[k]), y = normalizeBox(b[k]);
    if (x.top !== y.top || x.bottom !== y.bottom || x.right !== y.right || x.left !== y.left) return false;
  }
  return true;
}

module.exports = {
  resolveShaarBox, isValidBox, normalizeBox, clampShaarBox, moveShaarBox, resizeShaarBox,
  exportShaarItemsWithPositions, boxPositionsIdentical
};

};
__modules["src/engine/output/line-font.js"] = function (require, module, exports) {
// src/engine/output/line-font.js — מפרט גופן/גודל של שורה לפי סוגה (03.11(ג))
'use strict';

/**
 * **מקור יחיד** לגודל/גופן של שורה לפי סוגה — נצרך גם על ידי geometry-projector
 * (הקרנת PDF) וגם על ידי dom-renderer (תצוגה חיה + ייצוא HTML). בעבר הפרויקטור
 * ידע לחשב את גודל הכותרת אך ה-DOM לא — והתצוגה הציגה כותרות בגודל הגוף
 * והתעלמה מהחלפת גופן הגוף (דיווח משתמש 03.11: "ניסיתי להחליף גופן, בתצוגה
 * לא השתנה כלום").
 */

/** גודל גופן (pt) של שורה לפי סוגה (מקור: מפתחות heading-N-size-pt של הרישום). */
function lineFontSizePt(ln, settings) {
  if (ln && ln.kind === 'heading') {
    const s = settings[`heading-${ln.level}-size-pt`];
    return s || settings['body-font-size-pt'];
  }
  return settings['body-font-size-pt'];
}

/** משפחת גופן של שורה לפי סוגה (heading-N-font; ריק ⇒ גופן הגוף). */
function lineFontFamily(ln, settings) {
  if (ln && ln.kind === 'heading') {
    const f = settings[`heading-${ln.level}-font`];
    if (f) return f;
  }
  return settings['body-font'] || '';
}

/** pt → px (96/72) עם עיגול יציב (אותו נוסח בכל הנתיבים). */
function ptToPx(pt) {
  return Math.round(Number(pt) * (96 / 72) * 100) / 100;
}

module.exports = { lineFontSizePt, lineFontFamily, ptToPx };

};
__modules["src/engine/output/shaar-content.js"] = function (require, module, exports) {
// src/engine/output/shaar-content.js — מודל תוכן עמודי השער (03.11(ד))
'use strict';

/**
 * **מקור יחיד (F-09) לתוכן המובנה של עמודי השער** — פורט renderMainShaar/
 * renderSubShaar/renderBackShaar של הפרויקט המקורי. נצרך על ידי שני הנתיבים:
 * dom-renderer (תצוגה חיה + ייצוא HTML) ו-geometry-projector (ייצוא PDF) —
 * כך שהשער נראה אותו דבר בכל הפלטים (עד כאן ההיטל לא כלל את תוכן השער
 * וה־PDF הראה עמודים ריקים).
 *
 * המודל: תיבה (מ"מ של המקור) + רשימת בלוקים (טקסט/גודל/משקל) + אופן פריסה:
 * 'between' = flex space-between (שער ראשי: בס״ד למעלה, שנה למטה), 'center'
 * = flex ממורכז (שער־משנה/אחורי). העיטור (כתר) הוא בלוק גרפי ללא טקסט —
 * ה-DOM מצייר אותו; ההיטל מדלג (במקור לא היה ייצוא PDF כלל).
 */

const MM_TO_PX = 96 / 25.4;

/** תיבת השער לפי הסוג — מיקומי המקור (מ"מ → פיקסלים). */
function shaarBoxOf(type) {
  const mm = (v) => Math.round(v * MM_TO_PX);
  if (type === 'shaar-main') {
    return { top: mm(20), bottom: mm(16), right: mm(15), left: mm(15), mode: 'between' };
  }
  if (type === 'shaar-sub') {
    return { top: mm(20), bottom: mm(20), right: mm(95), left: mm(15), mode: 'center' };
  }
  // shaar-back
  return { top: mm(22), bottom: mm(18), right: mm(15), left: mm(95), mode: 'center' };
}

/** פיצול מקף של כותרת חלק (renderSubShaar המקורי): main=לפני, sub=אחרי. */
function splitPartTitle(text) {
  let titleMain = String(text || '');
  let titleSub = '';
  if (/[-–—]/.test(titleMain)) {
    const parts = titleMain.split(/[-–—]/);
    titleMain = parts[0].trim();
    titleSub = parts.slice(1).join(' - ').trim();
  }
  return { titleMain, titleSub };
}

/**
 * בניית בלוקי תוכן השער. גישה מילולית להגדרות (דרישת סורק ה-phantom-key).
 * @param {object} page - עמוד CP5 (shaarInfo.title לשער־משנה, _metadata למטא)
 * @param {object} settings
 * @param {object} [metadata] - מטא המסמך (גובר _metadata)
 * @returns {{mode:string, box:object, blocks:Array<{cls,text,sizePt,bold,graphic}>}|null}
 */
function buildShaarBlocks(page, settings, metadata) {
  if (!page || !page.type || !/^shaar-/.test(page.type)) return null;
  const meta = metadata || page._metadata || {};
  const bookTitle = settings['imud-book-title'] || meta['שם הספר'] || meta['ספר'] || meta['title'] || 'שם הספר';
  const subtitle = settings['imud-book-subtitle'] || meta['נושא'] || '';
  const desc = settings['imud-book-desc'] || meta['נושא מפורט'] || '';
  const sections = settings['imud-book-sections'] || meta['פרטי מהדורא'] || '';
  const author = settings['imud-book-author'] || meta['שם המחבר'] || '';
  const year = settings['imud-book-year'] || meta['מקום ושנת הוצאה'] || '';
  const backRaw = settings['shaar-back-text'] || meta['שמירת זכויות'] || 'כל הזכויות שמורות למחבר.';

  const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 12; };
  const box = shaarBoxOf(page.type);
  const B = [];

  if (page.type === 'shaar-main') {
    B.push({ cls: 'bsd-header', text: 'בס״ד', sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 5 });
    B.push({ cls: 'book-title-main', text: bookTitle, sizePt: num(settings['shaar-title-size-pt']) });
    B.push({ cls: 'book-subtitle', text: subtitle, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true });
    B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-main' });
    B.push({ cls: 'book-description', text: desc, sizePt: num(settings['shaar-desc-size-pt']) });
    B.push({ cls: 'book-sections-summary', text: sections, sizePt: num(settings['shaar-sections-size-pt']), bold: true });
    B.push({ cls: 'author-block', text: author, sizePt: num(settings['shaar-author-size-pt']) });
    B.push({ cls: 'publication-footer', text: year, sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 1 });
  } else if (page.type === 'shaar-sub') {
    const { titleMain, titleSub } = splitPartTitle(page.shaarInfo && page.shaarInfo.title);
    B.push({ cls: 'book-title-main', text: titleMain, sizePt: 36 });
    if (titleSub) {
      B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-sub' });
      B.push({ cls: 'book-subtitle', text: titleSub, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true });
    }
  } else {
    B.push({ cls: 'book-title-main book-title-main--back', text: bookTitle, sizePt: 36 });
    const lines = String(backRaw).split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach((l, i) => B.push({
      cls: 'back-shaar-text-line', text: l,
      sizePt: i === 0 ? 13 : num(settings['shaar-back-text-size-pt']), bold: i === 0
    }));
    if (author) B.push({ cls: 'author-block', text: author, sizePt: num(settings['shaar-author-size-pt']) });
    if (year) B.push({ cls: 'publication-footer', text: year, sizePt: num(settings['shaar-year-size-pt']), bold: true });
  }
  return { mode: box.mode, box, blocks: B.filter(b => b.graphic || String(b.text || '').length) };
}

/** משפחות הגופן של הבלוקים — לפי ההגדרות (גישה מילולית לסורק). */
function shaarFontOf(cls, settings) {
  switch (true) {
    case cls.includes('bsd-header'):
    case cls.includes('publication-footer'): return settings['shaar-year-font'];
    case cls.includes('book-title-main'): return settings['shaar-title-font'];
    case cls.includes('book-subtitle'): return settings['shaar-subtitle-font'];
    case cls.includes('book-description'): return settings['shaar-desc-font'];
    case cls.includes('book-sections-summary'): return settings['shaar-sections-font'];
    case cls.includes('author-block'): return settings['shaar-author-font'];
    case cls.includes('back-shaar-text-line'): return settings['shaar-back-text-font'];
    default: return '';
  }
}

module.exports = { buildShaarBlocks, shaarBoxOf, shaarFontOf, splitPartTitle, MM_TO_PX };

};
__modules["src/engine/output/html-export.js"] = function (require, module, exports) {
// src/engine/output/html-export.js — Standalone HTML export + offline guard (REQ-EXP, Orange exit-7 doctrine)
'use strict';

/**
 * ייצוא HTML עצמאי: CSS מוטמע, ללא תלות רשת. offline-guard: כל הפניה חיצונית → דחייה (exit 7 במנוע CLI).
 * סימוני page-break (⏎) אינם מיוצאים לעולם (F-01).
 */

const OFFLINE_PATTERNS = [
  /https?:\/\/(?!localhost)/i,
  /@import\s+url\(/i,
  /<link[^>]+href=["']https?:/i,
  /<script[^>]+src=["']https?:/i
];

/** בדיקת offline-guard על מחרוזת HTML; זורק עם פירוט אם נמצאה בקשה חיצונית. */
function assertOfflineSafe(html) {
  const hits = [];
  for (const re of OFFLINE_PATTERNS) {
    const m = html.match(re);
    if (m) hits.push({ pattern: re.source, sample: html.slice(Math.max(0, m.index - 20), m.index + 60) });
  }
  if (hits.length) {
    const err = new Error(`offline-guard: external references found (${hits.length})`);
    err.code = 'ERR_OFFLINE_GUARD';
    err.exitCode = 7; // Orange doctrine
    err.hits = hits;
    throw err;
  }
}

const BASE_CSS = `
html,body{margin:0;background:#3a3a3a;font-family:'Frank Ruhl Libre','David',serif;direction:rtl}
.book{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}
.page{background:#fff;color:#000;box-shadow:0 2px 12px rgba(0,0,0,.45);position:relative;overflow:hidden;padding:0}
.columns{position:absolute;top:0;left:0;right:0;bottom:0}
.column{position:absolute;top:0;bottom:0}
.line{white-space:normal;text-align:justify;text-justify:inter-word}
.line--last{text-align:center}
.running-head{display:flex;width:100%}
.head--sep-gray{border-bottom:1px solid #999}
.head--sep-black{border-bottom:1.5px solid #000}
.footnotes{position:absolute;bottom:8px;left:12px;right:12px;border-top:1px solid transparent;font-size:.8em}
.footnotes--continuous{border-top:none}
.fn-rule--regular{border-top:1px solid #000;height:0}
.fn-rule--circles{border-top:3px dotted #000;height:0}
.fn-rule--sparkle{border-top:2px dashed #6b6b6b;height:0}
.fn-rule--star{border-top:3px double #4a4a4a;height:0}
.fn-rule--diamond{border-top:2px solid #000;height:0;transform:scaleX(.6)}
.fn--continuation{color:#555;font-style:italic}
.folio{position:absolute;bottom:4px;width:100%;text-align:center}
.folio--outer-left{left:8px;width:auto;text-align:left}
.folio--outer-right{right:8px;width:auto;text-align:right}
.folio--top{bottom:auto;top:4px}
.folio--in-header{bottom:auto;top:6px}
.page-num-badge{display:inline-flex;align-items:center;justify-content:center;padding:1px 4px;line-height:1}
.page-num-frame-circle{border:1.2px solid #333;border-radius:50%;min-width:22px;height:22px;padding:1px}
.page-num-frame-box{border:1.2px solid #333;border-radius:3px;min-width:22px;height:20px;padding:1px 4px}
.side-note{position:absolute;font-size:.75em;max-height:60%;overflow:hidden}
.col-divider{position:absolute;width:0;border-left:1px solid #999}
.col-divider--thin{border-left:1px solid #999}
.col-divider--dashed{border-left:1px dashed #999}
.col-divider--double{border-left:3px double #999}
.w--paren{color:#333}
.endnote-title{font-size:1.2em;font-weight:700;margin:8px 12px}
.endnote-list{font-size:.85em;padding:0 12px}
.endnote-note{margin:2px 0}
.toc-page-title{font-size:16pt;font-weight:700;margin:12px 18px 18px;text-align:center}
.toc-rows{position:absolute;top:70px;left:18px;right:18px;bottom:30px}
.toc-row{display:flex;align-items:baseline;text-decoration:none;color:inherit;gap:6px;margin:2px 0}
.toc-row .toc-dots{flex:1;border-bottom:1px dotted #000;min-width:24px;margin:0 6px 4px}
.toc-row .toc-label{min-width:30px;text-align:left}
.toc-row .toc-num{min-width:20px;color:#444}
.toc-lvl-1{font-size:12pt;font-weight:700}
.toc-lvl-2{font-size:11pt}
.toc-lvl-3{font-size:10.5pt;margin-right:16px}
.toc-lvl-4{font-size:10.5pt;margin-right:32px}
.toc-lvl-5{font-size:10.5pt;margin-right:48px}
.toc-lvl-6{font-size:10.5pt;margin-right:64px}
.toc-lvl-7{font-size:8.8pt;margin-right:80px;font-style:italic}
.toc-row--group{flex-wrap:wrap}
.toc-row--group .toc-item{display:inline-flex;gap:4px;text-decoration:none;color:inherit}
.toc-row--group .toc-item .grp-page{color:#333}
.toc-row--group .toc-item + .toc-item::before{content:'|';margin:0 6px;color:#777}
/* **03.11(ג) תיקון קטסטרופת התצוגה:** כללים שהיו חסרים — הטורים/הפסים/העיטורים
   ממוקמים ב-inline left/top/width/height ודורשים position:absolute גם בתצוגה
   החיה וגם בקובץ העצמאי. BASE_CSS הזה מוזרק גם לאפליקציה (browser-entry) —
   מקור שליטה יחיד לשני הנתיבים (F-09). */
.spanning-band{position:absolute}
.orn{position:absolute;background-repeat:no-repeat;background-position:center}
.shaar-main-box,.shaar-sub-box,.shaar-back-box{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:700;text-align:center;padding:0 8px}
.custom-box{position:absolute;overflow:hidden}
.custom-image{position:absolute;background-repeat:no-repeat;background-size:100% 100%}
.line--last-right{text-align:right}
.line--last-stretch{text-align:justify}
/* **03.11(ד) — יישור שורות הגוף לשני הצדדים כמו המקור:** .main-column/p במקור
   הם text-align:justify; text-justify:inter-word ("טורים מיושרים באופן מושלם").
   עד כאן היה text-align:right — שורה ברוחב טור מלא שהטקסט שלה קצר יותר השאירה
   חור בצד שמאל ונתנה מראה "דחוק לימין" (דיווח משתמש 3). היישור סוגר את הפער
   בדיוק כפי שמנוע הפסקאות תכנן (המנוע שובר שורות לרוחב המידה; הדפדפן
   מותח רווחים לסגירת שארית). שורות אחרונות נשארות לפי body-last-line-align. */
/* **03.11(ד) — תוכן מובנה של עמודי השער (פורט CSS המקור):** */
.shaar-content{position:absolute;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;z-index:20}
.shaar-content--sub,.shaar-content--back{justify-content:center}
.bsd-header{font-family:'David Libre',serif;font-size:15pt;letter-spacing:5px;font-weight:700;margin-bottom:40px}
.book-title-main{line-height:1.1;margin:10px 0 40px 0;font-weight:400}
.shaar-content--sub .book-title-main,.shaar-content--back .book-title-main{margin:10px 0 15px 0}
.book-subtitle{font-weight:700;line-height:1.25}
.shaar-crown{width:180px;height:24px;margin:12px auto}
.shaar-crown svg{width:100%;height:100%;display:block}
.book-description{line-height:1.5;max-width:65%;margin:10px auto}
.book-sections-summary{line-height:1.5;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:6px 12px;margin:8px 0;font-weight:700}
.author-block{line-height:1.3}
.publication-footer{font-weight:700;letter-spacing:1px}
.back-shaar-text-line{font-size:10.5pt;line-height:1.6;max-width:90%;margin:10px auto;color:#333}
.book-title-main--back{font-size:36pt}
.cs-counter{display:inline-block;min-width:1.4em;margin-inline-end:6px;font-weight:700;opacity:.7;font-size:.85em}
.footnote{margin:1px 0}
`;

/** בניית מסמך HTML עצמאי מעמודי ה‑DOM שכבר רוכמו (string-level; עובד גם Node-side). */
function buildStandaloneHtml(pagesHtml, settings, meta = {}) {
  const title = meta.title || settings['book-name'] || 'ספר';
  // **S12 (REQ-EXP-02):** כללי @page מרישום גדלי העמוד — הדפסה מדויקת מהקובץ העצמאי (אין רשת)
  const pageRules = meta.pageRules || '';
  // **03.11:** @font-face מוטמעים (data-URI) — מסופקים מה-UI; עוברים את offline-guard (אין http)
  const fontCss = meta.fontCss || '';
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>${pageRules}${fontCss}${BASE_CSS}</style>
</head>
<body>
<main class="book">${pagesHtml.join('\n')}</main>
</body>
</html>`;
  if (settings['offline-guard']) assertOfflineSafe(html);
  return html;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = { buildStandaloneHtml, assertOfflineSafe, BASE_CSS };

};
__modules["src/engine/import/zip-reader.js"] = function (require, module, exports) {
// src/engine/import/zip-reader.js — קורא ZIP ללא תלות חיצונית (S11.1-3, DOCX import)
'use strict';

/**
 * קורא ZIP מינימלי לייבוא DOCX: פורמט STORE(0) + DEFLATE(8).
 * **סביבת-אגנוסטית (תיקון 03.11 — "Buffer is not defined" בדפדפן):** אין כל
 * שימוש ב-Buffer/שיטותיו — Uint8Array טהור + פונקציות עזר פרטיות (u16le/u32le/
 * utf8Decode). עובד זהה ב-Node (Buffer הוא sub-class של Uint8Array) ובדפדפן.
 * node:zlib (מובנה, לא תלות חיצונית) משמש כשקיים; אחרת המנפח הטהור להלן.
 * **אבטחה (S13 pass):**
 *  - path traversal: שמות רשומות עם ../ או / אבסולוטי או בריחת תחילית — נדחים
 *    ברשימה (denied) ולא נפתחים לעולם;
 *  - החזרת רשומות מנורמלות בלבד (שמות יחסיים נקיים);
 *  - אין eval; אין כתיבה לדיסק — הכל בזיכרון.
 */

// ---------- עזרי בתים ללא Buffer (זהה לפלט readUInt16LE/readUInt32LE) ----------
function u16le(b, o) { return b[o] | (b[o + 1] << 8); }
function u32le(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function u8sub(b, s, e) { return b.subarray ? b.subarray(s, e) : b.slice(s, e); }

/** פענוח UTF-8 טהור (TextDecoder כשקיים — אחרת מימוש ידני; תואם Buffer.toString('utf8')). */
function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
  let s = '';
  for (let i = 0; i < bytes.length;) {
    const c = bytes[i];
    if (c < 0x80) { s += String.fromCharCode(c); i++; }
    else if (c < 0xe0) { s += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2; }
    else if (c < 0xf0) { s += String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)); i += 3; }
    else {
      const cp = ((c & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      const off = cp - 0x10000;
      s += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
      i += 4;
    }
  }
  return s;
}

const zlib = (() => {
  try { return require('zlib'); } catch (e) { return null; } // בדפדפן אין zlib — מנפח טהור
})();

// =====================================================================
// מנפח raw-DEFLATE טהור (BTYPE 00/01/10) — גיבוי לסביבות בלי zlib (דפדפן).
// אותו פלט כמו zlib.inflateRawSync; מבחן השקילות בבדיקות S11 (both-paths).
// =====================================================================
class BitReader {
  constructor(buf, startByte) {
    this.buf = buf; this.pos = startByte << 3; this.bit = 0; // מספרי ביט מוחלטים
  }
  read(count) {
    let v = 0;
    for (let i = 0; i < count; i++) {
      const byteIdx = this.pos >> 3;
      if (byteIdx >= this.buf.length) throw new Error('deflate: out-of-input');
      const bit = (this.buf[byteIdx] >> (this.pos & 7)) & 1;
      v |= bit << i;
      this.pos++;
    }
    return v;
  }
  alignByte() { this.pos = (this.pos + 7) & ~7; }
}

function buildHuffman(lengths) {
  // קודי canonical Huffman לפי טבלאות אורך (DEFLATE spec 3.2.2)
  const maxLen = 15;
  const counts = new Array(maxLen + 1).fill(0);
  for (const l of lengths) counts[l]++;
  counts[0] = 0;
  const next = new Array(maxLen + 2).fill(0);
  let code = 0;
  for (let b = 1; b <= maxLen; b++) { code = (code + counts[b - 1]) << 1; next[b] = code; }
  const map = new Map();
  for (let sym = 0; sym < lengths.length; sym++) {
    const l = lengths[sym];
    if (l === 0) continue;
    const c = next[l]++;
    map.set((c << 4) | l, sym); // מפתח: code<<4|len — פענוח לפי סדר עולה
  }
  return { map, counts, lengths };
}

function decodeSymbol(br, huff) {
  // קריאה ביט־ביט־ביט ובניית קוד — ללא טבלה הפוכה (פשוט ונכון; קלטים קטנים)
  let code = 0, len = 0;
  for (;;) {
    code = (code << 1) | br.read(1);
    len++;
    if (len > 15) throw new Error('deflate: bad-code');
    const sym = huff.map.get((code << 4) | len);
    if (sym !== undefined) return sym;
  }
}

const LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
const LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
const DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
const DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

function fixedLitHuff() {
  const lengths = [];
  for (let i = 0; i < 144; i++) lengths.push(8);
  for (let i = 144; i < 256; i++) lengths.push(9);
  for (let i = 256; i < 280; i++) lengths.push(7);
  for (let i = 280; i < 288; i++) lengths.push(8);
  return buildHuffman(lengths);
}
function fixedDistHuff() { return buildHuffman(new Array(30).fill(5)); }

/** מנפח raw DEFLATE טהור. הפלט כולו במערך אחד עד הסוף (backref ≤32K תקין תמיד). @returns {Uint8Array} */
function inflateRawPure(buf, startByte = 0, expectedSize = -1) {
  const br = new BitReader(buf, startByte);
  const out = [];
  const pushByte = (b) => { out.push(b); };

  for (;;) {
    const final = br.read(1);
    const btype = br.read(2);
    if (btype === 0) {
      br.alignByte();
      const lenPos = br.pos >> 3;
      if (lenPos + 4 > buf.length) throw new Error('deflate: stored-header-oob');
      const len = buf[lenPos] | (buf[lenPos + 1] << 8);
      const nlen = buf[lenPos + 2] | (buf[lenPos + 3] << 8);
      if ((len ^ 0xFFFF) !== nlen) throw new Error('deflate: stored-nlen-mismatch');
      const dataStart = lenPos + 4;
      if (dataStart + len > buf.length) throw new Error('deflate: stored-oob');
      for (let i = 0; i < len; i++) pushByte(buf[dataStart + i]);
      br.pos = (dataStart + len) << 3;
    } else if (btype === 1 || btype === 2) {
      let litHuff, distHuff;
      if (btype === 1) {
        litHuff = fixedLitHuff(); distHuff = fixedDistHuff();
      } else {
        const hlit = br.read(5) + 257;
        const hdist = br.read(5) + 1;
        const hclen = br.read(4) + 4;
        const ORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
        const clLengths = new Array(19).fill(0);
        for (let i = 0; i < hclen; i++) clLengths[ORDER[i]] = br.read(3);
        const clHuff = buildHuffman(clLengths);
        const lengths = [];
        let prev = 0;
        const total = hlit + hdist;
        while (lengths.length < total) {
          const sym = decodeSymbol(br, clHuff);
          if (sym < 16) { lengths.push(sym); prev = sym; }
          else if (sym === 16) { const rep = 3 + br.read(2); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(prev); }
          else if (sym === 17) { const rep = 3 + br.read(3); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(0); prev = 0; }
          else { const rep = 11 + br.read(7); for (let i = 0; i < rep && lengths.length < total; i++) lengths.push(0); prev = 0; }
        }
        litHuff = buildHuffman(lengths.slice(0, hlit));
        distHuff = buildHuffman(lengths.slice(hlit));
      }
      // פענוח סמלים (LZ77: backref עד 32K לאחור — תקין תמיד במערך היחיד)
      for (;;) {
        const sym = decodeSymbol(br, litHuff);
        if (sym < 256) {
          pushByte(sym);
        } else if (sym === 256) {
          break;
        } else {
          const li = sym - 257;
          if (li >= LEN_BASE.length) throw new Error('deflate: bad-length-symbol');
          const len = LEN_BASE[li] + (LEN_EXTRA[li] ? br.read(LEN_EXTRA[li]) : 0);
          const dsym = decodeSymbol(br, distHuff);
          if (dsym >= DIST_BASE.length) throw new Error('deflate: bad-dist-symbol');
          const dist = DIST_BASE[dsym] + (DIST_EXTRA[dsym] ? br.read(DIST_EXTRA[dsym]) : 0);
          if (dist > out.length) throw new Error('deflate: dist-too-far');
          const srcPos = out.length - dist;
          for (let i = 0; i < len; i++) pushByte(out[srcPos + i]);
        }
      }
    } else {
      throw new Error('deflate: bad-btype');
    }
    if (final) break;
    if (expectedSize >= 0 && out.length >= expectedSize) break;
  }
  return Uint8Array.from(out);
}

/** מנפח: zlib אם קיים (Node), אחרת המנפח הטהור (דפדפן). @returns {Uint8Array} */
function inflateRaw(data) {
  if (zlib) {
    const out = zlib.inflateRawSync(data); // Node: מחזיר Buffer (Uint8Array) — זהה פונקציונלית
    return out;
  }
  return inflateRawPure(data, 0, -1);
}

/** CRC32 של ZIP — לאימות שלמות רשומות (optional check; לא חוסם). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** נורמליזציה + מדיניות שמות: רק נתיבים יחסיים פנימיים. */
function safeName(raw) {
  const name = String(raw || '').replace(/\\/g, '/');
  if (!name || name.endsWith('/')) return null;      // תיקייה
  if (name.startsWith('/')) return null;              // אבסולוטי
  const parts = name.split('/');
  if (parts.some(p => p === '..')) return null;       // traversal
  if (/^[a-zA-Z]:/.test(name)) return null;           // כונן
  if (/[<>:"|?*\u0000]/.test(name)) return null;      // תווים אסורים
  return name;
}

/**
 * פתיחת ארכיון ZIP מזיכרון — **ללא Buffer** (דפדפן ו-Node כאחד; תיקון 03.11).
 * @param {Buffer|Uint8Array} bytes
 * @returns {{ok:boolean, entries:Array<{name:string, data:Uint8Array, method:number, size:number}>, denied:Array<string>, error:string|null}}
 */
function readZip(bytes) {
  const buf = bytes; // Buffer (Node) הוא Uint8Array — אינדוקסציה זהה; שום דבר לא נדרש כאן
  const denied = [];
  const entries = [];
  // מציאת EOCD (End Of Central Directory) — מהסוף, חתימה 0x06054b50
  let eocd = -1;
  const minLen = 22;
  for (let i = buf.length - minLen; i >= Math.max(0, buf.length - minLen - 65536); i--) {
    if (u32le(buf, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return { ok: false, entries: [], denied: [], error: 'not-a-zip' };
  const totalEntries = u16le(buf, eocd + 10);
  const cdOffset = u32le(buf, eocd + 16);

  let p = cdOffset;
  for (let n = 0; n < totalEntries; n++) {
    if (p + 46 > buf.length || u32le(buf, p) !== 0x02014b50) {
      return { ok: false, entries, denied, error: `bad-central-directory@${n}` };
    }
    const method = u16le(buf, p + 10);
    const compSize = u32le(buf, p + 20);
    const nameLen = u16le(buf, p + 28);
    const extraLen = u16le(buf, p + 30);
    const commentLen = u16le(buf, p + 32);
    const localOffset = u32le(buf, p + 42);
    const rawName = utf8Decode(u8sub(buf, p + 46, p + 46 + nameLen));
    const name = safeName(rawName);
    if (name == null) { denied.push(rawName); p += 46 + nameLen + extraLen + commentLen; continue; }

    // קריאת ה-local header והנתונים
    if (localOffset + 30 > buf.length || u32le(buf, localOffset) !== 0x04034b50) {
      return { ok: false, entries, denied, error: `bad-local-header:${name}` };
    }
    const lhNameLen = u16le(buf, localOffset + 26);
    const lhExtraLen = u16le(buf, localOffset + 28);
    const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    const raw = u8sub(buf, dataStart, dataStart + compSize);
    let data;
    try {
      if (method === 0) data = Uint8Array.from(raw);
      else if (method === 8) data = inflateRaw(raw);
      else return { ok: false, entries, denied, error: `unsupported-method:${method}:${name}` };
    } catch (e) {
      return { ok: false, entries, denied, error: `inflate-failed:${name}` };
    }
    entries.push({ name, data, method, size: data.length });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { ok: true, entries, denied, error: null };
}

/** אימות CRC של רשומה (best-effort; מחזיר בוליאני). */
function verifyCrc(entry) {
  return crc32(entry.data) === entry.storedCrc;
}

module.exports = { readZip, safeName, crc32, verifyCrc, inflateRaw, inflateRawPure, utf8Decode };

};
__modules["src/engine/typography/font-subset.js"] = function (require, module, exports) {
// src/engine/typography/font-subset.js — TrueType subsetting for exports (S12.1-8, REQ-EXP)
'use strict';

/**
 * מצמום גופן לגליפים שבשימוש בלבד — תקציב גודל לייצוא (PDF/HTML).
 * שומר: head/hhea/maxp/hmtx/cmap/glyf/loca/OS/2 (+cvt/fpgm/prep כשיש — רמזים).
 * לוקח מהפרנסר (font-metrics) את המיפויים; בונה גופן חדש עצמאי תקני.
 *
 * **בדיקת tofu (0 סימנים חסרים):** הפרנסר עצמו משמש בודק — קריאה חוזרת
 * של התת־גופן חייבת למפות כל תו מבוקש לגליף בעל קווי מתאר לא־ריקים.
 */

const fm = require('./font-metrics');

function u16(v) { return [(v >> 8) & 0xFF, v & 0xFF]; }
function s16v(v) { return u16(v < 0 ? v + 0x10000 : v); }
function u32v(v) { return [(v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF]; }
function str4(s) { return [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)]; }
function rdU16(b, o) { return (b[o] << 8) | b[o + 1]; }
function rdS16(b, o) { const v = rdU16(b, o); return v >= 0x8000 ? v - 0x10000 : v; }
function rdU32(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }

/**
 * בניית תת־גופן.
 * @param {object} font — תוצר parseFont().font
 * @param {Array<string>} chars — התווים הנדרשים (כולל רווח)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, kept:number, dropped:number, widthsUnits?:Map}}
 */
function buildSubset(font, chars) {
  if (!font || !font.bytes) return { ok: false, error: 'no-font' };
  const b = font.bytes;

  // 1) קבוצת הגליפים: .notdef + כל גליף ממופה מהתווים המבוקשים
  const gidSet = new Set([0]);
  const charsKept = [];
  for (const ch of chars || []) {
    const g = fm.glyphIdOf(font, ch);
    if (g !== 0) { gidSet.add(g); charsKept.push(ch); }
  }
  const gids = [...gidSet].sort((a, c) => a - c);
  const gidToNew = new Map(gids.map((g, i) => [g, i])); // ישן → חדש

  // 2) glyf/loca מקוריים — העתקת קווי מתאר כמו שהם
  const locFormat = font.indexToLocFormat;
  const locaOff = font.tables.loca ? font.tables.loca.offset : null;
  const glyfOff = font.tables.glyf ? font.tables.glyf.offset : null;
  if (locaOff == null || glyfOff == null) return { ok: false, error: 'no-glyf-loca' };
  const glyphLen = (g) => {
    const s = locFormat === 0 ? rdU16(b, locaOff + g * 2) * 2 : rdU32(b, locaOff + g * 4);
    const e = locFormat === 0 ? rdU16(b, locaOff + (g + 1) * 2) * 2 : rdU32(b, locaOff + (g + 1) * 4);
    return e - s;
  };
  const glyphBytes = (g) => {
    const s = locFormat === 0 ? rdU16(b, locaOff + g * 2) * 2 : rdU32(b, locaOff + g * 4);
    return b.slice(glyfOff + s, glyfOff + s + glyphLen(g));
  };

  // תת־glyf: מרווחים לפי קווי מתאר; loca קצר (÷2) אם אפשר, אחרת ארוך
  const newGlyphs = gids.map(g => glyphBytes(g));
  const glyfParts = [];
  const newLoca = [0];
  let acc = 0;
  for (const g of newGlyphs) {
    glyfParts.push(g);
    acc += g.length;
    if (acc & 3) { const pad = 4 - (acc & 3); glyfParts.push(Buffer.alloc(pad)); acc += pad; }
    newLoca.push(acc);
  }
  const newGlyf = Buffer.concat(glyfParts);
  const useShortLoca = newLoca.every(v => v <= 0xFFFF * 2) && newGlyf.length <= 0x1FFFE;
  const newLocaBytes = [];
  for (const v of newLoca) {
    if (useShortLoca) newLocaBytes.push(...u16(Math.round(v / 2)));
    else newLocaBytes.push(...u32v(v));
  }

  // 3) hmtx חדש (numberOfHMetrics = מספר הגליפים החדש)
  const oldHm = font.tables.hmtx.offset;
  const oldLSB = (g) => {
    if (g < font.numberOfHMetrics) return rdS16(b, oldHm + g * 4 + 2);
    return rdS16(b, oldHm + font.numberOfHMetrics * 4 + (g - font.numberOfHMetrics) * 2);
  };
  const newHmtx = [];
  const widthsUnits = new Map(); // gid חדש → advance units (ל־W ב־PDF)
  for (const g of gids) {
    const ng = gidToNew.get(g);
    const adv = font.advanceUnits[g] || 0;
    newHmtx.push(...u16(adv), ...s16v(oldLSB(g)));
    widthsUnits.set(ng, adv);
  }

  // 4) cmap חדש — fmt4 על התווים שנשמרו (מקודpoints → gid חדש)
  const kept = charsKept.map(ch => ({ cp: ch.codePointAt(0), ng: gidToNew.get(fm.glyphIdOf(font, ch)) }))
    .sort((a, c) => a.cp - c.cp);
  const segs = [];
  let run = null;
  for (const k of kept) {
    if (run && k.cp === run.end + 1 && k.ng === run.ngEnd + 1) { run.end = k.cp; run.ngEnd = k.ng; }
    else { if (run) segs.push(run); run = { start: k.cp, end: k.cp, ngStart: k.ng, ngEnd: k.ng }; }
  }
  if (run) segs.push(run);
  const segCount = segs.length + 1; // + reserved 0xFFFF
  const sub4Len = 16 + segCount * 8;
  const pow2 = Math.pow(2, Math.floor(Math.log2(segCount)));
  const sub4 = [
    ...u16(4), ...u16(sub4Len), ...u16(0), ...u16(segCount * 2),
    ...u16(2 * pow2), ...u16(Math.floor(Math.log2(segCount))), ...u16(segCount * 2 - 2 * pow2),
    ...segs.map(s => u16(s.end)).flat(), ...u16(0xFFFF), ...u16(0),
    ...segs.map(s => u16(s.start)).flat(), ...u16(0xFFFF),
    ...segs.map(s => s16v(s.ngStart - s.start)).flat(), ...s16v(1),
    ...new Array(segCount).fill(0).flatMap(() => u16(0))
  ];
  const newCmap = [...u16(0), ...u16(1), ...u16(3), ...u16(1), ...u32v(12), ...sub4];

  // 5) head העתקה (indexToLocFormat מותאם) + hhea/maxp/OS/2 מקור (numberOfHMetrics מותאם)
  const head = Buffer.from(b.slice(font.tables.head.offset, font.tables.head.offset + font.tables.head.length));
  head[50] = 0; head[51] = useShortLoca ? 0 : 1;
  const hhea = Buffer.from(b.slice(font.tables.hhea.offset, font.tables.hhea.offset + font.tables.hhea.length));
  hhea[34] = (gids.length >> 8) & 0xFF; hhea[35] = gids.length & 0xFF;
  const maxp = Buffer.from(b.slice(font.tables.maxp.offset, font.tables.maxp.offset + font.tables.maxp.length));
  maxp[4] = (gids.length >> 8) & 0xFF; maxp[5] = gids.length & 0xFF;
  const os2 = font.tables['OS/2'] ? Buffer.from(b.slice(font.tables['OS/2'].offset, font.tables['OS/2'].offset + font.tables['OS/2'].length)) : null;
  const name = font.tables.name ? Buffer.from(b.slice(font.tables.name.offset, font.tables.name.offset + font.tables.name.length)) : null;
  const post = font.tables.post ? Buffer.from(b.slice(font.tables.post.offset, font.tables.post.offset + font.tables.post.length)) : null;
  // רמזים (hinting) — מועתקים כמו שהם (תקינות רינדור בגדלים קטנים)
  const cvt = font.tables.cvt ? Buffer.from(b.slice(font.tables.cvt.offset, font.tables.cvt.offset + font.tables.cvt.length)) : null;
  const fpgm = font.tables.fpgm ? Buffer.from(b.slice(font.tables.fpgm.offset, font.tables.fpgm.offset + font.tables.fpgm.length)) : null;
  const prep = font.tables.prep ? Buffer.from(b.slice(font.tables.prep.offset, font.tables.prep.offset + font.tables.prep.length)) : null;

  // 6) הרכבה
  const tables = [
    ...(os2 ? [['OS/2', os2]] : []),
    ['cmap', Buffer.from(newCmap)],
    ...(cvt ? [['cvt ', cvt]] : []),
    ...(fpgm ? [['fpgm', fpgm]] : []),
    ['glyf', newGlyf],
    ['head', head],
    ['hhea', hhea],
    ['hmtx', Buffer.from(newHmtx)],
    ['loca', Buffer.from(newLocaBytes)],
    ['maxp', maxp],
    ...(name ? [['name', name]] : []),
    ...(post ? [['post', post]] : []),
    ...(prep ? [['prep', prep]] : [])
  ];
  const n = tables.length;
  let off = 12 + n * 16;
  const entries = tables.map(([t, data]) => {
    const e = { t, offset: off, length: data.length, data };
    off += data.length;
    if (off & 3) off += 4 - (off & 3);
    return e;
  });
  const out = [];
  out.push(...u32v(0x00010000), ...u16(n), ...u16(16 * n), ...u16(0), ...u16(0));
  for (const e of entries) out.push(...str4(e.t), ...u32v(0), ...u32v(e.offset), ...u32v(e.length));
  for (const e of entries) {
    // **D-83:** טבלת גופן (glyf/cmap) עשויה לחרוג ממגבלת הארגומנטים של V8 (~125K)
    // בספרים גדולים — הזרקה בלולאה בלבד (אותו תיקון כמו בבדיקת שימור התוכן).
    for (let i = 0; i < e.data.length; i++) out.push(e.data[i]);
    while (out.length & 3) out.push(0);
  }
  const bytes = Buffer.from(out);

  // 7) **בדיקת tofu עצמית:** הפרנסר קורא את התוצר; כל תו מבוקש ממופה; קווי מתאר לא ריקים
  const back = fm.parseFont(bytes);
  if (!back.ok) return { ok: false, error: `subset-reparse-failed:${back.error}` };
  const loca2 = back.font.indexToLocFormat === 0
    ? (g) => rdU16(bytes, back.font.tables.loca.offset + g * 2) * 2
    : (g) => rdU32(bytes, back.font.tables.loca.offset + g * 4);
  for (const ch of chars || []) {
    const g = fm.glyphIdOf(back.font, ch);
    if (g === 0) return { ok: false, error: `tofu:${ch.codePointAt(0).toString(16)}` };
    const advNew = fm.advanceUnitsOf(back.font, ch);
    // **tofu = לא ממופה או (ריק מקווי־מתאר וגם חסר רוחב).** רווח וכיוצא בו —
    // גליף ריק חוקי עם advance חיובי (אין לו קווי מתאר מטבעו); לא tofu.
    const len = loca2(g + 1) - loca2(g);
    if (len <= 0 && advNew === 0) return { ok: false, error: `tofu-empty:${ch.codePointAt(0).toString(16)}` };
    const advOld = fm.advanceUnitsOf(font, ch);
    if (advOld !== advNew) return { ok: false, error: `width-drift:${ch.codePointAt(0).toString(16)}:${advNew}!=${advOld}` };
  }

  return {
    ok: true, bytes,
    kept: gids.length,
    dropped: font.numGlyphs - gids.length,
    widthsUnits,
    unitsPerEm: font.unitsPerEm,
    mappedChars: charsKept.length
  };
}

/**
 * מלאי התווים של טקסט (למצמום) — ייחודיים, כולל רווח תמיד.
 * סמנים פנימיים (PUA) ותווי בקרה (C0/DEL) מוסרים — לעולם לא נצייר גליף
 * עבורם (שורות מוצבות מפורש; BRZ-13).
 */
function charInventory(text) {
  const set = new Set([' ']);
  for (const ch of String(text || '')) {
    const c = ch.codePointAt(0);
    if (c >= 0xE000 && c <= 0xF8FF) continue; // PUA — פנימי
    if (c < 0x20 || c === 0x7F) continue;     // בקרה — לא גליף
    set.add(ch);
  }
  return [...set];
}

module.exports = { buildSubset, charInventory };

};
__modules["src/engine/output/geometry-projector.js"] = function (require, module, exports) {
// src/engine/output/geometry-projector.js — CP5 model → explicit geometry (S12.1-1, REQ-EXP-01)
'use strict';

/**
 * **מקור גיאומטריה יחיד:** הרנדרר החי (DOM) ממקם שורות בזרימת CSS; הפרויקטור
 * מחשב את אותן מיקומים **מפורש** ממודל CP5 (pages/lines/heightPx/columns) —
 * כך שההדפסה (PDF) והייצוא מקרינים מאותו מקור בלבד (הורג את מחלקת
 * live≠export של כל הגרסאות הקודמות).
 *
 * חוזה מיקום (תואם dom-renderer): טור = תיבה absolute מ־template.columns;
 * שורות נערמות מ־contentBox.top + spanOffset; גובה שורה = ln.heightPx.
 * מילים: RTL — יישור לפי המחלקות (right לשורה רגילה; שורה אחרונה לפי
 * body-last-line-align; קריעה/AQ ברווחים). PUA נאסף לפני הפלט (BRZ-13).
 */

const { scrubPUAText } = require('./dom-renderer');
const { MeasureAPI } = require('../typography/measure-api');
const { lineFontSizePt } = require('./line-font'); // **03.11(ג):** מקור יחיד — נצרך גם ע"י dom-renderer (תצוגה חיה + ייצוא); מיוצא הלאה לצרכנים קיימים
const { buildShaarBlocks } = require('./shaar-content'); // **03.11(ד):** תוכן השערים — אותו מודל כמו ה-DOM

/**
 * הקרנת עמוד בודד לגיאומטריה מפורשת.
 * @param {object} page — עמוד CP5
 * @param {object} settings — הגדרות ממוזגות
 * @param {MeasureAPI} [api] — מדידה (נבנה אם לא הוזרק)
 * @returns {{width, height, contentBox, lines:Array, footnotes, folio, header, spanning}}
 */
function projectPage(page, settings, api) {
  const measure = api || new MeasureAPI(settings, 'table');
  const tpl = page.template;
  const spanOffset = page.spanning ? page.spanning.heightPx : 0;

  const out = {
    width: tpl.width,
    height: tpl.height,
    contentBox: { ...tpl.contentBox },
    columns: tpl.columns.map(c => ({ ...c })),
    lines: [],        // {x, y, w, h, words:[{text,x,w}], align, kind, level, isLast}
    footnotes: [],    // {y, marker, text}
    folio: null,      // {y, text}
    header: null,     // {y, parts}
    spanning: null
  };

  // פס חוצה־טורים — שורותיו ברוחב הפס (מעל הטורים)
  if (page.spanning && page.spanning.lines.length) {
    const left = Math.min(...tpl.columns.map(c => c.x));
    const right = Math.max(...tpl.columns.map(c => c.x + c.w));
    const band = { x: left, y: tpl.contentBox.top, w: right - left, h: page.spanning.heightPx, lines: [] };
    let y = tpl.contentBox.top;
    for (const ln of page.spanning.lines) {
      band.lines.push(projectLine(ln, band.x, y, band.w, settings, measure, 'right'));
      y += ln.heightPx || 0;
    }
    out.spanning = band;
  }

  // **S12 (REQ-EXP-03):** עמודי תוכן־העניינים — שורות בפריסת הרנדרר
  // (toc-rows: top 70, שורה ~24px) — כותרת השורה מימין, התווית משמאל.
  // מצויר גם ב־PDF וגם נכלל בחילוץ הטקסט — עמוד TOC לא ריק.
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    const rows = (page.toc && page.toc.rows) || [];
    let yi = 0;
    const rowH = 24;
    for (const row of rows) {
      const y = 70 + yi * rowH;
      if (row.kind === 'group') {
        let xi = 0;
        for (const it of row.items || []) {
          const text = [it.text, it.label || ''].filter(Boolean).join(' ');
          out.lines.push(fakeLine(text, 18 + xi, y, 60, rowH, settings, measure));
          xi += 80;
        }
      } else {
        const text = [row.text, row.label || ''].filter(Boolean).join(' ');
        out.lines.push(fakeLine(text, 18, y, tpl.width - 36, rowH, settings, measure));
      }
      yi++;
    }
  }

  // **03.11(ד):** תוכן מובנה של עמודי השער — אותו מודל כמו ה-DOM (shaar-content).
  // בלי זה ייצוא ה-PDF הציג עמודי שער ריקים. הפריסה משקפת את ה-flex של ה-DOM:
  // 'between' — בלוק ראשון בראש התיבה, אחרון בתחתית, השאר מופצים ברווחים שווים
  // (space-between); 'center' — מחסנית ממורכזת אנכית. עיטור הכתר גרפי — נדלג.
  if (/^shaar-/.test(page.type)) {
    const model = buildShaarBlocks(page, settings, page._metadata);
    if (model && model.blocks.length) {
      const b = model.box;
      const boxX = b.left, boxW = Math.max(40, tpl.width - b.left - b.right);
      const boxY = b.top, boxH = Math.max(60, tpl.height - b.top - b.bottom);
      // גובה כל בלוק: גלישת שורות לרוחב התיבה + גובה שורה לפי הגודל
      const blocks = model.blocks.map(bl => {
        if (bl.graphic) return { ...bl, lines: [], h: 24 };
        const words = String(bl.text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = [], curW = 0;
        for (const w of words) {
          const ww = measure.measureTextWidth(w, bl.sizePt, 0);
          const add = cur.length ? measure.measureTextWidth(' ', bl.sizePt, 0) + ww : ww;
          if (cur.length && curW + add > boxW) { lines.push(cur); cur = [w]; curW = ww; }
          else { cur.push(w); curW += add; }
        }
        if (cur.length) lines.push(cur);
        const lh = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
        return { ...bl, lines, h: lines.length * lh };
      });
      let y;
      if (model.mode === 'between') {
        const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
        const gaps = Math.max(0, blocks.length - 1);
        const gap = gaps ? Math.max(0, (boxH - total) / gaps) : 0;
        y = boxY;
        for (const bl of blocks) {
          if (bl.lines && bl.lines.length) pushCentered(bl, y);
          y += bl.h + gap;
        }
      } else {
        const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
        y = boxY + Math.max(0, (boxH - total) / 2);
        for (const bl of blocks) {
          if (bl.lines && bl.lines.length) pushCentered(bl, y);
          y += bl.h;
        }
      }
      function pushCentered(bl, yTop) {
        const lh = bl.h / bl.lines.length;
        bl.lines.forEach((words, li) => {
          const text = words.join(' ');
          const tw = Math.max(1, measure.measureTextWidth(text, bl.sizePt, 0));
          const lineH = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
          out.lines.push(centeredLine(text, boxX, yTop + li * lh, boxW, lineH, bl.sizePt, measure, bl.cls));
          void tw;
        });
      }
    }
  }

  // טורים ושורות הגוף
  page.columns.forEach((colLines, ci) => {
    const col = tpl.columns[ci] || { x: 0, w: 0 };
    let y = tpl.contentBox.top + spanOffset;
    for (const ln of colLines) {
      out.lines.push(projectLine(ln, col.x, y, col.w, settings, measure, lastAlignOf(ln, settings)));
      y += ln.heightPx || 0;
    }
  });

  // מרזב הערות — מגובה שמור מטה (fnReservedHeightPx) בתחתית תיבת התוכן
  if (page.footnotes && page.footnotes.length) {
    const fnSize = settings['body-font-size-pt'] * 0.8;
    const lh = Math.round(fnSize * (96 / 72) * 1.2);
    let y = tpl.contentBox.bottom - page.fnReservedHeightPx;
    for (const n of page.footnotes) {
      out.footnotes.push({ y, x: colLeftOf(tpl), w: colWidthOf(tpl), marker: scrubPUAText(String(n.marker || '')), text: scrubPUAText(String(n.text || '')), h: lh });
      y += lh;
    }
  }

  // גיליון
  if (page.folioDisplay) {
    // **D-81:** מיקום/רוחב מהמקור היחיד (הקרן, מדידה 10pt) — הכותב וה-ink-bbox צורכים אותו.
    const ft = scrubPUAText(String(page.folioDisplay));
    const fw = Math.max(1, Math.round(measure.measureTextWidth(ft, 10)));
    out.folio = { y: tpl.contentBox.bottom + 2, x: Math.round((tpl.width - fw) / 2), w: fw, sizePt: 10, text: ft };
  }

  // כותרת עליונה — סלוטים חיים (right/center/left) עם טקסט מפורש (D-61)
  if (page.header && page.header.slots) {
    const slots = ['right', 'center', 'left']
      .map(pos => ({ pos, ...page.header.slots[pos] }))
      .filter(s => s && s.text);
    if (slots.length) {
      // **D-81:** סלוט כותרת עליונה — מיקום/רוחב מפורשים מהמקור היחיד (9pt):
      // הכותב, הכותב החי ותיבת הדיו צורכים את אותם מספרים — לא עוד נוסחאות מקומיות.
      out.header = {
        y: Math.max(0, tpl.contentBox.top - 18),
        slots: slots.map(s => {
          const t = scrubPUAText(String(s.text || ''));
          const w = Math.max(1, Math.round(measure.measureTextWidth(t, 9)));
          const x = s.pos === 'right' ? tpl.width - 60 - w : s.pos === 'center' ? Math.round((tpl.width - w) / 2) : 60;
          return { pos: s.pos, align: s.align, text: t, x, w, sizePt: 9 };
        })
      };
    }
  }

  // **S12 (parity):** בסיסי שורות/מרזב/גיליון/כותרת — מודל תיבת שורה אחיד
  attachBaselines(out, settings, measure);

  return out;
}

function colLeftOf(tpl) { return Math.min(...tpl.columns.map(c => c.x)); }
function colWidthOf(tpl) {
  const left = Math.min(...tpl.columns.map(c => c.x));
  const right = Math.max(...tpl.columns.map(c => c.x + c.w));
  return right - left;
}

/** יישור שורה אחרונה לפי ההגדרה (ברירת מחדל center — תואם BASE_CSS). */
function lastAlignOf(ln, settings) {
  if (!ln.isLast) return 'justify';
  const mode = settings['body-last-line-align'] || 'center';
  return mode === 'stretch' ? 'justify' : mode; // stretch בשורה אחרונה = יישור מלא כמו רגילה
}

/**
 * הקרנת שורה בודדת: מילים עם מיקומי x מפורשים (RTL — מימין לשמאל).
 * @param {string} align — 'justify' | 'right' | 'center'
 */
function projectLine(ln, colX, y, colW, settings, measure, align) {
  const sizePt = lineFontSizePt(ln, settings);
  const words = (ln.words || []).map(w => scrubPUAText(String(w).replace(/\u00A0/g, ' '))).filter(Boolean);
  const spaceW = measure.measureTextWidth(' ', sizePt, 0);
  const widths = words.map(w => measure.measureTextWidth(w, sizePt));
  const sumW = widths.reduce((s, w) => s + w, 0);
  const gaps = Math.max(0, words.length - 1);

  // רוחב רווחים: שורת יישור מלאה מפרשת לרוחב הטור (לפחות רווח בסיס);
  // שורה אחרונה — רווח בסיס. AQ stretch מיושם במרווח (הקירוב של המנוע ב־CSS wordSpacing).
  let gapW = spaceW;
  if (align === 'justify' && gaps > 0 && sumW + gaps * spaceW < colW) {
    gapW = (colW - sumW) / gaps;
  }
  if (ln.aqStretch && ln.aqStretch !== 1 && align !== 'justify') {
    gapW = spaceW * ln.aqStretch;
  }

  const lineW = sumW + gaps * gapW;
  let xRight; // הקצה הימני של השורה
  if (align === 'center') xRight = colX + (colW + lineW) / 2;
  else if (align === 'right') xRight = colX + colW;
  else xRight = colX + colW; // justify: מילה ראשונה נצמדת לימין, האחרונה לשמאל

  const wordPos = [];
  let cursor = xRight;
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i] });
    cursor -= gapW;
  }

  return {
    x: colX, y, w: colW, h: ln.heightPx || 0,
    words: wordPos, align, kind: ln.kind || 'paragraph',
    level: ln.level, isLast: !!ln.isLast, sizePt,
    tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
    // **S12 (parity):** קו בסיס לפי מודל תיבת השורה של CSS —
    // half-leading + ascent (מפרופיל הגופן/מכויל) — אותו חוזה ל־PDF ולרסטר.
    baselineY: null
  };
}

/** השלמת baselineY לכל שורות העמוד (לאחר ההקרנה) — מקור מדידה אחד. */
function attachBaselines(page, settings, measure) {
  const ascent = measure.ascentEm(), descent = measure.descentEm();
  for (const ln of [...(page.spanning ? page.spanning.lines : []), ...page.lines]) {
    const sizePx = ln.sizePt * (96 / 72);
    const contentH = (ascent + descent) * sizePx;
    const halfLeading = (ln.h - contentH) / 2;
    ln.baselineY = ln.y + Math.max(0, halfLeading) + ascent * sizePx;
    ln.ascentPx = ascent * sizePx;
    ln.descentPx = descent * sizePx;
  }
  if (page.footnotes) {
    for (const fn of page.footnotes) { fn.baselineY = fn.y + ascent * 11 * (96 / 72); }
  }
  if (page.folio) page.folio.baselineY = page.folio.y + 10;
  if (page.header) page.header.baselineY = page.header.y + 10;
}

/** שורה מלאכותית (TOC/עזר) — מילה אחת מימין לשמאל; מיקום מפורש. */
/** **03.11(ד):** שורת שער ממורכזת — מילים ממוקמות מהמרכז החוצה (RTL). */
function centeredLine(text, x, y, w, h, sizePt, measure, cls) {
  const words = String(text || '').split(/\s+/).filter(Boolean).map(w2 => scrubPUAText(w2));
  const widths = words.map(w2 => measure.measureTextWidth(w2, sizePt, 0));
  const gapW = measure.measureTextWidth(' ', sizePt, 0);
  const totalW = widths.reduce((a, b2) => a + b2, 0) + gapW * Math.max(0, words.length - 1);
  // RTL: המילה הראשונה בקצה הימני של הטקסט הממורכז, והשאר משמאל לה
  let cursor = x + (w + totalW) / 2; // הקצה הימני של הטקסט
  const wordPos = [];
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i] });
    cursor -= gapW;
  }
  return { x, y, w, h, words: wordPos, align: 'center', kind: 'shaar-content', level: null, isLast: false, sizePt, baselineY: null, tokenId: null, cls: cls || '' };
}

function fakeLine(text, x, y, w, h, settings, measure) {
  const sizePt = 12;
  const words = String(text || '').split(/\s+/).filter(Boolean).map(w2 => scrubPUAText(w2));
  const widths = words.map(w2 => measure.measureTextWidth(w2, sizePt, 0));
  const gapW = measure.measureTextWidth(' ', sizePt, 0);
  let cursor = x + w;
  const wordPos = [];
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i] });
    cursor -= gapW;
  }
  return { x, y, w, h, words: wordPos, align: 'right', kind: 'toc-row', level: null, isLast: false, sizePt, baselineY: null, tokenId: null };
}

/**
 * הקרנת מסמך שלם (כל העמודים) + תיבת דיו (ink bbox) לכל עמוד —
 * לבדיקת ה־parity (raster מול מודל).
 */
function projectDocument(result, settings, api) {
  const pages = result.pages.map(p => projectPage(p, settings, api));
  const ascent = (api || new MeasureAPI(settings, 'table')).ascentEm();
  const descent = (api || new MeasureAPI(settings, 'table')).descentEm();
  const inkBounds = pages.map(pg => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const acc = (x, y, w, h) => {
      if (x < minX) minX = x; if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y; if (y + h > maxY) maxY = y + h;
    };
    for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
      for (const w of ln.words) {
        if (!w.text.trim()) continue;
        const sizePx = ln.sizePt * (96 / 72);
        // דיו צמוד לגליפים: בסיס − (ascent×0.93) עד בסיס + descent; צדדים — תיבת המילה
        acc(w.x, ln.baselineY - ascent * sizePx * 0.93, w.w, (ascent * 0.93 + descent) * sizePx);
      }
    }
    for (const fn of pg.footnotes) if ((fn.marker + fn.text).trim()) acc(fn.x, fn.baselineY - 9, fn.w, 14);
    // **D-81:** כל טקסט מצויר נכנס לתיבת הדיו — גם גיליון וגם סלוטי כותרת עליונה,
    // במיקום/רוחב של המקור היחיד (הקרן). בעבר הכותרת לא נצברה כלל ⇒ המודל היה
    // צר מהרסטר בעמודים עם כותרת — פער שנחשף בחיזוק בדיקת הקבלה (S13, 03.11).
    if (pg.folio && pg.folio.text) {
      const w = pg.folio.w != null ? pg.folio.w : Math.max(20, pg.folio.text.length * 6);
      const x = pg.folio.x != null ? pg.folio.x : (pg.width - w) / 2;
      const by = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      acc(x, by - 10, w, 16);
    }
    if (pg.header) {
      for (const s of pg.header.slots || []) {
        if (!s.text || !s.text.trim()) continue;
        const w = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - w : s.pos === 'center' ? (pg.width - w) / 2 : 60);
        const by = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        acc(x, by - 10, w, 15);
      }
    }
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY };
  });
  return { pages, inkBounds, layoutHash: result.layoutHash };
}

module.exports = { projectPage, projectLine, projectDocument, lineFontSizePt, attachBaselines };

};
__modules["src/engine/output/pdf-writer.js"] = function (require, module, exports) {
// src/engine/output/pdf-writer.js — Pure-JS PDF 1.4 writer (S12.1-3, REQ-EXP-03)
'use strict';

/**
 * כותב PDF מהקרנת הגיאומטריה (geometry-projector — מקור יחיד) + תת־גופן
 * TrueType מוטמע (CIDFontType2 + ToUnicode — טקסט אמיתי נבחר/מופק).
 *
 * יכולות (חוזה S12.1-3):
 *  - MediaBox/TrimBox/BleedBox מרישום גדלי העמוד (מ״מ→pt) + export-bleed-mm;
 *  - סימני חיתוך (pdf-crop-marks) — קווים מחוץ לתבנית החיתוך ב־4 פינות;
 *  - עץ סימניות (Outlines) ממודל הכותרות — H1 רמה 1, H2 רמה 2 תחתיו;
 *  - יעדי קישור לחיצים משורות ה־TOC (Link/GoTo → עמוד הכותרת);
 *  - טקסט אמיתי לכל מילה (BT/Tf/Td/Tj) — RTL מוצב מפורש;
 *  - דטרמיניזם: אין תאריך/מזהים אקראיים; סדר אובייקטים קבוע; ייצוא כפול ⇒ בתים זהים.
 *
 * עצמאי לחלוטין — אפס תלות חיצונית (אותה דוקטרינה כמו zip-writer/xml-lite).
 * מוכן גם לצינור הדפסת Chromium: ה־HTML העצמאי (html-export) כולל את אותם
 * כללי @page; ה־PDF הכתוב כאן הוא המסלול המנועי המלא (סימניות+קישורים).
 */

const PX_TO_PT = 72 / 96;
const MM_TO_PT = 72 / 25.4;

/** כתיבת מסמך PDF — אוסף אובייקטים ומרכיב xref מדויק. */
class PdfBuilder {
  constructor() {
    this.objects = new Map(); // id → Buffer (האובייקט בלבד, בלי "N 0 obj")
    this.nextId = 1;
  }
  reserve() { return this.nextId++; }
  put(id, content) {
    this.objects.set(id, Buffer.isBuffer(content) ? content : Buffer.from(content, 'latin1'));
    return id;
  }
  add(content) { return this.put(this.reserve(), content); }
  build() {
    const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
    let pos = parts[0].length;
    const offsets = new Map();
    const maxId = Math.max(0, ...this.objects.keys());
    for (let id = 1; id <= maxId; id++) {
      if (!this.objects.has(id)) continue;
      const head = Buffer.from(`${id} 0 obj\n`, 'latin1');
      const body = this.objects.get(id);
      const tail = Buffer.from('\nendobj\n', 'latin1');
      offsets.set(id, pos);
      pos += head.length + body.length + tail.length;
      parts.push(head, body, tail);
    }
    const xrefPos = pos;
    let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= maxId; id++) {
      if (offsets.has(id)) xref += `${String(offsets.get(id)).padStart(10, '0')} 00000 n \n`;
      else xref += `0000000000 65535 f \n`;
    }
    parts.push(Buffer.from(xref, 'latin1'));
    parts.push(Buffer.from(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`, 'latin1'));
    return Buffer.concat(parts);
  }
}

function escapePdfText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function round2(v) { return Math.round(v * 100) / 100; }

/** **כותרת סימנייה עברית:** מחרוזת טקסט PDF לא־לטינית ⇒ UTF-16BE עם BOM
 * כמחרוזת הקסדצימלית (חוזה PDF 1.4 §3.8.4) — קוראים מציגים עברית תקינה. */
function pdfTitleHex(s) {
  let out = 'FEFF';
  for (const ch of String(s)) {
    const cp = ch.codePointAt(0);
    if (cp > 0xFFFF) {
      const v = cp - 0x10000;
      const hi = 0xD800 + (v >> 10), lo = 0xDC00 + (v & 0x3FF);
      out += hi.toString(16).padStart(4, '0') + lo.toString(16).padStart(4, '0');
    } else {
      out += cp.toString(16).padStart(4, '0');
    }
  }
  return `<${out.toUpperCase()}>`;
}

/** מחרוזת CID הקסדצימלית לטקסט (Identity-H: 2 בתים לגליף).
 * **RTL:** PDF מתקדם שמאלה מ־Td; לכן התווים נפלטים בסדר **ויזואלי**
 * (התו הלוגי האחרון ראשון = השמאלי ביותר) — המילה מרונדרת נכון לקורא עברי. */
function cidHex(text, font) {
  const chars = [...String(text)].filter(ch => {
    const cp = ch.codePointAt(0);
    return cp >= 0x20 && cp !== 0x7F;
  });
  let out = '';
  for (let i = chars.length - 1; i >= 0; i--) {
    const g = font.cidOf(chars[i]);
    if (g === 0) continue;
    out += g.toString(16).padStart(4, '0');
  }
  return out;
}

/** ToUnicode CMap — מיפוי gid → Unicode (חילוץ טקסט אמיתי ב־pdftotext). */
function buildToUnicode(font) {
  const lines = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange'
  ];
  const entries = [];
  for (const [ch, gid] of font.charToGidEntries()) {
    if (gid === 0) continue;
    entries.push(`<${gid.toString(16).padStart(4, '0')}> <${ch.codePointAt(0).toString(16).padStart(4, '0')}>`);
  }
  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    lines.push(`${chunk.length} beginbfchar`, ...chunk, 'endbfchar');
  }
  lines.push('endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end');
  return lines.join('\n');
}

/**
 * כתיבת מסמך PDF שלם.
 * @param {object} opts
 * @param {Array} opts.pages — תוצר projectPage() לכל עמוד
 * @param {{w:number,h:number}} opts.pageSizeMm — גודל עמוד במ״מ (מרישום גדלי העמוד)
 * @param {object} opts.font — {subsetBytes, widthsUnits:Map(gid→units), unitsPerEm, cidOf:(ch)=>gid, charToGidEntries:()=>[ch,gid][]}
 * @param {object} opts.settings — pdf-crop-marks, export-bleed-mm
 * @param {Array} [opts.outline] — [{title, page, level}] — סימניות מכותרות
 * @param {Array} [opts.tocLinks] — [{page, x, y, w, h, targetPage}] — קישורי TOC (px מהמקרן)
 * @returns {Buffer}
 */
function writePdf(opts) {
  const { pages, pageSizeMm, font, settings, outline, tocLinks } = opts;
  const pdf = new PdfBuilder();

  const wPt = pageSizeMm.w * MM_TO_PT;
  const hPt = pageSizeMm.h * MM_TO_PT;
  const bleedPt = (Number(settings['export-bleed-mm']) || 0) * MM_TO_PT;
  const cropMarks = settings['pdf-crop-marks'] === true;
  const pageCount = pages.length;

  // ---- הקצאת מזהים דטרמיניסטית מראש ----
  // מפת מזהים קבוע: 1 קטלוג, 2 דפים, 3 Type0, 4 CIDFont, 5 FontDescriptor,
  // 6 FontFile2 (stream), 7 ToUnicode (stream), 8 Outlines; 9 שמור; 10+ דינמי.
  const ID = {
    catalog: 1, pages: 2, type0: 3, cidFont: 4, fontDescriptor: 5, fontFile: 6, toUnicode: 7, outlines: 8
  };
  pdf.nextId = 10;
  const pageIds = pages.map(() => pdf.reserve());
  const contentIds = pages.map(() => pdf.reserve());
  const linkIds = new Map(); // pageIndex → [ids]
  for (const link of tocLinks || []) {
    if (!linkIds.has(link.page)) linkIds.set(link.page, []);
    linkIds.get(link.page).push(pdf.reserve());
  }
  const outlineItems = (outline || []).map(o => ({ ...o, id: pdf.reserve() }));

  // ---- עץ הסימניות: היררכיה לפי level ----
  const stack = [];
  const roots = [];
  for (const it of outlineItems) {
    while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
    it.parent = stack.length ? stack[stack.length - 1] : null;
    it.children = [];
    if (!it.parent) roots.push(it); else it.parent.children.push(it);
    stack.push(it);
  }
  const flatOrder = [];
  const walk = (list) => { for (const x of list) { flatOrder.push(x); walk(x.children); } };
  walk(roots);
  for (const list of [roots, ...flatOrder.filter(f => f.children.length).map(f => f.children)]) {
    for (let i = 0; i < list.length; i++) { list[i].prev = list[i - 1] || null; list[i].next = list[i + 1] || null; }
  }

  // ---- תוכן לכל עמוד (content streams) ----
  const contents = pages.map((pg) => {
    const ops = [];
    const emitWord = (text, xPx, yPx, sizePt) => {
      const gidHex = cidHex(text, font);
      if (!gidHex) return;
      ops.push(`BT /F1 ${round2(sizePt)} Tf ${round2(xPx * PX_TO_PT)} ${round2(hPt - yPx * PX_TO_PT)} Td <${gidHex}> Tj ET`);
    };
    const emitLines = (lines) => {
      for (const ln of lines) {
        // **S12 (parity):** בסיס השורה מהמקרן (מודל תיבת שורה CSS — half-leading+ascent)
        const baselineY = ln.baselineY != null ? ln.baselineY : ln.y + ln.h - ln.sizePt * (96 / 72) * 0.78;
        // **S4.9 (legacy IMUD):** מילים עם גודל/בסיס משלהן (מילת-חלון 1.5×, סמני הערות)
        for (const w of ln.words) emitWord(w.text, w.x, w.baselineY != null ? w.baselineY : baselineY, w.sizePt || ln.sizePt);
      }
    };
    if (pg.spanning) emitLines(pg.spanning.lines);
    emitLines(pg.lines);
    // מרזב הערות — סמן + מילות ההערה (מימין לשמאל); בסיס מהמקרן
    for (const fn of pg.footnotes) {
      if (fn.words && fn.words.length) {
        // **S4.9 (legacy IMUD):** מילים עם מיקום מפורש מהמקרן
        for (const w of fn.words) emitWord(w.text, w.x, fn.baselineY, w.sizePt || 8.5);
        continue;
      }
      const fs = 11;
      const baseY = fn.baselineY != null ? fn.baselineY : fn.y + 9;
      let x = fn.x + fn.w - 4;
      if (fn.marker) { emitWord(fn.marker, x - 14, baseY, fs); x -= 18; }
      let cx = x;
      for (const w of fn.text.split(/\s+/).filter(Boolean)) {
        cx -= 8.2;
        emitWord(w, cx, baseY, fs);
      }
    }
    // גיליון — מקור יחיד (D-81): מיקום/רוחב מהקרן; נפילה לנוסחה הישנה רק אם חסר
    if (pg.folio && pg.folio.text) {
      const fw = pg.folio.w != null ? pg.folio.w : pg.folio.text.length * 6;
      const fx = pg.folio.x != null ? pg.folio.x : pg.width / 2 - fw / 2;
      const fy = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      emitWord(pg.folio.text, fx, fy, 10);
    }
    // כותרת עליונה — סלוטים לפי מיקום פיזי מהקרן (D-81); נפילה מתועדת לנוסחה הישנה
    if (pg.header) {
      for (const s of pg.header.slots) {
        const sw = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - sw : s.pos === 'center' ? (pg.width - sw) / 2 : 60);
        const y = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        emitWord(s.text, x, y, s.sizePt || 9);
      }
    }
    // סימני חיתוך (חוץ ל־TrimBox; אורך 5מ״מ)
    if (cropMarks) {
      const m = 5 * MM_TO_PT;
      ops.push('0.6 w 0 G');
      ops.push(`0 ${round2(hPt - m)} m ${round2(m)} ${round2(hPt - m)} l S`);
      ops.push(`${round2(m)} ${round2(hPt - m)} m ${round2(m)} ${round2(hPt)} l S`);
      ops.push(`${round2(wPt - m)} ${round2(hPt - m)} m ${round2(wPt)} ${round2(hPt - m)} l S`);
      ops.push(`${round2(wPt)} ${round2(hPt - m)} m ${round2(wPt)} ${round2(hPt)} l S`);
      ops.push(`0 ${round2(m)} m ${round2(m)} ${round2(m)} l S`);
      ops.push(`${round2(m)} ${round2(m)} m ${round2(m)} 0 l S`);
      ops.push(`${round2(wPt - m)} ${round2(m)} m ${round2(wPt)} ${round2(m)} l S`);
      ops.push(`${round2(wPt)} ${round2(m)} m ${round2(wPt)} 0 l S`);
    }
    return Buffer.from(ops.join('\n'), 'latin1');
  });

  // ---- הרכבה: קטלוג, דפים, גופן ----
  const catalogKids = pageIds.map(id => `${id} 0 R`).join(' ');
  const outlinesRef = (outlineItems.length) ? ` /Outlines ${ID.outlines} 0 R /PageMode /UseOutlines` : '';
  pdf.put(ID.catalog, `<< /Type /Catalog /Pages ${ID.pages} 0 R${outlinesRef} >>`);
  pdf.put(ID.pages, `<< /Type /Pages /Count ${pageCount} /Kids [${catalogKids}] >>`);

  // W: לפי חוזה PDF — צורה 1: `c [w1 w2 … wn]` (רצף רוחבים בסוגריים); יחידות פר 1000
  const wArray = [];
  let run = null;
  let prevGid = -10;
  for (const g of [...font.widthsUnits.keys()].sort((a, b) => a - b)) {
    const wv = Math.round((font.widthsUnits.get(g) / font.unitsPerEm) * 1000);
    if (g === prevGid + 1 && run) run.push(wv);
    else { if (run) wArray.push(run); run = [g, wv]; }
    prevGid = g;
  }
  if (run) wArray.push(run);
  const wStr = wArray.map(r => `${r[0]} [${r.slice(1).join(' ')}]`).join(' ');

  pdf.put(ID.type0, `<< /Type /Font /Subtype /Type0 /BaseFont /ToraBook /Encoding /Identity-H /DescendantFonts [${ID.cidFont} 0 R] /ToUnicode ${ID.toUnicode} 0 R >>`);
  pdf.put(ID.cidFont, `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /ToraBook /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${ID.fontDescriptor} 0 R /DW 1000 /W [${wStr}] >>`);
  pdf.put(ID.fontDescriptor, `<< /Type /FontDescriptor /FontName /ToraBook /Flags 4 /FontBBox [-200 -300 1200 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 /FontFile2 ${ID.fontFile} 0 R >>`);
  const ffStream = Buffer.concat([
    Buffer.from(`<< /Length ${font.subsetBytes.length} /Length1 ${font.subsetBytes.length} >>\nstream\n`, 'latin1'),
    font.subsetBytes,
    Buffer.from('\nendstream', 'latin1')
  ]);
  pdf.put(ID.fontFile, ffStream); // 5
  const toUni = buildToUnicode(font);
  pdf.put(ID.toUnicode, `<< /Length ${toUni.length} >>\nstream\n${toUni}\nendstream`); // 6

  // ---- עמודים ----
  const mediabox = `[0 0 ${round2(wPt)} ${round2(hPt)}]`;
  const bleedbox = `[${round2(-bleedPt)} ${round2(-bleedPt)} ${round2(wPt + bleedPt)} ${round2(hPt + bleedPt)}]`;
  pages.forEach((pg, i) => {
    const annots = linkIds.get(i) || [];
    const annotsStr = annots.length ? ` /Annots [${annots.map(id => `${id} 0 R`).join(' ')}]` : '';
    pdf.put(pageIds[i], `<< /Type /Page /Parent ${ID.pages} 0 R /MediaBox ${mediabox} /TrimBox ${mediabox} /BleedBox ${bleedbox} /Resources << /Font << /F1 ${ID.type0} 0 R >> >> /Contents ${contentIds[i]} 0 R${annotsStr} >>`);
    pdf.put(contentIds[i], Buffer.concat([
      Buffer.from(`<< /Length ${contents[i].length} >>\nstream\n`, 'latin1'),
      contents[i],
      Buffer.from('\nendstream', 'latin1')
    ]));
  });

  // ---- קישורי TOC ----
  let linkCursor = 0;
  for (const link of tocLinks || []) {
    const id = linkIds.get(link.page)[0] ? null : null;
    void id;
  }
  // סדר הקצאת הקישורים: לפי סדר tocLinks (אותו סדר בשמור המזהים)
  {
    const perPage = new Map();
    for (const link of tocLinks || []) {
      if (!perPage.has(link.page)) perPage.set(link.page, []);
      perPage.get(link.page).push(link);
    }
    for (const [pgIdx, links] of perPage) {
      const ids = linkIds.get(pgIdx);
      links.forEach((link, j) => {
        const x1 = link.x * PX_TO_PT, y1 = hPt - (link.y + link.h) * PX_TO_PT;
        const x2 = (link.x + link.w) * PX_TO_PT, y2 = hPt - link.y * PX_TO_PT;
        pdf.put(ids[j], `<< /Type /Annot /Subtype /Link /Rect [${round2(x1)} ${round2(y1)} ${round2(x2)} ${round2(y2)}] /Border [0 0 0] /Dest [${pageIds[link.targetPage]} 0 R /XYZ null null null] >>`);
      });
    }
    void linkCursor;
  }

  // ---- סימניות ----
  if (outlineItems.length) {
    pdf.put(ID.outlines, `<< /Type /Outlines /First ${roots[0].id} 0 R /Last ${roots[roots.length - 1].id} 0 R /Count ${flatOrder.length} >>`);
    for (const it of flatOrder) {
      const parts = [
        '<< /Title ' + pdfTitleHex(it.title),
        `/Parent ${it.parent ? it.parent.id : ID.outlines} 0 R`,
        `/Dest [${pageIds[it.page]} 0 R /XYZ null null null]`,
        `/Count ${it.children.length}`
      ];
      if (it.prev) parts.push(`/Prev ${it.prev.id} 0 R`);
      if (it.next) parts.push(`/Next ${it.next.id} 0 R`);
      if (it.children.length) parts.push(`/First ${it.children[0].id} 0 R /Last ${it.children[it.children.length - 1].id} 0 R`);
      pdf.put(it.id, parts.join(' ') + ' >>');
    }
  } else {
    pdf.put(ID.outlines, `<< /Type /Outlines /Count 0 >>`);
  }

  return pdf.build();
}

module.exports = { writePdf, PdfBuilder, PX_TO_PT, MM_TO_PT };

};
__modules["src/engine/output/legacy-projector.js"] = function (require, module, exports) {
// src/engine/output/legacy-projector.js — הקרנת עמודי פרופיל IMUD לגיאומטריה מפורשת.
'use strict';

/**
 * **S4.9:** מקרן ייעודי לעמודי legacy-imud-flow. כל שורה מקבלת מיקום מפורש
 * (x/y/baseline/מילים עם רוחב וגודל פר-מילה) — מותאם לחוזה של writePdf
 * (pages/lines/footnotes/folio/header) ול-pdf_rows של compare.py.
 *
 * הגיאומטריה מקורה אחד: legacy-imud-flow (GEO/SZ) — מכויל מהייחוס.
 */

const { GEO, SZ } = require('../layout/legacy-imud-flow');
const { MeasureAPI } = require('../typography/measure-api');

const COL_R = { x: GEO.COL_R_X, w: GEO.COL_W };
const COL_L = { x: GEO.COL_L_X, w: GEO.COL_W };

/** בסיס שורה לפי מודל תיבת השורה של CSS (half-leading + ascent). */
function baselineOf(yTop, h, sizePt, ascentEm) {
  const sizePx = sizePt * (96 / 72);
  const contentH = (ascentEm + 0.2) * sizePx;
  const half = Math.max(0, (h - contentH) / 2);
  return yTop + half + ascentEm * sizePx;
}

/** מיקום מילים RTL מיושרות ברוחב נתון. מחזיר words:[{text,x,w,sizePt,baselineY}] */
function placeWords(words, api, xLeft, width, sizePt, align, baseY, opts = {}) {
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  const placed = words.map((w, i) => {
    if (typeof w === 'object') return w; // כבר ממוקם (חלון/סמן)
    const isMarker = opts.markers && opts.markers[i];
    const isParen = opts.parenIdx && opts.parenIdx.has(i);
    const sz = isMarker ? SZ.fnMarker : (isParen ? SZ.body + SZ.parenDelta : sizePt);
    return { text: w, w: api.measureTextWidth(w, sz, 0), sizePt: sz };
  });
  const sumW = placed.reduce((a, w) => a + w.w, 0);
  const gaps = Math.max(0, placed.length - 1);
  let gapW = spaceW;
  if (align === 'justify' && gaps > 0 && sumW + gaps * spaceW < width) {
    gapW = (width - sumW) / gaps;
  }
  const lineW = sumW + gaps * gapW;
  let xRight;
  if (align === 'center') xRight = xLeft + (width + lineW) / 2;
  else xRight = xLeft + width;
  const out = [];
  let cursor = xRight;
  for (const w of placed) {
    cursor -= w.w;
    out.push({
      text: w.text, x: cursor, w: w.w,
      sizePt: w.sizePt, baselineY: w.sizePt < sizePt ? baseY - sizePt * (96 / 72) * 0.33 : baseY
    });
    cursor -= gapW;
  }
  return out;
}

/** הקרנת עמוד legacy בודד. */
function projectLegacyPage(pg, settings, api) {
  const ascent = api.ascentEm();
  const out = {
    width: GEO.PAGE_W, height: GEO.PAGE_H,
    contentBox: { top: GEO.FLOW_TOP, bottom: GEO.FLOW_BOTTOM },
    columns: [COL_R, COL_L],
    lines: [], footnotes: [], folio: null, header: null, spanning: null
  };

  const isSingle = pg.type === 'preface' || pg.type === 'toc-general' || pg.type === 'toc-detailed'
    || pg.type.startsWith('shaar');
  const col0 = isSingle ? { x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48 } : COL_R;

  // ---- פסים: סימן/כותרת h2/h0/h3 ממורכזים ברוחב הפס (552px) ----
  // **S4.9:** פיצול למילים (פעולת טקסט נפרדת לכל מילה) — החילוץ מחזיר סדר לוגי,
  // כמו שורות הכותרת בייחוס (לא הפוך כמו שורות ה-TOC החד-פעולתיות).
  const bandLeft = GEO.COL_L_X;
  const bandW = 2 * GEO.COL_W + 13.48;
  for (const b of (pg.bands || [])) {
    const baseY = baselineOf(b.y, b.h, b.sizePt, ascent);
    const words = placeWords(b.text.split(' '), api, bandLeft, bandW, b.sizePt, 'center', baseY);
    out.lines.push({
      x: bandLeft, y: b.y, w: bandW, h: b.h, words, align: 'center',
      kind: b.kind, level: null, isLast: false, sizePt: b.sizePt,
      baselineY: baseY, tokenId: b.tokenId != null ? b.tokenId : null
    });
  }

  // ---- תוכן השערים (ממורכז; מילים נפרדות — חילוץ לוגי, כמו בייחוס) ----
  for (const g of (pg.gateLines || [])) {
    const h = g.sizePt * (96 / 72) * 1.3;
    const baseY = baselineOf(g.y, h, g.sizePt, ascent);
    // **S4.9:** שורות המהדורה והמחבר בשער הראשי נכתבות אצל המקור כרצף אחד —
    // החילוץ מחזיר אותן בסדר מילים הפוך. שאר שורות השער מפוצלות למילים (לוגי).
    const singleOp = g.singleOp === true;
    const words = placeWords(singleOp ? [g.text] : g.text.split(' '), api, bandLeft, bandW, g.sizePt, 'center', baseY);
    out.lines.push({
      x: bandLeft, y: g.y, w: bandW, h, words, align: 'center',
      kind: 'gate', level: null, isLast: false, sizePt: g.sizePt, baselineY: baseY, tokenId: null
    });
  }

  // ---- טורי גוף ----
  pg.columns.forEach((colLines, ci) => {
    const col = ci === 0 ? col0 : COL_L;
    for (const ln of colLines) {
      const baseY = baselineOf(ln.y, ln.heightPx, ln.sizePt, ascent);
      let words;
      if (ln.kind === 'heading') {
        // כותרת inline — מילים נפרדות (חילוץ לוגי, כמו בייחוס)
        const joined = ln.words.join(' ');
        words = placeWords(joined.split(' '), api, col.x, col.w, ln.sizePt, 'center', baseY);
      } else if (ln.window && ln.windowWords) {
        // שורת חלון: מילת החלון (1.5×) בשפה הימנית; הטקסט ברוחב מוקטן
        const winSz = ln.sizePt * 1.5;
        const winW = api.measureTextWidth(ln.windowWords.join(' '), winSz, 0) + 6;
        // **S4.9:** בסיס מילת-החלון צמוד לבסיס הטקסט (מוגבה מעט) — תיבת הגליפים
        // של 1.5× גודל אינה חודרת לשורה הבאה (חפיפה אפס, כמו line-height:0.85 במקור)
        const winBase = baseY - 2;
        const winWords = placeWords(ln.windowWords, api, col.x + col.w - winW, winW, winSz, 'right', winBase);
        const textW = col.w - winW;
        const textWords = placeWords(ln.words, api, col.x, textW, ln.sizePt,
          ln.isLast ? 'center' : 'justify', baseY);
        words = [...winWords, ...textWords];
      } else {
        const align = ln.isLast ? 'center' : 'justify';
        // **S4.9:** מילים בתוך (...) מרונדרות בגודל הסוגריים המוקטן — בדיוק
        // כפי שנמדדו בשבירה (אחרת השורה רחבה מהטור וגולשת מהעמוד).
        const parenIdx = new Set();
        {
          const stack = [];
          ln.words.forEach((w, i) => {
            if (w.startsWith('(')) stack.push(i);
            if (w.endsWith(')') && stack.length) {
              const from = stack.pop();
              for (let k = from; k <= i; k++) parenIdx.add(k);
            }
          });
        }
        words = placeWords(ln.words, api, col.x, col.w, ln.sizePt, align, baseY,
          { markers: ln.words.map(w => /^[א-ת]+\.$/.test(w)), parenIdx });
      }
      out.lines.push({
        x: col.x, y: ln.y, w: col.w, h: ln.heightPx, words,
        align: ln.kind === 'heading' ? 'center' : (ln.isLast ? 'center' : 'justify'),
        kind: ln.kind, level: ln.level || null, isLast: !!ln.isLast, sizePt: ln.sizePt,
        baselineY: baseY, tokenId: ln.tokenId != null ? ln.tokenId : null
      });
    }
  });

  // ---- הערות צד בטורי השוליים ----
  for (const mn of (pg.marginNotes || [])) {
    const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
    for (const l of mn.lines) {
      const baseY = baselineOf(l.y, GEO.MN_PITCH, SZ.marginNote, ascent);
      const words = placeWords(l.text.split(' '), api, x, GEO.MARGIN_W, SZ.marginNote, 'center', baseY);
      out.lines.push({
        x, y: l.y, w: GEO.MARGIN_W, h: GEO.MN_PITCH, words, align: 'center',
        kind: 'margin-note', level: null, isLast: false, sizePt: SZ.marginNote,
        baselineY: baseY, tokenId: null
      });
    }
  }

  // ---- מפריד הערות ----
  // **S4.9:** המקור השתמש ב-✧✧✧ מגופן דפדפן חלופי; הגופן המוטמע שלנו חד-לשוני
  // (אין גליפי כוכבים) — ההפרדה נשארת דרך ריווח התחתית בלבד.

  // ---- הערות שוליים (תחתית) ----
  for (const fn of (pg.footnotes || [])) {
    let x = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
    let baseY = null;
    const words = [];
    if (fn.marker) {
      const mw = api.measureTextWidth(fn.marker, SZ.fnBody, 0);
      x -= mw;
      words.push({ text: fn.marker, x, w: mw, sizePt: SZ.fnBody });
      x -= api.measureTextWidth(' ', SZ.fnBody, 0);
    }
    for (const l of fn.lines) {
      if (baseY === null) baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent);
      const lw = api.measureTextWidth(l.words.join(' '), SZ.fnBody, 0);
      const x0 = Math.max(GEO.COL_L_X, x - lw);
      let cursor = x;
      const ws = [];
      for (let i = l.words.length - 1; i >= 0; i--) {
        const w = l.words[i];
        const ww = api.measureTextWidth(w, SZ.fnBody, 0);
        cursor -= ww;
        ws.push({ text: w, x: cursor, w: ww, sizePt: SZ.fnBody });
        cursor -= api.measureTextWidth(' ', SZ.fnBody, 0);
      }
      words.push(...ws);
      void x0; void lw;
    }
    if (words.length) {
      out.footnotes.push({ y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: fn.marker, text: fn.lines.map(l => l.words.join(' ')).join(' '), words, baselineY: baseY, h: fn.lines.length * GEO.FN_PITCH });
    }
  }

  // ---- שורות תוכן-עניינים ----
  if (pg.toc) {
    if (pg.toc.title) {
      const y = GEO.FLOW_TOP + TOC_TITLE_Y_OFFSET;
      const baseY = baselineOf(y, 30, SZ.tocTitle, ascent);
      const words = placeWords([pg.toc.title], api, bandLeft, bandW, SZ.tocTitle, 'center', baseY);
      out.lines.push({
        x: bandLeft, y, w: bandW, h: 30, words, align: 'center', kind: 'toc-title',
        level: null, isLast: false, sizePt: SZ.tocTitle, baselineY: baseY, tokenId: null
      });
    }
    for (const r of (pg.toc.rows || [])) {
      const baseY = baselineOf(r.y, 26, r.sizePt, ascent);
      // כותרת מימין (במדרגות לפי רמה), מספר משמאל
      const tW = api.measureTextWidth(r.text, r.sizePt, 0);
      const textWords = placeWords([r.text], api, r.x1 - tW, tW, r.sizePt, 'right', baseY);
      const numW = api.measureTextWidth(r.folio, SZ.tocNum, 0);
      const numWords = r.folio ? placeWords([r.folio], api, GEO.TOC_NUM_X, numW, SZ.tocNum, 'left', baseY) : [];
      out.lines.push({
        x: GEO.TOC_NUM_X, y: r.y, w: r.x1 - GEO.TOC_NUM_X, h: 26,
        words: [...textWords, ...numWords], align: 'right', kind: 'toc-row',
        level: r.level, isLast: false, sizePt: r.sizePt, baselineY: baseY, tokenId: null
      });
    }
  }

  // ---- גיליון ----
  if (pg.folioDisplay) {
    const fw = api.measureTextWidth(pg.folioDisplay, SZ.folio, 0);
    out.folio = {
      y: GEO.FOLIO_BASELINE - 14, x: Math.round((GEO.PAGE_W - fw) / 2), w: fw,
      sizePt: SZ.folio, text: pg.folioDisplay, baselineY: GEO.FOLIO_BASELINE
    };
  }

  // ---- כותרת עליונה תלת-סלוטית ----
  if (pg.headerSlots && (pg.headerSlots.right || pg.headerSlots.center || pg.headerSlots.left)) {
    const slots = [];
    const mk = (pos, text, sizePt) => {
      if (!text) return;
      const w = api.measureTextWidth(text, sizePt, 0);
      let x;
      if (pos === 'right') x = GEO.COL_R_X + GEO.COL_W - 33 - w;
      else if (pos === 'left') x = GEO.COL_L_X + 33;
      else x = (GEO.PAGE_W - w) / 2;
      slots.push({ pos, text, x, w, sizePt });
    };
    mk('right', pg.headerSlots.right, SZ.hdrR);
    mk('center', pg.headerSlots.center, SZ.hdrC);
    mk('left', pg.headerSlots.left, SZ.hdrL);
    if (slots.length) {
      // **S4.9:** כל סלוט מתפצל למילים — חילוץ לוגי כמו בייחוס
      for (const s of slots) {
        const baseY = GEO.HEADER_BASELINE;
        s.words = placeWords(s.text.split(' '), api, s.x, s.w + 40, s.sizePt,
          s.pos === 'center' ? 'center' : (s.pos === 'right' ? 'right' : 'left'), baseY);
      }
      out.header = { y: GEO.HEADER_BASELINE - 14, baselineY: GEO.HEADER_BASELINE, slots };
    }
  }

  return out;
}

const FLOW_BOTTOM_DEFAULT = GEO.FLOW_TOP + GEO.FLOW_H;
const TOC_TITLE_Y_OFFSET = 136; // כותרת ה-TOC ב-309px = FLOW_TOP+212.4 — מכויל

/** הקרנת מסמך legacy שלם. */
function projectLegacyDocument(result, settings) {
  const impl = settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table';
  const api = new MeasureAPI(settings, impl);
  const pages = result.pages.map(p => projectLegacyPage(p, settings, api));
  return { pages, inkBounds: pages.map(() => null), layoutHash: result.layoutHash };
}

module.exports = { projectLegacyPage, projectLegacyDocument };

};
__modules["src/engine/output/zip-writer.js"] = function (require, module, exports) {
// src/engine/output/zip-writer.js — כותב ZIP דטרמיניסטי (S12.1-4; שימוש גם ב־S11 לבדיקות DOCX)
'use strict';

/**
 * ZIP בשיטת STORE בלבד — **בתים זהים בין יצוא לייצוא** (modulo timestamps normalized):
 * חותמות זמן קבועות (DOS 1980-01-01 = 0x0021), אין מקורות אקראיים, סדר רשומות
 * קבוע. **אריזה מובנית (structured templating):** הרשומות מסופקות כרשימת
 * {name, data} — לא החלפות regex על מחרוזת (תקלת packer של Yellow נמנעת מראש).
 *
 * שמות: אימות safeName (עקבי עם zip-reader) — רשומה בלתי־חוקית זורקת מיד
 * (לא מושתקת): אין path traversal בחבילות שלנו.
 */

const { crc32, safeName } = require('../import/zip-reader');

const FIXED_DOS_TIME = 0x0021; // 00:00:00? — 1980-01-01 תקני: date=0x0021 (ינואר 1, 1980)
const FIXED_DOS_DATE = 0x0021;

/** רשומת ZIP בודדת (local header + data). */
function localEntry(name, data) {
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);   // signature
  head.writeUInt16LE(20, 4);           // version needed
  head.writeUInt16LE(0, 6);            // flags
  head.writeUInt16LE(0, 8);            // method: STORE
  head.writeUInt16LE(FIXED_DOS_TIME, 10);
  head.writeUInt16LE(FIXED_DOS_DATE, 12);
  head.writeUInt32LE(crc >>> 0, 14);
  head.writeUInt32LE(data.length, 18); // comp size == size (STORE)
  head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(nameBuf.length, 26);
  head.writeUInt16LE(0, 28);           // extra len
  return Buffer.concat([head, nameBuf, data]);
}

/** רשומת central-directory בודדת. */
function centralEntry(name, data, localOffset) {
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const head = Buffer.alloc(46);
  head.writeUInt32LE(0x02014b50, 0);
  head.writeUInt16LE(20, 4);           // version made by
  head.writeUInt16LE(20, 6);           // version needed
  head.writeUInt16LE(0, 8);            // flags
  head.writeUInt16LE(0, 10);           // method STORE
  head.writeUInt16LE(FIXED_DOS_TIME, 12);
  head.writeUInt16LE(FIXED_DOS_DATE, 14);
  head.writeUInt32LE(crc >>> 0, 16);
  head.writeUInt32LE(data.length, 20);
  head.writeUInt32LE(data.length, 24);
  head.writeUInt16LE(nameBuf.length, 28);
  head.writeUInt16LE(0, 30);           // extra
  head.writeUInt16LE(0, 32);           // comment
  head.writeUInt16LE(0, 34);           // disk start
  head.writeUInt16LE(0, 36);           // internal attrs
  head.writeUInt32LE(0, 38);           // external attrs
  head.writeUInt32LE(localOffset, 42);
  return Buffer.concat([head, nameBuf]);
}

/**
 * בניית ארכיון מרשימת רשומות.
 * @param {Array<{name:string, data:Buffer|string}>} entries
 * @returns {Buffer}
 */
function buildZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const seen = new Set();
  for (const e of entries || []) {
    const name = safeName(e.name);
    if (name == null) throw new Error(`zip-writer: illegal entry name: ${JSON.stringify(e.name)}`);
    if (seen.has(name)) throw new Error(`zip-writer: duplicate entry name: ${name}`);
    seen.add(name);
    const data = Buffer.isBuffer(e.data) ? e.data : Buffer.from(String(e.data), 'utf8');
    const l = localEntry(name, data);
    locals.push(l);
    centrals.push(centralEntry(name, data, offset));
    offset += l.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);            // disk
  eocd.writeUInt16LE(0, 6);            // cd disk
  eocd.writeUInt16LE(centrals.length, 8);
  eocd.writeUInt16LE(centrals.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);      // cd offset
  eocd.writeUInt16LE(0, 20);           // comment len
  return Buffer.concat([...locals, cd, eocd]);
}

module.exports = { buildZip };

};
__modules["src/engine/output/project-io.js"] = function (require, module, exports) {
// src/engine/output/project-io.js — Project JSON export/import with settings_version + migrations (S4.1.2, S12)
'use strict';

const { getDefaultSettings, registry, derivePlacementFlags } = require('../core/settings-registry');

/**
 * מיפויי נדידה v1→v2: כינויים ישנים מכל 5 הריפואים → מפתח canonical.
 * ערכים לא־ידועים נשמרים (font-picker preserve-missing-value — IMUD port).
 */
const MIGRATIONS = [
  { version: 2, renames: {
    'pageNumFormat': 'page-num-format',
    'pageNumFrame': 'page-num-frame',
    'pageNumPosition': 'page-num-position',
    'initialPageNumber': 'page-num-initial-value',
    'bodyFontSize': 'body-font-size-pt',
    'lineHeight': 'body-line-height',
    'colWidthPct': 'grid-col-width-pct',
    'marginSidePct': 'grid-margin-side-pct',
    'gutterPct': 'grid-gutter-pct',
    'balanceChapterEnd': 'balance-chapter-end',
    'tocLevel1Show': 'toc-level-1-show',
    'avoid-runt-word': 'runt-min-width-pct' // פנטום Yellow/Green → מנגנון אמיתי כאן
  } }
];

function migrate(raw) {
  let s = { ...raw };
  const from = Number(s.settings_version || 1);
  for (const m of MIGRATIONS) {
    if (m.version > from) {
      for (const [oldK, newK] of Object.entries(m.renames)) {
        if (oldK in s && !(newK in s)) { s[newK] = s[oldK]; delete s[oldK]; }
      }
      s.settings_version = m.version;
    }
  }
  if (!s.settings_version) s.settings_version = 2;
  return s;
}

/** איחוד עם defaults; אי‑התאמות מדווחות ולא משמיטות (audit deltas attributable). */
function mergeWithDefaults(migrated) {
  const defs = getDefaultSettings();
  // derivePlacementFlags **אחרי** האיחוד — mode הוא מקור־האמת; דגלים שהומרו מקובץ
  // v1 ישן (ללא mode) נגזרים שוב כך שלעולם לא ייווצר מצב סותר מאובדן הערות (BRZ-15).
  const merged = derivePlacementFlags({ ...defs, ...migrated, settings_version: 2 });
  // **S4.6:** מפתחות פנימיים (קו-תחתון — נכסי זמן-ריצה כמו _legacy-ui-state/_customStyles)
  // אינם "מפתחות לא מוכרים" — הם מבנה נתונים מתועד; ערכיהם עוברים במיזוג.
  const unknownKeys = Object.keys(migrated).filter(k => !(k in defs) && !k.startsWith('_'));
  const issues = [];
  for (const r of registry) {
    const v = merged[r.id];
    if (r.type === 'enum' && r.enum && !r.enum.includes(v)) issues.push({ key: r.id, value: v, reason: 'not-in-enum', kept: true });
    if (r.type === 'number' && ((r.min != null && v < r.min) || (r.max != null && v > r.max))) issues.push({ key: r.id, value: v, reason: 'out-of-range', kept: true });
  }
  return { merged, unknownKeys, issues };
}

function exportProject(pagesData, settings, meta) {
  return JSON.stringify({
    format: 'tora-typesetter-project',
    format_version: 1,
    engine: 'red-unified',
    exported_at: (meta && meta.timestamp) || null, // דטרמיניסטי: אין Date() אוטומטי בליטה
    settings,
    meta: meta || {},
    pages: pagesData
  }, null, 2);
}

function importProject(json) {
  const raw = typeof json === 'string' ? JSON.parse(json) : json;
  if (raw.format !== 'tora-typesetter-project') throw new Error('unknown project format');
  const migrated = migrate(raw.settings || {});
  const { merged, unknownKeys, issues } = mergeWithDefaults(migrated);
  return { settings: merged, pages: raw.pages || [], meta: raw.meta || {}, unknownKeys, issues };
}

module.exports = { migrate, mergeWithDefaults, exportProject, importProject, MIGRATIONS };

};
__modules["src/engine/extensions/extensions-io.js"] = function (require, module, exports) {
// src/engine/extensions/extensions-io.js — חבילת הרחבות: export/import/share (S11.1-1, §8.3)
'use strict';

/**
 * חבילת הרחבות = סגנונות מותאמים + עמודים מותאמים + תמונות מוטמעות.
 * §8.3 "import/export/share של הכל":
 *  - export: JSON דטרמיניסטי (מפתחות ממוינים, אין חותמת זמן) — export פעמיים ⇒ בתים זהים.
 *  - import: אימות מלא + הודעות עבריות מאובחנות (parseCustomStyles/parseCustomPageTypes/validateImages);
 *    אין השלכה בשקט — כל דחייה מדווחת; הקובץ אינו נטען חלקית (all-or-nothing).
 *  - share: אותו פורמט (החבילה עצמה היא השיתוף) + סיכום קריא לאדם (summary).
 */

const { parseCustomStyles, validateImages } = require('./style-schema');
const { parseCustomPageTypes } = require('../decoration/custom-pages');

const FORMAT = 'tora-typesetter-extensions';
const VERSION = 1;

/** **S11 (§8.3):** תוויות מיקום עבריות לאדם — התקציר קריא בלי מזהי מנוע. */
const POSITION_LABELS = {
  'before-shaar-main': 'לפני השער הראשי',
  'after-shaar-main': 'אחרי השער הראשי',
  'before-part': 'לפני חלק',
  'after-part': 'אחרי חלק',
  'end': 'בסוף המסמך'
};

/** ייצוא דטרמיניסטי — מפתחות ממוינים, אין תאריך. */
function exportExtensions(bundle) {
  const payload = {
    format: FORMAT,
    format_version: VERSION,
    styles: (bundle && bundle.styles) || [],
    pages: (bundle && bundle.pages) || [],
    images: (bundle && bundle.images) || []
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * ייבוא ואימות חבילה. all-or-nothing: רק אם zero errors.
 * מבנה קלט: או חבילה מלאה {format: tora-typesetter-extensions, styles, pages, images},
 * או רשימה חשופה — {styles:[...]} / [styles] (רק סגנונות; עמודים/תמונות ריקים).
 * format שגוי במפורש ⇒ דחייה «פורמט לא נתמך» (חוק 14).
 * @returns {{ok:boolean, styles:Array, pages:Array, images:Array, errors:Array, summary:string}}
 */
function importExtensions(json) {
  let raw;
  const errors = [];
  try {
    raw = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'unparseable-json', path: '$', styleId: null, message: `קובץ ההרחבות אינו JSON תקין — ${e.message}.` }], summary: 'ייבוא נכשל: הקובץ אינו JSON תקין.' };
  }
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'bad-shape', path: '$', styleId: null, message: 'קובץ ההרחבות חייב להיות אובייקט או מערך.' }], summary: 'ייבוא נכשל: מבנה שגוי.' };
  }
  if (raw.format != null && raw.format !== FORMAT) {
    return { ok: false, styles: [], pages: [], images: [], errors: [{ code: 'bad-format', path: '$.format', styleId: null, message: `פורמט לא נתמך — צפוי «${FORMAT}» (קיבל ${JSON.stringify(raw.format)}). הקובץ לא נטען.` }], summary: 'ייבוא נכשל: פורמט לא נתמך.' };
  }
  // רשימה חשופה: [styles] או {styles:[...]} — ללא format/ללא pages/images
  const bare = Array.isArray(raw) || (raw.format == null && !('pages' in raw) && !('images' in raw));
  const stylesInput = bare ? raw : (raw.styles || []);
  const pagesInput = bare ? [] : (raw.pages || []);
  const imagesInput = bare ? [] : (raw.images || []);

  const stylesRes = parseCustomStyles(stylesInput);
  errors.push(...stylesRes.errors);
  const pagesRes = parseCustomPageTypes(JSON.stringify({ pages: pagesInput }));
  errors.push(...pagesRes.errors.map(e => ({ code: `custom-pages:${e}`, path: 'pages', styleId: null, message: `עמוד מותאם נדחה — ${e}.` })));
  const imagesRes = validateImages(imagesInput);
  errors.push(...imagesRes.errors);

  if (errors.length) {
    return { ok: false, styles: [], pages: [], images: [], errors, summary: `ייבוא נכשל: ${errors.length} שגיאות אימות (הקובץ לא נטען).` };
  }
  return {
    ok: true,
    styles: stylesRes.styles,
    pages: pagesRes.pages,
    images: imagesRes.images,
    errors: [],
    summary: `ההרחבות נטענו: ${stylesRes.styles.length} סגנונות, ${pagesRes.pages.length} עמודים מותאמים, ${imagesRes.images.length} תמונות.`
  };
}

/**
 * שיתוף: סיכום קריא לאדם של חבילה קיימת (מוצג למשתמש לפני/אחרי ייבוא).
 * דטרמיניסטי; ללא פרטים מזהים.
 */
function shareSummary(bundle) {
  if (!bundle) return 'חבילה ריקה.';
  const styles = bundle.styles || [];
  const pages = bundle.pages || [];
  const images = bundle.images || [];
  const lines = [
    `חבילת הרחבות (${FORMAT} v${VERSION})`,
    `סגנונות (${styles.length}):` + (styles.length ? styles.map(s => ` «${s.name}» [${s.layoutMode}]`).join(';') : ' אין'),
    `עמודים מותאמים (${pages.length}):` + (pages.length ? pages.map(p => {
      const pos = p.position || { at: 'end' };
      const label = POSITION_LABELS[pos.at] || pos.at;
      const part = pos.at === 'before-part' || pos.at === 'after-part' ? ` ${pos.part || '?'}` : '';
      return ` «${p.name || p.id}» ${label}${part}${p.counted ? '' : ' (לא נספר)'}`;
    }).join(';') : ' אין'),
    `תמונות (${images.length}):` + (images.length ? images.map(im => ` «${im.id}» ${im.w}×${im.h}מ״מ`).join(';') : ' אין')
  ];
  return lines.join('\n');
}

module.exports = { FORMAT, VERSION, exportExtensions, importExtensions, shareSummary };

};

var __entry = "src/ui/engine-worker-main.js";
__modules[__entry](function (n) { return __require(__entry, n); }, { exports: {} }, {});
