import { kickoffOrder, type Fixture, type LineupDetail, type SquadPlayerDetail } from "@epl/core";

/** One of a manager's men in one real match, and whether his period's points print here. */
export interface FixtureMan {
  player: SquadPlayerDetail;
  reserve: boolean;
  /** False under the earlier of two matches: Fantrax's figure is the period's, so it prints once. */
  scored: boolean;
}

/** A sheet's men who play in one fixture, the eleven before the bench, most points first. */
export function fixtureMen(sheet: LineupDetail | undefined, fixtureId: number): FixtureMan[] {
  if (sheet === undefined) return [];
  const pick = (players: readonly SquadPlayerDetail[], reserve: boolean) =>
    players
      .filter((player) => (player.opposition ?? []).some(({ fixture }) => fixture.id === fixtureId))
      .map((player) => ({ player, reserve, scored: player.opposition?.at(-1)?.fixture.id === fixtureId }))
      .sort((a, b) => (b.player.points ?? -Infinity) - (a.player.points ?? -Infinity));
  return [...pick(sheet.rows.flatMap((line) => line.players), false), ...pick(sheet.bench, true)];
}

/** The round's fixtures in kick-off order, an undated one last. */
export function byKickoff(fixtures: readonly Fixture[]): Fixture[] {
  return [...fixtures].sort(kickoffOrder);
}

/** A man in one match and whose he is: 0 the URL's side, 1 the other. */
export interface PlacedMan extends FixtureMan {
  side: number;
}

/** Both sheets' men in one match, each under his own club's end, the URL's side first at either end. */
export function menByEnd(sheets: readonly (LineupDetail | undefined)[], fixtureId: number) {
  const placed = sheets.flatMap((sheet, side) => fixtureMen(sheet, fixtureId).map((man): PlacedMan => ({ ...man, side })));
  const atHome = (man: PlacedMan) => man.player.opposition?.find(({ fixture }) => fixture.id === fixtureId)?.home === true;
  return { home: placed.filter(atHome), away: placed.filter((man) => !atHome(man)) };
}
