import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type AutoSubPair,
  type BreakdownLine,
  type FootballSnapshot,
  type LivePlayerPoints,
  type LiveRemaining,
  type LiveTeamScore,
  type PendingCleanSheets,
  type RosterDisplay,
  type RosteredTeam,
  type ScoringCategory,
  type ScoringRules,
  awaitsSub,
  fetchLiveScoring,
  liveBreakdown,
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveRemaining,
  mapLiveScores,
  minutesByMan,
  pendingCleanSheets,
  withAutoSubs,
} from "@epl/core";
import { cache } from "react";
import { benchRoster } from "./benchOrders";
import { LIVE_REVALIDATE } from "./config";
import { leagueCache } from "./leagueCache";
import { orRefusal, tell } from "./refusals";
import { leagueInfo } from "./round";
import { rosterMinimums } from "./rosterMinimums";

// The head-to-head board's reads and joins, kept out of the page.

/** Fantrax's totals for this period, with the refusal carried: a dash alone cannot say the
 *  scoreboard is down. */
const readScores = leagueCache("live-scores",
  async (period: number): Promise<{
    scores: [string, LiveTeamScore][];
    /** Per team, the men Fantrax has priced this period. From the same payload
     *  as the totals above, mapped a second time rather than fetched again. */
    players: [string, LivePlayerPoints[]][];
    /** Per team, the reserves Fantrax priced, which count in no total. */
    bench: [string, LivePlayerPoints[]][];
    /** Each team's eleven and bench with the football each man has left, for the auto subs. */
    remaining: LiveRemaining[];
    refused: string | null;
    /** When Fantrax answered: a refresh that fails serves this entry again, and its age is how Live tells. */
    fetchedAt: string | null;
  }> => {
    const raw = await orRefusal(fetchLiveScoring(FANTRAX_LEAGUE_ID, period));
    if (raw instanceof FantraxError) {
      return { scores: [], players: [], bench: [], remaining: [], refused: tell(raw), fetchedAt: null };
    }
    return {
      scores: mapLiveScores(raw).map((score) => [score.teamId, score]),
      players: mapLivePlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      bench: mapBenchPlayerPoints(raw).map((squad) => [squad.teamId, squad.players]),
      remaining: mapLiveRemaining(raw),
      refused: null,
      fetchedAt: new Date().toISOString(),
    };
  },
  (error) => ({ scores: [], players: [], bench: [], remaining: [], refused: tell(error), fetchedAt: null }),
  LIVE_REVALIDATE,
);

/** The period's sides after subs, once per request: Live and the layout's live strip both ask, and one screen gets one reading. */
const periodSides = cache(async (period: number) => {
  const { scores, players, bench, remaining, refused, fetchedAt } = await readScores(period);
  return { sides: await afterSubs(period, scores, [...players, ...bench], remaining ?? []), refused, fetchedAt };
});

/** Every team's score this period with the auto subs counted, the one total any screen prints, and each team's subs. */
export async function liveScores(period: number): Promise<{
  scores: Map<string, LiveTeamScore>;
  /** By team: who comes on for whom; absent where nobody does. */
  subs: Map<string, AutoSubPair[]>;
  refused: string | null;
  fetchedAt: string | null;
}> {
  // A Map does not survive the cache, so entries cross it and each caller gets its own Maps.
  const { sides, refused, fetchedAt } = await periodSides(period);
  return {
    scores: new Map(sides.map((side) => [side.score.teamId, side.score])),
    subs: new Map(sides.flatMap((side) => (side.subs.length === 0 ? [] : [[side.score.teamId, side.subs] as const]))),
    refused,
    fetchedAt,
  };
}

