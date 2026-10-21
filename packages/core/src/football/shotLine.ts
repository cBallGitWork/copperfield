import type { Shot } from "./intel/shots";

// A man's season on the sister repo's shot map: his Rankings' shots and CM's Preferred Foot.

/** One man's season on the sister repo's shot map. */
export interface ShotLine {
  struck: number;
  left: number;
  right: number;
}

/** His line on the shot map: his own shots and the feet he struck them with. */
export function shotLine(own: readonly Shot[]): ShotLine {
  return {
    struck: own.length,
    left: own.filter((shot) => shot.bodyPart === "left-foot").length,
    right: own.filter((shot) => shot.bodyPart === "right-foot").length,
  };
}

/** Fewer footed shots than this say nothing about his foot. */
const FOOTED_FLOOR = 5;
/** A weaker foot taking this share of his footed shots makes him two-footed. */
const EITHER = 1 / 3;

/** CM's Preferred Foot, read off the feet he shoots with; null until he has shot enough. */
export function preferredFoot(line: ShotLine | null): "Right" | "Left" | "Either" | null {
  if (line === null) return null;
  const footed = line.left + line.right;
  if (footed < FOOTED_FLOOR) return null;
  if (Math.min(line.left, line.right) / footed >= EITHER) return "Either";
  return line.right > line.left ? "Right" : "Left";
}
