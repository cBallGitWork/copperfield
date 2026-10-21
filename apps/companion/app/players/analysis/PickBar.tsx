import Link from "@/app/components/shell/Link";
import PickField from "./PickField";
import { candidates } from "./pick";
import { SEASON_PARAM } from "./season";
import type { Candidate } from "./pick";
import type { PoolRow } from "../pool";
import { routeHref, type CompareRoute } from "./compareRoute";
import { QUIET_NOTE, ROW_NAME } from "../../desk";
import { ROW_LINK } from "../../components/league/TableCells";

// Choosing both men without leaving the screen (Craig, 10 Sep 2026): a box over each half, naming the man it would
// replace. On a player's own Compare A is the path's, and only B's box draws.

/** One side's state as the page read it. */
export interface Side {
  /** The man on this side now, or undefined before either is chosen. */
  chosen: string | undefined;
  /** What is in this side's box. */
  typed: string;
  /** Who this side is now, for the box's accessible name; the bar under the boxes prints it. */
  name: string | null;
  /** This side's completed season as the URL carries it; kept when the other side's man is swapped. */
  season: string | undefined;
}

export default function PickBar({
  rows,
  a,
  b,
  route,
}: {
  /** The pool, already cached for the board: nothing here costs Fantrax a call. */
  rows: readonly PoolRow[];
  a: Side;
  b: Side;
  route: CompareRoute;
}) {
  return (
    // One row at every width, each box over the half of the bar it would change (Craig, 24 Sep 2026); a fixed A has none.
    <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
      {route.fixed === undefined ? <Box side="a" mine={a} other={b} rows={rows} route={route} /> : null}
      <Box side="b" mine={b} other={a} rows={rows} route={route} className="col-start-2" />
    </div>
  );
}

/** One side: what it is called, its box, and what the box found. */
function Box({
  side,
  mine,
  other,
  rows,
  route,
  className = "",
}: {
  side: "a" | "b";
  mine: Side;
  other: Side;
  rows: readonly PoolRow[];
  route: CompareRoute;
  className?: string;
}) {
  const found = candidates(rows, mine.typed, other.chosen);

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <PickField
        side={side}
        query={mine.typed}
        action={route.base}
        placeholder="Name…"
        label={mine.name ? `Swap ${mine.name} for another player` : side === "a" ? "Find a player" : "Find a player to compare"}
      >
        {/* Everything the form does not own, so searching for one man cannot forget the other; a fixed A is the path's. */}
        {route.fixed === undefined ? <Carried name="a" value={side === "a" ? mine.chosen : other.chosen} /> : null}
        <Carried name="b" value={side === "b" ? mine.chosen : other.chosen} />
        <Carried name={side === "a" ? "qb" : "qa"} value={other.typed} />
        <Carried name={SEASON_PARAM[side === "a" ? "b" : "a"]} value={other.season} />
      </PickField>
      <Found side={side} mine={mine} other={other} found={found} route={route} />
    </div>
  );
}

/** What the box found, as links that swap this side and leave the other alone; a search that matches nobody says so. */
function Found({
  side,
  mine,
  other,
  found,
  route,
}: {
  side: "a" | "b";
  mine: Side;
  other: Side;
  found: Candidate[];
  route: CompareRoute;
}) {
  if (mine.typed.trim() === "") return null;

  if (found.length === 0) {
    return <p className={QUIET_NOTE}>No player of that name in the pool.</p>;
  }

  return (
    // Set as every tappable name in the app is, since a phone has no hover to say so.
    <ul className="cm-rows flex flex-col">
      {found.map((man) => (
        <li key={man.fantraxId}>
          <Link
            href={pickHref(side, man.fantraxId, other, route)}
            // Holds its place: the list collapses on the pick (Craig, 10 Sep 2026: "its annoying").
            scroll={false}
            className={`${ROW_LINK} px-1.5`}
          >
            <span className={`${ROW_NAME} min-w-0 truncate`}>{man.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Where picking a name goes: this side becomes him this season and its search is spent; the other side is kept. */
export function pickHref(side: "a" | "b", fantraxId: string, other: Side, route: CompareRoute): string {
  const [otherSide, otherSearch] = side === "a" ? (["b", "qb"] as const) : (["a", "qa"] as const);
  return routeHref(route, {
    [side]: fantraxId,
    [otherSide]: other.chosen,
    [otherSearch]: other.typed.trim(),
    [SEASON_PARAM[otherSide]]: other.season,
  });
}

/** One field of the query the form does not own, or nothing: an empty one would post `a=`, an id of "". */
export function Carried({ name, value }: { name: string; value: string | undefined }) {
  if (value === undefined || value.trim() === "") return null;
  return <input type="hidden" name={name} value={value} />;
}
