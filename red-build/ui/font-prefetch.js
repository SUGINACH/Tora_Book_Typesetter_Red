// ui/font-prefetch.js — Agent 3: שליפה מקדימה (best-effort) של גופני העלייה, מיד אחרי שה-bundle נטען.
// למה: בטעינה ראשונה מארוח מרוחק, 12 הגופנים נשלפים בסדרה (await לכל משפחה) מאחורי הקטלוגים וההגדרות.
//   מדידה (tools/perf/browser-boot.js, HeadlessChrome 153, vCPU יחיד; חציון של 3 ריצות; main@6f80156):
//   RTT 50ms/20Mbps — "גופנים מוכנים" 2.7s → 1.6s (−42%); RTT 150ms/5Mbps — 7.7s → 4.2s (−46%); FCP/load ללא שינוי מובהק.
//   בשרת מקומי אין תועלת (−4%) ולכן מדולג.
// מה לא משתנה: סדר ותוכן הרישום ב-Worker, ה-parser, המדידה וה-layout hash. loadFont ממשיך לשלוף את אותו URL בדיוק
//   ופוגע במטמון ה-HTTP; הוכחה: tests/unit/font-prefetch.test.js (רצף registerFont ובתים זהים עם/בלי שליפה).
// cache:'force-cache' — במטמון פג-תוקף אין בקשות מיותרות (הקריאה האמיתית של loadFont מאמתת מחדש כרגיל).
// הרשימה נבדקת מול ברירות המחדל בבדיקה הנ"ל; אם התיישנה — נפגעים הביצועים בלבד, לא הנכונות.
(function (root) {
  'use strict';
  var BASE = 'assets/imud/fonts/';
  var FILES = [
    'Alpha-Black.ttf',
    'Alpha-Light.ttf',
    'Alpha-Regular.ttf',
    'DavidLibre-Bold.ttf',
    'DavidLibre-Regular.ttf',
    'FrankReal-Bold.ttf',
    'FrankRuhlLibre-VF.ttf',
    'Guttman-Rashi-Normal.ttf',
    'Hadassah-Friedlaender-Regular.ttf',
    'Livorna-Regular.ttf',
    'NotoSerifHebrew-VF.ttf',
    'Sgula-Regular.ttf'
  ];
  function isLoopback(h) { return !h || h === 'localhost' || h === '[::1]' || h === '::1' || /^127\./.test(h); }
  function prefetchBootFonts(env) {
    env = env || root;
    var f = env.fetch, loc = env.location, nav = env.navigator;
    if (typeof f !== 'function') return 0;
    if (loc && isLoopback(loc.hostname)) return 0; // אין RTT — אין תועלת (וגם file://)
    if (nav && nav.connection && nav.connection.saveData) return 0; // כיבוד Data Saver
    var n = 0;
    for (var i = 0; i < FILES.length; i++) {
      try {
        var p = f.call(env, BASE + FILES[i], { cache: 'force-cache' });
        if (p && typeof p.catch === 'function') p.catch(function () {});
        n++;
      } catch (e) { /* best-effort */ }
    }
    return n;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { FILES: FILES, prefetchBootFonts: prefetchBootFonts, isLoopback: isLoopback };
  else prefetchBootFonts(root);
})(typeof self !== 'undefined' ? self : this);
