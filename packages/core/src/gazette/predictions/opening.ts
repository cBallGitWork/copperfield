import { sentences } from "./prose";

// Lawro's fall line, one in every opening (Craig's running joke): never the same line twice, nor the same picture.

/** A sentence about how far he has come down. */
const FALL = /\bbbc\b|twenty-two years|thirty years|come (?:down|to this)|ended up|fallen|fell off/iu;

const words = (text: string) => text.match(/[\p{L}-]{4,}/gu) ?? [];
const stem = (word: string) => word.toLowerCase().replace(/s$/u, "");

/** The fall lines of his earlier columns, newest first: a column's opening is its first line, and its fall is the first
 *  sentence about it and the one after ("…on the BBC. Now I rank fantasy squads…"). */
export function fallLines(columns: readonly string[]): string[] {
  return columns.flatMap((prose) => {
    const opening = sentences(prose.split("\n")[0] ?? "");
    const from = opening.findIndex((sentence) => FALL.test(sentence));
    return from === -1 ? [] : opening.slice(from, from + 2);
  });
}

/** Each word of an earlier fall line's own picture, one no fact gave him, back in this opening. */
export function fallEchoes(opening: string, columns: readonly string[], facts: string): string[] {
  const lines = fallLines(columns);
  const given = new Set(words(lines.reduce((text, line) => text.split(line).join(" "), facts)).map(stem));
  const worn = new Set(lines.flatMap(words).map(stem).filter((word) => !given.has(word)));
  return [...new Set(words(opening).filter((word) => worn.has(stem(word))).map(stem))];
}
