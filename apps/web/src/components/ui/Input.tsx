import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  error?: string | null;
  containerClassName?: string;
}

export function Input({ leftElement, rightElement, error, className, containerClassName, ...props }: InputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <div
        className={cn(
          "flex h-12 items-center gap-2 rounded-2xl border-2 bg-surface-2 px-4 transition-colors",
          error ? "border-danger" : "border-line focus-within:border-brand",
          className,
        )}
      >
        {leftElement && <div className="shrink-0">{leftElement}</div>}
        <input
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-white/30"
          {...props}
        />
        {rightElement && <div className="shrink-0">{rightElement}</div>}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-danger">
      <span className="inline-block size-1 rounded-full bg-danger" />
      {children}
    </p>
  );
}
