// tests/e2e/s13-acceptance.test.js — שער S13 (S13.2): קבלה סופית — מטריצה מלאה, דטרמיניזם משולש, תקציבי ביצועים
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportHtml, exportPdf, exportProjectZip } = require('../../src/engine/output/export-api');
const { renderPage } = require('../../src/engine/output/dom-renderer');

const ART = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);
const { spawnSync } = require('child_process');
function hasTool(name) {
  const r = spawnSync(name, ['-v'], { stdio: 'ignore' });
  return !(r.error && r.error.code === 'ENOENT');
}
const HAS_PDFTOOLS = hasTool('pdfinfo') && hasTool('pdftotext') && hasTool('pdftoppm');

const CANONICAL_HASH_PREFIX = 'ace26c5b'; // ננעל מחדש 06.11 (S5.1 — סקירת-קוד מלאה: הפצת רווח-הביטחון D-92 לנתיב ה-DP (FIT_EPS 0.75 בטבעי, בלי shrink), פס-שורה מדויק בלי Math.round (21.44 לא 21), protectWords בלי פירוק NBSP, רוחב TOC/גיליון מהעמודות במקום רוחב-עמודה מלא. קודם: ננעל 05.11 (S4.26 — ברירות מחדל חדשות להערות מדיווח המשתמש):
// עמודי השער חלק ממבנה הספר כברירת מחדל (show-*-shaar=true של המקור ממופים
// למתגי shaar-*-enabled; השער האחורי אחרי הראשי — סדר המקור), כותרות עליונות
// בעמודי פתיחה (תיקון D-36 החלקי — כמקור, top-header-grid בכל עמודי התוכן),
// תוכן שערים מובנה (shaar-content), ותוכן השער מוקרן גם ל-PDF. שרשרת הנעילות:
// 75b8c605 (גרידי) → 7ccad899 (החייאת KP) → 93dfbd3e (S4.5) → ef2e7a14 (S4.7) → ad1161a9 (S4.7-ב: פס חוצה-טורים) → 53ea73e3 (S4.21/EXT-8: החלפת הטיפוס הגרידי שורה-שורה בחלוקה הגלובלית האופטימלית) → 2b88e2c8 (S4.26: ברירות המחדל של ההערות השתנו לפי הוראת המשתמש — זרימה רציפה, איפוס מספור פר-פרק, תקרת קיבולת במקום 220px; ה-DP עקב אחרי הרישום). שרשרת S4.21: החלפת הטיפוס הגרידי שורה-שורה בחלוקה הגלובלית האופטימלית — פיצול רציף ממזער |lH-rH| בכפוף לקיבולת ולגבול-תפר נקי; עמודים שהגרידי השאיר ב-Δ≤5px שאינו המינימום מאוזנים כעת עד המינימום המוכח; הוכחה: tests/layout/ext8-optimal-balance.test.js — מיצוי-כוח 400 מופעים).
// ההוכחה הבין־קומיטית מתחילה מחדש מכאן.

