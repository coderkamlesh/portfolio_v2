export interface DayPoint {
  date: string;
  count: number;
}

export interface DownloadsResponse {
  total: number;
  unique_ips: number;
  by_day: DayPoint[];
  from: string;
  to: string;
}

export const DAY_PRESETS = [7, 30, 90, 365] as const;

export function normalizeDays(raw: string, fallback: number): number {
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 1 || value > 365) return fallback;
  return value;
}

export function analyticsErrorText(code: string, message: string): string {
  switch (code) {
    case "unauthorized":
      return "Session expired. Log in again.";
    case "service_unavailable":
      return "Analytics is temporarily unavailable. Try again later.";
    case "internal_error":
      return "Server error. Try again.";
    default:
      return message || "Something went wrong. Try again.";
  }
}
