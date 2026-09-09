"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  GUARD_TYPE_OPTIONS,
  MONTHLY_ATTENDANCE_LIMIT,
  MONTHS,
  SHIFT_OPTIONS,
  type SelectOption,
} from "@/lib/supabase/constants";
import { errorMessage } from "@/lib/supabase/postgres-errors";
import type { AttendanceRow, PointRow } from "@/components/types/database";

const DESTRUCTIVE_ACTION: string =
  "rounded-full bg-destructive text-white hover:bg-destructive/90";

const shiftLabel = (value: string): string =>
  SHIFT_OPTIONS.find((option: SelectOption): boolean => option.value === value)
    ?.label ?? value;

const guardTypeLabel = (value: string): string =>
  GUARD_TYPE_OPTIONS.find(
    (option: SelectOption): boolean => option.value === value
  )?.label ?? value;

type AttendanceMonthViewProps = {
  point?: PointRow | null;
  records?: AttendanceRow[];
  initialMonth?: string;
  onBack?: () => void;
  onChanged?: () => void;
};

export default function AttendanceMonthView({
  point,
  records = [],
  initialMonth,
  onBack,
  onChanged,
}: AttendanceMonthViewProps) {
  const [month, setMonth] = useState<string>(
    initialMonth !== undefined && initialMonth !== ""
      ? initialMonth
      : MONTHS[new Date().getMonth()]
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingMonth, setDeletingMonth] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRow | null>(
    null
  );
  const [recordDeleteOpen, setRecordDeleteOpen] = useState<boolean>(false);
  const [monthDeleteOpen, setMonthDeleteOpen] = useState<boolean>(false);

  const sortedRecords: AttendanceRow[] = useMemo(
    (): AttendanceRow[] =>
      [...records]
        .filter((record: AttendanceRow): boolean => record.att_month === month)
        .sort((a: AttendanceRow, b: AttendanceRow): number => {
          if (a.att_date !== b.att_date) {
            return a.att_date < b.att_date ? 1 : -1;
          }
          return a.created_at < b.created_at ? 1 : -1;
        }),
    [records, month]
  );

  const monthAtLimit: boolean =
    sortedRecords.length >= MONTHLY_ATTENDANCE_LIMIT;

  const goBack = (): void => {
    if (onBack !== undefined) {
      onBack();
    }
  };

  const notifyChanged = (): void => {
    if (onChanged !== undefined) {
      onChanged();
    }
  };

  if (point === null || point === undefined) {
    return (
      <div className="container mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
        <div className="rounded-3xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">
            This view must be opened from a point in the registry.
          </p>
        </div>
      </div>
    );
  }

  const removeRecord = async (record: AttendanceRow): Promise<void> => {
    setDeletingId(record.id);

    const supabase = createClient();

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("id", record.id);

    setDeletingId(null);

    if (error) {
      toast.error("Could not delete record", {
        description: errorMessage(
          error.message,
          "Something went wrong while deleting this attendance record."
        ),
      });
      return;
    }

    toast.success("Attendance deleted", {
      description: `${record.guard_name} · ${record.att_date} was removed.`,
    });

    notifyChanged();
  };

  const deleteMonthRecords = async (): Promise<void> => {
    if (deletingMonth) {
      return;
    }

    setDeletingMonth(true);

    const supabase = createClient();

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("point_id", point.id)
      .eq("att_month", month);

    setDeletingMonth(false);

    if (error) {
      toast.error("Could not delete month", {
        description: errorMessage(
          error.message,
          "Something went wrong while deleting this month's attendance."
        ),
      });
      return;
    }

    toast.success("Month deleted", {
      description: `All ${month} attendance records for ${point.name} were removed.`,
    });

    notifyChanged();
  };

  return (
    <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Attendance · {point.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {month} · full month view
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" className="rounded-full" onClick={goBack}>
            Back to Registry
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={sortedRecords.length === 0 || deletingMonth}
            onClick={(): void => setMonthDeleteOpen(true)}
          >
            {deletingMonth ? "Deleting…" : "Delete Month"}
          </Button>
        </div>
      </div>

      {monthAtLimit ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Monthly attendance limit reached</AlertTitle>
          <AlertDescription>
            {sortedRecords.length} records are marked in {month} for{" "}
            {point.name} — the limit is {MONTHLY_ATTENDANCE_LIMIT} per month.
            Marking attendance for {month} is blocked. Switch to another month
            above or delete records below.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:w-56">
          <Select
            value={month}
            onValueChange={(value: string | null): void => {
              if (value !== null) {
                setMonth(value);
              }
            }}
          >
            <SelectTrigger
              className="w-full rounded-full"
              aria-label="Change month"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {sortedRecords.length} record{sortedRecords.length === 1 ? "" : "s"}{" "}
          in {month} for {point.name} · limit {MONTHLY_ATTENDANCE_LIMIT}
        </p>
      </div>

      {sortedRecords.length === 0 ? (
        <div className="rounded-3xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No attendance was marked in {month} for this point.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedRecords.map((record: AttendanceRow) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-3"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="truncate text-sm font-medium">
                  {record.guard_name}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{record.att_date}</span>
                  <span>·</span>
                  <span>{record.att_month}</span>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 text-[11px]"
                  >
                    {shiftLabel(record.shift)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 text-[11px]"
                  >
                    {guardTypeLabel(record.guard_type)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={deletingId === record.id}
                onClick={(): void => {
                  setRecordToDelete(record);
                  setRecordDeleteOpen(true);
                }}
              >
                {deletingId === record.id ? "Deleting…" : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={recordDeleteOpen} onOpenChange={setRecordDeleteOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this attendance record?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordToDelete !== null
                ? `${recordToDelete.guard_name} · ${recordToDelete.att_date} · ${guardTypeLabel(
                    recordToDelete.guard_type
                  )} · ${shiftLabel(recordToDelete.shift)} will be removed permanently. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={DESTRUCTIVE_ACTION}
              onClick={(): void => {
                const record: AttendanceRow | null = recordToDelete;
                setRecordDeleteOpen(false);
                if (record !== null) {
                  void removeRecord(record);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={monthDeleteOpen} onOpenChange={setMonthDeleteOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all {month} attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              {sortedRecords.length} record
              {sortedRecords.length === 1 ? "" : "s"} from {month} will be
              removed from {point.name} permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={DESTRUCTIVE_ACTION}
              onClick={(): void => {
                setMonthDeleteOpen(false);
                void deleteMonthRecords();
              }}
            >
              Delete Month
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}