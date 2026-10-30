import type { FootballPlayer, SquadPlayerDetail } from "@epl/core";

// A squad man for tests, keyed by name in his Fantrax slot; player fields override the stub.
export const man = (name: string, position: string, points: number | null, player: Partial<FootballPlayer> = {}): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId: name, position, status: "" }, player: { code: 1, name, ...player } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: undefined,
  points,
  minutes: [],
});
