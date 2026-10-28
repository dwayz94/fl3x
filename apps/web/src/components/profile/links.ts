import {
  DiscordIcon, GithubIcon, Globe02Icon, InstagramIcon, Link01Icon, NewTwitterIcon, SpotifyIcon, TelegramIcon, TiktokIcon, TwitchIcon, YoutubeIcon,
} from "@hugeicons/core-free-icons";
import type { LinkKind } from "@fl3x/shared";

export const linkIcons: Record<LinkKind, typeof Link01Icon> = {
  x: NewTwitterIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  youtube: YoutubeIcon,
  twitch: TwitchIcon,
  tiktok: TiktokIcon,
  instagram: InstagramIcon,
  github: GithubIcon,
  spotify: SpotifyIcon,
  website: Globe02Icon,
  custom: Link01Icon,
};
