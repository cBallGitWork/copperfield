"use client";

import Link from "../../components/shell/Link";
import { SMALL_CAPS } from "../../desk";
import { WAIVERS } from "../routes";
import { bannerWords } from "./banner";
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
  /** Before the window too, naming the day: on Transfers, whose view Waivers is. */
  always: boolean;
}) {
  const at = useMinute(now);
  const words = bannerWords(runs, at, place, always);
  if (words === null) return null;
  return (
    <Link href={WAIVERS} className="cm-panel flex min-h-11 items-center gap-2 px-2 text-sm lg:min-h-9">
      <span className={`${SMALL_CAPS} text-faint`}>Waivers</span>
      <span className="min-w-0 flex-1 truncate">
        run <span className={`numeric font-bold ${words.near ? "text-accent" : "text-ink"}`}>{words.when}</span>
        {words.place === null ? null : <span className="text-muted"> · {words.place}</span>}
      </span>
      <span aria-hidden className="text-faint">›</span>
    </Link>
  );
}
