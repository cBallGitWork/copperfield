import Link from "@/app/components/shell/Link";
import { type RosteredTeam, headToHeads, inPairingOrder, isResolved } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import SignIn from "./SignIn";
import { forgetTeam } from "./actions";
import { getLeagueSquads } from "../squads";
import { planningRound } from "../round";
import { myTeamId, signedIn } from "../session";
import { yoursEdge } from "../mine";
import { MY_TEAM, teamHref } from "./routes";
import { PANEL, ROW_NAME } from "@/app/desk";
import FantraxSilent from "../components/shell/FantraxSilent";
import { shortName } from "../teamNames";
import { SQUADS, YOUR_SQUAD } from "../titles";

// Your squad, then everyone else's, and the sign-in: `/squad`, and `/squad/me` for a reader with no team, so Team
// stays lit. The cookie makes it dynamic; the reads under it are cached.

export default async function SquadIndex({
  back,
}: {
  /** Where the phone's back plate goes with no history; none at `/squad/me`, a tab of its own. */
  back?: string;
}) {
  // The week a manager can still change: from Friday teatime that is next week, not the one in play.
  const squads = await getLeagueSquads(await planningRound());

  // Both empty states keep the sign-in form: this is the only place a code goes in, and signing in needs no Fantrax.
  if ("unavailable" in squads) {
    return (
      <div className="flex flex-col gap-3">
        <section className={PANEL}>
          <FantraxSilent code={squads.unavailable} page />
        </section>
        <SignIn />
      </div>
    );
  }

  if ("undrafted" in squads) {
    return (
      <div className="flex flex-col gap-3">
        <section className={PANEL}>
          <Nothing title="Nobody has a squad yet" code={squads.undrafted} page />
        </section>
        <SignIn />
      </div>
    );
  }

  const [mine, holder] = await Promise.all([myTeamId(squads.period.teams), signedIn()]);
  const yours = squads.period.teams.find((team) => team.teamId === mine);

  // Who each plays this week, off the schedule already in the payload; no line when it does not say.
  const period = squads.roundPeriod;
  // The week's ties in the schedule's order, a tie's two together: an order a member knows, at no extra read.
  const others = (
    squads.info === null || period === null
      ? squads.period.teams
      : inPairingOrder(squads.period.teams, squads.info.matchups, period)
  ).filter((team) => team.teamId !== mine);
  // Both of a double header's, joined.
  const opponentName = (teamId: string) => {
    const ties = squads.info === null || period === null ? [] : headToHeads(squads.info.matchups, squads.info.teams, period, teamId);
    return ties.length === 0 ? null : ties.map((tie) => shortName(tie.opponent.teamId, tie.opponent.name)).join(" & ");
  };

  // The league's own cap from the info already fetched; none named, no size is printed.
  const cap = squads.info?.roster.maxTotalPlayers ?? null;

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={yours ? YOUR_SQUAD : SQUADS} back={back} />

      {/* The sign-in follows the code, not the team on screen; signing out is offered only to a real code. */}
      {holder ? null : <SignIn />}

      <ul className="cm-rows flex flex-col">
        {yours ? (
          <li>
            <Squad team={yours} opponent={opponentName(yours.teamId)} cap={cap} lead />
          </li>
        ) : null}
        {others.map((team) => (
          <li key={team.teamId}>
            <Squad team={team} opponent={opponentName(team.teamId)} cap={cap} />
          </li>
        ))}
      </ul>

      {holder ? (
        <form action={forgetTeam} className="cm-panel px-3">
          <button type="submit" className="min-h-11 text-2xs text-faint hover:text-muted">
            Not you? Sign out
          </button>
        </form>
      ) : null}
    </div>
  );
}

/** One squad as a row. `lead` is the partisan treatment: yours sits above the
 *  rest, framed, because this app is meant to know whose team you are. */
function Squad({
  team,
  opponent,
  cap,
  lead = false,
}: {
  team: RosteredTeam;
  /** Who he plays this period, or null when the schedule does not say. */
  opponent: string | null;
  /** The league's roster limit, or null when it names none. */
  cap: number | null;
  lead?: boolean;
}) {
  const unresolved = team.players.filter((player) => !isResolved(player)).length;

  return (
    <Link
      // Your own row goes through the front door, so the rail's plate stays lit.
      href={lead ? MY_TEAM : teamHref(team.teamId)}
      className={`cm-row flex min-h-14 items-center gap-3 px-3 py-2.5 hover:bg-raised ${
        lead ? "bg-raised" : "bg-surface"
      } border-line ${yoursEdge(lead)}`}
    >
      <span className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-baseline lg:gap-2">
        <span className={`min-w-0 truncate ${ROW_NAME}`}>{team.teamName}</span>
        {/* Who he plays this week. */}
        {opponent ? (
          <span className="shrink-0 truncate text-2xs text-faint">v {opponent}</span>
        ) : null}
      </span>
      {/* No YOU chip (Craig, 5 Sep 2026): the accent edge and the top place pair with the colour. */}
      {/* A size only off the league's limit: short after a drop, or over it. */}
      {cap === null || team.players.length === cap ? null : (
        <span className="numeric shrink-0 text-sm text-muted" aria-label={`${team.players.length} of ${cap} players`}>
          {team.players.length}/{cap}
        </span>
      )}
      {/* Never silently short: a squad we cannot fully identify says so. */}
      {unresolved > 0 ? (
        <span className="numeric shrink-0 bg-bg px-1.5 py-0.5 text-2xs font-bold text-mid">
          {unresolved} unmapped
        </span>
      ) : null}
    </Link>
  );
}
