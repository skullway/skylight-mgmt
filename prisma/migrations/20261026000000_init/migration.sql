-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('OPEN', 'HELD', 'CLOSED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClinicIntegration" AS ENUM ('DEEP_LINK', 'WEB_LOGIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "RoomReservationStatus" AS ENUM ('NOT_STARTED', 'RESERVED', 'FAILED', 'RELEASED');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('APPROVED', 'DENIED', 'CANCELLED', 'REMINDER');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "siteUrl" TEXT,
    "integration" "ClinicIntegration" NOT NULL DEFAULT 'DEEP_LINK',
    "bookingUrlTemplate" TEXT,
    "credentialsEnc" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerNote" TEXT,
    "manageToken" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "denyReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "roomStatus" "RoomReservationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "clinicReservationRef" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "kind" "MessageKind" NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilitySlot_status_startsAt_idx" ON "AvailabilitySlot"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_clinicId_startsAt_key" ON "AvailabilitySlot"("clinicId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_manageToken_key" ON "Appointment"("manageToken");

-- CreateIndex
CREATE INDEX "Appointment_status_slotId_idx" ON "Appointment"("status", "slotId");

-- CreateIndex
CREATE INDEX "Appointment_customerPhone_idx" ON "Appointment"("customerPhone");

-- CreateIndex
CREATE INDEX "MessageLog_appointmentId_kind_idx" ON "MessageLog"("appointmentId", "kind");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
