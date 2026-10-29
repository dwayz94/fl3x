import {
  DiscordIcon, GithubIcon, Globe02Icon, InstagramIcon, Link01Icon, NewTwitterIcon, SpotifyIcon, TelegramIcon, TiktokIcon, TwitchIcon, YoutubeIcon,
} from "@hugeicons/core-free-icons";
import type { LinkKind } from "@fl3x/shared";
import type { AnyIcon, BrandIcon } from "@/components/ui/Icon";

/** Trading terminals: their own marks, one color, sized like Hugeicons (about 20 of 24 units). */
const AXIOM: BrandIcon = { viewBox: "0 0 24 24", d: "M12 3.2 16.4 10.4H7.6zM6.3 12.6h11.4l3.6 7.4H2.7z" };
const PROXIMA: BrandIcon = {
  viewBox: "0 0 24 24",
  d: "M12 2.6a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM12 15a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 15zM5.8 8.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM18.2 8.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4z",
};
/** Padre's interlocked capsule (their favicon path, outline only). */
const PADRE: BrandIcon = {
  viewBox: "14 14 172 172",
  d: "M163.219 32.2039C182.19 49.8941 183.228 79.6143 165.539 98.5851L103.162 165.476L102.324 166.354C84.5454 184.476 55.4538 185.208 36.7796 167.795L35.9048 166.956C17.7825 149.178 17.0489 120.088 34.463 101.413L96.8402 34.5221C114.53 15.5529 144.25 14.5147 163.219 32.2039ZM68.8834 82.9977L43.6884 110.016C30.7493 123.892 31.5074 145.63 45.3823 158.569C59.2581 171.508 80.9975 170.749 93.9367 156.874L119.132 129.855L68.8834 82.9977ZM154.617 41.4294C140.742 28.4913 119.005 29.2507 106.066 43.1248L80.1046 70.9645L130.353 117.822L156.314 89.9822C169.252 76.1066 168.492 54.3683 154.617 41.4294Z",
};
/** GMGN's pixel frog, eyes and mouth cut out. */
const GMGN: BrandIcon = { viewBox: "-2 -2 28 28", d: "M8 0h4v2h-4zM16 0h4v2h-4zM6 2h16v2h-16zM6 4h2v2h-2zM10 4h6v2h-6zM20 4h2v2h-2zM2 6h2v2h-2zM6 6h2v2h-2zM10 6h6v2h-6zM20 6h2v2h-2zM0 8h24v2h-24zM0 10h24v2h-24zM0 12h4v2h-4zM8 12h16v2h-16zM2 14h18v2h-18zM8 16h16v2h-16zM8 18h16v2h-16zM6 20h18v2h-18zM6 22h18v2h-18z" };

export const linkIcons: Record<LinkKind, AnyIcon> = {
  x: NewTwitterIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  axiom: AXIOM,
  gmgn: GMGN,
  padre: PADRE,
  proxima: PROXIMA,
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  tiktok: TiktokIcon,
  instagram: InstagramIcon,
  github: GithubIcon,
  spotify: SpotifyIcon,
  website: Globe02Icon,
  custom: Link01Icon,
};
