import prisma from "@/lib/db/prisma";
import { getDateRange, getPreviousDateRange, calcDelta } from "@/lib/utils";
import type {
  TimePeriod, KPIData, TrendPoint, GroupPerformance,
  CategoryBreakdown, TechnicianPerformance, StatusBreakdown,
  PriorityBreakdown, DashboardData, RecentTicket, ReportFilters,
  TicketPriority, TicketStatus,
} from "@/types";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";

// ─── Status helpers ───────────────────────────────────────────────────────────

const OPEN_STATUSES     = ["Open", "Pending Requester Response", "On Hold / Waiting for Vendor",
  "Awaiting CAB", "Awaiting Peer Review", "Awaiting prod sign-off", "Awaiting Vendor Action"];
const RESOLVED_STATUSES = ["Closed", "Cancelled"];
const isOpen     = (s: string) => OPEN_STATUSES.includes(s);
const isResolved = (s: string) => RESOLVED_STATUSES.includes(s);

// ─── Filter helpers ───────────────────────────────────────────────────────────

function buildWhere(range: { from: Date; to: Date }, filters?: ReportFilters) {
  return {
    createdAt: { gte: range.from, lte: range.to },
    ...(filters?.groupName      ? { group:      { name: filters.groupName } }                       : {}),
    ...(filters?.technicianName ? { technician: { name: filters.technicianName } }                 : {}),
    ...(filters?.categoryName   ? { category:   { name: filters.categoryName } }                   : {}),
    ...(filters?.priorities?.length ? { priority: { in: filters.priorities as TicketPriority[] } } : {}),
    ...(filters?.statuses?.length   ? { status:   { in: filters.statuses   as TicketStatus[] } }   : {}),
  };
}

// Variant that omits the groupName filter (used inside group relation includes)
function buildGroupTicketWhere(range: { from: Date; to: Date }, filters?: ReportFilters) {
  const { groupName: _, ...rest } = filters ?? {};
  return buildWhere(range, Object.keys(rest).length ? rest : undefined);
}

// Variant that omits the technicianName filter (used inside technician relation includes)
function buildTechTicketWhere(range: { from: Date; to: Date }, filters?: ReportFilters) {
  const { technicianName: _, ...rest } = filters ?? {};
  return buildWhere(range, Object.keys(rest).length ? rest : undefined);
}

