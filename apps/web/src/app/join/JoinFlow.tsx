"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { Cancel01Icon, CheckmarkCircle02Icon, NewTwitterIcon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { USERNAME_MIN, validateUsername, type Me } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
import { Button, buttonClass, FieldError, Icon, Input } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  clearPendingInvite, clearPendingUsername, readPendingInvite, readPendingUsername, savePendingInvite, savePendingUsername,
} from "@/lib/pending-invite";
import { useConfig } from "@/lib/use-config";
import { useEditorProfile } from "@/lib/use-profile";
import { WaitlistForm, wantsWaitlist } from "./WaitlistForm";
import { useAvailability } from "@/lib/use-availability";

/** `error`: the API couldn't be reached, which says nothing about the code. */
type InviteCheck = { valid: boolean; inviter: string | null; error?: true };

function useInvite(code: string) {
  const [invite, setInvite] = useState<InviteCheck | "checking" | null>(null);
  useEffect(() => {
    setInvite(null);
    // Referral links carry a handle, which can be as short as a username.
    if (code.length < USERNAME_MIN) return;
    setInvite("checking");
    // A slower answer for an older code must not overwrite the current one.
    let stale = false;
    const t = setTimeout(() => {
      api<InviteCheck>(`/invites/${encodeURIComponent(code)}`)
        .then((r) => !stale && setInvite(r))
        .catch((err) => {
          if (stale) return;
          // 4xx = the API answered: the code is not valid. Anything else is a network / server failure.
          const answered = err instanceof ApiRequestError && err.status >= 400 && err.status < 500 && err.status !== 429;
          setInvite(answered ? { valid: false, inviter: null } : { valid: false, inviter: null, error: true });
        });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
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
        placeholder={optional ? "Invite code (optional)" : "Invite code · XXXX-XXXX"}
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
                text: invite.valid
                  ? invite.inviter ? `Invited by @${invite.inviter}` : "Valid invite"
                  : invite.error ? "Can't check the code right now. Try again." : "Invalid or fully used code",
              }
        }
      />
    </div>
  );
}

const STEPS = ["Sign in", "Handle", "Wallets", "Ready"] as const;
type Step = 0 | 1 | 2 | 3;
const EASE = [0.22, 1, 0.36, 1] as const;

/** X handles can hold characters usernames can't: keep what fits. */
const fromX = (h: string | null) => (h ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

function StepTitle({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[40px] leading-[0.9] md:text-[52px]">{title}</h1>
      <p className="text-[15px] leading-relaxed text-fg-2">{body}</p>
    </div>
  );
}

/**
 * Sign-up carousel, one step at a time: Continue with X → handle (prefilled
 * from X) → link wallets (optional) → ready. Members landing here go to the dashboard.
 */
export function JoinFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { ready, authenticated, pending, login, configured } = useAuth();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: config } = useConfig();
  const inviteOnly = (config?.phase ?? "invite_only") === "invite_only";

  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);
  // Set once this visit claims a name, so the last steps show instead of the redirect.
  const claimedHere = useRef(false);
  // Back from X: keep saying so until the account is loaded, not just until Privy is done.
  const confirming = useRef(false);
  if (pending) confirming.current = true;
  const invite = useInvite(code);

  const go = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  useEffect(() => {
    const fromUrl = params.get("code");
    if (fromUrl) savePendingInvite(fromUrl);
    setCode(fromUrl?.toUpperCase() ?? readPendingInvite());
    setUsername(params.get("username")?.toLowerCase() ?? readPendingUsername());
    if (wantsWaitlist() || params.get("waitlist") !== null) setShowWaitlist(true);
  }, [params]);

  // Where to start: signed out → X, signed in without a name → handle.
  useEffect(() => {
    if (!ready || (authenticated && meLoading)) return;
    if (me?.username && !claimedHere.current) return router.replace("/dashboard");
    if (!authenticated) return setStep(0);
    if (me && !me.username && step === 0) go(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, meLoading, me]);

  // Prefill the handle from X once (it stays editable).
  useEffect(() => {
    if (me?.xHandle && !username) setUsername(fromX(me.xHandle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.xHandle]);

  if (showWaitlist) return <WaitlistForm desiredUsername={username} onBack={() => setShowWaitlist(false)} />;
  if (!ready || pending || (authenticated && meLoading)) return <Loading label={confirming.current ? "Confirming with X…" : undefined} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex w-full max-w-[460px] flex-col gap-8 text-left"
    >
      {/* Progress: one bar per step, filled as you go. */}
      <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <span className="relative h-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="absolute inset-0 origin-left bg-brand transition-transform duration-500 ease-out"
                style={{ transform: `scaleX(${i <= step ? 1 : 0})`, transitionDelay: `${i * 60}ms` }}
              />
            </span>
            <span className={cn("text-xs leading-none", i === step ? "text-fg" : "text-fg-3")}>{label}</span>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            initial={{ x: direction * 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -48, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {step === 0 && (
              <>
                <StepTitle
                  title="Create your FL3X"
                  body={
                    invite && invite !== "checking" && invite.valid && invite.inviter ? (
                      <>
                        <span className="text-fg">@{invite.inviter}</span> invited you. Sign in with X to claim your name.
                      </>
                    ) : (
                      "Sign in with X to claim your name. No email, no password."
                    )
                  }
                />
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!ready}
                  onClick={() => {
                    if (username) savePendingUsername(username);
                    if (code) savePendingInvite(code);
                    login({ xOnly: true });
                  }}
                >
                  Continue with <Icon icon={NewTwitterIcon} size={18} />
                </Button>
                {!configured && <FieldError>Auth is not configured (NEXT_PUBLIC_PRIVY_APP_ID).</FieldError>}
                {inviteOnly && (
                  <p className="text-sm text-fg-3">
                    No invite?{" "}
                    <button className="text-brand hover:underline" onClick={() => setShowWaitlist(true)}>
                      Join the waitlist →
                    </button>
                  </p>
                )}
              </>
            )}

            {step === 1 && me && (
              <HandleStep
                me={me}
                username={username}
                setUsername={setUsername}
                code={code}
                setCode={setCode}
                inviteOnly={inviteOnly}
                onWaitlist={() => setShowWaitlist(true)}
                onClaimed={() => {
                  claimedHere.current = true;
                  go(2);
                }}
              />
            )}

            {step === 2 && me?.username && (
              <>
                <StepTitle
                  title="Link your wallets"
                  body="Optional. Link as many as you like (Phantom, Solflare, Backpack, MetaMask, Rabby…): your wallet widgets add them up, and $FL3X held on Solana unlocks your tier."
                />
                <WalletsPanel me={me} />
                <div className="flex flex-col gap-2">
                  <Button size="lg" className="w-full" onClick={() => go(3)}>
                    {me.linkedWallets.length ? "Continue" : "Skip for now"}
                  </Button>
                  <p className="text-xs text-fg-3">You can add or remove wallets anytime in Settings.</p>
                </div>
              </>
            )}

            {step === 3 && me?.username && <ReadyStep username={me.username} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </motion.div>
  );
}

function HandleStep(props: {
  me: Me;
  username: string;
  setUsername: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  inviteOnly: boolean;
  onWaitlist: () => void;
  onClaimed: () => void;
}) {
  const { getToken, logout } = useAuth();
  const queryClient = useQueryClient();
  const availability = useAvailability(props.username);
  const invite = useInvite(props.code);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const prefilled = props.me.xHandle && props.username === fromX(props.me.xHandle);

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
      props.onClaimed();
      queryClient.setQueryData(["me"], me);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = availability !== "checking" && availability?.available && (!props.inviteOnly || (invite !== "checking" && invite?.valid));

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <StepTitle
        title="Pick your handle"
        body={
          <>
            {prefilled ? "We filled in your X handle. Keep it or choose another one." : "Your page will live at fl3x.lol/@handle."}{" "}
            <button type="button" onClick={() => void logout()} className="text-fg-3 hover:text-brand">
              Not @{props.me.xHandle ?? "you"}?
            </button>
          </>
        }
      />
      <div className="flex flex-col gap-1">
        <UsernameField value={props.username} onChange={props.setUsername} availability={availability} />
        {(props.inviteOnly || props.code) && <InviteField code={props.code} setCode={props.setCode} invite={invite} optional={!props.inviteOnly} />}
      </div>
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit} loading={submitting}>
        Next
      </Button>
      {props.inviteOnly && (
        <p className="text-sm text-fg-3">
          No invite?{" "}
          <button type="button" className="text-brand hover:underline" onClick={props.onWaitlist}>
            Join the waitlist →
          </button>
        </p>
      )}
    </form>
  );
}

function ReadyStep({ username }: { username: string }) {
  const { data } = useEditorProfile();
  const avatar = data?.profile.avatarUrl;
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="size-16 shrink-0 overflow-hidden rounded-full bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar && <img src={avatar} alt="" className="size-full object-cover" />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-primary text-2xl leading-none uppercase">{data?.profile.displayName || username}</p>
          <p className="mt-1 text-sm text-fg-3">fl3x.lol/@{username}</p>
        </div>
      </div>
      <StepTitle title="You're in" body="Your page is live. Add widgets and links to make it yours." />
      <div className="flex flex-col gap-2">
        <Link href="/dashboard/customize" className={buttonClass({ className: "w-full" })}>
          Open my dashboard
        </Link>
        <Link href={`/@${username}`} className={buttonClass({ variant: "secondary", className: "w-full" })}>
          View my profile
        </Link>
      </div>
    </>
  );
}

function Loading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {label && <p className="text-sm text-fg-2">{label}</p>}
    </div>
  );
}
