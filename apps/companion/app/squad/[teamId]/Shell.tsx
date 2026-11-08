import { teamFullName, teamPlate } from "@epl/core";
import { teamColours } from "@/app/teamColours";
import PlateShell from "../../components/shell/PlateShell";
import { leagueInfo } from "../../round";
import { OWN, teamBack, teamHref } from "../routes";
import TeamTabs from "./TeamTabs";
import type { TeamTab } from "./TeamTabs";
import WaiverBanner from "../../league/waivers/WaiverBanner";
import FootBar from "../../components/shell/FootBar";

/** A team as a foot bar step: his squad, under his short name. */
function step(team: { teamId: string; teamName: string } | null): { href: string; label: string } | null {
  return team === null ? null : { href: teamHref(team.teamId), label: team.teamName };
}

// The frame of a team's five screens, empty states included: a club's plated bar (`cm9900/25.jpg`), not a
// competition's, in the manager's own colour, and his tabs.

export default async function TeamShell({
  team,
  current,
  empty,
  neighbours,
  children,
}: {
  /** The teams either side in the table, for CM's foot bar on the desk; absent draws none. */
  neighbours?: { above: { teamId: string; teamName: string } | null; below: { teamId: string; teamName: string } | null };
  /** Whose screens: the slug builds the tabs, the id finds his colour and full name, the name is the fallback. */
  team: { teamId: string; teamName: string; slug: string };
  current: TeamTab;
  empty?: readonly TeamTab[];
  children: React.ReactNode;
}) {
  // The bar prints Fantrax's name in full; `team.teamName` is the short one every list uses.
  const full = teamFullName((await leagueInfo())?.teams ?? [], team.teamId) ?? team.teamName;
  const colours = teamColours(team.teamId);
  // A near-black team on its second colour, and the league's spine (`teamPlate`).
  const { spine, ...plate } = teamPlate(colours);
  return (
    <PlateShell colours={colours} plate={plate} ownSpine={spine === "own"} title={full}
      back={teamBack(team.slug)}
      phoneBar={team.slug !== OWN}
      tabs={<TeamTabs slug={team.slug} current={current} empty={empty} />}>
      {/* His own Transfers only: a rival's is not where he claims, and over his pitch it would push the bench off the screen. */}
      {team.slug === OWN && current === "transfers" ? <WaiverBanner /> : null}
      {children}
      {neighbours === undefined ? null : (
        <FootBar previous={step(neighbours.above)} next={step(neighbours.below)} />
      )}
    </PlateShell>
  );
}
