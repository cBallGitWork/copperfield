import type { MetadataRoute } from "next";

/** Meta's AI crawler, which followed every sort and filter link on the player board: 74k uncached renders in a day (2 Nov 2026). */
export const META_CRAWLER = "meta-externalagent";

/** The board's every query string is its own render, so the crawler that follows links is asked to leave it. */
export const BOARD_PATH = "/players";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: META_CRAWLER, disallow: BOARD_PATH },
      { userAgent: "*", allow: "/" },
    ],
  };
}
