import { createHash } from "node:crypto";
import {
  availabilityOf,
  elevensKey,
  FIRM,
  FIT_AGAIN,
  onTheBooks,
  owners,
  predictedLineups,
  roundSlot,
  squadIntel,
  type Club,
  type ExpectedMinutes,
  type Fixture,
  type FootballPlayer,
  type IntelSquads,
  type IntelXi,
  type LineupStatus,
  type PresserSignal,
  type RosteredTeam,
  type StoryLineupMan,
  type StoryLineupNews,
  type StoryLineupSide,
} from "@epl/core";
import { readIntel } from "../intel";
import { roundTies } from "./round";
import { display } from "./pressers";

// The predicted elevens, printed from the export and never written from it: no model call, since every word is a name,
// a position or a count, and a writer handed two hundred and twenty footballers can only mis-transcribe them.

/** Scout's latest elevens when they were made for this gameweek, else null: the column is filed as
 *  that gameweek's predictions, so an older eleven would print a wrong fact. The app draws it anyway. */
export function readXi(gameweek: number): IntelXi | null {
  const xi = readIntel<IntelXi>("xi");
  return xi?.manifest?.gameweek === gameweek ? xi : null;
}

/** The Line-Ups' covered-key, one per telling: a changed export spends a new key and refiles under the round's slug.
 *  `fetchedAt` moves only when the elevens do, so elevens that change and change back still refile. */
export function lineupsSlot(gameweek: number, xi: IntelXi): { key: string; slug: string } {
  const slot = roundSlot("predicted-xi", gameweek);
  const telling = createHash("sha256").update(`${xi.fetchedAt ?? ""}\n${elevensKey(xi.clubs)}`).digest("hex").slice(0, 8);
  return { key: `${slot.key}:${telling}`, slug: slot.slug };
}

/** The whole column, ready to file, and who it starts by code for its picture. Null when the ties or the elevens will
 *  not come, which files nothing and spends nothing. */
export function xiColumn(input: {
  xi: IntelXi;
  gameweek: number;
  clubs: ReadonlyMap<number, Club>;
  teams: readonly RosteredTeam[];
  players: readonly XiPlayer[];
  season: readonly Fixture[];
  /** The sister model's xMins by FPL code, off the projections export; empty prints none. */
  minutes: ReadonlyMap<number, readonly ExpectedMinutes[]>;
  /** This gameweek's presser signals, newest first: the conference's word on a man outside the eleven. */
  pressers?: readonly PresserSignal[];
}): { column: Record<string, unknown>; starters: ReadonlySet<number> } | null {
  const { xi, gameweek, clubs, teams, players, season, minutes, pressers = [] } = input;

  const ties = roundTies(gameweek, clubs, season);
  const marked = markOf(xi);
  const withNews = teamNews(players, teams, xi, clubs, marked, presserWords(pressers));
  const lineups = predictedLineups(ties, xi, man(players, teams, xi, gameweek, minutes, marked)).map((tie) => ({
    ...tie,
    home: withNews(tie.home),
    away: withNews(tie.away),
  }));
  if (lineups.length === 0) return null;

  // Read back off the export by each printed side's club, so a club whose tie did not print starts nobody.
  const starters = lineups
    .flatMap((tie) => [tie.home, tie.away])
    .flatMap((side) => xi.clubs?.[clubs.get(side.code)?.shortName ?? ""]?.starters ?? [])
    .map((starter) => starter.code);

  return {
    column: {
      headline: `Predicted Line-Ups: Gameweek ${gameweek}`,
      deck: `Every club's expected starting eleven for the gameweek.`,
      lineups,
    },
    starters: new Set(starters),
  };
}

/** What the desk reads of a footballer: his names, and his fitness. */
type XiPlayer = Pick<
  FootballPlayer,
  "code" | "name" | "fullName" | "clubId" | "status" | "news" | "newsAdded" | "chanceOfPlaying" | "season"
>;

/** One source's word on a man: a mark or none (fit), and when it was said; null when it says nothing of him. */
type Signal = { mark: LineupStatus | null; at: string | null } | null;

/** One mark from FPL's and RotoWire's words: the fresher wins where both speak, an undated word losing. */
export function freshestMark(fpl: Signal, rotowire: Signal): LineupStatus | null {
  if (fpl === null || rotowire === null) return (fpl ?? rotowire)?.mark ?? null;
  const [fplAt, rotowireAt] = [Date.parse(fpl.at ?? ""), Date.parse(rotowire.at ?? "")];
  if (Number.isNaN(fplAt)) return rotowire.mark ?? fpl.mark;
  if (Number.isNaN(rotowireAt)) return fpl.mark ?? rotowire.mark;
  return rotowireAt > fplAt ? rotowire.mark : fpl.mark;
}

/** RotoWire's word on each man of a club it covered, dated when the file first held it; Scout's clubs say nothing. */
function rotowireSignals(xi: IntelXi): (code: number) => Signal {
  const said = new Map<number, Signal>();
  for (const club of Object.values(xi.clubs ?? {})) {
    if (club.absent === undefined) continue;
    for (const man of club.starters) said.set(man.code, { mark: null, at: xi.fetchedAt });
    for (const man of club.absent) said.set(man.code, { mark: man.status === "OUT" ? "OUT" : "Doubt", at: xi.fetchedAt });
  }
  return (code) => said.get(code) ?? null;
}

