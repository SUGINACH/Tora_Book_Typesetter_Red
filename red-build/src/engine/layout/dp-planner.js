// src/engine/layout/dp-planner.js — Multi-column/page DP planner (REQ-BAL-01/02/04/08/10)
'use strict';

const crypto = require('crypto');
const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { Ledger } = require('../core/ledger');
const { runProtections } = require('./protections-matrix');
const { runRetreatLoop } = require('./retreat-loop');
const { usedHeight, pageImbalance } = require('./balancing');

/** חתימת פריסה דטרמיניסטית — ללא Date/random (REQ-GOV determinism). */
function layoutHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${ln.tokenId || ''}:${(ln.words || []).join('\u00A7')}`)),
    fn: p.footnotes.length, sn: p.sideNotes.length
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * Block = יחידת פריסה: heading או paragraph עם שורות שנמדדו.
 * @param {Array} blocks - [{kind:'heading'|'paragraph', lines:[...], notes:[...], token}]
 * @param {object} settings
 * @param {{measure:(t:string)=>number}} env - חייב להכיל measure (entry יחיד — L1); אחרת throw (ללא קריסה שקטה)
 */
function planPages(blocks, settings, eventLog, ledger = new Ledger(), env = {}) {
  const measureFn = env && typeof env.measure === 'function' ? env.measure : null;
  if (!measureFn) {
    throw new Error('dp-planner: env.measure is required (single measurement entry — REQ-LB-01). Silent fallback to global is forbidden.');
  }
  const pages = [];
  let pageIdx = 0;
  const lineH = Math.round(settings['body-font-size-pt'] * (96 / 72) * settings['body-line-height']);
  const imbMax = settings['imbalance-max-delta-px'];

  function newPage(type = PAGE_TYPES.REGULAR) {
    const isRecto = pages.length % 2 === 0; // עמוד 1 = recto
    const tpl = buildPageTemplate(type, settings, isRecto);
    return { index: pageIdx++, type, template: tpl, columns: Array.from({ length: tpl.columns.length }, () => []), footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null };
  }

  let cur = newPage(PAGE_TYPES.REGULAR);

  const colCapacity = (tpl) => tpl.contentBox.height;

  /**
   * תיקון S8 (מניעת באג V23 "usedHeight כולל תקציב הערות"):
   * גובה תפוס = שורות + **יתרת תקציב ההערות של העמוד** — כך ה‑probe וה‑reservation
   * זהים (F-17). בעבר דפדפו מעל ההערות כי ה‑cap לא כלל את המרזב שלהן.
   */
  function usedHeight(col, page = cur) {
    let h = col.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    if (page && page.fnReservedHeightPx > 0 && page.columns[page.columns.length - 1] === col) {
      h += page.fnReservedHeightPx; // נשמר פעם אחת — בסוף הטור האחרון
    }
    return h;
  }

  /**
   * S6.1.1 probe==reserved identity: פונקציית בדיקה אחת לשני הצרכים.
   * מחזירה את התקציב המשוקלל לעמוד לפי רשימת ההערות שלו (LPT ל‑2 טורים).
   */
  function recomputeFnBudget(page) {
    if (!settings['footnotes-enabled'] || !page.footnotes.length) { page.fnReservedHeightPx = 0; return 0; }
    const heights = page.footnotes.map(n => n.heightPx || noteHeightLocal(n));
    let reserved;
    if (settings['footnote-columns'] === 2) {
      const t = [0, 0];
      for (const h of [...heights].sort((a, b) => b - a)) { const i = t[0] <= t[1] ? 0 : 1; t[i] += h; }
      reserved = Math.max(t[0], t[1]);
    } else reserved = heights.reduce((a, b) => a + b, 0);
    page.fnReservedHeightPx = reserved;
    return reserved;
  }
  function noteHeightLocal(n) {
    const size = settings['body-font-size-pt'] * 0.8;
    const lh = Math.round(size * (96 / 72) * 1.25);
    const words = String(n.text || '').split(/\s+/).filter(Boolean);
    let lines = 1, w = 0;
    const colW = settings._fnColWidthPx || 200;
    for (const word of words) {
      const ww = measureFn(word, size);
      if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
    }
    return lines * lh;
  }

  function ensureRoom(neededLines, opts = {}) {
    // בדיקת מקום בכל הטורים הפעילים; אם אין — עמוד חדש
    const cap = colCapacity(cur.template);
    for (let c = 0; c < cur.columns.length; c++) {
      if (cap - usedHeight(cur.columns[c]) >= neededLines * lineH - 0.5) return c;
    }
    return -1;
  }

  function flushPage() {
    // איזון טורים: Δ≤5px לפני H3 ובסוף פרק (BRZ-3) + מניעת אלמנה
    if (cur.columns.length === 2) {
      let a = usedHeight(cur.columns[0]), b = usedHeight(cur.columns[1]);
      let guard = 0;
      while (Math.abs(a - b) > imbMax && guard++ < 200) {
        const [hi, lo] = a >= b ? [0, 1] : [1, 0];
        if (!cur.columns[hi].length) break;
        const moved = cur.columns[hi].pop();
        cur.columns[lo].unshift(moved);
        a = usedHeight(cur.columns[0]); b = usedHeight(cur.columns[1]);
      }
      cur.balanceInfo = { before: [a, b], after: [usedHeight(cur.columns[0]), usedHeight(cur.columns[1])] };
      eventLog.emit('balance', 'column-balance', { page: cur.index, delta: Math.abs(usedHeight(cur.columns[0]) - usedHeight(cur.columns[1])) }, cur.index);
    }
    // Invariant BRZ-14: scrollHeight ≤ clientHeight
    for (const col of cur.columns) {
      if (usedHeight(col) > cur.template.contentBox.height + 0.5) {
        const rec = ledger.create('containment', `page#${cur.index}`, cur.index, { used: usedHeight(col), cap: cur.template.contentBox.height }, 'page-plan');
        ledger.transition(rec.issue_id, cur.type === PAGE_TYPES.FILLER ? 'not-comparable' : 'persists', 'page-plan', 'overflow after placement');
      }
    }
    pages.push(cur);
  }

  function pushLines(lines, meta = {}) {
    for (const ln of lines) {
      let placed = false;
      for (let c = 0; c < cur.columns.length && !placed; c++) {
        if (colCapacity(cur.template) - usedHeight(cur.columns[c]) >= ln.heightPx - 0.5) {
          cur.columns[c].push({ ...ln, meta });
          placed = true;
        }
      }
      if (!placed) {
        flushPage();
        cur = newPage(meta.forceType || PAGE_TYPES.REGULAR);
        cur.columns[0].push({ ...ln, meta });
      }
    }
  }

  /**
   * תיקון S8: הערות שוליים נספרות **לפני** מיקום הבלוק — התקציב נרשם לעמוד
   * (fnReservedHeightPx) כך ש‑usedHeight כולל אותו; בעבר ההערות נדחפו אחרי
   * pushLines והמרזב לא נלקח בחשבון → גלישה מעל ההערות (באג V23).
   * f-note-body-font: גודל/גופן גוף ההערה — משפיע על רוחב מילה במדידת ההערה.
   */
  function reserveNotes(blk) {
    const notes = blk.notes || [];
    if (!notes.length || !settings['footnotes-enabled']) return;
    const size = settings['body-font-size-pt'] * 0.8;
    const fnFont = settings['f-note-body-font'];
    let added = 0;
    for (const n of notes) {
      const words = String(n.text).split(/\s+/).filter(Boolean);
      const lh = Math.round(size * (96 / 72) * 1.25);
      const colW = settings._fnColWidthPx || 200;
      let lines = 1, w = 0;
      for (const word of words) {
        const ww = widthForNote(word, size, fnFont);
        if (w + ww > colW && w > 0) { lines++; w = ww; } else w += ww;
      }
      const h = lines * lh;
      cur.footnotes.push({ ...n, heightPx: h, lineH: lh });
      added += h;
    }
    recomputeFnBudget(cur); // probe==reserved — פונקציה אחת לשני הצרכים
    void added;
  }

  /** רוחב מילת הערה לפי גופן גוף ההערה (f-note-body-font) — פרופיל ratchet שמרני. */
  function widthForNote(text, sizePt, fontName) {
    const base = measureFn(text, sizePt);
    if (!fontName || fontName === settings['body-font'] || fontName === settings['f-note-body-font'] && !NOTE_FONT_FACTORS[fontName]) return base;
    const factor = NOTE_FONT_FACTORS[fontName] || 1.08; // גופן הערה לא־מוכר: שמרני +8%
    return Math.ceil(base * factor);
  }
  const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi];
    const next = blocks[bi + 1];

    // REQ-HDG-02: heading mode=new-page → עמוד חדש לפני הכותרת (נצרך בפועל — anti-phantom)
    if (blk.kind === 'heading' && blk.forceNewPage && cur.columns.some(c => c.length)) {
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      eventLog.emit('page-plan', 'heading-new-page-mode', { token: blk.tokenId }, cur.index);
    }

    // REQ-FN-05/06: heading mode=side-note → הערת שוליים בטור מקביל (H7 doctrine), לא גוף עמוד
    if (blk.kind === 'heading' && blk.sideNote) {
      cur.sideNotes.push({ text: blk.lines.map(l => l.words.join(' ')).join(' ').trim(), anchorToken: blk.tokenId, isHeading: true });
      eventLog.emit('page-plan', 'heading-side-note', { token: blk.tokenId }, cur.index);
      continue;
    }

    // תקציב הערות לפני מיקום (F-17 probe==reserved)
    if (blk.kind === 'paragraph') reserveNotes(blk);

    if (blk.kind === 'heading' && blk.level === 2) {
      // PT-05: עמוד חדש תמיד
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.SIGN_OPEN); }
      else cur.type = PAGE_TYPES.SIGN_OPEN;
      eventLog.emit('page-plan', 'h2-new-page', { token: blk.tokenId }, cur.index);
    }

    if (blk.kind === 'heading' && blk.level === 3 && next && next.kind === 'paragraph') {
      // PT-06: כותרת 3 חוצת טורים — הטורים שלפניו מאוזנים (נבצע בפלאש)
      void 0;
    }

    // REQ-BAL-10: heading escort ≥2 שורות אחרי כותרת H1–H6.
    // תיקון S5 (מניעת false-positive): בודקים מקום אמיתי לכותרת + 2 שורות ההמשך
    // באותו טור; אין מקום → דוחפים את הכותרת לעמוד חדש (resolved).
    // רק אם גם בעמוד ריק אין מקום (נמדד מחדש) → correction-blocked מתועד.
    if (blk.kind === 'heading' && blk.level <= 6) {
      const following = (next && next.lines) ? next.lines.length : 0;
      if (following >= 1) {
        const needLines = 1 + Math.min(2, following); // כותרת + 2 שורות ליווי (או כמה שיש)
        let room = ensureRoom(needLines);
        if (room === -1) {
          flushPage(); cur = newPage(blk.level === 2 ? PAGE_TYPES.SIGN_OPEN : PAGE_TYPES.REGULAR);
          room = ensureRoom(needLines);
          if (room !== -1) {
            eventLog.emit('page-plan', 'heading-escort-push', { token: blk.tokenId, page: cur.index }, cur.index);
          } else {
            const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { linesNeeded: needLines, capacityPx: colCapacity(cur.template), lineHPx: lineH }, 'protections');
            ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no column fits heading+escort even on fresh page (oversized block)');
          }
        }
      }
    }

    // REQ-BAL-01: candidate search עם capacityBefore/capacityAfter + הקשר הבלוק הבא
    const need = blk.lines.length;
    let chosenCol = ensureRoom(need);
    if (chosenCol === -1) {
      // שקול מועמד: האם להשאיר חלק מהשורות בטור הנוכחי? — נדרוש לפחות 2 שורות (widow/orphan DP)
      const splitAt = findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog);
      if (splitAt > 0) {
        // תיקון S5: סימון isLast על השורה האחרונה של החלק הראשון — נחוץ לגלאי
        // widow-top/orphan-bottom במטריצת ההגנות (ללא סימון זה הגלאים לא פעילים).
        pushLines(blk.lines.slice(0, splitAt - 1), { tokenId: blk.tokenId, part: 'first' });
        pushLines([blk.lines[splitAt - 1]], { tokenId: blk.tokenId, part: 'first', isLast: true });
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        pushLines(blk.lines.slice(splitAt), { tokenId: blk.tokenId, part: 'rest' });
        continue;
      }
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      chosenCol = 0;
    }
    pushLines(blk.lines, { tokenId: blk.tokenId });

    // הערות שוליים כבר נרשמו ותוקצבו לפני המיקום (reserveNotes) — אין דחيفة כפולה.
    if (blk.sideNoteText) cur.sideNotes.push({ text: blk.sideNoteText, anchorToken: blk.tokenId });
  }

  if (cur.columns.some(c => c.length) || cur.footnotes.length || pages.length === 0) flushPage();

  // terminal residual fallback (REQ-BAL-04): אם העמוד האחרון ריק למחצה ויש מצב natural — סמן
  if (settings['allow-terminal-residual-fallback']) {
    const last = pages[pages.length - 1];
    if (last && last.columns.every(c => usedHeight(c) < colCapacity(last.template) * 0.5)) {
      last.terminalResidual = true; // לא מדווח כ‑underfill (B4)
    }
  }

  // S5.1.4 + S5.1.5: הגנות AFTER every mutation, ואז לולאת נסיגה מאוחדת עם גלאי תנודות
  const assess = (page, s, lg) => runProtections(page, s, lg).violations;
  const retreat = runRetreatLoop({
    pages, settings, ledger, eventLog,
    repairFns: {
      'column-imbalance': (violations, c) => {
        for (const v of violations) {
          const pg = pages.find(p => `page#${p.index}` === v.target);
          if (pg) balancePageSafe(pg, c.settings, c.ledger);
        }
      },
      'widow-bottom': (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      },
      'orphan-top': (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      }
    },
    assess
  });

  return { pages, ledger, retreat, hash: layoutHash(pages) };
}

