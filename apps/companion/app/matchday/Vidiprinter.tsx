import type { Club, Fixture, FootballPlayer, PlayerOwner, PrinterLine } from "@epl/core";
import Section from "../components/shell/Section";
import StepHead from "../components/shell/StepHead";
import { LIVE } from "../components/shell/sections";
import { Holder } from "../players/BoardRow";
import type { DayStep } from "./scoreDay";
import { type PrinterMan, type PrinterRow, printerRow } from "./printerRow";

// The vidiprinter (Craig, 30 Oct 2026): every whistle, goal and red card, and a drafted man's cards, changes and counts.

/** The Live tab's vidiprinter view, by its query value. */
export const VIDIPRINTER_VIEW = "vidiprinter";
export const VIDIPRINTER_HREF = `${LIVE}?view=${VIDIPRINTER_VIEW}`;

export default function Vidiprinter({
  lines,
  day,
  fixtures,
  clubs,
  players,
  owners,
  mine,
}: {
  lines: readonly PrinterLine[];
  day: DayStep | null;
  fixtures: readonly Fixture[];
  clubs: Map<number, Club>;
  players: readonly FootballPlayer[];
  owners: ReadonlyMap<number, PlayerOwner>;
  mine: string | null;
}) {
  const byCode = new Map(fixtures.map((f) => [f.code, f]));
  const byMan = new Map(players.map((p) => [p.code, p]));
  const teamNames = new Map([...owners.values()].map((o) => [o.teamId, o.teamName]));
  const name = (man: PrinterMan) => (
    <>
      <span className={man.ownerTeamId !== null && man.ownerTeamId === mine ? "text-accent" : "text-ink"}>{man.name}</span>
      <Holder held={{ ownerTeamId: man.ownerTeamId, status: "" }} teamNames={teamNames} reader={mine} className="ml-1" />
    </>
  );

  return (
    // No head: the tab above already names the view. A desk keeps the column to a reading width.
    <div className="lg:max-w-3xl">
      <Section>
        {day === null ? null : <StepHead label="Match days" title={day.title} previous={day.previous} next={day.next} heading="h3" />}
        {lines.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted">Nothing on the vidiprinter yet.</p>
        ) : (
          <ul className="cm-rows">
            {lines.map((line) => {
              const row = printerRow(line, byCode, clubs, byMan, owners);
              return (
                <li key={row.key} className="cm-row flex gap-2 px-2 py-1.5 text-sm">
                  <span className="numeric w-10 shrink-0 text-right text-muted">{row.clock}</span>
                  <span className="min-w-0 flex-1">
                    {row.word === null ? null : (
                      <span className={`mr-1.5 text-2xs font-bold uppercase ${row.loss ? "text-bad" : row.live ? "text-live" : "text-muted"}`}>{row.word}</span>
                    )}
                    {row.man === null ? null : name(row.man)}
                    {row.second === null ? null : (
                      <>
                        {" "}
                        <span className="whitespace-nowrap">
                          <span className="text-2xs font-bold uppercase text-muted">As</span> {name(row.second)}
                        </span>
                      </>
                    )}
                    {row.match === null ? null : <Match match={row.match} />}
                    {row.club === null ? null : <span className="ml-1.5 text-muted">{row.club}</span>}
                    {row.counts.length === 0 ? null : (
                      <span className="block text-xs text-muted">
                        {row.counts.map((count, at) => (
                          <span key={count.name}>
                            {at === 0 ? null : " · "}
                            {count.name}
                            {count.value === null ? null : <span className="numeric text-ink"> {count.value}</span>}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** The match as three pieces that each keep whole when the line wraps: home, the score or "v", away. */
function Match({ match }: { match: NonNullable<PrinterRow["match"]> }) {
  return (
    <span className="ml-1.5 text-muted">
      <span className="whitespace-nowrap">{match.home}</span>{" "}
      {match.score === null ? "v" : <span className="numeric whitespace-nowrap">{match.score}</span>}{" "}
      <span className="whitespace-nowrap">{match.away}</span>
    </span>
  );
}
