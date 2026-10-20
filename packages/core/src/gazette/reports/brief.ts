import { REPORTS } from "../../config";
import { londonDayAndDate } from "../../time";
import { eventLine, manLine } from "./briefLines";
import type { MatchDesk } from "./desk";
import { played, withClub } from "./men";
import { momentNoun, sinceTurn, turnParagraph } from "./passages";
import { SIDES, type Side } from "../side";
import { howMany, spelled } from "../../format";
import { briefOf } from "../briefs/briefOf";
import { namesOfClub } from "./clubs";
import { surname } from "../../names";

// The facts one match-day report may use and nothing else, one block per match keyed by its fixture code. Each fact is
// handed once and marked with the part it belongs to, so the standfirst, the account and the sections cannot repeat each other.

export function matchBlock(desk: MatchDesk): string {
  const { match, events, counts, standing, facts, turn, paragraphs, budget, sections, lead } = desk;
  const f = match.fixture;
  const club = (side: Side) => {
    const c = match[side];
    const also = namesOfClub(c).slice(1);
    return `${c.name}${also.length === 0 ? "" : ` (or ${also.join(" or ")})`}${c.manager === null ? "" : `, managed by ${c.manager}`}`;
  };
  const table = SIDES.flatMap((side) => {
    const club = standing[side];
    return club === null ? [] : [`- ${match[side].name}: ${club.lines.join("; ")}`];
  });
  const [sectionLeast, sectionMost] = REPORTS.sectionWords;
  const last = paragraphs.at(-1)?.at(-1);
  const turnAt = turnParagraph(paragraphs, turn);
  return briefOf([
    `MATCH ${f.code}${lead ? ", THE LEAD" : ""}: ${match.home.name} ${f.homeScore}-${f.awayScore} ${match.away.name}${match.halfTime === null ? "" : `, ${match.halfTime.home}-${match.halfTime.away} at half-time`}.`,
    `The clubs: ${club("home")}; ${club("away")}.`,
    [`THE TABLE, for the standfirst and nowhere else in this match:`, ...table].join("\n"),
    `THE TURN, the match's story, which the standfirst carries and the account tells in its place with the most room: ${turn.line}.`,
    `LENGTH: standfirst ${REPORTS.standfirstWords} words at most; account ${budget.account} words at most, in ${howMany(Math.max(paragraphs.length, 1), "paragraph")}; ${howMany(sections.length, "section")} of ${sectionLeast} to ${sectionMost} words each, ${sectionLeast} more for each man after the first.`,
    paragraphs.length === 0 ? null : [
      "THE ACCOUNT, paragraph by paragraph, in the order the match was played. The brackets hold the minute phrases you may use; use one or none, never a figure of your own:",
      ...paragraphs.flatMap((moments, i) => [
        `PARAGRAPH ${i + 1}${i === turnAt ? ", with THE TURN: give it the most room" : ""}:`,
        ...moments.flatMap((event) => {
          const line = eventLine(match, event, sinceTurn(event, turn, events));
          return line === null ? [] : [`- ${line}`];
        }),
      ]),
      `END ON ${last === undefined ? "THE TURN" : momentNoun(last)}, and nothing after it.`,
    ].join("\n"),
    facts.length === 0 ? null : ["WORKED OUT FOR YOU, true as written. Use one at most, inside the sentence of the goal it explains; never a sentence of its own, never the last:", ...facts.map((fact) => `- ${fact}`)].join("\n"),
    [
      "THE SECTIONS, one for each line and in its order: a head, then what the man did that the account does not, in one or two sentences. The desk prints each stake after your words:",
      ...sections.map((s, i) => {
        const said = s.men.map((m) => `${withClub(match, m)}: ${manLine(match, m, counts.get(m.code), events, desk.keeperRung) || "played"}`);
        const all = said.length === 2 ? "BOTH MEN" : `ALL ${spelled(said.length).toUpperCase()} MEN`;
        return `- ${i + 1}. ${said.length === 1 ? said[0] : `ONE SECTION ON ${all}, each named: ${said.join("; AND ")}`}.`;
      }),
    ].join("\n"),
    `EVERY MAN YOU MAY NAME, by club, his name after the first in brackets where it is not his last word: ${SIDES.map((side) => `${match[side].name}: ${match.men.filter((m) => m.side === side && played(m)).map((m) => (m.surname === surname(m.name) ? m.name : `${m.name} (then ${m.surname})`)).join(", ")}`).join(". ")}.`,
  ]);
}

export function buildReportsBrief(day: string, gameweek: number, desks: readonly MatchDesk[]): string {
  const first = desks[0]?.match.fixture.kickoff;
  const when = first === null || first === undefined ? day : londonDayAndDate(first);
  return [`MATCH-DAY REPORT, ${when}, gameweek ${gameweek}. ${howMany(desks.length, "match", "matches")}, the lead first.`, ...desks.map(matchBlock)].join("\n\n=====\n\n");
}
