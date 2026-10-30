import type {
  PublishedStory,
  StoryFace,
  StoryKind,
  ThreadUpdate,
} from "@epl/core";
import { ANTHROPIC_MESSAGES_URL, MODEL_TIMEOUT_MS, MOST_THREADS, NEWSROOM, normalizeStory } from "@epl/core";
import { type Reply, viaClaudeCode } from "./claudeCode";

// The one API call, and the shape a filed column takes in the rolling paper.

const MODEL = process.env.GAZETTA_MODEL ?? NEWSROOM.writer;
const DRAFT_MODEL = process.env.GAZETTA_DRAFT_MODEL ?? NEWSROOM.draftWriter;
/** The model for the calls that read rather than write: a judge, a fan's read-back, a line edit. */
const HELPER_MODEL = process.env.GAZETTA_HELPER_MODEL ?? NEWSROOM.helper;

/** How a desk reports as it works: the firing's log, a line at a time. */
export type Say = (message: string) => void;

/** What a call is for: the writer's prose, the draft report's, or a helper's reading of it. */
export type Tier = "writer" | "draft" | "helper";

/** Tokens a call cost, the cached prefix counted apart: read from cache at a fraction of the price, or written to it. */
export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

/** Tokens spent: fresh input (cache writes included), cache reads, and output. */
export interface Spent {
  input: number;
  cached: number;
  output: number;
}

// Every call of the firing, fed by writeColumn; desks run one at a time, so a desk's share is the difference.
const spent: Spent = { input: 0, cached: 0, output: 0 };

/** The firing's running total, to mark where a desk starts. */
export function tokensSpent(): Spent {
  return { ...spent };
}

/** What was spent since `mark`. */
export function spentSince(mark: Spent): Spent {
  return { input: spent.input - mark.input, cached: spent.cached - mark.cached, output: spent.output - mark.output };
}

/** A total as the log prints it. */
export function tokensLine(total: Spent): string {
  return `${total.input} tokens in, ${total.cached} from cache, ${total.output} out`;
}

/** A helper's failure as a `.catch`: the step is lost, never the column, and the log says why. */
export function helperFailed<T>(say: Say, desk: string, step: string, instead: T): (error: unknown) => T {
  return (error) => {
    say(`  ${desk}: the ${step} failed, ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`);
    return instead;
  };
}

/** One call: through Claude Code on the Max subscription, or by fetch with the API key when GAZETTA_VIA is "api".
 *  `maxTokens` is for a call that thinks at length before it answers, whose thinking spends the same budget. */
export async function writeColumn(
  system: string,
  brief: string,
  tier: Tier = "writer",
  maxTokens: number = NEWSROOM.maxTokens,
): Promise<Record<string, unknown>> {
  const model = tier === "helper" ? HELPER_MODEL : tier === "draft" ? DRAFT_MODEL : MODEL;
  // A helper's effort is said too: the CLI's default is not the API's, and the bill would move unseen.
  const effort = tier === "helper" ? NEWSROOM.helperEffort : tier === "draft" ? NEWSROOM.draftEffort : NEWSROOM.effort;
  const reply = process.env.GAZETTA_VIA === "api" ? await viaApi(system, brief, model, maxTokens, effort) : await viaClaudeCode(system, brief, model, maxTokens, effort);
  if (reply.usage !== undefined) count(reply.usage);
  // A truncated column is a JSON parse away from garbage, and the parse would
  // fail with a message about a bracket rather than about a limit.
  if (reply.stopReason !== "end_turn") throw new Error(`Stopped on ${reply.stopReason}, not a finished column.`);

  const fenced = __objectIn(reply.text);
  try {
    return JSON.parse(fenced) as Record<string, unknown>;
  } catch {
    // A raw newline inside a JSON string is not JSON, and the house style's blank lines put some there: one repair only,
    // escaping control characters inside string literals; a column whose braces are wrong still fails.
    return JSON.parse(__escapeControlsInStrings(fenced)) as Record<string, unknown>;
  }
}

