"use client";

import { useState } from "react";
import { ErrorState, SuccessState } from "@/components/storefront/states";

export function RetryDemo({
  errorTitle,
  errorMessage,
  retryLabel,
  successTitle,
  successMessage,
}: {
  errorTitle: string;
  errorMessage: string;
  retryLabel: string;
  successTitle: string;
  successMessage: string;
}) {
  const [ok, setOk] = useState(false);
  if (ok) return <SuccessState title={successTitle} message={successMessage} />;
  return (
    <ErrorState
      title={errorTitle}
      message={errorMessage}
      retryLabel={retryLabel}
      onRetry={() => setOk(true)}
    />
  );
}
