import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_EMAIL, LegalPage } from "@/components/shared";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using FL3X: accounts, profiles, tokens and tiers, and what we are and aren't responsible for.",
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      title="T[e]RMS [o]F SERV[i]CE"
      intro={
        <p>
          These terms apply when you use fl3x.lol, create a profile or visit one. By using FL3X you agree to them. Please read them together with our{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      }
      sections={[
        {
          id: "service",
          title: "The service",
          body: (
            <p>
              FL3X lets you build a public profile with links and live widgets (wallet values, tokens, communities, music, videos and more). During
              pre-launch, joining needs an invite; everyone else can join the waitlist. Features may change, be limited or stop while we build.
            </p>
          ),
        },
        {
          id: "account",
          title: "Your account",
          body: (
            <ul>
              <li>You must be 18 or older and able to agree to these terms.</li>
              <li>You sign in with X or a wallet through Privy. Keep access to those accounts safe: they are your access to FL3X.</li>
              <li>One person, one account. Don&apos;t share, sell or transfer accounts or usernames.</li>
              <li>We will never ask for your private key or seed phrase. Anyone who does is not us.</li>
            </ul>
          ),
        },
        {
          id: "usernames",
          title: "Usernames",
          body: (
            <p>
              Usernames are first come, first served. We may reclaim or change a username that impersonates someone, infringes a trademark, is offensive, or
              was obtained by breaking these terms.
            </p>
          ),
        },
        {
          id: "content",
          title: "Your content",
          body: (
            <>
              <p>
                You own what you put on your profile. You give us a worldwide, free license to host, show, resize and share it as needed to run FL3X (for
                example on your profile page, in previews when your link is shared, and in our own showcase of public profiles). This license ends when you
                delete the content, except for copies already shared publicly.
              </p>
              <p>You are responsible for your content and must have the right to post it.</p>
            </>
          ),
        },
        {
          id: "rules",
          title: "What's not allowed",
          body: (
            <ul>
              <li>impersonating a person, project or brand, or faking verification;</li>
              <li>scams, phishing, wallet drainers, fake airdrops, malware or deceptive links;</li>
              <li>promising returns or presenting a token as a safe investment;</li>
              <li>illegal content, hate, harassment, sexual content involving minors, or content you have no rights to;</li>
              <li>inflating views, clicks, referrals or badges with bots, fake accounts or scripts;</li>
              <li>scraping, overloading or attacking FL3X, or getting around limits and access controls.</li>
            </ul>
          ),
        },
        {
          id: "tokens",
          title: "Tokens, tiers and wallets",
          body: (
            <>
              <p>
                Holding the FL3X token in a wallet linked to your account unlocks a tier with extra features. Tiers are checked from public blockchain data and
                thresholds may change. A tier is a product feature, not an investment, a share, or a promise of value.
              </p>
              <p>
                FL3X never holds your funds and never asks you to send a transaction. Linking a wallet only asks you to sign a readable message to prove it is
                yours.
              </p>
            </>
          ),
        },
        {
          id: "advice",
          title: "Not financial advice",
          body: (
            <p>
              Prices, P&amp;L, portfolio values, market caps and token pages shown on FL3X come from third-party sources and our own snapshots. They can be
              late, incomplete or wrong. Nothing on FL3X, including what members post on their profiles, is financial advice. Crypto is risky: do your own
              research.
            </p>
          ),
        },
        {
          id: "third-party",
          title: "Third-party services",
          body: (
            <p>
              Widgets and links show or open services we don&apos;t run, such as X, Discord, Telegram, Spotify, Twitch, YouTube, DexScreener and trading
              platforms. Their content belongs to them, their terms apply, and we are not responsible for them. Connecting Spotify is optional and can be
              undone at any time.
            </p>
          ),
        },
        {
          id: "referrals",
          title: "Referrals and badges",
          body: (
            <p>
              Referral links, leaderboard positions and badges have no cash value and can&apos;t be sold or exchanged. We may remove them, or reset a
              leaderboard, in case of abuse or mistakes.
            </p>
          ),
        },
        {
          id: "ending",
          title: "Suspension and deletion",
          body: (
            <p>
              You can stop using FL3X and ask us to delete your account at any time ({mail}). We may hide content, suspend or close an account that breaks
              these terms or puts others at risk, where possible after telling you why.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Disclaimers and liability",
          body: (
            <>
              <p>
                FL3X is provided &quot;as is&quot;. We work to keep it available and accurate but can&apos;t guarantee it will always be online, error-free,
                or that third-party data is correct.
              </p>
              <p>
                To the extent the law allows, we are not liable for indirect losses, lost profits, trading or investment losses, or losses caused by
                third-party services or by content posted by members. Nothing in these terms limits rights you have as a consumer under the law of your
                country.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <p>
              We may update these terms as FL3X evolves and will change the date at the top; important changes will be announced to members. Using FL3X after
              an update means you accept it. Questions or reports: {mail}.
            </p>
          ),
        },
      ]}
    />
  );
}
