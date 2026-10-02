import { clamp } from "../globals";

interface Vec {
  x: number;
  y: number;
}

export interface DragState {
  event: Event | null;
  target: EventTarget | null;
  currentTarget: HTMLElement | null;
  active: boolean;
  first: boolean;
  last: boolean;
  delta: Vec;
  direction: Vec;
  pointer: Vec;
  movement: Vec;
  offset: Vec;
  velocity: Vec;
  tap: boolean;
  canceled: boolean;
  cancel: () => void;
}

export interface DragConfig {
  mouse: boolean;
  touch: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  passive: boolean;
  rubber: boolean;
  preventDefault: boolean;
  axis?: "x" | "y";
  from?: Partial<Vec>;
  afterEnd?: (state: DragState) => void;
}

const DEFAULTS: DragConfig = {
  mouse: true,
  touch: true,
  minX: Number.NEGATIVE_INFINITY,
  minY: Number.NEGATIVE_INFINITY,
  maxX: Number.POSITIVE_INFINITY,
  maxY: Number.POSITIVE_INFINITY,
  passive: true,
  rubber: true,
  preventDefault: false,
};

const noop = () => {};
const rubberband = (distance: number, dimension: number, constant: number) =>
  dimension === 0 || Math.abs(dimension) === Number.POSITIVE_INFINITY ? distance ** (constant * 5) : (distance * dimension * constant) / (dimension + constant * distance);
const rubber = (v: number, min: number, max: number, constant = 0.15) =>
  constant === 0 ? clamp(v, min, max) : v < min ? -rubberband(min - v, max - min, constant) + min : v > max ? rubberband(v - max, max - min, constant) + max : v;
const point = (e: Event): Vec =>
  "TouchEvent" in window && e instanceof TouchEvent ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

/** Pointer drag gesture (port of the original's small gesture helper, used to spin the globe). */
export class Dragger {
  readonly state: DragState = {
    event: null,
    target: null,
    currentTarget: null,
    active: false,
    first: false,
    last: false,
    delta: { x: 0, y: 0 },
    direction: { x: 0, y: 0 },
    pointer: { x: 0, y: 0 },
    movement: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    tap: true,
    canceled: false,
    cancel: noop,
  };
  private dragging = false;
  private initialised = false;
  private config: DragConfig = DEFAULTS;

  constructor(
    private readonly element: HTMLElement,
    private readonly handler: (state: DragState) => void = noop,
    private readonly userConfig: Partial<DragConfig> = {},
  ) {}

  private resolveConfig(): DragConfig {
    const c = { ...DEFAULTS, ...this.userConfig };
    if (c.preventDefault) c.passive = false;
    return c;
  }

  private drag = (e: Event) => {
    if (this.dragging) return;
    this.dragging = true;
    this.config = this.resolveConfig();
    const t = this.state;
    const n = this.config;
    if (n.preventDefault) e.preventDefault();
    t.target = e.target;
    t.currentTarget = e.currentTarget as HTMLElement;
    t.active = false;
    t.tap = true;
    const start = point(e);
    const moved = { x: 0, y: 0 };
    const origin = { x: 0, y: 0 };
    let current = start;
    let lastTime = 0;
    if (n.from?.x !== undefined) t.offset.x = n.from.x;
    if (n.from?.y !== undefined) t.offset.y = n.from.y;
    t.currentTarget.style.userSelect = "none";

    const begin = (p: Event) => {
      t.event = p;
      t.active = true;
      t.tap = false;
      t.first = true;
      t.last = false;
      t.canceled = false;
      t.delta = { x: 0, y: 0 };
      t.velocity = { x: 0, y: 0 };
      t.pointer = point(p);
      t.movement = { x: 0, y: 0 };
      origin.x = t.offset.x;
      origin.y = t.offset.y;
      lastTime = p.timeStamp;
      this.handler(t);
    };
    const move = (p: Event) => {
      const previous = current;
      current = point(p);
      t.direction.x = Math.sign(current.x - previous.x);
      t.direction.y = Math.sign(current.y - previous.y);
      if (t.active) {
        t.event = p;
        t.first = false;
        t.pointer = current;
        moved.x = t.pointer.x - start.x;
        moved.y = t.pointer.y - start.y;
        const before = { ...t.offset };
        t.offset.x = n.rubber ? rubber(origin.x + moved.x, n.minX, n.maxX) : clamp(origin.x + moved.x, n.minX, n.maxX);
        t.offset.y = n.rubber ? rubber(origin.y + moved.y, n.minY, n.maxY) : clamp(origin.y + moved.y, n.minY, n.maxY);
        const elapsed = p.timeStamp - lastTime;
        t.velocity.x = t.delta.x / elapsed;
        t.velocity.y = t.delta.y / elapsed;
        t.delta.x = t.offset.x - before.x;
        t.delta.y = t.offset.y - before.y;
        t.movement.x += t.delta.x;
        t.movement.y += t.delta.y;
        lastTime = p.timeStamp;
        this.handler(t);
      } else {
        const dx = Math.abs(current.x - start.x);
        const dy = Math.abs(current.y - start.y);
        if ((n.axis === "x" && dx < dy) || (n.axis === "y" && dy < dx)) return end();
        if (Math.hypot(dx, dy) > 3) begin(p);
      }
    };
    const end = () => {
      this.dragging = false;
      const wasActive = t.active;
      t.last = wasActive;
      t.active = false;
      t.offset.x = clamp(t.offset.x, n.minX, n.maxX);
      t.offset.y = clamp(t.offset.y, n.minY, n.maxY);
      if (t.currentTarget) t.currentTarget.style.userSelect = "";
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      if (wasActive || t.tap) this.handler(t);
      n.afterEnd?.(t);
    };
    if (e instanceof MouseEvent) {
      window.addEventListener("mousemove", move, { passive: false });
      window.addEventListener("mouseup", end, { passive: false });
    } else {
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end, { passive: false });
      window.addEventListener("touchcancel", end, { passive: false });
    }
    t.cancel = () => {
      if (t.canceled) return;
      this.dragging = false;
      t.canceled = true;
      setTimeout(() => end(), 0);
    };
  };

  /** Swallows the click that ends a real drag. */
  private click = (e: MouseEvent) => {
    if (!this.state.tap && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  init = () => {
    if (this.initialised) return;
    this.config = this.resolveConfig();
    if (this.config.touch) this.element.addEventListener("touchstart", this.drag, { passive: this.config.passive });
    if (this.config.mouse) this.element.addEventListener("mousedown", this.drag, { passive: this.config.passive });
    this.element.addEventListener("click", this.click, true);
    this.initialised = true;
  };

  clean = () => {
    if (!this.initialised) return;
    this.element.removeEventListener("touchstart", this.drag);
    this.element.removeEventListener("mousedown", this.drag);
    this.element.removeEventListener("click", this.click, true);
    this.initialised = false;
  };
}
