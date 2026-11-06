// src/engine/output/export-api.js — Export orchestrator: HTML standalone / PDF / ZIP bundle (S12.1, REQ-EXP-01..04)
'use strict';

/**
 * מנהה הייצוא — נקודת הכניסה האחידה של שלושת הנתיבים:
 *  - exportHtml(result, settings, doc): HTML עצמאי חד־קובץ (dir=rtl, @page, offline);
 *  - exportPdf(text, settings, fontBytes): PDF עם טקסט אמיתי + סימניות + קישורי TOC
 *    + סימני חיתוך. **מסלול מדידה עקבי:** העימוד לייצוא רץ עם measure-impl=font-metrics
 *    והגופן המוטמע — שבירות השורות והרוחבים בפועל מאותו גופ�ן (מקור גיאומטריה יחיד);
 *  - exportProjectZip / importProjectZip: חבילת פרויקט ZIP מובנית (JSON — לא תבניות מחרוזות).
 *
 * דטרמיניזם בכל הנתיבים: אין Date.now; סדר קבוע; ייצוא כפול ⇒ בתים זהים.
 */

// **D-65 הפרדת חבילות:** המודולים להלן בטוחים־דפדפן (אין fs/pipeline) ונאגדים
// גם בחבילת ה־UI. הנתיבים הכבדים (PDF/ZIP מלאים — pipeline+גופן+בינארי) נטענים
// בעצלתות עם סמן node-only באותה שורת הקריאה — הבאנדלר מדלג; הקריאות מוגנות ב־typeof Buffer.
// (03.11: הסמן הוסר מהערה זו — תגובה שהכילה אותו מילולית הטעתה את הבאנדלר לדלג
// גם על require רגיל ⇒ קריסת ייצוא בדפדפן. הזיהוי כעת קפדני: אותה שורה בלבד.)
const getDefaultSettings = require('../core/settings-registry').getDefaultSettings;
const { renderPage } = require('./dom-renderer');
const { buildStandaloneHtml } = require('./html-export');
const { PAGE_SIZES, MM_TO_PX } = require('../layout/page-templates');
const { utf8Decode } = require('../import/zip-reader'); // פענוח UTF-8 סביבת-אגנוסטי (רשומות zip = Uint8Array)

/** טעינה עצלה של נתיבי Node (מוגנת) — מחזירה null בסביבה בלי Buffer. */
function nodeOnly(loader) {
  if (typeof Buffer === 'undefined') return null; // דפדפן — הקריאה מלאכותית נמנעת מראש
  return loader();
}

/** **03.11(ג) תיקון קריסת ייצוא HTML בדפדפן:** ב-DOM האמיתי outerHTML מאפיין
 * (מחרוזת), ב-shim הבדיקות — פונקציה. הפונקציה הזו מטפלת בשניהם + נפילה
 * לסריאליזציה ידנית בסיסית (אף סביבה לא נותרת בלי פלט). */
function elementOuterHtml(el) {
  if (!el) return '';
  if (typeof el.outerHTML === 'function') return el.outerHTML(); // shim הבדיקות
  if (typeof el.outerHTML === 'string') return el.outerHTML;      // DOM אמיתי
  if (typeof el.innerHTML === 'string' && el.tagName) {
    return `<${el.tagName}>${el.innerHTML}</${el.tagName}>`;       // מוצא אחרון
  }
  return '';
}

// ============ HTML עצמאי (REQ-EXP-02) ============

/**
 * ייצוא HTML עצמאי חד־קובץ. העמודים מרונדרים דרך dom-renderer (אותו מקור
 * כמו התצוגה החיה) אל doc שסופק (document אמיתי בדפדפן / shim בבדיקות).
 * @param {object} result — תוצאת typeset
 * @param {object} settings — הגדרות ממוזגות
 * @param {{createElement:Function}} doc — מפעל DOM
 * @param {object} [meta] — {title}
 */
