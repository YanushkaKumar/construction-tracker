-- CreateEnum
CREATE TYPE "BankLoanStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'TERMINATED');

-- AlterTable
ALTER TABLE "project_advances" ADD COLUMN     "bank_loan_id" TEXT;

-- CreateTable
CREATE TABLE "boq_sections" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boq_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boq_items" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "item_no" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "actual_qty" DECIMAL(12,2),
    "actual_amount" DECIMAL(15,2),
    "remarks" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_loans" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "loan_amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "received_date" DATE NOT NULL,
    "status" "BankLoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractors" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "rating" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractor_contracts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "work_scope" TEXT NOT NULL,
    "contract_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "retention_percent" DECIMAL(5,2) NOT NULL DEFAULT 5,
    "start_date" DATE,
    "end_date" DATE,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcontractor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontractor_payments" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "pay_date" DATE NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontractor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boq_sections_project_id_idx" ON "boq_sections"("project_id");

-- CreateIndex
CREATE INDEX "boq_items_section_id_idx" ON "boq_items"("section_id");

-- CreateIndex
CREATE INDEX "boq_items_project_id_idx" ON "boq_items"("project_id");

-- CreateIndex
CREATE INDEX "bank_loans_company_id_idx" ON "bank_loans"("company_id");

-- CreateIndex
CREATE INDEX "bank_loans_status_idx" ON "bank_loans"("status");

-- CreateIndex
CREATE INDEX "subcontractors_company_id_idx" ON "subcontractors"("company_id");

-- CreateIndex
CREATE INDEX "subcontractor_contracts_project_id_idx" ON "subcontractor_contracts"("project_id");

-- CreateIndex
CREATE INDEX "subcontractor_contracts_subcontractor_id_idx" ON "subcontractor_contracts"("subcontractor_id");

-- CreateIndex
CREATE INDEX "subcontractor_payments_contract_id_idx" ON "subcontractor_payments"("contract_id");

-- CreateIndex
CREATE INDEX "project_advances_bank_loan_id_idx" ON "project_advances"("bank_loan_id");

-- AddForeignKey
ALTER TABLE "boq_sections" ADD CONSTRAINT "boq_sections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "boq_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boq_items" ADD CONSTRAINT "boq_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_advances" ADD CONSTRAINT "project_advances_bank_loan_id_fkey" FOREIGN KEY ("bank_loan_id") REFERENCES "bank_loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_loans" ADD CONSTRAINT "bank_loans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_contracts" ADD CONSTRAINT "subcontractor_contracts_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "subcontractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontractor_payments" ADD CONSTRAINT "subcontractor_payments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "subcontractor_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
