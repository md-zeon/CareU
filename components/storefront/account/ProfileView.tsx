"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { PencilIcon } from "lucide-react";
import {
  createProfileSchema,
  getProfile,
  variantOf,
  type AccountScenario,
  type ProfileDraft,
} from "@/lib/mock/account";
import type { Locale } from "@/lib/i18n/routing";
import { useAccountCustomerId, useAccountStore, useAccountStoreActions, useAccountStoreHydrated } from "@/lib/store/account/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardShell } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, FormField, InlineHint, LoadingState, SuccessState } from "@/components/storefront/states";

export function ProfileView({ locale, scenario }: { locale: Locale; scenario: AccountScenario }) {
  const t = useTranslations("Account");
  const customerId = useAccountCustomerId();
  const storedProfile = useAccountStore((state) => state.profile);
  const hydrated = useAccountStoreHydrated();
  const { saveProfile } = useAccountStoreActions();
  const variant = variantOf(scenario, "profile");
  const [editing, setEditing] = useState(() => variant === "invalid");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const messages = useMemo(
    () => ({
      nameRequired: t("fieldNameRequired"),
      phoneRequired: t("fieldPhoneRequired"),
      phoneInvalid: t("fieldPhoneInvalid"),
      emailInvalid: t("fieldEmailInvalid"),
    }),
    [t],
  );
  const schema = useMemo(() => createProfileSchema(messages), [messages]);

  const result = hydrated && customerId ? getProfile(customerId, scenario, storedProfile) : null;
  const profile = result?.ok ? result.data : null;

  const name = profile?.name ?? "";
  const phone = profile?.phone ?? "";
  const email = profile?.email ?? "";
  const defaults: ProfileDraft =
    variant === "invalid" ? { name: "", phone: "", email: "invalid-email" } : { name, phone, email };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileDraft>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone, email, variant, reset]);

  if (!hydrated || variant === "loading" || (!customerId && variant !== "error")) {
    return <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={4} />;
  }

  if (variant === "error" || (result && !result.ok)) {
    return (
      <ErrorState
        title={t("errorTitle")}
        message={result && !result.ok ? t(result.error.messageKey) : t("errorMessage")}
      />
    );
  }

  if (!customerId || !profile) {
    return <EmptyState title={t("errorTitle")} message={t("notFoundMessage")} />;
  }

  function fieldError(name: keyof ProfileDraft) {
    const error = errors[name];
    return error && typeof error.message === "string" ? error.message : undefined;
  }

  const submit = handleSubmit((values) => {
    setFeedback(null);
    const outcome = saveProfile(customerId!, values);
    if (!outcome.ok) {
      setFeedback({ tone: "error", message: t(outcome.error.messageKey) });
      for (const [field, messages] of Object.entries(outcome.error.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof ProfileDraft, { message: messages[0] });
      }
      return;
    }
    setFeedback({ tone: "success", message: t("savedMessage") });
    setEditing(false);
  });

  return (
    <CardShell>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{t("profileTitle")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("profileDescription")}</p>
        </div>
        {!editing ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden="true" />
            {t("editProfile")}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback ? (
          feedback.tone === "success" ? (
            <SuccessState title={t("savedTitle")} message={feedback.message} />
          ) : (
            <ErrorState title={t("errorTitle")} message={feedback.message} />
          )
        ) : null}

        {editing ? (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("fieldName")} htmlFor="account-name" error={fieldError("name")}>
                <Input
                  id="account-name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
              </FormField>
              <FormField label={t("fieldPhone")} htmlFor="account-phone" error={fieldError("phone")}>
                <Input
                  id="account-phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />
              </FormField>
            </div>
            <FormField
              label={t("fieldEmail")}
              htmlFor="account-email"
              help={t("fieldEmailHint")}
              error={fieldError("email")}
            >
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </FormField>
            {variant === "invalid" ? <InlineHint tone="error">{t("invalidProfileMessage")}</InlineHint> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("saveProfile")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset(defaults);
                  setFeedback(null);
                  setEditing(variant === "invalid");
                }}
              >
                {t("cancelEdit")}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("fieldName")}</dt>
              <dd className="text-sm font-medium">{profile.name}</dd>
            </div>
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("fieldPhone")}</dt>
              <dd className="text-sm font-medium" dir="ltr">{profile.phone}</dd>
            </div>
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("fieldEmail")}</dt>
              <dd className="text-sm font-medium">{profile.email ?? "-"}</dd>
            </div>
            <div className="space-y-1 rounded-xl border bg-muted/20 p-4">
              <dt className="text-xs font-medium text-muted-foreground">{t("memberSince")}</dt>
              <dd className="text-sm font-medium">{profile.memberSinceLabel[locale]}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </CardShell>
  );
}
