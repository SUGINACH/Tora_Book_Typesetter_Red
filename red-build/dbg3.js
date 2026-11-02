const { lexDocument } = require('./src/engine/parser/dfa-lexer');
const { tokenize } = require('./src/engine/parser/block-tokenizer');
const fs = require('fs');
const FIXTURE = fs.readFileSync('tests/fixtures/sample.txt', 'utf8');
const { bodyLines } = lexDocument(FIXTURE);
const tokens = tokenize(bodyLines);
for (const t of tokens) console.log(t.id, t.type, JSON.stringify({ parts: t.parts, notes: t.notes, text: t.text }).slice(0, 220));
