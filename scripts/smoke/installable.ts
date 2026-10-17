// What an iPhone needs in a page's head to draw the installed app's launch screen: the startup images, and Apple's own
// "capable" tag beside them, which Next 16 stopped printing (it prints the generic `mobile-web-app-capable` alone).

const CAPABLE = /<meta[^>]*name="apple-mobile-web-app-capable"[^>]*content="yes"/;
const STARTUP = /rel="apple-touch-startup-image"/g;

/** Why an iPhone would show no launch screen for this page, or nothing when it would. */
export function launchScreenProblems(head: string): string[] {
  const images = head.match(STARTUP)?.length ?? 0;
  const problems: string[] = [];
  if (images === 0) problems.push("no apple-touch-startup-image link, so an installed iPhone draws no launch screen");
  if (!CAPABLE.test(head)) {
    problems.push(`${images} startup images but no apple-mobile-web-app-capable meta, so an iPhone ignores them`);
  }
  return problems;
}
