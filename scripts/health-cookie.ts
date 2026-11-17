import { cookieValue } from "../apps/companion/app/sessionCookie";

// Prints the cookie production's Health walk reads the player section with: signed for `HEALTH_TEAM`, a team no league
// has, so it passes the gate and can act for no manager. Set it as the repository secret HEALTH_TEAM_COOKIE.
// Run by hand: it prints a secret to a terminal.

/** Matches no Fantrax team id, so the cookie names nobody's squad. */
const HEALTH_TEAM = "health";

async function main(): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("SESSION_SECRET is not in apps/companion/.env.local, the value the deployment signs cookies with.");
    process.exitCode = 1;
    return;
  }
  console.log(await cookieValue(HEALTH_TEAM, secret));
}

// Not awaited: these scripts transpile to CJS, and a rejection should crash loudly.
void main();
