/**
 * Types for the shared browser prototype store behind the cart and wishlist.
 *
 * A line keeps only raw ids and quantities. Every display value is resolved
 * from mock catalog data when a page renders, so the store never holds stale
 * titles, prices, or images.
 */

export type LineIdentity = {
  productId: string;
  variantId: string | null;
  shopId: string;
};

export type ActiveCartLine = LineIdentity & {
  lineId: string;
  quantity: number;
  selected: boolean;
  addedAt: string;
};

export type SavedForLaterLine = LineIdentity & {
  lineId: string;
  quantity: number;
  savedAt: string;
};

export type WishlistLine = LineIdentity & {
  lineId: string;
  addedAt: string;
};

export type ResolvableLine = ActiveCartLine | SavedForLaterLine | WishlistLine;

export type SharedPrototypeState = {
  activeCartLines: ActiveCartLine[];
  savedForLaterLines: SavedForLaterLine[];
  wishlistLines: WishlistLine[];
  checkoutLineIds: string[];
};

export type AddLineInput = LineIdentity & {
  quantity?: number;
};

export type SharedPrototypeActions = {
  addToCart: (input: AddLineInput) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  toggleSelected: (lineId: string) => void;
  selectAll: (shopId?: string) => void;
  clearSelection: (shopId?: string) => void;
  saveForLater: (lineId: string) => void;
  removeSavedForLater: (lineId: string) => void;
  moveSavedToCart: (lineId: string) => void;
  moveSavedToWishlist: (lineId: string) => void;
  moveCartToWishlist: (lineId: string) => void;
  addToWishlist: (input: LineIdentity) => void;
  removeFromWishlist: (lineId: string) => void;
  moveWishlistToCart: (lineId: string) => void;
  proceedToCheckout: (lineIds: string[]) => void;
  resetAll: () => void;
};

export type SharedPrototypeStore = SharedPrototypeState & SharedPrototypeActions;
