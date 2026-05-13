"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Ticket, CheckCircle2, AlertTriangle, Clock, ShieldCheck, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, formatDate } from "@/lib/utils";
import { Header }             from "@/components/layout/Header";
import { KPICard }            from "@/components/dashboard/KPICard";
import { TicketVolumeChart }  from "@/components/dashboard/TicketVolumeChart";
import { TicketsByStatus }    from "@/components/dashboard/TicketsByStatus";
import { PerformanceTable }   from "@/components/dashboard/PerformanceTable";
import { TicketsByCategory }  from "@/components/dashboard/TicketsByCategory";
import { RecentActivity }     from "@/components/dashboard/RecentActivity";
import { TopAgents }          from "@/components/dashboard/TopAgents";
import { DashboardFooter }    from "@/components/dashboard/DashboardFooter";
import { ChatWidget }         from "@/components/chatbot/ChatWidget";
import { getGreeting, formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardData, TimePeriod } from "@/types";
import { toast } from "sonner";

const PERIODS: { key: TimePeriod; label: string; sub: string }[] = [
  { key: "today",        label: "Today",          sub: "created today"          },
  { key: "weekly",       label: "This Week",      sub: "created this week"      },
  { key: "monthly",      label: "This Month",     sub: "created this month"     },
  { key: "last_month",   label: "Last Month",     sub: "created last month"     },
  { key: "quarterly",    label: "This Quarter",   sub: "created this quarter"   },
  { key: "last_quarter", label: "Last Quarter",   sub: "created last quarter"   },
  { key: "yearly",       label: "This Year",      sub: "created this year"      },
  { key: "last_year",    label: "Last Year",      sub: "created last year"      },
];

const OPEN_STATUSES_CSV = [
  "Open", "Pending Requester Response", "On Hold / Waiting for Vendor",
  "Awaiting CAB", "Awaiting Peer Review", "Awaiting prod sign-off", "Awaiting Vendor Action",
].join(",");

