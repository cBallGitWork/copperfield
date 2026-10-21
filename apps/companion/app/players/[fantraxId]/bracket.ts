import { FREE } from "../status";
import type { Subject } from "./subject";

/** What the title bar's brackets hold: his fantasy side, else FA or WW for a man anybody can claim, else nothing. */
export function bracket({ ownerName, intel }: Pick<Subject, "ownerName" | "intel">): string | null {
  if (ownerName !== null) return ownerName;
  const status = intel.league.find((row) => row.label === "Status/Team")?.value?.trim() ?? "";
  return FREE.includes(status) ? status : null;
}
