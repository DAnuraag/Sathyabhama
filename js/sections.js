// ════════════════════════════════════════════════════════════════
//  SECTIONS: content rendering (from config.js) + scroll animations.
//  Order: hero → okay, so… → what I love about you → our future → little notes (card deck) → photos (if any) → letter → finale
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { burstHearts, releaseButterflies, throwKisses } from './effects.js';
import { renderPhotos, setupPhotos } from './photos.js';
import { setupNight } from './night.js';
import { tapSound, finalSound } from './sfx.js';
import { addTapHints } from './hints.js';
import { addScrollLock } from './lock.js';
import { renderReasons, renderNotes, setupReasons, setupNotes } from './trail.js';

/* pixel icons (Pixelarticons, MIT): inlined so they take the card's colour. Key = file name without .svg */
const ICONS = Object.fromEntries(Object.entries(
  import.meta.glob('../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })
).map(([path, svg]) => [path.split('/').pop().replace('.svg', ''), svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')]));

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = gsap.utils.random;

/* ───────────── RENDER (runs once) ───────────── */
export function renderContent(cfg, reduced) {
  document.title = cfg.heroTitle;
  $('#heroSubtitle').textContent = cfg.heroSubtitle;

  // every plain text node that comes straight from config.js: <el data-copy="configKey">
  $$('[data-copy]').forEach(el => { el.textContent = cfg[el.dataset.copy] ?? ''; });

  // story: each line split into words for the scroll reveal
  $('#storyLines').innerHTML = cfg.storyLines.map(l => `<div class="story__beat"><p class="story__line">${esc(l)}</p></div>`).join('');
  const storySplits = $$('.story__line').map(p => new SplitType(p, { types: 'words' }));

  // reasons (a trail with an animal next to each) + the deck of little notes
  renderReasons(cfg, ICONS);
  renderNotes(cfg, ICONS);

  // our future: heading + body split into words, chips, the pixel heart
  $('#futureChips').innerHTML = cfg.futureChips.map(c => `<li class="future__chip">${esc(c)}</li>`).join('');
  const futureSplits = { title: new SplitType('#futureTitle', { types: 'words' }), body: new SplitType('#futureBody', { types: 'words' }) };
  buildHeart();

  // photos (only if assets/photos/ has pictures)
  renderPhotos(cfg);

  // little pulsing dots on the things you can tap
  addTapHints();
  return { storySplits, futureSplits };
}

/* ───────────── THE PIXEL HEART (a 15 × 13 grid → one <rect> per pixel, grouped by row) ─────────────
   Every pixel is its own SVG rect, so on scroll they can fly in from all around and snap into place.
   17 × 15 viewBox = the grid + 1 px of outline padding. */
const HEART = [
  '..####...####..',
  '.######.######.',
  '###############',
  '###############',
  '###############',
  '###############',
  '.#############.',
  '..###########..',
  '...#########...',
  '....#######....',
  '.....#####.....',
  '......###......',
  '.......#.......'
];
const HIGHLIGHT = new Set(['1,2', '1,3', '2,1', '2,2', '1,9', '1,10']);

function buildHeart() {
  const rows = HEART.length, cols = HEART[0].length;
  const fill = (r, c) => HEART[r]?.[c] === '#';
  const N4 = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  let out = '';
  for (let r = -1; r <= rows; r++) {
    let row = '';
    for (let c = -1; c <= cols; c++) {
      let k;
      if (fill(r, c)) k = HIGHLIGHT.has(`${r},${c}`) ? 'h' : (!fill(r + 1, c) || (c >= 7 && !fill(r, c + 1))) ? 's' : 'b';
      else if (N4.some(([dr, dc]) => fill(r + dr, c + dc))) k = 'o';              // 1 px outline
      else continue;
      row += `<rect class="px-${k}" x="${c + 1}" y="${r + 1}" width="1" height="1"/>`;
    }
    if (row) out += `<g class="px-row">${row}</g>`;
  }
  $('#bheartM').innerHTML = `<svg viewBox="0 0 ${cols + 2} ${rows + 2}" shape-rendering="crispEdges" focusable="false" aria-hidden="true">${out}</svg>`;
}

/* floating sparkles + soft hearts around the heart: [type, left%, top%, depth, size] */
const FLOATERS = [
  ['sparkle', 6, 16, 0.6], ['heart', 90, 10, 1.3, 'mid'], ['heart', 12, 74, 0.5, 'far'], ['sparkle', 84, 72, 0.9],
  ['heart', 96, 44, 1.5, 'near'], ['sparkle', 30, 4, 1.0], ['heart', 52, 94, 0.8, 'far'], ['sparkle', 64, 88, 1.5], ['heart', 2, 44, 1.2, 'mid']
];
function buildFloaters(host, mobile) {
  host.innerHTML = '';
  return FLOATERS.slice(0, mobile ? 5 : FLOATERS.length).map(([type, x, y, d, size], i) => {
    const o = type === 'sparkle' ? 0.95 : size === 'far' ? 0.4 : size === 'near' ? 0.4 : 0.75;
    const wrap = document.createElement('span'); wrap.className = 'fl'; wrap.style.left = x + '%'; wrap.style.top = y + '%';
    const s = document.createElement('span'); s.className = 'fl__s'; s.style.setProperty('--o', o);
    const inner = document.createElement('i');
    inner.className = type === 'sparkle' ? 'sparkle' : `heart heart--${size}`;
    if (type === 'heart') inner.style.setProperty('--hs', { far: 14, mid: 26, near: 66 }[size] + 'px');
    s.appendChild(inner); wrap.appendChild(s); host.appendChild(wrap);
    return { wrap, s, inner, d, o, type, i };
  });
}

/* ───────────── ANIMATIONS (called inside gsap.matchMedia) ───────────── */
export function initSectionAnimations(cfg, refs, { reduced, mobile }) {
  const cleanups = [];
  if (reduced) { setupFuture(cfg, refs, { reduced: true, mobile }, cleanups); setupReasons(true, cleanups); setupPhotos(cfg, true, cleanups); setupFinale(cfg, true, cleanups, setupNight(cfg, { reduced: true, mobile }, cleanups)); setupLetter(cfg, true, cleanups); return () => cleanups.forEach(f => f()); }

  /* 2 · HERO: pinned ~100vh (+80%) while the artwork travels past. The only pin left on the page. */
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=80%', pin: true, pinSpacing: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true } })
    .to('#heroSubtitle', { opacity: 0, y: -50, ease: 'none', duration: 0.5 }, 0.3)
    .to('#scrollChip', { opacity: 0, ease: 'none', duration: 0.3 }, 0.1);

  /* 3 · HOW THIS STARTED: word-by-word, 20% → 100% opacity */
  refs.storySplits.forEach(sp => {
    gsap.fromTo(sp.words, { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: sp.elements[0], start: 'top 82%', end: 'top 38%', scrub: true } });
  });

  /* 4 · WHAT I LOVE ABOUT YOU: a trail: words glide in, an animal walks in beside each, three parallax depths */
  setupReasons(false, cleanups);

  setupFuture(cfg, refs, { reduced: false, mobile }, cleanups);
  /* butterflies are clickable only in the hero, story and finale: elsewhere they'd swallow taps meant for the cards, the heart, the envelope... */
  let blockers = 0;
  ['#reasons', '#future', '#notes', '#photos', '#letter'].forEach(sel =>
    ScrollTrigger.create({ trigger: sel, start: 'top 92%', end: 'bottom 8%',
      onToggle: st => { blockers += st.isActive ? 1 : -1; document.body.classList.toggle('no-bfly-hit', blockers > 0); } }));
  cleanups.push(() => document.body.classList.remove('no-bfly-hit'));

  setupNotes(cfg, { reduced: false, mobile }, cleanups);
  setupPhotos(cfg, false, cleanups);
  setupLetter(cfg, false, cleanups);
  setupFinale(cfg, false, cleanups, setupNight(cfg, { reduced: false, mobile }, cleanups));

  // finale entrance
  gsap.from(['#counter', '#loveBtn'], { opacity: 0, y: 50, stagger: 0.18, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '#counter', start: 'top 88%', toggleActions: 'play none none reverse' } });
  gsap.from('.finale__head', { opacity: 0, y: 40, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.finale__head', start: 'top 85%', toggleActions: 'play none none reverse' } });
  ['#story .section-head', '#reasons .section-head', '#photos .section-head', '#letter .section-head'].forEach(sel =>
    gsap.from(sel, { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: sel, start: 'top 88%', once: true } }));

  return () => cleanups.forEach(f => f());
}

/* ───────────── 5 · OUR FUTURE: the heart builds itself, pixel by pixel ─────────────
   Desktop: the section is tall, its inner box is CSS-sticky, and ONE scrubbed timeline spans the whole stretch.
   Pixels scatter in from all around and snap together from the bottom up, then a warm glow + a heartbeat.
   Phones: heart and text are stacked, so each gets its own timeline, and the heart builds row by row (15 groups instead of 185 rects).
   Reduced motion: the finished heart, no tweens. Only transform + opacity animate. */
function setupFuture(cfg, refs, { reduced, mobile }, cleanups) {
  const root = $('#future'), host = $('#futureFloaters');
  const flo = buildFloaters(host, mobile);
  const btn = $('#bheart'), svg = $('svg', btn), hint = $('#futureTap');
  cleanups.push(() => { host.innerHTML = ''; });

  /* tap / click the heart: every tap gets a sound and a bigger effect than the one before; the last tap (config: futureTapMax) is the biggest.
     Then the count starts over. Hearts + butterflies + rings + glow are live effects, the chimes come from sfx.js. */
  const MAX = Math.max(2, cfg.futureTapMax || 8);
  let taps = 0, chain = 0, fx = null;
  const fxLayer = () => fx || (fx = Object.assign(document.createElement('div'), { className: 'tap-fx', ariaHidden: 'true' }), document.body.appendChild(fx), fx);
  const ring = (x, y, size, delay, hue) => {                       // a ring that spreads out from the heart
    const el = document.createElement('i'); el.className = 'tap-ring'; el.style.cssText = `left:${x}px;top:${y}px;--rs:${size}px;${hue ? 'border-color:' + hue : ''}`;
    fxLayer().appendChild(el);
    gsap.fromTo(el, { scale: 0.1, opacity: 0.85 }, { scale: 1, opacity: 0, duration: 1.1, delay, ease: 'power2.out', onComplete: () => el.remove() });
  };
  const glow = (x, y, size, peak, dur) => {                         // a soft pink flash behind the heart
    const el = document.createElement('i'); el.className = 'tap-glow'; el.style.cssText = `left:${x}px;top:${y}px;--rs:${size}px`;
    fxLayer().appendChild(el);
    gsap.fromTo(el, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: peak, duration: dur * 0.25, ease: 'power2.out' });
    gsap.to(el, { opacity: 0, scale: 1.25, duration: dur * 0.75, delay: dur * 0.25, ease: 'power1.in', onComplete: () => el.remove() });
  };
  const flash = () => {                                             // the last tap: the whole screen blushes for a moment
    const el = document.createElement('i'); el.className = 'tap-flash'; fxLayer().appendChild(el);
    gsap.fromTo(el, { opacity: 0 }, { opacity: 0.55, duration: 0.18, ease: 'power2.out' });
    gsap.to(el, { opacity: 0, duration: 1.4, delay: 0.2, ease: 'power1.inOut', onComplete: () => el.remove() });
  };
  const squeeze = () => {
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
    const i = chain, last = i === MAX - 1, k = (i + 1) / MAX;      // k climbs 0.12 → 1
    const replies = cfg.futureTapReplies || [];
    hint.textContent = last ? (cfg.futureTapFinal || '') || replies[i % replies.length] || '' : replies.length ? replies[i % replies.length] : hint.textContent;
    last ? finalSound() : tapSound(i, MAX);
    const n = last ? (reduced ? 40 : 110) : Math.round((reduced ? 5 : 7) + (reduced ? 12 : 34) * k * k);
    burstHearts(cx, cy, n, last ? { dist: [120, 620], size: [18, 64] } : { dist: [70, 150 + 190 * k], size: [12, 22 + 16 * k] });
    chain = last ? 0 : chain + 1; taps++;
    if (reduced) return;
    ring(cx, cy, 160 + 360 * k, 0);
    glow(cx, cy, 300 + 520 * k, 0.28 + 0.4 * k, 0.9 + k * 0.5);
    if (last) { ring(cx, cy, 760, 0.12, '#ffd6a0'); ring(cx, cy, 1000, 0.26); ring(cx, cy, 1300, 0.4, '#fff'); flash(); }
    const tl = gsap.timeline({ onComplete: () => gsap.set(svg, { clearProps: 'transform' }) })
      .to(svg, { scale: 0.92 - 0.04 * k, duration: 0.1, ease: 'power2.out', transformOrigin: '50% 75%' })
      .to(svg, { scale: 1.1 + 0.2 * k, duration: 0.14, ease: 'power2.out' });
    if (last) tl.to(svg, { scale: 1.0, duration: 0.12 }).to(svg, { scale: 1.3, duration: 0.14, ease: 'power2.out' });   // a double heartbeat
    tl.to(svg, { scale: 1, duration: 0.7 + 0.5 * k, ease: 'elastic.out(1, 0.4)' });
    if (i === 3) releaseButterflies(cx, r.top + r.height / 2, 3);
    else if (i === 5) releaseButterflies(cx, r.top + r.height / 2, 5);
    else if (last) { releaseButterflies(cx, r.top + r.height / 2, mobile ? 9 : 14); setTimeout(() => burstHearts(cx, cy, mobile ? 30 : 60, { dist: [200, 760], size: [14, 40] }), 380); }
  };
  btn.addEventListener('click', squeeze);
  cleanups.push(() => btn.removeEventListener('click', squeeze));

  if (reduced) return;                                        // CSS shows the finished heart, text visible

  const bm = $('#bheartM'), aura = $('#futureAura'), chips = $$('.future__chip');
  const pixels = $$('rect', svg).reverse();                   // bottom row first
  const rowsEl = $$('.px-row', svg).reverse();
  let visible = false;

  const make = (trigger, start, end) => gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger, start, end, scrub: 0.8, invalidateOnRefresh: true } });
  const tl = mobile ? make('.future__art', 'top 85%', 'bottom 38%') : make(root, 'top 40%', 'bottom bottom');
  const tlText = mobile ? make('.future__text', 'top 88%', 'bottom 62%') : tl;

  /* the pixels: random start spot, spin and size; same landing spot. Stagger runs bottom → top. */
  if (mobile) {
    tl.fromTo(rowsEl, { x: i => (i % 2 ? 1 : -1) * R(30, 60), y: () => R(20, 46), opacity: 0 },
      { x: 0, y: 0, opacity: 1, duration: 0.3, stagger: 0.035, ease: 'power2.out' }, 0);
  } else {
    tl.fromTo(pixels, { x: () => R(-17, 17), y: () => R(-16, 16), rotation: () => R(-220, 220), scale: () => R(0.2, 1.9), opacity: 0, transformOrigin: '50% 50%' },
      { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.22, stagger: { each: 0.0018 }, ease: 'back.out(1.3)' }, 0);
  }
  /* then: warm glow, one heartbeat (two quick pulses), sparkles */
  tl.fromTo(aura, { opacity: 0.1, scale: 0.75 }, { opacity: 0.95, scale: 1, duration: 0.5 }, 0.3)
    .to(bm, { scale: 1.07, duration: 0.05, ease: 'power2.out' }, 0.6)
    .to(bm, { scale: 1, duration: 0.07, ease: 'power2.in' }, 0.65)
    .to(bm, { scale: 1.05, duration: 0.05, ease: 'power2.out' }, 0.74)
    .to(bm, { scale: 1, duration: 0.09, ease: 'power2.in' }, 0.79)
    .fromTo(hint, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.12 }, 0.82);

  /* words fade in while the heart assembles */
  const { title, body } = refs.futureSplits;
  tlText.fromTo('#future .future__text .eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08 }, 0)
    .fromTo(title.words, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.1, stagger: 0.04, ease: 'power2.out' }, 0.04)
    .fromTo(body.words, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.06, stagger: 0.0075 }, 0.22)
    .fromTo(chips, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.1, stagger: 0.06, ease: 'power2.out' }, 0.72);

  /* sparkles + soft hearts: nearer ones travel further on scroll, then twinkle / float on their own */
  const ambient = [];
  flo.forEach(f => {
    tl.fromTo(f.s, { y: 70 * f.d }, { y: -70 * f.d, duration: 1 }, 0)
      .fromTo(f.s, { opacity: 0 }, { opacity: f.o, duration: 0.2 }, 0.55 + f.i * 0.03);
    ambient.push(f.type === 'sparkle'
      ? gsap.fromTo(f.inner, { scale: 0.55, rotation: 0 }, { scale: 1.25, rotation: 45, duration: R(1.2, 2.2), delay: R(0, 1.5), yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true })
      : gsap.to(f.inner, { y: -12 * f.d, rotation: R(-12, 12), duration: R(2.4, 4), yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true }));
  });
  tl.set({}, {}, 1); if (tlText !== tl) tlText.set({}, {}, 1);   // timeline length = exactly 1

  /* the heart section holds: first at the start of the pin, then (one scroll later) with the heart finished and tappable. Desktop only: on phones it isn't pinned. */
  if (!mobile) {
    const pin = ScrollTrigger.create({ trigger: root, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true });
    cleanups.push(() => pin.kill(), addScrollLock({ stops: () => [pin.start, pin.end], duration: 2.2 }));
  }

  /* ambient tweens only run while the section is on screen */
  ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: s => { visible = s.isActive; ambient.forEach(t => (visible ? t.resume() : t.pause())); } });

  /* mouse depth: the heart, the aura and every floater get their own strength */
  if (!mobile && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const q = (el, mx, my) => ({ x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }), mx, my });
    const rigs = [q(bm, 14, 8), q(aura, -10, -6), ...flo.map(f => q(f.wrap, -18 * f.d, -12 * f.d))];
    const onMove = e => {
      if (!visible) return;
      const nx = (e.clientX / innerWidth - 0.5) * 2, ny = (e.clientY / innerHeight - 0.5) * 2;
      rigs.forEach(r => { r.x(nx * r.mx); r.y(ny * r.my); });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    cleanups.push(() => window.removeEventListener('pointermove', onMove));
  }
}

