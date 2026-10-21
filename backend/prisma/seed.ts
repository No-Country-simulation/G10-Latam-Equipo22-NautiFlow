import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

dotenv.config({ path: ['.env', '../.env'] });

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  if (!adminEmail || !adminPassword) {
    console.warn('Seed omitido: definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el .env.');
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { name: 'Administración NautiFlow', email: adminEmail, passwordHash, role: 'ADMIN' },
    });
    console.log(`Seed listo. Admin: ${admin.email} (${admin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed falló:', error);
  process.exit(1);
});
