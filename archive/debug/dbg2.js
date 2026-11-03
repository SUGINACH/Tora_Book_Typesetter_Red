const { typeset } = require('./src/engine/core/pipeline');
const { getDefaultSettings } = require('./src/engine/core/settings-registry');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');

function dump(label, s) {
  const r = typeset(FIXTURE, s);
  console.log(label, 'preserved:', r.contentPreserved);
  for (const rec of r.ledger.issues.values()) {
    if (rec.kind === 'text-completeness') console.log(JSON.stringify(rec.predicate_before));
  }
  return r;
}

dump('fn-off :', { ...getDefaultSettings(), 'footnotes-enabled': false });
const r3 = dump('endnote:', { ...getDefaultSettings(), 'endnotes-enabled': true });
console.log('endnotePages count:', r3.endnotePages && r3.endnotePages.count);
