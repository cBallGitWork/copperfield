import ButtonLink from "./components/shell/ButtonLink";
import Nothing from "./components/shell/Nothing";

// A 404 on the desk: `Nothing` on a panel, as `global-error` draws it, since nothing prints on the bare ground.

export default function NotFound() {
  return (
    <div className="cm-panel flex flex-col items-center px-6 pb-10">
      <Nothing title="Nothing at that address" code="404" page />
      <ButtonLink href="/">The front page</ButtonLink>
    </div>
  );
}
