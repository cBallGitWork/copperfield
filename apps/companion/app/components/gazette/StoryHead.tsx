// A story's display block as every rank that prints one sets it.

/** The headline's step at width: the front page's, asked of the stories' container, or an article's own. */
const STEP = { front: "@md/stories:text-6xl", article: "@3xl:text-5xl" } as const;

/** The headline, the standfirst when there is one, and the 24px hairline closing the block, ranged left with it. */
export default function StoryHead({
  headline,
  standfirst,
  rank,
}: {
  headline: string;
  /** Empty prints none. */
  standfirst: string;
  rank: keyof typeof STEP;
}) {
  // An article's headline is its page's one h1; on the front the masthead holds it.
  const Head = rank === "article" ? "h1" : "h2";
  return (
    <>
      {/* A long single word hyphenates, else breaks, inside the measure rather than running off a 320px page. */}
      <Head className={`paper-display text-balance wrap-anywhere hyphens-auto pt-2.5 text-4xl font-black leading-[1.02] text-ink ${STEP[rank]}`}>
        {headline}
      </Head>
      {standfirst ? <p className="pt-2 text-lg italic leading-snug text-muted">{standfirst}</p> : null}
      <span className="mt-3 block h-px w-6 bg-ink" />
    </>
  );
}
