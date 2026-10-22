/* Portfolio interactions: vanilla JS, no dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Theme ---------- */
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'light' || saved === 'dark') doc.setAttribute('data-theme', saved);

  function toggleTheme() {
    var next = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f6f7fb' : '#07080c');
    readColors();
  }
  $('#themeBtn').addEventListener('click', toggleTheme);
  /* ---------- Colour palettes ---------- */
  var PALETTES = [
    { id: 'graphite', name: 'Graphite (indigo)', sw: 'linear-gradient(90deg,#08090a 30%,#5e6ad2)' },
    { id: 'midnight', name: 'Midnight Teal', sw: 'linear-gradient(90deg,#0a192f 30%,#64ffda)' },
    { id: 'emerald', name: 'Emerald', sw: 'linear-gradient(90deg,#34d399,#2dd4bf,#a3e635)' },
    { id: 'ember', name: 'Ember', sw: 'linear-gradient(90deg,#fbbf24,#fb923c,#f43f5e)' },
    { id: 'aurora', name: 'Aurora', sw: 'linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6)' }
  ];
  var DEFAULT_PALETTE = 'graphite';
  function setPalette(id, silent) {
    if (!PALETTES.some(function (p) { return p.id === id; })) id = DEFAULT_PALETTE;
    doc.setAttribute('data-palette', id);
    if (!silent) { try { localStorage.setItem('palette', id); } catch (e) {} }
    $$('#palPop button').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-id') === id)); });
    readColors();
    var tm = $('meta[name="theme-color"]'); if (tm) tm.setAttribute('content', getComputedStyle(doc).getPropertyValue('--bg').trim());
    if (!silent) toast('Palette: ' + PALETTES.filter(function (p) { return p.id === id; })[0].name);
  }
  var palPop = $('#palPop'), palBtn = $('#palBtn');
  PALETTES.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('data-id', p.id);
    b.innerHTML = '<span class="sw"></span><span></span>';
    b.firstChild.style.background = p.sw;
    b.lastChild.textContent = p.name;
    b.addEventListener('click', function () { setPalette(p.id); closePal(); });
    palPop.appendChild(b);
  });
  function closePal() { palPop.classList.remove('open'); palBtn.setAttribute('aria-expanded', 'false'); }
  palBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = palPop.classList.toggle('open');
    palBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.pal-wrap')) closePal(); });


  /* ---------- Toast ---------- */
  var toastEl = $('#toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- Preloader + hero text split ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = text[i];
      el.appendChild(s);
    }
  }
  $$('.split').forEach(splitChars);

  var started = false;
  function start() {
    if (started) return;
    started = true;
    $('#preloader').classList.add('done');
    doc.classList.add('ready');
    typeLoop();
    revealObserve();
  }
  window.addEventListener('load', function () { setTimeout(start, reduce ? 0 : 900); });
  setTimeout(start, 2500); // safety net if load is slow

  /* ---------- Typed roles ---------- */
  var roles = [
    'Software Engineer',
    'Python · FastAPI · React',
    'Distributed systems & search',
    'Observability · TraceLens'
  ];
  var typedEl = $('#typed');
  function typeLoop() {
    if (reduce) { typedEl.textContent = roles[0]; return; }
    var r = 0, c = 0, del = false;
    (function tick() {
      var word = roles[r];
      typedEl.textContent = word.slice(0, c);
      var wait = del ? 28 : 62;
      if (!del && c === word.length) { del = true; wait = 1500; }
      else if (del && c === 0) { del = false; r = (r + 1) % roles.length; wait = 350; }
      else c += del ? -1 : 1;
      setTimeout(tick, wait);
    })();
  }

  /* ---------- Scroll reveal + counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce || target === 0) { el.textContent = target.toFixed(dec) + suffix; return; }
    var t0 = null, dur = 1600;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function revealObserve() {
    var items = $$('.reveal');
    // stagger siblings
    $$('.bento, .projects, .skills, .ach, .stats').forEach(function (g) {
      $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', i * 90 + 'ms'); });
    });
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      $$('[data-count]').forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scroll progress, timeline line, nav state ---------- */
  var progress = $('#progress');
  var timeline = $('#timeline');
  var sections = $$('main section[id]');
  var navLinks = $$('#navLinks a');
  var ticking = false;
  function onScroll() {
    var h = doc.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = (window.innerHeight * 0.6 - r.top) / r.height;
      timeline.style.setProperty('--tl', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    var y = window.scrollY + window.innerHeight * 0.35, current = '';
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger'), menu = $('#navLinks');
  function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });

  /* ---------- Spotlight, tilt, magnetic ---------- */
  $$('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (finePointer && !reduce) {
    $$('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.08s linear';
        el.style.transform = 'perspective(900px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg) translateZ(6px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      });
    });
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.25;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduce) {
    var dot = $('#cursorDot'), ring = $('#cursorRing');
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      body.classList.add('has-cursor', 'cursor-on');
    }, { passive: true });
    document.addEventListener('mouseleave', function () { body.classList.remove('has-cursor'); });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest && e.target.closest('a, button, input, .chip, .tilt')) ring.classList.add('hover');
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest && e.target.closest('a, button, input, .chip, .tilt')) ring.classList.remove('hover');
    });
  }

  /* ---------- Particle network background ---------- */
  var canvas = $('#bg'), ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var pts = [], pointer = { x: -9999, y: -9999 };
  var col = { dot: '34,211,238', line: '167,139,250' };
  function hexToRgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (x) { return x + x; }).join('');
    var n = parseInt(hex, 16);
    return isNaN(n) ? '34,211,238' : ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
  }
  function readColors() {
    var cs = getComputedStyle(doc);
    col = { dot: hexToRgb(cs.getPropertyValue('--a1')), line: hexToRgb(cs.getPropertyValue('--a2')) };
  }
  var savedPal = null;
  try { savedPal = localStorage.getItem('palette'); } catch (e) {}
  setPalette(savedPal || DEFAULT_PALETTE, true);
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(110, Math.floor((W * H) / 16000));
    pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.4 + 0.6 });
    }
  }
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  resize();

  var visible = true;
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; if (visible && !reduce) draw(); });
  var raf = 0;
  function draw() {
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (!reduce) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { var f = (1 - d2 / 14000) * 0.8; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(' + col.dot + ',0.65)';
      ctx.fill();
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], ax = p.x - q.x, ay = p.y - q.y, dd = ax * ax + ay * ay;
        if (dd < 17000) {
          ctx.strokeStyle = 'rgba(' + col.line + ',' + (0.2 * (1 - dd / 17000)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    if (!reduce && visible) raf = requestAnimationFrame(draw);
  }
  draw();

  /* ---------- Skill icons (Simple Icons via CDN, monogram fallback) ---------- */
  $$('.tile').forEach(function (t, i) {
    t.style.setProperty('--n', i % 10);
    var slug = t.getAttribute('data-icon');
    if (!slug) return;
    var url = 'https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/' + slug + '.svg';
    var img = new Image();
    img.onload = function () { t.style.setProperty('--src', 'url("' + url + '")'); t.classList.add('has-icon'); };
    img.src = url; // on error the monogram stays
  });

  /* ---------- Copy email, back to top ---------- */
  $('#copyMail').addEventListener('click', function () {
    var mail = 'aryancpatel07@gmail.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mail).then(function () { toast('Email copied'); }, function () { toast(mail); });
    } else { toast(mail); }
  });
  $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Command palette (Ctrl/Cmd + K) ---------- */
  var overlay = $('#palette'), input = $('#paletteInput'), list = $('#paletteList');
  var commands = [
    { t: 'Go to About', k: '#about', go: '#about' },
    { t: 'Go to Experience', k: '#experience', go: '#experience' },
    { t: 'Go to Projects', k: '#projects', go: '#projects' },
    { t: 'Go to Skills', k: '#skills', go: '#skills' },
    { t: 'Go to Achievements', k: '#achievements', go: '#achievements' },
    { t: 'Go to Contact', k: '#contact', go: '#contact' },
    { t: 'Toggle light / dark theme', k: 'theme', run: toggleTheme },
    { t: 'Palette: Graphite (indigo)', k: 'color', run: function () { setPalette('graphite'); } },
    { t: 'Palette: Midnight Teal', k: 'color', run: function () { setPalette('midnight'); } },
    { t: 'Palette: Emerald', k: 'color', run: function () { setPalette('emerald'); } },
    { t: 'Palette: Ember', k: 'color', run: function () { setPalette('ember'); } },
    { t: 'Palette: Aurora', k: 'color', run: function () { setPalette('aurora'); } },
    { t: 'Download resume', k: 'pdf', run: function () { window.location.href = 'assets/resume/Aryan_Patel_Resume.pdf'; } },
    { t: 'Open GitHub', k: 'github', run: function () { window.open('https://github.com/Aryan071', '_blank', 'noopener'); } },
    { t: 'Open LinkedIn', k: 'linkedin', run: function () { window.open('https://linkedin.com/in/aryan-patel-4272191a4/', '_blank', 'noopener'); } },
    { t: 'Copy email', k: 'mail', run: function () { $('#copyMail').click(); } }
  ];
  var shown = [], sel = 0, lastFocus = null;
  function render(q) {
    q = (q || '').toLowerCase();
    shown = commands.filter(function (c) { return !q || c.t.toLowerCase().indexOf(q) > -1 || c.k.indexOf(q) > -1; });
    sel = 0;
    list.innerHTML = '';
    shown.forEach(function (c, i) {
      var li = document.createElement('li');
      if (i === 0) li.className = 'sel';
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span></span><small></small>';
      b.firstChild.textContent = c.t;
      b.lastChild.textContent = c.k;
      b.addEventListener('click', function () { run(c); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }
  function mark() { $$('li', list).forEach(function (li, i) { li.classList.toggle('sel', i === sel); }); var s = $('li.sel', list); if (s) s.scrollIntoView({ block: 'nearest' }); }
  function openPalette() { lastFocus = document.activeElement; overlay.hidden = false; input.value = ''; render(''); input.focus(); }
  function closePalette() { overlay.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function run(c) { closePalette(); if (c.go) { var t = $(c.go); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } else if (c.run) c.run(); }
  $('#paletteBtn').addEventListener('click', openPalette);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closePalette(); });
  input.addEventListener('input', function () { render(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, shown.length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
    else if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); run(shown[sel]); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? openPalette() : closePalette(); }
    else if (e.key === 'Escape') { if (!overlay.hidden) closePalette(); closeMenu(); closePal(); }
  });

  // No-JS safety: if the observer never fires (very old browsers), show everything.
  if (reduce) { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }
})();
