"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { MapPinIcon, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardShell } from "@/components/storefront/primitives";
import { FormField } from "@/components/storefront/states";
import { createInlineAddressSchema, type InlineAddressDraft } from "@/lib/mock/checkout";
import type { CheckoutAddressSelection, CheckoutAddressView } from "@/lib/mock/checkout";
import { cn } from "@/lib/utils";

/** Saved address picker and local inline address form. Nothing here is saved. */
export function AddressSection({
  addresses,
  selection,
  onSelect,
}: {
  addresses: CheckoutAddressView[];
  selection: CheckoutAddressSelection | null;
  onSelect: (selection: CheckoutAddressSelection) => void;
}) {
  const t = useTranslations("Checkout");
  const [editing, setEditing] = useState(() => addresses.length === 0);

  const messages = useMemo(
    () => ({
      nameRequired: t("fieldNameRequired"),
      phoneRequired: t("fieldPhoneRequired"),
      phoneInvalid: t("fieldPhoneInvalid"),
      addressRequired: t("fieldAddressRequired"),
      districtRequired: t("fieldDistrictRequired"),
    }),
    [t],
  );
  const schema = useMemo(() => createInlineAddressSchema(messages), [messages]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InlineAddressDraft>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      recipientName: "",
      phone: "",
      addressLine: "",
      district: "",
    },
  });

  useEffect(() => {
    if (selection?.kind === "inline") reset(selection.address);
  }, [selection, reset]);

  function fieldError(name: keyof InlineAddressDraft) {
    const error = errors[name];
    return error && typeof error.message === "string" ? error.message : undefined;
  }

  const submit = handleSubmit((values) => {
    onSelect({ kind: "inline", address: values });
    setEditing(false);
  });

  return (
    <CardShell>
      <CardHeader className="space-y-1">
        <h2 className="text-base font-semibold">{t("addressTitle")}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t("addressIntro")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length > 0 ? (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("savedAddressLabel")}</legend>
            {addresses.map((address) => {
              const checked = selection?.kind === "saved" && selection.address.id === address.id;
              return (
                <label
                  key={address.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors focus-within:ring-3 focus-within:ring-ring/50",
                    checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="checkout-address"
                    className="mt-1 size-4 accent-primary"
                    checked={checked}
                    onChange={() => {
                      onSelect({ kind: "saved", address });
                      setEditing(false);
                    }}
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{address.label}</span>
                      {address.isDefault ? <Badge variant="secondary">{t("defaultBadge")}</Badge> : null}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {address.recipientName} · {address.phone}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {address.addressLine}, {address.district}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : null}

        {selection?.kind === "inline" && !editing ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium">{t("inlineAddressActive")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selection.address.recipientName} · {selection.address.phone}
            </p>
            <p className="text-xs text-muted-foreground">
              {selection.address.addressLine}, {selection.address.district}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
              <PencilIcon aria-hidden="true" />
              {t("editInlineAddress")}
            </Button>
          </div>
        ) : null}

        {editing ? (
          <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border p-4">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MapPinIcon className="size-4" aria-hidden="true" />
                {t("inlineTitle")}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">{t("inlineIntro")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("fieldName")} htmlFor="checkout-recipient" error={fieldError("recipientName")}>
                <Input
                  id="checkout-recipient"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.recipientName)}
                  aria-describedby={errors.recipientName ? "checkout-recipient-error" : undefined}
                  {...register("recipientName")}
                />
              </FormField>
              <FormField label={t("fieldPhone")} htmlFor="checkout-phone" error={fieldError("phone")}>
                <Input
                  id="checkout-phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
                  {...register("phone")}
                />
              </FormField>
            </div>
            <FormField label={t("fieldAddressLine")} htmlFor="checkout-address-line" error={fieldError("addressLine")}>
              <Input
                id="checkout-address-line"
                autoComplete="street-address"
                aria-invalid={Boolean(errors.addressLine)}
                aria-describedby={errors.addressLine ? "checkout-address-line-error" : undefined}
                {...register("addressLine")}
              />
            </FormField>
            <FormField label={t("fieldDistrict")} htmlFor="checkout-district" error={fieldError("district")}>
              <Input
                id="checkout-district"
                autoComplete="address-level1"
                aria-invalid={Boolean(errors.district)}
                aria-describedby={errors.district ? "checkout-district-error" : undefined}
                {...register("district")}
              />
            </FormField>
            <Button type="submit">{t("useInlineAddress")}</Button>
          </form>
        ) : addresses.length > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            <MapPinIcon aria-hidden="true" />
            {t("inlineTitle")}
          </Button>
        ) : null}
      </CardContent>
    </CardShell>
  );
}
