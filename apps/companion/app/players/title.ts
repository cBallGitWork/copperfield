import type { Metadata } from "next";
import { SCOUT, labelOf, titled } from "../titles";
import { SCOUT_VIEWS, type ScoutView } from "./PoolNav";

/** A Data view's title: the lit tab, then the section its bar names. */
export function scoutTitle(view: ScoutView): Metadata {
  return titled(labelOf(SCOUT_VIEWS, view), SCOUT);
}
