#!/usr/bin/env node
// tools/scan-control-triggers.js — CLI לסריקת F-06 + כתיבת artifact גרף־הקריאות (שער S10.2)
// שימוש: node tools/scan-control-triggers.js  → כותב red-build/tests/artifacts/s10-callgraph.json
// יציאה 1 אם נמצאו הפרות (לשילוב ב־CI).
'use strict';

const path = require('path');
const fs = require('fs');
const { scanControlTriggers } = require(path.join(__dirname, '..', 'red-build', 'src', 'ui', 'callgraph-scan'));

const RED = path.join(__dirname, '..', 'red-build');
const UI_SRC = path.join(RED, 'src', 'ui');
// ה־bundle (ui/app.bundle.js) מחולל מ־src/ui שכבר נסרק כאן — סריקתו הייתה
// מדווחת בכפילות על אותן קריאות. שלמות ה־bundle עצמו נבדקת נפרד בבדיקת s10
// (הפרדת מנוע, אי־הכללת worker-main, offline).
const res = scanControlTriggers(UI_SRC, null);
const outDir = path.join(RED, 'tests', 'artifacts');
fs.mkdirSync(outDir, { recursive: true });
const artifact = {
  schema: 's10-callgraph-v1',
  generated_by: 'tools/scan-control-triggers.js',
  rule: 'F-06: אין עימוד אוטומטי מכל בקרה — requestTypeset/typeset מותרים רק בנתיבים המפורשים',
  files: res.files,
  edges: res.edges,
  allowed: res.allowed,
  violations: res.violations
};
fs.writeFileSync(path.join(outDir, 's10-callgraph.json'), JSON.stringify(artifact, null, 2), 'utf8');

console.log(`scan-control-triggers: ${res.files.length} files · ${res.edges.length} engine-call edges · ${res.allowed.length} allowed (נתיבים מפורשים) · ${res.violations.length} violations`);
for (const v of res.violations) {
  console.error(`  VIOLATION ${v.file} ${v.fn} → ${v.callee}: ${v.reason}`);
}
console.log(`artifact → tests/artifacts/s10-callgraph.json`);
process.exit(res.violations.length ? 1 : 0);
