import { describe, expect, it } from "vitest";
import { AMERICAN, REPORT_ADVICE, REPORT_BOX, REPORT_FIXED, REPORT_FPL, REPORT_GLOSSES, REPORT_NEVER, REPORT_OWNERSHIP, REPORT_RESTATED, REPORT_ROUTINE_HEAD, banned } from "@epl/core";
import * as voices from "./reports";
import { FAN_VOICE, REPORTS_VOICE } from "./reports";

// A prompt's own words become the column's tics, so the voice never uses a word its checks send back.
const prose = (voice: string) => voice.split("\n").filter((line) => !/^- (?:Never|Draft words|At most|You never name)/.test(line)).join("\n");
const never = [...REPORT_NEVER, ...REPORT_FPL, ...REPORT_ADVICE, ...AMERICAN];

describe("the match report's voices", () => {
  it("are one reporter's, with no senior writer's weave after him: 0 of 16 woven matches were kept", () => {
    expect(Object.keys(voices)).not.toContain("WEAVE_VOICE");
  });

  it("use none of the words they ban, outside the lists that ban them", () => {
    expect(banned(prose(REPORTS_VOICE), never)).toEqual([]);
    expect(banned(FAN_VOICE, never)).toEqual([]);
  });

  it("carry no example sentence in quotation marks", () => {
    expect(prose(REPORTS_VOICE)).not.toMatch(/["“][A-Z][^"”]{12,}["”]/u);
  });

  it("state the account's checked rules from the lists the checks send back on", () => {
    for (const list of [REPORT_GLOSSES, REPORT_RESTATED, REPORT_BOX]) expect(REPORTS_VOICE).toContain(list.join(", "));
  });

  it("leave every stake to the desk, and state the head and ownership checks from their lists", () => {
    expect(REPORTS_VOICE).not.toMatch(/"stake"|STAKE in|in your own words/u);
    expect(REPORTS_VOICE).toContain("the desk prints his stake");
    expect(REPORTS_VOICE).toContain(REPORT_ROUTINE_HEAD.join(", "));
    expect(REPORTS_VOICE).toContain(REPORT_OWNERSHIP.join(", "));
  });

  it("ask for passages of play, never paragraphs of a sentence or two", () => {
    expect(REPORTS_VOICE).not.toMatch(/one or two sentences|its own paragraph|one subject doing one thing/u);
    expect(REPORTS_VOICE).toContain("One goal, one sentence");
    expect(REPORTS_VOICE).toContain("two to four sentences");
  });

  it("never hand over football's fixed phrases, as a cap or a list: a prompt's phrase becomes the paper's", () => {
    for (const phrase of REPORT_FIXED) expect(REPORTS_VOICE).not.toContain(phrase);
  });

  it("ask for the match in the order it was played, never opening on the turn and going back", () => {
    expect(REPORTS_VOICE).toContain("in the order it was played");
    expect(REPORTS_VOICE).not.toMatch(/first sentence tells THE TURN|what came before it/u);
  });
});
