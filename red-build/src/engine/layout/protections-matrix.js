// src/engine/layout/protections-matrix.js — Protections matrix: re-run after EVERY mutation (REQ-BAL-08, S5.1.4)
'use strict';

/**
 * מציאת שברות widow/orphan/heading-escort/runt/marker/paren אחרי כל פעולת הזזה
 * (balanceColumns, ornament fit, note-area growth, divider insert, rollback).
 * כל הפרה נרשמת ל‑ledger עם capacity evidence (S5.1.10).
 *
 * **תיקוני S7-closure:**
 *  - readingOrder (P0-3): סדר קריאה נבדק לפי תג seq (סדר הצבה = סדר מסמך).
 *    כל הזזה אחורה של שורה בין טורים מפיקה reading-order-break.
 *  - markerLineBreak (P1-3): הגנה לכל סגנונות הסמן — לא רק א׳. הבדיקה מזהה
 *    סמן הערה בסוף שורה לפי מבנה הסמן (אות+גרש / [n] / (n) / n. / כוכבית).
 *  - pageUnderfill (P1-8): עמוד חסר־מילוי — נפק בפועל (בעבר הסוג היה רשום בלבד).
 *    עמודי פתיחה/שער (chapterOpening) ו‑terminalResidual אינם נספרים (B4).
 */

const { usedHeight, pageImbalance } = require('./balancing');

/** זיהוי מילה־סמן הערה בכל סגנון (P1-3): א׳/ב׳…, [n], (n), n., כוכבית, *, **. */
function isNoteMarkerWord(w) {
  const s = String(w);
  if (!s) return false;
  // אות עברית (1-2 אותיות) + גרש/גרשיים
  if (/^[\u05D0-\u05EA]{1,2}[\u05F3\u05F4]$/.test(s)) return true;
  // [n] — סוגריים מרובעים עם מספר
  if (/^\[\d{1,4}\]$/.test(s)) return true;
  // (n)
  if (/^\(\d{1,4}\)$/.test(s)) return true;
  // n. — מספר בודד (decimal)
  if (/^\d{1,4}$/.test(s)) return true;
  // *, **, *** (+מספר אפשרי)
  if (/^\*{1,3}\d*$/.test(s)) return true;
  return false;
}

