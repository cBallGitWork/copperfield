import {
  clubById,
  oppositionByClub,
  roundState,
  squadDetail,
  squadUnarranged,
} from "@epl/core";
import { footballLinesNow } from "../../football";
import { getLeagueSquads, readableOr404, teamDisplay } from "../../squads";
import { lastLockedRound, leagueInfo, planningRound, readCalendar } from "../../round";
import { pendingByTeam } from "../../scoreboard";
import { leagueScoring } from "../../scoring";
import { squadSeason } from "../../teamStats";
import { myTeamId } from "../../session";
import { now } from "../../clock";
import { OWN, SQUAD } from "../routes";
import { wholeNumber } from "../../wholeNumber";
import { plannable } from "./plannable";
import { askedWeek, gameweekPicker, leagueWeeks, rivalWeek, weekStanding } from "./weeks";
import { whoseTeam } from "./team";
import { minutesFrom } from "../../xmins";
import { benchRanks as benchRanksOf } from "../../benchOrders";
import { teamSheet } from "../../teamSheet";

// Everything a team's squad page shows, read and joined: which round, whose team, what the reader
// may see of it, and the points, news and season beside it. The page draws it.

export async function squadView(slug: string, gw: string | undefined) {
  // Your own squad is about the week you can still change, and a rival's too unless his locked week is still being
  // played (`rivalWeek`); `?gw=` beats both. Asked off the league's own list: `mine` below is the authority, but the
  // roster read cannot choose its own week.
  const info = await leagueInfo();
  const asksOwn =
    slug === OWN || (info !== null && (await myTeamId(info.teams)) === slug);

  const [open, calendar] = await Promise.all([planningRound(), readCalendar()]);
  // Through the calendar seam, the league's weeks only: a gameweek it does not play opens the default.
  const played = leagueWeeks(calendar, info?.matchups ?? []);
  const round =
    askedWeek(played, wholeNumber(gw)) ??
    (asksOwn ? open : rivalWeek(...(await Promise.all([lastLockedRound(), open, playing()]))));
  // Locked, open or ahead: a locked week's sheet prints points under each name, any other its fixture.
  const standing = weekStanding(round, open);
  const weeks = gameweekPicker(played, round);
  const squads = readableOr404(await getLeagueSquads(round), SQUAD);

  const { team, mine } = await whoseTeam(slug, squads.period.teams);
  const teamId = team.teamId;

  const clubs = clubById(squads.snapshot);
  const opposition = oppositionByClub(squads.snapshot);
  // What this reader may see of this team: your own lineup all week, a rival's once his period opens.
  const display = teamDisplay(squads, mine);

  // The rules the planner enforces, or null: a rival's squad, any week but the open one, or no rules from Fantrax.
  const planning =
    mine && plannable(round, open) && display.show === "lineup" && squads.info !== null ? squads.info : null;
  const squadIds = new Set(team.players.map((p) => p.slot.fantraxId));
  const benchRanks = planning === null || open === null ? {} : await benchRanksOf(teamId, open.period);

  // What each is eligible at, not his filed slot (they differ for 48 of 607): fifteen entries, as a record, since it
  // crosses to the browser.
  const eligibility: Record<string, string[]> = {};
  for (const state of squads.info?.players ?? []) {
    if (squadIds.has(state.fantraxId)) eligibility[state.fantraxId] = state.eligiblePositions;
  }

  // Whether the sheet is the branch that renders: a lineup the planner does not own.
  const sheet = planning === null && display.show === "lineup";
  const [scoring, season, drawn] = await Promise.all([
    leagueScoring(),
    // The season's points, for the branches that label them so: the planner (Craig, 30 Sep 2026) and the gated list.
    sheet ? null : squadSeason(teamId),
    // The sheet the head-to-head draws too.
    sheet ? teamSheet(squads, team) : null,
  ]);
  // xMins from the week on screen, so a future week's list reads that week's minutes.
  const minutes = minutesFrom(round?.gameweek ?? null);
  const points = season?.points ?? null;
  const board =
    display.show === "squad"
      ? {
          because: display.because,
          projected: season?.stats.season.projected ?? false,
          lines: squadDetail(squadUnarranged(team), clubs, opposition, points, minutes),
        }
      : null;

  // Clean sheets Fantrax credits at full time, judged on this team's own `display`: a +8 says a defender is in the
  // eleven, which the gate withholds. Nought prints nothing.
  const owed = pendingByTeam([team], scoring?.rules ?? null, squads.snapshot, display).get(
    teamId,
  )?.points;
  const pending = owed ? owed : null;

  // Every team by id and name, for the squad's team picker.
  const league = squads.period.teams.map(({ teamId, teamName }) => ({ teamId, teamName }));
  return { team, league, mine, planning, open, standing, weeks, benchRanks, eligibility, clubs, opposition, drawn, points, board, pending, squadIds, minutes };
}

/** The gameweek whose football is still to finish (in play, or not kicked off), or null once it is done; the lines
 *  read, as `getLeagueSquads` makes it, so the request reads one snapshot. */
async function playing(): Promise<number | null> {
  const snapshot = await footballLinesNow();
  const state = roundState(snapshot, now().toISOString());
  return state === null || state === "live" ? snapshot.gameweek : null;
}
