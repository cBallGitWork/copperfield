import type { ReactNode } from "react";
import { PANEL, SECTION_HEAD } from "@/app/desk";

// A headed block on a plate under CM's caption band: the shape every tab uses for "this part is about that".
// The plate wraps the head too, so neither title nor aside prints bare on the photograph.
// It renders whatever it is given, even nothing: whether a section is worth printing is the page's call.

export default function Section({
  title,
  children,
  aside,
}: {
  /** Omitted where the plate above already names it; with no `aside` either, no head row is drawn. */
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const heads = title !== undefined || aside !== undefined;
  return (
    <section className={PANEL}>
      {!heads ? null : (
        <div className={SECTION_HEAD}>
          <span />
          {/* `font-chrome`, not `font-display`, which is reserved for figures; mixed case, as CM's captions are. */}
          {title === undefined ? (
            <span />
          ) : (
            <h2 className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-lg">{title}</h2>
          )}
          {/* Muted, not faint: faint fails on the band (DESIGN §3). */}
          {aside ? <span className="justify-self-end text-right text-2xs text-muted">{aside}</span> : <span />}
        </div>
      )}
      {children}
    </section>
  );
}
