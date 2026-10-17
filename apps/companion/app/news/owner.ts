import { shortName } from "../teamNames";

/** Whose item a Mail row says it is: "You" for the reader's own team, else the league's short name for it; nothing
 *  when the headline already names the team, so a row never says it twice. */
export function ownerTag(
  teamId: string | null,
  mine: string | null,
  names: ReadonlyMap<string, string>,
  headline: string,
): string | null {
  if (teamId === null) return null;
  const full = names.get(teamId);
  const tag = teamId === mine ? "You" : full === undefined ? null : shortName(teamId, full);
  return tag === null || namesWord(headline, tag) ? null : tag;
}

/** Whether `text` carries `word` whole, not inside a longer word ("Dome" is not in "Domenico"). */
function namesWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "u").test(text);
}
