import Link from "@/app/components/shell/Link";
import { toFplClubCode } from "@epl/core";
import type { PoolGroupKey, PoolPlate } from "./groups";
import { isChosen } from "./query";
import { filterChange, type BoardChange } from "./boardChange";
import BoardLink from "./BoardLink";
import type { QueryOption } from "../components/shell/QuerySelect";
import type { PlayersQuery } from "./query";
import { leaguePositionLabel } from "../positions";
import { SMALL_CAPS, heldPlate } from "@/app/desk";

// The pieces `BoardBar` arranges: the stat-group strip, the position chips, the figure chip, the badge that counts
// what is on, and the shapes they are drawn in. `BoardBar` decides where a control goes at a width; each here decides
// what it looks like and links to, so the row and the sheet render one element rather than two that can disagree.

/** Every field the board's URL can carry: a GET form posts only its own fields, so each renders the rest hidden
 *  (`Carried`) or using it clears the board. One list, because two had drifted and dropped `compare`. */
const FIELDS = [
  "compare",
  "q",
  "status",
  "pos",
  "sort",
  "dir",
  "all",
  "group",
  "per",
  "club",
  "panel",
  "cat",
] as const;

/** The rest of the query as hidden inputs for a GET form; `except` is the form's own field. */
export function Carried({
  query,
  except,
}: {
  query: PlayersQuery;
  except: readonly (typeof FIELDS)[number][];
}) {
  return (
    <>
      {FIELDS.filter((field) => !except.includes(field)).map((field) =>
        query[field] ? <input key={field} type="hidden" name={field} value={query[field]} /> : null,
      )}
    </>
  );
}

/** The geometry every control on this row shares (Craig, 10 Sep 2026: *"all buttons different sizes, we can CM
 *  this now"*): one recipe, the plates differing only in colour. Two pixels tighter a side under a thumb, so the
 *  status chips, Filter and the search share a 390 phone's row. Local to `players/`, where all its sites are. */
const PLATE =
  `flex shrink-0 items-center justify-center gap-1 whitespace-nowrap min-h-11 px-2 ${SMALL_CAPS} lg:min-h-9 lg:px-2.5`;

/** A plate you press, at rest: the `Filter` link, an unpressed `Chip` and the pick field's button. */
export const PRESSABLE = `${heldPlate(false)} ${PLATE}`;

/** Which columns are on the board: the one strip that stays blue, at the control floor (`cm-tab-quiet`). */
export function Plates({
  query,
  plates,
  group,
  route,
  replace,
  className,
}: {
  query: PlayersQuery;
  /** The plates this board offers, `All` first. */
  plates: readonly PoolPlate[];
  group: PoolGroupKey;
  route: string;
  /** Whether a tap replaces the history entry: while the sheet is open, so Back leaves it. */
  replace: boolean;
  /** The strip's layout: a row inline, a grid in the sheet. */
  className: string;
}) {
  return (
    // The `<nav>` is the landmark that names the strip; it travels with it.
    <nav aria-label="Stat groups" className={className}>
      {plates.map((entry) => {
        const change = { set: { group: entry.key === "all" ? "" : entry.key } };
        return (
          <BoardLink
            key={entry.key}
            query={query}
            change={change}
            route={route}
            replace={replace}
            aria-current={entry.key === group ? "page" : undefined}
            className={`cm-tab cm-tab-quiet ${PLATE}`}
          >
            {entry.label}
          </BoardLink>
        );
      })}
    </nav>
  );
}

/** The league's positions as grey plates on the row, a union as every filter is. */
export function Positions({
  query,
  positions,
  route,
  replace,
}: {
  query: PlayersQuery;
  /** The league's own position vocabulary, in pitch order. */
  positions: readonly string[];
  route: string;
  /** While the sheet is open, so Back leaves it. */
  replace: boolean;
}) {
  return (
    <div role="group" aria-label="Position" className="flex gap-1.5">
      {positions.map((position) => (
        <Chip
          key={position}
          on={isChosen(query, "pos", position)}
          query={query}
          change={filterChange("pos", position)}
          route={route}
          replace={replace}
        >
          {leaguePositionLabel(position)}
        </Chip>
      ))}
    </div>
  );
}

/** The per-90 toggle (Craig, 10 Sep 2026: "per 90 is just a toggle"); `per90` keeps its own one-match floor. */
export function Figures({
  query,
  rated,
  route,
  replace,
}: {
  query: PlayersQuery;
  rated: boolean;
  route: string;
  replace: boolean;
}) {
  const change: BoardChange = { toggle: ["per", "90"] };
  return (
    <Chip on={rated} query={query} change={change} route={route} replace={replace}>
      Per 90
    </Chip>
  );
}

/** How many of the board's settings the sheet holds that are on, so a shut sheet cannot hide a filtered board: the
 *  club, a lone half of the bin, and below `xl`, where the sheet carries them, Adv Stats' plate and Per 90. The sort is
 *  never counted; the table's head says it. Its slot keeps its width at nought, so Filter never moves. */
export function Count({ sheet, wide }: { sheet: number; wide: number }) {
  return (
    <>
      <Tally at="inline-block xl:hidden" total={sheet + wide} />
      <Tally at="hidden xl:inline-block" total={sheet} />
    </>
  );
}

function Tally({ at, total }: { at: string; total: number }) {
  return <span className={`numeric w-[1ch] text-center font-bold ${at}`}>{total === 0 ? "" : total}</span>;
}

/** One grey plate, its state said by the pressed bevel and a tick in its corner, both drawn off `aria-pressed` so a
 *  tap shows at once and a press never changes its width. The plate owns its ink, so never the accent. A board's chip
 *  is a `BoardLink`; Compare's is a plain link. */
export function Chip({
  on,
  title,
  children,
  ...to
}: {
  on: boolean;
  title?: string;
  children: React.ReactNode;
} & ({ href: string } | { query: PlayersQuery; change: BoardChange; route?: string; replace?: boolean })) {
  const className = `group relative min-w-11 cm-bevel aria-[pressed=false]:hover:brightness-110 ${PLATE}`;
  const face = (
    <>
      {/* `aria-pressed` already says it to a screen reader. */}
      <span aria-hidden className="absolute top-0.5 right-0.5 hidden text-[0.5rem] leading-none group-aria-pressed:inline">
        ✓
      </span>
      {children}
    </>
  );
  return "href" in to ? (
    <Link href={to.href} scroll={false} aria-pressed={on} title={title} className={className}>
      {face}
    </Link>
  ) : (
    <BoardLink {...to} on={on} title={title} className={className}>
      {face}
    </BoardLink>
  );
}

/** The club select's options: every club, then each by its code. */
export function clubOptions(codes: readonly string[]): QueryOption[] {
  // The filter keeps Fantrax's code; the menu prints FPL's ("BRE", not "BRF"), as every other screen does.
  const options = codes.map((code) => ({ value: code, label: toFplClubCode(code) }));
  return [{ value: "", label: "All clubs" }, ...options.sort((a, b) => a.label.localeCompare(b.label))];
}
