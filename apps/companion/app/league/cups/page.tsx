import { CUPS, cupGroups, cupPlan } from "@epl/core";
import LeagueShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import FantraxSilent from "../../components/shell/FantraxSilent";
import { getSchedule } from "../schedule/schedule";
import { cupHref } from "../SectionNav";
import Bracket from "./Bracket";
import Groups from "./Groups";
import TabStrip from "../../components/shell/TabStrip";
import { LEAGUE_CAPTION, titled } from "../../titles";

// Each cup's draw; its fixtures are on the schedule. Every side is a placeholder until the draws are made.

export const revalidate = 30;

export const metadata = titled(LEAGUE_CAPTION.cups);

export default async function CupsPage({
  searchParams,
}: {
  searchParams: Promise<{ cup?: string }>;
}) {
  const asked = await searchParams;
  const cup = CUPS.find((declared) => declared.id === asked.cup) ?? CUPS[0];
  if (cup === undefined) return null;

  const read = await getSchedule();
  if ("unavailable" in read) {
    return (
      <LeagueShell current="cups">
        <FantraxSilent code={read.unavailable} />
      </LeagueShell>
    );
  }

  const teams = read.info.teams.length;
  const stages = cupPlan(cup, teams);

  return (
    <LeagueShell current="cups" teams={teams}>
      <TabStrip
        label="Cups"
        tabs={CUPS.map((each) => ({ key: each.id, label: each.name, href: cupHref(each.id) }))}
        current={cup.id}
      />

      {stages.length === 0 ? (
        <Nothing title="No draw yet" code={`${teams} teams`} />
      ) : (
        <div className="flex flex-col gap-4">
          {cup.seeding.from === "groups" ? (
            <Groups groups={cupGroups(cup, teams)} stage={cup.seeding.stage} />
          ) : null}
          <Bracket
            title={cup.knockout.elimination === "double" ? "Winners' side" : "Knockout"}
            stages={stages.filter((stage) => stage.side === "winners")}
          />
          <Bracket title="Losers' side" stages={stages.filter((stage) => stage.side === "losers")} />
        </div>
      )}
    </LeagueShell>
  );
}
