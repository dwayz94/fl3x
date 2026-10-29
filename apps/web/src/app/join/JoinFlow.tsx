"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Cancel01Icon, CheckmarkCircle02Icon, NewTwitterIcon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { validateUsername, type Me } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { AuthHeader } from "@/components/shared";
import { Button, FieldError, Icon, Input } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  clearPendingInvite, clearPendingUsername, readPendingInvite, readPendingUsername, savePendingInvite, savePendingUsername,
} from "@/lib/pending-invite";
import { useConfig } from "@/lib/use-config";
import { WaitlistForm, wantsWaitlist } from "./WaitlistForm";

type InviteCheck = { valid: boolean; inviter: string | null };
type Availability = { available: boolean; reason: string | null };

/** Live username check: local rules first, then the API, debounced. */
function useAvailability(username: string) {
  const [state, setState] = useState<Availability | "checking" | null>(null);
  useEffect(() => {
    setState(null);
    if (!username) return;
    const local = validateUsername(username);
    if (!local.valid) return setState({ available: false, reason: local.message });
    setState("checking");
    const t = setTimeout(() => {
      api<Availability>(`/usernames/${encodeURIComponent(username)}`).then(setState).catch(() => setState(null));
    }, 300);
    return () => clearTimeout(t);
  }, [username]);
  return state;
}

function useInvite(code: string) {
  const [invite, setInvite] = useState<InviteCheck | "checking" | null>(null);
  useEffect(() => {
    setInvite(null);
    if (code.length < 4) return;
    setInvite("checking");
    const t = setTimeout(() => {
      api<InviteCheck>(`/invites/${encodeURIComponent(code)}`).then(setInvite).catch(() => setInvite({ valid: false, inviter: null }));
    }, 300);
    return () => clearTimeout(t);
  }, [code]);
  return invite;
}

/** One-line status under a field: checking, ok or error. Fixed height so the form doesn't jump. */
function Status({ state }: { state: "checking" | { ok: boolean; text: string } | null }) {
  return (
    <div className="flex h-6 items-center text-sm">
      {state === "checking" && (
        <span className="flex items-center gap-1.5 text-fg-3">
          <span className="size-3 animate-spin rounded-full border-2 border-fg-3 border-t-transparent" />
          Checking…
        </span>
      )}
      {state && state !== "checking" && (
        <span className={cn("flex items-center gap-1.5", state.ok ? "text-success" : "text-danger")}>
          <Icon icon={state.ok ? CheckmarkCircle02Icon : Cancel01Icon} size={16} />
          {state.text}
        </span>
      )}
    </div>
  );
}

function UsernameField({ value, onChange, availability }: { value: string; onChange: (v: string) => void; availability: ReturnType<typeof useAvailability> }) {
  return (
    <div className="w-full">
      <Input
        placeholder="username"
        value={value}
        maxLength={20}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s/g, ""))}
        leftElement={<span className="text-fg-2">fl3x.lol/@</span>}
        className={availability && availability !== "checking" && !availability.available ? "border-danger focus-within:border-danger" : undefined}
      />
      <Status
        state={
          availability === "checking"
            ? "checking"
            : availability && { ok: availability.available, text: availability.available ? "Available" : (availability.reason ?? "Not available") }
        }
      />
    </div>
  );
}

function InviteField({ code, setCode, invite, optional }: { code: string; setCode: (v: string) => void; invite: ReturnType<typeof useInvite>; optional: boolean }) {
  return (
    <div className="w-full">
      <Input
        placeholder={optional ? "Invite code (optional)" : "Invite code · FL3X-XXXXXX"}
        value={code}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
        leftElement={<Icon icon={Ticket01Icon} size={18} className="text-fg-2" />}
        className={invite && invite !== "checking" && !invite.valid ? "border-danger focus-within:border-danger" : undefined}
      />
      <Status
        state={
          invite === "checking"
            ? "checking"
            : invite && {
                ok: invite.valid,
                text: invite.valid ? (invite.inviter ? `Invited by @${invite.inviter}` : "Valid invite") : "Invalid or fully used code",
              }
        }
      />
    </div>
  );
}

