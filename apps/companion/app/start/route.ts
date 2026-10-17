import { redirect } from "next/navigation";
import { roundLive } from "../football";
import { landing } from "../landing";
import { signedIn } from "../session";

/** Sends a reader opening the site to Live or Mail, as `landing` says; Mail when FPL could not be read. */
export async function GET() {
  const [reader, live] = await Promise.all([signedIn(), roundLive()]);
  redirect(landing({ signedIn: reader, live }));
}