function exportHtml(result, settings, doc, meta = {}) {
  // **זהות בתים עם הרינדור החי:** כל עמוד מוקרן דרך dom-renderer בדיוק כמו
  // התצוגה — בלי מאפיינים נוספים (השוואת parity נעולה בבדיקות מילה־במילה).
  // **03.11(ד):** בעבר הועבר result.metadata כארגומנט ה-header — טעות סוג:
  // ההעברה הזו לא הציגה כותרת עליונה בייצוא (מטא־נתונים אינם header). מעתה
  // renderPage נופל לברירת המחדל page.header שהצינור מצמיד לכל עמוד.
  const pagesHtml = [];
  for (const pg of result.pages) {
    pagesHtml.push(elementOuterHtml(renderPage(pg, settings, doc)));
  }
  const sizeMm = pageMmOf(settings);
  const pageRules = settings['export-html-page-rules'] !== false
    ? `@page { size: ${round2mm(sizeMm.w)}mm ${round2mm(sizeMm.h)}mm; margin: 0 }\n`
      + `.page{width:${Math.round(sizeMm.w * MM_TO_PX)}px;height:${Math.round(sizeMm.h * MM_TO_PX)}px}\n`
    : '';
  const html = buildStandaloneHtml(pagesHtml, settings, {
    title: meta.title || (result.metadata && (result.metadata['ספר'] || result.metadata.title)) || 'ספר',
    pageRules,
    // **03.11:** הטמעת הגופנים בקובץ העצמאי (@font-face data-URI) — מסופק ע"י ה־UI
    // מהספרייה (imud-library); ללא הגדרה — כמו קודם (fallback מערכת).
    fontCss: meta.fontCss || ''
  });
  return html;
}

// ============ PDF (REQ-EXP-03) ============

/**
 * ייצוא PDF מלא: עימוד במדידת הגופן המוטמע → הקרנה → כתיבה.
 * @param {string} text — מסמך המקור
 * @param {object} settingsIn — הגדרות המשתמש
 * @param {Buffer} fontBytes — קובץ TTF להטמעה (למשל DejaVu)
 * @param {string} [fontName] — שם פרופיל (ברירת מחדל: body-font של ההגדרות)
 * @param {object} [env] — סביבת המנוע (S4.15: windowFontBytes/marginFontBytes — גופני
 *   מילת-החלון/הערות-הצד של המקור; בלעדיהם המדידה נופלת לגופן הגוף)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, result?:object, projected?:object, info?:object}}
 */
