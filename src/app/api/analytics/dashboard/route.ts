import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getDashboardData } from "@/lib/analytics/aggregations";
import type { TimePeriod } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = (req.nextUrl.searchParams.get("period") ?? "monthly") as TimePeriod;
  const validPeriods: TimePeriod[] = ["daily", "weekly", "monthly", "quarterly", "yearly"];
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  try {
    const data = await getDashboardData(period);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    console.error("[API /analytics/dashboard]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
