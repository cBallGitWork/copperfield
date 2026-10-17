import { describe, expect, it } from "vitest";
import { PALMER, SAKA, deskOf, matchInput, moment } from "./__fixtures__/built";
import { IPSWICH_FULHAM } from "./__fixtures__/gw6";
import { COVENTRY_NEWCASTLE_LEAGUE, PALACE_FOREST_LEAGUE } from "./__fixtures__/gw6League";
import { partFaults } from "./parts";

const tableFaults = (account: string) => {
  const out: string[] = [];
  const desk = deskOf(matchInput([SAKA, PALMER], [moment("85", "goal", [1, null])], [1, 0]));
  partFaults(9001, { standfirst: "", account, sections: [] }, desk, (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
  return out.filter((fault) => fault.startsWith("the table"));
};

describe("partFaults' table", () => {
  it("keeps a place in the table out of the account", () => {
    expect(tableFaults("Arsenal are 4th.")).toEqual(["the table belongs to the standfirst, once: 4th"]);
  });

  it("never reads an ordinal with a noun as a place", () => {
    expect(tableFaults("Saka scored his 12th goal of the season.")).toEqual([]);
    expect(tableFaults("Saka's 85th-minute shot settled it.")).toEqual([]);
  });
});

describe("partFaults' standfirst", () => {
  const sideFaults = (standfirst: string) => {
    const out: string[] = [];
    partFaults(9001, { standfirst, account: "", sections: [] }, deskOf(IPSWICH_FULHAM), (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
    return out.filter((fault) => fault.startsWith("a manager's side"));
  };

  it("sends back a manager's side that reads as the other club, as served on 10 Oct", () => {
    expect(sideFaults("Ipswich Town's 2-1 win over Fulham leaves Álvaro Arbeloa's side bottom of the table and still without a win.")).toEqual([
      "a manager's side names the other club; name the club: Álvaro Arbeloa's side",
    ]);
  });

  it("lets a manager's side stand for the club the standfirst is about", () => {
    expect(sideFaults("Fulham lost 2-1 at Ipswich Town, which leaves Arbeloa's side bottom of the table.")).toEqual([]);
  });
});

describe("partFaults' heads", () => {
  const headFaults = (head: string, desk = deskOf(PALACE_FOREST_LEAGUE)) => {
    const out: string[] = [];
    const sections = desk.sections.map((s, i) => ({ head: i === 1 ? head : s.men[0].name, pitch: s.men.map((m) => m.name).join(" and "), stake: s.stake }));
    partFaults(2, { standfirst: "", account: "", sections }, desk, (_, check, __, evidence) => out.push(`${check}: ${evidence}`));
    return out.filter((fault) => fault.startsWith("a head on a routine"));
  };

  it("sends back a head built on a routine start or change", () => {
    expect(headFaults("Timber makes way", deskOf({ ...PALACE_FOREST_LEAGUE, men: PALACE_FOREST_LEAGUE.men.map((m) => (m.name === "Jefferson Lerma" ? { ...m, startsBefore: 3 } : m)) }))).toEqual([
      "a head on a routine start or change; head the news: Timber makes way",
    ]);
  });

  it("lets a head tell a first league start", () => {
    expect(headFaults("Lerma starts")).toEqual([]);
  });
});

describe("partFaults on Coventry 4-1 Newcastle", () => {
  const desk = deskOf(COVENTRY_NEWCASTLE_LEAGUE);
  const faultsOf = (head: string, pitch: string, check: string) => {
    const out: string[] = [];
    const sections = desk.sections.map((s, i) => ({ head: i === 0 ? head : `${s.men[0].surname} scores`, pitch: `${s.men.map((m) => m.name).join(" and ")}.${i === 0 ? ` ${pitch}` : ""}`, stake: s.stake }));
    partFaults(5, { standfirst: "", account: "", sections }, desk, (_, c, __, evidence) => out.push(`${c}: ${evidence}`));
    return out.filter((fault) => fault.startsWith(check));
  };

  it("sends back the league's defensive points counted as actions or interventions, as printed on 12 Oct", () => {
    const counted = (pitch: string) => faultsOf("Cherif scores", pitch, "defensive points");
    expect(counted("Bobby Thomas registered a pair of interventions.")).toEqual(["defensive points counted as actions; they are points the league pays: a pair of interventions"]);
    expect(counted("He was also credited with one action in defence.")).toEqual(["defensive points counted as actions; they are points the league pays: one action in defence"]);
    expect(counted("Van Ewijk made two defensive actions.")).toHaveLength(1);
    expect(counted("His first action was a header.")).toEqual([]);
  });

  it("never calls one of football's fixed phrases a section retelling the account, as 12 Oct's was", () => {
    const out: string[] = [];
    const sections = desk.sections.map((s) => ({ head: `${s.men[0].surname} scores`, pitch: `${s.men[0].name} shot from outside the box three times.`, stake: s.stake }));
    partFaults(5, { standfirst: "", account: "Sidiki Cherif scored from outside the box early in the second half.", sections }, desk, (_, c, __, evidence) => out.push(`${c}: ${evidence}`));
    expect(out.filter((f) => f.startsWith("a section retells"))).toEqual([]);
  });

  it("sends back a club's full name after the first, where it has a short one", () => {
    const named = deskOf({ ...COVENTRY_NEWCASTLE_LEAGUE, home: { ...COVENTRY_NEWCASTLE_LEAGUE.home, shorts: ["Coventry"] }, away: { ...COVENTRY_NEWCASTLE_LEAGUE.away, shorts: ["Newcastle"] } });
    const fullNames = (account: string) => {
      const out: string[] = [];
      partFaults(5, { standfirst: "Coventry City beat Newcastle United 4-1.", account, sections: [] }, named, (_, c, __, evidence) => out.push(`${c}: ${evidence}`));
      return out.filter((f) => f.startsWith("a club's full name"));
    };
    expect(fullNames("Jack Rudoni put Coventry City ahead from the spot.")).toEqual(["a club's full name again; after the first, Coventry: Coventry City"]);
    expect(fullNames("Jack Rudoni put Coventry ahead from the spot, and Newcastle replied.")).toEqual([]);
    expect(faultsOf("Cherif scores", "", "a club's full name")).toEqual([]);
  });

  it("sends back a head that is a name alone, as van Ewijk's was, and lets a verb or a number stand", () => {
    const bare = (head: string) => faultsOf(head, "", "a head that is a name");
    expect(bare("Cherif")).toEqual(["a head that is a name alone; give his news: Cherif"]);
    expect(bare("Sidiki Cherif")).toHaveLength(1);
    expect(bare("Cherif strikes from range")).toEqual([]);
    expect(bare("Cherif's first start")).toEqual([]);
  });
});
