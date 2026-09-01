/* ============================================================
   Page 1 — Balloon Homepage (cinematic edition)
   intro overlay (exactly 4 s) → the title glides up into the
   header → two-tier cake builds → 12 balloons rise gradually
   → pop them all, blow out the 3 candles (any order)
   → ribbons fall → Continue.
   The only page with audio: a soft pop when a balloon bursts
   (synthesized live with the Web Audio API — no audio file).
   ============================================================ */
(function () {
  'use strict';

  history.replaceState(null, '', location.pathname);

  /* ---------- refs ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var introOverlay = $('introOverlay');
  var introTitle   = $('introTitle');
  var introText    = introTitle.querySelector('.intro-text');
  var headTitle    = $('headTitle');
  var mainEl       = $('mainPage');
  var subText      = $('subText');
  var balloonLayer = $('balloonLayer');
  var cakeWrap     = $('cakeWrap');
  var hint         = $('hint');
  var continueBtn  = $('continueBtn');
  var stageFX      = $('stageFX');

  var plateEl    = cakeWrap.querySelector('.plate');
  var tierBottom = cakeWrap.querySelector('.tier-bottom');
  var tierTop    = cakeWrap.querySelector('.tier-top');
  var candleEls  = Array.prototype.slice.call(cakeWrap.querySelectorAll('.candle'));

  var introDone  = false;
  var spawned    = false;
  var popped     = 0;
  var candlesOut = 0;
  var finished   = false;

  /* ============================================================
     1 · INTRO — streamers slide in, title glows. Exactly 4 s.
     ============================================================ */

  buildStreamers();

  /* anchor the 4 s to the real page-load timeline */
  var elapsed = (window.performance && performance.now) ? performance.now() : 0;
  setTimeout(startOutro, Math.max(0, 4000 - elapsed));

  /* wavy, semi-transparent, colourful streamers sliding in
     from the left and right edges toward the centre */
  function buildStreamers() {
    var COLORS = ['#ff2d55', '#ff7fa8', '#ffd166', '#a86fd6', '#f4b28c', '#ffffff'];
    var w = Math.round(window.innerWidth * 0.56);
    var h = 40;

    for (var i = 0; i < 12; i++) {
      var side = (i % 2 === 0) ? 's-left' : 's-right';
      var amp  = 9 + Math.round(Math.random() * 6);      /* wave height 9–15  */
      var wl   = 26 + Math.round(Math.random() * 14);    /* wavelength 26–40  */

      var el = document.createElement('div');
      el.className = 'streamer ' + side;
      el.style.width = w + 'px';
      el.style.top = (5 + Math.random() * 84).toFixed(1) + '%';
      el.style.setProperty('--dur', (2.4 + Math.random() * 1.1).toFixed(2) + 's');
      el.style.setProperty('--delay', (Math.random() * 1.35).toFixed(2) + 's');
      el.innerHTML =
        '<svg width="' + w + '" height="' + h + '" aria-hidden="true">' +
          '<path d="' + wavePath(w, h, amp, wl) + '" fill="none" ' +
            'stroke="' + COLORS[i % COLORS.length] + '" ' +
            'stroke-width="' + (4 + Math.random() * 2.5).toFixed(1) + '" ' +
            'stroke-linecap="round" ' +
            'opacity="' + (0.42 + Math.random() * 0.26).toFixed(2) + '"/>' +
        '</svg>';
      introOverlay.appendChild(el);
    }
  }

  function wavePath(w, h, amp, wl) {
    var mid = h / 2, x = 0, up = true;
    var d = 'M0 ' + mid;
    while (x < w) {
      var nx = Math.min(x + wl / 2, w);
      d += ' Q ' + ((x + nx) / 2).toFixed(1) + ' ' + (up ? mid - amp : mid + amp) + ' ' + nx + ' ' + mid;
      x = nx;
      up = !up;
    }
    return d;
  }

  /* at t = 4 s: overlay + streamers fade out, the title glides
     to the top and becomes the heading, content fades in below */
  function startOutro() {
    if (introDone) return;
    introDone = true;

    introOverlay.classList.add('out');
    setTimeout(function () {
      if (introOverlay.parentNode) introOverlay.parentNode.removeChild(introOverlay);
    }, 750);

    glideTitleToHeader();
    mainEl.classList.remove('veiled');

    /* the cake materialises in the lower half while the page reveals */
    setTimeout(function () { plateEl.classList.add('in'); }, 550);
    setTimeout(function () { tierBottom.classList.add('in'); }, 800);
    setTimeout(function () { tierTop.classList.add('in'); }, 1500);
    setTimeout(function () {
      candleEls.forEach(function (c, i) {
        setTimeout(function () { c.classList.add('lit'); }, i * 220);
      });
    }, 2150);

    setTimeout(spawnBalloons, 1000);   /* balloons rise gradually from ~5 s */
  }

  /* FLIP: the intro title glides from the centre of the screen
     into the heading slot at the top (same string, same font) */
  function glideTitleToHeader() {
    var from = introTitle.getBoundingClientRect();
    var to   = headTitle.getBoundingClientRect();
    var fs1  = parseFloat(window.getComputedStyle(introTitle).fontSize) || 48;
    var fs2  = parseFloat(window.getComputedStyle(headTitle).fontSize) || 40;

    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    var sc = fs2 / fs1;

    /* settle the pulse so the landing is pixel-perfect */
    introText.style.animation = 'none';
    introText.style.opacity = '1';
    introText.style.textShadow = '0 0 10px rgba(255,255,255,0.45), 0 0 34px rgba(255,255,255,0.2)';

    introTitle.style.transition = 'transform 1.05s cubic-bezier(0.22, 1, 0.36, 1)';
    introTitle.style.transform =
      'translateY(-50%) translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')';

    var landed = false;
    function land() {
      if (landed) return;
      landed = true;
      introTitle.style.display = 'none';
      headTitle.classList.remove('hidden-v');
    }
    introTitle.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform') land();
    });
    setTimeout(land, 1250);
  }

  /* ============================================================
     2 · BALLOONS — 12 of them, six colours, rising from ~5 s
     ============================================================ */
  var BALLOONS = [
    { c1: '#ff2d55', c2: '#b0133c', glow: 'rgba(255,45,85,0.45)',   left: 5,  dur: 17, delay: 0 },
    { c1: '#ff7fa8', c2: '#d14e7e', glow: 'rgba(255,127,168,0.4)',  left: 16, dur: 21, delay: 1.4 },
    { c1: '#a86fd6', c2: '#6a3a99', glow: 'rgba(168,111,214,0.4)',  left: 27, dur: 15, delay: 0.7 },
    { c1: '#f4b28c', c2: '#b5714f', glow: 'rgba(244,178,140,0.35)', left: 38, dur: 23, delay: 2.6 },
    { c1: '#ffffff', c2: '#cfc4d6', glow: 'rgba(255,255,255,0.35)', left: 49, dur: 18, delay: 1.1 },
    { c1: '#ffd166', c2: '#c98f2e', glow: 'rgba(255,209,102,0.4)',  left: 60, dur: 20, delay: 3.4 },
    { c1: '#ff2d55', c2: '#b0133c', glow: 'rgba(255,45,85,0.45)',   left: 71, dur: 16, delay: 0.5 },
    { c1: '#ff7fa8', c2: '#d14e7e', glow: 'rgba(255,127,168,0.4)',  left: 82, dur: 22, delay: 4.6 },
    { c1: '#a86fd6', c2: '#6a3a99', glow: 'rgba(168,111,214,0.4)',  left: 91, dur: 19, delay: 2.0 },
    { c1: '#f4b28c', c2: '#b5714f', glow: 'rgba(244,178,140,0.35)', left: 10, dur: 24, delay: 6.2 },
    { c1: '#ffffff', c2: '#cfc4d6', glow: 'rgba(255,255,255,0.35)', left: 44, dur: 15, delay: 5.3 },
    { c1: '#ffd166', c2: '#c98f2e', glow: 'rgba(255,209,102,0.4)',  left: 66, dur: 21, delay: 7.8 }
  ];

  function spawnBalloons() {
    if (spawned) return;
    spawned = true;

    BALLOONS.forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'balloon';
      el.setAttribute('aria-label', 'balloon');
      el.style.setProperty('--c1', b.c1);
      el.style.setProperty('--c2', b.c2);
      el.style.setProperty('--glow', b.glow);
      el.style.setProperty('--dur', b.dur + 's');
      el.style.setProperty('--delay', b.delay + 's');
      el.style.setProperty('--sway', (4 + Math.random() * 3).toFixed(2) + 's');
      el.style.left = b.left + '%';
      el.innerHTML =
        '<span class="balloon-inner">' +
          '<span class="balloon-body"></span>' +
          '<span class="balloon-knot"></span>' +
          '<span class="balloon-string"></span>' +
        '</span>';
      el.addEventListener('click', function () { pop(el, b); });
      balloonLayer.appendChild(el);
    });
  }

  /* ---------- soft pop sound (Web Audio API) ---------- */
  var actx = null;

  function ensureAudio() {
    try {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) actx = new AC();
      }
      if (actx && actx.state === 'suspended') actx.resume();
    } catch (e) { /* stay silent */ }
  }

  function popSound() {
    if (!actx) return;
    try {
      var t = actx.currentTime;

      /* quick descending "thump" */
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g);
      g.connect(actx.destination);
      o.start(t);
      o.stop(t + 0.16);

      /* airy click: filtered noise burst */
      var len = Math.floor(actx.sampleRate * 0.05);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = actx.createBufferSource();
      src.buffer = buf;
      var hp = actx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      var ng = actx.createGain();
      ng.gain.setValueAtTime(0.12, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      src.connect(hp);
      hp.connect(ng);
      ng.connect(actx.destination);
      src.start(t);
    } catch (e) { /* stay silent */ }
  }

  /* ---------- pop a balloon: burst + sound + remove ---------- */
  function pop(el, b) {
    if (el.classList.contains('popped')) return;
    ensureAudio();
    popSound();
    el.classList.add('popped');
    popped++;

    var rect = el.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + 24, b);

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 320);

    if (popped === BALLOONS.length) {
      if (balloonLayer.parentNode) balloonLayer.parentNode.removeChild(balloonLayer);
      subText.classList.add('gone');
      if (candlesOut < 3) {
        hint.classList.add('gone');
        setTimeout(function () {
          hint.textContent = 'Blow out the candles, my love. Tap each flame.';
          hint.classList.remove('gone');
        }, 700);
      } else {
        maybeFinish();
      }
    }
  }

  function burst(x, y, b) {
    var ring = document.createElement('div');
    ring.className = 'burst';
    ring.style.left = (x - 15) + 'px';
    ring.style.top = (y - 15) + 'px';
    ring.style.setProperty('--bc', b.c1);
    stageFX.appendChild(ring);
    setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 500);

    for (var i = 0; i < 6; i++) {
      (function (i) {
        var s = document.createElement('span');
        s.className = 'shard';
        s.style.left = x + 'px';
        s.style.top = y + 'px';
        s.style.setProperty('--bc', i % 2 ? b.c2 : b.c1);
        var ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
        var dist = 34 + Math.random() * 30;
        s.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(1) + 'px');
        s.style.setProperty('--ty', (Math.sin(ang) * dist).toFixed(1) + 'px');
        stageFX.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 520);
      })(i);
    }
  }

  /* ============================================================
     3 · CANDLES — blow out the flames (no sound, just smoke)
     ============================================================ */
  candleEls.forEach(function (c) {
    var f = c.querySelector('.flame');
    f.addEventListener('click', function () {
      if (!c.classList.contains('lit') || f.classList.contains('out')) return;
      f.classList.add('out');
      smoke(f);
      candlesOut++;
      maybeFinish();
    });
  });

  function smoke(f) {
    var r = f.getBoundingClientRect();
    for (var i = 0; i < 2; i++) {
      (function (i) {
        var s = document.createElement('div');
        s.className = 'smoke';
        s.style.left = (r.left + r.width / 2 - 7 + (i ? 5 : -5)) + 'px';
        s.style.top = (r.top + 6) + 'px';
        s.style.animationDelay = (i * 0.18) + 's';
        stageFX.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1500);
      })(i);
    }
  }

  /* ============================================================
     4 · FINALE — when every balloon is popped and every candle
     is out (in any order), the ribbons fall and Continue appears
     ============================================================ */
  function maybeFinish() {
    if (finished || popped < BALLOONS.length || candlesOut < 3) return;
    finished = true;
    hint.classList.add('gone');
    setTimeout(function () { hint.textContent = ''; }, 700);
    setTimeout(startRibbons, 800);
  }

  function startRibbons() {
    var layer = document.createElement('div');
    layer.className = 'ribbon-layer';
    document.body.appendChild(layer);

    var COLORS = ['#ff5c8a', '#ff2d55', '#ffd166', '#a55bd6'];   /* pink, red, gold, purple */
    var n = 15 + Math.floor(Math.random() * 11);                 /* 15–25 ribbons */

    for (var i = 0; i < n; i++) {
      (function (i) {
        var r = document.createElement('span');
        r.className = 'ribbon';
        r.style.left = (Math.random() * 96).toFixed(1) + '%';
        r.style.setProperty('--w', (5 + Math.random() * 5).toFixed(1) + 'px');
        r.style.setProperty('--h', Math.round(60 + Math.random() * 70) + 'px');
        r.style.setProperty('--c', COLORS[i % 4]);
        r.style.setProperty('--rot', Math.round(240 + Math.random() * 720) + 'deg');
        r.style.setProperty('--dur', (2.1 + Math.random() * 0.9).toFixed(2) + 's');
        r.style.setProperty('--sway', ((Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 50)).toFixed(0) + 'px');
        r.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
        layer.appendChild(r);
      })(i);
    }

    /* ribbons fall for ~3 seconds, then fade away */
    setTimeout(function () { layer.classList.add('fade'); }, 2600);
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      continueBtn.classList.add('show');
    }, 3500);
  }

  continueBtn.addEventListener('click', function (e) {
    e.preventDefault();
    location.replace('page2.html');
  });

  /* tiny test hook (automated verification only) */
  window.__p1 = {
    skip: startOutro,
    state: function () {
      return {
        introDone: introDone,
        spawned: spawned,
        popped: popped,
        total: BALLOONS.length,
        candlesOut: candlesOut,
        finished: finished
      };
    }
  };
})();
