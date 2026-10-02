// ════════════════════════════════════════════════════════════════
//  THE TRAIL (what I love about you) + THE DECK (little notes)
//  Both are scroll-driven parallax pieces with real pixel-art animals walking in.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { critterHTML, drive, refreshStates } from './fauna.js';
import { burstHearts } from './effects.js';
import { addScrollLock } from './lock.js';
import { sleepTweens } from './perf.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const two = n => String(n).padStart(2, '0');

/* default animal per row (override with `animal:` in config.js) */
const DEFAULT_ANIMALS = ['bear', 'rabbit', 'wolf', 'boar', 'dog', 'deer', 'squirrel', 'cat'];

/* ───────────── RENDER ───────────── */
export function renderReasons(cfg, ICONS) {
  /* drifting pixel leaves (the pixelarticons leaf, tinted) at two depths */
  const leaf = (i, back) => {
    const sz = back ? 22 + (i * 7) % 16 : 38 + (i * 11) % 26;
    const col = ['#ffb3a0', '#ffd6a0', '#e6b8c6', '#ff9d8a'][i % 4];
    return `<i class="lf" data-i="${i}" style="left:${(i * 37 + (back ? 9 : 21)) % 96}%;--sz:${sz}px;--c:${col};--sw:${(3 + (i % 5) * 0.9).toFixed(1)}s;--dl:${((i * 0.7) % 3).toFixed(1)}s;opacity:${back ? 0.55 : 0.85}">${ICONS.leaf ?? ''}</i>`;
  };
  const mob = matchMedia('(max-width: 760px)').matches;
  $('#reasonLeaves').innerHTML =
    `<div class="lf-layer lf-layer--back">${Array.from({ length: mob ? 7 : 12 }, (_, i) => leaf(i, true)).join('')}</div>` +
    `<div class="lf-layer lf-layer--front">${Array.from({ length: mob ? 3 : 6 }, (_, i) => leaf(i + 20, false)).join('')}</div>`;
  $('#reasonWalk').innerHTML = [['dog', 0], ['cat', 1], ['squirrel', 2]].map(([a, i]) => `<div class="rw" data-i="${i}">${critterHTML(a, { state: 'idle' })}</div>`).join('');

  $('#reasonGrid').innerHTML = cfg.reasons.map((r, i) => {
    const animal = r.animal || DEFAULT_ANIMALS[i % DEFAULT_ANIMALS.length];
    const beastRight = i % 2 === 0;                                  // text on the left → animal on the right, facing the text
    return `<li class="reason ${beastRight ? 'reason--beast-r' : 'reason--beast-l'}" data-speed="${[0.9, 1.25, 1.0, 1.4, 1.15, 0.8, 1.3, 1.05][i % 8]}" data-dir="${beastRight ? 1 : -1}">
      <div class="reason__txt">
        <span class="reason__num" aria-hidden="true">${two(i + 1)}</span>
        <span class="reason__icon" aria-hidden="true">${ICONS[r.icon] ?? ''}</span>
        <h3 class="reason__title">${esc(r.title)}</h3>
        <p class="reason__text">${esc(r.text)}</p>
      </div>
      <button class="reason__beast" type="button" aria-label="Say hi to the ${esc(animal)}">${critterHTML(animal, { flip: beastRight, state: 'idle' })}</button>
    </li>`;
  }).join('');
}

export function renderNotes(cfg, ICONS) {
  const notes = cfg.notes || [];
  $('#notes').style.setProperty('--n', notes.length);
  $('#deck').innerHTML = notes.map((n, i) => `
    <article class="note">
      <span class="note__mark" aria-hidden="true">${ICONS.heart ?? ''}</span>
      <p class="note__no">${esc(cfg.notesLabel || 'Promise')} ${two(i + 1)}</p>
      <h3 class="note__title">${esc(n.title)}</h3>
      <p class="note__text">${esc(n.text)}</p>
    </article>`).join('');
  $('#notesCount').textContent = `01 / ${two(notes.length)}`;
}

