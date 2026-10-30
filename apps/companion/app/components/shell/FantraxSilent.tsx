import Nothing from "./Nothing";
import TryAgain from "./TryAgain";
import { UNAVAILABLE } from "../../config";

/** Fantrax refused or did not answer: the outage title, its tell on the element, nothing stale, and a way to ask again.
 *  `page` as `Nothing`'s. */
export default function FantraxSilent({ code, page = false }: { code: string; page?: boolean }) {
  return <Nothing title={UNAVAILABLE} code={code} page={page} action={<TryAgain />} />;
}
