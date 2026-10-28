import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/shared";
import { JoinFlow } from "./JoinFlow";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <AuthShell>
      <Suspense>
        <JoinFlow />
      </Suspense>
    </AuthShell>
  );
}
