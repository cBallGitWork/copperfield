import Nothing from "../../components/shell/Nothing";
import ButtonLink from "../../components/shell/ButtonLink";
import { PANEL } from "@/app/desk";
import { POOL } from "../routes";

// What every player view draws for a man the pool holds whose profile read was refused; an unknown id is a 404.

export default function NoProfile({ code }: { code: string }) {
  return (
    <section className={`${PANEL} items-center pb-10`}>
      <Nothing title="No profile for that player" code={code} page />
      <ButtonLink href={POOL}>Every player</ButtonLink>
    </section>
  );
}
