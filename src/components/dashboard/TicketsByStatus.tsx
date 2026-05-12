"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StatusBreakdown } from "@/types";

const STATUS_CHART_COLORS: Record<string, string> = {
  "Open":                          "#3B82F6",
  "Pending Requester Response":    "#D97706",
  "On Hold / Waiting for Vendor":  "#F97316",
  "Closed":                        "#64748B",
  "Cancelled":                     "#EF4444",
  "Awaiting CAB":                  "#7C3AED",
  "Awaiting Peer Review":          "#14B8A6",
  "Awaiting prod sign-off":        "#22C55E",
  "Awaiting Vendor Action":        "#FB7185",
};

interface Props {
  data: StatusBreakdown;
  loading?: boolean;
}

export function TicketsByStatus({ data, loading }: Props) {
  if (loading) return <div className="animate-pulse h-52 bg-muted rounded-lg" />;

  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_CHART_COLORS[entry.name] ?? "#94A3B8"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
