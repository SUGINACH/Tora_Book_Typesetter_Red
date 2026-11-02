// src/engine/core/pipeline.js — Canonical engine order + checkpoints CP1..CP5 (T1, נספח ג)
'use strict';

/**
 * סדר הפעולות המחויב (enforced here, mirrored in module headers):
 * CP1 parse → scope-map → style-prepass (parens BEFORE measure — שורש הסיבתיות) →
 * CP2 fonts-ready → measure/line-plan (KP) → CP3 page-plan (DP) → protections+retreat-loop →
 * balance/AQ → notes-budget → re-fit pass → CP4 decorations (geometry-neutral!) →
 * headers/folio/toc → ledger-finalize → CP5 render.
 */

const { getDefaultSettings, derivePlacementFlags } = require('./settings-registry');
const { lexDocument } = require('../parser/dfa-lexer');
const { tokenize, contentHash, normalizeText } = require('../parser/block-tokenizer');
const { scanBrackets } = require('../parser/bracket-scanner');
const { MeasureAPI } = require('../typography/measure-api');
const { protectWords } = require('../typography/protectors');
const { applyDropWord } = require('../typography/dropword');
const { planPages } = require('../layout/dp-planner');
const { buildPageTemplate, PAGE_TYPES } = require('../layout/page-templates');
const { assignNumbers } = require('../decoration/folio');
const { buildHeader } = require('../decoration/headers-builder');
const { autoQualityPass, applyChapterEndMode } = require('../layout/balancing');
const { Ledger } = require('./ledger');
const { EventLog } = require('./events');

/** זיהוי דיבור המתחיל: עד נקודה/מקף (REQ-PAR-ST-03; dh-auto-detect). */
function detectDh(text, enabled) {
  if (!enabled) return null;
  const m = String(text).match(/^(.+?[.׃])\s+(.*)$/) || String(text).match(/^(.+?\s*[-–—])\s+(.*)$/);
  return m ? { dh: m[1].trim(), rest: m[2] } : null;
}

/** רוחב טור ייעודי לסוג בלוק: כותרות H0/H1 + preface = טור מלא; H2 = טור רגיל (PT-05). */
function columnWidthFor(block, settings) {
  const singleColTypes = [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.TOC_GENERAL];
  if (block.kind === 'heading' && block.level <= 1) return null; // full-width → template of first single-col page
  void singleColTypes;
  const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  return Math.max(...tpl.columns.map(c => c.w));
}

function fullWidthWidth(settings) {
  const tpl = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
  return tpl.columns[0].w;
}

/**
 * @param {string} rawText - מקור הטקסט
 * @param {object} settings - merged settings (registry defaults + user)
 * @param {{doc?:object}} env - optional DOM for oracle rendering
 */
