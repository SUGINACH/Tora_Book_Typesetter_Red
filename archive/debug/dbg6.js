const { typeset } = require('/workspace/red-build/src/engine/core/pipeline');
const { getDefaultSettings } = require('/workspace/red-build/src/engine/core/settings-registry');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');
for (const [label, s] of [
  ['default', getDefaultSettings()],
  ['fn-off', { ...getDefaultSettings(), 'footnotes-enabled': false }],
  ['endnotes-mode', { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' }],
]) {
  const r = typeset(FIXTURE, s);
  console.log('===', label, 'preserved:', r.contentPreserved);
  for (const rec of r.ledger.issues.values()) {
    if (rec.kind === 'text-completeness') {
      const d = rec.predicate_before || rec.details;
      console.log(JSON.stringify(d, null, 1).slice(0, 3000));
    }
  }
}
