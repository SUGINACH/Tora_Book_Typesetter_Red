// src/engine/output/dom-renderer.js — DOM render (browser) + PUA scrub invariant (REQ-PAR-05, BRZ-13)
'use strict';

/**
 * רנדור עמודים ל‑DOM. כללי יסוד:
 * - U+E000/U+E101 חייבים להיעלם מה‑DOM הסופי (scrub לפני render; נשמרים רק לשלב המדידה).
 * - כיווניות RTL מלאה; no !important על inline של עיטורים (F-09 — מקור שליטה יחיד).
 * - מיפוי סוג עמוד → מחלקת CSS: regular/shaar/preface/sign-open/endnotes/toc/filler.
 *
 * **עדכוני סגירת S7:**
 *  - סמני הערות מ‑notes/markers (מקור אחיד — P1-3); מקטעי פיצול הערה ארוכה
 *    מסומנים class fn--continuation עם תוספת "(המשך)".
 *  - background-opacity ⇒ rgba() אמיתי (בעבר נכתב לתכונת CSS בלתי קיימת — P0-5).
 *  - paren-style-scale ⇒ מילים בתוך סוגריים ב‑span.w--paren (D-42).
 *  - column-divider-style ⇒ חוט מפריד בין הטורים, גובה Math.min−8px (overlay — geometry-neutral).
 *  - עמודי הערות: כותרת + רשימת הערות (S7.1.1).
 *  - הערות צד: מיקום מוחלט לפי yTop/x מה‑placement (S7.1.2).
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

// **S4.10:** סוגי עמודי מנוע המורשת (legacy-imud-flow) — מיפוי למחלקות ה-CSS.
// 'toc-detailed' אצלנו (בייחוס toc-detail) ו-'blank' ייחודי למורשת.
const LEGACY_PT_CLASS = {
  'toc-detailed': 'page page--toc page--toc-detail',
  'blank': 'page page--blank',
  'sign-open': 'page page--sign-open'
};

const ATOMIC_SPACE = '\uE000';
const PAREN_MARK = '\uE101';

/** scrub חובה: אף תו PUA פנימי לא יוצא החוצה (BRZ-13 / S2.2). */
function scrubPUAText(s) {
  // BRZ-13: כל תווי ה‑PUA הפנימיים (E000 רווח אטומי, E101 סוגריים, E102 תג סמן) — נאספים לפני רנדר
  return String(s).split(ATOMIC_SPACE).join(' ').split(PAREN_MARK).join('').split('\uE102').join('');
}

