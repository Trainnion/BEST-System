-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CLEARANCE', 'INDIGENCY');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'READY_FOR_PICKUP', 'RELEASED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BlotterStatus" AS ENUM ('FILED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('INTAKE_SCHEDULED', 'IN_PERSON_SCREENING', 'TREASURER_ASSESSED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'TREASURER', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "BroadcastCategory" AS ENUM ('AYUDA', 'HEALTH', 'VETERINARY', 'SCHOLARSHIP', 'URGENT');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'GCASH_MOCK', 'LANDBANK_MOCK');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED');

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "suffix" TEXT,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "civil_status" "CivilStatus" NOT NULL DEFAULT 'SINGLE',
    "blood_type" TEXT NOT NULL DEFAULT 'Unknown',
    "contact_number" TEXT NOT NULL,
    "email" TEXT,
    "purok" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "emergency_contact_name" TEXT NOT NULL,
    "emergency_contact_phone" TEXT NOT NULL,
    "photo_url" TEXT,
    "is_registered_voter" BOOLEAN NOT NULL DEFAULT true,
    "years_of_residency" INTEGER NOT NULL DEFAULT 1,
    "data_privacy_consent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentCredential" (
    "resident_id" TEXT NOT NULL,
    "password_hash" TEXT,
    "activation_hash" TEXT,
    "activation_expires" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "issued_by_id" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "session_valid_after" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResidentCredential_pkey" PRIMARY KEY ("resident_id")
);

-- CreateTable
CREATE TABLE "BarangayIDCard" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "barcode_data" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarangayIDCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "tracking_code" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "purpose" TEXT NOT NULL,
    "ctc_number" TEXT,
    "ctc_issued_date" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejection_reason" TEXT,
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "qr_hash" TEXT NOT NULL,
    "client_request_id" TEXT,
    "ai_verification" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("tracking_code")
);

-- CreateTable
CREATE TABLE "BusinessClearanceEntry" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "nature_of_business" TEXT NOT NULL,
    "business_address" TEXT NOT NULL,
    "declared_gross_income" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "physical_appointment_date" TIMESTAMP(3) NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'INTAKE_SCHEDULED',
    "assessed_by_id" TEXT,
    "assessed_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "assessment_notes" TEXT,
    "client_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClearanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessChecklistItem" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "item_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_complied" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "BusinessChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "document_request_id" TEXT,
    "business_clearance_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "receipt_or_no" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "collected_by_id" TEXT NOT NULL,
    "remarks" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlotterReport" (
    "tracking_code" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "incident_zone" TEXT,
    "incident_date" DATE NOT NULL,
    "enc_payload" TEXT NOT NULL,
    "enc_iv" TEXT NOT NULL,
    "enc_wrapped_key" TEXT NOT NULL,
    "enc_key_id" TEXT NOT NULL,
    "urgency_level" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "BlotterStatus" NOT NULL DEFAULT 'FILED',
    "assigned_officer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlotterReport_pkey" PRIMARY KEY ("tracking_code")
);

