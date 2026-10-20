import { readWaivers } from "../../waivers";
import WaiverCountdown from "./WaiverCountdown";

// The waiver banner over Draft and the reader's own Transfers. Off Transfers, a league with no schedule read draws nothing.

/** `always` on a Transfers view, whose way in to Waivers it is all week, schedule or none; elsewhere only near a run. */
export default async function WaiverBanner({ always = false }: { always?: boolean }) {
  const { runs, now, place } = await readWaivers();
  if (runs.length === 0 && !always) return null;
  return <WaiverCountdown runs={runs} now={now} place={place} always={always} />;
}
