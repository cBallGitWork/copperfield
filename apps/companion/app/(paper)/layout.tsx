import type { ReactNode } from "react";
import type { Viewport } from "next";
import { paperFontVariables } from "../paperFonts";
import { TOKEN_SRGB } from "../config";

// The paper's register, put on once for every route in the group: `.paper`, the two serifs, cream browser chrome.

// Must match `PAGE_REVALIDATE` in the app's config: Next reads this statically, so it cannot be imported.
export const revalidate = 30;

// `--paper` in paper.css, serialised into a <meta> tag.
export const viewport: Viewport = { themeColor: TOKEN_SRGB.paper };

export default function PaperLayout({ children }: { children: ReactNode }) {
  return (
    // `paper-page` puts the stock on the root on a phone (paper.css). The serifs mount here only; `@container` sizes
    // the page by its frame; pulled up by `<main>`'s own `--page-top`, `min-h-dvh` keeps stock to the foot.
    <div
      className={`paper paper-page @container ${paperFontVariables} -mx-[var(--page-gutter)] -mb-[var(--page-foot)] -mt-[var(--page-top)] flex min-h-dvh flex-col gap-5 px-[var(--page-gutter)] pb-[calc(2rem+var(--page-foot))] pt-3`}
    >
      {children}
    </div>
  );
}
