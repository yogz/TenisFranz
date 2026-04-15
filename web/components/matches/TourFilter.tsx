"use client";

import type { Tour } from "@/lib/types";

export type TourFilterValue = "all" | Tour;

const OPTIONS: { id: TourFilterValue; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "atp", label: "ATP" },
  { id: "wta", label: "WTA" },
];

export function TourFilter({
  value,
  onChange,
}: {
  value: TourFilterValue;
  onChange: (v: TourFilterValue) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer par circuit"
      className="inline-flex rounded-full border border-border bg-surface2 p-1 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={
              "rounded-full px-3 py-1.5 font-medium transition " +
              (active
                ? "bg-lime text-bg"
                : "text-muted hover:text-text")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