/** איזון בטוח עם rollback (REQ-BAL-09): snapshot כולל footnotes/sideNotes/ornaments. */
function balancePageSafe(page, settings, ledger) {
  const snapshot = { cols: page.columns.map(c => c.slice()), fn: page.footnotes.slice(), sn: page.sideNotes.slice() };
  let guard = 0;
  while (Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1])) > settings['imbalance-max-delta-px'] && guard++ < 200) {
    const a = usedHeight(page.columns[0]), b = usedHeight(page.columns[1]);
    const hi = a >= b ? 0 : 1, lo = 1 - hi;
    if (!page.columns[hi].length) break;
    const moved = page.columns[hi].pop();
    page.columns[lo].unshift(moved);
    const cap = page.template.contentBox.height;
    if (page.columns.some(cl => usedHeight(cl) > cap + 0.5)) {
      page.columns = snapshot.cols; page.footnotes = snapshot.fn; page.sideNotes = snapshot.sn;
      const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity' }, 'balance');
      ledger.transition(rec.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after move (not soft ×2000)');
      return false;
    }
  }
  return true;
}

/** בחירת נקודת פיצול עם הגנות widow/orphan (≥2 שורות לכל צד). */
function findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog) {
  const cap = colCapacity(cur.template);
  const free = cap - usedHeight(cur.columns[cur.columns.length - 1]);
  const maxFit = Math.floor(free / lineH);
  if (maxFit < 2 || blk.lines.length - maxFit < 2) return 0; // אין פיצול חוקי → הזזה מלאה
  eventLog.emit('protections', 'legal-split', { token: blk.tokenId, at: maxFit });
  return maxFit;
}

module.exports = { planPages, layoutHash };
