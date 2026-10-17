import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { archived, renamedSlug } from "./paper";

// The archive as it stands on disk: every league's directory and its stories, whichever leagues they are.
const ROOT = join(__dirname, "../../../data/editions/archive");
const [league] = readdirSync(ROOT);
const [file] = readdirSync(join(ROOT, league)).filter((name) => name.endsWith(".json"));
const slug = file.replace(/\.json$/u, "");

describe("archived", () => {
  it("serves a story that has left the paper from its archive file", async () => {
    const story = await archived(slug, league);
    expect(story?.slug).toBe(slug);
    expect(story?.leagueId).toBe(league);
  });

  it("finds nothing for a slug never filed, another league's slug, or a path that leaves the archive", async () => {
    expect(await archived("gw99-nothing", league)).toBeNull();
    expect(await archived(slug, "not-a-league")).toBeNull();
    expect(await archived("../paper", league)).toBeNull();
    expect(await archived(slug, "")).toBeNull();
  });
});

describe("renamedSlug", () => {
  it("sends the power rankings' first slug to the one they file under, and leaves every other slug alone", () => {
    expect(renamedSlug("gw6-season-predictions")).toBe("gw6-season-rankings");
    expect(renamedSlug("gw6-predictions")).toBeNull();
    expect(renamedSlug("gw6-season-rankings")).toBeNull();
  });
});
