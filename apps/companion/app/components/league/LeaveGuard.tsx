"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { holdReloads } from "../shell/unsaved";
import Modal from "../shell/Modal";
import DialogHead from "../shell/DialogHead";
import { BUTTON, STRONG_BUTTON } from "../shell/ButtonLink";

// Asks before an unsaved lineup is left behind: the browser's own prompt on a reload or close, ours on a
// tap to another screen of the app. The pull to refresh holds off, as iOS reloads without asking; the back
// button is not caught.

export default function LeaveGuard({
  dirty,
  canSave,
  onSave,
}: {
  dirty: boolean;
  canSave: boolean;
  /** True when Fantrax took it. */
  onSave: () => Promise<boolean>;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);
  const stay = useRef<HTMLButtonElement>(null);

  // After `Modal` opens it (a child's effect runs first), or the dialog focuses its first button, a way out.
  useEffect(() => {
    if (leaving !== null) stay.current?.focus();
  }, [leaving]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.origin !== location.origin) return;
      if (link.pathname === location.pathname && link.search === location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(link.pathname + link.search + link.hash);
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    holdReloads(true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      holdReloads(false);
    };
  }, [dirty]);

  if (leaving === null) return null;
  const go = () => {
    setLeaving(null);
    router.push(leaving);
  };

  return (
    // `DialogHead` carries the id the dialog is named by. Where saving is off (nine of ten teams) the plan lives only here.
    <Modal onClose={() => setLeaving(null)} width="22rem" head={<DialogHead title={canSave ? "Save your line-up?" : "Leave your plan?"} club={null} />}>
      <div className="flex flex-col gap-3 p-3">
        <p className="px-1 text-sm text-muted">
          {canSave ? "You have changed your line-up and not saved it." : "The changes you planned here will be lost."}
        </p>
        <div className="flex flex-col gap-2">
          {canSave ? (
            <button type="button" onClick={async () => ((await onSave()) ? go() : setLeaving(null))} className={`${STRONG_BUTTON} cm-primary`}>
              Save and leave
            </button>
          ) : null}
          <button type="button" onClick={go} className={BUTTON}>
            {canSave ? "Leave without saving" : "Leave"}
          </button>
          <button ref={stay} type="button" onClick={() => setLeaving(null)} className={BUTTON}>
            Stay
          </button>
        </div>
      </div>
    </Modal>
  );
}
