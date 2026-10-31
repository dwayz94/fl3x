import Link from "next/link";
import { Brand, buttonClass } from "@/components/ui";
import { AuthHeader, AuthShell } from "./AuthShell";

/**
 * /@name with no profile behind it, answered on the server (no 404 first):
 * free → claim it; taken, reserved or invalid → say so.
 */
export function MissingProfile({ handle, available, reason }: { handle: string; available: boolean; reason: string | null }) {
  return (
    <AuthShell>
      {available ? (
        <AuthHeader title={<Brand>{`@${handle}`}</Brand>} subtitle={<>Nobody has claimed fl3x.lol/@{handle} yet. It could be yours.</>} />
      ) : (
        <AuthHeader title={<Brand>{`@${handle}`}</Brand>} subtitle={reason ?? "This name isn't available."} />
      )}
      <Link href={available ? `/join?username=${encodeURIComponent(handle)}` : "/join"} className={buttonClass({ className: "w-full" })}>
        {available ? `Claim @${handle}` : "Claim your own name"}
      </Link>
      <Link href="/" className="mt-4 text-sm text-fg-3 hover:text-fg">
        Back home
      </Link>
    </AuthShell>
  );
}
