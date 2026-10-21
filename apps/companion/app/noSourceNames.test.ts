import { readFileSync, readdirSync } from "node:fs";
import { join, sep } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// A screen never says where its data came from (Craig, 12 Oct 2026). Every string literal and every run of JSX text in
// the app and in Mail's letters is read through TypeScript's parser, so comments and identifiers never count.

const APP = import.meta.dirname;
const INBOX = join(APP, "..", "..", "..", "packages", "core", "src", "inbox");

const NAMES = /\b(Fantrax'?s?|FPL'?s?|SofaScore'?s?|Understat'?s?|Opta)\b|by our model|our league/;

/** Where a name may stand: the whole file, or only the strings listed. Everything else is a screen. */
const ALLOWED: Record<string, true | readonly string[]> = {
  // They write to Fantrax, and say so.
  "squad/[teamId]/save.ts": true,
  "components/league/useSave.ts": true,
  "components/league/SaveBar.tsx": true,
  // Ways out, worded for where they go.
  "players/[fantraxId]/fantraxExit.ts": true,
  "components/league/LineupPlanner.tsx": ["Set this line-up in Fantrax"],
  "matchday/page.tsx": ["Matchups on Fantrax"],
  "more/page.tsx": ["Open the league on Fantrax"],
  "news/page.tsx": ["Pending claims and trades on Fantrax"],
  "players/PoolBoard.tsx": ["Claim on Fantrax"],
  "league/waivers/page.tsx": ["Claim on Fantrax"],
  "players/analysis/CompareExits.tsx": ["on Fantrax"],
  // The FPL tab: its nav item, its pages and its team-id form.
  "components/shell/sections.ts": ["FPL"],
};

/** Whole directories that may: the FPL tab and the licence credits. */
const ALLOWED_DIRS = ["fpl/", "credits/"];

/** Every source file under `dir`, tests excepted, by its path from `dir` with forward slashes. */
function sources(dir: string): { name: string; path: string }[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
    .map((file) => ({ name: file.split(sep).join("/"), path: join(dir, file) }));
}

/** Each string literal, template piece and JSX text in a source, trimmed; import paths are not words on a screen. */
function wordsIn(file: string, source: string): string[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node) || ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, " ").trim();
      if (text !== "") found.push(text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return found;
}

/** The strings in one file that name a provider and are not allowed to. */
function offences(name: string, source: string): string[] {
  const allowed = ALLOWED_DIRS.some((dir) => name.startsWith(dir)) || ALLOWED[name];
  if (allowed === true) return [];
  return wordsIn(name, source).filter((text) => NAMES.test(text) && !(allowed ?? []).includes(text));
}

const files = [...sources(APP), ...sources(INBOX).map((file) => ({ ...file, name: `@epl/core/inbox/${file.name}` }))];

describe("a screen never names its source", () => {
  it("reads the app and Mail's letters at all — the walk works", () => {
    expect(files.length).toBeGreaterThan(300);
    expect(files.some((file) => file.name === "@epl/core/inbox/offers.ts")).toBe(true);
  });

  it("finds no provider, model or 'our league' outside the allowed ways out", () => {
    const named = files.flatMap(({ name, path }) => offences(name, readFileSync(path, "utf8")).map((text) => `${name}: ${text}`));
    expect(named).toEqual([]);
  });

  it("catches a name in a title or JSX text, and never one in a comment or an identifier", () => {
    const planted = `// Fantrax's own\nconst fplPoints = 1;\nexport const A = <p title="FPL's own points">Points by our model</p>;`;
    expect(offences("league/Planted.tsx", planted)).toEqual(["FPL's own points", "Points by our model"]);
  });

  it("lets an allowed file print only the words it is allowed", () => {
    expect(offences("matchday/page.tsx", `const a = <a>Matchups on Fantrax</a>;`)).toEqual([]);
    expect(offences("matchday/page.tsx", `const a = <p>Fantrax's points</p>;`)).toEqual(["Fantrax's points"]);
  });
});
