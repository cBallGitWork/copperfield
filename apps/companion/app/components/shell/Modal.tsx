"use client";

import {
  createContext,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

// A panel over the page: a native `<dialog>`, so Escape, the focus trap and the inert background are the browser's.
// Never wider than 92vw, nor taller than the screen between its safe areas: the body scrolls, the head and foot stay.
// Callers render it conditionally; its head and foot read `ModalContext` for the title's id and the way out.

/** What a dialog's head and foot read from the panel round them: the title's id, and how a press shuts it. */
export const ModalContext = createContext<{ titleId: string; close?: () => void } | null>(null);

/** The last control pressed: WebKit never focuses a button it clicks, so `activeElement` cannot name the opener. */
let pressed: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const control = event.target instanceof Element ? event.target.closest("button, a, [tabindex]") : null;
      pressed = control instanceof HTMLElement ? control : null;
    },
    true,
  );
}

/** Where focus goes back to on close: the focused control, or the one pressed when nothing took focus. */
function opener(): HTMLElement | null {
  const active = document.activeElement;
  return active instanceof HTMLElement && active !== document.body ? active : pressed;
}

/** Tells one card's history entry from the next. */
let entries = 0;

export default function Modal({
  onClose,
  width,
  head,
  foot,
  closesOnBack = false,
  children,
}: {
  onClose: () => void;
  /** How wide the panel wants to be, on a screen with room for it. */
  width: string;
  /** Pinned above what scrolls: the title bar. */
  head?: ReactNode;
  /** Pinned below what scrolls, so Close is in reach however long the body runs. */
  foot?: ReactNode;
  /** Back shuts it rather than leaving the page: a card opened from state, not from a URL of its own. */
  closesOnBack?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Refs, so React's second mount in development neither pushes a second entry nor takes the dialog as the opener.
  const entry = useRef<string | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const closed = useEffectEvent(onClose);

  // Every way out but Back steps back off the card's entry, and the `popstate` that follows closes it.
  const shut = () => (entry.current !== null && history.state?.modal === entry.current ? history.back() : onClose());

  useEffect(() => {
    returnTo.current ??= opener();
    dialog.current?.showModal();
    // The page behind holds still: a drag beside the card scrolled it.
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      if (returnTo.current?.isConnected) returnTo.current.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!closesOnBack) return;
    if (entry.current === null) {
      entry.current = `modal-${++entries}`;
      history.pushState({ modal: entry.current }, "");
    }
    const back = () => closed();
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [closesOnBack]);

  return (
    <ModalContext value={{ titleId, close: closesOnBack ? shut : undefined }}>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={closesOnBack ? shut : onClose}
        // A backdrop click lands on the dialog itself; one inside lands on a child.
        onClick={(event) => {
          if (event.target === dialog.current) (closesOnBack ? shut : onClose)();
        }}
        style={{ "--modal-width": width } as CSSProperties}
        // `open:flex`, never `flex`: a bare display would show the dialog shut.
        className="m-auto max-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-2rem)] w-[min(var(--modal-width),92vw)] flex-col overflow-hidden border border-line bg-surface p-0 text-ink backdrop:bg-black/70 open:flex"
      >
        {head}
        {/* Sized to its content with a floor: a 0% basis in a dialog of no set height drew 0px in WebKit (D-4). */}
        <div className="min-h-24 flex-auto overflow-y-auto overscroll-contain">{children}</div>
        {foot === undefined ? null : <div className="shrink-0 border-t border-line p-3">{foot}</div>}
      </dialog>
    </ModalContext>
  );
}
