# For Priya: a small parallax sunset

A layered pixel-art sunset with real parallax: mouse depth, scroll depth, and UI that sits **between** the art layers.
Vite + vanilla JS · GSAP + ScrollTrigger · Lenis · SplitType · tsParticles (slim).

## Page order

1. Loader (a heart fills with the sunset gradient)
2. Hero: "I Love You Priya" + subtitle (pinned for ~80% of a screen)
3. Okay, so… (a few short lines that reveal word by word)
4. What I really love about you (a trail through the forest: words on one side, a pixel animal walks in on the other, three parallax depths. Tap an animal)
5. Our future (a pixel heart that builds itself while you scroll, then you can tap it)
6. What I promise you (a pinned deck: six promise cards deal themselves out as you scroll, or tap the card; it stays pinned until the last card, then the page continues; animals wander around the screen edges)
7. Us, so far (the photo gallery; **only appears once pictures are in `assets/photos/`**)
8. The letter (3D envelope; opening it throws kisses and hearts at the screen)
9. Tonight (night sky, day counter, the button, "I LOVE YOU MORE"). **Clicking the button fills the screen with hearts, then a pink veil lifts on a new page: your own night picture (`assets/night/night.png`, replace it with an edited version any time, same name) with live shooting stars and fireflies; a few words (`risingWords`) float up one by one with the hearts** ("Back to the sunset" returns)

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/ (also copies assets/ into dist/assets)
npm run preview
```

## Make it yours

Every word on the page lives in **`config.js`**. Anything marked `[PLACEHOLDER]` there is a stand-in.

| Want to change | Where in `config.js` |
|---|---|
| Names | `partnerName`, `myName` (the sign-off and the footer follow) |
| Counter start | `anniversaryDate` (ISO, IST). The counter shows days, hrs, min, sec, and "0 days" is fine |
| Hero | `heroTitle`, `heroSubtitle` |
| Story | `storyTitle`, `storyLines[]` (3–4 short lines) |
| The 8 cards | `reasonsEyebrow`, `reasonsTitle`, `reasons[{icon, animal, title, text}]` (animal: bear, boar, deer, fox, rabbit or wolf) |
| Our future | `futureEyebrow`, `futureTitle`, `futureBody`, `futureChips[]`, `futureTap`, `futureTapReplies[]` |
| Notes deck | `notesEyebrow`, `notesTitle`, `notesHint`, `notesLabel`, `notes[{title, text}]` (the six promises: edit freely, add or delete cards) |
| Photos | drop pictures in `assets/photos/` (see the README there). Optional captions: `photosEyebrow`, `photosTitle`, `photoCaptions {'file.jpg': 'caption'}` |
| Night page | `nightTitle`, `nightShy` (the tiny shy line + blushing emoji, `assets/emoji/shy-blush.png`), `nightHint`, `nightBack`, `risingWords` (the words that float up with the hearts); the picture is `assets/night/night.png` |
| Letter | `letterGreeting`, `letter` (blank line = new paragraph), `letterSignoff`, `letterEyebrow`, `letterTitle`, `letterHint` |
| Finale | `finaleLabel`, `finaleTitle`, `counterLabel`, `loveButton`, `finalMessage` |
| Song | put an mp3 at `assets/audio/song.mp3` (plays only after the music button is clicked) |
| Couple silhouette / birds / heart balloon | `assets/art/extras/` (see the README there) |

## Artwork

"Parallax Sunset Mountains" by **kayillustrations**, CC BY 4.0, https://kayillustrations.itch.io/parallax-sunset-mountains.
10 transparent layers at 320×180, converted to lossless WebP (3.4 KB total for all layers). See `CREDITS.md`. The footer credit is required by the licence, so keep it.

To use a different layer pack: put the PNGs in a folder, adjust the `ORDER` list in `scripts/prepare-art.py`, run
`python3 scripts/prepare-art.py <folder>`, then edit `js/layers.js`.

## Tuning

### The art (`js/layers.js` → `SCENE`)

| Number | Effect |
|---|---|
| `zRange` | translateZ of the farthest layer. Larger = deeper 3D |
| `mouseX`, `mouseY` | px the nearest layer moves with the mouse (30 / 15) |
| `tiltX`, `tiltY` | degrees the whole scene rotates with the mouse |
| `scrollShift` | how far the nearest layer rises while scrolling (× viewport height) |
| `scrollCurve` | >1 makes far layers move far less than near ones |
| `heroShare` | share of that travel that happens inside the pinned hero |
| per layer `depth` | automatic: `0.05 + i/(n-1) × 0.95`. Change the order of `RAW` to change depth |
| per layer `loopX` | seconds for one seamless cloud-drift loop |
| per layer `blur`, `mouse`, `mobile` | depth-of-field px, extra mouse multiplier, hide on phones |
| `ITEMS[].depth` | puts UI/FX between layers (the title is 0.42, between the mountains and the forest) |

### The sky (`js/main.js` → `buildMaster`)

The colour grade is one scrubbed timeline. Each `ramp(...)` row lists `[position, strength]` keys, and the positions are
section tops (`T.story`, `T.reasons`, `T.future`, `T.letter`, `T.finale`), so the sky follows the page even if you change a
section's height. Today: gold (hero) → pink peak at *Things I've noticed* → purple dusk at *We're not perfect*
(`violet` .8, `night` .18, fading toward twilight blue) → night at the letter and the finale.

### The pixel heart (`js/sections.js` → `buildHeart` + `setupFuture`, `css/style.css` → `.bheart`)

| Number | Effect |
|---|---|
| `HEART`, `CRACK` (top of `sections.js`) | the pixel bitmap and where it breaks, row by row |
| `gap(-0.5)`, `gap(0.575)` | how far apart the halves start (× heart width) |
| `rotation`, `z`, `scale` in the two `fromTo`s | hinge angle and depth of each half |
| `.future { height: calc(var(--vh100) * 2.1) }` | how much scrolling the build takes (desktop) |
| `--kp` on `.bheart` | screen px per art pixel (16 / 20 / 24, always whole numbers) |
| `rigs` (mouse block) | mouse strength per piece: heart, aura, floaters |

## Notes

- The pack has no sun layer, so the sun, its heart-shaped halo and the moon are soft CSS glows placed *between* the art layers, not drawn art.
- The night grade is a silhouette-masked colour overlay per layer, so the stars and moon stay bright.
- Only the hero is pinned. The split heart uses `position: sticky` (plain CSS), so there is no second pin spacer to fight Lenis.
- `prefers-reduced-motion`: static art, native scroll, no parallax, no particles, no pinning. The split heart shows already joined.
- Phones: the two most detailed layers are hidden, particles and hearts are reduced, the custom cursor is off, the split heart becomes a vertical stack with a lighter animation, and device tilt (with a gentle auto-sway fallback) replaces the mouse.


## Icons, butterflies and the little interactions

- **Icons** are pixel SVGs in `assets/icons/` (Pixelarticons, MIT). In `config.js` each reason's `icon:` is a file name without `.svg`.
  Want another one? Drop a `.svg` in that folder and use its name. Browse https://pixelarticons.com
- **Butterflies** (`js/effects.js` → `initButterflies`, `releaseButterflies`; `css/style.css` → `.bfly`): the sprite from `assets/butterflies/`
  (credit required, see CREDITS.md). 4 on desktop, 3 on phones, none with reduced motion. They wander, drift toward the cursor, and
  fly off in a puff of hearts when clicked. They are released when the letter opens, when the heart is tapped (every 4th tap) and from the love button.
- **Heart trail** (desktop), **tap puffs** (click/tap anywhere), **card hugs** (click a card), **tappable heart** (`futureTapReplies` in `config.js`).
- Credits for the butterfly and icons are in the footer: keep them there.


## The letter

- **The letter has no text.** Break the seal and a big volley of kisses and hearts (Twemoji) pops out of the envelope and rushes at the
  screen (`throwKisses` in `js/effects.js`); kiss marks stick to the "glass" and slide off. Tap the open envelope for another round.
  More or fewer kisses: the numbers in `setupLetter` (`js/sections.js`), `throwKisses(x, y, 110)` first time, `65` for the repeat (phones: 60 / 36).
  Which emoji: the `THROWN` list at the top of that function (file names in `assets/emoji/`).
  Reduced motion: no throwing, just a still row of kisses and hearts.
- Butterflies are clickable in the hero, story and finale only; in the sections with things to tap they let your taps through.
- Credit for Twemoji, the butterfly and the icons is in the footer: keep it there.

## Animals

Fireflies (only in the notes section) and drifting pixel leaves + a procession of animals (in the trail) are small effects built from CSS and the pixelarticons leaf.

Pixel animals by ScratchIO (CC0), in `assets/fauna/`; sizes and frame counts in `js/fauna.js`. They walk while you scroll and rest when you stop.

## The pixel heart (Looking ahead section)

Every tap on it plays a soft chime that climbs the scale and sets off a slightly bigger effect (more hearts, a wider ring, a brighter glow, butterflies on taps 4 and 6). Tap number 8 (`futureTapMax` in `config.js`) is the biggest: a heartbeat, a sparkle chord, a screen-wide blush, three rings and a burst of hearts and butterflies. Then the count starts over. The sounds are made live with the Web Audio API in `js/sfx.js` (no audio files), and only play after a tap.

## Credits and the footer

The footer only says "made by Ur Raaga". The licences and credits for the artwork, icons, emoji and sprites are in `CREDITS.md`; some of them (CC BY) ask for a visible credit, so keep that file with the project, or put a credit line back in the footer if you ever publish the site.

## Tap hints

Anything you can tap (the pixel heart, the animals, the promise cards, photos, the shy box) has a tiny pulsing dot. The dot goes away once that thing has been tapped. Targets are listed in `js/hints.js`.

## Scroll locks
`js/lock.js` makes the pixel-heart section and the promise deck hold the page. Scrolling into them lands exactly on the first stop. After that one wheel flick, swipe or arrow key moves one stop (one card). On the last stop, the next gesture carries on down the page. Stops are computed from the ScrollTrigger positions, so they follow the layout. Reduced-motion has no pinning, so no locks. The heart section is only locked on desktop, because on phones it isn't pinned.

## Performance tiers (old laptops)
`js/perf.js` picks a tier when the page opens. Nothing is removed in any tier.
- **full**: fast machines, unchanged.
- **lite**: used automatically on 4 or fewer logical cores, 4 GB or less, an old Intel GPU or no GPU. It uses a flat 2D scene (no 3D tilt or sorting), no live blur behind glass, 1x canvases, lighter particle glow, and off-screen sections sleep.
- **min**: lite plus a simpler colour grade and no small drop-shadows. A frame-rate watchdog steps down to it only if lite is still under about 26 fps while scrolling. The choice is remembered.

Add `?perf=full`, `?perf=lite` or `?perf=min` to the address to force a tier, and `?perf=auto` to go back to automatic.

Always-on savings: the night colour grade uses pre-made silhouettes (`assets/art/night/`) instead of live CSS masks, grade layers at zero opacity are switched off, the sunset stops drawing while the night page covers it, the fireflies and CSS animations rest off screen, and Google Fonts no longer blocks the first paint.

## Put it on GitHub (and why it sat at 0%)

The loader sitting at **0%** means the browser never ran the site's JavaScript. That happens when the **source** files are uploaded and served as they are, or when `index.html` is opened by double-click. The source uses `import` statements that only work after a build. If that happens, the loader now says so after about 7 seconds.

You have two ways to publish. Pick one.

**A. Easiest: the prebuilt `docs/` folder (no setup beyond Pages)**
1. Upload the whole project to a GitHub repo, **including the `docs` folder**. Don't upload `node_modules`.
2. Repo → Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, folder: **`/docs`** → Save.
3. Wait a minute, then open `https://<your-username>.github.io/<repo-name>/`.
4. After you edit anything (`config.js`, photos, CSS), run `npm install` once, then `npm run build:pages`, and upload the refreshed `docs` folder.

**B. Automatic: GitHub Actions**
1. Upload the whole project, including the `.github` folder (it holds `deploy.yml`).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Every push to `main` builds and publishes the site. Check progress under the Actions tab.

Never point Pages at the repo root (`/ (root)`) with the raw source. That is the 0% setup.

Locally: `npm run dev` for editing, `npm run build` then `npm run preview` to test the built version.
Paths are relative (`base: './'`), so it works under `/<repo-name>/` as well as on a custom domain.
Three optional files under `assets/art/extras/` return a quiet 404 in the console if you haven't added them. That's expected.
