ALTER TYPE "Role" ADD VALUE 'CLIENT';

ALTER TABLE "clientes" ADD COLUMN "userId" UUID;

CREATE UNIQUE INDEX "clientes_userId_key" ON "clientes"("userId");

ALTER TABLE "clientes"
ADD CONSTRAINT "clientes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;