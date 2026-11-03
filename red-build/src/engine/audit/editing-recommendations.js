// src/engine/audit/editing-recommendations.js — המלצות עריכה עם הוכחת dry-run (S11.1-4/5, REQ-GOV-11)
'use strict';

/**
 * **D-16: editing-recommendations require dry-run proof.**
 * כשהמנוע מיצה את האפשרויות החוקיות (runt בלתי־ניתן, אי־איזון ששרד נסיגה, הכלה
 * שלא נפתרה) — מוצעות **עריכות טקסטואליות** (העברת מילה בין פסקאות) עם הוכחה
 * חיה: הפעלה מחדש של המנוע על הטקסט הערוך מוכיחה שהמלצת העריכה (א) מסירה
 * את הממצא המקורי, ו(ב) **לא מייצרת אף ממצא חדש**. המלצה בלי הוכחה נפסלת
 * מראש (rejected) — לעולם לא מוצגת למשתמש.
 *
 * שקיפות (U-A10): כל המלצה נושאת artifact מלא — לפני/אחרי, hash-ים,
 * חתימות ממצאים, מספרי עמודים. ההשוואה לפי kind+target (identity) — לא לפי
 * מספר עמוד (מספרי עמוד זזים בגלל העריכה עצמה).
 *
 * תקציב: עד 8 הרצות ניסיון (dry-runs) ועד 3 המלצות מוחזרות; דוק ≥200 עמודים
 * — המלצות לא מחושבות אוטומטית (שומר הביצועים; זמין לפי דרישה).
 */

// המנוע נדרש בזמן קריאה (לא בטעינה) — מנע תלות מעגלית pipeline ↔ recommendations.
// Node מוחזר את המודול השלם בקריאה השנייה (cache).
let _typeset = null;
function engineTypeset(text, settings, env) {
  if (!_typeset) _typeset = require('../core/pipeline').typeset;
  return _typeset(text, settings, env);
}
const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, normalizeText } = require('../parser/block-tokenizer');
const { applyEdit } = require('./text-edits'); // **S11:** מקור יחיד טהור — גם ל־UI (בלי pipeline)

const QUALIFYING_KINDS = ['runt-line', 'column-imbalance', 'containment'];
const MAX_DRY_RUNS = 8;
const MAX_RECOMMENDATIONS = 3;
const MAX_PAGES_GUARD = 200;

/** חתימת ממצא — identity יציב בין ריצות: עוגן תוכן (textHead מהראיות) במקום
 *  מזהה טוקן שזז כשהעריכה משנה את מספר הפסקאות. עמוד לדיווח בלבד. */
function sigOf(rec) {
  const pb = rec && rec.predicate_before;
  if (pb && typeof pb === 'object' && pb.textHead) return `${rec.kind}@th:${pb.textHead}`;
  return `${rec.kind}@${rec.target}`;
}

/** הממצאים המקבלים המלצות — המנוע מיצה אפשרויות (לא resolved). */
function qualifyingFindings(result) {
  const out = [];
  if (!result || !result.ledger) return out;
  for (const rec of result.ledger.issues.values()) {
    if (rec.status === 'resolved') continue;
    if (!QUALIFYING_KINDS.includes(rec.kind)) continue;
    out.push(rec);
  }
  return out;
}

/**
 * מיפוי טוקנים → שורות המקור: הליכה קדימה על שורות המקור עם מצביע טוקנים.
 * @returns {{lines:string[], tokenLineIdx:Map<string,number>, tokens:Array}|null}
 */
