"use client";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition: () => void;
  };
};

const VIEW_TRANSITION_MS: number = 550;

/**
 * Applies the theme inside a native View Transition that sweeps a
 * growing circle from (x, y) — the toggle button — across the page.
 * Falls back to an instant switch on unsupported browsers.
 */
export function applyThemeWithCircleReveal(
  applyTheme: () => void,
  x: number,
  y: number
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    // SSR safety — just switch.
    applyTheme();
    return;
  }

  const doc = document as DocumentWithViewTransition;

  if (typeof doc.startViewTransition !== "function") {
    // Browser without View Transitions — instant switch.
    applyTheme();
    return;
  }

  document.documentElement.style.setProperty("--theme-circle-x", `${x}px`);
  document.documentElement.style.setProperty("--theme-circle-y", `${y}px`);

  const transition = doc.startViewTransition(applyTheme);

  // Safety valve: never let a stuck transition freeze the UI.
  window.setTimeout((): void => {
    if (transition !== null && transition !== undefined) {
      transition.skipTransition();
    }
  }, VIEW_TRANSITION_MS + 150);
}