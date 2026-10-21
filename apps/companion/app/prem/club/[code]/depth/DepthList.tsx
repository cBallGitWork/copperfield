import type { DepthSpot, FootballPlayer } from "@epl/core";
import { DASH } from "@epl/core";
import PlayerName from "../../../../components/shell/PlayerName";
import { IndexCell } from "../../../../components/league/TableCells";
import StateBox from "../../../../components/football/StateBox";
import { doubtRow } from "../../../../components/football/doubtRow";
import { BOARD, ROW_NAME, ROW_RULE, TAP_ROW } from "@/app/desk";
import NameLink from "../NameLink";
import XMins, { type WeekMinutes } from "./XMins";

// The same chart as a list, for a phone (Craig, 25 Sep 2026): a row per place, its shirt in the
// index block and the men in line across it, each washed by his doubt and boxed by why.

/** A man behind the first choice: `ROW_NAME`'s face and size, unbolded and quiet. */
const BEHIND = "font-chrome text-sm font-normal text-muted lg:text-base";

export default function DepthList({
  lines,
  playerOf,
  hrefOf,
  minutes,
}: {
  lines: readonly (readonly DepthSpot[])[];
  playerOf: (code: number) => FootballPlayer | null;
  hrefOf: (code: number) => string | null;
  /** Null draws no figure. */
  minutes: WeekMinutes | null;
}) {
  const spots = lines.flat();
  const depth = Math.max(1, ...spots.map((spot) => spot.holders.length));
  return (
    <section>
      <table className={`${BOARD} table-fixed`}>
        <caption className="sr-only">Who is in line for each place, first choice first</caption>
        <colgroup>
          <col className="w-11 lg:w-14" />
        </colgroup>
        <tbody>
          {spots.map((spot, at) => (
            <tr key={`${spot.slot}-${at}`} className={ROW_RULE}>
              <IndexCell className="text-2xs">
                <span title={spot.label}>{spot.slot}</span>
              </IndexCell>
              {Array.from({ length: depth }, (_, rank) => {
                const holder = spot.holders[rank];
                const player = holder === undefined ? null : playerOf(holder.code);
                return (
                  <td key={rank} className={`px-1.5 ${player === null ? "" : doubtRow(player)}`}>
                    {player === null ? (
                      <span className="text-faint">{holder === undefined ? "" : DASH}</span>
                    ) : (
                      <NameLink
                        href={hrefOf(player.code)}
                        className={`${TAP_ROW} gap-1 ${
                          rank === 0 ? `${ROW_NAME} text-ink` : BEHIND
                        }`}
                      >
                        {/* FPL's short name, as on its pitch: three to a row, a forename costs a surname. */}
                        <span className="truncate">
                          <PlayerName name={player.name} />
                        </span>
                        <StateBox player={player} />
                        {minutes === null ? null : <XMins code={player.code} minutes={minutes} />}
                      </NameLink>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
