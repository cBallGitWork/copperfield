import { describe, expect, it } from "vitest";
import { newsdesk, type Club, type FootballPlayer, type PresserSignal, type DeskState, type Fixture, type IntelXi } from "@epl/core";
import { briefNote, freshestMark, lineupsSlot, presserWords, xiColumn } from "./xi";

// Four clubs in two matches, eleven men each: a gameweek small enough to read.
const SHORT = ["ARS", "LEE", "CHE", "BOU"];
const clubs = new Map<number, Club>(SHORT.map((shortName, at) => [at + 1, { id: at + 1, code: at + 1, name: shortName, shortName } as Club]));
const squad = (club: number) => Array.from({ length: 11 }, (_, at) => club * 100 + at);
// Man100 is out (Isak on 9 Oct: `i`, 0%, "Thigh injury"), Man101 a doubt at 50%, the rest fit.
const fitness = (code: number) =>
  code === 100
    ? { status: "i", news: "Thigh injury - Unknown return date", newsAdded: "2026-10-08T10:00:00Z", chanceOfPlaying: 0 }
    : code === 101
      ? { status: "d", news: "Knock - 50% chance of playing", newsAdded: "2026-10-08T10:00:00Z", chanceOfPlaying: 50 }
      : { status: "a", news: "", newsAdded: null, chanceOfPlaying: null };
const players = SHORT.flatMap((_, at) => squad(at + 1)).map((code) => ({
  code,
  name: `Man${code}`,
  fullName: `First Man${code}`,
  clubId: Math.floor(code / 100),
  season: { minutes: 0 } as FootballPlayer["season"],
  ...fitness(code),
}));
const eleven = (club: number) => ({ formation: "4-4-2", slots: { "1": 1, "2": 4, "3": 4, "4": 2 }, starters: squad(club).map((code) => ({ code, prob: 0.9 })) });
const season = [
  { gameweek: 6, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T11:30:00Z" },
  { gameweek: 6, homeClubId: 3, awayClubId: 4, kickoff: "2026-10-10T14:00:00Z" },
] as Fixture[];
// A season no export is held for, so no squads file is read.
const xiOf = (elevens: Record<string, ReturnType<typeof eleven>>) =>
  ({ manifest: { season: "none", gameweek: 6, exportedAt: "", rows: 4, sources: [] }, fetchedAt: null, source: null, clubs: elevens }) as IntelXi;
const column = (xi: IntelXi) => xiColumn({ xi, gameweek: 6, clubs, teams: [], players, season, minutes: new Map() })?.column;

describe("xiColumn", () => {
  it("files each man's xMins for the gameweek, and none where the model has no reading", () => {
    const minutes = new Map([[100, [{ gameweek: 5, minutes: 90 }, { gameweek: 6, minutes: 34 }]], [101, [{ gameweek: 6, minutes: null }]]]);
    const xi = xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) });
    const filed = xiColumn({ xi, gameweek: 6, clubs, teams: [], players, season, minutes })?.column;
    const men = (filed?.lineups as { home: { men: { xMins?: number }[] } }[])[0].home.men;
    expect(men[0].xMins).toBe(34);
    expect(men[1]).not.toHaveProperty("xMins");
    expect(men[2]).not.toHaveProperty("xMins");
  });

  it("calls the week a gameweek in its deck, never a round", () => {
    const filed = column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }));
    expect(filed?.deck).toBe("Every club's expected starting eleven for the gameweek.");
  });

  // Craig, 9 Oct: "with both sides named and that line too, just repeated ai slip". Headline, deck and the elevens.
  it("files no body, whole or short of a match", () => {
    expect(column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }))).not.toHaveProperty("body");
    expect(column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3) }))).not.toHaveProperty("body");
  });

  // Craig, 9 Oct: "Showing Isak as starting when he's out". Scout's eleven is printed as given, and marked.
  it("marks a man the football says is out, and a doubt, never replacing either", () => {
    const filed = column(xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }));
    const men = (filed?.lineups as { home: { men: { name: string; status?: string }[] } }[])[0].home.men;
    expect(men).toHaveLength(11);
    expect(men[0]).toMatchObject({ name: "First Man100", status: "OUT" });
    expect(men[1]).toMatchObject({ name: "First Man101", status: "Doubt" });
    expect(men[2].status).toBeUndefined();
  });

  it("starts only the men of the ties it printed, for the picture", () => {
    const filed = xiColumn({ xi: xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3) }), gameweek: 6, clubs, teams: [], players, season, minutes: new Map() });
    expect([...(filed?.starters ?? [])].sort((a, b) => a - b)).toEqual([...squad(1), ...squad(2)]);
  });
});

