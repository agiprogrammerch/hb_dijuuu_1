/* ============================================================
   Page 2 — A Letter for Dijuuu · js/letter.js
   Reveals the letter section by section: timed intro, then
   scroll (IntersectionObserver inside the card) or tap.
   ============================================================ */
(function () {
  'use strict';

  var card = document.getElementById('letterCard');
  var gameBtn = document.getElementById('gameBtn');
  var letterEnd = document.getElementById('letterEnd');

  var sections = [];
  if (card) {
    var found = card.querySelectorAll('.letter-sec');
    for (var i = 0; i < found.length; i++) sections.push(found[i]);
  }
  var signature = sections.length ? sections[sections.length - 1] : null;
  var endScheduled = false;

  function reveal(el) {
    if (!el || el.classList.contains('show')) return false;
    el.classList.add('show');
    return true;
  }

  function revealSection(el) {
    if (reveal(el) && el === signature) scheduleEnd();
  }

  /* once the signature is revealed → show the way forward */
  function scheduleEnd() {
    if (endScheduled) return;
    endScheduled = true;
    setTimeout(function () {
      if (letterEnd) letterEnd.classList.add('show');
      if (gameBtn) gameBtn.classList.add('show');
    }, 1600);
  }

  /* tap the card → reveal the next hidden section (never the button) */
  if (card) {
    card.addEventListener('click', function (e) {
      if (gameBtn && (e.target === gameBtn || gameBtn.contains(e.target))) return;
      var next = null;
      for (var j = 0; j < sections.length; j++) {
        if (!sections[j].classList.contains('show')) { next = sections[j]; break; }
      }
      if (!next) return;
      revealSection(next);
      var cardRect = card.getBoundingClientRect();
      var r = next.getBoundingClientRect();
      if (r.bottom > cardRect.bottom + 1 || r.top < cardRect.top - 1) {
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (gameBtn) {
    gameBtn.addEventListener('click', function (e) {
      e.preventDefault();
      location.replace('page3.html');   // never depends on the browser back button
    });
  }

  /* scroll-driven reveals for every remaining section (3–10) */
  function startObserver() {
    if (!card || sections.length < 3) return;
    var rest = sections.slice(2);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var k = 0; k < entries.length; k++) {
          var entry = entries[k];
          if (entry.isIntersecting && entry.intersectionRatio >= 0.299) {
            revealSection(entry.target);
            io.unobserve(entry.target);
          }
        }
      }, { root: card, threshold: 0.3 });
      for (var m = 0; m < rest.length; m++) io.observe(rest[m]);
    } else {
      /* fallback for very old browsers: reveal on scroll */
      var ticking = false;
      card.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          var cardRect = card.getBoundingClientRect();
          for (var n = 0; n < rest.length; n++) {
            var el = rest[n];
            if (el.classList.contains('show')) continue;
            var r = el.getBoundingClientRect();
            if (r.top < cardRect.bottom && r.bottom > cardRect.top) revealSection(el);
          }
        });
      });
    }
  }

  function start() {
    /* the card is never empty: greeting first, then the opening line */
    setTimeout(function () { if (sections[0]) revealSection(sections[0]); }, 700);
    setTimeout(function () {
      if (sections[1]) revealSection(sections[1]);
      startObserver();
    }, 1100);
  }

  try { history.replaceState(null, '', location.pathname); } catch (err) { /* file:// etc. */ }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
