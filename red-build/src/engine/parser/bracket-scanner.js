// src/engine/parser/bracket-scanner.js — Balanced stack scanner for [...] footnotes (REQ-PAR-02, REQ-PAR-ST-01)
'use strict';

/**
 * סורק מחסנית: זיהוי זוגות `[...]` כולל קינון, טווחים חוצי פסקה/טור/עמוד,
 * וספירת עומק לכל מיקום. סוגרים ללא פותח **מדווחים ואינם מתוקנים אוטומטית** (doctrine).
 *
 * @param {Array<{text:string, paraIndex:number}>} segments - מקטעי טקסט עם מספר פסקה
 * @returns {{pairs:Array, unmatchedClosers:Array, depthAt:(pos)=>number, scopeMap:Object}}
 */
function scanBrackets(segments) {
  const stack = [];
  const pairs = [];
  const unmatchedClosers = [];
  const depthMarks = []; // {globalPos, depth}
  let globalPos = 0;

  for (const seg of segments) {
    const text = seg.text;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const gp = globalPos + i;
      if (ch === '[') {
        stack.push({ openPos: gp, para: seg.paraIndex });
      } else if (ch === ']') {
        if (stack.length === 0) {
          unmatchedClosers.push({ pos: gp, para: seg.paraIndex, note: 'דורש אימות מול מקור — אין לתקן אוטומטית' });
        } else {
          const o = stack.pop();
          pairs.push({
            open: o.openPos, close: gp,
            depth: stack.length,
            startPara: o.para, endPara: seg.paraIndex,
            crossParagraph: o.para !== seg.paraIndex
          });
        }
      }
      depthMarks.push({ pos: gp, depth: stack.length });
    }
    globalPos += text.length;
  }

  // פותחים שנשארו ללא סוגר
  const unmatchedOpeners = stack.map(o => ({ pos: o.openPos, para: o.para }));

  return {
    pairs,
    unmatchedClosers,
    unmatchedOpeners,
    depthAt(pos) {
      let best = null;
      for (const m of depthMarks) if (m.pos <= pos) best = m;
      return best ? best.depth : 0;
    },
    scopeMap: { totalPairs: pairs.length, crossParagraphCount: pairs.filter(p => p.crossParagraph).length }
  };
}

module.exports = { scanBrackets };
