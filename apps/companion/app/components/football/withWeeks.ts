import { createElement, type ReactElement } from "react";
import { ReturnWeeks } from "./FitnessNote";

// For tests: a row drawn under the root layout's return weeks, FPL code 1 due back in GW10 unless told otherwise.

export const WEEKS: Record<number, number> = { 1: 10 };

export const withWeeks = (element: ReactElement, weeks: Record<number, number> = WEEKS) =>
  createElement(ReturnWeeks, { weeks }, element);