/** rgba() אמיתי מ‑background-color + background-opacity (תיקון P0-5). */
function bgRgba(color, opacity) {
  const hex = String(color || '#ffffff');
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  const op = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
  if (!m) return hex; // שם־צבע/תבנית אחרת — כמו שהוא
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${op})`;
}

/**
 * S7 — צריכת footnote-marker-style (enum) דרך מקור אחיד: notes/markers.
 * (בעבר היה כאן ממיר מקומי שני — אי־עקביות מספור, P1-3.)
 */
const { markerFor } = require('../notes/markers');
const { planDecorations } = require('../decoration/page-decorations');
const { resolveShaarBox } = require('../decoration/shaar-boxes');
const { columnDividerHeightPx } = require('../decoration/ornament-fit');
const { resolveAssetRef } = require('../decoration/asset-registry');
const { ornamentInk } = require('../decoration/ornament-ink'); // **03.11:** imud: → data-URI
const { MM_TO_PX } = require('../layout/page-templates');
const { isCssFrame } = require('../decoration/folio'); // **S9:** מסגרות גיליון CSS (circle/square)
const { lineFontSizePt, lineFontFamily, ptToPx } = require('./line-font');
const { buildShaarBlocks, shaarFontOf } = require('./shaar-content'); // **03.11(ד)** // **03.11(ג):** מקור יחיד לגופן/גודל שורה

/** S9 — body-last-line-align (center|right|stretch): יישור שורה אחרונה של פסקה. */
function lastLineClass(ln, settings) {
  if (!ln.isLast) return '';
  const mode = settings['body-last-line-align'] || 'center';
  if (mode === 'right') return ' line--last-right';
  if (mode === 'stretch') return ' line--last-stretch';
  return ' line--last-center';
}

/** **03.11(ד):** מחסנית גופן — תומכת גם בערך מרובה־משפחות ("'A', 'B', serif"
 * מהמקור). גרשיים מנוטרלים (הזרקה בטוחה ל-CSS), משפחות גנריות (serif/sans-serif)
 * עוברות כמו שהן, ופולבאקים עבריים נוספים רק אם אינם כבר ברשימה. */
function fontStack(family) {
  // ניקוי לפי משפחה: גרשיים מוסרים, ותווים מסוכנים להזרקת CSS (; : { } / וכו')
  // נפסלים — נשארים אותיות (לטיניות ועבריות), ספרות, רווחים ומקפים בלבד.
  const safe = (x) => String(x || '').replace(/'/g, '').replace(/[^\w\u0590-\u05FF\uFB1D-\uFB4F\s-]/g, '').trim();
  const parts = String(family || '').split(',').map(safe).filter(Boolean);
  if (!parts.length) return '';
  const out = [];
  const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i;
  for (const p of parts) {
    out.push(GENERIC.test(p) ? p : `'${p}'`);
  }
  for (const fb of ['Frank Ruhl Libre', 'David', 'serif']) {
    const plain = `'${fb}'`;
    if (!out.includes(plain) && !out.includes(fb)) out.push(GENERIC.test(fb) ? fb : plain);
  }
  return out.join(', ');
}

function renderLine(ln, doc, settings = {}) {
  const el = doc.createElement('div');
  el.className = 'line' + (ln.isLast ? ' line--last' + lastLineClass(ln, settings) : '');
  el.setAttribute('dir', 'rtl');
  // **03.11(ג) (תיקון "החלפת גופן לא עושה כלום"):** גודל/גופן השורה מההגדרות —
  // אותו מקור (line-font) כמו הפרויקטור. בלי זה התצוגה מציגה הכול בגודל/גופן
  // שורש המסמך והתצוגה אינה מגיבה לשינויי גופן/גודל.
  const lnPt = lineFontSizePt(ln, settings);
  if (Number.isFinite(lnPt) && lnPt > 0) el.style.fontSize = `${ptToPx(lnPt)}px`;
  const lnFont = lineFontFamily(ln, settings);
  if (lnFont) el.style.fontFamily = fontStack(lnFont);
  // **EXT-20 (AQ אנכי אמיתי):** מקדם ה-AQ הוא מקדם גובה-שורה — כאן הוא
  // מיושם כ-line-height מפורש (px) כמו בפרויקטור וב-PDF. בעבר הוחל כאן
  // wordSpacing אופקי (‏(factor−1)×4px) — שלושה נתיבים, שלוש פרשנויות,
  // והגובה מעולם לא השתנה. כעת: שדה אחד, משמעות אחת.
  if (ln.aqStretch && ln.aqStretch !== 1 && Number.isFinite(ln.heightPx)) {
    el.style.lineHeight = `${Math.round(ln.heightPx * ln.aqStretch * 100) / 100}px`;
  }
  // **S8 (F-08):** הזמנת עיטורי H2 בתוך תיבת השורה — הטקסט יורד/עולה ב־padding;
  // הגובה כבר תוקצב בפריסה, הרנדור רק מצייר בתוך התיבה (מקור יחיד — F-09).
  if (ln.h2OrnPadTop) el.style.paddingTop = `${ln.h2OrnPadTop}px`;
  if (ln.h2OrnPadBottom) el.style.paddingBottom = `${ln.h2OrnPadBottom}px`;
  // **S11 (REQ-PAR-06):** הזמנת עיטורים מקושרים של סגנון מותאם — אותו דפוס (F-08).
  if (ln.csOrnPadTop) el.style.paddingTop = `${ln.csOrnPadTop}px`;
  if (ln.csOrnPadBottom) el.style.paddingBottom = `${ln.csOrnPadBottom}px`;
  // **S11 (REQ-PAR-06):** סגנון ברמת הבלוק — class + סגנון מובנה + מונה גלוי בשורה הראשונה.
  if (ln.customStyle) {
    el.className += ' custom-style';
    el.dataset.style = ln.customStyle.id || '';
    applyCustomStyleSpec(el, ln.customStyle.styleSpec, doc);
    if (ln.csCounterMark) {
      const cm = doc.createElement('span');
      cm.className = 'cs-counter';
      cm.textContent = ln.csCounterMark;
      prependChild(el, cm);
    }
  }
  // **D-42:** מילים בתוך סוגריים — span.w--paren עם font-size בסקאלה (geometry-neutral).
  // מילים רגילות — span.w אחיד (מיצג גם ב‑DOM אמיתי וגם ב‑shim של הבדיקות).
  // **S11:** טווחי inline מסגנון מותאך — span.w--custom עם data-style (גודל מוחל כבר במדידה).
  const parenScale = Number(settings['paren-style-scale']) || 1;
  const words = (ln.words || []).map(w => scrubPUAText(w));
  const spans = ln.parenSpans || [];
  const customs = ln.customSpans || [];
  if ((spans.length && parenScale !== 1) || customs.length) {
    for (let i = 0; i < words.length; i++) {
      const span = doc.createElement('span');
      const cIdx = customs.findIndex(c => c.wi === i);
      if (cIdx >= 0) {
        span.className = 'w w--custom';
        span.dataset.style = customs[cIdx].styleId;
      } else if (spans.includes(i)) {
        span.className = 'w w--paren';
        span.style.fontSize = `${Math.round(parenScale * 100)}%`;
      } else {
        span.className = 'w';
      }
      span.textContent = words[i];
      el.appendChild(span);
    }
  } else {
    el.textContent = words.join(' ');
  }
  const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
  if (tok) el.dataset.token = tok;
  return el;
}

/** **S11:** הכנסת ילד ראשון — insertBefore כשיש; fallback ל־unshift (תאימות ל־shims של הבדיקות). */
function prependChild(el, node) {
  if (typeof el.insertBefore === 'function') el.insertBefore(node, el.firstChild || null);
  else { (el.children || (el.children = [])).unshift(node); node.parentNode = el; }
}

/** **S11 (REQ-PAR-06):** החלת סגנון מותאם על יסוד DOM — מקור יחיד לכל מוצרי הדגל. */
function applyCustomStyleSpec(el, spec, doc) {
  void doc;
  if (!spec || typeof spec !== 'object') return;
  if (spec.fontSizePt) el.style.fontSize = `${spec.fontSizePt}pt`;
  if (spec.bold) el.style.fontWeight = '700';
  if (spec.italic) el.style.fontStyle = 'italic';
  if (spec.color) el.style.color = spec.color;
  if (spec.background) el.style.background = spec.background;
  if (spec.border) el.style.borderRight = `3px solid ${typeof spec.border === 'string' ? spec.border : '#1a1a1a'}`;
  if (spec.indentEm) { el.style.paddingRight = `${spec.indentEm}em`; el.style.marginRight = `${spec.indentEm}em`; }
  if (spec.align) el.style.textAlign = spec.align === 'stretch' ? 'justify' : spec.align;
  if (spec.letterSpacingEm) el.style.letterSpacing = `${spec.letterSpacingEm}em`;
  if (spec.textTransform === 'small-caps') el.style.fontVariant = 'small-caps';
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
  // סמן אחיד (notes/markers) + סימון המשך למקטעי פיצול (S7.1.3 long-note policy)
  for (const n of page.footnotes) {
    const marker = n.marker || markerFor(Number.isInteger(n.docIndex) ? n.docIndex : (n.markerNum || 1), settings['footnote-marker-style']);
    const el = doc.createElement('div');
    const cont = n.isContinuation || n.mode === 'split-rest';
    el.className = 'footnote' + (cont ? ' fn--continuation' : '') + (n.customStyle ? ' footnote--custom' : '');
    if (n.customStyle) el.dataset.style = n.customStyle;
    el.dir = 'rtl';
    el.textContent = `${cont ? '(המשך) ' : ''}${marker}\u200F ${scrubPUAText(n.text || n)}`;
    area.appendChild(el);
  }
  return area;
}

/** **S9 (D-61):** גיליון עמוד — מקור יחיד לכל סוגי העמודים (בעבר 4 העתקים).
 * מסגרות CSS (circle/square) מרונדרות כ‑badge עם מחלקה; הטקסטואליות כבר בתוך התצוגה. */
function renderFolio(page, settings, doc) {
  if (!page.folioDisplay || settings['page-num-position'] === 'none') return null;
  const folio = doc.createElement('footer');
  folio.className = `folio folio--${settings['page-num-position']} folio--frame-${settings['page-num-frame']}`;
  if (isCssFrame(settings['page-num-frame'])) {
    const badge = doc.createElement('span');
    badge.className = `page-num-badge page-num-frame-${settings['page-num-frame'] === 'circle' ? 'circle' : 'box'}`;
    badge.textContent = page.folioDisplay;
    folio.appendChild(badge);
  } else {
    folio.textContent = page.folioDisplay;
  }
  return folio;
}

function renderHeader(header, doc) {
  if (!header) return null;
  const el = doc.createElement('div');
  el.className = `running-head head--sep-${header.separator}`;
  el.dir = 'rtl';
  // **S9 (D-61):** צורה חדשה {slots} עם עצמאות מלאה לכל סלוט (מקור/יישור/גופן/גודל/רוחב);
  // תאימות לאחור לצורה הישנה ({right,center,left}) לבדיקות ≤S8.
  const slots = header.slots || { right: header.right, center: header.center, left: header.left };
  for (const pos of ['right', 'center', 'left']) {
    const s = slots[pos];
    if (!s) continue;
    const slot = doc.createElement('span');
    slot.className = `head-slot head-slot--${pos} align-${s.align}`;
    slot.style.width = `${s.widthPct}%`;
    if (s.font) slot.style.fontFamily = s.font;
    if (s.sizePt) slot.style.fontSize = `${Math.round(s.sizePt * (96 / 72) * 100) / 100}px`;
    slot.textContent = scrubPUAText(s.text || '');
    el.appendChild(slot);
  }
  return el;
}

/** **S9 (REQ-HDR-05):** תוכן עמוד תוכן־עניינים — שורות עם נקודות מובילות, תווית
 * גיליון בפורמט המספור, וקישורי עוגן לחיצים (#page‑N; יעדי PDF ייבנו ב‑S12). */
function renderTocPageContent(page, doc) {
  const els = [];
  const t = page.toc || {};
  if (t.title) {
    const el = doc.createElement('h2');
    el.className = 'toc-page-title';
    el.dir = 'rtl';
    el.textContent = scrubPUAText(t.title);
    els.push(el);
  }
  const wrap = doc.createElement('div');
  wrap.className = 'toc-rows';
  wrap.dir = 'rtl';
  for (const r of (t.rows || [])) {
    if (r.kind === 'group') {
      // קבוצה (inline רצוף): "כותרת – עמוד | כותרת – עמוד" בשורה אחת (IMUD grp-item/grp-sep)
      const g = doc.createElement('div');
      g.className = `toc-row toc-row--group toc-lvl-${r.items[0] ? r.items[0].level : 1}`;
      for (const it of r.items) {
        const a = doc.createElement('a');
        a.className = `toc-item toc-lvl-${it.level}`;
        if (it.targetPage != null) a.setAttribute('href', `#page-${it.targetPage}`);
        a.setAttribute('data-anchor', it.anchorId || '');
        const txt = doc.createElement('span'); txt.className = 'grp-title';
        txt.textContent = scrubPUAText(it.text);
        const lab = doc.createElement('span'); lab.className = 'grp-page';
        lab.textContent = it.label || '';
        a.appendChild(txt); a.appendChild(lab);
        g.appendChild(a);
      }
      wrap.appendChild(g);
    } else {
      const a = doc.createElement('a');
      a.className = `toc-row toc-lvl-${r.level}` + (r.inline ? ' toc-row--inline' : '');
      if (r.targetPage != null) a.setAttribute('href', `#page-${r.targetPage}`);
      a.setAttribute('data-anchor', r.anchorId || '');
      if (r.rowNum != null) {
        const n = doc.createElement('span'); n.className = 'toc-num'; n.textContent = String(r.rowNum);
        a.appendChild(n);
      }
      const title = doc.createElement('span');
      title.className = 'toc-title';
      title.textContent = scrubPUAText(r.wrapped && r.wrapped.length ? r.wrapped.join(' ') : r.text);
      const dots = doc.createElement('span'); dots.className = 'toc-dots';
      const label = doc.createElement('span'); label.className = 'toc-label';
      label.textContent = r.label || '';
      a.appendChild(title); a.appendChild(dots); a.appendChild(label);
      wrap.appendChild(a);
    }
  }
  els.push(wrap);
  return els;
}

/** חוט מפריד בין טורים (overlay; גובה Math.min −8px — כלל V4; geometry-neutral).
 * גובה החישוב מקור יחיד: ornament-fit.columnDividerHeightPx (F-09 — לא עותק מקומי). */
function renderColumnDivider(page, settings, doc) {
  const style = settings['column-divider-style'];
  if (!style || style === 'none' || page.columns.length < 2) return null;
  const used = page.columns.map(col => col.reduce((s, ln) => s + (ln.heightPx || 0), 0));
  const h = columnDividerHeightPx(used);
  if (h <= 0) return null;
  const el = doc.createElement('div');
  el.className = `col-divider col-divider--${style}`;
  const c0 = page.template.columns[0], c1 = page.template.columns[1];
  el.style.left = `${Math.round(c1.x + c1.w + (page.template.gutter || 0) / 2)}px`;
  el.style.top = `${page.template.contentBox.top}px`;
  el.style.height = `${h}px`;
  return el;
}

/**
 * **S8 (FWD-1):** פס כותרת חוצה־טורים — שורות הכותרת שנמדדו ברוחב מלא,
 * מרונדרות בפס עליון חוצה־טורים מעל שני הטורים.
 */
