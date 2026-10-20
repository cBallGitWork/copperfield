import type { InboxItem, Mention } from "@epl/core";
import { bodySpans, londonMoment } from "@epl/core";
import { LABEL } from "@/app/desk";
import Link from "@/app/components/shell/Link";
import { playerHref } from "@/app/players/routes";
import { teamHref } from "@/app/squad/routes";
import ButtonLink from "../components/shell/ButtonLink";

/** The item you are reading, as a letter in a panel: From, Subject in CM's yellow, Date, then the body. */
export default function Letter({ item }: { item: InboxItem }) {
  const moment = item.at === null ? null : londonMoment(item.at);
  return (
    <article className="cm-panel flex flex-col p-3 lg:min-h-[22rem] lg:p-5">
      {/* A mail client's head: who it is from, what it is about, when it came. */}
      <header className="flex flex-col gap-2 border-b border-line pb-3">
        <Field label="From">{item.from}</Field>
        {/* The `h2` is the field's value itself, so it keeps the head's baseline. */}
        <Field label="Subject" as="h2" accent>
          {item.headline}
        </Field>
        {moment === null ? null : <Field label="Date">{moment}</Field>}
        {/* Only when the sender ("The FA", "The transfer desk") does not already name the squad. */}
        {item.about === null ? null : <Field label="Squad">{item.about}</Field>}
      </header>
      <p className="pt-3 text-sm leading-relaxed text-ink lg:pt-4 lg:text-base">
        {/* Each man to his page and each team to its squad; the words are the body's own. */}
        {bodySpans(item.body, item.mentions ?? []).map((span, at) =>
          span.mention === null ? (
            span.text
          ) : (
            <Link
              key={at}
              href={mentionHref(span.mention)}
              className="underline decoration-muted underline-offset-2 hover:decoration-ink"
            >
              {span.text}
            </Link>
          ),
        )}
      </p>
      {item.link === undefined ? null : (
        <div className="flex pt-3 lg:pt-4">
          <ButtonLink href={item.link.href}>{item.link.label}</ButtonLink>
        </div>
      )}
    </article>
  );
}

function mentionHref(mention: Mention): string {
  return "fantraxId" in mention ? playerHref(mention.fantraxId) : teamHref(mention.teamId);
}

/** One line of the letter's head: a fixed-width label, so the values line up, then the fact. */
function Field({
  label,
  children,
  as: Tag = "span",
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  as?: "span" | "h2";
  /** The Subject's accent; a flag, not a `className`, because two colour utilities resolve by stylesheet order. */
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${LABEL} w-12 shrink-0 lg:w-16`}>{label}</span>
      <Tag
        className={`min-w-0 flex-1 ${
          accent ? "cm-title font-chrome text-sm font-bold text-accent lg:text-lg" : "text-sm text-ink lg:text-base"
        }`}
      >
        {children}
      </Tag>
    </div>
  );
}
