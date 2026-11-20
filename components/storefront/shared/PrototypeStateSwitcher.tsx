"use client";

import { cn } from "@/lib/utils";

export type PrototypePreviewState = "content" | "loading" | "error";

export function PrototypeStateSwitcher({
  value,
  onChange,
  label,
  labels,
}: {
  value: PrototypePreviewState;
  onChange: (state: PrototypePreviewState) => void;
  label: string;
  labels: Record<PrototypePreviewState, string>;
}) {
  const options: PrototypePreviewState[] = ["content", "loading", "error"];
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="inline-flex rounded-lg border bg-background p-0.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              value === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
