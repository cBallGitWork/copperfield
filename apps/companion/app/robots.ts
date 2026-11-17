import type { MetadataRoute } from "next";
import { GATED } from "./playersGate";

// The board's every query string is its own render: Meta's crawler made 74k of them in a day (2 Nov 2026), another bot
// walked it under the rate limit (17 Nov 2026). Every crawler is asked to leave the player section; the proxy enforces it.

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: GATED }] };
}
