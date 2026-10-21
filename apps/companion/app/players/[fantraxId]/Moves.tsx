import { DASH, fantraxDay } from "@epl/core";
import Section from "../../components/shell/Section";
import Board from "../../components/league/Board";
import { playerMoves } from "./dossier";

// Every claim, drop and trade this league has made with him, newest first, on the house table: the date in CM's
// index block, then the move and the two sides of it. On the Profile under his attributes (Craig, 21 Oct 2026).

/** Fantrax's own words for what happened, in ours. */
const KIND: Readonly<Record<string, string>> = { claim: "Claimed", drop: "Dropped", trade: "Traded" };

/** A step above a row's type, on every cell: DESIGN §6's third exception. */
const TYPE = "text-base lg:text-lg";

export default async function Moves({ fantraxId }: { fantraxId: string }) {
  const { moves } = await playerMoves(fantraxId);
  // A man the league has never moved has no business, and his transfer line already says how he joined.
  if (moves.length === 0) return null;
  return (
    <Section title="Business">
      <Board
        fit
        rows={moves}
        keyOf={({ transaction }) => `${transaction.setId}-${transaction.kind}-${transaction.processedAt ?? ""}`}
        rowClass={({ transaction }) => (transaction.executed ? "" : "text-faint")}
        lead={{
          index: { label: "Date", of: ({ transaction }) => fantraxDay(transaction.processedAt ?? "") ?? DASH, className: TYPE, wide: true },
        }}
        columns={[
          {
            key: "move",
            head: "Move",
            left: true,
            bare: true,
            cell: ({ transaction }) => ({
              className: `cm-row px-1.5 font-chrome font-bold ${TYPE}`,
              value: (
                <>
                  {KIND[transaction.kind] ?? transaction.kind}
                  {transaction.executed ? null : <span className="pl-2 text-2xs uppercase text-faint">Pending</span>}
                </>
              ),
            }),
          },
          {
            key: "from",
            head: "From",
            left: true,
            bare: true,
            cell: ({ transaction, fromName }) => ({ value: side(transaction.fromTeamId, fromName), className: `px-1.5 text-muted ${TYPE}` }),
          },
          {
            key: "to",
            head: "To",
            left: true,
            bare: true,
            cell: ({ transaction, toName }) => ({ value: side(transaction.toTeamId, toName), className: `px-1.5 text-ink ${TYPE}` }),
          },
        ]}
      />
    </Section>
  );
}

/** One side of a move: the pool where there is no team, a dash for a team we cannot name. */
function side(teamId: string | null, name: string | null): string {
  return teamId === null ? "The pool" : (name ?? DASH);
}
