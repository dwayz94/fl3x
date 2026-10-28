import { DiscordIcon, GithubIcon, NewTwitterIcon, TelegramIcon } from "@hugeicons/core-free-icons";
import { site } from "@/config/site";
import { Icon } from "@/components/ui";

const links = [
  { icon: NewTwitterIcon, href: site.social.x, label: "X" },
  { icon: DiscordIcon, href: site.social.discord, label: "Discord" },
  { icon: TelegramIcon, href: site.social.telegram, label: "Telegram" },
  { icon: GithubIcon, href: site.social.github, label: "GitHub" },
];

export function SocialLinks({ withGithub = false }: { withGithub?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      {links
        .filter((l) => withGithub || l.label !== "GitHub")
        .map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className="text-fg-2 transition-colors hover:text-fg">
            <Icon icon={l.icon} size={24} />
          </a>
        ))}
    </div>
  );
}
