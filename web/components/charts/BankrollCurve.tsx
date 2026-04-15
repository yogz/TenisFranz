"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BankrollCurve({
  data,
}: {
  data: { date: string; balance: number; picks: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#262626"
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 10 }}
            stroke="#262626"
            tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}u`}
          />
          <Tooltip
            contentStyle={{
              background: "#121212",
              border: "1px solid #262626",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelFormatter={(v) => v}
            formatter={(v: number) => [`${v.toFixed(2)}u`, "Balance"]}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#ccff00"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
