#!/usr/bin/env node
'use strict';

// Source-only structural preflight. This tool never invokes pagination or writes
// to the input file. Use --expect-invalid for a negative-control fixture.
const fs = require('fs');
const path = require('path');

const { lexDocument } = require('../red-build/src/engine/parser/dfa-lexer');
const { tokenize } = require('../red-build/src/engine/parser/block-tokenizer');
const {
  validateHeadingStructure,
  formatHeadingStructureIssues
} = require('../red-build/src/engine/parser/document-structure');
const { getDefaultSettings } = require('../red-build/src/engine/core/settings-registry');

function main() {
  const args = process.argv.slice(2);
  const expectInvalid = args.includes('--expect-invalid');
  const input = args.find(arg => arg !== '--expect-invalid');
  if (!input) {
    console.error('Usage: node tools/validate-source-structure.js <source.txt> [--expect-invalid]');
    process.exitCode = 2;
    return;
  }

  const file = path.resolve(process.cwd(), input);
  if (!fs.existsSync(file)) {
    console.error('Source file not found: ' + file);
    process.exitCode = 2;
    return;
  }

  const raw = fs.readFileSync(file, 'utf8');
  const settings = getDefaultSettings();
  const parseOpts = {
    endnotePrefix: settings['en-line-prefix'],
    fnOpen: settings['fn-delim-open'],
    fnClose: settings['fn-delim-close']
  };
  const parsed = lexDocument(raw, parseOpts);
  const result = validateHeadingStructure(tokenize(parsed.bodyLines, parseOpts), parseOpts);

  console.log('Source: ' + input);
  console.log('Headings: ' + result.headingCount);
  console.log('Structural status: ' + (result.ok ? 'VALID' : 'INVALID'));
  console.log('Issues: ' + result.issues.length);
  if (!result.ok) console.log(formatHeadingStructureIssues(result.issues));

  if (expectInvalid && result.ok) {
    console.error('Expected an invalid document, but the source passed D-100.');
    process.exitCode = 1;
    return;
  }
  if (!expectInvalid && !result.ok) {
    console.error('The source does not satisfy D-100.');
    process.exitCode = 1;
    return;
  }
  if (expectInvalid) console.log('Expected rejection confirmed (negative-control fixture).');
  else console.log('D-100 source validation passed.');
}

main();
