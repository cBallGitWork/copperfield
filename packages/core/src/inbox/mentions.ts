import type { Mention } from "./types";

/** One run of a letter's body: plain words, or a name its letter links. */
export interface BodySpan {
  text: string;
  mention: Mention | null;
}

/** The body cut at every name it links, earliest first and the longer of two at one place; the words are unchanged. */
export function bodySpans(body: string, mentions: readonly Mention[]): BodySpan[] {
  const spans: BodySpan[] = [];
  let from = 0;
  while (from < body.length) {
    const next = earliest(body, mentions, from);
    if (next === null) break;
    if (next.at > from) spans.push({ text: body.slice(from, next.at), mention: null });
    spans.push({ text: next.mention.text, mention: next.mention });
    from = next.at + next.mention.text.length;
  }
  if (from < body.length) spans.push({ text: body.slice(from), mention: null });
  return spans;
}

function earliest(body: string, mentions: readonly Mention[], from: number): { at: number; mention: Mention } | null {
  let best: { at: number; mention: Mention } | null = null;
  for (const mention of mentions) {
    const at = wordAt(body, mention.text, from);
    if (at < 0) continue;
    if (best === null || at < best.at || (at === best.at && mention.text.length > best.mention.text.length)) {
      best = { at, mention };
    }
  }
  return best;
}

const LETTER = /[\p{L}\p{N}]/u;

/** Where `text` next stands as whole words at or after `from`, never inside a longer one ("Bru" in "Brugge"); -1 if nowhere. */
function wordAt(body: string, text: string, from: number): number {
  if (text === "") return -1;
  for (let at = body.indexOf(text, from); at >= 0; at = body.indexOf(text, at + 1)) {
    const before = body[at - 1] ?? "";
    const after = body[at + text.length] ?? "";
    if (!LETTER.test(before) && !LETTER.test(after)) return at;
  }
  return -1;
}
