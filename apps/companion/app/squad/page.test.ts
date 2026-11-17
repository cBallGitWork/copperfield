import { describe, expect, it, vi } from "vitest";

const reads = vi.hoisted(() => ({ signedIn: vi.fn() }));
vi.mock("../session", () => ({ signedIn: reads.signedIn }));
vi.mock("./SquadIndex", () => ({ default: function SquadIndex() {} }));
vi.mock("./SignIn", () => ({ default: function SignIn() {} }));
vi.mock("../league/SectionNav", () => ({ default: () => null }));
vi.mock("../components/shell/PageHeader", () => ({ default: () => null }));

import SquadsPage from "./page";
import SquadIndex from "./SquadIndex";

/** The page's props for a query. */
const props = (query: { next?: string }) => ({ searchParams: Promise.resolve(query) });

/** The elements a page drew, one level down. */
const drawn = (page: unknown) => [(page as { props: { children: unknown } }).props.children].flat();

// 17 Nov 2026: crawlers followed the player gate to /squad and paid a Fantrax read each.
describe("the player gate's landing", () => {
  it("draws only the code box for a signed-out reader the gate sent, reading no league", async () => {
    reads.signedIn.mockResolvedValue(false);
    const page = await SquadsPage(props({ next: "/players/stats" }));
    expect((page as { type: unknown }).type).not.toBe(SquadIndex);
    const signIn = drawn(page).find((child) => (child as { type?: { name?: string } }).type?.name === "SignIn");
    expect((signIn as { props: { next: string } }).props.next).toBe("/players/stats");
  });

  it("draws the squads for a signed-in reader, even with a page to return to", async () => {
    reads.signedIn.mockResolvedValue(true);
    expect(((await SquadsPage(props({ next: "/players" }))) as { type: unknown }).type).toBe(SquadIndex);
  });

  it("draws the squads for a plain visit, signed out or not", async () => {
    reads.signedIn.mockResolvedValue(false);
    expect(((await SquadsPage(props({}))) as { type: unknown }).type).toBe(SquadIndex);
  });

  it("draws the squads when `next` points anywhere but the player section", async () => {
    reads.signedIn.mockResolvedValue(false);
    expect(((await SquadsPage(props({ next: "https://evil.example" }))) as { type: unknown }).type).toBe(SquadIndex);
  });
});
