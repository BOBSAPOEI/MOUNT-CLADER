import { CAMERA_TRACK, CHAPTER_TABLE, EARTH_TRACK } from "@/lib/montfort/tracks";

/** The recorded rail covers this many scroll pixels at the reference 900px-tall viewport. */
const REF_RAIL = 9298;

/** Finds the two rows around `y` in a table sorted by its first column and the blend factor between them. */
function bracket(rows: readonly number[][], y: number): [number[], number[], number] {
  if (y <= rows[0][0]) return [rows[0], rows[0], 0];
  const last = rows[rows.length - 1];
  if (y >= last[0]) return [last, last, 0];
  let lo = 0;
  let hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] <= y) lo = mid;
    else hi = mid;
  }
  const a = rows[lo];
  const b = rows[hi];
  return [a, b, (y - a[0]) / (b[0] - a[0])];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Positions along the page that drive the scene; measured from the DOM so they follow the layout. */
export interface PageMetrics {
  /** Scroll distance covered by the top chapters (hero ... globe). */
  railLength: number;
  /** Scroll position at which the page footer reaches the top of the viewport. */
  footerTop: number;
  viewportHeight: number;
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
}

export interface Frame {
  chapter: number;
  /** 0..1 progress through the camera rail. */
  rail: number;
  camera: CameraPose;
  earth: { visible: boolean; x: number; y: number; z: number; rotation: number };
}

/** Converts a scroll position into the camera pose, chapter index and globe transform. */
export function sampleFrame(scrollY: number, m: PageMetrics): Frame {
  const rail = Math.min(1, Math.max(0, scrollY / Math.max(1, m.railLength)));
  const ref = rail * REF_RAIL;

  const [a, b, t] = bracket(CAMERA_TRACK, ref);
  const dot = a[4] * b[4] + a[5] * b[5] + a[6] * b[6] + a[7] * b[7];
  const sign = dot < 0 ? -1 : 1;
  let qx = lerp(a[4], sign * b[4], t);
  let qy = lerp(a[5], sign * b[5], t);
  let qz = lerp(a[6], sign * b[6], t);
  let qw = lerp(a[7], sign * b[7], t);
  const len = Math.hypot(qx, qy, qz, qw) || 1;
  qx /= len;
  qy /= len;
  qz /= len;
  qw /= len;

  let chapter: number;
  if (scrollY <= m.railLength) {
    const [c0, c1, ct] = bracket(CHAPTER_TABLE, ref);
    chapter = lerp(c0[1], c1[1], ct);
  } else {
    const span = Math.max(1, m.footerTop - m.viewportHeight * 0.67 - m.railLength);
    chapter = 4 + Math.min(1, (scrollY - m.railLength) / span);
  }

  const [e0, e1, et] = bracket(EARTH_TRACK, ref);
  const earth = {
    visible: scrollY <= m.railLength + m.viewportHeight * 1.2,
    x: lerp(e0[1], e1[1], et),
    y: lerp(e0[2], e1[2], et),
    z: lerp(e0[3], e1[3], et),
    rotation: lerp(e0[4], e1[4], et),
  };

  return {
    chapter,
    rail,
    camera: { x: lerp(a[1], b[1], t), y: lerp(a[2], b[2], t), z: lerp(a[3], b[3], t), qx, qy, qz, qw },
    earth,
  };
}

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
