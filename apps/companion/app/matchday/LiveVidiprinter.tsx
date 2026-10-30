import { type FootballSnapshot, type PrinterTally, clubById, fixturesInOrder, isResolved, londonDay, onLondonDay, vidiprinter } from "@epl/core";
import { roundFigures } from "../football";
import type { ReadableSquads } from "../squads";
import { periodMen } from "../scoreboard";
import { leagueInfo } from "../round";
import { type Marks, marksFor } from "../involvement";
import { creditAssists, roundGoals, roundStreams, withRoundState } from "../commentary";
import { roundAssistKinds } from "../assistKinds";
import { roundCodes } from "./sheetCodes";
import { roundMoments } from "./roundMoments";
import { dayStep, matchDays } from "./scoreDay";
import { now } from "../clock";
import Vidiprinter, { VIDIPRINTER_HREF } from "./Vidiprinter";

/** Live's vidiprinter view: the feed's moments for every man and the league's counts for drafted men, one day at a time. */
export default async function LiveVidiprinter({
  snapshot,
  drafted,
  mine,
  day: asked,
}: {
  snapshot: FootballSnapshot;
  drafted: ReadableSquads | null;
  mine: string | null;
  day: string | undefined;
}) {
  const period = drafted?.roundPeriod ?? null;
  const sheets = roundCodes(snapshot.gameweek, snapshot.players);
  const [goals, streams, stats, kinds, codes, moments, league, men, info, round] = await Promise.all([
    sheets.then((codes) => roundGoals(snapshot.gameweek, snapshot.players, codes)),
    roundStreams(snapshot.gameweek),
    roundFigures(snapshot.gameweek),
    roundAssistKinds(snapshot.gameweek),
    sheets,
    roundMoments(snapshot.gameweek, snapshot.players),
    drafted === null ? Promise.resolve<Marks>({}) : marksFor(drafted, snapshot.fixtures),
    // No draft or a silent league costs the drafted men's counts and nothing else.
    period === null ? [] : periodMen(period),
    leagueInfo(),
    withRoundState(fixturesInOrder(snapshot), snapshot.gameweek),
  ]);

  // Fantrax id → FPL code off the rosters already held: the bridge's join, never a name.
  const codeOf = new Map(
    (drafted?.period.teams ?? []).flatMap((team) => team.players.filter(isResolved).map((man) => [man.slot.fantraxId, man.player.code] as const)),
  );
  const tallies: PrinterTally[] = men.flatMap((man) => {
    const code = codeOf.get(man.fantraxId);
    return code === undefined ? [] : [{ code, categories: man.categories }];
  });
  const owners = league.owners ?? new Map();
  const lines = vidiprinter({
    now: now().getTime(),
    goals: creditAssists(goals, snapshot, stats, streams, kinds, codes),
    moments,
    fixtures: round,
    players: snapshot.players,
    drafted: new Set(owners.keys()),
    tallies,
    names: info?.scoringCategories,
  });

  const day = dayStep(matchDays(round), londonDay(now()), asked, VIDIPRINTER_HREF);
  const shown = new Set((day === null ? round : round.filter((f) => onLondonDay(f.kickoff, day.day))).map((f) => f.code));
  return (
    <Vidiprinter
      lines={lines.filter((line) => shown.has(line.fixtureCode))}
      day={day}
      fixtures={round}
      clubs={clubById(snapshot)}
      players={snapshot.players}
      owners={owners}
      mine={mine}
    />
  );
}
