import qrcode from 'qrcode-generator';
import { config } from './config.js';
import './style.css';

/* values that change between releases live in config.js */
function setAll(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
setAll('[data-apk]', function (a) { a.href = config.apkUrl; a.setAttribute('download', 'chronoquest.apk'); });
setAll('[data-dash]', function (a) { a.href = config.dashboardUrl.replace(/\/$/, '') + '/login'; });
setAll('[data-apk-version]', function (n) { n.textContent = config.apkVersion; });
setAll('[data-apk-size]', function (n) { n.textContent = config.apkSize; });
setAll('[data-apk-meta]', function (n) { n.textContent = 'v' + config.apkVersion + ' · ' + config.apkSize; });
setAll('[data-email]', function (n) { n.textContent = config.contactEmail; });

(function () {
  /* QR code for the APK link */
  var qrEl = document.getElementById('qr');
  if (qrEl && qrcode) {
    try {
      var q = qrcode(0, 'M'); q.addData(new URL(config.apkUrl, location.href).href); q.make();
      qrEl.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {}
  }

  /* copy the contact email */
  var copy = document.getElementById('copy'), mail = document.getElementById('email');
  if (copy) copy.addEventListener('click', function () {
    function done() { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy email'; }, 1800); }
    try { navigator.clipboard.writeText(mail.textContent).then(done, function () { select(); }); } catch (e) { select(); }
    function select() { var r = document.createRange(); r.selectNodeContents(mail); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });

  var root = document.documentElement;

  /* mobile menu */
  var menu = document.getElementById('menu'), nav = document.getElementById('nav'), mq = window.matchMedia('(max-width: 860px)');
  function sync() { nav.hidden = mq.matches; menu.setAttribute('aria-expanded', 'false'); }
  sync();
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  menu.addEventListener('click', function () { var open = nav.hidden; nav.hidden = !open; menu.setAttribute('aria-expanded', String(open)); });
  nav.addEventListener('click', function (e) { if (mq.matches && e.target.closest('a')) sync(); });

  /* screens rail */
  var rail = document.getElementById('rail'), prev = document.getElementById('prev'), next = document.getElementById('next');
  function step() { var c = rail.querySelector('.phone'); return c ? c.getBoundingClientRect().width + 24 : 300; }
  function edges() { prev.disabled = rail.scrollLeft < 4; next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4; }
  prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
  rail.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  edges();

  /* ticker: duplicate the era names so the loop is seamless */
  var track = document.getElementById('track');
  track.innerHTML += track.innerHTML;
  Array.prototype.forEach.call(track.children, function (s, i) { if (i >= track.children.length / 2) s.setAttribute('aria-hidden', 'true'); });

  /* scroll progress bar */
  var prog = document.getElementById('prog'), tick = false;
  function onScroll() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var h = root.scrollHeight - window.innerHeight;
      prog.style.setProperty('--p', h > 0 ? Math.min(1, window.scrollY / h) : 0);
      tick = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* hero scene pauses when off screen */
  var stage = document.getElementById('stage');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { stage.classList.toggle('off', !es[0].isIntersecting); }).observe(stage);
  }

  /* reveal on scroll: only hide things once we know we can show them again */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('js');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--d'); }, 1200);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* tap a hero to make them run on touch screens */
  document.querySelectorAll('.hcard').forEach(function (c) {
    c.addEventListener('click', function () { c.classList.add('tap'); setTimeout(function () { c.classList.remove('tap'); }, 2400); });
  });
})();

/* tap a dashboard picture to see it bigger */
(function () {
  var imgs = document.querySelectorAll('.hl .browser img');
  if (!imgs.length || !window.HTMLDialogElement) return;
  var dlg = document.createElement('dialog');
  dlg.className = 'zoom';
  dlg.innerHTML = '<form method="dialog"><button class="zx" aria-label="Close">Close</button></form><img alt="">';
  document.body.appendChild(dlg);
  var big = dlg.querySelector('img');
  function open(img) { big.src = img.currentSrc || img.src; big.alt = img.alt; dlg.showModal(); }
  imgs.forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge: ' + img.alt);
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === big) dlg.close(); });
})();

/* old iPhones (before iOS 16) do not know cqw: size the hero scene in pixels instead */
(function () {
  var st = document.getElementById('stage');
  if (!st || (window.CSS && CSS.supports && CSS.supports('width', '1cqw'))) return;
  function fit() { st.style.setProperty('--u', (st.clientWidth / 100) + 'px'); }
  fit();
  window.addEventListener('resize', fit);
})();

/* iPhone and iPad cannot install an APK: say so instead of offering a download that goes nowhere */
(function () {
  var ua = navigator.userAgent || '';
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return;
  document.documentElement.classList.add('ios');
  document.querySelectorAll('[data-apk]').forEach(function (a) { a.removeAttribute('download'); a.setAttribute('href', '#install'); });
  document.querySelectorAll('[data-apk-meta], [data-apk-size]').forEach(function (n) { if (n.tagName === 'SMALL') n.textContent = 'Android only'; });
})();
