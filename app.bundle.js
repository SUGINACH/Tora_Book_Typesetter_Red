// ui/app.bundle.js — **נוצר אוטומטית** ע"י tools/build-worker-bundle.js (אין לערוך ידנית)
// חבילת מעטפת ה־UI (המנוע רץ ב־Worker הנפרד)
// מודולים: 47 · בלי חותמות זמן (דטרמיניזם)
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
  "src/ui/browser-entry.js|./app-shell": "src/ui/app-shell.js",
  "src/ui/browser-entry.js|./worker-client": "src/ui/worker-client.js",
  "src/ui/browser-entry.js|./worker-client": "src/ui/worker-client.js",
  "src/ui/browser-entry.js|./imud-library": "src/ui/imud-library.js",
  "src/ui/app-shell.js|../engine/core/settings-registry": "src/engine/core/settings-registry.js",
  "src/ui/app-shell.js|../engine/output/project-io": "src/engine/output/project-io.js",
  "src/ui/app-shell.js|./status-strip": "src/ui/status-strip.js",
  "src/ui/app-shell.js|./editor-tab": "src/ui/editor-tab.js",
  "src/ui/app-shell.js|./settings-panel": "src/ui/settings-panel.js",
  "src/ui/app-shell.js|./extensions-panel": "src/ui/extensions-panel.js",
  "src/ui/app-shell.js|../engine/import/docx-import": "src/engine/import/docx-import.js",
  "src/ui/app-shell.js|../engine/audit/text-edits": "src/engine/audit/text-edits.js",
  "src/ui/app-shell.js|./preview-tab": "src/ui/preview-tab.js",
  "src/ui/app-shell.js|./testing-tab": "src/ui/testing-tab.js",
  "src/ui/app-shell.js|./worker-client": "src/ui/worker-client.js",
  "src/ui/app-shell.js|./retypeset-policy": "src/ui/retypeset-policy.js",
  "src/ui/app-shell.js|./caret-map": "src/ui/caret-map.js",
  "src/ui/app-shell.js|./inline-transport": "src/ui/inline-transport.js",
  "src/ui/app-shell.js|../engine/output/export-api": "src/engine/output/export-api.js",
  "src/engine/output/project-io.js|../core/settings-registry": "src/engine/core/settings-registry.js",
  "src/ui/editor-tab.js|../engine/decoration/folio": "src/engine/decoration/folio.js",
  "src/ui/settings-panel.js|./bindings.generated": "src/ui/bindings.generated.js",
  "src/ui/extensions-panel.js|../engine/extensions/extensions-io": "src/engine/extensions/extensions-io.js",
  "src/engine/extensions/extensions-io.js|./style-schema": "src/engine/extensions/style-schema.js",
  "src/engine/extensions/extensions-io.js|../decoration/custom-pages": "src/engine/decoration/custom-pages.js",
  "src/engine/decoration/custom-pages.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/import/docx-import.js|./zip-reader": "src/engine/import/zip-reader.js",
  "src/engine/import/docx-import.js|./xml-lite": "src/engine/import/xml-lite.js",
  "src/ui/preview-tab.js|../engine/output/dom-renderer": "src/engine/output/dom-renderer.js",
  "src/engine/output/dom-renderer.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/output/dom-renderer.js|../decoration/page-decorations": "src/engine/decoration/page-decorations.js",
  "src/engine/output/dom-renderer.js|../decoration/shaar-boxes": "src/engine/decoration/shaar-boxes.js",
  "src/engine/output/dom-renderer.js|../decoration/ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/engine/output/dom-renderer.js|../decoration/asset-registry": "src/engine/decoration/asset-registry.js",
  "src/engine/output/dom-renderer.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/dom-renderer.js|../decoration/folio": "src/engine/decoration/folio.js",
  "src/engine/decoration/page-decorations.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/decoration/asset-registry.js|./svg-sanitize": "src/engine/decoration/svg-sanitize.js",
  "src/ui/testing-tab.js|../audit/report-schema": "src/audit/report-schema.js",
  "src/ui/testing-tab.js|../engine/core/ledger": "src/engine/core/ledger.js",
  "src/audit/report-schema.js|../engine/layout/dp-planner": "src/engine/layout/dp-planner.js",
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
  "src/ui/caret-map.js|../engine/parser/dfa-lexer": "src/engine/parser/dfa-lexer.js",
  "src/engine/output/export-api.js|../core/settings-registry": "src/engine/core/settings-registry.js",
  "src/engine/output/export-api.js|./dom-renderer": "src/engine/output/dom-renderer.js",
  "src/engine/output/export-api.js|./html-export": "src/engine/output/html-export.js",
  "src/engine/output/export-api.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/export-api.js|../import/zip-reader": "src/engine/import/zip-reader.js",
  "src/ui/imud-library.js|../engine/decoration/asset-registry": "src/engine/decoration/asset-registry.js",
  "src/ui/imud-library.js|../engine/core/legacy-settings-map": "src/engine/core/legacy-settings-map.js",
  "src/ui/imud-library.js|../engine/core/settings-registry": "src/engine/core/settings-registry.js"
};
__modules["src/ui/browser-entry.js"] = function (require, module, exports) {
// src/ui/browser-entry.js — כניסת הדפדפן (מרוכז ל־ui/app.bundle.js ע"י הבונה)
'use strict';

/**
 * מריץ את createApp עם Worker אמיתי (engine-worker.bundle.js) ומחבר את
 * יכולות הדפדפן בלבד: קובץ־פתוח לייבוא TXT/תבנית, הורדות Blob, מצב גופנים.
 * המנוע עצמו לא נטען כאן — רק ב־Worker (בלי לחסום את ה־UI — REQ-UI-03).
 */

const { createApp } = require('./app-shell');
const { workerTransport } = require('./worker-client');
const { WorkerEngineClient } = require('./worker-client');
const { createImudLibrary } = require('./imud-library');

function downloadJson(name, json) {
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** הורדת פלט בינארי (PDF/ZIP) מהייצוא ב-Worker. */
function downloadBytes(name, bytes, mime) {
  const blob = new Blob([bytes], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function pickFile(accept, cb) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsText(f, 'utf-8');
  });
  inp.click();
}

/** קובץ בינארי (DOCX) — קריאה כ־ArrayBuffer → Uint8Array (S11). */
function pickBinaryFile(accept, cb) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = accept;
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => cb(new Uint8Array(r.result), f.name);
    r.readAsArrayBuffer(f);
  });
  inp.click();
}

function boot() {
  const mount = document.getElementById('app');
  if (!mount) return;
  const worker = new Worker('engine-worker.bundle.js');
  const engine = new WorkerEngineClient(workerTransport(worker));
  // **03.11 (EXT-14):** ספריית נכסי IMUD — פונטים/עיצובים/ברירות מחדל מקוריות.
  const imud = createImudLibrary(engine);
  const app = createApp(document, {
    transport: workerTransport(worker),
    fontStatus: (typeof document !== 'undefined' && document.fonts) ? 'loading' : 'ready',
    // **03.11:** ייצוא PDF/ZIP במנוע ה־Worker + הורדה בפועל בדפדפן
    remoteExport: true,
    onExportFile: (kind, data, name) => {
      if (kind === 'html') downloadText(name || 'book.html', data, 'text/html');
      else if (kind === 'pdf') downloadBytes(name || 'book.pdf', data, 'application/pdf');
      else if (kind === 'zip') downloadBytes(name || 'book-project.zip', data, 'application/zip');
    },
    getExportFont: async (family) => {
      const buf = await imud.loadFont(family);
      return buf ? { name: family, bytes: buf } : null;
    },
    getExportFontCss: () => imud.exportFontCss(),
    // **03.11:** ספריית העיצובים — לפיקרים בפאנל הבורר
    imudLibrary: imud,
    onRequestTxtImport: () => pickFile('.txt,text/plain', (text) => app.onDocumentAction('import-txt', text)),
    onRequestDocxImport: () => pickBinaryFile('.docx', (bytes, name) => app.importDocxFile(bytes, name)), // **S11**
    onRequestExtensionsImport: () => pickFile('.json,application/json', (json) => app.extensions.importFromText(json, 'הרחבות.json')), // **S11**
    onSaveExtensions: (json) => downloadJson('tora-extensions.json', json), // **S11**
    onSaveTemplate: (json) => downloadJson('settings-template.json', json),
    onLoadTemplate: () => pickFile('.json,application/json', (json) => {
      try {
        app.loadTemplateJson(json);
      } catch (e) {
        alert('טעינת התבנית נכשלה: ' + (e && e.message ? e.message : e));
      }
    }),
    onDebugDownload: (json, pageIndex) => downloadJson(`page-debug-${pageIndex + 1}.json`, JSON.stringify(json, null, 2)),
    onOpenBuilder: () => { /* הבורר חי בפאנל ההגדרות (settings-panel) מאז 03.11 */ }
  });
  mount.appendChild(app.root);
  // אחרי ההרכבה: קטלוג הפונטים מתעדכן בפיקרים ברגע שהספרייה נטענת (TDZ-safe)
  imud.loadFontCatalog().then((families) => {
    app.refreshFontCatalog && app.refreshFontCatalog(families);
  }).catch(() => { /* ספרייה לא זמינה (למשל מקומי בלי assets) — ממשק בסיסי */ });
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => app.status.setFonts('ready'));
  }
  if (typeof window !== 'undefined') window.__toraApp = app; // לניפוי ידני
}

