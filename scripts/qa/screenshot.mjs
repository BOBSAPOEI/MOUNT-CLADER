// Usage: node shoot.mjs <url> <outPrefix> <width> <height> [marksJson]
// marks: [{ "name": "hero", "sel": null, "vh": 0 }, { "name": "who", "sel": "#WhoWeAre", "vh": 0.2 }]
import puppeteer from "puppeteer-core";

const [url, prefix, w, h, marksJson] = process.argv.slice(2);
const sceneOnly = process.env.SCENE_ONLY === "1";
const marks = JSON.parse(marksJson ?? '[{"name":"hero","sel":null,"vh":0}]');
const width = +w, height = +h;
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=metal", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"],
  defaultViewport: { width, height, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("PAGEERROR", e.message));
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => console.error("goto", e.message));
await page.addStyleTag({ content: "#CybotCookiebotDialog,#CybotCookiebotDialogBodyUnderlay,.CybotCookiebotDialogActive{display:none!important}" });
if (sceneOnly) await page.addStyleTag({ content: "body *{visibility:hidden!important} #canvas-wrapper,#canvas-wrapper *{visibility:visible!important}" });
await new Promise((r) => setTimeout(r, 7000));
const info = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, canvas: document.querySelectorAll("canvas").length }));
console.log("page", JSON.stringify(info));
for (const m of marks) {
  const y = await page.evaluate((m) => {
    const el = m.sel ? document.querySelector(m.sel) : null;
    if (m.abs !== undefined) return m.abs;
    const top = el ? el.getBoundingClientRect().top + scrollY : 0;
    return Math.max(0, Math.round(top + m.vh * innerHeight));
  }, m);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise((r) => setTimeout(r, m.wait ?? 3500));
  const file = `${prefix}-${m.name}.png`;
  await page.screenshot({ path: file });
  console.log("shot", file, "y=", y);
}
await browser.close();
