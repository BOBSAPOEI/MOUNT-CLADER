# QA tooling

Headless-Chrome helpers used to compare the clone against the original site at identical viewports.
They are dev-only and not part of the app. Install the one extra dependency outside the project (or with
`npm i -D puppeteer-core`) and make sure Google Chrome is installed at the default macOS path.

| Script | Purpose |
| --- | --- |
| `screenshot.mjs <url> <prefix> <w> <h> '<marks>'` | Screenshot a URL at scroll marks, e.g. `[{"name":"hero","abs":0},{"name":"who","sel":"#WhoWeAre","vh":0.2}]`. `SCENE_ONLY=1` hides the DOM and captures only `#canvas-wrapper`. |
| `probe.mjs <url> <w> <h> <script.js>` | Evaluate a script in the page and print the JSON it returns (layout rects, computed styles). |
| `contact-sheet.py out.png <cols> <thumbWidth> files…` | Tile screenshots into one labelled image for side-by-side review. |
| `record-camera-track.mjs` | Re-records the original's camera rail (hooks three.js's devtools event). Output feeds `src/lib/montfort/tracks.ts`. |
| `record-earth-track.mjs` | Re-records the original's globe transform. |
