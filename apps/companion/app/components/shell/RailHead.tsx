import { cmDate, londonWeekdayLong } from "@epl/core";
import { now } from "../../clock";
import { lockAhead } from "../../lockAhead";
import { leagueInfo } from "../../round";
import { myTeamId } from "../../session";
import { shortName } from "../../teamNames";
import { lockWords } from "./lockWords";

// CM's sidebar head (cm9900/24.jpg): the day, the gameweek and its lock, and whose desk it is. Words, not controls.

/** The plates over the rail's sections; `open` is the gameweek whose lineups are being picked, or null. */
export default async function RailHead({ open }: { open: number | null }) {
  const at = now().toISOString();
  const [lock, info] = await Promise.all([open === null ? null : lockAhead(open), leagueInfo()]);
  const teams = info?.teams ?? [];
  const mine = await myTeamId(teams);
  const team = teams.find((t) => t.teamId === mine);
  const locks = lockWords(lock, at);
  return (
    <>
      <p className="cm-rail-plate cm-rail-date">
        {londonWeekdayLong(at)}
        <br />
        <span className="numeric">{cmDate(at)}</span>
      </p>
      {open === null ? null : (
        <p className="cm-rail-plate">
          <span className="numeric">GW{open}</span>
          {locks === null ? null : (
            <>
              <br />
              {locks}
            </>
          )}
        </p>
      )}
      {team === undefined ? null : <p className="cm-rail-plate text-accent">{shortName(team.teamId, team.name)}</p>}
    </>
  );
}
