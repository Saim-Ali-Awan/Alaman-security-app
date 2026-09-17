"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { PHONE_PATTERN } from "@/lib/supabase/constants";
import {
  errorMessage,
  isDuplicateError,
  isRowLevelSecurityError,
} from "@/lib/supabase/postgres-errors";

export default function RegisterPointPage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
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

    const trimmedName: string = name.trim();
    const trimmedPersonName: string = personName.trim();
    const trimmedPhone: string = phone.trim();

    if (!trimmedName || !trimmedPersonName || !trimmedPhone) {
      toast.error("Missing information", {
        description:
          "Point name, person name, and phone number are all required.",
      });
      return;
    }

    if (!PHONE_PATTERN.test(trimmedPhone)) {
      toast.error("Invalid phone number", {
        description:
          "Enter 7–20 characters using digits, +, -, spaces, and brackets only.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from("points").insert({
        name: trimmedName,
        person_name: trimmedPersonName,
        phone: trimmedPhone,
      });

      if (error) {
        if (isDuplicateError(error)) {
          toast.error("Duplicate point", {
            description: `"${trimmedName}" is already registered — point names must be unique, even with different capitalization. Try a different name.`,
          });
          return;
        }

        if (isRowLevelSecurityError(error)) {
          toast.error("Not authorized", {
            description:
              "Your session could not write to the database. Sign out and sign back in, then try again. If it persists, the RLS policy needs repairing (see the policy check SQL).",
          });
          return;
        }

        toast.error("Registration failed", {
          description: errorMessage(
            error.message,
            "Something went wrong while registering this point."
          ),
        });
        return;
      }

      toast.success("Point registered", {
        description: `${trimmedName} was added to the registry. Opening your dashboard…`,
      });

      setRedirecting(true);
    } catch (thrownError: unknown) {
      const message: string =
        thrownError instanceof Error
          ? thrownError.message
          : String(thrownError);

      toast.error("Registration failed unexpectedly", {
        description: errorMessage(
          message,
          "Something went wrong while registering this point."
        ),
      });
    } finally {
      // The button can NEVER get stuck on "Registering…" — even if
      // something throws, this always runs.
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Register a Point</CardTitle>
          <CardDescription>
            Add a new security point to the registry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {redirecting ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-6 text-center">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-semibold">
                  Redirecting to the Points Registry…
                </h2>
                <p className="text-sm text-muted-foreground">
                  {name.trim()} was registered. Opening your dashboard now.
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
                <Field>
                  <FieldLabel htmlFor="point-name">Point Name</FieldLabel>
                  <Input
                    id="point-name"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. North Gate"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="rounded-full"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="person-name">Person Name</FieldLabel>
                  <Input
                    id="person-name"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Ali Raza"
                    value={personName}
                    onChange={(event) => setPersonName(event.target.value)}
                    className="rounded-full"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="off"
                    placeholder="e.g. +92 300 1234567"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="rounded-full"
                    required
                  />
                </Field>

                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={submitting}
                >
                  {submitting ? "Registering..." : "Register Point"}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}