"use client";

import { useState, useEffect } from "react";
import { X, Clock, Shield, User, Users, Tag, Calendar, ExternalLink } from "lucide-react";
import { cn, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate, sdpTicketUrl } from "@/lib/utils";

interface SdpNote {
  id: string;
  description?: string;
  created_time?: { value: string; display_value?: string };
  created_by?: { name: string };
  show_to_requester?: boolean;
}

interface TicketDetail {
  ticket: {
    id: string;
    externalId: string;
    displayId: string | null;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    resolvedAt: string | null;
    closedAt: string | null;
    dueDate: string | null;
    slaBreach: boolean;
    group: { name: string } | null;
    technician: { name: string } | null;
    category: { name: string } | null;
    subcategory: { name: string } | null;
    sla: { name: string } | null;
  };
  description: string | null;
  notes: SdpNote[];
}

interface Props {
  ticketId: string | null;
  onClose: () => void;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function noteTime(note: SdpNote): string {
  if (note.created_time?.display_value) return note.created_time.display_value;
  if (note.created_time?.value) {
    const ms = parseInt(note.created_time.value, 10);
    if (!isNaN(ms)) return formatDate(new Date(ms).toISOString(), "MMM d, yyyy h:mm a");
  }
  return "";
}

export function TicketDetailPanel({ ticketId, onClose }: Props) {
  const [data,    setData]    = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!ticketId) { setData(null); return; }
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((d) => setData(d as TicketDetail))
      .catch(() => setError("Failed to load ticket details."))
      .finally(() => setLoading(false));
  }, [ticketId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isOpen = ticketId !== null;

  const meta = data ? [
    { icon: Users,    label: "Group",       value: data.ticket.group?.name },
    { icon: User,     label: "Technician",  value: data.ticket.technician?.name },
    { icon: Tag,      label: "Category",    value: data.ticket.category?.name },
    { icon: Tag,      label: "Subcategory", value: data.ticket.subcategory?.name },
    { icon: Shield,   label: "SLA",         value: data.ticket.sla?.name },
    { icon: Calendar, label: "Created",     value: formatDate(data.ticket.createdAt, "MMM d, yyyy 'at' h:mm a") },
    { icon: Clock,    label: "Due",         value: data.ticket.dueDate ? formatDate(data.ticket.dueDate, "MMM d, yyyy") : null },
    { icon: Calendar, label: "Resolved",    value: data.ticket.resolvedAt ? formatDate(data.ticket.resolvedAt, "MMM d, yyyy") : null },
  ].filter((r) => r.value) : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[520px] bg-card border-l border-border shadow-2xl z-40",
          "flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            {data ? (
              <a
                href={sdpTicketUrl(data.ticket.externalId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-brand-primary transition-colors"
              >
                #{data.ticket.displayId ?? data.ticket.externalId}
                <ExternalLink size={11} />
              </a>
            ) : (
              <p className="text-xs font-mono text-muted-foreground">#…</p>
            )}
            <h2 className="text-sm font-semibold text-foreground mt-0.5 leading-snug line-clamp-2">
              {loading
                ? <span className="inline-block h-4 w-56 rounded bg-muted animate-pulse" />
                : (data?.ticket.subject ?? "Loading…")}
            </h2>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors mt-0.5">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Open in SDP */}
        {data && (
          <div className="px-5 py-3 border-b border-border shrink-0">
            <a
              href={sdpTicketUrl(data.ticket.externalId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary-dark transition-colors"
            >
              <ExternalLink size={14} />
              Open in ServiceDesk Plus
            </a>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-5 space-y-3">
              {[80, 60, 72, 55, 65, 50].map((w, i) => (
                <div key={i} className="h-3.5 rounded bg-muted animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {error && (
            <div className="p-5 text-sm text-destructive">{error}</div>
          )}

          {!loading && !error && data && (
            <>
              {/* Badges */}
              <div className="px-5 py-3.5 border-b border-border flex flex-wrap gap-2">
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", STATUS_COLORS[data.ticket.status])}>
                  {STATUS_LABELS[data.ticket.status]}
                </span>
                <span className={cn("text-xs px-2.5 py-1 rounded font-medium", PRIORITY_COLORS[data.ticket.priority])}>
                  {PRIORITY_LABELS[data.ticket.priority]}
                </span>
                {data.ticket.slaBreach
                  ? <span className="text-xs px-2.5 py-1 rounded-full bg-raspberry-100 text-raspberry-700 dark:bg-raspberry-900/30 dark:text-raspberry-400 font-medium">SLA Breach</span>
                  : <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">SLA OK</span>
                }
              </div>

              {/* Metadata */}
              <div className="px-5 py-4 border-b border-border space-y-2.5">
                {meta.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5 text-sm">
                    <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground shrink-0 w-20">{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {data.description && (
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Description</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {stripHtml(data.description)}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Notes & Conversation{data.notes.length > 0 ? ` (${data.notes.length})` : ""}
                </p>
                {data.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No notes on this ticket.</p>
                ) : (
                  <div className="space-y-3">
                    {data.notes.map((note) => (
                      <div key={note.id} className="rounded-lg border border-border bg-muted/30 p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-foreground">
                            {note.created_by?.name ?? "Unknown"}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {!note.show_to_requester && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                                Private
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">{noteTime(note)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                          {note.description ? stripHtml(note.description) : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
