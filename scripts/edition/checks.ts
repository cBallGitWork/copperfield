import { recordOrEmpty, type Assignment, type PublishedStory } from "@epl/core";

// What a filed story is checked for before it is committed. `strangers` and `CARGO` warn and never refuse; the banned
// list sends a column back once (`sendBack` in `voice/house.ts`).

/** The kinds whose substance lives in `extras` rather than the body, and which member carries it. A kind absent from
 *  this table legitimately files without extras. */
export const CARGO: Partial<Record<Assignment["kind"], "ranks" | "teamNews" | "reports" | "draft">> = {
  "match-report": "reports",
  "draft-report": "draft",
  "season-rankings": "ranks",
  // The Team Sheet IS its rows; the body only introduces them.
  presser: "teamNews",
};

/** Every written surface of a filed story, as one string to check names in: the body, the tie lines and every
 *  cargo row's written member, never the row itself, whose ids would read as names. */
export function prose(story: PublishedStory): string {
  const extras = story.extras ?? {};
  const parts: unknown[] = [
    // Not the headline: it is title case, so every ordinary word in it would report as a stranger.
    story.deck,
    story.body,
    ...(story.ties ?? []).map((tie) => tie.line),
    ...lines(extras.ranks),
    // The Team Sheet's rows are the article: the club's line, each man's note and the quote it carries.
    ...lines(extras.teamNews),
    ...(extras.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.note)),
    ...(extras.teamNews ?? []).map((row) => row.quote?.text),
    ...(extras.reports ?? []).flatMap((r) => [r.standfirst, r.account, ...r.sections.flatMap((s) => [s.head, s.pitch, s.stake])]),
    ...(extras.draft?.matchups ?? []).flatMap((m) => [m.standfirst, ...m.paragraphs]),
  ];
  // Each part on its own line, which the check reads as a sentence opening.
  return parts.filter((part): part is string => typeof part === "string").join("\n");
}

/** The same with the headline, which is what the banned list reads: the headline is where "bank" did its damage. */
export function headlineAndProse(story: PublishedStory): string {
  return `${story.headline}\n${prose(story)}`;
}

/** Each cargo row's written `line`, or the row itself where it is a string; anything else is dropped, not stringified. */
function lines(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (typeof row === "string") return [row];
    if (row === null || typeof row !== "object") return [];
    const line = (row as Record<string, unknown>).line;
    return typeof line === "string" ? [line] : [];
  });
}

/** The status a Team Sheet bullet already prints; a club line that is only a man's name and one of these says nothing. */
const ECHOES: readonly string[] = ["is a doubt", "is suspended", "is out", "returns to contention", "is available"];

const plain = (words: string) => words.trim().replace(/\.$/u, "").replace(/\s+/gu, " ").toLowerCase();

/** Whether a row's line is exactly one of its own men, bulleted or still out, plus a status phrase: Villa's "Ross
 *  Barkley is a doubt." over DOUBT Ross Barkley (gameweek 7). An exact comparison, never a search of free text. */
function echoes(row: Record<string, unknown>): boolean {
  if (typeof row.line !== "string") return false;
  const line = plain(row.line);
  const men = [row.men, row.stillOut].flatMap((list) => (Array.isArray(list) ? list.map((man) => recordOrEmpty(man).name) : []));
  return men.some((name) => typeof name === "string" && ECHOES.some((status) => line === `${plain(name)} ${status}`));
}

/** The Team Sheet's rows with every echoing line blanked, which the desk's `line` guard then leaves unprinted. */
export function withoutEchoes(rows: unknown): unknown {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    const record = recordOrEmpty(row);
    return row !== null && typeof row === "object" && echoes(record) ? { ...record, line: "" } : row;
  });
}
