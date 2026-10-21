import Link from "@/app/components/shell/Link";
import type {
  Club,
  LeagueTeam,
  LineupDetail,
  Opposition,
  PeriodGameweeks,
  RosterDisplay,
  RosteredTeam,
} from "@epl/core";
import { NO_MINUTES, lineupDetail, openingGameweek } from "@epl/core";
import type { UnplayedSide } from "./unplayed";
import { widestLine } from "../../../components/league/PitchRows";
import Nothing from "../../../components/shell/Nothing";
import SquadRows from "../../../components/league/SquadRows";
import TeamSheet from "../../../components/league/TeamSheet";
import { teamHref } from "@/app/squad/routes";
import { PANEL_FLUSH, SMALL_CAPS } from "@/app/desk";

// The head-to-head's per-side pieces: why a side is withheld, both sides' arrangements, and the squad list a side
// shows before kickoff. The shared boards are `tabs.tsx`'s.

/** Why a side is not on screen: no roster from Fantrax, a lineup not yet locked, or our calendar failing. */
export function Withheld({
  team,
  known,
  because: display,
  calendar,
}: {
  team: LeagueTeam;
  /** Whether Fantrax gave us a roster for him at all. */
  known: boolean;
  because: RosterDisplay;
  calendar: readonly PeriodGameweeks[];
}) {
  // The period comes off the decision, never the round in view: between rounds they differ, and a reason may not
  // name a deadline that has passed. It is printed as the gameweek it opens, or as no number where that is unknown.
  const because = !known
    ? `No squad for ${team.name}.`
    : display.show === "squad" && display.because === "not-locked"
      ? `${team.name}'s eleven is not public until ${lockOf(openingGameweek(calendar, display.period))} lock.`
      : `${team.name}'s eleven is not showing.`;

  return (
    <div className="flex flex-col items-center gap-3 border border-line bg-surface px-4 py-10 text-center">
      <p className="max-w-xs text-sm text-muted">{because}</p>
      <Link
        href={teamHref(team.teamId)}
        className={`flex min-h-11 items-center ${SMALL_CAPS} text-accent`}
      >
        See the squad
      </Link>
    </div>
  );
}

/** Whose lineups: a gameweek's, or "its" where the calendar cannot name one. */
function lockOf(gameweek: number | undefined): string {
  return gameweek === undefined ? "its line-ups" : `gameweek ${gameweek}'s line-ups`;
}

/** One side of a tie before a ball is kicked: no figure column, since nothing has scored. A side the gate has opened
 *  (always your own) is its eleven, then its bench; any other is unarranged, so not even the order leaks who starts. */
export function SquadList({ listed, teamId }: { listed: UnplayedSide | undefined; teamId: string }) {
  if (listed === undefined) return <Nothing title="No squad" code={teamId} />;
  return (
    <section className={PANEL_FLUSH}>
      {"sheet" in listed ? (
        <TeamSheet rows={listed.sheet.rows} bench={listed.sheet.bench} breakdown={{}} mode="list" />
      ) : (
        <SquadRows lines={listed.lines} />
      )}
    </section>
  );
}

/** Both sides as arrangements, and the card width they agree on. */
export function arrangeBoth({
  pairing,
  rostered,
  shows,
  scored,
  benches,
  clubs,
  opposition,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  scored: Map<string, { points: Map<string, number | null> } | null>;
  /** Each side's bench order for the period, by team id; a side with none stands in position order. */
  benches: Map<string, readonly string[]>;
  clubs: Map<number, Club>;
  opposition: Map<number, Opposition[]>;
}): { arranged: Map<string, LineupDetail>; widest: number } {
  // Both arranged before either is drawn, so the pitch keeps one card size as the reader flips sides; a withheld side
  // does not count, or its formation would leak through the layout.
  const arranged = new Map(
    [pairing.team, pairing.opponent].flatMap((team) => {
      const roster = rostered.get(team.teamId);
      if (roster === undefined || !shows(team)) return [];
      const points = scored.get(team.teamId)?.points ?? null;
      const bench = benches.get(team.teamId) ?? [];
      return [[team.teamId, lineupDetail(roster, clubs, opposition, points, NO_MINUTES, bench)] as const];
    }),
  );
  const widest = Math.max(
    1,
    ...[...arranged.values()].map((sheet) => widestLine([...sheet.rows, { players: sheet.bench }])),
  );
  return { arranged, widest };
}