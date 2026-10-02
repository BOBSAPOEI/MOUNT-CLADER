import gsap from "gsap";
import * as THREE from "three";
import { engine } from "../Engine";
import type { TickInfo } from "../core/Emitter";
import { clamp, GLOBAL, lerp, PAGES, type PageKey } from "../globals";
import { PAGE_PATHS } from "../pages";
import { getLenis } from "../../motion/lenis";

type Navigate = (href: string, info?: "drag") => void;

/**
 * Port of the original hero slideshow. Pressing on a hero greys the world out (`uTransition`), fades the hero
 * and shows the strip of division titles; dragging slides the strip and flies the camera along the rail, and
 * letting go on another title navigates there. Header navigation reuses it to fly to the target page.
 */
export class Slideshow {
  readonly drag = {
    min: 0,
    max: PAGES.length - 1,
    multiplier: 1.5,
    friction: 0.9,
    invertInertia: 1,
    snapSpeed: 2,
    last: new THREE.Vector2(),
    pos: new THREE.Vector2(),
    lerpedPos: new THREE.Vector2(),
    velocity: new THREE.Vector2(),
    active: false,
  };
  private transitionHero: HTMLElement | null = null;
  private transitionHeroInner: HTMLElement | null = null;
  private hero: HTMLElement | null = null;
  private loadingTimeout = 0;
  private readonly SHOW_SPINNER_DELAY = 250;
  private transitionTl?: gsap.core.Timeline;
  closestIndex = 0;
  currentIndex = 0;
  private attached = false;
  longpressTl?: gsap.core.Timeline;
  navigating = false;

  constructor(private readonly navigate: Navigate) {
    this.queryTransitionHero();
  }

  private queryTransitionHero() {
    this.transitionHero = document.querySelector<HTMLElement>(".hero-transition");
    this.transitionHeroInner = document.querySelector<HTMLElement>(".hero-transition .inner");
  }

  init(key: PageKey | null) {
    this.transitionTl = this.createTransitionTimeline();
    const index = key ? PAGES.indexOf(key) : -1;
    if (index < 0) return;
    this.currentIndex = this.closestIndex = index;
    this.hero = document.querySelector<HTMLElement>(".hero");
    this.progress = index;
    this.attach();
    this.longpressTl = this.createLongpressTimeline();
  }

  beforePreparation() {
    this.navigating = true;
  }

  /** The new page's DOM is in place (still hidden). */
  beforeSwap(key: PageKey | null, fade: boolean, info?: "drag") {
    const index = key ? PAGES.indexOf(key) : -1;
    if (index < 0) return this.detach();
    this.currentIndex = this.closestIndex = index;
    this.hero = document.querySelector<HTMLElement>(".hero");
    if (!fade && this.hero) this.hero.style.opacity = "0";
    if (info === "drag") return;
    this.progress = index;
    this.attach();
  }

  beforeEnter(fade: boolean) {
    if (!this.attached) return;
    const previous = this.transitionHero;
    this.queryTransitionHero();
    if (this.transitionHero !== previous) this.bindPointerDown(previous);
    window.clearTimeout(this.loadingTimeout);
    this.spinner(this.currentIndex)?.classList.remove("loading");
    this.navigating = false;
    this.longpressTl?.kill();
    this.longpressTl = this.createLongpressTimeline();
    if (!fade) this.longpressTl?.progress(1).reverse();
    if (this.transitionHero !== previous) {
      this.transitionTl?.kill();
      this.transitionTl = this.createTransitionTimeline();
    }
  }

  private spinner(index: number) {
    return this.transitionHero?.querySelector(`.title:nth-child(${index + 1}) .spinner`);
  }

  private bindPointerDown(previous: HTMLElement | null) {
    previous?.removeEventListener("mousedown", this.onPointerDown);
    previous?.removeEventListener("touchstart", this.onPointerDown);
    this.transitionHero?.addEventListener("mousedown", this.onPointerDown);
    this.transitionHero?.addEventListener("touchstart", this.onPointerDown, { passive: true });
  }

