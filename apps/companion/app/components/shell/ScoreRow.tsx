import Image from "next/image";
import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import { INDEX_WIDTH, ROW_NAME } from "@/app/desk";
import { yoursEdge, yoursMark } from "@/app/mine";
import Pending from "../league/Pending";
import Absent from "./Absent";
import Scoreline from "./Scoreline";

// Championship Manager's results row: an index block at each end holding the side's league position, and the
// names and score in fixed columns so every name and colon lines up down a panel.

/** One side of a scoreline. */
export interface ScoreSide {
  /** The full name, which is what the desk prints. */
  name: string;
  /** The three or four letters a phone prints; without one (every Fantrax manager) the full name stands. */
  short?: string;
  /** A club's crest, beside the name. Undefined draws nothing: a Fantrax team has none. */
  crest?: string;
  /** His place in his own competition as CM's blue block prints it (`3rd`, `=1st`); absent for a cup placeholder or a
   *  club before a game. */
  place?: string | null;
  /** The reader's own team — the accent, and the only thing it means here. */
  mine?: boolean;
  /** Settled and behind: both scores print in one cyan, so the dimmed name says who lost. */
  lost?: boolean;
  /** A fantasy side's men still to play ("2 to play"), under the name; absent says nothing. */
  left?: string | null;
  /** The clean sheets Fantrax has not credited, beside `left`; nought and null print nothing. */
  pending?: number | null;
  /** Where the side's name leads in a split row (`scoreHref`); ignored by a row that is one link. */
  href?: string;
}

/** The crest beside the name, 20px under a thumb and 26 on the desk; fetched at the larger so it is never soft. */
const CREST_PX = 26;

export default function ScoreRow({
  home,
  away,
  score,
  pending,
  clock,
  href,
  scoreHref,
  marks,
  under,
}: {
  home: ScoreSide;
  away: ScoreSide;
  /** Both figures, a dash for one not given; null before a ball is kicked, since Fantrax answers 0 for every unplayed period. */
  score: { home: number | null; away: number | null } | null;
  /** What stands in the score's column when there is no score: a kickoff time, or a fixture list's `v`. */
  pending?: ReactNode;
  /** The state of the match, drawn inside the score cell just after the figures. */
  clock?: ReactNode;
  /** Where the whole row leads; a row without one is not a control and takes no tap floor. */
  href?: string;
  /** Splits the row into three links instead: each side's `href` from its name, this from the score. */
  scoreHref?: string;
  /** A list that can hold the reader's row: every row takes the 4px edge so his keeps the column; football's stay flush. */
  marks?: boolean;
  /** A control under each side's name (beside it from `lg`), a sibling of the name's link; never on a row that is one link. */
  under?: { home?: ReactNode; away?: ReactNode };
}) {
  const yours = home.mine === true || away.mine === true;
  const split = scoreHref !== undefined;
  const row = (
    <div
      className={`grid min-h-11 items-stretch lg:min-h-7 ${GRID} ${marks === true ? yoursEdge(yours) : yoursMark(yours)}`}
    >
      <Block side={home} />
      <Name side={home} at="home" split={split} under={under?.home} />
      {/* The score: CM's colon, in the derived-reading cyan, a step above the names; the column's fixed
          width keeps a `12:0` on the same vertical as a `4:2`. */}
      <Cell href={scoreHref} className="numeric flex w-[5.5rem] shrink-0 items-center justify-center gap-1 text-lg font-bold text-info lg:w-36 lg:text-2xl">
        {score === null ? (
          // A kickoff time stands where a score would, a step under the score's size.
          <span className="text-sm font-normal text-faint lg:text-base">{pending}</span>
        ) : (
          <>
            <Scoreline home={score.home ?? <Absent />} rule="px-px text-muted" away={score.away ?? <Absent />} />
          </>
        )}
        {clock}
      </Cell>
      <Name side={away} at="away" split={split} under={under?.away} />
      <Block side={away} />
    </div>
  );

  // `.cm-row` rides on the link when there is one, or `tapfit` measures it against the control floor and fails.
  if (split) return <div className="cm-row block">{row}</div>;
  return href === undefined ? (
    row
  ) : (
    <Link href={href} className="cm-row block hover:brightness-110">
      {row}
    </Link>
  );
}

