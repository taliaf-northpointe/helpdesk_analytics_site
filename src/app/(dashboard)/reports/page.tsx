"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download, Filter, X, Ticket, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, RefreshCw,
} from "lucide-react";
import { Header }           from "@/components/layout/Header";
import { ChatWidget }       from "@/components/chatbot/ChatWidget";
import { KPICard }          from "@/components/dashboard/KPICard";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
import { TicketsByCategory } from "@/components/dashboard/TicketsByCategory";
import { TopAgents }        from "@/components/dashboard/TopAgents";
import { formatNumber, formatPercent } from "@/lib/utils";
import type { DashboardData, TimePeriod } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS: { key: TimePeriod; label: string; sub: string }[] = [
  { key: "today",        label: "Today",        sub: "created today"        },
  { key: "weekly",       label: "This Week",    sub: "created this week"    },
  { key: "monthly",      label: "This Month",   sub: "created this month"   },
  { key: "last_month",   label: "Last Month",   sub: "created last month"   },
  { key: "quarterly",    label: "This Quarter", sub: "created this quarter" },
  { key: "last_quarter", label: "Last Quarter", sub: "created last quarter" },
  { key: "yearly",       label: "This Year",    sub: "created this year"    },
  { key: "last_year",    label: "Last Year",    sub: "created last year"    },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low"    },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH",   label: "High"   },
  { value: "URGENT", label: "Urgent" },
];

const STATUSES = [
  { value: "Open",                          label: "Open"                          },
  { value: "Pending Requester Response",    label: "Pending Requester Response"    },
  { value: "On Hold / Waiting for Vendor",  label: "On Hold / Waiting for Vendor"  },
  { value: "Closed",                        label: "Closed"                        },
  { value: "Cancelled",                     label: "Cancelled"                     },
  { value: "Awaiting CAB",                  label: "Awaiting CAB"                  },
  { value: "Awaiting Peer Review",          label: "Awaiting Peer Review"          },
  { value: "Awaiting prod sign-off",        label: "Awaiting prod sign-off"        },
  { value: "Awaiting Vendor Action",        label: "Awaiting Vendor Action"        },
];

