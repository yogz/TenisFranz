import type { Hand } from "./types";

/** ISO 3166-1 alpha-2 → flag emoji via regional indicator symbols. */
export function flag(iso: string | null): string {
  if (!iso || iso.length !== 2) return "";
  const base = 0x1f1e6;
  const upper = iso.toUpperCase();
  return String.fromCodePoint(base + (upper.charCodeAt(0) - 65), base + (upper.charCodeAt(1) - 65));
}

export function handLabel(h: Hand | null): string | null {
  if (h === "R") return "Droitier";
  if (h === "L") return "Gaucher";
  if (h === "A") return "Ambidextre";
  return null;
}

export function formatHeight(cm: number | null): string | null {
  if (!cm) return null;
  return `${cm} cm`;
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
