"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "@/components/ui/progress";

const isDifferentUrl = (url: string | URL | null | undefined): boolean => {
  if (url === null || url === undefined) {
    return true;
  }

  const href: string = typeof url === "string" ? url : url.href;

  try {
    const resolved: URL = new URL(href, window.location.origin);
    return (
      resolved.pathname !== window.location.pathname ||
      resolved.search !== window.location.search
    );
  } catch {
    return true;
  }
};

export default function RouteProgressBar() {
  const pathname: string = usePathname();
  const [progress, setProgress] = useState<number>(0);
  const activeRef = useRef<boolean>(false);
  const rampRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  const clearTimers = useCallback((): void => {
    if (rampRef.current !== null) {
      window.clearInterval(rampRef.current);
      rampRef.current = null;
    }
    if (hideRef.current !== null) {
      window.clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  }, []);

  const start = useCallback((): void => {
    if (activeRef.current) {
      return;
    }

    activeRef.current = true;
    setProgress(12);

    if (rampRef.current !== null) {
      window.clearInterval(rampRef.current);
    }

    rampRef.current = window.setInterval(() => {
      setProgress((current: number): number =>
        current >= 88 ? current : current + 7
      );
    }, 120);
  }, []);

  const stop = useCallback((): void => {
    if (!activeRef.current) {
      return;
    }

    activeRef.current = false;
    clearTimers();
    setProgress(100);

    hideRef.current = window.setTimeout(() => {
      setProgress(0);
    }, 400);
  }, [clearTimers]);

  useEffect(() => {
    const originalPushState: (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => void = window.history.pushState;
    const originalReplaceState: (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) => void = window.history.replaceState;

    window.history.pushState = (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ): void => {
      if (isDifferentUrl(url)) {
        start();
      }
      originalPushState.call(window.history, data, unused, url);
    };

    window.history.replaceState = (
      data: unknown,
      unused: string,
      url?: string | URL | null
    ): void => {
      if (isDifferentUrl(url)) {
        start();
      }
      originalReplaceState.call(window.history, data, unused, url);
    };

    const handlePopState = (): void => {
      start();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  useEffect(() => {
    // A pathname change means the new page has rendered — finish the bar.
    // This also covers slow dev compiles: the bar ramps and waits at ~88%
    // until the page actually mounts, then completes.
    stop();
  }, [pathname, stop]);

  return progress > 0 ? (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60]">
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  ) : null;
}