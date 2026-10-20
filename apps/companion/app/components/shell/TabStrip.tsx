import Link from "@/app/components/shell/Link";
import { TAB } from "@/app/desk";
import { STANDING_CAPS } from "../gazette/heads";
import { headWord } from "../league/TableHeads";

// Championship Manager's blue tab strip: one row of plates, edge to edge under a title bar, picking one of a set.
// Callers keep their own tab lists; `components/league/GroupNav` swaps its words at `lg`, so it is not one of these.

export interface Tab {
  href: string;
  label: string;
  key: string;
}

export default function TabStrip<K extends string>({
  label,
  tabs,
  current,
  dim = [],
  labels = "phrase",
  compact = false,
  register = "desk",
}: {
  /** What the strip is a strip OF — "League views", "Team views". */
  label: string;
  tabs: readonly (Tab & { key: K })[];
  /** Which tab you are on; `null` is a real answer, for a route in the section that no plate names (Matchups). */
  current: K | null;
  /** Tabs with nothing behind them: greyed and still a link, never hidden, so no plate moves. */
  dim?: readonly K[];
  /** `phrase` pads multi-word entries; `word` sizes each plate to its one word under a thumb. */
  labels?: "phrase" | "word";
  /** 36px under a thumb rather than 44, under PRODUCT's recorded 36px exception. */
  compact?: boolean;
  /** `paper` sets the strip in the paper's small capitals on its stock, the current tab in the print red. */
  register?: "desk" | "paper";
}) {
  return (
    <nav aria-label={label} className="flex">
      {tabs.map((tab) => {
        const here = tab.key === current;
        return (
          // A tab replaces this page in history, so Back leaves the section rather than stepping through its tabs.
          <Link
            key={tab.key}
            href={tab.href}
            replace
            aria-current={here ? "page" : undefined}
            // `desk.css` marks the current tab in the accent, never in red.
            className={
              register === "paper"
                ? PAPER_TAB
                : `${TAB} ${LABELS[labels]} ${compact ? "cm-tab-compact" : ""} ${
                    // Never greys the current tab, which the accent already marks.
                    !here && dim.includes(tab.key) ? "cm-out" : ""
                  }`
            }
          >
            {headWord(tab.label)}
          </Link>
        );
      })}
    </nav>
  );
}

/** A tab on the paper: tracked small capitals in muted ink, the current or tapped one in the print red over a rule. */
const PAPER_TAB = `flex min-h-11 flex-1 items-center justify-center border-b-2 border-transparent ${STANDING_CAPS} text-muted aria-[current=page]:border-current aria-[current=page]:text-accent has-[>[data-pending]]:text-accent`;

/** The main strip's label ladder: each plate its word's width, 2xs and 3xs under 375, so a strip never wraps. */
export const WORD_PLATE = "whitespace-nowrap px-1.5 text-2xs max-lg:flex-auto max-[374px]:px-1 max-[374px]:text-3xs lg:px-2";

const LABELS = { phrase: "px-3 text-2xs", word: WORD_PLATE } as const;
