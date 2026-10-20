import type { View } from "../../../components/league/ViewToggle";
import TabStrip from "../../../components/shell/TabStrip";

// A club tab's Pitch | List, as links on `?view=` handed to the club shell's foot, as club Stats' views are.
// Not `ListAndPitch`'s toggle: its state lives inside the panel, so its dock could not reach the rail.

const TABS: readonly { key: View; label: string }[] = [
  { key: "pitch", label: "Pitch" },
  { key: "list", label: "List" },
];

/** The view a query names, or the tab's own opening one. */
export function pitchListOf(raw: string | undefined, opens: View): View {
  return TABS.find((tab) => tab.key === raw)?.key ?? opens;
}

/** Hidden from `lg` up, where both readings are drawn side by side. */
export default function PitchListStrip({ href, view }: { href: string; view: View }) {
  return (
    <div className="lg:hidden">
      <TabStrip
        label="How to show the squad"
        tabs={TABS.map((tab) => ({ ...tab, href: `${href}?view=${tab.key}` }))}
        current={view}
        labels="word"
      />
    </div>
  );
}
