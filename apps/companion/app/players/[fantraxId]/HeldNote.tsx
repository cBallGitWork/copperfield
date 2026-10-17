import { londonDayAndDate } from "@epl/core";
import Note from "../../components/league/Note";

// His season off the sister repo's copy rather than FPL's own answer: said, with when the copy was taken.

export default function HeldNote({ at }: { at: string }) {
  return <Note>{`Updated ${londonDayAndDate(at)}.`}</Note>;
}
