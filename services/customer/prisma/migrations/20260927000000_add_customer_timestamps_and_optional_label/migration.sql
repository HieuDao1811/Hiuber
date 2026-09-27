ALTER TABLE "customer_profiles"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "customer_profiles"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "customer_profiles"
ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "customer_addresses"
ALTER COLUMN "label" DROP NOT NULL,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "customer_addresses"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "customer_addresses"
ALTER COLUMN "updatedAt" SET NOT NULL;
