/** Shared validation for the profile and address forms. */

import { z } from "zod";
import type { AddressDraft, ProfileDraft } from "./types";

/** The confirmed Bangladesh phone format used across CareU. */
export const ACCOUNT_PHONE_PATTERN = /^(\+880|0)1[3-9]\d{8}$/;

export type ProfileValidationMessages = {
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailInvalid: string;
};

export type AddressValidationMessages = {
  labelRequired: string;
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  addressRequired: string;
  districtRequired: string;
};

export function createProfileSchema(messages: ProfileValidationMessages) {
  return z
    .object({
      name: z.string().trim().min(2, messages.nameRequired),
      phone: z
        .string()
        .trim()
        .min(1, messages.phoneRequired)
        .regex(ACCOUNT_PHONE_PATTERN, messages.phoneInvalid),
      email: z
        .string()
        .trim()
        .refine(
          (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          messages.emailInvalid,
        ),
    })
    .strict();
}

export function createAddressSchema(messages: AddressValidationMessages) {
  return z
    .object({
      label: z.string().trim().min(2, messages.labelRequired),
      recipientName: z.string().trim().min(2, messages.nameRequired),
      phone: z
        .string()
        .trim()
        .min(1, messages.phoneRequired)
        .regex(ACCOUNT_PHONE_PATTERN, messages.phoneInvalid),
      addressLine: z.string().trim().min(5, messages.addressRequired),
      district: z.string().trim().min(2, messages.districtRequired),
      landmark: z.string().trim().max(120),
      isDefault: z.boolean(),
    })
    .strict();
}

export type ProfileSchema = ReturnType<typeof createProfileSchema>;
export type AddressSchema = ReturnType<typeof createAddressSchema>;

export type SchemaFieldErrors<T> = Partial<Record<keyof T, string[]>>;

export function validateProfileDraft(
  values: ProfileDraft,
  schema: ProfileSchema,
): { ok: true; data: ProfileDraft } | { ok: false; fieldErrors: SchemaFieldErrors<ProfileDraft> } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, fieldErrors: z.flattenError(result.error).fieldErrors as SchemaFieldErrors<ProfileDraft> };
}

export function validateAddressDraft(
  values: AddressDraft,
  schema: AddressSchema,
): { ok: true; data: AddressDraft } | { ok: false; fieldErrors: SchemaFieldErrors<AddressDraft> } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, fieldErrors: z.flattenError(result.error).fieldErrors as SchemaFieldErrors<AddressDraft> };
}
