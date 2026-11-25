ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'BPI_MOCK';

ALTER TABLE "PaymentRecord"
RENAME COLUMN "gcash_reference_no" TO "payment_reference_no";

DROP INDEX "PaymentRecord_gcash_reference_no_key";

CREATE UNIQUE INDEX "PaymentRecord_payment_method_payment_reference_no_key"
ON "PaymentRecord"("payment_method", "payment_reference_no");
