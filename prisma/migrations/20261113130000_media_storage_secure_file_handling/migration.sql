-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('LISTING_IMAGE', 'CATEGORY_IMAGE', 'SELLER_VERIFICATION_DOCUMENT', 'PROOF_OF_DELIVERY');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING_UPLOAD', 'ACTIVE', 'DELETED', 'REPLACED');

-- CreateEnum
CREATE TYPE "PrivateFileAccessActorType" AS ENUM ('USER', 'ANONYMOUS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PrivateFileAccessResult" AS ENUM ('GRANTED', 'DENIED');

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "visibility" "MediaVisibility" NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "fileNameOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "checksumSha256" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "sortOrder" INTEGER,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "uploadedByUserId" TEXT NOT NULL,
    "listingId" TEXT,
    "listingVariantId" TEXT,
    "categoryId" TEXT,
    "sellerApplicationId" TEXT,
    "shipmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_file_access_log" (
    "id" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "actorType" "PrivateFileAccessActorType" NOT NULL,
    "accessedByUserId" TEXT,
    "actorRoleOrContext" TEXT,
    "purpose" TEXT NOT NULL,
    "parentType" TEXT,
    "parentId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "result" "PrivateFileAccessResult" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_file_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_storageKey_key" ON "media_asset"("storageKey");

-- CreateIndex
CREATE INDEX "media_asset_purpose_status_idx" ON "media_asset"("purpose", "status");

-- CreateIndex
CREATE INDEX "media_asset_uploadedByUserId_idx" ON "media_asset"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "media_asset_listingId_idx" ON "media_asset"("listingId");

-- CreateIndex
CREATE INDEX "media_asset_listingVariantId_idx" ON "media_asset"("listingVariantId");

-- CreateIndex
CREATE INDEX "media_asset_categoryId_idx" ON "media_asset"("categoryId");

-- CreateIndex
CREATE INDEX "media_asset_sellerApplicationId_idx" ON "media_asset"("sellerApplicationId");

-- CreateIndex
CREATE INDEX "media_asset_shipmentId_idx" ON "media_asset"("shipmentId");

-- CreateIndex
CREATE INDEX "private_file_access_log_mediaAssetId_createdAt_idx" ON "private_file_access_log"("mediaAssetId", "createdAt");

-- CreateIndex
CREATE INDEX "private_file_access_log_accessedByUserId_idx" ON "private_file_access_log"("accessedByUserId");

-- CreateIndex
CREATE INDEX "private_file_access_log_result_idx" ON "private_file_access_log"("result");

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_sellerApplicationId_fkey" FOREIGN KEY ("sellerApplicationId") REFERENCES "seller_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_file_access_log" ADD CONSTRAINT "private_file_access_log_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_file_access_log" ADD CONSTRAINT "private_file_access_log_accessedByUserId_fkey" FOREIGN KEY ("accessedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

