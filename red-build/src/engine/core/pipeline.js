// src/engine/core/pipeline.js — Canonical engine order + checkpoints CP1..CP5 (T1, נספח ג)
'use strict';

/**
 * סדר הפעולות המחויב (enforced here, mirrored in module headers):
 * CP1 parse → scope-map → style-prepass (parens BEFORE measure — שורש הסיבתיות) →
 * CP2 fonts-ready → measure/line-plan (KP) → CP3 page-plan (DP) + protections + retreat →
 * balance/AQ → notes-budget → re-fit pass → CP4 decorations (geometry-neutral!) →
 * headers/folio/toc → ledger-finalize → CP5 render.
 *
 * **תיקוני סגירת S7 (ראו audits/02_S7_CLOSURE_REPORT.md):**
 *  - P0-1/P0-2: חשבונאות שימור תוכן identity-by-construction (D-30) — צד src וצד out
 *    נספרים מאותו ייצוג מחושב; ההערות נספרות ממקום הצגתן בפועל.
 *  - P0-6: CP4==CP5 הוכחה אמיתית (bodyGeometryHash — D-47), לא משתנה לעצמו.
 *  - P1-2: קדם־פאס סוגריים לפני מדידה + אכלוס parenRanges (משפחת V23).
 *  - P1-3: סמני הערות מאוחדים (notes/markers) + הדבקה למילה הקודמת (BRZ-11).
 *  - P1-1: AQ/מצבי סוף־פרק/מילה־נופלת מחוברים לצינור בפועל.
 */

const { getDefaultSettings, derivePlacementFlags } = require('./settings-registry');
const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, contentHash, normalizeText } = require('../parser/block-tokenizer');
const { scanBrackets } = require('../parser/bracket-scanner');
const { MeasureAPI } = require('../typography/measure-api');
const { protectWords } = require('../typography/protectors');
const { applyDropWord } = require('../typography/dropword');
const { planPages, layoutHash, bodyGeometryHash } = require('../layout/dp-planner');
const { buildPageTemplate, PAGE_TYPES } = require('../layout/page-templates');
const { assignNumbers } = require('../decoration/folio');
const { buildHeader } = require('../decoration/headers-builder');
const { autoQualityPass, applyChapterEndMode } = require('../layout/balancing');
const { applyHeadingModes } = require('../layout/headings-escort');
const { markerFor, makeCounter, splitPlaceholder, MARK_TAG } = require('../notes/markers');
const Ledger = require('./ledger').Ledger;
const EventLog = require('./events').EventLog;
const { computeEditingRecommendations } = require('../audit/editing-recommendations');

const PAREN_SENTINEL = '\uE101';
const ATOMIC = '\uE000';
// **S11 (REQ-PAR-06):** סנטינל סגנון inline: \uE103<styleId>\uE104<word> — דפוס PAREN_SENTINEL (D-42).
// המדידה מכפילה בגורם הגודל של הסגנון; הרנדרר מקיף span.custom-style עם data-style.
const CUSTOM_SENTINEL = '\uE103';
const CUSTOM_SEP = '\uE104';
const CUSTOM_RE = /^\uE103([^\uE104]+)\uE104/;

/** זיהוי דיבור המתחיל: עד נקודה/מקף (REQ-PAR-ST-03; dh-auto-detect). */
function detectDh(text, enabled) {
  if (!enabled) return null;
  const m = String(text).match(/^(.+?[.׃])\s+(.*)$/) || String(text).match(/^(.+?\s*[-–—])\s+(.*)$/);
  return m ? { dh: m[1].trim(), rest: m[2] } : null;
}

/** רוחב טור ייעודי לסוג בלוק (מקור: page-templates; column-flow מספק את ההפשטה). */
function columnWidthFor(block, settings) {
  if (block.kind === 'heading' && block.level <= 1) {
    const tpl0 = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
    return tpl0.columns[0].w;
  }
  const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  return Math.max(...tpl.columns.map(c => c.w));
}

function fullWidthWidth(settings) {
  const tpl = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
  return tpl.columns[0].w;
}

/**
 * **D-42 (P1-2): קדם־פאס סוגריים עגולים** — מיפוי טווחי (...) על הטקסט השטוח
 * של חלקי הטקסט (בלי הערות). מחזיר [{from,to}] במדדי תווים של הטקסט המשורשר.
 */
function parenSpansOfFlat(flat) {
  const spans = [];
  const stack = [];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '(') stack.push(i);
    else if (flat[i] === ')') {
      if (stack.length) { spans.push({ from: stack.pop(), to: i }); }
    }
  }
  return spans;
}

/** האם מיקום מילה בתוך טווח סוגריים (פתיחה אחרי ה'(' ולפני ה')'). */
function offsetInSpans(at, spans) {
  for (const s of spans) if (at > s.from && at < s.to) return true;
  return false;
}

/**
 * @param {string} rawText - מקור הטקסט
 * @param {object} settings - merged settings (registry defaults + user)
 * @param {{doc?:object, onProgress?:(info:object)=>void}} env - optional DOM for oracle rendering;
 *   onProgress — **S10:** מזליף התקדמות שלבית ל‑Worker ("עמוד X מתוך Y"). מכשור בלבד:
 *   אסור לו לגעת בפריסה — no-op proof נאכף בבדיקה (hash זהה עם ובלי המזליף).
 */
