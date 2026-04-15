"use client";

import { useEffect, useState } from "react";

function formatAge(ms: number): string {
  if (ms < 0) return "à l'instant";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

export function StalenessBadge({ updatedAt }: { updatedAt: string }) {
  // Compute age on the client to avoid hydration mismatch — the server
  // renders the raw ISO date, the client swaps in the "X ago" label on mount.
  const [label, setLabel] = useState<string>("");
  useEffect(() => {
    const t = new Date(updatedAt).getTime();
    if (!Number.isFinite(t) || t <= 0) {
      setLabel("—");
      return;
    }
    const tick = () => setLabel(formatAge(Date.now() - t));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  return (
    <div
      className="chip"
      title={`Mis à jour : ${updatedAt}`}
      aria-label={`Données mises à jour il y a ${label}`}
    >
      <span className="size-1.5 rounded-full bg-lime" />
      <span className="text-[11px] text-muted">
        {label ? `Mis à jour il y a ${label}` : "Mis à jour"}
      </span>
    </div>
  );
}
