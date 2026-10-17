import type { ReactNode } from "react";
import ReadViews from "../components/shell/ReadViews";

// Mail's pages open under Read's strip, so the Gazetta is a tap away.

export default function MailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <ReadViews current="mail" />
      {children}
    </div>
  );
}
