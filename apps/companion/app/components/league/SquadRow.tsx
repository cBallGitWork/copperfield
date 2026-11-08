import Image from "next/image";
import {
  type SquadPlayerDetail,
  crestUrl,
  isResolved,
  fullPlayerName,
  DASH,
} from "@epl/core";
import StateMark from "../football/StateMark";
import FitnessNote from "../football/FitnessNote";
import { notedOf } from "../football/FitnessMark";
import { fitnessOf } from "../football/doubtRow";
import { minutesInk } from "../football/xminsInk";
import PositionTile from "./PositionTile";
import { rowFixture } from "./rowFixture";
import PlayerName from "../shell/PlayerName";
import { MINOR_LABEL, QUIET_NOTE, ROW_NAME } from "@/app/desk";
import { returnDate } from "./returnDate";
import { fdrTile } from "../football/fdr";
import type { AutoSubMark } from "./autoSubbed";

// One man's row in a squad list: our position, his club's crest, his name, his fixture and his figure.

/** The columns `SquadRows` heads too, phone width first: "WOL (A)" is 39px, the FPts head about 33, a crest 24.
 *  The gap parts the tile, crest, name and figures; the figures butt, as their head plates do (`SQUAD_FIGURES`). */
export const SQUAD_GAP = "gap-1 lg:gap-1.5";
/** The row's padding: its right edge alone, so the position block meets the panel's left as a spine. */
export const SQUAD_EDGE = "pr-1.5";
/** `LeadFace`'s crest cell: 24px holding a 20px crest. */
export const SQUAD_CREST = "w-6";
/** The figure columns, butted: each is exactly its head plate's width. */
export const SQUAD_FIGURES = "flex shrink-0 items-center";
/** The desk's Inf column (`cm9900/12.jpg`): his mark, the word and his return; a phone keeps them under the name. */
export const SQUAD_INF = "hidden shrink-0 lg:flex lg:w-24";
export const SQUAD_OPPONENT = "w-11 lg:w-[5.5rem]";
export const SQUAD_POINTS = "w-9";

