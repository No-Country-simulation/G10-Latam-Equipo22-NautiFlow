-- Nomenclatura D-010: unifica en español las tablas, columnas y tipos de enum legados.
-- Solo renombra objetos en la base de datos (coincide con @@map/@map en schema.prisma);
-- el cliente Prisma y el código TypeScript no cambian.

-- 1) Tipos de enum
ALTER TYPE "Role" RENAME TO "Rol";
ALTER TYPE "UserStatus" RENAME TO "EstadoUsuario";
ALTER TYPE "OwnerStatus" RENAME TO "EstadoLanchero";
ALTER TYPE "DocumentType" RENAME TO "TipoDocumento";
ALTER TYPE "DocumentStatus" RENAME TO "EstadoDocumento";
ALTER TYPE "TripStatus" RENAME TO "EstadoViaje";
ALTER TYPE "EmptyLegStatus" RENAME TO "EstadoTramoVacio";

-- 2) Tablas
ALTER TABLE "users" RENAME TO "usuarios";
ALTER TABLE "owners" RENAME TO "lancheros";
ALTER TABLE "owner_documents" RENAME TO "documentos_lanchero";
ALTER TABLE "trips" RENAME TO "viajes";
ALTER TABLE "empty_legs" RENAME TO "tramos_vacios";
ALTER TABLE "review_tokens" RENAME TO "tokens_resena";
ALTER TABLE "reviews" RENAME TO "resenas";

-- 3) Columnas
ALTER TABLE "usuarios" RENAME COLUMN "name" TO "nombre";
ALTER TABLE "usuarios" RENAME COLUMN "role" TO "rol";
ALTER TABLE "usuarios" RENAME COLUMN "status" TO "estado";

ALTER TABLE "lancheros" RENAME COLUMN "userId" TO "usuarioId";
ALTER TABLE "lancheros" RENAME COLUMN "phone" TO "telefono";
ALTER TABLE "lancheros" RENAME COLUMN "whatsappPhone" TO "whatsappTelefono";
ALTER TABLE "lancheros" RENAME COLUMN "status" TO "estado";
ALTER TABLE "lancheros" RENAME COLUMN "reviewNote" TO "notaRevision";

ALTER TABLE "documentos_lanchero" RENAME COLUMN "ownerId" TO "lancheroId";
ALTER TABLE "documentos_lanchero" RENAME COLUMN "boatId" TO "embarcacionId";
ALTER TABLE "documentos_lanchero" RENAME COLUMN "type" TO "tipo";
ALTER TABLE "documentos_lanchero" RENAME COLUMN "status" TO "estado";
ALTER TABLE "documentos_lanchero" RENAME COLUMN "filename" TO "nombreArchivo";
ALTER TABLE "documentos_lanchero" RENAME COLUMN "reviewNote" TO "notaRevision";

ALTER TABLE "viajes" RENAME COLUMN "scheduledAt" TO "fechaHora";
ALTER TABLE "viajes" RENAME COLUMN "passengerCount" TO "cantidadPasajeros";
ALTER TABLE "viajes" RENAME COLUMN "origin" TO "origen";
ALTER TABLE "viajes" RENAME COLUMN "destination" TO "destino";
ALTER TABLE "viajes" RENAME COLUMN "status" TO "estado";

ALTER TABLE "tramos_vacios" RENAME COLUMN "tripId" TO "viajeId";
ALTER TABLE "tramos_vacios" RENAME COLUMN "origin" TO "origen";
ALTER TABLE "tramos_vacios" RENAME COLUMN "destination" TO "destino";
ALTER TABLE "tramos_vacios" RENAME COLUMN "scheduledAt" TO "fechaHora";
ALTER TABLE "tramos_vacios" RENAME COLUMN "status" TO "estado";

ALTER TABLE "tokens_resena" RENAME COLUMN "tripId" TO "viajeId";

ALTER TABLE "resenas" RENAME COLUMN "tripId" TO "viajeId";
ALTER TABLE "resenas" RENAME COLUMN "rating" TO "puntuacion";
ALTER TABLE "resenas" RENAME COLUMN "comment" TO "comentario";

