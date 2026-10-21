import { clubById, involves, runOrder, seasonRun } from "@epl/core";
import TabEmpty from "../../../../components/league/TabEmpty";
import { PANEL_ROWS } from "../../../Shell";
import ClubShell from "../Shell";
import Run from "../Run";
import { clubOr404 } from "../club";
import { intelCups } from "@/app/intel";
import { PANEL } from "@/app/desk";
import { clubTitle } from "../title";
import { now } from "@/app/clock";

// The club's season on one screen, league and cups: the next match first, then the rest to come, then the played, newest first.

// Must equal PAGE_REVALIDATE in config.ts: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const generateMetadata = clubTitle("fixtures");

export default async function ClubFixturesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { club, snapshot, fixtures } = await clubOr404(code);

  const run = seasonRun(
    fixtures.filter((fixture) => involves(fixture, club.id)),
    intelCups.get(club.code) ?? [],
  );

  return (
    <ClubShell
      club={club}
      current="fixtures"
      empty={run.length === 0 ? ["fixtures"] : []}
    >
      <section
        className={PANEL}
        style={{ minHeight: `calc(${PANEL_ROWS} * var(--table-row) + var(--table-chrome))` }}
      >
        {run.length === 0 ? (
          <TabEmpty>No fixtures.</TabEmpty>
        ) : (
          <Run
            order={runOrder(run, now().toISOString())}
            club={club}
            clubs={clubById(snapshot)}
            byCode={new Map(snapshot.clubs.map((entry) => [entry.code, entry]))}
          />
        )}
      </section>
    </ClubShell>
  );
}
