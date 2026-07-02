"use client";

import { cn } from "@/lib/utils";
import { useSortableData, type SortAccessor } from "@/lib/useSortableData";
import { SortableHeader } from "@/components/ui/SortableHeader";
import type { GroupPerformance } from "@/types";

interface Props {
  data:     GroupPerformance[];
  loading?: boolean;
}

const ACCESSORS: Record<string, SortAccessor<GroupPerformance>> = {
  groupName:    (r) => r.groupName,
  totalTickets: (r) => r.totalTickets,
  open:         (r) => r.open,
  closed:       (r) => r.closed,
  slaPercent:   (r) => r.slaPercent,
};

function SLABadge({ value }: { value: number }) {
  const color =
    value >= 95 ? "text-emerald-600 dark:text-emerald-400" :
    value >= 90 ? "text-amber-600 dark:text-amber-400"     :
                  "text-raspberry-500 dark:text-raspberry-400";
  return <span className={cn("font-semibold tabular-nums", color)}>{value.toFixed(1)}%</span>;
}

export function PerformanceTable({ data, loading }: Props) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortableData(data, ACCESSORS, { key: "totalTickets", dir: "desc" });

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
            <SortableHeader label="Group Name" sortKey="groupName"    activeKey={sortKey} dir={sortDir} onSort={toggleSort} className="pb-2 pr-4" />
            <SortableHeader label="Total"      sortKey="totalTickets" activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" className="pb-2 px-3" />
            <SortableHeader label="Open"       sortKey="open"         activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" className="pb-2 px-3" />
            <SortableHeader label="Closed"     sortKey="closed"       activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" className="pb-2 px-3" />
            <SortableHeader label="SLA %"      sortKey="slaPercent"   activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" className="pb-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={row.groupId}
              className={cn(
                "border-b border-border/50 hover:bg-muted/40 transition-colors",
                i === sorted.length - 1 && "border-0",
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
