import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Bottom-left chapter navigation of the Trading page: each chapter gets a ScrollTrigger that fills its
 * progress bar, swaps the active label and pops the dots in and out (port of the original page script).
 */
export function initChaptersNavigation() {
  const nav = document.querySelector<HTMLElement>(".chapters-navigation");
  const list = document.querySelector(".chapters-navigation .chapters-list");
  const wrappers = Array.from(document.querySelectorAll<HTMLElement>(".chapters-navigation .chapters-list .chapter-wrapper"));
  if (!nav || !list || !wrappers.length) return () => {};

  const triggers: ScrollTrigger[] = [];
  const themeTriggers: ScrollTrigger[] = [];
  let intro: gsap.core.Timeline | null = null;
  let current = 0;

  nav.style.pointerEvents = "none";
  wrappers.forEach((wrapper, i) => {
    const target = document.querySelector(`[data-chapter='${wrapper.dataset.chapterKey}']`);
    const fill = wrapper.querySelector(".progress-bar.white-part");
    if (wrapper.dataset.chapter === "undefined" || !target || !fill) return;
    triggers.push(
      ScrollTrigger.create({
        trigger: target,
        start: "top 85%",
        end: "bottom 85%",
        onEnter: () => {
          enter(i);
          if (i === 0) showFromStart();
          current = i;
        },
        onEnterBack: () => {
          enterBack(i);
          if (i === wrappers.length - 2) showFromEnd();
          current = i;
        },
        onLeave: () => {
          leave(i);
          if (i === wrappers.length - 2) hideToEnd();
        },
        onLeaveBack: () => {
          leaveBack(i);
          if (i === 0) hideToStart();
        },
        onUpdate: (self) => gsap.set(fill, { scaleY: self.progress, transformOrigin: "top center" }),
      }),
    );
  });

  const links = nav.querySelectorAll(".chapter-link");
  const dots = nav.querySelectorAll(".dot");
  const labels = nav.querySelectorAll(".text-container span");
  const whiteBars = nav.querySelectorAll(".progress-bar.white-part");
  const blueBars = nav.querySelectorAll(".progress-bar.blue-part");

  document.querySelectorAll<HTMLElement>("[data-theme-chapters]").forEach((el) => {
    themeTriggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        end: "bottom 85%",
        onEnter: () => setTheme(el.dataset.themeChapters),
        onLeave: () => setTheme(),
        onEnterBack: () => setTheme(el.dataset.themeChapters),
        onLeaveBack: () => setTheme(),
      }),
    );
  });

  function setTheme(theme = "light") {
    nav!.dataset.theme = theme;
  }

  function showFromStart() {
    nav!.style.pointerEvents = "all";
    intro?.kill();
    intro = gsap.timeline();
    intro.fromTo(Array.from(dots).slice(2), { scale: 0 }, { scale: 1, stagger: 0.1, duration: 0.6, ease: "power2.out" }, 0);
  }

  function showFromEnd() {
    nav!.style.pointerEvents = "all";
    intro?.kill();
    intro = gsap.timeline();
    intro.fromTo(Array.from(dots).slice(0, -2), { scale: 0 }, { scale: 1, stagger: -0.1, duration: 0.6, ease: "power2.out" }, 0);
  }

  function hideToEnd() {
    nav!.style.pointerEvents = "none";
    intro?.kill();
    intro = gsap.timeline();
    intro.to(dots, { scale: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }, 0);
  }

  function hideToStart() {
    nav!.style.pointerEvents = "none";
    intro?.kill();
    intro = gsap.timeline();
    intro.to(dots, { scale: 0, stagger: -0.1, duration: 0.6, ease: "power2.out" }, 0);
  }

  const pairDots = (i: number) => (i === wrappers.length - 1 ? dots[i] : [dots[i], dots[i + 1]]);

  function enter(i: number) {
    gsap.to(pairDots(i), { scale: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 });
    gsap.fromTo(labels[i], { y: "200%" }, { y: "0%", duration: 0.6, ease: "power2.out" });
    gsap.fromTo(blueBars[i], { scaleY: 0 }, { scaleY: 1, transformOrigin: "top center", duration: 0.6, ease: "power2.out" });
  }

  function enterBack(i: number) {
    gsap.to(pairDots(i), { scale: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 });
    gsap.fromTo(labels[i], { y: "-200%" }, { y: "0%", duration: 0.6, ease: "power2.out" });
    gsap.fromTo(blueBars[i], { scaleY: 0 }, { scaleY: 1, transformOrigin: "bottom center", duration: 0.6, ease: "power2.out" });
  }

  function leave(i: number) {
    gsap.to(pairDots(i), { scale: 1, duration: 0.6, ease: "power2.out" });
    gsap.to(labels[i], { y: "-200%", duration: 0.6, ease: "power2.out" });
    gsap.to(blueBars[i], { scaleY: 0, transformOrigin: "bottom center", duration: 0.6, ease: "power2.out" });
    gsap.to(whiteBars[i], { scaleY: 0, transformOrigin: "bottom center", duration: 0.6, ease: "power2.out", delay: 0.1 });
  }

  function leaveBack(i: number) {
    gsap.to(pairDots(i), { scale: 1, duration: 0.6, ease: "power2.out" });
    gsap.to(labels[i], { y: "200%", duration: 0.6, ease: "power2.out" });
    gsap.to(whiteBars[i], { scaleY: 0, transformOrigin: "top center", duration: 0.6, ease: "power2.out" });
    gsap.to(blueBars[i], { scaleY: 0, transformOrigin: "top center", duration: 0.6, ease: "power2.out", delay: 0.1 });
  }

  const hover = (i: number) => {
    if (i === current) return;
    gsap.to(dots[i], { scale: 1.5, duration: 0.4, ease: "power2.out" });
    gsap.fromTo(labels[i], { y: "200%" }, { y: "0%", duration: 0.6, ease: "power2.out" });
  };
  const unhover = (i: number) => {
    if (i === current) return;
    gsap.to(dots[i], { scale: 1, duration: 0.4, ease: "power2.out" });
    gsap.to(labels[i], { y: "200%", duration: 0.6, ease: "power2.out" });
  };
  const listeners: [Element, string, () => void][] = [];
  links.forEach((link, i) => {
    const on = () => hover(i);
    const off = () => unhover(i);
    link.addEventListener("mouseenter", on);
    link.addEventListener("mouseleave", off);
    listeners.push([link, "mouseenter", on], [link, "mouseleave", off]);
  });

  const onResize = () => {
    ScrollTrigger.refresh();
    triggers.forEach((t) => t.refresh());
    themeTriggers.forEach((t) => t.refresh());
  };
  window.addEventListener("resize", onResize);

  return () => {
    hideToStart();
    triggers.forEach((t) => t.kill());
    themeTriggers.forEach((t) => t.kill());
    listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
    window.removeEventListener("resize", onResize);
  };
}
