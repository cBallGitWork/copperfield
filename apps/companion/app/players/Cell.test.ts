import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Lead } from "./Cell";
import { playersQuery } from "./query";
import type { PoolRow } from "./pool";
import type { FootballPlayer } from "@epl/core";
import { noted, withWeeks } from "../components/football/withWeeks";

vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: () => null }));

const row = {
  entry: {
    player: { fantraxId: "s", displayName: "William Saliba", rawName: "Saliba, William", clubCode: "ARS" },
    eligiblePositions: ["D"],
    ownerTeamId: "t",
    status: "T",
  },
  stats: null,
  fplCode: 1,
} as unknown as PoolRow;
const injured = { code: 1, status: "i", chanceOfPlaying: 0, news: "Knee injury - Unknown return date" } as unknown as FootballPlayer;

describe("the pool board's lead", () => {
  for (const line of [false, true]) {
    it(`marks and notes an unfit man with CM's mark, never the word chip${line ? ", on the phone's line" : ""}`, () => {
      const html = renderToStaticMarkup(
        withWeeks(createElement(Lead, { row, query: playersQuery({}), teamNames: new Map(), reader: null, footballer: injured, line })),
      );
      expect(html).toContain(`>${noted("Knee", "GW10")}</span>`);
      expect(html).toContain('role="img"');
      expect(html).not.toContain("cm-state");
      expect(html).toContain("W. Saliba");
    });
  }

  it("drops the note out of sight on the phone's line when it cannot fit, never to an ellipsis", () => {
    const html = renderToStaticMarkup(
      withWeeks(createElement(Lead, { row, query: playersQuery({}), teamNames: new Map(), reader: null, footballer: injured, line: true })),
    );
    // One 20px line that wraps: a note with no room falls to the hidden second line, the mark stays.
    expect(html).toMatch(/<span class="flex h-5 min-w-0 flex-wrap items-center gap-x-1\.5 overflow-hidden"><svg role="img"/);
  });
});
