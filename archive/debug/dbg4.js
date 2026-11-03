const { typeset } = require('./src/engine/core/pipeline');
const { getDefaultSettings } = require('./src/engine/core/settings-registry');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');
for (const label of ['default', 'endnote', 'fnoff']) {
  let s = getDefaultSettings();
  if (label === 'endnote') s = { ...s, 'endnotes-enabled': true };
  if (label === 'fnoff') s = { ...s, 'footnotes-enabled': false };
  const r = typeset(FIXTURE, s);
  console.log('===', label, 'preserved:', r.contentPreserved);
  for (const rec of r.ledger.issues.values()) if (rec.kind === 'text-completeness') console.log(JSON.stringify(rec.predicate_before));
}
