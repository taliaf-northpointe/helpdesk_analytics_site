import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db/prisma";
import { differenceInDays } from "date-fns";

const OPEN_STATUSES = [
  "Open",
  "Pending Requester Response",
  "On Hold / Waiting for Vendor",
  "Awaiting CAB",
  "Awaiting Peer Review",
  "Awaiting prod sign-off",
  "Awaiting Vendor Action",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const tickets = await prisma.ticket.findMany({
    where:   { status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "asc" },
    include: { group: true, technician: true, category: true },
  });

  // Merge duplicate group/agent names (SDP can create duplicates on renames)
  const byStatus  = new Map<string, number>();
  const byGroup   = new Map<string, number>();
  const byAgent   = new Map<string, number>();

  for (const t of tickets) {
    byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
    const gName = t.group?.name ?? "Unassigned";
    byGroup.set(gName, (byGroup.get(gName) ?? 0) + 1);
    const aName = t.technician?.name ?? "Unassigned";
    byAgent.set(aName, (byAgent.get(aName) ?? 0) + 1);
  }

  const oldestAge = tickets.length > 0
    ? differenceInDays(now, tickets[0].createdAt)
    : 0;

  return NextResponse.json({
    totalOpen:    tickets.length,
    urgentOpen:   tickets.filter((t) => t.priority === "URGENT").length,
    slaBreaching: tickets.filter((t) => t.slaBreach).length,
    oldestAgeDays: oldestAge,
    byStatus: [...byStatus.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    byGroup: [...byGroup.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byAgent: [...byAgent.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    tickets: tickets.map((t) => ({
      id:          t.id,
      externalId:  t.externalId,
      subject:     t.subject,
      status:      t.status,
      priority:    t.priority,
      group:       t.group?.name       ?? "—",
      technician:  t.technician?.name  ?? "—",
      category:    t.category?.name    ?? "—",
      createdAt:   t.createdAt.toISOString(),
      slaBreach:   t.slaBreach,
      ageDays:     differenceInDays(now, t.createdAt),
    })),
  }, { headers: { "Cache-Control": "private, max-age=30" } });
}