function downloadText(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

module.exports = { createApp, workerTransport };

};
__modules["src/ui/app-shell.js"] = function (require, module, exports) {
// src/ui/app-shell.js — מעטפת האפליקציה (S10.1: לשוניות, ⚡, רינדור־קל, סנכרונים)
'use strict';

/**
 * ארבע לשוניות (REQ-UI-01): עורך / הגדרות / בדיקה / תצוגה.
 *
 * **F-06 — היקף הנתיבים למנוע (מאוכף בסריקת callgraph-scan):**
 * בקובץ זה requestTypeset נקרא **רק** מתוך onExplicitRetypeset (כפתור ⚡ —
 * נתיב מיידי בלי debounce) אשר משרת גם את onDocumentAction (הדבקה/ייבוא —
 * פעולות מסמך מפורשות). שינויי הגדרות עוברים דרך onSettingChanged בלבד:
 * קלים ⇒ רינדור־מחדש מרוכז (בלי מנוע); כבדים ⇒ סימון המתנה + ⚡ מהבהב.
 */

const { getDefaultSettings, findKey } = require('../engine/core/settings-registry');
const { migrate, mergeWithDefaults } = require('../engine/output/project-io');
const { buildStatusStrip } = require('./status-strip');
const { buildEditorTab } = require('./editor-tab');
const { buildSettingsTab } = require('./settings-panel');
const { buildExtensionsPanel } = require('./extensions-panel');
const { importDocx } = require('../engine/import/docx-import');
const { applyEdit } = require('../engine/audit/text-edits'); // **S11:** מקור יחיד טהור — בלי pipeline
const { buildPreviewTab } = require('./preview-tab');
const { buildTestingTab } = require('./testing-tab');
const { WorkerEngineClient } = require('./worker-client');
const { classifyChange, getDebounceMs, policyTable } = require('./retypeset-policy');
const { buildCaretMap } = require('./caret-map');

const TABS = [
  { id: 'editor', label: '✍️ עורך' },
  { id: 'settings', label: '⚙️ הגדרות' },
  { id: 'testing', label: '🔍 בדיקה' },
  { id: 'preview', label: '📖 תצוגה' }
];

function createApp(doc, opts = {}) {
  const settings = getDefaultSettings();
  let text = '';
  let result = null;            // תוצאה מסוריאליזת פרוטוקול (D-65)
  let caretMapObj = null;
  let lightDirty = false, heavyDirty = false;
  let lightTimer = null;
  let lastLightRefreshMs = null;
  const perf = (typeof performance !== 'undefined' && performance.now) ? performance : { now: () => Date.now() };

  // בדיקות/Node: תעבורה inline (אותו פרוטוקול) — נטענת בעצלתיים כדי ש־bundle
  // הדפדפן לא יגרור את המנוע (שם רץ Worker אמיתי — ראו inline-transport.js).
  function makeDefaultTransport() {
    const { createInlineTransport } = require('./inline-transport');
    return createInlineTransport();
  }
  const engine = new WorkerEngineClient(opts.transport || makeDefaultTransport());

  // ================= חלקי ה־UI =================
  const status = buildStatusStrip(doc, { onExplicitRetypeset: () => onExplicitRetypeset() });

  const editor = buildEditorTab(doc, {
    onTextChange: (t) => { text = t; markHeavyDirty('טקסט השתנה'); },
    onDocumentAction: (action, payload) => onDocumentAction(action, payload),
    onImportTxt: () => opts.onRequestTxtImport && opts.onRequestTxtImport(),
    onImportDocx: () => opts.onRequestDocxImport && opts.onRequestDocxImport(),
    onClearDocument: () => onDocumentAction('clear', ''),
    onCaretMove: (charIndex) => onCaretMove(charIndex),
    onJumpToPage: (pageIndex) => { switchTab('preview'); preview.scrollToPage(pageIndex); }
  });

  const settingsPanel = buildSettingsTab(doc, {
    getSettings: () => settings,
    onSettingChanged: (key, value) => onSettingChanged(key, value),
    onResetField: (key) => onResetField(key),
    onSaveTemplate: () => opts.onSaveTemplate && opts.onSaveTemplate(saveTemplateJson()),
    onLoadTemplate: () => opts.onLoadTemplate && opts.onLoadTemplate(),
    onOpenBuilder: () => opts.onOpenBuilder && opts.onOpenBuilder(),
    onOpenImports: () => opts.onOpenImports && opts.onOpenImports(),
    // **03.11 (EXT-14):** ספריית IMUD — בוררי עיצובים + ברירות המקור + הודעות
    imudLibrary: opts.imudLibrary || null,
    onNotice: (msg) => status.setNotice(msg),
    onApplyLegacyDefaults: (imported) => {
      // החלה מלאה של ברירות המקור (מיזוג על ההגדרות) + ריענון + עימוד מפורש
      Object.assign(settings, imported);
      settingsPanel.refreshValues();
      onExplicitRetypeset();
    }
  });

  // **S11:** סקציית הרחבות מסמך — בתחתית לשונית ההגדרות (מנותק מ־12 פאנלי הרישום).
  // שינוי הרחבות = כבד (F-06): אין עימוד אוטומטי — ⚡ בלבד.
  const extensions = buildExtensionsPanel(doc, {
    onBundleChange: (bundle) => {
      if (bundle && bundle.styles.length) {
        settings._customStyles = JSON.stringify(bundle.styles.map(s => ({
          id: s.id, name: s.name, trigger: s.trigger, layoutMode: s.layoutMode,
          style: s.style, counter: s.counter, linkedOrnaments: s.linkedOrnaments
        })));
      } else delete settings._customStyles;
      if (bundle && bundle.pages.length) {
        settings._customPages = JSON.stringify({ pages: bundle.pages });
      } else delete settings._customPages;
      if (bundle) markHeavyDirty('הרחבות השתנו');
      else markHeavyDirty('הרחבות הוסרו');
    },
    onRequestImport: () => opts.onRequestExtensionsImport && opts.onRequestExtensionsImport(),
    onExport: () => opts.onSaveExtensions && opts.onSaveExtensions(extensions.exportText()),
    onShare: () => { status.setNotice(extensions.shareText()); }
  });
  settingsPanel.root.appendChild(extensions.root);

  const preview = buildPreviewTab(doc, {
    onActivatePage: (pageIndex) => onActivatePage(pageIndex),
    onDebugDownload: (pageIndex) => opts.onDebugDownload && opts.onDebugDownload(buildDebugJson(pageIndex), pageIndex),
    // **S12 (REQ-EXP-01..04):** נתיב הייצוא האחיד — מקור יחיד לטקסט/הגדרות/הרחבות.
    onExport: (kind) => onExportRequest(kind)
  });

  const testing = buildTestingTab(doc, {
    onActivateFinding: (f) => activateFinding(f), // כלל 2: נתיב ההפעלה האחיד
    onApplyRecommendation: (rec) => applyRecommendation(rec) // **S11:** החלה על המקור
  });

  // ================= בניית שלד =================
  const root = doc.createElement('div');
  root.className = 'app';
  root.dir = 'rtl';

  const header = doc.createElement('header');
  header.className = 'app-header';
  const title = doc.createElement('h1');
  title.className = 'app-title';
  title.textContent = 'ספר תורה — מערך עימוד (Red)';
  header.appendChild(title);
  header.appendChild(status.root);
  // טבלת המדיניות מוצגת בעזרה (REQ-UI-02: policy table rendered in UI help)
  const help = doc.createElement('details');
  help.className = 'policy-help';
  const helpSum = doc.createElement('summary');
  helpSum.textContent = 'מדיניות עדכון (קל/כבד)';
  help.appendChild(helpSum);
  for (const row of policyTable()) {
    const d = doc.createElement('div');
    d.className = `policy-row policy-row--${row.cls}`;
    const b = doc.createElement('strong'); b.textContent = row.labelHe;
    const keys = doc.createElement('div'); keys.className = 'policy-keys'; keys.textContent = row.keys.join(' · ');
    const beh = doc.createElement('div'); beh.className = 'policy-beh'; beh.textContent = row.behaviorHe;
    d.appendChild(b); d.appendChild(keys); d.appendChild(beh);
    help.appendChild(d);
  }
  header.appendChild(help);
  root.appendChild(header);

  const tabbar = doc.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('role', 'tablist');
  tabbar.setAttribute('aria-label', 'לשוניות ראשיות');
  const tabBtns = new Map();
  for (const t of TABS) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'tabbtn';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', t.id === 'editor' ? 'true' : 'false');
    b.dataset.tab = t.id;
    b.textContent = t.label;
    b.addEventListener('click', () => switchTab(t.id));
    tabbar.appendChild(b);
    tabBtns.set(t.id, b);
  }
  root.appendChild(tabbar);

  const main = doc.createElement('main');
  main.className = 'app-main';
  const panels = new Map([
    ['editor', editor.root], ['settings', settingsPanel.root],
    ['testing', testing.root], ['preview', preview.root]
  ]);
  for (const [id, el] of panels) {
    el.classList.add(id === 'editor' ? 'active' : 'inactive');
    main.appendChild(el);
  }
  root.appendChild(main);

  function switchTab(id) {
    for (const [pid, el] of panels) el.classList.toggle('active', pid === id);
    for (const [bid, b] of tabBtns) b.setAttribute('aria-selected', bid === id ? 'true' : 'false');
  }

  // ================= נתיבי המנוע המפורשים (F-06) =================

  /** ⚡ — הנתיב המיידי היחיד להרצת המנוע מה־UI (בלי debounce; מנקה המתנות). */
  function onExplicitRetypeset() {
    if (lightTimer != null) { clearTimeout(lightTimer); lightTimer = null; }
    lightDirty = false; heavyDirty = false;
    status.setPending({ light: false, heavy: false });
    status.setEngineState('working', { label: 'מתחיל עימוד…' });
    const started = perf.now();
    const { promise } = engine.requestTypeset({
      text, settings,
      onProgress: (m) => status.setEngineState('working', m) // "עמוד X מתוך Y"
    });
    promise.then((res) => {
      if (res && res.cancelled) return;
      result = res;
      applyResultToViews();
      status.setEngineState('idle');
      status.setPages(result.pages.length);
    }).catch((e) => {
      status.setEngineState('error', { message: e && e.message ? e.message : String(e) });
    });
    return started;
  }

  /** פעולות מסמך מפורשות — הדבקה / ייבוא TXT / פתיחה. פעולה שלמה ⇒ עימוד מיידי. */
  function onDocumentAction(action, payload) {
    if (action === 'clear') {
      text = '';
      editor.setText('');
      result = null;
      caretMapObj = null;
      preview.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 }, settings);
      testing.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 });
      editor.setPageBreaks([]);
      status.setPages(0);
      status.setPending({ light: false, heavy: false });
      status.setEngineState('idle');
      return;
    }
    if (action === 'paste' || action === 'import-txt' || action === 'open') {
      text = String(payload != null ? payload : '');
      editor.setText(text);
      onExplicitRetypeset(); // פעולת מסמך מפורשת — נתיב מיידי (progress מוצג)
    }
  }

  // ================= מדיניות שינויי הגדרות (D-64) =================

  function onSettingChanged(key, value) {
    settings[key] = value;
    // **03.11 (EXT-14):** בחירת גופן מהספרייה — טעינה חיה (FontFace לתצוגה +
    // registerFont במנוע למדידת font-metrics ולייצוא PDF). כישלון טעינה אינו
    // חוסם: המערכת נופלת לגופן המערכת (מתועד בהודעה).
    if (/-(font)$/.test(key) && value && opts.imudLibrary) {
      opts.imudLibrary.loadFont(value).then((buf) => {
        if (!buf) status.setNotice(`הגופן «${value}» אינו בספרייה המוטמעת — נעשה שימוש בגופן חלופי.`);
      }).catch(() => { /* כבר דווח בהודעה */ });
    }
    if (classifyChange(key) === 'light') scheduleLightRefresh();
    else markHeavyDirty();
  }

  /** רינדור־מחדש קל: מרוכז לפי debounce-light-change-ms (D-44) — בלי מנוע. */
  function scheduleLightRefresh() {
    lightDirty = true;
    status.setPending({ light: true, heavy: heavyDirty });
    if (lightTimer != null) clearTimeout(lightTimer);
    const ms = getDebounceMs(settings);
    lightTimer = setTimeout(() => {
      lightTimer = null;
      runLightRefresh();
    }, ms);
  }

  function runLightRefresh() {
    if (!result) { lightDirty = false; status.setPending({ light: false, heavy: heavyDirty }); return; }
    const t0 = perf.now();
    preview.setResult(result, settings); // רינדור בלבד — אותם עמודים, הגדרות חדשות
    lastLightRefreshMs = perf.now() - t0;
    lightDirty = false;
    status.setPending({ light: false, heavy: heavyDirty });
  }

  /** כבד ⇒ אין עימוד אוטומטי (F-06): סימון + ⚡ מהבהב. */
  function markHeavyDirty(why) {
    heavyDirty = true;
    status.setPending({ light: lightDirty, heavy: true });
  }

  function onResetField(key) {
    const row = findKey(key);
    if (!row) return;
    onSettingChanged(key, row.default); // מסלול המדיניות הרגיל (קל/כבד)
    settingsPanel.refreshValues();
  }

  // ================= S11: ייבוא DOCX + החלת המלצות =================

  /** ייבוא קובץ DOCX (בתים) — המרה במקור היחיד; סירוב פורמט = הודעה עברית בלי קריסה (חוק 14). */
  function importDocxFile(bytes, fileName) {
    const res = importDocx(bytes, fileName);
    if (res.ok) {
      onDocumentAction('open', res.text); // נתיב מיידי (progress מוצג)
      status.setNotice(res.message);
    } else {
      status.setNotice(res.message); // «פורמט לא נתמך» — לא נטען, לא קורס
    }
    return res.ok;
  }

  /** החלת המלצה על טקסט המקור — החלת העריכה באותה פונקציה שהוכיחה אותה (מקור יחיד). */
  function applyRecommendation(rec) {
    if (!rec || !rec.edit || rec.edit.lineFromIdx == null || rec.edit.lineToIdx == null) return false;
    const lines = String(text).split('\n');
    const next = applyEdit(lines, { type: rec.edit.type, fromLine: rec.edit.lineFromIdx, toLine: rec.edit.lineToIdx });
    if (next == null) { status.setNotice('ההמלצה לא הוחלה — השורות במקור השתנו מאז חישובה.'); return false; }
    text = next;
    editor.setText(text);
    onExplicitRetypeset(); // פעולה מפורשת — נתיב מיידי
    status.setNotice('ההמלצה הוחלה והמסמך עומד מחדש.');
    return true;
  }

  // ================= S12: ייצוא (HTML עצמאי / PDF / ZIP) =================

  /** בקשת ייצוא — קריאה בלבד (F-06: אין עימוד/אין שינוי מצב); הפלט דרך opts.onExportFile
   * (בדפדפן: הורדה; בבדיקות: בדיקת הבתים). PDF דורש גופן מוטמע — opts.embeddedFont (בתים)
   * או נתיב הדפדפן: opts.remoteExport + opts.getExportFont (TTF לפי שם משפחה, אסינכרוני)
   * ⇒ הייצוא הכבד רץ ב־Worker (03.11). */
  async function runRemotePdfExport() {
    try {
      const font = await opts.getExportFont(settings['body-font']);
      if (!font || !font.bytes) {
        status.setNotice('ייצוא PDF דורש גופן TTF — לגופן שנבחר לא נמצא קובץ מוטמע. נא לבחור גופן מהסט המוטמע או לטעון TTF.');
        return { ok: false, reason: 'no-embedded-font' };
      }
      const res = await engine.requestExport({ kind: 'pdf', text, settings, fontBytes: font.bytes, fontName: font.name });
      if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
      status.setNotice(`יוצא PDF — ${res.info && res.info.pages ? res.info.pages : '?'} עמודים, ${res.info && res.info.outline ? res.info.outline : 0} סימניות, טקסט נבחר.`);
      return { ok: true, kind: 'pdf', data: res.bytes, info: res.info };
    } catch (e) {
      status.setNotice('ייצוא PDF נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  async function runRemoteZipExport() {
    try {
      const res = await engine.requestExport({ kind: 'zip', text, settings, extensions: extensions.getBundle ? extensions.getBundle() : null });
      if (opts.onExportFile) opts.onExportFile('zip', res.bytes, 'book-project.zip');
      status.setNotice('יוצאה חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות+ערכה).');
      return { ok: true, kind: 'zip', data: res.bytes };
    } catch (e) {
      status.setNotice('ייצוא ZIP נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  function onExportRequest(kind) {
    if (!result) { status.setNotice('אין תוצאה לייצוא — העמוד עוד לא בוצע.'); return null; }
    const { exportHtml, exportPdf, exportProjectZip } = require('../engine/output/export-api');
    try {
      if (kind === 'html') {
        const fontCss = (typeof opts.getExportFontCss === 'function' && opts.getExportFontCss()) || '';
        const html = exportHtml(result, settings, doc, { title: (result.metadata && result.metadata['ספר']) || 'ספר', fontCss });
        if (opts.onExportFile) opts.onExportFile('html', html, 'book.html');
        status.setNotice('יוצא HTML עצמאי (חד־קובץ, offline).');
        return { ok: true, kind, data: html };
      }
      if (kind === 'pdf') {
        // **נתיב הדפדפן (03.11):** המנוע הכבד חי ב־Worker — הייצוא שם עם TTF שנשלף לפי הגופן.
        if (opts.remoteExport && typeof opts.getExportFont === 'function') {
          status.setNotice('מייצא PDF במנוע (Worker)…');
          runRemotePdfExport(); // fire-and-forget — ההורדה וההודעות בסיום
          return { ok: true, kind, pending: true };
        }
        if (typeof Buffer === 'undefined') {
          // סביבה ללא מודול בואפרים וללא נתיב מרוחק — הודעה מפורשת (לא כשל שקט)
          status.setNotice('ייצוא PDF דורש גופן מוטמע או נתיב Worker — השתמשו בייצוא ה־HTML העצמאי.');
          return { ok: false, reason: 'no-buffer-in-browser' };
        }
        if (!opts.embeddedFont) {
          status.setNotice('ייצוא PDF דורש גופן מוטמע — נא לטעון גופן (TTF) בהגדרות המסמך.');
          return { ok: false, reason: 'no-embedded-font' };
        }
        const res = exportPdf(text, settings, opts.embeddedFont);
        if (!res.ok) { status.setNotice('ייצוא PDF נכשל: ' + res.error); return res; }
        if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
        status.setNotice(`יוצא PDF — ${res.info.pages} עמודים, ${res.info.outline} סימניות, טקסט נבחר.`);
        return { ok: true, kind, data: res.bytes, info: res.info };
      }
      if (kind === 'zip') {
        // **נתיב הדפדפן (03.11):** חבילת הפרויקט נבנית ב־Worker (zip-writer חי שם)
        if (opts.remoteExport) {
          status.setNotice('מייצא חבילת ZIP במנוע (Worker)…');
          runRemoteZipExport();
          return { ok: true, kind, pending: true };
        }
        const bytes = exportProjectZip(text, settings, {
          extensions: extensions.getBundle ? extensions.getBundle() : null
        });
        if (opts.onExportFile) opts.onExportFile('zip', bytes, 'book-project.zip');
        status.setNotice('יוצאה חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות+ערכה).');
        return { ok: true, kind, data: bytes };
      }
    } catch (e) {
      status.setNotice('הייצוא נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
    return null;
  }


  function applyResultToViews() {
    caretMapObj = buildCaretMap(text, result);
    preview.setResult(result, settings);
    testing.setResult(result);
    testing.setRecommendations(result.recommendations || null); // **S11:** המלצות עם הוכחות
    // מפת שבירות עמודים לעורך (⏎ — תצוגה בלבד, F-01)
    const breaks = [];
    for (const pg of result.pages) {
      if (pg.index === 0) continue;
      const toks = caretMapObj.tokensByPage.get(pg.index) || [];
      const tokId = toks[0];
      const tok = tokId ? result.tokens.find(t => t.id === tokId) : null;
      breaks.push({
        pageIndex: pg.index,
        firstWord: tok ? String(tok.raw || '').split(/\s+/)[0] || '' : ''
      });
    }
    editor.setPageBreaks(breaks);
    status.setPages(result.pages.length);
    status.setPending({ light: lightDirty, heavy: heavyDirty });
  }

  // ================= סנכרונים והפעלות =================

  /** כיוון א׳: סמן בעורך ⇒ הדגשת עמוד בתצוגה. */
  function onCaretMove(charIndex) {
    if (!caretMapObj) return;
    const page = caretMapObj.caretToPage(charIndex);
    if (page != null) preview.setCaretHighlight(page);
  }

  /** כיוון ב׳: לחיצה על עמוד / שורת TOC ⇒ מיקום הסמן בעורך. */
  function onActivatePage(pageIndex) {
    if (!caretMapObj) return;
    const caret = caretMapObj.pageToCaret(pageIndex);
    if (caret != null) editor.setCaret(caret);
  }

  /** כלל 2 (Working_rules): נתיב ההפעלה האחיד לכל ממצא — קפיצה + הדגשה + סמן. */
  function activateFinding(f) {
    switchTab('preview');
    preview.highlightIssue(f); // כולל scrollToPage
    if (f && f.page != null && caretMapObj) {
      const caret = caretMapObj.pageToCaret(Number(f.page));
      if (caret != null) editor.setCaret(caret);
    }
  }

  // ================= תבניות (REQ-UI-07) =================

  function saveTemplateJson() {
    return JSON.stringify({ format: 'tora-typesetter-template', version: 1, settings }, null, 2);
  }

  function loadTemplateJson(json) {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    if (raw.format !== 'tora-typesetter-template') throw new Error('תבנית לא מוכרת (format שגוי)');
    const { merged, unknownKeys, issues } = mergeWithDefaults(migrate(raw.settings || {}));
    for (const [k, v] of Object.entries(merged)) settings[k] = v;
    settingsPanel.refreshValues();
    markHeavyDirty(); // הגדרות השתנו — המשתמש יחליט מתי לעמד (⚡)
    return { unknownKeys, issues };
  }

  // ================= דיבאג פר־עמוד (V21) =================

  function buildDebugJson(pageIndex) {
    if (!result) return { error: 'אין תוצאה — עמדו את המסמך תחילה' };
    const pg = result.pages.find(p => p.index === pageIndex);
    if (!pg) return { error: `עמוד ${pageIndex} לא נמצא` };
    const ledgerSlice = (result.ledger.issues || []).filter(rec => rec.page === pageIndex || String(rec.target || '').includes(`p${pageIndex}`));
    const traceSlice = (result.trace.events || []).filter(ev => ev.pageIndex === pageIndex);
    const findingsSlice = (result.report.findings || []).filter(f => Number(f.page) === pageIndex);
    return {
      schema: 'page-debug-v1',
      pageIndex,
      type: pg.type,
      template: pg.template,                       // גיאומטריה מלאה: מידות/שוליים/טורים/תיבת תוכן
      contentBox: pg.template && pg.template.contentBox,
      columns: (pg.columns || []).map(c => c.map(ln => ({
        tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
        heightPx: ln.heightPx, words: (ln.words || []).length, kind: ln.kind || null
      }))),
      footnotes: (pg.footnotes || []).length,
      header: pg.header ? { slots: pg.header.slots ? Object.keys(pg.header.slots) : ['legacy'] } : null,
      folioDisplay: pg.folioDisplay || '',
      findings: findingsSlice,
      ledger: ledgerSlice,                          // פרוסת ledger לעמוד זה
      trace: traceSlice,                            // פרוסת מסלול לעמוד זה
      layoutHash: result.layoutHash
    };
  }

  // ================= מצב התחלתי =================
  status.setOffline(settings['offline-guard'] !== false);
  status.setFonts(opts.fontStatus || 'ready');

  return {
    root, switchTab, editor, settingsPanel, preview, testing, status, engine, extensions,
    onExplicitRetypeset, onDocumentAction, onSettingChanged, onResetField,
    scheduleLightRefresh, activateFinding, saveTemplateJson, loadTemplateJson, buildDebugJson,
    importDocxFile, applyRecommendation, // **S11:** ייבוא DOCX + החלת המלצות
    exportRequest: onExportRequest, // **S12:** ייצוא (html/pdf/zip) — קריאה בלבד
    refreshFontCatalog: (families) => settingsPanel.refreshFontCatalog && settingsPanel.refreshFontCatalog(families), // **03.11**
    imudLibrary: opts.imudLibrary || null, // **03.11:** ספריית IMUD לניפוי/הרחבות
    getState: () => ({ lightDirty, heavyDirty, lastLightRefreshMs, hasResult: !!result, pages: result ? result.pages.length : 0, layoutHash: result ? result.layoutHash : null }),
    setText: (t) => { text = String(t != null ? t : ''); editor.setText(text); },
    getText: () => editor.getText(),
    getSettings: () => settings
  };
}

module.exports = { createApp, TABS };

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
  const unknownKeys = Object.keys(migrated).filter(k => !(k in defs));
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
__modules["src/ui/status-strip.js"] = function (require, module, exports) {
// src/ui/status-strip.js — פס מצב ואזהרות (S10.1-6: המתנה, שומר־נתק, גופנים, מנוע)
'use strict';

/**
 * רצועת מצב עליונה: מצב מנוע + התקדמות ("עמוד X מתוך Y"), מחוון שינויים
 * ממתינים (קלים/כבדים), כפתור ⚡ מהבהב (כבדים — F-06), שומר נתק־מהרשת,
 * מצב טעינת גופנים. נגישות: aria-live להתקדמות; הכפתור עם תווית מלאה.
 */

function buildStatusStrip(doc, opts) {
  const root = doc.createElement('div');
  root.className = 'status-strip';
  root.setAttribute('role', 'status');

  // ---- מצב מנוע + התקדמות ----
  const engine = doc.createElement('span');
  engine.className = 'chip chip--engine';
  engine.setAttribute('aria-live', 'polite');
  engine.textContent = '⏳ מנוע: פנוי';

  const progress = doc.createElement('span');
  progress.className = 'chip chip--progress';
  progress.setAttribute('aria-live', 'polite');
  progress.textContent = '';

  // ---- שינויים ממתינים + ⚡ ----
  const pending = doc.createElement('span');
  pending.className = 'chip chip--pending';
  pending.textContent = 'אין שינויים ממתינים';

  const bolt = doc.createElement('button');
  bolt.type = 'button';
  bolt.className = 'btn btn--bolt';
  bolt.textContent = '⚡ עדכן ועמד מחדש';
  bolt.setAttribute('aria-label', 'עדכן ועמד מחדש — נתיב מיידי בלי השהיה');
  bolt.title = 'שינויים כבדים ממתינים — לחיצה מריצה עימוד מלא מיידי (בלי debounce)';
  bolt.addEventListener('click', () => opts.onExplicitRetypeset && opts.onExplicitRetypeset());
  let blinking = false;

  // ---- שומר נתק־מהרשת ----
  const offline = doc.createElement('span');
  offline.className = 'chip chip--offline';
  offline.textContent = '🔌 שומר נתק: פעיל';

  // ---- גופנים ----
  const fonts = doc.createElement('span');
  fonts.className = 'chip chip--fonts';
  fonts.textContent = '🔤 גופנים: מוכנים';

  // ---- עמודים ----
  const pages = doc.createElement('span');
  pages.className = 'chip chip--pages';
  pages.textContent = '📄 0 עמודים';

  // ---- הודעות חולפות (S11: ייבוא/סירוב פורמט/החלת המלצה — חוק 14 בלי חלונות) ----
  const notice = doc.createElement('span');
  notice.className = 'chip chip--notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.textContent = '';
  let noticeTimer = null;

  for (const el of [engine, progress, pending, bolt, offline, fonts, pages, notice]) root.appendChild(el);

  return {
    root, bolt,
    setEngineState(state, info) {
      if (state === 'working') {
        engine.textContent = '⚙️ מנוע: עמל…';
        progress.textContent = info && info.label ? info.label : '';
      } else if (state === 'error') {
        engine.textContent = '❌ מנוע: שגיאה';
        progress.textContent = (info && info.message) || '';
      } else {
        engine.textContent = '⏳ מנוע: פנוי';
        progress.textContent = '';
      }
    },
    setPending({ light, heavy }) {
      const parts = [];
      if (light) parts.push('קלים (רינדור בקרוב)');
      if (heavy) parts.push('כבדים — נדרש ⚡');
      pending.textContent = parts.length ? `⏳ שינויים ממתינים: ${parts.join(' · ')}` : 'אין שינויים ממתינים';
      this.setBlink(!!heavy);
    },
    setBlink(on) {
      blinking = on;
      bolt.classList.toggle('blink', on);
      bolt.setAttribute('aria-live', on ? 'assertive' : 'off');
    },
    getBlink() { return blinking; },
    setOffline(active) {
      offline.textContent = active ? '🔌 שומר נתק: פעיל' : '⚠️ שומר נתק: כבוי';
      offline.classList.toggle('chip--warn', !active);
    },
    setFonts(status) {
      const map = { loading: '🔤 גופנים: נטענים…', ready: '🔤 גופנים: מוכנים', error: '🔤 גופנים: שגיאת טעינה' };
      fonts.textContent = map[status] || map.ready;
    },
    setPages(n) { pages.textContent = `📄 ${n} עמודים`; },
    /** הודעה חולפת (8 שניות) — ייבוא, סירוב פורמט, החלת המלצה. */
    setNotice(text) {
      notice.textContent = String(text != null ? text : '');
      notice.classList.toggle('chip--notice-on', !!text);
      if (noticeTimer != null) clearTimeout(noticeTimer);
      if (text) noticeTimer = setTimeout(() => { notice.textContent = ''; notice.classList.remove('chip--notice-on'); noticeTimer = null; }, 8000);
    }
  };
}

module.exports = { buildStatusStrip };

};
__modules["src/ui/editor-tab.js"] = function (require, module, exports) {
// src/ui/editor-tab.js — לשונית העורך (REQ-UI-04: הדבקה, מונים, ⏎ לא מיוצא, ייבוא, ניקוי)
'use strict';

/**
 * F-01 (שיעור היצוא): סמני שבירת־עמוד ⏎ הם אלמנטים חיצוניים ל־textarea —
 * לעולם לא חלק מהטקסט. getText() מחזיר את תוכן ה־textarea כמו שהוא; הבדיקה
 * מוכיחה שזהה־בתים למקור שהודבק (proof: markers never exported).
 *
 * DOCX: מנוע הייבוא נבנה ב־S11 — הכפתור קיים אך נעול (UI stub guarded, §9.4:
 * בלי חלונות שגיאה אוטומטיים — הודעה עברית ברורה בלבד).
 */

const { toHebrewNumber } = require('../engine/decoration/folio');

function buildEditorTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'editor';

  // ---- אזור ההדבקה ----
  const area = doc.createElement('textarea');
  area.className = 'editor-area';
  area.setAttribute('aria-label', 'אזור הדבקת טקסט פשוט');
  area.setAttribute('placeholder', 'הדבק כאן טקסט פשוט… (כותרת N - טקסט, [הערות בסוגריים], הערת סיום - טקסט)');
  root.appendChild(area);

  // ---- סרגל פעולות ----
  const bar = doc.createElement('div');
  bar.className = 'editor-bar';
  const btnTxt = doc.createElement('button');
  btnTxt.type = 'button'; btnTxt.className = 'btn'; btnTxt.textContent = '📄 ייבוא TXT';
  btnTxt.setAttribute('aria-label', 'ייבוא קובץ טקסט');
  btnTxt.addEventListener('click', () => opts.onImportTxt && opts.onImportTxt());
  const btnDocx = doc.createElement('button');
  btnDocx.type = 'button'; btnDocx.className = 'btn'; btnDocx.textContent = '📝 ייבוא DOCX';
  btnDocx.setAttribute('aria-label', 'ייבוא מסמך וורד');
  btnDocx.title = 'ייבוא DOCX: כותרות וורד → כותרות המנוע; הערות וורד → הערות סוגריים; פסקאות → טקסט';
  btnDocx.addEventListener('click', () => opts.onImportDocx && opts.onImportDocx()); // **S11:** נפתח — המנוע נבנה
  const btnClear = doc.createElement('button');
  btnClear.type = 'button'; btnClear.className = 'btn btn--ghost'; btnClear.textContent = '🗑 נקה';
  btnClear.setAttribute('aria-label', 'ניקוי העורך');
  btnClear.addEventListener('click', () => opts.onClearDocument && opts.onClearDocument());
  bar.appendChild(btnTxt); bar.appendChild(btnDocx); bar.appendChild(btnClear);
  root.appendChild(bar);

  // ---- מונים (תווים/מילים/שורות/פסקאות) — חי ----
  const counters = doc.createElement('div');
  counters.className = 'editor-counters';
  counters.setAttribute('aria-live', 'polite');
  root.appendChild(counters);

  function updateCounters() {
    const t = area.value || '';
    const words = t.split(/\s+/).filter(Boolean).length;
    const lines = t === '' ? 0 : t.split('\n').length;
    const paras = t.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    counters.textContent = `תווים: ${t.length} · מילים: ${words} · שורות: ${lines} · פסקאות: ${paras}`;
  }

  // ---- סמני שבירת עמודים (⏎) — תצוגה בלבד, מחוץ לטקסט (F-01) ----
  const markers = doc.createElement('div');
  markers.className = 'editor-markers';
  markers.setAttribute('aria-label', 'מפת שבירת עמודים');
  const markersTitle = doc.createElement('div');
  markersTitle.className = 'editor-markers-title';
  markersTitle.textContent = 'מפת שבירות עמודים (⏎ — לתצוגה בלבד, לעולם לא מיוצא)';
  markers.appendChild(markersTitle);
  const markersList = doc.createElement('ul');
  markersList.className = 'editor-markers-list';
  markers.appendChild(markersList);
  root.appendChild(markers);

  let lastBreaks = [];

  /** עדכון מפת השבירות מתוצאת העימוד: [{tokenIndex, pageIndex, firstWord}] */
  function setPageBreaks(breaks) {
    lastBreaks = breaks || [];
    markersList.textContent = '';
    for (const b of lastBreaks) {
      const li = doc.createElement('li');
      li.className = 'marker-item';
      li.dataset.pageIndex = String(b.pageIndex);
      li.textContent = `⏎ → עמוד ${toHebrewNumber(b.pageIndex + 1)}${b.firstWord ? ` — «${b.firstWord}»` : ''}`;
      li.addEventListener('click', () => opts.onJumpToPage && opts.onJumpToPage(b.pageIndex));
      markersList.appendChild(li);
    }
  }

  // ---- אירועי טקסט ----
  // הקלדה ⇒ סימון המתנה בלבד (⚡ יהבהב) — אין עימוד אוטומטי (F-06).
  area.addEventListener('input', () => {
    updateCounters();
    opts.onTextChange && opts.onTextChange(area.value);
  });
  // הדבקה = פעולת מסמך מפורשת ⇒ נתיב מיידי (REQ-UI-03: progress מוצג)
  area.addEventListener('paste', (ev) => {
    const data = ev && ev.clipboardData && typeof ev.clipboardData.getData === 'function'
      ? ev.clipboardData.getData('text/plain')
      : (ev && ev.text != null ? ev.text : null);
    if (data != null) {
      if (ev && ev.preventDefault) ev.preventDefault();
      opts.onDocumentAction && opts.onDocumentAction('paste', String(data));
    }
  });
  // מעקב סמן — כיוון א׳ של הסנכרון (REQ-UI-05)
  const fireCaret = () => opts.onCaretMove && opts.onCaretMove(area.selectionStart != null ? area.selectionStart : 0);
  area.addEventListener('click', fireCaret);
  area.addEventListener('keyup', fireCaret);
  area.addEventListener('select', fireCaret);

  /** כיוון ב׳ של הסנכרון: מיקום הסמן מהעמוד שנלחץ (בלי החלפת טאב) */
  function setCaret(charIndex) {
    if (area.setSelectionRange) area.setSelectionRange(charIndex, charIndex);
    else area.selectionStart = area.selectionEnd = charIndex;
    fireCaret();
  }

  function setText(text) {
    area.value = String(text != null ? text : '');
    updateCounters();
  }
  function getText() { return area.value; } // מקור נקי — סמנים אינם חלק ממנו (F-01)

  setText('');
  return { root, setText, getText, setPageBreaks, updateCounters, setCaret, textarea: area, docxButton: btnDocx };
}

module.exports = { buildEditorTab };

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
__modules["src/ui/settings-panel.js"] = function (require, module, exports) {
// src/ui/settings-panel.js — פאנל ההגדרות: 12 פאנלים (Z2), אקורדיון, חיפוש, איפוס, תבניות (REQ-UI-01/07)
'use strict';

/**
 * נבנה מ־bindings.generated.js בלבד (מקור יחיד — הרישום). DOM-agnostic:
 * מקבל doc דמוי־document (האותו חוזה כמו dom-renderer) ולכן נבדק גם ב־Node.
 *
 * **F-06 (כלל ברזל):** אף מאזין של בקרה לא קורא למנוע. שינוי ⇒ onSettingChanged
 * בלבד; המדיניות (קל/כבד) נקבעת ב־app-shell דרך retypeset-policy. סריקת
 * call-graph (callgraph-scan.js) אוכפת זאת סטטית.
 */

const { BINDINGS, PANELS } = require('./bindings.generated');

/** גופני בסיס (לפני טעינת הקטלוג) — preserve-missing-value (IMUD port). */
const KNOWN_FONTS = ['Frank Ruhl Libre', 'David HB', 'David', 'Narkisim', 'Nachlieli', 'Alef', 'Rubin'];
let fontCatalogFamilies = null; // **03.11:** קטלוג 439 הפונטים של IMUD (ברגע שנטען)

/** בניית בקרה אחת לפי סוג ההגדרה. מחזיר את אלמנט הבקרה (בלי שורת התווית). */
function buildControl(doc, b, value, onChange) {
  let el;
  if (b.type === 'bool') {
    el = doc.createElement('input');
    el.setAttribute('type', 'checkbox');
    el.checked = !!value;
    el.addEventListener('change', () => onChange(el.checked));
  } else if (b.type === 'enum') {
    el = doc.createElement('select');
    for (const opt of (b.enum || [])) {
      const o = doc.createElement('option');
      o.setAttribute('value', String(opt));
      o.textContent = String(opt);
      el.appendChild(o);
    }
    el.value = String(value);
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'number') {
    el = doc.createElement('input');
    el.setAttribute('type', 'number');
    if (b.min != null) el.setAttribute('min', String(b.min));
    if (b.max != null) el.setAttribute('max', String(b.max));
    if (b.step != null) el.setAttribute('step', String(b.step));
    el.value = String(value);
    el.addEventListener('change', () => {
      const n = Number(el.value);
      onChange(Number.isFinite(n) ? n : value);
    });
  } else if (b.type === 'color') {
    el = doc.createElement('input');
    el.setAttribute('type', 'color');
    el.value = String(value || '#ffffff');
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'font') {
    // font-picker preserve-missing-value (IMUD port): ערך שאינו ברשימה נשמר כאפשרות.
    // **03.11:** כשקטלוג IMUD נטען — 439 המשפחות מופיעות בכל בוררי הגופנים.
    const families = fontCatalogFamilies || KNOWN_FONTS;
    el = doc.createElement('select');
    const opts = families.includes(value) ? families : [String(value), ...families];
    for (const f of opts) {
      const o = doc.createElement('option');
      o.setAttribute('value', f);
      o.textContent = f;
      el.appendChild(o);
    }
    el.value = String(value);
    el.addEventListener('change', () => onChange(el.value));
  } else { // string / asset / ornament
    el = doc.createElement('input');
    el.setAttribute('type', 'text');
    el.value = String(value != null ? value : '');
    el.addEventListener('change', () => onChange(el.value));
  }
  el.dataset.key = b.id;
  el.dataset.control = b.control; // מזהה הפקד — חוזה הרישום (three-layer)
  el.setAttribute('aria-label', b.labelHe);
  el.className = 'ctl';
  return el;
}

/**
 * בניית לשונית ההגדרות.
 * @param {object} opts - { getSettings, onSettingChanged(key,value), onResetField(key),
 *   onSaveTemplate(), onLoadTemplate(), onOpenBuilder(), onOpenImports() }
 */
function buildSettingsTab(doc, opts) {
  const getSettings = opts.getSettings;
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'settings';

  // ---- סרגל עליון: חיפוש + תבניות ----
  const bar = doc.createElement('div');
  bar.className = 'settings-bar';
  const search = doc.createElement('input');
  search.setAttribute('type', 'search');
  search.setAttribute('placeholder', 'חיפוש הגדרה לפי שם עברי, מזהה או פקד…');
  search.setAttribute('aria-label', 'חיפוש הגדרות');
  search.className = 'settings-search';
  const saveBtn = doc.createElement('button');
  saveBtn.type = 'button'; saveBtn.className = 'btn btn--ghost'; saveBtn.textContent = '💾 שמור תבנית';
  saveBtn.setAttribute('aria-label', 'שמור תבנית הגדרות');
  saveBtn.addEventListener('click', () => opts.onSaveTemplate && opts.onSaveTemplate());
  const loadBtn = doc.createElement('button');
  loadBtn.type = 'button'; loadBtn.className = 'btn btn--ghost'; loadBtn.textContent = '📂 טען תבנית';
  loadBtn.setAttribute('aria-label', 'טען תבנית הגדרות');
  loadBtn.addEventListener('click', () => opts.onLoadTemplate && opts.onLoadTemplate());
  bar.appendChild(search); bar.appendChild(saveBtn); bar.appendChild(loadBtn);
  root.appendChild(bar);

  // ---- אקורדיון 12 הפאנלים ----
  const accordion = doc.createElement('div');
  accordion.className = 'accordion';
  const fieldRows = []; // לסינון חיפוש: {row, label, id, control, panelBody, header}

  const byPanel = new Map();
  for (const b of BINDINGS) {
    if (!byPanel.has(b.panel)) byPanel.set(b.panel, []);
    byPanel.get(b.panel).push(b);
  }

  for (const p of PANELS) {
    const section = doc.createElement('div');
    section.className = 'acc-panel';
    section.dataset.panelKey = p.key;

    const header = doc.createElement('button');
    header.type = 'button';
    header.className = 'acc-header';
    header.setAttribute('aria-expanded', 'false');
    const items = p.kind === 'settings' ? (byPanel.get(p.label) || []) : [];
    const title = doc.createElement('span');
    title.className = 'acc-title';
    title.textContent = `${p.label}${items.length ? ` (${items.length})` : ''}`;
    const chev = doc.createElement('span');
    chev.className = 'acc-chevron'; chev.textContent = '▾';
    header.appendChild(title); header.appendChild(chev);

    const body = doc.createElement('div');
    body.className = 'acc-body';
    body.setAttribute('role', 'group');
    body.setAttribute('aria-label', p.label);

    if (p.kind === 'action') {
      // פאנלי־פעולה (Z2): בורר עיצובים (BUILDER) / ייבוא תוספים (IMPORTS)
      // **03.11 (EXT-14):** הבורר פונקציונלי — עיצובי שערים ועיטורים מספריית IMUD
      // + כפתור ברירות המחדל המקוריות (default_settings.json מלא 264 מפתחות).
      const info = doc.createElement('p');
      info.className = 'action-info';
      info.textContent = p.key === 'BUILDER'
        ? 'ספריית הפרויקט המקורי — שערים, עיטורים ומפרידים מעוצבים, וברירות המחדל המקוריות. הבחירה נשמרת כהפניית imud: ומופעלת בעימוד.'
        : 'ייבוא תוספים — עמודים מותאמים, סגנונות טקסט ותמונות (JSON). מנוע ההרחבות המלא נבנה ב־S11; הכניסה נעולה בהתאם.';
      body.appendChild(info);
      if (p.key === 'BUILDER' && opts.imudLibrary) {
        body.appendChild(buildImudPicker(doc, opts));
      } else {
        const act = doc.createElement('button');
        act.type = 'button'; act.className = 'btn';
        act.textContent = p.key === 'BUILDER' ? '🛠 פתח את הבונה' : '📦 פתח את הייבוא';
        act.disabled = p.key === 'IMPORTS' || p.key === 'BUILDER'; // בורר IMUD חי לעיל; ייבוא — מוזרק חיצונית
        act.setAttribute('aria-label', p.label);
        act.addEventListener('click', () => {
          if (p.key === 'BUILDER' && opts.onOpenBuilder) opts.onOpenBuilder();
          if (p.key === 'IMPORTS' && opts.onOpenImports) opts.onOpenImports();
        });
        body.appendChild(act);
      }
    } else {
      for (const b of items) {
        const settings = getSettings();
        const value = settings[b.id];
        const row = doc.createElement('div');
        row.className = 'field-row';
        row.dataset.key = b.id;
        const lbl = doc.createElement('label');
        lbl.className = 'field-label';
        lbl.textContent = b.labelHe;
        lbl.setAttribute('for', `ctl-${b.control}`);
        const ctl = buildControl(doc, b, value, (v) => opts.onSettingChanged(b.id, v));
        ctl.setAttribute('id', `ctl-${b.control}`);
        const reset = doc.createElement('button');
        reset.type = 'button';
        reset.className = 'btn btn--icon field-reset';
        reset.textContent = '↺';
        reset.title = `אפס לברירת המחדל (${b.def})`;
        reset.setAttribute('aria-label', `אפס ${b.labelHe} לברירת המחדל`);
        reset.addEventListener('click', () => opts.onResetField && opts.onResetField(b.id));
        row.appendChild(lbl); row.appendChild(ctl); row.appendChild(reset);
        if (b.note) {
          const note = doc.createElement('div');
          note.className = 'field-note';
          note.textContent = b.note;
          row.appendChild(note);
        }
        body.appendChild(row);
        fieldRows.push({ row, label: b.labelHe, id: b.id, control: b.control, body, header, section });
      }
    }

    header.addEventListener('click', () => {
      const open = section.classList.toggle('open');
      header.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    section.appendChild(header);
    section.appendChild(body);
    accordion.appendChild(section);
  }
  root.appendChild(accordion);

  // ---- חיפוש: לפי תווית עברית / מזהה / פקד; פותח את הפאנלים הרלוונטיים ----
  let searchHits = 0;
  search.addEventListener('input', () => {
    const q = (search.value || '').trim().toLowerCase();
    searchHits = 0;
    const openedPanels = new Set();
    for (const fr of fieldRows) {
      const hit = !q || fr.label.toLowerCase().includes(q) || fr.id.toLowerCase().includes(q) || fr.control.toLowerCase().includes(q);
      fr.row.classList.toggle('hidden', !hit);
      if (hit && q) { searchHits++; openedPanels.add(fr.section); }
    }
    // פתיחת פאנלים עם תוצאות (כשמחפשים); סגירה כשהחיפוש מתרוקן
    for (const sec of Array.from(accordion.children)) {
      const isHit = openedPanels.has(sec);
      if (q) {
        sec.classList.toggle('open', isHit);
        const h = sec.children[0];
        if (h && h.setAttribute) h.setAttribute('aria-expanded', isHit ? 'true' : 'false');
        sec.classList.toggle('dimmed', !isHit);
      } else {
        sec.classList.remove('dimmed');
      }
    }
  });

  /** ריענון ערכי הבקרות אחרי שינוי חיצוני (טעינת תבנית/איפוס). */
  function refreshValues() {
    const settings = getSettings();
    for (const fr of fieldRows) {
      const ctl = fr.row.querySelector('.ctl');
      if (!ctl) continue;
      const b = BINDINGS.find(x => x.id === fr.id);
      const v = settings[fr.id];
      if (b.type === 'bool') ctl.checked = !!v;
      else ctl.value = String(v != null ? v : '');
    }
  }

  /** **03.11 (EXT-14):** עדכון קטלוג הפונטים (439 משפחות IMUD) — בוררי הגופנים
   * נבנים מחדש עם הקטלוג המלא, בשימור הערך הנוכחי. */
  function refreshFontCatalog(families) {
    if (!Array.isArray(families) || !families.length) return;
    fontCatalogFamilies = families.slice();
    const settings = getSettings();
    for (const fr of fieldRows) {
      const b = BINDINGS.find(x => x.id === fr.id);
      if (!b || b.type !== 'font') continue;
      const old = fr.row.querySelector('.ctl');
      if (!old) continue;
      const fresh = buildControl(doc, b, settings[fr.id], (v) => opts.onSettingChanged(b.id, v));
      fresh.setAttribute('id', `ctl-${b.control}`);
      old.parentNode.replaceChild(fresh, old);
    }
  }

  root.appendChild(Object.assign(doc.createElement('div'), { className: 'settings-count', textContent: `${BINDINGS.length} הגדרות ב־12 פאנלים` }));

  return { root, refreshValues, refreshFontCatalog, searchInput: search, getSearchHits: () => searchHits };
}

/** **03.11 (EXT-14):** בורר עיצובי IMUD — שערים/עיטורים/מפרידים + ברירות המקור.
 * בחירה ⇒ רישום העיצוב בשני הצדדים (UI+Worker) ואז onSettingChanged עם ההפניה
 * המלאה. הפעלת מצב תמונה לעיטורים אוטומטית (h2-orn-*=image). */
function buildImudPicker(doc, opts) {
  const wrap = doc.createElement('div');
  wrap.className = 'imud-picker';
  const note = doc.createElement('div');
  note.className = 'action-info';
  note.textContent = 'טוען את רשימות העיצוב מהספרייה המוטמעת…';
  wrap.appendChild(note);

  const PICKS = [
    { label: 'שער ראשי', collection: 'shaar-main', setting: 'imud-shaar-main' },
    { label: 'שער משנה', collection: 'shaar-sub', setting: 'imud-shaar-sub' },
    { label: 'שער אחורי', collection: 'shaar-back', setting: 'imud-shaar-back' },
    { label: 'עיטור עליון (H2)', collection: 'orn-ud', setting: 'imud-orn-top', imageMode: 'h2-orn-top' },
    { label: 'עיטור תחתון (H2)', collection: 'orn-ud', setting: 'imud-orn-bottom', imageMode: 'h2-orn-bottom' },
    { label: 'עיטור צדדי', collection: 'orn-lr', setting: 'imud-orn-side' },
    { label: 'עיטור סיום פרק', collection: 'orn-ud', setting: 'imud-chapter-end', imageMode: 'chapter-end-ornament' },
    { label: 'מפריד מעוצב', collection: 'divider', setting: 'imud-divider' }
  ];

  const selects = [];
  for (const pick of PICKS) {
    const row = doc.createElement('div');
    row.className = 'field-row';
    const lbl = doc.createElement('label');
    lbl.className = 'field-label';
    lbl.textContent = pick.label;
    const sel = doc.createElement('select');
    sel.className = 'ctl';
    sel.setAttribute('aria-label', pick.label);
    sel.appendChild(Object.assign(doc.createElement('option'), { textContent: '— ללא —', value: '' }));
    sel.addEventListener('change', async () => {
      const id = sel.value;
      if (!id) { opts.onSettingChanged(pick.setting, ''); return; }
      try {
        const ref = await opts.imudLibrary.ensureDesign(pick.collection, id);
        if (!ref) throw new Error('העיצוב לא נמצא בספרייה');
        if (pick.imageMode) opts.onSettingChanged(pick.imageMode, 'image');
        opts.onSettingChanged(pick.setting, ref);
      } catch (e) {
        sel.value = '';
        if (opts.onNotice) opts.onNotice('בחירת העיצוב נכשלה: ' + (e && e.message ? e.message : e));
      }
    });
    row.appendChild(lbl); row.appendChild(sel);
    wrap.appendChild(row);
    selects.push({ pick, sel });
  }

  // כפתור ברירות המחדל המקוריות — ייבוא 264 המפתחות דרך טבלת ה-disposition
  const defaultsBtn = doc.createElement('button');
  defaultsBtn.type = 'button'; defaultsBtn.className = 'btn';
  defaultsBtn.textContent = '📖 החל ברירות מחדל מקוריות (IMUD)';
  defaultsBtn.setAttribute('aria-label', 'החלת ברירות המחדל של הפרויקט המקורי');
  defaultsBtn.addEventListener('click', async () => {
    try {
      const { settings, report } = await opts.imudLibrary.loadLegacyDefaults();
      if (opts.onApplyLegacyDefaults) opts.onApplyLegacyDefaults(settings);
      if (opts.onNotice) opts.onNotice(`ברירות המקור הוחלו — ${report.mapped} הגדרות מופו, ${report.merged} אוחדו, ${report.removed} במעקב מתועד.`);
    } catch (e) {
      if (opts.onNotice) opts.onNotice('טעינת ברירות המקור נכשלה: ' + (e && e.message ? e.message : e));
    }
  });
  wrap.appendChild(defaultsBtn);

  // טעינת רשימות העיצובים (עצלה — לפי אוסף)
  (async () => {
    try {
      const byCollection = new Map();
      for (const { pick, sel } of selects) {
        if (!byCollection.has(pick.collection)) {
          byCollection.set(pick.collection, await opts.imudLibrary.listDesigns(pick.collection));
        }
        const items = byCollection.get(pick.collection);
        for (const it of items) {
          const o = doc.createElement('option');
          o.setAttribute('value', it.id);
          o.textContent = `${it.name} (${it.id})`;
          sel.appendChild(o);
        }
      }
      note.textContent = `${selects.length} בוררי עיצוב מהספרייה המוטמעת.`;
    } catch (e) {
      note.textContent = 'ספריית העיצובים לא נטענה: ' + (e && e.message ? e.message : e);
    }
  })();

  return wrap;
}

module.exports = { buildSettingsTab, BINDINGS, PANELS };

};
__modules["src/ui/bindings.generated.js"] = function (require, module, exports) {
// src/ui/bindings.generated.js — **נוצר אוטומטית** ע"י tools/gen-ui-bindings.js (אין לערוך ידנית)
// מקור: src/engine/core/settings-registry.js. מכיל מילולית את כל מזהי הפקדים —
// דרישת סורק dead-control (REQ-GOV-04) — ותוויות עבריות לחיפוש ההגדרות (REQ-UI-07).
// רינדור: settings-panel.js בונה את 12 הפאנלים (Z2) מהמניפסט הזה בלבד.
'use strict';

const BINDINGS = [
  {
    "id": "page-size",
    "control": "sel-page-size",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "גודל עמוד",
    "type": "enum",
    "def": "A4",
    "enum": [
      "A4",
      "A5",
      "16x16",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "grid-col-width-pct",
    "control": "rng-col-width",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "רוחב טור (%)",
    "type": "number",
    "def": 40,
    "enum": null,
    "min": 20,
    "max": 60,
    "step": null,
    "note": null
  },
  {
    "id": "grid-margin-side-pct",
    "control": "rng-margin-side",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "שוליים צדדיים (%)",
    "type": "number",
    "def": 7.5,
    "enum": null,
    "min": 2,
    "max": 20,
    "step": null,
    "note": null
  },
  {
    "id": "grid-gutter-pct",
    "control": "rng-gutter",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מרווח בין טורים (%)",
    "type": "number",
    "def": 2,
    "enum": null,
    "min": 0.5,
    "max": 8,
    "step": null,
    "note": null
  },
  {
    "id": "grid-block-gap-pct",
    "control": "rng-block-gap",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מרווח בין בלוקים (%)",
    "type": "number",
    "def": 2,
    "enum": null,
    "min": 0,
    "max": 8,
    "step": null,
    "note": null
  },
  {
    "id": "margin-top-px",
    "control": "rng-margin-top",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "שוליים עליונים (px)",
    "type": "number",
    "def": 20,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "margin-bottom-px",
    "control": "rng-margin-bottom",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "שוליים תחתונים (px)",
    "type": "number",
    "def": 20,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "binding-offset-px",
    "control": "rng-binding-offset",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "שולי תפירה (px)",
    "type": "number",
    "def": 0,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שולי תפירה א־סימטריים recto/verso"
  },
  {
    "id": "h2-top-offset",
    "control": "rng-h2-top-offset",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מרחק עליון H2 (px)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "PT-05: מרחק עליון נפרד H2"
  },
  {
    "id": "column-divider-style",
    "control": "sel-col-divider",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "סגנון מפריד טורים",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "thin",
      "dashed",
      "double"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "גובה = Math.min(שני הטורים) − 8px"
  },
  {
    "id": "page-num-format",
    "control": "sel-page-num-format",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "תבנית מספור עמודים",
    "type": "enum",
    "def": "hebrew",
    "enum": [
      "hebrew",
      "decimal",
      "daf-hebrew"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "page-num-frame",
    "control": "sel-page-num-frame",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מסגרת מספר עמוד",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "circle",
      "square",
      "parenthesis",
      "squares",
      "floral",
      "diamond"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "page-num-position",
    "control": "sel-page-num-position",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מיקום מספר עמוד",
    "type": "enum",
    "def": "bottom-center",
    "enum": [
      "bottom-center",
      "outer-left",
      "outer-right",
      "top",
      "in-header",
      "none"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "page-num-initial-value",
    "control": "inp-page-num-initial",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "ערך התחלתי של מספור",
    "type": "number",
    "def": 1,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שוחזר מ‑V1 (REQ-HDR-03)"
  },
  {
    "id": "page-num-start-idx",
    "control": "inp-page-num-start-idx",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "עמוד תחילת התצוגה (סוד)",
    "type": "number",
    "def": 1,
    "enum": null,
    "min": 1,
    "max": 999,
    "step": null,
    "note": "שוחזר מ‑V1 (REQ-HDR-03): סוד העמוד הנספר שממנו מתחיל התצוגה"
  },
  {
    "id": "count-shaar-pages",
    "control": "chk-count-shaar",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מניית עמודי שער במספור",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "count-toc-pages",
    "control": "chk-count-toc",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מניית עמודי תוכן־עניינים",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "count-endnote-pages",
    "control": "chk-count-endnotes",
    "panel": "רשת העמוד ומספור",
    "panelKey": "GRID",
    "labelHe": "מניית עמודי הערות־סיום",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "S7.1.1: אם true — עמודי הערות נספרים במספור ומקבלים גיליון"
  },
  {
    "id": "body-font",
    "control": "sel-body-font",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "גופן גוף הטקסט",
    "type": "font",
    "def": "Frank Ruhl Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "font-picker preserve-missing-value (IMUD port)"
  },
  {
    "id": "body-font-size-pt",
    "control": "rng-body-size",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "גודל גוף הטקסט (pt)",
    "type": "number",
    "def": 14,
    "enum": null,
    "min": 9,
    "max": 24,
    "step": null,
    "note": null
  },
  {
    "id": "body-line-height",
    "control": "rng-body-lh",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "גובה שורה (יחס)",
    "type": "number",
    "def": 1.4,
    "enum": null,
    "min": 1.2,
    "max": 1.6,
    "step": null,
    "note": "פלפול 1.25 / קריאה 1.45"
  },
  {
    "id": "paren-style-scale",
    "control": "rng-paren-scale",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "סקאלת סוגריים",
    "type": "number",
    "def": 1,
    "enum": null,
    "min": 0.8,
    "max": 1,
    "step": 0.01,
    "note": "מילים בתוך (...) נמדדות בסקאלה זו לפני שבירת שורות ומרונדרות במחלקת w--paren; 1.0 = כבוי"
  },
  {
    "id": "first-word-mode",
    "control": "sel-first-word-mode",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "אופן מילה ראשונה",
    "type": "enum",
    "def": "drop",
    "enum": [
      "drop",
      "inline",
      "bold",
      "none"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "first-word-length",
    "control": "sel-first-word-len",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "אורך מילה ראשונה (מילים)",
    "type": "number",
    "def": 1,
    "enum": [
      1,
      2
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "first-word-threshold-lines",
    "control": "rng-fw-threshold",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "סף שורות למילה ראשונה",
    "type": "number",
    "def": 3,
    "enum": null,
    "min": 2,
    "max": 6,
    "step": null,
    "note": null
  },
  {
    "id": "first-word-align-cap-top",
    "control": "chk-fw-cap-align",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "יישור מילה ראשונה לקו בסיס גוף",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-LB-05: קצה עליון לקו בסיס גוף — לא baseline"
  },
  {
    "id": "first-word-size-em",
    "control": "rng-fw-size-em",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "first-word-size-em",
    "type": "number",
    "def": 2,
    "enum": null,
    "min": 1,
    "max": 4,
    "step": 0.1,
    "note": "S4.5: גודל המילה הראשונה ב-em (המקור: size-first-word=1.5; בעבר היה כפול 2 מוקשה)"
  },
  {
    "id": "first-word-font",
    "control": "sel-fw-font",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "first-word-font",
    "type": "font",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "S4.5: גופן נפרד למילה הראשונה (המקור: font-first-word=FrankReal); ריק = גופן הגוף"
  },
  {
    "id": "dh-auto-detect",
    "control": "chk-dh-detect",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "זיהוי אוטומטי של דיבור־המתחיל",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "דיבור המתחיל עד נקודה/מקף"
  },
  {
    "id": "dh-font",
    "control": "sel-dh-font",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "גופן דיבור־המתחיל",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "body-last-line-align",
    "control": "sel-last-line-align",
    "panel": "טיפוגרפיה וגוף הטקסט",
    "panelKey": "TYPO",
    "labelHe": "יישור שורה אחרונה בפסקה",
    "type": "enum",
    "def": "center",
    "enum": [
      "center",
      "right",
      "stretch"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "wiring מ‑Orange ✓"
  },
  {
    "id": "heading-0-mode",
    "control": "sel-h0-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת אפס — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-0-font",
    "control": "sel-h0-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת אפס — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-0-size-pt",
    "control": "rng-h0-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת אפס — גודל (pt)",
    "type": "number",
    "def": 20,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-1-mode",
    "control": "sel-h1-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 1 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-1-font",
    "control": "sel-h1-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 1 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-1-size-pt",
    "control": "rng-h1-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 1 — גודל (pt)",
    "type": "number",
    "def": 18,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-2-mode",
    "control": "sel-h2-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 2 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-2-font",
    "control": "sel-h2-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 2 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-2-size-pt",
    "control": "rng-h2-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 2 — גודל (pt)",
    "type": "number",
    "def": 16,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-3-mode",
    "control": "sel-h3-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 3 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-3-font",
    "control": "sel-h3-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 3 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-3-size-pt",
    "control": "rng-h3-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 3 — גודל (pt)",
    "type": "number",
    "def": 15,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-4-mode",
    "control": "sel-h4-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 4 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-4-font",
    "control": "sel-h4-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 4 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-4-size-pt",
    "control": "rng-h4-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 4 — גודל (pt)",
    "type": "number",
    "def": 14,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-5-mode",
    "control": "sel-h5-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 5 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-5-font",
    "control": "sel-h5-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 5 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-5-size-pt",
    "control": "rng-h5-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 5 — גודל (pt)",
    "type": "number",
    "def": 14,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-6-mode",
    "control": "sel-h6-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 6 — אופן",
    "type": "enum",
    "def": "full-width",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-6-font",
    "control": "sel-h6-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 6 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-6-size-pt",
    "control": "rng-h6-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 6 — גודל (pt)",
    "type": "number",
    "def": 13,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "heading-7-mode",
    "control": "sel-h7-mode",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 7 — אופן",
    "type": "enum",
    "def": "side-note",
    "enum": [
      "full-width",
      "regular",
      "side-note",
      "new-page"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-7-font",
    "control": "sel-h7-font",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 7 — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "heading-7-size-pt",
    "control": "rng-h7-size",
    "panel": "כותרות 0–7",
    "panelKey": "HEADINGS",
    "labelHe": "כותרת 7 — גודל (pt)",
    "type": "number",
    "def": 12,
    "enum": null,
    "min": 8,
    "max": 48,
    "step": null,
    "note": null
  },
  {
    "id": "hdr-h1-title-mode",
    "control": "sel-hdr-h1-mode",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "אופן כותרת H1 בכותרת עליונה",
    "type": "enum",
    "def": "main",
    "enum": [
      "main",
      "full"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "K-8: main כברירת מחדל + toggle"
  },
  {
    "id": "header-enabled",
    "control": "chk-header-enabled",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "כותרות עליונות מופעלות",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-source",
    "control": "sel-hr-right",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — מקור ימין",
    "type": "enum",
    "def": "book-name",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-source",
    "control": "sel-hr-center",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — מקור מרכז",
    "type": "enum",
    "def": "h2",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-source",
    "control": "sel-hr-left",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — מקור שמאל",
    "type": "enum",
    "def": "h1",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-source",
    "control": "sel-hv-right",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — מקור ימין",
    "type": "enum",
    "def": "h1",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-source",
    "control": "sel-hv-center",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — מקור מרכז",
    "type": "enum",
    "def": "h2",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-source",
    "control": "sel-hv-left",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — מקור שמאל",
    "type": "enum",
    "def": "book-name",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-same-as-recto",
    "control": "chk-hv-same",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי זהה לימני",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "same_as_even + גידוע מעגליות (Orange c49b79e) — resolveSameAs עם seen-set"
  },
  {
    "id": "header-separator-line",
    "control": "sel-header-sep",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "קו הפרדה בכותרת עליונה",
    "type": "enum",
    "def": "gray",
    "enum": [
      "none",
      "gray",
      "black"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-opening-dedicated",
    "control": "chk-hdr-opening",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "כותרת ייעודית לעמודי פתיחה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-HDR-02: עמוד הנפתח בכותרת H2/H3 מקבל את שלושת סלוטי הפתיחה שלהלן"
  },
  {
    "id": "header-opening-right-source",
    "control": "sel-ho-right",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "פתיחה — מקור ימין",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-opening-center-source",
    "control": "sel-ho-center",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "פתיחה — מקור מרכז",
    "type": "enum",
    "def": "book-name",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-opening-left-source",
    "control": "sel-ho-left",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "פתיחה — מקור שמאל",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "book-name",
      "book-name-rest",
      "h1",
      "h2",
      "page-num",
      "first-word",
      "last-word",
      "first-last-words",
      "custom"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-align",
    "control": "sel-hrright-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט ימין — יישור",
    "type": "enum",
    "def": "right",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-width-pct",
    "control": "rng-hrright-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט ימין — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-font",
    "control": "sel-hrright-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט ימין — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-size-pt",
    "control": "rng-hrright-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט ימין — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-right-custom-text",
    "control": "inp-hrright-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט ימין — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-align",
    "control": "sel-hrcenter-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט מרכז — יישור",
    "type": "enum",
    "def": "center",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-width-pct",
    "control": "rng-hrcenter-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט מרכז — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-font",
    "control": "sel-hrcenter-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט מרכז — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-size-pt",
    "control": "rng-hrcenter-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט מרכז — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-center-custom-text",
    "control": "inp-hrcenter-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט מרכז — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-align",
    "control": "sel-hrleft-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט שמאל — יישור",
    "type": "enum",
    "def": "left",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-width-pct",
    "control": "rng-hrleft-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט שמאל — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-font",
    "control": "sel-hrleft-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט שמאל — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-size-pt",
    "control": "rng-hrleft-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט שמאל — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-recto-left-custom-text",
    "control": "inp-hrleft-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד ימני — סלוט שמאל — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-align",
    "control": "sel-hvright-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט ימין — יישור",
    "type": "enum",
    "def": "right",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-width-pct",
    "control": "rng-hvright-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט ימין — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-font",
    "control": "sel-hvright-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט ימין — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-size-pt",
    "control": "rng-hvright-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט ימין — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-right-custom-text",
    "control": "inp-hvright-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט ימין — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-align",
    "control": "sel-hvcenter-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט מרכז — יישור",
    "type": "enum",
    "def": "center",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-width-pct",
    "control": "rng-hvcenter-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט מרכז — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-font",
    "control": "sel-hvcenter-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט מרכז — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-size-pt",
    "control": "rng-hvcenter-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט מרכז — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-center-custom-text",
    "control": "inp-hvcenter-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט מרכז — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-align",
    "control": "sel-hvleft-align",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט שמאל — יישור",
    "type": "enum",
    "def": "left",
    "enum": [
      "right",
      "center",
      "left"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-width-pct",
    "control": "rng-hvleft-width",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט שמאל — רוחב (%)",
    "type": "number",
    "def": 33,
    "enum": null,
    "min": 5,
    "max": 90,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-font",
    "control": "sel-hvleft-font",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט שמאל — גופן",
    "type": "font",
    "def": "David HB",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-size-pt",
    "control": "rng-hvleft-size",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט שמאל — גודל (pt)",
    "type": "number",
    "def": 11,
    "enum": null,
    "min": 6,
    "max": 28,
    "step": null,
    "note": null
  },
  {
    "id": "header-verso-left-custom-text",
    "control": "inp-hvleft-custom",
    "panel": "כותרות עליונות",
    "panelKey": "HEADERS",
    "labelHe": "עמוד שמאלי — סלוט שמאל — טקסט מותאם",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "note-placement-mode",
    "control": "sel-note-mode",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "אופן הצבת הערות",
    "type": "enum",
    "def": "footnotes",
    "enum": [
      "footnotes",
      "endnotes",
      "inline"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "footnotes-enabled",
    "control": "chk-fn-enabled",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "הערות שוליים מופעלות",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "D-39: קלט משתמש מפורש גובר על נגזרות; mode=footnotes + false ⇒ ההערות בגוף כplaceholder"
  },
  {
    "id": "footnote-marker-style",
    "control": "sel-fn-marker",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "סגנון סמן הערה",
    "type": "enum",
    "def": "hebrew-geresh",
    "enum": [
      "hebrew-geresh",
      "parenthesis",
      "asterisk",
      "decimal"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "footnote-reset-policy",
    "control": "sel-fn-reset",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "מדיניות איפוס מונה הערות",
    "type": "enum",
    "def": "page",
    "enum": [
      "continuous",
      "page",
      "section",
      "part"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "footnote-columns",
    "control": "sel-fn-cols",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "מספר טורי הערות שוליים",
    "type": "number",
    "def": 1,
    "enum": [
      1,
      2
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "footnote-separator-rule",
    "control": "sel-fn-rule",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "קו הפרדה של סרגל הערות",
    "type": "enum",
    "def": "regular",
    "enum": [
      "none",
      "regular",
      "circles",
      "sparkle",
      "star",
      "diamond"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "fn-layout-mode",
    "control": "sel-fn-layout",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "אופן פריסת הערות (בלוק/רציף)",
    "type": "enum",
    "def": "block",
    "enum": [
      "block",
      "continuous"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-FN-07 (D-34): block=כל הערה בלוק משלה + תקרת fn-bar; continuous=זרימה רציפה בלי תקרה"
  },
  {
    "id": "endnotes-enabled",
    "control": "chk-endnotes",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "הערות סיום מופעלות",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "נגזר מ‑note-placement-mode=endnotes (D-39); קלט ישן true ממופה ל‑mode=endnotes בהגירה (project-io)"
  },
  {
    "id": "endnote-title-text",
    "control": "inp-endnote-title",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "כותרת עמודי הערות",
    "type": "string",
    "def": "הערות",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "endnote-columns",
    "control": "sel-en-cols",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "מספר טורי הערות־סיום",
    "type": "number",
    "def": 1,
    "enum": [
      1,
      2
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "S7.1.1: טור אחד או שניים בעמודי הערות"
  },
  {
    "id": "f-note-body-font",
    "control": "sel-fnote-body-font",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "גופן גוף הערת־שוליים",
    "type": "font",
    "def": "Frank Ruhl Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "s-note-body-font",
    "control": "sel-snote-body-font",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "גופן גוף הערת־צד",
    "type": "font",
    "def": "Frank Ruhl Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "fn-bar-max-height-px",
    "control": "rng-fn-bar-max",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "תקרת גובה סרגל הערות (px)",
    "type": "number",
    "def": 220,
    "enum": null,
    "min": 40,
    "max": 600,
    "step": null,
    "note": "S7.1.3: תקרת מרזב — חריגה מפעילה אסדרה לפי long-footnote-policy (block mode בלבד, D-34)"
  },
  {
    "id": "long-footnote-policy",
    "control": "sel-long-fn",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "מדיניות הערה ארוכה",
    "type": "enum",
    "def": "split",
    "enum": [
      "split",
      "move-whole",
      "reject-to-body"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-FN-02; split=המשך במרזב העמוד הבא עם סימון המשך; reject-to-body=השבה מלאה לגוף (BRZ-15)"
  },
  {
    "id": "prevent-widows-top",
    "control": "chk-widow-top",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "מנע אלמנות בראש עמוד",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "טוגל נפרד לתחילת עמוד (Mapping #4)"
  },
  {
    "id": "prevent-widows-bottom",
    "control": "chk-widow-bottom",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "מנע אלמנות בסוף עמוד",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "prevent-orphans-top",
    "control": "chk-orphan-top",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "מנע יתומים בראש עמוד",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "prevent-orphans-bottom",
    "control": "chk-orphan-bottom",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "מנע יתומים בסוף עמוד",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "widow-strictness",
    "control": "sel-widow-strict",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "מחמירות אלמנות/יתומים",
    "type": "enum",
    "def": "normal",
    "enum": [
      "relaxed",
      "normal",
      "strict"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "runt-min-width-pct",
    "control": "rng-runt-min",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "רוחב מזערי לשורת־שדון (%)",
    "type": "number",
    "def": 50,
    "enum": null,
    "min": 20,
    "max": 80,
    "step": null,
    "note": null
  },
  {
    "id": "balance-chapter-end",
    "control": "sel-balance-chapter",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "איזון סוף פרק",
    "type": "enum",
    "def": "balance",
    "enum": [
      "balance",
      "stretch",
      "natural"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQUIRE: מנגנון מלא (שוחזר מ‑Green, REQ-BAL-03); נצרך בפועל ב‑pipeline בסוף כל חלק"
  },
  {
    "id": "allow-terminal-residual-fallback",
    "control": "chk-terminal-residual",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "שארית סופית מותרת כנפילה",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שוחזר מ‑Green (REQ-BAL-04)"
  },
  {
    "id": "imbalance-max-delta-px",
    "control": "rng-imbalance-max",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "סף אי־איזון טורים (px)",
    "type": "number",
    "def": 5,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-enabled",
    "control": "chk-aq",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "איכות אוטומטית (AQ) מופעלת",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "AutoQuality מ‑Gold — שלוש שכבות יחד (REQ-BAL-06); נקרא בפועל מהpipeline (תיקון P1-1)"
  },
  {
    "id": "aq-word-spacing-min",
    "control": "rng-aq-ws-min",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח מילים מזערי",
    "type": "number",
    "def": 0.95,
    "enum": null,
    "min": 0.8,
    "max": 1,
    "step": null,
    "note": null
  },
  {
    "id": "aq-word-spacing-max",
    "control": "rng-aq-ws-max",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח מילים מקסימלי",
    "type": "number",
    "def": 1.05,
    "enum": null,
    "min": 1,
    "max": 1.2,
    "step": null,
    "note": null
  },
  {
    "id": "aq-letter-spacing-min",
    "control": "rng-aq-ls-min",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח אותיות מזערי",
    "type": "number",
    "def": 0.97,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-letter-spacing-max",
    "control": "rng-aq-ls-max",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח אותיות מקסימלי",
    "type": "number",
    "def": 1.03,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-heading-spacing-min",
    "control": "rng-aq-hs-min",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח כותרות מזערי",
    "type": "number",
    "def": 0.95,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-heading-spacing-max",
    "control": "rng-aq-hs-max",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — ריווח כותרות מקסימלי",
    "type": "number",
    "def": 1.05,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-shared-load",
    "control": "chk-aq-shared",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — עומס משותף",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "aq-stretch-to-bottom",
    "control": "chk-aq-stretch",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — מתיחה עד תחתית",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "clamp overshoot 20px (REQ-BAL-07)"
  },
  {
    "id": "aq-overshoot-clamp-px",
    "control": "rng-aq-clamp",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — תקרת חריגה (px)",
    "type": "number",
    "def": 20,
    "enum": null,
    "min": 0,
    "max": 60,
    "step": null,
    "note": null
  },
  {
    "id": "aq-compress-first",
    "control": "chk-aq-compress",
    "panel": "איכות עימוד",
    "panelKey": "QUALITY",
    "labelHe": "AQ — כיווץ לפני מתיחה",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "h2-orn-scope",
    "control": "sel-h2-orn-scope",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "היקף עיטורי H2",
    "type": "enum",
    "def": "both",
    "enum": [
      "sign",
      "title",
      "both"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם"
  },
  {
    "id": "h2-orn-top",
    "control": "sel-h2-orn-top",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור עליון לסימן H2",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "pyramid",
      "lance",
      "shoshanta",
      "scroll",
      "image"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור עליון לסימן (V4: מצבים עצמאיים)"
  },
  {
    "id": "h2-orn-bottom",
    "control": "sel-h2-orn-bottom",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור תחתון לסימן H2",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "pyramid",
      "lance",
      "shoshanta",
      "scroll",
      "image"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור תחתון לסימן"
  },
  {
    "id": "h2-orn-side",
    "control": "sel-h2-orn-side",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור צד לכותרת H2",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "pyramid",
      "lance",
      "shoshanta",
      "scroll",
      "image"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור צדדי לכותרת (V4)"
  },
  {
    "id": "h2-orn-fit-to-text",
    "control": "chk-h2-orn-fit",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "התאמת עיטור H2 לטקסט",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-01: התאמת רוחב לטקסט במדידת JS — CSS fit-content נכשל (V3/V4); המידות נקבעות בהזמנת הפריסה (F-08)"
  },
  {
    "id": "h3-side-orn",
    "control": "sel-h3-side-orn",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטורי צד H3",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "pyramid",
      "lance",
      "shoshanta",
      "scroll"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-01: עיטורי צד H3 — התאמת גובה לשורה"
  },
  {
    "id": "h3-side-orn-height-em",
    "control": "rng-h3-side-orn-h",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "גובה עיטור צד H3 (em)",
    "type": "number",
    "def": 1,
    "enum": null,
    "min": 0.5,
    "max": 2,
    "step": 0.1,
    "note": "גובה ב־em; מקור שליטה יחיד — אין !important מול inline (F-09)"
  },
  {
    "id": "chapter-end-ornament",
    "control": "sel-chapter-end-orn",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור סוף פרק",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "pyramid",
      "lance",
      "shoshanta",
      "scroll",
      "image"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-03: פירמידת וילנא/רומח/שושנתא/סלסול/תמונה — התאמה לתקציב הפנוי; לעולם לא דוחף תוכן"
  },
  {
    "id": "chapter-end-ornament-w-em",
    "control": "rng-chapter-end-w",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "רוחב עיטור סוף פרק (em)",
    "type": "number",
    "def": 4,
    "enum": null,
    "min": 1,
    "max": 12,
    "step": null,
    "note": null
  },
  {
    "id": "chapter-end-ornament-h-em",
    "control": "rng-chapter-end-h",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "גובה עיטור סוף פרק (em)",
    "type": "number",
    "def": 1.2,
    "enum": null,
    "min": 0.3,
    "max": 4,
    "step": null,
    "note": null
  },
  {
    "id": "heading-dividers-h3-h6",
    "control": "chk-hdr-dividers",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "מפרידי כותרות H3–H6",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-04: fits() נמדד בכל אתרי ההוספה; בלי עיטור בראש טור/עמוד ריק; rollback-aware (Orange)"
  },
  {
    "id": "shaar-main-divider",
    "control": "sel-shaar-main-div",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "קו מפריד בשער ראשי",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "thin",
      "dashed",
      "double"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-04: קו מפריד בשער ראשי (PT-01)"
  },
  {
    "id": "shaar-sub-divider",
    "control": "sel-shaar-sub-div",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "קו מפריד בשער משנה",
    "type": "enum",
    "def": "none",
    "enum": [
      "none",
      "thin",
      "dashed",
      "double"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-04: קו מפריד בשער משנה (PT-02)"
  },
  {
    "id": "toc-general-enabled",
    "control": "chk-toc-general",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "תוכן־עניינים כללי מופעל",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-detail-enabled",
    "control": "chk-toc-detail",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "תוכן־עניינים מפורט מופעל",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "general-toc-count-numbering",
    "control": "chk-toc-count",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "מספור שורות תוכן כללי",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שוחזר מ‑V1/V2 (REQ-HDR-03/HDR-05)"
  },
  {
    "id": "detailed-toc-count-numbering",
    "control": "chk-dtoc-count",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "מספור שורות תוכן מפורט",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "S9: מספור שורות בתוכן־עניינים המפורט (Orange eb21383 — הושלם)"
  },
  {
    "id": "general-toc-show-numbering",
    "control": "chk-gtoc-show",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "תצוגת גיליון בעמודי תוכן כלליים",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "S9: עמודי תוכן־עניינים כלליים מציגים גיליון כשהם נספרים (count-toc-pages=true)"
  },
  {
    "id": "detailed-toc-show-numbering",
    "control": "chk-dtoc-show",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "תצוגת גיליון בעמודי תוכן מפורטים",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "S9: עמודי תוכן־עניינים מפורטים מציגים גיליון כשהם נספרים"
  },
  {
    "id": "toc-level-1-show",
    "control": "chk-toc-l1",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 1 — הצגה",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-1-inline",
    "control": "chk-toc-l1-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 1 — שורה משורטטת (inline)",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-2-show",
    "control": "chk-toc-l2",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 2 — הצגה",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-2-inline",
    "control": "chk-toc-l2-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 2 — שורה משורטטת (inline)",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-3-show",
    "control": "chk-toc-l3",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 3 — הצגה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-3-inline",
    "control": "chk-toc-l3-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 3 — שורה משורטטת (inline)",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-4-show",
    "control": "chk-toc-l4",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 4 — הצגה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-4-inline",
    "control": "chk-toc-l4-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 4 — שורה משורטטת (inline)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-5-show",
    "control": "chk-toc-l5",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 5 — הצגה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-5-inline",
    "control": "chk-toc-l5-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 5 — שורה משורטטת (inline)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-6-show",
    "control": "chk-toc-l6",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 6 — הצגה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-6-inline",
    "control": "chk-toc-l6-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 6 — שורה משורטטת (inline)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-7-show",
    "control": "chk-toc-l7",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 7 — הצגה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "toc-level-7-inline",
    "control": "chk-toc-l7-inline",
    "panel": "תוכן העניינים",
    "panelKey": "TOC",
    "labelHe": "רמת תוכן 7 — שורה משורטטת (inline)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "background-color",
    "control": "inp-bg-color",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "צבע רקע העמוד",
    "type": "color",
    "def": "#ffffff",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "background-opacity",
    "control": "rng-bg-opacity",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "אטימות רקע",
    "type": "number",
    "def": 1,
    "enum": null,
    "min": 0,
    "max": 1,
    "step": 0.05,
    "note": "נצרך בפועל: rgba() על background-color (תיקון P0-5 — בעבר נכתב לתכונת CSS בלתי קיימת)"
  },
  {
    "id": "theme-set-id",
    "control": "sel-theme-set",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "ערכת נושא פעילה",
    "type": "string",
    "def": "default",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-06: הפעלת ערכה מפעילה את שלושת השערים (F-10) דרך theme-sets.activateThemeSet"
  },
  {
    "id": "show-shaar-sub",
    "control": "chk-show-shaar-sub",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "הצג שער משנה",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "U-C2: \"הצג שער משנה\" — עמודי שער־משנה לפני כל פתיחת חלק"
  },
  {
    "id": "shaar-main-image",
    "control": "inp-shaar-main-img",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "תמונת שער ראשי",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "shaar-sub-image",
    "control": "inp-shaar-sub-img",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "תמונת שער משנה",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "shaar-back-enabled",
    "control": "chk-shaar-back",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער אחורי מופעל",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "PT-03: 4 מקטעים עצמאיים; כיבוי ראשי מבטל את כולם"
  },
  {
    "id": "background-page-type",
    "control": "sel-bg-page-type",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "מחלקת עמוד לרקע",
    "type": "enum",
    "def": "regular",
    "enum": [
      "regular",
      "preface-open",
      "sign-open"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-08: מחלקת העמוד שאליה הרקע מיועד (מיזוג פאנל רקע→נושאים)"
  },
  {
    "id": "background-image",
    "control": "inp-bg-image",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "תמונת רקע",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "background-texture",
    "control": "inp-bg-texture",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "טקסטורת רקע",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "טקסטורה חוזרת (שכבת תשתית — פטורה מחפיפות באודיט)"
  },
  {
    "id": "background-inset-mm",
    "control": "rng-bg-inset",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שקיעת רקע מהשוליים (מ״מ)",
    "type": "number",
    "def": 0,
    "enum": null,
    "min": 0,
    "max": 30,
    "step": null,
    "note": "שקיעת הרקע משולי העמוד במ״מ"
  },
  {
    "id": "imud-shaar-main",
    "control": "inp-imud-shaar-main",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "עיצוב שער ראשי (ספריית IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיצוב שער ראשי מספריית IMUD (הפניה imud:shaar-main:<id>) — מפעיל את עמודי השער"
  },
  {
    "id": "imud-shaar-sub",
    "control": "inp-imud-shaar-sub",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "עיצוב שער משנה (ספריית IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיצוב שער משנה מספריית IMUD (imud:shaar-sub:<id>)"
  },
  {
    "id": "imud-shaar-back",
    "control": "inp-imud-shaar-back",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "עיצוב שער אחורי (ספריית IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיצוב שער אחורי מספריית IMUD (imud:shaar-back:<id>)"
  },
  {
    "id": "imud-orn-top",
    "control": "inp-imud-orn-top",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור עליון H2 (IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור עליון לסימן H2 — עיצוב IMUD; דורש h2-orn-top=image"
  },
  {
    "id": "imud-orn-bottom",
    "control": "inp-imud-orn-bottom",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור תחתון H2 (IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור תחתון לסימן H2 — עיצוב IMUD; דורש h2-orn-bottom=image"
  },
  {
    "id": "imud-orn-side",
    "control": "inp-imud-orn-side",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור צדדי (IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור צדדי (H2/H3) — עיצורי IMUD; דורש h2-orn-side/h3-side-orn=image"
  },
  {
    "id": "imud-chapter-end",
    "control": "inp-imud-chapter-end",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "עיטור סיום פרק (IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "עיטור סיום־פרק — עיצוב IMUD; דורש chapter-end-ornament=image"
  },
  {
    "id": "imud-divider",
    "control": "inp-imud-divider",
    "panel": "עיטורים וגרפיקה",
    "panelKey": "ORNAMENTS",
    "labelHe": "מפריד מעוצב (IMUD)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מפריד סעיפים מעוצב (323 עיצובים) — משמש מפרידי שער/כותרות במצב תמונה"
  },
  {
    "id": "imud-book-title",
    "control": "inp-imud-book-title",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "כותרת הספר בשער (עקיפה)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "כותרת הספר בשער (עקיפת מטא-נתוני המסמך אם הוגדר)"
  },
  {
    "id": "imud-book-subtitle",
    "control": "inp-imud-book-subtitle",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "כותרת־משנה בשער",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "כותרת־משנה בשער"
  },
  {
    "id": "en-line-prefix",
    "control": "inp-en-line-prefix",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "קידומת הערת סיום (ריק = ביטול)",
    "type": "string",
    "def": "הערת סיום -",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שורה המתחילה בקידומת ⇒ הערת סיום (הקידומת אינה מופיעה בפלט). ריק = ביטול הזיהוי. הוראת כותרת עמודי ההערות — רק בצורת הרבים «הערות סיום - כותרת»"
  },
  {
    "id": "fn-delim-open",
    "control": "inp-fn-delim-open",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "תוחם פתיחת הערת שוליים",
    "type": "string",
    "def": "[",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "תוחם פתיחת הערת שוליים; ריק = ביטול"
  },
  {
    "id": "fn-delim-close",
    "control": "inp-fn-delim-close",
    "panel": "הערות שוליים וסיום",
    "panelKey": "NOTES",
    "labelHe": "תוחם סגירת הערת שוליים",
    "type": "string",
    "def": "]",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "תוחם סגירת הערת שוליים (בברירת המחדל נתמכת גם הצורה ]ם); ריק = ביטול"
  },
  {
    "id": "trace-verbosity",
    "control": "sel-trace-verb",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "רמת תיעוד מסלול (trace)",
    "type": "enum",
    "def": "standard",
    "enum": [
      "off",
      "minimal",
      "standard",
      "full"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "diagnostics-enabled",
    "control": "chk-diag",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "אבחון מופעל",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": null
  },
  {
    "id": "offline-guard",
    "control": "chk-offline-guard",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "שומר נתק־מהרשת (exit 7)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "exit 7 על בקשה חיצונית (Orange ✓)"
  },
  {
    "id": "debounce-light-change-ms",
    "control": "rng-debounce-ms",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "השהיית שינויים קלים (ms)",
    "type": "number",
    "def": 350,
    "enum": null,
    "min": 50,
    "max": 2000,
    "step": 50,
    "note": "REQ-UI-02: ריכוז שינויים קלים (רקע/נושא/שער) לפני רינדור מחדש — 350–400ms לפי Spec §5.3"
  },
  {
    "id": "measure-impl",
    "control": "sel-measure-impl",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "measure-impl",
    "type": "enum",
    "def": "table",
    "enum": [
      "table",
      "font-metrics"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "S12 D-72: מימוש מדידה — table = טבלאות מכוילות (ברירת מחדל); font-metrics = טבלאות אמת מגופן רשום (hmtx/cmap/kern/GPOS). שקילות שבירות מוכחת על הקורפוס הקנוני לפני החלפת ברירת מחדל."
  },
  {
    "id": "pdf-crop-marks",
    "control": "chk-crop-marks",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "pdf-crop-marks",
    "type": "bool",
    "def": false,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-EXP-03: סימני חיתוך מחוץ לתבנית החיתוך (TrimBox) בייצוא PDF"
  },
  {
    "id": "export-bleed-mm",
    "control": "rng-bleed-mm",
    "panel": "מתקדם/מנוע",
    "panelKey": "ADVANCED",
    "labelHe": "export-bleed-mm",
    "type": "number",
    "def": 3,
    "enum": null,
    "min": 0,
    "max": 6,
    "step": null,
    "note": "REQ-EXP-03: דם הדפסה (BleedBox) במ״מ סביב החיתוך"
  },
  {
    "id": "export-html-page-rules",
    "control": "chk-html-page-rules",
    "panel": "ייצוא (HTML/PDF/ZIP) ומדידה",
    "panelKey": "EXPORT",
    "labelHe": "export-html-page-rules",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-EXP-02: כללי @page (גודל עמוד מהרישום) בייצוא HTML עצמאי — מדפיס מדויק"
  }
];

const PANELS = [
  {
    "key": "THEMES",
    "label": "ערכות נושא, שערים ורקעים",
    "kind": "settings"
  },
  {
    "key": "BUILDER",
    "label": "בונה ערכות נושא (SVG Builder)",
    "kind": "action"
  },
  {
    "key": "IMPORTS",
    "label": "ייבוא תוספים",
    "kind": "action"
  },
  {
    "key": "NOTES",
    "label": "הערות שוליים וסיום",
    "kind": "settings"
  },
  {
    "key": "QUALITY",
    "label": "איכות עימוד",
    "kind": "settings"
  },
  {
    "key": "TYPO",
    "label": "טיפוגרפיה וגוף הטקסט",
    "kind": "settings"
  },
  {
    "key": "HEADINGS",
    "label": "כותרות 0–7",
    "kind": "settings"
  },
  {
    "key": "ORNAMENTS",
    "label": "עיטורים וגרפיקה",
    "kind": "settings"
  },
  {
    "key": "HEADERS",
    "label": "כותרות עליונות",
    "kind": "settings"
  },
  {
    "key": "TOC",
    "label": "תוכן העניינים",
    "kind": "settings"
  },
  {
    "key": "GRID",
    "label": "רשת העמוד ומספור",
    "kind": "settings"
  },
  {
    "key": "EXPORT",
    "label": "ייצוא (HTML/PDF/ZIP) ומדידה",
    "kind": "settings"
  },
  {
    "key": "ADVANCED",
    "label": "מתקדם/מנוע",
    "kind": "settings"
  }
];

module.exports = { BINDINGS, PANELS };

};
__modules["src/ui/extensions-panel.js"] = function (require, module, exports) {
// src/ui/extensions-panel.js — סקציית הרחבות מסמך (S11.1-1, §8.3 import/export/share)
'use strict';

/**
 * פאנל הרחבות ברמת המסמך (מנותק מ־12 פאנלי הרישום — אלו נכסי מסמך, לא הגדרות מנוע).
 * ייבוא חבילה (JSON) / ייצוא / שיתוף — כולל הצגת שגיאות האימות העבריות של המנוע.
 * אין עימוד אוטומטי משינוי הרחבות (F-06): השינוי מסומן ככבד — ⚡ בלבד.
 */

const { importExtensions, exportExtensions, shareSummary } = require('../engine/extensions/extensions-io');

function buildExtensionsPanel(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'extensions-panel';
  root.setAttribute('aria-label', 'הרחבות מסמך — סגנונות מותאמים, עמודים ותמונות');

  const title = doc.createElement('h3');
  title.className = 'extensions-title';
  title.textContent = 'הרחבות מסמך (סגנונות מותאמים · עמודים · תמונות)';
  root.appendChild(title);

  const desc = doc.createElement('p');
  desc.className = 'extensions-desc';
  desc.textContent = 'חבילת JSON: סגנונות טקסט מותאמים (טריגר, מצב פריסה, מונה, עיטורים מקושרים), עמודים מותאמים ותמונות מוטמעות. שינוי הרחבות דורש ⚡ — אין עימוד אוטומטי.';
  root.appendChild(desc);

  // ---- סרגל פעולות ----
  const bar = doc.createElement('div');
  bar.className = 'extensions-bar';
  const btnImport = doc.createElement('button');
  btnImport.type = 'button'; btnImport.className = 'btn';
  btnImport.textContent = '⬆ ייבוא חבילה';
  btnImport.setAttribute('aria-label', 'ייבוא חבילת הרחבות מקובץ JSON');
  btnImport.addEventListener('click', () => opts.onRequestImport && opts.onRequestImport());
  const btnExport = doc.createElement('button');
  btnExport.type = 'button'; btnExport.className = 'btn';
  btnExport.textContent = '⬇ ייצוא חבילה';
  btnExport.setAttribute('aria-label', 'ייצוא חבילת ההרחבות הפעילה');
  btnExport.addEventListener('click', () => opts.onExport && opts.onExport());
  const btnShare = doc.createElement('button');
  btnShare.type = 'button'; btnShare.className = 'btn btn--ghost';
  btnShare.textContent = '🔗 תקציר לשיתוף';
  btnShare.setAttribute('aria-label', 'תקציר קריא של החבילה הפעילה');
  btnShare.addEventListener('click', () => opts.onShare && opts.onShare());
  const btnClear = doc.createElement('button');
  btnClear.type = 'button'; btnClear.className = 'btn btn--ghost';
  btnClear.textContent = '🗑 נקה הרחבות';
  btnClear.addEventListener('click', () => setBundle(null, 'ההרחבות הוסרו. עימוד מחדש דורש ⚡.'));
  bar.appendChild(btnImport); bar.appendChild(btnExport); bar.appendChild(btnShare); bar.appendChild(btnClear);
  root.appendChild(bar);

  // ---- הודעות (הצלחה/שגיאות אימות עבריות) ----
  const msg = doc.createElement('div');
  msg.className = 'extensions-msg';
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  root.appendChild(msg);

  const errList = doc.createElement('ul');
  errList.className = 'extensions-errors';
  errList.setAttribute('role', 'alert');
  root.appendChild(errList);

  // ---- רשימת סגנונות פעילים ----
  const active = doc.createElement('div');
  active.className = 'extensions-active';
  root.appendChild(active);

  let current = null; // {styles, pages, images} מנורמלים או null

  /** קביעת חבילה פעילה (מייבוא או ניקוי) + עדכון תצוגה + הודעה למאזין. */
  function setBundle(bundle, message, errors) {
    current = bundle;
    // הודעה ראשית
    msg.textContent = message || '';
    msg.classList.toggle('extensions-msg--error', !!(errors && errors.length));
    // שגיאות אימות (עברית, מפורטות)
    errList.textContent = '';
    for (const e of errors || []) {
      const li = doc.createElement('li');
      li.className = 'extensions-error-item';
      li.textContent = e && e.message ? e.message : String(e);
      errList.appendChild(li);
    }
    // רשימת סגנונות פעילים
    active.textContent = '';
    if (bundle) {
      const head = doc.createElement('div');
      head.className = 'extensions-active-head';
      head.textContent = `פעיל: ${bundle.styles.length} סגנונות · ${bundle.pages.length} עמודים · ${bundle.images.length} תמונות`;
      active.appendChild(head);
      for (const st of bundle.styles) {
        const row = doc.createElement('div');
        row.className = 'extensions-style-row';
        const modeHe = {
          'regular': 'רגיל', 'full-width': 'רוחב מלא', 'side-note': 'הערת צד',
          'footnote': 'הערת שוליים', 'endnote': 'הערת סיום', 'new-location': 'מיקום חדש'
        }[st.layoutMode] || st.layoutMode;
        row.textContent = `«${st.name}» — ${modeHe}${st.counter && st.counter.enabled ? ' · מונה' : ''}${st.linkedOrnaments ? ' · עיטורים' : ''}`;
        active.appendChild(row);
      }
    } else {
      const none = doc.createElement('div');
      none.className = 'extensions-active-head';
      none.textContent = 'אין הרחבות פעילות.';
      active.appendChild(none);
    }
    opts.onBundleChange && opts.onBundleChange(current);
  }

  /** ייבוא מתוכן קובץ (טקסט JSON) — ההמרה עצמה ב־extensions-io (מקור יחיד). */
  function importFromText(jsonText, fileNameForMessage) {
    const res = importExtensions(jsonText);
    if (res.ok) {
      setBundle(res, `החבילה נטענה${fileNameForMessage ? ` («${fileNameForMessage}»)` : ''}: ${res.summary} עימוד מחדש דורש ⚡.`);
    } else {
      setBundle(null, `הייבוא נכשל — הקובץ לא נטען. ${res.summary}`, res.errors);
    }
    return res.ok;
  }

  /** ייצוא לטקסט JSON (דטרמיניסטי). */
  function exportText() {
    return exportExtensions(current || { styles: [], pages: [], images: [] });
  }

  /** תקציר קריא לשיתוף. */
  function shareText() {
    return shareSummary(current || { styles: [], pages: [], images: [] });
  }

  setBundle(null, '');

  return { root, importFromText, exportText, shareText, setBundle, getBundle: () => current };
}

module.exports = { buildExtensionsPanel };

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
__modules["src/engine/import/docx-import.js"] = function (require, module, exports) {
// src/engine/import/docx-import.js — ייבוא DOCX (S11.1-3, REQ-PAR-07, §12.3; "mammoth-style")
'use strict';

/**
 * המרת DOCX לטקסט המנוע (mammoth ברוח: Heading1–7 → «כותרת N - …», הערות
 * Word → [...] בגוף (bracket notes — סורק הסוגריים המרובעים של השכבה 1),
 * פסקאות רגילות → שורות פסקה. פליין־טקסט לעורך (§12.3).
 *
 * **סירוב בשקט של פורמטים לא נתמכים (חוק ברזל 14):** אין קריסה, אין טעינה
 * חלקית — הודעה עברית ברורה «פורמט לא נתמך» + סיבה. כל נתיב הכישלון מחזיר
 * {ok:false, reason, message} והקובץ אינו נטען.
 */

const { readZip, utf8Decode } = require('./zip-reader');
const { parseXml } = require('./xml-lite');

/** מיפוי סגנונות Word → רמות כותרת של המנוע. */
const HEADING_STYLE_RE = /^Heading([1-7])$/i;
const ALT_HEADING_RE = /^(?:כותרת|Heading|heading|Ttulo)[\s_-]*([1-7])$/;

function headingLevelOf(styleVal) {
  if (typeof styleVal !== 'string') return null;
  let m = styleVal.match(HEADING_STYLE_RE);
  if (m) return Number(m[1]);
  m = styleVal.match(ALT_HEADING_RE);
  if (m) return Number(m[1]);
  return null;
}

/**
 * המרה מלאה של document.xml + footnotes.xml לטקסט מנוע.
 * @param {string} docXml, {string|null} fnXml
 * @returns {{ok:boolean, text:string, stats:object, error:string|null}}
 */
function convert(docXml, fnXml) {
  const docRes = parseXml(docXml);
  if (docRes.error && docRes.error !== 'truncated') return { ok: false, text: '', stats: {}, error: `docxml:${docRes.error}` };

  // 0) בדיקת מבנה WordML: חייב להיות אלמנט w:body (או לפחות w:p) — אחרת אינו מסמך
  //     וורד תקין (קלט XML לא מסמך ⇒ דחייה «XML פגום», לא טעינה שקטה של מסמך ריק).
  if (!docRes.events.some(e => e.type === 'start' && (e.tag === 'w:body' || e.tag === 'w:p'))) {
    return { ok: false, text: '', stats: {}, error: 'not-wordml' };
  }

  // 1) מפתח הערות: id → טקסט
  const fnMap = new Map(); // id → text
  let fnStats = 0;
  if (fnXml) {
    const fnRes = parseXml(fnXml);
    if (fnRes.error && fnRes.error !== 'truncated') return { ok: false, text: '', stats: {}, error: `footnotes:${fnRes.error}` };
    const evs = fnRes.events;
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      if (ev.type === 'start' && ev.tag === 'w:footnote' && ev.attrs && ev.attrs['w:id'] != null) {
        const id = String(ev.attrs['w:id']);
        const { text } = collectFootnoteText(evs, i);
        if (id !== '0' && id !== '-1') { fnMap.set(id, text); fnStats++; } // 0/-1 = separator/continuation (מוסתרים)
      }
    }
  }

  // 2) המרת הפסקאות — הערות וורד מוכנסות **במקום ההפניה** (בסדר הופעתן): footnotes→[...]
  const lines = [];
  let headings = 0, paragraphs = 0, footnotes = 0, skipped = 0;
  const evs = docRes.events;
  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.type !== 'start' || ev.tag !== 'w:p') continue;
    const paraEnd = paraEndIndex(evs, i);
    const { styleVal, seq } = paraParts(evs, i, paraEnd);
    const lvl = headingLevelOf(styleVal);
    // בניית השורה: רצף מסודר של טקסט והפניות — ההערה נכנסת במקומה (לא בסוף)
    let flat = '';
    const refIds = [];
    for (const item of seq) {
      if (item.kind === 'text') flat += item.text;
      else {
        refIds.push(item.id);
        const noteText = item.id != null && fnMap.has(item.id) ? fnMap.get(item.id) : '';
        if (noteText) {
          footnotes++;
          const needsSpace = flat.length > 0 && !/\s$/.test(flat); // רווח לפני הסוגריים אם אין
          flat += `${needsSpace ? ' ' : ''}[${noteText}]`;
        }
      }
    }
    flat = flat.replace(/\u00A0/g, ' ').trim();
    if (!flat && !refIds.length) { skipped++; continue; } // פסקה ריקה — מוסתרת (לא תוכן)
    let line = flat;
    if (lvl != null) {
      headings++;
      line = `כותרת ${lvl} - ${flat}`;
    } else {
      paragraphs++;
    }
    lines.push(line);
  }
  return {
    ok: true,
    text: lines.join('\n'),
    stats: { headings, paragraphs, footnotes, skipped, footnoteDefs: fnStats }
  };
}

/** מציאת אינדקס הסוף של w:p (אירוע end באותו depth). */
function paraEndIndex(evs, startIdx) {
  const d0 = evs[startIdx].depth;
  for (let i = startIdx + 1; i < evs.length; i++) {
    if (evs[i].type === 'end' && evs[i].depth === d0 && evs[i].tag === 'w:p') return i;
  }
  return evs.length - 1;
}

/** איסוף חלקי פסקה כרצף מסודר: pStyle + רצף [{kind:'text'|'ref'}] לפי סדר הופעתם.
 *  ללא בדיקות עומק קפדניות — w:pStyle בא בתוך w:pPr (עומק 2); w:footnoteReference בתוך w:r. */
function paraParts(evs, startIdx, endIdx) {
  const d0 = evs[startIdx].depth;
  void d0;
  const out = { styleVal: null, seq: [] };
  let inR = false, inT = false;
  for (let i = startIdx + 1; i <= endIdx; i++) {
    const ev = evs[i];
    if (ev.type === 'start') {
      if (ev.tag === 'w:r') inR = true;
      if (ev.tag === 'w:t' && inR) inT = true;
      if (ev.tag === 'w:pStyle' && ev.attrs && ev.attrs['w:val'] != null) {
        out.styleVal = String(ev.attrs['w:val']);
      }
      if (ev.tag === 'w:footnoteReference' && inR) {
        out.seq.push({ kind: 'ref', id: ev.attrs && ev.attrs['w:id'] != null ? String(ev.attrs['w:id']) : null });
      }
      continue;
    }
    if (ev.type === 'end') {
      if (ev.tag === 'w:r') inR = false;
      if (ev.tag === 'w:t') inT = false;
      continue;
    }
    if (ev.type === 'text' && inR && inT) {
      out.seq.push({ kind: 'text', text: ev.text });
    }
  }
  return out;
}

/** איסוף טקסט הערה מתוך w:footnote.
 * **תיקון S11:** w:r יושב בתוך w:p (עומק d0+2) — בדיקת עומק נוקשהת (d0+1)
 * פסלה כל הערת־מקור אמיתית והחזירה טקסט ריק, כך שההערות נשמטו בשקט.
 * הגבול העליון הוא סוף ה־w:footnote (break) — אין צורך בבדיקת עומק על w:r. */
function collectFootnoteText(evs, startIdx) {
  const d0 = evs[startIdx].depth;
  let text = '';
  let inR = false, inT = false;
  for (let i = startIdx + 1; i < evs.length; i++) {
    const ev = evs[i];
    if (ev.type === 'end' && ev.tag === 'w:footnote' && ev.depth === d0) break;
    if (ev.type === 'start') {
      if (ev.tag === 'w:r') inR = true;
      if (ev.tag === 'w:t' && inR) inT = true;
      continue;
    }
    if (ev.type === 'end') {
      if (ev.tag === 'w:r') inR = false;
      if (ev.tag === 'w:t') inT = false;
      continue;
    }
    if (ev.type === 'text' && inR && inT) text += ev.text;
  }
  return { text: text.replace(/\u00A0/g, ' ').trim() };
}

/**
 * נקודת הכניסה: בתים של קובץ → טקסט מנוע.
 * @param {Buffer|Uint8Array} bytes
 * @param {string} fileName — להודעת הסירוב
 * @returns {{ok:boolean, text:string, stats:object, message:string}}
 */
function importDocx(bytes, fileName) {
  const name = String(fileName || 'קובץ');
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext !== 'docx' && ext !== 'zip') {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}». ניתן לייבא קבצי DOCX בלבד. הקובץ לא נטען.` };
  }
  const zip = readZip(bytes);
  if (!zip.ok) {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו ארכיון תקין (${zip.error}). הקובץ לא נטען.` };
  }
  if (zip.denied.length) {
    // רשומות מסוכנות נדחו — מדווח; לא חוסם אם המסמך עצמו תקין (path traversal לא מגיע לדיסק)
    void zip.denied;
  }
  const doc = zip.entries.find(e => e.name === 'word/document.xml');
  if (!doc) {
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו מסמך Word (חסר word/document.xml). הקובץ לא נטען.` };
  }
  const fn = zip.entries.find(e => e.name === 'word/footnotes.xml');
  const res = convert(utf8Decode(doc.data), fn ? utf8Decode(fn.data) : null);
  if (!res.ok) {
    if (res.error === 'not-wordml') {
      return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: «${name}» אינו מסמך Word תקין (document.xml אינו WordML). הקובץ לא נטען.` };
    }
    return { ok: false, text: '', stats: {}, message: `פורמט לא נתמך: XML פגום בתוך «${name}» (${res.error}). הקובץ לא נטען.` };
  }
  return {
    ok: true,
    text: res.text,
    stats: res.stats,
    message: `הקובץ «${name}» נטען: ${res.stats.headings} כותרות, ${res.stats.paragraphs} פסקאות, ${res.stats.footnotes} הערות Word הומרו להערות סוגריים.`
  };
}

module.exports = { importDocx, convert, headingLevelOf };

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
__modules["src/engine/import/xml-lite.js"] = function (require, module, exports) {
// src/engine/import/xml-lite.js — מנתח XML מינימלי לקריאת DOCX (S11.1-3)
'use strict';

/**
 * מנתח XML אירועי (pull): קטן, מבודד, ללא תלות. מספיק ל־word/document.xml
 * (w:p, w:r, w:t, w:pStyle, w:footnoteReference) — לא מנתח כלל XML.
 * אין eval; ישויות בסיסיות בלבד (&amp; &lt; &gt; &quot; &apos; &#NNN;).
 *
 * אירועים: {type:'start'|'end'|'text', tag, attrs, text, depth}
 * הגנות: עומק מקסימלי, מספר אירועים מקסימלי, קלט קטוע → error מפורש (לא קריסה).
 */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s) {
  return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ENTITIES[ent]) return ENTITIES[ent];
    if (ent[0] === '#') {
      const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code < 0x110000) return String.fromCodePoint(code);
    }
    return m; // ישות לא מוכרת — נשמרת כמו שהיא (לא קורסת)
  });
}

const MAX_DEPTH = 64;
const MAX_EVENTS = 200000;

/**
 * @param {string} xml
 * @returns {{events:Array, error:string|null}}
 */
function parseXml(xml) {
  const src = String(xml || '');
  const events = [];
  const stack = [];
  let depth = 0;
  let i = 0;
  const len = src.length;

  while (i < len) {
    if (events.length > MAX_EVENTS) return { events, error: 'too-many-events' };
    const lt = src.indexOf('<', i);
    if (lt < 0) {
      const text = decodeEntities(src.slice(i));
      if (text.trim()) events.push({ type: 'text', text, depth });
      break;
    }
    if (lt > i) {
      const text = decodeEntities(src.slice(i, lt));
      if (text.trim()) events.push({ type: 'text', text, depth });
      i = lt;
    }
    if (src.startsWith('<?', i)) {
      const end = src.indexOf('?>', i);
      if (end < 0) return { events, error: 'unterminated-pi' };
      i = end + 2; continue;
    }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i);
      if (end < 0) return { events, error: 'unterminated-comment' };
      i = end + 3; continue;
    }
    if (src.startsWith('<![CDATA[', i)) {
      const end = src.indexOf(']]>', i);
      if (end < 0) return { events, error: 'unterminated-cdata' };
      const text = src.slice(i + 9, end);
      if (text.trim()) events.push({ type: 'text', text, depth });
      i = end + 3; continue;
    }
    if (src.startsWith('<!', i)) { // DOCTYPE והגדרות
      let j = i + 2, inner = 0;
      while (j < len) {
        if (src[j] === '[') inner++;
        else if (src[j] === ']') inner = Math.max(0, inner - 1);
        else if (src[j] === '>' && inner === 0) break;
        j++;
      }
      if (j >= len) return { events, error: 'unterminated-doctype' };
      i = j + 1; continue;
    }
    // תג סגירה </tag>
    if (src[i + 1] === '/') {
      const gt = src.indexOf('>', i);
      if (gt < 0) return { events, error: 'unterminated-close' };
      const tag = src.slice(i + 2, gt).trim();
      const top = stack.pop();
      if (top !== tag) {
        // סגירה לא מזווגת: אם יש מקבילה במחסנית — סוגרים את הפתוחים שמעליה (סלחני,
        // מתועד); אחרת — טעות.
        const idx = stack.lastIndexOf(tag);
        if (idx < 0) return { events, error: `unmatched-close:${tag}` };
        while (stack.length > idx) {
          const t2 = stack.pop();
          depth = Math.max(0, depth - 1);
          events.push({ type: 'end', tag: t2, depth });
        }
      } else {
        depth = Math.max(0, depth - 1);
        events.push({ type: 'end', tag, depth });
      }
      i = gt + 1; continue;
    }
    // תג פתיחה
    const gt = src.indexOf('>', i);
    if (gt < 0) return { events, error: 'unterminated-tag' };
    const selfClosing = src[gt - 1] === '/';
    const body = selfClosing ? src.slice(i + 1, gt - 1) : src.slice(i + 1, gt);
    const m = body.match(/^([^\s/>]+)([\s\S]*)$/);
    if (!m || !m[1]) return { events, error: 'bad-tag' };
    const tag = m[1];
    const rest = m[2] || '';
    const attrs = {};
    const attrRe = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let am;
    while ((am = attrRe.exec(rest)) !== null) {
      attrs[am[1]] = decodeEntities(am[3] !== undefined ? am[3] : am[4]);
    }
    if (selfClosing) {
      events.push({ type: 'start', tag, attrs, depth, selfClosing: true });
      events.push({ type: 'end', tag, depth });
    } else {
      if (depth >= MAX_DEPTH) return { events, error: 'too-deep' };
      events.push({ type: 'start', tag, attrs, depth });
      stack.push(tag);
      depth++;
    }
    i = gt + 1;
  }
  if (stack.length) {
    // קלט קטוע — סוגרים את הפתוחים כדי שהצרכן לא ייתקע, עם אינדיקציה
    while (stack.length) {
      const tag = stack.pop();
      events.push({ type: 'end', tag, depth: Math.max(0, events.length ? events[events.length - 1].depth : 0) });
    }
    return { events, error: 'truncated' };
  }
  return { events, error: null };
}

module.exports = { parseXml, decodeEntities };

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
__modules["src/ui/preview-tab.js"] = function (require, module, exports) {
// src/ui/preview-tab.js — לשונית התצוגה (REQ-UI-05/06: גלילה, זום, קפיצה, סנכרון, ⏬ דיבאג)
'use strict';

/**
 * קנבס כהה מאחורי העמודים (S10.1-8 — ריהוט מקצועי). העמודים עצמם נבנים
 * ע"י dom-renderer.renderPage — מקור יחיד; ה־UI רק עוטף (כפתור ⏬ לכל עמוד —
 * בקשת V21; highlightIssue — כלל 2 Working_rules).
 */

const { renderPage } = require('../engine/output/dom-renderer');

/** פענוח מספר עברי (גימטריה) — עבור "קפיצה לפי מספר עברי". */
const GEMATRIA = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60,
  'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
function parseHebrewNumber(s) {
  const t = String(s || '').replace(/[׳״'"’]/g, '').trim();
  if (!t) return null;
  let total = 0, sum = 0; // אלפים (ה׳) נפרדים מהשארית — כלל D-31
  for (const ch of t) {
    if (ch === 'ה' && total === 0 && sum === 0 && t.length > 1 && t[0] === 'ה') { total = 5000; continue; }
    const v = GEMATRIA[ch];
    if (v == null) return null;
    sum += v;
  }
  const n = (total || 0) + sum;
  return n >= 1 ? n : null;
}

function buildPreviewTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'preview';

  // ---- סרגל כלים ----
  const bar = doc.createElement('div');
  bar.className = 'preview-bar';

  const scrollMode = doc.createElement('button');
  scrollMode.type = 'button'; scrollMode.className = 'btn btn--toggle';
  scrollMode.textContent = '↕ גלילה אנכית';
  scrollMode.setAttribute('aria-label', 'החלף מצב גלילה (אנכית/אופקית)');
  let horizontal = false;
  scrollMode.addEventListener('click', () => {
    horizontal = !horizontal;
    canvas.classList.toggle('canvas--horizontal', horizontal);
    scrollMode.textContent = horizontal ? '↔ גלילה אופקית' : '↕ גלילה אנכית';
  });

  const zoomOut = doc.createElement('button');
  zoomOut.type = 'button'; zoomOut.className = 'btn btn--icon'; zoomOut.textContent = '➖';
  zoomOut.setAttribute('aria-label', 'הקטן תצוגה');
  const zoomPct = doc.createElement('span');
  zoomPct.className = 'zoom-pct'; zoomPct.textContent = '100%';
  const zoomIn = doc.createElement('button');
  zoomIn.type = 'button'; zoomIn.className = 'btn btn--icon'; zoomIn.textContent = '➕';
  zoomIn.setAttribute('aria-label', 'הגדל תצוגה');
  const zoomFit = doc.createElement('button');
  zoomFit.type = 'button'; zoomFit.className = 'btn'; zoomFit.textContent = '⟷ התאם לרוחב';
  zoomFit.setAttribute('aria-label', 'התאם תצוגה לרוחב החלון');

  const jumpInput = doc.createElement('input');
  jumpInput.setAttribute('type', 'text');
  jumpInput.setAttribute('placeholder', 'דף… (א, כ״ב)');
  jumpInput.setAttribute('aria-label', 'קפיצה לעמוד לפי מספר עברי');
  jumpInput.className = 'jump-input';
  const jumpBtn = doc.createElement('button');
  jumpBtn.type = 'button'; jumpBtn.className = 'btn'; jumpBtn.textContent = '➜ עבור';
  jumpBtn.setAttribute('aria-label', 'עבור לעמוד');

  const pageIndicator = doc.createElement('span');
  pageIndicator.className = 'page-indicator';
  pageIndicator.setAttribute('aria-live', 'polite');
  pageIndicator.textContent = 'אין עמודים';

  // **S12 (REQ-EXP-01..04):** סרגל ייצוא — HTML עצמאי / PDF / חבילת ZIP.
  // הפעולות מועברות ל־app-shell (מקור יחיד לטקסט/הגדרות/הרחבות); אין עימוד
  // אוטומטי מהייצוא (F-06) — קריאה בלבד.
  const exportBar = doc.createElement('div');
  exportBar.className = 'export-bar';
  exportBar.setAttribute('role', 'group');
  exportBar.setAttribute('aria-label', 'ייצוא מסמך');
  const mkExport = (id, label, aria) => {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'btn btn--ghost'; b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', () => opts.onExport && opts.onExport(id));
    return b;
  };
  exportBar.appendChild(mkExport('html', '🌐 HTML עצמאי', 'ייצוא HTML עצמאי חד־קובץ'));
  exportBar.appendChild(mkExport('pdf', '📄 PDF', 'ייצוא PDF עם טקסט נבחר, סימניות וקישורי תוכן'));
  exportBar.appendChild(mkExport('zip', '🗜 חבילת פרויקט', 'ייצוא חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות)'));

  bar.appendChild(scrollMode); bar.appendChild(zoomOut); bar.appendChild(zoomPct); bar.appendChild(zoomIn); bar.appendChild(zoomFit);
  bar.appendChild(jumpInput); bar.appendChild(jumpBtn); bar.appendChild(pageIndicator);
  bar.appendChild(exportBar);
  root.appendChild(bar);

  // ---- קנבס העמודים (רקע כהה) ----
  const canvas = doc.createElement('div');
  canvas.className = 'preview-canvas';
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'תצוגה מקדימה של העמודים');
  root.appendChild(canvas);

  let zoom = 100;
  let pageEls = new Map(); // pageIndex → element (במצב וירטואלי: רק החלון החי)
  let lastResult = null;
  let lastScrollTarget = null;

  // ---- D-84: רינדור מחלונות (virtualization) לספרים ארוכים ----
  // ספר אמת של 1,200+ עמודים = מיליוני צמתי DOM אם מרנדרים הכול — הלשונית
  // קופאת. עד VIRTUAL_THRESHOLD עמודים ההתנהגות הקודמת נשמרת במלואה
  // (רינדור מלא, כל הבדיקות הקיימות עוברות על מסמכים קטנים); מעליו —
  // placeholders בגובה האמיתי ורינדור עצל של חלון סביב הגלילה/היעד.
  const VIRTUAL_THRESHOLD = 60;
  const VIRTUAL_WINDOW = 4; // ריפוד משני צידי הטווח הנראה
  const virtual = { on: false, pages: [], settings: null, rendered: new Set(), phW: 794, phH: 1123 };
  let scrollRaf = null;

  /** בניית אלמנט עמוד אחד (מקור יחיד לרינדור מלא ולווירטואלי) — כולל ⏬ ולחיצה. */
  function buildPageEl(page) {
    const el = renderPage(page, virtual.settings, doc);
    el.classList.add('preview-page');
    // כפתור דיבאג פר־עמוד (V21): גיאומטריה + פרוסת ledger — בלי לגעת ברינדור
    const dbg = doc.createElement('button');
    dbg.type = 'button'; dbg.className = 'page-debug-btn'; dbg.textContent = '⏬';
    dbg.title = 'הורד פרטי עמוד (JSON)';
    dbg.setAttribute('aria-label', `הורד פרטי עמוד ${page.index + 1}`);
    dbg.addEventListener('click', (ev) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      opts.onDebugDownload && opts.onDebugDownload(page.index);
    });
    el.appendChild(dbg);
    // לחיצה על עמוד = גלילה אליו + סנכרון סמן (REQ-UI-05)
    el.addEventListener('click', () => {
      lastScrollTarget = page.index;
      pageIndicator.textContent = `עמוד ${page.index + 1} מתוך ${virtual.pages.length || (lastResult && lastResult.pages.length) || 0}`;
      opts.onActivatePage && opts.onActivatePage(page.index);
    });
    return el;
  }

  /** placeholder קל בגובה/רוחב האמיתי של העמוד (מהתבנית — מקור יחיד). */
  function makePlaceholder(i) {
    const ph = doc.createElement('div');
    ph.className = 'preview-page preview-page--placeholder';
    ph.setAttribute('data-page-index', String(i));
    ph.setAttribute('aria-hidden', 'true');
    const page = virtual.pages[i];
    const w = page && page.template && page.template.width || virtual.phW;
    const h = page && page.template && page.template.height || virtual.phH;
    if (ph.style) { ph.style.width = `${w}px`; ph.style.height = `${h}px`; }
    return ph;
  }

  // עזרי DOM עמידים גם ל-shim של הבדיקות (אין insertBefore/removeChild שם —
  // children הוא מערך פשוט; בדפדפן נעשה שימוש ב-API האמיתי).
  function domInsertBefore(parent, ref, el) {
    if (typeof parent.insertBefore === 'function') { parent.insertBefore(el, ref); return; }
    if (Array.isArray(parent.children)) {
      const i = parent.children.indexOf(ref);
      if (i >= 0) { parent.children.splice(i, 0, el); el.parentNode = parent; return; }
    }
    parent.appendChild(el);
  }
  function domRemove(parent, el) {
    if (typeof parent.removeChild === 'function') { parent.removeChild(el); return; }
    if (Array.isArray(parent.children)) {
      const i = parent.children.indexOf(el);
      if (i >= 0) parent.children.splice(i, 1);
    }
  }

  /** רינדור עצל של עמוד i (החלפת placeholder באלמנט החי). */
  function ensureRendered(i) {
    if (pageEls.has(i)) return;
    const el = buildPageEl(virtual.pages[i]);
    const cur = canvas.children[i] || null; // ה-placeholder באותו מקום בסדר
    if (cur && cur.classList && cur.classList.contains && cur.classList.contains('preview-page--placeholder') && cur.parentNode) {
      domInsertBefore(cur.parentNode, cur, el);
      domRemove(cur.parentNode, cur);
    } else if (cur) {
      domInsertBefore(canvas, cur, el);
    } else {
      canvas.appendChild(el);
    }
    pageEls.set(i, el);
    virtual.rendered.add(i);
  }

  /** שחרור עמוד רחוק חזרה ל-placeholder (שמירה על DOM קטן וקבוע). */
  function unrenderPage(i) {
    const el = pageEls.get(i);
    if (!el) return;
    const ph = makePlaceholder(i);
    if (el.parentNode) {
      domInsertBefore(el.parentNode, el, ph);
      domRemove(el.parentNode, el);
    } else {
      canvas.appendChild(ph);
    }
    pageEls.delete(i);
    virtual.rendered.delete(i);
  }

  /** רינדור טווח [lo,hi] ושחרור המרוחקים ממנו (בתוספת ריפוד). */
  function renderWindow(lo, hi) {
    if (!virtual.on) return;
    const n = virtual.pages.length;
    const a = Math.max(0, lo), b = Math.min(n - 1, hi);
    for (let i = a; i <= b; i++) ensureRendered(i);
    for (const i of [...virtual.rendered]) {
      if (i < a - VIRTUAL_WINDOW || i > b + VIRTUAL_WINDOW) unrenderPage(i);
    }
  }

  /** אומדן הטווח הנראה מהגלילה — יחסי (עמיד לזום/מרווחים): scrollTop/scrollHeight × n.
   *  הגולל האמיתי הוא root (.tab-panel עם overflow:auto) — לא ה-canvas. */
  function visibleRange() {
    const n = virtual.pages.length;
    const scroller = (root.scrollHeight || root.clientHeight) ? root : canvas;
    const sh = scroller.scrollHeight, st = scroller.scrollTop, ch = scroller.clientHeight;
    if (!n || !sh || !isFinite(sh) || !isFinite(st) || !isFinite(ch)) return [0, 0];
    const first = Math.max(0, Math.floor((st / sh) * n) - 1);
    const last = Math.min(n - 1, Math.ceil(((st + ch) / sh) * n));
    return [first, last];
  }

  function onVirtualScroll() {
    scrollRaf = null;
    if (!virtual.on) return;
    const [a, b] = visibleRange();
    renderWindow(a, b);
  }
  // D-84: מאזין גלילה על הגורר האמיתי (.tab-panel = root); ה-canvas עצמו אינו גולל.
  // (במצב אופקי ה-canvas גולל אופקית — מאזין כפול, passive, נטול השפעה כשאין גלילה.)
  const onScrollMaybe = () => {
    if (!virtual.on || scrollRaf) return;
    scrollRaf = (typeof requestAnimationFrame === 'function')
      ? requestAnimationFrame(onVirtualScroll)
      : setTimeout(onVirtualScroll, 16);
  };
  root.addEventListener('scroll', onScrollMaybe, { passive: true });
  canvas.addEventListener('scroll', onScrollMaybe, { passive: true });

  // קישורי TOC (#page-N) — סנכרון לחיצה (REQ-UI-05: "TOC click sync").
  // רישום חד־פעמי מחוץ ל־setResult — אין הצטברות מאזינים.
  canvas.addEventListener('click', (ev) => {
    let n = ev && ev.target;
    while (n && n !== canvas) {
      const href = n.getAttribute && n.getAttribute('href');
      if (href && href.startsWith('#page-')) {
        if (ev.preventDefault) ev.preventDefault();
        const idx = Number(href.slice(6));
        if (Number.isFinite(idx)) { lastScrollTarget = idx; opts.onActivatePage && opts.onActivatePage(idx); }
        return;
      }
      n = n.parentNode;
    }
  });

  function setZoom(pct) {
    zoom = Math.max(25, Math.min(400, Math.round(pct)));
    zoomPct.textContent = `${zoom}%`;
    canvas.dataset.zoom = String(zoom);
    if (canvas.dataset) canvas.dataset.fit = '';
  }
  zoomOut.addEventListener('click', () => setZoom(zoom - 10));
  zoomIn.addEventListener('click', () => setZoom(zoom + 10));
  zoomFit.addEventListener('click', () => setZoomFit());
  function setZoomFit() { canvas.dataset.fit = 'width'; zoomPct.textContent = 'רוחב'; }
  // Ctrl+wheel = זום (REQ-UI-05)
  canvas.addEventListener('wheel', (ev) => {
    if (ev && ev.ctrlKey) {
      if (ev.preventDefault) ev.preventDefault();
      setZoom(zoom + (ev.deltaY < 0 ? 10 : -10));
    }
  });

  // ---- ניהול עמודים ----
  function setResult(serializedResult, settings) {
    lastResult = serializedResult;
    canvas.textContent = '';
    pageEls = new Map();
    virtual.on = Array.isArray(serializedResult.pages) && serializedResult.pages.length > VIRTUAL_THRESHOLD;
    virtual.settings = settings;
    virtual.pages = serializedResult.pages || [];
    virtual.rendered = new Set();
    if (!virtual.on) {
      // מסמך קטן — רינדור מלא (ההתנהגות המקורית, ללא שינוי)
      for (const page of virtual.pages) {
        const el = buildPageEl(page);
        canvas.appendChild(el);
        pageEls.set(page.index, el);
      }
    } else {
      // ספר ארוך — placeholders לכולם + חלון חי ראשוני (D-84)
      const t0 = virtual.pages[0] && virtual.pages[0].template;
      virtual.phW = (t0 && t0.width) || 794;
      virtual.phH = (t0 && t0.height) || 1123;
      for (let i = 0; i < virtual.pages.length; i++) {
        const ph = makePlaceholder(i);
        canvas.appendChild(ph);
      }
      renderWindow(0, Math.min(2 * VIRTUAL_WINDOW, virtual.pages.length - 1));
    }
    pageIndicator.textContent = serializedResult.pages.length
      ? `עמוד 1 מתוך ${serializedResult.pages.length}${virtual.on ? ' (תצוגת חלון)' : ''}` : 'אין עמודים';
    setZoom(100);
  }

  function scrollToPage(pageIndex) {
    lastScrollTarget = pageIndex;
    if (virtual.on) renderWindow(pageIndex - VIRTUAL_WINDOW, pageIndex + VIRTUAL_WINDOW); // D-84: רינדור לפני גלילה
    const el = pageEls.get(pageIndex);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
    if (lastResult) pageIndicator.textContent = `עמוד ${pageIndex + 1} מתוך ${lastResult.pages.length}`;
  }

  // קפיצה לפי מספר עברי — שקוף לפורמט המספור שנבחר (hebrew/daf-hebrew)
  function jumpByHebrew(text) {
    const n = parseHebrewNumber(text);
    if (n == null) { pageIndicator.textContent = 'מספר עברי לא תקין'; return null; }
    const idx = n - 1;
    if (!lastResult || idx < 0 || idx >= lastResult.pages.length) {
      pageIndicator.textContent = `אין עמוד ${n}`; return null;
    }
    scrollToPage(idx);
    return idx;
  }
  jumpBtn.addEventListener('click', () => jumpByHebrew(jumpInput.value));

  // ---- highlightIssue (כלל 2 — Working_rules) ----
  let highlighted = [];
  function clearHighlights() {
    for (const { el } of highlighted) {
      el.classList.remove('issue-flash');
      el.removeAttribute('data-issue-id');
      if (el.style) { el.style.outline = ''; el.style.outlineOffset = ''; }
    }
    highlighted = [];
  }
  /**
   * הדגשת ממצא: העמוד מסומן באופן נראה (מחלקה + קו מיתאר inline — הוכחת
   * נראות גם בלי CSS חיצוני); אם ב־target מזהה טוקן (t\d+) — גם שורותיו מסומנות.
   */
  function highlightIssue(finding) {
    clearHighlights();
    if (!finding) return;
    const idx = finding.page != null ? Number(finding.page) : null;
    if (virtual.on && idx != null && Number.isFinite(idx)) renderWindow(idx - VIRTUAL_WINDOW, idx + VIRTUAL_WINDOW); // D-84
    const el = (idx != null && Number.isFinite(idx)) ? pageEls.get(idx) : null;
    if (el) {
      el.classList.add('issue-flash');
      el.setAttribute('data-issue-id', finding.id || '');
      if (el.style) { el.style.outline = '3px solid #e03131'; el.style.outlineOffset = '-3px'; }
      highlighted.push({ el });
    }
    // שורות הטוקן המעורב (אם יסומן במטרה) — סימון פנימי נראה
    const tm = String(finding.target || '').match(/t\d+/);
    if (tm && el) {
      const lines = el.querySelectorAll ? el.querySelectorAll('.line') : [];
      for (const ln of lines) {
        if (ln.dataset && ln.dataset.tokenId === tm[0]) {
          ln.classList.add('issue-flash');
          if (ln.style) ln.style.backgroundColor = 'rgba(224,49,49,.15)';
          highlighted.push({ el: ln });
        }
      }
    }
    if (idx != null && Number.isFinite(idx)) scrollToPage(idx);
  }

  /** סימון יעד סמן (כיוון א׳ של הסנכרון) — הבזק עדין */
  function setCaretHighlight(pageIndex) {
    for (const [, el] of pageEls) el.classList.remove('caret-target');
    if (virtual.on) renderWindow(pageIndex - VIRTUAL_WINDOW, pageIndex + VIRTUAL_WINDOW); // D-84
    const el = pageEls.get(pageIndex);
    if (el) el.classList.add('caret-target');
  }

  return {
    root, setResult, scrollToPage, jumpByHebrew, highlightIssue, clearHighlights, setCaretHighlight,
    getZoom: () => zoom, _lastScrollTarget: () => lastScrollTarget,
    // D-84: חשיפה לבדיקות/אבחון של מצב הווירטואליזציה
    isVirtual: () => virtual.on,
    getRenderedCount: () => pageEls.size,
    getPageCount: () => virtual.pages.length
  };
}

module.exports = { buildPreviewTab, parseHebrewNumber };

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

/** S9 — body-last-line-align (center|right|stretch): יישור שורה אחרונה של פסקה. */
function lastLineClass(ln, settings) {
  if (!ln.isLast) return '';
  const mode = settings['body-last-line-align'] || 'center';
  if (mode === 'right') return ' line--last-right';
  if (mode === 'stretch') return ' line--last-stretch';
  return ' line--last-center';
}

function renderLine(ln, doc, settings = {}) {
  const el = doc.createElement('div');
  el.className = 'line' + (ln.isLast ? ' line--last' + lastLineClass(ln, settings) : '');
  el.setAttribute('dir', 'rtl');
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

/**
 * רנדור עמוד שלם. @param {object} page - תוצר dp-planner + header + numbersByIndex
 */
function renderPage(page, settings, doc, header) {
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

  // **S9 (REQ-HDR-05):** עמודי תוכן־עניינים — שורות + נקודות + עוגנים; אין טורי גוף
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
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

module.exports = { renderPage, renderLine, scrubPUAText, bgRgba, PT_CLASS, renderSpanningBand, renderDecorations, renderPageBackgroundAndShaar, renderCustomPageContent, applyCustomStyleSpec };

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
__modules["src/ui/testing-tab.js"] = function (require, module, exports) {
// src/ui/testing-tab.js — לשונית הבדיקה (REQ-UI-06: ממצאים, trace, כיסוי, highlightIssue)
'use strict';

/**
 * כלל 2 (Working_rules): **כל** נתיב שמציג ממצא — טבלה, מסלול, לוח כיסוי —
 * מפעיל את אותה פונקציה activateFinding אחת (jump + highlightIssue). שמות
 * הממצאים בעברית מ־GEOM_KIND_NAMES (כלל 1 — מקור יחיד).
 */

const { GEOM_KIND_NAMES } = require('../audit/report-schema');
const { LIFECYCLE_STATES } = require('../engine/core/ledger');

const STATUS_HE = {
  created: 'נוצר', 'correction-blocked': 'תיקון נחסם', 'correction-reverted': 'תיקון שוחזר',
  'became-observable-later': 'נגלה מאוחר', 'competing-repair-side-effect': 'תופעת לוואי מתחרה',
  persists: 'נותר', resolved: 'נפתר', reintroduced: 'הוחזר', 'not-comparable': 'בלתי־ניתן־להשוואה',
  unresolved: 'לא פתור'
};

const STRUCTURAL_TYPES = new Set(['shaar-main', 'shaar-sub', 'shaar-back', 'toc-general', 'toc-detail', 'custom', 'filler', 'endnotes']);

function buildTestingTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'testing';

  let lastResult = null;

  // ============ סעיף 1: טבלת ממצאים ============
  const findingsSec = doc.createElement('div');
  findingsSec.className = 'testing-section';
  const findingsHead = doc.createElement('h3');
  findingsHead.textContent = 'ממצאים';
  findingsSec.appendChild(findingsHead);

  const filterRow = doc.createElement('div');
  filterRow.className = 'testing-filter-row';
  const filterInput = doc.createElement('input');
  filterInput.setAttribute('type', 'search');
  filterInput.setAttribute('placeholder', 'סינון לפי סוג/עמוד/מזהה…');
  filterInput.setAttribute('aria-label', 'סינון ממצאים');
  const sortSel = doc.createElement('select');
  sortSel.setAttribute('aria-label', 'מיון ממצאים');
  for (const [v, l] of [['page', 'מיון לפי עמוד'], ['kind', 'מיון לפי סוג'], ['status', 'מיון לפי מצב']]) {
    const o = doc.createElement('option');
    o.setAttribute('value', v); o.textContent = l;
    sortSel.appendChild(o);
  }
  filterRow.appendChild(filterInput); filterRow.appendChild(sortSel);
  findingsSec.appendChild(filterRow);

  const findingsTable = doc.createElement('table');
  findingsTable.className = 'findings-table';
  findingsTable.setAttribute('aria-label', 'טבלת ממצאים');
  const thead = doc.createElement('thead');
  const headRow = doc.createElement('tr');
  for (const h of ['סוג', 'עמוד', 'מצב', 'מזהה']) {
    const th = doc.createElement('th'); th.textContent = h; th.scope = 'col';
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  findingsTable.appendChild(thead);
  const tbody = doc.createElement('tbody');
  findingsTable.appendChild(tbody);
  findingsSec.appendChild(findingsTable);
  const findingsSummary = doc.createElement('div');
  findingsSummary.className = 'testing-summary';
  findingsSummary.setAttribute('aria-live', 'polite');
  findingsSec.appendChild(findingsSummary);
  root.appendChild(findingsSec);

  let findings = [];
  function renderFindings() {
    const q = (filterInput.value || '').trim().toLowerCase();
    const sorted = findings.slice().sort((a, b) => {
      if (sortSel.value === 'kind') return String(a.kindHe).localeCompare(String(b.kindHe), 'he');
      if (sortSel.value === 'status') return String(a.status).localeCompare(String(b.status));
      return (a.page != null ? a.page : -1) - (b.page != null ? b.page : -1);
    });
    tbody.textContent = '';
    let shown = 0;
    for (const f of sorted) {
      const hay = `${f.kindHe || ''} ${f.kind} ${f.page != null ? f.page : ''} ${f.id}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      shown++;
      const tr = doc.createElement('tr');
      tr.className = 'finding-row';
      tr.dataset.issueId = f.id;
      tr.setAttribute('tabindex', '0');
      const cells = [
        f.kindHe || GEOM_KIND_NAMES[f.kind] || f.kind,
        f.page != null ? String(f.page) : '—',
        STATUS_HE[f.status] || f.status,
        f.id
      ];
      for (const c of cells) {
        const td = doc.createElement('td'); td.textContent = c; tr.appendChild(td);
      }
      // **כלל 2:** כל נתיב פעלה → אותה פונקציית הפעלה אחידה
      tr.addEventListener('click', () => opts.onActivateFinding && opts.onActivateFinding(f));
      tr.addEventListener('keydown', (ev) => {
        if (ev && (ev.key === 'Enter' || ev.key === ' ')) opts.onActivateFinding && opts.onActivateFinding(f);
      });
      tbody.appendChild(tr);
    }
    findingsSummary.textContent = `${shown} ממצאים מוצגים מתוך ${findings.length}`;
  }
  filterInput.addEventListener('input', renderFindings);
  sortSel.addEventListener('change', renderFindings);

  // ============ סעיף 2: מציג המסלול (trace viewer) ============
  const traceSec = doc.createElement('div');
  traceSec.className = 'testing-section';
  const traceHead = doc.createElement('h3');
  traceHead.textContent = 'מסלול המנוע (trace)';
  traceSec.appendChild(traceHead);
  const stageSel = doc.createElement('select');
  stageSel.setAttribute('aria-label', 'סינון שלבי מסלול');
  {
    const o = doc.createElement('option');
    o.setAttribute('value', ''); o.textContent = 'כל השלבים';
    stageSel.appendChild(o);
  }
  traceSec.appendChild(stageSel);
  const traceTable = doc.createElement('table');
  traceTable.className = 'trace-table';
  traceTable.setAttribute('aria-label', 'אירועי מסלול המנוע');
  const ttHead = doc.createElement('thead');
  const ttRow = doc.createElement('tr');
  for (const h of ['#', 'שלב', 'תווית', 'עמוד', 'נתונים']) {
    const th = doc.createElement('th'); th.textContent = h; th.scope = 'col';
    ttRow.appendChild(th);
  }
  ttHead.appendChild(ttRow);
  traceTable.appendChild(ttHead);
  const ttBody = doc.createElement('tbody');
  traceTable.appendChild(ttBody);
  traceSec.appendChild(traceTable);
  const traceMeta = doc.createElement('div');
  traceMeta.className = 'testing-summary';
  traceSec.appendChild(traceMeta);
  root.appendChild(traceSec);

  let traceEvents = [];
  function renderTrace() {
    const stage = stageSel.value;
    ttBody.textContent = '';
    let shown = 0;
    for (const ev of traceEvents) {
      if (stage && ev.stage !== stage) continue;
      shown++;
      const tr = doc.createElement('tr');
      const cells = [
        String(ev.seq), ev.stage, ev.label,
        ev.pageIndex != null ? String(ev.pageIndex) : '—',
        JSON.stringify(ev.payload || {})
      ];
      for (const c of cells) {
        const td = doc.createElement('td');
        td.textContent = c.length > 120 ? c.slice(0, 117) + '…' : c;
        tr.appendChild(td);
      }
      ttBody.appendChild(tr);
    }
    traceMeta.textContent = `${shown} אירועים מוצגים מתוך ${traceEvents.length}`;
  }
  stageSel.addEventListener('change', renderTrace);

  // ============ סעיף 3: לוח הכיסוי (חשבונאות S1 — REQ-GOV-06) ============
  const covSec = doc.createElement('div');
  covSec.className = 'testing-section';
  const covHead = doc.createElement('h3');
  covHead.textContent = 'לוח כיסוי ואבחון';
  covSec.appendChild(covHead);
  const covGrid = doc.createElement('div');
  covGrid.className = 'coverage-grid';
  covSec.appendChild(covGrid);
  root.appendChild(covSec);

  function setResult(serializedResult) {
    lastResult = serializedResult;
    const report = serializedResult.report;
    findings = (report && report.findings) || [];
    renderFindings();

    // שלבי המסלול הקיימים → בורר
    traceEvents = (serializedResult.trace && serializedResult.trace.events) || [];
    const stages = [...new Set(traceEvents.map(e => e.stage))];
    stageSel.textContent = '';
    {
      const o = doc.createElement('option');
      o.setAttribute('value', ''); o.textContent = 'כל השלבים';
      stageSel.appendChild(o);
    }
    for (const s of stages) {
      const o = doc.createElement('option');
      o.setAttribute('value', s); o.textContent = s;
      stageSel.appendChild(o);
    }
    renderTrace();

    // ---- לוח הכיסוי: סיווג מפורש לכל עמוד (evaluated / excluded+reason) ----
    const pages = serializedResult.pages || [];
    const byType = {};
    let inScope = 0, structural = 0;
    const structuralReasons = [];
    for (const pg of pages) {
      byType[pg.type] = (byType[pg.type] || 0) + 1;
      if (STRUCTURAL_TYPES.has(pg.type)) {
        structural++;
        structuralReasons.push({ page: pg.index, type: pg.type, reason: 'עמוד מבני — מחוץ לזרימת הגוף (שער/תוכן/הערות/מילוי)' });
      } else {
        inScope++;
      }
    }
    const findingsByPage = new Map();
    for (const f of findings) if (f.page != null) findingsByPage.set(f.page, (findingsByPage.get(f.page) || 0) + 1);
    const cleanInScope = inScope - [...findingsByPage.keys()].filter(p => p < pages.length && !STRUCTURAL_TYPES.has(pages[p] && pages[p].type)).length;

    const lifecycle = serializedResult.ledgerSummary || {};
    covGrid.textContent = '';
    const addCard = (label, value, cls) => {
      const card = doc.createElement('div');
      card.className = `coverage-card ${cls || ''}`;
      const v = doc.createElement('div'); v.className = 'coverage-value'; v.textContent = value;
      const l = doc.createElement('div'); l.className = 'coverage-label'; l.textContent = label;
      card.appendChild(v); card.appendChild(l);
      covGrid.appendChild(card);
    };
    addCard('סה\"כ עמודים', String(pages.length));
    addCard('עמודי גוף נבדקו', String(inScope), 'ok');
    addCard('עמודים מבניים (פטורים בסיבה)', String(structural), 'muted');
    addCard('עמודי גוף נקיים ממצאים', String(Math.max(0, cleanInScope)), 'ok');
    addCard('ממצאים פתוחים', String((report.counts && Object.values(report.counts).reduce((a, b) => a + b, 0)) || 0),
      (report.counts && Object.keys(report.counts).length) ? 'warn' : 'ok');
    addCard('אירועי מסלול שנשמטו', String(serializedResult.droppedEvents != null ? serializedResult.droppedEvents : 0),
      serializedResult.droppedEvents === 0 ? 'ok' : 'err');
    addCard('דטרמיניסטיות (hash)', serializedResult.deterministic ? 'אומת' : 'נכשל!', serializedResult.deterministic ? 'ok' : 'err');
    addCard('שימור תוכן', serializedResult.contentPreserved ? 'שלם' : 'חריגה!', serializedResult.contentPreserved ? 'ok' : 'err');
    addCard('ניטרליות גיאומטריה (CP4==CP5)', serializedResult.geometryNeutralVerified ? 'אומתה' : 'נכשלה!', serializedResult.geometryNeutralVerified ? 'ok' : 'err');

    // מחזור חיים (lifecycle) — ספירה לפי מצב
    const life = doc.createElement('div');
    life.className = 'coverage-lifecycle';
    life.textContent = 'מחזור חיים: ' + (Object.entries(lifecycle).map(([k, v]) => `${STATUS_HE[k] || k}: ${v}`).join(' · ') || 'אין ממצאים');
    covGrid.appendChild(life);

    // פירוט פטורים — שקיפות מלאה (שיעור 17/18: אין "כיסוי מלא" בלי הסבר)
    if (structuralReasons.length) {
      const det = doc.createElement('details');
      det.className = 'coverage-details';
      const sum = doc.createElement('summary');
      sum.textContent = `פירוט ${structuralReasons.length} עמודים פטורים מבדיקת זרימת גוף`;
      det.appendChild(sum);
      for (const r of structuralReasons) {
        const d = doc.createElement('div');
        d.className = 'coverage-reason';
        d.textContent = `עמוד ${r.page + 1} (${r.type}): ${r.reason}`;
        det.appendChild(d);
      }
      covGrid.appendChild(det);
    }
  }

  // ================= S11: המלצות עריכה עם הוכחה (REQ-GOV-11) =================
  const recsWrap = doc.createElement('section');
  recsWrap.className = 'recommendations';
  recsWrap.setAttribute('aria-label', 'המלצות עריכה עם הוכחה');
  const recsTitle = doc.createElement('h3');
  recsTitle.textContent = 'המלצות עריכה (עם הוכחת reflow חיה — בלי הוכחה לא מוצג)';
  recsWrap.appendChild(recsTitle);
  const recsList = doc.createElement('div');
  recsList.className = 'recommendations-list';
  recsWrap.appendChild(recsList);
  root.appendChild(recsWrap);

  function setRecommendations(recsResult) {
    recsList.textContent = '';
    if (!recsResult) {
      const d = doc.createElement('div');
      d.className = 'recommendations-none';
      d.textContent = 'המלצות כבויות בריצה זו.';
      recsList.appendChild(d);
      return;
    }
    const head = doc.createElement('div');
    head.className = 'recommendations-head';
    head.setAttribute('role', 'status');
    if (recsResult.computed && recsResult.recommendations.length) {
      head.textContent = `חושבו ${recsResult.recommendations.length} המלצות מוכחות (${recsResult.dryRuns} הרצות בדיקה; ${recsResult.rejected} מועמדות נפסלו בהיעדר הוכחה).`;
    } else if (recsResult.computed) {
      head.textContent = 'אין המלצות עריכה כרגע — אין ממצאים המקבלים המלצה, או שאף עריכה לא עברה את מבחן ההוכחה.';
    } else {
      head.textContent = `המלצות לא חושבו אוטומטית (${recsResult.reason}). ניתן לדרוש חישוב מפורש.`;
    }
    recsList.appendChild(head);
    for (const rec of recsResult.recommendations || []) {
      const card = doc.createElement('article');
      card.className = 'recommendation-card';
      card.dataset.recId = rec.id;

      const what = doc.createElement('div');
      what.className = 'recommendation-what';
      const kindHe = rec.finding.kind === 'runt-line' ? 'שורת שדון' : rec.finding.kind === 'column-imbalance' ? 'אי־איזון טורים' : 'הכלה';
      what.textContent = `${kindHe} בעמוד ${(rec.finding.page || 0) + 1} → הצעה: ${rec.edit.description}`;
      card.appendChild(what);

      const diff = doc.createElement('div');
      diff.className = 'recommendation-diff';
      const before = doc.createElement('div');
      before.className = 'recommendation-diff-side recommendation-diff-before';
      before.textContent = `לפני: ${rec.edit.before}`;
      const after = doc.createElement('div');
      after.className = 'recommendation-diff-side recommendation-diff-after';
      after.textContent = `אחרי: ${rec.edit.after}`;
      diff.appendChild(before); diff.appendChild(after);
      card.appendChild(diff);

      const proof = doc.createElement('div');
      proof.className = 'recommendation-proof';
      proof.textContent = `✓ הוכחה: ${rec.proof.beforeHash.slice(0, 12)}… → ${rec.proof.afterHash.slice(0, 12)}… · הממצא ${rec.proof.removedFinding} הוסר · ממצאים חדשים: 0 · עמודים ${rec.proof.pagesBefore}→${rec.proof.pagesAfter}`;
      card.appendChild(proof);

      const apply = doc.createElement('button');
      apply.type = 'button'; apply.className = 'btn btn--ghost';
      apply.textContent = '✔ החל עריכה במקור';
      apply.setAttribute('aria-label', 'החלת ההמלצה על טקסט המקור');
      apply.addEventListener('click', () => opts.onApplyRecommendation && opts.onApplyRecommendation(rec));
      card.appendChild(apply);
      recsList.appendChild(card);
    }
  }

  return { root, setResult, setRecommendations };
}

module.exports = { buildTestingTab, STATUS_HE };

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
__modules["src/ui/worker-client.js"] = function (require, module, exports) {
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
    this.pending = new Map();   // **03.11:** עבודות צד (ייצוא/רישום גופן) — מקבילות לעימוד
    transport.setHandler((m) => this._onMessage(m));
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

};
__modules["src/ui/retypeset-policy.js"] = function (require, module, exports) {
// src/ui/retypeset-policy.js — מדיניות עימוד־מחדש (REQ-UI-02, D-19/D-64; סגירת D-44)
'use strict';

/**
 * **D-64 — מחלקת שינוי קל/כבד:**
 * - **קל (light):** מפתחות שנצרכים בזמן־רינדור בלבד (dom-renderer / planBackground ברינדר).
 *   שינוי קל ⇒ רינדור מחדש של התוצא הקיים **בלי הרצת מנוע** — מרוכז (debounce)
 *   לפי settings['debounce-light-change-ms'] (ברירת מחדל 350ms, Spec §5.3).
 * - **כבד (heavy):** כל השאר (פריסה/מדידה/מספור/כותרות/הערות/מבנה).
 *   שינוי כבד ⇒ **אין עימוד אוטומטי** (F-06) — כפתור ⚡ מהבהב; לחיצה = נתיב
 *   מיידי בלי debounce (Claude §6.2(7)).
 *
 * ההוכחה (בדיקת s10 'D-64 light class is render-equivalent'): לכל מפתח קל,
 * רינדור התוצא הישן עם ההגדרות החדשות === רינדור תוצאת מנוע מלא עם אותן
 * הגדרות (מילה־במילה ב־DOM). מפתח שלא עומד בשקילות אינו קל — גם אם נראה כך.
 */

/** מפתחות קלים — נצרפים בזמן־רינדור בלבד (הוכחת שקילות בבדיקה; ראו D-64). */
const LIGHT_KEYS = new Set([
  'background-color',        // renderPage: root.style.backgroundColor (rgba אמיתי — P0-5)
  'background-opacity',      // renderPage: rgba()
  'background-image',        // renderPageBackgroundAndShaar → planBackground בזמן רינדר
  'background-texture',      // כנ"ל
  'background-inset-mm',     // כנ"ל (מ״מ→px בזמן רינדר)
  'footnote-separator-rule', // renderFootnoteArea: מחלקת fn-rule--*
  'body-last-line-align'     // lastLineClass: מחלקת line--last-*
]);

/** @returns {'light'|'heavy'} מחלקת השינוי של מפתח הגדרה */
function classifyChange(key) {
  return LIGHT_KEYS.has(key) ? 'light' : 'heavy';
}

/** רוחב הריכוז לשינויים קלים — צרכן אמיתי של debounce-light-change-ms (D-44). */
function getDebounceMs(settings) {
  const v = Number(settings && settings['debounce-light-change-ms']);
  return Number.isFinite(v) && v >= 50 ? Math.min(2000, v) : 350;
}

/**
 * טבלת המדיניות לתצוגה בעזרת ה־UI (REQ-UI-02: "policy table rendered in UI help").
 * נתונים בלבד — הפאנל מרנדר מכאן; אין הגיון כפול.
 */
function policyTable() {
  return [
    {
      cls: 'light', labelHe: 'שינוי קל — רינדור מחדש אוטומטי (מרוכז)',
      keys: [...LIGHT_KEYS],
      behaviorHe: 'מרוכז לפי «השהיית שינויים קלים» (ברירת מחדל 350ms); רינדור בלבד — בלי הרצת מנוע; תקציב ≤ 2 שניות.'
    },
    {
      cls: 'heavy', labelHe: 'שינוי כבד — כפתור ⚡ «עדכן ועמד מחדש»',
      keys: ['(כל שאר ההגדרות — פריסה, טיפוגרפיה, מספור, כותרות, הערות, מבנה)'],
      behaviorHe: 'אין עימוד אוטומטי משום בקרה (F-06); הכפתור מהבהב עד לחיצה; לחיצה = עימוד מיידי בלי debounce.'
    }
  ];
}

module.exports = { LIGHT_KEYS, classifyChange, getDebounceMs, policyTable };

};
__modules["src/ui/caret-map.js"] = function (require, module, exports) {
// src/ui/caret-map.js — מיפוי דו־כיווני סמן↔עמוד (REQ-UI-05: "סנכרון סמן↔עמוד")
'use strict';

/**
 * מבוסס על חוזה הטוקנים של המנוע: כל שורת־גוף לא־ריקה ⇒ טוקן אחד בדיוק
 * (block-tokenizer); שורות העמודים נושאות tokenId. המפה מחברת:
 *   מיקום תו במקור ← שורת גוף ← טוקן ← העמוד שמכיל את שורותיו,
 * ובכיוון ההפוך: עמוד ← הטוקן הראשון בסדר הקריאה ← שורת מקור ← מיקום תו.
 *
 * פתיח המסמך (metadata) אינו טוקנים — מוצא מעבר לפתיח לפי אותו כלל
 * של dfa-lexer (שורה ריקה/כותרת/הערת־סיום סוגרות את הפתיח).
 */

const { lexDocument, HEADING_RE, ENDNOTE_PREFIX } = require('../engine/parser/dfa-lexer');

/** קווי המקור: מיקומי התחלה של כל שורה. */
function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function buildCaretMap(rawText, serializedResult) {
  const { bodyLines } = lexDocument(rawText);
  const tokens = serializedResult.tokens; // [{id, type, level, raw}] — סדר הפקוד
  const pages = serializedResult.pages;

  // tokenId → אינדקס עמוד ראשון שמכיל אותו (כולל פס חוצה־טורים — FWD-1)
  const pageByToken = new Map();
  const tokensByPage = new Map();
  for (const pg of pages) {
    const lines = [
      ...((pg.spanning && pg.spanning.lines) || []),
      ...(pg.columns || []).flat()
    ];
    const set = new Set();
    for (const ln of lines) {
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok == null) continue;
      set.add(tok);
      if (!pageByToken.has(tok)) pageByToken.set(tok, pg.index);
    }
    tokensByPage.set(pg.index, [...set]);
  }

  // שורת־גוף לא־ריקה ↔ אינדקס טוקן מצטבר (כלל block-tokenizer: trim + לא ריק ⇒ טוקן)
  let nonEmpty = 0;
  const tokenAtBodyLine = new Array(bodyLines.length).fill(-1); // bodyLineIdx → tokenIdx (הטוקן של השורה עצמה)
  const lastTokenThrough = new Array(bodyLines.length).fill(-1); // bodyLineIdx → טוקן אחרון שנוצר עד וכולל שורה זו
  for (let i = 0; i < bodyLines.length; i++) {
    if (bodyLines[i].trim() !== '') { tokenAtBodyLine[i] = nonEmpty; nonEmpty++; }
    lastTokenThrough[i] = nonEmpty - 1;
  }

  const starts = lineStarts(rawText);
  const bodyStartLine = starts.length - bodyLines.length; // שורות הגוף הן סיומת השורות (הפתיח נזנח)

  /** מיקום תו ← אינדקס שורת־מקור */
  function lineOfChar(charIndex) {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= charIndex) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  /** טוקן ← עמוד; טוקן שלא הוצב (editorial) ← העמוד של הטוקן הקודם שהוצב */
  function pageOfTokenIdx(ti) {
    for (let k = ti; k >= 0; k--) {
      const p = pageByToken.get(tokens[k].id);
      if (p != null) return p;
    }
    return pages.length ? pages[0].index : null;
  }

  /** מיקום תו במקור ← אינדקס עמוד (כיוון א׳ של הסנכרון) */
  function caretToPage(charIndex) {
    if (!pages.length) return null;
    const line = lineOfChar(Math.max(0, Math.min(charIndex, rawText.length)));
    const bodyLine = line - bodyStartLine;
    if (bodyLine < 0) return pages[0].index; // פתיח המסמך — העמוד הראשון
    const ti = lastTokenThrough[Math.min(bodyLine, bodyLines.length - 1)];
    if (ti < 0) return pages[0].index;
    return pageOfTokenIdx(ti);
  }

  /** אינדקס עמוד ← מיקום תו במקור (תחילת שורת המקור של הטוקן הראשון; כיוון ב׳) */
  function pageToCaret(pageIndex) {
    const toks = tokensByPage.get(pageIndex);
    if (!toks || !toks.length) return null;
    const tokenId = toks[0];
    const ti = tokens.findIndex(t => t.id === tokenId);
    if (ti < 0) return null;
    // אינדקס שורת־גוף: מספר הטוקנים שנוצרו עד טוקן זה = מספר שורות לא־ריקות עד אליו
    let bodyLine = -1, count = 0;
    for (let i = 0; i < bodyLines.length; i++) {
      if (bodyLines[i].trim() !== '') {
        if (count === ti) { bodyLine = i; break; }
        count++;
      }
    }
    if (bodyLine < 0) return null;
    const rawLine = bodyStartLine + bodyLine;
    return starts[Math.min(rawLine, starts.length - 1)];
  }

  return { caretToPage, pageToCaret, pageByToken, tokensByPage, pageCount: pages.length };
}

module.exports = { buildCaretMap };

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
__modules["src/ui/inline-transport.js"] = function (require, module, exports) {
throw new Error('bundle: module src/ui/inline-transport.js excluded from this bundle (by design — see tools/build-worker-bundle.js)');
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
  const pagesHtml = [];
  for (const pg of result.pages) {
    pagesHtml.push(renderPage(pg, settings, doc, result.metadata).outerHTML());
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
    const projected = projectDocument(result, settings);
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
.line{white-space:normal;text-align:right}
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
__modules["src/ui/imud-library.js"] = function (require, module, exports) {
// src/ui/imud-library.js — ספריית נכסי IMUD בדפדפן (03.11, EXT-14)
'use strict';

/**
 * טעינה עצלה של נכסי הפרויקט המקורי המוטמעים (ui/assets/imud/):
 *  - imud-fonts.json — קטלוג 439 פונטי העדיפות (הומרו ל-TTF)
 *  - shaar_main/sub/back, ornaments_up_down/left_right, section_dividers,
 *    header_ornaments — עיצובי SVG (חיטוי ברישום)
 *  - default_settings.json — לחצן «ברירות המחדל המקוריות»
 *
 * רישום דו-צדדי: asset-registry חי גם בחבילת ה-UI (רינדור תצוגה) וגם ב-Worker
 * (עימוד/ייצוא) — כל פריט נרשם בשניהם. פונטים: FontFace לתצוגה + registerFont
 * ב-Worker (מדידת font-metrics) + הבתים נשמרים לייצוא PDF.
 */

const { registerAssets } = require('../engine/decoration/asset-registry');
const { importImudSettings } = require('../engine/core/legacy-settings-map');
const { getSettingDefs } = require('../engine/core/settings-registry');

const BASE = 'assets/imud';
const DESIGN_FILES = {
  'shaar-main': 'shaar_main.json',
  'shaar-sub': 'shaar_sub.json',
  'shaar-back': 'shaar_back.json',
  'orn-ud': 'ornaments_up_down.json',
  'orn-lr': 'ornaments_left_right.json',
  'divider': 'section_dividers.json',
  'hdr-orn': 'header_ornaments.json'
};

function createImudLibrary(engine) {
  const fontCatalog = { loaded: false, families: [], byFamily: new Map(), bytesB64: new Map(), faces: new Set() };
  const designs = new Map(); // collection → {loaded, items:[{id,name,box}]}
  const appliedFontsReady = new Map(); // family → Promise<ArrayBuffer|null>

  async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`imud-library: ${path} → ${r.status}`);
    return r.json();
  }

  /** קטלוג הפונטים (439 משפחות). @returns {Promise<string[]>} */
  async function loadFontCatalog() {
    if (fontCatalog.loaded) return fontCatalog.families;
    const list = await fetchJson(`${BASE}/imud-fonts.json`);
    fontCatalog.families = list.map(e => e.family);
    for (const e of list) fontCatalog.byFamily.set(e.family, e.file);
    fontCatalog.loaded = true;
    return fontCatalog.families;
  }

  /** טעינת פונט TTF: בתים ל-Worker (מדידה+ייצוא) + FontFace לתצוגה. @returns {Promise<ArrayBuffer|null>} */
  async function loadFont(family) {
    if (!fontCatalog.loaded) await loadFontCatalog();
    const file = fontCatalog.byFamily.get(family);
    if (!file) return null; // פונן מחוץ לספרייה — המערכת תיפול לגופן מערכת (מתועד)
    if (appliedFontsReady.has(family)) return appliedFontsReady.get(family);
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/${file}`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      // בסיס 64 לייצוא HTML העצמאי (@font-face data-URI) — מחושב פעם אחת בטעינה
      try {
        const u8 = new Uint8Array(buf);
        let bin = '';
        const CH = 0x8000;
        for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
        fontCatalog.bytesB64.set(family, btoa(bin));
      } catch (e) { /* אין btoa (סביבה חריגה) — הייצוא ידלג על ההטמעה */ }
      // 1) Worker: מדידת גופן אמיתי (measure-impl=font-metrics) + ייצוא PDF
      try {
        await engine.registerFont({ name: family, bytes: buf.slice(0) });
      } catch (e) { /* רישום נכשל — נמשיך ל-FontFace; הייצוא ידווח בבירור */ }
      // 2) תצוגה: @font-face חי
      if (!fontCatalog.faces.has(family) && typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace(family, buf);
          await face.load();
          document.fonts.add(face);
          fontCatalog.faces.add(family);
        } catch (e) { /* פונט תצוגה נכשל — הייצוא עדיין תקין */ }
      }
      return buf;
    })();
    appliedFontsReady.set(family, p);
    return p;
  }

  /** רשימת עיצובי אוסף (מזהה+שם) — טעינה עצלה של הקובץ. */
  async function listDesigns(collection) {
    const meta = designs.get(collection);
    if (meta && meta.loaded) return meta.items;
    const file = DESIGN_FILES[collection];
    if (!file) return [];
    const raw = await fetchJson(`${BASE}/${file}`);
    const items = (raw || []).map(d => ({ id: d.id, name: d.name || d.id, box: d.box || null }));
    designs.set(collection, { loaded: true, items, raw: new Map((raw || []).map(d => [d.id, d])) });
    return items;
  }

  /** רישום פריט עיצוב בשני הצדדים (UI + Worker) והחזרת ההפניה המלאה. */
  async function ensureDesign(collection, id) {
    const meta = designs.get(collection);
    if (meta && meta.raw && meta.raw.has(id) && meta.registered && meta.registered.has(id)) {
      return `imud:${collection}:${id}`;
    }
    if (!meta || !meta.raw) await listDesigns(collection);
    const m = designs.get(collection);
    const item = m.raw && m.raw.get(id);
    if (!item) return null;
    // UI-side: רישום מקומי (התצוגה מרנדרת דרך dom-renderer)
    const resUi = registerAssets(collection, [{ id: item.id, name: item.name, svg: item.svg, box: item.box }]);
    if (!resUi.ok && resUi.registered === 0) throw new Error(`imud-library: design rejected (${resUi.rejected[0] && resUi.rejected[0].reason})`);
    // Worker-side: העברת ה-SVG דרך הפרוטוקול (register-assets)
    try {
      await engine.registerAssets({ collection, items: [{ id: item.id, name: item.name, svg: item.svg, box: item.box }] });
    } catch (e) { /* ה-Worker ידווח; התצוגה עדיין תקינה */ }
    if (!m.registered) m.registered = new Set();
    m.registered.add(id);
    return `imud:${collection}:${id}`;
  }

  /** ברירות המחדל המקוריות — ייבוא מלא דרך טבלת ה-disposition. */
  async function loadLegacyDefaults() {
    const legacy = await fetchJson(`${BASE}/default_settings.json`);
    const { settings, unmapped, report } = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)));
    return { settings, unmapped, report };
  }

  /** CSS של הפונטים שנטענו — להטמעה בייצוא HTML העצמאי (@font-face data-URI). */
  function exportFontCss() {
    let css = '';
    for (const [family, b64] of fontCatalog.bytesB64) {
      css += `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:swap}\n`;
    }
    return css;
  }

  return { loadFontCatalog, loadFont, listDesigns, ensureDesign, loadLegacyDefaults, exportFontCss };
}

module.exports = { createImudLibrary, DESIGN_FILES };

};
__modules["src/engine/core/legacy-settings-map.js"] = function (require, module, exports) {
// src/engine/core/legacy-settings-map.js — S4.5-ד: מיפוי מלא של הגדרות IMUD_TORANI (03.11)
'use strict';

/**
 * **רקע (ביקורת 03.11, סקירה 2):** תוכנית העבודה (S4) דרשה רישום־על של כל
 * ההגדרות מכל הגרסאות והגירה ללא אובדן. בפועל נבנה רישום RED עקבי אך 264
 * מפתחות default_settings.json של המקור לא קיבלו disposition מפורש. המודול
 * הזה הוא טבלת האמת: **לכל מפתח מקור** — מיפוי למפתח RED (מלא/בטרנספורם),
 * איחוד, מצב-UI (ללא אפקט מנועתי), או הסרה מנומקת (עם הפניית מעקב).
 *
 * עקרונות:
 * - אין מפתח "לא מוכר" — הכל מקבל שורה; שער הקבלה: 100% disposition.
 * - ערכי המקור מוחלים בעת ייבוא (importImudSettings); ברירות המחדל של RED
 *   עצמן נשארות כהחלטות RED המתועדות — ההחלפה מפורשת והפיכה.
 * - טרנספורמים מתועדים (יחידות/סמנטיקה), לא רק שמות.
 */

/** חילוץ משפחת הגופן הראשונה מערך CSS: "'Guttman Rashi', 'Frank Ruhl Libre', serif" ⇒ "Guttman Rashi". */
function firstFamily(css) {
  const m = String(css || '').match(/'([^']+)'/);
  return m ? m[1] : String(css || '').split(',')[0].trim();
}

/** 22% (מגובה תיבת התוכן של A4 בפועל) ⇒ פיקסלים — יחידות המקור אחוז מגובה התוכן. */
function pctToPx(v) { return Math.round(1040 * (parseFloat(v) / 100)); }

/** סגנונות פתיחה של המקור ⇒ מצבי RED (headings-escort). */
const OPEN_MODE_MAP = {
  'new_page_1col': 'new-page',
  'span_1col': 'full-width',
  'inline_2col': 'regular',
  'side_note': 'side-note',
  'sub_shaar': 'new-page' // שער-משנה מובנה: show-shaar-sub נלווה ב-merge
};

/** עמדות עיצוב-מפריד של המקור ⇒ סגנונות RED. */
const DIVIDER_MAP = { 'none': 'none', 'thin': 'thin', 'dashed': 'dashed', 'double': 'double', 'spear': 'thin' };

/** מיקומי מספור של המקור ⇒ RED. */
const NUMPOS_MAP = {
  'bottom_center': 'bottom-center', 'bottom_outer': 'bottom-outer', 'bottom_left': 'bottom-left', 'bottom_right': 'bottom-right',
  'top_center': 'top-center', 'top_outer': 'top-outer', 'in_header': 'in-header'
};

/**
 * טבלת ה-disposition. kind:
 *  - 'mapped'   → to (מפתח RED) + transform אופציונלי — ערך מוחל בייבוא
 *  - 'merged'   → מוזג למפתח אחר/כמה מפתחות — מתועד ב-reason
 *  - 'ui-state' → מצב פאנל של האפליקציה הישנה; נשמר כנתון, אין אפקט מנועתי
 *  - 'removed'  → לא ב-RED; סיבה מנומקת + מזהה מעקב (ISSUE_REGISTRY)
 */
const DISPOSITIONS = {
  // ============ טיפוגרפיה של הגוף ============
  'font-body': { kind: 'mapped', to: 'body-font', transform: firstFamily, reason: 'משפחה ראשונה מרשימת ה-fallback של המקור' },
  'size-body': { kind: 'mapped', to: 'body-font-size-pt', transform: parseFloat, reason: 'pt (המקור 12; RED 14 — ההפרש מתועד כהחלטת RED)' },
  'line-height-body': { kind: 'mapped', to: 'body-line-height', transform: parseFloat },
  'body-last-line-align': { kind: 'mapped', to: 'body-last-line-align' },

  // ============ מילה ראשונה ============
  'drop-word-mode': { kind: 'mapped', to: 'first-word-mode', transform: (v) => ({ 'window': 'drop', 'drop': 'drop', 'inline': 'inline', 'bold': 'bold', 'none': 'none' }[v] || 'drop'), reason: 'window ⇒ drop (אותו מנגנון חלון)' },
  'drop-word-count': { kind: 'mapped', to: 'first-word-length', transform: parseInt },
  'drop-word-min-lines': { kind: 'mapped', to: 'first-word-threshold-lines', transform: parseInt, reason: 'המקור 2; RED 3 — הייבוא משחזר את המקור' },
  'font-first-word': { kind: 'mapped', to: 'first-word-font', transform: firstFamily, reason: 'S4.5: מפתח חדש ב-RED (היה חסר)' },
  'size-first-word': { kind: 'mapped', to: 'first-word-size-em', transform: parseFloat, reason: 'S4.5: מפתח חדש ב-RED (היה כפול 2 מוקשה)' },

  // ============ דיבור המתחיל ============
  'auto-dh': { kind: 'mapped', to: 'dh-auto-detect', transform: (v) => v === true || v === 'true' },
  'font-dh': { kind: 'mapped', to: 'dh-font', transform: firstFamily },

  // ============ מצבי כותרות H0–H7 ============
  'mode-h0': { kind: 'mapped', to: 'heading-0-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h1': { kind: 'merged', to: 'heading-1-mode', transform: (v) => OPEN_MODE_MAP[v] || 'new-page', reason: 'sub_shaar ⇒ new-page + show-shaar-sub=true (השער המשנה מובנה ב-S8)' },
  'mode-h2': { kind: 'mapped', to: 'heading-2-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h3': { kind: 'mapped', to: 'heading-3-mode', transform: (v) => OPEN_MODE_MAP[v] || 'full-width' },
  'mode-h4': { kind: 'mapped', to: 'heading-4-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h5': { kind: 'mapped', to: 'heading-5-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h6': { kind: 'mapped', to: 'heading-6-mode', transform: (v) => OPEN_MODE_MAP[v] || 'regular' },
  'mode-h7': { kind: 'mapped', to: 'heading-7-mode', transform: (v) => OPEN_MODE_MAP[v] || 'side-note' },
  'odd-h0': { kind: 'removed', reason: 'פתיחה בעמוד אי-זוגי לפי רמה — תכנון העמודים של RED מיישר פתיחות חלקים ל-recto אוטומטית; בקרה פר-רמה טרם נדרשה', issue: 'EXT-15' },
  'odd-h1': { kind: 'removed', reason: 'פתיחת H1 בעמוד אי-זוגי — RED מיישר פתיחות חלקים ל-recto אוטומטית', issue: 'EXT-15' },
  'odd-h2': { kind: 'removed', reason: 'פתיחת H2 בעמוד אי-זוגי — בקרה פר-רמה טרם נדרשה ב-RED', issue: 'EXT-15' },
  'h2-auto-siman': { kind: 'removed', reason: 'מספור סימן אוטומטי (א-ב-ג בראשי סימנים) — מנגנון לא קיים ב-RED; נרשם כפער', issue: 'EXT-16' },
  'h2-reset-siman': { kind: 'removed', reason: 'איפוס מונה סימנים לכל פרק — תלוי ב-EXT-16', issue: 'EXT-16' },
  'h2-top-distance': { kind: 'mapped', to: 'h2-top-offset', transform: pctToPx, reason: '22% מגובה תיבת התוכן (1040px ב-A4 של RED) ⇒ פיקסלים' },

  // ============ מזהי הערות (S4.5-ג — הוטמעו זה עתה) ============
  'en-line-prefix': { kind: 'mapped', to: 'en-line-prefix' },
  'fn-delim-open': { kind: 'mapped', to: 'fn-delim-open' },
  'fn-delim-close': { kind: 'mapped', to: 'fn-delim-close' },

  // ============ הערות שוליים ============
  'fn-columns': { kind: 'mapped', to: 'footnote-columns', transform: parseInt },
  'fn-layout-mode': { kind: 'mapped', to: 'fn-layout-mode' },
  'fn-reset-mode': { kind: 'mapped', to: 'footnote-reset-policy' },
  'fn-title-text': { kind: 'mapped', to: 'endnote-title-text' },
  'note-numbering-style': { kind: 'mapped', to: 'footnote-marker-style', transform: (v) => ({ 'gematria': 'hebrew-geresh', 'hebrew': 'hebrew-geresh', 'decimal': 'decimal', 'asterisk': 'asterisk', 'parenthesis': 'parenthesis' }[v] || 'hebrew-geresh') },
  'note-marker-type': { kind: 'merged', to: 'footnote-marker-style', reason: 'סוג הסמן (super) נגזר מהסגנון ב-RED; אין עילוי-נפרד נפרד' },
  'note-marker-size': { kind: 'removed', reason: 'גודל סמן נפרד — RED מגזר מגודל הגוף; נרשם כפער', issue: 'EXT-17' },
  'note-listing-num-size': { kind: 'removed', reason: 'כנ"ל — גודל מספור ברשימת ההערות', issue: 'EXT-17' },
  'note-num-separator': { kind: 'removed', reason: 'מפריד בין מספר לטקסט בהערה — RED משתמש ברווח; נרשם כפער', issue: 'EXT-17' },
  'note-rule-style': { kind: 'mapped', to: 'footnote-separator-rule', reason: 'star ⇒ star (enum זהה ב-RED)' },
  'note-header-orn-r': { kind: 'removed', reason: 'עיטור בצד ימין של כותרת עמודי-ההערות — טרם ממומש ב-RED', issue: 'EXT-4' },
  'note-header-orn-l': { kind: 'removed', reason: 'עיטור בצד שמאל של כותרת עמודי-ההערות — טרם ממומש ב-RED', issue: 'EXT-4' },

  // ============ הגנות שורות ============
  'avoid-orphans': { kind: 'merged', to: 'prevent-orphans-top', transform: (v) => v !== false, reason: 'RED מפריד יתומים עליונים/תחתונים בנפרד' },
  'avoid-widows': { kind: 'merged', to: 'prevent-widows-top', transform: (v) => v !== false, reason: 'כנ"ל' },
  'avoid-runt-word': { kind: 'mapped', to: 'runt-min-width-pct', transform: (v) => (v === false || v === 'false') ? 0 : 20, reason: 'בוליאני המקור ⇒ סף אחוז ב-RED (כבוי=0; דלוק=20%)' },

  // ============ עיטורים ============
  'h2-ornament-set': { kind: 'merged', to: 'h2-orn-top', transform: (v) => v !== 'none' ? v : 'none', reason: 'ערכת עיטורים כללית ⇒ העיטור העליון; ערכות IMUD דרך imud-orn-*' },
  'h2-ornament-top-style': { kind: 'mapped', to: 'h2-orn-top' },
  'h2-ornament-bottom-style': { kind: 'mapped', to: 'h2-orn-bottom' },
  'h2-title-orn-mode': { kind: 'mapped', to: 'h2-orn-scope', transform: (v) => ({ 'sign': 'sign', 'title': 'title', 'both': 'both', 'none': 'both' }[v] || 'both') },
  'h2-title-ornament-top-style': { kind: 'merged', to: 'h2-orn-top', reason: 'עיטור כותרת-הסימן — מוזג לעיטור הסימן (RED מאחד)' },
  'h2-title-ornament-bottom-style': { kind: 'merged', to: 'h2-orn-bottom', reason: 'עיטור כותרת-הסימן התחתון — מוזג לעיטור הסימן ב-RED' },
  'h2-title-ornament-r': { kind: 'mapped', to: 'h2-orn-side' },
  'h2-title-ornament-l': { kind: 'merged', to: 'h2-orn-side', reason: 'RED מציב עיטור צד אחד לשני הצדדים' },
  'h2-orn-fit-text': { kind: 'mapped', to: 'h2-orn-fit-to-text' },
  'h3-ornament-set': { kind: 'merged', to: 'h3-side-orn', reason: 'ערכת H3 ⇒ עיטור הצד של H3' },
  'h3-ornament-r': { kind: 'mapped', to: 'h3-side-orn' },
  'h3-ornament-l': { kind: 'merged', to: 'h3-side-orn', reason: 'עיטור צד שמאל של H3 — RED מאחד לעיטור צד יחיד' },
  'section-divider-style': { kind: 'merged', to: 'imud-divider', reason: 'מפרידי סעיפים מעוצבים — דרך ספריית IMUD (image) או heading-dividers-h3-h6; spear ⇒ עיצוב ספרייה' },
  'heading-divider-h3': { kind: 'mapped', to: 'heading-dividers-h3-h6', transform: (v) => v !== 'none' },
  'h2-orn-scope': { kind: 'mapped', to: 'h2-orn-scope' },
  'col-divider-style': { kind: 'mapped', to: 'column-divider-style', transform: (v) => DIVIDER_MAP[v] || 'none' },

  // ============ מספור ============
  'page-num-position': { kind: 'mapped', to: 'page-num-position', transform: (v) => NUMPOS_MAP[v] || 'bottom-center' },
  'page-num-format': { kind: 'mapped', to: 'page-num-format' },
  'page-num-frame': { kind: 'mapped', to: 'page-num-frame' },
  'page-num-start-idx': { kind: 'mapped', to: 'page-num-start-idx', transform: parseInt },
  'page-num-initial-value': { kind: 'mapped', to: 'page-num-initial-value', transform: parseInt },
  'main-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'RED מונה עמודי שער גלובלית (count-shaar-pages); בקרה פר-סוג טרם נפרדה', issue: 'EXT-18' },
  'main-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער ראשי — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'back-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'מניית שער אחורי — RED מונה עמודי שער גלובלית', issue: 'EXT-18' },
  'back-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער אחורי — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'sub-shaar-count-numbering': { kind: 'merged', to: 'count-shaar-pages', reason: 'מניית שער משנה — RED מונה עמודי שער גלובלית', issue: 'EXT-18' },
  'sub-shaar-show-number': { kind: 'merged', to: 'count-shaar-pages', reason: 'הצגת מספר בשער משנה — בקרה פר-סוג במעקב', issue: 'EXT-18' },
  'general-toc-count-numbering': { kind: 'mapped', to: 'general-toc-count-numbering' },
  'general-toc-show-numbering': { kind: 'mapped', to: 'general-toc-show-numbering' },
  'detailed-toc-count-numbering': { kind: 'mapped', to: 'detailed-toc-count-numbering' },
  'detailed-toc-show-numbering': { kind: 'mapped', to: 'detailed-toc-show-numbering' },

  // ============ שערים/ערכות נושא (בוררי האפליקציה הישנה) ============
  'style-set-select': { kind: 'ui-state', reason: 'בורר סגנון כללי בפאנל הישן; ב-RED: תבניות/ערכות נושא' },
  'active-theme-select': { kind: 'ui-state', reason: 'ערכת נושא פעילה — ב-RED: theme-set-id / imud-shaar-*' },

  // ============ כותרות עליונות (25 מפתחות hdr-*) ============
  'hdr-title-split': { kind: 'removed', reason: 'פיצול כותרת עליונה לשניים (ראש|שני) — RED מציג מקור אחד לכל מיקום; פיצול דינמי טרם ממומש', issue: 'EXT-19' },
  'hdr-alternating': { kind: 'removed', reason: 'החלפה אוטומטית recto/verso — RED מגדיר recto/verso בנפרד (header-verso-*/header-recto-*) ולכן אין צורך במתג; נשמר במעקב לצורך קיצור', issue: 'EXT-19' }
};

/** כללי משפחה — מצבי UI של האפליקציה הישנה (נשמרים כנתונים, אין אפקט מנועתי). */
const FAMILY_RULES = [
  { re: /^f-/, kind: 'ui-state', reason: 'גודל/גופן רכיב בפאנל הישן — חלק מפונקציונליות שמומשה במפתחות RED המקבילים; השאר במעקב EXT-17' },
  { re: /^s-/, kind: 'ui-state', reason: 'גודל/סגנון רכיב בפאנל הישן — מומש במפתחות RED המקבילים; השאר במעקב EXT-17' },
  { re: /^data-/, kind: 'ui-state', reason: 'נתוני בורר עיצובים/תמונות באפליקציה הישנה — ב-RED: הפניות imud: בספריית הנכסים' },
  { re: /^hdr-/, kind: 'ui-state', reason: 'קונפיגורציית כותרות עליונות בפאנל הישן — המנגנון ב-RED: header-recto/verso-*-source' },
  { re: /^builder-/, kind: 'ui-state', reason: 'מצבי בורר העיצובים (assets picker) של האפליקציה הישנה' },
  { re: /^dim-/, kind: 'ui-state', reason: 'ממדי עמוד בפאנל הישן — RED: page-size + grid-*' },
  { re: /^aq-/, kind: 'ui-state', reason: 'מצבי AutoQuality בפאנל הישן — RED: משפחת aq-*' },
  { re: /^inp-/, kind: 'ui-state', reason: 'שדות קלט בפאנל הישן (כותרות ספר וכו) — RED: imud-book-title/subtitle + מטא המסמך' },
  { re: /^(cbg|data-cbg)-/, kind: 'ui-state', reason: 'רקעי עמודים לפי מחלקה — RED: background-page-type/image/texture (REQ-ORN-08)' },
  { re: /^prop-/, kind: 'ui-state', reason: 'מאפייני עיצוב בבורר הישן' },
  { re: /^page-/, kind: 'ui-state', reason: 'הגדרות עמוד בפאנל הישן' },
  { re: /^(show|enable|select|main|back|sub|shaar|general|detailed|font|size|mode)-/, kind: 'ui-state', reason: 'מצבי UI של האפליקציה הישנה' },
  { re: /^heading-divider-h[3-9]$/, kind: 'mapped', to: 'heading-dividers-h3-h6', transform: (v) => v !== 'none', reason: 'מפרידי כותרות H3–H6 — RED מפעיל/מכבה את המשפחה כולה' }
];

/** קבלת disposition למפתח — מפורש מהטבלה, או כלל משפחה. @returns {object|null} */
function dispositionOf(oldKey) {
  if (DISPOSITIONS[oldKey]) return DISPOSITIONS[oldKey];
  for (const r of FAMILY_RULES) if (r.re.test(oldKey)) return { kind: r.kind, reason: r.reason };
  return null;
}

/**
 * ייבוא קובץ הגדרות IMUD (או תבנית משתמש ישנה) להגדרות RED.
 * @param {object} legacy — אובייקט ההגדרות הישן (key→value)
 * @param {object} [registryKeys] — Set/מערך מפתחות RED חוקיים (לסינון); אם לא — ללא סינון
 * @returns {{settings:object, dispositions:object, unmapped:string[], report:{mapped:number,merged:number,uiState:number,removed:number}}}
 */
function importImudSettings(legacy, registryKeys) {
  const settings = {};
  const dispositions = {};
  const unmapped = [];
  const report = { mapped: 0, merged: 0, uiState: 0, removed: 0 };
  const valid = registryKeys instanceof Set ? registryKeys : (Array.isArray(registryKeys) ? new Set(registryKeys) : null);
  for (const [k, v] of Object.entries(legacy || {})) {
    const d = dispositionOf(k);
    if (!d) { unmapped.push(k); continue; }
    dispositions[k] = d;
    if ((d.kind === 'mapped' || d.kind === 'merged') && d.to) {
      if (valid && !valid.has(d.to)) { unmapped.push(`${k}->${d.to}(!)`); continue; }
      settings[d.to] = d.transform ? d.transform(v) : v;
      report[d.kind]++;
    } else {
      report[d.kind === 'ui-state' ? 'uiState' : d.kind === 'removed' ? 'removed' : 'merged']++;
    }
  }
  // מיזוג משלים: mode-h1=sub_shaar ⇒ שער משנה דלוק (הסמנטיקה המקורית)
  if (legacy && legacy['mode-h1'] === 'sub_shaar') settings['show-shaar-sub'] = true;
  return { settings, dispositions, unmapped, report };
}

module.exports = { DISPOSITIONS, dispositionOf, importImudSettings, firstFamily, pctToPx };

};

var __entry = "src/ui/browser-entry.js";
__modules[__entry](function (n) { return __require(__entry, n); }, { exports: {} }, {});
