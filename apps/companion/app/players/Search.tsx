"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { heldText } from "./heldText";
import { ask } from "./liveQuery";

// The board's search box, narrowing as you type (Craig, 10 Sep 2026). A GET form first: without a script Enter submits
// it; with one, a settled keystroke changes the board's query as last asked for, and the server answers, so the pool
// never ships to the phone.

/** How long the box waits after the last keystroke: each settled one is a server render of the board. */
const SETTLE = 250;

export default function Search({
  query,
  action,
  children,
}: {
  /** What the page was rendered with, which is the authority this box follows. */
  query: string;
  action: string;
  /** The rest of the query as hidden inputs, rendered on the server, for the submit without a script. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [rendered, setRendered] = useState(query);
  const [sent, setSent] = useState<string | null>(null);

  // The URL is the authority: reset during render (not an effect, which flashes the old text; not `key`, which drops
  // the caret), but never over keystrokes typed while the server answered this box's own search.
  if (query !== rendered) {
    setRendered(query);
    setText(heldText(query, sent, text));
  }

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => {
      setSent(text.trim());
      // A new set of rows, so Show all goes; `replace`, so a search is one history entry; `scroll: false`, so the
      // board under the box stays put.
      router.replace(ask({ set: { q: text.trim(), all: "" } }), { scroll: false });
    }, SETTLE);
    return () => clearTimeout(timer);
  }, [text, query, router]);

  return (
    <form
      action={action}
      // Under a thumb it shares its line with Filter alone; the chips have the next (Craig, 16 Oct 2026).
      className="flex min-w-0 grow basis-26 lg:w-36 lg:flex-none"
    >
      {children}
      <input
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Find a player"
        aria-label="Find a player"
        type="search"
        // `text-base` stays: below 16px an iPhone zooms the page on focus. An empty box lays out no clear button, whose
        // reserved 8px cut the placeholder to "Find a playe" in the 117px a 390 phone leaves it.
        className="cm-panel min-h-11 min-w-0 flex-1 px-2 text-base lg:min-h-9 lg:px-3 [&:placeholder-shown::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );
}
