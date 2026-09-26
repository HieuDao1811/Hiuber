CREATE TABLE "customer_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_profiles_userId_key" ON "customer_profiles"("userId");
CREATE INDEX "customer_addresses_customerId_idx" ON "customer_addresses"("customerId");
CREATE UNIQUE INDEX "customer_addresses_one_default_per_customer_key"
ON "customer_addresses"("customerId") WHERE "isDefault" = true;

ALTER TABLE "customer_addresses"
ADD CONSTRAINT "customer_addresses_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
