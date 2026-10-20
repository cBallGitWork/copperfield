// The chosen row of a report's list in reverse ink: the targeted section's, else the lead's. One rule per row,
// because CSS cannot carry an anchor from the target to the link.

const REVERSED = "{background:var(--color-ink);color:var(--color-bg)}";

/** The rules for a report scoped `.${scope}` with its list `.${scope}-list`; `anchors` are the sections' ids, lead first.
 *  The lead's row is found by its anchor, not its place: the list opens on its heading. */
export function listMarks(scope: string, anchors: readonly string[]): string {
  if (anchors.length === 0) return "";
  const rules = [
    `.${scope}:not(:has(section:target)) .${scope}-list a[href="#${anchors[0]}"]${REVERSED}`,
    ...anchors.map((id) => `.${scope}:has(#${id}:target) .${scope}-list a[href="#${id}"]${REVERSED}`),
  ].join("");
  // Tailwind's `max-lg`: a desk shows every section, so its list is contents and marks none.
  return `@media (width < 64rem){${rules}}`;
}
