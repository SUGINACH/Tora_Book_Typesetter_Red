// src/ui/preview-tab.js — לשונית התצוגה (REQ-UI-05/06: גלילה, זום, קפיצה, סנכרון, ⏬ דיבאג)
'use strict';

/**
 * קנבס כהה מאחורי העמודים (S10.1-8 — ריהוט מקצועי). העמודים עצמם נבנים
 * ע"י dom-renderer.renderPage — מקור יחיד; ה־UI רק עוטף (כפתור ⏬ לכל עמוד —
 * בקשת V21; highlightIssue — כלל 2 Working_rules).
 */

const { renderPage } = require('../engine/output/dom-renderer');

/** פענוח מספר עברי (גימטריה) — עבור "קפיצה לפי מספר עברי". */
const GEMATRIA = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60,
  'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
function parseHebrewNumber(s) {
  const t = String(s || '').replace(/[׳״'"’]/g, '').trim();
  if (!t) return null;
  let total = 0, sum = 0; // אלפים (ה׳) נפרדים מהשארית — כלל D-31
  for (const ch of t) {
    if (ch === 'ה' && total === 0 && sum === 0 && t.length > 1 && t[0] === 'ה') { total = 5000; continue; }
    const v = GEMATRIA[ch];
    if (v == null) return null;
    sum += v;
  }
  const n = (total || 0) + sum;
  return n >= 1 ? n : null;
}

function buildPreviewTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'preview';

  // ---- סרגל כלים ----
  const bar = doc.createElement('div');
  bar.className = 'preview-bar';

  const scrollMode = doc.createElement('button');
  scrollMode.type = 'button'; scrollMode.className = 'btn btn--toggle';
  scrollMode.textContent = '↕ גלילה אנכית';
  scrollMode.setAttribute('aria-label', 'החלף מצב גלילה (אנכית/אופקית)');
  let horizontal = false;
  scrollMode.addEventListener('click', () => {
    horizontal = !horizontal;
    canvas.classList.toggle('canvas--horizontal', horizontal);
    scrollMode.textContent = horizontal ? '↔ גלילה אופקית' : '↕ גלילה אנכית';
  });

  const zoomOut = doc.createElement('button');
  zoomOut.type = 'button'; zoomOut.className = 'btn btn--icon'; zoomOut.textContent = '➖';
  zoomOut.setAttribute('aria-label', 'הקטן תצוגה');
  const zoomPct = doc.createElement('span');
  zoomPct.className = 'zoom-pct'; zoomPct.textContent = '100%';
  const zoomIn = doc.createElement('button');
  zoomIn.type = 'button'; zoomIn.className = 'btn btn--icon'; zoomIn.textContent = '➕';
  zoomIn.setAttribute('aria-label', 'הגדל תצוגה');
  const zoomFit = doc.createElement('button');
  zoomFit.type = 'button'; zoomFit.className = 'btn'; zoomFit.textContent = '⟷ התאם לרוחב';
  zoomFit.setAttribute('aria-label', 'התאם תצוגה לרוחב החלון');

  const jumpInput = doc.createElement('input');
  jumpInput.setAttribute('type', 'text');
  jumpInput.setAttribute('placeholder', 'דף… (א, כ״ב)');
  jumpInput.setAttribute('aria-label', 'קפיצה לעמוד לפי מספר עברי');
  jumpInput.className = 'jump-input';
  const jumpBtn = doc.createElement('button');
  jumpBtn.type = 'button'; jumpBtn.className = 'btn'; jumpBtn.textContent = '➜ עבור';
  jumpBtn.setAttribute('aria-label', 'עבור לעמוד');

  const pageIndicator = doc.createElement('span');
  pageIndicator.className = 'page-indicator';
  pageIndicator.setAttribute('aria-live', 'polite');
  pageIndicator.textContent = 'אין עמודים';

  bar.appendChild(scrollMode); bar.appendChild(zoomOut); bar.appendChild(zoomPct); bar.appendChild(zoomIn); bar.appendChild(zoomFit);
  bar.appendChild(jumpInput); bar.appendChild(jumpBtn); bar.appendChild(pageIndicator);
  root.appendChild(bar);

  // ---- קנבס העמודים (רקע כהה) ----
  const canvas = doc.createElement('div');
  canvas.className = 'preview-canvas';
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'תצוגה מקדימה של העמודים');
  root.appendChild(canvas);

  let zoom = 100;
  let pageEls = new Map(); // pageIndex → element
  let lastResult = null;
  let lastScrollTarget = null;

  // קישורי TOC (#page-N) — סנכרון לחיצה (REQ-UI-05: "TOC click sync").
  // רישום חד־פעמי מחוץ ל־setResult — אין הצטברות מאזינים.
  canvas.addEventListener('click', (ev) => {
    let n = ev && ev.target;
    while (n && n !== canvas) {
      const href = n.getAttribute && n.getAttribute('href');
      if (href && href.startsWith('#page-')) {
        if (ev.preventDefault) ev.preventDefault();
        const idx = Number(href.slice(6));
        if (Number.isFinite(idx)) { lastScrollTarget = idx; opts.onActivatePage && opts.onActivatePage(idx); }
        return;
      }
      n = n.parentNode;
    }
  });

  function setZoom(pct) {
    zoom = Math.max(25, Math.min(400, Math.round(pct)));
    zoomPct.textContent = `${zoom}%`;
    canvas.dataset.zoom = String(zoom);
    if (canvas.dataset) canvas.dataset.fit = '';
  }
  zoomOut.addEventListener('click', () => setZoom(zoom - 10));
  zoomIn.addEventListener('click', () => setZoom(zoom + 10));
  zoomFit.addEventListener('click', () => setZoomFit());
  function setZoomFit() { canvas.dataset.fit = 'width'; zoomPct.textContent = 'רוחב'; }
  // Ctrl+wheel = זום (REQ-UI-05)
  canvas.addEventListener('wheel', (ev) => {
    if (ev && ev.ctrlKey) {
      if (ev.preventDefault) ev.preventDefault();
      setZoom(zoom + (ev.deltaY < 0 ? 10 : -10));
    }
  });

  // ---- ניהול עמודים ----
  function setResult(serializedResult, settings) {
    lastResult = serializedResult;
    canvas.textContent = '';
    pageEls = new Map();
    for (const page of serializedResult.pages) {
      const el = renderPage(page, settings, doc);
      el.classList.add('preview-page');
      // כפתור דיבאג פר־עמוד (V21): גיאומטריה + פרוסת ledger — בלי לגעת ברינדור
      const dbg = doc.createElement('button');
      dbg.type = 'button'; dbg.className = 'page-debug-btn'; dbg.textContent = '⏬';
      dbg.title = 'הורד פרטי עמוד (JSON)';
      dbg.setAttribute('aria-label', `הורד פרטי עמוד ${page.index + 1}`);
      dbg.addEventListener('click', (ev) => {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        opts.onDebugDownload && opts.onDebugDownload(page.index);
      });
      el.appendChild(dbg);
      // לחיצה על עמוד = גלילה אליו + סנכרון סמן (REQ-UI-05)
      el.addEventListener('click', () => {
        lastScrollTarget = page.index;
        pageIndicator.textContent = `עמוד ${page.index + 1} מתוך ${serializedResult.pages.length}`;
        opts.onActivatePage && opts.onActivatePage(page.index);
      });
      canvas.appendChild(el);
      pageEls.set(page.index, el);
    }
    pageIndicator.textContent = serializedResult.pages.length
      ? `עמוד 1 מתוך ${serializedResult.pages.length}` : 'אין עמודים';
    setZoom(100);
  }

  function scrollToPage(pageIndex) {
    lastScrollTarget = pageIndex;
    const el = pageEls.get(pageIndex);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
    if (lastResult) pageIndicator.textContent = `עמוד ${pageIndex + 1} מתוך ${lastResult.pages.length}`;
  }

  // קפיצה לפי מספר עברי — שקוף לפורמט המספור שנבחר (hebrew/daf-hebrew)
  function jumpByHebrew(text) {
    const n = parseHebrewNumber(text);
    if (n == null) { pageIndicator.textContent = 'מספר עברי לא תקין'; return null; }
    const idx = n - 1;
    if (!lastResult || idx < 0 || idx >= lastResult.pages.length) {
      pageIndicator.textContent = `אין עמוד ${n}`; return null;
    }
    scrollToPage(idx);
    return idx;
  }
  jumpBtn.addEventListener('click', () => jumpByHebrew(jumpInput.value));

  // ---- highlightIssue (כלל 2 — Working_rules) ----
  let highlighted = [];
  function clearHighlights() {
    for (const { el } of highlighted) {
      el.classList.remove('issue-flash');
      el.removeAttribute('data-issue-id');
      if (el.style) { el.style.outline = ''; el.style.outlineOffset = ''; }
    }
    highlighted = [];
  }
  /**
   * הדגשת ממצא: העמוד מסומן באופן נראה (מחלקה + קו מיתאר inline — הוכחת
   * נראות גם בלי CSS חיצוני); אם ב־target מזהה טוקן (t\d+) — גם שורותיו מסומנות.
   */
  function highlightIssue(finding) {
    clearHighlights();
    if (!finding) return;
    const idx = finding.page != null ? Number(finding.page) : null;
    const el = (idx != null && Number.isFinite(idx)) ? pageEls.get(idx) : null;
    if (el) {
      el.classList.add('issue-flash');
      el.setAttribute('data-issue-id', finding.id || '');
      if (el.style) { el.style.outline = '3px solid #e03131'; el.style.outlineOffset = '-3px'; }
      highlighted.push({ el });
    }
    // שורות הטוקן המעורב (אם יסומן במטרה) — סימון פנימי נראה
    const tm = String(finding.target || '').match(/t\d+/);
    if (tm && el) {
      const lines = el.querySelectorAll ? el.querySelectorAll('.line') : [];
      for (const ln of lines) {
        if (ln.dataset && ln.dataset.tokenId === tm[0]) {
          ln.classList.add('issue-flash');
          if (ln.style) ln.style.backgroundColor = 'rgba(224,49,49,.15)';
          highlighted.push({ el: ln });
        }
      }
    }
    if (idx != null && Number.isFinite(idx)) scrollToPage(idx);
  }

  /** סימון יעד סמן (כיוון א׳ של הסנכרון) — הבזק עדין */
  function setCaretHighlight(pageIndex) {
    for (const [, el] of pageEls) el.classList.remove('caret-target');
    const el = pageEls.get(pageIndex);
    if (el) el.classList.add('caret-target');
  }

  return { root, setResult, scrollToPage, jumpByHebrew, highlightIssue, clearHighlights, setCaretHighlight, getZoom: () => zoom, _lastScrollTarget: () => lastScrollTarget };
}

module.exports = { buildPreviewTab, parseHebrewNumber };
