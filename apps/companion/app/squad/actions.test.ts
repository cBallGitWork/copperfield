import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({ teamForCode: vi.fn(), sign: vi.fn(), redirect: vi.fn(), set: vi.fn() }));
vi.mock("../session", () => ({ teamForCode: calls.teamForCode, sign: calls.sign }));
vi.mock("next/navigation", () => ({ redirect: calls.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: calls.set, delete: vi.fn() }) }));
vi.mock("../config", async (original) => ({ ...(await original<object>()), WRONG_CODE_DELAY_MS: 0 }));

import { claimTeam } from "./actions";
import { MY_TEAM } from "./routes";

/** The sign-in form as posted, holding one code. */
function posted(code: string): FormData {
  const form = new FormData();
  form.set("code", code);
  return form;
}

beforeEach(() => vi.clearAllMocks());

describe("signing in with a code", () => {
  it("lands a good code on the reader's own team, not the list of squads", async () => {
    calls.teamForCode.mockResolvedValue("t1");
    calls.sign.mockResolvedValue("signed");
    await claimTeam(null, posted("GOOD1234"));
    expect(calls.redirect).toHaveBeenCalledWith(MY_TEAM);
  });

  // The box was wiped on a wrong code, so a one-letter slip meant typing all eight again.
  it("hands a wrong code back with the message, so the box keeps it", async () => {
    calls.teamForCode.mockResolvedValue(null);
    const answer = await claimTeam(null, posted("WRONG123"));
    expect(answer).toEqual({ message: "That code does not match a team.", code: "WRONG123" });
    expect(calls.redirect).not.toHaveBeenCalled();
  });
});
