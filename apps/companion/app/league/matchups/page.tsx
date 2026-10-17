import { pairingInvolves, periodPairings, roundState } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import PairingCard from "./PairingCard";
import RoundWord from "../../components/league/RoundWord";
import LeagueShell from "../Shell";
import { getLeagueSquads } from "../../squads";
import { myTeamId } from "../../session";
import { liveScores, pendingByTeam } from "../../scoreboard";
import { leagueScoring } from "../../scoring";
import { roundUnderway } from "../../football";
import { yoursFirst } from "../../mine";
import FantraxSilent from "../../components/shell/FantraxSilent";
import ScoreboardDown from "../ScoreboardDown";
import { LEAGUE_CAPTION, titled } from "../../titles";

// Who each squad plays this gameweek and what they have scored: Fantrax's own totals, one call for every team.

export const revalidate = 30;

export const metadata = titled(LEAGUE_CAPTION.matchups);

export default async function MatchupPage() {
  const squads = await getLeagueSquads();

  if ("unavailable" in squads) {
    return (
      <LeagueShell current="matchups">
        <FantraxSilent code={squads.unavailable} />
      </LeagueShell>
    );
  }

  if ("undrafted" in squads) {
    return (
      <LeagueShell current="matchups">
        <Nothing title="Nobody plays anybody yet" code={squads.undrafted} />
      </LeagueShell>
    );
  }

  const period = squads.roundPeriod;
  if (squads.info === null || period === null) {
    return (
      <LeagueShell current="matchups">
        <Nothing title="No matchups yet" />
      </LeagueShell>
    );
  }

  const pairings = periodPairings(squads.info.matchups, squads.info.teams, period);
  if (pairings.length === 0) {
    return (
      <LeagueShell current="matchups">
        <Nothing title="No matchups this gameweek" code={`gameweek ${squads.snapshot.gameweek}`} />
      </LeagueShell>
    );
  }

  const state = roundState(squads.snapshot);
  // Under way, gaps between kickoffs included: "all played" is worth saying whenever the round is running.
  const underway = roundUnderway(squads.snapshot);

  const [mine, scoring] = await Promise.all([myTeamId(squads.period.teams), leagueScoring()]);
  const { scores, refused } = await liveScores(period);
  const pending = pendingByTeam(squads.period.teams, scoring?.rules ?? null, squads.snapshot, squads.display);
  const owed = [...pending.values()].reduce((total, team) => total + team.players, 0);

  // Yours first.
  const ordered = yoursFirst(pairings, (pairing) => pairingInvolves(pairing, mine));

  return (
    <LeagueShell current="matchups"
      // Gameweek, never period: one number under two names.
      sub={
        <>
          Gameweek {squads.snapshot.gameweek}
          {state === null ? null : <> · <RoundWord state={state} /></>}
        </>
      }
    >
      {refused !== null ? (
        <ScoreboardDown refused={refused} />
      ) : owed > 0 ? (
        <p className="px-3 text-2xs text-faint">Green: clean sheets, confirmed at full time.</p>
      ) : null}

      <ul className="cm-rows flex flex-col">
        {ordered.map((pairing) => (
          <li key={`${pairing.home.teamId}-${pairing.away.teamId}`}>
            <PairingCard
              pairing={pairing}
              scores={scores}
              pending={pending}
              mine={mine}
              underway={underway}
            />
          </li>
        ))}
      </ul>
    </LeagueShell>
  );
}
