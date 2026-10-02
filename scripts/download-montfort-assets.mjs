// Downloads the assets listed in scripts/montfort-assets.txt from https://mont-fort.com into public/montfort/.
// Usage: node scripts/download-montfort-assets.mjs
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://mont-fort.com";
const OUT = "public/montfort";
const list = (await readFile(new URL("./montfort-assets.txt", import.meta.url), "utf8"))
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

async function download(p) {
  const rel = p.startsWith("/_astro/") ? `images/${path.basename(p)}` : p.replace(/^\/assets\//, "");
  const dest = path.join(OUT, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(ORIGIN + p);
  if (!res.ok) return console.error("FAIL", res.status, p);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log("ok", dest);
}

for (let i = 0; i < list.length; i += 4) {
  await Promise.all(list.slice(i, i + 4).map((p) => download(p).catch((e) => console.error("ERR", p, e.message))));
}
