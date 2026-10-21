import Absent from "@/app/components/shell/Absent";
import OutLink from "@/app/components/shell/OutLink";
import { READ_LINE, ROW_NAME } from "@/app/desk";
import { readerTeamId } from "../../squads";
import { arrival, playerMoves } from "./dossier";
import { fantraxExit } from "./fantraxExit";
import { holding } from "./holding";
import type { Subject } from "./subject";

// CM's transfer status, folded into the Profile beside his fitness (Craig, 21 Oct 2026): one line and the way out.

export default async function TransferStatus({ found, fantraxId }: { found: Subject; fantraxId: string }) {
  const [{ moves, whole }, reader] = await Promise.all([playerMoves(fantraxId), readerTeamId()]);
  const owner = found.intel.ownerTeamId;
  const status = found.intel.league.find((row) => row.label === "Status/Team")?.value?.trim() ?? "";
  const line = holding(owner, status, arrival(moves, owner, whole));
  const exit = fantraxExit(fantraxId, owner, reader);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <dl className={`flex flex-1 items-baseline gap-3 ${READ_LINE}`}>
        <dt className="text-sm text-muted">{line.label}</dt>
        <dd className={`${ROW_NAME} text-ink`}>{line.value ?? <Absent />}</dd>
      </dl>
      <OutLink href={exit.href}>{exit.label}</OutLink>
    </div>
  );
}
