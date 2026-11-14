import type { ReactNode } from "react";
import { AlertCircleIcon, CheckCircle2Icon, InboxIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardShell, CardContent } from "@/components/storefront/primitives";
import { cn } from "@/lib/utils";

export function LoadingState({
  title,
  message,
  rows = 4,
  className,
}: {
  title: string;
  message?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <CardShell className={cn("overflow-hidden", className)}>
      <CardContent className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="space-y-2">
          <p className="text-sm font-medium">{title}</p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded-full bg-muted" style={{ width: `${100 - i * 12}%` }} />
          ))}
        </div>
      </CardContent>
    </CardShell>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
  className,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <CardShell className={className}>
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground" aria-hidden="true">
          {icon ?? <InboxIcon className="size-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold">{title}</p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardContent>
    </CardShell>
  );
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
  className,
}: {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <CardShell className={cn("border-destructive/30", className)}>
      <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-start" role="alert">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive" aria-hidden="true">
          <AlertCircleIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold">{title}</p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
        {retryLabel && onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry} className="shrink-0">
            <RefreshCwIcon className="size-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null}
      </CardContent>
    </CardShell>
  );
}

export function SuccessState({
  title,
  message,
  className,
}: {
  title: string;
  message?: string;
  className?: string;
}) {
  return (
    <CardShell className={cn("border-emerald-500/30", className)}>
      <CardContent className="flex items-start gap-4" aria-live="polite">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
          <CheckCircle2Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">{title}</p>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </CardContent>
    </CardShell>
  );
}
