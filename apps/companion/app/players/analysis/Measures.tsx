import type { Attribute } from "@epl/core";
import Section from "../../components/shell/Section";
import PairLedger, { whole } from "./PairLedger";

// The two men's ratings on CM's grid, figure · label · figure, the better one louder and never red (Craig, 10 Sep 2026:
// no name row). Rows align by name, so a keeper's Reflexes never sit against a striker's Finishing.

export default function Measures({
  a,
  b,
  names,
}: {
  a: readonly Attribute[];
  /** Empty when only one man is being looked at. */
  b: readonly Attribute[];
  names: { a: string; b: string | null };
}) {
  const alone = names.b === null;
  const rows = align(a, alone ? [] : b);
  if (rows.length === 0) return null;

  return (
    <Section title="Attributes" aside="1–20, per 90">
      <PairLedger
        alone={alone}
        caption={
          alone
            ? `${names.a} by every attribute he has`
            : `${names.a} and ${names.b} by every attribute either of them has`
        }
        lines={rows.map((row) => ({
          key: `${row.name}|${row.from}`,
          label: row.name,
          from: row.from,
          a: row.a,
          b: row.b,
          shown: { a: whole(row.a), b: whole(row.b) },
        }))}
      />
    </Section>
  );
}

/** One measure, as both of them have it. */
interface Row {
  name: string;
  from: string;
  a: number | null;
  b: number | null;
}

/** Every measure either man has, the first's order then the second's extras, keyed on name and source. */
function align(a: readonly Attribute[], b: readonly Attribute[]): Row[] {
  const handle = (attribute: Attribute) => `${attribute.name}|${attribute.from}`;
  const second = new Map(b.map((attribute) => [handle(attribute), attribute]));
  const rows: Row[] = a.map((attribute) => ({
    name: attribute.name,
    from: attribute.from,
    a: attribute.rating,
    b: second.get(handle(attribute))?.rating ?? null,
  }));

  const first = new Set(a.map(handle));
  for (const attribute of b) {
    if (first.has(handle(attribute))) continue;
    rows.push({ name: attribute.name, from: attribute.from, a: null, b: attribute.rating });
  }
  return rows;
}
