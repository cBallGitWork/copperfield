import { ordinal } from "@epl/core";
import Link from "../../components/shell/Link";
import { SMALL_CAPS } from "../../desk";
import { WAIVERS } from "../routes";

// The slim line over Transfers, its way in to Waivers: "Waivers · you're 9th". Never a run's day or a countdown.

export function WaiverLine({ place }: { place: number | null }) {
  return (
    <Link href={WAIVERS} className="cm-panel flex min-h-11 items-center gap-2 px-2 text-sm lg:min-h-9">
      <span className={`${SMALL_CAPS} text-faint`}>Waivers</span>
      <span className="min-w-0 flex-1 truncate">
        {place === null ? null : <span className="text-muted">· you&apos;re {ordinal(place)}</span>}
      </span>
      <span aria-hidden className="text-faint">›</span>
    </Link>
  );
}
