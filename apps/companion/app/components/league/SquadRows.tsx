import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import type { AutoSubMark } from "./autoSubbed";
import ScrollBoard from "./ScrollBoard";
import SquadRow, { SQUAD_CREST, SQUAD_EDGE, SQUAD_FIGURES, SQUAD_GAP, SQUAD_OPPONENT, SQUAD_POINTS } from "./SquadRow";
import { MUTE, PLATE_START, headWord } from "./TableHeads";
import { MINOR_CAPS, PLATE_FRAME, QUIET_NOTE, SMALL_CAPS } from "@/app/desk";

// The squad as a list: one run of rows, each man's positions a column, since a heading cannot hold two. The caller
// frames it (`PANEL_FLUSH`), so the position tiles meet the panel's edge as a spine on every branch.

/** `TableHeads.PLATE` without its padding: a 36px column cannot spare 12 of it. */
const FIGURE_HEAD = `cm-bevel ${PLATE_FRAME} justify-center whitespace-nowrap`;

/** What the points column holds, and its head: a season's, Fantrax's projection, or the gameweek on screen. */
export type SquadFigure = "season" | "projected" | "gameweek";

const FIGURE_HEADS: Record<SquadFigure, { word: string; title: string }> = {
  season: { word: "FPts", title: "Points this season" },
  projected: { word: "Proj", title: "Projected points this season" },
  gameweek: { word: "GW", title: "Points this gameweek" },
};

export default function SquadRows({
  lines,
  bench = [],
  figure = "season",
  onOpen,
  eligibility,
  notes = {},
  doubted = [],
}: {
  lines: SquadDetailLine[];
  /** The reserves, under a Bench plate in the same list and greyed as Championship Manager greys everyone not in the side. */
  bench?: readonly SquadPlayerDetail[];
  /** What the points are; the head says which, because the numbers cannot. */
  figure?: SquadFigure;
  /** Absent on the head-to-head board, which has no player card to open. */
  onOpen?: (player: SquadPlayerDetail) => void;
  /** Each man's eligible positions by Fantrax id; absent, the column prints his slot.
   *  A record, not a `Map`: a `Map` crosses the server/client boundary as `{}`. */
  eligibility?: Record<string, string[]>;
  /** Who an auto sub concerns, by Fantrax id: a word under his name says which way. */
  notes?: Record<string, AutoSubMark>;
  /** The planner's "Might not start", by Fantrax id (`mightNotStart`); absent off the planner. */
  doubted?: readonly string[];
}) {
  const everyone = [...lines.flatMap((line) => line.players), ...bench];
  const scored = everyone.some((p) => p.points !== undefined);
  // Every man on a screen carries a run of one length, so any one says whether the column is drawn.
  const xMins = everyone.some((p) => p.minutes.length > 0);
  // The day the model's export was taken, once, under the whole list.
  const asOf = everyone.find((p) => p.minutes[0]?.asOf)?.minutes[0]?.asOf;
  const head = FIGURE_HEADS[figure];

  const rowsOf = (players: readonly SquadPlayerDetail[], reserve: boolean) => (
    <ul className="cm-rows flex flex-col">
      {players.map((player) => (
        <li key={player.rostered.slot.fantraxId}>
          <SquadRow
            player={player}
            eligible={eligibility?.[player.rostered.slot.fantraxId]}
            onOpen={onOpen && (() => onOpen(player))}
            reserve={reserve}
            autoSub={notes[player.rostered.slot.fantraxId]}
            doubted={doubted.includes(player.rostered.slot.fantraxId)}
          />
        </li>
      ))}
    </ul>
  );

  return (
    // Above `lg` a row too wide for a half-width panel scrolls inside it; on a phone the name truncates instead.
    <ScrollBoard>
      <div className="flex flex-col lg:min-w-max">
        {/* The house's head (`TableHeads`): bare over the tile, the crest and the name, butted plates over the figures.
            Under a thumb the figures take only their own width and the name the rest (Craig, 11 Oct 2026). */}
        <div className={`flex items-center ${SQUAD_GAP} ${SQUAD_EDGE} ${MINOR_CAPS}`}>
          <span className="w-10 shrink-0">
            <span className={MUTE}>Pos</span>
          </span>
          <span className={`${SQUAD_CREST} shrink-0`} />
          {/* A basis, not a min-width: the name is the elastic column, and without a floor it renders 0px wide. */}
          <span className={`${PLATE_FRAME} min-w-0 flex-[1_1_5rem]`}>
            <span className={MUTE}>Player</span>
          </span>
          <span className={SQUAD_FIGURES}>
            {/* Who his CLUB plays this week — the football fixture, not ours. */}
            <span className={`${FIGURE_HEAD} ${SQUAD_OPPONENT} shrink-0`}>
              <span className="lg:hidden">Opp</span>
              <span className="hidden lg:inline">Opponent</span>
            </span>
            {xMins ? (
              <span className={`${FIGURE_HEAD} w-9 shrink-0`} title="Expected minutes this gameweek">
                {headWord("xMins")}
              </span>
            ) : null}
            {scored ? (
              <span className={`${FIGURE_HEAD} ${SQUAD_POINTS} shrink-0`} title={head.title}>
                {head.word}
              </span>
            ) : null}
          </span>
        </div>

        {/* One list, no group bars: flattening the lines keeps their order without printing the grouping. */}
        {rowsOf(lines.flatMap((line) => line.players), false)}
        {bench.length === 0 ? null : (
          <>
            {/* The bench under a plate in the same list, as a board's tail (`Board`): no second box, no second head. */}
            <p className={`${PLATE_START} ${SMALL_CAPS}`}>Bench</p>
            {rowsOf(bench, true)}
          </>
        )}
        {xMins && asOf ? <p className={`${QUIET_NOTE} px-1.5 py-1`}>xMins as of {asOf}</p> : null}
      </div>
    </ScrollBoard>
  );
}
