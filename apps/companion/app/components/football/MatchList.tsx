import {
  type Club,
  type Fixture,
  type FootballPlayer,
  type FootballSnapshot,
  type MatchContribution,
  type PlayerOwner,
  clubColoursOf,
  contributions,
  fullFootballerName,
} from "@epl/core";
import { chipsFor } from "../league/Chips";
import { ROW_NAME } from "@/app/desk";
import PlayerName from "../shell/PlayerName";
import PlayerPortrait from "./PlayerPortrait";

// Who did what in one match, under its row on Prem's Fixtures: the reader's men, then every scorer tagged with his holder.

export default function MatchList({
  fixture,
  clubs,
  lines,
  now,
  yours,
  owners,
}: {
  fixture: Fixture;
  clubs: Map<number, Club>;
  /** The round's per-player lines; null when there are none to read, said as such once the match has started. */
  lines: FootballSnapshot | null;
  /** Whether `lines` is fresh enough to call a match in play live. */
  now: boolean;
  /** His men in this match, every one named, including those who did nothing. */
  yours: readonly FootballPlayer[];
  /** Every rostered footballer by FPL code, against the squad holding him. */
  owners?: Map<number, PlayerOwner>;
}) {
  const rows = lines === null ? [] : contributions(lines, fixture.id);
  const mine = new Set(yours.map((p) => p.code));

  return (
    <div className="border-t border-line bg-bg/40 px-3 py-2.5">
      <p className="mb-2 truncate text-xs text-accent">
        <span className="font-semibold uppercase">Yours</span>
        {yours.map((p) => ` · ${p.name}`).join("")}
      </p>
      {fixture.status === "upcoming" ? null : lines === null || lines.statsUnavailable ? (
        // Said, or a scoreline with no scorers reads as nobody having done anything.
        <p className="py-1 text-center text-xs text-faint">Scorers not available right now.</p>
      ) : rows.length === 0 ? (
        <p className="py-1 text-center text-xs text-faint">
          {now && fixture.status === "live" ? "Nothing to report yet." : "Nothing to report."}
        </p>
      ) : (
        <ul className="cm-rows flex flex-col">
          {rows.map((c) => {
            const owner = owners?.get(c.player.code);
            return (
              <li key={c.player.id} className="flex items-center gap-2.5">
                <PlayerPortrait player={c.player} colours={clubColoursOf(clubs.get(c.clubId))} />
                <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
                  <span className={`min-w-0 truncate ${ROW_NAME}`}><PlayerName name={fullFootballerName(c.player)} /></span>
                  {/* Whose player he is; a footballer nobody holds says nothing rather than a dash. */}
                  {owner ? (
                    <span className={`block shrink-0 truncate text-2xs ${mine.has(c.player.code) ? "text-accent" : "text-faint"}`}>
                      {owner.teamName}
                    </span>
                  ) : null}
                </span>
                <Events c={c} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** What he did, as `chipsFor`'s chips; only the size and padding are this caller's. */
function Events({ c }: { c: MatchContribution }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {chipsFor(c).map((chip) => (
        <span key={chip.label} className={`numeric px-1.5 py-0.5 text-2xs font-bold ${chip.className}`}>
          {chip.label}
        </span>
      ))}
    </span>
  );
}
