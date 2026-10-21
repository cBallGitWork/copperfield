import ViewStrip from "./ViewStrip";
import { ANALYSIS, PLANNER, POOL, STATS, TEAMS } from "./routes";

// The Data section's own views (Craig, 24 Sep 2026: Players and Compare, with more to come; 16 Oct 2026: Adv Stats
// second, Teams called Clubs), each page passing its own. The keys are the URL's business and outlive the labels:
// `analysis` is Compare's route and `teams` is Clubs'.

export const SCOUT_VIEWS = [
  { href: POOL, label: "Players", key: "pool" },
  { href: STATS, label: "Adv Stats", key: "stats" },
  { href: ANALYSIS, label: "Compare", key: "analysis" },
  { href: TEAMS, label: "Clubs", key: "teams" },
  { href: PLANNER, label: "Planner", key: "planner" },
] as const;

export type ScoutView = (typeof SCOUT_VIEWS)[number]["key"];

export default function PoolNav({ current }: { current: ScoutView }) {
  return <ViewStrip tabs={SCOUT_VIEWS} current={current} />;
}
