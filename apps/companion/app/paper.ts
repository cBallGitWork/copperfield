import { FANTRAX_LEAGUE_ID, type PublishedStory, normalizePaper, normalizeStory } from "@epl/core";
import paper from "../../../data/editions/paper.json";

// The rolling paper, baked in at build time: the commit that files a story is the one that deploys it.
// `normalizePaper` keeps the served league's stories; `edition.ts` orders them, since it owns the clock.

export const filed: PublishedStory[] = normalizePaper(paper, FANTRAX_LEAGUE_ID);

/** Kinds renamed after they filed, by the slug part: Lawro's power rankings filed as season predictions until 5 Oct (#270). */
const RENAMED: ReadonlyArray<readonly [was: string, now: string]> = [["-season-predictions", "-season-rankings"]];

/** The slug a renamed story files under now, or null when its kind kept its name. */
export function renamedSlug(slug: string): string | null {
  const rename = RENAMED.find(([was]) => slug.endsWith(was));
  return rename === undefined ? null : `${slug.slice(0, -rename[0].length)}${rename[1]}`;
}

/** A slug or a league id as the desk writes them: never a path. */
const SAFE = /^[a-z0-9][a-z0-9-]*$/u;

/** A story that has left the paper, read from its archive file, which the build bundles a chunk each and loads only
 *  when asked; null when the league filed none by that slug. */
export async function archived(slug: string, leagueId: string = FANTRAX_LEAGUE_ID): Promise<PublishedStory | null> {
  if (!SAFE.test(slug) || !SAFE.test(leagueId)) return null;
  const file: unknown = await import(`../../../data/editions/archive/${leagueId}/${slug}.json`).then(
    (module: { default?: unknown }) => module.default,
    // No archive file is the ordinary answer for a slug never filed: the page 404s.
    () => null,
  );
  const story = normalizeStory(file);
  return story !== null && story.leagueId === leagueId ? story : null;
}
