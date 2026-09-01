/* ============================================================
   Page 5 — One Last Thing · js/surprise.js
   Timed reveal of the final surprise, then home.
   ============================================================ */
(function () {
  'use strict';

  var el = function (id) { return document.getElementById(id); };
  var t1 = el('t1');
  var t2 = el('t2');
  var t3 = el('t3');
  var t4 = el('t4');
  var heart5 = el('heart5');
  var homeBtn = el('homeBtn');

  function show(node) { if (node) node.classList.add('show'); }

  function start() {
    setTimeout(function () { show(t1); }, 800);    /* +0.8s */
    setTimeout(function () { show(t2); }, 3000);   /* +2.2s */
    setTimeout(function () { show(t3); }, 5600);   /* +2.6s */
    setTimeout(function () { show(t4); }, 8800);   /* +3.2s */
    setTimeout(function () { show(heart5); }, 11200); /* +2.4s */
    setTimeout(function () { show(homeBtn); }, 12400); /* +1.2s */
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      location.replace('page1.html');   /* the only allowed way back */
    });
  }

  try { history.replaceState(null, '', location.pathname); } catch (err) { /* file:// etc. */ }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
