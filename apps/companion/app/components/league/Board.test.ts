import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Board, { type BoardColumn } from "./Board";
import { LEAD_LINK } from "./LeadFace";
import { BUTTON, SELECT } from "../shell/ButtonLink";

vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));

const columns: BoardColumn<string>[] = [{ key: "g", head: "G", cell: () => ({ value: 1 }) }];

const render = (lead: object, extra: object = {}) =>
  renderToStaticMarkup(createElement(Board<string>, { rows: ["a"], keyOf: (row) => row, lead, columns, ...extra }));

/** Every class on each `<tr>` in the body, in order. */
const bodyRows = (html: string) =>
  [...(html.match(/<tbody>[\s\S]*<\/tbody>/)?.[0] ?? "").matchAll(/<tr[^>]*? class="([^"]*)"/g)].map((m) => m[1].split(/\s+/));

describe("the one board", () => {
  // Craig, 24 Oct 2026: "when you select a column to sort by, the background should fill for that column".
  it("fills the sorted column's cells, and only those", () => {
    const two: BoardColumn<string>[] = [...columns, { key: "a", head: "A", cell: () => ({ value: 2 }) }];
    const html = render({}, { columns: two, order: { key: "a", descending: true, href: (key: string) => `?sort=${key}` } });
    const cells = [...html.matchAll(/<td class="([^"]*)"/g)].map((m) => m[1].split(/\s+/).includes("cm-sorted"));
    expect(cells).toEqual([false, true]);
  });

  // Craig, 21 Oct 2026: "six different row heights". A row nobody taps is 24 under a thumb and 28 on a desk.
  it("sets every figures row at the read-only height", () => {
    const [row] = bodyRows(render({ index: { label: "Row", of: (row: string) => row } }));
    expect(row).toEqual(expect.arrayContaining(["h-6", "lg:h-7"]));
  });

  // The head was 28 over rows of 19: one 24px plate in 9px minor caps now, so a narrow board does not scroll.
  it("heads its figures on the 24px plate in minor caps", () => {
    const html = render({});
    expect(html).toMatch(/<tr class="text-3xs font-bold uppercase">/);
    expect(html).toMatch(/<div class="cm-bevel flex h-6 items-center whitespace-nowrap justify-center px-1\.5">G<\/div>/);
    expect(html.match(/<thead>[\s\S]*<\/thead>/)?.[0]).not.toContain("h-7");
  });

  // Two lines under a thumb make one 36px tap row (Craig, 21 Oct 2026): a 20px name line over 16px of figures.
  it("splits a two-line row 20 over 16 under a thumb, and keeps the desk's one 28px row", () => {
    const [line, figures] = bodyRows(render({ name: { label: "Player", of: (row: string) => row, line: (row: string) => row } }));
    expect(line).toEqual(expect.arrayContaining(["h-5", "lg:hidden"]));
    expect(figures).toEqual(expect.arrayContaining(["max-lg:h-4", "lg:h-7"]));
    expect(figures).not.toContain("h-6");
  });

  it("fills its panel unless asked to fit its figures", () => {
    expect(render({})).not.toContain("lg:w-auto");
    expect(render({}, { fit: true })).toContain("lg:w-auto");
  });

  // Craig, 21 Oct 2026: "These rows can be smaller no?" A tappable row is 36 under a thumb; a control keeps 44.
  it("draws a tappable row at 36 under a thumb and leaves a button at the thumb's 44", () => {
    const html = render({ name: { label: "Player", of: (row: string) => createElement("a", { href: `/p/${row}`, className: LEAD_LINK }, row) } });
    const link = html.match(/<a [^>]*class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(link).toEqual(expect.arrayContaining(["cm-row", "min-h-9"]));
    expect(link).not.toContain("min-h-11");
    for (const control of [BUTTON, SELECT]) expect(control.split(" ")).toEqual(expect.arrayContaining(["min-h-11", "lg:min-h-9"]));
  });
});
