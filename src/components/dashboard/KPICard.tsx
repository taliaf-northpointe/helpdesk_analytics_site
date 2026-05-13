"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title:     string;
  subtitle?: string;      // e.g. "Created today" — clarifies date scope
  value:     string | number;
  delta?:    number;      // % change vs previous period
  icon:      LucideIcon;
  iconBg?:   string;
  suffix?:   string;
  loading?:  boolean;
  index?:    number;      // for stagger animation
  onClick?:  () => void;
  active?:   boolean;     // highlighted when drill-down is open
}

export function KPICard({ title, subtitle, value, delta, icon: Icon, iconBg, suffix, loading, index = 0, onClick, active }: KPICardProps) {
  const isPositive = (delta ?? 0) > 0;
  const isNegative = (delta ?? 0) < 0;
  const hasDelta   = delta !== undefined && delta !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border p-5 shadow-card transition-colors",
        onClick ? "cursor-pointer hover:border-brand-primary/50" : "card-hover",
        active ? "border-brand-primary ring-1 ring-brand-primary/30" : "border-border",
      )}
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-8 rounded-lg bg-muted" />
          </div>
          <div className="h-8 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              {subtitle && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
            </div>
            <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", iconBg ?? "bg-primary/10")}>
              <Icon size={18} className="text-primary" />
            </div>
          </div>

          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold text-foreground tabular-nums">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground mb-1">{suffix}</span>}
          </div>

          {hasDelta && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "",
              isNegative ? "text-raspberry-500 dark:text-raspberry-400" : "",
              !isPositive && !isNegative ? "text-muted-foreground" : "",
            )}>
              {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span>{isPositive ? "+" : ""}{delta?.toFixed(1)}% vs prev. period</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
