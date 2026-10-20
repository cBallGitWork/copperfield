import { checkBin, type Fault } from "@epl/core";
import type { BinDesk } from "./binXi";
import type { Say } from "./newsroom";
import { faultSummary, faultsSendBack, sendBackOnce, serious } from "./sendBack";
import { BIN_XI_VOICE } from "./voice/binXi";

// The Bin XI's newsroom: written, read against its brief, sent back once. A column that still names
// a figure, a man or a market word the brief does not allow is not filed, and the next firing tries again.

export async function writeBin(desk: BinDesk, brief: string, say: Say): Promise<Record<string, unknown>> {
  const attempts = await sendBackOnce(
    {
      desk: "bin-xi",
      voice: BIN_XI_VOICE,
      brief,
      read: (column) => ({ column, faults: serious(checkBin(column, { brief, names: desk.names, total: desk.cargo.total })) }),
      sendBack: (faults) => faultsSendBack(faults, (section) => `the ${section}`),
    },
    say,
  );
  const { column, faults } = attempts.reduce((first, rewrite) => (noWorse(rewrite.faults, first.faults) ? rewrite : first));
  const hard = faults.filter((fault) => fault.severity === "hard");
  if (hard.length > 0) throw new Error(`The Bin XI failed its checks twice: ${faultSummary(hard)}`);
  if (faults.length > 0) say(`  ⚠ bin-xi files with ${faults.length} send-backs unanswered: ${faultSummary(faults)}`);
  return { ...column, deck: desk.deck, bin: desk.cargo };
}

/** Whether the rewrite files over the first: fewer hard faults, then no more faults, a tie going to the rewrite. */
function noWorse(rewrite: readonly Fault[], first: readonly Fault[]): boolean {
  const hard = (faults: readonly Fault[]) => faults.filter((fault) => fault.severity === "hard").length;
  return hard(rewrite) < hard(first) || (hard(rewrite) === hard(first) && rewrite.length <= first.length);
}
