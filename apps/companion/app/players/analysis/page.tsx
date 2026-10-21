import { Suspense } from "react";
import {
  FANTRAX_LEAGUE_ID,
  FANTRAX_PLAYER_BASE,
  fixtureGameweeks,
  gameweekSpan,
  lastPlayed,
} from "@epl/core";
import type { PastSeason } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import TabStrip from "../../components/shell/TabStrip";
import OutLink from "../../components/shell/OutLink";
import CompareBar from "./CompareBar";
import CompareMap from "./CompareMap";
import Figures from "./Figures";
import Grids from "./Grids";
import PickBar from "./PickBar";
import PlayerMap from "./PlayerMap";
import Points from "./Points";
import SeasonBar from "./SeasonBar";
import type { Scored } from "./pointsLines";
import { careerOf, offerOf, shirtOf, sideName, sideOf } from "./pastSides";
import { knownSides } from "./pick";
import { lastSeason, pickedSeason } from "./season";
import { windowWords } from "./window";
import { Chip } from "../BoardControls";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { subject } from "../[fantraxId]/subject";
import { getLeaguePool } from "../pool";
import { getPlayerStats } from "../playerStats";
import { compareHref, lastValue, seasonValue } from "../routes";
import { seasonFixtures } from "../../football";
import { scoutTitle } from "../title";

// Two players side by side (Craig, 6 Sep 2026). Two profile reads a view and never more; the search boxes read the
// cached pool, so a keystroke is never a Fantrax call. The grids stream, each a percentile over every man of his role.
// Either side may be a completed season (Craig, 21 Oct 2026): then the ledger keeps to what both seasons carry.

export const revalidate = 30;

/** One block at a time, at every width (Craig, 24 Sep 2026). */
const VIEWS = [
  { key: "figures", label: "Figures" },
  { key: "shots", label: "Shots" },
  { key: "passes", label: "Key passes" },
  { key: "touches", label: "Touches" },
  { key: "attributes", label: "Attributes" },
] as const;
type View = (typeof VIEWS)[number]["key"];

/** What no completed season carries: no file holds key passes, and the attributes rank this season's division. */
const THIS_SEASON_ONLY: ReadonlySet<View> = new Set(["passes", "attributes"]);

/** "Last 6" is the last six gameweeks with a match played (Craig, 24 Sep 2026). */
const RECENT = 6;

