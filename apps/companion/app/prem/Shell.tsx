import { COMPETITION_NAME } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import PremNav from "./PremNav";
import type { PremSection } from "./PremNav";
import { PREM_CAPTION } from "../titles";

// The frame every Premiership screen wears, on the competition's cream plate (`cm9900/24.jpg`).

/** The panel's floor in rows unless a view passes its own: twenty, because the division is twenty clubs. */
export const PANEL_ROWS = 20;

export default function PremShell({
  current,
  rows,
  children,
}: {
  current: PremSection;
  /** The view's own rows, which win: a gameweek of ten matches in a twenty-club panel scrolled into empty ground. */
  rows?: number;
  children: React.ReactNode;
}) {
  return (
    <SectionShell
      header={<PageHeader title={COMPETITION_NAME} competition />}
      nav={<PremNav current={current} />}
      caption={PREM_CAPTION[current]}
      rows={rows ?? PANEL_ROWS}
    >
      {children}
    </SectionShell>
  );
}
