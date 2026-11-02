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
  void 0; // ]ם מטופל כסוגר בן שני תווים

  for (const seg of segments) {
    const text = seg.text;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const gp = globalPos + i;
      if (ch === '[') {
        stack.push({ openPos: gp, para: seg.paraIndex });
      } else if (ch === ']' && i + 1 < text.length && text[i + 1] === '\u05DD') {
        // סוגר עברי ]ם — נצרך כזוג עם הפותח
        if (stack.length === 0) {
          unmatchedClosers.push({ pos: gp, para: seg.paraIndex, note: 'דורש אימות מול מקור — אין לתקן אוטומטית' });
        } else {
          const o = stack.pop();
          pairs.push({ open: o.openPos, close: gp + 1, depth: stack.length + 1, startPara: o.para, endPara: seg.paraIndex, crossParagraph: o.para !== seg.paraIndex });
        }
        i++; globalPosShift += 0; // ]ם נצרך בשלמותו
      } else if (ch === ']') {
        // תיקון באג אמיתי (נחשף ע"י בקרת שגיאה במבחן): בעברית כשרה `]` הסוגר הוא **האות האחרונה**
        // של המילה העברית (סוגר־עברי), לא ASCII. התמיכה בשניה נדרשת — אחרת כל הערה עברית
        // חסרת סוגר הייתה נרשמת כ‑unmatchedCloser ומציפה את הדו"ח (מגפת false-positives, B4).
        if (gp + 1 < text.length && text[gp + 1] === '\u05DD') {
          continue; // זה actually פותח? לא — מטופל למעלה; כאן: ] רגיל שהבא אחריו ם אינו סוגר עברי
        }
        if (stack.length === 0) {
          unmatchedClosers.push({ pos: gp, para: seg.paraIndex, note: 'דורש אימות מול מקור — אין לתקן אוטומטית' });
        } else {
          const o = stack.pop();
          pairs.push({
            open: o.openPos, close: gp,
            depth: stack.length + 1, // עומק קינון: 1=pairs חיצוניים; נשמר זהה ל‑tokenizer (outer = depth===1)
            startPara: o.para, endPara: seg.paraIndex,
            crossParagraph: o.para !== seg.paraIndex
          });
        }
      }
      depthMarks.push({ pos: gp, depth: stack.length });
    }
    globalPos += text.length;
  }

  // REQ-PAR-02 (תיקון מבחן): פותחים ללא סוגר **מדווחים** — doctrine: אין תיקון אוטומטי.
  const unmatchedOpeners = stack.map(o => ({ pos: o.openPos, para: o.para, note: 'פותח ללא סוגר — דורש אימות מול מקור' }));

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
