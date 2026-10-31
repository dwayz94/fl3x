"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NewTwitterIcon } from "@hugeicons/core-free-icons";
import type { WaitlistStatus } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { AuthHeader } from "@/components/shared";
import { Button, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

// Survives the X OAuth round-trip so we land back on the waitlist step.
const INTENT_KEY = "fl3x:intent";
export const wantsWaitlist = () => {
  try { return localStorage.getItem(INTENT_KEY) === "waitlist"; } catch { return false; }
};
const setIntent = (on: boolean) => {
  try { if (on) localStorage.setItem(INTENT_KEY, "waitlist"); else localStorage.removeItem(INTENT_KEY); } catch {}
};

/** Waitlist = sign in with X. No form: the handle comes from the linked account. */
export function WaitlistForm({ desiredUsername, onBack }: { desiredUsername: string; onBack: () => void }) {
  const { authenticated, pending, login, linkTwitter, getToken } = useAuth();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["waitlist"],
    enabled: authenticated,
    queryFn: async () => api<WaitlistStatus>("/me/waitlist", { token: await getToken() }),
  });
  const join = useMutation({
    mutationFn: async () =>
      api<WaitlistStatus>("/me/waitlist", { token: await getToken(), json: { desiredUsername: desiredUsername || undefined } }),
    onSuccess: (s) => {
      setIntent(false);
      qc.setQueryData(["waitlist"], s);
    },
  });

  // Back from X: join right away, once.
  const tried = useRef(false);
  useEffect(() => {
    if (tried.current || !status.data || status.data.joined || !me?.xHandle) return;
    tried.current = true;
    join.mutate();
  }, [status.data, me?.xHandle, join]);

  const back = () => {
    setIntent(false);
    onBack();
  };

  if (status.data?.joined) {
    const s = status.data;
    return (
      <>
        <AuthHeader title="You're in line" subtitle="We'll DM you on X as soon as a spot opens." />
        <div className="w-full rounded-[24px] bg-[#121212] p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-primary text-2xl leading-none">@{s.xHandle}</p>
              {desiredUsername && <p className="mt-1 truncate text-xs text-fg-3">wants fl3x.lol/@{desiredUsername}</p>}
            </div>
            <p className="shrink-0 font-primary text-4xl leading-none">
              #{s.position?.toLocaleString("en-US")}
              <span className="text-base text-fg-3">/{s.total.toLocaleString("en-US")}</span>
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, 100 - ((s.position ?? s.total) / Math.max(1, s.total)) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-fg-2">Got an invite from a friend? You can skip the line.</p>
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={back}>
          I have an invite code
        </Button>
      </>
    );
  }

  const signedInWithoutX = authenticated && me && !me.xHandle;
  // Already signed in with X (the auto-join failed): the button joins again instead of reopening sign-in.
  const canJoin = authenticated && Boolean(me?.xHandle);
  const error = join.error ?? status.error;

  return (
    <>
      <AuthHeader
        title="Join the waitlist"
        subtitle={signedInWithoutX ? "The waitlist works with X. Link your account to get in line." : "Sign in with X and you're in line. We'll DM you when a spot opens."}
      />
      <Button
        className="w-full"
        loading={pending || join.isPending || (authenticated && status.isLoading)}
        onClick={() => {
          setIntent(true);
          if (canJoin) join.mutate();
          else if (signedInWithoutX) linkTwitter();
          else login({ xOnly: true });
        }}
      >
        {canJoin ? "Join the waitlist" : <>{signedInWithoutX ? "Link" : "Continue with"} <Icon icon={NewTwitterIcon} size={18} /></>}
      </Button>
      {error && (
        <div className="mt-3 w-full">
          <FieldError>{error instanceof ApiRequestError ? error.message : "Something went wrong"}</FieldError>
        </div>
      )}
      <button type="button" onClick={back} className="mt-8 text-sm text-fg-2 hover:text-fg">
        ← I have an invite code
      </button>
    </>
  );
}
