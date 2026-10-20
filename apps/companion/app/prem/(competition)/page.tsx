import {
  PREMIERSHIP_CUTS,
  clubStats,
  defaultDescendingTable,
  isTableSortKey,
  leagueTable,
  placed,
  sortTable,
} from "@epl/core";
import { COLUMNS, clubLine, premSortHref } from "../Columns";
import StandingsTable from "../../components/league/StandingsTable";
import PremShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import { footballNow, seasonFixtures } from "../../football";
import { premTitled } from "../../titles";

// The Premier League table, computed from fixtures: FPL's bootstrap leaves club records at nought.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ sort?: string; dir?: string }>;

export const metadata = premTitled("table");

export default async function TablePage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  // An unknown column from a stale shared link falls back to the competition's own order.
  const sort = isTableSortKey(query.sort) ? query.sort : "place";
  const descending =
    query.dir === undefined ? defaultDescendingTable(sort) : query.dir === "desc";

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const table = leagueTable(fixtures, snapshot.clubs);

  if (table.length === 0) {
    return (
      <PremShell current="table">
        <Nothing title="No clubs to rank" code="bootstrap-static → 0 teams" />
      </PremShell>
    );
  }

  // Each club's form, off the same fixtures as the table; no players, as no column here needs them.
  const form = new Map(
    clubStats(fixtures, snapshot.clubs, []).map((club) => [club.clubId, club.form]),
  );

  // Counted from the table, so the relegation line sits where a division of any size ends.
  const relegation = table.length - PREMIERSHIP_CUTS.relegate;

  return (
    // PRODUCT's 36px rows, as the league table's; `.cm-tight` sizes the shell's panel to them.
    <div className="cm-tight contents">
      <PremShell current="table" rows={table.length}>
        {/* A table wider than the phone scrolls inside its own box, not the page. */}
        <StandingsTable
          columns={COLUMNS}
          rows="tight"
          sort={sort}
          descending={descending}
          sortHref={premSortHref(sort, descending)}
          lines={sortTable(placed(table), sort, descending).map(({ row, place }) => ({
            ...clubLine(row, place, form.get(row.clubId) ?? []),
            // Labelled cut lines, never a shaded band (a tint reads as "yours"); accent is free here as nobody owns
            // a club. Only in the competition's own order.
            cuts: [
              ...(ordered(sort, descending) && place === PREMIERSHIP_CUTS.qualify && place < table.length
                ? [{ label: "Champions League", tone: "border-accent/80" }]
                : []),
              ...(ordered(sort, descending) && place === relegation && place < table.length
                ? [{ label: "Relegation", tone: "border-bad/80" }]
                : []),
            ],
          }))}
        />
      </PremShell>
    </div>
  );
}

/** Whether rows are in the competition's own order, the only one a cut line means anything in. */
function ordered(sort: string, descending: boolean): boolean {
  return sort === "place" && !descending;
}