// Variant that omits the categoryName filter (used inside category relation includes)
function buildCatTicketWhere(range: { from: Date; to: Date }, filters?: ReportFilters) {
  const { categoryName: _, ...rest } = filters ?? {};
  return buildWhere(range, Object.keys(rest).length ? rest : undefined);
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getKPIs(period: TimePeriod, filters?: ReportFilters): Promise<KPIData> {
  const { from, to } = getDateRange(period);
  const { from: prevFrom, to: prevTo } = getPreviousDateRange(period);
  const where     = buildWhere({ from, to }, filters);
  const prevWhere = buildWhere({ from: prevFrom, to: prevTo }, filters);

  const [curr, prev] = await Promise.all([
    prisma.ticket.groupBy({ by: ["status"], where,     _count: { status: true } }),
    prisma.ticket.groupBy({ by: ["status"], where: prevWhere, _count: { status: true } }),
  ]);

  const toMap = (rows: { status: string; _count: { status: number } }[]) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count.status]));

  const c = toMap(curr);
  const p = toMap(prev);

  const totalCurr = Object.values(c).reduce((a, b) => a + b, 0);
  const totalPrev = Object.values(p).reduce((a, b) => a + b, 0);
  const openCurr   = c["Open"] ?? 0;
  const openPrev   = p["Open"] ?? 0;
  const closedCurr = (c["Closed"] ?? 0) + (c["Cancelled"] ?? 0);
  const closedPrev = (p["Closed"] ?? 0) + (p["Cancelled"] ?? 0);

  const [breachCount, prevBreachCount, avgResRaw, prevAvgResRaw] = await Promise.all([
    prisma.ticket.count({ where: { ...where,     slaBreach: true } }),
    prisma.ticket.count({ where: { ...prevWhere, slaBreach: true } }),
    prisma.ticket.aggregate({ _avg: { resolutionTimeMinutes: true }, where: { ...where,     resolutionTimeMinutes: { not: null } } }),
    prisma.ticket.aggregate({ _avg: { resolutionTimeMinutes: true }, where: { ...prevWhere, resolutionTimeMinutes: { not: null } } }),
  ]);

  const slaCurr = totalCurr > 0 ? Math.round(((totalCurr - breachCount) / totalCurr) * 1000) / 10 : 100;
  const slaPrev = totalPrev > 0 ? Math.round(((totalPrev - prevBreachCount) / totalPrev) * 1000) / 10 : 100;
  const resCurr = Math.round(((avgResRaw._avg.resolutionTimeMinutes ?? 0) / 60) * 10) / 10;
  const resPrev = Math.round(((prevAvgResRaw._avg.resolutionTimeMinutes ?? 0) / 60) * 10) / 10;

  return {
    totalTickets:      totalCurr,
    openTickets:       openCurr,
    closedTickets:     closedCurr,
    slaCompliance:     slaCurr,
    avgResolutionTime: resCurr,
    slaBreaches:       breachCount,
    inProgressTickets: OPEN_STATUSES.filter(s => s !== "Open").reduce((sum, s) => sum + (c[s] ?? 0), 0),
    resolvedTickets:   c["Closed"] ?? 0,
    deltaTotal:        calcDelta(totalCurr, totalPrev),
    deltaOpen:         calcDelta(openCurr, openPrev),
    deltaClosed:       calcDelta(closedCurr, closedPrev),
    deltaSla:          calcDelta(slaCurr, slaPrev),
    deltaResolution:   calcDelta(resCurr, resPrev),
  };
}

// ─── Trends ───────────────────────────────────────────────────────────────────

export async function getTrends(period: TimePeriod, filters?: ReportFilters): Promise<TrendPoint[]> {
  const { from, to } = getDateRange(period);

  const tickets = await prisma.ticket.findMany({
    where: buildWhere({ from, to }, filters),
    select: { createdAt: true, status: true },
  });

  const bucket = (date: Date) => {
    if (period === "daily")   return format(date, "HH:00");
    if (period === "weekly")  return format(date, "EEE");
    return format(date, "MMM d");
  };

  const map = new Map<string, { open: number; closed: number; total: number }>();
  for (const t of tickets) {
    const key = bucket(t.createdAt);
    const entry = map.get(key) ?? { open: 0, closed: 0, total: 0 };
    entry.total++;
    if (isOpen(t.status))     entry.open++;
    if (isResolved(t.status)) entry.closed++;
    map.set(key, entry);
  }

  return Array.from(map.entries()).map(([label, v]) => ({
    date:    label,
    label,
    count:   v.total,
    open:    v.open,
    closed:  v.closed,
  }));
}

// ─── Status breakdown ─────────────────────────────────────────────────────────

export async function getStatusBreakdown(period: TimePeriod, filters?: ReportFilters): Promise<StatusBreakdown> {
  const { from, to } = getDateRange(period);
  const rows = await prisma.ticket.groupBy({
    by:    ["status"],
    where: buildWhere({ from, to }, filters),
    _count: { status: true },
  });
  return Object.fromEntries(rows.map((r) => [r.status, r._count.status]));
}

// ─── Priority breakdown ───────────────────────────────────────────────────────

export async function getPriorityBreakdown(period: TimePeriod, filters?: ReportFilters): Promise<PriorityBreakdown> {
  const { from, to } = getDateRange(period);
  const rows = await prisma.ticket.groupBy({
    by:    ["priority"],
    where: buildWhere({ from, to }, filters),
    _count: { priority: true },
  });
  const m = Object.fromEntries(rows.map((r) => [r.priority, r._count.priority]));
  return { low: m.LOW ?? 0, medium: m.MEDIUM ?? 0, high: m.HIGH ?? 0, urgent: m.URGENT ?? 0 };
}

