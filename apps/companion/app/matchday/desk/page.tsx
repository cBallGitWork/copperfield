import {
  type LiveTeamScore,
  clubById,
  londonTime,
  fixturesInOrder,
  pairingInvolves,
  periodPairings,
  roundState,
} from "@epl/core";
import { Match, Pairing } from "./Rows";
import { headToHeadQuiet } from "./headToHead";
import RoundWord from "../../components/league/RoundWord";
import { footballNow, speaksForNow } from "../../football";
import { liveScores } from "../../scoreboard";
import { getLeagueSquads, readable, readerTeamId } from "../../squads";
import { marksFor } from "../../involvement";
import { yoursFirst } from "../../mine";
import PageHeader from "../../components/shell/PageHeader";
import Section from "../../components/shell/Section";
import { SCORES_DOWN } from "../../league/ScoreboardDown";
import { DESK_TITLE, titled } from "../../titles";

// Every league score and every Premier League score on one screen, read at arm's length.
// Nothing here is a link: each row is tappable elsewhere, and 44px rows would push it off one screen.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const metadata = titled(DESK_TITLE);

export default async function DeskPage() {
  const snapshot = await footballNow();
  const squads = await getLeagueSquads();
  const clubs = clubById(snapshot);
  const fixtures = fixturesInOrder(snapshot);

  const state = roundState(snapshot);

  // The football half needs no Fantrax: an undrafted or silent league costs the top section only.
  const league = readable(squads);
  const period = league?.roundPeriod ?? null;
  const pairings =
    league?.info != null && period !== null
      ? periodPairings(league.info.matchups, league.info.teams, period)
      : [];
  const quiet = headToHeadQuiet(squads, pairings);

  const mine = await readerTeamId();
  const { scores, refused } =
    period === null
      ? { scores: new Map<string, LiveTeamScore>(), refused: null }
      : await liveScores(period);

  const involved = league === null ? undefined : (await marksFor(league, fixtures)).mine;

  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={DESK_TITLE} sub={state === null ? undefined : <RoundWord state={state} />} />

      <Section title={`Gameweek ${snapshot.gameweek} · head-to-head`}>
        <Rows>
          {refused === null ? null : <Quiet code={refused}>{SCORES_DOWN}</Quiet>}
          {quiet !== null ? (
            <Quiet>{quiet}</Quiet>
          ) : (
            yoursFirst(pairings, (p) => pairingInvolves(p, mine)).map((pairing) => (
              <Pairing
                key={`${pairing.home.teamId}-${pairing.away.teamId}`}
                pairing={pairing}
                scores={scores}
                mine={mine}
              />
            ))
          )}
        </Rows>
      </Section>

      <Section title="The football">
        <Rows>
          {fixtures.length === 0 ? (
            <Quiet>No fixtures yet.</Quiet>
          ) : (
            fixtures.map((fixture) => (
              <Match
                key={fixture.id}
                fixture={fixture}
                clubs={clubs}
                yours={involved?.get(fixture.id)}
                now={speaksForNow(snapshot)}
              />
            ))
          )}
        </Rows>
      </Section>

      <p className="cm-panel px-2 py-1 text-center text-2xs text-faint">
        Updated {londonTime(snapshot.fetchedAt)}.
      </p>
    </div>
  );
}

/** A section's wall of one-line rows, split by hairlines. */
function Rows({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col divide-y divide-line">{children}</div>;
}

function Quiet({ children, code }: { children: React.ReactNode; code?: string }) {
  return (
    <p className="py-3 text-center text-xs text-muted" data-code={code}>
      {children}
    </p>
  );
}
