import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";
import { Lead } from "./Cell";
import { playersQuery } from "./query";
import type { PoolRow } from "./pool";

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
const injured = { status: "i", chanceOfPlaying: 0, news: "Knee" } as unknown as FootballPlayer;

describe("the pool board's lead", () => {
  for (const line of [false, true]) {
    it(`marks an unfit man with CM's mark, never the word chip${line ? ", on the phone's line" : ""}`, () => {
      const html = renderToStaticMarkup(
        createElement(Lead, { row, query: playersQuery({}), teamNames: new Map(), reader: null, footballer: injured, line }),
      );
      expect(html).toContain('role="img"');
      expect(html).not.toContain("cm-state");
      expect(html).toContain("W. Saliba");
    });
  }
});
