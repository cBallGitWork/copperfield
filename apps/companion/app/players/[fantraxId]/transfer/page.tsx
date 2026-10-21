import { redirect } from "next/navigation";
import { playerHref } from "../../routes";

// Transfer folded into the Profile on 21 Oct 2026; an old link lands on the Profile, where his status now is.
export default async function PlayerTransfer({ params }: { params: Promise<{ fantraxId: string }> }) {
  const { fantraxId } = await params;
  redirect(playerHref(fantraxId));
}
