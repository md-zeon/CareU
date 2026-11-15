import Link from "next/link";
import { HeartIcon, SearchIcon, SparklesIcon, StoreIcon, TagIcon, UserIcon } from "lucide-react";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeClosingBlock } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

const icons = {
  search: SearchIcon,
  sparkles: SparklesIcon,
  store: StoreIcon,
  heart: HeartIcon,
  user: UserIcon,
  tag: TagIcon,
} as const;

export function HomeClosingLinks({
  block,
  locale,
  fallbackTitle,
  fallbackDescription,
  emptyTitle,
  emptyMessage,
}: {
  block: HomeClosingBlock;
  locale: Locale;
  fallbackTitle: string;
  fallbackDescription: string;
  emptyTitle: string;
  emptyMessage: string;
}) {
  const title = block.title ? pickText(block.title, locale) : fallbackTitle;
  const description = block.description ? pickText(block.description, locale) : fallbackDescription;
  return (
    <PageContainer className="py-10 sm:py-14">
      <Section title={title} description={description}>
        {block.links.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {block.links.map((link) => {
              const Icon = link.icon ? icons[link.icon] : SparklesIcon;
              return (
                <li key={link.id}>
                  <Link
                    href={withLocale(locale, link.href)}
                    className="group flex h-full gap-4 rounded-2xl border bg-card p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground" aria-hidden="true">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold leading-6">{pickText(link.label, locale)}</p>
                      {link.description ? (
                        <p className="text-sm leading-6 text-muted-foreground">{pickText(link.description, locale)}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}
