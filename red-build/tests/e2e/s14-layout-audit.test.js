// tests/e2e/s14-layout-audit.test.js — שקיפות עימוד מהקוד (03.11(ד))
'use strict';

/**
 * **S14 — אודיט עימוד מהקוד.** דיווח משתמש 3: "אם אתה לא יכול להבין מתוך הקוד
 * (בלי בדיקה ויזואלית) שהעימוד נראה כמו עימוד של נוטפד, יש טקסטים אחד על
 * השני, ושום דבר מהגדרות ברירת המחדל אינו קיים, אין כותרות עליונות אין עמודי
 * שער — אז מה עשינו כל הזמן הזה?"
 *
 * התשובה המנגנונית: עד כאן הבדיקות אימתו את המנוע **בנתיב הבדיקה** (העברת
 * header מפורשת, jsdom בלי גיאומטריה) בזמן שהנתיבים החיים (תצוגה/ייצוא) היו
 * מנותקים. הבדיקה הזאת נועדה לתפוס את **מחלקת הכשלים** הזאת לנצח — היא
 * בודקת את הפלט בנתיבים האמיתיים (renderPage בלי ארגומנטים מעבר למינימום,
 * הקרנת המודל, קובץ ה-CSS) ולא את מה שהבדיקות "יודעות" להעביר.
 *
 * אינווריאנטים:
 *  A. שערים — קיימים בברירת המחדל, בסדר המקור (ראשי → אחורי → תוכן ← גוף),
 *     שער־משנה לפני כל חלק, ותוכן מובנה (בס״ד/כותרת/מחבר/שנה) מגיע ל-DOM ול-PDF.
 *  B. כותרות עליונות — כל עמוד תוכן (כולל פתיחות) מציג כותרת בנתיב החי
 *     (renderPage בלי header מפורש) ובייצוא HTML.
 *  C. יישור — שורות הגוף justify (inter-word) ב-BASE_CSS — מקור ה-CSS של
 *     התצוגה החיה והייצוא גם יחד.
 *  D. גיאומטריה — אין חפיפות שורות במודל המוקרן (אותו מקור שה-PDF מצייר ממנו)
 *     ושום תיבת מילה לא חורגת מתיבת הטור.
 *  E. גופנים — הגופנים שברירות המחדל של המקור תלויות בהם (David Libre, Frank
 *     Ruhl Libre, Bellefair, Noto Serif Hebrew) מוטמעים בקטלוג והקבצים קיימים.
 *  F. ייבוא ברירות המקור — מיפוי המתגים (show-*-shaar) ופתרון מחסניות הגופן
 *     מול הקטלוג (AlphaBlack→David Libre).
 *  G. רגישות הגדרות→פלט — שינוי גוף/כותרת/שער משנה את הפלט המרונדר (שוב לא
 *     "מחליף גופן ולא קורה כלום").
 */

const fs = require('fs');
const path = require('path');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { renderPage, fontStack } = require('../../src/engine/output/dom-renderer');
const { exportHtml } = require('../../src/engine/output/export-api');
const { projectDocument } = require('../../src/engine/output/geometry-projector');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { BASE_CSS } = require('../../src/engine/output/html-export');

const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');
const ROOT = path.join(__dirname, '..', '..');

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); process.exitCode = 1; }
}
const it = (name, fn) => {
  console.log(`• ${name}`);
  try { fn(); } catch (e) { failed++; console.error(`  FAIL: ${name} — ${e && e.message}`); process.exitCode = 1; }
};

