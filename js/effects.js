// ════════════════════════════════════════════════════════════════
//  EFFECTS: loader, sun/moon/stars, mist, hearts pool, birds, petals,
//  sparkles, glass chips, custom cursor, particles, music, heart burst.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import SplitType from 'split-type';
import { view, pointer, probeImage } from './parallax.js';
import { SCENE, ART_DIR } from './layers.js';
import { perf } from './perf.js';

const R = gsap.utils.random;
const mk = (cls, tag = 'div', parent) => { const e = document.createElement(tag); e.className = cls; parent?.appendChild(e); return e; };
const isMobile = () => matchMedia('(max-width: 768px)').matches;
export const HEART_SVG = c => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 28'><path fill='${c}' d='M16 27.5C4 19 0 12.5 0 8 0 3.5 3.5 0 8 0c3.5 0 6.5 2 8 5C17.5 2 20.5 0 24 0c4.5 0 8 3.5 8 8 0 4.5-4 11-16 19.5Z'/></svg>`)}`;

/* ───────────── 1 · LOADER ───────────── */
export function createLoader(partner) {
  const root = document.getElementById('loader');
  const fill = root.querySelector('.loader__fill');
  const pct = document.getElementById('loaderPct');
  root.querySelector('.loader__for').textContent = `for ${partner}`;
  gsap.set(fill, { y: 28 });
  const state = { p: 0 };
  return {
    progress(p) {
      gsap.to(state, { p, duration: 0.5, ease: 'power1.out', overwrite: true,
        onUpdate: () => { gsap.set(fill, { y: 28 * (1 - state.p) }); pct.textContent = Math.round(state.p * 100); } });
    },
    out() {
      return new Promise(res => {
        gsap.timeline({ onComplete: () => { root.remove(); document.body.classList.remove('is-loading'); res(); } })
          .to(state, { p: 1, duration: 0.45, onUpdate: () => { gsap.set(fill, { y: 28 * (1 - state.p) }); pct.textContent = Math.round(state.p * 100); } })
          .to(root.querySelector('.loader__heart'), { scale: 1.18, duration: 0.45, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '50% 60%' }, '<')
          .to(root.querySelector('.loader__text'), { opacity: 0, duration: 0.3 }, '-=0.2')
          .to(root.querySelector('.loader__heart'), { y: -120, opacity: 0, duration: 0.7, ease: 'power3.in' }, '+=0.05')
          .to(root, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, '-=0.3');
      });
    }
  };
}

/* ───────────── 2 · SUN (+ heart halo), MOON, STARS ───────────── */
export function mountSky(items) {
  const sunWrap = mk('sun', 'div', items.sun);
  const halo = mk('sun__halo', 'div', sunWrap);
  const disc = mk('sun__disc', 'div', sunWrap);
  const hot = mk('sun__hot', 'div', sunWrap);
  const moonWrap = mk('moon', 'div', items.moon);
  mk('moon__halo', 'div', moonWrap); mk('moon__disc', 'div', moonWrap);
  moonWrap.style.setProperty('--moon-x', view.vw * (view.vw > 800 ? 0.3 : 0.5) + 'px');

  const canvas = mk('stars-canvas', 'canvas', items.stars);
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;opacity:0';
  const stars = initStars(canvas);
  return { sun: sunWrap, halo, disc, hot, moon: moonWrap, stars };
}

