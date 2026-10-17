import { describe, expect, it } from "vitest";
import type { AvailabilityNote } from "../gazette/types";
import { availabilityNews } from "./doubts";
import { inboxItems, roundNews } from "./items";
import { dealNews } from "./messages";

describe("roundNews", () => {
  it("files the deadline and the reader's own result", () => {
    const items = roundNews({
      gameweek: 3,
      deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
      yours: [{ opponent: "Dave's XI", points: 61.4, against: 58.9, href: "h" }],
    });
    expect(items.map((item) => item.headline)).toEqual([
      "Gameweek 3 line-ups lock",
      "You beat Dave's XI in gameweek 3",
    ]);
  });

  it("says when lineups lock the way the commissioner would, in London time", () => {
    // The time and day are the lock's own.
    const [lock] = roundNews({ gameweek: 6, deadline: { gameweek: 6, locksAt: "2026-10-10T11:15:00Z" }, yours: [] });
    expect(lock.body).toBe("Line-ups lock at 12:15 on Saturday 10 October.");
  });

  it("sends the lock letter to the reader's team and the result to the head-to-head", () => {
    const [lock, result] = roundNews({
      gameweek: 3,
      deadline: { gameweek: 4, locksAt: "2026-09-11T18:45:00Z" },
      yours: [{ opponent: "D", points: 50, against: 40, href: "/league/matchups/t1?gw=3&vs=t2" }],
      team: "/squad/me",
    });
    expect(lock.link).toEqual({ href: "/squad/me", label: "Your team" });
    expect(result.link).toEqual({ href: "/league/matchups/t1?gw=3&vs=t2", label: "Head-to-head" });
  });

  it("gives a signed-out reader's lock letter no button", () => {
    const [lock] = roundNews({ gameweek: 3, deadline: { gameweek: 4, locksAt: "2026-09-11T18:45:00Z" }, yours: [] });
    expect(lock.link).toBeUndefined();
  });

  it("goes red for a defeat and not for a win or a draw", () => {
    const result = (points: number, against: number) =>
      roundNews({ gameweek: 3, deadline: null, yours: [{ opponent: "D", points, against, href: "h" }] })[0];
    expect(result(1, 2).urgent).toBe(true);
    expect(result(2, 1).urgent).toBe(false);
    expect(result(2, 2).urgent).toBe(false);
    expect(result(2, 2).headline).toBe("You drew with D in gameweek 3");
  });

  it("files both results of a double header, each under its own id", () => {
    const items = roundNews({
      gameweek: 34,
      deadline: null,
      yours: [{ opponent: "A", points: 50, against: 40, href: "h" }, { opponent: "B", points: 50, against: 60, href: "h" }],
    });
    expect(items.map((item) => [item.id, item.headline])).toEqual([
      ["result:34", "You beat A in gameweek 34"],
      ["result:34:B", "B beat you in gameweek 34"],
    ]);
  });

  it("files nothing for a tie with no score", () => {
    // A round nobody has played is not a nil-nil. `points` is null exactly when
    // Fantrax gave no total (DESIGN §7).
    expect(
      roundNews({ gameweek: 3, deadline: null, yours: [{ opponent: "D", points: null, against: 0, href: "h" }] }),
    ).toEqual([]);
  });
});

describe("inboxItems", () => {
  const hurt = (playerName: string, newsAt: string | null): AvailabilityNote => ({
    fantraxId: playerName,
    playerName,
    fullName: `${playerName} Player`,
    newsAt,
    teamId: "t1",
    state: "injured",
    label: "Inj",
    out: true,
    news: "n",
    chance: 0,
  });

  const squads = { mine: "t1", opponents: ["t2"], name: () => "Mine", page: (fantraxId: string) => fantraxId };

  it("puts dated items first, newest first, and undated ones after", () => {
    const items = inboxItems(
      // A doubt stamped BETWEEN the other two, which is the whole point of it
      // carrying a date: it sorts into the feed rather than arriving in a block
      // at the foot of it.
      availabilityNews([hurt("P", "2026-09-04T20:00:00Z")], 3, squads),
      roundNews({
        gameweek: 3,
        deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
        yours: [],
      }),
      // Fantrax's own stamp, as `Deal.processedAt` carries it: 9AM Eastern on the 5th is after the 4th's deadline.
      dealNews(
        [
          {
            setId: "s1",
            kind: "claim",
            inbound: [{ playerName: "Alexander Isak", teamId: "t1", club: "LIV" }],
            outbound: [],
            processedAt: "Sat Sep 5, 2026, 9:00AM",
            period: 3,
          },
        ],
        () => "Craig's XI",
        null,
      ),
    );
    expect(items.map((item) => item.id)).toEqual([
      "deal:s1",
      "doubt:t1:P",
      "deadline:3",
    ]);
  });

  it("files a result at its gameweek's last full time, among the dated", () => {
    // Undated, it sorted under every doubt and deal: row 44 of 44.
    const items = inboxItems(
      availabilityNews([hurt("Before", "2026-09-05T09:00:00Z")], 3, squads),
      roundNews({
        gameweek: 3,
        deadline: null,
        yours: [{ opponent: "D", points: 50, against: 40, href: "h" }],
        finishedAt: "2026-09-07T21:55:00.000Z",
      }),
      availabilityNews([hurt("After", "2026-09-08T09:00:00Z")], 4, squads),
    );
    expect(items.map((item) => item.id)).toEqual(["doubt:t1:After", "result:3", "doubt:t1:Before"]);
  });

  it("leaves the undated at the foot, in their builder's order", () => {
    // What is left undated is a doubt FPL published no stamp for, and the
    // round's own result — a fact about a finished tie rather than an event.
    const items = inboxItems(
      availabilityNews([hurt("Second", null), hurt("First", null)], 3, squads),
      roundNews({
        gameweek: 3,
        deadline: { gameweek: 3, locksAt: "2026-09-04T18:45:00Z" },
        yours: [],
      }),
    );
    expect(items.map((item) => item.id)).toEqual([
      "deadline:3",
      "doubt:t1:Second",
      "doubt:t1:First",
    ]);
  });

});
