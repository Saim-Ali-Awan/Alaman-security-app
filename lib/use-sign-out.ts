"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const MINIMUM_LOADER_MS: number = 800;

const wait = (ms: number): Promise<void> =>
  new Promise<void>((resolve: () => void): void => {
    window.setTimeout(resolve, ms);
  });

export function useSignOut(): {
  signingOut: boolean;
  signOut: () => Promise<void>;
} {
  const router = useRouter();
  const pathname: string = usePathname();
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const inFlightRef = useRef<boolean>(false);

  // Once the login page has rendered, the flow is finished:
  // hide the overlay and re-arm the guard for the next session.
  useEffect(() => {
    if (pathname === "/login") {
      inFlightRef.current = false;
      setSigningOut(false);
    }
  }, [pathname]);

  const signOut = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setSigningOut(true);

    const supabase = createClient();

    try {
      // Clear the session while the loader is visible for at least
      // MINIMUM_LOADER_MS — whichever takes longer.
      await Promise.all([
        supabase.auth.signOut().then((): void => undefined),
        wait(MINIMUM_LOADER_MS),
      ]);

      toast.success("Signed out", {
        description: "Your session was cleared securely.",
      });
    } catch {
      toast.error("Signed out", {
        description: "You were signed out, but a network hiccup occurred.",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  return { signingOut, signOut };
}