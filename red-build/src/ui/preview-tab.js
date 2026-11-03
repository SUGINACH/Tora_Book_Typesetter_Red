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

  // **S12 (REQ-EXP-01..04):** סרגל ייצוא — HTML עצמאי / PDF / חבילת ZIP.
  // הפעולות מועברות ל־app-shell (מקור יחיד לטקסט/הגדרות/הרחבות); אין עימוד
  // אוטומטי מהייצוא (F-06) — קריאה בלבד.
  const exportBar = doc.createElement('div');
  exportBar.className = 'export-bar';
  exportBar.setAttribute('role', 'group');
  exportBar.setAttribute('aria-label', 'ייצוא מסמך');
  const mkExport = (id, label, aria) => {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'btn btn--ghost'; b.textContent = label;
    b.setAttribute('aria-label', aria);
    b.addEventListener('click', () => opts.onExport && opts.onExport(id));
    return b;
  };
  exportBar.appendChild(mkExport('html', '🌐 HTML עצמאי', 'ייצוא HTML עצמאי חד־קובץ'));
  exportBar.appendChild(mkExport('pdf', '📄 PDF', 'ייצוא PDF עם טקסט נבחר, סימניות וקישורי תוכן'));
  exportBar.appendChild(mkExport('zip', '🗜 חבילת פרויקט', 'ייצוא חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות)'));

  bar.appendChild(scrollMode); bar.appendChild(zoomOut); bar.appendChild(zoomPct); bar.appendChild(zoomIn); bar.appendChild(zoomFit);
  bar.appendChild(jumpInput); bar.appendChild(jumpBtn); bar.appendChild(pageIndicator);
  bar.appendChild(exportBar);
  root.appendChild(bar);

  // ---- קנבס העמודים (רקע כהה) ----
  const canvas = doc.createElement('div');
  canvas.className = 'preview-canvas';
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', 'תצוגה מקדימה של העמודים');
  root.appendChild(canvas);

  let zoom = 100;
  let pageEls = new Map(); // pageIndex → element (במצב וירטואלי: רק החלון החי)
  let lastResult = null;
  let lastScrollTarget = null;

  // ---- D-84: רינדור מחלונות (virtualization) לספרים ארוכים ----
  // ספר אמת של 1,200+ עמודים = מיליוני צמתי DOM אם מרנדרים הכול — הלשונית
  // קופאת. עד VIRTUAL_THRESHOLD עמודים ההתנהגות הקודמת נשמרת במלואה
  // (רינדור מלא, כל הבדיקות הקיימות עוברות על מסמכים קטנים); מעליו —
  // placeholders בגובה האמיתי ורינדור עצל של חלון סביב הגלילה/היעד.
  const VIRTUAL_THRESHOLD = 60;
  const VIRTUAL_WINDOW = 4; // ריפוד משני צידי הטווח הנראה
  const virtual = { on: false, pages: [], settings: null, rendered: new Set(), phW: 794, phH: 1123 };
  let scrollRaf = null;

  /** בניית אלמנט עמוד אחד (מקור יחיד לרינדור מלא ולווירטואלי) — כולל ⏬ ולחיצה. */
  function buildPageEl(page) {
    const el = renderPage(page, virtual.settings, doc);
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
      pageIndicator.textContent = `עמוד ${page.index + 1} מתוך ${virtual.pages.length || (lastResult && lastResult.pages.length) || 0}`;
      opts.onActivatePage && opts.onActivatePage(page.index);
    });
    return el;
  }

  /** placeholder קל בגובה/רוחב האמיתי של העמוד (מהתבנית — מקור יחיד). */
  function makePlaceholder(i) {
    const ph = doc.createElement('div');
    ph.className = 'preview-page preview-page--placeholder';
    ph.setAttribute('data-page-index', String(i));
    ph.setAttribute('aria-hidden', 'true');
    const page = virtual.pages[i];
    const w = page && page.template && page.template.width || virtual.phW;
    const h = page && page.template && page.template.height || virtual.phH;
    if (ph.style) { ph.style.width = `${w}px`; ph.style.height = `${h}px`; }
    return ph;
  }

  // עזרי DOM עמידים גם ל-shim של הבדיקות (אין insertBefore/removeChild שם —
  // children הוא מערך פשוט; בדפדפן נעשה שימוש ב-API האמיתי).
  function domInsertBefore(parent, ref, el) {
    if (typeof parent.insertBefore === 'function') { parent.insertBefore(el, ref); return; }
    if (Array.isArray(parent.children)) {
      const i = parent.children.indexOf(ref);
      if (i >= 0) { parent.children.splice(i, 0, el); el.parentNode = parent; return; }
    }
    parent.appendChild(el);
  }
  function domRemove(parent, el) {
    if (typeof parent.removeChild === 'function') { parent.removeChild(el); return; }
    if (Array.isArray(parent.children)) {
      const i = parent.children.indexOf(el);
      if (i >= 0) parent.children.splice(i, 1);
    }
  }

  /** רינדור עצל של עמוד i (החלפת placeholder באלמנט החי). */
  function ensureRendered(i) {
    if (pageEls.has(i)) return;
    const el = buildPageEl(virtual.pages[i]);
    const cur = canvas.children[i] || null; // ה-placeholder באותו מקום בסדר
    if (cur && cur.classList && cur.classList.contains && cur.classList.contains('preview-page--placeholder') && cur.parentNode) {
      domInsertBefore(cur.parentNode, cur, el);
      domRemove(cur.parentNode, cur);
    } else if (cur) {
      domInsertBefore(canvas, cur, el);
    } else {
      canvas.appendChild(el);
    }
    pageEls.set(i, el);
    virtual.rendered.add(i);
  }

  /** שחרור עמוד רחוק חזרה ל-placeholder (שמירה על DOM קטן וקבוע). */
  function unrenderPage(i) {
    const el = pageEls.get(i);
    if (!el) return;
    const ph = makePlaceholder(i);
    if (el.parentNode) {
      domInsertBefore(el.parentNode, el, ph);
      domRemove(el.parentNode, el);
    } else {
      canvas.appendChild(ph);
    }
    pageEls.delete(i);
    virtual.rendered.delete(i);
  }

  /** רינדור טווח [lo,hi] ושחרור המרוחקים ממנו (בתוספת ריפוד). */
  function renderWindow(lo, hi) {
    if (!virtual.on) return;
    const n = virtual.pages.length;
    const a = Math.max(0, lo), b = Math.min(n - 1, hi);
    for (let i = a; i <= b; i++) ensureRendered(i);
    for (const i of [...virtual.rendered]) {
      if (i < a - VIRTUAL_WINDOW || i > b + VIRTUAL_WINDOW) unrenderPage(i);
    }
  }

  /** אומדן הטווח הנראה מהגלילה — יחסי (עמיד לזום/מרווחים): scrollTop/scrollHeight × n.
   *  הגולל האמיתי הוא root (.tab-panel עם overflow:auto) — לא ה-canvas. */
  function visibleRange() {
    const n = virtual.pages.length;
    const scroller = (root.scrollHeight || root.clientHeight) ? root : canvas;
    const sh = scroller.scrollHeight, st = scroller.scrollTop, ch = scroller.clientHeight;
    if (!n || !sh || !isFinite(sh) || !isFinite(st) || !isFinite(ch)) return [0, 0];
    const first = Math.max(0, Math.floor((st / sh) * n) - 1);
    const last = Math.min(n - 1, Math.ceil(((st + ch) / sh) * n));
    return [first, last];
  }

  function onVirtualScroll() {
    scrollRaf = null;
    if (!virtual.on) return;
    const [a, b] = visibleRange();
    renderWindow(a, b);
  }
  // D-84: מאזין גלילה על הגורר האמיתי (.tab-panel = root); ה-canvas עצמו אינו גולל.
  // (במצב אופקי ה-canvas גולל אופקית — מאזין כפול, passive, נטול השפעה כשאין גלילה.)
  const onScrollMaybe = () => {
    if (!virtual.on || scrollRaf) return;
    scrollRaf = (typeof requestAnimationFrame === 'function')
      ? requestAnimationFrame(onVirtualScroll)
      : setTimeout(onVirtualScroll, 16);
  };
  root.addEventListener('scroll', onScrollMaybe, { passive: true });
  canvas.addEventListener('scroll', onScrollMaybe, { passive: true });

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
    // **03.11(ג):** הזום בפועל — משתנה CSS שנצרך ע"י .preview-canvas[data-zoom]
    // .preview-page{transform:scale(var(--zoom,1))}. בעבר הוגדר רק המאפיין
    // data-zoom בלי אף כלל שמכפיל — הזום לא עשה דבר בתצוגה.
    if (canvas.style && typeof canvas.style.setProperty === 'function') {
      canvas.style.setProperty('--zoom', String(zoom / 100));
    }
    if (canvas.dataset) canvas.dataset.fit = '';
  }
  zoomOut.addEventListener('click', () => setZoom(zoom - 10));
  zoomIn.addEventListener('click', () => setZoom(zoom + 10));
  zoomFit.addEventListener('click', () => setZoomFit());
  function setZoomFit() {
    canvas.dataset.fit = 'width';
    // **03.11(ג):** התאמה לרוחב בפועל — חישוב מרוחב הגורר (בדפדפן) ומרחב
    // העמוד; בסביבת בדיקות/ה-shim אין מידות — נשאר התווית בלבד (כמו קודם).
    try {
      const avail = (typeof root.clientWidth === 'number' ? root.clientWidth : 0) - 48;
      const pw = virtual.phW || 794;
      if (avail > 0 && pw > 0) {
        setZoom(Math.round((avail / pw) * 100));
        zoomPct.textContent = 'רוחב';
      } else {
        zoomPct.textContent = 'רוחב';
      }
    } catch (e) { zoomPct.textContent = 'רוחב'; }
  }
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
    virtual.on = Array.isArray(serializedResult.pages) && serializedResult.pages.length > VIRTUAL_THRESHOLD;
    virtual.settings = settings;
    virtual.pages = serializedResult.pages || [];
    virtual.rendered = new Set();
    if (!virtual.on) {
      // מסמך קטן — רינדור מלא (ההתנהגות המקורית, ללא שינוי)
      for (const page of virtual.pages) {
        const el = buildPageEl(page);
        canvas.appendChild(el);
        pageEls.set(page.index, el);
      }
    } else {
      // ספר ארוך — placeholders לכולם + חלון חי ראשוני (D-84)
      const t0 = virtual.pages[0] && virtual.pages[0].template;
      virtual.phW = (t0 && t0.width) || 794;
      virtual.phH = (t0 && t0.height) || 1123;
      for (let i = 0; i < virtual.pages.length; i++) {
        const ph = makePlaceholder(i);
        canvas.appendChild(ph);
      }
      renderWindow(0, Math.min(2 * VIRTUAL_WINDOW, virtual.pages.length - 1));
    }
    pageIndicator.textContent = serializedResult.pages.length
      ? `עמוד 1 מתוך ${serializedResult.pages.length}${virtual.on ? ' (תצוגת חלון)' : ''}` : 'אין עמודים';
    setZoom(100);
  }

  function scrollToPage(pageIndex) {
    lastScrollTarget = pageIndex;
    if (virtual.on) renderWindow(pageIndex - VIRTUAL_WINDOW, pageIndex + VIRTUAL_WINDOW); // D-84: רינדור לפני גלילה
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
    if (virtual.on && idx != null && Number.isFinite(idx)) renderWindow(idx - VIRTUAL_WINDOW, idx + VIRTUAL_WINDOW); // D-84
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
    if (virtual.on) renderWindow(pageIndex - VIRTUAL_WINDOW, pageIndex + VIRTUAL_WINDOW); // D-84
    const el = pageEls.get(pageIndex);
    if (el) el.classList.add('caret-target');
  }

  return {
    root, setResult, scrollToPage, jumpByHebrew, highlightIssue, clearHighlights, setCaretHighlight,
    getZoom: () => zoom, _lastScrollTarget: () => lastScrollTarget,
    // D-84: חשיפה לבדיקות/אבחון של מצב הווירטואליזציה
    isVirtual: () => virtual.on,
    getRenderedCount: () => pageEls.size,
    getPageCount: () => virtual.pages.length
  };
}

module.exports = { buildPreviewTab, parseHebrewNumber };
