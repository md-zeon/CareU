"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  createAddressSchema,
  listAddresses,
  variantOf,
  type AccountScenario,
  type AddressDraft,
} from "@/lib/mock/account";
import {
  useAccountCustomerId,
  useAccountStore,
  useAccountStoreActions,
  useAccountStoreHydrated,
} from "@/lib/store/account/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardShell, ListShell } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, FormField, InlineHint, LoadingState, SuccessState } from "@/components/storefront/states";

const EMPTY_DRAFT: AddressDraft = {
  label: "",
  recipientName: "",
  phone: "",
  addressLine: "",
  district: "",
  landmark: "",
  isDefault: false,
};

/** Saved address list plus add, edit, delete with confirm, and set default. */
export function AddressesView({ scenario }: { scenario: AccountScenario }) {
  const t = useTranslations("Addresses");
  const customerId = useAccountCustomerId();
  const storedAddresses = useAccountStore((state) => state.addresses);
  const hydrated = useAccountStoreHydrated();
  const { saveAddress, deleteAddress, setDefaultAddress } = useAccountStoreActions();
  const variant = variantOf(scenario, "address");

  const [formOpen, setFormOpen] = useState(() => variant === "invalid");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

  const messages = useMemo(
    () => ({
      labelRequired: t("fieldLabelRequired"),
      nameRequired: t("fieldNameRequired"),
      phoneRequired: t("fieldPhoneRequired"),
      phoneInvalid: t("fieldPhoneInvalid"),
      addressRequired: t("fieldAddressRequired"),
      districtRequired: t("fieldDistrictRequired"),
    }),
    [t],
  );
  const schema = useMemo(() => createAddressSchema(messages), [messages]);

  const result = hydrated && customerId ? listAddresses(customerId, storedAddresses, scenario) : null;
  const addresses = result?.ok ? result.data : [];

  const editingAddress = storedAddresses.find((item) => item.id === editingId);
  const editingValues = {
    label: editingAddress?.label ?? "",
    recipientName: editingAddress?.recipientName ?? "",
    phone: editingAddress?.phone ?? "",
    addressLine: editingAddress?.addressLine ?? "",
    district: editingAddress?.district ?? "",
    landmark: editingAddress?.landmark ?? "",
    isDefault: editingAddress?.isDefault ?? false,
  };
  const addressCount = storedAddresses.length;
  const defaults = useMemo<AddressDraft>(() => {
    if (variant === "invalid") return { ...EMPTY_DRAFT, isDefault: true };
    if (editingId) return { ...editingValues };
    return { ...EMPTY_DRAFT, isDefault: addressCount === 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editingId,
    editingValues.label,
    editingValues.recipientName,
    editingValues.phone,
    editingValues.addressLine,
    editingValues.district,
    editingValues.landmark,
    editingValues.isDefault,
    addressCount,
    variant,
  ]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressDraft>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  if (!hydrated || variant === "loading" || (!customerId && variant !== "error")) {
    return <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={5} />;
  }

  if (variant === "error" || (result && !result.ok)) {
    return (
      <ErrorState
        title={t("errorTitle")}
        message={result && !result.ok ? t(result.error.messageKey) : t("errorMessage")}
      />
    );
  }

  if (!customerId) return <EmptyState title={t("errorTitle")} message={t("notFoundMessage")} />;

  function fieldError(name: keyof AddressDraft) {
    const error = errors[name];
    return error && typeof error.message === "string" ? error.message : undefined;
  }

  function openAdd() {
    setEditingId(null);
    setConfirmingId(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    const address = addresses.find((item) => item.id === id);
    if (!address) return;
    setEditingId(id);
    setConfirmingId(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    reset(variant === "invalid" ? { ...EMPTY_DRAFT, isDefault: true } : defaults);
  }

  const submit = handleSubmit((values) => {
    setFeedback(null);
    const outcome = saveAddress(customerId!, values, editingId ?? undefined);
    if (!outcome.ok) {
      setFeedback({ tone: "error", title: t("errorTitle"), message: t(outcome.error.messageKey) });
      for (const [field, messages] of Object.entries(outcome.error.fieldErrors ?? {})) {
        if (messages?.[0]) setError(field as keyof AddressDraft, { message: messages[0] });
      }
      return;
    }
    setFeedback({ tone: "success", title: t("savedTitle"), message: t("savedMessage") });
    setFormOpen(false);
    setEditingId(null);
  });

  function remove(id: string) {
    const outcome = deleteAddress(customerId!, id);
    setConfirmingId(null);
    if (!outcome.ok) {
      setFeedback({ tone: "error", title: t("errorTitle"), message: t(outcome.error.messageKey) });
      return;
    }
    setFeedback({ tone: "success", title: t("deleteSuccessTitle"), message: t("deleteSuccessMessage") });
  }

  function makeDefault(id: string) {
    const outcome = setDefaultAddress(customerId!, id);
    if (!outcome.ok) {
      setFeedback({ tone: "error", title: t("errorTitle"), message: t(outcome.error.messageKey) });
      return;
    }
    setFeedback({ tone: "success", title: t("defaultSuccessTitle"), message: t("defaultSuccessMessage") });
  }

  return (
    <CardShell>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{t("title")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>
        </div>
        <Button type="button" size="sm" onClick={openAdd}>
          <MapPinIcon aria-hidden="true" />
          {t("addAddress")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback ? (
          feedback.tone === "success" ? (
            <SuccessState title={feedback.title} message={feedback.message} />
          ) : (
            <ErrorState title={feedback.title} message={feedback.message} />
          )
        ) : null}

        {formOpen ? (
          <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border p-4">
            <p className="text-sm font-medium">{editingId ? t("editAddress") : t("addAddress")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("fieldLabel")} htmlFor="address-label" error={fieldError("label")}>
                <Input id="address-label" aria-invalid={Boolean(errors.label)} {...register("label")} />
              </FormField>
              <FormField label={t("fieldName")} htmlFor="address-recipient" error={fieldError("recipientName")}>
                <Input id="address-recipient" autoComplete="name" aria-invalid={Boolean(errors.recipientName)} {...register("recipientName")} />
              </FormField>
              <FormField label={t("fieldPhone")} htmlFor="address-phone" error={fieldError("phone")}>
                <Input id="address-phone" type="tel" autoComplete="tel" dir="ltr" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
              </FormField>
              <FormField label={t("fieldDistrict")} htmlFor="address-district" error={fieldError("district")}>
                <Input id="address-district" autoComplete="address-level1" aria-invalid={Boolean(errors.district)} {...register("district")} />
              </FormField>
            </div>
            <FormField label={t("fieldAddressLine")} htmlFor="address-line" error={fieldError("addressLine")}>
              <Input id="address-line" autoComplete="street-address" aria-invalid={Boolean(errors.addressLine)} {...register("addressLine")} />
            </FormField>
            <FormField label={t("fieldLandmark")} htmlFor="address-landmark">
              <Input id="address-landmark" aria-invalid={Boolean(errors.landmark)} {...register("landmark")} />
            </FormField>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-primary" {...register("isDefault")} />
              {t("fieldIsDefault")}
            </label>
            {variant === "invalid" ? <InlineHint tone="error">{t("invalidAddressMessage")}</InlineHint> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("save")}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        ) : null}

        {addresses.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            action={<Button type="button" size="sm" onClick={openAdd}>{t("addAddress")}</Button>}
          />
        ) : (
          <ListShell>
            {addresses.map((address) => (
              <div key={address.id} className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {address.label}
                      {address.isDefault ? <Badge variant="secondary">{t("defaultBadge")}</Badge> : null}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.recipientName} · <span dir="ltr">{address.phone}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {address.addressLine}, {address.district}
                      {address.landmark ? ` · ${address.landmark}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.isDefault ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => makeDefault(address.id)}>
                        {t("setDefault")}
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(address.id)}>
                      <PencilIcon aria-hidden="true" />
                      {t("editAddress")}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingId(address.id)}>
                      <Trash2Icon aria-hidden="true" />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
                {confirmingId === address.id ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between" role="group">
                    <div>
                      <p className="text-sm font-medium">{t("confirmDeleteTitle")}</p>
                      <p className="text-xs text-muted-foreground">{t("confirmDeleteMessage")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="destructive" size="sm" onClick={() => remove(address.id)}>
                        {t("confirmDelete")}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingId(null)}>
                        {t("keepAddress")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </ListShell>
        )}
      </CardContent>
    </CardShell>
  );
}
