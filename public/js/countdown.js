/* ============================================================
   Page 0 — Countdown lock · js/countdown.js
   Unlocks on 2 September 2026, 00:01 Turkey time (UTC+3)
   which is 2026-09-01T21:01:00Z in UTC.
   ============================================================ */
(function () {
  'use strict';

  var TARGET = Date.parse('2026-09-01T21:01:00Z');
  // Hidden testing switch: open index.html?preview to fast-forward the lock.
  // (Remove this line + the PREVIEW branch below to ship without it.)
  var PREVIEW = /[?&]preview\b/.test(location.search);

  var el = function (id) { return document.getElementById(id); };
  var lockView = el('lockView');
  var unlockView = el('unlockView');
  var itsTime = el('itsTime');
  var confText = el('confText');
  var enterBtn = el('enterBtn');
  var dd = el('dd'), hh = el('hh'), mm = el('mm'), ss = el('ss');

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function render(diffMs) {
    var total = Math.max(0, Math.floor(diffMs / 1000));
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    dd.textContent = pad(d);
    hh.textContent = pad(h);
    mm.textContent = pad(m);
    ss.textContent = pad(s);
  }

  var unlocked = false;

  function beginUnlock() {
    if (unlocked) return;
    unlocked = true;
    lockView.classList.add('fade-out');                       // fades the timer out over 1.5s
    setTimeout(function () {
      lockView.classList.add('hidden-v');
      unlockView.classList.remove('hidden-v');
      itsTime.classList.add('show');                          // "It's time."
    }, 1500);
    setTimeout(function () { confText.classList.add('show'); }, 2000);  // +0.5s
    setTimeout(function () { enterBtn.classList.add('show'); }, 2300);  // +0.3s
  }

  if (PREVIEW) {
    render(0);
    beginUnlock();
  } else {
    var tick = function () {
      var diff = TARGET - Date.now();
      render(diff);
      if (diff <= 0) {
        clearInterval(iv);
        beginUnlock();
      }
    };
    var iv = setInterval(tick, 1000);
    tick();
  }

  enterBtn.addEventListener('click', function (e) {
    e.preventDefault();
    location.replace('page1.html');   // never depends on the browser back button
  });

  /* ---------- slow-moving starfield ---------- */
  var cv = el('starfield');
  var ctx = cv.getContext('2d');
  var stars = [];
  var W = 0, H = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    stars.length = 0;
    var n = Math.min(150, Math.max(70, Math.round((W * H) / 9000)));
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() * 0.7,       // 1–2 px dots
        vx: (Math.random() - 0.5) * 0.06,   // very slow drift
        vy: 0.008 + Math.random() * 0.045,
        base: 0.3 + Math.random() * 0.5,    // opacity 0.3–0.8
        tw: 0.4 + Math.random() * 1.6,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx;
      s.y += s.vy;
      if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
      if (s.x < -2) { s.x = W + 2; }
      if (s.x > W + 2) { s.x = -2; }
      var a = s.base + 0.14 * Math.sin(t * 0.001 * s.tw + s.ph);
      if (a < 0.08) a = 0.08;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fill();
    }
  }

  function loop(t) {
    if (!document.hidden) draw(t);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', function () { resize(); seed(); });
  resize();
  seed();
  requestAnimationFrame(loop);
})();
