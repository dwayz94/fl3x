"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NewTwitterIcon, Ticket01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { validateUsername, type Me } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Brand, Button, FieldError, Icon, Input } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { clearPendingInvite, readPendingInvite, savePendingInvite } from "@/lib/pending-invite";
import { useConfig } from "@/lib/use-config";
import { WaitlistForm } from "./WaitlistForm";

type InviteCheck = { valid: boolean; inviter: string | null };

export function JoinFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, authenticated, login, configured } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: config } = useConfig();
  const inviteOnly = (config?.phase ?? "invite_only") === "invite_only";

  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<InviteCheck | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    const fromUrl = params.get("code");
    if (fromUrl) savePendingInvite(fromUrl);
    setCode(fromUrl?.toUpperCase() ?? readPendingInvite());
  }, [params]);

  // Validate the invite code as it's typed.
  useEffect(() => {
    setInvite(null);
    if (code.length < 4) return;
    const t = setTimeout(() => {
      api<InviteCheck>(`/invites/${encodeURIComponent(code)}`).then(setInvite).catch(() => setInvite({ valid: false, inviter: null }));
    }, 300);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    if (me?.username) router.replace("/dashboard");
  }, [me, router]);

  if (showWaitlist) return <WaitlistForm desiredUsername={params.get("username") ?? ""} onBack={() => setShowWaitlist(false)} />;

  if (authenticated && (meLoading || me?.username)) return <Loading />;

  if (authenticated && me) {
    return <ClaimStep me={me} initialUsername={params.get("username") ?? ""} code={code} setCode={setCode} invite={invite} inviteOnly={inviteOnly} />;
  }

  const canContinue = !inviteOnly || invite?.valid;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="mb-2 text-5xl">
          <Brand>J[o]IN FL[3]X</Brand>
        </h1>
        <p className="text-fg-2">
          {inviteOnly ? "FL3X is invite-only during pre-launch. Enter your invite code to continue." : "Sign in to claim your profile."}
        </p>
      </div>

      <InviteField code={code} setCode={setCode} invite={invite} optional={!inviteOnly} />

      <div className="flex flex-col gap-3">
        <Button
          disabled={!ready || !canContinue}
          onClick={() => {
            if (code) savePendingInvite(code);
            login();
          }}
          leftIcon={
            <span className="flex gap-1">
              <Icon icon={NewTwitterIcon} size={18} />
              <Icon icon={Wallet01Icon} size={18} />
            </span>
          }
        >
          Continue with X or wallet
        </Button>
        {!configured && <FieldError>Auth is not configured (NEXT_PUBLIC_PRIVY_APP_ID).</FieldError>}
      </div>

      {inviteOnly && (
        <p className="text-center text-sm text-fg-2">
          No invite?{" "}
          <button className="text-brand hover:underline" onClick={() => setShowWaitlist(true)}>
            Join the waitlist
          </button>
        </p>
      )}
    </div>
  );
}

function InviteField({ code, setCode, invite, optional }: { code: string; setCode: (v: string) => void; invite: InviteCheck | null; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        placeholder={optional ? "Invite code (optional)" : "FL3X-XXXXXX"}
        value={code}
        autoCapitalize="characters"
        spellCheck={false}
        onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
        leftElement={<Icon icon={Ticket01Icon} size={18} className="text-fg-2" />}
        error={invite && !invite.valid ? "This invite code is invalid or fully used" : null}
      />
      {invite?.valid && (
        <p className="text-sm text-success">{invite.inviter ? `Invited by @${invite.inviter}` : "Valid invite code"}</p>
      )}
    </div>
  );
}

function ClaimStep(props: {
  me: Me;
  initialUsername: string;
  code: string;
  setCode: (v: string) => void;
  invite: InviteCheck | null;
  inviteOnly: boolean;
}) {
  const { getToken, logout } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(props.initialUsername);
  const [availability, setAvailability] = useState<{ available: boolean; reason: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAvailability(null);
    const local = validateUsername(username);
    if (!username) return;
    if (!local.valid) return setAvailability({ available: false, reason: local.message });
    const t = setTimeout(() => {
      api<{ available: boolean; reason: string | null }>(`/usernames/${encodeURIComponent(username)}`).then(setAvailability).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [username]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await api<Me>("/onboarding/claim", {
        token: await getToken(),
        json: { username, inviteCode: props.code || undefined },
      });
      clearPendingInvite();
      queryClient.setQueryData(["me"], me);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const who = props.me.xHandle ? `@${props.me.xHandle}` : props.me.wallets[0] ? `${props.me.wallets[0].slice(0, 4)}…${props.me.wallets[0].slice(-4)}` : "you";
  const canSubmit = availability?.available && (!props.inviteOnly || props.invite?.valid);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <h1 className="mb-2 text-5xl">
          <Brand>CL[a]IM YOUR N[a]Me</Brand>
        </h1>
        <p className="text-fg-2">
          Signed in as <span className="text-fg">{who}</span>.{" "}
          <button type="button" onClick={() => void logout()} className="text-brand hover:underline">
            Switch account
          </button>
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Input
          placeholder="username"
          value={username}
          maxLength={20}
          autoCapitalize="none"
          spellCheck={false}
          onChange={(e) => setUsername(e.target.value)}
          leftElement={<span className="text-fg-2">fl3x.lol/@</span>}
          error={availability && !availability.available ? availability.reason : null}
        />
        {availability?.available && <p className="text-sm text-success">Available</p>}
      </div>
      <InviteField code={props.code} setCode={props.setCode} invite={props.invite} optional={!props.inviteOnly} />
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" disabled={!canSubmit} loading={submitting}>
        Claim fl3x.lol/@{username || "you"}
      </Button>
    </form>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}
