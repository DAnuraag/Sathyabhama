// ════════════════════════════════════════════════════════════════
//  PARALLAX ENGINE  – reads LAYERS / ITEMS and builds the 3D scene.
//  DOM per layer:
//    .layer            → scroll depth (y), translateZ + compensating scale   (master timeline)
//      .layer__mouse   → mouse / device-tilt offset                          (gsap.quickTo)
//        .layer__inner → seamless horizontal loop (clouds), blur             (infinite tween)
//  Only transform + opacity are animated. will-change: transform in CSS.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import { LAYERS, ITEMS, SCENE, TILE, ART_DIR } from './layers.js';
import { perf } from './perf.js';

export const view = { vw: 0, vh: 0, s: 5, tileW: 1600 };
export const pointer = { x: 0, y: 0 };   // −1…1, shared with chips / cursor
export const entries = [];                 // every layer + item (sorted far → near)
export const itemEls = {};                 // id → content container

const SUN_TILE_X = 0.375;   // where (0‥1) in the art tile the sun sets – the low dip in the far mountains
const el = (cls, tag = 'div') => { const e = document.createElement(tag); e.className = cls; return e; };

/* ── measurements → CSS variables (integer pixel-art scale) ─────── */
export function measure() {
  const root = document.documentElement;
  const vw = root.clientWidth;
  let vh = window.innerHeight;
  // keep the height stable on mobile (URL bar show/hide must not rescale the art)
  if (view.vh && vw === view.vw && Math.abs(vh - view.vh) < 160) vh = view.vh;
  view.vw = vw; view.vh = vh;
  view.s = Math.max(3, Math.ceil(vh / TILE.h));         // integer scaling → crisp pixels
  view.tileW = TILE.w * view.s;

  const sunX = vw * (vw > 800 ? 0.64 : 0.5);
  let tileX = (sunX + SCENE.pad - SUN_TILE_X * view.tileW) % view.tileW;
  if (tileX < 0) tileX += view.tileW;

  root.style.setProperty('--s', view.s);
  root.style.setProperty('--vh100', vh + 'px');
  root.style.setProperty('--pad', SCENE.pad + 'px');
  root.style.setProperty('--tile-x', tileX + 'px');
  root.style.setProperty('--sun-x', sunX + 'px');
  return view;
}

/* ── preload all layers behind the loader ───────────────────────── */
export function preloadLayers(onProgress) {
  let done = 0;
  return Promise.all(LAYERS.map(l => new Promise(res => {
    const img = new Image();
    const fin = () => { done++; onProgress?.(done / LAYERS.length); res(); };
    img.onload = () => (img.decode ? img.decode().catch(() => {}).then(fin) : fin());
    img.onerror = fin;
    img.src = ART_DIR + l.file;
  })));
}

