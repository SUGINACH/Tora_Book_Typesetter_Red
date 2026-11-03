// src/engine/decoration/ornament-plan.js — L5 decoration pass: ornaments/dividers/shaar deco (S8, REQ-ORN-01..04)
'use strict';

/**
 * פאס העיטורים (L5) — סינכרוני, **אסור לו לשנות גובה שנמדד (invariant T1)**.
 * כל העיטורים הם overlay-rects על העמוד (page.decorations) — לעולם לא נוגעים
 * ב־page.columns. הניטרליות מוכחת ע"י bodyGeometryHash לפני/אחרי (D-47).
 *
 * **לקחי העבר שנסגרים כאן:**
 * - F-08: כל עיטור שצורך גובה חייב להיות בגודלו הסופי **לפני** בדיקת ההתאמה —
 *   כאן ההתאמה (fits/chapterEndOrnamentFit) רצה על הממדים הסופיים בלבד;
 *   אין פוסט־פרוסס מאוחר ש"מגלה" גובה שלא תוקצב.
 * - F-09: מקור יחיד לממדים — ה־rect שמחושב כאן; הרנדרר מצייר ממנו בלבד.
 * - F-21: סימטריית מרווחים אפקטיביים של עיטורי H2 — נבדקת כ‑ornament-asymmetry
 *   על המיקומים בפועל (לא על ערכי CSS).
 *
 * **מיני־קטלוג ממצאים (kinds):** ornament-overflow / ornament-overlap / ornament-asymmetry —
 * לכל אחד מייצר בפועל (בדיקת רגישות מוכיחה שהזרקת פגם ⇒ ממצא נרשם; אנטי־קישוט).
 */

const {
  fitOrnamentToText, chapterEndOrnamentFit, h2OrnamentScope, h2OrnamentMarginsPx,
  sideOrnamentOffsetY, sideOrnamentLiftPx, assertSingleSourceSizing
} = require('./ornament-fit');
const { headingDividerDecision, shaarDividerDecision, createDividerCounters } = require('./dividers');

/** גובה ברירת־מחדל לעיטור סיום פרק (em של גוף הטקסט). */
const ORN_NATURAL_W_EM = 4, ORN_NATURAL_H_EM = 1.2;
const DIVIDER_H_PX = 2;
const H2_ORN_W_EM = 3, H2_ORN_H_EM = 0.6;

function bodyFontPx(settings) {
  return Math.round(settings['body-font-size-pt'] * 96 / 72 * 100) / 100;
}

/** סכום גובה שורות טור. */
function colUsed(colLines) {
  return colLines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
}

/** מדידת רוחב טקסט שורה דרך MeasureAPI (מדידת JS — CSS fit-content נכשל; REQ-ORN-01). */
function lineWidthPx(ln, measureFn) {
  const text = (ln.words || []).join(' ');
  try { return measureFn(text); } catch { return 0; }
}

/**
 * הפאס המלא. מופעל מהצינור ב־CP4 אחרי הערות הצד.
 * @param {Array} pages - תוצר dp-planner (+ shaar/custom pages שהוכנסו מבנית)
 * @param {object} settings
 * @param {function} measureFn - (text, sizePx?) => widthPx
 * @param {object} io - { ledger, eventLog }
 * @returns {{planted:number, rejected:Array, counters:object, findings:object}}
 */
