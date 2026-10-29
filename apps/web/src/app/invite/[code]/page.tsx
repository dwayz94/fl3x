import { redirect } from "next/navigation";

/** Shareable link: fl3x.lol/invite/alice (or a code, ABCD-2345) */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/join?code=${encodeURIComponent(code)}`);
}
