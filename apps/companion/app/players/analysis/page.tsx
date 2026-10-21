import ScoutShell from "../Shell";
import CompareBody from "./CompareBody";
import { DATA_COMPARE } from "./compareRoute";
import type { Asked } from "./compareSides";
import { scoutTitle } from "../title";

// Data's Compare: either side picked, both men in the query. A player's own tab draws the same body with him fixed.

export const revalidate = 30;

export const metadata = scoutTitle("analysis");

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Asked>;
}) {
  return (
    <ScoutShell current="analysis">
      <CompareBody asked={await searchParams} route={DATA_COMPARE} />
    </ScoutShell>
  );
}
