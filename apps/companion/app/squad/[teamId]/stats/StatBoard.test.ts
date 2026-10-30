import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, PlayerStatLine, RosteredPlayer } from "@epl/core";
import StatBoard from "./StatBoard";
import { rosterFacts } from "./roster";
import { noted, withWeeks } from "../../../components/football/withWeeks";

vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

const rogers = { code: 1, name: "Rogers", fullName: "Morgan Rogers", status: "i", chanceOfPlaying: 0, news: "Knee" } as unknown as FootballPlayer;
const squad = [
  { slot: { fantraxId: "r", position: "M", status: "" }, player: rogers, stats: [] },
  { slot: { fantraxId: "u", position: null, status: "" } },
] as unknown as RosteredPlayer[];

describe("rosterFacts", () => {
  it("names each man in full, as every list does, and an unsettled slot by its id", () => {
    const { names, footballers, slots } = rosterFacts(squad);
    expect(names).toEqual({ r: "Morgan Rogers", u: "u" });
    expect(footballers).toEqual({ r: rogers });
    expect(slots).toEqual({ r: ["M"], u: [] });
  });
});

describe("a squad's stat board", () => {
  const line = { fantraxId: "r", name: "Rogers, Morgan", club: null, clubShort: null, position: "M", ownerTeamId: "t", defaultPosition: "M", points: 10, stats: { G: 1 } } as PlayerStatLine;
  const { names, footballers } = rosterFacts(squad);
  const html = renderToStaticMarkup(
    withWeeks(createElement(StatBoard, { lines: [line], footballers, names, served: ["G"], statsLeague: {}, statsColumns: [], defcon: null })),
  );

  it("prints I. Surname under a thumb", () => {
    expect(html).toContain("M. Rogers");
  });

  it("marks an unfit man with CM's mark, never the word chip", () => {
    expect(html).toContain('role="img"');
    expect(html).not.toContain("cm-state");
  });

  it("notes his complaint and the export's return week on the desk alone", () => {
    expect(html).toContain(`>${noted("Knee", "GW10")}</span>`);
    // A2, review round 5: under a thumb the name cell cut the note to "K…"; the mark says it there.
    expect(html).toMatch(/<span class="[^"]*\bhidden\b[^"]*\blg:block\b[^"]*">Knee/);
  });
});
