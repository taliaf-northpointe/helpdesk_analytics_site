import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, startOfDay, endOfDay, subDays, subWeeks, subMonths, subQuarters, subYears, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import type { TimePeriod } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function getDateRange(period: TimePeriod): { from: Date; to: Date } {
  const now = new Date();
  const to   = endOfDay(now);

  switch (period) {
    case "daily":     return { from: startOfDay(now),             to };
    case "weekly":    return { from: startOfWeek(now),            to };
    case "monthly":   return { from: startOfMonth(now),           to };
    case "quarterly": return { from: startOfQuarter(now),         to };
    case "yearly":    return { from: startOfYear(now),            to };
  }
}

export function getPreviousDateRange(period: TimePeriod): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "daily":     return { from: startOfDay(subDays(now, 1)),       to: endOfDay(subDays(now, 1)) };
    case "weekly":    return { from: startOfWeek(subWeeks(now, 1)),     to: endOfDay(subDays(startOfWeek(now), 1)) };
    case "monthly":   return { from: startOfMonth(subMonths(now, 1)),   to: endOfDay(subDays(startOfMonth(now), 1)) };
    case "quarterly": return { from: startOfQuarter(subQuarters(now,1)),to: endOfDay(subDays(startOfQuarter(now), 1)) };
    case "yearly":    return { from: startOfYear(subYears(now, 1)),     to: endOfDay(subDays(startOfYear(now), 1)) };
  }
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy") {
  return format(new Date(date), fmt);
}

export function formatRelative(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ─── Number helpers ───────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatHours(minutes: number): string {
  if (minutes < 60)  return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ─── Greeting helper ─────────────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Status / Priority display ───────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  OPEN:        "Open",
  IN_PROGRESS: "In Progress",
  ON_HOLD:     "On Hold",
  RESOLVED:    "Resolved",
  CLOSED:      "Closed",
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN:        "bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ON_HOLD:     "bg-gray-100  text-gray-700  dark:bg-gray-800      dark:text-gray-400",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED:      "bg-slate-100 text-slate-600 dark:bg-slate-800    dark:text-slate-400",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW:    "Low",
  MEDIUM: "Medium",
  HIGH:   "High",
  URGENT: "Urgent",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-gray-100  text-gray-600",
  MEDIUM: "bg-blue-100  text-blue-700",
  HIGH:   "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100   text-red-700",
};
