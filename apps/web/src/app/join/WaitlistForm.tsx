"use client";

import { useState } from "react";
import { Brand, Button, FieldError, Input } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

export function WaitlistForm({ desiredUsername, onBack }: { desiredUsername: string; onBack: () => void }) {
  const [xHandle, setXHandle] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api<{ total: number }>("/waitlist", {
        json: {
          xHandle: xHandle || undefined,
          email: email || undefined,
          desiredUsername: desiredUsername || undefined,
        },
      });
      setDone(res.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done !== null) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-5xl">
          <Brand>YOU'Re [i]N LIN[e]</Brand>
        </h1>
        <p className="text-fg-2">
          {done.toLocaleString()} people are waiting. We'll reach out on X or by email when a spot opens.
        </p>
        <Button variant="secondary" onClick={onBack}>
          I got an invite
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <h1 className="mb-2 text-5xl">
          <Brand>W[a]ITL[i]ST</Brand>
        </h1>
        <p className="text-fg-2">Leave your X handle or email and we'll send you an invite before launch.</p>
      </div>
      <Input placeholder="X handle" value={xHandle} onChange={(e) => setXHandle(e.target.value)} leftElement={<span className="text-fg-2">@</span>} />
      <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" loading={submitting} disabled={!xHandle && !email}>
        Join the waitlist
      </Button>
      <button type="button" onClick={onBack} className="text-sm text-fg-2 hover:text-fg">
        ← I have an invite code
      </button>
    </form>
  );
}
