CREATE TYPE "PaymentResolutionStatus" AS ENUM ('NONE', 'REFUND_REQUIRED');

ALTER TABLE "payments"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'VND',
  ADD COLUMN "resolutionStatus" "PaymentResolutionStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "resolutionReason" TEXT;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_currency_check"
  CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "payments" ALTER COLUMN "currency" DROP DEFAULT;

CREATE TABLE "provider_webhook_events" (
  "id" UUID NOT NULL,
  "provider" VARCHAR(32) NOT NULL,
  "providerEventId" VARCHAR(255) NOT NULL,
  "paymentId" UUID NOT NULL,
  "providerTransactionId" VARCHAR(255) NOT NULL,
  "outcome" "PaymentStatus" NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "provider_webhook_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_webhook_events_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "provider_webhook_events_provider_providerEventId_key"
  ON "provider_webhook_events"("provider", "providerEventId");
CREATE INDEX "provider_webhook_events_paymentId_receivedAt_idx"
  ON "provider_webhook_events"("paymentId", "receivedAt");