/* ───────────── 6 · LETTER: no text. Break the seal and kisses + hearts are thrown at the screen ───────────── */
function setupLetter(cfg, reduced, cleanups) {
  const seal = $('#seal'), flap = $('#flap'), env = $('#envelope'), hint = $('#letterHint'), glow = $('#envGlow'), letterSec = $('#letter');
  if (reduced) { letterSec.classList.add('is-open'); return; }          // CSS shows a still row of kisses and hearts instead

  gsap.set(flap, { transformPerspective: 1100 });
  const phone = () => matchMedia('(max-width: 768px)').matches;
  const mouth = () => { const r = env.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.34]; };
  let opened = false, last = 0;

  const open = () => {
    if (opened) return; opened = true;
    seal.disabled = true;
    const sr = seal.getBoundingClientRect();
    burstHearts(sr.left + 33, sr.top + 33, 12);
    gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      .to(seal, { scale: 1.6, opacity: 0, rotation: 25, duration: 0.45, ease: 'power2.in' })
      .to(hint, { opacity: 0, duration: 0.3 }, 0)
      .to(flap, { rotationX: -180, duration: 0.9, transformOrigin: '50% 0' }, 0.3)
      .set(flap, { zIndex: 1 }, 0.65)
      .set(seal, { display: 'none' }, 0.5)
      .to(glow, { opacity: 1, duration: 0.7 }, 0.7)
      .to(env, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.0)
      .add(() => { const [x, y] = mouth(); throwKisses(x, y, phone() ? 60 : 110); releaseButterflies(x, y, 5); }, 1.1)
      .add(() => {                                                       // afterwards the whole envelope is a button: tap for more
        hint.textContent = cfg.letterHintAfter;
        env.tabIndex = 0; env.setAttribute('role', 'button'); env.setAttribute('aria-label', cfg.letterHintAfter); env.classList.add('is-again');
        gsap.to(hint, { opacity: 1, duration: 0.6 });
      }, 3.4);
    last = performance.now() + 2400;
  };
  const more = () => {
    if (!opened || performance.now() - last < 1500) return;
    last = performance.now();
    const [x, y] = mouth(); throwKisses(x, y, phone() ? 36 : 65);
  };
  const onEnv = e => { if (!e.target.closest('#seal')) more(); };
  const onKey = e => { if (opened && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); more(); } };
  seal.addEventListener('click', open);
  env.addEventListener('click', onEnv);
  env.addEventListener('keydown', onKey);
  cleanups.push(() => { seal.removeEventListener('click', open); env.removeEventListener('click', onEnv); env.removeEventListener('keydown', onKey); });
}

