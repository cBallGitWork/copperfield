import Board from "../../components/league/Board";
import Link from "@/app/components/shell/Link";
import {
  categoryFor,
  groupFor,
  leagueSeason,
  offeredIn,
  printedPlaces,
  rankBy,
  type Measure,
  type StatCategory,
  DASH,
  thousands,
} from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import { TIGHT_ROW } from "../../components/league/TableCells";
import GroupNav from "../../components/league/GroupNav";
import LeagueShell from "../Shell";
import Measures, { viewFor, type View } from "./Measures";
import { boardHref } from "./boardHref";
import { getSeasonStats } from "./seasonStats";
import { getSquadStats } from "./squadStats";
import { squadColumnsIn } from "./squadColumns";
import { intelStatsDay } from "../../intel";
import { getSchedule } from "../schedule/schedule";
import { readerTeamId } from "../../squads";
import { yoursInk } from "../../mine";
import { MINOR_LABEL, ROW_NAME } from "@/app/desk";
import { teamHref } from "@/app/squad/routes";
import FantraxSilent from "../../components/shell/FantraxSilent";
import TeamName from "../../components/league/TeamName";
import { LEAGUE_CAPTION, titled } from "../../titles";

// Every team against one group of scoring categories, ordered by the head pressed: CM's stat board on fantasy data.
// FPts and Total are Fantrax's for each lineup from the league's first pairing; Squad adds up the stats league's counts for the men each team holds.
// No owner column: Fantrax's teamInfo is `{name, id}` and we hold no list of managers (Craig, 1 Sep: "ditch the manager name").

export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string; by?: string; group?: string }>;

export const metadata = titled(LEAGUE_CAPTION.teamStats);

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // A category outside the group falls back to the group's first, so a shared link survives a regrouping.
  const group = groupFor(query.group);
  const view = viewFor(query.by);
  const squad = view === "squad";
  // A squad's counts are raw figures, so they rank as Total does.
  const measure: Measure = squad ? "value" : view;

  const [schedule, mine] = await Promise.all([getSchedule(), readerTeamId()]);

  if ("unavailable" in schedule) {
    return (
      <LeagueShell current="teamStats">
        <FantraxSilent code={schedule.unavailable} />
      </LeagueShell>
    );
  }

  const { info, rounds } = schedule;

  // The league's own gameweeks that have kicked off: the calendar's weeks before its first pairing are not its own.
  const season = leagueSeason(info);
  const begun = rounds.filter((round) => season !== null && round.period >= season.firstPeriod && round.started);
  const opening = rounds.find((round) => round.period === season?.firstPeriod);
  const lines = await (squad ? getSquadStats() : getSeasonStats(season));
  const columns = squad ? squadColumnsIn(group) : offeredIn(group, lines);
  const category = columns.find((entry) => entry.key === query.cat) ?? columns[0] ?? categoryFor(undefined);

  const board = rankBy(columns, lines, category, measure);
  const places = printedPlaces(board);
  // The league's own names, which stand when the standings do not.
  const named = new Map(info.teams.map((team) => [team.teamId, team.name]));
  const groupLabel = columns.map((entry) => entry.label).join(", ");

  return (
    <LeagueShell current="teamStats" teams={info.teams.length}>
      <div className="flex items-center justify-between gap-2">
        <Measures view={view} href={(by) => boardHref(by, group, category.key)} />
        {squad ? <p className={MINOR_LABEL}>Season to {intelStatsDay}</p> : null}
      </div>

      {!squad && begun.length === 0 ? (
        <Nothing title="No gameweek played yet" code={`getLeagueInfo → first pairing in period ${season?.firstPeriod ?? DASH}`}>
          Nothing counts until {opening === undefined ? "the league's first gameweek" : `Gameweek ${opening.gameweek}, the league's first`}.
        </Nothing>
      ) : board.length === 0 ? (
        squad ? (
          <Nothing title="No squads yet" code="getTeamRosters → no squads" />
        ) : (
          <Nothing title="Nothing recorded yet" code={`${begun.length} gameweeks begun`} />
        )
      ) : (
        <Board
          fixed
          caption={`Every team across ${groupLabel}, ordered by ${category.label} in ${ORDERED_BY[view]}`}
          rows={board}
          keyOf={(row) => row.teamId}
          rowClass={(row) => (row.teamId === mine ? "bg-raised" : "")}
          lead={{
            index: { label: "Place", of: (row) => places.get(row.teamId) ?? DASH },
            name: {
              label: "Team",
              of: (row) => (
                <Link href={teamHref(row.teamId)} className={`${TIGHT_ROW} px-1.5 hover:underline ${yoursInk(row.teamId === mine)}`}>
                  <span className={`min-w-0 truncate ${ROW_NAME}`}>
                    <TeamName teamId={row.teamId} name={named.get(row.teamId) ?? row.teamId} />
                  </span>
                </Link>
              ),
            },
          }}
          order={{
            key: category.key,
            descending: direction(category, measure) === "descending",
            href: (key) => boardHref(view, group, key),
          }}
          columns={columns.map((entry, at) => ({
            key: entry.key,
            head: entry.short,
            title: entry.title ?? entry.label,
            width: FIGURE_WIDTH,
            // Every figure is ink: the accent means "yours", and the pressed plate says which column sorts.
            cell: (row: (typeof board)[number]) => {
              const figure = row.figures[at] ?? null;
              return { value: figure === null ? DASH : thousands(figure), className: "text-ink" };
            },
          }))}
        />
      )}
      {/* Air between the last row and the foot row (Craig, 1 Sep). */}
      <div className="pt-2">
        <GroupNav group={group} href={(key) => boardHref(view, key)} />
      </div>
    </LeagueShell>
  );
}

/** Which way the board runs ordered by this column: `rankBy`'s call, said by the arrow. */
function direction(category: StatCategory, measure: Measure): "ascending" | "descending" {
  return measure === "value" && category.lowIsGood === true ? "ascending" : "descending";
}

/** One category's width: 48px carries May's six-character minutes and leaves a 390 phone 122px of name at four columns. */
const FIGURE_WIDTH = "w-12 lg:w-20";

/** How the caption says which way the board is ordered. */
const ORDERED_BY: Record<View, string> = {
  points: "fantasy points",
  value: "raw totals",
  squad: "the season counts of the men each team holds",
};
