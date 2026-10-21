import Caption from "./Caption";
import { PANEL, PANEL_FLUSH } from "@/app/desk";

/** A desk section: its bar, its tabs, an optional caption and the content's panel.
 *  The panel holds `rows` rows at `--table-row`, so a short list keeps the screen's shape. */
export default function SectionShell({
  header,
  nav,
  caption,
  captionOnPhone = false,
  rows,
  flush = false,
  children,
}: {
  header: React.ReactNode;
  nav: React.ReactNode;
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
      {nav}
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
