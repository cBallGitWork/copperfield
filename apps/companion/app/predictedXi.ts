import { unstable_cache } from "next/cache";
import { fetchJsonOr404, newerElevens, type IntelXi } from "@epl/core";
import { intelXi } from "./intel";
import { restAfterFailure } from "./restAfterFailure";
import { singleFlight } from "./singleFlight";

// The predicted elevens as the deployed branch holds them now, ahead of the deploy their commit starts. The build's
// copy (`intel.ts`, which fails the build if it will not parse) stands in for a read that fails, a 404, a body not
// shaped as the elevens, or an older file.

/** Where `rotowire-xi` writes the elevens, from the repo's root. */
const XI_FILE = "data/intel/xi/26-27.json";

/** How long one reading is held, in seconds: the elevens move hourly at most, Thursday to Saturday's lock. */
const XI_REVALIDATE = 600;

/** How long a failed read rests before this process asks again, in ms, so a cold key is not asked on every view. */
const XI_REST_MS = 60_000;

/** The raw file on the branch this deployment was built from; null off Vercel, where the build's copy is the tree's. */
function rawUrl(): string | null {
  const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug, VERCEL_GIT_COMMIT_REF: ref } = process.env;
  return owner && slug && ref ? `https://raw.githubusercontent.com/${owner}/${slug}/${ref}/${XI_FILE}` : null;
}

/** Set by a 404: a private repo's raw file is never there, so this process stops asking for it. */
let gone = false;

async function readBranch(url: string): Promise<unknown> {
  if (gone) return null;
  const body = await fetchJsonOr404(url, "GitHub", XI_FILE);
  gone = body === null;
  return body;
}

const readRaw = unstable_cache(
  singleFlight(restAfterFailure(readBranch, XI_REST_MS)),
  ["predicted-xi"],
  { revalidate: XI_REVALIDATE },
);

/** The newest predicted elevens this deployment can see; caught out here, so a failed read is never cached. */
export async function predictedElevens(): Promise<IntelXi> {
  const url = rawUrl();
  if (url === null) return intelXi;
  return newerElevens(await readRaw(url).catch(() => null), intelXi);
}
