// ════════════════════════════════════════════════════════════════
//  MAIN: boot order, Lenis ⇄ ScrollTrigger sync, the ONE master timeline.
// ════════════════════════════════════════════════════════════════
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import config from '../config.js';
import { SCENE } from './layers.js';
import { view, measure, preloadLayers, buildScene, initMouseParallax, startLoops, addScrollTweens, applySceneTier, entries } from './parallax.js';
import { perf, sleepOffscreen, startGovernor } from './perf.js';
import { renderContent, initSectionAnimations } from './sections.js';
import * as fx from './effects.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = s => document.querySelector(s);
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
document.body.classList.add('is-loading');
window.__booted = true;      // index.html shows a hint if this never gets set

async function boot() {
  measure();
  const refs = renderContent(config, reduceMQ.matches);
  const loader = fx.createLoader(config.partnerName);

  /* build the scene DOM, then put UI/FX *between* the art layers */
  const { items } = buildScene();
  const sky = fx.mountSky(items);
  const title = fx.mountTitle(items, config.heroTitle);
  const extras = await fx.mountExtras(items);

  /* preload all art + fonts behind the loader */
  const minWait = new Promise(r => setTimeout(r, reduceMQ.matches ? 300 : 1500));
  await Promise.all([preloadLayers(p => loader.progress(p)), fontsReady(), minWait]);

  /* ── everything animated lives inside gsap.matchMedia ── */
  const mm = gsap.matchMedia();
  mm.add({ mobile: '(max-width: 768px)', desktop: '(min-width: 769px)', reduce: '(prefers-reduced-motion: reduce)' }, ctx => {
    const { mobile, reduce } = ctx.conditions;
    const cleanups = [];

    // static art in reduced-motion: no parallax, no smooth scroll, no ambient motion
    if (reduce) {
      staticTint(sky);
      cleanups.push(initSectionAnimations(config, refs, { reduced: true, mobile }));
      return () => cleanups.forEach(f => f());
    }

    /* Lenis smooth scroll, synced with ScrollTrigger + gsap.ticker (single RAF loop) */
    const lenis = new Lenis({ lerp: perf.lite ? 0.12 : 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.stop();                                         // locked until the loader lifts
    lenis.on('scroll', ScrollTrigger.update);
    const raf = t => lenis.raf(t * 1000);
    gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); });
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); lenis.scrollTo(a.getAttribute('href'), { offset: 0 }); }));

    cleanups.push(sleepOffscreen(), startGovernor());
    /* the watchdog stepped the quality down while running: flatten the scene, then rebuild the scroll timeline */
    const offTier = perf.onChange(() => { applySceneTier(); lenis.options.lerp = 0.12; sky.stars.rebuild(); ScrollTrigger.refresh(); });
    cleanups.push(offTier);
    cleanups.push(initMouseParallax(), startLoops());
    cleanups.push(fx.mountMist(items));
    cleanups.push(fx.mountHearts(items, $('#heartsNear')));
    fx.mountCritters(items).then(k => cleanups.push(k));
    cleanups.push(fx.initChips());
    if (!mobile && matchMedia('(hover: hover) and (pointer: fine)').matches) cleanups.push(fx.initCursor());
    if (!reduce) {                                          // warm & fuzzy extras: butterflies, tap puffs, a soft heart trail
      cleanups.push(fx.initButterflies(mobile ? 3 : 4));
      cleanups.push(fx.initTapPuffs());
      if (!mobile && matchMedia('(hover: hover) and (pointer: fine)').matches) cleanups.push(fx.initTrail());
    }
    fx.initParticles(mobile ? 12 : 44).then(k => cleanups.push(k)).catch(() => {});

    /* section triggers FIRST (they add pin spacing) … */
    cleanups.push(initSectionAnimations(config, refs, { reduced: false, mobile }));
    /* … then the one master timeline, refreshed last so 'max' includes every pin spacer */
    const master = buildMaster(sky, extras);
    cleanups.push(() => { master.st.kill(); master.tl.kill(); });

    ScrollTrigger.addEventListener('refresh', master.rebuild);
    cleanups.push(() => ScrollTrigger.removeEventListener('refresh', master.rebuild));
    return () => cleanups.forEach(f => f && f());
  });

  /* resize: re-measure the integer art scale; ScrollTrigger refreshes itself */
  let rt; let lastW = view.vw;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    const prevS = view.s; measure();
    if (view.s !== prevS || view.vw !== lastW) { lastW = view.vw; sky.stars.rebuild(); ScrollTrigger.refresh(); }
  }, 150); });

  /* refresh after images + fonts + window load */
  await fontsReady(); ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* loader lifts → hero intro */
  await loader.out();
  window.__lenis?.start();
  intro(title);
  ScrollTrigger.refresh();
}

/* ═════════ THE MASTER TIMELINE ═════════
   One scrubbed timeline for the whole page: art tint, sun, moon, stars, layer depth shifts. */
