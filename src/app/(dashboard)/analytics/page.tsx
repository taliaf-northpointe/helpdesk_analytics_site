"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { cn, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, formatDate } from "@/lib/utils";
import { Search, X, AlertTriangle, Clock, ShieldAlert, Ticket, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSortableData, type SortAccessor } from "@/lib/useSortableData";
import { SortableHeader } from "@/components/ui/SortableHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveTicket {
  id: string;
  externalId: string;
  subject: string;
  status: string;
  priority: string;
  group: string;
  technician: string;
  category: string;
  createdAt: string;
  slaBreach: boolean;
  ageDays: number;
}

interface LiveData {
  totalOpen: number;
  urgentOpen: number;
  slaBreaching: number;
  oldestAgeDays: number;
  byStatus: { status: string; count: number }[];
  byGroup:  { name: string;   count: number }[];
  byAgent:  { name: string;   count: number }[];
  tickets: LiveTicket[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AGE_COLOR = (days: number) =>
  days >= 30 ? "text-raspberry-600 font-semibold"
  : days >= 14 ? "text-amber-600 font-medium"
  : "text-muted-foreground";

const PRIORITY_RANK: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const TICKET_ACCESSORS: Record<string, SortAccessor<LiveTicket>> = {
  externalId: (t) => t.externalId,
  subject:    (t) => t.subject,
  status:     (t) => t.status,
  group:      (t) => t.group,
  technician: (t) => t.technician,
  category:   (t) => t.category,
  createdAt:  (t) => t.createdAt,
  ageDays:    (t) => t.ageDays,
  priority:   (t) => PRIORITY_RANK[t.priority] ?? 0,
  slaBreach:  (t) => (t.slaBreach ? 1 : 0),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveQueuePage() {
  const [data,         setData]         = useState<LiveData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterGroup,  setFilterGroup]  = useState<string | null>(null);
  const [filterAgent,  setFilterAgent]  = useState<string | null>(null);
  const [search,       setSearch]       = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch("/api/analytics/live");
      const json = await res.json() as LiveData;
      setData(json);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filteredTickets = useMemo(() => {
    if (!data) return [];
    return data.tickets.filter((t) => {
      if (filterStatus && t.status    !== filterStatus) return false;
      if (filterGroup  && t.group     !== filterGroup)  return false;
      if (filterAgent  && t.technician !== filterAgent) return false;
      if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, filterStatus, filterGroup, filterAgent, search]);

  const { sorted: sortedTickets, sortKey, sortDir, toggleSort } = useSortableData(filteredTickets, TICKET_ACCESSORS);

  const hasFilters = !!(filterStatus || filterGroup || filterAgent || search);

  const toggle = <T extends string>(val: T, curr: T | null, set: (v: T | null) => void) =>
    set(curr === val ? null : val);

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterGroup(null);
    setFilterAgent(null);
    setSearch("");
  };

  const chipCls = (active: boolean) => cn(
    "flex items-center justify-between gap-3 w-full px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
    active
      ? "bg-brand-primary text-white"
      : "hover:bg-muted text-foreground",
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        greeting="Live Queue"
        subtitle="All currently open tickets — no matter when they were created."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
      />

      <div className="flex-1 px-6 py-5 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Open",     value: data?.totalOpen,     icon: Ticket,       bg: "bg-blue-100",   text: "text-blue-700"   },
            { label: "Urgent",         value: data?.urgentOpen,    icon: AlertTriangle, bg: "bg-raspberry-100", text: "text-raspberry-700" },
            { label: "SLA Breaching",  value: data?.slaBreaching,  icon: ShieldAlert,  bg: "bg-orange-100", text: "text-orange-700" },
            { label: "Oldest (days)",  value: data?.oldestAgeDays, icon: Clock,        bg: "bg-purple-100", text: "text-purple-700" },
          ].map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-8 w-16 rounded bg-muted" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", bg)}>
                      <Icon size={18} className={text} />
                    </div>
                  </div>
                  <span className="text-3xl font-bold text-foreground tabular-nums">{value?.toLocaleString() ?? "—"}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Last refresh + controls */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {refreshing ? "Refreshing…" : `Updated ${formatDistanceToNow(lastRefreshed, { addSuffix: true })}`}
          </span>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors disabled:opacity-50">
            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
            Refresh now
          </button>
        </div>

