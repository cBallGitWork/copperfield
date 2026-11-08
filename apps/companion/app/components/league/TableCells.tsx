import type { CSSProperties, ReactNode } from "react";
import { INDEX_SPINE, INDEX_WIDTH, TAP_ROW } from "@/app/desk";

/** A cut's words: quiet ink, a size a phone reads, not the tracked capitals of a key. */
const CUT_LABEL = "pr-2 text-2xs text-muted lg:text-xs";

// The two cells a CM board's rows are built from, opposite `TableHeads`.
// No crest-and-name cell: its callers differ in size, fallback and alignment.

/** The ordinal in CM's index block, in the colour a team's or club's shell gives `--cm-index`. */
export function IndexCell({
  children,
  className = "",
  wide,
  width = INDEX_WIDTH,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** A date, a season or a score: padded at its edges. */
  wide?: boolean;
  /** `INDEX_WIDTH` unless the column's head sizes it. */
  width?: string;
  /** A side's colours, re-pointing `--cm-index` on this cell alone. */
  style?: CSSProperties;
}) {
  // The span holds the width (a pinned name sits at `left-8`); unpadded so "=10th" fits. A `wide` index keeps its edge.
  return (
    <td className={`${INDEX_SPINE} ${width} numeric ${wide ? "px-1.5" : "px-0"} text-center ${className}`} style={style}>
      <span className="inline-block min-w-5 lg:min-w-6">{children}</span>
    </td>
  );
}

/** The name cell's link on a board row: `TAP_ROW`'s 36 under a thumb and 28 on a desk. */
export const ROW_LINK = `${TAP_ROW} gap-2 hover:underline`;

/** CM's purple value block as the index's ramp: the column a table is for (`--color-for`). */
const FOR_BLOCK = { "--cm-index": "var(--color-for)" } as CSSProperties;

/** The points in CM's purple block, the way CM ends its table: the eye runs down the column to find them. */
export function PointsCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <IndexCell wide width="" className={className} style={FOR_BLOCK}>
      {children}
    </IndexCell>
  );
}

/** A dashed rule across a table naming what it separates. `tone` is the rule's border colour, written out in full. */
export function CutRow({ span, label, tone }: { span: number; label: string; tone: string }) {
  return (
    <tr aria-hidden>
      <td colSpan={span} className="p-0">
        {/* The rule runs the width and the words end it, readable at arm's length (the approved picture, 8 Nov 2026). */}
        <span className={`flex items-center gap-2 py-0.5 ${CUT_LABEL}`}>
          <span className={`flex-1 border-t-2 border-dashed ${tone}`} />
          {label}
        </span>
      </td>
    </tr>
  );
}
