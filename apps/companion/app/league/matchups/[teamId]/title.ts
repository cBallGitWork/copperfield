import type { Metadata } from "next";
import { leagueInfo } from "../../../round";
import { HEAD_TO_HEAD, gameweekName, titled } from "../../../titles";
import { wholeNumber } from "../../../wholeNumber";

/** A head-to-head's title: the URL's side, the screen and the gameweek asked for. The opponent needs the period's
 *  reads, which the board makes and a title does not. */
export async function headToHeadTitle({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ gw?: string }>;
}): Promise<Metadata> {
  const [{ teamId }, { gw }, info] = await Promise.all([params, searchParams, leagueInfo()]);
  const asked = wholeNumber(gw);
  const team = info?.teams.find((entry) => entry.teamId === teamId)?.name;
  return titled(team, HEAD_TO_HEAD, asked === null ? null : gameweekName(asked));
}
