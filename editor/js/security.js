(function() {
  var btn = document.getElementById('security-btn');
  var overlay = document.getElementById('security-overlay');
  var closeBtn = document.getElementById('security-close');
  if (!btn || !overlay || !closeBtn) return;

  function open() {
    overlay.hidden = false;
    requestAnimationFrame(function() { overlay.classList.add('visible'); });
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onKey);
  }

  function close() {
    overlay.classList.remove('visible');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    setTimeout(function() {
      if (!overlay.classList.contains('visible')) overlay.hidden = true;
    }, 200);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  btn.addEventListener('click', function() {
    if (overlay.hidden) open(); else close();
  });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  var SEEN_KEY = 'bm-security-seen';
  if (!localStorage.getItem(SEEN_KEY)) {
    setTimeout(function() {
      open();
      localStorage.setItem(SEEN_KEY, '1');
    }, 400);
  }
})();
