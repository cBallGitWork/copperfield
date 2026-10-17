import type { Report } from "../predictions/checks";
import { masked, ngrams, sentences } from "../predictions/prose";
import { blanked } from "../proofing";
import { banned } from "../banned";
import type { MatchDesk } from "./desk";
import type { ReportPiece } from "./draft";
import { surname } from "../../names";
import { changeIsNews } from "./men";
import { REPORT_ROUTINE_HEAD, unrepeatable } from "./words";
import { isDismissal, isGoal } from "./timeline";
import { SIDES } from "../side";
import { namesOfClub } from "./clubs";

// Each part of a piece owns its facts: the table is the standfirst's, the account tells what decided the match and not the
// bookings, a section says what the account did not about the man the desk chose, and the league is the desk's stake.

// A place, never an ordinal with its noun: "the 80th minute", "an 85th-minute shot", "his 12th goal".
const TABLE = /\b\d{1,2}(?:st|nd|rd|th)\b(?![- ](?:minute|goal|league|start|appearance|match|game|assist|save|shot|chance|time)s?\b)|\bbottom three\b|\brelegation zone\b|\bwithout a win\b|\bunbeaten\b|\btop of the table\b|\btop place\b|\bfirst (?:win|defeat|victory)\b/iu;
const BOOKED = /\bbooked\b|\bcautioned\b|\byellow card\b/iu;
/** A substitution told in words. */
export const CHANGE = /\bcame on\b|\bsent on\b|\bbrought on\b|\bmaking way\b|\bmade way\b|\breplaced\b|\bintroduced\b/iu;
const RUN = 4;
/** The league's defensive points told as a count of play: "two defensive actions", "a pair of interventions". */
const COUNTED = /\b(?:a pair of|a couple of|a brace of|a single|one|two|three|four|five|six|seven|eight|nine|\d+) (?:defensive |clearing )?(?:actions?|interventions?|contributions?)(?: in defence)?\b/iu;

/** The key a fault names one section by: `"12345:s2"` is the second section of match 12345. */
export const sectionKey = (code: number, i: number) => `${code}:s${i + 1}`;

export function partFaults(code: number, piece: ReportPiece, desk: MatchDesk, fault: Report): void {
  const { match, events } = desk;
  const names = [...match.men.map((m) => m.name), ...match.men.map((m) => m.surname), ...namesOfClub(match.home), ...namesOfClub(match.away)];

  // A club is its name: "<manager>'s side" only for the club the standfirst is about, which it names first.
  const first = SIDES.map((side) => ({ side, at: Math.min(...namesOfClub(match[side]).map((n) => piece.standfirst.indexOf(n)).filter((n) => n >= 0)) })).sort((a, b) => a.at - b.at)[0];
  for (const side of SIDES) {
    const manager = match[side].manager;
    const theirs = manager !== null && [manager, surname(manager)].some((n) => piece.standfirst.includes(`${n}'s side`) || piece.standfirst.includes(`${n}’s side`));
    if (theirs && first.side !== side) fault(`${code}:standfirst`, "a manager's side names the other club; name the club", "send-back", `${manager}'s side`);
  }

  // The table is told once, in the standfirst.
  const outside = [piece.account, ...piece.sections.map((s) => s.pitch)].join(" ");
  const table = TABLE.exec(masked(outside, names));
  if (table !== null) fault(`${code}:account`, "the table belongs to the standfirst, once", "send-back", table[0]);

  // A section says what the account did not; football's fixed phrases are no retelling.
  const plain = unrepeatable(names);
  const account = ngrams(piece.account, RUN, plain);
  piece.sections.forEach((s, i) => {
    const shared = [...ngrams(s.pitch, RUN, plain)].find((gram) => account.has(gram));
    if (shared !== undefined) fault(sectionKey(code, i), "a section retells the account", "send-back", shared);
  });

  // A club is its full name once a match, then a short name, where it has one.
  const prose = [piece.standfirst, piece.account, ...piece.sections.map((s) => s.pitch)].join("\n");
  for (const club of [match.home, match.away].filter((c) => c.shorts.length > 0)) {
    if (prose.split(club.name).length > 2) fault(`${code}:match`, `a club's full name again; after the first, ${club.shorts[0]}`, "send-back", club.name);
  }

  // Defensive points are what the league pays, never a count of tackles the brief does not give.
  for (const text of [piece.standfirst, piece.account, ...piece.sections.map((s) => s.pitch)]) {
    const counted = COUNTED.exec(text);
    if (counted !== null) fault(`${code}:match`, "defensive points counted as actions; they are points the league pays", "send-back", counted[0]);
  }

  // Each section is about the men the desk chose for it, in its order, and its head is news unless a start or a change was.
  piece.sections.forEach((s, i) => {
    if (s.head !== "" && !/\p{L}{2,}/u.test(blanked(s.head, names).replace(/['’]s\b/gu, ""))) fault(sectionKey(code, i), "a head that is a name alone; give his news", "send-back", s.head);
    const chosen = desk.sections[i]?.men ?? [];
    const missing = chosen.find((m) => ![s.head, s.pitch].some((text) => text.toLowerCase().includes(m.surname.toLowerCase())));
    if (missing !== undefined) fault(sectionKey(code, i), `section ${i + 1} is about ${chosen.map((m) => m.name).join(" and ")}`, "send-back", s.head);
    const routine = banned(s.head, REPORT_ROUTINE_HEAD);
    if (routine.length > 0 && !chosen.some(changeIsNews)) fault(sectionKey(code, i), "a head on a routine start or change; head the news", "send-back", s.head);
  });

  // The league is the desk's: the writer's words never name a team in it.
  const sides = [...new Set(match.men.flatMap((m) => [...(m.holder === null ? [] : [m.holder.team, ...m.holder.h2h.map((h) => h.opponent)]), ...(m.dropped === null ? [] : [m.dropped.team])]))];
  for (const side of banned([piece.standfirst, piece.account, ...piece.sections.flatMap((s) => [s.head, s.pitch])].join("\n"), sides)) {
    fault(`${code}:match`, "a team in this league named in the football; the desk prints the stake", "send-back", side);
  }

  // Bookings and routine changes are the timeline's: in the account only when they became a red, a goal or an injury.
  const sentOff = new Set(events.filter((e) => isDismissal(e.kind)).map((e) => e.man?.code));
  const decisive = new Set([
    ...events.filter((e) => isGoal(e)).flatMap((e) => [e.man?.code, e.other?.code]),
    ...events.filter((e) => e.injury).flatMap((e) => [e.man?.code, e.other?.code]),
  ]);
  for (const sentence of sentences(piece.account)) {
    const about = match.men.filter((m) => sentence.includes(m.surname));
    if (BOOKED.test(sentence) && !about.some((m) => sentOff.has(m.code))) fault(`${code}:account`, "a booking in the account", "send-back", sentence.slice(0, 70));
    if (CHANGE.test(sentence) && !about.some((m) => decisive.has(m.code))) fault(`${code}:account`, "a routine change in the account", "send-back", sentence.slice(0, 70));
  }
}
