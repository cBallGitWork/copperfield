import { DASH, pitchName, type DepthSpot, type FootballPlayer } from "@epl/core";
import PitchRows from "../../../../components/league/PitchRows";
import { doubtRow } from "../../../../components/football/doubtRow";
import NameLink from "../NameLink";

// The depth chart on CM's pitch (Craig, 25 Sep 2026): each place a plate with its shirt on top and
// the men in line under it, first choice loudest, a doubt's name washed in the doubt ramp.

/** A spot and its place in its line: a shared shirt deals two spots of one `slot`. */
interface Placed {
  spot: DepthSpot;
  at: number;
}

export default function DepthPitch({
  lines,
  playerOf,
  hrefOf,
}: {
  lines: readonly (readonly DepthSpot[])[];
  playerOf: (code: number) => FootballPlayer | null;
  hrefOf: (code: number) => string | null;
}) {
  return (
    <PitchRows
      rows={lines.map((line, row) => ({ label: `Line ${row + 1}`, players: line.map((spot, at) => ({ spot, at })) }))}
      keyOf={({ spot, at }: Placed) => `${spot.slot}-${at}`}
      inColumn
    >
      {({ spot }) => <Plate spot={spot} playerOf={playerOf} hrefOf={hrefOf} />}
    </PitchRows>
  );
}

/** One place on the pitch: the shirt in the club's index block, then the men in line for it. The plate is one 44px
 *  target, opening its first choice's page; the list links every man. */
function Plate({
  spot,
  playerOf,
  hrefOf,
}: {
  spot: DepthSpot;
  playerOf: (code: number) => FootballPlayer | null;
  hrefOf: (code: number) => string | null;
}) {
  const men = spot.holders.flatMap((holder) => {
    const player = playerOf(holder.code);
    return player === null ? [] : [player];
  });
  const first = men[0];
  return (
    <NameLink
      href={first === undefined ? null : hrefOf(first.code)}
      className="flex min-h-11 w-full min-w-0 flex-col overflow-hidden border border-bg bg-surface/90 shadow-[0_2px_4px_oklch(0_0_0/0.45)]"
    >
      <span className="cm-index flex h-5 items-center justify-center text-3xs" title={spot.label}>
        {spot.slot}
      </span>
      {men.length === 0 ? (
        <span className="px-1 py-0.5 text-center text-2xs text-faint">{DASH}</span>
      ) : (
        men.map((player, rank) => (
          <span
            key={player.code}
            className={`truncate border-t border-bg px-1 py-0.5 text-center font-chrome lg:text-xs ${
              rank === 0 ? "text-2xs font-bold text-ink" : "text-2xs text-muted"
            } ${doubtRow(player)}`}
          >
            {pitchName(player)}
          </span>
        ))
      )}
    </NameLink>
  );
}
