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
  const { ready, authenticated } = useAuth();
  const { data: me } = useMe();
  const { data: editor } = useEditorProfile();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/join");
    else if (me && !me.username) router.replace("/join");
  }, [ready, authenticated, me, router]);

  if (!me?.username) return <Spinner />;

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
