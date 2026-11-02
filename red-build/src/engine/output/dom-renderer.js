// src/engine/output/dom-renderer.js — DOM render (browser) + PUA scrub invariant (REQ-PAR-05, BRZ-13)
'use strict';

/**
 * רנדור עמודים ל‑DOM. כללי יסוד:
 * - U+E000 חייב להיעלם מה‑DOM הסופי (scrub לפני render; נשמר רק לשלב המדידה).
 * - כיווניות RTL מלאה; no !important על inline של עיטורים (F-09 — מקור שליטה יחיד).
 * - מיפוי סוג עמוד → מחלקת CSS: regular/shaar/preface/sign-open/endnotes/toc/filler.
 */

const PT_CLASS = {
  'regular': 'page page--regular',
  'shaar-main': 'page page--shaar page--shaar-main',
  'shaar-sub': 'page page--shaar page--shaar-sub',
  'shaar-back': 'page page--shaar page--shaar-back',
  'preface': 'page page--preface',
  'sign-open': 'page page--sign-open',
  'h3-spread': 'page page--h3-spread',
  'endnotes': 'page page--endnotes',
  'toc-general': 'page page--toc page--toc-general',
  'toc-detail': 'page page--toc page--toc-detail',
  'custom': 'page page--custom',
  'filler': 'page page--filler'
};

const ATOMIC_SPACE = '\uE000';

/** scrub חובה: אף תו PUA פנימי לא יוצא החוצה (BRZ-13 / S2.2). */
function scrubPUAText(s) {
  return String(s).split(ATOMIC_SPACE).join(' ');
}

/** שורה → HTML. מילים צמודות NBSP מוצגות כ‑&#xA0; (נשמר); \uE000 הומר ברווח רגיל. */
function renderLine(ln, doc) {
  const el = doc.createElement('div');
  el.className = 'line' + (ln.isLast ? ' line--last' : '');
  el.setAttribute('dir', 'rtl');
  if (ln.aqStretch && ln.aqStretch !== 1) {
    el.style.wordSpacing = `${(ln.aqStretch - 1) * 4}px`; // AQ word-spacing bounded (REQ-BAL-06)
  }
  const words = (ln.words || []).map(w => scrubPUAText(w.replace(/\u00A0/g, '\u00A0')));
  el.textContent = words.join(' ');
  if (ln.tokenId) el.dataset.token = ln.tokenId;
  return el;
}

function renderFootnoteArea(page, settings, doc) {
  if (!settings['footnotes-enabled'] || !page.footnotes.length) return null;
  const area = doc.createElement('div');
  area.className = `footnotes footnotes--${settings['fn-layout-mode']}`;
  if (settings['footnote-separator-rule'] !== 'none') {
    const rule = doc.createElement('div');
    rule.className = `fn-rule fn-rule--${settings['footnote-separator-rule']}`;
    area.appendChild(rule);
  }
  for (const n of page.footnotes) {
    const el = doc.createElement('div');
    el.className = 'footnote';
    el.dir = 'rtl';
    el.textContent = `${n.marker || ''}\u200F ${scrubPUAText(n.text || n)}`;
    area.appendChild(el);
  }
  return area;
}

function renderHeader(header, doc) {
  if (!header) return null;
  const el = doc.createElement('div');
  el.className = `running-head head--sep-${header.separator}`;
  el.dir = 'rtl';
  for (const pos of ['right', 'center', 'left']) {
    const slot = doc.createElement('span');
    slot.className = `head-slot head-slot--${pos} align-${header[pos].align}`;
    slot.style.width = `${header[pos].widthPct}%`;
    slot.textContent = scrubPUAText(header[pos].text || '');
    el.appendChild(slot);
  }
  return el;
}

/**
 * רנדור עמוד שלם. @param {object} page - תוצר dp-planner + header + numbersByIndex
 */
function renderPage(page, settings, doc, header) {
  const root = doc.createElement('article');
  root.className = PT_CLASS[page.type] || 'page';
  root.dataset.pageIndex = String(page.index);
  root.style.width = `${page.template.width}px`;
  root.style.height = `${page.template.height}px`;
  root.dir = 'rtl';

  const h = renderHeader(header, doc);
  if (h) root.appendChild(h);

  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  page.columns.forEach((colLines, ci) => {
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    colEl.style.left = `${page.template.columns[ci] ? page.template.columns[ci].x : 0}px`;
    colEl.style.width = `${page.template.columns[ci] ? page.template.columns[ci].w : 'auto'}px`;
    for (const ln of colLines) colEl.appendChild(renderLine(ln, doc));
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  const fn = renderFootnoteArea(page, settings, doc);
  if (fn) root.appendChild(fn);

  if (page.folioDisplay && settings['page-num-position'] !== 'none') {
    const folio = doc.createElement('footer');
    folio.className = `folio folio--${settings['page-num-position']} folio--frame-${settings['page-num-frame']}`;
    folio.textContent = page.folioDisplay;
    root.appendChild(folio);
  }

  for (const sn of page.sideNotes || []) {
    const el = doc.createElement('aside');
    el.className = 'side-note';
    el.dataset.anchor = sn.anchorToken || '';
    el.dir = 'rtl';
    el.textContent = scrubPUAText(sn.text);
    root.appendChild(el);
  }
  return root;
}

module.exports = { renderPage, renderLine, scrubPUAText, PT_CLASS };
