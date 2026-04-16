"use client";

import { useEffect, useRef, useState } from "react";

type HintProps = {
  text: string;
  side?: "top" | "bottom";
  align?: "center" | "start" | "end";
};

export function Hint({ text, side = "bottom", align = "center" }: HintProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on tap outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const sideClasses =
    side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const alignClasses =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span ref={ref} className="relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border bg-surface2 text-[9px] font-semibold leading-none text-muted transition hover:border-lime/40 hover:text-text focus:outline-none focus:ring-1 focus:ring-lime/40"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-20 w-56 rounded-lg border border-border bg-surface px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-muted shadow-lg ${sideClasses} ${alignClasses}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
