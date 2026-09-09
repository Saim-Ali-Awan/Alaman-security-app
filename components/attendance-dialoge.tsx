"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  DATE_PATTERN,
  GUARD_TYPE_OPTIONS,
  MONTHLY_ATTENDANCE_LIMIT,
  MONTHS,
  SHIFT_OPTIONS,
  type SelectOption,
} from "@/lib/supabase/constants";
import {
  errorMessage,
  isDuplicateError,
  isRowLevelSecurityError,
} from "@/lib/supabase/postgres-errors";
import type { AttendanceRow, PointRow } from "@/components/types/database";

const todayISODate = (): string => {
  const now: Date = new Date();
  const year: string = String(now.getFullYear());
  const month: string = String(now.getMonth() + 1).padStart(2, "0");
  const day: string = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthFromDate = (value: string): string | null => {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const monthNumber: number = Number(value.slice(5, 7));

  if (Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return MONTHS[monthNumber - 1] ?? null;
};

type MonthOption = {
  value: string;
  label: string;
};

type AttendanceDialogProps = {
  point: PointRow;
  records: AttendanceRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
  onViewMonth?: (month: string) => void;
};

export default function AttendanceDialog({
  point,
  records,
  open,
  onOpenChange,
  onChanged,
  onViewMonth,
}: AttendanceDialogProps) {
  const router = useRouter();
  const [guardName, setGuardName] = useState<string>("");
  const [attDate, setAttDate] = useState<string>(todayISODate());
  const [attMonth, setAttMonth] = useState<string>(
    MONTHS[new Date().getMonth()]
  );
  const [shift, setShift] = useState<string>("day");
  const [guardType, setGuardType] = useState<string>("regular");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [viewMonth, setViewMonth] = useState<string>("");

  const viewDefaultedRef = useRef<boolean>(false);

  useEffect(() => {
    if (open) {
      setGuardName("");
      setAttDate(todayISODate());
      setAttMonth(MONTHS[new Date().getMonth()]);
      setShift("day");
      setGuardType("regular");
      setSubmitting(false);
    }
  }, [open, point.id]);

  useEffect(() => {
    if (open && !viewDefaultedRef.current) {
      viewDefaultedRef.current = true;
      const latest: AttendanceRow | undefined = records[0];
      setViewMonth(
        latest !== undefined ? latest.att_month : MONTHS[new Date().getMonth()]
      );
    }
    if (!open) {
      viewDefaultedRef.current = false;
    }
  }, [open, records]);

  const monthRecordCount: number = useMemo(
    (): number =>
      records.filter(
        (record: AttendanceRow): boolean => record.att_month === attMonth
      ).length,
    [records, attMonth]
  );

  const monthBlocked: boolean = monthRecordCount >= MONTHLY_ATTENDANCE_LIMIT;

  const monthOptions: MonthOption[] = useMemo((): MonthOption[] => {
    const counts: Record<string, number> = {};

    for (const record of records) {
      counts[record.att_month] = (counts[record.att_month] ?? 0) + 1;
    }

    return MONTHS.map((month: string): MonthOption => {
      const count: number | undefined = counts[month];
      const label: string =
        count !== undefined
          ? `${month} · ${count} record${count === 1 ? "" : "s"}${
              count >= MONTHLY_ATTENDANCE_LIMIT ? " · limit reached" : ""
            }`
          : month;
      return { value: month, label };
    });
  }, [records]);

  const handleDateChange = (value: string): void => {
    setAttDate(value);

    const derived: string | null = monthFromDate(value);
    if (derived !== null) {
      setAttMonth(derived);
    }
  };

  const handleViewAttendance = (): void => {
    if (viewMonth === "") {
      toast.error("Select a month", {
        description: "Choose the month whose full attendance you want to view.",
      });
      return;
    }

    onOpenChange(false);

    if (onViewMonth !== undefined) {
      onViewMonth(viewMonth);
      return;
    }

    router.push(
      `/dashboard/attendance?point=${encodeURIComponent(
        point.id
      )}&month=${encodeURIComponent(viewMonth)}`
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedGuardName: string = guardName.trim();

    if (trimmedGuardName === "") {
      toast.error("Missing guard name", {
        description: "Enter the guard's name before marking attendance.",
      });
      return;
    }

    if (!DATE_PATTERN.test(attDate)) {
      toast.error("Invalid date", {
        description: "Pick a valid date for this attendance record.",
      });
      return;
    }

    if (attMonth === "") {
      toast.error("Missing month", {
        description: "Select the month for this attendance record.",
      });
      return;
    }

    if (monthBlocked) {
      toast.error("Monthly attendance limit reached", {
        description: `${attMonth} already has ${monthRecordCount} records for ${point.name} — switch to another month to continue marking.`,
      });
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.from("attendance").insert({
      point_id: point.id,
      guard_name: trimmedGuardName,
      att_date: attDate,
      att_month: attMonth,
      shift: shift,
      guard_type: guardType,
    });

    setSubmitting(false);

    if (error) {
      if (isDuplicateError(error)) {
        toast.error("Already marked", {
          description: `${trimmedGuardName} already has attendance on ${attDate} for ${point.name}.`,
        });
        return;
      }

      if (isRowLevelSecurityError(error)) {
        toast.error("Not authorized", { description: "Not authorized." });
        return;
      }

      toast.error("Could not mark attendance", {
        description: errorMessage(
          error.message,
          "Something went wrong while marking attendance."
        ),
      });
      return;
    }

    toast.success("Attendance marked", {
      description: `${trimmedGuardName} · ${attMonth} ${attDate} · ${shift} duty · ${guardType} guard.`,
    });

    setGuardName("");
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Attendance · {point.name}
          </DialogTitle>
          <DialogDescription>
            Mark guard attendance (limit {MONTHLY_ATTENDANCE_LIMIT} per month),
            then open any month&apos;s full attendance view.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Mark Attendance
            </p>

            <Field>
              <FieldLabel htmlFor="guard-name">Guard Name</FieldLabel>
              <Input
                id="guard-name"
                type="text"
                autoComplete="off"
                placeholder="e.g. Ali Raza"
                value={guardName}
                onChange={(event) => setGuardName(event.target.value)}
                className="rounded-full"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="att-date">Date</FieldLabel>
                <Input
                  id="att-date"
                  type="date"
                  value={attDate}
                  onChange={(event) => handleDateChange(event.target.value)}
                  className="rounded-full"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="att-month">Month</FieldLabel>
                <Select
                  value={attMonth}
                  onValueChange={(value: string | null): void => {
                    if (value !== null) {
                      setAttMonth(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="att-month"
                    className="w-full rounded-full"
                  >
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month: string) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="shift">Shift</FieldLabel>
                <Select
                  value={shift}
                  onValueChange={(value: string | null): void => {
                    if (value !== null) {
                      setShift(value);
                    }
                  }}
                >
                  <SelectTrigger id="shift" className="w-full rounded-full">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_OPTIONS.map((option: SelectOption) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="guard-type">Guard Type</FieldLabel>
                <Select
                  value={guardType}
                  onValueChange={(value: string | null): void => {
                    if (value !== null) {
                      setGuardType(value);
                    }
                  }}
                >
                  <SelectTrigger
                    id="guard-type"
                    className="w-full rounded-full"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GUARD_TYPE_OPTIONS.map((option: SelectOption) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {monthBlocked ? (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  Monthly limit reached for {attMonth}
                </AlertTitle>
                <AlertDescription>
                  {monthRecordCount} of {MONTHLY_ATTENDANCE_LIMIT} attendance
                  records are already marked in {attMonth} for {point.name}.
                  Switch to a different month above to continue marking.
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="rounded-full"
              disabled={submitting || monthBlocked}
            >
              {submitting ? "Marking..." : "Mark Attendance"}
            </Button>
          </FieldGroup>
        </form>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            View Full Attendance
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Select
                value={viewMonth}
                onValueChange={(value: string | null): void => {
                  if (value !== null) {
                    setViewMonth(value);
                  }
                }}
              >
                <SelectTrigger
                  className="w-full rounded-full"
                  aria-label="Month to view"
                >
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option: MonthOption) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-full" onClick={handleViewAttendance}>
              View Attendance
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Select a month, then open the full attendance view for {point.name}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}