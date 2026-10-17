import type { AvailabilityNote } from "../gazette/types";
import { ailment, readNote } from "./notes";

// A doubt, written as its sender would: your physio about your man, your scout about the opponent's, the club's
// desk when nobody is signed in. Every fact is FPL's; only the sentence is ours.

/** Whose man he is: the reader's, his next opponent's, or the league's for a signed-out reader. */
export type Side = "mine" | "opponent" | "league";

/** One of a few ways of saying a thing, fixed by `key` so a refresh never rewords a letter. */
function choose<T>(key: string, options: readonly T[]): T {
  let hash = 0;
  for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

/** The letter's body. `who` is the squad he belongs to, by name. */
export function doubtLetter(note: AvailabilityNote, gameweek: number | null, side: Side, who: string): string {
  const reading = readNote(note.news);
  const name = note.fullName;
  const pick = <T>(options: readonly T[]) => choose(`${note.teamId}:${note.playerName}`, options);
  const gw = gameweek === null ? "the next gameweek" : `gameweek ${gameweek}`;
  const theirs = side !== "mine";
  const without = `${who} will be without ${name} for ${gw}.`;
  const doubtOver = `${who} have a doubt over ${name} for ${gw}.`;

  if (reading.kind === "ban") {
    const until = reading.until === null ? "" : ` until ${reading.until}`;
    return theirs
      ? `${without} He is suspended${until}.`
      : `${name} is suspended for ${gw}.${until === "" ? "" : ` His ban runs${until}.`}`;
  }
  if (reading.kind === "move") {
    return theirs ? `${name} ${reading.clause}, so ${who} have lost him.` : `${name} ${reading.clause}, so he's no longer available to you.`;
  }
  if (reading.kind === "other") {
    // A shape we cannot read is quoted whole rather than reworded.
    const latest = `The latest update says "${reading.text}".`;
    if (theirs) return `${note.out ? without : doubtOver} ${latest}`;
    return `${name} ${note.out ? "is out" : "is a doubt"} for ${gw}. ${latest}`;
  }

  const has = ailment(reading.complaint);
  // "Isak has a knock and misses", or "Isak misses" when FPL names no complaint; `He` the same after a sentence.
  const named = has === null ? name : `${name} ${has} and`;
  const he = has === null ? "He" : `He ${has} and`;
  const outlook = reading.outlook === "unknown" ? null : reading.outlook;
  const back = outlook !== null && "back" in outlook ? outlook.back : null;

  if (note.out) {
    if (back !== null) {
      return theirs
        ? pick([
            `${without} ${he} should be back on ${back}.`,
            `${name} misses ${gw} for ${who}. ${he} is expected back on ${back}.`,
          ])
        : pick([
            `${named} misses ${gw}. He should be back on ${back}.`,
            `${named} won't play in ${gw}. He's expected back on ${back}.`,
          ]);
    }
    const noDate = has === null ? "There's no date yet for his return." : `${he} there's no date yet for his return.`;
    const noWord = has === null ? "There's no word yet on when he'll be back." : `${he} there's no word yet on when he'll be back.`;
    return theirs
      ? pick([`${without} ${noDate}`, `${name} won't play for ${who} in ${gw}. ${noWord}`])
      : pick([
          `${named} misses ${gw}. There's no date yet for his return.`,
          `${named} won't play in ${gw}. There's no word yet on when he'll be back.`,
        ]);
  }
  // The chance is the status chip's; a letter never quotes a percentage.
  if (theirs) return has === null ? doubtOver : `${doubtOver} He ${has}.`;
  return `${named} is a doubt for ${gw}.`;
}

/** Who signs it: your physio, the FA or the transfer desk for your man; your scout for theirs. */
export function doubtFrom(note: AvailabilityNote, side: Side, who: string): string {
  if (side === "opponent") return "Your scout";
  if (note.state === "suspended") return "The FA";
  if (note.state === "unavailable") return "The transfer desk";
  return side === "mine" ? "Your physio" : `${possessive(who)} physio`;
}

/** "test1's", and "Rovers'" for a name already ending in s. */
function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}
