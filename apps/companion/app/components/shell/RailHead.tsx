import { cmDate, londonWeekdayLong } from "@epl/core";
import { now } from "../../clock";
import { lockAhead } from "../../lockAhead";
import { leagueInfo } from "../../round";
import { myTeamId } from "../../session";
import { shortName } from "../../teamNames";
import { lockWords } from "./lockWords";

// CM's sidebar head (cm9900/24.jpg): the day, the gameweek and its lock, and whose desk it is. Words, not controls.
// The phone has no rail, so it carries the gameweek and its lock on a plate of its own (`PhoneLock`).

/** The open gameweek's lock in words, or null once it has passed. */
async function locksFor(open: number | null): Promise<string | null> {
  return lockWords(open === null ? null : await lockAhead(open), now().toISOString());
}

/** The plates over the rail's sections; `open` is the gameweek whose lineups are being picked, or null. */
export default async function RailHead({ open }: { open: number | null }) {
  const at = now().toISOString();
  const [locks, info] = await Promise.all([locksFor(open), leagueInfo()]);
  const teams = info?.teams ?? [];
  const mine = await myTeamId(teams);
  const team = teams.find((t) => t.teamId === mine);
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

/** Under a thumb, the open gameweek and its lock on one plate at the top, while the lock is ahead; nothing after. */
export async function PhoneLock({ open }: { open: number | null }) {
  const locks = await locksFor(open);
  if (open === null || locks === null) return null;
  return (
    <p role="status" className="cm-rail-date cm-rail-plate mx-1.5 mb-1.5 flex justify-between lg:hidden">
      <span className="numeric text-ink">GW{open}</span>
      <span className="text-ink">{locks}</span>
    </p>
  );
}
