import { FANTRAX_LEAGUE_ID, FANTRAX_PLAYER_BASE } from "@epl/core";
import OutLink from "../../components/shell/OutLink";

/** One way out per man: a man set against his own past is one Fantrax page. */
export default function CompareExits({ men }: { men: readonly { id: string | undefined; name: string | null }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {men.map((each) => (
        <OutLink key={each.id} href={`${FANTRAX_PLAYER_BASE}/${each.id}/${FANTRAX_LEAGUE_ID}`}>
          {each.name} on Fantrax
        </OutLink>
      ))}
    </div>
  );
}
