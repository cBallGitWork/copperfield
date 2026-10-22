/** A drop-down's caret: turned up while its `group` is open, or by `open` where a button holds the state. */
export default function Chevron({ open, className = "h-4 w-4" }: { open?: boolean; className?: string }) {
  const turn = open === undefined ? "group-open:rotate-180" : open ? "rotate-180" : "";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`${className} shrink-0 text-faint transition-transform duration-200 ${turn}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
