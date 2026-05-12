import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/analytics/aggregations";
import type { TimePeriod, ReportFilters } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = (req.nextUrl.searchParams.get("period") ?? "monthly") as TimePeriod;
  const validPeriods: TimePeriod[] = ["daily", "weekly", "monthly", "quarterly", "last_quarter", "yearly", "last_year", "today", "last_month"];
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const filters: ReportFilters = {};
  const groupName      = req.nextUrl.searchParams.get("group");
  const technicianName = req.nextUrl.searchParams.get("technician");
  const categoryName   = req.nextUrl.searchParams.get("category");
  const priorities     = req.nextUrl.searchParams.get("priorities");
  const statuses       = req.nextUrl.searchParams.get("statuses");

  if (groupName)      filters.groupName      = groupName;
  if (technicianName) filters.technicianName = technicianName;
  if (categoryName)   filters.categoryName   = categoryName;
  if (priorities)     filters.priorities     = priorities.split(",").filter(Boolean);
  if (statuses)       filters.statuses       = statuses.split(",").filter(Boolean);

  const hasFilters     = Object.keys(filters).length > 0;
  const techLimitParam = req.nextUrl.searchParams.get("techLimit");
  const techLimit      = techLimitParam === "all" ? null : techLimitParam ? parseInt(techLimitParam, 10) : 10;

  try {
    const data = await getDashboardData(period, hasFilters ? filters : undefined, techLimit);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    console.error("[API /analytics/dashboard]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
