// tools/layout-audit/audit-in-page.js — אודיט עימוד בדפדפן אמיתי (03.11(ד))
'use strict';

/**
 * **שקיפות עימוד מהקוד — הכלי שנולד מדיווח משתמש 3:**
 * "אם אתה לא יכול להבין מתוך הקוד (בלי בדיקה ויזואלית) שהעימוד נראה כמו
 * עימוד של נוטפד, יש טקסטים אחד על השני, ושום דבר מהגדרות ברירת המחדל
 * אינו קיים, אין כותרות עליונות אין עמודי שער — אז מה עשינו כל הזמן?"
 *
 * הסקריפט נטען לתוך האפליקציה החיה (דרך agent-browser eval או כל דפדפן
 * headless) ומודד את הגיאומטריה האמיתית של ה-DOM המרונדר — לא המודל, לא
 * jsdom (שאינו מחשב גיאומטריה כלל) — ומחזיר דוח JSON עם בעיות מסווגות.
 *
 * אינווריאנטים הנבדקים כאן (משלימים ל-tests/e2e/s14-layout-audit.test.js
 * שרץ ב-Node): חפיפות שורות בפועל, גלישה מתיבת הטור, כותרות עליונות בעמודי
 * תוכן, עמודי שער עם תוכן מובנה, יישור שורות (justify), וגופנים בפועל.
 *
 * הרצה: bash tools/layout-audit/run.sh  (מגיש את הסקריפט הזה לדפדפן)
 */

(function () {
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const pages = [...document.querySelectorAll('.page')];
  const report = { url: location.href, pageCount: pages.length, pages: [], problems: [], summary: {} };

  pages.forEach((pg, pi) => {
    const pr = R(pg);
    const pageInfo = { idx: pi, type: pg.className.replace(/preview-page|page/g, '').trim(), rect: pr, headerText: null, columns: 0, lines: 0, shaarContent: false, ornaments: 0 };

    // כותרת עליונה — טקסט מלא של הסלוטים
    const hdr = pg.querySelector('.running-head');
    if (hdr) pageInfo.headerText = hdr.textContent.trim().slice(0, 60);

    // תוכן שער מובנה (03.11(ד))
    pageInfo.shaarContent = /page--shaar/.test(pg.className)
      ? { bsd: !!pg.querySelector('.bsd-header'), title: (pg.querySelector('.book-title-main') || {}).textContent || null, crown: !!pg.querySelector('.shaar-crown'), author: (pg.querySelector('.author-block') || {}).textContent || null }
      : null;

    pageInfo.ornaments = pg.querySelectorAll('.orn, [class*="divider"]').length;
    const cols = [...pg.querySelectorAll('.column')];
    pageInfo.columns = cols.length;

    // ---- חפיפות וגלישות בפועל (getBoundingClientRect — האמת של הדפדפן) ----
    cols.forEach((c, ci) => {
      const cr = R(c);
      const lines = [...c.children];
      pageInfo.lines += lines.length;
      const rects = lines.map(l => ({ el: l, r: R(l), ta: getComputedStyle(l).textAlign }));
      // 1. חפיפה אנכית בין שורות של אותו טור (טקסט אחד על השני)
      for (let i = 1; i < rects.length; i++) {
        const overlapY = rects[i - 1].r.b - rects[i].r.y;
        if (overlapY > 1.5) {
          report.problems.push({ page: pi, col: ci, type: 'LINE_OVERLAP', severity: 'high', px: Math.round(overlapY), a: rects[i - 1].el.textContent.slice(0, 25), b: rects[i].el.textContent.slice(0, 25) });
        }
      }
      // 2. גלישה מתיבת הטור (רוחב/גובה)
      for (const lr of rects) {
        if (lr.r.r > cr.r + 2 || lr.r.x < cr.x - 2) {
          report.problems.push({ page: pi, col: ci, type: 'LINE_OUTSIDE_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dx: Math.round(Math.max(lr.r.r - cr.r, cr.x - lr.r.x)) });
        }
        if (lr.r.b > cr.b + 2) {
          report.problems.push({ page: pi, col: ci, type: 'LINE_BELOW_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dy: Math.round(lr.r.b - cr.b) });
        }
      }
      // 3. יישור: שורות גוף (לא אחרונות) חייבות להיות justify
      const bodyLines = rects.filter(x => !/line--last/.test(x.el.className));
      if (bodyLines.length >= 3) {
        const justified = bodyLines.filter(x => x.ta === 'justify').length;
        if (justified < bodyLines.length * 0.8) {
          report.problems.push({ page: pi, col: ci, type: 'NOT_JUSTIFIED', severity: 'medium', justified: `${justified}/${bodyLines.length}` });
        }
      }
    });
    report.pages.push(pageInfo);
  });

  // ---- מבנה הספר: שערים בסדר המקור, כותרות בעמודי תוכן ----
  const types = report.pages.map(p => p.type);
  const orderOk = /shaar-main/.test(types[0] || '') && /shaar-back/.test(types[1] || '');
  if (!orderOk) report.problems.push({ type: 'SHAAR_ORDER', severity: 'high', got: types.slice(0, 3), expected: ['shaar-main', 'shaar-back', '...'] });
  if (!types.some(t => /shaar-sub/.test(t))) report.problems.push({ type: 'NO_SHAAR_SUB', severity: 'medium' });
  const bodyPages = report.pages.filter(p => /regular|sign-open|preface|h3-spread|toc/.test(p.type));
  const bodyNoHdr = bodyPages.filter(p => !p.headerText);
  if (bodyNoHdr.length) report.problems.push({ type: 'BODY_PAGES_WITHOUT_HEADER', severity: 'high', pages: bodyNoHdr.map(p => p.idx) });

  // ---- גופנים בפועל ----
  const fonts = new Set();
  for (const pg of report.pages) {
    pg.observedFonts = [];
    for (const c of document.querySelectorAll(`[data-page-index="${pg.idx}"] .line`)) {
      const f = getComputedStyle(c).fontFamily.split(',')[0];
      fonts.add(f); pg.observedFonts.push(f);
    }
  }
  report.observedFonts = [...fonts];

  // ---- תקציר ----
  const bySeverity = {};
  for (const p of report.problems) bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
  report.summary = {
    pages: pages.length,
    shaarPages: types.filter(t => /shaar/.test(t)).length,
    bodyPagesWithHeader: `${bodyPages.length - bodyNoHdr.length}/${bodyPages.length}`,
    totalLines: report.pages.reduce((s, p) => s + p.lines, 0),
    problems: report.problems.length,
    bySeverity
  };
  return JSON.stringify(report);
})()
