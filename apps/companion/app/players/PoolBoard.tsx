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
import { ALL_ROWS, litRows, nextStep, pageRows } from "./pageRows";
import { wayOut } from "./wayOut";
import { chosen } from "./boardChange";
import { columnsIn, groupFor, platesFor, sortableIn } from "./groups";
import { boardView, onPlate, type BoardName } from "./views";
import { leagueInfo } from "../round";
import { figureOf } from "./figure";
import { underFloor } from "./floors";
import { DEFCON_POINTS, headedFor, paidFor, ratedOn } from "./columns";
import { defconPricing, poolPositions } from "../defcon";
import { attributeStats } from "./attributeColumns";
import { DAILY_COLUMNS, expectedStats, seasonStats } from "./seasonColumns";
import ColumnKey from "./ColumnKey";
import { offeredFor } from "./sortOptions";
import { PRESSABLE, Plates } from "./BoardControls";
import BoardLink from "./BoardLink";
import { FootFrame } from "../components/shell/FootFrame";
import { heldShots, intelStats, intelStatsDay, shotCover } from "../intel";
import { divisionGrids } from "./[fantraxId]/grid";
import { cutsFor } from "./standout";
import { unlessSorted } from "../components/league/standout";
import { FANTRAX_PLAYERS_PATH, playerByCode } from "@epl/core";
import { footballNow, seasonFixtures } from "../football";
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
  const [pool, asked, lines, reader, grids, pricing, info, football, fixtures] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
    readerTeamId(),
    divisionGrids(),
    defconPricing(),
    leagueInfo(),
    footballNow(),
    // Without the season's fixtures nobody's shots can vouch for an npxG, which dashes.
    seasonFixtures().catch(() => null),
  ]);
  const query = playersQuery(asked);
  const footballers = playerByCode(football);

  // The raw counts by Fantrax id; the fantasy figures ride on `PoolRow`, and the two never overlap.
  const raw = new Map(lines.map((line) => [line.fantraxId, line.stats]));

  if ("unavailable" in pool) {
    return (
      <ScoutShell current={board} rows={POOL_ROWS}>
        <FantraxSilent code={pool.unavailable} />
      </ScoutShell>
    );
  }

  // Our ratings, our DefCon points and the season's figures ride in the same bag, so they sort like any count.
  const defcon = pricing?.(poolPositions(pool.rows));
  for (const row of pool.rows) {
    const id = row.entry.player.fantraxId;
    const code = row.fplCode;
    const grid = code === null ? undefined : grids.get(code);
    const footballer = code === null ? undefined : footballers.get(code);
    const ours = {
      ...(grid === undefined ? {} : attributeStats(grid)),
      ...(defcon === undefined ? {} : { [DEFCON_POINTS]: defcon[id] }),
      ...seasonStats(code === null ? undefined : intelStats.get(code)),
      ...(code === null || footballer === undefined
        ? {}
        : expectedStats(footballer, heldShots(code), shotCover(fixtures, footballer.clubId))),
    };
    if (Object.keys(ours).length > 0) raw.set(id, { ...raw.get(id), ...ours });
  }

  const scored = new Set(lines.flatMap((line) => Object.keys(line.stats)));
  // An empty set keeps every column, so ours joins only one the read filled.
  if (defcon !== undefined && scored.size > 0) scored.add(DEFCON_POINTS);
  // Players is the league's own few figures, so it needs no plates and no rate (Craig, 16 Oct 2026).
  const players = board === "pool";
  const whole = boardView(board, info?.scoringCategories ?? {});
  const plates = players ? [] : platesFor(sortableIn(whole.columns, scored));
  const group = groupFor(query.group, plates);
  const view = onPlate(whole, group);

  const shown = shownRows(pool.rows, query, raw, view);
  const capped = pageRows(shown, query);
  const step = nextStep(shown.length, query);
  const way = wayOut(query, view.route);
  const sorted = activeSort(query, view).column.key;
  // A position chip draws what that position scores, off the league's own prices (Craig, 21 Oct 2026).
  const drawn = paidFor(columnsIn(view.columns, group, sorted, scored), info?.scoring ?? null, chosen(query.pos), sorted);
  const rated = players ? null : ratedOn(drawn, isPer90(query));
  const columns = headedFor(drawn, rated);
  // Plain data, since the key is a client component: a column carries functions.
  const heads = columns.filter((column) => column.key !== "name").map(({ label, title, means }) => ({ label, title, means }));

  // Cut over the first hundred rows the query chose, so a short page keeps its inks as Show N more pages in.
  const cuts = unlessSorted(
    cutsFor(
      columns.filter((column) => column.mark !== undefined),
      (column) =>
        litRows(shown, capped).map((row) => {
          const stats = raw.get(row.entry.player.fantraxId);
          const value = figureOf(column, row, stats, rated === true);
          // A figure under its floor is never lit, so it never sets the cut either.
          return typeof value === "number" && !underFloor(column, stats, rated === true) ? value : null;
        }),
    ),
    sorted,
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

  const page = (
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
        positions={pool.positions}
        clubs={clubs}
        counted={counted}
        rated={rated}
        shown={shown.length}
        offered={offeredFor(view, scored, info?.scoring ?? null, chosen(query.pos), sorted)}
        glossary={<ColumnKey entries={heads} className={`${PRESSABLE} min-w-11`} />}
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
          footballers={footballers}
        />
      )}

      {/* A page more at a tap, in the URL beside Show all (M-SQUADS-1, Craig 20 Oct 2026). */}
      {step === null ? null : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <BoardLink query={query} change={{ set: { rows: step.rows } }} route={view.route} className={`${PRESSABLE} max-lg:w-full`}>
            Show {step.more} more
          </BoardLink>
          <p className={QUIET_NOTE}>
            First {capped.length} of {shown.length} ·{" "}
            <Link href={boardHref(query, { all: ALL_ROWS }, view.route)} className={NOTE_LINK}>
              Show all
            </Link>
          </p>
        </div>
      )}

      {/* The stats league's file is daily, so a gameweek in play runs ahead of it. */}
      {shown.length > 0 && columns.some((column) => DAILY_COLUMNS.includes(column)) ? (
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

  // Adv Stats' plates are its sub-views, so they switch from the foot (M-CONSIST-1, 20 Oct 2026).
  return plates.length === 0 ? (
    page
  ) : (
    <FootFrame foot={<Plates query={query} plates={plates} group={group} route={view.route} replace={query.panel === "1"} />}>
      {page}
    </FootFrame>
  );
}
