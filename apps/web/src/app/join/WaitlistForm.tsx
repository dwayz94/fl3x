"use client";

import { useState } from "react";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import { AuthHeader } from "@/components/shared";
import { Button, FieldError, Icon, Input } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

type Result = { total: number; position: number };

export function WaitlistForm({ desiredUsername, onBack }: { desiredUsername: string; onBack: () => void }) {
  const [xHandle, setXHandle] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      setDone(
        await api<Result>("/waitlist", {
          json: {
            xHandle: xHandle || undefined,
            email: email || undefined,
            desiredUsername: desiredUsername || undefined,
          },
        }),
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <AuthHeader title="You're in line" subtitle="We'll reach out on X or by email as soon as a spot opens." />
        <div className="w-full rounded-[24px] bg-[#121212] p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-primary text-2xl leading-none">{xHandle ? `@${xHandle.replace(/^@/, "")}` : email}</p>
              {desiredUsername && <p className="mt-1 truncate text-xs text-fg-3">wants fl3x.lol/@{desiredUsername}</p>}
            </div>
            <p className="shrink-0 font-primary text-4xl leading-none">
              #{done.position.toLocaleString("en-US")}
              <span className="text-base text-fg-3">/{done.total.toLocaleString("en-US")}</span>
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, 100 - (done.position / Math.max(1, done.total)) * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-fg-2">Got an invite from a friend? You can skip the line.</p>
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={onBack}>
          I have an invite code
        </Button>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col items-center">
      <AuthHeader title="Join the waitlist" subtitle="Leave your X handle or email. We'll send you an invite before launch." />
      <div className="flex w-full flex-col gap-3">
        <Input placeholder="X handle" value={xHandle} onChange={(e) => setXHandle(e.target.value.trim())} leftElement={<span className="text-fg-2">@</span>} />
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          leftElement={<Icon icon={Mail01Icon} size={18} className="text-fg-2" />}
        />
      </div>
      {error && <div className="mt-3 w-full"><FieldError>{error}</FieldError></div>}
      <Button type="submit" className="mt-6 w-full" loading={submitting} disabled={!xHandle && !email}>
        Join the waitlist
      </Button>
      <button type="button" onClick={onBack} className="mt-6 text-sm text-fg-2 hover:text-fg">
        ← I have an invite code
      </button>
    </form>
  );
}
