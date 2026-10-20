import { STATUS } from "../status";

/** The transfer panel's first line: the team holding him, else his status in the manager's words; a code not in
 *  `STATUS` prints as itself, and none is absent. */
export function holding(ownerName: string | null, status: string): { label: string; value: string | null } {
  if (ownerName !== null) return { label: "Held by", value: ownerName };
  return { label: "Status", value: STATUS[status] ?? (status || null) };
}
