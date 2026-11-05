// סריקת דטרמיניזם — טביעת-אצבע גאומטרית של כל העמודים (סוג + מיקומי שורות
// בכל טור). מושווה מול הרצה קודמת — כל הבדל = אי-דטרמיניזם.
(async function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = () => new Promise((res) => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; try { requestAnimationFrame(() => requestAnimationFrame(fin)); } catch (e) {} setTimeout(fin, 120); });
  const TYPES = ['shaar-main', 'shaar-back', 'shaar-sub', 'toc-general', 'toc-detail', 'blank', 'sign-open', 'preface', 'endnotes', 'h3-spread', 'filler', 'custom', 'regular'];
  const typeOf = (pg) => { const cls = String(pg.className || ''); for (const t of TYPES) if (cls.includes('page--' + t)) return t; return 'unknown'; };
  const out = { pages: [] };
  const canvas = document.querySelector('.preview-canvas');
  const slots = canvas ? [...canvas.querySelectorAll(':scope > .preview-page')] : [...document.querySelectorAll('.page')];
  const n = slots.length;
  const liveNow = () => (canvas ? [...canvas.querySelectorAll(':scope > .preview-page:not(.preview-page--placeholder)')] : [...document.querySelectorAll('.page')]);
  const audited = new Map();
  const grab = (pg) => {
    const idx = Number(pg.getAttribute('data-page-index'));
    if (!Number.isFinite(idx) || audited.has(idx)) return;
    const rec = { i: idx, t: typeOf(pg), cols: [] };
    for (const c of pg.querySelectorAll('.column')) {
      rec.cols.push([...c.children].map((l) => Math.round(l.getBoundingClientRect().top * 10)));
    }
    audited.set(idx, rec);
  };
  let scroller = null;
  for (const cand of [document.querySelector('.tab-panel[data-tab="preview"]'), canvas]) {
    if (cand && cand.scrollHeight > cand.clientHeight + 10) { scroller = cand; break; }
  }
  if (!scroller) {
    for (const pg of liveNow()) grab(pg);
  } else {
    const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
    const step = Math.max(1, Math.min(3, Math.ceil(n / 300)));
    for (let target = 0; target < n; target += step) {
      scroller.scrollTop = Math.round(((target + 0.5) / n) * maxScroll());
      await settle(); await sleep(20);
      for (const pg of liveNow()) grab(pg);
    }
    scroller.scrollTop = maxScroll(); await settle(); await sleep(20);
    for (const pg of liveNow()) grab(pg);
  }
  out.pages = [...audited.values()].sort((a, b) => a.i - b.i);
  return JSON.stringify(out);
})()
