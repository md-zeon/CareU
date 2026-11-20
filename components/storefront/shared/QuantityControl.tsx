"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantityControl({
  value,
  max,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  value: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={decreaseLabel}
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <MinusIcon className="size-3.5" aria-hidden="true" />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={increaseLabel}
        disabled={max > 0 && value >= max}
        onClick={() => onChange(max > 0 ? Math.min(max, value + 1) : value + 1)}
      >
        <PlusIcon className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
