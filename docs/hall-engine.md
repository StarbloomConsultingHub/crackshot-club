# Hall Engine (shared walk-in hall)

`site/assets/hall-engine.js` + `site/assets/hall-engine.css`. No dependencies, CSS 3D. Used by `/hall` (Smoothbore Hall); built to be reused by the Gallery Games Hall.

## Mount
```html
<link rel="stylesheet" href="/assets/hall-engine.css">
<script src="/assets/hall-engine.js" defer></script>
<div class="hx" data-hall-src="/assets/halls/your-hall.json"></div>
```
Auto-mounts every `[data-hall-src]` (add `data-hall-manual` to skip), or call
`HallEngine.mount(el, {src: url} | {data: obj, hint: 'text'})`. After mounting, `el.hallEngine` = `{show(i), hide(), goTo(i), layout(), index(), count, el}`. Call `layout()` if the element was hidden while mounting.

## Data (`schema: "crackshot-hall/1"`)
```json
{"schema":"crackshot-hall/1","title":"...","exhibits":[
  {"id":"win-61","title":"Full card title","plaqueTitle":"Short wall title","subtitle":"Maker · years",
   "plaqueSub":"years","tags":["Era"],"art":"rifle:pump","summary":"Plain text",
   "details":[["Maker","Winchester"]],"sources":[["Label","https://..."]]}],
 "finale":{"id":"...","title":"...","plaqueTitle":"...","plaqueSub":"...","tags":["End of the hall"],
   "art":"cracker","body":["<p>trusted HTML</p>"],"sources":[["Label","https://..."]]}}
```
Exhibits alternate left/right walls. `finale` (optional) goes on the end wall. Text is escaped, except `finale.body`, which is trusted HTML from our own repo.

Art keys: `rifle:pump`, `rifle:lever`, `rifle:bolt`, `rifle:nylon`, `rifle:block`, `rifle:break`, `duck`, `target`, `cracker`. You can also pass `{"svg":"<svg…>"}` or `{"img":"/path.png","alt":"…"}`.

## Theme
Set CSS variables on the `.hx` element. The card copies them when it opens: `--hx-wall --hx-wainscot --hx-trim --hx-floor-a --hx-floor-b --hx-ceil --hx-ink --hx-plaque --hx-accent`.

## Controls
- Wheel or trackpad walks. Page scroll resumes at either end.
- ↑/↓ or W/S walk. ←/→, [ ], or PgUp/PgDn jump to the previous/next exhibit. Home/End jump to the start/end.
- Enter or Space opens the nearest plaque. Esc closes the card.
- Drag or swipe on touch screens.
- HUD buttons: ⏮ / ⏭ jump an exhibit, hold Back/Forward to walk, Read opens a card.
- Click or tap a plaque to open it. Tab focuses the plaques, and the camera follows.
- The card has Prev/Next buttons and a focus trap. `#id` deep links open a card.
- `prefers-reduced-motion` turns off the smoothing.