/* optional extras (assets/art/extras/*.png) – we only use them if they really exist */
export function probeImage(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

/* translateZ + compensating scale: layer keeps its authored size but sits at its depth */
export const depthProps = depth => {
  if (perf.flat) return { z: 0, scale: 1 };                     // lite: a flat 2D scene, no 3D planes to sort and project
  const z = -(1 - depth) * SCENE.zRange;
  return { z, scale: 1 + ((1 - depth) * SCENE.zRange) / SCENE.perspective };
};
/* in the 3D scene a scroll shift is projected down by the layer's scale; the flat scene divides by it so both look the same */
const flatK = depth => (perf.flat ? 1 / (1 + ((1 - depth) * SCENE.zRange) / SCENE.perspective) : 1);

/* switching tier while running (the frame-rate watchdog): re-place every layer, then ScrollTrigger refreshes and rebuilds the timeline */
export function applySceneTier() {
  const scene3d = document.getElementById('scene3d');
  if (perf.flat) gsap.set(scene3d, { rotationX: 0, rotationY: 0, clearProps: 'transform' });
  entries.forEach(e => gsap.set(e.outer, { ...depthProps(e.depth), force3D: true }));
}

/* ── build the DOM ──────────────────────────────────────────────── */
export function buildScene() {
  const scene3d = document.getElementById('scene3d');
  scene3d.innerHTML = '';
  entries.length = 0;

  LAYERS.forEach(def => entries.push({ kind: 'layer', def, depth: def.depth }));
  ITEMS.forEach(def => entries.push({ kind: 'item', def, depth: def.depth }));
  entries.sort((a, b) => a.depth - b.depth);

  entries.forEach(e => {
    const outer = el(e.kind === 'layer' ? `layer layer--${e.def.type}` : `layer scene-item scene-item--${e.def.id}`);
    const mouse = el('layer__mouse');
    outer.dataset.depth = e.depth;
    outer.appendChild(mouse);

    if (e.kind === 'layer') {
      const d = e.def;
      outer.setAttribute('aria-hidden', 'true');
      if (d.anchor === 'top') outer.classList.add('layer--top');
      if (d.mobile === false) outer.classList.add('layer--detail');
      if (d.fill) mouse.style.setProperty('--fill', d.fill);
      if (d.y) mouse.style.marginBottom = `calc(${-d.y}px * var(--s))`;
      const inner = el('layer__inner');
      inner.style.backgroundImage = `url(${ART_DIR + d.file})`;
      if (d.blur) inner.style.filter = `blur(${d.blur}px)`;
      if (d.loopX) inner.classList.add('is-loop');
      mouse.appendChild(inner);
      e.inner = inner;
      // (custom-property urls must be absolute: they resolve against the stylesheet)
      // night grade: a colour overlay in this layer's own silhouette (so stars / moon are never dimmed).
      // The silhouettes are pre-made images (assets/art/night/, same pixels as the art, one flat colour): a plain textured quad is far
      // cheaper for the GPU than a live CSS mask, which needs an off-screen buffer per layer.
      if (d.night) {
        const n = el('layer__night');
        n.style.setProperty('--night', d.night);
        if (d.type === 'sky') { n.classList.add('layer__night--solid'); mouse.appendChild(n); }
        else { n.style.setProperty('--nimg', `url(${new URL(ART_DIR + 'night/' + d.file.replace(/\.webp$/, '.png'), document.baseURI).href})`); inner.appendChild(n); }
        if (d.fill && d.type !== 'sky') { const x = el('layer__night layer__night-ext'); x.style.setProperty('--night', d.night); mouse.appendChild(x); }
      }
    } else {
      mouse.className = 'layer__mouse scene-item__content';
      itemEls[e.def.id] = mouse;
    }
    e.outer = outer; e.mouse = mouse;
    e.mouseMul = e.def.mouse ?? 1;
    scene3d.appendChild(outer);
    gsap.set(outer, { ...depthProps(e.depth), force3D: true, transformOrigin: '50% 50%' });
  });
  return { entries, items: itemEls };
}

/* ── MOUSE / TILT parallax (quickTo per layer) ──────────────────── */
export function initMouseParallax() {
  const scene3d = document.getElementById('scene3d');
  const qRotY = gsap.quickTo(scene3d, 'rotationY', { duration: 1.4, ease: 'power3.out' });
  const qRotX = gsap.quickTo(scene3d, 'rotationX', { duration: 1.4, ease: 'power3.out' });
  entries.forEach(e => {
    e.qx = gsap.quickTo(e.mouse, 'x', { duration: 1.1, ease: 'power3.out' });
    e.qy = gsap.quickTo(e.mouse, 'y', { duration: 1.1, ease: 'power3.out' });
  });

  const apply = (nx, ny) => {
    pointer.x = nx; pointer.y = ny;
    entries.forEach(e => {
      e.qx(-nx * e.depth * SCENE.mouseX * e.mouseMul);        // offset = mouse × depth × strength
      e.qy(-ny * e.depth * SCENE.mouseY * e.mouseMul);
    });
    if (!perf.flat) { qRotY(nx * SCENE.tiltY); qRotX(-ny * SCENE.tiltX); }
  };

  const onMove = ev => apply((ev.clientX / view.vw - 0.5) * 2, (ev.clientY / view.vh - 0.5) * 2);
  let sway, gotOrientation = false;
  const onOrient = ev => {
    if (ev.gamma == null) return;
    gotOrientation = true; sway?.kill();
    apply(gsap.utils.clamp(-1, 1, ev.gamma / 30), gsap.utils.clamp(-1, 1, ((ev.beta ?? 60) - 55) / 30));
  };

  const coarse = matchMedia('(hover: none)').matches;
  if (!coarse) window.addEventListener('pointermove', onMove, { passive: true });
  else {
    // mobile: DeviceOrientation (iOS asks permission on first tap) + gentle auto-sway fallback
    const ask = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission().then(r => r === 'granted' && window.addEventListener('deviceorientation', onOrient)).catch(() => {});
      }
    };
    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('touchend', ask, { once: true, passive: true });
    const proxy = { t: 0 };
    sway = gsap.to(proxy, { t: 1, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1,
      onUpdate: () => !gotOrientation && apply((proxy.t - 0.5) * 1.6, Math.sin(proxy.t * Math.PI) * 0.25) });
  }
  return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onOrient); sway?.kill(); };
}

/* ── seamless cloud drift ───────────────────────────────────────── */
export function startLoops() {
  const tweens = [];
  entries.filter(e => e.kind === 'layer' && e.def.loopX).forEach(e => {
    e.inner.style.left = -view.tileW + 'px';
    e.inner.style.width = `calc(100% + ${view.tileW}px)`;
    tweens.push(gsap.to(e.inner, { x: view.tileW, duration: e.def.loopX, ease: 'none', repeat: -1 }));
  });
  return () => tweens.forEach(t => t.kill());
}

/* ── SCROLL parallax: tweens added to the ONE master timeline ───── */
//  Far layers barely move, near layers travel far upward → the viewer "moves past" the scene.
export function addScrollTweens(master, T) {
  const K = () => SCENE.scrollShift * view.vh;
  entries.forEach(e => {
    if (e.def.id === 'title') return;                        // title has its own fade
    const shift = () => -Math.pow(e.depth, SCENE.scrollCurve) * K() * (e.def.scrollMul ?? 1) * flatK(e.depth);
    // pinned hero: first part of the travel, then continue through the story
    master.to(e.outer, { y: () => shift() * SCENE.heroShare, duration: T.story, ease: 'none' }, 0);
    master.to(e.outer, { y: shift, duration: Math.max(0.0001, T.reasons - T.story), ease: 'none' }, T.story);
    master.to(e.outer, { y: () => shift() * 1.12, duration: Math.max(0.0001, 1 - T.reasons), ease: 'none' }, T.reasons);
  });
  const title = entries.find(e => e.def.id === 'title');
  if (title) {
    master.to(title.outer, { y: () => -Math.pow(title.depth, SCENE.scrollCurve) * K() * 1.4 * flatK(title.depth), duration: T.story, ease: 'none' }, 0);
    master.to(title.outer, { opacity: 0, duration: T.story * 0.55, ease: 'none' }, T.story * 0.3);
  }
}
