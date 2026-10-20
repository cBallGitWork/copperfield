import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SquadPlayerDetail } from "@epl/core";
import SquadMarker from "./SquadMarker";

vi.mock("next/image", () => ({ default: () => null }));

const unsettled = (position: string | null): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId: "x", position, status: "" }, unresolved: "unmapped" },
  club: undefined,
  opposition: undefined,
  points: undefined,
  minutes: [],
});

describe("an unsettled man's empty box on the pitch", () => {
  it("says his slot as every other box and card does, DEF and not the bare letter", () => {
    expect(renderToStaticMarkup(createElement(SquadMarker, { player: unsettled("D") }))).toContain(">DEF<");
  });

  it("says ? for a slot Fantrax left unnamed", () => {
    expect(renderToStaticMarkup(createElement(SquadMarker, { player: unsettled(null) }))).toContain(">?<");
  });
});

// The head-to-head's Lineups pitch: `points` is Fantrax's period score at his slot (`squadLivePoints`), never FPL's.
const rice = (points: number | null, status: "upcoming" | "live" | "finished"): SquadPlayerDetail => ({
  rostered: {
    slot: { fantraxId: "rice", position: "M", status: "" },
    player: { clubId: 1, name: "Rice", fullName: "Declan Rice", chanceOfPlaying: null, status: "a", news: "" },
    stats: [],
  } as unknown as SquadPlayerDetail["rostered"],
  club: { id: 1, shortName: "ARS" } as SquadPlayerDetail["club"],
  opposition: [{ club: { shortName: "WHU" }, home: true, difficulty: 2, fixture: { status } }] as unknown as SquadPlayerDetail["opposition"],
  points,
  minutes: [],
});
const band = (player: SquadPlayerDetail) =>
  [...renderToStaticMarkup(createElement(SquadMarker, { player })).matchAll(/<span class="w-full truncate">([^<]*)<\/span>/g)].map((m) => m[1]);

describe("the number on a head-to-head tile", () => {
  it("is the period score it is handed, once his club has kicked off", () => {
    expect(band(rice(6, "live"))).toEqual(["Rice", "6"]);
  });

  it("prints a man's nought: zero is a stat", () => {
    expect(band(rice(0, "finished"))).toEqual(["Rice", "0"]);
  });

  it("is a dash where Fantrax's table does not name him", () => {
    expect(band(rice(null, "finished"))).toEqual(["Rice", "—"]);
  });

  // Craig, 19 Oct 2026: "just show who he is playing", not the club on his shirt.
  it("is his fixture before it kicks off, whatever the table says", () => {
    expect(band(rice(3, "upcoming"))).toEqual(["Rice", "v WHU (H)"]);
  });

  // 19 Oct 2026: FPL's fixtures held from before kickoff while its reads were refused; Fantrax had credited him.
  it("is his score when Fantrax has credited him, though FPL's fixture still reads as to come", () => {
    const html = renderToStaticMarkup(createElement(SquadMarker, { player: rice(6, "upcoming"), started: true }));
    expect([...html.matchAll(/<span class="w-full truncate">([^<]*)<\/span>/g)].map((m) => m[1])).toEqual(["Rice", "6"]);
  });

  it("is a dash for a man whose club has no match this gameweek", () => {
    expect(band({ ...rice(null, "upcoming"), opposition: [] })).toEqual(["Rice", "—"]);
  });

  it("is a dash, never his club, on a week still to come with no match in it", () => {
    const blank = { ...rice(null, "upcoming"), opposition: [] };
    const fixtureBand = [
      ...renderToStaticMarkup(createElement(SquadMarker, { player: blank, show: "fixture" })).matchAll(
        /<span class="w-full truncate">([^<]*)<\/span>/g,
      ),
    ].map((m) => m[1]);
    expect(fixtureBand).toEqual(["Rice", "—"]);
  });
});

// A phone's filled pitch has height to spare, so a plate whose name has a break wraps it rather than cutting it.
const named = (name: string): SquadPlayerDetail => {
  const man = rice(4, "live");
  const rostered = man.rostered as unknown as { player: object };
  return { ...man, rostered: { ...rostered, player: { ...rostered.player, name, fullName: name } } as unknown as SquadPlayerDetail["rostered"] };
};
const plate = (name: string) =>
  renderToStaticMarkup(createElement(SquadMarker, { player: named(name) })).match(/<span class="([^"]*cm-bevel[^"]*)">/)?.[1] ?? "";

describe("a name plate on the grass", () => {
  it("may break a double-barrelled name onto two lines", () => {
    expect(plate("Maitland-Niles")).toContain("pitch-name-breaks");
  });

  it("keeps a single word on one line, cut if it must be", () => {
    expect(plate("Donnarumma")).not.toContain("pitch-name-breaks");
  });
});