-- 4) Constraints (primary keys y foreign keys)
ALTER TABLE "usuarios" RENAME CONSTRAINT "users_pkey" TO "usuarios_pkey";
ALTER TABLE "lancheros" RENAME CONSTRAINT "owners_pkey" TO "lancheros_pkey";
ALTER TABLE "documentos_lanchero" RENAME CONSTRAINT "owner_documents_pkey" TO "documentos_lanchero_pkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_pkey" TO "viajes_pkey";
ALTER TABLE "tramos_vacios" RENAME CONSTRAINT "empty_legs_pkey" TO "tramos_vacios_pkey";
ALTER TABLE "tokens_resena" RENAME CONSTRAINT "review_tokens_pkey" TO "tokens_resena_pkey";
ALTER TABLE "resenas" RENAME CONSTRAINT "reviews_pkey" TO "resenas_pkey";

ALTER TABLE "lancheros" RENAME CONSTRAINT "owners_userId_fkey" TO "lancheros_usuarioId_fkey";
ALTER TABLE "lancheros" RENAME CONSTRAINT "owners_reviewedById_fkey" TO "lancheros_reviewedById_fkey";
ALTER TABLE "documentos_lanchero" RENAME CONSTRAINT "owner_documents_ownerId_fkey" TO "documentos_lanchero_lancheroId_fkey";
ALTER TABLE "documentos_lanchero" RENAME CONSTRAINT "owner_documents_boatId_fkey" TO "documentos_lanchero_embarcacionId_fkey";
ALTER TABLE "documentos_lanchero" RENAME CONSTRAINT "owner_documents_reviewedById_fkey" TO "documentos_lanchero_reviewedById_fkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_clienteId_fkey" TO "viajes_clienteId_fkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_createdById_fkey" TO "viajes_createdById_fkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_embarcacionId_fkey" TO "viajes_embarcacionId_fkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_salidaId_fkey" TO "viajes_salidaId_fkey";
ALTER TABLE "viajes" RENAME CONSTRAINT "trips_tramoId_fkey" TO "viajes_tramoId_fkey";
ALTER TABLE "tramos_vacios" RENAME CONSTRAINT "empty_legs_tripId_fkey" TO "tramos_vacios_viajeId_fkey";
ALTER TABLE "tramos_vacios" RENAME CONSTRAINT "empty_legs_embarcacionId_fkey" TO "tramos_vacios_embarcacionId_fkey";
ALTER TABLE "tokens_resena" RENAME CONSTRAINT "review_tokens_tripId_fkey" TO "tokens_resena_viajeId_fkey";
ALTER TABLE "resenas" RENAME CONSTRAINT "reviews_tripId_fkey" TO "resenas_viajeId_fkey";
ALTER TABLE "resenas" RENAME CONSTRAINT "reviews_embarcacionId_fkey" TO "resenas_embarcacionId_fkey";

ALTER TABLE "resenas" RENAME CONSTRAINT "reviews_rating_check" TO "resenas_puntuacion_check";

-- 5) Índices
ALTER INDEX "users_email_key" RENAME TO "usuarios_email_key";
ALTER INDEX "owners_userId_key" RENAME TO "lancheros_usuarioId_key";
ALTER INDEX "review_tokens_tokenHash_key" RENAME TO "tokens_resena_tokenHash_key";
ALTER INDEX "review_tokens_tripId_key" RENAME TO "tokens_resena_viajeId_key";
ALTER INDEX "reviews_tripId_key" RENAME TO "resenas_viajeId_key";

ALTER INDEX "empty_legs_status_scheduledAt_idx" RENAME TO "tramos_vacios_estado_fechaHora_idx";
ALTER INDEX "empty_legs_tripId_idx" RENAME TO "tramos_vacios_viajeId_idx";
ALTER INDEX "owner_documents_boatId_type_idx" RENAME TO "documentos_lanchero_embarcacionId_tipo_idx";
ALTER INDEX "owner_documents_ownerId_type_idx" RENAME TO "documentos_lanchero_lancheroId_tipo_idx";
ALTER INDEX "trips_embarcacionId_scheduledAt_idx" RENAME TO "viajes_embarcacionId_fechaHora_idx";
ALTER INDEX "trips_status_scheduledAt_idx" RENAME TO "viajes_estado_fechaHora_idx";
ALTER INDEX "trips_tramoId_idx" RENAME TO "viajes_tramoId_idx";