        {/* Breakdown panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* By Status */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Status</p>
            {loading ? <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-7 rounded bg-muted animate-pulse"/>)}</div> : (
              <ul className="space-y-0.5">
                {data?.byStatus.map(({ status, count }) => (
                  <li key={status}>
                    <button className={chipCls(filterStatus === status)}
                      onClick={() => toggle(status, filterStatus, setFilterStatus)}>
                      <span className="truncate">{status}</span>
                      <span className={cn("text-xs font-bold shrink-0", filterStatus === status ? "text-white" : "text-brand-primary")}>{count.toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* By Group */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Group</p>
            {loading ? <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-7 rounded bg-muted animate-pulse"/>)}</div> : (
              <ul className="space-y-0.5 max-h-64 overflow-y-auto">
                {data?.byGroup.map(({ name, count }) => (
                  <li key={name}>
                    <button className={chipCls(filterGroup === name)}
                      onClick={() => toggle(name, filterGroup, setFilterGroup)}>
                      <span className="truncate">{name}</span>
                      <span className={cn("text-xs font-bold shrink-0", filterGroup === name ? "text-white" : "text-brand-primary")}>{count.toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* By Agent */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Agent</p>
            {loading ? <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-7 rounded bg-muted animate-pulse"/>)}</div> : (
              <ul className="space-y-0.5 max-h-64 overflow-y-auto">
                {data?.byAgent.map(({ name, count }) => (
                  <li key={name}>
                    <button className={chipCls(filterAgent === name)}
                      onClick={() => toggle(name, filterAgent, setFilterAgent)}>
                      <span className="truncate">{name}</span>
                      <span className={cn("text-xs font-bold shrink-0", filterAgent === name ? "text-white" : "text-brand-primary")}>{count.toLocaleString()}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-56"
            />
          </div>
          {hasFilters && (
            <>
              {filterStatus && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                  {filterStatus} <button onClick={() => setFilterStatus(null)}><X size={11}/></button>
                </span>
              )}
              {filterGroup && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                  {filterGroup} <button onClick={() => setFilterGroup(null)}><X size={11}/></button>
                </span>
              )}
              {filterAgent && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium">
                  {filterAgent} <button onClick={() => setFilterAgent(null)}><X size={11}/></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X size={11}/> Clear all
              </button>
            </>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {filteredTickets.length.toLocaleString()} {hasFilters ? "matching" : "open"} ticket{filteredTickets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Ticket table — sorted oldest-first (most urgent to close) */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {([
                    { key: "externalId", label: "#"        },
                    { key: "subject",    label: "Subject"  },
                    { key: "status",     label: "Status"   },
                    { key: "group",      label: "Group"    },
                    { key: "technician", label: "Agent"    },
                    { key: "category",   label: "Category" },
                    { key: "createdAt",  label: "Opened"   },
                    { key: "ageDays",    label: "Age"      },
                    { key: "priority",   label: "Priority" },
                    { key: "slaBreach",  label: "SLA"      },
                  ] as { key: string; label: string }[]).map(({ key, label }) => (
                    <SortableHeader
                      key={key}
                      label={label}
                      sortKey={key}
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={toggleSort}
                      className="px-4 py-3"
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50 animate-pulse">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 rounded bg-muted w-16" /></td>
                      ))}
                    </tr>
                  ))
                  : sortedTickets.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">#{t.externalId}</td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{t.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[t.status] ?? "bg-muted text-muted-foreground")}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <button className="hover:text-brand-primary transition-colors" onClick={() => toggle(t.group, filterGroup, setFilterGroup)}>
                          {t.group}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <button className="hover:text-brand-primary transition-colors" onClick={() => toggle(t.technician, filterAgent, setFilterAgent)}>
                          {t.technician}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{t.category}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(t.createdAt, "MMM d, yyyy")}</td>
                      <td className={cn("px-4 py-3 whitespace-nowrap tabular-nums", AGE_COLOR(t.ageDays))}>{t.ageDays}d</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded font-medium", PRIORITY_COLORS[t.priority] ?? "")}>
                          {PRIORITY_LABELS[t.priority] ?? t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
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
          {!loading && filteredTickets.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No open tickets match the current filters.
            </div>
          )}
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
