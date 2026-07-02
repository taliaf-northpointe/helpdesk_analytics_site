"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useSortableData, type SortAccessor } from "@/lib/useSortableData";
import { SortableHeader } from "@/components/ui/SortableHeader";
import type { CategoryBreakdown } from "@/types";

interface Props {
  data:     CategoryBreakdown[];
  loading?: boolean;
}

const TREND_RANK: Record<string, number> = { down: 0, flat: 1, up: 2 };

const ACCESSORS: Record<string, SortAccessor<CategoryBreakdown>> = {
  categoryName: (c) => c.categoryName,
  subcategory:  (c) => c.subcategories[0]?.name ?? "",
  count:        (c) => c.count,
  trend:        (c) => TREND_RANK[c.trend] ?? 1,
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) => {
  if (trend === "up")   return <TrendingUp  size={14} className="text-emerald-500" />;
  if (trend === "down") return <TrendingDown size={14} className="text-raspberry-500" />;
  return <Minus size={14} className="text-muted-foreground" />;
};

export function TicketsByCategory({ data, loading }: Props) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortableData(data, ACCESSORS, { key: "count", dir: "desc" });

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
            <SortableHeader label="Category"    sortKey="categoryName" activeKey={sortKey} dir={sortDir} onSort={toggleSort} className="pb-2 pr-4" />
            <SortableHeader label="Subcategory" sortKey="subcategory"  activeKey={sortKey} dir={sortDir} onSort={toggleSort} className="pb-2 px-3" />
            <SortableHeader label="Count"       sortKey="count"        activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="right"  className="pb-2 px-3" />
            <SortableHeader label="Trend"       sortKey="trend"        activeKey={sortKey} dir={sortDir} onSort={toggleSort} align="center" className="pb-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((cat, i) => (
            <tr
              key={cat.categoryId}
              className="border-b border-border/50 hover:bg-muted/40 transition-colors"
            >
              <td className="py-3 pr-4 font-medium text-foreground">{cat.categoryName}</td>
              <td className="py-3 px-3 text-muted-foreground text-xs">
                {cat.subcategories.slice(0, 2).map((s) => s.name).join(", ")}
              </td>
              <td className="py-3 px-3 text-right tabular-nums font-medium text-foreground">
                {cat.count.toLocaleString()}
              </td>
              <td className="py-3 pl-3 text-center">
                <div className="flex justify-center">
                  <TrendIcon trend={cat.trend} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
