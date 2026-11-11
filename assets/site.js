/* Dust Stomper — small, dependency-free. Every effect has a reduced-motion fallback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var SAVE = !!conn.saveData;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fmt(n) { return n.toLocaleString('en-US'); }

  /* ---------- 86,400: seconds left today (resets at local midnight) ---------- */
  var ringArc = $('#ringArc'), ringNum = $('#ringNum'), barTick = $('#barTick'), C = 2 * Math.PI * 150;
  if (ringArc) ringArc.style.strokeDasharray = C;
  var lastDay = null;
  function secondsLeft() {
    var now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
    var start = new Date(now); start.setHours(0, 0, 0, 0);
    var len = Math.round((mid - start) / 1000); // 86,400 most days (DST days differ)
    return { left: Math.max(0, Math.ceil((mid - now) / 1000)), len: len, now: now };
  }
  function tick() {
    var s = secondsLeft();
    if (ringNum) ringNum.textContent = fmt(s.left);
    if (barTick) barTick.textContent = fmt(s.left);
    if (ringArc) ringArc.style.strokeDashoffset = C * (1 - s.left / s.len);
    var d = s.now.toDateString();
    if (d !== lastDay) { lastDay = d; buildCalendar(); }
  }

  /* ---------- Calendar: today is all we have planned ---------- */
  var view = new Date(); view.setDate(1);
  function buildCalendar() {
    var grid = $('#calGrid'), title = $('#calTitle'); if (!grid) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var y = view.getFullYear(), m = view.getMonth();
    title.textContent = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) { return '<div class="dow" aria-hidden="true">' + d + '</div>'; }).join('');
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < first; i++) html += '<div class="d blank" aria-hidden="true"></div>';
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d), cls = 'd', label;
      if (dt.getTime() === today.getTime()) { cls += ' today'; label = 'Today, ' + dt.toDateString() + ': today is all we have planned'; }
      else if (dt < today) { cls += ' past'; label = dt.toDateString() + ': a gift already given'; }
      else { label = dt.toDateString() + ': not promised'; }
      html += '<div class="' + cls + '" role="listitem" aria-label="' + label + '" title="' + label + '">' + d + '</div>';
    }
    grid.innerHTML = html;
    var plan = $('#planDate'); if (plan) plan.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  var prev = $('#calPrev'), next = $('#calNext');
  if (prev) prev.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); buildCalendar(); });
  if (next) next.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); buildCalendar(); });
  tick(); setInterval(tick, 1000);
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Hero video: only when motion is welcome and data is not tight ---------- */
  var vid = $('#heroVideo');
  if (vid && !RM && !SAVE) {
    var src = window.innerWidth < 900 ? vid.getAttribute('data-sm') : vid.getAttribute('data-lg');
    vid.muted = true; vid.preload = 'auto'; vid.src = src;
    vid.addEventListener('playing', function () { vid.classList.add('on'); }, { once: true });
    var p = vid.play(); if (p && p.catch) p.catch(function () {});
  }

  /* ---------- Dust: golden motes, and a dust stomp wherever you tap ---------- */
  var dust = $('#dust'), hero = $('.hero');
  if (dust && hero) {
    var dx = dust.getContext('2d'), W = 0, H = 0, motes = [], puffs = [], prints = [], dustOn = true;
    function size() { W = hero.clientWidth; H = hero.clientHeight; dust.width = W * DPR; dust.height = H * DPR; dx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size(); window.addEventListener('resize', size);
    var N = RM ? 0 : Math.min(70, Math.round(W / 18));
    for (var i = 0; i < N; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4, vx: Math.random() * .25 + .05, vy: -Math.random() * .15, a: Math.random() * .6 + .2, t: Math.random() * 6 });
    var foot = new Path2D('M12 2c3 0 5 3 5 8s-1 9-1 12-2 6-4 6-4-2-4-6c0-3-1-6-1-11S9 2 12 2z');
    function stomp(x, y) {
      for (var k = 0; k < (RM ? 0 : 46); k++) {
        var ang = Math.random() * Math.PI * 2, sp = Math.random() * 2.6 + .6;
        puffs.push({ x: x, y: y, vx: Math.cos(ang) * sp * 1.4, vy: Math.sin(ang) * sp * .55 - Math.random() * 1.6, r: Math.random() * 3 + 1, life: 1 });
      }
      prints.push({ x: x, y: y, life: 1, rot: (Math.random() - .5) * .5, side: prints.length % 2 });
      if (prints.length > 14) prints.shift();
      if (RM) draw();
    }
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a,button,.hero-card')) return;
      var r = hero.getBoundingClientRect(); stomp(e.clientX - r.left, e.clientY - r.top);
    });
    function draw() {
      dx.clearRect(0, 0, W, H);
      motes.forEach(function (m) {
        m.t += .01; m.x += m.vx + Math.sin(m.t) * .15; m.y += m.vy + Math.cos(m.t * .8) * .1;
        if (m.x > W + 5) m.x = -5; if (m.y < -5) m.y = H + 5;
        dx.beginPath(); dx.arc(m.x, m.y, m.r, 0, 6.283); dx.fillStyle = 'rgba(255,236,180,' + (m.a * (.6 + .4 * Math.sin(m.t * 3))) + ')'; dx.fill();
      });
      prints.forEach(function (p) {
        p.life -= RM ? 0 : .0025;
        dx.save(); dx.translate(p.x + (p.side ? 9 : -9), p.y); dx.rotate(p.rot); dx.scale(2.1, 2.1); dx.translate(-12, -17);
        dx.globalAlpha = Math.max(0, p.life) * .7; dx.fillStyle = '#7a5434'; dx.fill(foot);
        dx.globalAlpha = Math.max(0, p.life) * .5; dx.translate(-.8, -.8); dx.fillStyle = '#fff4dc'; dx.fill(foot);
        dx.restore();
      });
      prints = prints.filter(function (p) { return p.life > 0; });
      puffs.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += .045; p.vx *= .97; p.life -= .016;
        dx.beginPath(); dx.arc(p.x, p.y, p.r * (2 - p.life), 0, 6.283); dx.fillStyle = 'rgba(214,180,130,' + Math.max(0, p.life) * .55 + ')'; dx.fill();
      });
      puffs = puffs.filter(function (p) { return p.life > 0; });
    }
    if (!RM) {
      var io = new IntersectionObserver(function (en) { dustOn = en[0].isIntersecting; }); io.observe(hero);
      (function loop() { if (dustOn && !document.hidden) draw(); requestAnimationFrame(loop); })();
    }
  }

  /* ---------- The light line spark + page darkness that light keeps pushing back ---------- */
  var line = $('.light-line'), dk = $('#darkness');
  var dctx = dk && dk.getContext('2d'), DW = 0, DH = 0, px = -1, py = -1, pending = false;
  function dsize() { if (!dk) return; DW = window.innerWidth; DH = window.innerHeight; dk.width = DW; dk.height = DH; drawDark(); }
  function progress() { var h = document.documentElement.scrollHeight - DH; return h > 0 ? Math.min(1, window.scrollY / h) : 0; }
  function drawDark() {
    pending = false; if (!dctx) return;
    var p = progress();
    if (line) line.style.setProperty('--spark', (6 + p * 86) + '%');
    dctx.clearRect(0, 0, DW, DH);
    // Darkness never fully leaves: corner strength eases from .42 to a floor of .16 as you go deeper into the light.
    var edge = .28 - .16 * p, cx = DW / 2, cy = DH / 2, R = Math.hypot(DW, DH) / 2;
    var g = dctx.createRadialGradient(cx, cy, R * (.55 + .2 * p), cx, cy, R * 1.02);
    g.addColorStop(0, 'rgba(20,26,38,0)'); g.addColorStop(1, 'rgba(20,26,38,' + edge + ')');
    dctx.fillStyle = g; dctx.fillRect(0, 0, DW, DH);
    if (px >= 0) { // where your pointer is, light presses the dark back
      dctx.globalCompositeOperation = 'destination-out';
      var lg = dctx.createRadialGradient(px, py, 0, px, py, 220);
      lg.addColorStop(0, 'rgba(0,0,0,.9)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = lg; dctx.fillRect(0, 0, DW, DH);
      dctx.globalCompositeOperation = 'source-over';
    }
  }
  function req() { if (!pending) { pending = true; requestAnimationFrame(drawDark); } }
  if (dk) {
    dsize(); window.addEventListener('resize', dsize); window.addEventListener('scroll', req, { passive: true });
    if (!RM) window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; req(); } }, { passive: true });
  }

  /* ---------- Push back the dark (but never all of it — Matthew 24:36) ---------- */
  var voidBox = $('#void'), vc = $('#voidCanvas');
  if (voidBox && vc) {
    var v = vc.getContext('2d', { willReadFrequently: true }), VW = 0, VH = 0, cleared = 0, dragging = false, capped = false, bar = $('#voidBar'), msg = $('#voidMsg'), pct = $('#voidPct');
    var CAP = .86;
    function vsize() { VW = voidBox.clientWidth; VH = voidBox.clientHeight; vc.width = VW; vc.height = VH; fillDark(); }
    function fillDark() {
      var g = v.createLinearGradient(0, 0, VW, VH);
      g.addColorStop(0, '#0d1220'); g.addColorStop(.5, '#1a2133'); g.addColorStop(1, '#0b0f1a');
      v.globalCompositeOperation = 'source-over'; v.fillStyle = g; v.fillRect(0, 0, VW, VH);
      for (var i = 0; i < 90; i++) { v.fillStyle = 'rgba(160,180,220,' + Math.random() * .12 + ')'; v.fillRect(Math.random() * VW, Math.random() * VH, 1.2, 1.2); }
      cleared = 0; capped = false; update();
    }
    function measure() {
      var d = v.getImageData(0, 0, VW, VH).data, step = 16 * 4 * 3, tot = 0, clear = 0;
      for (var i = 3; i < d.length; i += step) { tot++; if (d[i] < 90) clear++; }
      cleared = tot ? clear / tot : 0; update();
    }
    function update() {
      var shown = Math.min(cleared, CAP);
      if (bar) bar.style.width = (shown / CAP * 100) + '%';
      if (pct) pct.textContent = Math.round(shown * 100) + '% light';
      if (cleared >= CAP && !capped) { capped = true; if (msg) msg.classList.add('on'); }
    }
    function push(x, y, r) {
      v.globalCompositeOperation = 'destination-out';
      var g = v.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      v.fillStyle = g; v.beginPath(); v.arc(x, y, r, 0, 6.283); v.fill();
      v.globalCompositeOperation = 'source-over';
    }
    function rim() { // the edge of darkness creeps back in: it is not ours to finish
      var g = v.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .42, VW / 2, VH / 2, Math.hypot(VW, VH) / 2);
      g.addColorStop(0, 'rgba(13,18,32,0)'); g.addColorStop(1, 'rgba(13,18,32,.08)');
      v.fillStyle = g; v.fillRect(0, 0, VW, VH);
    }
    var moves = 0;
    function at(e) { var r = vc.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    vc.addEventListener('pointerdown', function (e) { dragging = true; vc.setPointerCapture(e.pointerId); var p = at(e); push(p[0], p[1], 90); });
    vc.addEventListener('pointermove', function (e) { if (!dragging) return; var p = at(e); push(p[0], p[1], 70); if (++moves % 8 === 0) { if (cleared >= CAP - .04) rim(); measure(); } });
    function end() { if (!dragging) return; dragging = false; measure(); }
    vc.addEventListener('pointerup', end); vc.addEventListener('pointercancel', end);
    setInterval(function () { if (cleared > CAP - .06 && !dragging) { rim(); measure(); } }, 350);
    var lightBtn = $('#voidBtn'), resetBtn = $('#voidReset');
    if (lightBtn) lightBtn.addEventListener('click', function () { for (var i = 0; i < 6; i++) push(VW * (.05 + Math.random() * .9), VH * (.05 + Math.random() * .9), 130); if (cleared >= CAP - .04) rim(); measure(); });
    if (resetBtn) resetBtn.addEventListener('click', function () { if (msg) msg.classList.remove('on'); fillDark(); });
    vsize(); window.addEventListener('resize', function () { if (Math.abs(voidBox.clientWidth - VW) > 40) vsize(); });
  }

  /* ---------- Footprints along the shore ---------- */
  var trail = $('#trail');
  if (trail) {
    var n = 14, out = '';
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1), side = i % 2 ? 1 : -1;
      var x = 50 + Math.sin(t * Math.PI * 1.4) * 22 + side * 6, y = 96 - t * 92, rot = Math.cos(t * Math.PI * 1.4) * -22 + side * 4;
      out += '<svg class="fp" viewBox="0 0 24 34" aria-hidden="true" style="left:calc(' + x + '% - 17px);top:calc(' + y + '% - 24px);transform-origin:center;rotate:' + rot + 'deg;transition-delay:' + (i * .18) + 's' + (side > 0 ? ';scale:-1 1' : '') + '"><use href="#foot"/></svg>';
    }
    trail.insertAdjacentHTML('beforeend', out);
  }

  /* ---------- Moving earth: a little burrow, and new life behind it ---------- */
  var ec = $('#earthCanvas');
  if (ec) {
    var e2 = ec.getContext('2d'), EW = 0, EH = 0, path = [], bits = [], sprouts = [], tt = 0, eOn = false;
    function esize() { EW = ec.clientWidth; EH = ec.clientHeight; ec.width = EW * DPR; ec.height = EH * DPR; e2.setTransform(DPR, 0, 0, DPR, 0, 0); path = []; sprouts = []; tt = 0; }
    esize(); window.addEventListener('resize', esize);
    var ground = function () { return EH * .46; };
    function soil() {
      var g = e2.createLinearGradient(0, ground(), 0, EH); g.addColorStop(0, '#b98a5a'); g.addColorStop(1, '#6f4c2e');
      e2.fillStyle = g; e2.fillRect(0, ground(), EW, EH - ground());
      e2.fillStyle = 'rgba(255,240,210,.12)';
      for (var i = 0; i < 60; i++) { var sx = (i * 97) % EW, sy = ground() + ((i * 53) % (EH - ground())); e2.beginPath(); e2.arc(sx, sy, 2 + (i % 3), 0, 6.283); e2.fill(); }
    }
    function eframe() {
      e2.clearRect(0, 0, EW, EH); soil();
      tt += RM ? 1 : .004; if (tt > 1.15) { tt = 0; path = []; sprouts = []; }
      var t = Math.min(tt, 1), hx = EW * (.06 + .88 * t), hy = ground() + EH * .2 + Math.sin(t * 9) * EH * .06;
      if (!RM) path.push([hx, hy]);
      else { path = []; for (var k = 0; k <= 60; k++) { var q = k / 60; path.push([EW * (.06 + .88 * q), ground() + EH * .2 + Math.sin(q * 9) * EH * .06]); } }
      e2.strokeStyle = 'rgba(60,38,20,.55)'; e2.lineWidth = Math.max(10, EH * .055); e2.lineCap = 'round'; e2.lineJoin = 'round';
      e2.beginPath(); path.forEach(function (p, i) { i ? e2.lineTo(p[0], p[1]) : e2.moveTo(p[0], p[1]); }); e2.stroke();
      // sprouts behind the burrow: new life
      if (path.length && (sprouts.length === 0 || hx - sprouts[sprouts.length - 1].x > EW * .09)) sprouts.push({ x: hx, g: 0 });
      sprouts.forEach(function (s) {
        s.g = Math.min(1, s.g + (RM ? 1 : .01)); var h = EH * .14 * s.g, gy = ground();
        e2.strokeStyle = '#4f8a3a'; e2.lineWidth = 3; e2.beginPath(); e2.moveTo(s.x, gy); e2.quadraticCurveTo(s.x - 4, gy - h * .6, s.x, gy - h); e2.stroke();
        e2.fillStyle = '#6fb04f';
        e2.beginPath(); e2.ellipse(s.x - 8 * s.g, gy - h * .8, 9 * s.g, 4 * s.g, -.5, 0, 6.283); e2.fill();
        e2.beginPath(); e2.ellipse(s.x + 8 * s.g, gy - h * .9, 9 * s.g, 4 * s.g, .5, 0, 6.283); e2.fill();
      });
      if (!RM) {
        // the little earth-mover: a warm glow at the tunnel's head, flicking soil up
        var gl = e2.createRadialGradient(hx, hy, 0, hx, hy, 26); gl.addColorStop(0, 'rgba(255,230,160,.95)'); gl.addColorStop(1, 'rgba(255,230,160,0)');
        e2.fillStyle = gl; e2.beginPath(); e2.arc(hx, hy, 26, 0, 6.283); e2.fill();
        if (Math.random() < .6) bits.push({ x: hx, y: hy, vx: -Math.random() * 2.2, vy: -Math.random() * 2.4, l: 1 });
        bits.forEach(function (b) { b.x += b.vx; b.y += b.vy; b.vy += .09; b.l -= .025; e2.fillStyle = 'rgba(140,100,60,' + Math.max(0, b.l) + ')'; e2.fillRect(b.x, b.y, 3, 3); });
        bits = bits.filter(function (b) { return b.l > 0; });
      }
    }
    if (RM) { tt = 1; eframe(); }
    else {
      new IntersectionObserver(function (en) { eOn = en[0].isIntersecting; }).observe(ec);
      (function eloop() { if (eOn && !document.hidden) eframe(); requestAnimationFrame(eloop); })();
    }
  }

  /* ---------- Verses that fade in ---------- */
  var figs = $$('#rotator figure'), vi = 0, timer = null, paused = RM;
  function show(i) { figs.forEach(function (f, k) { f.classList.toggle('on', k === i); f.setAttribute('aria-hidden', k === i ? 'false' : 'true'); }); }
  function go(d) { vi = (vi + d + figs.length) % figs.length; show(vi); }
  function play() { clearInterval(timer); if (!paused) timer = setInterval(function () { go(1); }, 8000); }
  if (figs.length) {
    show(0); play();
    var pb = $('#rotPause'), nb = $('#rotNext'), bb = $('#rotPrev');
    if (pb) { pb.textContent = paused ? 'Play' : 'Pause'; pb.addEventListener('click', function () { paused = !paused; pb.textContent = paused ? 'Play' : 'Pause'; pb.setAttribute('aria-pressed', paused); play(); }); }
    if (nb) nb.addEventListener('click', function () { go(1); play(); });
    if (bb) bb.addEventListener('click', function () { go(-1); play(); });
  }

  /* ---------- Reveal on scroll ---------- */
  var rvs = $$('.rv, #trail');
  if ('IntersectionObserver' in window && !RM) {
    var ro = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); if (x.target.id === 'trail') $$('.fp', x.target).forEach(function (f) { f.classList.add('in'); }); ro.unobserve(x.target); } }); }, { threshold: .18 });
    rvs.forEach(function (el) { ro.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add('in'); }); $$('.fp').forEach(function (f) { f.classList.add('in'); }); }

  /* ---------- Connect form ---------- */
  var f = $('#connectForm');
  if (f) {
    var born = Date.now(), msgEl = $('#formMsg'), btn = f.querySelector('button[type=submit]'), label = btn.innerHTML;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f._honey && f._honey.value) return;
      if (Date.now() - born < 4000) { msgEl.textContent = 'Take a breath, then send again.'; return; }
      var bad = $$('[required]', f).filter(function (el) { return el.type === 'checkbox' ? !el.checked : (!el.value.trim() || (el.checkValidity && !el.checkValidity())); });
      if (bad.length) { msgEl.textContent = 'Please fill in the fields marked with * and check the consent box.'; bad[0].focus(); return; }
      var addr = atob(f.getAttribute('data-a')) + String.fromCharCode(64) + atob(f.getAttribute('data-b'));
      var fd = new FormData(f);
      fd.set('_subject', 'Dust Stomper: ' + (fd.getAll('reason').join(', ') || 'new message') + ' from ' + (fd.get('name') || 'someone'));
      btn.disabled = true; btn.textContent = 'Sending…'; msgEl.textContent = '';
      fetch('https://formsubmit.co/ajax/' + addr, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          if (j && (j.success === false || j.success === 'false')) throw new Error('fs');
          msgEl.textContent = 'Received. Thank you. Zach will read this personally and pray over it.'; f.reset(); btn.innerHTML = label; btn.disabled = false;
        })
        .catch(function () { msgEl.textContent = 'That did not go through. Please try again in a minute.'; btn.disabled = false; btn.innerHTML = label; });
    });
  }
})();
