import LeagueCrest from "./LeagueCrest";

// A page that cannot show what it exists to show; most are ordinary states, like a league not yet drafted.
// `code` names the read that failed, on the element for an inspector and never on screen.

export default function Nothing({
  title,
  code,
  page = false,
  children,
  action,
}: {
  title: string;
  code?: string;
  /** No title bar above it, as on the 404: its title is the page's h1. Under a bar it is an h2, the bar's h1 stands. */
  page?: boolean;
  children?: React.ReactNode;
  /** The one thing to press, under the words. */
  action?: React.ReactNode;
}) {
  const Head = page ? "h1" : "h2";
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center" data-code={code}>
      <LeagueCrest variant="full" height={104} />
      <div className="flex flex-col gap-1.5">
        <Head className="font-chrome text-2xl font-bold tracking-tight">{title}</Head>
        {children ? <p className="mx-auto max-w-xs text-sm text-muted">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}
