import Link from "@/app/components/shell/Link";
import { crestForShortName, fixed, toFplClubCode, DASH } from "@epl/core";
import type { FootballPlayer } from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { figureOf } from "./figure";
import { underFloor } from "./floors";
import { standoutInk, type StandoutCut } from "../components/league/standout";
import { compareHref, playerHref } from "./routes";
import { statusesOf, type PlayersQuery } from "./query";
import type { BoardFigure } from "../components/league/Board";
import LeadFace, { LEAD_LINK } from "../components/league/LeadFace";
import { Holder } from "./BoardRow";
import StateBox from "../components/football/StateBox";

// One row of the pool board: the lead (crest, name, and who holds him) and the figures beside it, lit in ink (DESIGN §3).

/** The pinned lead: his club's crest, his name, and under it his position and who holds him; or all of that on one
 *  line (`line`), the phone's row over his figures. */
export function Lead({
  row,
  query,
  teamNames,
  reader,
  footballer,
  line = false,
}: {
  row: PoolRow;
  query: PlayersQuery;
  teamNames: Map<string, string>;
  reader: string | null;
  /** The footballer behind him, for his status tile; null where the bridge has not settled him. */
  footballer: FootballPlayer | null;
  line?: boolean;
}) {
  const { player } = row.entry;
  const filtered = statusesOf(query) ?? [];
  // With a first man chosen (`?compare=`) the board is the picker, and a row completes the pair.
  const href =
    query.compare && query.compare !== player.fantraxId
      ? compareHref({ a: query.compare, b: player.fantraxId })
      : playerHref(player.fantraxId);

  const holder = (className: string) => (
    <Holder held={row.entry} teamNames={teamNames} reader={reader} className={className} filtered={filtered} />
  );
  const state = <StateBox player={footballer} />;

  // The holder after the name on a desk (Craig, 24 Sep 2026), after the position under a thumb (1 Oct 2026).
  const face = (
    <LeadFace
      line={line}
      crest={crestForShortName(toFplClubCode(player.clubCode ?? ""))}
      name={player.displayName}
      short={player.rawName || player.displayName}
      positions={row.entry.eligiblePositions}
      after={line ? state : <>{holder("max-lg:hidden")}{state}</>}
      under={holder(line ? "" : "lg:hidden")}
    />
  );
  return line ? (
    <Link href={href} className={LINE_LINK}>
      <span className={LINE_BAND}>{face}</span>
    </Link>
  ) : (
    <Link href={href} className={LEAD_LINK}>
      {face}
    </Link>
  );
}

/** The name line's link (`Board`'s `line`): a row's 36 for a thumb, hanging past Board's 20px line over the figures row. */
const LINE_LINK = "block min-h-9 w-full px-1.5 text-left hover:underline";

/** Its face, in the line's own 20px. */
const LINE_BAND = "flex h-5 items-center gap-2";

/** One figure, lit in ink when it stands out; a nought quiet, an absence a dash. */
export function figureCell(
  column: PoolColumn,
  row: PoolRow,
  stats: RawStats,
  rated: boolean,
  cut: StandoutCut | undefined,
): BoardFigure {
  const value = figureOf(column, row, stats, rated);
  if (value === null) return { value: DASH, className: "text-faint" };
  const figure = Number(value);
  const printed = rated && column.rate === true ? fixed(figure, "perNinety") : column.places ? fixed(figure, column.places) : String(value);
  // Zero is a stat, and a quiet one; so is a rate under its floor.
  if (figure === 0 || underFloor(column, stats, rated)) return { value: printed, className: "text-faint" };
  return { value: printed, className: column.derived ? "text-info" : column.mark ? standoutInk(figure, cut, column.mark) : "" };
}
