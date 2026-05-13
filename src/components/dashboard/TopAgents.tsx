"use client";

import { cn } from "@/lib/utils";
import type { TechnicianPerformance } from "@/types";

interface Props {
  data:     TechnicianPerformance[];
  loading?: boolean;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors   = ["bg-blue-100 text-blue-700","bg-emerald-100 text-emerald-700","bg-amber-100 text-amber-700","bg-purple-100 text-purple-700","bg-rose-100 text-rose-700"];
  const idx      = name.charCodeAt(0) % colors.length;
  return (
    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0", colors[idx])}>
      {initials}
    </div>
  );
}

export function TopAgents({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-16 rounded bg-muted" />
            </div>
            <div className="h-4 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 pb-1 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Resolved</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Avg. Res.</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">SLA %</span>
      </div>
      {data.map((agent) => (
        <div key={agent.technicianId} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center hover:bg-muted/40 rounded-lg px-1 py-0.5 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={agent.technicianName} />
            <span className="text-sm font-medium text-foreground truncate">{agent.technicianName}</span>
          </div>
          <span className="text-sm tabular-nums text-foreground text-right">{agent.resolved}</span>
          <span className="text-sm tabular-nums text-muted-foreground text-right">{agent.avgResolutionHours}h</span>
          <span className={cn(
            "text-sm font-semibold tabular-nums text-right",
            agent.slaPercent >= 95 ? "text-emerald-600 dark:text-emerald-400" :
            agent.slaPercent >= 90 ? "text-amber-600 dark:text-amber-400" :
                                      "text-raspberry-500",
          )}>
            {agent.slaPercent.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
