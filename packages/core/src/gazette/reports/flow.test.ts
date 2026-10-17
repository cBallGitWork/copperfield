import { describe, expect, it } from "vitest";
import { deskOf } from "./__fixtures__/built";
import { LIVERPOOL_CITY_LEAGUE } from "./__fixtures__/gw6League";
import { ARSENAL_LEEDS, HULL_EVERTON, IPSWICH_FULHAM, LIVERPOOL_CITY, UNITED_SPURS, VILLA_BRENTFORD } from "./__fixtures__/gw6";
import { flowFaults } from "./flow";
import type { ReportMatchInput } from "./types";

// Every failing case is a sentence the paper printed on 10 and 11 Oct 2026.

const faults = (match: ReportMatchInput, account: string) => {
  const out: string[] = [];
  flowFaults(9001, { standfirst: "", account, sections: [] }, deskOf(match), [], (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
  return out;
};
const only = (match: ReportMatchInput, account: string, check: string) => faults(match, account).filter((f) => f.startsWith(check));

const SERVED_LIVERPOOL = [
  "Jérémy Jacquet had the opening chance of the match for Liverpool, and he was denied from close range after 21 minutes.",
  "Rayan Cherki had Manchester City's answer in the 38th minute, but his finish from Elliot Anderson's pass went off target.",
  "Neither side scored before the interval.",
  "Bradley Barcola then picked out Lewis Koumas just after half-time, and Koumas also failed to beat the goalkeeper.",
  "Enzo Maresca sent on Jérémy Doku after 56 minutes, with the score still goalless.",
  "Ryan Gravenberch picked up another booking in the 62nd minute and was dismissed.",
  "Liverpool played on with ten men for the rest of the match.",
  "Erling Haaland gave City the lead after 65 minutes.",
  "Maresca introduced Josko Gvardiol in the 66th minute.",
  "Doku doubled the lead after 68 minutes.",
  "Anderson played the pass, and Doku found the top corner with a right-footed finish from inside the box.",
  "Gvardiol set up the third with a header, and Cherki scored it with 12 minutes left.",
  "That was a burst of three goals within 13 minutes, and City needed only four attempts on target to score them.",
  "City had most of the ball throughout.",
].join("\n");

const CLEAN_LIVERPOOL = [
  "Gianluigi Donnarumma saved from Jérémy Jacquet at close range after 21 minutes. Ryan Gravenberch was sent off for a second booking midway through the second half with the match goalless. Erling Haaland put Manchester City ahead three minutes after the red card.",
  "Jérémy Doku, a substitute on for Iliman Ndiaye, doubled the lead after 68 minutes with a right-footed shot into the top corner from Elliot Anderson's pass. Josko Gvardiol, on for Nico O'Reilly, headed the ball down for Rayan Cherki to make it 3-0 with 12 minutes left.",
].join("\n");

describe("flowFaults", () => {
  it("passes an account in the desk's shape", () => {
    expect(faults(LIVERPOOL_CITY_LEAGUE, CLEAN_LIVERPOOL)).toEqual([]);
  });

  it("sends back the served Liverpool v City: 14 paragraphs of one sentence", () => {
    const found = faults(LIVERPOOL_CITY_LEAGUE, SERVED_LIVERPOOL);
    expect(found).toContain("2 paragraphs, as the desk planned them: 14");
    expect(found.some((f) => f.startsWith("paragraphs of one sentence"))).toBe(true);
  });

  it("sends back a goal told after a later one, as Arsenal v Leeds was told on 10 Oct", () => {
    const backwards = "Riccardo Calafiori brought Arsenal level from a Ben White pass. James Justin had put Leeds United in front seven minutes earlier.";
    expect(only(ARSENAL_LEEDS, backwards, "out of order")).toEqual(["out of order; tell the goals as they came: had put"]);
    expect(only(ARSENAL_LEEDS, "James Justin put Leeds United in front. Riccardo Calafiori brought Arsenal level seven minutes later.", "out of order")).toEqual([]);
  });

  it("sends back a line that says what did not happen", () => {
    expect(only(LIVERPOOL_CITY, SERVED_LIVERPOOL, "says what did not happen")).toEqual([
      "says what did not happen; cut it, never reword it: failed to beat",
      "says what did not happen; cut it, never reword it: also failed",
      "says what did not happen; cut it, never reword it: neither side scored",
      "says what did not happen; cut it, never reword it: still goalless",
    ]);
    expect(only(ARSENAL_LEEDS, "It was not the only opening he failed to take.", "says what")).toHaveLength(2);
    expect(only(IPSWICH_FULHAM, "Gonzalo García had chances good enough to score and took none.", "says what")).toHaveLength(1);
    expect(only(UNITED_SPURS, "Their one clear chance did not bring a goal.", "says what")).toHaveLength(1);
  });

  it("sends back a restatement and the box's figures", () => {
    expect(only(LIVERPOOL_CITY, SERVED_LIVERPOOL, "restates")).toEqual(["restates what the reader has; cut it: for the rest of the match", "restates what the reader has; cut it: that was a burst"]);
    expect(only(VILLA_BRENTFORD, "Each side came from behind once.", "restates")).toHaveLength(1);
    expect(only(IPSWICH_FULHAM, "The two Ipswich goals came three minutes apart.", "restates")).toHaveLength(1);
    expect(only(LIVERPOOL_CITY, SERVED_LIVERPOOL, "a figure the key-stats box")).toHaveLength(2);
    expect(only(UNITED_SPURS, "Manchester United netted once from four attempts on goal.", "a figure the key-stats box")).toHaveLength(1);
    expect(only(HULL_EVERTON, "Everton kept most of the possession and made seven clear chances.", "a figure the key-stats box")).toHaveLength(2);
  });

  it("sends back a substitution told on its own, never one inside its goal or an injury", () => {
    expect(only(LIVERPOOL_CITY, SERVED_LIVERPOOL, "a substitution on its own")).toHaveLength(2);
    expect(only(ARSENAL_LEEDS, "Mikel Arteta sent on Bruno Guimarães in the 63rd minute.", "a substitution")).toHaveLength(1);
    expect(only(HULL_EVERTON, "Sergej Jakirovic brought on Elliot Stroud after 64 minutes.", "a substitution")).toHaveLength(1);
    expect(only(ARSENAL_LEEDS, "Bruno Guimarães, who came on for Myles Lewis-Skelly, put Arsenal in front with 20 minutes left.", "a substitution")).toEqual([]);
    expect(only(VILLA_BRENTFORD, "Aaron Wan-Bissaka came on for the injured Matteo Ruggeri at half-time.", "a substitution")).toEqual([]);
  });

  it("sends back a goal announced and then explained, or made and then scored", () => {
    const twice = only(LIVERPOOL_CITY, SERVED_LIVERPOOL, "a goal told in two sentences");
    expect(twice).toHaveLength(1);
    expect(twice[0]).toContain("Doku doubled the lead after 68 minutes. Anderson played the pass");
    expect(only(UNITED_SPURS, "Mbeumo put United ahead 17 minutes from time. Matheus Cunha supplied the pass.", "a goal told")).toHaveLength(1);
    expect(only(UNITED_SPURS, "Ten-man Spurs drew level two minutes into stoppage time. Sandro Tonali delivered the ball. Dominic Solanke met it inside the box.", "a goal told")).toHaveLength(1);
    expect(only(ARSENAL_LEEDS, "Leeds took the lead in the 55th minute. Gabriel Gudmundsson supplied the cross, and James Justin scored.", "a goal told")).toHaveLength(1);
    expect(only(HULL_EVERTON, "Thomas sent Joe Gelhardt through on the break just after half-time. Gelhardt put Hull City ahead.", "a goal told")).toHaveLength(1);
    expect(only(HULL_EVERTON, "Belloumi levelled with 16 minutes left. Stroud found him in the box, and Belloumi's left-footed finish went into the top corner.", "a goal told")).toHaveLength(1);
  });

  it("never reads two goals in two sentences as one goal told twice", () => {
    expect(only(IPSWICH_FULHAM, "Abdoul Ouattara equalised two minutes from time. Clarke then delivered a cross from a set piece, and Dara O'Shea scored to make it 2-1.", "a goal told")).toEqual([]);
    expect(only(LIVERPOOL_CITY, "Erling Haaland put City ahead after 65 minutes. Elliot Anderson found Jérémy Doku, and Doku found the top corner.", "a goal told")).toEqual([]);
  });
});
