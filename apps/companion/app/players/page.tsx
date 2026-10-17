import PoolBoard from "./PoolBoard";
import type { PlayersSearchParams } from "./query";
import { scoutTitle } from "./title";

// Players: the pool under the league's own scoring, resting on the free men (Craig, 16 Oct 2026).

// Must match `PAGE_REVALIDATE` in the app's config: Next reads it statically, so it cannot be imported.
export const revalidate = 30;

export const metadata = scoutTitle("pool");

export default function PlayersPage({ searchParams }: { searchParams: Promise<PlayersSearchParams> }) {
  return <PoolBoard board="pool" searchParams={searchParams} />;
}
