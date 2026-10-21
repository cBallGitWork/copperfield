import { defaultDescending, isSortKey, linesAfter, printedPlaces, seasonForm, sortRows, tableLines } from "@epl/core";
import { COLUMNS, leagueLine, leagueSortHref } from "./Columns";
import StandingsTable from "../components/league/StandingsTable";
import { getSeasonResults } from "./schedule/schedule";
import { leagueTable } from "../standings";
import Nothing from "../components/shell/Nothing";
import LeagueShell from "./Shell";
import { readerTeamId } from "../squads";
import { leagueInfo, readCalendar } from "../round";
import FantraxSilent from "../components/shell/FantraxSilent";
import { LEAGUE_CAPTION, titled } from "../titles";

// The table: Fantrax's record and points, never added up here, placed by the league's rule (`placeTable`).

export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ sort?: string; dir?: string }>;

export const metadata = titled(LEAGUE_CAPTION.table);

export default async function StandingsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown column falls back to Fantrax's order, so a stale shared link still shows the table.
  const sort = isSortKey(query.sort) ? query.sort : "rank";
  const descending = query.dir === undefined ? defaultDescending(sort) : query.dir === "desc";

  const [rows, mine, info, results, calendar] = await Promise.all([
    leagueTable(),
    readerTeamId(),
    leagueInfo(),
    // The season's results, for the form guide: a record is a total, a run is an order.
    getSeasonResults(),
    readCalendar(),
  ]);

  // Empty until Fantrax settles a round, and for a run that does not reproduce its record (`league/form.ts`).
  const form = new Map(
    ("unavailable" in rows ? [] : seasonForm(rows, info?.matchups ?? [], results)).map((team) => [
      team.teamId,
      team.run,
    ]),
  );

  if ("unavailable" in rows) {
    return (
      <LeagueShell current="table" teams={info?.teams.length}>
        <FantraxSilent code={rows.unavailable} />
      </LeagueShell>
    );
  }

  if (rows.length === 0) {
    return (
      <LeagueShell current="table" teams={info?.teams.length}>
        <Nothing title="No table yet" code="getStandings → 0 rows" />
      </LeagueShell>
    );
  }

  // Fantrax's playoff count places the semis; the rest is declared in core. No playoff, no lines, and none parts a tie.
  const lines = linesAfter(tableLines(info?.playoffs?.places ?? null, rows.length), rows);
  const places = printedPlaces(rows);

  return (
    <LeagueShell current="table" teams={info?.teams.length} flush>
      {/* A table wider than the phone scrolls sideways inside its own box. */}
      <StandingsTable
        columns={COLUMNS}
        sort={sort}
        descending={descending}
        sortHref={leagueSortHref(sort, descending)}
        lines={sortRows(rows, sort, descending).map((row) => ({
          ...leagueLine(row, { places, mine, form, calendar }),
          // Dashed yellow rules after `cm9900/24.jpg` (Craig, 31 Aug), only in Fantrax's order.
          cuts:
            sort === "rank" && !descending
              ? (lines.get(row.teamId) ?? []).map((line) => ({ label: line.label, tone: "border-accent/80" }))
              : [],
        }))}
      />
    </LeagueShell>
  );
}
