-- CreateEnum
CREATE TYPE "EstadoSalida" AS ENUM ('PROGRAMADA', 'CANCELADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "EstadoTramo" AS ENUM ('DISPONIBLE', 'RESERVADO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoTramo" AS ENUM ('IDA', 'VUELTA');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "salidaId" UUID,
ADD COLUMN     "tramoId" UUID;

-- CreateTable
CREATE TABLE "salidas" (
    "id" UUID NOT NULL,
    "embarcacionId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoSalida" NOT NULL DEFAULT 'PROGRAMADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramos" (
    "id" UUID NOT NULL,
    "salidaId" UUID NOT NULL,
    "tipo" "TipoTramo" NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "cupo" INTEGER NOT NULL,
    "precioCentavos" INTEGER NOT NULL,
    "sinTuristas" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoTramo" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salidas_estado_fechaSalida_idx" ON "salidas"("estado", "fechaSalida");

-- CreateIndex
CREATE INDEX "tramos_salidaId_tipo_idx" ON "tramos"("salidaId", "tipo");

-- CreateIndex
CREATE INDEX "tramos_estado_fechaHora_idx" ON "tramos"("estado", "fechaHora");

-- CreateIndex
CREATE INDEX "trips_tramoId_idx" ON "trips"("tramoId");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "salidas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_tramoId_fkey" FOREIGN KEY ("tramoId") REFERENCES "tramos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "embarcaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salidas" ADD CONSTRAINT "salidas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramos" ADD CONSTRAINT "tramos_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "salidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