function renderSpanningBand(page, settings, doc) {
  if (!page.spanning || !page.spanning.lines.length) return null;
  const band = doc.createElement('div');
  band.className = 'spanning-band';
  band.dir = 'rtl';
  // **S11 (REQ-PAR-06):** פס callout מסגנון מותאם — class + סגנון מובנה (full-width).
  if (page.spanning.customStyle) {
    band.className += ' custom-style';
    band.dataset.style = page.spanning.customStyle.id || '';
    applyCustomStyleSpec(band, page.spanning.customStyle.styleSpec, doc);
    if (page.spanning.customStyle.counterMark) {
      const cm = doc.createElement('span');
      cm.className = 'cs-counter';
      cm.textContent = page.spanning.customStyle.counterMark;
      prependChild(band, cm);
    }
  }
  const spanTop = page.template.contentBox.top;
  band.style.top = `${spanTop}px`;
  band.style.height = `${page.spanning.heightPx}px`;
  const left = Math.min(...page.template.columns.map(c => c.x));
  const right = Math.max(...page.template.columns.map(c => c.x + c.w));
  band.style.left = `${Math.round(left)}px`;
  band.style.width = `${Math.round(right - left)}px`;
  for (const ln of page.spanning.lines) band.appendChild(renderLine(ln, doc, settings));
  return band;
}

/**
 * **S8 (REQ-ORN-01..04):** כל העיטורים נציירים מה־rect שחושב בפאס העיטורים
 * (ornament-plan) — הרנדרר לא קובע ממדים משלו (F-09: מקור שליטה יחיד).
 * **EXT-4 (הדיו):** kindStyle מקבל דיו — SVG מובנה/מספרייה כרקע data-URI,
 * או קו דק (thin). עד כאן התיבות היו בלתי-נראות (אין כללי .orn ב-CSS).
 */
function renderDecorations(page, doc) {
  const els = [];
  for (const d of (page.decorations || [])) {
    const el = doc.createElement('div');
    el.className = d.cssClass || 'orn';
    el.dataset.slot = d.slot || '';
    el.dataset.kindStyle = d.kindStyle || '';
    el.style.left = `${Math.round(d.x)}px`;
    el.style.top = `${Math.round(d.y)}px`;
    el.style.width = `${Math.round(d.w)}px`;
    el.style.height = `${Math.round(d.h)}px`;
    // **03.11 (EXT-14):** עיטור מסוג 'image' — רקע מההפניה הפתורה (asset-registry)
    if (d.image) {
      const uri = assetUri(d.image);
      if (uri) {
        el.style.backgroundImage = `url("${uri}")`;
        el.style.backgroundSize = '100% 100%';
        el.style.backgroundRepeat = 'no-repeat';
      }
    } else if (d.kindStyle && d.kindStyle !== 'none') {
      // **EXT-4:** הדיו של kindStyle — מקור יחיד (ornament-ink): SVG מובנה
      // (pyramid/lance/shoshanta/scroll) או מספריית העיצובים (imud:...) —
      // רקע data-URI מותאם לתיבה; 'thin' — קו מפריד דק.
      const ink = ornamentInk(d.kindStyle);
      if (ink && ink.type === 'svg') {
        el.style.backgroundImage = `url("${ink.uri}")`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundPosition = 'center center';
        el.style.backgroundRepeat = 'no-repeat';
      } else if (ink && ink.type === 'rule') {
        el.style.borderTop = '0.75px solid #000';
        el.style.height = '0px';
      } else if (ink && ink.type === 'image') {
        el.style.backgroundImage = `url("${ink.uri}")`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundPosition = 'center center';
        el.style.backgroundRepeat = 'no-repeat';
      }
    }
    els.push(el);
  }
  return els;
}

/** **03.11 (EXT-14):** פתרון נכס — הפניות imud: מתורגמות ל-data-URI מהרישום
 * (asset-registry); ערכים אחרים (URL/data-URI קיים) עוברים כמו שהם. */
function assetUri(ref) {
  if (!ref) return null;
  const r = resolveAssetRef(ref);
  return r.uri || null;
}

/**
 * **S8 (REQ-ORN-05/08):** רקע עמוד + תיבות שער לפי התוכנית שחושבה (page-decorations)
 * — רקע לפי מחלקת העמוד עם inset במ״מ; תיבת טקסט של שער ראשי לפי box פתור.
 * **03.11 (EXT-14):** שלושת השערים (ראשי/משנה/אחורי) — עיצוב ה־SVG במסך מלא +
 * תיבת כותרת מה-box של העיצוב (רישום נכסים) או מההגדרות.
 */
function renderPageBackgroundAndShaar(page, settings, doc, metadata) {
  const els = [];
  const plan = planDecorations(page, settings);
  const inset = plan.background ? plan.background.insetPx : 0;
  if (plan.background && plan.background.image) {
    const el = doc.createElement('div');
    el.className = 'deco deco--page-background';
    el.style.backgroundImage = `url("${assetUri(plan.background.image) || plan.background.image}")`;
    el.style.inset = `${inset}px`;
    els.push(el);
  }
  if (plan.background && plan.background.texture) {
    const el = doc.createElement('div');
    el.className = 'deco deco--page-texture';
    el.style.backgroundImage = `url("${assetUri(plan.background.texture) || plan.background.texture}")`;
    els.push(el);
  }
  // עזר: שער במסך מלא מהפניה פתורה + תיבת כותרת לפי box מהעיצוב (אם נרשם)
  const fullShaar = (slotName, cssClass, boxClass) => {
    const slot = plan.slots.find(s => s.slot === slotName && s.asset);
    if (!slot) return;
    const resolved = resolveAssetRef(slot.asset);
    const uri = resolved.uri || slot.asset;
    const bg = doc.createElement('div');
    bg.className = cssClass;
    bg.style.backgroundImage = `url("${uri}")`;
    bg.style.inset = '0';
    els.push(bg);
    // תיבת כותרת — מה-box של העיצוב ברישום (מ״מ) או מההגדרות; בלי box מהעיצוב —
    // ה-fallback המסורתי של resolveShaarBox (REQ-ORN-05: התיבה תמיד נבנית על שער עם תמונה)
    const designBox = resolved.item && resolved.item.box ? resolved.item.box : null;
    const boxRef = designBox || settings['shaar-main-box'] || null;
    {
      const { box } = resolveShaarBox('main', settings['theme-set-id'] || 'default', { box: boxRef }, null, { top: 40, bottom: 40, right: 30, left: 30 });
      const tb = doc.createElement('div');
      tb.className = boxClass;
      tb.dir = 'rtl';
      tb.style.top = `${Math.round(box.top * MM_TO_PX)}px`;
      tb.style.bottom = `${Math.round(box.bottom * MM_TO_PX)}px`;
      tb.style.left = `${Math.round(box.left * MM_TO_PX)}px`;
      tb.style.right = `${Math.round(box.right * MM_TO_PX)}px`;
      const bookName = (settings['imud-book-title'] || (metadata && (metadata['שם הספר'] || metadata['ספר'] || metadata['title']))) || ''; // S4.5: גם המזהה הארוך + על
      const topic = (settings['imud-book-subtitle'] || (metadata && (metadata['נושא מפורט'] || metadata['נושא']))) || ''; // 03.11: כותרת־משנה מוגדרת
      tb.textContent = [bookName, topic].filter(Boolean).join(' · ');
      els.push(tb);
    }
  };
  fullShaar('shaar-main', 'deco deco--shaar-main', 'shaar-main-box');
  fullShaar('shaar-sub', 'deco deco--shaar-sub', 'shaar-sub-box');
  fullShaar('shaar-back-frame', 'deco deco--shaar-back', 'shaar-back-box');
  return els;
}

/**
 * **S8 (PT-09):** עמוד מותאם — תוכן קבוע/תיבות/תמונות במיקומים שהוגדרו (מ״מ→פיקסלים).
 */
function renderCustomPageContent(page, doc) {
  const els = [];
  if (!page.custom) return els;
  for (const b of (page.custom.boxes || [])) {
    const el = doc.createElement('div');
    el.className = 'custom-box';
    el.dir = 'rtl';
    el.style.left = `${b.x}px`; el.style.top = `${b.y}px`;
    el.style.width = `${b.w}px`; el.style.height = `${b.h}px`;
    el.textContent = scrubPUAText(b.text || '');
    els.push(el);
  }
  for (const im of (page.custom.images || [])) {
    const el = doc.createElement('div');
    el.className = 'custom-image';
    el.style.left = `${im.x}px`; el.style.top = `${im.y}px`;
    el.style.width = `${im.w}px`; el.style.height = `${im.h}px`;
    el.style.backgroundImage = `url("${im.src}")`;
    els.push(el);
  }
  return els;
}

