"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { ShieldCheck, ShieldX, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";

export default function SLAMonitorPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res  = await fetch("/api/analytics/dashboard?period=monthly");
    const json = await res.json() as DashboardData;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const compliance = data?.kpis.slaCompliance ?? 0;
  const breaches   = data?.kpis.slaBreaches   ?? 0;

  const radialData = [{ name: "SLA", value: compliance, fill: compliance >= 95 ? "#10B981" : compliance >= 90 ? "#F59E0B" : "#EF4444" }];

  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="SLA Monitor" subtitle="Real-time SLA compliance tracking across all groups and tickets." />

      <div className="flex-1 px-6 py-5 space-y-6">

        {/* Overall SLA gauge */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Overall SLA Compliance</h3>
            {loading ? (
              <div className="w-40 h-40 rounded-full bg-muted animate-pulse" />
            ) : (
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <RadialBarChart cx={80} cy={80} innerRadius={55} outerRadius={75} data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "hsl(var(--muted))" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{compliance.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "SLA Compliant",  value: data ? (data.kpis.totalTickets - breaches).toLocaleString() : "—", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
              { label: "SLA Breaches",   value: breaches.toLocaleString(), icon: ShieldX, color: "text-raspberry-600", bg: "bg-raspberry-50 dark:bg-raspberry-900/20" },
              { label: "Total Tickets",  value: data?.kpis.totalTickets.toLocaleString() ?? "—", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
              { label: "Delta vs Last Month", value: data?.kpis.deltaSla !== undefined ? `${data.kpis.deltaSla > 0 ? "+" : ""}${data.kpis.deltaSla.toFixed(1)}%` : "—", icon: TrendingUp, color: "text-brand-secondary", bg: "bg-blue-50 dark:bg-blue-900/20" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg mb-3", bg)}>
                  <Icon size={20} className={color} />
                </div>
                <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SLA by group */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">SLA Performance by Group</h3>
          {loading ? (
            <div className="space-y-3 animate-pulse">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded bg-muted" />)}</div>
          ) : (
            <div className="space-y-3">
              {data?.groupPerformance.map((g) => (
                <div key={g.groupId} className="flex items-center gap-4">
                  <span className="w-36 text-sm font-medium text-foreground shrink-0 truncate">{g.groupName}</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700",
                        g.slaPercent >= 95 ? "bg-emerald-500" : g.slaPercent >= 90 ? "bg-amber-500" : "bg-raspberry-500",
                      )}
                      style={{ width: `${g.slaPercent}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-14 text-right text-sm font-semibold tabular-nums shrink-0",
                    g.slaPercent >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                    g.slaPercent >= 90 ? "text-amber-600 dark:text-amber-400" :
                                          "text-raspberry-500",
                  )}>
                    {g.slaPercent.toFixed(1)}%
                  </span>
                  <span className="w-24 text-right text-xs text-muted-foreground shrink-0">{g.breaches} breach{g.breaches !== 1 ? "es" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
