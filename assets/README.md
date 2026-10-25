# assets/

This folder is intentionally **empty of binary assets** in the first prototype.

All visuals and sounds in CallScape are generated at runtime so the game cannot break on a
missing or blocked file:

* **Room, furniture, props, character** — drawn procedurally with the Canvas 2D API in the
  `Rendering` section of `../script.js` (`prerenderRoom`, `drawStation`, `drawShelf`,
  `drawPlayer`, …). Sprites are built from small rectangles on a 32 px tile grid with a
  single fixed palette, then upscaled with smoothing disabled, so they stay pixel-crisp.
* **UI chrome** (panels, joystick, buttons, dialogue box) — CSS only, in `../style.css`.
* **Sound effects** — synthesised WebAudio blips in the `Sound` object (no `.mp3`/`.wav`
  files), which keeps the whole game a few hundred kilobytes and fully offline.

## Adding real art later

If you produce sprite sheets (e.g. `player.png`, `tileset.png`, `furniture.png`), drop them
here and load them once at boot:

```js
const img = new Image();
img.src = 'assets/player.png';
img.onload = () => { /* swap drawPlayer() for a frame-based blit */ };
```

Keep these rules so the art matches the engine:

* 32 × 32 px tiles, 16 × 24 px character body, top-down / three-quarter view.
* Nearest-neighbour scaling only: `ctx.imageSmoothingEnabled = false`.
* Anchor each sprite's collision box at the feet, matching `rect`/`solid` in `ROOM_LAB`.
* Nothing in the engine requires an external file, so always keep a procedural fallback.
