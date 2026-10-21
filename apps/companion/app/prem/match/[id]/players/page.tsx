import { Suspense } from "react";
import Squads from "../Squads";
import Skeleton from "../../../../components/shell/Skeleton";
import TabStrip from "../../../../components/shell/TabStrip";
import MatchShell from "../Shell";
import MatchPitch from "../MatchPitch";
import TeamSheet from "../TeamSheet";
import { matchOwners, readMatch } from "../match";
import { leagueOpinions } from "../../../leagueOpinions";
import { matchCards, squadsOf } from "../matchCards";
import { sheetReads } from "../sheetReads";
import { matchHref } from "../matchRoutes";
import type { Match } from "../match";
import { matchTitle } from "../title";

// Both elevens and what the afternoon was worth — CM's team sheet (`cm9900/16.jpg`), or the pitch.
// The figure is FPL's per-fixture points: Fantrax gives a period total, and for few of these men.

export const revalidate = 30;

type View = "sheet" | "pitch";
/** Which club a phone shows; a desk shows both. */
type Side = "home" | "away";

export const generateMetadata = matchTitle("players");

export default async function MatchPlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; side?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view: View = query.view === "pitch" ? "pitch" : "sheet";
  const side: Side = query.side === "away" ? "away" : "home";
  const match = await readMatch(id);
  const played = match.sheet !== null && match.sheet.lines.length > 0;

  return (
    <MatchShell
      match={match}
      current="players"
      foot={
        <>
          <ClubSwitch match={match} side={side} view={played ? view : "sheet"} />
          {played ? <Views id={match.fixture.id} side={side} view={view} className="max-lg:hidden" /> : null}
        </>
      }
    >
      {played ? <Views id={match.fixture.id} side={side} view={view} className="flex lg:hidden [&>nav]:flex-1" compact /> : null}
      <Suspense fallback={<BoardWaiting />}>
        {played ? <Board match={match} view={view} side={side} /> : <BothSquads match={match} side={side} />}
      </Suspense>
    </MatchShell>
  );
}

function lineupsHref(id: number, side: Side, view: View): string {
  return matchHref(id, "players", {
    side: side === "away" ? "away" : undefined,
    view: view === "pitch" ? "pitch" : undefined,
  });
}

/** The same elevens as a list or on the grass: CM's foot row (`cm0102/02.jpg`) on a desk, the top row under a thumb. */
function Views({
  id,
  side,
  view,
  className = "",
  compact = false,
}: {
  id: number;
  side: Side;
  view: View;
  className?: string;
  compact?: boolean;
}) {
  return (
    // The 36px compact strip under a thumb: PRODUCT's match-screen switch exception.
    <div className={className}>
      <TabStrip
        label="Line-up views"
        tabs={[
          { key: "sheet", label: "Team Sheet", href: lineupsHref(id, side, "sheet") },
          { key: "pitch", label: "Pitch", href: lineupsHref(id, side, "pitch") },
        ]}
        current={view}
        labels="word"
        compact={compact}
      />
    </div>
  );
}

/** Under a thumb, one club at a time, picked from the foot (the 24 Sep rule); a desk shows both. */
function ClubSwitch({ match, side, view }: { match: Match; side: Side; view: View }) {
  const id = match.fixture.id;
  return (
    <div className="lg:hidden">
      <TabStrip
        label="Club"
        tabs={[
          { key: "home", label: match.home?.shortName ?? "Home", href: lineupsHref(id, "home", view) },
          { key: "away", label: match.away?.shortName ?? "Away", href: lineupsHref(id, "away", view) },
        ]}
        current={side}
        labels="word"
      />
    </div>
  );
}

/** Both clubs' books, for a match nobody has named a side for. */
async function BothSquads({ match, side }: { match: Match; side: Side }) {
  const [owners, league] = await Promise.all([matchOwners(match.fixture), leagueOpinions()]);
  return (
    <Squads
      home={match.home}
      away={match.away}
      players={match.snapshot.players}
      owners={owners}
      league={league}
      cards={matchCards(match, squadsOf(match), league)}
      phoneSide={side}
    />
  );
}

async function Board({ match, view, side }: { match: Match; view: View; side: Side }) {
  const [owners, { sheets, events, injured, league, cards }] = await Promise.all([matchOwners(match.fixture), sheetReads(match)]);

  // Their sheet is the only source of a bench; without it, both squads is the honest fallback.
  if (sheets === null) return <BothSquads match={match} side={side} />;
  if (view === "pitch")
    return (
      <MatchPitch
        match={match}
        sheets={sheets}
        events={events}
        cards={cards}
        phoneSide={side}
      />
    );
  return (
    <TeamSheet
      match={match}
      sheets={sheets}
      events={events}
      owners={owners}
      injured={injured}
      league={league}
      cards={cards}
      phoneSide={side}
    />
  );
}

function BoardWaiting() {
  return (
    <div aria-busy className="grid grid-cols-2 gap-2">
      {Array.from({ length: 2 }, (_, side) => (
        <div key={side} className="flex flex-col gap-1">
          {Array.from({ length: 8 }, (_, at) => (
            <Skeleton key={at} width="100%" height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
