"use client";

import { useEffect } from "react";
import { BUTTON } from "./components/shell/ButtonLink";

// What a reader sees when a read throws: one line and a retry, on a `.cm-panel` because nothing prints on the bare
// ground (`tools/ui/groundfit.mjs`).

export default function SectionError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The server log is where a digest becomes a stack trace, and on Vercel that
    // is the only place the two are joined up.
    console.error("section failed", error.digest ?? "", error.message);
  }, [error]);

  return (
    // The digest on the element, so an inspector says which read failed.
    <div className="cm-panel flex flex-col items-center gap-4 px-6 py-10 text-center" data-code={error.digest}>
      <h1 className="font-chrome text-2xl font-bold tracking-tight">Something went wrong</h1>
      {/* Fetches the section again; `reset` only re-rendered the payload that failed. */}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className={BUTTON}
      >
        Try again
      </button>
    </div>
  );
}
