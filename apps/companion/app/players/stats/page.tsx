import PoolBoard from "../PoolBoard";
import type { PlayersSearchParams } from "../query";
import { scoutTitle } from "../title";

// Adv Stats: the same pool under every figure the league does not score (Craig, 16 Oct 2026).

// Must match `PAGE_REVALIDATE` in the app's config: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const metadata = scoutTitle("stats");

export default function AdvStatsPage({ searchParams }: { searchParams: Promise<PlayersSearchParams> }) {
  return <PoolBoard board="stats" searchParams={searchParams} />;
}