/** **03.11(ד) — תוכן מובנה של עמודי השער (פורט renderMainShaar/renderSubShaar/
 * renderBackShaar של המקור). המודל (בלוקים/תיבה/פריסה) חי ב-shaar-content.js —
 * מקור יחיד שצורך גם ההיטל ל-PDF (F-09); כאן רק ההקרנה ל-DOM.
 * עד כאן עמוד שער בלי עיצוב־תמונה היה עמוד ריק לגמרי — "אין עמודי שער"
 * מבחינת המשתמש. המבנה, התיבות והגדלים נאמנים למקור. */
function renderShaarContent(page, settings, doc, metadata) {
  const model = buildShaarBlocks(page, settings, metadata);
  if (!model) return [];
  const els = [];
  const px = (pt) => `${ptToPx(pt)}px`;

  const wrap = doc.createElement('div');
  const variant = page.type === 'shaar-main' ? 'main' : page.type === 'shaar-sub' ? 'sub' : 'back';
  wrap.className = `shaar-content shaar-content--${variant}`;
  wrap.dir = 'rtl';
  wrap.style.top = `${model.box.top}px`;
  wrap.style.bottom = `${model.box.bottom}px`;
  wrap.style.right = `${model.box.right}px`;
  wrap.style.left = `${model.box.left}px`;

  for (const b of model.blocks) {
    if (b.graphic) {
      const el = doc.createElement('div');
      el.className = 'shaar-crown';
      el.innerHTML = b.graphic === 'crown-sub'
        ? '<svg viewBox="0 0 300 30"><path d="M10,15 Q75,5 140,15 Q145,10 150,5 Q155,10 160,15 Q225,5 290,15 Q225,25 160,15 Q155,20 150,25 Q145,20 140,15 Q75,25 10,15 Z" fill="#222"/></svg>'
        : '<svg viewBox="0 0 400 40"><circle cx="200" cy="20" r="10" fill="none" stroke="#000" stroke-width="4.5"/><circle cx="200" cy="20" r="4.5" fill="#000"/><path d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z" fill="#000"/><path d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z" fill="#000"/></svg>';
      wrap.appendChild(el);
      continue;
    }
    const el = doc.createElement('div');
    el.className = b.cls;
    el.dir = 'rtl';
    const fam = shaarFontOf(b.cls, settings);
    if (fam) el.style.fontFamily = fontStack(fam);
    if (b.sizePt > 0) el.style.fontSize = px(b.sizePt);
    if (b.bold) el.style.fontWeight = '700';
    if (b.letterSpacingPx) el.style.letterSpacing = `${b.letterSpacingPx}px`;
    el.textContent = scrubPUAText(String(b.text == null ? '' : b.text));
    wrap.appendChild(el);
  }
  els.push(wrap);
  return els;
}

/**
 * רנדור עמוד שלם. @param {object} page - תוצר dp-planner + header + numbersByIndex
 * **03.11(ד):** header ברירת מחדל = page.header — הצינור מחשב ומצמיד כותרת עליונה
 * לכל עמוד (pipeline), וכל קורא שלא מעביר ארגומנט מקבל אותה אוטומטית. עד כאן
 * התצוגה החיה (preview-tab) לא העבירה כלום והייצוא העביר מטא־נתונים בטעות —
 * שני הנתיבים הציגו עמודים בלי כותרת עליונה בזמן שהבדיקות העבירו את הארגומנט
 * במפורש ולא תפסו את הנתק (דיווח משתמש 3: "אין כותרות עליונות").
 */
/**
 * **S4.10 — רנדור DOM של עמוד legacy-imud-flow (התצוגה החיה).**
 *
 * הגיאומטריה כולה כבר מחושבת במנוע המורשת ב-px@96 (מכויל מהייחוס):
 * פסים (סימן/h2/h0/h3), שערים, טורים (ימני 403.61 / שמאלי 120.72, רוחב 269.41),
 * הערות תחתית, הערות צד בשוליים, שורות TOC, כותרת עליונה תלת-סלוטית ועמודון.
 * הרנדר מצייר אותה גיאומטריה בדיוק — מה שרואים בתצוגה = מה שיוצא ב-PDF
 * (legacy-projector) — אותו מקור אמת אחד.
 */