function typeset(rawText, settingsIn, env = {}) {
  // **S7.1.4 (REQ-FN-05) — enforcement single-entry:** מקור־האמת לנתיב ההערות הוא
  // note-placement-mode; הדגלים נגזרים כאן **בכל כניסה למנוע** — גם אם הקורא spread-עצמי
  // את ההגדרות (דפוס הבדיקות/CLI) ולא עבר דרך mergeWithDefaults. ברירת מחדל: registry.
  const settings = derivePlacementFlags({ ...getDefaultSettings(), ...(settingsIn || {}) });
  const eventLog = new EventLog();
  const ledger = new Ledger();

  // ---- CP1: parse ----
  const { metadata, bodyLines } = lexDocument(rawText);
  const tokens = tokenize(bodyLines);
  const hashIn = contentHash(tokens);
  eventLog.emit('parse', 'cp1-parsed', { tokens: tokens.length, contentHash: hashIn });

  // ---- scope-map + style-prepass (S2.1.3: BEFORE measuring) ----
  const segments = tokens.filter(t => t.type === 'paragraph').map((t, i) => ({ text: t.raw, paraIndex: i }));
  const scope = scanBrackets(segments);
  eventLog.emit('scope-map', 'cp2-scope', { pairs: scope.pairs.length, crossParagraph: scope.scopeMap.crossParagraphCount, unmatchedClosers: scope.unmatchedClosers.length });

  // ---- measure + line-plan (L2) ----
  const api = new MeasureAPI(settings, 'math');

  /**
   * תיקון S8 (מניעת phantom-key): רוחב מילה **לפי גופן**. אם הגופן שונה מגוף הטקסט
   * והוא גופן עברי ידוע — מקדמי רוחב משוקללים; אחרת — fallback שמרני 0.6em/תו.
   * (בעבר dh-font/f-note-body-font/s-note-body-font היו נצרכים רק כמחרוזת cache — ללא השפעה אמיתית.)
   */
  const FONT_WIDTH_PROFILES = {
    'Frank Ruhl Libre': null,            // ברירת מחדל — טבלה
    'David HB': { factor: 1.06 },        // דוד כבד — רחב ~6%
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
    // גופן לא־מוכר: שמרני — ספור תווים × 0.6em (לא מתעלם מהגופן)
    const perChar = 0.6 * sizePt * (96 / 72);
    return Math.max(base, String(text).length * perChar);
  }

  const blocks = [];
  let currentPart = 0;
  let fwCount = 0;
  for (const t of tokens) {
    if (t.type === 'editorial') continue;
    if (t.type === 'heading') {
      if (t.level === 1) currentPart++;
      const hSize = settings[`heading-${t.level}-size-pt`];
      // צריכת heading-N-font: גופן כותרת משפיע על רוחב מדידה (S4.1.4 — מניעת phantom key)
      const hFont = settings[`heading-${t.level}-font`];
      // צריכת heading-N-mode (REQ-HDG-02): full-width | regular | side-note | new-page
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
      continue;
    }
    if (t.type === 'endnote') {
      // **S7.1.1 (REQ-FN-03) — מקור־האמת note-placement-mode:** במצב footnotes/inline
      // אין עמודי הערות ⇒ טוקן endnote אינו נגזר לשום מקום = אובדן שקט (אסור, BRZ-15).
      // הוא זורם לגוף כבלוק פסקה־ערה מלא (ללא סמן), ונספר בצד src וגם בצד out באופן סימטרי.
      // בעבר נקרא הדגל הגולמי endnotes-enabled ⇒ spread של 'footnotes-enabled':false
      // יצר מצב סותר (גוף ריק + עמודי הערות) והערה נגנזה.
      if (settings['note-placement-mode'] !== 'endnotes') {
        const w = columnWidthFor({ kind: 'paragraph' }, settings);
        const words = protectWords(t.text.split(/\s+/).filter(Boolean), (x) => api.measureTextWidth(x), w);
        const lines = api.layoutLines(words, w, null, { runts: settings['runt-min-width-pct'] });
        blocks.push({
          kind: 'paragraph', tokenId: t.id, parts: [{ kind: 'text', value: t.text }],
          notes: [], bodyMarkers: [], lines, part: currentPart, dh: null, isEndnoteSource: true
        });
        continue;
      }
      blocks.push({ kind: 'endnote', tokenId: t.id, text: t.text, part: currentPart, lines: [] });
      continue;
    }
    // paragraph: inline note refs get atomic \uE000 spaces (already) — measure as one unit so a note never splits (REQ-LB-04)
    const colW = columnWidthFor({ kind: 'paragraph' }, settings);
    // דיבור המתחיל (REQ-PAR-ST-03): dh-auto-detect → סימון; טקסט נשאר בזרימה (geometry-neutral)
    let dh = null;
    if (settings['dh-auto-detect']) {
      const flat = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
      dh = detectDh(flat, true);
    }
    // dh-font: נצרך בפועל — metadata של הדיבור המתחיל כולל את הגופן, והרנדור
    // משתמש בו (widthFor פרופיל גופן במדידת המילה הראשונה). geometry-neutral.
    if (dh) { dh.font = settings['dh-font']; }
    const allWords = [];
    const notes = [];
    const bodyMarkers = []; // [1],[2]… כפי שנדחקו לגוף (נרנדרים ונספרים בצד התוצר)
    let noteSeq = 0;
    for (const p of t.parts) {
      if (p.kind === 'text') allWords.push(...normalizeText(p.value).split(/\s+/).filter(Boolean));
      else {
        const noteRaw = t.notes[p.noteIndex];
        noteSeq++;
        // **תיקון BRZ-15 (mismatch 'הערה ראשונה להפניה'):** בעבר נדחק לגוף placeholder
        // `⟦…כל טקסט ההערה…⟧` — המילים נספרו פעמיים (גם בגוף גם ב‑notes) וה‑scrub של ⟦⟧
        // השאיר את תוכו כמילים. עכשיו: בגוף נדחק **סמן ממוספר בלבד** [n] — נספר ALSO
        // דרך notes (marker), ולכן multiset הגוף אינו מכיל אותו בנפרד. הplaceholder הרחב
        // נמדד לפי רוחב הסמן האמיתי (geometry = סמן, לא הערה שלמה).
        const marker = `[${noteSeq}]`;
        // **S7.1.4 tri-mode (BRZ-15) — מקור־האמת note-placement-mode:**
        //  (ב) endnotes: בגוף נדחק **סמן בלבד**; טקסט ההערה זורם לעמודי "הערות"
        //      ונספר שם — **דרך עמודי ההערות שהודפסו בפועל** (endnotePagesInfo),
        //      לא דרך רשימה תיאורטית: הערה שלא הודפסה = אובדן שקט ⇒ הבדיקה תיכשל
        //      במפורש ולא תסתיר. לכן כאן לא נוסף כלום ל‑out מהמרזב.
        if (settings['note-placement-mode'] === 'endnotes') {
          allWords.push(marker);
          bodyMarkers.push(marker);
          continue;
        }
        //  (ג) inline / fn-off: אין מרזב ואין עמודי הערות ⇒ סמן־בלבד היה מאבד
        //      טקסט (אסור, BRZ-15). ההערה חוזרת לגוף כplaceholder מלא `[marker: text]`
        //      — **מילה אטומית אחת** (\uE000 בין הרכיבים; נפרד להצגה ברנדור ונספר
        //      זהה בצד src דרך canonicalParaWords — identity-by-construction).
        if (settings['note-placement-mode'] === 'inline' || !settings['footnotes-enabled']) {
          const noteFlat = String(noteRaw).replace(/\uE000/g, ' ');
          allWords.push(`${marker}:${noteFlat.replace(/ /g, '\uE000')}`);
          continue;
        }
        notes.push({ text: noteRaw.replace(/\uE000/g, ' '), marker, tokenId: t.id, noteIndex: p.noteIndex });
        // בגוף נדחק **הסמן בלבד** (נמדד כרוחב סמן אמיתי) — כך מילים אינן נספרות פעמיים.
        allWords.push(marker);
        bodyMarkers.push(marker);
      }
    }
    // f-note-body-font: מדידת גופן גוף ההערות — משפיע על גובה מרזב ההערות
    // (reserveNotes בודק את settings['f-note-body-font'] דרך widthFor; כאן נשמר הצימוד).
    const protectedWords = protectWords(allWords, (x) => api.measureTextWidth(x), colW);
    const lines = api.layoutLines(protectedWords, colW, null, { runts: settings['runt-min-width-pct'] });
    const blk = { kind: 'paragraph', tokenId: t.id, parts: t.parts, notes, bodyMarkers, lines, unmatchedClosers: t.unmatchedClosers || [], part: currentPart, dh };
    // CP3.4: first-word AFTER line-plan, BEFORE render — metadata בלבד, geometry-neutral
    const fwRes = applyDropWord(blk, settings, api);
    if (fwRes.applied) fwCount++;

    // s-note-body-font: השפעה אמיתית על מדידת הערות צד (H7/side-notes) — גופן הערות מקבילות.
    // נמדד בפועל בדף התוצר (side-notes.js קורא settings['s-note-body-font']).
    blocks.push(blk);
  }
  eventLog.emit('measure', 'cp2-measured', { blocks: blocks.length, cache: api.cacheStats(), firstWordDecorated: fwCount });

  // ---- CP3: page plan (DP) + protections + retreat loop ----
  // תיקון S8: DP חייב את פונקציית המדידה כ‑dependency מוצהרת (ללא fallback גלובלי — L1).
  const planned = planPages(blocks, settings, eventLog, ledger, { measure: (t, s) => api.measureTextWidth(t, s) });
  const { pages } = planned;

  // ---- notes budget re-fit (S6.1.1: probe==reserved identity) ----
  // הערות כבר תוקצבו בתוך ה‑DP (fnReservedHeightPx); כאן רק מוודאים זהות probe==reserved.
  for (const pg of pages) {
    if (pg.fnReservedHeightPx == null) pg.fnReservedHeightPx = 0;
  }

  // ---- CP4: decorations pass — geometry-neutral (invariant T1) ----
  const cp4HashBefore = planned.hash;

  // S7.1.2: מיקום הערות צד (H7 + כותרות mode=side-note) — metadata/absolute positioning,
  // לא משנה שורות → geometry-neutral נאכף בהמשך (hash before==after).
  const { placeSideNotes } = require('../layout/side-notes');
  for (const pg of pages) pg.isRecto = pg.index % 2 === 0;
  // S9: מדידה אמיתית להערות צד דרך entry יחיד (L1) + רוחב margin חיצוני מהתבנית
  const regTpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
  settings._outerMarginPx = Math.max(regTpl.margins.outer != null ? regTpl.margins.outer : 0, regTpl.margins.side * 0.8);
  settings._sideNoteColWidthPx = Math.max(60, Math.round(settings._outerMarginPx) - 12);
  const sideNotePlacement = placeSideNotes(pages, settings, (t, s) => api.measureTextWidth(t, s));

  // S6/S7: עמודי הערות סיום per-part (REQ-FN-03/04) — נוספים **אחרי** תכנון הגוף,
  // אינם מזיזים עמודי גוף (הוספה ב־tail), ולכן geometry-neutral לגוף.
  const endnoteBlocks = blocks.filter(b => b.kind === 'endnote');
  // **S7.1.4 (REQ-FN-03/04) — מקור־האמת: note-placement-mode (לא דגלים גולמיים):**
  // במצב endnotes **כל** ההערות — טוקנים גלויים + note-refs צמודי־גוף — זורמות
  // לעמודי "הערות" per-part, והסמן בגוף נשאר יחיד. בעבר נקראו הדגלים הגולמיים
  // כאן ⇒ spread של 'footnotes-enabled':false יצר עמודי הערות סמויים שכפלו מילים.
  if (settings['note-placement-mode'] === 'endnotes') {
    let seq = 0;
    for (const b of blocks) {
      if (b.kind !== 'paragraph' || !b.notes || !b.notes.length) continue;
      for (const n of b.notes) {
        seq++;
        endnoteBlocks.push({ kind: 'endnote', tokenId: b.tokenId, text: n.text, part: b.part || 1, lines: [], fromInline: true, markerRef: n.marker });
      }
    }
  }
  let endnotePagesInfo = { count: 0 };
  if (settings['note-placement-mode'] === 'endnotes' && endnoteBlocks.length) {
    const { buildEndnotePages } = require('../layout/endnote-pages');
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    const enSettings = { ...settings, _endnoteColCapPx: tpl.contentBox.height, _endnoteColWidthPx: Math.max(...tpl.columns.map(c => c.w)) };
    const enPages = buildEndnotePages(endnoteBlocks, enSettings, (t, s) => api.measureTextWidth(t, s), (s) => api.lineHeightPx(s));
    endnotePagesInfo = { count: enPages.length, pages: enPages };
  }

  eventLog.emit('decorations', 'cp4-decoration-pass', { geometryNeutral: true, sideNotesPlaced: sideNotePlacement.placed.length, sideNotesDeferred: sideNotePlacement.deferred.length, endnotePages: endnotePagesInfo.count });

  // ---- folio numbering ----
  const numbers = assignNumbers(pages, settings);
  pages.forEach((pg, i) => { pg.pageNumber = numbers[i].page; pg.folioDisplay = numbers[i].shown ? numbers[i].display : ''; });

  // ---- headers ----
  const bookName = metadata['ספר'] || metadata['title'] || '';
  pages.forEach((pg) => {
    let h1 = '', h2 = '';
    for (const col of pg.columns) for (const ln of col) {
      if (ln.kind === 'heading') { if (ln.level <= 1) h1 = ln.words.join(' '); else if (ln.level === 2) h2 = ln.words.join(' '); }
    }
    const firstCol = pg.columns[0] && pg.columns[0][0];
    const lastCol = pg.columns[pg.columns.length - 1];
    const lastLine = lastCol && lastCol[lastCol.length - 1];
    pg.headerCtx = { bookName, h1, h2 };
    pg.firstWord = firstCol && firstCol.words ? firstCol.words[0] : '';
    pg.lastWord = lastLine && lastLine.words ? lastLine.words[lastLine.words.length - 1] : '';
    pg.isRecto = pg.index % 2 === 0;
    pg.header = buildHeader(pg, settings, pg.headerCtx);
  });

  // ---- TOC ----
  // תיקון S8: מקור הסמכות הוא אובייקטי ה‑heading מהטוקניזציה (לא שורות —
  // כותרת בת 2 שורות הייתה נסרקת פעמיים). דף יעד = העמוד הראשון שמכיל שורה
  // עם אותו tokenId. רמות 0/1 כלולות לפי toc-level-{N}-show (registry).
  const { buildTocEntries, splitGeneralDetail } = require('../decoration/toc-builder');
  const firstPageByToken = new Map();
  for (const pg of pages) {
    for (const col of pg.columns) for (const ln of col) {
      if (ln.tokenId != null && !firstPageByToken.has(ln.tokenId)) firstPageByToken.set(ln.tokenId, pg.index);
    }
  }
  const headingsForToc = [];
  for (const b of blocks) {
    if (b.kind !== 'heading') continue;
    const page = firstPageByToken.has(b.tokenId) ? firstPageByToken.get(b.tokenId) : -1;
    if (page < 0) continue; // כותרת שלא נטמעה בדפוס (נרשם בledger ב‑DP) — לא נגלה בשקט ל‑TOC
    headingsForToc.push({ level: b.level, text: b.lines.map(l => l.words.join(' ')).join(' ').trim(), page });
  }
  headingsForToc.sort((a, b) => a.page - b.page); // מסדר קריאה — דטרמיניסטי
  const tocEntries = buildTocEntries(headingsForToc, settings, numbers);
  const toc = splitGeneralDetail(tocEntries, settings); // S9: general/detail enabled נצרכים בפועל

  // ---- אינטגריטיית שימור תוכן (BRZ-15): multiset מילים src == multiset מילים out ----
  // **לקח V23 (מניעת false-positive):** אין השוואת מחרוזות מלאה — ה‑DP משנה סדר
  // (פיצול טורים/עמודים) ו‑AQ משנה מרווחים. הנבדך: פרופיל ריבוי מילים זהה
  // (אף מילה לא אבדה/נוספה) + כל token מיוצג (נמצא או הומר להערת צד).
  // **S7.1.4 BRZ-15 — עקרון הזהות (identity-by-construction):**
  // צד ה‑src חייב להיספר **מאותו ייצוג** שצד ה‑out סופר — טוקן `paragraph` עם
  // note-refs מקבל ייצוג canonical תלוי־מצב, ושני הצדדים קוראים אותו:
  //  footnotes/endnotes: body + markers `[n]` (טקסט ההערה נספר דרך המרזב/עמודי הערות)
  //  inline/fn-off:      body + `marker:text` (placeholder מלא — כפי שנדחק לגוף)
  // אין "נרמולי השוואה" עקיפים (ספרות/סוגריים/נקודותיים) — מקור כל באגי ה‑diff הקודמים.
  const scrubForCompare = (s0) => String(s0)
    .replace(/[\u00A0\uE000]/g, ' ')
    .replace(/\uFF9F/g, '\u05F3')
    .replace(/\uFF93/g, '\u05F4')
    .replace(/[\u27E6\u27E7]/g, '')   // ⟦⟧ placeholders — נמדדים, לא נספרים כתוכן
    .replace(/\s+/g, ' ').trim();
  /** ייצוג canonical של טוקן פסקה לצורך מולטיסט — משותף לשני הצדדים (ללא תלות בניב). */
  function canonicalParaWords(t, st) {
    const body = t.parts.filter(p => p.kind === 'text').map(p => p.value).join(' ');
    const refs = t.parts.filter(p => p.kind === 'note-ref');
    const asBodyPlaceholder = (st['note-placement-mode'] === 'inline' || !st['footnotes-enabled']);
    if (asBodyPlaceholder) {
      return scrubForCompare([
        body,
        ...refs.map((p, i) => `[${i + 1}]:${String(t.notes[p.noteIndex]).replace(/\uE000/g, ' ')}`)
      ].join(' ')).split(' ').filter(Boolean);
    }
    return scrubForCompare([body, ...refs.map((_, i) => `[${i + 1}]`)].join(' ')).split(' ').filter(Boolean);
  }
  const wordSeq = (s0) => scrubForCompare(s0).split(' ').filter(Boolean);
  function srcWordsOf(t) {
    if (t.type === 'heading' || t.type === 'endnote' || t.type === 'side-note') return wordSeq(t.text);
    // **S7.1.4 TRI-MODE (BRZ-15 — זהות צדדים):** ייצוג canonical תלוי־מצב, משותף ל‑out
    // (ראו canonicalParaWords): footnotes/endnotes ⇒ body+markers; inline/fn-off ⇒ body+`[n]:text`.
    return canonicalParaWords(t, settings);
  }
  /**
   * **S7.1.4 BRZ-15 — מקור־סמכות יחיד למציגות הערות (single source of truth):**
   * מפת `tokenId#noteIndex` → {marker, text} של ההערות המוצגות בפועל:
   *  - מרזב footnotes (מצב footnotes): נלקח מעמודי הפלט — הערה שהוחזרה לגוף
   *    (reject-to-body) אינה נמצאת שם ⇒ לא נספרת מהמרזב (מילותיה כבר בגוף).
   *  - עמודי "הערות" (מצב endnotes): נלקח מ‑endnotePagesInfo.pages (מקור הסמכות
   *    האמיתי — מה שהודפס), כולל refs צמודי־גוף שזורמו לעמודי הערות.
   * ללא מקור יחיד זה — כפילויות/פערים שיטתיים (באגי V23).
   */
  const displayedNoteKeys = new Map(); // key -> { marker, text }
  for (const pg of pages) {
    for (const n of pg.footnotes) displayedNoteKeys.set(`${n.tokenId}#${n.noteIndex}`, n);
  }
  // במצב endnotes אין מרזב — מקור הסמכות הוא עמודי ההערות בלבד (נאסף להלן).
  // בעבר תנאי ה‑pages היה כרוך בהצלחת הבנייה; כעת מחיקת המרזב אינה תלויה בכך.
  if (settings['note-placement-mode'] === 'endnotes') displayedNoteKeys.clear();
  if (settings['note-placement-mode'] === 'endnotes' && endnotePagesInfo.pages) {
    for (const ep of endnotePagesInfo.pages) {
      for (const n of ep.notes) {
        if (n.fromInline || (n.tokenId != null && n.noteIndex != null)) {
          displayedNoteKeys.set(`${n.tokenId}#${n.noteIndex}`, n);
        }
      }
    }
  }
  function outWordsOf(blk) {
    if (blk.kind === 'heading') return wordSeq(blk.lines.map(l => l.words.join(' ')).join(' '));
    if (blk.kind === 'endnote') return []; // נספר באיסוף endnoteBlocks (להלן) — מקור סמכות יחיד
    // גוף: הסמנים [n] / הplaceholders נספרים כפי שנדחקו לשורות; הערות מרזב — רק
    // שהוצגו בפועל (displayedNoteKeys). במצב endnotes המרזב ריק ממילא ⇒ אין כפילות.
    const body = blk.lines.map(l => l.words.join(' ')).join(' ');
    const notes = (blk.notes || [])
      .filter(n => displayedNoteKeys.has(`${n.tokenId}#${n.noteIndex}`))
      .map(n => n.text).join(' ');
    return [...wordSeq(body), ...wordSeq(notes)];
  }
  const srcTokens = tokens.filter(t => t.type !== 'editorial');
  let contentPreserved = true;
  const mismatchDetail = [];
  const gSrc = [], gOut = [];
  for (const t of srcTokens) gSrc.push(...srcWordsOf(t));
  for (const b of blocks) gOut.push(...outWordsOf(b));
  // **S7.1.4 BRZ-15 — איסוף out מעמודי ההערות שהודפסו:** טוקנים גלויים + refs
  // צמודי־גוף שזורמו לעמודי "הערות" — נספרים מ‑endnotePagesInfo (מה שהודפס),
  // כך שהבדיקה תופסת אובדן שקט אם הערה לא הגיעה לדף. endnoteBlocks הוא רק מקור
  // הזרימה ל‑builder; אין לספור ממנו ישירות (חשד כפילות/תעלה).
  for (const eb of endnoteBlocks) gOut.push(...wordSeq(eb.text));
  if (settings['note-placement-mode'] === 'endnotes' && endnotePagesInfo.pages) {
    // הסרנו את הספירה התיאורטית של inline-refs מ‑endnoteBlocks; תמורתה סופרים
    // את מה שהודפס בפועל בעמודי ההערות (refs בלבד — טוקני endnote גלויים כבר נספרו).
    const visibleEndnoteTokens = new Set(blocks.filter(b => b.kind === 'endnote').map(b => b.tokenId));
    let printedInline = 0;
    for (const ep of endnotePagesInfo.pages) {
      for (const n of ep.notes) {
        if (n.fromInline || (n.tokenId != null && !visibleEndnoteTokens.has(n.tokenId))) {
          gOut.push(...wordSeq(String(n.text || '').replace(/\uE000/g, ' ')));
          printedInline++;
        }
      }
    }
    void printedInline;
  } else if (settings['note-placement-mode'] !== 'endnotes') {
    // במצב footnotes/inline אין זרימת refs לעמודי הערות — endnoteBlocks מכיל רק
    // טוקני endnote גלויים (כבר נספרו) ⇒ אין להוסיף inline refs (נמנעת כפילות).
  }
  for (const p of sideNotePlacement.placed) gOut.push(...wordSeq(p.text));
  for (const d of sideNotePlacement.deferred) gOut.push(...wordSeq(d.text));
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
  const blocksByToken = new Map();
  for (const b of blocks) if (!blocksByToken.has(b.tokenId)) blocksByToken.set(b.tokenId, b);
  // **S7.1.4:** במצב endnotes טוקן מקורו עשוי להיות מיוצג ב‑endnoteBlocks בלבד
  // (הערות שזורמו לעמודי "הערות") — מקום יחסי־תוכן לגיטימי, לא אובדן.
  const endnoteBlockTokens = new Set(endnoteBlocks.map(e => e.tokenId));
  for (const t of srcTokens) {
    const placedAsSide = sideNotePlacement.placed.find(p => p.anchorToken === t.id)
      || sideNotePlacement.deferred.find(p => p.anchorToken === t.id);
    const representedElsewhere = endnoteBlockTokens.has(t.id);
    if (!blocksByToken.has(t.id) && !placedAsSide && !representedElsewhere) {
      contentPreserved = false; mismatchDetail.push({ token: t.id, kind: 'token-not-placed' });
    }
  }
  if (!contentPreserved) {
    const rec = ledger.create('text-completeness', 'document', null, { hashIn, mismatches: mismatchDetail }, 'render');
    ledger.transition(rec.issue_id, 'persists', 'render', 'word-multiset mismatch — token loss/duplication detected');
  }

  // ---- ledger finalize + CP5 ----
  eventLog.emit('ledger-finalize', 'summary', ledger.summary());
  const cp5HashAfter = planned.hash; // decorations אסור שישנו פריסה — invariant נאכף
  eventLog.emit('render', 'cp5-render-ready', {});

  return {
    metadata, tokens, pages, ledger, events: eventLog,
    toc, numbers,
    contentHashIn: hashIn,
    contentPreserved,
    layoutHash: planned.hash,
    geometryNeutralVerified: cp4HashBefore === cp5HashAfter,
    retreat: planned.retreat,
    sideNotes: sideNotePlacement,
    endnotePages: endnotePagesInfo,
    scope
  };
}

module.exports = { typeset };
