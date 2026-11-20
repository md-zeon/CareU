"use client";

import { useState } from "react";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/storefront/states";
import { CardContent, CardHeader, CardShell, Section } from "@/components/storefront/primitives";
import type { Locale } from "@/lib/i18n/routing";
import type { ResolvedReview, ReviewSummary } from "@/lib/mock/pdp";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

function Stars({ value, label }: { value: number; label: string }) {
  const rounded = Math.round(value);
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn("size-4", i < rounded ? "fill-current text-amber-500" : "text-muted-foreground/40")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function ProductReviewsSection({
  locale,
  summary,
  reviews,
  labels,
}: {
  locale: Locale;
  summary: ReviewSummary | null;
  reviews: ResolvedReview[];
  labels: {
    title: string;
    averageRating: string;
    reviewCountLabel: string;
    ratingBreakdown: string;
    stars: string;
    noReviewsTitle: string;
    noReviewsMessage: string;
    writeReview: string;
    writeReviewPromptTitle: string;
    writeReviewPromptMessage: string;
    writeReviewAction: string;
    ratingOutOfFive: string;
  };
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const count = summary?.reviewCount ?? reviews.length;

  return (
    <Section title={labels.title} contentClassName="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {summary ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-2xl font-semibold">{summary.averageRating.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 })}</p>
              <Stars value={summary.averageRating} label={labels.ratingOutOfFive.replace("{rating}", String(summary.averageRating))} />
              <p className="text-sm text-muted-foreground">{labels.reviewCountLabel.replace("{count}", count.toLocaleString(locale === "bn" ? "bn-BD" : "en-US"))}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{labels.reviewCountLabel.replace("{count}", "0")}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <Button type="button" variant="outline" onClick={() => setShowPrompt((v) => !v)}>
            {labels.writeReview}
          </Button>
        </div>
      </div>

      {showPrompt ? (
        <CardShell className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-3">
            <p className="font-medium">{labels.writeReviewPromptTitle}</p>
            <p className="text-sm text-muted-foreground">{labels.writeReviewPromptMessage}</p>
            <Link
              href={withLocale(locale, "/login")}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {labels.writeReviewAction}
            </Link>
          </CardContent>
        </CardShell>
      ) : null}

      {summary ? (
        <CardShell>
          <CardHeader>
            <h3 className="text-base font-semibold">{labels.ratingBreakdown}</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const starKey = star as 1 | 2 | 3 | 4 | 5;
              const value = summary.breakdown[starKey] ?? 0;
              const pct = summary.reviewCount > 0 ? Math.round((value / summary.reviewCount) * 100) : 0;
              return (
                <div key={star} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{labels.stars.replace("{count}", star.toLocaleString(locale === "bn" ? "bn-BD" : "en-US"))}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right text-muted-foreground">{value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}</span>
                </div>
              );
            })}
          </CardContent>
        </CardShell>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState title={labels.noReviewsTitle} message={labels.noReviewsMessage} />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <CardShell key={review.id}>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} label={labels.ratingOutOfFive.replace("{rating}", String(review.rating))} />
                  <Badge variant="outline">{pickText(review.authorLabel, locale)}</Badge>
                  <span className="text-xs text-muted-foreground">{review.createdAtLabel}</span>
                </div>
                {review.title ? <p className="font-medium">{pickText(review.title, locale)}</p> : null}
                <p className="text-sm leading-7 text-muted-foreground">{pickText(review.body, locale)}</p>
              </CardContent>
            </CardShell>
          ))}
        </div>
      )}
    </Section>
  );
}
