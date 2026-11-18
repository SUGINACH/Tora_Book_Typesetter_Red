// src/engine/parser/document-structure.js — source-level heading validity (D-100)
'use strict';

const { scanBrackets } = require('./bracket-scanner');

function hasMeaningfulText(value) {
  return /[\p{L}\p{N}]/u.test(String(value == null ? '' : value));
}

function withoutFootnotes(value, opts = {}) {
  const source = String(value == null ? '' : value);
  if (!source) return source;
  const scan = scanBrackets([{ text: source, paraIndex: 0 }], {
    open: opts.fnOpen,
    close: opts.fnClose
  });
  const ranges = scan.pairs.filter(pair => pair.depth === 1).sort((a, b) => b.open - a.open);
  let visible = source;
  for (const pair of ranges) visible = visible.slice(0, pair.open) + visible.slice(pair.close + 1);
  return visible;
}

function paragraphHasBodyText(token) {
  const parts = Array.isArray(token.parts)
    ? token.parts
    : [{ kind: 'text', value: token.raw != null ? token.raw : token.text }];
  return parts.some(part => part && part.kind === 'text' && hasMeaningfulText(part.value));
}

function validateHeadingStructure(tokens, opts = {}) {
  const input = Array.isArray(tokens) ? tokens : [];
  const issues = [];
  let pending = [];
  let headingCount = 0;

  for (let index = 0; index < input.length; index++) {
    const token = input[index] || {};
    if (token.type === 'heading') {
      headingCount++;
      const level = Number(token.level);
      const info = {
        level,
        tokenId: token.id || null,
        tokenIndex: index + 1,
        title: String(token.text == null ? '' : token.text)
      };
      if (!Number.isInteger(level) || level < 0 || level > 7) {
        issues.push({ code: 'heading-level-invalid', ...info });
        pending = [info];
        continue;
      }
      const titleWithoutNotes = withoutFootnotes(info.title, opts);
      if (!hasMeaningfulText(titleWithoutNotes)) {
        const containsNoteMarkup = info.title.trim() !== titleWithoutNotes.trim();
        issues.push({
          code: containsNoteMarkup ? 'heading-title-note-only' : 'heading-title-no-meaningful-text',
          ...info
        });
      }
      if (pending.length) {
        const previous = pending[pending.length - 1];
        if (!(level > previous.level)) {
          issues.push({
            code: 'heading-chain-not-increasing',
            previousLevel: previous.level,
            previousTokenId: previous.tokenId,
            previousTokenIndex: previous.tokenIndex,
            level,
            tokenId: info.tokenId,
            tokenIndex: info.tokenIndex
          });
          pending = [info];
          continue;
        }
      }
      pending.push(info);
      continue;
    }
    if (token.type === 'paragraph' && paragraphHasBodyText(token)) pending = [];
  }

  if (pending.length) {
    const last = pending[pending.length - 1];
    issues.push({
      code: 'heading-chain-no-body-text',
      level: last.level,
      tokenId: last.tokenId,
      tokenIndex: last.tokenIndex,
      chain: pending.map(item => item.level)
    });
  }
  return { ok: issues.length === 0, issues, headingCount };
}

function formatHeadingStructureIssues(issues) {
  return (Array.isArray(issues) ? issues : []).map(issue => {
    const at = issue.tokenId ? ' [' + issue.tokenId + ']' : '';
    switch (issue.code) {
      case 'heading-title-note-only':
        return 'כותרת H' + issue.level + at + ' מכילה הערת שוליים בלבד ואינה כוללת טקסט כותרת עצמאי.';
      case 'heading-title-no-meaningful-text':
        return 'כותרת H' + issue.level + at + ' אינה מכילה טקסט כותרת ממשי; סימני פיסוק או קישוט בלבד אינם כותרת.';
      case 'heading-chain-not-increasing':
        return 'רצף כותרות ללא טקסט גוף אינו היררכי: אחרי H' + issue.previousLevel +
          ' מופיעה H' + issue.level + at +
          '. יש להשלים תוכן במקטע הקודם לפני מעבר לרמה זהה או גבוהה יותר.';
      case 'heading-chain-no-body-text':
        return 'שרשרת הכותרות ' + issue.chain.map(level => 'H' + level).join(' → ') +
          ' מסתיימת ללא פסקת גוף בעלת טקסט ממשי; הערות שוליים לבדן אינן נחשבות תוכן.';
      case 'heading-level-invalid':
        return 'נמצאה כותרת ברמה שאינה נתמכת (' + issue.level + ')' + at + '; הרמות התקינות הן H0–H7.';
      default:
        return 'נמצאה הפרת מבנה כותרות (' + (issue.code || 'unknown') + ')' + at + '.';
    }
  }).join('\n');
}

class DocumentStructureError extends Error {
  constructor(issues) {
    const detail = formatHeadingStructureIssues(issues);
    super('מבנה מסמך לא תקין; העימוד נעצר לפני שלב המדידה:\n' + detail);
    this.name = 'DocumentStructureError';
    this.code = 'INVALID_DOCUMENT_STRUCTURE';
    this.issues = Array.isArray(issues) ? issues : [];
  }
}

function assertHeadingStructure(tokens, opts = {}) {
  const result = validateHeadingStructure(tokens, opts);
  if (!result.ok) throw new DocumentStructureError(result.issues);
  return result;
}

module.exports = {
  validateHeadingStructure,
  assertHeadingStructure,
  formatHeadingStructureIssues,
  DocumentStructureError
};
