ALTER TABLE "orders"
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'VND';

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_currency_check"
  CHECK ("currency" ~ '^[A-Z]{3}$');