function exportPdf(text, settingsIn, fontBytes, fontName, env) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' }; // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { typeset } = require('../core/pipeline');
  /* node-only */ const { registerFont, unregisterFont, restoreFontRegistration, registeredFonts: registeredFontsRef } = require('../typography/measure-api');
  /* node-only */ const { parseFont, glyphIdOf } = require('../typography/font-metrics');
  /* node-only */ const { buildSubset, charInventory } = require('../typography/font-subset');
  /* node-only */ const { projectDocument } = require('./geometry-projector');
  /* node-only */ const { writePdf } = require('./pdf-writer');
  const profileName = fontName || settingsIn['body-font'] || 'ToraExport';
  // **S6.0 (R2-C1 — דליפת רישום גופן):** profileName עלול להיות שם הגופן
  // של התצוגה החיה (body-font, למשל 'Frank Ruhl Libre' שנרשם ע"י ה-UI).
  // בעבר: הייצוא דרס את הרישום וב-finally מחק אותו ⇒ אחרי ייצוא PDF אחד
  // המדידה החיה נפלה בשקט ל'table' (סטיית עימוד 2–17% לפי EXT-13).
  // כעת: שחזור הרישום הקודם בסוף הייצוא; ובכשל רישום — לא נמחק רישום
  // קיים תקין (בעבר נמחק גם כשה-parse נכשל).
  const hadPrevFont = registeredFontsRef.has(profileName);
  const prevFont = hadPrevFont ? registeredFontsRef.get(profileName) : null;
  const reg = registerFont(profileName, fontBytes);
  if (!reg.ok) { if (!hadPrevFont) unregisterFont(profileName); return { ok: false, error: `font:${reg.error}` }; }
  try {
    const font = reg.profile;
    // **סדר הפעולות (תיקון שורש):** עימוד → הקרנה → מלאי מ**כל הטקסט שמצויר
    // בפועל** (גוף+פסים+TOC+מרזב+גיליון+כותרות) → מצמום → כתיבה.
    // בעבר נבנה המלאי מטקסט המקור בלבד — וגרשיים נגזרים (גיליון כ״ב, תוויות
    // TOC) הושמטו בשקט מהגופן ⇒ אובדן תוכן בייצוא.
    const settings = {
      ...getDefaultSettings(), ...settingsIn,
      'body-font': profileName,
      'measure-impl': 'font-metrics'
    };
    const result = typeset(text, settings, { noRecommendations: true, ...(env || {}) });
    // **S4.9:** פרופיל IMUD — הקרנה ממקרן ה-legacy (גיאומטריה מפורשת מהייחוס)
    const projected = result.legacyProfile
      ? require('./legacy-projector').projectLegacyDocument(result, settings)
      : projectDocument(result, settings);
    const drawnParts = [];
    for (const pg of projected.pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawnParts.push(w.text);
      for (const fn of pg.footnotes) drawnParts.push(fn.marker || '', fn.text || '');
      if (pg.folio && pg.folio.text) drawnParts.push(pg.folio.text);
      if (pg.header) for (const s of pg.header.slots) drawnParts.push(s.text);
    }
    const inventory = charInventory(drawnParts.join(' '));
    // **S5.2 (O1 — קריסת ייצוא על תו זר):** מלאי ה-F1 כלל גם תווים שחסרים
    // בגוף הטקסט (כל אות לטינית — "PDF", ® וכו') ו-buildSubset נכשל
    // (subset:tofu) לפני שרשת ה-fallback הפר-תו הספיקה לפעול: הדפדפן
    // הציג את המילה דרך המחסנית וה-PDF סירב להיווצר — תצוגה≠ייצוא בכלל
    // גרוע. כעת: מלאי ה-F1 = תווים שקיימים בו בפועל; השאר נופלים ל-/F4
    // (הסריקה שלמטה אוספת אותם למלאי ה-F4) או מושמטים אם אינם בשום גופן.
    const f1Inventory = inventory.filter(ch => glyphIdOf(font, ch) !== 0);
    const subset = buildSubset(font, f1Inventory);
    if (!subset.ok) return { ok: false, error: `subset:${subset.error}` };

    // סימניות: H1 → רמה 1; H2 → רמה 2 (עץ מכותרות המודל)
    const outline = [];
    const firstPageByToken = new Map();
    result.pages.forEach((pg) => {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.columns.flat()]) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
      }
    });
    for (const b of result.tokens) {
      if (b.type !== 'heading' || (b.level !== 1 && b.level !== 2)) continue;
      const pg = firstPageByToken.get(b.id);
      if (pg == null) continue;
      outline.push({ title: b.text, page: pg, level: b.level });
    }

    // קישורי TOC: שורות tocPages עם targetPage נפתר (S9). מיקום השורות — פריסת
    // הרנדרר (toc-rows: top 70, שורה ~24px) — מלבן לחיץ לכל שורה/פריט קבוצה.
    const tocLinks = [];
    for (const tp of result.tocPages || []) {
      let yi = 0;
      for (const row of (tp.toc && tp.toc.rows) || []) {
        if (row.kind === 'group') {
          let xi = 0;
          for (const it of row.items || []) {
            if (it.targetPage != null) tocLinks.push({ page: tp.index, x: 18 + xi, y: 70 + yi * 24, w: 60, h: 22, targetPage: it.targetPage });
            xi += 80;
          }
        } else if (row.targetPage != null) {
          tocLinks.push({ page: tp.index, x: 18, y: 70 + yi * 24, w: 700, h: 22, targetPage: row.targetPage });
        }
        yi++;
      }
    }

    const pageSizeMm = pageMmOf(settings);
    const fontForWriter = {
      subsetBytes: subset.bytes,
      widthsUnits: subset.widthsUnits,
      unitsPerEm: subset.unitsPerEm,
      cidOf: (ch) => {
        const gNew = glyphIdOf(parseSubsetCache(subset), ch); // gid בתת־הגופן
        return gNew;
      },
      charToGidEntries: () => [...subsetNewCmap(subset).entries()]
    };
    // **S4.15 (גופן משני — מילות-חלון FrankReal-Bold):** המקרן מסמן את
    // מילות-החלון (fontKey='window'); כאן נבנה תת-גופן שלהן ונעביר לכותב
    // ה-PDF (/F2) — ציור בגופן המקור + רוחב אמיתי (מונע חריגה מהשקע).
    // הגופן נרשם ע"י typeset מ-env.windowFontBytes באותו תהליך.
    let fontForWriter2 = null;
    {
      const winProfile = registeredFontsRef.get('FrankReal-Bold') || registeredFontsRef.get('FrankReal');
      if (winProfile) {
        const winParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'window') winParts.push(w.text);
          }
        }
        if (winParts.length) {
          const winSubset = buildSubset(winProfile, charInventory(winParts.join(' ')));
          if (winSubset.ok) {
            const winC2g = subsetNewCmap(winSubset);
            fontForWriter2 = {
              subsetBytes: winSubset.bytes,
              widthsUnits: winSubset.widthsUnits,
              unitsPerEm: winSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = winC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(winSubset), ch);
              },
              charToGidEntries: () => [...winC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן שלישי — DavidLibre-Bold, כותרות/TOC):** המקרן מסמן מילות
    // כותרת (fontKey='heading'); כאן נבנה תת-גופן ונעביר לכותב ה-PDF (/F3) —
    // כמו הייחוס (DavidLibre-Bold בכל הכותרות ושורות ה-TOC).
    let fontForWriter3 = null;
    {
      const headProfile = registeredFontsRef.get('DavidLibre-Bold');
      if (headProfile) {
        const headParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'heading') headParts.push(w.text);
          }
        }
        if (headParts.length) {
          const headSubset = buildSubset(headProfile, charInventory(headParts.join(' ')));
          if (headSubset.ok) {
            const headC2g = subsetNewCmap(headSubset);
            fontForWriter3 = {
              subsetBytes: headSubset.bytes,
              widthsUnits: headSubset.widthsUnits,
              unitsPerEm: headSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = headC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(headSubset), ch);
              },
              charToGidEntries: () => [...headC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן רביעי — Frank Ruhl Libre, fallback לפיסוק):** תווים שחסרים
    // בגוף הראשי (פיסוק בסיסי בגופנים תורניים — למשל ' . בגוטמן רש"י) מצוירים
    // ב-/F4 — בדיוק כפי שהדפדפן נופל ל-'Frank Ruhl Libre' שבמחסנית, וכפי
    // שהמדידה מודדת אותם (setMissingGlyphFallbackFont). בלי זה הפיסוק היה
    // נעלם מהייצוא.
    let fontForWriter4 = null;
    {
      const frlProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (frlProfile && fontForWriter) {
        const missingChars = new Set();
        for (const pg of projected.pages) {
          const scan = (lines) => {
            for (const ln of lines) {
              for (const w of (ln.words || [])) {
                for (const ch of String(w.text || '')) {
                  if (fontForWriter.cidOf(ch) === 0 && glyphIdOf(frlProfile, ch) !== 0) missingChars.add(ch);
                }
              }
            }
          };
          scan(pg.spanning ? pg.spanning.lines : []);
          scan(pg.lines || []);
          for (const fn of (pg.footnotes || [])) scan([{ words: fn.words || [] }]);
          // **S5.1 (תיקון C3):** הגיליון וסלוטי הכותרת העליונה לא נסרקו —
          // תו שחסר בגוף ומופיע רק שם היה נעלם מה-PDF (ה-DOM הציג אותו).
          if (pg.folio && pg.folio.text) scan([{ words: [{ text: pg.folio.text }] }]);
          if (pg.header) for (const s of (pg.header.slots || [])) if (s && s.text) scan([{ words: [{ text: s.text }] }]);
        }
        if (missingChars.size) {
          const punctSubset = buildSubset(frlProfile, charInventory([...missingChars].join('')));
          if (punctSubset.ok) {
            const punctC2g = subsetNewCmap(punctSubset);
            fontForWriter4 = {
              subsetBytes: punctSubset.bytes,
              widthsUnits: punctSubset.widthsUnits,
              unitsPerEm: punctSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = punctC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(punctSubset), ch);
              },
              charToGidEntries: () => [...punctC2g.entries()]
            };
          }
        }
      }
    }
    // **S5.1 (תצוגה=ייצוא בגופנים — תיקון L3):** הגופן החמישי (Frank Ruhl
    // Libre — גוף ההערה, fontKey 'fnbody') והשישי (Hadassah Friedlaender —
    // הערות-צד, fontKey 'margin'). עד כאן צוירו בגוף הטקסט (/F1) בזמן שה-DOM
    // מציג אותם ב-FRL/Hadassah — הייצוא ≠ התצוגה. מילים נאספות גם משורות
    // הגוף (margin-note) וגם מסמני/גוף ההערה (footnotes.words).
    let fontForWriter5 = null;
    {
      const fnProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (fnProfile) {
        const fnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'fnbody') fnParts.push(w.text);
          }
          for (const fn of (pg.footnotes || [])) for (const w of (fn.words || [])) if (w.fontKey === 'fnbody') fnParts.push(w.text);
        }
        if (fnParts.length) {
          const fnSubset = buildSubset(fnProfile, charInventory(fnParts.join(' ')));
          if (fnSubset.ok) {
            const fnC2g = subsetNewCmap(fnSubset);
            fontForWriter5 = {
              subsetBytes: fnSubset.bytes,
              widthsUnits: fnSubset.widthsUnits,
              unitsPerEm: fnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = fnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(fnSubset), ch);
              },
              charToGidEntries: () => [...fnC2g.entries()]
            };
          }
        }
      }
    }
    let fontForWriter6 = null;
    {
      const mnProfile = registeredFontsRef.get('Hadassah Friedlaender');
      if (mnProfile) {
        const mnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'margin') mnParts.push(w.text);
          }
        }
        if (mnParts.length) {
          const mnSubset = buildSubset(mnProfile, charInventory(mnParts.join(' ')));
          if (mnSubset.ok) {
            const mnC2g = subsetNewCmap(mnSubset);
            fontForWriter6 = {
              subsetBytes: mnSubset.bytes,
              widthsUnits: mnSubset.widthsUnits,
              unitsPerEm: mnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = mnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(mnSubset), ch);
              },
              charToGidEntries: () => [...mnC2g.entries()]
            };
          }
        }
      }
    }
    const bytes = writePdf({
      pages: projected.pages,
      pageSizeMm,
      font: fontForWriter,
      font2: fontForWriter2,
      font3: fontForWriter3,
      font4: fontForWriter4,
      font5: fontForWriter5,
      font6: fontForWriter6,
      settings,
      outline,
      tocLinks
    });
    return {
      ok: true, bytes, result, projected,
      info: {
        pages: result.pages.length,
        glyphs: subset.kept,
        fontBytes: subset.bytes.length,
        outline: outline.length,
        tocLinks: tocLinks.length,
        layoutHash: result.layoutHash,
        // **03.11 (חיזוק ביקורת):** נתוני היעדים בפועל — לבדיקת אמת שכל
        // סימנייה/קישור מצביע לעמוד הנכון (לא רק מספרם).
        outlineItems: outline,
        tocLinkTargets: tocLinks.map(l => l.targetPage),
        tocLinkPages: tocLinks.map(l => l.page)
      }
    };
  } finally {
    // **S6.0 (R2-C1):** שחזור הרישום שהיה קיים לפני הייצוא (או הסרה אם לא היה)
    restoreFontRegistration(profileName, prevFont);
  }
}

