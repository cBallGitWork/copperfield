import type { ReactNode } from "react";

// One side's line-up as a paper prints it: "Arsenal (4-3-3): Raya; White, Saliba; …." with the notes under it.

export default function LineupText({
  team,
  formation = null,
  notes = [],
  children,
}: {
  team: string;
  formation?: string | null;
  /** Lines under the eleven ("Bench", "Booked"); an empty list prints nothing. */
  notes?: { label: string; names: readonly string[] | string }[];
  /** The eleven, without the closing full stop. */
  children: ReactNode;
}) {
  return (
    <p className="text-2xs leading-snug text-ink">
      <span className="font-semibold">
        {team}
        {formation === null ? "" : ` (${formation})`}:
      </span>{" "}
      {children}.
      {notes.map(({ label, names }) =>
        names.length === 0 ? null : (
          <span key={label} className="block text-muted">
            {label}: {typeof names === "string" ? names : names.join(", ")}.
          </span>
        ),
      )}
    </p>
  );
}
