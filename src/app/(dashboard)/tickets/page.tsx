"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
import { cn, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate } from "@/lib/utils";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Ticket {
  id: string;
  externalId: string;
  displayId?: string | null;
  subject: string;
  status: string;
  priority: string;
  group?: { name: string } | null;
  technician?: { name: string } | null;
  category?: { name: string } | null;
  createdAt: string;
  slaBreach: boolean;
}

interface TicketsResponse {
  tickets: Ticket[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
}

const STATUS_OPTIONS = [
  "",
  "Open",
  "Pending Requester Response",
  "On Hold / Waiting for Vendor",
  "Closed",
  "Cancelled",
  "Awaiting CAB",
  "Awaiting Peer Review",
  "Awaiting prod sign-off",
  "Awaiting Vendor Action",
];
const PRIORITY_OPTIONS = ["", "URGENT", "HIGH", "MEDIUM", "LOW"];

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [data,     setData]     = useState<TicketsResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [search,     setSearch]     = useState(() => searchParams.get("q") ?? "");
  const [status,     setStatus]     = useState("");
  const [priority,   setPriority]   = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync URL ?q= param into state (handles header search when already on this page)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
    setPage(1);
  }, [searchParams]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "25" });
      if (search)   params.set("q",        search);
      if (status)   params.set("status",   status);
      if (priority) params.set("priority", priority);
      const res  = await fetch(`/api/tickets?${params}`);
      const json = await res.json() as TicketsResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const pagination = data?.pagination;

  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="Tickets" subtitle="Browse, filter, and search all help desk tickets." />

      <div className="flex-1 px-6 py-5 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tickets…"
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.slice(1).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.slice(1).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <div className="ml-auto text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} tickets` : ""}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {["ID", "Subject", "Status", "Priority", "Group", "Technician", "Category", "Created", "SLA"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50 animate-pulse">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 rounded bg-muted w-20" /></td>
                      ))}
                    </tr>
                  ))
                  : data?.tickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => setSelectedId(ticket.id)} className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">#{ticket.displayId ?? ticket.externalId.replace("sdp-", "")}</td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{ticket.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[ticket.status])}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded", PRIORITY_COLORS[ticket.priority])}>
                          {PRIORITY_LABELS[ticket.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ticket.group?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ticket.technician?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{ticket.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(ticket.createdAt, "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ticket.slaBreach
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">Breach</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">OK</span>
                        }
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page <= 1}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p+1))} disabled={page >= pagination.pages}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatWidget />

      <TicketDetailPanel ticketId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