interface FilterOptions {
  groups:       string[];
  technicians:  string[];
  categories:   string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period,        setPeriod]        = useState<TimePeriod>("monthly");
  const [data,          setData]          = useState<DashboardData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ groups: [], technicians: [], categories: [] });

  const [groupFilter,    setGroupFilter]    = useState("");
  const [techFilter,     setTechFilter]     = useState("");
  const [catFilter,      setCatFilter]      = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter,   setStatusFilter]   = useState<string[]>([]);

  const hasFilters = !!(groupFilter || techFilter || catFilter || priorityFilter.length || statusFilter.length);

  // Fetch filter dropdown options once
  useEffect(() => {
    fetch("/api/analytics/filters")
      .then((r) => r.json())
      .then(setFilterOptions)
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ period, techLimit: "all" });
    if (groupFilter)          params.set("group",       groupFilter);
    if (techFilter)           params.set("technician",  techFilter);
    if (catFilter)            params.set("category",    catFilter);
    if (priorityFilter.length) params.set("priorities", priorityFilter.join(","));
    if (statusFilter.length)  params.set("statuses",    statusFilter.join(","));

    try {
      const res = await fetch(`/api/analytics/dashboard?${params}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, groupFilter, techFilter, catFilter, priorityFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setGroupFilter("");
    setTechFilter("");
    setCatFilter("");
    setPriorityFilter([]);
    setStatusFilter([]);
  };

  const toggleMulti = (value: string, arr: string[], set: (v: string[]) => void) => {
    set(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const exportCSV = () => {
    if (!data) return;

    const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? period;
    const rows: (string | number)[][] = [];

    rows.push([`Report: ${periodLabel}`, `Generated: ${new Date().toLocaleString()}`]);
    rows.push([]);

    rows.push(["=== KPI Summary ==="]);
    rows.push(["Total Tickets", "Open", "In Progress", "Resolved", "Closed", "SLA %", "Avg Resolution (h)"]);
    rows.push([
      data.kpis.totalTickets, data.kpis.openTickets, data.kpis.inProgressTickets,
      data.kpis.resolvedTickets, data.kpis.closedTickets,
      data.kpis.slaCompliance, data.kpis.avgResolutionTime,
    ]);
    rows.push([]);

    rows.push(["=== Group Performance ==="]);
    rows.push(["Group", "Total", "Open", "Closed", "SLA %", "Avg Resolution (h)"]);
    for (const g of data.groupPerformance) {
      rows.push([g.groupName, g.totalTickets, g.open, g.closed, g.slaPercent, g.avgResolutionHours]);
    }
    rows.push([]);

    rows.push(["=== Technician Performance ==="]);
    rows.push(["Technician", "Resolved", "Open", "SLA %", "Avg Resolution (h)"]);
    for (const t of data.technicianPerformance) {
      rows.push([t.technicianName, t.resolved, t.open, t.slaPercent, t.avgResolutionHours]);
    }
    rows.push([]);

    rows.push(["=== Category Breakdown ==="]);
    rows.push(["Category", "Count", "Trend"]);
    for (const c of data.categoryBreakdown) {
      rows.push([c.categoryName, c.count, c.trend]);
    }

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `helpdesk-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis      = data?.kpis;
  const periodSub = PERIODS.find((p) => p.key === period)?.sub ?? "";
  const selectCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors";

  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="Reports" subtitle="Filter, analyze, and export your helpdesk data." />

      <div className="flex-1 px-6 py-5 space-y-5">

        {/* Period tabs + action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 border-b border-border flex-1 min-w-0">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  period === key
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 pb-[2px]">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              disabled={!data || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-light transition-colors disabled:opacity-50"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

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

        {/* Filter panel */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter size={14} className="text-muted-foreground" />
              Filters
              {hasFilters && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-brand-primary text-white text-xs font-bold leading-none">
                  {[groupFilter, techFilter, catFilter, ...priorityFilter, ...statusFilter].filter(Boolean).length}
                </span>
              )}
            </span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Dropdowns row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Group</label>
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className={selectCls}>
                <option value="">All Groups</option>
                {filterOptions.groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Technician</label>
              <select value={techFilter} onChange={(e) => setTechFilter(e.target.value)} className={selectCls}>
                <option value="">All Technicians</option>
                {filterOptions.technicians.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={selectCls}>
                <option value="">All Categories</option>
                {filterOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle rows */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleMulti(value, priorityFilter, setPriorityFilter)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      priorityFilter.includes(value)
                        ? "bg-brand-primary text-white shadow-sm"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleMulti(value, statusFilter, setStatusFilter)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      statusFilter.includes(value)
                        ? "bg-brand-primary text-white shadow-sm"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard index={0} loading={loading} title="Total Tickets"   subtitle={periodSub} value={kpis ? formatNumber(kpis.totalTickets)     : "—"} icon={Ticket}        iconBg="bg-blue-100 dark:bg-blue-900/30"       delta={kpis?.deltaTotal}      />
          <KPICard index={1} loading={loading} title="Open Tickets"    subtitle={periodSub} value={kpis ? formatNumber(kpis.openTickets)      : "—"} icon={AlertTriangle}  iconBg="bg-amber-100 dark:bg-amber-900/30"     delta={kpis?.deltaOpen}       />
          <KPICard index={2} loading={loading} title="Closed Tickets"  subtitle={periodSub} value={kpis ? formatNumber(kpis.closedTickets)    : "—"} icon={CheckCircle2}   iconBg="bg-emerald-100 dark:bg-emerald-900/30" delta={kpis?.deltaClosed}      />
          <KPICard index={3} loading={loading} title="SLA Compliance"  subtitle={periodSub} value={kpis ? formatPercent(kpis.slaCompliance)   : "—"} icon={ShieldCheck}    iconBg="bg-teal-100 dark:bg-teal-900/30"       delta={kpis?.deltaSla}        />
          <KPICard index={4} loading={loading} title="Avg Resolution"  subtitle={periodSub} value={kpis ? `${kpis.avgResolutionTime}`         : "—"} icon={Clock}          iconBg="bg-purple-100 dark:bg-purple-900/30"   delta={kpis?.deltaResolution} suffix="h" />
        </div>

        {/* Group + Technician tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance by Group</h3>
            <PerformanceTable data={data?.groupPerformance ?? []} loading={loading} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Technician Performance</h3>
            <TopAgents data={data?.technicianPerformance ?? []} loading={loading} />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
          <TicketsByCategory data={data?.categoryBreakdown ?? []} loading={loading} />
        </div>

      </div>

      <ChatWidget />
    </div>
  );
}
