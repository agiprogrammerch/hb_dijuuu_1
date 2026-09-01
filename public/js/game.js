/* ============================================================
   Page 3 — "Pieces of Us" · memory match game
   6 pairs · 12 cards · only red hearts (#ff2d55)
   No audio, no back buttons, no page scrolling.
   ============================================================ */
(function () {
  'use strict';

  history.replaceState(null, '', location.pathname);

  /* ---------- data ---------- */
  var SYMBOLS = ['👉👈', '🌙', '🌹', '🕌', '🍳', '💌'];

  var PAIR_MSGS = {
    '👉👈': 'That shy little gesture became my whole world, my love.',
    '🌙': 'I still dream of the balcony at midnight, Dijuuu.',
    '🌹': 'A garden waits for us, and it will smell like you.',
    '🕌': 'My best prayer was the one I made for us.',
    '🍳': "We'll burn biryani and laugh until we forget the fire.",
    '💌': 'Every word I write is just another way to say I love you.'
  };

  var HINTS = {
    1: "Keep going. You're unlocking us.",
    3: 'Halfway to the stars.',
    5: 'One more, my love.'
  };

  var REASSURANCE_MSG = "Take your time, my love. I'm not going anywhere.";

  var TOTAL_PAIRS = 6;
  var FLIP_BACK_MS = 600;
  var WIN_DELAY_MS = 900;
  var BUTTON_DELAY_MS = 700;
  var REASSURANCE_HOLD_MS = 5000;
  var FADE_MS = 1000;

  var HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

  /* ---------- elements ---------- */
  var grid = document.getElementById('grid');
  var msgEl = document.getElementById('msg');
  var hintEl = document.getElementById('hint');
  var progressText = document.getElementById('progressText');
  var winOverlay = document.getElementById('winOverlay');
  var universeBtn = document.getElementById('universeBtn');

  /* ---------- state ---------- */
  var firstCard = null;
  var boardLocked = false;
  var matchedCount = 0;
  var wrongAttempts = 0;
  var reassuranceShown = false;
  var reassuranceTimer = null;

  /* ---------- helpers ---------- */
  function heartSVG(size, opacity) {
    var style = 'width:' + size + 'px;height:' + size + 'px';
    if (typeof opacity === 'number') {
      style += ';opacity:' + opacity;
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true" style="' + style + '"><path fill="#ff2d55" d="' + HEART_PATH + '"/></svg>';
  }

  function shuffledDeck() {
    var deck = SYMBOLS.concat(SYMBOLS);
    for (var i = deck.length - 1; i > 0; i--) { /* Fisher–Yates */
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  function createCard(sym) {
    var card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-sym', sym);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'memory card');
    card.innerHTML =
      '<div class="card-inner">' +
      '<div class="face face-back">' + heartSVG(22, 0.3) + '</div>' +
      '<div class="face face-front"><span class="sym">' + sym + '</span>' +
      '<span class="badge">' + heartSVG(14) + '</span></div>' +
      '</div>';
    return card;
  }

  function showMessage(text) {
    /* a new pair message cancels a pending reassurance fade-out */
    if (reassuranceTimer !== null) {
      clearTimeout(reassuranceTimer);
      reassuranceTimer = null;
    }
    msgEl.classList.remove('show');
    msgEl.textContent = text;
    void msgEl.offsetWidth; /* force reflow so the fade-in restarts */
    msgEl.classList.add('show');
  }

  function updateProgress() {
    progressText.textContent = matchedCount + ' / ' + TOTAL_PAIRS;
    for (var i = 0; i < matchedCount; i++) {
      var heart = document.getElementById('ph' + i);
      if (heart) {
        heart.classList.remove('ph-off');
        heart.classList.add('ph-on');
      }
    }
  }

  function showReassurance() {
    showMessage(REASSURANCE_MSG);
    reassuranceTimer = setTimeout(function () {
      reassuranceTimer = null;
      msgEl.classList.remove('show');
      setTimeout(function () {
        if (!msgEl.classList.contains('show')) {
          msgEl.textContent = '';
        }
      }, FADE_MS);
    }, REASSURANCE_HOLD_MS);
  }

  function winSequence() {
    boardLocked = true;
    setTimeout(function () {
      winOverlay.classList.add('show');
      setTimeout(function () {
        universeBtn.classList.add('show');
      }, BUTTON_DELAY_MS);
    }, WIN_DELAY_MS);
  }

  function activateCard(card) {
    if (boardLocked || !card) {
      return;
    }
    if (card.classList.contains('flipped') || card.classList.contains('matched')) {
      return;
    }

    card.classList.add('flipped');

    if (firstCard === null) {
      firstCard = card;
      return;
    }

    var cardA = firstCard;
    var cardB = card;
    firstCard = null;

    if (cardA.getAttribute('data-sym') === cardB.getAttribute('data-sym')) {
      /* a pair is found */
      cardA.classList.add('matched');
      cardB.classList.add('matched');
      matchedCount++;
      updateProgress();
      showMessage(PAIR_MSGS[cardB.getAttribute('data-sym')]);
      if (HINTS[matchedCount]) {
        hintEl.textContent = HINTS[matchedCount];
      }
      if (matchedCount === TOTAL_PAIRS) {
        winSequence();
      }
    } else {
      /* one mismatched pair = one wrong attempt */
      wrongAttempts++;
      boardLocked = true;
      if (wrongAttempts === 3 && !reassuranceShown) {
        reassuranceShown = true;
        showReassurance();
      }
      setTimeout(function () {
        cardA.classList.remove('flipped');
        cardB.classList.remove('flipped');
        boardLocked = false;
      }, FLIP_BACK_MS);
    }
  }

  /* ---------- events (delegated on the grid) ---------- */
  grid.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (card) {
      activateCard(card);
    }
  });

  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (card) {
      e.preventDefault();
      activateCard(card);
    }
  });

  universeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    location.replace('page4.html');
  });

  /* ---------- build the board ---------- */
  var deck = shuffledDeck();
  var fragment = document.createDocumentFragment();
  for (var d = 0; d < deck.length; d++) {
    fragment.appendChild(createCard(deck[d]));
  }
  grid.appendChild(fragment);

  /* tiny harmless debug hook */
  window.__game = {
    cards: Array.from(grid.children),
    state: function () {
      return { matched: matchedCount, wrong: wrongAttempts };
    }
  };
})();
