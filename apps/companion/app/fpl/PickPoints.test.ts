import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer, FplPick, Opposition } from "@epl/core";
import { PickCard } from "./PickPoints";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/desk", async () => await import("../desk"));

const pick: FplPick = {
  code: 223094, slot: 11, line: 4, multiplier: 1, isCaptain: false, isViceCaptain: false, points: 6, scored: 6,
  lines: [{ identifier: "goals_scored", value: 1, points: 6 }],
};
const haaland = { id: 411, code: 223094, name: "Haaland", fullName: "Erling Haaland", clubId: 15 } as FootballPlayer;
const against = (status: string) =>
  [{ club: { shortName: "IPS" }, home: true, difficulty: 2, fixture: { id: 1, status, kickoff: "2026-10-24T14:00:00Z" } }] as unknown as Opposition[];
const card = (opposition: Opposition[]) =>
  renderToStaticMarkup(
    createElement(PickCard, { pick, name: "Erling Haaland", player: haaland, club: undefined, opposition, onClose: () => undefined }),
  );

// UI-AUDIT D-27: the FPL pick's card had no identity, no close cross and its own foot.
describe("an FPL pick's card", () => {
  it("opens on the player card's identity, his FPL line for a position", () => {
    expect(card(against("upcoming"))).toContain("FWD");
    expect(card(against("upcoming"))).toContain("IPS (H)");
  });

  it("closes from the cross and the foot, with no profile to go to", () => {
    const html = card(against("upcoming"));
    expect(html).toMatch(/<button[^>]*aria-label="Close"/);
    expect(html).toContain(">Close<");
    expect(html).not.toContain("Full profile");
  });

  it("breaks his points down once his match is on, the total in cyan", () => {
    const html = card(against("live"));
    expect(html).toContain("Goals scored");
    expect(html).toMatch(/>Total<[\s\S]*?class="[^"]*text-info[^"]*">6</);
  });
});
