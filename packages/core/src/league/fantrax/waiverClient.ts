import { fxpaRead } from "./fxpa";
import type { RawWaiverSettings } from "./waivers";

/** The league setup's Transactions tab, where the waiver schedule lives; Fantrax shows it to members only. */
export function fetchWaiverSettings(leagueId: string, session: string): Promise<RawWaiverSettings> {
  return fxpaRead(leagueId, "getLeagueSetup", { action: "transactions" }, session) as Promise<RawWaiverSettings>;
}
