import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardShell({ children, className, ...props }: ComponentPropsWithoutRef<"div"> & { children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card text-card-foreground shadow-sm", className)} {...props}>{children}</div>;
}

export function CardHeader({ children, className, ...props }: ComponentPropsWithoutRef<"div"> & { children: ReactNode }) {
  return <div className={cn("border-b px-4 py-4 sm:px-5", className)} {...props}>{children}</div>;
}

export function CardContent({ children, className, ...props }: ComponentPropsWithoutRef<"div"> & { children: ReactNode }) {
  return <div className={cn("px-4 py-4 sm:px-5", className)} {...props}>{children}</div>;
}

export function ListShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y rounded-2xl border bg-card text-card-foreground", className)}>{children}</div>;
}

export function ListItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5", className)}>{children}</div>;
}

export function DetailShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]", className)}>{children}</div>;
}

export function Stack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function ResponsiveGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>{children}</div>;
}
