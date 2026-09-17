"use client";

import {
  createContext,
  useCallback,
useContext,
  useMemo,
  type ReactNode,
} from "react";

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

type HapticsContextValue = {
  vibrate: (pattern?: HapticPattern) => void;
  isSupported: () => boolean;
};

const HapticsContext = createContext<HapticsContextValue | null>(null);

// Local type guard: works even if the TS lib doesn't ship the Vibration API.
type NavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean;
};

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: [30, 30, 30],
  success: [15, 40, 15],
  error: [60, 40, 60],
};

export function HapticsProvider({ children }: { children: ReactNode }) {
  // Called only from event handlers — never during render. No SSR access.
  const isSupported = useCallback((): boolean => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    const nav = navigator as NavigatorWithVibrate;
    return typeof nav.vibrate === "function";
  }, []);

  const vibrate = useCallback(
    (pattern: HapticPattern = "light"): void => {
      if (typeof navigator === "undefined") {
        return;
      }

      try {
        const nav = navigator as NavigatorWithVibrate;
        if (typeof nav.vibrate === "function") {
          nav.vibrate(PATTERNS[pattern]);
        }
      } catch {
        // Vibration can throw on some browsers — never let it crash the app.
      }
    },
    []
  );

  const value = useMemo<HapticsContextValue>(
    () => ({ vibrate, isSupported }),
    [vibrate, isSupported]
  );

  // Renders ONLY the children — identical markup on server and client,
  // so hydration can never mismatch because of this provider.
  return (
    <HapticsContext.Provider value={value}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics(): HapticsContextValue {
  const context: HapticsContextValue | null = useContext(HapticsContext);

  if (context === null) {
    throw new Error("useHaptics must be used inside a HapticsProvider.");
  }

  return context;
}
export default HapticsProvider;