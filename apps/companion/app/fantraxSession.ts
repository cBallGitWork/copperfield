// The commissioner's Fantrax cookie, from the environment only: never logged, never sent to a browser.

/** The cookie, or null where this environment has none. */
export function fantraxSession(): string | null {
  return process.env.FANTRAX_COOKIE || null;
}
