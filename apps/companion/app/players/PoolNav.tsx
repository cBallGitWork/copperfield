import TabStrip from "../components/shell/TabStrip";
import { ANALYSIS, PLANNER, POOL, PROJECTIONS, PROJECTIONS_SHOWN, STATS, TEAMS } from "./routes";

// The Data section's own views (Craig, 24 Sep 2026: Players and Compare, with more to come; 16 Oct 2026: Adv Stats
// second, Teams called Clubs), each page passing its own. The keys are the URL's business and outlive the labels:
// `analysis` is Compare's route and `teams` is Clubs'.

export const SCOUT_VIEWS = [
  { href: POOL, label: "Players", key: "pool" },
  { href: STATS, label: "Adv Stats", key: "stats" },
  { href: ANALYSIS, label: "Compare", key: "analysis" },
  { href: TEAMS, label: "Clubs", key: "teams" },
  { href: PLANNER, label: "Planner", key: "planner" },
  { href: PROJECTIONS, label: "Projections", key: "projections" },
] as const;

export type ScoutView = (typeof SCOUT_VIEWS)[number]["key"];

const SHOWN = SCOUT_VIEWS.filter((view) => PROJECTIONS_SHOWN || view.key !== "projections");

export default function PoolNav({ current }: { current: ScoutView }) {
  return <TabStrip label="Data views" tabs={SHOWN} current={current} labels="word" />;
}
