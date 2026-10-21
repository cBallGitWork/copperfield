import Link from "@/app/components/shell/Link";
import { DASH, fixed, ordinal, toFantraxClubCode, venueMark, type PlannerCell, type PlannerRow, type PlannerView } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import Board, { type BoardColumn } from "../../components/league/Board";
import { LEAD_BOX } from "../../components/league/LeadFace";
import { POOL } from "../routes";

// Every club's next six opponents, a cell each on the ease ramp, easiest run first. Each names the venue, (H) or (A):
// under the code on a phone, beside it on a desk (Craig, 30 Sep 2026).

/** Where a club's name leads: its men on the Players board, the positions this view is about. */
const POSITIONS: Record<PlannerView, string> = { attack: "F,M", defence: "D,G" };

/** What a rank is of, for a cell's title. */
const THEIR: Record<PlannerView, string> = { attack: "defence", defence: "attack" };

/** The column the board is ordered by: the mean rank, easiest first. */
const MEAN = "avg";

export default function PlannerBoard({
  view,
  rows,
  gameweeks,
}: {
  view: PlannerView;
  rows: readonly PlannerRow[];
  gameweeks: readonly number[];
}) {
  const columns: BoardColumn<PlannerRow>[] = [
    ...gameweeks.map((gameweek, at) => ({
      key: `gw${gameweek}`,
      head: `GW${gameweek}`,
      bare: true,
      cell: (row: PlannerRow) => {
        const round = row.cells[at] ?? [];
        return {
          className: "border-l border-bg p-0 align-middle",
          value: round.length === 0 ? <Fixture view={view} cell={null} /> : round.map((cell, n) => <Fixture key={n} view={view} cell={cell} />),
        };
      },
    })),
    {
      key: MEAN,
      head: "Avg",
      title: `The mean rank of the ${gameweeks.length}, 1 the easiest`,
      width: "w-10 lg:w-12",
      // A mean of ordinals, to one place as a mark is printed.
      cell: (row) => ({ value: fixed(row.mean, "rating"), className: "font-bold text-info" }),
    },
  ];

  return (
    <Board
      fixed
      rows={rows}
      keyOf={(row) => String(row.club.code)}
      lead={{
        name: {
          label: "Club",
          width: "w-20",
          of: (row) => (
            <Link
              href={`${POOL}?club=${toFantraxClubCode(row.club.shortName)}&pos=${POSITIONS[view]}`}
              title={`${row.club.name}: its ${view === "attack" ? "forwards and midfielders" : "defenders and keepers"} on the board`}
              className={`${LEAD_BOX} gap-1.5`}
            >
              <ClubLabel club={{ ...row.club, name: row.club.shortName }} />
            </Link>
          ),
        },
      }}
      order={{ key: MEAN, descending: false }}
      columns={columns}
      className="[&_table]:min-w-[21.5rem]"
    />
  );
}

/** One fixture grounded on the ramp: the opponent, its venue and its rank as an ordinal, on one line on a desk and
 *  the venue and rank under the code on a phone, where a 37px cell cannot hold "20th" beside it. A blank round is a
 *  quiet hole. */
function Fixture({ view, cell }: { view: PlannerView; cell: PlannerCell | null }) {
  const { ground, ink } = easeGround(cell?.rank ?? null);
  if (cell === null) {
    return (
      <div className={`flex min-h-9 items-center justify-center text-2xs lg:min-h-7 ${ink}`} style={{ background: ground }} title="No match this gameweek">
        {DASH}
      </div>
    );
  }
  const code = cell.opponent.shortName;
  const rank = cell.rank === null ? DASH : ordinal(cell.rank);
  return (
    <div
      className={`numeric grid min-h-9 grid-cols-[auto_auto] content-center items-baseline justify-center gap-0.5 whitespace-nowrap text-2xs leading-none lg:flex lg:min-h-7 lg:items-center lg:gap-1 lg:px-1.5 lg:text-xs ${ink}`}
      style={{ background: ground }}
      title={`${cell.opponent.name} ${cell.home ? "at home" : "away"}${cell.rank === null ? "" : `: ${rank}-easiest ${THEIR[view]}`}`}
    >
      <span className="col-span-2 text-center">{code}</span>
      <span className="text-3xs lg:text-xs">{venueMark(cell.home)}</span>
      <span className="font-bold lg:ml-auto">{rank}</span>
    </div>
  );
}
