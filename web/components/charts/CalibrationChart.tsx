"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  bin: number;
  observed: number;
  predicted: number;
  count: number;
}

export function CalibrationChart({ data }: { data: Point[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -24 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="predicted"
            domain={[0, 1]}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            stroke="#262626"
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            stroke="#262626"
          />
          <Tooltip
            contentStyle={{
              background: "#121212",
              border: "1px solid #262626",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#262626"
          />
          <Line
            type="monotone"
            dataKey="observed"
            stroke="#ccff00"
            strokeWidth={2}
            dot={{ fill: "#ccff00", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
