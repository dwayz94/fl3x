import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/shared";
import { JoinFlow } from "./JoinFlow";

export const metadata: Metadata = {
  title: "Join",
  description: "Claim your FL3X username: sign in with X, link your wallets, and get a profile with live crypto widgets. Free to start.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <AuthShell>
      <Suspense>
        <JoinFlow />
      </Suspense>
    </AuthShell>
  );
}
