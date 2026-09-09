"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AttendanceMonthView from "@/components/attendance-month-view";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { MONTHS } from "@/lib/supabase/constants";
import { errorMessage } from "@/lib/supabase/postgres-errors";
import type { AttendanceRow, PointRow } from "@/components/types/database";

const SKELETON_ROWS: number[] = [0, 1, 2, 3, 4];

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const normalizeMonth = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export default function AttendanceRouteView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pointId: string = searchParams.get("point") ?? "";
  const month: string = normalizeMonth(
    safeDecode(searchParams.get("month") ?? "")
  );
  const validRequest: boolean = pointId !== "" && MONTHS.includes(month);

  const [point, setPoint] = useState<PointRow | null>(null);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [notFound, setNotFound] = useState<boolean>(false);

  const load = useCallback(
    async (options?: { showSkeletons?: boolean }): Promise<void> => {
      const showSkeletons: boolean = options?.showSkeletons ?? false;

      if (showSkeletons) {
        setLoading(true);
      }

      const supabase = createClient();

      const [pointResult, attendanceResult] = await Promise.all([
        supabase.from("points").select("*").eq("id", pointId).maybeSingle(),
        supabase
          .from("attendance")
          .select("*")
          .eq("point_id", pointId)
          .order("att_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (pointResult.error) {
        toast.error("Could not load point", {
          description: errorMessage(
            pointResult.error.message,
            "Something went wrong while loading this point."
          ),
        });
      }

      if (attendanceResult.error) {
        toast.error("Could not load attendance", {
          description: errorMessage(
            attendanceResult.error.message,
            "Something went wrong while loading attendance records."
          ),
        });
      }

      setPoint(pointResult.data ?? null);
      setNotFound(pointResult.error !== null || pointResult.data === null);
      setRecords(attendanceResult.data ?? []);
      setLoading(false);
    },
    [pointId]
  );

  useEffect(() => {
    if (validRequest) {
      void load({ showSkeletons: true });
    } else {
      setLoading(false);
    }
  }, [load, validRequest]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    setLoadProgress(12);

    const interval = window.setInterval(() => {
      setLoadProgress((current: number): number =>
        current >= 90 ? current : current + 6
      );
    }, 120);

    return () => window.clearInterval(interval);
  }, [loading]);

  if (!validRequest) {
    return (
      <div className="container mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
        <div className="rounded-3xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No point or month selected.{" "}
            <Link
              href="/dashboard"
              className="rounded-full text-primary hover:underline"
            >
              Return to the registry
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
        <Progress value={loadProgress} className="h-1.5" />
        <ul className="flex flex-col gap-2">
          {SKELETON_ROWS.map((index: number) => (
            <li
              key={index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
            >
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-48 rounded-full" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (notFound || point === null) {
    return (
      <div className="container mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:py-10">
        <div className="rounded-3xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">
            This point no longer exists.{" "}
            <Link
              href="/dashboard"
              className="rounded-full text-primary hover:underline"
            >
              Return to the registry
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <AttendanceMonthView
      point={point}
      records={records}
      initialMonth={month}
      onBack={(): void => {
        router.push("/dashboard");
      }}
      onChanged={(): void => {
        void load();
      }}
    />
  );
}