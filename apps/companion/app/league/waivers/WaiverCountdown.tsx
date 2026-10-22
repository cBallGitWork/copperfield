"use client";

import { ordinal } from "@epl/core";
import Link from "../../components/shell/Link";
import { SMALL_CAPS } from "../../desk";
import { WAIVERS } from "../routes";
import { bannerWords, type BannerWords } from "./banner";
import { useMinute } from "./useMinute";

// The slim line over a page when waivers are near: "Waivers run in 5h 12m · you're 9th", to Draft › Waivers.

export default function WaiverCountdown({
  runs,
  now,
  place,
  always,
}: {
  runs: readonly string[];
  /** The server's clock, so the first paint matches the server's. */
  now: string;
  place: number | null;
  /** Before the window too, as the way in: on Transfers, whose view Waivers is. */
  always: boolean;
}) {
  const at = useMinute(now);
  return <WaiverLine words={bannerWords(runs, at, place)} place={place} always={always} />;
}

/** The line itself; on Transfers (`always`) with no run to name it is still the way in: "Waivers · you're 7th". */
export function WaiverLine({ words, place, always }: { words: BannerWords | null; place: number | null; always: boolean }) {
  if (words === null && !always) return null;
  const standing = words === null ? (place === null ? null : `you're ${ordinal(place)}`) : words.place;
  return (
    <Link href={WAIVERS} className="cm-panel flex min-h-11 items-center gap-2 px-2 text-sm lg:min-h-9">
      <span className={`${SMALL_CAPS} text-faint`}>Waivers</span>
      <span className="min-w-0 flex-1 truncate">
        {words === null ? null : (
          <>
            run <span className="numeric font-bold text-accent">{words.when}</span>
          </>
        )}
        {standing === null ? null : <span className="text-muted">{words === null ? "· " : " · "}{standing}</span>}
      </span>
      <span aria-hidden className="text-faint">›</span>
    </Link>
  );
}
