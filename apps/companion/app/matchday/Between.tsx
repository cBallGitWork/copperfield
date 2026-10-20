import type { FootballSnapshot } from "@epl/core";
import ButtonLink from "../components/shell/ButtonLink";
import Section from "../components/shell/Section";
import { londonDayAndTime } from "@epl/core";
import { leagueFixturesHref } from "@/app/league/SectionNav";
import { gameweekHref } from "../components/shell/sections";

// What the Live tab draws without live football: the card held while the scoreboard loads, and the between-rounds screen.

export function BetweenGameweeks({
  snapshot,
  up,
  locksAt,
}: {
  snapshot: FootballSnapshot;
  /** The round the next ball will be kicked in, from the whole season's
   *  fixtures. Null only when the season's football is genuinely all played. */
  up: { gameweek: number; kickoff: string } | null;
  /** The league's lineup lock for `up` while it is ahead, as plain data; null prints the kickoff instead. */
  locksAt: string | null;
}) {
  // FPL keeps pointing at a finished round until the next deadline, so an `up` elsewhere means it is done.
  const over = up === null || up.gameweek !== snapshot.gameweek;

  return (
    <div className="flex flex-col gap-3">
      {/* A section, not a second title bar: the page's one h1 is the gameweek's (DESIGN.md, the title bar). */}
      <Section title="No football today">
        {up === null ? (
          <p className="p-2 text-sm text-muted">Every match of the season has been played.</p>
        ) : (
          <p className="p-2 text-sm text-muted">
            {lead(over ? up.gameweek : null, locksAt !== null)}
            <span className="numeric font-semibold text-ink">{londonDayAndTime(locksAt ?? up.kickoff)}</span>
          </p>
        )}
      </Section>

      <div className="flex gap-2">
        {/* The finished round keeps its button: on a Tuesday a reader wants Monday night's result. */}
        <ButtonLink href={gameweekHref(snapshot.gameweek)} fill>
          {over ? `GW${snapshot.gameweek} results` : "The fixtures"}
        </ButtonLink>
        {over && up !== null ? (
          <ButtonLink href={gameweekHref(up.gameweek)} fill>
            {`GW${up.gameweek} fixtures`}
          </ButtonLink>
        ) : (
          <ButtonLink href={leagueFixturesHref(snapshot.gameweek)} fill>
            Who plays whom
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** The words before the time: the lock where the league gave one, else the kickoff; a finished week names the next. */
function lead(next: number | null, locks: boolean): string {
  if (locks) return next === null ? "Line-ups lock " : `Gameweek ${next} line-ups lock `;
  return next === null ? "First kickoff " : `Gameweek ${next} starts `;
}
