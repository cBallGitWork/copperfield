import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getLeagueSquads, readable, readerTeamId } from "../../../squads";
import { archived, filed, renamedSlug } from "../../../paper";
import { clubById, withReportFace } from "@epl/core";
import Extras from "../../../components/gazette/Extras";
import Folio from "../../../components/gazette/Folio";
import { named } from "../../../components/gazette/named";
import Written from "../../../components/gazette/Written";
import { articleMetadata } from "../../../components/gazette/shareLink";
import { storyHref } from "../../../components/gazette/paperPages";

// One story, printed whole, off the uncomposed `filed`, else its archive file: a story the paper has dropped keeps its
// address, and a renamed one moves to its new slug.

// Must match `ARTICLE_REVALIDATE` (not `PAGE_REVALIDATE`) in the app's config: Next reads this statically.
export const revalidate = 300;
// No `generateStaticParams`: the layout's live strip calls `connection()`, and a prebuilt article 500s at runtime.

async function find(slug: string) {
  return filed.find((story) => story.slug === slug) ?? (await archived(slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const story = await find((await params).slug);
  if (story === null) return { title: "Not in this edition" };
  return articleMetadata(story, process.env.VERCEL_PROJECT_PRODUCTION_URL);
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const found = await find(slug);
  if (found === null) {
    const renamed = renamedSlug(slug);
    if (renamed !== null && (await find(renamed)) !== null) permanentRedirect(storyHref(renamed));
    notFound();
  }

  // A column returns team ids; names are joined at render.
  // The squads alone, not the whole edition: an unreadable league still prints the story, unpictured.
  const [mine, drafted] = await Promise.all([readerTeamId(), getLeagueSquads().then(readable)]);
  const snapshot = drafted?.snapshot ?? null;
  const teams = drafted?.info?.teams ?? [];
  const story = snapshot ? withReportFace(found, snapshot) : found;
  const who = named(teams);

  return (
    <>
      <Folio at={story.filedAt} />
      <article className="pt-4">
        <Written story={story} teams={teams} clubs={snapshot ? clubById(snapshot) : undefined} />
        <Extras story={story} named={who} mine={mine} snapshot={snapshot} />
      </article>
    </>
  );
}
