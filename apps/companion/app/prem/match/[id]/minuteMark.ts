/** A minute as a match screen prints it, with its added time as the report does: `56'`, `90+4'`. */
export function minuteMark(minute: number, added: number | undefined): string {
  return added === undefined ? `${minute}'` : `${minute}+${added}'`;
}
