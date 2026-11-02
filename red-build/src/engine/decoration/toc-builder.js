// src/engine/decoration/toc-builder.js — TOC general/detail pages, groups, dots, anchors (REQ-HDR-05, S9)
'use strict';

/**
 * **S9 (D-62) — עמודי תוכן־העניינים אמיתיים.** עד S8 נבנו רשומות בלבד (r.toc) בלי
 * עמודים; בכל הגרסאות הישנות ה‑TOC נבנה ב‑DOM לאחר העימוד (renderPaginatedTOC של IMUD)
 * וסבל מגלישות/תליה (F: "TOC hanging" — שורת קטלוג שתקעה את העימוד).
 *
 * מודל: (1) buildTocModel — רשומות לפי רמות + קיבוץ inline רצוף לשורת־קבוצה אחת
 * (IMUD buildStructuredTOC); (2) buildTocPages — זרימת שורות לעמודי toc-general/
 * toc-detail אמיתיים במדידה מראש (מדידת רוחב, עטיפת כותרת ארוכה עד 2 שורות, קטיעה
 * מעבר לכך + ממצא toc-overflow); (3) insertTocPages — הכנסה מבנית לפני צילום hash
 * ה‑CP4 (כמו שערי S8) + בניית תבניות מחדש לפי הזוגיות הסופית (D-63 — תיקון חבוי:
 * binding-offset נשאר תלוי בזוגיות קודמת להכנסות); (4) resolveTocTargets — עוגן
 * + תווית גיליון לפי המספור הסופי (תוויות בפורמט הגיליון — REQ-HDR-05).
 *
 * **תקציב איטרציה (stuck guard):** TOC_MAX_ROWS/TOC_MAX_PAGES — חריגה ⇒ ממצא
 * toc-budget-exceeded ועצירה דטרמיניסטית. אף לולאה לא חסרת חסם.
 */

const { PAGE_TYPES, buildPageTemplate } = require('../layout/page-templates');

const TOC_MAX_ROWS = 20000;     // תקציב שורות כולל (general+detail)
const TOC_MAX_PAGES = 500;      // תקציב עמודי TOC כולל
const TOC_MAX_TITLE_LINES = 2;  // כותרת ארוכה: עטיפה עד 2 שורות; מעבר ⇒ קטיעה + ממצא
const DOTS_MIN_PX = 24;         // שטח מינימלי לנקודות מובילות
const LABEL_RESERVE_PX = 48;    // שמורת רוחב לתווית גיליון (נפתרת אחרי המספור)
const ROW_GAP_PX = 4;
const TITLE_SIZE_PT = 16;
const TITLE_MARGIN_PX = 24;

/** גודל גופן לרמה (ברירות מחדל V1/V2: gtoc 12/11/10.5/8.8 — D-62). */
function levelSizePt(level) {
  if (level <= 1) return 12;
  if (level === 2) return 11;
  if (level <= 6) return 10.5;
  return 8.8; // H7 — שורות צד
}
function levelIndentPx(level) {
  return (Math.max(1, Math.min(7, level)) - 1) * 16;
}

/** עטיפת כותרת: שורות מילים עד ‏2; מעבר ⇒ קטיעה בסימון '…'. מילה בודדת רחבה
 *  מהשורה אינה ניתנת לעטיפה — מסומנת truncated (הממצא נרשם ב‑rowHeightOf). */
function wrapTitle(text, availPx, sizePt, measure) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  let truncated = false;
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const addW = measure(w, sizePt) + (cur.length ? measure(' ', sizePt) : 0);
    if (cur.length && curW + addW > availPx) {
      lines.push(cur.join(' '));
      cur = [w]; curW = measure(w, sizePt);
      if (lines.length >= TOC_MAX_TITLE_LINES) { truncated = true; break; } // שאר המילים נקצצות
    } else { cur.push(w); curW += addW; }
  }
  if (lines.length < TOC_MAX_TITLE_LINES && cur.length) lines.push(cur.join(' '));
  else if (cur.length) truncated = true; // נותרו מילים שלא נכנסו לתקציב השורות
  // מילה בודדת רחבה מהשורה — אינה עטיפה אפשרית:
  if (!truncated && lines.some(l => measure(l, sizePt) > availPx + 0.5)) truncated = true;
  if (truncated && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1] + ' …';
  }
  return { lines, truncated, full: !truncated };
}