function mapTokensToRawLines(rawText) {
  const { bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  const rawLines = String(rawText).split('\n');
  const tokenLineIdx = new Map();
  let ti = 0;
  for (let li = 0; li < rawLines.length && ti < tokens.length; li++) {
    const trimmed = rawLines[li].trim();
    if (!trimmed) continue; // שורה ריקה — לא טוקן
    if (normalizeText(trimmed) === normalizeText(tokens[ti].raw || '')) {
      tokenLineIdx.set(tokens[ti].id, li);
      ti++;
    }
    // שורת מטא־דאטה בראש (לפני הטוקן הראשון) — לא צורכת טוקן; מזוהה בהמשך
    // ע"י אי־התאמה. ההוכחה החיה מגינה מפני זיהוי שגוי: עריכה שלא משנה hash נפסלת.
  }
  if (ti < tokens.length) return null; // מיפוי לא שלם — לא מייצרים המלצות (שקוף)
  return { lines: rawLines, tokenLineIdx, tokens };
}

/** טוקן הפסקה הבא אחרי tokenId. */
function nextParagraphToken(tokens, tokenId) {
  const i = tokens.findIndex(t => t.id === tokenId);
  if (i < 0) return null;
  for (let j = i + 1; j < tokens.length; j++) {
    if (tokens[j].type === 'paragraph') return tokens[j];
  }
  return null;
}

/** האם טוקן הוא פסקה פשוטה (בלי הערות) — מועמדת לעריכה. */
function isPlainParagraph(tok) {
  if (!tok || tok.type !== 'paragraph') return false;
  const notes = (tok.parts || []).filter(p => p.kind !== 'text');
  return notes.length === 0;
}

/**
 * מועמדות עריכה לממצא (עד 2 לממצא; מילה עוברת בין פסקאות שכנות באותו חלק):
 *  - move-word-down: המילה הראשונה של הפסקה הבאה → סוף פסקת הממצא
 *  - move-word-up:   המילה האחרונה של פסקת הממצא → ראש הפסקה הבאה
 */
function candidateEdits(finding, map) {
  let anchorTok = map.tokens.find(t => t.id === finding.target) || null;
  if (finding.kind === 'runt-line' && typeof finding.target === 'string' && finding.target.startsWith('line@')) {
    anchorTok = map.tokens.find(t => t.id === finding.target.slice(5)) || null;
  }
  if (!anchorTok || !isPlainParagraph(anchorTok)) return [];
  const nextTok = nextParagraphToken(map.tokens, anchorTok.id);
  if (!nextTok || !isPlainParagraph(nextTok)) return [];
  if ((nextTok.part || 1) !== (anchorTok.part || 1)) return []; // לא חוצה חלקים

  const fromLine = map.tokenLineIdx.get(anchorTok.id);
  const toLine = map.tokenLineIdx.get(nextTok.id);
  if (fromLine == null || toLine == null) return [];

  const fromWords = map.lines[fromLine].trim().split(/\s+/).filter(Boolean);
  const toWords = map.lines[toLine].trim().split(/\s+/).filter(Boolean);
  // משמרות מינימליות: לא מוחקים תוכן לעולם — המילה רק עוברת. המקבל/הנותן
  // נשארים עם טקסט; פסקה בת מילה אחת רשאית להימזג קדימה (המילה עוברת — לא נאבד).
  if (toWords.length < 3) return [];        // הנותן (הבאה) חייב להישאר עם ≥2 מילים
  if (fromWords.length < 1) return [];

  const out = [];
  out.push({
    type: 'move-word-down',
    fromLine: toLine, toLine: fromLine,
    description: `להעביר את המילה «${toWords[0]}» מפתיחת הפסקה הבאה אל סוף פסקה זו — מאריך את השורה האחרונה שלה ומקצר את ראש הבאה`,
    before: `${map.lines[fromLine]} ⟂ ${map.lines[toLine]}`,
    after: `${map.lines[fromLine]} ${toWords[0]} ⟂ ${toWords.slice(1).join(' ')}`
  });
  out.push({
    type: 'move-word-up',
    fromLine: fromLine, toLine: toLine,
    description: `להעביר את המילה «${fromWords[fromWords.length - 1]}» מסוף פסקה זו אל פתיחת הפסקה הבאה — מקצר את סופה ומאריך את ראש הבאה`,
    before: `${map.lines[fromLine]} ⟂ ${map.lines[toLine]}`,
    after: `${fromWords.slice(0, -1).join(' ')} ⟂ ${fromWords[fromWords.length - 1]} ${map.lines[toLine]}`
  });
  return out;
}

/** החלת עריכה בודדת על שורות המקור → מסמך חדש (או null אם לא ניתן) — **applyEdit של text-edits**
 *  (מקור יחיד: אותה פונקציה משמשת את המנוע ואת ה־UI). היא מיובאת למעלה. */

/** רשימת הממצאים לפי חתימות (compact, להוכחה). */
function findingSigs(result) {
  const out = [];
  for (const rec of result.ledger.issues.values()) {
    if (rec.status === 'resolved') continue;
    out.push({ sig: sigOf(rec), kind: rec.kind, target: rec.target, page: rec.page });
  }
  return out;
}

/**
 * חישוב ההמלצות. כל המלצה כוללת proof — אחרת היא לא מוחזרת.
 * @param {string} rawText
 * @param {object} settings — כפי שהועברו ל־typeset
 * @param {object} result — תוצאת typeset
 * @param {{force?:boolean}} [opts] — force: עקיפת שומר הגודל (דרישה מפורשת)
 * @returns {{computed:boolean, reason:string, recommendations:Array, rejected:number, dryRuns:number}}
 */
function computeEditingRecommendations(rawText, settings, result, opts) {
  const force = !!(opts && opts.force);
  if (!result || !result.pages) return { computed: false, reason: 'no-result', recommendations: [], rejected: 0, dryRuns: 0 };
  if (!force && result.pages.length > MAX_PAGES_GUARD) {
    return { computed: false, reason: `doc-size-guard:${result.pages.length}>${MAX_PAGES_GUARD}`, recommendations: [], rejected: 0, dryRuns: 0 };
  }
  const findings = qualifyingFindings(result);
  if (!findings.length) return { computed: true, reason: 'no-qualifying-findings', recommendations: [], rejected: 0, dryRuns: 0 };
  const map = mapTokensToRawLines(rawText);
  if (!map) return { computed: true, reason: 'raw-mapping-failed', recommendations: [], rejected: 0, dryRuns: 0 };

  const before = {
    hash: result.layoutHash,
    sigs: findingSigs(result).map(s => s.sig),
    pages: result.pages.length
  };
  const recommendations = [];
  let rejected = 0, dryRuns = 0;

  outer:
  for (const finding of findings) {
    for (const edit of candidateEdits(finding, map)) {
      if (dryRuns >= MAX_DRY_RUNS || recommendations.length >= MAX_RECOMMENDATIONS) break outer;
      dryRuns++;
      const editedText = applyEdit(map.lines, edit);
      if (editedText == null) { rejected++; continue; }
      const after = engineTypeset(editedText, settings, { noRecommendations: true }); // אין המלצות בתוך dry-run (מנע רקורסיה)
      const afterSigs = findingSigs(after).map(s => s.sig);
      const targetSig = sigOf(finding);
      const removed = !afterSigs.includes(targetSig);
      const added = afterSigs.filter(s => !before.sigs.includes(s) && s !== targetSig);
      if (after.layoutHash === before.hash) { rejected++; continue; } // no-op — לא המלצה
      if (!removed || added.length > 0) { rejected++; continue; }     // בלי הוכחה — נפסל (D-16)
      recommendations.push({
        id: `rec-${recommendations.length + 1}`,
        finding: { kind: finding.kind, target: finding.target, page: finding.page, evidence: finding.predicate_before || null },
        edit: {
          type: edit.type, description: edit.description,
          lineFrom: map.lines[edit.fromLine], lineTo: map.lines[edit.toLine],
          lineFromIdx: edit.fromLine, lineToIdx: edit.toLine, // להחלה ב־UI על טקסט המקור
          before: edit.before, after: edit.after
        },
        proof: {
          beforeHash: before.hash, afterHash: after.layoutHash,
          pagesBefore: before.pages, pagesAfter: after.pages.length,
          removedFinding: targetSig, newFindings: added, dryRunIndex: dryRuns
        }
      });
      if (recommendations.length >= MAX_RECOMMENDATIONS) break outer;
    }
  }
  return { computed: true, reason: 'ok', recommendations, rejected, dryRuns };
}

module.exports = {
  computeEditingRecommendations, qualifyingFindings, findingSigs,
  candidateEdits, sigOf, mapTokensToRawLines,
  QUALIFYING_KINDS, MAX_DRY_RUNS, MAX_RECOMMENDATIONS, MAX_PAGES_GUARD
};
// **S11:** applyEdit עבר ל־text-edits.js (מקור יחיד טהור — בלי תלות במנוע; לשימוש ה־UI).
