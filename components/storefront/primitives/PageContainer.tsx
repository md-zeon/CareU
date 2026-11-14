import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  as: Comp = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
}) {
  return (
    <Comp className={cn("mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Comp>
  );
}
