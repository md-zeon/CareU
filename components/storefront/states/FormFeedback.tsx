import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  help,
  error,
  success,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  success?: string;
  children: ReactNode;
  className?: string;
}) {
  const describedBy = [help ? `${htmlFor}-help` : null, error ? `${htmlFor}-error` : null, success ? `${htmlFor}-success` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      <div data-describedby={describedBy || undefined}>{children}</div>
      {help ? <p id={`${htmlFor}-help`} className="text-sm text-muted-foreground">{help}</p> : null}
      {error ? <p id={`${htmlFor}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
      {!error && success ? <p id={`${htmlFor}-success`} className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
    </div>
  );
}

export function InlineHint({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" | "success" }) {
  return (
    <p
      className={cn(
        "text-sm",
        tone === "muted" && "text-muted-foreground",
        tone === "error" && "text-destructive",
        tone === "success" && "text-emerald-600 dark:text-emerald-400",
      )}
    >
      {children}
    </p>
  );
}
