// src/engine/parser/bracket-scanner.js — Balanced stack scanner for [...] footnotes (REQ-PAR-02, REQ-PAR-ST-01)
'use strict';

/**
 * Close form registry: every accepted closing spelling of a footnote bracket.
 * Keyed by the FIRST character of the closer; `len` = characters consumed in the source text.
 *   ']'      → plain ASCII closer                     (len 1)
 *   ']' + U+05DD → Hebrew-style "‏]ם" closer          (len 2)
 * Openers are always '['. Matching is done against this table so future
 * historical variants (e.g. gershayim-closers) can be added without touching the loop.
 */
const CLOSER_FORMS = [
  { first: ']', len: 1, name: 'ascii' },
  { first: ']', len: 2, next: '\u05DD', name: 'hebrew-mem-sofit' },
];

/**
 * Return the closer form matching at text[i], or null.
 * Deterministic longest-match: we scan the whole registry, keep every form
 * whose characters actually match at position i, and return the one consuming
 * the most characters. Registry order can never change the outcome.
 */
function matchCloser(text, i) {
  let best = null;
  for (const f of CLOSER_FORMS) {
    if (text[i] !== f.first) continue;
    // Verify all trailing characters declared by the form (if any).
    let ok = true;
    if (f.next !== undefined) {
      const lastIdx = i + f.len - 1;
      ok = lastIdx < text.length && text[lastIdx] === f.next;
    }
    if (ok && (!best || f.len > best.len)) best = f;
  }
  return best;
}

/**
 * Stack scanner: detects `[...]` pairs including nesting, ranges spanning
 * paragraphs/columns/pages, and depth at every position. Unmatched closers and
 * openers are REPORTED, never auto-fixed (source-fidelity doctrine).
 *
 * @param {Array<{text:string, paraIndex:number}>} segments - text runs tagged with paragraph index
 * @returns {{pairs:Array, unmatchedClosers:Array, unmatchedOpeners:Array, depthAt:(pos)=>number, scopeMap:Object}}
 */
function scanBrackets(segments) {
  const stack = [];
  const pairs = [];
  const unmatchedClosers = [];
  const depthMarks = []; // {pos, depth} sampled after processing each consumed char-run
  let globalPos = 0;

  for (const seg of segments) {
    const text = seg.text;
    const para = Number.isInteger(seg.paraIndex) ? seg.paraIndex : 0;
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      const gp = globalPos + i;
      if (ch === '[') {
        stack.push({ openPos: gp, para });
        depthMarks.push({ pos: gp, depth: stack.length });
        i += 1;
      } else {
        const form = matchCloser(text, i);
        if (!form) {
          depthMarks.push({ pos: gp, depth: stack.length });
          i += 1;
        } else if (stack.length === 0) {
          // Doctrine: report, never silently repair. Extra chars of the closer
          // are still consumed so positions stay consistent for downstream mappers.
          unmatchedClosers.push({
            pos: gp,
            end: gp + form.len - 1,
            para,
            form: form.name,
            note: 'דורש אימות מול מקור — אין לתקן אוטומטית'
          });
          depthMarks.push({ pos: gp, depth: 0 });
          i += form.len;
        } else {
          const o = stack.pop();
          pairs.push({
            open: o.openPos,
            close: gp + form.len - 1, // last character of the closer
            depth: stack.length + 1,  // 1 = outermost pair (matches block-tokenizer convention)
            startPara: o.para,
            endPara: para,
            crossParagraph: o.para !== para,
            closerForm: form.name
          });
          depthMarks.push({ pos: gp, depth: stack.length });
          i += form.len;
        }
      }
    }
    globalPos += text.length;
  }

  // Unclosed openers are reported too (same doctrine: flag, don't fix).
  const unmatchedOpeners = stack.map(o => ({
    pos: o.openPos,
    para: o.para,
    note: 'פותח ללא סוגר — דורש אימות מול מקור'
  }));

  return {
    pairs,
    unmatchedClosers,
    unmatchedOpeners,
    /** Nesting depth active at a global position (0 = outside any note). */
    depthAt(pos) {
      let best = 0;
      for (const m of depthMarks) if (m.pos <= pos) best = m.depth; else break;
      return best;
    },
    scopeMap: {
      totalPairs: pairs.length,
      crossParagraphCount: pairs.filter(p => p.crossParagraph).length,
      hebrewClosers: pairs.filter(p => p.closerForm === 'hebrew-mem-sofit').length
    }
  };
}

module.exports = { scanBrackets, matchCloser, CLOSER_FORMS };
