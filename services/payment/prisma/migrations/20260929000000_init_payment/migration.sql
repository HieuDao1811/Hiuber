CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'MOCK_ONLINE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "OrderSyncStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SYNCED');

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "providerTransactionId" TEXT,
  "failureCode" TEXT,
  "idempotencyKey" VARCHAR(255) NOT NULL,
  "requestHash" CHAR(64) NOT NULL,
  "orderSyncStatus" "OrderSyncStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "orderSyncAttempts" INTEGER NOT NULL DEFAULT 0,
  "nextOrderSyncAt" TIMESTAMP(3),
  "orderSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_amount_positive_check" CHECK ("amount" > 0),
  CONSTRAINT "payments_sync_attempts_check" CHECK ("orderSyncAttempts" >= 0)
);

CREATE UNIQUE INDEX "payments_customerId_idempotencyKey_key"
  ON "payments"("customerId", "idempotencyKey");
CREATE UNIQUE INDEX "payments_providerTransactionId_key"
  ON "payments"("providerTransactionId");
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX "payments_customerId_createdAt_idx"
  ON "payments"("customerId", "createdAt");
CREATE INDEX "payments_orderSyncStatus_nextOrderSyncAt_idx"
  ON "payments"("orderSyncStatus", "nextOrderSyncAt");

-- Serializes active attempts for an order. FAILED rows leave the slot, so a
-- retry with a new idempotency key is possible. This is intentionally stronger
-- than merely preventing two SUCCEEDED rows: a second provider call never starts.
CREATE UNIQUE INDEX "payments_one_active_per_order_key"
  ON "payments"("orderId")
  WHERE "status" IN ('PENDING', 'PROCESSING', 'SUCCEEDED');