describe("the Line-Ups' team news", () => {
  const injured = (code: number, news: string, minutes: number, status = "i") => ({
    code, name: `Bench${code}`, fullName: `First Bench${code}`, clubId: 1, season: { minutes } as FootballPlayer["season"],
    status, news, newsAdded: "2026-10-08T10:00:00Z", chanceOfPlaying: status === "d" ? 50 : 0,
  });
  const bench = [
    injured(150, "Knock - 75% chance of playing", 900, "d"),
    injured(151, "Hamstring injury - Expected back 22 Nov", 300),
    injured(152, "Knee injury - Unknown return date", 800),
    injured(153, "Joined Roma on loan", 1200, "u"),
    { ...injured(154, "", 1000), status: "a", chanceOfPlaying: null },
  ];
  const filed = (extra: typeof bench, pressers: PresserSignal[] = []) =>
    xiColumn({ xi: xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }), gameweek: 6, clubs, teams: [], players: [...players, ...extra], season, minutes: new Map(), pressers })
      ?.column.lineups as { home: { news?: unknown[] }; away: { news?: unknown[] } }[];

  it("lists the club's men outside the eleven who are out or a doubt, by season minutes, each in a few words", () => {
    expect(filed(bench)[0].home.news).toEqual([
      { name: "First Bench150", status: "Doubt", note: "Knock" },
      { name: "First Bench152", status: "OUT", note: "Knee" },
      { name: "First Bench151", status: "OUT", note: "Hamstring" },
    ]);
  });

  it("files no news for a side nobody misses, and never repeats a marked starter", () => {
    const tie = filed([])[0];
    expect(tie.home).not.toHaveProperty("news");
    expect(tie.away).not.toHaveProperty("news");
  });

  const signal = (code: number, tag: string, said: string, condition?: string): PresserSignal =>
    ({ code, club: 1, tag, said, confidence: 0.9, manager: "Arteta", ...(condition === undefined ? {} : { condition }) });

  it("takes the presser's word and its complaint where it is fresher than FPL's note, a fit-again included", () => {
    const pressers = [
      signal(150, "available", "2026-10-09T12:00:00Z"),
      signal(154, "ruled_out", "2026-10-09T12:00:00Z", "calf"),
      signal(151, "injury_scare", "2026-10-09T12:00:00Z", "hamstring"),
    ];
    expect(filed(bench, pressers)[0].home.news).toEqual([
      { name: "First Bench154", status: "OUT", note: "Calf" },
      { name: "First Bench152", status: "OUT", note: "Knee" },
      { name: "First Bench151", status: "Doubt", note: "Hamstring" },
    ]);
  });

  it("keeps FPL's word where its note is newer than the conference", () => {
    const news = filed(bench, [signal(151, "available", "2026-10-07T12:00:00Z")])[0].home.news;
    expect(news).toContainEqual({ name: "First Bench151", status: "OUT", note: "Hamstring" });
  });

  it("reads the newest firm word per man, says Suspended for a ban, and ignores a hint or a rotation", () => {
    const words = presserWords([
      signal(1, "suspended", "2026-10-09T12:00:00Z"),
      signal(1, "injury_scare", "2026-10-08T12:00:00Z", "knee"),
      { ...signal(2, "ruled_out", "2026-10-09T12:00:00Z"), confidence: 0.6 },
      signal(3, "rotation_risk", "2026-10-09T12:00:00Z"),
      signal(4, "constructor", "2026-10-09T12:00:00Z"),
    ]);
    expect(words.get(1)).toEqual({ mark: "OUT", at: "2026-10-09T12:00:00Z", note: "Suspended" });
    expect([...words.keys()]).toEqual([1]);
  });

  it("cuts FPL's note to its complaint", () => {
    expect(briefNote("Suspended until 15 Nov")).toBe("Suspended until 15 Nov");
    expect(briefNote("")).toBeNull();
  });

  // Craig, 6 Nov 2026: "Don't say thigh injury, just say thigh".
  it("names the part, never the word injury, and nothing for an unspecified one", () => {
    expect(briefNote("Thigh injury - 75% chance of playing")).toBe("Thigh");
    expect(briefNote("Knock - Unknown return date")).toBe("Knock");
    expect(briefNote("Unspecified injury - Unknown return date")).toBeNull();
    expect(presserWords([{ code: 1, club: 1, tag: "injury_scare", condition: "knee injury", said: "2026-10-09T12:00:00Z", confidence: 0.9, manager: "" }]).get(1)?.note).toBe("Knee");
  });
});