/* ───────────── REASONS: text blocks glide in, each animal walks in from the edge of the screen ───────────── */
export function setupReasons(reduced, cleanups) {
  const rows = $$('.reason');
  rows.forEach(li => {
    const dir = +li.dataset.dir, sp = parseFloat(li.dataset.speed);
    const txt = $('.reason__txt', li), beast = $('.reason__beast', li), crit = $('.critter', li), num = $('.reason__num', li), icon = $('.reason__icon svg', li);

    const hi = () => {                                               // tap the animal or the words: hearts + a little hop
      const r = (beast.getBoundingClientRect());
      burstHearts(r.left + r.width / 2, r.top + r.height * 0.3, 6, { dist: [40, 140], size: [12, 24] });
      if (reduced) return;
      gsap.timeline().to(beast, { y: -26, duration: 0.16, ease: 'power2.out' }).to(beast, { y: 0, duration: 0.5, ease: 'bounce.out' });
      if (icon) gsap.timeline({ onComplete: () => gsap.set(icon, { clearProps: 'transform' }) })
        .to(icon, { scale: 1.35, rotation: -12, duration: 0.16, ease: 'power2.out' }).to(icon, { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
    };
    beast.addEventListener('click', hi); txt.addEventListener('click', hi);
    cleanups.push(() => { beast.removeEventListener('click', hi); txt.removeEventListener('click', hi); });
    if (reduced) return;

    /* depths: the whole row (slow/fast by data-speed) and the big ghost number. The animal rides with the row so it stays on the text's baseline */
    const amp = (sp - 1) * 220;
    gsap.fromTo(li, { y: amp }, { y: -amp, ease: 'none', scrollTrigger: { trigger: li, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(num, { yPercent: 55 }, { yPercent: -55, ease: 'none', scrollTrigger: { trigger: li, start: 'top bottom', end: 'bottom top', scrub: true } });

    /* entry: the words slide in from their own side and settle */
    gsap.from(txt, { opacity: 0, x: -dir * 90, y: 50, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 84%', toggleActions: 'play none none reverse' } });
    gsap.from(icon, { scale: 0, rotation: -40, duration: 0.9, ease: 'back.out(2.2)', delay: 0.25, scrollTrigger: { trigger: li, start: 'top 84%', toggleActions: 'play none none reverse' } });

    /* entry: the animal walks in from off-screen, and rests once it's there */
    const walk = gsap.fromTo(beast, { x: () => dir * Math.min(innerWidth * 0.75, 760) }, { x: 0, ease: 'none',
      scrollTrigger: { trigger: li, start: 'top 98%', end: 'top 42%', scrub: true, invalidateOnRefresh: true } });
    cleanups.push(drive(crit, sc => sc && walk.progress() > 0.002 && walk.progress() < 0.995));
  });

  if (reduced) return;
  /* leaves: each one falls the whole length of the section at its own speed (two depth layers) */
  $$('.lf').forEach((lf, i) => {
    const back = !!lf.closest('.lf-layer--back');
    gsap.fromTo(lf, { y: () => -innerHeight * 0.1 }, { y: () => $('#reasons').offsetHeight * (back ? 0.78 + (i % 5) * 0.05 : 1.0 + (i % 3) * 0.12), x: () => (i % 2 ? 1 : -1) * (40 + (i % 4) * 30), ease: 'none',
      scrollTrigger: { trigger: '#reasons', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  /* the procession: three animals cross the ground at the end of the trail */
  const walkers = $$('.rw');
  walkers.forEach((w, i) => {
    const crit = $('.critter', w);
    const tw = gsap.fromTo(w, { x: () => -innerWidth * (0.25 + i * 0.22) }, { x: () => innerWidth * (1.05 - i * 0.05), ease: 'none',
      scrollTrigger: { trigger: '#reasonWalk', start: 'top 105%', end: 'bottom 20%', scrub: true, invalidateOnRefresh: true } });
    cleanups.push(drive(crit, sc => sc && tw.progress() > 0.002 && tw.progress() < 0.998));
  });
}

/* ───────────── THE DECK: pinned stage, cards deal in one by one while you scroll ───────────── */
const FAUNA_DESKTOP = [
  { a: 'deer',   depth: 'near', side: 'l', s: 4 },
  { a: 'bear',   depth: 'near', side: 'r', s: 5 },
  { a: 'cat',    depth: 'far',  dir: 1,  s: 6, bottom: 9,  from: -0.05, to: 1.15 },
  { a: 'squirrel', depth: 'far', dir: -1, s: 4, bottom: 13, from: 1.1,   to: -0.2 },
  { a: 'dog',    depth: 'far',  dir: 1,  s: 7, bottom: 6,  from: -0.5,  to: 1.05 }
];
const FAUNA_MOBILE = [
  { a: 'deer',   depth: 'near', side: 'l', s: 3 },
  { a: 'cat',    depth: 'far',  dir: 1,  s: 4, bottom: 8,  from: -0.1, to: 1.3 },
  { a: 'squirrel', depth: 'far', dir: -1, s: 3, bottom: 14, from: 1.2,  to: -0.3 }
];
const BASE_ROT = [-3, 2.4, -1.8, 3, -2.6, 1.6, -2.2, 2];
const BASE_X = [-26, 22, -16, 26, -22, 14, -18, 18];

export function setupNotes(cfg, { reduced, mobile }, cleanups) {
  const cards = $$('.note'), n = cards.length;
  if (reduced || !n) return;
  const stage = $('#notesStage'), head = $('.notes__head'), hint = $('#notesHint'), count = $('#notesCount'), deck = $('#deck'), host = $('#notesFauna');
  const O = 0.35, T = n + O + 0.4 + 0.8;                             // timeline: a small lead-in, n cards (1 unit each), then a hold on the last card
  const vh = () => innerHeight, vw = () => innerWidth, k = mobile ? 0.45 : 1;

  /* animals around the edges of the screen */
  const plan = mobile ? FAUNA_MOBILE : FAUNA_DESKTOP;
  host.innerHTML = plan.map((p, i) => `<div class="nf nf--${p.depth}" data-i="${i}" style="${p.side === 'r' ? 'right' : 'left'}:${p.depth === 'near' ? (mobile ? 1 : 2) + 'vw' : 0};${p.depth === 'far' ? `bottom:${p.bottom}vh;` : ''}">${
    critterHTML(p.a, { flip: p.side === 'r' || p.dir === -1, state: 'idle', scale: p.s })}</div>`).join('');
  cleanups.push(() => { host.innerHTML = ''; });
  const nfs = $$('.nf', host);

  /* fireflies: only here. Two depths (behind and in front of the cards), each wandering on its own and blinking */
  const ffN = mobile ? 13 : 30;
  const mkFF = (i, front) => `<i class="ff${front ? ' ff--front' : ''}" style="left:${Math.round(Math.random() * 96)}%;top:${Math.round(8 + Math.random() * 84)}%;--bt:${(1.8 + Math.random() * 3).toFixed(1)}s;--bd:${(-Math.random() * 4).toFixed(1)}s"></i>`;
  const ffBack = document.createElement('div'), ffFront = document.createElement('div');
  ffBack.className = 'ff-layer ff-layer--back'; ffFront.className = 'ff-layer ff-layer--front';
  ffBack.innerHTML = Array.from({ length: Math.round(ffN * 0.65) }, (_, i) => mkFF(i, false)).join('');
  ffFront.innerHTML = Array.from({ length: Math.round(ffN * 0.35) }, (_, i) => mkFF(i, true)).join('');
  stage.insertBefore(ffBack, deck); stage.appendChild(ffFront);
  cleanups.push(() => { ffBack.remove(); ffFront.remove(); });
  const wander = gsap.utils.random;
  const ffTweens = $$('.ff', stage).map(f => gsap.to(f, { x: () => wander(-80, 80), y: () => wander(-60, 60), duration: () => wander(3, 7), ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true, delay: wander(0, 2) }));
  cleanups.push(sleepTweens($('#notes'), ffTweens));          // the fireflies rest while the section is off screen

  gsap.set(cards, { opacity: 1 });
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
    trigger: '#notes', start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,   // maps exactly onto the sticky range: the stage is pinned the whole time
    onUpdate: () => { update(); refreshStates(); } } });
  gsap.fromTo(head, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '#notes', start: 'top 85%', end: 'top 15%', scrub: true } });   // the heading arrives while the stage slides in
  tl.to(head, { y: -34, duration: T }, 0);                           // then drifts up slowly: a slower layer than the cards
  tl.to(hint, { opacity: 0, duration: 0.5 }, 0.6);
  tl.fromTo(ffBack, { y: 0 }, { y: -110, duration: T }, 0);          // fireflies drift upward at two different speeds
  tl.fromTo(ffFront, { y: 0 }, { y: -320, duration: T }, 0);

  cards.forEach((card, i) => {
    const mark = $('.note__mark', card), side = i % 2 ? -1 : 1;
    tl.fromTo(card, { x: () => side * vw() * (mobile ? 0.8 : 0.55), y: () => vh() * 1.05, rotation: side * 16, scale: 1 },
      { x: BASE_X[i % 8] * k, y: 0, rotation: BASE_ROT[i % 8] * (mobile ? 0.7 : 1), duration: 1, ease: 'power3.out' }, O + i);
    tl.fromTo(mark, { yPercent: 70, rotation: side * 12 }, { yPercent: -45, rotation: 0, duration: 1.5 }, O + i);   // the big pixel heart moves at its own speed inside the card
    for (let j = 0; j < i; j++) {                                    // older cards sink back into the pile
      const d = i - j;
      tl.to(cards[j], { scale: Math.max(0.78, 1 - 0.045 * d), y: -18 * d * (mobile ? 0.6 : 1), opacity: d > 2 ? 0 : 1, duration: 1, ease: 'power2.inOut' }, O + i);
    }
  });

  /* animals: the two big ones walk in at the start, the small ones cross the screen while you scroll */
  plan.forEach((p, i) => {
    const el = nfs[i], crit = $('.critter', el);
    if (p.depth === 'near') {
      const sd = p.side === 'r' ? 1 : -1;
      tl.fromTo(el, { x: () => sd * (vw() * 0.5 + 320) }, { x: 0, duration: 1.3, ease: 'power1.out' }, 0.1);
      tl.to(el, { x: () => -sd * 46, duration: T - 1.4 }, 1.4);      // then a slow drift: the nearest layer
      cleanups.push(drive(crit, sc => sc && tl.time() < 1.4));
    } else {
      tl.fromTo(el, { x: () => p.from * vw() }, { x: () => p.to * vw(), duration: T }, 0);
      cleanups.push(drive(crit, sc => sc));
    }
  });

  /* which card is on top → the counter */
  let idx = 0;
  function update() {
    const i = Math.max(0, Math.min(n - 1, Math.floor(tl.time() - O - 0.5)));
    if (i !== idx) { idx = i; count.textContent = `${two(i + 1)} / ${two(n)}`; }
  }
  update();

  /* tap / Enter on the deck: a few hearts, then scroll to the next card */
  const next = () => {
    const st = tl.scrollTrigger, time = idx < n - 1 ? idx + 2 + O : T;
    const y = st.start + (st.end - st.start) * Math.min(1, time / T);
    const r = cards[idx].getBoundingClientRect();
    burstHearts(r.left + r.width / 2, r.top + r.height / 2, 7, { dist: [50, 170], size: [12, 26] });
    window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: 'smooth' });
  };
  const onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
  /* the deck holds on every card: one scroll gesture = one card (see lock.js) */
  cleanups.push(addScrollLock({
    stops: () => { const st = tl.scrollTrigger; return [st.start, ...cards.map((_, i) => st.start + (st.end - st.start) * (O + 1 + i) / T)]; },
    duration: 1
  }));

  /* start/end depend on layout: re-measure after fonts and images settle */
  const re = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(re);
  addEventListener('load', re, { once: true });
  deck.addEventListener('click', next); deck.addEventListener('keydown', onKey);
  cleanups.push(() => { deck.removeEventListener('click', next); deck.removeEventListener('keydown', onKey); });
}
