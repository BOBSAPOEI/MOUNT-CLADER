// Records the original camera pose (position + quaternion) along the top-chapters scroll range.
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=metal", "--hide-scrollbars"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  const et = new EventTarget();
  window.__observed = [];
  et.addEventListener("observe", (e) => {
    const o = e.detail; window.__observed.push(o);
    if (o && o.isWebGLRenderer) { const orig = o.render.bind(o); o.render = (s, c) => { window.__cam = c; return orig(s, c); }; }
  });
  window.__THREE_DEVTOOLS__ = et;
});
await page.goto("https://mont-fort.com/", { waitUntil: "networkidle2", timeout: 90000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 6000));
const END = 9298, STEP = 100;
const out = [];
for (let y = 0; y <= END; y += STEP) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 1500));
  const s = await page.evaluate(() => {
    const c = window.__cam; c.updateMatrixWorld();
    const sc = window.__observed.find((o) => o.isScene);
    const get = (n) => { let v = null; sc.traverse((o) => { if (o.name === n && o.material?.uniforms) v = o.material.uniforms; }); return v; };
    const sky = get("Skybox");
    return { p: c.position.toArray(), q: c.quaternion.toArray(), chapter: sky ? sky.uChapter.value : null };
  });
  out.push({ y, ...s });
}
writeFileSync("orig/camera-track.json", JSON.stringify(out));
console.log("samples", out.length);
await browser.close();
