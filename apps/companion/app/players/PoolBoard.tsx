import BoardKey from "../components/league/BoardKey";
import Link from "@/app/components/shell/Link";
import ScoutShell, { POOL_ROWS } from "./Shell";
import PlayerTable from "./PlayerTable";
import BoardBar from "./BoardBar";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { readerTeamId } from "../squads";
import {
  activeSort,
  boardHref,
  isPer90,
  playersQuery,
  shownRows,
  type PlayersSearchParams,
} from "./query";
import { ALL_ROWS, pageRows } from "./pageRows";
import { wayOut } from "./wayOut";
import { columnsIn, groupFor, platesFor, sortableIn } from "./groups";
import { boardView, type BoardName } from "./views";
import { leagueInfo } from "../round";
import { figureOf } from "./figure";
import { DEFCON_POINTS } from "./columns";
import { defconPricing, poolPositions } from "../defcon";
import { attributeStats } from "./attributeColumns";
import { SEASON_COLUMNS, seasonStats } from "./seasonColumns";
import { intelStats, intelStatsDay } from "../intel";
import { divisionGrids } from "./[fantraxId]/grid";
import { cutsFor } from "./standout";
import { FANTRAX_PLAYERS_PATH, playerByCode } from "@epl/core";
import { footballNow } from "../football";
import OutLink from "../components/shell/OutLink";
import FantraxSilent from "../components/shell/FantraxSilent";
import { NOTE_LINK, QUIET_NOTE } from "@/app/desk";
import { fantraxPage } from "../fantraxPages";

// Every player Fantrax knows and who holds him in our league, under one board's share of the figures: Players, what
// Fantrax scores him under our scoring; Adv Stats, everything else we hold on him.

export default async function PoolBoard({
  board,
  searchParams,
}: {
  board: BoardName;
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines, reader, grids, pricing, info] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
    readerTeamId(),
    divisionGrids(),
    defconPricing(),
    leagueInfo(),
  ]);
  const query = playersQuery(asked);
  const view = boardView(board, info?.scoringCategories ?? {});

  // The raw counts by Fantrax id; the fantasy figures ride on `PoolRow`, and the two never overlap.
  const raw = new Map(lines.map((line) => [line.fantraxId, line.stats]));

  if ("unavailable" in pool) {
    return (
      <ScoutShell current={board} rows={POOL_ROWS}>
        <FantraxSilent code={pool.unavailable} />
      </ScoutShell>
    );
  }

  // Our ratings, our DefCon points and the stats league's season ride in the same bag, so they sort like any count.
  const defcon = pricing?.(poolPositions(pool.rows));
  for (const row of pool.rows) {
    const id = row.entry.player.fantraxId;
    const code = row.fplCode;
    const grid = code === null ? undefined : grids.get(code);
    const ours = {
      ...(grid === undefined ? {} : attributeStats(grid)),
      ...(defcon === undefined ? {} : { [DEFCON_POINTS]: defcon[id] }),
      ...seasonStats(code === null ? undefined : intelStats.get(code)),
    };
    if (Object.keys(ours).length > 0) raw.set(id, { ...raw.get(id), ...ours });
  }

  const shown = shownRows(pool.rows, query, raw, view);
  const capped = pageRows(shown, query);
  const way = wayOut(query, view.route);

  const scored = new Set(lines.flatMap((line) => Object.keys(line.stats)));
  // An empty set keeps every column, so ours joins only one the read filled.
  if (defcon !== undefined && scored.size > 0) scored.add(DEFCON_POINTS);
  // Players is the league's own few figures, so it needs no plates and no rate (Craig, 16 Oct 2026).
  const players = board === "pool";
  const plates = players ? [] : platesFor(sortableIn(view.columns, scored));
  const group = groupFor(query.group, plates);
  const rated = players ? null : isPer90(query);
  const columns = columnsIn(view.columns, group, activeSort(query, view).column.key, scored);

  // Cut over the rows drawn, so a mark means the top of what is in front of you.
  const cuts = cutsFor(
    columns.filter((column) => column.mark !== undefined),
    (column) =>
      capped.map((row) => {
        const value = figureOf(column, row, raw.get(row.entry.player.fantraxId), rated === true);
        return typeof value === "number" ? value : null;
      }),
  );

  // Every club with a man in the pool, so no option empties the board.
  const clubs = [
    ...new Set(pool.rows.map((row) => row.entry.player.clubCode).filter(Boolean)),
  ].sort() as string[];

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // A man with no status has no chip to count under.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <ScoutShell current={board} rows={POOL_ROWS}>
      {/* While the board is a picker every row's link has changed, so it says so, with a way out. */}
      {query.compare ? (
        <p className="flex flex-wrap items-center gap-2 border border-accent bg-surface px-3 py-2 text-sm">
          <span className="font-bold text-accent">Pick the second player.</span>
          <Link href={view.route} className="underline">
            Cancel
          </Link>
        </p>
      ) : null}

      <BoardBar
        query={query}
        view={view}
        plates={plates}
        group={group}
        positions={pool.positions}
        clubs={clubs}
        counted={counted}
        rated={rated}
        shown={shown.length}
        scored={scored}
      />

      {/* A column headed FPts that silently became a projection would be the confident wrong answer (DESIGN §7). */}
      {pool.season?.projected ? (
        <p className="text-2xs font-bold text-accent">{pool.season.name || "This season"}, projected</p>
      ) : null}

      {shown.length === 0 ? (
        <p className="flex min-h-11 flex-wrap items-center gap-x-2 border border-line bg-surface px-3 py-1 text-sm text-muted">
          Nobody in the pool matches that.
          {way === null ? null : (
            <Link href={way.href} className={`inline-flex min-h-11 items-center ${NOTE_LINK}`}>
              {way.label}
            </Link>
          )}
        </p>
      ) : (
        <PlayerTable
          rows={capped}
          columns={columns}
          query={query}
          view={view}
          teamNames={pool.teamNames}
          reader={reader}
          raw={raw}
          rated={rated === true}
          cuts={cuts}
          footballers={playerByCode(await footballNow())}
        />
      )}

      {capped.length < shown.length ? (
        <p className={QUIET_NOTE}>
          First {capped.length} of {shown.length} ·{" "}
          <Link href={boardHref(query, { all: ALL_ROWS }, view.route)} className={NOTE_LINK}>
            Show all
          </Link>
        </p>
      ) : null}
      {shown.length === 0 ? null : <BoardKey entries={columns.filter((column) => column.key !== "name")} />}

      {/* The stats league's file is daily, so a gameweek in play runs ahead of it. */}
      {shown.length > 0 && columns.some((column) => SEASON_COLUMNS.includes(column)) ? (
        <p className={QUIET_NOTE}>Season to {intelStatsDay}.</p>
      ) : null}

      {/* A points read that did not answer; its tell on the element. */}
      {pool.statsRefused ? (
        <p className={QUIET_NOTE} data-code={pool.statsRefused}>
          No points right now.
        </p>
      ) : null}

      {/* Claims happen on Fantrax: their players list, on the path taken off a real session. */}
      <OutLink href={fantraxPage(FANTRAX_PLAYERS_PATH)}>
        Claim on Fantrax
      </OutLink>
    </ScoutShell>
  );
}
