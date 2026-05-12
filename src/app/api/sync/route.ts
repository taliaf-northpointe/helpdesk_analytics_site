import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { runSync } from "@/lib/integrations/servicedesk-plus/sync";
import prisma from "@/lib/db/prisma";

// Trigger a manual sync
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type = "INCREMENTAL" } = await req.json().catch(() => ({})) as { type?: string };
  const syncType = type === "FULL" ? "FULL" : "INCREMENTAL";

  try {
    const result = await runSync(syncType);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Get sync status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lastJob = await prisma.syncJob.findFirst({
    orderBy: { startedAt: "desc" },
  });

  const ticketCount = await prisma.ticket.count();

  return NextResponse.json({
    lastSync:     lastJob?.completedAt?.toISOString() ?? null,
    status:       lastJob?.status ?? "idle",
    ticketCount,
    errorMessage: lastJob?.errorMessage ?? null,
  });
}
