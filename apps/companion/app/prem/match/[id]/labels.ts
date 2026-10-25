// Names on the average-position map, kept apart when men bunch (Craig, 11 Sep 2026).
// The disc is a measurement and never moves; only the label does.

/** One man, already turned to face the way he is drawn. */
export interface Placed {
  /** FPL's season-stable code, the React key: two men can share a short name. */
  code: number;
  name: string;
  /** 0–100 along the pitch, 0 the goal line he defends. */
  x: number;
  /** 0–100 across it, 0 the top touchline as drawn. */
  y: number;
}

/** A man and where his name landed. */
export interface Labelled extends Placed {
  /** The label's own centre, in the same units as the disc's. */
  labelX: number;
  labelY: number;
  /** Where a line from his disc meets his name's box, for a name that had to sit nearer someone else; else null. */
  leader: { x: number; y: number } | null;
}

/** A label's height, as a percentage of the pitch's height; set for 9px type at 390. */
const ROW = 5;

/** One bold 9px character on a 345px pitch, as a percentage of its width; too low and names overlap. */
const CHAR = 1.8;

/** A disc's box, as percentages of the pitch: no name may sit on one, its own included. */
const DOT = { x: 3, y: 5 };

/** The gap between a disc's centre and its own name's: half the disc plus half the name. */
const CLEAR = (DOT.y + ROW) / 2;

/** Rows a label may travel either way before it gives up and sits under its man. */
const REACH = 3;

/** A percent of the pitch's height in percents of its width: the eye measures both in the same pixels. */
const ACROSS = 0.64;

/** Every man's name placed clear of the others and nearer him than anyone else, where room allows; a name that cannot
 *  be takes the nearest clear slot and a line to its man (Craig, 25 Oct 2026). Top down, then left to right. */
export function placeLabels(men: readonly Placed[]): Labelled[] {
  const placed: Labelled[] = [];

  for (const man of [...men].sort((a, b) => a.y - b.y || a.x - b.x || a.code - b.code)) {
    const half = width(man.name) / 2;
    const clear = slots(half)
      .map(({ dx, dy }) => ({ x: inside(man.x + dx, half), y: man.y + dy }))
      .filter(
        ({ x, y }) =>
          y >= ROW / 2 &&
          y <= 100 - ROW / 2 &&
          !placed.some((other) => collides(other, x, y, half)) &&
          !men.some((disc) => onDisc(disc, x, y, half)),
      );
    const own = clear.find(({ x, y }) => men.every((disc) => disc === man || gap(man, x, y, half) <= gap(disc, x, y, half)));
    const at = own ?? clear[0] ?? { x: inside(man.x, half), y: Math.min(man.y + CLEAR, 100 - ROW / 2) };
    placed.push({ ...man, labelX: at.x, labelY: at.y, leader: own === undefined ? meets(man, at.x, at.y, half) : null });
  }

  return placed;
}

/** The slots a name tries, nearest its man first: under him, over him, beside him, then a row further out each way. */
function slots(half: number): { dx: number; dy: number }[] {
  const side = DOT.x / 2 + half + 0.5;
  const out = [
    { dx: 0, dy: CLEAR },
    { dx: 0, dy: -CLEAR },
    { dx: side, dy: 0 },
    { dx: -side, dy: 0 },
  ];
  for (let row = 1; row <= REACH; row += 1) {
    const dy = CLEAR + row * ROW;
    out.push({ dx: 0, dy }, { dx: 0, dy: -dy }, { dx: side, dy: row * ROW }, { dx: -side, dy: row * ROW });
    out.push({ dx: side, dy: -row * ROW }, { dx: -side, dy: -row * ROW });
  }
  return out;
}

/** A label's centre kept inside the touchlines: the pitch clips what runs past its edge. */
function inside(x: number, half: number): number {
  return Math.min(Math.max(x, half + 1), 99 - half);
}

/** How far a disc sits from a label's box, as the eye measures it. */
function gap(disc: Placed, x: number, y: number, half: number): number {
  return Math.hypot(Math.max(0, Math.abs(disc.x - x) - half), Math.max(0, Math.abs(disc.y - y) - ROW / 2) * ACROSS);
}

/** The point of a label's box nearest its man's disc, where his line ends. */
function meets(disc: Placed, x: number, y: number, half: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(disc.x, x - half), x + half),
    y: Math.min(Math.max(disc.y, y - ROW / 2), y + ROW / 2),
  };
}

/** Whether a label at this centre would touch one already placed. */
function collides(other: Labelled, x: number, y: number, half: number): boolean {
  return (
    Math.abs(other.labelY - y) < ROW && Math.abs(other.labelX - x) < half + width(other.name) / 2
  );
}

/** Whether a label at this centre would sit on a man's disc. */
function onDisc(disc: Placed, x: number, y: number, half: number): boolean {
  return Math.abs(disc.y - y) < (ROW + DOT.y) / 2 && Math.abs(disc.x - x) < half + DOT.x / 2;
}

function width(name: string): number {
  return name.length * CHAR;
}
