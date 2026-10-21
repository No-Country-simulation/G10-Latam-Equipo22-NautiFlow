import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 no carga .env solo; probamos backend/.env y el .env de la raíz.
dotenv.config({ path: ['.env', '../.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
