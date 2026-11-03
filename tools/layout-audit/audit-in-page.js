// tools/layout-audit/audit-in-page.js — אודיט עימוד בדפדפן אמיתי (03.11(ד); S4.11)
'use strict';

/**
 * **שקיפות עימוד מהקוד — הכלי שנולד מדיווח משתמש 3:**
 * "אם אתה לא יכול להבין מתוך הקוד (בלי בדיקה ויזואלית) שהעימוד נראה כמו
 * עימוד של נוטפד, יש טקסטים אחד על השני, ושום דבר מהגדרות ברירת המחדל
 * אינו קיים, אין כותרות עליונות אין עמודי שער — אז מה עשינו כל הזמן?"
 *
 * הסקריפט נטען לתוך האפליקציה החיה (דרך agent-browser eval) ומודד את
 * הגיאומטריה האמיתית של ה-DOM המרונדר — לא המודל, לא jsdom (שאינו מחשב
 * גיאומטריה כלל) — ומחזיר דוח JSON עם בעיות מסווגות.
 *
 * **S4.11 — מודע-וירטואליזציה (בקשת המשתמש: "כל הבדיקות על הקובץ הגדול
 * מאוד"):** מעל 60 עמודים התצוגה מרנדרת חלון חי בלבד (D-84) והשאר
 * placeholders בגובה האמיתי. האודיט הישן ראה רק את החלון הראשוני (~10
 * עמודים) והחליט שזה "כל הספר". הגרסה הזאת סורקת את הספר **בגלילה** —
 * מזיזה את הגולל לכל יעד, ממתינה ל-renderWindow, ומבקרת כל עמוד בדיוק
 * ברגע שהוא חי ב-DOM. בסוף נבדק **כיסוי מלא**: כל עמוד חייב להיבדק
 * (COVERAGE) — אחרת האודיט עצמו כשל.
 *
 * אינווריאנטים: חפיפות שורות בפועל, גלישה מתיבת הטור (רוחב וגובה),
 * כותרות עליונות בעמודי תוכן, סדר שערים, תוכן שער, יישור שורות-גוף
 * (שורות אחרונות/כותרות מוגדרות line--last/line--heading ואינן נספרות),
 * גיאומטריית placeholders, וגופנים בפועל.
 *
 * הרצה: bash tools/layout-audit/run.sh  (מגיש את הסקריפט הזה לדפדפן)
 */

