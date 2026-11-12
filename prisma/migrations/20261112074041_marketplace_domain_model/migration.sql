-- CreateEnum
CREATE TYPE "SellerApplicationType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SellerApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SellerVerificationDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ShopMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CategoryAttributeValueType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ListingPublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "ListingVariantStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "StockLocationType" AS ENUM ('WAREHOUSE', 'SHOP', 'PLATFORM');

-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('SALE', 'RESERVE', 'RELEASE', 'RETURN', 'RESTOCK', 'DAMAGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'ONLINE');

-- CreateEnum
CREATE TYPE "PaymentCanonicalStatus" AS ENUM ('INITIATED', 'PENDING', 'AUTHORIZED_OR_PAID', 'FAILED', 'CANCELLED', 'UNCERTAIN', 'RECONCILED', 'SETTLED');

-- CreateEnum
CREATE TYPE "PaymentEventVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'INVALID', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL_PAYMENT', 'BANK_TRANSFER', 'MOBILE_WALLET', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CODReconciliationRecordType" AS ENUM ('COLLECTED', 'COURIER_HELD', 'REMITTED', 'SHORTAGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CODReconciliationStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('SALE', 'COMMISSION', 'DISCOUNT_FUNDING', 'REFUND', 'PAYOUT', 'COD_COLLECTION', 'COD_REMITTANCE', 'ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEligibilityStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'BLOCKED', 'SETTLED', 'VOID');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportCasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportMessageVisibility" AS ENUM ('CUSTOMER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'PARTIALLY_FULFILLED', 'PARTIALLY_CANCELLED', 'PARTIALLY_RETURNED');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'COD_PENDING', 'COD_COLLECTED');

-- CreateEnum
CREATE TYPE "DeliveryAssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryAssigneeType" AS ENUM ('STAFF', 'COURIER', 'OTHER');

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "isProhibited" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueType" "CategoryAttributeValueType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "attributes" JSONB,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "attributes" JSONB,
    "moderationStatus" "ListingModerationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishStatus" "ListingPublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_variant" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "sku" TEXT NOT NULL,
    "pricePoisha" BIGINT NOT NULL,
    "compareAtPoisha" BIGINT,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "ListingVariantStatus" NOT NULL DEFAULT 'DRAFT',
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "listingVariantId" TEXT,
    "storageKey" TEXT,
    "publicUrl" TEXT,
    "mediaType" "ListingMediaType" NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "recipient" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "area" TEXT,
    "district" TEXT NOT NULL,
    "division" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_item" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "listingId" TEXT,
    "listingVariantId" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_location" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "name" TEXT NOT NULL,
    "type" "StockLocationType" NOT NULL DEFAULT 'PLATFORM',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "address" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balance" (
    "id" TEXT NOT NULL,
    "listingVariantId" TEXT NOT NULL,
    "stockLocationId" TEXT NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "listingVariantId" TEXT NOT NULL,
    "stockLocationId" TEXT NOT NULL,
    "reason" "StockMovementReason" NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservation" (
    "id" TEXT NOT NULL,
    "checkoutKey" TEXT,
    "orderId" TEXT,
    "listingVariantId" TEXT NOT NULL,
    "stockLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "checkoutIdempotencyKey" TEXT,
    "customerUserId" TEXT NOT NULL,
    "shippingAddressId" TEXT,
    "shippingAddressSnapshot" JSONB NOT NULL,
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PLACED',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "fxRateScaled" BIGINT,
    "fxRateScale" INTEGER,
    "fxBaseCurrency" TEXT,
    "fxQuoteCurrency" TEXT,
    "subtotalPoisha" BIGINT NOT NULL,
    "discountPoisha" BIGINT NOT NULL DEFAULT 0,
    "careuFundedDiscountPoisha" BIGINT NOT NULL DEFAULT 0,
    "sellerFundedDiscountPoisha" BIGINT NOT NULL DEFAULT 0,
    "discountReference" TEXT,
    "deliveryPoisha" BIGINT NOT NULL DEFAULT 0,
    "taxPoisha" BIGINT NOT NULL DEFAULT 0,
    "totalPoisha" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PLACED',
    "deliveryMethod" TEXT,
    "deliveryChargePoisha" BIGINT NOT NULL DEFAULT 0,
    "destinationSnapshot" JSONB,
    "trackingCode" TEXT,
    "carrierName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "listingVariantId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "variantSnapshot" JSONB,
    "unitPricePoisha" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discountPoisha" BIGINT NOT NULL DEFAULT 0,
    "careuFundedDiscountPoisha" BIGINT NOT NULL DEFAULT 0,
    "sellerFundedDiscountPoisha" BIGINT NOT NULL DEFAULT 0,
    "discountReference" TEXT,
    "taxPoisha" BIGINT NOT NULL DEFAULT 0,
    "commissionRuleId" TEXT,
    "commissionRateBps" INTEGER,
    "commissionBasePoisha" BIGINT NOT NULL,
    "commissionPoisha" BIGINT NOT NULL,
    "lineTotalPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PLACED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "FulfillmentStatus",
    "toStatus" "FulfillmentStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payment_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderPaymentStatus",
    "toStatus" "OrderPaymentStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_payment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_status_history" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "fromStatus" "FulfillmentStatus",
    "toStatus" "FulfillmentStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_assignment" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "assigneeType" "DeliveryAssigneeType" NOT NULL,
    "assigneeId" TEXT,
    "status" "DeliveryAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_of_delivery" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientName" TEXT,
    "mediaStorageKey" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedByUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "provider" TEXT,
    "providerReference" TEXT,
    "canonicalStatus" "PaymentCanonicalStatus" NOT NULL DEFAULT 'INITIATED',
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_event" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "provider" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "verificationStatus" "PaymentEventVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "processingResult" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "orderId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "orderItemId" TEXT,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "method" "RefundMethod",
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "providerReference" TEXT,
    "transactionReference" TEXT,
    "metadata" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rule" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "scopeType" TEXT NOT NULL DEFAULT 'category',
    "rateBps" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_ledger_entry" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "shopId" TEXT,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "orderItemId" TEXT,
    "paymentId" TEXT,
    "refundId" TEXT,
    "payoutBatchId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "direction" "LedgerDirection" NOT NULL,
    "eligibilityStatus" "LedgerEligibilityStatus",
    "reason" TEXT,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_batch" (
    "id" TEXT NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "method" TEXT,
    "destinationRef" TEXT,
    "totalAmountPoisha" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_item" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "payoutBatchId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "method" TEXT,
    "destinationRef" TEXT,
    "status" "PayoutItemStatus" NOT NULL DEFAULT 'PENDING',
    "transactionReference" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cod_reconciliation_record" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "shopId" TEXT,
    "recordType" "CODReconciliationRecordType" NOT NULL,
    "amountPoisha" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "CODReconciliationStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceRef" TEXT,
    "reason" TEXT,
    "actorUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolvesRecordId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cod_reconciliation_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_application" (
    "id" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "type" "SellerApplicationType" NOT NULL,
    "status" "SellerApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "businessName" TEXT,
    "legalName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "district" TEXT,
    "division" TEXT,
    "postalCode" TEXT,
    "profileData" JSONB,
    "submittedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_verification_document" (
    "id" TEXT NOT NULL,
    "sellerApplicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "status" "SellerVerificationDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_verification_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isFirstParty" BOOLEAN NOT NULL DEFAULT false,
    "status" "ShopStatus" NOT NULL DEFAULT 'PENDING',
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "pausedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_membership" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipRole" TEXT,
    "status" "ShopMembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "productId" TEXT,
    "orderItemId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "editedAt" TIMESTAMP(3),
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_case" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "shopId" TEXT,
    "assigneeUserId" TEXT,
    "category" TEXT,
    "priority" "SupportCasePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_case_status_history" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "fromStatus" "SupportCaseStatus",
    "toStatus" "SupportCaseStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_case_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_message" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "authorType" TEXT NOT NULL,
    "visibility" "SupportMessageVisibility" NOT NULL DEFAULT 'CUSTOMER',
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "orderItemId" TEXT,
    "shopId" TEXT NOT NULL,
    "openedByUserId" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "customerExplanation" TEXT,
    "sellerExplanation" TEXT,
    "evidence" JSONB,
    "decisionReason" TEXT,
    "resolution" TEXT,
    "moneyImpactPoisha" BIGINT,
    "eligibilityImpact" TEXT,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "payload" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_status_history" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "fromStatus" "NotificationStatus",
    "toStatus" "NotificationStatus" NOT NULL,
    "actorUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorScope" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "shopId" TEXT,
    "reason" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_parentId_idx" ON "category"("parentId");

-- CreateIndex
CREATE INDEX "category_status_idx" ON "category"("status");

-- CreateIndex
CREATE INDEX "category_attribute_categoryId_idx" ON "category_attribute"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_categoryId_key_key" ON "category_attribute"("categoryId", "key");

-- CreateIndex
CREATE INDEX "product_categoryId_idx" ON "product"("categoryId");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE INDEX "product_variant_productId_idx" ON "product_variant"("productId");

-- CreateIndex
CREATE INDEX "listing_shopId_idx" ON "listing"("shopId");

-- CreateIndex
CREATE INDEX "listing_productId_idx" ON "listing"("productId");

-- CreateIndex
CREATE INDEX "listing_categoryId_idx" ON "listing"("categoryId");

-- CreateIndex
CREATE INDEX "listing_moderationStatus_idx" ON "listing"("moderationStatus");

-- CreateIndex
CREATE INDEX "listing_publishStatus_idx" ON "listing"("publishStatus");

-- CreateIndex
CREATE INDEX "listing_variant_listingId_idx" ON "listing_variant"("listingId");

-- CreateIndex
CREATE INDEX "listing_variant_productVariantId_idx" ON "listing_variant"("productVariantId");

-- CreateIndex
CREATE INDEX "listing_variant_status_idx" ON "listing_variant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "listing_variant_listingId_sku_key" ON "listing_variant"("listingId", "sku");

-- CreateIndex
CREATE INDEX "listing_media_listingId_idx" ON "listing_media"("listingId");

-- CreateIndex
CREATE INDEX "listing_media_listingVariantId_idx" ON "listing_media"("listingVariantId");

-- CreateIndex
CREATE INDEX "saved_address_userId_idx" ON "saved_address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_userId_key" ON "wishlist"("userId");

-- CreateIndex
CREATE INDEX "wishlist_item_wishlistId_idx" ON "wishlist_item"("wishlistId");

-- CreateIndex
CREATE INDEX "wishlist_item_listingId_idx" ON "wishlist_item"("listingId");

-- CreateIndex
CREATE INDEX "wishlist_item_listingVariantId_idx" ON "wishlist_item"("listingVariantId");

-- CreateIndex
CREATE INDEX "stock_location_shopId_idx" ON "stock_location"("shopId");

-- CreateIndex
CREATE INDEX "inventory_balance_stockLocationId_idx" ON "inventory_balance"("stockLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balance_listingVariantId_stockLocationId_key" ON "inventory_balance"("listingVariantId", "stockLocationId");

-- CreateIndex
CREATE INDEX "stock_movement_listingVariantId_idx" ON "stock_movement"("listingVariantId");

-- CreateIndex
CREATE INDEX "stock_movement_stockLocationId_idx" ON "stock_movement"("stockLocationId");

-- CreateIndex
CREATE INDEX "stock_movement_referenceType_referenceId_idx" ON "stock_movement"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "stock_movement_createdAt_idx" ON "stock_movement"("createdAt");

-- CreateIndex
CREATE INDEX "stock_reservation_checkoutKey_idx" ON "stock_reservation"("checkoutKey");

-- CreateIndex
CREATE INDEX "stock_reservation_orderId_idx" ON "stock_reservation"("orderId");

-- CreateIndex
CREATE INDEX "stock_reservation_listingVariantId_idx" ON "stock_reservation"("listingVariantId");

-- CreateIndex
CREATE INDEX "stock_reservation_status_expiresAt_idx" ON "stock_reservation"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reservation_idempotencyKey_key" ON "stock_reservation"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNumber_key" ON "order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_checkoutIdempotencyKey_key" ON "order"("checkoutIdempotencyKey");

-- CreateIndex
CREATE INDEX "order_customerUserId_idx" ON "order"("customerUserId");

-- CreateIndex
CREATE INDEX "order_paymentStatus_idx" ON "order"("paymentStatus");

-- CreateIndex
CREATE INDEX "order_fulfillmentStatus_idx" ON "order"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "order_createdAt_idx" ON "order"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_shipmentNumber_key" ON "shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "shipment_orderId_idx" ON "shipment"("orderId");

-- CreateIndex
CREATE INDEX "shipment_shopId_idx" ON "shipment"("shopId");

-- CreateIndex
CREATE INDEX "shipment_fulfillmentStatus_idx" ON "shipment"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_shipmentId_idx" ON "order_item"("shipmentId");

-- CreateIndex
CREATE INDEX "order_item_shopId_idx" ON "order_item"("shopId");

-- CreateIndex
CREATE INDEX "order_item_listingVariantId_idx" ON "order_item"("listingVariantId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_payment_status_history_orderId_createdAt_idx" ON "order_payment_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "shipment_status_history_shipmentId_createdAt_idx" ON "shipment_status_history"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_assignment_shipmentId_idx" ON "delivery_assignment"("shipmentId");

-- CreateIndex
CREATE INDEX "delivery_assignment_assigneeType_assigneeId_idx" ON "delivery_assignment"("assigneeType", "assigneeId");

-- CreateIndex
CREATE INDEX "proof_of_delivery_shipmentId_idx" ON "proof_of_delivery"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_idempotencyKey_key" ON "payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_orderId_idx" ON "payment"("orderId");

-- CreateIndex
CREATE INDEX "payment_canonicalStatus_idx" ON "payment"("canonicalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_providerReference_key" ON "payment"("provider", "providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_event_eventKey_key" ON "payment_event"("eventKey");

-- CreateIndex
CREATE INDEX "payment_event_paymentId_idx" ON "payment_event"("paymentId");

-- CreateIndex
CREATE INDEX "payment_event_provider_idx" ON "payment_event"("provider");

-- CreateIndex
CREATE INDEX "payment_event_receivedAt_idx" ON "payment_event"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_idempotencyKey_key" ON "refund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "refund_orderId_idx" ON "refund"("orderId");

-- CreateIndex
CREATE INDEX "refund_shipmentId_idx" ON "refund"("shipmentId");

-- CreateIndex
CREATE INDEX "refund_orderItemId_idx" ON "refund"("orderItemId");

-- CreateIndex
CREATE INDEX "refund_status_idx" ON "refund"("status");

-- CreateIndex
CREATE INDEX "commission_rule_categoryId_idx" ON "commission_rule"("categoryId");

-- CreateIndex
CREATE INDEX "commission_rule_active_idx" ON "commission_rule"("active");

-- CreateIndex
CREATE UNIQUE INDEX "financial_ledger_entry_idempotencyKey_key" ON "financial_ledger_entry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_shopId_idx" ON "financial_ledger_entry"("shopId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_orderId_idx" ON "financial_ledger_entry"("orderId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_shipmentId_idx" ON "financial_ledger_entry"("shipmentId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_orderItemId_idx" ON "financial_ledger_entry"("orderItemId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_paymentId_idx" ON "financial_ledger_entry"("paymentId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_refundId_idx" ON "financial_ledger_entry"("refundId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_payoutBatchId_idx" ON "financial_ledger_entry"("payoutBatchId");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_entryType_idx" ON "financial_ledger_entry"("entryType");

-- CreateIndex
CREATE INDEX "financial_ledger_entry_createdAt_idx" ON "financial_ledger_entry"("createdAt");

-- CreateIndex
CREATE INDEX "payout_batch_status_idx" ON "payout_batch"("status");

-- CreateIndex
CREATE INDEX "payout_batch_approvedByUserId_idx" ON "payout_batch"("approvedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_item_idempotencyKey_key" ON "payout_item"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payout_item_payoutBatchId_idx" ON "payout_item"("payoutBatchId");

-- CreateIndex
CREATE INDEX "payout_item_shopId_idx" ON "payout_item"("shopId");

-- CreateIndex
CREATE INDEX "payout_item_status_idx" ON "payout_item"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cod_reconciliation_record_resolvesRecordId_key" ON "cod_reconciliation_record"("resolvesRecordId");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_orderId_idx" ON "cod_reconciliation_record"("orderId");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_shipmentId_idx" ON "cod_reconciliation_record"("shipmentId");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_shopId_idx" ON "cod_reconciliation_record"("shopId");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_status_idx" ON "cod_reconciliation_record"("status");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_recordType_idx" ON "cod_reconciliation_record"("recordType");

-- CreateIndex
CREATE INDEX "cod_reconciliation_record_resolvedByUserId_idx" ON "cod_reconciliation_record"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "seller_application_applicantUserId_idx" ON "seller_application"("applicantUserId");

-- CreateIndex
CREATE INDEX "seller_application_status_idx" ON "seller_application"("status");

-- CreateIndex
CREATE INDEX "seller_verification_document_sellerApplicationId_idx" ON "seller_verification_document"("sellerApplicationId");

-- CreateIndex
CREATE INDEX "seller_verification_document_status_idx" ON "seller_verification_document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shop_slug_key" ON "shop"("slug");

-- CreateIndex
CREATE INDEX "shop_status_idx" ON "shop"("status");

-- CreateIndex
CREATE INDEX "shop_isFirstParty_idx" ON "shop"("isFirstParty");

-- CreateIndex
CREATE UNIQUE INDEX "shop_ownerUserId_key" ON "shop"("ownerUserId");

-- CreateIndex
CREATE INDEX "shop_membership_userId_idx" ON "shop_membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_membership_shopId_userId_key" ON "shop_membership"("shopId", "userId");

-- CreateIndex
CREATE INDEX "review_listingId_idx" ON "review"("listingId");

-- CreateIndex
CREATE INDEX "review_productId_idx" ON "review"("productId");

-- CreateIndex
CREATE INDEX "review_userId_idx" ON "review"("userId");

-- CreateIndex
CREATE INDEX "review_status_idx" ON "review"("status");

-- CreateIndex
CREATE UNIQUE INDEX "review_userId_orderItemId_key" ON "review"("userId", "orderItemId");

-- CreateIndex
CREATE INDEX "support_case_customerUserId_idx" ON "support_case"("customerUserId");

-- CreateIndex
CREATE INDEX "support_case_orderId_idx" ON "support_case"("orderId");

-- CreateIndex
CREATE INDEX "support_case_orderItemId_idx" ON "support_case"("orderItemId");

-- CreateIndex
CREATE INDEX "support_case_shopId_idx" ON "support_case"("shopId");

-- CreateIndex
CREATE INDEX "support_case_assigneeUserId_status_idx" ON "support_case"("assigneeUserId", "status");

-- CreateIndex
CREATE INDEX "support_case_status_idx" ON "support_case"("status");

-- CreateIndex
CREATE INDEX "support_case_status_history_caseId_createdAt_idx" ON "support_case_status_history"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "support_message_caseId_createdAt_idx" ON "support_message"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "support_message_visibility_idx" ON "support_message"("visibility");

-- CreateIndex
CREATE INDEX "dispute_orderId_idx" ON "dispute"("orderId");

-- CreateIndex
CREATE INDEX "dispute_shipmentId_idx" ON "dispute"("shipmentId");

-- CreateIndex
CREATE INDEX "dispute_orderItemId_idx" ON "dispute"("orderItemId");

-- CreateIndex
CREATE INDEX "dispute_shopId_idx" ON "dispute"("shopId");

-- CreateIndex
CREATE INDEX "dispute_openedByUserId_idx" ON "dispute"("openedByUserId");

-- CreateIndex
CREATE INDEX "dispute_resolvedByUserId_idx" ON "dispute"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "dispute_status_idx" ON "dispute"("status");

-- CreateIndex
CREATE INDEX "notification_recipientUserId_idx" ON "notification"("recipientUserId");

-- CreateIndex
CREATE INDEX "notification_channel_status_idx" ON "notification"("channel", "status");

-- CreateIndex
CREATE INDEX "notification_relatedEntityType_relatedEntityId_idx" ON "notification"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "notification_status_history_notificationId_createdAt_idx" ON "notification_status_history"("notificationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_idx" ON "audit_log"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_shopId_idx" ON "audit_log"("shopId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute" ADD CONSTRAINT "category_attribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variant" ADD CONSTRAINT "listing_variant_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_variant" ADD CONSTRAINT "listing_variant_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_address" ADD CONSTRAINT "saved_address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_item" ADD CONSTRAINT "wishlist_item_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_location" ADD CONSTRAINT "stock_location_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balance" ADD CONSTRAINT "inventory_balance_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservation" ADD CONSTRAINT "stock_reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservation" ADD CONSTRAINT "stock_reservation_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservation" ADD CONSTRAINT "stock_reservation_stockLocationId_fkey" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "saved_address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_listingVariantId_fkey" FOREIGN KEY ("listingVariantId") REFERENCES "listing_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "commission_rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment_status_history" ADD CONSTRAINT "order_payment_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payment_status_history" ADD CONSTRAINT "order_payment_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_status_history" ADD CONSTRAINT "shipment_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignment" ADD CONSTRAINT "delivery_assignment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rule" ADD CONSTRAINT "commission_rule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entry" ADD CONSTRAINT "financial_ledger_entry_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_batch" ADD CONSTRAINT "payout_batch_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_item" ADD CONSTRAINT "payout_item_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "payout_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_item" ADD CONSTRAINT "payout_item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cod_reconciliation_record" ADD CONSTRAINT "cod_reconciliation_record_resolvesRecordId_fkey" FOREIGN KEY ("resolvesRecordId") REFERENCES "cod_reconciliation_record"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_application" ADD CONSTRAINT "seller_application_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_application" ADD CONSTRAINT "seller_application_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_verification_document" ADD CONSTRAINT "seller_verification_document_sellerApplicationId_fkey" FOREIGN KEY ("sellerApplicationId") REFERENCES "seller_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop" ADD CONSTRAINT "shop_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_membership" ADD CONSTRAINT "shop_membership_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_membership" ADD CONSTRAINT "shop_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_membership" ADD CONSTRAINT "shop_membership_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case" ADD CONSTRAINT "support_case_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case" ADD CONSTRAINT "support_case_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case" ADD CONSTRAINT "support_case_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case" ADD CONSTRAINT "support_case_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case" ADD CONSTRAINT "support_case_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case_status_history" ADD CONSTRAINT "support_case_status_history_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "support_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_case_status_history" ADD CONSTRAINT "support_case_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "support_case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_status_history" ADD CONSTRAINT "notification_status_history_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_status_history" ADD CONSTRAINT "notification_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Corrective integrity constraints not expressible in Prisma schema (spec 0001 review rework)
-- ---------------------------------------------------------------------------

-- Single first-party shop (platform boundary)
CREATE UNIQUE INDEX "shop_single_first_party_idx" ON "shop" ("isFirstParty") WHERE "isFirstParty" = true;

-- Wishlist target validity and duplicate prevention (nullable unique columns do not prevent duplicates)
ALTER TABLE "wishlist_item"
  ADD CONSTRAINT "wishlist_item_target_present_chk"
  CHECK ("listingId" IS NOT NULL OR "listingVariantId" IS NOT NULL);

CREATE UNIQUE INDEX "wishlist_item_wishlist_listing_unique_idx"
  ON "wishlist_item" ("wishlistId", "listingId")
  WHERE "listingVariantId" IS NULL AND "listingId" IS NOT NULL;

CREATE UNIQUE INDEX "wishlist_item_wishlist_listing_variant_unique_idx"
  ON "wishlist_item" ("wishlistId", "listingId", "listingVariantId")
  WHERE "listingVariantId" IS NOT NULL;

-- Listing media must reference at least one storage location
ALTER TABLE "listing_media"
  ADD CONSTRAINT "listing_media_reference_present_chk"
  CHECK ("storageKey" IS NOT NULL OR "publicUrl" IS NOT NULL);

-- Review must target a listing or product context (verified purchase remains order-item linked)
ALTER TABLE "review"
  ADD CONSTRAINT "review_target_present_chk"
  CHECK ("listingId" IS NOT NULL OR "productId" IS NOT NULL);

-- Money and quantity non-negative/positive checks (poisha = integer BDT)
ALTER TABLE "listing_variant"
  ADD CONSTRAINT "listing_variant_price_nonneg_chk" CHECK ("pricePoisha" >= 0),
  ADD CONSTRAINT "listing_variant_compare_at_nonneg_chk" CHECK ("compareAtPoisha" IS NULL OR "compareAtPoisha" >= 0);

ALTER TABLE "inventory_balance"
  ADD CONSTRAINT "inventory_balance_on_hand_nonneg_chk" CHECK ("onHand" >= 0),
  ADD CONSTRAINT "inventory_balance_reserved_nonneg_chk" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "inventory_balance_reserved_le_on_hand_chk" CHECK ("reserved" <= "onHand"),
  ADD CONSTRAINT "inventory_balance_low_stock_nonneg_chk" CHECK ("lowStockThreshold" IS NULL OR "lowStockThreshold" >= 0);

ALTER TABLE "stock_reservation"
  ADD CONSTRAINT "stock_reservation_quantity_pos_chk" CHECK ("quantity" > 0);

ALTER TABLE "order"
  ADD CONSTRAINT "order_subtotal_nonneg_chk" CHECK ("subtotalPoisha" >= 0),
  ADD CONSTRAINT "order_discount_nonneg_chk" CHECK ("discountPoisha" >= 0),
  ADD CONSTRAINT "order_careu_discount_nonneg_chk" CHECK ("careuFundedDiscountPoisha" >= 0),
  ADD CONSTRAINT "order_seller_discount_nonneg_chk" CHECK ("sellerFundedDiscountPoisha" >= 0),
  ADD CONSTRAINT "order_delivery_nonneg_chk" CHECK ("deliveryPoisha" >= 0),
  ADD CONSTRAINT "order_tax_nonneg_chk" CHECK ("taxPoisha" >= 0),
  ADD CONSTRAINT "order_total_nonneg_chk" CHECK ("totalPoisha" >= 0),
  ADD CONSTRAINT "order_discount_split_chk" CHECK ("careuFundedDiscountPoisha" + "sellerFundedDiscountPoisha" <= "discountPoisha" OR "discountPoisha" >= 0);

ALTER TABLE "shipment"
  ADD CONSTRAINT "shipment_delivery_charge_nonneg_chk" CHECK ("deliveryChargePoisha" >= 0);

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_unit_price_nonneg_chk" CHECK ("unitPricePoisha" >= 0),
  ADD CONSTRAINT "order_item_quantity_pos_chk" CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_item_discount_nonneg_chk" CHECK ("discountPoisha" >= 0),
  ADD CONSTRAINT "order_item_careu_discount_nonneg_chk" CHECK ("careuFundedDiscountPoisha" >= 0),
  ADD CONSTRAINT "order_item_seller_discount_nonneg_chk" CHECK ("sellerFundedDiscountPoisha" >= 0),
  ADD CONSTRAINT "order_item_tax_nonneg_chk" CHECK ("taxPoisha" >= 0),
  ADD CONSTRAINT "order_item_commission_base_nonneg_chk" CHECK ("commissionBasePoisha" >= 0),
  ADD CONSTRAINT "order_item_commission_nonneg_chk" CHECK ("commissionPoisha" >= 0),
  ADD CONSTRAINT "order_item_line_total_nonneg_chk" CHECK ("lineTotalPoisha" >= 0),
  ADD CONSTRAINT "order_item_commission_rate_nonneg_chk" CHECK ("commissionRateBps" IS NULL OR "commissionRateBps" >= 0);

ALTER TABLE "payment"
  ADD CONSTRAINT "payment_amount_nonneg_chk" CHECK ("amountPoisha" >= 0);

ALTER TABLE "refund"
  ADD CONSTRAINT "refund_amount_nonneg_chk" CHECK ("amountPoisha" >= 0);

ALTER TABLE "financial_ledger_entry"
  ADD CONSTRAINT "financial_ledger_entry_amount_nonneg_chk" CHECK ("amountPoisha" >= 0);

ALTER TABLE "payout_batch"
  ADD CONSTRAINT "payout_batch_total_nonneg_chk" CHECK ("totalAmountPoisha" >= 0);

ALTER TABLE "payout_item"
  ADD CONSTRAINT "payout_item_amount_nonneg_chk" CHECK ("amountPoisha" >= 0);

ALTER TABLE "cod_reconciliation_record"
  ADD CONSTRAINT "cod_reconciliation_record_amount_nonneg_chk" CHECK ("amountPoisha" >= 0);

ALTER TABLE "dispute"
  ADD CONSTRAINT "dispute_money_impact_nonneg_chk" CHECK ("moneyImpactPoisha" IS NULL OR "moneyImpactPoisha" >= 0);
