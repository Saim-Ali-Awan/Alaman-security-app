// lib/haptics.ts

type HapticPattern = number | number[];

const STORAGE_KEY = "alaman_haptics_enabled";

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.navigator !== "undefined" &&
    "vibrate" in window.navigator
  );
}

function readEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

function fire(pattern: HapticPattern): void {
  if (!isSupported() || !readEnabled()) return;
  try {
    window.navigator.vibrate(pattern);
  } catch {
    // Browser refused (e.g. outside user activation) — ignore silently
  }
}

export const haptics = {
  isSupported,
  isEnabled: readEnabled,

  enable(): void {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "on");
    }
  },

  disable(): void {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "off");
    }
  },

  /** Generic button / link press */
  tap(): void {
    fire(10);
  },

  /** Very light pulse — small interactions */
  light(): void {
    fire(15);
  },

  /** A selection was made (dropdown, select) */
  select(): void {
    fire([8, 30, 8]);
  },

  /** Route / page navigation tick */
  navigate(): void {
    fire([5, 35, 5]);
  },

  /** Success — rising double pulse */
  success(): void {
    fire([12, 45, 12, 45, 24]);
  },

  /** Warning — even triple pulse */
  warning(): void {
    fire([25, 45, 25, 45, 25]);
  },

  /** Error — heavy declining triple buzz */
  error(): void {
    fire([45, 55, 45, 55, 90]);
  },

  /** Destructive action confirmed (delete) */
  delete(): void {
    fire([20, 40, 20, 40, 20]);
  },

  /** Heavy press — high-stakes confirmations */
  heavy(): void {
    fire(60);
  },
} as const;

export type Haptics = typeof haptics;