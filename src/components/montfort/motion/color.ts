export type RGBA = [number, number, number, number];

/** Parses `#rgb`, `#rrggbb`, `rgb()` and `rgba()` strings. */
export function parseColor(input: string): RGBA {
  const s = input.trim();
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
    const n = parseInt(full.slice(0, 6), 16);
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const [r, g, b, a = "1"] = m[1].split(/[\s,/]+/).filter(Boolean);
  return [Number(r), Number(g), Number(b), Number(a)];
}

export function mixColor(a: RGBA, b: RGBA, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const c = a.map((v, i) => v + (b[i] - v) * k);
  return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
}
