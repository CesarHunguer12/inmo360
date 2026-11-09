-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRADOR', 'AGENTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "PropertyModality" AS ENUM ('VENTA', 'ALQUILER', 'ANTICRETICO');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('CASA', 'DEPARTAMENTO', 'TERRENO', 'OFICINA', 'LOCAL_COMERCIAL', 'OTRO');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DISPONIBLE', 'RESERVADA', 'NO_DISPONIBLE', 'INACTIVA');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('NUEVA', 'CONTACTADA', 'INTERESADA', 'VISITA_PROGRAMADA', 'VISITADA', 'NEGOCIACION', 'CONCRETADA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'REPROGRAMADA', 'CANCELADA', 'REALIZADA');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NUEVA', 'EN_ATENCION', 'RESPONDIDA', 'CERRADA');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('REGISTRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDIENTE', 'PAGADA', 'ANULADA');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30),
    "role" "UserRole" NOT NULL DEFAULT 'CLIENTE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(30) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "modality" "PropertyModality" NOT NULL,
    "type" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "price" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BOB',
    "zone" VARCHAR(100) NOT NULL,
    "address" VARCHAR(240) NOT NULL,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "areaM2" DECIMAL(10,2) NOT NULL,
    "hasGarage" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "caption" VARCHAR(200),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPreference" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "minBudget" DECIMAL(14,2),
    "maxBudget" DECIMAL(14,2),
    "zones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modalities" "PropertyModality"[] DEFAULT ARRAY[]::"PropertyModality"[],
    "types" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],
    "minBedrooms" INTEGER,
    "minBathrooms" INTEGER,
    "minAreaM2" DECIMAL(10,2),
    "requiresGarage" BOOLEAN,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "opportunityId" UUID,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NUEVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "opportunityId" UUID,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'NUEVA',
    "lastContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "responsibleId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BOB',
    "status" "OperationStatus" NOT NULL DEFAULT 'REGISTRADA',
    "operatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BOB',
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionConfiguration" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'INMO360',
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "configuredById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Owner_fullName_idx" ON "Owner"("fullName");

-- CreateIndex
CREATE INDEX "Owner_phone_idx" ON "Owner"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE INDEX "Property_status_modality_type_idx" ON "Property"("status", "modality", "type");

-- CreateIndex
CREATE INDEX "Property_zone_price_idx" ON "Property"("zone", "price");

-- CreateIndex
CREATE INDEX "Property_agentId_status_idx" ON "Property"("agentId", "status");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_idx" ON "PropertyImage"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_propertyId_position_key" ON "PropertyImage"("propertyId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ClientPreference_clientId_key" ON "ClientPreference"("clientId");

-- CreateIndex
CREATE INDEX "Favorite_clientId_createdAt_idx" ON "Favorite"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Favorite_propertyId_idx" ON "Favorite"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_clientId_propertyId_key" ON "Favorite"("clientId", "propertyId");

-- CreateIndex
CREATE INDEX "Inquiry_agentId_status_createdAt_idx" ON "Inquiry"("agentId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_clientId_createdAt_idx" ON "Inquiry"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_agentId_status_scheduledAt_idx" ON "Visit"("agentId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Visit_clientId_scheduledAt_idx" ON "Visit"("clientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Visit_propertyId_scheduledAt_idx" ON "Visit"("propertyId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Opportunity_agentId_stage_updatedAt_idx" ON "Opportunity"("agentId", "stage", "updatedAt");

-- CreateIndex
CREATE INDEX "Opportunity_clientId_stage_idx" ON "Opportunity"("clientId", "stage");

-- CreateIndex
CREATE INDEX "Opportunity_propertyId_stage_idx" ON "Opportunity"("propertyId", "stage");

-- CreateIndex
CREATE INDEX "FollowUp_responsibleId_status_dueAt_idx" ON "FollowUp"("responsibleId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_opportunityId_status_idx" ON "FollowUp"("opportunityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_opportunityId_key" ON "Operation"("opportunityId");

-- CreateIndex
CREATE INDEX "Operation_agentId_operatedAt_idx" ON "Operation"("agentId", "operatedAt");

-- CreateIndex
CREATE INDEX "Operation_propertyId_operatedAt_idx" ON "Operation"("propertyId", "operatedAt");

-- CreateIndex
CREATE INDEX "Operation_status_operatedAt_idx" ON "Operation"("status", "operatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_operationId_key" ON "Commission"("operationId");

-- CreateIndex
CREATE INDEX "Commission_agentId_status_createdAt_idx" ON "Commission"("agentId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPreference" ADD CONSTRAINT "ClientPreference_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionConfiguration" ADD CONSTRAINT "CommissionConfiguration_configuredById_fkey" FOREIGN KEY ("configuredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