(async function () {
  const t0 = Date.now();
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  // שני rAF + גדר timeout — גם אם ה-rendering מושהה (headless רקע) הסריקה לא נתקעת
  const settle = () => new Promise((res) => {
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    try { requestAnimationFrame(() => requestAnimationFrame(fin)); } catch (e) { /* בלי rAF */ }
    setTimeout(fin, 120);
  });

  // סוג עמוד מהמחלקות — מהספציפי לכללי (page--shaar-main וכו')
  const TYPES = ['shaar-main', 'shaar-back', 'shaar-sub', 'toc-general', 'toc-detail', 'blank',
    'sign-open', 'preface', 'endnotes', 'h3-spread', 'filler', 'custom', 'regular'];
  const typeOf = (pg) => {
    const cls = String(pg.className || '');
    for (const t of TYPES) if (cls.includes('page--' + t)) return t;
    return 'unknown';
  };

  const report = { url: location.href, virtualized: false, sweep: null, pages: [], problems: [], summary: {} };
  const problems = report.problems;
  const audited = new Map(); // data-page-index → מידע שנאסף

  const finish = () => {
    const seq = [...audited.values()].sort((a, b) => a.idx - b.idx);
    report.pages = seq;
    const types = seq.map((p) => p.type);
    const fonts = new Set();
    for (const p of seq) for (const f of (p.fonts || [])) fonts.add(f);
    report.observedFonts = [...fonts];
    const bySeverity = {};
    for (const p of problems) bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
    const bodyPages = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.type));
    report.summary = {
      pages: seq.length,
      slots: report.pageCount || 0,
      virtualized: report.virtualized,
      shaarPages: types.filter((t) => /shaar/.test(t)).length,
      bodyPagesWithHeader: `${bodyPages.filter((p) => p.headerText).length}/${bodyPages.length}`,
      totalLines: seq.reduce((s, p) => s + p.lines, 0),
      problems: problems.length,
      bySeverity,
      sweepMs: Date.now() - t0
    };
  };

  // ---------- שלב 1: מלאי העמודים (placeholders + חיים יחדיו) ----------
  const canvas = document.querySelector('.preview-canvas');
  const slots = canvas
    ? [...canvas.querySelectorAll(':scope > .preview-page')]
    : [...document.querySelectorAll('.page')];
  const n = slots.length;
  if (!n) {
    problems.push({ type: 'NO_PAGES', severity: 'high', detail: 'אף עמוד לא רונדר — התצוגה ריקה' });
    finish();
    return JSON.stringify(report);
  }
  report.pageCount = n;

  const liveNow = () => (canvas
    ? [...canvas.querySelectorAll(':scope > .preview-page:not(.preview-page--placeholder)')]
    : [...document.querySelectorAll('.page')]);
  report.virtualized = liveNow().length < n;

  // תקינות וירטואליזציה: לכל placeholder גובה/רוחב אמיתיים (לא 0)
  for (const ph of slots) {
    if (!/preview-page--placeholder/.test(String(ph.className))) continue;
    const r = R(ph);
    if (r.w < 100 || r.h < 100) {
      problems.push({ type: 'PLACEHOLDER_GEOMETRY', severity: 'medium', page: Number(ph.getAttribute('data-page-index')), w: Math.round(r.w), h: Math.round(r.h) });
    }
  }

  // ---------- ביקורת עמוד חי אחד ----------
  function auditLive(pg) {
    const idx = Number(pg.getAttribute('data-page-index'));
    if (!Number.isFinite(idx) || audited.has(idx)) return;
    const info = { idx, type: typeOf(pg), headerText: null, columns: 0, lines: 0, gates: [], ornaments: 0, fonts: [] };
    audited.set(idx, info);

    const hdr = pg.querySelector('.running-head');
    if (hdr) info.headerText = hdr.textContent.trim().slice(0, 80);

    // תוכן שער (מנוע מורשת): שורות השער הן .band--gate
    info.gates = [...pg.querySelectorAll('.band--gate')].map((b) => b.textContent.trim().slice(0, 48)).filter(Boolean);
    info.ornaments = pg.querySelectorAll('.orn, [class*="divider"]').length;

    const fonts = new Set();
    const cols = [...pg.querySelectorAll('.column')];
    info.columns = cols.length;
    cols.forEach((c, ci) => {
      const cr = R(c);
      const lines = [...c.children];
      info.lines += lines.length;
      const rects = lines.map((l) => ({ el: l, r: R(l), ta: getComputedStyle(l).textAlign }));
      for (const lr of rects) fonts.add(String(getComputedStyle(lr.el).fontFamily).split(',')[0].trim());
      // 1. חפיפה אנכית בין שורות אותו טור (טקסט אחד על השני)
      for (let i = 1; i < rects.length; i++) {
        const ov = rects[i - 1].r.b - rects[i].r.y;
        if (ov > 1.5) {
          problems.push({ page: idx, col: ci, type: 'LINE_OVERLAP', severity: 'high', px: Math.round(ov), a: rects[i - 1].el.textContent.slice(0, 25), b: rects[i].el.textContent.slice(0, 25) });
        }
      }
      // 2. גלישה מתיבת הטור (רוחב/גובה)
      for (const lr of rects) {
        if (lr.r.r > cr.r + 2 || lr.r.x < cr.x - 2) {
          problems.push({ page: idx, col: ci, type: 'LINE_OUTSIDE_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dx: Math.round(Math.max(lr.r.r - cr.r, cr.x - lr.r.x)) });
        }
        if (lr.r.b > cr.b + 2) {
          problems.push({ page: idx, col: ci, type: 'LINE_BELOW_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dy: Math.round(lr.r.b - cr.b) });
        }
      }
      // 3. יישור: שורות גוף שאינן אחרונות/כותרות — חייבות להיות מיושרות.
      //    שורה אחרונה בפסקה ושורת כותרת מסומנות במחלקה ואינן נספרות (מתמטי,
      //    לא סובלנות): line--last / line--heading.
      const bodyLines = rects.filter((x) => !/line--last|line--heading/.test(String(x.el.className)));
      if (bodyLines.length >= 3) {
        const justified = bodyLines.filter((x) => x.ta === 'justify').length;
        if (justified < bodyLines.length * 0.8) {
          problems.push({ page: idx, col: ci, type: 'NOT_JUSTIFIED', severity: 'medium', justified: `${justified}/${bodyLines.length}` });
        }
      }
    });
    info.fonts = [...fonts];
  }

  // ---------- שלב 2: סריקה — כל העמודים, גם בספר וירטואלי ----------
  if (!report.virtualized) {
    for (const pg of liveNow()) auditLive(pg);
  } else {
    // הגולל האמיתי: .tab-panel[data-tab=preview] (overflow:auto); נפילה — canvas
    const panel = document.querySelector('.tab-panel[data-tab="preview"]');
    let scroller = null;
    for (const cand of [panel, canvas]) {
      if (cand && cand.scrollHeight > cand.clientHeight + 10) { scroller = cand; break; }
    }
    if (!scroller) {
      problems.push({ type: 'NO_SCROLLER', severity: 'high', detail: 'וירטואלי אבל אין אלמנט גולל — הסריקה לא יכולה להגיע לכל העמודים' });
      for (const pg of liveNow()) auditLive(pg);
    } else {
      const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
      // צעד ≤ ~3 עמודים (החלון החי: נראה ±1 + ריפוד 4 — מרווח בטוח); תקרת ~300 צעדים
      const step = Math.max(1, Math.min(3, Math.ceil(n / 300)));
      let steps = 0;
      const t1 = Date.now();
      for (let target = 0; target < n; target += step) {
        scroller.scrollTop = Math.round(((target + 0.5) / n) * maxScroll());
        await settle();
        await sleep(20);
        for (const pg of liveNow()) auditLive(pg);
        steps++;
      }
      scroller.scrollTop = maxScroll(); // התחתית — החלון האחרון
      await settle();
      await sleep(20);
      for (const pg of liveNow()) auditLive(pg);
      report.sweep = { steps: steps + 1, step, ms: Date.now() - t1, scroller: scroller.className };
    }
  }

  // כיסוי מלא — כל עמוד חייב היה להיות חי ולהיבדק לפחות פעם אחת
  const missing = [];
  for (let i = 0; i < n; i++) if (!audited.has(i)) missing.push(i);
  if (missing.length) {
    problems.push({ type: 'COVERAGE', severity: 'high', count: missing.length, sample: missing.slice(0, 12) });
  }

  // ---------- שלב 3: מבנה הספר — על כל העמודים שנאספו ----------
  const seq = [...audited.values()].sort((a, b) => a.idx - b.idx);
  const types = seq.map((p) => p.type);
  if (seq.length) {
    if (types[0] !== 'shaar-main' || (types[1] !== 'shaar-back')) {
      problems.push({ type: 'SHAAR_ORDER', severity: 'high', got: types.slice(0, 3), expected: ['shaar-main', 'shaar-back', '…'] });
    }
    if (!types.some((t) => t === 'shaar-sub')) {
      problems.push({ type: 'NO_SHAAR_SUB', severity: 'medium' });
    }
    const bodyPages = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.type));
    const bodyNoHdr = bodyPages.filter((p) => !p.headerText);
    if (bodyNoHdr.length) {
      problems.push({ type: 'BODY_PAGES_WITHOUT_HEADER', severity: 'high', count: bodyNoHdr.length, pages: bodyNoHdr.map((p) => p.idx).slice(0, 12) });
    }
    // שער ראשי חייב תוכן אמיתי (שורות שער מהמטא-דאטה)
    const mainShaar = seq.find((p) => p.type === 'shaar-main');
    if (mainShaar && !(mainShaar.gates && mainShaar.gates.length)) {
      problems.push({ type: 'SHAAR_EMPTY', severity: 'high', page: mainShaar.idx });
    }
  }

  finish();
  return JSON.stringify(report);
})()