export const metadata = scoutTitle("analysis");

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;

  const [pool, fixtures, lines] = await Promise.all([getLeaguePool(), seasonFixtures(), getPlayerStats()]);
  const { a, b, qa, qb, ...seasons } = knownSides(pool, {
    a: lastValue(asked.a),
    b: lastValue(asked.b),
    qa: lastValue(asked.qa) ?? "",
    qb: lastValue(asked.qb) ?? "",
    as: lastValue(asked.as),
    bs: lastValue(asked.bs),
  });
  const rows = "unavailable" in pool ? [] : pool.rows;

  // Both men are read before anything draws: the boxes are named after whoever is chosen.
  const [left, right] = await Promise.all([
    a === undefined ? null : subject(a),
    b === undefined ? null : subject(b),
  ]);

  const found = (side: Awaited<ReturnType<typeof subject>> | null) =>
    side !== null && !("unavailable" in side) ? side : null;
  const one_ = found(left);
  const two = found(right);

  // His completed seasons, for the selects and the side a URL names; a season he never played is this one.
  const [careerA, careerB] = await Promise.all([careerOf(one_), careerOf(two)]);
  const seasonA = pickedSeason(seasons.as, careerA);
  const seasonB = pickedSeason(seasons.bs, careerB);
  const past = seasonA !== null || seasonB !== null;
  const shown = VIEWS.filter((entry) => !past || !THIS_SEASON_ONLY.has(entry.key));
  const view: View = shown.find((entry) => entry.key === lastValue(asked.view))?.key ?? "figures";
  const recent = !past && lastValue(asked.range) === String(RECENT);
  const query = {
    a,
    b,
    as: seasonA === null ? undefined : seasonValue(seasonA.season),
    bs: seasonB === null ? undefined : seasonValue(seasonB.season),
    view: view === "figures" ? undefined : view,
  };

  const names = { a: sideName(one_, seasonA, past), b: sideName(two, seasonB, past) };
  // "vs his last season" while B is empty or A over again.
  const self = b === undefined || (b === a && seasonA === seasonB) ? lastSeason(careerA, seasonA?.season ?? null) : null;

  const picker = (
    <>
      <PickBar
        rows={rows}
        a={{ chosen: a, typed: qa, name: names.a, season: query.as }}
        b={{ chosen: b, typed: qb, name: names.b, season: query.bs }}
      />
      <SeasonBar
        query={query}
        a={offerOf(one_, shirtOf(one_), careerA)}
        b={offerOf(two, shirtOf(two), careerB)}
        self={self}
      />
    </>
  );

  // A profile that refused is not a man not yet chosen, and the screen says which.
  const refused = refusal(left) ?? refusal(right);
  if (refused !== null) {
    return (
      <ScoutShell current="analysis">
        {picker}
        <FantraxSilent code={refused} />
      </ScoutShell>
    );
  }

  if (one_ === null || names.a === null) {
    return (
      <ScoutShell current="analysis">
        {picker}
        <Nothing title="Pick one or two players" />
      </ScoutShell>
    );
  }

  const solo = two === null || names.b === null;
  const played = lastPlayed(fixtures, Number.POSITIVE_INFINITY);
  const window = recent ? lastPlayed(fixtures, RECENT) : played;
  const span = gameweekSpan(window) || "no gameweeks yet";
  const told = past ? "in the seasons named" : windowWords(recent, window);
  const gameweekOf = fixtureGameweeks(fixtures);
  const inWindow = new Set(window);

  const men = await Promise.all(
    [
      { side: one_, name: names.a, season: seasonA },
      ...(solo || two === null || names.b === null ? [] : [{ side: two, name: names.b, season: seasonB }]),
    ].map(({ side, name, season }) => sideOf(side, name, season, { recent, inWindow, gameweekOf })),
  );
  const [first, second] = [men[0], men[1] ?? null];
  // As the board reads him: the pool row and the counts that say whether he has played. A past season has no points.
  const scored = (id: string | undefined, season: PastSeason | null): Scored =>
    season !== null
      ? { row: undefined, stats: undefined }
      : { row: rows.find((row) => row.entry.player.fantraxId === id), stats: lines.find((line) => line.fantraxId === id)?.stats };

  const href = (changes: { view?: View; range?: string }) => {
    const nextView = changes.view ?? view;
    return compareHref({
      ...query,
      b: solo ? undefined : b,
      view: nextView === "figures" ? undefined : nextView,
      range: "range" in changes ? changes.range : recent ? String(RECENT) : undefined,
    });
  };
  const has = {
    shots: men.some((each) => (each.shots?.length ?? 0) > 0),
    passes: men.some((each) => each.keyPasses.length > 0),
    touches: men.some((each) => each.heat !== null),
  };
  const dim = shown.filter((entry) => entry.key in has && !has[entry.key as keyof typeof has]).map((entry) => entry.key);

  return (
    <ScoutShell current="analysis">
      {picker}

      <CompareBar
        a={{ name: names.a, club: first.club, code: one_.football?.player.code ?? null }}
        b={
          second === null || two === null
            ? null
            : { name: second.name, club: second.club, code: two.football?.player.code ?? null }
        }
      />

      <Points
        a={scored(a, seasonA)}
        b={solo ? null : scored(b, seasonB)}
        names={{ a: names.a, b: solo ? null : names.b }}
        season={"unavailable" in pool ? null : pool.season}
      />

      {/* One category at a time at every width (Craig, 24 Sep 2026: "desktop like mobile"). */}
      <TabStrip
        label="Compare views"
        tabs={shown.map((entry) => ({ ...entry, href: href({ view: entry.key }) }))}
        current={view}
        dim={dim}
        labels="word"
      />

      {/* The range governs the figures and every map; the attributes are a season's percentiles, and a past season
          is the whole of it. */}
      {view === "attributes" || past ? null : (
        <div className="flex items-center gap-1.5">
          <Chip on={!recent} href={href({ range: undefined })}>
            Season
          </Chip>
          <Chip on={recent} href={href({ range: String(RECENT) })}>
            Last {RECENT}
          </Chip>
          <span className="numeric px-1.5 text-sm text-muted">{span}</span>
        </div>
      )}

      {view === "figures" ? (
        <Figures
          a={first.played}
          b={second?.played ?? null}
          names={{ a: names.a, b: second === null ? null : names.b }}
          window={told}
          past={past}
        />
      ) : null}

      {view === "shots" || view === "passes" ? (
        <CompareMap
          men={men.map((each) => ({
            name: each.name,
            club: each.club,
            shots: view === "shots" ? each.shots : each.keyPasses,
          }))}
          passes={view === "passes"}
          window={told}
          className="mx-auto w-full lg:max-w-3xl"
        />
      ) : null}

      {view === "touches" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {men.map((each, index) => (
            <PlayerMap
              key={index}
              id={index === 0 ? "a" : "b"}
              name={each.name}
              club={each.club}
              touches={each.heat ?? []}
              matches={each.matches}
            />
          ))}
        </div>
      ) : null}

      {/* Streamed: each grid is a percentile over every man of his role. */}
      {view === "attributes" ? (
        <Suspense fallback={<StackWaiting />}>
          <Grids left={one_} right={second === null ? null : two} names={{ a: names.a, b: second === null ? null : names.b }} />
        </Suspense>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {/* One way out per man: a man set against his own past is one Fantrax page. */}
        {[
          { id: a, name: shirtOf(one_) },
          ...(second === null || b === a ? [] : [{ id: b, name: shirtOf(two) }]),
        ].map((each) => (
          <OutLink key={each.id} href={`${FANTRAX_PLAYER_BASE}/${each.id}/${FANTRAX_LEAGUE_ID}`}>
            {each.name} on Fantrax
          </OutLink>
        ))}
      </div>
    </ScoutShell>
  );
}

/** The tell from a side that refused, or null. */
function refusal(side: Awaited<ReturnType<typeof subject>> | null): string | null {
  return side !== null && "unavailable" in side ? side.unavailable : null;
}
