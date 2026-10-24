import { ordinal, venueMark, type Club, type StrengthRank } from "@epl/core";
import ClubLabel from "../../components/football/ClubLabel";
import { easeGround } from "../../components/football/ease";
import Board, { type BoardFigure } from "../../components/league/Board";
import { READ_LINE } from "@/app/desk";

// The planner's rankings: every club's own attack or defence, the best first and 1 the best, on the ease ramp's ground,
// so 1 is red: hardest to face (Craig, 24 Oct 2026). One rank a club, home and away apart only where they differ.

export default function StrengthRanks({
  table,
  clubs,
}: {
  table: readonly StrengthRank[];
  /** The clubs, by FPL code, for the crest and the name. */
  clubs: ReadonlyMap<number, Club>;
}) {
  // `table` runs weakest first, ranked by ease; a club's place is one more than the clubs stronger than it.
  const place = (ease: number, venue: "home" | "away") => 1 + table.filter((row) => row[venue] > ease).length;
  return (
    <Board
      rows={[...table].reverse()}
      keyOf={(row) => String(row.code)}
      lead={{
        name: {
          label: "Club",
          of: (row) => {
            const club = clubs.get(row.code);
            return <span className="cm-row flex items-center gap-1.5 px-1.5">{club ? <ClubLabel club={club} /> : row.club}</span>;
          },
        },
      }}
      columns={[{ key: "rank", head: "Rank", width: "w-20", bare: true, cell: (row) => rank(row, place) }]}
    />
  );
}

/** A club's rank on the ease ramp's ground, or its home and away ranks side by side, each on its own. */
function rank(row: StrengthRank, place: (ease: number, venue: "home" | "away") => number): BoardFigure {
  const home = { at: place(row.home, "home"), ease: row.home };
  const away = { at: place(row.away, "away"), ease: row.away };
  const places: { at: number; ease: number; home?: boolean }[] =
    home.at === away.at && home.ease === away.ease ? [home] : [{ ...home, home: true }, { ...away, home: false }];
  return {
    value: (
      <span className="flex gap-px">
        {places.map(({ at, ease, home }) => (
          <Place key={String(home)} at={at} ease={ease} mark={home === undefined ? null : venueMark(home)} />
        ))}
      </span>
    ),
    className: "numeric border-l border-bg p-0 text-center text-xs font-bold",
    title: places.length === 1 ? undefined : `${ordinal(home.at)} at home, ${ordinal(away.at)} away`,
  };
}

/** One place on its ease rank's ground, its venue under it at every width. */
function Place({ at, ease, mark }: { at: number; ease: number; mark: string | null }) {
  const { ground, ink } = easeGround(ease);
  return (
    <span
      className={`flex flex-1 flex-col items-center justify-center leading-none ${READ_LINE} ${ink}`}
      style={{ background: ground }}
    >
      {ordinal(at)}
      {mark === null ? null : <span className="text-3xs font-normal">{mark}</span>}
    </span>
  );
}
