import { Suspense } from "react";
import AttendanceRouteView from "@/components/attendance-month-view";
import { Skeleton } from "@/components/ui/skeleton";

const FALLBACK_ROWS: number[] = [0, 1, 2, 3, 4];

function AttendanceRouteFallback() {
  return (
    <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>
      <ul className="flex flex-col gap-2">
        {FALLBACK_ROWS.map((index: number) => (
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

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendanceRouteFallback />}>
      <AttendanceRouteView />
    </Suspense>
  );
}