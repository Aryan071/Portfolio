/* Shared by sub-pages: apply saved theme and palette (same keys as the main site). */
(function () {
  var d = document.documentElement;
  try {
    var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t);
    var p = localStorage.getItem('palette'); if (p) d.setAttribute('data-palette', p);
  } catch (e) {}
})();
