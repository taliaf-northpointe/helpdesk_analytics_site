import prisma from "@/lib/db/prisma";
import { sdpPaginate } from "./client";
import type { SDPTicket, TicketStatus, TicketPriority } from "@/types";

// ─── Field mappers ────────────────────────────────────────────────────────────

const VALID_STATUSES = new Set<TicketStatus>([
  "Open",
  "Pending Requester Response",
  "On Hold / Waiting for Vendor",
  "Closed",
  "Cancelled",
  "Awaiting CAB",
  "Awaiting Peer Review",
  "Awaiting prod sign-off",
  "Awaiting Vendor Action",
]);

function mapStatus(sdpStatus: string): TicketStatus {
  const s = sdpStatus.trim() as TicketStatus;
  if (VALID_STATUSES.has(s)) return s;
  // Known SDP aliases
  if (s === "Completed" || (s as string) === "Resolved") return "Closed";
  if ((s as string) === "Received - Assessing")          return "Open";
  return "Open";
}

function mapPriority(sdpPriority: string): TicketPriority {
  const p = sdpPriority.toLowerCase();
  if (p.includes("urgent") || p.includes("critical")) return "URGENT";
  if (p.includes("high"))                              return "HIGH";
  if (p.includes("medium") || p.includes("normal"))   return "MEDIUM";
  return "LOW";
}

