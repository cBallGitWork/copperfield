import { describe, expect, it } from "vitest";
import { ENZO, HAVERTZ, PALMER, SAKA, matchInput, moment, reportMan } from "./__fixtures__/built";
import {
  ARSENAL_LEEDS, CHELSEA_BOURNEMOUTH, HULL_EVERTON, IPSWICH_FULHAM, LIVERPOOL_CITY, PALACE_FOREST, SUNDERLAND_BRIGHTON, UNITED_SPURS,
  VILLA_BRENTFORD,
} from "./__fixtures__/gw6";
import { matchEvents } from "./timeline";
import { turnOf } from "./turn";
import type { ReportMatchInput } from "./types";
import type { PlMoment } from "../../football/premierleague/moments";

const turn = (match: ReportMatchInput) => {
  const t = turnOf(match, matchEvents(match));
  return { kind: t.kind, man: t.man?.name ?? null, minute: t.event?.minute ?? null };
};
const made = (moments: PlMoment[], score: [number, number]) => turn(matchInput([SAKA, HAVERTZ, PALMER, ENZO], moments, score));

describe("turnOf on gameweek 6", () => {
  it("opens Liverpool v City on the red card, not on Jacquet's chance in the 21st minute", () => {
    expect(turn(LIVERPOOL_CITY)).toEqual({ kind: "red card", man: "Ryan Gravenberch", minute: "62" });
  });

  it("opens on a red card whichever side then scored: ten men levelling, ten men scoring again", () => {
    expect(turn(UNITED_SPURS)).toEqual({ kind: "red card", man: "Rodrigo Bentancur", minute: "78" });
    expect(turn(SUNDERLAND_BRIGHTON)).toEqual({ kind: "red card", man: "Pascal Struijk", minute: "57" });
  });

  it("opens a comeback on the goal that levelled it", () => {
    expect(turn(ARSENAL_LEEDS)).toEqual({ kind: "comeback", man: "Riccardo Calafiori", minute: "62" });
    expect(turn(PALACE_FOREST)).toEqual({ kind: "comeback", man: "Daichi Kamada", minute: "41" });
    expect(turn(IPSWICH_FULHAM)).toEqual({ kind: "comeback", man: "Abdoul Ouattara", minute: "88" });
  });

  it("opens a rout on the burst that decided it", () => {
    expect(turn(CHELSEA_BOURNEMOUTH)).toEqual({ kind: "burst", man: "Jordan Henderson", minute: "2" });
  });

  it("opens a draw on the goal that changed the lead's hands", () => {
    expect(turn(HULL_EVERTON)).toEqual({ kind: "lead changed", man: "Thierno Barry", minute: "68" });
    expect(turn(VILLA_BRENTFORD)).toEqual({ kind: "lead changed", man: "John McGinn", minute: "77" });
  });
});

describe("turnOf's order of weight", () => {
  it("takes a late winner by a side that never trailed", () => {
    expect(made([moment("30", "goal", [1, null]), moment("60", "goal", [3, null]), moment("85", "goal", [2, null])], [2, 1])).toEqual({ kind: "late winner", man: "Kai Havertz", minute: "85" });
  });

  it("takes a hat-trick when nothing outweighs it, on the goal that completed it", () => {
    expect(made([moment("10", "goal", [1, null]), moment("50", "goal", [1, null]), moment("70", "goal", [1, null])], [3, 0])).toEqual({ kind: "hat-trick", man: "Bukayo Saka", minute: "70" });
  });

  it("takes the only goal, and otherwise the first", () => {
    expect(made([moment("30", "goal", [2, null])], [1, 0])).toEqual({ kind: "only goal", man: "Kai Havertz", minute: "30" });
    expect(made([moment("30", "goal", [2, null]), moment("60", "goal", [1, null])], [2, 0])).toEqual({ kind: "first goal", man: "Kai Havertz", minute: "30" });
  });

  it("opens a goalless match on a red card, a goal ruled out, the woodwork, then the busiest keeper; never a missed chance", () => {
    const miss = moment("20", "missed", [1, null]);
    expect(made([miss, moment("40", "woodwork", [3, null]), moment("60", "ruled-out", [2, null])], [0, 0])).toEqual({ kind: "ruled out", man: "Kai Havertz", minute: "60" });
    expect(made([miss, moment("40", "woodwork", [3, null])], [0, 0])).toEqual({ kind: "woodwork", man: "Cole Palmer", minute: "40" });
    expect(made([miss, moment("40", "woodwork", [3, null]), moment("70", "sent-off", [4, null])], [0, 0])).toEqual({ kind: "red card", man: "Enzo Fernandez", minute: "70" });
    const keeper = reportMan(5, "David Raya", "home", { line: "G", saves: 4 });
    expect(turn(matchInput([SAKA, PALMER, keeper], [miss], [0, 0]))).toEqual({ kind: "keeper", man: "David Raya", minute: null });
    expect(made([miss], [0, 0])).toEqual({ kind: "goalless", man: null, minute: null });
  });
});
