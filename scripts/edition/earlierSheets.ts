import { DRAFT_DESK, FANTRAX_LEAGUE_ID, fetchTeamRosters, groupedBy, sheetOf, type FootballSnapshot, type LeagueInfo, type Sheet } from "@epl/core";
import { rosteredPeriod } from "./bridge";

/** Each side's fielded sheets from every earlier period, oldest first. */
export async function earlierSheets(info: LeagueInfo, snapshot: FootballSnapshot, period: number): Promise<Map<string, Sheet[]>> {
  const periods = info.rosterPeriods.map((each) => each.number).filter((number) => number < period).sort((a, b) => a - b);
  const read: Sheet[][] = [];
  for (let at = 0; at < periods.length; at += DRAFT_DESK.rosterBatch) {
    const batch = periods.slice(at, at + DRAFT_DESK.rosterBatch);
    const rosters = await Promise.all(batch.map((number) => fetchTeamRosters(FANTRAX_LEAGUE_ID, number)));
    read.push(...rosters.map((raw) => rosteredPeriod(snapshot, raw).teams.map(sheetOf)));
  }
  return groupedBy(read.flat(), (sheet) => sheet.teamId);
}
