// A board's places, as a table counts them: a row level with the one above shares its place, the next skips (1, 2, 2, 4).

/** Each row's place in `sorted`, best first, where `level` says two neighbours are tied. */
export function sharedPlaces<T>(sorted: readonly T[], level: (above: T, row: T) => boolean): number[] {
  const places: number[] = [];
  sorted.forEach((row, at) => {
    places.push(at > 0 && level(sorted[at - 1], row) ? places[at - 1] : at + 1);
  });
  return places;
}
