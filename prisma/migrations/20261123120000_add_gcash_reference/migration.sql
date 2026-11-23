ALTER TABLE "PaymentRecord"
ADD COLUMN "gcash_reference_no" TEXT;

CREATE UNIQUE INDEX "PaymentRecord_gcash_reference_no_key"
ON "PaymentRecord"("gcash_reference_no");

ALTER TABLE "PaymentRecord"
ALTER COLUMN "receipt_or_no" DROP NOT NULL;
