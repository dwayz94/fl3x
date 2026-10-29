import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/shared";
import { DevSessions } from "./DevSessions";

export const metadata: Metadata = { title: "Test session", robots: { index: false, follow: false } };

// Local test sessions only: the API route behind it doesn't exist in production either.
export default function DevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <AuthShell>
      <Suspense>
        <DevSessions />
      </Suspense>
    </AuthShell>
  );
}
