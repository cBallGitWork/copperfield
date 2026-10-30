"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Failed from "./Failed";

/** `Failed` for a server-drawn part of a page: Try again asks for the page anew, as an empty answer is never stored. */
export default function PageFailed({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <Failed onRetry={() => router.refresh()}>{children}</Failed>;
}
