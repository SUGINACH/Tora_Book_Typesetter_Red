#!/usr/bin/env node
// docs/tools/gen-settings-doc.js — generates docs/SETTINGS.md from the settings registry.
// Run from the repository root:  node docs/tools/gen-settings-doc.js
// Read-only with respect to the engine: it only require()s the registry and the generated UI bindings.
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RED = path.join(ROOT, 'red-build');
const R = require(path.join(RED, 'src', 'engine', 'core', 'settings-registry'));
const { BINDINGS } = require(path.join(RED, 'src', 'ui', 'bindings.generated.js'));

const meta = new Map(BINDINGS.map((b) => [b.id, { label: b.labelHe, panelKey: b.panelKey }]));
const defs = R.getSettingDefs();
const defaults = R.getDefaultSettings();

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').replace(/`/g, "'");
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const fmt = (v) => '`' + cut(esc(typeof v === 'string' ? JSON.stringify(v) : String(v)), 48) + '`';
function range(d) {
  if (Array.isArray(d.enum)) return cut(esc(d.enum.map(String).join(' | ')), 90);
  if (d.min != null || d.max != null) {
    return `${d.min != null ? d.min : '…'} – ${d.max != null ? d.max : '…'}${d.step != null ? ` (step ${d.step})` : ''}`;
  }
  return '';
}

let commit = 'unknown';
try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { /* not a git checkout */ }

const groups = Object.keys(R.PANELS);
const withRows = groups.filter((k) => defs.some((d) => (meta.get(d.id) || {}).panelKey === k));
const uiOnly = groups.filter((k) => !withRows.includes(k));
const ids = new Set(defs.map((d) => d.id));
const derived = Object.keys(defaults).filter((k) => !ids.has(k));
const byType = {};
defs.forEach((d) => { byType[d.type] = (byType[d.type] || 0) + 1; });

const out = [];
out.push('# Settings Reference', '');
out.push('> **Generated file — do not edit by hand.** Source of truth: `red-build/src/engine/core/settings-registry.js`');
out.push('> (UI labels and grouping from `red-build/src/ui/bindings.generated.js`).');
out.push(`> Generated at commit \`${commit}\`. Regenerate from the repository root: \`node docs/tools/gen-settings-doc.js\`.`, '');
out.push(`The registry defines **${defs.length} settings** in **${withRows.length} groups** (${Object.entries(byType).map(([t, n]) => `${t}: ${n}`).join(', ')}).`);
out.push(`The registry also declares ${groups.length} panel groups in total; ${uiOnly.map((k) => `\`${k}\``).join(', ') || 'none'} hold no registry settings (UI-only panels).`);
if (derived.length) out.push(`\`getDefaultSettings()\` additionally returns derived key(s) that are not registry settings: ${derived.map((k) => `\`${k}\``).join(', ')}.`);
out.push('');
out.push('## How settings work', '');
out.push('- **Three-layer contract** (control ↔ key ↔ mechanism ↔ effect test): every registry entry names its UI control (`control`), the engine modules that consume it (`consumers`) and the test that proves it has an effect (`effect_test`). Automatic scanners (`red-build/src/audit/scanners.js`) fail the test chain on dead controls, phantom keys and orphan mechanisms.');
out.push('- **Defaults first:** `getDefaultSettings()` returns the full default object; user values are merged on top. The engine always receives a complete settings object: `typeset(text, settings)`.');
out.push('- **Heavy vs. light changes:** changing a "heavy" setting does not re-typeset automatically; the UI waits for an explicit ⚡ (see `red-build/src/ui/retypeset-policy.js`).');
out.push('- **Persistence:** the UI stores only the *difference from the defaults* in `localStorage` under the key `tora-red-user-settings`; unknown keys are skipped on restore.');
out.push('- **Legacy files:** v1 settings files and project ZIPs are migrated automatically — see [`MIGRATION.md`](../MIGRATION.md).', '');
out.push('Column legend: *Allowed / range* lists enum values or `min – max (step)`; *Note* is truncated to 140 characters — see the registry for the full text.', '');

for (const key of withRows) {
  const rows = defs.filter((d) => (meta.get(d.id) || {}).panelKey === key);
  out.push(`## ${R.PANELS[key]} (\`${key}\`) — ${rows.length} settings`, '');
  out.push('| Key | Label (UI) | Type | Default | Allowed / range | Note |', '|---|---|---|---|---|---|');
  for (const d of rows) {
    out.push(`| \`${d.id}\` | ${esc((meta.get(d.id) || {}).label || '')} | ${d.type} | ${fmt(d.default)} | ${range(d)} | ${cut(esc(d.note || ''), 140)} |`);
  }
  out.push('');
}
fs.writeFileSync(path.join(ROOT, 'docs', 'SETTINGS.md'), out.join('\n'));
console.log(`wrote docs/SETTINGS.md: ${defs.length} settings, ${withRows.length} groups`);
