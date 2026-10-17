export type MenuLink = {
  label: { en: string; bn: string };
  href: string;
  badge?: { en: string; bn: string } | null;
};
export type MenuColumn = {
  title: { en: string; bn: string };
  links: MenuLink[];
};
export type MenuProduct = {
  id: string;
  slug: string;
  title: { en: string; bn: string };
  image: string;
  /** Integer BDT. */
  price: number;
  /** Integer BDT; rendered struck-through when present. */
  compareAtPrice?: number;
  badge?: { en: string; bn: string } | null;
};
export type MenuCategory = {
  id: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  label: { en: string; bn: string };
  href: string;
  columns?: MenuColumn[];
  /** Hand-picked products shown as a "Featured products" row in the panel. */
  products?: MenuProduct[];
};
