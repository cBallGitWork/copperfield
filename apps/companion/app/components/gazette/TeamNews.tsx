import Image from "next/image";
import { crestUrl, type PublishedStory, londonDayAndTime, venueMark } from "@epl/core";
import { RULE } from "./rules";
import { CAPTION, CAPTION_CAPS, SUBHEAD } from "./heads";
import { yoursInk } from "../../mine";

// The team-news thread: a club, its crest and fixture, a line of context, one row per man, and at most one quote.

/** The four states, ranked in scale, never in hue (DESIGN §4); OUT is the loud one. */
const STATUS: Record<string, string> = {
  OUT: "font-semibold text-ink",
  Suspended: "font-semibold text-ink",
  Doubt: "text-muted",
  FIT: "text-muted",
};

/** Whether the man is the reader's, matched on the short name the desk filed his owner under; null matches nobody. */
function isMine(owner: string | undefined, myName: string | null): boolean {
  return owner !== undefined && owner === myName;
}

export default function TeamNews({ story, myName = null }: { story: PublishedStory; myName?: string | null }) {
  const rows = story.extras?.teamNews ?? [];
  if (rows.length === 0) return null;

  return (
    // The paper's own measure: one column on a phone, newspaper columns on a desk, a club never split across two.
    <div className="paper-columns pt-4">
      {rows.map((row) => (
        <section key={row.club} className={`break-inside-avoid border-b py-4 last:border-b-0 ${RULE}`}>
          <h2 className="flex items-center gap-3">
            {/* Not `.crest`: a raster badge reads no desk token, and `.crest` would let the brand red loose here. */}
            {row.code === null ? null : (
              <span className="shrink-0">
                <Image src={crestUrl({ code: row.code })} alt="" width={32} height={32} />
              </span>
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={SUBHEAD}>{row.club}</span>
              {/* Who they play, and when, off the fixture list: under the name, so neither wraps beside the other. */}
              {row.fixture === undefined ? null : (
                <span className={CAPTION}>
                  v {row.fixture.opponent} {venueMark(row.fixture.home)} · {londonDayAndTime(row.fixture.kickoff)}
                </span>
              )}
            </span>
          </h2>

          {row.line === undefined ? null : <p className="pt-2.5 text-base leading-snug text-muted">{row.line}</p>}

          {/* The status is the row's mark, in a column of its own, so the men line up under one another. */}
          {row.men === undefined ? null : (
            <ul className="grid grid-cols-[minmax(2.75rem,auto)_1fr] gap-x-3 gap-y-1.5 pt-2.5">
              {row.men.map((man) => (
                <li key={man.name} className="col-span-2 grid grid-cols-subgrid items-baseline text-base leading-snug">
                  <span className={`${CAPTION_CAPS} ${STATUS[man.status] ?? "text-muted"}`}>{man.status}</span>
                  <p className="min-w-0 text-ink">
                    <strong className={`font-bold ${yoursInk(isMine(man.owner, myName))}`}>{man.name}</strong>
                    {/* The owner only when there is one, in ink: `.paper` does not re-point `--color-info`. */}
                    {man.owner === undefined ? null : <span className={isMine(man.owner, myName) ? yoursInk(true) : "text-muted"}> (<em>{man.owner}</em>)</span>}
                    {man.note === "" ? null : <span className="text-muted">, {man.note}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {row.stillOut !== undefined ? (
            <StillOut men={row.stillOut} myName={myName} />
          ) : row.alsoOut !== undefined ? (
            <StillOut men={row.alsoOut.map((name) => ({ name }))} myName={myName} />
          ) : null}

          {/* Carried from the source article, never composed. */}
          {row.quote === undefined ? null : (
            <blockquote className={`mt-3 border-l-2 pl-3 text-base leading-snug ${RULE}`}>
              <p className="text-ink italic">&ldquo;{row.quote.text}&rdquo;</p>
              <cite className={`${CAPTION} block pt-1 not-italic`}>
                {row.quote.said}
              </cite>
            </blockquote>
          )}
        </section>
      ))}
    </div>
  );
}

/** The standing absences run in after their label, as a paper's team news sets them, each owner where there is one. */
function StillOut({ men, myName }: { men: readonly { name: string; owner?: string }[]; myName: string | null }) {
  return (
    <p className="pt-2.5 text-base leading-snug text-muted">
      <span className={`${CAPTION_CAPS} pr-1.5 font-semibold text-ink`}>Still out</span>
      {men.map((man, at) => (
        <span key={man.name}>
          {at > 0 ? " · " : null}
          <span className={isMine(man.owner, myName) ? yoursInk(true) : undefined}>
            {man.name}
            {man.owner === undefined ? null : <> (<em>{man.owner}</em>)</>}
          </span>
        </span>
      ))}
    </p>
  );
}
