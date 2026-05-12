"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { TicketVolumeChart } from "@/components/dashboard/TicketVolumeChart";
import { TopAgents } from "@/components/dashboard/TopAgents";
import { TicketsByCategory } from "@/components/dashboard/TicketsByCategory";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DashboardData, TimePeriod } from "@/types";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "today",      label: "Today"        },
  { key: "weekly",     label: "This Week"    },
  { key: "monthly",    label: "This Month"   },
  { key: "last_month", label: "Last Month"   },
  { key: "quarterly",  label: "This Quarter" },
  { key: "yearly",     label: "This Year"    },
];

export default function AnalyticsPage() {
  const [period,  setPeriod]  = useState<TimePeriod>("monthly");
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: TimePeriod) => {
    setLoading(true);
    const res  = await fetch(`/api/analytics/dashboard?period=${p}`);
    const json = await res.json() as DashboardData;
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  const priorityData = data ? [
    { name: "Low",    count: data.priorityBreakdown.low,    fill: "#94A3B8" },
    { name: "Medium", count: data.priorityBreakdown.medium, fill: "#3B82F6" },
    { name: "High",   count: data.priorityBreakdown.high,   fill: "#F59E0B" },
    { name: "Urgent", count: data.priorityBreakdown.urgent, fill: "#EF4444" },
  ] : [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header greeting="Analytics" subtitle="Deep-dive reporting and trend analysis." />

      <div className="flex-1 px-6 py-5 space-y-6">
        {/* Period tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                period === key ? "border-brand-primary text-brand-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ticket Volume Trend</h3>
            <TicketVolumeChart data={data?.trends ?? []} loading={loading} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Tickets by Priority</h3>
            {loading ? (
              <div className="animate-pulse h-64 bg-muted rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={priorityData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Tickets" radius={[4,4,0,0]}
                    fill="currentColor"
                    // Per-bar fill via Cell is cleaner but inline here for brevity
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Tickets by Category</h3>
            <TicketsByCategory data={data?.categoryBreakdown ?? []} loading={loading} />
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top Performing Agents</h3>
            <TopAgents data={data?.technicianPerformance ?? []} loading={loading} />
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}
