// ════════════════════════════════════════════════════════════════
//  FAUNA: real pixel-art animals (ScratchIO, CC0, see assets/fauna/README.md)
//  Each animal is two sprite strips (walk + idle). A strip is one <img>, shown through a window
//  one frame wide, and slid with a CSS steps() animation: transform only, no canvas, nothing drawn in code.
//  The sprites face right; `flip` mirrors them.
// ════════════════════════════════════════════════════════════════
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const urls = import.meta.glob('../assets/fauna/*.png', { eager: true, query: '?url', import: 'default' });
const url = (a, k) => urls[`../assets/fauna/${a}-${k}.png`];

/* w/h = one frame in px · walk/idle = number of frames in the strip */
export const ANIMALS = {
  bear:   { w: 64, h: 33, walk: 8,  idle: 12 },
  boar:   { w: 64, h: 40, walk: 8,  idle: 8 },
  deer:   { w: 72, h: 52, walk: 8,  idle: 10 },
  fox:    { w: 64, h: 36, walk: 8,  idle: 6 },
  rabbit: { w: 32, h: 26, walk: 10, idle: 10 },   // "walk" = hop
  wolf:   { w: 64, h: 40, walk: 8,  idle: 10 },   // "idle" = the howl
  /* newer ones (Shepardskin, CC0): the cat and dog are tiny, so CSS scales them up a little more */
  cat:      { w: 18, h: 15, walk: 6, idle: 4 },
  dog:      { w: 16, h: 10, walk: 6, idle: 4 },   // "idle" = standing and looking around
  squirrel: { w: 31, h: 19, walk: 5, idle: 4 }    // (pixel squirrel, CC0)
};

/* scale = whole-number pixel scale (set with --cs in CSS when omitted) */
export function critterHTML(name, { flip = false, state = 'idle', scale, cls = '' } = {}) {
  const a = ANIMALS[name] ?? ANIMALS.fox;
  const strip = k => `<span class="critter__v critter__v--${k}" style="--n:${a[k]}"><img src="${url(name in ANIMALS ? name : 'fox', k)}" alt="" draggable="false" decoding="async"></span>`;
  const d = (Math.random() * 1.2).toFixed(2);
  return `<span class="critter ${cls}${flip ? ' critter--flip' : ''}" data-state="${state}" data-a="${name}" style="--w:${a.w};--h:${a.h};--d:${d}${scale ? `;--s:${scale}` : ''}">` +
    `<span class="critter__face">${strip('walk')}${strip('idle')}</span></span>`;
}

export const setState = (el, s) => { if (el.dataset.state !== s) el.dataset.state = s; };

/* "walk while the page is scrolling, rest when it stops": each driver says when its animal is allowed to walk */
let scrolling = false, ready = false;
const drivers = new Set();
const run = () => drivers.forEach(d => setState(d.el, d.fn(scrolling) ? 'walk' : 'idle'));
export function drive(el, fn) {
  if (!ready) {
    ready = true;
    ScrollTrigger.addEventListener('scrollStart', () => { scrolling = true; run(); });
    ScrollTrigger.addEventListener('scrollEnd', () => { scrolling = false; run(); });
  }
  const d = { el, fn }; drivers.add(d); setState(el, fn(scrolling) ? 'walk' : 'idle');
  return () => drivers.delete(d);
}
export const refreshStates = run;