  attach() {
    if (this.attached) return;
    this.attached = true;
    this.bindPointerDown(null);
    window.addEventListener("mousemove", this.onPointerMove);
    window.addEventListener("touchmove", this.onPointerMove, { passive: false });
    window.addEventListener("mouseup", this.onPointerUp);
    window.addEventListener("touchend", this.onPointerUp);
    engine().state.on("TICK", this.onTick);
  }

  detach() {
    if (!this.attached) return;
    this.attached = false;
    this.transitionHero?.removeEventListener("mousedown", this.onPointerDown);
    this.transitionHero?.removeEventListener("touchstart", this.onPointerDown);
    window.removeEventListener("mousemove", this.onPointerMove);
    window.removeEventListener("touchmove", this.onPointerMove);
    window.removeEventListener("mouseup", this.onPointerUp);
    window.removeEventListener("touchend", this.onPointerUp);
    engine().state.off("TICK", this.onTick);
  }

  private onPointerDown = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent && e.buttons !== 1) return;
    this.drag.active = true;
    if (this.navigating) return;
    if (window.scrollY === 0) this.longpressTl?.play();
    let x: number;
    let y: number;
    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = e.targetTouches[0].clientX;
      y = e.targetTouches[0].clientY;
    }
    if (!(e as TouchEvent).targetTouches) getLenis()?.stop();
    this.drag.last.x = (x / engine().viewport.width) * this.drag.multiplier;
    this.drag.last.y = y;
  };

  private onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (!this.drag.active || window.scrollY > 0) return;
    let x: number;
    let y: number;
    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = e.targetTouches[0].clientX;
      y = e.targetTouches[0].clientY;
    }
    x = (x / engine().viewport.width) * this.drag.multiplier;
    const dx = x - this.drag.last.x;
    const dy = y - this.drag.last.y;
    if ((e as TouchEvent).targetTouches) {
      if (Math.abs(dy) < 10 && Math.abs(dx) > 0 && window.scrollY === 0) {
        getLenis()?.stop();
        e.preventDefault();
      } else return;
    }
    this.drag.pos.x -= dx;
    this.drag.velocity.x = dx;
    this.drag.last.x = x;
    this.drag.last.y = y;
  };

  private onPointerUp = () => {
    this.drag.active = false;
    this.closestIndex = Math.round(this.drag.pos.x);
    if (this.closestIndex === this.currentIndex) {
      this.longpressTl?.reverse();
      getLenis()?.start();
    }
  };

  private onTick = ({ dt }: TickInfo) => {
    const d = this.drag;
    if (!d.active) {
      d.pos.x -= d.velocity.x;
      d.pos.x = lerp(d.pos.x, this.closestIndex, dt * d.snapSpeed);
      d.velocity.x *= d.friction;
      this.closestIndex = Math.round(d.pos.x);
      if (this.closestIndex !== this.currentIndex && !this.longpressTl?.isActive()) this.longpressTl?.play();
      if (this.closestIndex !== this.currentIndex && Math.abs(d.lerpedPos.x - this.closestIndex) < 0.01 && !this.navigating) {
        this.navigating = true;
        const index = this.closestIndex;
        this.loadingTimeout = window.setTimeout(() => this.spinner(index)?.classList.add("loading"), this.SHOW_SPINNER_DELAY);
        this.navigate(PAGE_PATHS[PAGES[index]], "drag");
      }
    }
    d.pos.x = clamp(d.pos.x, d.min, d.max);
    d.lerpedPos.x = lerp(d.lerpedPos.x, d.pos.x, dt * d.invertInertia);
    this.transitionTl?.time(d.lerpedPos.x);
    if (window.scrollY > 0 && !this.longpressTl?.reversed()) this.longpressTl?.reverse();
  };

  private createTransitionTimeline() {
    if (!this.transitionHero || !this.transitionHeroInner) return undefined;
    const titles = Array.from(this.transitionHeroInner.querySelectorAll<HTMLElement>(".title"));
    gsap.set(titles[0], { opacity: 1 });
    gsap.set(titles.slice(1), { opacity: 0.5 });
    const camera = engine().camera;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(camera, { curveProgress: 0 }, { curveProgress: 1, duration: 1, ease: "none" }, 0);
    tl.fromTo(this.transitionHero, { "--slide-progress": 0 }, { "--slide-progress": 1, duration: 1, ease: "none" }, 0);
    tl.fromTo(GLOBAL.uSlideshowProgress, { value: 0 }, { value: 1, duration: 1, ease: "none" }, 0);
    PAGES.slice(1).forEach((_, i) => {
      if (!PAGES[i + 1]) return;
      tl.to(camera, { curveProgress: i + 2, duration: 1, ease: "none" }, i + 1);
      tl.to(this.transitionHero, { "--slide-progress": i + 2, duration: 1, ease: "none" }, i + 1);
      tl.to(GLOBAL.uSlideshowProgress, { value: i + 2, duration: 1, ease: "none" }, i + 1);
      tl.to(titles[i], { opacity: 0.5, duration: 0.5, ease: "power1.out" }, i + 0.5);
      tl.to(titles[i + 1], { opacity: 1, duration: 0.5, ease: "power1.out" }, i);
    });
    return tl;
  }

  private createLongpressTimeline() {
    if (!this.transitionHero || !this.transitionHeroInner || !this.hero) return undefined;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(GLOBAL.uTransitionDirection, { value: 1 }, { value: 0, duration: 0.001 }, 0);
    tl.fromTo(GLOBAL.uTransition, { value: 0 }, { value: 1, duration: 3, ease: "power2.inOut" }, 0);
    tl.fromTo(GLOBAL.uLongpress, { value: 0 }, { value: 1, duration: 2, ease: "power1.inOut" }, 0);
    tl.fromTo(this.hero, { opacity: 1 }, { opacity: 0, duration: 0.5 }, 0);
    tl.fromTo(this.transitionHero, { opacity: 0 }, { opacity: 1, duration: 0.7 }, ">");
    tl.add(() => {
      if (tl.reversed()) GLOBAL.uTransitionDirection.value = 1;
    }, 3);
    return tl;
  }

  /** Header navigation: grey out, then fly the camera along the rail to the target page. */
  createNavigationTimeline(index: number) {
    const tl = gsap.timeline();
    const duration = Math.max(5, Math.abs(this.currentIndex - index) * 2);
    if (this.longpressTl && (!this.longpressTl.isActive() || this.longpressTl.reversed())) this.longpressTl.play();
    const camera = engine().camera;
    const from = camera.targetLookAt;
    const to = camera.getNavigationLookAt(index);
    tl.set(camera, { navigating: true }, 0);
    tl.fromTo(camera.navigationTargetLookAt, { x: from.x, y: from.y, z: from.z }, { x: to.x, y: to.y, z: to.z, duration, ease: "power1.inOut" }, 0);
    tl.to(this, { progress: index, duration, ease: "power2.inOut" }, 0);
    tl.add(() => {
      this.loadingTimeout = window.setTimeout(() => this.spinner(index)?.classList.add("loading"), this.SHOW_SPINNER_DELAY);
    });
    tl.set(camera, { navigating: false });
    return tl;
  }

  set progress(value: number) {
    this.drag.pos.x = value;
    this.drag.lerpedPos.x = value;
  }

  get progress() {
    return this.drag.lerpedPos.x;
  }

  dispose() {
    this.detach();
    this.transitionTl?.kill();
    this.longpressTl?.kill();
    window.clearTimeout(this.loadingTimeout);
  }
}