-- CreateTable
CREATE TABLE "BlotterUpdate" (
    "id" TEXT NOT NULL,
    "blotter_tracking_code" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "public_notes" TEXT,
    "internal_notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlotterUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityBroadcast" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "category" "BroadcastCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "simplified_summary" TEXT,
    "audio_script" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangayOfficial" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "committee" TEXT NOT NULL,
    "contact_info" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BarangayOfficial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "session_valid_after" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resident_last_name_first_name_idx" ON "Resident"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "Resident_purok_idx" ON "Resident"("purok");

-- CreateIndex
CREATE INDEX "ResidentCredential_issued_by_id_idx" ON "ResidentCredential"("issued_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "BarangayIDCard_resident_id_key" ON "BarangayIDCard"("resident_id");

-- CreateIndex
CREATE UNIQUE INDEX "BarangayIDCard_card_number_key" ON "BarangayIDCard"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "BarangayIDCard_barcode_data_key" ON "BarangayIDCard"("barcode_data");

-- CreateIndex
CREATE INDEX "BarangayIDCard_card_number_idx" ON "BarangayIDCard"("card_number");

-- CreateIndex
CREATE INDEX "BarangayIDCard_resident_id_idx" ON "BarangayIDCard"("resident_id");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_qr_hash_key" ON "DocumentRequest"("qr_hash");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_client_request_id_key" ON "DocumentRequest"("client_request_id");

-- CreateIndex
CREATE INDEX "DocumentRequest_resident_id_idx" ON "DocumentRequest"("resident_id");

-- CreateIndex
CREATE INDEX "DocumentRequest_status_idx" ON "DocumentRequest"("status");

-- CreateIndex
CREATE INDEX "DocumentRequest_document_type_idx" ON "DocumentRequest"("document_type");

-- CreateIndex
CREATE INDEX "DocumentRequest_reviewed_by_id_idx" ON "DocumentRequest"("reviewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessClearanceEntry_client_request_id_key" ON "BusinessClearanceEntry"("client_request_id");

-- CreateIndex
CREATE INDEX "BusinessClearanceEntry_resident_id_idx" ON "BusinessClearanceEntry"("resident_id");

-- CreateIndex
CREATE INDEX "BusinessClearanceEntry_status_idx" ON "BusinessClearanceEntry"("status");

-- CreateIndex
CREATE INDEX "BusinessClearanceEntry_assessed_by_id_idx" ON "BusinessClearanceEntry"("assessed_by_id");

-- CreateIndex
CREATE INDEX "BusinessChecklistItem_business_id_idx" ON "BusinessChecklistItem"("business_id");

-- CreateIndex
CREATE INDEX "BusinessChecklistItem_verified_by_id_idx" ON "BusinessChecklistItem"("verified_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_document_request_id_key" ON "PaymentRecord"("document_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_business_clearance_id_key" ON "PaymentRecord"("business_clearance_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_receipt_or_no_key" ON "PaymentRecord"("receipt_or_no");

-- CreateIndex
CREATE INDEX "PaymentRecord_collected_by_id_idx" ON "PaymentRecord"("collected_by_id");

-- CreateIndex
CREATE INDEX "PaymentRecord_receipt_or_no_idx" ON "PaymentRecord"("receipt_or_no");

-- CreateIndex
CREATE INDEX "BlotterReport_status_idx" ON "BlotterReport"("status");

-- CreateIndex
CREATE INDEX "BlotterReport_urgency_level_idx" ON "BlotterReport"("urgency_level");

-- CreateIndex
CREATE INDEX "BlotterReport_assigned_officer_id_idx" ON "BlotterReport"("assigned_officer_id");

-- CreateIndex
CREATE INDEX "BlotterUpdate_blotter_tracking_code_idx" ON "BlotterUpdate"("blotter_tracking_code");

-- CreateIndex
CREATE INDEX "BlotterUpdate_recorded_by_id_idx" ON "BlotterUpdate"("recorded_by_id");

-- CreateIndex
CREATE INDEX "CommunityBroadcast_category_idx" ON "CommunityBroadcast"("category");

-- CreateIndex
CREATE INDEX "CommunityBroadcast_is_pinned_idx" ON "CommunityBroadcast"("is_pinned");

-- CreateIndex
CREATE INDEX "CommunityBroadcast_author_id_idx" ON "CommunityBroadcast"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "BarangayOfficial_user_id_key" ON "BarangayOfficial"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_username_key" ON "SystemUser"("username");

-- CreateIndex
CREATE INDEX "SystemUser_username_idx" ON "SystemUser"("username");

-- CreateIndex
CREATE INDEX "SystemUser_role_idx" ON "SystemUser"("role");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_target_entity_target_id_idx" ON "AuditLog"("target_entity", "target_id");

-- AddForeignKey
ALTER TABLE "ResidentCredential" ADD CONSTRAINT "ResidentCredential_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentCredential" ADD CONSTRAINT "ResidentCredential_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayIDCard" ADD CONSTRAINT "BarangayIDCard_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClearanceEntry" ADD CONSTRAINT "BusinessClearanceEntry_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClearanceEntry" ADD CONSTRAINT "BusinessClearanceEntry_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessChecklistItem" ADD CONSTRAINT "BusinessChecklistItem_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "BusinessClearanceEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessChecklistItem" ADD CONSTRAINT "BusinessChecklistItem_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_document_request_id_fkey" FOREIGN KEY ("document_request_id") REFERENCES "DocumentRequest"("tracking_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_business_clearance_id_fkey" FOREIGN KEY ("business_clearance_id") REFERENCES "BusinessClearanceEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_collected_by_id_fkey" FOREIGN KEY ("collected_by_id") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlotterReport" ADD CONSTRAINT "BlotterReport_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlotterUpdate" ADD CONSTRAINT "BlotterUpdate_blotter_tracking_code_fkey" FOREIGN KEY ("blotter_tracking_code") REFERENCES "BlotterReport"("tracking_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlotterUpdate" ADD CONSTRAINT "BlotterUpdate_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBroadcast" ADD CONSTRAINT "CommunityBroadcast_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayOfficial" ADD CONSTRAINT "BarangayOfficial_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "SystemUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "SystemUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
