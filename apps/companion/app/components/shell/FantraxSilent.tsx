import Nothing from "./Nothing";
import { UNAVAILABLE } from "../../config";

/** Fantrax refused or did not answer: the outage title, its tell on the element, and nothing stale. `page` as `Nothing`'s. */
export default function FantraxSilent({ code, page = false }: { code: string; page?: boolean }) {
  return <Nothing title={UNAVAILABLE} code={code} page={page} />;
}
