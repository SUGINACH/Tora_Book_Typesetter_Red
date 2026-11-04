// src/engine/decoration/ornament-ink.js — הדיו של העיטורים: מקור יחיד (EXT-4)
'use strict';

/**
 * **EXT-4 (צביעת עיטורים):** עד כאן העיטורים היו rectים נכונים ומבוקרים
 * (ornament-plan) בלי דיו — אין כללי .orn ב-CSS החי ו-pdf-writer לא צייר
 * כלום. כאן מוגדר מקור הדיו היחיד: לכל kindStyle — צורה וקטורית מובנית
 * (פורט מהמקור הצהוב) או SVG מספריית העיצובים (imud:...) או קו דק.
 * שלושת הצרכנים — ה-DOM (רקע data-URI), הפרויקטור וה-PDF (פענוח וקטורי
 * לפעולות מילוי) — שותפים לאותו מקור בדיוק.
 */

const { resolveAssetRef } = require('./asset-registry');

/** הצורות המובנות — פורט נאמן מ-decorations.js של המקור הצהוב:
 * pyramid = פירמידת וילנא (❖❖❖/❖❖/❖ — כאן כיהורים וקטוריים), lance = רומח
 * (spear), shoshanta = שושנתא (flourish), scroll = סלסול (swash). */
const BUILTIN_SVGS = {
  // פירמידת וילנא — 3+2+1 מעוינים; המקור השתמש בגליף ❖ בגדלים 10/9/8pt.
  pyramid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 34">
<path fill="#000" d="M20 2 L28 10 L20 18 L12 10 Z M60 2 L68 10 L60 18 L52 10 Z M100 2 L108 10 L100 18 L92 10 Z"/>
<path fill="#000" d="M40 19 L47 26 L40 33 L33 26 Z M80 19 L87 26 L80 33 L73 26 Z"/>
<path fill="#000" d="M60 24 L66 30 L60 36 L54 30 Z"/>
</svg>`,
  // רומח — פורט מהמקור (SECTION_DIVIDERS.spear) עם עיגולי הפתיחה.
  lance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 40">
<circle cx="200" cy="20" r="10" fill="none" stroke="#000" stroke-width="4.5"/>
<circle cx="200" cy="20" r="4.5" fill="#000"/>
<path d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z" fill="#000"/>
<path d="M165,20 C165,22 150,24 130,24 C95,24 55,21 30,20 C55,19 95,16 130,16 C150,16 165,18 165,20 Z" fill="#fff"/>
<path d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z" fill="#000"/>
<path d="M235,20 C235,22 250,24 270,24 C305,24 345,21 370,20 C345,19 305,16 270,16 C250,16 235,18 235,20 Z" fill="#fff"/>
</svg>`,
  // שושנתא — פורט מהמקור (flourish).
  shoshanta: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90">
<path fill="#000" d="M110,48 C105,44 92,30 82,30 C68,30 55,42 42,42 C30,42 22,32 22,22 C22,12 32,5 45,5 C60,5 72,18 78,28 C82,20 88,10 100,10 C108,10 114,16 114,24 C114,35 102,44 88,44 C72,44 58,35 48,22 C42,28 35,35 25,48 C15,62 10,72 20,82 C30,90 48,85 62,72 C78,58 92,54 110,48 Z"/>
<path fill="#000" d="M130,48 C135,44 148,30 158,30 C172,30 185,42 198,42 C210,42 218,32 218,22 C218,12 208,5 195,5 C180,5 168,18 162,28 C158,20 152,10 140,10 C132,10 126,16 126,24 C126,35 138,44 152,44 C168,44 182,35 192,22 C198,28 205,35 215,48 C225,62 230,72 220,82 C210,90 192,85 178,72 C162,58 148,54 130,48 Z"/>
</svg>`,
  // סלסול — פורט מהמקור (swash).
  scroll: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 28">
<path fill="#111" d="M10,14 C60,14 85,4 125,4 C145,4 152,11 160,17 C168,11 175,4 195,4 C235,4 260,14 310,14 C260,14 235,24 195,24 C175,24 168,17 160,11 C152,17 145,24 125,24 C85,24 60,14 10,14 Z M160,7 C157.2,7 155,9.2 155,12 C155,14.8 157.2,17 160,17 C162.8,17 165,14.8 165,12 C165,9.2 162.8,7 160,7 Z"/>
</svg>`,
};

