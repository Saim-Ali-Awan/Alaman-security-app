"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

const DESTRUCTIVE_ACTION: string =
  "rounded-full bg-destructive text-white hover:bg-destructive/90";

export default function Navbar() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setSignedIn(Boolean(user));
      })
      .catch(() => {
        setSignedIn(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-full">
          <Image
            src="/Alamanlogo.png"
            alt="Alaman logo"
            width={32}
            height={32}
            priority
            className="rounded-full"
          />
          <span className="hidden text-lg font-bold min-[400px]:inline">
            Point Registry
          </span>
        </Link>

        {/* Right side: tight spacing on phones, normal from sm up */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {signedIn === null ? null : signedIn ? (
            <>
              {/* Registry — visible on ALL screen sizes when signed in */}
              <Link href="/dashboard" className="flex">
                <Button variant="outline" size="sm" className="rounded-full">
                  Registry
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={(): void => setSignOutOpen(true)}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login" className="flex">
              <Button size="sm" className="rounded-full">
                Incharge Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out on this device. You will need to sign in
              again to view registered points and attendance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={DESTRUCTIVE_ACTION}
              onClick={(): void => {
                setSignOutOpen(false);
                void handleSignOut();
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}