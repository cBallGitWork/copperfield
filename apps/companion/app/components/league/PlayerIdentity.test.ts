import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Opposition, RosteredPlayer } from "@epl/core";
import PlayerIdentity from "./PlayerIdentity";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => ({ LABEL: "", QUIET_FIGURE: "" }));

const rostered: RosteredPlayer = { slot: { fantraxId: "x", position: "D", status: "ACTIVE" }, unresolved: "unmapped" };

const card = (opposition: Opposition[] | undefined) =>
  renderToStaticMarkup(createElement(PlayerIdentity, { rostered, club: undefined, opposition }));

describe("the player card's fixture line", () => {
  it("promises no match to a man whose club has none this gameweek", () => {
    expect(card([])).toContain("No fixture");
    expect(card([])).not.toContain("Yet to play");
  });

  it("promises no match to a man the card has no fixture list for", () => {
    expect(card(undefined)).not.toContain("Yet to play");
  });

  it("still says when a man with a match to come kicks off", () => {
    const fixture = { id: 1, status: "upcoming", kickoff: "2026-10-10T14:00:00Z" };
    const against = { club: { shortName: "ARS" }, home: true, difficulty: 3, fixture } as unknown as Opposition;
    expect(card([against])).toContain("Kicks off Sat 15:00");
  });

  it("writes the opponent as the squad list beside it does, never with an @ (review USERS-10)", () => {
    const fixture = { id: 1, status: "upcoming", kickoff: "2026-10-10T14:00:00Z" };
    const at = (home: boolean) => ({ club: { shortName: "LEE" }, home, difficulty: 3, fixture }) as unknown as Opposition;
    expect(card([at(false)])).toContain("LEE (A)");
    expect(card([at(true)])).toContain("LEE (H)");
    expect(card([at(false)])).not.toContain("@");
  });

  // Craig, 19 Oct 2026: a tap brought up "no live points for the player/scores etc".
  const played = (status: "live" | "finished", home: boolean) => {
    const fixture = { id: 2, status, kickoff: "2026-10-10T14:00:00Z", homeScore: 2, awayScore: 1, minutes: 63 };
    return { club: { shortName: "IPS" }, home, difficulty: 3, fixture } as unknown as Opposition;
  };
  const citys = (opposition: Opposition[]) =>
    renderToStaticMarkup(
      createElement(PlayerIdentity, { rostered, club: { shortName: "MCI" } as never, opposition }),
    );

  it("gives the score of his match, home side first, and the minute while it runs", () => {
    expect(citys([played("live", true)])).toMatch(/MCI 2–1 IPS.*63′/);
    expect(citys([played("live", true)])).not.toContain("Kicks off");
  });

  it("puts the home side first when he is away", () => {
    expect(citys([played("finished", false)])).toContain("IPS 2–1 MCI");
  });

  // UX-10, 19 Oct 2026: Sarr's red difficulty chip "BHA (A)" over "BHA 5–0 CRY FT" read as the result.
  it("drops the fixture chip and its difficulty colour once his match has kicked off", () => {
    const html = citys([played("finished", true)]);
    expect(html).not.toContain("IPS (H)");
    expect(html).not.toContain("--color-fdr");
    expect(html).toContain("MCI 2–1 IPS");
  });

  it("says FT once his match is over", () => {
    expect(citys([played("finished", true)])).toMatch(/MCI 2–1 IPS.*FT/);
  });

  // 19 Oct 2026: Fantrax credits him while FPL still has his match upcoming (`underway`).
  it("keeps the 'v' and the opponent, in plain ink and with no kickoff, when Fantrax has him on before FPL", () => {
    const fixture = { id: 1, status: "upcoming", kickoff: "2026-10-10T14:00:00Z" };
    const against = { club: { shortName: "LEE" }, home: false, difficulty: 5, fixture } as unknown as Opposition;
    const html = renderToStaticMarkup(createElement(PlayerIdentity, { rostered, club: undefined, opposition: [against], started: true }));
    expect(html).toMatch(/>v<.*LEE \(A\)/);
    expect(html).not.toContain("--color-fdr");
    expect(html).not.toContain("Kicks off");
  });
});

describe("the player card's positions", () => {
  // Lane 1 review, 21 Oct 2026: your own card printed his slot while the row beside it printed D/M.
  it("prints every position he may play when the caller knows them, else his slot", () => {
    const both = renderToStaticMarkup(createElement(PlayerIdentity, { rostered, eligible: ["D", "M"], club: undefined, opposition: [] }));
    expect(both).toContain("D/M");
    expect(card([])).not.toContain("D/M");
  });
});
