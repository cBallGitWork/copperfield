import type { ReactNode } from "react";

// A subject's tab (a team's, a club's or a match's) with nothing in it, under its strip so the other tabs stay in reach.
// Not `shell/Nothing`, which is for a page or a section; `code` names the read, on the element and never on screen.

export default function TabEmpty({ code, children }: { code?: string; children: ReactNode }) {
  return (
    <section className="cm-panel px-3 py-6" data-code={code}>
      <p className="text-center text-2xs text-muted">{children}</p>
    </section>
  );
}