/**
 * מודל TOC מרשימת כותרות. inline רצוף ⇒ שורת קבוצה אחת (group).
 * @param {Array} headings - [{level, text, tokenId, pageRef}]
 */
function buildTocModel(headings, settings) {
  const rows = [];
  let pendingGroup = null;
  const flushGroup = () => { if (pendingGroup && pendingGroup.items.length) { rows.push(pendingGroup); } pendingGroup = null; };
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const entry = {
      kind: 'entry', level: h.level, text: h.text,
      tokenId: h.tokenId, pageRef: h.pageRef,
      anchorId: `heading-tok-${h.tokenId}`,
      targetPage: null, label: '', rowNum: null, inline: false,
    };
    if (settings[`toc-level-${h.level}-inline`] === true) {
      entry.inline = true;
      (pendingGroup = pendingGroup || { kind: 'group', items: [], level: h.level }).items.push(entry);
    } else {
      flushGroup();
      rows.push(entry);
    }
  }
  flushGroup();
  return { rows };
}

/** מספור שורות (count-numbering): מספר סידורי לכל רשומה בעלת שורה משלה. */
function numberRows(rows, enabled) {
  if (!enabled) return;
  let n = 0;
  for (const r of rows) {
    if (r.kind === 'entry') r.rowNum = ++n;
    else for (const it of r.items) it.rowNum = ++n;
  }
}

/**
 * בניית עמודי TOC עצמם (זרימת שורות במדידה מראש — ללא DOM, ללא scrollHeight).
 * @param {object} model - תוצר buildTocModel
 * @param {string} pageType - 'toc-general' | 'toc-detail'
 * @param {string} title
 * @param {object} settings
 * @param {Function} measure - (text, sizePt?) => px
 * @param {Function} lineHeight - (sizePt?) => px
 * @param {object} io - { ledger, eventLog }
 */
