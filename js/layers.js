// ════════════════════════════════════════════════════════════════
//  LAYER MANIFEST  –  the parallax engine builds the whole scene from this.
//  Art: "Parallax Sunset Mountains" by kayillustrations (CC BY 4.0)
//  Files are ordered FARTHEST → NEAREST. Depth is assigned automatically:
//      depth = 0.05 + (index / (totalLayers - 1)) * 0.95
// ════════════════════════════════════════════════════════════════
export const ART_DIR = 'assets/art/';
export const TILE = { w: 320, h: 180 };          // native pixel size of every layer

// ── GLOBAL TUNING ───────────────────────────────────────────────
export const SCENE = {
  perspective: 1200,    // px – CSS perspective on the scene
  zRange: 220,          // px – translateZ of the FARTHEST layer (nearest = 0). Bigger = more 3D.
  mouseX: 30,           // px – max horizontal mouse offset of the NEAREST layer
  mouseY: 15,           // px – max vertical mouse offset of the NEAREST layer
  tiltY: 1.2,           // deg – whole-scene rotateY at screen edge
  tiltX: 0.8,           // deg – whole-scene rotateX at screen edge
  scrollShift: 0.30,    // × viewport height the NEAREST layer travels upward while scrolling
  scrollCurve: 1.6,     // >1 = far layers move much slower than near ones
  heroShare: 0.6,       // fraction of the total shift that happens inside the pinned hero
  pad: 140              // px – extra width each side so mouse/tilt never reveals an edge
};

// ── LAYERS ──────────────────────────────────────────────────────
//  file     image in assets/art/
//  type     sky | cloud | mountain | hill | tree | fg
//  anchor   'bottom' (default) or 'top' (sky)
//  fill     colour of the layer's bottom row. Extends the layer downward so it never shows a gap
//           when it travels upward on scroll (null = transparent bottom, e.g. foreground trees)
//  loopX    seconds for one seamless horizontal loop (clouds drift). omit = static
//  blur     px of depth-of-field blur (nearest layer)
//  mouse    multiplier on the mouse offset (default 1)
//  y        vertical nudge in ART pixels (×integer scale)
//  night    colour this layer fades to at night (a silhouette-masked overlay, so stars + moon stay bright)
//  mobile   false = hidden on screens ≤ 768px (the most detailed layers)
const RAW = [
  { file: '01-sky.webp',             type: 'sky',      anchor: 'top', fill: '#fcddd9', night: 'linear-gradient(to bottom, #0b1650, #1e2a74 55%, #3a3b8c)' },
  { file: '02-sky-streaks.webp',     type: 'cloud',    anchor: 'top', fill: null, loopX: 240, night: '#6a72bd' },
  { file: '03-mountains-far.webp',   type: 'mountain', fill: '#f7cdc6', night: '#34428f' },
  { file: '04-mountains-near.webp',  type: 'mountain', fill: '#e6b8c6', night: '#2b3884' },
  { file: '05-forest-haze.webp',     type: 'hill',     fill: '#737fb2', night: '#1d2868' },
  { file: '06-forest-mid.webp',      type: 'tree',     fill: '#4a4c73', night: '#161e58', mobile: false },
  { file: '07-pines-big.webp',       type: 'tree',     fill: '#292c39', night: '#0b1038' },
  { file: '08-meadow-edge.webp',     type: 'hill',     fill: '#4a4c73', night: '#141b52', mobile: false },
  { file: '09-ground.webp',          type: 'hill',     fill: '#516781', night: '#111852' },
  { file: '10-foreground-trees.webp',type: 'fg',       fill: null, night: '#080c2c', blur: 1.1, mouse: 1.15 }
];

export const LAYERS = RAW.map((l, i) => ({
  scale: 1, y: 0, mouse: 1, anchor: 'bottom', ...l,
  index: i,
  depth: +(0.05 + (i / (RAW.length - 1)) * 0.95).toFixed(3)
}));

// ── UI / FX ITEMS that live BETWEEN the art layers (same depth maths) ──
//  Place an item between two layers by choosing a depth between theirs.
export const ITEMS = [
  { id: 'stars',      depth: 0.07 },   // in front of sky, behind everything
  { id: 'sun',        depth: 0.10 },   // behind the cloud streaks (0.156)
  { id: 'moon',       depth: 0.12 },
  { id: 'mistFar',    depth: 0.31 },   // between far (0.261) and near (0.367) mountains
  { id: 'heartsFar',  depth: 0.40 },
  { id: 'title',      depth: 0.42 },   // behind haze forest (0.472) & big pines (0.683) → they overlap the letters
  { id: 'birds',      depth: 0.52 },
  { id: 'mistMid',    depth: 0.63 },
  { id: 'fxMid',      depth: 0.74 },   // petals, sparkles, mid hearts
  { id: 'balloon',    depth: 0.80 },
  { id: 'mistNear',   depth: 0.84 },
  { id: 'couple',     depth: 0.92 }    // stands on the ground layer (0.894)
];
