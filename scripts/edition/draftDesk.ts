import {
  readRatingStore,
  type RatingStore,
  derbyOf,
  FANTRAX_LEAGUE_ID,
  byPositionDepth,
  datedKickoffs,
  fetchFixtures,
  fetchLeagueInfo,
  fetchLiveScoringDay,
  fetchSeasonResults,
  fetchTeamRosterInfo,
  draftReportsDue,
  headToHeads,
  isDated,
  clubById,
  minimumsOf,
  judgePage,
  getFootballSnapshot,
  londonDayOf,
  mapBenchOrder,
  mapFixtures,
  mapLeagueInfo,
  mapLiveScores,
  mapSeasonResults,
  matchupState,
  oldBoys,
  periodGameweeks,
  periodOfGameweek,
  sheetOf,
  threadsOf,
  type DayPoints,
  type DraftMan,
  type DraftSide,
  type MatchupContext,
  type NextOpponent,
  type PastProse,
  type Sheet,
  type SheetMan,
} from "@epl/core";
import derbies from "../../data/leagues/derbies.json";
import ratingsFile from "../../data/ratings/26-27.json";
import recordedLimits from "../../data/leagues/roster-limits.json";
import { readProjections } from "../intel";
import { readScoring } from "../scoring";
import { gatherRoundFacts } from "./facts";
import { categoryIds, matchReads, slotWorth, tallies } from "./draftReads";
import { withFitness, type StoryCache } from "./draftFitness";
import { draftManOf, type ManReads } from "./draftMen";
import { draftPast, pastAngles, pastProse } from "./draftPast";
import { draftSeason, gameweekFacts, placeOf, ranksAfter, sweepOf } from "./draftSeason";
import { earlierSheets } from "./earlierSheets";

// The draft match-up desk's reads for one gameweek, made into each match-up's facts and story at its end: Fantrax's
// points by London day, bench orders and fitness news, the football layer's goals and minutes, the table, runs, meetings
// and stories told before, and a projection that weighs a star's blank and never prints.

interface DraftDesk {
  gameweek: number;
  period: number;
  days: string[];
  /** The match-ups, the lead first; empty until the gameweek's matches are settled. */
  contexts: MatchupContext[];
  /** Each side's place once the gameweek is added, for the form strip; empty until the gameweek is done. */
  rankAfter: Map<string, number>;
  /** The headlines filed before this report, newest first, and their words by match-up. */
  pastHeadlines: string[];
  pastProse: PastProse[];
  notes: string[];
}