/** קריאת תת־הגופן (פעם אחת) למיפוי תו→gid חדש — ה־cidOf/charToGidEntries של הכותב. */
const _subsetCache = new WeakMap();
function parseSubsetCache(subset) {
  if (!_subsetCache.has(subset)) {
    /* node-only */ const { parseFont } = require('../typography/font-metrics');
    _subsetCache.set(subset, parseFont(subset.bytes).font);
  }
  return _subsetCache.get(subset);
}
function subsetNewCmap(subset) {
  const f = parseSubsetCache(subset);
  const out = new Map();
  for (const [cp, g] of f.charToGlyph) out.set(String.fromCodePoint(cp), g);
  return out;
}

// ============ חבילת פרויקט ZIP (REQ-EXP-04) ============

/**
 * ייצוא חבילת פרויקט: מסמך + הגדרות (עם settings_version) + הרחבות + תבנית ערכה.
 * כל החלקים JSON מובנה — אפס תבניות מחרוזות (שיעור regex-replacement).
 * @returns {Buffer} — ZIP
 */
function exportProjectZip(text, settings, extras = {}) {
  if (typeof Buffer === 'undefined') return Buffer.alloc(0); // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { buildZip } = require('./zip-writer');
  /* node-only */ const { exportProject } = require('./project-io');
  /* node-only */ const { exportExtensions } = require('../extensions/extensions-io');
  const settingsJson = exportProject(null, cleanSettings(settings), { timestamp: null });
  const extensionsJson = (extras.extensions != null)
    ? exportExtensions(extras.extensions)
    : exportExtensions({ styles: [], pages: [], images: [] });
  const themeJson = JSON.stringify(extras.theme || { 'theme-set-id': settings['theme-set-id'] || 'default' }, null, 2);
  const manifest = JSON.stringify({
    format: 'tora-typesetter-project-zip',
    format_version: 1,
    parts: ['document.txt', 'settings.json', 'extensions.json', 'theme.json'],
    settings_version: 2
  }, null, 2);
  return buildZip([
    { name: 'manifest.json', data: manifest },
    { name: 'document.txt', data: String(text || '') },
    { name: 'settings.json', data: settingsJson },
    { name: 'extensions.json', data: extensionsJson },
    { name: 'theme.json', data: themeJson }
  ]);
}

