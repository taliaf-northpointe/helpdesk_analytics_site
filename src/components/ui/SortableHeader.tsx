"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/useSortableData";

interface Props {
  label:     string;
  sortKey:   string;
  activeKey: string | null;
  dir:       SortDir;
  onSort:    (key: string) => void;
  align?:    "left" | "right" | "center";
  className?: string;
}

/** A clickable table header cell that shows the current sort state via an arrow icon. */
export function SortableHeader({ label, sortKey, activeKey, dir, onSort, align = "left", className }: Props) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right"  && "flex-row-reverse",
          align === "center" && "justify-center",
        )}
      >
        {label}
        <Icon size={11} className={active ? "text-brand-primary" : "opacity-40"} />
      </span>
    </th>
  );
}
