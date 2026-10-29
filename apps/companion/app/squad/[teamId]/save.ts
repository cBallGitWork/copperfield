"use server";

import {
  FANTRAX_LEAGUE_ID,
  eligibilityOf,
  fantraxLineupPort,
  firstKickoff,
  locksAt,
  saveOpen,
  violations,
  writeLineup,
  type OnStep,
  type PlannedLineup,
  type RosterSlot,
  type WriteAnswer,
} from "@epl/core";
import { now, replayAt } from "../../clock";
import { markStale } from "../../leagueCache";
import { OPEN_ORDER_KEY } from "../../benchOrders";
import { planningRound } from "../../round";
import { rosterMinimums } from "../../rosterMinimums";
import { signedTeamId } from "../../session";
import { SQUADS_KEY, getLeagueSquads } from "../../squads";
import { commissionerSession } from "./saving";

// Saves the signed-in manager's planned lineup and bench order to Fantrax. The server names the team and the
// week, and refuses a week that has locked or is about to: the commissioner's write can override a live team.

export interface Plan extends PlannedLineup {
  /** The period the page planned, which must still be the open one. */
  period: number;
}

const SWITCHED_OFF = "Saving to Fantrax is switched off. Set this line-up in Fantrax instead.";
const RELOAD = "Your squad has changed since this page loaded. Reload and try again.";
const REFUSED = "Fantrax would not take the save. Set this line-up in Fantrax instead.";
const CHANGED = "Your line-up has changed in Fantrax since this page loaded. Reload to see it, then save again.";

const refuse = (message: string): WriteAnswer => ({ ok: false, messages: [message] });

/** After a write, or a page found behind Fantrax: the next view reads the squads and the bench order afresh. */
function markPlanStale(): void {
  markStale(SQUADS_KEY);
  markStale(OPEN_ORDER_KEY);
}

const isSlots = (slots: unknown): slots is RosterSlot[] =>
  Array.isArray(slots) &&
  slots.every(
    (s: RosterSlot | null) => typeof s?.fantraxId === "string" && typeof s.status === "string" && (s.position === null || typeof s.position === "string"),
  );
const isBench = (bench: unknown): bench is string[] =>
  Array.isArray(bench) && bench.every((id) => typeof id === "string") && new Set(bench).size === bench.length;

function isPlan(value: unknown): value is Plan {
  const plan = value as Plan | null;
  return (
    Number.isInteger(plan?.period) &&
    isSlots(plan?.slots) &&
    isBench(plan?.bench) &&
    typeof plan?.reordered === "boolean" &&
    isSlots(plan?.held?.slots) &&
    isBench(plan?.held?.bench)
  );
}

export async function saveLineup(input: unknown): Promise<WriteAnswer> {
  if (!isPlan(input)) return refuse(RELOAD);
  // A replayed clock would plan a week that locked long ago, and the commissioner's write overrides a lock.
  if (replayAt() !== null) return refuse(SWITCHED_OFF);

  const round = await planningRound();
  const squads = await getLeagueSquads(round);
  if (round === null || !("period" in squads) || squads.info === null) return refuse(REFUSED);
  if (input.period !== round.period) return refuse(`That gameweek has locked. Reload to plan gameweek ${round.gameweek}.`);
  const period = squads.info.rosterPeriods.find((p) => p.number === round.period);
  const kickoff = period === undefined ? null : firstKickoff(period, squads.kickoffs);
  if (!saveOpen(kickoff === null ? null : locksAt(kickoff), now().toISOString())) {
    return refuse(`Gameweek ${round.gameweek} is about to lock. Set this line-up in Fantrax instead.`);
  }

  const teamId = await signedTeamId(squads.period.teams);
  if (teamId === null) return refuse("Sign in with your team code to save.");
  const session = commissionerSession(teamId);
  if (session === null) return refuse(SWITCHED_OFF);

  const limits = { ...squads.info.roster, minActiveByPosition: rosterMinimums() };
  if (violations(input.slots, eligibilityOf(squads.info.players), limits).length > 0) {
    return refuse("This line-up breaks the league's rules. Fix it before saving.");
  }
  const reserves = new Set(input.slots.filter((s) => s.status !== "ACTIVE").map((s) => s.fantraxId));
  if (input.bench.length !== reserves.size || input.bench.some((id) => !reserves.has(id))) return refuse(RELOAD);

  try {
    return await write(teamId, round.period, input, session);
  } catch (error) {
    console.error(JSON.stringify({ event: "lineup-save", teamId, period: round.period, error: String(error) }));
    return refuse(REFUSED);
  }
}

async function write(teamId: string, period: number, plan: Plan, session: string): Promise<WriteAnswer> {
  // Each write as Fantrax answers it: who moved where, the bench order sent (null: Fantrax's left alone), and
  // Fantrax's words when it refuses.
  const audit: OnStep = (step, answer, { lineup, moved, bench }) => {
    const refused = answer.ok ? {} : { refused: answer.messages };
    console.info(JSON.stringify({ event: "lineup-save", teamId, period, step, ok: answer.ok, lineup, moved, bench, ...refused }));
  };
  const saved = await writeLineup(fantraxLineupPort(FANTRAX_LEAGUE_ID, teamId, period, session), period, plan, audit);
  switch (saved.outcome) {
    case "unreadable":
      return refuse(REFUSED);
    case "moved-on":
      // The page's copy is behind Fantrax: mark it stale so the reload fetches what Fantrax now holds.
      markPlanStale();
      return refuse(CHANGED);
    case "unplaceable":
      return refuse(RELOAD);
    case "answered":
      if (saved.stale) markPlanStale();
      return saved.answer;
  }
}
