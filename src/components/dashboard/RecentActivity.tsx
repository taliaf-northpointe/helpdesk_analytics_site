"use client";

import { cn, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, formatRelative } from "@/lib/utils";
import type { RecentTicket } from "@/types";
import { AlertTriangle } from "lucide-react";

interface Props {
  data:     RecentTicket[];
  loading?: boolean;
}

export function RecentActivity({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.map((ticket) => (
        <div
          key={ticket.id}
          className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {ticket.slaBreach && (
                <AlertTriangle size={12} className="text-red-500 shrink-0" />
              )}
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                #{ticket.externalId.replace("sdp-", "")} — {ticket.subject}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ticket.group} · {ticket.technician} · {formatRelative(ticket.updatedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_COLORS[ticket.status])}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded", PRIORITY_COLORS[ticket.priority])}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