function initStars(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, list = [], shoot = [], nextShoot = 3;
  const build = () => {
    dpr = perf.dpr(2);
    W = canvas.width = Math.round(view.vw * dpr); H = canvas.height = Math.round(view.vh * dpr);
    const n = isMobile() ? 90 : 190;
    list = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.pow(Math.random(), 1.35) * H * 0.5,
      r: (Math.random() < 0.12 ? R(1.6, 2.6) : R(0.6, 1.4)) * dpr, ph: Math.random() * 6.28, sp: R(0.8, 2.6), a: R(0.5, 1) }));
  };
  build();
  let last = 0;
  const draw = (t) => {
    const o = parseFloat(canvas.style.opacity);
    if (!(o > 0.02)) return;
    const now = t * 1000; if (now - last < 32) return; last = now;
    ctx.clearRect(0, 0, W, H);
    for (const s of list) {
      const a = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a; ctx.fillStyle = '#fdeae6';
      ctx.fillRect(s.x, s.y, s.r, s.r);
      if (s.r > 1.5 * dpr) { ctx.globalAlpha = a * 0.35; ctx.fillRect(s.x - s.r, s.y + s.r / 2 - 0.5, s.r * 3, 1); ctx.fillRect(s.x + s.r / 2 - 0.5, s.y - s.r, 1, s.r * 3); }
    }
    // shooting stars
    if (t > nextShoot && !document.hidden) {
      nextShoot = t + R(3.5, 8);
      const ang = R(0.35, 0.6), sp = R(900, 1400) * dpr;
      shoot.push({ x: R(0.2, 0.95) * W, y: R(0, 0.22) * H, vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: R(0.7, 1.1) });
    }
    const dt = 1 / 30;
    shoot = shoot.filter(s => s.life < s.max);
    for (const s of shoot) {
      s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const k = 1 - s.life / s.max, len = 0.09;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
      g.addColorStop(0, `rgba(253,234,230,${k})`); g.addColorStop(1, 'rgba(253,234,230,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  gsap.ticker.add(draw);
  return { canvas, rebuild: build, destroy: () => gsap.ticker.remove(draw) };
}

/* ───────────── 3 · TITLE (between mountains & hills) ───────────── */
export function mountTitle(items, text) {
  const pos = mk('title-pos', 'div', items.title);
  const wrap = mk('title-wrap', 'div', pos);
  const glow = mk('title__glow', 'span', wrap); glow.textContent = text; glow.setAttribute('aria-hidden', 'true');
  const h1 = mk('title', 'h1', wrap); h1.textContent = text; h1.setAttribute('aria-label', text);
  const split = new SplitType(h1, { types: 'words,chars' });
  split.chars?.forEach(c => c.setAttribute('aria-hidden', 'true'));
  return { h1, glow, chars: split.chars, wrap };
}

/* ───────────── 4 · MIST / CLOUDS drifting at three depths ───────────── */
export function mountMist(items) {
  const defs = [['mistFar', 44, 0.5, 170], ['mistMid', 80, 0.38, 105], ['mistNear', 118, 0.2, 70]];
  const tweens = [];
  defs.forEach(([id, rowArt, alpha, dur]) => {
    for (let k = 0; k < 2; k++) {
      const m = mk('mist', 'div', items[id]);
      m.style.top = `calc(var(--art-y) + var(--s) * ${rowArt + k * 7}px)`;
      m.style.setProperty('--ma', alpha);
      m.style.width = `${R(60, 95)}vw`;
      const tw = gsap.fromTo(m, { x: () => -view.vw * 1.0 }, { x: () => view.vw * 1.05, duration: dur * (k ? 1.25 : 1), ease: 'none', repeat: -1 });
      tw.progress(k ? 0.55 : R(0, 0.3));
      tweens.push(tw);
    }
  });
  return () => tweens.forEach(t => t.kill());
}

/* ───────────── 5 · HEARTS – a pool of 25 recycled DOM elements ───────────── */
//  far: small + faint · mid: medium · near: large + blurred bokeh
export function mountHearts(items, nearContainer) {
  const mob = isMobile();
  const plan = [
    { cls: 'far',  n: mob ? 5 : 11, parent: items.heartsFar, size: [9, 16],   op: [0.25, 0.4],  dur: [26, 40], sway: [20, 60] },
    { cls: 'mid',  n: mob ? 3 : 8,  parent: items.fxMid,     size: [20, 34],  op: [0.6, 0.85],  dur: [16, 26], sway: [40, 90] },
    { cls: 'near', n: mob ? 2 : 6,  parent: nearContainer,   size: [70, 130], op: [0.28, 0.5],  dur: [12, 20], sway: [60, 140] }
  ];
  const pool = [];
  plan.forEach(p => { for (let i = 0; i < p.n; i++) {
    const el = mk(`heart heart--${p.cls}`, 'div', p.parent); el.setAttribute('aria-hidden', 'true');
    pool.push({ el, cfg: p });
  } });
  const live = new Set();
  const launch = (h, first) => {
    const { el, cfg } = h; const size = R(...cfg.size);
    el.style.setProperty('--hs', size + 'px');
    const dur = R(...cfg.dur), x0 = R(-20, view.vw), sway = R(...cfg.sway) * (Math.random() < 0.5 ? -1 : 1);
    const startY = view.vh + size + view.vh * 0.4;          // spawns below the screen even after the scroll shift
    const endY = -size - 60, op = R(...cfg.op);
    const tl = gsap.timeline({ onComplete: () => { live.delete(tl); launch(h, false); } });
    tl.fromTo(el, { y: startY, rotation: R(-25, 25), scale: R(0.8, 1.15) }, { y: endY, rotation: `+=${R(-50, 50)}`, duration: dur, ease: 'none' }, 0)
      .fromTo(el, { x: x0 }, { x: x0 + sway, duration: dur / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
      .fromTo(el, { opacity: 0 }, { opacity: op, duration: dur * 0.1, ease: 'none' }, 0)
      .to(el, { opacity: 0, duration: dur * 0.12, ease: 'none' }, dur * 0.86);
    if (first) tl.progress(R(0.1, 0.9));
    live.add(tl);
  };
  pool.forEach(h => launch(h, true));
  return () => { live.forEach(t => t.kill()); live.clear(); pool.forEach(h => gsap.killTweensOf(h.el)); };
}

/* ───────────── 6 · BIRDS, PETALS, SPARKLES ───────────── */
export async function mountCritters(items) {
  const mob = isMobile();
  const birdImg = await probeImage(ART_DIR + 'extras/birds.png');       // your own transparent PNG, if you added one
  const kills = [];
  /* birds: 5 pooled, cross the sky at mid depth */
  for (let i = 0; i < (mob ? 3 : 5); i++) {
    const b = mk('bird', 'div', items.birds); b.setAttribute('aria-hidden', 'true');
    let wing;
    if (birdImg) { b.innerHTML = `<img src="${birdImg.src}" alt="" />`; }
    else {
      b.innerHTML = `<svg viewBox="0 0 34 14"><path d="M1 12Q9 -2 17 10Q25 -2 33 12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      wing = gsap.to(b.querySelector('svg'), { scaleY: 0.35, transformOrigin: '50% 100%', duration: R(0.22, 0.34), yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }
    const fly = (first) => {
      const dir = Math.random() < 0.75 ? 1 : -1, size = R(18, 40), y = R(view.s * 6, view.s * 34) + Math.max(0, view.vh - 180 * view.s);
      const dur = R(16, 28);
      gsap.set(b, { width: size });
      const tl = gsap.timeline({ delay: first ? R(0.5, 6) : R(3, 10), onComplete: () => fly(false) });
      tl.fromTo(b, { x: dir > 0 ? -80 : view.vw + 80, y, scaleX: dir, opacity: 0 }, { x: dir > 0 ? view.vw + 80 : -80, duration: dur, ease: 'none' }, 0)
        .to(b, { y: `+=${R(-30, 30)}`, duration: dur / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
        .to(b, { opacity: 0.85, duration: 1.2 }, 0).to(b, { opacity: 0, duration: 1.2 }, dur - 1.2);
      kills.push(tl);
    };
    fly(true); if (wing) kills.push(wing);
  }
  /* petals: 12 pooled, flutter in 3D */
  for (let i = 0; i < (mob ? 6 : 12); i++) {
    const p = mk('petal', 'div', items.fxMid); p.setAttribute('aria-hidden', 'true');
    const fall = (first) => {
      const dur = R(10, 18), x0 = R(view.vw * 0.3, view.vw * 1.15), sc = R(0.7, 1.5);
      const tl = gsap.timeline({ delay: first ? R(0, 8) : R(0, 3), onComplete: () => fall(false) });
      tl.fromTo(p, { x: x0, y: -40, scale: sc, opacity: 0, rotation: R(0, 360) }, { x: x0 - R(view.vw * 0.35, view.vw * 0.7), y: view.vh + 40, duration: dur, ease: 'none', rotation: `+=${R(180, 540)}` }, 0)
        .to(p, { rotationX: R(240, 720), rotationY: R(240, 720), duration: dur, ease: 'none' }, 0)
        .to(p, { opacity: 0.9, duration: 1 }, 0).to(p, { opacity: 0, duration: 1.2 }, dur - 1.2);
      kills.push(tl);
    };
    fall(true);
  }
  /* sparkles: 12 pooled, twinkle around the sun + horizon */
  for (let i = 0; i < (mob ? 5 : 12); i++) {
    const s = mk('sparkle', 'div', items.fxMid); s.setAttribute('aria-hidden', 'true');
    const twinkle = (first) => {
      const top = Math.max(0, view.vh - 180 * view.s);
      const x = R(0, view.vw), y = top + R(view.s * 6, view.s * 110), dur = R(1.2, 2.6);
      const tl = gsap.timeline({ delay: first ? R(0, 3) : R(0.2, 2.5), onComplete: () => twinkle(false) });
      tl.fromTo(s, { x, y, scale: 0, opacity: 0, rotation: 0 }, { scale: R(0.7, 1.7), opacity: 1, rotation: 90, duration: dur / 2, ease: 'sine.out' })
        .to(s, { scale: 0, opacity: 0, rotation: 180, duration: dur / 2, ease: 'sine.in' });
      kills.push(tl);
    };
    twinkle(true);
  }
  return () => kills.forEach(t => t.kill());
}

/* optional extras: couple silhouette, heart balloon (only if the file exists – nothing is faked) */
export async function mountExtras(items) {
  const refs = {};
  const [couple, balloon] = await Promise.all([probeImage(ART_DIR + 'extras/couple-silhouette.png'), probeImage(ART_DIR + 'extras/heart-balloon.png')]);
  if (couple) { const w = mk('couple', 'div', items.couple); w.innerHTML = `<img src="${couple.src}" alt="" />`; w.setAttribute('aria-hidden', 'true'); refs.couple = w; }
  if (balloon) {
    const w = mk('balloon', 'div', items.balloon); w.innerHTML = `<img src="${balloon.src}" alt="" />`; w.setAttribute('aria-hidden', 'true'); refs.balloon = w;
    gsap.set(w, { opacity: 1 }); gsap.to(w, { y: -26, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
  return refs;
}

/* ───────────── 7 · GLASS CHIPS follow the mouse at a high depth ───────────── */
export function initChips() {
  const chips = [['#scrollChip', 0.95, 1.5], ['#musicBtn', 0.85, 1.3]].map(([sel, depth, mul]) => {
    const el = document.querySelector(sel);
    return { el, depth, mul, qx: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }), qy: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }) };
  });
  const move = e => {
    const nx = (e.clientX / view.vw - 0.5) * 2, ny = (e.clientY / view.vh - 0.5) * 2;
    chips.forEach(c => { c.qx(-nx * c.depth * SCENE.mouseX * c.mul); c.qy(-ny * c.depth * SCENE.mouseY * c.mul); });
  };
  if (!matchMedia('(hover: none)').matches) window.addEventListener('pointermove', move, { passive: true });
  return () => window.removeEventListener('pointermove', move);
}

/* ───────────── 8 · CUSTOM CURSOR (desktop only) ───────────── */
export function initCursor() {
  const root = document.getElementById('cursor');
  const dot = root.querySelector('.cursor__dot'), ring = root.querySelector('.cursor__ring');
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const move = e => { root.classList.add('is-active'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); };
  const over = e => root.classList.toggle('is-hover', !!e.target.closest('a,button,[data-tilt],.deck,.envelope'));
  document.documentElement.classList.add('has-cursor');
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerover', over, { passive: true });
  return () => { document.documentElement.classList.remove('has-cursor'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); };
}

/* ───────────── 9 · tsParticles: fireflies, golden dust, tiny hearts ───────────── */
export async function initParticles(count) {
  const [{ tsParticles }, { loadSlim }] = await Promise.all([import('@tsparticles/engine'), import('@tsparticles/slim')]);
  await loadSlim(tsParticles);
  /* lite: fewer dots, no per-dot canvas shadow (the costliest part), 30 fps, no retina canvas. Same dots, same colours, same drift. */
  const make = () => {
    const lite = perf.lite;
    return tsParticles.load({
      id: 'tsparticles',
      options: {
        fullScreen: { enable: false }, background: { color: 'transparent' }, fpsLimit: lite ? 30 : 45, detectRetina: !lite, pauseOnBlur: true,
        particles: {
          number: { value: lite ? Math.round(count * 0.6) : count },
          color: { value: ['#ffd6a0', '#ffb3a0', '#fdeae6'] },
          shape: { type: ['circle', 'circle', 'circle', 'image'], options: { image: [{ src: HEART_SVG('#ffb3a0'), width: 32, height: 28 }] } },
          opacity: { value: { min: 0.1, max: 0.85 }, animation: { enable: true, speed: 0.5, sync: false } },
          size: { value: lite ? { min: 1.6, max: 4.6 } : { min: 1.2, max: 4.2 } },
          shadow: { enable: !lite, color: '#ffd6a0', blur: 10 },
          move: { enable: true, speed: { min: 0.15, max: 0.55 }, direction: 'top', random: true, straight: false, outModes: { default: 'out' } },
          wobble: { enable: true, distance: 12, speed: { min: -2, max: 2 } }
        },
        interactivity: { events: { resize: { enable: true } } }
      }
    });
  };
  let container = await make();
  const offTier = perf.onChange(async () => { container?.destroy(); container = await make(); });
  const offCover = perf.onCover(on => { try { on ? container?.pause() : container?.play(); } catch { /* engine busy */ } });
  return () => { offTier(); offCover(); container?.destroy(); };
}

/* ───────────── 10 · HEART BURST (finale button, taps, butterflies, cards) ─────────────
   opt.dist = [min, max] travel, opt.size = [min, max] px. The x target is clamped inside the viewport:
   a fixed element that flies past the edge widens the layout viewport on phones. */
const burstPool = [];
export function burstHearts(x, y, n = 30, opt = {}) {
  const [d0, d1] = opt.dist || [90, 340], [s0, s1] = opt.size || [14, 38];
  for (let i = 0; i < n; i++) {
    let el = burstPool.find(h => !h.dataset.busy);
    if (!el) { el = mk('burst-heart heart', 'div', document.body); el.style.opacity = 0; burstPool.push(el); }
    el.dataset.busy = '1';
    el.style.setProperty('--hs', R(s0, s1) + 'px');
    const ang = R(0, Math.PI * 2), dist = R(d0, d1);
    gsap.fromTo(el, { x, y, scale: 0.2, opacity: 1, rotation: R(-30, 30) },
      { x: gsap.utils.clamp(0, Math.max(0, innerWidth - 64), x + Math.cos(ang) * dist), y: y + Math.sin(ang) * dist - R(40, 160) * (d1 / 340), scale: R(0.8, 1.5), rotation: R(-80, 80), duration: R(1.1, 2), ease: 'power3.out',
        onComplete: () => gsap.to(el, { opacity: 0, y: '+=60', duration: 0.6, onComplete: () => { delete el.dataset.busy; } }) });
  }
}

/* tap / click anywhere (not on buttons or links): a few small hearts puff out. `click` (not pointerdown) so a scroll-swipe on a phone doesn't trigger it. */
export function initTapPuffs() {
  const onClick = e => {
    if (e.target.closest('a, button, input, textarea, .bfly, .reason__tilt')) return;
    burstHearts(e.clientX, e.clientY, 5, { dist: [30, 120], size: [10, 22] });
  };
  document.addEventListener('click', onClick, { passive: true });
  return () => document.removeEventListener('click', onClick);
}

/* soft heart trail behind the mouse (desktop only): a pool of 14 hearts, throttled */
export function initTrail() {
  const pool = Array.from({ length: 14 }, () => { const h = mk('trail heart', 'div', document.body); h.style.opacity = 0; return h; });
  let k = 0, last = 0, lx = -99, ly = -99;
  const onMove = e => {
    const now = performance.now();
    if (now - last < 70 || Math.hypot(e.clientX - lx, e.clientY - ly) < 18) return;
    last = now; lx = e.clientX; ly = e.clientY;
    const h = pool[k++ % pool.length];
    gsap.killTweensOf(h);
    h.style.setProperty('--hs', R(9, 15) + 'px');
    gsap.fromTo(h, { x: lx - 6, y: ly - 6, scale: R(0.6, 1), opacity: 0.85, rotation: R(-25, 25) },
      { x: lx + R(-16, 16), y: ly + R(16, 40), scale: 0, opacity: 0, rotation: `+=${R(-30, 30)}`, duration: 0.95, ease: 'power1.out' });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => { window.removeEventListener('pointermove', onMove); pool.forEach(h => { gsap.killTweensOf(h); h.remove(); }); };
}

/* ───────────── 10b · BUTTERFLIES (pixel sprite: "Butterfly" by AntumDeluge, CC BY 3.0) ─────────────
   3 wing frames stacked in one box; CSS steps their opacity (see .bfly__f). JS only moves the box.
   They wander, drift toward the cursor, and flutter off in a puff of hearts when clicked. */
const BFLY_DIR = 'assets/butterflies/';
const pointerPx = { x: 0, y: 0, t: -1e9 };
let bflyLayer = null;
function bflyEl(scale) {
  const el = mk('bfly', 'div');
  el.style.setProperty('--bs', scale);
  const body = mk('bfly__body', 'div', el);
  for (let i = 1; i <= 3; i++) { const im = mk('bfly__f', 'img', body); im.src = `${BFLY_DIR}butterfly-${i}.png`; im.alt = ''; im.draggable = false; }
  return { el, body };
}

export function initButterflies(count) {
  bflyLayer = document.getElementById('butterflies');
  if (!bflyLayer) return () => {};
  const scale = isMobile() ? 3 : 4;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clampX = x => gsap.utils.clamp(8, Math.max(8, view.vw - 70), x), clampY = y => gsap.utils.clamp(8, Math.max(8, view.vh - 70), y);
  const onMove = e => { pointerPx.x = e.clientX; pointerPx.y = e.clientY; pointerPx.t = performance.now(); };
  if (fine) window.addEventListener('pointermove', onMove, { passive: true });

  const list = [];
  const fly = b => {
    if (b.dead) return;
    const cx = gsap.getProperty(b.el, 'x'), cy = gsap.getProperty(b.el, 'y');
    const follow = fine && performance.now() - pointerPx.t < 2500 && Math.random() < 0.6;       // sometimes drawn toward the cursor
    const tx = clampX(follow ? pointerPx.x + R(-130, 130) : R(20, view.vw - 70));
    const ty = clampY(follow ? pointerPx.y + R(-110, 90) : R(60, view.vh - 80));
    const ang = Math.atan2(ty - cy, tx - cx) * 180 / Math.PI + 90;                                // the sprite faces up
    b.tw = gsap.to(b.el, { x: tx, y: ty, rotation: `${ang}_short`, duration: gsap.utils.clamp(1.6, 5.5, Math.hypot(tx - cx, ty - cy) / R(90, 140)), ease: 'sine.inOut', onComplete: () => fly(b) });
  };
  const startle = b => {                                   // clicked: hearts, then it flutters off and comes back later
    const x = gsap.getProperty(b.el, 'x'), y = gsap.getProperty(b.el, 'y');
    b.tw?.kill();
    burstHearts(x + 28, y + 24, 7, { dist: [40, 170], size: [11, 24] });
    b.el.style.setProperty('--flap', '.12s');
    gsap.to(b.el, { x: clampX(x + R(-260, 260)), y: -90, rotation: '0_short', duration: 1.3, ease: 'power2.in', onComplete: () => {
      if (b.dead) return;
      b.el.style.setProperty('--flap', '.36s');
      gsap.set(b.el, { x: R(20, view.vw - 70), y: view.vh + 30 });
      fly(b);
    } });
  };
  for (let i = 0; i < count; i++) {
    const { el, body } = bflyEl(scale);
    bflyLayer.appendChild(el);
    gsap.set(el, { x: R(20, view.vw - 70), y: R(view.vh * 0.25, view.vh * 0.85), opacity: 0 });
    const b = { el, body, dead: false, tw: null, bob: gsap.to(body, { y: -5, duration: R(0.3, 0.55), yoyo: true, repeat: -1, ease: 'sine.inOut' }) };
    el.addEventListener('click', e => { e.stopPropagation(); startle(b); });
    gsap.to(el, { opacity: 1, duration: 1.2, delay: 1 + i * 0.5, onStart: () => fly(b) });
    list.push(b);
  }
  return () => {
    window.removeEventListener('pointermove', onMove);
    list.forEach(b => { b.dead = true; b.tw?.kill(); b.bob.kill(); gsap.killTweensOf(b.el); b.el.remove(); });
  };
}

/* a handful of butterflies flutter up and away from a point (letter opened, love button, heart tapped) */
export function releaseButterflies(x, y, n = 5) {
  if (!bflyLayer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scale = isMobile() ? 3 : 4;
  for (let i = 0; i < n; i++) {
    const { el, body } = bflyEl(scale);
    el.style.pointerEvents = 'none';
    bflyLayer.appendChild(el);
    const x0 = gsap.utils.clamp(0, view.vw - 60, x - 28), y0 = gsap.utils.clamp(0, view.vh - 50, y - 24);
    const tx = gsap.utils.clamp(8, Math.max(8, view.vw - 70), x0 + R(-340, 340)), ty = y0 - R(180, 460), dur = R(2.4, 4), t0 = i * 0.12;
    gsap.set(el, { x: x0, y: y0, rotation: Math.atan2(ty - y0, tx - x0) * 180 / Math.PI + 90, scale: 0.3, opacity: 0 });
    gsap.timeline({ onComplete: () => el.remove() })
      .to(el, { x: tx, y: ty, scale: 1, duration: dur, ease: 'power1.out' }, t0)
      .to(el, { opacity: 1, duration: 0.3 }, t0)
      .to(el, { opacity: 0, duration: 0.9 }, t0 + dur - 0.9)
      .to(body, { x: R(-22, 22), duration: 0.45, yoyo: true, repeat: Math.ceil(dur / 0.45), ease: 'sine.inOut' }, t0);
  }
}

/* ───────────── 10c · KISSES THROWN AT THE CAMERA (letter) ─────────────
   Twemoji (CC BY 4.0) kisses + hearts pop out of the envelope, then rush toward the viewer: they grow huge and spread
   to the edges (that's the "toward the camera" part: scale, not size on screen). A few kiss marks then stick to the "glass"
   and slide off. Everything lives in a fixed, overflow-hidden layer (nothing can widen the page). Transform + opacity only. */
const EMOJI_DIR = 'assets/emoji/';
const THROWN = ['1f48b', '1f48b', '1f48b', '1f618', '1f618', '1f618', '1f61a', '1f60d', '1f970', '2764', '2764', '1f496', '1f497', '1f498', '1f495', '1f49e', '1f493', '1f49d', '1f48c'];
export function throwKisses(x, y, n = 30) {
  const layer = document.getElementById('kisses');
  if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const vw = view.vw, vh = view.vh, B = 96, flash = layer.querySelector('.kisses__flash');
  gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.out' });
  const span = 1.2 + n * 0.028;                                     // the whole volley is spread over this many seconds
  const mkImg = code => { const im = mk('kiss', 'img', layer); im.src = `${EMOJI_DIR}${code}.svg`; im.alt = ''; im.draggable = false; return im; };

  for (let i = 0; i < n; i++) {                                    // the volley
    const im = mkImg(THROWN[Math.floor(R(0, THROWN.length))]);
    const sx = x - B / 2, sy = y - B / 2;
    const tx = vw / 2 + R(-0.62, 0.62) * vw - B / 2, ty = vh * 0.46 + R(-0.55, 0.5) * vh - B / 2;
    gsap.set(im, { x: sx, y: sy, scale: 0.12, opacity: 0, rotation: R(-40, 40) });
    gsap.timeline({ delay: (i / n) * span + R(0, 0.08), onComplete: () => im.remove() })
      .to(im, { opacity: 1, scale: 0.5, x: sx + R(-70, 70), y: sy - R(50, 150), duration: 0.35, ease: 'power2.out' })           // pops out of the envelope
      .to(im, { x: tx, y: ty, scale: R(2.6, 5.2), rotation: R(-60, 60), duration: R(0.9, 1.5), ease: 'power2.in' })              // rushes at the camera
      .to(im, { opacity: 0, duration: 0.25 }, '-=0.25');
  }

  const stuck = Math.max(2, Math.round(n / 9));                                    // kiss marks that land on the screen, then slide down
  for (let i = 0; i < stuck; i++) {
    const im = mkImg(i % 3 === 2 ? '1f618' : '1f48b');
    const px = R(vw * 0.08, vw * 0.92) - B / 2, py = R(vh * 0.12, vh * 0.78) - B / 2, sc = R(2, 3.3);
    gsap.set(im, { x: px, y: py, scale: sc * 2, opacity: 0, rotation: R(-30, 30) });
    gsap.timeline({ delay: 1 + (i / stuck) * span * 0.9, onComplete: () => im.remove() })
      .to(im, { scale: sc, opacity: 0.92, duration: 0.2, ease: 'power4.out' })
      .to(im, { y: py + 70, opacity: 0, duration: 1.6, ease: 'power1.in' }, '+=1.3');
  }
}

/* ───────────── 11 · MUSIC (plays only after a click) ───────────── */
export function initMusic(file) {
  const btn = document.getElementById('musicBtn'), toast = document.getElementById('toast');
  let audio, t;
  const say = msg => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(t); t = setTimeout(() => toast.classList.remove('is-on'), 3600); };
  const set = on => { btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); };
  btn.addEventListener('click', async () => {
    if (!audio) { audio = new Audio(file); audio.loop = true; audio.volume = 0.65; }
    if (audio.paused) {
      try { await audio.play(); set(true); } catch { audio = null; set(false); say(`Add your song at ${file}`); }
    } else { audio.pause(); set(false); }
  });
}