/** הדיו של kindStyle — מקור יחיד.
 * @returns {{type:'svg', svg:string, uri:string}|{type:'rule'}|{type:'image', uri:string}|null} */
function ornamentInk(kindStyle) {
  const s = String(kindStyle || '');
  if (!s || s === 'none' || s === 'custom_img') return null;
  if (s === 'thin' || s === 'line') return { type: 'rule' };
  if (BUILTIN_SVGS[s]) {
    return { type: 'svg', svg: BUILTIN_SVGS[s], uri: svgToDataUri(BUILTIN_SVGS[s]) };
  }
  // הפניית ספריית עיצובים (imud:<collection>:<id>) — ה-SVG החיטוי מהרישום
  if (s.startsWith('imud:') || s.startsWith('data:image/svg') || /\.svg($|\?)/i.test(s)) {
    const r = resolveAssetRef(s);
    if (r && (r.uri || '').startsWith('data:image/svg')) {
      return { type: 'svg', svg: r.item ? r.item.svg : decodeDataUriSvg(r.uri), uri: r.uri };
    }
    if ((r && r.uri || '').startsWith('data:')) return { type: 'image', uri: r.uri };
    return null;
  }
  if (/^https?:|^data:image\/(png|jpe?g|gif|webp)/i.test(s)) return { type: 'image', uri: s };
  return null;
}

/** data-URI ל-SVG (percent-encoding — תואם url("...") ב-CSS). */
function svgToDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(String(svg));
}
function decodeDataUriSvg(uri) {
  try { return decodeURIComponent(String(uri).replace(/^data:image\/svg\+xml;charset=utf-8,/, '')); }
  catch (e) { return null; }
}

// ---------------------------------------------------------------------------
// פענוח SVG → רשימת ציור (תת-קבוצת ה-SVG שקיימת בפועל בקטלוגים ובצורות):
// viewBox, <g transform="translate(a,b) scale(sx,sy)">, <path d> בפקודות
// M m L l H h V v C c Q q S s T t A a Z, <circle>, <rect>, <ellipse>,
// <polygon>, <polyline>; מילוי בלבד (stroke=none בכל הקטלוג — נבדק).
// ---------------------------------------------------------------------------

/** מפענח מספרים ממחרוזת פקודות נתיב. */
function parsePathD(d) {
  const segs = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let m, cmd = null, args = [];
  const flush = () => {
    if (cmd) segs.push({ cmd: cmd.toUpperCase(), rel: cmd !== cmd.toUpperCase(), args });
    cmd = null; args = [];
  };
  while ((m = re.exec(String(d || '')))) {
    if (m[1]) { flush(); cmd = m[1]; }
    else args.push(parseFloat(m[2]));
  }
  flush();
  return segs;
}

/** המרת פקודות נתיב לרצף נקודות/בזייה במרחב ה-viewBox (absolute).
 * @returns {{subpaths: Array<Array<{op:'M'|'L'|'C', pts:number[]}>>, x0:number,y0:number}} */
