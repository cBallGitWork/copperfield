"use client";

import { useActionState, useEffect, useRef } from "react";
import { claimTeam } from "./actions";
import { STRONG_BUTTON } from "../components/shell/ButtonLink";
import { LABEL } from "@/app/desk";

// One box: your code. A client component so a wrong code answers in place; the form posts before any JavaScript.

export default function SignIn() {
  const [refused, submit, pending] = useActionState(claimTeam, null);
  const box = useRef<HTMLInputElement>(null);

  // A wrong code keeps the box and its code (the form's reset restores `defaultValue`) and puts the cursor back in it.
  useEffect(() => {
    if (refused !== null) box.current?.focus();
  }, [refused]);

  return (
    <form action={submit} className="cm-panel flex flex-col gap-3 p-4">
      <label htmlFor="code" className={LABEL}>
        Code from the commissioner
      </label>

      <div className="flex gap-2 lg:max-w-md">
        <input
          ref={box}
          id="code"
          name="code"
          required
          defaultValue={refused?.code}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD2345"
          // `text-base`, or iOS zooms on focus; `tracking-widest` because a code is transcribed a character at a time.
          className="cm-panel numeric min-h-11 min-w-0 flex-1 px-3 text-base uppercase tracking-widest text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className={`${STRONG_BUTTON} shrink-0 disabled:opacity-50`}
        >
          {pending ? "…" : "Sign in"}
        </button>
      </div>

      {refused ? (
        <p role="alert" className="text-sm text-bad">
          {refused.message}
        </p>
      ) : null}
    </form>
  );
}
