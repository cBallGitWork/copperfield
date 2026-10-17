import { describe, expect, it } from "vitest";
import { LAUNCH_SCREENS, launchPixels, launchScreenFor, startupImages } from "./launchScreens";

describe("launch screens", () => {
  it("gives every screen its own address, so no phone is handed another's image", () => {
    const urls = startupImages().map((image) => image.url);
    expect(new Set(urls).size).toBe(LAUNCH_SCREENS.length);
  });

  it("addresses an image by its device pixels and reads the screen back from it", () => {
    const fifteen = { width: 393, height: 852, ratio: 3 } as const;
    expect(launchPixels(fifteen)).toEqual({ width: 1179, height: 2556, id: "1179x2556" });
    expect(launchScreenFor("1179x2556")).toEqual(fifteen);
    expect(launchScreenFor("1x1")).toBeNull();
  });

  it("tells the XR from the XS Max, which share points and differ only in ratio", () => {
    const media = startupImages()
      .map((image) => image.media)
      .filter((query) => query.includes("device-width: 414px"));
    expect(media).toEqual([
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
    ]);
  });
});