function parseSDPDate(val: string | undefined | null): Date | undefined {
  if (!val) return undefined;
  const ms = parseInt(val, 10);
  if (!isNaN(ms) && ms > 0) return new Date(ms);
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

// ─── Build lookup maps from ticket data (no extra API calls needed) ───────────

async function buildLookupsFromTickets(tickets: SDPTicket[]) {
  const groupMap = new Map<string, string>();
  const techMap  = new Map<string, string>();
  const catMap   = new Map<string, string>();
  const subMap   = new Map<string, string>();
  const slaMap   = new Map<string, string>();

  // Collect unique entities
  const groups      = new Map<string, string>();   // id -> name
  const techs       = new Map<string, { name: string; email?: string }>();
  const cats        = new Map<string, string>();
  const subs        = new Map<string, { name: string; catId: string }>();
  const slas        = new Map<string, string>();

  for (const t of tickets) {
    if (t.group?.id)       groups.set(t.group.id, t.group.name);
    if (t.technician?.id)  techs.set(t.technician.id, { name: t.technician.name, email: t.technician.email_id });
    if (t.category?.id)    cats.set(t.category.id, t.category.name);
    if (t.subcategory?.id && t.category?.id)
      subs.set(t.subcategory.id, { name: t.subcategory.name, catId: t.category.id });
    if (t.sla?.id)         slas.set(t.sla.id, t.sla.name);
  }

  // Upsert groups
  for (const [externalId, name] of groups) {
    const r = await prisma.group.upsert({
      where: { externalId },
      update: { name },
      create: { externalId, name },
    });
    groupMap.set(externalId, r.id);
  }

  // Upsert technicians
  for (const [externalId, { name, email }] of techs) {
    const r = await prisma.technician.upsert({
      where: { externalId },
      update: { name, email },
      create: { externalId, name, email },
    });
    techMap.set(externalId, r.id);
  }

  // Upsert categories
  for (const [externalId, name] of cats) {
    const r = await prisma.category.upsert({
      where: { externalId },
      update: { name },
      create: { externalId, name },
    });
    catMap.set(externalId, r.id);
  }

  // Upsert subcategories (after categories)
  for (const [externalId, { name, catId }] of subs) {
    const categoryId = catMap.get(catId);
    if (!categoryId) continue;
    const r = await prisma.subcategory.upsert({
      where: { externalId },
      update: { name, categoryId },
      create: { externalId, name, categoryId },
    });
    subMap.set(externalId, r.id);
  }

  // Upsert SLAs (minimal data — we don't have response/resolution times from ticket data)
  for (const [externalId, name] of slas) {
    const r = await prisma.sLA.upsert({
      where: { externalId },
      update: { name },
      create: { externalId, name, responseTime: 240, resolutionTime: 1440 },
    });
    slaMap.set(externalId, r.id);
  }

  return { groupMap, techMap, catMap, subMap, slaMap };
}

// ─── Main sync ────────────────────────────────────────────────────────────────

export async function runSync(type: string = "INCREMENTAL") {
  const job = await prisma.syncJob.create({
    data: { type, status: "RUNNING" },
  });

  try {
    console.log(`[Sync] Starting ${type} sync (job ${job.id})...`);

    // For FULL sync, fetch last 90 days; for INCREMENTAL, fetch since last sync
    let searchCriteria: Record<string, unknown>[] | undefined;
    if (type === "INCREMENTAL") {
      const lastJob = await prisma.syncJob.findFirst({
        where: { status: "COMPLETED", type: { in: ["FULL", "INCREMENTAL"] } },
        orderBy: { completedAt: "desc" },
      });
      if (lastJob?.completedAt) {
        const since = new Date(lastJob.completedAt.getTime() - 60_000);
        searchCriteria = [{ field: "created_time", condition: "greater than", value: { value: String(since.getTime()) } }];
      }
    } else {
      // FULL: all tickets since 2025-01-01 (full historical baseline)
      const historicalStart = new Date("2025-01-01T00:00:00.000Z");
      searchCriteria = [{ field: "created_time", condition: "greater than", value: { value: String(historicalStart.getTime()) } }];
    }

    const sdpTickets = await sdpPaginate<SDPTicket>("/requests", "requests", 100, searchCriteria);

    console.log(`[Sync] Fetched ${sdpTickets.length} tickets from SDP.`);

    if (sdpTickets.length === 0) {
      await prisma.syncJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date(), ticketCount: 0 },
      });
      return { success: true, ticketCount: 0 };
    }

    // Build lookup tables from ticket data (avoids needing extra API scopes)
    const { groupMap, techMap, catMap, subMap, slaMap } = await buildLookupsFromTickets(sdpTickets);

    // Upsert tickets in chunks
    let upserted = 0;
    const CHUNK = 50;

    for (let i = 0; i < sdpTickets.length; i += CHUNK) {
      const chunk = sdpTickets.slice(i, i + CHUNK);
      await Promise.all(chunk.map(async (t) => {
        const createdAt  = parseSDPDate(t.created_time?.value) ?? new Date();
        const resolvedAt = parseSDPDate(t.resolved_time?.value);
        const closedAt   = parseSDPDate(t.closed_time?.value);
        const dueDate    = parseSDPDate(t.due_by_time?.value);
        const resMinutes = resolvedAt
          ? Math.round((resolvedAt.getTime() - createdAt.getTime()) / 60_000)
          : undefined;

        const slaInternalId = t.sla?.id ? slaMap.get(t.sla.id) : undefined;
        const slaRecord = slaInternalId
          ? await prisma.sLA.findUnique({ where: { id: slaInternalId } })
          : null;
        const slaBreach = resMinutes != null && slaRecord
          ? resMinutes > slaRecord.resolutionTime
          : (t.is_overdue ?? false);

        const shared = {
          subject:      t.subject,
          status:       mapStatus(t.status?.name ?? ""),
          priority:     mapPriority(t.priority?.name ?? ""),
          slaBreach,
          groupId:       t.group?.id       ? groupMap.get(t.group.id)       : undefined,
          technicianId:  t.technician?.id  ? techMap.get(t.technician.id)   : undefined,
          categoryId:    t.category?.id    ? catMap.get(t.category.id)      : undefined,
          subcategoryId: t.subcategory?.id ? subMap.get(t.subcategory.id)   : undefined,
          slaId:         slaInternalId,
          resolvedAt,
          closedAt,
          dueDate,
          resolutionTimeMinutes: resMinutes,
        };

        const displayId = t.display_id != null ? String(t.display_id) : undefined;

        await prisma.ticket.upsert({
          where:  { externalId: t.id },
          update: { ...shared, updatedAt: new Date(), ...(displayId ? { displayId } : {}) },
          create: {
            ...shared,
            externalId:  t.id,
            displayId,
            createdAt,
            updatedAt:   createdAt,
            createdDay:  createdAt.getDate(),
            createdMonth: createdAt.getMonth() + 1,
            createdYear: createdAt.getFullYear(),
            syncJobId:   job.id,
          },
        });
        upserted++;
      }));

      console.log(`[Sync] ${Math.min(i + CHUNK, sdpTickets.length)} / ${sdpTickets.length} processed...`);
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date(), ticketCount: upserted },
    });

    console.log(`[Sync] Done. ${upserted} tickets upserted.`);
    return { success: true, ticketCount: upserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: "FAILED", completedAt: new Date(), errorMessage: message },
    });
    console.error("[Sync] Failed:", message);
    throw err;
  }
}