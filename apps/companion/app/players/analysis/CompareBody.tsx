import { Suspense, type ReactNode } from "react";
import { fixtureGameweeks, gameweekSpan, lastPlayed } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import TabStrip from "../../components/shell/TabStrip";
import { FootFrame } from "../../components/shell/FootFrame";
import CompareBar from "./CompareBar";
import CompareExits from "./CompareExits";
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
import { rivalIn } from "./rival";
import { lastSeason, pickedSeason } from "./season";
import { openingsOf, routeHref, type CompareRoute } from "./compareRoute";
import { askedSides, found, refusal, rivalNamed, type Asked } from "./compareSides";
import { windowWords } from "./window";
import { Chip } from "../BoardControls";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { groupOf } from "../[fantraxId]/grid";
import { subject } from "../[fantraxId]/subject";
import { getLeaguePool } from "../pool";
import { getPlayerStats } from "../playerStats";
import { lastValue, seasonValue } from "../routes";
import { seasonFixtures } from "../../football";
import { PANEL } from "@/app/desk";

// Two players side by side (Craig, 6 Sep 2026), on Data's page or a player's own tab with him fixed as A (Craig,
// 21 Oct 2026). Two profile reads a view and never more; the search boxes read the cached pool, so a keystroke is
// never a Fantrax call. Either side may be a completed season: then the ledger keeps to what both seasons carry.

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

export default async function CompareBody({
  asked,
  route,
  shell,
}: {
  asked: Asked;
  route: CompareRoute;
  /** The page's own frame (Data's strip or his plated bar), inside the foot frame that docks the views. */
  shell: (body: ReactNode) => ReactNode;
}) {
  const [pool, fixtures, lines] = await Promise.all([getLeaguePool(), seasonFixtures(), getPlayerStats()]);
  const rows = "unavailable" in pool ? [] : pool.rows;
  const rival = route.fixed === undefined ? undefined : rivalIn(pool, route.fixed, groupOf);
  const { a, b, qa, qb, ...seasons } = knownSides(pool, await askedSides(asked, route, rival));

  // Both men are read before anything draws: the boxes are named after whoever is chosen.
  const [left, right] = await Promise.all([
    a === undefined ? null : subject(a),
    b === undefined ? null : subject(b),
  ]);
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
  // On his own Compare a B of nobody is him again, so the opening B is not set a second time.
  const emptyB = route.fixed === undefined ? undefined : a;
  const query = {
    a,
    b: b ?? emptyB,
    as: seasonA === null ? undefined : seasonValue(seasonA.season),
    bs: seasonB === null ? undefined : seasonValue(seasonB.season),
    view: view === "figures" ? undefined : view,
  };

  const names = { a: sideName(one_, seasonA, past), b: sideName(two, seasonB, past) };
  const last = lastSeason(careerA, seasonA?.season ?? null);
  const openings =
    a === undefined
      ? []
      : openingsOf(
          route,
          { a, as: query.as, b, bs: query.bs, view: query.view },
          last === null ? undefined : seasonValue(last.season),
          rivalNamed(pool, rival),
        );

  const picker = (
    <>
      <PickBar
        rows={rows}
        a={{ chosen: a, typed: qa, name: names.a, season: query.as }}
        b={{ chosen: query.b, typed: qb, name: names.b, season: query.bs }}
        route={route}
      />
      <SeasonBar
        query={query}
        a={offerOf(one_, shirtOf(one_), careerA)}
        b={offerOf(two, shirtOf(two), careerB)}
        openings={openings}
        route={route}
      />
    </>
  );

  // A profile that refused is not a man not yet chosen, and the screen says which.
  const refused = refusal(left) ?? refusal(right);
  if (refused !== null) {
    return shell(
      <>
        {picker}
        <FantraxSilent code={refused} />
      </>,
    );
  }

  if (one_ === null || names.a === null) {
    return shell(
      <>
        {picker}
        <Nothing title="Pick one or two players" />
      </>,
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
  // As the board reads him: the pool row and the counts that say whether he has played.
  const scored = (id: string | undefined): Scored => ({
    row: rows.find((row) => row.entry.player.fantraxId === id),
    stats: lines.find((line) => line.fantraxId === id)?.stats,
  });

  const href = (changes: { view?: View; range?: string }) => {
    const nextView = changes.view ?? view;
    return routeHref(route, {
      ...query,
      b: solo ? emptyB : b,
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

  // One category at a time at every width (Craig, 24 Sep 2026: "desktop like mobile"), switched from the foot (DESIGN §2).
  const views = (
    <TabStrip
      label="Compare views"
      tabs={shown.map((entry) => ({ ...entry, href: href({ view: entry.key }) }))}
      current={view}
      dim={dim}
      labels="word"
    />
  );

  return (
    <FootFrame foot={views}>
      {shell(
    <>
      {picker}

      <CompareBar
        a={{ name: names.a, club: first.club, code: one_.football?.player.code ?? null }}
        b={
          second === null || two === null
            ? null
            : { name: second.name, club: second.club, code: two.football?.player.code ?? null }
        }
      />

      {/* Nothing prints on the bare photograph (DESIGN §1, review D0); the attributes bring their own panel, and
          `empty:hidden` drops this one when it holds nothing. */}
      <section className={`${PANEL} empty:hidden`}>
        {/* No league points beside a past ledger's goals, assists and clean sheets, which are FPL's counts (DESIGN §7). */}
        {past ? null : (
          <Points
            a={scored(a)}
            b={solo ? null : scored(b)}
            names={{ a: names.a, b: solo ? null : names.b }}
            season={"unavailable" in pool ? null : pool.season}
          />
        )}

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
      </section>

      {/* Streamed: each grid is a percentile over every man of his role. */}
      {view === "attributes" ? (
        <Suspense fallback={<StackWaiting />}>
          <Grids left={one_} right={second === null ? null : two} names={{ a: names.a, b: second === null ? null : names.b }} />
        </Suspense>
      ) : null}

      <CompareExits
        men={[{ id: a, name: shirtOf(one_) }, ...(second === null || b === a ? [] : [{ id: b, name: shirtOf(two) }])]}
      />
    </>,
      )}
    </FootFrame>
  );
}