function count(u: Usage): void {
  spent.input += (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  spent.cached += u.cache_read_input_tokens ?? 0;
  spent.output += u.output_tokens ?? 0;
}

/** The API by fetch, no SDK: CODE_RULES §2 says no dependency a small local function would cover. */
async function viaApi(system: string, brief: string, model: string, maxTokens: number, effort: string): Promise<Reply> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set, and GAZETTA_VIA=api asks for it.");

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": NEWSROOM.apiVersion,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      output_config: { effort },
      // The voice is long and the same on every call of a firing, so it is cached: a repeat reads it at a fraction of the price.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: brief }],
    }),
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: { type?: string; text?: string }[];
    usage?: Usage;
  };
  return { text: body.content?.find((block) => block.type === "text")?.text ?? "", stopReason: body.stop_reason, usage: body.usage as Reply["usage"] };
}


/** The reply from its first brace to its last: a sentence or a fence around the JSON is chatter,
 *  not a broken column. */
export function __objectIn(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end < start ? text.trim() : text.slice(start, end + 1);
}

/** Escape raw newlines, tabs and carriage returns that sit inside a JSON string
 *  literal, leaving the ones between fields alone. Walks the text tracking
 *  whether it is inside quotes, which is enough to tell the two apart. */
export function __escapeControlsInStrings(json: string): string {
  const ESCAPES: Record<string, string> = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
  let out = "";
  let inString = false;
  let escaped = false;
  for (const character of json) {
    if (escaped) {
      out += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && inString) {
      out += character;
      escaped = true;
      continue;
    }
    if (character === '"') inString = !inString;
    out += inString && ESCAPES[character] !== undefined ? ESCAPES[character] : character;
  }
  return out;
}

/** Everything ours about a filing; the model's part is only the words. */
interface ColumnMeta {
  slug: string;
  kind: StoryKind;
  leagueId: string;
  period: number;
  gameweek: number;
  filedAt: string;
  expiresAt: string | null;
  /** Until when it leads the paper whatever files after it; absent orders it by filing. */
  leadsUntil?: string;
  edition: string;
  byline: string;
  /** The columnist's own name, where it is not the kind's staff writer's. */
  reporter?: string;
  /** The covered-key this filing spends — also its one subject. */
  subject: string;
  /** The man the page pictures, picked by the desk (`faces.faceOf`), never the model; null for a kind with no man. */
  face: StoryFace | null;
}

/** A rolling prose column (the `STORY_SHAPE` contract), stamped and validated
 *  into a story, with whatever storyline beats the model reported. */
export function storyOfColumn(
  column: Record<string, unknown>,
  meta: ColumnMeta,
): { story: PublishedStory; threads: ThreadUpdate[] } {
  const story = normalizeStory({
    slug: meta.slug,
    kind: meta.kind,
    leagueId: meta.leagueId,
    period: meta.period,
    gameweek: meta.gameweek,
    filedAt: meta.filedAt,
    expiresAt: meta.expiresAt,
    leadsUntil: meta.leadsUntil,
    edition: meta.edition,
    byline: meta.byline,
    reporter: meta.reporter,
    headline: column.headline,
    deck: column.deck,
    body: column.body,
    subjects: [meta.subject],
    image: null,
    face: meta.face,
    // The calls, for the kinds that make them.
    ties: column.ties,
    // The cargo, nested: each prompt asks for its structured part at the top level, the shape a model returns reliably,
    // and `PublishedStory` keeps it under `extras`; without the fold the page silently renders none of it.
    extras: {
      quotes: column.quotes,
      ranks: column.ranks,
      teamNews: column.teamNews,
      lineups: column.lineups,
      sheets: column.sheets,
      record: column.record,
      skit: column.skit,
      reports: column.reports,
      bin: column.bin,
      draft: column.draft,
      moves: column.moves,
      transfer: column.transfer,
    },
  });
  if (story === null) throw new Error(`The ${meta.kind} did not come back in a printable shape.`);
  return { story, threads: threadUpdates(column.threads) };
}

/** The model reports at most a few beats; anything malformed is dropped, not
 *  fixed — the ledger is memory, and remembering garbage is worse than
 *  forgetting a beat. */
function threadUpdates(raw: unknown): ThreadUpdate[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((update): update is ThreadUpdate => {
      const beat = update as Partial<ThreadUpdate>;
      return (
        typeof beat?.subject === "string" && beat.subject !== "" &&
        typeof beat.beat === "string" && beat.beat !== "" &&
        (beat.status === undefined || beat.status === "open" || beat.status === "retired")
      );
    })
    .slice(0, MOST_THREADS);
}
