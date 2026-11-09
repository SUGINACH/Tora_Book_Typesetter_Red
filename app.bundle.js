// ui/app.bundle.js — **נוצר אוטומטית** ע"י tools/build-worker-bundle.js (אין לערוך ידנית)
// חבילת מעטפת ה־UI (המנוע רץ ב־Worker הנפרד)
// מודולים: 60 · בלי חותמות זמן (דטרמיניזם)
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
  "src/ui/browser-entry.js|./settings-persistence": "src/ui/settings-persistence.js",
  "src/ui/browser-entry.js|../engine/output/html-export": "src/engine/output/html-export.js",
  "src/ui/app-shell.js|../engine/core/settings-registry": "src/engine/core/settings-registry.js",
  "src/ui/app-shell.js|../engine/output/project-io": "src/engine/output/project-io.js",
  "src/ui/app-shell.js|./status-strip": "src/ui/status-strip.js",
  "src/ui/app-shell.js|./test-doc-generator": "src/ui/test-doc-generator.js",
  "src/ui/app-shell.js|./settings-persistence": "src/ui/settings-persistence.js",
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
  "src/ui/app-shell.js|../engine/core/settings-registry": "src/engine/core/settings-registry.js",
  "src/ui/app-shell.js|./inline-transport": "src/ui/inline-transport.js",
  "src/ui/app-shell.js|../engine/output/export-api": "src/engine/output/export-api.js",
  "src/ui/app-shell.js|../engine/core/settings-registry": "src/engine/core/settings-registry.js",
  "src/ui/app-shell.js|../engine/core/legacy-settings-map": "src/engine/core/legacy-settings-map.js",
  "src/ui/app-shell.js|../engine/layout/page-templates": "src/engine/layout/page-templates.js",
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
  "src/engine/output/dom-renderer.js|../decoration/ornament-ink": "src/engine/decoration/ornament-ink.js",
  "src/engine/output/dom-renderer.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/dom-renderer.js|../decoration/folio": "src/engine/decoration/folio.js",
  "src/engine/output/dom-renderer.js|./line-font": "src/engine/output/line-font.js",
  "src/engine/output/dom-renderer.js|./shaar-content": "src/engine/output/shaar-content.js",
  "src/engine/output/dom-renderer.js|../layout/legacy-imud-flow": "src/engine/layout/legacy-imud-flow.js",
  "src/engine/decoration/page-decorations.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/decoration/asset-registry.js|./svg-sanitize": "src/engine/decoration/svg-sanitize.js",
  "src/engine/decoration/ornament-ink.js|./asset-registry": "src/engine/decoration/asset-registry.js",
  "src/engine/layout/legacy-imud-flow.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/layout/legacy-imud-flow.js|../core/events": "src/engine/core/events.js",
  "src/engine/layout/legacy-imud-flow.js|../core/ledger": "src/engine/core/ledger.js",
  "src/engine/layout/legacy-imud-flow.js|../decoration/legacy-ornaments": "src/engine/decoration/legacy-ornaments.js",
  "src/engine/typography/measure-api.js|./measure-table": "src/engine/typography/measure-table.js",
  "src/engine/typography/measure-api.js|./font-metrics": "src/engine/typography/font-metrics.js",
  "src/engine/typography/measure-api.js|./kp-linebreak": "src/engine/typography/kp-linebreak.js",
  "src/engine/decoration/legacy-ornaments.js|./ornament-fit": "src/engine/decoration/ornament-fit.js",
  "src/ui/testing-tab.js|../audit/report-schema": "src/audit/report-schema.js",
  "src/ui/testing-tab.js|../engine/core/ledger": "src/engine/core/ledger.js",
  "src/audit/report-schema.js|../engine/layout/dp-planner": "src/engine/layout/dp-planner.js",
  "src/audit/report-schema.js|../engine/layout/legacy-imud-flow": "src/engine/layout/legacy-imud-flow.js",
  "src/engine/layout/dp-planner.js|./page-templates": "src/engine/layout/page-templates.js",
  "src/engine/layout/dp-planner.js|../core/ledger": "src/engine/core/ledger.js",
  "src/engine/layout/dp-planner.js|./protections-matrix": "src/engine/layout/protections-matrix.js",
  "src/engine/layout/dp-planner.js|./retreat-loop": "src/engine/layout/retreat-loop.js",
  "src/engine/layout/dp-planner.js|./candidate-generator": "src/engine/layout/candidate-generator.js",
  "src/engine/layout/dp-planner.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/engine/layout/dp-planner.js|../typography/protectors": "src/engine/typography/protectors.js",
  "src/engine/layout/dp-planner.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/layout/dp-planner.js|./ordering": "src/engine/layout/ordering.js",
  "src/engine/layout/dp-planner.js|./balancing": "src/engine/layout/balancing.js",
  "src/engine/layout/dp-planner.js|./footnote-budget": "src/engine/layout/footnote-budget.js",
  "src/engine/layout/protections-matrix.js|./balancing": "src/engine/layout/balancing.js",
  "src/engine/layout/protections-matrix.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/engine/layout/protections-matrix.js|../notes/markers": "src/engine/notes/markers.js",
  "src/engine/layout/balancing.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/engine/layout/column-flow.js|./page-templates": "src/engine/layout/page-templates.js",
  "src/engine/layout/candidate-generator.js|./column-flow": "src/engine/layout/column-flow.js",
  "src/ui/caret-map.js|../engine/parser/dfa-lexer": "src/engine/parser/dfa-lexer.js",
  "src/engine/output/export-api.js|../core/settings-registry": "src/engine/core/settings-registry.js",
  "src/engine/output/export-api.js|./dom-renderer": "src/engine/output/dom-renderer.js",
  "src/engine/output/export-api.js|./html-export": "src/engine/output/html-export.js",
  "src/engine/output/export-api.js|../layout/page-templates": "src/engine/layout/page-templates.js",
  "src/engine/output/export-api.js|../import/zip-reader": "src/engine/import/zip-reader.js",
  "src/engine/output/export-api.js|./legacy-projector": "src/engine/output/legacy-projector.js",
  "src/engine/output/legacy-projector.js|../layout/legacy-imud-flow": "src/engine/layout/legacy-imud-flow.js",
  "src/engine/output/legacy-projector.js|./line-font": "src/engine/output/line-font.js",
  "src/engine/output/legacy-projector.js|../typography/measure-api": "src/engine/typography/measure-api.js",
  "src/engine/output/legacy-projector.js|../decoration/ornament-ink": "src/engine/decoration/ornament-ink.js",
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
const { createSettingsPersistence } = require('./settings-persistence'); // **S6.1 (פער 2):** SRS §17.1
const { BASE_CSS } = require('../engine/output/html-export');

/** **03.11(ג) תיקון קטסטרופת התצוגה:** הזרקת BASE_CSS — מקור הכללים של העמודים
 * (טורים/שורות/פסים/עיטורים/שערים) המשמש את הייצוא העצמאי — גם לתצוגה החיה.
 * בעבר התצוגה הסתמכה על styles.css שהכיל רק חלק מהכללים: בלי .column{position:absolute}
 * הטורים התמסדרו כבלוקים בזרימה (RTL) — הטקסט נדחק לימין ושכבות חפפו.
 * כללי הגלובל (html,body,.book) של המסמך העצמאי מוסרים — הם שייכים לקובץ המיוצא בלבד. */
function injectPageBaseCss() {
  const scoped = BASE_CSS
    .replace(/^html,body\{[^}]*\}\s*/m, '')
    .replace(/^\.book\{[^}]*\}\s*/m, '');
  const st = document.createElement('style');
  st.textContent = scoped;
  document.head.appendChild(st);
}

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
  injectPageBaseCss();
  const ASSET_VERSION = '2026-11-10-s6.1'; // cache-busting: מנע גרסה מיושנת מהמטמון אחרי פריסה
  // **S5.2:** התעבורה מקבלת מפעל () => new Worker(url) במקום מופע קיים —
  // cancel/קריסה (terminate) נטרלו בעבר את המנוע לצמיתות; עכשיו הפוסט הבא
  // בונה מופע חדש מאותו URL (כולל ?v=). בלי זה כל בקשה אחרי ביטול הוחברה
  // ל-Worker מת והאפליקציה נתקעה ב"מנוע: עמל…".
  const engine = new WorkerEngineClient(workerTransport(() => new Worker(`engine-worker.bundle.js?v=${ASSET_VERSION}`)));
  const imud = createImudLibrary(engine);
  // **S6.1 (פער 2 — SRS §17.1):** השתמרות הגדרות ב-localStorage — מוגש רק כשיש
  // אחסון אמיתי (בדפדפן). בסביבות בלי אחסון המנגנון כבוי לגמרי (null).
  const settingsPersistence = (typeof window !== 'undefined' && window.localStorage)
    ? createSettingsPersistence(window.localStorage)
    : null;
  const app = createApp(document, {
    engineClient: engine,
    settingsPersistence, // **S6.1 (פער 2):** השתמרות הגדרות (SRS §17.1)
    fontStatus: (typeof document !== 'undefined' && document.fonts) ? 'loading' : 'ready',
    // **03.11:** ייצוא PDF/ZIP במנוע ה־Worker + הורדה בפועל בדפדפן
    remoteExport: true,
    onExportFile: (kind, data, name) => {
      if (kind === 'html') downloadText(name || 'book.html', data, 'text/html');
      else if (kind === 'pdf') downloadBytes(name || 'book.pdf', data, 'application/pdf');
      else if (kind === 'zip') downloadBytes(name || 'book-project.zip', data, 'application/zip');
    },
    getExportFont: async (family) => {
      // **03.11(ג):** הגוף המבוקש לא בספרייה (למשל שם אנגלי כשהקטלוג בעברית) —
      // נפילה מפורשת לגופן יציב מהסט המוטמע (ברירות מחדל בעברית של IMUD),
      // כך שייצוא PDF עובד מהקופסה גם בלי בחירת גופן מהספרייה. ההודעה מדווחת.
      // **S5.2:** מחסנית גופן ("David Libre, serif") — loadFont היה נכשל בשקט
      // לפני שהיה בקטלוג; loadFontStack פותר את המחסנית למשפחה המוטמעת
      // הראשונה, והשם שמוחזר הוא המשפחה שפועלה בפועל (מדידה/ייצוא עקביים).
      const buf = await imud.loadFontStack(family);
      if (buf) {
        const resolved = (typeof imud.resolveFamily === 'function' && imud.resolveFamily(family)) || String(family).split(',')[0].trim();
        return { name: resolved, bytes: buf };
      }
      const fb = await imud.loadDefaultExportFont();
      return fb ? { name: fb.family, bytes: fb.bytes, fallbackFor: family } : null;
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
  // **S5.2:** נתיב כשל טעינה של ה-Worker — בעבר לא היה כלל: הסטטוס היה תקוע
  // ב"עמל…" לנצח בלי הודעה. הלקוח כבר דחה את ההבטחות שבטיסה (reject in-flight);
  // כאן נדווח למשתמש בעברית בפס המצב. ה-respawn מאחורי הקלעים: הפוסט הבא יבנה מופע חדש.
  engine.onError(() => {
    app.status.setEngineState('error', {
      message: 'טעינת מנוע העימוד נכשלה — תבוצע הפעלה מחדש בפעולה הבאה. אם הבעיה חוזרת, רעננו את הדף (F5).'
    });
  });
  // **S5.2 (4):** עימוד האתחול אחרי החלת ברירות המחדל — לא לדרוס עימוד פעיל
  // של המשתמש (הדבקה במהלך האתחול): נמתין לפנוי, ואז נעמוד עם ההגדרות הטריות.
  // חסם עליון (~10 שניות) — אחריו ממשיכים בכל זאת; ה-single-flight בטוח מ-S5.2.
  function retypesetWhenIdle(attempt = 0) {
    if (engine.busy && attempt < 200) { setTimeout(() => retypesetWhenIdle(attempt + 1), 50); return; }
    app.onExplicitRetypeset();
  }
  // אחרי ההרכבה: קטלוג הפונטים מתעדכן בפיקרים ברגע שהספרייה נטענת (TDZ-safe)
  imud.loadFontCatalog().then((families) => {
    app.refreshFontCatalog && app.refreshFontCatalog(families);
  }).catch(() => { /* ספרייה לא זמינה (למשל מקומי בלי assets) — ממשק בסיסי */ });
  // **03.11(ד) — "שום דבר מהגדרות ברירת המחדל אינו קיים" (דיווח משתמש 3):**
  // האפליקציה עולה עם ברירות המחדל הגנריות של RED. ברירות המחדל של הפרויקט
  // המקורי (264 מפתחות: גופני עיצוב, שערים, כותרות עליונות, יישורים) מוטמעות
  // בנכסים — ועתה מוחלות אוטומטית בעלייה, כך שספר חדש נראה כמו המקור מהשנייה
  // הראשונה (David Libre/Frank Ruhl Libre/Bellefair, שער ראשי+אחורי+משנה,
  // כותרות עליונות בכל עמוד). כשל טעינה (למשל פתיחה מקומית בלי assets) —
  // נשארות ברירות RED, האפליקציה עובדת; ההודעה מתועדת במצב.
  imud.loadFontCatalog().then(() => imud.loadLegacyDefaults()).then(({ settings: imported }) => {
    return app.applyLegacyDefaults(imported, { source: 'boot', retypeset: false });
  }).then(() => {
    // **S6.1 (פער 2 — SRS §17.1):** אחרי החלת ברירות המחדל (הבסיס) — שחזור
    // ההפרש השמור של המשתמש (אם קיים) לפני עימוד האתחול. כך ברירות המחדל
    // מוחלות תמיד (כלל הברזל) ובחירות המשתמש שורדות ריענון (SRS §17.1).
    const restored = app.restorePersistedSettings();
    if (restored && restored.restored > 0) {
      app.status.setNotice(`הוחלו ${restored.restored} הגדרות שמורות מהסשן הקודם.`);
    }
  }).then(() => {
    // עימוד מפורש רק אם כבר יש טקסט בעורך (עלייה עם מסמך שמור)
    if (app.getText && app.getText().trim()) retypesetWhenIdle();
  }).catch(() => { /* נכסים לא זמינים — ברירות RED, מתועד */ });
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
const { generateTestDocument } = require('./test-doc-generator'); // **פער 1 (S6.1):** מסמכי בדיקה קבוע/רנדומלי — נושא 16 + SRS §16.1/§20.1
const { diffSettings } = require('./settings-persistence'); // **פער 2 (S6.1):** השתמרות הגדרות — SRS §17.1
const { buildEditorTab } = require('./editor-tab');
const { buildSettingsTab } = require('./settings-panel');
const { buildExtensionsPanel } = require('./extensions-panel');
const { importDocx } = require('../engine/import/docx-import');
const { applyEdit } = require('../engine/audit/text-edits'); // **S11:** מקור יחיד טהור — בלי pipeline
const { buildPreviewTab } = require('./preview-tab');
const { buildTestingTab } = require('./testing-tab');
const { WorkerEngineClient, RESTART_ERROR } = require('./worker-client');
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
  let typesetGen = 0; // **S5.2 (5):** דור עימוד — מונה תוצאות שהושלמו; חוזה: st.gen (אודיט חי בוחן שינוי)
  let lightTimer = null;
  let lastLightRefreshMs = null;
  const perf = (typeof performance !== 'undefined' && performance.now) ? performance : { now: () => Date.now() };

  // ================= פער 2 (S6.1): השתמרות הגדרות — SRS §17.1 =================
  // בסיס = מצב ברירות-המחדל אחרי האתחול (applyLegacyDefaults source:'boot').
  // נשמר רק ההפרש של המשתמש מהבסיס — עדכון ברירות מחדל בגרסה חדשה לא נחסם.
  // בלי opts.settingsPersistence (Node/בדיקות ישנות) — כל המנגנון לא-פעיל.
  const persist = opts.settingsPersistence || null;
  let settingsBaseline = null; // null ⇒ עדיין לא הוחלו ברירות האתחול — אין שמירה
  let persistTimer = null;

  function captureSettingsBaseline() { settingsBaseline = { ...settings }; }

  function schedulePersistSettings() {
    if (!persist || !settingsBaseline) return;
    if (persistTimer != null) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => { persistTimer = null; persistSettingsNow(); }, 250);
  }

  function persistSettingsNow() {
    if (!persist || !settingsBaseline) return { ok: false, reason: 'inactive' };
    const diff = diffSettings(settingsBaseline, settings);
    const res = persist.save(diff);
    if (!res.ok) {
      status.setNotice('שמירת ההגדרות בדפדפן נכשלה — ההגדרות לא ישוחזרו לאחר ריענון.');
    }
    return res;
  }

  /** שחזור ההפרש השמור מעל ברירות-האתחדל (נקרא מה-boot אחרי applyLegacyDefaults).
   * מפתחות לא מוכרים ברישום נדלגים; מפתחות _ פנימיים (הרחבות) עוברים כמו שהם. */
  function restorePersistedSettings() {
    if (!persist) return { restored: 0, skipped: [] };
    const diff = persist.load();
    if (!diff) return { restored: 0, skipped: [] };
    const { getSettingDefs } = require('../engine/core/settings-registry');
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    let applied = 0;
    const skipped = [];
    for (const [k, v] of Object.entries(diff)) {
      if (k.startsWith('_')) { settings[k] = v; applied++; continue; } // הרחבות/מצב פנימי
      if (k === 'settings_version' || !regKeys.has(k)) { skipped.push(k); continue; }
      settings[k] = v;
      applied++;
    }
    if (applied) {
      settingsPanel.refreshValues();
      // **פער 2 (S6.1):** הגדרה ששוחזרה עשויה לדרוש גופן שטרם נטען (למשל החלפת
      // גוף הספר) — טעינה ברקע; כישלון אינו חוסם (fallback מערכת, מתועד).
      loadFontsForCurrentSettings().catch(() => { /* fallback מערכת — מתועד */ });
      if (result) markHeavyDirty('הגדרות שמורות הוחלו — נדרש עימוד (⚡)');
    }
    return { restored: applied, skipped };
  }
  // ================= סוף פער 2 =================

  // בדיקות/Node: תעבורה inline (אותו פרוטוקול) — נטענת בעצלתיים כדי ש־bundle
  // הדפדפן לא יגרור את המנוע (שם רץ Worker אמיתי — ראו inline-transport.js).
  function makeDefaultTransport() {
    const { createInlineTransport } = require('./inline-transport');
    return createInlineTransport();
  }
  // **03.11(ג) (תיקון ייצוא PDF שנתלה):** לקוח יחיד לכל הצרכנים. בעבר נוצרו
  // שני WorkerEngineClient על אותו Worker — השני דרס את worker.onmessage
  // של הראשון, והתשובות ל-register-font של ספריית IMUD לעולם לא הגיעו
  // ⇒ loadFont נתלה ⇒ הייצוא נתקע אחרי "מייצר PDF במנוע…" בלי קובץ ובלי שגיאה.
  const engine = opts.engineClient || new WorkerEngineClient(opts.transport || makeDefaultTransport());

  // ================= חלקי ה־UI =================
  const status = buildStatusStrip(doc, { onExplicitRetypeset: () => onExplicitRetypeset() });

  const editor = buildEditorTab(doc, {
    onTextChange: (t) => { text = t; markHeavyDirty('טקסט השתנה'); },
    onDocumentAction: (action, payload) => onDocumentAction(action, payload),
    onImportTxt: () => opts.onRequestTxtImport && opts.onRequestTxtImport(),
    onImportDocx: () => opts.onRequestDocxImport && opts.onRequestDocxImport(),
    onClearDocument: () => onDocumentAction('clear', ''),
    onCaretMove: (charIndex) => onCaretMove(charIndex),
    onJumpToPage: (pageIndex) => { switchTab('preview'); preview.scrollToPage(pageIndex); },
    // **פער 1 (S6.1):** מסמכי בדיקה — הזרקה דרך פעולת מסמך מפורשת (F-06)
    onGenerateTestDocument: (mode) => onGenerateTestDocument(mode)
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
    onApplyLegacyDefaults: (imported) => applyLegacyDefaults(imported, { source: 'panel' })
  });

  /** טעינת כל הגופנים שההגדרות הנוכחיות דורשות — גם מחסניות (loadFontStack פותר
   * מול הקטלוג). מקור יחיד לשני הצרכנים: applyLegacyDefaults ושחזור ההגדרות
   * השמורות (פער 2 — הגדרה ששוחזרה עשויה לדרוש גופן שטרם נטען). */
  const FONT_SETTING_KEYS = [
    'body-font', 'first-word-font', 'dh-font', 'f-note-body-font',
    ...Array.from({ length: 8 }, (_, i) => `heading-${i}-font`),
    'shaar-title-font', 'shaar-subtitle-font', 'shaar-desc-font', 'shaar-sections-font',
    'shaar-author-font', 'shaar-year-font', 'shaar-back-text-font'
  ];
  for (const side of ['recto', 'verso']) {
    for (const pos of ['right', 'center', 'left']) FONT_SETTING_KEYS.push(`header-${side}-${pos}-font`);
  }
  async function loadFontsForCurrentSettings() {
    if (!opts.imudLibrary || typeof opts.imudLibrary.loadFontStack !== 'function') return;
    const seen = new Set();
    for (const k of FONT_SETTING_KEYS) {
      const v = settings[k];
      if (!v || seen.has(v)) continue;
      seen.add(v);
      try { await opts.imudLibrary.loadFontStack(v); } catch (e) { /* גופן חיצוני — fallback מערכת, מתועד */ }
    }
  }

  /** **03.11(ד):** החלת ברירות המחדל המקוריות — נתיב יחיד לשני הקוראים:
   * כפתור הפאנל והאתחול בעלייה (boot). אחרי ההחלה נטענים כל הגופנים
   * שההגדרות החדשות דורשות (גוף/כותרות/כותרות-עליונות/שערים) — בלי זה
   * הערכים נכונים אבל הדפדפן מציג גופן מערכת ו"החלפת גופן לא עושה כלום".
   * @param {object} imported - הגדרות מיובאות (importImudSettings)
   * @param {{source?:string, retypeset?:boolean}} [opts2] - panel: כן עימוד; boot: עימוד רק אם יש טקסט
   */
  async function applyLegacyDefaults(imported, opts2 = {}) {
    Object.assign(settings, imported);
    settingsPanel.refreshValues();
    await loadFontsForCurrentSettings();
    const wantRetypeset = opts2.retypeset !== undefined ? opts2.retypeset : true;
    if (wantRetypeset) onExplicitRetypeset();
    // **S5.2 (4):** מרוץ אתחול: החלה עם {retypeset:false} כשכבר קיימת תוצאה
    // (המשתמש הדביק במהלך האתחול) — ההגדרות השתנו אך שום דגל לא סומן ⇒
    // פער שקט בין התצוגה לבין מה שייצא. סימון כבד: ⚡ מהבהב עד עימוד.
    else if (result) markHeavyDirty('ברירות המחדל הוחלו — נדרש עימוד (⚡)');
    // **פער 2 (S6.1):** boot ⇒ בסיס ההפרש (ברירות המחדל הן נקודת האפס);
    // panel ⇒ בחירת ערכת/ברירות היא פעולה מפורשת — שמירה מיידית (SRS §17.1
    // "preset toggles"; בלי debounce — המשתמש לחץ והלך).
    if (opts2.source === 'boot') { if (settingsBaseline == null) captureSettingsBaseline(); }
    else persistSettingsNow();
  }

  // **S11:** סקציית הרחבות מסמך — בתחתית לשונית ההגדרות (מנותק מ־12 פאנלי הרישום).
  // שינוי הרחבות = כבד (F-06): אין עימוד אוטומטי — ⚡ בלבד.
  // **S5.2 (4):** האירוע ההתחלתי של הפאנל (bundle=null בבנייה) אינו "שינוי" —
  // בלי זה כל אפליקציה נולדת "מלוכלכת" (⚡ מהבהב בריק, לפני שאפשר בכלל לייצא
  // משהו) ודגל הכבד מאבד משמעות לחייץ הייצוא ולמרוץ האתחול.
  let extensionsHadBundle = false;
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
      if (bundle) { extensionsHadBundle = true; markHeavyDirty('הרחבות השתנו'); }
      else if (extensionsHadBundle) { extensionsHadBundle = false; markHeavyDirty('הרחבות הוסרו'); }
      schedulePersistSettings(); // **פער 2 (S6.1):** הרחבות הן חלק מההגדרות — נשמרות גם כן
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
      typesetGen++; // **S5.2 (5):** +1 על כל עימוד שהושלם (בדיוק במקום ההשמה ל-result) — ביטול/החלפה אינם נספרים
      applyResultToViews();
      status.setEngineState('idle');
      status.setPages(result.pages.length);
    }).catch((e) => {
      const msg = e && e.message ? e.message : String(e);
      // **S5.2:** בקשה שהוחלפה/בוטלה (single-flight) — ה-Worker הוזרם מחדש והבקשה
      // שירשרה אותה כבר בדרך; זו אינה שגיאת מנוע אמיתית ואין להציג "שגיאה" למשתמש.
      if (msg === RESTART_ERROR) return;
      status.setEngineState('error', { message: msg });
    });
    return started;
  }

  /** פעולות מסמך מפורשות — הדבקה / ייבוא TXT / פתיחה. פעולה שלמה ⇒ עימוד מיידי. */
  function onDocumentAction(action, payload) {
    if (action === 'clear') {
      // **S6.0 (R8-M1 — ספר רפאים):** ביטול עימוד ממריץ לפני הניקוי —
      // בעבר תוצאה שהגיעה אחרי הניקוי "החייתה" את המסמך שנמחק (עמודים
      // מוצגים מול עורך ריק; ייצוא רץ על טקסט ריק).
      try { if (engine && typeof engine.cancel === 'function') engine.cancel(); } catch (e) { /* best-effort */ }
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

  // ================= פער 1 (S6.1): מסמכי בדיקה — נושא 16 + SRS §16.1 =================
  /** הזרקת מסמך בדיקה (קבוע/רנדומלי) — דרך פעולת מסמך מפורשת ('open') כדי לעבור
   * בנתיב המיידי המוכח (F-06). המחולל ניתן להחלפה מבחוץ (opts.generateTestDocument)
   * לבדיקות — בדפדפן זה המחולל האמיתי (test-doc-generator.js). */
  const genDoc = opts.generateTestDocument || generateTestDocument;
  function onGenerateTestDocument(mode) {
    const doc2 = genDoc({ mode: mode === 'random' ? 'random' : 'fixed', scale: 'full' });
    onDocumentAction('open', doc2);
    const words = String(doc2).split(/\s+/).filter(Boolean).length;
    status.setNotice(`הוזרק מסמך בדיקה ${mode === 'random' ? 'רנדומלי (טקסט חדש)' : 'קבוע (דטרמיניסטי)'} — ${words.toLocaleString('he-IL')} מילים. מתבצע עימוד…`);
  }
  // ================= סוף פער 1 =================

  // ================= מדיניות שינויי הגדרות (D-64) =================

  function onSettingChanged(key, value) {
    settings[key] = value;
    // **03.11 (EXT-14):** בחירת גופן מהספרייה — טעינה חיה (FontFace לתצוגה +
    // registerFont במנוע למדידת font-metrics ולייצוא PDF). כישלון טעינה אינו
    // חוסם: המערכת נופלת לגופן המערכת (מתועד בהודעה).
    // **EXT-14 (05.11):** הודעה מדויקת לפי סיווג האמת — משפחה מהקטלוג המורחב
    // (קובץ WOFF2 במקור, לא מוטמע) מדווחת בשמה הנכון; לא כל "מחוץ לספרייה".
    if (/-(font)$/.test(key) && value && opts.imudLibrary) {
      const fontSt = typeof opts.imudLibrary.fontStatus === 'function' ? opts.imudLibrary.fontStatus(value) : null;
      opts.imudLibrary.loadFont(value).then((buf) => {
        if (!buf) {
          const msg = fontSt === 'extended-catalog'
            ? `הגופן «${value}» מהקטלוג המורחב של המקור — קובץ הגופן (WOFF2) אינו מוטמע בריפו; נעשה שימוש בגופן מערכת.`
            : `הגופן «${value}» אינו בספרייה המוטמעת — נעשה שימוש בגופן חלופי.`;
          status.setNotice(msg);
        }
      }).catch(() => { /* כבר דווח בהודעה */ });
    }
    if (classifyChange(key) === 'light') scheduleLightRefresh();
    else markHeavyDirty();
    schedulePersistSettings(); // **פער 2 (S6.1):** כל שינוי הגדרה נשמר (SRS §17.1)
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
    // **S5.2 (7):** רינדור־קל שומר זום ויעד גלילה (עדכון צבע רקע לא אמור לקפוץ
    // לראש המסמך); רק מסמך חדש באמת מאפס תצוגה — הנתיב הזה הוא keepView.
    preview.setResult(result, settings, { keepView: true }); // רינדור בלבד — אותם עמודים, הגדרות חדשות
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
  /** **S5.2 (3):** נעילת כפתורי הייצוא בזמן ייצוא מרוחק — מנע לחיצה כפולה ⇒ ייצוא כפול. */
  function setExportBusy(busy) {
    if (preview && typeof preview.setExportBusy === 'function') preview.setExportBusy(!!busy);
  }

  async function runRemotePdfExport() {
    try {
      const font = await opts.getExportFont(settings['body-font']);
      if (!font || !font.bytes) {
        status.setNotice('ייצוא PDF דורש גופן TTF — לגופן שנבחר לא נמצא קובץ מוטמע. נא לבחור גופן מהסט המוטמע או לטעון TTF.');
        return { ok: false, reason: 'no-embedded-font' };
      }
      const res = await engine.requestExport({ kind: 'pdf', text, settings, fontBytes: font.bytes, fontName: font.name });
      if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
      const fbNote = font.fallbackFor
        ? ` (הגופן «${font.fallbackFor}» אינו בספרייה — הוטמע «${font.name}» במקומו)`
        : '';
      status.setNotice(`יוצא PDF — ${res.info && res.info.pages ? res.info.pages : '?'} עמודים, ${res.info && res.info.outline ? res.info.outline : 0} סימניות, טקסט נבחר.${fbNote}`);
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
    // **S5.2 (3):** ייצוא = צילום מצב אחד. בעבר, PDF/ZIP הוזרמו למנוע עם הטקסט/ההגדרות
    // **הנוכחיים** בזמן ש-HTML רינדר את **התוצאה האחרונה** — שני קבצים סותרים
    // מאותו "ייצוא". אם יש שינויים שלא הוחלו (קלים/כבדים) — ייצוא נעצר בהודעה;
    // המשתמש ילחץ ⚡ ואז כל הנתיבים יצאו מאותו מצב בדיוק.
    if (lightDirty || heavyDirty) {
      status.setNotice('קיימים שינויים שלא הוחלו — הפעילו עימוד (⚡) לפני ייצוא');
      return { ok: false, kind, reason: 'dirty' };
    }
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
          setExportBusy(true);
          // fire-and-forget — ההורדה וההודעות בסיום; **S5.2 (3):** שחרור הנעילה בסיום/כשל
          runRemotePdfExport().then(() => setExportBusy(false), () => setExportBusy(false));
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
          setExportBusy(true);
          runRemoteZipExport().then(() => setExportBusy(false), () => setExportBusy(false)); // **S5.2 (3):** שחרור הנעילה בסיום/כשל
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
    // **S4.6 (ביקורת 3) — חיבור מיגרציית המדור הקודם למסלול הטעינה בפועל:**
    // מפתחות שאינם ברישום RED עוברים דרך importImudSettings (טבלת ה-disposition)
    // במקום להישאר "לא מוכרים". ערכי ui-state נשמרים ב-_legacy-ui-state (לא אובדם).
    const { getSettingDefs } = require('../engine/core/settings-registry');
    const { importImudSettings } = require('../engine/core/legacy-settings-map');
    const migrated = migrate(raw.settings || {});
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    const known = {};
    const legacyKeys = {};
    for (const [k, v] of Object.entries(migrated)) {
      if (k === 'settings_version' || k.startsWith('_')) { known[k] = v; continue; }
      (regKeys.has(k) ? known : legacyKeys)[k] = v;
    }
    let legacySettings = {};
    if (Object.keys(legacyKeys).length) {
      // **EXT-9:** הקטלוג המוטמע (אם נטען) מועבר לפתרון מחסניות הגופן —
      // "Guttman Rashi, Frank Ruhl Libre" ⇒ המשפחה המוטמעת בפועל, כך שהמדידה
      // (font-metrics) והתצוגה משתמשות באותו גופן (מונע סחף live↔ייצוא EXT-13).
      const availableFonts = (opts.imudLibrary && typeof opts.imudLibrary.catalogFamilies === 'function')
        ? opts.imudLibrary.catalogFamilies() : undefined;
      const imp = importImudSettings(legacyKeys, regKeys, {
        contentHeightPx: currentContentHeightPx(),
        ...(availableFonts ? { availableFonts } : {})
      });
      legacySettings = imp.settings; // כולל _legacy-ui-state (ערכי UI נשמרים)
    }
    const { merged, unknownKeys, issues } = mergeWithDefaults({ ...legacySettings, ...known });
    for (const [k, v] of Object.entries(merged)) settings[k] = v;
    settingsPanel.refreshValues();
    markHeavyDirty(); // הגדרות השתנו — המשתמש יחליט מתי לעמד (⚡)
    schedulePersistSettings(); // **פער 2 (S6.1):** טעינת תבנית = שינוי הגדרות — נשמר (SRS §17.1)
    return { unknownKeys, issues };
  }

  /** **S4.6:** גובה תיבת התוכן בפועל של הגדרות העמוד הנוכחיות — להמרות אחוז⇒פיקסל
   * במיפוי מדור קודם (h2-top-distance). נפילה ל-1040 (A4) אם אין גיאומטריה. */
  function currentContentHeightPx() {
    try {
      const { buildPageTemplate } = require('../engine/layout/page-templates');
      const t = buildPageTemplate('regular', settings, true);
      if (t && t.contentBox && Number(t.contentBox.height) > 0) return Number(t.contentBox.height);
    } catch (e) { /* תבנית לא זמינה — ברירת המחדל בהמשך */ }
    return 1040;
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
    applyLegacyDefaults, // **03.11(ד):** נתיב יחיד להחלת ברירות המקור (פאנל + אתחול)
    getState: () => ({ lightDirty, heavyDirty, lastLightRefreshMs, hasResult: !!result, pages: result ? result.pages.length : 0, layoutHash: result ? result.layoutHash : null, gen: typesetGen }),
    setText: (t) => { text = String(t != null ? t : ''); editor.setText(text); },
    getText: () => editor.getText(),
    getSettings: () => settings,
    // **S6.1 — פער 1:** הזרקת מסמכי בדיקה (קבוע/רנדומלי) — נתיב מסמך מפורש
    onGenerateTestDocument,
    // **S6.1 — פער 2:** השתמרות הגדרות (SRS §17.1) — נקודות כניסה ל-boot ולבדיקות
    captureSettingsBaseline, restorePersistedSettings, persistSettingsNow,
    clearPersistedSettings: () => (persist ? persist.clear() : false)
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
  K('page-num-position', 'enum', 'bottom-center', P.GRID, 'sel-page-num-position', ['decoration/folio'], 'fx:folio-pos', { enum: ['bottom-center', 'outer-left', 'outer-right', 'outer', 'top', 'in-header', 'none'] }),
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
  K('footnote-reset-policy', 'enum', 'section', P.NOTES, 'sel-fn-reset', ['notes/markers'], 'fx:fn-reset', { enum: ['continuous', 'page', 'section', 'part'], note: 'S4.26 (דיווח משתמש 05.11): ברירת המחדל איפוס פר-פרק (section/siman) — לא פר-עמוד' }),
  K('footnote-columns', 'number', 1, P.NOTES, 'sel-fn-cols', ['layout/footnote-budget'], 'fx:fn-cols', { enum: [1, 2] }),
  K('footnote-separator-rule', 'enum', 'regular', P.NOTES, 'sel-fn-rule', ['output/dom-renderer'], 'fx:fn-rule', { enum: ['none', 'regular', 'circles', 'sparkle', 'star', 'diamond'] }),
  K('fn-layout-mode', 'enum', 'continuous', P.NOTES, 'sel-fn-layout', ['layout/dp-planner', 'output/dom-renderer'], 'fx:fn-layout', { enum: ['block', 'continuous'], note: 'S4.26 (דיווח משתמש 05.11): ברירת המחדל זרימה רציפה — הערה הבאה פותחת באותה שורה שבה הסתיימה קודמתה; block=כל הערה בלוק משלה' }),
  K('endnotes-enabled', 'bool', false, P.NOTES, 'chk-endnotes', ['layout/endnote-pages'], 'fx:endnotes-on', { note: 'נגזר מ‑note-placement-mode=endnotes (D-39); קלט ישן true ממופה ל‑mode=endnotes בהגירה (project-io)' }),
  K('endnote-title-text', 'string', 'הערות', P.NOTES, 'inp-endnote-title', ['layout/endnote-pages'], 'fx:endnote-title'),
  K('endnote-columns', 'number', 1, P.NOTES, 'sel-en-cols', ['layout/endnote-pages'], 'fx:en-cols', { enum: [1, 2], note: 'S7.1.1: טור אחד או שניים בעמודי הערות' }),
  K('f-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-fnote-body-font', ['layout/footnote-budget'], 'fx:fnote-body-font'),
  K('s-note-body-font', 'font', 'Frank Ruhl Libre', P.NOTES, 'sel-snote-body-font', ['layout/side-notes'], 'fx:snote-body-font'),
  K('fn-bar-max-height-px', 'number', 0, P.NOTES, 'rng-fn-bar-max', ['layout/dp-planner'], 'fx:fn-bar-max', { min: 0, max: 1000, note: 'S4.26 (דיווח משתמש 05.11): 0=קיבולת העמוד המלאה (ברירת המחדל — הערה ארוכה ממלאת את העמוד לפני חיתוך); ערך חיובי נחתם לקיבולת' }),
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
__modules["src/ui/test-doc-generator.js"] = function (require, module, exports) {
// src/ui/test-doc-generator.js — מחולל מסמכי בדיקה (פער 1: נושא 16 ב"סיכום בקשות מAI" + SRS §16.1/§20.1)
'use strict';

/**
 * **רקע (בקשת המשתמש המקורית):** "ופצל את לחצן 'מסמך בדיקה' לשני לחצנים
 * 1. 'מסמך בדיקה קבוע' שיזריק את אותו מסמך בכל פעם. 2. 'מסמך בדידה רנדומלי'
 * שיזריק בכל פעם טקסט רנדומלי." — וכן "המסמך הסופי צריך להכיל לפחות 300 דפים
 * מסוגים שונים" לפי חמשת צירי העקה.
 *
 * **עקרונות:**
 * - **קבוע = דטרמיניסטי מלא:** זרע (seed) קבוע ⇒ אותם בתים בדיוק בכל לחיצה
 *   (מדיניות האפס-אקראיות של הפרויקט נשמרת — אין Math.random/Date.now בנתיב הקבוע).
 * - **רנדומלי = זרע טרי בכל קריאה:** (Date.now ^ Math.random) — מסמך חדש בכל לחיצה.
 * - **חמשת צירי העקה (SRS §20.1):** (1) טיפולוגיות עמוד — פרקים (H2), H3 חוצה
 *   בראש פרק ובאמצעו, גוף רגיל; (2) מדדי פסקה — שורה אחת, שתי שורות, ארוכות
 *   20+ שורות; (3) שילובי כותרות — H4/H5/H6 בראש/אמצע/סוף פרק, כולל רצפי
 *   כותרות; (4) צפיפויות הערות — 0, 1–5 קצרות, ענק חוצה-עמודים, ורצף
 *   [א][ב] (מקרה האינטגרציה ההיסטורי); (5) סוגריים עגולים — שורה אחת,
 *   רב-שורות וחוצה-טורים.
 * - **בלי הפרות מעוצבות:** אין מילים בלתי-ניתנות-לשבירה מלאכותיות (המסמך אמור
 *   להיות שקוף להגדרות ההגנות — "0 בעיות עימוד" נשמר גם עליו; העקה היא בהצטברות
 *   ובשילובים, לא בהפרות מכוונות).
 * - **טהור:** מודול ללא כל גישה למנוע/DOM (כלל F-06) — מחרוזות בלבד.
 */

/** mulberry32 — PRNG דטרמיניסטי קטן ומהיר (32 ביט, איכות מספקת לטקסט). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** הזרע הקבוע של מצב "קבוע" — אף פעם לא משתנה (נעילת הדטרמיניזם בין גרסאות פריסה). */
const FIXED_SEED = 0x54F2A17;

/** מאגרי מילים — עברית אמיתית באורכים מגוונים (2–11 תווים) לריאליזם טיפוגרפי. */
const WORDS = [
  'תורה', 'הלכה', 'סוגיה', 'שיעור', 'דין', 'טעם', 'פשט', 'דרש', 'רמז', 'סוד',
  'גמרא', 'משנה', 'ברייתא', 'תוספות', 'ראשונים', 'אחרונים', 'פוסקים', 'שולחן', 'ערוך', 'רמב"ם',
  'פרשה', 'פסוק', 'פסוקים', 'מפרשים', 'מדרש', 'זוהר', 'קבלה', 'מוסר', 'חסידות', 'אמונה',
  'ברכה', 'תפילה', 'שבת', 'מועד', 'כשרות', 'טהרה', 'נישואין', 'קידושין', 'גיטין', 'נזיקין',
  'לימוד', 'שיעורים', 'עיון', 'בקיאות', 'חברותא', 'בית', 'מדרש', 'ישיבה', 'כולל', 'שיחה',
  'מחבר', 'עורך', 'מהדורה', 'דפוס', 'נוסח', 'מקור', 'עדות', 'כתב', 'יד', 'ספר',
  'אור', 'חכמה', 'דעת', 'בינה', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד',
  'מלכות', 'שמים', 'ארץ', 'ים', 'הר', 'מדבר', 'נהר', 'עיר', 'כפר', 'שדה',
  'יום', 'לילה', 'בוקר', 'ערב', 'שנה', 'חודש', 'שבוע', 'שעה', 'רגע', 'עת',
  'אדם', 'איש', 'אשה', 'בן', 'בת', 'אב', 'אם', 'אח', 'אחות', 'רע',
  'דבר', 'מילה', 'מחשבה', 'הבנה', 'שאלה', 'תשובה', 'ספק', 'ודאות', 'מחלוקת', 'הסכמה',
  'גדול', 'קטן', 'קדוש', 'טהור', 'חי', 'טוב', 'ישר', 'אמת', 'שלום', 'אמת'
];
/** מילים ארוכות יותר — לעקת רוחב שורה גבוהה (בלי חריגה מלאכותית). */
const LONG_WORDS = [
  'להתבוננות', 'התבארותו', 'מתורגמים', 'התחייבות', 'להשגחה', 'בהתאחדות', 'להתקדשות',
  'התעמקות', 'להידמות', 'התכוונות', 'להבחנות', 'התאמצות', 'להתייחסות', 'השתלשלות',
  'להתחברות', 'התעוררות', 'להתקרבות', 'התנדבות', 'להשתלמות', 'התמדה'
];
/** מילים מוטמעות-מקף — עקת יחידת-מילה מורכבת. */
const HYPHEN_WORDS = ['על-פי', 'אין-סוף', 'כל-שכן', 'צריך-עיון', 'שלא-כדין', 'יש-אומרים', 'קושיה-ראשונה'];
/** זוגות NBSP (צמדים) — עקת יחידה מודבקת (BRZ-11). */
const NBSP_PAIRS = ['מסכת\u00A0שבת', 'רבי\u00A0עקיבא', 'בבא\u00A0קמא', 'רבי\u00A0יוחנן', 'שולחן\u00A0ערוך', 'יורה\u00A0דעה'];

const SENTENCE_ENDS = ['.', '.', '.', '.', '.', ':', ';', '?', '!'];
const CONNECTORS = ['שכן', 'אולם', 'אך', 'כי', 'אף', 'גם', 'עוד', 'הרי', 'הן', 'אמנם'];

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function chance(rng, p) { return rng() < p; }

/** מילה בודדת מהמאגרים (לפעמים ארוכה/מוטמעת/מודבקת). */
function word(rng) {
  const r = rng();
  if (r < 0.04) return pick(rng, LONG_WORDS);
  if (r < 0.07) return pick(rng, HYPHEN_WORDS);
  if (r < 0.09) return pick(rng, NBSP_PAIRS);
  return pick(rng, WORDS);
}

/** משפט אחד: 5–12 מילים, מסתיים בפיסוק. */
function sentence(rng) {
  const n = randInt(rng, 5, 12);
  const parts = [];
  if (chance(rng, 0.25)) parts.push(pick(rng, CONNECTORS));
  while (parts.length < n) parts.push(word(rng));
  return parts.join(' ') + pick(rng, SENTENCE_ENDS);
}

/** פסקה בת ~targetWords מילים. */
function paragraphText(rng, targetWords) {
  const parts = [];
  let count = 0;
  while (count < targetWords) {
    const s = sentence(rng);
    parts.push(s);
    count += s.split(/\s+/).length;
  }
  return parts.join(' ');
}

/** הערת שוליים קצרה (4–10 מילים). */
function shortNote(rng) { return paragraphText(rng, randInt(rng, 4, 10)).replace(/[.?:;!]$/, ''); }

/** הערת-ענק — חוצה מרזבים ועמודים (120–200 מילים). */
function massiveNote(rng) { return paragraphText(rng, randInt(rng, 120, 200)).replace(/[.?:;!]$/, ''); }

/** סוגריים עגולים — kind: 'short' | 'multi' | 'cross'. */
function paren(rng, kind) {
  const n = kind === 'short' ? randInt(rng, 3, 8) : (kind === 'multi' ? randInt(rng, 15, 40) : randInt(rng, 50, 120));
  return '(' + paragraphText(rng, n).replace(/[.?:;!]$/, '') + ')';
}

/**
 * פסקת גוף אחת עם עטיפת הערות/סוגריים לפי הגרלת הצירים.
 * @returns {string} שורת פסקה אחת (בלי כותרת)
 */
function bodyParagraph(rng, kind) {
  const target = kind === 'tiny' ? randInt(rng, 3, 6)
    : kind === 'short' ? randInt(rng, 10, 18)
    : kind === 'long' ? randInt(rng, 150, 260)
    : randInt(rng, 30, 80);
  const chunks = [];
  const words = paragraphText(rng, target).split(' ');
  // פיצול לשני חצאים לצורך הזרקת סוגריים/הערות באמצע טבעי
  const half = Math.max(1, Math.floor(words.length / 2));
  const firstHalf = words.slice(0, half).join(' ');
  const secondHalf = words.slice(half).join(' ');

  chunks.push(firstHalf);

  // ציר 5 — סוגריים עגולים
  const pr = rng();
  if (pr < 0.16) chunks.push(paren(rng, 'short'));
  else if (pr < 0.26) chunks.push(paren(rng, 'multi'));
  else if (pr < 0.31) chunks.push(paren(rng, 'cross'));

  // ציר 4 — הערות שוליים
  const fr = rng();
  if (fr < 0.30) {
    // אין הערה
  } else if (fr < 0.55) {
    chunks.push('[' + shortNote(rng) + ']');
  } else if (fr < 0.75) {
    const n = randInt(rng, 2, 5);
    for (let i = 0; i < n; i++) chunks.push('[' + shortNote(rng) + ']');
  } else if (fr < 0.88) {
    // רצף מוכר מההיסטוריה: [טקסט][טקסט] בלי רווח ביניהם
    chunks.push('[' + shortNote(rng) + '][' + shortNote(rng) + ']');
  } else {
    chunks.push('[' + massiveNote(rng) + ']');
  }

  chunks.push(secondHalf);
  return chunks.filter(Boolean).join(' ');
}

/** כותרת פרק ממוספרת. */
function chapterTitle(rng, idx) {
  const topics = ['עקרונות הלימוד', 'דיני שבת', 'הלכות תפילה', 'דיני כשרות', 'ענייני מועדים',
    'הלכות ברכות', 'דיני ממונות', 'ענייני טהרה', 'הלכות אישות', 'דיני נזיקין',
    'עקרונות הפסיקה', 'מנהגי ישראל', 'תיקוני חצות', 'ענייני חינוך', 'הלכות צדקה',
    'דיני עדות', 'ענייני תשובה', 'הלכות אבלות', 'דיני סעודה', 'ענייני קידוש החודש'];
  const gematria = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז',
    'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל', 'לא', 'לב', 'לג', 'לד', 'לה', 'לו'];
  return `פרק ${gematria[(idx - 1) % gematria.length]} — ${pick(rng, topics)}`;
}

/**
 * בלוק כותרת-משנה (ציר 3) — טקסט כותרת מגוון.
 * @param {number} level 3..7
 */
function subHeadingText(rng, level) {
  const h3 = ['כללים והגדרות', 'מחלוקת הראשונים', 'שיטת הרמב"ם', 'דעת השולחן ערוך', 'ביאור הסוגיה', 'השלכות מעשיות'];
  const h456 = ['טעם הדין', 'גדרי הדין', 'מקור הדין', 'חילוקי דינים', 'דין נוסף', 'לשון הפוסקים', 'שאלה נפרדת', 'ראיה מהגמרא'];
  const h7 = ['מהות המצווה', 'טעם המנהג', 'יסוד העניין', 'מקור ההלכה', 'גדר הדין', 'שורש העניין'];
  return pick(rng, level === 3 ? h3 : level === 7 ? h7 : h456);
}

/**
 * פרק אחד שלם — רצף בלוקים מעורבב לפי הצירים.
 * @param {number} chapterIdx מספר הפרק (1-based) — להבטחת כיסוי רמות הכותרות ברוטציה
 * @returns {string[]} שורות הפרק (בלי שורת ה-כותרת 2)
 */
function chapterLines(rng, opts, chapterIdx) {
  const lines = [];
  const nBlocks = opts.compact ? randInt(rng, 6, 9) : randInt(rng, 28, 42);
  let blocksSinceHeading = 0;

  // ציר 1 — H3 חוצה בראש הפרק (אחרי פסקת פתיחה קצרה) או באמצע
  const h3AtTop = chance(rng, 0.5);
  // ציר 3 — הבטחת כיסוי: כל פרק מקבל כותרת-משנה מובטחת ברמה מתחלפת (4/5/6)
  // בעמדה אמצעית; פרק 1 מקבל גם כותרת-צד (H7) מובטחת — שום רמה לא חסרה לעולם.
  const guaranteedLvl = 4 + ((chapterIdx - 1) % 3);
  const guaranteedAt = Math.floor(nBlocks / 2);
  const docFirst = chapterIdx === 1;

  for (let i = 0; i < nBlocks; i++) {
    const r = rng();
    const isTop = i < 2;
    const isBottom = i >= nBlocks - 2;

    // פסקת-עקה מובטחת בפרק הראשון של המצומצם (לפני כל ענף אחר — אף ענף
    // אחר לא יכול לבלוע את האינדקס הזה): רצף [א][ב] + סוגריים חוצי-טורים
    if (docFirst && opts.compact && i === 3) {
      lines.push(`${paragraphText(rng, 12)} ${paren(rng, 'cross')} [${shortNote(rng)}][${shortNote(rng)}] ${paragraphText(rng, 10)}`);
      blocksSinceHeading++;
      continue;
    }

    // ציר 1 — כותרת צד (H7) מובטחת בפרק הראשון (i=0 — לפני כל ענף כותרת אחר)
    if (docFirst && i === 0) {
      lines.push(`כותרת 7 - ${subHeadingText(rng, 7)}`);
      // נופל להמשך — H7 תמיד לפני פסקה
    }

    if (h3AtTop && i === 1) {
      lines.push(`כותרת 3 - ${subHeadingText(rng, 3)}`);
      blocksSinceHeading = 0;
      continue;
    }
    if (!h3AtTop && i === Math.floor(nBlocks / 4)) {
      lines.push(`כותרת 3 - ${subHeadingText(rng, 3)}`);
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 3 — כותרת משנה מובטחת בעמדה האמצעית (רוטציה 4/5/6 בין פרקים)
    if (i === guaranteedAt) {
      lines.push(`כותרת ${guaranteedLvl} - ${subHeadingText(rng, guaranteedLvl)}`);
      if (chance(rng, 0.25)) { // רצף כותרות — עקת escort
        lines.push(`כותרת ${Math.min(6, guaranteedLvl + 1)} - ${subHeadingText(rng, Math.min(6, guaranteedLvl + 1))}`);
      }
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 3 — כותרות משנה מוגרלות בעמדות מגוונות
    if (blocksSinceHeading >= 2 && r < 0.22) {
      const lvl = isTop ? randInt(rng, 4, 5) : isBottom ? randInt(rng, 5, 6) : randInt(rng, 4, 6);
      lines.push(`כותרת ${lvl} - ${subHeadingText(rng, lvl)}`);
      if (chance(rng, 0.25)) { // רצף כותרות — עקת escort
        lines.push(`כותרת ${Math.min(6, lvl + 1)} - ${subHeadingText(rng, lvl + 1)}`);
      }
      blocksSinceHeading = 0;
      continue;
    }

    // ציר 1 — כותרות צד (H7) מוגרלות בהמשך
    if (blocksSinceHeading >= 1 && r < 0.27) {
      lines.push(`כותרת 7 - ${subHeadingText(rng, 7)}`);
    }

    // ציר 2 — מדדי פסקה מגוונים
    const pr = rng();
    const kind = opts.compact
      ? (pr < 0.14 ? 'tiny' : pr < 0.30 ? 'short' : pr < 0.44 ? 'long' : 'medium')
      : (pr < 0.08 ? 'tiny' : pr < 0.20 ? 'short' : pr < 0.50 ? 'long' : 'medium');
    lines.push(bodyParagraph(rng, kind));
    blocksSinceHeading++;
  }

  // הערות סיום בחלק מהפרקים
  if (chance(rng, opts.compact ? 0.5 : 0.33)) {
    const n = randInt(rng, 2, 6);
    for (let i = 0; i < n; i++) {
      lines.push(`הערת סיום - ${paragraphText(rng, randInt(rng, 8, 25))}`);
    }
  }
  return lines;
}

/**
 * מחולל מסמך הבדיקה.
 * @param {{mode?:'fixed'|'random', seed?:number, scale?:'full'|'small'}} [opts]
 *   mode fixed (ברירת מחדל) — דטרמיניסטי מלא; random — זרע טרי בכל קריאה.
 *   seed מפורש עוקף את שניהם (לבדיקות).
 *   scale full (ברירת מחדל) — ~35 פרקים, מאות עמודים; small — 3 פרקים לבדיקות.
 * @returns {string} המסמך המלא בפורמט הקלט של המנוע (כותרת N - …, [הערות], (סוגריים), הערת סיום - …)
 */
function generateTestDocument(opts = {}) {
  const mode = opts.mode === 'random' ? 'random' : 'fixed';
  const scale = opts.scale === 'small' ? 'small' : 'full';
  const seed = Number.isFinite(opts.seed)
    ? (opts.seed >>> 0)
    : (mode === 'random'
      ? (((Date.now() >>> 0) ^ (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0)) >>> 0) || 1
      : FIXED_SEED);
  const rng = mulberry32(seed);

  const out = [];
  // ---- פתיח (מטא-נתונים — נסגר בשורה ריקה) ----
  // הערה: הכותרת אינה כוללת את המצב (קבוע/רנדומלי) — המצב נקבע מהזרע בלבד,
  // כך ש-seed זהה ⇒ מסמך זהה בתים-בתים (ההבחנה מדווחת בהודעת ההזרקה ב-UI).
  out.push(`שם הספר - מסמך בדיקה (${scale === 'small' ? 'מצומצם' : 'מלא'} — חמשת צירי העקה)`);
  out.push('נושא - העמדת מנוע העימוד בכל מקרי הקצה');
  out.push(`נושא מפורט - ${paragraphText(rng, randInt(rng, 8, 16))}`);
  out.push('שם המחבר - מחולל מסמכי הבדיקה');
  out.push('מקום ושנת הוצאה - ירושלים תשפ"ו');
  out.push('');

  // ---- גוף: פרקים ----
  const nChapters = scale === 'small' ? 3 : randInt(rng, 48, 56);
  for (let c = 1; c <= nChapters; c++) {
    out.push(`כותרת 2 - ${chapterTitle(rng, c)}`);
    for (const line of chapterLines(rng, { compact: scale === 'small' }, c)) out.push(line);
    if (c < nChapters) out.push('');
  }

  // ---- הוראת כותרת עמודי הערות-הסיום (צורת הרבים בלבד — D-40) ----
  out.push('');
  out.push('הערות סיום - הערות המחבר');
  out.push(paragraphText(rng, randInt(rng, 10, 20)));

  return out.join('\n');
}

module.exports = { generateTestDocument, FIXED_SEED, mulberry32 };

};
__modules["src/ui/settings-persistence.js"] = function (require, module, exports) {
// src/ui/settings-persistence.js — השתמרות הגדרות משתמש ב-localStorage (פער 2: SRS §17.1)
'use strict';

/**
 * **הדרישה (SRS §17.1):** "User settings MUST persist in localStorage across
 * page refreshes, text imports, and preset toggles." — וב"סיכום בקשות מAI"
 * (נושא 18): "דרישה לוודא שבחירת סט הגדרות אינה נדרסת בפעולות שוטפות או בריענון".
 *
 * **עקרונות המימוש:**
 * - **הפרש מול בסיס (diff), לא צילום מלא:** נשמרות רק ההגדרות שהמשתמש שינה מברירות
 *   המחדל שהוחלו באתחול. כך שדרוג גרסה שמשנה ברירת מחדל אינו נחסם ע"י ערך ישן
 *   שנשמר במפתח הזה (רק בחירות המשתמש המפורשות גוברות).
 * - **ברירות המחדל מוחלות תמיד קודם** (כלל הברזל של המשתמש: בלי החלת ברירות
 *   המחדל אין ודאות הצלחה) — ורק אחריהן מוחל ההפרש השמור.
 * - **עמידות:** JSON שבור / פורמט לא מוכר / גרסה עתידית ⇒ אין שחזור (בלי מיגרציה
 *   שקטה); חריגת נפח (מצב פרטי) ⇒ כשל עדין עם דיווח, בלי קריסה.
 * - **טהור:** אין גישה למנוע/DOM (כלל F-06) — אחסון בלבד.
 */

const STORAGE_KEY = 'tora-red-user-settings';
const FORMAT = 'tora-red-user-settings';
const VERSION = 1;

/**
 * @param {Storage|null} storage אובייקט דמוי-localStorage ({getItem,setItem,removeItem})
 *   או null ⇒ אחסון בזיכרון בלבד (בדיקות/סביבות בלי אחסון).
 */
function createSettingsPersistence(storage) {
  const mem = new Map();
  const store = storage || {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); }
  };
  let lastError = null;

  /** שמירת ההפרש. הפרש ריק ⇒ מחיקת המפתח (חזרה נקייה לברירות המחדל). */
  function save(diff) {
    try {
      const keys = Object.keys(diff || {});
      if (!keys.length) { store.removeItem(STORAGE_KEY); return { ok: true, cleared: true, keys: 0 }; }
      const payload = JSON.stringify({ format: FORMAT, version: VERSION, savedAt: new Date().toISOString(), settings: diff });
      store.setItem(STORAGE_KEY, payload);
      return { ok: true, keys: keys.length };
    } catch (e) {
      lastError = e;
      return { ok: false, error: String(e && e.message ? e.message : e) };
    }
  }

  /** טעינה עם אימות קפדני — כל סטייה ⇒ null (אין נתונים שמורים). */
  function load() {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
      if (obj.format !== FORMAT) return null;
      if (Number(obj.version) !== VERSION) return null;
      if (!obj.settings || typeof obj.settings !== 'object' || Array.isArray(obj.settings)) return null;
      return obj.settings;
    } catch (e) {
      lastError = e;
      return null;
    }
  }

  function clear() {
    try { store.removeItem(STORAGE_KEY); return true; } catch (e) { lastError = e; return false; }
  }

  function lastWriteError() { return lastError; }

  return { save, load, clear, lastWriteError };
}

/**
 * הפרש current מול baseline — מפתחות שערכם שונה (השוואת JSON יציבת-סוגים).
 * מפתח שהוסר מ-current לא נכלל (השוואה מול בסיס שלם).
 * @returns {object} הפרש לשמירה: {key: value}
 */
function diffSettings(baseline, current) {
  const out = {};
  const base = baseline || {};
  const cur = current || {};
  for (const k of Object.keys(cur)) {
    // ערך undefined שאינו בבסיס = מפתח שנמחק בפועל — לא הפרש (הגנה מסדר-undefined)
    if (cur[k] === undefined && !(k in base)) continue;
    if (k in base) {
      if (JSON.stringify(base[k]) !== JSON.stringify(cur[k])) out[k] = cur[k];
    } else {
      out[k] = cur[k]; // מפתח חדש שנוסף ל-current אחרי הבסיס — שינוי משתמש
    }
  }
  return out;
}

module.exports = { createSettingsPersistence, diffSettings, STORAGE_KEY, FORMAT, VERSION };

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

  // ---- סרגל מסמכי בדיקה (פער 1 — נושא 16 ב"סיכום בקשות מAI": "לחצן בחלק
  // העליון של אזור הדבקת הטקסט מעל לחצני העידכון ועימוד ולחצן הייבוא";
  // פוצל לשניים: "מסמך בדיקה קבוע" + "מסמך בדיקה רנדומלי") ----
  // F-06: הכפתורים קוראים ל-callback בלבד — ההזרקה והעימוד ב-app-shell
  // (onGenerateTestDocument → onDocumentAction('open') — נתיב מפורש).
  const genBar = doc.createElement('div');
  genBar.className = 'editor-bar editor-genbar';
  genBar.setAttribute('role', 'group');
  genBar.setAttribute('aria-label', 'מסמכי בדיקה');
  const btnGenFixed = doc.createElement('button');
  btnGenFixed.type = 'button'; btnGenFixed.className = 'btn'; btnGenFixed.textContent = '🧪 מסמך בדיקה קבוע';
  btnGenFixed.title = 'הזרקת מסמך בדיקה דטרמיניסטי מלא (~300+ עמודים, חמשת צירי העקה) — אותו מסמך בדיוק בכל לחיצה';
  btnGenFixed.setAttribute('aria-label', 'הזרקת מסמך בדיקה קבוע (דטרמיניסטי)');
  btnGenFixed.addEventListener('click', () => opts.onGenerateTestDocument && opts.onGenerateTestDocument('fixed'));
  const btnGenRandom = doc.createElement('button');
  btnGenRandom.type = 'button'; btnGenRandom.className = 'btn'; btnGenRandom.textContent = '🎲 מסמך בדיקה רנדומלי';
  btnGenRandom.title = 'הזרקת מסמך בדיקה חדש (~300+ עמודים) — טקסט שונה בכל לחיצה';
  btnGenRandom.setAttribute('aria-label', 'הזרקת מסמך בדיקה רנדומלי');
  btnGenRandom.addEventListener('click', () => opts.onGenerateTestDocument && opts.onGenerateTestDocument('random'));
  genBar.appendChild(btnGenFixed); genBar.appendChild(btnGenRandom);
  root.appendChild(genBar);

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
    // **S5.2 (11):** הדבקה ריקה (רווחים בלבד) עברה את השומה data != null ומחקה
    // את המסמך כולו ללא אישור. פעולת ניקוי מכוונת קיימת (🗑) — הדבקה ריקה אינה נכשלת בשקט.
    if (data != null && String(data).trim() !== '') {
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
  return { root, setText, getText, setPageBreaks, updateCounters, setCaret, textarea: area, docxButton: btnDocx,
    generateFixedButton: btnGenFixed, generateRandomButton: btnGenRandom };
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
      // **S6.0 (R8-M3):** שדה מרוקן = ביטול (לא 0! — Number('')===0 שלח
      // 0 למנוע ⇒ גופן-0 = ספר ריק "מוצלח"); ערכים מוצמדים לטווח
      // min/max של ההגדרה (בעבר -5 עבר כמו שהוא).
      if (el.value === '') { el.value = String(value); return; }
      let n = Number(el.value);
      if (!Number.isFinite(n)) { el.value = String(value); return; }
      if (b.min != null && n < b.min) { n = b.min; el.value = String(n); }
      if (b.max != null && n > b.max) { n = b.max; el.value = String(n); }
      onChange(n);
    });
  } else if (b.type === 'color') {
    el = doc.createElement('input');
    el.setAttribute('type', 'color');
    el.value = String(value || '#ffffff');
    el.addEventListener('change', () => onChange(el.value));
  } else if (b.type === 'font') {
    // font-picker preserve-missing-value (IMUD port): ערך שאינו ברשימה נשמר כאפשרות.
    // **03.11:** כשקטלוג IMUD נטען — 443 המשפחות המוטמעות בכל בוררי הגופנים.
    // **EXT-14 (05.11):** הקטלוג המורחב (1,315 משפחות המקור) מוצג אף הוא — עם
    // סימון ברור "(קטלוג — לא מוטמע)": בחירתו תדווח במפורש ותיפול לגופן מערכת.
    const raw = fontCatalogFamilies || KNOWN_FONTS;
    const entries = raw.map((f) => (typeof f === 'string' ? { value: f, label: f } : f));
    const values = entries.map((e) => e.value);
    el = doc.createElement('select');
    const opts = values.includes(value) ? entries : [{ value: String(value), label: String(value) }, ...entries];
    for (const e of opts) {
      const o = doc.createElement('option');
      o.setAttribute('value', e.value);
      o.textContent = e.label || e.value;
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

  // בורר סגנון-ספר מהמקור (setting_sets/) — **EXT-14:** תלמוד/פרשנות/קונטרס,
  // תצורות מלאות (249 מפתחות) שהמקור החליף ביניהן דרך הדרופדאון style-set-select.
  // אותה טבלת disposition כמו ברירות המחדל — אין מסלול מיוחד; ההחלפה מעמדת
  // את ההגדרות וטוענת את הגופנים שהערכה דורשת (onApplyLegacyDefaults — נתיב יחיד).
  const setsWrap = doc.createElement('div');
  setsWrap.className = 'row';
  const setsLbl = doc.createElement('label');
  setsLbl.textContent = 'סגנון ספר (מהמקור):';
  setsWrap.appendChild(setsLbl);
  const setsSel = doc.createElement('select');
  setsSel.className = 'ctl';
  setsSel.setAttribute('aria-label', 'בחירת ערכת סגנון ספר מהמקור');
  setsSel.appendChild(Object.assign(doc.createElement('option'), { textContent: '— ברירת המחדל המלאה —', value: '' }));
  setsSel.addEventListener('change', async () => {
    const name = setsSel.value;
    if (!name) return; // ברירת המחדל המלאה — דרך הכפתור הייעודי למעלה
    try {
      const { settings, report } = await opts.imudLibrary.loadSettingSet(name);
      if (opts.onApplyLegacyDefaults) opts.onApplyLegacyDefaults(settings);
      if (opts.onNotice) opts.onNotice(`ערכת «${name}» הוחלה — ${report.mapped} הגדרות מופו, ${report.uiState} ערכי UI נשמרו.`);
    } catch (e) {
      setsSel.value = '';
      if (opts.onNotice) opts.onNotice('טעינת הערכה נכשלה: ' + (e && e.message ? e.message : e));
    }
  });
  setsWrap.appendChild(setsSel);
  wrap.appendChild(setsWrap);

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

  // טעינת רשימות העיצובים (עצלה — לפי אוסף) + אוכלוס ערכות הסגנון
  (async () => {
    try {
      // ערכות סגנון-ספר (setting_sets) — אוכלוס הבורר
      try {
        for (const name of opts.imudLibrary.listSettingSets()) {
          setsSel.appendChild(Object.assign(doc.createElement('option'), { textContent: name, value: name }));
        }
      } catch (e) { /* אין ספריית ערכות — הבורר נשאר עם ברירת המחדל */ }
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
      "outer",
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
    "def": "regular",
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
    "def": "regular",
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
    "def": "regular",
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
    "def": "section",
    "enum": [
      "continuous",
      "page",
      "section",
      "part"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "S4.26 (דיווח משתמש 05.11): ברירת המחדל איפוס פר-פרק (section/siman) — לא פר-עמוד"
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
    "def": "continuous",
    "enum": [
      "block",
      "continuous"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "S4.26 (דיווח משתמש 05.11): ברירת המחדל זרימה רציפה — הערה הבאה פותחת באותה שורה שבה הסתיימה קודמתה; block=כל הערה בלוק משלה"
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
    "def": 0,
    "enum": null,
    "min": 0,
    "max": 1000,
    "step": null,
    "note": "S4.26 (דיווח משתמש 05.11): 0=קיבולת העמוד המלאה (ברירת המחדל — הערה ארוכה ממלאת את העמוד לפני חיתוך); ערך חיובי נחתם לקיבולת"
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
      "none",
      "sign",
      "title",
      "both"
    ],
    "min": null,
    "max": null,
    "step": null,
    "note": "REQ-ORN-02: סימן בלבד / כותרת בלבד / שניהם / כלום. **S4.6 (ביקורת 3):** none נוסף — במקור IMUD h2-title-orn-mode=none היה מומר ל-both (היפוך הגדרת המשתמש); ornament-fit כבר תומך (scope-off)"
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
    "id": "shaar-main-enabled",
    "control": "chk-shaar-main",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער ראשי מופעל (כמקור)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "03.11(ד): שער ראשי כברירת מחדל — כמקור (show-main-shaar=true). מתג שער-העיצוב/ערכת-הנושא מוסיף רקע מעוצב, לא מחליף את המתג"
  },
  {
    "id": "shaar-sub-enabled",
    "control": "chk-shaar-sub",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער־משנה לכל חלק (כמקור)",
    "type": "bool",
    "def": true,
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "03.11(ד): שער־משנה לכל פתיחת חלק — כמקור (show-sub-shaar=true); show-shaar-sub הישן נשמר כמתג נוסף (או)"
  },
  {
    "id": "shaar-title-font",
    "control": "sel-shaar-title-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן כותרת הספר",
    "type": "font",
    "def": "Bellefair",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-title=\"'Lia Sgula', 'Bellefair', serif\" — Lia Sgula אינה זמינה; Bellefair המוטמע"
  },
  {
    "id": "shaar-title-size-pt",
    "control": "rng-shaar-title-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל כותרת הספר (pt)",
    "type": "number",
    "def": 46,
    "enum": null,
    "min": 20,
    "max": 90,
    "step": null,
    "note": "מקור: s-sh-title=46"
  },
  {
    "id": "shaar-subtitle-font",
    "control": "sel-shaar-subtitle-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן כותרת־משנה",
    "type": "font",
    "def": "David Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-sub=\"'Livorna', 'David Libre', serif\""
  },
  {
    "id": "shaar-subtitle-size-pt",
    "control": "rng-shaar-subtitle-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל כותרת־משנה (pt)",
    "type": "number",
    "def": 21,
    "enum": null,
    "min": 10,
    "max": 40,
    "step": null,
    "note": "מקור: s-sh-sub=21"
  },
  {
    "id": "shaar-desc-font",
    "control": "sel-shaar-desc-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן התיאור",
    "type": "font",
    "def": "Frank Ruhl Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-desc=\"'Livorna', 'Frank Ruhl Libre', serif\""
  },
  {
    "id": "shaar-desc-size-pt",
    "control": "rng-shaar-desc-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל התיאור (pt)",
    "type": "number",
    "def": 12,
    "enum": null,
    "min": 8,
    "max": 20,
    "step": null,
    "note": "מקור: s-sh-desc=12"
  },
  {
    "id": "shaar-sections-font",
    "control": "sel-shaar-sections-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן פרטי מהדורא",
    "type": "font",
    "def": "David Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-sec=\"'David Libre', serif\""
  },
  {
    "id": "shaar-sections-size-pt",
    "control": "rng-shaar-sections-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל פרטי מהדורא (pt)",
    "type": "number",
    "def": 11.5,
    "enum": null,
    "min": 8,
    "max": 20,
    "step": null,
    "note": "מקור: s-sh-sec=11.5"
  },
  {
    "id": "shaar-author-font",
    "control": "sel-shaar-author-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן שם המחבר",
    "type": "font",
    "def": "David Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-author=\"'David Libre', serif\""
  },
  {
    "id": "shaar-author-size-pt",
    "control": "rng-shaar-author-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל שם המחבר (pt)",
    "type": "number",
    "def": 15,
    "enum": null,
    "min": 8,
    "max": 24,
    "step": null,
    "note": "מקור: s-sh-author=15"
  },
  {
    "id": "shaar-year-font",
    "control": "sel-shaar-year-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גופן מקום ושנה",
    "type": "font",
    "def": "David Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקור: f-sh-year=\"'David Libre', serif\""
  },
  {
    "id": "shaar-year-size-pt",
    "control": "rng-shaar-year-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער — גודל מקום ושנה (pt)",
    "type": "number",
    "def": 12,
    "enum": null,
    "min": 8,
    "max": 20,
    "step": null,
    "note": "מקור: s-sh-year=12"
  },
  {
    "id": "shaar-back-text-font",
    "control": "sel-shaar-back-text-font",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער אחורי — גופן הטקסט",
    "type": "font",
    "def": "David Libre",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "גוף טקסט השער האחורי (שורות שמירת־זכויות) — מקור: David Libre"
  },
  {
    "id": "shaar-back-text-size-pt",
    "control": "rng-shaar-back-text-size",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שער אחורי — גודל הטקסט (pt)",
    "type": "number",
    "def": 10.5,
    "enum": null,
    "min": 8,
    "max": 16,
    "step": null,
    "note": "מקור: שורות ההמשך 10.5pt (השורה הראשונה 13pt מודגשת)"
  },
  {
    "id": "imud-book-desc",
    "control": "inp-imud-book-desc",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "תיאור (שער — נושא מפורט)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "תיאור בשער הראשי (מקור: inp-book-desc ← «נושא מפורט»)"
  },
  {
    "id": "imud-book-sections",
    "control": "inp-imud-book-sections",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "פרטי מהדורא (שער)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "פרטי מהדורא בשער הראשי (מקור: inp-book-sections ← «פרטי מהדורא»)"
  },
  {
    "id": "imud-book-author",
    "control": "inp-imud-book-author",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "שם המחבר (שער)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר»)"
  },
  {
    "id": "imud-book-year",
    "control": "inp-imud-book-year",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "מקום ושנת הוצאה (שער)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "מקום ושנת הוצאה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה»)"
  },
  {
    "id": "shaar-back-text",
    "control": "inp-shaar-back-text",
    "panel": "ערכות נושא, שערים ורקעים",
    "panelKey": "THEMES",
    "labelHe": "טקסט השער האחורי (שמירת זכויות)",
    "type": "string",
    "def": "",
    "enum": null,
    "min": null,
    "max": null,
    "step": null,
    "note": "טקסט השער האחורי (מקור: inp-back-shaar-text; ברירת מחדל בזמן ריצה: «שמירת זכויות» מהמטא או ״כל הזכויות שמורות למחבר.״)"
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
  // **S5.2 (O14 — A4 מדויק):** 210×297מ״מ @96dpi = 793.70×1122.52px — הערכים
  // המעוגלים (794×1123) הזיזו את גוף ה-DP ב-0.3px ויצרו MediaBox שאינו זהה
  // לגיאומטריית המורשת (793.7×1122.5). כעת זהה ל-GEO של legacy-imud-flow.
  // **S6.0:** הערכים בפועל ללא עיגול — 793.70×1122.52 (הערת O14 טענה
  // זהות ל-GEO אך הקוד עיגל ל-794×1123 — ההערה לא יושמה מעולם).
  A4: { w: 210 * MM_TO_PX, h: 297 * MM_TO_PX },
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
  // **S6.0 (R9 — קיטוע שקט):** XML קטוע התקבל בעבר כהצלחה עם ספר קצר
  // יותר בלי אזהרה. כעת הקיטוע מדווח במפורש ב-stats.warnings (הפריטים
  // שאחרי נקודת הקטיעה אבדו).
  const warnings = docRes.error === 'truncated' ? ['docxml:truncated'] : [];

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
    stats: { headings, paragraphs, footnotes, skipped, footnoteDefs: fnStats, warnings }
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
  // **S6.0 (R9):** אזהרת קיטוע נראית למשתמש — לא עוד "נטען" חלק בשקט.
  const truncWarn = (res.stats && res.stats.warnings && res.stats.warnings.length)
    ? `  ⚠ אזהרה: הקובץ קטוע — ייתכן שתוכן בסופו אבד (${res.stats.warnings.join(', ')}).`
    : '';
  return {
    ok: true,
    text: res.text,
    stats: res.stats,
    message: `הקובץ «${name}» נטען: ${res.stats.headings} כותרות, ${res.stats.paragraphs} פסקאות, ${res.stats.footnotes} הערות Word הומרו להערות סוגריים.${truncWarn}`
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
    // **S6.0 (R9 — קריאה קטועה בשקט):** compSize עלול לחרוג מהקובץ
    // (ZIP קטוע/פגום) — subarray קוצץ בשקט והרשומה הוחזרה חלקית כתקינה.
    if (dataStart + compSize > buf.length) {
      return { ok: false, entries, denied, error: `truncated-entry:${name}` };
    }
    const raw = u8sub(buf, dataStart, dataStart + compSize);
    let data;
    try {
      if (method === 0) data = Uint8Array.from(raw);
      else if (method === 8) data = inflateRaw(raw);
      else return { ok: false, entries, denied, error: `unsupported-method:${method}:${name}` };
    } catch (e) {
      return { ok: false, entries, denied, error: `inflate-failed:${name}` };
    }
    // **S6.0 (R9 — פצצת ZIP):** תקרת פריסה לרשומה (64MB) — מנע הקפאת
    // לשונית של 42KB→4GB; ו-CRC מהמדריך המרכזי נשמר לאימות (verifyCrc
    // היה מת — storedCrc מעולם לא אוכלס).
    if (data.length > 64 * 1024 * 1024) {
      return { ok: false, entries, denied, error: `entry-too-large:${name}` };
    }
    const entry = { name, data, method, size: data.length, storedCrc: u32le(buf, p + 16) };
    if (crc32(entry.data) !== entry.storedCrc) {
      return { ok: false, entries, denied, error: `crc-mismatch:${name}` };
    }
    entries.push(entry);
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

/** **S5.2 (12):** חילוץ מספר הגיליון מתצוגתו (page.folioDisplay) — תומך בפורמטים
 * hebrew ("כ״ב"), daf-hebrew ("דף כ״ב"), decimal ("22"/"[22]") ובמסגרות
 * (סוגריים/מרובעים/פרחוני/מעוין — כללי ה-frame של folio.js). null = אין גיליון. */
function folioNumberOf(display) {
  let s = String(display == null ? '' : display).trim();
  if (!s) return null;
  s = s.replace(/^\s*דף\s*/, '');            // daf-hebrew: "דף כ״ב"
  const dec = s.match(/[0-9]+/);               // decimal: "22" / "[22]"
  if (dec) { const d = Number(dec[0]); return d >= 1 ? d : null; }
  const letters = s.replace(/[^\u05D0-\u05EA]/g, ''); // הסרת מסגרות/גרשיים — אותיות בלבד
  return parseHebrewNumber(letters);
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
    exportBtns.push(b);
    return b;
  };
  // **S5.2 (3):** נעילת כפתורי הייצוא בזמן ייצוג מרוחק (PDF/ZIP ב-Worker) — מנע
  // לחיצה כפולה ⇒ שני קבצים. app-shell מפעיל/משחרר דרך setExportBusy.
  const exportBtns = [];
  function setExportBusy(busy) {
    for (const b of exportBtns) b.disabled = !!busy;
  }
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
   *  הגולל האמיתי הוא root (.tab-panel עם overflow:auto) — לא ה-canvas.
   * **S5.2 (6):** במצב אופקי הגולל האמיתי הוא ה-canvas (overflow-x) — המיפוי
   *  האנכי נשאר תמיד על ~0 (אין גלילה אנכית) ⇒ בספרים >60 עמודים העמודים
   *  שמעבר ~51% לעולם לא רונדרו (תיבות ריקות). במצב אופקי — טווח לפי גאומטריה
   *  אופקית; המצב האנכי נשאר בדיוק כפי שהיה. */
  function visibleRange() {
    const n = virtual.pages.length;
    if (!n) return [0, 0];
    if (horizontal) {
      const hr = horizontalVisibleRange();
      if (hr) return hr;
    }
    const scroller = (root.scrollHeight || root.clientHeight) ? root : canvas;
    const sh = scroller.scrollHeight, st = scroller.scrollTop, ch = scroller.clientHeight;
    if (!n || !sh || !isFinite(sh) || !isFinite(st) || !isFinite(ch)) return [0, 0];
    const first = Math.max(0, Math.floor((st / sh) * n) - 1);
    const last = Math.min(n - 1, Math.ceil(((st + ch) / sh) * n));
    return [first, last];
  }

  /** **S5.2 (6):** הריווח בין עמודים במצב אופקי — תואם ל-gap של .preview-canvas
   *  ב-styles.css (24px). נצרך למודל המצטבר בסביבות בלי מנוע פריסה. */
  const H_GAP = 24;

  /** מיקומי עמודים לאורך ציר הזרימה (0=תחילת הזרימה): [x0,x1] לכל עמוד —
   *  רוחבי התבניות בפועל + ריווח. משמש את הטווח הנראה במצב אופקי. */
  function horizontalPageExtents() {
    const out = [];
    let x = 0;
    for (let i = 0; i < virtual.pages.length; i++) {
      const pg = virtual.pages[i];
      const w = (pg && pg.template && Number(pg.template.width) > 0) ? Number(pg.template.width) : virtual.phW;
      out.push([x, x + w]);
      x += w + H_GAP;
    }
    return out;
  }

  /** **S5.2 (6):** הטווח הנראה במצב אופקי. 1) דפדפן: מלבן הקנבס (הגולל) מול
   *  מלבני העמודים — פיזי, עמיד ל-RTL (dir=rtl: הזרימה מתחילה מימין), לזום
   *  (transform נכלל ב-getBoundingClientRect) ולסדר placeholders/חיים.
   *  2) נפילה (shim/בדיקות, בלי מנוע פריסה): מודל מצטבר + חלון לפי
   *  scrollLeft/clientWidth/scrollWidth (RTL מודרני: שלילי מהקצה הימני=התחלה).
   *  null = אין גאומטריה — הקורא ייפול למסלול האנכי המקורי. */
  function horizontalVisibleRange() {
    const n = virtual.pages.length;
    if (!n) return null;
    if (typeof canvas.getBoundingClientRect === 'function'
      && canvas.children.length === n
      && canvas.children[0] && typeof canvas.children[0].getBoundingClientRect === 'function') {
      try {
        const cr = canvas.getBoundingClientRect();
        if (cr && Number.isFinite(cr.width) && cr.width > 0) {
          let first = -1, last = -1;
          for (let i = 0; i < n; i++) {
            const el = canvas.children[i];
            if (!el || typeof el.getBoundingClientRect !== 'function') continue;
            const r = el.getBoundingClientRect();
            if (!r || !Number.isFinite(r.width) || r.width <= 0) continue;
            if (r.right > cr.left + 1 && r.left < cr.right - 1) {
              if (first < 0) first = i;
              last = i;
            }
          }
          if (first >= 0) return [first, last];
        }
      } catch (e) { /* נפילה למודל החשבוני */ }
    }
    const st = canvas.scrollLeft, cw = canvas.clientWidth, sw = canvas.scrollWidth;
    if (typeof st !== 'number' || typeof cw !== 'number' || typeof sw !== 'number') return null;
    if (!isFinite(st) || !isFinite(cw) || !isFinite(sw) || cw <= 0 || sw <= 0) return null;
    const ext = horizontalPageExtents();
    // RTL: מודרני — scrollLeft ≤ 0 (0=התחלה, שלילי=התקדמות); מורשת — חיובי הפוך
    const S = st <= 0 ? -st : Math.max(0, (sw - cw) - st);
    const viewEnd = S + cw;
    let first = -1, last = -1;
    for (let i = 0; i < n; i++) {
      const [x0, x1] = ext[i];
      if (x1 > S && x0 < viewEnd) {
        if (first < 0) first = i;
        last = i;
      }
    }
    return first >= 0 ? [first, last] : null;
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
    // **03.11(ג):** הזום בפועל — משתנה CSS שנצרך ע"י .preview-canvas[data-zoom]
    // .preview-page{transform:scale(var(--zoom,1))}. בעבר הוגדר רק המאפיין
    // data-zoom בלי אף כלל שמכפיל — הזום לא עשה דבר בתצוגה.
    if (canvas.style && typeof canvas.style.setProperty === 'function') {
      canvas.style.setProperty('--zoom', String(zoom / 100));
    }
    if (canvas.dataset) canvas.dataset.fit = '';
  }
  zoomOut.addEventListener('click', () => setZoom(zoom - 10));
  zoomIn.addEventListener('click', () => setZoom(zoom + 10));
  zoomFit.addEventListener('click', () => setZoomFit());
  function setZoomFit() {
    canvas.dataset.fit = 'width';
    // **03.11(ג):** התאמה לרוחב בפועל — חישוב מרוחב הגורר (בדפדפן) ומרחב
    // העמוד; בסביבת בדיקות/ה-shim אין מידות — נשאר התווית בלבד (כמו קודם).
    try {
      const avail = (typeof root.clientWidth === 'number' ? root.clientWidth : 0) - 48;
      const pw = virtual.phW || 794;
      if (avail > 0 && pw > 0) {
        setZoom(Math.round((avail / pw) * 100));
        zoomPct.textContent = 'רוחב';
      } else {
        zoomPct.textContent = 'רוחב';
      }
    } catch (e) { zoomPct.textContent = 'רוחב'; }
  }
  // Ctrl+wheel = זום (REQ-UI-05)
  canvas.addEventListener('wheel', (ev) => {
    if (ev && ev.ctrlKey) {
      if (ev.preventDefault) ev.preventDefault();
      setZoom(zoom + (ev.deltaY < 0 ? 10 : -10));
    }
  });

  // ---- ניהול עמודים ----
  // **S5.2 (12):** מפת גיליון→אינדקס לקפיצה לפי מספר עברי — אל העמוד שמציג
  // את הגיליון המבוקש, לא אל האינדקס הפיזי (פער מלא כשעמודי שער/תוכן אינם
  // נספרים). עמוד ללא גיליון נכנס תחת אינדקס+1 (ההתנהגות הקודמת).
  let folioIndex = new Map();
  function rebuildFolioIndex() {
    folioIndex = new Map();
    const pages = (lastResult && lastResult.pages) || [];
    for (let i = 0; i < pages.length; i++) { // מעבר ראשון: גיליונות אמיתיים — עדיפות
      const n = folioNumberOf(pages[i] && pages[i].folioDisplay);
      if (n != null && !folioIndex.has(n)) folioIndex.set(n, i);
    }
    for (let i = 0; i < pages.length; i++) { // מעבר שני: בלי גיליון — מספר פיזי (אם פנוי)
      if (folioNumberOf(pages[i] && pages[i].folioDisplay) != null) continue;
      const phys = i + 1;
      if (!folioIndex.has(phys)) folioIndex.set(phys, i);
    }
  }

  /** **S5.2 (7):** עוגן הגלילה הנוכחי — היעד האחרון שהמשתמש קיפץ/לחץ אליו,
   *  ואם אין — העמוד העליון הנראה (וירטואלי/רגיל). לשחזור אחרי רינדור־קל. */
  function currentScrollAnchor() {
    if (lastScrollTarget != null) return lastScrollTarget;
    const [a] = visibleRange();
    return a || 0;
  }

  function setResult(serializedResult, settings, options) {
    // **S5.2 (7):** keepView — רינדור־קל (רקע/קישוט) שומר זום ויעד גלילה;
    // מסמך חדש באמת (בלי options) ממשיך לאפס תצוגה כמקודם.
    const keepView = !!(options && options.keepView);
    const prevZoom = keepView ? zoom : null;
    const anchor = keepView ? currentScrollAnchor() : null;
    lastResult = serializedResult;
    rebuildFolioIndex(); // **S5.2 (12):** המפה נבנית מחדש עם כל תוצאה
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
    if (keepView) {
      // **S5.2 (7):** שחזור הזום והיעד שנשמרו לפני פינוי הקנבס (scrollToPage
      // מעדכן גם את מחוון העמוד); רק מסמך חדש באמת מאפס ל-100% ולראש.
      setZoom(prevZoom != null ? prevZoom : 100);
      if (anchor != null && anchor <= virtual.pages.length - 1) scrollToPage(anchor);
    } else {
      setZoom(100);
    }
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
    let n = parseHebrewNumber(text);
    if (n == null) {
      // **S5.2 (12):** קלט עשרוני נקלט גם — פורמט decimal מציג ספרות בגיליון
      const dec = String(text == null ? '' : text).trim();
      if (/^[0-9]+$/.test(dec)) n = Number(dec);
    }
    if (n == null) { pageIndicator.textContent = 'מספר עברי לא תקין'; return null; }
    // **S5.2 (12):** גיליון אמיתי (folioDisplay) גובר על האינדקס הפיזי; עמודים
    // ללא גיליון נכנסו למפה תחת אינדקס+1 — מספר שאינו במפה ⇒ "אין עמוד".
    const idx = folioIndex.has(n) ? folioIndex.get(n) : null;
    if (!lastResult || idx == null) {
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
    setExportBusy, // **S5.2 (3):** נעילת כפתורי הייצוא בזמן ייצוא מרוחק (מנע לחיצה כפולה)
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

// **S4.10:** סוגי עמודי מנוע המורשת (legacy-imud-flow) — מיפוי למחלקות ה-CSS.
// 'toc-detailed' אצלנו (בייחוס toc-detail) ו-'blank' ייחודי למורשת.
const LEGACY_PT_CLASS = {
  'toc-detailed': 'page page--toc page--toc-detail',
  'blank': 'page page--blank',
  'sign-open': 'page page--sign-open'
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
const { resolveAssetRef } = require('../decoration/asset-registry');
const { ornamentInk } = require('../decoration/ornament-ink'); // **03.11:** imud: → data-URI
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
  // **EXT-20 (AQ אנכי אמיתי):** מקדם ה-AQ הוא מקדם גובה-שורה — כאן הוא
  // מיושם כ-line-height מפורש (px) כמו בפרויקטור וב-PDF. בעבר הוחל כאן
  // wordSpacing אופקי (‏(factor−1)×4px) — שלושה נתיבים, שלוש פרשנויות,
  // והגובה מעולם לא השתנה. כעת: שדה אחד, משמעות אחת.
  // **S6.0 (R4-C1):** line-height מהמודל ל**כל** שורה — לא רק ב-AQ. בלי
  // זה הדפדפן משתמש ב-normal (~1.15–1.25em) והטור נערם בפיץ שונה מהמודל
  // ומה-PDF (~4–5px לשורה, עד ~120px בתחתית הטור) — תצוגה≠ייצוא בכל עמוד DP
  // (תיקון S5.1 הוחל בנתיב המורשת בלבד ולא כאן).
  if (Number.isFinite(ln.heightPx)) {
    el.style.lineHeight = `${Math.round(ln.heightPx * (ln.aqStretch || 1) * 100) / 100}px`;
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
  const words = (ln.words || []).map(w => scrubPUAText(w));
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
  // **S5.4 (P-5 — תצוגה=ייצוא):** מיקום המרזב לפי המודל — הרצועה השמורה מעל
  // תחתית תיבת התוכן, בדיוק כמו שהפרויקטור מקרין ל-PDF. בעבר: bottom:8px
  // קבוע מה-CSS — התצוגה הציגה את המרזב בשוליים התחתונים בזמן שה-PDF צייר
  // אותו ברצועה השמורה (פער תצוגה≠ייצוא בפרופיל DP).
  const tpl = page.template;
  if (tpl && tpl.contentBox && page.fnReservedHeightPx > 0) {
    const colsX = (tpl.columns || []).map(c => c.x);
    const colsR = (tpl.columns || []).map(c => c.x + c.w);
    const left = colsX.length ? Math.min(...colsX) : 12;
    const right = colsR.length ? Math.max(...colsR) : (tpl.width - 12);
    area.style.bottom = 'auto';
    area.style.top = `${Math.round(tpl.contentBox.bottom - page.fnReservedHeightPx)}px`;
    area.style.left = `${Math.round(left)}px`;
    area.style.right = `${Math.max(0, Math.round(tpl.width - right))}px`;
  }
  if (settings['footnote-separator-rule'] !== 'none') {
    const rule = doc.createElement('div');
    rule.className = `fn-rule fn-rule--${settings['footnote-separator-rule']}`;
    area.appendChild(rule);
  }
  // סמן אחיד (notes/markers) + סימון המשך למקטעי פיצול (S7.1.3 long-note policy)
  const mkNote = (n) => {
    const marker = n.marker || markerFor(Number.isInteger(n.docIndex) ? n.docIndex : (n.markerNum || 1), settings['footnote-marker-style']);
    const el = doc.createElement('div');
    const cont = n.isContinuation || n.mode === 'split-rest';
    el.className = 'footnote' + (cont ? ' fn--continuation' : '') + (n.customStyle ? ' footnote--custom' : '');
    if (n.customStyle) el.dataset.style = n.customStyle;
    el.dir = 'rtl';
    el.textContent = `${cont ? '(המשך) ' : ''}${marker}\u200F ${scrubPUAText(n.text || n)}`;
    return el;
  };
  // **S5.4 (תצוגה=ייצוא):** שני נתיבים לפי footnote-columns — חלוקת הערות
  // זהה לתקציב/פרויקטור (LPT דטרמיניסטית) — התצוגה וה-PDF מציגים את אותן
  // הערות באותם נתיבים. הנתיב הראשון מימין (RTL).
  const twoLanes = settings['footnote-columns'] === 2
    && tpl && Array.isArray(tpl.columns) && tpl.columns.length >= 2
    && page.fnReservedHeightPx > 0;
  if (twoLanes) {
    const order = page.footnotes.map((n, i) => ({ i, h: n.heightPx || 0 })).sort((a, b) => b.h - a.h || a.i - b.i);
    const totals = [0, 0];
    const laneOf = new Map();
    for (const s of order) { const li = totals[0] <= totals[1] ? 0 : 1; totals[li] += s.h; laneOf.set(s.i, li); }
    const lanes = [[], []];
    page.footnotes.forEach((n, i) => lanes[laneOf.get(i)].push(n));
    const row = doc.createElement('div');
    row.style.display = 'flex';
    row.style.flexDirection = 'row-reverse'; // RTL — הנתיב הראשון מימין
    row.style.gap = `${Math.round(tpl.gutter || 0)}px`;
    for (const lane of lanes) {
      const laneEl = doc.createElement('div');
      laneEl.className = 'footnotes-lane';
      laneEl.style.flex = '1 1 0';
      laneEl.style.minWidth = '0';
      for (const n of lane) laneEl.appendChild(mkNote(n));
      row.appendChild(laneEl);
    }
    area.appendChild(row);
  } else {
    for (const n of page.footnotes) area.appendChild(mkNote(n));
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
  const used = page.columns.map(col => col.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1), 0));
  // **S6.0 (R4-M5):** גובה המפריד כולל aqStretch — כמו הפרויקטור/PDF
  // (בעבר ה-DOM חישב גובה ללא המתיחה ⇒ מפריד באורך שונה בין תצוגה לייצוא).
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
 * **EXT-4 (הדיו):** kindStyle מקבל דיו — SVG מובנה/מספרייה כרקע data-URI,
 * או קו דק (thin). עד כאן התיבות היו בלתי-נראות (אין כללי .orn ב-CSS).
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
    } else if (d.kindStyle && d.kindStyle !== 'none') {
      // **EXT-4:** הדיו של kindStyle — מקור יחיד (ornament-ink): SVG מובנה
      // (pyramid/lance/shoshanta/scroll) או מספריית העיצובים (imud:...) —
      // רקע data-URI מותאם לתיבה; 'thin' — קו מפריד דק.
      const ink = ornamentInk(d.kindStyle);
      if (ink && ink.type === 'svg') {
        el.style.backgroundImage = `url("${ink.uri}")`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundPosition = 'center center';
        el.style.backgroundRepeat = 'no-repeat';
      } else if (ink && ink.type === 'rule') {
        el.style.borderTop = '0.75px solid #000';
        el.style.height = '0px';
      } else if (ink && ink.type === 'image') {
        el.style.backgroundImage = `url("${ink.uri}")`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundPosition = 'center center';
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
/**
 * **S4.10 — רנדור DOM של עמוד legacy-imud-flow (התצוגה החיה).**
 *
 * הגיאומטריה כולה כבר מחושבת במנוע המורשת ב-px@96 (מכויל מהייחוס):
 * פסים (סימן/h2/h0/h3), שערים, טורים (ימני 403.61 / שמאלי 120.72, רוחב 269.41),
 * הערות תחתית, הערות צד בשוליים, שורות TOC, כותרת עליונה תלת-סלוטית ועמודון.
 * הרנדר מצייר אותה גיאומטריה בדיוק — מה שרואים בתצוגה = מה שיוצא ב-PDF
 * (legacy-projector) — אותו מקור אמת אחד.
 */
function renderLegacyPage(pg, settings, doc) {
  const { GEO, SZ, parenCenterRaisePx } = require('../layout/legacy-imud-flow');
  const BAND_X = GEO.COL_L_X;
  const BAND_W = 2 * GEO.COL_W + 13.48;
  // **S4.26 (גופני ברירת המחדל בכל האלמנטים):** גוף ההערה, הערות-הצד,
  // הכותרות ושורות ה-TOC — כל אחד מקבל את הגופן שהוגדר לו (עד כאן הכל
  // ירש את גופן הגוף). הכותרות מודגשות (כמו ה-DavidLibre-Bold של הייחוס).
  const imudSetAll = (settings && settings._imudRaw) || {};
  const fontOf = (k) => { const v = settings[k]; return v ? fontStack(v) : null; };
  const headingFontOf = (level) => fontOf('heading-' + level + '-font');
  const HEADING_LEVEL_OF_BAND = { 'h0-title': 0, 'h2-siman': 2, 'h2-title': 2, 'h3-title': 3 };
  const root = doc.createElement('article');
  root.className = LEGACY_PT_CLASS[pg.type] || PT_CLASS[pg.type] || 'page';
  root.dataset.pageIndex = String(pg.index);
  root.setAttribute('id', `page-${pg.index}`);
  root.dir = 'rtl';
  root.style.width = `${GEO.PAGE_W}px`;
  root.style.height = `${GEO.PAGE_H}px`;
  root.style.position = 'relative';
  root.style.overflow = 'hidden';
  const bf = settings['body-font'];
  if (bf) root.style.fontFamily = fontStack(bf);
  const pt2px = (pt) => pt * (96 / 72);
  const position = (el, x, y, w, h) => {
    el.style.position = 'absolute';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    if (w != null) el.style.width = `${w}px`;
    if (h != null) el.style.height = `${h}px`;
  };
  // **S5.1 (איחוד מודל הבסיס — "תצוגה = ייצוא"):** גובה השורה בתצוגה = גובה
  // התיבה מהמודל (בדיוק כמו baselineOf של המקרן ל-PDF וכמו line-height:1.34
  // של המקור). בעבר היה קבוע 1.1 — הטקסט ישב בראש התיבה ולא ממרוז בה,
  // בזמן שה-PDF מרכז — הפרש אנכי שיטתי בכל שורה (2–4px).
  const mkLine = (text, sizePt, align, lhPx = 0) => {
    const el = doc.createElement('div');
    el.className = 'line';
    el.setAttribute('dir', 'rtl');
    el.style.fontSize = `${pt2px(sizePt)}px`;
    el.style.lineHeight = (lhPx && lhPx > 0) ? `${lhPx}px` : '1.1';
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'visible';
    el.style.textAlign = align;
    // **S4.24 (מרכוז פסים בתצוגה החיה):** כלל ה-text-align-last:justify של
    // BASE_CSS (.line:not(.line--last):not(.line--heading)) חל גם על קווי
    // הפס וההערות-צד (class="line …") — שורה בודדת בבלוק נחשבת "אחרונה"
    // וה-justify דרס את ה-center/right: מילים פזורות מקצה לקצה, מילה
    // בודדת נדבקת לקצה הימני (נמדד בחי: "הקדמה" אסימטריה 494px). ערך
    // inline גובר על הכלל.
    el.style.textAlignLast = 'auto';
    el.textContent = scrubPUAText(text);
    return el;
  };

  // ---- כותרת עליונה תלת-סלוטית (פס 42.6–57.6pt ⇒ px) ----
  // **D-89:** צבע כחול-הייחוס #0F1749 — כמו במקרן ה-legacy (נמדד בייחוס).
  const hs = pg.headerSlots;
  if (hs && (hs.right || hs.center || hs.left)) {
    const hdr = doc.createElement('div');
    hdr.className = 'running-head';
    hdr.setAttribute('dir', 'rtl');
    // **S5.1 (מיקום סלוטי הכותרת מהייחוס):** התיבה הקודמת [60, 733.7] הצמידה
    // את הסלוטים לקצוות הדף — 94px/97px ממיקום הטקסט בייחוס (עמ' 12:
    // ימין x1=479.84pt=639.8px, שמאל x0=117.68pt=156.9px, מרכז 297.65pt).
    // הקבועים משוקפים מ-mk() של המקרן (COL_R_X+COL_W−33 / COL_L_X+33) —
    // מרכז התיבה = מרכז הדף בדיוק. התצוגה = הייצוא = הייחוס.
    // **S5.2 (O3 — ריתוק דטרמיניסטי של הבסיס):** במקום flex baseline
    // (תלוי-פלטפורמה: 67.6–73.6px מול 71.9 ב-PDF) — סלוטים אבסולוטיים
    // בתוך אותה תיבה; הבסיס = HEADER_BASELINE (71.9) באמצעות line-height:1
    // + מטריקות DavidLibre-Bold (asc 0.7461 / desc 0.2192 ⇒ היסט 0.7635·S),
    // ומשקל 700 מפורש (פנים ה-Bold הרשומים). מרכז = מרכז הדף (כמו ה-PDF),
    // לא מרכז space-between.
    position(hdr, GEO.COL_L_X + 33, 52, (GEO.COL_R_X + GEO.COL_W - 33) - (GEO.COL_L_X + 33), 22);
    hdr.style.color = 'rgb(15,23,73)';
    const HDR_BASELINE_Y = 71.9;
    const DLB_BASELINE_FACTOR = 0.5 + (0.7461 - 0.2192) / 2; // DavidLibre-Bold, line-height:1
    const slots = [
      ['rh rh--r', hs.right, SZ.hdrR, 'header-recto-right-font', 'right'],
      ['rh rh--c', hs.center, SZ.hdrC, 'header-recto-center-font', 'center'],
      ['rh rh--l', hs.left, SZ.hdrL, 'header-recto-left-font', 'left']
    ];
    for (const [cls, txt, sz, fk, posKind] of slots) {
      if (!txt) continue;
      const s = doc.createElement('span');
      s.className = cls;
      s.textContent = txt;
      const szPx = pt2px(sz);
      s.style.fontSize = `${szPx}px`;
      const ff = fontOf(fk);
      if (ff) s.style.fontFamily = ff; // **S4.26:** גופן הסלוט מההגדרות (ברירת מחדל: David Libre)
      s.style.fontWeight = '700';
      s.style.position = 'absolute';
      s.style.lineHeight = '1';
      s.style.top = `${(HDR_BASELINE_Y - 52) - szPx * DLB_BASELINE_FACTOR}px`;
      if (posKind === 'right') s.style.right = '0';
      else if (posKind === 'left') s.style.left = '0';
      else { s.style.left = '50%'; s.style.transform = 'translateX(-50%)'; }
      hdr.appendChild(s);
    }
    root.appendChild(hdr);
  }

  // ---- פסים: סימן/h2/h0/h3 — ממורכזים ברוחב הפס ----
  for (const b of (pg.bands || [])) {
    const el = mkLine(b.text, b.sizePt, 'center', b.h || pt2px(b.sizePt) * 1.1);
    el.className += ` band band--${b.kind || 'title'}`;
    // **S4.26:** גופן הכותרת מההגדרות + הדגשה — כמו הייחוס (DavidLibre-Bold)
    const hLv = HEADING_LEVEL_OF_BAND[b.kind];
    if (hLv != null) {
      const hf = headingFontOf(hLv);
      if (hf) { el.style.fontFamily = hf; el.style.fontWeight = '700'; }
    }
    position(el, BAND_X, b.y, BAND_W, b.h);
    root.appendChild(el);
  }

  // ---- תוכן השערים ----
  // **D-89:** צבע פר-שורה (בלוקי השער האחורי — הקבועים של renderBackShaar)
  // ותיבת התוכן של כל שער — כמו במקרן ה-legacy (sub: מרכז 245.7px; back: 548px;
  // main: 396.85px — מכויל מהייחוס עמ' 1/2/7).
  {
    const MMpx = 96 / 25.4;
    const GATE_BOX = {
      'shaar-main': { x: 15 * MMpx, w: GEO.PAGE_W - 30 * MMpx },
      'shaar-back': { x: 95 * MMpx, w: 377.98 },
      'shaar-sub': { x: 15 * MMpx, w: GEO.PAGE_W - 110 * MMpx }
    };
    const gbox = GATE_BOX[pg.type] || { x: BAND_X, w: BAND_W };
    for (const g of (pg.gateLines || [])) {
      const el = mkLine(g.text, g.sizePt, 'center', pt2px(g.sizePt) * 1.3);
      el.className += ' band band--gate';
      position(el, gbox.x, g.y, gbox.w, pt2px(g.sizePt) * 1.3);
      // **S4.26 (הערה):** גופני השערים (LiaSgula/Livorna ⇒ Bellefair/David Libre)
      // נבדקו והוחזרו — wrapGate מודד את שורות השער בגופן הגוף, ורינדור בגופן
      // אחר גרם לגלישת 4px מהתיבה (BAND_INK_OUTSIDE, עמ' 20 בקורפוס הגדול).
      // עד למדידת-שער ייעודית — השערים בגופן הגוף (כמו כיול D-89).
      if (Array.isArray(g.color)) {
        el.style.color = `rgb(${Math.round(g.color[0] * 255)},${Math.round(g.color[1] * 255)},${Math.round(g.color[2] * 255)})`;
      }
      root.appendChild(el);
    }
  }

  // ---- טורים: ימני ואז שמאלי; preface/shaar/toc = טור רחב יחיד ----
  const isSingle = pg.type === 'preface' || pg.type === 'toc-general' || pg.type === 'toc-detailed'
    || String(pg.type || '').startsWith('shaar');
  const colDefs = isSingle
    ? [{ x: GEO.COL_L_X, w: BAND_W }]
    : [{ x: GEO.COL_R_X, w: GEO.COL_W }, { x: GEO.COL_L_X, w: GEO.COL_W }];
  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  pg.columns.forEach((colLines, ci) => {
    const def = colDefs[Math.min(ci, colDefs.length - 1)];
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    position(colEl, def.x, GEO.FLOW_TOP, def.w, GEO.FLOW_H);
    colEl.style.overflow = 'visible';
    for (const ln of colLines) {
      const el = doc.createElement('div');
      // **S4.11:** line--heading מסמן שורות כותרת מרובעות (ממורכזות מטבען)
      // — האודיט החי מדלג עליהן בבדיקת היישור בלי סובלנות על סמך יחס.
      el.className = 'line' + (ln.isLast ? ' line--last' : '') + (ln.kind === 'heading' ? ' line--heading' : '');
      el.setAttribute('dir', 'rtl');
      el.style.position = 'absolute';
      el.style.right = '0';
      el.style.top = `${(ln.y || 0) - GEO.FLOW_TOP}px`;
      el.style.width = `${def.w}px`;
      // **תיבת השורה = גובה המסגרת מהמנוע (pitch):** בלי גובה מפורש, שורת
      // חלון (1.5×) מנפחת את התיבה וחופפת את השורה הבאה במדידת ה-DOM
      // (האודיט החי מדווח LINE_OVERLAP). התוכן עשוי לגלוש ויזואלית — כמו
      // line-height:0.85 של מילת-החלון במקור — אבל התיבה נשארת בגובה הפס.
      el.style.height = `${ln.heightPx || 16}px`;
      el.style.fontSize = `${pt2px(ln.sizePt || SZ.body)}px`;
      // **S5.1 (איחוד מודל הבסיס):** שורות גוף/חלון — line-height = גובה
      // התיבה מהמודל (מרכוז half-leading, כמו baselineOf ב-PDF וכמו
      // line-height:1.34=21.44px של המקור; בסיס השורה הראשונה ≈122px מול
      // 107.2+14.8 בייחוס). כותרות inline נשארות בראש התיבה ('1') — כמו
      // הייחוס (S4.14: גליפי הכותרת בראש השורה) וכמו y+0.6 במקרן.
      el.style.lineHeight = ln.kind === 'heading' ? '1' : `${ln.heightPx || 16}px`;
      el.style.overflow = 'visible';
      // **S4.23 (דיווח משתמש: "יישור שורות לא נכון" בתצוגה החיה):** שורות גוף
      // מלאות עוברות ל-white-space:normal + text-align:justify
      // **וגם text-align-last:justify** — בדיוק כמו BASE_CSS של שאר הנתיבים
      // (03.11(ד): "טורים מיושרים באופן מושלם"). שתי הסיבות שבגללן התצוגה
      // הייתה קטסטרופה (נמדד בפועל: פערי קצה-שמאל 2..53px, חלקן גלשו מהטור):
      //   1) inline nowrap דרס את BASE_CSS — ו-justify על שורת nowrap הוא
      //      אפס-פעולה;
      //   2) **גם בלי nowrap**: לפי הוראת CSS שורה יחידה בבלוק נחשבת "השורה
      //      האחרונה" ולעולם אינה נמתחת ע"י justify. כל .line כאן הוא בלוק
      //      בן-שורה-אחת מתוכנן (השבירה כבר נעשתה במנוע) — ולכן הדבר היחיד
      //      שמותח אותה הוא text-align-last:justify (נתמך בכרום/פיירפוקס).
      // הדפדפן מותח רווחים בין-מילים — אותה נוסחה של המקרן ל-PDF
      // (projectLine: spaceW=(colW-sumW)/gaps) — התצוגה = הייצוא.
      // שורות אחרונות/כותרות נשארות nowrap+center (חד-שורתיות מטבען;
      // מסומנות ומדולגות באודיט). סדר ההצהרות חשוב: רק שורות גוף מלאות
      // מקבלות את text-align-last — אחרת הוא היה מיישר גם שורות אחרונות
      // (שהגדרתן center/right) ומקורן של הסמנים.
      // **S5.2 (S5 — חיווט body-last-line-align במורשת):** ברירת המחדל 'center'
      // = ההתנהגות הקיימת בדיוק; 'right' = הצמדה לתחילת השורה (ימין ב-RTL),
      // 'stretch' = יישור מלא גם לשורה האחרונה. בעבר המפתח סווג 'light' אך
      // מעולם לא מומש בנתיב החי — שינוי הגדרה לא שינה דבר.
      const lastAlign = String((settings && settings['body-last-line-align']) || 'center');
      if (ln.kind === 'heading') {
        el.style.whiteSpace = 'nowrap';
        el.style.textAlign = 'center';
      } else if (ln.isLast) {
        if (lastAlign === 'right') {
          el.style.whiteSpace = 'nowrap';
          el.style.textAlign = 'right';
        } else if (lastAlign === 'stretch') {
          el.style.whiteSpace = 'normal';
          el.style.textAlign = 'justify';
          el.style.textAlignLast = 'justify';
        } else {
          el.style.whiteSpace = 'nowrap';
          el.style.textAlign = 'center';
        }
      } else {
        el.style.whiteSpace = 'normal';
        el.style.textAlign = 'justify';
        el.style.textAlignLast = 'justify';
      }
      // **S4.26 (גופן כותרות inline):** h4/h5/h6 בגופן הרמה מההגדרות + הדגשה
      if (ln.kind === 'heading' && ln.level != null) {
        const hf = headingFontOf(ln.level);
        if (hf) { el.style.fontFamily = hf; el.style.fontWeight = '700'; }
      }
      // **S4.26 (חלון קלאסי שקוע — שורה 1 עוטפת את החלון):** במקור מילת-החלון
      // מרחפת (float:right, height:1.25em) והטקסט עוטף אותה בשתי השורות
      // הראשונות. שורה 1 (window בלי windowWords) מוצרת ברוחב החלון ומוזזת
      // מימין — המודל כבר מדד אותה ברוחב המוקטן (limitOf של breakPara);
      // עד כאן היא נמתחה בחזרה לרוחב מלא. המחלקה מסמנת לאודיט לדלג על בדיקת
      // היישור (השפה הימנית תפוסה ע"י החלון — בכוונה).
      if (ln.window && !ln.windowWords && ln.windowW) {
        el.className += ' line--window-wrap';
        el.style.right = `${ln.windowW}px`;
        el.style.width = `${Math.max(40, def.w - ln.windowW)}px`;
      }
      if (ln.window && ln.windowWords && ln.windowWords.length) {
        // מילת-חלון (1.5×) בשפה הימנית + הטקסט — תיבה אחת, בסיס משותף
        // **S4.15:** גופן החלון של המקור — FrankReal משקל 900 (הוכח מהייחוס:
        // 116 מילות-חלון נמדדו — התאמה מושלמת ל-FrankReal-Bold.ttf). המשפחות
        // הנופלות מגובוות ב-CSS (BASE_CSS: .w--window) — ברירת מחדל גוף.
        const win = doc.createElement('span');
        win.className = 'w w--window';
        win.textContent = scrubPUAText(ln.windowWords.join(' ')) + ' ';
        win.style.fontSize = `${pt2px((ln.sizePt || SZ.body) * 1.5)}px`;
        // **S5.1:** בסיס החלון 2px מתחת לבסיס שורת הטקסט — כמו winBase=baseY+2
        // במקרן (מכויל מהייחוס: חלון 155.25 מול שורה 153.75, ~1.5pt). בלי זה
        // החלון יושב על בסיס משותף עם הגוף וגבוה ב-2px ב-PDF.
        win.style.verticalAlign = '-2px';
        el.appendChild(win);
      }
      // **D-89 (דיווח משתמש: "כל מילה שצמודה לנקודה מופיעה בגופן קטן"):**
      // סמני ההערות מוקטנים לפי markerIdx של המודל — בדיוק כמו במקרן
      // ה-legacy/PDF. מספור האיות ("א. ב. ג.") נשאר בגודל הגוף — כמו הייחוס.
      // **S4.24 (אודיט חי מלא על הקובץ הגדול — 154 ממצאי דיו):** מילים בתוך
      // סוגריים מרונדרות כאן בגודל השורה (12pt) בעוד השובר מודד אותן בגודל
      // הסוגריים (10pt — parenDelta; הייחוס: פסקאות-הסוגריים כולן ב-10.0pt).
      // תוצאה: שורה אחרונה/כותרת של פסקת-סוגריים רחבה מהטור ב-×1.2 וגולשת
      // ממנו שמאלה (נמדד באתר החי: 78 INK_OUTSIDE_COLUMN עד 156px, 73
      // LAST_NOT_CENTERED, 3 HEAD_NOT_CENTERED — כולן שורות-סוגריים).
      // התיקון משקף את placeWords של המקרן ל-PDF: מילת-סוגריים ב-span
      // בגודל 10pt, מוגבהת ב-0.33×גודל-השורה (בסיס משותף כמו baselineY).
      // בנוסף: (א) כותרות אינן מקבלות כיווץ-סוגריים (השבירה מודדת אותן
      // בגודל הכותרת); (ב) מילת-RLM בלבד מודבקת לשכנתה — בלי רווח פנטום
      // שמ�זיז את המרכוז (נמדד: אסימטריה 3.8px); (ג) הרווח בין שתי מילים
      // בתוך (...) ב-span של 10pt — כמו spaceBetween בשבירה (התצוגה =
      // הייצוא, כמו S4.23).
      {
        const markerSet = new Set(Array.isArray(ln.markerIdx) ? ln.markerIdx : []);
        const imudSet = (settings && settings._imudRaw) || {};
        const markerSz = Number(imudSet['note-marker-size']) || 8;
        const parenPx = pt2px(SZ.body + SZ.parenDelta);
        const hostPx = pt2px(ln.sizePt || SZ.body);
        // **S4.26 (דיווח משתמש: "ממוקם גבוה ביחס לטקסט הרגיל"):** מרכוז אנכי
        // — מרכז גובה הסוגריים מותאם למרכז גובה הטקסט הרגיל (אותו מודל
        // תיבת-שורה כמו baselineY של המקרן: parenCenterRaisePx). במקום ההגבהה
        // העיוורת 0.33×גודל-השורה (5.3px!) — עכשיו ≈0.7px בלבד.
        const parenRaise = parenCenterRaisePx(pg.ascentEm, ln.sizePt || SZ.body, SZ.body + SZ.parenDelta).toFixed(2);
        const isHeading = ln.kind === 'heading';
        const srcWords = ln.words || [];
        const nW = srcWords.length;
        // **S4.24 (דגלי קצה מהמודל — מקור יחיד):** parenStarts/parenEnds
        // של השבירה; נפילה — שחזור עומק-תווים (אותו אלגוריתם כמו breakPara).
        let parenIdx = null, pStarts = null, pEnds = null;
        if (!isHeading && Array.isArray(ln.parenFlags) && ln.parenFlags.length === nW) {
          parenIdx = new Set();
          ln.parenFlags.forEach((p, i) => { if (p) parenIdx.add(i); });
          if (Array.isArray(ln.parenStarts) && ln.parenStarts.length === nW && Array.isArray(ln.parenEnds) && ln.parenEnds.length === nW) {
            pStarts = ln.parenStarts; pEnds = ln.parenEnds;
          }
        } else if (!isHeading && nW) {
          parenIdx = new Set();
          const st = [], en = [];
          let depth = 0;
          srcWords.forEach((w, i) => {
            let any = false, s = false, e = false;
            for (let c = 0; c < w.length; c++) {
              const ch = w[c];
              if (ch === '(') depth++;
              const inP = depth > 0;
              if (inP) any = true;
              if (c === 0) s = inP;
              e = inP;
              if (ch === ')' && depth > 0) depth--;
            }
            if (any) parenIdx.add(i);
            st.push(s); en.push(e);
          });
          pStarts = st; pEnds = en;
        }
        // **S4.24 (מילים של תווי-כיוון בלבד — בלי רווח פנטום):** מילה המורכבת
        // מתווי כיוון (RLM/LRM וכו') היא ברוחב אפס, אבל הרווח שמפריד אותה
        // משכנתה נכלל בתיבת השורה ומזיז את המרכוז (נמדד בחי: אסימטריה
        // 3.8px בשורות אחרונות, עמ' 572). הדבקה לשכן — הכיווניות נשמרת,
        // הרווח הפנטום נעלם; נמדד-לעולם-גדול מהרינדר ⇒ אין חשש לגלישה.
        const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
        const items = [];
        for (let wi = 0; wi < nW; wi++) {
          const w = srcWords[wi];
          if (FORMAT_WORD_RE.test(w)) {
            if (items.length) { items[items.length - 1].text += w; continue; }
            items.push({ text: w, wi: -1 }); // מובילה — תודבק למילה הבאה
            continue;
          }
          const it = { text: w, wi };
          if (items.length === 1 && items[0].wi === -1) { it.text = items[0].text + w; items[0] = it; }
          else items.push(it);
        }
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          const w = it.text;
          const wi = it.wi;
          if (wi >= 0 && markerSet.has(wi)) {
            const m = doc.createElement('span');
            m.className = 'w w--fnmarker';
            m.textContent = scrubPUAText(w);
            m.style.fontSize = `${pt2px(markerSz)}px`;
            m.style.verticalAlign = 'super';
            el.appendChild(m);
          } else if (!isHeading && wi >= 0 && parenIdx && parenIdx.has(wi)) {
            const s = doc.createElement('span');
            s.className = 'w w--paren';
            s.textContent = scrubPUAText(w);
            s.style.fontSize = `${parenPx}px`;
            s.style.verticalAlign = `${parenRaise}px`;
            el.appendChild(s);
          } else {
            el.appendChild(doc.createTextNode(scrubPUAText(w)));
          }
          if (k < items.length - 1) {
            // **S4.24 (רווח בגודל הסוגריים בתוך ה-span):** כמו spaceBetween
            // בשבירה — הרווח בין שתי מילים ששני צדדיהן בתוך (...) ב-10pt.
            // בלי זאת שורת-סוגריים אחרונה גולשת מהטור (נמדד בחי: 4px, עמ' 403).
            const a = items[k].wi, b = items[k + 1].wi;
            const parenSpace = !isHeading && a >= 0 && b === a + 1 && pStarts && pEnds && !!pEnds[a] && !!pStarts[b];
            if (parenSpace) {
              const sp = doc.createElement('span');
              sp.className = 'w w--paren-space';
              sp.style.fontSize = `${parenPx}px`;
              sp.textContent = ' ';
              el.appendChild(sp);
            } else {
              el.appendChild(doc.createTextNode(' '));
            }
          }
        }
      }
      if (ln.tokenId != null) el.dataset.tokenId = String(ln.tokenId);
      colEl.appendChild(el);
    }
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  // ---- הערות צד בטורי השוליים ----
  // **S4.26:** גופן הערות-הצד מההגדרות (ברירת מחדל: Hadassah Friedlaender
  // — כמו המדידה במנוע וכמו הייחוס); עד כאן ירשו את גופן הגוף.
  {
    const mnFont = fontOf('heading-7-font');
    for (const mn of (pg.marginNotes || [])) {
      const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
      for (const l of (mn.lines || [])) {
        const el = mkLine(l.text, SZ.marginNote, 'right', GEO.MN_PITCH);
        el.className += ' margin-note';
        if (mnFont) el.style.fontFamily = mnFont;
        position(el, x, l.y, GEO.MARGIN_W, GEO.MN_PITCH);
        root.appendChild(el);
      }
    }
  }

  // ---- הערות שוליים (תחתית) ----
  // **S4.26 (דיווח משתמש — בעיות 3–5):** (א) מצב רציף (ברירת מחדל): כל
  // הערות העמוד זורמות בבלוק אחד — הערה הבאה פותחת באותה שורה שבה הסתיימה
  // קודמתה (רווח-כפול בין הערות); (ב) יישור לשני הצדדים — שורות הביניים
  // מתוחות, השורה האחרונה לימין (כמו .note-line של המקור); (ג) המשך
  // מקודם — '(המשך)' בלי אות סימון; (ד) גופן גוף-ההערה מההגדרות
  // (f-note-body — Frank Ruhl Libre) — כמו המדידה (fnApi) במנוע.
  {
    const fnFont = fontOf('f-note-body-font') || fontOf('body-font');
    const listingSz = Number(imudSetAll['note-listing-num-size']) || 8;
    for (const fn of (pg.footnotes || [])) {
      // **S4.26:** זרימה שפותחת בהמשך — מסומנת fn--continuation (כמו block)
      const firstTok = fn.continuous && fn.lines[0] && (fn.lines[0].words || []).find(t => !t.gap);
      const flowIsCont = !!(firstTok && firstTok.t === '(המשך)');
      const el = doc.createElement('div');
      el.className = 'footnote' + ((fn.cont || flowIsCont) ? ' fn--continuation' : '') + (fn.continuous ? ' fn--flow' : '');
      el.setAttribute('dir', 'rtl');
      const lines = fn.lines || [];
      const y0 = lines[0] ? lines[0].y : GEO.FLOW_TOP;
      const h = lines.length * GEO.FN_PITCH;
      position(el, GEO.COL_L_X, y0, BAND_W, h);
      el.style.fontSize = `${pt2px(SZ.fnBody)}px`;
      el.style.lineHeight = `${GEO.FN_PITCH}px`;
      if (fnFont) el.style.fontFamily = fnFont;
      el.style.textAlign = 'justify';
      el.style.textAlignLast = 'right';
      el.style.whiteSpace = 'normal';
      if (fn.continuous) {
        // זרימה רציפה — הדפדפן שובר ומיישב (אותו רוחב/גופן כמו fnFlowFor);
        // סמנים בגודל הרישום; רווח-כפול בין הערות (nbsp — כמו הגאפ במודל).
        let prevGap = true;
        for (const l of lines) {
          for (const t of (l.words || [])) {
            if (t.gap) { el.appendChild(doc.createTextNode('\u00A0 ')); prevGap = true; continue; }
            if (!prevGap) el.appendChild(doc.createTextNode(' '));
            prevGap = false;
            const s = doc.createElement('span');
            if (t.mk) {
              s.className = 'w w--fnmarker';
              s.style.fontSize = `${pt2px(listingSz)}px`;
            }
            s.textContent = scrubPUAText(t.t);
            el.appendChild(s);
          }
        }
      } else {
        // מצב block — כל הערה בלוק משלה, מיושבת לשני הצדדים (בעבר: לימין בלבד)
        if (fn.cont) {
          const p = doc.createElement('span');
          p.className = 'fn-cont';
          p.textContent = '(המשך) ';
          el.appendChild(p);
        }
        if (fn.marker) {
          const m = doc.createElement('span');
          m.className = 'w w--fnmarker';
          m.style.fontSize = `${pt2px(listingSz)}px`;
          m.textContent = scrubPUAText(fn.marker);
          el.appendChild(m);
          el.appendChild(doc.createTextNode(' '));
        }
        el.appendChild(doc.createTextNode(scrubPUAText(lines.map(l => (Array.isArray(l.words) ? l.words : String(l.words).split(' ')).join(' ')).join(' '))));
      }
      root.appendChild(el);
    }
  }

  // ---- תוכן-עניינים: כותרת + שורות (כותרת מימין במדרגות, מספר משמאל) ----
  if (pg.toc) {
    if (pg.toc.title) {
      const el = mkLine(pg.toc.title, SZ.tocTitle, 'center', 30);
      el.className += ' toc-title';
      position(el, BAND_X, GEO.FLOW_TOP + 136, BAND_W, 30);
      root.appendChild(el);
    }
    for (const r of (pg.toc.rows || [])) {
      // **S6.0 (F5):** שורת TOC עטופה — כל שורה-בת היא שורת flex בפס 26px
      // משלה; הגיליון (מספר) רק בשורה הראשונה. שורות חד-שורתיות זהות
      // לחלוטין לפלט הקודם (אותן מחלקות, אותו מיקום).
      const rowLines = (r.lines && r.lines.length ? r.lines : [r.text]).filter(t => String(t || '').trim());
      rowLines.forEach((rowText, rli) => {
        const row = doc.createElement('div');
        row.className = 'toc-row';
        row.setAttribute('dir', 'rtl');
        position(row, GEO.TOC_NUM_X, r.y + rli * 26, (r.x1 || 560) - GEO.TOC_NUM_X, 26);
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.fontSize = `${pt2px(r.sizePt || 10.5)}px`;
        // **S5.1:** גובה שורת TOC = התיבה (26px) — כמו baselineOf(r.y, 26, ...) במקרן
        row.style.lineHeight = '26px';
        // **S4.26:** גופן שורות ה-TOC מההגדרות + הדגשה — כמו הייחוס
        // (DavidLibre-Bold @10.5/10/9.5 בכל שורות התוכן)
        const tf = headingFontOf(r.level != null ? r.level : 2);
        if (tf) { row.style.fontFamily = tf; row.style.fontWeight = '700'; }
        const t = doc.createElement('span');
        t.className = 'toc-text';
        t.style.marginRight = `${Math.max(0, 560 - (r.x1 || 560))}px`; // מדרגות לפי רמה
        t.textContent = scrubPUAText(rowText || '');
        row.appendChild(t);
        if (r.folio && rli === 0) {
          const n = doc.createElement('span');
          n.className = 'toc-num';
          n.style.fontSize = `${pt2px(SZ.tocNum)}px`;
          n.textContent = r.folio;
          row.appendChild(n);
        }
        root.appendChild(row);
      });
    }
  }

  // ---- עמודון ----
  if (pg.folioDisplay) {
    const folio = doc.createElement('div');
    folio.className = 'folio';
    folio.setAttribute('dir', 'rtl');
    position(folio, 0, GEO.FOLIO_BASELINE - 14, GEO.PAGE_W, 18);
    folio.style.textAlign = 'center';
    folio.style.fontSize = `${pt2px(SZ.folio)}px`;
    // **S5.1:** line-height מכויל כך שהבסיס יורד בדיוק ל-FOLIO_BASELINE (1054.5)
    // תחת מודל תיבת-השורה (A≈0.925, D≈0.388 בגופן הגוף ⇒ lh≈21.4px) — כמו
    // המקרן, שמצייר את הגיליון בבסיס 1054.5 בדיוק. בעבר ירש normal וישב ~3.5px גבוה.
    folio.style.lineHeight = '21.4px';
    folio.textContent = pg.folioDisplay;
    root.appendChild(folio);
  }

  // ---- עיטורים (D-89: פאנלי השערים, גל השער-משנה, מסגרת השער הראשי, כלל הכותרת) ----
  // אותו דיו כמו ב-PDF (ornament-ink — מקור יחיד): rect ⇒ div צבוע; svg ⇒ רקע
  // data-URI. הפאנלים נכנסים ראשונים (מאחורי הטקסט) והעיטורים אחרונים (מעל).
  if (Array.isArray(pg.decorations) && pg.decorations.length) {
    const inks = pg.decorations.map((d) => ({ d, ink: d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle) }));
    for (const { d, ink } of inks) {
      if (!ink) continue;
      if (ink.type === 'rect') {
        const r = doc.createElement('div');
        r.className = 'deco deco--rect';
        position(r, d.x, d.y, d.w, d.h);
        r.style.backgroundColor = `rgb(${Math.round(ink.color[0] * 255)},${Math.round(ink.color[1] * 255)},${Math.round(ink.color[2] * 255)})`;
        if (d.kind === 'shaar-panel') { r.style.zIndex = '0'; root.insertBefore(r, root.firstChild); }
        else root.appendChild(r);
      } else if (ink.type === 'svg' || ink.type === 'image') {
        const r = doc.createElement('div');
        r.className = 'deco deco--' + (ink.type === 'svg' ? 'svg' : 'img');
        position(r, d.x, d.y, d.w, d.h);
        r.style.backgroundImage = `url("${ink.uri}")`;
        r.style.backgroundRepeat = 'no-repeat';
        r.style.backgroundPosition = 'center';
        r.style.backgroundSize = 'contain';
        root.appendChild(r);
      }
    }
  }
  return root;
}

function renderPage(page, settings, doc, header) {
  // **S4.10 — עמודי מנוע המורשת:** לעמודי legacy-imud-flow יש צורה משלהם
  // (גיאומטריה מפורשת ב-px: bands/gateLines/columns/footnotes/marginNotes/toc)
  // שאינה תואמת את חוזה ה-DP — הרנדר הכללי קרס על template.columns חסר
  // והתצוגה החיה הציגה 0 עמודים. רנדר ייעודי נאמן לגיאומטריית המורשת.
  if (page && page.legacy) return renderLegacyPage(page, settings, doc);
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
  // **S5.4 (P-5 — תצוגה=ייצוא):** ההערות ממוקמות לפי המודל (colIdx/heightPx
  // מ-buildEndnotePages) במיקום מוחלט בטורי התבנית — כמו שהפרויקטור מקרין
  // ל-PDF. בעבר: רשימת זרימה אחת ברוחב מלא — התצוגה הציגה טור אחד בזמן
  // שהמודל קבע שניים. ללא נתוני מודל — נפילה לרשימת הזרימה הישנה.
  if (page.type === 'endnotes') {
    let titleEl = null;
    if (page.heading) {
      const h = doc.createElement('h2');
      h.className = 'endnote-title';
      h.dir = 'rtl';
      h.textContent = scrubPUAText(page.heading);
      root.appendChild(h);
      titleEl = h;
    }
    const list = doc.createElement('div');
    list.className = 'endnote-list';
    const tplEn = page.template;
    const haveModel = tplEn && Array.isArray(tplEn.columns) && tplEn.columns.length
      && Array.isArray(page.columns) && page.columns.some(c => c.length)
      && page.notes && page.notes.every(n => n.colIdx != null);
    if (haveModel) {
      // **S6.0 (R4-M2 — עוגן מיקום שגוי):** הרשימה הייתה position:relative
      // בזרימה אחרי כותרת ה-h2 ⇒ בלוק ההכלה התחיל ~42px מתחת לראש העמוד
      // בעוד top-ים של ההערות הם קואורדינטות עמוד ⇒ כל ההערות הוסטו ~42px
      // מטה מהמודל/PDF (והאחרונות נחתכו). כעת הרשימה absolute בקואורדינטות
      // העמוד; גם הכותרת ממוקמת מהמודל (ראש תיבת התוכן) ולא בזרימה.
      list.style.position = 'absolute';
      list.style.top = '0';
      list.style.left = '0';
      list.style.right = '0';
      const titleAnchor = titleEl;
      if (titleAnchor) {
        titleAnchor.style.position = 'absolute';
        titleAnchor.style.top = `${Math.round(tplEn.contentBox.top)}px`;
        titleAnchor.style.left = `${Math.round(Math.min(...tplEn.columns.map(c => c.x)))}px`;
        titleAnchor.style.right = `${Math.round(tplEn.width - Math.max(...tplEn.columns.map(c => c.x + c.w)))}px`;
        titleAnchor.style.margin = '0';
      }
      const topEn = tplEn.contentBox.top + (page.titleBandPx || 0);
      const colsEn = page.columns;
      // טור-אחד (endnote-columns=1): רוחב תיבת התוכן המלא — כמו הפרויקטור/PDF
      const singleColEn = colsEn.length === 1;
      const fullL = Math.min(...tplEn.columns.map(c => c.x));
      const fullR = Math.max(...tplEn.columns.map(c => c.x + c.w));
      for (let ci = 0; ci < colsEn.length; ci++) {
        let y = topEn;
        for (const n of colsEn[ci] || []) {
          const col = singleColEn
            ? { x: fullL, w: fullR - fullL }
            : (tplEn.columns[ci] || tplEn.columns[0]);
          const el = doc.createElement('div');
          el.className = 'endnote-note';
          el.dir = 'rtl';
          el.style.position = 'absolute';
          el.style.left = `${Math.round(col.x)}px`;
          el.style.top = `${Math.round(y)}px`;
          el.style.width = `${Math.round(col.w)}px`;
          el.textContent = `${n.marker || ''}\u200F ${scrubPUAText(n.text || '')}`;
          list.appendChild(el);
          y += (n.heightPx || 0);
        }
      }
    } else {
      for (const n of page.notes || []) {
        const el = doc.createElement('div');
        el.className = 'endnote-note';
        el.dir = 'rtl';
        el.textContent = `${n.marker || ''}\u200F ${scrubPUAText(n.text || '')}`;
        list.appendChild(el);
      }
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

/** **S5.2 (תיקון 10 — מוסכמת הגרשיים של הגיליון):** סיומת סמן לפי המוסכמה
 *  שמממש folio.toHebrewNumber/finish: אות בודדת ⇒ אות+גרש (א׳);
 *  שתי אותיות ומעלה ⇒ גרשיים **לפני האות האחרונה** (כ״ג — לא כג׳ הישן).
 *  יישום מקומי בעל אותה צורה (shared-shaped) — בלי ייבוא folio.js
 *  (מניעת תלות decoration↔notes; נבדק — folio.js אינו דורש את markers,
 *  כך שאין מעגל, אבל ההפרדה מונעת תלות עתידית). */
function hebrewMarkFinish(letters) {
  if (letters.length <= 1) return letters + '\u05F3';            // א׳ — גרש
  return letters.slice(0, -1) + '\u05F4' + letters.slice(-1);   // כ״ג — גרשיים לפני האחרונה
}

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
      // **S5.2 (תיקון 10):** בעבר תמיד גרש בסוף (כג׳) — בניגוד למוסכמת
      // הגרשיים של הגיליון. כעת hebrewMarkFinish: א׳/כ״ג.
      return hebrewMarkFinish(s);
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

// **S5.2 (תיקון 11):** splitPlaceholder הוסר — קוד מת מלכודתי: פיצול על ':'
// היה מבתק שעות (12:30) אם אי־פעם היה נעשה בו שימוש חוזר; ה-placeholder
// האמיתי של D-30 משתמש ב-U+E000 (ראה explodePlaceholderWord ב-pipeline).

module.exports = { markerFor, makeCounter, hebrewMarkFinish, HEB_LETTERS, MARK_TAG: '\uE102' };

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
__modules["src/engine/decoration/ornament-ink.js"] = function (require, module, exports) {
// src/engine/decoration/ornament-ink.js — הדיו של העיטורים: מקור יחיד (EXT-4)
'use strict';

/**
 * **EXT-4 (צביעת עיטורים):** עד כאן העיטורים היו rectים נכונים ומבוקרים
 * (ornament-plan) בלי דיו — אין כללי .orn ב-CSS החי ו-pdf-writer לא צייר
 * כלום. כאן מוגדר מקור הדיו היחיד: לכל kindStyle — צורה וקטורית מובנית
 * (פורט מהמקור הצהוב) או SVG מספריית העיצובים (imud:...) או קו דק.
 * שלושת הצרכנים — ה-DOM (רקע data-URI), הפרויקטור וה-PDF (פענוח וקטורי
 * לפעולות מילוי) — שותפים לאותו מקור בדיוק.
 */

const { resolveAssetRef } = require('./asset-registry');

/** הצורות המובנות — פורט נאמן מ-decorations.js של המקור הצהוב:
 * pyramid = פירמידת וילנא (❖❖❖/❖❖/❖ — כאן כיהורים וקטוריים), lance = רומח
 * (spear), shoshanta = שושנתא (flourish), scroll = סלסול (swash). */
const BUILTIN_SVGS = {
  // פירמידת וילנא — 3+2+1 מעוינים; המקור השתמש בגליף ❖ בגדלים 10/9/8pt.
  pyramid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 34">
<path fill="#000" d="M20 2 L28 10 L20 18 L12 10 Z M60 2 L68 10 L60 18 L52 10 Z M100 2 L108 10 L100 18 L92 10 Z"/>
<path fill="#000" d="M40 19 L47 26 L40 33 L33 26 Z M80 19 L87 26 L80 33 L73 26 Z"/>
<path fill="#000" d="M60 24 L66 30 L60 36 L54 30 Z"/>
</svg>`,
  // רומח — פורט מהמקור (SECTION_DIVIDERS.spear) עם עיגולי הפתיחה.
  lance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 40">
<circle cx="200" cy="20" r="10" fill="none" stroke="#000" stroke-width="4.5"/>
<circle cx="200" cy="20" r="4.5" fill="#000"/>
<path d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z" fill="#000"/>
<path d="M165,20 C165,22 150,24 130,24 C95,24 55,21 30,20 C55,19 95,16 130,16 C150,16 165,18 165,20 Z" fill="#fff"/>
<path d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z" fill="#000"/>
<path d="M235,20 C235,22 250,24 270,24 C305,24 345,21 370,20 C345,19 305,16 270,16 C250,16 235,18 235,20 Z" fill="#fff"/>
</svg>`,
  // שושנתא — פורט מהמקור (flourish).
  shoshanta: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90">
<path fill="#000" d="M110,48 C105,44 92,30 82,30 C68,30 55,42 42,42 C30,42 22,32 22,22 C22,12 32,5 45,5 C60,5 72,18 78,28 C82,20 88,10 100,10 C108,10 114,16 114,24 C114,35 102,44 88,44 C72,44 58,35 48,22 C42,28 35,35 25,48 C15,62 10,72 20,82 C30,90 48,85 62,72 C78,58 92,54 110,48 Z"/>
<path fill="#000" d="M130,48 C135,44 148,30 158,30 C172,30 185,42 198,42 C210,42 218,32 218,22 C218,12 208,5 195,5 C180,5 168,18 162,28 C158,20 152,10 140,10 C132,10 126,16 126,24 C126,35 138,44 152,44 C168,44 182,35 192,22 C198,28 205,35 215,48 C225,62 230,72 220,82 C210,90 192,85 178,72 C162,58 148,54 130,48 Z"/>
</svg>`,
  // סלסול — פורט מהמקור (swash).
  scroll: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 28">
<path fill="#111" d="M10,14 C60,14 85,4 125,4 C145,4 152,11 160,17 C168,11 175,4 195,4 C235,4 260,14 310,14 C260,14 235,24 195,24 C175,24 168,17 160,11 C152,17 145,24 125,24 C85,24 60,14 10,14 Z M160,7 C157.2,7 155,9.2 155,12 C155,14.8 157.2,17 160,17 C162.8,17 165,14.8 165,12 C165,9.2 162.8,7 160,7 Z"/>
</svg>`,
  // **D-89 (עיצוב שערים):** גל השער-משנה המובנה של המקור — פורט מדויק
  // מ-defaultSubShaarOrnament ב-decorations.js (רוחב 140px, דיו #222;
  // מדגם הייחוס: מדדנו את הדיו ב-(33,33,33) ≈ #212121 על עמ' 7).
  'shaar-wave': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 30">
<path fill="#222" d="M10,15 Q75,5 140,15 Q145,10 150,5 Q155,10 160,15 Q225,5 290,15 Q225,25 160,15 Q155,20 150,25 Q145,20 140,15 Q75,25 10,15 Z"/>
</svg>`,
  // **D-89 (עיצוב שערים):** עיטור השער הראשי המובנה — פורט מ-defaultShaarMainOrnament
  // (עיגול מוקף בשתי כנפיים, 180×24px). העיגול המקורי מוכתם (stroke) — כאן
  // ממומש כטבעת בשכבות מילוי (שחור→לבן→שחור, סדר ציור = סדר מסמך) — אותו
  // דיו בדיוק במדגם שלנו (חד-כיווני מילוי). מכויל מהייחוס עמ' 1: הדיו ב-x
  // 231.5-363.3pt, y 265-272pt (מרכז 297.4pt = מרכז העמוד).
  'shaar-main-orn': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 40">
<circle cx="200" cy="20" r="12.25" fill="#000"/>
<circle cx="200" cy="20" r="7.75" fill="#fff"/>
<circle cx="200" cy="20" r="4.5" fill="#000"/>
<path fill="#000" d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z"/>
<path fill="#000" d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z"/>
</svg>`,
  // **D-89 (עיצוב שערים):** שרשרת העלים של מסגרת השער הראשי — דפוס הנושא
  // של הייחוס (עמ' 1: פס העלים החוזר בשולי הפאנלים, x≈81-88pt, עלה ≈6.7pt
  // רוחב, מחזור ≈7.8pt). נבנה דטרמיניסטית בטעינת המודול: עלי דפה מחודדים
  // מתחלפים (מעלה/מטה) במפגש בסיס-בבסיס + נקודה בכל צומת, לכל גובה העמוד.
  'shaar-frame-chain': null,
};

/** בניית שרשרת העלים (1122.5px גובה) — נקרא פעם אחת בטעינה.
 * **D-89 (כיול מדוקדק מהייחוס, עמ' 1, רצועה x=73-95pt ב-300dpi):** המוטיב
 * המדויק — אלמנטים רחבים מעוגלים (רימון/עלה, ~26px רוחב × 40px גובה,
 * קודקוד-לקודקוד במפגשי הקצוות) באפור בהיר, עם "עין" עגולה בצבע הפס
 * (#FAFAFA) בכל אלמנט שני. */
function buildShaarFrameChain() {
  // **המוטיב (מפוענח ממפת הדיו של הייחוס ב-ASCII):** יחידה בת ~56px — שתי
  // אונות מעוגלות (שמאל+ימין) שמתמזגות לפס מלא-רוחב, מתחתיו הדיו מתפצל
  // לשתי רגליים המתכנסות לנקודת מרכז, וממנה יורד מעוין מרכזי לקודקוד
  // (שרשרת פלר-דה-ליס); "העין" הלבנה = הרווח בין הרגליים למעוין.
  const W = 30, H = 1122.5, UNIT = 56, cx = W / 2, F = '#D8D8D8';
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`;
  for (let y = 0; y + UNIT <= H + 0.01; y += UNIT) {
    // שתי האונות העליונות
    s += `<ellipse cx="${cx - 7.5}" cy="${y + 9}" rx="5.8" ry="7.5" fill="${F}"/>`;
    s += `<ellipse cx="${cx + 7.5}" cy="${y + 9}" rx="5.8" ry="7.5" fill="${F}"/>`;
    // הפס המלא-רוחב שאליו האונות מתמזגות
    s += `<rect x="2" y="${y + 12}" width="26" height="11" rx="3.5" fill="${F}"/>`;
    // שתי רגליים מתכנסות למרכז (שברון)
    s += `<path fill="${F}" d="M2,${y + 22} L${cx},${y + 37} L28,${y + 22} L28,${y + 27} L${cx},${y + 42} L2,${y + 27} Z"/>`;
    // המעוין המרכזי היורד לקודקוד
    s += `<path fill="${F}" d="M${cx},${y + 35} L${cx + 5.5},${y + 43} L${cx},${y + 52} L${cx - 5.5},${y + 43} Z"/>`;
  }
  return s + '</svg>';
}
BUILTIN_SVGS['shaar-frame-chain'] = buildShaarFrameChain();

/** הדיו של kindStyle — מקור יחיד.
 * @returns {{type:'svg', svg:string, uri:string}|{type:'rule'}|{type:'rect', color:number[]}|{type:'image', uri:string}|null} */
function ornamentInk(kindStyle) {
  const s = String(kindStyle || '');
  if (!s || s === 'none' || s === 'custom_img') return null;
  if (s === 'thin' || s === 'line') return { type: 'rule' };
  // **D-89 (עיצוב שערים):** מלבן בצבע אחיד — rect:<#hex> — רקעי הפאנלים
  // (#F4F4F4 של שער המשנה/האחורי, מסגרות השער הראשי, כלל הכותרת).
  if (s.startsWith('rect:')) {
    const col = parseColor(s.slice(5).trim());
    return col ? { type: 'rect', color: col } : null;
  }
  if (BUILTIN_SVGS[s]) {
    return { type: 'svg', svg: BUILTIN_SVGS[s], uri: svgToDataUri(BUILTIN_SVGS[s]) };
  }
  // הפניית ספריית עיצובים (imud:<collection>:<id>) — ה-SVG החיטוי מהרישום
  if (s.startsWith('imud:') || s.startsWith('data:image/svg') || /\.svg($|\?)/i.test(s)) {
    const r = resolveAssetRef(s);
    if (r && (r.uri || '').startsWith('data:image/svg')) {
      return { type: 'svg', svg: r.item ? r.item.svg : decodeDataUriSvg(r.uri), uri: r.uri };
    }
    if ((r && r.uri || '').startsWith('data:')) return { type: 'image', uri: r.uri };
    return null;
  }
  if (/^https?:|^data:image\/(png|jpe?g|gif|webp)/i.test(s)) return { type: 'image', uri: s };
  return null;
}

/** data-URI ל-SVG (percent-encoding — תואם url("...") ב-CSS). */
function svgToDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(svg));
}
function decodeDataUriSvg(uri) {
  try { return decodeURIComponent(String(uri).replace(/^data:image\/svg\+xml;charset=utf-8,/, '')); }
  catch (e) { return null; }
}

// ---------------------------------------------------------------------------
// פענוח SVG → רשימת ציור (תת-קבוצת ה-SVG שקיימת בפועל בקטלוגים ובצורות):
// viewBox, <g transform="translate(a,b) scale(sx,sy)">, <path d> בפקודות
// M m L l H h V v C c Q q S s T t A a Z, <circle>, <rect>, <ellipse>,
// <polygon>, <polyline>; מילוי בלבד (stroke=none בכל הקטלוג — נבדק).
// ---------------------------------------------------------------------------

/** מפענח מספרים ממחרוזת פקודות נתיב. */
function parsePathD(d) {
  const segs = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m, cmd = null, args = [];
  const flush = () => {
    if (cmd) segs.push({ cmd: cmd.toUpperCase(), rel: cmd !== cmd.toUpperCase(), args });
    cmd = null; args = [];
  };
  while ((m = re.exec(String(d || '')))) {
    if (m[1]) { flush(); cmd = m[1]; }
    else args.push(parseFloat(m[2]));
  }
  flush();
  return segs;
}

/** המרת פקודות נתיב לרצף נקודות/בזייה במרחב ה-viewBox (absolute).
 * @returns {{subpaths: Array<Array<{op:'M'|'L'|'C', pts:number[]}>>, x0:number,y0:number}} */
function pathToSubpaths(d, transform) {
  const segs = parsePathD(d);
  const subpaths = [];
  let cur = null;      // תת-נתיב נוכחי
  let x = 0, y = 0;    // נקודה נוכחית (מרחב מקורי, לפני transform)
  let sx = 0, sy = 0;  // נקודת פתיחה של תת-הנתיב
  let lastC2x = 0, lastC2y = 0, haveLastC = false;
  const push = (op, pts) => {
    if (!cur) { cur = []; subpaths.push(cur); }
    cur.push({ op, pts: transform(pts) });
  };
  const cubicTo = (x1, y1, x2, y2, x3, y3) => { push('C', [x, y, x1, y1, x2, y2, x3, y3]); x = x3; y = y3; };
  const quadTo = (x1, y1, x2, y2) => {
    // Q → שני C (עליית מדרגה הרמיטית)
    const cx1 = x + 2 / 3 * (x1 - x), cy1 = y + 2 / 3 * (y1 - y);
    const cx2 = x2 + 2 / 3 * (x1 - x2), cy2 = y2 + 2 / 3 * (y1 - y2);
    cubicTo(cx1, cy1, cx2, cy2, x2, y2);
  };
  const arcTo = (rx, ry, rot, laf, sf, x2, y2) => {
    // קירוב קשת ב-8 מקטעי בזייה (דיוק חזותי מלא בגדלי עיטור) — endpoint→center
    const x1 = x, y1 = y;
    if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) { push('L', [x1, y1, x2, y2]); x = x2; y = y2; return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = rot * Math.PI / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
    const x1p = cosP * dx2 + sinP * dy2, y1p = -sinP * dx2 + cosP * dy2;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
    let num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num / den));
    if (laf === sf) co = -co;
    const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
    const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
    const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => {
      const dot = ux * vx + uy * vy, len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
      let a = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
      if (ux * vy - uy * vx < 0) a = -a;
      return a;
    };
    const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dTheta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sf && dTheta > 0) dTheta -= 2 * Math.PI;
    if (sf && dTheta < 0) dTheta += 2 * Math.PI;
    const N = 8;
    const delta = dTheta / N;
    const t = theta1;
    let px = x1, py = y1;
    for (let i = 1; i <= N; i++) {
      const t2 = t + delta * i;
      const px2 = cx + rx * Math.cos(t2) * cosP - ry * Math.sin(t2) * sinP;
      const py2 = cy + rx * Math.cos(t2) * sinP + ry * Math.sin(t2) * cosP;
      const tm = t + delta * (i - 0.5);
      const cmx = cx + rx * Math.cos(tm) * cosP - ry * Math.sin(tm) * sinP;
      const cmy = cy + rx * Math.cos(tm) * sinP + ry * Math.sin(tm) * cosP;
      // נקודת בקרה בזייה לקשת מעגלית: k = 4/3·tan(δ/4)
      const k = 4 / 3 * Math.tan(delta / 4);
      const c1x = px + k * (-rx * Math.cos(t + delta * (i - 1)) * sinP - ry * Math.sin(t + delta * (i - 1)) * cosP);
      const c1y = py + k * (rx * Math.cos(t + delta * (i - 1)) * cosP - ry * Math.sin(t + delta * (i - 1)) * sinP);
      const c2x = px2 - k * (-rx * Math.cos(t2) * sinP - ry * Math.sin(t2) * cosP);
      const c2y = py2 - k * (rx * Math.cos(t2) * cosP - ry * Math.sin(t2) * sinP);
      void cmx; void cmy;
      cubicTo(c1x, c1y, c2x, c2y, px2, py2);
      px = px2; py = py2;
    }
  };
  for (const { cmd, rel, args } of segs) {
    const a = args;
    switch (cmd) {
      case 'M':
        for (let i = 0; i + 1 < a.length; i += 2) {
          x = rel ? x + a[i] : a[i]; y = rel ? y + a[i + 1] : a[i + 1];
          if (i === 0) { cur = null; push('M', [x, y]); sx = x; sy = y; }
          else push('L', [x, y, x, y]);
        }
        haveLastC = false;
        break;
      case 'L':
        for (let i = 0; i + 1 < a.length; i += 2) {
          const nx = rel ? x + a[i] : a[i], ny = rel ? y + a[i + 1] : a[i + 1];
          push('L', [x, y, nx, ny]); x = nx; y = ny;
        }
        haveLastC = false;
        break;
      case 'H':
        for (const v of a) { const nx = rel ? x + v : v; push('L', [x, y, nx, y]); x = nx; }
        haveLastC = false;
        break;
      case 'V':
        for (const v of a) { const ny = rel ? y + v : v; push('L', [x, y, x, ny]); y = ny; }
        haveLastC = false;
        break;
      case 'C':
        for (let i = 0; i + 5 < a.length; i += 6) {
          const x1 = rel ? x + a[i] : a[i], y1 = rel ? y + a[i + 1] : a[i + 1];
          const x2 = rel ? x + a[i + 2] : a[i + 2], y2 = rel ? y + a[i + 3] : a[i + 3];
          const x3 = rel ? x + a[i + 4] : a[i + 4], y3 = rel ? y + a[i + 5] : a[i + 5];
          cubicTo(x1, y1, x2, y2, x3, y3);
          lastC2x = x2; lastC2y = y2; haveLastC = true;
        }
        break;
      case 'S':
        for (let i = 0; i + 3 < a.length; i += 4) {
          const x2 = rel ? x + a[i] : a[i], y2 = rel ? y + a[i + 1] : a[i + 1];
          const x3 = rel ? x + a[i + 2] : a[i + 2], y3 = rel ? y + a[i + 3] : a[i + 3];
          const x1 = haveLastC ? 2 * x - lastC2x : x, y1 = haveLastC ? 2 * y - lastC2y : y;
          cubicTo(x1, y1, x2, y2, x3, y3);
          lastC2x = x2; lastC2y = y2; haveLastC = true;
        }
        break;
      case 'Q':
        for (let i = 0; i + 3 < a.length; i += 4) {
          const x1 = rel ? x + a[i] : a[i], y1 = rel ? y + a[i + 1] : a[i + 1];
          const x2 = rel ? x + a[i + 2] : a[i + 2], y2 = rel ? y + a[i + 3] : a[i + 3];
          quadTo(x1, y1, x2, y2);
          lastC2x = x1; lastC2y = y1; haveLastC = false;
        }
        break;
      case 'T':
        for (let i = 0; i + 1 < a.length; i += 2) {
          const x2 = rel ? x + a[i] : a[i], y2 = rel ? y + a[i + 1] : a[i + 1];
          const x1 = haveLastC ? 2 * x - lastC2x : x, y1 = haveLastC ? 2 * y - lastC2y : y;
          quadTo(x1, y1, x2, y2);
          lastC2x = x1; lastC2y = y1;
        }
        break;
      case 'A':
        for (let i = 0; i + 6 < a.length; i += 7) {
          const rx = a[i], ry = a[i + 1], rot = a[i + 2];
          const laf = a[i + 3], sf = a[i + 4];
          const x2 = rel ? x + a[i + 5] : a[i + 5], y2 = rel ? y + a[i + 6] : a[i + 6];
          arcTo(rx, ry, rot, laf, sf, x2, y2);
        }
        haveLastC = false;
        break;
      case 'Z':
        if (cur && cur.length) push('L', [x, y, sx, sy]);
        x = sx; y = sy;
        haveLastC = false;
        break;
    }
  }
  return { subpaths, x, y };
}

/** פענוח SVG שלם → { vbW, vbH, shapes: [{subpaths, fill}] } (מרחב viewBox). */
function parseSvgPaint(svg) {
  const s = String(svg || '');
  if (!s) return null;
  const vb = /viewBox\s*=\s*"([^"]+)"/.exec(s);
  let vbW = 0, vbH = 0;
  if (vb) {
    const p = vb[1].trim().split(/[\s,]+/).map(Number);
    vbW = p[2] || 0; vbH = p[3] || 0;
  }
  const wm = /width\s*=\s*"([\d.]+)/.exec(s), hm = /height\s*=\s*"([\d.]+)/.exec(s);
  if (!vbW && wm) vbW = parseFloat(wm[1]);
  if (!vbH && hm) vbH = parseFloat(hm[1]);
  if (!vbW || !vbH) return null;

  // transform של <g> — תומך ב-translate(a,b) scale(sx,sy) (צורת הקטלוגים)
  let tx = 0, ty = 0, sx = 1, sy = 1;
  const gt = /<g\b[^>]*transform\s*=\s*"([^"]+)"/.exec(s);
  if (gt) {
    const tr = gt[1];
    const tm = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)/.exec(tr);
    if (tm) { tx = parseFloat(tm[1]); ty = parseFloat(tm[2]); }
    const sm = /scale\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\)/.exec(tr);
    if (sm) { sx = parseFloat(sm[1]); sy = sm[2] != null ? parseFloat(sm[2]) : sx; }
  }
  const transform = (pts) => {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      out.push(pts[i] * sx + tx, pts[i + 1] * sy + ty);
    }
    return out;
  };

  const shapes = [];
  const pushShape = (d, fillAttr, strokeAttr) => {
    if (strokeAttr && strokeAttr !== 'none') return; // קווים חיצוניים — מחוץ לתת-הקבוצה (לא קיימים בקטלוג)
    const { subpaths } = pathToSubpaths(d, transform);
    if (!subpaths.length) return;
    shapes.push({ subpaths, fill: parseColor(fillAttr) });
  };

  // <path> — fill מהאלמנט או מה-<g> שעוטף (inherit)
  const gFill = /<g\b[^>]*\bfill\s*=\s*"([^"]+)"/.exec(s);
  const gStroke = /<g\b[^>]*\bstroke\s*=\s*"([^"]+)"/.exec(s);
  const pathRe = /<path\b([^>]*)>/g;
  let m;
  while ((m = pathRe.exec(s))) {
    const attrs = m[1];
    const d = /d\s*=\s*"([^"]+)"/.exec(attrs);
    if (!d) continue;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(attrs);
    const stroke = /stroke\s*=\s*"([^"]+)"/.exec(attrs);
    pushShape(d[1], fill ? fill[1] : (gFill ? gFill[1] : '#000'), stroke ? stroke[1] : (gStroke ? gStroke[1] : 'none'));
  }
  // <circle>/<ellipse> — ארבע קשתות בזייה
  const circRe = /<(circle|ellipse)\b([^>]*)>/g;
  while ((m = circRe.exec(s))) {
    const at = m[2];
    const num = (k) => { const r = new RegExp(`\\b${k}\\s*=\\s*"([\\d.]+)"`).exec(at); return r ? parseFloat(r[1]) : null; };
    const cx = num('cx') || 0, cy = num('cy') || 0;
    const rx = m[1] === 'circle' ? (num('r') || 0) : (num('rx') || 0);
    const ry = m[1] === 'circle' ? (num('r') || 0) : (num('ry') || 0);
    if (!rx || !ry) continue;
    const k = 0.5522847498;
    const d = `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} `
      + `C ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} `
      + `C ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} `
      + `C ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(at);
    const stroke = /stroke\s*=\s*"([^"]+)"/.exec(at);
    pushShape(d, fill ? fill[1] : '#000', stroke ? stroke[1] : 'none');
  }
  // <rect>
  const rectRe = /<rect\b([^>]*)>/g;
  while ((m = rectRe.exec(s))) {
    const at = m[1];
    const num = (k) => { const r = new RegExp(`\\b${k}\\s*=\\s*"([\\d.]+)"`).exec(at); return r ? parseFloat(r[1]) : 0; };
    const x0 = num('x'), y0 = num('y'), w = num('width'), h = num('height');
    if (!w || !h) continue;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(at);
    pushShape(`M ${x0} ${y0} L ${x0 + w} ${y0} L ${x0 + w} ${y0 + h} L ${x0} ${y0 + h} Z`, fill ? fill[1] : '#000', 'none');
  }
  if (!shapes.length) return null;
  return { vbW, vbH, shapes };
}

/** צבע מילוי → [r,g,b] 0..1 ('#abc', '#aabbcc', שמות בסיסיים). */
function parseColor(c) {
  const s = String(c || '').trim();
  if (!s || s === 'none' || s === 'transparent') return null;
  if (s === 'currentColor') return [0, 0, 0];
  let m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  if (m) return [parseInt(m[1] + m[1], 16) / 255, parseInt(m[2] + m[2], 16) / 255, parseInt(m[3] + m[3], 16) / 255];
  m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const named = { black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], blue: [0, 0, 1] };
  if (named[s.toLowerCase()]) return named[s.toLowerCase()];
  return [0, 0, 0]; // ברירת מחדל — שחור (כמו SVG)
}

/** פליטת פעולות PDF לציור העיטור בתוך rect (px, מרחב עמוד) עם התאמת
 * 'meet' (preserveAspectRatio) — מרכז התמונה במרכז התיבה בלי עיוות.
 * @param {object} paint — פלט parseSvgPaint
 * @param {{x,y,w,h}} rectPx — יעד בפיקסלים (שיטת הפרויקטור)
 * @param {number} hPt — גובה העמוד ב-pt (היפוך y)
 * @param {number} PX_TO_PT
 * @returns {string[]} פעולות PDF (m/l/c/h/f + rg) */
function svgToPdfOps(paint, rectPx, hPt, PX_TO_PT) {
  const { vbW, vbH, shapes } = paint;
  // meet: סקייל אחיד מרבי שנכנס, ממורכז
  const s = Math.min(rectPx.w / vbW, rectPx.h / vbH);
  const drawW = vbW * s, drawH = vbH * s;
  const offX = rectPx.x + (rectPx.w - drawW) / 2;
  const offY = rectPx.y + (rectPx.h - drawH) / 2;
  const X = (vx) => (offX + vx * s) * PX_TO_PT;
  const Y = (vy) => hPt - (offY + vy * s) * PX_TO_PT;
  const r2 = (v) => Math.round(v * 100) / 100;
  const ops = [];
  for (const sh of shapes) {
    const col = sh.fill || [0, 0, 0];
    ops.push(`${r2(col[0])} ${r2(col[1])} ${r2(col[2])} rg`);
    for (const sub of sh.subpaths) {
      let started = false;
      for (const seg of sub) {
        const p = seg.pts;
        if (seg.op === 'M') {
          if (started) ops.push('h f');
          ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`);
          started = true;
        } else if (seg.op === 'L') {
          if (!started) { ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`); started = true; }
          ops.push(`${r2(X(p[2]))} ${r2(Y(p[3]))} l`);
        } else if (seg.op === 'C') {
          if (!started) { ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`); started = true; }
          ops.push(`${r2(X(p[2]))} ${r2(Y(p[3]))} ${r2(X(p[4]))} ${r2(Y(p[5]))} ${r2(X(p[6]))} ${r2(Y(p[7]))} c`);
        }
      }
      if (started) ops.push('h f');
    }
  }
  return ops;
}

/** תיבת הדיו **המדויקת** של הצורות הממוקמות בתוך rect (אותה התאמת
 * 'meet' כמו svgToPdfOps) — לחישוב inkBounds של המודל מול הרסטר.
 * @returns {{minX,minY,maxX,maxY}|null} בפיקסלים (מרחב עמוד) */
function svgInkBBox(paint, rectPx) {
  const { vbW, vbH, shapes } = paint;
  const s = Math.min(rectPx.w / vbW, rectPx.h / vbH);
  const drawW = vbW * s, drawH = vbH * s;
  const offX = rectPx.x + (rectPx.w - drawW) / 2;
  const offY = rectPx.y + (rectPx.h - drawH) / 2;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sh of shapes) {
    if (sh.fill == null) continue; // צורה בלי מילוי — אין דיו
    for (const sub of sh.subpaths) {
      for (const seg of sub) {
        const p = seg.pts;
        for (let i = 0; i + 1 < p.length; i += 2) {
          const x = offX + p[i] * s, y = offY + p[i + 1] * s;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
  }
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

module.exports = {
  BUILTIN_SVGS, ornamentInk, svgToDataUri,
  parseSvgPaint, svgToPdfOps, svgInkBBox, parsePathD, pathToSubpaths, parseColor
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
const { MeasureAPI, registeredFonts: registeredMeasureFonts, registerFont: registerMeasureFont, resolveMeasureImpl } = require('../typography/measure-api');
const { EventLog } = require('../core/events');
const { Ledger } = require('../core/ledger');

// ---------- גיאומטריה (px @96dpi; PDF = px×0.75) — מכויל מהייחוס ----------
const GEO = {
  PAGE_W: 793.7, PAGE_H: 1122.5,               // A4
  COL_W: 269.41,                                // רוחב טור (col:right 269 בתגיות המקור)
  COL_R_X: 403.61, COL_L_X: 120.72,             // שפות טורים (ימני/שמאלי)
  MARGIN_R_X: 686.3, MARGIN_L_X: 56.7, MARGIN_W: 50.5, // טורי שוליים (margin-col)
  // **S4.14 (מסומן-גיאומטריה):** ראשית הזרימה האמיתית בעמוד רגיל = 107.2px —
  // נגזר ממחסנית תוויות הייחוס (body-flow label − היסט השכבה) ומהשורה הראשונה
  // הנמדדת בעמודים רגילים (13-15: שורת-גוף ראשונה ב-107.2px בדיוק). הערך
  // הקודם 96.7 היה נמוך ב-10.5px — הזרימה כולה ישבה גבוה מדי.
  FLOW_TOP: 107.2,                              // ראשית זרימת הגוף בעמוד רגיל
  // **S4.14:** גובה הזרימה המקסימלי = 915px — נמדד ישירות מתוויות body-flow
  // של הייחוס בעמודים ללא הערות (13-15: block 914/915, תחתית אמיתית 1022.2).
  // הערך הקודם 925 הכניס שורה עודפת בעמודים ללא הערות (סה"כ +8 שורות במסמך).
  FLOW_H: 915,
  // **S4.13 (פס שורה אמיתי — היסוד לכל הסטייה המצטברת):** המקור מגדיר
  // line-height: var(--line-height-body)=1.34 על 12pt ⇒ 16.08pt = **21.44px**
  // לכל תיבת שורה. הדפדפן שומר את השבר בסכומי ה-DOM (scrollHeight), ורק
  // ההדפסה ל-PDF מצמידה כל שורה לפיקסל שלם — לכן במדידת הייחוס נראים פסים
  // מעורבים 21/22px (15.75/16.5pt, היסטוגרמה: 1277+1101) שהממוצע שלהם 21.44.
  // הקליברציה הקודמת (21 שטוח) חסכה 0.44px לשורה ⇒ 2% קיבולת ⇒ כשורה
  // לטור ⇒ +2 שורות לעמוד — בדיוק הסטייה המצטברת שנצפתה (עמודינו 90-93
  // שורות מול 87-90 בייחוס). כעת: המילוי, הפריסה והמודל כולם ב-21.44.
  LINE_H: 21.44,
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
  // **מגן ספרים גדולים:** מעל 999 — חלק האלפים בגימטריה + גרשיים (לא נצפה
  // בייחוס; מונע undefined ושומר דטרמיניזם — הקורפוס הגדול מגיע ל־~730).
  if (num >= 1000) {
    const th = Math.floor(num / 1000);
    // **S5.2 (אחידות D-31):** גרש עברי (U+05F3) במקום ASCII ' — כמו
    // toHebrewNumber של folio.js (ה׳תש״ב); שני מחלקי המספור במאגר חייבים
    // להסכים על אותו תו.
    return toGematria(th) + '\u05F3' + toGematria(num % 1000);
  }
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
    // **EXT-17 (גדלים נפרדים לסמן הערה/מספור ברשימה/מפריד):** במקור שלוש
    // הגדרות עצמאיות — אצלנו היו נגזרות מגודל הגוף. ברירות המחדל של המקור:
    // ‏8/‏8/'.' (מילה-סמן בגוף, סמן ברשימת ההערות, המפריד אחרי המספר).
    fnMarkerSize: n('note-marker-size', 8),
    fnListingNumSize: n('note-listing-num-size', 8),
    fnNumSeparator: String(g('note-num-separator', '.')),
    // **D-89 (כלל הכותרת התחתון):** hdr-divider-style של המקור (black/gray/none).
    // פרופיל המורשת מכויל לייחוס — שם הכלל נמדד שחור מלא (43,62)-(553,63)pt
    // בכל עמודי הגוף/התוכן; 'none' מבטל.
    hdrDivider: String(g('hdr-divider-style', 'black')),
    // **D-89 (עיצוב שערים):** עיטור שער-המשנה מ-section_dividers.json
    // (shaar-sub-divider; 'none' = גל המובנה של המקור — כמו renderSubShaar).
    shaarSubDivider: String(g('shaar-sub-divider', 'none')),
    // **EXT-19 (כותרות מתחלפות):** החלפת החצאים בעמודים זוגיים (ברירת
    // המחדל במקור: כבוי — שני החצאים קבועים; hdr-title-split כבר ממומש
    // בפיצול שם הספר לחצאים ב-setHeader).
    hdrAlternating: b('hdr-alternating', false),
    hdrRType: String(g('hdr-r-type', 'book_title_split_r')),
    hdrCType: String(g('hdr-c-type', 'h2_without_siman')),
    hdrLType: String(g('hdr-l-type', 'book_title_split_l')),
    gtocShow: imud && 'gtoc-show' in imud ? imud['gtoc-show'] : [1, 2, 3, 4, 5, 6],
    dtocShow: imud && 'dtoc-show' in imud ? imud['dtoc-show'] : [2, 3, 4, 5, 6],
    // **S5.2 (F2 — הערות סיום):** כותרת עמודי הערות-הסיום מהמקור
    // (fn-title-text; ממופה ב-legacy-settings-map ל-endnote-title-text).
    fnTitleText: String(g('fn-title-text', 'הערות'))
  };
}

// ---------- טוקניזציה (כמו performTypeset של המקור) ----------
function tokenizeDoc(rawText, cfg) {
  let text = stripEditorialNotes(rawText);
  const { meta, text: noMeta } = parseMetadata(text);
  text = noMeta;
  const isHeadingLine = (s) => /^כותרת\s*\d/.test(s.trim());
  if (cfg.fnOpen) {
    // **תיקון הדבקת שורת-הערה (נמצא בקורפוס הגדול, 04.11):** בעבר ההדבקה
    // '\s+[' חצתה שורות גם לתוך כותרות — הערה שבאה אחרי 'כותרת 7' נבלעה
    // לתוך הערת-הצד, והערת-צד נוספת שאחריה דרסה אותה סופית (3 הערות אבדו,
    // 1,353 מילים בשימור התוכן). כעת: שורת-הערה נדבקת לפסקה הקודמת **בלבד**
    // (במקור ההדבקה פעלה בתוך בלוק טקסט אחד; כותרת פותחת בלוק חדש);
    // אחרי כותרת היא נשארת פסקה עצמאית — שורת סמן + הערה בתחתית — והתוכן
    // נשמר במלואו. הדבקה בתוך-שורה ('מילה [הערה]') נשמרת כפי שהייתה.
    const esc = cfg.fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const src = text.split('\n');
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const ln = src[i];
      if (out.length && ln.trim().startsWith(cfg.fnOpen)) {
        let j = out.length - 1;
        while (j >= 0 && !out[j].trim()) j--;
        if (j >= 0 && !isHeadingLine(out[j])) {
          out[j] = out[j].replace(/\s+$/, '') + ln.trim();
          continue;
        }
      }
      out.push(ln);
    }
    text = out.join('\n').replace(new RegExp('[ \\t]+(' + esc + ')', 'g'), '$1');
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
        // **תיקון הצטברות הערות-צד (נמצא בקורפוס הגדול):** שתי כותרות 7 בלי
        // פסקה ביניהן (למשל h7 ← h3 ← h7 ← פסקה) — בעבר השנייה דרסה את הראשונה
        // ותוכנה אבד. כעת הן מצטברות; ב-no_long אין אף מקרה כזה (0 סיכון פריטי).
        pendingSideNote = pendingSideNote ? pendingSideNote + ' — ' + txt : txt;
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
  // **S5.2 (מיפוי מוקשים F4):** פלוש שאריות בסוף מסמך — הערת-צד (h7) או
  // הערת-סיום שהמתינו לפסקה שלא באה אבדו בשקט (pendingSideNote/pendingEndNote
  // מעולם לא נצרכו). כעת: הערת-צד זנבורית נשפכת כפסקה גלויה (התוכן נשמר
  // ונראה — עדיף על אובדן), והערת-סיום זנבורית נסגרר לפסקה ריקה הנושאת
  // את ה-endNote (עמודי הערות-הסיום אוספים מהטוקנים ישירות).
  if (pendingSideNote || pendingEndNote) {
    tokens.push({
      id: tokens.length, type: 'p',
      text: pendingSideNote || '',
      sideNote: null, endNote: pendingEndNote,
      syntheticTail: true
    });
  }
  return { meta, tokens };
}

// ---------- שבירת שורות: פורט של getLinesFromParagraph ----------
/**
 * גרידה כמו הדפדפן במקור: מילים נמדדות בגופן הגוף; הערה [...] מוצגת במדידה
 * כ"א" (הסמן); המילה הראשונה בחלון (1.5×) מכווצת את שתי השורות הראשונות;
 * שתי המילים האחרונות קשורות ברווח בלתי-שביר (מניעת מילה יתומה).
 */

/** **D-92 (רווח-ביטחון התאמת-דפדפן — "0 בעיות עימוד" בעין):** התצוגה החיה
 * מרנדרת כל שורה מתוכננת כבלוק עם white-space:normal — הדפדפן רשאי
 * לשבור אותה מחדש. מדידת המנוע (impl B, hmtx אמת) זהה לדפדפן ברמת
 * הגליף, אבל הדפדפן צובר תת-פיקסל (LayoutUnit 1/64px לגליף): שורה
 * שנמדדה בדיוק ברוחב הטור (269.41px, אמ' 46 טור 1) רונדרה בפועל
 * ‏269.4844px — גלישה 0.078px — והדפדפן עטף את מילתה האחרונה לשורה
 * ויזואלית שנייה שחופפת את השורה שמתחתיה (74 שורות כאלה בקובץ הגדול,
 * ‏122 עמודים — נמדד בחי). לכן כל תנאי ההתאמה דורשים רווח-ביטחון: שורה
 * מתקבלת רק אם היא נכנסת ברוחב פחות FIT_EPS. ההצטברות השיטתית
 * (התוצאה תמיד ≤ רוחב הטור פחות אפסילון) מבטיחה שהדפדפן לעולם לא
 * יצטרך לשבור — התוכנית = הרינדור (עקרון התצוגה=הייצוא). */
const FIT_EPS = 0.75; // px — מכסה צבירת תת-פיקסל של עד ~96 גליפים בשורה (96/128)
class LineBreaker {
  constructor(api, cfg, windowApi = null, headingApi = null) {
    this.api = api;
    this.cfg = cfg;
    // **S4.15 (גופן מילת-החלון):** מילת-החלון נמדדת ב-FrankReal-Bold (כמו
    // המקור — .first-word-window{font-family:'FrankReal';font-weight:900}),
    // לא בגופן הגוף. אם לא נרשם — נפילה שקופה לגוף (התנהגות קודמת).
    this.win = windowApi;
    this.winCache = new Map();
    // **S4.26 (גופן כותרות):** כותרות נמדדות ב-DavidLibre-Bold (כמו
    // הרינדור בפועל) — בלי גופן רשום נופלים לגופן הגוף.
    this.hApi = headingApi;
    this.hCache = new Map();
    this.cache = new Map();
  }
  w(text, sizePt) {
    const key = sizePt + '|' + text;
    let v = this.cache.get(key);
    if (v === undefined) { v = this.api.measureTextWidth(text, sizePt, 0); this.cache.set(key, v); }
    return v;
  }
  /** **S4.26:** מדידת כותרת (DavidLibre-Bold) — עם מטמון נפרד. */
  hw(text, sizePt) {
    if (!this.hApi) return this.w(text, sizePt);
    const key = sizePt + '|' + text;
    let v = this.hCache.get(key);
    if (v === undefined) { v = this.hApi.measureTextWidth(text, sizePt, 0); this.hCache.set(key, v); }
    return v;
  }
  /** מדידת טקסט חלון (FrankReal-Bold 1.5×) — עם מטמון נפרד. */
  wWin(text, sizePt) {
    if (!this.win) return this.w(text, sizePt);
    const key = sizePt + '|' + text;
    let v = this.winCache.get(key);
    if (v === undefined) { v = this.win.measureTextWidth(text, sizePt, 0); this.winCache.set(key, v); }
    return v;
  }

  /** מילים למדידה + מילים לפלט + טווחי הערות (אטומיות כמו במקור). */
  splitWords(text, opts) {
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
    // **S6.0 (F4+F15 — מדידת סמן אמיתית):** הסמן שמרונדר בפועל הוא
    // toGematria(num)+'.' בגודל הרישום (8pt, גופן ההערות FRL) — לא 'א' בגודל
    // הגוף. בפרקים עם ≥11 הערות הסמן הדו-תווי רחב מ-'א'@12pt ב-2.5–4.8px
    // (וב-סמני 7 תווים עד ~25px) ⇒ שורות נמדדו צר מהרינדור והדיו גלש מהטור.
    // כעת splitWords מקבל אופציות {markerOf, markerSizePt, markerMeasure}
    // ומודד את הסמן האמיתי בגודלו האמיתי; הרווחים סביב סמן מודבק מדויקים
    // (בעבר נמדר רווח אחד עודף — F15). בלי אופציות — התנהגות 'א' ההיסטורית.
    const markerOf = (opts && typeof opts.markerOf === 'function') ? opts.markerOf : null;
    const markerSzPt = (opts && Number.isFinite(opts.markerSizePt)) ? opts.markerSizePt : null;
    const markerMw = (opts && typeof opts.markerMeasure === 'function') ? opts.markerMeasure : null;
    const bodySzPt = (opts && Number.isFinite(opts.bodySizePt)) ? opts.bodySizePt : null;
    // **S6.0 (F4):** מדידת חלקי הגוף (קידומת/סיומת/רווחים) במודד של הפסקה —
    // גופן הגוף/ההקדמה; הסמן עצמו בגופן ההערות (markerMeasure) בגודל הרישון.
    const bodyMw = (opts && typeof opts.bodyMeasure === 'function') ? opts.bodyMeasure : markerMw;
    const canMeasureMarker = !!(markerOf && markerMw && markerSzPt != null && bodySzPt != null);
    const dispW = new Array(words.length).fill(null); // רוחב מדויק למילים עם סמן
    let noteOrdinal = 0;
    const markerTextOf = () => {
      if (!markerOf) return 'א';
      return LineBreaker.markerWord(markerOf(noteOrdinal), this.cfg.fnNumSeparator);
    };
    const disp = words.map((word, wi) => {
      if (word.startsWith(fnOpen) && word.endsWith(fnClose)) {
        const mText = markerOf ? markerTextOf() : 'א';
        noteOrdinal++;
        if (markerOf && markerMw && markerSzPt != null) dispW[wi] = markerMw(mText, markerSzPt);
        return markerOf ? mText : 'א';
      }
      // **S4.26 (תיקון שורש — סמן מודבק למילה):** הערה המודבקת למילה
      // ('וכו'.[...]') נמדדה כאן כמילה אחת בלי רווח — אבל emitLinesWithMarkers
      // פולט את הסמן כפריט נפרד **עם רווחים** משני צדדיו (כמו בייחוס:
      // 'מחשבת). א. העבודה.') ⇒ השורה המרונדרת רחבה ברווח מהנמדדת וגולשת
      // מהטור (נצפה: 272.5px מול 269.4 — INK_OUTSIDE 3.2px בעמ' 114 של
      // הקובץ הגדול). ההחלפה כוללת את הרווחים — המדידה = הרינדור.
      // **S6.0 (F4+F15):** סמן מודבק — מדידה מפורקת: קידומת@גוף + רווח +
      // סמן@רישון + רווח + סיומת@גוף (בדיוק כמו הרינדור; בעבר ' א ' הוסיף
      // רווח אחד עודף ~4.2px ואת הסמן בגודל הגוף).
      if (canMeasureMarker) {
        const m = word.match(inWord);
        if (m) {
          const full = word.replace(inWord, '\u0001');
          const parts = full.split('\u0001');
          if (parts.length === 2) {
            const mText = markerTextOf();
            noteOrdinal++;
            dispW[wi] = (parts[0] ? bodyMw(parts[0], bodySzPt) + bodyMw(' ', bodySzPt) : 0)
              + markerMw(mText, markerSzPt)
              + (parts[1] ? bodyMw(' ', bodySzPt) + bodyMw(parts[1], bodySzPt) : 0);
            return parts[0] + ' ' + mText + ' ' + parts[1];
          }
        }
      }
      return word.replace(inWord, ' א ');
    });
    const out = words.map(word => word.replace(/\uE000/g, ' '));
    return { words, disp, out, notes, dispW };
  }

  /** החלפת מילת-הערה בסמן הגימטריה (בפלט בלבד). */
  static markerWord(n, sep) { return toGematria(n) + (sep != null ? sep : '.'); }

  /**
   * שבירה גרידה של פסקה.
   * **S4.9 (מדידת סוגריים):** מילים בתוך (...) נמדדות בגודל הסוגריים המוקטן
   * (size-body + s-paren, כלומר 12-2=10pt) — כך פסקאות עם סוגריים אצל המקור
   * מתקצרות בשורות (הרינדור עצמו ב-10pt ממילא).
   * **S4.15 (גופן הקדמה):** measureApi — גופן מדידה חלופי לפסקה זו (גוף
   * ההקדמה מרונדר במקור ב-'Frank Ruhl Libre' 11.5pt — --fn-h0-body — לא
   * בגופן הגוף; הוכח מסימון הייחוס: שורות ההקדמה נשברות בדיוק לפי רוחבי
   * FRL ולא Guttman — שורת 'לבאר… ואיזה' 482.9px בגוף מול 474 ב-FRL).
   * @returns {{lines:Array<{words:string[], window:boolean, heightPx:number}>, hasWindow:boolean, windowWords:string[]|null, notes:Array}}
   */
  breakPara(text, colWidthPx, sizePt, allowWindow, measureApi = null, opts = null) {
    const cfg = this.cfg;
    const mw = measureApi
      ? (t, sz) => measureApi.measureTextWidth(t, sz, 0)
      : (t, sz) => this.w(t, sz);
    const { disp, out, notes, dispW } = this.splitWords(text, opts);
    const spaceW = mw(' ', sizePt);
    // טווחי סוגריים מאוזנים — מילים בתוכם נמדדות בגודל מוקטן
    // **S4.13 (תיקון שורש — זיהוי ברמת תווים כמו findParenMatches במקור):**
    // הזיהוי הקודם (מילה-שמתחילה-ב-( עד מילה-שמסתיימת-ב-)) החמיץ את המקרה
    // הנפוץ 'מחשבת).' — סוגר עם פיסוק אחריו — וכל טווחי הסוגריים בפסקאות
    // כאלה נמדדו בגודל מלא (12pt במקום 10pt) ⇒ שורות קצרות יותר בשבירה
    // מול הייחוס. המקור סופר עומק סוגריים לכל אורך הטקסט (מקונן, חוצה
    // מילים); כאן: מילה שנמצאת בתוך עומק>0 או נוגעת בסוגר — מוקטנת.
    // **S4.16 (סוגריים ברמת תווים — מדידה מעורבת בתוך מילה אחת):** תוחם
    // הסוגריים במקור הוא span על '(…)' **בדיוק** — ואילו תווים מחוץ לטווח
    // בתוך אותה מילה (ה-'.' שב'מחשבת).' למשל) נמדדים בגודל הגוף. ההוכחה
    // מהייחוס (עמ' 11, טור ימין, פסקת 'בחלק המעשה של האיסור'): השורה
    // 'מעשה. … מחשבת). א. העבודה. ב.' נמדדת בדפדפן 269.9px > 269.4 — 'ב.'
    // נדחה לשורה הבאה (כמו בייחוס); במדידת המילה 'מחשבת).' כולה ב-10pt
    // השורה 269.0px ו-'ב.' נכנס — הפרש של 0.5px שהזיז את שבירת הפסקה
    // וגרר דריפט עימוד. כעת כל מילה נמדדת כסכום מקטעים לפי שיוך התו
    // לטווח הסוגריים, והרווח בין מילים הוא בגודל הסוגריים רק כששני
    // קצוות השכנות בתוך הטווח (הרווח בתוך ה-span).
    const parenSize = SZ.body + SZ.parenDelta; // 12-2 = 10pt (קבוע כמו במקור)
    const wordWs = new Array(out.length);
    const wordParen = new Array(out.length);
    const endsInParen = new Array(out.length);
    const startsInParen = new Array(out.length);
    {
      let depth = 0;
      for (let i = 0; i < out.length; i++) {
        const wd = disp[i];
        // **S6.0 (F4):** מילה עם סמן הערה — רוחב מדויק שחושב ב-splitWords
        // (סמן@רישון + רווחים) — עוקף את מדידת הפילוח (שמדדה את הסמן בגודל
        // הגוף/הסוגריים).
        if (dispW && dispW[i] != null) {
          wordWs[i] = dispW[i];
          wordParen[i] = false;
          startsInParen[i] = false;
          endsInParen[i] = false;
          continue;
        }
        let w = 0, seg = '', segParen = false;
        let anyParen = false;
        for (let c = 0; c < wd.length; c++) {
          const ch = wd[c];
          if (ch === '(') depth++;                 // '(' עצמו בתוך ה-span
          const inParen = depth > 0;
          if (inParen) anyParen = true;
          if (c === 0) startsInParen[i] = inParen;
          if (seg === '') { seg = ch; segParen = inParen; }
          else if (inParen === segParen) { seg += ch; }
          else { w += mw(seg, segParen ? parenSize : sizePt); seg = ch; segParen = inParen; }
          endsInParen[i] = inParen;
          if (ch === ')' && depth > 0) depth--;    // ')' עצמו בתוך ה-span
        }
        if (seg) w += mw(seg, segParen ? parenSize : sizePt);
        wordWs[i] = w;
        wordParen[i] = anyParen;
      }
    }
    // **S4.15 (רווחים בתוך סוגריים בגודל הסוגריים):** במקור הסוגריים הן span
    // עם font-size מוקטן — גם הרווחים הפנימיים שלו ב-10pt, לא בגודל הגוף.
    // ההוכחה מהייחוס (הקדמה, פסקה 2): 'שמציאות…התורה) חלק' נכנסת לשורה
    // המוצרת (511.4px) רק כשהרווחים הפנימיים ב-10pt — ברווחי 11.5 השורה
    // גולשת ב-~10px ו-'חלק' נופל לשורה הבאה (בניגוד לייחוס).
    const parenSpaceW = mw(' ', parenSize);
    const spaceBetween = (i, j) => (endsInParen[i] && startsInParen[j]) ? parenSpaceW : spaceW;
    if (!out.length) return { lines: [], hasWindow: false, windowWords: null, notes };

    // חלון מילה-ראשונה: אמדן שורות כמו המדידה הכפולה במקור
    const totalW = wordWs.reduce((a, b) => a + b, 0) + spaceW * Math.max(0, out.length - 1);
    const estLines = Math.max(1, Math.ceil(totalW / colWidthPx));
    const firstHasNote = out.slice(0, Math.min(cfg.dropWordCount, out.length))
      .some(w => w.includes(cfg.fnOpen));
    // **S4.13 (createDropWord של המקור):** פסקה שמתחילה בסוגריים — בלי חלון
    // ("פסקה שמתחילה בסוגריים ( ) — בלי עיצוב מילה ראשונה"). ההוכחה מהייחוס:
    // פסקת "(הדברים פשוטים...)" בהקדמה מודפסת אצל המקור בלי מילת-חלון כלל
    // (כל השורות ברוחב מלא), ואצלנו הופיע "(הדברים" כחלון 1.5× בגודל 17.25.
    const startsWithParen = /^\(/.test(String(text).trim());
    let useWindow = false, windowW = 0, windowWords = null;
    if (allowWindow && !startsWithParen && cfg.dropWordMode === 'window' && estLines >= cfg.dropWordMinLines && !firstHasNote) {
      useWindow = true;
      windowWords = out.slice(0, cfg.dropWordCount);
      // **S4.15:** המדידה בגופן החלון של המקור (FrankReal-Bold @ 900) — הוכח
      // מהייחוס: 116 מילות-חלון בודדות נמדדו מול שבעה מועמדים ו-FrankReal-Bold
      // התאים בשגיאה ממוצעת 0.03px ('וזה' 25.1/25.1, 'אך' 22.0/22.0, 'והיפך'
      // 45.2 — מול 39px בגופן הגוף). רוחב שגוי = גלישה שונה של שתי השורות
      // הראשונות של כל פסקת-חלון = הפרש P7/P6 הדומיננטי.
      // **D-92:** הרווח אחרי מילת-החלון — ברינדור הוא רווח אמיתי בגופן החלון
      // בגודל 1.5× (חלק מה-span, נמדד — לא קבוע 6px) + רווח-ביטחון התאמת-דפדפן.
      windowW = this.wWin(disp.slice(0, cfg.dropWordCount).join(' '), sizePt * 1.5)
        + this.wWin(' ', sizePt * 1.5) + FIT_EPS;
    }

    // **S4.15 (ביטול קשיחת-הזוג ברינדור):** קשיחת שתי המילים האחרונות (nbsp)
    // קיימת בגרסת הארכיון v20.5 בלבד — ה-typesetter הראשי שיצר את הייחוס
    // מרנדר ברווחים רגילים (createDropWord מחבר ב-' ' פשוט; ה-nbsp רק במדידת
    // joinMeasuredLine). ההוכחה מהייחוס: פסקת ההקדמה הראשונה — '…מזה ואיזה'
    // בשורה 2 ו-'מזה.' בשורה 3 — הזוג האחרון דווקא מפוצל, בדיוק כגלישה
    // גרידה חופשית. הקשיחה הוצאה מהרינדור; היא נשארת רלוונטית רק לאמדן
    // השורות במקור (שאינו משפיע על הפלט).
    let flowStart = useWindow ? cfg.dropWordCount : 0;
    // **S6.0 (F1 — בליעת חלון):** פסקה שכל מילותיה נצרכו כחלון
    // (מילה בודדת רחבה מהטור שגורמת estLines≥minLines, או drop-word-count
    // ≥ מספר המילים) — לולאת הזרימה לא רצה כלל, lines=[] ומילות החלון
    // מעולם לא מוצגות (הן נצרפות רק לשורה 0 שאינה קיימת) ⇒ אובדן תוכן
    // מלא של הפסקה. תוקם: במקרה כזה אין חלון — הפסקה ממודדת ומוצגת במלואה.
    if (flowStart >= out.length) {
      useWindow = false; windowW = 0; windowWords = null; flowStart = 0;
    }
    const pairStart = -1; // אין קשיחה ברינדור (הוכחה לעיל)
    const bindPair = false;

    const lines = [];
    let cur = [], curPf = [], curW = 0, lineNo = 0, lastIdx = -1;
    // **S4.24 (דגלי קצה סוגריים לפלט):** startsInParen/endsInParen של כל
    // מילה נשמרים גם על השורה הפלוטה — מקור יחיד לרווח-הסוגריים (10pt)
    // ברינדור ה-DOM ובמקרן ה-PDF; בלעדיהם הרווח בין שתי מילים בתוך (...) רונדר
    // בגודל השורה והשורה גולשת מהטור (נמדד בחי: 4px, עמ' 403).
    let curPs = [], curPe = [];
    const limitOf = () => (useWindow && lineNo < 2) ? colWidthPx - windowW : colWidthPx;

    if (useWindow) {
      // שורות 0–1: החלון בשפה הימנית; הזרימה ברוחב מוקטן. מילות החלון אינן בזרימה.
    }
    for (let i = flowStart; i < out.length; i++) {
      const bindHere = bindPair && i === pairStart; // המילה הלפני-אחרונה — נבדקת עם יורשתה
      const w1 = wordWs[i];
      const spBefore = cur.length ? spaceBetween(lastIdx, i) : 0;
      const w2 = bindHere ? wordWs[i + 1] + spaceBetween(i, i + 1) : 0;
      const addW = spBefore + w1 + (bindHere ? w2 : 0);
      // **D-92:** limitOf() - FIT_EPS — רווח-ביטחון: הדפדפן צובר תת-פיקסל ברינדור
      // ושורה ללא רווח נעטפת בו לשתי שורות ויזואליות החופפות את השורה שמתחת.
      if (cur.length && curW + addW > limitOf() - FIT_EPS) {
        lines.push({ words: cur, parenFlags: curPf, parenStarts: curPs, parenEnds: curPe, window: useWindow && lineNo < 2 });
        cur = []; curPf = []; curW = 0; curPs = []; curPe = []; lineNo++;
      }
      cur.push(out[i]);
      curPf.push(!!wordParen[i]);
      curPs.push(!!startsInParen[i]);
      curPe.push(!!endsInParen[i]);
      curW += (cur.length > 1 ? spaceBetween(lastIdx, i) : 0) + w1;
      lastIdx = i;
      if (bindHere) {
        cur.push(out[i + 1]);
        curPf.push(!!wordParen[i + 1]);
        curPs.push(!!startsInParen[i + 1]);
        curPe.push(!!endsInParen[i + 1]);
        curW += spaceBetween(i, i + 1) + wordWs[i + 1];
        lastIdx = i + 1;
        i++;
      }
    }
    if (cur.length) lines.push({ words: cur, parenFlags: curPf, parenStarts: curPs, parenEnds: curPe, window: useWindow && lineNo < 2 });
    for (const l of lines) l.heightPx = GEO.LINE_H;
    return { lines, hasWindow: useWindow, windowWords, windowW, notes };
  }
}

// =====================================================================
//  הרכבת המסמך — פורט של performTypeset (מבנה, בלוקים, עימוד)
//  מודל: עמוד = מחסנית אנכית של פסים (span של h3) ובלוקים דו-טוריים מאוזנים.
// =====================================================================

const FLOW_BOTTOM = GEO.FLOW_TOP + GEO.FLOW_H; // 1022.2px — תחתית הזרימה האמיתית (עמודים 13-15: block עד 1021)
// **S4.19 (ה-spacer המלא של המקור):** אזור ה-h2 = מרווח-עליון
// 22% × גובה הזרימה (0.22×915=201.3) + סימן (20pt×1.1+6=35.3) + כותרת (27.2)
// + שולי כותרת (20). המדידה מהייחוס (עמ' 24/38 — עמודי h2 ללא הערות): סימן ב-y=307.88px,
// כותרת ב-344.05, תוכן ב-391.45 — בדיוק הנוסחה. **עמ' 11 (עם הערות) נראה נמוך יותר
// כי ה-fn-area מוכנס ל-wrapper לפני הפוטר (insertBefore במקור) ומקטין את ה-flow —
// ה-spacer (flex-basis 22%) מתכווץ ב-0.22×גובה-ההערות וכל אזור ה-h2 זז למעלה**
// (ההוכחה: עמ' 11 — הפרש 22.98px = 0.22×שמורת-הערות 105.3). ההזזה מיושמת
// בסוף מילוי העמוד (הערות ידועות רק אז — כמו ה-relayout של ה-flex במקור).
// הערך הקודם 261.3 כויל מעמ' 11 בלבד — עמודי ה-h2 הרגילים (24/38) שקעו 23px
// וכל הפרקים שאחריהם הוסטו בשורה שלמה.
const H2_AREA_H = 284.25;
// **S4.19:** פטור עמודי h2+span מה-spacer המלא — כיול S4.14 (261.3) נשאר להם.
const H2_SPAN_EXEMPT = (
  (typeof process !== 'undefined' && process.env && process.env.RED_H2_SPAN_EXEMPT) !== '0'
);
// **S4.14:** span 34px + רווח 4px = 38 — נמדד בכל 13 מופעי block-h3-span
// של הייחוס (מרחק תווית-span → תווית-block תמיד 38.0). היה 40 (+2px לכל span).
const H3_SPAN_H = 38;
const H0_AREA_H = 249.2;   // **S4.19:** זרימת ההקדמה מתחילה ב-356.4px — המדידה מהייחוס
// (עמ' 10, שורות ההקדמה 2-3): הייחוס יושב 9.7-10.2px מתחת ל-348 הקודם; גם לדף
// ה-h0 יש spacer (הכותרת ב-309 = 107.2+201.3+0.5) + כותרת (27.2) + שוליים (20)
// ⇒ 309+47.4 = 356.4. הערך הקודם 240.8 השאיר את שורות ההקדמה גבוהות בכ-10px.
const SINGLE_W = 552.3;    // .single-wide-col = 2×269.41+13.48 (grid)
// **S4.13:** פס שורת ההקדמה — אותו line-height של הגוף (1.34) על 11.5pt
// ⇒ 15.41pt = 20.55px. מדידת הייחוס בעמוד ההקדמה: פסים 15.0–16.3pt (ממוצע 20.5px
// לפני הצמדת ההדפסה). הערך הקודם (22.2 = ×1.45) היה קליברציה שגויה שדחפה
// את שורות ההקדמה והזיזה את נקודות החיתוך שלה (נצפה ב-P7: שורות ההקדמה
// הראשונות שנותרו שונות אחרי תיקון LINE_H).
const H0_LINE_H = 20.55;
const TOC_TITLE_BLOCK_H = 213;
// **S4.14:** גיאומטריית עמודי תוכן-העניינים — אבסולוטית ונפרדת מזרימת הגוף
// (השורה הראשונה בעמודי ה-TOC של הייחוס ב-113.6px, לא ב-FLOW_TOP). הערכים
// שומרים על המיקומים הקודמים המכוילים (96.7+213+61 / 96.7+17 / 1011.7−6).
const TOC_FIRST_TOP = 370.7;
const TOC_CONT_TOP = 113.7;
const TOC_STRETCH_BOTTOM = 1005.7;

// =====================================================================
// **S4.17 — יישור תחתית עמוד + משיכת זנב-יתום (העתק נאמן מ-v21-glm).**
// הייחוס (דוגמא מגרסא ישנה) יוצר ב-v21-glm ע"י מנוע שכולל מערכת מתיחה/כיווץ
// שחסרה בפורט שלנו: בסוף כל עמוד שהפרק ממשיך אחריו רצים stretchPageToBottom
// (מתיחת הבלוק האחרון עד תחתית שטח הגוף) ואז tryReclaimOrphanTail — משיכת
// זנב פסקה יתום של 1-2 שורות חזרה לעמוד ע"י כיווץ עדין של הטור השמאלי.
// ההוכחה מהייחוס עצמו (בלי עיניים): היסטוגרט הפסים של הייחוס מכילה זנב של
// ~230 פסים ב-23-24.4px (= בסיס 21.44 + עד 3px מתיחה — JUSTIFY_MAX_LH_EXTRA)
// ו-74 זוגות פסים ב-19-20px (= בסיס 21.44 − עד 2px כיווץ — ALLOW_BELOW_BASE),
// וקטעי הכיווץ מתחילים תמיד בפסקאות הראשונות של הטור (compressColumnBy
// מחלק לפי הסדר). זו בדיוק הסיבה שעמודי הייחוס מכילים 1-2 שורות יותר
// בנקודות החיתוך — הפערים שנצפו כ-delete+insert שכנים ב-P7.
// =====================================================================
const PAGE_STRETCH_MAX = 48;      // v21: תקרת מתיחת הבלוק האחרון בעמוד (px)
const JUSTIFY_MAX_GAP = 9;        // v21: תקרת ריווח (padding) שמתווסף אחרי פסקה
const JUSTIFY_MAX_LH_EXTRA = 3;   // v21: תקרת תוספת גובה-שורה במתיחת עמוד (px)
const ORPHAN_RECLAIM_BUFFER = 12; // v21: באפר "חירום" בתחתית העמוד למשיכת יתום
const RECLAIM_BELOW_BASE = 2;     // v21: היתר כיווץ מתחת לבסיס לשורה (px)
// **S4.18:** רצפת מרווח-הפסקה בכיווץ משיכת-יתום — נמדד מהייחוס (עמ' 14 שמאל:
// מרווחי פסקה 22.4-24.4px ⇒ gap 1-3px; הרצפה 2). דריסה: RED_GAP_COMPRESS_FLOOR.
const GAP_COMPRESS_FLOOR = parseFloat(
  (typeof process !== 'undefined' && process.env && process.env.RED_GAP_COMPRESS_FLOOR) || '2'
);
// **S4.17 (כיוול מהייחוס):** גג הכיווץ-מתחת-לבסיס למשיכת יתום. ההוכחות מהייחוס:
// עמ' 14 שמאל — המשיכה הצליחה עם כיווץ של ~20px (19.9 נדרשו); עמ' 15 שמאל —
// משיכה שדרשה ~44px כיווץ **נכשלה** במקור (הזנב עבר לעמ' 16 למרות שהקיבולת
// הנומינלית 2px×44 שורה הספיקה); עמ' 20 שמאל — כיווץ ~26-34px הצליח. כלומר
// המנוע שייצר את הייחוס מגביל את הכיווץ בפועל לסדר ~30px לעמוד, לא לקיבולת
// המלאה. הקבוע מכויל לכך (ניתן לדריסה סביבתית לניסויים: RED_RECLAIM_COMPRESS_MAX).
const RECLAIM_COMPRESS_MAX = parseFloat(
  (typeof process !== 'undefined' && process.env && process.env.RED_RECLAIM_COMPRESS_MAX) || '0'
);
// **S4.17 (מתג ראשי):** כל מנגנון המתיחה/המשיכה כבוי כברירת מחדל — opt-in
// מפורש בלבד (RED_ENABLE_STRETCH_RECLAIM=1). סיבה: הנתיב החי של האפליקציה
// מעמד במדידת טבלאות (794 עמודים ל-very_long מול 678 במדידת גופן-אמת)
// ולכן מגיע למצבי עמוד שבהם המתיחה/המשיכה כן נורות גם כשגג הכיווץ 0 —
// והן עלולות להוציא שורות מתיבת הטור ב-DOM (LINE_BELOW_COLUMN באודיט
// החי, עמ' 192/439). עד שרעש המילוי ייסגר והכיוול ייעשה — המנגנון מופעל
// רק בניסויים מפורשים.
const STRETCH_RECLAIM_ENABLED = (
  (typeof process !== 'undefined' && process.env && process.env.RED_ENABLE_STRETCH_RECLAIM === '1')
);
// **S4.19 (מודל ההתאמה של ה-DOM — השלמת שרשרת הראיות של S4.16/S4.18):**
// המקור בודק התאמה ב-computeBestFitLine דרך `targetCol.scrollHeight <=
// remPageHeight - reservedNow(txt)` — scrollHeight/clientHeight הם **שלמים**
// (קוונטיזציה של הדפדפן), והגובה הנמדד כולל את margin-bottom:7px של
// הפסקה הנבדקת עצמה (p{margin-bottom:7px} ב-CSS המקור; הטור הוא פריט-גריד
// = הקשר פורמט עצמאי, השוליים אינם קורסים החוצה). ההוכחה מהייחוס:
// תחתיות התוכן של 88 הטורים בעמודי הגוף אינן עולות על ~1015.2px
// (bbox) — כלומר line-box+margin ≤ 1022.2 — בעוד שהמודל האריתמטי המדויק
// שלנו (בלי המרווח) מגיע עד 1022.2 בפועל (עמ' 11/12/30 אצלנו) — הפרש
// שיטתי של 7px ≈ שליש שורה לטור, שהוא בדיוק "רעש הגבול" שנמדד ב-S4.18.
// דריסות לניסויים: RED_FIT_MODEL=dom (ברירת המחדל להלן), RED_FIT_ROUND=
// round|floor|ceil (כיוון הקוונטיזציה), RED_FIT_MARGIN (ברירת מחדל 7).
const FIT_MODEL = (
  (typeof process !== 'undefined' && process.env && process.env.RED_FIT_MODEL) || 'dom'
);
const FIT_ROUND = (
  (typeof process !== 'undefined' && process.env && process.env.RED_FIT_ROUND) || 'round'
);
const FIT_MARGIN = parseFloat(
  (typeof process !== 'undefined' && process.env && process.env.RED_FIT_MARGIN) || '7'
);
const snapPx = (x) => (
  FIT_ROUND === 'floor' ? Math.floor(x) : FIT_ROUND === 'ceil' ? Math.ceil(x) : Math.round(x)
);
// ברירת המחדל 0 (רדום): הסריקה האמפירית (cap=0/12/20/30/45/100) הראתה שכל
// גג > 0 מפעיל משיכות בנקודות שבהן המקור לא ביצע אותן — כי המילוי שלנו שונה
// ב±1-2 שורות לעמוד משל המקור (רעש תת-פיקסל של הדפדפן; ראה טבלת 67 הטורים
// ב-S4.17), ולכן המשיכות מחריפות את ההסט במקום לצמצמו (P7: ‏0.9451→0.9279).
// cap=0 הוכח זהה-ביטים לפני הפורט בשני הקורפוסים (legacy-33a08 ל-no_long,
// legacy-89678 ל-very_long) — המנגנון במקום לצורך כיוול עתידי אחרי סגירת
// רעש המילוי, ואינו משנה כלום עד אז (דריסה: RED_RECLAIM_COMPRESS_MAX).

/** גובה פריט כותרת inline (h4/h5/h6) בטור — גודל×1.45.
 * **S4.14 (מדידה שיטתית מעוגני הייחוס):** מרחק תווית-hN → עוגן הפסקה הבא
 * באותו טור, על פני כל המסמך: h4=24-25px (32 מדידות; 12.5pt), h5=22px
 * (7 מדידות; 11.5pt), h6=20px (5 מדידות; 10.5pt) — כלומר גודל×1.45 בדיוק
 * (24.2/22.2/20.3). הנוסחה הקודמת ×1.22+6 נתנה 26.3/24.7 — גבוהה ב-2 עד 2.5px
 * לכל כותרת, והפער הצטבר לשורה שלמה בעמודים עם כותרות מרובות. */
function headingItemH(level) {
  const sz = ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[level] || SZ.body;
  return sz * (96 / 72) * 1.45;
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
    // **D-92:** רווח-ביטחון התאמת-דפדפן (הערות השוליים מרונדרות מחדש ב-DOM).
    if (cur.length && curW + add > widthPx - FIT_EPS) { lines.push(cur.join(' ')); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

/** **S4.26 (דיווח משתמש 05.11 — "טקסט מוסגר ממוקם גבוה")**: הפרש הבסיס שמרכז
 * אנכית טקסט-סוגריים מוקטן מול טקסט השורה המארח — מרכז גובה האחד מותאם
 * למרכז גובה השני. מודל תיבת השורה של המנוע (baselineOf): גובה התוכן
 * = (ascent+0.2)·גודל ⇒ מרכז הגובה יושב (ascent−0.2)/2·גודל מעל הבסיס;
 * הפרש המרכזים בין גוף לסוגריים = (ascent−0.2)·(S_host−S_paren)/2.
 * (בעבר הוגבה הסוגריים בעיוורון ב-0.33×גודל-השורה ≈ 5.3px — הרבה מעל
 * המרכוז; עכשיו ≈ 0.7px בלבד.) */
function parenCenterRaisePx(ascentEm, hostPt, parenPt) {
  const a = (Number.isFinite(ascentEm) && ascentEm > 0.1) ? ascentEm : 0.80;
  return Math.max(0, (a - 0.2) * (hostPt - parenPt) * (96 / 72) / 2);
}

/**
 * legacyTypeset — הנתיב החי לפרופיל IMUD (התנהגות המקור = המפרט).
 */
function legacyTypeset(rawText, settings, env) {
  const cfg = readConfig(settings._imudRaw || {});
  // **S4.24 (ייבוא ברירות המחדל של המקור למדיניות הערות-שוליים):** המדיניות
  // נקראת מההגדרות הממוזגות ונופלת ל-_imudRaw (default_settings.json של
  // המקור — 264 המפתחות, כולל fn-bar-max-height-px=220) ואז לברירת המחדל
  // של המקור. block ⇒ תקרת מרזב; continuous ⇒ ללא תקרה (D-34, כמו dp-planner).
  // split ⇒ החלק הראשון במרזב העמוד, השאר לראש תור העמוד הבא עם '(המשך)'.
  const rawSet = settings._imudRaw || {};
  const fnSet = (k, d) => (settings[k] != null ? settings[k] : (rawSet[k] != null ? rawSet[k] : d));
  // **S4.26 (דיווח משתמש 05.11 — בעיות 3–5 בהערות השוליים):**
  // (א) תקרת המרזב: ברירת המחדל עוברת מ-220px הקבוע ל**קיבולת העמוד
  //     המלאה** ("הערות ארוכות... לא ממלאות את כל גובה העמוד הקיים, ובעקבות
  //     כך עוברות לעמוד שלישי") — הערה ארוכה ממלאת את העמוד עד תומו לפני
  //     שהיא נחתכת. התקרה שומרת תמיד שורת-גוף אחת לפחות בעמוד פתיחה רגיל
  //     (FLOW_H − 38.5 − שורת-גוף) — ערך מפורש בהגדרה נחתם לטווח הבטוח.
  // (ב) מצב continuous כברירת מחדל ("הערה הבאה מתחילה מיד באותה שורה שהסתיימה
  //     הערה קודמת") — גם בו יש תקרה (בעבר היה אינסוף ⇒ חריגה מהעמוד).
  // (ג) מספור פר-פרק ("איפוס מספרי הערות בכל פרק (כותרת 2) ולא בכל עמוד")
  //     — fn-reset-mode=siman; page שומר על ההתנהגות ההיסטורית.
  const FN_BODY_LINE_PX = SZ.body * (96 / 72) * 1.34; // 21.44 — שורת גוף אחת
  const FN_FULL_CAP_PX = Math.max(
    GEO.FN_PITCH,
    Math.floor((GEO.FLOW_H - 38.5 - FN_BODY_LINE_PX) / GEO.FN_PITCH) * GEO.FN_PITCH
  );
  const fnLayoutMode = String(fnSet('fn-layout-mode', 'continuous'));
  const fnPolicy = String(fnSet('long-footnote-policy', 'split'));
  const fnResetMode = String(fnSet('fn-reset-mode', 'siman'));
  const fnBarMaxRaw = Number(fnSet('fn-bar-max-height-px', 0));
  const fnBarMax = (Number.isFinite(fnBarMaxRaw) && fnBarMaxRaw > 0)
    ? Math.min(fnBarMaxRaw, FN_FULL_CAP_PX) : FN_FULL_CAP_PX;
  const fnSplitEnabled = fnPolicy === 'split';
  // **S4.24 (שימור תוכן):** המשכי הערות שנקצצו בתקרת המרזב — ברמת ה-typeset
  // (חוצה עמודים ומקטעים); לעולם לא מאבדים שורת הערה.
  const pendingFootnotes = [];
  // **S4.26 (מספור פר-פרק):** מונה רץ בתוך הפרק; נשמר במפה כדי שהסמן בגוף
  // והסמן ברישום יהיו זהים גם כשהפסקה חוצת-עמודים מציגה את ההערה שוב.
  // איפוס בכל פתיחת מקטע h2/h0 (ראה flowSection).
  let fnChapterCounter = 0;
  const fnNoteNumbers = new Map(); // noteText -> מספר בפרק הנוכחי
  // **EXT-13:** גופן רשום ⇒ מדידת אמת גם ברירת מחדל 'table' (live==ייצוא).
  const impl = resolveMeasureImpl(settings);
  // **S4.13 (רישום גופן הערות-הצד):** הקריאה יכולה לספק את בתי הגופן
  // (env.marginFontBytes) — נרשם כאן פעם אחת; הגלישה מידדת במטריקות שלו.
  if (env && env.marginFontBytes && !registeredMeasureFonts.has('Hadassah Friedlaender')) {
    registerMeasureFont('Hadassah Friedlaender', env.marginFontBytes);
  }
  // **S4.15 (גופן מילת-החלון — FrankReal-Bold):** env.windowFontBytes נרשם
  // כאן (נתיב הפריטה/הייצוא); באפליקציה החיה הגופן נרשם דרך register-font
  // תחת השם 'FrankReal' — שני הנתיבים מזוהים כאן. בלי גופן רשום: המדידה
  // נופלת לגופן הגוף (התנהגות קודמת, בדיקות קיימות לא נשברות).
  if (env && env.windowFontBytes && !registeredMeasureFonts.has('FrankReal-Bold')) {
    registerMeasureFont('FrankReal-Bold', env.windowFontBytes);
  }
  // **S4.26 (דיווח משתמש 05.11 — "האתר לא משתמש בגופני ברירת המחדל"):** גופן
  // הכותרות של המקור בפועל — DavidLibre-Bold (הוכח מהייחוס: כל שורות
  // הכותרות/ה-TOC ב-DavidLibre-Bold; המחסנית 'AlphaBlack','David Libre'
  // נפלה אצל המשתמש המקורי ל-David Libre — והכותרות מודגשות). הכותרות
  // נמדדות במטריקות שלו (שבירת כותרות ארוכות) ומרונדרות בו (bold 700).
  if (env && env.headingFontBytes && !registeredMeasureFonts.has('DavidLibre-Bold')) {
    registerMeasureFont('DavidLibre-Bold', env.headingFontBytes);
  }
  // **S4.15 (גופן ההקדמה — Frank Ruhl Libre 11.5pt):** גוף ההקדמה במקור
  // (--fn-h0-body) מרונדר ב-'Frank Ruhl Libre', לא בגופן הגוף — הוכח
  // מסימון הייחוס: אילוצי שבירת שורות ההקדמה מתקיימים ברוחבי FRL
  // (שורת 'לבאר… ואיזה' נכנסת ב-474px ב-FRL מול 482.9px בגוף — והייחוס
  // הכניס אותה). באפליקציה החיה הגופן נרשם דרך register-font (המשפחה
  // 'Frank Ruhl Libre' בקטלוג). בלי גופן רשום — נפילה לגופן הגוף.
  if (env && env.prefaceFontBytes && !registeredMeasureFonts.has('Frank Ruhl Libre')) {
    registerMeasureFont('Frank Ruhl Libre', env.prefaceFontBytes);
  }
  let prefaceApi = null;
  let fnApi = null; // **S4.15:** גוף ההערות — FRL 8.5pt; נפילה לגוף אם לא נרשם
  if (impl === 'font-metrics' && registeredMeasureFonts.has('Frank Ruhl Libre')) {
    prefaceApi = new MeasureAPI(
      { 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.h0Body, 'body-line-height': 1.45 },
      'font-metrics'
    );
    // **S4.15 (גופן גוף ההערות):** --fn-note-body של המקור = 'Frank Ruhl
    // Libre' 8.5pt — לא גופן הגוף. הוכחה מהייחוס: ההערה הארוכה של עמ' 11
    // ('חלוקת המלאכות…') — הייחוס שובר את השורה לפני 'כלולה' ואנחנו אחרי
    // ('…בדבר' / 'כלולה ההוצאה…') — הפרשי רוחב FRL מול גוף. אותו גופן
    // כמו ההקדמה — אותו API עם גודל שונה.
    fnApi = new MeasureAPI(
      { 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.fnBody, 'body-line-height': 1.5 },
      'font-metrics'
    );
  }
  const api = new MeasureAPI(settings, impl);
  if (!fnApi) fnApi = api; // בלי FRL רשום — הערות בגופן הגוף (התנהגות קודמת)
  let windowApi = null;
  const windowFontName = registeredMeasureFonts.has('FrankReal-Bold') ? 'FrankReal-Bold'
    : (registeredMeasureFonts.has('FrankReal') ? 'FrankReal' : null);
  if (impl === 'font-metrics' && windowFontName) {
    windowApi = new MeasureAPI(
      { 'body-font': windowFontName, 'body-font-size-pt': SZ.body, 'body-line-height': 1.34 },
      'font-metrics'
    );
  }
  // **S4.26:** מדידת כותרות ב-DavidLibre-Bold (כמו הרינדור) — בלי גופן
  // רשום נופלים לגופן הגוף (התנהגות קודמת, מתועדת).
  let headingApi = null;
  if (impl === 'font-metrics' && registeredMeasureFonts.has('DavidLibre-Bold')) {
    headingApi = new MeasureAPI(
      { 'body-font': 'DavidLibre-Bold', 'body-font-size-pt': SZ.body, 'body-line-height': 1.34 },
      'font-metrics'
    );
  }
  // **S4.13 (גופן הערות-צד — כמו המקור):** הערות הצד מודפסות בגופן
  // HadassahFriedlaender (מוכח מהייחוס: שורות השוליים sz=6 בפונט
  // 'HadassahFriedlaender', לא GuttmanRashi). הגלישה שלהן חייבת למדוד
  // במטריקות שלו — בגופן הגוף הרוחבים שונים והשבירה מתפצלת אחרת
  // (נצפה: 'מכלל ימי השבת,' 47.2px בגוף מול 52.5px ב-Hadassah — הייחוס
  // שובר אחרי 'מכלל ימי'). אם הגופן לא נרשם — נפילה שקופה לגופן הגוף.
  let marginApi = api;
  if (impl === 'font-metrics' && registeredMeasureFonts.has('Hadassah Friedlaender')) {
    marginApi = new MeasureAPI(
      { 'body-font': 'Hadassah Friedlaender', 'body-font-size-pt': SZ.marginNote, 'body-line-height': 1.2 },
      'font-metrics'
    );
  }
  const brk = new LineBreaker(api, cfg, windowApi, headingApi);
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
  // **S5.2 (מיפוי מוקשים F3):** סעיף שנפתח ב-newPage (h0/h2 פותח עמוד) אך לא
  // קיבל אף token אחריו — בעבר לא נדחף כלל: הכותרת אבדה (לא נוצר עמוד שער
  // לפרק) ושורת תוכן-העניינים שלו קיבלה folio ריק. כעת הסעיף נדחף גם ריק —
  // עמוד הפתיחה נבנה עם הכותרת בלבד.
  if (cur.tokens.length || cur.newPage) sections.push(cur);

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
      sideNotes: [], // **תיקון S4.10:** חוזה התוצאה — dp-planner.layoutHash ו-serialize
      // קוראים p.sideNotes.length גם על תוצאות מורשת (בלי זה ה-worker קורס
      // והאפליקציה החיה מציגה 0 עמודים — נמצא בביקורת הדפדפן).
      fnSep: false, toc: null, _metadata: meta,
      // **S4.26:** ascentEm של גופן המדידה — למרכוז האנכי של טקסט-הסוגריים
      // ברינדור ה-DOM (אותו מודל תיבת-שורה כמו baselineOf של המקרן).
      ascentEm: api.ascentEm(),
      // **S4.10:** תבנית מלאה — גם צרכני DP (כגון הקרנות/בדיקות) שקוראים
      // template.columns/contentBox.height לא יקרסו על תוצאת מורשת.
      template: {
        width: GEO.PAGE_W, height: GEO.PAGE_H,
        columns: [{ x: GEO.COL_R_X, w: GEO.COL_W }, { x: GEO.COL_L_X, w: GEO.COL_W }],
        gutter: 13.48,
        contentBox: { top: GEO.FLOW_TOP, bottom: FLOW_BOTTOM, height: GEO.FLOW_H }
      }
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
    // **D-89 (עטיפת שורות שער):** במקור תיבות השער הן div-ים ברוחב קבוע —
    // טקסט ארוך נעטף אוטומטית. כאן השורה נמדדת ונחתכת לשורות במקום לגלוש
    // מהתיבה (כותרת-המשנה של השער בקורפוס ההשוואה רחבה מהתיבה במדידת
    // Frank Ruhl ונחתכה בקצה הדף). מפגש שורות: גובה שורה = גודל×1.3.
    const wrapGate = (text, sizePt, boxWpx) => {
      const words = String(text || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let cur = '';
      for (const w of words) {
        const cand = cur ? cur + ' ' + w : w;
        // **S6.0 (F9):** רווח-ביטחון FIT_EPS גם כאן — הנקודה היחידה בקובץ שלא
        // הייתה מוגנת מצבירת תת-פיקסל של הדפדפן (D-92) — שורת שער בגבול
        // תיעטף בדפדפן ותחפוף את שורת השער שמתחתיה.
        if (!cur || api.measureTextWidth(cand, sizePt, 0) <= boxWpx - FIT_EPS) cur = cand;
        else { lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      return lines;
    };
    if (type === 'shaar-main') {
      // **D-89:** צבעי הייחוס — הכותרת/המהדורה/המחבר ב-#0F172A (נמדד בעמ' 1,
      // 46pt/11pt/15pt), הנושא והתיאור ב-#0F1749 (מצוירים שם כקטועים).
      const out = [{ text: meta.bookTitle || '', sizePt: 46, y: pt(128.1), color: [15 / 255, 23 / 255, 42 / 255] }];
      const mainBoxW = GEO.PAGE_W - 30 * (96 / 25.4);
      wrapGate(meta.subject, 21, mainBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 21, y: pt(225.2) + i * 21 * (96 / 72) * 1.3,
        color: [15 / 255, 23 / 255, 73 / 255]
      }));
      wrapGate(meta.desc, 12, mainBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 12, y: pt(410.3) + i * 12 * (96 / 72) * 1.3,
        color: [15 / 255, 23 / 255, 73 / 255]
      }));
      out.push({ text: meta.edition || '', sizePt: 11.5, y: pt(558.0), singleOp: true, color: [15 / 255, 23 / 255, 42 / 255] });
      out.push({ text: meta.author || '', sizePt: 15, y: pt(713.5), singleOp: true, color: [15 / 255, 23 / 255, 42 / 255] });
      return out.filter(g => g.text);
    }
    if (type === 'shaar-back') {
      // **S6.0 (F8 — עטיפת שער-אחורי):** שדות השער האחורי לא נעטפו מעולם —
      // שורת זכויות/הוצאה/קשר ארוכה גלשה עד 1,754px מחוץ לעמוד (נמדד).
      // כעת נעטפות ברוחב תיבת השער (378px — כמו תיבת המשנה של שער-המשנה)
      // בפסים של גודל×1.3 — אותו דפוס wrapGate של שאר שורות השער.
      const backBoxW = GEO.PAGE_W - 110 * (96 / 25.4);
      const out = [];
      if (meta.copyright) out.push({ text: 'כל הזכויות שמורות', sizePt: 13.5, y: pt(191.8), color: [17 / 255, 17 / 255, 17 / 255] });
      wrapGate(meta.copyright, 10, backBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 10, y: pt(216.4) + i * 10 * (96 / 72) * 1.3, color: [34 / 255, 34 / 255, 34 / 255]
      }));
      wrapGate(meta.publisher, 11, backBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 11, y: pt(357.3) + i * 11 * (96 / 72) * 1.3, color: [30 / 255, 58 / 255, 138 / 255]
      }));
      wrapGate(meta.contact, 10, backBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 10, y: pt(500.9) + i * 10 * (96 / 72) * 1.3, color: [51 / 255, 65 / 255, 85 / 255]
      }));
      wrapGate(meta.extra, 9.5, backBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 9.5, y: pt(644.3) + i * 9.5 * (96 / 72) * 1.3, color: [100 / 255, 116 / 255, 139 / 255]
      }));
      return out.filter(g => g.text);
    }
    if (type === 'shaar-sub' && h1Token) {
      const parts = h1Token.text.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
      const first = parts[0] || h1Token.text;
      const rest = parts.slice(1).join(' - ');
      // **D-89:** כותרת השער ב-#0F172A — נמדד בייחוס עמ' 7 (36pt); המשנה שחורה
      // (21pt) ונעטפת לרוחב תיבת השער (378px) כמו ה-div במקור.
      const subBoxW = GEO.PAGE_W - 110 * (96 / 25.4);
      const out = [{ text: first, sizePt: 36, y: pt(345.7), color: [15 / 255, 23 / 255, 42 / 255] }];
      wrapGate(rest, 21, subBoxW).forEach((l, i) => out.push({
        text: l, sizePt: 21, y: pt(469.7) + i * 21 * (96 / 72) * 1.3
      }));
      return out.filter(g => g.text);
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
    // **S4.26 (איפוס מספור פר-פרק):** כל פתיחת מקטע h2/h0 פותחת ספירה חדשה
    // (דיווח משתמש: "איפוס מספרי הערות בכל פרק (כותרת 2) ולא בכל עמוד").
    // מצב page שומר על המספור העמודי ההיסטורי; continuous אינו מאפס לעולם.
    if ((isH0 || isH2) && fnResetMode === 'siman') {
      fnChapterCounter = 0;
      fnNoteNumbers.clear();
    }
    // **S4.24 (תיקון שורש חפיפות גוף/הערות):** paraNotes ו-tokPages עברו
    // להיקף ה**מקטע** (היו per-page). פסקה שנחתכה בין עמודים חוזרת
    // לעמוד הבא עם pending — אבל requeueParaNotes שלה מצא מפה ריקה
    // וההערה נכנסה לתור רק בזמן הפליטה (אחרי בדיקת ההתאמה!) — הגוף
    // מולא עד תחתית הזרימה בלי תקציב, ואזור ההערות נבנה מעליו. נמדד
    // במודל: 50 עמודים עם חפיפה עד 675px. עכשיו ההערות של המשך-פסקה
    // נכנסות לתור **לפני** המילוי — כמו התקציב-המוקדם של פסקה חדשה
    // (וכמו שהמקור מתנהג: התקציב מצטמצם בכל עמוד שבו לפסקה שורות).
    const paraNotes = new Map(); // tokenId -> [{text}] (מופקות בפעם הראשונה)
    const tokPages = new Map();  // tokenId -> Set(pageIndex)

    while (ti < toks.length || pending || (sectionFirst && sec.newPage)) {
      // **S5.2 (F3):** סעיף עם newPage ובלי אף token — עמוד הפתיחה (הכותרת)
      // עדיין חייב להיווצר; בלי התנאי הזה הלולאה לא רצה כלל והכותרת אבדה.
      const pageIsSectionOpen = sectionFirst && !!sec.newPage; // **S4.19:** להזזת אזור-h2/h0 בסוף העמוד
      const pg = newPage(isH0 ? (sectionFirst ? 'preface' : 'regular')
        : (sectionFirst && isH2 ? 'sign-open' : 'regular'));
      if (pageIsSectionOpen) pg._secStartLevel = sec.newPage.level; // **EXT-15:** פתיחת מקטע — לכלל העמוד האי-זוגי
      let top = GEO.FLOW_TOP;
      if (sectionFirst && sec.newPage) {
        if (isH0) {
          // **S4.24 (כותרת-h0 ארוכה מהפס — עטיפה):** שורות נוספות בפסים של 30px
          // מתחת למיקום המכויל (309.0) — השורה הראשונה זהה לחלוטין לחד-שורתי.
          const h0Lines = wrapText(sec.newPage.text, { measureTextWidth: (t, sz) => brk.hw(t, sz) }, SINGLE_W, SZ.h0Title);
          (h0Lines.length ? h0Lines : ['']).forEach((h0seg, li) => pg.bands.push({ kind: 'h0-title', text: h0seg, sizePt: SZ.h0Title, y: 309.0 + li * 30, h: 30, tokenId: li === 0 ? sec.newPage.id : null }));
          top = GEO.FLOW_TOP + H0_AREA_H;
          currentH2 = sec.newPage.text;
        } else if (isH2) {
          // **S4.19 (שני אזורי-h2 — מדידה מהייחוס):** עמוד h2 שהמקטע שלו נפתח
          // בכותרת-רוחבית (h3-span) ממשיך להשתמש בכיול S4.14 (261.3 — נמדר מעמ' 11
          // וכולל בתוכו את ה-fn-shift, העיטורים ואזור ה-span יחד); עמוד h2 רגיל
          // (בלי span — עמ' 24/38) משתמש ב-spacer המלא 284.25. דריסה לניסויים:
          // RED_H2_SPAN_EXEMPT=0 מבטל את הפטור.
          const spanExempt = toks.length && toks[0].type[0] === 'h'
            && (HEADING_MODES[toks[0].level] || 'inline_2col') === 'span_1col'
            && H2_SPAN_EXEMPT;
          const areaH = spanExempt ? 261.3 : H2_AREA_H;
          if (cfg.autoSimanH2) {
            simanCounter++;
            pg.bands.push({ kind: 'h2-siman', text: 'סימן ' + toGematria(simanCounter), sizePt: SZ.siman, y: spanExempt ? 284.9 : 307.88, h: 36, tokenId: null });
          }
          const disp = sec.newPage.text.replace(/^סימן\s+[א-ת]+[:\-–—\s]*/i, '').trim();
          // **S4.24 (כותרת-h2 ארוכה מהפס — עטיפה):** נמדד בחי — "בענין הזכרת
          // שבת ור"ח בברהמ"ז…" 555.4px > 552.3 — גלישה שקטה. שורות נוספות
          // בפסים של 30px מתחת למיקום המכויל; הראשונה זהה לחלוטין.
          const h2Lines = wrapText(disp, { measureTextWidth: (t, sz) => brk.hw(t, sz) }, SINGLE_W, SZ.h2);
          (h2Lines.length ? h2Lines : ['']).forEach((h2seg, li) => pg.bands.push({ kind: 'h2-title', text: h2seg, sizePt: SZ.h2, y: (spanExempt ? 321.1 : 344.05) + li * 30, h: 30, tokenId: li === 0 ? sec.newPage.id : null }));
          currentH2 = disp;
          // **S4.9 (תיקון קריטי):** הזרימה מתחילה מתחת לאזור ה-h2 (סימן+כותרת) —
          // בלי זה הבלוקים מוצבים מראש העמוד, מתנגשים בכותרות וגוררים
          // הסחת עימוד של ~29 שורות בכל עמוד פתיחת סימן.
          top = GEO.FLOW_TOP + areaH;
          pg._h2SpanExempt = spanExempt; // **S4.19:** לביטול הזזת ה-fn בסוף העמוד
        }
      }
      setHeader(pg, currentH2);
      sectionFirst = false;

      const fnQueue = [];
      let fnReserved = 0;
      // **S4.24 (המשכי הערות מקוצצות):** בראש תור כל עמוד — ההמשכים
      // מהעמוד הקודם (כמו pendingBarNotes בנתיב ה-DP: המשכים מהעמוד
      // הקודם קודם כל — שמירת סדר ההערות). הם נכנסים לתקציב מיד — לפני
      // כל מילוי טורים.
      if (pendingFootnotes.length) {
        fnQueue.push(...pendingFootnotes.splice(0));
        fnReserved = fnReserveFor(fnQueue);
        // **S6.0 (F2 — המשכים מול פתיחת מקטע):** עמוד פתיחת h2/h0 מתחיל את
        // הזרימה מתחת לפס הכותרת (top≈391/356); carry מלא (851.7+38.5) היה
        // מקפיץ את תחתית הטור מעל ה-top ⇒ אפס שורות גוף ואילוץ fit=1
        // שמציב שורה בתוך אזור ההערות (חפיפת גוף/הערות של עד 46px).
        // תוקם: ה-carry מוגבל לתקציב שמשאיר שורת-גוף אחת לפחות מתחת
        // ל-top; העודף חוזר ל-pendingFootnotes וזורם בעמוד הבא (סדר נשמר).
        // בעמוד רגיל ה-cap (893.56) גבוה מהתקרה המלאה (890.2) — אין שינוי.
        const fnCarryCap = Math.max(0, FLOW_BOTTOM - top - GEO.LINE_H);
        while (fnQueue.length && fnReserveFor(fnQueue) > fnCarryCap) {
          pendingFootnotes.unshift(fnQueue.pop());
        }
        fnReserved = fnQueue.length ? fnReserveFor(fnQueue) : 0;
      }
      // **תיקון כפילות הערות בעמוד (נמצא בקורפוס הגדול):** בעבר היו שלושה מסלולי
      // דחיפה לתור — תקציב-מוקדם, המשך-פסקה ומיקום-שורה — ושניים מהם לא בדקו
      // דה-דופ, ולכן הערה של פסקה שנפתחה ומוקמה באותו עמוד הופיעה פעמיים
      // (very_long: 70 עמודים עם הערות כפולות). כעת כל הכניסה לתור דרך
      // enqueueNote — הערה קיימת לא נוספת שנית, והסמן נגזר ממקומה בתור:
      // מספור עמודי עוקב מ־א ואילך, זהה בין סמן הגוף לראש ההערה בתחתית
      // (הוכח מהייחוס: כל אזורי ההערות של המקור פותחים ב־א', והערה של
      // פסקה חוצת-עמודים חוזרת בעמוד ההמשך עם סמן א' מחדש).
      const enqueueNote = (text, dup, key) => {
        // **S6.0 (F3 — כפילויות מזוהות לא נכון):** הדה-דופ לפי טקסט בלבד מזג
        // שתי הערות שונות עם טקסט זהה ([שם] פעמיים בפרק — נפוץ בספרות תורנית)
        // לרשומה אחת ⇒ אובדן תוכן (missing בחשבונאות). כעת הזהות היא מפתח
        // מופע (token#ordinal); רשומות היסטוריות בלי מפתח ממשיכות להתאים
        // לפי טקסט/srcText (המשכים מועברים מעמוד קודם — S4.26 נשמר).
        const keyOf = (q) => (q && q.key != null ? q.key : null);
        const k = key != null ? key : text;
        let idx = fnQueue.findIndex(q => keyOf(q) != null
          ? keyOf(q) === k
          : (q.text === text || q.srcText === text));
        if (idx < 0) {
          // **S4.26 (מספור פר-פרק):** מספר יציב להערה בתוך הפרק — סמן הגוף
          // וסמן הרישום זהים גם בהצגה חוזרת (פסקה חוצת-עמודים). מצב page
          // ממשיך לגזור מקום בתור (התנהגות היסטורית).
          let num = null;
          if (fnResetMode === 'siman') {
            num = fnNoteNumbers.get(k);
            if (num == null) { fnChapterCounter++; num = fnChapterCounter; fnNoteNumbers.set(k, num); }
          }
          fnQueue.push({ text, dup, num, cont: false, key: key != null ? key : undefined });
          idx = fnQueue.length - 1;
        }
        const q = fnQueue[idx];
        const mkNum = (q && q.num != null) ? q.num
          : (fnResetMode === 'siman' && fnNoteNumbers.has(k) ? fnNoteNumbers.get(k) : idx + 1);
        // **EXT-17:** המפריד אחרי המספר — הגדרת המקור (note-num-separator).
        return LineBreaker.markerWord(mkNum, cfg.fnNumSeparator);
      };
      // **S4.9 (התנהגות המקור הנצפית):** הערות של פסקה מופיעות ומוזרמות לתקציב
      // בכל עמוד שבו לפסקה שורות — גם בהמשכים (הייחוס מציג את הערה-א בעמודים
      // 11 וגם 12, והתקציב מצטמצם כבר בעמוד הראשון של הפסקה).
      const requeueParaNotes = (tokenId) => {
        const notes = paraNotes.get(tokenId);
        if (!notes) return;
        // **S6.0 (F3):** התאמת המשכים לפי מפתח המופע כשקיים — ולפי
        // טקסט/srcText כשלא (רשומות היסטוריות) — שומר על הגנת S4.26 מפני
        // הכפלת הערה שכבר זורמת, בלי למזג הערות שונות בעלות טקסט זהה.
        const matchKey = (c) => (c && c.key != null ? c.key : (c && (c.srcText || c.text)));
        for (const n of notes) {
          // **S4.24:** הערה שקוצצה בתקרת המרזב ועודנה ממתינה בהמשכים — לא
          // חוזרת שנית במלואה (ההמשך הקצוץ ממשיך אותה); המקוריות נשמרת
          // ב-srcText לזיהוי.
          // **S4.26 (תיקון שכפול):** גם המשך שכבר נכנס לתור העמוד (אחרי
          // ה-splice בפתיחת העמוד) חוסם את ההוספה החוזרת — בעבר ההערה
          // זרמה פעמיים במקביל (ההמשך + ההערה המלאה מחדש): הערה של 4,500
          // מילים תפסה 13 עמודי הערות במקום 7, עם חזרה שלמה של הטקסט.
          if (pendingFootnotes.some(c => (n.key != null ? matchKey(c) === n.key : (c.srcText || c.text) === n.text))) continue;
          if (fnQueue.some(q => (n.key != null ? matchKey(q) === n.key : (q.srcText || q.text) === n.text))) continue;
          enqueueNote(n.text, true, n.key);
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

      // **S4.13 (rollbackTrailingHeadings של המקור):** כותרות עוקבות בסוף הטור
      // הנוכחי חוזרות יחד עם הפסקה שלא נכנסה — כדי שכותרת לא תישאר יתומה
      // בתחתית הטור (המקור: tokenIndex -= rollbackTrailingHeadings(targetCol)).
      // מחזיר כמה הוסרו; מעדכן את ה-cursor של הטור.
      const rollbackTrailingHeadings = () => {
        if (!block) return 0;
        // **S4.24:** כותרת ארוכה = מספר יחידות (עטיפה) — המספר המוחזר הוא
        // מספר ה**טוקנים** הנפרדים (לפי tokenId), לא מספר היחידות — ti
        // מופחת בו ובעבר (כותרת=יחידה אחת) שני המספרים היו זהים.
        const seen = new Set();
        while (block.cols[block.fill].length) {
          const lastU = block.cols[block.fill][block.cols[block.fill].length - 1];
          if (lastU.kind !== 'heading') break;
          block.cols[block.fill].pop();
          block.cursor[block.fill] -= lastU.h;
          if (lastU.tokenId != null) seen.add(lastU.tokenId);
        }
        return seen.size;
      };

      // **S4.13 (היגיון סיום בלוק — העתק מהמקור, שורות 3946-3997):** במקור כל
      // בלוק מסתיים באחד מארבעה: (1) סוף פרק → איזון תמיד; (2) הטוקן הבא
      // כותרת-רוחבית (span_1col) → איזון; (3) הטור הימני גולש לגובה הפנוי או
      // הפרש הטורים > 60px → איזון; (4) אחרת — המילוי נשמר (במקור: מתיחה
      // אנכית עדינה של הטור הקצר, שאינה מזיזה נקודות חיתוך ולכן לא ממומשת
      // כאן). ה-S4.12 איזן בלי-תנאי בכל נקודות היציאה — עכשיו נאמן למקור.
      const finalizeBlock = (blk, nextTok, sectionEnd) => {
        if (!blk || isH0) return;
        if (!(blk.cols[0].length || blk.cols[1].length)) return;
        const availH = colBottom() - blk.yTop;
        if (sectionEnd) { balanceBlock(blk, availH); return; }
        const nextIsSpan = nextTok && nextTok.type[0] === 'h'
          && (HEADING_MODES[nextTok.level] || 'inline_2col') === 'span_1col';
        // **S4.14 (מדידת עוגנים מפריכה את סעיף 3 בחיתוכי-עמוד):** עמ' 31
        // בייחוס — בלוק 914px, ‏7 פסקאות גמורות (p-end), ‏39/32 שורות לא מאוזן
        // (הפרש 150px > 60); עמ' 44: ‏49/38; עמ' 48: ‏40/51. כשהבלוק נגמר משום
        // שהעמוד התמלא — המקור שומר את המילוי גם בהפרש גדול. האיזון בפועל
        // רק בסוף מקטע ולפני span (ההוכחות של S4.13 לאותם מקרים תקפות).
        if (nextIsSpan) {
          balanceBlock(blk, availH);
        }
      };

      // ================= S4.17: חילוץ סמנים + מתיחה/כיווץ/משיכת זנב =================
      // (העתק נאמן של stretchPageToBottom + tryReclaimOrphanTail + מערכת
      // compressColumnBy של v21-glm — ההוכחות מהייחוס בבלוק הקבועים למעלה)

      /** חילוץ שורות עם סמני הערות — משותף למילוי הרגיל ולמשיכת הזנב היתום
       * (במקור: applyDelimiterStyles על חתיכת ה-p בכל נתיב הצבה). */
      const emitLinesWithMarkers = (tok, lines, startIdx, count) => {
        const emitted = [];
        // **S6.0 (F3):** אורדינל ההערה בפסקה — נגזר מהמיקום המוחלט בשורות
        // (עמיד לפליטות חוזרות: אותו מיקום ⇒ אותו מפתח ⇒ אותו סמן/רשומה).
        const notesUpTo = (lineAbs, wordIdx, beforeStart) => {
          let c = 0;
          for (let lj = 0; lj < lineAbs; lj++) {
            for (const lw of (lines[lj] ? lines[lj].words : [])) c += findNotes(lw, cfg.fnOpen, cfg.fnClose).length;
          }
          const lws = lines[lineAbs] ? lines[lineAbs].words : [];
          for (let wi2 = 0; wi2 < wordIdx; wi2++) c += findNotes(lws[wi2], cfg.fnOpen, cfg.fnClose).length;
          c += findNotes(lws[wordIdx] || '', cfg.fnOpen, cfg.fnClose).filter(x => x.start < beforeStart).length;
          return c;
        };
        for (let k = 0; k < count; k++) {
          const ln = lines[startIdx + k];
          const words = [];
          const flags = [];
          const starts = []; // **S4.24:** דגלי קצה-סוגריים — ממופים דרך פיצול הסמנים
          const ends = [];
          const markerIdx = []; // אינדקסים של סמני ההערות (להסרה מדויקת במודל)
          for (let wi = 0; wi < ln.words.length; wi++) {
            const w = ln.words[wi];
            // **S4.19:** דגל הסוגריים של המילה המקורית — מועבר לכל חלקיה
            // (קידומת/סיומת סביב סמן הערה); הסמן עצמו אינו טקסט-סוגריים.
            const wp = ln.parenFlags && wi < ln.parenFlags.length ? !!ln.parenFlags[wi] : false;
            // **S4.24:** דגלי קצה — הפריט הראשון של המילה יורש את starts,
            // האחרון את ends (הרווחים הפנימיים סביב הסמן — כמו שנמדדו).
            const wS = ln.parenStarts && wi < ln.parenStarts.length ? !!ln.parenStarts[wi] : false;
            const wE = ln.parenEnds && wi < ln.parenEnds.length ? !!ln.parenEnds[wi] : false;
            const firstAt = words.length;
            const wNotes = findNotes(w, cfg.fnOpen, cfg.fnClose);
            if (wNotes.length) {
              let pos = 0;
              for (const n of wNotes) {
                const prefix = w.slice(pos, n.start);
                if (prefix) { words.push(prefix); flags.push(wp); starts.push(false); ends.push(false); }
                if (n.text) {
                  // **S6.0 (F3):** מפתח מופע — token#ordinal; שתי הערות שונות
                  // בעלות טקסט זהה ([שם] פעמיים) מקבלות רשומות וסמנים נפרדים.
                  const ord = notesUpTo(startIdx + k, wi, n.start);
                  const noteKey = `${tok.id}#${ord}`;
                  const marker = enqueueNote(n.text, undefined, noteKey);
                  if (!paraNotes.has(tok.id)) paraNotes.set(tok.id, []);
                  if (!paraNotes.get(tok.id).some(x => x.key === noteKey)) {
                    paraNotes.get(tok.id).push({ text: n.text, key: noteKey });
                  }
                  fnReserved = fnReserveFor(fnQueue);
                  markerIdx.push(words.length);
                  words.push(marker);
                  flags.push(false);
                  starts.push(false); ends.push(false);
                }
                pos = n.end;
              }
              const suffix = w.slice(pos);
              if (suffix) { words.push(suffix); flags.push(wp); starts.push(false); ends.push(false); }
            } else {
              words.push(w);
              flags.push(wp);
              starts.push(false); ends.push(false);
            }
            // **S4.24:** הפריט הראשון של המילה יורש את דגל ה-starts, האחרון את
            // ה-ends — הרווחים הפנימיים סביב סמן הערה נשארים בגודל השורה
            // (כך נמדדו בשבירה; הסמן אינו טקסט-סוגריים).
            starts[firstAt] = wS;
            ends[words.length - 1] = wE;
          }
          emitted.push({ ...ln, words, markerIdx, parenFlags: flags, parenStarts: starts, parenEnds: ends });
        }
        return emitted;
      };

      /** הטורים האפקטיביים של בלוק — אחרי איזון ה-split הם הסמכות (layoutStack
       * קורא מהם); מתיחה/כיווץ/משיכה חייבות לפעול על אותן יחידות בדיוק. */
      const effCols = (blk) => blk.split ? [blk.split.r, blk.split.l] : [blk.cols[0], blk.cols[1]];

      /** v21 columnStretchCapacity: כמה px אפשר למתוח טור — ריווח-פסקה עד
       * JUSTIFY_MAX_GAP + תוספת פס עד JUSTIFY_MAX_LH_EXTRA (האחרון של הטור
       * לא מקבל ריווח — כמו i < kids.length-1 במקור). */
      const colStretchCap = (units) => {
        let cap = 0;
        units.forEach((u, i) => {
          if (u.kind !== 'para') return;
          if (i < units.length - 1) cap += Math.max(0, JUSTIFY_MAX_GAP - ((u.gapPx != null ? u.gapPx : 7) - 7));
          const lh = u.lhPx != null ? u.lhPx : u.pitch;
          cap += u.lines.length * Math.max(0, JUSTIFY_MAX_LH_EXTRA - (lh - u.pitch));
        });
        return cap;
      };

      /** v21 justifyColumnVertically — שלבי הריווח והפס בלבד. word-spacing מדולג
       * בכל הנתיבים: הוכח מהייחוס שכיווץ/מתיחת רווחי-מילים לא שינו שם שום
       * שבירת שורה (כל השורות זהות לשלנו), וריווח-מילים משנה גובה **רק** דרך
       * עטיפה מחדש — כלומר לא פינה שום גובה בפועל. דילוג = נאמן לתוצאה. */
      const justifyColUnits = (units, yTop, targetAbs, maxStretch, lhCapExtra) => {
        let diff = targetAbs - (yTop + colHeightUnits(units));
        if (!(diff > 0.5 && diff <= maxStretch)) return;
        // שלב 1: ריווח בין פסקאות (paddingBottom עד JUSTIFY_MAX_GAP)
        const gapKids = units.filter((u, i) => u.kind === 'para' && i < units.length - 1);
        if (gapKids.length) {
          const per = diff / gapKids.length;
          for (const u of gapKids) {
            const curPad = (u.gapPx != null ? u.gapPx : 7) - 7;
            const add = Math.max(0, Math.min(per, JUSTIFY_MAX_GAP - curPad));
            if (add > 0) u.gapPx = 7 + curPad + add;
          }
          diff = targetAbs - (yTop + colHeightUnits(units));
          if (!(diff > 0.5)) return;
        }
        // שלב 2: מתיחת גובה-שורה — 8 מעברים × 50% מהשארית, בדיקה לפני כל
        // פסקה (מניעת overshoot כמו במקור), תקרה min(lhCapExtra, 3)
        const cap = Math.min(lhCapExtra, JUSTIFY_MAX_LH_EXTRA);
        for (let pass = 0; pass < 8; pass++) {
          const rest = targetAbs - (yTop + colHeightUnits(units));
          if (!(rest > 0.5)) break;
          const infos = units.filter(u => u.kind === 'para')
            .map(u => ({ u, lh: u.lhPx != null ? u.lhPx : u.pitch, lines: u.lines.length }));
          const totalLines = infos.reduce((a, x) => a + x.lines, 0);
          if (!(totalLines > 0)) break;
          const e = (rest / totalLines) * 0.5;
          let changed = false;
          for (const x of infos) {
            const currentRest = targetAbs - (yTop + colHeightUnits(units));
            if (currentRest <= 0.5) break;
            const newLh = Math.min(x.lh + e, x.u.pitch + cap);
            if (newLh <= x.lh + 0.01) continue;
            x.u.lhPx = newLh;
            changed = true;
          }
          if (!changed) break;
        }
      };

      /** v21 compressColumnBy שלבים 1-3 (word-spacing מדולג — ראה justifyColUnits):
       * padding → פס עד הבסיס → עד allowBelowBase מתחת לבסיס; בסדר היחידות —
       * הפסקאות הראשונות של הטור סופגות ראשונות (בדיוק כמו שנמדד בייחוס). */
      const compressColUnits = (units, neededPx, allowBelowBase, maxBelowTotal) => {
        if (!(neededPx > 0)) return 0;
        let freed = 0;
        // **S4.18 (כיווץ מרווח-בסיס — ההוכחה מהייחוס):** המנוע המקורי דוחס את
        // מרווח הפסקה הבסיסי עצמו, לא רק padding עודף: בעמ' 14 שמאל נמדדו
        // מרווחי-פסקה 22.4-24.4px (בסיס 21.44 + ‏1-3px gap) מול 29px רגיל —
        // כלומר gap 7→1-3. בלי שלב זה המשיכה של p14 דרשה 31.9px below-base
        // (רק cap≥32 הצליח) בעוד המקור השלים אותה ב-gap ~16px + below ~16px.
        // הרצפה 2px = התחתית הנמדדת בייחוס (מרווח 23.4px).
        if (maxBelowTotal == null || !isFinite(maxBelowTotal) || maxBelowTotal > 0) {
          for (const u of units) {
            if (freed >= neededPx) break;
            if (u.kind !== 'para') continue;
            const curGap = u.gapPx != null ? u.gapPx : 7;
            if (curGap > GAP_COMPRESS_FLOOR) {
              const reduce = Math.min(curGap - GAP_COMPRESS_FLOOR, neededPx - freed);
              u.gapPx = curGap - reduce;
              freed += reduce;
            }
          }
        }
        for (const u of units) {
          if (freed >= neededPx) break;
          if (u.kind !== 'para') continue;
          const curPad = (u.gapPx != null ? u.gapPx : 7) - 7;
          if (curPad > 0) {
            const reduce = Math.min(curPad, neededPx - freed);
            u.gapPx = 7 + (curPad - reduce);
            freed += reduce;
          }
        }
        for (const u of units) {
          if (freed >= neededPx) break;
          if (u.kind !== 'para') continue;
          const lh = u.lhPx != null ? u.lhPx : u.pitch;
          if (lh <= u.pitch) continue;
          const maxReduce = (lh - u.pitch) * u.lines.length;
          if (maxReduce <= 0) continue;
          const reduce = Math.min(maxReduce, neededPx - freed);
          u.lhPx = lh - reduce / u.lines.length;
          freed += reduce;
        }
        if (allowBelowBase > 0) {
          // **S4.17 (כיוול מהייחוס):** כיווץ-מתחת-לבסיס מוגבל בגג כולל
          // (maxBelowTotal) — כפי שהמקור מתנהג בפועל (ראה RECLAIM_COMPRESS_MAX).
          let belowBudget = (maxBelowTotal != null && isFinite(maxBelowTotal))
            ? Math.max(0, maxBelowTotal) : Infinity;
          for (const u of units) {
            if (freed >= neededPx || belowBudget <= 0) break;
            if (u.kind !== 'para') continue;
            const lh = u.lhPx != null ? u.lhPx : u.pitch;
            const maxReduce = Math.min(allowBelowBase * u.lines.length, belowBudget);
            if (maxReduce <= 0) continue;
            const reduce = Math.min(maxReduce, neededPx - freed);
            u.lhPx = lh - reduce / u.lines.length;
            freed += reduce;
            belowBudget -= reduce;
          }
        }
        return freed;
      };

      /** v21 stretchPageToBottom + stretchLastBlockToBottom: מתיחת הבלוק האחרון
       * של עמוד שהפרק ממשיך אחריו עד תחתית שטח הגוף; שני הטורים לאותו יעד
       * (יעד = מינימום(תחתית−2, השגת הטור החלש)). דו-טורי בלבד — להקדמה
       * (טור-יחיד) אין משיכת-יתום במקור, ומתיחתה אינה מזיזה שום שורה בין
       * עמודים, ולכן אינה מיושמת כאן. */
      const stretchLastBlockToBottom = () => {
        const lastBlk = stack[stack.length - 1];
        if (!lastBlk || lastBlk.type === 'span') return;
        const cols = effCols(lastBlk);
        if (!(cols[0].length || cols[1].length)) return;
        const rH = colHeightUnits(cols[0]);
        const lH = colHeightUnits(cols[1]);
        const topH = Math.max(rH, lH);
        const free = (colBottom() - (lastBlk.yTop + topH)) - 1;
        if (!(free > 0.5 && free <= PAGE_STRETCH_MAX)) return;
        const reach = Math.min(rH + colStretchCap(cols[0]), lH + colStretchCap(cols[1]));
        const target = Math.min(topH + free - 2, reach);
        if (target - topH < 0.5) return;
        justifyColUnits(cols[0], lastBlk.yTop, lastBlk.yTop + target, PAGE_STRETCH_MAX + 40, JUSTIFY_MAX_LH_EXTRA);
        justifyColUnits(cols[1], lastBlk.yTop, lastBlk.yTop + target, PAGE_STRETCH_MAX + 40, JUSTIFY_MAX_LH_EXTRA);
        lastBlk.cursor[0] = lastBlk.yTop + colHeightUnits(cols[0]);
        lastBlk.cursor[1] = lastBlk.yTop + colHeightUnits(cols[1]);
      };

      /** v21 tryReclaimOrphanTail: זנב פסקה יתום של 1-2 שורות נמשך חזרה לעמוד
       * ע"י כיווץ הטור השמאלי (עד 2px מתחת לבסיס לשורה) + באפר גלישה 12px.
       * ההערות שבשורות הזנב נכנסות לתור העמוד **לפני** בדיקת המקום (כמו
       * applyDelimiterStyles(!isDryRun) במקור), ואינן מוסגרות בחזרה גם אם
       * המשיכה נכשלת — המקור לא מגלגל את התור לאחור. */
      const tryReclaimOrphanTail = () => {
        if (!pending) return false;
        const remaining = pending.lines.length - pending.lineIdx;
        if (remaining < 1 || remaining > 2) return false;
        // **S4.18 (תנאי סוף-פסקה — ההוכחה מהייחוס):** המשיכה האמיתית היחידה
        // של הייחוס (עמ' 14: 'ודיקא נמי' ×2) היא זנב **סוף פסקה** — השורות
        // האחרונות של הפסקה חוזרות לעמוד. זנבות אמצע-פסקה (פסאודו-יתומים
        // שנוצרים מהזזת גבול 1-2 שורות, כמו עמ' 22/33/39/43 שנצפו במודל)
        // המקור אינו מושך — הפסקה ממשיכה לזרום בעמוד הבא כרגיל.
        if (pending.lineIdx + remaining < pending.lines.length) return false;
        if (isH0) return false; // המקור מושך יתומים רק בבלוקים דו-טוריים
        const lastBlk = stack[stack.length - 1];
        if (!lastBlk || lastBlk.type === 'span') return false;
        const cols = effCols(lastBlk);
        const lCol = cols[1];
        const blockBottomNow = Math.max(lastBlk.cursor[0], lastBlk.cursor[1]);
        const currentFree = colBottom() - blockBottomNow - 1;
        // **S4.17 (כיוול מהייחוס):** הקיבולת למשיכה = ביטול המתיחה (padding +
        // פס-עד-הבסיס — התקציב שהמתיחה עצמה הוסיפה) + כיווץ-מתחת-לבסיס בגג
        // הנצפה בייחוס (~30px). בלי הגג, משיכה של 2 שורות בעמוד מלא (כיווץ
        // ~44px) הייתה מצליחה בזמן שהמקור דחה אותה (הוכחה: עמ' 15←16 בייחוס —
        // הזנב עבר עמוד למרות קיבולת נומינלית של 2px×44 שורות; לעומת זאת עמ' 14
        // שמאל נמשך עם כיווץ ~20px ועמ' 20 שמאל עם ~26-34px).
        let undoStretchCap = 0, lineCount = 0, gapCap = 0;
        for (const u of lCol) {
          if (u.kind !== 'para') continue;
          undoStretchCap += Math.max(0, (u.gapPx != null ? u.gapPx : 7) - 7);
          const lh = u.lhPx != null ? u.lhPx : u.pitch;
          if (lh > u.pitch) undoStretchCap += (lh - u.pitch) * u.lines.length;
          lineCount += u.lines.length;
          // **S4.18:** קיבולת כיווץ מרווח-הבסיס (7→רצפה) — השלב הראשון של
          // compressColUnits חייב להיכנס לשער הקיבולת, אחרת משיכות שהמקור
          // מבצע (עמ' 14: gap ~20px + below ~16px) נדחות בשער לפני שמתחילות.
          gapCap += Math.max(0, (u.gapPx != null ? u.gapPx : 7) - GAP_COMPRESS_FLOOR);
        }
        const totalCap = undoStretchCap + gapCap
          + Math.min(RECLAIM_BELOW_BASE * lineCount, RECLAIM_COMPRESS_MAX);
        // סמני ההערות של שורות הזנב — נכנסים לתור ומגדילים את התקציב מיד
        const tok = pending.token;
        const emitted = emitLinesWithMarkers(tok, pending.lines, pending.lineIdx, remaining);
        const orphanH = remaining * GEO.LINE_H; // p-end המשכי בגובה בסיס (בלי חלון)
        const neededPx = orphanH + 2;
        if (currentFree + totalCap + ORPHAN_RECLAIM_BUFFER < neededPx) return false;
        const compressNeeded = Math.max(0, neededPx - currentFree);
        if (compressNeeded > 0) compressColUnits(lCol, compressNeeded, RECLAIM_BELOW_BASE, RECLAIM_COMPRESS_MAX);
        // הנחת הזנב בטור השמאלי — p-end המשכי לכל דבר (בלי חלון/הערת-צד)
        lCol.push({
          kind: 'para', tokenId: tok.id, lines: emitted, from: pending.lineIdx,
          isEnd: true, isCont: true, hasWindow: false, windowWords: null, windowW: 0,
          pitch: GEO.LINE_H, lhPx: GEO.LINE_H, gapPx: 7,
          sizePt: SZ.body, sideNote: null
        });
        lastBlk.cursor[1] = lastBlk.yTop + colHeightUnits(lCol);
        // וידוא גלישה: התקציב כולל כבר את הערות הזנב (המקור בודק reservedNow בשנית)
        const newFree = colBottom() - Math.max(lastBlk.cursor[0], lastBlk.cursor[1]) - 1;
        if (newFree < -ORPHAN_RECLAIM_BUFFER) {
          lCol.pop();
          lastBlk.cursor[1] = lastBlk.yTop + colHeightUnits(lCol);
          return false;
        }
        pending = null;
        ti++;
        return true;
      };

      fillPage: while (ti < toks.length || pending) {
        const tok = pending ? pending.token : toks[ti];
        const mode = tok.type[0] === 'h' ? (HEADING_MODES[tok.level] || 'inline_2col') : 'inline_2col';

        if (mode === 'span_1col' && !pending) {
          // **S4.12 (איזון לפני החלטת ה-span, כמו המקור):** בלוק שמולא חמדנית
          // (טור ימני מלא, שמאלי חלקי) מנפח את blockBottom ופוסל span שהיה
          // נכנס בקלות אחרי איזון — ההוכחה: עמוד עם 27/2 שורות שדחה span
          // בעוד איזון (15/14) מוריד את blockBottom ב-250px. המקור מאזן את
          // הבלוק בכל יציאה מלולאת המילוי לפני החלטת המשך/עצירה.
          if (block && !isH0 && (block.cols[0].length || block.cols[1].length)) {
            balanceBlock(block, colBottom() - block.yTop);
          }
          const curY = block ? blockBottom() : top;
          // **S4.13:** סף 60px — כמו המקור (if (currentAvailH < 60) break
          // לפני הצבת כותרת רוחבית); היה H3_SPAN_H+6≈46.
          // **S4.24 (כותרת-רוחב ארוכה מהפס — עטיפה ברוחב הפס):** מוכרז לפני
          // בדיקת הסף (הסף תלוי במספר השורות). עד כאן הונחה כותרת ה-span
          // כולה כשורה בודדת בלתי-נפרדת — ארוכה מרוחב הפס (552.3px) גלשה
          // ממנו (נמדד בחי: "ו. אחידות מעשה השחיטה וספיקות הגמרא" גלשה
          // 96px, עמ' 571). המקור עוטף ברוחב הפס; כל שורה עטופה = פס נפרד
          // בגיאומטריה המכוילת (H3_SPAN_H) — שורה ראשונה זהה לחלוטין.
          const spanLines = wrapText(tok.text, { measureTextWidth: (t, sz) => brk.hw(t, sz) }, SINGLE_W, SZ.h3);
          // **S4.13:** סף 60px — כמו המקור (if (currentAvailH < 60) break
          // לפני הצבת כותרת רוחבית); היה H3_SPAN_H+6≈46. **S4.24:** כותרת
          // מרובת-שורות דורשת מקום לכל שורותיה.
          if (colBottom() - curY < 60 + (spanLines.length - 1) * H3_SPAN_H) break fillPage;
          for (let li = 0; li < spanLines.length; li++) {
            stack.push({ type: 'span', text: spanLines[li], y: curY + li * H3_SPAN_H, h: H3_SPAN_H, tokenId: li === 0 ? tok.id : null });
          }
          openBlock(curY + spanLines.length * H3_SPAN_H);
          ti++;
          continue;
        }
        if (tok.type[0] === 'h') {
          if (!block) openBlock(top);
          // **S4.24 (כותרות inline ארוכות מהטור — עטיפה ברוחב הטור):** עד כאן
          // הונחה הכותרת כולה כשורה בודדת בלתי-נפרדת (words:[u.text] בפליטה)
          // — כותרת הרחבה מרוחב הטור לא נשברה לעולם ודיו הגליש מהטור שמאלה
          // (נמדד באתר החי על הקובץ הגדול: 3 כותרות — 5.3/11.8/155.8px,
          // עמ' 61/97/105). המקור עוטף כותרות inline ברוחב הטור (שורות
          // ממורכזות, פס 1.45× — הכיול של S4.14). עטיפה בגלישת המנוע בגודל
          // הכותרת; כל שורה עטופה = יחידה; התאמת הגובה בודקת את הכותרת
          // כולה (scrollHeight של האלמנט במקור — לא שורה-שורה).
          const headSz = ({ 4: SZ.h4, 5: SZ.h5, 6: SZ.h6 })[tok.level] || SZ.body;
          const headColW = isH0 ? SINGLE_W : GEO.COL_W;
          const headLines = wrapText(tok.text, { measureTextWidth: (t, sz) => brk.hw(t, sz) }, headColW, headSz);
          const headSegs = headLines.length ? headLines : [''];
          const h = headingItemH(tok.level);
          const hTotal = headSegs.length * h;
          // **S4.19 (מודל ה-DOM):** גם בדיקת הכותרת במקור עוברת scrollHeight
          // (שלם) מול התקציב — אותה קוונטיזציה כמו בדיקת הפסקה.
          const hFits = FIT_MODEL === 'dom'
            ? snapPx(block.cursor[block.fill] - block.yTop + hTotal) <= Math.floor(colBottom() - block.yTop)
            : block.cursor[block.fill] + hTotal <= colBottom();
          if (!hFits) {
            if (block.fill === 0 && !isH0 && !(block.cols[0].length === 0)) {
              // **S4.13:** גם כאן המקור מחזיר כותרות זנב לפני מעבר טור —
              // כותרת שנותרה אחרונה בטור הימני תיפלט עם הפסקה הבאה בשמאלי.
              ti -= rollbackTrailingHeadings();
              block.fill = 1; // המשך בטור השמאלי
            } else if (block.cols[block.fill].length || block.cols[0].length) {
              // **S4.13:** סיום הבלוק לפני שבירת העמוד — כמו המקור (כל בלוק
              // מסתיים בהיגיון הארבעה; כאן הטוקן הבא הוא הכותרת שלא נכנסה).
              ti -= rollbackTrailingHeadings();
              finalizeBlock(block, tok, false);
              break fillPage;
            }
          }
          for (const seg of headSegs) {
            block.cols[block.fill].push({ kind: 'heading', level: tok.level, text: seg, h, tokenId: tok.id });
          }
          block.cursor[block.fill] += hTotal;
          ti++;
          continue;
        }

        // ---- פסקה ----
        if (!block) openBlock(top);
        const isH0Body = isH0;
        const bodySz = isH0Body ? SZ.h0Body : SZ.body;
        const pitch = isH0Body ? H0_LINE_H : GEO.LINE_H;
        const colW = isH0Body ? SINGLE_W : GEO.COL_W;
        let lines, hasWindow = false, windowWords = null, windowW = 0;
        const isCont = !!pending;
        if (pending) {
          lines = pending.lines;
          // המשך פסקה — ההערות שלה חוזרות לתור העמוד (כמו במקור)
          requeueParaNotes(tok.id);
        } else {
          tokPages.set(tok.id, new Set([pages.length - 1]));
          const r = brk.breakPara(tok.text, colW, bodySz, true, isH0Body ? prefaceApi : null,
            // **S6.0 (F4):** מדידת סמן אמיתית — הסמן שיוקצה להערה ה-i של
            // הפסקה במצב siman הוא fnChapterCounter+i+1 (כל ההערות הקודמות
            // בפרק כבר ממוספרות בשלב זה; הפסקה ממודדת פעם אחת לפני הפליטה).
            // במצב page המספר נגזר ממקום בתור בזמן תצוגה — אינו צפוי; נותרת
            // ההתנהגות ההיסטורית ('א' בגודל הגוף).
            fnResetMode === 'siman' ? {
              markerOf: (i) => fnChapterCounter + i + 1,
              markerSizePt: cfg.fnListingNumSize,
              markerMeasure: (t, sz) => fnApi.measureTextWidth(t, sz, 0),
              bodySizePt: bodySz,
              bodyMeasure: (t, sz) => (isH0Body && prefaceApi ? prefaceApi : { measureTextWidth: (tt, ss) => brk.w(tt, ss) }).measureTextWidth(t, sz, 0)
            } : null);
          lines = r.lines; hasWindow = r.hasWindow; windowWords = r.windowWords;
          // **S4.15:** רוחב החלון המדוד (FrankReal-Bold 1.5× + 6px) נשמר על
          // החתיקה — מקור יחיד לפרויקטור (בלי מדידה חוזרת בגופן אחר).
          windowW = r.windowW || 0;
        }
        const startIdx = pending ? pending.lineIdx : 0;
        const total = lines.length - startIdx;
        // **S5.2 (F4):** פסקה ריקה (למשל ה-syntheticTail של הערת-סיום זנבורית)
        // — אין שורות להציב; מדלגים בבטחה (ה-endNote נאסף מהטוקנים ישירות,
        // ואין תוכן-מקור לאבד). בלי זה — fit מאולץ 1 על מערך ריק ⇒ קריסת ln.words.
        if (total <= 0) { pending = null; ti++; continue; }

        // תקציב מוקדם: כל ההערות של הפסקה (מהשבירה המלאה) נכנסות לתור העמוד
        // כבר בעמוד הראשון שלה — כך התקציב מצטמצם מוקדם כמו במקור.
        if (!isCont) {
          const allNotes = [];
          for (const lw of lines) {
            for (const w of lw.words) {
              // **תיקון מרובה-הערות במילה:** הדבקת '\s+[' בטוקניזר עשויה ליצור
              // מילה כמו 'אותו[n1][n2]'. בעבר נלקח מ-[ הראשון עד-] האחרון
              // והערות סמוכות התמזגו לאחת ענקית (נמצא בקורפוס הגדול:
              // הערה של 1,288 מילים במקום שתיים). findNotes מפריד את כולן.
              for (const n of findNotes(w, cfg.fnOpen, cfg.fnClose)) {
                if (n.text) allNotes.push(n.text);
              }
            }
          }
          if (allNotes.length) {
            if (!paraNotes.has(tok.id)) {
              paraNotes.set(tok.id, allNotes.map((t, i) => ({ text: t, key: `${tok.id}#${i}` })));
            }
            // **S4.24 (שער התקציב — תיקון שורש חפיפות גוף/הערות):** לפני
            // הזרמת ההערות לתור — התוכן שכבר הונח בעמוד חייב להישאר מעל
            // תחתית התקציב החדש. פסקה קודמת (בלי הערות) עשויה הייתה למלא
            // את הטור עד תחתית הזרימה בזמן שהתור היה ריק; אם ההערות של
            // הפסקה הזו יוזרמו עכשיו, אזור ההערות ייבנה מעל אותן שורות
            // (נמדד במודל: gap שלילי עד -210px). במקור (DOM חי) ה-reflow
            // דוחף את הפסקה המאוחרת לעמוד הבא — הפסקה כולה, עם הערותיה,
            // עוברת לעמוד הבא והתור של העמוד הנוכחי נשאר נקי מהן.
            const matchKeyEarly = (c) => (c && c.key != null ? c.key : (c && (c.srcText || c.text)));
            const prospective = [...fnQueue];
            for (const n of paraNotes.get(tok.id)) {
              // **S4.26:** דה-דופ גם מול המשכים שבתור (srcText) — אחרת התקציב
              // מכפיל את ההערה ודוחס את הגוף ללא צורך.
              // **S6.0 (F3):** ההתאמה לפי מפתח המופע כשקיים — טקסט זהה
              // בשתי פסקאות ([שם] פעמיים) אינו מדולג עוד.
              if (!prospective.some(q => (n.key != null ? matchKeyEarly(q) === n.key : (q.srcText || q.text) === n.text))) {
                prospective.push({ text: n.text, key: n.key });
              }
            }
            const prospectiveBottom = FLOW_BOTTOM - fnReserveFor(prospective);
            let placedB = top;
            for (const seg of stack) {
              if (seg.type === 'span') { placedB = Math.max(placedB, seg.y + seg.h); continue; }
              placedB = Math.max(placedB, seg.cursor[0], seg.cursor[1]);
            }
            if (placedB > prospectiveBottom + 1.5) break fillPage;
            for (const n of paraNotes.get(tok.id)) {
              // **S4.26 (תיקון שכפול — המשך):** הערה שהמשכה כבר בתור/בהמתנה
              // לא נוספת שוב במלואה (אחרת היא זורמת פעמיים: ההמשך + עותק
              // מלא — נצפה 9,000 מילים במקום 4,500 בהערת-בדיקה).
              // **S6.0 (F3):** הדה-דופ וההוספה לפי מפתח המופע — כך שתי
              // הערות שונות בעלות טקסט זהה נכנסות שתיהן לתקציב ולתור.
              if (pendingFootnotes.some(c => (n.key != null ? matchKeyEarly(c) === n.key : (c.srcText || c.text) === n.text))) continue;
              if (fnQueue.some(q => (n.key != null ? matchKeyEarly(q) === n.key : (q.srcText || q.text) === n.text))) continue;
              enqueueNote(n.text, true, n.key);
            }
            fnReserved = fnReserveFor(fnQueue);
          }
        }

        let fit = 0;
        // **S4.19 (מודל ה-DOM):** המקור מודד את גובה הטור דרך scrollHeight —
        // שלם, יחסי לראש הטור, וכולל את margin-bottom של הפסקה הנבדקת.
        // ההשוואה: scrollHeight_int ≤ remPageHeight_int − reservedNow — כלומר
        // בפועל snap(colRel + k·pitch + margin) ≤ floor(availRel). במודל
        // המדויק הקודם (ברירת המחדל עד כאן) חסר המרווח — הטורים שלנו קיבלו
        // 7px קיבולת עודפת ≈ שליש שורה, וזה מקור הסחף בגבולות העמודים.
        if (FIT_MODEL === 'dom') {
          const yTopRef = block.yTop;
          const availRel = Math.floor(colBottom() - yTopRef);
          for (let k = 1; k <= total; k++) {
            const colRel = snapPx(block.cursor[block.fill] - yTopRef + k * pitch + FIT_MARGIN);
            if (colRel <= availRel) fit = k; else break;
          }
        } else {
          for (let k = 1; k <= total; k++) {
            if (block.cursor[block.fill] + k * pitch <= colBottom() + 0.01) fit = k; else break;
          }
        }
        // אלמנה/יתומה (chooseSplitLines של המקור)
        if (fit > 0 && fit < total) {
          const canPush = block.cols[0].length > 0 || block.cols[1].length > 0 || stack.length > 1;
          if (fit === 1 && canPush) fit = 0;
          else if (total - fit === 1 && fit > 1) fit -= 1;
          else if (total - fit === 1 && fit === 1 && canPush) fit = 0;
        }
        if (fit === 0) {
          // **S4.13 (rollbackTrailingHeadings של המקור):** כותרות שנצברו בסוף
          // הטור הנוכחי חוזרות עם הפסקה שלא נכנסה — אחרת הן מתייתמות בתחתית
          // הטור (המקור: tokenIndex -= rollbackTrailingHeadings(targetCol)
          // לפני כל break מפני placeLines=0).
          ti -= rollbackTrailingHeadings();
          // הטור הנוכחי מלא — מעבר לטור השמאלי (בלוק דו-טורי); אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
            continue;
          }
          const anyContent = stack.length > 1 || block.cols[0].length > 0 || block.cols[1].length > 0;
          if (!anyContent) fit = 1; // התקדמות מאולצת — שורה אחת לפחות
          else if (!isH0 && (block.cols[0].length || block.cols[1].length)) {
            // **S4.14 (הוכחה מבנית מהייחוס — אין המשך-מטה בלי span):** בכל
            // 54 עמודי הייחוס אין אף עמוד עם שני בלוקים שאין ביניהם block-h3-span
            // (כל 12 העמודים הרב-בלוקיים — block+span+block בדיוק). כשהעמוד
            // התמלא המקור מותח את הבלוק לתחתית (stretchPageToBottom) ושובר
            // עמוד — לולאת הבלוקים שלו רצה רק כשהטוקן הבא הוא span. ההמשך-מטה
            // של S4.12/S4.13 הכניס תוכן עודף לעמודים מלאים (עמ' 31: ‏80 שורות
            // אצלנו מול 71 בייחוס — 2 פסקאות שלמות הוכנסו בכוח).
            finalizeBlock(block, pending ? pending.token : toks[ti], ti >= toks.length && !pending);
            break fillPage;
          }
          else break fillPage;
        }

        // סמני הערות בשורות המוצבות — חילוץ משותף עם נתיב משיכת הזנב (S4.17).
        // **S4.9:** הערה עשויה להיות מוצמדת למילה שלפניה ("השבוע.[חלוקת...]")
        // — זיהוי לפי אינדקס התוחמים בתוך המילה (כמו findDelimiterMatches
        // במקור), לא רק מילה שלמה שמתחילה ב-[. **תיקון מרובה-הערות במילה:**
        // findNotes מפצל מילה מודבקת לכל ההערות שבה — כל אחת עם סמן משלה.
        const emitted = emitLinesWithMarkers(tok, lines, startIdx, fit);
        const isEnd = startIdx + fit >= lines.length;
        block.cols[block.fill].push({
          kind: 'para', tokenId: tok.id, lines: emitted, from: startIdx,
          isEnd, isCont, hasWindow: hasWindow && !isCont, windowWords, windowW,
          pitch, lhPx: pitch, gapPx: 7,
          sizePt: bodySz, sideNote: (!isCont && tok.sideNote) ? tok.sideNote : null
        });
        block.cursor[block.fill] += fit * pitch;
        // **S4.13 (מרווח לכל חתיקה — כמו ה-DOM של המקור):** p{margin-bottom:7px}
        // חל על **כל** אלמנט <p> — כולל p-cut (חתיכה גזורה) — והגובה שהמקור מודד
        // (scrollHeight) כולל את המרווח של כל חתיקה שהוצבה. הקליברציה של S4.9
        // ("רק בסוף פסקה") עבדה כשחתיכות היו נדירות; עם איזון מפצל-שורות מספרן
        // מתרבה וההפרש (7px לכל גזירה) מצטבר לעמוד שלם — 53 מול 54 בייחוס.
        block.cursor[block.fill] += 7;
        if (isEnd) { pending = null; ti++; }
        else {
          pending = { token: tok, lines, lineIdx: startIdx + fit };
          // הפסקה נחתכה — אם הטור השמאלי עוד פנוי, ממשיכים בו; אחרת עמוד הבא
          if (block.fill === 0 && !isH0 && block.cols[0].length > 0) {
            block.fill = 1;
          } else if (!isH0 && (block.cols[0].length || block.cols[1].length)) {
            // **S4.13 (איזון-והמשך כמו המקור):** חיתוך בטור השמאלי מסיים את
            // **S4.14 (כמו מסלול fit=0 לעיל):** חיתוך פסקה בתחתית הטור
            // השמאלי = העמוד התמלא; המקור מותח את הבלוק לתחתית ושובר עמוד
            // (הוכחה מבנית: אין בלוק-המשך בלי span בכל הייחוס).
            finalizeBlock(block, tok, false);
            break fillPage;
          }
          else {
            break fillPage;
          }
        }
      }

      // **S4.17 (יישור תחתית + משיכת זנב-יתום — כמו המקור):** בסוף כל עמוד
      // שהפרק ממשיך אחריו רצים stretchPageToBottom ואז tryReclaimOrphanTail.
      // בלי זה כל נקודת חיתוך משאירה 1-2 שורות בעמוד הבא — בדיוק הזוגות
      // delete+insert השכנים שנצפו ב-P7 (עמ' 14 שמאל: 45 שורות בייחוס מול 44).
      let sectionEnded = ti >= toks.length && !pending;
      let reclaimed = false;
      if (STRETCH_RECLAIM_ENABLED && !isH0 && !sectionEnded) {
        stretchLastBlockToBottom();
        reclaimed = tryReclaimOrphanTail();
        if (reclaimed) sectionEnded = ti >= toks.length; // pending כבר null
      }
      // סגירת הבלוק האחרון: אם המקטע נגמר — איזון. אחרי משיכת-יתום שסגרה
      // את המקטע המקור אינו מאזן מחדש — המשיכה עצמה היא סוף הפרק.
      if (block && sectionEnded && !reclaimed && !isH0 && (block.cols[0].length || block.cols[1].length)) {
        balanceBlock(block, colBottom() - block.yTop);
      }

      // ---- פריסת המחסנית לעמוד: פסים + בלוקים → טורים עם y מפורש ----
      layoutStack(pg, stack, top);

      // ---- הערות שוליים בתחתית (bottom-anchored) ----
      if (fnQueue.length) {
        placeFootnoteArea(pg, fnQueue);
        // **S4.24 (דיאג):** RED_DEBUG_FN=1 מדפיס לכל עמוד עם הערות את התקציב
        // מול המוצב בפועל (אחרי הפריסה) — כלי אבחון לחפיפות גוף/הערות.
        // אינו משפיע על הפלט.
        if (typeof process !== 'undefined' && process.env && process.env.RED_DEBUG_FN) {
          let bb = 0;
          for (const col of pg.columns) for (const ln of col) bb = Math.max(bb, (ln.y || 0) + (ln.heightPx || 16));
          const placedH = (pg.footnotes || []).reduce((a, f) => a + f.lines.length * GEO.FN_PITCH, 0);
          console.error(`[fn] page=${pages.length - 1} type=${pg.type} reserved=${fnReserved.toFixed(1)} placedH=${placedH.toFixed(1)} fnTop=${(FLOW_BOTTOM - placedH).toFixed(1)} bodyBottom=${bb.toFixed(1)} gap=${((FLOW_BOTTOM - placedH) - bb).toFixed(1)} queue=${fnQueue.length} carry=${pendingFootnotes.length}`);
        }
        // **S4.19 (הזזת אזור ה-h2/h0 כשיש הערות — ה-flex של המקור):** ה-fn-area
        // מוכנס ל-wrapper לפני הפוטר ⇒ ה-flow מתכווץ ⇒ ה-spacer (flex-basis 22%)
        // מתכווץ ב-0.22×גובה-ההערות וכל אזור הכותרת והתוכן זזים למעלה ביחד.
        // ההערות עצמן מעוגנות לתחתית ה-flow ואינן זזות. מיושם רק בעמוד הפתיחה
        // של h2/h0 (שם קיים spacer) ורק כשיש הערות בעמוד (ההוכחה: עמ' 11 —
        // 0.22×105.3=23.2px ≈ הפרש 22.98px שנמדד בין עמ' 11 לעמ' 24/38).
        if (pageIsSectionOpen && (isH0 || isH2) && !pg._h2SpanExempt) {
          const shift = 0.22 * fnReserveFor(fnQueue);
          if (shift > 0.01) {
            for (const b of pg.bands) b.y -= shift;
            for (const col of pg.columns) for (const ln of col) ln.y -= shift;
            for (const mn of pg.marginNotes) {
              mn.anchorY -= shift;
              for (const l of mn.lines) l.y -= shift;
            }
          }
        }
      }
    }
  }

  /** **S4.24: הנחת אזור ההערות בתחתית העמוד — עם תקרת מרזב ופיצול.**
   * מקור יחיד לפריסה בפועל: fnItemsFor (אותו חישוב כמו התקציב — הצדדים
   * אינם יכולים להתפצל). מדיניות split (ברירת המחדל של המקור,
   * long-footnote-policy=split + fn-bar-max-height-px=220): מוצגות לכל היותר
   * ⌈220/16.7⌉=13 שורות בעמוד; הערה שאינה נכנסת נחתכת בגבול שורה — החלק
   * הראשון מונח, השאר עובר לראש התור של העמוד הבא עם cont=true (מוצג
   * '(המשך)'). בלי תקרה (continuous / policy אחרת) — התנהגות המקור: המרזב
   * גדל כרצונו. העיגון לתחתית נשמר (yy = FLOW_BOTTOM − גובה-מוצג). */
  function placeFootnoteArea(pg, queue) {
    if (!queue.length) return;
    pg.fnSep = true;
    const maxLines = Math.max(1, Math.floor((fnSplitEnabled ? fnBarMax : FN_FULL_CAP_PX) / GEO.FN_PITCH));
    // **S6.0 (F7):** תקרה גם במדיניות שאינה split — בלי תקרה המרזב גדל
    // מעל ראש הזרימה (מחוץ לעמוד) והגוף נדחס לתוכו. התקרה במצב שאינו-split
    // היא קיבולת העמוד המלאה (FN_FULL_CAP_PX) — כמו ברירת המחדל.
    // **S4.26 (זרימה רציפה — ברירת המחדל):** כל הערות העמוד זורמות כרצף אחד;
    // הערה הבאה מתחילה באותה שורה שבה הסתיימה קודמתה. המשך מוצג בלי אות
    // סימון. חיתוך בגבול שורה בתקרת הקיבולת; השארית מקובצת לפי הערה —
    // הערה שכבר החלה כאן → המשך (cont), הערה שלא החלה → פריט טרי (עם
    // מספרה הפרקי) בראש תור העמוד הבא.
    if (fnLayoutMode === 'continuous') {
      const built = fnFlowFor(queue);
      const placed = built.flowLines.slice(0, maxLines);
      const rest = built.flowLines.slice(maxLines);
      if (placed.length) {
        const lines = [];
        let yy = FLOW_BOTTOM - placed.length * GEO.FN_PITCH;
        for (const tl of placed) { lines.push({ words: tl, y: yy }); yy += GEO.FN_PITCH; }
        pg.footnotes.push({ continuous: true, lines });
      }
      if (rest.length) {
        const started = new Set();
        for (const tl of placed) for (const t of tl) started.add(t.noteIdx);
        let curIdx = null, curTxt = [];
        const flushRest = () => {
          if (curIdx == null || !curTxt.length) return;
          const src = built.items[curIdx].note || {};
          const began = started.has(curIdx);
          pendingFootnotes.push({
            text: curTxt.join(' '),
            cont: began || !!src.cont,
            num: (!began && src.num != null) ? src.num : undefined,
            srcText: src.srcText || src.text || curTxt.join(' '),
            key: src.key // **S6.0 (F3):** זהות המופע נשמרת גם בהמשך חוצה-עמודים
          });
        };
        for (const tl of rest) {
          for (const t of tl) {
            // **S4.26:** סמנים ו-(המשך) אינם טקסט — המספר נשמר ב-num (והסמן
            // נוסף מחדש בעמוד הבא רק להערה שלא החלה); ההמשך מקבל '(המשך)'
            // מ-fnFlowFor בעמוד הבא לפי cont=true.
            if (t.gap || t.mk || t.t === '(המשך)') continue;
            if (t.noteIdx !== curIdx) { flushRest(); curIdx = t.noteIdx; curTxt = []; }
            curTxt.push(t.t);
          }
        }
        flushRest();
      }
      return;
    }
    const items = fnItemsFor(queue);
    const placed = []; // {note, marker, lines(strings), cont}
    let usedLines = 0;
    for (const it of items) {
      const need = it.lines.length;
      if (usedLines + need <= maxLines) {
        placed.push({ note: it.note, marker: it.marker, lines: it.lines, cont: !!it.note.cont });
        usedLines += need;
        continue;
      }
      if (!fnSplitEnabled) {
        // **S6.0 (F7):** מדיניות שאינה split — הערה שאינה נכנסת לתקציב הנוכחי
        // עוברת שלמה לעמוד הבא (move-whole); הערה גדולה מקיבולת עמוד שלם
        // נחתכת בגבול הפיזי (העמוד אינו יכול להכיל יותר — בעבר הוצבה שלמה
        // והמרזב גלש מעל ראש הזרימה מחוץ לעמוד).
        if (need <= maxLines) {
          pendingFootnotes.push({ text: it.note.text, cont: it.note.cont, num: it.note.num, srcText: it.note.srcText || it.note.text, key: it.note.key });
          continue;
        }
      }
      const remainLines = maxLines - usedLines;
      if (remainLines >= 1) {
        // **S4.9:** השורה הראשונה של כל הערה קצרה ברוחב הסמן — אחרת המילים
        // גולשות מעבר לשפה השמאלית של הדף. הגלישה של ההמשך נעשית מחדש
        // בעמוד הבא (ברוחב הסמן שלו) — הטקסט הוא מה שנשמר, לא השורות.
        placed.push({ note: it.note, marker: it.marker, lines: it.lines.slice(0, remainLines), cont: !!it.note.cont });
        const restText = it.lines.slice(remainLines).join(' ');
        pendingFootnotes.push({ text: restText, cont: true, srcText: it.note.srcText || it.note.text, key: it.note.key });
        usedLines = maxLines;
      } else {
        // אין עוד תקציב במרזב — ההערה כולה עוברת לעמוד הבא (מספרה הפרקי
        // נשמר — S4.26 — כדי שהסמן בגוף וברישום יישארו זהים)
        pendingFootnotes.push({ text: it.note.text, cont: it.note.cont, num: it.note.num, srcText: it.note.srcText || it.note.text, key: it.note.key });
      }
    }
    const totalH = placed.reduce((a, p) => a + p.lines.length * GEO.FN_PITCH, 0);
    let yy = FLOW_BOTTOM - totalH;
    for (const p of placed) {
      const it = { marker: p.marker, lines: [], cont: p.cont };
      for (const l of p.lines) { it.lines.push({ words: String(l).split(' '), y: yy }); yy += GEO.FN_PITCH; }
      pg.footnotes.push(it);
    }
  }

  /** **S4.24 (מקור יחיד לחישוב פריטי ההערות):** אותה הפקה בדיוק — סמן לפי
   * מקום בתור (markerWord(i+1)), רוחבו בגודל הרישום, וגלישה ב-SINGLE_W−רוחב-
   * הסמן — משרתת גם את התקציב (fnReserveFor) וגם את הפריסה בפועל. בעבר
   * השתיים חישבו בנפרד (התקציב מדד את כולם ברוחב הסמן של ההערה הראשונה
   * בלבד) וסטו זו מזו בסמנים ארוכים; כעת הצדדים אינם יכולים להתפצל. */
  function fnItemsFor(queue) {
    // **S4.26:** סמן לפי המספר הפרקי של ההערה (או מקום בתור במצב page);
    // **המשך (cont) — בלי סמן כלל** (דיווח משתמש: "להסיר את אות הסימון מהערה
    // שהיא המשך של הערה מעמוד קודם"). רוחב הסמן בגודל הרישום — כמו שמוצג.
    let pagePos = 0;
    return queue.map((n) => {
      let marker = '', mkW = 0;
      if (!n.cont) {
        const num = (n.num != null) ? n.num : ++pagePos;
        marker = LineBreaker.markerWord(num, cfg.fnNumSeparator);
        mkW = fnApi.measureTextWidth(marker, cfg.fnListingNumSize, 0)
          + fnApi.measureTextWidth(' ', SZ.fnBody, 0);
      }
      const lines = wrapText(n.text, fnApi, SINGLE_W - mkW, SZ.fnBody);
      return { note: n, marker, lines, mkW };
    });
  }

  /** **S4.26 (זרימה רציפה):** כל הערות העמוד זורמות כרצף אחד — הערה הבאה
   * מתחילה באותה שורה שבה הסתיימה קודמתה (כמו continuous-mode של המקור:
   * ‏.note-line{display:inline} + רווח-כפול בין הערות). סמני הערות הטריות
   * מוצגים בגודל הרישום בתוך הזרם; המשך נפתח ב-'(המשך)' בלבד. מחזיר
   * שורות זרימה — כל שורה רשימת טוקנים {t, mk?, gap?, noteIdx} — מקור
   * יחיד לתקציב (fnReserveFor) ולפריסה (placeFootnoteArea). */
  function fnFlowFor(queue) {
    const items = fnItemsFor(queue);
    const spaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
    // רווח-כפול בין הערות (כמו margin-right:1em במקור): טוקן רווח ברוחב 0 —
    // הזוגות סביבו מוסיפים שני רווחי-מילה רגילים (מילה·רווח·[רווח]·רווח·מילה
    // = פעמיים רווח) — אותו דבר ב-DOM (nbsp) וב-PDF (שני גאפים).
    const tokens = [];
    items.forEach((it, i) => {
      if (i > 0) tokens.push({ t: '', gap: true, noteIdx: i, w: 0 });
      if (it.note.cont) {
        const p = '(המשך)';
        tokens.push({ t: p, w: fnApi.measureTextWidth(p, SZ.fnBody, 0), noteIdx: i });
      }
      if (it.marker) {
        tokens.push({ t: it.marker, mk: true, sizePt: cfg.fnListingNumSize, w: fnApi.measureTextWidth(it.marker, cfg.fnListingNumSize, 0), noteIdx: i });
      }
      for (const wd of String(it.note.text).split(/\s+/).filter(Boolean)) {
        tokens.push({ t: wd, w: fnApi.measureTextWidth(wd, SZ.fnBody, 0), noteIdx: i });
      }
    });
    const flowLines = [];
    let cur = [], curW = 0;
    for (const tk of tokens) {
      const tw = tk.w != null ? tk.w : 0;
      const add = tw + (cur.length ? spaceW : 0);
      // **D-92:** רווח-ביטחון התאמת-דפדפן — זרימת ההערות מרונדרת מחדש כבלוק
      // אחד (white-space:normal) ושורה ללא רווח גולשת מתיבתה המתוכננת.
      if (cur.length && curW + add > SINGLE_W - FIT_EPS) { flowLines.push(cur); cur = [tk]; curW = tw; }
      else { cur.push(tk); curW += add; }
    }
    if (cur.length) flowLines.push(cur);
    return { items, flowLines };
  }

  function fnReserveFor(queue) {
    if (!queue.length) return 0;
    // **S4.13 (כיול מהייחוס):** אותה נוסחת גלישה כמו הרינדור בפועל (השורה
    // הראשונה קצרה ברוחב הסמן) — הצדדים חייבים להסכים על מספר השורות.
    let total = fnItemsFor(queue).reduce((a, it) => a + it.lines.length * GEO.FN_PITCH, 0);
    // **S4.26 (זרימה רציפה):** שורות הזרימה המשותפת — מקור יחיד (fnFlowFor).
    if (fnLayoutMode === 'continuous') {
      total = fnFlowFor(queue).flowLines.length * GEO.FN_PITCH;
    }
    // **S4.24 (תקרת המרזב):** במצב block עם מדיניות split המרזב מוגבל
    // ב-fn-bar-max-height-px — התקציב מכסה רק את מה שיוצג בעמוד; השאר
    // נפצל לעמוד הבא (pendingFootnotes) ואינו מכפיל את השמורה.
    if (fnSplitEnabled) total = Math.min(total, fnBarMax);
    else total = Math.min(total, FN_FULL_CAP_PX); // **S6.0 (F7):** תקרה גם בלי split
    // **S4.14 (תקרה מגובה הזרימה של הייחוס):** גובה body-flow בפועל לכל עמוד
    // עם הערות, מתוויות הייחוס: ‏4 שורות→810 (שמורה 105), 2→843 (72),
    // 6→778 (137), 1→860 (55), 8→741 (174). השיפוע = FN_PITCH (16.7) בדיוק,
    // והתקרה = 915−810−66.8 = 38.2 (טווח 36.8–40.4 בכל 9 נקודות המדידה).
    // הערך הקודם 48 חתך את הגוף 9.5px מוקדם מדי בכל עמוד עם הערות — בעמ' 11
    // זה בדיוק השורה החסרה בבלוק התחתון (117 מול 136 בייחוס).
    return total + 38.5;
  }

  /**
   * **S4.13: פורט נאמן של balanceColumns מהמקור (typesetter.js הצהוב, שורות 1327-1560).**
   *
   * האיזון הקודם (S4.9-S4.12) חילק יחידות שלמות בלבד — והוכח כקטסטרופלי כשהבלוק
   * נפתח בכותרת: [h4 | כל-השאר] (h4 לבד בטור הימני, 26px מול ~600px) — בדיוק ההפך
   * מהמקור שמפצל פסקאות בגבולות **שורות**. המקור:
   *
   *   1. איחוי חלקי אותו טוקן (p-cut + המשך) לפריט אחד עם כל השורות.
   *   2. מועמדים {i, l}: פריטים 0..i-1 שלמים בימין; אם l>0 גם l שורות ראשונות של
   *      פריט i בימין והשאר בשמאל. חוקיות: minFirst=minLast=2 (אין שורה בודדת
   *      בתחילת/סוף חיתוך), וכותרת לא נשארת עם שורה אחת בלבד (prevIsHeading && l<2).
   *      בנוסף {i+1, 0} אחרי כל פסקה — הימני מסתיים בסוף פסקה שלמה.
   *   3. ציון (better של המקור): נכנס-בגובה > גלישה מינימלית > |rH−lH| מינימלי >
   *      בשוויון — טור ימני גבוה יותר. המקור מוצא את נקודת המעבר בחיפוש בינארי
   *      על מונוטוניות rH−lH וסורק ±3 (ומרחיק עד 80 אם אף מועמד לא נכנס); כאן
   *      הגבהים אריתמטיים וסריקה מלאה מוצאת את אותו מיטב בדיוק.
   *   4. החלק הימני של פסקה מפוצלת = p-cut (שורתו האחרונה מיושרת); השמאלי =
   *      המשך (בלי חלון). אם אין אף מועמד — המילוי המקורי נשמר (כמו המקור).
   */
  function balanceBlock(block, availH) {
    // ---- 1. איחוי חלקי אותו טוקן (כמו mergedItems במקור) ----
    const units = [...block.cols[0], ...block.cols[1]];
    if (!units.length) { block.split = null; return; }
    const items = [];
    for (const u of units) {
      const last = items[items.length - 1];
      if (u.kind === 'para' && last && last.kind === 'para' && last.tokenId === u.tokenId) {
        last.lines.push(...u.lines);
        last.isEnd = u.isEnd; // דגל הסוף מהחתיכה המאוחרת (cut נשאר cut)
      } else if (u.kind === 'para') {
        items.push({ ...u, lines: [...u.lines] });
      } else {
        items.push(u);
      }
    }
    // ---- 2. מועמדים חוקיים (getSplitRules: minFirst=minLast=2) ----
    const cands = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind !== 'para') continue;
      const n = items[i].lines.length;
      const prevIsHeading = i > 0 && items[i - 1].kind === 'heading';
      for (let l = 1; l < n; l++) {
        if (l < 2 || n - l < 2) continue;      // אין שורה בודדת בתחילת/סוף חלק
        if (prevIsHeading && l < 2) continue;  // כותרת + שורה אחת בלבד (מכוסה ב-l≥2)
        cands.push({ i, l });
      }
      cands.push({ i: i + 1, l: 0 }); // הימני מסתיים בסוף פסקה שלמה — לא בכותרת
    }
    if (!cands.length) { block.split = null; return; } // כותרות בלבד — המילוי נשמר
    // ---- 3. הערכת מועמד (גבהים אריתמטיים; unitH = הקליברציה שלנו) ----
    const evalC = (c) => {
      let rH = 0, lH = 0;
      for (let k = 0; k < c.i; k++) rH += unitH(items[k]);
      if (c.l > 0) {
        const it = items[c.i];
        // **S4.17:** פס/מרווח מהיחידה (lhPx/gapPx) — עקבי עם unitH גם אחרי מתיחה
        rH += c.l * (it.lhPx != null ? it.lhPx : it.pitch) + (it.gapPx != null ? it.gapPx : 7); // p-cut — גם הוא <p>
        lH += (it.lines.length - c.l) * (it.lhPx != null ? it.lhPx : it.pitch) + (it.gapPx != null ? it.gapPx : 7);
        for (let k = c.i + 1; k < items.length; k++) lH += unitH(items[k]);
      } else {
        for (let k = c.i; k < items.length; k++) lH += unitH(items[k]);
      }
      return { rH, lH, diff: rH - lH, abs: Math.abs(rH - lH) };
    };
    const cap = (availH != null && isFinite(availH)) ? availH : Infinity;
    let best = null, bestC = null;
    const better = (a, b) => { // better(a, b) — a עדיף על b (העתק מדויק מהמקור)
      if (a.fits !== b.fits) return a.fits;
      if (!a.fits) return a.over < b.over;
      if (a.abs !== b.abs) return a.abs < b.abs;
      return a.diff >= 0 && b.diff < 0; // שוויון: עדיפות לטור ימני גבוה יותר
    };
    for (const c of cands) {
      const e = evalC(c);
      const cand = { fits: Math.max(e.rH, e.lH) <= cap + 0.01, over: Math.max(e.rH, e.lH), abs: e.abs, diff: e.diff };
      if (!best || better(cand, best)) { best = cand; bestC = c; }
    }
    // ---- 4. החלה: פיצול הפריט בגבול השורה שנבחר ----
    const c = bestC;
    const r = [], l = [];
    for (let k = 0; k < c.i; k++) r.push(items[k]);
    if (c.l > 0) {
      const it = items[c.i];
      // החלק הימני: p-cut — isEnd=false; החלון נשאר בשורה הראשונה (כמו createDropWord)
      r.push({ ...it, lines: it.lines.slice(0, c.l), isEnd: false, hasWindow: it.hasWindow && !it.isCont });
      // החלק השמאלי: המשך — isCont=true, בלי חלון (הגליף כבר בימין), ובלי
      // הערת-צד — **S4.13 (תיקון כפילות):** ההערה מוצמדת לפסקה במופעה
      // הראשון (הטור הימני); ה-spread העתיק אותה גם להמשך והיא הודפסה
      // פעמיים — בשני טורי השוליים (נצפה בעמ' 11: הערת h7#1 בשני הצדדים).
      l.push({ ...it, lines: it.lines.slice(c.l), isCont: true, hasWindow: false, sideNote: null, from: it.from + c.l });
      for (let k = c.i + 1; k < items.length; k++) l.push(items[k]);
    } else {
      for (let k = c.i; k < items.length; k++) l.push(items[k]);
    }
    block.split = { r, l };
    // **S4.9:** ה-cursor מתעדכן לתחתיות האמיתיות — אחרי האיזון מיקום הפס/הבלוק
    // הבא (blockBottom) היה מחושב מהמילוי הקודם וחופף את זנב הטור המאוזן.
    const e = evalC(c);
    block.cursor[0] = block.yTop + e.rH;
    block.cursor[1] = block.yTop + e.lH;
  }

  function unitH(u) {
    if (u.kind === 'heading') return u.h;
    // **S4.13:** כל חתיקת <p> — כולל p-cut — נושאת מרווח 7px בגובה הטור (DOM)
    // **S4.17:** המרווח והפס נשלפים מהיחידה עצמה — אחרי מתיחה/כיווץ (lhPx/gapPx)
    // הם עשויים לסטות מהבסיס (pitch/7).
    return u.lines.length * (u.lhPx != null ? u.lhPx : u.pitch) + (u.gapPx != null ? u.gapPx : 7);
  }

  /** **S4.17:** הגובה הכולל של טור (סדרת יחידות). */
  function colHeightUnits(units) {
    let h = 0;
    for (const u of units) h += unitH(u);
    return h;
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
      // **S4.14 (דיאג גיאומטריה):** dump של מבנה הבלוקים להשוואה מול תוויות
      // הייחוס (block-2col W×H | col:right Np Nl Kw) — מופעל רק עם
      // RED_DEBUG_BLOCKS=1 ואינו משפיע על הפלט.
      if (typeof process !== 'undefined' && process.env && process.env.RED_DEBUG_BLOCKS) {
        const cnt = (units) => ({
          p: units.filter(u => u.kind === 'para').length,
          l: units.filter(u => u.kind === 'para').reduce((a, u) => a + u.lines.length, 0),
          h: units.filter(u => u.kind === 'heading').map(u => 'h' + u.level).join(','),
          w: units.filter(u => u.kind === 'para' && u.hasWindow).length,
        });
        pg._blocks = pg._blocks || [];
        pg._blocks.push({ yTop: Math.round(block.yTop*10)/10, r: cnt(rUnits), l: cnt(lUnits), rH: Math.round((ry-block.yTop)*10)/10, lH: Math.round((ly-block.yTop)*10)/10, split: !!block.split });
      }
    }
    if (typeof process !== 'undefined' && process.env && process.env.RED_DEBUG_BLOCKS && stack.some(s => s.type === 'span')) {
      pg._blocks = pg._blocks || [];
      for (const s of stack) if (s.type === 'span') pg._blocks.push({ span: true, y: Math.round(s.y*10)/10, h: s.h });
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
    const uLh = u.lhPx != null ? u.lhPx : u.pitch;   // **S4.17:** פס בפועל (אחרי מתיחה/כיווץ)
    const uGap = u.gapPx != null ? u.gapPx : 7;       // **S4.17:** מרווח בפועל (7 + padding עד 9)
    for (const ln of u.lines) {
      const lineIdxGlobal = u.from + i;
      col.push({
        words: ln.words.slice(),
        markerIdx: ln.markerIdx || [],
        parenFlags: ln.parenFlags || null,
        parenStarts: ln.parenStarts || null,
        parenEnds: ln.parenEnds || null,
        sizePt: u.sizePt, heightPx: uLh, kind: 'paragraph',
        isLast: u.isEnd && i === u.lines.length - 1,
        tokenId: u.tokenId,
        window: !!(u.hasWindow && lineIdxGlobal < 2),
        windowWords: (u.hasWindow && lineIdxGlobal === 0) ? u.windowWords : null,
        // **S4.26 (חלון קלאסי שקוע):** רוחב החלון נישא גם על שורה 1 — הטקסט
        // עוטף את מילת-החלון בשתי השורות הראשונות (כמו float:right עם
        // height:1.25em במקור), לא רק בשורה הראשונה.
        windowW: (u.hasWindow && lineIdxGlobal < 2) ? (u.windowW || 0) : null,
        y, paraId: u.tokenId, lineIdx: lineIdxGlobal
      });
      y += uLh;
      i++;
    }
    y += uGap; // **S4.13:** מרווח 7px אחרי כל חתיקת <p> (כולל p-cut) — כמו ה-DOM של המקור
    if (u.sideNote) {
      // **S4.13 (תיקון עיגון):** ה-anchor חייב להיות **ראשית הפסקה** — הוא
      // חושב אחרי ה-+=7 של מרווח הפסקה ונספג 7px למטה (נצפה: הערת-הצד
      // בעמ' 11 עוגנה 331pt במקום ~325.7 — ראשית הפסקה; הייחוס: 323.2).
      const anchor = y - uGap - u.lines.length * uLh;
      // **S4.13:** הגלישה בגופן HadassahFriedlaender וברוחב טור השוליים המלא
      // (50.5px — הוכח מהייחוס: השורה הארוכה ביותר 'חילוקי משמעות' = 50.4px;
      // היה −2px שחתך אותה).
      const lines = wrapText(u.sideNote, marginApi, GEO.MARGIN_W, SZ.marginNote);
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
      pg._secStartLevel = 1; // **EXT-15:** שער-משנה נפתח כמקטע h1
      pg._h1Token = t;
      pg.gateLines = gateLinesFor('shaar-sub', t);
      currentH1 = t.text.split(/[-–—]/)[0].trim();
      continue;
    }
    flowSection(sec);
  }

  // **S4.24 (שימור תוכן — שטיפת המשכים אחרונים):** המשכי הערות שנקצצו בתקרת
  // המרזב ונותרו אחרי הטוקן האחרון מוצגים בעמודי המשך ייעודיים — לעולם לא
  // מאבדים שורת הערה. כל עמוד כזה מציג לפחות שורה אחת (usedLines=0 בפתיחה)
  // ולכן הלולאה מתכנסת תמיד.
  while (pendingFootnotes.length) {
    const pg = newPage('regular');
    setHeader(pg, currentH2);
    placeFootnoteArea(pg, pendingFootnotes.splice(0));
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
    // **S6.0 (F5 — עטיפת שורות TOC):** שורות ה-TOC מעולם לא נמדדו ברוחב —
    // כותרת ארוכה (180 תווים) הוצגה כשורה אחת של 1,524px וגלשה ~800px מחוץ
    // לעמוד. כעת כל שורה נעטפת לרוחב הפנוי (x1 − מספרים − 10) בפסים של 26px
    // (תיבת השורה); גובה השורה גדל והמילוי/המתיחה מתחשבים בו אוטומטית.
    // המדידה בגוף הטקסט ×0.92 — שולי-ביטחון לגופן הכותרות הרחב (DavidLibre-Bold).
    const wrapTocRow = (text, sizePt, w) => {
      const ws = String(text || '').split(/\s+/).filter(Boolean);
      const out = [];
      let cur = '';
      for (const wd of ws) {
        const cand = cur ? cur + ' ' + wd : wd;
        if (!cur || api.measureTextWidth(cand, sizePt, 0) <= w - FIT_EPS) cur = cand;
        else { out.push(cur); cur = wd; }
      }
      if (cur) out.push(cur);
      return out.length ? out : [''];
    };
    const rows = entries.map(e => {
      const sizePt = SZ.tocLevel[e.level] || 10.5;
      const x1 = GEO.TOC_TITLE_X1 - (e.level - 1) * GEO.TOC_STAIR;
      const availW = Math.max(40, (x1 - GEO.TOC_NUM_X - 10) * 0.92);
      const lines = wrapTocRow(e.text, sizePt, availW);
      return {
        ...e, sizePt, x1, lines,
        h: tocRowH(e.level) + Math.max(0, lines.length - 1) * 26
      };
    });
    // יחידות: h1 בודד; h2 + כל ה-h3..h6 שאחריו עד ה-h2 הבא
    const units = [];
    for (const r of rows) {
      if (r.level <= 2 || !units.length) units.push([r]);
      else units[units.length - 1].push(r);
    }
    const pagesRows = [];
    let curRows = [], curH = 0, first = true;
    // **S5.2 (מיפוי מוקשים F1 — עימוד תוכן-העניינים):** הקיבולת חושבה מ-GEO.FLOW_H
    // (702px עמוד ראשון / 915px המשך) בעוד שהשורות ממוקמות בפועל בין
    // TOC_FIRST_TOP/TOC_CONT_TOP לבין TOC_STRETCH_BOTTOM — כלומר 635/892px
    // בלבד. ה-67/23px העודפים אפשרו דחיסה שדרסה שורות את שורות (מרווח 15.9px
    // מול תיבת שורה 26px), התנגשות עם אזור הפוליו ואף שורות שירדו מתחת לתחתית
    // העמוד. בנוסף, אצווה אטומית (h2 + כל תתי-הרשומות) שגדולה מהקיבולת הוצבה
    // בכל זאת כשהעמוד ריק (ללא חלוקה). תוקן: קיבולת מהקבועים המכוילים בפועל,
    // ואצווה גדולה מעמוד נחלקת בגבולות שורות בין עמודי ה-TOC.
    const availOf = (f) => TOC_STRETCH_BOTTOM - (f ? TOC_FIRST_TOP : TOC_CONT_TOP);
    for (const u of units) {
      const uH = u.reduce((a, r) => a + r.h, 0);
      let avail = availOf(first);
      if (curH + uH > avail && curRows.length) { pagesRows.push({ rows: curRows, first }); curRows = []; curH = 0; first = false; avail = availOf(false); }
      if (uH > avail && !curRows.length) {
        // אצווה אטומית גדולה מעמוד שלם — פיצול בגבולות שורות (עדיף על דריסה/גלישה)
        for (const r of u) {
          if (curH + r.h > avail && curRows.length) { pagesRows.push({ rows: curRows, first }); curRows = []; curH = 0; first = false; avail = availOf(false); }
          curRows.push(r); curH += r.h;
        }
        continue;
      }
      curRows.push(...u); curH += uH;
    }
    if (curRows.length) pagesRows.push({ rows: curRows, first });
    return pagesRows.map((pr, pi) => {
      const pg = blankPageObj(kind);
      pg.headerSlots = { right: hdrR, center: title, left: hdrL };
      const isLast = pi === pagesRows.length - 1;
      // **S4.14:** מיקומי ה-TOC אבסולוטיים ומכוילים בפני עצמם (עמודי ה-TOC של
      // הייחוס מתחילים ב-113.6px — שונה מזרימת הגוף!) ואינם זזים עם FLOW_TOP.
      const top = pr.first ? TOC_FIRST_TOP : TOC_CONT_TOP;
      const rowYs = [];
      if (!isLast && pr.rows.length > 1) {
        // **S5.2 (F1):** רצפה למרווח המתיחה — לא קטן מגובה השורה המרבי בעמוד;
        // ואם הרצפה דוחפת את השורה האחרונה מעבר לתחתית אזור המתיחה — מערך טבעי
        // (מוכרח להיכנס: סכום הגבהים ≤ הקיבולת). בלי הרצפה ה-gap ירד עד ~6px
        // והשורות נדרסו זו על זו.
        // **S6.0 (F6 — המתיחה המתה):** naturalGap לא ניכה את גובה השורה
        // האחרונה ⇒ lastTop הגיע תמידית ל-BOTTOM בדיוק והתנאי
        // (lastTop ≤ BOTTOM − hLast + 0.5) לא כלל לא התקיים (hLast≥20) —
        // עמודי TOC דלילים נערמו מלמעלה בלי מתיחה, בניגוד לכוונת S5.2
        // ("אזור המתיחה" של הייחוס). תוקם הנוסחה — השורה האחרונה נכנסת
        // בדיוק לתחתית והמתיחה מופעלת בעמודים דלילים (עם רצפת maxH).
        const maxH = Math.max.apply(null, pr.rows.map(r => r.h));
        const hLast = pr.rows[pr.rows.length - 1].h;
        const naturalGap = (TOC_STRETCH_BOTTOM - top - hLast) / (pr.rows.length - 1);
        const gap = Math.max(naturalGap, maxH);
        const lastTop = top + (pr.rows.length - 1) * gap;
        if (lastTop <= TOC_STRETCH_BOTTOM - hLast + 0.5) {
          pr.rows.forEach((r, i) => rowYs.push(top + i * gap));
        } else {
          let yy = top;
          for (const r of pr.rows) { rowYs.push(yy); yy += r.h; }
        }
      } else {
        let yy = top;
        for (const r of pr.rows) { rowYs.push(yy); yy += r.h; }
      }
      pg.toc = {
        title: pr.first ? title : null,
        rows: pr.rows.map((r, i) => ({
          tokenId: r.tokenId, level: r.level, text: r.text, lines: r.lines, sizePt: r.sizePt, y: rowYs[i],
          folio: '',
          x1: r.x1 != null ? r.x1 : GEO.TOC_TITLE_X1 - (r.level - 1) * GEO.TOC_STAIR
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
  const detPages = cfg.enableDetailedToc && detEntries.length ? makeTocPages('toc-detailed', detEntries, 'תוכן עניינים מפורט') : [];

  // **S5.2 (מיפוי מוקשים F2 — הערות סיום בנתיב המורשת):** שורות "הערת סיום - …"
  // (en-line-prefix של המקור; המפתח קיים ב-default_settings של כל 8 קובצי
  // המקור) נצרכו בטוקניזציה ל-token.endNote — אך אף קוד מעולם לא קרא אותו:
  // התוכן אבד בשקט. כאן נבנים עמודי הערות-הסיום בסוף הספר: כותרת
  // (fn-title-text) בעמוד הראשון, שני טורים (COL_W), סמן גימטריה רציף
  // בגודל הרישום + גוף ההערה ב-FRL 8.5pt — אותם כללי עטיפה כמו רשימת
  // ההערות (wrapText ברוחב טור−סמן, FIT_EPS בכל נקודות השבירה). המשך
  // חתוך בין עמודים/טורים מסומן '(המשך)' — כמו זרימת ההערות.
  const endNoteTokens = tokens.filter(t => t.type === 'p' && t.endNote);
  const endnotePagesBuilt = [];
  if (endNoteTokens.length) {
    const EN_TITLE_H = 44;
    const mkSpaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
    let enPg = null, enCol = 0, enY = 0, enFirst = true;
    const openEndPage = () => {
      enPg = newPage('endnotes');
      setHeader(enPg, cfg.fnTitleText);
      enPg._enFirst = enFirst;
      if (enFirst) enPg.bands.push({ kind: 'endnote-title', text: cfg.fnTitleText, sizePt: SZ.h2, y: GEO.FLOW_TOP, h: EN_TITLE_H, tokenId: null });
      enCol = 0; enY = GEO.FLOW_TOP + (enFirst ? EN_TITLE_H : 0);
      endnotePagesBuilt.push(enPg);
    };
    const nextColOrPage = () => {
      if (enCol === 0) { enCol = 1; enY = GEO.FLOW_TOP + (enPg._enFirst ? EN_TITLE_H : 0); return true; }
      enFirst = false; openEndPage(); return true;
    };
    openEndPage();
    endNoteTokens.forEach((tok, ni) => {
      const marker = LineBreaker.markerWord(ni + 1, cfg.fnNumSeparator);
      const mkW = fnApi.measureTextWidth(marker, cfg.fnListingNumSize, 0) + mkSpaceW;
      const contW = fnApi.measureTextWidth('(המשך)', cfg.fnListingNumSize, 0) + mkSpaceW;
      const noteLines = wrapText(tok.endNote, fnApi, GEO.COL_W - Math.max(mkW, contW), SZ.fnBody);
      let li = 0, seg = 0;
      while (li < noteLines.length) {
        const room = Math.floor((FLOW_BOTTOM - enY) / GEO.FN_PITCH);
        if (room <= 0) { nextColOrPage(); continue; }
        // אטומיות: הערה שלמה בעמוד-טור אחד כשהיא נכנסת; אחרת חלוקה בגבולות שורות
        const need = noteLines.length - li;
        if (need > room && need <= Math.floor((FLOW_BOTTOM - (GEO.FLOW_TOP + (enPg._enFirst && enCol === 0 ? EN_TITLE_H : 0))) / GEO.FN_PITCH)) {
          nextColOrPage(); continue; // מעבר לטור/עמוד פנוי — וההערה תיכנס שלמה
        }
        const take = Math.min(room, need);
        for (let k = 0; k < take; k++, li++) {
          const words = String(noteLines[li]).split(' ').filter(Boolean);
          let markerIdx = [];
          if (k === 0) {
            const head = seg === 0 ? marker : '(המשך)';
            words.unshift(head);
            markerIdx = [0];
          }
          enPg.columns[enCol].push({
            words, markerIdx, parenFlags: null, parenStarts: null, parenEnds: null,
            sizePt: SZ.fnBody, heightPx: GEO.FN_PITCH, kind: 'paragraph',
            isLast: li === noteLines.length - 1,
            tokenId: tok.id, window: false, windowWords: null,
            y: enY, paraId: null, lineIdx: null, align: null
          });
          enY += GEO.FN_PITCH;
        }
        if (li < noteLines.length) { seg++; nextColOrPage(); }
      }
    });
  }
  const subIdx = bodies.findIndex(p => p.type === 'shaar-sub');
  const before = subIdx >= 0 ? bodies.slice(0, subIdx + 1) : [];
  const after = subIdx >= 0 ? bodies.slice(subIdx + 1) : bodies;

  // **EXT-15 (פתיחה בעמוד אי-זוגי לפי רמת כותרת — ensureOddPageStart של
  // המקור):** הליכה על הסדר הסופי (ההרכבה מזיזה עמודי TOC — מצב הזרימה
  // אינו המקום); לפני עמוד פתיחת-מקטע מסומן (h0/h1/h2) שהיה נוחת באינדקס
  // אי-זוגי (עמוד זוגי פיזי = גב) — מוכנס עמוד ריק. מחליף את המקרה הפרטי
  // של שער-המשנה (needBlank) בכלל הכללי; ברירות המחדל של המקור:
  // odd-h0=true, odd-h1=true, odd-h2=false.
  const seq = [...gates, ...genPages, ...before, ...detPages, ...after, ...endnotePagesBuilt];
  const final = [];
  for (const p of seq) {
    if (p._secStartLevel != null) {
      const need = p._secStartLevel === 0 ? cfg.oddH0
        : p._secStartLevel === 1 ? cfg.oddH1
        : p._secStartLevel === 2 ? cfg.oddH2 : false;
      if (need && final.length % 2 === 1) final.push(blankPageObj('blank'));
    }
    final.push(p);
  }

  // מספור סופי + folios + אינדקסים
  let pn = 1;
  for (const p of final) {
    const counted = ['toc-general', 'toc-detailed', 'blank', 'shaar-sub', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.pageNumber = counted ? pn++ : null;
    const shows = ['toc-general', 'toc-detailed', 'regular', 'sign-open', 'preface'].includes(p.type);
    p.folioDisplay = shows && p.pageNumber ? toGematria(p.pageNumber) : '';
  }
  final.forEach((p, i) => { p.index = i; });
  // **EXT-19 (כותרות מתחלפות — hdr-alternating):** בעמודים זוגיים-פיזיים
  // (אינדקס אי-זוגי) חצאי שם הספר מתחלפים בין הצדדים — כמו buildHeaderGridHTML
  // של המקור (isEven ⇒ החלפה). ברירת המחדל כבויה — החצאים קבועים.
  if (cfg.hdrAlternating) {
    for (const p of final) {
      if (p.index % 2 === 1 && p.headerSlots) {
        const h = p.headerSlots;
        p.headerSlots = { right: h.left, center: h.center, left: h.right };
      }
    }
  }

  // folio של כל כותרת = העמוד שבו היא הוצבה
  const folioByToken = new Map();
  for (let pi = 0; pi < final.length; pi++) {
    const p = final[pi];
    // **S4.13 (פוליו ה-TOC של כותרת 1 — כמו getTocPageLabel במקור):** לעמוד
    // השער של ה-h1 אין פוליו מודפס; המקור נופל שם ל- toGematria(data-page-index)
    // — ההוכחה מהייחוס: הערך הראשון בתוכן-העניינים הכללי (ה-h1 "הקדמות
    // וכללים") מסומן "ו" = גימטריה של מיקום עמוד השער (0-מבוסס 6), בעוד
    // לעמוד עצמו אין פוליו כלל. שאר הכותרות: הפוליו המודפס של עמודן.
    if (p._h1Token) folioByToken.set(p._h1Token.id, p.folioDisplay || toGematria(pi));
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
  const layoutHashValue = 'legacy-' + legacyLayoutHashDigest(pages);
  // **תיקון S4.10 (חוזה התוצאה בנתיב החי):** לפני כן הוחזרו ledger: null, events: null
  // ופגעו ב-serializeTypesetResult/buildReport של ה-worker — כל בקשת עימוד
  // באפליקציה החיה קרסה ("Cannot read properties of undefined (reading 'length')")
  // והדף הציג 0 עמודים. כעת מוחזרים EventLog/Ledger אמיתיים (מינימליים,
  // דטרמיניסטיים) — הסריאליזציה, הדוח ותצוגת הממצאים עובדים בשני המנועים.
  const events = new EventLog('minimal');
  events.emit('parse', 'legacy-imud: tokenize + sections', { tokens: tokensOut.length });
  events.emit('measure', 'legacy-imud: line breaking', { impl: settings['measure-impl'] || 'table' });
  events.emit('page-plan', 'legacy-imud: flow + columns', { pages: pages.length });
  events.emit('folio', 'legacy-imud: folios + TOC', {});
  events.emit('render', 'legacy-imud: result', { layoutHash: layoutHashValue });
  const ledger = new Ledger();

  // **S5.2 (מיפוי מוקשים S1 — חשבונאות שימור תוכן אמיתית לנתיב החי):** עד כאן
  // הוחזר contentPreserved: true קבוע-קשה — כל רגרסיה בזרימת ההערות/המשכים/
  // הטוקנים עברה בשקט (הבדיקות שהחזיקו בדגל היו טאוטולוגיות — המחלק של
  // D-30 קיים רק בנתיב ה-DP). כעת: מולטיסט מילות מקור (מטא-דאטה + כל
  // הטוקנים: גוף, כותרות, הערות-צד, הערות-סיום) מול מולטיסט פלט (שורות
  // העמודים: גוף+כותרות+חלונות+הערות-שוליים+הערות+הערות-סיום+שערים;
  // בלי תוכן-עניינים ובלי פוליו — הם תוספות/העתקות של המנוע). יעד: כל מילת
  // מקור מופיעה בפלט לפחות כמספר הופעותיה במקור; סמנים/(המשך)/גימטריה
  // שהמנוע מוסיף אינם נספרים כחובה. כשל ⇒ ממצא high ב-ledger + דגל שקרי.
  const contentStats = (() => {
    const norm = (s) => String(s == null ? '' : s).split(/[\s\u00A0]+/).filter(Boolean);
    const bump = (m, words) => { for (const w of words) m.set(w, (m.get(w) || 0) + 1); };
    const src = new Map();
    // **S5.2:** שדה השנה/מקום (meta.year) אינו מוצג בשער המכויל-ייחוס — כמו
    // בתוכנת המקור. לכן אינו נספר כחובת-תוכן.
    // **S6.0 (F16):** שדות השער האחורי בלבד (copyright/publisher/contact/extra)
    // נספרים כחובה רק כשהשער האחורי מוצג — בלי זה ביטול show-back-shaar
    // גרם לדגל אובדן-תוכן שקרי (8 מילים חסרות בקורפוס ללא _imudRaw).
    const backOnlyFields = ['copyright', 'publisher', 'contact', 'extra'];
    for (const [mk, mv] of Object.entries(meta)) {
      if (mk === 'year') continue;
      if (!cfg.showBackShaar && backOnlyFields.includes(mk)) continue;
      bump(src, norm(mv));
    }
    // **S5.2:** מסיר את תוחמי ההערה ([ ]) מצד המקור — המנוע מחלץ את גוף
    // ההערה מבלי לכלול את התוחמים בפלט (הם תחביר, לא תוכן).
    const srcTextOf = (t) => {
      let s = String(t.text == null ? '' : t.text);
      if (cfg.fnOpen) s = s.split(cfg.fnOpen).join(' ');
      if (cfg.fnClose) s = s.split(cfg.fnClose).join(' ');
      // **S5.2:** כותרת h1 מפוצלת בשער-המשנה לכותרת + משנה (split לפי
      // המקף; join(' - ') לשאר) — מקף-ההפרדה הראשון הוא תחביר עימוד,
      // כמו קידומת 'כותרת N -'. משקפים את אותה טרנספורמציה בצד המקור.
      if (t.type === 'h1') {
        const parts = s.split(/[-–—]/).map(x => x.trim()).filter(Boolean);
        if (parts.length >= 2) s = parts[0] + ' ' + parts.slice(1).join(' - ');
      }
      // **S6.0 (F12):** כותרת h2 שמתחילה ב'סימן א - ' — המנוע מסיר את הקידומת
      // ברינדור (:1017) אך צד המקור לא שיקף זאת ⇒ מילת המקף נספרה חסרה
      // (דגל שקרי). עתה אותה טרנספורמציה בשני הצדדים.
      if (t.type === 'h2') {
        s = s.replace(/^סימן\s+[א-ת]+[:\-–—\s]*/i, '').trim();
      }
      return s;
    };
    for (const t of tokens) {
      bump(src, norm(srcTextOf(t)));
      if (t.sideNote) bump(src, norm(t.sideNote));
      if (t.endNote) bump(src, norm(t.endNote));
    }
    const out = new Map();
    const addText = (s) => bump(out, norm(s));
    // **S6.0 (F10):** תוחמי הערה לא-מאוזנים ([ בלי ]) — הפלט מציג את המילה
    // עם התוחם הגולמי ('[הערה') בעוד צד המקור מפשט את שני התוחמים ⇒ מילה
    // נספרה חסרה (דגל שקרי). עתה הפלט מפושט באותם תוחמים לפני הספירה —
    // סימטריה מלאה בין הצדדים, בלי תלות באיזון הסוגריים.
    const stripNoteDelims = (s) => {
      let t = String(s == null ? '' : s);
      if (cfg.fnOpen) t = t.split(cfg.fnOpen).join(' ');
      if (cfg.fnClose) t = t.split(cfg.fnClose).join(' ');
      return t;
    };
    const addWords = (ws) => { if (!ws) return; for (const w of ws) addText(stripNoteDelims(w && w.t != null ? w.t : w)); };
    for (const p of pages) {
      for (const col of p.columns || []) for (const ln of col) {
        addWords(ln.words); addWords(ln.windowWords);
      }
      for (const it of p.footnotes || []) {
        if (it.marker) addText(it.marker);
        for (const ln of it.lines || []) addWords(ln.words);
      }
      for (const mn of p.marginNotes || []) for (const ln of mn.lines || []) addText(ln.text);
      for (const b of p.bands || []) addText(b.text);
      for (const g of p.gateLines || []) addText(g.text);
      // תוכן-העניינים (p.toc) והפוליו לא נספרים — העתקות/מספור של המנוע
    }
    const missing = [];
    let srcTotal = 0, outTotal = 0;
    for (const [w, c] of src) {
      srcTotal += c;
      const oc = out.get(w) || 0;
      if (oc < c) missing.push(`${w} (${oc}/${c})`);
    }
    for (const c of out.values()) outTotal += c;
    return { sourceWords: srcTotal, outputWords: outTotal, missing };
  })();
  const contentPreservedFlag = contentStats.missing.length === 0;
  if (!contentPreservedFlag) {
    ledger.create('content-loss', 'legacy-flow', 0,
      { missing: contentStats.missing.length, sample: contentStats.missing.slice(0, 8).join(', ') },
      'legacy-flow');
    events.emit('render', 'legacy-imud: אובדן תוכן — החשבונאות אדומה', {
      missing: contentStats.missing.length,
      sample: contentStats.missing.slice(0, 8).join(', ')
    });
  }

  // **EXT-4 (שארית — S4.21): חיבור ornament-plan לנתיב ה-legacy.** רץ אחרי
  // חישוב ה-hash — overlay בלבד (אינווריאנט T1; דפוס D-47). ברירות המחדל
  // של המקור = 'none' לכל עיטור ⇒ אפס rectים ואפס השפעה; החיבור מוכיח את
  // עצמו רק כשההגדרות מזמנות עיטורים (בדיקות s8). ההקרנה כבר מוכנה:
  // legacy-projector מצייר pg.decorations באותו דיו (ornament-ink) כמו
  // נתיב ה-DP — pdfOps ל-PDF, data-URI ל-DOM.
  const { planLegacyOrnaments } = require('../decoration/legacy-ornaments');
  // **S5.2 (אחידות מדידה):** tracking=0 מפורש — כמו כל נקודות המדידה של
  // המורשת (ברירת המחדל של measure-api היא כעת 0, אך מפורש עדיף).
  const ornPass = planLegacyOrnaments(pages, settings,
    (t, s2) => api.measureTextWidth(t, s2, 0), {
    ledger, eventLog: events,
    bandX: GEO.COL_L_X, bandW: 2 * GEO.COL_W + 13.48,
    flowTopOf: (pg, title) => GEO.FLOW_TOP + (pg._h2SpanExempt ? 261.3 : H2_AREA_H)
  });

  // **D-89 (דיווח משתמש: "אין שערים") — עיצוב השערים וכלל הכותרת.** פורט
  // ברירות-המחדל של המקור (decorations.js/style.css של IMUD_TORANI), מכויל
  // מהייחוס — ריצה אחרי חישוב ה-hash, overlay בלבד (אינווריאנט T1, דפוס D-47):
  //  - שער-משנה: פאנל #F4F4F4 מ-55% עד קצה ימין (.sub-shaar-bg-right:
  //    right:0;left:55%) — נמדד בייחוס עמ' 7: (328,0)-(595,842)pt — וגל
  //    העיטור בין הכותרת לכותרת-המשנה (defaultSubShaarOrnament; הדיו נמדד
  //    (33,33,33)≈#222) ממורכז בתיבת התוכן (15mm..PAGE_W-95mm ⇒ מרכז 245.7px;
  //    הייחוס: מרכז הדיו 184pt=245.3px ✓, y-דיו 593-603px).
  //  - שער אחורי: פאנל #F4F4F4 משמאל עד 45% (.back-shaar-bg-left: left:0;
  //    right:55%) — נמדד (0,0)-(268,842)pt ✓.
  //  - שער ראשי: שלד המסגרת שנמדד בעמ' 1 — קווים אנכיים #CCCCCC (0.8)
  //    ב-x=72-73/523-524pt, פסים #FAFAFA (0.98) בפנים, כללים אופקיים #D1D1D1
  //    (0.82) ב-y=168/674pt. (ערכת הנושא המקורית של הייחוס הוסיפה גרדיאנטים
  //    ורכיבי כחול — מחוץ להיקף; השלד הגיאומטרי נשמר.)
  //  - כלל כותרת תחתון בכל עמוד עם כותרת עליונה (חוץ משערים): מלבן שחור
  //    (43,62)-(553,63)pt — .top-header-grid border-bottom — נמדד בעמ'
  //    3-5, 8-12 (hdr-divider-style; 'none' מבטל).
  {
    const dec = (p, o) => { (p.decorations = Array.isArray(p.decorations) ? p.decorations : []).push(o); };
    for (const p of pages) {
      if (p.type === 'shaar-sub') {
        dec(p, { x: 0.55 * GEO.PAGE_W, y: 0, w: 0.45 * GEO.PAGE_W, h: GEO.PAGE_H, kind: 'shaar-panel', kindStyle: 'rect:#F4F4F4' });
        if ((p.gateLines || []).length > 1) { // כותרת + כותרת-משנה ⇒ הגל ביניהן (כמו renderSubShaar)
          const style = cfg.shaarSubDivider && cfg.shaarSubDivider !== 'none'
            ? (cfg.shaarSubDivider.startsWith('ext_') || cfg.shaarSubDivider.endsWith('.svg')
              ? 'imud:divider:' + cfg.shaarSubDivider : cfg.shaarSubDivider)
            : 'shaar-wave';
          dec(p, { x: 175.7, y: 585.5, w: 140, h: 25, kind: 'shaar-divider', kindStyle: style });
        }
      } else if (p.type === 'shaar-back') {
        dec(p, { x: 0, y: 0, w: 0.45 * GEO.PAGE_W, h: GEO.PAGE_H, kind: 'shaar-panel', kindStyle: 'rect:#F4F4F4' });
      } else if (p.type === 'shaar-main') {
        dec(p, { x: 96, y: 0, w: 1.33, h: GEO.PAGE_H, kind: 'frame-v', kindStyle: 'rect:#CCCCCC' });
        dec(p, { x: 697.33, y: 0, w: 1.33, h: GEO.PAGE_H, kind: 'frame-v', kindStyle: 'rect:#CCCCCC' });
        dec(p, { x: 97.33, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-band', kindStyle: 'rect:#FAFAFA' });
        dec(p, { x: 668, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-band', kindStyle: 'rect:#FAFAFA' });
        // **D-89:** שרשרת העלים — דפוס הנושא של הייחוס בשולי הפאנלים (עלה במרכז
        // x≈84.5pt ⇒ מרכז הפס 112px; ימין משוקף)
        dec(p, { x: 97.33, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-chain', kindStyle: 'shaar-frame-chain' });
        dec(p, { x: 668, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-chain', kindStyle: 'shaar-frame-chain' });
        dec(p, { x: 0, y: 224, w: GEO.PAGE_W, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
        dec(p, { x: 0, y: 898.67, w: GEO.PAGE_W, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
        // **D-89:** עיטור השער הראשי המובנה (עיגול+כנפיים) מתחת לנושא —
        // נמדד בייחוס עמ' 1: דיו x 231.5-363.3pt, y 265-272pt (מרכז 297.4pt).
        dec(p, { x: 306.6, y: 346, w: 180, h: 24, kind: 'shaar-ornament', kindStyle: 'shaar-main-orn' });
        // שני כללים אפורים קטנים סביב שורת המהדורה — נמדדו (231.5,550.5)-(363.5,551.2)
        // ו-(231.5,577.5)-(363.5,578.2) — כמו עיטור .book-sections-summary במקור.
        dec(p, { x: 308.7, y: 734, w: 176, h: 0.93, kind: 'edition-rule', kindStyle: 'rect:#CCCCCC' });
        dec(p, { x: 308.7, y: 770, w: 176, h: 0.93, kind: 'edition-rule', kindStyle: 'rect:#CCCCCC' });
      }
      if (p.headerSlots && (p.headerSlots.right || p.headerSlots.center || p.headerSlots.left)
        && !String(p.type || '').startsWith('shaar') && cfg.hdrDivider !== 'none') {
        dec(p, { x: 57.33, y: 82.67, w: 680, h: 1.33, kind: 'hdr-rule', kindStyle: 'rect:#000000' });
      }
    }
    events.emit('decorations', 'legacy-imud: gate design + header rule', { pages: pages.length });
  }

  return {
    metadata: meta, tokens: tokensOut, pages, ledger, events,
    toc: { general: genEntries.length, detailed: detEntries.length },
    tocPages: [], numberingAudit: null, settings,
    contentPreserved: contentPreservedFlag,
    contentStats: { sourceWords: contentStats.sourceWords, outputWords: contentStats.outputWords, missingCount: contentStats.missing.length, missingSample: contentStats.missing.slice(0, 8) },
    layoutHash: layoutHashValue,
    plannedLayoutHash: null, geometryNeutralVerified: true,
    ornaments: ornPass.planted ? { planted: ornPass.planted, rejected: ornPass.rejected.length } : null,
    retreat: null, sideNotes: null, endnotePages: null,
    endnotePagesInfo: { count: endNoteTokens.length, pages: endnotePagesBuilt.map(p => p.index) },
    scope: null, customStyles: null, recommendations: null,
    legacyProfile: true
  };
}

/**
 * **S4.10:** hash קנוני של תוצאת המורשת — מיוצא גם ל-buildReport כדי שדטרמיניזם
 * יימדד מחדש באותה שיטה בדיוק (hash של DP על עמודי מורשת אינו מוגדר).
 */
function legacyLayoutHashDigest(pages) {
  const hash = crypto.createHash('sha256');
  for (const pg of pages) {
    hash.update(pg.type + '|' + (pg.folioDisplay || '') + '|');
    for (const col of pg.columns) for (const ln of col) hash.update((ln.words || []).join(' ') + '|');
  }
  return hash.digest('hex').slice(0, 16);
}

module.exports = {
  GEO, SZ, HEADING_MODES, toGematria, stripEditorialNotes, parseMetadata,
  tokenizeDoc, LineBreaker, findNotes, readConfig, legacyTypeset,
  FLOW_BOTTOM, SINGLE_W, wrapText, headingItemH, legacyLayoutHashDigest,
  parenCenterRaisePx
};

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

// **S5.2 (תיקון 5 — tracking שאין לאף מרנדר):** ברירת המחדל הייתה 0.02em —
// המדידה "הרחיבה" כל שורה ב~2% יחסית לדיו: אף מרנדר (DOM/PDF) אינו מצייר
// letter-spacing, והפרויקטור הגיאומטרי ערבב באותה שורה מדידות עם tracking=0
// (מפורש) וברירת המחדל. כעת 0 — המודל = הדיו. נתיב המורשת אינו מושפע:
// כל קריאותיו מעבירות tracking=0 במפורש (אומת בסקירה).
const DEFAULT_TRACKING = 0; // em

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
  // **S6.0 (R7-L2):** גם רישום מנקה את מטמון ה-API-פר-משפחה — בעבר רק
  // ההסרה ניקתה ⇒ רישום מחדש של אותה משפחה החזיר מופע ישן מהמטמון
  // (קשור לגופן הקודם) והמדידה המשיכה במטריקות הישנות.
  _familyApiCache.clear();
  // **S4.26 (גליפים חסרים):** 'Frank Ruhl Libre' הוא fallback הפיסוק
  // של מחסנית הרינדור (fontStack מוסיף אותו שני) — גם המדידה תשתמש
  // בו לתווים שחסרים בגופן הראשי (בדיוק כמו הדפדפן).
  if (String(profileName) === 'Frank Ruhl Libre') {
    fm.setMissingGlyphFallbackFont(res.font);
  }
  return { ok: true, profile: res.font, glyphCount: res.font.numGlyphs, mappedChars: res.font.charToGlyph.size };
}

/** **S6.0 (R2-C1):** שחזור רישום קודם אחרי שימוש זמני (exportPdf) —
 * font=null ⇒ הסרה רגילה. מונע מצב שבו ייצוא מוחק ל-worker את רישום
 * הגופן של התצוגה החיה (המדידה היתה נופלת בשקט ל'table'). */
function restoreFontRegistration(profileName, font) {
  if (!font) { unregisterFont(profileName); return; }
  registeredFonts.set(String(profileName), font);
  if (String(profileName) === 'Frank Ruhl Libre') fm.setMissingGlyphFallbackFont(font);
  _familyApiCache.clear();
}

/** הסרת גופן רשום (בדיקות). */
function unregisterFont(profileName) {
  registeredFonts.delete(String(profileName));
  if (String(profileName) === 'Frank Ruhl Libre') fm.setMissingGlyphFallbackFont(null);
  _familyApiCache.clear(); // **S5.2:** מטמון ה-API-פר-משפחה נגרר אחרי ההרשמה
}
function clearRegisteredFonts() { registeredFonts.clear(); fm.setMissingGlyphFallbackFont(null); _familyApiCache.clear(); }

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

  /**
   * **S4.16 (תיקון שורש — מדידת ניקוד):** סימן משולב הממופה בגופן עם advance=0
   * (ניקוד עברי: דגש/תנועות/טעמים) הוא **שכבת-אפס אמיתית** — כך מודד אותו
   * הדפדפן (hmtx=0, שכבת-גליף על הבסיס). בעבר נפל לסל העברי של הטבלה (0.5em
   * = 6pt בגוף 12) ⇒ מילה מנוקדת כמו המצוּוֶה נמדדה רחבה ב~12pt, שבירת השורות
   * נגררה מילה-מילה והדריפט הצטבר לכל העימוד (P7 0.919). מבחינים עתה בין
   * "לא ממופה כלל" (fallback מכויל — מונה fontFallbacks) לבין "ממופה
   * עם advance=0" (אפס אמיתי).
   */
  _charEm(ch) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const gid = fm.glyphIdOf(this.fontProfile, ch);
      if (gid !== 0 && gid < this.fontProfile.numGlyphs) {
        // ממופה בגופן — רוחב hmtx אמיתי (כולל 0 לניקוד)
        return (fm.advanceUnitsOf(this.fontProfile, ch) / this.fontProfile.unitsPerEm) * this.fontFactor;
      }
      // **S4.26 (גליף חסר — fallback כמו הדפדפן):** פיסוק שחסר בגופנים
      // תורניים מצויר בדפדפן במשפחת ה-fallback שבמחסנית ('Frank Ruhl
      // Libre') — המדידה באותם מטריקות בדיוק. בלי גופן כזה רשום — הקירוב
      // המכויל (התנהגות קודמת).
      this.stats.fontFallbacks++;
      const fbEm = fm.missingGlyphFallbackEm(ch);
      if (fbEm > 0) return fbEm;
      return charWidthEm(ch);
    }
    return charWidthEm(ch);
  }

  /** סימן משולב ממופה עם advance=0 (ניקוד): שכבת-אפס — לא חלק מאשכול מדידה. */
  _isMappedMark(ch) {
    if (this.impl !== 'font-metrics' || !this.fontProfile) return false;
    const gid = fm.glyphIdOf(this.fontProfile, ch);
    return gid !== 0 && gid < this.fontProfile.numGlyphs
      && fm.advanceUnitsOf(this.fontProfile, ch) === 0;
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
      // **S4.16:** ניקוד ממופה (advance=0) — אין רוחב, אין tracking ואין קרנינג
      // (הסימן נצמד לבסיס שלו; letter-spacing אינו חל על סימנים משולבים במדידת
      // הדפדפן). prev נשאר הבסיס האחרון — קרנינג בין בסיסים דרך הניקוד נשמר.
      if (this._isMappedMark(ch)) continue;
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
    // **S5.1:** בלי Math.round — 12pt×1.34=21.44px אורגל ל-21 ⇒ +2 שורות לעמוד
    // (סוג המוקש שתוקן במנוע המורשת ב-S4.13, לא הופץ לנתיב ה-DP).
    // **S5.1:** בלי Math.round — 12pt×1.34=21.44px אורגל ל-21 ⇒ +2 שורות לעמוד
    // (סוג המוקש שתוקן במנוע המורשת ב-S4.13, לא הופץ לנתיב ה-DP).
    return size * (96 / 72) * this.settings['body-line-height'];
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

/** **S5.2 (תיקון 6 — מדידת כותרות בגופן רשום):** API כבול למשפחה שנרשמה ב‑registerFont
 * (מטריקות אמת hmtx/kern בגודל הכותרת), או null כשהמשפחה אינה רשומה —
 * דפוס apiFor(family) של legacy-projector, מיוצא כאן כסטטי על המחלקה כדי
 * שה-pipeline (widthFor) ישתמש בו בלי לרדוף אחרי מפת הגופנים בעצמו.
 * מטומן לפי משפחה; המטמון מתרוקן בהסרת/איפוס גופנים (unregister/clear). */
const _familyApiCache = new Map();
MeasureAPI.forFamily = function forFamily(family, settings) {
  if (!family || !registeredFonts.has(String(family))) return null;
  const fam = String(family);
  const sizeKey = settings && settings['body-font-size-pt'] != null ? String(settings['body-font-size-pt']) : '';
  const key = `${fam}|${sizeKey}`;
  if (!_familyApiCache.has(key)) {
    _familyApiCache.set(key, new MeasureAPI({ ...(settings || {}), 'body-font': fam }, 'font-metrics'));
  }
  return _familyApiCache.get(key);
};

/** **EXT-13 (איחוד מקור המדידה live↔ייצוא):** כשגוף הגוף רשום בפועל
 * (registerFont) — מדידת האמת (font-metrics) מועדפת גם כשההגדרה היא
 * 'table' (ברירת המחדל). בלי זה ה-live מדד בטבלאות המקורבות בזמן שהייצוא
 * מדד במטריקות האמיתיות — סחף עמודים של 2% בספר אמת (1,021 מול 1,000;
 * real-book-matrix.json) ועד 17% בקורפוס הגדול (794 מול 678). ההעדפה
 * בטוחה: MeasureAPI נופל בשקיפות לטבלה כשאין גופן (_bindProfile). */
function resolveMeasureImpl(settings) {
  if (settings && settings['measure-impl'] === 'font-metrics') return 'font-metrics';
  const name = settings && settings['body-font'];
  if (name && registeredFonts.has(name)) return 'font-metrics';
  return 'table';
}

module.exports = {
  MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts, restoreFontRegistration,
  charWidthEm, registeredFonts, resolveMeasureImpl
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
// **S5.2 (T7):** NBSP (U+00A0) = רוחב הרווח (0.26) — בעבר נפל לסל 0.4em
// (+2.24px @12pt לכל NBSP) במימוש A כשנמדד גולמי (יחידות מודבקות לפני
// רישום הגופנים / טסטים). impl B בטוח כבר היום (הפיצול מבוצע לפני המדידה).
// **S6.0 (R7-M1):** המקש היה כתוב '\\u00A0' (מחרוזת 6-תווים מילולית) ולא
// התו עצמו ⇒ התיקון המתועד מעולם לא פעל (charWidthEm('\u00A0') החזיר 0.4).
// תוקם למקש התו האמיתי.
const WIDE_MARKS = { ' ': 0.26, '\u00A0': 0.26, '\uE000': 0.26, '.': 0.24, ',': 0.24, ';': 0.24, ':': 0.24, '-': 0.34, '–': 0.5, '"': 0.28, "'": 0.16, '“': 0.4, '”': 0.4, '״': 0.36, '׳': 0.18, '[': 0.3, ']': 0.3, '(': 0.3, ')': 0.3 };

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
      // **S5.2 (תיקון צעד רשומה — T1):** בחוזה vf1===0x0004 && vf2===0 אין
      // כלל value2 — PairValueRecord = gid2(2) + XAdvance(2) = **4 בתים**,
      // לא 6. הצעד 6 קרא כל רשומה אחרי הראשונה מוסטת (מפת קרנינג משובשת:
      // 171 זוגות זבל מ-Hadassah). היום הקרנינג אינו נצרך במדידה (מדיניות
      // ללא-קרנינג — תצוגה=ייצוא; ראה font-kerning:none ב-BASE_CSS), אך
      // הפרסר חייב להיות נכון לכל שימוש עתידי.
      const rec = psOff + 2 + k * 4; // gid2(2) + value1 XAdvance(2) — vf2=0 ⇒ אין value2
      if (rec + 4 > b.length) break;
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

/** **S4.26:** גופן ה-fallback לגליפים חסרים — כמו מחסנית ה-CSS בדפדפן. */
let missingGlyphFallbackFont = null;
function setMissingGlyphFallbackFont(font) { missingGlyphFallbackFont = font || null; }

/** **S4.26:** רוחב-גליף-חסר בגופן ה-fallback (em) — 0 אם אין fallback/גם בו חסר. */
function missingGlyphFallbackEm(ch) {
  if (!missingGlyphFallbackFont) return 0;
  return advanceEmOf(missingGlyphFallbackFont, ch);
}

/** מזהה גליף של תו (או 0 = .notdef). */
function glyphIdOf(font, ch) {
  const cp = typeof ch === 'number' ? ch : ch.codePointAt(0);
  const g = font.charToGlyph.get(cp);
  return g === undefined ? 0 : g;
}

/** רוחב advance ביחידות גופן (0 ללא מיפוי). */
function advanceUnitsOf(font, ch) {
  const g = glyphIdOf(font, ch);
  if (g === 0 || g >= font.numGlyphs) {
    // **S4.26 (גליפים חסרים — fallback כמו הדפדפן):** לגופנים תורניים
    // (למשל גוטמן רש"י) אין גליפים לפיסוק בסיסי (' . ׳) — הדפדפן מצייר
    // אותם במשפחת ה-fallback שבמחסנית ('Frank Ruhl Libre'); המדידה
    // בלי זה החזירה 0 ושורות ממורכזות נבדקו צרות מהרינדור (נצפה:
    // INK_OUTSIDE 3px בשורת "הרי בהכרח שהם גדרים... וכו'."). המרה
    // ליחידות הגופן הראשי משמרת את היחס הנכון בשרשרת.
    if (missingGlyphFallbackFont && missingGlyphFallbackFont !== font) {
      const em = advanceEmOf(missingGlyphFallbackFont, ch);
      if (em > 0) return em * font.unitsPerEm;
    }
    return 0;
  }
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
  capHeightEmOf, isZeroAdvanceMark, setMissingGlyphFallbackFont, missingGlyphFallbackEm
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
      // **S5.2 (תיקון 4 — תיבת פנטום 1px):** חלק ריק (NBSP כפול, פתיחה/סיום
      // ב-NBSP) נמדד עכשיו ברוחב 0 — בעבר Math.max(1,…) יצר תיבת 1px שאינה
      // קיימת בדיו והעלתה את רוחב השורה. אין חשש מכניסה לרווח: מנגנוני ה-badness
      // מוגנים (effStretch>0 / shrink>0 — ראה breakLines) וההתקדמות מובטחת
      // (תיבה ריקה אינה מקום שבירה; הטוקן שלה משוחזר עם ה-NBSP שלו).
      items.push({ kind: 'box', text: parts[k].replace(/\uE000/g, '\u00A0'), width: Math.max(0, measure(parts[k])) });
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
      // **S5.1 (D-92-DP):** הדפדפן מרנדר רוחב טבעי (white-space:normal) —
      // שורה שרוחבה הטבעי חורג מהטור נעטפת בתצוגה (טקסט-על-טקסט) גם אם
      // היישוב יכול לכווץ רווחים ב-PDF. לכן המבחן ברוחב הטבעי, בלי shrink.
      // **S5.2 (תיקון 3 — המבחן היה מרחיב, לא שמרני):** בעבר `w > maxWidth+0.75`
      // אִפשר קווים ברוחב טבעי עד maxWidth+0.75px (ובכך גם קבלת חיתוכים עם
      // slack שלילי דרך כיווץ) — בזמן ש-FIT_EPS של המורשת שמרן (limit−eps).
      // כעת החיתוך נעצר מוקדם: שורה שאינה נכנסת ב-maxWidth−0.75 אינה מוארכת
      // עוד, וכל קו מקובל הוא ברוחב טבעי ≤ maxWidth−0.75 (גם בסוף פסקה —
      // הפנלטי הסופי נמדר רק אחרי שכל הפריטים עברו את אותו מבחן). מילה רחבה
      // מהטור עדיין יוצאת כשורה בפני עצמה דרך הגיבוי הגרידי (greedyFallback —
      // התקדמות מובטחת, טוקן בודד אינו נחסם: pushTok עם toks ריק אינו מוסף).
      if (w > maxWidthPx - 0.75) break; // חריגה שאינה ניתנת לתיקון — שמרני כמו FIT_EPS

      if (it.kind === 'box') {
        // מקומות שבירה חוקיים נקבעים **מבנית מראש** (static legal-cuts): cut בצומת c חוקי
        // רק אם items[c-1] הוא glue לא־פנימי ו‑items[c] תיבה שפותחת יחידה חדשה.
        // זה מבטל את באג V23: lock תלוי-נקודת-התחלה על צמתים משותפים ל‑DP.
        // (תיקון S3: הבדיקה הייתה בתוך הלולאה עם אינדקס שגוי j+2 — כל השברים נחסמו.)
        const cut = j + 1; // נקודת שבירה חוקית: אחרי תיבה, לפני ה‑glue העוקב
        if (!(items[cut].kind === 'glue' && !items[cut].internal && items[cut + 1] && items[cut + 1].kind === 'box')) continue;
        const slack = maxWidthPx - w;
        // **S5.2 (תיקון 3 — שמרנות בקבלת חיתוך):** קו שאינו נכנס ברוחב הטבעי
        // (slack < −FIT_EPS) הוא בלתי-אפשרי — badness INF, לא "כיווץ". המבחן
        // השמרני למעלה אמור למנוע הגעה לכאן; השמירה הכפולה מתעדת את הכוונה.
        if (slack < -0.75) continue;
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
    // **S6.0 (R7-M2 — רווח רפאים בגיבוי הגרידי):** sp חושב לפי מצב השורה
    // **לפני** ה-flush ונוסף גם אחריו ⇒ כל שורה שנפתחה ב-flush נשאה רווח
    // אחד עודף ב-widthPx (מדידה שקרית לצרכי ריצת-שורה/איזון). תוקם:
    // הבדיקה וההוספה לפי המצב **אחרי** ההחלטה על flush.
    if (toks.length && w + space + curW > maxWidthPx - 0.75) flush(); // הטוקן הבא ייפתח שורה חדשה
    const sp = toks.length ? space : 0;
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
__modules["src/engine/decoration/legacy-ornaments.js"] = function (require, module, exports) {
// src/engine/decoration/legacy-ornaments.js — **EXT-4 (שארית): חיבור ornament-plan לנתיב ה-legacy**
'use strict';

/**
 * הפאס שמשלים את החוליה החסרה בשרשרת העיטורים של פרופיל ה-IMUD:
 * הדיו קיים (ornament-ink — כולל פענוח imud: מספריות העיצובים המוטמעות),
 * ההקרנה קיימת (legacy-projector: pdfOps + data-URI מ-pg.decorations) —
 * ומה שחסר הוא ה**תכנון**: הפקת rectים של עיטורים על עמודי פתיחת-הסימן
 * של מנוע המורשת, לפי אותם מפתחות h2-orn-* שמיפוי ההגדרות מתרגם מהמקור
 * (h2-ornament-top-style וכו').
 *
 * **ברירות המחדל של המקור = 'none' לכל העיטורים** — בפרופיל ברירת-המחדל
 * הפאס הזה לא מייצר דבר (אפס שינוי; ה-parity וה-hash מוכחים כזהים).
 * החיבור מופעל רק כשההגדרות מזמנות עיטורים בפועל — ואז הוא מוכח בבדיקות.
 *
 * **אינווריאנט T1 (ניטרליות גיאומטרית):** הפאס רץ אחרי חישוב ה-layoutHash
 * של המורשת ואינו נוגע בטורים/בפסים — overlay-rects בלבד (דפוס D-47).
 * גובה העיטור אינו "מתגלה" בדיעבד (שיעור F-08): עיטור שאין לו מקום
 * חוקי בתוך אזור ה-h2 נדחה ונרשם — לא נדחק לתוך זרימת הגוף.
 */

const {
  h2OrnamentScope, h2OrnamentReservedHeight
} = require('./ornament-fit');

/** רוחב הפס (שני טורים + מרזב) — מקור: legacy-imud-flow GEO. */
const BAND_W = 552;
const BAND_X = 48.7; // GEO.COL_L_X — מרכז העמוד (A5 16x16... ליתר דיוק מוזרק מהקריאה)

/**
 * @param {Array} pages - עמודי המורשת (אחרי ההרכבה; pg.bands/pg.columns מוכנים)
 * @param {object} settings - הגדרות RED (כולל h2-orn-* הממופות מהמקור)
 * @param {Function} measureFn - (text, sizePx?) => widthPx
 * @param {object} io - { ledger, eventLog, bandX, bandW }
 * @returns {{planted:number, rejected:Array}}
 */
function planLegacyOrnaments(pages, settings, measureFn, io = {}) {
  const ledger = io.ledger, eventLog = io.eventLog;
  const bandX = io.bandX != null ? io.bandX : BAND_X;
  const bandW = io.bandW != null ? io.bandW : BAND_W;
  // ראש זרימת הגוף של עמוד h2 — מחושב בצד הזרימה (FLOW_TOP + גובה אזור-h2
  // לפי פטור-span); ברירת מחדל שמרנית: מתחת לפס הכותרת.
  const flowTopOf = io.flowTopOf || ((pg, title) => title.y + title.h);
  const out = { planted: 0, rejected: [] };
  const scope = h2OrnamentScope(settings);
  if (!scope.any) return out; // ברירות המחדל של המקור — אין עיטורים (אפס התערבות)

  for (const pg of pages) {
    const title = (pg.bands || []).find(b => b.kind === 'h2-title');
    if (!title) continue; // עיטורי h2 בלבד בחיבור זה (עמודי פתיחת סימן)
    const siman = (pg.bands || []).find(b => b.kind === 'h2-siman');
    const topBand = siman || title;

    const h2FontPx = title.sizePt * (96 / 72);
    let titleW = 0;
    try { titleW = measureFn(title.text, title.sizePt); } catch { titleW = 0; }
    const titleWpx = Math.max(40, titleW || 0);
    const { scale, ornW, ornH, margins } = h2OrnamentReservedHeight(titleWpx, settings, h2FontPx);
    if (ornW <= 0 || ornH <= 0) continue;

    pg.decorations = pg.decorations || [];
    const centerX = bandX + bandW / 2;
    const kindTop = settings['h2-orn-top'];
    const kindBottom = settings['h2-orn-bottom'];
    const kindSide = settings['h2-orn-side'];

    // גבולות אזור-h2 חוקיים: מעל הפס העליון, ועד ראש זרימת הגוף של העמוד
    const flowTop = flowTopOf(pg, title);

    // ---------- עיטור עליון (מעל הסימן/הכותרת; REQ-ORN-01/02) ----------
    if (scope.signTop && kindTop && kindTop !== 'none') {
      const y = topBand.y - margins.top - ornH;
      if (y >= 60) { // לא מטפס מעל אזור הכותרת העליונה של העמוד
        const x = centerX - ornW / 2;
        pg.decorations.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-top', slot: 'sign-top', kindStyle: kindTop });
        out.planted++;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'sign-top', reason: 'no-room-above', ornH });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-top@${pg.index}`, pg.index, { reason: 'no-room-above', ornH }, 'ornaments');
      }
    }

    // ---------- עיטור תחתון (מתחת לכותרת; בתוך אזור ה-h2 בלבד — שיעור F-08) ----------
    if (scope.signBottom && kindBottom && kindBottom !== 'none') {
      const y = title.y + title.h + margins.bottom;
      if (y + ornH <= flowTop - 1) { // חייב להיכנס לאזור — לא לחדור לזרימת הגוף
        const x = centerX - ornW / 2;
        pg.decorations.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-bottom', slot: 'sign-bottom', kindStyle: kindBottom });
        out.planted++;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'sign-bottom', reason: 'no-room-below', ornH, flowTop });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-bottom@${pg.index}`, pg.index, { reason: 'no-room-below', ornH }, 'ornaments');
      }
    }

    // ---------- עיטורי צד (משני צדי הכותרת; ממורכזים אנכית לפס) ----------
    if (scope.titleSide && kindSide && kindSide !== 'none') {
      const gap = Math.max(4, Math.round(h2FontPx * 0.15));
      const y = title.y + (title.h - ornH) / 2;
      const halfTitle = (titleWpx * (scale > 0 ? 1 : 1)) / 2;
      const rightX = centerX + halfTitle + gap;
      const leftX = centerX - halfTitle - gap - ornW;
      if (rightX + ornW <= bandX + bandW && leftX >= bandX) {
        pg.decorations.push({ x: Math.round(rightX * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-side', slot: 'side-r', kindStyle: kindSide });
        pg.decorations.push({ x: Math.round(leftX * 100) / 100, y: Math.round(y * 100) / 100, w: ornW, h: ornH, kind: 'h2-orn-side', slot: 'side-l', kindStyle: kindSide });
        out.planted += 2;
      } else {
        out.rejected.push({ page: pg.folioDisplay || pg.index, slot: 'side', reason: 'title-too-wide', titleW: titleWpx });
        if (ledger) ledger.create('ornament-rejected', `legacy-h2-side@${pg.index}`, pg.index, { reason: 'title-too-wide', titleW: titleWpx }, 'ornaments');
      }
    }
  }
  if (eventLog && out.planted) {
    eventLog.emit('ornaments', 'legacy-h2-ornaments', { planted: out.planted, rejected: out.rejected.length });
  }
  return out;
}

module.exports = { planLegacyOrnaments };

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
      // **S5.2 (8):** החיפוש לפי מספר עמוד תואם לתצוגה (1-based) — כמו שאר הממשק
      const hay = `${f.kindHe || ''} ${f.kind} ${f.page != null ? f.page + 1 : ''} ${f.id}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      shown++;
      const tr = doc.createElement('tr');
      tr.className = 'finding-row';
      tr.dataset.issueId = f.id;
      tr.setAttribute('tabindex', '0');
      const cells = [
        f.kindHe || GEOM_KIND_NAMES[f.kind] || f.kind,
        f.page != null ? String(f.page + 1) : '—', // **S5.2 (8):** תצוגה 1-based — כמו ההמלצות/הפטורים/הגיליונות
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
  // **S4.10:** תוצאת מנוע-מורשת מקבלת hash מחדש בשיטת המורשת עצמה — hash של DP
  // על עמודי מורשת אינו מוגדר (שדות שונים) והיה מסמן אקראיות שקרית.
  const { layoutHash } = require('../engine/layout/dp-planner');
  const { legacyLayoutHashDigest } = require('../engine/layout/legacy-imud-flow');
  let recomputed = null;
  if (result.pages) {
    recomputed = result.legacyProfile
      ? 'legacy-' + legacyLayoutHashDigest(result.pages)
      : layoutHash(result.pages);
  }
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
const { blockGapPx, colCapacityOf } = require('./column-flow');
const { fixDropWordInColumns } = require('../typography/protectors');
const { MARK_TAG } = require('../notes/markers');
const { moveLineForward } = require('./ordering');
const { optimalSplit } = require('./balancing'); // **EXT-8:** חלוקה גלובלית אופטימלית
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
    // **S4.10:** דפנסיביות — עמודי מנוע המורשת אינם מחויבים לכל השדות
    // (לפני כן p.sideNotes.length קרס על undefined). לעמודי DP אין שינוי ערך.
    fn: (p.footnotes || []).length, sn: (p.sideNotes || []).length
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
  // **S5.2 (P-2 — קיבולת מאוחדת):** כל חישובי הקיבולת עוברים דרך colCapacityOf
  // (column-flow — מקור יחיד). כאן usedHeight כבר כולל את תקציב ההערות על
  // הטור האחרון (F-17) — ולכן הקיבולת נלקחת בלי התקציב (fnBudget:false;
  // שקול מתמטית: used+fn ≤ cap ⟺ used ≤ cap−fn). הפס החוצה־טורים נכלל תמיד.
  const colCapacity = (tpl, page) => colCapacityOf(page, { fnBudget: false }) || (tpl && tpl.contentBox ? tpl.contentBox.height - spanH(page) : 0);

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
    // איזון טורים: Δ≤5px (BRZ-3) — **EXT-8: החלוקה הגלובלית האופטימלית**
    // (פיצול רציף ממזער |lH−rH| בכפוף לקיבולת; סדר קריאה נשמר מבנית — תיקון P0-3
    // מובנה בהגדרת מרחב המצבים; הוכחת מינימליות ב-balancing.optimalSplit)
    if (cur.columns.length === 2) {
      const a0 = usedHeight(cur.columns[0], cur), b0 = usedHeight(cur.columns[1], cur);
      if (Math.abs(a0 - b0) > imbMax) {
        const cap = colCapacity(cur.template, cur);
        const best = optimalSplit(cur.columns, { cap, extraLast: cur.fnReservedHeightPx || 0 });
        if (best && best.k !== cur.columns[0].length) {
          const seq = [...cur.columns[0], ...cur.columns[1]];
          cur.columns[0] = seq.slice(0, best.k);
          cur.columns[1] = seq.slice(best.k);
        }
      }
      // מילה נופלת בין טורים (פורטר מ‑Gold) — גם שומר סדר (המילה חוצה את הגבול קדימה)
      // **S5.2 (תיקון 2):** המיזוג מותר רק אם השורה המקבלת נכנסת ברוחב הטור
      // (מדידה מחדש + FIT_EPS שמרני) — אותה מדידה של המתכנן; מילה שאינה
      // נכנסת נשארת בטור המקורי (בלי גלישה אופקית שקטה — מחלקת D-92).
      if (fixDropWordInColumns(cur.columns, 3, { measure: (t) => measureFn(t), colW: cur.template.columns[0].w })) {
        eventLog.emit('balance', 'fix-drop-word', { page: cur.index }, cur.index);
      }
      const a = usedHeight(cur.columns[0], cur), b = usedHeight(cur.columns[1], cur);
      cur.balanceInfo = { before: [a0, b0], after: [a, b] };
      eventLog.emit('balance', 'column-balance', { page: cur.index, delta: Math.abs(a - b) }, cur.index);
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
            const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { linesNeeded: needLines, capacityPx: colCapacity(cur.template, cur), lineHPx: lineH }, 'protections');
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

  // **S6.0 (R3-C1 — אובדן תוכן בזנב):** פס חוצה-טורים (H3–H6) או הערת-צד
  // שנותרו לבד בעמוד האחרון (בלי שורות טור ובלי הערות) לא הופיעו בפלט
  // — הם נפלטו ב-flushPage אך התנאי לא כלל אותם ⇒ העמוד לא נסגר מעולם.
  if (cur.columns.some(c => c.length) || cur.footnotes.length
    || (cur.spanning && cur.spanning.lines && cur.spanning.lines.length)
    || (cur.sideNotes && cur.sideNotes.length) || pages.length === 0) flushPage();

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
    if (last && last.columns.every(c => usedHeight(c, last) < colCapacity(last.template, last) * 0.5)) {
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
 * **EXT-8 — חלוקה גלובלית אופטימלית** (במקום טיפוס גרידי שורה-שורה):
 * מרחב המצבים החוקי = פיצולים רציפים של רצף הקריאה; המינימום הגלובלי של |lH−rH|
 * נמצא ב-O(n) (הוכחה ב-balancing.optimalSplit). סדר קריאה נשמר מבנית.
 * תיקון P1-8: גובה כולל את תקציב ההערות של **העמוד המאוזן עצמו** (על הטור האחרון). */
function balancePageSafe(page, settings, ledger) {
  const deltaOf = () => {
    const hh = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0), 0)
      + (page.columns[page.columns.length - 1] === c ? (page.fnReservedHeightPx || 0) : 0);
    return Math.abs(hh(page.columns[0]) - hh(page.columns[1]));
  };
  const maxDelta = settings['imbalance-max-delta-px'];
  if (deltaOf() <= maxDelta) return true; // כבר מאוזן — אין התערבות (יציבות פריסה)
  if (!page.columns || page.columns.length < 2) return false;
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf — כולל הפס החוצה־טורים
  // (בעבר חושב מ-contentBox.height גולמי ⇒ איזון שגלש מתחת לפס בעמודי H2);
  // תקציב ההערות עובר כ-extraLast (P1-8) — בלי כפילה.
  const cap = colCapacityOf(page, { fnBudget: false });
  const best = optimalSplit(page.columns, { cap, extraLast: page.fnReservedHeightPx || 0 });
  if (!best || best.k === page.columns[0].length) {
    // **EXT-8:** אין פיצול חוקי, או שהנוכחי כבר האופטימלי הגלובלי — הפרש שנותר
    // מעל הסף הוא **פשרה מתועדת**: שלמות פסקה (הימנעות מיתום/ווידוא בגבול
    // התפר) גוברת על Δ≤5px (למשל: פסקה בת 15 שורות שנכנסת שלמה לטור אחד).
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index,
      { reason: best ? 'at-optimum' : 'capacity', delta: Math.round(deltaOf()), bestK: best ? best.k : null },
      'balance');
    ledger.transition(rec.issue_id, 'correction-blocked', 'balance',
      best ? 'global optimum reached: any further move creates widow/orphan at the seam (paragraph integrity preferred over Δ-threshold)'
           : 'hard reject: no capacity-legal split exists');
    return false;
  }
  const snapshot = { cols: page.columns.map(c => c.slice()), fn: page.footnotes.slice(), sn: page.sideNotes.slice() };
  const seq = [...page.columns[0], ...page.columns[1]];
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  // hard reject: חריגת קיבולת אחרי ההחלפה (הגנה כפולה — optimalSplit כבר מסנן) → rollback מלא
  // **S5.2 (P-2):** קיבולת אפקטיבית פר-טור (פס + תקציב על הטור האחרון) — מקור יחיד.
  const overflows = (c, ci) => {
    const hh = c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1), 0);
    return hh > colCapacityOf(page, { colIndex: ci }) + 0.5;
  };
  if (page.columns.some(overflows)) {
    page.columns = snapshot.cols; page.footnotes = snapshot.fn; page.sideNotes = snapshot.sn;
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity' }, 'balance');
    ledger.transition(rec.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after move (not soft ×2000)');
    return false;
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
const { colCapacityOf } = require('./column-flow'); // **S5.2 (P-2):** קיבולת טור — מקור יחיד
const { MARK_TAG } = require('../notes/markers');

/** עמודים מבניים שאינם זרימת-תוכן — כותרת בודדת בהם היא מכוונת-עיצוב,
 * לא הפרת ליווי (S4.21/EXT-11: פותחי-החלקים H1 על עמוד פתיחה ייעודי — D-36/PT-04). */
function isStructuralPage(page) {
  return Boolean(page.chapterOpening) ||
    page.type === 'shaar-main' || page.type === 'shaar-sub' || page.type === 'shaar-back' ||
    page.type === 'toc-general' || page.type === 'toc-detail';
}

/** זיהוי מילה־סמן הערה בכל סגנון (P1-3): א׳/ב׳…, [n], (n), n., כוכבית, *, **.
 *  **S5.2 (תיקון 10):** סמן עברי רב-אותיות הוא כעת במוסכמת הגרשיים של הגיליון —
 *  כ״ג (גרשיים **לפני** האות האחרונה), לא כג׳ הישן — שני האופנים מזוהים. */
function isNoteMarkerWord(w) {
  const s = String(w);
  if (!s) return false;
  // אות עברית (1-2 אותיות) + גרש/גרשיים בסוף (הצורה הישנה) — או הצורה החדשה:
  // אות+גרשיים+אות (כ״ג) / אות בודדת+גרש (א׳)
  if (/^[\u05D0-\u05EA]{1,2}[\u05F3\u05F4]$/.test(s)) return true;
  if (/^[\u05D0-\u05EA]\u05F4[\u05D0-\u05EA]+$/.test(s)) return true;
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
    // **S4.21 (EXT-11):** עמודי פתיחה/שער/תוכן-עניינים מדולגים — כותרת החלק
    // עומדת לבדה בעמוד הפתיחה שלה **בתכנון** (D-36, PT-04: "כותרת 1 — עמוד
    // חדש תמיד"); דרישת 2 שורות ליווי אינה חלה שם. בזרימת התוכן הכללית
    // הכלל נותר כחוק קשה.
    if (isStructuralPage(page)) return [];
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
    // **S4.21 (EXT-11):** שתי האמות של בדיקת ה-runt —
    //  (א) runt הוא מושג של שורת-פסקה: כותרת קצרה ("פתח דבר", "חלק 1") היא
    //      תקינה מיסודה ואינה נמדדת כלל; בעבר 9 מתוך 10 הממצאים בקורפוס הקנוני
    //      היו כותרות.
    //  (ב) ההשוואה היא מול **המידה שבה השורה נשברה** (ln.measureW — מוטבע
    //      ב-pipeline), לא מול רוחב התבנית: פסקת הקדמה שנמדדה במידת טור-הגוף
    //      ~330px והוצבה בעמוד חד-טורי בן 674px — שורת-סיום בת 82% מהמידה
    //      סומנה בטעות כקצרה.
    const colW = page.template.columns[0].w;
    for (const col of page.columns) {
      for (const ln of col) {
        if (ln.kind === 'heading') continue;
        const base = ln.measureW || colW;
        const minPx = (base * settings['runt-min-width-pct']) / 100;
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
   * **S4.21 (EXT-11) — זיהוי לפי תג D-53 בלבד, לא לפי ניחוש מבנה:**
   * סמן אמיתי מתויג תמיד ב-MARK_TAG (\uE102) ומודבק לעוגנו ב-NBSP
   * (`עוגן\u00A0\uE102סמן` — מקור יחיד bindMarkersToNeighbors). היוריסטיקת
   * הרג'קס הקודמת סימנה כל מספר בודד בטקסט ("…של חלק 1") כסמן — 24
   * אבחוני-שקר בקורפוס הקנוני ו-420 בספר האמת, אפס מהם סמנים אמיתיים.
   * הפרת BRZ-11 האמיתית שנותרה לזיהוי: יחידת סמן **בודדת** (תג בלי עוגן —
   * בלי NBSP) שנותרה בסוף שורה.
   */
  markerLineBreak(page, settings, ledger) {
    const violations = [];
    for (const col of page.columns) {
      for (const ln of col) {
        const words = ln.words || [];
        if (!words.length) continue;
        const last = String(words[words.length - 1]);
        if (last.includes(MARK_TAG) && !last.includes('\u00A0')) {
          violations.push({
            kind: 'note-marker-line-break', target: `line@${lineToken(ln)}`, page: page.index,
            evidence: { lastWord: last.split(MARK_TAG).join('') },
            ledgerRef: ledger.create('note-marker-line-break', lineToken(ln) || 'unknown', page.index, { lastWord: last.split(MARK_TAG).join('') }, 'protections').issue_id
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
    // **S5.2 (P-2 — קיבולת מאוחדת):** קיבולת אפקטיבית פר-טור מ-colCapacityOf
    // (column-flow) — כולל הפס החוצה־טורים ותקציב ההערות של העמוד (על הטור
    // האחרון). בעבר נמדד מול contentBox.height גולמי ⇒ גלישה שקטה בעמודים
    // עם הערות/פס לא זוהתה כלל (הממצא שהביקורת כינתה "silent column overflow").
    for (let c = 0; c < page.columns.length; c++) {
      const cap = colCapacityOf(page, { colIndex: c });
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
// src/engine/layout/balancing.js — AutoQuality (Gold port, שלוש שכבות) + איזון גלובלי אופטימלי (EXT-8) + chapter-end modes
'use strict';

/**
 * AQ: stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים;
 * Clamp overshoot 20px (REQ-BAL-07); balance-chapter-end {balance|stretch|natural} (REQ-BAL-03).
 */

// (moveLineForward אינו נדרש עוד באיזון: optimalSplit מכסה את מרחב המצבים כולו — EXT-8)

const { colCapacityOf } = require('./column-flow'); // **S5.2 (P-2):** קיבולת הטור — מקור יחיד

function usedHeight(col) {
  // **EXT-20:** גובה בפועל — כולל מקדם ה-AQ האנכי (לפני ה-AQ כל המקדמים 1).
  return col.reduce((s, ln) => s + ln.heightPx * (ln.aqStretch || 1), 0);
}

/** הערכת "איזון" עמוד: הפרש גובה טורים. */
function pageImbalance(page) {
  if (!page.columns || page.columns.length < 2) return 0;
  return Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1]));
}

/**
 * **EXT-8 — חלוקה גלובלית אופטימלית של טורי העמוד (הוכחה מתמטית):**
 * כל מצב חוקי של שני טורים — אחרי כל רצף הזזות moveLineForward חוקיות —
 * הוא **פיצול רציף** של רצף הקריאה: col0 = seq[0..k), col1 = seq[k..n).
 * (הוכחה: moveLineForward מעביר אך ורק את סוף col0 לראש col1 או את ראש col1
 * לסוף col0; אינדוקציה על מספר המהלכים שומרת על רציפות ועל סדר seq.)
 * לכן מרחב המצבים החוקי הוא בדיוק k ∈ [0..n], והמינימום הגלובלי של
 * ‏|H0(k) − H1(k)| בכפוף לקיבולת שני הטורים נמצא בזמן O(n) בסכומי קידום —
 * במקום הטיפוס הגרידי שורה-שורה שנעצר במינימום מקומי/בקיבולת.
 * סדר העדפות לקסיקוגרפי: (1) גבול-תפר נקי מ-widow/orphan, (2) |Δ| מינימלי,
 * (3) תנועה מינימלית מהפיצול הנוכחי (יציבות/דטרמיניזם).
 * @returns {{k:number, delta:number, clean:boolean}|null} — null אם אין פיצול חוקי-קיבולת
 */
function optimalSplit(cols, opts = {}) {
  const cap = opts.cap != null ? opts.cap : Number.POSITIVE_INFINITY;
  const extraLast = opts.extraLast || 0; // תקציב הערות של העמוד — על הטור האחרון (P1-8)
  const c0 = cols[0] || [], c1 = cols[1] || [];
  const seq = [...c0, ...c1];
  const n = seq.length;
  if (!n) return null;
  const h = (ln) => (ln.heightPx || 0) * (ln.aqStretch || 1);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + h(seq[i]);
  const total = pre[n];
  const k0 = c0.length;

  // גבול-תפר נקי (ווידוא/יתום קלאסיים, מבוסס ריצות tokenId):
  //  - widow-bottom: לבלוק שחוצה את הגבול יש **שורה אחת בדיוק** בתחתית col0
  //    (השורה שלפני הגבול היא ראשונת הריצה שלו ב-seq).
  //  - widow-top: לבלוק שחוצה את הגבול יש **שורה אחת בדיוק** בראש col1 והיא
  //    גם אחרונת הבלוק (הריצה מסתיימת מיד אחריה).
  // לא נעזר בדגלי part ('first'/'rest') — הם מוטבעים לכל שורות הצ'אנק
  // ב-pushLinks ואינם מעידים על מיקום בבלוק (נלכד בניפוי EXT-8: כל 39
  // שורות הפיצול נשאו part='first' וסימנו כל גבול פנימי כ-widow).
  const cleanBoundary = (k) => {
    if (k > 0 && k < n) {
      const lt = seq[k - 1].meta && seq[k - 1].meta.tokenId;
      const rt = seq[k].meta && seq[k].meta.tokenId;
      if (lt != null && lt === rt) { // הבלוק ממשיך מעבר לגבול
        if (k - 2 < 0 || (seq[k - 2].meta && seq[k - 2].meta.tokenId) !== lt) return false; // widow-bottom
        if (k + 1 >= n || (seq[k + 1].meta && seq[k + 1].meta.tokenId) !== rt) return false; // widow-top
      }
    }
    return true;
  };

  let best = null;
  for (let k = 0; k <= n; k++) {
    const H0 = pre[k];
    const H1 = total - pre[k] + extraLast;
    if (H0 > cap + 0.5 || H1 > cap + 0.5) continue; // קיבולת קשה (REQ-BAL-09)
    const delta = Math.abs(H0 - H1);
    const clean = cleanBoundary(k);
    const score = (clean ? 0 : 1) * 1e9 + delta;
    if (
      !best ||
      score < best.score - 1e-9 ||
      (Math.abs(score - best.score) <= 1e-9 && Math.abs(k - k0) < Math.abs(best.k - k0))
    ) {
      best = { k, delta, clean, score };
    }
  }
  return best;
}

/**
 * איזון מלא של עמוד — **החלוקה הגלובללית האופטימלית (EXT-8)**: אם Δ>maxDelta
 * נבחר פיצול הממזער את |Δ| על כל הפיצולים החוקיים-קיבולתית (הוכחה ב-optimalSplit),
 * בהעדפת גבול-תפר נקי ובתנועה מינימלית. שמירת סדר הקריאה מובנית (פיצול רציף).
 * נסיגה אם אין פיצול חוקי (rollback integrity REQ-BAL-09).
 * @returns {{changed:boolean, before:number, after:number}}
 */
function balancePage(page, maxDelta) {
  const before = pageImbalance(page);
  if (before <= maxDelta) return { changed: false, before, after: before, moves: 0 };
  if (!page.columns || page.columns.length < 2) return { changed: false, before, after: before };
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf (column-flow) — כולל הפס
  // החוצה־טורים; תקציב ההערות עובר כ-extraLast של הטור האחרון (כמו ב-dp-planner,
  // P1-8) — בעבר חושב מ-contentBox.height גולמי והתעלם משניהם.
  const cap = colCapacityOf(page, { fnBudget: false });
  const best = optimalSplit(page.columns, { cap, extraLast: page.fnReservedHeightPx || 0 });
  if (!best || best.k === page.columns[0].length) {
    // אין פיצול חוקי-קיבולת, או שהנוכחי כבר האופטימלי — לא מדווח שינוי
    return { changed: false, before, after: before, rollback_reason: best ? 'at-optimum' : 'capacity' };
  }
  const seq = [...page.columns[0], ...page.columns[1]];
  const k0 = page.columns[0].length;
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  const after = pageImbalance(page);
  return { changed: true, moves: Math.abs(best.k - k0), before, after, optimal: true, cleanBoundary: best.clean };
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
 * AutoQuality (פורטר מ‑Gold; כל הגבולות מה‑registry).
 * **EXT-20 — מתיחה אנכית אמיתית:** מקדם ה-AQ הוא מקדם **גובה-שורה**
 * (interline): ‏`aqStretch = cap/used` מעוגן לגבולות השלב, ו-usedHeight כבר
 * מחשב אותו — המתיחה מגיעה ליעדה (תחתית הטור) גם במודל, גם ב-DOM
 * וגם בפרויקטור. בעבר המקדם חושב מהגובה החסר אך הוחל כ-wordSpacing
 * אופקי — usedHeight לא השתנה והיעד מעולם לא הושג; שלושת נתיבי התצוגה
 * פירשו אותו אחרת. כעת שדה אחד, משמעות אחת, שלושה צרכנים זהים.
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
    for (let c = 0; c < page.columns.length; c++) {
      const lines = page.columns[c];
      const used = usedHeight(lines);
      if (!lines.length) continue;
      // **S5.2 (P-2):** קיבולת אפקטיבית פר-טור — כולל הפס החוצה־טורים ותקציב
      // ההערות (על הטור האחרון). המתיחה עד לתחתית האמיתית של הטור.
      const cap = colCapacityOf(page, { colIndex: c });
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

module.exports = { balancePage, optimalSplit, pageImbalance, applyChapterEndMode, autoQualityPass, usedHeight };

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

/**
 * **S5.2 (P-2 — איחוד חישוב קיבולת טור):** המקור היחיד לקיבולת האפקטיבית
 * של טור בעמוד DP: גובה תיבת התוכן מהתבנית, בהפחתת:
 *  - הפס החוצה־טורים (spanning band, FWD-1) — הטורים מתחילים מתחתיו;
 *  - תקציב ההערות של העמוד (fnReservedHeightPx, F-17) — נרשם על הטור האחרון.
 * בעבר חושבו 4 העתקים מקבילים (balancing.balancePage/autoQualityPass,
 * dp-planner.balancePageSafe, protections-matrix.containment) שהתעלמו מהפס
 * ו/או מהתקציב ⇒ גלישת טור שקטה בעמודים עם הערות או פס כותרת.
 *
 * @param {object} page - עמוד DP: template.contentBox, spanning?, fnReservedHeightPx?, columns
 * @param {{colIndex?:number, fnBudget?:boolean}} [opts]
 *  - colIndex: הטור שאליו שייכת הקיבולת (ברירת מחדל: האחרון — המחמיר);
 *    תקציב ההערות מופחת רק מהטור האחרון (שם הוא נרשם).
 *  - fnBudget:false — ביטול הפחתת תקציב ההערות (למי שמודד usage כולל
 *    התקציב בעצמו — כמו usedHeight של dp-planner או extraLast של optimalSplit).
 */
function colCapacityOf(page, opts = {}) {
  if (!page || !page.template || !page.template.contentBox) return 0;
  let cap = page.template.contentBox.height;
  if (page.spanning && page.spanning.heightPx) cap -= page.spanning.heightPx;
  const fn = opts.fnBudget !== false && page.fnReservedHeightPx > 0 ? page.fnReservedHeightPx : 0;
  // **S6.0 (R3-C2 — מרזב חוצה-טורים):** אזור ההערות נמשך לרוחב תיבת
  // התוכן כולה בשני המרנדרים (DOM ו-PDF) — לכן התקציב מופחת מ**כל**
  // הטורים. בעבר הופחת רק מהטור האחרון ⇒ טור ימני (RTL) חדר עד 44px
  // לתוך אזור ההערות בכל עמוד רווי-הערות, והגנת containment הייתה עיוורת
  // לזה (אותה נוסחה).
  if (fn) cap -= fn;
  return cap;
}

module.exports = { columnWidths, blockGapPx, isFullWidthBlock, colCapacityOf, buildPageTemplate };

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
  // **S5.2 (תיקון 1 — קריסה ביציאת תקרה):** allViolations הוגדר בתוך גוף הלולאה
  // (const) אך נצרך אחריה בנתיב תקרת־האיטרציות ⇒ ReferenceError שהחליף את רישום
  // הפשרה בקריסה. הועלה מעל הלולאה — ההפרות של האיטרציה האחרונה הן הנשארות
  // בפועל ונרשמות במלואן (recordRemaining).
  let allViolations = [];

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
    allViolations = [];
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
  // **S5.1 (נפתח והוחזר — ראה ISSUE_REGISTRY #P-1):** \s תופס גם NBSP ולכן
  // פירק את הדבקות glueNoteMarkers/glueGershayim/glueAbbreviations (הפרת
  // BRZ-11 — סמן עלול להישאר בסוף השורה). התיקון — פיצול על /[\t\n ]+/
  // בלבד — אומת בסקירה אך חשף פערי חשבונאות בנתיב ה-DP (marker-mismatch
  // body/assigned בבדיקות הספר-האמת); הוחזר עד סגירתם (ניתוח מלא
  // ב-ISSUE_REGISTRY). החשבונאות ב-pipeline (countKnown, נורמות NBSP)
  // תוקנה בנפרד ונשארת.
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
 *
 * **S5.2 (תיקון 2 — מיזוג ללא בדיקת רוחב):** בעבר המילה נדחפה לשורה הראשונה
 * של הטור הבא (`unshift` + `pop`) ללא מדידה מחדש — השורה המקבלת יכלה לגלוש
 * מהטור (נמדד +1.95..25px בביקורת) ⇒ הדפדפן עוטף מחדש ⇒ טקסט-על-טקסט
 * (מחלקת D-92). כעת: המיזוג נשמר רק אם הרוחב הטבעי הממוזג נכנס ב‑colW−FIT_EPS
 * (אותה מדידה של המתכנן: widthPx הקיים של השורה המקבלת + רווח + מדידת המילה);
 * לא ממזגים לתוך שורת כותרת/שורה אחרונה (isLast), לא מוציאים מילה מכותרת;
 * וללא מדידה (opts.measure) — אין מיזוג בכלל (שמרנות: מי שלא מודד לא מוכיח התאמה).
 * @param {Array<Array<object>>} columnLines
 * @param {number} minLen - אורך מינימלי של מילה "נופלת"
 * @param {{measure?:(t:string)=>number, colW?:number, fitEps?:number}} [opts]
 */
function fixDropWordInColumns(columnLines, minLen = 3, opts = {}) {
  const measure = typeof opts.measure === 'function' ? opts.measure : null;
  const colW = Number(opts.colW) || 0;
  // FIT_EPS שמרני — כמו במנוע המורשת ובשבירת השורות (kp-linebreak, D-92-DP)
  const fitEps = Number.isFinite(opts.fitEps) ? opts.fitEps : 0.75;
  let fixed = false;
  for (let c = 0; c < columnLines.length - 1; c++) {
    const lines = columnLines[c];
    const nextFirst = columnLines[c + 1][0];
    if (!lines.length || !nextFirst) continue;
    const last = lines[lines.length - 1];
    // לא ממזגים לתוך כותרת או שורה אחרונה של פסקה (יישור/סופית נשברים),
    // ולא מוציאים מילה משורת כותרת (הכותרת מאבדת את מילתה).
    if (nextFirst.kind === 'heading' || nextFirst.isLast === true) continue;
    if (last.kind === 'heading') continue;
    if (last.words.length === 1 && last.words[0].length < minLen && nextFirst.words.length > 1) {
      // רוחב טבעי ממוזג = widthPx שנמדד לשורה המקבלת + רווח + המילה הנמשכת.
      // התג (MARK_TAG, D-53) מוסר מהמדידה — כמו ב-measureWithParen של ה-pipeline;
      // NBSP נמדד כרווח (כמו internal-glue ב-kp).
      let mergedW = null;
      if (measure && colW > 0) {
        const word = String(last.words[0]).replace(/\uE102/g, '').replace(/\u00A0/g, ' ');
        mergedW = (nextFirst.widthPx || 0) + measure(' ') + measure(word);
      }
      if (mergedW == null || mergedW > colW - fitEps) continue; // לא נכנס — המילה נשארת (status quo)
      // משלבים את המילה הנופלת לתוך השורה הראשונה של הטור הבא (גרירה)
      nextFirst.words.unshift(...last.words);
      nextFirst.widthPx = mergedW; // רוחב השורה אחרי המיזוג (נצרך ל-runt/balance)
      lines.pop();
      fixed = true;
    }
  }
  return fixed;
}

module.exports = { protectWords, glueNoteMarkers, glueAbbreviations, fixDropWordInColumns };

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
  // **S6.0 (R3-C3 — אומדן ללא רווחים):** ההקרנה (wrapNoteTokens) שוברת
  // את ההערה **עם** רוחבי רווח בין מילים — האומדן כאן סכם מילים בלבד
  // ⇒ כל הערה הגובלת בשבירת-שורה נמדדה שורה אחת פחות (19–21px) וההערה
  // שאחריה חפפה אותה (32% מ-230 הערות בדגימה). נכללים גם הסמן ורווח
  // ההמשך בשורה הראשונה — כמו שמצויר בפועל.
  const spaceW = measure(' ', size) * factor;
  const mkTxt = note && note.marker != null ? String(note.marker) : '';
  const mkW = mkTxt ? measure(mkTxt, size) * factor + spaceW : 0;
  let lines = 1, w = Math.min(mkW, colW);
  for (const word of words) {
    const ww = measure(word, size) * factor;
    const addW = (w > 0 ? spaceW : 0) + ww;
    if (w + addW > colW && w > 0) { lines++; w = ww; } else w += addW;
  }
  return lines * lh;
}

/**
 * רוחב נתיב אחד במרזב לפי footnote-columns.
 * **S5.2 (P-4):** _fnColWidthPx מכוין כעת ב-pipeline מהגיאומטריה —
 * 1 ⇒ רוחב תיבת התוכן המלא (674.90px בברירת המחדל; כמו שמוקרן בגיאומטריה:
 * x=colLeftOf, w=colWidthOf); 2 ⇒ (רוחב מלא − מרזב התבנית)/2. הפונקציה
 * נשארת פשוטה — ההכוונה נעשתה במקור היחיד (pipeline) ולא כאן.
 */
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
      // **S6.0 (R8-L1):** כשל של עבודת צד (register-font-result וכו') נדחה
      // כעת — בעבר נפתר בהצלחה עם {ok:false} ואיש לא בדק (רישום גופן
      // שנכשל נחשב "הצלחה" ⇒ מדידה בפולבק בלי דיווח).
      else if (m.ok === false) p.reject(new Error(`side-job: ${m.error || m.message || 'failed'}`));
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
 * @param {object} [env] — סביבת המנוע (S4.15: windowFontBytes/marginFontBytes — גופני
 *   מילת-החלון/הערות-הצד של המקור; בלעדיהם המדידה נופלת לגופן הגוף)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, result?:object, projected?:object, info?:object}}
 */
function exportPdf(text, settingsIn, fontBytes, fontName, env) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' }; // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { typeset } = require('../core/pipeline');
  /* node-only */ const { registerFont, unregisterFont, restoreFontRegistration, registeredFonts: registeredFontsRef } = require('../typography/measure-api');
  /* node-only */ const { parseFont, glyphIdOf } = require('../typography/font-metrics');
  /* node-only */ const { buildSubset, charInventory } = require('../typography/font-subset');
  /* node-only */ const { projectDocument } = require('./geometry-projector');
  /* node-only */ const { writePdf } = require('./pdf-writer');
  const profileName = fontName || settingsIn['body-font'] || 'ToraExport';
  // **S6.0 (R2-C1 — דליפת רישום גופן):** profileName עלול להיות שם הגופן
  // של התצוגה החיה (body-font, למשל 'Frank Ruhl Libre' שנרשם ע"י ה-UI).
  // בעבר: הייצוא דרס את הרישום וב-finally מחק אותו ⇒ אחרי ייצוא PDF אחד
  // המדידה החיה נפלה בשקט ל'table' (סטיית עימוד 2–17% לפי EXT-13).
  // כעת: שחזור הרישום הקודם בסוף הייצוא; ובכשל רישום — לא נמחק רישום
  // קיים תקין (בעבר נמחק גם כשה-parse נכשל).
  const hadPrevFont = registeredFontsRef.has(profileName);
  const prevFont = hadPrevFont ? registeredFontsRef.get(profileName) : null;
  const reg = registerFont(profileName, fontBytes);
  if (!reg.ok) { if (!hadPrevFont) unregisterFont(profileName); return { ok: false, error: `font:${reg.error}` }; }
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
    const result = typeset(text, settings, { noRecommendations: true, ...(env || {}) });
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
    // **S5.2 (O1 — קריסת ייצוא על תו זר):** מלאי ה-F1 כלל גם תווים שחסרים
    // בגוף הטקסט (כל אות לטינית — "PDF", ® וכו') ו-buildSubset נכשל
    // (subset:tofu) לפני שרשת ה-fallback הפר-תו הספיקה לפעול: הדפדפן
    // הציג את המילה דרך המחסנית וה-PDF סירב להיווצר — תצוגה≠ייצוא בכלל
    // גרוע. כעת: מלאי ה-F1 = תווים שקיימים בו בפועל; השאר נופלים ל-/F4
    // (הסריקה שלמטה אוספת אותם למלאי ה-F4) או מושמטים אם אינם בשום גופן.
    const f1Inventory = inventory.filter(ch => glyphIdOf(font, ch) !== 0);
    const subset = buildSubset(font, f1Inventory);
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
    // **S4.15 (גופן משני — מילות-חלון FrankReal-Bold):** המקרן מסמן את
    // מילות-החלון (fontKey='window'); כאן נבנה תת-גופן שלהן ונעביר לכותב
    // ה-PDF (/F2) — ציור בגופן המקור + רוחב אמיתי (מונע חריגה מהשקע).
    // הגופן נרשם ע"י typeset מ-env.windowFontBytes באותו תהליך.
    let fontForWriter2 = null;
    {
      const winProfile = registeredFontsRef.get('FrankReal-Bold') || registeredFontsRef.get('FrankReal');
      if (winProfile) {
        const winParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'window') winParts.push(w.text);
          }
        }
        if (winParts.length) {
          const winSubset = buildSubset(winProfile, charInventory(winParts.join(' ')));
          if (winSubset.ok) {
            const winC2g = subsetNewCmap(winSubset);
            fontForWriter2 = {
              subsetBytes: winSubset.bytes,
              widthsUnits: winSubset.widthsUnits,
              unitsPerEm: winSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = winC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(winSubset), ch);
              },
              charToGidEntries: () => [...winC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן שלישי — DavidLibre-Bold, כותרות/TOC):** המקרן מסמן מילות
    // כותרת (fontKey='heading'); כאן נבנה תת-גופן ונעביר לכותב ה-PDF (/F3) —
    // כמו הייחוס (DavidLibre-Bold בכל הכותרות ושורות ה-TOC).
    let fontForWriter3 = null;
    {
      const headProfile = registeredFontsRef.get('DavidLibre-Bold');
      if (headProfile) {
        const headParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'heading') headParts.push(w.text);
          }
        }
        if (headParts.length) {
          const headSubset = buildSubset(headProfile, charInventory(headParts.join(' ')));
          if (headSubset.ok) {
            const headC2g = subsetNewCmap(headSubset);
            fontForWriter3 = {
              subsetBytes: headSubset.bytes,
              widthsUnits: headSubset.widthsUnits,
              unitsPerEm: headSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = headC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(headSubset), ch);
              },
              charToGidEntries: () => [...headC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן רביעי — Frank Ruhl Libre, fallback לפיסוק):** תווים שחסרים
    // בגוף הראשי (פיסוק בסיסי בגופנים תורניים — למשל ' . בגוטמן רש"י) מצוירים
    // ב-/F4 — בדיוק כפי שהדפדפן נופל ל-'Frank Ruhl Libre' שבמחסנית, וכפי
    // שהמדידה מודדת אותם (setMissingGlyphFallbackFont). בלי זה הפיסוק היה
    // נעלם מהייצוא.
    let fontForWriter4 = null;
    {
      const frlProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (frlProfile && fontForWriter) {
        const missingChars = new Set();
        for (const pg of projected.pages) {
          const scan = (lines) => {
            for (const ln of lines) {
              for (const w of (ln.words || [])) {
                for (const ch of String(w.text || '')) {
                  if (fontForWriter.cidOf(ch) === 0 && glyphIdOf(frlProfile, ch) !== 0) missingChars.add(ch);
                }
              }
            }
          };
          scan(pg.spanning ? pg.spanning.lines : []);
          scan(pg.lines || []);
          for (const fn of (pg.footnotes || [])) scan([{ words: fn.words || [] }]);
          // **S5.1 (תיקון C3):** הגיליון וסלוטי הכותרת העליונה לא נסרקו —
          // תו שחסר בגוף ומופיע רק שם היה נעלם מה-PDF (ה-DOM הציג אותו).
          if (pg.folio && pg.folio.text) scan([{ words: [{ text: pg.folio.text }] }]);
          if (pg.header) for (const s of (pg.header.slots || [])) if (s && s.text) scan([{ words: [{ text: s.text }] }]);
        }
        if (missingChars.size) {
          const punctSubset = buildSubset(frlProfile, charInventory([...missingChars].join('')));
          if (punctSubset.ok) {
            const punctC2g = subsetNewCmap(punctSubset);
            fontForWriter4 = {
              subsetBytes: punctSubset.bytes,
              widthsUnits: punctSubset.widthsUnits,
              unitsPerEm: punctSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = punctC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(punctSubset), ch);
              },
              charToGidEntries: () => [...punctC2g.entries()]
            };
          }
        }
      }
    }
    // **S5.1 (תצוגה=ייצוא בגופנים — תיקון L3):** הגופן החמישי (Frank Ruhl
    // Libre — גוף ההערה, fontKey 'fnbody') והשישי (Hadassah Friedlaender —
    // הערות-צד, fontKey 'margin'). עד כאן צוירו בגוף הטקסט (/F1) בזמן שה-DOM
    // מציג אותם ב-FRL/Hadassah — הייצוא ≠ התצוגה. מילים נאספות גם משורות
    // הגוף (margin-note) וגם מסמני/גוף ההערה (footnotes.words).
    let fontForWriter5 = null;
    {
      const fnProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (fnProfile) {
        const fnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'fnbody') fnParts.push(w.text);
          }
          for (const fn of (pg.footnotes || [])) for (const w of (fn.words || [])) if (w.fontKey === 'fnbody') fnParts.push(w.text);
        }
        if (fnParts.length) {
          const fnSubset = buildSubset(fnProfile, charInventory(fnParts.join(' ')));
          if (fnSubset.ok) {
            const fnC2g = subsetNewCmap(fnSubset);
            fontForWriter5 = {
              subsetBytes: fnSubset.bytes,
              widthsUnits: fnSubset.widthsUnits,
              unitsPerEm: fnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = fnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(fnSubset), ch);
              },
              charToGidEntries: () => [...fnC2g.entries()]
            };
          }
        }
      }
    }
    let fontForWriter6 = null;
    {
      const mnProfile = registeredFontsRef.get('Hadassah Friedlaender');
      if (mnProfile) {
        const mnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'margin') mnParts.push(w.text);
          }
        }
        if (mnParts.length) {
          const mnSubset = buildSubset(mnProfile, charInventory(mnParts.join(' ')));
          if (mnSubset.ok) {
            const mnC2g = subsetNewCmap(mnSubset);
            fontForWriter6 = {
              subsetBytes: mnSubset.bytes,
              widthsUnits: mnSubset.widthsUnits,
              unitsPerEm: mnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = mnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(mnSubset), ch);
              },
              charToGidEntries: () => [...mnC2g.entries()]
            };
          }
        }
      }
    }
    const bytes = writePdf({
      pages: projected.pages,
      pageSizeMm,
      font: fontForWriter,
      font2: fontForWriter2,
      font3: fontForWriter3,
      font4: fontForWriter4,
      font5: fontForWriter5,
      font6: fontForWriter6,
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
    // **S6.0 (R2-C1):** שחזור הרישום שהיה קיים לפני הייצוא (או הסרה אם לא היה)
    restoreFontRegistration(profileName, prevFont);
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
  // **S5.2 (O16 — תלכיד ZIP מאבד הגדרות מורשת):** בעבר כל מפתח שמתחיל
  // ב '_' נזרק — כולל _imudRaw (שממנו נתיב המורשת קורא ~12 מפתחות
  // חיים: hdr-r/c/l-type, note-marker-size, note-num-separator ועוד),
  // _layout-profile (מפעיל את המנוע) ו-_legacy-ui-state. פרויקט שנשמר
  // ונטען איבד את ההגדרות והעימוד השתנה בשקט. כעת המפתחות החיים נשמרים.
  const KEEP = new Set(['_imudRaw', '_layout-profile', '_legacy-ui-state', '_customPages', '_customStyles']);
  for (const [k, v] of Object.entries(settings || {})) {
    if (k.startsWith('_') && !KEEP.has(k)) continue;
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
  /<script[^>]+src=["']https?:/i,
  /* **S6.0:** גם הפניות יחסיות-פרוטוקול (//host) — בעבר עברו את השומר */
  /["'(]\/\/(?!localhost)[a-z0-9.-]+/i
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
/* **S5.2 (מדיניות ללא-קרנינג — תצוגה=ייצוא):** המודל מודד ללא קרנינג
   (kernPairs אינו נצרך במדידה) וה-PDF מצייר לפי רוחבי hmtx בלבד — אבל
   הדפדפן מקרן גופנים עם טבלאות kern/GPOS כברירת מחדל ⇒ רוחב מילה ב-DOM
   היה שונה מהמודל ומה-PDF. font-kerning:none משווה את שלושת הנתיבים. */
/* **S6.0:** הכללת גם הערות/endnotes/הערות-צד/TOC — בלי זה הדפדפן עימד
   אותן עם קרנינג בניגוד למודל/ה-PDF (רוחב שונה ⇒ עטיפה שונה). */
html,body,.page,.line,.rh,.band,.footnote,.footnotes,.endnote-note,.endnote-list,.side-note,.toc-row,.margin-note,.custom-box{font-kerning:none;font-variant-ligatures:none}
.book{display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 0}
.page{background:#fff;color:#000;box-shadow:0 2px 12px rgba(0,0,0,.45);position:relative;overflow:hidden;padding:0}
.columns{position:absolute;top:0;left:0;right:0;bottom:0}
.column{position:absolute;top:0;bottom:0}
.line{white-space:normal;text-align:justify;text-justify:inter-word}
.line--last{text-align:center}
/* **S4.23 (דיווח משתמש — יישור שורות בתצוגה/ייצוא):** שורה בודדת בבלוק
   נחשבת "השורה האחרונה" לפי הוראת CSS — ו-justify לעולם אינו מותח אותה.
   כל .line הוא בלוק בן-שורה-אחת מתוכנן (השבירה נעשתה במנוע); לכן
   text-align:justify לבדו היה אפס-פעולה והשורות נשארו מרופטות בצד שמאל
   (נמדד: פערים 2..53px מקצה הטור). רק text-align-last:justify מותח
   אותה בפועל — אותה נוסחה של המקרן ל-PDF. לא על שורות אחרונות/כותרות
   (הן center מטבען, ו-line--last-right/stretch מוגדרות בנפרד). */
.line:not(.line--last):not(.line--heading):not(.band){text-align-last:justify}
/* **S4.24 (באג מרכוז פסים):** קווי הפס (class="line band …" — כותרות-רוחב,
   סימנים, שורות שער) נפגעו מהכלל לעיל: שורה בודדת בבלוק נחשבת "אחרונה"
   ו-text-align-last:justify דרס את ה-center — מילים פזורות מקצה לקצה
   (נמדד בחי: "כל הזכויות שמורות" מיושרת למלוא 378px; מילה בודדת כמו
   "הקדמה" נדבקת לקצה הימני — אסימטריה 494px). :not(.band) מחזיר את
   המרכוז; רינדור ה-DOM גם קובע text-align-last:auto ישירות ב-mkLine. */
.band{text-align-last:auto}
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
.folio{position:absolute;bottom:25px;width:100%;text-align:center;font-size:10pt}
.folio--outer-left{left:8px;width:auto;text-align:left}
.folio--outer-right{right:8px;width:auto;text-align:right}
.folio--outer{left:8px;width:auto;text-align:left}
/* **S5.1:** 'outer' מודע-זוגיות כמו pos-outer של המקור (style.css:1369:
   even=flex-start=ימין ב-RTL; odd=שמאל) — תיקון NUMPOS/bottom_outer. */
.page:nth-child(even) .folio--outer{left:auto;right:8px;text-align:right}
.folio--top{bottom:auto;top:4px}
.folio--in-header{bottom:auto;top:6px}
.page-num-badge{display:inline-flex;align-items:center;justify-content:center;padding:1px 4px;line-height:1}
.page-num-frame-circle{border:1.2px solid #333;border-radius:50%;min-width:22px;height:22px;padding:1px}
.page-num-frame-box{border:1.2px solid #333;border-radius:3px;min-width:22px;height:20px;padding:1px 4px}
.side-note{position:absolute;font-size:.75em;line-height:1.15;max-height:60%;overflow:hidden}
/* **S6.0 (R5-L4):** גובה בסיסי אחיד עם ההקרנה ל-PDF (1.15 — בלי זה
   line-height:normal תלוי-גופן והשורות נפרדות בין תצוגה לייצוא). */
.margin-note{color:#404040}
.col-divider{position:absolute;width:0;border-left:1px solid #999}
.col-divider--thin{border-left:1px solid #999}
.col-divider--dashed{border-left:1px dashed #999}
.col-divider--double{border-left:3px double #999}
.w--paren{color:#333}
/* **S4.15 (גופן מילת-החלון — כמו המקור):** .first-word-window של המקור —
   FrankReal משקל 900 בגודל 1.5em. הגיאומטריה (רוחב החלון+צמצום שתי
   השורות הראשונות) כבר במנוע (מדידת FrankReal-Bold.ttf — הוכח מסימון
   הייחוס: התאמה מושלמת ל-116 מילות-חלון); כאן רק הגופן החזותי.
   line-height:0.85 כמו המקור — תיבת השורה אינה מתנפחת (חפיפה אפס). */
.w--window{font-family:'FrankReal','Frank Ruhl Libre',serif;font-weight:900;line-height:.85}
.endnote-title{font-size:1.2em;font-weight:700;margin:8px 12px}
/* **S6.0 (R4-M7):** .8em — זהה למודל/PDF (0.8×body; .85em גרם לטקסט
   גדול ב-6.25% שנעטף ליותר שורות מהתקציב). */
.endnote-list{font-size:.8em;padding:0 12px}
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
.deco{position:absolute;background-repeat:no-repeat;background-position:center}/* EXT-4: עיטורי הדף (שערים/רקעים) — ממוקמים מה-rectים (F-09) */
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

const { GEO, SZ, parenCenterRaisePx } = require('../layout/legacy-imud-flow');
// **S5.1:** מקור יחיד לגופן שורה לפי סוגה — כמו ה-DOM (renderLine). (השורה
// בשדה hFam של הכותרות ה-inline משתמשת בזה — נדרש כאן.)
const { lineFontFamily } = require('./line-font');
const { MeasureAPI, registeredFonts, resolveMeasureImpl } = require('../typography/measure-api');
const { ornamentInk, parseSvgPaint, svgToPdfOps } = require('../decoration/ornament-ink'); // **EXT-4:** הדיו — מקור יחיד

const COL_R = { x: GEO.COL_R_X, w: GEO.COL_W };
const COL_L = { x: GEO.COL_L_X, w: GEO.COL_W };

/**
 * בסיס שורה לפי מודל תיבת השורה של CSS (half-leading + ascent).
 * **S5.1 (תצוגה=ייצוא, תיקון C2):** ה-descent כבר לא מוקשה 0.2 — המטריקה
 * האמיתית של הגופן (api.descentEm(); במימוש table הערך 0.20 כבריית המחדל,
 * זהה להתנהגות הקודמת). בגופן הגוף (גוטמן-רש"י, D=0.388) ההקשחה הסיטה את
 * כל שורות הגוף ב-PDF ב-~1.5px מהמודל של הדפדפן (ומהמקור).
 */
function baselineOf(yTop, h, sizePt, ascentEm, descentEm = 0.2) {
  const sizePx = sizePt * (96 / 72);
  const contentH = (ascentEm + descentEm) * sizePx;
  const half = Math.max(0, (h - contentH) / 2);
  return yTop + half + ascentEm * sizePx;
}

/** מיקום מילים RTL מיושרות ברוחב נתון. מחזיר words:[{text,x,w,sizePt,baselineY,fontKey?}] */
function placeWords(words, api, xLeft, width, sizePt, align, baseY, opts = {}) {
  // **S4.24 (מילים של תווי-כיוון בלבד — הדבקה לשכן):** כמו ברינדור ה-DOM —
  // מילת RLM/LRM בלבד היא ברוחב אפס; הרווח שמפריד אותה משכנתה נכלל
  // ברוחב השורה ומזיז את המרכוז (זהה לבאג שנמדד ב-DOM החי, עמ' 572).
  // האינדקסים של markers/parenIdx/קצוות ממופים למילה המארחת.
  const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
  let src = words, srcMap = null;
  if (words.some((w) => typeof w === 'string' && FORMAT_WORD_RE.test(w))) {
    const items = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (typeof w === 'string' && FORMAT_WORD_RE.test(w)) {
        if (items.length) { items[items.length - 1].text += w; continue; }
        items.push({ text: w, srcIdx: -1 });
        continue;
      }
      const it = { text: w, srcIdx: i };
      if (items.length === 1 && items[0].srcIdx === -1) { it.text = items[0].text + w; items[0] = it; }
      else items.push(it);
    }
    src = items.map((it) => it.text);
    srcMap = items.map((it) => it.srcIdx);
    const remapArr = (a) => (Array.isArray(a) ? srcMap.map((oi) => (oi >= 0 ? !!a[oi] : false)) : a);
    const remapSet = (s) => {
      if (!s) return s;
      const ns = new Set();
      srcMap.forEach((oi, ni) => { if (oi >= 0 && s.has(oi)) ns.add(ni); });
      return ns;
    };
    opts = {
      ...opts,
      markers: opts.markers ? remapArr(opts.markers) : opts.markers,
      parenIdx: remapSet(opts.parenIdx),
      parenStarts: remapArr(opts.parenStarts),
      parenEnds: remapArr(opts.parenEnds)
    };
  }
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  // **S4.24 (רווח בגודל הסוגריים):** כמו spaceBetween בשבירה — הרווח בין
  // שתי מילים ששני צדדיהן בתוך (...) נמדד/מוצג ב-10pt (סוגריים = span
  // בגודל מוקטן גם לרווחים הפנימיים — הוכחת S4.15 מהייחוס). בלי זאת
  // שורת-סוגריים רחבה מהטור בדיו וגולשת (נמדד: 4px, עמ' 403). justify
  // מחלק את העודף בחלקים שווים **מעל** הרווחים הטבעיים — בדיוק כמו
  // justify של CSS (התצוגה = הייצוא, כמו S4.23).
  const parenSpaceW = api.measureTextWidth(' ', SZ.body + SZ.parenDelta, 0);
  const placed = src.map((w, i) => {
    if (typeof w === 'object') return w; // כבר ממוקם (חלון/סמן)
    const isMarker = opts.markers && opts.markers[i];
    const isParen = opts.parenIdx && opts.parenIdx.has(i);
    // **EXT-17:** גודל מילת-הסמן בגוף — הגדרת המקור (note-marker-size, ברירת
    // מחדל 8) ולא נגזרת מגודל הגוף.
    const markerSz = opts.markerSize != null ? opts.markerSize : SZ.fnMarker;
    const sz = isMarker ? markerSz : (isParen ? SZ.body + SZ.parenDelta : sizePt);
    return { text: w, w: api.measureTextWidth(w, sz, 0), sizePt: sz, smallKind: isMarker ? 'marker' : (isParen ? 'paren' : null) };
  });
  const sumW = placed.reduce((a, w) => a + w.w, 0);
  const gaps = Math.max(0, placed.length - 1);
  let gapWs = null;
  let naturalSum = 0;
  if (gaps > 0) {
    gapWs = new Array(gaps);
    for (let g = 0; g < gaps; g++) {
      const inParen = !!(opts.parenEnds && opts.parenStarts && opts.parenEnds[g] && opts.parenStarts[g + 1]);
      gapWs[g] = inParen ? parenSpaceW : spaceW;
      naturalSum += gapWs[g];
    }
  }
  if (align === 'justify' && gaps > 0 && sumW + naturalSum < width) {
    const extra = (width - sumW - naturalSum) / gaps;
    for (let g = 0; g < gaps; g++) gapWs[g] += extra;
  }
  const lineW = sumW + naturalSum;
  let xRight;
  // **S5.1 (תיקון C1 — align:'left'):** עד כאן לא היה ענף left — כל align
  // שאינו center נצמד לקצה הימני של התיבה. הסלוט השמאלי של הכותרת העליונה
  // צויר בצד הלא-נכון של תיבתו (+40px) ולא אצל השפה השמאלית כמו בייחוס.
  if (align === 'center') xRight = xLeft + (width + lineW) / 2;
  else if (align === 'left') xRight = xLeft + lineW;
  else xRight = xLeft + width;
  // **S4.26 (דיווח משתמש: "טקסט מוסגר ממוקם גבוה"):** סוגריים — מרכוז אנכי
  // מול הטקסט הרגיל (parenCenterRaisePx, אותו מודל תיבת-שורה כמו ה-DOM);
  // סמן-הערה נשאר מוגבה כמו super של המקור (0.33×גודל-השורה). בעבר שניהם
  // קיבלו את הגבהת הסמן — הסוגריים ישבו ~5.3px גבוה מדי.
  const parenRaise = parenCenterRaisePx(api.ascentEm(), sizePt, SZ.body + SZ.parenDelta);
  const out = [];
  let cursor = xRight;
  for (let k = 0; k < placed.length; k++) {
    const w = placed[k];
    cursor -= w.w;
    out.push({
      text: w.text, x: cursor, w: w.w,
      sizePt: w.sizePt,
      baselineY: w.smallKind === 'paren' ? baseY - parenRaise
        : (w.smallKind === 'marker' ? baseY - sizePt * (96 / 72) * 0.33 : baseY)
    });
    if (k < gaps) cursor -= gapWs[k];
  }
  return out;
}

/** רמות הפסים (ראי של HEADING_LEVEL_OF_BAND ב-dom-renderer — מקור יחיד סמנטי). */
const HEADING_LEVEL_OF_BAND_LEGACY = { 'h0-title': 0, 'h2-siman': 2, 'h2-title': 2, 'h3-title': 3 };

/** מפתח גופן לכותב ה-PDF לפי משפחה רשומה (S5.1 — תצוגה=ייצוא בגופנים). */
function fontKeyOf(fam) {
  if (fam === 'Frank Ruhl Libre') return 'fnbody';
  if (fam === 'Hadassah Friedlaender') return 'margin';
  if (fam === 'FrankReal-Bold' || fam === 'FrankReal') return 'window';
  return 'heading'; // DavidLibre-Bold (ברירת המחדל של הכותרות) וכל משפחה אחרת
}

/** הקרנת עמוד legacy בודד. */
function projectLegacyPage(pg, settings, api, winApi, headingApi = null, fnApi = null, mnApi = null) {
  // **S4.26:** headingApi — מדידת/ציור כותרות ב-DavidLibre-Bold (כמו הייחוס
  // וכמו ה-DOM); בלי גופן רשום — גופן הגוף (התנהגות קודמת).
  const hApi = headingApi || api;
  // **S5.1:** גופן גוף-ההערה (FRL) והערות-הצד (Hadassah) — כמו המדידה
  // במנוע וכמו ה-DOM. נפילה שקופה לגוף הטקסט כשהגופן אינו רשום.
  if (!fnApi) fnApi = api;
  if (!mnApi) mnApi = api;
  // **S5.1:** מטמון API לפי משפחה רשומה — לכותרות פר-רמה ושורות TOC.
  const famApiCache = new Map();
  const apiFor = (fam) => {
    if (!fam || !registeredFonts.has(fam)) return null;
    if (!famApiCache.has(fam)) {
      famApiCache.set(fam, new MeasureAPI({ 'body-font': fam, 'body-font-size-pt': SZ.body }, 'font-metrics'));
    }
    return famApiCache.get(fam);
  };
  // **EXT-17:** גדלי סמני ההערות מהגדרות המקור (ברירות המחדל: 8/8). ההגדרות
  // של פרופיל IMUD מגיעות ב-_imudRaw (כמו readConfig של העימוד עצמו).
  const imudSet = (settings && settings._imudRaw) || settings || {};
  const projCfg = {
    markerSize: Number(imudSet['note-marker-size']) || 8,
    listingSize: Number(imudSet['note-listing-num-size']) || 8
  };
  const ascent = api.ascentEm();
  const descent = api.descentEm(); // **S5.1:** המטריקה האמיתית — לא 0.2 מוקשה
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
    const baseY = baselineOf(b.y, b.h, b.sizePt, ascent, descent);
    // **S5.1 (תצוגה=ייצוא — גופן פר-רמה כמו ה-DOM):** הפסים מרונדרים ב-DOM
    // בגופן heading-N-font של הרמה; המקרן צייר הכול ב-DavidLibre קבוע.
    // נפילה ל-hApi (התנהגות קודמת) כשהמשפחה אינה רשומה.
    const bLvl = HEADING_LEVEL_OF_BAND_LEGACY[b.kind];
    const bFam = bLvl != null ? (settings[`heading-${bLvl}-font`] || 'DavidLibre-Bold') : null;
    const bApi = (bLvl != null && apiFor(bFam)) || hApi;
    const words = placeWords(b.text.split(' '), bApi, bandLeft, bandW, b.sizePt, 'center', baseY);
    const bKey = (bLvl != null && apiFor(bFam)) ? fontKeyOf(bFam) : 'heading';
    for (const w of words) w.fontKey = bKey;
    out.lines.push({
      x: bandLeft, y: b.y, w: bandW, h: b.h, words, align: 'center',
      kind: b.kind, level: null, isLast: false, sizePt: b.sizePt,
      baselineY: baseY, tokenId: b.tokenId != null ? b.tokenId : null
    });
  }

  // ---- תוכן השערים (ממורכז; מילים נפרדות — חילוץ לוגי, כמו בייחוס) ----
  // **D-89 (עיצוב שערים):** תיבת התוכן של כל שער לפי תיבות השער של המקור
  // (resolveShaarBoxStyle/renderSubShaar/renderBackShaar) — שער-המשנה והשער
  // האחורי ממורכזים בתיבה שמחוץ לפאנל האפור, לא ברוחב הפס המלא:
  //  - sub:  left:15mm / right:95mm ⇒ מרכז 245.7px=184.2pt (נמדד בייחוס עמ' 7: 184 ✓)
  //  - back: מרכז 548px=411pt (נמדד בייחוס עמ' 2: 411 ✓)
  //  - main: left:15mm / right:15mm ⇒ מרכז 396.85px=297.6pt (נמדד עמ' 1: 298 ✓)
  const MMpx = 96 / 25.4;
  const GATE_BOX = {
    'shaar-main': { x: 15 * MMpx, w: GEO.PAGE_W - 30 * MMpx },
    'shaar-back': { x: 95 * MMpx, w: 377.98 },
    'shaar-sub': { x: 15 * MMpx, w: GEO.PAGE_W - 110 * MMpx }
  };
  const gbox = GATE_BOX[pg.type] || { x: bandLeft, w: bandW };
  for (const g of (pg.gateLines || [])) {
    const h = g.sizePt * (96 / 72) * 1.3;
    const baseY = baselineOf(g.y, h, g.sizePt, ascent, descent);
    // **S4.9:** שורות המהדורה והמחבר בשער הראשי נכתבות אצל המקור כרצף אחד —
    // החילוץ מחזיר אותן בסדר מילים הפוך. שאר שורות השער מפוצלות למילים (לוגי).
    const singleOp = g.singleOp === true;
    const words = placeWords(singleOp ? [g.text] : g.text.split(' '), api, gbox.x, gbox.w, g.sizePt, 'center', baseY);
    // **D-89 (עיצוב שערים):** צבע פר-שורה מהמודל — בלוקי השער האחורי
    // (#111/#222/#1e3a8a/#334155/#64748b — הצבעים הקבועים של renderBackShaar
    // במקור, שנמדדו בייחוס עמ' 2) וכו'.
    if (Array.isArray(g.color)) for (const w of words) w.color = g.color;
    out.lines.push({
      x: gbox.x, y: g.y, w: gbox.w, h, words, align: 'center',
      kind: 'gate', level: null, isLast: false, sizePt: g.sizePt, baselineY: baseY, tokenId: null
    });
  }

  // ---- טורי גוף ----
  pg.columns.forEach((colLines, ci) => {
    const col = ci === 0 ? col0 : COL_L;
    for (const ln of colLines) {
      // **S4.14 (יישור-עליון לכותרות inline — כמקור):** בייחוס גליפי הכותרת יושבים
      // בראש השורה (עמ' 11: h5 גליפים ב-781.1 = ראש השורה 780.5 + 0.6px), והמרווח
      // נשאר מתחת. מרכוז אנכי (baselineOf) הוריד את הגליפים 3.4px ותיבת 11.5pt
      // חדרה למילת-החלון התלויה שמעליה (חפיפה 2.1px × 11 זוגות — H2 נכשל).
      const baseY = ln.kind === 'heading'
        ? ln.y + 0.6 + ascent * ln.sizePt * (96 / 72)
        : baselineOf(ln.y, ln.heightPx, ln.sizePt, ascent, descent);
      let words;
      if (ln.kind === 'heading') {
        // כותרת inline — מילים נפרדות (חילוץ לוגי, כמו בייחוס); **S5.1:**
        // גופן הרמה מההגדרות (כמו ה-DOM) — לא DavidLibre קבוע לכל הרמות.
        const joined = ln.words.join(' ');
        const hFam = lineFontFamily(ln, settings) || 'DavidLibre-Bold';
        const hApiLvl = apiFor(hFam) || hApi;
        words = placeWords(joined.split(' '), hApiLvl, col.x, col.w, ln.sizePt, 'center', baseY);
        const hKey = apiFor(hFam) ? fontKeyOf(hFam) : 'heading';
        for (const w of words) w.fontKey = hKey;
      } else if (ln.window && ln.windowWords) {
        // שורת חלון: מילת החלון (1.5×) בשפה הימנית; הטקסט ברוחב מוקטן
        const winSz = ln.sizePt * 1.5;
        // **S4.15:** רוחב החלון מהמודל — המדידה שם ב-FrankReal-Bold 1.5×
        // (גופן החלון של המקור), לא בגופן הגוף. מקור יחיד: בלי הערך על
        // השורה (מודל ישן) — נפילה למדידה מקומית כמו קודם.
        const winW = ln.windowW || (api.measureTextWidth(ln.windowWords.join(' '), winSz, 0) + 6);
        // **S4.9→S4.15 (בסיס מילת-החלון כמו הייחוס):** בייחוס בסיס החלון יושב
        // כ-1.5pt מתחת לבסיס שורת הטקסט (עמ' 14: חלון 155.25 מול שורה 153.75)
        // — ולא מעליה. עם עליית הבסיס, תיבת 18pt (asc 751/desc 135 של
        // FrankReal) חורגת מחלון המיזוג של C2 (Δtop>7pt ⇒ שתי שורות נפרדות
        // ⇒ חפיפה מדומה 10.2pt). בסיס +2px מיישר את הגליפים כמקור ומנקה את C2.
        const winBase = baseY + 2;
        // **S4.15:** מילת-החלון נמדדת ומסומנת בגופן החלון (FrankReal-Bold —
        // כמו המקור) — הציור ב-PDF ב-/F2. המדידה במטריקות האמיתיות מונעת
        // חריגה מהשקע (גופן הגוף רחב ממנה בחלק מהמילים ⇒ חפיפות C2).
        const winMeasure = winApi || api;
        const winWords = ln.windowWords.map(w => ({
          text: w,
          w: winMeasure.measureTextWidth(w, winSz, 0),
          sizePt: winSz, fontKey: 'window'
        }));
        // מיקום מימין לשמאל בתוך השקע (ישור לשפה הימנית — כמקור)
        {
          let cx = col.x + col.w;
          for (const ww of winWords) {
            cx -= ww.w;
            ww.x = cx;
            ww.baselineY = winBase;
          }
        }
        const textW = col.w - winW;
        // **S4.19:** דגלי סוגריים מהמודל — גם בשורות החלון (הסוגריים נפתחים
        // לא פעם בשורות 0-1 של פסקת-חלון; הזיהוי הפר-שורתי הקודם פספס טווחים
        // שנפתחו בשורה קודמת).
        const winParenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) winParenIdx.add(i); });
        }
        const textWords = placeWords(ln.words, api, col.x, textW, ln.sizePt,
          ln.isLast ? 'center' : 'justify', baseY, { parenIdx: winParenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null });
        words = [...winWords, ...textWords];
      } else {
        const align = ln.isLast ? 'center' : 'justify';
        // **S4.26 (חלון שקוע — שורה 1):** שורה 1 של פסקת-חלון (window בלי
        // windowWords) נמדדה במודל ברוחב מוקטן (limitOf של breakPara) —
        // וגם כאן הטקסט מקבל את הרוחב המוקטן ועוטף את מילת-החלון (כמו
        // float:right במקור); עד כאן נמתחה לרוחב מלא.
        const lineW = (ln.window && !ln.windowWords && ln.windowW)
          ? Math.max(40, col.w - ln.windowW) : col.w;
        // **S4.9:** מילים בתוך (...) מרונדרות בגודל הסוגריים המוקטן — בדיוק
        // כפי שנמדדו בשבירה (אחרת השורה רחבה מהטור וגולשת מהעמוד).
        // **S4.19 (סוגריים רב-שורתיים):** הזיהוי הקודם היה פר-שורה (מילה
        // שנפתחת ב'(' עד מילה שנסגרת ב-')' **באותה שורה**) — טווח שנפתח בשורה
        // אחת ונסגר באחרת רונדר בגודל הגוף (11.5pt בהקדמה מול 10pt בייחוס —
        // עמ' 10: 'כהרבה מדיני התורה…'). כעת הדגלים מגיעים מהמודל (חישוב
        // עומק-תווים על כל הפסקה ב-breakPara) — מקור יחיד למדידה ולרינדור.
        const parenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) parenIdx.add(i); });
        } else {
          const stack = [];
          ln.words.forEach((w, i) => {
            if (w.startsWith('(')) stack.push(i);
            if (w.endsWith(')') && stack.length) {
              const from = stack.pop();
              for (let k = from; k <= i; k++) parenIdx.add(k);
            }
          });
        }
        // **D-89 (דיווח משתמש: "כל מילה שצמודה לנקודה מופיעה בגופן קטן"):**
        // זיהוי סמני-ההערה מהמודל בלבד (markerIdx — אינדקסים מדויקים של
        // הסמנים שהוזרקו ב-legacy-imud-flow), עם ולידציית צורה נגד סטיית
        // אינדקס. הביטוי הקודם /^[א-ת]+\.$/ תפס **כל מילה עברית המסתיימת
        // בנקודה** (סוף משפט!) והקטין אותה ל-8pt — 744 מילים בקורפוס
        // ההשוואה. בלי דגל מהמודל — שום מילה לא מוקטנת: מספור האיות
        // ("א. ב. ג." בגוף המשפט) נשאר בגודל הגוף — כפי שנמדד בייחוס
        // (עמ' 12: 91 סמני איות ב-12.0pt = גודל הגוף; רק סמני ההערות
        // האמיתיים — מהסוגריים — ב-6–8pt).
        const markerIdxSet = Array.isArray(ln.markerIdx) ? new Set(ln.markerIdx) : null;
        const MARKER_WORD_RE = /^[א-ת]{1,3}[.:]?$/; // א. / בק. — גימטריה קצרה (±מפריד)
        const isMarkerWord = (w, i) => !!(markerIdxSet && markerIdxSet.has(i) && MARKER_WORD_RE.test(w));
        words = placeWords(ln.words, api, col.x, lineW, ln.sizePt, align, baseY,
          { markers: ln.words.map((w, i) => isMarkerWord(w, i)), parenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null,
            markerSize: projCfg.markerSize });
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
  // **D-89:** צבע הערות-הצד — #404040 כמו שנמדד בייחוס (6pt, עמ' 12/31: המחלקה
  // margin-note במקור מעוצבת באפור כהה).
  const MARGIN_NOTE_COLOR = [64 / 255, 64 / 255, 64 / 255];
  for (const mn of (pg.marginNotes || [])) {
    const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
    for (const l of mn.lines) {
      const baseY = baselineOf(l.y, GEO.MN_PITCH, SZ.marginNote, ascent, descent);
      // **S5.1:** הערות-צד בגופן המקור (Hadassah Friedlaender — כמו המדידה
      // במנוע וכמו ה-DOM); עד כאן צוירו בגוף הטקסט — התצוגה ≠ הייצוא בגופנים.
      const words = placeWords(l.text.split(' '), mnApi, x, GEO.MARGIN_W, SZ.marginNote, 'center', baseY);
      for (const w of words) { w.color = MARGIN_NOTE_COLOR; w.fontKey = 'margin'; }
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
  // **D-89 (דיווח משתמש: "בהערות השוליים יש מילים אחת על השניה"):**
  // בעבר כל שורות ההערה שורטטו על בסיס אחד (baselineOf של השורה הראשונה)
  // וכל שורה התחילה מאותו x — הערה רבת-שורות נערמה כולה על עצמה.
  // כעת: בסיס פר-שורה (l.y), השורה הראשונה נגרעת מרוחב הסמן ומיושרת
  // לשני הצדדים עד הסמן, שורות הביניים מיושרות לרוחב מלא, והשורה
  // האחרונה מיושרת לשפה הימנית — כפי שנמדד בייחוס (עמ' 31: שורה-1
  // x:91–494 מיושרת; שורה-2 x:383–505 מיושרת-ימין; סמן '.א' ב-x:496–505).
  for (const fn of (pg.footnotes || [])) {
    // **S4.26 (זרימה רציפה):** כל ההערות בזרם אחד — סמנים בגודל הרישום,
    // יישוב לשני הצדדים בכל שורה חוץ מהאחרונה (לימין), המשך ב-'(המשך)'
    // בלי אות סימון. שורות הזרימה מהמודל (fnFlowFor) — מקור יחיד.
    if (fn.continuous) {
      const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
      const spaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
      const usableW = rightEdge - GEO.COL_L_X;
      const words = [];
      fn.lines.forEach((l, li) => {
        const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent, descent);
        const isLast = li === fn.lines.length - 1;
        const toks = (l.words || []).filter(t => !t.gap);
        // **S5.1:** גוף ההערה ב-FRL (כמו המדידה במנוע/ה-DOM) — לא בגוף הטקסט;
        // סמני הרישום בגודלם העצמאי, אטגדים fnbody לכותב ה-PDF (/F5).
        const ws = toks.map(t => ({
          text: t.t,
          sizePt: t.mk ? projCfg.listingSize : SZ.fnBody,
          w: fnApi.measureTextWidth(t.t, t.mk ? projCfg.listingSize : SZ.fnBody, 0)
        }));
        const sumW = ws.reduce((a, w) => a + w.w, 0);
        const gaps = Math.max(0, ws.length - 1);
        let gapW = spaceW;
        if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
          gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים — כמו הגוף
        }
        let cursor = rightEdge;
        // **S6.0 (R5-C1 — סדר מילים הפוך בהערות):** הלולאה רצה מהסוף להתחלה
        // והציבה את המילה ה**אחרונה** בלוגי בקצה הימני — כלומר ההערה נקראה
        // בסדר הפוך בייצוא ה-PDF (המודל וה-DOM מציגים את המילה הראשונה מימין,
        // כנדרש ב-RTL). תוקם: מעבר קדימה — המילה הראשונה זוכה לסלוט הימני;
        // מיקומי הסלוטים/הרווחים/היישוב לא השתנו כלל (רק מיפוי מילה→סלוט).
        for (let i = 0; i < ws.length; i++) {
          cursor -= ws[i].w;
          words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: ws[i].sizePt, baselineY: baseY, fontKey: 'fnbody' });
          cursor -= gapW;
        }
      });
      if (words.length) {
        out.footnotes.push({
          y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: '',
          text: fn.lines.flatMap(l => (l.words || []).filter(t => !t.gap).map(t => t.t)).join(' '),
          words, baselineY: null, h: fn.lines.length * GEO.FN_PITCH
        });
      }
      continue;
    }
    const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
    const spaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
    const words = [];
    let firstBase = null;
    let firstRight = rightEdge;
    // **S4.24:** המשך הערה מקוצצת — '(המשך)' לפני הסמן (כמו ה-DOM והנתיב המודרני)
    if (fn.cont) {
      const pTxt = '(המשך)';
      const pw = fnApi.measureTextWidth(pTxt, SZ.fnBody, 0);
      firstRight -= pw;
      words.push({ text: pTxt, x: firstRight, w: pw, sizePt: SZ.fnBody, baselineY: null, fontKey: 'fnbody' });
      firstRight -= spaceW;
    }
    if (fn.marker) {
      // **EXT-17:** סמן הרישום בגודל עצמאי (note-listing-num-size, ברירת מחדל 8).
      const msz = projCfg.listingSize;
      const mw = fnApi.measureTextWidth(fn.marker, msz, 0);
      firstRight -= mw;
      words.push({ text: fn.marker, x: firstRight, w: mw, sizePt: msz, baselineY: null, fontKey: 'fnbody' });
      firstRight -= spaceW;
    }
    fn.lines.forEach((l, li) => {
      const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, ascent, descent);
      if (firstBase === null) {
        firstBase = baseY;
        if (words.length) words[0].baselineY = firstBase; // הסמן על בסיס השורה הראשונה
      }
      const isLast = li === fn.lines.length - 1;
      const lineRight = li === 0 ? firstRight : rightEdge;
      const usableW = Math.max(0, lineRight - GEO.COL_L_X);
      const ws = l.words.map(w => ({ text: w, w: fnApi.measureTextWidth(w, SZ.fnBody, 0) }));
      const sumW = ws.reduce((a, w) => a + w.w, 0);
      const gaps = Math.max(0, ws.length - 1);
      let gapW = spaceW;
      if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
        gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים (כמו הייחוס)
      }
      let cursor = lineRight;
      // **S6.0 (R5-C1):** מעבר קדימה — המילה הראשונה בלוגי בקצה הימני (RTL);
      // בעבר האחרונה הוצבה מימין וההערה נקראה הפוך ב-PDF.
      for (let i = 0; i < ws.length; i++) {
        cursor -= ws[i].w;
        words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: SZ.fnBody, baselineY: baseY, fontKey: 'fnbody' });
        cursor -= gapW;
      }
    });
    if (words.length) {
      out.footnotes.push({ y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: fn.marker, text: fn.lines.map(l => l.words.join(' ')).join(' '), words, baselineY: firstBase, h: fn.lines.length * GEO.FN_PITCH });
    }
  }

  // ---- שורות תוכן-עניינים ----
  if (pg.toc) {
    if (pg.toc.title) {
      const y = GEO.FLOW_TOP + TOC_TITLE_Y_OFFSET;
      const baseY = baselineOf(y, 30, SZ.tocTitle, ascent, descent);
      const words = placeWords([pg.toc.title], api, bandLeft, bandW, SZ.tocTitle, 'center', baseY);
      out.lines.push({
        x: bandLeft, y, w: bandW, h: 30, words, align: 'center', kind: 'toc-title',
        level: null, isLast: false, sizePt: SZ.tocTitle, baselineY: baseY, tokenId: null
      });
    }
    for (const r of (pg.toc.rows || [])) {
      // **S6.0 (F5):** שורת TOC עטופה — כל שורה-בת בפס 26px משלה (כמו ה-DOM);
      // שורות חד-שורתיות (המקרה הנפוץ) זהות בתכלית לפלט הקודם.
      const rowLines = (r.lines && r.lines.length ? r.lines : [r.text]).filter(t => String(t || '').trim());
      rowLines.forEach((rowText, rli) => {
        const lineY = r.y + rli * 26;
        const baseY = baselineOf(lineY, 26, r.sizePt, ascent, descent);
      // כותרת מימין (במדרגות לפי רמה), מספר משמאל; **S5.1:** גופן הרמה
      // מההגדרות (כמו ה-DOM — heading-N-font), נפילה ל-hApi כשאינה רשומה.
      const rLvl = r.level != null ? r.level : 2;
      const rFam = settings[`heading-${rLvl}-font`] || 'DavidLibre-Bold';
      const rFamApi = apiFor(rFam);
      const rApi = rFamApi || hApi;
      const tW = rApi.measureTextWidth(rowText, r.sizePt, 0);
      const textWords = placeWords([rowText], rApi, r.x1 - tW, tW, r.sizePt, 'right', baseY);
      for (const w of textWords) w.fontKey = rFamApi ? fontKeyOf(rFam) : 'heading';
      const numW = rApi.measureTextWidth(r.folio, SZ.tocNum, 0);
      const numWords = (r.folio && rli === 0) ? placeWords([r.folio], rApi, GEO.TOC_NUM_X, numW, SZ.tocNum, 'left', baseY) : [];
      for (const w of numWords) w.fontKey = rFamApi ? fontKeyOf(rFam) : 'heading';
      out.lines.push({
        x: GEO.TOC_NUM_X, y: lineY, w: r.x1 - GEO.TOC_NUM_X, h: 26,
        words: [...textWords, ...numWords], align: 'right', kind: 'toc-row',
        level: r.level, isLast: false, sizePt: r.sizePt, baselineY: baseY, tokenId: null
      });
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
  // **D-89:** צבע הכותרת — כחול-הייחוס #0F1749 (נמדד בייחוס בכל עמודי
  // הגוף/התוכן: הגליפים מצוירים כקטועים ב-(15,23,73)) — ברירת מחדל
  // שחורה כשאין (נתיב DP).
  const HDR_COLOR = [15 / 255, 23 / 255, 73 / 255];
  if (pg.headerSlots && (pg.headerSlots.right || pg.headerSlots.center || pg.headerSlots.left)) {
    const slots = [];
    const mk = (pos, text, sizePt) => {
      if (!text) return;
      // **S5.2 (O3):** מדידת/ציור סלוטי הכותרת ב-DavidLibre-Bold (hApi) —
      // בדיוק כמו ה-DOM (fontOf של ההגדרות + משקל 700). בעבר נמדדו
      // בגוף הטקסט וצוירו ב-/F1 — תצוגה≠ייצוא בכל עמוד גוף.
      const w = hApi.measureTextWidth(text, sizePt, 0);
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
        // **S5.1 (תיקון C1/L2):** רוחב התיבה = רוחב הטקסט עצמו (s.w) — לא
        // s.w+40. ה+40 הסיט כל סלוט 40px מהמקום שמכויל מהייחוס ב-mk() לעיל.
        // **S5.2 (O3):** המדידה והצבה ב-hApi (DavidLibre-Bold — כמו ה-DOM)
        // + fontKey 'heading' — הסלוטים כבר לא נמדדים/מצוירים ב-/F1 גוף-הטקסט.
        s.words = placeWords(s.text.split(' '), hApi, s.x, s.w, s.sizePt,
          s.pos === 'center' ? 'center' : (s.pos === 'right' ? 'right' : 'left'), baseY);
        s.color = pg.headerSlots.color || HDR_COLOR;
        for (const w of s.words) { w.color = s.color; w.fontKey = 'heading'; }
      }
      out.header = { y: GEO.HEADER_BASELINE - 14, baselineY: GEO.HEADER_BASELINE, slots };
    }
  }

  // **EXT-4 (הדיו — נתיב legacy):** אם למודל ה-legacy יש rectים של עיטורים
  // (טרם מיוצרים כברירת מחדל — הגדרות המקור ללא עיטורים; התשתית מוכנה
  // לחיבור ornament-plan בעתיד) — הם מוקרנים עם אותו דיו (ornament-ink)
  // כמו בנתיב ה-DP: pdfOps לכותב ה-PDF ו-data-URI ל-DOM.
  if (pg.decorations && pg.decorations.length) {
    const hPt = out.height * (72 / 96);
    const PX_TO_PT = 72 / 96;
    const r2 = (v) => Math.round(v * 100) / 100;
    const cssColor = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
    out.decorations = pg.decorations.map((d) => {
      const ink = d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle);
      let paint = null, pdfOps = null;
      if (ink && ink.type === 'svg') {
        paint = parseSvgPaint(ink.svg);
        if (paint) pdfOps = svgToPdfOps(paint, d, hPt, PX_TO_PT);
      } else if (ink && ink.type === 'rect') {
        // **D-89:** מלבן בצבע אחיד — פאנלי השערים, מסגרות וכלל הכותרת.
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`${r2(ink.color[0])} ${r2(ink.color[1])} ${r2(ink.color[2])} rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${r2(d.h * PX_TO_PT)} re f`];
      } else if (ink && ink.type === 'rule') {
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`0 0 0 rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${Math.max(0.5, r2(d.h * PX_TO_PT))} re f`];
      }
      return {
        x: d.x, y: d.y, w: d.w, h: d.h, kind: d.kind || null, slot: d.slot || null,
        kindStyle: d.kindStyle || null, inkType: ink ? ink.type : null,
        inkUri: ink && ink.uri ? ink.uri : null,
        inkColor: ink && ink.type === 'rect' ? cssColor(ink.color) : null,
        paint, pdfOps
      };
    });
  }

  return out;
}

const FLOW_BOTTOM_DEFAULT = GEO.FLOW_TOP + GEO.FLOW_H;
const TOC_TITLE_Y_OFFSET = 136; // כותרת ה-TOC ב-309px = FLOW_TOP+212.4 — מכויל

/** הקרנת מסמך legacy שלם. */
function projectLegacyDocument(result, settings) {
  // **EXT-13:** אותו מקור מדידה כמו העימוד (legacyTypeset) — הקרנה ומילוי
  // לא יכולים להתפצל: רוחב שורה שונה ביניהם = חפיפות/גלישות מדומות.
  const impl = resolveMeasureImpl(settings);
  const api = new MeasureAPI(settings, impl);
  // **S4.15 (גופן מילת-החלון בהקרנה):** מילות-החלון נמדדות ומסומנות בגופן
  // המקור (FrankReal-Bold) — הציור ב-PDF ב-/F2 והרוחב האמיתי (בלי זה הגליפים
  // של גוף הטקסט רחבים מהשקע שנשמר וחודרים לשורה — 1886 חפיפות בקורפוס).
  // הגופן נרשם ע"י legacyTypeset מ-env.windowFontBytes באותו תהליך.
  let winApi = null;
  const winName = registeredFonts.has('FrankReal-Bold') ? 'FrankReal-Bold'
    : (registeredFonts.has('FrankReal') ? 'FrankReal' : null);
  if (impl === 'font-metrics' && winName) {
    winApi = new MeasureAPI({ 'body-font': winName, 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  // **S4.26 (גופן כותרות בהקרנה):** DavidLibre-Bold — אותו גופן כמו המדידה
  // ב-legacyTypeset (env.headingFontBytes) וכמו ה-DOM; הציור ב-/F3.
  let headingApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('DavidLibre-Bold')) {
    headingApi = new MeasureAPI({ 'body-font': 'DavidLibre-Bold', 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  // **S5.1 (גופני גוף-הערה והערות-הצד בהקרנה):** FRL לגוף ההערה,
  // Hadassah להערות-הצד — כמו המדידה במנוע (fnApi/marginApi ב-legacyTypeset)
  // וכמו ה-DOM. נפילה שקופה לגוף הטקסט כשהגופן אינו רשום.
  let fnApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('Frank Ruhl Libre')) {
    fnApi = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.fnBody, 'body-line-height': 1.5 }, 'font-metrics');
  }
  let mnApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('Hadassah Friedlaender')) {
    mnApi = new MeasureAPI({ 'body-font': 'Hadassah Friedlaender', 'body-font-size-pt': SZ.marginNote, 'body-line-height': 1.2 }, 'font-metrics');
  }
  const pages = result.pages.map(p => projectLegacyPage(p, settings, api, winApi, headingApi, fnApi, mnApi));
  return { pages, inkBounds: pages.map(() => null), layoutHash: result.layoutHash };
}

module.exports = { projectLegacyPage, projectLegacyDocument };

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

/** **03.11(ד):** פתרון מחסנית גופנים של המקור מול הספרייה הזמינה.
 * ערכי המקור הם מחסניות CSS ("'AlphaBlack', 'David Libre', serif") — המשפחה
 * הראשונה בדרך כלל אינה מותקנת והדפדפן נופל להמשך הרשימה. כאן מחליטים מראש:
 * המשפחה הראשונה שקיימת ב-availableFonts (קטלוג הספרייה שהועבר ב-ctx) היא
 * הערך; בלי קטלוג — מחזירים את הראשונה (התנהגות firstFamily הישנה). */
function resolveStack(css, ctx) {
  const raw = String(css || '').replace(/'/g, '');
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    .filter(p => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
  if (!parts.length) return String(css || '');
  const avail = ctx && ctx.availableFonts;
  if (avail instanceof Set) {
    for (const p of parts) if (avail.has(p)) return p;
  }
  return parts[0];
}

/** **S4.6 (ביקורת 3):** אחוזים ⇒ פיקסלים לפי גובה תיבת התוכן **בפועל** שנמסר
 * בהקשר הייבוא (ctx.contentHeightPx). ברירת המחדל 1040px (A4 של RED) נשמרת
 * לתאימות — אך מסלול הטעינה ב-UI מעביר את הגיאומטריה האמיתית של המסמך. */
function pctToPx(v, ctxOrHeight) {
  const h = (typeof ctxOrHeight === 'number' && ctxOrHeight > 0)
    ? ctxOrHeight
    : (ctxOrHeight && Number(ctxOrHeight.contentHeightPx) > 0)
      ? Number(ctxOrHeight.contentHeightPx)
      : 1040;
  return Math.round(h * (parseFloat(v) / 100));
}

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
  // **S5.1:** ערכי האינום של RED בלבד — בעבר יוצרו 'bottom-outer'/'bottom-left'/
  // 'bottom-right'/'top-center'/'top-outer' שאינם ברישום והוגדרים בשקט לברירת
  // המחדל. 'outer' חדש: מיקום חיצוני מודע-זוגיות — כמו pos-outer של המקור
  // (typesetter.js:506 + style.css:1367-1369: odd=flex-end=שמאל, even=ימין).
  'bottom_center': 'bottom-center', 'bottom_outer': 'outer', 'bottom_left': 'outer-left', 'bottom_right': 'outer-right',
  'top_center': 'top', 'top_outer': 'top', 'in_header': 'in-header'
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
  'font-body': { kind: 'mapped', to: 'body-font', transform: resolveStack, reason: 'מחסנית CSS של המקור — נפתרת מול הקטלוג המוטמע כשהוא זמין (EXT-9: גוף המקור "\'Guttman Rashi\', \'Frank Ruhl Libre\'" ⇒ Frank Ruhl Libre המוטמע); בלי קטלוג — המשפחה הראשונה (התנהגות היסטורית). בלי זה המדידה נפלה לטבלה בעוד התצוגה בגופן אמיתי — סחף live↔ייצוא מסוג EXT-13' },
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
  // **S4.20 (סגירת EXT-15/16):** שלושת המפתחות ממומשים עתה בפרופיל ה-legacy
  // (legacy-imud-flow): ‏ensureOddPageStart כללי (הליכה על הסדר הסופי לפני
  // עמוד פתיחת-מקטע מסומן שנוחת בגב) + המונה האוטומטי והאיפוס (autoSimanH2/
  // resetSimanOnH1) — היו קיימים ב-flow אך סומנו בטעות כ-removed.
  'odd-h0': { kind: 'ui-state', reason: 'פתיחת H0 בעמוד אי-זוגי — ensureOddPageStart של המקור, מיושם בהרכבת ה-legacy (עמוד ריק לפני פתיחת מקטע בגב) — S4.20', issue: 'EXT-15' },
  'odd-h1': { kind: 'ui-state', reason: 'פתיחת H1 בעמוד אי-זוגי — כמו odd-h0 (החליף את המקרה הפרטי של שער-המשנה) — S4.20', issue: 'EXT-15' },
  'odd-h2': { kind: 'ui-state', reason: 'פתיחת H2 בעמוד אי-זוגי — ברירת המחדל של המקור כבויה — S4.20', issue: 'EXT-15' },
  'h2-auto-siman': { kind: 'ui-state', reason: 'מספור סימן אוטומטי (א-ב-ג) — מיושם ב-legacy-imud-flow (autoSimanH2) — S4.20/EXT-16' },
  'h2-reset-siman': { kind: 'ui-state', reason: 'איפוס מונה סימנים לכל פרק — מיושם ב-legacy-imud-flow (resetSimanOnH1) — S4.20/EXT-16' },
  'h2-top-distance': { kind: 'mapped', to: 'h2-top-offset', transform: pctToPx, reason: '22% מגובה תיבת התוכן (1040px ב-A4 של RED) ⇒ פיקסלים' },

  // ============ מזהי הערות (S4.5-ג — הוטמעו זה עתה) ============
  'en-line-prefix': { kind: 'mapped', to: 'en-line-prefix' },
  'fn-delim-open': { kind: 'mapped', to: 'fn-delim-open' },
  'fn-delim-close': { kind: 'mapped', to: 'fn-delim-close' },

  // ============ **S4.6 (ביקורת 3):** הגדרות עיצוב אמיתיות שסווגו בטעות כ-ui-state ============
  // לא לסווג משפחה שלמה לפי קידומת בלבד — לכל מפתח עם יעד RED קיים יש מיפוי מפורש.
  // ההגדרות האלה מגיעות עכשיו למנוע בפועל (heading-N-font/size, header-slot, שער).
  'f-h0': { kind: 'mapped', to: 'heading-0-font', transform: resolveStack, reason: 'S4.6: גופן כותרת H0 — קיים ברישום RED (heading-0-font)' },
  'f-h1': { kind: 'mapped', to: 'heading-1-font', transform: resolveStack, reason: 'S4.6: גופן H1' },
  'f-h2': { kind: 'mapped', to: 'heading-2-font', transform: resolveStack, reason: 'S4.6: גופן H2' },
  'f-h3': { kind: 'mapped', to: 'heading-3-font', transform: resolveStack, reason: 'S4.6: גופן H3' },
  'f-h4': { kind: 'mapped', to: 'heading-4-font', transform: resolveStack, reason: 'S4.6: גופן H4' },
  'f-h5': { kind: 'mapped', to: 'heading-5-font', transform: resolveStack, reason: 'S4.6: גופן H5' },
  'f-h6': { kind: 'mapped', to: 'heading-6-font', transform: resolveStack, reason: 'S4.6: גופן H6' },
  'f-h7': { kind: 'mapped', to: 'heading-7-font', transform: resolveStack, reason: 'S4.6: גופן H7' },
  's-h0': { kind: 'mapped', to: 'heading-0-size-pt', transform: parseFloat, reason: 'S4.6: גודל H0 (26 ⇒ 26pt; חריגת טווח מדווחת במיזוג ולא מושמטת)' },
  's-h1': { kind: 'mapped', to: 'heading-1-size-pt', transform: parseFloat, reason: 'S4.6: גודל H1 (50 במקור — נשמר נאמן למקור; חריגת טווח מדווחת)' },
  's-h2': { kind: 'mapped', to: 'heading-2-size-pt', transform: parseFloat, reason: 'S4.6: גודל H2' },
  's-h3': { kind: 'mapped', to: 'heading-3-size-pt', transform: parseFloat, reason: 'S4.6: גודל H3' },
  's-h4': { kind: 'mapped', to: 'heading-4-size-pt', transform: parseFloat, reason: 'S4.6: גודל H4' },
  's-h5': { kind: 'mapped', to: 'heading-5-size-pt', transform: parseFloat, reason: 'S4.6: גודל H5' },
  's-h6': { kind: 'mapped', to: 'heading-6-size-pt', transform: parseFloat, reason: 'S4.6: גודל H6' },
  's-h7': { kind: 'mapped', to: 'heading-7-size-pt', transform: parseFloat, reason: 'S4.6: גודל H7 (6 במקור; חריגת טווח מדווחת)' },
  'f-note-body': { kind: 'mapped', to: 'f-note-body-font', transform: resolveStack, reason: 'S4.6: גופן גוף ההערה — קיים ברישום RED' },
  'f-hdr-r': { kind: 'mapped', to: ['header-recto-right-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט ימין בכותרת עליונה (recto)' },
  'f-hdr-c': { kind: 'mapped', to: ['header-recto-center-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט מרכז (recto)' },
  'f-hdr-l': { kind: 'mapped', to: ['header-recto-left-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט שמאל (recto)' },
  's-hdr-r': { kind: 'mapped', to: ['header-recto-right-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט ימין (recto)' },
  's-hdr-c': { kind: 'mapped', to: ['header-recto-center-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט מרכז (recto)' },
  's-hdr-l': { kind: 'mapped', to: ['header-recto-left-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט שמאל (recto)' },
  'f-hdr-verso-r': { kind: 'mapped', to: ['header-verso-right-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט ימין (verso)' },
  'f-hdr-verso-c': { kind: 'mapped', to: ['header-verso-center-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט מרכז (verso)' },
  'f-hdr-verso-l': { kind: 'mapped', to: ['header-verso-left-font'], transform: resolveStack, reason: 'S4.6: גופן סלוט שמאל (verso)' },
  's-hdr-verso-r': { kind: 'mapped', to: ['header-verso-right-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט ימין (verso)' },
  's-hdr-verso-c': { kind: 'mapped', to: ['header-verso-center-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט מרכז (verso)' },
  's-hdr-verso-l': { kind: 'mapped', to: ['header-verso-left-size-pt'], transform: parseFloat, reason: 'S4.6: גודל סלוט שמאל (verso)' },
  'inp-book-title': { kind: 'mapped', to: 'imud-book-title', reason: 'S4.6: כותרת הספר — נצרכת בשער הראשי (dom-renderer)' },
  'inp-book-subtitle': { kind: 'mapped', to: 'imud-book-subtitle', reason: 'S4.6: כותרת־משנה — נצרכת בשער הראשי' },
  // **03.11(ד) — דיווח משתמש 3 / בקשת על מה-01.11: "הטמע את כל ברירות המחדל
  // של הפרויקט המקורי".** מתגי השערים ונתוני הספר נפלו ל-ui-state לפי כלל
  // הקידומת הגס (^(show|inp)-) והושמטו מהמנוע — לכן "אין עמודי שער" גם אחרי
  // ייבוא ברירות המחדל. עתה מיפוי מפורש למפתחות RED האמיתיים.
  'show-main-shaar': { kind: 'mapped', to: 'shaar-main-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער ראשי — ברירת המחדל במקור true (השער חלק ממבנה הספר, לא אופציה)' },
  'show-sub-shaar': { kind: 'mapped', to: 'shaar-sub-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער־משנה — ברירת מחדל true כמקור' },
  'show-back-shaar': { kind: 'mapped', to: 'shaar-back-enabled', transform: (v) => v !== false && v !== 'false', reason: '03.11(ד): מתג שער אחורי — ברירת מחדל true כמקור' },
  'f-sh-title': { kind: 'mapped', to: 'shaar-title-font', transform: resolveStack, reason: '03.11(ד): גופן כותרת השער (מקור: Lia Sgula → Bellefair המוטמע)' },
  's-sh-title': { kind: 'mapped', to: 'shaar-title-size-pt', transform: parseFloat, reason: '03.11(ד): גודל כותרת השער (מקור: 46)' },
  'f-sh-sub': { kind: 'mapped', to: 'shaar-subtitle-font', transform: resolveStack, reason: '03.11(ד): גופן כותרת־משנה בשער (מקור: Livorna → David Libre)' },
  's-sh-sub': { kind: 'mapped', to: 'shaar-subtitle-size-pt', transform: parseFloat, reason: '03.11(ד): גודל כותרת־משנה (מקור: 21)' },
  'f-sh-desc': { kind: 'mapped', to: 'shaar-desc-font', transform: resolveStack, reason: '03.11(ד): גופן התיאור (מקור: Livorna → Frank Ruhl Libre)' },
  's-sh-desc': { kind: 'mapped', to: 'shaar-desc-size-pt', transform: parseFloat, reason: '03.11(ד): גודל התיאור (מקור: 12)' },
  'f-sh-sec': { kind: 'mapped', to: 'shaar-sections-font', transform: resolveStack, reason: '03.11(ד): גופן פרטי המהדורא (מקור: David Libre)' },
  's-sh-sec': { kind: 'mapped', to: 'shaar-sections-size-pt', transform: parseFloat, reason: '03.11(ד): גודל פרטי המהדורא (מקור: 11.5)' },
  'f-sh-author': { kind: 'mapped', to: 'shaar-author-font', transform: resolveStack, reason: '03.11(ד): גופן שם המחבר (מקור: David Libre)' },
  's-sh-author': { kind: 'mapped', to: 'shaar-author-size-pt', transform: parseFloat, reason: '03.11(ד): גודל שם המחבר (מקור: 15)' },
  'f-sh-year': { kind: 'mapped', to: 'shaar-year-font', transform: resolveStack, reason: '03.11(ד): גופן השנה/בס״ד (מקור: David Libre)' },
  's-sh-year': { kind: 'mapped', to: 'shaar-year-size-pt', transform: parseFloat, reason: '03.11(ד): גודל השנה (מקור: 12)' },
  'inp-book-desc': { kind: 'mapped', to: 'imud-book-desc', reason: '03.11(ד): תיאור הספר בשער (מקור: inp-book-desc ← «נושא מפורט»)' },
  'inp-book-sections': { kind: 'mapped', to: 'imud-book-sections', reason: '03.11(ד): פרטי מהדורא בשער (מקור: inp-book-sections ← «פרטי מהדורא»)' },
  'inp-book-author': { kind: 'mapped', to: 'imud-book-author', reason: '03.11(ד): שם המחבר בשערים (מקור: inp-book-author ← «שם המחבר»)' },
  'inp-book-year': { kind: 'mapped', to: 'imud-book-year', reason: '03.11(ד): מקום ושנה בשערים (מקור: inp-book-year ← «מקום ושנת הוצאה»)' },
  'inp-back-shaar-text': { kind: 'mapped', to: 'shaar-back-text', reason: '03.11(ד): טקסט השער האחורי (שמירת זכויות)' },

  // ============ הערות שוליים ============
  // **S5.2 (S2):** מפתח RED-מקורי שנכנס בטעות לנכס ברירות-המחדל המוטמע
  // (הנכס = v21 + שתי דריסות D-91 מתועדות + מפתח זה) — רישום disposition
  // מפורש במקום 'unmapped' בייבוא החי.
  'fn-bar-max-height-px': { kind: 'removed', reason: 'מפתח RED-מקורי (תקרת מרזב ההערות) — נקרא מהמרשם עצמו; אינו מפתח מקור', issue: 'S5.2-S2' },
  'fn-columns': { kind: 'mapped', to: 'footnote-columns', transform: parseInt },
  'fn-layout-mode': { kind: 'mapped', to: 'fn-layout-mode' },
  // **S5.2 (S2):** transform חסר — 'siman' של המקור נחת כערך לא-חוקי בצד
  // RED (הenum: continuous/page/section/part) והפאנל הציג ערך שבור.
  'fn-reset-mode': { kind: 'mapped', to: 'footnote-reset-policy', transform: (v) => ({ 'siman': 'section', 'chapter': 'section', 'page': 'page', 'continuous': 'continuous', 'part': 'part' }[v] || 'page') },
  'fn-title-text': { kind: 'mapped', to: 'endnote-title-text' },
  'note-numbering-style': { kind: 'mapped', to: 'footnote-marker-style', transform: (v) => ({ 'gematria': 'hebrew-geresh', 'hebrew': 'hebrew-geresh', 'decimal': 'decimal', 'asterisk': 'asterisk', 'parenthesis': 'parenthesis' }[v] || 'hebrew-geresh') },
  // **S5.2 (S2):** note-marker-type ('super') אינו סגנון סמן — הוא העלאת
  // בסיס (עניין רינדור). בעבר מופה merged ל-footnote-marker-style בלי
  // transform והערך הגולמי 'super' דרס את הסגנון החוקי (ערך מחוץ ל-enum;
  // ניצל רק בזכות ה-default-branch של markerFor). כעת ui-state — נשמר
  // להצגה, לא מזהם את ה-enum.
  'note-marker-type': { kind: 'ui-state', reason: 'סוג הסמן (super) — עניין העלאת-בסיס ברינדור, לא סגנון מספור; הסגנון מגיע מ-note-numbering-style' },
  'note-marker-size': { kind: 'ui-state', reason: 'גודל מילת-הסמן בגוף (ברירת מחדל 8) — מיושם בפרויקטור ה-legacy (S4.20/EXT-17)', issue: 'EXT-17' },
  'note-listing-num-size': { kind: 'ui-state', reason: 'גודל סמן הרישום ברשימת ההערות — מיושם בפרויקטור ה-legacy — S4.20/EXT-17' },
  'note-num-separator': { kind: 'ui-state', reason: 'המפריד אחרי מספר ההערה (ברירת מחדל .) — מיושם ב-markerWord — S4.20/EXT-17' },
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
  'h2-title-orn-mode': { kind: 'mapped', to: 'h2-orn-scope', onlyIfAbsent: true, transform: (v) => ({ 'sign': 'sign', 'title': 'title', 'both': 'both', 'none': 'none' }[v] || 'both'), reason: 'S4.6 (ביקורת 3): none נשמר כ-none — בעבר הומר ל-both (היפוך הגדרת המקור); enum RED כעת כולל none. onlyIfAbsent: כשהקובץ מכיל גם את המפתח הישיר h2-orn-scope — הישיר גובר (קדימות מפורשת, לא סדר איטרציה)' },
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
  'hdr-title-split': { kind: 'ui-state', reason: 'פיצול שם הספר לחצאים בכותרת העליונה — מיושם תמידית ב-legacy (hdrR/hdrL) כמו בייחוס — S4.20/EXT-19' },
  'hdr-alternating': { kind: 'ui-state', reason: 'החלפת החצאים בעמודים זוגיים-פיזיים — מיושם בהרכבת ה-legacy (S4.20/EXT-19)', issue: 'EXT-19' },
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
  // **EXT-14 (05.11, ערכות הסגנון):** שדות העלאת-קבצים של האפליקציה הישנה — קיימים
  // ב-setting_sets (תלמוד/פרשנות/קונטרס) אך לא ב-default_settings (הועלו רק בערכות):
  // קבצי SVG של בונה השערים, תמונות רקע לפי מחלקת עמוד, תמונת מרכז-הכותרת,
  // תמונת מפריד הסעיפים ותיקיית הנכסים. ב-RED: הפניות imud: מהספרייה המוטמעת
  // (asset-registry) או נכסי משתמש — ערך הקובץ עצמו אינו מצב מנוע.
  { re: /^file-/, kind: 'ui-state', reason: 'שדה העלאת קובץ באפליקציה הישנה (builder/cbg/hdr/sec-div) — ב-RED: הפניות imud: מהספרייה' },
  { re: /^assets-folder-/, kind: 'ui-state', reason: 'תיקיית נכסים חיצונית באפליקציה הישנה — ב-RED: הספרייה המוטמעת' },
  { re: /^heading-divider-h[3-9]$/, kind: 'mapped', to: 'heading-dividers-h3-h6', transform: (v) => v !== 'none', reason: 'מפרידי כותרות H3–H6 — RED מפעיל/מכבה את המשפחה כולה' }
];

/** קבלת disposition למפתח — מפורש מהטבלה, או כלל משפחה. @returns {object|null} */
function dispositionOf(oldKey) {
  if (DISPOSITIONS[oldKey]) return DISPOSITIONS[oldKey];
  // **S5.1:** כלל משפחה מחזיר גם to/transform — בעבר הושמטו ו-heading-divider-h4/h5/h6
  // (למשל) נספרו כ"מטופלים" בלי ששום דבר הוחל (מיפוי-מת).
  for (const r of FAMILY_RULES) if (r.re.test(oldKey)) return { kind: r.kind, to: r.to, transform: r.transform, reason: r.reason };
  return null;
}

/**
 * ייבוא קובץ הגדרות IMUD (או תבנית משתמש ישנה) להגדרות RED.
 * **S4.6 (ביקורת 3) — שימור מלא:** ערכי ui-state כבר לא רק נספרים — הם נשמרים
 * כנתונים במבנה מוגדר: אובייקט uiState בפלט + settings['_legacy-ui-state']
 * (מפתח פנימי עם קידומת קו-תחתון — לא נכנס לייצוא ZIP, שורד בתבניות ה-UI).
 * @param {object} legacy — אובייקט ההגדרות הישן (key→value)
 * @param {object} [registryKeys] — Set/מערך מפתחות RED חוקיים (לסינון); אם לא — ללא סינון
 * @param {{contentHeightPx?:number}} [opts] — גיאומטריה אמיתית להמרות אחוז⇒פיקסל (ברירת מחדל 1040)
 * @returns {{settings:object, uiState:object, dispositions:object, unmapped:string[], report:{mapped:number,merged:number,uiState:number,removed:number}}}
 */
function importImudSettings(legacy, registryKeys, opts = {}) {
  const settings = {};
  const uiState = {};
  const dispositions = {};
  const unmapped = [];
  const report = { mapped: 0, merged: 0, uiState: 0, removed: 0 };
  const valid = registryKeys instanceof Set ? registryKeys : (Array.isArray(registryKeys) ? new Set(registryKeys) : null);
  const ctx = { contentHeightPx: Number(opts.contentHeightPx) > 0 ? Number(opts.contentHeightPx) : 1040 };
  // **03.11(ד):** קטלוג הגופנים הזמין (אם הועבר) — לפתרון מחסניות הגופן של המקור
  // מול מה שבאמת קיים בספרייה המוטמעת (f-h0="'AlphaBlack', 'David Libre', serif"
  // ⇒ David Libre כש-AlphaBlack אינה בספרייה — בדיוק כמו שהדפדפן היה נופל).
  if (opts.availableFonts instanceof Set) ctx.availableFonts = opts.availableFonts;
  else if (Array.isArray(opts.availableFonts)) ctx.availableFonts = new Set(opts.availableFonts);
  // **S4.6:** שני מעברים — ממירים מותנים (onlyIfAbsent, כגון h2-title-orn-mode)
  // מוחלים רק אם מפתח ישיר לא קבע כבר את היעד. קדימות מפורשת ולא תלוית-סדר.
  const deferred = [];
  const applyDisposition = (k, v, d) => {
    dispositions[k] = d;
    if ((d.kind === 'mapped' || d.kind === 'merged') && d.to) {
      const targets = Array.isArray(d.to) ? d.to : [d.to];
      const transformed = d.transform ? d.transform(v, ctx) : v;
      let anyApplied = false;
      let anyBlocked = false;
      for (const t of targets) {
        if (valid && !valid.has(t)) { unmapped.push(`${k}->${t}(!)`); continue; }
        if (d.onlyIfAbsent && settings[t] !== undefined) { anyBlocked = true; continue; }
        settings[t] = transformed;
        anyApplied = true;
      }
      if (anyApplied) report[d.kind]++;
      else if (anyBlocked) report[d.kind]++; // נספר — קיבל disposition מלא (נחסם בכוונה ע"י מפתח ישיר)
    } else if (d.kind === 'ui-state') {
      // **S4.6:** הערך נשמר כנתון — לא רק מונה. החזרה נפרדת + הטמעה בהגדרות
      // (מפתח פנימי; לא מגיע למנוע, לא נמחק).
      uiState[k] = v;
      report.uiState++;
    } else if (d.kind === 'removed') {
      report.removed++;
    } else {
      report.merged++;
    }
  };
  for (const [k, v] of Object.entries(legacy || {})) {
    const d = dispositionOf(k);
    if (!d) { unmapped.push(k); continue; }
    if (d.onlyIfAbsent) { deferred.push([k, v, d]); continue; }
    applyDisposition(k, v, d);
  }
  for (const [k, v, d] of deferred) applyDisposition(k, v, d);
  // מיזוג משלים: mode-h1=sub_shaar ⇒ שער משנה דלוק (הסמנטיקה המקורית)
  if (legacy && legacy['mode-h1'] === 'sub_shaar') settings['show-shaar-sub'] = true;
  if (Object.keys(uiState).length) settings['_legacy-ui-state'] = uiState;
  // **S4.9 (פרופיל העימוד המקורי):** קלט שנראה כמו default_settings.json המלא
  // של המקור ⇒ ה-JSON הגולמי מוצמד תחת _imudRaw והפרופיל מסומן 'imud'.
  // המנוע המרכזי (typeset) מפנה אז לפורט הנאמן (legacy-imud-flow) — התנהגות
  // המקור היא המפרט (בקשת המשתמש 03.11: "בדיקה מתמטית ומוחלטת").
  if (legacy && typeof legacy === 'object'
    && legacy['fn-delim-open'] !== undefined
    && legacy['size-body'] !== undefined
    && legacy['line-height-body'] !== undefined) {
    settings['_imudRaw'] = legacy;
    settings['_layout-profile'] = 'imud';
  }
  return { settings, uiState, dispositions, unmapped, report };
}

module.exports = { DISPOSITIONS, dispositionOf, importImudSettings, firstFamily, resolveStack, pctToPx };

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
  const fontCatalog = { loaded: false, loading: null, families: [], byFamily: new Map(), bytesB64: new Map(), faces: new Set(), extended: [], extendedByFamily: new Map() };
  const designs = new Map(); // collection → {loaded, items:[{id,name,box}]}
  const appliedFontsReady = new Map(); // family → Promise<ArrayBuffer|null>

  async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`imud-library: ${path} → ${r.status}`);
    return r.json();
  }

  /** קטלוג הפונטים (443 משפחות מוטמעות + 1,315 משפחות הקטלוג המורחב).
   * **EXT-14 (05.11):** fonts-extended.json של המקור מוטמע כקטלוג-שמות בלבד —
   * קובצי ה-WOFF2 (115MB) אינם מוטמעים (החלטת גודל מתועדת ב-PROVENANCE).
   * הפיקרים מציגים את מלוא הקטלוג ההיסטורי עם סיווג אמת: משפחה מוטמעת
   * (עם קובץ) או קטלוג-בלבד (בחירתה ⇒ הודעה מפורשת + נפילה לגופן מערכת).
   * @returns {Promise<Array<{value:string,label:string,embedded:boolean}>>} */
  async function loadFontCatalog() {
    if (fontCatalog.loaded) return catalogEntries();
    // **S5.2:** מטמון הבטחה בטיסה — שתי קריאות מקבילות (עלייה: פיקרים + ברירות
    // מחדל) תפיקו טעינה אחת בלבד; בעבר נבדק רק loaded אחרי הפתרון ⇒ כל קריאה
    // בזמן טעינה שיכפלה את ה-fetch (~400KB חינם). כישלון מנקה את המטמון —
    // קריאה חוזרת תנסה שוב (לא תיתקע על הבטחה שנכשלה).
    if (fontCatalog.loading) return fontCatalog.loading;
    const p = (async () => {
      const list = await fetchJson(`${BASE}/imud-fonts.json`);
      fontCatalog.families = list.map(e => e.family);
      for (const e of list) fontCatalog.byFamily.set(e.family, e.file);
      fontCatalog.loaded = true;
      // הקטלוג המורחב — קטלוג-שמות בלבד (הכשלון אינו חוסם: הפיקרים יציגו את
      // המוטמעות בלבד, כמו קודם)
      try {
        const ext = await fetchJson(`${BASE}/fonts-extended.json`);
        fontCatalog.extended = ext.map(e => e.family);
        fontCatalog.extendedByFamily = new Map(ext.map(e => [e.family, e]));
      } catch (e) { fontCatalog.extended = []; fontCatalog.extendedByFamily = new Map(); }
      return catalogEntries();
    })();
    fontCatalog.loading = p;
    try {
      return await p;
    } finally {
      fontCatalog.loading = null;
    }
  }

  /** רשימת הפיקרים: מוטמעות ראשונות, אחר-כך הקטלוג המורחב עם סימון ברור. */
  function catalogEntries() {
    const entries = fontCatalog.families.map(f => ({ value: f, label: f, embedded: true }));
    for (const f of fontCatalog.extended) {
      entries.push({ value: f, label: `${f} (קטלוג — לא מוטמע)`, embedded: false });
    }
    return entries;
  }

  /** **EXT-14: סיווג אמת למשפחה** — 'embedded' | 'extended-catalog' | 'unknown'.
   * משפחה מוטמעת ⇒ נטענת (מדידה+תצוגה+ייצוא); מהקטלוג המורחב ⇒ הודעה
   * מפורשת ונפילה לגופן מערכת; לא ידועה ⇒ כמו קודם. */
  function fontStatus(family) {
    const f = String(family || '').trim();
    if (fontCatalog.byFamily.has(f)) return 'embedded';
    if (fontCatalog.extendedByFamily && fontCatalog.extendedByFamily.has(f)) return 'extended-catalog';
    return 'unknown';
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
      // **S5.2:** רישום שמת עם ה-Worker (terminate/ביטול single-flight) — עדכון
      // במפורש: הגופן לא נרשם במנוע. בלי זה ההבטחה היתה נפתרת ב"הכל בסדר"
      // והמטמון (appliedFontsReady) היה מחזיר אותה לנצח ⇒ ייצוא תלוי/מדידה שגויה.
      try {
        await engine.registerFont({ name: family, bytes: buf.slice(0) });
      } catch (e) {
        if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
        /* רישום נכשל (סיבה אחרת) — נמשיך ל-FontFace; הייצוא ידווח בבירור */
      }
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
    // **S5.2:** הבטחה שנדחתה (restart/קריסה) מנקה את המטמון — קריאה חוזרת
    // תרשום מחדש על ה-Worker שהוזרם (respawn) ולא תחזיר הבטחה מתה לנצח.
    p.catch(() => { appliedFontsReady.delete(family); });
    return p;
  }

  /** **03.11(ג):** גופן יציב לייצוא PDF כשהגופן המבוקש אינו בספרייה —
   * עדיפות לגרסאות "פרנק רוהל דף" (המקבילה התורנית של Frank Ruhl Libre),
   * ואז "פרנק רה רגיל", ולבסוף המשפחה הראשונה בקטלוג. */
  async function loadDefaultExportFont() {
    if (!fontCatalog.loaded) await loadFontCatalog();
    const prefs = ['פרנק רוהל דפ רגיל', 'פרנק רה רגיל'];
    for (const f of prefs) {
      if (fontCatalog.byFamily.has(f)) {
        const bytes = await loadFont(f);
        if (bytes) return { family: f, bytes };
      }
    }
    const first = fontCatalog.families[0];
    if (first) {
      const bytes = await loadFont(first);
      if (bytes) return { family: first, bytes };
    }
    return null;
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

  /** **03.11(ד):** פתרון ערך גופן (משפחה בודדת או מחסנית "'A', 'B', serif")
   * למשפחה הראשונה הקיימת בקטלוג — בדיוק כפי שהדפדפן היה נופל במחסנית.
   * @returns {string|null} שם משפחה מהקטלוג, או null אם אף אחת אינה זמינה. */
  function resolveFamily(value) {
    if (!fontCatalog.loaded || !value) return null;
    const raw = String(value).replace(/'/g, '');
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
      .filter(p => !/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(p));
    for (const p of parts) if (fontCatalog.byFamily.has(p)) return p;
    return null;
  }

  /** **03.11(ד) + S5.2:** טעינת גופן לפי ערך הגדרה — תומך גם במחסנית (נפתרת מול
   * הקטלוג) וגם במשפחה בודדת. מחזיר Promise<ArrayBuffer|null>.
   * **S5.2:** ממתין קודם לטעינת הקטלוג — בעבר, קריאה לפני שהקטלוג נטען החזירה
   * null בשקט (byFamily ריק) גם כשהמשפחה קיימת בספרייה (נתיב getExportFont). */
  async function loadFontStack(value) {
    if (value == null) return null;
    if (!fontCatalog.loaded) {
      try { await loadFontCatalog(); } catch (e) { /* ספרייה לא זמינה — ההגדרה תיפול לגופן מערכת */ }
    }
    const direct = fontCatalog.byFamily.get(String(value).trim());
    if (direct) return loadFont(String(value).trim());
    const resolved = resolveFamily(value);
    return resolved ? loadFont(resolved) : null;
  }

  /** **EXT-14 (05.11): ערכות סגנון-ספר מהמקור (setting_sets/):** תלמוד/פרשנות/קונטרס —
   * תצורות מלאות (249 מפתחות) שהמקור טען דרך הדרופדאון style-set-select
   * (settings-manager.js: loadSettingsFromFile('setting_sets/<name>')). כאן אותה
   * חוזה: כל ערכה עוברת את אותה טבלת disposition כמו ברירות המחדל — אין מסלול
   * מיוחד; ההבדלים חייבים לשרוד את הייבוא (בדיקה מחייבת ב-setting-sets.test.js). */
  const SETTING_SETS = ['תלמוד', 'פרשנות', 'קונטרס'];

  /** רשימת הערכות המוטמעות (שמות קבצים בלבד — לא נטענות עד בחירה). */
  function listSettingSets() { return SETTING_SETS.slice(); }

  /** טעינת ערכה וייבוא מלא דרך importImudSettings (עם קטלוג הגופנים —
   * כמו loadLegacyDefaults: מחסניות הגופן נפתרות למשפחות מוטמעות). */
  async function loadSettingSet(name) {
    if (!SETTING_SETS.includes(name)) throw new Error(`ערכה לא מוכרת: ${name}`);
    if (!fontCatalog.loaded) await loadFontCatalog().catch(() => {});
    const legacy = await fetchJson(`${BASE}/setting_sets/${encodeURIComponent(name)}.json`);
    const { settings, unmapped, report } = importImudSettings(
      legacy,
      new Set(getSettingDefs().map(r => r.id)),
      { availableFonts: fontCatalog.byFamily ? new Set(fontCatalog.byFamily.keys()) : undefined }
    );
    return { name, settings, unmapped, report };
  }

  /** ברירות המחדל המקוריות — ייבוא מלא דרך טבלת ה-disposition.
   * **03.11(ד):** מועבר גם קטלוג הגופנים הזמין — כך שמחסניות הגופן של המקור
   * ("'AlphaBlack', 'David Libre', serif") נפתרות מיד למשפחה הזמינה בפועל
   * (David Libre) וההגדרות שמתקבלות ניתנות לטעינה ולמדידה אמיתית.
   * **S4.15 (גופן מילת-החלון):** בטעינת הברירות נרשם גם FrankReal-Bold תחת
   * השם 'FrankReal' — גופן מילת-החלון של המקור (המשתמש המקורי הריץ עם
   * הגופן מותקן במערכת; הוכח מסימון הייחוס: 116 מילות-חלון ברוחב
   * FrankReal-Bold בדיוק 0.03px). בלי זה — המדידה והתצוגה נופלות לגופן
   * הגוף ושורות 0–1 של כל פסקת-חלון נשברות אחרת. */
  async function loadLegacyDefaults() {
    if (!fontCatalog.loaded) await loadFontCatalog().catch(() => {});
    const legacy = await fetchJson(`${BASE}/default_settings.json`);
    const { settings, unmapped, report } = importImudSettings(
      legacy,
      new Set(getSettingDefs().map(r => r.id)),
      { availableFonts: fontCatalog.byFamily ? new Set(fontCatalog.byFamily.keys()) : undefined }
    );
    // **S4.15:** רישום גופן החלון (מדידה ב-Worker + FontFace לתצוגה + base64
    // לייצוא HTML) — בלי להיכשל אם הקובץ חסר (fallback מתועד).
    try { await loadWindowFont(); } catch (e) { /* אין FrankReal-Bold — fallback */ }
    // **S4.26:** רישום גופן הכותרות (DavidLibre-Bold) — מדידה+תצוגה מודגשת.
    try { await loadHeadingFont(); } catch (e) { /* אין DavidLibre-Bold — fallback */ }
    return { settings, unmapped, report };
  }

  /** **S4.15:** טעינת FrankReal-Bold.ttf תחת המשפחה 'FrankReal' (מדידה+
   * תצוגה+ייצוא) — לגופן מילת-החלון, כמו 'FrankReal' במערכת של המקור. */
  async function loadWindowFont() {
    if (appliedFontsReady.has('FrankReal')) return appliedFontsReady.get('FrankReal');
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/FrankReal-Bold.ttf`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      const u8 = new Uint8Array(buf);
      try {
        let bin = '';
        const CH = 0x8000;
        for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
        fontCatalog.bytesB64.set('FrankReal', btoa(bin));
      } catch (e) { /* אין btoa — הייצוא ידלג */ }
      try {
        await engine.registerFont({ name: 'FrankReal', bytes: buf.slice(0) });
      } catch (e) {
        // **S5.2:** מוות ה-Worker (restart) — דחייה מפורשת + ניקוי המטמון (רישום
        // חוזר בקריאה הבאה על המופע שהוזרם); כשל אחר — תצוגה בלבד כמו קודם.
        if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
        /* רישום נכשל — תצוגה בלבד */
      }
      if (!fontCatalog.faces.has('FrankReal') && typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace('FrankReal', buf);
          await face.load();
          document.fonts.add(face);
          fontCatalog.faces.add('FrankReal');
        } catch (e) { /* פונט תצוגה נכשל */ }
      }
      return buf;
    })();
    appliedFontsReady.set('FrankReal', p);
    p.catch(() => { appliedFontsReady.delete('FrankReal'); }); // **S5.2:**
    return p;
  }

  /** **S4.26 (דיווח משתמש: "האתר לא משתמש בגופני ברירת המחדל"):** גופן
   * הכותרות של המקור בפועל — DavidLibre-Bold. נרשם ב-Worker תחת
   * 'DavidLibre-Bold' (מדידת כותרות — headingApi) וכ-FontFace של המשפחה
   * 'David Libre' במשקל 700 (תצוגת כותרות מודגשות — כמו הייחוס, שבו כל
   * הכותרות ושורות ה-TOC ב-DavidLibre-Bold). */
  async function loadHeadingFont() {
    if (appliedFontsReady.has('DavidLibre-Bold')) return appliedFontsReady.get('DavidLibre-Bold');
    const p = (async () => {
      const r = await fetch(`${BASE}/fonts/DavidLibre-Bold.ttf`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      try {
        await engine.registerFont({ name: 'DavidLibre-Bold', bytes: buf.slice(0) });
      } catch (e) {
        // **S5.2:** מוות ה-Worker (restart) — דחייה מפורשת + ניקוי המטמון.
        if (e && /worker-restarted|worker-error/.test(String(e.message))) throw e;
        /* רישום נכשל — תצוגה בלבד */
      }
      if (typeof FontFace !== 'undefined') {
        try {
          const face = new FontFace('David Libre', buf, { weight: '700' });
          await face.load();
          document.fonts.add(face);
          if (!fontCatalog.faces.has('David Libre')) fontCatalog.faces.add('David Libre');
        } catch (e) { /* פונט תצוגה נכשל */ }
      }
      return buf;
    })();
    appliedFontsReady.set('DavidLibre-Bold', p);
    p.catch(() => { appliedFontsReady.delete('DavidLibre-Bold'); }); // **S5.2:**
    return p;
  }

  /** CSS של הפונטים שנטענו — להטמעה בייצוא HTML העצמאי (@font-face data-URI). */
  function exportFontCss() {
    let css = '';
    for (const [family, b64] of fontCatalog.bytesB64) {
      css += `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-display:swap}\n`;
    }
    return css;
  }

  /** **EXT-9:** משפחות הקטלוג שנטענו (סינכרוני) — לפתרון מחסניות גופן בייבוא
   * הגדרות/תבניות (importImudSettings ctx.availableFonts). null אם הקטלוג
   * עוד לא נטען — הייבוא ייפול למשפחה הראשונה (התנהגות היסטורית, מתועדת). */
  function catalogFamilies() {
    return fontCatalog.loaded ? new Set(fontCatalog.byFamily.keys()) : null;
  }

  return { loadFontCatalog, loadFont, loadDefaultExportFont, listDesigns, ensureDesign, loadLegacyDefaults, loadHeadingFont, exportFontCss, resolveFamily, loadFontStack, catalogFamilies, listSettingSets, loadSettingSet, fontStatus, catalogEntries };
}

module.exports = { createImudLibrary, DESIGN_FILES };

};

var __entry = "src/ui/browser-entry.js";
__modules[__entry](function (n) { return __require(__entry, n); }, { exports: {} }, {});
