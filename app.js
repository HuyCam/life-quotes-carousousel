/* Life Quotes carousel. Plain script, no dependencies. */
(function () {
  'use strict';

  var THEMES = window.THEMES || [];
  var QUOTES = window.QUOTES || [];
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };

  var carousel = $('carousel'), emptyEl = $('empty'), chipsEl = $('chips');
  var counterEl = $('counter'), labelEl = $('themeLabel'), progressEl = $('progress');
  var btnFav = $('btnFav'), btnShuffle = $('btnShuffle'), btnFocus = $('btnFocus'), btnShare = $('btnShare');
  var toastEl = $('toast'), liveEl = $('live');
  var layers = [document.querySelector('.bg-a'), document.querySelector('.bg-b')];

  var byId = {}, themeById = {};
  QUOTES.forEach(function (q) { byId[q.id] = q; });
  THEMES.forEach(function (t) { themeById[t.id] = t; });

  var KEY_FAV = 'lq.fav', KEY_FILTER = 'lq.filter';
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var state = { filter: 'all', shuffle: false, order: [], pos: 0, favs: {}, focus: false };
  var slides = [], targetIdx = null, lastPos = -1, settleTimer = 0, announcedKey = '';
  var chipRefs = {};

  /* ---------- storage (never throws) ---------- */
  function load(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }

  /* ---------- helpers ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function words(t) { return t.trim().split(/\s+/).length; }
  function lenOf(t) { var w = words(t); return w <= 25 ? 's' : w <= 45 ? 'm' : 'l'; }
  function cur() { return byId[state.order[state.pos]] || null; }
  function domIdx(pos) { return state.order.length > 1 ? pos + 1 : pos; }
  function favCount() { return Object.keys(state.favs).length; }
  function shortName(t) { return t.name.split(/\s*(?:,|&)\s*/)[0]; }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  function getSet(f) {
    if (f === 'fav') return QUOTES.filter(function (q) { return state.favs[q.id]; });
    if (f === 'all') return QUOTES.slice();
    return QUOTES.filter(function (q) { return q.theme === f; });
  }
  function validFilter(f) { return f === 'all' || f === 'fav' || !!themeById[f]; }

  function permute(ids, firstId) {
    var a = ids.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    var k = a.indexOf(firstId);
    if (k > 0) { t = a[0]; a[0] = a[k]; a[k] = t; }
    return a;
  }

  /* ---------- slides ---------- */
  function makeSlide(id, clone, index) {
    var q = byId[id];
    var s = document.createElement('div');
    s.className = 'slide';
    s.setAttribute('data-theme', q.theme);
    s.setAttribute('data-len', lenOf(q.text));
    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'slide');
    var card = document.createElement('div'); card.className = 'card';
    var content = document.createElement('blockquote'); content.className = 'content';
    var mark = document.createElement('span'); mark.className = 'mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = '“';
    var p = document.createElement('p'); p.className = 'qtext'; p.textContent = q.text;
    var n = document.createElement('p'); n.className = 'qnum'; n.textContent = 'Quote ' + pad(q.id);
    content.appendChild(mark); content.appendChild(p); content.appendChild(n);
    card.appendChild(content); s.appendChild(card);
    if (clone) { s.setAttribute('aria-hidden', 'true'); s.setAttribute('tabindex', '-1'); s.setAttribute('data-clone', '1'); }
    else { s.setAttribute('aria-label', 'Quote ' + pad(q.id) + ' of ' + pad(state.order.length)); }
    return s;
  }

  function render() {
    var n = state.order.length, i;
    carousel.textContent = '';
    emptyEl.hidden = n > 0;
    carousel.hidden = n === 0;
    lastPos = -1; targetIdx = null;
    if (n) {
      var frag = document.createDocumentFragment();
      if (n > 1) frag.appendChild(makeSlide(state.order[n - 1], true));
      for (i = 0; i < n; i++) frag.appendChild(makeSlide(state.order[i], false, i));
      if (n > 1) frag.appendChild(makeSlide(state.order[0], true));
      carousel.appendChild(frag);
    }
    slides = Array.prototype.slice.call(carousel.children);
    if (n) carousel.scrollLeft = domIdx(state.pos) * carousel.clientWidth;
    settle(true);
  }

  function rebuild(keepId) {
    var set = getSet(state.filter).map(function (q) { return q.id; });
    state.order = state.shuffle ? permute(set, keepId) : set;
    var k = state.order.indexOf(keepId);
    state.pos = k < 0 ? 0 : k;
    render();
    updateChips();
  }

  /* ---------- settle: find which slide is showing, update UI ---------- */
  function onScroll() { clearTimeout(settleTimer); settleTimer = setTimeout(function () { settle(false); }, 90); }

  function settle(force) {
    var n = state.order.length;
    if (!n) { updateUI(); return; }
    var w = carousel.clientWidth;
    if (!w) return;
    var idx = force ? domIdx(state.pos) : Math.round(carousel.scrollLeft / w);
    var pos;
    if (n > 1) {
      if (idx <= 0) { idx = n; carousel.scrollLeft = n * w; }
      else if (idx >= n + 1) { idx = 1; carousel.scrollLeft = w; }
      pos = idx - 1;
    } else { pos = 0; }
    targetIdx = null;
    if (!force && pos === lastPos) return;
    state.pos = pos; lastPos = pos;
    updateUI();
  }

  function setTheme(slug) {
    var prev = root.getAttribute('data-theme');
    if (prev === slug) return;
    root.setAttribute('data-theme', slug);
    if (!prev) { layers[0].setAttribute('data-theme', slug); return; } // first paint: no crossfade
    var front = layers[0].classList.contains('on') ? layers[0] : layers[1];
    var back = front === layers[0] ? layers[1] : layers[0];
    back.setAttribute('data-theme', slug);
    back.classList.add('on'); front.classList.remove('on');
  }

  function hashFor(q) {
    var f = state.filter === 'fav' ? 'favorites' : state.filter;
    return '#' + (f !== 'all' ? 'theme=' + f + '&' : '') + 'q' + q.id;
  }

  function updateUI() {
    var n = state.order.length, q = cur(), i;
    for (i = 0; i < slides.length; i++) {
      var s = slides[i];
      if (s.getAttribute('data-clone')) continue;
      var active = (domIdx(state.pos) === i);
      s.classList.toggle('is-active', active);
      if (active) { s.removeAttribute('aria-hidden'); s.setAttribute('tabindex', '0'); }
      else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('tabindex', '-1'); }
    }
    counterEl.textContent = n ? pad(state.pos + 1) + ' / ' + pad(n) : '00 / 00';
    progressEl.style.transform = 'scaleX(' + (n ? (state.pos + 1) / n : 0) + ')';
    var themeSlug = themeById[state.filter] ? state.filter : (q ? q.theme : 'self');
    setTheme(themeSlug);
    labelEl.textContent = q ? themeById[q.theme].name : (state.filter === 'fav' ? 'Favorites' : '');
    updateFavBtn();
    if (q) {
      try { history.replaceState(null, '', hashFor(q)); } catch (e) { /* ignore */ }
      var key = state.filter + ':' + q.id;
      if (key !== announcedKey) { announcedKey = key; liveEl.textContent = 'Quote ' + pad(q.id) + ', ' + (state.pos + 1) + ' of ' + n; }
    }
  }

  function updateFavBtn() {
    var q = cur(), on = !!(q && state.favs[q.id]);
    btnFav.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnFav.setAttribute('aria-label', on ? 'Remove from favorites' : 'Add to favorites');
  }

  /* ---------- chips ---------- */
  function addChip(id, label, count, fullName, heart) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', 'false');
    if (heart) b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
    var l = document.createElement('span'); l.textContent = label;
    var c = document.createElement('span'); c.className = 'count';
    b.appendChild(l); b.appendChild(c);
    b.addEventListener('click', function () { setFilter(id); });
    chipsEl.appendChild(b);
    chipRefs[id] = { el: b, count: c, name: fullName };
  }
  function buildChips() {
    addChip('all', 'All', 0, 'All quotes');
    addChip('fav', 'Favorites', 0, 'Favorites', true);
    THEMES.forEach(function (t) { addChip(t.id, shortName(t), 0, t.name); });
  }
  function updateChips() {
    Object.keys(chipRefs).forEach(function (id) {
      var r = chipRefs[id], n = id === 'fav' ? favCount() : getSet(id).length;
      r.count.textContent = n;
      r.el.setAttribute('aria-pressed', id === state.filter ? 'true' : 'false');
      r.el.setAttribute('aria-label', r.name + ', ' + n + (n === 1 ? ' quote' : ' quotes'));
    });
    var a = chipRefs[state.filter];
    if (a) {
      var box = chipsEl, el = a.el;
      var target = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
      box.scrollTo({ left: Math.max(0, target), behavior: reduceMq.matches ? 'auto' : 'smooth' });
    }
  }

  function setFilter(f) {
    if (!validFilter(f)) f = 'all';
    var q = cur();
    state.filter = f; save(KEY_FILTER, f);
    rebuild(q ? q.id : undefined);
  }

  /* ---------- navigation ---------- */
  function goIdx(di, instant) {
    var w = carousel.clientWidth;
    targetIdx = di;
    carousel.scrollTo({ left: di * w, behavior: (instant || reduceMq.matches) ? 'auto' : 'smooth' });
  }
  function step(d) {
    var n = state.order.length;
    if (n < 2) return;
    var w = carousel.clientWidth;
    var base = targetIdx != null ? targetIdx : Math.round(carousel.scrollLeft / w);
    goIdx(Math.max(0, Math.min(n + 1, base + d)));
  }
  function goPos(p) { if (state.order.length) goIdx(domIdx(p), true); }

  /* ---------- actions ---------- */
  function toggleFav(burstX, burstY) {
    var q = cur(); if (!q) return;
    var on;
    if (state.favs[q.id]) { delete state.favs[q.id]; on = false; } else { state.favs[q.id] = true; on = true; }
    save(KEY_FAV, JSON.stringify(Object.keys(state.favs).map(Number)));
    updateFavBtn(); updateChips0();
    btnFav.classList.remove('pop'); void btnFav.offsetWidth; if (!reduceMq.matches) btnFav.classList.add('pop');
    vibrate(10);
    if (typeof burstX === 'number') spawnBurst(burstX, burstY);
    liveEl.textContent = on ? 'Added to favorites' : 'Removed from favorites';
  }
  function updateChips0() { // counts and pressed state only (no chip-row scrolling)
    var r = chipRefs.fav, n = favCount();
    r.count.textContent = n;
    r.el.setAttribute('aria-label', 'Favorites, ' + n + (n === 1 ? ' quote' : ' quotes'));
  }
  function spawnBurst(x, y) {
    var d = document.createElement('div');
    d.className = 'burst'; d.style.left = x + 'px'; d.style.top = y + 'px';
    d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>';
    document.body.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, reduceMq.matches ? 400 : 650);
  }

  function toggleShuffle() {
    var q = cur();
    state.shuffle = !state.shuffle;
    btnShuffle.setAttribute('aria-pressed', state.shuffle ? 'true' : 'false');
    rebuild(q ? q.id : undefined);
    vibrate(10);
    toast(state.shuffle ? 'Shuffle on' : 'Shuffle off');
  }

  var toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    liveEl.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1600);
  }

  function quoteText(q) { return '"' + q.text + '" - Life Quotes'; }
  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      toast(ok ? 'Copied' : 'Could not copy');
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }
  function copyQuote() { var q = cur(); if (q) copyText(quoteText(q)); }
  function shareQuote() {
    var q = cur(); if (!q) return;
    var data = { text: quoteText(q) };
    if (/^https?:$/.test(location.protocol)) data.url = location.href;
    if (navigator.share) {
      var p;
      try { p = navigator.share(data); } catch (e) { copyText(data.text); return; }
      if (p && p.catch) p.catch(function (e) { if (!e || e.name !== 'AbortError') copyText(data.text); });
    } else { copyText(data.text); }
  }

  var enteredFs = false;
  function setFocus(on) {
    state.focus = on;
    root.classList.toggle('focus', on);
    btnFocus.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnFocus.setAttribute('aria-label', on ? 'Exit focus mode' : 'Focus mode');
    try {
      if (on && root.requestFullscreen && window.matchMedia('(hover: hover)').matches && !document.fullscreenElement) {
        var p = root.requestFullscreen(); enteredFs = true;
        if (p && p.catch) p.catch(function () { enteredFs = false; });
      } else if (!on && document.fullscreenElement && document.exitFullscreen) {
        enteredFs = false; document.exitFullscreen();
      }
    } catch (e) { enteredFs = false; }
    if (on) { try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) {} }
  }
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && enteredFs) { enteredFs = false; if (state.focus) setFocus(false); }
  });

  /* ---------- hash ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '');
    var t = /(?:^|&)theme=([a-z]+)/.exec(h), q = /(?:^|&)q(\d+)(?:&|$)/.exec(h);
    var theme = t ? (t[1] === 'favorites' ? 'fav' : t[1]) : null;
    return { theme: theme && validFilter(theme) ? theme : null, id: q && byId[+q[1]] ? +q[1] : null };
  }
  function applyHash() {
    var p = parseHash(), f = state.filter, id = p.id;
    if (p.theme) f = p.theme;
    else if (id != null && getSet(f).every(function (q) { return q.id !== id; })) f = 'all';
    var q = cur();
    if (f === state.filter && (id == null || (q && q.id === id))) return;
    state.filter = f; save(KEY_FILTER, f);
    rebuild(id != null ? id : undefined);
  }
  window.addEventListener('hashchange', applyHash);

  /* ---------- input ---------- */
  carousel.addEventListener('scroll', onScroll, { passive: true });

  var tapTimer = 0, lastTap = 0, lastX = 0, lastY = 0;
  carousel.addEventListener('click', function (e) {
    if (!state.order.length) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed) return;
    var r = carousel.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (x < 0.25) { step(-1); return; }
    if (x > 0.75) { step(1); return; }
    var now = Date.now();
    if (tapTimer && now - lastTap < 320 && Math.abs(e.clientX - lastX) < 40 && Math.abs(e.clientY - lastY) < 40) {
      clearTimeout(tapTimer); tapTimer = 0;
      toggleFav(e.clientX, e.clientY);
      return;
    }
    lastTap = now; lastX = e.clientX; lastY = e.clientY;
    tapTimer = setTimeout(function () { tapTimer = 0; setFocus(!state.focus); }, 280);
  });

  $('btnPrev').addEventListener('click', function () { step(-1); });
  $('btnNext').addEventListener('click', function () { step(1); });
  btnFav.addEventListener('click', function () { toggleFav(); });
  btnShuffle.addEventListener('click', toggleShuffle);
  btnShare.addEventListener('click', shareQuote);
  btnFocus.addEventListener('click', function () { setFocus(!state.focus); });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, handled = true;
    switch (k) {
      case 'ArrowLeft': case 'PageUp': step(-1); break;
      case 'ArrowRight': case 'PageDown': step(1); break;
      case 'Home': goPos(0); break;
      case 'End': goPos(state.order.length - 1); break;
      case 's': case 'S': toggleShuffle(); break;
      case 'f': case 'F': toggleFav(); break;
      case 'c': case 'C': copyQuote(); break;
      case 'Escape': if (state.focus) setFocus(false); else handled = false; break;
      case 't': case 'T': case '/':
        if (state.focus) setFocus(false);
        var a = chipRefs[state.filter]; if (a) a.el.focus();
        break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  var resizeRaf = 0;
  function onResize() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () {
      if (state.order.length) carousel.scrollLeft = domIdx(state.pos) * carousel.clientWidth;
    });
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* ---------- init ---------- */
  (function init() {
    try { JSON.parse(load(KEY_FAV) || '[]').forEach(function (id) { if (byId[id]) state.favs[id] = true; }); } catch (e) {}
    var f = load(KEY_FILTER);
    state.filter = validFilter(f) && !(f === 'fav' && !favCount()) ? f : 'all';
    buildChips();
    layers[0].classList.add('on');
    var p = parseHash(), id = p.id, f2 = state.filter;
    if (p.theme) f2 = p.theme;
    else if (id != null && getSet(f2).every(function (q) { return q.id !== id; })) f2 = 'all';
    state.filter = f2;
    rebuild(id != null ? id : undefined);
  })();
})();
