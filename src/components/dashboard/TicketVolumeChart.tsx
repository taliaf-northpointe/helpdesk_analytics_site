"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { TrendPoint } from "@/types";

interface Props {
  data: TrendPoint[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-card-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function TicketVolumeChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="animate-pulse h-64 bg-muted rounded-lg" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
        />
        <Bar dataKey="count"  name="Total"   fill="#2C4A6E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="closed" name="Closed"  fill="#4A9BB8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
