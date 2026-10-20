import { ordinal, venueMark, type Club, type StrengthRank } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import Board, { type BoardFigure } from "../../components/league/Board";

// The planner's rankings: every club's own attack or defence, the weakest first, so 1 is the easiest to face and green
// means easy, as on the Attack and Defence boards (Craig, 30 Sep 2026). One rank a club, home and away apart only where
// they differ (Craig, 20 Oct 2026).

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
        name: {
          label: "Club",
          of: (row) => {
            const club = clubs.get(row.code);
            return <span className="cm-row flex min-h-9 items-center gap-1.5 px-1.5 lg:min-h-7">{club ? <ClubLabel club={club} /> : row.club}</span>;
          },
        },
      }}
      columns={[{ key: "rank", head: "Rank", width: "w-20", bare: true, cell: rank }]}
    />
  );
}

/** A club's rank on the ease ramp's ground, or its home and away ranks side by side, each on its own. */
function rank(row: StrengthRank): BoardFigure {
  const places: { at: number; home?: boolean }[] =
    row.home === row.away ? [{ at: row.home }] : [{ at: row.home, home: true }, { at: row.away, home: false }];
  return {
    value: (
      <span className="flex">
        {places.map(({ at, home }) => (
          <Place key={String(home)} at={at} mark={home === undefined ? null : venueMark(home)} />
        ))}
      </span>
    ),
    className: "numeric border-l border-bg p-0 text-center text-xs font-bold",
    title: places.length === 1 ? undefined : `${ordinal(row.home)} at home, ${ordinal(row.away)} away`,
  };
}

/** One rank on its ground, its venue under it on a phone and beside it on a desk. */
function Place({ at, mark }: { at: number; mark: string | null }) {
  const { ground, ink } = easeGround(at);
  return (
    <span
      className={`flex min-h-9 flex-1 flex-col items-center justify-center leading-none lg:min-h-7 lg:flex-row lg:gap-1 ${ink}`}
      style={{ background: ground }}
    >
      {ordinal(at)}
      {mark === null ? null : <span className="text-3xs font-normal lg:text-2xs">{mark}</span>}
    </span>
  );
}
