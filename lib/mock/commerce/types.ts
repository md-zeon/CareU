import type { LocalizedText } from "../types";

export type MockCartItem = {
  id: string;
  cartId: string;
  listingId: string;
  variantId?: string;
  shopId: string;
  quantity: number;
  unitPriceBdt: number;
  lineTotalBdt: number;
  title: LocalizedText;
  image?: string;
};

export type MockCart = {
  id: string;
  personaId: string;
  items: MockCartItem[];
  subtotalBdt: number;
  deliveryEstimateBdt?: number;
  totalBdt: number;
};

export type MockWishlistItem = {
  id: string;
  listingId: string;
  productId: string;
  title: LocalizedText;
  priceBdt: number;
  image?: string;
};

export type MockWishlist = {
  id: string;
  personaId: string;
  items: MockWishlistItem[];
};

export type MockAddress = {
  id: string;
  personaId: string;
  label: LocalizedText;
  recipientName: string;
  phone: string;
  line1: LocalizedText | string;
  line2?: LocalizedText | string;
  district: LocalizedText | string;
  area: LocalizedText | string;
  isDefault: boolean;
};
