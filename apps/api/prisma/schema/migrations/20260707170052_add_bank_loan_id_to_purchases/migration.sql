-- CreateEnum
CREATE TYPE "FundingSourceType" AS ENUM ('PROJECT_ADVANCE', 'BANK_LOAN', 'COMPANY_CASH', 'OWNER_CAPITAL', 'EMERGENCY_LOAN', 'EQUIPMENT_LOAN', 'VEHICLE_LOAN', 'SUPPLIER_CREDIT');

-- CreateEnum
CREATE TYPE "FundingSourceStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DEPLETED');

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "bank_loan_id" TEXT;

-- CreateTable
CREATE TABLE "bank_loan_repayments" (
    "id" TEXT NOT NULL,
    "bank_loan_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "reference_no" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_sources" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "FundingSourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "current_balance" DECIMAL(15,2) NOT NULL,
    "original_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "status" "FundingSourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "project_id" TEXT,
    "project_advance_id" TEXT,
    "bank_loan_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_allocations" (
    "id" TEXT NOT NULL,
    "funding_source_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "expense_id" TEXT,
    "purchase_id" TEXT,
    "asset_id" TEXT,
    "attendance_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_loan_repayments_bank_loan_id_idx" ON "bank_loan_repayments"("bank_loan_id");

-- CreateIndex
CREATE UNIQUE INDEX "funding_sources_project_advance_id_key" ON "funding_sources"("project_advance_id");

-- CreateIndex
CREATE UNIQUE INDEX "funding_sources_bank_loan_id_key" ON "funding_sources"("bank_loan_id");

-- CreateIndex
CREATE INDEX "funding_sources_company_id_idx" ON "funding_sources"("company_id");

-- CreateIndex
CREATE INDEX "funding_sources_project_id_idx" ON "funding_sources"("project_id");

-- CreateIndex
CREATE INDEX "funding_allocations_funding_source_id_idx" ON "funding_allocations"("funding_source_id");

-- CreateIndex
CREATE INDEX "funding_allocations_expense_id_idx" ON "funding_allocations"("expense_id");

-- CreateIndex
CREATE INDEX "funding_allocations_purchase_id_idx" ON "funding_allocations"("purchase_id");

-- CreateIndex
CREATE INDEX "funding_allocations_asset_id_idx" ON "funding_allocations"("asset_id");

-- CreateIndex
CREATE INDEX "funding_allocations_attendance_id_idx" ON "funding_allocations"("attendance_id");

-- CreateIndex
CREATE INDEX "purchases_bank_loan_id_idx" ON "purchases"("bank_loan_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_bank_loan_id_fkey" FOREIGN KEY ("bank_loan_id") REFERENCES "bank_loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_loan_repayments" ADD CONSTRAINT "bank_loan_repayments_bank_loan_id_fkey" FOREIGN KEY ("bank_loan_id") REFERENCES "bank_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_sources" ADD CONSTRAINT "funding_sources_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_sources" ADD CONSTRAINT "funding_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_sources" ADD CONSTRAINT "funding_sources_project_advance_id_fkey" FOREIGN KEY ("project_advance_id") REFERENCES "project_advances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_sources" ADD CONSTRAINT "funding_sources_bank_loan_id_fkey" FOREIGN KEY ("bank_loan_id") REFERENCES "bank_loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_allocations" ADD CONSTRAINT "funding_allocations_funding_source_id_fkey" FOREIGN KEY ("funding_source_id") REFERENCES "funding_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_allocations" ADD CONSTRAINT "funding_allocations_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_allocations" ADD CONSTRAINT "funding_allocations_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_allocations" ADD CONSTRAINT "funding_allocations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_allocations" ADD CONSTRAINT "funding_allocations_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
