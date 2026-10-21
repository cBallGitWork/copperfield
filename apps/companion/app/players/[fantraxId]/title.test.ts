import { describe, expect, it, vi } from "vitest";
import type { FootballPlayer } from "@epl/core";

const read = vi.hoisted(() => ({ subject: vi.fn() }));
vi.mock("./subject", () => ({ subject: read.subject }));
vi.mock("./PlayerTabs", () => ({ PLAYER_TAB_LABEL: { profile: "Profile", data: "Data", news: "News" } }));

import { playerTitle } from "./title";

const params = Promise.resolve({ fantraxId: "04fk1" });

describe("a player's title", () => {
  it("spells him as the bar does, not as the provider registered him", async () => {
    const player = { name: "Groß", fullName: "Pascal Groß" } as FootballPlayer;
    read.subject.mockResolvedValue({ intel: { name: "Pascal Gross" }, football: { player, club: undefined }, ownerName: null });
    expect(await playerTitle("data")({ params })).toEqual({ title: "Pascal Groß · Data" });
  });

  it("names the tab alone when his profile was refused", async () => {
    read.subject.mockResolvedValue({ unavailable: "getPlayerProfile → WARNING" });
    expect(await playerTitle("profile")({ params })).toEqual({ title: "Profile" });
  });
});