/* ───────────── 7 · FINALE: "Since we started:" counter + the button ───────────── */
function setupFinale(cfg, reduced, cleanups, night) {
  const start = new Date(cfg.anniversaryDate).getTime();
  const els = { d: $('#cDays'), h: $('#cHrs'), m: $('#cMin'), s: $('#cSec'), dU: $('#cDaysU'), hU: $('#cHrsU') }, box = $('#counter');
  const tick = () => {
    // a missing / invalid / future date shows 0 days, 0 hrs, 0 min, 0 sec instead of NaN
    let diff = Number.isFinite(start) ? Math.max(0, Date.now() - start) / 1000 : 0;
    const d = Math.floor(diff / 86400); diff -= d * 86400;
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60), s = Math.floor(diff - m * 60);
    els.d.textContent = d.toLocaleString('en-IN'); els.h.textContent = h; els.m.textContent = m; els.s.textContent = s;
    els.dU.textContent = d === 1 ? 'day' : 'days'; els.hU.textContent = h === 1 ? 'hr' : 'hrs';
    box.setAttribute('aria-label', `${cfg.counterLabel} ${d} ${d === 1 ? 'day' : 'days'}, ${h} ${h === 1 ? 'hr' : 'hrs'}, ${m} min, ${s} sec`);
  };
  tick(); const iv = setInterval(tick, 1000); cleanups.push(() => clearInterval(iv));

  const btn = $('#loveBtn'), msg = $('#finalMessage');
  let shown = false;
  const onClick = () => {
    const r = btn.getBoundingClientRect();
    burstHearts(r.left + r.width / 2, r.top + r.height / 2, reduced ? 12 : 34);
    night.preload();
    if (!night.busy) setTimeout(() => night.transition(), reduced ? 500 : 1100);   // a beat for the message, then hearts fill the screen
    if (shown) return; shown = true;
    btn.setAttribute('aria-expanded', 'true');
    msg.textContent = cfg.finalMessage;
    if (reduced) return;
    releaseButterflies(r.left + r.width / 2, r.top, 8);
    const sp = new SplitType(msg, { types: 'words' });
    gsap.fromTo(sp.words, { opacity: 0, y: 28, rotationX: -70, scale: 0.85 }, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.9, stagger: 0.07, ease: 'back.out(1.6)' });
    gsap.to(btn, { scale: 1.06, duration: 0.7, yoyo: true, repeat: 3, ease: 'sine.inOut' });
    setTimeout(() => burstHearts(r.left + r.width / 2, r.top, 26), 450);
  };
  btn.addEventListener('click', onClick);
  cleanups.push(() => btn.removeEventListener('click', onClick));
}
