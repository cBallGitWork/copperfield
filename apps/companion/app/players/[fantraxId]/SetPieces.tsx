import { DASH, ordinal } from "@epl/core";
import type { SetPieceRank } from "@epl/core";
import Section from "../../components/shell/Section";
import { ROW_FIGURE } from "@/app/desk";

// Where he stands in his club's penalty, free-kick and corner orders, three cells in a row: first choice in CM's orange.

export default function SetPieces({ pieces, club }: { pieces: readonly SetPieceRank[]; club: string | null }) {
  // Nothing when he takes none: three dashes tell a phone nothing, and the club page lists the order.
  if (pieces.every((p) => p.rank === null)) return null;

  return (
    <Section title={club === null ? "Set pieces" : `Set pieces at ${club}`}>
      {/* Three cells ruled apart, never a `·` string (DESIGN §10.4); a phone stacks them. */}
      <dl className={`grid grid-cols-1 sm:grid-cols-3 ${ROW_FIGURE}`}>
        {pieces.map((p) => (
          <div
            key={p.piece}
            className="flex items-baseline justify-between gap-1.5 border-line px-1 py-0.5 sm:border-l sm:px-3 sm:first:border-l-0"
            title={title(p)}
          >
            <dt className="text-muted">{p.label}</dt>
            <dd className={`numeric font-bold ${p.rank === null ? "text-faint" : p.rank === 1 ? "text-peak" : "text-ink"}`}>
              {p.rank === null ? DASH : ordinal(p.rank)}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** What his place is out of, or why there is none. */
function title(p: SetPieceRank): string {
  if (p.rank !== null) return `${ordinal(p.rank)} of ${p.of} takers`;
  return p.of === 0 ? "Nobody ranked yet" : `Not among the ${p.of} takers`;
}
