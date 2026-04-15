type HintProps = {
  text: string;
  /** Side the popover should appear on. Defaults to bottom. */
  side?: "top" | "bottom";
  /** Horizontal alignment of the popover relative to the trigger. */
  align?: "center" | "start" | "end";
};

/**
 * Petite bulle d'aide affichant une explication au survol ou au focus.
 * Le `title` natif sert de repli accessible (mobile, lecteurs d'écran).
 */
export function Hint({ text, side = "bottom", align = "center" }: HintProps) {
  const sideClasses =
    side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const alignClasses =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        title={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border bg-surface2 text-[9px] font-semibold leading-none text-muted transition hover:border-lime/40 hover:text-text focus:outline-none focus:ring-1 focus:ring-lime/40"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-20 hidden w-56 rounded-lg border border-border bg-surface px-3 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-muted shadow-lg group-hover:block group-focus-within:block ${sideClasses} ${alignClasses}`}
      >
        {text}
      </span>
    </span>
  );
}
