import TabStrip from "./TabStrip";
import { READ_VIEWS, type ReadView } from "./sections";

// Read's strip at the head of its pages: Mail and the Gazetta a tap apart, and More (Craig, 11 Oct 2026).

export default function ReadViews({ current, register = "desk" }: { current: ReadView; register?: "desk" | "paper" }) {
  return <TabStrip label="Read" tabs={READ_VIEWS} current={current} register={register} labels="word" />;
}
