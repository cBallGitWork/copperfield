import Image from "next/image";
import type { ReactNode } from "react";
import { DASH } from "@epl/core";
import { positionsLabel } from "../../positions";
import { LABEL, ROW_NAME } from "@/app/desk";
import PlayerName from "../shell/PlayerName";
import { ROW_LINK, TIGHT_ROW } from "./TableCells";

/** A board lead's link or button at the width its column gives it: a fixed table's name takes the slack. */
export const LEAD_BOX = `${ROW_LINK} px-1.5 text-left`;

/** `LEAD_BOX` with room for a "Surname, I" of fifteen letters under a thumb, on a board that scrolls. */
export const LEAD_LINK = `${LEAD_BOX} w-40 lg:w-64`;

/** `LEAD_LINK` at PRODUCT's 36px under a thumb: the match screens' boards and the read-mostly Stats boards. */
export const LEAD_LINK_TIGHT = `${TIGHT_ROW} w-40 px-1.5 text-left hover:underline lg:w-64`;

/** A man at the head of a board row: his crest, his name by the one rule (`PlayerName`), `after` straight after it,
 *  and, when the board's tile is the desk's alone, his position under it on a phone with `under` beside that.
 *  `line` sets all of it on one: the name, `under`, the position, then `after`. */
export default function LeadFace({
  crest,
  name,
  short,
  positions,
  after,
  under,
  line = false,
}: {
  /** The crest's address; null holds the slot empty, absent leaves it out (a club's own board). */
  crest?: string | null;
  name: string;
  /** The form to initial under a thumb; null when `name` is already a list's short form (FPL's web name). */
  short?: string | null;
  positions?: readonly string[];
  after?: ReactNode;
  under?: ReactNode;
  /** A row whose figures sit under it: one line, never two. */
  line?: boolean;
}) {
  const position =
    positions === undefined ? null : (
      <span className={`${LABEL} shrink-0 leading-tight`}>{positionsLabel(positions) ?? DASH}</span>
    );
  const named = (
    // The name keeps its room; whatever follows it truncates first.
    <span className={`max-w-full shrink-0 truncate ${ROW_NAME}`}>
      {short === null ? name : <PlayerName name={name} short={short} />}
    </span>
  );
  return (
    <>
      {crest === undefined ? null : (
        <span className="grid size-6 shrink-0 place-items-center">
          {crest === null ? null : <Image src={crest} alt="" width={20} height={20} className="size-5 object-contain" />}
        </span>
      )}
      {line ? (
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          {named}
          {under}
          {position}
          {after}
        </span>
      ) : (
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-baseline gap-1">
            {named}
            {after}
          </span>
          {position === null ? null : (
            <span className="flex min-w-0 items-baseline gap-1 lg:hidden">
              {position}
              {under}
            </span>
          )}
        </span>
      )}
    </>
  );
}