function renderLegacyPage(pg, settings, doc) {
  const { GEO, SZ, parenCenterRaisePx } = require('../layout/legacy-imud-flow');
  const BAND_X = GEO.COL_L_X;
  const BAND_W = 2 * GEO.COL_W + 13.48;
  // **S4.26 (גופני ברירת המחדל בכל האלמנטים):** גוף ההערה, הערות-הצד,
  // הכותרות ושורות ה-TOC — כל אחד מקבל את הגופן שהוגדר לו (עד כאן הכל
  // ירש את גופן הגוף). הכותרות מודגשות (כמו ה-DavidLibre-Bold של הייחוס).
  const imudSetAll = (settings && settings._imudRaw) || {};
  const fontOf = (k) => { const v = settings[k]; return v ? fontStack(v) : null; };
  const headingFontOf = (level) => fontOf('heading-' + level + '-font');
  const HEADING_LEVEL_OF_BAND = { 'h0-title': 0, 'h2-siman': 2, 'h2-title': 2, 'h3-title': 3 };
  const root = doc.createElement('article');
  root.className = LEGACY_PT_CLASS[pg.type] || PT_CLASS[pg.type] || 'page';
  root.dataset.pageIndex = String(pg.index);
  root.setAttribute('id', `page-${pg.index}`);
  root.dir = 'rtl';
  root.style.width = `${GEO.PAGE_W}px`;
  root.style.height = `${GEO.PAGE_H}px`;
  root.style.position = 'relative';
  root.style.overflow = 'hidden';
  const bf = settings['body-font'];
  if (bf) root.style.fontFamily = fontStack(bf);
  const pt2px = (pt) => pt * (96 / 72);
  const position = (el, x, y, w, h) => {
    el.style.position = 'absolute';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    if (w != null) el.style.width = `${w}px`;
    if (h != null) el.style.height = `${h}px`;
  };
  // **S5.1 (איחוד מודל הבסיס — "תצוגה = ייצוא"):** גובה השורה בתצוגה = גובה
  // התיבה מהמודל (בדיוק כמו baselineOf של המקרן ל-PDF וכמו line-height:1.34
  // של המקור). בעבר היה קבוע 1.1 — הטקסט ישב בראש התיבה ולא ממרוז בה,
  // בזמן שה-PDF מרכז — הפרש אנכי שיטתי בכל שורה (2–4px).
  const mkLine = (text, sizePt, align, lhPx = 0) => {
    const el = doc.createElement('div');
    el.className = 'line';
    el.setAttribute('dir', 'rtl');
    el.style.fontSize = `${pt2px(sizePt)}px`;
    el.style.lineHeight = (lhPx && lhPx > 0) ? `${lhPx}px` : '1.1';
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'visible';
    el.style.textAlign = align;
    // **S4.24 (מרכוז פסים בתצוגה החיה):** כלל ה-text-align-last:justify של
    // BASE_CSS (.line:not(.line--last):not(.line--heading)) חל גם על קווי
    // הפס וההערות-צד (class="line …") — שורה בודדת בבלוק נחשבת "אחרונה"
    // וה-justify דרס את ה-center/right: מילים פזורות מקצה לקצה, מילה
    // בודדת נדבקת לקצה הימני (נמדד בחי: "הקדמה" אסימטריה 494px). ערך
    // inline גובר על הכלל.
    el.style.textAlignLast = 'auto';
    el.textContent = scrubPUAText(text);
    return el;
  };

  // ---- כותרת עליונה תלת-סלוטית (פס 42.6–57.6pt ⇒ px) ----
  // **D-89:** צבע כחול-הייחוס #0F1749 — כמו במקרן ה-legacy (נמדד בייחוס).
  const hs = pg.headerSlots;
  if (hs && (hs.right || hs.center || hs.left)) {
    const hdr = doc.createElement('div');
    hdr.className = 'running-head';
    hdr.setAttribute('dir', 'rtl');
    // **S5.1 (מיקום סלוטי הכותרת מהייחוס):** התיבה הקודמת [60, 733.7] הצמידה
    // את הסלוטים לקצוות הדף — 94px/97px ממיקום הטקסט בייחוס (עמ' 12:
    // ימין x1=479.84pt=639.8px, שמאל x0=117.68pt=156.9px, מרכז 297.65pt).
    // הקבועים משוקפים מ-mk() של המקרן (COL_R_X+COL_W−33 / COL_L_X+33) —
    // מרכז התיבה = מרכז הדף בדיוק. התצוגה = הייצוא = הייחוס.
    // **S5.2 (O3 — ריתוק דטרמיניסטי של הבסיס):** במקום flex baseline
    // (תלוי-פלטפורמה: 67.6–73.6px מול 71.9 ב-PDF) — סלוטים אבסולוטיים
    // בתוך אותה תיבה; הבסיס = HEADER_BASELINE (71.9) באמצעות line-height:1
    // + מטריקות DavidLibre-Bold (asc 0.7461 / desc 0.2192 ⇒ היסט 0.7635·S),
    // ומשקל 700 מפורש (פנים ה-Bold הרשומים). מרכז = מרכז הדף (כמו ה-PDF),
    // לא מרכז space-between.
    position(hdr, GEO.COL_L_X + 33, 52, (GEO.COL_R_X + GEO.COL_W - 33) - (GEO.COL_L_X + 33), 22);
    hdr.style.color = 'rgb(15,23,73)';
    const HDR_BASELINE_Y = 71.9;
    const DLB_BASELINE_FACTOR = 0.5 + (0.7461 - 0.2192) / 2; // DavidLibre-Bold, line-height:1
    const slots = [
      ['rh rh--r', hs.right, SZ.hdrR, 'header-recto-right-font', 'right'],
      ['rh rh--c', hs.center, SZ.hdrC, 'header-recto-center-font', 'center'],
      ['rh rh--l', hs.left, SZ.hdrL, 'header-recto-left-font', 'left']
    ];
    for (const [cls, txt, sz, fk, posKind] of slots) {
      if (!txt) continue;
      const s = doc.createElement('span');
      s.className = cls;
      s.textContent = txt;
      const szPx = pt2px(sz);
      s.style.fontSize = `${szPx}px`;
      const ff = fontOf(fk);
      if (ff) s.style.fontFamily = ff; // **S4.26:** גופן הסלוט מההגדרות (ברירת מחדל: David Libre)
      s.style.fontWeight = '700';
      s.style.position = 'absolute';
      s.style.lineHeight = '1';
      s.style.top = `${(HDR_BASELINE_Y - 52) - szPx * DLB_BASELINE_FACTOR}px`;
      if (posKind === 'right') s.style.right = '0';
      else if (posKind === 'left') s.style.left = '0';
      else { s.style.left = '50%'; s.style.transform = 'translateX(-50%)'; }
      hdr.appendChild(s);
    }
    root.appendChild(hdr);
  }

  // ---- פסים: סימן/h2/h0/h3 — ממורכזים ברוחב הפס ----
  for (const b of (pg.bands || [])) {
    const el = mkLine(b.text, b.sizePt, 'center', b.h || pt2px(b.sizePt) * 1.1);
    el.className += ` band band--${b.kind || 'title'}`;
    // **S4.26:** גופן הכותרת מההגדרות + הדגשה — כמו הייחוס (DavidLibre-Bold)
    const hLv = HEADING_LEVEL_OF_BAND[b.kind];
    if (hLv != null) {
      const hf = headingFontOf(hLv);
      if (hf) { el.style.fontFamily = hf; el.style.fontWeight = '700'; }
    }
    position(el, BAND_X, b.y, BAND_W, b.h);
    root.appendChild(el);
  }

  // ---- תוכן השערים ----
  // **D-89:** צבע פר-שורה (בלוקי השער האחורי — הקבועים של renderBackShaar)
  // ותיבת התוכן של כל שער — כמו במקרן ה-legacy (sub: מרכז 245.7px; back: 548px;
  // main: 396.85px — מכויל מהייחוס עמ' 1/2/7).
  {
    const MMpx = 96 / 25.4;
    const GATE_BOX = {
      'shaar-main': { x: 15 * MMpx, w: GEO.PAGE_W - 30 * MMpx },
      'shaar-back': { x: 95 * MMpx, w: 377.98 },
      'shaar-sub': { x: 15 * MMpx, w: GEO.PAGE_W - 110 * MMpx }
    };
    const gbox = GATE_BOX[pg.type] || { x: BAND_X, w: BAND_W };
    for (const g of (pg.gateLines || [])) {
      const el = mkLine(g.text, g.sizePt, 'center', pt2px(g.sizePt) * 1.3);
      el.className += ' band band--gate';
      position(el, gbox.x, g.y, gbox.w, pt2px(g.sizePt) * 1.3);
      // **S4.26 (הערה):** גופני השערים (LiaSgula/Livorna ⇒ Bellefair/David Libre)
      // נבדקו והוחזרו — wrapGate מודד את שורות השער בגופן הגוף, ורינדור בגופן
      // אחר גרם לגלישת 4px מהתיבה (BAND_INK_OUTSIDE, עמ' 20 בקורפוס הגדול).
      // עד למדידת-שער ייעודית — השערים בגופן הגוף (כמו כיול D-89).
      if (Array.isArray(g.color)) {
        el.style.color = `rgb(${Math.round(g.color[0] * 255)},${Math.round(g.color[1] * 255)},${Math.round(g.color[2] * 255)})`;
      }
      root.appendChild(el);
    }
  }

  // ---- טורים: ימני ואז שמאלי; preface/shaar/toc = טור רחב יחיד ----
  const isSingle = pg.type === 'preface' || pg.type === 'toc-general' || pg.type === 'toc-detailed'
    || String(pg.type || '').startsWith('shaar');
  const colDefs = isSingle
    ? [{ x: GEO.COL_L_X, w: BAND_W }]
    : [{ x: GEO.COL_R_X, w: GEO.COL_W }, { x: GEO.COL_L_X, w: GEO.COL_W }];
  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  pg.columns.forEach((colLines, ci) => {
    const def = colDefs[Math.min(ci, colDefs.length - 1)];
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    position(colEl, def.x, GEO.FLOW_TOP, def.w, GEO.FLOW_H);
    colEl.style.overflow = 'visible';
    for (const ln of colLines) {
      const el = doc.createElement('div');
      // **S4.11:** line--heading מסמן שורות כותרת מרובעות (ממורכזות מטבען)
      // — האודיט החי מדלג עליהן בבדיקת היישור בלי סובלנות על סמך יחס.
      el.className = 'line' + (ln.isLast ? ' line--last' : '') + (ln.kind === 'heading' ? ' line--heading' : '');
      el.setAttribute('dir', 'rtl');
      el.style.position = 'absolute';
      el.style.right = '0';
      el.style.top = `${(ln.y || 0) - GEO.FLOW_TOP}px`;
      el.style.width = `${def.w}px`;
      // **תיבת השורה = גובה המסגרת מהמנוע (pitch):** בלי גובה מפורש, שורת
      // חלון (1.5×) מנפחת את התיבה וחופפת את השורה הבאה במדידת ה-DOM
      // (האודיט החי מדווח LINE_OVERLAP). התוכן עשוי לגלוש ויזואלית — כמו
      // line-height:0.85 של מילת-החלון במקור — אבל התיבה נשארת בגובה הפס.
      el.style.height = `${ln.heightPx || 16}px`;
      el.style.fontSize = `${pt2px(ln.sizePt || SZ.body)}px`;
      // **S5.1 (איחוד מודל הבסיס):** שורות גוף/חלון — line-height = גובה
      // התיבה מהמודל (מרכוז half-leading, כמו baselineOf ב-PDF וכמו
      // line-height:1.34=21.44px של המקור; בסיס השורה הראשונה ≈122px מול
      // 107.2+14.8 בייחוס). כותרות inline נשארות בראש התיבה ('1') — כמו
      // הייחוס (S4.14: גליפי הכותרת בראש השורה) וכמו y+0.6 במקרן.
      el.style.lineHeight = ln.kind === 'heading' ? '1' : `${ln.heightPx || 16}px`;
      el.style.overflow = 'visible';
      // **S4.23 (דיווח משתמש: "יישור שורות לא נכון" בתצוגה החיה):** שורות גוף
      // מלאות עוברות ל-white-space:normal + text-align:justify
      // **וגם text-align-last:justify** — בדיוק כמו BASE_CSS של שאר הנתיבים
      // (03.11(ד): "טורים מיושרים באופן מושלם"). שתי הסיבות שבגללן התצוגה
      // הייתה קטסטרופה (נמדד בפועל: פערי קצה-שמאל 2..53px, חלקן גלשו מהטור):
      //   1) inline nowrap דרס את BASE_CSS — ו-justify על שורת nowrap הוא
      //      אפס-פעולה;
      //   2) **גם בלי nowrap**: לפי הוראת CSS שורה יחידה בבלוק נחשבת "השורה
      //      האחרונה" ולעולם אינה נמתחת ע"י justify. כל .line כאן הוא בלוק
      //      בן-שורה-אחת מתוכנן (השבירה כבר נעשתה במנוע) — ולכן הדבר היחיד
      //      שמותח אותה הוא text-align-last:justify (נתמך בכרום/פיירפוקס).
      // הדפדפן מותח רווחים בין-מילים — אותה נוסחה של המקרן ל-PDF
      // (projectLine: spaceW=(colW-sumW)/gaps) — התצוגה = הייצוא.
      // שורות אחרונות/כותרות נשארות nowrap+center (חד-שורתיות מטבען;
      // מסומנות ומדולגות באודיט). סדר ההצהרות חשוב: רק שורות גוף מלאות
      // מקבלות את text-align-last — אחרת הוא היה מיישר גם שורות אחרונות
      // (שהגדרתן center/right) ומקורן של הסמנים.
      // **S5.2 (S5 — חיווט body-last-line-align במורשת):** ברירת המחדל 'center'
      // = ההתנהגות הקיימת בדיוק; 'right' = הצמדה לתחילת השורה (ימין ב-RTL),
      // 'stretch' = יישור מלא גם לשורה האחרונה. בעבר המפתח סווג 'light' אך
      // מעולם לא מומש בנתיב החי — שינוי הגדרה לא שינה דבר.
      const lastAlign = String((settings && settings['body-last-line-align']) || 'center');
      if (ln.kind === 'heading') {
        el.style.whiteSpace = 'nowrap';
        el.style.textAlign = 'center';
      } else if (ln.isLast) {
        if (lastAlign === 'right') {
          el.style.whiteSpace = 'nowrap';
          el.style.textAlign = 'right';
        } else if (lastAlign === 'stretch') {
          el.style.whiteSpace = 'normal';
          el.style.textAlign = 'justify';
          el.style.textAlignLast = 'justify';
        } else {
          el.style.whiteSpace = 'nowrap';
          el.style.textAlign = 'center';
        }
      } else {
        el.style.whiteSpace = 'normal';
        el.style.textAlign = 'justify';
        el.style.textAlignLast = 'justify';
      }
      // **S4.26 (גופן כותרות inline):** h4/h5/h6 בגופן הרמה מההגדרות + הדגשה
      if (ln.kind === 'heading' && ln.level != null) {
        const hf = headingFontOf(ln.level);
        if (hf) { el.style.fontFamily = hf; el.style.fontWeight = '700'; }
      }
      // **S4.26 (חלון קלאסי שקוע — שורה 1 עוטפת את החלון):** במקור מילת-החלון
      // מרחפת (float:right, height:1.25em) והטקסט עוטף אותה בשתי השורות
      // הראשונות. שורה 1 (window בלי windowWords) מוצרת ברוחב החלון ומוזזת
      // מימין — המודל כבר מדד אותה ברוחב המוקטן (limitOf של breakPara);
      // עד כאן היא נמתחה בחזרה לרוחב מלא. המחלקה מסמנת לאודיט לדלג על בדיקת
      // היישור (השפה הימנית תפוסה ע"י החלון — בכוונה).
      if (ln.window && !ln.windowWords && ln.windowW) {
        el.className += ' line--window-wrap';
        el.style.right = `${ln.windowW}px`;
        el.style.width = `${Math.max(40, def.w - ln.windowW)}px`;
      }
      if (ln.window && ln.windowWords && ln.windowWords.length) {
        // מילת-חלון (1.5×) בשפה הימנית + הטקסט — תיבה אחת, בסיס משותף
        // **S4.15:** גופן החלון של המקור — FrankReal משקל 900 (הוכח מהייחוס:
        // 116 מילות-חלון נמדדו — התאמה מושלמת ל-FrankReal-Bold.ttf). המשפחות
        // הנופלות מגובוות ב-CSS (BASE_CSS: .w--window) — ברירת מחדל גוף.
        const win = doc.createElement('span');
        win.className = 'w w--window';
        win.textContent = scrubPUAText(ln.windowWords.join(' ')) + ' ';
        win.style.fontSize = `${pt2px((ln.sizePt || SZ.body) * 1.5)}px`;
        // **S5.1:** בסיס החלון 2px מתחת לבסיס שורת הטקסט — כמו winBase=baseY+2
        // במקרן (מכויל מהייחוס: חלון 155.25 מול שורה 153.75, ~1.5pt). בלי זה
        // החלון יושב על בסיס משותף עם הגוף וגבוה ב-2px ב-PDF.
        win.style.verticalAlign = '-2px';
        el.appendChild(win);
      }
      // **D-89 (דיווח משתמש: "כל מילה שצמודה לנקודה מופיעה בגופן קטן"):**
      // סמני ההערות מוקטנים לפי markerIdx של המודל — בדיוק כמו במקרן
      // ה-legacy/PDF. מספור האיות ("א. ב. ג.") נשאר בגודל הגוף — כמו הייחוס.
      // **S4.24 (אודיט חי מלא על הקובץ הגדול — 154 ממצאי דיו):** מילים בתוך
      // סוגריים מרונדרות כאן בגודל השורה (12pt) בעוד השובר מודד אותן בגודל
      // הסוגריים (10pt — parenDelta; הייחוס: פסקאות-הסוגריים כולן ב-10.0pt).
      // תוצאה: שורה אחרונה/כותרת של פסקת-סוגריים רחבה מהטור ב-×1.2 וגולשת
      // ממנו שמאלה (נמדד באתר החי: 78 INK_OUTSIDE_COLUMN עד 156px, 73
      // LAST_NOT_CENTERED, 3 HEAD_NOT_CENTERED — כולן שורות-סוגריים).
      // התיקון משקף את placeWords של המקרן ל-PDF: מילת-סוגריים ב-span
      // בגודל 10pt, מוגבהת ב-0.33×גודל-השורה (בסיס משותף כמו baselineY).
      // בנוסף: (א) כותרות אינן מקבלות כיווץ-סוגריים (השבירה מודדת אותן
      // בגודל הכותרת); (ב) מילת-RLM בלבד מודבקת לשכנתה — בלי רווח פנטום
      // שמ�זיז את המרכוז (נמדד: אסימטריה 3.8px); (ג) הרווח בין שתי מילים
      // בתוך (...) ב-span של 10pt — כמו spaceBetween בשבירה (התצוגה =
      // הייצוא, כמו S4.23).
      {
        const markerSet = new Set(Array.isArray(ln.markerIdx) ? ln.markerIdx : []);
        const imudSet = (settings && settings._imudRaw) || {};
        const markerSz = Number(imudSet['note-marker-size']) || 8;
        const parenPx = pt2px(SZ.body + SZ.parenDelta);
        const hostPx = pt2px(ln.sizePt || SZ.body);
        // **S4.26 (דיווח משתמש: "ממוקם גבוה ביחס לטקסט הרגיל"):** מרכוז אנכי
        // — מרכז גובה הסוגריים מותאם למרכז גובה הטקסט הרגיל (אותו מודל
        // תיבת-שורה כמו baselineY של המקרן: parenCenterRaisePx). במקום ההגבהה
        // העיוורת 0.33×גודל-השורה (5.3px!) — עכשיו ≈0.7px בלבד.
        const parenRaise = parenCenterRaisePx(pg.ascentEm, ln.sizePt || SZ.body, SZ.body + SZ.parenDelta).toFixed(2);
        const isHeading = ln.kind === 'heading';
        const srcWords = ln.words || [];
        const nW = srcWords.length;
        // **S4.24 (דגלי קצה מהמודל — מקור יחיד):** parenStarts/parenEnds
        // של השבירה; נפילה — שחזור עומק-תווים (אותו אלגוריתם כמו breakPara).
        let parenIdx = null, pStarts = null, pEnds = null;
        if (!isHeading && Array.isArray(ln.parenFlags) && ln.parenFlags.length === nW) {
          parenIdx = new Set();
          ln.parenFlags.forEach((p, i) => { if (p) parenIdx.add(i); });
          if (Array.isArray(ln.parenStarts) && ln.parenStarts.length === nW && Array.isArray(ln.parenEnds) && ln.parenEnds.length === nW) {
            pStarts = ln.parenStarts; pEnds = ln.parenEnds;
          }
        } else if (!isHeading && nW) {
          parenIdx = new Set();
          const st = [], en = [];
          let depth = 0;
          srcWords.forEach((w, i) => {
            let any = false, s = false, e = false;
            for (let c = 0; c < w.length; c++) {
              const ch = w[c];
              if (ch === '(') depth++;
              const inP = depth > 0;
              if (inP) any = true;
              if (c === 0) s = inP;
              e = inP;
              if (ch === ')' && depth > 0) depth--;
            }
            if (any) parenIdx.add(i);
            st.push(s); en.push(e);
          });
          pStarts = st; pEnds = en;
        }
        // **S4.24 (מילים של תווי-כיוון בלבד — בלי רווח פנטום):** מילה המורכבת
        // מתווי כיוון (RLM/LRM וכו') היא ברוחב אפס, אבל הרווח שמפריד אותה
        // משכנתה נכלל בתיבת השורה ומזיז את המרכוז (נמדד בחי: אסימטריה
        // 3.8px בשורות אחרונות, עמ' 572). הדבקה לשכן — הכיווניות נשמרת,
        // הרווח הפנטום נעלם; נמדד-לעולם-גדול מהרינדר ⇒ אין חשש לגלישה.
        const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
        const items = [];
        for (let wi = 0; wi < nW; wi++) {
          const w = srcWords[wi];
          if (FORMAT_WORD_RE.test(w)) {
            if (items.length) { items[items.length - 1].text += w; continue; }
            items.push({ text: w, wi: -1 }); // מובילה — תודבק למילה הבאה
            continue;
          }
          const it = { text: w, wi };
          if (items.length === 1 && items[0].wi === -1) { it.text = items[0].text + w; items[0] = it; }
          else items.push(it);
        }
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          const w = it.text;
          const wi = it.wi;
          if (wi >= 0 && markerSet.has(wi)) {
            const m = doc.createElement('span');
            m.className = 'w w--fnmarker';
            m.textContent = scrubPUAText(w);
            m.style.fontSize = `${pt2px(markerSz)}px`;
            m.style.verticalAlign = 'super';
            el.appendChild(m);
          } else if (!isHeading && wi >= 0 && parenIdx && parenIdx.has(wi)) {
            const s = doc.createElement('span');
            s.className = 'w w--paren';
            s.textContent = scrubPUAText(w);
            s.style.fontSize = `${parenPx}px`;
            s.style.verticalAlign = `${parenRaise}px`;
            el.appendChild(s);
          } else {
            el.appendChild(doc.createTextNode(scrubPUAText(w)));
          }
          if (k < items.length - 1) {
            // **S4.24 (רווח בגודל הסוגריים בתוך ה-span):** כמו spaceBetween
            // בשבירה — הרווח בין שתי מילים ששני צדדיהן בתוך (...) ב-10pt.
            // בלי זאת שורת-סוגריים אחרונה גולשת מהטור (נמדד בחי: 4px, עמ' 403).
            const a = items[k].wi, b = items[k + 1].wi;
            const parenSpace = !isHeading && a >= 0 && b === a + 1 && pStarts && pEnds && !!pEnds[a] && !!pStarts[b];
            if (parenSpace) {
              const sp = doc.createElement('span');
              sp.className = 'w w--paren-space';
              sp.style.fontSize = `${parenPx}px`;
              sp.textContent = ' ';
              el.appendChild(sp);
            } else {
              el.appendChild(doc.createTextNode(' '));
            }
          }
        }
      }
      if (ln.tokenId != null) el.dataset.tokenId = String(ln.tokenId);
      colEl.appendChild(el);
    }
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  // ---- הערות צד בטורי השוליים ----
  // **S4.26:** גופן הערות-הצד מההגדרות (ברירת מחדל: Hadassah Friedlaender
  // — כמו המדידה במנוע וכמו הייחוס); עד כאן ירשו את גופן הגוף.
  {
    const mnFont = fontOf('heading-7-font');
    for (const mn of (pg.marginNotes || [])) {
      const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
      for (const l of (mn.lines || [])) {
        const el = mkLine(l.text, SZ.marginNote, 'right', GEO.MN_PITCH);
        el.className += ' margin-note';
        if (mnFont) el.style.fontFamily = mnFont;
        position(el, x, l.y, GEO.MARGIN_W, GEO.MN_PITCH);
        root.appendChild(el);
      }
    }
  }

  // ---- הערות שוליים (תחתית) ----
  // **S4.26 (דיווח משתמש — בעיות 3–5):** (א) מצב רציף (ברירת מחדל): כל
  // הערות העמוד זורמות בבלוק אחד — הערה הבאה פותחת באותה שורה שבה הסתיימה
  // קודמתה (רווח-כפול בין הערות); (ב) יישור לשני הצדדים — שורות הביניים
  // מתוחות, השורה האחרונה לימין (כמו .note-line של המקור); (ג) המשך
  // מקודם — '(המשך)' בלי אות סימון; (ד) גופן גוף-ההערה מההגדרות
  // (f-note-body — Frank Ruhl Libre) — כמו המדידה (fnApi) במנוע.
  {
    const fnFont = fontOf('f-note-body-font') || fontOf('body-font');
    const listingSz = Number(imudSetAll['note-listing-num-size']) || 8;
    for (const fn of (pg.footnotes || [])) {
      // **S4.26:** זרימה שפותחת בהמשך — מסומנת fn--continuation (כמו block)
      const firstTok = fn.continuous && fn.lines[0] && (fn.lines[0].words || []).find(t => !t.gap);
      const flowIsCont = !!(firstTok && firstTok.t === '(המשך)');
      const el = doc.createElement('div');
      el.className = 'footnote' + ((fn.cont || flowIsCont) ? ' fn--continuation' : '') + (fn.continuous ? ' fn--flow' : '');
      el.setAttribute('dir', 'rtl');
      const lines = fn.lines || [];
      const y0 = lines[0] ? lines[0].y : GEO.FLOW_TOP;
      const h = lines.length * GEO.FN_PITCH;
      position(el, GEO.COL_L_X, y0, BAND_W, h);
      el.style.fontSize = `${pt2px(SZ.fnBody)}px`;
      el.style.lineHeight = `${GEO.FN_PITCH}px`;
      if (fnFont) el.style.fontFamily = fnFont;
      el.style.textAlign = 'justify';
      el.style.textAlignLast = 'right';
      el.style.whiteSpace = 'normal';
      if (fn.continuous) {
        // זרימה רציפה — הדפדפן שובר ומיישב (אותו רוחב/גופן כמו fnFlowFor);
        // סמנים בגודל הרישום; רווח-כפול בין הערות (nbsp — כמו הגאפ במודל).
        let prevGap = true;
        for (const l of lines) {
          for (const t of (l.words || [])) {
            if (t.gap) { el.appendChild(doc.createTextNode('\u00A0 ')); prevGap = true; continue; }
            if (!prevGap) el.appendChild(doc.createTextNode(' '));
            prevGap = false;
            const s = doc.createElement('span');
            if (t.mk) {
              s.className = 'w w--fnmarker';
              s.style.fontSize = `${pt2px(listingSz)}px`;
            }
            s.textContent = scrubPUAText(t.t);
            el.appendChild(s);
          }
        }
      } else {
        // מצב block — כל הערה בלוק משלה, מיושבת לשני הצדדים (בעבר: לימין בלבד)
        if (fn.cont) {
          const p = doc.createElement('span');
          p.className = 'fn-cont';
          p.textContent = '(המשך) ';
          el.appendChild(p);
        }
        if (fn.marker) {
          const m = doc.createElement('span');
          m.className = 'w w--fnmarker';
          m.style.fontSize = `${pt2px(listingSz)}px`;
          m.textContent = scrubPUAText(fn.marker);
          el.appendChild(m);
          el.appendChild(doc.createTextNode(' '));
        }
        el.appendChild(doc.createTextNode(scrubPUAText(lines.map(l => (Array.isArray(l.words) ? l.words : String(l.words).split(' ')).join(' ')).join(' '))));
      }
      root.appendChild(el);
    }
  }

  // ---- תוכן-עניינים: כותרת + שורות (כותרת מימין במדרגות, מספר משמאל) ----
  if (pg.toc) {
    if (pg.toc.title) {
      const el = mkLine(pg.toc.title, SZ.tocTitle, 'center', 30);
      el.className += ' toc-title';
      position(el, BAND_X, GEO.FLOW_TOP + 136, BAND_W, 30);
      root.appendChild(el);
    }
    for (const r of (pg.toc.rows || [])) {
      const row = doc.createElement('div');
      row.className = 'toc-row';
      row.setAttribute('dir', 'rtl');
      position(row, GEO.TOC_NUM_X, r.y, (r.x1 || 560) - GEO.TOC_NUM_X, 26);
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.fontSize = `${pt2px(r.sizePt || 10.5)}px`;
      // **S5.1:** גובה שורת TOC = התיבה (26px) — כמו baselineOf(r.y, 26, ...) במקרן
      row.style.lineHeight = '26px';
      // **S4.26:** גופן שורות ה-TOC מההגדרות + הדגשה — כמו הייחוס
      // (DavidLibre-Bold @10.5/10/9.5 בכל שורות התוכן)
      const tf = headingFontOf(r.level != null ? r.level : 2);
      if (tf) { row.style.fontFamily = tf; row.style.fontWeight = '700'; }
      const t = doc.createElement('span');
      t.className = 'toc-text';
      t.style.marginRight = `${Math.max(0, 560 - (r.x1 || 560))}px`; // מדרגות לפי רמה
      t.textContent = scrubPUAText(r.text || '');
      row.appendChild(t);
      if (r.folio) {
        const n = doc.createElement('span');
        n.className = 'toc-num';
        n.style.fontSize = `${pt2px(SZ.tocNum)}px`;
        n.textContent = r.folio;
        row.appendChild(n);
      }
      root.appendChild(row);
    }
  }

  // ---- עמודון ----
  if (pg.folioDisplay) {
    const folio = doc.createElement('div');
    folio.className = 'folio';
    folio.setAttribute('dir', 'rtl');
    position(folio, 0, GEO.FOLIO_BASELINE - 14, GEO.PAGE_W, 18);
    folio.style.textAlign = 'center';
    folio.style.fontSize = `${pt2px(SZ.folio)}px`;
    // **S5.1:** line-height מכויל כך שהבסיס יורד בדיוק ל-FOLIO_BASELINE (1054.5)
    // תחת מודל תיבת-השורה (A≈0.925, D≈0.388 בגופן הגוף ⇒ lh≈21.4px) — כמו
    // המקרן, שמצייר את הגיליון בבסיס 1054.5 בדיוק. בעבר ירש normal וישב ~3.5px גבוה.
    folio.style.lineHeight = '21.4px';
    folio.textContent = pg.folioDisplay;
    root.appendChild(folio);
  }

  // ---- עיטורים (D-89: פאנלי השערים, גל השער-משנה, מסגרת השער הראשי, כלל הכותרת) ----
  // אותו דיו כמו ב-PDF (ornament-ink — מקור יחיד): rect ⇒ div צבוע; svg ⇒ רקע
  // data-URI. הפאנלים נכנסים ראשונים (מאחורי הטקסט) והעיטורים אחרונים (מעל).
  if (Array.isArray(pg.decorations) && pg.decorations.length) {
    const inks = pg.decorations.map((d) => ({ d, ink: d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle) }));
    for (const { d, ink } of inks) {
      if (!ink) continue;
      if (ink.type === 'rect') {
        const r = doc.createElement('div');
        r.className = 'deco deco--rect';
        position(r, d.x, d.y, d.w, d.h);
        r.style.backgroundColor = `rgb(${Math.round(ink.color[0] * 255)},${Math.round(ink.color[1] * 255)},${Math.round(ink.color[2] * 255)})`;
        if (d.kind === 'shaar-panel') { r.style.zIndex = '0'; root.insertBefore(r, root.firstChild); }
        else root.appendChild(r);
      } else if (ink.type === 'svg' || ink.type === 'image') {
        const r = doc.createElement('div');
        r.className = 'deco deco--' + (ink.type === 'svg' ? 'svg' : 'img');
        position(r, d.x, d.y, d.w, d.h);
        r.style.backgroundImage = `url("${ink.uri}")`;
        r.style.backgroundRepeat = 'no-repeat';
        r.style.backgroundPosition = 'center';
        r.style.backgroundSize = 'contain';
        root.appendChild(r);
      }
    }
  }
  return root;
}

