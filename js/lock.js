// ════════════════════════════════════════════════════════════════
//  SCROLL LOCKS: "stop here, show me this, then let me go on".
//  A lock zone has a few stops (scroll positions). Scrolling into the zone lands exactly on its first (or last) stop and holds.
//  Each scroll gesture (wheel flick, swipe, arrow key) moves exactly ONE stop.
//  On top of that there is a hard guarantee: while you are inside a zone the page can never end up more than one stop away from
//  where it is holding, whatever caused the scroll (fast wheel, touchpad inertia, scrollbar drag, Space, touch momentum).
//  On the last stop (or the first one, going up) the next gesture carries on down (or up) the page.
//  Works with Lenis (window.__lenis). No lock is created in reduced-motion mode, where nothing is pinned anyway.
// ════════════════════════════════════════════════════════════════
const zones = [];
let lenis = null, bound = null, busy = false, animDone = true, lastInput = 0, startedAt = 0, snapping = false, prevY = 0, installed = false;
const TOL = 3, QUIET = 280;          // ms of wheel silence (by the event's own timestamp, so a slow frame rate can't fake a pause)
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const blocked = () => document.body.classList.contains('night-open') || !!document.querySelector('dialog[open]');
const now = () => performance.now();

const stopsOf = z => z.stops().filter(Number.isFinite).sort((a, b) => a - b);
const inside = (z, y) => { const s = stopsOf(z); return s.length > 1 && y >= s[0] - TOL && y <= s[s.length - 1] + TOL; };
const zoneAt = y => zones.find(z => inside(z, y));
const nearest = (s, y) => s.reduce((b, v, i) => (Math.abs(v - y) < Math.abs(s[b] - y) ? i : b), 0);

/* where the zone is currently holding: the stop we landed on (or the nearest one if it was never set) */
const holding = (z, s, y) => (z.cur != null && z.cur < s.length ? z.cur : nearest(s, y));

function go(z, j, s) {
  busy = true; animDone = false; lastInput = startedAt = now(); z.cur = j;
  lenis.scrollTo(s[j], { duration: z.duration || 1, easing: ease, force: true, lock: true, onComplete: () => { animDone = true; lastInput = now(); } });
}

/* gestures keep "busy" on until the move is over AND the wheel / finger has been quiet for a moment (this kills trackpad inertia).
   A failsafe frees it even if Lenis never reports the move as finished. */
const settle = (t = now()) => { if (busy && (animDone || now() - startedAt > 3500) && t - lastInput > QUIET) busy = false; };

/* one gesture = one step. dir: +1 down, -1 up. Returns true when it handled the gesture (so the page must not scroll by itself) */
function step(dir) {
  const y = window.scrollY, z = zoneAt(y); if (!z) return false;
  const s = stopsOf(z), i = holding(z, s, y), j = i + dir;
  if (busy) return true;                                                     // still settling: swallow the rest of the flick
  if (j < 0 || j >= s.length) { z.cur = null; return false; }                // past the end: let the page carry on
  go(z, j, s);
  return true;
}

function onWheel(e) {
  if (!lenis || blocked() || e.ctrlKey) return;
  const dy = e.deltaY; if (!dy) return;
  const z = zoneAt(window.scrollY); if (!z) return;
  const t = e.timeStamp || now();
  settle(t);
  const handled = step(dy > 0 ? 1 : -1);
  if (t > lastInput) lastInput = t;                                          // every wheel event (even swallowed ones) keeps the gesture alive
  if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
}

let ty = 0, acc = 0, touchBusy = false;
function onTouchStart(e) { ty = e.touches[0].clientY; acc = 0; touchBusy = false; settle(now() + QUIET); }
function onTouchMove(e) {
  if (!lenis || blocked()) return;
  const z = zoneAt(window.scrollY); if (!z) return;
  acc = ty - e.touches[0].clientY; const dir = acc > 0 ? 1 : -1;
  const s = stopsOf(z), j = holding(z, s, window.scrollY) + dir;
  if (!busy && (j < 0 || j >= s.length)) { z.cur = null; return; }           // swipe past the end: normal scrolling
  if (e.cancelable) e.preventDefault();
  if (!touchBusy && Math.abs(acc) > 34) { settle(); if (!busy) go(z, j, s); touchBusy = true; }
}
function onKey(e) {
  if (!lenis || blocked() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target; if (t.closest?.('input, textarea, select, [contenteditable]')) return;
  const down = ['ArrowDown', 'PageDown'], up = ['ArrowUp', 'PageUp'];
  if (e.key === ' ' && !t.closest?.('button, a, .deck, summary')) down.push(' ');
  const dir = down.includes(e.key) ? 1 : up.includes(e.key) ? -1 : 0; if (!dir) return;
  settle(); if (step(dir)) e.preventDefault();
}

const hold = (target, z, i) => {                                             // put the page exactly on a stop, drop the rest of the gesture
  snapping = true; lenis.scrollTo(target, { immediate: true, force: true }); snapping = false;
  z.cur = i; busy = true; animDone = true; lastInput = startedAt = now(); prevY = target;
};

/* every scroll position passes through here (Lenis, scrollbar, keyboard, touch momentum) */
function onScroll(y) {
  if (snapping || blocked()) { prevY = y; return; }
  for (const z of zones) {
    const s = stopsOf(z); if (s.length < 2) continue;
    const first = s[0], last = s[s.length - 1];

    if (z.cur != null) {                                                     // the zone is holding: never let it drift more than one stop away
      const i = Math.min(z.cur, s.length - 1), lo = s[Math.max(0, i - 1)], hi = s[Math.min(s.length - 1, i + 1)];
      if (i < s.length - 1 && y > hi + TOL) { hold(hi, z, i + 1); return; }
      if (i > 0 && y < lo - TOL) { hold(lo, z, i - 1); return; }
      if (y < first - TOL || y > last + TOL) z.cur = null;                   // left through the end it was holding: released
      else if (animDone) { const k = nearest(s, y); if (k !== i && Math.abs(y - s[k]) < TOL * 2 && Math.abs(k - i) === 1) z.cur = k; }   // a card button / key moved it one stop: follow
      continue;
    }
    /* not holding yet: arriving at a zone from outside (a big flick, the scrollbar, a link) lands exactly on its nearest end stop */
    if (prevY < first - TOL && y >= first) { hold(first, z, 0); return; }
    if (prevY > last + TOL && y <= last) { hold(last, z, s.length - 1); return; }
    if (inside(z, y)) z.cur = nearest(s, y);                                 // page loaded / jumped straight into the zone
  }
  prevY = y;
}

export function addScrollLock({ stops, duration = 1 }) {
  lenis = window.__lenis; if (!lenis) return () => {};
  const z = { stops, duration, cur: null }; zones.push(z);
  if (!installed) {
    installed = true; prevY = window.scrollY;
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKey, { capture: true });
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });   // scrollbar drag / native momentum
  }
  if (bound !== lenis) { bound = lenis; lenis.on('scroll', ({ scroll }) => onScroll(scroll)); }   // a new Lenis appears after a breakpoint change (window resize): listen to that one too
  return () => { const i = zones.indexOf(z); if (i >= 0) zones.splice(i, 1); };
}
