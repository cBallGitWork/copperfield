import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  MAX_PAPER_STORIES,
  composePaper,
  normalizeLedger,
  normalizeStory,
  recordCoverage,
  type Ledger,
  type PublishedStory,
  type StoryKind,
  type ThreadUpdate,
} from "@epl/core";
import { readJsonOr } from "../absent";
import { EDITIONS_ROOT } from "../paths";

// Where a filing lands: the paper, its archive file, then the ledger, one story at a time. These
// commits ride GITHUB_TOKEN and run no CI, so what this file refuses is the only refusal there is.

const paperPath = (root: string): string => join(root, "paper.json");
const ledgerPath = (root: string): string => join(root, "ledger.json");

/** Every story on file, all leagues — persistence must not drop another
 *  league's paper while filing this one's. */
export function readPaperStories(root = EDITIONS_ROOT): PublishedStory[] {
  const parsed = readJsonOr<unknown>(paperPath(root), null);
  if (parsed === null || typeof parsed !== "object") return [];
  const stories = (parsed as { stories?: unknown }).stories;
  if (!Array.isArray(stories)) return [];
  return stories.map(normalizeStory).filter((story): story is PublishedStory => story !== null);
}

/** Every archived story of one kind in the served league, the latest period first. The paper keeps 24 and retires a
 *  column once its round is reported; the archive keeps them all, which is what a record is marked from. */
export function readArchive(kind: StoryKind, root = EDITIONS_ROOT): PublishedStory[] {
  const dir = join(root, "archive", FANTRAX_LEAGUE_ID);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const story = normalizeStory(archived(join(dir, name)));
      return story !== null && story.kind === kind && story.leagueId === FANTRAX_LEAGUE_ID ? [story] : [];
    })
    .sort((a, b) => b.period - a.period);
}

/** One archive file, or null for one that will not read. Nothing is rebuilt from the archive, so a torn file costs
 *  the record one story rather than stopping every desk that reads it. */
function archived(path: string): unknown {
  try {
    return readJsonOr<unknown>(path, null);
  } catch {
    return null;
  }
}

export function readLedger(root = EDITIONS_ROOT): Ledger {
  return normalizeLedger(readJsonOr<unknown>(ledgerPath(root), null));
}

export interface Filing {
  story: PublishedStory;
  spentKeys: readonly string[];
  threads: readonly ThreadUpdate[];
}

/** The newest of `filings` saved: the paper, its archive file, then the ledger LAST. The ledger is
 *  the commit point: a story whose save died before it is filed again next firing, never lost. */
export function saveFiling(
  found: readonly PublishedStory[],
  filings: readonly Filing[],
  ledger: Ledger,
  now: string,
  root = EDITIONS_ROOT,
): Ledger {
  const filing = filings.at(-1);
  if (filing === undefined) return ledger;
  printStory(found, filings, filing.story, now, root);
  const book = recordCoverage(ledger, filing.story.leagueId, filing.spentKeys, filing.threads, now);
  writeFileSync(ledgerPath(root), `${JSON.stringify(book, null, 2)}\n`);
  return book;
}

/** Kinds whose refile is news in itself: the Line-Ups move with the elevens, so each telling is dated when it runs. */
const REFILES_AS_NEWS: readonly StoryKind[] = ["predicted-xi"];

/** A reprint keeps the date its slug first ran, so it keeps its place in the paper (Craig, 16 Oct 2026). */
function firstRun(printed: readonly PublishedStory[], story: PublishedStory): PublishedStory {
  if (REFILES_AS_NEWS.includes(story.kind)) return story;
  const earlier = printed.find((each) => each.slug === story.slug);
  return earlier === undefined ? story : { ...story, filedAt: earlier.filedAt };
}

/** The paper as the firing `found` it plus every story it has filed, and `story`'s archive file.
 *  Composed from `found` every time, so the last save prints what one save of the lot would. */
export function printStory(
  found: readonly PublishedStory[],
  filings: readonly Filing[],
  story: PublishedStory,
  now: string,
  root = EDITIONS_ROOT,
): void {
  const leagueId = story.leagueId;
  const mine = found.filter((each) => each.leagueId === leagueId);
  const others = found.filter((each) => each.leagueId !== leagueId);

  const slugs = new Set(filings.map((filing) => filing.story.slug));
  const dated = filings.map((filing) => firstRun(mine, filing.story));
  const merged = composePaper([...mine.filter((each) => !slugs.has(each.slug)), ...dated], now).slice(0, MAX_PAPER_STORIES);
  // Filing cannot shrink a paper to nothing; if it did, the compose dropped what it should have kept.
  if (merged.length === 0) throw new Error("Filing produced an empty paper; refusing to write it.");

  mkdirSync(root, { recursive: true });
  writeFileSync(paperPath(root), `${JSON.stringify({ updatedAt: now, stories: [...others, ...merged] }, null, 2)}\n`);

  const archiveDir = join(root, "archive", leagueId);
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(join(archiveDir, `${story.slug}.json`), `${JSON.stringify(firstRun(mine, story), null, 2)}\n`);
}
