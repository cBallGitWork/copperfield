import { createElement, type ReactElement } from "react";
import { ReturnWeeks } from "./FitnessNote";

// For tests: a row drawn under the root layout's return weeks, FPL code 1 due back in GW10 with GW8 open.

export const WEEKS: Record<number, number> = { 1: 10 };
export const OPEN = 8;

export const withWeeks = (element: ReactElement, weeks: Record<number, number> = WEEKS, open: number | null = OPEN) =>
  createElement(ReturnWeeks, { weeks, open }, element);

/** A note's markup as `FitnessNote` prints it: the return in figures, "Knee · <numeric>GW10</numeric>". */
export const noted = (word: string, back: string | null = null) =>
  back === null ? word : `${word} · <span class="numeric">${back}</span>`;
