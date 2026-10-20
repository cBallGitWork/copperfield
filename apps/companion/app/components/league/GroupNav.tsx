import Link from "@/app/components/shell/Link";
import { GROUPS, type GroupKey } from "@epl/core";
import { TAB } from "@/app/desk";
import { WORD_PLATE } from "../shell/TabStrip";

// CM's second foot row: the stat groups, as a row of blue plates under a board or docked in a `FootFrame`'s foot.
// Navigation, so `TAB` blue rather than a grey button plate; the main strip's ladder keeps it one 44px row at 320.

export default function GroupNav({
  group,
  href,
  omit = [],
}: {
  group: GroupKey;
  /** Where a group leads; each board keeps its own route. */
  href: (group: GroupKey) => string;
  /** Groups this board has no categories for, whose plates would lead nowhere. */
  omit?: readonly GroupKey[];
}) {
  return (
    <nav aria-label="Stat groups" className="flex">
      {GROUPS.filter((entry) => !omit.includes(entry.key)).map((entry) => (
        <Link
          key={entry.key}
          href={href(entry.key)}
          aria-current={entry.key === group ? "page" : undefined}
          className={`${TAB} cm-tab-quiet ${WORD_PLATE}`}
        >
          {/* The short words keep five plates on one row on a phone. */}
          <span className="lg:hidden">{entry.short}</span>
          <span className="max-lg:hidden">{entry.label}</span>
        </Link>
      ))}
    </nav>
  );
}
