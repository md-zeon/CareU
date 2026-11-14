import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  title,
  description,
  children,
  actions,
  className,
  contentClassName,
  id,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("space-y-4", className)} aria-labelledby={title ? `${id ?? title}-heading` : undefined}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 id={title ? `${id ?? title}-heading` : undefined} className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2> : null}
            {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
