import SquadIndex from "./SquadIndex";
import { MORE } from "../components/shell/sections";
import { SQUADS, titled } from "../titles";

// Every squad, and the sign-in: reached from More, so its back plate goes there.

export const revalidate = 30;

export const metadata = titled(SQUADS);

export default function SquadsPage() {
  return <SquadIndex back={MORE} />;
}
