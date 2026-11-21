# Hall Engine (shared walk-in hall)

`site/assets/hall-engine.js` + `site/assets/hall-engine.css`. No dependencies, CSS 3D. Both `/hall` and `/gallery-hall` use the engine.

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
   "plaqueSub":"years","tags":["Era"],"summary":"Plain text",
   "details":[["Maker","Winchester"]],"sources":[["Label","https://..."]]}],
 "finale":{"id":"...","title":"...","plaqueTitle":"...","plaqueSub":"...","tags":["End of the hall"],
   "body":["<p>trusted HTML</p>"],"sources":[["Label","https://..."]]}}
```
Exhibits alternate left/right walls. `finale` (optional) goes on the end wall. Text is escaped, except `finale.body`, which is trusted HTML from our own repo.

## Exhibit media

The HTML catalog entry with the matching exhibit ID holds the image. Use a `figure.hx-photo[data-hall-media]` with an image, descriptive alt text, intrinsic width and height, and a figcaption. Set `data-thumb` on the image to a small local WebP for the wall display. The dialog copies the catalog figure with its attribution. This also keeps pictures, sources and credits available without JavaScript.

Identify the pictured variant or object in the caption. Label photographs of related models and period documents explicitly. Include the photographer or collection, a link to the specific source, and the license or editorial-use basis. For a source-only entry use a paragraph with `data-hall-media` and a link to the record. Wall displays without images use a text label.

## Theme

The pages use `body.museum-hall`. Set `data-collection` to `smoothbore` or `midway` to select the room palette. Both use local photographic parquet and plaster textures, credited on the hall pages.

## Controls
- Wheel or trackpad walks. Page scroll resumes at either end.
- ↑/↓ or W/S walk. ←/→, [ ], or PgUp/PgDn jump to the previous/next exhibit. Home/End jump to the start/end.
- Enter or Space opens the nearest plaque. Esc closes the card.
- Drag or swipe on touch screens.
- The previous and next controls jump one exhibit. Hold Back or Forward to walk. Read opens the nearest card.
- Click or tap a plaque to open it. Tab focuses the plaques, and the camera follows.
- The card has Prev/Next buttons and a focus trap. `#id` deep links open a card.
- `prefers-reduced-motion` turns off the smoothing.

The club pages use the shared view controller in `site/assets/hall-view.js`. A fresh visit opens the walk-in hall when CSS 3D is available. The exhibit list works as plain HTML, honors the reader’s saved preference and `#list`, and opens automatically if the walk data cannot load. The controller mounts the scene on first use.
