import type { ReportClub } from "./types";

/** Every name the paper may call a club by: the printed name, its short forms, then its nickname. */
export const namesOfClub = (c: ReportClub): string[] => [c.name, ...c.shorts, ...(c.nickname === null ? [] : [c.nickname])];