function buildMaster(sky, extras) {
  const tl = gsap.timeline({ paused: false, defaults: { ease: 'none' } });
  const tints = { gold: $('.tint--gold'), pink: $('.tint--pink'), violet: $('.tint--violet') };
  const nightEls = [...document.querySelectorAll('.layer__night')];
  const st = ScrollTrigger.create({ animation: tl, trigger: document.body, start: 0, end: 'max', scrub: 0.6, refreshPriority: -10, invalidateOnRefresh: false });

  const section = id => { const e = document.getElementById(id); return e.getBoundingClientRect().top + window.scrollY; };
  const ramp = (el, keys, prop = 'opacity') => {            // [[t, value], …]
    tl.set(el, { [prop]: keys[0][1] }, 0);
    for (let i = 1; i < keys.length; i++) {
      const [t0] = keys[i - 1], [t1, v] = keys[i];
      if (t1 > t0) tl.to(el, { [prop]: v, duration: t1 - t0 }, t0);
    }
  };

  /* a colour-grade overlay at opacity 0 is switched off completely, so the GPU doesn't keep full-screen layers for nothing */
  const fades = [...Object.values(tints), ...nightEls, sky.stars.canvas];
  /* lite: a 2% grade isn't worth a full-screen layer */
  const syncHidden = () => fades.forEach(el => { const off = (parseFloat(el.style.opacity) || 0) < (perf.lite ? 0.025 : 0.004);  if (el._off !== off) { el._off = off; el.classList.toggle('is-hidden', off); } });
  tl.eventCallback('onUpdate', syncHidden);

  const build = () => {
    const max = Math.max(1, ScrollTrigger.maxScroll(window));
    const f = id => gsap.utils.clamp(0, 1, section(id) / max);
    const T = { story: Math.max(f('story'), 0.02), reasons: f('reasons'), future: f('future'), letter: f('letter'), finale: f('finale'), end: 1 };
    const prog = st.progress;
    tl.clear();

    /* colour grade: golden hour (hero) → pink sunset (things I've noticed) → purple dusk fading to twilight blue
       (we're not perfect) → night (letter, finale). Keys sit at each section's top edge. */
    ramp(tints.gold,   [[0, 0.7], [T.story, 0.5], [T.reasons, 0]]);
    ramp(tints.pink,   [[0, 0], [T.story, 0.45], [T.reasons, 1], [T.future, 0.55], [T.letter, 0]]);
    ramp(tints.violet, [[0, 0], [T.reasons, 0.1], [T.future, 0.8], [T.letter, 1], [T.finale, 0.3]]);
    ramp(nightEls,     [[0, 0], [T.reasons, 0.04], [T.future, 0.18], [T.letter, 0.5], [T.finale, 1]]);   // per-layer midnight blue

    /* art layers + UI items: scroll depth */
    addScrollTweens(tl, T);

    /* sun sinks toward the horizon and shifts warmer, halo fades with it */
    const sink = view.s * 40;
    tl.to(sky.sun, { y: () => sink, duration: T.future }, 0);
    tl.to(sky.hot, { opacity: 1, duration: T.reasons }, 0);
    tl.to(sky.halo, { opacity: 0.0, duration: T.future * 0.8 }, T.story * 0.5);
    tl.to(sky.sun, { opacity: 0, duration: 0.03 }, T.future);

    /* stars fade in during the letter; moon rises for the finale */
    ramp(sky.stars.canvas, [[0, 0], [T.future, 0], [T.letter, 0.35], [T.finale, 1]]);
    tl.set(sky.moon, { y: () => view.s * 36, opacity: 0 }, 0);
    tl.to(sky.moon, { opacity: 1, duration: (T.finale - T.letter) * 0.6 }, T.letter);
    tl.to(sky.moon, { y: 0, duration: T.finale - T.letter }, T.letter);
    if (extras.couple) ramp(extras.couple, [[0, 0], [T.letter, 0], [T.finale + 0.02, 1]]);

    tl.set({}, {}, 1);                                        // timeline duration = exactly 1
    tl.progress(prog); syncHidden();
  };
  let building = false;
  const rebuild = () => { if (building) return; building = true; try { build(); } finally { building = false; } };
  build();
  return { tl, st, rebuild };
}

/* reduced-motion: a single static grade per section, no scrubbing */
function staticTint(sky) {
  const set = (cls, o) => $(`.tint--${cls}`).style.opacity = o;
  set('gold', 0.8);
  const grades = { story: { gold: .6, pink: .3 }, reasons: { pink: 1 }, future: { violet: .8, night: .18 }, letter: { violet: 1, night: .5 }, finale: { violet: .3, night: 1 } };
  const apply = id => { ['gold', 'pink', 'violet'].forEach(k => set(k, grades[id][k] ?? 0)); document.querySelectorAll('.layer__night').forEach(n => n.style.opacity = grades[id].night ?? 0); };
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && apply(e.target.id)), { rootMargin: '-45% 0px -45% 0px' });
  Object.keys(grades).forEach(id => io.observe(document.getElementById(id)));
  // the hero title belongs to the hero only; the moon appears with the letter/finale (instant, no motion)
  const title = document.querySelector('.scene-item--title');
  new IntersectionObserver(([e]) => { title.style.opacity = e.isIntersecting ? 1 : 0; }, { threshold: 0.6 }).observe(document.getElementById('hero'));
  new IntersectionObserver(([e]) => { sky.moon.style.opacity = e.isIntersecting ? 1 : 0; }, { rootMargin: '-30% 0px 0px 0px' }).observe(document.getElementById('finale'));
  sky.sun.style.opacity = 1;
}

/* hero intro: staggered char reveal with rotateX + chips + subtitle */
function intro(title) {
  // intro animates the CONTAINERS; the scroll-scrub fades animate the children → no property conflicts
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo(title.chars, { opacity: 0, rotationX: -95, y: 60, transformOrigin: '50% 100%', transformPerspective: 700 },
        { opacity: 1, rotationX: 0, y: 0, duration: 1.4, stagger: 0.09, ease: 'back.out(1.5)' })
    .fromTo('#heroUi', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1 }, '-=0.5')
    .fromTo('#musicBtn', { opacity: 0 }, { opacity: 1, duration: 0.9 }, '-=0.8');
  if (!reduceMQ.matches) gsap.to(title.glow, { opacity: 0.45, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  if (!reduceMQ.matches) gsap.to('.sun__halo', { scale: 1.06, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

function fontsReady() {
  return Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(r => setTimeout(r, 2500))]);
}

fx.initMusic(config.musicFile);
boot();
