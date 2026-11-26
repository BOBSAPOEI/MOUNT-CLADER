import gsap from "gsap";
import { engine } from "../Engine";
import { PAGES, type PageKey } from "../globals";
import { pageKeyFromPath } from "../pages";
import type { Page, TransitionType } from "../pages/Page";
import { getLenis } from "../../motion/lenis";
import type { Slideshow } from "./Slideshow";

const MAIN = "main";
const HEADER = "#header";
const FOOTER = "footer";

interface Pending {
  key: PageKey | null;
  from?: Page;
  to?: Page;
  type: TransitionType;
  info?: "drag";
  hash: string;
}

/**
 * Port of the original transition manager. A navigation first plays a leave timeline (the "mountains" flight
 * along the camera rail when both pages are on it and the visitor is at the top, otherwise a fade), then
 * hands over to the Next.js router; once the new route has rendered, `afterRouteChange` swaps the WebGL page
 * and plays the enter timeline.
 */
export class TransitionRouter {
  private leaveTl?: gsap.core.Timeline;
  private enterTl?: gsap.core.Timeline;
  private webglLoading?: Promise<void>;
  private pending?: Pending;
  private busy = false;

  constructor(
    private readonly slideshow: Slideshow,
    private readonly push: (href: string) => void,
  ) {}

  /** Starts a navigation to `href` (header link, menu, footer or a slideshow drag). */
  async navigate(href: string, info?: "drag") {
    const url = new URL(href, window.location.href);
    if (this.busy) return;
    const samePage = url.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
    if (samePage) {
      if (url.hash) getLenis()?.scrollTo(url.hash);
      else getLenis()?.scrollTo(0);
      if (url.hash) window.history.replaceState(window.history.state, "", url.hash);
      return;
    }
    this.busy = true;
    const e = engine();
    const key = pageKeyFromPath(url.pathname);
    const from = e.currentPage;
    const to = await e.setNextPage(key);
    const type = this.getTransitionType(from, to, url.hash);
    this.beforePreparation(type, info, to);
    this.pending = { key, from, to, type, info, hash: url.hash };
    await this.leaveTl;
    this.push(url.pathname + url.search + url.hash);
  }

  private beforePreparation(type: TransitionType, info: "drag" | undefined, to?: Page) {
    this.leaveTl?.kill();
    this.enterTl?.kill();
    getLenis()?.stop();
    this.webglLoading = to?.load();
    this.leaveTl = gsap.timeline();
    this.slideshow.beforePreparation();
    if (type === "mountains") {
      if (info !== "drag" && to) this.leaveTl.add(this.slideshow.createNavigationTimeline(PAGES.indexOf(to.key)), 0);
    } else {
      this.leaveTl.to(this.chrome(), { opacity: 0, duration: 0.5 }, 0);
    }
    this.leaveTl.to(MAIN, { opacity: 0, duration: 0.5 }, 0);
  }

  private chrome() {
    return [engine().renderer.domElement, document.querySelector(HEADER), document.querySelector(FOOTER)].filter(Boolean) as Element[];
  }

  private getTransitionType(from: Page | undefined, to: Page | undefined, hash: string): TransitionType {
    const onRail = (p?: Page) => !!p && PAGES.includes(p.key);
    return window.scrollY === 0 && engine().lerpedScrollProgress < 0.001 && onRail(from) && onRail(to) && !hash ? "mountains" : "fade";
  }

  /**
   * The new route is in the DOM (called from a layout effect, before paint). Navigations that did not go
   * through `navigate` (back / forward) are handled as a fade without a leave animation.
   */
  beforeSwap(pathname: string) {
    const e = engine();
    if (!this.pending) {
      const key = pageKeyFromPath(pathname);
      if (e.currentPage?.key === key) return false;
      this.leaveTl?.kill();
      this.leaveTl = undefined;
      this.pending = { key, from: e.currentPage, type: "fade", hash: window.location.hash };
      this.busy = true;
    }
    const p = this.pending;
    const main = document.querySelector<HTMLElement>(MAIN);
    if (main) main.style.opacity = "0";
    // The footer is rendered by the page, so the new one must start hidden like the persistent original.
    const footer = document.querySelector<HTMLElement>(FOOTER);
    if (footer && p.type === "fade") footer.style.opacity = "0";
    if (!p.hash) window.scrollTo(0, 0);
    this.slideshow.beforeSwap(p.key, p.type === "fade", p.info);
    return true;
  }

  async afterSwap() {
    const p = this.pending;
    if (!p) return;
    const e = engine();
    if (!p.to && p.key) {
      const page = await e.setNextPage(p.key);
      p.to = page;
      this.webglLoading = page?.load();
    }
    e.nextPage = p.to;
    this.enterTl?.kill();
    await this.leaveTl;
    await this.webglLoading;
    e.afterSwap();
    p.from?.afterLeave();
    p.to?.beforeEnter(p.type);
    if (p.type === "fade") p.to?.afterEnter();
    // Lets scroll-driven UI (header theme, side buttons) re-read the new page.
    window.dispatchEvent(new Event("mf:swap"));
    window.dispatchEvent(new Event("scroll"));
    const lenis = getLenis();
    lenis?.resize();
    if (p.hash) lenis?.scrollTo(p.hash, { immediate: true, force: true });
    else lenis?.scrollTo(0, { immediate: true, force: true });
    lenis?.start();
    this.enterTl = gsap.timeline();
    this.slideshow.beforeEnter(p.type === "fade");
    if (p.type !== "mountains") {
      this.enterTl.to(this.chrome(), {
        opacity: 1,
        duration: 0.5,
        onComplete() {
          gsap.set(this.targets(), { clearProps: "all" });
        },
      }, 0);
    }
    this.enterTl.fromTo(MAIN, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);
    this.pending = undefined;
    this.busy = false;
    await this.enterTl;
    if (p.type === "mountains") p.to?.afterEnter();
  }

  /** Intercepts clicks on internal links to pages of the camera rail. */
  onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const samePage = url.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "");
    if (!samePage && !pageKeyFromPath(url.pathname)) return;
    e.preventDefault();
    void this.navigate(url.href);
  };

  dispose() {
    this.leaveTl?.kill();
    this.enterTl?.kill();
  }
}
