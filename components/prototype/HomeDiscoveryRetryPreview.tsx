"use client";

import { useState } from "react";
import { PageContainer } from "@/components/storefront/primitives";
import { ErrorState } from "@/components/storefront/states";
import { HomeDiscoveryContent, type HomeMessages } from "@/components/storefront/home/HomeDiscoveryContent";
import { getHomeDiscovery } from "@/lib/mock/home";
import type { Locale } from "@/lib/i18n/routing";

export function HomeDiscoveryRetryPreview({
  locale,
  messages,
  retryLabel,
}: {
  locale: Locale;
  messages: HomeMessages;
  retryLabel: string;
}) {
  const [retried, setRetried] = useState(false);
  const errorResult = getHomeDiscovery({ scenario: "error" });

  if (retried) {
    return <HomeDiscoveryContent result={getHomeDiscovery({ scenario: "default" })} locale={locale} messages={messages} />;
  }

  if (errorResult.scenario !== "error") return null;
  const errorMessage = locale === "bn" ? errorResult.message.bn : errorResult.message.en;

  return (
    <PageContainer className="py-6 sm:py-8">
      <ErrorState
        title={messages.pageErrorTitle}
        message={errorMessage || messages.pageErrorMessage}
        retryLabel={retryLabel}
        onRetry={() => setRetried(true)}
      />
    </PageContainer>
  );
}
