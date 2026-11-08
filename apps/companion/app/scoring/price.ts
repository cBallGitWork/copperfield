/** A price's ink: a cost in the loss's red; a reward stays ink, as a ledger of scoring categories does (DESIGN §8). */
export function priceInk(band: string): string {
  return /^[-−]/.test(band) ? "text-bad" : "text-ink";
}
