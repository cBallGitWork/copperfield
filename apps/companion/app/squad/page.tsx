import { redirect } from "next/navigation";
import SquadIndex from "./SquadIndex";
import SignIn from "./SignIn";
import PageHeader from "../components/shell/PageHeader";
import { signedIn } from "../session";
import SectionNav from "../league/SectionNav";
import { teamPick } from "./routes";
import { MORE } from "../components/shell/sections";
import { returnTo } from "../playersGate";
import { SQUADS, titled } from "../titles";

// Every squad, and the sign-in: reached from More, so its back plate goes there, and on the desk from League's strip,
// which it wears there with Squads lit. A `?team=` goes to that squad. A signed-out reader the player gate sent here
// (`?next=`) gets the code box alone: crawlers followed the gate here and paid a Fantrax read each (17 Nov 2026).

export const revalidate = 30;

export const metadata = titled(SQUADS);

export default async function SquadsPage({
  searchParams,
}: {
  /** A squad's team picker submits here: `team` and the week it was showing. */
  searchParams: Promise<{ team?: string; gw?: string; next?: string }>;
}) {
  const { team, gw, next } = await searchParams;
  const pick = teamPick(team, gw);
  if (pick !== null) redirect(pick);
  const after = returnTo(next) ?? undefined;
  if (after !== undefined && !(await signedIn())) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title={SQUADS} back={MORE} />
        <SignIn next={after} />
      </div>
    );
  }
  return (
    <SquadIndex
      back={MORE}
      next={after}
      nav={
        <div className="max-lg:hidden">
          <SectionNav current="squads" />
        </div>
      }
    />
  );
}
