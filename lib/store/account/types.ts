/** State and actions for the browser only account prototype store. */

import type {
  AccountResult,
  AddressDraft,
  CustomerProfileView,
  ProfileDraft,
  SavedAddressView,
} from "@/lib/mock/account";

export type AccountStoredState = {
  customerId: string | null;
  profile: CustomerProfileView | null;
  addresses: SavedAddressView[];
};

export type AccountActions = {
  saveProfile: (customerId: string, draft: ProfileDraft) => AccountResult<CustomerProfileView>;
  saveAddress: (customerId: string, draft: AddressDraft, addressId?: string) => AccountResult<SavedAddressView>;
  deleteAddress: (customerId: string, addressId: string) => AccountResult<{ removed: boolean }>;
  setDefaultAddress: (customerId: string, addressId: string) => AccountResult<SavedAddressView[]>;
  resetForPersona: (customerId: string | null) => void;
};

export type AccountStore = AccountStoredState & AccountActions;
