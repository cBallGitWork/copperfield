import { clubStats } from "@epl/core";
import ScoutShell from "../Shell";
import TeamBoard from "./TeamBoard";
import { TEAM_COLUMNS, TEAM_GROUPS, plateHref, sortedTeams, teamsView } from "./columns";
import { teamRows } from "./teamRows";
import { clubSeasons } from "./clubSeasons";
import { footballNow, seasonFixtures } from "../../football";
import { lastValue } from "../routes";
import { scoutTitle } from "../title";
import TabStrip from "../../components/shell/TabStrip";
import ColumnKey from "../ColumnKey";
import { PRESSABLE } from "../BoardControls";

// Data › Clubs: the twenty clubs' football, shots to cards (Craig, 30 Sep 2026: "this page should be more pure
// stats, chances created, shots etc, errors"). The Planner owns the fixtures.

export const revalidate = 30;

export const metadata = scoutTitle("teams");

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const view = teamsView({ group: lastValue(asked.group), sort: lastValue(asked.sort), dir: lastValue(asked.dir) });
  const { sort, descending } = view;

  const [seasons, fixtures, snapshot] = await Promise.all([clubSeasons(), seasonFixtures(), footballNow()]);
  const squads = new Map(clubStats(fixtures, snapshot.clubs, snapshot.players).map((club) => [club.clubId, club.squad]));
  const ordered = sortedTeams(teamRows(snapshot.clubs, seasons, squads), sort, descending);

  return (
    <ScoutShell current="teams">
      {/* Under a thumb one plate at a time, its key beside it (DESIGN §2); the desk holds every column. */}
      <div className="flex flex-wrap gap-1.5 lg:hidden">
        <div className="flex-1">
          <TabStrip
            label="Stat groups"
            tabs={TEAM_GROUPS.map((group) => ({ key: group.key, label: group.label, href: plateHref(group) }))}
            current={view.group.key}
            labels="word"
          />
        </div>
        <ColumnKey entries={view.columns.map((column) => ({ label: column.head, title: column.title }))} className={`${PRESSABLE} ml-auto min-w-11`} />
      </div>
      <div className="lg:hidden">
        <TeamBoard rows={ordered} columns={view.columns} grouped={false} sort={sort} descending={descending} />
      </div>
      <div className="max-lg:hidden">
        <TeamBoard rows={ordered} columns={TEAM_COLUMNS} grouped sort={sort} descending={descending} />
      </div>
    </ScoutShell>
  );
}
