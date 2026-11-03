#!/usr/bin/env node
// tools/deps.js — מפת תלויות חיה: מדפיס את גרף ה־require בפועל מתוך src.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'red-build', 'src');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) files.push(p);
  }
})(ROOT);
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const edges = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /require\((['"])(\.[^'"]+)\1\)/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[2];
    const base = path.resolve(path.dirname(f), spec);
    // Node resolution: exact, .js, /index.js
    const candidates = [base, base + '.js', path.join(base, 'index.js')];
    const target = candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile());
    if (target) edges.push(`${rel(f)} -> ${rel(target)}`);
  }
}
edges.sort();
console.log(`# dependency map (${edges.length} edges) — ${new Date().toISOString().slice(0, 10)}`);
for (const e of edges) console.log(e);
