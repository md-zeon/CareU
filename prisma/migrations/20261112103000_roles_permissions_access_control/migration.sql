-- Roles, permissions, and access control (spec 0002)

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'CATALOGUE_PRICING', 'INVENTORY_PROCUREMENT', 'DELIVERY_OPERATIONS', 'CUSTOMER_SUPPORT', 'FINANCE_SETTLEMENTS', 'TRUST_MODERATION');

-- CreateEnum
CREATE TYPE "PlatformRoleGrantSource" AS ENUM ('ADMIN', 'BOOTSTRAP');

-- CreateEnum
CREATE TYPE "ShopRole" AS ENUM ('MANAGER', 'CATALOGUE', 'FULFILMENT', 'SUPPORT');

-- DropIndex
DROP INDEX "shop_membership_shopId_userId_key";

-- AlterTable: clear placeholder rows, then replace the placeholder role string with a required typed role.
DELETE FROM "shop_membership"
WHERE "status" = 'REMOVED'
   OR "membershipRole" IS NULL
   OR btrim("membershipRole") = '';

ALTER TABLE "shop_membership" DROP COLUMN "membershipRole",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "role" "ShopRole" NOT NULL;

-- CreateTable
CREATE TABLE "platform_role_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "grantSource" "PlatformRoleGrantSource" NOT NULL DEFAULT 'ADMIN',
    "grantedByUserId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_role_assignment_userId_revokedAt_idx" ON "platform_role_assignment"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "platform_role_assignment_role_revokedAt_idx" ON "platform_role_assignment"("role", "revokedAt");

-- CreateIndex
CREATE INDEX "platform_role_assignment_userId_role_idx" ON "platform_role_assignment"("userId", "role");

-- Live platform assignment: one active row per user and role (AC-1)
CREATE UNIQUE INDEX "platform_role_assignment_user_role_live_unique_idx"
  ON "platform_role_assignment" ("userId", "role")
  WHERE "revokedAt" IS NULL;

-- CreateIndex
CREATE INDEX "shop_membership_shopId_status_idx" ON "shop_membership"("shopId", "status");

-- Live shop membership: one non removed row per user per shop, so a removed member can be invited again (AC-1)
CREATE UNIQUE INDEX "shop_membership_shop_user_live_unique_idx"
  ON "shop_membership" ("shopId", "userId")
  WHERE "status" <> 'REMOVED';

-- AddForeignKey
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
