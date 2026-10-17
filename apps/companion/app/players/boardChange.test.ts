import { describe, expect, it } from "vitest";
import { EVERYONE, atRoute, changeHref, changed, chosen, filterChange, statusChange, statusOn, statusesShown } from "./boardChange";

describe("changed", () => {
  it("keeps a first tap when a second lands on the query it asked for", () => {
    const first = changed("", { toggle: ["status", "FA"] });
    expect(new URLSearchParams(changed(first, { toggle: ["status", "WW"] })).get("status")).toBe("FA,WW");
  });

  it("keeps a search asked for when a chip is tapped before the board answers", () => {
    const searched = changed("status=T", { set: { q: "saka" } });
    const params = new URLSearchParams(changed(searched, { toggle: ["status", "FA"] }));
    expect(params.get("q")).toBe("saka");
    expect(params.get("status")).toBe("T,FA");
  });

  it("takes a value away, and drops the parameter with the last one", () => {
    expect(changed("pos=D%2CM", { toggle: ["pos", "D"] })).toBe("pos=M");
    expect(changed("pos=D", { toggle: ["pos", "D"] })).toBe("");
  });

  it("drops a key set to nothing and leaves the rest in place", () => {
    expect(changed("q=saka&all=1&sort=g", { set: { all: undefined, q: "" } })).toBe("sort=g");
  });

  it("clears everything but what a reset keeps", () => {
    expect(changed("compare=1&q=a&pos=M&sort=sh&panel=1&all=1", { keep: ["compare"] })).toBe("compare=1");
  });

  it("reads a hand-typed comma as the one it writes", () => {
    expect(changed("pos=D,M", { toggle: ["pos", "F"] })).toBe("pos=D%2CM%2CF");
  });
});

describe("atRoute", () => {
  it("joins a search to its route, and a bare route has no question mark", () => {
    expect(atRoute("/players", "pos=D")).toBe("/players?pos=D");
    expect(atRoute("/players", "")).toBe("/players");
  });
});

describe("chosen", () => {
  it("reads a comma list, and nothing from an absent one", () => {
    expect(chosen("D,M")).toEqual(["D", "M"]);
    expect(chosen(undefined)).toEqual([]);
  });

  it("drops a blank rather than filtering on the empty string", () => {
    expect(chosen("D,")).toEqual(["D"]);
  });
});

describe("changeHref with a filter chip's change", () => {
  it("adds a second value rather than replacing the first", () => {
    expect(changeHref({ pos: "D" }, filterChange("pos", "M"))).toContain("pos=D%2CM");
  });

  it("takes one away and leaves the rest", () => {
    expect(changeHref({ pos: "D,M,F" }, filterChange("pos", "M"))).toContain("pos=D%2CF");
  });

  it("drops the parameter when the last one goes off", () => {
    expect(changeHref({ pos: "D" }, filterChange("pos", "D"))).toBe("/players");
  });

  it("drops Show all, since the rows it showed are not the ones a filter leaves", () => {
    expect(changeHref({ all: "1", sort: "g" }, filterChange("pos", "M"))).toBe("/players?sort=g&pos=M");
  });

  it("keeps the other controls' state, so a chip cannot quietly do two things", () => {
    const href = changeHref({ pos: "D", q: "saka", sort: "fpts" }, filterChange("pos", "M"));
    expect(href).toContain("q=saka");
    expect(href).toContain("sort=fpts");
  });
});

describe("statusesShown", () => {
  it("rests on the free men, FA and WW, when the address bar names no status (Craig, 16 Oct 2026)", () => {
    expect(statusesShown(undefined, undefined)).toEqual(["FA", "WW"]);
    expect(statusesShown("", "  ")).toEqual(["FA", "WW"]);
  });

  it("looks through everyone for a typed search, so 'who holds Saka' finds him", () => {
    expect(statusesShown(undefined, "saka")).toBeNull();
  });

  it("keeps a status the reader pressed, search or not", () => {
    expect(statusesShown("T", "saka")).toEqual(["T"]);
    expect(statusesShown("FA", undefined)).toEqual(["FA"]);
  });

  it("reads status=all as everyone, the only way the address bar can say it now that absence is the free men", () => {
    expect(statusesShown(EVERYONE, undefined)).toBeNull();
    expect(statusesShown("all,FA", undefined)).toBeNull();
  });
});

describe("a status chip's change", () => {
  const free = statusChange(["FA", "WW"], true);
  const owned = statusChange(["T"], true);
  const status = (search: string) => new URLSearchParams(search).get("status");

  it("lifts the resting Free to everyone, and says so in the address bar", () => {
    expect(changed("", free)).toBe("status=all");
    expect(changeHref({}, free)).toBe("/players?status=all");
  });

  it("presses Free again back to the bare board", () => {
    expect(changed("status=all", free)).toBe("");
    expect(changed("status=T", free)).toBe("");
  });

  it("swaps Free for Owned in one tap, since a row chip shows its own men alone", () => {
    expect(status(changed("", owned))).toBe("T");
  });

  it("takes one chip away and leaves the other when both are on", () => {
    expect(status(changed("status=FA,WW,T", free))).toBe("T");
    expect(changed("status=FA,WW,T", owned)).toBe("");
  });

  it("writes Free out under a search, where a bare status would look through everyone", () => {
    expect(status(changed("q=saka", free))).toBe("FA,WW");
  });

  it("splits the bin in the dialog: FA alone off the resting Free leaves the waivers", () => {
    expect(status(changed("", statusChange(["FA"])))).toBe("WW");
    expect(status(changed("status=all", statusChange(["WW"])))).toBe("WW");
    expect(changed("status=WW", statusChange(["FA"]))).toBe("");
  });

  it("drops Show all, as any filter does", () => {
    expect(changed("all=1", owned)).toBe("status=T");
  });
});

describe("statusOn", () => {
  const on = (search: string, codes: string[]) => {
    const params = new URLSearchParams(search);
    return statusOn(params.get("status"), params.get("q"), codes);
  };

  it("presses Free on the bare board and lets it go under a typed search", () => {
    expect(on("", ["FA", "WW"])).toBe(true);
    expect(on("q=saka", ["FA", "WW"])).toBe(false);
  });

  it("presses Free only when both halves are on", () => {
    expect(on("status=FA", ["FA", "WW"])).toBe(false);
    expect(on("status=FA", ["FA"])).toBe(true);
  });

  it("presses nothing for everyone", () => {
    expect(on("status=all", ["FA", "WW"])).toBe(false);
    expect(on("status=all", ["T"])).toBe(false);
  });
});
