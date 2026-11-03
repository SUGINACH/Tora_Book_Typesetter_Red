// tests/e2e/pdf-targets.test.js — 03.11 חיזוק ביקורת: יעדי סימניות/קישורי TOC בפועל + סדר מילים
'use strict';

/**
 * הביקורת החיצונית (03.11) קבעה: ספירת קישורים/סימניות אינה הוכחה — צריך לאמת
 * שכל הפניה מצביעה לעמוד הנכון, ושהטקסט החלוץ מה-PDF משמר את סדר המילים.
 * הבדיקה מפרקת את ה-PDF עצמו (Kids/Annots/Outlines) ומשווה לנתוני העימוד.
 */

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { exportPdf } = require('../../src/engine/output/export-api');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);
const HAS_PDFTOTEXT = (() => { try { return !spawnSync('pdftotext', ['-v'], { stdio: 'ignore' }).error; } catch (e) { return false; } })();

const CORPUS = [
  'ספר - ספר יעדי הקישורים',
  '',
  'כותרת 1 - חלק ראשון',
  'כותרת 2 - סימן א',
  'פסקה ראשונה של סימן א עם מספר מילים למילוי שורות אחדות בעמוד.',
  'פסקה שנייה עם עוד מילים למילוי נפח כדי שהסימן הבא ייפול בעמוד הבא.',
  'כותרת 2 - סימן ב',
  'פסקה של סימן ב עם מילים אחרות לחלוטין כדי להבדיל בין העמודים בחילוץ.',
  'עוד פסקה לסימן ב עם תוכן ייחודי מילת זיהוי אחת שתיים שלוש.',
  'כותרת 1 - חלק שני',
  'כותרת 2 - סימן ג',
  'פסקת חלק שני עם מילות זיהוי ארבע חמש שש לבדיקת סדר החילוץ.'
].join('\n');

/** מפה: מזהה אובייקט עמוד ⇒ אינדקס (לפי סדר ב-Kids). */
function pageIdToIndex(pdfText) {
  const kids = pdfText.match(/\/Kids \[([^\]]+)\]/);
  assert(kids, 'Kids array found');
  const ids = [...kids[1].matchAll(/(\d+) 0 R/g)].map(m => Number(m[1]));
  const map = new Map();
  ids.forEach((id, i) => map.set(id, i));
  return map;
}

/** יעדי סימניות מהקובץ — לפי סדר הופעה (הזמנת flatOrder). הכותרת נכתבת כ-hex. */
function outlineDests(pdfText) {
  return [...pdfText.matchAll(/\/Title (<[0-9A-Fa-f]*>|\([^)]*\))[\s\S]{0,220}?\/Dest \[(\d+) 0 R/g)].map(m => Number(m[2]));
}

/** יעדי קישורי TOC מהקובץ — לפי סדר הפריסה (הזמנת tocLinks). */
function linkDests(pdfText) {
  return [...pdfText.matchAll(/\/Subtype \/Link[\s\S]{0,160}?\/Dest \[(\d+) 0 R/g)].map(m => Number(m[1]));
}

function pdftotextArgs(args) {
  return spawnSync('pdftotext', args, { encoding: 'utf8' });
}

describe('03.11 — יעדי PDF בפועל (לא רק ספירה)', () => {
  const res = (() => {
    if (!HAS_DEJAVU) return null;
    return exportPdf(CORPUS, getDefaultSettings(), fs.readFileSync(DEJAVU));
  })();
  const TMP_PDF = path.join('/tmp', 'tora-pdf-targets.pdf');
  if (res && res.ok) fs.writeFileSync(TMP_PDF, res.bytes);

  it('הייצוא הצליח עם סימניות וקישורים', () => {
    if (!HAS_DEJAVU) { console.log('  (DejaVu לא זמין — דילוג מתועד)'); return; }
    assert(res.ok, 'export ok: ' + res.error);
    assert(res.info.outlineItems.length >= 4, `לפחות 4 סימניות (קיבלנו ${res.info.outlineItems.length})`);
  });

  it('כל סימנייה מצביעה לעמוד שבו הכותרת מופיעה בפועל (יעד אמת)', () => {
    if (!HAS_DEJAVU || !HAS_PDFTOTEXT) { console.log('  (דילוג — כלי לא זמין)'); return; }
    const pdfText = res.bytes.toString('latin1');
    const idToIdx = pageIdToIndex(pdfText);
    const dests = outlineDests(pdfText);
    assertEq(dests.length, res.info.outlineItems.length, 'מספר יעדי הסימניות בקובץ שווה למודל');
    for (let i = 0; i < res.info.outlineItems.length; i++) {
      const item = res.info.outlineItems[i];
      const pdfPage = idToIdx.get(dests[i]);
      assertEq(pdfPage, item.page, `סימנייה «${item.title}»: היעד בקובץ שווה למודל`);
      // אמת-על: הכותרת באמת נמצאת בעמוד היעד (חילוץ טקסט אמיתי מ-Poppler)
      const out = pdftotextArgs(['-f', String(item.page + 1), '-l', String(item.page + 1), TMP_PDF, '-']);
      const pageText = out.stdout || '';
      const words = item.title.split(/\s+/).filter(w => w.length > 1);
      const found = words.every(w => pageText.includes(w));
      assert(found, `סימנייה «${item.title}»: הכותרת מופיעה בעמוד היעד ${item.page + 1} (חילוץ)`);
    }
  });

  it('קישורי תוכן העניינים מצביעים לעמודי היעד הנכונים (רצף מלא)', () => {
    if (!HAS_DEJAVU || !HAS_PDFTOTEXT) { console.log('  (דילוג — כלי לא זמין)'); return; }
    const pdfText = res.bytes.toString('latin1');
    const idToIdx = pageIdToIndex(pdfText);
    const dests = linkDests(pdfText);
    const expected = res.info.tocLinkTargets;
    assertEq(dests.length, expected.length, `מספר הקישורים בקובץ (${dests.length}) שווה למודל (${expected.length})`);
    for (let i = 0; i < expected.length; i++) {
      const pdfPage = idToIdx.get(dests[i]);
      assertEq(pdfPage, expected[i], `קישור ${i + 1}: היעד בקובץ שווה ליעד המודל`);
    }
  });

  it('סדר המילים בחילוץ ה-PDF נשמר (לא רק אוסף תווים)', () => {
    if (!HAS_DEJAVU || !HAS_PDFTOTEXT) { console.log('  (דילוג — כלי לא זמין)'); return; }
    const out = pdftotextArgs([TMP_PDF, '-']);
    const extracted = (out.stdout || '').replace(/[\u200e\u200f]/g, '');
    // מילות זיהוי שהושתלו במסמך בסדר מכוון — חייבות להופיע באותו סדר בחילוץ
    const markers = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש'];
    let last = -1;
    for (const m of markers) {
      const at = extracted.indexOf(m);
      assert(at >= 0, `המילה «${m}» קיימת בחילוץ`);
      assert(at > last, `המילה «${m}» מופיעה אחרי הקודמת (סדר נשמר)`);
      last = at;
    }
    // וכותרות בסדר: סימן א לפני סימן ב לפני סימן ג
    let prev = -1;
    for (const h of ['סימן א', 'סימן ב', 'סימן ג']) {
      const at = extracted.indexOf(h);
      assert(at >= 0, `הכותרת «${h}» בחילוץ`);
      assert(at > prev, `הכותרת «${h}» אחרי הקודמת`);
      prev = at;
    }
  });
});

report('pdf-targets');
