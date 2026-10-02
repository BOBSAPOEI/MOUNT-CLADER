import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("immg.zoomIn", "0.9, 0.0, 0.4, 1.0");
CustomEase.create("immg.zoomOut", "0.4, 0.0, 0.1, 1.0");
CustomEase.create("immg.posIn", "0.4, 0.0, 0.1, 1.0");
CustomEase.create("immg.posOut", "0.9, 0.0, 0.4, 1.0");
CustomEase.create("immg.expoOut", "0.14, 1.0, 0.34, 1.0");
CustomEase.create("immg.expoIn", "0.66, 0.0, 0.86, 0.0");

type Params = Record<string, string | undefined>;
const fontsReady = () => document.fonts?.ready ?? Promise.resolve();
const isMobile = () => window.innerWidth < 768;

/**
 * Port of the original's `[data-animation]` behaviours. Each element gets a ScrollTrigger that calls
 * `open()` on enter (one-shot reveal) and optionally scrubs `timeline()`; `data-animation-*` attributes
 * become params (`start`, `end`, `scrub`, `color`, …).
 */
class Animation {
  protected st?: ScrollTrigger;
  protected openTl?: gsap.core.Timeline;
  protected closeTl?: gsap.core.Timeline;

  constructor(readonly el: HTMLElement, readonly params: Params) {}

  attach() {
    this.createScrollTrigger();
    window.addEventListener("resize", this.resize);
  }

  detach() {
    window.removeEventListener("resize", this.resize);
    this.st?.kill();
    this.openTl?.revert().kill();
    this.closeTl?.revert().kill();
  }

  open(): gsap.core.Timeline | void {
    this.openTl?.revert().kill();
    const tl = gsap.timeline();
    this.openTl = tl;
    return tl;
  }

  close(): gsap.core.Timeline | void {
    this.closeTl?.revert().kill();
    const tl = gsap.timeline();
    this.closeTl = tl;
    return tl;
  }

  timeline(): gsap.core.Timeline | undefined {
    return undefined;
  }

  resize = () => {
    this.st?.refresh();
  };

  refresh() {
    this.st?.refresh();
  }

  createScrollTrigger() {
    this.st?.kill();
    this.st = ScrollTrigger.create({
      trigger: this.el,
      onEnter: () => this.open(),
      onLeave: () => this.close(),
      start: this.params.start,
      end: this.params.end,
      once: !!this.params.once,
      scrub: !!this.params.scrub,
      animation: this.timeline(),
    });
  }
}

class FadeIn extends Animation {
  constructor(el: HTMLElement, params: Params) {
    params.scrub = "true";
    super(el, params);
  }

  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    tl.fromTo(this.el, { y: "1.4em" }, { y: 0, ease: "power2.out", duration: 1.6 }, 0.1);
    tl.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: 0.8 }, "<");
    return tl;
  }
}

class Hero extends Animation {
  private readonly logoDk: HTMLElement | null;
  private readonly logoMb: HTMLElement | null;
  private readonly logoPathsDk: Element[];
  private readonly scrollDownCta: HTMLElement | null;
  private readonly scrollDownCtaInner: HTMLElement | null;
  private isOpen = false;

  constructor(el: HTMLElement, params: Params) {
    params.scrub = "true";
    params.start = "top 1px";
    super(el, params);
    this.logoDk = el.querySelector(".logo-dk");
    this.logoPathsDk = Array.from(el.querySelectorAll(".logo-dk>path, .logo-dk>g")).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    this.logoMb = el.querySelector(".logo-mb");
    this.scrollDownCta = el.querySelector(".scroll-to-cta");
    this.scrollDownCtaInner = el.querySelector(".scroll-to-cta-inner");
  }

  open() {
    if (this.isOpen) return;
    const tl = super.open() as gsap.core.Timeline;
    if (this.logoPathsDk.length) tl.fromTo(this.logoPathsDk, { opacity: 0, y: "1em" }, { opacity: 1, y: 0, ease: "immg.posIn", stagger: 0.075, duration: 1.5 }, 0);
    if (this.logoMb) tl.fromTo(this.logoMb, { opacity: 0 }, { opacity: 1, ease: "linear", duration: 1 }, 0);
    tl.fromTo(this.scrollDownCta, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.7);
    this.isOpen = true;
    return tl;
  }

  timeline() {
    const tl = gsap.timeline({ paused: true });
    if (this.logoDk) tl.fromTo(this.logoDk, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0);
    if (this.logoMb) tl.fromTo(this.logoMb, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0);
    tl.fromTo(this.scrollDownCtaInner, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0.1);
    tl.add(() => {}, 1);
    return tl;
  }
}

