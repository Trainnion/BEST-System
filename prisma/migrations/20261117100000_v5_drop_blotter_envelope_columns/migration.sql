-- V5 (WP-04): field encryption is server-side now.
-- BlotterReport keeps only enc_payload, stored as
-- v1.<kid>.<iv>.<ct>.<tag>; the V4 RSA envelope columns are removed.
ALTER TABLE "BlotterReport" DROP COLUMN "enc_iv";
ALTER TABLE "BlotterReport" DROP COLUMN "enc_wrapped_key";
ALTER TABLE "BlotterReport" DROP COLUMN "enc_key_id";