/** Block, name, score, name, block: the two `1fr`s hold every name in the panel at one x. */
const GRID = "grid-cols-[auto_1fr_auto_1fr_auto] gap-x-0.5 lg:gap-x-2";

/** A name over its control under a thumb: the name sits low in its half and the control high in its own, so they read as one. */
const STACKED = "items-end lg:items-center";

/** A cell's tap floor under a thumb (28 from `lg`): the 44, or 24 for each half of a name stacked over its control (Craig, 21 Oct 2026: "waaaaay too tall"). */
const FLOOR = { whole: "min-h-11", half: "min-h-6" } as const;

/** Which way a side reads: the away half mirrors the home, so both crests sit against their own block. */
const READS = { home: "", away: "flex-row-reverse" } as const;

/** CM's blue block at each end of the row, stretched to the row's full height. */
function Block({ side }: { side: ScoreSide }) {
  return (
    // The negative margin gives back `.cm-row`'s padding on the desk, so a column of blocks meets as one spine.
    <span
      className={`cm-index numeric ${INDEX_WIDTH} flex shrink-0 items-center justify-center lg:-my-0.5`}
    >
      {/* An ordinal, as CM prints; empty, not a dash, for a side with no place, as a dash would read as a figure. */}
      {side.place ?? ""}
    </span>
  );
}

/** A cell of a split row: a link at the thumb floor when it leads somewhere, else the plain span. */
function Cell({
  href,
  className,
  floor = FLOOR.whole,
  children,
}: {
  href?: string;
  className: string;
  floor?: string;
  children: ReactNode;
}) {
  return href === undefined ? (
    <span className={className}>{children}</span>
  ) : (
    <Link href={href} className={`${className} ${floor} hover:brightness-110 lg:min-h-7`}>
      {children}
    </Link>
  );
}

/** A name in white, yellow when it is yours: the short form under a thumb and the full one from `lg`,
 *  both rendered for a media query to pick, since a server component cannot know the width. */
function Name({ side, at, split, under }: { side: ScoreSide; at: "home" | "away"; split: boolean; under?: ReactNode }) {
  const name = (
    <Cell
      href={split ? side.href : undefined}
      floor={under === undefined ? FLOOR.whole : FLOOR.half}
      className={`flex min-w-0 ${under === undefined ? "items-center" : STACKED} gap-1 lg:gap-1.5 ${ROW_NAME} ${READS[at]} ${
        side.mine === true ? "text-accent" : side.lost === true ? "text-muted" : "text-ink"
      }`}
    >
      {side.crest === undefined ? null : (
        <Image
          src={side.crest}
          alt=""
          width={CREST_PX}
          height={CREST_PX}
          className="h-5 w-5 shrink-0 object-contain lg:h-[1.625rem] lg:w-[1.625rem]"
        />
      )}
      <span className={`flex min-w-0 flex-col lg:flex-row lg:items-baseline lg:gap-1.5 ${at === "away" ? "items-end lg:flex-row-reverse" : ""}`}>
        <span className="max-w-full truncate lg:hidden">{side.short ?? side.name}</span>
        <span className="hidden truncate lg:inline">{side.name}</span>
        {side.pending ? (
          <span className={`flex shrink-0 items-baseline gap-1 font-sans text-2xs font-normal ${READS[at]}`}>
            {side.left ? <span className="text-faint">{side.left}</span> : null}
            <Pending points={side.pending} />
          </span>
        ) : side.left ? (
          <span className="shrink-0 font-sans text-2xs font-normal text-faint">{side.left}</span>
        ) : null}
      </span>
    </Cell>
  );
  if (under === undefined) return name;
  // The name's link over its control, side by side from `lg`; the away pair mirrors, so the control sits toward the score.
  return (
    <span className={`flex min-w-0 flex-col lg:items-center lg:gap-1.5 ${at === "away" ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
      {name}
      <span className={`flex ${at === "away" ? "justify-end" : ""}`}>{under}</span>
    </span>
  );
}
