// אודיט מתמטי מלא של העימוד — על ה-DOM החי (in-page).
// מכסה את כל בעיות העימוד שהוזכרו בפרויקט (WORKLOG/ISSUE_REGISTRY/דיווחי משתמש):
//  1. טקסטים אחד על השני (LINE_OVERLAP)          2. יישור שורות גוף — דיו בפועל (INK_NOT_JUSTIFIED)
//  3. גלישת תיבות/דיו מהטור (LINE_OUTSIDE/LINE_BELOW/INK_OUTSIDE)   4. גלישה בין טורים (GUTTER)
//  5. סדר שורות בטור (LINE_OUT_OF_ORDER)          6. מילת-חלון: ראשונה+ימין (WINDOW_*)
//  7. שורה אחרונה: לא מתוחה + ממורכזת             8. כותרת: ממורכזת, לא מתוחה
//  9. יישור בין הטורים — גריד בסיסים (tops)      10. פיץ' שורות (pitches)
// 11. הערות שוליים: חפיפה עם גוף/בינן             12. כותרות עליונות בכל עמודי התוכן
// 13. עמודי שער: קיום, סדר                        14. פוליו: קיום+גימטריה
// 15. גיאומטריית עמוד/טורים: אחידות, RTL          16. וירטואליזציה: placeholders
// 17. כיסוי מלא (COVERAGE)                        18. גופנים בפועל
// 19. nowrap על שורות גוף (שורש S4.23)            20. עמודי תוכן ריקים (בלי הערות)
// 21. פסים (bands): תיבה בעמוד, דיו בתיבה, מרכוז — S4.24
(async function () {
  const t0 = Date.now();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = () => new Promise((res) => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; try { requestAnimationFrame(() => requestAnimationFrame(fin)); } catch (e) {} setTimeout(fin, 120); });
  const R = (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, r: r.right, b: r.bottom }; };
  const inkOf = (lineEl) => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cnt = 0;
    for (const ch of lineEl.childNodes) {
      let b = null;
      if (ch.nodeType === 3) { if (!ch.textContent || !ch.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(ch); b = rg.getBoundingClientRect(); }
      else if (ch.nodeType === 1) { if (!ch.textContent || !ch.textContent.trim()) continue; b = ch.getBoundingClientRect(); }
      if (!b || b.width <= 0) continue; cnt++;
      x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom);
    }
    return cnt ? { x: x0, r: x1, y: y0, b: y1, n: cnt } : null;
  };
  const TYPES = ['shaar-main', 'shaar-back', 'shaar-sub', 'toc-general', 'toc-detail', 'blank', 'sign-open', 'preface', 'endnotes', 'h3-spread', 'filler', 'custom', 'regular'];
  const typeOf = (pg) => { const cls = String(pg.className || ''); for (const t of TYPES) if (cls.includes('page--' + t)) return t; return 'unknown'; };
  const mk = () => ({ n: 0, sum: 0, sumSq: 0, min: Infinity, max: -Infinity });
  const accAdd = (a, v) => { a.n++; a.sum += v; a.sumSq += v * v; if (v < a.min) a.min = v; if (v > a.max) a.max = v; };
  const fin = (a) => a.n ? { n: a.n, min: Math.round(a.min * 100) / 100, max: Math.round(a.max * 100) / 100, mean: +(a.sum / a.n).toFixed(3), std: +Math.sqrt(Math.max(0, a.sumSq / a.n - (a.sum / a.n) * (a.sum / a.n))).toFixed(3) } : null;

  const report = { url: location.href, started: new Date().toISOString(), ua: navigator.userAgent, dpr: devicePixelRatio, vp: [innerWidth, innerHeight], assets: null, fonts: null, virtualized: null, sweep: null, problems: [], pages: [], stats: null, summary: null };
  const P = report.problems;
  const CNT = {};
  const cnt = (type, entry) => { CNT[type] = (CNT[type] || 0) + 1; if (P.length < 2000 && entry) P.push(entry); };
  const S = {
    bodyL: mk(), bodyR: mk(), winD: mk(), lastSym: mk(), headSym: mk(), markerFs: mk(), fnFs: mk(),
    bodyFs: {}, lastAlign: {}, headAlign: {}, bodyStyle: { justifyOk: 0, nowrap: 0, styleOther: 0 },
    folio: { present: 0, absent: 0, gematria: 0, digits: 0, other: 0 }, fontsUsed: {}, dirOk: 0, dirBad: 0
  };

  try { await document.fonts.ready; } catch (e) {}
  report.assets = {
    appSrc: (document.querySelector('script[src*="app.bundle.js"]') || {}).src || null,
    keyResources: performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /app\.bundle|styles\.css|engine-worker/.test(n)).slice(0, 10)
  };
  const famStatus = {};
  try { for (const f of document.fonts) { const k = f.family + '|' + f.status; famStatus[k] = (famStatus[k] || 0) + 1; } } catch (e) {}
  report.fonts = {
    checkFrankRuhlLibre: document.fonts.check('16px "Frank Ruhl Libre"'),
    checkDavidLibre: document.fonts.check('16px "David Libre"'),
    checkNotoSerifHebrew: document.fonts.check('16px "Noto Serif Hebrew"'),
    faces: famStatus
  };

  const canvas = document.querySelector('.preview-canvas');
  const slots = canvas ? [...canvas.querySelectorAll(':scope > .preview-page')] : [...document.querySelectorAll('.page')];
  const n = slots.length;
  if (!n) { cnt('NO_PAGES', { type: 'NO_PAGES', severity: 'high', detail: 'אף עמוד לא רונדר' }); report.summary = { pages: 0, slots: 0, problems: 1, counts: CNT }; return JSON.stringify(report); }
  const liveNow = () => (canvas ? [...canvas.querySelectorAll(':scope > .preview-page:not(.preview-page--placeholder)')] : [...document.querySelectorAll('.page')]);
  report.virtualized = liveNow().length < n;
  const phH = [];
  for (const ph of slots) {
    if (!/preview-page--placeholder/.test(String(ph.className))) continue;
    const r = R(ph); phH.push(Math.round(r.h * 10) / 10);
    if (r.w < 100 || r.h < 100) cnt('PLACEHOLDER_GEOMETRY', { type: 'PLACEHOLDER_GEOMETRY', severity: 'medium', page: Number(ph.getAttribute('data-page-index')), w: Math.round(r.w), h: Math.round(r.h) });
  }
  report.placeholderHeights = phH.length ? { n: phH.length, min: Math.min.apply(null, phH), max: Math.max.apply(null, phH) } : null;

  const audited = new Map();

  function auditLive(pg) {
    const idx = Number(pg.getAttribute('data-page-index'));
    if (!Number.isFinite(idx) || audited.has(idx)) return;
    const type = typeOf(pg);
    const pr = R(pg);
    const info = { i: idx, t: type, pw: Math.round(pr.w * 10) / 10, ph: Math.round(pr.h * 10) / 10, h: null, fo: null, g: 0, colsN: 0, cols: [], fn: 0, fnMk: '', mk: '', mkn: 0 };
    audited.set(idx, info);

    const hdr = pg.querySelector('.running-head');
    if (hdr) info.h = (hdr.textContent || '').trim().slice(0, 60) || null;
    const fol = pg.querySelector('.folio');
    if (fol && (fol.textContent || '').trim()) {
      info.fo = (fol.textContent || '').trim();
      S.folio.present++;
      if (/^[0-9]+$/.test(info.fo)) S.folio.digits++; else if (/[\u0590-\u05FF]/.test(info.fo)) S.folio.gematria++; else S.folio.other++;
    } else { S.folio.absent++; }
    // **S5.1 (A5):** מיקום הכותרת-העליונה והגיליון בפיקסלים — בעבר נקרא רק
    // הטקסט; כותרת שתשב על שורת הגוף הראשונה (טקסט-על-טקסט) היתה בלתי-נראית.
    // הכותרת מעל ראשית הזרימה (107.2); הגיליון מתחת לתחתית הזרימה (1022.2)
    // ובתוך העמוד (1122.5) — גיאומטריית הייחוס של המנוע.
    // **S5.1-ב (תיקון המטריקה):** יחסית לעמוד (pr) — getBoundingClientRect הוא
    // viewport-י; בהשוואה מוחלטת (107.2/1022.2) הבדיקה ירתה על כל עמוד
    // (1332 אזעקות שווא בריצת ה-Actions הראשונה). עכשיו: יחסית לתיבת העמוד.
    if (hdr) {
      const hr = R(hdr);
      const hb = hr.b - pr.y, ht = hr.y - pr.y;
      if (hb > 107.2 + 0.5 || ht < -0.5) cnt('HEADER_POSITION', { type: 'HEADER_POSITION', severity: 'high', page: idx, top: Math.round(ht * 10) / 10, bottom: Math.round(hb * 10) / 10 });
    }
    if (fol && (fol.textContent || '').trim()) {
      const fr2 = R(fol);
      const ft = fr2.y - pr.y, fb = fr2.b - pr.y;
      if (ft < 1022.2 - 0.5 || fb > 1122.5 + 2) cnt('FOLIO_POSITION', { type: 'FOLIO_POSITION', severity: 'high', page: idx, top: Math.round(ft * 10) / 10, bottom: Math.round(fb * 10) / 10 });
    }
    info.g = [...pg.querySelectorAll('.band--gate')].filter((b) => (b.textContent || '').trim()).length;

    const cols = [...pg.querySelectorAll('.column')];
    info.colsN = cols.length;
    const colContent = cols.map((c) => c.children.length);
    if (cols.length === 2 && colContent[0] > 0 && colContent[1] > 0) {
      const r0 = R(cols[0]), r1 = R(cols[1]);
      if (r0.x < r1.x) cnt('COLUMN_ORDER_RTL', { type: 'COLUMN_ORDER_RTL', severity: 'high', page: idx, detail: 'הטור הראשון ב-DOM אינו הימני הפיזית' });
      if (Math.abs(r0.w - r1.w) > 1) cnt('COLUMN_WIDTH_MISMATCH', { type: 'COLUMN_WIDTH_MISMATCH', severity: 'medium', page: idx, d: Math.round(Math.abs(r0.w - r1.w) * 10) / 10 });
      info.gutter = Math.round((r0.x - r1.r) * 10) / 10;
      if (r0.x - r1.r < 0) cnt('GUTTER_OVERLAP', { type: 'GUTTER_OVERLAP', severity: 'high', page: idx, d: Math.round((r0.x - r1.r) * 10) / 10 });
      if (/^(preface|toc|shaar)/.test(type)) cnt('SINGLE_TYPE_TWO_CONTENT_COLS', { type: 'SINGLE_TYPE_TWO_CONTENT_COLS', severity: 'high', page: idx, t: type, lines: colContent });
    }
    info.colContent = colContent;
    for (const c of cols) {
      const cr = R(c);
      if (cr.r > pr.r + 2 || cr.x < pr.x - 2 || cr.b > pr.b + 2) cnt('COLUMN_OUTSIDE_PAGE', { type: 'COLUMN_OUTSIDE_PAGE', severity: 'high', page: idx });
    }

    const bodyBoxes = [];
    let totalLines = 0;
    let dirChecked = false;
    cols.forEach((c, ci) => {
      const cr = R(c);
      const lines = [...c.children];
      const colRec = { n: lines.length, x: Math.round(cr.x * 10) / 10, w: Math.round(cr.w * 10) / 10, tops: [], f: '', at: '', p: [] };
      info.cols.push(colRec);
      totalLines += lines.length;
      let prevBox = null, prevTop = null, prevFlag = null;
      for (const l of lines) {
        const cls = String(l.className);
        const isLast = /line--last/.test(cls), isHead = /line--heading/.test(cls);
        // **S4.26 (חלון שקוע):** שורה 1 של פסקת-חלון — השפה הימנית תפוסה
        // ע"י מילת-החלון (בכוונה, כמו float במקור) — פטורה מבדיקות היישור
        // והמרכוז; גלישה/חפיפה נבדקות כרגיל.
        const isWinWrap = /line--window-wrap/.test(cls);
        const lr = R(l);
        const cs = getComputedStyle(l);
        const ink = inkOf(l);
        const hasWin = !!(l.querySelector && l.querySelector('.w--window'));
        const hasMk = !!(l.querySelector && l.querySelector('.w--fnmarker'));
        const base = isLast ? 'l' : (isHead ? 'h' : 'b');
        colRec.tops.push(Math.round(lr.y * 10));
        colRec.f += base;
        colRec.at += (hasWin ? 'w' : '-') + (hasMk ? 'm' : '-');
        const words = (l.textContent || '').trim().split(/\s+/).filter(Boolean).length;

        if (prevBox && prevBox.b - lr.y > 1.5) cnt('LINE_OVERLAP', { type: 'LINE_OVERLAP', severity: 'high', page: idx, col: ci, px: Math.round(prevBox.b - lr.y), a: (prevBox.tx || '').slice(0, 20), b: (l.textContent || '').slice(0, 20) });
        // **D-92 (עטיפת שורה בדפדפן):** כל מילות הטקסט של שורה מתוכננת חייבות
        // לשבת על אותה שורה ויזואלית. ריצת טקסט בשני גבהים = הדפדפן עטף
        // שורה שהמנוע תכנן (מדידה צמודה-לקצה ללא רווח-ביטחון) — ודיו
        // השורה הוויזואלית השנייה חופף את השורה שמתחתיה. ספאנים מוגבהים
        // (סמן/סוגריים/חלון) אינם נבדקים — רק צמתי טקסט.
        {
          let minTop = Infinity, maxTop = -Infinity, wn = 0;
          for (const ch of l.childNodes) {
            if (ch.nodeType !== 3) continue;
            if (!(ch.textContent || '').trim()) continue;
            const rg = document.createRange(); rg.selectNodeContents(ch);
            for (const rc of rg.getClientRects()) {
              if (rc.width <= 0.5) continue;
              wn++; if (rc.top < minTop) minTop = rc.top; if (rc.top > maxTop) maxTop = rc.top;
            }
          }
          if (wn >= 2 && maxTop - minTop > 3) cnt('WRAPPED_LINE', { type: 'WRAPPED_LINE', severity: 'high', page: idx, col: ci, spread: Math.round((maxTop - minTop) * 10) / 10, text: (l.textContent || '').slice(0, 24) });
        }
        // **S5.1 (A2):** עטיפה בתוך ספאנים (סוגריים/סמנים/חלון) — הגלאי לעיל בודק
        // צמתי טקסט ישירים בלבד; מילת-סוגריים שנעטפה בפנים חופפת את השורה שמתחת
        // ולא נתפסה (משפחת D-92 לא נסגרה עד הסוף). ספאן בשני גבהים = עטיפה.
        for (const sp of l.querySelectorAll('span')) {
          if (!(sp.textContent || '').trim()) continue;
          const rg2 = document.createRange(); rg2.selectNodeContents(sp);
          let sMin = Infinity, sMax = -Infinity, sN = 0;
          for (const rc of rg2.getClientRects()) {
            if (rc.width <= 0.5) continue;
            sN++; if (rc.top < sMin) sMin = rc.top; if (rc.top > sMax) sMax = rc.top;
          }
          if (sN >= 2 && sMax - sMin > 3) cnt('WRAPPED_LINE', { type: 'WRAPPED_LINE', severity: 'high', page: idx, col: ci, span: String(sp.className).slice(0, 24), spread: Math.round((sMax - sMin) * 10) / 10, text: (sp.textContent || '').slice(0, 24) });
        }
        if (lr.r > cr.r + 2 || lr.x < cr.x - 2) cnt('LINE_OUTSIDE_COLUMN', { type: 'LINE_OUTSIDE_COLUMN', severity: 'high', page: idx, col: ci, dx: Math.round(Math.max(lr.r - cr.r, cr.x - lr.x)), text: (l.textContent || '').slice(0, 20) });
        if (lr.b > cr.b + 2) cnt('LINE_BELOW_COLUMN', { type: 'LINE_BELOW_COLUMN', severity: 'high', page: idx, col: ci, dy: Math.round(lr.b - cr.b), text: (l.textContent || '').slice(0, 20) });
        if (ink && (ink.r > cr.r + 2.5 || ink.x < cr.x - 2.5)) cnt('INK_OUTSIDE_COLUMN', { type: 'INK_OUTSIDE_COLUMN', severity: 'high', page: idx, col: ci, dx: Math.round(Math.max(ink.r - cr.r, cr.x - ink.x)), text: (l.textContent || '').slice(0, 20) });
        if (prevTop !== null && lr.y < prevTop - 0.5) cnt('LINE_OUT_OF_ORDER', { type: 'LINE_OUT_OF_ORDER', severity: 'high', page: idx, col: ci, text: (l.textContent || '').slice(0, 20) });
        if (!dirChecked) { if ((l.getAttribute('dir') || '') === 'rtl') S.dirOk++; else S.dirBad++; dirChecked = true; }
        if (prevTop !== null && base === 'b' && prevFlag === 'b') colRec.p.push(Math.round((lr.y - prevTop) * 10) / 10);

        if (!isLast && !isHead && !isWinWrap && words >= 2 && ink) {
          const L = ink.x - cr.x, Rg = cr.r - ink.r;
          accAdd(S.bodyL, L); accAdd(S.bodyR, Rg);
          if (L > 3 || Rg > 3) cnt('INK_NOT_JUSTIFIED', { type: 'INK_NOT_JUSTIFIED', severity: 'high', page: idx, col: ci, leftGap: Math.round(L * 10) / 10, rightGap: Math.round(Rg * 10) / 10, text: (l.textContent || '').slice(0, 20) });
          const ta = cs.textAlign, tal = cs.textAlignLast, ws = cs.whiteSpace;
          if (ws === 'nowrap') { S.bodyStyle.nowrap++; cnt('NOWRAP_BODY_LINE', { type: 'NOWRAP_BODY_LINE', severity: 'high', page: idx, col: ci, text: (l.textContent || '').slice(0, 20) }); }
          else if (ta === 'justify' && tal === 'justify') S.bodyStyle.justifyOk++;
          else { S.bodyStyle.styleOther++; cnt('STYLE_NOT_JUSTIFIED', { type: 'STYLE_NOT_JUSTIFIED', severity: 'medium', page: idx, col: ci, ta: ta, tal: tal, text: (l.textContent || '').slice(0, 20) }); }
          const fs = Math.round(parseFloat(cs.fontSize) * 10) / 10;
          S.bodyFs[fs] = (S.bodyFs[fs] || 0) + 1;
          const fam = String(cs.fontFamily).split(',')[0].trim();
          S.fontsUsed[fam] = (S.fontsUsed[fam] || 0) + 1;
        }
        if (isLast && !isWinWrap && ink && words >= 2) {
          const ta = cs.textAlign, tal = cs.textAlignLast;
          const key = ta + '/' + tal;
          S.lastAlign[key] = (S.lastAlign[key] || 0) + 1;
          if (tal === 'justify') cnt('LAST_LINE_JUSTIFIED', { type: 'LAST_LINE_JUSTIFIED', severity: 'medium', page: idx, col: ci, text: (l.textContent || '').slice(0, 20) });
          else if (ta === 'center') {
            const L = ink.x - cr.x, Rg = cr.r - ink.r;
            accAdd(S.lastSym, Math.abs(L - Rg));
            if (Math.abs(L - Rg) > 3) cnt('LAST_NOT_CENTERED', { type: 'LAST_NOT_CENTERED', severity: 'medium', page: idx, col: ci, asym: Math.round(Math.abs(L - Rg) * 10) / 10, text: (l.textContent || '').slice(0, 20) });
          } else if (ta === 'right' || ta === 'start') {
            const Rg = cr.r - ink.r;
            if (Rg > 3) cnt('LAST_RIGHT_GAP', { type: 'LAST_RIGHT_GAP', severity: 'medium', page: idx, col: ci, gap: Math.round(Rg * 10) / 10, text: (l.textContent || '').slice(0, 20) });
          }
        }
        if (isHead && ink && words >= 2) {
          const ta = cs.textAlign;
          S.headAlign[ta] = (S.headAlign[ta] || 0) + 1;
          if (ta === 'justify') cnt('HEAD_JUSTIFIED', { type: 'HEAD_JUSTIFIED', severity: 'medium', page: idx, col: ci, text: (l.textContent || '').slice(0, 20) });
          else if (ta === 'center') {
            const L = ink.x - cr.x, Rg = cr.r - ink.r;
            accAdd(S.headSym, Math.abs(L - Rg));
            if (Math.abs(L - Rg) > 3) cnt('HEAD_NOT_CENTERED', { type: 'HEAD_NOT_CENTERED', severity: 'medium', page: idx, col: ci, asym: Math.round(Math.abs(L - Rg) * 10) / 10, text: (l.textContent || '').slice(0, 20) });
          }
        }
        if (hasWin) {
          const wr = l.querySelector('.w--window').getBoundingClientRect();
          const dR = cr.r - wr.right;
          accAdd(S.winD, dR);
          if (dR > 3) cnt('WINDOW_WRONG_SIDE', { type: 'WINDOW_WRONG_SIDE', severity: 'high', page: idx, col: ci, distFromRight: Math.round(dR * 10) / 10, text: (l.textContent || '').slice(0, 20) });
          if (ink && wr.right < ink.r - 3) cnt('WINDOW_NOT_FIRST', { type: 'WINDOW_NOT_FIRST', severity: 'medium', page: idx, col: ci, text: (l.textContent || '').slice(0, 20) });
        }
        if (hasMk) {
          for (const m of l.querySelectorAll('.w--fnmarker')) {
            info.mkn++; info.mk += (m.textContent || '').trim();
            accAdd(S.markerFs, parseFloat(getComputedStyle(m).fontSize));
          }
        }
        bodyBoxes.push({ r: lr, tx: (l.textContent || '').slice(0, 20) });
        prevBox = { b: lr.b, tx: (l.textContent || '').slice(0, 20) };
        prevTop = lr.y; prevFlag = base;
      }
    });
    info.lines = totalLines;

    // הערות שוליים
    const fns = [...pg.querySelectorAll('.footnote')];
    info.fn = fns.length;
    const fnRects = [];
    for (const f of fns) {
      const fr = R(f); fnRects.push(fr);
      const txt = (f.textContent || '').trim();
      const first = txt.replace(/^\(המשך\)\s*/, '').split(/[\s\u200F]+/)[0] || '';
      info.fnMk += first;
      accAdd(S.fnFs, parseFloat(getComputedStyle(f).fontSize));
    }
    fnRects.sort((a, b) => a.y - b.y);
    for (let i = 1; i < fnRects.length; i++) {
      if (fnRects[i - 1].b - fnRects[i].y > 1) cnt('FN_OVERLAP', { type: 'FN_OVERLAP', severity: 'high', page: idx, px: Math.round(fnRects[i - 1].b - fnRects[i].y) });
    }
    for (const fr of fnRects) {
      for (const bb of bodyBoxes) {
        const ox = Math.min(fr.r, bb.r.r) - Math.max(fr.x, bb.r.x);
        const oy = Math.min(fr.b, bb.r.b) - Math.max(fr.y, bb.r.y);
        if (ox > 1 && oy > 1) { cnt('FN_OVERLAPS_BODY', { type: 'FN_OVERLAPS_BODY', severity: 'high', page: idx, fnTop: Math.round(fr.y), bodyText: bb.tx }); break; }
      }
      if (fr.b > pr.b + 2) cnt('FN_BELOW_PAGE', { type: 'FN_BELOW_PAGE', severity: 'high', page: idx, dy: Math.round(fr.b - pr.b) });
    }

    // עמוד תוכן ריק — רק בלי גוף **וגם** בלי הערות (עמוד המשך-הערות של
    // S4.24 מכיל תוכן לגיטימי ואיננו "ריק")
    if (type === 'regular' && totalLines === 0 && fns.length === 0) cnt('EMPTY_PAGE', { type: 'EMPTY_PAGE', severity: 'high', page: idx });

    // פסים (כותרות-רוחב/סימנים/שערים) — דיו בתוך תיבת הפס ומרכוז ממורכז.
    // **S4.24:** הוספו — פס ארוך מרוחבו היה גולש בשקט (הבדיקות הקודמות
    // כיסו רק את שורות הטורים).
    for (const b of pg.querySelectorAll('.band')) {
      const br = R(b);
      if (br.r > pr.r + 2 || br.x < pr.x - 2 || br.b > pr.b + 2) cnt('BAND_BOX_OUTSIDE_PAGE', { type: 'BAND_BOX_OUTSIDE_PAGE', severity: 'high', page: idx, cls: String(b.className).slice(0, 40) });
      const bink = inkOf(b);
      if (!bink) continue;
      if (bink.r > br.r + 2.5 || bink.x < br.x - 2.5) cnt('BAND_INK_OUTSIDE', { type: 'BAND_INK_OUTSIDE', severity: 'high', page: idx, dx: Math.round(Math.max(bink.r - br.r, br.x - bink.x)), text: (b.textContent || '').slice(0, 20) });
      const csB = getComputedStyle(b);
      if (csB.textAlign === 'center') {
        const asymB = Math.abs((bink.x - br.x) - (br.r - bink.r));
        if (asymB > 3) cnt('BAND_NOT_CENTERED', { type: 'BAND_NOT_CENTERED', severity: 'medium', page: idx, asym: Math.round(asymB * 10) / 10, text: (b.textContent || '').slice(0, 20) });
      }
    }
  }

  // ── סריקה ──
  if (!report.virtualized) {
    for (const pg of liveNow()) auditLive(pg);
  } else {
    const panel = document.querySelector('.tab-panel[data-tab="preview"]');
    let scroller = null;
    for (const cand of [panel, canvas]) if (cand && cand.scrollHeight > cand.clientHeight + 10) { scroller = cand; break; }
    if (!scroller) {
      cnt('NO_SCROLLER', { type: 'NO_SCROLLER', severity: 'high', detail: 'וירטואלי ללא אלמנט גולל' });
      for (const pg of liveNow()) auditLive(pg);
    } else {
      const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
      const step = Math.max(1, Math.min(3, Math.ceil(n / 300)));
      let steps = 0; const t1 = Date.now();
      for (let target = 0; target < n; target += step) {
        scroller.scrollTop = Math.round(((target + 0.5) / n) * maxScroll());
        await settle(); await sleep(20);
        for (const pg of liveNow()) auditLive(pg); steps++;
      }
      scroller.scrollTop = maxScroll(); await settle(); await sleep(20);
      for (const pg of liveNow()) auditLive(pg);
      report.sweep = { steps: steps + 1, step: step, ms: Date.now() - t1, scroller: String(scroller.className) };
    }
  }

  // ── כיסוי ──
  const missing = [];
  for (let i = 0; i < n; i++) if (!audited.has(i)) missing.push(i);
  if (missing.length) cnt('COVERAGE', { type: 'COVERAGE', severity: 'high', count: missing.length, sample: missing.slice(0, 12) });

  // ── מבנה ──
  const seq = [...audited.values()].sort((a, b) => a.i - b.i);
  const types = seq.map((p) => p.t);
  if (seq.length) {
    if (types[0] !== 'shaar-main' || types[1] !== 'shaar-back') cnt('SHAAR_ORDER', { type: 'SHAAR_ORDER', severity: 'high', got: types.slice(0, 3), expected: ['shaar-main', 'shaar-back', '…'] });
    if (!types.some((t) => t === 'shaar-sub')) cnt('NO_SHAAR_SUB', { type: 'NO_SHAAR_SUB', severity: 'medium' });
    const bodyPages = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.t));
    const bodyNoHdr = bodyPages.filter((p) => !p.h);
    if (bodyNoHdr.length) cnt('BODY_PAGES_WITHOUT_HEADER', { type: 'BODY_PAGES_WITHOUT_HEADER', severity: 'high', count: bodyNoHdr.length, pages: bodyNoHdr.map((p) => p.i).slice(0, 12) });
    const regNoFolio = seq.filter((p) => p.t === 'regular' && !p.fo);
    if (regNoFolio.length) cnt('FOLIO_MISSING', { type: 'FOLIO_MISSING', severity: 'medium', count: regNoFolio.length, pages: regNoFolio.map((p) => p.i).slice(0, 12) });
    const mainShaar = seq.find((p) => p.t === 'shaar-main');
    if (mainShaar && !mainShaar.g) cnt('SHAAR_EMPTY', { type: 'SHAAR_EMPTY', severity: 'high', page: mainShaar.i });
  }

  report.pages = seq;
  const bySeverity = {};
  for (const p of P) bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
  // **S5.1 (A4):** dir=rtl נאכף — בעבר נספר בלבד; רגרסיה שתשמיט dir עברה ירוקה.
  if (S.dirBad > 0) cnt('DIR_RTL_MISSING', { type: 'DIR_RTL_MISSING', severity: 'medium', n: S.dirBad });
  const totalProblems = Object.values(CNT).reduce((s, v) => s + v, 0);
  const fontsUsedSet = Object.keys(S.fontsUsed);
  report.stats = {
    bodyGapLeft: fin(S.bodyL), bodyGapRight: fin(S.bodyR), windowDistFromRight: fin(S.winD),
    lastCenterAsym: fin(S.lastSym), headCenterAsym: fin(S.headSym),
    markerFontSize: fin(S.markerFs), footnoteFontSize: fin(S.fnFs),
    bodyFontSizes: S.bodyFs, lastLineAlign: S.lastAlign, headingAlign: S.headAlign,
    bodyStyle: S.bodyStyle, folio: S.folio, fontsUsed: S.fontsUsed,
    dirRtlOk: S.dirOk, dirRtlBad: S.dirBad, counts: CNT, totalProblems: totalProblems
  };
  report.summary = {
    pages: seq.length, slots: n, virtualized: report.virtualized,
    sweep: report.sweep, shaarPages: types.filter((t) => /shaar/.test(t)).length,
    bodyPagesWithHeader: (function () { const bp = seq.filter((p) => /regular|sign-open|preface|h3-spread|toc/.test(p.t)); return bp.filter((p) => p.h).length + '/' + bp.length; })(),
    totalLines: seq.reduce((s, p) => s + (p.lines || 0), 0),
    observedFonts: fontsUsedSet, problems: totalProblems, bySeverity, sweepMs: Date.now() - t0
  };
  return JSON.stringify(report);
})()