export default function SquadRow({
  player,
  eligible,
  onOpen,
  reserve,
  autoSub,
  doubted = false,
}: {
  player: SquadPlayerDetail;
  eligible: string[] | undefined;
  onOpen?: () => void;
  reserve: boolean;
  /** His auto sub, if he has one: on for a man who did not play, or off for a reserve. */
  autoSub?: AutoSubMark;
  /** The planner names him under "Might not start" (`mightNotStart`); a status mark outranks it. */
  doubted?: boolean;
}) {
  const { club, points } = player;
  const resolved = isResolved(player.rostered) ? player.rostered : null;
  // Null for a slot the bridge has not settled, which is ordinary and reads as silence.
  const footballer = resolved?.player ?? null;

  // Who his club plays, in the app's one spelling of a fixture — `BRE (H)`.
  const fixture = rowFixture(player);
  const back = footballer?.news ? returnDate(footballer.news) : null;
  const { wash, mark } = fitnessOf(footballer);
  const xMins = player.minutes[0]?.minutes ?? null;

  const inside = (
    <>
      {/* Our position in the index block, where CM puts a squad number (FPL's `squad_number` is always null). */}
      <PositionTile
        positions={eligible && eligible.length > 0 ? eligible : [player.rostered.slot.position ?? ""]}
      />

      {/* The club crest on the bare row, not his face: a portrait at this size is a smudge. */}
      <span className={`grid h-6 ${SQUAD_CREST} shrink-0 place-items-center`}>
        {club ? (
          /* Sized in both axes: `h-full` resolves to auto in an auto-sized grid row and the crest overhangs. */
          <Image src={crestUrl(club)} alt="" width={20} height={20} className="size-5 object-contain" />
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
          CM's mark follows his name, else the planner's doubt; silent for a fit starter. The note of why wraps under the
          name on a phone when it cannot sit beside it, so it never shrinks to an ellipsis; a desk keeps one line. */}
      <span className="flex min-w-0 flex-[1_1_5rem] flex-col lg:flex-row lg:items-center lg:gap-1.5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 lg:flex-nowrap">
          <span className="flex min-w-0 max-w-full items-center gap-1.5">
            <span className={`min-w-0 truncate ${ROW_NAME}`}><PlayerName name={fullPlayerName(player.rostered)} /></span>
            {mark ? (
              <span className="lg:hidden">
                <StateMark availability={mark} />
              </span>
            ) : doubted ? (
              <span title="Might not start" className={`numeric shrink-0 ${MINOR_LABEL}`}>
                <span aria-hidden>MNS</span>
                <span className="sr-only">Might not start</span>
              </span>
            ) : null}
          </span>
          {mark ? (
            <span className="lg:hidden">
              <FitnessNote player={notedOf(footballer)} />
            </span>
          ) : null}
        </span>
        {/* FPL's expected day under the name on a phone; the desk's Inf column carries it. */}
        {back === null ? null : <span className={`${QUIET_NOTE} shrink-0 leading-tight lg:hidden`}>{back}</span>}
        {autoSub === undefined ? null : (
          <span className="shrink-0 truncate text-2xs leading-tight text-info">
            {autoSub.on ? `Auto-sub for ${autoSub.with}` : `Auto-sub: ${autoSub.with} on`}
          </span>
        )}
      </span>

      {/* The desk's Inf column: his mark, then why and when he is back, in the quiet words. */}
      <span className={`${SQUAD_INF} items-center gap-1.5`}>
        {mark ? <StateMark availability={mark} /> : null}
        {mark ? <FitnessNote player={notedOf(footballer)} /> : null}
        {back === null ? null : <span className={`${QUIET_NOTE} truncate`}>{back}</span>}
      </span>

      {/* Stretched to the row, giving back `.cm-row`'s desk padding, so the tile and the points block meet the rules. */}
      <span className={`${SQUAD_FIGURES} self-stretch lg:-my-0.5`}>
        {/* His fixture this week as a tile in FPL's difficulty, club and venue only (Craig, 7 Nov 2026: no numbers). */}
        {fixture.quiet ? (
          <span className={`numeric ${SQUAD_OPPONENT} flex shrink-0 items-center justify-center text-xs text-faint`}>
            {fixture.text}
          </span>
        ) : (
          <FixtureTile text={fixture.text} difficulty={fixture.difficulty} />
        )}

        {/* The model's xMins for the gameweek on screen, inked by risk (`minutesInk`); no run, no cell. */}
        {player.minutes.length === 0 ? null : (
          <span className={`numeric w-9 shrink-0 text-center text-sm font-bold ${minutesInk(xMins)}`}>
            {xMins ?? DASH}
          </span>
        )}

        {/* The league's points in the reading cyan (DESIGN §3). Undefined is no table and drops the cell; null, a dash.
            A step above §6's row figure (DESIGN §6 records why). */}
        {points === undefined ? null : points === null ? (
          <span className={`numeric ${SQUAD_POINTS} flex shrink-0 items-center justify-center text-base text-muted`}>{DASH}</span>
        ) : (
          <span className={`numeric ${SQUAD_POINTS} flex shrink-0 items-center justify-center self-stretch bg-for text-base font-bold text-ink lg:text-lg`}>
            {points}
          </span>
        )}
      </span>
    </>
  );

  // A tap row's 36 under a thumb; `.cm-row` takes it to 28 above `lg`.
  // `cm-out` greys the ink and the doubt wash is a ground, so an injured reserve keeps both.
  const shell = [
    `cm-row flex min-h-9 w-full items-center ${SQUAD_GAP} ${SQUAD_EDGE} text-left`,
    reserve ? "cm-out" : "",
    wash,
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

/** A fixture as CM fills a cell: FPL's difficulty is the ground, the words the club and venue; its title says how hard. */
function FixtureTile({ text, difficulty }: { text: string; difficulty: number | null }) {
  const tile = fdrTile(difficulty);
  return (
    <span
      title={difficulty === null ? text : `${text}, difficulty ${difficulty} of 5`}
      className={`cm-chip numeric ${SQUAD_OPPONENT} flex shrink-0 items-center justify-center self-stretch truncate text-xs font-bold ${tile.className}`}
      style={tile.style}
    >
      {text}
    </span>
  );
}
