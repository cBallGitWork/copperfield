import { assistsOf, inGameweeks, totalsOver, touchFixtures, touchesOf } from "@epl/core";
import type { Club, PastMaps, PastSeason, RateTotals, Shot, Touch } from "@epl/core";
import { pastPlayed, seasonCounts, type Played } from "./rates";
import type { subject } from "../[fantraxId]/subject";
import { gameLog } from "../[fantraxId]/scouting";
import type { PassMark } from "../../components/football/shotGeometry";
import { intelShots, intelTouches } from "../../intel";

/** A man whose profile read answered. */
export type Found = Extract<Awaited<ReturnType<typeof subject>>, { intel: unknown }>;

/** One side as every view draws it, this season or a past one. */
export interface Man {
  name: string;
  /** His club now; null for a past season, whose club may not be it. */
  club: Club | undefined;
  /** His touches as points, or a past season's counts by cell; null with no map at all. */
  heat: readonly Touch[] | ReadonlyMap<number, number> | null;
  /** How many fixtures the touches came from; null where the season's file does not say. */
  matches: number | null;
  /** His shots; null for a past season with no map, whose count is a dash rather than nought. */
  shots: readonly PassMark[] | null;
  keyPasses: readonly Shot[];
  played: Played | null;
}

/** The range on screen: the season, or the gameweeks in it and which gameweek each fixture is. */
interface ManWindow {
  recent: boolean;
  inWindow: ReadonlySet<number>;
  gameweekOf: ReadonlyMap<number, number>;
}

/** One man over the window: FPL's totals (the season's, or his game log's added up), and the export's marks.
 *  A man the export never bridged has no touches, and his three export counts are a dash rather than nought. */
export async function manOver(side: Found, name: string, { recent, inWindow, gameweekOf }: ManWindow): Promise<Man> {
  const player = side.football?.player;
  const code = player?.code ?? -1;
  const keep = <Row extends { fplFixtureId: number }>(rows: readonly Row[]) =>
    recent ? inGameweeks(rows, gameweekOf, inWindow) : [...rows];
  const all = intelTouches.get(code);
  const touches = all === undefined ? undefined : { ...all, fixtures: keep(all.fixtures) };
  const shots = keep(intelShots.get(code) ?? []);
  const keyPasses = keep(assistsOf(intelShots, code));
  // The window is his game log: with FPL not answering it has no figures, rather than a window of noughts.
  const log = player !== undefined && recent ? await gameLog(player) : null;
  const totals: RateTotals | null =
    player === undefined
      ? null
      : recent
        ? log === null ? null : totalsOver(log.rows.map((row) => row.match), inWindow)
        : player.season;
  const played: Played | null =
    totals === null
      ? null
      : {
          ...totals,
          ...seasonCounts(recent ? null : (player?.season ?? null)),
          touches: touches === undefined ? null : touchesOf(touches, null).length,
          shots: touches === undefined ? null : shots.length,
          keyPasses: touches === undefined ? null : keyPasses.length,
        };
  return {
    name,
    club: side.football?.club,
    heat: touches === undefined ? null : touchesOf(touches, null),
    matches: touchFixtures(touches).length,
    shots,
    keyPasses,
    played,
  };
}

/** One man in a completed season: its line and, where a file holds it, its maps. No key passes: no file carries them. */
export function manIn(name: string, season: PastSeason, maps: PastMaps | null): Man {
  return {
    name,
    club: undefined,
    heat: maps?.counts ?? null,
    matches: null,
    shots: maps === null ? null : maps.shots.map((shot) => ({ ...shot, pass: null })),
    keyPasses: [],
    played: pastPlayed(season, maps),
  };
}
