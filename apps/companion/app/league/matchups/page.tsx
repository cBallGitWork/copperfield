import { redirect } from "next/navigation";
import { getLeagueSquads, readable } from "../../squads";
import { matchupsLanding } from "./landing";

// A bare old Matchups link: a 307, never cached, since the gameweek it lands on moves every week. `?gw=` 308s in next.config.

export const revalidate = 30;

export default async function MatchupsLanding() {
  redirect(matchupsLanding(readable(await getLeagueSquads())?.snapshot.gameweek ?? null));
}
