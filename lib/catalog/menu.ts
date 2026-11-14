import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mockMenuCategories } from "@/lib/mock/catalog";
import type { MenuCategory } from "./menu.types";

/**
 * Seeded desktop mega-menu data backed by the prototype mock foundation.
 * Swap the returned array with a Prisma query later.
 * Contract is stable: components read via getMenu() only.
 */
export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  return mockMenuCategories as MenuCategory[];
}
