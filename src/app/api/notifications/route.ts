import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const OPEN = { notIn: ["Closed", "Cancelled"] as string[] };

  const [slaBreaches, unassignedUrgent, lastSync, talia] = await Promise.all([
    prisma.ticket.count({ where: { slaBreach: true, status: OPEN } }),
    prisma.ticket.count({ where: { priority: { in: ["URGENT", "HIGH"] }, technicianId: null, status: OPEN } }),
    prisma.syncJob.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.technician.findFirst({ where: { name: { contains: "Talia" } } }),
  ]);

  const assignedToMe = talia
    ? await prisma.ticket.count({ where: { technicianId: talia.id, status: OPEN } })
    : 0;

  const syncFailed = lastSync?.status === "FAILED";

  return NextResponse.json({
    slaBreaches,
    unassignedUrgent,
    assignedToMe,
    syncFailed,
    lastSyncAt:  lastSync?.completedAt?.toISOString() ?? null,
    lastSyncErr: lastSync?.errorMessage ?? null,
    total: slaBreaches + unassignedUrgent + assignedToMe + (syncFailed ? 1 : 0),
  });
}
