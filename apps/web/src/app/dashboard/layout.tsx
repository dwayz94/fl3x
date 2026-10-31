"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Spinner } from "@/components/dashboard/Panel";
import { PageFade } from "@/components/dashboard/PageFade";
import { useEditorProfile } from "@/lib/use-profile";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, authenticated, logout } = useAuth();
  const { data: me, isError: meError, refetch: refetchMe } = useMe();
  const { data: editor } = useEditorProfile();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/join");
    else if (me && !me.username) router.replace("/join");
  }, [ready, authenticated, me, router]);

  if (meError) {
    // Expired session or API down: say so instead of spinning forever.
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-primary text-3xl">Can&apos;t reach FL3X</p>
        <p className="max-w-sm text-sm text-fg-3">Your session may have expired, or we&apos;re restarting. Try again in a moment.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => void refetchMe()} className="rounded-xl bg-brand px-4 py-2 text-sm text-bg">
            Try again
          </button>
          <button type="button" onClick={() => void logout().then(() => router.replace("/"))} className="rounded-xl bg-white/[0.08] px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </div>
    );
  }
  if (!me?.username) return <Spinner screen />;

  // Customize is a full-screen mode of its own (back button, no sidebar).
  if (pathname.startsWith("/dashboard/customize")) return children;

  return (
    <div className="flex min-h-svh">
      <Sidebar me={me} avatarUrl={editor?.profile.avatarUrl ?? null} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <PageFade id={pathname}>{children}</PageFade>
      </main>
    </div>
  );
}
