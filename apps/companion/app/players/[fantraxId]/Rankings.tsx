import type { Ranked } from "@epl/core";
import { DASH, fixed, ordinal } from "@epl/core";
import Section from "../../components/shell/Section";
import Board from "../../components/league/Board";

// Where his season totals rank among the men he is rated against (Craig, 25 Sep 2026:
// "rankings for data such as xg"): the totals on one row, his place on the next. His league points lead, ruled off
// from the football figures as the match log rules its two accounts apart.

const ROWS = ["Total", "Rank"] as const;

export default function Rankings({
  ranked,
  fpts,
  group,
}: {
  ranked: readonly Ranked[];
  /** His season's league points, placed among the same men; null where the pool is silent or a projection. */
  fpts: Ranked | null;
  group: string | null;
}) {
  const field = ranked[0]?.of ?? 0;
  if (field === 0) return null;

  return (
    <Section title="Rankings" aside={`Among ${field} ${group ?? "players"}`}>
      <Board
        rows={ROWS}
        keyOf={(row) => row}
        lead={{ index: { label: "Row", of: (row) => row, wide: true } }}
        columns={[...(fpts ? [fpts] : []), ...ranked].map((r, at) => ({
          key: r.head,
          head: r.head,
          title: r.title,
          rule: fpts !== null && at === 1,
          cell: (row: (typeof ROWS)[number]) =>
            row === "Total"
              ? { value: r.value === null ? DASH : fixed(r.value, r.kind), className: "font-bold" }
              : {
                  value: r.rank === null ? DASH : ordinal(r.rank),
                  className: `font-bold ${ink(r.rank, r.of)}`,
                  title: r.rank === null ? undefined : `${ordinal(r.rank)} of ${r.of}`,
                },
        }))}
      />
    </Section>
  );
}

/** Top of the group in CM's orange, its top tenth in amber, the rest in ink. */
function ink(rank: number | null, of: number): string {
  if (rank === null) return "text-faint";
  if (rank === 1) return "text-peak";
  return rank <= Math.max(3, Math.ceil(of / 10)) ? "text-mid" : "";
}
