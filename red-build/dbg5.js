const { typeset } = require('./src/engine/core/pipeline');
const { getDefaultSettings } = require('./src/engine/core/settings-registry');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');
const r = typeset(FIXTURE, getDefaultSettings());
for (const pg of r.pages) for (const col of pg.columns) for (const ln of col) {
  const j = ln.words.join(' ');
  if (j.includes('צדקה') || j.includes('[1]') || j.includes('הערה')) console.log(JSON.stringify(ln.words));
}
console.log('page footnotes:', JSON.stringify(r.pages.map(p => p.footnotes.map(n => ({m:n.marker,t:n.text})))).slice(0,400));
