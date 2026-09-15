"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyThemeWithCircleReveal } from "@/lib/theme-transition";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark: boolean = resolvedTheme === "dark";

  const handleToggle = (): void => {
    const nextTheme: string = isDark ? "light" : "dark";

    // Circle origin = the button's center. The navbar sits at the top
    // right, so the sweep starts there and expands to cover the page.
    const button: HTMLButtonElement | null = buttonRef.current;

    if (button !== null) {
      const rect: DOMRect = button.getBoundingClientRect();
      const x: number = rect.left + rect.width / 2;
      const y: number = rect.top + rect.height / 2;

      applyThemeWithCircleReveal((): void => {
        setTheme(nextTheme);
      }, x, y);
    } else {
      setTheme(nextTheme);
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="sm"
      className="rounded-full"
      aria-label="Toggle theme"
      onClick={handleToggle}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <Moon className="h-4 w-4 opacity-0" />
      )}
    </Button>
  );
}