function buildTocPages(model, pageType, title, settings, measure, lineHeight, io = {}) {
  const { ledger, eventLog } = io;
  const pages = [];
  const overflowFindings = [];
  let rowsConsumed = 0;
  let budgetExceeded = false;

  const mkPage = (isFirst) => {
    const tpl = buildPageTemplate(pageType, settings, (pages.length % 2) === 0);
    const pg = {
      index: -1, type: pageType, template: tpl,
      columns: Array.from({ length: tpl.columns.length }, () => []),
      footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
      fnReservedHeightPx: 0, chapterOpening: false,
      toc: { title: isFirst ? title : '', rows: [], isFirst },
    };
    pages.push(pg);
    return pg;
  };

  const rowHeightOf = (r) => {
    if (r.kind === 'group') {
      // קבוצה: שורה אחת רציפה — גובה לפי הגודל המקסימלי בקבוצה + הפרש
      const size = Math.max(...r.items.map(it => levelSizePt(it.level)));
      const text = r.items.map(it => it.text).join(' | ');
      const avail = Math.max(60, tplWidth() - levelIndentPx(r.items[0].level) - LABEL_RESERVE_PX - DOTS_MIN_PX);
      const { lines } = wrapTitle(text, avail, size, measure);
      r.wrapped = lines;
      return { h: lines.length * lineHeight(size) + ROW_GAP_PX, lines: 1, size };
    }
    const size = levelSizePt(r.level);
    const avail = Math.max(60, tplWidth() - levelIndentPx(r.level) - LABEL_RESERVE_PX - DOTS_MIN_PX);
    const { lines, truncated } = wrapTitle(r.text, avail, size, measure);
    r.wrapped = lines;
    if (truncated) {
      overflowFindings.push({ why: 'title-truncated', text: r.text.slice(0, 40), level: r.level });
    }
    return { h: lines.length * lineHeight(size) + ROW_GAP_PX, lines: lines.length, size };
  };

  let tplW = 0;
  const tplWidth = () => tplW;

  if (!model.rows.length) return { pages: [], overflow: overflowFindings, budgetExceeded };

  let cur = mkPage(true);
  tplW = cur.template.contentBox
    ? (cur.template.contentBox.right - cur.template.contentBox.left) || cur.template.width
    : cur.template.width;
  let availH = cur.template.contentBox.height - (TITLE_SIZE_PT * (96 / 72) + TITLE_MARGIN_PX);
  let usedH = 0;

  for (const r of model.rows) {
    if (budgetExceeded) break;
    rowsConsumed++;
    if (rowsConsumed > TOC_MAX_ROWS || pages.length > TOC_MAX_PAGES) {
      budgetExceeded = true;
      break;
    }
    const { h } = rowHeightOf(r);
    if (usedH + h > availH && cur.toc.rows.length) {
      if (pages.length >= TOC_MAX_PAGES) { budgetExceeded = true; break; }
      cur = mkPage(false);
      availH = cur.template.contentBox.height;
      usedH = 0;
    }
    // שורה בודדת גבוהה מעמוד שלם ⇒ אל תיתלה: הנח אותה ותעד (אין לולאה — usedH מתקדם תמיד)
    if (h > availH) {
      overflowFindings.push({ why: 'row-taller-than-page', level: r.level || (r.items && r.items[0].level) });
    }
    cur.toc.rows.push(r);
    usedH += Math.min(h, availH);
  }

  if (budgetExceeded && ledger) {
    const rec = ledger.create('toc-budget-exceeded', pageType, null,
      { rowsConsumed, pages: pages.length, maxRows: TOC_MAX_ROWS, maxPages: TOC_MAX_PAGES }, 'toc');
    ledger.transition(rec.issue_id, 'persists', 'toc', 'TOC iteration budget exceeded — deterministic stop (stuck guard)');
  }
  if (overflowFindings.length && ledger) {
    for (const o of overflowFindings) {
      const rec = ledger.create('toc-overflow', pageType, null, o, 'toc');
      ledger.transition(rec.issue_id, 'persists', 'toc', `TOC overflow (${o.why})`);
    }
  }
  if (eventLog) {
    eventLog.emit('toc', 'toc-pages-built', { type: pageType, pages: pages.length, rows: rowsConsumed, overflow: overflowFindings.length, budgetExceeded });
  }
  return { pages, overflow: overflowFindings, budgetExceeded };
}

/**
 * הכנסת עמודי TOC לרצף: אחרי הרצף המבני הפותח (שער ראשי/עמודים מותאמים בראש),
 * לפני כל דבר אחר. לאחר ההכנסה: אינדוקס מחדש + בניית תבניות לפי הזוגיות הסופית
 * (**D-63 — תיקון חבוי:** binding-offset חושב לפי אינדקס לפני הכנסות; כל הכנסה
 * משנה זוגיות והשאירה שוליים הפוכים. חל גם על שערי S8 שהוכנסו קודם).
 * כאשר binding≠0 וזוגיות עמוד השתנתה — השורות נמדדו לרוחב הישן; גלישה אפשרית
 * נבדקת ונרשמת כממצא binding-parity-shift (לא מוסתר).
 */