/** Each team's score after Fantrax's end-of-period subs; a bench is read only where a starter finished without a minute. */
async function afterSubs(
  period: number,
  scores: readonly [string, LiveTeamScore][],
  priced: readonly [string, LivePlayerPoints[]][],
  remaining: readonly LiveRemaining[],
): Promise<{ score: LiveTeamScore; subs: AutoSubPair[] }[]> {
  const info = await leagueInfo();
  if (info === null) return scores.map(([, score]) => ({ score, subs: [] }));
  const men = priced.flatMap(([, squad]) => squad);
  const read = { points: new Map(men.map((man) => [man.fantraxId, man.points])), minutes: minutesByMan(men, info.scoringCategories) };
  const limits = { min: rosterMinimums(), max: info.roster.maxActiveByPosition };
  return Promise.all(
    scores.map(async ([teamId, score]) => {
      const side = remaining.find((men) => men.teamId === teamId);
      if (side === undefined || !awaitsSub(side, read)) return { score, subs: [] };
      // A blank is a played match, so the period is locked.
      return withAutoSubs(score, side, { ...read, ...(await benchRoster(teamId, period, true)), limits });
    }),
  );
}

/** Every man Fantrax priced this period, eleven and reserves, by Fantrax id; empty when it refused. */
export async function periodPoints(period: number): Promise<Map<string, number>> {
  const { players, bench } = await readScores(period);
  return new Map([...players, ...bench].flatMap(([, squad]) => squad.map((man) => [man.fantraxId, man.points])));
}

/** One squad's points at each man's slot, filtered outside the shared cache and asked only behind
 *  the lineup gate, since the section a man is priced in reveals the eleven. `counted` is the
 *  eleven alone and makes the scoreline; the rest include reserves. Null when Fantrax refused. */
export async function squadLivePoints(
  period: number,
  teamId: string,
  categories: Record<string, ScoringCategory>,
): Promise<{
  points: Map<string, number | null>;
  breakdown: Record<string, BreakdownLine[]>;
  counted: Record<string, BreakdownLine[]>;
  /** Every count Fantrax stated for each man, noughts included, by the league's category code. */
  counts: Record<string, Record<string, string>>;
  /** Each man's minutes as Fantrax counts them, for a card's "not registered yet"; absent where it stated none. */
  played: Record<string, number>;
} | null> {
  const { players, bench, refused } = await readScores(period);
  if (refused !== null) return null;

  const eleven = players.find(([id]) => id === teamId)?.[1] ?? [];
  const reserves = bench.find(([id]) => id === teamId)?.[1] ?? [];
  const lines = (squad: LivePlayerPoints[]) =>
    Object.fromEntries(
      squad.map((player) => [player.fantraxId, liveBreakdown(player.categories, categories)]),
    );
  const counted = lines(eleven);
  return {
    points: new Map<string, number | null>(
      [...eleven, ...reserves].map((player) => [player.fantraxId, player.points]),
    ),
    breakdown: { ...counted, ...lines(reserves) },
    counted,
    counts: Object.fromEntries(
      [...eleven, ...reserves].map((player) => [
        player.fantraxId,
        Object.fromEntries(
          player.counts.flatMap(({ category, value }) => {
            const code = categories[category]?.code;
            return code === undefined || value === null ? [] : [[code, value]];
          }),
        ),
      ]),
    ),
    played: minutesByMan([...eleven, ...reserves], categories),
  };
}

/** The clean sheets Fantrax has not credited yet, per team. Empty without the league's scoring, and
 *  while the lineup gate is shut: a `+4` beside a squad says a defender is in the eleven. */
export function pendingByTeam(
  teams: readonly RosteredTeam[],
  rules: ScoringRules | null,
  snapshot: FootballSnapshot,
  display: RosterDisplay,
): Map<string, PendingCleanSheets> {
  if (display.show !== "lineup" || rules === null) return new Map();

  const inPlay = new Set(
    snapshot.fixtures.filter((fixture) => fixture.status === "live").map((fixture) => fixture.id),
  );
  if (inPlay.size === 0) return new Map();

  return new Map(teams.map((team) => [team.teamId, pendingCleanSheets(team, rules, inPlay)]));
}
