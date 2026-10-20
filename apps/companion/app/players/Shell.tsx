import SectionShell from "../components/shell/SectionShell";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { SCOUT } from "../titles";

// The frame Data's screens wear: no bar and no yellow caption (Craig, 24 Sep 2026: "remove the yellow rows");
// the strip names the view and the rail's lit Data plate the section, as Mail (20 Oct 2026).

/** The pool's panel height in rows, held while its board loads; every other Data view sizes to its content. */
export const POOL_ROWS = 14;

export default function ScoutShell({
  current = "pool",
  rows = 0,
  children,
}: {
  current?: ScoutView;
  rows?: number;
  children: React.ReactNode;
}) {
  return (
    <SectionShell
      header={<h1 className="sr-only">{SCOUT}</h1>}
      nav={<PoolNav current={current} />}
      rows={rows}
    >
      {children}
    </SectionShell>
  );
}
