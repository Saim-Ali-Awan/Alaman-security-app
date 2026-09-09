"use client";

import { useState, type FormEvent } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { PHONE_PATTERN } from "@/lib/supabase/constants";
import {
  errorMessage,
  isDuplicateError,
  isRowLevelSecurityError,
} from "@/lib/supabase/postgres-errors";

export default function RegisterPointPage() {
  const [name, setName] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (submitting) {
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

    const supabase = createClient();
    const { error } = await supabase.from("points").insert({
      name: trimmedName,
      person_name: trimmedPersonName,
      phone: trimmedPhone,
    });

    setSubmitting(false);

    if (error) {
      if (isDuplicateError(error)) {
        toast.error("Duplicate point", {
          description: "A point with this name already exists.",
        });
        return;
      }

      if (isRowLevelSecurityError(error)) {
        toast.error("Not authorized", { description: "Not authorized." });
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
      description: `${trimmedName} was added to the registry.`,
    });

    setName("");
    setPersonName("");
    setPhone("");
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
        </CardContent>
      </Card>
    </div>
  );
}