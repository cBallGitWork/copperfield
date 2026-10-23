import { LEAGUE_NAME } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import SectionNav from "./SectionNav";
import type { LeagueSection } from "./SectionNav";
import { LEAGUE_CAPTION } from "../titles";
import WaiverBanner from "./waivers/WaiverBanner";

// The frame every league section wears, empty states included: without the bar and the tabs, a
// reader who lands here during a Fantrax outage has no way on to Fixtures.

/** The fewest rows a league panel opens at, so a page with little on it does not open short: a layout floor, not the
 *  league's size, which `teams` (from `getLeagueInfo`) passes and which wins when bigger. */
const PANEL_FLOOR = 10;

export default function LeagueShell({
  title,
  current,
  sub,
  teams,
  rows,
  flush,
  children,
}: {
  current: LeagueSection;
  title?: string;
  /** Follows the caption ("Head-to-head · Gameweek 7"), so the bar and the tabs sit where every League page has them. */
  sub?: React.ReactNode;
  teams?: number;
  /** The view's own rows, which win: five ties in a ten-team panel left a box with a hole in it. */
  rows?: number;
  /** A table alone in the panel, flush to its edge. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  const named = title ?? LEAGUE_CAPTION[current];
  return (
    <SectionShell
      // The competition's own name on its bar; the tabs under it name the page (`cm9900/24.jpg`).
      header={<PageHeader title={LEAGUE_NAME} competition />}
      // The waiver banner under the tabs; Waivers says it already.
      nav={<><SectionNav current={current} />{current === "transfers" ? <WaiverBanner /> : null}</>}
      caption={sub === undefined ? named : <>{named} · {sub}</>}
      captionOnPhone={current === "matchups"}
      rows={rows ?? Math.max(teams ?? 0, PANEL_FLOOR)}
      flush={flush}
    >
      {children}
    </SectionShell>
  );
}
