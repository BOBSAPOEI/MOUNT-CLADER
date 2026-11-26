"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Engine } from "../engine/Engine";
import { pageKeyFromPath } from "../engine/pages";
import { TransitionRouter } from "../engine/transition/Router";
import { Slideshow } from "../engine/transition/Slideshow";
import { HeroTransition } from "./HeroTransition";
import "@/styles/montfort/webgl.css";

interface Runtime {
  engine: Engine;
  slideshow: Slideshow;
  router: TransitionRouter;
}

/**
 * The persistent WebGL layer (the original kept its canvas alive across page swaps): one engine for the whole
 * site, the hero slideshow overlay, and the transition router that intercepts internal links so the camera
 * can fly from page to page instead of reloading.
 */
export function WebGLRoot() {
  const wrapper = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const pathname = usePathname();
  const nextRouter = useRouter();
  const push = useRef(nextRouter.push);
  const bootedPath = useRef<string | null>(null);

  useEffect(() => {
    push.current = nextRouter.push;
  }, [nextRouter]);

  useEffect(() => {
    if (!wrapper.current || !canvas.current) return;
    let engine: Engine;
    try {
      engine = new Engine(wrapper.current, canvas.current);
    } catch {
      return;
    }
    const slideshow = new Slideshow((href, info) => void router.navigate(href, info));
    const router = new TransitionRouter(slideshow, (href) => push.current(href, { scroll: false }));
    runtime.current = { engine, slideshow, router };
    const startPath = window.location.pathname;
    const key = pageKeyFromPath(startPath);
    void engine.boot(key).then(async () => {
      if (!engine.booted) return;
      slideshow.init(key);
      bootedPath.current = startPath;
      // The route changed while the engine was loading: catch up with a fade.
      if (pageKeyFromPath(window.location.pathname) !== key && router.beforeSwap(window.location.pathname)) await router.afterSwap();
    });
    window.addEventListener("click", router.onClick);
    return () => {
      window.removeEventListener("click", router.onClick);
      router.dispose();
      slideshow.dispose();
      engine.dispose();
      runtime.current = null;
    };
  }, []);

  // Runs in the commit that rendered the new route, before paint, so the new page can start hidden.
  useLayoutEffect(() => {
    const rt = runtime.current;
    if (!rt?.engine.booted || bootedPath.current === pathname) return;
    bootedPath.current = pathname;
    if (rt.router.beforeSwap(pathname)) void rt.router.afterSwap();
  }, [pathname]);

  return (
    <>
      <div id="canvas-wrapper" ref={wrapper} aria-hidden="true">
        <canvas ref={canvas} />
      </div>
      <HeroTransition />
    </>
  );
}
