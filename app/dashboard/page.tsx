"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AttendanceDialog from "@/components/attendance-dialoge";
import AttendanceMonthView from "@/components/attendance-month-view";
import EditPointDialog from "@/components/edit-point-dialog";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/postgres-errors";
import { ATTENDANCE_ALERT_THRESHOLD } from "@/lib/supabase/constants";
import type { AttendanceRow, PointRow } from "@/components/types/database";

const SKELETON_CARDS: number[] = [0, 1, 2, 3];
const DESTRUCTIVE_ACTION: string =
  "rounded-full bg-destructive text-white hover:bg-destructive/90";

export default function DashboardPage() {
  const router = useRouter();
  const [points, setPoints] = useState<PointRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  const [signOutOpen, setSignOutOpen] = useState<boolean>(false);

  const [deletingPoint, setDeletingPoint] = useState<PointRow | null>(null);
  const [deletePointOpen, setDeletePointOpen] = useState<boolean>(false);

  const [attendancePoint, setAttendancePoint] = useState<PointRow | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState<boolean>(false);
  const [attendanceViewMonth, setAttendanceViewMonth] = useState<string | null>(
    null
  );

  const [editingPoint, setEditingPoint] = useState<PointRow | null>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);

  const alertedPointIds = useRef<Set<string>>(new Set<string>());
  const loadSequence = useRef<number>(0);

  const checkAttendanceThreshold = useCallback(
    (pts: PointRow[], records: AttendanceRow[]): void => {
      const counts: Record<string, number> = {};

      for (const record of records) {
        counts[record.point_id] = (counts[record.point_id] ?? 0) + 1;
      }

      for (const point of pts) {
        const count: number = counts[point.id] ?? 0;

        if (
          count > ATTENDANCE_ALERT_THRESHOLD &&
          !alertedPointIds.current.has(point.id)
        ) {
          alertedPointIds.current.add(point.id);
          toast.error("Attendance limit exceeded", {
            description: `${point.name} has ${count} attendance records — more than the allowed ${ATTENDANCE_ALERT_THRESHOLD}. Delete attendance to continue marking.`,
            duration: 7000,
          });
        }
      }
    },
    []
  );

  const loadAll = useCallback(
    async (options?: { showSkeletons?: boolean }): Promise<void> => {
      const showSkeletons: boolean = options?.showSkeletons ?? false;

      const sequence: number = loadSequence.current + 1;
      loadSequence.current = sequence;

      if (showSkeletons) {
        setLoading(true);
      }

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

      if (loadSequence.current !== sequence) {
        return;
      }

      if (pointsResult.error) {
        toast.error("Could not load points", {
          description: errorMessage(
            pointsResult.error.message,
            "Something went wrong while loading the registry."
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

      const nextPoints: PointRow[] = pointsResult.data ?? [];
      const nextAttendance: AttendanceRow[] = attendanceResult.data ?? [];

      setPoints(nextPoints);
      setAttendance(nextAttendance);
      setLoading(false);
      checkAttendanceThreshold(nextPoints, nextAttendance);
    },
    [checkAttendanceThreshold]
  );

  useEffect(() => {
    void loadAll({ showSkeletons: true });
  }, [loadAll]);

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

  const attendanceCounts: Record<string, number> = useMemo(
    (): Record<string, number> => {
      const counts: Record<string, number> = {};

      for (const record of attendance) {
        counts[record.point_id] = (counts[record.point_id] ?? 0) + 1;
      }

      return counts;
    },
    [attendance]
  );

  const latestAttendanceByPoint: Record<string, AttendanceRow> = useMemo(
    (): Record<string, AttendanceRow> => {
      const latest: Record<string, AttendanceRow> = {};

      for (const record of attendance) {
        const current: AttendanceRow | undefined = latest[record.point_id];

        if (
          current === undefined ||
          record.att_date > current.att_date ||
          (record.att_date === current.att_date &&
            record.created_at > current.created_at)
        ) {
          latest[record.point_id] = record;
        }
      }

      return latest;
    },
    [attendance]
  );

  const attendanceForPoint = useCallback(
    (pointId: string): AttendanceRow[] =>
      attendance.filter(
        (record: AttendanceRow): boolean => record.point_id === pointId
      ),
    [attendance]
  );

  const filteredPoints: PointRow[] = useMemo((): PointRow[] => {
    const q: string = query.trim().toLowerCase();

    if (q === "") {
      return points;
    }

    return points.filter(
      (point: PointRow): boolean =>
        point.name.toLowerCase().includes(q) ||
        point.person_name.toLowerCase().includes(q) ||
        point.phone.toLowerCase().includes(q)
    );
  }, [points, query]);

  const totalAttendance: number = attendance.length;
  const overLimitCount: number = points.filter(
    (point: PointRow): boolean =>
      (attendanceCounts[point.id] ?? 0) > ATTENDANCE_ALERT_THRESHOLD
  ).length;

  const handleSignOut = async (): Promise<void> => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const removePoint = async (point: PointRow): Promise<void> => {
    const supabase = createClient();

    const { error } = await supabase.from("points").delete().eq("id", point.id);

    if (error) {
      toast.error("Delete failed", {
        description: errorMessage(
          error.message,
          "Something went wrong while deleting this point."
        ),
      });
      return;
    }

    toast.success("Point deleted", {
      description: `${point.name} and its attendance records were removed.`,
    });

    if (attendancePoint !== null && attendancePoint.id === point.id) {
      setAttendanceOpen(false);
      setAttendanceViewMonth(null);
    }
    if (editingPoint !== null && editingPoint.id === point.id) {
      setEditOpen(false);
    }

    void loadAll();
  };

  const openAttendance = (point: PointRow): void => {
    setAttendancePoint(point);
    setAttendanceOpen(true);
  };

  const openEdit = (point: PointRow): void => {
    setEditingPoint(point);
    setEditOpen(true);
  };

  const askDeletePoint = (point: PointRow): void => {
    setDeletingPoint(point);
    setDeletePointOpen(true);
  };

  const emptyMessage: string =
    points.length === 0
      ? "No points found. Register your first point."
      : "No points match your search.";

  if (attendancePoint !== null && attendanceViewMonth !== null) {
    return (
      <AttendanceMonthView
        point={attendancePoint}
        records={attendanceForPoint(attendancePoint.id)}
        initialMonth={attendanceViewMonth}
        onBack={(): void => setAttendanceViewMonth(null)}
        onChanged={(): void => {
          void loadAll();
        }}
      />
    );
  }

  return (
    <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Points Registry
          </h1>
          <p className="text-sm text-muted-foreground">Incharge · full access</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link href="/register" className="flex">
            <Button
              variant="outline"
              className="w-full rounded-full sm:w-auto"
            >
              Register Point
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={(): void => setSignOutOpen(true)}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-2 p-3 sm:p-4">
              <Skeleton className="h-3 w-14 rounded-full" />
              <Skeleton className="h-7 w-10" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-2 p-3 sm:p-4">
              <Skeleton className="h-3 w-14 rounded-full" />
              <Skeleton className="h-7 w-10" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col gap-2 p-3 sm:p-4">
              <Skeleton className="h-3 w-14 rounded-full" />
              <Skeleton className="h-7 w-10" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="text-2xl font-bold">{points.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Records</p>
              <p className="text-2xl font-bold">{totalAttendance}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Over Limit</p>
              <p
                className={`text-2xl font-bold ${
                  overLimitCount > 0 ? "text-destructive" : ""
                }`}
              >
                {overLimitCount}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search points"
            placeholder="Search by point, person, or phone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-full pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={(): void => {
            void loadAll({ showSkeletons: true });
          }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {loading ? <Progress value={loadProgress} className="h-1.5" /> : null}

      {!loading ? (
        <div className="text-sm text-muted-foreground">
          {filteredPoints.length} of {points.length} point
          {points.length === 1 ? "" : "s"}
          {totalAttendance > 0
            ? ` · ${totalAttendance} attendance record${
                totalAttendance === 1 ? "" : "s"
              }`
            : ""}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border bg-background">
        {loading ? (
          <ul className="flex flex-col gap-4 p-4">
            {SKELETON_CARDS.map((index: number) => (
              <li
                key={index}
                className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 space-y-2.5">
                    <Skeleton className="h-4 rounded-full" />
                    <Skeleton className="h-4 w-56 rounded-full" />
                    <Skeleton className="h-4 w-40 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                  <Skeleton className="h-8 rounded-full" />
                  <Skeleton className="h-8 rounded-full" />
                  <Skeleton className="h-8 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        ) : filteredPoints.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 p-4">
            {filteredPoints.map((point: PointRow) => {
              const count: number = attendanceCounts[point.id] ?? 0;
              const overLimit: boolean = count > ATTENDANCE_ALERT_THRESHOLD;
              const latest: AttendanceRow | undefined =
                latestAttendanceByPoint[point.id];

              return (
                <li
                  key={point.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-base font-semibold">
                        {point.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                        <span>{point.person_name}</span>
                        <span>{point.phone}</span>
                        {latest ? (
                          <span>
                            Last: {latest.guard_name} · {latest.att_date}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Badge
                      variant={overLimit ? "destructive" : "secondary"}
                      className="rounded-full"
                    >
                      Attendance · {count}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() => openAttendance(point)}
                    >
                      Attendance
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => openEdit(point)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => askDeletePoint(point)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {attendancePoint !== null ? (
        <AttendanceDialog
          point={attendancePoint}
          records={attendanceForPoint(attendancePoint.id)}
          open={attendanceOpen}
          onOpenChange={(next: boolean): void => setAttendanceOpen(next)}
          onChanged={(): void => {
            void loadAll();
          }}
          onViewMonth={(month: string): void => setAttendanceViewMonth(month)}
        />
      ) : null}

      {editingPoint !== null ? (
        <EditPointDialog
          point={editingPoint}
          open={editOpen}
          onOpenChange={(next: boolean): void => setEditOpen(next)}
          onSaved={(): void => {
            void loadAll();
          }}
        />
      ) : null}

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

      <AlertDialog open={deletePointOpen} onOpenChange={setDeletePointOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this point?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPoint !== null
                ? `${deletingPoint.name} and ALL of its attendance records will be removed permanently. This cannot be undone.`
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
                const point: PointRow | null = deletingPoint;
                setDeletePointOpen(false);
                if (point !== null) {
                  void removePoint(point);
                }
              }}
            >
              Delete Point
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}