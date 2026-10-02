# 3D scene notes

Everything is drawn by one three.js renderer in three passes:

1. **Sky** – full-screen shader (light overcast → storm slate → globe slate → night).
2. **Globe** – sphere of radius 10 rendered with its own telephoto camera (fov 5°, fixed at the origin); the sphere
   recedes along −Z and spins as the globe chapter scrolls.
3. **Main scene** – mountain, three small peaks, cloud decks, boat, forest planes and dust, seen from the rail camera
   (fov 55°).

## Recorded motion data (`src/lib/montfort/tracks.ts`)
Captured from the original by hooking three.js's devtools event and reading the live camera and globe transforms every
100px of scroll at 1440×900:

- `CAMERA_TRACK` – rail camera position + quaternion + chapter index.
- `CHAPTER_TABLE` – continuous chapter index (0 hero … 4 globe done … 5 footer) used to drive colours and visibility.
- `EARTH_TRACK` – globe position and Y rotation.

At runtime scroll is normalised to the rail length of the current page, so the tracks follow the layout on any screen.

## Assets
Models: `mountains.glb`, `Homepage.glb` (peaks), `TopChapters.glb` (cloud sea + streaks), `WhatWeDo.glb` (boat),
`earth-min.glb` (colour map in RGB, cloud cover in alpha), `Sustainability-min.glb` (forest atlas planes).
Textures: `noise`, `perlinNoise`, `rock_normal`. Compressed textures use the Basis transcoder in `public/vendor/basis`.
All shaders are custom and write display-space colours, so textures are sampled raw (no sRGB decode).
