import {
  type ClaimPlace,
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type WaiverSchedule,
  fetchWaiverSettings,
  mapWaiverSchedule,
  upcomingRuns,
} from "@epl/core";
import { now } from "./clock";
import { WAIVER_RUNS_AHEAD, WAIVER_SCHEDULE_REVALIDATE } from "./config";
import { fantraxSession } from "./fantraxSession";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";
import { readerTeamId } from "./squads";
import { claimOrder } from "./standings";

// When the league's waiver claims run, read off its setup as the commissioner (members only) and held for hours: it
// moves only when he edits it. No session, a refusal or a league with no set days is no schedule, never a guess.

const readSchedule = leagueCache("waiver-schedule",
  async (): Promise<WaiverSchedule | null> => {
    const cookie = fantraxSession();
    if (cookie === null) return null;
    const raw = await orRefusal(fetchWaiverSettings(FANTRAX_LEAGUE_ID, cookie));
    return raw instanceof FantraxError ? null : mapWaiverSchedule(raw);
  },
  () => null,
  WAIVER_SCHEDULE_REVALIDATE,
);

/** What a waiver screen needs: the runs to come, the claim order, the reader's place in it and the clock it was read at. */
export interface Waivers {
  /** ISO instants, soonest first; empty with no schedule. */
  runs: string[];
  order: ClaimPlace[];
  /** The reader's place, 1 first; null when nobody is signed in or Fantrax gave none. */
  place: number | null;
  mine: string | null;
  now: string;
}

export async function readWaivers(): Promise<Waivers> {
  const [schedule, order, mine] = await Promise.all([readSchedule(), claimOrder(), readerTeamId()]);
  const at = now().toISOString();
  return {
    runs: schedule === null ? [] : upcomingRuns(schedule, at, WAIVER_RUNS_AHEAD),
    order,
    place: order.find((entry) => entry.teamId === mine)?.place ?? null,
    mine,
    now: at,
  };
}
