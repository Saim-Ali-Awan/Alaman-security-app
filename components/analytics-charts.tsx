"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type MonthlyPointsDatum = {
  month: string;
  points: number;
};

export type DailyAttendanceDatum = {
  day: string;
  attendance: number;
};

const pointsChartConfig = {
  points: { label: "Points" },
} satisfies ChartConfig;

const attendanceChartConfig = {
  attendance: { label: "Attendance" },
} satisfies ChartConfig;

export function PointsAreaChart({ data }: { data: MonthlyPointsDatum[] }) {
  return (
    <ChartContainer config={pointsChartConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="points"
          type="monotone"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#pointsGradient)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function AttendanceDailyChart({
  data,
}: {
  data: DailyAttendanceDatum[];
}) {
  return (
    <ChartContainer config={attendanceChartConfig} className="h-56 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="attendance"
          type="monotone"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#attendanceGradient)"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export function SplitDonutChart({
  segments,
  centerLabel,
  emptyLabel,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  emptyLabel?: string;
}) {
  const total: number = segments.reduce(
    (sum: number, segment: DonutSegment): number => sum + segment.value,
    0
  );

  const config: Record<string, { label: string; color: string }> = {};

  for (const segment of segments) {
    config[segment.key] = { label: segment.label, color: segment.color };
  }

  const data = segments.map((segment: DonutSegment) => ({
    key: segment.key,
    value: segment.value,
    fill: segment.color,
  }));

  if (total === 0 && emptyLabel !== undefined) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full">
        <ChartContainer config={config} className="h-56 w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">{centerLabel}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {segments.map((segment: DonutSegment) => (
          <span key={segment.key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            {segment.label} · {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
}