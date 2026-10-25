/* Hero 3D scene: wireframe core, orbit rings and a particle shell (Three.js, loaded on demand).
   Skipped for reduced-motion users; pauses off-screen, in lighter-effects mode and in background tabs. */
(function () {
  var doc = document.documentElement;
  var hero = document.getElementById('home');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var booted = false;
  function boot() {
    if (booted || doc.classList.contains('lite')) return;
    booted = true; obs.disconnect();
    if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1200);
  }
  // wait until the page has loaded; skipped (until switched on) in lighter-effects mode, which phones start in
  var obs = new MutationObserver(boot);
  obs.observe(doc, { attributes: true, attributeFilter: ['class'] });
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);

  function start() {
  var canvas = document.createElement('canvas');
  canvas.id = 'hero3d';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js').then(function (T) {
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch (e) { canvas.remove(); return; }

    var small = window.innerWidth < 720;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5));
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 7;

    var rig = new T.Group(); scene.add(rig);
    var spin = new T.Group(); rig.add(spin);

    function mat(opacity) { return new T.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: opacity, depthWrite: false }); }
    var core = new T.Mesh(new T.IcosahedronGeometry(1.15, 1), mat(0.75)); spin.add(core);
    var inner = new T.Mesh(new T.OctahedronGeometry(0.55, 0), mat(0.9)); spin.add(inner);

    var ringA = new T.Mesh(new T.TorusGeometry(1.9, 0.012, 8, 120), new T.MeshBasicMaterial({ transparent: true, opacity: 0.9 }));
    var ringB = new T.Mesh(new T.TorusGeometry(2.35, 0.01, 8, 140), new T.MeshBasicMaterial({ transparent: true, opacity: 0.65 }));
    ringA.rotation.x = Math.PI / 2.4; ringB.rotation.set(Math.PI / 3, 0.6, 0);
    spin.add(ringA, ringB);

    // Orbiting nodes ride on the rings
    var nodeGeo = new T.SphereGeometry(0.075, 12, 12);
    var nodes = [];
    [[ringA, 1.9, 0], [ringA, 1.9, 2.1], [ringB, 2.35, 1], [ringB, 2.35, 3.6], [ringB, 2.35, 5.2]].forEach(function (d, i) {
      var m = new T.Mesh(nodeGeo, new T.MeshBasicMaterial({ transparent: true, opacity: 0.95 }));
      d[0].add(m); nodes.push({ m: m, r: d[1], p: d[2], s: 0.35 + i * 0.07 });
    });

    // Particle shell
    var N = small ? 160 : 360, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 2.7 + Math.random() * 1.1, s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th); pos[i * 3 + 1] = r * u; pos[i * 3 + 2] = r * s * Math.sin(th);
    }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var pm = new T.PointsMaterial({ size: 0.035, transparent: true, opacity: 0.8, depthWrite: false });
    var points = new T.Points(pg, pm); spin.add(points);

    function css(n) { return getComputedStyle(doc).getPropertyValue(n).trim() || '#5e6ad2'; }
    function colours() {
      var a1 = css('--a1'), a2 = css('--a2'), a3 = css('--a3');
      core.material.color.set(a2); inner.material.color.set(a1);
      ringA.material.color.set(a1); ringB.material.color.set(a3);
      pm.color.set(a2);
      nodes.forEach(function (n, i) { n.m.material.color.set(i % 2 ? a3 : a1); });
    }
    colours();
    new MutationObserver(colours).observe(doc, { attributes: true, attributeFilter: ['data-palette', 'data-theme'] });

    var card = hero.querySelector('.hero-card');
    var halfH = 7 * Math.tan(T.MathUtils.degToRad(22.5));
    function resize() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      var hr = hero.getBoundingClientRect(), cr = card ? card.getBoundingClientRect() : null;
      var cx = cr ? cr.left + cr.width / 2 - hr.left : w * 0.72, cy = cr ? cr.top + cr.height / 2 - hr.top : h * 0.5;
      var size = cr ? Math.max(cr.width, cr.height) * 0.8 : Math.min(w, h) * 0.4;
      rig.position.set((cx / w * 2 - 1) * halfH * camera.aspect, -(cy / h * 2 - 1) * halfH, 0);
      rig.scale.setScalar(Math.max(0.35, size / h * 2 * halfH / 2.4));
    }
    resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(hero);

    var mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth * 2 - 1; ty = e.clientY / window.innerHeight * 2 - 1; }, { passive: true });

    var visible = true, running = false, last = 0;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(hero);
    document.addEventListener('visibilitychange', kick);
    new MutationObserver(kick).observe(doc, { attributes: true, attributeFilter: ['class'] });

    function active() { return visible && !document.hidden && !doc.classList.contains('lite') && !doc.classList.contains('overlay-open'); }
    function frame(ts) {
      if (!active()) { running = false; return; }
      var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      spin.rotation.y += dt * 0.22; spin.rotation.x = Math.sin(ts / 4000) * 0.15;
      core.rotation.y -= dt * 0.35; inner.rotation.x += dt * 0.9; inner.rotation.y += dt * 0.6;
      ringA.rotation.z += dt * 0.12; ringB.rotation.z -= dt * 0.09;
      points.rotation.y += dt * 0.05;
      nodes.forEach(function (n) { n.p += dt * n.s; n.m.position.set(Math.cos(n.p) * n.r, Math.sin(n.p) * n.r, 0); });
      var sy = Math.min(window.scrollY / Math.max(hero.clientHeight, 1), 1);
      rig.rotation.y = mx * 0.45 + sy * 1.2; rig.rotation.x = my * 0.3 - sy * 0.4;
      rig.children[0].position.y = -sy * 0.6;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    function kick() {
      canvas.style.visibility = doc.classList.contains('lite') ? 'hidden' : 'visible';
      if (active() && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    }
    kick();
    requestAnimationFrame(function () { canvas.classList.add('on'); });
  }).catch(function () { canvas.remove(); });
  }
})();