class Line extends Animation {
  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    tl.fromTo(this.el, { scaleX: 0 }, { scaleX: 1, ease: "immg.posIn", duration: 2 }, 0.1);
    return tl;
  }
}

class List extends Animation {
  constructor(el: HTMLElement, params: Params) {
    params.scrub = "true";
    super(el, params);
  }

  open() {
    if (isMobile()) return;
    const items = this.el.querySelectorAll("li");
    const tl = super.open() as gsap.core.Timeline;
    tl.fromTo(items, { y: 40 }, { y: 0, duration: 1.5, ease: "power2.out", stagger: 0.15 }, 0);
    tl.fromTo(items, { opacity: 0 }, { autoAlpha: 1, duration: 0.8, stagger: 0.15 }, "<");
    return tl;
  }
}

class Navigation extends Animation {
  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    tl.fromTo(this.el.querySelectorAll("button, div"), { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.1 });
    return tl;
  }
}

class Parallax extends Animation {
  constructor(el: HTMLElement, params: Params) {
    params.scrub = "true";
    super(el, params);
  }

  timeline() {
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(this.el, { yPercent: 5 }, { yPercent: -5, duration: 1 }, 0);
    tl.add(() => {}, 1);
    return tl;
  }
}

/** Collapsible copy clamped to `--line-count` lines; the chapter keeps room for the tallest expansion. */
export class ReadMore extends Animation {
  static readonly chapterReadMore = new Map<Element, Set<ReadMore>>();
  static readonly chapterOverflows = new Map<Element, number>();
  readonly noMargin: boolean;
  expanded = false;
  scrollHeight = 0;
  offsetHeight = 0;
  private readonly chapter: HTMLElement;
  private readonly inner: HTMLElement;
  private readonly content: HTMLElement;
  private readonly button: HTMLButtonElement;

  constructor(el: HTMLElement, params: Params, private readonly registry: Map<Element, Animation>) {
    params.scrub = "true";
    super(el, params);
    this.noMargin = el.dataset.noMargin !== undefined;
    this.chapter = el.closest("[data-chapter]") as HTMLElement;
    this.inner = el.querySelector(".content .inner") as HTMLElement;
    this.content = el.querySelector(".content") as HTMLElement;
    this.button = el.querySelector("button") as HTMLButtonElement;
    if (!ReadMore.chapterReadMore.has(this.chapter)) ReadMore.chapterReadMore.set(this.chapter, new Set());
    ReadMore.chapterReadMore.get(this.chapter)!.add(this);
  }

  resize = () => {
    if (Math.round(this.inner.scrollHeight) === Math.round(this.scrollHeight)) return;
    gsap.set(this.content, { clearProps: "all" });
    gsap.set(this.chapter, { clearProps: "--expanding" });
    this.el.classList.remove("expanded");
    this.expanded = false;
    this.inner.classList.add("clamp");
    this.offsetHeight = this.content.offsetHeight;
    this.scrollHeight = Array.from(this.inner.children).reduce((sum, c) => sum + c.scrollHeight, 0);
    this.el.classList.toggle("expandable", this.offsetHeight !== this.scrollHeight);
    const overflow = [...ReadMore.chapterReadMore.get(this.chapter)!.values()].filter((r) => !r.noMargin).reduce((m, r) => Math.max(m, r.scrollHeight - r.offsetHeight), 0);
    if (overflow !== ReadMore.chapterOverflows.get(this.chapter)) {
      ReadMore.chapterOverflows.set(this.chapter, overflow);
      this.chapter.style.setProperty("--overflow", `${overflow + 20}px`);
      ScrollTrigger.refresh();
    }
    this.st?.refresh();
  };

  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    tl.fromTo(this.el, { y: "1.4em" }, { y: 0, ease: "immg.posIn", duration: 1.6 }, 0.1);
    tl.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: 0.8 }, "<");
    return tl;
  }

  toggle = () => {
    [...(ReadMore.chapterReadMore.get(this.chapter)?.values() || [])].filter((r) => r.expanded && r !== this).forEach((r) => r.toggle());
    this.expanded = this.el.classList.toggle("expanded");
    const all = Array.from(this.chapter.querySelectorAll("[data-animation]")).map((el) => this.registry.get(el));
    const after = all.slice(all.indexOf(this));
    const tl = gsap.timeline({ onUpdate: () => after.forEach((a) => a?.refresh()) });
    const duration = 1.5;
    tl.to(this.content, { height: this.expanded ? this.scrollHeight : this.offsetHeight, duration, ease: "power3.out" }, 0);
    tl.to(this.chapter, { "--expanding": this.expanded ? this.scrollHeight - this.offsetHeight : 0, overwrite: "auto", duration, ease: "power3.out" }, 0);
    tl.add(() => this.inner.classList.toggle("clamp", !this.expanded), this.expanded ? 0 : duration);
    return tl;
  };

  attach() {
    this.resize();
    super.attach();
    this.button.addEventListener("click", this.toggle);
  }

  detach() {
    this.button.removeEventListener("click", this.toggle);
    super.detach();
  }
}

