import { REPORTS } from "../../config";
import { minutePhrases, numeral } from "./minutes";
import { assistsBy, goalsBy, isGoal, type ManCounts, type MatchEvent } from "./timeline";
import { higherFirst } from "./derived";
import { firstLeagueStart, offEarly, withClub } from "./men";
import { saverOf } from "./passages";
import type { ReportMan, ReportMatchInput } from "./types";
import { plural } from "../../format";

// The account's moments and the section men's football, in a reporter's words; the labels name no provider, because
// the writer copies labels. Bookings and routine changes are the timeline's, so they never reach the brief.

const SUPPLY: Record<string, string> = { cross: "a cross", "through ball": "a through ball", "headed pass": "a header", pass: "a pass" };

/** ", a substitute on for Iliman Ndiaye in the 56th minute", for a man who came on; nothing for a starter. */
function onFor(match: ReportMatchInput, man: ReportMan | null): string {
  if (man === null || man.started || man.onAt === null) return "";
  const change = match.moments.find((m) => m.kind === "substitution" && m.men[0] === man.code);
  const replaced = match.men.find((m) => m.code === change?.men[1]);
  return `, a substitute on for ${replaced?.name ?? "a team-mate"} ${minutePhrases(man.onAt, true)[0] ?? ""}`.trimEnd();
}

function made(match: ReportMatchInput, event: MatchEvent): string {
  const s = event.shot;
  const from = s?.situation === "corner" ? " from a corner" : s?.situation === "set piece" ? " from a set piece" : s?.situation === "fast break" ? " on the break" : "";
  return event.other === null ? from : `, made by ${withClub(match, event.other)}${onFor(match, event.other)}, with ${SUPPLY[s?.supply ?? "pass"] ?? "a pass"}${from}`;
}

/** How a goal went in: the foot, where from and where to, as the commentary had it. */
function finish(event: MatchEvent): string {
  const s = event.shot;
  if (s === null) return "";
  const how = [s.foot === "header" ? "a header" : s.foot === null ? null : `${s.foot === "right foot" ? "right" : "left"}-footed`, s.from, s.to].filter(Boolean).join(", ");
  return how === "" ? "" : `; ${how}`;
}

/** A moment of the account's plan, with its minute phrases and, when the desk measured one, its distance from the turn. */
export function eventLine(match: ReportMatchInput, event: MatchEvent, since: string | null): string | null {
  const man = withClub(match, event.man);
  const all = since === null ? event.phrases : [...event.phrases, since];
  const phrases = all.length === 0 ? "" : ` [${all.join(" | ")}]`;
  const score = event.score === null ? "" : ` ${higherFirst(event.score.home, event.score.away)} to ${event.score.home > event.score.away ? match.home.name : event.score.home < event.score.away ? match.away.name : "neither"}`;
  const level = event.score !== null && event.score.home === event.score.away ? ` ${event.score.home}-${event.score.away}` : score;
  const saver = event.kind === "saved" || event.kind === "penalty-saved" ? saverOf(match, event) : null;
  const saved = saver === null ? "saved" : `saved by ${withClub(match, saver)}`;
  switch (event.kind) {
    case "goal":
    case "penalty-goal":
      return `GOAL:${level}. ${man}${onFor(match, event.man)}${event.kind === "penalty-goal" ? ", from the penalty spot" : ""}${made(match, event)}${finish(event)}.${phrases}`;
    case "own-goal":
      return `OWN GOAL:${level}. ${man} put it into his own net.${phrases}`;
    case "ruled-out":
      return `GOAL RULED OUT after a video review: ${man} had scored${event.other === null ? "" : `, made by ${withClub(match, event.other)}`}.${phrases}`;
    case "penalty-missed":
    case "penalty-saved":
      return `PENALTY ${event.kind === "penalty-missed" ? "MISSED" : "SAVED"}: ${man}'s kick${event.kind === "penalty-saved" ? `, ${saved}` : ""}.${phrases}`;
    case "second-yellow":
    case "sent-off":
      return `SENT OFF${event.kind === "second-yellow" ? " for a second booking" : ""}: ${man}.${phrases}`;
    case "missed":
    case "saved":
      return `CHANCE NOT TAKEN: ${man}, ${event.shot?.foot === "header" ? "a header" : "a shot"} ${event.shot?.from ?? ""}${made(match, event)}; ${event.kind === "saved" ? saved : "off target"}.${phrases}`;
    case "woodwork":
      return `HIT THE WOODWORK: ${man}${made(match, event)}.${phrases}`;
    case "substitution":
      // An injury is news; a change is told inside the goal its man scored or made. Neither man is the other's heir.
      return event.injury ? `INJURY: ${withClub(match, event.other)} went off injured.${phrases}` : null;
    case "injured-off":
      return `INJURY: ${man} went off injured with no changes left.${phrases}`;
    default:
      return null;
  }
}

/** A section man's football, figures only where they tell: a start or a change only when it is news, and a free agent's
 *  first start is his stake's. */
export function manLine(match: ReportMatchInput, man: ReportMan, counts: ManCounts | undefined, events: readonly MatchEvent[], keeperRung: number | null): string {
  const goals = events.filter(isGoal);
  const scored = goalsBy(goals, man.code);
  const madeOnes = assistsBy(goals, man.code);
  const conceded = (man.side === "home" ? match.fixture.awayScore : match.fixture.homeScore) ?? 0;
  const parts: string[] = [];
  if (firstLeagueStart(man) && man.holder !== null) parts.push("his first league start this season");
  else if (!man.started && man.onAt !== null) parts.push("came on");
  if (man.injuredOff) parts.push(`went off injured${man.fitness === null ? "" : `; the club's word since: ${man.fitness}`}`);
  else if (man.sentOff) parts.push("was sent off");
  else if (offEarly(man)) parts.push("was taken off before the hour");
  if (scored > 0) parts.push(`${numeral(scored)} ${plural(scored, "goal")}${man.goalsSeason !== null && man.goalsSeason > scored ? `, ${numeral(man.goalsSeason)} in the league this season` : ""}`);
  else if (man.expectedGoals >= REPORTS.missed.goodEnough) parts.push("chances good enough to score");
  if (madeOnes > 0) parts.push(`made ${numeral(madeOnes)}`);
  if (counts !== undefined && counts.shots >= REPORTS.stats.briefShots) parts.push(`${numeral(counts.shots)} shots`);
  if (counts !== undefined && counts.chancesMade >= REPORTS.stats.chances) parts.push(`made ${numeral(counts.chancesMade)} chances`);
  if (man.line === "G" && keeperRung !== null && man.saves >= keeperRung) parts.push(`${numeral(man.saves)} saves`);
  if ((man.line === "G" || man.line === "D") && man.started && man.offAt === null && conceded === 0) parts.push("the whole match without conceding");
  // Points the league pays for defending, capped a match: the writer read a bare count as "two defensive actions".
  if (man.defensive !== null && man.defensive > 0) {
    parts.push(`${numeral(man.defensive)} defensive ${plural(man.defensive, "point")}${man.defensiveMost === null ? "" : ` (most a match pays ${numeral(man.defensiveMost)})`}`);
  }
  return parts.join("; ");
}
