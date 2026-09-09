"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { PHONE_PATTERN } from "@/lib/supabase/constants";
import {
  errorMessage,
  isDuplicateError,
  isRowLevelSecurityError,
} from "@/lib/supabase/postgres-errors";
import type { PointRow } from "@/components/types/database";

type EditPointDialogProps = {
  point: PointRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export default function EditPointDialog({
  point,
  open,
  onOpenChange,
  onSaved,
}: EditPointDialogProps) {
  const [name, setName] = useState<string>(point.name);
  const [personName, setPersonName] = useState<string>(point.person_name);
  const [phone, setPhone] = useState<string>(point.phone);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setName(point.name);
      setPersonName(point.person_name);
      setPhone(point.phone);
      setSaving(false);
    }
  }, [open, point]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (saving) {
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

    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("points")
      .update({
        name: trimmedName,
        person_name: trimmedPersonName,
        phone: trimmedPhone,
      })
      .eq("id", point.id);

    setSaving(false);

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

      toast.error("Update failed", {
        description: errorMessage(
          error.message,
          "Something went wrong while updating this point."
        ),
      });
      return;
    }

    toast.success("Point updated", {
      description: `${trimmedName} was saved successfully.`,
    });

    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Point</DialogTitle>
          <DialogDescription>
            Update the details stored for {point.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-point-name">Point Name</FieldLabel>
              <Input
                id="edit-point-name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-full"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-person-name">Person Name</FieldLabel>
              <Input
                id="edit-person-name"
                type="text"
                autoComplete="off"
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                className="rounded-full"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-phone">Phone Number</FieldLabel>
              <Input
                id="edit-phone"
                type="tel"
                autoComplete="off"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-full"
                required
              />
            </Field>

            <Button type="submit" className="rounded-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}