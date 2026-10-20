import type { SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import type { AutoSubMark } from "./autoSubbed";
import ScrollBoard from "./ScrollBoard";
import SquadRow, { SQUAD_CREST, SQUAD_GAP, SQUAD_OPPONENT, SQUAD_POINTS } from "./SquadRow";
import { MUTE } from "./TableHeads";
import { MINOR_CAPS, QUIET_NOTE } from "@/app/desk";

// The squad as a list: one run of rows, each man's positions a column, since a heading cannot hold two.

/** `TableHeads.PLATE` without its padding: a 30px column cannot spare 12 of it. */
const FIGURE_HEAD = "cm-bevel flex h-7 items-center justify-center whitespace-nowrap";

export default function SquadRows({
  lines,
  projected,
  onOpen,
  eligibility,
  bare = false,
  head = true,
  reserve = false,
  notes = {},
}: {
  lines: SquadDetailLine[];
  /** Skip the panel: the caller has drawn one round this and whatever stands beside it. */
  bare?: boolean;
  /** Whether the points are Fantrax's projection; the heading says which, because the numbers cannot. */
  projected: boolean;
  /** Absent on the head-to-head board, which has no player card to open. */
  onOpen?: (player: SquadPlayerDetail) => void;
  /** Each man's eligible positions by Fantrax id; absent, the column prints his slot.
   *  A record, not a `Map`: a `Map` crosses the server/client boundary as `{}`. */
  eligibility?: Record<string, string[]>;
  /** Whether to draw the column heads; the bench under its plate does not. */
  head?: boolean;
  /** These rows are the bench, greyed as Championship Manager greys everyone not in the side. */
  reserve?: boolean;
  /** Who an auto sub concerns, by Fantrax id: a word under his name says which way. */
  notes?: Record<string, AutoSubMark>;
}) {
  const scored = lines.some((line) =>
    line.players.some((p) => p.points !== undefined),
  );
  // Every man on a screen carries a run of one length, so the first says whether the column is drawn.
  const xMins = lines.some((line) => line.players.some((p) => p.minutes.length > 0));
  // The day the model's export was taken, once, under the list that heads the column (not again under the bench).
  const asOf = head ? lines.flatMap((line) => line.players).find((p) => p.minutes[0]?.asOf)?.minutes[0]?.asOf : undefined;

  return (
    // Above `lg` a row too wide for a half-width panel scrolls inside it; on a phone the name truncates instead.
    // A panel, so the rows sit on a ground and not on the photograph (DESIGN §2).
    <ScrollBoard className={bare ? "" : "cm-panel"}>
      <div className="flex flex-col lg:min-w-max">
        {head ? (
          // The house's head (`TableHeads`): bare over the tile, the crest and the name, a plate over each figure. Under
          // a thumb the figures take only their own width and the name the rest (Craig, 11 Oct 2026: names cut at 390).
          <div className={`flex items-center ${SQUAD_GAP} px-1.5 ${MINOR_CAPS}`}>
            <span className="w-10 shrink-0">
              <span className={MUTE}>Pos</span>
            </span>
            <span className={`${SQUAD_CREST} shrink-0`} />
            {/* A basis, not a min-width: the name is the elastic column, and without a floor it renders 0px wide. */}
            <span className="flex h-7 min-w-0 flex-[1_1_5rem] items-center">
              <span className={MUTE}>Player</span>
            </span>

            {/* Who his CLUB plays this week — the football fixture, not ours. */}
            <span className={`${FIGURE_HEAD} ${SQUAD_OPPONENT} shrink-0`}>
              <span className="lg:hidden">Opp</span>
              <span className="hidden lg:inline">Opponent</span>
            </span>
            {xMins ? (
              <span className={`${FIGURE_HEAD} w-9 shrink-0`} title="Expected minutes this gameweek">
                xMins
              </span>
            ) : null}
            {scored ? (
              <span className={`${FIGURE_HEAD} ${SQUAD_POINTS} shrink-0`}>{projected ? "Proj" : "FPts"}</span>
            ) : null}
          </div>
        ) : null}

        {/* One list, no group bars: flattening the lines keeps their order without printing the grouping. */}
        <ul className="cm-rows flex flex-col">
          {lines.flatMap((line) =>
            line.players.map((player) => (
              <li key={player.rostered.slot.fantraxId}>
                <SquadRow
                  player={player}
                  eligible={eligibility?.[player.rostered.slot.fantraxId]}
                  onOpen={onOpen && (() => onOpen(player))}
                  reserve={reserve}
                  autoSub={notes[player.rostered.slot.fantraxId]}
                />
              </li>
            )),
          )}
        </ul>
        {xMins && asOf ? <p className={`${QUIET_NOTE} px-1.5 py-1`}>xMins as of {asOf}</p> : null}
      </div>
    </ScrollBoard>
  );
}
