import type { ReactNode } from "react";
import TabStrip, { type Tab } from "../../../components/shell/TabStrip";
import { shortName } from "../../../teamNames";
import { SQUAD } from "../../routes";

// The Match tab's two sides: a phone shows one, picked from the foot; the desk shows both, as the head-to-head does.

export type SideKey = "team" | "opponent";

/** Which side a phone opens on: the team whose screen this is, unless `?side=opponent` asks for the other. */
export function sideOf(raw: string | undefined): SideKey {
  return raw === "opponent" ? "opponent" : "team";
}

interface Named {
  teamId: string;
  name: string;
}

/** The foot's two plates; a double header's rivals share the second, as each tie draws its own. */
export function sideTabs(slug: string, team: Named, opponents: readonly Named[]): (Tab & { key: SideKey })[] {
  const href = `${SQUAD}/${slug}/next`;
  const [only] = opponents;
  return [
    { key: "team", label: shortName(team.teamId, team.name), href },
    {
      key: "opponent",
      label: opponents.length === 1 && only !== undefined ? shortName(only.teamId, only.name) : "Opponents",
      href: `${href}?side=opponent`,
    },
  ];
}

/** The control, under a thumb only. */
export function SideFoot({ open, tabs }: { open: SideKey; tabs: readonly (Tab & { key: SideKey })[] }) {
  return (
    <div className="lg:hidden">
      <TabStrip label="Sides" tabs={tabs} current={open} labels="word" />
    </div>
  );
}

/** One tie's two sides: the open one on a phone, both side by side on the desk. */
export function TieSides({ open, team, opponent }: { open: SideKey; team: ReactNode; opponent: ReactNode }) {
  return (
    <>
      <div className="lg:hidden">{open === "team" ? team : opponent}</div>
      <div className="hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-2">
        <div>{team}</div>
        <div>{opponent}</div>
      </div>
    </>
  );
}
