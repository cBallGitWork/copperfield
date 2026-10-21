import { describe, expect, it } from "vitest";
import type { PastSeason } from "@epl/core";
import { DATA_COMPARE, openingB, openingsOf, playerCompare, routeHref } from "./compareRoute";

function past(season: string): PastSeason {
  return { season, minutes: 900, goals: 1, assists: 0, cleanSheets: 0, goalsConceded: 0, yellowCards: 0, redCards: 0, saves: 0, fplPoints: 40 };
}

const CAREER = [past("2024/25"), past("2023/24")];
const HIS = playerCompare("061vq");
const RIVAL = { id: "04ab1", name: "E. Haaland" };

describe("routeHref", () => {
  it("keeps Data's Compare as it always linked", () => {
    expect(routeHref(DATA_COMPARE, { a: "061vq", b: "04ab1" })).toBe("/players/analysis?a=061vq&b=04ab1");
  });

  it("leaves A to the path on his own Compare", () => {
    expect(routeHref(HIS, { a: "061vq", b: "061vq", bs: "2024-25" })).toBe("/players/061vq/compare?b=061vq&bs=2024-25");
    expect(routeHref(HIS, { a: "061vq" })).toBe("/players/061vq/compare");
  });
});

describe("openingB, B on his own Compare", () => {
  const none = { b: undefined, as: undefined, bs: undefined };

  it("opens on his last season", () => {
    expect(openingB(none, "061vq", CAREER, RIVAL.id)).toEqual({ b: "061vq", bs: "2024-25" });
  });

  it("opens on the season before when A is already his last", () => {
    expect(openingB({ ...none, as: "2024-25" }, "061vq", CAREER, RIVAL.id)).toEqual({ b: "061vq", bs: "2023-24" });
  });

  it("opens on the rival for a man with no past season, or none on record", () => {
    expect(openingB(none, "061vq", [], RIVAL.id)).toEqual({ b: RIVAL.id, bs: undefined });
    expect(openingB(none, "061vq", null, undefined)).toEqual({ b: undefined, bs: undefined });
  });

  it("reads a season alone as himself in it, and keeps a B the URL names", () => {
    expect(openingB({ ...none, bs: "2023-24" }, "061vq", CAREER, RIVAL.id)).toEqual({ b: "061vq", bs: "2023-24" });
    expect(openingB({ ...none, b: "09zz9" }, "061vq", CAREER, RIVAL.id)).toEqual({ b: "09zz9", bs: undefined });
  });
});

describe("openingsOf, B's one-tap buttons", () => {
  const on = { a: "061vq", as: undefined, b: "061vq", bs: "2024-25", view: undefined };

  it("offers the rival beside his last season, and his last season beside the rival", () => {
    expect(openingsOf(HIS, on, "2024-25", RIVAL)).toEqual([{ label: "v E. Haaland", href: "/players/061vq/compare?b=04ab1" }]);
    expect(openingsOf(HIS, { ...on, b: RIVAL.id, bs: undefined }, "2024-25", RIVAL)).toEqual([
      { label: "v his last season", href: "/players/061vq/compare?b=061vq&bs=2024-25" },
    ]);
  });

  it("offers both against a third man, keeping A's season and the view", () => {
    const third = { ...on, as: "2023-24", b: "09zz9", bs: undefined, view: "shots" };
    expect(openingsOf(HIS, third, "2024-25", RIVAL).map((each) => each.href)).toEqual([
      "/players/061vq/compare?as=2023-24&view=shots&b=061vq&bs=2024-25",
      "/players/061vq/compare?as=2023-24&view=shots&b=04ab1",
    ]);
  });

  it("offers nothing a man has not got", () => {
    expect(openingsOf(HIS, { ...on, b: RIVAL.id, bs: undefined }, undefined, RIVAL)).toEqual([]);
  });

  it("keeps Data's one button for a man alone or against himself", () => {
    const alone = { ...on, b: undefined, bs: undefined };
    expect(openingsOf(DATA_COMPARE, alone, "2024-25", undefined)).toEqual([
      { label: "v his last season", href: "/players/analysis?a=061vq&b=061vq&bs=2024-25" },
    ]);
    expect(openingsOf(DATA_COMPARE, { ...on, b: RIVAL.id }, "2024-25", undefined)).toEqual([]);
  });
});
