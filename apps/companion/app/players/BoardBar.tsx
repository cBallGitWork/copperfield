import { sortableIn } from "./groups";
import { activeSort } from "./query";
import { drawnCount } from "./pageRows";
import type { BoardChange } from "./boardChange";
import BoardLink from "./BoardLink";
import Search from "./Search";
import type { PlayersQuery } from "./query";
import type { BoardView } from "./views";
import { LABEL } from "@/app/desk";
import { Carried, clubOptions, Count, Figures, PRESSABLE, Positions } from "./BoardControls";
import { LoneStatuses, Statuses, loneCount, splitsBin } from "./StatusChips";
import QuerySelect from "../components/shell/QuerySelect";
import FilterSheet from "./FilterSheet";

// Every control at the top of a Data board. Under a thumb two fixed lines: the search and Filter, then position and
// who holds him (Craig, 16 Oct 2026), Adv Stats adding its Key beside Filter (its plates dock at the foot, `Plates`);
// on a desk one row from `xl`, with Per 90. The rest is in the filters, URL state (`?panel=1`), so a filtered board can be
// shared; while they are open a tap replaces the history entry, so one Back leaves them.

/** Reset: everything off and the sheet shut; a comparison's picker stays one. */
const RESET: BoardChange = { keep: ["compare"] };
const CLOSE: BoardChange = { set: { panel: "" } };
const FILTER: BoardChange = { toggle: ["panel", "1"] };

export default function BoardBar({
  query,
  view,
  positions,
  clubs,
  counted,
  rated,
  shown,
  scored,
  glossary = null,
}: {
  query: PlayersQuery;
  view: BoardView;
  /** The league's own position vocabulary, in pitch order. */
  positions: readonly string[];
  /** Every club with a player in the pool, in the order they are offered. */
  clubs: readonly string[];
  /** How many of the pool are in each Fantrax status, for the chips' titles. */
  counted: Map<string, number>;
  /** Whether the counts are per 90; null on a board with no such toggle. */
  rated: boolean | null;
  /** How many rows the filters leave, for the sheet's way back to the board. */
  shown: number;
  /** Every column the league's stat read carries, so the sort offers no count it does not score. */
  scored: ReadonlySet<string>;
  /** The board's key, beside Filter, where the board has one. */
  glossary?: React.ReactNode;
}) {
  const open = query.panel === "1";
  const route = view.route;
  const held = (query.club ? 1 : 0) + loneCount(query);
  const narrow = rated ? 1 : 0;
  // The button promises what the board draws.
  const drawn = drawnCount(shown, query);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* The rest of the query rides as hidden fields, the drawer's `panel` among them. */}
        <Search query={(query.q ?? "").trim()} action={route}>
          <Carried query={query} except={["q", "all"]} />
        </Search>

        {/* A line of its own under a thumb, so a press never reflows the row. */}
        <div className="flex flex-wrap gap-1.5 max-lg:order-last max-lg:basis-full">
          <Positions query={query} positions={positions} route={route} replace={open} />
          <Statuses query={query} counted={counted} route={route} replace={open} />
        </div>

        {rated === null ? null : (
          <div className="hidden xl:flex">
            <Figures query={query} rated={rated} route={route} replace={open} />
          </div>
        )}

        <div className="ml-auto flex gap-1.5">
          {glossary}
          <BoardLink query={query} change={FILTER} route={route} replace={open} aria-expanded={open} className={PRESSABLE}>
            Filter
            <Count sheet={held} wide={narrow} />
            <span aria-hidden>{open ? "▾" : "▸"}</span>
          </BoardLink>
        </div>
      </div>

      {open ? (
        <FilterSheet
          title="Filter players"
          close={CLOSE}
          foot={
            <div className="grid grid-cols-[1fr_2fr] gap-1.5">
              <BoardLink query={query} change={RESET} route={route} replace className={PRESSABLE}>
                Reset
              </BoardLink>
              <BoardLink query={query} change={CLOSE} route={route} replace className={PRESSABLE}>
                Show {drawn}
                {drawn < shown ? ` of ${shown}` : null} <span aria-hidden>▸</span>
              </BoardLink>
            </div>
          }
        >
          {splitsBin(counted) ? (
            <Block label="Status">
              <LoneStatuses query={query} counted={counted} route={route} />
            </Block>
          ) : null}

          <div className="grid grid-cols-2 gap-1.5">
            <Block label="Club">
              <QuerySelect
                name="club"
                label="Club"
                value={query.club ?? ""}
                options={clubOptions(clubs)}
                action={route}
                clears={["all"]}
                replace
              >
                <Carried query={query} except={["club", "all"]} />
              </QuerySelect>
            </Block>
            <Block label="Sort by">
              <QuerySelect
                name="sort"
                label="Sort by"
                value={activeSort(query, view).column.key}
                options={sortableIn(view.columns, scored).map((c) => ({ value: c.key, label: c.label }))}
                action={route}
                clears={["dir"]}
                replace
              >
                <Carried query={query} except={["sort", "dir"]} />
              </QuerySelect>
            </Block>
          </div>

          {/* The row carries it from `xl`; below it, only here. */}
          {rated === null ? null : (
            <div className="flex xl:hidden">
              <Figures query={query} rated={rated} route={route} replace />
            </div>
          )}
        </FilterSheet>
      ) : null}
    </>
  );
}

/** A labelled block in the sheet: CM's settings form, a word over each kind of control (`cm9900/03.jpg`). */
function Block({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className={LABEL}>{label}</p>
      {children}
    </div>
  );
}
