// The deployment production is serving now, for a page pinned to an older one to notice (`shell/newerBuild`).
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ deployment: process.env.VERCEL_DEPLOYMENT_ID ?? null }, { headers: { "Cache-Control": "no-store" } });
}
