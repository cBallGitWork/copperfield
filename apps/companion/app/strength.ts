import { strengthIntel, type ClubStrength, type IntelStrength } from "@epl/core";
import strengthFile from "../../../data/intel/strength/26-27.json";

// Each club's attack and defence, apart from `intel.ts` so a client component can colour a fixture: 20 clubs, 5KB.

/** Each club's Dixon-Coles attack and defence by FPL club code. */
export const intelStrength: Map<number, ClubStrength> = strengthIntel(strengthFile as unknown as IntelStrength);
