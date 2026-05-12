"use client";

import { cn } from "@/lib/utils";
import type { GroupPerformance } from "@/types";

interface Props {
  data:     GroupPerformance[];
  loading?: boolean;
}

function SLABadge({ value }: { value: number }) {
  const color =
    value >= 95 ? "text-emerald-600 dark:text-emerald-400" :
    value >= 90 ? "text-amber-600 dark:text-amber-400"     :
                  "text-red-500   dark:text-red-400";
  return <span className={cn("font-semibold tabular-nums", color)}>{value.toFixed(1)}%</span>;
}

export function PerformanceTable({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Group Name</th>
            <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Total</th>
            <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Open</th>
            <th className="pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Closed</th>
            <th className="pb-2 pl-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">SLA %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.groupId}
              className={cn(
                "border-b border-border/50 hover:bg-muted/40 transition-colors",
                i === data.length - 1 && "border-0",
              )}
            >
              <td className="py-3 pr-4 font-medium text-foreground">{row.groupName}</td>
              <td className="py-3 px-3 text-right tabular-nums text-foreground">{row.totalTickets.toLocaleString()}</td>
              <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">{row.open.toLocaleString()}</td>
              <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">{row.closed.toLocaleString()}</td>
              <td className="py-3 pl-3 text-right"><SLABadge value={row.slaPercent} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
