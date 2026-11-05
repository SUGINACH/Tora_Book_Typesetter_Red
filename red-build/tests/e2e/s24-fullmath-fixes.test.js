// tests/e2e/s24-fullmath-fixes.test.js — S4.24: תיקוני האודיט המתמטי המלא
'use strict';
/**
 * מקור: האודיט המתמטי המלא על הקובץ הגדול מאוד (696 עמודים) מצא 200
 * בעיות ב-6 משפחות שורש; כולן תוקנו ב-S4.24. סוויטה זו מקבעת כל משפחה:
 *
 *  1. FN_OVERLAPS_BODY (46) — תקציב ההערות נשבר בהמשכי-פסקה + תקרת מרזב
 *     220px שלא יושמה + המשכים '(המשך)' בעמוד הבא. ⇒ בדיקות 8-11.
 *  2. INK_OUTSIDE_COLUMN בשורות-סוגריים (74 מתוך 78) — הרינדור בגודל
 *     השורה בעוד השבירה מודדת בגודל הסוגריים (×1.2). ⇒ בדיקות 5-7.
 *  3. כותרות inline ארוכות מהטור (3). ⇒ בדיקות 1-2.
 *  4. כותרות-רוחב ארוכות מהפס (4) + מרכוז פסים שבור (16) —
 *     text-align-last:justify דרס את ה-center. ⇒ בדיקות 3-4.
 *  5. רווח פנטום לפני מילת-RLM. ⇒ בדיקה 7.
 *  6. רווחי-סוגריים בגודל השורה במקום 10pt. ⇒ בדיקות 5-6.
 */
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { GEO, SZ, FLOW_BOTTOM, SINGLE_W, headingItemH } = require('../../src/engine/layout/legacy-imud-flow');

const RB = path.join(__dirname, '..', '..');
const IMUD_RAW = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));

