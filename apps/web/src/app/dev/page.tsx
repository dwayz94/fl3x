import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/shared";
import { DevSessions } from "./DevSessions";

export const metadata: Metadata = { title: "Test session", robots: { index: false } };

export default function DevPage() {
  return (
    <AuthShell>
      <Suspense>
        <DevSessions />
      </Suspense>
    </AuthShell>
  );
}
