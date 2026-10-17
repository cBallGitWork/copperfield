import { DASH, crestForShortName, fixed, gameweekSpan } from "@epl/core";
import Board from "../../components/league/Board";
import LeadFace, { LEAD_LINK } from "../../components/league/LeadFace";
import NameLink from "../../prem/club/[code]/NameLink";
import { Holder } from "../BoardRow";
import { standoutInk } from "../../components/league/standout";
import { cutsFor } from "../standout";
import { playerHref } from "../routes";
import { projectionFigure, type ProjectionRow, type ProjectionSort } from "./rows";

// The model's table: minutes, the total and each week of the window, lit in ink like every Data board. The phone
// carries position on the name's second line; the desk adds CM's tile.

export default function ProjectionBoard({
  rows,
  gameweeks,
  category,
  sort,
  descending,
  href,
  teamNames,
  reader,
}: {
  rows: readonly ProjectionRow[];
  gameweeks: readonly number[];
  /** What the week columns hold, for the heads' titles. */
  category: string;
  sort: ProjectionSort;
  descending: boolean;
  /** Where a head's sort link points, given its key and the direction it would set. */
  href: (key: ProjectionSort, descending: boolean) => string;
  teamNames: ReadonlyMap<string, string>;
  /** The reader's own team, so his men read "Yours"; null for a reader with no team. */
  reader: string | null;
}) {
  const heads = projectionHeads(category, gameweeks);
  // Lit as the Players board lights a column: its best in orange, the rest of its top sixth in yellow.
  const cuts = cutsFor(
    heads.filter((head) => head.key !== "xmins"),
    (head) => rows.map((row) => projectionFigure(row, head.key, gameweeks)),
  );

  return (
    <Board
      compact
      rows={rows}
      keyOf={(row) => String(row.code)}
      lead={{
        tile: { positions: (row) => row.positions, free: (row) => row.fantraxId !== null && row.ownerTeamId === null, deskOnly: true },
        name: { label: "Player", of: (row) => <Lead row={row} teamNames={teamNames} reader={reader} /> },
      }}
      order={{ key: sort, descending, href: (key) => href(key, key === sort ? !descending : true) }}
      columns={heads.map((head) => ({
        key: head.key,
        head: head.label,
        title: head.title,
        cell: (row: ProjectionRow) => {
          const figure = projectionFigure(row, head.key, gameweeks);
          const ink =
            figure === null || figure === 0
              ? "text-faint"
              : head.key === "xmins"
                ? ""
                : standoutInk(figure, cuts.get(head.key), "high");
          return {
            value: figure === null ? DASH : head.key === "xmins" ? figure : fixed(figure, "projected"),
            className: `${head.key === "tot" ? "font-bold" : ""} ${ink}`,
          };
        },
      }))}
    />
  );
}

/** His crest, name, position and who holds him, as the Players board prints them; a link when the pool has him. */
function Lead({ row, teamNames, reader }: { row: ProjectionRow; teamNames: ReadonlyMap<string, string>; reader: string | null }) {
  return (
    <NameLink href={row.fantraxId === null ? null : playerHref(row.fantraxId)} className={LEAD_LINK}>
      <LeadFace
        crest={crestForShortName(row.club)}
        name={row.fullName}
        positions={row.positions}
        after={<Holder held={row} teamNames={teamNames} reader={reader} className="max-lg:hidden" />}
        under={<Holder held={row} teamNames={teamNames} reader={reader} className="lg:hidden" />}
      />
    </NameLink>
  );
}

/** The board's heads: minutes first, then the total, then the weeks (Craig, 24 Sep 2026). */
export function projectionHeads(
  category: string,
  gameweeks: readonly number[],
): { key: ProjectionSort; label: string; title: string }[] {
  return [
    { key: "xmins", label: "xMins", title: "Expected minutes a week" },
    { key: "tot", label: "Tot", title: `${category}, ${gameweekSpan(gameweeks)} added up, at his best slot` },
    ...gameweeks.map((gw) => ({ key: `gw${gw}`, label: String(gw), title: `Gameweek ${gw}: ${category}, projected` })),
  ];
}
