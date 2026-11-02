const { typeset } = require('./src/engine/core/pipeline');
const { getDefaultSettings } = require('./src/engine/core/settings-registry');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');
const s = { ...getDefaultSettings(), 'note-placement-mode': 'endnotes' };
console.log('endnotes-enabled default =', getDefaultSettings()['endnotes-enabled']);
const r = typeset(FIXTURE, s);
console.log('preserved:', r.contentPreserved, 'endnotePagesInfo:', JSON.stringify(r.endnotePages).slice(0,200));
for (const rec of r.ledger.issues.values()) if (rec.kind==='text-completeness') console.log(JSON.stringify(rec.predicate_before.mismatches));
// where did the note text go?
for (const pg of r.pages) for (const col of pg.columns) for (const ln of col) {
  const j = ln.words.join(' ');
  if (j.includes('הערה') || j.includes('[1]')) console.log('BODY LINE:', JSON.stringify(j));
}
console.log('page footers:', r.pages.map(p=>p.footnotes.map(n=>n.marker+':'+n.text)));