export function JoinFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, authenticated, login, configured } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: config } = useConfig();
  const inviteOnly = (config?.phase ?? "invite_only") === "invite_only";

  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  const invite = useInvite(code);
  const availability = useAvailability(username);

  useEffect(() => {
    const fromUrl = params.get("code");
    if (fromUrl) savePendingInvite(fromUrl);
    setCode(fromUrl?.toUpperCase() ?? readPendingInvite());
    setUsername(params.get("username")?.toLowerCase() ?? readPendingUsername());
    if (wantsWaitlist() || params.get("waitlist") !== null) setShowWaitlist(true);
  }, [params]);

  useEffect(() => {
    if (me?.username) router.replace("/dashboard");
  }, [me, router]);

  if (showWaitlist) return <WaitlistForm desiredUsername={username} onBack={() => setShowWaitlist(false)} />;

  if (authenticated && (meLoading || me?.username)) return <Loading />;

  if (authenticated && me) {
    return (
      <ClaimStep
        me={me}
        username={username}
        setUsername={setUsername}
        code={code}
        setCode={setCode}
        inviteOnly={inviteOnly}
        onWaitlist={() => setShowWaitlist(true)}
      />
    );
  }

  const inviteOk = !inviteOnly || (invite !== "checking" && invite?.valid);
  const nameOk = availability !== "checking" && availability?.available;

  return (
    <>
      <AuthHeader
        title="Reserve your username"
        subtitle={inviteOnly ? "FL3X is invite-only until launch. Grab your name with an invite code." : "Grab your name before someone else does."}
      />

      <div className="flex w-full flex-col gap-1">
        <UsernameField value={username} onChange={setUsername} availability={availability} />
        <InviteField code={code} setCode={setCode} invite={invite} optional={!inviteOnly} />
      </div>

      <Button
        className="mt-2 w-full"
        disabled={!ready || !nameOk || !inviteOk}
        onClick={() => {
          savePendingUsername(username);
          if (code) savePendingInvite(code);
          login();
        }}
      >
        Continue with <Icon icon={NewTwitterIcon} size={18} /> to reserve
      </Button>
      <p className="mt-3 text-center text-xs text-fg-3">You can also sign in with a Solana wallet.</p>
      {!configured && <FieldError>Auth is not configured (NEXT_PUBLIC_PRIVY_APP_ID).</FieldError>}

      {inviteOnly && (
        <p className="mt-10 text-center text-sm text-fg-2">
          No invite?{" "}
          <button className="text-brand hover:underline" onClick={() => setShowWaitlist(true)}>
            Join the waitlist →
          </button>
        </p>
      )}
    </>
  );
}

function ClaimStep(props: {
  me: Me;
  username: string;
  setUsername: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  inviteOnly: boolean;
  onWaitlist: () => void;
}) {
  const { getToken, logout } = useAuth();
  const queryClient = useQueryClient();
  const availability = useAvailability(props.username);
  const invite = useInvite(props.code);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await api<Me>("/onboarding/claim", {
        token: await getToken(),
        json: { username: props.username, inviteCode: props.code || undefined },
      });
      clearPendingInvite();
      clearPendingUsername();
      queryClient.setQueryData(["me"], me);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const who = props.me.xHandle ? `@${props.me.xHandle}` : props.me.wallets[0] ? `${props.me.wallets[0].slice(0, 4)}…${props.me.wallets[0].slice(-4)}` : "you";
  const canSubmit = availability !== "checking" && availability?.available && (!props.inviteOnly || (invite !== "checking" && invite?.valid));

  return (
    <form onSubmit={submit} className="flex w-full flex-col items-center">
      <AuthHeader
        title="Claim your name"
        subtitle={
          <>
            Signed in as <span className="text-fg">{who}</span>.{" "}
            <button type="button" onClick={() => void logout()} className="text-brand hover:underline">
              Switch account
            </button>
          </>
        }
      />
      <div className="flex w-full flex-col gap-1">
        <UsernameField value={props.username} onChange={props.setUsername} availability={availability} />
        <InviteField code={props.code} setCode={props.setCode} invite={invite} optional={!props.inviteOnly} />
      </div>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" className="mt-2 w-full" disabled={!canSubmit} loading={submitting}>
        Claim fl3x.lol/@{props.username || "you"}
      </Button>
      {props.inviteOnly && (
        <p className="mt-10 text-center text-sm text-fg-2">
          No invite?{" "}
          <button type="button" className="text-brand hover:underline" onClick={props.onWaitlist}>
            Join the waitlist →
          </button>
        </p>
      )}
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
