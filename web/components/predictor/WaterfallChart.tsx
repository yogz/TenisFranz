"use client";

import type { FeatureContribution } from "@/lib/predict";
import { cn } from "@/lib/cn";

export function WaterfallChart({
  contributions,
  playerAName,
  playerBName,
}: {
  contributions: FeatureContribution[];
  playerAName: string;
  playerBName: string;
}) {
  const max = Math.max(...contributions.map((c) => Math.abs(c.value)), 0.01);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
        <span>favorise {playerBName}</span>
        <span>favorise {playerAName}</span>
      </div>
      <ul className="space-y-2">
        {contributions.map((c) => {
          const pct = (Math.abs(c.value) / max) * 50;
          const positive = c.value >= 0;
          return (
            <li key={c.name} className="flex items-center gap-3 text-xs">
              <div className="w-28 shrink-0 text-muted">{c.label}</div>
              <div className="relative h-2 flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div
                  className={cn(
                    "absolute top-0 h-2 rounded-sm",
                    positive ? "bg-lime" : "bg-muted/60",
                  )}
                  style={{
                    left: positive ? "50%" : `${50 - pct}%`,
                    width: `${pct}%`,
                  }}
                />
              </div>
              <div className="w-10 shrink-0 text-right font-mono text-text">
                {c.value >= 0 ? "+" : ""}
                {c.value.toFixed(2)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
