import { codeOrNull } from "../untrusted";

// The man a story prints a picture of; its own file so `story.ts` and `published.ts` need not import each other.

/** A player the page can print a picture of, by FPL's season-stable `code`; `clubId` is this season's, for the crest. */
export interface StoryFace {
  code: number;
  name: string;
  clubId: number;
  /** Fantrax's letter for his roster slot, so a keeper with no photograph gets a keeper's shirt. */
  position: string | null;
}

/** Every field or none: a partial face prints no picture rather than a broken one. */
export function normalizeFace(value: unknown): StoryFace | null {
  const face = value as Partial<StoryFace> | null;
  if (face === null || typeof face !== "object") return null;
  const [code, clubId] = [codeOrNull(face.code), codeOrNull(face.clubId)];
  if (code === null || typeof face.name !== "string" || face.name === "" || clubId === null) return null;
  return { code, name: face.name, clubId, position: typeof face.position === "string" ? face.position : null };
}
