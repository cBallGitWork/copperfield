import { describe, expect, it } from "vitest";
import { APPLE_ICON_SIZE, appIcon, MANIFEST_ICON_SIZES } from "./appIcon";

describe("the app icon", () => {
  // 16 Oct 2026: `/icon/192` was fetched three times on every poll, at `max-age=0` with no ETag.
  it("is held by the browser, so a poll or a tab tap never fetches it again", () => {
    for (const size of [...MANIFEST_ICON_SIZES, APPLE_ICON_SIZE]) {
      expect(appIcon(size).headers.get("cache-control")).toBe("public, max-age=604800");
    }
  });
});