function insertTocPages(pages, tocPages, settings, io = {}) {
  if (!tocPages.length) return { pages, inserted: 0, at: 0 };
  // רצף פותח מבני: שער ראשי / עמודים מותאמים שהוצבו בראש
  let at = 0;
  while (at < pages.length && (pages[at].isShaar || pages[at].type === 'custom')) at++;
  const out = pages.slice(0, at).concat(tocPages, pages.slice(at));
  out.forEach((p, i) => { p.index = i; });
  // בניית תבניות מחדש לפי הזוגיות הסופית (D-63) — אותו סוג, אותן הגדרות, זוגיות נכונה
  const binding = settings['binding-offset-px'] || 0;
  const parityShifted = [];
  for (const p of out) {
    const newIsRecto = p.index % 2 === 0;
    const shifted = binding !== 0 && p.isRecto !== undefined && p.isRecto !== newIsRecto;
    p.template = buildPageTemplate(p.type, settings, newIsRecto);
    p.isRecto = newIsRecto;
    if (shifted) parityShifted.push(p);
  }
  // גלישה מטופלת בכנות: שורה שנמדדה לטור רחב וכעת צר יותר ⇒ ממצא (לא השתקה)
  if (parityShifted.length && io.ledger) {
    let overflowCount = 0;
    for (const p of parityShifted) {
      p.columns.forEach((col, ci) => {
        const cw = p.template.columns[ci] ? p.template.columns[ci].w : Infinity;
        for (const ln of col) {
          if ((ln.widthPx || 0) > cw + 0.5) overflowCount++;
        }
      });
    }
    if (overflowCount) {
      const rec = io.ledger.create('binding-parity-shift', 'toc-insertion', null,
        { pages: parityShifted.length, overflowLines: overflowCount, binding }, 'toc');
      io.ledger.transition(rec.issue_id, 'persists', 'toc',
        `binding≠0 + parity flip: ${overflowCount} line(s) exceed narrowed column after template rebuild`);
    }
    if (io.eventLog) io.eventLog.emit('toc', 'binding-parity-rebuild', { pages: parityShifted.length, overflowLines: overflowCount });
  }
  return { pages: out, inserted: tocPages.length, at };
}

/** פענוח עוגנים + תוויות לפי המספור הסופי (מופעל אחרי assignNumbers). */
function resolveTocTargets(pages, tocPages, numbers, settings, { formatLabel }) {
  let resolved = 0;
  for (const tp of tocPages) {
    for (const r of tp.toc.rows) {
      const entries = r.kind === 'group' ? r.items : [r];
      for (const e of entries) {
        e.targetPage = e.pageRef ? e.pageRef.index : null;
        const n = e.targetPage != null ? numbers[e.targetPage] : null;
        e.label = n && n.counted && n.page != null ? formatLabel(n.page) : '';
        resolved++;
      }
    }
  }
  return { resolved };
}

/**
 * רשומות TOC "ישנות" (תאימות לאחור — r.toc של ≤S8): כללי רמות 1–2, מפורט הכל.
 */
function buildTocEntries(headings, settings, numbersByIndex) {
  const entries = [];
  let numbered = 0;
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const idx = h.pageRef ? h.pageRef.index : h.page;
    const num = numbersByIndex ? numbersByIndex[idx] : null;
    numbered++;
    entries.push({
      level: h.level,
      text: h.text,
      pageLabel: num && num.display ? num.display : '',
      rowNum: settings['general-toc-count-numbering'] ? numbered : null,
      inline: !!settings[`toc-level-${h.level}-inline`],
      targetPage: idx,
      leaderDots: true,
    });
  }
  return entries;
}

function splitGeneralDetail(entries, settings = {}) {
  const genOn = settings['toc-general-enabled'] !== false;
  const detOn = settings['toc-detail-enabled'] === true;
  return {
    generalEnabled: genOn,
    detailEnabled: detOn,
    general: genOn ? entries.filter(e => e.level <= 2) : [],
    detail: detOn ? entries : [],
  };
}

module.exports = {
  buildTocModel, numberRows, buildTocPages, insertTocPages, resolveTocTargets,
  buildTocEntries, splitGeneralDetail, wrapTitle, levelSizePt, levelIndentPx,
  TOC_MAX_ROWS, TOC_MAX_PAGES, TOC_MAX_TITLE_LINES,
};
