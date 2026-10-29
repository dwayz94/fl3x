import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/shared";
import { DevSessions } from "./DevSessions";

// Production serves a 404 here: the tab says so too, not "Test session".
export const metadata: Metadata =
  process.env.NODE_ENV === "production"
    ? { title: "Page not found", robots: { index: false, follow: false } }
    : { title: "Test session", robots: { index: false, follow: false } };

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
