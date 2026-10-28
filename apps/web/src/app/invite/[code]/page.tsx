import { redirect } from "next/navigation";

/** Shareable link: fl3x.lol/invite/FL3X-ABC123 */
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/join?code=${encodeURIComponent(code)}`);
}
