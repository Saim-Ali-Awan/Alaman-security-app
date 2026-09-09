// Monthly limit: maximum attendance records allowed per point, per month.
export const MONTHLY_ATTENDANCE_LIMIT: number = 95;

// Kept for compatibility with any older file that still imports it.
export const ATTENDANCE_ALERT_THRESHOLD: number = MONTHLY_ATTENDANCE_LIMIT;

export const MONTHS: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type SelectOption = {
  value: string;
  label: string;
};

export const SHIFT_OPTIONS: SelectOption[] = [
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];

export const GUARD_TYPE_OPTIONS: SelectOption[] = [
  { value: "regular", label: "Regular" },
  { value: "replacement", label: "Replacement" },
];

export const PHONE_PATTERN: RegExp = /^[0-9+\-\s()]{7,20}$/;

export const DATE_PATTERN: RegExp = /^\d{4}-\d{2}-\d{2}$/;