export default function DashboardPage() {
  const [period,     setPeriod]     = useState<TimePeriod>("monthly");
  const [data,       setData]       = useState<DashboardData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState(new Date());

  // Drill-down: metric key → show a filtered ticket list inline
  type DrillKey = "total" | "open" | "closed" | "sla";
  const [drillKey,     setDrillKey]     = useState<DrillKey | null>(null);
  const [drillTickets, setDrillTickets] = useState<{ tickets: unknown[]; pagination: { total: number } } | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillPage,    setDrillPage]    = useState(1);

  const DRILL_CONFIG: Record<DrillKey, { label: string; statusParam?: string }> = {
    total:  { label: "All Tickets" },
    open:   { label: "Open Tickets",   statusParam: OPEN_STATUSES_CSV },
    closed: { label: "Closed Tickets", statusParam: "Closed,Cancelled"    },
    sla:    { label: "SLA Breaches" },
  };

  const openDrill = useCallback((key: DrillKey) => {
    setDrillKey((prev) => prev === key ? null : key);
    setDrillPage(1);
  }, []);

  useEffect(() => {
    if (!drillKey || !data?.dateRange) { setDrillTickets(null); return; }
    setDrillLoading(true);
    const cfg = DRILL_CONFIG[drillKey];
    const params = new URLSearchParams({
      from: data.dateRange.from,
      to:   data.dateRange.to,
      page: String(drillPage),
      size: "15",
    });
    if (cfg.statusParam) params.set("statuses", cfg.statusParam);
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then((d) => setDrillTickets(d as typeof drillTickets))
      .finally(() => setDrillLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillKey, drillPage, data?.dateRange]);

  const fetchData = useCallback(async (p: TimePeriod, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch(`/api/analytics/dashboard?period=${p}`);
      const json = await res.json() as DashboardData;
      setData(json);
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const toastId = toast.loading("Syncing latest tickets from SDP…");
    try {
      const startRes = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "INCREMENTAL" }),
      });
      const startData = await startRes.json() as { started?: boolean; error?: string };
      if (!startData.started && startRes.status !== 409) {
        toast.error(startData.error ?? "Failed to start sync", { id: toastId });
        return;
      }

      // Poll until complete (max 90s)
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2500));
        const s = await fetch("/api/sync").then((r) => r.json()) as { status: string };
        if (s.status === "COMPLETED" || s.status === "FAILED") {
          if (s.status === "FAILED") toast.error("Sync failed", { id: toastId });
          break;
        }
      }

      toast.success("Data refreshed", { id: toastId });
      await fetchData(period, false);
    } catch {
      toast.error("Refresh failed", { id: toastId });
    } finally {
      setRefreshing(false);
    }
  }, [period, fetchData]);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => fetchData(period, true), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [period, fetchData]);

  const kpis    = data?.kpis;
  const periodSub = useMemo(() => PERIODS.find((p) => p.key === period)?.sub ?? "", [period]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        greeting={getGreeting() + ", Talia"}
        subtitle="Here are your latest ticket analytics and support trends."
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <div className="flex-1 px-6 py-5 space-y-6">

        {/* KPI Cards — click any card to drill down into the matching ticket list */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard
            index={0} loading={loading} active={drillKey === "total"}
            title="Total Tickets"  subtitle={periodSub}
            value={kpis ? formatNumber(kpis.totalTickets) : "—"}
            icon={Ticket}          iconBg="bg-blue-100 dark:bg-blue-900/30"
            delta={kpis?.deltaTotal}
            onClick={() => openDrill("total")}
          />
          <KPICard
            index={1} loading={loading} active={drillKey === "open"}
            title="Open Tickets"   subtitle={periodSub}
            value={kpis ? formatNumber(kpis.openTickets) : "—"}
            icon={AlertTriangle}   iconBg="bg-amber-100 dark:bg-amber-900/30"
            delta={kpis?.deltaOpen}
            onClick={() => openDrill("open")}
          />
          <KPICard
            index={2} loading={loading} active={drillKey === "closed"}
            title="Closed Tickets" subtitle={periodSub}
            value={kpis ? formatNumber(kpis.closedTickets) : "—"}
            icon={CheckCircle2}    iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            delta={kpis?.deltaClosed}
            onClick={() => openDrill("closed")}
          />
          <KPICard
            index={3} loading={loading}
            title="SLA Compliance" subtitle={periodSub}
            value={kpis ? formatPercent(kpis.slaCompliance) : "—"}
            icon={ShieldCheck}     iconBg="bg-teal-100 dark:bg-teal-900/30"
            delta={kpis?.deltaSla}
          />
          <KPICard
            index={4} loading={loading}
            title="Avg Resolution" subtitle={periodSub}
            value={kpis ? `${kpis.avgResolutionTime}` : "—"}
            icon={Clock}           iconBg="bg-purple-100 dark:bg-purple-900/30"
            suffix="h"
            delta={kpis?.deltaResolution}
          />
        </div>

        {/* Drill-down panel */}
        {drillKey && (
          <div className="bg-card rounded-xl border border-brand-primary/30 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold text-foreground">
                {DRILL_CONFIG[drillKey].label}
                <span className="ml-2 text-xs font-normal text-muted-foreground">— {periodSub}</span>
              </p>
              <button onClick={() => setDrillKey(null)} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {["#", "Subject", "Status", "Group", "Agent", "Created", "Priority", "SLA"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 animate-pulse">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-3 rounded bg-muted w-16" /></td>
                        ))}
                      </tr>
                    ))
                    : (drillTickets?.tickets as { id: string; externalId: string; subject: string; status: string; priority: string; group?: { name: string }; technician?: { name: string }; createdAt: string; slaBreach: boolean }[] ?? []).map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">#{t.externalId}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[t.status] ?? "bg-muted text-muted-foreground")}>
                            {STATUS_LABELS[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{t.group?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{t.technician?.name ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(t.createdAt, "MMM d, yyyy")}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={cn("text-xs px-2 py-0.5 rounded", PRIORITY_COLORS[t.priority] ?? "")}>
                            {PRIORITY_LABELS[t.priority] ?? t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {t.slaBreach
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-raspberry-100 text-raspberry-700 font-medium">Breach</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            {/* Drill-down pagination */}
            {(drillTickets?.pagination as { total: number; pages: number } | undefined) && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
                <span>{(drillTickets!.pagination as { total: number }).total.toLocaleString()} tickets</span>
                <div className="flex gap-1">
                  <button onClick={() => setDrillPage((p) => Math.max(1, p - 1))} disabled={drillPage <= 1}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                    <ChevronLeft size={12}/>
                  </button>
                  <button onClick={() => setDrillPage((p) => p + 1)}
                    disabled={(drillTickets!.pagination as { pages: number }).pages <= drillPage}
                    className="p-1 rounded border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                    <ChevronRight size={12}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live snapshot — all tickets by current status, no date filter */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Live Queue — All Tickets by Current Status</p>
          {loading ? (
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(data?.snapshot ?? {})
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium bg-muted/50 text-foreground">
                    <span className="font-bold text-brand-primary">{count.toLocaleString()}</span>
                    {status}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                period === key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ticket Volume Trends</h3>
            <TicketVolumeChart data={data?.trends ?? []} loading={loading} />
          </div>
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Tickets by Status</h3>
            <TicketsByStatus data={data?.statusBreakdown ?? { open: 0, inProgress: 0, onHold: 0, resolved: 0, closed: 0 }} loading={loading} />
          </div>
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance by Group</h3>
            <PerformanceTable data={data?.groupPerformance ?? []} loading={loading} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Tickets by Category</h3>
            <TicketsByCategory data={data?.categoryBreakdown ?? []} loading={loading} />
          </div>
        </div>

        {/* Activity + Agents row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <a href="/tickets" className="text-xs text-brand-secondary hover:underline">View all</a>
            </div>
            <RecentActivity data={data?.recentTickets ?? []} loading={loading} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Top Agents This Month</h3>
              <a href="/analytics" className="text-xs text-brand-secondary hover:underline">View all</a>
            </div>
            <TopAgents data={data?.technicianPerformance ?? []} loading={loading} />
          </div>
        </div>
      </div>

      <DashboardFooter
        updatedAt={updatedAt}
        dateRange={data?.dateRange ?? { from: new Date().toISOString(), to: new Date().toISOString() }}
        autoRefresh
      />

      {/* Floating AI chatbot */}
      <ChatWidget />
    </div>
  );
}
