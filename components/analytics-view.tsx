"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AttendanceDailyChart,
  PointsAreaChart,
  SplitDonutChart,
  type DailyAttendanceDatum,
  type MonthlyPointsDatum,
} from "@/components/analytics-charts";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/postgres-errors";
import { MONTHS } from "@/lib/supabase/constants";
import type { AttendanceRow, PointRow } from "@/components/types/database";

const POLL_INTERVAL_MS: number = 15000;
const SKELETON_STATS: number[] = [0, 1, 2, 3];

const MONTH_ABBREVIATIONS: string[] = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

type MonthWindowEntry = {
  key: string;
  label: string;
};

const buildMonthWindow = (): MonthWindowEntry[] => {
  const entries: MonthWindowEntry[] = [];
  const now: Date = new Date();
  const currentYear: number = now.getFullYear();

  for (let i: number = 11; i >= 0; i -= 1) {
    const date: Date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label: string =
      date.getFullYear() === currentYear
        ? MONTH_ABBREVIATIONS[date.getMonth()]
        : `${MONTH_ABBREVIATIONS[date.getMonth()]} '${String(
            date.getFullYear()
          ).slice(2)}`;
    entries.push({ key: monthKey(date), label });
  }

  return entries;
};

const useCountUp = (target: number): number => {
  const [display, setDisplay] = useState<number>(0);
  const previousRef = useRef<number>(0);

  useEffect(() => {
    const start: number = previousRef.current;
    const delta: number = target - start;

    previousRef.current = target;

    if (delta === 0) {
      setDisplay(target);
      return;
    }

    let frame: number = 0;
    const startedAt: number = performance.now();

    const step = (timestamp: number): void => {
      const progress: number = Math.min((timestamp - startedAt) / 800, 1);
      const eased: number = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + delta * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return display;
};

function StatCard({
  title,
  value,
  footer,
  delay,
}: {
  title: string;
  value: number;
  footer: ReactNode;
  delay: number;
}) {
  const animated: number = useCountUp(value);

  return (
    <Card className="animate-rise rounded-2xl" style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold sm:text-3xl">{animated}</p>
        <div className="mt-1">{footer}</div>
      </CardContent>
    </Card>
  );
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const difference: number = current - previous;

  if (difference === 0) {
    return (
      <span className="text-xs text-muted-foreground">same as last month</span>
    );
  }

  const up: boolean = difference > 0;

  return (
    <span
      className={`text-xs font-medium ${
        up ? "text-primary" : "text-destructive"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(difference)} vs last month
    </span>
  );
}

export default function AnalyticsView() {
  const [points, setPoints] = useState<PointRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());

  const load = useCallback(async (): Promise<void> => {
    const supabase = createClient();

    const [pointsResult, attendanceResult] = await Promise.all([
      supabase
        .from("points")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (pointsResult.error) {
      toast.error("Could not load points", {
        description: errorMessage(
          pointsResult.error.message,
          "Something went wrong while loading points."
        ),
      });
    }

    if (attendanceResult.error) {
      toast.error("Could not load attendance", {
        description: errorMessage(
          attendanceResult.error.message,
          "Something went wrong while loading attendance."
        ),
      });
    }

    setPoints(pointsResult.data ?? []);
    setAttendance(attendanceResult.data ?? []);
    setLoading(false);
    setLastUpdatedAt(Date.now());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  // Live polling — every 15 seconds while the tab is visible.
  useEffect(() => {
    const interval = window.setInterval((): void => {
      if (document.visibilityState === "visible") {
        void load();
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [load]);

  // Instant refresh when the tab regains focus.
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [load]);

  // One-second ticker for the "updated Xs ago" label.
  useEffect(() => {
    const interval = window.setInterval((): void => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const monthWindow: MonthWindowEntry[] = useMemo(
    (): MonthWindowEntry[] => buildMonthWindow(),
    []
  );

  const thisMonth = useMemo(
    (): { key: string; name: string; lastMonthKey: string } => {
      const current: Date = new Date();
      const previous: Date = new Date(
        current.getFullYear(),
        current.getMonth() - 1,
        1
      );

      return {
        key: monthKey(current),
        name: MONTHS[current.getMonth()],
        lastMonthKey: monthKey(previous),
      };
    },
    []
  );

  const monthlyPointsData: MonthlyPointsDatum[] = useMemo(
    (): MonthlyPointsDatum[] => {
      const counts: Record<string, number> = {};

      for (const point of points) {
        const key: string = point.created_at.slice(0, 7);
        counts[key] = (counts[key] ?? 0) + 1;
      }

      return monthWindow.map(
        (entry: MonthWindowEntry): MonthlyPointsDatum => ({
          month: entry.label,
          points: counts[entry.key] ?? 0,
        })
      );
    },
    [points, monthWindow]
  );

  const pointsThisMonth: number =
    monthlyPointsData[monthlyPointsData.length - 1]?.points ?? 0;
  const pointsLastMonth: number =
    monthlyPointsData[monthlyPointsData.length - 2]?.points ?? 0;

  const peak = useMemo((): { label: string; count: number } => {
    let bestLabel: string =
      monthlyPointsData[monthlyPointsData.length - 1]?.month ?? "—";
    let bestCount: number = 0;

    for (const entry of monthlyPointsData) {
      if (entry.points > bestCount) {
        bestCount = entry.points;
        bestLabel = entry.month;
      }
    }

    return { label: bestLabel, count: bestCount };
  }, [monthlyPointsData]);

  const attendanceThisMonth: AttendanceRow[] = useMemo(
    (): AttendanceRow[] =>
      attendance.filter(
        (record: AttendanceRow): boolean =>
          record.att_date.slice(0, 7) === thisMonth.key
      ),
    [attendance, thisMonth]
  );

  const attendanceLastMonth: number = useMemo(
    (): number =>
      attendance.filter(
        (record: AttendanceRow): boolean =>
          record.att_date.slice(0, 7) === thisMonth.lastMonthKey
      ).length,
    [attendance, thisMonth]
  );

  const dailyData: DailyAttendanceDatum[] = useMemo(
    (): DailyAttendanceDatum[] => {
      const counts: Record<string, number> = {};

      for (const record of attendanceThisMonth) {
        const day: string = record.att_date.slice(8, 10);
        counts[day] = (counts[day] ?? 0) + 1;
      }

      const today: Date = new Date();
      const daysInMonth: number = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();

      const result: DailyAttendanceDatum[] = [];

      for (let day: number = 1; day <= daysInMonth; day += 1) {
        const key: string = String(day).padStart(2, "0");
        result.push({ day: String(day), attendance: counts[key] ?? 0 });
      }

      return result;
    },
    [attendanceThisMonth]
  );

  const shiftSplit = useMemo((): { day: number; night: number } => {
    let day: number = 0;
    let night: number = 0;

    for (const record of attendanceThisMonth) {
      if (record.shift === "night") {
        night += 1;
      } else {
        day += 1;
      }
    }

    return { day, night };
  }, [attendanceThisMonth]);

  const guardTypeSplit = useMemo((): { regular: number; replacement: number } => {
    let regular: number = 0;
    let replacement: number = 0;

    for (const record of attendanceThisMonth) {
      if (record.guard_type === "replacement") {
        replacement += 1;
      } else {
        regular += 1;
      }
    }

    return { regular, replacement };
  }, [attendanceThisMonth]);

  const activeGuardCount = useMemo((): number => {
    const names: Set<string> = new Set<string>();

    for (const record of attendanceThisMonth) {
      names.add(record.guard_name.trim().toLowerCase());
    }

    return names.size;
  }, [attendanceThisMonth]);

  const topGuards = useMemo(
    (): { name: string; count: number }[] => {
      const counts: Map<string, { name: string; count: number }> = new Map();

      for (const record of attendanceThisMonth) {
        const display: string = record.guard_name.trim();
        const key: string = display.toLowerCase();
        const existing = counts.get(key);

        if (existing === undefined) {
          counts.set(key, { name: display, count: 1 });
        } else {
          existing.count += 1;
        }
      }

      return [...counts.values()]
        .sort(
          (a: { name: string; count: number }, b: { name: string; count: number }): number =>
            b.count - a.count
        )
        .slice(0, 5);
    },
    [attendanceThisMonth]
  );

  const secondsAgo: number =
    lastUpdatedAt === 0
      ? 0
      : Math.max(0, Math.floor((now - lastUpdatedAt) / 1000));

  return (
    <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Analytics &amp; Insights
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />

            </span>
            <span>
              {lastUpdatedAt === 0
                ? "connecting…"
                : secondsAgo < 3
                  ? "updated just now"
                  : `updated ${secondsAgo}s ago`}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={(): void => {
              void load();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Link href="/dashboard" className="flex">
            <Button
              variant="outline"
              className="w-full rounded-full sm:w-auto"
            >
              Back to Registry
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <>
          <Progress value={loadProgress} className="h-1.5" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {SKELETON_STATS.map((index: number) => (
              <Card key={index} className="rounded-2xl">
                <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-3xl">
            <CardHeader>
              <Skeleton className="h-5 w-56 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-2xl" />
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl">
              <CardHeader>
                <Skeleton className="h-5 w-44 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full rounded-2xl" />
              </CardContent>
            </Card>
            <Card className="rounded-3xl">
              <CardHeader>
                <Skeleton className="h-5 w-44 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full rounded-2xl" />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Points · This Month"
              value={pointsThisMonth}
              delay={0}
              footer={<Trend current={pointsThisMonth} previous={pointsLastMonth} />}
            />
            <StatCard
              title="Attendance · This Month"
              value={attendanceThisMonth.length}
              delay={60}
              footer={
                <Trend
                  current={attendanceThisMonth.length}
                  previous={attendanceLastMonth}
                />
              }
            />
            <StatCard
              title="Peak Month · 12 mo"
              value={peak.count}
              delay={120}
              footer={
                <span className="text-xs text-muted-foreground">
                  {peak.label} · most points registered
                </span>
              }
            />
            <StatCard
              title="Active Guards · This Month"
              value={activeGuardCount}
              delay={180}
              footer={
                <span className="text-xs text-muted-foreground">
                  distinct guards marked in {thisMonth.name}
                </span>
              }
            />
          </div>

          <Card
            className="animate-rise rounded-3xl"
            style={{ animationDelay: "240ms" }}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <CardTitle>Points Registered per Month</CardTitle>
                <CardDescription>
                  Last 12 months · previous month to present
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full">
                Peak: {peak.label} · {peak.count}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <PointsAreaChart data={monthlyPointsData} />
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Note: this graph covers the last 12 months and resets after one
                year once a month becomes older than 12 months, it
                automatically drops off the chart. Your full history stays
                safely stored in the database and remains visible in the
                registry.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              className="animate-rise rounded-3xl"
              style={{ animationDelay: "300ms" }}
            >
              <CardHeader>
                <CardTitle>Attendance · {thisMonth.name}</CardTitle>
                <CardDescription>
                  Records marked each day of {thisMonth.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceDailyChart data={dailyData} />
              </CardContent>
            </Card>

            <Card
              className="animate-rise rounded-3xl"
              style={{ animationDelay: "360ms" }}
            >
              <CardHeader>
                <CardTitle>Shift Split · {thisMonth.name}</CardTitle>
                <CardDescription>Day vs night duty this month</CardDescription>
              </CardHeader>
              <CardContent>
                <SplitDonutChart
                  centerLabel="records"
                  emptyLabel={`No attendance marked in ${thisMonth.name} yet.`}
                  segments={[
                    {
                      key: "day",
                      label: "Day",
                      value: shiftSplit.day,
                      color: "var(--chart-1)",
                    },
                    {
                      key: "night",
                      label: "Night",
                      value: shiftSplit.night,
                      color: "var(--chart-2)",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card
              className="animate-rise rounded-3xl"
              style={{ animationDelay: "420ms" }}
            >
              <CardHeader>
                <CardTitle>Guard Types · {thisMonth.name}</CardTitle>
                <CardDescription>
                  Regular vs replacement guards this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SplitDonutChart
                  centerLabel="records"
                  emptyLabel={`No attendance marked in ${thisMonth.name} yet.`}
                  segments={[
                    {
                      key: "regular",
                      label: "Regular",
                      value: guardTypeSplit.regular,
                      color: "var(--chart-3)",
                    },
                    {
                      key: "replacement",
                      label: "Replacement",
                      value: guardTypeSplit.replacement,
                      color: "var(--chart-4)",
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card
              className="animate-rise rounded-3xl"
              style={{ animationDelay: "480ms" }}
            >
              <CardHeader>
                <CardTitle>Top Guards · {thisMonth.name}</CardTitle>
                <CardDescription>Most marked guards this month</CardDescription>
              </CardHeader>
              <CardContent>
                {topGuards.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No attendance marked in {thisMonth.name} yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {topGuards.map(
                      (guard: { name: string; count: number }, index: number) => {
                        const maxCount: number = topGuards[0]?.count ?? 1;
                        const width: number =
                          maxCount === 0
                            ? 0
                            : Math.round((guard.count / maxCount) * 100);

                        return (
                          <li
                            key={`${guard.name}-${index}`}
                            className="flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate font-medium">
                                {guard.name}
                              </span>
                              <span className="shrink-0 text-muted-foreground">
                                {guard.count} record
                                {guard.count === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-700"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}