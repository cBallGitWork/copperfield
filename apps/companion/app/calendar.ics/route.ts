import { FANTRAX_LEAGUE_ID } from "@epl/core";
import { now } from "../clock";
import { seasonKickoffs } from "../football";
import { leagueInfo } from "../round";
import { MY_TEAM } from "../squad/routes";
import { icsCalendar } from "./ics";
import { FEED_CACHE, FEED_REFRESH_HOURS, lockEvents } from "./locks";

// The line-up locks as a calendar a phone subscribes to; a refusal is a 503, so a subscriber keeps what it holds.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const [info, kickoffs] = await Promise.all([leagueInfo(), seasonKickoffs()]);
  if (info === null) {
    return new Response("The league did not answer.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "600" } });
  }
  const url = new URL(request.url);
  const stamp = now().toISOString();
  const body = icsCalendar({
    prodId: `-//${url.host}//Line-up locks//EN`,
    name: `${info.name} line-up locks`,
    refreshHours: FEED_REFRESH_HOURS,
    stamp,
    events: lockEvents(info.rosterPeriods, kickoffs, stamp, FANTRAX_LEAGUE_ID, new URL(MY_TEAM, url.origin).toString()),
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="line-up-locks.ics"',
      "Cache-Control": FEED_CACHE,
    },
  });
}
