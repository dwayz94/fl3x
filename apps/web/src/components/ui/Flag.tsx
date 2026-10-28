import { flagUrl } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Flag({ country, className }: { country?: string | number; className?: string }) {
  const src = flagUrl(country);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={String(country).toUpperCase()} className={cn("rounded-md object-cover", className)} />;
}
