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
    // **S5.2 (TOC_ROWS):** שורות תוכן-עניינים — תחום המתיחה, חפיפה, התנגשות
    // עם גיליון/כותרת. אותן סמנטיקה/קוד/ספים כמו full-math-audit.js:
    // ראשון ברצף (קודמו איננו אותו סוג TOC) ⇒ מתחיל ב-370.7, המשך ⇒ 113.7,
    // תחתית המתיחה 1005.7 (קבועי legacy-imud-flow: makeTocPages). בנתיב
    // המודרני (.toc-rows בזרימה) אין מתיחה — רק חפיפה/התנגשות.
    {
      const TOC_FIRST_TOP = 370.7, TOC_CONT_TOP = 113.7, TOC_STRETCH_BOTTOM = 1005.7;
      const TOC_ROW_MIN_PITCH = 21.5; // ערימה חוקית ≥ 23.25 (tocRowH רמה 7) − סובלנות
      const prevTypeById = new Map();
      for (let k = 1; k < seq.length; k++) prevTypeById.set(seq[k].idx, seq[k - 1].type);
      for (const p of seq) {
        const rows = (p.tocRows || []).slice().sort((a, b) => a.y - b.y);
        if (!rows.length) continue;
        if (!p.tocInContainer) {
          const top = prevTypeById.get(p.idx) !== p.type ? TOC_FIRST_TOP : TOC_CONT_TOP;
          for (const row of rows) {
            if (row.y < top - 2 || row.y > TOC_STRETCH_BOTTOM + 2) problems.push({ page: p.idx, type: 'TOC_ROWS', severity: 'high', y: Math.round(row.y * 10) / 10, detail: 'שורת תוכן-עניינים מחוץ לאזור המתיחה (' + top + '..' + TOC_STRETCH_BOTTOM + ')', text: row.text });
          }
        }
        for (let k = 1; k < rows.length; k++) {
          const pitch = rows[k].y - rows[k - 1].y;
          if (pitch < TOC_ROW_MIN_PITCH) problems.push({ page: p.idx, type: 'TOC_ROWS', severity: 'high', y: Math.round(rows[k].y * 10) / 10, pitch: Math.round(pitch * 10) / 10, detail: 'שורות תוכן-עניינים חופפות — מרחק ' + Math.round(pitch * 10) / 10 + 'px קטן מהרצפה החוקית (' + TOC_ROW_MIN_PITCH + 'px; ערימה חוקית ≥ 23.25px לפי tocRowH, תיבת DOM 26px); מתיחת ה-TOC דוחסת את השורות זו לזו', text: rows[k].text });
        }
        for (const row of rows) {
          for (const zone of [p.headerBox ? { name: 'כותרת עליונה', y: p.headerBox.top, b: p.headerBox.bottom } : null, p.folioBox ? { name: 'גיליון', y: p.folioBox.top, b: p.folioBox.bottom } : null]) {
            if (!zone) continue;
            const oy = Math.min(row.y + row.h, zone.b) - Math.max(row.y, zone.y);
            if (oy > 1) problems.push({ page: p.idx, type: 'TOC_ROWS', severity: 'high', y: Math.round(row.y * 10) / 10, detail: 'שורת תוכן-עניינים חופפת את ' + zone.name, text: row.text });
          }
        }
      }
    }
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
      problems.push({ type: 'PLACEHOLDER_GEOMETRY', severity: 'medium', page: ph.getAttribute('data-page-index'), w: Math.round(r.w), h: Math.round(r.h) });
    }
  }

  // ---------- ביקורת עמוד חי אחד ----------
  function auditLive(pg) {
    // **S5.2 (P-11):** data-page-index חסר — בעבר Number(null)===0 זייף את העמוד
    // כעמוד 0 (דריסה שקטה של העמוד האמיתי); עכשיו — בעיה מדווחת ודילוג מפורש.
    const idxAttr = pg.getAttribute('data-page-index');
    const idx = Number(idxAttr);
    if (idxAttr == null || !Number.isFinite(idx)) {
      problems.push({ type: 'PAGE_INDEX_MISSING', severity: 'high', detail: 'לעמוד חסר data-page-index — לא ניתן לזהותו (בעבר זויף כעמוד 0)' });
      return;
    }
    if (audited.has(idx)) return;
    const info = { idx, type: typeOf(pg), headerText: null, columns: 0, lines: 0, gates: [], ornaments: 0, fonts: [] };
    audited.set(idx, info);
    // **S5.2:** סוג לא מזוהה — בעבר עבר בשקט (false-green)
    if (info.type === 'unknown') {
      problems.push({ page: idx, type: 'TYPE_UNKNOWN', severity: 'high', detail: 'מסווג סוג העמוד לא זיהה אף מחלקת page--*' });
    }

    const hdr = pg.querySelector('.running-head');
    if (hdr) info.headerText = hdr.textContent.trim().slice(0, 80);
    // **S5.1 (A5):** מיקום בפיקסלים — כמו ב-full-math-audit.
    // **S5.1-ב (תיקון המטריקה):** יחסית לעמוד (כמו ב-full-math-audit) —
    // getBoundingClientRect viewport-י אינו מתאים לספים מוחלטים.
    const pgR = R(pg);
    if (hdr) {
      const hr = R(hdr);
      const hb = hr.b - pgR.y, ht = hr.y - pgR.y;
      info.headerBox = { top: ht, bottom: hb }; // **S5.2:** לבדיקת התנגשות שורות TOC
      if (hb > 107.2 + 0.5 || ht < -0.5) problems.push({ page: idx, type: 'HEADER_POSITION', severity: 'high', top: Math.round(ht * 10) / 10, bottom: Math.round(hb * 10) / 10 });
    }
    const fol = pg.querySelector('.folio');
    if (fol && (fol.textContent || '').trim()) {
      const fr2 = R(fol);
      const ft = fr2.y - pgR.y, fb = fr2.b - pgR.y;
      info.folioBox = { top: ft, bottom: fb }; // **S5.2:** לבדיקת התנגשות שורות TOC
      if (ft < 1022.2 - 0.5 || fb > 1122.5 + 2) problems.push({ page: idx, type: 'FOLIO_POSITION', severity: 'high', top: Math.round(ft * 10) / 10, bottom: Math.round(fb * 10) / 10 });
    }

    // **S5.2 (TOC_ROWS — הזרקת הגלאי גם כאן):** איסוף שורות תוכן-העניינים
    // (יחסית לעמוד). הבדיקות עצמן ב-finish() — הן חוצות-שורות (חפיפה) ותלויות
    // בסוג העמוד ה**קודם** (ראשון ברצף ⇒ תיבת 370.7 במקום 113.7) — מידע שמלא
    // רק בסוף הסריקה. אותם קודי בעיה/ספים כמו full-math-audit.js (P-7: השוואה
    // בין האודיטים) — כולל הרצפה 21.5px שם (ערימה חוקית של רמות 5/6/7 היא
    // 24.47/23.6/23.25px לפי tocRowH של המודל, תיבת DOM 26px).
    const tocWrapEl = pg.querySelector('.toc-rows');
    info.tocInContainer = !!(tocWrapEl && tocWrapEl.querySelector('.toc-row'));
    info.tocRows = [...pg.querySelectorAll('.toc-row')].map((rowEl) => {
      const rr = R(rowEl);
      return { y: rr.y - pgR.y, h: rr.height, text: (rowEl.textContent || '').trim().slice(0, 24) };
    });

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
      // 1ב. **D-92 (עטיפת שורה בדפדפן):** מילות שורה מתוכננת חייבות שורה
      // ויזואלית אחת — ריצת טקסט בשני גבהים = הדפדפן עטף (מדידה בלי
      // רווח-ביטחון) והדיו חופף את השורה שמתחת. רק צמתי טקסט (לא ספאנים
      // מוגבהים: סמן/סוגריים/חלון).
      for (const lr of rects) {
        let minTop = Infinity, maxTop = -Infinity, wn = 0;
        for (const ch of lr.el.childNodes) {
          if (ch.nodeType !== 3) continue;
          if (!(ch.textContent || '').trim()) continue;
          const rg = document.createRange(); rg.selectNodeContents(ch);
          for (const rc of rg.getClientRects()) {
            if (rc.width <= 0.5) continue;
            wn++; if (rc.top < minTop) minTop = rc.top; if (rc.top > maxTop) maxTop = rc.top;
          }
        }
        if (wn >= 2 && maxTop - minTop > 3) {
          problems.push({ page: idx, col: ci, type: 'WRAPPED_LINE', severity: 'high', spread: Math.round((maxTop - minTop) * 10) / 10, text: lr.el.textContent.slice(0, 25) });
        }
        // **S5.1 (A2):** עטיפה בתוך ספאנים — כמו ב-full-math-audit.
        for (const sp of lr.el.querySelectorAll('span')) {
          if (!(sp.textContent || '').trim()) continue;
          const rg2 = document.createRange(); rg2.selectNodeContents(sp);
          let sMin = Infinity, sMax = -Infinity, sN = 0;
          for (const rc of rg2.getClientRects()) {
            if (rc.width <= 0.5) continue;
            sN++; if (rc.top < sMin) sMin = rc.top; if (rc.top > sMax) sMax = rc.top;
          }
          if (sN >= 2 && sMax - sMin > 3) {
            problems.push({ page: idx, col: ci, type: 'WRAPPED_LINE', severity: 'high', span: String(sp.className).slice(0, 24), spread: Math.round((sMax - sMin) * 10) / 10, text: sp.textContent.slice(0, 25) });
          }
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
      // 3.5 **S4.23 (דיווח משתמש: "איך הבדיקות שלך לא עלו עליהם?!"):** הבדיקות
      //     למעלה רואות **תיבות** — והתיבות תמיד "מושלמות" (right:0, width:colW,
      //     height:pitch) גם כשהעין רואה קטסטרופה. כאן נמדדת גיאומטריית ה**דיו**
      //     — איחוד מלבני הצמתים (טקסט דרך Range, אלמנטים דרך getBoundingClientRect)
      //     — מה שהמשתמש רואה בפועל. שלוש בדיקות חדשות, מתמטיות-מוחלטות:
      //     (א) INK_OUTSIDE_COLUMN — דיו שחורג מתיבת הטור (בעבר: גלישה שקטה
      //         של שורות nowrap לתוך הטור השני/השפה);
      //     (ב) INK_NOT_JUSTIFIED — שורת גוף מלאה (≥2 מילים) שאינה ממלאת את
      //         רוחב הטור משני הצדדים (סף 3px) — כלומר אינה מיושרת כמו ב-PDF
      //         (projectLine) וכמו במקור;
      //     (ג) WINDOW_WRONG_SIDE — מילת-החלון שאינה נצמדת לקצה ה**ימני** של
      //         הטור (עברית: הפתיחה בראש השורה = ימין), ו-WINDOW_NOT_FIRST —
      //         חלון שאינו הדיו הראשון בשורה.
      const inkOf = (lineEl) => {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cnt = 0;
        for (const ch of lineEl.childNodes) {
          let b = null;
          if (ch.nodeType === 3) {
            if (!ch.textContent || !ch.textContent.trim()) continue;
            const rg = document.createRange(); rg.selectNodeContents(ch); b = rg.getBoundingClientRect();
          } else if (ch.nodeType === 1) {
            if (!ch.textContent || !ch.textContent.trim()) continue;
            b = ch.getBoundingClientRect();
          }
          if (!b || b.width <= 0) continue;
          cnt++;
          x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right);
          y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom);
        }
        if (!cnt) return null;
        return { x: x0, r: x1, y: y0, b: y1, n: cnt };
      };
      for (const lr of rects) {
        const cls = String(lr.el.className);
        const isWinWrap = /line--window-wrap/.test(cls);
        // **S5.2 (P-7 — השוואה ל-full-math-audit):** INK_OUTSIDE_COLUMN חל על כל
        // השורות — כולל אחרונות/כותרות/עטיפת-חלון. בעבר הן דולגו כאן (דיו שחורג
        // מהטור בשורה אחרונה היה בלתי-נראה לאודיט הזה), בזמן ש-full-math-audit —
        // שכן בודק אותן — ירוק על אותו קורפוס (43,125 שורות, 0 בעיות): אין לו
        // פטור כזה ואין בעיות — כלומר הפטור כאן היה עיוורון, לא סובלנות.
        const ink = inkOf(lr.el);
        if (ink && (ink.r > cr.r + 2.5 || ink.x < cr.x - 2.5)) {
          problems.push({ page: idx, col: ci, type: 'INK_OUTSIDE_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dx: Math.round(Math.max(ink.r - cr.r, cr.x - ink.x)) });
        }
        // **S5.2:** שורה מעל ראשית הטור — דיו שנודד לפס הכותרת העליונה (בעבר
        // נבדקו שמאל/ימין/מטה בלבד). רק עמודי תוכן — לשערים/TOC גיאומטריה משלהם.
        if (/^(regular|sign-open|preface|h3-spread)$/.test(info.type) && lr.r.y < cr.y - 2) {
          problems.push({ page: idx, col: ci, type: 'LINE_ABOVE_COLUMN', severity: 'high', text: lr.el.textContent.slice(0, 25), dy: Math.round((cr.y - lr.r.y) * 10) / 10 });
        }
        // יישור/חלון — שורות גוף בלבד (אחרונה/כותרת ממורכזות מטבען; שורת-חלון
        // עוטפת את מילת-החלון — השפה הימנית תפוסה בכוונה; טיפוגרפיה נכונה).
        if (/line--last|line--heading/.test(cls)) continue;
        if (isWinWrap) continue;
        if (!ink) continue;
        if (ink.n >= 2 || ((lr.el.textContent || '').trim().split(/\s+/).filter(Boolean).length >= 2)) {
          const leftGap = ink.x - cr.x, rightGap = cr.r - ink.r;
          if (leftGap > 3 || rightGap > 3) {
            problems.push({ page: idx, col: ci, type: 'INK_NOT_JUSTIFIED', severity: 'high', leftGap: Math.round(leftGap), rightGap: Math.round(rightGap), text: lr.el.textContent.slice(0, 25) });
          }
        }
        const winEl = lr.el.querySelector ? lr.el.querySelector('.w--window') : null;
        if (winEl) {
          const wr = winEl.getBoundingClientRect();
          const distR = cr.r - wr.right;
          if (distR > 3) {
            problems.push({ page: idx, col: ci, type: 'WINDOW_WRONG_SIDE', severity: 'high', distFromRight: Math.round(distR), distFromLeft: Math.round(wr.left - cr.x), text: (winEl.textContent || '').slice(0, 20) });
          }
          if (wr.right < ink.r - 3) {
            problems.push({ page: idx, col: ci, type: 'WINDOW_NOT_FIRST', severity: 'medium', text: (winEl.textContent || '').slice(0, 20) });
          }
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
