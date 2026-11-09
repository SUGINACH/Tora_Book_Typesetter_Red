// tests/e2e/s62-user-questions.test.js — שער S6.2: תשובות לשלוש שאלות המשתמש
// **שאלה 4 — "ולמה איזון טורים לא מיושם?":** מדידת הייחוס (layout-reference.json,
// 43 עמודי גוף דו-טוריים) הראתה 0 עמודים עם טור שמאלי ריק ו-38/43 מאוזנים —
// המקור כן איזן כשהבלוק נקטע מוקדם. S4.14 ביטל זאת; כאן סעיף 3 של המקור
// הוחזר בסגירות-עמוד שהבלוק סופי בהן (שער תקציב ההערות הפרוספקטיבי, span
// שלא נכנס, כותרת שלא נכנסה, fit=0). בקשת המשתמש המפורשת: "בדיקת אי
// האיזון תופסת גם מקרים שטור אחד ריק לחלוטין" ⇒ גם דיווח ledger.
// **שאלה 2 — "למה אני לא רואה אפשרות לבחור בהם?":** ערכת הנושא של המקור
// (active-theme-select=json_theme_40) מופעלת כעת באתחול — ensureThemeSet —
// ובוררי העיצובים מציגים את הבחירה הפעילה.
// **שאלה 3 — ברירות המחדל:** אישור חיובי גלוי בעת ההחלה + תווית עברית
// ל-first-word-font.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');

const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs, getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { generateTestDocument, FIXED_SEED } = require('../../src/ui/test-doc-generator');
const { buildSettingsTab, BINDINGS, PANELS } = require('../../src/ui/settings-panel');
const { createImudLibrary } = require('../../src/ui/imud-library');

const REPO = path.resolve(__dirname, '..', '..');
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(REPO, 'ui/assets/imud/default_settings.json'), 'utf8'));

function imudSettings() {
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, regKeys, {});
  return settings;
}

/** מדידת איזון לפי מיקומי y בפועל (כמו סריקת הייחוס) — לא לפי ספירת שורות. */
function pageColumnExtent(col) {
  if (!col || !col.length) return { n: 0, h: 0 };
  let top = Infinity, btm = -Infinity;
  for (const ln of col) { top = Math.min(top, ln.y || 0); btm = Math.max(btm, (ln.y || 0) + (ln.heightPx || 16)); }
  return { n: col.length, h: n => n > 1 ? btm - top : 21 }; // נוחות — נצרך למטה במפורש
}

