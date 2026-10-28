import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-bg border-2 border-white/15 shadow-[0_1px_2px_0_rgba(27,28,29,0.48),0_0_0_1px_#242628] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-white/10 text-fg border-2 border-white/15 shadow-[0_1px_2px_0_rgba(27,28,29,0.48),0_0_0_1px_#242628] hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]",
  ghost: "bg-transparent text-fg hover:bg-white/10 active:bg-white/15",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-xl",
  md: "h-10 px-4 text-sm rounded-2xl",
  lg: "h-12 px-5 text-base rounded-2xl",
};

export function buttonClass({ variant = "primary", size = "lg", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({ variant, size, loading, leftIcon, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  );
}
