/* Dust Stomper FX: "Let there be light" intro, light cursor, tap bursts, sparks on the light line, hero god-rays.
   Ambient motion is skipped for prefers-reduced-motion; user-started light bursts stay (small, short). */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var doc = document.documentElement;

  /* ---------- 1. Intro: darkness, then light breaks in from the line ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem('ds-intro') === '1'; } catch (e) {}
  if (!RM && !seen) {
    var intro = document.createElement('div');
    intro.className = 'intro'; intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = '<div class="intro-dot"></div><p class="intro-word">Let there be light</p>';
    document.body.appendChild(intro);
    doc.classList.add('intro-on');
    var done = function () {
      if (!intro.parentNode) return;
      intro.classList.add('go');
      setTimeout(function () { intro.classList.add('gone'); doc.classList.remove('intro-on'); burst(innerWidth / 2, innerHeight * .42, 140, 1.6); }, 650);
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 2200);
      try { sessionStorage.setItem('ds-intro', '1'); } catch (e) {}
    };
    intro.addEventListener('click', done);
    setTimeout(done, 2300);
  }

  /* ---------- 2. Hero god-rays ---------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var rays = document.createElement('div'); rays.className = 'godrays'; rays.setAttribute('aria-hidden', 'true');
    var media = hero.querySelector('.hero-media');
    (media || hero).appendChild(rays);
  }

  /* ---------- 3. One light canvas over the page ---------- */
  var cv = document.createElement('canvas'); cv.id = 'fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  var c = cv.getContext('2d'), W = 0, H = 0, parts = [], rings = [], mx = -999, my = -999, lastMove = 0, running = false;
  function size() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  size(); addEventListener('resize', size);

  function lineX() { return innerWidth <= 720 ? 15 : innerWidth / 2; }

  function burst(x, y, n, power) {
    power = power || 1;
    n = RM ? Math.min(n, 18) : n;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = (Math.random() * 5 + 1.5) * power;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: Math.random() * 2.6 + 1, life: 1, decay: Math.random() * .018 + .012, hue: 40 + Math.random() * 18, g: .04 });
    }
    rings.push({ x: x, y: y, r: 6, life: 1, power: power });
    kick();
  }

  addEventListener('pointerdown', function (e) {
    if (e.target.closest('input,textarea,select,label,#voidCanvas,audio,video')) return;
    burst(e.clientX, e.clientY, 34, 1);
  }, { passive: true });

  var vcv = document.getElementById('voidCanvas');
  if (vcv) vcv.addEventListener('pointermove', function (e) {
    if (!e.buttons && e.pointerType === 'mouse') return;
    for (var i = 0; i < (RM ? 1 : 5); i++) { var a = Math.random() * 6.283, s = Math.random() * 2.2 + .4;
      parts.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * s, vy: Math.sin(a) * s - .6, r: Math.random() * 2 + 1, life: 1, decay: .02 + Math.random() * .015, hue: 45, g: .02 }); }
    kick();
  }, { passive: true });

  if (FINE && !RM) {
    addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY; lastMove = performance.now();
      if (Math.random() < .55) parts.push({ x: mx + (Math.random() - .5) * 6, y: my + (Math.random() - .5) * 6, vx: (Math.random() - .5) * .6, vy: Math.random() * .6 + .2, r: Math.random() * 1.8 + .6, life: 1, decay: .022 + Math.random() * .02, hue: 42 + Math.random() * 14, g: .01 });
      kick();
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mx = -999; });
    doc.classList.add('lightcursor');
  }

  var sparkT = 0;
  function frame(t) {
    c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';

    // Sparks riding the light line (ambient)
    if (!RM && !document.hidden) {
      sparkT++;
      var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      if (sparkT % 6 === 0) {
        var lx = lineX();
        parts.push({ x: lx + (Math.random() - .5) * 3, y: H + 10, stopY: heroBottom, vx: (Math.random() - .5) * .3, vy: -(Math.random() * 3 + 2.5), r: Math.random() * 1.6 + 1.2, life: 1, decay: .004 + Math.random() * .003, hue: 44, g: 0, line: true });
      }
    }

    // Light orb that follows the mouse
    if (mx > -900 && t - lastMove < 2500) {
      var fade = Math.max(0, 1 - (t - lastMove) / 2500);
      var g = c.createRadialGradient(mx, my, 0, mx, my, 70);
      g.addColorStop(0, 'rgba(255,248,220,' + .55 * fade + ')'); g.addColorStop(.3, 'rgba(255,214,130,' + .22 * fade + ')'); g.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = g; c.beginPath(); c.arc(mx, my, 70, 0, 6.283); c.fill();
    }

    for (var i = 0; i < rings.length; i++) {
      var r = rings[i]; r.r += 7 * r.power; r.life -= .03;
      c.strokeStyle = 'rgba(255,220,150,' + Math.max(0, r.life) * .8 + ')'; c.lineWidth = 3 * r.life + .5;
      c.beginPath(); c.arc(r.x, r.y, r.r, 0, 6.283); c.stroke();
    }
    rings = rings.filter(function (r) { return r.life > 0; });

    for (var k = 0; k < parts.length; k++) {
      var p = parts[k];
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.life -= p.decay;
      var a = Math.max(0, p.life);
      var rr = p.r * (p.line ? 1 : (.6 + a));
      var gg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 4);
      gg.addColorStop(0, 'hsla(' + p.hue + ',100%,88%,' + a + ')'); gg.addColorStop(.35, 'hsla(' + p.hue + ',95%,65%,' + a * .45 + ')'); gg.addColorStop(1, 'hsla(' + p.hue + ',95%,60%,0)');
      c.fillStyle = gg; c.beginPath(); c.arc(p.x, p.y, rr * 4, 0, 6.283); c.fill();
    }
    parts = parts.filter(function (p) { return p.life > 0 && p.y > -40 && !(p.line && p.y < p.stopY); });
    if (parts.length > 900) parts.splice(0, parts.length - 900);
    c.globalCompositeOperation = 'source-over';

    if (parts.length || rings.length || !RM) requestAnimationFrame(frame); else running = false;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  kick();

  /* ---------- 4. Headline shimmer + stronger reveals are CSS (.js .rv / .shine-text) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('section h2'), function (h) { h.classList.add('shine-text'); });
})();
