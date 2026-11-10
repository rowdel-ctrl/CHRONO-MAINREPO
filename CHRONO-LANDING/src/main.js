import qrcode from 'qrcode-generator';
import { config } from './config.js';
import './style.css';

/* values that change between releases live in config.js */
function setAll(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
setAll('[data-apk]', function (a) { a.href = config.apkUrl; a.setAttribute('download', 'chronoquest.apk'); });
setAll('[data-tester]', function (a) { a.href = config.testerUrl; a.setAttribute('download', 'chronoquest-tester.apk'); });
setAll('[data-tester-version]', function (n) { n.textContent = config.testerVersion; });
setAll('[data-tester-size]', function (n) { n.textContent = config.testerSize; });
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

  /* tap the logo 5 times in a row to open the hidden tester download */
  var brand = document.getElementById('brand'), tester = document.getElementById('tester'), taps = 0, tapTimer;
  if (brand && tester) {
    brand.addEventListener('click', function (e) {
      taps += 1; clearTimeout(tapTimer); tapTimer = setTimeout(function () { taps = 0; }, 2000);
      if (taps < 5) return;
      taps = 0; e.preventDefault();
      if (tester.showModal) tester.showModal(); else tester.setAttribute('open', '');
    });
    tester.addEventListener('click', function (e) {
      if (e.target !== tester && !e.target.closest('[data-close]')) return;
      if (tester.close) tester.close(); else tester.removeAttribute('open');
    });
  }

  var root = document.documentElement;

  /* mobile menu */
  var menu = document.getElementById('menu'), nav = document.getElementById('nav'), mq = window.matchMedia('(max-width: 860px)');
  function sync() { nav.hidden = mq.matches; menu.setAttribute('aria-expanded', 'false'); }
  sync();
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  menu.addEventListener('click', function () { var open = nav.hidden; nav.hidden = !open; menu.setAttribute('aria-expanded', String(open)); });
  nav.addEventListener('click', function (e) { if (mq.matches && e.target.closest('a')) sync(); });

  /* ticker: duplicate the era names so the loop is seamless */
  var track = document.getElementById('track');
  if (track) {
    track.innerHTML += track.innerHTML;
    Array.prototype.forEach.call(track.children, function (s, i) { if (i >= track.children.length / 2) s.setAttribute('aria-hidden', 'true'); });
  }

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

  /* hero clip: plays only while it is on screen, and not at all if the visitor prefers less motion */
  var hv = document.getElementById('hvid');
  if (hv) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { hv.removeAttribute('autoplay'); hv.pause(); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); } else hv.pause(); }).observe(hv);
    }
  }

  /* wide screens drift slowly while you scroll */
  var wides = Array.prototype.slice.call(document.querySelectorAll('.wide-img'));
  var wtick = false;
  function drift() {
    wtick = false;
    var vh = window.innerHeight;
    wides.forEach(function (w) {
      var r = w.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      w.style.setProperty('--py', (Math.max(-1, Math.min(1, p)) * -26).toFixed(1) + 'px');
    });
  }
  if (wides.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', function () { if (!wtick) { wtick = true; requestAnimationFrame(drift); } }, { passive: true });
    window.addEventListener('resize', drift);
    drift();
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
