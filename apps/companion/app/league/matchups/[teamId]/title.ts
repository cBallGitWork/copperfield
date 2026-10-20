import type { Metadata } from "next";
import { leagueInfo, readCalendar } from "../../../round";
import { askedWeek, leagueWeeks } from "../../../squad/[teamId]/weeks";
import { HEAD_TO_HEAD, gameweekName, titled } from "../../../titles";
import { wholeNumber } from "../../../wholeNumber";

/** A head-to-head's title: the URL's side, the screen and the gameweek asked for, by the page's own rule (a week the
 *  league does not play opens the default, so names none). The opponent needs the period's reads, which a title does not make. */
export async function headToHeadTitle({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ gw?: string }>;
}): Promise<Metadata> {
  const [{ teamId }, { gw }, info, calendar] = await Promise.all([params, searchParams, leagueInfo(), readCalendar()]);
  const asked = askedWeek(leagueWeeks(calendar, info?.matchups ?? []), wholeNumber(gw));
  const team = info?.teams.find((entry) => entry.teamId === teamId)?.name;
  return titled(team, HEAD_TO_HEAD, asked === null ? null : gameweekName(asked.gameweek));
}
