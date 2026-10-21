import { DASH, ordinal } from "@epl/core";
import type { SetPieceRank } from "@epl/core";
import Section from "../../components/shell/Section";
import { ROW_FIGURE } from "@/app/desk";

// Where he stands in his club's penalty, free-kick and corner orders, as one line: first choice in CM's orange.

export default function SetPieces({ pieces, club }: { pieces: readonly SetPieceRank[]; club: string | null }) {
  // Nothing when he takes none: three dashes tell a phone nothing, and the club page lists the order.
  if (pieces.every((p) => p.rank === null)) return null;

  return (
    <Section title="Set pieces" aside={club === null ? undefined : `At ${club}`}>
      <dl className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${ROW_FIGURE}`}>
        {pieces.map((p) => (
          // A middle dot between pairs, drawn rather than written: a `<dl>` holds only its groups.
          <div key={p.piece} className={`flex items-baseline gap-1.5 ${SEPARATED}`} title={title(p)}>
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

/** A dot before every pair but the first. */
const SEPARATED = "[&+&]:before:text-faint [&+&]:before:content-['·']";

/** What his place is out of, or why there is none. */
function title(p: SetPieceRank): string {
  if (p.rank !== null) return `${ordinal(p.rank)} of ${p.of} takers`;
  return p.of === 0 ? "Nobody ranked yet" : `Not among the ${p.of} takers`;
}
