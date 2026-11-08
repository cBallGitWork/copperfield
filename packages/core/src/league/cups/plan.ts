import { ordinal } from "../ordinal";
import { seededBracket, type BracketRound, type BracketSide } from "./bracket";
import type { Cup, GroupStage } from "./declared";
import { doubleBracket } from "./doubleBracket";
import { groupQualifiers } from "./groupTable";
import { roundRobin } from "./roundRobin";
import { scheduleRounds } from "./schedule";
import type { LeagueTeam } from "../types";

/** One cup match. `code` is how a later round names it ("M5"); a side whose team is known also carries it. */
export interface CupFixture {
  code: string | null;
  home: string;
  away: string;
  homeTeam?: LeagueTeam;
  awayTeam?: LeagueTeam;
}

/** A tie settled, by its code: who went through and who dropped to the losers' side. */
export type CupDecided = ReadonlyMap<string, { winner: LeagueTeam; loser: LeagueTeam }>;

export interface CupStage {
  name: string;
  /** Where the bracket draws it. A double elimination's final closes the winners' side. */
  side: "groups" | "winners" | "losers";
  gameweek: number;
  fixtures: CupFixture[];
}

/** A cup's whole calendar for a league of `teams`. `seeds` names a gameweek-seeded cup's entrants, best first, and
 *  `decided` the ties already settled; a side nobody names is a placeholder: "Seed 7", "A1", "2nd B", "Winner M5". */
export function cupPlan(cup: Cup, teams: number, seeds: readonly LeagueTeam[] = [], decided: CupDecided = new Map()): CupStage[] {
  if (cup.seeding.from === "groups") {
    const groups = cupGroups(cup, teams);
    const seeds = groupQualifiers(
      groups.map((slots, group) => slots.map((_, place) => `${ordinal(place + 1)} ${letter(group)}`)),
      cup.seeding.stage.qualify,
    );
    return [...groupStages(groups, cup.seeding.stage), ...knockoutStages(cup, seeds, [], decided)];
  }
  const labels = Array.from({ length: teams }, (_, at) => seeds[at]?.name ?? `Seed ${at + 1}`);
  return knockoutStages(cup, labels, seeds, decided);
}

/** Each group's draw slots, "A1" to "A5": as even as the teams allow, the first groups taking any spare.
 *  None for a cup with no groups. */
export function cupGroups(cup: Cup, teams: number): string[][] {
  if (cup.seeding.from !== "groups") return [];
  const stage = cup.seeding.stage;
  return Array.from({ length: stage.groups }, (_, group) => {
    const size = Math.floor(teams / stage.groups) + (group < teams % stage.groups ? 1 : 0);
    return Array.from({ length: size }, (_, at) => `${letter(group)}${at + 1}`);
  });
}

function groupStages(groups: readonly string[][], stage: GroupStage): CupStage[] {
  const rounds = groups.map(roundRobin);
  const matchdays = Math.max(0, ...rounds.map((group) => group.length));
  return Array.from({ length: matchdays }, (_, at) => ({
    name: `Groups · matchday ${at + 1}`,
    side: "groups" as const,
    gameweek: stage.firstGameweek + at,
    fixtures: rounds.flatMap((group) => (group[at] ?? []).map(([home, away]) => ({ code: null, home, away }))),
  }));
}

function knockoutStages(cup: Cup, seeds: readonly string[], teams: readonly LeagueTeam[], decided: CupDecided): CupStage[] {
  const double = cup.knockout.elimination === "double";
  const rounds = double ? doubleBracket(seeds.length) : seededBracket(seeds.length);
  const gameweeks = scheduleRounds(rounds, cup.knockout.finalGameweek);
  const gameweekOf = (round: BracketRound) => gameweeks.get(round.id) ?? cup.knockout.finalGameweek;
  const played = [...rounds].sort(
    (a, b) => gameweekOf(a) - gameweekOf(b) || BRACKET_ORDER.indexOf(a.id[0] ?? "") - BRACKET_ORDER.indexOf(b.id[0] ?? ""),
  );
  const codes = new Map(played.flatMap((round) => round.ties).map((tie, at) => [tie.id, `M${at + 1}`]));
  const names = double ? doubleNames(rounds) : singleNames(rounds);

  // A side's team: its seed's, or the winner or loser of a settled tie it waits on.
  const teamOf = (side: BracketSide): LeagueTeam | undefined => {
    if ("seed" in side) return teams[side.seed - 1];
    const tie = decided.get(codes.get("winnerOf" in side ? side.winnerOf : side.loserOf) ?? "");
    return tie === undefined ? undefined : "winnerOf" in side ? tie.winner : tie.loser;
  };
  const label = (side: BracketSide) => {
    const team = teamOf(side);
    if (team !== undefined) return team.name;
    if ("seed" in side) return seeds[side.seed - 1] ?? `Seed ${side.seed}`;
    if ("winnerOf" in side) return `Winner ${codes.get(side.winnerOf) ?? ""}`;
    return `Loser ${codes.get(side.loserOf) ?? ""}`;
  };
  const sideTeam = (key: "homeTeam" | "awayTeam", side: BracketSide) => {
    const team = teamOf(side);
    return team ? { [key]: team } : {};
  };

  return played.map((round) => ({
    name: names.get(round.id) ?? round.id,
    side: round.id.startsWith("L") ? ("losers" as const) : ("winners" as const),
    gameweek: gameweekOf(round),
    fixtures: round.ties.map((tie) => ({
      code: codes.get(tie.id) ?? null,
      home: label(tie.home),
      away: label(tie.away),
      ...sideTeam("homeTeam", tie.home),
      ...sideTeam("awayTeam", tie.away),
    })),
  }));
}

/** Within a gameweek the winners' round reads before the losers'. */
const BRACKET_ORDER = "WLF";

const FROM_THE_END = ["Final", "Semi-finals", "Quarter-finals"];

function singleNames(rounds: readonly BracketRound[]): Map<string, string> {
  return new Map(
    rounds.map((round, at) => [round.id, FROM_THE_END[rounds.length - 1 - at] ?? `Round ${at + 1}`]),
  );
}

/** "Round 2", "Winners' final", "Losers' round 1", "Losers' final", "Final". Losers' rounds count
 *  from the first one played, since byes can leave the bracket's first empty. */
function doubleNames(rounds: readonly BracketRound[]): Map<string, string> {
  const winners = rounds.filter((round) => round.id.startsWith("W"));
  const losers = rounds.filter((round) => round.id.startsWith("L"));
  const names = new Map<string, string>([["F", "Final"]]);
  winners.forEach((round, at) =>
    names.set(round.id, at === winners.length - 1 ? "Winners' final" : `Round ${at + 1}`),
  );
  losers.forEach((round, at) =>
    names.set(round.id, at === losers.length - 1 ? "Losers' final" : `Losers' round ${at + 1}`),
  );
  return names;
}

function letter(group: number): string {
  return String.fromCharCode(65 + group);
}
