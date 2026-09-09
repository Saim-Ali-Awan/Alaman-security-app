"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/postgres-errors";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!redirecting) {
      return;
    }

    setProgress(12);

    const interval = window.setInterval(() => {
      setProgress((current: number): number =>
        current >= 88 ? current : current + 8
      );
    }, 80);

    const timeout = window.setTimeout(() => {
      setProgress(100);
      router.push("/dashboard");
      router.refresh();
    }, 900);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [redirecting, router]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (submitting || redirecting) {
      return;
    }

    const trimmedEmail: string = email.trim();

    if (trimmedEmail === "" || password === "") {
      toast.error("Missing credentials", {
        description: "Enter both your email and password to continue.",
      });
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      toast.error("Login failed", {
        description: errorMessage(error.message, "Invalid email or password."),
      });
      setSubmitting(false);
      return;
    }

    toast.success("Signed in", {
      description: "Welcome back. Preparing your registry…",
    });

    setSubmitting(false);
    setRedirecting(true);
  };

  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Card className="overflow-hidden rounded-3xl p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              {redirecting ? (
                <div className="flex h-full min-h-80 flex-col items-center justify-center gap-6 text-center">
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-xl font-semibold">
                      Redirecting to the Points Registry…
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      You are signed in. Loading your points and guard
                      attendance.
                    </p>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress >= 100 ? "Almost there…" : "Please wait…"}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <h1 className="text-2xl font-bold">Incharge Login</h1>
                      <p className="text-balance text-muted-foreground">
                        Login is required to view registered points and guard
                        attendance.
                      </p>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="incharge@alaman.security"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="rounded-full"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="rounded-full pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((current: boolean) => !current)
                          }
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Button
                      type="submit"
                      className="rounded-full"
                      disabled={submitting}
                    >
                      {submitting ? "Authenticating..." : "Sign In"}
                    </Button>

                    <FieldDescription className="text-center">
                      Secured by Supabase Auth · No public registration
                    </FieldDescription>
                  </FieldGroup>
                </form>
              )}
            </div>

            <div className="relative hidden bg-muted md:block">
              <Image
                src="/Alamanlogo.png"
                alt="Alaman logo"
                fill
                priority
                sizes="(min-width: 768px) 336px, 0px"
                className="object-contain p-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}