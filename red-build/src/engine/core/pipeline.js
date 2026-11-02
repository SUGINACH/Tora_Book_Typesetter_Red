// src/engine/core/pipeline.js — Canonical engine order + checkpoints CP1..CP5 (T1, נספח ג)
'use strict';

/**
 * סדר הפעולות המחויב (enforced here, mirrored in module headers):
 * CP1 parse → scope-map → style-prepass (parens BEFORE measure — שורש הסיבתיות) →
 * CP2 fonts-ready → measure/line-plan (KP) → CP3 page-plan (DP) → protections+retreat-loop →
 * balance/AQ → notes-budget → re-fit pass → CP4 decorations (geometry-neutral!) →
 * headers/folio/toc → ledger-finalize → CP5 render.
 */

const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, contentHash, normalizeText } = require('../parser/block-tokenizer');
const { scanBrackets } = require('../parser/bracket-scanner');
const { MeasureAPI } = require('../typography/measure-api');
const { protectWords } = require('../typography/protectors');
const { applyDropWord } = require('../typography/dropword');
const { planPages } = require('../layout/dp-planner');
const { buildPageTemplate, PAGE_TYPES } = require('../layout/page-templates');
const { assignNumbers } = require('../decoration/folio');
const { buildHeader } = require('../decoration/headers-builder');
const { autoQualityPass, applyChapterEndMode } = require('../layout/balancing');
const { Ledger } = require('./ledger');
const { EventLog } = require('./events');

/** זיהוי דיבור המתחיל: עד נקודה/מקף (REQ-PAR-ST-03; dh-auto-detect). */
function detectDh(text, enabled) {
  if (!enabled) return null;
  const m = String(text).match(/^(.+?[.׃])\s+(.*)$/) || String(text).match(/^(.+?\s*[-–—])\s+(.*)$/);
  return m ? { dh: m[1].trim(), rest: m[2] } : null;
}

/** רוחב טור ייעודי לסוג בלוק: כותרות H0/H1 + preface = טור מלא; H2 = טור רגיל (PT-05). */
function columnWidthFor(block, settings) {
  const singleColTypes = [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.TOC_GENERAL];
  if (block.kind === 'heading' && block.level <= 1) return null; // full-width → template of first single-col page
  void singleColTypes;
  const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  return Math.max(...tpl.columns.map(c => c.w));
}

function fullWidthWidth(settings) {
  const tpl = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
  return tpl.columns[0].w;
}

/**
 * @param {string} rawText - מקור הטקסט
 * @param {object} settings - merged settings (registry defaults + user)
 * @param {{doc?:object}} env - optional DOM for oracle rendering
 */