function planPageOrnaments(pages, settings, measureFn, io = {}) {
  const ledger = io.ledger, eventLog = io.eventLog;
  const counters = createDividerCounters(); // rollback-aware, reset per document
  const planted = { chapterEnd: 0, headingDivider: 0, h2Top: 0, h2Bottom: 0, h2Side: 0, h3Side: 0, shaarDivider: 0 };
  const rejected = [];
  const fontPx = bodyFontPx(settings);
  const h2Margins = h2OrnamentMarginsPx(fontPx);
  const scope = h2OrnamentScope(settings);

  // עמודי סוף־פרק: גבול פרק (chapterOpening) מצביע אחורה על העמוד האחרון
  // שאינו מבני (עמודי שער/מותאמים אינם עמודי סוף־פרק — אין בהם תוכן פרק).
  const isStructural = (p) => Boolean(p.isShaar) || p.type === 'custom';
  const chapterEndPages = new Set();
  pages.forEach((p, i) => {
    if (p.chapterOpening && i > 0) {
      for (let j = i - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }
    }
  });
  for (let j = pages.length - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    page.decorations = page.decorations || [];
    const tpl = page.template;
    if (!tpl || !tpl.columns) continue;

    // ---------- 1. עיטורי H2 (עמודי פתיחת סימן; REQ-ORN-01/02, F-08/F-09/F-21) ----------
    // **FWD-1:** כותרת H2 במודל full-width מוצבת בפס חוצה־טורים (page.spanning)
    // ולא בטור — העיטורים נמדדים מהפס. H2 במודל regular נשאר בטור (מסלול עמוד).
    // **F-08:** ההזמנה (orn.topPx/bottomPx) כבר נכנסה לגובה הפס/תיבות השורות בזמן
    // הפריסה — כאן רק מציבים את העיטור בתוך האזור שהוזמן. אין גלישה ואין חפיפה.
    if (page.type === 'sign-open' && scope.any) {
      const spanLines = page.spanning && page.spanning.lines.length
        ? page.spanning.lines.filter(l => l.kind === 'heading' && l.level === 2)
        : [];
      const col = page.columns[0] || [];
      let h0 = -1;
      if (spanLines.length) {
        h0 = 0; // הפס מתחיל בראש תיבת התוכן
      } else {
        for (let i = 0; i < col.length; i++) {
          if (col[i].kind === 'heading' && col[i].level === 2) { h0 = i; break; }
        }
      }
      if (h0 >= 0) {
        const titleLines = spanLines.length ? spanLines : (function () {
          let hEnd = h0;
          while (hEnd + 1 < col.length && col[hEnd + 1].kind === 'heading' && col[hEnd + 1].level === 2) hEnd++;
          return col.slice(h0, hEnd + 1);
        })();
        const colX = tpl.columns[0].x, colW = tpl.columns[0].w;
        const titleW = Math.max(1, ...titleLines.map(ln => lineWidthPx(ln, measureFn)));
        // מקור יחיד למידות (F-09): ההזמנה שחושבה בזמן הפריסה — לא חישוב כפול כאן
        const orn = (spanLines.length && page.spanning.orn) || titleLines[0].h2Orn || null;
        const w = orn ? orn.ornW : Math.round(H2_ORN_W_EM * fontPx);
        const h = orn ? orn.ornH : Math.round(H2_ORN_H_EM * fontPx);
        const ornMargins = orn ? orn.margins : h2Margins;
        // הכותרת מתחילה אחרי ההזמנה העליונה (פס: titleTopPadPx; טור: padding שורה ראשונה)
        const topPad = spanLines.length ? (page.spanning.titleTopPadPx || 0) : (titleLines[0].h2OrnPadTop || 0);
        const linesBefore = spanLines.length ? 0 : col.slice(0, h0).reduce((s, ln) => s + (ln.heightPx || 0), 0);
        const titleTop = tpl.contentBox.top + linesBefore + topPad;
        const titleH = titleLines.reduce((s, ln) => s + (ln.heightPx || 0), 0)
          - (spanLines.length ? 0 : ((titleLines[0].h2OrnPadTop || 0) + (titleLines[titleLines.length - 1].h2OrnPadBottom || 0)));
        const titleBottom = titleTop + titleH;
        const cx = colX + colW / 2;

        if (scope.signTop) {
          const y = titleTop - ornMargins.top - h; // בתוך האזור שהוזמן (F-08)
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-top', kindStyle: settings['h2-orn-top'], x: Math.round(cx - w / 2), y, w, h, marginGapTop: titleTop - (y + h) }, rejected, pi, settings);
          planted.h2Top++;
        }
        if (scope.signBottom) {
          const y = titleBottom + ornMargins.bottom; // בתוך ההזמנה התחתונה
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-bottom', kindStyle: settings['h2-orn-bottom'], x: Math.round(cx - w / 2), y, w, h, marginGapBottom: y - titleBottom }, rejected, pi, settings);
          planted.h2Bottom++;
        }
        if (scope.titleSide) {
          // צדדיים לכותרת: התאמת גובה לגובה הכותרת + הרמה אופטית −0.08em (שיעור V4)
          const sideH = Math.min(h, Math.round(titleH));
          const lift = sideOrnamentLiftPx(fontPx);
          const gap = Math.round(fontPx * 0.35);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-right', kindStyle: settings['h2-orn-side'], x: Math.round(colX + colW - titleW - gap - w), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-left', kindStyle: settings['h2-orn-side'], x: Math.round(colX + titleW + gap), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings);
          planted.h2Side += 2;
        }
      }
    }

    // ---------- 2. עיטורי צד H3 (REQ-ORN-01: התאמת גובה לשורה) ----------
    if ((settings['h3-side-orn'] || 'none') !== 'none') {
      const sideH = Math.round(Number(settings['h3-side-orn-height-em']) * fontPx);
      const nCols = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית (טור פנטום)
      for (let c = 0; c < nCols; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || ln.level !== 3) continue;
          if (!ln.meta || !ln.meta.firstOfBlock) continue; // רק ראשית כותרת — לא כל שורה
          const yTop = tpl.contentBox.top + col.slice(0, i).reduce((s, l) => s + (l.heightPx || 0), 0);
          const lineH = ln.heightPx || fontPx;
          const lift = sideOrnamentLiftPx(fontPx);
          const yy = yTop + sideOrnamentOffsetY(lineH, sideH) + lift;
          const wSide = Math.round(fontPx * 1.2);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(colX + colW - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(colX), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings);
          planted.h3Side += 2;
        }
      }
    }

    // ---------- 3. מפרידי כותרות H3–H6 (REQ-ORN-04: fits() בכל אתרי ההוספה) ----------
    if (settings['heading-dividers-h3-h6']) {
      const nColsD = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית
      for (let c = 0; c < nColsD; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || !(ln.level >= 3 && ln.level <= 6)) continue;
          // **תיקון שורש (ביקורת 03.11): מפריד אחד לכל כותרת — מתחת לשורתה
          // האחרונה. בעבר הוצב מפריד בכל שורה של כותרת גולשת (5 שורות ⇒ 5 מפרידים
          // עם מפתח rollback זהה ⇒ התנגשות מונים). השורה האחרונה = אין שורת
          // המשך לאותו tokenId בטור זה, ואין המשך בראש הטור הבא.
          const continuesInCol = !!(col[i + 1] && col[i + 1].kind === 'heading' && col[i + 1].tokenId === ln.tokenId);
          const continuesNextCol = !!(page.columns[c + 1] && page.columns[c + 1][0]
            && page.columns[c + 1][0].kind === 'heading' && page.columns[c + 1][0].tokenId === ln.tokenId);
          if (continuesInCol || continuesNextCol) continue;
          const before = col.slice(0, i + 1); // כולל הכותרת — המשמרת בודקת ראש־טור/ריק
          const usedSoFar = before.reduce((s, l) => s + (l.heightPx || 0), 0);
          const remaining = tpl.contentBox.height - usedSoFar;
          const dec = headingDividerDecision(settings, remaining, DIVIDER_H_PX, {
            columnLinesBefore: before, colIdx: c, pageIndex: pi, tokenId: (ln.meta && ln.meta.tokenId) || ln.tokenId
          });
          if (dec.insert) {
            counters.record(dec.rollbackKey);
            const y = tpl.contentBox.top + usedSoFar - Math.round((ln.heightPx || 0) / 2) - 1;
            const wDiv = Math.min(Math.round(colW * 0.5), Math.round(fontPx * 6));
            pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${ln.level}`, kindStyle: 'thin', x: Math.round(colX + (colW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi, settings);
            planted.headingDivider++;
          } else if (dec.why !== 'disabled' && dec.why !== 'column-head-or-empty') {
            rejected.push({ page: pi, kind: 'heading-divider', why: dec.why });
          }
        }
      }
    }

    // ---------- 4. מפרידי שערים (REQ-ORN-04) ----------
    {
      const dec = shaarDividerDecision(page.type, settings);
      if (dec.insert) {
        const wDiv = Math.round(tpl.columns[0].w * 0.4);
        const y = tpl.contentBox.bottom - Math.round(fontPx * 2);
        pushOrnament(page, { kind: 'shaar-divider', slot: `shaar-div-${page.type}`, kindStyle: dec.style, x: Math.round(tpl.columns[0].x + (tpl.columns[0].w - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX }, rejected, pi, settings);
        planted.shaarDivider++;
      }
    }

    // ---------- 5. עיטור סיום־פרק (REQ-ORN-03: התאמה לתקציב שנותר; לא חוסם) ----------
    if (chapterEndPages.has(pi) && (settings['chapter-end-ornament'] || 'none') !== 'none') {
      // הטור האחרון הלא־ריק — שם נותר התקציב
      let last = -1;
      for (let c = 0; c < Math.min(page.columns.length, tpl.columns.length); c++) if (page.columns[c].length) last = c;
      if (last >= 0) {
        const col = page.columns[last];
        const used = colUsed(col);
        // התקציב הפנוי בפועל — בכפוף לפס החוצה־טורים (FWD-1) ולמרווח נשימה
        const cap = tpl.contentBox.height - (page.spanning ? page.spanning.heightPx : 0);
        const budget = cap - used - Math.round(fontPx * 0.5);
        const wPx = Number(settings['chapter-end-ornament-w-em']) * fontPx || ORN_NATURAL_W_EM * fontPx;
        const hPx = Number(settings['chapter-end-ornament-h-em']) * fontPx || ORN_NATURAL_H_EM * fontPx;
        const fit = chapterEndOrnamentFit(settings['chapter-end-ornament'], wPx, hPx, budget);
        if (fit.placed) {
          const colX = tpl.columns[last].x, colW = tpl.columns[last].w;
          pushOrnament(page, {
            kind: 'chapter-end-ornament', slot: 'chapter-end', kindStyle: settings['chapter-end-ornament'],
            x: Math.round(colX + (colW - fit.wPx) / 2), y: Math.round(tpl.contentBox.top + used + (budget - fit.hPx) / 2),
            w: fit.wPx, h: fit.hPx
          }, rejected, pi, settings);
          planted.chapterEnd++;
        } else if (fit.reason !== 'kind-none' && fit.reason !== 'kind-unknown') {
          rejected.push({ page: pi, kind: 'chapter-end-ornament', why: fit.reason, budget: Math.round(budget) });
          // דחייה מתועדת — לא גנוזה (כלל "אין השבתת אבחון"): ledger במקום ממצא עיטור
          if (ledger) {
            const rec = ledger.create('ornament-rejected', `p${pi}`, pi, { kind: 'chapter-end', reason: fit.reason, budgetPx: Math.round(budget) }, 'ornaments');
            ledger.transition(rec.issue_id, 'persists', 'ornaments', `chapter-end ornament not placed: ${fit.reason}`);
          }
        }
      }
    }
  }

  // ---------- 6. אודיט עיטורים: מייצרים אמיתיים (שער S8.2) ----------
  const findings = auditOrnaments(pages, ledger);

  if (eventLog) {
    eventLog.emit('decorations', 'ornament-pass', {
      planted: { ...planted, total: Object.values(planted).reduce((a, b) => a + b, 0) },
      dividersRecorded: counters.count(),
      rejected: rejected.length,
      findings: { overflow: findings.overflow.length, overlap: findings.overlap.length, asymmetry: findings.asymmetry.length }
    });
  }
  return { planted, rejected, counters, findings };
}

/** **03.11 (EXT-14):** הפניית תמונה לעיטור מסוג 'image' — מההגדרות לפי מיקום העיטור.
 * הערך בהגדרות הוא הפניה מלאה 'imud:<collection>:<id>' (נבנה ע"י ה-UI בבחירת עיצוב);
 * הרינדור פותר אותה דרך asset-registry. גישה מילולית לכל מפתח — סורק הצרכנים
 * (S4.1.4) מוכיח שכל הגדרה באמת נקראת כאן. */
function imageRefForOrnament(orn, settings) {
  if (!orn || orn.kindStyle !== 'image' || !settings) return null;
  const slot = String(orn.slot || '');
  if (slot.startsWith('h2-top')) return settings['imud-orn-top'] || null;
  if (slot.startsWith('h2-bottom')) return settings['imud-orn-bottom'] || null;
  if (slot.startsWith('h2-side') || slot.startsWith('h3-side')) return settings['imud-orn-side'] || null;
  if (slot.startsWith('chapter-end')) return settings['imud-chapter-end'] || null;
  if (slot.startsWith('hdr-div') || slot.startsWith('shaar-div')) return settings['imud-divider'] || null;
  return null;
}

/** הוספת rect עיטור עם אימות מקור־יחיד (F-09). */
function pushOrnament(page, orn, rejected, pageIndex, settings) {
  const check = assertSingleSourceSizing(orn);
  if (!check.ok) {
    rejected.push({ page: pageIndex, kind: orn.kind, why: `single-source-violation:${check.reason}` });
    return;
  }
  const image = imageRefForOrnament(orn, settings);
  page.decorations.push({ ...orn, image, cssClass: `orn orn--${orn.kind} orn--${orn.kindStyle || 'plain'}` });
}

/**
 * אודיט עיטורים — predicates אמיתיים על ה־rects בפועל:
 * - ornament-overflow: עיטור חורג מתיבת התוכן של העמוד.
 * - ornament-overlap: שני עיטורים חופפים באותו עמוד (פטורים מוצהרים: רקע/טקסטורה
 *   שכבת־תשתית לכל העמוד).
 * - ornament-asymmetry: מרווחים אפקטיביים של עיטורי H2 עליון/תחתון אינם שווים (F-21).
 * @returns {{overflow:Array, overlap:Array, asymmetry:Array}}
 */
function auditOrnaments(pages, ledger) {
  const overflow = [], overlap = [], asymmetry = [];
  const EXCLUDED_FROM_OVERLAP = new Set(['page-background', 'page-texture']);

  for (const page of pages) {
    const decs = page.decorations || [];
    if (!decs.length) continue;
    const tpl = page.template;
    if (tpl && tpl.contentBox) {
      // תיבת העיטורים: תיבת התוכן + אזור h2-top-offset שמעליה (שמור לעיטורי פתיחת
      // סימן — עיטור H2 עליון חי שם כדין; לא גלישה). רקע/טקסטורה מחוץ לבדיקה.
      const decoTop = tpl.contentBox.top - (tpl.h2TopOffset || 0);
      for (const d of decs) {
        if (d.slot === 'page-background' || d.slot === 'page-texture') continue;
        if (d.y < decoTop - 0.5 || d.y + d.h > tpl.contentBox.bottom + 0.5) {
          overflow.push({ page: page.index, slot: d.slot, y: d.y, h: d.h, top: decoTop, bottom: tpl.contentBox.bottom });
        }
      }
    }

    // overlap — זוגות נחתכים (אזור חיובי בשני הצירים)
    for (let i = 0; i < decs.length; i++) {
      for (let j = i + 1; j < decs.length; j++) {
        const a = decs[i], b = decs[j];
        if (EXCLUDED_FROM_OVERLAP.has(a.slot) || EXCLUDED_FROM_OVERLAP.has(b.slot)) continue;
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix > 0.5 && iy > 0.5) {
          overlap.push({ page: page.index, a: a.slot, b: b.slot, ix: Math.round(ix), iy: Math.round(iy) });
        }
      }
    }

    // asymmetry — F-21: מרווח עליון אפקטיבי מול תחתון (H2 top/bottom pair)
    const top = decs.find(d => d.slot === 'h2-top');
    const bottom = decs.find(d => d.slot === 'h2-bottom');
    if (top && bottom && top.marginGapTop != null && bottom.marginGapBottom != null) {
      if (Math.abs(top.marginGapTop - bottom.marginGapBottom) > 1) {
        asymmetry.push({ page: page.index, topGap: top.marginGapTop, bottomGap: bottom.marginGapBottom });
      }
    }
  }

  // רישום ל‑ledger (עולה לדוח האבחון; לעולם לא מושתק)
  if (ledger) {
    for (const f of overflow) {
      const rec = ledger.create('ornament-overflow', `p${f.page}`, f.page, { slot: f.slot }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rect exceeds content box');
    }
    for (const f of overlap) {
      const rec = ledger.create('ornament-overlap', `p${f.page}`, f.page, { a: f.a, b: f.b }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rects intersect');
    }
    for (const f of asymmetry) {
      const rec = ledger.create('ornament-asymmetry', `p${f.page}`, f.page, { topGap: f.topGap, bottomGap: f.bottomGap }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'H2 ornament effective margins unequal (F-21)');
    }
  }
  return { overflow, overlap, asymmetry };
}

module.exports = { planPageOrnaments, auditOrnaments, ORN_NATURAL_W_EM, ORN_NATURAL_H_EM, DIVIDER_H_PX };
