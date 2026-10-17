import Board from "../../../components/league/Board";
import { LEAD_BOX } from "../../../components/league/LeadFace";
import Link from "@/app/components/shell/Link";
import { clubStats, leagueTable, ordinal, printed } from "@epl/core";
import Nothing from "../../../components/shell/Nothing";
import PremShell from "../../Shell";
import { clubHref } from "../../routes";
import { TEAM_STATS } from "../../PremNav";
import QuerySelect from "../../../components/shell/QuerySelect";
import { CATEGORIES, categoryFor, type Club } from "./categories";
import { footballNow, seasonFixtures } from "../../../football";
import ClubLabel from "@/app/components/football/ClubLabel";
import { premTitled } from "../../../titles";

// Every club ranked by one measure at a time: a leaderboard, not a spreadsheet.
// Every figure is FPL's and the caption says so, as Fantrax counts the same men differently.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

/** Next 16 hands these as a Promise, so it is awaited like `params`. */
type Search = Promise<{ cat?: string }>;

const CATEGORY_OPTIONS = CATEGORIES.map((entry) => ({ value: entry.key, label: entry.label }));

export const metadata = premTitled("teamStats");

export default async function TeamStatsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const category = categoryFor(query.cat);

  const [snapshot, fixtures] = await Promise.all([footballNow(), seasonFixtures()]);
  const table = leagueTable(fixtures, snapshot.clubs);
  const stats = new Map(
    clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club]),
  );

  const clubs: Club[] = table.flatMap((row) => {
    const club = stats.get(row.clubId);
    // Both halves or neither: a row with a record and no squad would print a
    // nought against a club whose players we simply did not see.
    return club === undefined ? [] : [{ table: row, stats: club }];
  });

  if (clubs.length === 0) {
    return (
      <PremShell current="teamStats">
        <Nothing title="No clubs to rank" code="bootstrap-static → 0 teams" />
      </PremShell>
    );
  }

  // Ties break on table place, so level clubs never swap between refreshes.
  const board = clubs
    .map((club, place) => ({ club, place: place + 1, figure: category.of(club) }))
    .sort((a, b) =>
      (category.descending ? b.figure - a.figure : a.figure - b.figure) || a.place - b.place,
    );

  return (
    <PremShell current="teamStats" rows={clubs.length}>
      {/* The picker on its own strip. */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-1.5">
        <QuerySelect name="cat" label="Category" value={category.key} options={CATEGORY_OPTIONS} action={TEAM_STATS} />
      </div>

      {/* The head is pressed, not a link: the picker is what changes the order. */}
      <Board
        fixed
        rows={board}
        keyOf={({ club }) => String(club.table.clubId)}
        lead={{
          // Counts the board, not the table: the ranking the reader asked for.
          index: { label: "Place", of: (_, at) => ordinal(at + 1) },
          name: {
            label: "Club",
            of: ({ club }) => (
              <Link href={clubHref(club.table.code)} className={`${LEAD_BOX} gap-1.5`}>
                <ClubLabel club={club.table} />
              </Link>
            ),
          },
        }}
        order={{ key: category.key, descending: category.descending }}
        columns={[
          {
            key: category.key,
            head: category.label,
            title: category.title,
            width: "w-20 lg:w-32",
            // The accent: this is the board's one ordered column.
            cell: ({ figure }) => ({ value: printed(category, figure), className: "font-bold text-accent" }),
          },
        ]}
      />
    </PremShell>
  );
}