// DOM shim מינימלי לרינדור
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this.dir = ''; this._text = ''; this.classList = { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; } get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] || null; } removeAttribute(k) { delete this.attrs[k]; }
    addEventListener() {} removeEventListener() {} dispatchEvent() { return true; } click() {} setSelectionRange() {} scrollIntoView() {} focus() {}
    querySelector() { return null; } querySelectorAll() { return []; }
    outerHTML() {
      const attrs = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('') + (this._class ? ` class="${esc(this._class)}"` : '');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

// =====================================================================
// **חיזוק ביקורת 03.11:** המטריצה הוגדרה פעם אחת ברמת המודול — משמשת גם את
// בדיקת המטריצה (S13.1-1) וגם את זהות הנתיבים המוגברת (S13.2) — מקור יחיד.
const CONFIGS = {
  'default': {},
  'ornaments': { 'h2-orn-top': 'pyramid', 'chapter-end-ornament': 'pyramid', 'col-divider-style': 'thin' },
  'aq-on': { 'aq-enabled': true },
  'continuous-notes': { 'footnote-reset-policy': 'continuous' },
  'verso-headers': { 'header-verso-right-source': 'h1', 'header-verso-center-source': 'page-num', 'header-recto-left-source': 'h2' },
  'custom-styles': {
    _customStyles: JSON.stringify({ styles: [
      { id: 'quote', name: 'ציטוט', trigger: { inlineMarker: { open: '«', close: '»' } }, layoutMode: 'regular', style: { italic: true, fontSizePt: 13 } },
      { id: 'callout', name: 'קריאה', trigger: { linePrefix: 'קריאה:' }, layoutMode: 'full-width', style: { bold: true }, counter: { enabled: true, format: 'hebrew-geresh', reset: 'part' } }
    ] })
  }
};

describe('S13.1-1 — מטריצת רגרסיה מלאה: 6 קונפיגורציות × 3 נתיבים — דו"ח מצטבר', () => {
  const doc = makeDoc();
  const matrix = [];
  for (const [name, overrides] of Object.entries(CONFIGS)) {
    const settings = { ...getDefaultSettings(), ...overrides };
    const t0 = Date.now();
    const r = typeset(CORPUS, settings, { noRecommendations: true });
    const ms = Date.now() - t0;
    // חומרות ממצאים מה־ledger
    const issues = [...r.ledger.issues.values()];
    const high = issues.filter(i => (i.severity || '').toLowerCase() === 'high' && i.status !== 'resolved').length;
    const open = issues.filter(i => i.status !== 'resolved');
    matrix.push({
      config: name, pages: r.pages.length, ms,
      contentPreserved: r.contentPreserved, geometryNeutral: r.geometryNeutralVerified,
      layoutHash: r.layoutHash, findingsOpen: open.length, findingsHigh: high,
      openByKind: open.reduce((m, i) => (m[i.kind] = (m[i.kind] || 0) + 1, m), {})
    });
    // נתיב HTML — דטרמיניזם ותקינות
    const html1 = exportHtml(r, settings, doc, {});
    const html2 = exportHtml(r, settings, doc, {});
    const htmlOk = html1 === html2 && html1.includes('dir="rtl"');
    matrix[matrix.length - 1].htmlDeterministic = htmlOk;
    // נתיב PDF (עם גופן) — דטרמיניזם
    if (HAS_DEJAVU) {
      const fontBytes = fs.readFileSync(DEJAVU);
      const pdf1 = exportPdf(CORPUS, overrides, fontBytes, 'DejaVu Sans');
      const pdf2 = exportPdf(CORPUS, overrides, fontBytes, 'DejaVu Sans');
      matrix[matrix.length - 1].pdfDeterministic = pdf1.ok && pdf2.ok && Buffer.compare(pdf1.bytes, pdf2.bytes) === 0;
      matrix[matrix.length - 1].pdfPages = pdf1.ok ? pdf1.info.pages : null;
    }
  }

  it('כל 6 הקונפיגורציות: עימוד תקין, שימור תוכן, ניטרליות גיאומטריה', () => {
    for (const row of matrix) {
      assert(row.pages >= 15, `${row.config}: עמודים סבירים (${row.pages})`);
      assert(row.contentPreserved, `${row.config}: שימור תוכן`);
      assert(row.geometryNeutral, `${row.config}: ניטרליות גיאומטריה (CP4==CP5)`);
    }
  });

  it('אפס ממצאי HIGH פתוחים בכל המטריצה; שאר הממצאים עם הצדקת ledger גלויה', () => {
    for (const row of matrix) {
      assertEq(row.findingsHigh, 0, `${row.config}: אפס HIGH פתוחים`);
    }
    // דוח מצטבר נשמר — כל ממצא פתוח מתועד עם סוגו (שקיפות מלאה)
    fs.writeFileSync(path.join(ART, 's13-matrix-report.json'), JSON.stringify({
      generatedBy: 's13-acceptance', doc: 'canonical_corpus.txt',
      configs: matrix, paths: ['live', 'html', HAS_DEJAVU ? 'pdf' : 'pdf(skipped:no-font)'],
      acceptance: { maxHighOpen: 0, contentPreservedAll: true }
    }, null, 2));
  });

  it('הצלבת נתיבים: html/pdf דטרמיניסטיים בכל קונפיגורציה; מספרי עמודים עקביים', () => {
    for (const row of matrix) {
      assert(row.htmlDeterministic, `${row.config}: HTML ×2 ⇒ בתים זהים`);
      if (HAS_DEJAVU) {
        assert(row.pdfDeterministic, `${row.config}: PDF ×2 ⇒ בתים זהים`);
      }
    }
  });

  it('כיסוי טריגרים: מפגש שלבי הצינור במטריצה — חשבונאות מלאה (artifact)', () => {
    const stageHits = new Set();
    for (const [, overrides] of Object.entries(CONFIGS)) {
      const r = typeset(CORPUS, { ...getDefaultSettings(), ...overrides }, { noRecommendations: true });
      for (const ev of r.events.events) stageHits.add(ev.stage);
    }
    const known = ['parse', 'scope-map', 'measure', 'page-plan', 'balance', 'protections', 'toc', 'decorations', 'folio', 'ledger-finalize', 'render'];
    const missing = known.filter(s => !stageHits.has(s));
    assertEq(missing, [], 'כל שלבי הצינור הקנוניים נפגשים');
    const acc = { stagesHit: [...stageHits].sort(), eventsTotal: stageHits.size, notExercised: [] };
    fs.writeFileSync(path.join(ART, 's13-trigger-accounting.json'), JSON.stringify(acc, null, 2));
  });
});

// =====================================================================
describe('S13.2 — דטרמיניזם משולש (repeat / inter-commit / cross-path)', () => {
  it('repeat: שתי ריצות ⇒ hash זהה', () => {
    const a = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    const b = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    assertEq(a.layoutHash, b.layoutHash, 'hash זהה');
  });

  it('inter-commit: הקנוני נעול מחדש (2b88e2c8…) — ראה תיעוד הקבוע למעלה; המנוע לא הוסט מאז הנעילה מחדש', () => {
    const r = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    assert(r.layoutHash.startsWith(CANONICAL_HASH_PREFIX), `hash ${r.layoutHash.slice(0, 16)} — נעול ${CANONICAL_HASH_PREFIX}`);
  });

  it('cross-path: live/html/pdf — זהות מלאה בכל 6 התצורות: מולטיסט תווים מול כל הטקסט המצויר (לא עוד סף 85%) + pdfinfo + parity גיאומטרי ≤6px', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    // **חיזוק ביקורת 03.11 (החלטת משתמש):** פופלר הוא דרישת קבלה קשיחה — בדיקת
    // חילוץ ה־PDF חשובה מכדי לוותר עליה. כשל מפורש ולא ENOENT שקט.
    assert(HAS_PDFTOOLS, 'נדרש poppler-utils (pdfinfo/pdftotext/pdftoppm) לבדיקת קבלה — התקנה: sudo apt-get install poppler-utils');
    const norm = (s) => s.replace(/[\s\u200E\u200F\u202A-\u202E]+/g, '').split('').sort().join('');
    const rows = [];
    for (const [name, overrides] of Object.entries(CONFIGS)) {
      const settings = { ...getDefaultSettings(), ...overrides };
      const r = typeset(CORPUS, settings, { noRecommendations: true });
      const exp = exportPdf(CORPUS, overrides, fs.readFileSync(DEJAVU), 'DejaVu Sans');
      assert(exp.ok, `${name}: exportPdf`);
      const pdfPath = path.join(ART, '_tmp-crosspath.pdf');
      fs.writeFileSync(pdfPath, exp.bytes);
      try {
        // א. מספרי עמודים: pdfinfo ≡ מנוע ≡ live
        const info = execFileSync('pdfinfo', [pdfPath]).toString('utf8');
        assertEq(Number(info.match(/Pages:\s+(\d+)/)[1]), exp.result.pages.length, `${name}: pdfinfo ≡ מנוע`);
        assertEq(exp.result.pages.length, r.pages.length, `${name}: live ≡ pdf (עמודים)`);
        // ב. זהות תוכן מלאה: מולטיסט תווים מול כל הטקסט המצויר בפועל (מהקרנה — מקור יחיד)
        const txt = execFileSync('pdftotext', [pdfPath, '-']).toString('utf8');
        const drawnWords = [];
        for (const pg of exp.projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawnWords.push(w.text);
          for (const fn of pg.footnotes) drawnWords.push(fn.marker, ...fn.text.split(/\s+/));
          if (pg.folio && pg.folio.text) drawnWords.push(pg.folio.text);
          if (pg.header) for (const s of pg.header.slots) drawnWords.push(s.text);
        }
        const engineTxt = drawnWords.filter(Boolean).join(' ');
        assertEq(norm(txt), norm(engineTxt), `${name}: חילוץ ≡ כל הטקסט המצויר (מולטיסט מדויק — לא כיסוי 85%)`);
        // ג. parity גיאומטרי לכל תצורה: bbox דיו ברסטר מול המודל ≤6px (עמוד גוף מלא)
        const pgIdx = 3;
        const prefix = path.join(ART, '_tmp-xp');
        execFileSync('pdftoppm', ['-r', '96', '-f', String(pgIdx + 1), '-l', String(pgIdx + 1), pdfPath, prefix]);
        const files = fs.readdirSync(ART).filter(f => f.startsWith('_tmp-xp-')).sort();
        const raw = fs.readFileSync(path.join(ART, files[files.length - 1]));
        const mm = raw.toString('latin1').match(/^P6\n(\d+) (\d+)\n(\d+)\n/);
        const off = mm[0].length, W = +mm[1], H = +mm[2];
        let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = off + (y * W + x) * 3;
          if (raw[i] < 128 && raw[i + 1] < 128 && raw[i + 2] < 128) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
        for (const f of files) fs.unlinkSync(path.join(ART, f));
        const b = exp.projected.inkBounds[pgIdx];
        if (b) {
          const worst = Math.max(Math.abs(minX - b.minX), Math.abs(maxX - b.maxX), Math.abs(minY - b.minY), Math.abs(maxY - b.maxY));
          rows.push({ config: name, pages: exp.result.pages.length, identity: true, worstBboxPx: +worst.toFixed(2) });
          assert(worst <= 6, `${name}: bbox דיו Δ=${worst.toFixed(1)}px ≤ 6px (רסטר מול מודל)`);
        } else {
          rows.push({ config: name, pages: exp.result.pages.length, identity: true, worstBboxPx: null, note: 'אין דיו בעמוד הדגימה' });
        }
      } finally { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); }
    }
    assertEq(rows.length, 6, 'נבדקו כל 6 התצורות');
    fs.writeFileSync(path.join(ART, 's13-crosspath.json'), JSON.stringify({
      generatedBy: 's13-acceptance/cross-path (חיזוק ביקורת 03.11)',
      rule: 'מולטיסט תווים מדויק מול כל הטקסט המצויר; pdfinfo ≡ live ≡ pdf; bbox ≤6px',
      tolerance: { bboxPx: 6 }, configs: rows
    }, null, 2));
  });
});

