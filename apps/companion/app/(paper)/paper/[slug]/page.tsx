import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { readerTeamId } from "../../../squads";
import { edition } from "../../../edition";
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
  const mine = await readerTeamId();
  const paper = await edition(mine);
  const story = paper.snapshot ? withReportFace(found, paper.snapshot) : found;
  const who = named(paper.teams);

  return (
    <>
      <Folio at={story.filedAt} />
      <article className="pt-4">
        <Written story={story} teams={paper.teams} clubs={paper.snapshot ? clubById(paper.snapshot) : undefined} />
        <Extras story={story} named={who} mine={paper.mine} snapshot={paper.snapshot} />
      </article>
    </>
  );
}
