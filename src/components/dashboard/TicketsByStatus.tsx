"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StatusBreakdown } from "@/types";

// Blue theme — distinct semantic colors per status
const STATUS_COLORS_BLUE: Record<string, string> = {
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

// Pink theme — very distinct shades of pink; Closed stays gray
const STATUS_COLORS_PINK: Record<string, string> = {
  "Open":                          "#DB7093", // palevioletred — brand primary
  "Pending Requester Response":    "#F48FB1", // light pink
  "On Hold / Waiting for Vendor":  "#C2185B", // deep rose
  "Closed":                        "#94A3B8", // gray
  "Cancelled":                     "#880E4F", // dark wine rose
  "Awaiting CAB":                  "#E91E63", // hot pink
  "Awaiting Peer Review":          "#F8BBD0", // blush / palest pink
  "Awaiting prod sign-off":        "#AD1457", // magenta rose
  "Awaiting Vendor Action":        "#FFA6C9", // soft pastel pink
};

interface Props {
  data: StatusBreakdown;
  loading?: boolean;
}

export function TicketsByStatus({ data, loading }: Props) {
  const [colors, setColors] = useState(STATUS_COLORS_BLUE);

  useEffect(() => {
    const update = () =>
      setColors(document.documentElement.classList.contains("theme-pink")
        ? STATUS_COLORS_PINK
        : STATUS_COLORS_BLUE);
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

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
              fill={colors[entry.name] ?? "#94A3B8"}
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