/**
 * ייבוא חבילת פרויקט.
 * @returns {{ok:boolean, error?:string, text?:string, settings?:object, extensions?:object, theme?:object, unknownKeys?:Array, issues?:Array}}
 */
function importProjectZip(bytes) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' };
  /* node-only */ const { readZip } = require('../import/zip-reader');
  /* node-only */ const { importProject } = require('./project-io');
  const zip = readZip(bytes);
  if (!zip.ok) return { ok: false, error: `zip:${zip.error}` };
  const entry = (name) => zip.entries.find(e => e.name === name);
  const manifestE = entry('manifest.json');
  const docE = entry('document.txt');
  const setE = entry('settings.json');
  if (!manifestE || !docE || !setE) return { ok: false, error: 'missing-parts' };
  let manifest;
  try { manifest = JSON.parse(utf8Decode(manifestE.data)); } catch (e) { return { ok: false, error: `manifest:${e.message}` }; }
  if (manifest.format !== 'tora-typesetter-project-zip') return { ok: false, error: 'unknown-format' };
  const proj = importProject(utf8Decode(setE.data));
  let extensions = null;
  const extE = entry('extensions.json');
  if (extE) {
    /* node-only */ const { importExtensions } = require('../extensions/extensions-io');
    const res = importExtensions(utf8Decode(extE.data));
    extensions = res; // כולל ok/errors — מדווח, לא שותק
  }
  let theme = null;
  const themeE = entry('theme.json');
  if (themeE) { try { theme = JSON.parse(utf8Decode(themeE.data)); } catch (e) { return { ok: false, error: `theme:${e.message}` }; } }
  return {
    ok: true,
    text: utf8Decode(docE.data),
    settings: proj.settings,
    extensions, theme,
    unknownKeys: proj.unknownKeys,
    issues: proj.issues
  };
}

