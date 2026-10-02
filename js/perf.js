// ════════════════════════════════════════════════════════════════
//  PERF: picks a quality tier so the site also runs smoothly on old laptops (dual-core i3, 8 GB, 128 MB shared graphics).
//
//    full  nothing changes (fast machines)
//    lite  same scene, same elements, cheaper to draw: a flat 2D scene (no 3D tilt), no live blur behind glass,
//          smaller canvases, lighter particle glow, everything off-screen sleeps
//    min   lite + the colour-grade blend simplified and the small drop-shadows dropped (only if lite still can't hold ~30 fps)
//
//  It starts in `lite` on machines with 4 or fewer logical cores, 4 GB or less, an old Intel GPU, or no GPU. A frame-rate
//  watchdog steps down a tier if scrolling is still slow, and remembers it for next time.
//  Force a tier: add ?perf=full | lite | min to the address (it is remembered), and ?perf=auto to clear it.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';

const root = document.documentElement;
const ORDER = ['full', 'lite', 'min'];
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } }
};

function gpuName() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (!gl) return 'none';
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    const n = e ? String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return n;
  } catch { return ''; }
}

function detect() {
  const q = new URLSearchParams(location.search).get('perf');
  if (q === 'auto') { store.set('perf', null); store.set('perf-auto', null); }
  else if (ORDER.includes(q)) { store.set('perf', q); store.set('perf-auto', null); }
  const forced = store.get('perf');
  if (ORDER.includes(forced)) return { tier: forced, forced: true };
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8, g = gpuName();
  const oldIntel = /Intel/i.test(g) && /(?<!U)HD Graphics (?:[2-5]\d{3})\b|GMA|Iris.*(5100|5200)/i.test(g);
  const software = /SwiftShader|llvmpipe|Software|Basic Render|none/i.test(g);
  let tier = (cores <= 4 || mem <= 4 || oldIntel || software) ? 'lite' : 'full';
  const learned = store.get('perf-auto');                          // an earlier visit found this machine needs more help
  if (ORDER.includes(learned) && ORDER.indexOf(learned) > ORDER.indexOf(tier)) tier = learned;
  return { tier, forced: false };
}

const found = detect();
const listeners = new Set(), coverFns = new Set();
export const perf = {
  tier: found.tier, forced: found.forced,
  get lite() { return this.tier !== 'full'; },
  get min() { return this.tier === 'min'; },
  get flat() { return this.tier !== 'full'; },                    // flat 2D scene instead of the 3D one
  dpr(max = 2) { return this.lite ? 1 : Math.min(window.devicePixelRatio || 1, max); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  onCover(fn) { coverFns.add(fn); return () => coverFns.delete(fn); },
  /* the night page covers the whole screen: everything underneath stops drawing */
  cover(on) { document.body.classList.toggle('night-cover', on); coverFns.forEach(f => f(on)); }
};

function apply() {
  root.classList.toggle('perf-lite', perf.lite);
  root.classList.toggle('perf-min', perf.min);
  root.dataset.perf = perf.tier;
}
apply();

export function setTier(t, remember = false) {
  if (!ORDER.includes(t) || t === perf.tier) return;
  perf.tier = t; apply();
  if (remember) store.set('perf-auto', t);
  listeners.forEach(f => f(t));
}

/* run fn(on) whenever el scrolls into / out of view (a little margin so things wake up just before they show) */
export function whenVisible(el, fn, margin = '160px') {
  if (!el || !('IntersectionObserver' in window)) { fn(true); return () => {}; }
  const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: `${margin} 0px` });
  io.observe(el); return () => io.disconnect();
}

/* sections that are off screen stop their CSS animations (blinking fireflies, sprites, tap-dots …) */
export function sleepOffscreen() {
  const offs = [...document.querySelectorAll('main > section, main > footer, footer')].map(s => whenVisible(s, on => s.classList.toggle('is-off', !on), '120px'));
  return () => offs.forEach(f => f());
}

/* tweens that belong to a section: paused while that section is off screen */
export function sleepTweens(el, tweens) {
  return whenVisible(el, on => tweens.forEach(t => t.paused(!on)));
}

/* frame-rate watchdog: only judges frames while the page is being scrolled, and steps down at most twice */
export function startGovernor() {
  if (perf.forced || perf.tier === 'min') return () => {};
  let last = performance.now(), acc = 0, n = 0, win = last, bad = 0, scrollAt = 0, raf = 0, off = false;
  const poke = () => { scrollAt = performance.now(); };
  ['wheel', 'touchmove', 'keydown'].forEach(ev => window.addEventListener(ev, poke, { passive: true }));
  const tick = now => {
    const dt = now - last; last = now;
    const judge = !document.hidden && !document.body.classList.contains('is-loading') && !document.body.classList.contains('night-cover');
    if (judge && dt < 400 && now - scrollAt < 450) { acc += dt; n++; }
    if (now - win > 2000) {
      if (n >= 24) {
        const fps = 1000 * n / acc, need = perf.tier === 'full' ? 40 : 26;
        bad = fps < need ? bad + 1 : Math.max(0, bad - 1);
        if (bad >= 2) { setTier(ORDER[ORDER.indexOf(perf.tier) + 1], true); bad = 0; if (perf.tier === 'min') off = true; }
      }
      acc = 0; n = 0; win = now;
    }
    if (!off) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { off = true; cancelAnimationFrame(raf); ['wheel', 'touchmove', 'keydown'].forEach(ev => window.removeEventListener(ev, poke)); };
}

window.__perf = { perf, setTier };   // handy for testing: __perf.setTier('min')
void gsap;