function pathToSubpaths(d, transform) {
  const segs = parsePathD(d);
  const subpaths = [];
  let cur = null;      // תת-נתיב נוכחי
  let x = 0, y = 0;    // נקודה נוכחית (מרחב מקורי, לפני transform)
  let sx = 0, sy = 0;  // נקודת פתיחה של תת-הנתיב
  let lastC2x = 0, lastC2y = 0, haveLastC = false;
  const push = (op, pts) => {
    if (!cur) { cur = []; subpaths.push(cur); }
    cur.push({ op, pts: transform(pts) });
  };
  const cubicTo = (x1, y1, x2, y2, x3, y3) => { push('C', [x, y, x1, y1, x2, y2, x3, y3]); x = x3; y = y3; };
  const quadTo = (x1, y1, x2, y2) => {
    // Q → שני C (עליית מדרגה הרמיטית)
    const cx1 = x + 2 / 3 * (x1 - x), cy1 = y + 2 / 3 * (y1 - y);
    const cx2 = x2 + 2 / 3 * (x1 - x2), cy2 = y2 + 2 / 3 * (y1 - y2);
    cubicTo(cx1, cy1, cx2, cy2, x2, y2);
  };
  const arcTo = (rx, ry, rot, laf, sf, x2, y2) => {
    // קירוב קשת ב-8 מקטעי בזייה (דיוק חזותי מלא בגדלי עיטור) — endpoint→center
    const x1 = x, y1 = y;
    if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) { push('L', [x1, y1, x2, y2]); x = x2; y = y2; return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = rot * Math.PI / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
    const x1p = cosP * dx2 + sinP * dy2, y1p = -sinP * dx2 + cosP * dy2;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
    let num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num / den));
    if (laf === sf) co = -co;
    const cxp = co * rx * y1p / ry, cyp = -co * ry * x1p / rx;
    const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
    const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => {
      const dot = ux * vx + uy * vy, len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
      let a = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
      if (ux * vy - uy * vx < 0) a = -a;
      return a;
    };
    const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dTheta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sf && dTheta > 0) dTheta -= 2 * Math.PI;
    if (sf && dTheta < 0) dTheta += 2 * Math.PI;
    const N = 8;
    const delta = dTheta / N;
    const t = theta1;
    let px = x1, py = y1;
    for (let i = 1; i <= N; i++) {
      const t2 = t + delta * i;
      const px2 = cx + rx * Math.cos(t2) * cosP - ry * Math.sin(t2) * sinP;
      const py2 = cy + rx * Math.cos(t2) * sinP + ry * Math.sin(t2) * cosP;
      const tm = t + delta * (i - 0.5);
      const cmx = cx + rx * Math.cos(tm) * cosP - ry * Math.sin(tm) * sinP;
      const cmy = cy + rx * Math.cos(tm) * sinP + ry * Math.sin(tm) * cosP;
      // נקודת בקרה בזייה לקשת מעגלית: k = 4/3·tan(δ/4)
      const k = 4 / 3 * Math.tan(delta / 4);
      const c1x = px + k * (-rx * Math.cos(t + delta * (i - 1)) * sinP - ry * Math.sin(t + delta * (i - 1)) * cosP);
      const c1y = py + k * (rx * Math.cos(t + delta * (i - 1)) * cosP - ry * Math.sin(t + delta * (i - 1)) * sinP);
      const c2x = px2 - k * (-rx * Math.cos(t2) * sinP - ry * Math.sin(t2) * cosP);
      const c2y = py2 - k * (rx * Math.cos(t2) * cosP - ry * Math.sin(t2) * sinP);
      void cmx; void cmy;
      cubicTo(c1x, c1y, c2x, c2y, px2, py2);
      px = px2; py = py2;
    }
  };
  for (const { cmd, rel, args } of segs) {
    const a = args;
    switch (cmd) {
      case 'M':
        for (let i = 0; i + 1 < a.length; i += 2) {
          x = rel ? x + a[i] : a[i]; y = rel ? y + a[i + 1] : a[i + 1];
          if (i === 0) { cur = null; push('M', [x, y]); sx = x; sy = y; }
          else push('L', [x, y, x, y]);
        }
        haveLastC = false;
        break;
      case 'L':
        for (let i = 0; i + 1 < a.length; i += 2) {
          const nx = rel ? x + a[i] : a[i], ny = rel ? y + a[i + 1] : a[i + 1];
          push('L', [x, y, nx, ny]); x = nx; y = ny;
        }
        haveLastC = false;
        break;
      case 'H':
        for (const v of a) { const nx = rel ? x + v : v; push('L', [x, y, nx, y]); x = nx; }
        haveLastC = false;
        break;
      case 'V':
        for (const v of a) { const ny = rel ? y + v : v; push('L', [x, y, x, ny]); y = ny; }
        haveLastC = false;
        break;
      case 'C':
        for (let i = 0; i + 5 < a.length; i += 6) {
          const x1 = rel ? x + a[i] : a[i], y1 = rel ? y + a[i + 1] : a[i + 1];
          const x2 = rel ? x + a[i + 2] : a[i + 2], y2 = rel ? y + a[i + 3] : a[i + 3];
          const x3 = rel ? x + a[i + 4] : a[i + 4], y3 = rel ? y + a[i + 5] : a[i + 5];
          cubicTo(x1, y1, x2, y2, x3, y3);
          lastC2x = x2; lastC2y = y2; haveLastC = true;
        }
        break;
      case 'S':
        for (let i = 0; i + 3 < a.length; i += 4) {
          const x2 = rel ? x + a[i] : a[i], y2 = rel ? y + a[i + 1] : a[i + 1];
          const x3 = rel ? x + a[i + 2] : a[i + 2], y3 = rel ? y + a[i + 3] : a[i + 3];
          const x1 = haveLastC ? 2 * x - lastC2x : x, y1 = haveLastC ? 2 * y - lastC2y : y;
          cubicTo(x1, y1, x2, y2, x3, y3);
          lastC2x = x2; lastC2y = y2; haveLastC = true;
        }
        break;
      case 'Q':
        for (let i = 0; i + 3 < a.length; i += 4) {
          const x1 = rel ? x + a[i] : a[i], y1 = rel ? y + a[i + 1] : a[i + 1];
          const x2 = rel ? x + a[i + 2] : a[i + 2], y2 = rel ? y + a[i + 3] : a[i + 3];
          quadTo(x1, y1, x2, y2);
          lastC2x = x1; lastC2y = y1; haveLastC = false;
        }
        break;
      case 'T':
        for (let i = 0; i + 1 < a.length; i += 2) {
          const x2 = rel ? x + a[i] : a[i], y2 = rel ? y + a[i + 1] : a[i + 1];
          const x1 = haveLastC ? 2 * x - lastC2x : x, y1 = haveLastC ? 2 * y - lastC2y : y;
          quadTo(x1, y1, x2, y2);
          lastC2x = x1; lastC2y = y1;
        }
        break;
      case 'A':
        for (let i = 0; i + 6 < a.length; i += 7) {
          const rx = a[i], ry = a[i + 1], rot = a[i + 2];
          const laf = a[i + 3], sf = a[i + 4];
          const x2 = rel ? x + a[i + 5] : a[i + 5], y2 = rel ? y + a[i + 6] : a[i + 6];
          arcTo(rx, ry, rot, laf, sf, x2, y2);
        }
        haveLastC = false;
        break;
      case 'Z':
        if (cur && cur.length) push('L', [x, y, sx, sy]);
        x = sx; y = sy;
        haveLastC = false;
        break;
    }
  }
  return { subpaths, x, y };
}

