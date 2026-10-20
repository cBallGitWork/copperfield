"use client";

import { useEffect, useState } from "react";
import Failed from "./Failed";
import { type Opposition, attackingStats, defensiveStats, fullMatchStats } from "@epl/core";
import { readMatchParts, type MatchRead } from "../../matchParts";
import { BLOCK_PLATE, FACT_LABEL, LABEL } from "@/app/desk";

// What he did in the match or gameweek shown, under a drop-down, all Opta's: the parts of what this league scores at
// his slot that Fantrax counts whole, then his attacking and defending, priced or not. Fantrax's own counts sit above.

/** A read that never settles is a failure after this long: a hung action left the panel empty. */
const READ_TIMEOUT_MS = 20_000;

/** A read still out, one that failed, or its answer. */
type Reading = MatchRead | null | "failed";

/** What came back from the action: a missing answer is a failure, never "no figures". */
export function settled(answer: MatchRead | null | undefined): MatchRead | "failed" {
  return answer ?? "failed";
}

export default function FullMatchStats({
  opta,
  position,
  opposition,
  over = false,
  open = false,
}: {
  opta: string | null;
  /** His roster slot, or his positions as "M/F". */
  position: string | null;
  opposition: readonly Opposition[] | undefined;
  /** Whether his matches are finished, so an empty read is final rather than "yet". */
  over?: boolean;
  /** Drawn open, as the live card wants its figures without a tap. */
  open?: boolean;
}) {
  const [read, setRead] = useState<Reading>(null);
  const [attempt, setAttempt] = useState(0);
  // Read again when a match starts, not on every poll that hands over the same fixtures afresh.
  const startedKey = JSON.stringify(
    (opposition ?? []).flatMap(({ fixture }) =>
      fixture.status === "upcoming" || fixture.gameweek === null ? [] : [{ gameweek: fixture.gameweek, code: fixture.code }],
    ),
  );
  useEffect(() => {
    let live = true;
    const fixtures = JSON.parse(startedKey) as { gameweek: number; code: number }[];
    // A rejection is a timeout, a refused provider or a deploy's stale action id: all three say so and offer a retry.
    const timer = setTimeout(() => live && setRead("failed"), READ_TIMEOUT_MS);
    readMatchParts({ opta, fixtures, position }).then(
      (answer) => live && setRead(settled(answer)),
      () => live && setRead("failed"),
    ).finally(() => clearTimeout(timer));
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [opta, position, startedKey, attempt]);
  const retry = () => {
    setRead(null);
    setAttempt((n) => n + 1);
  };

  return (
    <details className="group cm-panel" open={open}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 [&::-webkit-details-marker]:hidden">
        <span className={`min-w-0 flex-1 ${LABEL}`}>Full match stats</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <MatchFigures read={read} position={position} over={over} onRetry={retry} />
    </details>
  );
}

/** The drop-down's body: nothing while the read is out, a line where Opta has none for him. */
export function MatchFigures({
  read,
  position,
  over = false,
  onRetry,
}: {
  read: Reading;
  position: string | null;
  over?: boolean;
  onRetry?: () => void;
}) {
  if (read === null) return <p className="border-t border-line px-2 py-1.5 text-2xs text-muted">Getting his match figures…</p>;
  if (read === "failed") return <Failed onRetry={onRetry}>No match figures right now.</Failed>;
  const rows = fullMatchStats(read.parts, read.scored);
  const attacking = attackingStats(read.parts, position);
  const defensive = defensiveStats(read.parts, position);
  if (rows.length + attacking.length + defensive.length === 0) {
    return <p className="border-t border-line px-2 py-1.5 text-2xs text-muted">{over ? "No match figures for him." : "No match figures for him yet."}</p>;
  }
  return (
    <>
      {rows.length === 0 ? null : <Figures rows={rows.map((row) => ({ key: row.key, label: row.label, figure: row.value }))} />}

      {attacking.length === 0 ? null : (
        <>
          <h3 className={BLOCK_PLATE}>Attacking</h3>
          <Figures
            rows={attacking.map((row) => ({
              key: row.key,
              label: row.label,
              figure: row.of === null ? row.value : `${row.value}/${row.of}`,
            }))}
          />
        </>
      )}

      {defensive.length === 0 ? null : (
        <>
          <h3 className={BLOCK_PLATE}>Defensive</h3>
          <Figures rows={defensive.map((row) => ({ key: row.key, label: row.label, figure: row.value }))} />
        </>
      )}
    </>
  );
}

/** Label and figure in two columns, read down the left column, then the right. */
function Figures({ rows }: { rows: { key: string; label: string; figure: number | string }[] }) {
  return (
    <dl className="cm-rows columns-2 gap-0 border-t border-line [column-rule:1px_solid_var(--color-bg)]">
      {rows.map((row) => (
        <div key={row.key} className="flex min-h-8 break-inside-avoid items-center gap-2 px-2">
          <dt className={FACT_LABEL}>{row.label}</dt>
          <dd className="numeric shrink-0 text-sm font-bold">{row.figure}</dd>
        </div>
      ))}
    </dl>
  );
}
