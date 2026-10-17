"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SEASON_IN_SECONDS, TEAM_COOKIE, WRONG_CODE_DELAY_MS } from "../config";
import { sign, teamForCode } from "../session";
import { MY_TEAM, SQUAD } from "./routes";

// Signing in and out, neither of which touches Fantrax.

/** A refused sign-in: what to say, and the code as typed, which the box keeps. */
export interface Refused {
  message: string;
  code: string;
}

/** Claim a team with the commissioner's code; a mistyped code is ordinary, so it answers a message rather than throwing. */
export async function claimTeam(_previous: Refused | null, form: FormData): Promise<Refused | null> {
  const code = String(form.get("code") ?? "");
  const teamId = await teamForCode(code);

  if (teamId === null) {
    // Slow, because there is no rate limiter in front of this and ten teams
    // is a small haystack. Not slow enough to be felt by someone typing it right.
    await new Promise((resolve) => setTimeout(resolve, WRONG_CODE_DELAY_MS));
    return { message: "That code does not match a team.", code };
  }

  const value = await sign(teamId);
  if (value === null) return { message: "Sign-in is not configured on this deployment.", code };

  (await cookies()).set(TEAM_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEASON_IN_SECONDS,
  });

  revalidatePath("/", "layout");
  // His own team, through the front door, so Team lights.
  redirect(MY_TEAM);
}

export async function forgetTeam(): Promise<void> {
  (await cookies()).delete(TEAM_COOKIE);
  revalidatePath("/", "layout");
  redirect(SQUAD);
}
