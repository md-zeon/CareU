/**
 * One vanilla Zustand store for profile and address edits. Like the cart
 * store, it is created per browser tree, skips hydration on the server, and
 * normalizes anything read from storage before a page uses it.
 */

import type { StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";
import {
  accountCustomerIds,
  accountError,
  accountFailure,
  accountNotFound,
  accountSuccess,
  createAddressSchema,
  createProfileSchema,
  mockAccountProfiles,
  mockDefaultAddresses,
  type AccountResult,
  type AddressDraft,
  type CustomerProfileView,
  type ProfileDraft,
  type SavedAddressView,
} from "@/lib/mock/account";
import type { AccountStore, AccountStoredState } from "./types";

export const ACCOUNT_STORAGE_KEY = "careu.prototype.account-v1";
export const ACCOUNT_STORAGE_VERSION = 1;

const ACCOUNT_ADDRESS_CAP = 6;

/** Message keys live in the Profile and Addresses namespaces. */
const PROFILE_MESSAGES = {
  nameRequired: "fieldNameRequired",
  phoneRequired: "fieldPhoneRequired",
  phoneInvalid: "fieldPhoneInvalid",
  emailInvalid: "fieldEmailInvalid",
};

const ADDRESS_MESSAGES = {
  labelRequired: "fieldLabelRequired",
  nameRequired: "fieldNameRequired",
  phoneRequired: "fieldPhoneRequired",
  phoneInvalid: "fieldPhoneInvalid",
  addressRequired: "fieldAddressRequired",
  districtRequired: "fieldDistrictRequired",
};

const profileSchema = createProfileSchema(PROFILE_MESSAGES);
const addressSchema = createAddressSchema(ADDRESS_MESSAGES);

let addressSequence = 0;
function createAddressId(): string {
  addressSequence += 1;
  return `addr-${Date.now().toString(36)}-${addressSequence.toString(36)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/** Actions only write the persona that is currently loaded in this store. */
function forbiddenFor<T>(customerId: string, activeCustomerId: string | null): AccountResult<T> | null {
  if (!accountCustomerIds.includes(customerId) || activeCustomerId !== customerId) {
    return accountFailure(accountError("forbidden", "forbiddenMessage", false));
  }
  return null;
}

function ownedDefaults(customerId: string | null): AccountStoredState {
  if (!customerId) return { customerId: null, profile: null, addresses: [] };
  return {
    customerId,
    profile: mockAccountProfiles.find((item) => item.customerId === customerId) ?? null,
    addresses: mockDefaultAddresses
      .filter((item) => item.customerId === customerId)
      .slice(0, ACCOUNT_ADDRESS_CAP)
      .map((item) => ({ ...item })),
  };
}

/** The server and first client render both start from the mock customer view. */
export const initialAccountState: AccountStoredState = {
  customerId: mockAccountProfiles[0]?.customerId ?? null,
  profile: mockAccountProfiles[0] ? { ...mockAccountProfiles[0] } : null,
  addresses: mockDefaultAddresses
    .filter((item) => item.customerId === (mockAccountProfiles[0]?.customerId ?? ""))
    .slice(0, ACCOUNT_ADDRESS_CAP)
    .map((item) => ({ ...item })),
};

function normalizeProfile(raw: unknown, customerId: string | null): CustomerProfileView | null {
  const fallback = ownedDefaults(customerId).profile;
  const value = asRecord(raw);
  if (!customerId || !value) return fallback;
  if (value.customerId !== customerId) return fallback;
  if (typeof value.name !== "string" || typeof value.phone !== "string") return fallback;
  const parsed = profileSchema.safeParse({
    name: value.name,
    phone: value.phone,
    email: typeof value.email === "string" ? value.email : "",
  });
  if (!parsed.success) return fallback;
  const memberSince = asRecord(value.memberSinceLabel);
  const memberSinceLabel =
    memberSince && typeof memberSince.en === "string" && typeof memberSince.bn === "string"
      ? { en: memberSince.en, bn: memberSince.bn }
      : fallback?.memberSinceLabel ?? { en: "", bn: "" };
  return {
    customerId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email === "" ? undefined : parsed.data.email,
    memberSinceLabel,
    avatarPath: typeof value.avatarPath === "string" ? value.avatarPath : undefined,
  };
}

function normalizeAddresses(raw: unknown, customerId: string | null): SavedAddressView[] {
  const fallback = ownedDefaults(customerId).addresses;
  if (!customerId || !Array.isArray(raw)) return fallback;
  const result: SavedAddressView[] = [];
  for (const item of raw) {
    const value = asRecord(item);
    if (!value || value.customerId !== customerId) continue;
    if (
      typeof value.id !== "string" ||
      typeof value.label !== "string" ||
      typeof value.recipientName !== "string" ||
      typeof value.phone !== "string" ||
      typeof value.addressLine !== "string" ||
      typeof value.district !== "string"
    ) {
      continue;
    }
    result.push({
      id: value.id,
      customerId,
      label: value.label,
      recipientName: value.recipientName,
      phone: value.phone,
      addressLine: value.addressLine,
      district: value.district,
      landmark: typeof value.landmark === "string" ? value.landmark : "",
      isDefault: value.isDefault === true,
    });
    if (result.length >= ACCOUNT_ADDRESS_CAP) break;
  }
  const defaults = result.filter((item) => item.isDefault);
  if (defaults.length !== 1) {
    return result.map((item, index) => ({ ...item, isDefault: index === 0 }));
  }
  return result;
}

export type AccountStoreApi = StoreApi<AccountStore> & {
  persist: { rehydrate: () => Promise<void> };
};

export function createAccountStore() {
  return createStore<AccountStore>()(
    persist<AccountStore, [], [], AccountStoredState>(
      (set, get) => ({
        ...initialAccountState,

        saveProfile: (customerId: string, draft: ProfileDraft): AccountResult<CustomerProfileView> => {
          const denied = forbiddenFor<CustomerProfileView>(customerId, get().customerId);
          if (denied) return denied;
          const parsed = profileSchema.safeParse(draft);
          if (!parsed.success) {
            return accountFailure(
              accountError("invalid", "invalidProfileMessage", false, z.flattenError(parsed.error).fieldErrors),
            );
          }
          const current = get();
          const profile: CustomerProfileView = {
            customerId,
            name: parsed.data.name,
            phone: parsed.data.phone,
            email: parsed.data.email === "" ? undefined : parsed.data.email,
            memberSinceLabel: current.profile?.memberSinceLabel ?? { en: "", bn: "" },
            avatarPath: current.profile?.avatarPath,
          };
          set({ customerId, profile, addresses: current.addresses });
          return accountSuccess(profile);
        },

        saveAddress: (
          customerId: string,
          draft: AddressDraft,
          addressId?: string,
        ): AccountResult<SavedAddressView> => {
          const denied = forbiddenFor<SavedAddressView>(customerId, get().customerId);
          if (denied) return denied;
          const parsed = addressSchema.safeParse(draft);
          if (!parsed.success) {
            return accountFailure(
              accountError("invalid", "invalidAddressMessage", false, z.flattenError(parsed.error).fieldErrors),
            );
          }
          const current = get();
          const values = parsed.data;
          const existingIndex = addressId ? current.addresses.findIndex((item) => item.id === addressId) : -1;
          if (addressId && existingIndex < 0) return accountNotFound("addressNotFoundMessage");
          if (existingIndex < 0 && current.addresses.length >= ACCOUNT_ADDRESS_CAP) {
            return accountFailure(accountError("invalid", "addressLimitMessage", false));
          }

          const address: SavedAddressView = {
            id: addressId ?? createAddressId(),
            customerId,
            label: values.label,
            recipientName: values.recipientName,
            phone: values.phone,
            addressLine: values.addressLine,
            district: values.district,
            landmark: values.landmark,
            isDefault: values.isDefault,
          };
          const addresses = [...current.addresses];
          if (existingIndex >= 0) addresses[existingIndex] = address;
          else addresses.push(address);

          const normalized = addresses.map((item) => {
            if (!values.isDefault) return item;
            return { ...item, isDefault: item.id === address.id };
          });
          const hasDefault = normalized.some((item) => item.isDefault);
          const withDefault = hasDefault || normalized.length === 0
            ? normalized
            : normalized.map((item, index) => ({ ...item, isDefault: index === 0 }));

          set({ customerId, profile: current.profile, addresses: withDefault });
          return accountSuccess(address);
        },

        deleteAddress: (customerId: string, addressId: string): AccountResult<{ removed: boolean }> => {
          const denied = forbiddenFor<{ removed: boolean }>(customerId, get().customerId);
          if (denied) return denied;
          const current = get();
          const target = current.addresses.find((item) => item.id === addressId);
          if (!target) return accountNotFound("addressNotFoundMessage");
          const remaining = current.addresses.filter((item) => item.id !== addressId);
          const addresses = target.isDefault && remaining.length > 0
            ? remaining.map((item, index) => ({ ...item, isDefault: index === 0 }))
            : remaining;
          set({ customerId, profile: current.profile, addresses });
          return accountSuccess({ removed: true });
        },

        setDefaultAddress: (customerId: string, addressId: string): AccountResult<SavedAddressView[]> => {
          const denied = forbiddenFor<SavedAddressView[]>(customerId, get().customerId);
          if (denied) return denied;
          const current = get();
          if (!current.addresses.some((item) => item.id === addressId)) {
            return accountNotFound("addressNotFoundMessage");
          }
          const addresses = current.addresses.map((item) => ({ ...item, isDefault: item.id === addressId }));
          set({ customerId, profile: current.profile, addresses });
          return accountSuccess(addresses);
        },

        resetForPersona: (customerId: string | null) => set({ ...ownedDefaults(customerId) }),
      }),
      {
        name: ACCOUNT_STORAGE_KEY,
        version: ACCOUNT_STORAGE_VERSION,
        skipHydration: true,
        partialize: (state): AccountStoredState => ({
          customerId: state.customerId,
          profile: state.profile,
          addresses: state.addresses,
        }),
        merge: (persisted, current) => {
          const value = asRecord(persisted) ?? {};
          const customerId =
            typeof value.customerId === "string" && accountCustomerIds.includes(value.customerId)
              ? value.customerId
              : null;
          return {
            ...current,
            customerId,
            profile: normalizeProfile(value.profile, customerId),
            addresses: normalizeAddresses(value.addresses, customerId),
          };
        },
      },
    ),
  );
}
