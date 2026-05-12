"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StatusBreakdown } from "@/types";

const STATUS_COLORS = {
  Open:        "#3B82F6",
  "In Progress":"#F59E0B",
  "On Hold":   "#8B5CF6",
  Resolved:    "#10B981",
  Closed:      "#6B7280",
};

interface Props {
  data: StatusBreakdown;
  loading?: boolean;
}

export function TicketsByStatus({ data, loading }: Props) {
  if (loading) return <div className="animate-pulse h-52 bg-muted rounded-lg" />;

  const chartData = [
    { name: "Open",        value: data.open },
    { name: "In Progress", value: data.inProgress },
    { name: "On Hold",     value: data.onHold },
    { name: "Resolved",    value: data.resolved },
    { name: "Closed",      value: data.closed },
  ].filter((d) => d.value > 0);

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
              fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ?? "#94A3B8"}
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
