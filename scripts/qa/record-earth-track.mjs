import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=metal", "--hide-scrollbars"], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => { const et = new EventTarget(); window.__observed = []; et.addEventListener("observe", (e) => window.__observed.push(e.detail)); window.__THREE_DEVTOOLS__ = et; });
await page.goto("https://mont-fort.com/", { waitUntil: "networkidle2", timeout: 90000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 6000));
// warm up: jump near the globe so the earth is created, then sweep
await page.evaluate(() => window.scrollTo(0, 7000)); await new Promise((r) => setTimeout(r, 6000));
const out = [];
for (let y = 6000; y <= 10300; y += 100) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, 1400));
  const s = await page.evaluate(() => {
    const sc = window.__observed.find((o) => o.isScene);
    let earth = null, glow = null;
    sc.traverse((o) => { if (o.isMesh && o.material?.uniforms?.secondaryViewMatrix) { if (o.material.uniforms.uEarthSpecular) earth = o; else glow = o; } });
    if (!earth) return null;
    const u = earth.material.uniforms;
    const num = (k) => (u[k] && typeof u[k].value === "number" ? +u[k].value.toFixed(4) : undefined);
    const col = (k) => (u[k] && u[k].value && u[k].value.isColor ? "#" + u[k].value.getHexString() : undefined);
    const vec = (k) => (u[k] && u[k].value && u[k].value.toArray ? u[k].value.toArray().map((n) => +n.toFixed(3)) : undefined);
    earth.updateWorldMatrix(true, false); const me = earth.matrixWorld; const V = earth.position.constructor; const Q = earth.quaternion.constructor; const wp = new V(), ws = new V(), wq = new Q(); me.decompose(wp, wq, ws); const chain = []; for (let p = earth.parent; p; p = p.parent) chain.push(p.name || p.type); return { world: { p: wp.toArray().map((n) => +n.toFixed(4)), q: wq.toArray().map((n) => +n.toFixed(5)), s: ws.toArray().map((n) => +n.toFixed(4)) }, chain, view: u.secondaryViewMatrix.value.elements.map((n) => +n.toFixed(5)), proj: u.secondaryProjectionMatrix.value.elements.map((n) => +n.toFixed(5)), chapter: num("uChapter"), tint: col("uEarthTint"), sea: col("uSeaColor"), amb: col("uAmbientColor"), rim: col("uRimColor"), sun: vec("uSunPosition"), vis: earth.visible, earthPos: earth.position.toArray(), earthRot: earth.rotation.toArray().slice(0, 3).map((n) => +n.toFixed(4)), earthScale: earth.scale.toArray(), glowVis: glow ? glow.visible : null, all: Object.keys(u) };
  });
  out.push({ y, ...s });
}
writeFileSync("orig/earth-world.json", JSON.stringify(out));
console.log("samples", out.length, "valid", out.filter((o) => o.view).length);
console.log(JSON.stringify(out.find((o) => o.view)?.all));
await browser.close();
