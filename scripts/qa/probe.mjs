// Usage: node probe.mjs <url> <width> <height> <jsFile>   -> prints JSON returned by the script (evaluated in page after load)
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
const [url, w, h, file] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=metal", "--hide-scrollbars"],
  defaultViewport: { width: +w, height: +h, deviceScaleFactor: 1, isMobile: +w < 600, hasTouch: +w < 600 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 }).catch((e) => console.error("goto", e.message));
await new Promise((r) => setTimeout(r, 6000));
const out = await page.evaluate(`(async()=>{${readFileSync(file, "utf8")}})()`);
console.log(typeof out === "string" ? out : JSON.stringify(out, null, 1));
await browser.close();
