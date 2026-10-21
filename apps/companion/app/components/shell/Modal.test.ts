import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Lane 2 review: a card opened from a table row drew its dialog inside the row's <th>, so it took the table's
// `whitespace-nowrap` (news cut off) and `.cm-out`'s grey (faded buttons). The dialog goes to `document.body`.

const body = { tagName: "BODY" };
const portals: { panel: ReactNode; target: unknown }[] = [];

vi.mock("./onClient", () => ({ useOnClient: () => true }));
vi.mock("react-dom", async (original) => ({
  ...(await original<typeof import("react-dom")>()),
  createPortal: (panel: ReactNode, target: unknown) => {
    portals.push({ panel, target });
    return null;
  },
}));

describe("a dialog opened from a table row", async () => {
  vi.stubGlobal("document", { body, addEventListener: () => undefined });
  const { default: Modal } = await import("./Modal");
  const row = renderToStaticMarkup(
    createElement(
      "table",
      { className: "whitespace-nowrap" },
      createElement(
        "tbody",
        null,
        createElement(
          "tr",
          { className: "cm-out cm-doubt-out" },
          createElement("th", null, createElement(Modal, { onClose: () => undefined, width: "24rem" } as Parameters<typeof Modal>[0], "Ankle injury")),
        ),
      ),
    ),
  );
  vi.unstubAllGlobals();

  it("is drawn on the page's body, never inside the row", () => {
    expect(row).not.toContain("<dialog");
    expect(row).not.toContain("Ankle injury");
    expect(portals.at(-1)?.target).toBe(body);
  });

  it("wraps its text whatever it was opened from", () => {
    const dialog = renderToStaticMarkup(createElement("div", null, portals.at(-1)?.panel));
    expect(dialog).toMatch(/<dialog[^>]*class="[^"]*\bwhitespace-normal\b/);
    expect(dialog).toContain("Ankle injury");
  });
});
