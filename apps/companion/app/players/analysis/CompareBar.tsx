import type { CSSProperties } from "react";
import type { Club } from "@epl/core";
import { clubColoursOf, inkOn } from "@epl/core";
import PlayerPortrait from "../../components/football/PlayerPortrait";

// Two men at once, each on his own club's colour, neither half mirrored. `MatchBar`'s shape, copied: the second.

export default function CompareBar({ a, b }: { a: Side; b: Side | null }) {
  // One man is the whole bar, with no `v` (Craig, 10 Sep 2026).
  if (b === null) {
    return (
      <header className="flex items-stretch">
        <Half side={a} />
      </header>
    );
  }

  return (
    <header className="flex items-stretch">
      <Half side={a} />
      <span className="cm-bevel numeric flex min-h-20 w-8 shrink-0 items-center justify-center text-lg font-bold uppercase lg:min-h-28 lg:w-12 lg:text-3xl">
        v
      </span>
      <Half side={b} />
    </header>
  );
}

interface Side {
  name: string;
  club: Club | undefined;
  /** FPL's season-stable code, for the face; null draws his initials. */
  code: number | null;
}

/** One man's half: his face, then his name, on his club's plate. */
function Half({ side }: { side: Side }) {
  const colours = clubColoursOf(side.club);
  const ink = inkOn(colours);

  return (
    // A bigger face than anywhere else (Craig, 10 Sep 2026), through `--row-portrait`, and `large` so it stays sharp.
    <div
      className="flex min-h-20 min-w-0 flex-1 items-center gap-1.5 px-1.5 lg:min-h-28 lg:gap-2.5 lg:px-2.5"
      style={{ background: colours.primary, "--row-portrait": "3.5rem" } as CSSProperties}
    >
      <PlayerPortrait player={{ code: side.code, name: side.name }} colours={colours} chrome large />
      {/* Two lines before a cut, so a half at 390 holds "Strand Larsen" whole; one word stays on one line and ends in an
          ellipsis, never split (review D2: "AFFENGRUBE / R"; WebKit clamps without the ellipsis). */}
      <span
        className={`cm-title min-w-0 flex-1 font-chrome text-sm font-bold uppercase lg:text-2xl ${side.name.includes(" ") ? "line-clamp-2" : "truncate"}`}
        style={{ color: ink }}
      >
        {side.name}
      </span>
    </div>
  );
}