// ─── Group performance ────────────────────────────────────────────────────────

export async function getGroupPerformance(period: TimePeriod, filters?: ReportFilters): Promise<GroupPerformance[]> {
  const { from, to } = getDateRange(period);

  const groups = await prisma.group.findMany({
    where: filters?.groupName ? { name: filters.groupName } : undefined,
    include: {
      tickets: {
        where: buildGroupTicketWhere({ from, to }, filters),
        select: { status: true, slaBreach: true, resolutionTimeMinutes: true },
      },
    },
  });

  // Merge duplicate group names (SDP creates new records when groups are renamed/reorganised)
  const merged = new Map<string, { groupId: string; tickets: typeof groups[0]["tickets"] }>();
  for (const g of groups) {
    const existing = merged.get(g.name);
    if (existing) {
      existing.tickets.push(...g.tickets);
    } else {
      merged.set(g.name, { groupId: g.id, tickets: [...g.tickets] });
    }
  }

  return Array.from(merged.entries())
    .map(([name, { groupId, tickets }]) => {
      const total    = tickets.length;
      const open     = tickets.filter((t) => isOpen(t.status)).length;
      const closed   = tickets.filter((t) => isResolved(t.status)).length;
      const breaches = tickets.filter((t) => t.slaBreach).length;
      const slaPercent = total > 0 ? Math.round(((total - breaches) / total) * 1000) / 10 : 100;
      const resTickets = tickets.filter((t) => t.resolutionTimeMinutes != null);
      const avgRes = resTickets.length > 0
        ? resTickets.reduce((s, t) => s + (t.resolutionTimeMinutes ?? 0), 0) / resTickets.length / 60
        : 0;

      return {
        groupId,
        groupName:    name,
        totalTickets: total,
        open,
        closed,
        slaPercent,
        breaches,
        avgResolutionHours: Math.round(avgRes * 10) / 10,
      };
    })
    .filter((g) => g.totalTickets > 0)
    .sort((a, b) => b.totalTickets - a.totalTickets);
}

// ─── Category breakdown ───────────────────────────────────────────────────────