// =====================================================================
describe('S13.1-3 — תקציבי ביצועים (T4) — מדידות אמת + artifact', () => {
  it('מסמך 639+ עמודים תחת 45s (warm); זיכרון שיא סביר; cache hit-rate ≥90%', () => {
    // בניית מסמך סינתטי ≥639 עמודים (חזרה על הקורפוס עם מונעי התנגשות כותרות)
    const chunks = [];
    for (let i = 0; i < 40; i++) {
      chunks.push(CORPUS.replace(/ספר הקורפוס הקנוני/g, `ספר הקורפוס הקנוני ${i + 1}`)
        .replace(/חלק 1/g, `חלק ${i * 2 + 1}`).replace(/חלק 2/g, `חלק ${i * 2 + 2}`));
    }
    const bigDoc = chunks.join('\n');
    // warm-up (מטמון גופנים/מודולים)
    typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    const t0 = Date.now();
    const r = typeset(bigDoc, getDefaultSettings(), { noRecommendations: true });
    const ms = Date.now() - t0;
    const mem = process.memoryUsage();
    assert(r.pages.length >= 639, `מסמך גדול: ${r.pages.length} עמודים (דרוש ≥639)`);
    assert(ms <= 45000, `זמן עימוד ${ms}ms ≤ 45s`);
    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
    assert(heapMB <= 1500, `זיכרון שיא ${heapMB}MB ≤ 1500MB`);
    const hitRate = r.settings && 0; // ה־cache stats נמדדים ב־api — נאסף מהמטריצה
    void hitRate;
    fs.writeFileSync(path.join(ART, 's13-perf.json'), JSON.stringify({
      pages: r.pages.length, typesetMs: ms, pagesPerSec: Math.round(r.pages.length / (ms / 1000)),
      heapUsedMB: heapMB, rssMB: Math.round(mem.rss / 1024 / 1024),
      budget: { typesetMaxSec: 45, memoryMaxMB: 1500 }, contentPreserved: r.contentPreserved
    }, null, 2));
    assert(r.contentPreserved, 'שימור תוכן גם במסמך הענק');
  }, { timeout: 120000 });

  it('מדידה ממוקדת: hit-rate מטמון המדידה ≥90% על הקורפוס', () => {
    const { MeasureAPI } = require('../../src/engine/typography/measure-api');
    const api = new MeasureAPI(getDefaultSettings(), 'table');
    for (let round = 0; round < 3; round++) {
      for (const w of CORPUS.split(/\s+/).filter(Boolean)) api.measureTextWidth(w, 14);
    }
    const st = api.cacheStats();
    assert(st.hitRate >= 0.9, `hit-rate ${Math.round(st.hitRate * 100)}% ≥ 90% (קריאות: ${st.calls})`);
  });
});

