"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy01Icon, Logout01Icon, NewTwitterIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { PageHeader, Panel, Spinner } from "@/components/dashboard/Panel";
import { Label } from "@/components/editor/Field";
import { Button, Icon } from "@/components/ui";
import { site } from "@/config/site";
import { shortAddress } from "@/lib/format";

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
  const { logout, linkTwitter, linkWallet } = useAuth();
  const { data: me } = useMe();
  const [copied, setCopied] = useState(false);
  if (!me) return <Spinner />;
  const invite = `${site.url}/invite/${me.referralCode}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-10">
      <PageHeader title="ACC[o]UNT SeTT[i]NGS" subtitle="Your account, linked accounts and invites." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel label="General information" title={me.username}>
          <div className="flex flex-col gap-4">
            <div>
              <Label>Profile</Label>
              <Row icon={Copy01Icon}>fl3x.lol/@{me.username}</Row>
            </div>
            <p className="text-xs text-fg-3">Display name, bio and avatar are edited in Customize.</p>
          </div>
        </Panel>

        <Panel label="Linked accounts" title="Sign-in">
          <div className="flex flex-col gap-4">
            <div>
              <Label>X (Twitter)</Label>
              <Row
                icon={NewTwitterIcon}
                action={!me.xHandle && <Button size="sm" variant="secondary" onClick={linkTwitter}>Link</Button>}
              >
                {me.xHandle ? `@${me.xHandle}` : <span className="text-fg-3">Not linked</span>}
              </Row>
            </div>
            <div>
              <Label>Solana wallets</Label>
              <div className="flex flex-col gap-2">
                {me.wallets.map((w) => (
                  <Row key={w} icon={Wallet01Icon}>
                    {shortAddress(w)} <span className="text-fg-3">· {w}</span>
                  </Row>
                ))}
                <Row icon={Wallet01Icon} action={<Button size="sm" variant="secondary" onClick={linkWallet}>Link</Button>}>
                  <span className="text-fg-3">{me.wallets.length ? "Add another wallet" : "No wallet linked"}</span>
                </Row>
              </div>
            </div>
          </div>
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
