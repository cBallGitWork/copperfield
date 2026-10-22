import { redirect } from "next/navigation";
import SquadIndex from "./SquadIndex";
import SectionNav from "../league/SectionNav";
import { teamPick } from "./routes";
import { MORE } from "../components/shell/sections";
import { SQUADS, titled } from "../titles";

// Every squad, and the sign-in: reached from More, so its back plate goes there, and on the desk from League's strip,
// which it wears there with Squads lit. A `?team=` goes to that squad.

export const revalidate = 30;

export const metadata = titled(SQUADS);

export default async function SquadsPage({
  searchParams,
}: {
  /** A squad's team picker submits here: `team` and the week it was showing. */
  searchParams: Promise<{ team?: string; gw?: string }>;
}) {
  const { team, gw } = await searchParams;
  const pick = teamPick(team, gw);
  if (pick !== null) redirect(pick);
  return (
    <SquadIndex
      back={MORE}
      nav={
        <div className="max-lg:hidden">
          <SectionNav current="squads" />
        </div>
      }
    />
  );
}
