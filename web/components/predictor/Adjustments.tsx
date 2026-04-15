"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { PredictAdjustments } from "@/lib/predict";

export interface AdjustmentOption {
  id: string;
  label: string;
  icon: string;
  target: "A" | "B";
  /**
   * Logit shift applied to this player's side when the chip is active.
   * A positive value strengthens the target player. See the conversion
   * table in predict.ts::PredictAdjustments — in the 50/50 region roughly:
   *   ±0.40 ≈ ±10 pts of probability
   *   ±0.20 ≈ ±5 pts
   *   ±0.10 ≈ ±2.5 pts
   */
  logit: number;
}

// Contextual modifiers — hand-calibrated so the UI direction always
// matches the user's intuition. These are applied directly to the logit
// after the model's raw prediction, so their effect is decoupled from
// the feature coefficients (which can flip signs under collinearity).
const OPTIONS: Omit<AdjustmentOption, "target">[] = [
  {
    id: "injured",
    label: "Blessé·e / pas à 100%",
    icon: "🏥",
    logit: -0.40, // ≈ −10 pts
  },
  {
    id: "five_setter",
    label: "Long match la veille",
    icon: "😴",
    logit: -0.25, // ≈ −6 pts
  },
  {
    id: "confidence",
    label: "En pleine confiance",
    icon: "🔥",
    logit: +0.20, // ≈ +5 pts
  },
  {
    id: "comeback",
    label: "Retour de blessure",
    icon: "🩹",
    logit: -0.50, // ≈ −12 pts
  },
  {
    id: "home",
    label: "À domicile",
    icon: "🏠",
    logit: +0.15, // ≈ +4 pts
  },
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
  const [open, setOpen] = useState(false);
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
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Ajustements
          </span>
          {count > 0 && (
            <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-semibold text-lime">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={"size-4 text-muted transition " + (open ? "rotate-180" : "")}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <p className="text-[11px] leading-relaxed text-muted">
            Ajoute du contexte que le modèle ignore (blessure, fatigue, forme récente…). Le score
            officiel reste intact — on affiche l&apos;impact à côté.
          </p>
          {(["A", "B"] as const).map((t) => {
            const name = t === "A" ? shortA : shortB;
            return (
              <div key={t} className="space-y-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  {name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONS.map((opt) => {
                    const id = `${opt.id}_${t}`;
                    const active = selected.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(id)}
                        className={
                          "rounded-full border px-3 py-1.5 text-xs transition " +
                          (active
                            ? "border-lime/60 bg-lime/15 text-lime"
                            : "border-border bg-surface2 text-muted hover:text-text")
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
          {count > 0 && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-[11px] text-muted hover:text-text"
            >
              <RotateCcw className="size-3" />
              Réinitialiser
            </button>
          )}
        </div>
      )}
    </div>
  );
}
