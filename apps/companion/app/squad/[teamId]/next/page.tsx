import TabEmpty from "../../../components/league/TabEmpty";
import TeamName from "../../../components/league/TeamName";
import { type LeagueTeam, NO_MINUTES, clubById, headToHeads, inkOn, lineupDetail, oppositionByClub } from "@epl/core";
import TeamShell from "../Shell";
import { SQUAD } from "../../routes";
import { identify, whoseTeam } from "../team";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../../squads";
import { planningRound } from "../../../round";
import { leagueTable } from "../../../standings";
import Link from "@/app/components/shell/Link";
import { LABEL, PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";
import { matchupHref } from "@/app/league/routes";
import { teamColours } from "@/app/teamColours";
import { placings } from "../../../league/placings";
import { UNAVAILABLE } from "../../../config";
import { teamTitle } from "../title";
import { myTeamId } from "../../../session";
import { FootFrame } from "../../../components/shell/FootFrame";
import { SquadList } from "../../../league/matchups/[teamId]/sides";
import { unplayedLists } from "../../../league/matchups/[teamId]/unplayed";
import { SideFoot, TieSides, sideOf, sideTabs } from "./sides";

// Who he plays: both sides on their own colours, as CM sets a match header (`cm9900/21.jpg`), then both line-ups as
// the head-to-head lists them before kickoff (Craig, 20 Oct 2026). Everything is already in the squads payload.

export const revalidate = 30;

export const generateMetadata = teamTitle("next");

export default async function NextMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  /** `side=opponent` opens a phone on the other side; the desk shows both. */
  searchParams: Promise<{ side?: string }>;
}) {
  const [{ teamId: slug }, query] = await Promise.all([params, searchParams]);
  const open = sideOf(query.side);
  // The whole read, not `leagueTeams`: this screen needs the matchups and the period too.
  const [read, table] = await Promise.all([
    getLeagueSquads(await planningRound()),
    leagueTable(),
  ]);
  const squads = readableOr404(read, SQUAD);

  const [{ team }, mine] = await Promise.all([whoseTeam(slug, squads.period.teams), myTeamId(squads.period.teams)]);
  const teamId = team.teamId;

  // Two in a double header, one under the other.
  const ties =
    squads.info !== null && squads.roundPeriod !== null
      ? headToHeads(squads.info.matchups, squads.info.teams, squads.roundPeriod, teamId)
      : [];

  const gameweek = squads.snapshot.gameweek;
  // Where each side stands, for the bracket under his name; no bracket when the table would not answer.
  const placing = placings(table);

  // A rival's eleven only once his period opens, as the head-to-head gates it; until then his squad, unarranged.
  const rostered = new Map(squads.period.teams.map((t) => [t.teamId, t]));
  const shows = (side: LeagueTeam) => teamDisplay(squads, side.teamId === mine).show === "lineup";
  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // No bench order: that is a Fantrax read per team, so a bench stands in position order here.
  const arranged = new Map(
    [...rostered].map(([id, roster]) => [id, lineupDetail(roster, clubs, opposition, null, NO_MINUTES)] as const),
  );
  const listsOf = (tie: (typeof ties)[number]) =>
    unplayedLists({ pairing: tie, rostered, shows, arranged, clubs, opposition });

  return (
    <TeamShell
      team={identify(team, slug)}
      current="next"
      empty={ties.length === 0 ? ["next"] : []}
    >
      {ties.length === 0 ? (
        <TabEmpty>{squads.info === null ? UNAVAILABLE : `${team.teamName} has no fixture this gameweek.`}</TabEmpty>
      ) : (
        <FootFrame foot={<SideFoot open={open} tabs={sideTabs(slug, ties[0].team, ties.map((tie) => tie.opponent))} />}>
          {ties.map((tie) => {
            const listed = listsOf(tie);
            return (
              <div key={tie.opponent.teamId} className="flex flex-col gap-2">
                <Fixture
                  gameweek={gameweek}
                  href={matchupHref(teamId, gameweek, undefined, tie.opponent.teamId)}
                  home={{ teamId: tie.team.teamId, name: tie.team.name, place: placing.get(tie.team.teamId) }}
                  away={{
                    teamId: tie.opponent.teamId,
                    name: tie.opponent.name,
                    place: placing.get(tie.opponent.teamId),
                  }}
                />
                <TieSides
                  open={open}
                  team={<SquadList listed={listed.get(tie.team.teamId)} teamId={tie.team.teamId} />}
                  opponent={<SquadList listed={listed.get(tie.opponent.teamId)} teamId={tie.opponent.teamId} />}
                />
              </div>
            );
          })}
        </FootFrame>
      )}
    </TeamShell>
  );
}

/** The two sides, each on its own colour; no ground, so the team whose screen this is reads first. */
function Fixture({
  gameweek,
  href,
  home,
  away,
}: {
  gameweek: number;
  /** The tie's head-to-head at this gameweek, where both squads are listed. */
  href: string;
  home: SideTeam;
  away: SideTeam;
}) {
  return (
    <section className={PANEL_FLUSH}>
      {/* The gameweek on an ordinary strip of its own (Craig, 2 Sep 2026); `cm-tab`, as the title bar carries a masthead's height. */}
      <div className="cm-tab flex items-center justify-center px-2 py-1">
        <span className={`numeric ${SMALL_CAPS} text-ink`}>Gameweek {gameweek}</span>
      </div>

      {/* The whole plate opens the tie's head-to-head, never a dead box (19 Oct 2026). */}
      <Link href={href} className="flex min-h-11 items-stretch gap-2 p-2 hover:bg-raised">
        <Side team={home} />
        <span className={`flex shrink-0 items-center px-1 font-chrome ${LABEL}`}>
          v
        </span>
        <Side team={away} />
      </Link>
    </section>
  );
}

interface SideTeam {
  teamId: string;
  name: string;
  /** Where he stands in the league, printed (`3rd`, `=1st`). Undefined when the table would not answer. */
  place: string | undefined;
}

function Side({ team }: { team: SideTeam }) {
  const colours = teamColours(team.teamId);
  return (
    <span
      className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center px-2 text-center leading-tight"
      style={{ background: colours.primary, color: inkOn(colours) }}
    >
      <span className="text-sm font-bold uppercase"><TeamName teamId={team.teamId} name={team.name} /></span>
      {/* His placing under his name, on his own plate (Craig, 2 Sep; `cm9900/25.jpg`). */}
      {team.place === undefined ? null : (
        <span className="numeric text-3xs font-bold opacity-80">({team.place})</span>
      )}
    </span>
  );
}