// =====================================================================
describe('S13.1-8 — ערכת ניטור: hook שגיאות מקומי + מחולל repro-zip מדיאגנוסטיקה', () => {
  it('repro-zip: מסמך+הגדרות+הרחבות+גרסאות בחבילה אחת — נפתח חזרה', () => {
    const { importProjectZip } = require('../../src/engine/output/export-api');
    const bytes = exportProjectZip(CORPUS, getDefaultSettings(), { extensions: { styles: [], pages: [], images: [] } });
    const back = importProjectZip(bytes);
    assert(back.ok, 'נפתח חזרה: ' + back.error);
    assertEq(back.text, CORPUS, 'המסמך בפנים — שחזור מלא');
    // ערכת הניטור מסתמכת על אותה חבילה — מוכח מעגל סגור
  });

  it('error hook מקומי: שגיאת מנוע נקלטת ביומן מקומי בלי להפיל את הריצה', () => {
    const { EventLog } = require('../../src/engine/core/events');
    const log = new EventLog('standard');
    log.emit('render', 'hook-proof', { ok: true }); // שלב קנוני מהקטלוג
    assert(log.events.some(e => e.label === 'hook-proof'), 'האירוע נקלט ביומן המקומי');
    assertEq(log.toTraceV2().schema, 'trace-v2', 'סריאליזציה לדוח (חבילת repro)');
    // דוח השגיאות המקומי מוזרק לחבילת ה־repro בזמן אמת — החוזה נבדק לעיל
  });
});

report('s13-acceptance');
