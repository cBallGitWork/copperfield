import { describe, expect, it } from "vitest";
import type { Fault } from "../fault";
import { correct, mergeReports, overTheLead, plainHead, readReportsDraft, type ReportsDraft } from "./draft";

const piece = (tag: string) => ({ standfirst: `${tag} standfirst`, account: `${tag} account`, sections: [] });
const drafted = (tag: string): ReportsDraft => ({ headline: `${tag} headline`, headlines: [`${tag} headline`], matches: new Map([[1, piece(tag)], [2, piece(tag)]]) });
const f = (section: string, severity: Fault["severity"]): Fault => ({ section, check: "x", severity, evidence: "" });

describe("readReportsDraft", () => {
  it("keeps an account filed as paragraphs, a paragraph to a line", () => {
    const draft = readReportsDraft({ matches: [{ fixture: 1, standfirst: "s", account: ["One.", "", "Two."], sections: [] }] });
    expect(draft.matches.get(1)?.account).toBe("One.\nTwo.");
  });

  it("reads the model's JSON field by field and pencils the slips", () => {
    const draft = readReportsDraft({ headlines: [{ text: "Villa hold on!", playsOn: "hold", twoMeanings: "keep the lead; grip" }, { text: "A plain line", playsOn: "", twoMeanings: "" }], matches: [{ fixture: "5", standfirst: "Villa were up 3-0 at halftime — then not.", account: "a", sections: [{ head: "h", pitch: "p", stake: 3 }] }, "junk"] });
    expect(draft.headline).toBe("Villa hold on.");
    expect(draft.headlines).toEqual(["Villa hold on."]);
    expect(draft.matches.get(5)?.standfirst).toBe("Villa were 3-0 up at half-time, then not.");
    expect(draft.matches.get(5)?.sections[0].stake).toBe("");
  });

  it("gives each section the desk's stake, in order, and keeps no more sections than the desk wrote stakes for", () => {
    const sections = [{ head: "a", pitch: "p1", stake: "the writer's" }, { head: "b", pitch: "p2" }, { head: "c", pitch: "p3" }];
    const draft = readReportsDraft({ matches: [{ fixture: 1, standfirst: "s", account: "a", sections }] }, [], new Map([[1, ["One.", "Two."]]]));
    expect(draft.matches.get(1)?.sections).toEqual([{ head: "a", pitch: "p1", stake: "One." }, { head: "b", pitch: "p2", stake: "Two." }]);
  });

  it("keeps a particle lower case except where it opens a sentence", () => {
    const draft = readReportsDraft({ matches: [{ fixture: 1, standfirst: "Nobody holds Van Hecke. Van Hecke scored.", account: "", sections: [] }] }, ["van Hecke"]);
    expect(draft.matches.get(1)?.standfirst).toBe("Nobody holds van Hecke. Van Hecke scored.");
  });

  it("corrects 'down 1-0' to the British order", () => {
    expect(correct("They were down 1-0.")).toBe("They were 1-0 down.");
  });
});

