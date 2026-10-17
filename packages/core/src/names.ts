import type { FootballPlayer } from "./football/types";
import { withoutAccents } from "./format";
import { normalizeName, tokens } from "./identity/normalize";
import { isResolved, type RosteredPlayer } from "./join/roster";

// Every way a player's name is printed, in one place:
// shirtName (FPL's shirt name as a row prints it) · initialled (a phone list) · surname (the paper) ·
// fullFootballerName and fullPlayerName (a desk list) · spelt (Fantrax's name in FPL's spelling) ·
// playerName (FPL's shirt name, or the Fantrax id) · pitchName (a pitch disc); searchKey and nameMatches find one.

/** FPL's shirt name as a row prints it: a space after an initial ("J.Timber" → "J. Timber") and a tail FPL glued on
 *  parted ("Kroupi.Jr" → "Kroupi Jr", "Tóth.A" → "Tóth A."). Every other name stands as FPL spells it. */
export function shirtName(name: string): string {
  return unglued(name.trim()).replace(/^(\p{L})\.(?=\p{L})/u, "$1. ");
}

/** A surname with a tail glued on by a dot, parted; a one-letter tail keeps its dot, as FPL's "Bruno G." does. */
function unglued(name: string): string {
  const glued = /^(\p{L}[\p{L}'’-]+)\.(\p{L}+)$/u.exec(name);
  if (glued === null) return name;
  const [, head, tail] = glued;
  return Array.from(tail).length === 1 ? `${head} ${tail}.` : `${head} ${tail}`;
}

/** A tail that is no forename to initial: "Iling Jr" is not "I. Jr". */
const SUFFIX = /^(jr|sr|jnr|snr)\.?$/i;

/** A player's name for a list on a phone: the forename as an initial, `K. Dewsbury-Hall`; reads Fantrax's `Gross, Pascal` too. */
export function initialled(name: string): string {
  const trimmed = name.trim();
  const comma = trimmed.indexOf(",");
  if (comma !== -1) {
    const surname = trimmed.slice(0, comma).trim();
    const first = Array.from(trimmed.slice(comma + 1).trim())[0];
    return first ? `${first}. ${surname}` : surname;
  }
  const shirt = shirtName(trimmed);
  const at = shirt.indexOf(" ");
  if (at <= 0) return shirt;
  const first = shirt.slice(0, at);
  const rest = shirt.slice(at + 1).trim();
  // Already short ("Bruno G.", "J. Timber", "Iling Jr"), or opening on a surname particle ("De Ligt", "Mac Allister").
  if (first.includes(".") || /^\p{L}\.$/u.test(rest) || SUFFIX.test(rest) || PARTICLES.has(first.toLowerCase())) return shirt;
  return `${Array.from(first)[0]}. ${rest}`;
}

const PARTICLES = new Set(["van", "de", "da", "dos", "der", "den", "di", "le", "la", "ter", "mac"]);

/** A surname as the paper prints it, particle and all: "Jan Paul van Hecke" → "van Hecke"; "Sávio" → "Sávio". Given the
 *  club's own name parts, a compound surname or a man known by his forenames stays whole: "Strand Larsen", "João Pedro". */
export function surname(name: string, club: { first?: string; last?: string } = {}): string {
  const display = name.trim();
  if (club.last && (display === club.last || display.endsWith(` ${club.last}`))) return club.last;
  if (club.first && display === club.first.trim()) return display;
  const parts = display.split(/\s+/);
  const at = parts.findIndex((part, i) => i > 0 && PARTICLES.has(part.toLowerCase()));
  return at > 0 ? parts.slice(at).join(" ") : (parts.at(-1) ?? name);
}

/** What to call a rostered slot on screen: the Fantrax id when we cannot name him, never a blank. */
export function playerName(rostered: RosteredPlayer): string {
  return isResolved(rostered) ? rostered.player.name : rostered.slot.fantraxId;
}

/** His name in full, for a list with the width for one: `Bruno Fernandes`; an unresolved slot answers its id. */
export function fullPlayerName(rostered: RosteredPlayer): string {
  return isResolved(rostered) ? fullFootballerName(rostered.player) : rostered.slot.fantraxId;
}

/** A footballer's name in full, `fullPlayerName`'s answer for a man with no roster slot. */
export function fullFootballerName({ fullName, name }: FootballPlayer): string {
  // The first forename and the shirt name, as Fantrax prints him: "Matheus Cunha", not the birth certificate. A shirt
  // name with a dot or a space is FPL already telling two men apart ("B.Fernandes"), so it stands, as a row prints it.
  if (name.includes(".") || name.includes(" ")) return shirtName(name);

  const first = fullName.split(" ")[0];
  // One-word players (Rodri) stand alone; accents are folded, or "Yéremy" with the shirt "Yeremy" reads "Yéremy Yeremy".
  if (!first || withoutAccents(name) === withoutAccents(first) || fullName === name) return name;

  return `${first} ${name}`;
}

/** Fantrax's name for a man in FPL's spelling when they are the same name ("Pascal Gross" → "Pascal Groß", "Nico
 *  OReilly" → "Nico O'Reilly"); a different name ("Bruno Fernandes", FPL's "B. Fernandes") stays Fantrax's. */
export function spelt(fantrax: string, footballer: FootballPlayer): string {
  const football = fullFootballerName(footballer);
  return searchKey(fantrax) === searchKey(football) ? football : fantrax;
}

/** A name or a typed search folded for a substring match: "Ødegaard", "O’Reilly" and "Wan Bissaka" read
 *  "odegaard", "oreilly" and "wanbissaka", as the names they find do. */
export function searchKey(text: string): string {
  return normalizeName(text).replace(/ /g, "");
}

/** Whether a typed search finds a name: each word typed, folded as `searchKey` folds, opens one of his words or runs on
 *  across the next, so "B. Saka", "saka bukayo" and "vandijk" find their men and "B. Saka" does not find Wan-Bissaka. */
export function nameMatches(name: string, typed: string): boolean {
  const words = tokens(name);
  const starts = words.map((_, at) => words.slice(at).join(""));
  return tokens(typed).every((part) => starts.some((start) => start.startsWith(part)));
}

/** Whoever a pitch card names: a rostered slot, a footballer, or a bare name (his full name too, when it is one). */
export type PitchNamed = RosteredPlayer | { name: string; fullName?: string };

/** His name at a pitch card's width: the shirt name, his own forename cut to an initial (`G.Hemmings`). */
export function pitchName(who: PitchNamed): string {
  if ("slot" in who) return isResolved(who) ? pitchName(who.player) : who.slot.fantraxId;
  const { fullName = who.name } = who;
  // A glued tail parted ("Kroupi Jr"); his initial stays tight to the surname at a card's width.
  const name = unglued(who.name);
  const at = name.indexOf(" ");
  // No space is a shirt name already; a dot is FPL telling two men apart ("Bruno G.").
  if (at <= 0 || name.includes(".")) return name;

  // Only his forename: "Mac Allister" and "Smith Rowe" are surnames, which his full name does not start with.
  const first = name.slice(0, at);
  const forename = fullName.split(" ")[0] ?? "";
  return withoutAccents(first) === withoutAccents(forename) ? `${first[0]}.${name.slice(at + 1)}` : name;
}
