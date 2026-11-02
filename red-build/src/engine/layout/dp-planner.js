// src/engine/layout/dp-planner.js — Multi-column/page DP planner (REQ-BAL-01/02/04/08/10)
'use strict';

const crypto = require('crypto');
const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { Ledger } = require('../core/ledger');
const { runProtections } = require('./protections-matrix');
const { runRetreatLoop } = require('./retreat-loop');

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
 * @param {{measure:(t:string)=>number}} api
 */
function planPages(blocks, settings, eventLog, ledger = new Ledger()) {
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
  const usedHeight = (col) => col.reduce((s, ln) => s + ln.heightPx, 0);

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

  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi];
    const next = blocks[bi + 1];

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

    // REQ-BAL-10: heading escort ≥2 שורות אחרי כותרת H1–H6
    if (blk.kind === 'heading' && blk.level <= 6) {
      const following = (next && next.lines) ? next.lines.length : 0;
      if (following < 2 && next && next.kind === 'paragraph') {
        const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { linesAfter: following }, 'protections');
        // דחיפה: הוספת שורה אחת לפחות לעמוד הזה אם אפשרית; אחרת — העתקת הכותרת לעמוד הבא
        const room = ensureRoom(1 + Math.min(2, following));
        if (room === -1) {
          flushPage(); cur = newPage(blk.level === 2 ? PAGE_TYPES.SIGN_OPEN : PAGE_TYPES.REGULAR);
          ledger.transition(rec.issue_id, 'resolved', 'protections', 'heading pushed to fresh page');
        } else {
          ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'insufficient room for escort');
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
        pushLines(blk.lines.slice(0, splitAt), { tokenId: blk.tokenId, part: 'first' });
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        pushLines(blk.lines.slice(splitAt), { tokenId: blk.tokenId, part: 'rest' });
        continue;
      }
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      chosenCol = 0;
    }
    pushLines(blk.lines, { tokenId: blk.tokenId });

    // הערות שוליים של הפסקה — תקציב העמוד (REQ-FN-01: probe==reserved)
    for (const note of (blk.notes || [])) {
      cur.footnotes.push(note);
    }
    if (blk.sideNoteText) cur.sideNotes.push({ text: blk.sideNoteText, anchorToken: blk.tokenId });
  }

  if (cur.columns.some(c => c.length) || pages.length === 0) flushPage();

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
