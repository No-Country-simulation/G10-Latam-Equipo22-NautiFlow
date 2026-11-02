-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "reservas" (
    "id" UUID NOT NULL,
    "tramoId" UUID NOT NULL,
    "salidaId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "cantidadPasajeros" INTEGER NOT NULL,
    "mensaje" TEXT,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "precioCentavos" INTEGER NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "cupoDescontado" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "tripId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservas_tripId_key" ON "reservas"("tripId");

-- CreateIndex
CREATE INDEX "reservas_estado_createdAt_idx" ON "reservas"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "reservas_tramoId_estado_idx" ON "reservas"("tramoId", "estado");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_tramoId_fkey" FOREIGN KEY ("tramoId") REFERENCES "tramos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_salidaId_fkey" FOREIGN KEY ("salidaId") REFERENCES "salidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
