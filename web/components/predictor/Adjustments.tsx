"use client";

import { RotateCcw } from "lucide-react";
import type { PredictAdjustments } from "@/lib/predict";

export interface AdjustmentOption {
  id: string;
  label: string;
  icon: string;
  category: string;
  target: "A" | "B";
  logit: number;
}

interface OptionDef {
  id: string;
  label: string;
  icon: string;
  category: string;
  logit: number;
}

const CATEGORIES = [
  { key: "physical", label: "Physique" },
  { key: "mental", label: "Mental" },
  { key: "tactical", label: "Tactique" },
  { key: "external", label: "Externe" },
] as const;

const OPTIONS: OptionDef[] = [
  // Physique
  { id: "injured", label: "Blessé·e", icon: "🏥", category: "physical", logit: -0.40 },
  { id: "comeback", label: "Retour de blessure", icon: "🩹", category: "physical", logit: -0.50 },
  { id: "five_setter", label: "Long match la veille", icon: "😴", category: "physical", logit: -0.25 },
  // Mental
  { id: "confidence", label: "En confiance", icon: "🔥", category: "mental", logit: +0.20 },
  { id: "pressure", label: "Pression", icon: "😰", category: "mental", logit: -0.15 },
  { id: "clutch", label: "Clutch", icon: "🧊", category: "mental", logit: +0.15 },
  // Tactique
  { id: "surface_spe", label: "Spécialiste surface", icon: "🎯", category: "tactical", logit: +0.25 },
  { id: "surface_chg", label: "Change de surface", icon: "🔄", category: "tactical", logit: -0.20 },
  { id: "altitude", label: "Altitude", icon: "🏔️", category: "tactical", logit: +0.10 },
  // Externe
  { id: "home", label: "À domicile", icon: "🏠", category: "external", logit: +0.15 },
  { id: "travel", label: "Jet lag", icon: "✈️", category: "external", logit: -0.15 },
  { id: "heat", label: "Chaleur extrême", icon: "🥵", category: "external", logit: -0.10 },
];

function buildAll(): AdjustmentOption[] {
  const out: AdjustmentOption[] = [];
  for (const t of ["A", "B"] as const) {
    for (const o of OPTIONS) {
      out.push({ ...o, id: `${o.id}_${t}`, target: t });
    }
  }
  return out;
}

const ALL = buildAll();

export const VALID_ADJ_BASE_IDS = new Set(OPTIONS.map((o) => o.id));

/** Serialize an id set into the aAdj/bAdj URL format. */
export function adjIdsToUrlParts(ids: Set<string>): { aAdj: string; bAdj: string } {
  const a: string[] = [];
  const b: string[] = [];
  for (const id of ids) {
    if (id.endsWith("_A")) a.push(id.slice(0, -2));
    else if (id.endsWith("_B")) b.push(id.slice(0, -2));
  }
  a.sort();
  b.sort();
  return { aAdj: a.join(","), bAdj: b.join(",") };
}

/** Parse aAdj/bAdj URL params into an id set. Unknown base ids are dropped. */
export function adjIdsFromUrlParts(aAdj: string | null, bAdj: string | null): Set<string> {
  const out = new Set<string>();
  const parse = (s: string | null, side: "A" | "B") => {
    if (!s) return;
    for (const raw of s.split(",")) {
      const base = raw.trim();
      if (base && VALID_ADJ_BASE_IDS.has(base)) {
        out.add(`${base}_${side}`);
      }
    }
  };
  parse(aAdj, "A");
  parse(bAdj, "B");
  return out;
}

export function adjustmentsFromIds(ids: Set<string>): PredictAdjustments {
  let logitA = 0;
  let logitB = 0;
  for (const opt of ALL) {
    if (!ids.has(opt.id)) continue;
    if (opt.target === "A") logitA += opt.logit;
    else logitB += opt.logit;
  }
  return { logitA, logitB };
}

export function Adjustments({
  selected,
  onChange,
  playerAName,
  playerBName,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  playerAName: string;
  playerBName: string;
}) {
  const count = selected.size;
  const shortA = playerAName.split(" ").pop() ?? playerAName;
  const shortB = playerBName.split(" ").pop() ?? playerBName;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const reset = () => onChange(new Set());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Ajustements contextuels
          </span>
          {count > 0 && (
            <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-semibold text-lime">
              {count}
            </span>
          )}
        </div>
        {count > 0 && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-text"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      {(["A", "B"] as const).map((t) => {
        const name = t === "A" ? shortA : shortB;
        return (
          <div key={t} className="space-y-2.5">
            <div className="text-[11px] font-semibold text-text">{name}</div>
            {CATEGORIES.map((cat) => {
              const chips = OPTIONS.filter((o) => o.category === cat.key);
              return (
                <div key={cat.key} className="space-y-1.5">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-muted/60">
                    {cat.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((opt) => {
                      const id = `${opt.id}_${t}`;
                      const active = selected.has(id);
                      const isNeg = opt.logit < 0;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggle(id)}
                          className={
                            "rounded-full border px-2.5 py-1 text-[11px] transition " +
                            (active
                              ? isNeg
                                ? "border-red-400/50 bg-red-400/15 text-red-300"
                                : "border-lime/50 bg-lime/15 text-lime"
                              : "border-border bg-surface2 text-muted hover:text-text hover:border-border/80")
                          }
                        >
                          <span className="mr-1">{opt.icon}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
