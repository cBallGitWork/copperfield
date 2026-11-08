// Contrast arithmetic on hex colours, shared by both layers' plates (a club's, a team's), which may not import each other.

/** The desk's near-black, for a plate that wants dark ink. */
export const INK = "#0b0c10";

/** WCAG 2.1 relative luminance, not luma: skipping the sRGB linearisation gives white ink on a mid-tone orange. */
export function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const channels = [0, 2, 4].map((at) => parseInt(h.slice(at, at + 2), 16) / 255);
  const [r, g, b] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG contrast ratio of two hex colours, either way round. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** White or near-black, whichever contrasts more with `background`; the better of two bad answers on a mid-grey. */
export function inkFor(background: string): string {
  return contrast(background, "#ffffff") >= contrast(background, INK) ? "#ffffff" : INK;
}
