/** What a squad row's points figure holds: a season's, Fantrax's projection, or the gameweek on screen. */
export type SquadFigure = "season" | "projected" | "gameweek";

/** Each figure's head word and title; the row and the card it opens print the same word. */
export const FIGURE_HEADS: Record<SquadFigure, { word: string; title: string }> = {
  season: { word: "FPts", title: "Points this season" },
  projected: { word: "Proj", title: "Projected points this season" },
  gameweek: { word: "GW", title: "Points this gameweek" },
};