describe("freshestMark", () => {
  const TUE = "2026-10-06T10:00:00Z";
  const FRI = "2026-10-09T10:00:00Z";

  it("takes whichever source speaks when only one does", () => {
    expect(freshestMark({ mark: "Doubt", at: TUE }, null)).toBe("Doubt");
    expect(freshestMark(null, { mark: "OUT", at: FRI })).toBe("OUT");
    expect(freshestMark(null, null)).toBeNull();
  });

  it("prefers the fresher word, a clean bill included", () => {
    expect(freshestMark({ mark: "OUT", at: TUE }, { mark: "Doubt", at: FRI })).toBe("Doubt");
    expect(freshestMark({ mark: "OUT", at: FRI }, { mark: "Doubt", at: TUE })).toBe("OUT");
    expect(freshestMark({ mark: "Doubt", at: TUE }, { mark: null, at: FRI })).toBeNull();
  });

  it("lets an undated FPL clean bill lose to RotoWire's mark", () => {
    expect(freshestMark({ mark: null, at: null }, { mark: "Doubt", at: FRI })).toBe("Doubt");
  });
});

describe("xiColumn with RotoWire's absences", () => {
  // Man402 is fit by FPL and questionable by RotoWire; Man100 is out by FPL, whose word is fresher than RotoWire's file.
  const rotowire = (club: number, absent: { code: number; status: "OUT" | "QUES" }[]) => ({ ...eleven(club), lineup: "predicted" as const, absent });
  const xi = {
    ...xiOf({ ARS: rotowire(1, []), LEE: eleven(2), CHE: eleven(3), BOU: rotowire(4, [{ code: 402, status: "QUES" }]) }),
    fetchedAt: "2026-10-07T10:00:00Z",
  };
  const ties = column(xi)?.lineups as { home: { men: { status?: string }[] }; away: { men: { status?: string }[] } }[];

  it("prints a QUES man as a Doubt", () => {
    expect(ties[1].away.men[2].status).toBe("Doubt");
  });

  it("keeps FPL's fresher OUT over RotoWire's older clean bill, one mark each", () => {
    expect(ties[0].home.men[0].status).toBe("OUT");
  });
});

describe("the Line-Ups refile when the elevens change", () => {
  // GW6 locks Sat 10 Oct at 12:15 London; the elevens are due from 18:00 the evening before.
  const next = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };
  const FRIDAY = "2026-10-09T18:00:00.000Z";
  const SATURDAY = "2026-10-10T09:00:00.000Z";
  const filed = { ...xiOf({ ARS: eleven(1), LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }), fetchedAt: "2026-10-09T16:40:00Z" };
  const benched = { ...xiOf({ ARS: { ...eleven(1), starters: [...eleven(1).starters.slice(1), { code: 111, prob: 0.9 }] }, LEE: eleven(2), CHE: eleven(3), BOU: eleven(4) }), fetchedAt: "2026-10-10T07:40:00Z" };
  const desk = (xi: IntelXi): DeskState => ({
    gameweek: 5, period: 5, finished: true, ties: [], pressers: [], lineups: lineupsSlot(6, xi),
    ahead: { period: 6, gameweek: 6 }, next, season: null, reportDays: [], draftReports: [], trades: [],
  });
  const spent = new Set([lineupsSlot(6, filed).key]);
  const due = (xi: IntelXi, now: string) =>
    newsdesk(desk(xi), (key) => spent.has(key), now).filter((each) => each.kind === "predicted-xi");

  it("keys each telling of the elevens, under the round's one slug", () => {
    expect(lineupsSlot(6, filed)).toEqual(lineupsSlot(6, { ...filed }));
    expect(lineupsSlot(6, filed).key).toMatch(/^predicted-xi:gw6:[0-9a-f]{8}$/);
    expect(lineupsSlot(6, benched).key).not.toBe(lineupsSlot(6, filed).key);
    expect(lineupsSlot(6, benched).slug).toBe("gw6-predicted-xi");
  });

  it("files nothing when the export is unchanged since the last filing", () => {
    expect(due(filed, SATURDAY)).toEqual([]);
  });

  it("refiles under the same slug when an eleven changes", () => {
    expect(due(benched, SATURDAY).map((each) => each.slug)).toEqual(["gw6-predicted-xi"]);
  });

  it("refiles when RotoWire's absences change and the men do not", () => {
    const doubt = { ...filed, clubs: { ...filed.clubs, ARS: { ...eleven(1), absent: [{ code: 111, status: "QUES" as const }] } } };
    expect(due(doubt, SATURDAY)).toHaveLength(1);
  });

  it("refiles nothing after the lock, nor before the filing time", () => {
    expect(due(benched, next.locksAt)).toEqual([]);
    expect(due(benched, "2026-10-09T16:59:00.000Z")).toEqual([]);
    expect(due(benched, FRIDAY)).toHaveLength(1);
  });
});
