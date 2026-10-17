import Image from "next/image";
import {
  type SquadPlayerDetail,
  crestUrl,
  isResolved,
  fullPlayerName,
  DASH,
} from "@epl/core";
import StateBox from "../football/StateBox";
import { doubtRow } from "../football/doubtRow";
import PositionTile from "./PositionTile";
import { rowFixture } from "./rowFixture";
import PlayerName from "../shell/PlayerName";
import { QUIET_NOTE, ROW_NAME } from "@/app/desk";
import { returnDate } from "./returnDate";

// One man's row in a squad list: our position, his club's crest, his name, his fixture and his figure.

/** The columns `SquadRows` heads too, phone width first: "WOL (A)" is 39px, the FPts head 27, a crest 24. */
export const SQUAD_GAP = "gap-1 lg:gap-1.5";
export const SQUAD_CREST = "w-6 lg:w-7";
export const SQUAD_OPPONENT = "w-11 lg:w-[5.5rem]";
export const SQUAD_POINTS = "w-[1.875rem] lg:w-9";

export default function SquadRow({
  player,
  eligible,
  onOpen,
  reserve,
}: {
  player: SquadPlayerDetail;
  eligible: string[] | undefined;
  onOpen?: () => void;
  reserve: boolean;
}) {
  const { club, points } = player;
  const resolved = isResolved(player.rostered) ? player.rostered : null;
  // Null for a slot the bridge has not settled, which is ordinary and reads as silence.
  const footballer = resolved?.player ?? null;

  // Who his club plays, in the app's one spelling of a fixture — `BRE (H)`.
  const fixture = rowFixture(player);
  const back = footballer?.news ? returnDate(footballer.news) : null;

  const inside = (
    <>
      {/* Our position in the index block, where CM puts a squad number (FPL's `squad_number` is always null). */}
      <PositionTile
        positions={eligible && eligible.length > 0 ? eligible : [player.rostered.slot.position ?? ""]}
      />

      {/* The club crest on the bare row, not his face: a portrait at this size is a smudge. */}
      <span className={`grid h-7 ${SQUAD_CREST} shrink-0 place-items-center`}>
        {club ? (
          /* Sized in both axes: `h-full` resolves to auto in an auto-sized grid row and the crest overhangs. */
          <Image
            src={crestUrl(club)}
            alt=""
            width={22}
            height={22}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="numeric text-[0.5rem] font-bold text-white/70"
          >
            ?
          </span>
        )}
      </span>

      {/* `ROW_NAME`, not a size of its own; the `flex-` is this screen's, as it decides what gives way.
          Why he is not playing follows his name; silent for a fit man. The day he is due back goes under it on a
          phone, where the name column has 7px to spare, and beside it on a desk. */}
      <span className="flex min-w-0 flex-[1_1_5rem] flex-col lg:flex-row lg:items-center lg:gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`min-w-0 truncate ${ROW_NAME}`}><PlayerName name={fullPlayerName(player.rostered)} /></span>
          <StateBox player={footballer} />
        </span>
        {back === null ? null : <span className={`${QUIET_NOTE} shrink-0 leading-tight`}>{back}</span>}
      </span>

      {/* His fixture this week; his own club is not repeated beside it, or it reads as two unrelated clubs. */}
      <span className={`numeric ${SQUAD_OPPONENT} shrink-0 truncate text-xs ${fixture.quiet ? "text-faint" : "text-muted"}`}>
        {fixture.text}
      </span>

      {/* The model's xMins for the gameweek on screen, in the derived reading's cyan; no run, no cell. */}
      {player.minutes.length === 0 ? null : (
        <span className="numeric w-9 shrink-0 text-center text-sm font-bold text-info">
          {player.minutes[0]?.minutes ?? DASH}
        </span>
      )}

      {/* Undefined is no table and drops the cell; null, a table that omits him, is a dash.
          A step above §6's row figure (DESIGN §6 records why). */}
      {points === undefined ? null : (
        <span className={`numeric ${SQUAD_POINTS} shrink-0 text-center text-base font-bold text-mid lg:text-lg`}>
          {points ?? DASH}
        </span>
      )}
    </>
  );

  // 36px under a thumb, PRODUCT.md's squad-list exception to the 44 floor; `.cm-row` takes it to 28 above `lg`.
  // `cm-out` greys the ink and the doubt wash is a ground, so an injured reserve keeps both.
  const shell = [
    `cm-row flex min-h-9 w-full items-center ${SQUAD_GAP} px-1.5 text-left`,
    reserve ? "cm-out" : "",
    doubtRow(footballer),
  ]
    .filter(Boolean)
    .join(" ");

  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={`${shell} hover:bg-raised`}
    >
      {inside}
    </button>
  ) : (
    <div className={shell}>{inside}</div>
  );
}
