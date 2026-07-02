"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type SortAccessor<T> = (row: T) => string | number | boolean | null | undefined;

/**
 * Client-side table sorting. Pass the rows and a map of column-key -> value accessor.
 * Returns the sorted rows plus the current sort state and a toggle handler for headers.
 * Clicking the active column flips direction; clicking a new column sorts it ascending.
 * Nullish values always sort last regardless of direction.
 */
export function useSortableData<T>(
  rows: T[],
  accessors: Record<string, SortAccessor<T>>,
  initial: { key: string; dir: SortDir } | null = null,
) {
  const [sortKey, setSortKey] = useState<string | null>(initial?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(initial?.dir ?? "asc");

  const sorted = useMemo(() => {
    const acc = sortKey ? accessors[sortKey] : undefined;
    if (!acc) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
    // accessors is treated as stable (define it at module scope); re-sort on data/sort changes only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggleSort };
}
