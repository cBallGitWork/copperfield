import { use, type ReactNode } from "react";
import { clubColours, plateOn } from "@epl/core";
import { ModalContext } from "./Modal";

// The title bar of a dialog about one subject, in that subject's colours: the name, and a cross where it can close.
// `minHeight: 0` is inline because unlayered `desk.css` beats `@layer utilities`: `lg:min-h-0` loses silently
// and `.cm-titlebar` grows to 96px above `lg`.

export default function DialogHead({
  title,
  club,
  onClose,
}: {
  /** The subject's name. */
  title: ReactNode;
  /** His club's short name, for the plate; null keeps the desk's chrome blue. */
  club: string | null;
  /** Shuts the dialog from its top corner, as well as the foot's Close. */
  onClose?: () => void;
}) {
  const modal = use(ModalContext);
  // The panel's own way out where it has one, so a cross steps back off a card's history entry.
  const close = onClose === undefined ? undefined : (modal?.close ?? onClose);
  const plate = club === null ? undefined : plateOn(clubColours(club));
  const ink = plate ? { color: plate.ink } : undefined;

  return (
    <div
      className={`cm-titlebar flex shrink-0 items-center gap-2 py-2 pl-3 ${close === undefined ? "pr-3" : "pr-1"}`}
      style={{ minHeight: 0, ...(plate ? { background: plate.background } : {}) }}
    >
      <h2 id={modal?.titleId} className="cm-title min-w-0 flex-1 truncate text-xl font-bold tracking-tight" style={ink}>
        {title}
      </h2>
      {close === undefined ? null : (
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="-my-2 grid min-h-11 w-11 shrink-0 place-items-center text-2xl leading-none"
          style={ink}
        >
          <span aria-hidden>×</span>
        </button>
      )}
    </div>
  );
}
