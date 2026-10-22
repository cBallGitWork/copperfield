"use server";

import { clubById, isFantraxPlayerId } from "@epl/core";
import { footballNow, seasonFixtures } from "../../football";
import { intelMinutes } from "../../intel";
import { XMINS_AS_OF } from "../../xmins";
import { XMINS_WEEKS } from "../../config";
import { footballSelf } from "./footballSelf";
import { formMatches, nextMatches, type CardWeeks } from "./cardWeeks";
import { joinMatches } from "./matchRows";
import { gameLog, scouting } from "./scouting";
import { subject } from "./subject";

/** His form and run for the card that opens over a list, off the Data tab's cached reads: one profile per tap. */
export async function cardRecord(fantraxId: string): Promise<CardWeeks | null> {
  if (!isFantraxPlayerId(fantraxId)) return null;
  const found = await subject(fantraxId);
  // A refused profile costs the form its league figures, never the run to come.
  const paid = "unavailable" in found ? null : found.intel.matches;
  const football = "unavailable" in found ? await footballSelf(fantraxId) : found.football;
  if (football === null) return null;
  const [log, run, snapshot, fixtures] = await Promise.all([
    gameLog(football.player),
    scouting(football.player),
    footballNow(),
    seasonFixtures(),
  ]);
  const minutes = new Map((intelMinutes.get(football.player.code) ?? []).map((week) => [week.gameweek, week.minutes]));
  const byId = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  return {
    form: paid === null ? null : formMatches(joinMatches(log?.rows ?? [], paid, clubById(snapshot)), byId),
    next: nextMatches(run, minutes, XMINS_WEEKS),
    asOf: XMINS_AS_OF,
  };
}