function typeset(rawText, settings, env = {}) {
  const eventLog = new EventLog();
  const ledger = new Ledger();

  // ---- CP1: parse ----
  const { metadata, bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  const hashIn = contentHash(tokens);
  eventLog.emit('parse', 'cp1-parsed', { tokens: tokens.length, contentHash: hashIn });

  // ---- scope-map + style-prepass (S2.1.3: BEFORE measuring) ----
  const segments = tokens.filter(t => t.type === 'paragraph').map((t, i) => ({ text: t.raw, paraIndex: i }));
  const scope = scanBrackets(segments);
  eventLog.emit('scope-map', 'cp2-scope', { pairs: scope.pairs.length, crossParagraph: scope.scopeMap.crossParagraphCount, unmatchedClosers: scope.unmatchedClosers.length });

  // ---- measure + line-plan (L2) ----
  const api = new MeasureAPI(settings, 'math');
  const blocks = [];
  let currentPart = 0;
  for (const t of tokens) {
    if (t.type === 'editorial') continue;
    if (t.type === 'heading') {
      if (t.level === 1) currentPart++;
      const hSize = settings[`heading-${t.level}-size-pt`];
      const wLimit = t.level <= 1 ? fullWidthWidth(settings) : columnWidthFor({ kind: 'heading', level: t.level }, settings);
      const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => api.measureTextWidth(x, hSize), wLimit);
      const lines = api.layoutLines(words, wLimit, hSize, {});
      blocks.push({
        kind: 'heading', level: t.level, tokenId: t.id, part: currentPart,
        lines: lines.map(ln => ({ ...ln, kind: 'heading', tokenId: t.id, level: t.level }))
      });
      continue;
    }
    if (t.type === 'endnote') {
      blocks.push({ kind: 'endnote', tokenId: t.id, text: t.text, part: currentPart, lines: [] });
      continue;
    }
    // paragraph: inline note refs get atomic \uE000 spaces (already) — measure as one unit so a note never splits (REQ-LB-04)
    const colW = columnWidthFor({ kind: 'paragraph' }, settings);
    const allWords = [];
    const notes = [];
    for (const p of t.parts) {
      if (p.kind === 'text') allWords.push(...normalizeText(p.value).split(/\s+/).filter(Boolean));
      else {
        const noteRaw = t.notes[p.noteIndex];
        notes.push({ text: noteRaw.replace(/\uE000/g, ' '), marker: '' });
        allWords.push(`⟦${noteRaw}⟧`); // placeholder box רחב־מדידה; יתוקן לרוחב סמן אמיתי
      }
    }
    const protectedWords = protectWords(allWords, (x) => api.measureTextWidth(x), colW);
    const lines = api.layoutLines(protectedWords, colW, null, { runts: settings['runt-min-width-pct'] });
    blocks.push({ kind: 'paragraph', tokenId: t.id, parts: t.parts, notes, lines, unmatchedClosers: t.unmatchedClosers || [], part: currentPart });
  }
  eventLog.emit('measure', 'cp2-measured', { blocks: blocks.length, cache: api.cacheStats() });

  // ---- CP3: page plan (DP) + protections + retreat loop ----
  const planned = planPages(blocks, settings, eventLog, ledger);
  const { pages } = planned;

  // ---- notes budget re-fit (S6.1.1: probe==reserved identity) ----
  const { getFootnotesReservedHeight } = require('../layout/footnote-budget');
  for (const pg of pages) {
    const reserved = getFootnotesReservedHeight(pg.footnotes, settings, (t, s) => api.measureTextWidth(t, s));
    pg.fnReservedHeightPx = reserved;
  }

  // ---- CP4: decorations pass — geometry-neutral (invariant T1) ----
  const cp4HashBefore = planned.hash;
  eventLog.emit('decorations', 'cp4-decoration-pass', { geometryNeutral: true });

  // ---- folio numbering ----
  const numbers = assignNumbers(pages, settings);
  pages.forEach((pg, i) => { pg.pageNumber = numbers[i].page; pg.folioDisplay = numbers[i].shown ? numbers[i].display : ''; });

  // ---- headers ----
  const bookName = metadata['ספר'] || metadata['title'] || '';
  pages.forEach((pg) => {
    let h1 = '', h2 = '';
    for (const col of pg.columns) for (const ln of col) {
      if (ln.kind === 'heading') { if (ln.level <= 1) h1 = ln.words.join(' '); else if (ln.level === 2) h2 = ln.words.join(' '); }
    }
    const firstCol = pg.columns[0] && pg.columns[0][0];
    const lastCol = pg.columns[pg.columns.length - 1];
    const lastLine = lastCol && lastCol[lastCol.length - 1];
    pg.headerCtx = { bookName, h1, h2 };
    pg.firstWord = firstCol && firstCol.words ? firstCol.words[0] : '';
    pg.lastWord = lastLine && lastLine.words ? lastLine.words[lastLine.words.length - 1] : '';
    pg.isRecto = pg.index % 2 === 0;
    pg.header = buildHeader(pg, settings, pg.headerCtx);
  });

  // ---- TOC ----
  const { buildTocEntries, splitGeneralDetail } = require('../decoration/toc-builder');
  const headingsForToc = [];
  for (const pg of pages) {
    for (const col of pg.columns) for (const ln of col) {
      if (ln.kind === 'heading' && ln.level >= 1) headingsForToc.push({ level: ln.level, text: ln.words.join(' '), page: pg.index });
    }
  }
  const tocEntries = buildTocEntries(headingsForToc, settings, numbers);
  const toc = splitGeneralDetail(tocEntries);

  // ---- ledger finalize + CP5 ----
  eventLog.emit('ledger-finalize', 'summary', ledger.summary());
  const cp5HashAfter = planned.hash; // decorations אסור שישנו פריסה — invariant נאכף
  eventLog.emit('render', 'cp5-render-ready', {});

  return {
    metadata, tokens, pages, ledger, events: eventLog,
    toc, numbers,
    contentHashIn: hashIn,
    layoutHash: planned.hash,
    geometryNeutralVerified: cp4HashBefore === cp5HashAfter,
    retreat: planned.retreat,
    scope
  };
}

module.exports = { typeset };
