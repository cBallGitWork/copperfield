import { clubGround, groundPhotoCredits } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import { MORE } from "../components/shell/sections";
import { PANEL, ROW_RULE } from "@/app/desk";
import { COLUMNISTS, DESK_GROUND_CREDIT } from "../config";
import { venueCredits } from "../venues";
import { CREDITS_TITLE, titled } from "../titles";

// Who took the photographs: each Creative Commons licence requires the author and a link to the terms.
// Prints `football/grounds.ts` and `data/leagues/venues.json`, so an uncredited picture shows here.

/** A credit's outbound link at the tap floor; twice in one row and nowhere else, so it stays here (CODE_RULES §1). */
const CREDIT_LINK = "flex min-h-11 min-w-0 items-center break-words underline lg:min-h-9";

export const metadata = titled(CREDITS_TITLE);

export default function CreditsPage() {
  // The desk's own ground first, then each team's home, then each club's, under the name of the place it shows.
  const credits = [
    ...(DESK_GROUND_CREDIT === null
      ? []
      : [{ place: "Anfield, behind the desk until you sign in", photo: DESK_GROUND_CREDIT }]),
    ...venueCredits().map(({ place, ...photo }) => ({ place, photo })),
    ...groundPhotoCredits().map(({ shortName, photo }) => ({
      place: clubGround(shortName) ?? shortName,
      photo,
    })),
    ...Object.entries(COLUMNISTS).map(([name, columnist]) => ({ place: `${name}, beside his column`, photo: columnist.photo })),
  ];

  return (
    <>
      <PageHeader
        title={CREDITS_TITLE}
        competition
        sub={`${credits.length} photographs`}
        back={MORE}
      />
      <section className={PANEL}>
        <ul className="flex flex-col">
          {credits.map(({ place, photo }) => (
            <li key={place} className={`flex flex-col pt-2 ${ROW_RULE}`}>
              <span className="font-chrome text-sm font-bold text-ink">{place}</span>
              {/* What the licences ask for: the title linked to its source, the author, the licence linked to its terms. */}
              <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                <a className={CREDIT_LINK} href={photo.source} rel="noreferrer" target="_blank">
                  {photo.title}
                </a>
                <span>· {photo.author} ·</span>
                <a className={CREDIT_LINK} href={photo.licenceUrl} rel="noreferrer" target="_blank">
                  {photo.licence}
                </a>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">Crests, kits and player portraits are the Premier League&rsquo;s own.</p>
      </section>
    </>
  );
}
