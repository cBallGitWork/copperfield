import {
  type LineupDetail,
  type PlayerStory,
  type RosteredTeam,
  type SheetStage,
  clubById,
  oppositionByClub,
  sheetStage,
  teamSheetDetail,
} from "@epl/core";
import { type ReadableSquads, teamDisplay } from "./squads";
import { liveScores, squadLivePoints } from "./scoreboard";
import { benchOrder } from "./benchOrders";
import { newsFor, readPoolNews } from "./poolNews";
import { minutesFrom } from "./xmins";
import { now } from "./clock";
import { type AutoSubMark, autoSubbed } from "./components/league/autoSubbed";

// One team's sheet for the gameweek `squads` was read for, which the head-to-head and the Team tab both draw. Asked
// only for a side the lineup gate has opened: where a man is priced says who is in the eleven.

export interface TeamSheet {
  stage: SheetStage;
  /** After the auto subs, so the eleven on the grass is the one the score counts. */
  sheet: LineupDetail;
  marks: Record<string, AutoSubMark>;
  /** The gameweek's scoring at each man's slot; null before the first ball or when Fantrax refused. */
  live: Awaited<ReturnType<typeof squadLivePoints>>;
  /** Today's news on his men; none on a finished week, whose doubts are not today's. */
  news: Record<string, PlayerStory>;
}

export async function teamSheet(
  squads: ReadableSquads,
  team: RosteredTeam,
): Promise<TeamSheet> {
  const { snapshot, roundPeriod: period, info } = squads;
  const stage = sheetStage(snapshot, now().toISOString());
  const scoring = stage !== "unscored" && period !== null && info !== null;
  // The bench order is the manager's until the lock, Fantrax's own once it has passed; kickoff is too late.
  const locked = teamDisplay(squads, false).show === "lineup";
  const [live, scores, bench, stories] = await Promise.all([
    scoring ? squadLivePoints(period, team.teamId, info.scoringCategories) : null,
    scoring ? liveScores(period) : null,
    period === null ? [] : benchOrder(team.teamId, period, locked),
    stage === "finished" ? null : readPoolNews(),
  ]);
  const detail = teamSheetDetail(
    team,
    stage,
    clubById(snapshot),
    oppositionByClub(snapshot),
    live?.points ?? null,
    minutesFrom(snapshot.gameweek),
    bench,
  );
  const { sheet, marks } = autoSubbed(detail, scores?.subs.get(team.teamId) ?? []);
  const ids = team.players.map((man) => man.slot.fantraxId);
  return { stage, sheet, marks, live, news: stories === null ? {} : newsFor(stories, ids) };
}