function makeDoc() {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
    }
    set className(v) { this._class = v; }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); return c; }
    insertBefore(node, ref) {
      if (ref == null) { this.children.push(node); return node; }
      const i = this.children.indexOf(ref);
      if (i === -1) this.children.push(node); else this.children.splice(i, 0, node);
      return node;
    }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
  }
  return {
    createElement: (t) => new El(t),
    createTextNode: (v) => { const t = new El('#text'); t.textContent = String(v); return t; }
  };
}
function walk(el, fn) { fn(el); for (const c of el.children || []) walk(c, fn); }
function hasClass(el, cls) { return String(el.className || '').split(/\s+/).includes(cls); }
function legacySettings(overrides) {
  const reg = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(IMUD_RAW, reg, {});
  return { ...settings, ...(overrides || {}) };
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// ---------- 1. כותרות inline ארוכות מהטור — עטיפה ----------
describe('s24-fullmath-fixes', () => {

  it('h4 ארוך מרוחב הטור נעטף לשורות כותרת — כל שורה נכנסת בטור, פס 1.45×', () => {
    const LONG_H4 = 'ההפרדה וההגדרה של הרשויות בשבת ובמלאכות האסורות מהתורה ומדבריהם לאורך כל הפרק';
    const DOC = `כותרת 1 - חלק ראשון\nכותרת 4 - ${LONG_H4}\nפסקה ראשונה למילוי העמוד בתוכן שוטף. עוד מילים למילוי הטור בשורות תקינות לחלוטין וללא בעיות כלשהן בעימוד.\n`;
    const r = typeset(DOC, legacySettings(), { noRecommendations: true });
    assertEq(r.legacyProfile, true, 'legacy profile active');
    const heads = [];
    for (const pg of r.pages) for (const col of (pg.columns || [])) for (const ln of col) {
      if (ln.kind === 'heading' && ln.level === 4) heads.push(ln);
    }
    assert(heads.length >= 2, `long h4 must wrap to ≥2 heading lines (got ${heads.length})`);
    assertEq(heads.length * headingItemH(4), heads.reduce((a, l) => a + l.heightPx, 0), 'total height = N × headingItemH (1.45× pitch)');
    const api = new MeasureAPI(r.settings);
    for (const h of heads) {
      const w = api.measureTextWidth(h.words.join(' '), h.sizePt, 0);
      assert(w <= GEO.COL_W + 0.01, `each wrapped heading line must fit the column (${w.toFixed(1)} ≤ ${GEO.COL_W})`);
    }
    assertEq(norm(heads.map(h => h.words.join(' ')).join(' ')), norm(LONG_H4), 'wrapped lines reconstruct the heading text');
  });

  it('h5 ארוך — אותו טיפול (גודל 11.5pt)', () => {
    const LONG_H5 = 'משמעויות הקיימות רק ביחס למעשה שהוא כהמשך של כל הסיפור ההלכתי המלא והשלם';
    const DOC = `כותרת 1 - חלק\nכותרת 5 - ${LONG_H5}\nפסקה למילוי. עוד מילים למילוי הטור בשורות תקינות לחלוטין וללא בעיות כלשהן בעימוד הספר.\n`;
    const r = typeset(DOC, legacySettings(), { noRecommendations: true });
    const heads = [];
    for (const pg of r.pages) for (const col of (pg.columns || [])) for (const ln of col) {
      if (ln.kind === 'heading' && ln.level === 5) heads.push(ln);
    }
    assert(heads.length >= 2, `long h5 must wrap (got ${heads.length})`);
    assertEq(heads[0].sizePt, SZ.h5, 'h5 size preserved');
  });

  // ---------- 2. כותרות-רוחב (span/h2) ארוכות מהפס ----------

  it('h3-span ארוך מרוחב הפס — נעטף לפסים נפרדים, כל שורה ברוחב הפס', () => {
    const LONG_SPAN = 'וזו כותרת רוחבית ארוכה במיוחד שחייבת להישבר לשתי שורות ברוחב הפס של העמוד כולו כי היא ארוכה ממנו';
    const DOC = `כותרת 1 - חלק\nכותרת 3 - ${LONG_SPAN}\nפסקה ראשונה אחרי הכותרת הרוחבית עם עוד תוכן שוטף למילוי הבלוק בשתי הטורים כראוי ובסדר מלא.\n`;
    const r = typeset(DOC, legacySettings(), { noRecommendations: true });
    const spans = [];
    for (const pg of r.pages) for (const b of (pg.bands || [])) if (b.kind === 'h3-title') spans.push(b);
    assert(spans.length >= 2, `long h3 span must wrap to ≥2 bands (got ${spans.length})`);
    const api = new MeasureAPI(r.settings);
    for (const b of spans) {
      const w = api.measureTextWidth(b.text, b.sizePt, 0);
      assert(w <= SINGLE_W + 0.01, `each span line fits the band (${w.toFixed(1)} ≤ ${SINGLE_W})`);
    }
    assertEq(norm(spans.map(s => s.text).join(' ')), norm(LONG_SPAN), 'span bands reconstruct the title');
  });

  it('h2-title ארוך מרוחב הפס — נעטף; הראשונה במיקום המכויל', () => {
    const LONG_H2 = 'בענין הזכרת שבת וראש חודש בברכת המזון של סעודת מלאכת ערב שבת קודש ובפרט בפרטי דינים אלו';
    const DOC = `כותרת 1 - חלק ראשון\nכותרת 2 - ${LONG_H2}\nפסקה ראשונה של הסימן עם תוכן שוטף למילוי שני הטורים בעמוד פתיחת הסימן ובעמודים הבאים אחריו.\n`;
    const r = typeset(DOC, legacySettings(), { noRecommendations: true });
    const h2pg = r.pages.find(p => (p.bands || []).some(b => b.kind === 'h2-title'));
    assert(h2pg, 'h2 sign page exists');
    const titles = h2pg.bands.filter(b => b.kind === 'h2-title');
    assert(titles.length >= 2, `long h2 title must wrap to ≥2 bands (got ${titles.length})`);
    assertEq(titles[0].y, 344.05, 'first h2-title line keeps the calibrated position');
    const api = new MeasureAPI(r.settings);
    for (const b of titles) {
      const w = api.measureTextWidth(b.text, b.sizePt, 0);
      assert(w <= SINGLE_W + 0.01, `each h2 line fits the band (${w.toFixed(1)} ≤ ${SINGLE_W})`);
    }
  });

  // ---------- 3. מרכוז פסים — text-align-last לא דורס ----------

  it('BASE_CSS: הכלל מוציא קווי-פס מה-justify + כלל-על .band{text-align-last:auto}', () => {
    const src = fs.readFileSync(path.join(RB, 'src', 'engine', 'output', 'html-export.js'), 'utf8');
    assert(src.includes('.line:not(.line--last):not(.line--heading):not(.band){text-align-last:justify}'),
      'selector excludes .band');
    assert(src.includes('.band{text-align-last:auto}'), 'band override rule exists');
  });

  it('רינדור: קו פס מקבל text-align-last:auto (inline) — מרוכז גם כשהכלל הכללי מוזרק', () => {
    const DOC = `כותרת 1 - חלק ראשון\nכותרת 3 - כותרת רוחבית\nפסקה ראשונה למילוי העמוד בתוכן שוטף. עוד מילים למילוי הטור בשורות תקינות לחלוטין וללא שום בעיות בעימוד של הספר הזה.\n`;
    const settings = legacySettings();
    const r = typeset(DOC, settings, { noRecommendations: true });
    const pg = r.pages.find(p => (p.bands || []).length);
    assert(pg, 'page with bands exists');
    const doc = makeDoc();
    const el = renderPage(pg, settings, doc, pg.header || null);
    const bands = [];
    walk(el, (n) => { if (hasClass(n, 'band')) bands.push(n); });
    assert(bands.length >= 1, 'bands rendered');
    for (const b of bands) {
      assertEq(b.style.textAlignLast, 'auto', 'band line gets inline text-align-last:auto');
    }
  });

  // ---------- 4. דגלי קצה-סוגריים + רווח בגודל הסוגריים ----------

  it('המודל מייצא parenStarts/parenEnds מיושרים למילים — מקור יחיד לרווח 10pt', () => {
    const DOC = `כותרת 1 - חלק\nפסקת מבחן ראשונה עם ביטוי בסוגריים (וזו הערה ארוכה בסוגריים שצריכה להימדד בגודל המוקטן עם רווחים נכונים בין כל המילים שלה) ואז המשך הפסקה בגודל רגיל עוד ועוד מילים למילוי שורות הטור והעמוד כולו בתוכן שוטף.\n`;
    const r = typeset(DOC, legacySettings(), { noRecommendations: true });
    let sawPair = false;
    for (const pg of r.pages) for (const col of (pg.columns || [])) for (const ln of col) {
      if (ln.kind !== 'paragraph' || !Array.isArray(ln.parenFlags)) continue;
      assertEq(ln.parenFlags.length, ln.words.length, 'parenFlags aligned to words');
      if (Array.isArray(ln.parenStarts) && Array.isArray(ln.parenEnds)) {
        assertEq(ln.parenStarts.length, ln.words.length, 'parenStarts aligned');
        assertEq(ln.parenEnds.length, ln.words.length, 'parenEnds aligned');
        for (let i = 0; i + 1 < ln.words.length; i++) {
          if (ln.parenFlags[i] && ln.parenFlags[i + 1] && ln.parenEnds[i] && ln.parenStarts[i + 1]) sawPair = true;
        }
      }
    }
    assert(sawPair, 'must see an intra-paren word pair (space at paren size)');
  });

  it('רינדור: הרווח בין שתי מילים בתוך סוגריים ב-span של 10pt (13.33px)', () => {
    const DOC = `כותרת 1 - חלק\nפסקת מבחן ראשונה עם ביטוי בסוגריים (וזו הערה ארוכה בסוגריים שצריכה להימדד בגודל המוקטן עם רווחים נכונים בין כל המילים שלה ועוד קצת) ואז המשך הפסקה בגודל רגיל עוד ועוד מילים למילוי שורות הטור והעמוד כולו בתוכן שוטף לחלוטין כאן.\n`;
    const settings = legacySettings();
    const r = typeset(DOC, settings, { noRecommendations: true });
    let found = false;
    for (const pg of r.pages) {
      const doc = makeDoc();
      const el = renderPage(pg, settings, doc, pg.header || null);
      walk(el, (n) => { if (hasClass(n, 'w--paren-space')) found = true; });
      if (found) break;
    }
    assert(found, 'a paren-space span (10pt) must be rendered between intra-paren words');
  });

  it('מילה של RLM בלבד — מודבקת לשכנה בלי רווח פנטום בכל הרינדור', () => {
    const DOC = `כותרת 1 - חלק\nפסקה עם סיומת מיוחדת בסוף המשפט האחרון כאן. \u200f\nעוד פסקה קצרה למילוי. עוד תוכן שוטף לגמרי כאן בשביל הבדיקה הזאת בדיוק ולחלוטין.\n`;
    const settings = legacySettings();
    const r = typeset(DOC, settings, { noRecommendations: true });
    let sawRlmLine = false;
    for (const pg of r.pages) {
      const doc = makeDoc();
      const el = renderPage(pg, settings, doc, pg.header || null);
      walk(el, (n) => {
        const t = n.textContent || '';
        if (t.includes('\u200f')) sawRlmLine = true;
        assert(!/ \u200f/.test(t), `no phantom space before RLM (${JSON.stringify(t.slice(-8))})`);
        assert(n.tagName !== '#text' || n.textContent !== '\u200f', 'no standalone RLM text node');
      });
    }
    assert(sawRlmLine, 'the RLM must still be present (bidi preserved)');
  });

  // ---------- 5. הערות שוליים: קיבולת מלאה, פיצול, המשכים בלי סמן, אי-חפיפה, שימור ----------
  // **S4.26 (דיווח משתמש 05.11 — בעיות 3–5):** תקרת המרזב עוברת מ-220px קבוע
  // לקיבולת העמוד המלאה (הערה ארוכה ממלאת את העמוד לפני חיתוך), הזרימה
  // רציפה כברירת מחדל, והמשך-הערה מוצג בלי אות סימון.
  const NOTE_WORDS = Array.from({ length: 900 }, (_, i) => `מילת${i} הערה ארוכה מאוד לבדיקה`).join(' ');
  const FN_DOC = `כותרת 1 - חלק ההערות\nפסקה פותחת עם הערה אחת ארוכה מאוד [${NOTE_WORDS}] והמשך הפסקה בטקסט רגיל למילוי הטורים.\nפסקה שנייה עם עוד קצת תוכן שוטף למילוי העמודים הבאים בשורות תקינות ובסדר מלא לגמרי כאן. עוד משפט ארוך למילוי השורות בטור הימני ואז בשמאלי.\n`;
  // קיבולת העמוד: (915 − 38.5 תקורת שמורה − 21.44 שורת-גוף) בכפולות FN_PITCH
  const FN_CAP_PX = Math.floor((GEO.FLOW_H - 38.5 - 12 * (96 / 72) * 1.34) / GEO.FN_PITCH) * GEO.FN_PITCH;

  it('תקרת קיבולת העמוד: הערה ארוכה ממלאת את העמוד עד תומו (לא 220px)', () => {
    const r = typeset(FN_DOC, legacySettings(), { noRecommendations: true });
    assert(r.pages.some(p => (p.footnotes || []).length), 'footnotes exist');
    let maxH = 0;
    for (const pg of r.pages) {
      const placedH = (pg.footnotes || []).reduce((a, f) => a + f.lines.length * GEO.FN_PITCH, 0);
      maxH = Math.max(maxH, placedH);
      assert(placedH <= FN_CAP_PX + 0.01, `page ${pg.index}: fn bar ≤ קיבולת ${FN_CAP_PX.toFixed(1)}px (got ${placedH.toFixed(1)})`);
    }
    // התיקון עצמו: המרזב ממלא מעבר לתקרת 220 ההיסטורית — הערה ארוכה לא
    // "מדלגת" לעמוד שלישי מוקדם (דיווח משתמש: "לא ממלאות את כל גובה העמוד").
    assert(maxH > 220, `המרזב ממלא את העמוד (max ${maxH.toFixed(1)}px > 220)`);
  });

  it('פיצול: ההמשך בעמוד הבא פותח ב-(המשך) בלי אות סימון', () => {
    const r = typeset(FN_DOC, legacySettings(), { noRecommendations: true });
    // זרימה רציפה: מזהים המשך לפי טוקן '(המשך)' — ומוודאים שאין לפניו סמן
    // (דיווח משתמש: "להסיר את אות הסימון מהערה שהיא המשך").
    let contPages = 0;
    for (const pg of r.pages) {
      for (const f of (pg.footnotes || [])) {
        for (const l of f.lines) {
          const toks = (l.words || []).filter(t => !t.gap);
          for (let i = 0; i < toks.length; i++) {
            if (toks[i].t === '(המשך)') {
              contPages++;
              assert(i === 0 || !toks[i - 1].mk, 'לפני (המשך) אין אות סימון');
              assert(!toks[i].mk, '(המשך) אינו מסומן כסמן');
            }
          }
        }
      }
    }
    assert(contPages >= 1, 'long note must continue with (המשך)');
    const settings = legacySettings();
    const pgc = r.pages.find(p => {
      const f = (p.footnotes || [])[0];
      return f && f.continuous && (f.lines[0].words || []).some(t => t.t === '(המשך)');
    });
    assert(pgc, 'page with a continuation flow exists');
    const doc = makeDoc();
    const el = renderPage(pgc, settings, doc, pgc.header || null);
    let sawHamsht = false;
    walk(el, (n) => { if (hasClass(n, 'fn--continuation')) sawHamsht = n.textContent.startsWith('(המשך)'); });
    assert(sawHamsht, 'continuation flow renders with (המשך) prefix');
  });

  it('אין חפיפת גוף/הערות: תחתית הגוף מעל ראש מרזב ההערות בכל עמוד', () => {
    const r = typeset(FN_DOC, legacySettings(), { noRecommendations: true });
    for (const pg of r.pages) {
      if (!(pg.footnotes || []).length) continue;
      const placedH = pg.footnotes.reduce((a, f) => a + f.lines.length * GEO.FN_PITCH, 0);
      const fnTop = FLOW_BOTTOM - placedH;
      let bodyBottom = 0;
      for (const col of (pg.columns || [])) for (const ln of col) bodyBottom = Math.max(bodyBottom, (ln.y || 0) + (ln.heightPx || 0));
      assert(bodyBottom <= fnTop + 1.5, `page ${pg.index}: body bottom ${bodyBottom.toFixed(1)} ≤ fn top ${fnTop.toFixed(1)}`);
    }
  });

  it('שימור תוכן: שרשור כל חלקי ההערה (עם ההמשכים) = הטקסט המקורי', () => {
    const r = typeset(FN_DOC, legacySettings(), { noRecommendations: true });
    // **S4.26 (זרימה רציפה):** משחזרים פריטי הערה מהטוקנים — מקטע שפותח
    // ב-'(המשך)' משורשר לקודמו; מקטע עם סמן פותח הערה חדשה.
    const parts = [];
    for (const pg of r.pages) {
      for (const f of (pg.footnotes || [])) {
        if (!f.continuous) {
          parts.push({ cont: !!f.cont, text: f.lines.map(l => (Array.isArray(l.words) ? l.words.join(' ') : String(l.words))).join(' ') });
          continue;
        }
        let cur = null, curIsCont = false;
        for (const l of f.lines) {
          for (const t of (l.words || [])) {
            if (t.gap) continue;
            if (t.t === '(המשך)') { if (cur) { parts.push({ cont: curIsCont, text: cur }); } cur = []; curIsCont = true; continue; }
            if (t.mk) { if (cur) { parts.push({ cont: curIsCont, text: cur }); } cur = []; curIsCont = false; continue; }
            if (!cur) cur = [];
            cur.push(t.t);
          }
        }
        if (cur) parts.push({ cont: curIsCont, text: cur });
      }
    }
    assert(parts.length >= 2, 'note split across pages');
    const rebuilt = [];
    for (const p of parts) {
      const txt = p.text.join ? p.text.join(' ') : p.text;
      if (p.cont && rebuilt.length) rebuilt[rebuilt.length - 1] += ' ' + txt;
      else rebuilt.push(txt);
    }
    // ההערה הארוכה היא הראשונה; המשכיה משורשרים אליה
    const target = rebuilt.find(t => norm(t).length > 100);
    assert(target, 'long note reconstructed');
    assertEq(norm(target).split(' ').length, norm(NOTE_WORDS).split(' ').length, 'no note line lost (word count preserved)');
  });

});

report('s24-fullmath-fixes');
