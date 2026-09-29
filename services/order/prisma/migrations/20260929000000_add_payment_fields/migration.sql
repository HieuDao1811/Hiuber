CREATE TYPE "PaymentMethod" AS ENUM ('COD', 'MOCK_ONLINE');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

ALTER TABLE "orders"
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");
