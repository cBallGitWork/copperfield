import { PLANNER_RUN, plannerGameweeks, plannerRows, strengthTable, type PlannerView } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import TabStrip from "../../components/shell/TabStrip";
import { FootFrame } from "../../components/shell/FootFrame";
import PlannerBoard from "./PlannerBoard";
import StrengthRanks from "./StrengthRanks";
import { footballNow, seasonFixtures } from "../../football";
import { planningRound } from "../../round";
import { intelStrength } from "../../intel";
import { PLANNER } from "../routes";
import { SECTION_BAR } from "@/app/desk";
import { scoutTitle } from "../title";

// The fixture planner: whose next six are kind for a club's attackers (their opponents' defences) and for its
// defenders (their opponents' attacks), and the rankings behind both. One view at a time (Craig, 24 Sep 2026).

export const revalidate = 30;

type View = PlannerView | "rankings";

/** Each rankings table by what it is for: 1 the easiest, as on the Attack and Defence boards. */
const RANKING_TITLE = { defence: "Defences, easiest to attack first", attack: "Attacks, easiest to defend first" } as const;

const VIEWS: readonly { key: View; label: string }[] = [
  { key: "attack", label: "Attack" },
  { key: "defence", label: "Defence" },
  { key: "rankings", label: "Rankings" },
];

export const metadata = scoutTitle("planner");

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = (await searchParams).view;
  const view: View = VIEWS.find((entry) => entry.key === asked)?.key ?? "attack";
  const [fixtures, snapshot, planning] = await Promise.all([seasonFixtures(), footballNow(), planningRound()]);
  // From the Team tab's week: once a gameweek's lineups lock, its fixtures are past planning.
  const gameweeks = plannerGameweeks(fixtures, PLANNER_RUN, planning?.gameweek ?? null);

  if (intelStrength.size === 0 || gameweeks.length === 0) {
    return (
      <ScoutShell current="planner">
        <Nothing title={gameweeks.length === 0 ? "No fixtures left" : "No strength ratings yet"} />
      </ScoutShell>
    );
  }

  const clubs = new Map(snapshot.clubs.map((club) => [club.code, club]));

  // Its views are sub-views of Data's Planner, so they switch from the foot (M-CONSIST-1, 20 Oct 2026).
  const views = (
    <TabStrip
      label="Planner views"
      tabs={VIEWS.map((entry) => ({ ...entry, href: `${PLANNER}?view=${entry.key}` }))}
      current={view}
      labels="word"
    />
  );

  return (
    <FootFrame foot={views}>
      <ScoutShell current="planner">
        {view === "rankings" ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {(["defence", "attack"] as const).map((measure) => (
              <section key={measure} className="flex min-w-0 flex-col gap-2">
                <p className={SECTION_BAR}>{RANKING_TITLE[measure]}</p>
                <StrengthRanks table={strengthTable(intelStrength, measure)} clubs={clubs} />
              </section>
            ))}
          </div>
        ) : (
          <PlannerBoard
            view={view}
            rows={plannerRows(fixtures, snapshot.clubs, intelStrength, view, gameweeks)}
            gameweeks={gameweeks}
          />
        )}
      </ScoutShell>
    </FootFrame>
  );
}
