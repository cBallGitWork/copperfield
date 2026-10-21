import { groupedBy } from "../../grouped";
import { onPitch } from "./onPitch";
import type { IntelManifest } from "./types";
import type { Fixture } from "../types";

// Every shot and where it was struck from. The exporter already flips x to the touch clouds' convention: never again.

/** One shot. Each vocabulary is a closed set: the exporter drops an unknown value and names it in the manifest. */
export interface Shot {
  /** FPL's season-stable code. */
  code: number;
  fplFixtureId: number;
  minute: number | null;
  /** 0–100, his own goal to the one he attacks. */
  x: number;
  y: number;
  xg: number | null;
  /** Expected goals on target: what the strike was worth, not the chance. Null on a shot off target. */
  xgot: number | null;
  outcome: "goal" | "save" | "miss" | "block" | "post";
  situation: string | null;
  bodyPart: string | null;
  /** Who made it — Understat's last touch before the shot, as an FPL code. Null when unassisted or unplaced. */
  assistCode: number | null;
  /** Where his key pass started, in the shot's own frame; null when none landed near the shot. */
  pass: { x: number; y: number } | null;
}

export interface IntelShots {
  manifest: IntelManifest;
  shots: Shot[];
}

/** Every man's shots by code; a row keyed on `NaN` or off the pitch is dropped, since it would look real. */
export function shotIntel(shots: IntelShots | null): Map<number, Shot[]> {
  if (shots === null) return new Map();
  const read: Shot[] = [];
  for (const shot of shots.shots ?? []) {
    if (!Number.isInteger(shot?.code)) continue;
    if (!Number.isInteger(shot.fplFixtureId)) continue;
    if (!onPitch(shot.x) || !onPitch(shot.y)) continue;
    // An older export has neither field; a pass off the pitch is a mark that looks real, so it goes.
    read.push({
      ...shot,
      assistCode: Number.isInteger(shot.assistCode) ? shot.assistCode : null,
      pass: shot.pass != null && onPitch(shot.pass.x) && onPitch(shot.pass.y) ? shot.pass : null,
    });
  }
  return groupedBy(read, (shot) => shot.code);
}

/** The shots a man set up, whoever struck them: his key passes, each carrying where it started. */
export function assistsOf(shots: ReadonlyMap<number, readonly Shot[]>, code: number): Shot[] {
  const made: Shot[] = [];
  for (const struck of shots.values()) {
    for (const shot of struck) if (shot.assistCode === code) made.push(shot);
  }
  return made;
}

/** Every fixture the file holds a shot from: the matches it has taken in. */
export function shotFixtures(shots: ReadonlyMap<number, readonly Shot[]>): Set<number> {
  return new Set([...shots.values()].flatMap((his) => his.map((shot) => shot.fplFixtureId)));
}

/** The fixtures FPL's figures for a club's man already count: every one kicked off, live ones included. */
export function clubKickedOff(fixtures: readonly Fixture[], clubId: number): number[] {
  return fixtures
    .filter((fixture) => fixture.status !== "upcoming" && (fixture.homeClubId === clubId || fixture.awayClubId === clubId))
    .map((fixture) => fixture.id);
}

/** What his shots must cover: the fixtures his xG counts (`clubKickedOff`), against those the file holds. */
export interface ShotCover {
  counted: readonly number[];
  held: ReadonlySet<number>;
}

/** His expected goals less what his penalties were worth; null where his shots cannot vouch for it: none held, a
 *  match his xG counts that the file lacks (its penalty would stand), expected goals and no shot, or a penalty with no
 *  value. Never below nought on FPL's rounding. */
export function nonPenaltyXg(xg: number | null, shots: readonly Shot[] | null, cover: ShotCover | null): number | null {
  if (xg === null || shots === null || cover === null || (shots.length === 0 && xg > 0)) return null;
  if (cover.counted.some((fixture) => !cover.held.has(fixture))) return null;
  let penalties = 0;
  for (const shot of shots) {
    if (shot.situation !== "penalty") continue;
    if (shot.xg === null) return null;
    penalties += shot.xg;
  }
  return Math.max(0, xg - penalties);
}

/** Every shot in one fixture by the taker's code, earliest first; keyed because the export carries no team and the
 *  caller decides each code's side. */
export function shotsInFixture(shots: Map<number, Shot[]>, fixture: number): Map<number, Shot[]> {
  const here = new Map<number, Shot[]>();
  for (const [code, his] of shots) {
    const mine = his.filter((shot) => shot.fplFixtureId === fixture);
    if (mine.length > 0) here.set(code, mine.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0)));
  }
  return here;
}
