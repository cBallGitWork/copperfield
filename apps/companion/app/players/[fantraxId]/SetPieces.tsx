import { DASH, ordinal } from "@epl/core";
import type { SetPieceRank } from "@epl/core";
import Section from "../../components/shell/Section";
import Board from "../../components/league/Board";

// Where he stands in his club's penalty, free-kick and corner orders: first choice in CM's orange.

export default function SetPieces({ pieces, club }: { pieces: readonly SetPieceRank[]; club: string | null }) {
  // Nothing when he takes none: three dashes tell a phone nothing, and the club page lists the order.
  if (pieces.every((p) => p.rank === null)) return null;

  return (
    <Section title="Set pieces" aside={club === null ? undefined : `At ${club}`}>
      <Board
        rows={["Rank"]}
        keyOf={(row) => row}
        lead={{ index: { label: "Row", of: (row) => row, wide: true } }}
        columns={pieces.map((p) => ({
          key: p.piece,
          head: p.label,
          cell: () => ({
            value: p.rank === null ? DASH : ordinal(p.rank),
            className: `font-bold ${p.rank === null ? "text-faint" : p.rank === 1 ? "text-peak" : ""}`,
            title: p.rank !== null ? `${ordinal(p.rank)} of ${p.of} takers` : p.of === 0 ? "Nobody ranked yet" : `Not among the ${p.of} takers`,
          }),
        }))}
      />
    </Section>
  );
}
