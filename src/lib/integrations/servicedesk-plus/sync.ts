/**
 * ServiceDesk Plus → PostgreSQL sync engine.
 * Handles full and incremental syncs of tickets, groups, technicians, and categories.
 */
import prisma from "@/lib/db/prisma";
import { sdpPaginate, sdpGet } from "./client";
import type { SDPTicket } from "@/types";
import { SyncType, SyncStatus, TicketStatus, TicketPriority } from "@prisma/client";
import { startOfDay } from "date-fns";

// ─── SDP entity maps ──────────────────────────────────────────────────────────

function mapStatus(sdpStatus: string): TicketStatus {
  const s = sdpStatus.toLowerCase();
  if (s.includes("open"))       return "OPEN";
  if (s.includes("progress"))   return "IN_PROGRESS";
  if (s.includes("hold"))       return "ON_HOLD";
  if (s.includes("resolved"))   return "RESOLVED";
  if (s.includes("closed"))     return "CLOSED";
  return "OPEN";
}

function mapPriority(sdpPriority: string): TicketPriority {
  const p = sdpPriority.toLowerCase();
  if (p.includes("urgent") || p.includes("critical")) return "URGENT";
  if (p.includes("high"))   return "HIGH";
  if (p.includes("medium") || p.includes("normal"))  return "MEDIUM";
  return "LOW";
}