/** בדיקות הגנה; כל פונקציה מחזירה רשימת הפרות {kind, target, evidence}. */
const CHECKS = {
  widowOrphan(page, settings, ledger) {
    const violations = [];
    for (let c = 0; c < page.columns.length; c++) {
      const col = page.columns[c];
      if (!col.length) continue;
      const first = col[0], last = col[col.length - 1];
      if (first.meta && first.meta.part === 'rest' && col.length >= 1) {
        if (settings['prevent-orphans-top'] && settings['widow-strictness'] !== 'relaxed') {
          violations.push({ kind: 'orphan-top', target: `page#${page.index}c${c}`, page: page.index, evidence: { colLen: col.length }, ledgerRef: ledger.create('orphan-top', `p${page.index}c${c}`, page.index, { colLen: col.length }, 'protections').issue_id });
        }
      }
      if (last.meta && last.meta.part === 'first') {
        const sameTokenInCol = col.filter(x => x.meta && x.meta.tokenId === last.meta.tokenId).length;
        const alsoOrphanBottom = settings['prevent-orphans-bottom'] && sameTokenInCol === 1;
        if (settings['prevent-widows-bottom'] && !alsoOrphanBottom) {
          violations.push({ kind: 'widow-bottom', target: `page#${page.index}c${c}`, page: page.index, evidence: { colLen: col.length }, ledgerRef: ledger.create('widow-bottom', `p${page.index}c${c}`, page.index, { colLen: col.length }, 'protections').issue_id });
        }
      }
      if (first.meta && first.meta.part === 'rest' && first.isLast) {
        if (settings['prevent-widows-top']) {
          violations.push({ kind: 'widow-top', target: `page#${page.index}c${c}`, page: page.index, evidence: {}, ledgerRef: ledger.create('widow-top', `p${page.index}c${c}`, page.index, {}, 'protections').issue_id });
        }
      }
      if (last.meta && last.meta.part === 'first' && col.filter(x => x.meta && x.meta.tokenId === last.meta.tokenId).length === 1) {
        if (settings['prevent-orphans-bottom']) {
          violations.push({ kind: 'orphan-bottom', target: `page#${page.index}c${c}`, page: page.index, evidence: {}, ledgerRef: ledger.create('orphan-bottom', `p${page.index}c${c}`, page.index, {}, 'protections').issue_id });
        }
      }
    }
    return violations;
  },

  headingEscort(page, settings, ledger) {
    const violations = [];
    for (let c = 0; c < page.columns.length; c++) {
      const col = page.columns[c];
      for (let i = 0; i < col.length; i++) {
        const ln = col[i];
        if (ln.kind === 'heading' && ln.level <= 6) {
          const after = col.slice(i + 1).filter(x => x.kind !== 'heading').length;
          if (after < 2) {
            violations.push({ kind: 'heading-escort', target: `${ln.tokenId || lineToken(ln)}@p${page.index}c${c}`, page: page.index, evidence: { linesAfter: after }, ledgerRef: ledger.create('heading-escort', ln.tokenId || lineToken(ln), page.index, { linesAfter: after }, 'protections').issue_id });
          }
        }
      }
    }
    return violations;
  },

  runtLines(page, settings, ledger) {
    const violations = [];
    const seenRunt = new Set();
    const minPx = (page.template.columns[0].w * settings['runt-min-width-pct']) / 100;
    for (const col of page.columns) {
      for (const ln of col) {
        if (ln.isLast && ln.widthPx < minPx) {
          const key = `${lineToken(ln)}|${(ln.words || []).join(' ')}`;
          if (seenRunt.has(key)) continue;
          seenRunt.add(key);
          violations.push({ kind: 'runt-line', target: `line@${lineToken(ln)}`, page: page.index, evidence: { widthPx: Math.round(ln.widthPx), minPx: Math.round(minPx) }, ledgerRef: ledger.create('runt-line', lineToken(ln) || 'unknown', page.index, { widthPx: ln.widthPx }, 'protections').issue_id });
        }
      }
    }
    return violations;
  },

  /**
   * סמן הערה אינו יחידה האחרונה בשורה (BRZ-11) — **לכל הסגנונות** (P1-3).
   * בעבר רק א׳ היה מוגן; הסמנים בפועל ([1] וכד') לא.
   */
  markerLineBreak(page, settings, ledger) {
    const violations = [];
    for (const col of page.columns) {
      for (const ln of col) {
        const words = ln.words || [];
        if (words.length && isNoteMarkerWord(words[words.length - 1])) {
          violations.push({
            kind: 'note-marker-line-break', target: `line@${lineToken(ln)}`, page: page.index,
            evidence: { lastWord: words[words.length - 1] },
            ledgerRef: ledger.create('note-marker-line-break', lineToken(ln) || 'unknown', page.index, { lastWord: words[words.length - 1] }, 'protections').issue_id
          });
        }
      }
    }
    return violations;
  },

  /**
   * **P0-3 — שמירת סדר הקריאה:** כל שורה מתויגת seq (סדר הצבה). הליכה
   * בסדר קריאה (col0 מלמעלה למטה, אחר־כך col1) חייבת להיות לא־יורדת ב‑seq.
   */
  readingOrder(page, settings, ledger) {
    const violations = [];
    let prev = -1;
    for (const col of page.columns) {
      for (const ln of col) {
        if (ln.seq == null) continue; // שורות שהוצבו לפני התיוג (תאימות לאחור) — לא נבדקות
        if (ln.seq < prev) {
          violations.push({
            kind: 'reading-order-break', target: `page#${page.index}@seq${ln.seq}`, page: page.index,
            evidence: { lineSeq: ln.seq, prevSeq: prev },
            ledgerRef: ledger.create('reading-order-break', `p${page.index}@seq${ln.seq}`, page.index, { lineSeq: ln.seq, prevSeq: prev }, 'protections').issue_id
          });
        }
        prev = Math.max(prev, ln.seq);
      }
    }
    return violations;
  },

  parenConsistency(page, settings, ledger) {
    const violations = [];
    // זוג סוגריים שהופרד בין טורים/עמודים — מדווח (אינו מתוקן אוטומטית)
    for (const p of (page.parenRanges || [])) {
      if (p.startCol !== p.endCol || p.startPage !== p.endPage) {
        violations.push({ kind: 'paren-cross-boundary', target: `paren@${p.id}`, page: page.index, evidence: { start: [p.startPage, p.startCol], end: [p.endPage, p.endCol] }, ledgerRef: ledger.create('paren-cross-boundary', p.id, page.index, p, 'protections').issue_id });
      }
    }
    return violations;
  },

  imbalance(page, settings, ledger) {
    const d = pageImbalance(page);
    if (d > settings['imbalance-max-delta-px'] && !page.terminalResidual && page.type !== 'filler') {
      return [{ kind: 'column-imbalance', target: `page#${page.index}`, page: page.index, evidence: { delta: d }, ledgerRef: ledger.create('column-imbalance', `p${page.index}`, page.index, { delta: d }, 'protections').issue_id }];
    }
    return [];
  },

  containment(page, settings, ledger) {
    const out = [];
    const cap = page.template.contentBox.height;
    for (let c = 0; c < page.columns.length; c++) {
      const u = usedHeight(page.columns[c]);
      if (u > cap + 0.5) out.push({ kind: 'containment', target: `page#${page.index}c${c}`, page: page.index, evidence: { used: u, cap }, ledgerRef: ledger.create('containment', `p${page.index}c${c}`, page.index, { used: u, cap }, 'protections').issue_id });
    }
    return out;
  },

  /**
   * **P1-8 — page-underfill נפק בפועל:** עמוד שטוריו מלאים פחות מ‑40% מהקיבולת
   * (ואינו פתיחת חלק/שער, אינו terminalResidual ואינו filler) ⇒ ממצא underfill.
   * בעבר הסוג היה רשום בקטלוג אך אף קוד לא ייצר אותו.
   */
  pageUnderfill(page, settings, ledger) {
    if (page.type === 'filler' || page.terminalResidual || page.chapterOpening) return [];
    if (page.type === 'shaar-main' || page.type === 'shaar-sub' || page.type === 'preface') return [];
    const cap = page.template.contentBox.height;
    const hasContent = page.columns.some(c => c.length);
    if (!hasContent) return [];
    const maxUsed = Math.max(...page.columns.map(c => usedHeight(c)));
    if (maxUsed < cap * 0.4) {
      return [{
        kind: 'page-underfill', target: `page#${page.index}`, page: page.index,
        evidence: { used: Math.round(maxUsed), cap, pct: Math.round((maxUsed / cap) * 100) },
        ledgerRef: ledger.create('page-underfill', `p${page.index}`, page.index, { used: Math.round(maxUsed), cap }, 'protections').issue_id
      }];
    }
    return [];
  }
};

function lineToken(ln) {
  if (ln.tokenId != null) return ln.tokenId;
  if (ln.meta && ln.meta.tokenId != null) return ln.meta.tokenId;
  return '';
}

/**
 * הרצת כל ההגנות על עמוד. @returns {{violations:Array, fired:string[]}}
 */
function runProtections(page, settings, ledger) {
  const violations = [];
  const fired = [];
  for (const [name, fn] of Object.entries(CHECKS)) {
    const v = fn(page, settings, ledger);
    if (v.length) fired.push(name);
    violations.push(...v);
  }
  return { violations, fired };
}

module.exports = { runProtections, CHECKS, isNoteMarkerWord };