describe("mergeReports", () => {
  it("keeps a clean first attempt", () => {
    const merged = mergeReports([{ draft: drafted("a"), faults: [] }, { draft: drafted("b"), faults: [] }], [1, 2]);
    expect(merged.matches.get(1)?.account).toBe("a account");
  });

  it("takes the rewrite for a match that was sent back, and only that match", () => {
    const merged = mergeReports([{ draft: drafted("a"), faults: [f("1:account", "send-back")] }, { draft: drafted("b"), faults: [] }], [1, 2]);
    expect([merged.matches.get(1)?.account, merged.matches.get(2)?.account]).toEqual(["b account", "a account"]);
  });

  it("falls back to the first attempt when the rewrite is worse, and drops a match hard both times", () => {
    const merged = mergeReports(
      [{ draft: drafted("a"), faults: [f("1:account", "send-back"), f("2:match", "hard")] }, { draft: drafted("b"), faults: [f("1:match", "hard"), f("2:match", "hard")] }],
      [1, 2],
    );
    expect(merged.matches.get(1)?.account).toBe("a account");
    expect(merged.matches.has(2)).toBe(false);
  });

  it("keeps the first attempt when the rewrite is no better", () => {
    const merged = mergeReports([{ draft: drafted("a"), faults: [f("1:account", "send-back")] }, { draft: drafted("b"), faults: [f("1:account", "send-back"), f("1:match", "send-back")] }], [1]);
    expect(merged.matches.get(1)?.account).toBe("a account");
  });

  it("salvages a match hard both times: the attempt with fewer hard faults, less each sentence carrying one", () => {
    const told = (account: string) => ({ standfirst: "Coventry City beat Newcastle United 4-1.", account, sections: [{ head: "Simms", pitch: "Simms came on and scored twice. He had 12 touches.", stake: "Stake." }] });
    const first: ReportsDraft = { headline: "", headlines: [], matches: new Map([[9, told("Simms came on at the break. Coventry led by then.")]]) };
    const second: ReportsDraft = { headline: "", headlines: [], matches: new Map([[9, told("Coventry won it early.")]]) };
    const hard = (evidence: string): Fault => ({ section: "9:match", check: "x", severity: "hard", evidence });
    const merged = mergeReports([{ draft: first, faults: [hard("Simms came on at the break")] }, { draft: second, faults: [hard("12")] }], [9]);
    expect(merged.matches.get(9)).toEqual(told("Coventry led by then."));
  });

  it("salvages nothing when the standfirst carries the fault or the account goes whole", () => {
    const one = (standfirst: string, account: string): ReportsDraft => ({ headline: "", headlines: [], matches: new Map([[9, { standfirst, account, sections: [{ head: "h", pitch: "p.", stake: "" }] }]]) });
    const hard = (evidence: string): Fault => ({ section: "9:match", check: "x", severity: "hard", evidence });
    expect(mergeReports([{ draft: one("Won 12-0.", "Fine."), faults: [hard("12")] }], [9]).matches.has(9)).toBe(false);
    expect(mergeReports([{ draft: one("Won.", "He had 12."), faults: [hard("12")] }], [9]).matches.has(9)).toBe(false);
  });

  it("never lets a warning block", () => {
    const merged = mergeReports([{ draft: drafted("a"), faults: [f("1:account", "warn"), f("headline", "warn")] }], [1]);
    expect([merged.headline, merged.matches.get(1)?.account]).toEqual(["a headline", "a account"]);
  });
});

describe("overTheLead", () => {
  it("lets a written headline stand only over the lead's written piece", () => {
    expect(overTheLead("Simms the bench knew best", true)).toBe("Simms the bench knew best");
    expect(overTheLead("Simms the bench knew best", false)).toBeNull();
  });
});

describe("plainHead", () => {
  const never = (text: string) => /off the mark/i.test(text);
  it("keeps a head that keeps the rules", () => {
    expect(plainHead("Manzambi marks his start", "Manzambi scored.", ["Manzambi"], never)).toBe("Manzambi marks his start");
  });
  it("prints a broken head as the first man its football names", () => {
    expect(plainHead("Delap off the mark denied", "Liam Delap had four shots while Murillo headed over.", ["Delap", "Murillo"], never)).toBe("Delap");
  });
  it("prints a five-word head, which the check sends back, as its man", () => {
    expect(plainHead("Saka twice for Arteta's side", "Saka scored twice.", ["Saka"], never)).toBe("Saka");
  });
});

describe("correct", () => {
  it("leaves a decimal alone: 1.5 points is no one-to-nine count", () => {
    expect(correct("He averages 1.5 points a match.")).toBe("He averages 1.5 points a match.");
    expect(correct("He scored for 5 points.")).toBe("He scored for five points.");
  });
});
