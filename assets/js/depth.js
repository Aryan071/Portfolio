/* Depth effects (no extra libraries):
   A) case-study architecture diagrams sit on a layered 3D plane that tilts gently with the pointer;
   D) quiet scroll parallax: background glows and section headings drift at different speeds.
   Everything stays off for reduced-motion users and in lighter-effects mode. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverOK = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function off() { return reduce || doc.classList.contains('lite'); }

  /* ---------- A) 3D diagram plane ---------- */
  var content = document.querySelector('.cs-content');
  if (content && hoverOK && !reduce) {
    var wrap = null, rx = 4, ry = -4, trx = 4, try_ = -4, raf = 0;
    function apply() {
      raf = 0;
      rx += (trx - rx) * 0.16; ry += (try_ - ry) * 0.16;
      if (wrap) wrap.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      if (Math.abs(trx - rx) > 0.02 || Math.abs(try_ - ry) > 0.02) raf = requestAnimationFrame(apply);
    }
    function aim(x, y) { trx = x; try_ = y; if (!raf) raf = requestAnimationFrame(apply); }

    new MutationObserver(function () {
      var svg = content.querySelector('svg.dg');
      if (!svg || svg.parentNode.classList.contains('dg3d') || off()) return;
      var stage = document.createElement('div'); stage.className = 'dg-stage';
      wrap = document.createElement('div'); wrap.className = 'dg3d';
      svg.parentNode.insertBefore(stage, svg); stage.appendChild(wrap); wrap.appendChild(svg);
      rx = 4; ry = -4; aim(4, -4);
      stage.addEventListener('pointermove', function (e) {
        var b = stage.getBoundingClientRect();
        var dx = (e.clientX - b.left) / b.width - 0.5, dy = (e.clientY - b.top) / b.height - 0.5;
        aim(-dy * 10, dx * 14);
      });
      stage.addEventListener('pointerleave', function () { aim(4, -4); });
    }).observe(content, { childList: true });
  }

  /* ---------- D) scroll parallax ---------- */
  if (reduce) return;
  var blobs = [].slice.call(document.querySelectorAll('.aurora i'));
  var heads = [].slice.call(document.querySelectorAll('.sec-head')).map(function (h) {
    return { box: h, h2: h.querySelector('h2'), p: h.querySelector('p') };
  });
  var queued = false;
  function clamp(v, m) { return Math.max(-m, Math.min(m, v)); }
  function update() {
    queued = false;
    var vh = window.innerHeight, y = window.scrollY;
    if (off()) { blobs.forEach(function (b) { b.style.translate = ''; }); heads.forEach(function (h) { if (h.h2) h.h2.style.translate = ''; if (h.p) h.p.style.translate = ''; }); return; }
    blobs.forEach(function (b, i) { b.style.translate = '0 ' + (-y * (0.04 + i * 0.035)).toFixed(1) + 'px'; });
    heads.forEach(function (h) {
      var r = h.box.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var d = r.top + r.height / 2 - vh / 2;
      if (h.h2) h.h2.style.translate = '0 ' + clamp(d * -0.035, 14).toFixed(1) + 'px';
      if (h.p) h.p.style.translate = '0 ' + clamp(d * -0.05, 16).toFixed(1) + 'px';
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  new MutationObserver(queue).observe(doc, { attributes: true, attributeFilter: ['class'] });
  update();
})();