function renderPage(page, settings, doc, header) {
  // **S4.10 — עמודי מנוע המורשת:** לעמודי legacy-imud-flow יש צורה משלהם
  // (גיאומטריה מפורשת ב-px: bands/gateLines/columns/footnotes/marginNotes/toc)
  // שאינה תואמת את חוזה ה-DP — הרנדר הכללי קרס על template.columns חסר
  // והתצוגה החיה הציגה 0 עמודים. רנדר ייעודי נאמן לגיאומטריית המורשת.
  if (page && page.legacy) return renderLegacyPage(page, settings, doc);
  if (header == null && page && page.header) header = page.header;
  if (!page.template) {
    // עמודי הערות שלא חוברו לרצף המספור — תבנית ברירת מחדל חוקית (A4) במקום קריסה
    page.template = { width: 794, height: 1123, columns: [], margins: { top: 40, bottom: 40, side: 60, outer: 60 }, contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0, counts: false, numbered: false, hasRunningHead: false };
  }
  const root = doc.createElement('article');
  root.className = PT_CLASS[page.type] || 'page';
  root.dataset.pageIndex = String(page.index);
  // **S9 (REQ-HDR-05):** עוגן עמוד — יעד לקישורי תוכן־העניינים הלחיצים (#page-N)
  root.setAttribute('id', `page-${page.index}`);
  if (page.template.width != null) root.style.width = `${page.template.width}px`;
  if (page.template.height != null) root.style.height = `${page.template.height}px`;
  root.dir = 'rtl';
  // **03.11(ג):** גופן/גודל הגוף על שורש העמוד — התצוגה והייצוא יחד מגיבים
  // להגדרות body-font/body-font-size-pt (השורות דורסות לפי סוגן — כותרות וכו').
  const bf = settings['body-font'];
  if (bf) root.style.fontFamily = fontStack(bf);
  const bsPt = Number(settings['body-font-size-pt']);
  if (Number.isFinite(bsPt) && bsPt > 0) root.style.fontSize = `${ptToPx(bsPt)}px`;

  // key: background-color / background-opacity — rgba אמיתי (P0-5)
  const bg = settings['background-color'];
  const bgOp = settings['background-opacity'];
  if (bg && bg !== '#ffffff') root.style.backgroundColor = bgRgba(bg, bgOp != null ? bgOp : 1);
  else if (Number.isFinite(bgOp) && bgOp < 1) root.style.backgroundColor = bgRgba('#ffffff', bgOp);

  // **עמודי הערות (S7.1.1):** כותרת + רשימת הערות; אין כותרת עליונה/טורי גוף
  if (page.type === 'endnotes') {
    if (page.heading) {
      const h = doc.createElement('h2');
      h.className = 'endnote-title';
      h.dir = 'rtl';
      h.textContent = scrubPUAText(page.heading);
      root.appendChild(h);
    }
    const list = doc.createElement('div');
    list.className = 'endnote-list';
    for (const n of page.notes || []) {
      const el = doc.createElement('div');
      el.className = 'endnote-note';
      el.dir = 'rtl';
      el.textContent = `${n.marker || ''}\u200F ${scrubPUAText(n.text || '')}`;
      list.appendChild(el);
    }
    root.appendChild(list);
    const folioEn = renderFolio(page, settings, doc);
    if (folioEn) root.appendChild(folioEn);
    return root;
  }

  // **S8 (REQ-ORN-05/08):** רקעים/ערכות/תיבות שער — שכבות תשתית לפני התוכן
  for (const el of renderPageBackgroundAndShaar(page, settings, doc, page._metadata)) root.appendChild(el);

  // **03.11(ד):** תוכן מובנה של עמודי השער (בס״ד/כותרת/כתר/תיאור/מחבר/שנה —
  // פורט המקור). בלי זה עמוד שער ללא עיצוב־תמונה היה ריק לחלוטין.
  for (const el of renderShaarContent(page, settings, doc, page._metadata)) root.appendChild(el);

  // **S9 (REQ-HDR-05):** עמודי תוכן־עניינים — שורות + נקודות + עוגנים; אין טורי גוף
  // **03.11(ד):** כותרת עליונה גם בעמודי התוכן־עניינים — כמקור
  // (renderPaginatedTOC מרנדר top-header-grid בכל עמודי התוכן).
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    const hToc = renderHeader(header, doc);
    if (hToc) root.appendChild(hToc);
    for (const el of renderTocPageContent(page, doc)) root.appendChild(el);
    const folioToc = renderFolio(page, settings, doc);
    if (folioToc) root.appendChild(folioToc);
    return root;
  }

  // **S8 (PT-09):** עמוד מותאם — תוכן קבוע; אין טורים/כותרת עליונה
  if (page.type === 'custom') {
    for (const el of renderCustomPageContent(page, doc)) root.appendChild(el);
    const folioC = renderFolio(page, settings, doc);
    if (folioC) root.appendChild(folioC);
    return root;
  }

  const h = renderHeader(header, doc);
  if (h) root.appendChild(h);

  // **S8 (FWD-1):** פס כותרת חוצה־טורים מעל הטורים (H2 full-width)
  const band = renderSpanningBand(page, settings, doc);
  if (band) root.appendChild(band);

  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  const spanOffset = page.spanning ? page.spanning.heightPx : 0; // הטורים מתחילים מתחת לפס
  page.columns.forEach((colLines, ci) => {
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    colEl.style.left = `${page.template.columns[ci] ? page.template.columns[ci].x : 0}px`;
    colEl.style.width = `${page.template.columns[ci] ? page.template.columns[ci].w : 'auto'}px`;
    colEl.style.top = `${page.template.contentBox.top + spanOffset}px`;
    colEl.style.height = `${Math.max(0, page.template.contentBox.height - spanOffset)}px`;
    for (const ln of colLines) colEl.appendChild(renderLine(ln, doc, settings));
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  // חוט מפריד בין טורים (overlay — אחרי הטורים, לא מזיז שום דבר)
  const divider = renderColumnDivider(page, settings, doc);
  if (divider) root.appendChild(divider);

  const fn = renderFootnoteArea(page, settings, doc);
  if (fn) root.appendChild(fn);

  const folioMain = renderFolio(page, settings, doc);
  if (folioMain) root.appendChild(folioMain);

  // **S8 (REQ-ORN-01..04):** עיטורים — ציור מה־rectים בלבד (F-09 מקור יחיד)
  for (const el of renderDecorations(page, doc)) root.appendChild(el);

  // הערות צד: מיקום מוחלט לפי ה‑placement (S7.1.2) — anchor לפסקה המארחת
  for (const sn of page.sideNotes || []) {
    const el = doc.createElement('aside');
    el.className = 'side-note' + (sn.isCustomStyle ? ' side-note--custom' : '');
    if (sn.isCustomStyle) el.dataset.style = sn.isCustomStyle;
    el.dataset.anchor = sn.anchorToken || '';
    el.dir = 'rtl';
    if (sn.yTop != null) el.style.top = `${Math.round(sn.yTop)}px`;
    if (sn.x != null) {
      el.style.left = `${Math.round(sn.x)}px`;
      el.style.right = 'auto';
    }
    if (sn.colWidth) el.style.width = `${sn.colWidth}px`;
    el.textContent = (sn.counterMark ? `${sn.counterMark} ` : '') + scrubPUAText(sn.text);
    root.appendChild(el);
  }
  return root;
}

module.exports = { renderPage, renderLine, scrubPUAText, bgRgba, PT_CLASS, renderSpanningBand, renderDecorations, renderPageBackgroundAndShaar, renderShaarContent, renderCustomPageContent, applyCustomStyleSpec, fontStack };
