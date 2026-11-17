import { NextResponse, type NextRequest } from "next/server";
import { TEAM_COOKIE } from "./app/config";
import { START, openedCold } from "./app/landing";
import { gated, signInFor } from "./app/playersGate";
import { cookieTeamOf } from "./app/sessionCookie";

/** The team a request's cookie was signed for, or null when it has none or a forged one. */
async function teamOf(request: NextRequest, secret: string): Promise<string | null> {
  const raw = request.cookies.get(TEAM_COOKIE)?.value;
  return raw ? cookieTeamOf(raw, secret) : null;
}

/** The player section sends a reader with no team to Squad's sign-in. A signed-in reader opening `/` from outside the
 *  site goes to `START`; everybody else gets the paper. `/?paper` is the paper for anybody, which is how an instrument
 *  shoots it signed in. A deployment with no secret, where nobody can sign in, gates nothing. */
export async function proxy(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (gated(pathname)) {
    if ((await teamOf(request, secret)) !== null) return NextResponse.next();
    return NextResponse.redirect(new URL(signInFor(`${pathname}${search}`), request.url));
  }
  if (request.nextUrl.searchParams.has("paper") || !openedCold(request.headers)) return NextResponse.next();
  if ((await teamOf(request, secret)) === null) return NextResponse.next();
  return NextResponse.rewrite(new URL(START, request.url));
}

export const config = { matcher: ["/", "/players/:path*"] };
