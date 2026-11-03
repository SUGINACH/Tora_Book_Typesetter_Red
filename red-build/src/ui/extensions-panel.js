// src/ui/extensions-panel.js — סקציית הרחבות מסמך (S11.1-1, §8.3 import/export/share)
'use strict';

/**
 * פאנל הרחבות ברמת המסמך (מנותק מ־12 פאנלי הרישום — אלו נכסי מסמך, לא הגדרות מנוע).
 * ייבוא חבילה (JSON) / ייצוא / שיתוף — כולל הצגת שגיאות האימות העבריות של המנוע.
 * אין עימוד אוטומטי משינוי הרחבות (F-06): השינוי מסומן ככבד — ⚡ בלבד.
 */

const { importExtensions, exportExtensions, shareSummary } = require('../engine/extensions/extensions-io');

function buildExtensionsPanel(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'extensions-panel';
  root.setAttribute('aria-label', 'הרחבות מסמך — סגנונות מותאמים, עמודים ותמונות');

  const title = doc.createElement('h3');
  title.className = 'extensions-title';
  title.textContent = 'הרחבות מסמך (סגנונות מותאמים · עמודים · תמונות)';
  root.appendChild(title);

  const desc = doc.createElement('p');
  desc.className = 'extensions-desc';
  desc.textContent = 'חבילת JSON: סגנונות טקסט מותאמים (טריגר, מצב פריסה, מונה, עיטורים מקושרים), עמודים מותאמים ותמונות מוטמעות. שינוי הרחבות דורש ⚡ — אין עימוד אוטומטי.';
  root.appendChild(desc);

  // ---- סרגל פעולות ----
  const bar = doc.createElement('div');
  bar.className = 'extensions-bar';
  const btnImport = doc.createElement('button');
  btnImport.type = 'button'; btnImport.className = 'btn';
  btnImport.textContent = '⬆ ייבוא חבילה';
  btnImport.setAttribute('aria-label', 'ייבוא חבילת הרחבות מקובץ JSON');
  btnImport.addEventListener('click', () => opts.onRequestImport && opts.onRequestImport());
  const btnExport = doc.createElement('button');
  btnExport.type = 'button'; btnExport.className = 'btn';
  btnExport.textContent = '⬇ ייצוא חבילה';
  btnExport.setAttribute('aria-label', 'ייצוא חבילת ההרחבות הפעילה');
  btnExport.addEventListener('click', () => opts.onExport && opts.onExport());
  const btnShare = doc.createElement('button');
  btnShare.type = 'button'; btnShare.className = 'btn btn--ghost';
  btnShare.textContent = '🔗 תקציר לשיתוף';
  btnShare.setAttribute('aria-label', 'תקציר קריא של החבילה הפעילה');
  btnShare.addEventListener('click', () => opts.onShare && opts.onShare());
  const btnClear = doc.createElement('button');
  btnClear.type = 'button'; btnClear.className = 'btn btn--ghost';
  btnClear.textContent = '🗑 נקה הרחבות';
  btnClear.addEventListener('click', () => setBundle(null, 'ההרחבות הוסרו. עימוד מחדש דורש ⚡.'));
  bar.appendChild(btnImport); bar.appendChild(btnExport); bar.appendChild(btnShare); bar.appendChild(btnClear);
  root.appendChild(bar);

  // ---- הודעות (הצלחה/שגיאות אימות עבריות) ----
  const msg = doc.createElement('div');
  msg.className = 'extensions-msg';
  msg.setAttribute('role', 'status');
  msg.setAttribute('aria-live', 'polite');
  root.appendChild(msg);

  const errList = doc.createElement('ul');
  errList.className = 'extensions-errors';
  errList.setAttribute('role', 'alert');
  root.appendChild(errList);

  // ---- רשימת סגנונות פעילים ----
  const active = doc.createElement('div');
  active.className = 'extensions-active';
  root.appendChild(active);

  let current = null; // {styles, pages, images} מנורמלים או null

  /** קביעת חבילה פעילה (מייבוא או ניקוי) + עדכון תצוגה + הודעה למאזין. */
  function setBundle(bundle, message, errors) {
    current = bundle;
    // הודעה ראשית
    msg.textContent = message || '';
    msg.classList.toggle('extensions-msg--error', !!(errors && errors.length));
    // שגיאות אימות (עברית, מפורטות)
    errList.textContent = '';
    for (const e of errors || []) {
      const li = doc.createElement('li');
      li.className = 'extensions-error-item';
      li.textContent = e && e.message ? e.message : String(e);
      errList.appendChild(li);
    }
    // רשימת סגנונות פעילים
    active.textContent = '';
    if (bundle) {
      const head = doc.createElement('div');
      head.className = 'extensions-active-head';
      head.textContent = `פעיל: ${bundle.styles.length} סגנונות · ${bundle.pages.length} עמודים · ${bundle.images.length} תמונות`;
      active.appendChild(head);
      for (const st of bundle.styles) {
        const row = doc.createElement('div');
        row.className = 'extensions-style-row';
        const modeHe = {
          'regular': 'רגיל', 'full-width': 'רוחב מלא', 'side-note': 'הערת צד',
          'footnote': 'הערת שוליים', 'endnote': 'הערת סיום', 'new-location': 'מיקום חדש'
        }[st.layoutMode] || st.layoutMode;
        row.textContent = `«${st.name}» — ${modeHe}${st.counter && st.counter.enabled ? ' · מונה' : ''}${st.linkedOrnaments ? ' · עיטורים' : ''}`;
        active.appendChild(row);
      }
    } else {
      const none = doc.createElement('div');
      none.className = 'extensions-active-head';
      none.textContent = 'אין הרחבות פעילות.';
      active.appendChild(none);
    }
    opts.onBundleChange && opts.onBundleChange(current);
  }

  /** ייבוא מתוכן קובץ (טקסט JSON) — ההמרה עצמה ב־extensions-io (מקור יחיד). */
  function importFromText(jsonText, fileNameForMessage) {
    const res = importExtensions(jsonText);
    if (res.ok) {
      setBundle(res, `החבילה נטענה${fileNameForMessage ? ` («${fileNameForMessage}»)` : ''}: ${res.summary} עימוד מחדש דורש ⚡.`);
    } else {
      setBundle(null, `הייבוא נכשל — הקובץ לא נטען. ${res.summary}`, res.errors);
    }
    return res.ok;
  }

  /** ייצוא לטקסט JSON (דטרמיניסטי). */
  function exportText() {
    return exportExtensions(current || { styles: [], pages: [], images: [] });
  }

  /** תקציר קריא לשיתוף. */
  function shareText() {
    return shareSummary(current || { styles: [], pages: [], images: [] });
  }

  setBundle(null, '');

  return { root, importFromText, exportText, shareText, setBundle, getBundle: () => current };
}

module.exports = { buildExtensionsPanel };
