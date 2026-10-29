"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A bar held at one edge of a phone's screen, publishing its height as `--top-bar` or `--foot-bar` so whatever else
 *  pins to that edge (`--pin-top`, `--pin-foot` in `globals.css`) stacks beside it rather than behind it. */
export default function Pinned({
  edge,
  className,
  children,
}: {
  edge: "top" | "foot";
  /** The pinning itself; `--pin-top` and `--pin-foot` ignore the height from `lg`, where the desk pins nothing beside it. */
  className: string;
  children: ReactNode;
}) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = bar.current;
    if (node === null) return;
    const root = document.documentElement.style;
    const name = `--${edge}-bar`;
    const sizes = new ResizeObserver(() => root.setProperty(name, `${node.getBoundingClientRect().height}px`));
    sizes.observe(node);
    return () => {
      sizes.disconnect();
      root.removeProperty(name);
    };
  }, [edge]);

  return (
    <div ref={bar} className={className}>
      {children}
    </div>
  );
}
