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
    case "today":
    case "daily":     return { from: startOfDay(now),             to };
    case "weekly":    return { from: startOfWeek(now),            to };
    case "monthly":   return { from: startOfMonth(now),           to };
    case "quarterly": return { from: startOfQuarter(now),         to };
    case "yearly":    return { from: startOfYear(now),            to };
    case "last_month": {
      const s = startOfMonth(subMonths(now, 1));
      const e = endOfDay(subDays(startOfMonth(now), 1));
      return { from: s, to: e };
    }
    case "last_quarter": {
      const s = startOfQuarter(subQuarters(now, 1));
      const e = endOfDay(subDays(startOfQuarter(now), 1));
      return { from: s, to: e };
    }
    case "last_year": {
      const s = startOfYear(subYears(now, 1));
      const e = endOfDay(subDays(startOfYear(now), 1));
      return { from: s, to: e };
    }
  }
}

export function getPreviousDateRange(period: TimePeriod): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "today":
    case "daily":     return { from: startOfDay(subDays(now, 1)),         to: endOfDay(subDays(now, 1)) };
    case "weekly":    return { from: startOfWeek(subWeeks(now, 1)),       to: endOfDay(subDays(startOfWeek(now), 1)) };
    case "monthly":   return { from: startOfMonth(subMonths(now, 1)),     to: endOfDay(subDays(startOfMonth(now), 1)) };
    case "quarterly": return { from: startOfQuarter(subQuarters(now, 1)), to: endOfDay(subDays(startOfQuarter(now), 1)) };
    case "yearly":    return { from: startOfYear(subYears(now, 1)),       to: endOfDay(subDays(startOfYear(now), 1)) };
    case "last_month": {
      const s = startOfMonth(subMonths(now, 2));
      const e = endOfDay(subDays(startOfMonth(subMonths(now, 1)), 1));
      return { from: s, to: e };
    }
    case "last_quarter": {
      const s = startOfQuarter(subQuarters(now, 2));
      const e = endOfDay(subDays(startOfQuarter(subQuarters(now, 1)), 1));
      return { from: s, to: e };
    }
    case "last_year": {
      const s = startOfYear(subYears(now, 2));
      const e = endOfDay(subDays(startOfYear(subYears(now, 1)), 1));
      return { from: s, to: e };
    }
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

// ─── ServiceDesk Plus links ────────────────────────────────────────────────────

/**
 * Build a deep link to a ticket in the ServiceDesk Plus Cloud web UI.
 * Example: https://northpointe.sdpondemand.manageengine.com/app/itdesk/ui/requests/<id>/details
 * Base URL and portal are overridable via NEXT_PUBLIC_SDP_BASE_URL / NEXT_PUBLIC_SDP_PORTAL_NAME.
 */
export function sdpTicketUrl(externalId: string): string {
  const base   = (process.env.NEXT_PUBLIC_SDP_BASE_URL ?? "https://northpointe.sdpondemand.manageengine.com").replace(/\/$/, "");
  const portal = process.env.NEXT_PUBLIC_SDP_PORTAL_NAME ?? "itdesk";
  const id     = externalId.replace(/^sdp-/, "");
  return `${base}/app/${portal}/ui/requests/${id}/details`;
}

// ─── Greeting helper ─────────────────────────────────────────────────────────

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Status / Priority display ───────────────────────────────────────────────

export const ALL_STATUSES = [
  "Open",
  "Pending Requester Response",
  "On Hold / Waiting for Vendor",
  "Closed",
  "Cancelled",
  "Awaiting CAB",
  "Awaiting Peer Review",
  "Awaiting prod sign-off",
  "Awaiting Vendor Action",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  "Open":                          "Open",
  "Pending Requester Response":    "Pending Requester Response",
  "On Hold / Waiting for Vendor":  "On Hold / Waiting for Vendor",
  "Closed":                        "Closed",
  "Cancelled":                     "Cancelled",
  "Awaiting CAB":                  "Awaiting CAB",
  "Awaiting Peer Review":          "Awaiting Peer Review",
  "Awaiting prod sign-off":        "Awaiting prod sign-off",
  "Awaiting Vendor Action":        "Awaiting Vendor Action",
};

export const STATUS_COLORS: Record<string, string> = {
  "Open":                          "bg-blue-50    text-blue-700",
  "Pending Requester Response":    "bg-amber-50   text-amber-800",
  "On Hold / Waiting for Vendor":  "bg-orange-50  text-orange-700",
  "Closed":                        "bg-slate-100  text-slate-600",
  "Cancelled":                     "bg-raspberry-50  text-raspberry-700",
  "Awaiting CAB":                  "bg-violet-50  text-violet-700",
  "Awaiting Peer Review":          "bg-teal-50    text-teal-700",
  "Awaiting prod sign-off":        "bg-green-50   text-green-700",
  "Awaiting Vendor Action":        "bg-blush      text-rose-800",
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
  URGENT: "bg-raspberry-100 text-raspberry-700",
};
