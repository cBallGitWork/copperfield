"use client";

import { type ReactNode, useState } from "react";
import { PANEL } from "@/app/desk";
import { FOOT_DOCK } from "../shell/FootFrame";
import BothReadings from "./BothReadings";
import ViewToggle, { type View } from "./ViewToggle";

/** A squad's list and pitch: both above `lg`, one at a time behind the toggle below it, `opens` first. Given `beside`,
 *  the toggle shares its row and one panel frames the two, as a squad's sheet sets them. Given `foot`, the toggle
 *  docks above the thumb rail instead and `beside` keeps the top row alone. */
export default function ListAndPitch({
  opens,
  beside,
  foot = false,
  list,
  pitch,
}: {
  opens: View;
  /** Beside the toggle on a phone and alone at the right on a desk: a squad's pending points and its week. */
  beside?: ReactNode;
  /** Dock the toggle at the screen's foot, as a sub-view switch; never the planner's, whose foot is `SaveBar`'s. */
  foot?: boolean;
  list: ReactNode;
  pitch: ReactNode;
}) {
  // Phone only — above `lg` both are drawn and the control is hidden.
  const [view, setView] = useState<View>(opens);
  const toggle = <ViewToggle view={view} onPick={setView} />;
  const both = <BothReadings view={view} list={list} pitch={pitch} />;
  const framed = beside === undefined ? both : <section className={PANEL}>{both}</section>;

  if (foot)
    return (
      // `flex-1` and the dock's `mt-auto` reach the screen's foot when this is a `FootFrame`'s last block.
      <div className="flex flex-1 flex-col gap-2">
        {beside === undefined ? null : <div className="flex items-center justify-end gap-2 px-1">{beside}</div>}
        {framed}
        <div className={`${FOOT_DOCK} flex lg:hidden`}>{toggle}</div>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      {beside === undefined ? (
        <div className="lg:hidden">{toggle}</div>
      ) : (
        <div className="flex items-center gap-2 px-1 lg:justify-end">
          <div className="flex flex-1 lg:hidden">{toggle}</div>
          {beside}
        </div>
      )}
      {framed}
    </div>
  );
}