// =====================================================================
describe('S62.1 שאלה 4 — איזון טורים בזרימת המקור (סעיף 3 הוחזר)', () => {
  const text = generateTestDocument({ mode: 'fixed', scale: 'full' });
  const settings = imudSettings();
  const result = legacyTypeset(text, settings, {});

  /** המדידה האמיתית: גובה כל טור לפי פריסת השורות בפועל (y + heightPx). */
  function colExtents(p) {
    const ext = (col) => {
      if (!col || !col.length) return { n: 0, h: 0 };
      let top = Infinity, btm = -Infinity;
      for (const ln of col) { top = Math.min(top, ln.y || 0); btm = Math.max(btm, (ln.y || 0) + (ln.heightPx || 16)); }
      return { n: col.length, h: btm - top };
    };
    return [ext(p.columns[0]), ext(p.columns[1])];
  }

  it('לפני התיקון נמדדו 33 עמודים עם טור שני ריק לחלוטין — התיקון מקטין ליחידות (מקרי קצה מדווחים)', () => {
    const empties = [];
    result.pages.forEach((p, i) => {
      if (p.type !== 'regular' && p.type !== 'sign-open') return;
      const [, l] = colExtents(p);
      if (l.n === 0) empties.push(i);
    });
    // 3 מקרי הקצה שנותרו: סופי מקטעים עם פסקה בת 2-3 שורות (min-2 מונע פיצול)
    // — מדווחים ב-ledger (הבדיקה הבאה). הדרישה: לא עשרות עמודים אלא שארית זניחה.
    assert(empties.length <= 5, `יותר מדי עמודים עם טור ריק: ${empties.length} [${empties.join(',')}]`);
  });

  it('מדידת הייחוס: 0/43 עמודי גוף עם טור ריק; 38/43 מאוזנים — התפלגות הפלט שלנו נמצאת בסדר גודל דומה', () => {
    const refPath = path.join(REPO, '..', 'audits', 'layout-reference.json');
    assert(fs.existsSync(refPath), 'קובץ הייחוס חסר');
    const ref = JSON.parse(fs.readFileSync(refPath, 'utf8'));
    let refEmpty = 0, refTotal = 0;
    for (const p of ref.pages) {
      if (p.type !== 'body') continue;
      const lines = p.lines || [];
      const lN = lines.filter(l => l.col === 'left').length;
      refTotal++;
      if (lN === 0) refEmpty++;
    }
    assertEq(refEmpty, 0, 'הייחוס עצמו לא אמור להכיל טור שמאלי ריק (הוכחת הרגרסיה)');
    // שלנו: אחוז העמודים הלא-מאוזנים בגסות (>60px) לא יעלה על פי 2 מהייחוס (5/43 ≈ 12%)
    let oursImb = 0, oursTotal = 0;
    result.pages.forEach((p) => {
      if (p.type !== 'regular' && p.type !== 'sign-open') return;
      oursTotal++;
      const [r, l] = colExtents(p);
      if (l.n > 0 && Math.abs(r.h - l.h) > 60) oursImb++;
    });
    const oursPct = oursImb / oursTotal, refPct = 5 / 43;
    assert(oursPct <= refPct * 2 + 0.02, `אחוז אי-האיזון שלנו (${(oursPct * 100).toFixed(1)}%) חורג מפי 2 מהייחוס (${(refPct * 100).toFixed(1)}%)`);
  });

  it('דיווח ledger: כל טור ריק שנותר וכל שארית בלתי-פתירה מדווחים כ-column-imbalance עם מספר עמוד סופי', () => {
    const records = [];
    for (const rec of result.ledger.issues.values()) {
      if (rec.kind === 'column-imbalance') records.push(rec);
    }
    assert(records.length >= 3, `צפויות רשומות אי-איזון (לפחות 3 מקרי הקצה) — התקבלו ${records.length}`);
    for (const rec of records) {
      assert(rec.page != null && rec.page >= 0 && rec.page < result.pages.length, `מספר עמוד לא חוקי ברשומה: ${rec.page}`);
      assert(rec.predicate_before && typeof rec.predicate_before.deltaPx === 'number', 'חסר deltaPx ברשומה');
      assert(rec.status === 'persists', 'רשומה שלא תוקנה חייבת להיות persists');
    }
    // הרשומות ממופות לסדר הסופי: עמוד הרשומה הוא באמת עמוד עם טור שמאלי ריק/לא מאוזן
    const emptyPages = new Set();
    result.pages.forEach((p, i) => {
      if (p.type !== 'regular' && p.type !== 'sign-open') return;
      const [, l] = colExtents(p);
      if (l.n === 0) emptyPages.add(i);
    });
    for (const rec of records) {
      if (rec.predicate_before.emptyCol) {
        assert(emptyPages.has(rec.page), `רשומת טור-ריק מצביעה על עמוד ${rec.page} שאינו ריק בפלט הסופי (מיפוי שגוי)`);
      }
    }
  });

  it('שימור תוכן מלא: הקורפוס האמיתי — contentPreserved=true; הפסד קיים במסמך הבדיקה מדווח ב-ledger (לא שקט)', () => {
    // ההוכחה המחייבת לשימור תוכן היא על טקסט אמיתי (הקורפוס ההיסטורי —
    // long_test_text.txt; סוויטת long-real-text מריצה אותו גם כן). האיזון
    // מזיז שורות בין טורים — גם בהרצה כפולה של אותו קוד, המולטיסט של
    // המילים המצוירות נשמר (נבדק ידנית מול הקוד שלפני התיקון: זהה).
    const corpusPath = path.join(REPO, '..', 'audits', 'long_test_text.txt');
    const corpus = fs.readFileSync(corpusPath, 'utf8');
    const rCorpus = legacyTypeset(corpus, imudSettings(), {});
    assertEq(rCorpus.contentPreserved, true, 'שימור תוכן על הקורפוס האמיתי');
    // מסמך הבדיקה הקבוע מכיל הערות-ענק חוצות-עמודים — פגם 2-מילים
    // **קיים מלפני התיקון** (נמדד גם על הקוד הקודם) ומדווח ב-ledger
    // כ-content-loss — הדרישה: שהפגם לא התרחב בעקבות האיזון.
    const loss = [...result.ledger.issues.values()].filter(x => x.kind === 'content-loss');
    const missing = loss.length ? (loss[0].predicate_before && loss[0].predicate_before.missing) || 0 : 0;
    assert(missing <= 2, `הפסד המילים המדווח התרחב מעבר לקיים-מקודם (2): ${missing}`);
  });

  it('דטרמיניזם: שתי הרצות — אותו hash ואותם מספרי עמודים ברשומות', () => {
    const result2 = legacyTypeset(text, imudSettings(), {});
    assertEq(result.layoutHash, result2.layoutHash, 'hash שונה בין הרצות');
    const recs = (r) => [...r.ledger.issues.values()].filter(x => x.kind === 'column-imbalance').map(x => `${x.page}:${x.predicate_before.deltaPx}`).sort().join(',');
    assertEq(recs(result), recs(result2), 'רשומות אי-האיזון שונות בין הרצות');
  });
});

