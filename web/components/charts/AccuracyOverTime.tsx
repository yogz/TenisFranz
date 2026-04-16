"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Row {
  year: number;
  surface: string;
  accuracy: number;
  n: number;
}

export function AccuracyOverTime({ data }: { data: Row[] }) {
  // aggregate across surfaces → weighted mean per year
  const byYear = new Map<number, { num: number; den: number }>();
  for (const r of data) {
    const acc = byYear.get(r.year) ?? { num: 0, den: 0 };
    acc.num += r.accuracy * r.n;
    acc.den += r.n;
    byYear.set(r.year, acc);
  }
  const rows = Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, { num, den }]) => ({ year, accuracy: den ? num / den : 0 }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: "#a1a1aa", fontSize: 11 }} stroke="#262626" />
          <YAxis
            domain={[0.5, 0.8]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            stroke="#262626"
          />
          <Tooltip
            formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            contentStyle={{
              background: "#121212",
              border: "1px solid #262626",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="accuracy" fill="#ccff00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
