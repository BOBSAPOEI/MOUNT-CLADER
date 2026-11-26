import { ASSET } from "@/lib/montfort/content";

/**
 * The site's looping ambient track, shared by every sound toggle. It lives for the whole visit (the site chrome
 * persists across pages), starts on the visitor's first tap, click or key press as on the original, and stays off
 * once the visitor mutes it.
 */
let audio: HTMLAudioElement | null = null;
let playing = false;
let muted = false;
let resumeOnShow = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function track() {
  if (!audio) {
    audio = new Audio(`${ASSET}/sounds/sound.mp3`);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    audio.addEventListener("play", () => {
      playing = true;
      emit();
    });
    audio.addEventListener("pause", () => {
      playing = false;
      emit();
    });
  }
  return audio;
}

/** Resolves true once the track is playing; browsers refuse until the visitor has interacted with the page. */
const play = () => track().play().then(
  () => true,
  () => false,
);

export const ambientSound = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  isPlaying: () => playing,
  toggle() {
    if (playing) {
      muted = true;
      audio?.pause();
    } else {
      muted = false;
      void play();
    }
  },
};

/**
 * Starts the track on the first gesture the browser accepts (iOS Safari only allows it inside a tap, click or key
 * press), and pauses it while the tab is hidden. Taps on a sound toggle ([data-sound-toggle]) are left to the
 * toggle itself. Returns a cleanup function.
 */
export function armAmbientSound() {
  const events = ["pointerup", "touchend", "click", "keydown"] as const;
  const first = (e: Event) => {
    if (muted || playing) return disarm();
    if (e.target instanceof Element && e.target.closest("[data-sound-toggle]")) return;
    void play().then((ok) => ok && disarm());
  };
  const disarm = () => events.forEach((t) => window.removeEventListener(t, first, true));
  events.forEach((t) => window.addEventListener(t, first, true));

  const onVisibility = () => {
    if (document.hidden) {
      resumeOnShow = playing;
      if (playing) audio?.pause();
    } else if (resumeOnShow && !muted) {
      resumeOnShow = false;
      void play();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    disarm();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