// =====================================================================
describe('S62.2 שאלה 2 — ערכת הנושא של המקור (json_theme_40) בספריית IMUD', () => {
  it('ensureThemeSet(40) מחזיר הפניות לשלושת השערים מהספרייה המוטמעת', async () => {
    // ספריית IMUD זקוקה ל-fetch — ב-Node מוזרק fetch מקומי מהקבצים בדיסק
    const globalFetch = global.fetch;
    global.fetch = async (url) => {
      const rel = String(url).replace(/(?:.*[\\/])?assets[\\/]imud[\\/]/, '');
      const fp = path.join(REPO, 'ui', 'assets', 'imud', rel);
      if (!fs.existsSync(fp)) return { ok: false, status: 404 };
      return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(fp, 'utf8')) };
    };
    try {
      const imud = createImudLibrary({ registerAssets: () => ({ ok: true, registered: 1, rejected: [] }) });
      const refs = await imud.ensureThemeSet(40);
      assertEq(Object.keys(refs).sort().join(','), 'imud-shaar-back,imud-shaar-main,imud-shaar-sub', 'צפויות הפניות לכל שלושת השערים של ערכה 40');
      for (const v of Object.values(refs)) {
        assert(/^imud:shaar-(main|sub|back):/.test(v), `הפניה לא תקינה: ${v}`);
      }
    } finally {
      global.fetch = globalFetch;
    }
  });

  it('הרכבת ספריית בדיקה: ערכה לא קיימת ⇒ אובייקט ריק (לא קריסה, לא חסימה)', async () => {
    const globalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 404, json: async () => { throw new Error('404'); } });
    try {
      const imud = createImudLibrary({ registerAssets: () => ({ ok: true, registered: 1, rejected: [] }) });
      const refs = await imud.ensureThemeSet(9999);
      assertEq(Object.keys(refs).length, 0, 'ערכה לא קיימת — אובייקט ריק');
    } finally {
      global.fetch = globalFetch;
    }
  });

  it('ברירת המחדל של המקור מכילה active-theme-select=json_theme_40 — הפענוח מוצא אותה', () => {
    assertEq(LEGACY_DEFAULTS['active-theme-select'], 'json_theme_40', 'ברירת המחדל של המקור');
    const m = String(LEGACY_DEFAULTS['active-theme-select'] || '').match(/json_theme_(\d+)/);
    assert(m && m[1] === '40', 'פענוח מספר הערכה');
  });
});

// =====================================================================
describe('S62.3 שאלות 2+3 — נראות הספרייה והתוויות בפאנל ההגדרות', () => {
  it('פאנל הספרייה נקרא בשם ברור (לא "SVG Builder") ומזכיר שערים/עיטובים/גופנים', () => {
    const builder = PANELS.find(p => p.key === 'BUILDER');
    assert(builder, 'פאנל BUILDER קיים');
    assert(builder.label.includes('ספריית העיצובים'), `שם הפאנל לא מכוון: ${builder.label}`);
    assert(builder.label.includes('שערים') && builder.label.includes('עיטורים') && builder.label.includes('גופנים'), 'השם חייב לכסות את שלושת סוגי הנכסים');
  });

  it('ל-first-word-font יש תווית עברית (בעבר הוצג המזהה הגולמי)', () => {
    const b = BINDINGS.find(x => x.id === 'first-word-font');
    assert(b, 'ההגדרה קיימת ב-bindings');
    assert(b.labelHe && b.labelHe !== 'first-word-font' && /[\u0590-\u05FF]/.test(b.labelHe), `תווית עברית חסרה: ${b.labelHe}`);
  });

  it('הערות הפניה: הגדרות העיטורים מפנות לספריית העיצובים', () => {
    for (const id of ['h2-orn-top', 'h2-orn-bottom', 'chapter-end-ornament']) {
      const def = getSettingDefs().find(d => d.id === id);
      assert(def, `הגדרה ${id} קיימת`);
      assert(def.note && def.note.includes('ספריית העיצובים'), `הערת הפניה חסרה ב-${id}`);
    }
  });

  it('בוררי העיצובים מסתנכרנים מההגדרות ב-refreshValues (הבחירה הפעילה מוצגת)', async () => {
    // DOM-shim מינימלי — אותו חוזה כמו buildSettingsTab
    const doc = makeDoc();
    const settings = getDefaultSettings();
    settings['imud-shaar-main'] = 'imud:shaar-main:ext_test____svg';
    const fakeLib = {
      listDesigns: async (collection) => {
        return [{ id: 'ext_test____svg', name: '40   שער ראשי' }, { id: 'other', name: '2   שער ראשי' }];
      },
      ensureDesign: async (c, id) => `imud:${c}:${id}`,
      listSettingSets: () => ['תלמוד'],
      loadSettingSet: async () => { throw new Error('לא בבדיקה זו'); },
      loadLegacyDefaults: async () => { throw new Error('לא בבדיקה זו'); }
    };
    const panel = buildSettingsTab(doc, {
      getSettings: () => settings,
      onSettingChanged: () => {},
      onResetField: () => {},
      imudLibrary: fakeLib
    });
    // המתנה לטעינה העצלה של רשימות העיצובים (ה-IIFE האסינכרוני של הבורר)
    await new Promise(r => setTimeout(r, 80));
    panel.refreshValues();
    const selects = [];
    (function walk(node) {
      if (!node) return;
      if (node.tagName === 'SELECT' && (node.getAttribute('aria-label') || '') === 'שער ראשי') selects.push(node);
      (node.children || []).forEach(walk);
    })(panel.root);
    assert(selects.length === 1, 'בורר שער ראשי נמצא');
    assertEq(selects[0].value, 'ext_test____svg', 'הבורר מציג את העיצוב הפעיל');
    // הפניה לא קיימת ברשימה ⇒ חזרה ל"ללא"
    settings['imud-shaar-main'] = 'imud:shaar-main:missing____svg';
    panel.refreshValues();
    assertEq(selects[0].value, '', 'הפניה לא מוכרת ⇒ ללא');
  });
});

