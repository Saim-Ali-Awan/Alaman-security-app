"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type SigningOutOverlayProps = {
  visible: boolean;
};

export default function SigningOutOverlay({
  visible,
}: SigningOutOverlayProps) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }

    setProgress(12);

    const interval = window.setInterval(() => {
      setProgress((current: number): number =>
        current >= 88 ? current : current + 8
      );
    }, 80);

    return () => window.clearInterval(interval);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md rounded-3xl">
        <CardContent className="flex flex-col items-center gap-5 p-6 text-center">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold">Signing Out…</h2>
            <p className="text-sm text-muted-foreground">
              Clearing your session securely. Returning to the login page…
            </p>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground">
            {progress >= 88 ? "Almost done…" : "Please wait…"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}