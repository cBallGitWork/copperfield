import type { ReactNode } from "react";
import { GROWS } from "./PitchRows";

// A reserve who comes on for a starter who did not play: two arrows crossing, pinned to his card's top left in the
// derived reading's cyan, since the sub is ours until Fantrax makes it. The real match's ▲/▼ keeps the right.

/** The swap on the rail glyphs' grid: 24 units, square caps, mitred joins. */
function SwapGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M3 7H19M15 3L19 7L15 11M21 17H5M9 13L5 17L9 21" />
    </svg>
  );
}

export default function AutoSubChip({ title, children }: { title: string | null; children: ReactNode }) {
  if (title === null) return children;
  return (
    <div className={`relative ${GROWS}`}>
      {children}
      <span className="absolute left-0 top-0 flex items-center rounded-[1px] bg-bg/85 px-1 py-0.5 text-2xs font-bold leading-none text-info" title={title}>
        <SwapGlyph />
        <span className="sr-only">{title}</span>
      </span>
    </div>
  );
}
