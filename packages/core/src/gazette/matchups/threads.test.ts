import { describe, expect, it } from "vitest";
import { contextOf } from "./__fixtures__/context";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { benchTurned, lateDecider } from "./__fixtures__/gw5";
import { worthOf } from "./__fixtures__/worth";
import { threadsOf } from "./threads";

const kinds = (ctx = lateDecider(), gameweek = 5) => threadsOf(ctx, worthOf(), gameweek);

describe("threadsOf", () => {
  it("finds GW5's late decider, decisive", () => {
    const threads = kinds();
    expect(threads.find((t) => t.kind === "late-decider")).toMatchObject({ weight: 110, decisive: true, men: [{ name: "Haaland" }] });
    expect(threads.map((t) => t.kind)).not.toContain("late-goal");
  });

  it("finds the bench that turned test4 v test3, said without a score before the substitutions", () => {
    const threads = kinds(benchTurned());
    expect(threads.find((t) => t.kind === "bench-turned")).toMatchObject({ weight: 120, beat: null, men: [{ name: "Vuskovic" }, { name: "Janelt" }] });
    expect(threads.find((t) => t.kind === "bench-turned")?.facts).toEqual(["test4 would have won without the automatic substitutions, which put Vuskovic in for Dunk and Janelt in for Jensen for test3"]);
  });

  it("never credits the winner's bench when it brought nobody on and the loser's own reserve cost it", () => {
    const blank = draftMan("Blank", "M", 0, 0, 0, { club: "Blank FC" });
    const sentOff = draftMan("Reserve", "M", -2, 12, 0, { club: "Red FC" });
    const ctx = contextOf(draftSide("Cows", 39, eleven("c")), draftSide("Pigs", 40, eleven("p", { 5: blank }), [sentOff]));
    expect(ctx.state.margin).toBe(1);
    expect(kinds(ctx).map((t) => t.kind)).not.toContain("bench-turned");
  });

  it("never credits the winner's bench when its substitutions brought in less than the margin", () => {
    const resC = draftMan("ResC", "M", 1, 20, 0, { club: "R1" });
    const resP = draftMan("ResP", "M", -3, 20, 0, { club: "R2" });
    const home = draftSide("Cows", 39, eleven("c", { 5: draftMan("BlankC", "M", 0, 0, 0, { club: "B1" }) }), [resC]);
    const away = draftSide("Pigs", 40, eleven("p", { 5: draftMan("BlankP", "M", 0, 0, 0, { club: "B2" }) }), [resP]);
    const ctx = contextOf(home, away);
    expect(ctx.state.margin).toBe(3);
    expect(kinds(ctx).map((t) => t.kind)).not.toContain("bench-turned");
  });

  it("never tells who led at a day's end: a day's score is the fixture list's", () => {
    const told = [...kinds(), ...kinds(benchTurned())];
    expect(told.map((t) => t.kind)).not.toEqual(expect.arrayContaining(["comeback"]));
    for (const kind of ["comeback", "lead-lost", "fightback-short", "days-won", "turning-point"]) expect(told.map((t) => t.kind)).not.toContain(kind);
    expect(told.flatMap((t) => t.facts).join(" ")).not.toMatch(/Friday|Saturday|Sunday|Monday|\b\d+-\d+\b/u);
  });

  it("tells a loser's reserve who outscored a starter in his position by more than the margin, in place of his bench six", () => {
    const kamada = draftMan("Kamada", "M", 8, 90, 0, { club: "Crystal Palace" });
    const ctx = contextOf(draftSide("Cows", 46, eleven("c")), draftSide("Pigs", 44, eleven("p"), [kamada]));
    const threads = kinds(ctx);
    expect(threads.find((t) => t.kind === "bench-cost")).toMatchObject({ teamId: "Pigs", men: [{ name: "Kamada" }], facts: ["Pigs lost by 2 with Kamada's 8 points on the bench, where pM5 got 2 points in the eleven"] });
    expect(threads.map((t) => t.kind)).not.toContain("bench-six");
  });

  it("tells two sides' men who both returned in the same Premier League match", () => {
    const match = { matches: [{ code: 7, label: "Man City v Sunderland", played: true, mark: null, best: false }] };
    const haaland = draftMan("Haaland", "F", 6, 90, 0, { ...match, club: "Man City", goals: 1 });
    const meunier = draftMan("Meunier", "D", 5, 90, 0, { ...match, club: "Sunderland", assists: 1 });
    const ctx = contextOf(draftSide("123", 40, eleven("o", { 9: haaland })), draftSide("test2", 30, eleven("t", { 1: meunier })));
    expect(kinds(ctx).find((t) => t.kind === "same-match")?.facts).toEqual(["Man City v Sunderland, one match: Haaland (a goal) for 123; Meunier (an assist) for test2"]);
  });

  it("weighs a signing whose points reach his side's winning margin above a man's ordinary story", () => {
    const mcginn = draftMan("McGinn", "M", 7, 90, 0, { club: "Aston Villa", goals: 1, arrived: "claim" });
    const signed = (them: number) => kinds(contextOf(draftSide("its_ohi", 40, eleven("o", { 6: mcginn })), draftSide("Bannan", them, eleven("b")))).find((t) => t.kind === "new-arrival")?.weight;
    expect(signed(34)).toBe(60);
    expect(signed(30)).toBe(45);
  });

  it("credits the one man whose returns alone outweigh the margin, and nobody when two men's do or none's", () => {
    const gross = draftMan("Groß", "M", 11, 90, 0, { club: "Brighton", goals: 1, assists: 1 });
    const ctx = contextOf(draftSide("123", 40, eleven("o", { 8: gross })), draftSide("test2", 33, eleven("t")));
    expect(kinds(ctx).find((t) => t.decisive && t.men[0] === gross)).toMatchObject({ kind: "haul", weight: 45 + 30 });
    const quiet = draftMan("Mitoma", "M", 7, 90, 0, { club: "Brighton", goals: 1 });
    const alone = contextOf(draftSide("123", 40, eleven("o", { 7: quiet })), draftSide("test2", 36, eleven("t")));
    expect(kinds(alone).find((t) => t.kind === "match-winner")).toMatchObject({ decisive: true, men: [quiet], facts: ["without Mitoma's returns test2 would have won"] });
    const two = contextOf(draftSide("123", 40, eleven("o", { 7: quiet, 8: gross })), draftSide("test2", 36, eleven("t")));
    expect(kinds(two).filter((t) => t.decisive)).toEqual([]);
    expect(kinds(contextOf(draftSide("123", 60, eleven("o", { 8: gross })), draftSide("test2", 30, eleven("t")))).filter((t) => t.decisive)).toEqual([]);
  });

  it("tells a goal that cost the other side's man his clean sheet, and a star's blank only from gameweek 6", () => {
    const match = { matches: [{ code: 9, label: "Man City v Everton", played: true, mark: null, best: false }] };
    const scorer = draftMan("Haaland", "F", 6, 90, 0, { ...match, club: "Man City", goals: 1, scoredAt: [goalAt(30)], projected: 9 });
    const victim = draftMan("Tarkowski", "D", 2, 90, 0, { ...match, club: "Everton", concededFirstAt: [goalAt(30)] });
    const salah = draftMan("Salah", "M", 2, 90, 0, { club: "Liverpool", projected: 8 });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 9: scorer, 5: salah })), draftSide("B", 30, eleven("a", { 1: victim })));
    expect(kinds(ctx).find((t) => t.kind === "crossfire")?.facts).toEqual(["Haaland scored in the 30th minute, the goal that cost Tarkowski his clean sheet for B"]);
    expect(kinds(ctx, 5).map((t) => t.kind)).not.toContain("star-blank");
    expect(kinds(ctx, 6).find((t) => t.kind === "star-blank")?.men[0]?.name).toBe("Salah");
  });

  it("calls a win from four places lower an upset only from the league's fourth gameweek, whatever the Premier League's", () => {
    const place = (rank: number, played: number) => ({ rank, won: 0, drawn: 0, lost: played, run: "" });
    const upset = (played: number) => kinds(contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a")), { places: { home: place(9, played), away: place(3, played) } }), 7).find((t) => t.kind === "upset");
    expect(upset(1)).toBeUndefined();
    expect(upset(3)?.facts).toEqual(["A were 9th going into the gameweek and B 3rd"]);
  });

  it("keeps the club's word on a man a reserve replaced, and no old boy who never played", () => {
    const out = draftMan("Reinildo", "D", null, 0, 0, { club: "Sunderland", fitness: "Reinildo is available again after his suspension" });
    const ctx = contextOf(draftSide("A", 40, eleven("h", { 1: out }), [draftMan("Mukiele", "D", 0, 90, 0, { club: "Sunderland" })]), draftSide("B", 30, eleven("a")), { oldBoys: [{ fantraxId: "Reinildo", line: "Reinildo faced B, who drafted him" }] });
    const threads = kinds(ctx);
    expect(threads.find((t) => t.kind === "injury")?.facts).toEqual(["Reinildo did not play; since: Reinildo is available again after his suspension"]);
    expect(threads.map((t) => t.kind)).not.toContain("old-boy");
  });

  it("weighs a keeper's haul by its size, and a man off the bench more when he returned", () => {
    // Both on the losing side, so neither is the man the winner's lead was built on.
    const keeper = draftMan("Raya", "G", 10, 90, 0, { club: "Arsenal", cleanSheets: 1 });
    const cameo = draftMan("Hemmings", "M", 6, 20, 0, { club: "Aston Villa", started: false, goals: 1 });
    const ctx = contextOf(draftSide("A", 40, eleven("h")), draftSide("B", 30, eleven("a", { 0: keeper, 5: cameo })));
    expect(kinds(ctx).find((t) => t.kind === "keeper-haul")?.weight).toBe(55);
    expect(kinds(ctx).find((t) => t.kind === "non-starter")?.weight).toBe(45);
  });

  it("gives a double gameweek's points in the house's words, and none when Fantrax has none", () => {
    const twice = (points: number | null) => draftMan("Wissa", "F", points, 1, 0, { played: 2, club: "Newcastle" });
    const double = (points: number | null) => kinds(contextOf(draftSide("Dons", 21, eleven("h", { 10: twice(points) })), draftSide("Rovers", 22, eleven("a")))).find((t) => t.kind === "double")?.facts;
    expect(double(1)).toEqual(["Wissa had two matches this gameweek, for 1 point"]);
    expect(double(null)).toEqual(["Wissa had two matches this gameweek"]);
  });

  it("costs nobody a clean sheet he was not on long enough to keep", () => {
    const kickoff = "2026-09-26T14:00:00Z";
    const match = [{ code: 1, label: "Man City v Sunderland", played: true, mark: null, best: false }];
    const haaland = draftMan("Haaland", "F", 6, 90, 0, { club: "Man City", goals: 1, scoredAt: [goalAt(10, undefined, kickoff)], matches: match });
    const late = draftMan("Mukiele", "D", 1, 20, 0, { club: "Sunderland", concededFirstAt: [goalAt(10, undefined, kickoff)], matches: match });
    const ctx = contextOf(draftSide("Dons", 26, eleven("h", { 10: haaland })), draftSide("Rovers", 21, eleven("a", { 2: late })));
    expect(kinds(ctx).map((t) => t.kind)).not.toContain("crossfire");
  });

});
