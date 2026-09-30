CREATE TYPE "OrderEventType" AS ENUM (
  'ORDER_CREATED',
  'ORDER_STATUS_UPDATED',
  'PAYMENT_STATUS_UPDATED'
);

ALTER TABLE "orders"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_version_positive_check" CHECK ("version" > 0);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "recipientUserId" UUID NOT NULL,
  "type" "OrderEventType" NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "orderId" UUID,
  "sourceEventId" UUID NOT NULL,
  "orderVersion" INTEGER,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_order_version_check"
    CHECK ("orderVersion" IS NULL OR "orderVersion" > 0),
  CONSTRAINT "notifications_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "order_event_outbox" (
  "eventId" UUID NOT NULL,
  "type" "OrderEventType" NOT NULL,
  "orderId" UUID NOT NULL,
  "orderVersion" INTEGER NOT NULL,
  "orderStatus" "OrderStatus" NOT NULL,
  "paymentStatus" "PaymentStatus" NOT NULL,
  "paymentMethod" "PaymentMethod",
  "customerUserId" UUID NOT NULL,
  "restaurantOwnerUserId" UUID NOT NULL,
  "restaurantId" UUID NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispatchedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_event_outbox_pkey" PRIMARY KEY ("eventId"),
  CONSTRAINT "order_event_outbox_version_positive_check"
    CHECK ("orderVersion" > 0),
  CONSTRAINT "order_event_outbox_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "order_event_outbox_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notifications_recipientUserId_sourceEventId_key"
  ON "notifications"("recipientUserId", "sourceEventId");
CREATE INDEX "notifications_recipientUserId_createdAt_id_idx"
  ON "notifications"("recipientUserId", "createdAt", "id");
CREATE INDEX "notifications_recipientUserId_readAt_idx"
  ON "notifications"("recipientUserId", "readAt");
CREATE INDEX "order_event_outbox_dispatchedAt_nextAttemptAt_idx"
  ON "order_event_outbox"("dispatchedAt", "nextAttemptAt");