// ============ עזרים ============

function pageMmOf(settings) {
  const px = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  return { w: px.w / MM_TO_PX, h: px.h / MM_TO_PX }; // px → מ״מ (אותו גורם)
}
function round2mm(v) { return Math.round(v * 100) / 100; }

/** הגדרות נקיות לייצוא: מפתחות פנימיים (מקווקוות) מוסרים — נכסי זמן־ריצה. */
function cleanSettings(settings) {
  const out = {};
  // **S5.2 (O16 — תלכיד ZIP מאבד הגדרות מורשת):** בעבר כל מפתח שמתחיל
  // ב '_' נזרק — כולל _imudRaw (שממנו נתיב המורשת קורא ~12 מפתחות
  // חיים: hdr-r/c/l-type, note-marker-size, note-num-separator ועוד),
  // _layout-profile (מפעיל את המנוע) ו-_legacy-ui-state. פרויקט שנשמר
  // ונטען איבד את ההגדרות והעימוד השתנה בשקט. כעת המפתחות החיים נשמרים.
  const KEEP = new Set(['_imudRaw', '_layout-profile', '_legacy-ui-state', '_customPages', '_customStyles']);
  for (const [k, v] of Object.entries(settings || {})) {
    if (k.startsWith('_') && !KEEP.has(k)) continue;
    out[k] = v;
  }
  return out;
}

module.exports = {
  exportHtml, exportPdf, exportProjectZip, importProjectZip, pageMmOf
};
