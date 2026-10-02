// ════════════════════════════════════════════════════════════════
//  THE FINALE TRANSITION + THE NIGHT PAGE
//  Click the button → hearts and a few words float up and fill the screen → a pink veil → a new "page":
//  Raga's own night picture (assets/night/night.png) with live shooting stars, twinkles and fireflies on top.
//  Hearts = Twemoji (CC BY 4.0). Shooting stars, twinkles, fireflies and the rising words are live effects, not artwork.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import SplitType from 'split-type';
import { perf } from './perf.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const R = gsap.utils.random;
const NIGHT = f => new URL(`../assets/night/${f}`, import.meta.url).href;
const SKY = NIGHT('night.png');
const SKY_RATIO = 1177 / 1920, HORIZON = 0.72;                      // the picture's height / width, and where its horizon sits
const HEARTS = ['2764', '1f495', '1f496', '1f497', '1f49e', '1f493', '2764', '1f495'];
const heartUrl = c => new URL(`../assets/emoji/${c}.svg`, import.meta.url).href;

export function setupNight(cfg, { reduced, mobile }, cleanups) {
  const page = $('#night'), world = $('#nightWorld'), cv = $('#nightFx'), ctx = cv.getContext('2d');
  const back = $('#nightBack'), rise = $('#rise'), veil = $('#riseVeil'), main = $('main');
  let split = null;
  const tiny = new Image(); let built = false, open = false, busy = false, raf = null, t0 = 0, last = 0;
  let stage, sky, ffBack, ffFront, W = 0, H = 0, dpr = 1, nffTweens = [];
  const intro = { p: reduced ? 1 : 0 };
  const ptr = { x: 0, y: 0, cx: 0, cy: 0, lastMove: -99 };
  let shooters = [], nextShot = 0, twinkles = [];

  const preload = () => { if (!tiny.src) { tiny.src = SKY; tiny.decode?.().catch(() => {}); } };

  /* ───────── build the world once ───────── */
  function build() {
    if (built) return; built = true;
    world.innerHTML = '';
    const ffN = mobile ? 12 : 22, ffF = mobile ? 4 : 7;
    const dots = (n, cls) => Array.from({ length: n }, () => `<i class=\"${cls}\" style=\"left:${R(0, 100).toFixed(1)}%;top:${R(cls === 'nff nff--f' ? 80 : 74, 99).toFixed(1)}%;--bt:${R(2, 5).toFixed(1)}s;--bd:${(-R(0, 5)).toFixed(1)}s\"></i>`).join('');
    world.innerHTML = `<div class=\"nstage\" id=\"nStage\">
      <div class=\"night__sky\"></div>
      <div class=\"night__ff night__ff--back\">${dots(ffN, 'nff')}</div>
      <div class=\"night__ff night__ff--front\">${dots(ffF, 'nff nff--f')}</div>
    </div>`;
    world.appendChild(cv);                                            // twinkles + shooting stars on top of the picture
    stage = $('#nStage', world); sky = $('.night__sky', stage); ffBack = $('.night__ff--back', stage); ffFront = $('.night__ff--front', stage);
    sky.style.backgroundImage = `url(${SKY})`;
    if (!reduced) {
      nffTweens = $$('.nff', stage).map(f => gsap.to(f, { x: () => R(-90, 90), y: () => R(-60, 40), duration: () => R(3, 7), ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true, delay: R(0, 2) }));
    }
    twinkles = Array.from({ length: mobile ? 26 : 46 }, () => ({ x: Math.random(), y: Math.random() * 0.5, r: R(0.6, 1.5), ph: R(0, 6.28), sp: R(0.8, 2.6), d: R(0.1, 0.5), big: Math.random() < 0.1 }));
    resize();
  }

  function resize() {
    if (!built) return;
    W = innerWidth; H = innerHeight; dpr = perf.dpr(mobile ? 1.5 : 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    /* a cover-sized box with the picture's own proportions, so its horizon stays at the same height on every screen */
    const sw = Math.max(W, H / SKY_RATIO) * 1.04, sh = sw * SKY_RATIO;
    Object.assign(stage.style, { width: `${sw}px`, height: `${sh}px`, left: `${(W - sw) / 2}px`, top: `${HORIZON * H - HORIZON * sh}px` });
  }

  /* ───────── shooting stars ───────── */
  function shoot(x, y, bright) {
    const ang = R(16, 34) * Math.PI / 180, dir = x == null ? (Math.random() < 0.5 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1), sp = R(900, 1500) * (W / 1440 < 0.5 ? 0.6 : 1);
    const sx = x ?? (dir > 0 ? R(-0.05, 0.65) * W : R(0.35, 1.05) * W), sy = y ?? R(-0.04, 0.34) * H;
    shooters.push({ x: sx, y: sy, vx: Math.cos(ang) * sp * dir, vy: Math.sin(ang) * sp, life: R(0.75, 1.25), age: 0, tail: R(150, 300), warm: bright || Math.random() < 0.3 });
  }
  function drawFx(dt, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const ox = ptr.cx, oy = ptr.cy, k = Math.min(1, intro.p * 1.2);
    for (const s of twinkles) {                                          // twinkling stars, two or three parallax depths
      const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * k;
      const x = s.x * W + ox * s.d * 30, y = s.y * H + oy * s.d * 16 + (intro.p - 1) * s.d * H * 0.08;
      ctx.fillStyle = `rgba(255,244,250,${a})`; ctx.fillRect(x, y, s.r * 1.6, s.r * 1.6);
      if (s.big) { ctx.strokeStyle = `rgba(255,230,240,${a * 0.5})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 7, y + 0.8); ctx.lineTo(x + 8, y + 0.8); ctx.moveTo(x + 0.8, y - 7); ctx.lineTo(x + 0.8, y + 8); ctx.stroke(); }
    }
    for (let i = shooters.length - 1; i >= 0; i--) {                     // shooting stars
      const s = shooters[i]; s.age += dt; if (s.age > s.life) { shooters.splice(i, 1); continue; }
      const p = s.age / s.life, a = Math.sin(Math.PI * Math.min(1, p * 1.05)), x = s.x + s.vx * s.age, y = s.y + s.vy * s.age;
      const L = Math.hypot(s.vx, s.vy), tx = x - (s.vx / L) * s.tail * (0.4 + 0.6 * a), ty = y - (s.vy / L) * s.tail * (0.4 + 0.6 * a);
      const g = ctx.createLinearGradient(x, y, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.25, s.warm ? `rgba(255,190,200,${a * 0.6})` : `rgba(190,215,255,${a * 0.55})`); g.addColorStop(1, 'rgba(160,170,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 9); rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - 9, y - 9, 18, 18);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ───────── the loop: pointer / idle sway, camera tilt, drawing ───────── */
  function frame(ts) {
    const t = ts / 1000, dt = Math.min(0.05, t - last || 0.016); last = t;
    const idle = t - ptr.lastMove > 2.5;
    const tx = idle ? Math.sin(t * 0.22) * 0.7 : ptr.x, ty = idle ? Math.sin(t * 0.17 + 1) * 0.25 : ptr.y;
    ptr.cx += (tx - ptr.cx) * 0.045; ptr.cy += (ty - ptr.cy) * 0.045;
    const e = 1 - intro.p, px = ptr.cx, py = ptr.cy, k = mobile ? 0.55 : 1;
    sky.style.transform = `translate3d(${px * -6 * k}px, ${py * -4 * k - e * H * 0.05}px, 0) scale(1.03)`;
    ffBack.style.transform = `translate3d(${px * -30 * k}px, ${py * -10 * k}px, 0)`;
    ffFront.style.transform = `translate3d(${px * -70 * k}px, ${py * -22 * k}px, 0)`;
    if (!reduced) {
      if (t > nextShot && intro.p > 0.25) { shoot(); if (Math.random() < 0.3) setTimeout(shoot, 180); nextShot = t + R(1.1, mobile ? 4 : 3.2); }
      drawFx(dt, t);
    } else drawFx(0, t);
    raf = requestAnimationFrame(frame);
  }
  const start = () => { if (raf == null) { last = 0; nextShot = performance.now() / 1000 + 0.7; raf = requestAnimationFrame(frame); } };
  const stop = () => { if (raf != null) { cancelAnimationFrame(raf); raf = null; } };
  const onVis = () => { if (document.hidden) stop(); else if (open) start(); };

  /* ───────── enter / leave the page ───────── */
  function enter() {
    build(); preload(); open = true; setShy(false);
    page.hidden = false; page.classList.remove('is-out'); main.inert = true; document.body.classList.add('night-open');
    perf.cover(true); nffTweens.forEach(t => t.paused(false));       // the sunset underneath stops drawing while this page covers it
    window.__lenis?.stop();
    split?.revert(); split = new SplitType($('#nightTitle'), { types: 'words' }); const words = split.words;
    const sub = $('#nightShy'), hint = $('#nightHint'), credit = $('#nightCredit');
    gsap.set([sub, hint, back, credit], { opacity: 0 }); gsap.set(words, { opacity: 0, y: 30, scale: 0.9 });
    gsap.set(page, { opacity: 1 });
    start();
    if (reduced) { intro.p = 1; gsap.set(words, { opacity: 1, y: 0, scale: 1 }); gsap.set([sub, hint, back, credit], { opacity: 1 }); back.focus({ preventScroll: true }); return; }
    intro.p = 0;
    gsap.timeline()
      .to(intro, { p: 1, duration: 5, ease: 'power3.out' }, 0)
      .to(words, { opacity: 1, y: 0, scale: 1, duration: 1.5, stagger: 0.18, ease: 'power3.out' }, 1.6)
      .to(sub, { opacity: 1, duration: 1.6 }, 2.8)
      .to([hint, credit], { opacity: 1, duration: 1.4 }, 4.2)
      .to(back, { opacity: 1, duration: 1.2, onComplete: () => back.focus({ preventScroll: true }) }, 4.4)
      .call(() => shoot(W * 0.62, H * 0.12, true), null, 1.2);
  }
  function leave() {
    if (!open || busy) return; busy = true;
    perf.cover(false);
    gsap.to(page, { opacity: 0, duration: reduced ? 0.3 : 1.4, ease: 'power1.inOut', onComplete: () => {
      page.hidden = true; open = false; busy = false; stop(); shooters = []; nffTweens.forEach(t => t.paused(true));
      main.inert = false; document.body.classList.remove('night-open'); window.__lenis?.start(); $('#loveBtn')?.focus({ preventScroll: true });
    } });
  }

  /* ───────── the hearts that fill the screen ───────── */
  function transition() {
    if (open || busy) return; busy = true; preload();
    const vw = innerWidth, vh = innerHeight;
    window.__lenis?.stop();
    rise.classList.add('is-on');
    const done = () => { rise.classList.remove('is-on'); rise.querySelectorAll('.rh, .rword').forEach(n => n.remove()); gsap.set(veil, { opacity: 0 }); busy = false; };
    if (reduced) {                                                       // no hearts: just a soft cross-fade
      gsap.timeline({ onComplete: done }).to(veil, { opacity: 1, duration: 0.6 }).call(() => { busy = false; enter(); busy = true; }).to(veil, { opacity: 0, duration: 0.8 }, '+=0.2');
      return;
    }
    const n = mobile ? 120 : 210, big = mobile ? 12 : 18, span = 2.5, frag = document.createDocumentFragment(), items = [];
    for (let i = 0; i < n + big; i++) {
      const isBig = i >= n, size = isBig ? R(mobile ? 170 : 230, mobile ? 270 : 400) : R(mobile ? 30 : 38, mobile ? 90 : 130);
      const w = document.createElement('div'); w.className = 'rh';
      const im = document.createElement('img'); im.src = heartUrl(HEARTS[Math.floor(R(0, HEARTS.length))]); im.alt = ''; im.draggable = false;
      im.style.cssText = `width:${size}px;height:${size}px;--sw:${R(2.2, 4.6).toFixed(2)}s;--sa:${R(4, 12).toFixed(1)}deg;--sx:${R(10, 34).toFixed(0)}px;animation-delay:${(-R(0, 4)).toFixed(2)}s;opacity:${isBig ? 0.8 : 1}`;
      w.appendChild(im); frag.appendChild(w);
      items.push({ w, size, isBig, x: R(-0.04 * vw, vw * 1.02 - size * 0.5), delay: isBig ? R(0.2, span + 0.4) : (i / n) * span + R(0, 0.12), dur: isBig ? R(3.4, 4.6) : R(3.0, 4.6) });
    }
    rise.appendChild(frag);
    /* the words rise with the hearts, on top of them: each word once, one after another, alternating sides, big and slow enough to read */
    const words = cfg.risingWords?.length ? cfg.risingWords : [], wfrag = document.createDocumentFragment(), witems = [];
    words.forEach((text, i) => {
      const caps = text === text.toUpperCase() && /[A-Z]/.test(text);
      const w = document.createElement('div'); w.className = `rword${caps ? ' rword--caps' : ''}`; w.textContent = text;
      const size = caps ? (mobile ? 30 : 44) : (mobile ? 46 : 70);
      w.style.fontSize = `${size}px`; w.style.setProperty('--sw', '3.4s'); w.style.setProperty('--sx', '8px'); w.style.setProperty('--sa', '2deg');
      wfrag.appendChild(w); witems.push({ w, size, i, delay: 0.35 + i * 0.62, dur: 5.4 });
    });
    rise.appendChild(wfrag);
    witems.forEach(it => {
      const ww = it.w.offsetWidth, m = 0.05 * vw, left = it.i % 2 === 0;
      it.x = Math.max(8, left ? R(m, m + 0.12 * vw) : vw - ww - R(m, m + 0.12 * vw));      // one word on the left, the next on the right
    });
    const tl = gsap.timeline({ onComplete: done });
    witems.forEach(it => {
      gsap.set(it.w, { x: it.x, y: vh + it.size });
      tl.to(it.w, { y: -it.size * 2, duration: it.dur, ease: 'none' }, it.delay);
    });
    items.forEach(it => {
      gsap.set(it.w, { x: it.x, y: vh + it.size });
      tl.to(it.w, { y: -it.size * 1.4, duration: it.dur, ease: 'none' }, it.delay);
    });
    tl.to(veil, { opacity: 0.94, duration: 1.0, ease: 'power1.inOut' }, 1.8);        // the pink wash that hides the swap
    tl.call(() => { busy = false; enter(); busy = true; }, null, 3.1);              // the night page appears underneath
    tl.to(veil, { opacity: 0, duration: 1.8, ease: 'power1.inOut' }, 3.2);          // …and the veil lifts, hearts keep rising over it
  }

  /* ───────── events ───────── */
  const onMove = e => { const r = page.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1; ptr.lastMove = performance.now() / 1000; };
  const onTap = e => {
    if (e.target.closest('button')) return; if (!reduced) { shoot(e.clientX, e.clientY, true); setTimeout(() => shoot(), 150); } };
  const onKey = e => { if (open && e.key === 'Escape') leave(); };
  /* the shy box: one tap swaps its words (config: nightShyClick), another tap puts the first ones back */
  const shyBox = $('#nightShy'), shyText = $('.shy__text', shyBox);
  const setShy = on => { shyBox.classList.toggle('is-mommy', on); shyText.textContent = (on ? cfg.nightShyClick : cfg.nightShy) || shyText.textContent; };
  const onShy = () => {
    setShy(!shyBox.classList.contains('is-mommy'));
    shyBox.classList.remove('pop'); void shyBox.offsetWidth; if (!reduced) shyBox.classList.add('pop');
  };
  shyBox.addEventListener('click', onShy);
  const onWheel = e => { if (open) e.preventDefault(); };
  page.addEventListener('pointermove', onMove); page.addEventListener('click', onTap); page.addEventListener('wheel', onWheel, { passive: false });
  back.addEventListener('click', leave); window.addEventListener('keydown', onKey); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', onVis);
  cleanups.push(() => {
    stop(); page.hidden = true; main.inert = false; document.body.classList.remove('night-open'); perf.cover(false);
    page.removeEventListener('pointermove', onMove); page.removeEventListener('click', onTap); page.removeEventListener('wheel', onWheel);
    shyBox.removeEventListener('click', onShy); back.removeEventListener('click', leave); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis);
  });
  return { transition, preload, get busy() { return busy || open; } };
}
