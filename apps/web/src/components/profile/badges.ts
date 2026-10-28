import {
  Agreement01Icon, CrownIcon, Diamond01Icon, FishFoodIcon, FlashIcon, Key01Icon, Megaphone01Icon, NewTwitterIcon, StarIcon,
} from "@hugeicons/core-free-icons";

/** Line icon shown in the badge strip under the username. */
export const badgeIcons: Record<string, typeof StarIcon> = {
  og: Key01Icon,
  starter: Diamond01Icon,
  premium: CrownIcon,
  "verified-x": NewTwitterIcon,
  recruiter: Agreement01Icon,
  ambassador: Megaphone01Icon,
  "whale-hunter": FishFoodIcon,
  staff: FlashIcon,
};

export const fallbackBadgeIcon = StarIcon;
