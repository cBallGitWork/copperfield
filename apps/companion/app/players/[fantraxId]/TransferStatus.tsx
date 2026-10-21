import OutLink from "@/app/components/shell/OutLink";
import { readerTeamId } from "../../squads";
import { fantraxExit } from "./fantraxExit";
import type { Subject } from "./subject";

// The way out to Fantrax beside his born line; who holds him, or FA/WW, rides in the title bar's brackets (Craig, 21 Oct 2026).

export default async function TransferStatus({ found, fantraxId }: { found: Subject; fantraxId: string }) {
  const exit = fantraxExit(fantraxId, found.intel.ownerTeamId, await readerTeamId());
  return <OutLink href={exit.href}>{exit.label}</OutLink>;
}
