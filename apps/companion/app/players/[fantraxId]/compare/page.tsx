import CompareBody from "../../analysis/CompareBody";
import { playerCompare } from "../../analysis/compareRoute";
import type { Asked } from "../../analysis/compareSides";
import NoProfile from "../NoProfile";
import PlayerShell from "../PlayerShell";
import { subject } from "../subject";
import { playerTitle } from "../title";

// His own Compare (Craig, 21 Oct 2026: "it needs to be housed in player section"): him as A in his shell, opening
// against his last season, with the rival one tap away.

export const revalidate = 30;

export const generateMetadata = playerTitle("compare");

export default async function PlayerCompare({
  params,
  searchParams,
}: {
  params: Promise<{ fantraxId: string }>;
  searchParams: Promise<Asked>;
}) {
  const [{ fantraxId }, asked] = await Promise.all([params, searchParams]);
  const found = await subject(fantraxId);
  if ("unavailable" in found) return <NoProfile code={found.unavailable} />;

  return (
    <CompareBody
      asked={asked}
      route={playerCompare(fantraxId)}
      shell={(body) => (
        <PlayerShell subject={found} fantraxId={fantraxId} current="compare">
          {body}
        </PlayerShell>
      )}
    />
  );
}
