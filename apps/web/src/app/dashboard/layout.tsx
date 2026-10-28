"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Spinner } from "@/components/dashboard/Panel";
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

  return (
    <div className="flex min-h-svh">
      <Sidebar me={me} avatarUrl={editor?.profile.avatarUrl ?? null} compact={pathname.startsWith("/dashboard/customize")} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