function parseSDPDate(val: string | undefined | null): Date | undefined {
  if (!val) return undefined;
  const ms = parseInt(val, 10);
  if (!isNaN(ms)) return new Date(ms);
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

// ─── Lookup sync helpers ──────────────────────────────────────────────────────

async function syncGroups(): Promise<Map<string, string>> {
  const sdpGroups = await sdpPaginate<{ id: string; name: string; description?: string }>(
    "/groups", "groups",
  );
  const idMap = new Map<string, string>();

  for (const g of sdpGroups) {
    const record = await prisma.group.upsert({
      where: { externalId: g.id },
      update: { name: g.name },
      create: { externalId: g.id, name: g.name, description: g.description },
    });
    idMap.set(g.id, record.id);
  }
  return idMap;
}

async function syncTechnicians(): Promise<Map<string, string>> {
  const sdpTechs = await sdpPaginate<{ id: string; name: string; email_id?: string }>(
    "/technicians", "technicians",
  );
  const idMap = new Map<string, string>();

  for (const t of sdpTechs) {
    const record = await prisma.technician.upsert({
      where: { externalId: t.id },
      update: { name: t.name, email: t.email_id },
      create: { externalId: t.id, name: t.name, email: t.email_id },
    });
    idMap.set(t.id, record.id);
  }
  return idMap;
}

async function syncCategories(): Promise<{ cats: Map<string, string>; subs: Map<string, string> }> {
  const sdpCats = await sdpPaginate<{ id: string; name: string; sub_categories?: { id: string; name: string }[] }>(
    "/categories", "categories",
  );
  const cats = new Map<string, string>();
  const subs = new Map<string, string>();

  for (const c of sdpCats) {
    const catRecord = await prisma.category.upsert({
      where: { externalId: c.id },
      update: { name: c.name },
      create: { externalId: c.id, name: c.name },
    });
    cats.set(c.id, catRecord.id);

    for (const sub of c.sub_categories ?? []) {
      const subRecord = await prisma.subcategory.upsert({
        where: { externalId: sub.id },
        update: { name: sub.name },
        create: { externalId: sub.id, name: sub.name, categoryId: catRecord.id },
      });
      subs.set(sub.id, subRecord.id);
    }
  }
  return { cats, subs };
}

async function syncSLAs(): Promise<Map<string, string>> {
  const sdpSLAs = await sdpPaginate<{ id: string; name: string; response_time?: { value?: string }; resolution_time?: { value?: string } }>(
    "/slas", "slas",
  );
  const idMap = new Map<string, string>();

  for (const s of sdpSLAs) {
    const responseTime   = parseInt(s.response_time?.value ?? "240", 10);
    const resolutionTime = parseInt(s.resolution_time?.value ?? "1440", 10);

    const record = await prisma.sLA.upsert({
      where: { externalId: s.id },
      update: { name: s.name, responseTime, resolutionTime },
      create: { externalId: s.id, name: s.name, responseTime, resolutionTime },
    });
    idMap.set(s.id, record.id);
  }
  return idMap;
}

// ─── Main sync functions ──────────────────────────────────────────────────────

export async function runSync(type: SyncType = SyncType.INCREMENTAL) {
  const job = await prisma.syncJob.create({
    data: { type, status: SyncStatus.RUNNING },
  });

  try {
    console.log(`[Sync] Starting ${type} sync (job ${job.id})...`);

    const [groupMap, techMap, { cats: catMap, subs: subMap }, slaMap] = await Promise.all([
      syncGroups(),
      syncTechnicians(),
      syncCategories(),
      syncSLAs(),
    ]);

    // For incremental, only fetch tickets updated since last successful sync
    let fromDate: Date | undefined;
    if (type === SyncType.INCREMENTAL) {
      const lastJob = await prisma.syncJob.findFirst({
        where: { status: SyncStatus.COMPLETED, type: { in: [SyncType.FULL, SyncType.INCREMENTAL] } },
        orderBy: { completedAt: "desc" },
      });
      fromDate = lastJob?.completedAt ? new Date(lastJob.completedAt.getTime() - 60_000) : undefined;
    }

    const filterData: Record<string, unknown> = {};
    if (fromDate) {
      filterData.search_criteria = [{
        field: "updatedtime",
        condition: "greater than",
        value: fromDate.getTime().toString(),
        logical_operator: "AND",
      }];
    }

    const sdpTickets = await sdpPaginate<SDPTicket>("/requests", "requests");

    let upserted = 0;
    const CHUNK = 50;

    for (let i = 0; i < sdpTickets.length; i += CHUNK) {
      const chunk = sdpTickets.slice(i, i + CHUNK);
      await Promise.all(chunk.map(async (t) => {
        const createdAt   = parseSDPDate(t.created_time?.value) ?? new Date();
        const resolvedAt  = parseSDPDate(t.resolved_time?.value);
        const closedAt    = parseSDPDate(t.closed_time?.value);
        const dueDate     = parseSDPDate(t.due_by_time?.value);
        const resMinutes  = resolvedAt
          ? Math.round((resolvedAt.getTime() - createdAt.getTime()) / 60_000)
          : undefined;

        const slaInternalId = t.sla?.id ? slaMap.get(t.sla.id) : undefined;
        const slaRecord = slaInternalId
          ? await prisma.sLA.findUnique({ where: { id: slaInternalId } })
          : null;
        const slaBreach = resMinutes != null && slaRecord
          ? resMinutes > slaRecord.resolutionTime
          : t.is_overdue;

        await prisma.ticket.upsert({
          where: { externalId: t.id },
          update: {
            subject:    t.subject,
            status:     mapStatus(t.status?.name ?? ""),
            priority:   mapPriority(t.priority?.name ?? ""),
            updatedAt:  new Date(),
            resolvedAt,
            closedAt,
            dueDate,
            slaBreach,
            groupId:      t.group?.id      ? groupMap.get(t.group.id)      : undefined,
            technicianId: t.technician?.id ? techMap.get(t.technician.id)  : undefined,
            categoryId:   t.category?.id   ? catMap.get(t.category.id)     : undefined,
            subcategoryId: t.subcategory?.id ? subMap.get(t.subcategory.id) : undefined,
            slaId:        slaInternalId,
            resolutionTimeMinutes: resMinutes,
          },
          create: {
            externalId:   t.id,
            subject:      t.subject,
            status:       mapStatus(t.status?.name ?? ""),
            priority:     mapPriority(t.priority?.name ?? ""),
            createdAt,
            updatedAt:    createdAt,
            resolvedAt,
            closedAt,
            dueDate,
            slaBreach,
            groupId:      t.group?.id      ? groupMap.get(t.group.id)      : undefined,
            technicianId: t.technician?.id ? techMap.get(t.technician.id)  : undefined,
            categoryId:   t.category?.id   ? catMap.get(t.category.id)     : undefined,
            subcategoryId: t.subcategory?.id ? subMap.get(t.subcategory.id) : undefined,
            slaId:        slaInternalId,
            resolutionTimeMinutes: resMinutes,
            createdDay:   createdAt.getDate(),
            createdMonth: createdAt.getMonth() + 1,
            createdYear:  createdAt.getFullYear(),
            syncJobId:    job.id,
          },
        });
        upserted++;
      }));
    }

    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: SyncStatus.COMPLETED, completedAt: new Date(), ticketCount: upserted },
    });

    console.log(`[Sync] ✅  ${type} sync complete. ${upserted} tickets processed.`);
    return { success: true, ticketCount: upserted };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: SyncStatus.FAILED, completedAt: new Date(), errorMessage: message },
    });
    console.error("[Sync] ❌  Sync failed:", message);
    throw err;
  }
}
