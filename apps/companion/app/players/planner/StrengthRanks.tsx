import { ordinal, type Club, type StrengthRank } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import Board, { type BoardFigure } from "../../components/league/Board";

// The planner's rankings: every club's own attack or defence at home and away, the weakest first, so 1 is the
// easiest to face and green means easy, as on the Attack and Defence boards (Craig, 30 Sep 2026).

export default function StrengthRanks({
  table,
  clubs,
}: {
  table: readonly StrengthRank[];
  /** The clubs, by FPL code, for the crest and the name. */
  clubs: ReadonlyMap<number, Club>;
}) {
  return (
    <Board
      rows={table}
      keyOf={(row) => String(row.code)}
      lead={{
        index: { label: "Rank", of: (_, at) => ordinal(at + 1), className: "text-2xs", wide: true },
        name: {
          label: "Club",
          of: (row) => {
            const club = clubs.get(row.code);
            return <span className="cm-row flex min-h-9 items-center gap-1.5 px-1.5 lg:min-h-7">{club ? <ClubLabel club={club} /> : row.club}</span>;
          },
        },
      }}
      columns={[
        { key: "home", head: "Home", width: "w-16", bare: true, cell: (row) => rank(row.home) },
        { key: "away", head: "Away", width: "w-16", bare: true, cell: (row) => rank(row.away) },
      ]}
    />
  );
}

/** A rank on the ease ramp's ground. */
function rank(value: number): BoardFigure {
  const { ground, ink } = easeGround(value);
  return {
    value: (
      <span className="flex min-h-9 items-center justify-center lg:min-h-7" style={{ background: ground }}>
        {ordinal(value)}
      </span>
    ),
    className: `numeric border-l border-bg p-0 text-center text-xs font-bold ${ink}`,
  };
}
