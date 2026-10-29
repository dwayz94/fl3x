"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy01Icon, Logout01Icon, NewTwitterIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import type { EditableProfile } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { PageHeader, Panel, Spinner } from "@/components/dashboard/Panel";
import { ConnectionsPanel } from "@/components/dashboard/ConnectionsPanel";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
import { inputClass, Label } from "@/components/editor/Field";
import { Button, FieldError, Icon, ImageInput } from "@/components/ui";
import { site } from "@/config/site";
import { api, ApiRequestError } from "@/lib/api";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

function Row({ icon, children, action }: { icon: typeof Wallet01Icon; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#111] px-3 text-sm">
      <Icon icon={icon} size={16} className="text-fg-3" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout, linkTwitter } = useAuth();
  const { data: me } = useMe();
  const [copied, setCopied] = useState(false);
  if (!me) return <Spinner />;
  const invite = `${site.url}/invite/${me.referralCode}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-10">
      <PageHeader title="ACC[o]UNT SeTT[i]NGS" subtitle="Your profile, linked accounts and invites." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel label="Profile" title={`@${me.username}`}>
          <IdentityForm />
        </Panel>

        <Panel label="Linked accounts" title="Wallets & X">
          <div className="flex flex-col gap-4">
            <div>
              <Label>X (Twitter)</Label>
              <Row icon={NewTwitterIcon} action={!me.xHandle && <Button size="sm" variant="secondary" onClick={linkTwitter}>Link</Button>}>
                {me.xHandle ? `@${me.xHandle}` : <span className="text-fg-3">Not linked</span>}
              </Row>
            </div>
            <div>
              <Label>Wallets</Label>
              <WalletsPanel me={me} />
            </div>
          </div>
        </Panel>

        <Panel label="Connections" title="Live widgets">
          <Suspense>
            <ConnectionsPanel />
          </Suspense>
        </Panel>

        <Panel label="Referrals" title={`${me.referrals} joined`}>
          <div className="flex flex-col gap-3">
            <Label>
              Your invite link · {me.invitesLeft} invite{me.invitesLeft === 1 ? "" : "s"} left
            </Label>
            <Row
              icon={Copy01Icon}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(invite);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              }
            >
              {invite.replace(/^https?:\/\//, "")}
            </Row>
          </div>
        </Panel>

        <Panel label="Account actions" title="Session">
          <Button className="mt-auto w-full" onClick={() => void logout().then(() => router.push("/"))} leftIcon={<Icon icon={Logout01Icon} size={18} />}>
            Log out
          </Button>
        </Panel>
      </div>
    </div>
  );
}

/** Avatar, display name and bio. The avatar saves as soon as it is uploaded. */
function IdentityForm() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data } = useEditorProfile();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setName(data.profile.displayName ?? "");
    setBio(data.profile.bio ?? "");
  }, [data]);
  if (!data) return <Spinner />;

  const patch = async (body: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null }) => {
    setError(null);
    setSaving(true);
    try {
      const profile = await api<EditableProfile>("/me/identity", { method: "PATCH", token: await getToken(), json: body });
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile } : old));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };
  const dirty = name !== (data.profile.displayName ?? "") || bio !== (data.profile.bio ?? "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <ImageInput kind="avatar" round value={data.profile.avatarUrl ?? undefined} onChange={(url) => void patch({ avatarUrl: url })} />
        <div className="min-w-0 flex-1">
          <Label>Display name</Label>
          <input className={inputClass} maxLength={32} value={name} onChange={(e) => setName(e.target.value)} placeholder={data.profile.username} />
        </div>
      </div>
      <div>
        <Label>Bio</Label>
        <textarea className={`${inputClass} h-20 resize-none py-2`} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="FL3X on all screens!" />
      </div>
      {error && <FieldError>{error}</FieldError>}
      <Button size="md" disabled={!dirty} loading={saving} onClick={() => void patch({ displayName: name, bio })}>
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
