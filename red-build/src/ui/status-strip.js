// src/ui/status-strip.js — פס מצב ואזהרות (S10.1-6: המתנה, שומר־נתק, גופנים, מנוע)
'use strict';

/**
 * רצועת מצב עליונה: מצב מנוע + התקדמות ("עמוד X מתוך Y"), מחוון שינויים
 * ממתינים (קלים/כבדים), כפתור ⚡ מהבהב (כבדים — F-06), שומר נתק־מהרשת,
 * מצב טעינת גופנים. נגישות: aria-live להתקדמות; הכפתור עם תווית מלאה.
 */

function buildStatusStrip(doc, opts) {
  const root = doc.createElement('div');
  root.className = 'status-strip';
  root.setAttribute('role', 'status');

  // ---- מצב מנוע + התקדמות ----
  const engine = doc.createElement('span');
  engine.className = 'chip chip--engine';
  engine.setAttribute('aria-live', 'polite');
  engine.textContent = '⏳ מנוע: פנוי';

  const progress = doc.createElement('span');
  progress.className = 'chip chip--progress';
  progress.setAttribute('aria-live', 'polite');
  progress.textContent = '';

  // ---- שינויים ממתינים + ⚡ ----
  const pending = doc.createElement('span');
  pending.className = 'chip chip--pending';
  pending.textContent = 'אין שינויים ממתינים';

  const bolt = doc.createElement('button');
  bolt.type = 'button';
  bolt.className = 'btn btn--bolt';
  bolt.textContent = '⚡ עדכן ועמד מחדש';
  bolt.setAttribute('aria-label', 'עדכן ועמד מחדש — נתיב מיידי בלי השהיה');
  bolt.title = 'שינויים כבדים ממתינים — לחיצה מריצה עימוד מלא מיידי (בלי debounce)';
  bolt.addEventListener('click', () => opts.onExplicitRetypeset && opts.onExplicitRetypeset());
  let blinking = false;

  // ---- שומר נתק־מהרשת ----
  const offline = doc.createElement('span');
  offline.className = 'chip chip--offline';
  offline.textContent = '🔌 שומר נתק: פעיל';

  // ---- גופנים ----
  const fonts = doc.createElement('span');
  fonts.className = 'chip chip--fonts';
  fonts.textContent = '🔤 גופנים: מוכנים';

  // ---- עמודים ----
  const pages = doc.createElement('span');
  pages.className = 'chip chip--pages';
  pages.textContent = '📄 0 עמודים';

  for (const el of [engine, progress, pending, bolt, offline, fonts, pages]) root.appendChild(el);

  return {
    root, bolt,
    setEngineState(state, info) {
      if (state === 'working') {
        engine.textContent = '⚙️ מנוע: עמל…';
        progress.textContent = info && info.label ? info.label : '';
      } else if (state === 'error') {
        engine.textContent = '❌ מנוע: שגיאה';
        progress.textContent = (info && info.message) || '';
      } else {
        engine.textContent = '⏳ מנוע: פנוי';
        progress.textContent = '';
      }
    },
    setPending({ light, heavy }) {
      const parts = [];
      if (light) parts.push('קלים (רינדור בקרוב)');
      if (heavy) parts.push('כבדים — נדרש ⚡');
      pending.textContent = parts.length ? `⏳ שינויים ממתינים: ${parts.join(' · ')}` : 'אין שינויים ממתינים';
      this.setBlink(!!heavy);
    },
    setBlink(on) {
      blinking = on;
      bolt.classList.toggle('blink', on);
      bolt.setAttribute('aria-live', on ? 'assertive' : 'off');
    },
    getBlink() { return blinking; },
    setOffline(active) {
      offline.textContent = active ? '🔌 שומר נתק: פעיל' : '⚠️ שומר נתק: כבוי';
      offline.classList.toggle('chip--warn', !active);
    },
    setFonts(status) {
      const map = { loading: '🔤 גופנים: נטענים…', ready: '🔤 גופנים: מוכנים', error: '🔤 גופנים: שגיאת טעינה' };
      fonts.textContent = map[status] || map.ready;
    },
    setPages(n) { pages.textContent = `📄 ${n} עמודים`; }
  };
}

module.exports = { buildStatusStrip };