/** פענוח SVG שלם → { vbW, vbH, shapes: [{subpaths, fill}] } (מרחב viewBox). */
function parseSvgPaint(svg) {
  const s = String(svg || '');
  if (!s) return null;
  const vb = /viewBox\s*=\s*"([^"]+)"/.exec(s);
  let vbW = 0, vbH = 0;
  if (vb) {
    const p = vb[1].trim().split(/[\s,]+/).map(Number);
    vbW = p[2] || 0; vbH = p[3] || 0;
  }
  const wm = /width\s*=\s*"([\d.]+)/.exec(s), hm = /height\s*=\s*"([\d.]+)/.exec(s);
  if (!vbW && wm) vbW = parseFloat(wm[1]);
  if (!vbH && hm) vbH = parseFloat(hm[1]);
  if (!vbW || !vbH) return null;

  // transform של <g> — תומך ב-translate(a,b) scale(sx,sy) (צורת הקטלוגים)
  let tx = 0, ty = 0, sx = 1, sy = 1;
  const gt = /<g\b[^>]*transform\s*=\s*"([^"]+)"/.exec(s);
  if (gt) {
    const tr = gt[1];
    const tm = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)/.exec(tr);
    if (tm) { tx = parseFloat(tm[1]); ty = parseFloat(tm[2]); }
    const sm = /scale\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\)/.exec(tr);
    if (sm) { sx = parseFloat(sm[1]); sy = sm[2] != null ? parseFloat(sm[2]) : sx; }
  }
  const transform = (pts) => {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      out.push(pts[i] * sx + tx, pts[i + 1] * sy + ty);
    }
    return out;
  };

  const shapes = [];
  const pushShape = (d, fillAttr, strokeAttr) => {
    if (strokeAttr && strokeAttr !== 'none') return; // קווים חיצוניים — מחוץ לתת-הקבוצה (לא קיימים בקטלוג)
    const { subpaths } = pathToSubpaths(d, transform);
    if (!subpaths.length) return;
    shapes.push({ subpaths, fill: parseColor(fillAttr) });
  };

  // <path> — fill מהאלמנט או מה-<g> שעוטף (inherit)
  const gFill = /<g\b[^>]*\bfill\s*=\s*"([^"]+)"/.exec(s);
  const gStroke = /<g\b[^>]*\bstroke\s*=\s*"([^"]+)"/.exec(s);
  const pathRe = /<path\b([^>]*)>/g;
  let m;
  while ((m = pathRe.exec(s))) {
    const attrs = m[1];
    const d = /d\s*=\s*"([^"]+)"/.exec(attrs);
    if (!d) continue;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(attrs);
    const stroke = /stroke\s*=\s*"([^"]+)"/.exec(attrs);
    pushShape(d[1], fill ? fill[1] : (gFill ? gFill[1] : '#000'), stroke ? stroke[1] : (gStroke ? gStroke[1] : 'none'));
  }
  // <circle>/<ellipse> — ארבע קשתות בזייה
  const circRe = /<(circle|ellipse)\b([^>]*)>/g;
  while ((m = circRe.exec(s))) {
    const at = m[2];
    const num = (k) => { const r = new RegExp(`\\b${k}\\s*=\\s*"([\\d.]+)"`).exec(at); return r ? parseFloat(r[1]) : null; };
    const cx = num('cx') || 0, cy = num('cy') || 0;
    const rx = m[1] === 'circle' ? (num('r') || 0) : (num('rx') || 0);
    const ry = m[1] === 'circle' ? (num('r') || 0) : (num('ry') || 0);
    if (!rx || !ry) continue;
    const k = 0.5522847498;
    const d = `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} `
      + `C ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} `
      + `C ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} `
      + `C ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(at);
    const stroke = /stroke\s*=\s*"([^"]+)"/.exec(at);
    pushShape(d, fill ? fill[1] : '#000', stroke ? stroke[1] : 'none');
  }
  // <rect>
  const rectRe = /<rect\b([^>]*)>/g;
  while ((m = rectRe.exec(s))) {
    const at = m[1];
    const num = (k) => { const r = new RegExp(`\\b${k}\\s*=\\s*"([\\d.]+)"`).exec(at); return r ? parseFloat(r[1]) : 0; };
    const x0 = num('x'), y0 = num('y'), w = num('width'), h = num('height');
    if (!w || !h) continue;
    const fill = /fill\s*=\s*"([^"]+)"/.exec(at);
    pushShape(`M ${x0} ${y0} L ${x0 + w} ${y0} L ${x0 + w} ${y0 + h} L ${x0} ${y0 + h} Z`, fill ? fill[1] : '#000', 'none');
  }
  if (!shapes.length) return null;
  return { vbW, vbH, shapes };
}

/** צבע מילוי → [r,g,b] 0..1 ('#abc', '#aabbcc', שמות בסיסיים). */
function parseColor(c) {
  const s = String(c || '').trim();
  if (!s || s === 'none' || s === 'transparent') return null;
  if (s === 'currentColor') return [0, 0, 0];
  let m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  if (m) return [parseInt(m[1] + m[1], 16) / 255, parseInt(m[2] + m[2], 16) / 255, parseInt(m[3] + m[3], 16) / 255];
  m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const named = { black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], blue: [0, 0, 1] };
  if (named[s.toLowerCase()]) return named[s.toLowerCase()];
  return [0, 0, 0]; // ברירת מחדל — שחור (כמו SVG)
}

/** פליטת פעולות PDF לציור העיטור בתוך rect (px, מרחב עמוד) עם התאמת
 * 'meet' (preserveAspectRatio) — מרכז התמונה במרכז התיבה בלי עיוות.
 * @param {object} paint — פלט parseSvgPaint
 * @param {{x,y,w,h}} rectPx — יעד בפיקסלים (שיטת הפרויקטור)
 * @param {number} hPt — גובה העמוד ב-pt (היפוך y)
 * @param {number} PX_TO_PT
 * @returns {string[]} פעולות PDF (m/l/c/h/f + rg) */
function svgToPdfOps(paint, rectPx, hPt, PX_TO_PT) {
  const { vbW, vbH, shapes } = paint;
  // meet: סקייל אחיד מרבי שנכנס, ממורכז
  const s = Math.min(rectPx.w / vbW, rectPx.h / vbH);
  const drawW = vbW * s, drawH = vbH * s;
  const offX = rectPx.x + (rectPx.w - drawW) / 2;
  const offY = rectPx.y + (rectPx.h - drawH) / 2;
  const X = (vx) => (offX + vx * s) * PX_TO_PT;
  const Y = (vy) => hPt - (offY + vy * s) * PX_TO_PT;
  const r2 = (v) => Math.round(v * 100) / 100;
  const ops = [];
  for (const sh of shapes) {
    const col = sh.fill || [0, 0, 0];
    ops.push(`${r2(col[0])} ${r2(col[1])} ${r2(col[2])} rg`);
    for (const sub of sh.subpaths) {
      let started = false;
      for (const seg of sub) {
        const p = seg.pts;
        if (seg.op === 'M') {
          if (started) ops.push('h f');
          ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`);
          started = true;
        } else if (seg.op === 'L') {
          if (!started) { ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`); started = true; }
          ops.push(`${r2(X(p[2]))} ${r2(Y(p[3]))} l`);
        } else if (seg.op === 'C') {
          if (!started) { ops.push(`${r2(X(p[0]))} ${r2(Y(p[1]))} m`); started = true; }
          ops.push(`${r2(X(p[2]))} ${r2(Y(p[3]))} ${r2(X(p[4]))} ${r2(Y(p[5]))} ${r2(X(p[6]))} ${r2(Y(p[7]))} c`);
        }
      }
      if (started) ops.push('h f');
    }
  }
  return ops;
}

/** תיבת הדיו **המדויקת** של הצורות הממוקמות בתוך rect (אותה התאמת
 * 'meet' כמו svgToPdfOps) — לחישוב inkBounds של המודל מול הרסטר.
 * @returns {{minX,minY,maxX,maxY}|null} בפיקסלים (מרחב עמוד) */
function svgInkBBox(paint, rectPx) {
  const { vbW, vbH, shapes } = paint;
  const s = Math.min(rectPx.w / vbW, rectPx.h / vbH);
  const drawW = vbW * s, drawH = vbH * s;
  const offX = rectPx.x + (rectPx.w - drawW) / 2;
  const offY = rectPx.y + (rectPx.h - drawH) / 2;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const sh of shapes) {
    if (sh.fill == null) continue; // צורה בלי מילוי — אין דיו
    for (const sub of sh.subpaths) {
      for (const seg of sub) {
        const p = seg.pts;
        for (let i = 0; i + 1 < p.length; i += 2) {
          const x = offX + p[i] * s, y = offY + p[i + 1] * s;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
  }
  if (minX === Infinity) return null;
  return { minX, minY, maxX, maxY };
}

module.exports = {
  BUILTIN_SVGS, ornamentInk, svgToDataUri,
  parseSvgPaint, svgToPdfOps, svgInkBBox, parsePathD, pathToSubpaths, parseColor
};