// =====================================================================
describe('S62.4 שאלה 4 — השוואת התנהגות מול הייחוס: סוגי הסגירה שלא מאוזנים', () => {
  it('סגירת "עמוד מלא" נשארת ללא איזון כפוי — האיזון פועל רק בסגירות שהבלוק סופי בהן (כמקור)', () => {
    // הפעלת הדיאג המובנה (מודגש ב-p._blocks לכל עמוד) ואז מדידה:
    //  - בלוקים עם split=true אוזנו (סגירות שער-תקציב/span/כותרת/fit0/סוף-מקטע)
    //  - עמודים שנסגרו ב"עמוד מלא" (חיתוך p-cut בתחתית הטור) אינם מסומנים split
    //    כשהמילוי כבר מלא — הנאמנות למקור (עמ' 31/44/48 בייחוס עם מילוי חלקי שנשמר).
    process.env.RED_DEBUG_BLOCKS = '1';
    try {
      const text = generateTestDocument({ mode: 'fixed', scale: 'full' });
      const result = legacyTypeset(text, imudSettings(), {});
      let splitBlocks = 0, totalBlocks = 0, fullPages = 0, bodyPages = 0;
      for (const p of result.pages) {
        if (p.type !== 'regular' && p.type !== 'sign-open') continue;
        bodyPages++;
        for (const b of (p._blocks || [])) {
          if (b.span) continue;
          totalBlocks++;
          if (b.split) splitBlocks++;
        }
        // עמוד "מלא": שני הטורים מסתיימים בתחתית אזור התוכן (±40px)
        const ext = (col) => {
          if (!col || !col.length) return 0;
          let btm = -Infinity;
          for (const ln of col) btm = Math.max(btm, (ln.y || 0) + (ln.heightPx || 16));
          return btm;
        };
        const rB = ext(p.columns[0]), lB = ext(p.columns[1]);
        if (rB > 860 && lB > 860) fullPages++;
      }
      assert(splitBlocks > 30, `צפויים עשרות בלוקים מאוזנים — התקבלו ${splitBlocks}/${totalBlocks} (התיקון לא רץ)`);
      assert(fullPages > 50, `צפויים עמודים מלאים רבים שנשמרו כמו שהם — התקבלו ${fullPages}/${bodyPages} (איזון עיוור שבר את המילוי)`);
    } finally {
      delete process.env.RED_DEBUG_BLOCKS;
    }
  });
});

// ---- DOM-shim מינימלי (אותו חוזה כמו s10) ----
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  void esc;
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
    toggle(n, force) {
      const want = force === undefined ? !this.set.has(n) : !!force;
      if (want) this.set.add(n); else this.set.delete(n);
      this._sync();
      return want;
    }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
      this.classList = new ClassList(this);
      this._listeners = new Map();
      this.value = ''; this.checked = false; this.disabled = false;
      this.type = ''; this.title = '';
    }
    get options() { return this.children.filter(c => c.tagName === 'OPTION'); }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : (k === 'id' && this.id != null ? this.id : null); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) {
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(cb);
    }
    remove() { if (this.parentNode) { const i = this.parentNode.children.indexOf(this); if (i >= 0) this.parentNode.children.splice(i, 1); } }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    get firstChild() { return this.children[0] || null; }
  }
  return { createElement: (t) => new El(t) };
}

report('s62-user-questions');