/** Splits into lines that rise and fade in one after another. */
class SplitBlock extends Animation {
  private split?: SplitText;

  attach() {
    void this.splitAndRefresh();
    super.attach();
  }

  detach() {
    super.detach();
    this.split?.revert();
  }

  resize = () => {
    void this.splitAndRefresh();
  };

  private async splitAndRefresh() {
    this.split?.revert();
    if (isMobile()) return;
    await fontsReady();
    this.split = new SplitText(this.el, { type: "lines" });
    this.st?.refresh();
  }

  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    if (this.split?.lines.length) {
      tl.fromTo(this.split.lines, { y: "0.6em" }, { y: 0, duration: 1.2, ease: "power2.out", stagger: { each: 0.15 } }, 0);
      tl.fromTo(this.split.lines, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: { each: 0.15 } }, "<");
    }
    return tl;
  }
}

class TextBlock extends Animation {
  private split?: SplitText;

  attach() {
    void this.splitAndRefresh();
    super.attach();
  }

  detach() {
    super.detach();
    this.split?.revert();
  }

  resize = () => {
    void this.splitAndRefresh();
  };

  private async splitAndRefresh() {
    this.split?.revert();
    if (isMobile()) return;
    const paragraphs = this.el.querySelectorAll("p");
    await fontsReady();
    this.split = new SplitText(paragraphs, { type: "lines" });
    this.st?.refresh();
  }

  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    if (this.split?.lines.length) {
      tl.fromTo(this.split.lines, { y: "0.6em" }, { y: 0, duration: 1.2, ease: "immg.expoOut", stagger: { each: 0.15 } }, 0);
      tl.fromTo(this.split.lines, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: { each: 0.15 } }, "<");
    }
    return tl;
  }
}

/** Headline: lines rise in on enter, then every character is scrubbed to `color` while scrolling. */
class Title extends Animation {
  private split?: SplitText;

  constructor(el: HTMLElement, params: Params) {
    params.scrub = "true";
    super(el, params);
  }

  attach() {
    void this.splitAndRefresh();
    super.attach();
  }

  detach() {
    super.detach();
    this.split?.revert();
  }

  resize = () => {
    void this.splitAndRefresh();
  };

  private async splitAndRefresh() {
    this.split?.revert();
    if (isMobile()) return;
    await fontsReady();
    this.split = new SplitText(this.el, { type: "lines, chars, words" });
    this.createScrollTrigger();
  }

  open() {
    if (isMobile()) return;
    const tl = super.open() as gsap.core.Timeline;
    if (this.split?.lines.length) {
      tl.fromTo(this.split.lines, { y: "0.4em" }, { y: 0, duration: 1.2, ease: "power2.out", stagger: { each: 0.15 } }, 0);
      tl.fromTo(this.split.lines, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: { each: 0.15 } }, "<");
    }
    return tl;
  }

  timeline() {
    const tl = gsap.timeline({ paused: true });
    if (this.split?.lines.length) tl.to(this.split.chars, { color: this.params.color || "#2d628c", stagger: { amount: 0.3 } }, 0);
    tl.add(() => {}, 1);
    return tl;
  }
}

const ANIMATIONS: Record<string, new (el: HTMLElement, params: Params, registry: Map<Element, Animation>) => Animation> = {
  FadeIn,
  Hero,
  Line,
  List,
  Navigation,
  Parallax,
  ReadMore,
  SplitBlock,
  TextBlock,
  Title,
};

/** Instantiates every `[data-animation]` under `root` (the original's animation manager). Returns a cleanup. */
export function attachAnimations(root: ParentNode = document) {
  const instances = new Map<Element, Animation>();
  root.querySelectorAll<HTMLElement>("[data-animation]").forEach((el) => {
    const Ctor = ANIMATIONS[el.dataset.animation ?? ""];
    if (!Ctor) return;
    const params: Params = {};
    for (const [key, value] of Object.entries(el.dataset)) {
      if (!key.startsWith("animation") || key === "animation") continue;
      const name = key.replace("animation", "");
      params[name.charAt(0).toLowerCase() + name.slice(1)] = value;
    }
    const instance = new Ctor(el, params, instances);
    instances.set(el, instance);
    instance.attach();
  });
  return () => {
    instances.forEach((a) => a.detach());
    instances.clear();
    ReadMore.chapterReadMore.clear();
    ReadMore.chapterOverflows.clear();
  };
}
