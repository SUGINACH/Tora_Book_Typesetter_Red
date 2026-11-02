// src/engine/decoration/headers-builder.js — Running heads recto/verso 3×2 (REQ-HDR-01/02)
'use strict';

/**
 * חילוץ H1 ראשי: split לפי מקף first/last (Orange extractH1TitleMain ✓).
 */
function extractH1TitleMain(text, mode = 'main') {
  if (mode === 'full') return text;
  const parts = String(text).split(/\s+[-–—]\s+/);
  return parts[0] || text;
}

function resolveSlot(source, ctx, settings) {
  switch (source) {
    case 'none': return '';
    case 'book-name': return ctx.bookName || '';
    case 'h1': return extractH1TitleMain(ctx.h1 || '', settings['hdr-h1-title-mode']);
    case 'h2': return ctx.h2 || '';
    case 'page-num': return ctx.pageNumber || '';
    case 'first-word': return ctx.firstWord || '';
    case 'last-word': return ctx.lastWord || '';
    case 'custom': return ctx.customText || '';
    default: return '';
  }
}

/**
 * בניית כותרת עליונה לעמוד. verso יכול לרשת מ‑recto (same_as_even) עם גידוע מעגליות.
 * @param {object} page - {index,isRecto,type,firstWord,lastWord,h1,h2,pageNumber}
 * @returns {{right:string,center:string,left:string,widths:{},aligns:{}}}
 */
function buildHeader(page, settings, ctx) {
  if (!settings['header-enabled'] || !page.template.hasRunningHead) return null;
  const side = page.isRecto ? 'recto' : 'verso';
  const eff = (pos) => {
    if (!page.isRecto && settings['header-verso-same-as-recto']) return settings[`header-recto-${pos}-source`];
    return settings[`header-${side}-${pos}-source`];
  };
  const out = { right: {}, center: {}, left: {} };
  for (const pos of ['right', 'center', 'left']) {
    out[pos] = {
      text: resolveSlot(eff(pos), { ...ctx, pageNumber: page.pageNumberDisplay, firstWord: page.firstWord, lastWord: page.lastWord }, settings),
      align: settings[`header-${side}-${pos}-align`],
      widthPct: settings[`header-${side}-${pos}-width-pct`],
    };
  }
  out.separator = settings['header-separator-line'];
  return out;
}

module.exports = { buildHeader, extractH1TitleMain, resolveSlot };
