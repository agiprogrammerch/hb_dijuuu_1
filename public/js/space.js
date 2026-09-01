/* ============================================================
   Page 4 — 3D space with 7 memory stars · js/space.js
   Three.js r149 (local asset). Camera sits at the centre of a
   hand-built universe: realistic starfield, galaxy swirl, Sun +
   Earth, Mars, Jupiter, Saturn (rings), Venus — and 7 glowing
   memory stars that keep a little message each.
   No audio. No back button. No zoom — just look around.
   ============================================================ */
(function () {
  'use strict';

  history.replaceState(null, '', location.pathname);

  var hintEl = document.getElementById('spaceHint');
  var countEl = document.getElementById('starCount');
  var starOverlay = document.getElementById('starOverlay');
  var starTitle = document.getElementById('starTitle');
  var starMsg = document.getElementById('starMsg');
  var doneOverlay = document.getElementById('doneOverlay');
  var surpriseBtn = document.getElementById('surpriseBtn');
  var canvas = document.getElementById('space');

  if (typeof THREE === 'undefined') {
    hintEl.textContent = 'The stars could not load here, Dijuuu — but they are all yours.';
    return;
  }

  /* ---------- the 7 memory stars ---------- */
  var STARS = [
    { title: 'The day everything began', msg: "I didn't know a single message could change my whole world, my love.", th: 0.55, ph: 1.25, gold: false },
    { title: 'A sound I replay',         msg: "I've lost count of how many times I've listened to your voice, Dijuuu.", th: 1.45, ph: 1.60, gold: true },
    { title: 'When you stayed awake',    msg: "You waited for me when I couldn't even reach you. I have never forgotten that.", th: 2.45, ph: 1.10, gold: false },
    { title: 'Midnight with you',        msg: 'I still imagine us on that balcony, not saying anything. Just being.', th: 3.45, ph: 1.62, gold: true },
    { title: 'A sound like light',       msg: 'I think I fell a little more every time you laughed at my stories.', th: 4.55, ph: 1.05, gold: false },
    { title: 'A prayer without words',   msg: "When I pray, I don't always have words. But I always have you in my chest.", th: 5.65, ph: 1.60, gold: false },
    { title: 'Before and after',         msg: 'There is a version of me before you, and a version after. I only like the second one.', th: 0.05, ph: 1.65, gold: true }
  ];

  /* ---------- renderer / scene / camera ---------- */
  var renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { renderer = null; }

  if (!renderer) {
    hintEl.textContent = 'The stars could not load here, Dijuuu — but they are all yours.';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 1);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 4000);

  function sph(th, ph, r) {
    return new THREE.Vector3(
      r * Math.sin(ph) * Math.cos(th),
      r * Math.cos(ph),
      r * Math.sin(ph) * Math.sin(th)
    );
  }

  /* ---------- tiny seeded RNG (stable textures every visit) ---------- */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- canvas texture helper ---------- */
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 2;
    return t;
  }

  function glowTexture(inner, mid) {
    return canvasTex(128, 128, function (ctx) {
      var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.18, inner);
      g.addColorStop(0.45, mid);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
  }

  /* ---------- lights ---------- */
  scene.add(new THREE.AmbientLight(0x40303c, 0.9));
  var sunPos = sph(1.0, 1.35, 620);
  var sunLight = new THREE.PointLight(0xffe3b0, 1.5, 0, 0);
  sunLight.position.copy(sunPos);
  scene.add(sunLight);

  /* ---------- deep-space starfield (tiny 1–2px stars) ---------- */
  var starfieldMat;
  (function () {
    var N = 2600;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var rng = mulberry(42);
    for (var i = 0; i < N; i++) {
      var u = rng() * 2 - 1;
      var a = rng() * Math.PI * 2;
      var r = 1300 + rng() * 400;
      var s = Math.sqrt(1 - u * u);
      pos[i * 3] = s * Math.cos(a) * r;
      pos[i * 3 + 1] = u * r;
      pos[i * 3 + 2] = s * Math.sin(a) * r;
      var b = 0.35 + rng() * 0.65;                 /* varied brightness */
      col[i * 3] = b;
      col[i * 3 + 1] = b * (0.93 + rng() * 0.07);
      col[i * 3 + 2] = b * (0.96 + rng() * 0.04);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    starfieldMat = new THREE.PointsMaterial({
      size: 1.7, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0.95, depthWrite: false
    });
    scene.add(new THREE.Points(geo, starfieldMat));
  })();

  /* ---------- galaxy swirl of tiny stars ---------- */
  (function () {
    var N = 3200;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var rng = mulberry(7);
    var palette = [[1, 1, 1], [1, 0.85, 0.92], [0.87, 0.8, 1], [1, 0.91, 0.79], [0.95, 0.7, 0.8]];
    for (var i = 0; i < N; i++) {
      var arm = i % 2;
      var t = Math.pow(rng(), 0.75);
      var ang = t * 4.4 + arm * Math.PI + (rng() - 0.5) * 0.55;
      var rad = 90 + 620 * t + (rng() - 0.5) * 90 * (0.3 + t);
      pos[i * 3] = Math.cos(ang) * rad;
      pos[i * 3 + 1] = (rng() - 0.5) * (60 * (1 - t) + 14);
      pos[i * 3 + 2] = Math.sin(ang) * rad;
      var c = palette[Math.floor(rng() * palette.length)];
      var fade = 1 - t * 0.55;
      col[i * 3] = c[0] * fade;
      col[i * 3 + 1] = c[1] * fade;
      col[i * 3 + 2] = c[2] * fade;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.6, sizeAttenuation: false, vertexColors: true,
      transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    var galaxy = new THREE.Group();
    galaxy.add(pts);
    var core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture('rgba(255,214,235,0.8)', 'rgba(180,140,220,0.25)'),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    }));
    core.scale.set(560, 560, 1);
    galaxy.add(core);
    galaxy.position.copy(sph(3.9, 1.05, 2000));
    galaxy.lookAt(0, 0, 0);
    galaxy.rotateX(1.25);
    scene.add(galaxy);
  })();

  /* ---------- faint nebulas for depth ---------- */
  (function () {
    var nebulas = [
      { c: 'rgba(120,60,160,0.16)', p: sph(2.2, 1.5, 1600), s: 1100 },
      { c: 'rgba(255,45,85,0.10)',  p: sph(4.8, 0.9, 1700), s: 1300 },
      { c: 'rgba(255,150,90,0.08)', p: sph(5.6, 1.7, 1500), s: 900 }
    ];
    nebulas.forEach(function (n) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(n.c, 'rgba(0,0,0,0)'),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9
      }));
      sp.position.copy(n.p);
      sp.scale.set(n.s, n.s, 1);
      scene.add(sp);
    });
  })();

  /* ---------- planets (low-poly, procedural textures) ---------- */
  var spinning = [];

  function addPlanet(mesh, speed) {
    scene.add(mesh);
    spinning.push({ m: mesh, v: speed });
  }

  /* Earth */
  var earthTex = canvasTex(512, 256, function (ctx, w, h) {
    var rng = mulberry(11);
    ctx.fillStyle = '#123f68';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0d3153';
    for (var i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, 12 + rng() * 40, 6 + rng() * 18, rng() * 3, 0, 6.2832);
      ctx.fill();
    }
    var land = ['#3f7a4a', '#5d8a4f', '#7a8a56', '#4f6f45'];
    for (var j = 0; j < 16; j++) {
      ctx.fillStyle = land[j % land.length];
      var cx = rng() * w, cy = h * 0.2 + rng() * h * 0.6, r0 = 12 + rng() * 34;
      for (var k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + (rng() - 0.5) * r0 * 2, cy + (rng() - 0.5) * r0, r0 * (0.4 + rng() * 0.5), r0 * (0.3 + rng() * 0.4), rng() * 3, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#e8f2f8';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    for (var m = 0; m < 22; m++) {
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, 18 + rng() * 46, 4 + rng() * 8, 0, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  var earth = new THREE.Mesh(
    new THREE.SphereGeometry(9, 28, 20),
    new THREE.MeshPhongMaterial({ map: earthTex, shininess: 8 })
  );
  earth.position.copy(sph(1.9, 1.2, 170));
  addPlanet(earth, 0.05);

  /* Mars */
  var marsTex = canvasTex(512, 256, function (ctx, w, h) {
    var rng = mulberry(23);
    ctx.fillStyle = '#b5502e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7c3018';
    for (var i = 0; i < 34; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, 10 + rng() * 36, 6 + rng() * 16, rng() * 3, 0, 6.2832);
      ctx.fill();
    }
    ctx.fillStyle = '#d98a5f';
    for (var j = 0; j < 26; j++) {
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, 8 + rng() * 26, 4 + rng() * 10, rng() * 3, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#f0e2d6';
    ctx.fillRect(0, 0, w, 7);
    ctx.fillRect(0, h - 7, w, 7);
    ctx.globalAlpha = 1;
  });
  var mars = new THREE.Mesh(
    new THREE.SphereGeometry(7, 26, 18),
    new THREE.MeshPhongMaterial({ map: marsTex, shininess: 4 })
  );
  mars.position.copy(sph(3.0, 1.55, 200));
  addPlanet(mars, 0.04);

  /* Jupiter (with bands) */
  var jupiterTex = canvasTex(512, 256, function (ctx, w, h) {
    var bands = ['#e8d5b5', '#d9b38c', '#a9744f', '#e8d5b5', '#b55a3a', '#d9c2a0', '#8a5a3a', '#e0cdb0', '#c49a6c', '#e8d5b5', '#a9744f', '#d9b38c'];
    var bh = h / bands.length;
    bands.forEach(function (col, i) {
      ctx.fillStyle = col;
      ctx.fillRect(0, Math.floor(i * bh), w, Math.ceil(bh) + 1);
    });
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#f5ead6';
    for (var i = 0; i < 18; i++) {
      ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#c14a3a';
    ctx.beginPath();
    ctx.ellipse(w * 0.68, h * 0.62, 34, 13, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,220,0.55)';
    ctx.beginPath();
    ctx.ellipse(w * 0.68, h * 0.62, 17, 6, 0, 0, 6.2832);
    ctx.fill();
  });
  var jupiter = new THREE.Mesh(
    new THREE.SphereGeometry(22, 30, 22),
    new THREE.MeshPhongMaterial({ map: jupiterTex, shininess: 5 })
  );
  jupiter.position.copy(sph(4.1, 1.15, 380));
  addPlanet(jupiter, 0.03);

  /* Saturn (with rings) */
  var saturnTex = canvasTex(512, 256, function (ctx, w, h) {
    var bands = ['#e9d8ac', '#d6c090', '#c9ab74', '#e2cf9f', '#cdb283', '#dcc79a', '#c9ab74', '#e2cf9f'];
    var bh = h / bands.length;
    bands.forEach(function (col, i) {
      ctx.fillStyle = col;
      ctx.fillRect(0, Math.floor(i * bh), w, Math.ceil(bh) + 1);
    });
  });
  var ringTex = canvasTex(256, 16, function (ctx, w, h) {
    for (var x = 0; x < w; x++) {
      var t = x / w;
      var a = 0;
      if (t < 0.08) a = 0;
      else if (t < 0.22) a = 0.55;
      else if (t < 0.26) a = 0.10;        /* gap */
      else if (t < 0.55) a = 0.72;
      else if (t < 0.60) a = 0.14;        /* cassini-like gap */
      else if (t < 0.86) a = 0.5;
      else a = 0.25 * (1 - (t - 0.86) / 0.14);
      ctx.fillStyle = 'rgba(222,202,162,' + (a * 0.9).toFixed(3) + ')';
      ctx.fillRect(x, 0, 1, h);
    }
  });
  var saturnGroup = new THREE.Group();
  saturnGroup.position.copy(sph(5.2, 1.5, 430));
  var saturn = new THREE.Mesh(
    new THREE.SphereGeometry(17, 30, 20),
    new THREE.MeshPhongMaterial({ map: saturnTex, shininess: 4 })
  );
  saturnGroup.add(saturn);
  (function () {
    var inner = 23, outer = 40;
    var geo = new THREE.RingGeometry(inner, outer, 96, 1);
    var pos = geo.attributes.position;
    var uv = geo.attributes.uv;
    var v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var d = (v.length() - inner) / (outer - inner);
      uv.setXY(i, d, 0.5);
    }
    var rings = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: ringTex, transparent: true, opacity: 0.95,
      side: THREE.DoubleSide, depthWrite: false
    }));
    rings.rotation.x = Math.PI / 2;
    saturnGroup.add(rings);
  })();
  saturnGroup.rotation.z = 0.30;
  saturnGroup.rotation.x = 0.12;
  scene.add(saturnGroup);
  spinning.push({ m: saturn, v: 0.028 });

  /* Venus */
  var venusTex = canvasTex(512, 256, function (ctx, w, h) {
    ctx.fillStyle = '#e6cfa3';
    ctx.fillRect(0, 0, w, h);
    var tones = ['#d9b97e', '#f2e3bd', '#cfae72', '#f0ddb0'];
    var rng = mulberry(31);
    for (var i = 0; i < 30; i++) {
      ctx.fillStyle = tones[i % tones.length];
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(rng() * w, rng() * h, 30 + rng() * 70, 6 + rng() * 12, (rng() - 0.5) * 0.5, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  var venus = new THREE.Mesh(
    new THREE.SphereGeometry(8, 26, 18),
    new THREE.MeshPhongMaterial({ map: venusTex, shininess: 10 })
  );
  venus.position.copy(sph(6.2, 1.3, 190));
  addPlanet(venus, 0.02);

  /* the Sun */
  var sun = new THREE.Mesh(
    new THREE.SphereGeometry(55, 32, 22),
    new THREE.MeshBasicMaterial({ color: 0xffe9c0 })
  );
  sun.position.copy(sunPos);
  scene.add(sun);
  var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,214,140,0.9)', 'rgba(255,150,60,0.35)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  sunGlow.scale.set(300, 300, 1);
  sunGlow.position.copy(sunPos);
  scene.add(sunGlow);

  /* ---------- the 7 glowing memory stars ---------- */
  var redGlow = glowTexture('rgba(255,45,85,0.95)', 'rgba(255,45,85,0.32)');
  var goldGlow = glowTexture('rgba(255,210,122,0.95)', 'rgba(255,190,90,0.3)');
  var starSprites = [];
  var hitboxes = [];
  var hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  STARS.forEach(function (s, idx) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: s.gold ? goldGlow : redGlow,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    }));
    var p = sph(s.th, s.ph, 400 + (idx % 3) * 35);
    sp.position.copy(p);
    sp.scale.set(30, 30, 1);
    sp.userData = { idx: idx, base: 30, phase: idx * 1.3, read: false };
    scene.add(sp);
    starSprites.push(sp);

    /* invisible-but-raycastable tap target around each star */
    var hb = new THREE.Mesh(new THREE.SphereGeometry(24, 8, 6), hitMat);
    hb.position.copy(p);
    hb.userData.idx = idx;
    scene.add(hb);
    hitboxes.push(hb);
  });

  /* ---------- camera look-around controls ---------- */
  var theta = 0.6, phi = 1.3;
  var thetaT = theta, phiT = phi;
  var PHI_MIN = 0.3, PHI_MAX = Math.PI - 0.3;
  var dragging = false, px = 0, py = 0, downX = 0, downY = 0, downTime = 0, movedFar = false;
  var cardOpen = false, doneShown = false;

  function applyCamera() {
    if (phi < PHI_MIN) phi = PHI_MIN;
    if (phi > PHI_MAX) phi = PHI_MAX;
    camera.lookAt(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
  }

  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2();

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true;
    movedFar = false;
    px = downX = e.clientX;
    py = downY = e.clientY;
    downTime = Date.now();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - px;
    var dy = e.clientY - py;
    px = e.clientX;
    py = e.clientY;
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 14) movedFar = true;
    thetaT -= dx * 0.0034;   /* the sky follows the finger */
    phiT -= dy * 0.0034;
  });

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    var dt = Date.now() - downTime;
    if (!movedFar && dt < 500) {
      var rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      camera.updateMatrixWorld();
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObjects(hitboxes, false);
      if (hits.length) openStar(hits[0].object.userData.idx);
    }
  }
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', function () { dragging = false; });

  /* ---------- star cards ---------- */
  var readCount = 0;

  function updateCount() { countEl.textContent = readCount + ' / 7'; }

  function openStar(idx) {
    var s = STARS[idx];
    cardOpen = true;
    starTitle.textContent = s.title;
    starMsg.textContent = s.msg;
    starOverlay.classList.add('show');
    var sp = starSprites[idx];
    if (!sp.userData.read) {
      sp.userData.read = true;    /* the star stays lit from now on */
      readCount++;
      updateCount();
    }
    if (readCount >= 1) hintEl.classList.add('gone');
  }

  function closeStar() {
    if (!cardOpen) return;
    cardOpen = false;
    starOverlay.classList.remove('show');
    if (readCount === STARS.length && !doneShown) {
      setTimeout(showDone, 700);
    }
  }

  function showDone() {
    doneShown = true;
    doneOverlay.classList.add('show');
    setTimeout(function () { surpriseBtn.classList.add('show'); }, 900);
  }

  starOverlay.addEventListener('click', closeStar);

  surpriseBtn.addEventListener('click', function (e) {
    e.preventDefault();
    location.replace('page5.html');
  });

  /* ---------- render loop ---------- */
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if (!dragging && !cardOpen) thetaT += 0.00045;   /* gentle idle drift */
    theta += (thetaT - theta) * 0.09;
    phi += (phiT - phi) * 0.09;
    applyCamera();

    for (var i = 0; i < spinning.length; i++) {
      spinning[i].m.rotation.y = t * spinning[i].v;
    }

    /* memory stars pulse gently; read ones burn steady and bright */
    for (var k = 0; k < starSprites.length; k++) {
      var sp = starSprites[k];
      var u = sp.userData;
      var s;
      if (u.read) {
        s = u.base * 1.18 + Math.sin(t * 1.2 + u.phase) * 1.4;
        sp.material.opacity = 1;
      } else {
        s = u.base * (1 + 0.24 * Math.sin(t * 2.1 + u.phase));
        sp.material.opacity = 0.62 + 0.3 * Math.sin(t * 2.1 + u.phase);
      }
      sp.scale.set(s, s, 1);
    }

    starfieldMat.opacity = 0.9 + 0.08 * Math.sin(t * 0.5);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* tiny harmless test hook (opens cards / projects stars / finishes the hunt) */
  window.__dj = {
    open: openStar,
    finish: function () {
      STARS.forEach(function (s, i) {
        if (!starSprites[i].userData.read) {
          starSprites[i].userData.read = true;
          readCount++;
        }
      });
      updateCount();
      hintEl.classList.add('gone');
      showDone();
    },
    screenPos: function (idx) {
      var v = starSprites[idx].position.clone().project(camera);
      var rect = canvas.getBoundingClientRect();
      return {
        x: Math.round((v.x * 0.5 + 0.5) * rect.width + rect.left),
        y: Math.round((-v.y * 0.5 + 0.5) * rect.height + rect.top),
        behind: v.z > 1
      };
    },
    view: function () { return { theta: theta, phi: phi }; }
  };
})();