/** His mark from FPL's and RotoWire's words together: OUT, Doubt, or null for fit. */
function markOf(xi: IntelXi): (player: XiPlayer) => LineupStatus | null {
  const rotowire = rotowireSignals(xi);
  return (player) => {
    const fitness = availabilityOf(player);
    const fpl = fitness.out ? "OUT" : fitness.state === "doubt" ? "Doubt" : null;
    return freshestMark({ mark: fpl, at: player.newsAdded }, rotowire(player.code));
  };
}

/** A complaint as the Line-Ups print it: "Thigh injury" is "Thigh", capitalised; null where it names nothing. */
export function complaintOf(text: string): string | null {
  const part = text.trim().replace(/\s+injury$/i, "");
  if (part === "" || /^(unspecified|unknown)( injury)?$/i.test(part)) return null;
  return part[0].toUpperCase() + part.slice(1);
}

/** FPL's note cut to its complaint: "Hamstring injury - Expected back 22 Nov" is "Hamstring"; null for none. */
export function briefNote(news: string): string | null {
  return complaintOf(news.split(" - ")[0]);
}

/** A presser's word on one man: his mark (null is fit again), when it was said, and the complaint in its own word. */
type PresserWord = { mark: LineupStatus | null; at: string; note: string | null };

/** What each conference tag says of a man's game; a tag absent here (rotation, managed load) says nothing of it. */
const PRESSER_MARK: Readonly<Record<string, LineupStatus | null>> = {
  ruled_out: "OUT",
  still_out: "OUT",
  suspended: "OUT",
  injury_scare: "Doubt",
  [FIT_AGAIN]: null,
};

/** The newest firm word per man, by FPL code; a hint under `FIRM` is no team news. */
export function presserWords(signals: readonly PresserSignal[]): ReadonlyMap<number, PresserWord> {
  const words = new Map<number, PresserWord>();
  for (const signal of signals) {
    if (words.has(signal.code) || signal.confidence < FIRM || !Object.hasOwn(PRESSER_MARK, signal.tag)) continue;
    const note = complaintOf(signal.tag === "suspended" ? "Suspended" : (signal.condition ?? ""));
    words.set(signal.code, { mark: PRESSER_MARK[signal.tag], at: signal.said, note });
  }
  return words;
}

/** Attaches to a side the men of its club outside the eleven who are out or in doubt, by season minutes so the names
 *  that matter lead: the presser's word where it is fresher than FPL's note, else FPL's and RotoWire's. */
function teamNews(
  players: readonly XiPlayer[],
  teams: readonly RosteredTeam[],
  xi: IntelXi,
  clubs: ReadonlyMap<number, Club>,
  marked: (player: XiPlayer) => LineupStatus | null,
  said: ReadonlyMap<number, PresserWord>,
): (side: StoryLineupSide) => StoryLineupSide {
  const held = owners(teams);
  return (side) => {
    const club = clubs.get(side.code);
    if (club === undefined) return side;
    const starting = new Set((xi.clubs?.[club.shortName]?.starters ?? []).map((starter) => starter.code));
    const news = players
      .filter((player) => player.clubId === club.id && !starting.has(player.code) && onTheBooks(player))
      .flatMap((player) => {
        const word = said.get(player.code);
        // The conference leads unless FPL's note is dated at or after it; an undated note never leads.
        const leads = word !== undefined && !(Date.parse(player.newsAdded ?? "") >= Date.parse(word.at));
        const status = leads ? word.mark : marked(player);
        if (status === null) return [];
        return [{ player, status, note: leads ? word.note : briefNote(player.news) }];
      })
      .sort((a, b) => b.player.season.minutes - a.player.season.minutes)
      .map(({ player, status, note }): StoryLineupNews => {
        const owner = held.get(player.code)?.teamId;
        return { name: display(player), ...(owner === undefined ? {} : { owner }), status, ...(note === null ? {} : { note }) };
      });
    return news.length === 0 ? side : { ...side, news };
  };
}

/** One starter as printed: his name, who holds him, his real position off the SQUADS export (nothing where that had
 *  only FPL's `element_type`), OUT or Doubt where the football says so, and his xMins. The eleven is never changed. */
function man(
  players: readonly XiPlayer[],
  teams: readonly RosteredTeam[],
  xi: IntelXi,
  gameweek: number,
  minutes: ReadonlyMap<number, readonly ExpectedMinutes[]>,
  marked: (player: XiPlayer) => LineupStatus | null,
): (code: number) => StoryLineupMan | null {
  const byCode = new Map(players.map((player) => [player.code, player]));
  // The squads for the season the XI itself names, so the two exports cannot be read from different years.
  const squads = squadIntel(readIntel<IntelSquads>("squads", xi.manifest.season));
  const held = owners(teams);

  return (code) => {
    const player = byCode.get(code);
    if (player === undefined) return null;
    // The id, never the name, which goes stale the day a manager renames.
    const owner = held.get(code)?.teamId;
    const status = marked(player);
    const xMins = minutes.get(code)?.find((week) => week.gameweek === gameweek)?.minutes ?? null;
    return {
      name: display(player),
      position: squads.get(code)?.position ?? null,
      ...(owner === undefined ? {} : { owner }),
      ...(status === null ? {} : { status }),
      ...(xMins === null ? {} : { xMins }),
    };
  };
}

