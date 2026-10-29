import Caption from "./Caption";
import { PANEL, PANEL_FLUSH, PINNED_TOP } from "@/app/desk";
import Pinned from "./Pinned";

/** A desk section: its bar, its tabs (locked to the top of a phone), an optional caption and the content's panel.
 *  The panel holds `rows` rows at `--table-row`, so a short list keeps the screen's shape. */
export default function SectionShell({
  header,
  nav,
  banner,
  caption,
  captionOnPhone = false,
  rows,
  flush = false,
  children,
}: {
  header: React.ReactNode;
  nav: React.ReactNode;
  /** A notice under the tabs that scrolls away with the page rather than locking with them. */
  banner?: React.ReactNode;
  /** The view's name on its own box; a section with no caption names its view on the tab strip alone. */
  caption?: React.ReactNode;
  /** Keep the caption under a thumb: only when no tab on the strip names the view. */
  captionOnPhone?: boolean;
  rows: number;
  /** A board alone in the panel, its index spine against the edge (`PANEL_FLUSH`). */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {header}
      <Pinned edge="top" className={PINNED_TOP}>
        {nav}
      </Pinned>
      {banner}
      {caption === undefined ? null : <Caption deskOnly={!captionOnPhone}>{caption}</Caption>}
      <section
        className={flush ? PANEL_FLUSH : PANEL}
        style={{ minHeight: `calc(${rows} * var(--table-row) + var(--table-chrome))` }}
      >
        {children}
      </section>
    </div>
  );
}
