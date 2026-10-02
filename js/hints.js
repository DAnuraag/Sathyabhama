// ════════════════════════════════════════════════════════════════
//  TAP HINTS: a tiny, soft pulsing dot on the things you can click or tap, so it's clear what is clickable and what isn't.
//  Each dot disappears once that thing has been tried. (A live effect: one little element per target.)
// ════════════════════════════════════════════════════════════════
/* [selector, where the dot sits] */
const TARGETS = [
  ['#bheart', 'tr'],              // the pixel heart
  ['.reason__beast', 'top'],      // the animals in the trail
  ['.note', 'br'],                // the promise cards
  ['.print', 'tr'],               // photos (if there are any)
  ['#nightShy', 'tl']             // the shy box on the night page
];

export function addTapHints(root = document) {
  TARGETS.forEach(([sel, pos]) => root.querySelectorAll(sel).forEach(el => {
    if (el.querySelector(':scope > .tap-dot')) return;
    const dot = document.createElement('i'); dot.className = `tap-dot tap-dot--${pos}`; dot.setAttribute('aria-hidden', 'true');
    el.appendChild(dot); el.dataset.hinted = '';
  }));
  /* once a thing has been tapped, its dot goes away (the deck counts as one thing) */
  root.addEventListener('click', e => {
    const el = e.target.closest?.('[data-hinted]'); if (!el) return;
    (el.closest('.deck') || el).classList.add('hint-done');
  }, { capture: true });
}
