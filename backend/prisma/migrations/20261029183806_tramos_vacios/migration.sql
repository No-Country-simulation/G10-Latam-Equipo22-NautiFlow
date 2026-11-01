-- CreateEnum
CREATE TYPE "EmptyLegStatus" AS ENUM ('AVAILABLE', 'OFFERED', 'ASSIGNED', 'CLOSED');

-- CreateTable
CREATE TABLE "empty_legs" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "embarcacionId" UUID NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "EmptyLegStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empty_legs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empty_legs_status_scheduledAt_idx" ON "empty_legs"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "empty_legs_tripId_idx" ON "empty_legs"("tripId");

-- AddForeignKey
ALTER TABLE "empty_legs" ADD CONSTRAINT "empty_legs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empty_legs" ADD CONSTRAINT "empty_legs_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "embarcaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
