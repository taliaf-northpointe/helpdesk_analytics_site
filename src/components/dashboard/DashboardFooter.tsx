"use client";

import { formatDate } from "@/lib/utils";
import { Download, FileText, Printer, Share2, Circle } from "lucide-react";

interface Props {
  updatedAt: Date | string;
  dateRange: { from: string; to: string };
  autoRefresh?: boolean;
}

export function DashboardFooter({ updatedAt, dateRange, autoRefresh = true }: Props) {
  const fromLabel = formatDate(dateRange.from, "MMM d");
  const toLabel   = formatDate(dateRange.to,   "MMM d, yyyy");

  const handleExportCSV = () => { alert("Export CSV – connect to /api/analytics/export"); };
  const handlePDFReport = () => { window.print(); };

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-border bg-background/80 backdrop-blur-sm text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>Last updated: {formatDate(updatedAt, "MMM d, yyyy 'at' h:mm a")}</span>
        <span className="flex items-center gap-1.5">
          <Circle size={8} className={autoRefresh ? "fill-emerald-500 text-emerald-500" : "fill-gray-400 text-gray-400"} />
          Auto-refresh: {autoRefresh ? "ON" : "OFF"}
        </span>
        <span>Showing data: {fromLabel} – {toLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
          <Download size={13} /> Export CSV
        </button>
        <button onClick={handlePDFReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
          <FileText size={13} /> PDF Report
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
          <Printer size={13} /> Print
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-primary text-white hover:bg-brand-primary-light transition-colors">
          <Share2 size={13} /> Share
        </button>
      </div>
    </footer>
  );
}
