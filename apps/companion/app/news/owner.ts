import { ownerWords } from "../ownerWords";

/** Whose item a Mail row says it is: "Yours" for the reader's own team, else the league's short name for it; nothing
 *  for a team the league does not describe, or when the headline already names it, so a row never says it twice. */
export function ownerTag(
  teamId: string | null,
  mine: string | null,
  names: ReadonlyMap<string, string>,
  headline: string,
): string | null {
  if (teamId === null || (teamId !== mine && !names.has(teamId))) return null;
  const tag = ownerWords(teamId, "", mine, names)?.chip ?? null;
  return tag === null || namesWord(headline, tag) ? null : tag;
}

/** Whether `text` carries `word` whole, not inside a longer word ("Dome" is not in "Domenico"). */
function namesWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "u").test(text);
}
