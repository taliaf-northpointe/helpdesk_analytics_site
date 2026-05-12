import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { runSync } from "@/lib/integrations/servicedesk-plus/sync";
import prisma from "@/lib/db/prisma";

// Allow up to 5 minutes for the sync route (Vercel Pro / self-hosted)
export const maxDuration = 300;

// Module-level ref prevents the promise from being GC'd mid-flight
let activeSyncPromise: Promise<unknown> | null = null;

// Trigger a manual sync — returns immediately; client should poll GET for status
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (activeSyncPromise) {
    return NextResponse.json({ error: "Sync already in progress" }, { status: 409 });
  }

  const { type = "INCREMENTAL" } = await req.json().catch(() => ({})) as { type?: string };
  const syncType = type === "FULL" ? "FULL" : "INCREMENTAL";

  activeSyncPromise = runSync(syncType).finally(() => { activeSyncPromise = null; });

  return NextResponse.json({ started: true, type: syncType }, { status: 202 });
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
