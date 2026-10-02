// ════════════════════════════════════════════════════════════════
//  PHOTOS: "Us, so far". Whatever pictures are in assets/photos/ show up here on their own.
//  No pictures = the section stays hidden (the HTML has the `hidden` attribute).
//  Vite finds the files at build/dev time (import.meta.glob), so there is nothing to list in config.js.
// ════════════════════════════════════════════════════════════════
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const files = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const PHOTOS = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url]) => ({ url, name: path.split('/').pop() }));

/* returns true when there is something to show */
export function renderPhotos(cfg) {
  const sec = $('#photos');
  if (!PHOTOS.length) { sec.hidden = true; return false; }
  sec.hidden = false;
  const caps = cfg.photoCaptions || {};
  $('#photoGrid').innerHTML = PHOTOS.map((p, i) => {
    const cap = caps[p.name] || '';
    return `<li class="print-wrap" style="--r:${[-1.8, 1.4, -0.8, 2, -1.3, 0.9][i % 6]}deg">
      <button class="print" type="button" data-i="${i}" aria-label="Open photo ${i + 1} of ${PHOTOS.length}${cap ? ': ' + esc(cap) : ''}">
        <img src="${p.url}" alt="${esc(cap || `Photo ${i + 1}`)}" loading="lazy" decoding="async" />
        ${cap ? `<span class="print__cap">${esc(cap)}</span>` : ''}
      </button></li>`;
  }).join('');
  return true;
}

export function setupPhotos(cfg, reduced, cleanups) {
  if (!PHOTOS.length) return;
  const caps = cfg.photoCaptions || {};
  const dlg = $('#lightbox'), img = $('#lightboxImg'), cap = $('#lightboxCap'), count = $('#lbCount');
  let cur = 0, lastFocus = null;

  /* lazy images change the page height as they load: re-measure the scroll triggers (debounced) */
  let t;
  const reflow = () => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 250); };
  const imgs = [...document.querySelectorAll('#photoGrid img')];
  imgs.forEach(im => { if (!im.complete) im.addEventListener('load', reflow, { once: true }); });
  cleanups.push(() => clearTimeout(t));

  /* reveal: each print rises in as it enters the screen */
  if (!reduced) {
    const prints = [...document.querySelectorAll('.print')];
    gsap.set(prints, { opacity: 0, y: 60 });
    ScrollTrigger.batch(prints, { start: 'top 92%', once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', overwrite: true }) });
  }

  /* viewer */
  const show = i => {
    cur = (i + PHOTOS.length) % PHOTOS.length;
    const p = PHOTOS[cur], c = caps[p.name] || '';
    img.src = p.url; img.alt = c || `Photo ${cur + 1}`;
    cap.textContent = c; cap.hidden = !c;
    count.textContent = `${cur + 1} / ${PHOTOS.length}`;
  };
  const open = i => { lastFocus = document.activeElement; show(i); dlg.showModal(); window.__lenis?.stop(); };
  const close = () => { if (dlg.open) dlg.close(); };
  const onClose = () => { window.__lenis?.start(); lastFocus?.focus?.(); };
  const onGrid = e => { const b = e.target.closest('.print'); if (b) open(+b.dataset.i); };
  const onKey = e => { if (!dlg.open) return; if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); };
  const onBackdrop = e => { if (e.target === dlg) close(); };           // click outside the picture
  const multi = PHOTOS.length > 1;
  $('#lbPrev').hidden = $('#lbNext').hidden = !multi;
  const prev = () => show(cur - 1), next = () => show(cur + 1);

  $('#photoGrid').addEventListener('click', onGrid);
  $('#lbPrev').addEventListener('click', prev); $('#lbNext').addEventListener('click', next); $('#lbClose').addEventListener('click', close);
  dlg.addEventListener('close', onClose); dlg.addEventListener('click', onBackdrop); window.addEventListener('keydown', onKey);
  cleanups.push(() => {
    $('#photoGrid').removeEventListener('click', onGrid);
    $('#lbPrev').removeEventListener('click', prev); $('#lbNext').removeEventListener('click', next); $('#lbClose').removeEventListener('click', close);
    dlg.removeEventListener('close', onClose); dlg.removeEventListener('click', onBackdrop); window.removeEventListener('keydown', onKey);
    if (dlg.open) dlg.close();
  });
}