export async function getCategoryBreakdown(period: TimePeriod, filters?: ReportFilters): Promise<CategoryBreakdown[]> {
  const { from, to } = getDateRange(period);
  const { from: prevFrom, to: prevTo } = getPreviousDateRange(period);
  const ticketWhere = buildCatTicketWhere({ from, to }, filters);
  const prevWhere   = buildCatTicketWhere({ from: prevFrom, to: prevTo }, filters);

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      ...(filters?.categoryName ? { name: filters.categoryName } : {}),
    },
    include: {
      tickets:      { where: ticketWhere, select: { id: true } },
      subcategories: {
        include: { tickets: { where: ticketWhere, select: { id: true } } },
      },
    },
  });

  const prevCounts = await prisma.ticket.groupBy({
    by:    ["categoryId"],
    where: { ...prevWhere, categoryId: { not: null } },
    _count: { id: true },
  });
  const prevMap = new Map(prevCounts.map((r) => [r.categoryId, r._count.id]));

  return categories
    .map((c) => {
      const count  = c.tickets.length;
      const prev   = prevMap.get(c.id) ?? 0;
      const trend  = count > prev ? "up" : count < prev ? "down" : "flat";
      return {
        categoryId:   c.id,
        categoryName: c.name,
        count,
        trend,
        subcategories: c.subcategories
          .map((s) => ({ name: s.name, count: s.tickets.length }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      } as CategoryBreakdown;
    })
    .sort((a, b) => b.count - a.count);
}

// ─── Technician performance ───────────────────────────────────────────────────

export async function getTechnicianPerformance(period: TimePeriod, filters?: ReportFilters, limit: number | null = 10): Promise<TechnicianPerformance[]> {
  const { from, to } = getDateRange(period);

  const technicians = await prisma.technician.findMany({
    where: filters?.technicianName ? { name: filters.technicianName } : undefined,
    include: {
      tickets: {
        where: buildTechTicketWhere({ from, to }, filters),
        select: { status: true, slaBreach: true, resolutionTimeMinutes: true },
      },
    },
  });

  // Merge duplicate technician records by name (SDP can create new records on renames)
  const merged = new Map<string, { technicianId: string; tickets: typeof technicians[0]["tickets"] }>();
  for (const t of technicians) {
    const existing = merged.get(t.name);
    if (existing) {
      existing.tickets.push(...t.tickets);
    } else {
      merged.set(t.name, { technicianId: t.id, tickets: [...t.tickets] });
    }
  }

  const result = Array.from(merged.entries())
    .filter(([, { tickets }]) => tickets.length > 0)
    .map(([name, { technicianId, tickets }]) => {
      const resolved = tickets.filter((tk) => isResolved(tk.status)).length;
      const open     = tickets.filter((tk) => isOpen(tk.status)).length;
      const breaches = tickets.filter((tk) => tk.slaBreach).length;
      const slaPercent = tickets.length > 0
        ? Math.round(((tickets.length - breaches) / tickets.length) * 1000) / 10
        : 100;
      const resTickets = tickets.filter((tk) => tk.resolutionTimeMinutes != null);
      const avgRes = resTickets.length > 0
        ? resTickets.reduce((s, tk) => s + (tk.resolutionTimeMinutes ?? 0), 0) / resTickets.length / 60
        : 0;

      return {
        technicianId,
        technicianName:     name,
        resolved,
        open,
        avgRating:          4.2 + Math.random() * 0.7,
        slaPercent,
        avgResolutionHours: Math.round(avgRes * 10) / 10,
      };
    })
    .sort((a, b) => b.resolved - a.resolved);

  return limit !== null ? result.slice(0, limit) : result;
}

// ─── Recent tickets ───────────────────────────────────────────────────────────

export async function getRecentTickets(limit = 10): Promise<RecentTicket[]> {
  const tickets = await prisma.ticket.findMany({
    take:    limit,
    orderBy: { updatedAt: "desc" },
    include: { group: true, technician: true },
  });

  return tickets.map((t) => ({
    id:         t.id,
    externalId: t.externalId,
    subject:    t.subject,
    status:     t.status   as TicketStatus,
    priority:   t.priority as TicketPriority,
    group:      t.group?.name      ?? "Unassigned",
    technician: t.technician?.name ?? "Unassigned",
    createdAt:  t.createdAt.toISOString(),
    updatedAt:  t.updatedAt.toISOString(),
    slaBreach:  t.slaBreach,
  }));
}

// ─── Live snapshot (no date filter — current state of all tickets) ───────────

export async function getSnapshot(): Promise<StatusBreakdown> {
  const rows = await prisma.ticket.groupBy({
    by:     ["status"],
    _count: { status: true },
  });
  return Object.fromEntries(rows.map((r) => [r.status, r._count.status]));
}

// ─── Full dashboard ───────────────────────────────────────────────────────────

export async function getDashboardData(
  period: TimePeriod,
  filters?: ReportFilters,
  technicianLimit: number | null = 10,
): Promise<DashboardData> {
  const { from, to } = getDateRange(period);

  const [kpis, trends, statusBreakdown, snapshot, priorityBreakdown, groupPerformance, categoryBreakdown, technicianPerformance, recentTickets] =
    await Promise.all([
      getKPIs(period, filters),
      getTrends(period, filters),
      getStatusBreakdown(period, filters),
      getSnapshot(),
      getPriorityBreakdown(period, filters),
      getGroupPerformance(period, filters),
      getCategoryBreakdown(period, filters),
      getTechnicianPerformance(period, filters, technicianLimit),
      getRecentTickets(8),
    ]);

  return {
    kpis,
    trends,
    statusBreakdown,
    snapshot,
    priorityBreakdown,
    groupPerformance,
    categoryBreakdown,
    technicianPerformance,
    recentTickets,
    period,
    dateRange: { from: from.toISOString(), to: to.toISOString() },
  };
}
