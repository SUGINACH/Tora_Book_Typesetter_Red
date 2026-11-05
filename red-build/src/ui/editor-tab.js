// src/ui/editor-tab.js — לשונית העורך (REQ-UI-04: הדבקה, מונים, ⏎ לא מיוצא, ייבוא, ניקוי)
'use strict';

/**
 * F-01 (שיעור היצוא): סמני שבירת־עמוד ⏎ הם אלמנטים חיצוניים ל־textarea —
 * לעולם לא חלק מהטקסט. getText() מחזיר את תוכן ה־textarea כמו שהוא; הבדיקה
 * מוכיחה שזהה־בתים למקור שהודבק (proof: markers never exported).
 *
 * DOCX: מנוע הייבוא נבנה ב־S11 — הכפתור קיים אך נעול (UI stub guarded, §9.4:
 * בלי חלונות שגיאה אוטומטיים — הודעה עברית ברורה בלבד).
 */

const { toHebrewNumber } = require('../engine/decoration/folio');

function buildEditorTab(doc, opts) {
  const root = doc.createElement('section');
  root.className = 'tab-panel';
  root.setAttribute('role', 'tabpanel');
  root.dataset.tab = 'editor';

  // ---- אזור ההדבקה ----
  const area = doc.createElement('textarea');
  area.className = 'editor-area';
  area.setAttribute('aria-label', 'אזור הדבקת טקסט פשוט');
  area.setAttribute('placeholder', 'הדבק כאן טקסט פשוט… (כותרת N - טקסט, [הערות בסוגריים], הערת סיום - טקסט)');
  root.appendChild(area);

  // ---- סרגל פעולות ----
  const bar = doc.createElement('div');
  bar.className = 'editor-bar';
  const btnTxt = doc.createElement('button');
  btnTxt.type = 'button'; btnTxt.className = 'btn'; btnTxt.textContent = '📄 ייבוא TXT';
  btnTxt.setAttribute('aria-label', 'ייבוא קובץ טקסט');
  btnTxt.addEventListener('click', () => opts.onImportTxt && opts.onImportTxt());
  const btnDocx = doc.createElement('button');
  btnDocx.type = 'button'; btnDocx.className = 'btn'; btnDocx.textContent = '📝 ייבוא DOCX';
  btnDocx.setAttribute('aria-label', 'ייבוא מסמך וורד');
  btnDocx.title = 'ייבוא DOCX: כותרות וורד → כותרות המנוע; הערות וורד → הערות סוגריים; פסקאות → טקסט';
  btnDocx.addEventListener('click', () => opts.onImportDocx && opts.onImportDocx()); // **S11:** נפתח — המנוע נבנה
  const btnClear = doc.createElement('button');
  btnClear.type = 'button'; btnClear.className = 'btn btn--ghost'; btnClear.textContent = '🗑 נקה';
  btnClear.setAttribute('aria-label', 'ניקוי העורך');
  btnClear.addEventListener('click', () => opts.onClearDocument && opts.onClearDocument());
  bar.appendChild(btnTxt); bar.appendChild(btnDocx); bar.appendChild(btnClear);
  root.appendChild(bar);

  // ---- מונים (תווים/מילים/שורות/פסקאות) — חי ----
  const counters = doc.createElement('div');
  counters.className = 'editor-counters';
  counters.setAttribute('aria-live', 'polite');
  root.appendChild(counters);

  function updateCounters() {
    const t = area.value || '';
    const words = t.split(/\s+/).filter(Boolean).length;
    const lines = t === '' ? 0 : t.split('\n').length;
    const paras = t.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    counters.textContent = `תווים: ${t.length} · מילים: ${words} · שורות: ${lines} · פסקאות: ${paras}`;
  }

  // ---- סמני שבירת עמודים (⏎) — תצוגה בלבד, מחוץ לטקסט (F-01) ----
  const markers = doc.createElement('div');
  markers.className = 'editor-markers';
  markers.setAttribute('aria-label', 'מפת שבירת עמודים');
  const markersTitle = doc.createElement('div');
  markersTitle.className = 'editor-markers-title';
  markersTitle.textContent = 'מפת שבירות עמודים (⏎ — לתצוגה בלבד, לעולם לא מיוצא)';
  markers.appendChild(markersTitle);
  const markersList = doc.createElement('ul');
  markersList.className = 'editor-markers-list';
  markers.appendChild(markersList);
  root.appendChild(markers);

  let lastBreaks = [];

  /** עדכון מפת השבירות מתוצאת העימוד: [{tokenIndex, pageIndex, firstWord}] */
  function setPageBreaks(breaks) {
    lastBreaks = breaks || [];
    markersList.textContent = '';
    for (const b of lastBreaks) {
      const li = doc.createElement('li');
      li.className = 'marker-item';
      li.dataset.pageIndex = String(b.pageIndex);
      li.textContent = `⏎ → עמוד ${toHebrewNumber(b.pageIndex + 1)}${b.firstWord ? ` — «${b.firstWord}»` : ''}`;
      li.addEventListener('click', () => opts.onJumpToPage && opts.onJumpToPage(b.pageIndex));
      markersList.appendChild(li);
    }
  }

  // ---- אירועי טקסט ----
  // הקלדה ⇒ סימון המתנה בלבד (⚡ יהבהב) — אין עימוד אוטומטי (F-06).
  area.addEventListener('input', () => {
    updateCounters();
    opts.onTextChange && opts.onTextChange(area.value);
  });
  // הדבקה = פעולת מסמך מפורשת ⇒ נתיב מיידי (REQ-UI-03: progress מוצג)
  area.addEventListener('paste', (ev) => {
    const data = ev && ev.clipboardData && typeof ev.clipboardData.getData === 'function'
      ? ev.clipboardData.getData('text/plain')
      : (ev && ev.text != null ? ev.text : null);
    // **S5.2 (11):** הדבקה ריקה (רווחים בלבד) עברה את השומה data != null ומחקה
    // את המסמך כולו ללא אישור. פעולת ניקוי מכוונת קיימת (🗑) — הדבקה ריקה אינה נכשלת בשקט.
    if (data != null && String(data).trim() !== '') {
      if (ev && ev.preventDefault) ev.preventDefault();
      opts.onDocumentAction && opts.onDocumentAction('paste', String(data));
    }
  });
  // מעקב סמן — כיוון א׳ של הסנכרון (REQ-UI-05)
  const fireCaret = () => opts.onCaretMove && opts.onCaretMove(area.selectionStart != null ? area.selectionStart : 0);
  area.addEventListener('click', fireCaret);
  area.addEventListener('keyup', fireCaret);
  area.addEventListener('select', fireCaret);

  /** כיוון ב׳ של הסנכרון: מיקום הסמן מהעמוד שנלחץ (בלי החלפת טאב) */
  function setCaret(charIndex) {
    if (area.setSelectionRange) area.setSelectionRange(charIndex, charIndex);
    else area.selectionStart = area.selectionEnd = charIndex;
    fireCaret();
  }

  function setText(text) {
    area.value = String(text != null ? text : '');
    updateCounters();
  }
  function getText() { return area.value; } // מקור נקי — סמנים אינם חלק ממנו (F-01)

  setText('');
  return { root, setText, getText, setPageBreaks, updateCounters, setCaret, textarea: area, docxButton: btnDocx };
}

module.exports = { buildEditorTab };
