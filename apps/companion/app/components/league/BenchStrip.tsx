import type { ReactNode } from "react";
import { BENCH_KIT, FAR_INSET, GAP_CLASS, cardBasis, rowBudget } from "./PitchRows";
import { SMALL_CAPS } from "@/app/desk";

// The men off the grass in a strip under it, at the card width of the men above; the caller draws each cell.

export default function BenchStrip<T>({
  bench,
  keyOf,
  rows,
  widest,
  label,
  numbered = true,
  captionOf,
  inColumn = false,
  children,
}: {
  /** In the order they come on, which is the provider's (Fantrax's, FPL's), never re-sorted here. */
  bench: readonly T[];
  keyOf: (player: T) => string;
  /** The grass's row count, not this strip's, or a reserve outgrows the man he would replace. */
  rows: number;
  /** The card width the pitch above agreed on; a longer strip takes its own. */
  widest: number;
  /** What a screen reader hears the strip called. */
  label: string;
  /** Each man's place in that order over his card, from the left (FPL's `squad_number` is always null). */
  numbered?: boolean;
  /** A word beside the number: his position in the league's letters. */
  captionOf?: (player: T) => string;
  /** Fill the column rather than bleed through the gutters; beside the list a bleed drags the strip across the grass. */
  inColumn?: boolean;
  children: (player: T) => ReactNode;
}) {
  // No reserves: no strip, rather than an empty bordered bar.
  if (bench.length === 0) return null;
  const basis = cardBasis(Math.max(widest, bench.length));

  return (
    // `pitch-strip` bounds the card height by the grass as well as the screen; see `pitch.css`.
    <section className={`pitch-strip border-t border-line bg-surface pb-2 pt-1.5 ${inColumn ? "" : "bleed"}`}>
      {/* The pitch's own inset: `cardBasis` is a share of the row, so the row must match the pitch's width. */}
      <ul
        aria-label={label}
        className={`flex justify-center ${GAP_CLASS}`}
        style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows), ...BENCH_KIT }}
      >
        {bench.map((player, at) => (
          // His card grows to the strip's tallest, as on the grass (`PitchRows`).
          <li key={keyOf(player)} className="flex min-w-0 shrink-0 flex-col [&>:last-child]:grow" style={{ flexBasis: basis }}>
            {numbered || captionOf !== undefined ? (
              <p className="flex items-center justify-center gap-1 pb-0.5 leading-none">
                {numbered ? <span className="cm-index numeric px-1 text-3xs">{at + 1}</span> : null}
                {captionOf === undefined ? null : (
                  <span className={`font-display ${SMALL_CAPS} text-ink`}>{captionOf(player)}</span>
                )}
              </p>
            ) : null}
            {children(player)}
          </li>
        ))}
      </ul>
    </section>
  );
}
