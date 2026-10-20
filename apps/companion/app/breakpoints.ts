// Tailwind's `lg`, the line between a thumb and a desk (DESIGN §1), for what its classes cannot reach: `sizes`, matchMedia.

const LG_WIDTH = "64rem";

/** From `lg` up: the desk. */
export const LG = `(min-width: ${LG_WIDTH})`;

/** Under `lg`: the thumb. */
export const BELOW_LG = `(width < ${LG_WIDTH})`;
