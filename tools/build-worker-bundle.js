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
    exclude: [] // למנוע אין החרגות — כל המודולים נדרשים
  },
  {
    name: 'app',
    entry: 'src/ui/browser-entry.js',
    out: 'ui/app.bundle.js',
    exclude: ['src/ui/inline-transport.js'] // דפדפן: Worker אמיתי; ה-inline היה גורר את המנוע
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

function resolveRel(fromAbs, name) {
  const base = path.dirname(fromAbs);
  let p = path.resolve(base, name);
  const candidates = [p, p + '.js', path.join(p, 'index.js')];
  for (const c of candidates) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}

/** איסוף מודולים מנקודת כניסה. מחזיר Map<relPath, src> (מחריגים מוחלפים בסטאב). */
function collectBundle(entryRel, excludeSet) {
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
      if (name === 'crypto') continue; // שימה חיצונית — מסופקת בזמן ריצה
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
  const modules = collectBundle(cfg.entry, excludeSet);
  const entryRel = cfg.entry;

  let modulesOut = '';
  const pathEntries = [];
  for (const [rel, src] of modules) {
    modulesOut += `__modules[${JSON.stringify(rel)}] = function (require, module, exports) {\n${src}\n};\n`;
    const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[1] === 'crypto' || !m[1].startsWith('.')) continue;
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
var __modules = {};
var __cache = {};
function __require(from, name) {
  if (name === 'crypto') return __crypto;
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
