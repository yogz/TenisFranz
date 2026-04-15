"use client";

import type { Surface } from "@/lib/types";
import { cn } from "@/lib/cn";

const OPTIONS: { value: Surface; label: string }[] = [
  { value: "Hard", label: "Dur" },
  { value: "Clay", label: "Terre" },
  { value: "Grass", label: "Gazon" },
];

export function SurfacePicker({
  value,
  onChange,
}: {
  value: Surface;
  onChange: (s: Surface) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg py-2 text-sm font-medium transition",
            value === o.value ? "bg-lime text-black" : "text-muted hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