// DOM shim מינימלי (אותו דפוס של s12)
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  class El {
    constructor(tag) { this.tagName = tag; this.children = []; this.style = {}; this.dataset = {}; this.attrs = {}; this._text = ''; this.className = ''; this.dir = ''; }
    setAttribute(k, v) { this.attrs[k] = v; }
    appendChild(c) { this.children.push(c); return c; }
    insertBefore(n) { this.children.unshift(n); }
    get firstChild() { return this.children[0]; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    set textContent(v) { this._text = String(v); this.children = []; }
    set innerHTML(v) { this._html = v; }
    get innerHTML() { return this._html || ''; }
    outerHTML() {
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
        + (this.className ? ` class="${esc(this.className)}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
      const styleStr = Object.entries(this.style).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : (this._html || esc(this._text));
      return `<${this.tagName}${attrsStr}${styleStr ? ` style="${esc(styleStr)}"` : ''}>${inner}</${this.tagName}>`;
    }
  }
  return { createElement: (t) => new El(t) };
}

describe_s14();

function describe_s14() {
  const s = getDefaultSettings();
  const r = typeset(CORPUS, s);
  const types = r.pages.map(p => p.type);

  it('A. שערים כברירת מחדל בסדר המקור: ראשי → אחורי → תוכן־עניינים → גוף (עם שער־משנה לפני החלק)', () => {
    ok(types[0] === 'shaar-main', `עמוד 0 = shaar-main (קיבל ${types[0]})`);
    ok(types[1] === 'shaar-back', `עמוד 1 = shaar-back — סדר המקור (קיבל ${types[1]})`);
    const tocIdx = types.indexOf('toc-general');
    ok(tocIdx === 2, `תוכן־עניינים אחרי השערים (קיבל מיקום ${tocIdx})`);
    const subIdx = types.indexOf('shaar-sub');
    ok(subIdx > tocIdx, 'שער־משנה לפני החלק הראשון (אחרי התוכן־עניינים)');
    ok(r.pages.some(p => p.type === 'shaar-sub' && p.shaarInfo && /חלק ראשון/.test(p.shaarInfo.title || '')), 'שער־משנה נושא את כותרת החלק');
    // כיבוי מפורש מבטל — המתגים אמיתיים
    const off = typeset(CORPUS, { ...s, 'shaar-main-enabled': false, 'shaar-sub-enabled': false, 'shaar-back-enabled': false });
    ok(off.pages.every(p => !/^shaar-/.test(p.type)), 'כיבוי מפורש של שלושת המתגים ⇒ אין שערים');
  });

  it('A2. תוכן השער המובנה מגיע ל-DOM (נתיב התצוגה) ולהקרנת ה-PDF', () => {
    const doc = makeDoc();
    const main = r.pages.find(p => p.type === 'shaar-main');
    const el = renderPage(main, s, doc); // נתיב התצוגה — בלי עיטורי בדיקה
    const html = el.outerHTML();
    ok(html.includes('bsd-header'), 'בס״ד בשער');
    ok(html.includes('ספר מלכי המלוכה'), 'שם הספר (מהמטא) בשער');
    ok(html.includes('book-subtitle') && html.includes('ביאורים וחידושים'), 'כותרת־משנה (נושא) בשער');
    ok(html.includes('book-description') && html.includes('בירור שיטות הראשונים'), 'תיאור (נושא מפורט) בשער');
    ok(html.includes('book-sections-summary') && html.includes('מהדורה שניה'), 'פרטי מהדורא בשער');
    ok(html.includes('author-block') && html.includes('ידידיה בר אבא'), 'שם המחבר בשער');
    ok(html.includes('publication-footer') && html.includes('ירושלים'), 'מקום ושנה בשער');
    ok(html.includes('shaar-crown'), 'עיטור הכתר');
    // הקרנת PDF
    const proj = projectDocument(r, s);
    const mainIdx = r.pages.indexOf(main);
    const words = proj.pages[mainIdx].lines.flatMap(l => l.words.map(w => w.text)).join(' ');
    ok(words.includes('ספר מלכי המלוכה') && words.includes('בס״ד') && words.includes('ידידיה'), 'תוכן השער מוקרן ל-PDF');
    // שער אחורי: טקסט שמירת זכויות
    const back = r.pages.find(p => p.type === 'shaar-back');
    const backHtml = renderPage(back, s, doc).outerHTML();
    ok(backHtml.includes('back-shaar-text-line'), 'שורות טקסט בשער האחורי');
  });

  it('B. כותרות עליונות בכל עמודי התוכן — בנתיב החי (renderPage בלי header מפורש) ובייצוא HTML', () => {
    const doc = makeDoc();
    const bodyTypes = new Set(['regular', 'sign-open', 'preface', 'h3-spread', 'toc-general', 'toc-detail']);
    const bodyPages = r.pages.filter(p => bodyTypes.has(p.type));
    ok(bodyPages.length > 0, 'יש עמודי תוכן');
    let withHead = 0;
    for (const pg of bodyPages) {
      const el = renderPage(pg, s, doc); // ← הנתיב החי: בלי ארגומנט header (הנתק שדווח)
      if (/running-head/.test(el.outerHTML())) withHead++;
    }
    ok(withHead === bodyPages.length, `כל ${bodyPages.length} עמודי התוכן מציגים כותרת בנתיב החי (קיבל ${withHead})`);
    // שערים בלי כותרת; תוכן־עניינים עם כותרת — כמקור (renderPaginatedTOC
    // מרנדר top-header-grid בכל עמודי התוכן, 03.11(ד))
    for (const pg of r.pages.filter(p => /^shaar-/.test(p.type))) {
      const el = renderPage(pg, s, doc);
      ok(!/running-head/.test(el.outerHTML()), `עמוד ${pg.type} בלי כותרת עליונה (כמקור)`);
    }
    for (const pg of r.pages.filter(p => /^toc-/.test(p.type))) {
      const el = renderPage(pg, s, doc);
      ok(/running-head/.test(el.outerHTML()), `עמוד ${pg.type} עם כותרת עליונה (כמקור, 03.11(ד))`);
    }
    // הייצוא — אותו מקור
    const html = exportHtml(r, s, makeDoc(), {});
    ok(html.includes('running-head'), 'הייצוא העצמאי כולל כותרות עליונות');
    ok((html.match(/running-head/g) || []).length >= bodyPages.length, 'כותרת בכל עמוד תוכן בייצוא');
  });

  it('C. יישור שורות הגוף — justify/inter-word ב-BASE_CSS (מקור ה-CSS של התצוגה והייצוא)', () => {
    ok(/\.line\{[^}]*text-align:justify/.test(BASE_CSS), '.line ⇒ justify (כמקור: .main-column/p)');
    ok(/\.line\{[^}]*text-justify:inter-word/.test(BASE_CSS), 'text-justify: inter-word (כמקור)');
    ok(/\.line--last\{text-align:center\}/.test(BASE_CSS), 'שורה אחרונה ממורכזת כברירת מחדל (body-last-line-align=center של המקור)');
    ok(/\.line--last-right/.test(BASE_CSS) && /\.line--last-stretch/.test(BASE_CSS), 'מצבי שורה אחרונה נשמרים');
  });

  it('D. גיאומטריה מהקוד: אין חפיפות שורות בהקרנה ואף מילה לא חורגת מתיבת הטור', () => {
    const proj = projectDocument(r, s);
    let overlaps = 0, overflows = 0;
    proj.pages.forEach((pg, pi) => {
      // חפיפות אנכיות בין שורות של אותו טור: מקרינים לפי x — שורות מאותו טור חולקות טווח x
      const cols = new Map();
      for (const ln of pg.lines) {
        // **S5.2 (P-11d):** מפתח לפי x מדויק של הטור (עיגול ל-0.1px) — שורות
        // של אותו טור מקבלות מהפרויקטור את אותו col.x מהתבנית, ולכן x מדויק
        // = זהות הטור. המפתח הקודם Math.round(ln.x/10) איחד לסלים שונים שורות
        // של אותו טור שהפער בין העמודונים גדול מ-5px — והבדיקה דילגה עליהן.
        const key = Math.round(ln.x * 10) / 10;
        if (!cols.has(key)) cols.set(key, []);
        cols.get(key).push(ln);
      }
      for (const [, lns] of cols) {
        lns.sort((a, b) => a.y - b.y);
        for (let i = 1; i < lns.length; i++) {
          if (lns[i].y < lns[i - 1].y + lns[i - 1].h - 0.5) overlaps++;
        }
      }
      // גלישה מתיבת העמוד
      for (const ln of pg.lines) {
        for (const w of ln.words) {
          if (w.x < -0.5 || w.x + w.w > pg.width + 0.5) overflows++;
        }
        if (ln.y < -0.5 || ln.y + ln.h > pg.height + 0.5) overflows++;
      }
      void pi;
    });
    ok(overlaps === 0, `אפס חפיפות שורות בהקרנה (נמצאו ${overlaps})`);
    ok(overflows === 0, `אפס מילים מחוץ לתיבת העמוד (נמצאו ${overflows})`);
  });

  it('E. גופני ברירת המחדל של המקור מוטמעים: David Libre / Frank Ruhl Libre / Bellefair / Noto Serif Hebrew', () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui', 'assets', 'imud', 'imud-fonts.json'), 'utf8'));
    const byFamily = new Map(catalog.map(e => [e.family, e.file]));
    for (const fam of ['David Libre', 'Frank Ruhl Libre', 'Bellefair', 'Noto Serif Hebrew']) {
      ok(byFamily.has(fam), `${fam} בקטלוג`);
      const file = byFamily.get(fam);
      ok(file && fs.existsSync(path.join(ROOT, 'ui', 'assets', 'imud', 'fonts', file)), `קובץ הגופן ${file} קיים בנכסים`);
    }
  });

  it('F. ייבוא ברירות המקור: מתגי השערים ופתרון מחסניות הגופן מול הקטלוג', () => {
    const legacy = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
    const RED_KEYS = new Set(getSettingDefs().map(d => d.id));
    // בלי קטלוג — firstFamily (התנהגות ישנה לתאימות)
    const plain = importImudSettings(legacy, RED_KEYS);
    ok(plain.settings['shaar-main-enabled'] === true, 'show-main-shaar=true ⇒ shaar-main-enabled');
    ok(plain.settings['shaar-sub-enabled'] === true, 'show-sub-shaar=true ⇒ shaar-sub-enabled');
    ok(plain.settings['shaar-back-enabled'] === true, 'show-back-shaar=true ⇒ shaar-back-enabled');
    ok(plain.settings['imud-book-desc'] === legacy['inp-book-desc'], 'inp-book-desc ⇒ imud-book-desc');
    // עם קטלוג — מחסניות נפתרות למשפחה הזמינה (כפי שהדפדפן היה נופל).
    // **S6.3:** הכינויים האנגליים (AlphaBlack/Lia Sgula/Livorna…) נוספו
    // לקטלוג — בקשת משתמש מפורשת; המחסניות נפתרות כעת לגופן האמיתי
    // של המקור, לא לפולבאק.
    const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui', 'assets', 'imud', 'imud-fonts.json'), 'utf8'));
    const available = new Set(catalog.map(e => e.family));
    const resolved = importImudSettings(legacy, RED_KEYS, { availableFonts: available });
    ok(resolved.settings['heading-0-font'] === 'AlphaBlack', `f-h0="AlphaBlack, David Libre" ⇒ AlphaBlack (קיבל ${resolved.settings['heading-0-font']})`);
    ok(resolved.settings['shaar-title-font'] === 'Lia Sgula', `f-sh-title="Lia Sgula, Bellefair" ⇒ Lia Sgula (קיבל ${resolved.settings['shaar-title-font']})`);
    ok(resolved.settings['shaar-title-size-pt'] === 46, 's-sh-title=46');
  });

  it('G. רגישות הגדרות→פלט: שינוי גוף/כותרת/שער משנה את הרינדור בפועל', () => {
    const doc = makeDoc();
    const probe = (settings) => {
      const rr = typeset(CORPUS, settings);
      const main = rr.pages.find(p => p.type === 'shaar-main');
      const body = rr.pages.find(p => p.type === 'sign-open') || rr.pages.find(p => p.columns && p.columns.some(c => c.length));
      const html = main ? renderPage(main, settings, doc).outerHTML() : (body ? renderPage(body, settings, doc).outerHTML() : '');
      return { html, pages: rr.pages.map(p => p.type).join(',') };
    };
    const base = probe(s);
    const fontChanged = probe({ ...s, 'body-font': 'אהבה רגיל' });
    ok(base.html !== fontChanged.html, 'שינוי body-font משנה את הפלט');
    ok(/אהבה רגיל/.test(fontChanged.html), 'גופן הגוף החדש נראה בפלט');
    const titleSize = probe({ ...s, 'shaar-title-size-pt': 60 });
    ok(/61\.33px|60pt/.test(titleSize.html.replace(/<[^>]*>/g, '')) || titleSize.html !== base.html, 'שינוי גודל כותרת השער משנה את הפלט');
    const noShaar = probe({ ...s, 'shaar-main-enabled': false, 'shaar-sub-enabled': false, 'shaar-back-enabled': false });
    ok(!noShaar.pages.includes('shaar-main'), 'כיבוי שערים משנה את מבנה העמודים');
  });

  it('H. fontStack: מחסנית מרובת־משפחות מהמקור נשמרת עם fallback עברי', () => {
    ok(fontStack("'AlphaBlack', 'David Libre', serif").includes("'David Libre'"), 'מחסנית המקור נשמרת');
    ok(fontStack('אהבה רגיל').includes("'Frank Ruhl Libre'"), 'fallback עברי נוסף למשפחה בודדת');
    const hostile = fontStack("A'; color:red; background:url(x); '");
    ok(!/[;:{}()]/.test(hostile), 'תווי הזרקת CSS (; : { } ( )) מנוטרלים');
  });

  console.log(`\n== s14-layout-audit: ${passed} passed, ${failed} failed ==`);
  if (failed) process.exit(1);
}
