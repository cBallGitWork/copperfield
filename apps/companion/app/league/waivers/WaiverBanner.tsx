import { readWaivers } from "../../waivers";
import { WaiverLine } from "./WaiverLine";

// The waiver line over Draft's Transfers and the reader's own, naming his place in the claim order.

export default async function WaiverBanner() {
  const { place } = await readWaivers();
  return <WaiverLine place={place} />;
}