export async function draftDesk(gameweek: number): Promise<DraftDesk> {
  const [snapshot, info, schedule] = await Promise.all([getFootballSnapshot(gameweek), fetchLeagueInfo(FANTRAX_LEAGUE_ID).then(mapLeagueInfo), fetchFixtures().then(mapFixtures)]);
  const covering = periodOfGameweek(periodGameweeks(info.scoringPeriods, datedKickoffs(schedule)), gameweek);
  if (covering === undefined) throw new Error(`No Fantrax period covers gameweek ${gameweek}.`);
  const period = covering.period;
  const [facts, history, rawResults, scoring] = await Promise.all([gatherRoundFacts(info, snapshot, period), earlierSheets(info, snapshot, period), fetchSeasonResults(FANTRAX_LEAGUE_ID).catch(() => null), readScoring()]);
  const results = rawResults === null ? null : mapSeasonResults(rawResults);
  const season = await draftSeason(info, facts.table, results, facts.pedigree, period);

  const fixtures = schedule.filter(isDated).filter((f) => f.gameweek === gameweek);
  const days = [...new Set(fixtures.map((f) => londonDayOf(f.kickoff)!))].sort();
  const dayReads = await Promise.all(days.map((date) => fetchLiveScoringDay(FANTRAX_LEAGUE_ID, period, date).then((raw) => ({ date, raw })).catch(() => null)));
  const benchReads = await Promise.all(facts.teams.map((t) => fetchTeamRosterInfo(FANTRAX_LEAGUE_ID, t.teamId, period).then((raw) => ({ teamId: t.teamId, raw })).catch(() => null)));
  // A refused read leaves a score or a bench order we cannot tell, so no report is due and the firing goes on.
  const refused = [...dayReads, ...benchReads].filter((read) => read === null).length;
  if (refused > 0) {
    const notes = [`Due: nothing; Fantrax refused ${refused} of ${dayReads.length + benchReads.length} day and bench reads for period ${period}.`];
    return { gameweek, period, days, contexts: [], rankAfter: new Map(), pastHeadlines: [], pastProse: [], notes };
  }
  const reads = dayReads.filter((read) => read !== null);
  const orders = new Map(benchReads.filter((read) => read !== null).map((read) => [read.teamId, mapBenchOrder(read.raw)] as const));
  const { goals, starters, offs } = await matchReads(gameweek, fixtures, snapshot.players);

  const ids = categoryIds(info);
  const slots = Object.keys(info.roster.maxActiveByPosition).sort(byPositionDepth);
  const worth = slotWorth(scoring, ids, reads.map((r) => r.raw), facts.teams, slots);
  const min = minimumsOf(recordedLimits, FANTRAX_LEAGUE_ID);
  const limits = { min: min ?? {}, max: info.roster.maxActiveByPosition };
  const projections = readProjections();
  const clubs = clubById(snapshot);

  const dayTallies = reads.map((r) => ({ day: r.date, byMan: tallies([r.raw], ids) }));
  // Only once the gameweek's matches are all settled: an unplayed gameweek would read as nought-nought.
  const due = draftReportsDue(schedule, gameweek, new Date().toISOString()).length > 0;
  const notes = [
    `Returns by slot: ${slots.map((s) => `${s} ${worth.returns[s].map((w) => `${w.kind} ${w.worth}`).join(", ")}`).join("; ")}; a full match's minutes ${worth.appearance}.`,
    `Eleven limits: most ${JSON.stringify(limits.max)}; fewest ${min === null ? "not recorded for this league" : JSON.stringify(min)}.`,
    `Bench orders: ${[...orders.values()].filter((o) => o.by === "manager").length} of ${orders.size} set by the manager, the rest by total points.`,
    `Goal times read for ${goals.size} of ${fixtures.length} matches.`,
    `Due: ${due ? "gameweek" : "nothing yet; the gameweek's matches are not settled"}.`,
  ];
  if (!due) return { gameweek, period, days, contexts: [], rankAfter: new Map(), pastHeadlines: [], pastProse: [], notes };
  const last = days.at(-1)!;
  const byMan = tallies(reads.map((r) => r.raw), ids);
  // Each day's read is that day's points alone: the side's total is their sum.
  const byDay = new Map<string, DayPoints[]>();
  for (const { date, raw } of reads) for (const s of mapLiveScores(raw)) byDay.set(s.teamId, [...(byDay.get(s.teamId) ?? []), { day: date, points: s.points ?? 0 }]);

  const { marks, topMark } = ratingMaps(readRatingStore(ratingsFile));
  const reads_: ManReads = { gameweek, last, fixtures, clubs, byMan, days: dayTallies, worth, goals, starters, offs, history, projections, arrivals: season.arrivals, marks, topMark };
  const draftMan = (m: SheetMan, sheet: Sheet): DraftMan => draftManOf(m, sheet, reads_);
  const side = (teamId: string): DraftSide | null => {
    const team = facts.teams.find((t) => t.teamId === teamId);
    if (team === undefined) return null;
    const sheet = sheetOf(team);
    const order = orders.get(teamId)?.order ?? [];
    const rank = (m: SheetMan) => (order.includes(m.fantraxId) ? order.indexOf(m.fantraxId) : order.length);
    const days = byDay.get(teamId);
    return {
      teamId,
      name: team.teamName,
      total: days === undefined ? null : days.reduce((sum, d) => sum + d.points, 0),
      byDay: days ?? [],
      eleven: sheet.starters.map((m) => draftMan(m, sheet)),
      bench: [...sheet.bench].sort((a, b) => rank(a) - rank(b)).map((m) => draftMan(m, sheet)),
      subOrder: order,
    };
  };
  const stories: StoryCache = new Map();
  const fit = (s: DraftSide | null) => (s === null ? null : withFitness(s, fixtures, stories, Infinity));
  // Every match-up first: the gameweek's form and table facts need all of their results at once.
  const pairs = await Promise.all(facts.pairings.map(async (p) => ({ home: await fit(side(p.home.teamId)), away: await fit(side(p.away.teamId)) })));
  const states = pairs.flatMap(({ home, away }) => (home === null || away === null ? [] : [matchupState({ home, away }, limits)]));
  const formFacts = gameweekFacts(season, states);
  const rankAfter = ranksAfter(season, states);
  const boys = (men: DraftSide, them: DraftSide) => oldBoys(men.eleven, { teamId: them.teamId, name: them.name }, season.formerly);
  const nextOf = (teamId: string): NextOpponent | null => {
    // A double header names the first of his two: the column has room for one next opponent.
    const h2h = headToHeads(info.matchups, info.teams, period + 1, teamId)[0];
    return h2h === undefined ? null : { name: h2h.opponent.name, rank: rankAfter.get(h2h.opponent.teamId) ?? null };
  };
  const contexts = states.map((state): MatchupContext => ({
    state,
    places: { home: placeOf(season, state.home.side.teamId), away: placeOf(season, state.away.side.teamId) },
    form: [...(formFacts.get(state.home.side.teamId) ?? []), ...(formFacts.get(state.away.side.teamId) ?? []), ...[sweepOf(season, state.home.side, state.away.side, { for: state.home.total, against: state.away.total })].flatMap((f) => f ?? [])],
    oldBoys: [...boys(state.home.side, state.away.side), ...boys(state.away.side, state.home.side)],
    next: { home: nextOf(state.home.side.teamId), away: nextOf(state.away.side.teamId) },
    angle: null,
    derby: derbyOf(derbies.derbies, state.home.side.teamId, state.away.side.teamId),
  }));
  // The desk decides each match-up's story and the page's order; the writer tells them.
  const past = draftPast(gameweek);
  const judged = judgePage(contexts.map((ctx) => ({ ctx, threads: threadsOf(ctx, worth, gameweek) })), pastAngles(past));
  return { gameweek, period, days, contexts: judged, rankAfter, pastHeadlines: past.map((p) => p.headline), pastProse: pastProse(past), notes };
}

/** Every man's marks by fixture, and each fixture's top mark, for "the best player on the pitch". */
function ratingMaps(store: RatingStore): { marks: Map<number, Map<number, number | null>>; topMark: Map<number, number> } {
  const marks = new Map<number, Map<number, number | null>>();
  const topMark = new Map<number, number>();
  for (const [code, byFixture] of Object.entries(store.marks)) {
    marks.set(Number(code), new Map(Object.entries(byFixture).map(([f, v]) => [Number(f), v])));
    for (const [f, v] of Object.entries(byFixture)) if (v !== null) topMark.set(Number(f), Math.max(topMark.get(Number(f)) ?? 0, v));
  }
  return { marks, topMark };
}