function typeset(rawText, settingsIn, env = {}) {
  // **S10 (REQ-UI-03):** מזליף התקדמות — null כשלא סופק (אפס תקורה במסלול הרגיל).
  const onProgress = typeof env.onProgress === 'function' ? env.onProgress : null;
  const prog = (stage, pct, label, extra) => {
    if (onProgress) onProgress(Object.assign({ stage, pct, label }, extra || {}));
  };
  // **D-39 (P0-4):** מקור־האמת note-placement-mode; קלט משתמש מפורש גובר על נגזרות.
  const settings = derivePlacementFlags({ ...getDefaultSettings(), ...(settingsIn || {}) });
  const eventLog = new EventLog(settings['trace-verbosity'] || 'standard'); // נצרך בפועל (P0-5)
  const ledger = new Ledger();
  const notesMode = settings['note-placement-mode'];
  const parenScale = Number(settings['paren-style-scale']) || 1;

  // **S11 (REQ-PAR-06):** סגנונות מותאמים — פענוח + רישום שגיאות אימות (כמו _customPages).
  // הפקד הזה אינו ברישום ההגדרות (נכס מסמך, לא הגדרת מנוע) — דפוס _customPages של S8.
  const customStylesRes = settings._customStyles
    ? require('../extensions/style-schema').parseCustomStyles(settings._customStyles)
    : { ok: true, styles: [], errors: [] };
  const customStyles = customStylesRes.styles;
  const { CustomStyleCounters, matchBlockStyle, matchInlineStyles, inlineSizeFactor } = require('../extensions/apply-styles');
  const counters = new CustomStyleCounters();
  for (const err of customStylesRes.errors) {
    const rec = ledger.create('settings-verification', `custom-styles:${err.code}`, null, { path: err.path, message: err.message }, 'parse');
    ledger.transition(rec.issue_id, 'persists', 'parse', `custom style rejected: ${err.code}`);
  }
  // **S11:** עוגני תוכן לפסקאות — לזיהוי ממצאים בין הרצות (בפרט הוכחות המלצות־עריכה):
  // tail = 40 התווים האחרונים של שורת המקור; head = 40 הראשונים. העברת מילה בין
  // פסקאות משנה את הזנב של הנותן/המקבל בלבד — ולכן זהות שאר הפסקאות נשמרת.
  settings._tokenTexts = new Map();

  // ---- CP1: parse ----
  const { metadata, bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  for (const t of tokens) {
    const rawLine = String(t.raw != null ? t.raw : (t.text != null ? t.text : ''));
    settings._tokenTexts.set(t.id, {
      head: rawLine.slice(0, 40),
      tail: rawLine.slice(-40)
    });
  }
  const hashIn = contentHash(tokens);
  eventLog.emit('parse', 'cp1-parsed', { tokens: tokens.length, contentHash: hashIn });
  prog('parse', 5, 'פענוח המסמך', { tokens: tokens.length });

  // ---- scope-map (S2.1.3: BEFORE measuring) ----
  const segments = tokens.filter(t => t.type === 'paragraph').map((t, i) => ({ text: t.raw, paraIndex: i }));
  const scope = scanBrackets(segments);
  eventLog.emit('scope-map', 'cp2-scope', { pairs: scope.pairs.length, crossParagraph: scope.scopeMap.crossParagraphCount, unmatchedClosers: scope.unmatchedClosers.length });
  prog('scope-map', 10, 'מיפוי סוגריים והערות', { pairs: scope.pairs.length });

  // ---- measure + line-plan (L2) ----
  // **S12 (REQ-LB-01 impl B):** measure-impl = table (ברירת מחדל — רציפות S1–S11) | font-metrics
  // (טבלאות אמת מגופן רשום — hmtx/cmap/kern/GPOS; registerFont מפורש, אין רשת).
  const api = new MeasureAPI(settings, settings['measure-impl'] === 'font-metrics' ? 'font-metrics' : 'table');
  void env;

  const FONT_WIDTH_PROFILES = {
    'Frank Ruhl Libre': null,
    'David HB': { factor: 1.06 },
    'David': { factor: 1.04 },
    'Narkisim': { factor: 1.10 },
    'Nachlieli': { factor: 0.96 },
    'Alef': { factor: 1.02 },
    'Rubin': { factor: 1.05 }
  };
  function widthFor(text, sizePt, fontName) {
    const base = api.measureTextWidth(text, sizePt);
    if (!fontName || fontName === settings['body-font']) return base;
    const prof = FONT_WIDTH_PROFILES[fontName];
    if (prof && prof.factor) return Math.round(base * prof.factor * 100) / 100;
    const perChar = 0.6 * sizePt * (96 / 72);
    return Math.max(base, String(text).length * perChar);
  }

  /**
   * **P1-3 + BRZ-11 — הדבקת סמן הערה למילה הקודמת** (כל הסגנונות):
   * סמן בסוף שורה אסור. הסמן נצמד למילת העוגן שלפניו כיחידת NBSP;
   * protectWords מבטל קשירה אם היחידה חורגת מרוחב הטור (Claude §6.2(5)).
   */
  function bindMarkersToNeighbors(words, markerSet) {
    const out = [];
    let i = 0;
    while (i < words.length) {
      const w = words[i];
      if (markerSet.has(w)) {
        const prev = out.length ? out[out.length - 1] : null;
        const next = i + 1 < words.length ? words[i + 1] : null;
        if (prev && !prev.includes('\u00A0') && !prev.includes(ATOMIC)) {
          out[out.length - 1] = `${prev}\u00A0${MARK_TAG}${w}`; // הדבקה לאחור + תג (D-53)
        } else if (next && !next.includes('\u00A0') && !markerSet.has(next)) {
          out.push(`${MARK_TAG}${w}\u00A0${next}`); i++;        // סמן בראש פסקה ⇒ הדבקה קדימה + תג
        } else {
          out.push(`${MARK_TAG}${w}`);                        // סמן מתויג גם בודד
        }
      } else {
        out.push(w);
      }
      i++;
    }
    return out;
  }

  // ---- תקציבי גיאומטריה נגזרים לפני ה‑DP (מקור יחיד; ה‑DP והצינור קוראים אותם) ----
  const regTpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  const contentW = regTpl.columns.reduce((s, c) => s + c.w, 0) + regTpl.gutter;
  settings._fnColWidthPx = settings['footnote-columns'] === 2 ? Math.round(contentW / 2) : Math.round(contentW);
  settings._outerMarginPx = Math.max(regTpl.margins.outer != null ? regTpl.margins.outer : 0, regTpl.margins.side * 0.8);
  settings._sideNoteColWidthPx = Math.max(60, Math.round(settings._outerMarginPx) - 12);
  settings._endnoteColWidthPx = Math.round(contentW); // רוחב טור בעמודי הערות

  const blocks = [];
  const endnoteTokens = [];        // טוקני הערת־סיום גלויים (endnotes mode)
  const endnoteTitleByPart = new Map(); // D-40: הוראות כותרת־מחלקה per-part
  const markersByToken = new Map(); // tokenId → [{noteIndex, marker}] (סמן אחיד — D-30)
  // **S11:** חשבונאות שימור תוכן לסגנונות שמסיטים פסקה שלמה מהגוף —
  // הסמן נספר במקור פעם אחת, בדיוק כמו note-ref רגיל (D-30).
  const customFootnoteMarkers = new Map(); // tokenId → סמן (מוצג בגוף, הטקסט במרזב)
  const customEndnoteTokens = new Set();   // tokenIds שזרמו לעמודי ההערות (הסמן מודפס שם)
  let currentPart = 0;
  let fwCount = 0;
  const markerStyle = settings['footnote-marker-style'];
  const resetPolicy = settings['footnote-reset-policy'];
  const nextMarkerNum = makeCounter(resetPolicy); // מדיניות איפוס (D-41)

  for (const t of tokens) {
    if (t.type === 'editorial') continue;

    // **D-40 (P1-5): הוראת כותרת־מחלקה** — לא תוכן, לא גוף; מגדירה את כותרת
    // עמודי ההערות של החלק הנוכחי. בעבר פוענחה כהערת תוכן פיקטיבית.
    if (t.type === 'endnote-class') {
      endnoteTitleByPart.set(currentPart || 1, t.title);
      eventLog.emit('parse', 'endnote-class-directive', { part: currentPart || 1, title: t.title });
      continue;
    }

    if (t.type === 'heading') {
      if (t.level === 1) currentPart++;
      const hSize = settings[`heading-${t.level}-size-pt`];
      const hFont = settings[`heading-${t.level}-font`];
      const hMode = settings[`heading-${t.level}-mode`];
      const wLimit = (t.level <= 1 || hMode === 'full-width')
        ? fullWidthWidth(settings)
        : columnWidthFor({ kind: 'heading', level: t.level }, settings);
      const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => widthFor(x, hSize, hFont), wLimit);
      const lines = api.layoutLines(words, wLimit, hSize, {}, (x) => widthFor(x, hSize, hFont));
      blocks.push({
        kind: 'heading', level: t.level, tokenId: t.id, part: currentPart, mode: hMode, font: hFont,
        forceNewPage: hMode === 'new-page', sideNote: hMode === 'side-note',
        lines: lines.map(ln => ({ ...ln, kind: 'heading', tokenId: t.id, level: t.level }))
      });
      // **S8 (F-08 — שיעור הלב):** עיטורי H2 שצורכים גובה מוזמנים כאן — בגודלם
      // הסופי, לפני הפריסה. H2 במודל regular (בטור): השורות מתנפחות בהזמנה;
      // H2 full-width: ההזמנה נכנסת לפס החוצה־טורים ב‑dp-planner. המידע נוסע על
      // השורה (h2Orn) — מקור יחיד למידות (F-09).
      if (t.level === 2) {
        const { h2OrnamentReservedHeight } = require('../decoration/ornament-fit');
        const h2FontPx = Math.round(hSize * 96 / 72 * 100) / 100;
        const titleW = Math.max(1, ...lines.map(ln => widthFor((ln.words || []).join(' '), hSize, hFont)));
        const reserved = h2OrnamentReservedHeight(titleW, settings, h2FontPx);
        if (reserved.scope.any) {
          const blk = blocks[blocks.length - 1];
          if (hMode !== 'full-width') {
            // בטור: תיבת השורה כוללת את ההזמנה — הטקסט יורד ב‑padding (רנדרר)
            if (reserved.topPx) {
              blk.lines[0].heightPx += reserved.topPx;
              blk.lines[0].h2OrnPadTop = reserved.topPx;
            }
            if (reserved.bottomPx) {
              const last = blk.lines[blk.lines.length - 1];
              last.heightPx += reserved.bottomPx;
              last.h2OrnPadBottom = reserved.bottomPx;
            }
          }
          blk.lines[0].h2Orn = {
            ...reserved,
            kindTop: settings['h2-orn-top'], kindBottom: settings['h2-orn-bottom'], kindSide: settings['h2-orn-side'],
            fitToText: settings['h2-orn-fit-to-text'] !== false
          };
        }
      }
      continue;
    }

    if (t.type === 'endnote') {
      // **D-40:** הערת־סיום גלויה. endnotes-mode ⇒ עמודי ההערות (עם סמן
      // markerFor(num, style)); מצבים אחרים ⇒ בלוק פסקה בגוף (הטקסט בלבד;
      // המספר במקור הוא עוגן סמן — פריט קישור, לא תוכן — D-30).
      if (notesMode === 'endnotes') {
        endnoteTokens.push({ tokenId: t.id, text: t.text, part: currentPart || 1, num: t.num != null ? t.num : null, lines: [] });
        continue;
      }
      const w = columnWidthFor({ kind: 'paragraph' }, settings);
      const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => api.measureTextWidth(x), w);
      const lines = api.layoutLines(words, w, null, { runts: settings['runt-min-width-pct'] });
      blocks.push({
        kind: 'paragraph', tokenId: t.id, parts: [{ kind: 'text', value: t.text }],
        notes: [], bodyMarkers: [], lines, part: currentPart, dh: null, isEndnoteSource: true
      });
      continue;
    }

    // ---- paragraph ----
    // (colW נקבע לאחר התאמת הסגנון המותאם — full-width נמדד ברוחב מלא; S11)
    let dh = null;
    if (settings['dh-auto-detect']) {
      const flat = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
      dh = detectDh(flat, true);
    }
    if (dh) { dh.font = settings['dh-font']; }

    // **D-42 (P1-2): pre-pass of parentheses before measurement** — ranges of (...) on the body text;
    // Words inside the parentheses are measured in the paren-style-scale scale (1.0 = off) before
    // breaking the lines — the causal root of V23 (9 geometry changes from late application).
    // Word mapping: the words of the text parts (in order) correspond 1:1 to the words of the flattened
    // text from which flatBody was built — a shared running index (exact, no searches).
    const textParts = t.parts.filter(p => p.kind === 'text');
    const flatBody = textParts.map(p => p.value).join(' ');
    const parenSpans = parenScale !== 1 ? parenSpansOfFlat(flatBody) : [];
    const flatWordOffsets = [];
    {
      let cum = 0;
      for (const w of flatBody.split(/\s+/)) {
        if (!w) continue;
        flatWordOffsets.push({ word: w, at: cum });
        cum += w.length + 1;
      }
    }
    let flatWordIdx = 0;

    const allWords = [];
    const notes = [];
    const bodyMarkers = [];
    const assignedMarkers = new Set();
    const noteAssignments = [];

    // **S11 (REQ-PAR-06): התאמת סגנונות מותאמים — לפני המדידה** (שורש הסיבתיות:
    // הסגנון נקבע לפני שבירת השורות, לא אחרי — דפוס D-42).
    const csBlock = customStyles.length ? matchBlockStyle(flatBody, customStyles) : null;
    const csInlineSpans = [];
    if (customStyles.length) {
      for (const im of matchInlineStyles(flatBody, customStyles)) {
        for (const r of im.ranges) {
          csInlineSpans.push({ from: r.from, to: r.to, styleId: im.styleId, factor: inlineSizeFactor(im.style.style, settings['body-font-size-pt']) });
        }
      }
    }
    // endnote-mode: הפסקה כולה זורמת לעמודי ההערות של החלק (סמן הסגנון אם הוגדר מונה)
    if (csBlock && csBlock.style.layoutMode === 'endnote') {
      const mark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      endnoteTokens.push({ tokenId: t.id, text: flatBody, part: currentPart || 1, customStyle: csBlock.style.id, ...(mark ? { marker: mark } : {}), lines: [] });
      customEndnoteTokens.add(t.id); // הסמן (מוקצה בבניית עמודי ההערות) נספר במקור
      continue;
    }
    // footnote-mode: הפסקה כולה הופכת הערת שוליים — בגוף נשאר הסמן בלבד (מקום הפסקה = מקום העיגון).
    // נתיב זה דורש מרזב פעיל; בלי מרזב — הסגנון חוזר להיות חזותי בלבד (BRZ-15: לא מאבדים תוכן).
    if (csBlock && csBlock.style.layoutMode === 'footnote' && notesMode === 'footnotes' && settings['footnotes-enabled']) {
      const mark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      const fnMark = mark || markerFor(nextMarkerNum({ page: null, part: currentPart || 1 }), markerStyle);
      const fnNotes = [{ text: flatBody, marker: fnMark, tokenId: t.id, part: currentPart || 1, customStyle: csBlock.style.id }];
      const fnBodyMarkers = [fnMark];
      // הסמן בגוף מתויג (D-53) ומודבק לשכן כמו כל סמן — מקור יחיד bindMarkersToNeighbors
      const fnWords = bindMarkersToNeighbors([fnMark], new Set([fnMark]));
      const fnWLimit = columnWidthFor({ kind: 'paragraph' }, settings);
      const fnLines = api.layoutLines(fnWords, fnWLimit, null, { runts: settings['runt-min-width-pct'] });
      const fnBlk = {
        kind: 'paragraph', tokenId: t.id, parts: t.parts, notes: fnNotes, bodyMarkers: fnBodyMarkers,
        lines: fnLines, unmatchedClosers: t.unmatchedClosers || [], part: currentPart, dh: null,
        // **S11:** הקצאת הסמן נרשמת כמו note-ref — עקביות סמנים גוף/מרזב (P1-3, D-30)
        noteAssignments: [{ noteIndex: 0, marker: fnMark }],
        parenCharSpans: [], flatWordOffsets: [],
        customStyle: { id: csBlock.style.id, name: csBlock.style.name, layoutMode: 'footnote', styleSpec: csBlock.style.style, counterMark: fnMark, linkedOrnaments: csBlock.style.linkedOrnaments }
      };
      for (const ln of fnBlk.lines) ln.customStyle = fnBlk.customStyle;
      customFootnoteMarkers.set(t.id, fnMark); // חשבונאות שימור תוכן: הסמן במקור
      blocks.push(fnBlk);
      continue;
    }

    // full-width-mode: המדידה ברוחב מלא (כמו H1) — לפני הפריסה, לא אחריה
    const colW = (csBlock && csBlock.style.layoutMode === 'full-width')
      ? fullWidthWidth(settings)
      : columnWidthFor({ kind: 'paragraph' }, settings);
    const customFactorById = new Map(csInlineSpans.map(s => [s.styleId, s.factor]));
    let csInfo = null; // **S11:** סגנון הבלוק שיוצמד לשורות ולבלוק (מדלג על ערכי איטרציות קודמות)

    for (const p of t.parts) {
      if (p.kind === 'text') {
        const src = normalizeText(p.value);
        for (const wordRaw of src.split(/\s+/).filter(Boolean)) {
          const info = flatWordOffsets[Math.min(flatWordIdx, flatWordOffsets.length - 1)];
          flatWordIdx++;
          const inParen = parenSpans.length > 0 && info && offsetInSpans(info.at, parenSpans);
          // **S11:** חברות בטווח inline = **חפיפה** (לא הכלה): מילה הפותחת במפריד «
          // («וזה) חופפת את טווח התוכן שאחריו; מילה שלפני הפתיחה לא. וכך גם בסגירה.
          const wLen = info ? String(info.word || wordRaw).length : String(wordRaw).length;
          const inCustom = csInlineSpans.length > 0 && info
            ? csInlineSpans.find(s => info.at < s.to && (info.at + wLen) > s.from) : null;
          // עדיפות: טווח inline מותאם על פני סוגריים (שניהם לא יכולים לחפור בפועל — הסגנון תופס ראשון)
          if (inCustom) allWords.push(CUSTOM_SENTINEL + inCustom.styleId + CUSTOM_SEP + wordRaw);
          else if (inParen && parenScale !== 1) allWords.push(PAREN_SENTINEL + wordRaw);
          else allWords.push(wordRaw);
        }
      } else {
        // note-ref: uniform marker allocation (D-30/D-41) — policy numbering + style
        const noteRaw = t.notes[p.noteIndex];
        const marker = markerFor(nextMarkerNum({ page: null, part: currentPart || 1 }), markerStyle);
        assignedMarkers.add(marker);
        noteAssignments.push({ noteIndex: p.noteIndex, marker });
        if (notesMode === 'inline' || (!settings['footnotes-enabled'] && notesMode !== 'endnotes')) {
          // (c) inline / fn-off: full placeholder in the body — `${marker}\uE000${text}`
          // (D-30: the separator is the first \uE000 — atomic in measurement, exact in extraction)
          const noteFlat = String(noteRaw).replace(/\uE000/g, ' ');
          const placeholder = `${MARK_TAG}${marker}${ATOMIC}${noteFlat.replace(/ /g, ATOMIC)}`; // תג (D-53): אחרי kp ה‑E000 נהיה NBSP — התג מזהה את הסמן
          const prev = allWords.length ? allWords[allWords.length - 1] : null;
          if (prev && !prev.includes('\u00A0') && !prev.includes(ATOMIC)) {
            allWords[allWords.length - 1] = `${prev}\u00A0${placeholder}`; // the marker sticks to its anchor (BRZ-11)
          } else {
            allWords.push(placeholder);
          }
          continue;
        }
        // footnotes / endnotes: only the marker is pushed in the body (counted once — at the anchor);
        // the text of the note flows to its display location (gutter / pages of notes — D-30).
        notes.push({ text: String(noteRaw).replace(/\uE000/g, ' '), marker, tokenId: t.id, noteIndex: p.noteIndex, part: currentPart || 1 });
        bodyMarkers.push(marker);
        allWords.push(marker);
      }
    }
    markersByToken.set(t.id, noteAssignments);

    // Pasting lone markers to their neighbors (BRZ-11) — before measurement
    const boundWords = bindMarkersToNeighbors(allWords, assignedMarkers);

    // Measurement with a pre-pass of parentheses (D-42) + custom inline styles (S11):
    // PAREN_SENTINEL → parenScale; CUSTOM_SENTINEL<id> → size factor of the style.
    const measureWithParen = (x) => {
      const clean0 = String(x).replace(/\uE102/g, ''); // תג סמן — מוסר ממדידה (D-53)
      const csM = CUSTOM_RE.exec(clean0);
      if (csM) {
        const f = customFactorById.get(csM[1]);
        const base = api.measureTextWidth(clean0.slice(csM[0].length));
        return f != null ? base * f : base;
      }
      const isParen = clean0.startsWith(PAREN_SENTINEL);
      const clean = isParen ? clean0.slice(PAREN_SENTINEL.length) : clean0;
      const base = api.measureTextWidth(clean);
      return isParen ? base * parenScale : base;
    };
    const protectedWords = protectWords(boundWords, measureWithParen, colW);
    const lines = api.layoutLines(protectedWords, colW, null, { runts: settings['runt-min-width-pct'] }, measureWithParen);

    // Cleaning the sentinels from the lines + tagging parenSpans/customSpans for rendering
    for (const ln of lines) {
      const spans = [];
      const customSpans = [];
      ln.words = (ln.words || []).map((w, wi) => {
        if (CUSTOM_RE.test(w)) {
          const m = CUSTOM_RE.exec(w);
          customSpans.push({ wi, styleId: m[1] });
          return w.slice(m[0].length);
        }
        if (w.startsWith(PAREN_SENTINEL)) { spans.push(wi); return w.slice(PAREN_SENTINEL.length); }
        return w;
      });
      if (spans.length && parenScale !== 1) ln.parenSpans = spans;
      if (customSpans.length) ln.customSpans = customSpans;
    }
    // **S11:** הסגנון ברמת הבלוק על הפסקה (לא-footnote): דגלי פריסה + מונה + עיטורים מקושרים
    if (csBlock && csBlock.style.layoutMode !== 'footnote' && csBlock.style.layoutMode !== 'endnote') {
      const counterMark = counters.nextMark(csBlock.style, { part: currentPart || 1, page: null });
      csInfo = {
        id: csBlock.style.id, name: csBlock.style.name, layoutMode: csBlock.style.layoutMode,
        styleSpec: csBlock.style.style, counterMark, linkedOrnaments: csBlock.style.linkedOrnaments
      };
      const ORN_PAD_PX = 18; // הזמנת גובה לעיטור מקושר — דפוס h2Orn (F-08): גיאומטריה מוזמנת בזמן אמת
      if (csInfo.linkedOrnaments && csInfo.linkedOrnaments.top && lines.length) {
        lines[0].heightPx = (lines[0].heightPx || 0) + ORN_PAD_PX;
        lines[0].csOrnPadTop = ORN_PAD_PX;
      }
      if (csInfo.linkedOrnaments && csInfo.linkedOrnaments.bottom && lines.length) {
        const lastLn = lines[lines.length - 1];
        lastLn.heightPx = (lastLn.heightPx || 0) + ORN_PAD_PX;
        lastLn.csOrnPadBottom = ORN_PAD_PX;
      }
      for (const ln of lines) ln.customStyle = csInfo;
      // המונה מוצג בשורה הראשונה של הבלוק (הפס של full-width מטופל ברנדרר מהמידע על הפס)
      if (csInfo.counterMark && lines.length) lines[0].csCounterMark = csInfo.counterMark;
    }
    const blk = {
      kind: 'paragraph', tokenId: t.id, parts: t.parts, notes, bodyMarkers, lines,
      unmatchedClosers: t.unmatchedClosers || [], part: currentPart, dh,
      noteAssignments, parenCharSpans: parenSpans, flatWordOffsets,
      customStyle: csInfo
    };
    if (blk.customStyle) {
      blk.fullWidth = blk.customStyle.layoutMode === 'full-width';
      blk.forcePageBreakBefore = blk.customStyle.layoutMode === 'new-location';
      blk.asSideNote = blk.customStyle.layoutMode === 'side-note';
    }
    const fwRes = applyDropWord(blk, settings, api);
    if (fwRes.applied) fwCount++;
    blocks.push(blk);
  }

  // תבנית ההחלטה המאוחדת של כותרות (D-09) — לפני ה‑DP; ה‑DP קורא דגלים בלבד
  applyHeadingModes(blocks, settings);
  eventLog.emit('measure', 'cp2-measured', { blocks: blocks.length, cache: api.cacheStats(), firstWordDecorated: fwCount, parenScale });
  prog('measure', 25, 'מדידה ושבירת שורות', { blocks: blocks.length });

  // ---- CP3: page plan (DP) + protections + retreat loop ----
  const planned = planPages(blocks, settings, eventLog, ledger, { measure: (t2, s2) => api.measureTextWidth(t2, s2), onProgress });
  let { pages } = planned;
  prog('page-plan', 70, 'הפריסה הושלמה', { totalPages: pages.length, pageIndex: pages.length });

  // **S8 — עמודי שער + עמודים מותאמים (PT-01/02/03/09):** הכנסה מבנית
  // מיד אחרי ה‑DP ולפני צילום ה‑hash של CP4 — השערים חלק מהבסיס שנמדד
  // (לא ״תוספת מאוחרת״ שמזיזה אינדקסים מתחת להוכחת הניטרליות).
  {
    const { insertShaarPages } = require('../decoration/shaar-pages');
    const { parseCustomPageTypes } = require('../decoration/custom-pages');
    let customDefs = [];
    if (settings._customPages) {
      const parsed = parseCustomPageTypes(settings._customPages);
      customDefs = parsed.pages;
      for (const err of parsed.errors) {
        const rec = ledger.create('settings-verification', 'custom-pages', null, { error: err }, 'decorations');
        ledger.transition(rec.issue_id, 'persists', 'decorations', `custom page def rejected: ${err}`);
      }
    }
    const shaarResult = insertShaarPages(pages, blocks, settings, customDefs);
    pages = shaarResult.pages;
    eventLog.emit('page-plan', 'shaar-pages-inserted', {
      inserted: shaarResult.inserted.map(x => x.why),
      custom: shaarResult.customPlaced.length
    });
  }

  // **P1-1 (connection of dead mechanisms):** end-of-part modes + AutoQuality
  // are activated from the pipeline: balance-chapter-end is applied on the last page
  // of each section; AQ is activated when aq-enabled.
  // **S8:** עמודי שער/מותאמים הם chapterOpening אך אינם ״סוף פרק״ — הם מפנים
  // אל העמוד שלפניהם (עמוד התוכן האחרון של החלק), והם עצמם לא מטופלים.
  {
    const isStructural = (p) => Boolean(p.isShaar) || p.type === 'custom';
    const endsAt = new Set();
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].chapterOpening && i > 0) {
        // גבול פרק מצביע אחורה על העמוד האחרון שאינו מבני (מדלג על שערים/מותאמים)
        for (let j = i - 1; j >= 0; j--) { if (!isStructural(pages[j])) { endsAt.add(j); break; } }
      }
    }
    for (let j = pages.length - 1; j >= 0; j--) { if (!isStructural(pages[j])) { endsAt.add(j); break; } }
    for (const pi of [...endsAt].sort((a, b) => a - b)) {
      applyChapterEndMode(pages[pi], settings['balance-chapter-end'], settings, eventLog);
    }
    if (settings['aq-enabled']) autoQualityPass(pages, settings, eventLog);
  }

  // **S9 — עמודי תוכן־העניינים (REQ-HDR-05):** הכנסה מבנית לפני צילום ה‑hash של CP4
  // (כמו שערי S8) — העמודים חלק מהבסיס שנמדד; תקציב איטרציה מונע תליה (F: TOC hanging).
  let tocPagesAll = [];
  let tocInsertInfo = { inserted: 0, at: 0 };
  {
    const {
      buildTocModel, numberRows, buildTocPages, insertTocPages
    } = require('../decoration/toc-builder');
    const pageLinesEarly = (pg) => [
      ...(pg.spanning ? pg.spanning.lines : []),
      ...pg.columns.flatMap(c => c)
    ];
    const firstPageByToken = new Map(); // tokenId -> עצם העמוד (עוגן למיפוי סופי)
    for (const pg of pages) {
      for (const ln of pageLinesEarly(pg)) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg);
      }
    }
    const headingsAll = [];
    for (const b of blocks) {
      if (b.kind !== 'heading') continue;
      const pageRef = firstPageByToken.has(b.tokenId) ? firstPageByToken.get(b.tokenId) : null;
      if (!pageRef) continue;
      headingsAll.push({
        level: b.level,
        text: b.lines.map(l => l.words.join(' ')).join(' ').trim(),
        tokenId: b.tokenId, pageRef,
      });
    }
    headingsAll.sort((a, b) => (a.pageRef.index - b.pageRef.index) || String(a.tokenId).localeCompare(String(b.tokenId)));

    const measureToc = (t, sz) => api.measureTextWidth(t, sz);
    const lineHToc = (sz) => api.lineHeightPx(sz);
    if (settings['toc-general-enabled'] !== false) {
      const model = buildTocModel(headingsAll.filter(h => h.level <= 2), settings);
      numberRows(model.rows, settings['general-toc-count-numbering'] !== false);
      const built = buildTocPages(model, 'toc-general', 'תוכן העניינים', settings, measureToc, lineHToc, { ledger, eventLog });
      tocPagesAll = tocPagesAll.concat(built.pages);
    }
    if (settings['toc-detail-enabled'] === true) {
      const model = buildTocModel(headingsAll, settings);
      numberRows(model.rows, settings['detailed-toc-count-numbering'] !== false);
      const built = buildTocPages(model, 'toc-detail', 'תוכן העניינים המפורט', settings, measureToc, lineHToc, { ledger, eventLog });
      tocPagesAll = tocPagesAll.concat(built.pages);
    }
    if (tocPagesAll.length) {
      const res = insertTocPages(pages, tocPagesAll, settings, { ledger, eventLog });
      pages = res.pages;
      tocInsertInfo = { inserted: res.inserted, at: res.at };
      eventLog.emit('toc', 'toc-pages-inserted', { ...tocInsertInfo, total: tocPagesAll.length });
    }
    prog('toc', 78, 'תוכן העניינים', { totalPages: pages.length, tocPages: tocPagesAll.length });
  }

  // ---- CP4: decorations pass — geometry-neutral (invariant T1; D-47) ----
  const cp4PageCount = pages.length;
  const cp4BodyBefore = bodyGeometryHash(pages);

  // S7.1.2: הערות צד — עיגון לפסקה, cascade, מיכל 20px, מעבר לעמוד הבא
  const { placeSideNotes, verifyH7Conversion } = require('../layout/side-notes');
  for (const pg of pages) pg.isRecto = pg.index % 2 === 0;
  const sideNotePlacement = placeSideNotes(pages, settings, (t2, s2) => api.measureTextWidth(t2, s2), { ledger, eventLog });

  // **S8 — פאס העיטורים (L5):** כל העיטורים overlay-rects על העמודים;
  // אסור לגעת בשורות (invariant T1 — מוכח מיד לאחר מכן ב‑bodyGeometryHash).
  // סוגר: REQ-ORN-01..04 + אודיט ornament-* במייצרים אמיתיים.
  const { planPageOrnaments } = require('../decoration/ornament-plan');
  const ornamentPass = planPageOrnaments(pages, settings, (t2, s2) => api.measureTextWidth(t2, s2), { ledger, eventLog });

  // S7.1.1: עמודי הערות per-part — טוקנים גלויים + inline-refs (endnotes mode)
  settings._endnoteTitleByPart = endnoteTitleByPart;
  settings._endnoteColCapPx = regTpl.contentBox.height;
  const endnoteBlocks = [...endnoteTokens];
  if (notesMode === 'endnotes') {
    for (const b of blocks) {
      if (b.kind !== 'paragraph' || !b.notes || !b.notes.length) continue;
      for (const n of b.notes) {
        endnoteBlocks.push({ tokenId: b.tokenId, noteIndex: n.noteIndex, text: n.text, part: b.part || 1, marker: n.marker, fromInline: true, lines: [] });
      }
    }
  }
  let endnotePagesInfo = { count: 0, pages: [] };
  if (notesMode === 'endnotes' && endnoteBlocks.length) {
    const { buildEndnotePages } = require('../layout/endnote-pages');
    endnotePagesInfo = { count: 0, pages: buildEndnotePages(endnoteBlocks, settings, (t2, s2) => api.measureTextWidth(t2, s2), (s2) => api.lineHeightPx(s2), { ledger, eventLog }) };
    endnotePagesInfo.count = endnotePagesInfo.pages.length;
  }

  // count-endnote-pages=true ⇒ עמודי ההערות מצטרפים למספור (S7.1.1)
  if (settings['count-endnote-pages'] === true && endnotePagesInfo.pages.length) {
    let idx = pages.length ? pages[pages.length - 1].index + 1 : 0;
    for (const ep of endnotePagesInfo.pages) {
      ep.index = idx++;
      ep.template = buildPageTemplate(PAGE_TYPES.ENDNOTES, settings, ep.index % 2 === 0);
      pages.push(ep);
    }
    eventLog.emit('folio', 'endnote-pages-numbered', { count: endnotePagesInfo.pages.length });
  }

  // **P0-6 (D-47): הוכחת ניטרליות אמיתית** — hash גיאומטריה מחושב מחדש אחרי
  // פאס העיטורים ומושווה. הוספת עמודים מותרת (מסמן תוספת, לא מוטציה);
  // כל שינוי בשורות קיימות או הסרת עמוד ⇒ הבדיקה נכשלת.
  const cp5BodyAfter = pages.length >= cp4PageCount ? bodyGeometryHash(pages.slice(0, cp4PageCount)) : '<shrunk>';
  const geometryNeutralVerified = cp5BodyAfter === cp4BodyBefore;
  eventLog.emit('decorations', 'cp4-decoration-pass', {
    geometryNeutral: geometryNeutralVerified,
    sideNotesPlaced: sideNotePlacement.placed.length,
    sideNotesDeferred: sideNotePlacement.deferred.length,
    endnotePages: endnotePagesInfo.count
  });

  // S7.1.3: אימות המרת H7 — מחובר לצינור (בעבר פונקציה יתומה)
  const h7Mismatches = verifyH7Conversion(tokens, pages, sideNotePlacement);
  for (const m of h7Mismatches) {
    const rec = ledger.create('h7-conversion-missing', m.token, null, { text: m.text }, 'decorations');
    ledger.transition(rec.issue_id, 'persists', 'decorations', 'H7 token not placed as side note');
  }

  // ---- folio numbering (D-36: פתיחות אינן מציגות גיליון; S9: נוסחת V1 start-idx+initial) ----
  const numbers = assignNumbers(pages, settings);
  prog('folio', 82, 'מספור עמודים', { totalPages: pages.length });
  pages.forEach((pg, i) => {
    pg.pageNumber = numbers[i].page;
    pg.folioDisplay = numbers[i].shown ? numbers[i].display : '';
    pg.pageNumberDisplay = numbers[i].display; // מקור page-num לכותרות עליונות (P1-1)
  });

  // **S9.1.6 — בודק אינווריאנטים מספור (pn-sequence / pn-overflow → ledger):**
  // סדרה מונוטונית, בלי כפילות/דילוגים פרט ל"חסרים מוצהרים"; גיליון בתקציב רוחב.
  const { auditNumbering } = require('../decoration/numbering-audit');
  const numberingAudit = auditNumbering(pages, numbers, settings, (t) => api.measureTextWidth(t), { ledger, eventLog });

  // **S9 (D-62): פענוח עוגנים + תוויות גיליון בשורות ה‑TOC — לפי המספור הסופי.**
  if (tocPagesAll.length) {
    const { resolveTocTargets } = require('../decoration/toc-builder');
    const { tocPageLabel } = require('../decoration/folio');
    resolveTocTargets(pages, tocPagesAll, numbers, settings, { formatLabel: (v) => tocPageLabel(v, settings) });
  }

  // ---- headers ----
  const bookName = metadata['ספר'] || metadata['title'] || '';
  const { trimEdgePunctuation } = require('../decoration/headers-builder');
  // **FWD-1:** הפס חוצה־טורים נסרק גם הוא — כותרת H2 חיה שם עכשיו (S8)
  const pageLines = (pg) => [
    ...(pg.spanning ? pg.spanning.lines : []),
    ...pg.columns.flatMap(c => c)
  ];
  pages.forEach((pg, i) => {
    let h1 = '', h2 = '';
    pg._metadata = metadata; // S8: תיבות שער ראשי קוראות שם ספר/נושא (REQ-ORN-05)
    for (const ln of pageLines(pg)) {
      if (ln.kind === 'heading') { if (ln.level <= 1) h1 = ln.words.join(' '); else if (ln.level === 2) h2 = ln.words.join(' '); }
    }
    const firstCol = pg.columns[0] && pg.columns[0][0];
    const lastCol = pg.columns[pg.columns.length - 1];
    const lastLine = lastCol && lastCol[lastCol.length - 1];
    pg.headerCtx = { bookName, h1, h2 };
    // **S9 (פורט IMUD fillHeaderFirstLastWords):** מילה ראשונה/אחרונה — בלי פיסוק קצה
    // (הכותרת עצמה לא נחשבת כתוכן העמוד לעניין זה; מילים מנוקות מסימני פיסוק בקצוות).
    const bodyLines = pageLines(pg).filter(ln => ln.kind !== 'heading');
    const firstBody = bodyLines[0];
    const lastBody = bodyLines[bodyLines.length - 1];
    pg.firstWord = firstBody && firstBody.words ? trimEdgePunctuation(firstBody.words[0]) : '';
    pg.lastWord = lastBody && lastBody.words ? trimEdgePunctuation(lastBody.words[lastBody.words.length - 1]) : '';
    pg.isRecto = pg.index % 2 === 0;
    // **S9 (REQ-HDR-02):** האם העמוד נפתח בכותרת H2/H3 (שורת התוכן הראשונה בסדר קריאה)
    const firstLine = pageLines(pg)[0];
    pg.opensWithHeadingLevel = firstLine && firstLine.kind === 'heading' ? firstLine.level : null;
    // D-36 + REQ-HDR-02: עמודי פתיחה ללא כותרת עליונה — אלא אם הופעלה הכותרת הייעודית
    // לפותחות H2/H3 (הבדיקה בתוך buildHeader — מקור יחיד)
    pg.header = buildHeader(pg, settings, pg.headerCtx);
    // **S10 (REQ-UI-03):** התקדמות מדויקת לפי עמוד — "עמוד X מתוך Y" כאן Y סופי.
    prog('headers', 82 + Math.round(10 * ((i + 1) / pages.length)),
      `כותרות עליונות — עמוד ${i + 1} מתוך ${pages.length}`,
      { pageIndex: i + 1, totalPages: pages.length });
  });

  // ---- TOC (מודל לגרסאות ≤S8 — תאימות לאחור; עמודי ה‑TOC האמיתיים נבנו לעיל) ----
  const { buildTocEntries, splitGeneralDetail } = require('../decoration/toc-builder');
  const firstPageByToken = new Map();
  for (const pg of pages) {
    for (const ln of pageLines(pg)) { // **FWD-1:** כולל שורות הפס החוצה־טורים
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
    }
  }
  const headingsForToc = [];
  for (const b of blocks) {
    if (b.kind !== 'heading') continue;
    const page = firstPageByToken.has(b.tokenId) ? firstPageByToken.get(b.tokenId) : -1;
    if (page < 0) continue;
    headingsForToc.push({ level: b.level, text: b.lines.map(l => l.words.join(' ')).join(' ').trim(), page, tokenId: b.tokenId });
  }
  headingsForToc.sort((a, b) => a.page - b.page);
  const tocEntries = buildTocEntries(headingsForToc, settings, numbers);
  const toc = splitGeneralDetail(tocEntries, settings);

  // ---- אינטגריטיית שימור תוכן (BRZ-15) — identity-by-construction (D-30) ----
  // צד src: גוף + סמן + טקסט־הערה (לכל note-ref); הערות־סיום גלויות:
  //   endnotes-mode ⇒ סמן (מה שהודפס בעמודי ההערות) + טקסט; אחרת ⇒ הטקסט בגוף.
  // צד out: נספר ממקום ההצגה בפועל — שורות הגוף (כולל סמנים/placeholder),
  // מרזב (טקסט בלבד — הסמן נספר בגוף), עמודי הערות (טקסט ל-inline-refs;
  // סמן+טקסט לטוקנים גלויים), הערות צד.
  const scrubForCompare = (s0) => String(s0)
    .replace(/[\u00A0\uE000\uE101\uE102]/g, ' ')
    .replace(/\uFF9F/g, '\u05F3')
    .replace(/\uFF93/g, '\u05F4')
    .replace(/[\u27E6\u27E7]/g, '')
    .replace(/\s+/g, ' ').trim();

  /** פיצול placeholder: `${marker}\uE000${text}` → מרקר + מילות הטקסט (D-30). */
  function explodePlaceholderWord(w) {
    const s = String(w);
    const at = s.indexOf(ATOMIC);
    if (at > 0) {
      const marker = s.slice(0, at);
      const rest = s.slice(at + 1);
      return [...wordSeq(marker), ...wordSeq(rest)];
    }
    return wordSeq(s);
  }
  const wordSeq = (s0) => scrubForCompare(s0).split(' ').filter(Boolean);

  /** מפת סמנים מודפסים של טוקני הערות־סיום גלויים (מה שהודפס בפועל). */
  const printedEndnoteMarker = new Map(); // tokenId -> marker
  for (const ep of (endnotePagesInfo.pages || [])) {
    for (const n of ep.notes) {
      if (n.tokenId != null && !n.fromInline) printedEndnoteMarker.set(n.tokenId, n.marker);
    }
  }

  function srcWordsOf(t) {
    if (t.type === 'heading' || t.type === 'side-note') return wordSeq(t.text);
    if (t.type === 'endnote-class') return []; // directive (D-40) — לא תוכן
    if (t.type === 'editorial') return [];
    if (t.type === 'endnote') {
      if (notesMode === 'endnotes') {
        const marker = printedEndnoteMarker.get(t.id) || '';
        return [...wordSeq(marker), ...wordSeq(t.text)];
      }
      return wordSeq(t.text); // גוף: הטקסט בלבד (המספר במקור = עוגן סמן, לא תוכן — D-30)
    }
    // paragraph: גוף + לכל note-ref: סמן (בעוגן שבגוף) + טקסט ההערה
    // (ממקום הצגתו). הסמן אחד לכל המצטרים — הוקצה אחדת
    // בשלב הבלוק (מדיניות + סגנון) — identity-by-construction (D-30).
    const body = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
    const refs = t.parts.filter(p => p.kind === 'note-ref');
    const assigns = markersByToken.get(t.id) || [];
    const out = [...wordSeq(body)];
    // **S11:** פסקה שהוסבה כולה להערה בסגנון מותאם — הסמן נספר במקור פעם אחת:
    // footnote ⇒ הוקצה בבלוק; endnote ⇒ מה שהודפס בעמודי ההערות (printedEndnoteMarker)
    if (customFootnoteMarkers.has(t.id)) out.push(...wordSeq(customFootnoteMarkers.get(t.id)));
    if (customEndnoteTokens.has(t.id)) out.push(...wordSeq(printedEndnoteMarker.get(t.id) || ''));
    for (let i = 0; i < refs.length; i++) {
      const p = refs[i];
      const marker = assigns[i] ? assigns[i].marker : '';
      const noteText = String(t.notes[p.noteIndex]).replace(/\uE000/g, ' ');
      // סמן אחד (בגוף, בעוגן) + טקסט אחד (ממקום ההצגה) — בכל מצב
      out.push(...wordSeq(marker), ...wordSeq(noteText));
    }
    return out;
  }

  /** חילוץ מילים מהפלט המרונדר בפועל (בדיקת אמת של המבקר — לא הסכמה פנימית). */
  function outWordsOfAll() {
    const out = [];
    // 1) שורות הגוף של כל העמודים — כפי שמרונדרות (placeholder מפוצל).
    //    **FWD-1 (S8):** כולל שורות הפס החוצה־טורים — כותרות H2 חיות שם.
    for (const pg of pages) {
      for (const ln of pageLines(pg)) {
        for (const w of (ln.words || [])) {
          if (w.includes(ATOMIC)) out.push(...explodePlaceholderWord(w));
          else out.push(...wordSeq(w));
        }
      }
    }
    // 2) מרזב footnotes — טקסט בלבד (הסמן נספר פעם אחת בגוף — D-30)
    if (settings['footnotes-enabled'] && notesMode !== 'endnotes') {
      for (const pg of pages) {
        for (const n of pg.footnotes) {
          if (n.isContinuation || n.mode === 'split-rest') out.push(...wordSeq(n.text));
          else if (n.mode === 'split-first') out.push(...wordSeq(n.text));
          else if (n.rejected) { /* הוחזר לגוף — נספר שם */ }
          else out.push(...wordSeq(n.text));
        }
      }
    }
    // 3) עמודי הערות — inline-refs: טקסט בלבד; טוקנים גלויים: סמן + טקסט
    if (notesMode === 'endnotes') {
      for (const ep of (endnotePagesInfo.pages || [])) {
        for (const n of ep.notes) {
          if (n.fromInline) out.push(...wordSeq(n.text));            // הסמן נספר בגוף
          else out.push(...wordSeq(n.marker), ...wordSeq(n.text));   // אין עוגן בגוף
        }
      }
    }
    // 4) הערות צד — טקסט מהמיקום שהוצג
    for (const p of sideNotePlacement.placed) out.push(...wordSeq(p.text));
    return out;
  }

  const srcTokens = tokens.filter(t => t.type !== 'editorial' && t.type !== 'endnote-class');
  let contentPreserved = true;
  const mismatchDetail = [];
  const gSrc = [], gOut = [];
  // **D-83 (תיקון קריסת ספר־אמת 03.11):** הזרקה בלולאה בלבד. spread על מערך ענק
  // (ספר שלם, >125,154 מילים = מגבלת הארגומנטים של V8) זרק "Maximum call stack
  // size exceeded" — העימוד עצמו הושלם והקריסה אירעה דווקא בבדיקת שימור התוכן
  // שבסוף ה־pipeline. לולאת for אינה תלויה בגודל המחסנית.
  const pushAll = (dst, src) => { for (let i = 0; i < src.length; i++) dst.push(src[i]); };
  for (const t of srcTokens) pushAll(gSrc, srcWordsOf(t));
  pushAll(gOut, outWordsOfAll());

  const norm = (arr) => arr.slice().sort().join('\n');
  if (norm(gSrc) !== norm(gOut)) {
    contentPreserved = false;
    const cnt = (a) => a.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
    const cs = cnt(gSrc), co = cnt(gOut), diff = {};
    for (const w of new Set([...Object.keys(cs), ...Object.keys(co)])) {
      const dd = (cs[w] || 0) - (co[w] || 0);
      if (dd !== 0) diff[w] = dd;
    }
    mismatchDetail.push({ kind: 'multiset-mismatch', diff });
  }

  // כל טוקן מיוצג (נמצא בפלט או הומר להערת צד / עמודי הערות)
  const blocksByToken = new Map();
  for (const b of blocks) if (!blocksByToken.has(b.tokenId)) blocksByToken.set(b.tokenId, b);
  const placedSideAnchors = new Set(sideNotePlacement.placed.map(p => p.anchorToken));
  const endnoteRepresented = new Set(endnoteBlocks.map(e => e.tokenId));
  for (const t of srcTokens) {
    const placedAsSide = placedSideAnchors.has(t.id);
    const representedElsewhere = endnoteRepresented.has(t.id);
    if (!blocksByToken.has(t.id) && !placedAsSide && !representedElsewhere) {
      contentPreserved = false; mismatchDetail.push({ token: t.id, kind: 'token-not-placed' });
    }
  }

  // **עקביות סמנים (P1-3):** סמן הגוף == סמן מקום ההצגה, לכל הערה — בדיקת אמת.
  {
    // סמנים ידועים של המסמך (מדוקים בלבד — ללד חיווים) + סמני הערות סיום גלויות
    const knownMarkers = new Set();
    for (const b of blocks) for (const a of (b.noteAssignments || [])) knownMarkers.add(a.marker);
    for (const ep of (endnotePagesInfo.pages || [])) for (const n of ep.notes) if (!n.fromInline) knownMarkers.add(n.marker);
    const countKnown = (w) => {
      // מדויק (D-53): סמן מזוהה רק לפי תג (E102) או placeholder (E000).
      // מילה רגילה (ספרה 1 בטקסט, סגנון decimal) אינה סמן (NC-10).
      const sw = String(w);
      if (sw.includes(ATOMIC)) {
        // placeholder עם E000 (reject-to-body; נוצר אחרי תכנון השורות):
        // הסמן הוא הפרגמנט המוכר שלפני ה‑E000 (עשוי להיות ממוזג לעוגן ב‑NBSP).
        const at = sw.indexOf(ATOMIC);
        const frags = wordSeq(sw.slice(0, at));
        return frags.slice().reverse().find(f => knownMarkers.has(f)) || null;
      }
      if (!sw.includes(MARK_TAG)) return null;
      const at = sw.indexOf(MARK_TAG);
      const frag = sw.slice(at + 1).split(/[\u00A0 ]/)[0];
      return knownMarkers.has(frag) ? frag : null;
    };


    const bodyMarkers = [];
    for (const pg of pages) for (const ln of pageLines(pg)) { // FWD-1: כולל פס חוצה־טורים
      for (const w of (ln.words || [])) {
        const km = countKnown(w); // תג/E000 בלבד — ראה D-53; מילה רגילה אינה סמן
        if (km) bodyMarkers.push(km);
      }
    }
    // \u05d4\u05d0\u05de\u05ea: \u05d4\u05e1\u05de\u05e0\u05d9\u05dd \u05e9\u05d4\u05d5\u05e7\u05e6\u05d5 \u05dc\u05de\u05e1\u05de\u05da (\u05de\u05d5\u05e0\u05d9\u05dd \u05de\u05d5\u05d1\u05df \u05d0\u05d7\u05d3) \u2014 \u05de\u05d5\u05db\u05d7\u05d9\u05dd \u05de\u05d5\u05dc \u05d4\u05e1\u05de\u05da
    const assignedAll = [];
    for (const b of blocks) for (const a of (b.noteAssignments || [])) assignedAll.push(a.marker);
    // \u05de\u05e7\u05d5\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3 (\u05de\u05e8\u05d6\u05d1 / \u05e2\u05de\u05d5\u05d3\u05d9 \u05d4\u05e2\u05e8\u05d5\u05ea) — \u05d1\u05de\u05e6\u05d1\u05d9\u05dd \u05d0\u05dc\u05d5 \u05d1\u05dc\u05d1\u05d3
    // rejected-to-body: displayed in the body (body count covers it) - excluded from separate-display compare
    const rejectedMarkers = new Set();
    for (const b of blocks) for (const rn of (b.rejectedNotes || [])) rejectedMarkers.add(rn.marker);
    const displayMarkers = [];
    if (settings['footnotes-enabled'] && notesMode !== 'endnotes') {
      for (const pg of pages) for (const n of pg.footnotes) if (n.marker && !n.isContinuation && n.mode !== 'split-rest') displayMarkers.push(n.marker); // continuation = repeat, not a separate anchor
    }
    if (notesMode === 'endnotes') {
      for (const ep of (endnotePagesInfo.pages || [])) for (const n of ep.notes) {
        if (n.fromInline && n.marker) displayMarkers.push(n.marker);
      }
    }
    const cnt = (a) => a.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {});
    const cb = cnt(bodyMarkers.filter(Boolean));
    const ca = cnt(assignedAll);
    const cd = cnt(displayMarkers.filter(Boolean));
    // \u05d2\u05d5\u05e3: \u05db\u05dc \u05e1\u05de\u05df \u05de\u05d5\u05e7\u05e6\u05d4 \u05de\u05d5\u05e4\u05d9\u05e2 \u05d1\u05d3\u05d5\u05e7 \u05e4\u05e2\u05dd \u05d0\u05d7\u05ea
    for (const k of new Set([...Object.keys(cb), ...Object.keys(ca)])) {
      if ((cb[k] || 0) !== (ca[k] || 0)) {
        contentPreserved = false;
        mismatchDetail.push({ kind: 'marker-mismatch', where: 'body', marker: k, body: cb[k] || 0, assigned: ca[k] || 0 });
      }
    }
    // \u05de\u05e7\u05d5\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3: \u05d0\u05d5\u05ea\u05d5 \u05e1\u05de\u05df \u05d1\u05d3\u05d5\u05e7 (\u05e8\u05e7 \uu05d1\u05de\u05e6\u05d1\u05d9\u05dd \u05e2\u05dd \u05d4\u05e6\u05d2\u05d4 \u05e0\u05e4\u05e8\u05d3\u05ea — \u05dc\u05d0 placeholder)
    if (displayMarkers.length || (notesMode !== 'inline' && settings['footnotes-enabled'])) {
      const cdd = cnt(displayMarkers);
      const cad = cnt(assignedAll.filter(m => !rejectedMarkers.has(m)));
      for (const k of new Set([...Object.keys(cdd), ...Object.keys(cad)])) {
        if ((cdd[k] || 0) !== (cad[k] || 0)) {
          contentPreserved = false;
          mismatchDetail.push({ kind: 'marker-mismatch', where: 'display', marker: k, display: cdd[k] || 0, assigned: cad[k] || 0 });
        }
      }
    }
  }



  if (!contentPreserved) {
    const rec = ledger.create('text-completeness', 'document', null, { hashIn, mismatches: mismatchDetail }, 'render');
    ledger.transition(rec.issue_id, 'persists', 'render', 'word-multiset mismatch \u2014 token loss/duplication detected');
  }

  // **P1-2: \u05d0\u05db\u05dc\u05d5\u05e1 parenRanges \u05de\u05de\u05e4\u05ea \u05d4\u05d4\u05d9\u05e7\u05e3** \u2014 \u05d4\u05d2\u05e0\u05ea paren-cross-boundary \u05d7\u05d9\u05d4
  {
    let spanId = 0;
    for (const b of blocks) {
      if (b.kind !== 'paragraph' || !b.parenCharSpans || !b.parenCharSpans.length) continue;
      if (!b.flatWordOffsets || !b.flatWordOffsets.length) continue;
      // \u05de\u05d9\u05e4\u05d5\u05d9 \u05d8\u05d5\u05d5\u05d7\u05d9 (...) \u05dc\u05de\u05d3\u05d3\u05d9 \u05de\u05d9\u05dc\u05d9\u05dd \u05d1\u05e8\u05e6\u05e3 \u05d4\u05d1\u05dc\u05d5\u05e7 (\u05e1\u05d3\u05e8 \u05de\u05e1\u05de\u05da, \u05dc\u05d0 \u05d7\u05d9\u05e4\u05d5\u05e9\u05d9\u05dd)
      const ranges = [];
      for (const sp of b.parenCharSpans) {
        const startW = b.flatWordOffsets.find(x => x.at > sp.from && x.at < sp.to);
        const endW = b.flatWordOffsets.find(x => x.at > sp.from && x.at < sp.to && x.at >= (startW ? startW.at : 0));
        if (startW && endW) ranges.push({ startWi: b.flatWordOffsets.indexOf(startW), endWi: b.flatWordOffsets.indexOf(endW) });
      }
      for (const r of ranges) {
        // \u05de\u05d9\u05e4\u05d5\u05d9 \u05de\u05d3\u05d3\u05d9 \u05de\u05d9\u05dc\u05d4 \u05dc\u05e9\u05d5\u05e8\u05d5\u05ea \u05d4\u05d1\u05dc\u05d5\u05e7 \u2014 \u05d5\u05de\u05e9\u05dd \u05dc\u05de\u05e7\u05d5\u05dd \u05d1\u05e4\u05e8\u05d9\u05e1\u05d4
        let acc = 0, startLine = -1, endLine = -1;
        for (let li = 0; li < b.lines.length; li++) {
          const len = (b.lines[li].words || []).length;
          if (startLine < 0 && acc + len > r.startWi) startLine = li;
          if (endLine < 0 && acc + len > r.endWi) endLine = li;
          acc += len;
        }
        if (startLine < 0 || endLine < 0) continue;
        const found = { start: null, end: null };
        for (const pg of pages) {
          for (let c = 0; c < pg.columns.length; c++) {
            for (const ln of pg.columns[c]) {
              const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
              if (tok !== b.tokenId) continue;
              const lIdx = ln.meta && ln.meta.lineIdx != null ? ln.meta.lineIdx : null;
              if (lIdx === null) continue;
              if (lIdx === startLine) found.start = { page: pg.index, col: c };
              if (lIdx === endLine) found.end = { page: pg.index, col: c };
            }
          }
        }
        if (found.start && found.end) {
          spanId++;
          const host = pages.find(pg => pg.index === found.start.page);
          if (host) {
            host.parenRanges = host.parenRanges || [];
            host.parenRanges.push({
              id: `p${spanId}@${b.tokenId}`,
              startPage: found.start.page, startCol: found.start.col,
              endPage: found.end.page, endCol: found.end.col
            });
          }
        }
      }
    }
    if (spanId) eventLog.emit('scope-map', 'paren-ranges-populated', { count: spanId });
  }

  // ---- ledger finalize + CP5 ----
  eventLog.emit('ledger-finalize', 'summary', ledger.summary());
  const finalHash = layoutHash(pages); // hash \u05e9\u05dc \u05d4\u05de\u05e6\u05d1 \u05d4\u05e1\u05d5\u05e4\u05d9 (\u05d3\u05d8\u05e8\u05de\u05d9\u05e0\u05d9\u05d6\u05dd \u05d1\u05d9\u05df\u05be\u05e8\u05d9\u05e6\u05d5\u05ea)
  eventLog.emit('render', 'cp5-render-ready', { layoutHash: finalHash });
  prog('render', 100, 'מוכן לתצוגה', { totalPages: pages.length, layoutHash: finalHash });

  // **S11 (REQ-GOV-11):** המלצות עריכה — רק עם הוכחת dry-run חיה (D-16).
  // דוק >200 עמודים ⇒ לא אוטומטי (שומר ביצועים); env.wantRecommendations=true ⇒ כן.
  let recommendations = null;
  if (!env || env.noRecommendations !== true) {
    recommendations = computeEditingRecommendations(
      rawText, settingsIn || {},
      { pages, ledger, layoutHash: finalHash },
      { force: !!(env && env.wantRecommendations === true) }
    );
  }

  return {
    metadata, tokens, pages, ledger, events: eventLog,
    toc, numbers,
    tocPages: tocPagesAll,          // **S9:** עמודי תוכן־העניינים האמיתיים (אובייקטים בתוך pages)
    tocInsert: tocInsertInfo,       // **S9:** היכן הוכנסו וכמה
    numberingAudit,                 // **S9:** ממצאי pn-sequence/pn-overflow
    settings,
    contentHashIn: hashIn,
    contentPreserved,
    layoutHash: finalHash,
    plannedLayoutHash: planned.hash,
    geometryNeutralVerified,
    ornaments: ornamentPass,
    retreat: planned.retreat,
    sideNotes: sideNotePlacement,
    endnotePages: endnotePagesInfo,
    endnotePagesInfo,
    scope,
    customStyles: customStylesRes,  // **S11:** הסגנונות שהופעלו בפועל (כולל שגיאות אימות)
    recommendations                 // **S11:** המלצות עריכה עם הוכחות (או null אם כובו)
  };
}

module.exports = { typeset };
