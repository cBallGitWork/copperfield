import { Suspense } from "react";
import { keyMoments, worthReading } from "@epl/core";
import SkeletonRows from "../../../components/shell/SkeletonRows";
import TabStrip from "../../../components/shell/TabStrip";
import { PANEL_FLUSH, SECTION_BAR } from "@/app/desk";
import Line from "./Commentary";
import type { Match } from "./match";
import { matchHref } from "./matchRoutes";
import { matchReport } from "../../../matchFeed";
import { matchPlayerNames } from "../../../matchDetail";

// The Overview's account of the match under the goals — its own boundary, so the scorers never wait on the stream.

/** A phone's two readings of the report: the key moments, which open it, or every line bar the fouls. */
export type ReportView = "key" | "full";

export function reportView(value: string | undefined): ReportView {
  return value === "full" ? "full" : "key";
}

export default function MatchReport({ match, view }: { match: Match; view: ReportView }) {
  return (
    <Suspense fallback={<ReportWaiting />}>
      <Report match={match} view={view} />
    </Suspense>
  );
}

/** What happened, in Opta's own sentences with the fouls taken out — the page's length, so there is one scroll
 *  and not two (Craig, 23 Sep 2026). A phone opens on the key moments (23 of 63 rows on a 3-1); the desk shows all. */
async function Report({ match, view }: { match: Match; view: ReportView }) {
  const { gameweek, code } = match.fixture;
  const [whole, names] = await Promise.all([
    matchReport(gameweek, code),
    // The same men the Report tab marks, so a name is white on both screens.
    matchPlayerNames(gameweek, code),
  ]);
  // Asked of the whole feed: a match with commentary still has a report.
  if (whole.length === 0) return null;
  const lines = worthReading(whole);
  const key = new Set(keyMoments(lines).map((line) => line.id));
  // A feed with no key moment at all shows its every line rather than an empty list.
  const trimmed = view === "key" && key.size > 0;

  return (
    <section className={PANEL_FLUSH}>
      {/* The plates name the section on a phone, so the bar is the desk's. */}
      <h2 className={`${SECTION_BAR} max-lg:hidden`}>Match Report</h2>
      <div className="lg:hidden">
        <TabStrip
          label="Match report views"
          tabs={[
            { key: "key", label: "Key moments", href: matchHref(match.fixture.id, "overview") },
            { key: "full", label: "Full commentary", href: matchHref(match.fixture.id, "overview", { report: "full" }) },
          ]}
          current={view}
        />
      </div>
      <ol className="cm-rows">
        {lines.map((line) => (
          <Line key={line.id} line={line} names={names} deskOnly={trimmed && !key.has(line.id)} />
        ))}
      </ol>
    </section>
  );
}

function ReportWaiting() {
  return <SkeletonRows count={6} height="2.75rem" />;
}
