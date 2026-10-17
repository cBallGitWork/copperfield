import { describe, expect, it } from "vitest";
import { behind, deploymentOf } from "./newerBuild";

describe("a page behind the live deployment", () => {
  // Craig, 16 Oct 2026: the installed app showed the paper of the build it opened on until a hard open.
  it("reads its own deployment off its scripts' dpl parameter", () => {
    const scripts = ["", "https://timproleague.vercel.app/_next/static/chunks/a.js?dpl=dpl_C2YjyfQ9YHZDo9DcE5DWaHGkNks8"];
    expect(deploymentOf(scripts)).toBe("dpl_C2YjyfQ9YHZDo9DcE5DWaHGkNks8");
    expect(deploymentOf(["/_next/static/chunks/a.js"])).toBeNull();
  });

  it("is behind only when both deployments are known and differ", () => {
    expect(behind("dpl_old", "dpl_new")).toBe(true);
    expect(behind("dpl_new", "dpl_new")).toBe(false);
    expect(behind(null, "dpl_new")).toBe(false);
    expect(behind("dpl_old", null)).toBe(false);
  });
});
