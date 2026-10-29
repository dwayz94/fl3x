import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_EMAIL, LegalPage } from "@/components/shared";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What FL3X collects, why, who it is shared with, and how to get it deleted.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="PR[i]VACY P[o]LICY"
      intro={
        <p>
          FL3X is a public profile for crypto people. Most of what you put on it is meant to be seen. This page explains what we collect, what is public,
          who helps us run the service, and how to get your data removed. Short version: no ads, no trackers, we never sell data, and visitor IP addresses
          are never stored.
        </p>
      }
      sections={[
        {
          id: "collect",
          title: "What we collect",
          body: (
            <>
              <p>
                <strong>Your account.</strong> When you sign in with X or a wallet (through Privy), we receive your X handle and profile picture, your
                Privy account ID and the wallet address you signed in with.
              </p>
              <p>
                <strong>Your profile.</strong> Username, display name, bio, avatar, background, links, widgets and their settings, badges you choose to show,
                and the invite code or referral link you joined with.
              </p>
              <p>
                <strong>Wallets you link.</strong> Linking a wallet only asks for a signature on a message (no transaction, no access to funds). We keep the
                address so wallet widgets can add up their value and to check how many FL3X tokens you hold for your tier.
              </p>
              <p>
                <strong>Images you upload.</strong> PNG, JPG or WebP files are re-encoded to WebP on our servers, which removes metadata such as location
                (EXIF), then stored with your account.
              </p>
              <p>
                <strong>Connected accounts.</strong> If you connect Spotify, we store access tokens, encrypted, and only use them to read the track you are
                playing or played last. We never read your playlists, library or listening history beyond that.
              </p>
              <p>
                <strong>Waitlist.</strong> Your X handle, the username you would like and the referral you came from.
              </p>
              <p>
                <strong>Visits to profiles.</strong> See <a href="#analytics">Profile analytics</a>.
              </p>
            </>
          ),
        },
        {
          id: "public",
          title: "What is public",
          body: (
            <>
              <p>
                Your profile at fl3x.lol/@username is public: name, bio, pictures, links, widgets and what they show (for example a P&amp;L, a portfolio value,
                the track you play), your badges and your view count. Search engines may index it.
              </p>
              <p>
                <strong>Wallet addresses are never shown on your profile.</strong> Visitors see the values your widgets display, not the addresses behind
                them. Keep in mind that blockchains are public: anyone who already knows an address can look it up elsewhere.
              </p>
            </>
          ),
        },
        {
          id: "analytics",
          title: "Profile analytics",
          body: (
            <>
              <p>When someone opens a profile or clicks one of its links, we record an event so the owner can see their analytics. Each event holds:</p>
              <ul>
                <li>the country, read from our host&apos;s network headers (no precise location);</li>
                <li>the type of device (desktop, mobile or other), from the browser&apos;s user agent;</li>
                <li>the website that sent the visitor, as a domain name only (for example x.com), never the full address;</li>
                <li>for clicks, which link was clicked (for example &quot;Discord&quot;);</li>
                <li>
                  a <strong>visitor hash</strong>: a one-way fingerprint of the IP address and user agent, mixed with a secret that changes every day.
                </li>
              </ul>
              <p>
                <strong>IP addresses are never stored.</strong> The hash cannot be turned back into an IP, and because the secret changes daily, the same
                visitor cannot be followed from one day to the next. It is only used to count unique visitors and to count at most one view per visitor per
                day. Bots and link previews are ignored.
              </p>
            </>
          ),
        },
        {
          id: "use",
          title: "How we use it",
          body: (
            <ul>
              <li>to run your profile and the dashboard, and keep your widgets up to date;</li>
              <li>to work out your tier from the tokens held in your wallets, and to award badges;</li>
              <li>to manage invites, referrals and the waitlist;</li>
              <li>to show you your analytics;</li>
              <li>to keep FL3X safe: rate limits, abuse and fraud prevention, fixing bugs.</li>
            </ul>
          ),
        },
        {
          id: "storage",
          title: "Cookies and browser storage",
          body: (
            <>
              <p>FL3X uses no advertising or tracking cookies and no third-party analytics. What we keep in your browser is only what the site needs:</p>
              <ul>
                <li>Privy&apos;s session storage and cookies, to keep you signed in;</li>
                <li>your invite code and chosen username while you sign in with X (local storage, cleared once you join);</li>
                <li>a per-tab marker so a profile view is counted once (session storage, gone when you close the tab).</li>
              </ul>
              <p>Because these are strictly necessary, there is no consent banner.</p>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who we share it with",
          body: (
            <>
              <p>We never sell or rent personal data. We use these providers to run FL3X, each only for its part:</p>
              <ul>
                <li><strong>Privy</strong>: sign-in with X and wallets.</li>
                <li><strong>Vercel</strong>: hosts the website and tells us the visitor&apos;s country.</li>
                <li><strong>Render</strong>: hosts our API and database.</li>
                <li>
                  <strong>Blockchain data providers</strong> (Solana RPC providers, Jupiter, Moralis, DefiLlama, public EVM nodes, DexScreener): receive wallet
                  or token addresses to return balances and prices. They never receive your name or account.
                </li>
                <li>
                  <strong>Spotify</strong> (if you connect it), <strong>Twitch</strong> and <strong>YouTube</strong> (public channel data for video widgets;
                  Twitch may go through decapi.me), <strong>Discord</strong> and <strong>Telegram</strong> (public invite and member counts).
                </li>
                <li><strong>Error monitoring</strong> (Sentry, if enabled): technical error reports, without passwords or tokens.</li>
              </ul>
              <p>
                Some of these companies are based in the United States, so data may be processed outside your country. They are bound by their own privacy
                terms and, where required, standard contractual clauses. We may also share data when the law requires it.
              </p>
            </>
          ),
        },
        {
          id: "third-party",
          title: "Spotify, Twitch and YouTube",
          body: (
            <>
              <p>
                Music and video widgets show content from Spotify, Twitch and YouTube, with their names and artwork. That content belongs to them and their
                creators, and their own terms and privacy policies apply when you open it.
              </p>
              <p>
                You can disconnect Spotify at any time in <Link href="/dashboard/settings">Settings</Link>, which deletes the tokens we hold. You can also
                remove FL3X from your Spotify account&apos;s apps page. If Spotify reports that access was revoked, we delete the connection automatically.
              </p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <ul>
              <li>account, profile, wallets and images: while your account exists;</li>
              <li>profile analytics: while the profile exists, deleted with it;</li>
              <li>cached public data (prices, channel info): a few minutes to a day;</li>
              <li>waitlist entries: until you join or ask us to remove them;</li>
              <li>our hosts&apos; technical logs: a few weeks, for security.</li>
            </ul>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <p>
                You can edit your profile at any time from the dashboard. You can also ask us to access, correct, export or delete your data, or object to
                how we use it. Write to {mail} from the X account or with a signature from a wallet linked to your profile, so we can check it is you. We
                answer within 30 days. Deleting your account removes your profile, wallets, images, connections and analytics.
              </p>
              <p>If you are in the EU or the UK, you can also complain to your data protection authority.</p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              Connections are encrypted (HTTPS), third-party tokens are encrypted at rest, we never ask for or store private keys or seed phrases, and wallet
              linking only ever asks for a signature on a readable message. No system is perfect: if something goes wrong that affects your data, we will
              tell you.
            </p>
          ),
        },
        {
          id: "age",
          title: "Age",
          body: <p>FL3X is for people aged 18 and over. We do not knowingly collect data from anyone younger.</p>,
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <p>
              We will update this page when FL3X changes and change the date at the top. For important changes we will also let members know. Questions:{" "}
              {mail}.
            </p>
          ),
        },
      ]}
    />
  );
}
