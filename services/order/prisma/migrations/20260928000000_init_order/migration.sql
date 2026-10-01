CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "customerUserId" UUID NOT NULL,
  "restaurantId" UUID NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "addressLabel" TEXT,
  "deliveryAddress" TEXT NOT NULL,
  "receiverName" TEXT NOT NULL,
  "receiverPhone" TEXT NOT NULL,
  "subtotal" DECIMAL(18,2) NOT NULL,
  "deliveryFee" DECIMAL(18,2) NOT NULL,
  "totalPrice" DECIMAL(18,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_non_negative_amounts_check"
    CHECK ("subtotal" >= 0 AND "deliveryFee" >= 0 AND "totalPrice" >= 0),
  CONSTRAINT "orders_total_price_check"
    CHECK ("totalPrice" = "subtotal" + "deliveryFee")
);

CREATE TABLE "order_items" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "menuItemId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lineTotal" DECIMAL(18,2) NOT NULL,

  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_positive_values_check"
    CHECK ("unitPrice" >= 0 AND "quantity" > 0 AND "lineTotal" >= 0),
  CONSTRAINT "order_items_line_total_check"
    CHECK ("lineTotal" = "unitPrice" * "quantity")
);

CREATE INDEX "orders_customerUserId_createdAt_idx"
  ON "orders"("customerUserId", "createdAt");
CREATE INDEX "orders_restaurantId_createdAt_idx"
  ON "orders"("restaurantId", "createdAt");
CREATE INDEX "orders_restaurantId_status_idx"
  ON "orders"("restaurantId", "status");
CREATE UNIQUE INDEX "order_items_orderId_menuItemId_key"
  ON "order_items"("orderId", "menuItemId");
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

