-- CreateEnum
CREATE TYPE "EstadoEmbarcacion" AS ENUM ('PENDIENTE', 'VERIFICADA', 'RECHAZADA', 'INACTIVA');

-- CreateTable
CREATE TABLE "zonas" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embarcaciones" (
    "id" UUID NOT NULL,
    "propietarioId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoEmbarcacion" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embarcaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embarcaciones_zonas" (
    "embarcacionId" UUID NOT NULL,
    "zonaId" UUID NOT NULL,

    CONSTRAINT "embarcaciones_zonas_pkey" PRIMARY KEY ("embarcacionId","zonaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nombre_key" ON "zonas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "embarcaciones_matricula_key" ON "embarcaciones"("matricula");

-- AddForeignKey
ALTER TABLE "embarcaciones" ADD CONSTRAINT "embarcaciones_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embarcaciones_zonas" ADD CONSTRAINT "embarcaciones_zonas_embarcacionId_fkey" FOREIGN KEY ("embarcacionId") REFERENCES "embarcaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embarcaciones_zonas" ADD CONSTRAINT "embarcaciones_zonas_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
