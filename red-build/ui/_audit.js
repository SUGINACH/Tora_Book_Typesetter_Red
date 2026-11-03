// layout-audit.js — runs INSIDE the live page via agent-browser eval
// Pure-code verification of rendered layout (no human eyes needed).
(() => {
  const R = (el) => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,r:r.right,b:r.bottom}; };
  const pages = [...document.querySelectorAll('.page')];
  const report = { pageCount: pages.length, pages: [], problems: [] };

  pages.forEach((pg, pi) => {
    const pr = R(pg);
    const cs = getComputedStyle(pg);
    const pageInfo = {
      idx: pi,
      rect: pr,
      classes: pg.className,
      header: null, columns: [], lines: 0, ornaments: []
    };
    // running header?
    const hdr = pg.querySelector('.running-head, .hdr, .page-header, [class*="hdr"]');
    if (hdr) { const hr = R(hdr); pageInfo.header = { text: hdr.textContent.trim().slice(0,40), rect: hr, fs: getComputedStyle(hdr).fontSize, ff: getComputedStyle(hdr).fontFamily.slice(0,40) }; }
    // ornaments / decorations
    pageInfo.ornaments = [...pg.querySelectorAll('.orn, .ornament, .divider, [class*="orn"], [class*="divider"]')].map(o => o.className).slice(0,5);
    // columns
    const cols = [...pg.querySelectorAll('.column, .col')];
    cols.forEach((c, ci) => {
      const cr = R(c); const ccs = getComputedStyle(c);
      const colInfo = { idx: ci, rect: cr, position: ccs.position, font: ccs.fontFamily.slice(0,50), fontSize: ccs.fontSize, lines: [] };
      const lines = [...c.children];
      pageInfo.lines += lines.length;
      lines.forEach((ln, li) => {
        const lr = R(ln);
        const lcs = getComputedStyle(ln);
        colInfo.lines.push({ i: li, cls: ln.className, text: ln.textContent.slice(0,25), rect: lr, ff: lcs.fontFamily.slice(0,45), fs: lcs.fontSize, ta: lcs.textAlign });
      });
      pageInfo.columns.push(colInfo);
    });
    report.pages.push(pageInfo);
  });

  // === PROBLEM DETECTION ===
  // 1. Overlapping lines within the same column
  report.pages.forEach(pg => {
    pg.columns.forEach(col => {
      for (let i = 0; i < col.lines.length; i++) {
        for (let j = i+1; j < col.lines.length; j++) {
          const a = col.lines[i].rect, b = col.lines[j].rect;
          const ox = Math.min(a.r,b.r) - Math.max(a.x,b.x);
          const oy = Math.min(a.b,b.b) - Math.max(a.y,b.y);
          if (ox > 1 && oy > 1) report.problems.push({ type: 'LINE_OVERLAP', page: pg.idx, col: col.idx, a: col.lines[i].text, b: col.lines[j].text, overlapX: +ox.toFixed(1), overlapY: +oy.toFixed(1) });
        }
      }
    });
  });
  // 2. Lines overflowing their column box
  report.pages.forEach(pg => pg.columns.forEach(col => col.lines.forEach(ln => {
    if (ln.rect.x < col.rect.x - 2 || ln.rect.r > col.rect.r + 2 || ln.rect.y < col.rect.y - 2 || ln.rect.b > col.rect.b + 2)
      report.problems.push({ type: 'LINE_OUTSIDE_COLUMN', page: pg.idx, col: col.idx, text: ln.text });
  })));
  // 3. Zero-width / collapsed lines (all stacked at one X = "notepad" or right-crammed)
  report.pages.forEach(pg => pg.columns.forEach(col => {
    const xs = col.lines.map(l => +l.rect.x.toFixed(0));
    const uniqX = [...new Set(xs)];
    if (col.lines.length > 3 && uniqX.length <= 2) report.problems.push({ type: 'SINGLE_X_STACK', page: pg.idx, col: col.idx, uniqX, hint: 'all lines share same X — notepad look / no column flow' });
  }));
  // 4. Headers missing on non-gate pages
  report.pages.forEach(pg => { if (!pg.header && !/shaar|gate|title/.test(pg.classes)) report.problems.push({ type: 'NO_RUNNING_HEADER', page: pg.idx }); });
  // 5. Gate page (shaar) presence at all
  const hasGate = pages.some(p => /shaar|gate/.test(p.className)) || document.querySelectorAll('.shaar-box, [class*="shaar"]').length > 0;
  if (!hasGate) report.problems.push({ type: 'NO_GATE_PAGE_ANYWHERE' });
  // 6. Font sanity — do lines actually get IMUD fonts (not serif/sans default)?
  const fonts = new Set();
  report.pages.forEach(pg => pg.columns.forEach(col => col.lines.forEach(ln => fonts.add(ln.ff.split(',')[0]))));
  report.observedFonts = [...fonts];
  // 7. Text direction — Hebrew must not be jammed to right edge with tiny width
  report.pages.forEach(pg => pg.columns.forEach(col => {
    if (col.lines.length && col.rect.w > 0) {
      const avgW = col.lines.reduce((s,l)=>s+l.rect.w,0) / col.lines.length;
      if (avgW < col.rect.w * 0.25) report.problems.push({ type: 'CRAMMED_RIGHT', page: pg.idx, col: col.idx, avgLineW: +avgW.toFixed(0), colW: +col.rect.w.toFixed(0), hint: 'lines occupy <25% of column width, crammed' });
    }
  }));
  return JSON.stringify(report);
})()
