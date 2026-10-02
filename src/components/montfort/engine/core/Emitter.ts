type Handler = (...args: never[]) => void;

/** Minimal event bus (the original's `state`). */
export class Emitter<E extends string> {
  private readonly events = new Map<E, Set<Handler>>();

  on<A extends unknown[]>(event: E, handler: (...args: A) => void) {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event)!.add(handler as unknown as Handler);
  }

  off<A extends unknown[]>(event: E, handler: (...args: A) => void) {
    this.events.get(event)?.delete(handler as unknown as Handler);
  }

  emit(event: E, ...args: unknown[]) {
    this.events.get(event)?.forEach((h) => (h as (...a: unknown[]) => void)(...args));
  }

  clear() {
    this.events.clear();
  }
}

export type EngineEvent = "MANIFEST_LOADED" | "ATTACH" | "DETACH" | "RESIZE" | "BEFORE_TICK" | "TICK" | "RENDER";

export interface TickInfo {
  /** Elapsed seconds. */
  et: number;
  /** Frame delta in seconds (capped at 60ms). */
  dt: number;
}
